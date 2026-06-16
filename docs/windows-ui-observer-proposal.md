# Windows 11 UI Observer Proposal

> Status: Phase 0 implementation started
>
> Scope: Windows 11 on x64 and ARM64
>
> Research snapshot: 2026-06-15

## Goal

Extend ZAM's observation model beyond the shell so that a learner can be
assessed while using ordinary Windows applications with mouse, keyboard, and
visible UI content.

The proposed design uses two logical agents:

1. The **session agent** owns the learning session, conversation, knowledge
   plan, interventions, and final ratings.
2. The **observer agent** continuously turns native Windows signals and short
   visual sequences into structured evidence for the session agent.

The observer is a logical agent with a stable protocol. It must not depend on a
particular host product having a persistent "subagent" feature.

## Core Decisions

### 1. Separate sensing from teaching

The observer agent does not speak to the learner and does not update FSRS
state. It reports observations and candidate interpretations. The session agent
decides whether to intervene and confirms ratings through the existing session
synthesis path.

This keeps the observer cheap, replaceable, and unable to silently alter
learning state.

### 2. Do not stream the full desktop to the main agent

The Windows process maintains a short local ring buffer and emits sparse,
structured reports. Video or frame sequences are sent to a vision model only
when an event or uncertainty justifies it.

Typical triggers are:

- active application or window changed;
- click, shortcut, or submit action;
- dialog, notification, or error appeared;
- UI Automation focus or state changed;
- a step appears complete;
- the observer is uncertain about the last action.

### 3. Prefer semantic signals over pixels

Pixels are necessary, but they are the most expensive and privacy-sensitive
signal. The observer should combine:

- Windows UI Automation events and element properties;
- foreground window, process, and window lifecycle events;
- mouse and keyboard event metadata;
- screen-change metadata;
- selected keyframes or short clips.

This gives the model both "what changed" and "what it looked like."

### 4. Treat screen content as untrusted input

Text visible on screen can contain prompt injection. The observer model may
describe it, but it cannot issue tools, modify the session, or instruct the
session agent. Reports use a closed JSON schema and are explicitly treated as
untrusted evidence.

## Proposed Architecture

```text
Learner
  |
  v
Windows applications
  |
  +--> UI Automation / window events --------+
  +--> mouse and keyboard metadata ----------+--> zam-observer.exe
  +--> Windows.Graphics.Capture frames ------+      |
                                                    | local filtering,
                                                    | redaction, ring buffer
                                                    v
                                             Observer model worker
                                                    |
                                                    | structured reports
                                                    v
                                      observation JSONL / local named pipe
                                                    |
                                                    v
                                              ZAM bridge/kernel
                                                    |
                                                    v
                                              Session agent
```

### Process placement

`zam-observer.exe` runs as a normal per-user process in the interactive Windows
session, launched and supervised by the ZAM desktop application. It must not be
a Windows service because services run outside the interactive desktop and
cannot reliably observe the signed-in user's UI.

The observer should be a native Rust sidecar next to the existing Tauri
application. The repository already builds Windows artifacts for:

- `x86_64-pc-windows-msvc`
- `aarch64-pc-windows-msvc`

The same source should be compiled natively for both targets. No x64 emulation
should be required on ARM64.

## Windows Signal Collection

### Screen capture

Use `Windows.Graphics.Capture` as the first implementation:

- it captures a selected display or application window;
- Windows provides an explicit system picker and capture indicator;
- frames arrive as Direct3D 11 surfaces;
- it works with GPU-side resizing and conversion before CPU readback.

Product decision: the MVP defaults to one user-selected window. This minimizes
accidental exposure while the privacy model is still young. The start flow
should therefore be:

1. ZAM asks the learner to start screen observation.
2. Windows shows the system capture picker.
3. The learner selects the application window for the current task.
4. ZAM shows a persistent tray/status indicator naming the selected window and
   offers an obvious pause/stop action.

Full-display capture can be added later for tasks that cannot be expressed as a
single-window exercise. The first live sensor should observe exactly one window
at a time.

`Desktop Duplication API` is a possible later backend. Its dirty and move
rectangles are useful for efficient change detection, but it is a worse default
for user trust because capture can be less explicit. Keep capture backends
behind an interface.

```rust
trait ScreenCaptureBackend {
    fn start(&mut self, target: CaptureTarget) -> Result<()>;
    fn next_frame(&mut self) -> Result<Option<CapturedFrame>>;
    fn stop(&mut self);
}
```

The capture worker receives frames continuously but retains only:

- a low-rate background sample, initially 1-2 FPS;
- a short burst around important events, initially 4-8 FPS;
- a 30-60 second in-memory ring buffer;
- keyframes whose visual difference exceeds a threshold.

Raw video is not written to disk by default.

### UI semantics

Use Windows UI Automation as the primary semantic channel. Subscribe to:

- focus changes;
- invoked elements;
- selection and toggle changes;
- text-change notifications without storing the entered text;
- structure changes;
- opened and closed windows.

For the focused element, capture a bounded property set such as control type,
automation ID, accessible name, bounding rectangle, enabled state, and password
state. Do not recursively dump an application's full automation tree.

UI Automation coverage is uneven, especially in custom-rendered applications.
The visual channel remains the fallback.

### Mouse and keyboard

Use Raw Input on a dedicated message-loop thread for background mouse and
keyboard metadata. Low-level hooks should be reserved for gaps that Raw Input
cannot fill and must hand work to a worker immediately.

Default keyboard policy:

- record key timing and categories, not typed characters;
- preserve explicit shortcuts such as `Ctrl+S` or `Alt+Tab`;
- never reconstruct free text;
- suppress all keyboard evidence when a password element is focused;
- mark injected input separately when the API exposes that information.

Mouse reports should contain button, wheel direction, timestamp, cursor
position, and the UI Automation element at the click point when available.
High-frequency pointer motion is aggregated into gestures rather than logged
point by point.

### Window context

Track the foreground window, executable name, process ID, title, bounds, and
virtual desktop/display. Window titles must pass through the privacy filter
before persistence or model submission.

## Observer Event Contract

The first implementation can mirror shell monitoring: append events to a
per-session JSONL file and expose them through the bridge. This avoids a schema
migration while the contract is still changing.

```ts
interface UiObservationReport {
  version: 1;
  sessionId: string;
  sequence: number;
  observedFrom: string;
  observedTo: string;
  kind:
    | "progress"
    | "step-completed"
    | "error"
    | "help-seeking"
    | "uncertain"
    | "privacy-pause"
    | "heartbeat";
  application: {
    processName: string;
    processId?: number;
    windowTitle?: string;
  };
  summary: string;
  actions: Array<{
    type: "click" | "shortcut" | "typing" | "scroll" | "window-change";
    target?: string;
    result?: string;
  }>;
  evidence: Array<{
    type: "uia" | "keyframe" | "clip" | "window";
    ref: string;
    redacted: boolean;
  }>;
  candidateTokens: Array<{
    slug: string;
    confidence: number;
    rationale: string;
  }>;
  confidence: number;
}
```

Reports should be incremental. The observer must not repeatedly narrate an
unchanged screen. A heartbeat reports health and capture state without visual
content.

### Session-agent interaction

The bridge should eventually expose:

```text
observer start --session <id> --target picker
observer status --session <id>
observer stop --session <id>
bridge get-observations --session <id> --after <sequence>
bridge inspect-observation --session <id> --sequence <n>
bridge observe-ui-snapshot --session <id> --sequence <n> --image <path.png> \
  --observed-from <iso> --observed-to <iso> --process-name <name> --write-log
```

The session agent may also send a narrow watch directive:

```json
{
  "sessionId": "...",
  "watchFor": [
    "user creates a new folder",
    "user resolves the validation error"
  ],
  "candidateTokenSlugs": ["..."],
  "expiresAt": "..."
}
```

The observer receives candidate tokens and expected outcomes, but not permission
to rate them.

## Model Strategy

### Provider-neutral adapter

The sensor pipeline should support two visual request shapes:

1. `analyzeFrames`: ordered keyframes plus event metadata.
2. `analyzeClip`: a short encoded video plus event metadata.

Frame sequences are the portability baseline. Native video input is an
optimization, not a requirement for the observer contract.

```ts
interface ObserverModel {
  analyzeFrames(request: FrameObservationRequest): Promise<UiObservationReport>;
  analyzeClip?(
    request: ClipObservationRequest,
  ): Promise<UiObservationReport>;
}
```

Every provider must return the same validated JSON schema. Invalid or overly
confident output is downgraded to `uncertain`.

### Routing tiers

Use the cheapest adequate path:

1. **No model:** deterministic UI Automation and input-event aggregation.
2. **Cheap visual pass:** analyze changed keyframes and recent actions.
3. **Temporal escalation:** analyze a 5-20 second clip when order and causality
   matter.
4. **Session-agent review:** send only the structured report and selected
   evidence references to the main agent.

### Initial model candidates

| Candidate | Role | Current assessment |
|---|---|---|
| Xiaomi MiMo-V2.5 | Cloud multimodal candidate | Xiaomi describes it as multimodal. Before adoption, ZAM still needs a verified API contract, video limits, price, EU availability, retention policy, and structured-output reliability. Do not hard-code it as the default yet. |
| Xiaomi MiMo-VL-7B-RL-2508 | Local or controlled-server research baseline | Open weights, explicit image/video support, and strong GUI grounding results make it relevant. A local 7B deployment still requires hardware-specific measurement; do not assume acceptable latency on ordinary ARM64 laptops. |
| Gemini 2.5 Flash-Lite | Low-cost cloud baseline | Native video input and published pricing make cost experiments reproducible. Google currently lists $0.10 per million text/image/video input tokens and $0.40 output tokens. |
| Qwen3-VL-Flash | Low-cost cloud alternative | Official documentation lists video understanding, GUI-related capabilities, and a Frankfurt/EU service option. It should be benchmarked for German UI text, JSON reliability, and data handling. |

MiMo-V2.5 should be in the benchmark from the beginning, but model selection
must be evidence-driven. A cheap model that misses errors or invents completed
steps is not cheap for a learning system.

### Cost control

Do not analyze an uninterrupted one-hour desktop recording as one request.
Instead:

- analyze only changed intervals;
- use low-resolution frames for routing and high-resolution crops for text;
- cache stable application context;
- cap clips per minute;
- stop visual calls during idle periods;
- enforce a configurable per-session and per-hour budget.

For scale, Google's documented video tokenization is approximately 100 tokens
per second at low media resolution and 300 at default resolution. At the
published Gemini 2.5 Flash-Lite input price, one continuously analyzed hour is
roughly $0.036 at low resolution or $0.108 at default resolution, before output
tokens. Event-triggered analysis should consume a fraction of that.

The benchmark should report measured cost per active hour rather than relying
only on list price.

## Privacy and Safety

Screen observation is materially more sensitive than shell history. The
following are MVP requirements, not later polish:

- explicit start and stop controls;
- a persistent tray indicator while observation is active;
- per-session selection of one window through the Windows picker;
- process and title allowlists/denylists;
- automatic pause for password managers, authentication dialogs, banking
  applications, private browsing, and UI Automation password fields;
- no raw keystroke text;
- in-memory raw-frame retention by default;
- redaction before any cloud request;
- a local audit showing what was sent to which provider;
- configurable deletion of derived evidence;
- cloud processing disabled until the user selects a provider and accepts its
  data boundary.

Windows secure-desktop content, including many UAC prompts, should be treated as
unobservable. The observer reports a gap instead of trying to bypass it.

### Prompt-injection boundary

The observer model:

- has no tools;
- cannot send user-visible messages;
- cannot change cards or sessions;
- cannot follow instructions found in captured content;
- emits only schema-validated observations;
- attaches confidence and evidence to every completion or error claim.

The session agent must treat the report as fallible sensor data, not as an
instruction.

## Integration with ZAM

The existing concepts already fit the design:

- sessions use `execution_context = "ui"`;
- JSONL observation logs parallel the existing shell monitor;
- session synthesis remains the only path from evidence to a confirmed rating;
- accepted ratings continue to update cards, review logs, session steps,
  prerequisite blocking, and synthesis audit atomically.

The UI analyzer will eventually need evidence features beyond shell commands:

- expected UI state reached;
- error or validation message observed;
- repeated attempts at the same action;
- help or documentation opened;
- long hesitation before a decisive action;
- action undone and corrected;
- step completed without assistance.

The first UI observer should generate synthesis candidates, not automatic final
ratings.

## Delivery Plan

### Phase 0: replayable sensor fixture

- Build `zam-observer.exe` with native x64 and ARM64 CI jobs.
- Capture one user-selected window through the Windows picker.
- Collect UI Automation, window, and input metadata.
- Write redacted JSONL and an in-memory frame ring.
- Add a replay format so model development does not require live capture.

Implemented foundation:

- standalone Rust crate in `observer/`;
- versioned `UiSensorEvent` and `UiObservationReport` JSONL contracts;
- deterministic replay and validation commands;
- Windows-only `pick-window` command backed by `GraphicsCapturePicker`, returning
  selected-window metadata without starting capture;
- first-frame capture and PNG snapshot commands for a selected or explicit
  top-level window;
- TypeScript report parsing in the ZAM kernel;
- OpenAI-compatible vision snapshot adapter in the CLI layer;
- `zam bridge observe-ui-snapshot` for turning a PNG keyframe into a validated
  `UiObservationReport`;
- append/read support for UI observation session JSONL via
  `appendUiObservationReport` and `zam bridge get-observations`;
- native x64 and ARM64 observer CI builds;
- release-resource preparation for the Tauri package;
- Tauri commands for observer probe and window selection.

The remaining Phase 0 work is to turn one-shot frame capture into a live frame
source, then add UI Automation, Raw Input, privacy filtering, and the frame ring
around it.

### Phase 1: deterministic observer

- Segment activity into action groups without an LLM.
- Emit application changes, clicks, shortcuts, dialogs, and idle periods.
- Add privacy pauses and the tray indicator.
- Validate CPU, memory, recovery, and ARM64 behavior.

### Phase 2: model-backed observer agent

- Add the provider-neutral frame/clip adapter.
- Benchmark MiMo-V2.5, MiMo-VL, Gemini Flash-Lite, and Qwen VL.
- Emit structured progress, error, completion, and uncertainty reports.
- Enforce cost and request-rate budgets.

### Phase 3: ZAM synthesis

- Give the observer task-specific watch directives and candidate token slugs.
- Convert reports into reviewable synthesis candidates.
- Require session-agent or user confirmation before FSRS updates.

### Phase 4: live guidance

- Allow the session agent to intervene on repeated errors or explicit help
  requests.
- Keep silent shadowing as the default.

## Acceptance Criteria for the First PoC

- Native Windows 11 x64 and ARM64 binaries.
- One selected window can be observed for 30 minutes without a
  crash.
- No typed text or password-field content is persisted.
- Active application changes, clicks, common shortcuts, and dialogs appear in
  the event log.
- The observer produces schema-valid reports from a recorded replay.
- The session agent can consume reports without receiving raw continuous video.
- Re-running synthesis is idempotent and no observer report directly updates a
  card.
- CPU, memory, latency, and cloud cost are measured on both architectures.

## Evaluation Dataset

Create a small consented replay suite of ordinary non-development tasks, for
example:

- create and rename folders in File Explorer;
- format a document in a common office application;
- upload a file through a browser form;
- correct an invalid form field;
- change a Windows setting;
- organize photos;
- use keyboard-only navigation for the same task.

Each replay should label action boundaries, expected completion, visible errors,
help-seeking, and privacy-sensitive intervals. Compare models on:

- step segmentation F1;
- completion precision;
- error-detection recall;
- unsupported-confidence rate;
- median report latency;
- cost per active hour;
- German UI-text accuracy;
- x64 versus ARM64 sensor overhead.

## Open Questions

1. When should ZAM escalate from single-window observation to full-display
   observation?
2. How long may derived keyframes survive after the session?
3. Which cloud regions and provider contracts are acceptable for personal and
   organizational deployments?
4. Should evidence artifacts be encrypted with Windows DPAPI, or should the MVP
   avoid disk artifacts entirely?
5. What confidence threshold permits a rating candidate without requesting
   additional evidence?
6. Which UI tasks form the minimum benchmark before a provider can become the
   default?

## References

- Microsoft, Windows screen capture:
  https://learn.microsoft.com/windows/apps/develop/media-authoring-processing/screen-capture
- Microsoft, Desktop Duplication API:
  https://learn.microsoft.com/windows/win32/direct3ddxgi/desktop-dup-api
- Microsoft, UI Automation events:
  https://learn.microsoft.com/windows/win32/winauto/uiauto-eventsoverview
- Microsoft, Raw Input:
  https://learn.microsoft.com/windows/win32/inputdev/raw-input
- Microsoft, low-level keyboard hooks:
  https://learn.microsoft.com/windows/win32/winmsg/lowlevelkeyboardproc
- Xiaomi MiMo homepage:
  https://mimo.xiaomi.com/
- Xiaomi MiMo-VL repository:
  https://github.com/XiaomiMiMo/MiMo-VL
- Google Gemini video understanding:
  https://ai.google.dev/gemini-api/docs/video-understanding
- Google Gemini pricing:
  https://ai.google.dev/gemini-api/docs/pricing
- Alibaba Cloud Qwen visual understanding:
  https://help.aliyun.com/zh/model-studio/vision
- Alibaba Cloud model pricing:
  https://help.aliyun.com/zh/model-studio/model-pricing
