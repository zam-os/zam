# Visible AI Status in the Studio

**Status:** Proposed
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md)

---

## Context

The desktop Studio already shows the application version in the "Setup & Data"
card. It also has a top-right "Local AI" indicator, but that indicator is too
coarse:

- it implies that one local model covers all AI tasks;
- it does not show the configured model ID;
- it does not distinguish the learning-session model from the observer model;
- it does not make cloud-vs-local privacy implications visible.

For ZAM, this distinction is load-bearing. A user may reasonably want a cloud
text model for learning feedback, while keeping screenshots and video analysis
local.

## Decision

Show role-based AI status wherever the Studio shows setup/version information.

The "Setup & Data" card should display:

- **Learning model**: the active `recall` provider/model, local/cloud
  classification, enabled state, and readiness.
- **Observer model**: the active `vision` provider/model, local/cloud
  classification, enabled state, readiness, and whether cloud upload is enabled.

The bridge exposes a secret-safe provider status command that returns role
summaries from the same resolver used by the CLI. The response never includes API
keys.

The top-right status indicator remains compact, but it is no longer the only
place where model state is visible.

## Consequences

**Easier**

- Users can verify the configured LLMs in the same place they verify the app
  version.
- The recall-vs-observer distinction becomes discoverable.
- Accidental cloud use for visual observation is less likely.

**Harder**

- The desktop needs localized labels and bridge data for provider summaries.
- Provider status must be rendered carefully so disabled, offline, missing-model,
  unsupported-provider, and privacy-sensitive states are understandable.

## Open follow-up

0.5.0 should at least display the role configuration and expose CLI/bridge entry
points. A fuller desktop provider editor can follow once the data model has
stabilized.
