#[cfg(mobile)]
use serde::{Deserialize, Serialize};
#[cfg(mobile)]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(mobile)]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_voice);

#[cfg(mobile)]
pub struct Voice<R: Runtime>(PluginHandle<R>);

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceLocalePayload<'a> {
    locale: &'a str,
}

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceSpeakPayload<'a> {
    text: &'a str,
    locale: &'a str,
}

#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
pub struct VoicePermissionState {
    microphone: Option<String>,
}

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoicePlayPayload<'a> {
    audio_base64: &'a str,
    mime: &'a str,
}

#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
pub struct VoiceRecognitionResult {
    transcript: String,
}

/// One recorded answer, handed to the WebView so it can post it to the paired
/// speech endpoint. The desktop passes a file path here instead, because its
/// bridge process can read the file; a companion has no such process, so the
/// audio itself crosses the IPC boundary.
#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCaptureResult {
    audio_base64: String,
    mime: String,
}

/// What this device can do locally **for one review language** — the mobile
/// counterpart of the desktop's `voice_capabilities`. Recognition and voices
/// are per-language on both platforms, so a device fully equipped for English
/// can have nothing for German.
#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCapabilities {
    stt_local: bool,
    tts_local: bool,
}

#[cfg(mobile)]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("voice")
        .setup(|app, api| {
            // Android runs the session in a foreground service so it survives
            // the screen going off; iOS keeps it only while ZAM is frontmost
            // (ADR 2026-07-31). The command surface is identical either way.
            #[cfg(target_os = "android")]
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "VoicePlugin")?;
            #[cfg(target_os = "ios")]
            let handle = api.register_ios_plugin(init_plugin_voice)?;
            app.manage(Voice(handle));
            Ok(())
        })
        .build()
}

#[cfg(mobile)]
#[tauri::command]
pub fn voice_check_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<VoicePermissionState, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin("checkPermissions", ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn voice_request_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<VoicePermissionState, String> {
    // Tauri's Android Plugin.requestPermissions NPE's on a null invoke body.
    // Pass an explicit alias list (or at least `{}`) so parseArgs succeeds.
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async(
            "requestPermissions",
            serde_json::json!({ "permissions": ["microphone"] }),
        )
        .await
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn voice_start<R: Runtime>(app: AppHandle<R>, locale: String) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async::<serde_json::Value>(
            "start",
            VoiceLocalePayload { locale: &locale },
        )
        .await
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn voice_stop<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async::<serde_json::Value>("stop", ())
        .await
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn voice_speak<R: Runtime>(
    app: AppHandle<R>,
    text: String,
    locale: String,
) -> Result<(), String> {
    if text.trim().is_empty() || text.len() > 20_000 {
        return Err("speech text must be between 1 and 20000 bytes".to_string());
    }
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async::<serde_json::Value>(
            "speak",
            VoiceSpeakPayload {
                text: &text,
                locale: &locale,
            },
        )
        .await
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn voice_listen<R: Runtime>(
    app: AppHandle<R>,
    locale: String,
) -> Result<VoiceRecognitionResult, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async("listen", VoiceLocalePayload { locale: &locale })
        .await
        .map_err(|error| error.to_string())
}

/// Record one answer and hand back the audio instead of a transcript.
///
/// This is what makes "capture once, transcribe twice" work on mobile: the
/// microphone path is written once per platform, and the learner's preference
/// only decides who turns the audio into text. Only called when the resolved
/// plan says `cloud` for speech-to-text.
#[cfg(mobile)]
#[tauri::command]
pub async fn voice_capture<R: Runtime>(
    app: AppHandle<R>,
    locale: String,
) -> Result<VoiceCaptureResult, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async("capture", VoiceLocalePayload { locale: &locale })
        .await
        .map_err(|error| error.to_string())
}

/// Play synthesized audio through the session's own audio route.
///
/// Not an `<audio>` element in the WebView: the answer has to come out of the
/// route the session configured (ducking other audio, speaker rather than
/// earpiece) and has to stop when the learner pauses voice mode.
#[cfg(mobile)]
#[tauri::command]
pub async fn voice_play<R: Runtime>(
    app: AppHandle<R>,
    audio_base64: String,
    mime: String,
) -> Result<(), String> {
    if audio_base64.is_empty() {
        return Err("there is no audio to play".to_string());
    }
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async::<serde_json::Value>(
            "playAudio",
            VoicePlayPayload {
                audio_base64: &audio_base64,
                mime: &mime,
            },
        )
        .await
        .map(|_| ())
        .map_err(|error| error.to_string())
}

/// What the device can serve locally for one review language.
#[cfg(mobile)]
#[tauri::command]
pub async fn voice_capabilities<R: Runtime>(
    app: AppHandle<R>,
    locale: String,
) -> Result<VoiceCapabilities, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async("capabilities", VoiceLocalePayload { locale: &locale })
        .await
        .map_err(|error| error.to_string())
}

/// Quality of the voice a session would use, so the UI can point the learner
/// at the one-time download when only a compact voice is installed
/// (ADR 2026-07-31). iOS-only today; Android picks its own installed voice.
#[cfg(mobile)]
#[tauri::command]
pub async fn voice_quality<R: Runtime>(
    app: AppHandle<R>,
    locale: String,
) -> Result<serde_json::Value, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async("voiceQuality", VoiceLocalePayload { locale: &locale })
        .await
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub fn voice_install_data<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("installVoiceData", ())
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub fn voice_open_app_settings<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("openAppSettings", ())
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
/// Voice mode is a mobile feature in this crate; the desktop app has its own
/// engine (desktop/src-tauri/src/voice.rs). These stubs answer for a non-mobile
/// build of the companion so the command surface never 404s.
pub fn voice_check_permissions() -> serde_json::Value {
    serde_json::json!({ "microphone": "unavailable" })
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_request_permissions() -> serde_json::Value {
    serde_json::json!({ "microphone": "unavailable" })
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_start(_locale: String) -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_stop() -> Result<(), String> {
    Ok(())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_speak(_text: String, _locale: String) -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_listen(_locale: String) -> Result<serde_json::Value, String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_quality(_locale: String) -> Result<serde_json::Value, String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_capture(_locale: String) -> Result<serde_json::Value, String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_play(_audio_base64: String, _mime: String) -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_capabilities(_locale: String) -> serde_json::Value {
    serde_json::json!({ "sttLocal": false, "ttsLocal": false })
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_install_data() -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_open_app_settings() -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}
