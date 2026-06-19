# Observer Open-Source Research

> Status snapshot: 2026-06-20
>
> Branch: `feat/windows-ui-observer-proposal`
>
> Replaces the former `MiMo-OpenSource-Research-Proposal.md` and
> `Agy-OpenSource-Research-Proposal.md`.

## Purpose

ZAM's Windows UI observer is unique in combining deterministic replay, FSRS
session synthesis, and explicit privacy pauses. Several open-source projects
solve adjacent problems well. This document records what we can learn from them,
what is already implemented in Phase 0, and what remains for later phases.

## Reference Projects

| Project | Focus | Relevance to ZAM |
|---------|-------|------------------|
| [Screenpipe](https://github.com/screenpipe/screenpipe) | Event-driven capture + accessibility tree + AI | Capture triggers, PII, per-provider privacy |
| [ActivityWatch](https://github.com/ActivityWatch/activitywatch) | Activity tracking + event buckets | Heartbeat / AFK detection |
| [PyWinAssistant](https://github.com/a-real-ai/pywinassistant) | UIA-first GUI perception | Deeper accessibility tree reads |
| [CUA (trycua)](https://github.com/trycua/cua) | Computer-use agent + trajectories | Trajectory export for benchmarking |
| [Selfspy](https://github.com/selfspy/selfspy) | Input monitoring, encrypted-at-rest | Metadata-only input patterns |
| [Anthropic Computer Use](https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo) | Screenshot → vision pipeline | Coordinate scaling before vision |
| [OpenAdapt](https://github.com/OpenAdaptAI/openadapt-desktop) | Desktop process recorder + ML adapter | Time-aligned screenshot + input + UIA persistence |
| [ShowUI](https://github.com/showlab/ShowUI) | Lightweight VLA for GUI | Semantic action-trace preparation |
| [Microsoft OmniParser](https://github.com/microsoft/OmniParser) | Screenshot → interactive element list | Grounding export format |

## Learning Points and Implementation Status

| # | Learning point | Source | Phase 0 status | Next step |
|---|----------------|--------|----------------|-----------|
| 1 | Event-driven capture triggers (UIA/input/window change → keyframe) | Screenpipe, Agy | **Done** — `trigger_capture()`, `--event-driven`, `SetWinEventHook` in `uia.rs` | Tune heartbeat vs trigger balance under load |
| 2 | Accessibility tree as primary signal (not pixels) | Screenpipe, PyWinAssistant | **Partial** — focus/dialog/toggle/selection/invoke/text/structure events; HWND-scoped subtree | Deeper child traversal (toolbar, list items) |
| 3 | PII detection before vision | Screenpipe | **Not started** — rule-based process/title privacy only | Regex PII pass, then optional local ONNX model |
| 4 | Heartbeat-based AFK / idle detection | ActivityWatch | **Partial** — `heartbeat` reports exist; no explicit AFK state | Mark long idle gaps as `idle`, not `progress` |
| 5 | Trajectory recording for evaluation | CUA, OpenAdapt | **Partial** — JSONL reports + optional keyframe dir | Standardized trajectory export format |
| 6 | Coordinate scaling before vision requests | Anthropic CU | **Not started** | Downscale keyframes to 1024×768 in `observe-ui-snapshot` |
| 7 | Per-provider data permissions | Screenpipe | **Not started** — global privacy policy only | Per-provider rules in bridge before vision calls |
| 8 | Windows-native OCR for unnamed UIA elements | Agy, MiMo | **Done** — `OcrEngine` fallback in `focused_element_from()` | Benchmark latency on x64 and ARM64 laptops |
| 9 | `SetWinEventHook` instead of polling-only UIA | Agy, MiMo | **Done** — foreground/focus hooks + polling fallback | Measure cross-app reliability |
| 10 | Safe UIA COM wrapper (`uiautomation-rs`) | Agy | **Deferred** — hand-rolled COM handlers work today | Revisit if COM threading issues appear |
| 11 | Capture library migration (`windows-capture`, `CrabGrab`) | Agy | **Deferred** — custom D3D11 loop is stable | Migrate when macOS capture is planned |
| 12 | OmniParser-style grounding export | Agy, OmniParser | **Not started** | Optional `grounding` field on `UiObservationReport` |
| 13 | OpenAdapt-style modular capture/ML split | OpenAdapt | **Partial** — observer sidecar + bridge vision adapter | Keep boundary; avoid monolith |
| 14 | ShowUI-style demonstration traces | ShowUI | **Not started** | Useful once vision-backed step segmentation lands |

## Libraries and Native APIs

| API / library | Role | Status |
|---------------|------|--------|
| `Windows.Graphics.Capture` | Window capture | **In use** — custom D3D11 staging loop |
| `Windows.Media.Ocr.OcrEngine` | Local OCR fallback | **In use** — `uia.rs` |
| `SetWinEventHook` | Foreground/focus notifications | **In use** — `uia.rs` |
| Raw Input (Win32) | Clicks, scroll, shortcuts, typing counts | **In use** — `raw_input.rs` |
| UI Automation COM handlers | Invoke, text, structure events | **In use** — `uia.rs` |
| `wineventhook` crate | Ergonomic event hooks | **Not adopted** — direct Win32 calls instead |
| `windows-capture` | Capture abstraction | **Not adopted** |
| `CrabGrab` | Cross-platform capture | **Not adopted** |
| `uiautomation-rs` | Safe UIA wrapper | **Not adopted** |

## ZAM Differentiators (keep)

These are not generic screen recorders; they are core product choices:

1. **Luminance-based change detection** — efficient keyframe retention vs blind interval capture
2. **Raw Input metadata** — shortcuts and typing counts without character content
3. **Hard privacy pauses** — password managers, banking, private browsing stop capture immediately
4. **Structured `UiObservationReport` schema** — actions, evidence, candidate tokens
5. **Deterministic replay engine** — sensor events → reports without LLM dependency
6. **FSRS session synthesis path** — UI reports feed the same review flow as shell sessions

## Prioritized Roadmap (post–Phase 0)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | Tray indicator during active watch | Low | Medium — user trust (proposal MVP) |
| P1 | Activity segmentation (app switch, dialog, idle) | Medium | High |
| P1 | Synthesis candidates without vision (`candidateTokens` gap) | Medium | High — learning value from deterministic reports |
| P2 | Coordinate scaling for vision | Low | Medium — token cost |
| P2 | Trajectory export format | Medium | Medium — model benchmarking |
| P2 | Per-provider privacy policy | Medium | Medium |
| P2 | Deeper UIA tree reads | Medium | Medium |
| P3 | Local PII model (ONNX) | High | High |
| P3 | OmniParser grounding export | Low | Medium |
| P3 | Capture library migration | Medium | Low until macOS |

## Open Questions

1. How reliable are UIA Invoke/TextChanged events across common Windows apps?
2. Is `Windows.Graphics.Capture` behavior identical on ARM64?
3. How should multi-monitor setups scope to a single watched HWND?
4. Should UAC / secure-desktop prompts hard-pause observation?
5. Is element-level OCR fast enough for real-time polling on ordinary hardware?
6. Should trajectory export be CUA-format compatible?

## References

- Delivery plan: [`windows-ui-observer-proposal.md`](windows-ui-observer-proposal.md)
- Next work: [`observer-next-steps.md`](observer-next-steps.md)
- Screenpipe: https://github.com/screenpipe/screenpipe
- ActivityWatch: https://github.com/ActivityWatch/activitywatch
- PyWinAssistant: https://github.com/a-real-ai/pywinassistant
- CUA: https://github.com/trycua/cua
- Anthropic Computer Use: https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo
- OpenAdapt: https://github.com/OpenAdaptAI/openadapt-desktop
- OmniParser: https://github.com/microsoft/OmniParser