# Architecture Decision Records

Each ADR captures one significant decision: its context, the options weighed, and
the consequences. ADRs are immutable once **Accepted** — supersede with a new ADR
rather than rewriting history.

Naming: `YYYY-MM-DD-kebab-title.md`, using the **decision date**. If two decisions
land on the same day, disambiguate with a chronological letter suffix
(`YYYY-MM-DDa-…`, `YYYY-MM-DDb-…`). The filename date is canonical and never
changes; git history records edits.
Status: `Proposed` → `Accepted` → `Implemented` (or `Partially implemented`) → (`Deprecated` | `Superseded by a later ADR`).

| Date | Title | Status |
|------|-------|--------|
| [2026-03-23](2026-03-23-kernel-and-shell-observation.md) | Kernel and Shell Observation | Implemented |
| [2026-03-26](2026-03-26-personal-workflow-foundations.md) | Personal Workflow Foundations | Implemented |
| [2026-03-27](2026-03-27-stabilization-and-workflow-integrity.md) | Stabilization and Workflow Integrity | Implemented |
| [2026-05-30a](2026-05-30a-standalone-learning-session.md) | Standalone Learning Session | Implemented |
| [2026-05-30b](2026-05-30b-hardware-setup-and-agent-distribution.md) | Hardware Setup and Agent Distribution | Implemented |
| [2026-05-31a](2026-05-31a-locale-aware-active-recall.md) | Locale-Aware Active Recall | Implemented |
| [2026-05-31b](2026-05-31b-tauri-active-recall-studio.md) | Tauri Active-Recall Studio | Implemented |
| [2026-06-07](2026-06-07-release-hardening.md) | Release Hardening | Implemented |
| [2026-06-09](2026-06-09-async-database-providers.md) | Async Database Providers | Implemented |
| [2026-06-13a](2026-06-13a-automatic-session-synthesis.md) | Automatic Session Synthesis | Implemented |
| [2026-06-13b](2026-06-13b-approachable-setup-and-self-update.md) | Approachable Setup and Self-Update | Partially implemented |
| [2026-06-15](2026-06-15-kernel-polish-and-performance.md) | Kernel Polish and Performance | Proposed |
| [2026-06-20](2026-06-20-observer-permission-model.md) | Configurable Observer permission model (`ObserverPolicy`) and two-layer consent | Accepted |
| [2026-06-21](2026-06-21-code-signing-and-trusted-installers.md) | Code Signing and Trusted Installers | Proposed |
