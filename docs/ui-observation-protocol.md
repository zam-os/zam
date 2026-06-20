# UI Observation Protocol — Implementation Guide

Status: 2026-06-20
Session: ZAM Wiederholung mit 0.3.13 UI-Features
Related: [#51](https://github.com/zam-os/zam/issues/51), [#52](https://github.com/zam-os/zam/issues/52)

---

## What Was Implemented

### `zam bridge capture-ui` — DONE

Location: `src/cli/commands/bridge.ts` (after `observe-ui-snapshot`)

Captures a full-screen screenshot and returns it as base64 in the JSON output.

```bash
zam bridge capture-ui --session <id> [--output <path>] [--image <path>]
```

**Returns:**
```json
{
  "sessionId": "...",
  "imagePath": "C:\\Users\\...\\zam-capture-abc123.png",
  "base64": "<PNG base64>",
  "mimeType": "image/png",
  "capturedAt": "2026-06-20T04:43:27.592Z",
  "platform": "win32"
}
```

**Platform support:**
- Windows: PowerShell + `System.Drawing` / `System.Windows.Forms` (takes full primary screen)
- macOS: `screencapture -x`

**Build status:** Compiles cleanly (`npm run build` passes)

---

## What Works vs. What Doesn't

### Works
- `capture-ui` captures screenshots successfully on Windows
- Base64 is returned correctly and can be read by the agent
- `--image <path>` bypasses capture and returns an existing image
- Token registration, session start/end with `--context ui` all work

### Doesn't Work Yet
- **No vision analysis** — the agent (Mimo-V2.5 via Opencode) received the base64 but cannot analyze images (model limitation)
- **No window targeting** — `capture-ui` captures the entire primary screen, not a specific window. When Calculator was open, the screenshot showed the Opencode window instead (foreground problem)
- **No event-driven observation** — currently the agent asks "are you done?" and then takes one screenshot. No process launch detection, no UIA events, no delta detection

---

## Architecture — What Needs to Be Built

### 1. Window Picker

The capture must target a specific window, not the foreground. Options:

**Option A — Process name detection:**
```powershell
Get-Process -Name Calculator -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowHandle
```

**Option B — Foreground window detection (Rust sidecar already has this):**
The Rust observer has `picker.rs` which detects the foreground window. Expose this via the bridge:
```bash
zam bridge get-foreground-window  # returns {hwnd, title, processName, processId}
```

**Option C — User specifies HWND:**
```bash
zam bridge capture-ui --hwnd 12345
```

**Recommended:** Option A as default (auto-detect app window), with `--hwnd` override.

### 2. Event-Driven Observation Pipeline

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Process Monitor │────►│ App detected │────►│ Start UIA       │
│  (Get-Process)   │     │              │     │ observer        │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                           ┌───────────┴───────────┐
                                           │                       │
                                     ┌─────▼─────┐          ┌──────▼──────┐
                                     │ UIA Events │          │ On demand   │
                                     │ (cheap)    │          │ Screenshot  │
                                     └─────┬─────┘          └──────┬──────┘
                                           │                       │
                                     ┌─────▼───────────────────────▼─────┐
                                     │  Agent analyzes with multimodal   │
                                     │  LLM, suggests token ratings      │
                                     └───────────────────────────────────┘
```

**UIA Event Types (cheap to observe):**
- `AutomationElement PropertyChangedEvent` — text changes, value changes
- `InvokePattern.Invoke` — button clicks
- `ValuePattern.ValueChanged` — input field changes
- `Window.WindowOpened/WindowClosed` — window lifecycle
- `AutomationElement.AutomationFocusChangedEvent` — focus changes

**PowerShell UIA example:**
```powershell
Add-Type -AssemblyName UIAutomationClient
$root = [System.Windows.Automation.AutomationElement]::RootElement
# Find Calculator window
$condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty, "Rechner")
$calculator = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condition)
# Subscribe to events
Register-ObjectEvent $calculator PropertyChanged -Action {
    Write-Output "Property changed: $($EventArgs.Property.ProgrammaticName) = $($EventArgs.NewValue)"
}
```

### 3. App Launch Detection

Watch for process creation events:

**Option A — Polling (simple, less elegant):**
```powershell
while ($true) {
    $proc = Get-Process -Name Calculator -ErrorAction SilentlyContinue
    if ($proc) { Start-Observer -Process $proc; break }
    Start-Sleep -Milliseconds 500
}
```

**Option B — WMI Event (event-driven):**
```powershell
Register-WMIEvent -Query "SELECT * FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_Process' AND TargetInstance.Name = 'Calculator.exe'" -Action {
    Start-Observer -Process $event.TargetInstance
}
```

### 4. Screenshot Comparison (stretch)

Compare two screenshots to detect meaningful changes:
- Pixel diff (simple but noisy)
- OCR on both and compare text (more semantic)
- Feature matching (expensive, likely overkill)

---

## Files Changed in This Session

| File | Change |
|------|--------|
| `src/cli/commands/bridge.ts` | Added `capture-ui` command + `captureScreenshot()` function |
| `src/cli/commands/bridge.ts` | Added imports: `readFileSync`, `execFileSync`, `tmpdir`, `randomBytes` |
| `.agents/skills/zam/SKILL.md` | Updated Observation Levels, added `capture-ui` to CLI ref, added Approach C (UI observation) |
| `.claude/skills/zam/SKILL.md` | Copied from `.agents/` |
| `.agent/skills/zam/SKILL.md` | Copied from `.agents/` |

---

## What the Implementer Should Do Next

1. **Window targeting** — Extend `capture-ui` to accept `--process-name <name>` or `--hwnd <hwnd>` and capture that specific window instead of the full screen
2. **UIA observer bridge** — Expose the Rust observer's UIA capabilities via a bridge command, or build a TypeScript UIA observer using `System.Windows.Automation`
3. **Event loop** — Build an observation event loop that:
   - Detects app launch
   - Starts UIA observation
   - Collects cheap events
   - Calls `capture-ui` only when needed
   - Writes observation reports to session JSONL
4. **Vision model config** — Allow the user to set `llm.vision.model` to a multimodal model (e.g. `gpt-4o`, `claude-sonnet-4-20250514`, `mimo-v2.5`)
5. **Clean up `llm.vision.enabled`** — Either make it work with a real multimodal model, or default to agent-assisted vision

---

## Test Results

| Test | Result |
|------|--------|
| `zam bridge capture-ui --session test` | ✅ Returns JSON with base64 |
| `npm run build` | ✅ Clean compilation |
| PowerShell screenshot capture | ✅ Works, captures full primary screen |
| macOS screencapture | Not tested (no macOS available) |
| Vision analysis (local LLM) | ❌ Model doesn't support images |
| Vision analysis (agent multimodal) | ❌ Mimo-V2.5-Pro is text-only; Mimo-V2.5 can but no image was re-sent |
| Window targeting | ❌ Captures foreground, not target window |
