mod db;
mod on_device_llm;
mod reminder;
mod secure_store;
mod update;
mod vision;
mod voice;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(secure_store::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(voice::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(reminder::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(on_device_llm::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(update::init());

    builder
        .manage(db::DbState::default())
        .invoke_handler(tauri::generate_handler![
            db::db_open,
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
            vision::vision_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running the ZAM mobile shell");
}
