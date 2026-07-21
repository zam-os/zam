mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(db::DbState::default())
        .invoke_handler(tauri::generate_handler![
            db::db_open,
            db::db_query,
            db::db_execute,
            db::db_execute_batch,
            db::db_sync,
            db::db_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running the ZAM mobile shell");
}
