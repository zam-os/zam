---
type: architecture
title: Local AI Runtimes
description: Local text and image generation is offered only on accelerated hardware - Foundry Local for text, Ollama for images - because CPU generation is too slow to review with; embeddings are the exception and run on any machine.
tags:
  - llm
  - local
  - setup
  - windows
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/local-ai-runtimes.md"
timestamp: 2026-08-02T20:55:00Z
---

ZAM can serve its `text`, `image`, and `embedding` roles from the learner's own
machine — but only where that is actually usable. The setup lives in Settings as
three cards, each showing its state and offering one action; the learner never
types a model identifier. The bridge commands behind those cards exist for
agents and the desktop shell, not as the normal way through setup.

# The governing rule: accelerated, or not offered

Generation on a CPU is fast enough to finish and too slow to review with, and a
review experience slow enough to be annoying produces **no reviews at all**. So
the guided setup for `text` and `image` is offered only where the machine has an
NPU, a discrete GPU, or Apple Silicon. Elsewhere the cards state the reason and
point at a cloud model.

`supportsLocalGeneration(acceleration)` is the single predicate. It is enforced
in three places so no surface can route around it:

- `setupFoundryLocalForZam` — refuses before touching Foundry
- `enableLocalVision` — refuses before touching Ollama or pulling a model
- `zam bridge local-llm-hints` — will not recommend a local runner

Settings disables the card's button and shows `local_ai_no_accelerator`. Adding
a model by hand through the AI provider editor still works: the gate is on the
guided path, not on the capability.

**Embeddings are deliberately exempt.** `embeddinggemma:300m` runs on any
machine, because nothing waits on it — semantic search happens in the
background, not in the middle of a card.

# Two runtimes, split by what each one serves

| Role | Runtime | Model | Default endpoint | Gated |
| --- | --- | --- | --- | --- |
| `text` | Foundry Local | best accelerated catalog entry | `http://127.0.0.1:5273/v1` | yes |
| `image` | Ollama | `qwen3-vl:4b` | `http://localhost:11434/v1` | yes |
| `embedding` | Ollama | `embeddinggemma:300m` | `http://localhost:11434/v1` | no |

The split is by capability, not preference. Foundry Local is the runtime with
first-party accelerated builds for the Windows NPUs ZAM targets, so it serves
text. Its OpenAI-compatible service does not reliably accept image input, so it
does not serve vision. Foundry keeps port 5273 precisely so Ollama's
conventional 11434 stays free; the two run side by side.

A learner who enables everything therefore installs two runtimes — a real cost,
accepted because the alternative is an image role that fails when used.

## Why Ollama's native endpoint, not its OpenAI shim

`requestOllamaVisionDraft` posts to `/api/chat`, not `/v1/chat/completions`. The
native endpoint takes image bytes directly and honours `think: false`. Through
the compatible endpoint, Qwen3-VL can spend the entire response budget in a
private reasoning field and return empty `content` — unusable for an observer
that requires structured output. Images travel as base64 in the request's
`images` array; the vision layer carries `{ bytes, mime }` per frame so each
endpoint materializes them in the shape it wants.

A registry entry left by the preview-era "Foundry Local Vision" setup has its
`image` capability cleared when the Ollama path is chosen. An image transport
known not to work must not survive as a silent fallback.

# Choosing a Foundry model without asking the learner

`foundry model list --output json` reports the catalog *this machine* has.
`chooseFoundryRecommendations` keeps only builds whose reported `device` is
`Npu` or `Gpu`, then prefers `phi-3.5-mini`, `qwen3.5-2b-text`, or
`qwen3.5-0.8b`, falling back to the first accelerated entry.

Selection is by the device Foundry reports rather than by a hardcoded alias
list, so a machine that gains an accelerated build picks it up without a code
change. **A catalog holding only CPU builds yields no recommendation** — that is
the honest answer, not a defect.

How thin the accelerated slice actually is, measured on a Snapdragon X machine
against Foundry Local 0.10.2: **43 catalog entries, of which 42 are CPU builds
and exactly one is NPU** (`phi-3.5-mini`). All three preferred aliases exist
there, but `qwen3.5-2b-text` and `qwen3.5-0.8b` are CPU builds — so the device
filter, not the alias order, is what does the work.

There is **no second attempt on a CPU build**. If the accelerated candidate's
execution provider is unavailable — the common Qualcomm case, where QNN is
missing or the driver is wrong — Foundry's load failure is reported as-is and
nothing is downloaded. A compact CPU model would make setup *look* successful
while producing the experience that stops the learner reviewing.

Catalog ids carry a variant suffix (`phi-3.5-mini-instruct-qnn-npu:2`) that the
HTTP service does not accept. `foundryHttpModelId` strips the trailing `:<n>`;
the stripped form is what lands in the registry, and it matches what the running
service advertises on `/v1/models`.

Installation is guided on Windows only, through winget
(`Microsoft.FoundryLocal`). Other platforms say so rather than pretending. A
freshly installed `foundry` not yet on the process PATH produces an explicit
"restart ZAM, then retry".

# No implicit downloads — but inspection does start the daemon

Two entry points, separated by who is asking:

- **`getFoundryLocalStatus`** inspects. It **never downloads**, so opening a
  settings page cannot consume bandwidth.
- **`prepareFoundryEndpoint`** starts the service and loads an
  already-downloaded model. It runs only on a call about to *use* the model —
  recall, text, and vision resolution — never on passive status checks.

Inspection is **not** free of side effects, despite reading like it should be.
Measured against Foundry Local 0.10.2:

| Command | Starts `foundrylocald` |
| --- | --- |
| `foundry server status` | no |
| `foundry model list` | **yes** |
| `foundry cache list` | **yes** |

Every `model` and `cache` subcommand starts the daemon, and the catalog is what
the recommendation needs — so there is no daemon-free route to it through
Foundry's CLI. Opening Settings starts a local background service. Stopping it
is `foundry server stop`.

A visible artefact of this: `getFoundryLocalStatus` runs `server status` and
`model list` concurrently, so the *first* call after a cold start typically
reports `running: false` while itself causing the daemon to come up; a second
call reports `running: true`.

`ensureFoundryModelLoaded` refuses a model that is not cached rather than
fetching it, so a review cannot unexpectedly consume several gigabytes.
Downloads happen only in the explicit setup action the learner clicked.

When preparation fails, the endpoint is treated as offline so the **next
configured provider in `order` still gets its turn**. Both the `server` and the
preview-era `service` command groups are attempted, and the first error is the
one reported.

# What the runtime is inferred from

`detectRunner` in `client.ts` resolves `foundry` from the runner hint (`foundry`
or `foundry-local`) or from port 5273, checked before the generic port
heuristics. `generic` is now a separate kind rather than the bucket Foundry fell
into, so a Foundry endpoint gets `foundry server start` instead of
`ollama serve`.

# Hardware classification is an allowlist

`classifyLocalAiHardware` is a pure function over a fingerprint (platform, arch,
processor name, accelerator names, GPU names):

| Classification | Acceleration | `recommendedRunner` | `recommendedModel` |
| --- | --- | --- | --- |
| `snapdragon-x` | `npu` | `generic` (Foundry) | `phi-3.5-mini-instruct-qnn-npu` |
| `ryzen-ai` | `npu` | `fastflowlm` | `qwen3.5:4b` |
| `apple-silicon` | `gpu` | `ollama` | `qwen3.5:4b` |
| `discrete-gpu` | `gpu` | `ollama` | `qwen3.5:4b` |
| `unsupported` | `none` | `generic` | `qwen3.5:4b` |

It answers **"does ZAM have a supported accelerated route on this machine"**,
not "does this machine contain an accelerator". An Intel AI Boost NPU classifies
as `unsupported`: the silicon is present, ZAM has no accelerated route for it,
and saying so sends the learner somewhere that works.

**Integrated graphics do not count.** The GPU allowlist matches discrete parts
only — `nvidia`, `geforce`, `rtx`, `gtx`, `quadro`, `tesla`,
`radeon rx|pro|vii`, Intel Arc — and deliberately does not match
`Intel UHD Graphics`, `Iris Xe`, the bare `AMD Radeon(TM) Graphics` name an
integrated part reports, or the `Qualcomm(R) Adreno(TM) X1-45 GPU` a Snapdragon
X laptop carries. An iGPU shares memory and bandwidth with the CPU and lands in
the same too-slow band.

NPU classifications take precedence over a discrete GPU, so a machine with both
keeps its pre-GPU-detection behaviour. Whether that ordering is right is an open
question recorded in the ADR, not a settled one.

GPU names come from `Win32_VideoController` on Windows and `nvidia-smi` on
Linux — the one Linux probe that is present exactly when the driver is, which is
why Linux detection is NVIDIA-only. Probing shells out to WMI on Windows and can
take well over five seconds on a cold runner, so tests exercising
`getSystemProfile` need a generous timeout; the pure classifier keeps the
interesting cases testable without paying that cost.

`hasRyzenNPU` now means what its name says — it was previously true for any
detected Windows NPU except on ARM64, which made it wrong on Intel.
`localAiHardware` is the field new code should read.

# Detecting a multimodal model by name

Foundry labels its multimodal Qwen family `qwen3.5-*` and suffixes the text-only
siblings `-text`. The capability probe therefore treats `qwen3.5-` as a vision
hint **unless** the id contains `-text`. `validateModelSave` still stores the
intersection of what the learner ticked and what the probe confirmed, so a
name-based hint alone never grants a capability.

# Setup surface

| Command | Effect |
| --- | --- |
| `foundry-local-status` | inspect; adds `hardware`, `acceleration`, `accelerated` |
| `foundry-local-setup --role text` | gated; install/start/download/load, then register |
| `local-vision-status` | Ollama install, server, model, registry, acceleration, usability |
| `local-vision-setup` | gated; pull `qwen3-vl:4b` if needed and register it |
| `embedding-status` / `embedding-enable` | the same pair for semantic search, ungated |

A successful setup registers the model and moves it to the front of the registry
with `promoteModelToPrimary`, which renumbers `order` so the remaining entries
stay deterministic fallbacks. Explicitly setting up a local model is a choice to
use it, so it becomes the primary candidate.

Status is reported as separate facts — `accelerated`, `ollamaInstalled`,
`serverOnline`, `modelPresent`, `registered`, `usable` — so a surface names the
first thing the learner has to fix rather than the last thing that failed.
Neither vision nor embedding setup installs or starts Ollama; the card offers
the download link first, then the one-click setup once the service runs.

Settings copy ships in English and German; further locale packs fall back to
English until native review.

# Citations

- [ADR 2026-08-02 — Local Generation Only on Accelerated Hardware](../adr/2026-08-02-foundry-local-and-hardware-classification.md)
- [ADR 2026-07-12 — Unified Capability Model Registry](../adr/2026-07-12-unified-capability-model-registry.md)
- [ADR 2026-05-30b — Hardware Setup and Agent Distribution](../adr/2026-05-30b-hardware-setup-and-agent-distribution.md)
- [bridge-protocol.md](bridge-protocol.md)
- Tests: `tests/cli/foundry-local.test.ts`, `tests/cli/local-vision.test.ts`, `tests/cli/llm-vision.test.ts`, `tests/cli/embedder.test.ts`, `tests/kernel/system.test.ts`, `tests/desktop/i18n-completeness.test.ts`
- Code: `src/cli/llm/foundry-local.ts`, `src/cli/llm/foundry-local-setup.ts`, `src/cli/llm/local-vision.ts`, `src/cli/llm/local-embedding.ts`, `src/cli/llm/vision.ts`, `src/cli/llm/client.ts`, `src/cli/llm/capability-probe.ts`, `src/cli/llm/model-registry.ts`, `src/kernel/system/profiler.ts`, `src/cli/commands/bridge.ts`, `desktop/src/main.ts`
