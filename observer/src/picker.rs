use serde::{Deserialize, Serialize};

use crate::model::PROTOCOL_VERSION;
use crate::privacy::WindowPrivacy;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PickedWindow {
    pub version: u8,
    pub display_name: String,
    pub width: i32,
    pub height: i32,
    pub privacy: WindowPrivacy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    pub version: u8,
    pub hwnd: u64,
    pub process_id: u32,
    pub process_name: String,
    pub title: String,
    pub width: i32,
    pub height: i32,
    pub privacy: WindowPrivacy,
}

#[cfg(target_os = "windows")]
pub fn pick_window() -> Result<Option<PickedWindow>, String> {
    windows_picker::pick_window().map(|picked| picked.map(|(_, window)| window))
}

#[cfg(not(target_os = "windows"))]
pub fn pick_window() -> Result<Option<PickedWindow>, String> {
    Err("window picking is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
pub fn list_windows() -> Result<Vec<WindowInfo>, String> {
    windows_picker::list_windows()
}

#[cfg(not(target_os = "windows"))]
pub fn list_windows() -> Result<Vec<WindowInfo>, String> {
    Err("window listing is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
pub fn foreground_window() -> Result<Option<WindowInfo>, String> {
    windows_picker::foreground_window()
}

#[cfg(not(target_os = "windows"))]
pub fn foreground_window() -> Result<Option<WindowInfo>, String> {
    Err("foreground window inspection is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
pub fn window_info(hwnd: u64) -> Result<Option<WindowInfo>, String> {
    windows_picker::window_info(hwnd)
}

#[cfg(not(target_os = "windows"))]
pub fn window_info(_hwnd: u64) -> Result<Option<WindowInfo>, String> {
    Err("window inspection is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
pub(crate) fn process_name_for_pid(process_id: u32) -> String {
    windows_picker::process_name(process_id)
}

#[cfg(target_os = "windows")]
mod windows_picker {
    use std::ffi::c_void;
    use std::path::Path;
    use std::time::{Duration, Instant};

    use windows::core::{factory, Interface, BOOL, PWSTR};
    use windows::Graphics::Capture::{GraphicsCaptureItem, GraphicsCapturePicker};
    use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM, RECT};
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::System::WinRT::Graphics::Capture::IGraphicsCaptureItemInterop;
    use windows::Win32::System::WinRT::{RoInitialize, RO_INIT_SINGLETHREADED};
    use windows::Win32::UI::Shell::IInitializeWithWindow;
    use windows::Win32::UI::WindowsAndMessaging::{
        DispatchMessageW, EnumWindows, GetForegroundWindow, GetWindowRect, GetWindowTextLengthW,
        GetWindowTextW, GetWindowThreadProcessId, IsWindow, IsWindowVisible,
        MsgWaitForMultipleObjectsEx, PeekMessageW, TranslateMessage, MSG, MWMO_INPUTAVAILABLE,
        PM_REMOVE, QS_ALLINPUT,
    };
    use windows_future::{AsyncStatus, IAsyncOperation};

    use super::{PickedWindow, WindowInfo, PROTOCOL_VERSION};
    use crate::privacy::{
        classify_window_privacy_with_policy, ensure_capture_allowed,
        load_window_privacy_policy_from_env, redact_window_title, WindowPrivacyPolicy,
    };

    const PICKER_TIMEOUT: Duration = Duration::from_secs(120);

    pub(crate) fn pick_window() -> Result<Option<(GraphicsCaptureItem, PickedWindow)>, String> {
        unsafe {
            RoInitialize(RO_INIT_SINGLETHREADED)
                .map_err(|error| format!("failed to initialize WinRT: {error}"))?;
        }
        let policy = load_window_privacy_policy_from_env()?;

        let picker = GraphicsCapturePicker::new()
            .map_err(|error| format!("failed to create capture picker: {error}"))?;
        let initializer: IInitializeWithWindow = picker
            .cast()
            .map_err(|error| format!("failed to initialize picker owner: {error}"))?;

        let owner = unsafe { GetForegroundWindow() };
        unsafe {
            initializer
                .Initialize(owner)
                .map_err(|error| format!("failed to bind picker to a window: {error}"))?;
        }

        let operation = picker
            .PickSingleItemAsync()
            .map_err(|error| format!("failed to open capture picker: {error}"))?;
        let Some(item) = wait_for_capture_item(&operation, PICKER_TIMEOUT)? else {
            return Ok(None);
        };
        let window = picked_window_from_item(&item, &policy)?;

        Ok(Some((item, window)))
    }

    pub(crate) fn capture_item_for_hwnd(
        raw_hwnd: u64,
    ) -> Result<(GraphicsCaptureItem, PickedWindow), String> {
        unsafe {
            RoInitialize(RO_INIT_SINGLETHREADED)
                .map_err(|error| format!("failed to initialize WinRT: {error}"))?;
        }
        let policy = load_window_privacy_policy_from_env()?;

        let hwnd = hwnd_from_u64(raw_hwnd);
        if hwnd.is_invalid() {
            return Err("invalid HWND 0".to_string());
        }
        let is_window = unsafe { IsWindow(Some(hwnd)).as_bool() };
        if !is_window {
            return Err(format!("HWND 0x{raw_hwnd:x} is not a valid window"));
        }
        let window_info = describe_window(hwnd, &policy);
        if let Some(window) = &window_info {
            ensure_capture_allowed(&window.privacy)?;
        }

        let interop: IGraphicsCaptureItemInterop =
            factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()
                .map_err(|error| format!("failed to load GraphicsCaptureItem factory: {error}"))?;
        let item =
            unsafe { interop.CreateForWindow::<GraphicsCaptureItem>(hwnd) }.map_err(|error| {
                format!("failed to create capture item for HWND 0x{raw_hwnd:x}: {error}")
            })?;
        let mut window = picked_window_from_item(&item, &policy)?;
        if let Some(window_info) = window_info {
            window.display_name = window_info.title;
            window.privacy = window_info.privacy;
        }
        Ok((item, window))
    }

    pub(crate) fn list_windows() -> Result<Vec<WindowInfo>, String> {
        let policy = load_window_privacy_policy_from_env()?;
        let mut state = WindowEnumerationState {
            windows: Vec::new(),
            policy,
        };
        unsafe {
            EnumWindows(
                Some(enum_window_proc),
                LPARAM((&mut state as *mut WindowEnumerationState) as isize),
            )
            .map_err(|error| format!("failed to enumerate windows: {error}"))?;
        }
        state
            .windows
            .sort_by(|left, right| left.title.cmp(&right.title));
        Ok(state.windows)
    }

    pub(crate) fn foreground_window() -> Result<Option<WindowInfo>, String> {
        let policy = load_window_privacy_policy_from_env()?;
        let hwnd = unsafe { GetForegroundWindow() };
        if hwnd.is_invalid() {
            return Ok(None);
        }

        Ok(describe_window(hwnd, &policy))
    }

    pub(crate) fn window_info(raw_hwnd: u64) -> Result<Option<WindowInfo>, String> {
        let policy = load_window_privacy_policy_from_env()?;
        let hwnd = hwnd_from_u64(raw_hwnd);
        if hwnd.is_invalid() {
            return Err("invalid HWND 0".to_string());
        }
        if !unsafe { IsWindow(Some(hwnd)).as_bool() } {
            return Err(format!("HWND 0x{raw_hwnd:x} is not a valid window"));
        }

        Ok(describe_window(hwnd, &policy))
    }

    struct WindowEnumerationState {
        windows: Vec<WindowInfo>,
        policy: WindowPrivacyPolicy,
    }

    unsafe extern "system" fn enum_window_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let state = &mut *(lparam.0 as *mut WindowEnumerationState);
        if let Some(window) = describe_window(hwnd, &state.policy) {
            state.windows.push(window);
        }
        BOOL(1)
    }

    fn wait_for_capture_item(
        operation: &IAsyncOperation<GraphicsCaptureItem>,
        timeout: Duration,
    ) -> Result<Option<GraphicsCaptureItem>, String> {
        let started = Instant::now();
        loop {
            match operation
                .Status()
                .map_err(|error| format!("failed to read picker status: {error}"))?
            {
                status if status == AsyncStatus::Completed => {
                    let item = operation
                        .GetResults()
                        .map_err(|error| format!("failed to complete capture picker: {error}"))?;
                    return Ok(Some(item));
                }
                status if status == AsyncStatus::Canceled => return Ok(None),
                status if status == AsyncStatus::Error => {
                    let code = operation
                        .ErrorCode()
                        .map_err(|error| format!("failed to read picker error: {error}"))?;
                    return Err(format!(
                        "capture picker failed with HRESULT 0x{:08x}",
                        code.0
                    ));
                }
                _ => {}
            }

            pump_messages();
            if started.elapsed() > timeout {
                let _ = operation.Cancel();
                return Err("timed out waiting for capture picker selection".to_string());
            }

            unsafe {
                let _ = MsgWaitForMultipleObjectsEx(None, 25, QS_ALLINPUT, MWMO_INPUTAVAILABLE);
            }
        }
    }

    fn pump_messages() {
        unsafe {
            let mut message = MSG::default();
            while PeekMessageW(&mut message, None, 0, 0, PM_REMOVE).as_bool() {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }
    }

    fn picked_window_from_item(
        item: &GraphicsCaptureItem,
        policy: &WindowPrivacyPolicy,
    ) -> Result<PickedWindow, String> {
        let size = item
            .Size()
            .map_err(|error| format!("failed to read picked window size: {error}"))?;
        let raw_display_name = item
            .DisplayName()
            .map_err(|error| format!("failed to read picked window name: {error}"))?
            .to_string_lossy();
        let privacy = classify_window_privacy_with_policy("", &raw_display_name, policy);
        let display_name = redact_window_title(raw_display_name, &privacy);

        Ok(PickedWindow {
            version: PROTOCOL_VERSION,
            display_name,
            width: size.Width,
            height: size.Height,
            privacy,
        })
    }

    fn describe_window(hwnd: HWND, policy: &WindowPrivacyPolicy) -> Option<WindowInfo> {
        let visible = unsafe { IsWindowVisible(hwnd).as_bool() };
        if !visible {
            return None;
        }

        let mut rect = RECT::default();
        unsafe { GetWindowRect(hwnd, &mut rect).ok()? };
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;
        if width <= 0 || height <= 0 {
            return None;
        }

        let title = window_title(hwnd);
        if title.trim().is_empty() {
            return None;
        }

        let mut process_id = 0u32;
        unsafe {
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        }

        let process_name = process_name(process_id);
        let privacy = classify_window_privacy_with_policy(&process_name, &title, policy);
        let title = redact_window_title(title, &privacy);

        Some(WindowInfo {
            version: PROTOCOL_VERSION,
            hwnd: hwnd_to_u64(hwnd),
            process_id,
            process_name,
            title,
            width,
            height,
            privacy,
        })
    }

    pub(crate) fn process_name(process_id: u32) -> String {
        let fallback = || format!("pid-{process_id}");
        if process_id == 0 {
            return fallback();
        }

        let Ok(process) =
            (unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id) })
        else {
            return fallback();
        };

        let mut buffer = vec![0u16; 32768];
        let mut len = buffer.len() as u32;
        let result = unsafe {
            QueryFullProcessImageNameW(
                process,
                PROCESS_NAME_FORMAT(0),
                PWSTR(buffer.as_mut_ptr()),
                &mut len,
            )
        };
        let _ = unsafe { CloseHandle(process) };

        if result.is_err() || len == 0 {
            return fallback();
        }

        let path = String::from_utf16_lossy(&buffer[..len as usize]);
        Path::new(&path)
            .file_name()
            .and_then(|name| name.to_str())
            .filter(|name| !name.trim().is_empty())
            .unwrap_or(path.as_str())
            .to_string()
    }

    fn window_title(hwnd: HWND) -> String {
        let len = unsafe { GetWindowTextLengthW(hwnd) };
        if len <= 0 {
            return String::new();
        }

        let mut buffer = vec![0u16; len as usize + 1];
        let copied = unsafe { GetWindowTextW(hwnd, &mut buffer) };
        String::from_utf16_lossy(&buffer[..copied.max(0) as usize])
    }

    fn hwnd_to_u64(hwnd: HWND) -> u64 {
        hwnd.0 as usize as u64
    }

    fn hwnd_from_u64(raw_hwnd: u64) -> HWND {
        HWND(raw_hwnd as usize as *mut c_void)
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn pick_graphics_capture_item() -> Result<
    Option<(
        windows::Graphics::Capture::GraphicsCaptureItem,
        PickedWindow,
    )>,
    String,
> {
    windows_picker::pick_window()
}

#[cfg(target_os = "windows")]
pub(crate) fn capture_item_for_hwnd(
    hwnd: u64,
) -> Result<
    (
        windows::Graphics::Capture::GraphicsCaptureItem,
        PickedWindow,
    ),
    String,
> {
    windows_picker::capture_item_for_hwnd(hwnd)
}
