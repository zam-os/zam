use std::env;
use std::fs::File;
use std::io::{self, BufRead, BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

use zam_observer::{
    capture_once, capture_window, list_windows, pick_window, sample_window, snapshot_window,
    ObserverCapabilities, ObserverProbe, ReplayEngine, SensorEvent, UiObservationReport,
    PROTOCOL_VERSION,
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

fn print_usage() {
    println!(
        "ZAM UI observer sidecar

Usage:
  zam-observer probe
  zam-observer list-windows
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
}
