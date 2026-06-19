use serde::{Deserialize, Serialize};

pub const REDACTED_WINDOW_TITLE: &str = "[redacted by privacy filter]";

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

fn is_sensitive_process(process: &str) -> bool {
    SENSITIVE_PROCESS_MARKERS
        .iter()
        .any(|marker| process == *marker || process.starts_with(marker))
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
}
