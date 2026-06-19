use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const PROTOCOL_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SensorSource {
    System,
    Window,
    Uia,
    Input,
    Capture,
    Privacy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum SensorKind {
    SessionStarted,
    SessionStopped,
    ForegroundChanged,
    ElementFocused,
    ElementInvoked,
    SelectionChanged,
    ToggleChanged,
    TextChanged,
    Click,
    Shortcut,
    TypingActivity,
    Scroll,
    DialogOpened,
    DialogClosed,
    FrameChanged,
    ErrorObserved,
    HelpOpened,
    StepCompleted,
    PrivacyPaused,
    PrivacyResumed,
    Heartbeat,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationContext {
    pub process_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SensorTarget {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub automation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default)]
    pub password: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SensorEvent {
    pub version: u8,
    pub session_id: String,
    pub sequence: u64,
    pub observed_at: String,
    pub source: SensorSource,
    pub kind: SensorKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub application: Option<ApplicationContext>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<SensorTarget>,
    #[serde(default)]
    pub data: BTreeMap<String, Value>,
    #[serde(default)]
    pub redacted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ReportKind {
    Progress,
    StepCompleted,
    Error,
    HelpSeeking,
    Uncertain,
    PrivacyPause,
    Heartbeat,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ActionType {
    Click,
    Shortcut,
    Typing,
    Scroll,
    WindowChange,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ObservedAction {
    #[serde(rename = "type")]
    pub action_type: ActionType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EvidenceType {
    Uia,
    Keyframe,
    Clip,
    Window,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceRef {
    #[serde(rename = "type")]
    pub evidence_type: EvidenceType,
    #[serde(rename = "ref")]
    pub reference: String,
    pub redacted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CandidateToken {
    pub slug: String,
    pub confidence: f32,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UiObservationReport {
    pub version: u8,
    pub session_id: String,
    pub sequence: u64,
    pub observed_from: String,
    pub observed_to: String,
    pub kind: ReportKind,
    pub application: ApplicationContext,
    pub summary: String,
    pub actions: Vec<ObservedAction>,
    pub evidence: Vec<EvidenceRef>,
    pub candidate_tokens: Vec<CandidateToken>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ObserverCapabilities {
    pub replay: bool,
    pub window_context: bool,
    pub foreground_watch: bool,
    pub live_capture: bool,
    pub frame_sampling: bool,
    pub ui_automation: bool,
    pub raw_input: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ObserverProbe {
    pub name: String,
    pub version: String,
    pub protocol_version: u8,
    pub os: String,
    pub arch: String,
    pub capabilities: ObserverCapabilities,
}
