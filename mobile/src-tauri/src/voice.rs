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
#[derive(Deserialize, Serialize)]
pub struct VoiceRecognitionResult {
    transcript: String,
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
pub fn voice_install_data() -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn voice_open_app_settings() -> Result<(), String> {
    Err("voice mode is not available in this build".to_string())
}
