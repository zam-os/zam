// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use std::env;
use std::path::PathBuf;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn execute_zam_bridge(cmd: String, args: Vec<String>) -> Result<String, String> {
    let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    
    // Resolve compiled CLI path in workspace root
    let mut cli_path = current_dir.join("dist").join("cli").join("index.js");
    
    if !cli_path.exists() {
        cli_path = current_dir.join("..").join("dist").join("cli").join("index.js");
    }
    if !cli_path.exists() {
        cli_path = current_dir.join("..").join("..").join("dist").join("cli").join("index.js");
    }
    
    if !cli_path.exists() {
        return Err(format!("Could not locate ZAM CLI build at {:?}", cli_path));
    }
    
    // Run command: node <cli_path> bridge <cmd> <args...>
    let mut command = Command::new("node");
    command.arg(cli_path);
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
