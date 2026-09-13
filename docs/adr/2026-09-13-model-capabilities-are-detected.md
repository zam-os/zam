# Model Capabilities Are Detected, Not Chosen

**Status:** Accepted — 2026-09-13\
**Date:** 2026-09-13\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-12](2026-07-12-unified-capability-model-registry.md) ·
[2026-07-12a](2026-07-12a-agent-backed-ai-provider.md) ·
[2026-07-31](2026-07-31-cross-platform-voice-mode.md)

---

## Context

The unified model registry (ADR 2026-07-12) treats capabilities as a wish the
user ticks in the editor, which a probe then shrinks: `validateModelSave`
stored `userSelected ∩ detected`, and the Settings UI rendered every capability
as a checkbox — disabled-but-visible for anything the probe had not found.

Three field reports broke that model:

1. **Detection aged badly.** Vision was inferred from model-name substrings
   (`gpt-5`, `mimo`, `-vl`, …). `openai/gpt-5.6-luna` passed on the bare
   `gpt-5` substring while `z-ai/glm-5.3-flash` and
   `deepseek/deepseek-v4.1-flash` — vision-capable per OpenRouter's own catalog
   metadata — matched no hint, so every re-probe unchecked the learner's Vision
   box. Name lists cannot keep up with provider catalogs that already declare
   the truth.
2. **The flow asked the wrong question.** A learner configuring a model cannot
   know whether it supports vision, video, or speech — the endpoint knows.
   Offering undetectable capabilities as greyed-out checkboxes made the UI
   advertise what the endpoint lacked and hid what it had.
3. **Re-probing could only shrink.** Because a stored capability was the
   user's selection, a probe that *widened* what the endpoint serves (a
   provider enabling video input, a newly listed vision sibling) could never
   switch the capability on — the user had to notice and re-enable it by hand.

Separately, `video` input has existed in the kernel capability set since the
registry was introduced but was deliberately unofferable in the UI until
something consumed it. Direct video analysis (screen recordings, learner
observation) is now a planned Observer improvement, and models such as
GLM-5.3-Flash accept video input cheaply via OpenRouter — so the modality
needs to be visible and storable, distinct from `image`.

## Decision

**Capabilities are detected, not chosen.** The probe decides what a row *is*;
the learner decides only what a row is *used for*.

1. **Detection is metadata-first.** When an endpoint publishes per-model
   architecture metadata (OpenRouter's `architecture.input_modalities`), it
   overrides the name heuristics in both directions: a catalog that declares
   `image` marks the row vision-capable, one that declares text-only marks it
   not. Name hints remain only as the fallback for endpoints that publish no
   metadata (OpenAI, most local runners). `video` is detected exclusively from
   declared metadata — no name heuristic, because a false positive on a
   modality this rare would store a row that fails at first use.
2. **The overview shows only detected capabilities, freely toggleable.**
   Undetected modalities are not rendered at all (no greyed-out checkboxes).
   Toggling stays available directly on the row — no edit dialog.
3. **Newly detected capabilities switch on.** The probe merge rule
   (`mergeProbeCapabilities`) is: detected **and** previously detected → keep
   the user's toggle; detected but **new** since the last probe → on; no
   longer detected → off. One guard keeps caller intent intact: a
   *never-probed* row that still carries selected flags is acting on its
   caller's explicit selection — the guided setups (Ollama vision → image
   only, Foundry text → text only) and `model-upsert --capabilities` — and
   that selection is honored instead of flooded. Only a row saved with no
   selection at all (the manual editor sends none) starts with everything
   the endpoint offers enabled. Note the manual editor path itself: a fresh
   Foundry row typed by hand has no selection, so a name-hinted `image`
   *is* auto-enabled under this rule — that is the decision working as
   written, and the learner can toggle it off in the overview.
4. **The editor no longer offers capability checkboxes.** Saving probes and
   applies rule 3; `model-upsert` callers that pass `--capabilities` keep
   their meaning as the user-selection input to the merge (rule 3's guard).
5. **`video` is a first-class capability from this release on, displayed and
   stored separately.** "Vision" remains `image` and keeps its current
   meaning — the Observer reads frames. Nothing consumes `video` yet; it is
   stored so the planned Observer screen-recording/learner-observation work
   can select for it without a registry migration. A model with video input
   (e.g. GLM-5.3-Flash) shows the capability as soon as a probe finds it.
6. **The probe also determines the reasoning-effort setting.** The evaluation
   sends `reasoning: { effort }` to OpenRouter endpoints; whether a model
   honors that control is not visible in catalog metadata (GLM-5.3-Flash
   lists `reasoning_effort` yet rejects `none` with "Reasoning is mandatory").
   The probe therefore makes one tiny chat call — the second documented
   functional exception — storing the lowest level the endpoint accepts:
   `none` when the control is honored, `minimal` when the model mandates
   reasoning (it keeps reasoning, bounded — reasoning is not harmful, and the
   learner-facing policy is lowest acceptable effort). No verdict (other
   statuses, network errors) leaves the stored setting untouched, and the
   evaluation's 400 retry remains the safety net for rows probed before this
   existed. The endpoint cache signature includes the stored level so a
   re-probe takes effect immediately.
7. **The probe verifies the stored API key when the provider publishes a
   key-metadata endpoint** (OpenRouter `/auth/key`; one authenticated GET, no
   tokens consumed). This closes the blind spot that let a broken 29-character
   key paste sit unnoticed on a row whose `keyState` said "set": the catalog
   the probe otherwise reads is public, so it cannot tell a working key from
   a rejected one. The verdict is stored on the row (`keyValid`) and shown in
   the overview ("API key invalid"); 401/403 are definitive, every other
   outcome is no verdict, and the save is **not** blocked — the row stays
   editable so the fix is a re-paste, not a dead end. Rows without their own
   credential are never checked.
8. **The recall chain recovers from failures the health check cannot see —
   without ever starting a local runtime as a side effect.** Readiness is
   ensured **lazily, per attempt**: the chain resolver returns the raw
   fallback chain network-free, and the walk checks one row just before
   calling it (online, key accepted via the provider's key-metadata endpoint
   where one exists, model in the catalog), memoized for 60 s. A healthy
   primary therefore pays exactly one health check — no eager full-chain
   sweep, and Foundry/Ollama rows are never started for a check they never
   needed (the previous eager check loaded Foundry models for fallback rows
   that a healthy primary made unreachable). The walk covers the **full**
   fallback depth and falls through to the next row on 401 (rejected key),
   402 (exhausted credit), 403 (forbidden), and 429 (upstream capacity).
   **Boundary (owner decision, 2026-09-13): a cloud primary never falls
   through to a local model** — a fallback that starts a local runtime costs
   gigabytes of RAM the learner did not ask to spend mid-review, and a local
   row placed behind cloud rows is there despite that preference, not for
   fallback duty. Local rows are excluded from a cloud primary's chain
   entirely (not even health-checked); a **local** primary keeps its cloud
   fallback, the direction the guided setups document. Any other error
   propagates, and an exhausted chain raises the original failure.

## Consequences

- A re-probe can only *widen* what the learner sees to use; it can silently
  disable a capability only when the endpoint genuinely stopped offering it.
- Model-name hint lists are no longer load-bearing for cloud endpoints; they
  degrade gracefully for runners without metadata.
- The registry rows gain `video` flags over time as models are re-probed; no
  schema or migration change (flags are JSON), and no behavior reads `video`
  yet — consumers arrive with the Observer video work.
- Callers that pass explicit `--capabilities` keep that selection on fresh
  rows; they are not flooded by newly detected capabilities.

---

## Notes

- Probe merge: `src/cli/llm/capability-probe.ts` (`mergeProbeCapabilities`,
  `classifyCapabilities`, `probeReasoningEffort`).
- Metadata source: `getAvailableModelEntries` (`src/cli/llm/client.ts`),
  reading OpenRouter's `architecture.input_modalities`.
- Evaluation consumes the stored level via `endpoint.effort`
  (`evaluateAnswerViaLLM`); the reasoning control is still only ever sent to
  OpenRouter URLs. Evaluation and discussion walk the resolved chain
  (`resolveRecallEndpointChain`) and fall through on auth/capacity failures;
  readiness is ensured lazily per attempt (decision 8), including the
  cloud-primary/ local-fallback boundary.
- UI: overview rows render detected capabilities only; the editor form dropped
  its capability section (`desktop/src/main.ts`). HTTP rows show the stored
  effort level in their meta line.
