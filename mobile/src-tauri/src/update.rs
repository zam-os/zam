#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(target_os = "android")]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

/// Default field-test channel: published with each GitHub Release.
#[allow(dead_code)] // referenced by the Android command path and unit tests
pub const DEFAULT_MOBILE_UPDATE_MANIFEST: &str =
    "https://github.com/zam-os/zam/releases/latest/download/mobile-latest.json";

#[cfg(target_os = "android")]
pub struct Update<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppVersionInfo {
    pub version_name: String,
    pub version_code: i64,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub version: String,
    pub version_code: i64,
    pub url: String,
    pub notes: String,
    pub current_version_name: String,
    pub current_version_code: i64,
    pub update_available: bool,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestUrlPayload<'a> {
    url: &'a str,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallUrlPayload<'a> {
    url: &'a str,
}

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("update")
        .setup(|app, api| {
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "UpdatePlugin")?;
            app.manage(Update(handle));
            Ok(())
        })
        .build()
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn update_get_version<R: Runtime>(app: AppHandle<R>) -> Result<AppVersionInfo, String> {
    app.state::<Update<R>>()
        .0
        .run_mobile_plugin("getVersion", ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn update_check<R: Runtime>(
    app: AppHandle<R>,
    manifest_url: Option<String>,
) -> Result<UpdateCheckResult, String> {
    let url = manifest_url
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_MOBILE_UPDATE_MANIFEST.to_string());
    if !url.starts_with("https://") {
        return Err("update manifest URL must be https".to_string());
    }
    app.state::<Update<R>>()
        .0
        .run_mobile_plugin_async("check", ManifestUrlPayload { url: &url })
        .await
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn update_install<R: Runtime>(
    app: AppHandle<R>,
    url: String,
) -> Result<serde_json::Value, String> {
    if !url.starts_with("https://") {
        return Err("APK URL must be https".to_string());
    }
    app.state::<Update<R>>()
        .0
        .run_mobile_plugin_async("install", InstallUrlPayload { url: &url })
        .await
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn update_get_version() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "versionName": env!("CARGO_PKG_VERSION"),
        "versionCode": 0,
    }))
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn update_check(
    _manifest_url: Option<String>,
) -> Result<serde_json::Value, String> {
    Err("in-app updates are Android-only; iOS builds update through TestFlight".to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn update_install(_url: String) -> Result<serde_json::Value, String> {
    Err("in-app updates are Android-only; iOS builds update through TestFlight".to_string())
}

#[cfg(test)]
mod tests {
    use super::DEFAULT_MOBILE_UPDATE_MANIFEST;

    #[test]
    fn default_manifest_is_https_github_release() {
        assert!(DEFAULT_MOBILE_UPDATE_MANIFEST.starts_with("https://github.com/zam-os/zam/"));
        assert!(DEFAULT_MOBILE_UPDATE_MANIFEST.ends_with("mobile-latest.json"));
    }
}
