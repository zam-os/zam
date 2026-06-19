//! Live mouse and keyboard sensor via Raw Input.
//!
//! Raw Input metadata is aggregated into sparse, privacy-safe `SensorEvent`s:
//! a `click` per mouse button, a `scroll` per wheel notch, a `shortcut` (with a
//! readable label such as `Ctrl+S`) when a modifier is held, and otherwise an
//! aggregated `typing-activity` carrying only a keystroke count. Free text is
//! never reconstructed: unmodified keys are counted, not identified.
//!
//! The aggregation decision is kept free of any Win32 dependency so it is unit
//! testable; the Windows message loop feeds it parsed Raw Input records and
//! enriches each emitted event with the foreground process (dropping events
//! while a privacy-paused window is in front).

use std::collections::BTreeMap;
use std::time::Duration;

use serde_json::Value;

use crate::model::{SensorEvent, SensorKind, SensorSource, PROTOCOL_VERSION};

/// Number of unmodified keystrokes that flush one `typing-activity` event.
const TYPING_FLUSH_THRESHOLD: u32 = 12;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum MouseButton {
    Left,
    Right,
    Middle,
}

impl MouseButton {
    fn label(self) -> &'static str {
        match self {
            MouseButton::Left => "left",
            MouseButton::Right => "right",
            MouseButton::Middle => "middle",
        }
    }
}

/// A parsed Raw Input record, independent of the Win32 structures.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RawInput {
    KeyDown(u16),
    KeyUp(u16),
    MouseButton(MouseButton),
    Wheel { up: bool },
}

/// Aggregates Raw Input records into sparse `SensorEvent`s.
pub(crate) struct RawInputAggregator {
    session_id: String,
    flush_threshold: u32,
    ctrl: bool,
    alt: bool,
    shift: bool,
    win: bool,
    pending_typing: u32,
    sequence: u64,
}

impl RawInputAggregator {
    pub(crate) fn new(session_id: impl Into<String>, flush_threshold: u32) -> Self {
        Self {
            session_id: session_id.into(),
            flush_threshold: flush_threshold.max(1),
            ctrl: false,
            alt: false,
            shift: false,
            win: false,
            pending_typing: 0,
            sequence: 0,
        }
    }

    pub(crate) fn observe(&mut self, input: RawInput, observed_at: &str) -> Vec<SensorEvent> {
        match input {
            RawInput::KeyDown(vkey) => self.on_key_down(vkey, observed_at),
            RawInput::KeyUp(vkey) => {
                self.set_modifier(vkey, false);
                Vec::new()
            }
            RawInput::MouseButton(button) => {
                let mut data = BTreeMap::new();
                data.insert(
                    "button".to_string(),
                    Value::String(button.label().to_string()),
                );
                self.discrete(SensorKind::Click, data, observed_at)
            }
            RawInput::Wheel { up } => {
                let mut data = BTreeMap::new();
                data.insert(
                    "direction".to_string(),
                    Value::String(if up { "up" } else { "down" }.to_string()),
                );
                self.discrete(SensorKind::Scroll, data, observed_at)
            }
        }
    }

    /// Emit any buffered typing activity at the end of a watch.
    pub(crate) fn finish(&mut self, observed_at: &str) -> Vec<SensorEvent> {
        self.flush_typing(observed_at).into_iter().collect()
    }

    fn on_key_down(&mut self, vkey: u16, observed_at: &str) -> Vec<SensorEvent> {
        if self.set_modifier(vkey, true) {
            return Vec::new();
        }

        if self.ctrl || self.alt || self.win {
            // A modified key is an explicit shortcut: flush typing first so the
            // event order stays faithful.
            let mut events: Vec<SensorEvent> = self.flush_typing(observed_at).into_iter().collect();
            let mut data = BTreeMap::new();
            data.insert(
                "shortcut".to_string(),
                Value::String(self.shortcut_label(vkey)),
            );
            events.push(self.event(SensorKind::Shortcut, data, observed_at));
            events
        } else {
            self.pending_typing += 1;
            if self.pending_typing >= self.flush_threshold {
                self.flush_typing(observed_at).into_iter().collect()
            } else {
                Vec::new()
            }
        }
    }

    fn discrete(
        &mut self,
        kind: SensorKind,
        data: BTreeMap<String, Value>,
        observed_at: &str,
    ) -> Vec<SensorEvent> {
        let mut events: Vec<SensorEvent> = self.flush_typing(observed_at).into_iter().collect();
        events.push(self.event(kind, data, observed_at));
        events
    }

    fn flush_typing(&mut self, observed_at: &str) -> Option<SensorEvent> {
        if self.pending_typing == 0 {
            return None;
        }
        let count = self.pending_typing;
        self.pending_typing = 0;
        let mut data = BTreeMap::new();
        data.insert("keyCount".to_string(), Value::from(count));
        Some(self.event(SensorKind::TypingActivity, data, observed_at))
    }

    fn event(
        &mut self,
        kind: SensorKind,
        data: BTreeMap<String, Value>,
        observed_at: &str,
    ) -> SensorEvent {
        self.sequence += 1;
        SensorEvent {
            version: PROTOCOL_VERSION,
            session_id: self.session_id.clone(),
            sequence: self.sequence,
            observed_at: observed_at.to_string(),
            source: SensorSource::Input,
            kind,
            application: None,
            target: None,
            data,
            redacted: false,
        }
    }

    /// Update modifier state. Returns true when `vkey` is itself a modifier.
    fn set_modifier(&mut self, vkey: u16, down: bool) -> bool {
        match vkey {
            0x10 | 0xA0 | 0xA1 => self.shift = down,
            0x11 | 0xA2 | 0xA3 => self.ctrl = down,
            0x12 | 0xA4 | 0xA5 => self.alt = down,
            0x5B | 0x5C => self.win = down,
            _ => return false,
        }
        true
    }

    fn shortcut_label(&self, vkey: u16) -> String {
        let mut label = String::new();
        if self.ctrl {
            label.push_str("Ctrl+");
        }
        if self.alt {
            label.push_str("Alt+");
        }
        if self.shift {
            label.push_str("Shift+");
        }
        if self.win {
            label.push_str("Win+");
        }
        label.push_str(&key_name(vkey));
        label
    }
}

/// Readable name for a virtual-key code, or `Key-0xNN` when unmapped.
pub(crate) fn key_name(vkey: u16) -> String {
    if (0x41..=0x5A).contains(&vkey) || (0x30..=0x39).contains(&vkey) {
        // 'A'..='Z' and '0'..='9' share their ASCII value.
        return (vkey as u8 as char).to_string();
    }
    let name = match vkey {
        0x08 => "Backspace",
        0x09 => "Tab",
        0x0D => "Enter",
        0x1B => "Esc",
        0x20 => "Space",
        0x21 => "PageUp",
        0x22 => "PageDown",
        0x23 => "End",
        0x24 => "Home",
        0x25 => "Left",
        0x26 => "Up",
        0x27 => "Right",
        0x28 => "Down",
        0x2D => "Insert",
        0x2E => "Delete",
        0x70 => "F1",
        0x71 => "F2",
        0x72 => "F3",
        0x73 => "F4",
        0x74 => "F5",
        0x75 => "F6",
        0x76 => "F7",
        0x77 => "F8",
        0x78 => "F9",
        0x79 => "F10",
        0x7A => "F11",
        0x7B => "F12",
        _ => return format!("Key-0x{vkey:02X}"),
    };
    name.to_string()
}

#[cfg(target_os = "windows")]
pub fn watch_raw_input(
    duration: Duration,
    session_id: &str,
    on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_raw_input::watch_raw_input(duration, session_id, TYPING_FLUSH_THRESHOLD, on_event)
}

#[cfg(target_os = "windows")]
pub fn watch_raw_input_continuous(
    session_id: &str,
    flush_threshold: u32,
    should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_raw_input::watch_raw_input_continuous(
        session_id,
        flush_threshold,
        should_stop,
        pause_input,
        on_event,
    )
}

#[cfg(not(target_os = "windows"))]
pub fn watch_raw_input(
    _duration: Duration,
    _session_id: &str,
    _on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("Raw Input is only available on Windows".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn watch_raw_input_continuous(
    _session_id: &str,
    _flush_threshold: u32,
    _should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("Raw Input is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
mod windows_raw_input {
    use std::ffi::c_void;
    use std::mem::size_of;
    use std::thread;
    use std::time::{Duration, Instant};

    use windows::core::w;
    use windows::Win32::Foundation::{HWND, LPARAM};
    use windows::Win32::UI::Input::{
        GetRawInputData, RegisterRawInputDevices, HRAWINPUT, RAWINPUT, RAWINPUTDEVICE,
        RAWINPUTHEADER, RIDEV_INPUTSINK, RID_INPUT,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        CreateWindowExW, DispatchMessageW, PeekMessageW, TranslateMessage, HWND_MESSAGE, MSG,
        PM_REMOVE, WINDOW_EX_STYLE, WINDOW_STYLE, WM_INPUT,
    };

    use super::{MouseButton, RawInput, RawInputAggregator};
    use crate::clock::observed_at_now;
    use crate::model::{ApplicationContext, SensorEvent};
    use crate::picker::foreground_window;

    const RI_KEY_BREAK: u16 = 0x01;
    const RIM_TYPE_MOUSE: u32 = 0;
    const RIM_TYPE_KEYBOARD: u32 = 1;
    const RI_MOUSE_LEFT_DOWN: u16 = 0x0001;
    const RI_MOUSE_RIGHT_DOWN: u16 = 0x0004;
    const RI_MOUSE_MIDDLE_DOWN: u16 = 0x0010;
    const RI_MOUSE_WHEEL: u16 = 0x0400;

    struct ForegroundCache {
        last_window: Option<crate::picker::WindowInfo>,
        last_checked: Option<Instant>,
    }

    impl ForegroundCache {
        fn new() -> Self {
            Self {
                last_window: None,
                last_checked: None,
            }
        }

        fn get(&mut self) -> Option<crate::picker::WindowInfo> {
            let now = Instant::now();
            if let Some(last_time) = self.last_checked {
                if now.duration_since(last_time) < Duration::from_millis(250) {
                    return self.last_window.clone();
                }
            }

            self.last_window = foreground_window().ok().flatten();
            self.last_checked = Some(now);
            self.last_window.clone()
        }
    }

    pub fn watch_raw_input(
        duration: Duration,
        session_id: &str,
        flush_threshold: u32,
        on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        let hwnd = create_message_window()?;
        register_devices(hwnd)?;

        let mut aggregator = RawInputAggregator::new(session_id, flush_threshold);
        let mut cache = ForegroundCache::new();
        let started = Instant::now();

        while started.elapsed() < duration {
            let mut message = MSG::default();
            while unsafe { PeekMessageW(&mut message, None, 0, 0, PM_REMOVE) }.as_bool() {
                if message.message == WM_INPUT {
                    for input in read_raw_inputs(message.lParam) {
                        let observed_at = observed_at_now();
                        for event in aggregator.observe(input, &observed_at) {
                            emit(event, &mut cache, on_event)?;
                        }
                    }
                } else {
                    let _ = unsafe { TranslateMessage(&message) };
                    unsafe { DispatchMessageW(&message) };
                }
            }
            thread::sleep(Duration::from_millis(5));
        }

        for event in aggregator.finish(&observed_at_now()) {
            emit(event, &mut cache, on_event)?;
        }
        Ok(())
    }

    pub fn watch_raw_input_continuous(
        session_id: &str,
        flush_threshold: u32,
        should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
        on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        let hwnd = create_message_window()?;
        register_devices(hwnd)?;

        let mut aggregator = RawInputAggregator::new(session_id, flush_threshold);
        let mut cache = ForegroundCache::new();

        while !should_stop.load(std::sync::atomic::Ordering::Relaxed) {
            let mut message = MSG::default();
            while unsafe { PeekMessageW(&mut message, None, 0, 0, PM_REMOVE) }.as_bool() {
                if message.message == WM_INPUT {
                    for input in read_raw_inputs(message.lParam) {
                        let observed_at = observed_at_now();
                        for event in aggregator.observe(input, &observed_at) {
                            emit_continuous(event, &pause_input, &mut cache, on_event)?;
                        }
                    }
                } else {
                    let _ = unsafe { TranslateMessage(&message) };
                    unsafe { DispatchMessageW(&message) };
                }
            }
            thread::sleep(Duration::from_millis(5));
        }

        for event in aggregator.finish(&observed_at_now()) {
            emit_continuous(event, &pause_input, &mut cache, on_event)?;
        }
        Ok(())
    }

    /// Attach the foreground process to an event, or drop it while a
    /// privacy-paused window (password manager, auth dialog) is in front.
    fn emit(
        mut event: SensorEvent,
        cache: &mut ForegroundCache,
        on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        if let Some(window) = cache.get() {
            if window.privacy.is_paused() {
                return Ok(());
            }
            event.application = Some(ApplicationContext {
                process_name: window.process_name,
                process_id: Some(window.process_id),
                window_title: None,
            });
        }
        on_event(&event)
    }

    fn emit_continuous(
        mut event: SensorEvent,
        pause_input: &std::sync::atomic::AtomicBool,
        cache: &mut ForegroundCache,
        on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        if pause_input.load(std::sync::atomic::Ordering::Relaxed) {
            return Ok(());
        }

        if let Some(window) = cache.get() {
            if window.privacy.is_paused() {
                return Ok(());
            }
            event.application = Some(ApplicationContext {
                process_name: window.process_name,
                process_id: Some(window.process_id),
                window_title: None,
            });
        }
        on_event(event)
    }

    fn create_message_window() -> Result<HWND, String> {
        // A message-only window is enough to be the raw-input target; the
        // built-in "Static" class avoids registering one. WM_INPUT lands in this
        // thread's queue and is drained with PeekMessage, so no window proc is
        // needed.
        let hwnd = unsafe {
            CreateWindowExW(
                WINDOW_EX_STYLE(0),
                w!("Static"),
                w!("zam-observer"),
                WINDOW_STYLE(0),
                0,
                0,
                0,
                0,
                Some(HWND_MESSAGE),
                None,
                None,
                None,
            )
        }
        .map_err(|error| format!("failed to create message window: {error}"))?;
        Ok(hwnd)
    }

    fn register_devices(hwnd: HWND) -> Result<(), String> {
        let devices = [
            RAWINPUTDEVICE {
                usUsagePage: 0x01,
                usUsage: 0x02, // mouse
                dwFlags: RIDEV_INPUTSINK,
                hwndTarget: hwnd,
            },
            RAWINPUTDEVICE {
                usUsagePage: 0x01,
                usUsage: 0x06, // keyboard
                dwFlags: RIDEV_INPUTSINK,
                hwndTarget: hwnd,
            },
        ];
        unsafe {
            RegisterRawInputDevices(&devices, size_of::<RAWINPUTDEVICE>() as u32)
                .map_err(|error| format!("failed to register raw input devices: {error}"))
        }
    }

    fn read_raw_inputs(lparam: LPARAM) -> Vec<RawInput> {
        let handle = HRAWINPUT(lparam.0 as *mut c_void);
        let header_size = size_of::<RAWINPUTHEADER>() as u32;

        let mut size = 0u32;
        let probe = unsafe { GetRawInputData(handle, RID_INPUT, None, &mut size, header_size) };
        if probe == u32::MAX || size == 0 {
            return Vec::new();
        }

        let mut buffer = vec![0u8; size as usize];
        let read = unsafe {
            GetRawInputData(
                handle,
                RID_INPUT,
                Some(buffer.as_mut_ptr() as *mut c_void),
                &mut size,
                header_size,
            )
        };
        if read == u32::MAX || read == 0 {
            return Vec::new();
        }

        let raw = unsafe { &*(buffer.as_ptr() as *const RAWINPUT) };
        match raw.header.dwType {
            RIM_TYPE_KEYBOARD => read_keyboard(raw),
            RIM_TYPE_MOUSE => read_mouse(raw),
            _ => Vec::new(),
        }
    }

    fn read_keyboard(raw: &RAWINPUT) -> Vec<RawInput> {
        let keyboard = unsafe { raw.data.keyboard };
        let vkey = keyboard.VKey;
        // Spurious/placeholder key codes Windows emits for some keyboards.
        if vkey == 0 || vkey == 0xFF {
            return Vec::new();
        }
        if keyboard.Flags & RI_KEY_BREAK != 0 {
            vec![RawInput::KeyUp(vkey)]
        } else {
            vec![RawInput::KeyDown(vkey)]
        }
    }

    fn read_mouse(raw: &RAWINPUT) -> Vec<RawInput> {
        let mouse = unsafe { raw.data.mouse };
        let button_flags = unsafe { mouse.Anonymous.Anonymous.usButtonFlags };
        let mut inputs = Vec::new();

        if button_flags & RI_MOUSE_LEFT_DOWN != 0 {
            inputs.push(RawInput::MouseButton(MouseButton::Left));
        }
        if button_flags & RI_MOUSE_RIGHT_DOWN != 0 {
            inputs.push(RawInput::MouseButton(MouseButton::Right));
        }
        if button_flags & RI_MOUSE_MIDDLE_DOWN != 0 {
            inputs.push(RawInput::MouseButton(MouseButton::Middle));
        }
        if button_flags & RI_MOUSE_WHEEL != 0 {
            let delta = unsafe { mouse.Anonymous.Anonymous.usButtonData } as i16;
            if delta != 0 {
                inputs.push(RawInput::Wheel { up: delta > 0 });
            }
        }

        inputs
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn collect_kinds(events: &[SensorEvent]) -> Vec<SensorKind> {
        events.iter().map(|event| event.kind.clone()).collect()
    }

    #[test]
    fn names_keys_and_falls_back() {
        assert_eq!(key_name(0x53), "S");
        assert_eq!(key_name(0x31), "1");
        assert_eq!(key_name(0x0D), "Enter");
        assert_eq!(key_name(0x70), "F1");
        assert_eq!(key_name(0x01), "Key-0x01");
    }

    #[test]
    fn a_held_modifier_turns_a_key_into_a_labeled_shortcut() {
        let mut aggregator = RawInputAggregator::new("session-1", TYPING_FLUSH_THRESHOLD);
        assert!(aggregator.observe(RawInput::KeyDown(0x11), "t0").is_empty()); // Ctrl down

        let events = aggregator.observe(RawInput::KeyDown(0x53), "t1"); // S
        assert_eq!(collect_kinds(&events), vec![SensorKind::Shortcut]);
        assert_eq!(
            events[0].data.get("shortcut").and_then(Value::as_str),
            Some("Ctrl+S")
        );
        assert_eq!(events[0].source, SensorSource::Input);
    }

    #[test]
    fn unmodified_keys_aggregate_into_a_typing_count() {
        let mut aggregator = RawInputAggregator::new("session-1", 3);

        assert!(aggregator.observe(RawInput::KeyDown(0x41), "t0").is_empty());
        assert!(aggregator.observe(RawInput::KeyDown(0x42), "t1").is_empty());
        let events = aggregator.observe(RawInput::KeyDown(0x43), "t2");

        assert_eq!(collect_kinds(&events), vec![SensorKind::TypingActivity]);
        assert_eq!(
            events[0].data.get("keyCount").and_then(Value::as_u64),
            Some(3)
        );
    }

    #[test]
    fn a_click_flushes_pending_typing_first() {
        let mut aggregator = RawInputAggregator::new("session-1", TYPING_FLUSH_THRESHOLD);
        aggregator.observe(RawInput::KeyDown(0x41), "t0"); // one typed key, buffered

        let events = aggregator.observe(RawInput::MouseButton(MouseButton::Left), "t1");

        assert_eq!(
            collect_kinds(&events),
            vec![SensorKind::TypingActivity, SensorKind::Click]
        );
        assert_eq!(
            events[1].data.get("button").and_then(Value::as_str),
            Some("left")
        );
        // Sequence numbers only advance on emitted events.
        assert_eq!(events[0].sequence, 1);
        assert_eq!(events[1].sequence, 2);
    }

    #[test]
    fn wheel_reports_direction_and_finish_flushes() {
        let mut aggregator = RawInputAggregator::new("session-1", TYPING_FLUSH_THRESHOLD);
        let scroll = aggregator.observe(RawInput::Wheel { up: false }, "t0");
        assert_eq!(
            scroll[0].data.get("direction").and_then(Value::as_str),
            Some("down")
        );

        aggregator.observe(RawInput::KeyDown(0x41), "t1");
        let tail = aggregator.finish("t2");
        assert_eq!(collect_kinds(&tail), vec![SensorKind::TypingActivity]);
    }
}
