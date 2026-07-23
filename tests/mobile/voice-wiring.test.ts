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
