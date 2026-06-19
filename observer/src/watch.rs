use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::thread;
use std::time::Duration;

use crate::capture::watch_window_keyframes_continuous;
use crate::clock::observed_at_now;
use crate::model::{SensorEvent, SensorKind, SensorSource, PROTOCOL_VERSION};
use crate::raw_input::watch_raw_input_continuous;
use crate::uia::watch_focused_element_continuous;

pub struct WatchSessionOptions<'a> {
    pub hwnd: u64,
    pub session_id: &'a str,
    pub keyframe_dir: Option<&'a Path>,
    pub keyframe_retain: usize,
    pub change_threshold: f64,
    pub interval_ms: u64,
    pub heartbeat_every: u64,
    pub samples: Option<usize>,
    pub event_driven: bool,
}

/// Orchestrates the unified watch loop.
/// Spawns separate threads for UIA focus polling, Raw Input hooks, and Graphics Capture,
/// channeling all events to a single sequence on stdout.
pub fn watch_session(
    options: WatchSessionOptions<'_>,
    on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    let WatchSessionOptions {
        hwnd,
        session_id,
        keyframe_dir,
        keyframe_retain,
        change_threshold,
        interval_ms,
        heartbeat_every,
        samples,
        event_driven,
    } = options;

    let should_stop = Arc::new(AtomicBool::new(false));
    let pause_input = Arc::new(AtomicBool::new(false));

    let (tx, rx) = mpsc::channel::<SensorEvent>();

    on_event(session_control_event(session_id, SensorKind::SessionStarted))?;

    // Spawn a thread to monitor stdin EOF so we shut down cleanly when parent closes stdin.
    let should_stop_stdin = should_stop.clone();
    thread::spawn(move || {
        let mut line = String::new();
        let stdin = std::io::stdin();
        while let Ok(bytes) = stdin.read_line(&mut line) {
            if bytes == 0 {
                should_stop_stdin.store(true, Ordering::Relaxed);
                break;
            }
            line.clear();
        }
    });

    // Thread 1: UIA Focus polling / event hooks
    let should_stop_uia = should_stop.clone();
    let pause_input_uia = pause_input.clone();
    let session_id_uia = session_id.to_string();
    let uia_tx = tx.clone();
    let uia_handle = thread::spawn(move || {
        let mut forward_event = |event| uia_tx.send(event).map_err(|error| error.to_string());
        let result = watch_focused_element_continuous(
            hwnd,
            Duration::from_millis(500),
            &session_id_uia,
            should_stop_uia.clone(),
            pause_input_uia,
            event_driven,
            &mut forward_event,
        );
        if result.is_err() {
            should_stop_uia.store(true, Ordering::Relaxed);
        }
        result
    });

    // Thread 2: Raw Input hooks
    let should_stop_input = should_stop.clone();
    let pause_input_input = pause_input.clone();
    let session_id_input = session_id.to_string();
    let input_tx = tx.clone();
    let input_handle = thread::spawn(move || {
        let mut forward_event = |event| input_tx.send(event).map_err(|error| error.to_string());
        let result = watch_raw_input_continuous(
            &session_id_input,
            12, // TYPING_FLUSH_THRESHOLD
            should_stop_input.clone(),
            pause_input_input,
            &mut forward_event,
        );
        if result.is_err() {
            should_stop_input.store(true, Ordering::Relaxed);
        }
        result
    });

    // Thread 3: Capture / Keyframes
    let should_stop_capture = should_stop.clone();
    let session_id_capture = session_id.to_string();
    let keyframe_dir_capture = keyframe_dir.map(|path| path.to_path_buf());
    let capture_tx = tx;
    let capture_handle = thread::spawn(move || {
        let mut forward_event = |event| capture_tx.send(event).map_err(|error| error.to_string());
        let result = watch_window_keyframes_continuous(
            hwnd,
            Duration::from_millis(interval_ms),
            change_threshold,
            heartbeat_every,
            &session_id_capture,
            keyframe_dir_capture.as_deref(),
            keyframe_retain,
            should_stop_capture.clone(),
            event_driven,
            &mut forward_event,
        );
        if result.is_err() {
            should_stop_capture.store(true, Ordering::Relaxed);
        }
        result
    });

    let mut sequence = 0u64;
    let mut emitted = 0usize;

    // Process events sequentially on the main thread.
    while let Ok(mut event) = rx.recv() {
        sequence += 1;
        event.sequence = sequence;
        on_event(event)?;

        emitted += 1;
        if let Some(max) = samples {
            if emitted >= max {
                should_stop.store(true, Ordering::Relaxed);
                break;
            }
        }

        if should_stop.load(Ordering::Relaxed) {
            break;
        }
    }

    // Ensure all threads terminate and fetch their results.
    let uia_res = uia_handle
        .join()
        .map_err(|_| "UIA thread panicked".to_string())?;
    let input_res = input_handle
        .join()
        .map_err(|_| "Raw Input thread panicked".to_string())?;
    let capture_res = capture_handle
        .join()
        .map_err(|_| "Capture thread panicked".to_string())?;

    let stop_result = on_event(session_control_event(session_id, SensorKind::SessionStopped));

    uia_res?;
    input_res?;
    capture_res?;
    stop_result?;

    Ok(())
}

fn session_control_event(session_id: &str, kind: SensorKind) -> SensorEvent {
    SensorEvent {
        version: PROTOCOL_VERSION,
        session_id: session_id.to_string(),
        sequence: 0,
        observed_at: observed_at_now(),
        source: SensorSource::System,
        kind,
        application: None,
        target: None,
        data: std::collections::BTreeMap::new(),
        redacted: false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{SensorKind, SensorSource};
    use crate::PROTOCOL_VERSION;

    #[test]
    fn test_watch_session_monotonic_sequences() {
        let (tx, rx) = mpsc::channel::<SensorEvent>();

        // Create a mock processor that receives events and checks monotonic sequences.
        let mut sequence = 0u64;
        let mut emitted = Vec::new();

        let tx_clone = tx.clone();
        thread::spawn(move || {
            for _i in 1..=3 {
                let event = SensorEvent {
                    version: PROTOCOL_VERSION,
                    session_id: "test-session".to_string(),
                    sequence: 0, // Should be overwritten
                    observed_at: "t0".to_string(),
                    source: SensorSource::Uia,
                    kind: SensorKind::ElementFocused,
                    application: None,
                    target: None,
                    data: std::collections::BTreeMap::new(),
                    redacted: false,
                };
                tx_clone.send(event).unwrap();
            }
        });

        // Let the receiver thread collect them.
        drop(tx); // drop main sender so rx loop finishes

        while let Ok(mut event) = rx.recv() {
            sequence += 1;
            event.sequence = sequence;
            emitted.push(event);
        }

        assert_eq!(emitted.len(), 3);
        assert_eq!(emitted[0].sequence, 1);
        assert_eq!(emitted[1].sequence, 2);
        assert_eq!(emitted[2].sequence, 3);
    }
}
