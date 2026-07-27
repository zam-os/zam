fn main() {
    tauri_build::build();
    #[cfg(target_os = "macos")]
    link_ios_plugins();
}

/// Build and link the Swift plugin package under `ios/`.
///
/// `tauri_plugin::Builder::ios_path()` does this for real plugin crates. These
/// two plugins live in the app crate rather than in crates of their own, so the
/// same two steps are done by hand: stage the Tauri Swift API where
/// `ios/Package.swift` expects it, then hand the package to swift-rs.
///
/// Without this the Rust staticlib links before Swift is compiled and
/// `ios_plugin_binding!`'s `extern "C"` declarations resolve to nothing:
/// "Undefined symbols for architecture arm64: _init_plugin_secure_pairing".
/// Android needs no equivalent because it loads its plugin class reflectively
/// by name at runtime — iOS needs the symbol at link time.
#[cfg(target_os = "macos")]
fn link_ios_plugins() {
    use std::path::PathBuf;

    // Runs for every host build; only iOS targets need the Swift package.
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("ios") {
        return;
    }

    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let ios_dir = manifest_dir.join("ios");

    // `tauri` exposes its bundled Swift API path through links metadata.
    let tauri_api_src = std::env::var("DEP_TAURI_IOS_LIBRARY_PATH")
        .expect("missing DEP_TAURI_IOS_LIBRARY_PATH — `tauri` must be a dependency");

    // ios/Package.swift resolves the dependency as "../.tauri/tauri-api".
    let tauri_dep_dir = manifest_dir.join(".tauri");
    let dest = tauri_dep_dir.join("tauri-api");
    let _ = std::fs::remove_dir_all(&dest);
    std::fs::create_dir_all(&tauri_dep_dir).expect("failed to create .tauri directory");
    let status = std::process::Command::new("cp")
        .arg("-R")
        .arg(&tauri_api_src)
        .arg(&dest)
        .status()
        .expect("failed to run cp for tauri-api");
    assert!(status.success(), "failed to copy tauri-api into .tauri/");

    println!("cargo:rerun-if-env-changed=DEP_TAURI_IOS_LIBRARY_PATH");
    println!("cargo:rerun-if-changed={}", ios_dir.display());

    // Name must match the library product in ios/Package.swift.
    tauri_utils::build::link_apple_library("zam-mobile", &ios_dir);
}
