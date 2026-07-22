#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(target_os = "android")]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "android")]
pub struct SecurePairing<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
#[derive(Serialize)]
struct SavePayload<'a> {
    payload: &'a str,
}

#[cfg(target_os = "android")]
#[derive(Deserialize)]
struct LoadPayload {
    payload: Option<String>,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedImportPayload {
    content: String,
    mime_type: Option<String>,
}

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("secure-pairing")
        .setup(|app, api| {
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "SecurePairingPlugin")?;
            app.manage(SecurePairing(handle));
            Ok(())
        })
        .build()
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn pairing_save<R: Runtime>(app: AppHandle<R>, payload: String) -> Result<(), String> {
    if payload.is_empty() || payload.len() > 2_000 {
        return Err("pairing payload must be between 1 and 2000 bytes".to_string());
    }
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("save", SavePayload { payload: &payload })
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn pairing_load<R: Runtime>(app: AppHandle<R>) -> Result<Option<String>, String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<LoadPayload>("load", ())
        .map(|result| result.payload)
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn pairing_clear<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("clear", ())
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn shared_import_take<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Option<SharedImportPayload>, String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<Option<SharedImportPayload>>("takeShared", ())
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn pairing_save(_payload: String) -> Result<(), String> {
    Err("secure pairing storage is only available on Android".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn pairing_load() -> Result<Option<String>, String> {
    Ok(None)
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn pairing_clear() -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn shared_import_take() -> Result<Option<serde_json::Value>, String> {
    Ok(None)
}
