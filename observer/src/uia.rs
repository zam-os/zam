//! Live UI Automation focus sensor.
//!
//! Polls the focused UI Automation element and emits an `element-focused`
//! `SensorEvent` whenever focus moves, with a bounded property set (control
//! type, automation id, accessible name) and whether the element is a password
//! field. Password fields — and focus inside a privacy-sensitive application —
//! are reported with the name redacted; a password field additionally sets
//! `target.password`, which the replay engine turns into a privacy pause.
//!
//! Polling mirrors `watch-foreground`: it captures the most useful semantic
//! signal (where the user's focus is) without the COM event-handler callback
//! threading that UIA event subscriptions require.

use std::time::Duration;

use crate::model::SensorEvent;

/// Canonical English name for a standard UIA control-type id, or `control-<id>`
/// when the id is outside the documented set.
pub(crate) fn control_type_name(id: i32) -> String {
    let name = match id {
        50000 => "Button",
        50001 => "Calendar",
        50002 => "CheckBox",
        50003 => "ComboBox",
        50004 => "Edit",
        50005 => "Hyperlink",
        50006 => "Image",
        50007 => "ListItem",
        50008 => "List",
        50009 => "Menu",
        50010 => "MenuBar",
        50011 => "MenuItem",
        50012 => "ProgressBar",
        50013 => "RadioButton",
        50014 => "ScrollBar",
        50015 => "Slider",
        50016 => "Spinner",
        50017 => "StatusBar",
        50018 => "Tab",
        50019 => "TabItem",
        50020 => "Text",
        50021 => "ToolBar",
        50022 => "ToolTip",
        50023 => "Tree",
        50024 => "TreeItem",
        50025 => "Custom",
        50026 => "Group",
        50027 => "Thumb",
        50028 => "DataGrid",
        50029 => "DataItem",
        50030 => "Document",
        50031 => "SplitButton",
        50032 => "Window",
        50033 => "Pane",
        50034 => "Header",
        50035 => "HeaderItem",
        50036 => "Table",
        50037 => "TitleBar",
        50038 => "Separator",
        50039 => "SemanticZoom",
        50040 => "AppBar",
        _ => return format!("control-{id}"),
    };
    name.to_string()
}

#[cfg(target_os = "windows")]
pub fn watch_focused_element(
    samples: usize,
    interval: Duration,
    session_id: &str,
    on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_uia::watch_focused_element(samples, interval, session_id, on_event)
}

#[cfg(target_os = "windows")]
pub fn watch_focused_element_continuous(
    interval: Duration,
    session_id: &str,
    should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_uia::watch_focused_element_continuous(
        interval,
        session_id,
        should_stop,
        pause_input,
        on_event,
    )
}

#[cfg(not(target_os = "windows"))]
pub fn watch_focused_element(
    _samples: usize,
    _interval: Duration,
    _session_id: &str,
    _on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("UI Automation is only available on Windows".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn watch_focused_element_continuous(
    _interval: Duration,
    _session_id: &str,
    _should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("UI Automation is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
mod windows_uia {
    use std::collections::BTreeMap;
    use std::thread;
    use std::time::Duration;

    use windows::core::{implement, Interface, Ref};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationEventHandler,
        IUIAutomationEventHandler_Impl, IUIAutomationSelectionItemPattern,
        IUIAutomationTogglePattern, TreeScope_Subtree, UIA_SelectionItemPatternId,
        UIA_TogglePatternId, UIA_EVENT_ID, UIA_Invoke_InvokedEventId,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetForegroundWindow, GetWindow, GetWindowTextLengthW, GetWindowTextW,
        GW_OWNER,
    };

    use super::control_type_name;
    use crate::clock::observed_at_now;
    use crate::model::{
        ApplicationContext, SensorEvent, SensorKind, SensorSource, SensorTarget, PROTOCOL_VERSION,
    };
    use crate::picker::process_name_for_pid;
    use crate::privacy::classify_window_privacy;

    struct FocusedElement {
        control_type: i32,
        automation_id: String,
        name: String,
        password: bool,
        process_id: u32,
        toggle_state: Option<i32>,
        selected: Option<bool>,
    }

    #[derive(PartialEq, Eq)]
    struct FocusFingerprint {
        control_type: i32,
        automation_id: String,
        name: String,
        password: bool,
        process_id: u32,
        toggle_state: Option<i32>,
        selected: Option<bool>,
    }

    impl FocusFingerprint {
        fn from_element(element: &FocusedElement) -> Self {
            Self {
                control_type: element.control_type,
                automation_id: element.automation_id.clone(),
                name: element.name.clone(),
                password: element.password,
                process_id: element.process_id,
                toggle_state: element.toggle_state,
                selected: element.selected,
            }
        }
    }

    /// COM event handler that turns UIA `Invoke` events (button, menu item, and
    /// link activation) into `element-invoked` sensor events. UIA delivers
    /// events on its own threads, so the handler forwards each one through a
    /// channel that the polling loop drains and re-sequences on its single
    /// output path.
    #[implement(IUIAutomationEventHandler)]
    struct InvokeEventHandler {
        sender: std::sync::Mutex<std::sync::mpsc::Sender<SensorEvent>>,
        session_id: String,
    }

    impl IUIAutomationEventHandler_Impl for InvokeEventHandler_Impl {
        fn HandleAutomationEvent(
            &self,
            sender: Ref<'_, IUIAutomationElement>,
            _eventid: UIA_EVENT_ID,
        ) -> windows::core::Result<()> {
            if let Some(element) = sender.as_ref() {
                if let Some(event) = build_invoke_event(&self.session_id, element) {
                    if let Ok(tx) = self.sender.lock() {
                        let _ = tx.send(event);
                    }
                }
            }
            Ok(())
        }
    }

    /// Build an `element-invoked` event from the invoked element, reusing the
    /// focus event's bounded property set and privacy redaction. Sequence is set
    /// to 0 here and reassigned when the polling loop forwards the event.
    fn build_invoke_event(session_id: &str, element: &IUIAutomationElement) -> Option<SensorEvent> {
        let focused = focused_element_from(element)?;
        let mut event = focus_event(session_id, 0, &focused);
        event.kind = SensorKind::ElementInvoked;
        Some(event)
    }

    pub fn watch_focused_element(
        samples: usize,
        interval: Duration,
        session_id: &str,
        on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        unsafe {
            CoInitializeEx(None, COINIT_MULTITHREADED)
                .ok()
                .map_err(|error| format!("failed to initialize COM: {error}"))?;
        }
        let automation: IUIAutomation =
            unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER) }
                .map_err(|error| format!("failed to create UI Automation: {error}"))?;

        let mut last: Option<FocusFingerprint> = None;
        let mut sequence = 0u64;

        for sample_index in 0..samples {
            if let Some(focused) = read_focused_element(&automation) {
                let fingerprint = FocusFingerprint::from_element(&focused);
                if last.as_ref() != Some(&fingerprint) {
                    sequence += 1;
                    on_event(&focus_event(session_id, sequence, &focused))?;
                    last = Some(fingerprint);
                }
            }

            if sample_index + 1 < samples {
                thread::sleep(interval);
            }
        }

        Ok(())
    }

    pub fn watch_focused_element_continuous(
        interval: Duration,
        session_id: &str,
        should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
        on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        unsafe {
            CoInitializeEx(None, COINIT_MULTITHREADED)
                .ok()
                .map_err(|error| format!("failed to initialize COM: {error}"))?;
        }
        let automation: IUIAutomation =
            unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER) }
                .map_err(|error| format!("failed to create UI Automation: {error}"))?;

        let mut last: Option<FocusFingerprint> = None;
        let mut sequence = 0u64;
        let mut last_dialog_hwnd: Option<HWND> = None;

        // Subscribe to UIA Invoke events so button, menu, and link activations
        // are reported even though invocation itself is not pollable. The
        // handler runs on UIA threads and forwards events through this channel,
        // which the loop drains and re-sequences on its single output path.
        let (invoke_tx, invoke_rx) = std::sync::mpsc::channel::<SensorEvent>();
        let invoke_handler: IUIAutomationEventHandler = InvokeEventHandler {
            sender: std::sync::Mutex::new(invoke_tx),
            session_id: session_id.to_string(),
        }
        .into();
        let invoke_registered = match unsafe { automation.GetRootElement() } {
            Ok(root) => unsafe {
                automation
                    .AddAutomationEventHandler(
                        UIA_Invoke_InvokedEventId,
                        &root,
                        TreeScope_Subtree,
                        None,
                        &invoke_handler,
                    )
                    .is_ok()
            },
            Err(_) => false,
        };

        while !should_stop.load(std::sync::atomic::Ordering::Relaxed) {
            // 1. Dialog Detection
            let fg_hwnd = unsafe { GetForegroundWindow() };
            if fg_hwnd.0 as usize != 0 {
                let is_currently_dialog = is_dialog(fg_hwnd);
                if is_currently_dialog {
                    if last_dialog_hwnd != Some(fg_hwnd) {
                        // Close previous dialog if there was one
                        if let Some(old_dialog_hwnd) = last_dialog_hwnd {
                            sequence += 1;
                            on_event(dialog_event(session_id, sequence, old_dialog_hwnd, false))?;
                        }
                        // Open new dialog
                        sequence += 1;
                        on_event(dialog_event(session_id, sequence, fg_hwnd, true))?;
                        last_dialog_hwnd = Some(fg_hwnd);
                    }
                } else {
                    // Not a dialog. If we had a dialog, close it
                    if let Some(old_dialog_hwnd) = last_dialog_hwnd {
                        sequence += 1;
                        on_event(dialog_event(session_id, sequence, old_dialog_hwnd, false))?;
                        last_dialog_hwnd = None;
                    }
                }
            } else {
                // Foreground window is invalid/none. Close any open dialog
                if let Some(old_dialog_hwnd) = last_dialog_hwnd {
                    sequence += 1;
                    on_event(dialog_event(session_id, sequence, old_dialog_hwnd, false))?;
                    last_dialog_hwnd = None;
                }
            }

            // 2. Focused Element Polling
            if let Some(focused) = read_focused_element(&automation) {
                let process_name = if focused.process_id == 0 {
                    String::new()
                } else {
                    process_name_for_pid(focused.process_id)
                };
                let privacy = classify_window_privacy(&process_name, &focused.name);
                let is_password = focused.password;
                let is_paused = privacy.is_paused() || is_password;
                pause_input.store(is_paused, std::sync::atomic::Ordering::Relaxed);

                let fingerprint = FocusFingerprint::from_element(&focused);

                if let Some(ref prev) = last {
                    let same_identity = prev.control_type == fingerprint.control_type
                        && prev.automation_id == fingerprint.automation_id
                        && prev.name == fingerprint.name
                        && prev.password == fingerprint.password
                        && prev.process_id == fingerprint.process_id;

                    if same_identity {
                        if prev.toggle_state != fingerprint.toggle_state {
                            sequence += 1;
                            on_event(toggle_event(session_id, sequence, &focused))?;
                        }
                        if prev.selected != fingerprint.selected {
                            sequence += 1;
                            on_event(selection_event(session_id, sequence, &focused))?;
                        }
                    } else {
                        sequence += 1;
                        on_event(focus_event(session_id, sequence, &focused))?;
                    }
                } else {
                    sequence += 1;
                    on_event(focus_event(session_id, sequence, &focused))?;
                }
                last = Some(fingerprint);
            }

            // 3. Forward any UIA Invoke events captured since the last poll.
            while let Ok(mut event) = invoke_rx.try_recv() {
                sequence += 1;
                event.sequence = sequence;
                on_event(event)?;
            }

            thread::sleep(interval);
        }

        if invoke_registered {
            unsafe {
                let _ = automation.RemoveAllEventHandlers();
            }
        }

        Ok(())
    }

    fn read_focused_element(automation: &IUIAutomation) -> Option<FocusedElement> {
        let element: IUIAutomationElement = unsafe { automation.GetFocusedElement() }.ok()?;
        focused_element_from(&element)
    }

    fn focused_element_from(element: &IUIAutomationElement) -> Option<FocusedElement> {
        let control_type = unsafe { element.CurrentControlType() }
            .map(|value| value.0)
            .unwrap_or(0);
        let automation_id = unsafe { element.CurrentAutomationId() }
            .map(|value| value.to_string())
            .unwrap_or_default();
        let name = unsafe { element.CurrentName() }
            .map(|value| value.to_string())
            .unwrap_or_default();
        let password = unsafe { element.CurrentIsPassword() }
            .map(|value| value.as_bool())
            .unwrap_or(false);
        let process_id = unsafe { element.CurrentProcessId() }
            .map(|value| value as u32)
            .unwrap_or(0);

        let toggle_state = unsafe {
            element
                .GetCurrentPattern(UIA_TogglePatternId)
                .ok()
                .and_then(|pattern| {
                    let toggle_pattern: IUIAutomationTogglePattern = pattern.cast().ok()?;
                    toggle_pattern.CurrentToggleState().map(|s| s.0).ok()
                })
        };

        let selected = unsafe {
            element
                .GetCurrentPattern(UIA_SelectionItemPatternId)
                .ok()
                .and_then(|pattern| {
                    let selection_pattern: IUIAutomationSelectionItemPattern =
                        pattern.cast().ok()?;
                    selection_pattern
                        .CurrentIsSelected()
                        .map(|s| s.as_bool())
                        .ok()
                })
        };

        Some(FocusedElement {
            control_type,
            automation_id,
            name,
            password,
            process_id,
            toggle_state,
            selected,
        })
    }

    fn focus_event(session_id: &str, sequence: u64, focused: &FocusedElement) -> SensorEvent {
        let process_name = if focused.process_id == 0 {
            String::new()
        } else {
            process_name_for_pid(focused.process_id)
        };
        // Reuse the window privacy classifier so focus inside a sensitive app
        // (password manager, auth dialog) does not leak an accessible name.
        let privacy = classify_window_privacy(&process_name, &focused.name);
        let redacted = privacy.title_redacted || focused.password;

        let name = if redacted || focused.name.trim().is_empty() {
            None
        } else {
            Some(focused.name.clone())
        };
        let automation_id = if focused.automation_id.trim().is_empty() {
            None
        } else {
            Some(focused.automation_id.clone())
        };

        let target = SensorTarget {
            control_type: Some(control_type_name(focused.control_type)),
            automation_id,
            name,
            password: focused.password,
        };

        let application = if focused.process_id == 0 {
            None
        } else {
            Some(ApplicationContext {
                process_name,
                process_id: Some(focused.process_id),
                window_title: None,
            })
        };

        SensorEvent {
            version: PROTOCOL_VERSION,
            session_id: session_id.to_string(),
            sequence,
            observed_at: observed_at_now(),
            source: SensorSource::Uia,
            kind: SensorKind::ElementFocused,
            application,
            target: Some(target),
            data: BTreeMap::new(),
            redacted,
        }
    }

    fn toggle_event(session_id: &str, sequence: u64, focused: &FocusedElement) -> SensorEvent {
        let mut event = focus_event(session_id, sequence, focused);
        event.kind = SensorKind::ToggleChanged;
        if let Some(state) = focused.toggle_state {
            event.data.insert(
                "state".to_string(),
                serde_json::Value::Number(serde_json::Number::from(state)),
            );
        }
        event
    }

    fn selection_event(session_id: &str, sequence: u64, focused: &FocusedElement) -> SensorEvent {
        let mut event = focus_event(session_id, sequence, focused);
        event.kind = SensorKind::SelectionChanged;
        if let Some(selected) = focused.selected {
            event
                .data
                .insert("selected".to_string(), serde_json::Value::Bool(selected));
        }
        event
    }

    fn get_window_title(hwnd: HWND) -> String {
        let len = unsafe { GetWindowTextLengthW(hwnd) };
        if len <= 0 {
            return String::new();
        }
        let mut buffer = vec![0u16; len as usize + 1];
        let copied = unsafe { GetWindowTextW(hwnd, &mut buffer) };
        String::from_utf16_lossy(&buffer[..copied.max(0) as usize])
    }

    fn is_dialog(hwnd: HWND) -> bool {
        if hwnd.0 as usize == 0 {
            return false;
        }
        let mut class_name = [0u16; 256];
        let len = unsafe { GetClassNameW(hwnd, &mut class_name) };
        if len > 0 {
            if let Ok(name) = String::from_utf16(&class_name[..len as usize]) {
                if name == "#32770" {
                    return true;
                }
            }
        }
        let owner = unsafe { GetWindow(hwnd, GW_OWNER) };
        if let Ok(owner) = owner {
            if owner.0 as usize != 0 {
                return true;
            }
        }
        false
    }

    fn dialog_event(session_id: &str, sequence: u64, hwnd: HWND, opened: bool) -> SensorEvent {
        let mut process_id = 0u32;
        unsafe {
            use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        }

        let process_name = if process_id == 0 {
            String::new()
        } else {
            process_name_for_pid(process_id)
        };

        let title = get_window_title(hwnd);
        let privacy = classify_window_privacy(&process_name, &title);
        let redacted = privacy.title_redacted;

        let redacted_title = if redacted || title.trim().is_empty() {
            None
        } else {
            Some(title.clone())
        };

        let application = if process_id == 0 {
            None
        } else {
            Some(ApplicationContext {
                process_name,
                process_id: Some(process_id),
                window_title: redacted_title,
            })
        };

        let mut data = BTreeMap::new();
        if opened {
            let lower_title = title.to_lowercase();
            let is_error = lower_title.contains("error")
                || lower_title.contains("failed")
                || lower_title.contains("warning")
                || lower_title.contains("critical")
                || lower_title.contains("problem")
                || lower_title.contains("fault")
                || lower_title.contains("fehler")
                || lower_title.contains("fehlgeschlagen");

            let severity = if is_error { "error" } else { "info" };
            data.insert(
                "severity".to_string(),
                serde_json::Value::String(severity.to_string()),
            );
        }

        SensorEvent {
            version: PROTOCOL_VERSION,
            session_id: session_id.to_string(),
            sequence,
            observed_at: observed_at_now(),
            source: SensorSource::Uia,
            kind: if opened {
                SensorKind::DialogOpened
            } else {
                SensorKind::DialogClosed
            },
            application,
            target: None,
            data,
            redacted,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_control_types() {
        assert_eq!(control_type_name(50000), "Button");
        assert_eq!(control_type_name(50004), "Edit");
        assert_eq!(control_type_name(50032), "Window");
    }

    #[test]
    fn falls_back_for_unknown_control_types() {
        assert_eq!(control_type_name(0), "control-0");
        assert_eq!(control_type_name(99999), "control-99999");
    }
}
