#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(target_os = "android")]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "android")]
pub struct Reminder<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SchedulePayload {
    enabled: bool,
    initial_delay_ms: i64,
}

#[cfg(target_os = "android")]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DuePayload {
    count: i64,
}

#[cfg(target_os = "android")]
#[derive(Deserialize, Serialize)]
pub struct ReminderPermissionState {
    notifications: Option<String>,
}

#[cfg(target_os = "android")]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("reminder")
        .setup(|app, api| {
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "ReminderPlugin")?;
            app.manage(Reminder(handle));
            Ok(())
        })
        .build()
}

#[cfg(target_os = "android")]
#[tauri::command]
pub fn reminder_check_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ReminderPermissionState, String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin("checkPermissions", ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn reminder_request_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ReminderPermissionState, String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin_async("requestPermissions", ())
        .await
        .map_err(|error| error.to_string())
}

/// Schedule (or cancel) the daily due-reminder WorkManager job. `initial_delay_ms`
/// is the wait until the next configured local time, computed in the WebView.
#[cfg(target_os = "android")]
#[tauri::command]
pub fn reminder_schedule<R: Runtime>(
    app: AppHandle<R>,
    enabled: bool,
    initial_delay_ms: i64,
) -> Result<(), String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>(
            "schedule",
            SchedulePayload {
                enabled,
                initial_delay_ms: initial_delay_ms.max(0),
            },
        )
        .map(|_| ())
        .map_err(|error| error.to_string())
}

/// Store the latest due count so the worker can render it without database access.
#[cfg(target_os = "android")]
#[tauri::command]
pub fn reminder_update_due<R: Runtime>(app: AppHandle<R>, count: i64) -> Result<(), String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("updateDueCount", DuePayload { count: count.max(0) })
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn reminder_check_permissions() -> serde_json::Value {
    serde_json::json!({ "notifications": "denied" })
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn reminder_request_permissions() -> serde_json::Value {
    serde_json::json!({ "notifications": "denied" })
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn reminder_schedule(_enabled: bool, _initial_delay_ms: i64) -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub fn reminder_update_due(_count: i64) -> Result<(), String> {
    Ok(())
}
