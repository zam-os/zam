//! libsql-backed database commands.
//!
//! The Rust shell owns the database — a plain local file or an
//! offline-writable synced copy of the server database — and the WebView
//! reaches it through these commands. The wire encoding (blobs as
//! `{"$blob": base64}`, everything else as JSON primitives) is documented in
//! `mobile/src/provider.ts` and mirrored by the test stub in
//! `tests/helpers/tauri-invoke-stub.ts`; the three must stay in sync.

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine as _;
use serde::Serialize;
use serde_json::{json, Map, Value as Json};
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

#[derive(Default)]
pub struct DbState(Mutex<Option<OpenDatabase>>);

struct OpenDatabase {
    database: libsql::Database,
    connection: libsql::Connection,
    synced: bool,
}

#[derive(Debug, PartialEq)]
enum DatabaseMode {
    Local,
    Synced { url: String, auth_token: String },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteResult {
    changes: u64,
    last_insert_rowid: i64,
}

fn err(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn database_mode(
    sync_url: Option<String>,
    auth_token: Option<String>,
) -> Result<DatabaseMode, String> {
    let url = sync_url
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());
    let token = auth_token
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());

    match (url, token) {
        (None, None) => Ok(DatabaseMode::Local),
        (Some(url), Some(auth_token)) => Ok(DatabaseMode::Synced { url, auth_token }),
        _ => Err("sync URL and auth token must be provided together".to_string()),
    }
}

fn to_libsql(value: &Json, index: usize) -> Result<libsql::Value, String> {
    match value {
        Json::Null => Ok(libsql::Value::Null),
        Json::String(text) => Ok(libsql::Value::Text(text.clone())),
        Json::Number(number) => {
            if let Some(integer) = number.as_i64() {
                Ok(libsql::Value::Integer(integer))
            } else if let Some(real) = number.as_f64() {
                Ok(libsql::Value::Real(real))
            } else {
                Err(format!("parameter {}: unsupported number", index + 1))
            }
        }
        Json::Object(map) => match map.get("$blob").and_then(Json::as_str) {
            Some(encoded) => BASE64.decode(encoded).map(libsql::Value::Blob).map_err(err),
            None => Err(format!(
                "parameter {}: objects cannot be bound to SQLite",
                index + 1
            )),
        },
        Json::Bool(_) | Json::Array(_) => Err(format!(
            "parameter {}: cannot bind this value to SQLite",
            index + 1
        )),
    }
}

fn to_json(value: libsql::Value) -> Json {
    match value {
        libsql::Value::Null => Json::Null,
        libsql::Value::Integer(integer) => json!(integer),
        libsql::Value::Real(real) => json!(real),
        libsql::Value::Text(text) => json!(text),
        libsql::Value::Blob(bytes) => json!({ "$blob": BASE64.encode(bytes) }),
    }
}

fn convert_params(params: &[Json]) -> Result<Vec<libsql::Value>, String> {
    params
        .iter()
        .enumerate()
        .map(|(index, value)| to_libsql(value, index))
        .collect()
}

/// Open (or reopen) the database at the app-data directory. With both
/// `sync_url` and `auth_token` present this becomes an offline-writable
/// synced database; otherwise it is a separate plain local file.
#[tauri::command]
pub async fn db_open(
    app: AppHandle,
    state: State<'_, DbState>,
    sync_url: Option<String>,
    auth_token: Option<String>,
) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(err)?;
    std::fs::create_dir_all(&dir).map_err(err)?;
    let (path, database, synced) = match database_mode(sync_url, auth_token)? {
        DatabaseMode::Synced { url, auth_token } => {
            // Keep development-only local databases separate: libsql sync
            // metadata is tied to the database file and cannot safely reuse
            // an arbitrary local SQLite file.
            let path = dir.join("zam-sync.db");
            let needs_bootstrap = !path.exists();
            let builder = libsql::Builder::new_synced_database(path.clone(), url, auth_token);
            #[cfg(target_os = "android")]
            let builder = builder.connector(
                hyper_rustls::HttpsConnectorBuilder::new()
                    .with_webpki_roots()
                    .https_or_http()
                    .enable_http1()
                    .build(),
            );
            let database = builder.build().await.map_err(err)?;

            // The initial bootstrap may replace the database file, so it must
            // happen before creating the first connection. Existing synced
            // databases open locally first and remain usable without network.
            if needs_bootstrap {
                database.sync().await.map_err(err)?;
            }
            (path, database, true)
        }
        DatabaseMode::Local => {
            let path = dir.join("zam-local.db");
            let database = libsql::Builder::new_local(path.clone())
                .build()
                .await
                .map_err(err)?;
            (path, database, false)
        }
    };
    let connection = database.connect().map_err(err)?;

    *state.0.lock().await = Some(OpenDatabase {
        database,
        connection,
        synced,
    });
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn db_query(
    state: State<'_, DbState>,
    sql: String,
    params: Vec<Json>,
) -> Result<Vec<Map<String, Json>>, String> {
    let values = convert_params(&params)?;
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;

    let mut rows = open
        .connection
        .query(&sql, libsql::params_from_iter(values))
        .await
        .map_err(err)?;
    let column_count = rows.column_count();
    let names: Vec<String> = (0..column_count)
        .map(|i| rows.column_name(i).unwrap_or_default().to_string())
        .collect();

    let mut result = Vec::new();
    while let Some(row) = rows.next().await.map_err(err)? {
        let mut object = Map::new();
        for i in 0..column_count {
            let value = row.get_value(i).map_err(err)?;
            object.insert(names[i as usize].clone(), to_json(value));
        }
        result.push(object);
    }
    Ok(result)
}

#[tauri::command]
pub async fn db_execute(
    state: State<'_, DbState>,
    sql: String,
    params: Vec<Json>,
) -> Result<ExecuteResult, String> {
    let values = convert_params(&params)?;
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;

    let changes = open
        .connection
        .execute(&sql, libsql::params_from_iter(values))
        .await
        .map_err(err)?;
    Ok(ExecuteResult {
        changes,
        last_insert_rowid: open.connection.last_insert_rowid(),
    })
}

#[tauri::command]
pub async fn db_execute_batch(state: State<'_, DbState>, sql: String) -> Result<(), String> {
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;
    open.connection.execute_batch(&sql).await.map_err(err)?;
    Ok(())
}

/// Push local changes and pull remote changes (synced databases only).
#[tauri::command]
pub async fn db_sync(state: State<'_, DbState>) -> Result<(), String> {
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;
    if !open.synced {
        return Err("database is local-only; nothing to sync".to_string());
    }
    open.database.sync().await.map_err(err)?;
    Ok(())
}

#[tauri::command]
pub async fn db_close(state: State<'_, DbState>) -> Result<(), String> {
    *state.0.lock().await = None;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{database_mode, DatabaseMode};

    #[test]
    fn accepts_local_mode_when_both_sync_fields_are_absent() {
        assert_eq!(database_mode(None, None).unwrap(), DatabaseMode::Local);
    }

    #[test]
    fn trims_and_accepts_complete_sync_credentials() {
        assert_eq!(
            database_mode(
                Some("  libsql://example.turso.io  ".to_string()),
                Some("  secret  ".to_string()),
            )
            .unwrap(),
            DatabaseMode::Synced {
                url: "libsql://example.turso.io".to_string(),
                auth_token: "secret".to_string(),
            },
        );
    }

    #[test]
    fn rejects_partial_sync_credentials() {
        assert!(database_mode(Some("libsql://example".to_string()), None).is_err());
        assert!(database_mode(None, Some("secret".to_string())).is_err());
        assert!(database_mode(Some("  ".to_string()), Some("secret".to_string())).is_err());
    }
}
