# Local Generation Only on Accelerated Hardware: Foundry for Text, Ollama for Images

**Status:** Accepted — implemented and unit-covered; the Snapdragon X NPU path
and the discrete-GPU path await verification on hardware (see Validation).

**Extends** [2026-05-30b](2026-05-30b-hardware-setup-and-agent-distribution.md)
(hardware profiling and local-LLM configuration) and fills the `text` and
`image` slots of the registry defined in
[2026-07-12](2026-07-12-unified-capability-model-registry.md). Supersedes
nothing.

## Context

ZAM's local-AI story on Windows had two gaps that met in the same place.

**The learner had to know model identifiers.** Settings could point a role at a
local endpoint, but choosing *which* model meant knowing that this machine's NPU
wants a `qnn-npu` build while that one needs a generic CPU build. That is
exactly the bookkeeping the product principle in `CLAUDE.md` says ZAM should do
on the learner's behalf. Microsoft Foundry Local ships a per-machine catalog and
a CLI that reports it, so the information exists — ZAM just was not reading it.

**The old NPU detection promised more than it delivered.** `profiler.ts` asked
Windows for any device in the `ComputeAccelerator` class, then branched on
whether the string contained "Qualcomm". A detected NPU is not the same thing as
an accelerated inference route ZAM can drive: Intel's AI Boost NPU matched the
probe and got a recommendation ZAM had no working path for, and `hasRyzenNPU`
was true for hardware that is not AMD at all. Presence of silicon was standing
in for "we support this", and those are different claims.

Two more constraints emerged while building it.

**Foundry does not do images.** Its OpenAI-compatible service does not reliably
accept image input, and an observer that silently degrades to a transport which
cannot see the screenshot is worse than one that says it has no vision model.

**CPU generation is not a usable fallback.** The first implementation treated a
compact CPU model as the safety net for every case where acceleration was
missing or failed to load. On the target hardware that is too slow to review
with, and this is the decisive point: **a review experience slow enough to be
annoying produces no reviews at all.** The fallback did not degrade the feature
gracefully; it converted a visible failure into an invisible one, where setup
reported success and the learner quietly stopped using the product. Embeddings
are the exception — they run in the background, are not waited on, and are
perfectly fine on a CPU.

## Decisions

### 1. Local generation is offered only on accelerated hardware

The guided setup for `text` and `image` is available when the machine has an
NPU, a discrete GPU, or Apple Silicon. On CPU-only hardware the cards report why
and point at a cloud model instead of offering a button.

`supportsLocalGeneration(acceleration)` is the single predicate, enforced in
three places so it cannot be bypassed by surface: `setupFoundryLocalForZam`,
`enableLocalVision`, and the runner recommendation in
`zam bridge local-llm-hints`. The Settings cards disable their action and show
the reason.

This withholds a feature from a machine that could technically run it, which
needs justifying. The justification is that "technically runs" is the wrong bar:
the learner cannot tell in advance that local means unusable here, discovers it
only after a multi-gigabyte download, and the failure looks like ZAM being slow
rather than like a hardware limit. Naming the limit up front is the more honest
product. Adding a model by hand through the AI provider editor remains possible
— the gate is on the *guided* path, not on the capability.

Embeddings are deliberately **not** gated. `embeddinggemma:300m` on a CPU is
fine, because nothing waits on it.

### 2. No CPU fallback when an accelerated model fails to load

`setupFoundryLocal` attempts exactly one candidate. If its execution provider is
unavailable — the common Qualcomm case, where QNN is missing or the driver is
wrong — Foundry's load failure is reported as-is.

Rejecting the fallback is the same argument as §1 applied one level down: a
compact CPU model would make setup *look* successful while producing the
unusable experience. A plain failure that names the cause and points at a cloud
model is more useful than a working-but-pointless local model.

`chooseFoundryRecommendations` therefore filters the catalog to builds whose
`device` is `Npu` or `Gpu` and recommends nothing when only CPU builds exist.
Selection is by the device Foundry reports rather than by a hardcoded alias
list, so a machine that gains an accelerated build gets it without a code
change.

### 3. Hardware classification is an allowlist of supported routes

`classifyLocalAiHardware` returns `ryzen-ai`, `snapdragon-x`, `apple-silicon`,
`discrete-gpu`, or `unsupported`. It is a pure function over a fingerprint
(platform, arch, processor name, accelerator names, GPU names), which is what
makes it testable without the hardware.

`unsupported` is the honest answer for an Intel AI Boost NPU: the silicon is
there, ZAM has no accelerated route for it, and saying so routes the learner
somewhere that works. The classifier answers "does ZAM have a supported
accelerated route here", not "does this machine contain an accelerator".

**Integrated graphics do not count.** An iGPU shares memory and bandwidth with
the CPU and lands in the same too-slow band, so the GPU allowlist matches
discrete parts only (`nvidia`/`geforce`/`rtx`/`gtx`/`quadro`/`tesla`,
`radeon rx|pro|vii`, Intel Arc) and deliberately does not match
`Intel UHD Graphics`, `Iris Xe`, or the bare `AMD Radeon(TM) Graphics` name an
integrated part reports. Matching them would re-introduce exactly the path §1
and §2 exist to remove.

NPU classifications take precedence over a discrete GPU, so a machine with both
keeps the behaviour it had before GPU detection existed. Whether that ordering
is right on a box with an NPU *and* an RTX card is genuinely open — a discrete
GPU is usually the faster of the two for generation — and is left for a later
decision rather than folded into this one.

`hasRyzenNPU` now means what its name says. `localAiHardware` is the field new
code should read; `hasRyzenNPU`, `hasSnapdragonX`, and `hasAppleSilicon` remain
as derived compatibility flags.

### 4. Foundry serves text; Ollama serves images and embeddings

| Role | Runtime | Model |
|---|---|---|
| `text` | Foundry Local | machine's best accelerated catalog entry |
| `image` | Ollama | `qwen3-vl:4b` |
| `embedding` | Ollama | `embeddinggemma:300m` |

The split is by what each runtime actually serves, not by preference. Foundry
wins text on Windows because it has first-party accelerated builds for the NPUs
ZAM targets. It loses images because its service does not take them, so
`local-vision.ts` uses Ollama's **native** `/api/chat` rather than its
OpenAI-compatible shim: the native endpoint accepts image bytes directly and
honours `think: false`. Through the compatible endpoint Qwen3-VL can spend the
whole response budget in a private reasoning field and return empty `content`,
which an observer requiring structured output cannot use.

Consequence: a learner who enables everything installs two runtimes. Accepted
because the alternative is an image role that fails when used. Foundry keeps
port 5273 so Ollama's conventional 11434 stays free.

A registry entry left by the preview-era "Foundry Local Vision" setup has its
`image` capability cleared when the Ollama path is chosen. An image transport
known not to work must not survive as a silent fallback.

### 5. Foundry is started lazily, and never downloads implicitly

- `getFoundryLocalStatus` inspects. It never starts the service and never
  downloads, so Settings polling cannot spin up a service or consume bandwidth.
- `prepareFoundryEndpoint` starts the service and loads an **already-downloaded**
  model, and runs only on a call about to use the model — recall, text, and
  vision resolution, not passive status checks.

`ensureFoundryModelLoaded` refuses a model that is not cached rather than
fetching it; a review that silently pulls several gigabytes is not an acceptable
surprise mid-session. If preparation fails, the endpoint is treated as offline
so the next configured provider in `order` still gets its turn.

### 6. Setup is a Settings button, not a CLI invocation

`zam bridge foundry-local-status` / `foundry-local-setup` and
`local-vision-status` / `local-vision-setup` exist as JSON commands, but they are
the transport — the learner-facing surface is three Settings cards that each
show state and offer one action, per the "Studio-first for learner-facing setup"
principle in `CLAUDE.md`. Status is reported as separate facts
(`accelerated`, `ollamaInstalled`, `serverOnline`, `modelPresent`, `registered`,
`usable`) so a surface names the first thing to fix rather than the last thing
that failed.

Installation is guided on Windows only, via winget. Other platforms say so.

## Alternatives considered

**Keep the CPU fallback, label it clearly.** Considered and rejected: the label
does not fix the problem. A learner who is told "this will be slow" and then
experiences it still stops reviewing, and ZAM has spent a multi-gigabyte
download to get there.

**Offer local generation everywhere and let the learner judge.** Rejected for
the same reason — the judgement requires information the learner does not have
before the download, and the failure mode is silent abandonment rather than a
complaint.

**Foundry for vision too.** One runtime, one setup, one port. Rejected on
evidence: its service does not reliably accept image input. Reachable later
without redesign, since roles resolve independently.

**Ollama for text as well, dropping Foundry.** Rejected because it gives up the
NPU builds on exactly the Windows hardware this work targets.

**Probe the execution provider before choosing.** Rejected: an honest probe of
QNN availability is close to loading the model anyway, and a wrong prediction
leaves setup broken rather than merely slower. Attempt-and-report is simpler and
truthful.

**Include integrated GPUs in the allowlist.** Rejected: an iGPU is a CPU-class
result for this workload, so including it would restore the failure §1 removes.

## Consequences

- **Local text and image setup is unavailable on CPU-only machines.** This is
  the intended behaviour and the most visible change; those learners are pointed
  at a cloud model. Semantic search still runs locally for them.
- Local AI on an accelerated machine means two runtimes. Documented in Settings
  copy rather than hidden.
- `SystemProfile` gains `hasSnapdragonX`, `localAiHardware`, and
  `localAiAcceleration`; `hasRyzenNPU` narrows to AMD. Callers reading
  `hasRyzenNPU` as "has any NPU" change meaning.
- GPU detection shells out to a third Windows WMI query and, on Linux, to
  `nvidia-smi`. `getSystemProfile` was already slow enough on a cold Windows
  runner to need a generous test timeout; this adds to it. The pure classifier
  keeps the interesting cases testable without paying that cost.
- Linux gains hardware classification it did not have (previously always
  `unsupported`), limited to NVIDIA because `nvidia-smi` is the one probe
  present exactly when the driver is.
- `DEFAULT_EMBEDDING_MODEL` becomes `embeddinggemma:300m`. The canonical stored
  id (`embeddinggemma-300m`) is unchanged, so existing vectors stay valid.
- The capability probe treats `qwen3.5-*` as multimodal unless the id carries
  the `-text` suffix Foundry uses for text-only siblings.
- Settings copy ships in English and German; further locale packs fall back to
  English until native review.

## Validation

- [x] Accelerated-only recommendation covered by
      `tests/cli/foundry-local.test.ts`, including a catalog holding only CPU
      builds yielding no recommendation.
- [x] A failed accelerated load reports the error and downloads nothing —
      pinned by asserting no `model download` call is made.
- [x] Catalog id → wire id conversion (variant suffix stripping) covered by the
      same suite.
- [x] Hardware classification covered by `tests/kernel/system.test.ts` for
      Snapdragon X, Ryzen AI, Apple Silicon, NVIDIA and AMD discrete GPUs on
      Windows and Linux, the Intel AI Boost case that must be `unsupported`, and
      four integrated-graphics names that must not be mistaken for accelerators.
- [x] The vision gate covered by `tests/cli/local-vision.test.ts`: an
      unaccelerated machine is refused before Ollama is touched and before any
      model is pulled.
- [x] Settings chrome localization covered by
      `tests/desktop/i18n-completeness.test.ts`.
- [ ] End-to-end Foundry setup on a Snapdragon X device: winget install, service
      start, NPU model load, and one real recall answer.
- [ ] Discrete-GPU path exercised end to end on an NVIDIA machine. Detection is
      unit-covered; that Ollama actually reaches the GPU there is assumed, not
      shown.
- [ ] Qwen3-VL 4B observation quality against a real screenshot, compared with
      the cloud vision path. The transport is proven; the output is not.
- [ ] The NPU-over-GPU precedence in §3 revisited on a machine with both.

## Evidence

- Foundry integration: `src/cli/llm/foundry-local.ts`,
  `src/cli/llm/foundry-local-setup.ts`
- Lazy start on use: `src/cli/llm/client.ts` (`prepareFoundryEndpoint`)
- Local vision: `src/cli/llm/local-vision.ts`, `src/cli/llm/vision.ts`
- Hardware classification and the gate: `src/kernel/system/profiler.ts`
- Bridge surface: `src/cli/commands/bridge.ts`
- Settings surface: `desktop/index.html`, `desktop/src/main.ts`,
  `desktop/src/i18n.ts`
- Tests: `tests/cli/foundry-local.test.ts`, `tests/cli/local-vision.test.ts`,
  `tests/cli/llm-vision.test.ts`, `tests/kernel/system.test.ts`,
  `tests/desktop/i18n-completeness.test.ts`
