import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Android voice-mode wiring", () => {
  it("declares local speech and foreground-service requirements", () => {
    const manifest = read(
      "mobile/src-tauri/gen/android/app/src/main/AndroidManifest.xml",
    );
    expect(manifest).toContain("android.permission.RECORD_AUDIO");
    expect(manifest).toContain(
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
    );
    expect(manifest).toContain(
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    );
    expect(manifest).toContain("android.permission.WAKE_LOCK");
    expect(manifest).toContain("android.speech.RecognitionService");
    expect(manifest).toContain("android.intent.action.TTS_SERVICE");
    expect(manifest).toContain(
      'android:foregroundServiceType="microphone|mediaPlayback"',
    );
  });

  it("forces both recognition and synthesis onto downloaded device models", () => {
    const plugin = read(
      "mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt",
    );
    expect(plugin).toContain("createOnDeviceSpeechRecognizer");
    expect(plugin).toContain("isOnDeviceRecognitionAvailable");
    expect(plugin).toContain("EXTRA_PREFER_OFFLINE, true");
    expect(plugin).toContain("!it.isNetworkConnectionRequired");
    expect(plugin).toContain("KEY_FEATURE_NOT_INSTALLED");
    expect(plugin).toContain("ACTION_INSTALL_TTS_DATA");
    expect(plugin).toContain("AudioFocusRequest.Builder");
    expect(plugin).toContain("pauseForTransientFocusLoss");
  });

  it("keeps the screen-off loop alive and connects it to the kernel review UI", () => {
    const service = read(
      "mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoiceSessionService.kt",
    );
    const rust = read("mobile/src-tauri/src/lib.rs");
    const main = read("mobile/src/main.ts");
    const html = read("mobile/index.html");
    expect(service).toContain("PowerManager.PARTIAL_WAKE_LOCK");
    expect(service).toContain("startForeground(");
    expect(rust).toContain("voice::voice_listen");
    expect(main).toContain("new HandsFreeReviewController");
    expect(main).toContain("rateCurrentReview(rating)");
    expect(html).toContain('id="toggle-voice"');
  });
});

describe("iOS voice-mode wiring", () => {
  it("declares both usage descriptions iOS terminates the app without", () => {
    const project = read("mobile/src-tauri/gen/apple/project.yml");
    expect(project).toContain("NSMicrophoneUsageDescription");
    expect(project).toContain("NSSpeechRecognitionUsageDescription");
  });

  it("pins recognition on-device and never crosses languages", () => {
    const plugin = read("mobile/src-tauri/ios/Sources/VoicePlugin.swift");
    expect(plugin).toContain("requiresOnDeviceRecognition = true");
    expect(plugin).toContain("supportsOnDeviceRecognition");
    // A recognizer for one language must never serve another: fed the wrong
    // language it returns fluent nonsense rather than failing.
    expect(plugin).not.toContain("SFSpeechRecognizer()");
  });

  it("registers the plugin on both mobile platforms", () => {
    const voice = read("mobile/src-tauri/src/voice.rs");
    expect(voice).toContain("register_ios_plugin(init_plugin_voice)");
    expect(voice).toContain('register_android_plugin(PLUGIN_IDENTIFIER, "VoicePlugin")');
    const lib = read("mobile/src-tauri/src/lib.rs");
    expect(lib).toContain("#[cfg(mobile)]\n    let builder = builder.plugin(voice::init());");
  });

  it("reports voice on both platforms but backgrounding only on Android", () => {
    // iOS hands the microphone back when the app leaves the foreground, so a
    // session there must end rather than wait for audio that cannot arrive.
    const lib = read("mobile/src-tauri/src/lib.rs");
    expect(lib).toContain('"voice": cfg!(mobile)');
    expect(lib).toContain('"voiceSurvivesBackground": android');

    const main = read("mobile/src/main.ts");
    expect(main).toContain(
      "!platformFeatures.voiceSurvivesBackground && voiceController.active",
    );
  });

  it("guards the iOS 17 permission API so the pre-17 path still builds", () => {
    // The Swift package is compiled with a lower deployment target than its
    // manifest declares; without the guard the whole iOS build fails.
    const plugin = read("mobile/src-tauri/ios/Sources/VoicePlugin.swift");
    expect(plugin).toContain("if #available(iOS 17.0, *)");
    expect(plugin).toContain("AVAudioSession.sharedInstance().recordPermission");
  });
});

describe("voice locale and voice quality", () => {
  const main = read("mobile/src/main.ts");

  it("speaks in the learner's current language, not the pairing snapshot", () => {
    // system.locale defaults to "en", and the pairing payload freezes whatever
    // it was at pairing time. A device paired before the language was stored
    // otherwise keeps speaking English while the UI and evaluation follow the
    // database (reported on an iPad running entirely in German).
    expect(main).toContain(
      "learnerLocale ?? currentPairing?.settings?.locale ?? navigator.language",
    );
  });

  it("ranks voices by quality, with the system's own pick breaking ties", () => {
    const plugin = read("mobile/src-tauri/ios/Sources/VoicePlugin.swift");
    expect(plugin).toContain("case .premium: tier = 3");
    expect(plugin).toContain("case .enhanced: tier = 2");
    // Ranking on quality alone breaks ties arbitrarily and reaches novelty
    // voices; verified on macOS, where it chose "Zarvox" over "Samantha".
    expect(plugin).toContain("AVSpeechSynthesisVoice(language: wanted)?.identifier");
    expect(plugin).toContain("isSystemDefault");

    const desktop = read("desktop/src-tauri/src/voice.rs");
    expect(desktop).toContain("AVSpeechSynthesisVoiceQuality::Premium");
    expect(desktop).toContain("is_system_default");
    // voiceWithLanguage alone returns the compact voice; it is now only the
    // tie-break, not the selection.
    expect(desktop).toContain("fn best_voice(");
  });

  it("tells the learner where better voices come from", () => {
    expect(main).toContain('invoke<{ quality?: string }>("voice_quality"');
    expect(main).toContain('t("voice_compact_voice_hint")');
    const i18n = read("mobile/src/i18n.ts");
    expect(i18n.match(/voice_compact_voice_hint/g)?.length).toBe(2);
  });
});

// The cloud tier needs one more thing from each shell than the device tier
// did: a way to record without transcribing, a way to play audio it did not
// synthesize, and an honest per-language answer about what the device can do.
// A missing command surfaces as an opaque plugin error at the first spoken
// word, so the surface is pinned here rather than discovered on a device.
describe("mobile cloud speech tier wiring", () => {
  const commands = ["capture", "playAudio", "capabilities"];

  it("registers the commands the tiered port calls", () => {
    const rust = read("mobile/src-tauri/src/voice.rs");
    for (const command of ["voice_capture", "voice_play", "voice_capabilities"]) {
      expect(rust).toContain(`pub async fn ${command}`);
      expect(read("mobile/src-tauri/src/lib.rs")).toContain(`voice::${command}`);
    }
    // The non-mobile build answers rather than 404s, as the rest of the
    // command surface already does.
    for (const command of ["voice_capture", "voice_play", "voice_capabilities"]) {
      expect(rust).toContain(`pub fn ${command}`);
    }
  });

  it("implements them on iOS", () => {
    const plugin = read("mobile/src-tauri/ios/Sources/VoicePlugin.swift");
    for (const command of commands) {
      expect(plugin).toContain(`func ${command}(_ invoke: Invoke)`);
    }
    // 16 kHz mono PCM: what a hosted recognizer wants, and the smallest
    // upload that loses nothing.
    expect(plugin).toContain("AVSampleRateKey: 16000.0");
    expect(plugin).toContain("AVNumberOfChannelsKey: 1");
    // The recording must never be left in the temp directory.
    expect(plugin).toContain("FileManager.default.removeItem(at: url)");
  });

  it("implements them on Android", () => {
    const plugin = read(
      "mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt",
    );
    for (const command of commands) {
      expect(plugin).toContain(`fun ${command}(invoke: Invoke)`);
    }
    expect(plugin).toContain("CAPTURE_SAMPLE_RATE = 16_000");
    expect(plugin).toContain("AudioFormat.ENCODING_PCM_16BIT");
    // Raw PCM needs the container the endpoints expect.
    expect(plugin).toContain("RIFF");
  });

  it("keeps the capture heuristics identical across the three shells", () => {
    // Same onset window, same trailing silence, same loudness floor: the
    // learner's engine preference decides who transcribes, and nothing else
    // about the interaction should change with it.
    expect(read("desktop/src-tauri/src/voice.rs")).toContain(
      "SPEECH_THRESHOLD_DB: f32 = -35.0",
    );
    expect(read("mobile/src-tauri/ios/Sources/VoicePlugin.swift")).toContain(
      "speechThresholdDb: Float = -35.0",
    );
    expect(
      read(
        "mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt",
      ),
    ).toContain("CAPTURE_THRESHOLD_DB = -35.0");
  });
});
