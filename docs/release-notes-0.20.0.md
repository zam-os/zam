# ZAM 0.20.0 — your subscription is the model

ZAM can now generate through an **AI agent you already pay for**. Instead of
owning the LLM call, ZAM delegates the work *through* a connected agent CLI —
so a Claude, ChatGPT, Copilot, Gemini or Grok subscription, which is OAuth-bound
to that harness and cannot be reached over HTTP, drives ZAM's question
generation, answer evaluation, curriculum import and OCR (ADR 2026-07-12a).

This is a third transport beside the existing two, not a replacement: local
runtimes and cloud endpoints stay exactly as they were.

## Highlights

- **Agent transport: eight harnesses.** Claude Code, Codex, Antigravity (`agy`),
  Grok Build, GitHub Copilot, OpenCode, Goose and Hermes each ship an outbound
  adapter driving that CLI's own documented headless mode. No API key, no new
  dependency, no secret handling — auth stays inside the harness you already
  signed in to.

- **Cheapest capable model by default.** An agent model connects with the cheap
  default for its harness (Claude Code → `haiku`, Codex → `gpt-5.4-mini`,
  Antigravity → `gemini-3.5-flash`, Copilot → `gpt-5.6-luna`, Grok →
  `grok-4.5`) so nobody burns frontier quota by accident. Any model id the CLI
  accepts can be typed in Settings instead.

- **Reasoning effort is configurable.** Harnesses that support it (Copilot
  `--effort`) get a per-model effort setting in Settings, defaulting to a
  sensible level derived from the model id. Thinking models, which pick their
  own effort, disable the control and say why.

- **Images and scans, too.** Every adapter except Goose declares image
  modality, so OCR of a photographed worksheet can run through the same
  subscription. Each harness uses its own native mechanism — `--attachment`,
  `-i`, `-f`, or workspace files via `--add-dir`. Goose, which has no
  documented image flag, rejects image work with a clear message instead of
  failing obscurely.

- **Add an agent model during first run.** The onboarding model page now lists
  detected agent CLIs alongside the cloud and local options and connects the
  chosen one as your AI model in a single step.

- **Failures name the harness.** Choosing Agent is a deliberate choice, so
  there is no silent fallback to cloud: an unavailable harness reports
  "Claude Code is offline", and readiness is a cheap executable probe rather
  than an HTTP health check. This also fixes recall jumping to a different
  model when an agent entry was ranked first.

- **Study sessions end with a summary.** One **End session** button replaces
  the pause/exit split; ending a session — or emptying the queue — shows how
  many cards were reviewed and how the ratings were spread. The old completion
  screen's full page reload is gone.

- **The AI badge keeps up with Settings.** Changing which model ranks first and
  leaving Settings now re-initializes AI immediately, so the header badge
  matches the model actually serving requests instead of lagging until the next
  session.

## Fixes

- The desktop build failed to compile after the onboarding agent card landed
  (missing `tf` import).
- The Goose and Hermes adapters returned only the last line of output, which
  discarded an evaluation's feedback prose and kept just the trailing
  "Suggested rating: N". Copilot had the same defect and was fixed earlier in
  the cycle.
- The agent-model effort dropdown showed English labels in every language,
  although the translations already shipped in all seven packs.

## Compatibility

- No database schema changes; no FSRS/scheduling changes.
- The model registry gained optional `transport`, `agentHarness` and `effort`
  fields. Existing rows have no `transport` and continue to behave as direct
  HTTP endpoints — nothing to migrate.
- Agent models are machine-local like every other registry entry: a shared
  (Turso) database is never stamped with one machine's harness setup.
- The kernel stays HTTP- and harness-agnostic; the whole agent-llm layer is
  CLI-only and lazily imported, so it never enters the eager module graph.
- Text callers not yet wired for the agent transport (beyond curriculum import
  and the recall paths) return an explicit error naming the harness rather than
  attempting a bogus HTTP call.

## References

- ADR: `docs/adr/2026-07-12a-agent-backed-ai-provider.md`
- ADR: `docs/adr/2026-07-25-shared-curated-learning-content.md`
- PRs: [#150](https://github.com/zam-os/zam/pull/150),
  [#223](https://github.com/zam-os/zam/pull/223)
