// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command};
use std::sync::Mutex;
use tauri::Manager;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

fn cli_in(root: &Path) -> PathBuf {
    root.join("dist").join("cli").join("index.js")
}

struct BridgeRuntime {
    node_path: PathBuf,
    cli_path: PathBuf,
    working_dir: PathBuf,
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("USERPROFILE")
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
}

/// Locate the compiled ZAM CLI (`dist/cli/index.js`) independently of the
/// process working directory, so the installed GUI works when launched from
/// the Start menu / Program Files (where the cwd is NOT the repo).
fn resolve_dev_cli_path() -> Option<PathBuf> {
    // 1. Explicit override.
    if let Some(home) = env::var_os("ZAM_HOME") {
        let p = cli_in(&PathBuf::from(home));
        if p.exists() {
            return Some(p);
        }
    }

    // 2. Repo root recorded by the ZAM CLI (`zam ui` writes ~/.zam/cli_path).
    if let Some(h) = home_dir() {
        if let Ok(contents) = fs::read_to_string(h.join(".zam").join("cli_path")) {
            let root = contents.trim();
            if !root.is_empty() {
                let p = cli_in(Path::new(root));
                if p.exists() {
                    return Some(p);
                }
            }
        }
    }

    // 3. Working-directory fallbacks (running from the repo in dev mode).
    if let Ok(cwd) = env::current_dir() {
        for rel in [".", "..", "../.."] {
            let p = cli_in(&cwd.join(rel));
            if p.exists() {
                return Some(p);
            }
        }
    }

    None
}

fn bundled_runtime(app: &tauri::AppHandle) -> Option<BridgeRuntime> {
    let resource_dir = app.path().resource_dir().ok()?;
    let roots = [
        resource_dir.join("resources").join("zam-cli"),
        resource_dir.join("zam-cli"),
    ];

    for root in roots {
        let cli_path = cli_in(&root);
        if !cli_path.exists() {
            continue;
        }

        #[cfg(target_os = "windows")]
        let bundled_node = root.join("runtime").join("node.exe");
        #[cfg(not(target_os = "windows"))]
        let bundled_node = root.join("runtime").join("node");

        let node_path = if bundled_node.exists() {
            bundled_node
        } else {
            PathBuf::from("node")
        };
        return Some(BridgeRuntime {
            node_path,
            cli_path,
            working_dir: root,
        });
    }

    None
}

fn resolve_bridge_runtime(app: &tauri::AppHandle) -> Option<BridgeRuntime> {
    if let Some(runtime) = bundled_runtime(app) {
        return Some(runtime);
    }

    let cli_path = resolve_dev_cli_path()?;
    let working_dir = cli_path
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    Some(BridgeRuntime {
        node_path: env::var_os("ZAM_NODE")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("node")),
        cli_path,
        working_dir,
    })
}

struct PersistentBridge {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    request_counter: u64,
}

#[derive(serde::Serialize)]
struct BridgeRequest {
    id: u64,
    cmd: String,
    args: Vec<String>,
}

#[derive(serde::Deserialize)]
struct BridgeResponse {
    id: Option<u64>,
    result: Option<serde_json::Value>,
    error: Option<String>,
}

#[tauri::command]
fn execute_zam_bridge(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<Option<PersistentBridge>>>,
    cmd: String,
    args: Vec<String>,
) -> Result<String, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;

    // 1. Ensure the persistent bridge process is running.
    let is_alive = if let Some(ref mut bridge) = *lock {
        match bridge.child.try_wait() {
            Ok(None) => true,
            _ => false,
        }
    } else {
        false
    };

    if !is_alive {
        if let Some(mut bridge) = lock.take() {
            let _ = bridge.child.kill();
        }

        let runtime = resolve_bridge_runtime(&app).ok_or_else(|| {
            "Could not locate the ZAM CLI. Reinstall the desktop app, or set \
             ZAM_HOME to a source checkout for development."
                .to_string()
        })?;

        let mut command = Command::new(&runtime.node_path);
        #[cfg(target_os = "windows")]
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW

        command.current_dir(&runtime.working_dir);
        command.arg(&runtime.cli_path);
        command.arg("bridge");
        command.arg("serve");
        command.arg("--stdin");
        
        command.stdin(std::process::Stdio::piped());
        command.stdout(std::process::Stdio::piped());

        let mut child = command.spawn().map_err(|e| format!("Failed to spawn ZAM CLI: {}", e))?;
        let stdin = child.stdin.take().ok_or_else(|| "Failed to open stdin".to_string())?;
        let stdout = child.stdout.take().ok_or_else(|| "Failed to open stdout".to_string())?;
        let stdout_reader = BufReader::new(stdout);

        *lock = Some(PersistentBridge {
            child,
            stdin,
            stdout: stdout_reader,
            request_counter: 0,
        });
    }

    // 2. Perform the request-response transaction.
    let bridge = lock.as_mut().unwrap();
    bridge.request_counter += 1;
    let req_id = bridge.request_counter;

    let request = BridgeRequest {
        id: req_id,
        cmd,
        args,
    };

    let mut payload = serde_json::to_string(&request).map_err(|e| e.to_string())?;
    payload.push('\n');

    if let Err(err) = bridge.stdin.write_all(payload.as_bytes()) {
        let _ = bridge.child.kill();
        *lock = None;
        return Err(format!("Failed to write to bridge stdin: {}", err));
    }
    if let Err(err) = bridge.stdin.flush() {
        let _ = bridge.child.kill();
        *lock = None;
        return Err(format!("Failed to flush bridge stdin: {}", err));
    }

    // Read responses line-by-line until we find our request ID.
    let mut line = String::new();
    loop {
        line.clear();
        match bridge.stdout.read_line(&mut line) {
            Ok(0) => {
                let _ = bridge.child.kill();
                *lock = None;
                return Err("Bridge connection closed".to_string());
            }
            Ok(_) => {
                if let Ok(resp) = serde_json::from_str::<BridgeResponse>(&line) {
                    if resp.id == Some(req_id) {
                        if let Some(err_msg) = resp.error {
                            return Err(err_msg);
                        }
                        if let Some(res_val) = resp.result {
                            let serialized = serde_json::to_string(&res_val).map_err(|e| e.to_string())?;
                            return Ok(serialized);
                        }
                        return Ok("".to_string());
                    }
                }
                eprintln!("[ZAM Bridge Stream Debug] {}", line.trim_end());
            }
            Err(err) => {
                let _ = bridge.child.kill();
                *lock = None;
                return Err(format!("Failed to read from bridge stdout: {}", err));
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            app.manage(Mutex::new(None::<PersistentBridge>));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![execute_zam_bridge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
