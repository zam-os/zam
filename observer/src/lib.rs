mod capture;
mod model;
mod picker;
mod replay;

pub use capture::{capture_once, capture_window, snapshot_window, CapturedFrameProbe};
pub use model::{
    ActionType, ApplicationContext, CandidateToken, EvidenceRef, EvidenceType, ObservedAction,
    ObserverCapabilities, ObserverProbe, ReportKind, SensorEvent, SensorKind, SensorSource,
    SensorTarget, UiObservationReport, PROTOCOL_VERSION,
};
pub use picker::{list_windows, pick_window, PickedWindow, WindowInfo};
pub use replay::{ReplayEngine, ReplayError, ReplaySummary};
