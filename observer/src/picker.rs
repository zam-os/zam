use serde::{Deserialize, Serialize};

use crate::model::PROTOCOL_VERSION;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PickedWindow {
    pub version: u8,
    pub display_name: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    pub version: u8,
    pub hwnd: u64,
    pub process_id: u32,
    pub title: String,
    pub width: i32,
    pub height: i32,
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
mod windows_picker {
    use std::ffi::c_void;
    use std::time::{Duration, Instant};

    use windows::core::{factory, Interface, BOOL};
    use windows::Graphics::Capture::{GraphicsCaptureItem, GraphicsCapturePicker};
    use windows::Win32::Foundation::{HWND, LPARAM, RECT};
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

    const PICKER_TIMEOUT: Duration = Duration::from_secs(120);

    pub(crate) fn pick_window() -> Result<Option<(GraphicsCaptureItem, PickedWindow)>, String> {
        unsafe {
            RoInitialize(RO_INIT_SINGLETHREADED)
                .map_err(|error| format!("failed to initialize WinRT: {error}"))?;
        }

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
        let window = picked_window_from_item(&item)?;

        Ok(Some((item, window)))
    }

    pub(crate) fn capture_item_for_hwnd(
        raw_hwnd: u64,
    ) -> Result<(GraphicsCaptureItem, PickedWindow), String> {
        unsafe {
            RoInitialize(RO_INIT_SINGLETHREADED)
                .map_err(|error| format!("failed to initialize WinRT: {error}"))?;
        }

        let hwnd = hwnd_from_u64(raw_hwnd);
        if hwnd.is_invalid() {
            return Err("invalid HWND 0".to_string());
        }
        let is_window = unsafe { IsWindow(Some(hwnd)).as_bool() };
        if !is_window {
            return Err(format!("HWND 0x{raw_hwnd:x} is not a valid window"));
        }

        let interop: IGraphicsCaptureItemInterop =
            factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()
                .map_err(|error| format!("failed to load GraphicsCaptureItem factory: {error}"))?;
        let item =
            unsafe { interop.CreateForWindow::<GraphicsCaptureItem>(hwnd) }.map_err(|error| {
                format!("failed to create capture item for HWND 0x{raw_hwnd:x}: {error}")
            })?;
        let window = picked_window_from_item(&item)?;
        Ok((item, window))
    }

    pub(crate) fn list_windows() -> Result<Vec<WindowInfo>, String> {
        let mut windows = Vec::<WindowInfo>::new();
        unsafe {
            EnumWindows(
                Some(enum_window_proc),
                LPARAM((&mut windows as *mut Vec<WindowInfo>) as isize),
            )
            .map_err(|error| format!("failed to enumerate windows: {error}"))?;
        }
        windows.sort_by(|left, right| left.title.cmp(&right.title));
        Ok(windows)
    }

    unsafe extern "system" fn enum_window_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let windows = &mut *(lparam.0 as *mut Vec<WindowInfo>);
        if let Some(window) = describe_window(hwnd) {
            windows.push(window);
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

    fn picked_window_from_item(item: &GraphicsCaptureItem) -> Result<PickedWindow, String> {
        let size = item
            .Size()
            .map_err(|error| format!("failed to read picked window size: {error}"))?;
        let display_name = item
            .DisplayName()
            .map_err(|error| format!("failed to read picked window name: {error}"))?
            .to_string_lossy();

        Ok(PickedWindow {
            version: PROTOCOL_VERSION,
            display_name,
            width: size.Width,
            height: size.Height,
        })
    }

    fn describe_window(hwnd: HWND) -> Option<WindowInfo> {
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

        Some(WindowInfo {
            version: PROTOCOL_VERSION,
            hwnd: hwnd_to_u64(hwnd),
            process_id,
            title,
            width,
            height,
        })
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
