mod curriculum;
mod db;
mod on_device_llm;
mod reminder;
mod secure_store;
mod update;
mod vision;
mod voice;

/// Which Android-only subsystems this build actually has.
///
/// The iOS target compiles stubs for voice, in-app update and on-device
/// evaluation, and a stub answers — it just cannot do the thing. Without this
/// the UI offered all three on iPadOS: voice mode reported a denied microphone
/// permission, and "check for updates" failed by design. The frontend asks
/// here and hides what cannot work, rather than letting the user discover it.
#[tauri::command]
fn platform_features() -> serde_json::Value {
    let android = cfg!(target_os = "android");
    serde_json::json!({
        // Voice review runs on both mobile platforms (ADR 2026-07-31): Android
        // through a foreground service, iOS only while ZAM is frontmost.
        "voice": cfg!(mobile),
        // Android holds the session through a foreground service and a partial
        // wake lock, so review continues with the screen off — that is the
        // point of hands-free. iOS hands the microphone back the moment the app
        // leaves the foreground, so the WebView must end the session instead of
        // leaving it waiting for audio that can never arrive.
        "voiceSurvivesBackground": android,
        "inAppUpdate": android,
        "onDeviceEvaluation": android,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    // Pairing storage and daily reminders exist on both mobile platforms.
    #[cfg(mobile)]
    let builder = builder.plugin(secure_store::init());
    #[cfg(mobile)]
    let builder = builder.plugin(reminder::init());
    // Voice review exists on both mobile platforms (ADR 2026-07-31).
    #[cfg(mobile)]
    let builder = builder.plugin(voice::init());
    // Android-only: the on-device evaluator is Gemini Nano via AICore, and the
    // update channel sideloads an APK. Neither has an iOS counterpart — see
    // ADR 2026-07-26. Their stubs still answer on iOS, so the UI must ask
    // `platform_features` and hide the controls; an answering stub is not the
    // same as a feature.
    #[cfg(target_os = "android")]
    let builder = builder.plugin(on_device_llm::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(update::init());

    builder
        .manage(db::DbState::default())
        .invoke_handler(tauri::generate_handler![
            platform_features,
            db::db_open,
            db::db_describe,
            db::db_query,
            db::db_execute,
            db::db_execute_batch,
            db::db_sync,
            db::db_close,
            secure_store::pairing_save,
            secure_store::pairing_load,
            secure_store::pairing_clear,
            secure_store::shared_import_take,
            voice::voice_check_permissions,
            voice::voice_request_permissions,
            voice::voice_start,
            voice::voice_stop,
            voice::voice_speak,
            voice::voice_listen,
            voice::voice_quality,
            voice::voice_capture,
            voice::voice_play,
            voice::voice_capabilities,
            voice::voice_install_data,
            voice::voice_open_app_settings,
            reminder::reminder_check_permissions,
            reminder::reminder_request_permissions,
            reminder::reminder_schedule,
            reminder::reminder_update_due,
            on_device_llm::on_device_llm_check_status,
            on_device_llm::on_device_llm_ensure_ready,
            on_device_llm::on_device_llm_generate,
            update::update_get_version,
            update::update_check,
            update::update_install,
            vision::vision_request,
            curriculum::curriculum_source_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running the ZAM mobile shell");
}
