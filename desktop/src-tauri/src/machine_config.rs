//! Machine-local configuration as the desktop shell reads it.
//!
//! The Tauri shell starts the observer sidecar itself, without the ZAM
//! bridge, so it reads `config.json` on its own. It resolves the file exactly
//! like the kernel (`src/kernel/system/install-config.ts`): `ZAM_CONFIG_PATH`
//! when set and non-empty, else `<home>/.zam/config.json`, where home is
//! `USERPROFILE` or `HOME`, as Node's `os.homedir()` finds it. `ZAM_HOME`
//! names a developer checkout of the CLI and never moves this file.
//!
//! This is the shell's one reader for machine-local restrictions. The
//! organisation policy file of ADR 2026-10-08b (D6) belongs here too, so the
//! shell and the kernel apply the same rules.

use std::env;
use std::fs;
use std::path::{Path, PathBuf};

/// Denial reason shared with the bridge (`ScreenObservationDeniedResponse`).
pub const SCREEN_OBSERVATION_OFF: &str = "screen-observation-off";

/// Where `config.json` lives for this process.
pub fn config_path() -> Option<PathBuf> {
    if let Some(explicit) = env::var_os("ZAM_CONFIG_PATH") {
        if !explicit.is_empty() {
            return Some(PathBuf::from(explicit));
        }
    }
    super::home_dir().map(|home| home.join(".zam").join("config.json"))
}

/// The parsed file, or `Null` when it is missing or unreadable. Like the
/// kernel, an unreadable file counts as empty, which keeps every switch off.
fn read_config_at(path: &Path) -> serde_json::Value {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or(serde_json::Value::Null)
}

/// `observation.screen` (ADR 2026-10-08 R8). Only a JSON `true` turns it on.
pub fn screen_observation_enabled_at(path: Option<&Path>) -> bool {
    path.map(read_config_at)
        .and_then(|config| config.get("observation")?.get("screen")?.as_bool())
        .unwrap_or(false)
}

pub fn screen_observation_enabled() -> bool {
    screen_observation_enabled_at(config_path().as_deref())
}

/// Every path that starts the sidecar passes this gate first.
pub fn screen_observation_gate_at(path: Option<&Path>) -> Result<(), String> {
    if screen_observation_enabled_at(path) {
        Ok(())
    } else {
        Err(format!(
            "{SCREEN_OBSERVATION_OFF}: Screen observation is off on this machine. \
             The observer sidecar does not start while observation.screen in \
             ~/.zam/config.json is not true."
        ))
    }
}

pub fn screen_observation_gate() -> Result<(), String> {
    screen_observation_gate_at(config_path().as_deref())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    static NEXT: AtomicU32 = AtomicU32::new(0);

    fn temp_config(content: Option<&str>) -> PathBuf {
        let dir = env::temp_dir().join(format!(
            "zam-machine-config-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("config.json");
        if let Some(content) = content {
            fs::write(&path, content).unwrap();
        }
        path
    }

    #[test]
    fn screen_observation_is_off_without_a_config_file() {
        let path = temp_config(None);
        assert!(!screen_observation_enabled_at(Some(&path)));
        assert!(!screen_observation_enabled_at(None));
    }

    #[test]
    fn screen_observation_is_off_unless_literally_true() {
        for content in [
            "{}",
            r#"{"observation":{}}"#,
            r#"{"observation":{"screen":false}}"#,
            r#"{"observation":{"screen":"true"}}"#,
            r#"{"observation":{"screen":1}}"#,
            r#"{"llm":{"vision":{"enabled":true}}}"#,
            "not json",
        ] {
            let path = temp_config(Some(content));
            assert!(
                !screen_observation_enabled_at(Some(&path)),
                "expected off for {content}"
            );
        }
    }

    #[test]
    fn screen_observation_is_on_when_true() {
        let path = temp_config(Some(r#"{"observation":{"screen":true}}"#));
        assert!(screen_observation_enabled_at(Some(&path)));
        assert!(screen_observation_gate_at(Some(&path)).is_ok());
    }

    #[test]
    fn gate_refuses_with_the_typed_reason_while_off() {
        let path = temp_config(Some("{}"));
        let error = screen_observation_gate_at(Some(&path)).unwrap_err();
        assert!(error.starts_with(SCREEN_OBSERVATION_OFF));
    }
}
