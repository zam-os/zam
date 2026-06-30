# Observer: Next Steps

> Status: 2026-06-20
>
> Branch: `feat/windows-ui-observer-proposal`
>
> Phase 0: **complete**

## Current State

### Phase 0 — shipped

- **Screen capture**: `Windows.Graphics.Capture`, resize handling, reused staging texture
- **UI Automation**: HWND-scoped subtree; focus, dialog, toggle, selection, invoke; COM handlers for text-change and structure-change; `SetWinEventHook` for foreground/focus; local OCR fallback for unnamed elements
- **Raw Input**: clicks, scroll, shortcuts, aggregated typing activity (never characters)
- **Unified watch**: 3-thread architecture (capture + UIA + input), MPSC channel, atomic privacy pause; `--event-driven` mode; monotonic session start/stop sequences
- **Privacy**: password managers, banking, private browsing; custom policy via `ZAM_OBSERVER_PRIVACY_POLICY`; password-field text events dropped
- **Replay engine**: `UiSensorEvent` → `UiObservationReport` (deterministic, LLM-free)
- **Session integration**: `zam bridge start-session --context ui`, `observe-ui-watch`, `end-session`; desktop links watch to ZAM UI sessions; `prepareSessionSynthesis` reads UI reports when `execution_context === "ui"`
- **Desktop**: Tauri watch lifecycle (start/status/stop), observer panel, reports polling via bridge; sidecar prepare fixed to use native release binary
- **Vision path**: `observe-ui-snapshot` for PNG → `UiObservationReport` with `candidateTokens` (requires LLM)
- **CI/CD**: x64 + ARM64 observer builds
- **Tests**: 58 Rust + 214 TypeScript, all green

### Deferred (not blocking release)

| Criterion | Notes |
|-----------|-------|
| 30-minute stability soak | Skipped for this release |
| CPU overhead benchmark (<5% at ~1 FPS) | Skipped for this release |

### Known gap

Deterministic replay reports have **empty `candidateTokens`**, so UI session synthesis produces no candidates unless vision snapshots populate tokens. See Priority 1 below.

---

## Priority 1: Phase 1 — deterministic observer (2–4 weeks)

### 1.1 Tray indicator

Persistent system-tray icon while watch is active: session name, event count, pause/stop. Required by the main proposal MVP.

### 1.2 Activity segmentation

Group raw events into meaningful segments:

- idle / AFK via heartbeat + input silence threshold
- app switch as segment boundary
- dialog open/close as segment boundary

### 1.3 Synthesis candidates from deterministic reports

Bridge the learning gap without requiring vision on every frame:

- match report actions/summaries to registered token slugs (pattern-based, like shell command matching), or
- populate `candidateTokens` in replay from session watch directives

### 1.4 Event-driven capture tuning

`trigger_capture()` and `--event-driven` are implemented; validate storage/CPU savings vs heartbeat-only mode.

---

## Priority 2: Vision integration (4–8 weeks)

### 2.1 Provider-neutral frame/clip adapter

`analyzeFrames` / `analyzeClip` with OpenAI-compatible baseline.

### 2.2 Model benchmarking

Eval set: File Explorer, browser form, Windows Settings. Models: MiMo-V2.5, MiMo-VL, Gemini Flash-Lite, Qwen VL.

### 2.3 Coordinate scaling

Downscale keyframes to 1024×768 before vision requests (~60–70% token savings).

### 2.4 Cost controls

Per-session budget, no vision during idle, event-driven analysis only.

---

## Priority 3: Open-source integrations (ongoing)

See [`observer-open-source-research.md`](observer-open-source-research.md) for the full table. Highlights:

- PII detection (regex → ONNX)
- Per-provider privacy policy
- Trajectory export (CUA-compatible evaluation)
- Deeper UIA tree reads
- OmniParser-style grounding field
- `uiautomation-rs` / capture-library migration (deferred)

---

## Priority 4: Synthesis and live guidance (8+ weeks)

- Watch directives from session agent (expected outcomes, candidate slugs)
- Reports → reviewable synthesis candidates with user confirmation before FSRS
- Live intervention on repeated errors or help-seeking

---

## Phase 0 Acceptance Metrics

| Criterion | Target | Status |
|-----------|--------|--------|
| No persisted keystroke text | 0 leaks | Done |
| Event vocabulary in log | click, shortcut, app change, dialog, UIA events | Done |
| Schema-valid reports | replay → valid JSONL | Done |
| Live reports in kernel | `observe-ui-watch` + session synthesis | Done |
| ARM64 build | CI green | Done |
| 30-minute stability | no crash | Deferred |
| CPU overhead | <5% at ~1 FPS | Deferred |

---

## Sources

- [`windows-ui-observer-proposal.md`](windows-ui-observer-proposal.md) — architecture and delivery plan
- [`observer-open-source-research.md`](observer-open-source-research.md) — merged open-source research (formerly MiMo + Agy)