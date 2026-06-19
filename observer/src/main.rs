use std::collections::BTreeMap;
use std::env;
use std::fs::File;
use std::io::{self, BufRead, BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use zam_observer::{
    capture_once, capture_window, foreground_window, list_windows, pick_window, sample_window,
    snapshot_window, ApplicationContext, ObserverCapabilities, ObserverProbe, ReplayEngine,
    SensorEvent, SensorKind, SensorSource, UiObservationReport, PROTOCOL_VERSION,
};

fn main() {
    if let Err(error) = run() {
        eprintln!("zam-observer: {error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let mut args = env::args().skip(1);
    let command = args.next().unwrap_or_else(|| "help".to_string());

    match command.as_str() {
        "probe" => print_probe(),
        "list-windows" => list_windows_command(),
        "foreground-window" => foreground_window_command(),
        "watch-foreground" => {
            let options = WatchForegroundOptions::parse(args.collect())?;
            watch_foreground_command(options)
        }
        "pick-window" => pick_window_command(),
        "capture-once" => capture_once_command(),
        "capture-window" => {
            let options = HwndOptions::parse(args.collect())?;
            capture_window_command(options.hwnd)
        }
        "snapshot-window" => {
            let options = SnapshotOptions::parse(args.collect())?;
            snapshot_window_command(options)
        }
        "sample-window" => {
            let options = SampleOptions::parse(args.collect())?;
            sample_window_command(options)
        }
        "replay" => {
            let options = IoOptions::parse(args.collect())?;
            replay(options)
        }
        "validate" => {
            let options = IoOptions::parse(args.collect())?;
            validate(options)
        }
        "help" | "--help" | "-h" => {
            print_usage();
            Ok(())
        }
        unknown => Err(format!("unknown command '{unknown}'")),
    }
}

fn print_probe() -> Result<(), String> {
    let probe = ObserverProbe {
        name: "zam-observer".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        protocol_version: PROTOCOL_VERSION,
        os: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        capabilities: ObserverCapabilities {
            replay: true,
            window_context: cfg!(target_os = "windows"),
            foreground_watch: cfg!(target_os = "windows"),
            live_capture: cfg!(target_os = "windows"),
            frame_sampling: cfg!(target_os = "windows"),
            ui_automation: false,
            raw_input: false,
        },
    };
    println!(
        "{}",
        serde_json::to_string_pretty(&probe).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn list_windows_command() -> Result<(), String> {
    print_pretty(&list_windows()?)
}

fn foreground_window_command() -> Result<(), String> {
    match foreground_window()? {
        Some(window) => {
            print_pretty(&window)?;
        }
        None => {
            println!("null");
        }
    }
    Ok(())
}

fn watch_foreground_command(options: WatchForegroundOptions) -> Result<(), String> {
    let mut writer = BufWriter::new(io::stdout());
    let mut last_fingerprint: Option<ForegroundFingerprint> = None;
    let mut privacy_paused = false;
    let mut sequence = 0u64;

    for sample_index in 0..options.samples {
        if let Some(window) = foreground_window()? {
            let fingerprint = ForegroundFingerprint::from_window(&window);
            if last_fingerprint.as_ref() != Some(&fingerprint) {
                if window.privacy.is_paused() {
                    if !privacy_paused {
                        sequence += 1;
                        write_event(
                            &mut writer,
                            foreground_event(
                                &options.session_id,
                                sequence,
                                SensorSource::Privacy,
                                SensorKind::PrivacyPaused,
                                &window,
                            ),
                        )?;
                        privacy_paused = true;
                    }
                } else {
                    if privacy_paused {
                        sequence += 1;
                        write_event(
                            &mut writer,
                            foreground_event(
                                &options.session_id,
                                sequence,
                                SensorSource::Privacy,
                                SensorKind::PrivacyResumed,
                                &window,
                            ),
                        )?;
                        privacy_paused = false;
                    }
                    sequence += 1;
                    write_event(
                        &mut writer,
                        foreground_event(
                            &options.session_id,
                            sequence,
                            SensorSource::Window,
                            SensorKind::ForegroundChanged,
                            &window,
                        ),
                    )?;
                }
                last_fingerprint = Some(fingerprint);
            }
        }

        if sample_index + 1 < options.samples {
            thread::sleep(Duration::from_millis(options.interval_ms));
        }
    }

    writer.flush().map_err(|error| error.to_string())
}

fn pick_window_command() -> Result<(), String> {
    match pick_window()? {
        Some(window) => {
            print_pretty(&window)?;
        }
        None => {
            println!("null");
        }
    }
    Ok(())
}

fn capture_once_command() -> Result<(), String> {
    match capture_once()? {
        Some(frame) => {
            print_pretty(&frame)?;
        }
        None => {
            println!("null");
        }
    }
    Ok(())
}

fn capture_window_command(hwnd: u64) -> Result<(), String> {
    print_pretty(&capture_window(hwnd)?)
}

fn snapshot_window_command(options: SnapshotOptions) -> Result<(), String> {
    print_pretty(&snapshot_window(options.hwnd, &options.output)?)
}

fn sample_window_command(options: SampleOptions) -> Result<(), String> {
    print_pretty(&sample_window(
        options.hwnd,
        options.frames,
        Duration::from_millis(options.interval_ms),
    )?)
}

fn print_pretty(value: &impl serde::Serialize) -> Result<(), String> {
    println!(
        "{}",
        serde_json::to_string_pretty(value).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn replay(options: IoOptions) -> Result<(), String> {
    let reader = options.reader()?;
    let mut writer = options.writer()?;
    let mut engine = ReplayEngine::default();

    for (line_number, line) in reader.lines().enumerate() {
        let line = line.map_err(|error| error.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        let event: SensorEvent = serde_json::from_str(&line)
            .map_err(|error| format!("line {}: {error}", line_number + 1))?;
        if let Some(report) = engine
            .process(event)
            .map_err(|error| format!("line {}: {error}", line_number + 1))?
        {
            write_report(&mut writer, &report)?;
        }
    }

    if let Some(report) = engine.finish().map_err(|error| error.to_string())? {
        write_report(&mut writer, &report)?;
    }
    writer.flush().map_err(|error| error.to_string())
}

fn validate(options: IoOptions) -> Result<(), String> {
    let reader = options.reader()?;
    let mut engine = ReplayEngine::default();

    for (line_number, line) in reader.lines().enumerate() {
        let line = line.map_err(|error| error.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        let event: SensorEvent = serde_json::from_str(&line)
            .map_err(|error| format!("line {}: {error}", line_number + 1))?;
        engine
            .process(event)
            .map_err(|error| format!("line {}: {error}", line_number + 1))?;
    }
    engine.finish().map_err(|error| error.to_string())?;

    let mut writer = options.writer()?;
    serde_json::to_writer_pretty(&mut writer, &engine.summary())
        .map_err(|error| error.to_string())?;
    writeln!(writer).map_err(|error| error.to_string())
}

fn write_report(writer: &mut dyn Write, report: &UiObservationReport) -> Result<(), String> {
    serde_json::to_writer(&mut *writer, report).map_err(|error| error.to_string())?;
    writeln!(writer).map_err(|error| error.to_string())
}

fn write_event(writer: &mut dyn Write, event: SensorEvent) -> Result<(), String> {
    serde_json::to_writer(&mut *writer, &event).map_err(|error| error.to_string())?;
    writeln!(writer).map_err(|error| error.to_string())
}

fn foreground_event(
    session_id: &str,
    sequence: u64,
    source: SensorSource,
    kind: SensorKind,
    window: &zam_observer::WindowInfo,
) -> SensorEvent {
    let mut data = BTreeMap::new();
    data.insert("hwnd".to_string(), serde_json::json!(window.hwnd));
    data.insert("width".to_string(), serde_json::json!(window.width));
    data.insert("height".to_string(), serde_json::json!(window.height));
    if !window.privacy.reasons.is_empty() {
        data.insert(
            "privacyReasons".to_string(),
            serde_json::json!(window.privacy.reasons),
        );
    }

    SensorEvent {
        version: PROTOCOL_VERSION,
        session_id: session_id.to_string(),
        sequence,
        observed_at: observed_at_now(),
        source,
        kind,
        application: Some(ApplicationContext {
            process_name: window.process_name.clone(),
            process_id: Some(window.process_id),
            window_title: Some(window.title.clone()),
        }),
        target: None,
        data,
        redacted: window.privacy.title_redacted,
    }
}

fn observed_at_now() -> String {
    let elapsed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format_unix_time_millis(elapsed.as_secs() as i64, elapsed.subsec_millis())
}

fn format_unix_time_millis(seconds: i64, millis: u32) -> String {
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    let (year, month, day) = civil_from_unix_days(days);

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

fn civil_from_unix_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let day_of_era = z - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    let year = year + if month <= 2 { 1 } else { 0 };

    (year as i32, month as u32, day as u32)
}

fn print_usage() {
    println!(
        "ZAM UI observer sidecar

Usage:
  zam-observer probe
  zam-observer list-windows
  zam-observer foreground-window
  zam-observer watch-foreground --session <id> [--samples <n>] [--interval-ms <n>]
  zam-observer pick-window
  zam-observer capture-once
  zam-observer capture-window --hwnd <decimal|0xhex>
  zam-observer snapshot-window --hwnd <decimal|0xhex> --output <path.png>
  zam-observer sample-window --hwnd <decimal|0xhex> [--frames <n>] [--interval-ms <n>]
  zam-observer replay --input <path|-> [--output <path|->]
  zam-observer validate --input <path|-> [--output <path|->]"
    );
}

#[derive(Debug)]
struct HwndOptions {
    hwnd: u64,
}

impl HwndOptions {
    fn parse(args: Vec<String>) -> Result<Self, String> {
        let mut hwnd = None;
        let mut index = 0;

        while index < args.len() {
            match args[index].as_str() {
                "--hwnd" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--hwnd requires a value".to_string())?;
                    hwnd = Some(parse_hwnd(raw)?);
                }
                unknown => return Err(format!("unknown option '{unknown}'")),
            }
            index += 1;
        }

        Ok(Self {
            hwnd: hwnd.ok_or_else(|| "--hwnd is required".to_string())?,
        })
    }
}

#[derive(Debug)]
struct SnapshotOptions {
    hwnd: u64,
    output: PathBuf,
}

impl SnapshotOptions {
    fn parse(args: Vec<String>) -> Result<Self, String> {
        let mut hwnd = None;
        let mut output = None;
        let mut index = 0;

        while index < args.len() {
            match args[index].as_str() {
                "--hwnd" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--hwnd requires a value".to_string())?;
                    hwnd = Some(parse_hwnd(raw)?);
                }
                "--output" => {
                    index += 1;
                    output = args.get(index).map(PathBuf::from);
                }
                unknown => return Err(format!("unknown option '{unknown}'")),
            }
            index += 1;
        }

        Ok(Self {
            hwnd: hwnd.ok_or_else(|| "--hwnd is required".to_string())?,
            output: output.ok_or_else(|| "--output is required".to_string())?,
        })
    }
}

#[derive(Debug)]
struct SampleOptions {
    hwnd: u64,
    frames: usize,
    interval_ms: u64,
}

#[derive(Debug)]
struct WatchForegroundOptions {
    session_id: String,
    samples: usize,
    interval_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ForegroundFingerprint {
    hwnd: u64,
    process_name: String,
    title: String,
    privacy_paused: bool,
}

impl ForegroundFingerprint {
    fn from_window(window: &zam_observer::WindowInfo) -> Self {
        Self {
            hwnd: window.hwnd,
            process_name: window.process_name.clone(),
            title: window.title.clone(),
            privacy_paused: window.privacy.is_paused(),
        }
    }
}

impl WatchForegroundOptions {
    const DEFAULT_SAMPLES: usize = 20;
    const MAX_SAMPLES: usize = 10_000;
    const DEFAULT_INTERVAL_MS: u64 = 1000;
    const MIN_INTERVAL_MS: u64 = 50;
    const MAX_INTERVAL_MS: u64 = 60_000;

    fn parse(args: Vec<String>) -> Result<Self, String> {
        let mut session_id = None;
        let mut samples = Self::DEFAULT_SAMPLES;
        let mut interval_ms = Self::DEFAULT_INTERVAL_MS;
        let mut index = 0;

        while index < args.len() {
            match args[index].as_str() {
                "--session" => {
                    index += 1;
                    session_id = args.get(index).cloned();
                }
                "--samples" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--samples requires a value".to_string())?;
                    samples = raw
                        .parse::<usize>()
                        .map_err(|error| format!("invalid --samples '{raw}': {error}"))?;
                }
                "--interval-ms" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--interval-ms requires a value".to_string())?;
                    interval_ms = raw
                        .parse::<u64>()
                        .map_err(|error| format!("invalid --interval-ms '{raw}': {error}"))?;
                }
                unknown => return Err(format!("unknown option '{unknown}'")),
            }
            index += 1;
        }

        let session_id = session_id
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| "--session is required".to_string())?;
        if samples == 0 || samples > Self::MAX_SAMPLES {
            return Err(format!(
                "--samples must be between 1 and {}",
                Self::MAX_SAMPLES
            ));
        }
        if !(Self::MIN_INTERVAL_MS..=Self::MAX_INTERVAL_MS).contains(&interval_ms) {
            return Err(format!(
                "--interval-ms must be between {} and {}",
                Self::MIN_INTERVAL_MS,
                Self::MAX_INTERVAL_MS
            ));
        }

        Ok(Self {
            session_id,
            samples,
            interval_ms,
        })
    }
}

impl SampleOptions {
    const DEFAULT_FRAMES: usize = 5;
    const MAX_FRAMES: usize = 300;
    const DEFAULT_INTERVAL_MS: u64 = 1000;
    const MIN_INTERVAL_MS: u64 = 50;
    const MAX_INTERVAL_MS: u64 = 60_000;

    fn parse(args: Vec<String>) -> Result<Self, String> {
        let mut hwnd = None;
        let mut frames = Self::DEFAULT_FRAMES;
        let mut interval_ms = Self::DEFAULT_INTERVAL_MS;
        let mut index = 0;

        while index < args.len() {
            match args[index].as_str() {
                "--hwnd" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--hwnd requires a value".to_string())?;
                    hwnd = Some(parse_hwnd(raw)?);
                }
                "--frames" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--frames requires a value".to_string())?;
                    frames = raw
                        .parse::<usize>()
                        .map_err(|error| format!("invalid --frames '{raw}': {error}"))?;
                }
                "--interval-ms" => {
                    index += 1;
                    let raw = args
                        .get(index)
                        .ok_or_else(|| "--interval-ms requires a value".to_string())?;
                    interval_ms = raw
                        .parse::<u64>()
                        .map_err(|error| format!("invalid --interval-ms '{raw}': {error}"))?;
                }
                unknown => return Err(format!("unknown option '{unknown}'")),
            }
            index += 1;
        }

        if frames == 0 || frames > Self::MAX_FRAMES {
            return Err(format!(
                "--frames must be between 1 and {}",
                Self::MAX_FRAMES
            ));
        }
        if !(Self::MIN_INTERVAL_MS..=Self::MAX_INTERVAL_MS).contains(&interval_ms) {
            return Err(format!(
                "--interval-ms must be between {} and {}",
                Self::MIN_INTERVAL_MS,
                Self::MAX_INTERVAL_MS
            ));
        }

        Ok(Self {
            hwnd: hwnd.ok_or_else(|| "--hwnd is required".to_string())?,
            frames,
            interval_ms,
        })
    }
}

fn parse_hwnd(raw: &str) -> Result<u64, String> {
    if let Some(hex) = raw.strip_prefix("0x").or_else(|| raw.strip_prefix("0X")) {
        u64::from_str_radix(hex, 16).map_err(|error| format!("invalid --hwnd '{raw}': {error}"))
    } else {
        raw.parse::<u64>()
            .map_err(|error| format!("invalid --hwnd '{raw}': {error}"))
    }
}

#[derive(Debug)]
struct IoOptions {
    input: PathBuf,
    output: Option<PathBuf>,
}

impl IoOptions {
    fn parse(args: Vec<String>) -> Result<Self, String> {
        let mut input = None;
        let mut output = None;
        let mut index = 0;

        while index < args.len() {
            match args[index].as_str() {
                "--input" => {
                    index += 1;
                    input = args.get(index).map(PathBuf::from);
                }
                "--output" => {
                    index += 1;
                    output = args.get(index).map(PathBuf::from);
                }
                unknown => return Err(format!("unknown option '{unknown}'")),
            }
            index += 1;
        }

        Ok(Self {
            input: input.ok_or_else(|| "--input is required".to_string())?,
            output,
        })
    }

    fn reader(&self) -> Result<Box<dyn BufRead>, String> {
        if is_stdio(&self.input) {
            Ok(Box::new(BufReader::new(io::stdin())))
        } else {
            let file = File::open(&self.input)
                .map_err(|error| format!("failed to open {}: {error}", self.input.display()))?;
            Ok(Box::new(BufReader::new(file)))
        }
    }

    fn writer(&self) -> Result<Box<dyn Write>, String> {
        match &self.output {
            None => Ok(Box::new(BufWriter::new(io::stdout()))),
            Some(path) if is_stdio(path) => Ok(Box::new(BufWriter::new(io::stdout()))),
            Some(path) => {
                let file = File::create(path)
                    .map_err(|error| format!("failed to create {}: {error}", path.display()))?;
                Ok(Box::new(BufWriter::new(file)))
            }
        }
    }
}

fn is_stdio(path: &Path) -> bool {
    path.as_os_str() == "-"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_sample_window_defaults() {
        let options = SampleOptions::parse(vec!["--hwnd".to_string(), "0x2a".to_string()])
            .expect("sample options");

        assert_eq!(options.hwnd, 42);
        assert_eq!(options.frames, SampleOptions::DEFAULT_FRAMES);
        assert_eq!(options.interval_ms, SampleOptions::DEFAULT_INTERVAL_MS);
    }

    #[test]
    fn parses_sample_window_overrides() {
        let options = SampleOptions::parse(vec![
            "--hwnd".to_string(),
            "42".to_string(),
            "--frames".to_string(),
            "3".to_string(),
            "--interval-ms".to_string(),
            "250".to_string(),
        ])
        .expect("sample options");

        assert_eq!(options.hwnd, 42);
        assert_eq!(options.frames, 3);
        assert_eq!(options.interval_ms, 250);
    }

    #[test]
    fn rejects_unbounded_sample_window_runs() {
        let error = SampleOptions::parse(vec![
            "--hwnd".to_string(),
            "42".to_string(),
            "--frames".to_string(),
            "0".to_string(),
        ])
        .unwrap_err();

        assert!(error.contains("--frames must be between"));
    }

    #[test]
    fn rejects_too_fast_sample_window_runs() {
        let error = SampleOptions::parse(vec![
            "--hwnd".to_string(),
            "42".to_string(),
            "--interval-ms".to_string(),
            "1".to_string(),
        ])
        .unwrap_err();

        assert!(error.contains("--interval-ms must be between"));
    }

    #[test]
    fn parses_watch_foreground_defaults() {
        let options =
            WatchForegroundOptions::parse(vec!["--session".to_string(), "session-1".to_string()])
                .expect("watch foreground options");

        assert_eq!(options.session_id, "session-1");
        assert_eq!(options.samples, WatchForegroundOptions::DEFAULT_SAMPLES);
        assert_eq!(
            options.interval_ms,
            WatchForegroundOptions::DEFAULT_INTERVAL_MS
        );
    }

    #[test]
    fn parses_watch_foreground_overrides() {
        let options = WatchForegroundOptions::parse(vec![
            "--session".to_string(),
            "session-1".to_string(),
            "--samples".to_string(),
            "3".to_string(),
            "--interval-ms".to_string(),
            "250".to_string(),
        ])
        .expect("watch foreground options");

        assert_eq!(options.samples, 3);
        assert_eq!(options.interval_ms, 250);
    }

    #[test]
    fn rejects_watch_foreground_without_session() {
        let error = WatchForegroundOptions::parse(vec![]).unwrap_err();

        assert!(error.contains("--session is required"));
    }

    #[test]
    fn formats_unix_time_as_utc_rfc3339_millis() {
        assert_eq!(format_unix_time_millis(0, 0), "1970-01-01T00:00:00.000Z");
        assert_eq!(
            format_unix_time_millis(1_609_459_200, 42),
            "2021-01-01T00:00:00.042Z"
        );
        assert_eq!(
            format_unix_time_millis(1_709_164_800, 999),
            "2024-02-29T00:00:00.999Z"
        );
    }
}
