use std::path::Path;
use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::model::{SensorEvent, PROTOCOL_VERSION};
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CapturedFrameSample {
    pub version: u8,
    pub frame_width: i32,
    pub frame_height: i32,
    pub system_relative_time_ticks: i64,
    pub changed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CapturedFrameSequence {
    pub version: u8,
    pub window: PickedWindow,
    pub frames: Vec<CapturedFrameSample>,
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

#[cfg(target_os = "windows")]
pub fn sample_window(
    hwnd: u64,
    frames: usize,
    interval: Duration,
    change_threshold: f64,
) -> Result<CapturedFrameSequence, String> {
    windows_capture::sample_window(hwnd, frames, interval, change_threshold)
}

/// Stream sparse capture `SensorEvent`s for a window: a `frame-changed` event
/// per visual keyframe plus periodic `heartbeat`s. `on_event` is called for each
/// emitted event so callers can write them out incrementally.
///
/// When `keyframe_dir` is set, each keyframe's pixels are encoded to PNG and
/// retained there (oldest pruned beyond `keyframe_retain`), and the event's
/// `data.ref` resolves to the written file instead of a symbolic handle.
#[cfg(target_os = "windows")]
#[allow(clippy::too_many_arguments)]
pub fn watch_window_keyframes(
    hwnd: u64,
    samples: usize,
    interval: Duration,
    change_threshold: f64,
    heartbeat_every: u64,
    session_id: &str,
    keyframe_dir: Option<&Path>,
    keyframe_retain: usize,
    on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    windows_capture::watch_window_keyframes(
        hwnd,
        samples,
        interval,
        change_threshold,
        heartbeat_every,
        session_id,
        keyframe_dir,
        keyframe_retain,
        on_event,
    )
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

#[cfg(not(target_os = "windows"))]
pub fn sample_window(
    _hwnd: u64,
    _frames: usize,
    _interval: Duration,
    _change_threshold: f64,
) -> Result<CapturedFrameSequence, String> {
    Err("window capture is only available on Windows".to_string())
}

#[cfg(not(target_os = "windows"))]
#[allow(clippy::too_many_arguments)]
pub fn watch_window_keyframes(
    _hwnd: u64,
    _samples: usize,
    _interval: Duration,
    _change_threshold: f64,
    _heartbeat_every: u64,
    _session_id: &str,
    _keyframe_dir: Option<&Path>,
    _keyframe_retain: usize,
    _on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
) -> Result<(), String> {
    Err("window capture is only available on Windows".to_string())
}

#[cfg(target_os = "windows")]
mod windows_capture {
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

    use super::{CapturedFrameProbe, CapturedFrameSample, CapturedFrameSequence, PROTOCOL_VERSION};
    use crate::clock::observed_at_now;
    use crate::frame_ring::FrameRing;
    use crate::frame_signature::FrameSignature;
    use crate::keyframe::KeyframeStream;
    use crate::keyframe_archive::KeyframeArchive;
    use crate::model::{ApplicationContext, SensorEvent, SensorKind};
    use crate::picker::{capture_item_for_hwnd, pick_graphics_capture_item, window_info, PickedWindow};
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

    pub fn sample_window(
        hwnd: u64,
        frame_count: usize,
        interval: Duration,
        change_threshold: f64,
    ) -> Result<CapturedFrameSequence, String> {
        let (item, window) = capture_item_for_hwnd(hwnd)?;
        sample_item(item, window, frame_count, interval, change_threshold)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn watch_window_keyframes(
        hwnd: u64,
        samples: usize,
        interval: Duration,
        change_threshold: f64,
        heartbeat_every: u64,
        session_id: &str,
        keyframe_dir: Option<&Path>,
        keyframe_retain: usize,
        on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        if samples == 0 {
            return Err("--samples must be greater than 0".to_string());
        }

        // `capture_item_for_hwnd` re-checks the privacy gate before any pixels
        // are read; `window_info` adds the process name the picker item lacks.
        let (item, picked) = capture_item_for_hwnd(hwnd)?;
        let (application, redacted) = match window_info(hwnd)? {
            Some(info) => {
                let redacted = info.privacy.title_redacted;
                (
                    ApplicationContext {
                        process_name: info.process_name,
                        process_id: Some(info.process_id),
                        window_title: Some(info.title),
                    },
                    redacted,
                )
            }
            None => (
                ApplicationContext {
                    process_name: format!("hwnd-0x{hwnd:x}"),
                    process_id: None,
                    window_title: Some(picked.display_name.clone()),
                },
                picked.privacy.title_redacted,
            ),
        };

        let mut stream = KeyframeStream::new(
            session_id,
            application,
            redacted,
            change_threshold,
            heartbeat_every,
        );
        let mut archive = keyframe_dir
            .map(|dir| KeyframeArchive::new(dir, keyframe_retain))
            .transpose()?;
        let archiving = archive.is_some();

        let devices = create_direct3d_devices()?;
        let (frame, session, pool) = capture_first_frame(&devices.winrt, &item)?;
        let first = read_frame_capture(&devices.native, &frame, archiving)?;
        let _ = frame.Close();
        emit_capture_event(&mut stream, &mut archive, Some(first), on_event)?;

        for _ in 1..samples {
            if !interval.is_zero() {
                thread::sleep(interval);
            }
            let capture = match try_wait_for_frame(&pool, Duration::from_millis(250))? {
                Some(frame) => {
                    let capture = read_frame_capture(&devices.native, &frame, archiving)?;
                    let _ = frame.Close();
                    Some(capture)
                }
                None => None,
            };
            emit_capture_event(&mut stream, &mut archive, capture, on_event)?;
        }

        let _ = session.Close();
        let _ = pool.Close();
        Ok(())
    }

    /// A sampled frame: its signature plus, when keyframe retention is on, the
    /// pixels needed to persist it.
    struct CapturedKeyframe {
        signature: FrameSignature,
        pixels: Option<(u32, u32, Vec<u8>)>,
    }

    fn read_frame_capture(
        device: &ID3D11Device,
        frame: &Direct3D11CaptureFrame,
        with_pixels: bool,
    ) -> Result<CapturedKeyframe, String> {
        read_frame(device, frame, |data, row_pitch, desc| {
            if data.is_null() {
                return Err("mapped texture returned a null data pointer".to_string());
            }
            let width = desc.Width as usize;
            let height = desc.Height as usize;
            let bytes = unsafe { slice::from_raw_parts(data, row_pitch.saturating_mul(height)) };
            let signature = FrameSignature::from_bgra(bytes, width, height, row_pitch);
            // Only copy pixels when retention is on; the copy is ~8 MB at 1080p.
            let pixels = if with_pixels {
                let rgba = bgra_to_rgba(data, width, height, row_pitch)?;
                Some((desc.Width, desc.Height, rgba))
            } else {
                None
            };
            Ok(CapturedKeyframe { signature, pixels })
        })
    }

    fn emit_capture_event(
        stream: &mut KeyframeStream,
        archive: &mut Option<KeyframeArchive>,
        capture: Option<CapturedKeyframe>,
        on_event: &mut dyn FnMut(&SensorEvent) -> Result<(), String>,
    ) -> Result<(), String> {
        let (signature, pixels) = match capture {
            Some(capture) => (Some(capture.signature), capture.pixels),
            None => (None, None),
        };

        if let Some(mut event) = stream.observe(signature, observed_at_now()) {
            if event.kind == SensorKind::FrameChanged {
                if let (Some(archive), Some((width, height, rgba))) = (archive.as_mut(), &pixels) {
                    let png = encode_png_to_vec(*width, *height, rgba)?;
                    let path = archive.store(&png)?;
                    event.data.insert(
                        "ref".to_string(),
                        serde_json::Value::String(format!("file:{}", path.display())),
                    );
                }
            }
            on_event(&event)?;
        }

        Ok(())
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

    fn sample_item(
        item: GraphicsCaptureItem,
        window: PickedWindow,
        frame_count: usize,
        interval: Duration,
        change_threshold: f64,
    ) -> Result<CapturedFrameSequence, String> {
        ensure_capture_allowed(&window.privacy)?;
        if frame_count == 0 {
            return Err("--frames must be greater than 0".to_string());
        }

        let devices = create_direct3d_devices()?;
        let (frame, session, pool) = capture_first_frame(&devices.winrt, &item)?;
        let mut frames = FrameRing::new(frame_count)?;
        // The first frame establishes the baseline keyframe and is always
        // reported as changed.
        let mut keyframe = read_frame_signature(&devices.native, &frame)?;
        let first_sample = frame_sample(&frame, true)?;
        let mut last_sample = first_sample.clone();
        frames.push(first_sample);
        let _ = frame.Close();

        while frames.len() < frame_count {
            if !interval.is_zero() {
                thread::sleep(interval);
            }
            if let Some(frame) = try_wait_for_frame(&pool, Duration::from_millis(250))? {
                let signature = read_frame_signature(&devices.native, &frame)?;
                // Compare against the last retained keyframe so slow drift that
                // crosses the threshold is still captured exactly once.
                let changed = signature.differs_from(&keyframe, change_threshold);
                if changed {
                    keyframe = signature;
                }
                let sample = frame_sample(&frame, changed)?;
                last_sample = sample.clone();
                frames.push(sample);
                let _ = frame.Close();
            } else {
                // Windows delivered no new frame in this interval: reuse the last
                // metadata but record that nothing visually changed.
                let mut sample = last_sample.clone();
                sample.changed = false;
                frames.push(sample);
            }
        }

        let _ = session.Close();
        let _ = pool.Close();

        Ok(CapturedFrameSequence {
            version: PROTOCOL_VERSION,
            window,
            frames: frames.snapshot(),
        })
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

    fn frame_sample(
        frame: &Direct3D11CaptureFrame,
        changed: bool,
    ) -> Result<CapturedFrameSample, String> {
        let content_size = frame
            .ContentSize()
            .map_err(|error| format!("failed to read frame content size: {error}"))?;
        let system_time = frame
            .SystemRelativeTime()
            .map_err(|error| format!("failed to read frame timestamp: {error}"))?;

        Ok(CapturedFrameSample {
            version: PROTOCOL_VERSION,
            frame_width: content_size.Width,
            frame_height: content_size.Height,
            system_relative_time_ticks: system_time.Duration,
            changed,
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
        let (width, height, rgba) = read_frame(device, frame, |data, row_pitch, desc| {
            let rgba = bgra_to_rgba(data, desc.Width as usize, desc.Height as usize, row_pitch)?;
            Ok((desc.Width, desc.Height, rgba))
        })?;

        encode_png(output, width, height, &rgba)
    }

    fn read_frame_signature(
        device: &ID3D11Device,
        frame: &Direct3D11CaptureFrame,
    ) -> Result<FrameSignature, String> {
        read_frame(device, frame, |data, row_pitch, desc| {
            if data.is_null() {
                return Err("mapped texture returned a null data pointer".to_string());
            }
            let width = desc.Width as usize;
            let height = desc.Height as usize;
            // The mapped staging region holds at least `row_pitch * height`
            // bytes; `FrameSignature::from_bgra` clamps reads to that range.
            let bytes = unsafe { slice::from_raw_parts(data, row_pitch.saturating_mul(height)) };
            Ok(FrameSignature::from_bgra(bytes, width, height, row_pitch))
        })
    }

    /// Copy a captured frame into a CPU-readable staging texture, run `read`
    /// against the mapped BGRA bytes, and always unmap before returning.
    fn read_frame<R>(
        device: &ID3D11Device,
        frame: &Direct3D11CaptureFrame,
        read: impl FnOnce(*const u8, usize, &D3D11_TEXTURE2D_DESC) -> Result<R, String>,
    ) -> Result<R, String> {
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

        let result = read(mapped.pData.cast::<u8>(), mapped.RowPitch as usize, &desc);

        unsafe {
            context.Unmap(&staging_resource, 0);
        }

        result
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

    fn encode_png_to_vec(width: u32, height: u32, rgba: &[u8]) -> Result<Vec<u8>, String> {
        let mut buffer = Vec::new();
        {
            let mut encoder = png::Encoder::new(&mut buffer, width, height);
            encoder.set_color(png::ColorType::Rgba);
            encoder.set_depth(png::BitDepth::Eight);
            let mut writer = encoder
                .write_header()
                .map_err(|error| format!("failed to write PNG header: {error}"))?;
            writer
                .write_image_data(rgba)
                .map_err(|error| format!("failed to write PNG data: {error}"))?;
        }
        Ok(buffer)
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
        let png = encode_png_to_vec(width, height, rgba)?;
        std::fs::write(output, png)
            .map_err(|error| format!("failed to write snapshot {}: {error}", output.display()))
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
        try_wait_for_frame(pool, timeout)?
            .ok_or_else(|| "timed out waiting for first frame".to_string())
    }

    fn try_wait_for_frame(
        pool: &Direct3D11CaptureFramePool,
        timeout: Duration,
    ) -> Result<Option<Direct3D11CaptureFrame>, String> {
        let started = Instant::now();
        loop {
            match pool.TryGetNextFrame() {
                Ok(frame) => return Ok(Some(frame)),
                Err(error) if started.elapsed() < timeout => {
                    let _ = error;
                    thread::sleep(Duration::from_millis(25));
                }
                Err(_) => return Ok(None),
            }
        }
    }
}
