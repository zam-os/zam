mod capture;
mod model;
mod picker;
mod privacy;
mod replay;

pub use capture::{
    capture_once, capture_window, sample_window, snapshot_window, CapturedFrameProbe,
    CapturedFrameSample, CapturedFrameSequence,
};
pub use model::{
    ActionType, ApplicationContext, CandidateToken, EvidenceRef, EvidenceType, ObservedAction,
    ObserverCapabilities, ObserverProbe, ReportKind, SensorEvent, SensorKind, SensorSource,
    SensorTarget, UiObservationReport, PROTOCOL_VERSION,
};
pub use picker::{list_windows, pick_window, PickedWindow, WindowInfo};
pub use privacy::{
    classify_window_privacy, ensure_capture_allowed, redact_window_title, PrivacyAction,
    WindowPrivacy, REDACTED_WINDOW_TITLE,
};
pub use replay::{ReplayEngine, ReplayError, ReplaySummary};
