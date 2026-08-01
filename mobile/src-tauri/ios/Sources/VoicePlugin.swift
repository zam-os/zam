// iOS counterpart of VoicePlugin.kt (ADR 2026-07-31).
//
// Android drives voice review through a foreground service so a session
// survives the screen going off. iOS has no equivalent: an app that leaves the
// foreground loses the microphone. The session therefore lives only while ZAM
// is frontmost, and `stop` is called on backgrounding by the WebView.
//
// Recognition is pinned on-device (`requiresOnDeviceRecognition`), matching the
// macOS engine and the device tier's promise that nothing leaves the machine.
// Availability is per language, as 0.24.1 established: a device can be fully
// equipped for English and have no German model at all, so every entry point
// answers for the language actually being reviewed.
//
// Command names and payload shapes are fixed by src/voice.rs.

import AVFoundation
import Foundation
import Speech
import Tauri
import UIKit
import WebKit

struct VoiceLocaleArgs: Decodable {
  let locale: String
}

struct VoiceSpeakArgs: Decodable {
  let text: String
  let locale: String
}

struct VoicePlayArgs: Decodable {
  let audioBase64: String
  let mime: String
}

/// Silence after speech has started that ends the answer. Matches the desktop
/// recorder's trailing-silence window so the two feel the same.
private let trailingSilence: TimeInterval = 1.2
/// How long we wait for the learner to start talking at all.
private let speechOnsetTimeout: TimeInterval = 8.0
/// Hard cap on any single operation, so a stuck recognizer cannot hold the
/// microphone for the rest of the session.
private let maxOperationSeconds: TimeInterval = 30.0
/// Average power below which the microphone is considered quiet. Matches the
/// desktop recorder so a captured answer ends at the same point on both.
private let speechThresholdDb: Float = -35.0
/// How often the capture loop looks at the meter.
private let meterInterval: TimeInterval = 0.05

class VoicePlugin: Plugin, AVSpeechSynthesizerDelegate, AVAudioPlayerDelegate {
  private let synthesizer = AVSpeechSynthesizer()
  private let audioEngine = AVAudioEngine()

  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var silenceTimer: Timer?
  private var deadlineTimer: Timer?

  private var recorder: AVAudioRecorder?
  private var captureURL: URL?
  private var meterTimer: Timer?
  private var captureStarted = false
  private var captureSilenceSince: Date?
  private var captureDeadline = Date.distantFuture
  private var captureOnsetDeadline = Date.distantFuture

  private var player: AVAudioPlayer?

  private var active = false
  private var pendingSpeak: Invoke?
  private var pendingListen: Invoke?
  private var pendingCapture: Invoke?
  private var pendingPlay: Invoke?
  private var transcript = ""
  private var heardSpeech = false

  override init() {
    super.init()
    synthesizer.delegate = self
  }

  /// True while any speech operation owns the microphone or the speaker. Every
  /// entry point checks this: two overlapping operations would fight over the
  /// same audio session and the second one's promise would never settle.
  private var busy: Bool {
    pendingSpeak != nil || pendingListen != nil || pendingCapture != nil
      || pendingPlay != nil
  }

  // MARK: - Locale

  /// Mirrors `normalize_locale` in src/voice.rs and `resolveVoiceLocale` in the
  /// kernel: anything not English is German, which is the field-test default.
  private static func normalized(_ tag: String) -> String {
    tag.lowercased().hasPrefix("en") ? "en-US" : "de-DE"
  }

  /// A recognizer for the requested language, or nil when this device has no
  /// on-device model for it. Never falls back across languages — an English
  /// recognizer fed German returns fluent nonsense, confidently.
  private static func recognizer(for tag: String) -> SFSpeechRecognizer? {
    let wanted = normalized(tag)
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: wanted)) else {
      return nil
    }
    guard recognizer.isAvailable, recognizer.supportsOnDeviceRecognition else {
      return nil
    }
    return recognizer
  }

  /// The best installed voice for the language.
  ///
  /// Quality is ranked before region. iOS ships every language with a small
  /// `.default` (compact) voice and downloads `.enhanced` / `.premium` ones
  /// only when the user asks for them in Settings › Accessibility › Spoken
  /// Content › Voices. Taking the first match therefore reliably picked the
  /// *worst* installed voice, which is what made the read-aloud sound a
  /// decade old even on devices that had a good voice available.
  ///
  /// Among voices of equal quality the system's own pick for the language
  /// wins, then an exact region match — a premium de-AT voice still beats a
  /// compact de-DE one, because an accent is a far smaller difference than a
  /// synthesis generation.
  private static func voice(for tag: String) -> AVSpeechSynthesisVoice? {
    let wanted = normalized(tag)
    let language = String(wanted.prefix(2))
    // The voice the system itself nominates for the language. Equal quality
    // must not be broken arbitrarily — speechVoices() also carries novelty
    // voices, and taking an arbitrary maximum picked those over the sensible
    // default (verified on macOS, where it chose "Zarvox" over "Samantha").
    let systemDefault = AVSpeechSynthesisVoice(language: wanted)?.identifier
    let installed = AVSpeechSynthesisVoice.speechVoices().filter {
      $0.language.lowercased().hasPrefix(language)
    }
    return installed.max { left, right in
      rank(left, wanted, systemDefault) < rank(right, wanted, systemDefault)
    }
  }

  private static func rank(
    _ voice: AVSpeechSynthesisVoice, _ wanted: String, _ systemDefault: String?
  ) -> (Int, Int, Int) {
    let tier: Int
    switch voice.quality {
    case .premium: tier = 3
    case .enhanced: tier = 2
    default: tier = 1
    }
    let isSystemDefault = voice.identifier == systemDefault ? 1 : 0
    let exactRegion = voice.language.caseInsensitiveCompare(wanted) == .orderedSame ? 1 : 0
    return (tier, isSystemDefault, exactRegion)
  }

  /// Quality of the voice a session would actually use, for the UI hint.
  /// `"default"` means only a compact voice is installed and the learner can
  /// get a much better one with a one-time download.
  @objc public func voiceQuality(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceLocaleArgs.self)
    guard let voice = Self.voice(for: args.locale) else {
      invoke.resolve(["quality": "none"])
      return
    }
    let quality: String
    switch voice.quality {
    case .premium: quality = "premium"
    case .enhanced: quality = "enhanced"
    default: quality = "default"
    }
    invoke.resolve(["quality": quality, "voice": voice.name])
  }

  // MARK: - Permissions

  /// `true` granted, `false` denied, `nil` not yet asked.
  ///
  /// AVAudioApplication is the iOS 17 replacement, but the Swift package this
  /// plugin is compiled into is built with a lower deployment target than the
  /// SwiftPM manifest declares, so the pre-17 path has to stay. The deprecation
  /// warning on it is expected.
  private static func recordPermissionGranted() -> Bool? {
    if #available(iOS 17.0, *) {
      switch AVAudioApplication.shared.recordPermission {
      case .granted: return true
      case .denied: return false
      default: return nil
      }
    }
    switch AVAudioSession.sharedInstance().recordPermission {
    case .granted: return true
    case .denied: return false
    default: return nil
    }
  }

  private static func requestRecordPermission(_ completion: @escaping (Bool) -> Void) {
    if #available(iOS 17.0, *) {
      AVAudioApplication.requestRecordPermission(completionHandler: completion)
    } else {
      AVAudioSession.sharedInstance().requestRecordPermission(completion)
    }
  }

  private static func microphoneState() -> String {
    let speech = SFSpeechRecognizer.authorizationStatus()
    if speech == .denied || speech == .restricted { return "denied" }

    switch recordPermissionGranted() {
    case .some(true):
      // Both halves are needed; speech consent is the one still outstanding.
      return speech == .authorized ? "granted" : "prompt"
    case .some(false):
      return "denied"
    default:
      return "prompt"
    }
  }

  @objc public override func checkPermissions(_ invoke: Invoke) {
    invoke.resolve(["microphone": Self.microphoneState()])
  }

  /// Asks for both consents in turn. Both usage descriptions must be present in
  /// the Info.plist or iOS terminates the process instead of prompting.
  @objc public override func requestPermissions(_ invoke: Invoke) {
    SFSpeechRecognizer.requestAuthorization { _ in
      Self.requestRecordPermission { _ in
        DispatchQueue.main.async {
          // Re-read rather than trusting the granted flags: voice mode needs
          // both consents, and either can still be missing.
          invoke.resolve(["microphone": Self.microphoneState()])
        }
      }
    }
  }

  @objc public func openAppSettings(_ invoke: Invoke) {
    DispatchQueue.main.async {
      guard let url = URL(string: UIApplication.openSettingsURLString) else {
        invoke.reject("Die App-Einstellungen konnten nicht geöffnet werden")
        return
      }
      UIApplication.shared.open(url)
      invoke.resolve()
    }
  }

  /// iOS ships its voices with the system; there is no installer to open.
  /// Android's counterpart exists, so the command answers rather than 404s.
  @objc public func installVoiceData(_ invoke: Invoke) {
    invoke.reject("iOS installiert Stimmen über die Systemeinstellungen, nicht über ZAM")
  }

  // MARK: - Session

  @objc public func start(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceLocaleArgs.self)
    DispatchQueue.main.async {
      guard Self.microphoneState() == "granted" else {
        invoke.reject("Mikrofon- oder Spracherkennungsberechtigung fehlt")
        return
      }
      guard Self.recognizer(for: args.locale) != nil else {
        invoke.reject(
          "Für \(Self.normalized(args.locale)) ist keine geräteinterne Spracherkennung installiert"
        )
        return
      }
      if self.active {
        invoke.resolve()
        return
      }
      do {
        let session = AVAudioSession.sharedInstance()
        // .duckOthers rather than .interruptSpokenAudioAndMixWithOthers: a
        // podcast should dip while ZAM talks, not stop for the whole session.
        try session.setCategory(
          .playAndRecord,
          mode: .spokenAudio,
          options: [.duckOthers, .defaultToSpeaker, .allowBluetoothHFP]
        )
        try session.setActive(true, options: [])
        self.active = true
        invoke.resolve()
      } catch {
        self.active = false
        invoke.reject("Audiositzung konnte nicht gestartet werden: \(error.localizedDescription)")
      }
    }
  }

  @objc public func stop(_ invoke: Invoke) {
    DispatchQueue.main.async {
      self.abort(message: "Sprachmodus beendet")
      invoke.resolve()
    }
  }

  private func abort(message: String) {
    active = false
    synthesizer.stopSpeaking(at: .immediate)
    teardownRecognition()
    teardownCapture(deleteFile: true)
    player?.stop()
    player = nil

    pendingSpeak?.reject(message)
    pendingSpeak = nil
    pendingListen?.reject(message)
    pendingListen = nil
    pendingCapture?.reject(message)
    pendingCapture = nil
    pendingPlay?.reject(message)
    pendingPlay = nil

    try? AVAudioSession.sharedInstance().setActive(
      false, options: [.notifyOthersOnDeactivation])
  }

  // MARK: - Capabilities

  /// What this device can serve locally for one review language, so the surface
  /// can resolve the learner's engine preference without guessing.
  @objc public func capabilities(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceLocaleArgs.self)
    invoke.resolve([
      "sttLocal": Self.recognizer(for: args.locale) != nil,
      "ttsLocal": Self.voice(for: args.locale) != nil,
    ])
  }

  // MARK: - Speaking

  @objc public func speak(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceSpeakArgs.self)
    DispatchQueue.main.async {
      guard self.active else {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return
      }
      guard !self.busy else {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return
      }
      let text = args.text.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !text.isEmpty else {
        invoke.reject("Vorlesetext ist leer")
        return
      }
      guard let voice = Self.voice(for: args.locale) else {
        invoke.reject("Keine installierte Stimme für \(Self.normalized(args.locale))")
        return
      }
      let utterance = AVSpeechUtterance(string: text)
      utterance.voice = voice
      self.pendingSpeak = invoke
      self.synthesizer.speak(utterance)
    }
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance
  ) {
    DispatchQueue.main.async {
      let invoke = self.pendingSpeak
      self.pendingSpeak = nil
      invoke?.resolve()
    }
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance
  ) {
    DispatchQueue.main.async {
      // A cancel during `abort` has already rejected the pending call.
      guard let invoke = self.pendingSpeak else { return }
      self.pendingSpeak = nil
      invoke.reject("Sprachausgabe wurde unterbrochen")
    }
  }

  // MARK: - Listening

  @objc public func listen(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceLocaleArgs.self)
    DispatchQueue.main.async {
      guard self.active else {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return
      }
      guard !self.busy else {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return
      }
      guard let recognizer = Self.recognizer(for: args.locale) else {
        invoke.reject(
          "Für \(Self.normalized(args.locale)) ist keine geräteinterne Spracherkennung verfügbar"
        )
        return
      }
      self.pendingListen = invoke
      self.transcript = ""
      self.heardSpeech = false
      self.beginRecognition(with: recognizer)
    }
  }

  private func beginRecognition(with recognizer: SFSpeechRecognizer) {
    let request = SFSpeechAudioBufferRecognitionRequest()
    // The whole point of the device tier: never let this reach Apple.
    request.requiresOnDeviceRecognition = true
    request.shouldReportPartialResults = true
    if #available(iOS 16.0, *) { request.addsPunctuation = true }
    recognitionRequest = request

    let input = audioEngine.inputNode
    input.removeTap(onBus: 0)
    input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) {
      buffer, _ in
      request.append(buffer)
    }

    audioEngine.prepare()
    do {
      try audioEngine.start()
    } catch {
      failListen("Mikrofon konnte nicht gestartet werden: \(error.localizedDescription)")
      return
    }

    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }
      DispatchQueue.main.async {
        if let result {
          let text = result.bestTranscription.formattedString
          if !text.isEmpty {
            self.transcript = text
            self.heardSpeech = true
            // Restart the window on every new word; the answer ends when the
            // learner stops talking, not after a fixed duration.
            self.armSilenceTimer()
          }
          if result.isFinal {
            self.finishListen()
            return
          }
        }
        if error != nil, !self.heardSpeech {
          self.failListen("Keine Sprache erkannt")
        } else if error != nil {
          self.finishListen()
        }
      }
    }

    armOnsetTimer()
    armDeadlineTimer()
  }

  private func armSilenceTimer() {
    silenceTimer?.invalidate()
    silenceTimer = Timer.scheduledTimer(withTimeInterval: trailingSilence, repeats: false) {
      [weak self] _ in
      self?.finishListen()
    }
  }

  private func armOnsetTimer() {
    silenceTimer?.invalidate()
    silenceTimer = Timer.scheduledTimer(withTimeInterval: speechOnsetTimeout, repeats: false) {
      [weak self] _ in
      guard let self else { return }
      self.heardSpeech ? self.finishListen() : self.failListen("Keine Sprache erkannt")
    }
  }

  private func armDeadlineTimer() {
    deadlineTimer?.invalidate()
    deadlineTimer = Timer.scheduledTimer(withTimeInterval: maxOperationSeconds, repeats: false) {
      [weak self] _ in
      guard let self else { return }
      self.heardSpeech
        ? self.finishListen() : self.failListen("Spracherkennung hat zu lange gedauert")
    }
  }

  private func finishListen() {
    let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
    let invoke = pendingListen
    pendingListen = nil
    teardownRecognition()
    guard !text.isEmpty else {
      invoke?.reject("Keine Sprache erkannt")
      return
    }
    invoke?.resolve(["transcript": text])
  }

  private func failListen(_ message: String) {
    let invoke = pendingListen
    pendingListen = nil
    teardownRecognition()
    invoke?.reject(message)
  }

  // MARK: - Capture (cloud speech-to-text)

  /// Record one answer and hand back the audio rather than a transcript.
  ///
  /// Deliberately the same microphone contract as `listen`: same onset window,
  /// same trailing silence, same hard deadline. The learner's preference decides
  /// who turns the audio into text, and nothing else about the interaction
  /// should change with it.
  ///
  /// 16 kHz mono PCM is what Apple's own recognizer consumes and the smallest
  /// upload a hosted recognizer can work from without losing anything.
  @objc public func capture(_ invoke: Invoke) throws {
    _ = try invoke.parseArgs(VoiceLocaleArgs.self)
    DispatchQueue.main.async {
      guard self.active else {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return
      }
      guard !self.busy else {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return
      }
      let url = FileManager.default.temporaryDirectory.appendingPathComponent(
        "zam-voice-\(UUID().uuidString).wav")
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatLinearPCM),
        AVSampleRateKey: 16000.0,
        AVNumberOfChannelsKey: 1,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false,
      ]
      do {
        let recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder.isMeteringEnabled = true
        guard recorder.record() else {
          invoke.reject("Die Aufnahme konnte nicht gestartet werden")
          return
        }
        self.recorder = recorder
        self.captureURL = url
        self.pendingCapture = invoke
        self.captureStarted = false
        self.captureSilenceSince = nil
        self.captureOnsetDeadline = Date().addingTimeInterval(speechOnsetTimeout)
        self.captureDeadline = Date().addingTimeInterval(maxOperationSeconds)
        self.meterTimer = Timer.scheduledTimer(
          withTimeInterval: meterInterval, repeats: true
        ) { [weak self] _ in
          self?.pollCapture()
        }
      } catch {
        invoke.reject("Mikrofon konnte nicht geöffnet werden: \(error.localizedDescription)")
      }
    }
  }

  private func pollCapture() {
    guard let recorder else { return }
    recorder.updateMeters()
    let level = recorder.averagePower(forChannel: 0)

    if level > speechThresholdDb {
      captureStarted = true
      captureSilenceSince = nil
    } else if captureStarted {
      let since = captureSilenceSince ?? Date()
      captureSilenceSince = since
      if Date().timeIntervalSince(since) >= trailingSilence {
        finishCapture()
        return
      }
    }

    if !captureStarted, Date() >= captureOnsetDeadline {
      failCapture("Keine Sprache erkannt")
      return
    }
    if Date() >= captureDeadline {
      // Whatever was said before the cap is still worth transcribing.
      captureStarted ? finishCapture() : failCapture("Aufnahme hat zu lange gedauert")
    }
  }

  private func finishCapture() {
    let invoke = pendingCapture
    pendingCapture = nil
    let url = captureURL
    teardownCapture(deleteFile: false)

    guard let url, let data = try? Data(contentsOf: url), !data.isEmpty else {
      if let url { try? FileManager.default.removeItem(at: url) }
      invoke?.reject("Die Aufnahme war leer")
      return
    }
    try? FileManager.default.removeItem(at: url)
    invoke?.resolve(["audioBase64": data.base64EncodedString(), "mime": "audio/wav"])
  }

  private func failCapture(_ message: String) {
    let invoke = pendingCapture
    pendingCapture = nil
    teardownCapture(deleteFile: true)
    invoke?.reject(message)
  }

  /// Stops the recorder and clears capture state. The recording is deleted
  /// unless the caller is about to read it — a spoken answer must never be left
  /// lying in the temp directory.
  private func teardownCapture(deleteFile: Bool) {
    meterTimer?.invalidate()
    meterTimer = nil
    recorder?.stop()
    recorder = nil
    captureStarted = false
    captureSilenceSince = nil
    captureOnsetDeadline = Date.distantFuture
    captureDeadline = Date.distantFuture
    if deleteFile, let url = captureURL {
      try? FileManager.default.removeItem(at: url)
    }
    captureURL = nil
  }

  // MARK: - Playback (cloud text-to-speech)

  /// Play synthesized audio through the session's own route.
  @objc public func playAudio(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoicePlayArgs.self)
    DispatchQueue.main.async {
      guard self.active else {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return
      }
      guard !self.busy else {
        invoke.reject("Eine Sprachoperation läuft bereits")
        return
      }
      guard let data = Data(base64Encoded: args.audioBase64), !data.isEmpty else {
        invoke.reject("Die Sprachausgabe war leer")
        return
      }
      do {
        let player = try AVAudioPlayer(data: data)
        player.delegate = self
        guard player.play() else {
          invoke.reject("Die Sprachausgabe konnte nicht abgespielt werden")
          return
        }
        self.player = player
        self.pendingPlay = invoke
      } catch {
        invoke.reject("Die Sprachausgabe konnte nicht gelesen werden: \(error.localizedDescription)")
      }
    }
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    DispatchQueue.main.async {
      let invoke = self.pendingPlay
      self.pendingPlay = nil
      self.player = nil
      flag ? invoke?.resolve() : invoke?.reject("Die Sprachausgabe wurde unterbrochen")
    }
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    DispatchQueue.main.async {
      let invoke = self.pendingPlay
      self.pendingPlay = nil
      self.player = nil
      invoke?.reject("Die Sprachausgabe war beschädigt")
    }
  }

  private func teardownRecognition() {
    silenceTimer?.invalidate()
    silenceTimer = nil
    deadlineTimer?.invalidate()
    deadlineTimer = nil

    if audioEngine.isRunning { audioEngine.stop() }
    audioEngine.inputNode.removeTap(onBus: 0)

    recognitionRequest?.endAudio()
    recognitionRequest = nil
    recognitionTask?.cancel()
    recognitionTask = nil

    transcript = ""
    heardSpeech = false
  }
}

@_cdecl("init_plugin_voice")
func initPluginVoice() -> Plugin {
  return VoicePlugin()
}
