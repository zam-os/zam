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
cargo run --manifest-path observer/Cargo.toml -- pick-window
cargo run --manifest-path observer/Cargo.toml -- capture-once
cargo run --manifest-path observer/Cargo.toml -- capture-window --hwnd 0x123456
cargo run --manifest-path observer/Cargo.toml -- \
  snapshot-window --hwnd 0x123456 --output .zam-observer/snapshot.png
```

`replay` reads `UiSensorEvent` JSONL and writes `UiObservationReport` JSONL.
Use `--input -` or `--output -` for stdin/stdout.

The replay engine provides a stable fixture boundary for developing Windows
sensor adapters and observer-model integrations independently.

`list-windows` is Windows-only. It returns visible top-level windows with HWND,
process ID, title, and bounds metadata. Use it to test capture without opening
the native picker.

`pick-window` is Windows-only. It opens the native Windows capture picker and
returns metadata for the selected window. It does not persist pixels.

`capture-once` is Windows-only. It opens the same picker, starts a capture
session for the selected window, waits for the first frame, and returns frame
metadata without persisting pixels.

`capture-window --hwnd <decimal|0xhex>` is Windows-only. It starts the same
first-frame capture for an explicit top-level window handle, which keeps picker
threading separate from capture diagnostics.

`snapshot-window --hwnd <decimal|0xhex> --output <path.png>` is Windows-only. It
copies the first captured frame back to CPU memory and writes it as an RGBA PNG.
Use this as the handoff format for local vision models.

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
With `--write-log`, the same report is appended to the session JSONL. Read it
back with:

```bash
zam bridge get-observations --session session-1 --after 0
```

The desktop dashboard includes a manual MVP panel for this path: refresh visible
windows, choose one HWND, run `Snapshot & Analyze`, and inspect the persisted
report preview and session report history. This is intentionally a one-shot
diagnostic flow before the continuous observer loop is added.
