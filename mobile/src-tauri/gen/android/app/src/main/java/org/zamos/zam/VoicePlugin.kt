package org.zamos.zam

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
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
import java.util.Locale

@InvokeArg
class VoiceLocaleArgs {
  lateinit var locale: String
}

@InvokeArg
class VoiceSpeakArgs {
  lateinit var text: String
  lateinit var locale: String
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
      if (pendingSpeak != null || pendingListen != null) {
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
      if (pendingSpeak != null || pendingListen != null) {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return@runOnUiThread
      }
      pendingListen = invoke
      pendingListenLocale = args.locale
      startPendingOperation()
    }
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
