# Screen Recording Observer and Local/Cloud Vision Fallbacks

**Status:** Proposed
**Deciders:** Thomas (project owner)

---

## Context

ZAM recently introduced support for UI observation over time through screen recording and video analysis (in version `0.4.2` and `0.4.3`). This allows the observer to capture a task sequence, compress/decimate idle frames using FFmpeg, and send the downsampled sequence of snapshots to a multimodal Vision LLM.

However, the initial implementation had two constraints:
1. **macOS Only:** The `start-recording` and `stop-recording` bridge commands were restricted to macOS (`darwin`) because they targeted macOS's `avfoundation` input format.
2. **Local Model Focus:** The local model initialization and frame count constraints were primarily tuned for local execution (e.g. Ollama or Microsoft Foundry Local), but did not gracefully handle or fallback to cloud vision models (like Gemini 3.5 Flash or OpenAI `gpt-4o-mini`) when local hardware is insufficient or local runners are stopped.

## Decision

1. **Extend Screen Recording to Windows (`win32`):**
   - Detect platform in `start-recording`/`stop-recording`.
   - On Windows, use FFmpeg's `gdigrab` input format (`-f gdigrab -framerate 5 -i desktop`) to record the screen.
   - Use Matroska (`.mkv`) as the intermediate file container on Windows. Since Node's `process.kill(pid)` on Windows forces unconditional termination (acting like `taskkill /F`), standard MP4 or MOV files would be corrupted. Matroska is resilient to abrupt termination and remains readable. The intermediate `.mkv` is decimated and converted to the final `-decimated.mp4` when recording stops.

2. **Enable Dynamic Cloud Vision Recommendations & Fallbacks:**
   - Detect if the active `llm.url` or `llm.vision.url` is a cloud endpoint.
   - For DeepSeek endpoints (`deepseek.com`), recommend **`deepseek-v4-flash`** as the highly efficient, low-cost API vision model.
   - For OpenRouter endpoints (`openrouter.ai`), recommend **`openrouter/free`**. The free router automatically selects an active free model with vision support, ensuring zero-cost execution without training on data.
   - For Google/Gemini endpoints, recommend **`gemini-3.5-flash`** as the default inexpensive vision model.
   - For OpenAI/Codex, recommend **`gpt-5-mini`** (or `gpt-4o-mini` as fallback) as the default inexpensive vision model.
   - For Mimo endpoints, recommend `mimo-v2.5` as the fallback.
   - Strip local-specific body options (such as Ollama's `{ options: { num_ctx: 32768 } }`) when querying cloud endpoints to prevent 400 Bad Request errors.
   - Warn/notify the user if they need to manually switch models when subagent constraints prevent dynamic model changing.

## Options weighed (Windows video capture)

| Option | Pros | Cons |
|--------|------|------|
| **gdigrab** | Built into standard FFmpeg builds on Windows; simple arguments; highly reliable for low frame rates (5 fps). | Slower at high resolutions / frame rates compared to GPU-accelerated capture. |
| **ddagrab** (Desktop Duplication) | High performance; keeps frames on GPU. | Requires D3D11 hardware device initiation; more complex filter pipelines and setup. |

For ZAM's low-fps (5 fps) observer recording, **gdigrab** is chosen for its simplicity and universal availability out-of-the-box in FFmpeg builds.

## Consequences

- Screen recording and visual observation are now fully cross-platform across macOS and Windows.
- ZAM gracefully adapts to environments without a local GPU by pointing to cost-effective or free cloud vision APIs (DeepSeek/OpenRouter/Gemini/OpenAI/Mimo).
- Cloud API requests are clean and compatible with strict upstream schema validation.
