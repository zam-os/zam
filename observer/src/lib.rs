mod capture;
mod frame_ring;
mod model;
mod picker;
mod privacy;
mod replay;

pub use capture::{
    capture_once, capture_window, sample_window, snapshot_window, CapturedFrameProbe,
    CapturedFrameSample, CapturedFrameSequence,
};
pub use frame_ring::FrameRing;
pub use model::{
    ActionType, ApplicationContext, CandidateToken, EvidenceRef, EvidenceType, ObservedAction,
    ObserverCapabilities, ObserverProbe, ReportKind, SensorEvent, SensorKind, SensorSource,
    SensorTarget, UiObservationReport, PROTOCOL_VERSION,
};
pub use picker::{foreground_window, list_windows, pick_window, PickedWindow, WindowInfo};
pub use privacy::{
    classify_window_privacy, classify_window_privacy_with_policy, ensure_capture_allowed,
    load_window_privacy_policy, load_window_privacy_policy_from_env, redact_window_title,
    PrivacyAction, WindowPrivacy, WindowPrivacyPolicy, PRIVACY_POLICY_ENV, REDACTED_WINDOW_TITLE,
};
pub use replay::{ReplayEngine, ReplayError, ReplaySummary};
