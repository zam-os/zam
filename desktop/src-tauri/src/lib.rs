// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
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

struct ObserverRuntime {
    executable_path: PathBuf,
    working_dir: PathBuf,
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("USERPROFILE")
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
}

/// Append a diagnostic line to ~/.zam/desktop-bridge.rust.log. A windowed app
/// discards stdout/stderr, so this file is the only way to see how the bridge
/// process is resolved and spawned when launched from the GUI. Best-effort.
fn diag_log(msg: &str) {
    if let Some(home) = home_dir() {
        let dir = home.join(".zam");
        let _ = fs::create_dir_all(&dir);
        if let Ok(mut f) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(dir.join("desktop-bridge.rust.log"))
        {
            let _ = writeln!(f, "[{}] {}", chrono_now(), msg);
        }
    }
}

/// Minimal timestamp without pulling in a date crate.
fn chrono_now() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
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

/// Strip the Windows `\\?\` verbatim (extended-length) path prefix.
/// Tauri's `resource_dir()` can return verbatim paths, but Node's module loader
/// cannot resolve a main script whose path starts with `\\?\` — it fails with
/// `EISDIR: illegal operation on a directory, lstat 'C:'`, crashing the spawned
/// bridge before any CLI code runs. Returning a normal path keeps it loadable.
fn strip_verbatim(p: PathBuf) -> PathBuf {
    let s = p.to_string_lossy();
    if let Some(rest) = s.strip_prefix(r"\\?\UNC\") {
        return PathBuf::from(format!(r"\\{}", rest));
    }
    if let Some(rest) = s.strip_prefix(r"\\?\") {
        return PathBuf::from(rest.to_string());
    }
    p
}

fn bundled_runtime(app: &tauri::AppHandle) -> Option<BridgeRuntime> {
    let resource_dir = strip_verbatim(app.path().resource_dir().ok()?);
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

fn observer_target_triple() -> &'static str {
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        "x86_64-pc-windows-msvc"
    }
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    {
        "aarch64-pc-windows-msvc"
    }
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    {
        "x86_64-unknown-linux-gnu"
    }
    #[cfg(not(any(
        all(target_os = "windows", target_arch = "x86_64"),
        all(target_os = "windows", target_arch = "aarch64"),
        all(target_os = "linux", target_arch = "x86_64")
    )))]
    {
        "unsupported"
    }
}

fn observer_executable_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "zam-observer.exe"
    }
    #[cfg(not(target_os = "windows"))]
    {
        "zam-observer"
    }
}

fn resolve_observer_runtime(app: &tauri::AppHandle) -> Option<ObserverRuntime> {
    if let Some(path) = env::var_os("ZAM_OBSERVER") {
        let executable_path = PathBuf::from(path);
        if executable_path.exists() {
            let working_dir = executable_path
                .parent()
                .map(Path::to_path_buf)
                .unwrap_or_else(|| PathBuf::from("."));
            return Some(ObserverRuntime {
                executable_path,
                working_dir,
            });
        }
    }

    let target = observer_target_triple();
    if target != "unsupported" {
        if let Ok(resource_dir) = app.path().resource_dir() {
            let resource_dir = strip_verbatim(resource_dir);
            let candidates = [
                resource_dir
                    .join("resources")
                    .join("zam-observer")
                    .join(target)
                    .join(observer_executable_name()),
                resource_dir
                    .join("zam-observer")
                    .join(target)
                    .join(observer_executable_name()),
            ];

            for executable_path in candidates {
                if executable_path.exists() {
                    let working_dir = executable_path
                        .parent()
                        .map(Path::to_path_buf)
                        .unwrap_or_else(|| PathBuf::from("."));
                    return Some(ObserverRuntime {
                        executable_path,
                        working_dir,
                    });
                }
            }
        }
    }

    if let Ok(cwd) = env::current_dir() {
        let candidates = [
            cwd.join("observer")
                .join("target")
                .join("debug")
                .join(observer_executable_name()),
            cwd.join("..")
                .join("observer")
                .join("target")
                .join("debug")
                .join(observer_executable_name()),
            cwd.join("observer")
                .join("target")
                .join(target)
                .join("release")
                .join(observer_executable_name()),
            cwd.join("..")
                .join("observer")
                .join("target")
                .join(target)
                .join("release")
                .join(observer_executable_name()),
        ];

        for executable_path in candidates {
            if executable_path.exists() {
                let working_dir = executable_path
                    .parent()
                    .map(Path::to_path_buf)
                    .unwrap_or_else(|| PathBuf::from("."));
                return Some(ObserverRuntime {
                    executable_path,
                    working_dir,
                });
            }
        }
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

#[tauri::command]
async fn probe_zam_observer(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || probe_zam_observer_blocking(&app))
        .await
        .map_err(|e| format!("Observer probe task failed: {}", e))?
}

fn probe_zam_observer_blocking(app: &tauri::AppHandle) -> Result<String, String> {
    run_zam_observer_blocking(app, &["probe"])
}

#[tauri::command]
async fn list_zam_observer_windows(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || list_zam_observer_windows_blocking(&app))
        .await
        .map_err(|e| format!("Observer window list task failed: {}", e))?
}

fn list_zam_observer_windows_blocking(app: &tauri::AppHandle) -> Result<String, String> {
    run_zam_observer_blocking(app, &["list-windows"])
}

#[tauri::command]
async fn foreground_zam_observer_window(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || foreground_zam_observer_window_blocking(&app))
        .await
        .map_err(|e| format!("Observer foreground window task failed: {}", e))?
}

fn foreground_zam_observer_window_blocking(app: &tauri::AppHandle) -> Result<String, String> {
    run_zam_observer_blocking(app, &["foreground-window"])
}

#[tauri::command]
async fn watch_zam_observer_foreground(
    app: tauri::AppHandle,
    session: String,
    samples: String,
    interval_ms: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        watch_zam_observer_foreground_blocking(&app, session, samples, interval_ms)
    })
    .await
    .map_err(|e| format!("Observer foreground watch task failed: {}", e))?
}

fn watch_zam_observer_foreground_blocking(
    app: &tauri::AppHandle,
    session: String,
    samples: String,
    interval_ms: String,
) -> Result<String, String> {
    let args = vec![
        "watch-foreground".to_string(),
        "--session".to_string(),
        session,
        "--samples".to_string(),
        samples,
        "--interval-ms".to_string(),
        interval_ms,
    ];
    run_zam_observer_blocking_owned(app, &args)
}

#[tauri::command]
async fn pick_zam_observer_window(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || pick_zam_observer_window_blocking(&app))
        .await
        .map_err(|e| format!("Observer window picker task failed: {}", e))?
}

fn pick_zam_observer_window_blocking(app: &tauri::AppHandle) -> Result<String, String> {
    run_zam_observer_blocking(app, &["pick-window"])
}

#[tauri::command]
async fn capture_zam_observer_once(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || capture_zam_observer_once_blocking(&app))
        .await
        .map_err(|e| format!("Observer capture task failed: {}", e))?
}

fn capture_zam_observer_once_blocking(app: &tauri::AppHandle) -> Result<String, String> {
    run_zam_observer_blocking(app, &["capture-once"])
}

#[tauri::command]
async fn capture_zam_observer_window(
    app: tauri::AppHandle,
    hwnd: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || capture_zam_observer_window_blocking(&app, hwnd))
        .await
        .map_err(|e| format!("Observer window capture task failed: {}", e))?
}

fn capture_zam_observer_window_blocking(
    app: &tauri::AppHandle,
    hwnd: String,
) -> Result<String, String> {
    let args = vec!["capture-window".to_string(), "--hwnd".to_string(), hwnd];
    run_zam_observer_blocking_owned(app, &args)
}

#[tauri::command]
async fn sample_zam_observer_window(
    app: tauri::AppHandle,
    hwnd: String,
    frames: String,
    interval_ms: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        sample_zam_observer_window_blocking(&app, hwnd, frames, interval_ms)
    })
    .await
    .map_err(|e| format!("Observer window sample task failed: {}", e))?
}

fn sample_zam_observer_window_blocking(
    app: &tauri::AppHandle,
    hwnd: String,
    frames: String,
    interval_ms: String,
) -> Result<String, String> {
    let args = vec![
        "sample-window".to_string(),
        "--hwnd".to_string(),
        hwnd,
        "--frames".to_string(),
        frames,
        "--interval-ms".to_string(),
        interval_ms,
    ];
    run_zam_observer_blocking_owned(app, &args)
}

#[tauri::command]
async fn snapshot_zam_observer_window(
    app: tauri::AppHandle,
    hwnd: String,
    output: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        snapshot_zam_observer_window_blocking(&app, hwnd, output)
    })
    .await
    .map_err(|e| format!("Observer window snapshot task failed: {}", e))?
}

fn snapshot_zam_observer_window_blocking(
    app: &tauri::AppHandle,
    hwnd: String,
    output: String,
) -> Result<String, String> {
    let args = vec![
        "snapshot-window".to_string(),
        "--hwnd".to_string(),
        hwnd,
        "--output".to_string(),
        output,
    ];
    run_zam_observer_blocking_owned(app, &args)
}

fn run_zam_observer_blocking(app: &tauri::AppHandle, args: &[&str]) -> Result<String, String> {
    let args: Vec<String> = args.iter().map(|arg| (*arg).to_string()).collect();
    run_zam_observer_blocking_owned(app, &args)
}

fn run_zam_observer_blocking_owned(
    app: &tauri::AppHandle,
    args: &[String],
) -> Result<String, String> {
    let runtime = resolve_observer_runtime(app).ok_or_else(|| {
        "Could not locate the ZAM observer sidecar. Reinstall the desktop app, \
         build observer/Cargo.toml, or set ZAM_OBSERVER to the executable path."
            .to_string()
    })?;

    let mut command = Command::new(&runtime.executable_path);
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    command.current_dir(&runtime.working_dir);
    command.args(args);
    command.stdout(std::process::Stdio::piped());
    command.stderr(std::process::Stdio::piped());

    let output = command
        .output()
        .map_err(|e| format!("Failed to run ZAM observer: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "ZAM observer command failed with status {}: {}",
            output.status,
            stderr.trim()
        ));
    }

    String::from_utf8(output.stdout).map_err(|e| format!("Invalid observer output: {}", e))
}

struct PersistentBridge {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    request_counter: u64,
}

struct BridgeState {
    bridge: Mutex<Option<PersistentBridge>>,
    active_pid: AtomicU32,
}

impl BridgeState {
    fn new() -> Self {
        Self {
            bridge: Mutex::new(None),
            active_pid: AtomicU32::new(0),
        }
    }
}

struct ActiveRequestGuard<'a>(&'a AtomicU32);

impl Drop for ActiveRequestGuard<'_> {
    fn drop(&mut self) {
        self.0.store(0, Ordering::SeqCst);
    }
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
async fn execute_zam_bridge(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<BridgeState>>,
    cmd: String,
    args: Vec<String>,
) -> Result<String, String> {
    let state = Arc::clone(state.inner());
    tauri::async_runtime::spawn_blocking(move || {
        execute_zam_bridge_blocking(&app, &state, cmd, args)
    })
    .await
    .map_err(|e| format!("Bridge task failed: {}", e))?
}

fn execute_zam_bridge_blocking(
    app: &tauri::AppHandle,
    state: &BridgeState,
    cmd: String,
    args: Vec<String>,
) -> Result<String, String> {
    let mut lock = state.bridge.lock().map_err(|e| e.to_string())?;

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

        diag_log(&format!(
            "spawning bridge | home={:?} | cwd={:?}",
            home_dir(),
            env::current_dir().ok()
        ));

        let runtime = match resolve_bridge_runtime(&app) {
            Some(r) => r,
            None => {
                diag_log("resolve_bridge_runtime returned None — CLI not found");
                return Err("Could not locate the ZAM CLI. Reinstall the desktop \
                    app, or set ZAM_HOME to a source checkout for development."
                    .to_string());
            }
        };

        diag_log(&format!(
            "runtime resolved | node={:?} | cli={:?} | working_dir={:?}",
            runtime.node_path, runtime.cli_path, runtime.working_dir
        ));

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

        // A windowed app discards the child's inherited stderr, so a node crash
        // on startup would be invisible. Capture it to a log file so bridge
        // failures that only happen under the GUI are diagnosable.
        if let Some(home) = home_dir() {
            let log_dir = home.join(".zam");
            let _ = fs::create_dir_all(&log_dir);
            if let Ok(file) = fs::File::create(log_dir.join("desktop-bridge.stderr.log")) {
                command.stderr(std::process::Stdio::from(file));
            }
        }

        let mut child = match command.spawn() {
            Ok(c) => {
                diag_log(&format!("spawn OK | pid={}", c.id()));
                c
            }
            Err(e) => {
                diag_log(&format!("spawn FAILED: {}", e));
                return Err(format!("Failed to spawn ZAM CLI: {}", e));
            }
        };
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to open stdin".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to open stdout".to_string())?;
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
    state.active_pid.store(bridge.child.id(), Ordering::SeqCst);
    let _active_request = ActiveRequestGuard(&state.active_pid);
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
                            let serialized =
                                serde_json::to_string(&res_val).map_err(|e| e.to_string())?;
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

#[tauri::command]
fn cancel_zam_bridge(state: tauri::State<'_, Arc<BridgeState>>) -> Result<bool, String> {
    let pid = state.active_pid.swap(0, Ordering::SeqCst);
    if pid == 0 {
        return Ok(false);
    }

    #[cfg(target_os = "windows")]
    let status = {
        let mut command = Command::new("taskkill");
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
        command.args(["/PID", &pid.to_string(), "/F"]).status()
    };

    #[cfg(not(target_os = "windows"))]
    let status = Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .status();

    match status {
        Ok(result) if result.success() => Ok(true),
        Ok(result) => Err(format!(
            "Failed to cancel bridge process {} (status {})",
            pid, result
        )),
        Err(err) => Err(format!("Failed to cancel bridge process {}: {}", pid, err)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Enforce a single running instance. A second launch focuses the existing
    // window instead of opening another GUI (and another bridge daemon).
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            app.manage(Arc::new(BridgeState::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            execute_zam_bridge,
            cancel_zam_bridge,
            probe_zam_observer,
            list_zam_observer_windows,
            foreground_zam_observer_window,
            watch_zam_observer_foreground,
            pick_zam_observer_window,
            capture_zam_observer_once,
            capture_zam_observer_window,
            sample_zam_observer_window,
            snapshot_zam_observer_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
