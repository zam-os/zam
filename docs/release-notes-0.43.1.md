# ZAM 0.43.1 — Fixes from the first team-library machine test

A patch release for everyone who installs 0.43.0, connects a Claude Code
(or another agent) model, or switches a machine to the team library.
Everything in it was found on the first machine test of the team library
on 2026-09-21 and 22. Nothing here changes the schema; installs update in
place.

## Agent models on every surface

- **Claude Code counts as ready when it is installed.** `provider-status`
  pinged the placeholder URL of an agent model and called a working Claude
  Code "offline". The Studio's AI chip and the goal import read that status,
  so they refused to propose anything while answer evaluation went through
  fine. Agent rows now report ready when the harness executable is present —
  the same verdict `ensure-llm` gives.
- **Adding a model in Settings opens the AI gate.** Saving an agent model
  whose probe succeeded, or a local Ollama / LM Studio model whose probe
  detected text, left every answer check "disabled" on a fresh library: the
  registry was written but the text-LLM gate never opened, and the Studio has
  no switch for it. A validated save now opens the gate. Vision stays a
  deliberate opt-in.
- **A dead harness no longer fails your answer.** An offline Claude Code
  failed the learner's whole evaluation even with healthy cloud rows behind
  it, while `ensure-llm` reported the same row as offline. The recall walk
  now probes agent rows the way `ensure-llm` does, treats a harness failure
  as silence, and hands over to the next configured row. A lone dead harness
  still fails loudly; ZAM invents no fallback.

## Team library

- **Goal import works after a library switch.** The workspace's default
  knowledge context is machine-local while contexts live in the library.
  After switching to the team library, the stored `work` default named a
  context the library does not have, and every token-creating operation
  failed with "Active knowledge context not found" — the Studio's goal
  import among them. When the library has exactly one context it is used;
  with several, the error lists them and points to Settings or `zam kc use`.
  Explicit names are never substituted.
- **`zam mcp` opens the team library.** The MCP transport is its own bundle,
  so the process-level registrations the CLI performs at startup — the Entra
  token supplier, the settings scope resolver and the credentials snapshot —
  never reached it, and every tool answered `ENTRA_LOGIN_REQUIRED`. Both
  entries now run one shared `registerCliProcessServices()`, so the next
  registration cannot drift between them.

## Hands-free mode

- **Completeness instead of a suggested rating.** After a smart evaluation
  the spoken block said "Suggested rating: Good" — an effort the evaluator
  cannot observe, and the one value ADR 2026-09-08 removed from every visual
  surface. It now states the coverage verdict — "Complete", or "Incomplete,
  N points missing. That is an Again." — and asks for the effort.

## Notes

- No schema change; nothing to migrate.
- Updating from 0.43.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.43.1`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
- A developer checkout that the desktop app runs from needs `npm run build`
  after pulling; a stale `dist/` reproduces exactly the "offline" symptom
  this release fixes.
