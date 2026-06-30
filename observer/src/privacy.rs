use std::env;
use std::ffi::OsString;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

pub const REDACTED_WINDOW_TITLE: &str = "[redacted by privacy filter]";
pub const PRIVACY_POLICY_ENV: &str = "ZAM_OBSERVER_PRIVACY_POLICY";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PrivacyAction {
    Observe,
    PrivacyPause,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WindowPrivacy {
    pub action: PrivacyAction,
    #[serde(default)]
    pub reasons: Vec<String>,
    #[serde(default)]
    pub title_redacted: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", default)]
pub struct WindowPrivacyPolicy {
    pub allow_processes: Vec<String>,
    pub deny_processes: Vec<String>,
    pub deny_title_markers: Vec<String>,
}

impl WindowPrivacy {
    pub fn observe() -> Self {
        Self {
            action: PrivacyAction::Observe,
            reasons: Vec::new(),
            title_redacted: false,
        }
    }

    pub fn is_paused(&self) -> bool {
        self.action == PrivacyAction::PrivacyPause
    }
}

pub fn classify_window_privacy(process_name: &str, title: &str) -> WindowPrivacy {
    classify_window_privacy_with_policy(process_name, title, &WindowPrivacyPolicy::default())
}

pub fn classify_window_privacy_with_policy(
    process_name: &str,
    title: &str,
    policy: &WindowPrivacyPolicy,
) -> WindowPrivacy {
    let mut reasons = Vec::new();
    let process = normalize_process(process_name);
    let title = normalize_text(title);

    if is_sensitive_process(&process) {
        reasons.push("sensitive-process".to_string());
    }
    if contains_any(&title, PRIVATE_BROWSING_TITLE_MARKERS) {
        reasons.push("private-browsing".to_string());
    }
    if contains_any(&title, AUTHENTICATION_TITLE_MARKERS) {
        reasons.push("authentication".to_string());
    }
    if contains_any(&title, FINANCIAL_TITLE_MARKERS) {
        reasons.push("financial".to_string());
    }

    let policy_allowed = process_matches_any(&process, &policy.allow_processes);
    if !policy_allowed && process_matches_any(&process, &policy.deny_processes) {
        reasons.push("policy-process".to_string());
    }
    if !policy_allowed && contains_configured_marker(&title, &policy.deny_title_markers) {
        reasons.push("policy-title".to_string());
    }

    reasons.sort();
    reasons.dedup();

    if reasons.is_empty() {
        WindowPrivacy::observe()
    } else {
        WindowPrivacy {
            action: PrivacyAction::PrivacyPause,
            reasons,
            title_redacted: true,
        }
    }
}

pub fn load_window_privacy_policy_from_env() -> Result<WindowPrivacyPolicy, String> {
    let Some(path) = env::var_os(PRIVACY_POLICY_ENV) else {
        return Ok(WindowPrivacyPolicy::default());
    };
    if path.is_empty() {
        return Ok(WindowPrivacyPolicy::default());
    }

    load_window_privacy_policy(Path::new(&path))
}

pub fn load_window_privacy_policy(path: &Path) -> Result<WindowPrivacyPolicy, String> {
    let raw = std::fs::read_to_string(path)
        .map_err(|error| format!("failed to read privacy policy {}: {error}", path.display()))?;
    serde_json::from_str::<WindowPrivacyPolicy>(&raw)
        .map_err(|error| format!("failed to parse privacy policy {}: {error}", path.display()))
}

/// Filename, under the observer directory, of the policy the ZAM kernel writes
/// from the user's `observer.*` settings.
pub const RESOLVED_POLICY_FILE: &str = "policy.json";

const OBSERVER_DIR_ENV: &str = "ZAM_OBSERVER_DIR";

/// Resolve the active window-privacy policy from the unified ZAM source.
///
/// Precedence (Layer 2 of the two-layer consent model — see
/// docs/adr/0001-observer-permission-model.md, item 4):
/// 1. the kernel-written file at `<observer-dir>/policy.json` (primary);
/// 2. the `ZAM_OBSERVER_PRIVACY_POLICY` env file (deprecated fallback);
/// 3. the built-in default.
///
/// The observer directory mirrors the kernel's resolution: `ZAM_OBSERVER_DIR`,
/// else `~/.zam/observer`. The built-in sensitive set is always enforced on top
/// of whatever this returns; user config can only make the policy stricter.
pub fn resolve_window_privacy_policy() -> Result<WindowPrivacyPolicy, String> {
    resolve_window_privacy_policy_with(observer_dir(), env::var_os(PRIVACY_POLICY_ENV))
}

fn resolve_window_privacy_policy_with(
    observer_dir: Option<PathBuf>,
    env_policy_path: Option<OsString>,
) -> Result<WindowPrivacyPolicy, String> {
    if let Some(dir) = observer_dir {
        let resolved = dir.join(RESOLVED_POLICY_FILE);
        if resolved.is_file() {
            return load_window_privacy_policy(&resolved);
        }
    }
    if let Some(path) = env_policy_path {
        if !path.is_empty() {
            return load_window_privacy_policy(Path::new(&path));
        }
    }
    Ok(WindowPrivacyPolicy::default())
}

fn observer_dir() -> Option<PathBuf> {
    if let Some(dir) = env::var_os(OBSERVER_DIR_ENV) {
        if !dir.is_empty() {
            return Some(PathBuf::from(dir));
        }
    }
    let home = if cfg!(windows) {
        env::var_os("USERPROFILE")
    } else {
        env::var_os("HOME")
    };
    home.filter(|value| !value.is_empty())
        .map(|value| PathBuf::from(value).join(".zam").join("observer"))
}

pub fn redact_window_title(title: String, privacy: &WindowPrivacy) -> String {
    if privacy.title_redacted {
        REDACTED_WINDOW_TITLE.to_string()
    } else {
        title
    }
}

pub fn ensure_capture_allowed(privacy: &WindowPrivacy) -> Result<(), String> {
    if privacy.is_paused() {
        let reasons = if privacy.reasons.is_empty() {
            "privacy filter".to_string()
        } else {
            privacy.reasons.join(", ")
        };
        Err(format!("privacy pause: capture refused ({reasons})"))
    } else {
        Ok(())
    }
}

fn normalize_process(value: &str) -> String {
    normalize_text(value)
        .trim_end_matches(".exe")
        .trim()
        .to_string()
}

fn normalize_text(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn contains_any(value: &str, markers: &[&str]) -> bool {
    markers.iter().any(|marker| value.contains(marker))
}

fn contains_configured_marker(value: &str, markers: &[String]) -> bool {
    markers
        .iter()
        .map(|marker| normalize_text(marker))
        .filter(|marker| !marker.is_empty())
        .any(|marker| value.contains(&marker))
}

fn is_sensitive_process(process: &str) -> bool {
    SENSITIVE_PROCESS_MARKERS
        .iter()
        .any(|marker| process == *marker || process.starts_with(marker))
}

fn process_matches_any(process: &str, patterns: &[String]) -> bool {
    patterns.iter().any(|pattern| {
        let pattern = normalize_process(pattern);
        if pattern.is_empty() {
            return false;
        }
        pattern
            .strip_suffix('*')
            .is_some_and(|prefix| process.starts_with(prefix))
            || process == pattern
    })
}

const SENSITIVE_PROCESS_MARKERS: &[&str] = &[
    "1password",
    "bitwarden",
    "credentialuibroker",
    "dashlane",
    "enpass",
    "keepass",
    "keepassxc",
    "lastpass",
    "protonpass",
    "proton pass",
];

const PRIVATE_BROWSING_TITLE_MARKERS: &[&str] = &[
    "incognito",
    "inkognito",
    "inprivate",
    "private browsing",
    "private window",
    "privates fenster",
    "privater modus",
];

const AUTHENTICATION_TITLE_MARKERS: &[&str] = &[
    "2fa",
    "anmelden",
    "authenticator",
    "authentication",
    "mfa",
    "one-time password",
    "passkey",
    "passwort",
    "password",
    "security key",
    "sign in",
    "two-factor",
    "verify",
    "verifizieren",
];

const FINANCIAL_TITLE_MARKERS: &[&str] = &[
    "banking", "checkout", "finanz", "konto", "paypal", "payment", "zahlung",
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_ordinary_application_windows() {
        let privacy = classify_window_privacy("explorer.exe", "Documents");

        assert_eq!(privacy.action, PrivacyAction::Observe);
        assert!(privacy.reasons.is_empty());
        assert!(!privacy.title_redacted);
        assert_eq!(
            redact_window_title("Documents".to_string(), &privacy),
            "Documents"
        );
    }

    #[test]
    fn pauses_for_password_manager_processes() {
        let privacy = classify_window_privacy("Bitwarden.exe", "Vault");

        assert_eq!(privacy.action, PrivacyAction::PrivacyPause);
        assert_eq!(privacy.reasons, vec!["sensitive-process"]);
        assert!(privacy.title_redacted);
    }

    #[test]
    fn pauses_for_private_browsing_titles_without_a_known_process() {
        let privacy = classify_window_privacy("msedge.exe", "InPrivate browsing");

        assert_eq!(privacy.action, PrivacyAction::PrivacyPause);
        assert_eq!(privacy.reasons, vec!["private-browsing"]);
    }

    #[test]
    fn redacts_titles_when_privacy_pauses() {
        let privacy = classify_window_privacy("chrome.exe", "Sign in to online banking");

        assert_eq!(
            privacy.reasons,
            vec!["authentication".to_string(), "financial".to_string()]
        );
        assert_eq!(
            redact_window_title("Sign in to online banking".to_string(), &privacy),
            REDACTED_WINDOW_TITLE
        );
        assert!(ensure_capture_allowed(&privacy).is_err());
    }

    #[test]
    fn policy_can_pause_custom_processes() {
        let policy = WindowPrivacyPolicy {
            deny_processes: vec!["Teams.exe".to_string()],
            ..Default::default()
        };
        let privacy = classify_window_privacy_with_policy("teams.exe", "Chat", &policy);

        assert_eq!(privacy.action, PrivacyAction::PrivacyPause);
        assert_eq!(privacy.reasons, vec!["policy-process"]);
    }

    #[test]
    fn policy_can_pause_custom_title_markers() {
        let policy = WindowPrivacyPolicy {
            deny_title_markers: vec!["Payroll".to_string()],
            ..Default::default()
        };
        let privacy = classify_window_privacy_with_policy("excel.exe", "Payroll 2026", &policy);

        assert_eq!(privacy.action, PrivacyAction::PrivacyPause);
        assert_eq!(privacy.reasons, vec!["policy-title"]);
    }

    #[test]
    fn policy_allow_processes_only_bypass_policy_rules() {
        let policy = WindowPrivacyPolicy {
            allow_processes: vec!["chrome.exe".to_string()],
            deny_title_markers: vec!["internal".to_string()],
            ..Default::default()
        };

        let allowed = classify_window_privacy_with_policy("chrome.exe", "internal docs", &policy);
        assert_eq!(allowed.action, PrivacyAction::Observe);

        let built_in = classify_window_privacy_with_policy("chrome.exe", "Sign in", &policy);
        assert_eq!(built_in.action, PrivacyAction::PrivacyPause);
        assert_eq!(built_in.reasons, vec!["authentication"]);
    }

    #[test]
    fn resolves_kernel_file_over_env_and_default() {
        let dir = std::env::temp_dir().join(format!("zam-policy-file-{}", std::process::id()));
        let observer_dir = dir.join("observer");
        std::fs::create_dir_all(&observer_dir).expect("create observer dir");
        std::fs::write(
            observer_dir.join(RESOLVED_POLICY_FILE),
            r#"{"denyProcesses":["slack"]}"#,
        )
        .expect("write policy");

        let policy =
            resolve_window_privacy_policy_with(Some(observer_dir), None).expect("resolve policy");
        assert_eq!(policy.deny_processes, vec!["slack".to_string()]);

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn falls_back_to_env_when_no_kernel_file() {
        let dir = std::env::temp_dir().join(format!("zam-policy-env-{}", std::process::id()));
        std::fs::create_dir_all(&dir).expect("create dir");
        let env_file = dir.join("env-policy.json");
        std::fs::write(&env_file, r#"{"denyTitleMarkers":["payroll"]}"#).expect("write env policy");

        let policy = resolve_window_privacy_policy_with(
            Some(dir.join("missing-observer")),
            Some(env_file.into_os_string()),
        )
        .expect("resolve policy");
        assert_eq!(policy.deny_title_markers, vec!["payroll".to_string()]);

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn defaults_when_neither_file_nor_env() {
        let policy = resolve_window_privacy_policy_with(None, None).expect("resolve policy");
        assert_eq!(policy, WindowPrivacyPolicy::default());
    }
}
