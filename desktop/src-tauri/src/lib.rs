// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use qrcode::{render::svg, QrCode};
use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStderr, ChildStdin, ChildStdout, Command};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Emitter, Manager};
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

fn read_package_version(dir: &Path) -> Option<String> {
    let content = fs::read_to_string(dir.join("package.json")).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    json.get("version")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
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

/// Event name the WebView listens on for a bridge command's progress.
const BRIDGE_PROGRESS_EVENT: &str = "zam://bridge-progress";

/// Read the persistent bridge's stderr: log every line, forward progress.
///
/// The bridge writes one NDJSON object per line to stderr while a long write
/// runs (`{"type":"import-progress","done":N,"total":M}`), because stdout is
/// its JSON-only response channel. A 440-card import over a remote library
/// takes minutes, and before this the WebView had no way to know it was
/// advancing — the log file it used to be redirected into is not readable from
/// the front end. Every line still reaches that file, so a bridge crash stays
/// as diagnosable as it was.
fn spawn_bridge_stderr_reader(app: tauri::AppHandle, stderr: ChildStderr) {
    thread::spawn(move || {
        let mut log = home_dir().and_then(|home| {
            let dir = home.join(".zam");
            let _ = fs::create_dir_all(&dir);
            fs::File::create(dir.join("desktop-bridge.stderr.log")).ok()
        });

        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    if let Some(file) = log.as_mut() {
                        let _ = file.write_all(line.as_bytes());
                        let _ = file.flush();
                    }
                    let trimmed = line.trim();
                    if trimmed.starts_with('{') {
                        if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                            if value.get("type").and_then(|t| t.as_str()).is_some() {
                                let _ = app.emit(BRIDGE_PROGRESS_EVENT, value);
                            }
                        }
                    }
                }
                Err(_) => break,
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
        // on startup would be invisible. Pipe it instead of redirecting it
        // straight to the log file: the reader thread below still writes every
        // line to the same file, and additionally forwards the bridge's NDJSON
        // progress lines to the WebView.
        command.stderr(std::process::Stdio::piped());

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

        if let Some(stderr) = child.stderr.take() {
            spawn_bridge_stderr_reader(app.clone(), stderr);
        }

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

/// Bridge commands allowed to run beside the persistent bridge. Each one makes
/// model calls that must not stall the rest of the Studio: preparing choice
/// options for the review, reading a learner's photos or PDF for a material
/// import (ADR 2026-10-05), which can take a minute or two, and asking cloud
/// providers again about models whose detected capabilities are out of date.
const BACKGROUND_BRIDGE_COMMANDS: &[&str] = &[
    "choice-prepare",
    "material-import-analyze",
    "model-refresh-capabilities",
];

/// Run one bridge command in its own short-lived CLI process, beside the
/// persistent bridge.
///
/// The persistent bridge answers one request at a time behind a mutex, so a
/// model-bound job there — generating choice options for the next cards (ADR
/// 2026-09-27 Decision 6) — would hold up loading and rating the card on
/// screen. A separate process shares only the library database, which already
/// serves concurrent readers and one writer. The allowlist keeps this from
/// becoming a second, unrestricted route into the CLI.
#[tauri::command]
async fn execute_zam_bridge_background(
    app: tauri::AppHandle,
    cmd: String,
    args: Vec<String>,
) -> Result<String, String> {
    if !BACKGROUND_BRIDGE_COMMANDS.contains(&cmd.as_str()) {
        return Err(format!("{} is not a background bridge command", cmd));
    }
    tauri::async_runtime::spawn_blocking(move || {
        let runtime = resolve_bridge_runtime(&app)
            .ok_or_else(|| "Could not locate the ZAM CLI.".to_string())?;
        let mut command = Command::new(&runtime.node_path);
        #[cfg(target_os = "windows")]
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
        command.current_dir(&runtime.working_dir);
        command.arg(&runtime.cli_path);
        command.arg("bridge");
        command.arg(&cmd);
        command.args(&args);
        command.stdin(std::process::Stdio::null());
        let output = command
            .output()
            .map_err(|e| format!("Failed to spawn ZAM CLI: {}", e))?;
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            diag_log(&format!(
                "background bridge {} returned nothing | status={} | stderr={}",
                cmd,
                output.status,
                stderr.trim()
            ));
            return Err(format!(
                "Background bridge {} returned nothing (status {})",
                cmd, output.status
            ));
        }
        Ok(stdout)
    })
    .await
    .map_err(|e| format!("Bridge task failed: {}", e))?
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
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create data directory {}: {e}", dir.display()))?;
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

fn pairing_qr_svg(payload: &str) -> Result<String, String> {
    if payload.is_empty() || payload.len() > 2_000 {
        return Err("Pairing payload must be between 1 and 2000 bytes".to_string());
    }
    let code = QrCode::new(payload.as_bytes()).map_err(|error| error.to_string())?;
    Ok(code
        .render::<svg::Color>()
        .min_dimensions(360, 360)
        .quiet_zone(true)
        .dark_color(svg::Color("#111827"))
        .light_color(svg::Color("#ffffff"))
        .build())
}

/// Render a pairing QR locally. The live secrets never leave this process.
#[tauri::command]
fn render_pairing_qr(payload: String) -> Result<String, String> {
    pairing_qr_svg(&payload)
}

#[tauri::command]
fn open_terminal_in_dir(dir: String) -> Result<(), String> {
    let path = PathBuf::from(dir);
    if !path.exists() {
        return Err(format!("Workspace path does not exist: {}", path.display()));
    }
    if !path.is_dir() {
        return Err(format!(
            "Workspace path is not a directory: {}",
            path.display()
        ));
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
        let candidates = [
            "x-terminal-emulator",
            "gnome-terminal",
            "konsole",
            "xfce4-terminal",
        ];
        for candidate in candidates {
            if Command::new(candidate).current_dir(&path).spawn().is_ok() {
                return Ok(());
            }
        }
        Err(format!(
            "No supported terminal emulator found for {}",
            path.display()
        ))
    }
}

mod voice;

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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_bridge_info,
            execute_zam_bridge,
            execute_zam_bridge_background,
            cancel_zam_bridge,
            open_data_folder,
            open_terminal_in_dir,
            current_os,
            restart_app,
            render_pairing_qr,
            voice::voice_capabilities,
            voice::voice_check_permissions,
            voice::voice_request_permissions,
            voice::voice_start,
            voice::voice_stop,
            voice::voice_speak,
            voice::voice_listen,
            voice::voice_capture,
            voice::voice_discard_capture
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs::{self, File};
    use std::io::Write;

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

    #[test]
    fn renders_pairing_payload_as_local_svg() {
        let payload = r#"{"type":"zam-pair","version":1}"#;
        let svg = pairing_qr_svg(payload).unwrap();
        assert!(svg.starts_with("<?xml"));
        assert!(svg.contains("<svg"));
        assert!(!svg.contains(payload));
    }
}
