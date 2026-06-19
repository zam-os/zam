use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::model::PROTOCOL_VERSION;
use crate::picker::PickedWindow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CapturedFrameProbe {
    pub version: u8,
    pub window: PickedWindow,
    pub frame_width: i32,
    pub frame_height: i32,
    pub system_relative_time_ticks: i64,
}

#[cfg(target_os = "windows")]
pub fn capture_once() -> Result<Option<CapturedFrameProbe>, String> {
    windows_capture::capture_once()
}

#[cfg(target_os = "windows")]
pub fn capture_window(hwnd: u64) -> Result<CapturedFrameProbe, String> {
    windows_capture::capture_window(hwnd)
}

#[cfg(target_os = "windows")]
pub fn snapshot_window(hwnd: u64, output: &Path) -> Result<CapturedFrameProbe, String> {
    windows_capture::snapshot_window(hwnd, output)
}

#[cfg(not(target_os = "windows"))]
pub fn capture_once() -> Result<Option<CapturedFrameProbe>, String> {
    Err("window capture is only available on Windows".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn capture_window(_hwnd: u64) -> Result<CapturedFrameProbe, String> {
    Err("window capture is only available on Windows".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn snapshot_window(_hwnd: u64, _output: &Path) -> Result<CapturedFrameProbe, String> {
    Err("window capture is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
mod windows_capture {
    use std::fs::File;
    use std::io::BufWriter;
    use std::path::Path;
    use std::slice;
    use std::thread;
    use std::time::{Duration, Instant};

    use windows::core::Interface;
    use windows::Graphics::Capture::{
        Direct3D11CaptureFrame, Direct3D11CaptureFramePool, GraphicsCaptureItem,
        GraphicsCaptureSession,
    };
    use windows::Graphics::DirectX::Direct3D11::IDirect3DDevice;
    use windows::Graphics::DirectX::DirectXPixelFormat;
    use windows::Win32::Foundation::HMODULE;
    use windows::Win32::Graphics::Direct3D::{
        D3D_DRIVER_TYPE_HARDWARE, D3D_FEATURE_LEVEL, D3D_FEATURE_LEVEL_11_0, D3D_FEATURE_LEVEL_11_1,
    };
    use windows::Win32::Graphics::Direct3D11::{
        D3D11CreateDevice, ID3D11Device, ID3D11Resource, ID3D11Texture2D, D3D11_CPU_ACCESS_READ,
        D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_MAPPED_SUBRESOURCE, D3D11_MAP_READ,
        D3D11_SDK_VERSION, D3D11_TEXTURE2D_DESC, D3D11_USAGE_STAGING,
    };
    use windows::Win32::Graphics::Dxgi::Common::DXGI_FORMAT_B8G8R8A8_UNORM;
    use windows::Win32::Graphics::Dxgi::IDXGIDevice;
    use windows::Win32::System::WinRT::Direct3D11::{
        CreateDirect3D11DeviceFromDXGIDevice, IDirect3DDxgiInterfaceAccess,
    };

    use super::{CapturedFrameProbe, PROTOCOL_VERSION};
    use crate::picker::{capture_item_for_hwnd, pick_graphics_capture_item, PickedWindow};
    use crate::privacy::ensure_capture_allowed;

    struct CaptureDevices {
        winrt: IDirect3DDevice,
        native: ID3D11Device,
    }

    pub fn capture_once() -> Result<Option<CapturedFrameProbe>, String> {
        let Some((item, window)) = pick_graphics_capture_item()? else {
            return Ok(None);
        };

        capture_item(item, window).map(Some)
    }

    pub fn capture_window(hwnd: u64) -> Result<CapturedFrameProbe, String> {
        let (item, window) = capture_item_for_hwnd(hwnd)?;
        capture_item(item, window)
    }

    pub fn snapshot_window(hwnd: u64, output: &Path) -> Result<CapturedFrameProbe, String> {
        let (item, window) = capture_item_for_hwnd(hwnd)?;
        snapshot_item(item, window, output)
    }

    fn capture_item(
        item: GraphicsCaptureItem,
        window: PickedWindow,
    ) -> Result<CapturedFrameProbe, String> {
        ensure_capture_allowed(&window.privacy)?;
        let devices = create_direct3d_devices()?;
        let (frame, session, pool) = capture_first_frame(&devices.winrt, &item)?;
        let probe = frame_probe(&frame, window)?;

        let _ = frame.Close();
        let _ = session.Close();
        let _ = pool.Close();

        Ok(probe)
    }

    fn snapshot_item(
        item: GraphicsCaptureItem,
        window: PickedWindow,
        output: &Path,
    ) -> Result<CapturedFrameProbe, String> {
        ensure_capture_allowed(&window.privacy)?;
        let devices = create_direct3d_devices()?;
        let (frame, session, pool) = capture_first_frame(&devices.winrt, &item)?;
        write_frame_png(&devices.native, &frame, output)?;
        let probe = frame_probe(&frame, window)?;

        let _ = frame.Close();
        let _ = session.Close();
        let _ = pool.Close();

        Ok(probe)
    }

    fn capture_first_frame(
        device: &IDirect3DDevice,
        item: &GraphicsCaptureItem,
    ) -> Result<
        (
            Direct3D11CaptureFrame,
            GraphicsCaptureSession,
            Direct3D11CaptureFramePool,
        ),
        String,
    > {
        let item_size = item
            .Size()
            .map_err(|error| format!("failed to read capture item size: {error}"))?;
        let pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
            device,
            DirectXPixelFormat::B8G8R8A8UIntNormalized,
            1,
            item_size,
        )
        .map_err(|error| format!("failed to create capture frame pool: {error}"))?;
        let session = pool
            .CreateCaptureSession(item)
            .map_err(|error| format!("failed to create capture session: {error}"))?;
        configure_session(&session);
        session
            .StartCapture()
            .map_err(|error| format!("failed to start capture session: {error}"))?;

        let frame = wait_for_frame(&pool, Duration::from_secs(5))?;
        Ok((frame, session, pool))
    }

    fn frame_probe(
        frame: &Direct3D11CaptureFrame,
        window: PickedWindow,
    ) -> Result<CapturedFrameProbe, String> {
        let content_size = frame
            .ContentSize()
            .map_err(|error| format!("failed to read frame content size: {error}"))?;
        let system_time = frame
            .SystemRelativeTime()
            .map_err(|error| format!("failed to read frame timestamp: {error}"))?;

        Ok(CapturedFrameProbe {
            version: PROTOCOL_VERSION,
            window,
            frame_width: content_size.Width,
            frame_height: content_size.Height,
            system_relative_time_ticks: system_time.Duration,
        })
    }

    fn create_direct3d_devices() -> Result<CaptureDevices, String> {
        let mut d3d_device: Option<ID3D11Device> = None;
        let mut feature_level = D3D_FEATURE_LEVEL::default();
        let feature_levels = [D3D_FEATURE_LEVEL_11_1, D3D_FEATURE_LEVEL_11_0];

        unsafe {
            D3D11CreateDevice(
                None,
                D3D_DRIVER_TYPE_HARDWARE,
                HMODULE::default(),
                D3D11_CREATE_DEVICE_BGRA_SUPPORT,
                Some(&feature_levels),
                D3D11_SDK_VERSION,
                Some(&mut d3d_device),
                Some(&mut feature_level),
                None,
            )
            .map_err(|error| format!("failed to create D3D11 device: {error}"))?;
        }

        let d3d_device = d3d_device.ok_or_else(|| "D3D11 device was not returned".to_string())?;
        let dxgi_device: IDXGIDevice = d3d_device
            .cast()
            .map_err(|error| format!("failed to cast D3D11 device to DXGI device: {error}"))?;
        let inspectable = unsafe {
            CreateDirect3D11DeviceFromDXGIDevice(&dxgi_device).map_err(|error| {
                format!("failed to create WinRT Direct3D device from DXGI device: {error}")
            })?
        };
        let winrt = inspectable
            .cast()
            .map_err(|error| format!("failed to cast WinRT Direct3D device: {error}"))?;

        Ok(CaptureDevices {
            winrt,
            native: d3d_device,
        })
    }

    fn write_frame_png(
        device: &ID3D11Device,
        frame: &Direct3D11CaptureFrame,
        output: &Path,
    ) -> Result<(), String> {
        let surface = frame
            .Surface()
            .map_err(|error| format!("failed to read frame surface: {error}"))?;
        let access: IDirect3DDxgiInterfaceAccess = surface
            .cast()
            .map_err(|error| format!("failed to access DXGI frame surface: {error}"))?;
        let source_texture: ID3D11Texture2D = unsafe { access.GetInterface() }
            .map_err(|error| format!("failed to get D3D11 texture from frame surface: {error}"))?;

        let mut desc = D3D11_TEXTURE2D_DESC::default();
        unsafe {
            source_texture.GetDesc(&mut desc);
        }
        if desc.Format != DXGI_FORMAT_B8G8R8A8_UNORM {
            return Err(format!(
                "unsupported frame format {:?}; expected BGRA8",
                desc.Format
            ));
        }

        let mut staging_desc = desc;
        staging_desc.Usage = D3D11_USAGE_STAGING;
        staging_desc.BindFlags = 0;
        staging_desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ.0 as u32;
        staging_desc.MiscFlags = 0;

        let mut staging_texture = None;
        unsafe {
            device
                .CreateTexture2D(&staging_desc, None, Some(&mut staging_texture))
                .map_err(|error| format!("failed to create staging texture: {error}"))?;
        }
        let staging_texture =
            staging_texture.ok_or_else(|| "staging texture was not returned".to_string())?;

        let source_resource: ID3D11Resource = source_texture
            .cast()
            .map_err(|error| format!("failed to cast source texture to resource: {error}"))?;
        let staging_resource: ID3D11Resource = staging_texture
            .cast()
            .map_err(|error| format!("failed to cast staging texture to resource: {error}"))?;
        let context = unsafe { device.GetImmediateContext() }
            .map_err(|error| format!("failed to get D3D11 immediate context: {error}"))?;

        unsafe {
            context.CopyResource(&staging_resource, &source_resource);
        }

        let mut mapped = D3D11_MAPPED_SUBRESOURCE::default();
        unsafe {
            context
                .Map(&staging_resource, 0, D3D11_MAP_READ, 0, Some(&mut mapped))
                .map_err(|error| format!("failed to map staging texture: {error}"))?;
        }

        let rgba = bgra_to_rgba(
            mapped.pData.cast::<u8>(),
            desc.Width as usize,
            desc.Height as usize,
            mapped.RowPitch as usize,
        );
        unsafe {
            context.Unmap(&staging_resource, 0);
        }
        let rgba = rgba?;

        encode_png(output, desc.Width, desc.Height, &rgba)
    }

    fn bgra_to_rgba(
        data: *const u8,
        width: usize,
        height: usize,
        row_pitch: usize,
    ) -> Result<Vec<u8>, String> {
        if data.is_null() {
            return Err("mapped texture returned a null data pointer".to_string());
        }
        let row_bytes = width
            .checked_mul(4)
            .ok_or_else(|| "frame row is too wide".to_string())?;
        if row_pitch < row_bytes {
            return Err("mapped row pitch is smaller than frame row bytes".to_string());
        }

        let mut rgba = vec![
            0u8;
            width
                .checked_mul(height)
                .and_then(|pixels| pixels.checked_mul(4))
                .ok_or_else(|| "frame is too large".to_string())?
        ];
        for y in 0..height {
            let source = unsafe { slice::from_raw_parts(data.add(y * row_pitch), row_bytes) };
            let target = &mut rgba[y * row_bytes..(y + 1) * row_bytes];
            for (src, dst) in source.chunks_exact(4).zip(target.chunks_exact_mut(4)) {
                dst[0] = src[2];
                dst[1] = src[1];
                dst[2] = src[0];
                dst[3] = src[3];
            }
        }
        Ok(rgba)
    }

    fn encode_png(output: &Path, width: u32, height: u32, rgba: &[u8]) -> Result<(), String> {
        if let Some(parent) = output.parent() {
            std::fs::create_dir_all(parent).map_err(|error| {
                format!(
                    "failed to create snapshot directory {}: {error}",
                    parent.display()
                )
            })?;
        }
        let file = File::create(output)
            .map_err(|error| format!("failed to create snapshot {}: {error}", output.display()))?;
        let writer = BufWriter::new(file);
        let mut encoder = png::Encoder::new(writer, width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder
            .write_header()
            .map_err(|error| format!("failed to write PNG header: {error}"))?;
        writer
            .write_image_data(rgba)
            .map_err(|error| format!("failed to write PNG data: {error}"))
    }

    fn configure_session(session: &GraphicsCaptureSession) {
        let _ = session.SetIsCursorCaptureEnabled(false);
        let _ = session.SetIsBorderRequired(true);
        let _ = session.SetIncludeSecondaryWindows(false);
    }

    fn wait_for_frame(
        pool: &Direct3D11CaptureFramePool,
        timeout: Duration,
    ) -> Result<Direct3D11CaptureFrame, String> {
        let started = Instant::now();
        loop {
            match pool.TryGetNextFrame() {
                Ok(frame) => return Ok(frame),
                Err(error) if started.elapsed() < timeout => {
                    let _ = error;
                    thread::sleep(Duration::from_millis(25));
                }
                Err(error) => return Err(format!("timed out waiting for first frame: {error}")),
            }
        }
    }
}
