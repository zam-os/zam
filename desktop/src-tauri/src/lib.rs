// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn cli_in(root: &Path) -> PathBuf {
    root.join("dist").join("cli").join("index.js")
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("USERPROFILE")
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
}

/// Locate the compiled ZAM CLI (`dist/cli/index.js`) independently of the
/// process working directory, so the installed GUI works when launched from
/// the Start menu / Program Files (where the cwd is NOT the repo).
fn resolve_cli_path() -> Option<PathBuf> {
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

#[tauri::command]
fn execute_zam_bridge(cmd: String, args: Vec<String>) -> Result<String, String> {
    let cli_path = resolve_cli_path().ok_or_else(|| {
        "Could not locate the ZAM CLI build (dist/cli/index.js). Set the ZAM_HOME \
         environment variable to your repo, or run `zam ui` once from the repo to record it."
            .to_string()
    })?;

    // Run command: node <cli_path> bridge <cmd> <args...>
    let mut command = Command::new("node");
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    command.arg(&cli_path);
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
        .invoke_handler(tauri::generate_handler![greet, execute_zam_bridge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
