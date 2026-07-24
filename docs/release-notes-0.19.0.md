# ZAM 0.19.0 — guided first run

Installing ZAM now ends in a working, populated setup without opening a
terminal. The desktop app's **first start walks through eight short pages** —
who you're learning as, your AI model, your agent, your workspace, your first
learning content and goal — each skippable, each resumable, nothing ever
trapped behind a modal (ADR 2026-07-24).

## Highlights

- **Multi-page, resumable onboarding.** A machine-local first-run gate opens
  the guided flow: welcome/language → persona → AI model → agent → workspace →
  first content → first goal → done. Every page can be deferred; "Run setup
  again" in Settings reopens it. Completion is machine-local — a shared
  database is never stamped by one machine's setup.

- **Four start personas (ADR §2).** Pupil / student / employee / free learner.
  The persona seeds a knowledge context and picks which import path leads on
  the content page — a default, never a lock: every path stays visible and
  reachable for every persona, in the flow and from Learning Content.

- **Cloud model connect with enforced privacy (ADR §5).** The model page
  connects OpenRouter (default `xiaomi/mimo-v2.5`): deep links to create a key
  and add the $5 minimum credit (money movement stays the user's own action),
  key verification against `/auth/key`, and **every** OpenRouter request ZAM
  ever sends carries `data_collection: "deny"` + `zdr: true` — enforced
  centrally at the HTTP layer, not per call site. Local runtimes stay
  first-class; capable hardware (Ryzen NPU / Apple Silicon) gets a
  copy-only hint.

- **Semantic search as a one-click local enhancement (ADR §5a).** With Ollama
  installed, one click pulls EmbeddingGemma and registers the embedding role;
  without it, search degrades to lexical ranking — stated in search output,
  never silent. ZAM installs neither Ollama nor models unasked.

- **Agent page: detect or offer, never install (ADR §6).** Existing harnesses
  are detected live and connected idempotently. With none installed, a
  descriptor table offers Goose, OpenCode, GitHub Copilot and **Hermes** (new
  ninth connect target: `zam agent connect hermes`, YAML config writer +
  read-only gateway probe), each with its strength *and* consequence stated —
  including the agent-axis privacy caveat for free plans.

- **Workspace as regenerable infrastructure (ADR §4).** The fresh-setup
  structure (`beliefs/`, `goals/`, `skills/`, seed files) lives in one
  additive writer shared by `zam init`, the wizard, and the Studio. Missing or
  incomplete workspaces surface as repairable states with one-click repair
  that never overwrites a user-authored file; the learning database lives in
  `~/.zam`, outside every workspace.

- **Goal-driven import (ADR §3).** Name a *Lernziel*; ZAM proposes a breakdown
  one level at a time — confirm, drill deeper, or stop — writes the confirmed
  outline to `goals/<slug>.md`, and the existing import pipeline turns it into
  card proposals, each citing the goal file as `source_link`. Reachable in the
  flow and via Learning Content → Goal import.

- **Degraded modes are explicit (ADR §7).** Skipped steps become an actionable
  dashboard checklist (connect a model / connect an agent / repair workspace /
  import content) that reopens the flow at the right page; an empty deck says
  so instead of "all caught up"; the curriculum wizard's model-offline error
  links back to the model page instead of dead-ending. No agent → the Studio
  works fully and `/zam` stays off — stated, not silent.

- **Public docs tell this story.** README/README.de rewritten around
  install → open → guided setup, with the CLI as the explicit alternative;
  the zam-os.org quickstart follows in the site repo.

## Compatibility

- No database schema changes; no FSRS/scheduling changes.
- `zam init` remains the CLI equivalent and now shares the same provisioning
  and cloud-connect code paths as the wizard.
- Multi-device (server DB + mobile pairing) is unchanged and stays an optional
  upgrade in Settings — the first run is fully local.

## References

- ADR: `docs/adr/2026-07-24-first-run-onboarding.md`
- Plan: `docs/plans/2026-07-24-first-run-onboarding.md`
- PR: [#220](https://github.com/zam-os/zam/pull/220)
