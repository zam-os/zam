mod db;
mod secure_store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(secure_store::init());

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
            secure_store::pairing_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running the ZAM mobile shell");
}
