# ZAM 0.40.0 — The model knows what it can do

Setting up an AI model used to ask the learner a question they cannot answer:
which capabilities does this model have? This release stops asking. The
endpoint is probed, what it can do is what you see, and the only choice left
is what each model is used for. Around that, the answer feedback got a lot
harder to kill: a model that insists on reasoning no longer fails the review,
a rejected key names itself instead of hiding, a failing cloud row hands over
to the next one — and a local model sitting behind the cloud is now an offline
backup rather than something that quietly loads while the cloud is fine.

Claude Code and Grok Build join the agents ZAM connects to, and an installed
coding agent can be picked as a model with one click.

## Models are probed, not configured

- **Capabilities are detected, not chosen.** The model editor no longer offers
  capability checkboxes. Saving probes the endpoint, and the overview shows
  exactly what the probe found — text, image, video, speech — each freely
  switchable so a model that also accepts images can still be kept to text
  duty. One list, one order, per-capability switches: no separate ordering
  per capability needed.
- **Vision detection reads the provider's own catalogue.** OpenRouter says
  which inputs a model accepts; ZAM now believes the catalogue over name
  guesses in both directions. Models such as GLM-5.3-Flash and
  DeepSeek-V4.1-Flash keep their image capability across re-probes, and a
  text-only sibling no longer gets vision by mistake. Video appears as its own
  capability wherever the catalogue declares it.
- **The guided setups keep their intent.** Setting up local vision registers
  an image model, setting up local text registers a text model — a probe that
  finds more no longer floods the row with capabilities the setup did not ask
  for, so the local vision model cannot take over your answer feedback.
- **The model editor is a dialog.** It used to render below the whole model
  list — off-screen with a handful of models configured. It now opens where
  you are, closes on Escape or a click outside, and prefills OpenRouter's URL;
  a list of 36 well-known endpoints (aggregators, first-party providers,
  regional variants, local runners) sits behind the URL field, and picking a
  local one flips the row to Local.
- **A wrong key paste is caught at setup.** The probe checks the stored key
  against the provider, and a rejected key shows as *API key invalid* on the
  row and in the header — instead of a healthy-looking row whose first review
  call fails.
- **Reasoning is switched off only where switching it off works.** Card
  grading wants a short answer, not a chain of thought, so the setup probe
  tries the reasoning-off setting once and stores the result. A model that
  insists on reasoning (GLM-5.3-Flash) runs with it; a model that never had a
  verdict runs with its native reasoning; nothing sends a control an endpoint
  might reject.

## Answer feedback that survives a bad day

- **Reasoning-mandatory models grade again.** A model that rejected the
  reasoning-off setting used to leave the review with no AI feedback at all,
  looking exactly like flash mode. The reveal now shows what happened in one
  plain sentence, with the technical error behind a *Details* fold — and the
  grading itself succeeds, on the desktop and on the companions alike.
- **The fallback chain does its job.** A rejected key, an empty balance, a
  refused request or a provider at capacity moves the evaluation and the
  follow-up discussion to the next configured model, all the way down the
  list — earlier only the second row ever got a turn. A healthy primary pays
  one quick check; nothing further down is touched until it is needed.
- **A local model behind a cloud model is an offline backup.** It is used only
  when no cloud model answers at all — no network, timeouts, a provider
  outage. A cloud that answers and refuses keeps it out, so a machine that is
  never offline never has gigabytes of local model pulled into memory as a
  side effect of a review; a machine without a network still reaches the
  local model its owner set up. The header, the status and the review agree
  on this.
- **Local models are called on the address they actually run at.** A local
  runtime that came back on a different port after a restart is now called
  there, not at the stale stored address.

## Agents

- **Claude Code shows as installed — and connects.** The Agents page reported
  Claude Code as missing on every machine, because the app had no workspace to
  write a project configuration into. Connecting now writes the user-level
  configuration Claude Code itself uses (`claude mcp add --scope user`), and
  the command line keeps the project scope for repositories that want to share
  the server with a team.
- **Grok Build is a connect target.** `zam agent connect grok` writes the
  server into Grok's own configuration.
- **Use an installed agent as a model.** An installed coding agent whose
  adapter can generate text gets a small *Use as model…* control on the
  Agents page — text, or text and image where the agent is multimodal — that
  creates the model without a form.

## Notes

- Existing model rows are unchanged until they are saved or re-probed;
  *Re-probe* on a row brings it onto the new detection and stores the
  reasoning verdict.
- The `zam bridge model-upsert --capabilities` selection is honoured on new
  rows; `model-list` rows carry `keyValid` and the stored `effort`.
- Local rows behind a cloud primary apply to the desktop and CLI; the
  companions keep their own tier order (on-device first, then cloud).
- Agents-page strings for the new control ship in English and German; the
  other languages fall back to English until native review.
