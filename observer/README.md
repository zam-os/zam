# ZAM Observer

`zam-observer` is the native, per-user sidecar for UI observation. The first
increment provides the provider-neutral protocol and a deterministic JSONL
replay engine. On Windows, it can also capture a user-selected or explicit
window and write a single PNG snapshot for model handoff.

## Commands

```bash
cargo run --manifest-path observer/Cargo.toml -- probe
cargo run --manifest-path observer/Cargo.toml -- \
  replay --input observer/fixtures/file-explorer-create-folder.jsonl
cargo run --manifest-path observer/Cargo.toml -- \
  validate --input observer/fixtures/file-explorer-create-folder.jsonl
cargo run --manifest-path observer/Cargo.toml -- list-windows
cargo run --manifest-path observer/Cargo.toml -- foreground-window
cargo run --manifest-path observer/Cargo.toml -- \
  watch-foreground --session session-1 --samples 20 --interval-ms 1000
cargo run --manifest-path observer/Cargo.toml -- pick-window
cargo run --manifest-path observer/Cargo.toml -- capture-once
cargo run --manifest-path observer/Cargo.toml -- capture-window --hwnd 0x123456
cargo run --manifest-path observer/Cargo.toml -- \
  snapshot-window --hwnd 0x123456 --output .zam-observer/snapshot.png
cargo run --manifest-path observer/Cargo.toml -- \
  sample-window --hwnd 0x123456 --frames 5 --interval-ms 1000
```

`replay` reads `UiSensorEvent` JSONL and writes `UiObservationReport` JSONL.
Use `--input -` or `--output -` for stdin/stdout.

The replay engine provides a stable fixture boundary for developing Windows
sensor adapters and observer-model integrations independently.

`probe` reports sidecar capabilities. On Windows, `windowContext`,
`foregroundWatch`, `liveCapture`, and `frameSampling` are true once the native
window and Graphics Capture backends are available.

`list-windows` is Windows-only. It returns visible top-level windows with HWND,
process ID, title, bounds metadata, and a privacy classification. Windows that
match the built-in privacy filter return a redacted title and
`privacy.action = "privacy-pause"`. Use it to test capture without opening the
native picker.

`foreground-window` is Windows-only. It returns the current foreground window
with the same metadata and privacy policy as `list-windows`. This is the
metadata primitive for future `ForegroundChanged` sensor events.

`watch-foreground` is Windows-only. It polls the foreground window for a bounded
number of samples and writes `UiSensorEvent` JSONL only when the window context
changes. Privacy-paused windows produce `privacy-paused` events instead of
foreground activity.

`pick-window` is Windows-only. It opens the native Windows capture picker and
returns metadata for the selected window. It does not persist pixels.

`capture-once` is Windows-only. It opens the same picker, starts a capture
session for the selected window, waits for the first frame, and returns frame
metadata without persisting pixels.

`capture-window --hwnd <decimal|0xhex>` is Windows-only. It starts the same
first-frame capture for an explicit top-level window handle, which keeps picker
threading separate from capture diagnostics. Capture is refused when the target
window is classified as a privacy pause.

`snapshot-window --hwnd <decimal|0xhex> --output <path.png>` is Windows-only. It
copies the first captured frame back to CPU memory and writes it as an RGBA PNG.
Use this as the handoff format for local vision models. The same privacy gate is
checked before any pixels are captured.

`sample-window --hwnd <decimal|0xhex>` is Windows-only. It keeps one capture
session open and returns a bounded sequence of frame metadata without writing
pixels. Use `--frames` and `--interval-ms` to exercise the live frame source and
in-memory frame ring before event triggers are wired in. Samples after the first
frame include `changed = false` when Windows did not deliver a new frame during
that interval.

The matching bridge command is:

```bash
zam bridge observe-ui-snapshot \
  --session session-1 \
  --sequence 1 \
  --image .zam-observer/snapshot.png \
  --observed-from 2026-06-16T07:00:00.000Z \
  --observed-to 2026-06-16T07:00:01.000Z \
  --process-name WindowsTerminal.exe \
  --window-title zam \
  --write-log
```

It sends the PNG to the configured OpenAI-compatible vision model and returns a
schema-validated `UiObservationReport`. Invalid model output is downgraded to an
`uncertain` report instead of letting the model define the observer contract.

Screen snapshots go to a **separate, default-off** vision endpoint — the base
`llm.*` chat model is usually text-only and cannot read images, and this opt-in
doubles as the consent gate for sending captured screen content to a provider:

```bash
zam settings set llm.vision.enabled true
zam settings set llm.vision.model <multimodal-model>   # falls back to llm.model
zam settings set llm.vision.url <endpoint>             # falls back to llm.url
```

Until `llm.vision.enabled` is `true`, `observe-ui-snapshot` refuses to run and
no image leaves the machine. The desktop UI checks this with
`zam bridge check-vision` before writing a snapshot.
With `--write-log`, the same report is appended to the session JSONL. Read it
back with:

```bash
zam bridge get-observations --session session-1 --after 0
```

The desktop dashboard includes a manual MVP panel for this path: refresh visible
windows, choose one HWND, run `Snapshot & Analyze`, and inspect the persisted
report preview and session report history. This is intentionally a one-shot
diagnostic flow before the continuous observer loop is added.

The desktop dropdown marks privacy-paused windows and keeps snapshot analysis
disabled for them. The sidecar enforces the same decision again so direct CLI or
Tauri calls cannot bypass the UI.

Custom privacy policy:

```json
{
  "allowProcesses": ["notepad.exe"],
  "denyProcesses": ["teams.exe", "slack*"],
  "denyTitleMarkers": ["payroll", "customer data"]
}
```

Set `ZAM_OBSERVER_PRIVACY_POLICY` to the JSON file path before starting the
sidecar. `allowProcesses` bypasses only custom policy rules; built-in pauses for
password managers, authentication/private-browsing, and financial contexts still
win.
