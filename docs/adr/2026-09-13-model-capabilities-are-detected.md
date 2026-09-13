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
   longer detected → off. A fresh row (nothing previously detected) starts
   with everything the endpoint offers enabled — "a new configuration is
   always fully active".
4. **The editor no longer offers capability checkboxes.** Saving probes and
   applies rule 3; `model-upsert` callers that still pass `--capabilities`
   keep their meaning as the user-selection input to the merge.
5. **`video` is a first-class capability from this release on, displayed and
   stored separately.** "Vision" remains `image` and keeps its current
   meaning — the Observer reads frames. Nothing consumes `video` yet; it is
   stored so the planned Observer screen-recording/learner-observation work
   can select for it without a registry migration. A model with video input
   (e.g. GLM-5.3-Flash) shows the capability as soon as a probe finds it.

## Consequences

- A re-probe can only *widen* what the learner sees to use; it can silently
  disable a capability only when the endpoint genuinely stopped offering it.
- Model-name hint lists are no longer load-bearing for cloud endpoints; they
  degrade gracefully for runners without metadata.
- The registry rows gain `video` flags over time as models are re-probed; no
  schema or migration change (flags are JSON), and no behavior reads `video`
  yet — consumers arrive with the Observer video work.
- Callers that pass explicit `--capabilities` on a *new* row get newly
  detected capabilities enabled on top of their selection; the registry is the
  source of truth, not the payload.

---

## Notes

- Probe merge: `src/cli/llm/capability-probe.ts` (`mergeProbeCapabilities`,
  `classifyCapabilities`).
- Metadata source: `getAvailableModelEntries` (`src/cli/llm/client.ts`),
  reading OpenRouter's `architecture.input_modalities`.
- UI: overview rows render detected capabilities only; the editor form dropped
  its capability section (`desktop/src/main.ts`).
