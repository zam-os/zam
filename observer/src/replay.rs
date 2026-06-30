use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};

use crate::model::{
    ActionType, ApplicationContext, EvidenceRef, EvidenceType, ObservedAction, ReportKind,
    SensorEvent, SensorKind, SensorSource, UiObservationReport, PROTOCOL_VERSION,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReplaySummary {
    pub events: u64,
    pub reports: u64,
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReplayError {
    message: String,
}

impl ReplayError {
    fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl Display for ReplayError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}

impl std::error::Error for ReplayError {}

#[derive(Debug, Default)]
pub struct ReplayEngine {
    session_id: Option<String>,
    last_event_sequence: Option<u64>,
    report_sequence: u64,
    interval_started_at: Option<String>,
    last_observed_at: Option<String>,
    application: Option<ApplicationContext>,
    pending_actions: Vec<ObservedAction>,
    pending_evidence: Vec<EvidenceRef>,
    privacy_paused: bool,
    events: u64,
    reports: u64,
}

impl ReplayEngine {
    pub fn process(
        &mut self,
        event: SensorEvent,
    ) -> Result<Option<UiObservationReport>, ReplayError> {
        self.validate(&event)?;
        self.events += 1;

        let privacy_control_event = matches!(
            event.kind,
            SensorKind::PrivacyPaused
                | SensorKind::PrivacyResumed
                | SensorKind::SessionStopped
                | SensorKind::Heartbeat
        );
        if self.privacy_paused && !privacy_control_event {
            return Ok(None);
        }

        self.last_observed_at = Some(event.observed_at.clone());
        self.interval_started_at
            .get_or_insert_with(|| event.observed_at.clone());

        if let Some(application) = event.application.clone() {
            self.application = Some(application);
        }

        if event.target.as_ref().is_some_and(|target| target.password) {
            self.privacy_paused = true;
            self.pending_actions.clear();
            self.pending_evidence.clear();
            return self.emit(
                &event,
                ReportKind::PrivacyPause,
                "Observation paused for a password field.".to_string(),
                1.0,
            );
        }

        match event.kind {
            SensorKind::SessionStarted => self.emit(
                &event,
                ReportKind::Heartbeat,
                "UI observation started.".to_string(),
                1.0,
            ),
            SensorKind::SessionStopped => self.emit(
                &event,
                ReportKind::Heartbeat,
                "UI observation stopped.".to_string(),
                1.0,
            ),
            SensorKind::ForegroundChanged => {
                self.pending_actions.push(ObservedAction {
                    action_type: ActionType::WindowChange,
                    target: self
                        .application
                        .as_ref()
                        .map(|application| application.process_name.clone()),
                    result: None,
                });
                self.pending_evidence.push(EvidenceRef {
                    evidence_type: EvidenceType::Window,
                    reference: format!("event:{}", event.sequence),
                    redacted: event.redacted,
                });
                self.emit(
                    &event,
                    ReportKind::Progress,
                    format!(
                        "Foreground application changed to {}.",
                        self.application_name()
                    ),
                    0.99,
                )
            }
            SensorKind::Click => {
                self.push_action(ActionType::Click, &event);
                Ok(None)
            }
            SensorKind::Shortcut => {
                self.push_action(ActionType::Shortcut, &event);
                Ok(None)
            }
            SensorKind::TypingActivity | SensorKind::TextChanged => {
                self.push_action(ActionType::Typing, &event);
                Ok(None)
            }
            SensorKind::Scroll => {
                self.push_action(ActionType::Scroll, &event);
                Ok(None)
            }
            SensorKind::FrameChanged => {
                if let Some(reference) = string_data(&event, "ref") {
                    self.pending_evidence.push(EvidenceRef {
                        evidence_type: EvidenceType::Keyframe,
                        reference,
                        redacted: event.redacted,
                    });
                }
                Ok(None)
            }
            SensorKind::ElementFocused
            | SensorKind::SelectionChanged
            | SensorKind::ToggleChanged
            | SensorKind::DialogClosed
            | SensorKind::StructureChanged => {
                self.push_uia_evidence(&event);
                Ok(None)
            }
            SensorKind::ElementInvoked => {
                self.push_uia_evidence(&event);
                self.emit(
                    &event,
                    ReportKind::Progress,
                    format!("Invoked {}.", target_label(&event)),
                    0.9,
                )
            }
            SensorKind::DialogOpened => {
                self.push_uia_evidence(&event);
                let is_error = string_data(&event, "severity")
                    .is_some_and(|severity| severity.eq_ignore_ascii_case("error"));
                self.emit(
                    &event,
                    if is_error {
                        ReportKind::Error
                    } else {
                        ReportKind::Progress
                    },
                    if is_error {
                        format!("An error dialog appeared in {}.", self.application_name())
                    } else {
                        format!("A dialog opened in {}.", self.application_name())
                    },
                    if is_error { 0.95 } else { 0.85 },
                )
            }
            SensorKind::ErrorObserved => self.emit(
                &event,
                ReportKind::Error,
                string_data(&event, "summary").unwrap_or_else(|| {
                    format!("An error was observed in {}.", self.application_name())
                }),
                0.95,
            ),
            SensorKind::HelpOpened => self.emit(
                &event,
                ReportKind::HelpSeeking,
                string_data(&event, "summary").unwrap_or_else(|| {
                    format!("Help content was opened in {}.", self.application_name())
                }),
                0.95,
            ),
            SensorKind::StepCompleted => self.emit(
                &event,
                ReportKind::StepCompleted,
                string_data(&event, "summary").unwrap_or_else(|| {
                    format!("A task step was completed in {}.", self.application_name())
                }),
                0.9,
            ),
            SensorKind::PrivacyPaused => {
                self.privacy_paused = true;
                self.pending_actions.clear();
                self.pending_evidence.clear();
                self.emit(
                    &event,
                    ReportKind::PrivacyPause,
                    "Observation paused by the privacy filter.".to_string(),
                    1.0,
                )
            }
            SensorKind::PrivacyResumed => {
                self.privacy_paused = false;
                self.emit(
                    &event,
                    ReportKind::Heartbeat,
                    "Observation resumed after a privacy pause.".to_string(),
                    1.0,
                )
            }
            SensorKind::Heartbeat => {
                if self.pending_actions.is_empty() && self.pending_evidence.is_empty() {
                    Ok(None)
                } else {
                    self.emit(
                        &event,
                        ReportKind::Progress,
                        format!("Activity continued in {}.", self.application_name()),
                        0.75,
                    )
                }
            }
        }
    }

    pub fn finish(&mut self) -> Result<Option<UiObservationReport>, ReplayError> {
        if self.pending_actions.is_empty() && self.pending_evidence.is_empty() {
            return Ok(None);
        }

        let session_id = self
            .session_id
            .clone()
            .ok_or_else(|| ReplayError::new("cannot finish a replay without a session"))?;
        let observed_at = self
            .last_observed_at
            .clone()
            .ok_or_else(|| ReplayError::new("cannot finish a replay without an event"))?;
        let synthetic = SensorEvent {
            version: PROTOCOL_VERSION,
            session_id,
            sequence: self.last_event_sequence.unwrap_or(0),
            observed_at,
            source: SensorSource::System,
            kind: SensorKind::Heartbeat,
            application: self.application.clone(),
            target: None,
            data: Default::default(),
            redacted: false,
        };
        self.emit(
            &synthetic,
            ReportKind::Uncertain,
            format!(
                "Unclassified activity remained in {} at the end of the replay.",
                self.application_name()
            ),
            0.5,
        )
    }

    pub fn summary(&self) -> ReplaySummary {
        ReplaySummary {
            events: self.events,
            reports: self.reports,
            session_id: self.session_id.clone(),
        }
    }

    fn validate(&mut self, event: &SensorEvent) -> Result<(), ReplayError> {
        if event.version != PROTOCOL_VERSION {
            return Err(ReplayError::new(format!(
                "unsupported protocol version {}; expected {}",
                event.version, PROTOCOL_VERSION
            )));
        }
        if event.session_id.trim().is_empty() {
            return Err(ReplayError::new("sessionId must not be empty"));
        }
        if event.observed_at.trim().is_empty() {
            return Err(ReplayError::new("observedAt must not be empty"));
        }
        if let Some(session_id) = &self.session_id {
            if session_id != &event.session_id {
                return Err(ReplayError::new(format!(
                    "replay contains multiple sessions: {session_id} and {}",
                    event.session_id
                )));
            }
        } else {
            self.session_id = Some(event.session_id.clone());
        }
        if let Some(previous) = self.last_event_sequence {
            if event.sequence <= previous {
                return Err(ReplayError::new(format!(
                    "event sequence {} must be greater than {previous}",
                    event.sequence
                )));
            }
        }
        self.last_event_sequence = Some(event.sequence);
        Ok(())
    }

    fn push_action(&mut self, action_type: ActionType, event: &SensorEvent) {
        if self.privacy_paused {
            return;
        }
        self.pending_actions.push(ObservedAction {
            action_type,
            target: string_data(event, "shortcut").or_else(|| target_name(event)),
            result: string_data(event, "result"),
        });
    }

    fn push_uia_evidence(&mut self, event: &SensorEvent) {
        if self.privacy_paused {
            return;
        }
        self.pending_evidence.push(EvidenceRef {
            evidence_type: EvidenceType::Uia,
            reference: format!("event:{}", event.sequence),
            redacted: event.redacted,
        });
    }

    fn emit(
        &mut self,
        event: &SensorEvent,
        kind: ReportKind,
        summary: String,
        confidence: f32,
    ) -> Result<Option<UiObservationReport>, ReplayError> {
        self.report_sequence += 1;
        self.reports += 1;
        let observed_from = self
            .interval_started_at
            .take()
            .unwrap_or_else(|| event.observed_at.clone());
        let actions = std::mem::take(&mut self.pending_actions);
        let evidence = std::mem::take(&mut self.pending_evidence);

        Ok(Some(UiObservationReport {
            version: PROTOCOL_VERSION,
            session_id: event.session_id.clone(),
            sequence: self.report_sequence,
            observed_from,
            observed_to: event.observed_at.clone(),
            kind,
            application: self.application.clone().unwrap_or_else(unknown_application),
            summary,
            actions,
            evidence,
            candidate_tokens: Vec::new(),
            confidence,
        }))
    }

    fn application_name(&self) -> &str {
        self.application
            .as_ref()
            .map(|application| application.process_name.as_str())
            .unwrap_or("the active application")
    }
}

fn unknown_application() -> ApplicationContext {
    ApplicationContext {
        process_name: "unknown".to_string(),
        process_id: None,
        window_title: None,
    }
}

fn target_name(event: &SensorEvent) -> Option<String> {
    event.target.as_ref().and_then(|target| {
        target
            .name
            .clone()
            .or_else(|| target.automation_id.clone())
            .or_else(|| target.control_type.clone())
    })
}

fn target_label(event: &SensorEvent) -> String {
    target_name(event).unwrap_or_else(|| "a UI element".to_string())
}

fn string_data(event: &SensorEvent, key: &str) -> Option<String> {
    event
        .data
        .get(key)
        .and_then(|value| value.as_str())
        .map(ToOwned::to_owned)
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::json;

    use super::*;
    use crate::model::{SensorSource, SensorTarget};

    fn event(sequence: u64, kind: SensorKind) -> SensorEvent {
        SensorEvent {
            version: PROTOCOL_VERSION,
            session_id: "session-1".to_string(),
            sequence,
            observed_at: format!("2026-06-15T10:00:{sequence:02}Z"),
            source: SensorSource::Uia,
            kind,
            application: Some(ApplicationContext {
                process_name: "explorer.exe".to_string(),
                process_id: Some(42),
                window_title: Some("Documents".to_string()),
            }),
            target: None,
            data: BTreeMap::new(),
            redacted: false,
        }
    }

    #[test]
    fn aggregates_actions_until_a_step_boundary() {
        let mut engine = ReplayEngine::default();
        assert!(engine
            .process(event(1, SensorKind::SessionStarted))
            .unwrap()
            .is_some());

        let mut click = event(2, SensorKind::Click);
        click.target = Some(SensorTarget {
            control_type: Some("Button".to_string()),
            automation_id: Some("NewFolder".to_string()),
            name: Some("New folder".to_string()),
            password: false,
        });
        assert!(engine.process(click).unwrap().is_none());

        let mut completed = event(3, SensorKind::StepCompleted);
        completed.data.insert(
            "summary".to_string(),
            json!("Created a folder named Invoices."),
        );
        let report = engine.process(completed).unwrap().unwrap();

        assert_eq!(report.kind, ReportKind::StepCompleted);
        assert_eq!(report.actions.len(), 1);
        assert_eq!(report.actions[0].action_type, ActionType::Click);
        assert_eq!(report.summary, "Created a folder named Invoices.");
    }

    #[test]
    fn password_focus_clears_pending_evidence() {
        let mut engine = ReplayEngine::default();
        engine
            .process(event(1, SensorKind::SessionStarted))
            .unwrap();
        engine.process(event(2, SensorKind::Click)).unwrap();

        let mut password = event(3, SensorKind::ElementFocused);
        password.target = Some(SensorTarget {
            control_type: Some("Edit".to_string()),
            automation_id: None,
            name: Some("Password".to_string()),
            password: true,
        });
        let report = engine.process(password).unwrap().unwrap();

        assert_eq!(report.kind, ReportKind::PrivacyPause);
        assert!(report.actions.is_empty());
        assert!(report.evidence.is_empty());
    }

    #[test]
    fn rejects_non_monotonic_sequences() {
        let mut engine = ReplayEngine::default();
        engine
            .process(event(2, SensorKind::SessionStarted))
            .unwrap();
        let error = engine.process(event(2, SensorKind::Heartbeat)).unwrap_err();

        assert!(error.to_string().contains("must be greater"));
    }

    #[test]
    fn ignores_activity_until_privacy_resumes() {
        let mut engine = ReplayEngine::default();
        engine
            .process(event(1, SensorKind::SessionStarted))
            .unwrap();
        engine.process(event(2, SensorKind::PrivacyPaused)).unwrap();

        let mut sensitive_click = event(3, SensorKind::Click);
        sensitive_click.application = Some(ApplicationContext {
            process_name: "password-manager.exe".to_string(),
            process_id: Some(99),
            window_title: Some("Private vault".to_string()),
        });
        assert!(engine.process(sensitive_click).unwrap().is_none());

        let resumed = engine
            .process(event(4, SensorKind::PrivacyResumed))
            .unwrap()
            .unwrap();
        assert_eq!(resumed.kind, ReportKind::Heartbeat);
        assert_eq!(resumed.application.process_name, "explorer.exe");
        assert_eq!(resumed.observed_from, "2026-06-15T10:00:04Z");
    }

    #[test]
    fn text_changed_aggregates_as_typing() {
        let mut engine = ReplayEngine::default();
        engine
            .process(event(1, SensorKind::SessionStarted))
            .unwrap();

        let mut text_changed = event(2, SensorKind::TextChanged);
        text_changed.target = Some(SensorTarget {
            control_type: Some("Edit".to_string()),
            automation_id: Some("SearchBox".to_string()),
            name: Some("Search".to_string()),
            password: false,
        });
        assert!(engine.process(text_changed).unwrap().is_none());

        let mut completed = event(3, SensorKind::StepCompleted);
        completed.data.insert(
            "summary".to_string(),
            json!("Typed a search query."),
        );
        let report = engine.process(completed).unwrap().unwrap();

        assert_eq!(report.actions.len(), 1);
        assert_eq!(report.actions[0].action_type, ActionType::Typing);
    }

    #[test]
    fn structure_changed_produces_uia_evidence() {
        let mut engine = ReplayEngine::default();
        engine
            .process(event(1, SensorKind::SessionStarted))
            .unwrap();

        let mut structure = event(2, SensorKind::StructureChanged);
        structure.target = Some(SensorTarget {
            control_type: Some("Tree".to_string()),
            automation_id: Some("FileTree".to_string()),
            name: None,
            password: false,
        });
        assert!(engine.process(structure).unwrap().is_none());

        let mut completed = event(3, SensorKind::StepCompleted);
        completed.data.insert(
            "summary".to_string(),
            json!("Expanded a folder."),
        );
        let report = engine.process(completed).unwrap().unwrap();

        assert_eq!(report.evidence.len(), 1);
        assert_eq!(report.evidence[0].evidence_type, EvidenceType::Uia);
    }
}
