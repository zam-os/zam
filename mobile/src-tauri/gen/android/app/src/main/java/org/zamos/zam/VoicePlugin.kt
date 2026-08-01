package org.zamos.zam

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import kotlin.math.log10
import kotlin.math.sqrt

/**
 * Capture parameters for the cloud speech tier. 16 kHz mono PCM is what hosted
 * recognizers want and the smallest upload that loses nothing; the timings
 * mirror the desktop and iOS recorders so an answer ends at the same point on
 * every platform.
 */
private const val CAPTURE_SAMPLE_RATE = 16_000
private const val CAPTURE_THRESHOLD_DB = -35.0
private const val CAPTURE_TRAILING_SILENCE_MS = 1_200L
private const val CAPTURE_ONSET_TIMEOUT_MS = 8_000L
private const val CAPTURE_MAX_MS = 30_000L

@InvokeArg
class VoiceLocaleArgs {
  lateinit var locale: String
}

@InvokeArg
class VoiceSpeakArgs {
  lateinit var text: String
  lateinit var locale: String
}

@InvokeArg
class VoicePlayArgs {
  lateinit var audioBase64: String
  lateinit var mime: String
}

@TauriPlugin(
  permissions = [
    Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "microphone"),
  ],
)
class VoicePlugin(private val activity: Activity) : Plugin(activity) {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val audioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()
  private val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
    .setAudioAttributes(audioAttributes)
    .setAcceptsDelayedFocusGain(true)
    .setWillPauseWhenDucked(true)
    .setOnAudioFocusChangeListener({ change ->
      mainHandler.post { handleAudioFocusChange(change) }
    }, mainHandler)
    .build()

  private var textToSpeech: TextToSpeech? = null
  private var textToSpeechReady = false
  private var textToSpeechError: String? = null
  private var voiceDataInstallRequested = false
  private var speechRecognizer: SpeechRecognizer? = null
  private var recognitionGeneration = 0L
  private var utteranceGeneration = 0L
  private var currentUtteranceId: String? = null

  private var active = false
  private var focusGranted = false
  private var pausedForFocus = false
  private var pendingStart: Invoke? = null
  private var pendingSpeak: Invoke? = null
  private var pendingSpeakText: String? = null
  private var pendingSpeakLocale: String? = null
  private var pendingListen: Invoke? = null
  private var pendingListenLocale: String? = null
  private var pendingCapture: Invoke? = null
  private var captureThread: Thread? = null
  @Volatile private var captureCancelled = false
  private var mediaPlayer: MediaPlayer? = null
  private var pendingPlay: Invoke? = null

  /**
   * True while any speech operation owns the microphone or the speaker. Two
   * overlapping operations would fight over the same audio focus, and the
   * second one's promise would never settle.
   */
  private val busy: Boolean
    get() = pendingSpeak != null || pendingListen != null ||
      pendingCapture != null || pendingPlay != null

  override fun load(webView: WebView) {
    super.load(webView)
    activity.runOnUiThread { initializeTextToSpeech() }
  }

  private fun initializeTextToSpeech() {
    if (textToSpeech != null) return
    textToSpeech = TextToSpeech(activity.applicationContext) { status ->
      // Android permits an immediate init callback before the constructor returns.
      mainHandler.post { finishTextToSpeechInitialization(status) }
    }
  }

  private fun finishTextToSpeechInitialization(status: Int) {
    val engine = textToSpeech
    if (status != TextToSpeech.SUCCESS || engine == null) {
      textToSpeechError = "Lokale Sprachausgabe konnte nicht initialisiert werden"
      rejectPendingSpeak(textToSpeechError!!)
      return
    }
    engine.setAudioAttributes(audioAttributes)
    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String) = Unit

      override fun onDone(utteranceId: String) {
        mainHandler.post { completeUtterance(utteranceId) }
      }

      @Deprecated("Deprecated in Android")
      override fun onError(utteranceId: String) {
        mainHandler.post { failUtterance(utteranceId, "Sprachausgabe fehlgeschlagen") }
      }

      override fun onError(utteranceId: String, errorCode: Int) {
        mainHandler.post {
          failUtterance(utteranceId, textToSpeechError(errorCode))
        }
      }

      override fun onStop(utteranceId: String, interrupted: Boolean) {
        mainHandler.post {
          if (!pausedForFocus) {
            failUtterance(utteranceId, "Sprachausgabe wurde unterbrochen")
          }
        }
      }
    })
    textToSpeechReady = true
    startPendingOperation()
  }

  private fun locale(tag: String): Locale {
    val requested = Locale.forLanguageTag(tag)
    return if (requested.language.equals("en", ignoreCase = true)) {
      Locale.US
    } else {
      Locale.GERMANY
    }
  }

  private fun selectEmbeddedVoice(tag: String): Boolean {
    val engine = textToSpeech ?: return false
    val requested = locale(tag)
    val localVoices = engine.voices.orEmpty().filter {
      !it.isNetworkConnectionRequired &&
        !it.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) &&
        it.locale.language == requested.language
    }
    val selected = localVoices.firstOrNull { it.locale.country == requested.country }
      ?: localVoices.firstOrNull()
      ?: return false
    return engine.setVoice(selected) == TextToSpeech.SUCCESS
  }

  private fun startPendingOperation() {
    if (!active || !focusGranted || pausedForFocus) return
    when {
      pendingSpeak != null -> startSpeaking()
      pendingListen != null -> startListening()
    }
  }

  private fun startSpeaking() {
    val invoke = pendingSpeak ?: return
    val text = pendingSpeakText ?: return
    val tag = pendingSpeakLocale ?: "de-DE"
    if (!textToSpeechReady) {
      textToSpeechError?.let { rejectPendingSpeak(it) }
      return
    }
    if (!selectEmbeddedVoice(tag)) {
      rejectPendingSpeak("Keine installierte lokale TTS-Stimme für ${locale(tag).displayLanguage}")
      return
    }
    val id = "zam-voice-${++utteranceGeneration}"
    currentUtteranceId = id
    val result = textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, Bundle(), id)
    if (result != TextToSpeech.SUCCESS) {
      currentUtteranceId = null
      pendingSpeak = null
      pendingSpeakText = null
      pendingSpeakLocale = null
      invoke.reject("Sprachausgabe konnte nicht gestartet werden")
    }
  }

  private fun completeUtterance(utteranceId: String) {
    if (utteranceId != currentUtteranceId) return
    currentUtteranceId = null
    val invoke = pendingSpeak
    pendingSpeak = null
    pendingSpeakText = null
    pendingSpeakLocale = null
    invoke?.resolve()
  }

  private fun failUtterance(utteranceId: String, message: String) {
    if (utteranceId != currentUtteranceId) return
    currentUtteranceId = null
    rejectPendingSpeak(message)
  }

  private fun rejectPendingSpeak(message: String) {
    currentUtteranceId = null
    val invoke = pendingSpeak
    pendingSpeak = null
    pendingSpeakText = null
    pendingSpeakLocale = null
    invoke?.reject(message)
  }

  private fun textToSpeechError(error: Int): String = when (error) {
    TextToSpeech.ERROR_NOT_INSTALLED_YET -> "Lokale TTS-Sprachdaten sind nicht installiert"
    TextToSpeech.ERROR_NETWORK,
    TextToSpeech.ERROR_NETWORK_TIMEOUT,
    -> "Die gewählte TTS-Stimme ist nicht vollständig lokal verfügbar"
    TextToSpeech.ERROR_OUTPUT -> "Audioausgabe für TTS ist nicht verfügbar"
    TextToSpeech.ERROR_SERVICE -> "Android-Sprachausgabe ist nicht verfügbar"
    TextToSpeech.ERROR_SYNTHESIS -> "Lokale Sprachsynthese ist fehlgeschlagen"
    else -> "Sprachausgabe fehlgeschlagen ($error)"
  }

  private fun recognitionIntent(tag: String): Intent =
    Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale(tag).toLanguageTag())
      putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
    }

  private fun startListening() {
    val invoke = pendingListen ?: return
    val tag = pendingListenLocale ?: "de-DE"
    if (!SpeechRecognizer.isOnDeviceRecognitionAvailable(activity)) {
      pendingListen = null
      pendingListenLocale = null
      invoke.reject("Lokale Spracherkennung ist auf diesem Gerät nicht verfügbar")
      return
    }

    destroyRecognizer()
    val generation = ++recognitionGeneration
    try {
      val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(activity)
      speechRecognizer = recognizer
      recognizer.setRecognitionListener(listener(generation))
      recognizer.startListening(recognitionIntent(tag))
    } catch (error: Exception) {
      destroyRecognizer()
      pendingListen = null
      pendingListenLocale = null
      invoke.reject(error.message ?: "Lokale Spracherkennung konnte nicht gestartet werden")
    }
  }

  private fun listener(generation: Long): RecognitionListener =
    object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) = Unit
      override fun onBeginningOfSpeech() = Unit
      override fun onRmsChanged(rmsdB: Float) = Unit
      override fun onBufferReceived(buffer: ByteArray?) = Unit
      override fun onEndOfSpeech() = Unit
      override fun onPartialResults(partialResults: Bundle?) = Unit
      override fun onEvent(eventType: Int, params: Bundle?) = Unit

      override fun onError(error: Int) {
        mainHandler.post { failRecognition(generation, error) }
      }

      override fun onResults(results: Bundle?) {
        mainHandler.post { completeRecognition(generation, results) }
      }
    }

  private fun completeRecognition(generation: Long, results: Bundle?) {
    if (generation != recognitionGeneration || pausedForFocus) return
    val transcripts = results
      ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
      .orEmpty()
    val transcript = transcripts.firstOrNull { it.isNotBlank() }?.trim()
    val invoke = pendingListen
    pendingListen = null
    pendingListenLocale = null
    destroyRecognizer()
    if (transcript == null) {
      invoke?.reject("Keine Sprache erkannt")
      return
    }
    val response = JSObject()
    response.put("transcript", transcript)
    invoke?.resolve(response)
  }

  private fun failRecognition(generation: Long, error: Int) {
    if (generation != recognitionGeneration || pausedForFocus) return
    val invoke = pendingListen
    pendingListen = null
    pendingListenLocale = null
    destroyRecognizer()
    invoke?.reject(recognitionError(error))
  }

  private fun hasRecordAudioPermission(): Boolean =
    ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) ==
      PackageManager.PERMISSION_GRANTED

  private fun microphoneStatePayload(): JSObject {
    val state =
      if (hasRecordAudioPermission() || getPermissionState("microphone") == PermissionState.GRANTED) {
        "granted"
      } else {
        getPermissionState("microphone")?.toString() ?: "prompt"
      }
    val result = JSObject()
    result.put("microphone", state)
    return result
  }

  private fun recognitionError(error: Int): String = when (error) {
    SpeechRecognizer.ERROR_AUDIO -> "Mikrofonfehler"
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ->
      "Mikrofonberechtigung fehlt — bitte in den App-Einstellungen erlauben"
    SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED -> "Sprache wird lokal nicht unterstützt"
    SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "Lokales Sprachmodell ist nicht heruntergeladen"
    SpeechRecognizer.ERROR_NETWORK,
    SpeechRecognizer.ERROR_NETWORK_TIMEOUT,
    -> "Lokale Spracherkennung ist offline nicht verfügbar"
    SpeechRecognizer.ERROR_NO_MATCH,
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT,
    -> "Keine Sprache erkannt"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Spracherkennung ist beschäftigt"
    SpeechRecognizer.ERROR_SERVER_DISCONNECTED -> "Lokale Spracherkennung wurde getrennt"
    else -> "Spracherkennung fehlgeschlagen ($error)"
  }

  private fun destroyRecognizer() {
    recognitionGeneration += 1
    speechRecognizer?.cancel()
    speechRecognizer?.destroy()
    speechRecognizer = null
  }

  private fun pauseForTransientFocusLoss() {
    if (!active || pausedForFocus) return
    pausedForFocus = true
    focusGranted = false
    currentUtteranceId = null
    textToSpeech?.stop()
    destroyRecognizer()
  }

  private fun resumeAfterFocusGain() {
    if (!active) return
    focusGranted = true
    pausedForFocus = false
    pendingStart?.resolve()
    pendingStart = null
    startPendingOperation()
  }

  private fun handleAudioFocusChange(change: Int) {
    when (change) {
      AudioManager.AUDIOFOCUS_GAIN -> resumeAfterFocusGain()
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK,
      -> pauseForTransientFocusLoss()
      AudioManager.AUDIOFOCUS_LOSS -> abortSession("Audiofokus verloren; Sprachmodus pausiert")
    }
  }

  private fun abortSession(message: String) {
    active = false
    focusGranted = false
    pausedForFocus = false
    currentUtteranceId = null
    textToSpeech?.stop()
    destroyRecognizer()
    pendingStart?.reject(message)
    pendingStart = null
    rejectPendingSpeak(message)
    pendingListen?.reject(message)
    pendingListen = null
    pendingListenLocale = null
    cancelCapture(message)
    stopPlayback(message)
    audioManager.abandonAudioFocusRequest(focusRequest)
    activity.stopService(Intent(activity, VoiceSessionService::class.java))
  }

  /** Prefer the platform PackageManager state over Tauri's cached alias map. */
  @Command
  override fun checkPermissions(invoke: Invoke) {
    invoke.resolve(microphoneStatePayload())
  }

  /**
   * Override so an empty/null invoke body cannot NPE Tauri's default parser
   * (seen on Pixel when the Rust side passed `()`).
   */
  @Command
  override fun requestPermissions(invoke: Invoke) {
    activity.runOnUiThread {
      if (hasRecordAudioPermission()) {
        invoke.resolve(microphoneStatePayload())
        return@runOnUiThread
      }
      requestPermissionForAlias("microphone", invoke, "microphonePermissionCallback")
    }
  }

  @PermissionCallback
  private fun microphonePermissionCallback(invoke: Invoke) {
    invoke.resolve(microphoneStatePayload())
  }

  @Command
  fun openAppSettings(invoke: Invoke) {
    activity.runOnUiThread {
      try {
        val intent = Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.fromParts("package", activity.packageName, null),
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        activity.startActivity(intent)
        invoke.resolve()
      } catch (error: Exception) {
        invoke.reject(error.message ?: "App-Einstellungen konnten nicht geöffnet werden")
      }
    }
  }

  @Command
  fun start(invoke: Invoke) {
    val args = invoke.parseArgs(VoiceLocaleArgs::class.java)
    activity.runOnUiThread {
      if (!hasRecordAudioPermission()) {
        invoke.reject("Mikrofonberechtigung fehlt")
        return@runOnUiThread
      }
      if (!SpeechRecognizer.isOnDeviceRecognitionAvailable(activity)) {
        invoke.reject("Lokale Spracherkennung ist auf diesem Gerät nicht verfügbar")
        return@runOnUiThread
      }
      if (active) {
        invoke.resolve()
        return@runOnUiThread
      }
      // Parse now so malformed locale input cannot surface during a background turn.
      locale(args.locale)
      try {
        activity.startForegroundService(Intent(activity, VoiceSessionService::class.java))
        active = true
        pendingStart = invoke
        when (audioManager.requestAudioFocus(focusRequest)) {
          AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> resumeAfterFocusGain()
          AudioManager.AUDIOFOCUS_REQUEST_DELAYED -> {
            pausedForFocus = true
          }
          else -> abortSession("Audiofokus konnte nicht übernommen werden")
        }
      } catch (error: Exception) {
        active = false
        activity.stopService(Intent(activity, VoiceSessionService::class.java))
        invoke.reject(error.message ?: "Sprachmodus konnte nicht gestartet werden")
      }
    }
  }

  @Command
  fun stop(invoke: Invoke) {
    activity.runOnUiThread {
      abortSession("Sprachmodus beendet")
      invoke.resolve()
    }
  }

  @Command
  fun speak(invoke: Invoke) {
    val args = invoke.parseArgs(VoiceSpeakArgs::class.java)
    activity.runOnUiThread {
      if (!active) {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return@runOnUiThread
      }
      if (busy) {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return@runOnUiThread
      }
      if (args.text.isBlank()) {
        invoke.reject("Vorlesetext ist leer")
        return@runOnUiThread
      }
      pendingSpeak = invoke
      pendingSpeakText = args.text
      pendingSpeakLocale = args.locale
      startPendingOperation()
    }
  }

  @Command
  fun listen(invoke: Invoke) {
    val args = invoke.parseArgs(VoiceLocaleArgs::class.java)
    activity.runOnUiThread {
      if (!active) {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return@runOnUiThread
      }
      if (busy) {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return@runOnUiThread
      }
      pendingListen = invoke
      pendingListenLocale = args.locale
      startPendingOperation()
    }
  }

  /**
   * What this device can serve locally for one review language, so the surface
   * can resolve the learner's engine preference without guessing.
   *
   * Text-to-speech is answered by asking for an *embedded* voice: a
   * network-only voice would make the device tier's promise false.
   */
  @Command
  fun capabilities(invoke: Invoke) {
    val args = invoke.parseArgs(VoiceLocaleArgs::class.java)
    activity.runOnUiThread {
      val requested = locale(args.locale)
      val ttsLocal = textToSpeech?.voices.orEmpty().any {
        !it.isNetworkConnectionRequired &&
          !it.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) &&
          it.locale.language == requested.language
      }
      val payload = JSObject()
      payload.put("sttLocal", SpeechRecognizer.isOnDeviceRecognitionAvailable(activity))
      payload.put("ttsLocal", ttsLocal)
      invoke.resolve(payload)
    }
  }

  /**
   * Record one answer and hand back the audio rather than a transcript, for a
   * paired cloud recognizer.
   *
   * Deliberately the same microphone contract as `listen`: same onset window,
   * same trailing silence, same hard cap. The learner's preference decides who
   * turns the audio into text, and nothing else about the interaction changes
   * with it.
   *
   * `AudioRecord` rather than `MediaRecorder`: the loop needs the raw samples
   * both to measure loudness and to emit 16 kHz mono PCM, which is what a
   * hosted recognizer wants and the smallest upload that loses nothing.
   */
  @Command
  fun capture(invoke: Invoke) {
    invoke.parseArgs(VoiceLocaleArgs::class.java)
    activity.runOnUiThread {
      if (!active) {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return@runOnUiThread
      }
      if (busy) {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return@runOnUiThread
      }
      if (!hasRecordAudioPermission()) {
        invoke.reject("Mikrofonberechtigung fehlt")
        return@runOnUiThread
      }
      pendingCapture = invoke
      captureCancelled = false
      val thread = Thread { runCapture() }
      captureThread = thread
      thread.start()
    }
  }

  /** Runs off the UI thread: reading from AudioRecord blocks by design. */
  private fun runCapture() {
    val minBuffer = AudioRecord.getMinBufferSize(
      CAPTURE_SAMPLE_RATE,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
    )
    if (minBuffer <= 0) {
      finishCapture(null, "Das Mikrofon konnte nicht geöffnet werden")
      return
    }
    val record = try {
      AudioRecord(
        MediaRecorder.AudioSource.VOICE_RECOGNITION,
        CAPTURE_SAMPLE_RATE,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        minBuffer * 2,
      )
    } catch (error: SecurityException) {
      finishCapture(null, error.message ?: "Mikrofonberechtigung fehlt")
      return
    }
    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      finishCapture(null, "Das Mikrofon konnte nicht geöffnet werden")
      return
    }

    val samples = ByteArrayOutputStream()
    val buffer = ShortArray(minBuffer / 2)
    var started = false
    var silenceSince = 0L
    val begin = System.currentTimeMillis()
    try {
      record.startRecording()
      while (!captureCancelled) {
        val read = record.read(buffer, 0, buffer.size)
        if (read <= 0) break
        val now = System.currentTimeMillis()
        if (loudnessDb(buffer, read) > CAPTURE_THRESHOLD_DB) {
          started = true
          silenceSince = 0L
        } else if (started) {
          if (silenceSince == 0L) silenceSince = now
          if (now - silenceSince >= CAPTURE_TRAILING_SILENCE_MS) break
        }
        // Everything up to the cut-off is still worth transcribing, so the
        // samples are kept before the loop decides whether to stop.
        for (i in 0 until read) {
          samples.write(buffer[i].toInt() and 0xff)
          samples.write((buffer[i].toInt() shr 8) and 0xff)
        }
        if (!started && now - begin >= CAPTURE_ONSET_TIMEOUT_MS) {
          finishCaptureAfter(record, null, "Keine Sprache erkannt")
          return
        }
        if (now - begin >= CAPTURE_MAX_MS) break
      }
    } catch (error: IllegalStateException) {
      finishCaptureAfter(record, null, error.message ?: "Aufnahme fehlgeschlagen")
      return
    }

    if (captureCancelled) {
      finishCaptureAfter(record, null, null)
      return
    }
    val pcm = samples.toByteArray()
    if (!started || pcm.isEmpty()) {
      finishCaptureAfter(record, null, "Keine Sprache erkannt")
      return
    }
    finishCaptureAfter(record, wavContainer(pcm), null)
  }

  private fun finishCaptureAfter(record: AudioRecord, wav: ByteArray?, error: String?) {
    try {
      if (record.recordingState == AudioRecord.RECORDSTATE_RECORDING) record.stop()
    } catch (_: IllegalStateException) {
      // Already stopped; the release below is what matters.
    }
    record.release()
    finishCapture(wav, error)
  }

  private fun finishCapture(wav: ByteArray?, error: String?) {
    mainHandler.post {
      val invoke = pendingCapture ?: return@post
      pendingCapture = null
      captureThread = null
      when {
        // A cancelled capture was already rejected by whoever cancelled it.
        wav == null && error == null -> Unit
        wav == null -> invoke.reject(error ?: "Aufnahme fehlgeschlagen")
        else -> {
          val payload = JSObject()
          payload.put("audioBase64", Base64.encodeToString(wav, Base64.NO_WRAP))
          payload.put("mime", "audio/wav")
          invoke.resolve(payload)
        }
      }
    }
  }

  private fun cancelCapture(message: String) {
    captureCancelled = true
    captureThread = null
    val invoke = pendingCapture
    pendingCapture = null
    invoke?.reject(message)
  }

  /**
   * RMS of one buffer in dBFS, on the same scale as the desktop and iOS
   * recorders' meters so the three end an answer at the same loudness.
   */
  private fun loudnessDb(buffer: ShortArray, read: Int): Double {
    if (read <= 0) return -160.0
    var sum = 0.0
    for (i in 0 until read) {
      val sample = buffer[i].toDouble() / Short.MAX_VALUE
      sum += sample * sample
    }
    val rms = sqrt(sum / read)
    return if (rms <= 0.0) -160.0 else 20.0 * log10(rms)
  }

  /** Wrap raw PCM in the 44-byte canonical WAV header the endpoints expect. */
  private fun wavContainer(pcm: ByteArray): ByteArray {
    val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
    val byteRate = CAPTURE_SAMPLE_RATE * 2
    header.put("RIFF".toByteArray(Charsets.US_ASCII))
    header.putInt(36 + pcm.size)
    header.put("WAVE".toByteArray(Charsets.US_ASCII))
    header.put("fmt ".toByteArray(Charsets.US_ASCII))
    header.putInt(16)
    header.putShort(1) // PCM
    header.putShort(1) // mono
    header.putInt(CAPTURE_SAMPLE_RATE)
    header.putInt(byteRate)
    header.putShort(2) // block align
    header.putShort(16) // bits per sample
    header.put("data".toByteArray(Charsets.US_ASCII))
    header.putInt(pcm.size)
    return header.array() + pcm
  }

  /**
   * Play synthesized audio through the session's own audio focus, so it ducks
   * other audio like the local voice does and stops when the learner pauses.
   */
  @Command
  fun playAudio(invoke: Invoke) {
    val args = invoke.parseArgs(VoicePlayArgs::class.java)
    activity.runOnUiThread {
      if (!active) {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return@runOnUiThread
      }
      if (busy) {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return@runOnUiThread
      }
      val audio = try {
        Base64.decode(args.audioBase64, Base64.DEFAULT)
      } catch (error: IllegalArgumentException) {
        invoke.reject("Die Sprachausgabe war beschädigt")
        return@runOnUiThread
      }
      if (audio.isEmpty()) {
        invoke.reject("Die Sprachausgabe war leer")
        return@runOnUiThread
      }
      val file = File.createTempFile("zam-voice-", ".wav", activity.cacheDir)
      try {
        file.writeBytes(audio)
        val player = MediaPlayer()
        player.setAudioAttributes(audioAttributes)
        player.setDataSource(file.absolutePath)
        player.setOnCompletionListener {
          mainHandler.post { completePlayback(null) }
        }
        player.setOnErrorListener { _, _, _ ->
          mainHandler.post { completePlayback("Die Sprachausgabe wurde unterbrochen") }
          true
        }
        player.prepare()
        player.start()
        mediaPlayer = player
        pendingPlay = invoke
      } catch (error: Exception) {
        invoke.reject(error.message ?: "Die Sprachausgabe konnte nicht abgespielt werden")
      } finally {
        // MediaPlayer holds its own descriptor; the spoken answer must not be
        // left in the cache directory either way.
        file.delete()
      }
    }
  }

  private fun completePlayback(error: String?) {
    val invoke = pendingPlay
    pendingPlay = null
    mediaPlayer?.release()
    mediaPlayer = null
    if (error == null) invoke?.resolve() else invoke?.reject(error)
  }

  private fun stopPlayback(message: String) {
    val invoke = pendingPlay
    pendingPlay = null
    mediaPlayer?.release()
    mediaPlayer = null
    invoke?.reject(message)
  }

  @Command
  fun installVoiceData(invoke: Invoke) {
    activity.runOnUiThread {
      try {
        voiceDataInstallRequested = true
        activity.startActivity(Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA))
        invoke.resolve()
      } catch (error: Exception) {
        voiceDataInstallRequested = false
        invoke.reject(error.message ?: "Android-Sprachdaten konnten nicht geöffnet werden")
      }
    }
  }

  override fun onResume() {
    if (!voiceDataInstallRequested) return
    voiceDataInstallRequested = false
    textToSpeech?.shutdown()
    textToSpeech = null
    textToSpeechReady = false
    textToSpeechError = null
    initializeTextToSpeech()
  }

  override fun onDestroy(activity: AppCompatActivity) {
    abortSession("Sprachmodus beendet")
    textToSpeech?.shutdown()
    textToSpeech = null
    textToSpeechReady = false
  }
}
