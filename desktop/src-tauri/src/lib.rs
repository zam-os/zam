// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStderr, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

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

fn read_package_version(dir: &Path) -> Option<String> {
    let content = fs::read_to_string(dir.join("package.json")).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    json.get("version").and_then(|v| v.as_str()).map(|s| s.to_string())
}

fn resolve_bridge_runtime(app: &tauri::AppHandle) -> Option<BridgeRuntime> {
    // Prefer an explicit developer checkout (ZAM_HOME, ~/.zam/cli_path written
    // by `zam ui`, or a checkout in the working directory) over the bundled
    // runtime. This keeps a `git pull` + `npm run build` immediately live in the
    // desktop app, and — crucially — makes skill junctions created from the UI
    // point at the checkout, so `git pull` refreshes every workspace. Installed
    // apps have no checkout marker and fall through to the bundled runtime.
    if let Some(cli_path) = resolve_dev_cli_path() {
        let working_dir = cli_path
            .parent()
            .and_then(Path::parent)
            .and_then(Path::parent)
            .map(Path::to_path_buf)
            .unwrap_or_else(|| PathBuf::from("."));
        
        let app_version = app.package_info().version.to_string();
        if let Some(dev_version) = read_package_version(&working_dir) {
            if dev_version == app_version {
                return Some(BridgeRuntime {
                    node_path: env::var_os("ZAM_NODE")
                        .map(PathBuf::from)
                        .unwrap_or_else(|| PathBuf::from("node")),
                    cli_path,
                    working_dir,
                });
            } else {
                diag_log(&format!(
                    "version mismatch | app={} | dev_checkout={} ({}) -> falling back to bundled runtime",
                    app_version, dev_version, working_dir.display()
                ));
            }
        } else {
            diag_log(&format!(
                "could not read version from dev checkout {} -> falling back to bundled runtime",
                working_dir.display()
            ));
        }
    }

    bundled_runtime(app)
}

#[derive(serde::Serialize)]
struct BridgeInfo {
    dev_checkout_path: Option<String>,
    dev_checkout_version: Option<String>,
    bundled_version: String,
    using_dev_checkout: bool,
    version_mismatch: bool,
    fallback_to_bundled: bool,
}

#[tauri::command]
fn get_bridge_info(app: tauri::AppHandle) -> BridgeInfo {
    let app_version = app.package_info().version.to_string();
    let dev_cli = resolve_dev_cli_path();
    let mut dev_path = None;
    let mut dev_ver = None;
    let mut using_dev = false;
    let mut mismatch = false;
    let mut fallback = false;

    if let Some(cli_path) = dev_cli {
        let working_dir = cli_path
            .parent()
            .and_then(Path::parent)
            .and_then(Path::parent)
            .map(Path::to_path_buf)
            .unwrap_or_else(|| PathBuf::from("."));
        dev_path = Some(working_dir.to_string_lossy().to_string());
        dev_ver = read_package_version(&working_dir);
        
        if let Some(ref ver) = dev_ver {
            if ver == &app_version {
                using_dev = true;
            } else {
                mismatch = true;
                fallback = true;
            }
        } else {
            mismatch = true;
            fallback = true;
        }
    }

    BridgeInfo {
        dev_checkout_path: dev_path,
        dev_checkout_version: dev_ver,
        bundled_version: app_version,
        using_dev_checkout: using_dev,
        version_mismatch: mismatch,
        fallback_to_bundled: fallback,
    }
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

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ObserverWatchStatus {
    running: bool,
    pid: Option<u32>,
    session: Option<String>,
    hwnd: Option<String>,
    event_log_path: Option<String>,
    stderr_log_path: Option<String>,
    started_at: Option<u64>,
    event_count: u64,
    last_event_at: Option<u64>,
    last_error: Option<String>,
}

impl ObserverWatchStatus {
    fn idle() -> Self {
        Self {
            running: false,
            pid: None,
            session: None,
            hwnd: None,
            event_log_path: None,
            stderr_log_path: None,
            started_at: None,
            event_count: 0,
            last_event_at: None,
            last_error: None,
        }
    }
}

struct ObserverWatchProcess {
    child: Child,
    session: String,
    hwnd: String,
    event_log_path: PathBuf,
    stderr_log_path: PathBuf,
    started_at: u64,
    event_count: Arc<AtomicU64>,
    last_event_at: Arc<AtomicU64>,
    last_error: Arc<Mutex<Option<String>>>,
}

impl Drop for ObserverWatchProcess {
    fn drop(&mut self) {
        let _ = self.child.stdin.take();
        match self.child.try_wait() {
            Ok(None) => {
                let _ = self.child.kill();
                let _ = self.child.wait();
            }
            Ok(Some(_)) => {
                let _ = self.child.wait();
            }
            Err(_) => {
                let _ = self.child.kill();
                let _ = self.child.wait();
            }
        }
    }
}

impl ObserverWatchProcess {
    fn snapshot(&self, running: bool, pid: Option<u32>) -> ObserverWatchStatus {
        let last_event_at = match self.last_event_at.load(Ordering::SeqCst) {
            0 => None,
            value => Some(value),
        };
        let last_error = self.last_error.lock().ok().and_then(|value| value.clone());

        ObserverWatchStatus {
            running,
            pid,
            session: Some(self.session.clone()),
            hwnd: Some(self.hwnd.clone()),
            event_log_path: Some(path_to_string(&self.event_log_path)),
            stderr_log_path: Some(path_to_string(&self.stderr_log_path)),
            started_at: Some(self.started_at),
            event_count: self.event_count.load(Ordering::SeqCst),
            last_event_at,
            last_error,
        }
    }

    fn set_error(&self, message: impl Into<String>) {
        if let Ok(mut last_error) = self.last_error.lock() {
            *last_error = Some(message.into());
        }
    }
}

struct ObserverWatchState {
    active: Mutex<Option<ObserverWatchProcess>>,
}

impl ObserverWatchState {
    fn new() -> Self {
        Self {
            active: Mutex::new(None),
        }
    }
}

#[tauri::command]
async fn start_zam_observer_watch(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<ObserverWatchState>>,
    session: String,
    hwnd: String,
    interval_ms: Option<String>,
    samples: Option<String>,
) -> Result<ObserverWatchStatus, String> {
    let state = Arc::clone(state.inner());
    tauri::async_runtime::spawn_blocking(move || {
        start_zam_observer_watch_blocking(&app, &state, session, hwnd, interval_ms, samples)
    })
    .await
    .map_err(|e| format!("Observer watch start task failed: {}", e))?
}

fn start_zam_observer_watch_blocking(
    app: &tauri::AppHandle,
    state: &ObserverWatchState,
    session: String,
    hwnd: String,
    interval_ms: Option<String>,
    samples: Option<String>,
) -> Result<ObserverWatchStatus, String> {
    let session = require_non_empty("session", session)?;
    let hwnd = require_non_empty("hwnd", hwnd)?;

    let mut active = state.active.lock().map_err(|e| e.to_string())?;
    if let Some(process) = active.as_mut() {
        match process.child.try_wait() {
            Ok(None) => {
                return Err(
                    "Observer watch is already running; stop it before starting a new one."
                        .to_string(),
                );
            }
            Ok(Some(status)) => {
                process.set_error(format!(
                    "Previous observer watch exited with status {status}"
                ));
                *active = None;
            }
            Err(error) => {
                process.set_error(format!("Failed to inspect observer watch: {error}"));
                *active = None;
            }
        }
    }

    let runtime = resolve_observer_runtime(app).ok_or_else(|| {
        "Could not locate the ZAM observer sidecar. Reinstall the desktop app, \
         build observer/Cargo.toml, or set ZAM_OBSERVER to the executable path."
            .to_string()
    })?;

    let observer_dir = observer_session_dir(app, &session)?;
    fs::create_dir_all(&observer_dir).map_err(|error| {
        format!(
            "Failed to create observer session directory {}: {error}",
            observer_dir.display()
        )
    })?;
    let event_log_path = observer_dir.join("watch-reports.jsonl");
    let reports_log_path = observer_reports_path(&session);
    if let Some(parent) = reports_log_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            format!(
                "Failed to create observer reports directory {}: {error}",
                parent.display()
            )
        })?;
    }
    let stderr_log_path = observer_dir.join("watch.stderr.log");
    let event_file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&event_log_path)
        .map_err(|error| {
            format!(
                "Failed to create observer event log {}: {error}",
                event_log_path.display()
            )
        })?;
    let reports_file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&reports_log_path)
        .map_err(|error| {
            format!(
                "Failed to create observer reports log {}: {error}",
                reports_log_path.display()
            )
        })?;
    let stderr_file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&stderr_log_path)
        .map_err(|error| {
            format!(
                "Failed to create observer stderr log {}: {error}",
                stderr_log_path.display()
            )
        })?;

    let mut args = vec![
        "watch".to_string(),
        "--session".to_string(),
        session.clone(),
        "--hwnd".to_string(),
        hwnd.clone(),
        "--interval-ms".to_string(),
        interval_ms
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| "1000".to_string()),
        "--reports".to_string(),
        "--event-driven".to_string(),
    ];
    if let Some(samples) = samples.filter(|value| !value.trim().is_empty()) {
        args.push("--samples".to_string());
        args.push(samples);
    }

    let mut command = Command::new(&runtime.executable_path);
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    command.current_dir(&runtime.working_dir);
    command.args(&args);
    command.stdin(Stdio::piped());
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|error| format!("Failed to spawn ZAM observer watch: {error}"))?;
    let stdout = child.stdout.take().ok_or_else(|| {
        let _ = child.kill();
        "Failed to open observer watch stdout".to_string()
    })?;
    let stderr = child.stderr.take().ok_or_else(|| {
        let _ = child.kill();
        "Failed to open observer watch stderr".to_string()
    })?;

    let event_count = Arc::new(AtomicU64::new(0));
    let last_event_at = Arc::new(AtomicU64::new(0));
    let last_error = Arc::new(Mutex::new(None));

    spawn_observer_stdout_writer(
        stdout,
        event_file,
        Some(reports_file),
        Arc::clone(&event_count),
        Arc::clone(&last_event_at),
        Arc::clone(&last_error),
    );
    spawn_observer_stderr_writer(stderr, stderr_file, Arc::clone(&last_error));

    let process = ObserverWatchProcess {
        child,
        session,
        hwnd,
        event_log_path,
        stderr_log_path,
        started_at: chrono_now(),
        event_count,
        last_event_at,
        last_error,
    };
    let status = process.snapshot(true, Some(process.child.id()));
    *active = Some(process);
    Ok(status)
}

#[tauri::command]
async fn status_zam_observer_watch(
    state: tauri::State<'_, Arc<ObserverWatchState>>,
) -> Result<ObserverWatchStatus, String> {
    let state = Arc::clone(state.inner());
    tauri::async_runtime::spawn_blocking(move || status_zam_observer_watch_blocking(&state))
        .await
        .map_err(|e| format!("Observer watch status task failed: {}", e))?
}

fn status_zam_observer_watch_blocking(
    state: &ObserverWatchState,
) -> Result<ObserverWatchStatus, String> {
    let mut active = state.active.lock().map_err(|e| e.to_string())?;
    let Some(process) = active.as_mut() else {
        return Ok(ObserverWatchStatus::idle());
    };

    match process.child.try_wait() {
        Ok(None) => Ok(process.snapshot(true, Some(process.child.id()))),
        Ok(Some(status)) => {
            process.set_error(format!("Observer watch exited with status {status}"));
            let snapshot = process.snapshot(false, None);
            *active = None;
            Ok(snapshot)
        }
        Err(error) => {
            process.set_error(format!("Failed to inspect observer watch: {error}"));
            let snapshot = process.snapshot(false, None);
            *active = None;
            Ok(snapshot)
        }
    }
}

#[tauri::command]
async fn stop_zam_observer_watch(
    state: tauri::State<'_, Arc<ObserverWatchState>>,
) -> Result<ObserverWatchStatus, String> {
    let state = Arc::clone(state.inner());
    tauri::async_runtime::spawn_blocking(move || stop_zam_observer_watch_blocking(&state))
        .await
        .map_err(|e| format!("Observer watch stop task failed: {}", e))?
}

fn stop_zam_observer_watch_blocking(
    state: &ObserverWatchState,
) -> Result<ObserverWatchStatus, String> {
    let mut active = state.active.lock().map_err(|e| e.to_string())?;
    let Some(mut process) = active.take() else {
        return Ok(ObserverWatchStatus::idle());
    };

    let _ = process.child.stdin.take();
    let mut exited = false;
    for _ in 0..30 {
        match process.child.try_wait() {
            Ok(Some(_)) => {
                exited = true;
                break;
            }
            Ok(None) => thread::sleep(Duration::from_millis(100)),
            Err(error) => {
                process.set_error(format!("Failed to stop observer watch: {error}"));
                break;
            }
        }
    }

    if exited {
        let _ = process.child.wait();
    } else {
        let _ = process.child.kill();
        let _ = process.child.wait();
        process.set_error("Observer watch was force-stopped after the graceful stop timeout.");
    }

    Ok(process.snapshot(false, None))
}

fn observer_session_dir(app: &tauri::AppHandle, session: &str) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;
    Ok(base.join("observer").join(safe_path_segment(session)))
}

/// Returns the path where UI observation reports are persisted so the bridge
/// (`bridge get-observations`) can read them. This is `~/.zam/observer/<session>.reports.jsonl`,
/// matching the TypeScript kernel's `getUiObservationPath`.
fn observer_reports_path(session: &str) -> PathBuf {
    let home = env::var_os("USERPROFILE")
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    home.join(".zam")
        .join("observer")
        .join(format!("{}.reports.jsonl", safe_path_segment(session)))
}

fn safe_path_segment(value: &str) -> String {
    let sanitized: String = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() {
        "session".to_string()
    } else {
        sanitized
    }
}

fn require_non_empty(name: &str, value: String) -> Result<String, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        Err(format!("{name} must not be empty"))
    } else {
        Ok(trimmed.to_string())
    }
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn set_observer_watch_error(last_error: &Arc<Mutex<Option<String>>>, message: impl Into<String>) {
    if let Ok(mut last_error) = last_error.lock() {
        *last_error = Some(message.into());
    }
}

fn spawn_observer_stdout_writer(
    stdout: ChildStdout,
    mut file: fs::File,
    mut reports_file: Option<fs::File>,
    event_count: Arc<AtomicU64>,
    last_event_at: Arc<AtomicU64>,
    last_error: Arc<Mutex<Option<String>>>,
) {
    thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    if let Err(error) = file.write_all(line.as_bytes()) {
                        set_observer_watch_error(
                            &last_error,
                            format!("Failed to write observer event log: {error}"),
                        );
                        break;
                    }
                    let _ = file.flush();
                    // When --reports is active, also write to the reports JSONL
                    // so `bridge get-observations` can read them.
                    if let Some(ref mut reports) = reports_file {
                        if let Err(error) = reports.write_all(line.as_bytes()) {
                            set_observer_watch_error(
                                &last_error,
                                format!("Failed to write observer reports log: {error}"),
                            );
                            // Don't break — the event log is still valuable
                        } else {
                            let _ = reports.flush();
                        }
                    }
                    if !line.trim().is_empty() {
                        event_count.fetch_add(1, Ordering::SeqCst);
                        last_event_at.store(chrono_now(), Ordering::SeqCst);
                    }
                }
                Err(error) => {
                    set_observer_watch_error(
                        &last_error,
                        format!("Failed to read observer watch stdout: {error}"),
                    );
                    break;
                }
            }
        }
    });
}

fn spawn_observer_stderr_writer(
    stderr: ChildStderr,
    mut file: fs::File,
    last_error: Arc<Mutex<Option<String>>>,
) {
    thread::spawn(move || {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    let _ = file.write_all(line.as_bytes());
                    let _ = file.flush();
                    let message = line.trim();
                    if !message.is_empty() {
                        set_observer_watch_error(&last_error, message.to_string());
                    }
                }
                Err(error) => {
                    set_observer_watch_error(
                        &last_error,
                        format!("Failed to read observer watch stderr: {error}"),
                    );
                    break;
                }
            }
        }
    });
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
        matches!(bridge.child.try_wait(), Ok(None))
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

        let runtime = match resolve_bridge_runtime(app) {
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

/// Open the ZAM data folder (`~/.zam`) in the OS file manager. A dedicated
/// command so the webview never passes arbitrary paths to the opener plugin —
/// tighter than granting the broad `opener:allow-open-path` capability to JS.
#[tauri::command]
fn open_data_folder(app: tauri::AppHandle) -> Result<(), String> {
    let dir = home_dir()
        .ok_or_else(|| "Could not resolve home directory".to_string())?
        .join(".zam");
    fs::create_dir_all(&dir).map_err(|e| {
        format!("Failed to create data directory {}: {e}", dir.display())
    })?;
    app.opener()
        .open_path(dir.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| format!("Failed to open data folder: {e}"))
}

/// Host OS ("macos" | "windows" | "linux" | …). The Settings update flow uses
/// this to decide between in-place auto-install (macOS/Windows) and a manual
/// download link (Linux ships .deb/.rpm, which the Tauri updater cannot
/// install in place — it only supports AppImage).
#[tauri::command]
fn current_os() -> &'static str {
    std::env::consts::OS
}

/// Relaunch the app after an updater install has swapped the bundle on disk.
/// `restart()` re-execs the current binary and never returns.
#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

#[tauri::command]
fn open_terminal_in_dir(dir: String) -> Result<(), String> {
    let path = PathBuf::from(dir);
    if !path.exists() {
        return Err(format!("Workspace path does not exist: {}", path.display()));
    }
    if !path.is_dir() {
        return Err(format!("Workspace path is not a directory: {}", path.display()));
    }

    #[cfg(target_os = "windows")]
    {
        if Command::new("wt.exe").arg("-d").arg(&path).spawn().is_ok() {
            return Ok(());
        }
        Command::new("powershell.exe")
            .current_dir(&path)
            .args(["-NoExit", "-NoProfile"])
            .spawn()
            .map(|_| ())
            .map_err(|e| format!("Failed to open PowerShell in {}: {e}", path.display()))
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-a", "Terminal"])
            .arg(&path)
            .spawn()
            .map(|_| ())
            .map_err(|e| format!("Failed to open Terminal in {}: {e}", path.display()))
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let candidates = ["x-terminal-emulator", "gnome-terminal", "konsole", "xfce4-terminal"];
        for candidate in candidates {
            if Command::new(candidate).current_dir(&path).spawn().is_ok() {
                return Ok(());
            }
        }
        Err(format!("No supported terminal emulator found for {}", path.display()))
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            app.manage(Arc::new(BridgeState::new()));
            app.manage(Arc::new(ObserverWatchState::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_bridge_info,
            execute_zam_bridge,
            cancel_zam_bridge,
            probe_zam_observer,
            list_zam_observer_windows,
            foreground_zam_observer_window,
            watch_zam_observer_foreground,
            start_zam_observer_watch,
            status_zam_observer_watch,
            stop_zam_observer_watch,
            pick_zam_observer_window,
            capture_zam_observer_once,
            capture_zam_observer_window,
            sample_zam_observer_window,
            snapshot_zam_observer_window,
            open_data_folder,
            open_terminal_in_dir,
            current_os,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use std::env;

    #[test]
    fn test_read_package_version() {
        let temp_dir = env::temp_dir().join("zam_test_dir");
        let _ = fs::create_dir_all(&temp_dir);
        let pkg_json = temp_dir.join("package.json");
        
        let mut file = File::create(&pkg_json).unwrap();
        file.write_all(b"{\"version\": \"1.2.3\"}").unwrap();
        
        let ver = read_package_version(&temp_dir);
        assert_eq!(ver, Some("1.2.3".to_string()));
        
        let _ = fs::remove_file(&pkg_json);
        let _ = fs::remove_dir(&temp_dir);
    }
}
