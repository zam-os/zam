#[cfg(mobile)]
use serde::{Deserialize, Serialize};
#[cfg(mobile)]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(mobile)]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_secure_pairing);

#[cfg(mobile)]
pub struct SecurePairing<R: Runtime>(PluginHandle<R>);

#[cfg(mobile)]
#[derive(Serialize)]
struct SavePayload<'a> {
    payload: &'a str,
}

#[cfg(mobile)]
#[derive(Deserialize)]
struct LoadPayload {
    payload: Option<String>,
}

#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedImportPayload {
    content: String,
    mime_type: Option<String>,
}

#[cfg(mobile)]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("secure-pairing")
        .setup(|app, api| {
            // Android keeps the payload in an AES-GCM envelope whose key lives in
            // the Android Keystore; iOS delegates the same contract to the
            // Keychain. Both sides answer the identical `save`/`load`/`clear`
            // command names, so only the registration differs.
            #[cfg(target_os = "android")]
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "SecurePairingPlugin")?;
            #[cfg(target_os = "ios")]
            let handle = api.register_ios_plugin(init_plugin_secure_pairing)?;
            app.manage(SecurePairing(handle));
            Ok(())
        })
        .build()
}

#[cfg(mobile)]
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

#[cfg(mobile)]
#[tauri::command]
pub fn pairing_load<R: Runtime>(app: AppHandle<R>) -> Result<Option<String>, String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<LoadPayload>("load", ())
        .map(|result| result.payload)
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub fn pairing_clear<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("clear", ())
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub fn shared_import_take<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Option<SharedImportPayload>, String> {
    app.state::<SecurePairing<R>>()
        .0
        .run_mobile_plugin::<Option<SharedImportPayload>>("takeShared", ())
        .map_err(|error| error.to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn pairing_save(_payload: String) -> Result<(), String> {
    Err("secure pairing storage is only available on mobile".to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn pairing_load() -> Result<Option<String>, String> {
    Ok(None)
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn pairing_clear() -> Result<(), String> {
    Ok(())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn shared_import_take() -> Result<Option<serde_json::Value>, String> {
    Ok(None)
}
