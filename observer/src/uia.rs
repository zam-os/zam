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

#[cfg(not(target_os = "windows"))]
pub fn watch_focused_element(
    _samples: usize,
    _interval: Duration,
    _session_id: &str,
    _on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("UI Automation is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
mod windows_uia {
    use std::collections::BTreeMap;
    use std::thread;
    use std::time::Duration;

    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::UI::Accessibility::{CUIAutomation, IUIAutomation, IUIAutomationElement};

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
    }

    #[derive(PartialEq, Eq)]
    struct FocusFingerprint {
        control_type: i32,
        automation_id: String,
        name: String,
        password: bool,
        process_id: u32,
    }

    impl FocusFingerprint {
        fn from_element(element: &FocusedElement) -> Self {
            Self {
                control_type: element.control_type,
                automation_id: element.automation_id.clone(),
                name: element.name.clone(),
                password: element.password,
                process_id: element.process_id,
            }
        }
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
                    on_event(&focus_event(session_id, sequence, focused))?;
                    last = Some(fingerprint);
                }
            }

            if sample_index + 1 < samples {
                thread::sleep(interval);
            }
        }

        Ok(())
    }

    fn read_focused_element(automation: &IUIAutomation) -> Option<FocusedElement> {
        let element: IUIAutomationElement = unsafe { automation.GetFocusedElement() }.ok()?;
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

        Some(FocusedElement {
            control_type,
            automation_id,
            name,
            password,
            process_id,
        })
    }

    fn focus_event(session_id: &str, sequence: u64, focused: FocusedElement) -> SensorEvent {
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
            Some(focused.name)
        };
        let automation_id = if focused.automation_id.trim().is_empty() {
            None
        } else {
            Some(focused.automation_id)
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
