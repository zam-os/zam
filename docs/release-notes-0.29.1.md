# ZAM 0.29.1 — Cloud AI that finishes a card, and progress you can see

0.29.0 made the iPad a real app. A few field-test problems followed: automatic
answer grading stalled on a slow reasoning model, semantic search asked
OpenRouter for an embedding model that was no longer in the catalogue, and the
progress tab showed numbers without bars. This release fixes those and makes
the cloud model something you can change in one step.

## Cloud AI: a better default, and a real choice

Connecting an OpenRouter key still covers answer feedback, photo import, and
semantic search from one paste. What changed:

- **Default chat model is GPT-5.6 Luna** — fast, multimodal, and suitable for
  short evaluation JSON. The previous default (`xiaomi/mimo-v2.5`) often spent
  its whole output budget thinking and never returned a grade.
- **You pick the model.** Settings › AI lists recommended OpenRouter models
  (Luna, Gemini 2.5 Flash Lite, Qwen3.7 Flash, …) and **Other model…** for any
  OpenRouter id. Switching does not require pasting the key again.
- **Evaluation turns thinking off** (`reasoning.effort: none`) so Flash and
  Luna do not burn tokens before writing the verdict.
- **Broken fallbacks are quieter.** Cloud endpoints without a key are skipped
  instead of filling the error with 401s from models that were never set up on
  this device.

Former ZAM defaults on an already-connected device are upgraded quietly: if the
only chat model was still MiMo V2.5 from 0.29.0, it becomes Luna; if embeddings
still point at the retired Qwen 0.6B id, they move to the 4B model below.

## Embeddings that actually exist

OpenRouter no longer serves `qwen/qwen3-embedding-0.6b` (HTTP 404). Cloud
semantic search now uses **`qwen/qwen3-embedding-4b`**, the smallest Qwen3
embedding model still in the catalogue. Vectors stay tagged so a shared
library does not re-embed itself when desktop and mobile agree.

Local EmbeddingGemma on the desktop is unchanged.

## Progress bars on iPhone and iPad

The progress tab built desktop CSS class names that the mobile stylesheet never
defined, so many devices only showed text. Rows now use the mobile bar styles:
label, bar, card count, and study time.

## Notes

- Desktop cloud-connect registers the same chat + embedding pair as mobile, so
  a shared database resolves both roles correctly.
- OpenRouter remains the simple first path. Extra providers and hand-tuned
  endpoints stay available on the desktop model list.
- German and English copy for the new model controls ships with this release.
