#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(target_os = "android")]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "android")]
pub struct Voice<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceLocalePayload<'a> {
    locale: &'a str,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceSpeakPayload<'a> {
    text: &'a str,
    locale: &'a str,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
pub struct VoicePermissionState {
    microphone: Option<String>,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
pub struct VoiceRecognitionResult {
    transcript: String,
}

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("voice")
        .setup(|app, api| {
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "VoicePlugin")?;
            app.manage(Voice(handle));
            Ok(())
        })
        .build()
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn voice_check_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<VoicePermissionState, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin("checkPermissions", ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn voice_request_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<VoicePermissionState, String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async("requestPermissions", ())
        .await
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
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

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn voice_stop<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin_async::<serde_json::Value>("stop", ())
        .await
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
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

#[cfg(target_os = "android")]
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

#[cfg(target_os = "android")]
#[tauri::command]
pub fn voice_install_data<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<Voice<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("installVoiceData", ())
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_check_permissions() -> serde_json::Value {
    serde_json::json!({ "microphone": "denied" })
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_request_permissions() -> serde_json::Value {
    serde_json::json!({ "microphone": "denied" })
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_start(_locale: String) -> Result<(), String> {
    Err("voice mode is only available on Android".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_stop() -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_speak(_text: String, _locale: String) -> Result<(), String> {
    Err("voice mode is only available on Android".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_listen(_locale: String) -> Result<serde_json::Value, String> {
    Err("voice mode is only available on Android".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn voice_install_data() -> Result<(), String> {
    Err("voice mode is only available on Android".to_string())
}
