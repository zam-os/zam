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
    watch_hwnd: u64,
    interval: Duration,
    session_id: &str,
    should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    event_driven: bool,
    on_event: &mut dyn FnMut(SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_uia::watch_focused_element_continuous(
        watch_hwnd,
        interval,
        session_id,
        should_stop,
        pause_input,
        event_driven,
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
    _watch_hwnd: u64,
    _interval: Duration,
    _session_id: &str,
    _should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    _event_driven: bool,
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
        UIA_Text_TextChangedEventId, UIA_StructureChangedEventId,
        SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetForegroundWindow, GetWindow, GetWindowTextLengthW, GetWindowTextW,
        GetWindowThreadProcessId, GW_OWNER, IsChild, IsWindow, PeekMessageW, TranslateMessage,
        DispatchMessageW, PM_REMOVE, MSG, WINEVENT_OUTOFCONTEXT, EVENT_SYSTEM_FOREGROUND,
        EVENT_OBJECT_FOCUS,
    };
    use windows::Win32::Graphics::Gdi::{
        GetDC, ReleaseDC, CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, BitBlt, DeleteDC, DeleteObject,
        GetDIBits, SRCCOPY, DIB_RGB_COLORS, BITMAPINFOHEADER, BITMAPINFO,
    };
    use windows::Graphics::Imaging::{SoftwareBitmap, BitmapPixelFormat};
    use windows::Security::Cryptography::CryptographicBuffer;
    use windows::Media::Ocr::OcrEngine;

    use super::control_type_name;
    use crate::clock::observed_at_now;
    use crate::model::{
        ApplicationContext, SensorEvent, SensorKind, SensorSource, SensorTarget, PROTOCOL_VERSION,
    };
    use crate::picker::process_name_for_pid;
    use crate::privacy::classify_window_privacy;

    #[allow(dead_code)]
    #[derive(Debug, Clone, Copy)]
    enum WinEventNotification {
        ForegroundChanged(HWND),
        FocusChanged,
    }

    unsafe impl Send for WinEventNotification {}
    unsafe impl Sync for WinEventNotification {}

    static EVENT_SENDER: std::sync::Mutex<Option<std::sync::mpsc::Sender<WinEventNotification>>> =
        std::sync::Mutex::new(None);
    static WATCH_HWND: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

    fn hwnd_from_u64(raw_hwnd: u64) -> HWND {
        HWND(raw_hwnd as usize as *mut core::ffi::c_void)
    }

    fn hwnd_in_watched_window(hwnd: HWND, watch_hwnd: HWND) -> bool {
        if hwnd.0 as usize == 0 || watch_hwnd.0 as usize == 0 {
            return false;
        }
        if hwnd == watch_hwnd {
            return true;
        }
        unsafe { IsChild(watch_hwnd, hwnd).as_bool() }
    }

    fn element_in_watched_window(
        automation: &IUIAutomation,
        element: &IUIAutomationElement,
        watch_hwnd: HWND,
    ) -> bool {
        if let Ok(hwnd) = unsafe { element.CurrentNativeWindowHandle() } {
            if hwnd.0 as usize != 0 && hwnd_in_watched_window(hwnd, watch_hwnd) {
                return true;
            }
        }

        let walker = match unsafe { automation.RawViewWalker() } {
            Ok(walker) => walker,
            Err(_) => return false,
        };
        let mut current = element.clone();
        for _ in 0..32 {
            if let Ok(hwnd) = unsafe { current.CurrentNativeWindowHandle() } {
                if hwnd.0 as usize != 0 && hwnd_in_watched_window(hwnd, watch_hwnd) {
                    return true;
                }
            }
            current = match unsafe { walker.GetParentElement(&current) } {
                Ok(parent) => parent,
                Err(_) => break,
            };
        }
        false
    }

    unsafe extern "system" fn win_event_hook_callback(
        _h_hook: HWINEVENTHOOK,
        event: u32,
        hwnd: HWND,
        _id_object: i32,
        _id_child: i32,
        _id_event_thread: u32,
        _dwms_event_time: u32,
    ) {
        if let Ok(guard) = EVENT_SENDER.lock() {
            if let Some(ref sender) = *guard {
                if event == EVENT_SYSTEM_FOREGROUND {
                    let watch = WATCH_HWND.load(std::sync::atomic::Ordering::Relaxed);
                    if watch != 0 && !hwnd_in_watched_window(hwnd, hwnd_from_u64(watch)) {
                        return;
                    }
                    let _ = sender.send(WinEventNotification::ForegroundChanged(hwnd));
                } else if event == EVENT_OBJECT_FOCUS {
                    let _ = sender.send(WinEventNotification::FocusChanged);
                }
            }
        }
    }

    fn capture_rect_gdi(rect: windows::Win32::Foundation::RECT) -> Result<(Vec<u8>, i32, i32), String> {
        let x = rect.left;
        let y = rect.top;
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        if width <= 0 || height <= 0 {
            return Err("Invalid rect dimensions".to_string());
        }

        unsafe {
            let hdc_screen = GetDC(None);
            if hdc_screen.0 as usize == 0 {
                return Err("Failed to get screen DC".to_string());
            }

            let hdc_mem = CreateCompatibleDC(Some(hdc_screen));
            if hdc_mem.0 as usize == 0 {
                ReleaseDC(None, hdc_screen);
                return Err("Failed to create compatible DC".to_string());
            }

            let hbitmap = CreateCompatibleBitmap(hdc_screen, width, height);
            if hbitmap.0 as usize == 0 {
                let _ = DeleteDC(hdc_mem);
                ReleaseDC(None, hdc_screen);
                return Err("Failed to create compatible bitmap".to_string());
            }

            let old_obj = SelectObject(hdc_mem, hbitmap.into());

            let success = BitBlt(hdc_mem, 0, 0, width, height, Some(hdc_screen), x, y, SRCCOPY);
            if let Err(e) = success {
                SelectObject(hdc_mem, old_obj);
                let _ = DeleteObject(hbitmap.into());
                let _ = DeleteDC(hdc_mem);
                ReleaseDC(None, hdc_screen);
                return Err(format!("BitBlt failed: {e}"));
            }

            let mut bmi = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: width,
                    biHeight: -height, // top-down
                    biPlanes: 1,
                    biBitCount: 32, // BGRA8
                    biCompression: 0,
                    biSizeImage: 0,
                    biXPelsPerMeter: 0,
                    biYPelsPerMeter: 0,
                    biClrUsed: 0,
                    biClrImportant: 0,
                },
                bmiColors: [windows::Win32::Graphics::Gdi::RGBQUAD::default(); 1],
            };

            let mut buf = vec![0u8; (width * height * 4) as usize];
            let lines = GetDIBits(
                hdc_screen,
                hbitmap,
                0,
                height as u32,
                Some(buf.as_mut_ptr() as *mut _),
                &mut bmi,
                DIB_RGB_COLORS,
            );

            SelectObject(hdc_mem, old_obj);
            let _ = DeleteObject(hbitmap.into());
            let _ = DeleteDC(hdc_mem);
            ReleaseDC(None, hdc_screen);

            if lines == 0 {
                return Err("GetDIBits failed".to_string());
            }

            Ok((buf, width, height))
        }
    }

    fn ocr_bitmap(bytes: &[u8], width: i32, height: i32) -> Result<String, String> {
        let buffer = CryptographicBuffer::CreateFromByteArray(bytes)
            .map_err(|e| format!("Failed to create CryptographicBuffer: {e}"))?;

        let bitmap = SoftwareBitmap::CreateCopyFromBuffer(
            &buffer,
            BitmapPixelFormat::Bgra8,
            width,
            height,
        ).map_err(|e| format!("Failed to create SoftwareBitmap: {e}"))?;

        let engine = OcrEngine::TryCreateFromUserProfileLanguages()
            .map_err(|e| format!("Failed to create OcrEngine: {e}"))?;

        let async_op = engine.RecognizeAsync(&bitmap)
            .map_err(|e| format!("Failed to start RecognizeAsync: {e}"))?;
        
        let result = async_op.get()
            .map_err(|e| format!("Failed to complete RecognizeAsync: {e}"))?;

        let text = result.Text()
            .map_err(|e| format!("Failed to get recognized text: {e}"))?;

        Ok(text.to_string())
    }

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

    fn is_password_element(element: &IUIAutomationElement) -> bool {
        unsafe { element.CurrentIsPassword() }
            .map(|value| value.as_bool())
            .unwrap_or(false)
    }

    /// Mute Raw Input immediately when UIA reports a password field or other
    /// privacy-sensitive context. COM handlers can fire before the polling loop
    /// next samples focus, so this must not wait for the 500ms poll interval.
    fn update_pause_input_from_element(
        element: &IUIAutomationElement,
        pause_input: &std::sync::atomic::AtomicBool,
    ) {
        use std::sync::atomic::Ordering;

        if is_password_element(element) {
            pause_input.store(true, Ordering::Relaxed);
            return;
        }

        let process_id = unsafe { element.CurrentProcessId() }
            .map(|value| value as u32)
            .unwrap_or(0);
        if process_id == 0 {
            return;
        }

        let process_name = process_name_for_pid(process_id);
        let name = unsafe { element.CurrentName() }
            .map(|value| value.to_string())
            .unwrap_or_default();
        if classify_window_privacy(&process_name, &name).is_paused() {
            pause_input.store(true, Ordering::Relaxed);
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
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    }

    impl IUIAutomationEventHandler_Impl for InvokeEventHandler_Impl {
        fn HandleAutomationEvent(
            &self,
            sender: Ref<'_, IUIAutomationElement>,
            _eventid: UIA_EVENT_ID,
        ) -> windows::core::Result<()> {
            if let Some(element) = sender.as_ref() {
                update_pause_input_from_element(element, &self.pause_input);
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

    /// COM event handler for UIA `TextChanged` events. Fires when text content
    /// of an element changes (e.g. typing in an edit field). Only the fact that
    /// text changed is recorded — never the content — preserving privacy.
    #[implement(IUIAutomationEventHandler)]
    struct TextChangedEventHandler {
        sender: std::sync::Mutex<std::sync::mpsc::Sender<SensorEvent>>,
        session_id: String,
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    }

    impl IUIAutomationEventHandler_Impl for TextChangedEventHandler_Impl {
        fn HandleAutomationEvent(
            &self,
            sender: Ref<'_, IUIAutomationElement>,
            _eventid: UIA_EVENT_ID,
        ) -> windows::core::Result<()> {
            if let Some(element) = sender.as_ref() {
                update_pause_input_from_element(element, &self.pause_input);
                // Never record text-change metadata (or run OCR) for password
                // fields — only mute input as early as possible.
                if is_password_element(element) {
                    return Ok(());
                }
                if let Some(event) = build_text_changed_event(&self.session_id, element) {
                    if let Ok(tx) = self.sender.lock() {
                        let _ = tx.send(event);
                    }
                }
            }
            Ok(())
        }
    }

    /// Build a `text-changed` event. Captures the element identity (control
    /// type, automation id) but never the text value itself. Privacy redaction
    /// applies as for focus events.
    fn build_text_changed_event(
        session_id: &str,
        element: &IUIAutomationElement,
    ) -> Option<SensorEvent> {
        let focused = focused_element_from(element)?;
        let mut event = focus_event(session_id, 0, &focused);
        event.kind = SensorKind::TextChanged;
        // Record keystroke count hint if available from aggregator, otherwise
        // just the fact that text changed.
        event
            .data
            .insert("changed".to_string(), serde_json::Value::Bool(true));
        Some(event)
    }

    /// COM event handler for UIA `StructureChanged` events. Fires when the
    /// UI tree structure changes (e.g. a child element is added or removed).
    #[implement(IUIAutomationEventHandler)]
    struct StructureChangedEventHandler {
        sender: std::sync::Mutex<std::sync::mpsc::Sender<SensorEvent>>,
        session_id: String,
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
    }

    impl IUIAutomationEventHandler_Impl for StructureChangedEventHandler_Impl {
        fn HandleAutomationEvent(
            &self,
            sender: Ref<'_, IUIAutomationElement>,
            _eventid: UIA_EVENT_ID,
        ) -> windows::core::Result<()> {
            if let Some(element) = sender.as_ref() {
                update_pause_input_from_element(element, &self.pause_input);
                if let Some(event) = build_structure_changed_event(&self.session_id, element) {
                    if let Ok(tx) = self.sender.lock() {
                        let _ = tx.send(event);
                    }
                }
            }
            Ok(())
        }
    }

    /// Build a `structure-changed` event from the element whose subtree
    /// changed. Reports the element identity without dumping the full tree.
    fn build_structure_changed_event(
        session_id: &str,
        element: &IUIAutomationElement,
    ) -> Option<SensorEvent> {
        let focused = focused_element_from(element)?;
        let mut event = focus_event(session_id, 0, &focused);
        event.kind = SensorKind::StructureChanged;
        event
            .data
            .insert("changed".to_string(), serde_json::Value::Bool(true));
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
        watch_hwnd_raw: u64,
        interval: Duration,
        session_id: &str,
        should_stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
        pause_input: std::sync::Arc<std::sync::atomic::AtomicBool>,
        event_driven: bool,
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

        let watch_hwnd = hwnd_from_u64(watch_hwnd_raw);
        if watch_hwnd.0 as usize == 0 || !unsafe { IsWindow(Some(watch_hwnd)).as_bool() } {
            return Err(format!(
                "HWND 0x{watch_hwnd_raw:x} is not a valid watch target"
            ));
        }
        WATCH_HWND.store(watch_hwnd_raw, std::sync::atomic::Ordering::Relaxed);

        let window_element = unsafe { automation.ElementFromHandle(watch_hwnd) }.map_err(|error| {
            format!("failed to resolve UI Automation element for HWND 0x{watch_hwnd_raw:x}: {error}")
        })?;

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
            pause_input: pause_input.clone(),
        }
        .into();
        let invoke_registered = unsafe {
            automation
                .AddAutomationEventHandler(
                    UIA_Invoke_InvokedEventId,
                    &window_element,
                    TreeScope_Subtree,
                    None,
                    &invoke_handler,
                )
                .is_ok()
        };

        // Subscribe to UIA TextChanged events so text edits in fields are
        // reported without capturing the typed content.
        let (text_changed_tx, text_changed_rx) = std::sync::mpsc::channel::<SensorEvent>();
        let text_changed_handler: IUIAutomationEventHandler = TextChangedEventHandler {
            sender: std::sync::Mutex::new(text_changed_tx),
            session_id: session_id.to_string(),
            pause_input: pause_input.clone(),
        }
        .into();
        let text_changed_registered = unsafe {
            automation
                .AddAutomationEventHandler(
                    UIA_Text_TextChangedEventId,
                    &window_element,
                    TreeScope_Subtree,
                    None,
                    &text_changed_handler,
                )
                .is_ok()
        };

        // Subscribe to UIA StructureChanged events so tree mutations
        // (child added/removed) are reported.
        let (structure_changed_tx, structure_changed_rx) = std::sync::mpsc::channel::<SensorEvent>();
        let structure_changed_handler: IUIAutomationEventHandler = StructureChangedEventHandler {
            sender: std::sync::Mutex::new(structure_changed_tx),
            session_id: session_id.to_string(),
            pause_input: pause_input.clone(),
        }
        .into();
        let structure_changed_registered = unsafe {
            automation
                .AddAutomationEventHandler(
                    UIA_StructureChangedEventId,
                    &window_element,
                    TreeScope_Subtree,
                    None,
                    &structure_changed_handler,
                )
                .is_ok()
        };

        let (win_event_tx, win_event_rx) = std::sync::mpsc::channel::<WinEventNotification>();
        let mut hook_fg = HWINEVENTHOOK::default();
        let mut hook_focus = HWINEVENTHOOK::default();

        if event_driven {
            if let Ok(mut guard) = EVENT_SENDER.lock() {
                *guard = Some(win_event_tx);
            }

            unsafe {
                hook_fg = SetWinEventHook(
                    EVENT_SYSTEM_FOREGROUND,
                    EVENT_SYSTEM_FOREGROUND,
                    None,
                    Some(win_event_hook_callback),
                    0,
                    0,
                    WINEVENT_OUTOFCONTEXT,
                );
                hook_focus = SetWinEventHook(
                    EVENT_OBJECT_FOCUS,
                    EVENT_OBJECT_FOCUS,
                    None,
                    Some(win_event_hook_callback),
                    0,
                    0,
                    WINEVENT_OUTOFCONTEXT,
                );
            }
        }

        let check_interval = if event_driven {
            Duration::from_millis(50)
        } else {
            interval
        };

        while !should_stop.load(std::sync::atomic::Ordering::Relaxed) {
            let mut got_event = false;

            if event_driven {
                // Drain message queue to invoke hooks
                let mut message = MSG::default();
                unsafe {
                    while PeekMessageW(&mut message, None, 0, 0, PM_REMOVE).as_bool() {
                        let _ = TranslateMessage(&message);
                        DispatchMessageW(&message);
                    }
                }

                // Drain notifications
                while let Ok(_notification) = win_event_rx.try_recv() {
                    got_event = true;
                }

                // If no event, check invoke/text-changed/structure-changed events, check stop and sleep
                if !got_event {
                    let mut ui_event_triggered = false;
                    while let Ok(mut event) = invoke_rx.try_recv() {
                        sequence += 1;
                        event.sequence = sequence;
                        on_event(event)?;
                        ui_event_triggered = true;
                    }
                    while let Ok(mut event) = text_changed_rx.try_recv() {
                        sequence += 1;
                        event.sequence = sequence;
                        on_event(event)?;
                        ui_event_triggered = true;
                    }
                    while let Ok(mut event) = structure_changed_rx.try_recv() {
                        sequence += 1;
                        event.sequence = sequence;
                        on_event(event)?;
                        ui_event_triggered = true;
                    }
                    if ui_event_triggered {
                        crate::capture::trigger_capture();
                    }
                    thread::sleep(check_interval);
                    continue;
                }
            }

            let mut state_changed = false;

            // 1. Dialog Detection (only for dialogs owned by the watched window)
            let fg_hwnd = unsafe { GetForegroundWindow() };
            if fg_hwnd.0 as usize != 0 && dialog_belongs_to_watch(fg_hwnd, watch_hwnd) {
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
                        state_changed = true;
                    }
                } else {
                    // Not a dialog. If we had a dialog, close it
                    if let Some(old_dialog_hwnd) = last_dialog_hwnd {
                        sequence += 1;
                        on_event(dialog_event(session_id, sequence, old_dialog_hwnd, false))?;
                        last_dialog_hwnd = None;
                        state_changed = true;
                    }
                }
            } else {
                // Foreground window is invalid/none. Close any open dialog
                if let Some(old_dialog_hwnd) = last_dialog_hwnd {
                    sequence += 1;
                    on_event(dialog_event(session_id, sequence, old_dialog_hwnd, false))?;
                    last_dialog_hwnd = None;
                    state_changed = true;
                }
            }

            // 2. Focused Element Polling (only inside the watched window)
            if let Some(focused) = read_focused_element_in_window(&automation, watch_hwnd) {
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
                            state_changed = true;
                        }
                        if prev.selected != fingerprint.selected {
                            sequence += 1;
                            on_event(selection_event(session_id, sequence, &focused))?;
                            state_changed = true;
                        }
                    } else {
                        sequence += 1;
                        on_event(focus_event(session_id, sequence, &focused))?;
                        state_changed = true;
                    }
                } else {
                    sequence += 1;
                    on_event(focus_event(session_id, sequence, &focused))?;
                    state_changed = true;
                }
                last = Some(fingerprint);
            } else {
                pause_input.store(false, std::sync::atomic::Ordering::Relaxed);
                last = None;
            }

            // 3. Forward any UIA Invoke/TextChanged/StructureChanged events captured since the last poll.
            let mut ui_event_triggered = false;
            while let Ok(mut event) = invoke_rx.try_recv() {
                sequence += 1;
                event.sequence = sequence;
                on_event(event)?;
                ui_event_triggered = true;
            }
            while let Ok(mut event) = text_changed_rx.try_recv() {
                sequence += 1;
                event.sequence = sequence;
                on_event(event)?;
                ui_event_triggered = true;
            }
            while let Ok(mut event) = structure_changed_rx.try_recv() {
                sequence += 1;
                event.sequence = sequence;
                on_event(event)?;
                ui_event_triggered = true;
            }

            if state_changed || ui_event_triggered {
                crate::capture::trigger_capture();
            }

            thread::sleep(check_interval);
        }

        if event_driven {
            if let Ok(mut guard) = EVENT_SENDER.lock() {
                *guard = None;
            }
            unsafe {
                if hook_fg.0 as usize != 0 {
                    let _ = UnhookWinEvent(hook_fg);
                }
                if hook_focus.0 as usize != 0 {
                    let _ = UnhookWinEvent(hook_focus);
                }
            }
        }

        if invoke_registered || text_changed_registered || structure_changed_registered {
            unsafe {
                let _ = automation.RemoveAllEventHandlers();
            }
        }

        WATCH_HWND.store(0, std::sync::atomic::Ordering::Relaxed);
        Ok(())
    }

    fn dialog_belongs_to_watch(fg_hwnd: HWND, watch_hwnd: HWND) -> bool {
        if hwnd_in_watched_window(fg_hwnd, watch_hwnd) {
            return true;
        }
        if !is_dialog(fg_hwnd) {
            return false;
        }

        let mut watch_pid = 0u32;
        let mut fg_pid = 0u32;
        unsafe {
            GetWindowThreadProcessId(watch_hwnd, Some(&mut watch_pid));
            GetWindowThreadProcessId(fg_hwnd, Some(&mut fg_pid));
        }
        watch_pid != 0 && watch_pid == fg_pid
    }

    fn read_focused_element(automation: &IUIAutomation) -> Option<FocusedElement> {
        let element: IUIAutomationElement = unsafe { automation.GetFocusedElement() }.ok()?;
        focused_element_from(&element)
    }

    fn read_focused_element_in_window(
        automation: &IUIAutomation,
        watch_hwnd: HWND,
    ) -> Option<FocusedElement> {
        let element: IUIAutomationElement = unsafe { automation.GetFocusedElement() }.ok()?;
        if !element_in_watched_window(automation, &element, watch_hwnd) {
            return None;
        }
        focused_element_from(&element)
    }

    fn focused_element_from(element: &IUIAutomationElement) -> Option<FocusedElement> {
        let control_type = unsafe { element.CurrentControlType() }
            .map(|value| value.0)
            .unwrap_or(0);
        let automation_id = unsafe { element.CurrentAutomationId() }
            .map(|value| value.to_string())
            .unwrap_or_default();
        let password = unsafe { element.CurrentIsPassword() }
            .map(|value| value.as_bool())
            .unwrap_or(false);

        let mut name = unsafe { element.CurrentName() }
            .map(|value| value.to_string())
            .unwrap_or_default();

        if name.trim().is_empty() && !password {
            if let Ok(rect) = unsafe { element.CurrentBoundingRectangle() } {
                let width = rect.right - rect.left;
                let height = rect.bottom - rect.top;
                if rect.left >= 0 && rect.top >= 0 && width > 0 && height > 0 {
                    if let Ok((pixels, w, h)) = capture_rect_gdi(rect) {
                        if let Ok(ocr_text) = ocr_bitmap(&pixels, w, h) {
                            let trimmed = ocr_text.trim().to_string();
                            if !trimmed.is_empty() {
                                name = trimmed;
                            }
                        }
                    }
                }
            }
        }

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
