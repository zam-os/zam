# ZAM 0.11.0 — Companion context and honest evaluators

ZAM 0.11.0 makes the Companion's learning context explicit: every ZAM surface
now shows exactly **who** is learning and **which agent or model** checks the
answers — and the labels are guaranteed to match what actually happens.

## Highlights

- **Compact context bar** on Recall, Graph, Settings, and Studio: collapse
  control and title on the left, **Agent** and **User** pills on the right.
  The permanent "Connected to zam mcp" status row is gone; version info moved
  to the title tooltip, and errors appear inline next to the affected content.
- **Honest Agent pill.** The pill names the concrete evaluator — e.g.
  "Copilot: Claude Sonnet 5" or "Quick mode — no agent" — never a generic
  host name. Configured harnesses that cannot receive an evaluation (Claude
  Code, Codex, OpenCode, Goose — no MCP sampling relay yet) appear disabled
  with the reason. An unavailable selection never silently falls back to a
  different model.
- **The pill drives evaluation.** Selecting "Quick mode — no agent" really
  runs the model-free reveal-and-self-rate flow; selecting the VS Code
  language-model route really sends the answer to the shown model, with
  VS Code's own consent and quota handling.
- **Per-machine context persistence.** The selected learner, evaluator,
  VS Code model, and per-surface collapse state persist in the machine-local
  `~/.zam/config.json` — never in the shared learning database. A
  Companion-menu launch reuses your selection instead of silently falling
  back to the database default user; an agent-supplied user stays scoped to
  that session and is visibly marked.
- **"ZAM: Choose Recall Model"** command: pick which VS Code language model
  Smart Recall uses (e.g. Claude Sonnet 5 or MAI); the mounted panel
  refreshes immediately, and the bar gains a refresh button (↻) for context
  changed outside the panel.
- **Smart Recall in the VS Code Companion works again**: the sampling request
  no longer crashes on a fictitious cancellation token, and each request uses
  a real, properly disposed `CancellationTokenSource`.

## Fixes and hardening

- The Companion extension can no longer be silently downgraded by an older
  installed ZAM (`agent connect` now keeps a newer installed extension).
- The extension bundle loads safely under CommonJS (a kernel module-scope
  `createRequire(import.meta.url)` crashed activation; now lazy and shimmed,
  with a load-smoke regression test).
- A late-arriving opening context can no longer leave a panel session on the
  previous learner's queue — user/domain changes restart the session, so a
  rating can never pair one user with another user's card.
- Switching learner or evaluator asks before discarding a typed, unsubmitted
  answer, and reloads against the new context.
- `~/.zam/config.json` writes are atomic (temp file + rename), companion
  fields write in one batch, and context assembly no longer re-probes every
  harness config on every call (30 s memoization) or issues serial database
  round trips.
- Opening Recall/Graph/Settings/Studio never fails outright on a transient
  database error — the panel opens with a degraded, observable context
  (`companionContextDegraded`) instead.

## For agent authors

- New app-only MCP tool `zam_companion_context` (read/write) carries the
  shared context contract: learner profiles, configured harness inventory,
  evaluator routes with `configured`/`routable`/`selected`/`active` states
  and reasons, and per-surface collapse state. The opening tools return the
  resolved `companionContext` for first paint.
- Explicit `user` arguments on `zam_open_recall`/`zam_show_graph`/
  `zam_open_settings`/`zam_open_studio` are session-scoped: they never
  overwrite the learner's persisted Companion selection.

See ADR `docs/adr/2026-07-16-companion-context-and-harness-affinity.md` for
the architecture and `docs/plans/2026-07-16-companion-context-0.11.0.md` for
the phased implementation and live-verification record.
