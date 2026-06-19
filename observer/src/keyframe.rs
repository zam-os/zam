//! Turn a stream of sampled frame signatures into sparse capture
//! `SensorEvent`s.
//!
//! The live capture pool delivers frames continuously, but the observer
//! contract wants sparse, structured evidence: a `frame-changed` event only
//! when the window visually changes (a new keyframe), plus an occasional
//! `heartbeat` so a static window still reports liveness and lets the replay
//! engine flush accumulated keyframe evidence.
//!
//! This decision is kept free of any Windows or capture dependency so it can be
//! unit tested deterministically; the live loop in `capture` feeds it real
//! signatures and wall-clock timestamps.

use std::collections::BTreeMap;

use serde_json::Value;

use crate::frame_signature::FrameSignature;
use crate::model::{ApplicationContext, SensorEvent, SensorKind, SensorSource, PROTOCOL_VERSION};

/// Builds capture `SensorEvent`s from successive frame signatures.
#[derive(Debug)]
pub struct KeyframeStream {
    session_id: String,
    application: ApplicationContext,
    redacted: bool,
    change_threshold: f64,
    heartbeat_every: u64,
    last_keyframe: Option<FrameSignature>,
    sequence: u64,
    keyframe_index: u64,
    samples_since_event: u64,
}

impl KeyframeStream {
    /// `heartbeat_every` is the number of consecutive unchanged samples after
    /// which a heartbeat is emitted; `0` disables heartbeats.
    pub fn new(
        session_id: impl Into<String>,
        application: ApplicationContext,
        redacted: bool,
        change_threshold: f64,
        heartbeat_every: u64,
    ) -> Self {
        Self {
            session_id: session_id.into(),
            application,
            redacted,
            change_threshold,
            heartbeat_every,
            last_keyframe: None,
            sequence: 0,
            keyframe_index: 0,
            samples_since_event: 0,
        }
    }

    /// Feed one sample. `signature` is `None` when the capture source delivered
    /// no new frame during the interval, which counts as "unchanged". Returns a
    /// `SensorEvent` to emit, or `None` when nothing is worth reporting yet.
    pub fn observe(
        &mut self,
        signature: Option<FrameSignature>,
        observed_at: impl Into<String>,
    ) -> Option<SensorEvent> {
        let changed = match (&signature, &self.last_keyframe) {
            // The first observed frame establishes the baseline keyframe.
            (Some(_), None) => true,
            (Some(current), Some(previous)) => {
                current.differs_from(previous, self.change_threshold)
            }
            (None, _) => false,
        };

        if changed {
            self.last_keyframe = signature;
            self.samples_since_event = 0;
            self.keyframe_index += 1;
            let reference = format!("memory:keyframe-{:04}", self.keyframe_index);
            return Some(self.event(SensorKind::FrameChanged, observed_at.into(), Some(reference)));
        }

        self.samples_since_event += 1;
        if self.heartbeat_every > 0 && self.samples_since_event >= self.heartbeat_every {
            self.samples_since_event = 0;
            return Some(self.event(SensorKind::Heartbeat, observed_at.into(), None));
        }

        None
    }

    fn event(
        &mut self,
        kind: SensorKind,
        observed_at: String,
        reference: Option<String>,
    ) -> SensorEvent {
        self.sequence += 1;
        let mut data = BTreeMap::new();
        if let Some(reference) = reference {
            data.insert("ref".to_string(), Value::String(reference));
        }

        SensorEvent {
            version: PROTOCOL_VERSION,
            session_id: self.session_id.clone(),
            sequence: self.sequence,
            observed_at,
            source: SensorSource::Capture,
            kind,
            application: Some(self.application.clone()),
            target: None,
            data,
            redacted: self.redacted,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::frame_signature::SIGNATURE_GRID;

    fn application() -> ApplicationContext {
        ApplicationContext {
            process_name: "explorer.exe".to_string(),
            process_id: Some(42),
            window_title: Some("Documents".to_string()),
        }
    }

    fn solid_signature(luma: u8) -> FrameSignature {
        // A full grid-sized frame fills every signature cell with one luminance,
        // so two solid frames differ by the maximum amount.
        let mut data = Vec::with_capacity(SIGNATURE_GRID * SIGNATURE_GRID * 4);
        for _ in 0..(SIGNATURE_GRID * SIGNATURE_GRID) {
            data.extend_from_slice(&[luma, luma, luma, 255]);
        }
        FrameSignature::from_bgra(&data, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4)
    }

    #[test]
    fn first_frame_is_always_a_keyframe() {
        let mut stream = KeyframeStream::new("session-1", application(), false, 0.02, 0);

        let event = stream
            .observe(Some(solid_signature(0)), "2026-06-19T10:00:00.000Z")
            .expect("first frame emits a keyframe");

        assert_eq!(event.kind, SensorKind::FrameChanged);
        assert_eq!(event.source, SensorSource::Capture);
        assert_eq!(event.sequence, 1);
        assert_eq!(
            event.data.get("ref").and_then(Value::as_str),
            Some("memory:keyframe-0001")
        );
    }

    #[test]
    fn unchanged_frames_emit_nothing_without_heartbeats() {
        let mut stream = KeyframeStream::new("session-1", application(), false, 0.02, 0);
        stream.observe(Some(solid_signature(0)), "t0");

        assert!(stream.observe(Some(solid_signature(0)), "t1").is_none());
        assert!(stream.observe(None, "t2").is_none());
    }

    #[test]
    fn a_visual_change_emits_an_incrementing_keyframe() {
        let mut stream = KeyframeStream::new("session-1", application(), false, 0.02, 0);
        stream.observe(Some(solid_signature(0)), "t0");
        stream.observe(Some(solid_signature(0)), "t1");

        let event = stream
            .observe(Some(solid_signature(255)), "t2")
            .expect("a changed frame emits a keyframe");

        assert_eq!(event.kind, SensorKind::FrameChanged);
        // sequence advances only on emitted events, not on every sample.
        assert_eq!(event.sequence, 2);
        assert_eq!(
            event.data.get("ref").and_then(Value::as_str),
            Some("memory:keyframe-0002")
        );
    }

    #[test]
    fn heartbeats_fire_after_enough_unchanged_samples() {
        let mut stream = KeyframeStream::new("session-1", application(), false, 0.02, 2);
        stream.observe(Some(solid_signature(0)), "t0"); // keyframe, resets counter

        assert!(stream.observe(Some(solid_signature(0)), "t1").is_none());
        let heartbeat = stream
            .observe(None, "t2")
            .expect("a heartbeat after two unchanged samples");

        assert_eq!(heartbeat.kind, SensorKind::Heartbeat);
        assert_eq!(heartbeat.sequence, 2);
        assert!(heartbeat.data.is_empty());
    }

    #[test]
    fn a_keyframe_resets_the_heartbeat_window() {
        let mut stream = KeyframeStream::new("session-1", application(), false, 0.02, 2);
        stream.observe(Some(solid_signature(0)), "t0");
        stream.observe(Some(solid_signature(0)), "t1"); // 1 unchanged sample
        stream.observe(Some(solid_signature(255)), "t2"); // keyframe resets the window

        // Only one unchanged sample since the reset: no heartbeat yet.
        assert!(stream.observe(Some(solid_signature(255)), "t3").is_none());
    }
}
