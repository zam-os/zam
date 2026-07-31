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

/// Silence after speech has started that ends the answer. Matches the desktop
/// recorder's trailing-silence window so the two feel the same.
private let trailingSilence: TimeInterval = 1.2
/// How long we wait for the learner to start talking at all.
private let speechOnsetTimeout: TimeInterval = 8.0
/// Hard cap on any single operation, so a stuck recognizer cannot hold the
/// microphone for the rest of the session.
private let maxOperationSeconds: TimeInterval = 30.0

class VoicePlugin: Plugin, AVSpeechSynthesizerDelegate {
  private let synthesizer = AVSpeechSynthesizer()
  private let audioEngine = AVAudioEngine()

  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var silenceTimer: Timer?
  private var deadlineTimer: Timer?

  private var active = false
  private var pendingSpeak: Invoke?
  private var pendingListen: Invoke?
  private var transcript = ""
  private var heardSpeech = false

  override init() {
    super.init()
    synthesizer.delegate = self
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

  /// An installed voice for the language, preferring an exact region match.
  private static func voice(for tag: String) -> AVSpeechSynthesisVoice? {
    let wanted = normalized(tag)
    let language = String(wanted.prefix(2))
    let installed = AVSpeechSynthesisVoice.speechVoices().filter {
      $0.language.lowercased().hasPrefix(language)
    }
    return installed.first { $0.language.caseInsensitiveCompare(wanted) == .orderedSame }
      ?? installed.first
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

    pendingSpeak?.reject(message)
    pendingSpeak = nil
    pendingListen?.reject(message)
    pendingListen = nil

    try? AVAudioSession.sharedInstance().setActive(
      false, options: [.notifyOthersOnDeactivation])
  }

  // MARK: - Speaking

  @objc public func speak(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(VoiceSpeakArgs.self)
    DispatchQueue.main.async {
      guard self.active else {
        invoke.reject("Sprachmodus ist nicht aktiv")
        return
      }
      guard self.pendingSpeak == nil, self.pendingListen == nil else {
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
      guard self.pendingSpeak == nil, self.pendingListen == nil else {
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
