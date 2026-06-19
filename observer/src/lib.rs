mod capture;
mod clock;
mod frame_ring;
mod frame_signature;
mod keyframe;
mod keyframe_archive;
mod model;
mod picker;
mod privacy;
mod raw_input;
mod replay;
mod uia;

pub use capture::{
    capture_once, capture_window, sample_window, snapshot_window, watch_window_keyframes,
    CapturedFrameProbe, CapturedFrameSample, CapturedFrameSequence,
};
pub use clock::observed_at_now;
pub use frame_ring::FrameRing;
pub use frame_signature::{FrameSignature, DEFAULT_CHANGE_THRESHOLD, SIGNATURE_GRID};
pub use keyframe::KeyframeStream;
pub use keyframe_archive::KeyframeArchive;
pub use model::{
    ActionType, ApplicationContext, CandidateToken, EvidenceRef, EvidenceType, ObservedAction,
    ObserverCapabilities, ObserverProbe, ReportKind, SensorEvent, SensorKind, SensorSource,
    SensorTarget, UiObservationReport, PROTOCOL_VERSION,
};
pub use picker::{
    foreground_window, list_windows, pick_window, window_info, PickedWindow, WindowInfo,
};
pub use privacy::{
    classify_window_privacy, classify_window_privacy_with_policy, ensure_capture_allowed,
    load_window_privacy_policy, load_window_privacy_policy_from_env, redact_window_title,
    PrivacyAction, WindowPrivacy, WindowPrivacyPolicy, PRIVACY_POLICY_ENV, REDACTED_WINDOW_TITLE,
};
pub use raw_input::watch_raw_input;
pub use replay::{ReplayEngine, ReplayError, ReplaySummary};
pub use uia::watch_focused_element;
