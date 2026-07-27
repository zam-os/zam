#[cfg(mobile)]
use serde::{Deserialize, Serialize};
#[cfg(mobile)]
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
#[cfg(mobile)]
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "org.zamos.zam";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_reminder);

#[cfg(mobile)]
pub struct Reminder<R: Runtime>(PluginHandle<R>);

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SchedulePayload {
    enabled: bool,
    initial_delay_ms: i64,
}

#[cfg(mobile)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DuePayload {
    count: i64,
}

#[cfg(mobile)]
#[derive(Deserialize, Serialize)]
pub struct ReminderPermissionState {
    notifications: Option<String>,
}

#[cfg(mobile)]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("reminder")
        .setup(|app, api| {
            // Android schedules a WorkManager job; iOS schedules a repeating
            // UNCalendarNotificationTrigger. `initial_delay_ms` is computed in the
            // WebView on both platforms, so the bridge contract is unchanged.
            #[cfg(target_os = "android")]
            let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "ReminderPlugin")?;
            #[cfg(target_os = "ios")]
            let handle = api.register_ios_plugin(init_plugin_reminder)?;
            app.manage(Reminder(handle));
            Ok(())
        })
        .build()
}

#[cfg(mobile)]
#[tauri::command]
pub fn reminder_check_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ReminderPermissionState, String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin("checkPermissions", ())
        .map_err(|error| error.to_string())
}

#[cfg(mobile)]
#[tauri::command]
pub async fn reminder_request_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ReminderPermissionState, String> {
    // Same empty-body NPE as voice: always send a non-null request payload.
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin_async(
            "requestPermissions",
            serde_json::json!({ "permissions": ["notifications"] }),
        )
        .await
        .map_err(|error| error.to_string())
}

/// Schedule (or cancel) the daily due-reminder WorkManager job. `initial_delay_ms`
/// is the wait until the next configured local time, computed in the WebView.
#[cfg(mobile)]
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
#[cfg(mobile)]
#[tauri::command]
pub fn reminder_update_due<R: Runtime>(app: AppHandle<R>, count: i64) -> Result<(), String> {
    app.state::<Reminder<R>>()
        .0
        .run_mobile_plugin::<serde_json::Value>("updateDueCount", DuePayload { count: count.max(0) })
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn reminder_check_permissions() -> serde_json::Value {
    serde_json::json!({ "notifications": "denied" })
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn reminder_request_permissions() -> serde_json::Value {
    serde_json::json!({ "notifications": "denied" })
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn reminder_schedule(_enabled: bool, _initial_delay_ms: i64) -> Result<(), String> {
    Ok(())
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn reminder_update_due(_count: i64) -> Result<(), String> {
    Ok(())
}
