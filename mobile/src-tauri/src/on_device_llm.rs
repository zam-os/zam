#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(target_os = "android")]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "android")]
pub struct OnDeviceLlm<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnDeviceLlmStatus {
    pub status: String,
    pub available: bool,
    pub downloadable: bool,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnDeviceLlmGenerateResult {
    pub text: String,
    pub backend: String,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GeneratePayload<'a> {
    prompt: &'a str,
    max_output_tokens: u32,
    temperature: f32,
}

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("on-device-llm")
        .setup(|app, api| {
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "OnDeviceLlmPlugin")?;
            app.manage(OnDeviceLlm(handle));
            Ok(())
        })
        .build()
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn on_device_llm_check_status<R: Runtime>(
    app: AppHandle<R>,
) -> Result<OnDeviceLlmStatus, String> {
    app.state::<OnDeviceLlm<R>>()
        .0
        .run_mobile_plugin_async("checkStatus", ())
        .await
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn on_device_llm_ensure_ready<R: Runtime>(
    app: AppHandle<R>,
) -> Result<OnDeviceLlmStatus, String> {
    app.state::<OnDeviceLlm<R>>()
        .0
        .run_mobile_plugin_async("ensureReady", ())
        .await
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn on_device_llm_generate<R: Runtime>(
    app: AppHandle<R>,
    prompt: String,
    max_output_tokens: Option<u32>,
    temperature: Option<f32>,
) -> Result<OnDeviceLlmGenerateResult, String> {
    let trimmed = prompt.trim();
    if trimmed.is_empty() || trimmed.len() > 12_000 {
        return Err("prompt must be between 1 and 12000 characters".to_string());
    }
    app.state::<OnDeviceLlm<R>>()
        .0
        .run_mobile_plugin_async(
            "generate",
            GeneratePayload {
                prompt: trimmed,
                // Gemini Nano Prompt API accepts at most 256 output tokens.
                max_output_tokens: max_output_tokens.unwrap_or(256).clamp(1, 256),
                temperature: temperature.unwrap_or(0.2).clamp(0.0, 1.0),
            },
        )
        .await
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn on_device_llm_check_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "status": "unavailable",
        "available": false,
        "downloadable": false,
    }))
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn on_device_llm_ensure_ready() -> Result<serde_json::Value, String> {
    Err("on-device evaluation needs Gemini Nano, which is Android-only; on iOS use a cloud endpoint or rate yourself".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn on_device_llm_generate(
    _prompt: String,
    _max_output_tokens: Option<u32>,
    _temperature: Option<f32>,
) -> Result<serde_json::Value, String> {
    Err("on-device evaluation needs Gemini Nano, which is Android-only; on iOS use a cloud endpoint or rate yourself".to_string())
}
