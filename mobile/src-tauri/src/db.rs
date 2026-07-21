//! libsql-backed database commands.
//!
//! The Rust shell owns the database — a plain local file or an embedded
//! replica of the server database — and the WebView reaches it through
//! these commands. The wire encoding (blobs as `{"$blob": base64}`,
//! everything else as JSON primitives) is documented in
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
    replica: bool,
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
            Some(encoded) => BASE64
                .decode(encoded)
                .map(libsql::Value::Blob)
                .map_err(err),
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
/// `sync_url` and `auth_token` present this becomes an embedded replica of
/// the server database; otherwise it is a plain local file.
#[tauri::command]
pub async fn db_open(
    app: AppHandle,
    state: State<'_, DbState>,
    sync_url: Option<String>,
    auth_token: Option<String>,
) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(err)?;
    std::fs::create_dir_all(&dir).map_err(err)?;
    let path = dir.join("zam.db");

    let (database, replica) = match (sync_url, auth_token) {
        (Some(url), Some(token)) if !url.is_empty() => (
            libsql::Builder::new_remote_replica(path.clone(), url, token)
                .build()
                .await
                .map_err(err)?,
            true,
        ),
        _ => (
            libsql::Builder::new_local(path.clone())
                .build()
                .await
                .map_err(err)?,
            false,
        ),
    };
    let connection = database.connect().map_err(err)?;

    *state.0.lock().await = Some(OpenDatabase {
        database,
        connection,
        replica,
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
pub async fn db_execute_batch(
    state: State<'_, DbState>,
    sql: String,
) -> Result<(), String> {
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;
    open.connection.execute_batch(&sql).await.map_err(err)?;
    Ok(())
}

/// Pull changes from the server database (embedded replicas only).
#[tauri::command]
pub async fn db_sync(state: State<'_, DbState>) -> Result<(), String> {
    let guard = state.0.lock().await;
    let open = guard.as_ref().ok_or("database is not open")?;
    if !open.replica {
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
