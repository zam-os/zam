# On-Device AI Across Capabilities: One Preference, Honest Tiers

**Status:** Accepted — decided by Thomas, 2026-08-09, after a Pixel 9 field
observation on 0.30.0.

**Extends** [2026-07-31](2026-07-31-cross-platform-voice-mode.md), which
established the device/cloud tier model and its preference vocabulary for
speech, to every generative capability. **Fills in** the on-device slot
reserved by [2026-08-08 §6](2026-08-08-ios-standalone-app.md) and reuses the
hardware classification of
[2026-08-02](2026-08-02-foundry-local-and-hardware-classification.md).

**Related:**
[2026-07-12](2026-07-12-unified-capability-model-registry.md) ·
[2026-07-21](2026-07-21-android-companion-tauri-shell.md) ·
[2026-07-23](2026-07-23-online-only-server-db-and-mobile-gating.md) ·
[2026-08-09](2026-08-09-free-offline-learning-and-anki-interoperability.md)

---

## Context

A Pixel 9 running 0.30.0 evaluated recall answers through OpenRouter while
Gemini Nano sat unused on the same device — on Tensor silicon, where it is both
free and private. The learner could see this only because the evaluation panel
names the model that answered.

Reading the code explains it, and the explanation is worse than the symptom:

- **Nano is wired to exactly one of five capabilities.** `mobile/src/evaluate.ts`
  prefers it for answer evaluation. Card translation
  (`mobile/src/ai/translate.ts`), photo import (`mobile/src/vl-import.ts`) and
  embeddings (`mobile/src/ai/embedder.ts`) call an HTTP endpoint directly, with
  no device tier to prefer. Voice is the exception that proves the point: it
  already has one, because ADR 2026-07-31 gave it one.
- **When the device tier fails, nobody is told.** `evaluateMobileAnswer` tries
  Nano, pushes any error onto a list, and falls through to the cloud. That list
  is surfaced *only if every backend fails*. A device where Nano is unavailable,
  still downloading, or simply broken behaves exactly like a device where it
  works — minus the NPU.
- **Availability is never checked.** `on_device_llm_check_status` is bound into
  `evaluationPorts` in `mobile/src/main.ts` and called from nowhere;
  `on_device_llm_ensure_ready` has no caller at all. The AICore model download
  can therefore only happen as a side effect of the first evaluation, inside a
  review, where a learner who rates and moves on discards the result as stale.

ADR 2026-07-31 already named this failure mode for speech: *"Falling back to the
cloud without telling the learner would make the preference dishonest, which is
the one failure mode that would undermine the whole design."* Every capability
except speech is in exactly that state today.

The same session surfaced a second observation that looks unrelated and is not:
the device was **paired** and reading the shared Turso database — cards from it
could be edited — yet answers could not be evaluated until an OpenRouter key was
pasted on the phone itself.

That is the paired-device gap, and it follows from two decisions that are each
correct alone. The QR payload deliberately carries no model and no key
([2026-07-23 §5](2026-07-23-online-only-server-db-and-mobile-gating.md): nothing
a bystander can photograph, and no re-pairing after every model change), so a
paired device resolves its cloud models **only** from `ai.models.cloud` in the
shared database. And a desktop-local model — Ollama on loopback, or an agent
transport — is `local: true`, which disqualifies it by construction: a phone
cannot reach the desktop's localhost. A learner whose desktop answers from local
models therefore has a phone with *no* usable model at all, and nothing on the
phone says so.

On Android, closing exactly that gap is what the on-device tier is for. It did
not close it, for the reasons above. The two observations are one question seen
from two sides: *which model answers here, and what does this device need in
order to answer at all?*

## Decisions

### 1. One preference vocabulary, resolved per capability

The three-way preference introduced for speech becomes the vocabulary for all
generative work:

- **`device-only`** — the device tier or nothing. The strict-privacy, zero-cost
  choice; accepts that a capability may be unavailable.
- **`device-first`** — prefer the device, use the cloud when the device cannot
  serve, and **say so**.
- **`quality-first`** — prefer the cloud, accepting per-use cost and a third
  party.

Which one is the *default* is decided per capability in decision 2. It is
chosen **per capability**, not once for the app, over five capabilities:

| Capability | What it covers |
| :--- | :--- |
| `recall` | Evaluating a learner's answer during review |
| `text` | Authoring and translating card text |
| `image` | Turning a photograph into card drafts |
| `voice` | `stt` + `tts` — already governed by ADR 2026-07-31 |
| `embedding` | Vectors for semantic search |

Per capability rather than globally, because the honest answer differs per
capability *on the same device*: a Pixel 9 can evaluate an answer on-device and
cannot embed a library on-device, and one switch would have to lie about one of
them.

Resolution lives in the kernel next to the speech resolver, takes the same two
inputs (the preference plus what each tier can actually serve right now), and
returns a **tier plus a reason**. `voice` keeps its existing storage and
semantics; this ADR generalises the type rather than re-deciding speech.

### 2. The default follows what is at stake, and it is not the same everywhere

A uniform `device-first` would be the wrong default, because the capabilities do
not carry the same risk.

**Recall and voice default to `device-first`.** They run many times a day, the
learner sees the result immediately and can overrule it with their own rating,
and a weaker judgement on one card costs one card. Free, private and offline is
the right trade there, and it is the trade ADR 2026-07-31 already made.

**Card text and image import default to `quality-first`, on Luna-class models.**
Learning content is the most valuable thing in a ZAM library: a card is authored
once and reviewed for years, a mistranslated term of art or a garbled extraction
from a textbook photo is a defect that compounds every time the card comes back,
and the learner has no way to notice it later. Import is also rare compared to
review. Against material a learner will carry for years, the difference between
a small on-device model and `openai/gpt-5.6-luna` at roughly $0.10/$0.60 per
million tokens is not a saving; it is a false economy of exactly the kind ADR
2026-07-31 rejected for speech.

This is a deliberate exception to ZAM's cost-first stance on models, scoped to
content: cheap where the work is repetitive and self-correcting, good where the
output is permanent.

**`embedding` has no default to argue about** while no platform offers an
on-device embedding API — see decision 4.

These defaults are a judgement about the models of 2026, not about locality in
principle. On-device quality rises with each device generation, and the point of
decisions 1 and 4 is that moving `text` to `device-first` later is a changed
default and a changed matrix row, not a new mechanism and not another ADR.

### 3. The preference is per device and never enters the shared database

Two devices on one Turso library do not have the same silicon: a Pixel 9 with
AICore and an A15 iPad both read the same `ai.models.cloud` rows, and a stored
"prefer local" would mean opposite things on them. The preference is therefore
machine-local state — `~/.zam/config.json` on the desktop (where
`voice.enginePreference` already lives) and device-local storage on mobile
(alongside `zam.voice-engine.v1`).

This is the existing rule, not a new one: the shared database carries content
and learning state; what only one machine can be true about stays on that
machine.

### 4. A capability with no on-device implementation says so instead of offering a choice

The preference is only shown where a device tier could exist. Where it cannot,
Settings states the fact and why. As of this ADR:

| Capability | Android (AICore / ML Kit GenAI) | iOS (Foundation Models) | Desktop |
| :--- | :--- | :--- | :--- |
| `recall` | **yes** — Prompt API, text in/out | no device qualifies yet | Foundry / Ollama per ADR 2026-08-02 |
| `text` | **yes** — same Prompt API | no device qualifies yet | Foundry / Ollama per ADR 2026-08-02 |
| `image` | **no** — the Prompt API in use is text-only; image *description* is a different ML Kit feature and does not extract card structure | no device qualifies yet | Ollama per ADR 2026-08-02 |
| `voice` | **yes** — on-device `SpeechRecognizer` + platform TTS | platform speech | per ADR 2026-07-31 |
| `embedding` | **no** — ML Kit GenAI has no embedding API | no | EmbeddingGemma per ADR 2026-08-02 |

A "no" row is a statement about today's platform APIs, not a permanent one. The
matrix is data, so a new row is a data change when a platform ships the API —
the same shape ADR 2026-08-08 §6 chose for Apple Intelligence.

Apple's on-device model is **Apple's own**, reached through the Foundation
Models framework on A17 Pro / M-series hardware. The Gemini model Apple
licensed for Siri runs on Apple's Private Cloud Compute and is not an API an
app can call; it changes nothing for ZAM. No device in the field-test range
qualifies, so iOS keeps a reserved slot rather than an implementation.

### 5. A tier that could not serve is reported, never swallowed

Every capability result carries the tier that produced it and, when the
preferred tier was skipped, the reason. Surfaces show both: the evaluation panel
already names the model, and gains the reason next to it — *"Gemini Nano is
still downloading; OpenRouter answered."*

Under `device-only` a failure is a visible failure, not a silent cloud call.
Under `device-first` the cloud may answer, but never anonymously. This is the
decision that makes the other four worth anything: a preference nobody can
verify is decoration.

### 6. Device-model availability is checkable and preparable from Settings

Each capability with a device tier shows its live state — *available*,
*downloadable*, *downloading*, *unavailable on this device* — read through the
status command that already exists and is currently dead code. A **"Prepare
now"** action performs the download deliberately, on Wi-Fi, outside a review;
that is what `on_device_llm_ensure_ready` becomes.

First-use download stays possible, because `device-first` should work without a
trip to Settings. What ends is a multi-minute download starting invisibly inside
a review and being discarded when the learner rates the card.

### 7. A device with no usable model must be able to say why

Keys stay where they are. Inline storage in the `ai.models.cloud` row is what
lets a second device work without a second paste once a shared database exists,
and the QR payload stays free of secrets. Neither is the problem.

The problem is that "no model here" is currently indistinguishable from "the
model failed". Mobile AI settings gain a resolution view for the learner's own
device: the rows the shared database offers, and for each one whether **this
device** can use it — and if not, which rule excluded it (runs on the desktop
only, no key on the row, unsupported API shape, capability not claimed). Where
the answer is "nothing here can serve this capability", the screen names the
three remedies plainly: connect a cloud model **on this device**, connect one on
the desktop so the shared database carries it, or — where the platform allows —
use the device tier from decision 1.

This is the diagnosis Thomas had to perform by hand on 2026-08-09, and it is the
same view a support conversation needs. It reads only rows the learner already
owns; it never displays a key.

## Consequences

### Positive

- The capability a learner is told about is the capability that ran.
- Free, private, offline evaluation and card editing become the *normal* path on
  hardware that supports them, instead of a coincidence.
- The unused Android on-device plumbing (`checkStatus`, `ensureReady`) becomes
  reachable and testable.
- Cost drops for exactly the two most frequent operations — evaluation and card
  text — on the devices where the field test runs.
- The iOS and desktop paths get a shape to grow into without a second mechanism.
- A paired device whose desktop answers only from local models stops being
  silently AI-less: on Android it uses the NPU, and on any platform it can at
  least say what is missing.

### Negative / trade-offs

- Five capabilities × three preferences is more Settings surface than one
  switch, on the smallest screens ZAM runs on. Mitigated by hiding rows that
  have no device tier at all (decision 4), which today leaves Android with three.
- On-device quality is lower than a frontier cloud model. `device-first` will
  sometimes produce a weaker *evaluation* than 0.30.0 does — a real regression
  in output quality, deliberately traded for privacy, cost and offline
  capability, and reversible per capability by the learner. Content generation
  is explicitly exempt (decision 2), so the trade never touches the cards
  themselves.
- Content work therefore still requires a cloud model, on a device where one may
  not be configured. That is not a regression — it is today's behaviour — but
  this ADR stops it from looking like a local option exists.
- Nano's Prompt API caps output at 256 tokens; evaluation prompts already fit,
  card translation of a long card may not, and that boundary has to be measured
  per capability rather than assumed.
- Honest reporting means learners will see failures they never saw before. That
  is the point, but it will read as "this release broke something" unless the
  release notes say otherwise.

## Alternatives considered

- **One global "prefer local AI" switch.** Rejected: on every current platform
  at least one capability has no device tier, so a single switch would have to
  be silently ignored somewhere — the exact dishonesty this ADR exists to end.
- **Keep resolving automatically, without a setting.** Rejected: it is the
  current behaviour, and it produced a learner who could not tell that his NPU
  was idle.
- **Default every capability to `device-first`.** Rejected: it would apply the
  cheapest model to the most permanent artefact ZAM has. Content is authored
  once and reviewed for years; the models that write it should be the good ones
  (decision 2).
- **Put the preference in the shared database.** Rejected: heterogeneous devices
  on one library, and it contradicts the machine-local rule.
- **Implement on-device embeddings now** (MediaPipe / LiteRT with a bundled
  model). Rejected here: it means shipping and versioning a model, a second
  vector-tagging identity, and a re-embedding migration. It is a separate
  decision, not a row in this matrix.
- **Wait for Apple to expose Gemini.** Rejected on the facts: the licensed model
  serves Siri from Private Cloud Compute; the app-facing on-device API is
  Apple's own Foundation Models framework.

## Validation

Not complete until, on a Pixel 9:

1. a review with `device-first` reports Gemini Nano as the evaluating model, and
   no HTTP call leaves the device for that evaluation;
2. card translation runs on-device and reports it;
3. Settings shows a live per-capability state and "Prepare now" downloads the
   model outside a review;
4. `device-only` with the model unavailable produces a visible, actionable
   failure rather than a cloud call;
5. `embedding` and `image` show "not possible on this device" rather than a
   preference control, and card authoring and photo import run on the
   configured cloud model by default, naming it on the draft they produced;
6. a paired device whose shared database offers only `local: true` rows says so,
   naming the rule that excluded them — the case observed on 2026-08-09.

## Citations

- `mobile/src/evaluate.ts`, `mobile/src/ai/translate.ts`,
  `mobile/src/ai/embedder.ts`, `mobile/src/vl-import.ts`
- `mobile/src-tauri/src/on_device_llm.rs`,
  `mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/OnDeviceLlmPlugin.kt`
- `mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt`
- `src/kernel/recall/voice-review.ts`, `src/kernel/system/install-config.ts`,
  `src/cli/llm/cloud-providers.ts`
- `src/cli/llm/model-registry.ts`, `src/cli/llm/cloud-connect.ts`,
  `src/cli/mobile-pairing.ts`, `mobile/src/model-registry.ts`,
  `mobile/src/ai/connect.ts`
- [ML Kit GenAI — Prompt API](https://developers.google.com/ml-kit/genai/prompt)
- [Android — on-device speech recognition](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [Apple — Foundation Models framework](https://developer.apple.com/documentation/foundationmodels)
