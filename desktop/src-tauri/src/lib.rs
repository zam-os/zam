// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
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

#[tauri::command]
fn execute_zam_bridge(
    app: tauri::AppHandle,
    cmd: String,
    args: Vec<String>,
) -> Result<String, String> {
    let runtime = resolve_bridge_runtime(&app).ok_or_else(|| {
        "Could not locate the bundled ZAM CLI. Reinstall the desktop app, or set \
         ZAM_HOME to a source checkout for development."
            .to_string()
    })?;

    // Run command: node <cli_path> bridge <cmd> <args...>
    let mut command = Command::new(&runtime.node_path);
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    command.current_dir(&runtime.working_dir);
    command.arg(&runtime.cli_path);
    command.arg("bridge");
    command.arg(cmd);

    for arg in args {
        command.arg(arg);
    }

    let output = command.output().map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Bridge failed: {}\nStderr: {}", stdout, stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![execute_zam_bridge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
