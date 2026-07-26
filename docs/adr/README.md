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
| [2026-06-15](2026-06-15-kernel-polish-and-performance.md) | Kernel Polish and Performance | Implemented |
| [2026-06-20](2026-06-20-observer-permission-model.md) | Configurable Observer permission model (`ObserverPolicy`) and two-layer consent | Accepted |
| [2026-06-21](2026-06-21-code-signing-and-trusted-installers.md) | Code Signing and Trusted Installers | Proposed |
| [2026-06-22](2026-06-22-screen-recording-observer.md) | Screen Recording Observer and Local/Cloud Vision Fallbacks | Proposed |
| [2026-06-23](2026-06-23-pluggable-providers-and-agent-harnesses.md) | Pluggable AI Providers, Agent Harnesses, and Approachable UI Setup | Proposed |
| [2026-06-25a](2026-06-25a-machine-local-llm-role-configuration.md) | Machine-local LLM Role Configuration | Superseded by 2026-07-12 |
| [2026-06-25b](2026-06-25b-visible-ai-status-in-studio.md) | Visible AI Status in the Studio | Proposed |
| [2026-06-25c](2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md) | Flexible ZAM Workspaces and Skill Wiring | Proposed |
| [2026-06-27](2026-06-27-recall-session-llm-pipeline.md) | Recall-Session LLM Pipeline (Prompt Cache & Prefetch) | Proposed |
| [2026-06-30](2026-06-30-learning-content-studio.md) | Learning Content Studio | Implemented |
| [2026-07-02](2026-07-02-lehrplanplus-import-wizard.md) | LehrplanPLUS Curriculum Import Wizard | Partially implemented |
| [2026-07-03](2026-07-03-rag-semantic-token-search.md) | RAG / Semantic Token Search on a Self-Hosted, No-License-Cost Store | Partially implemented |
| [2026-07-04](2026-07-04-human-friendly-titles-and-prefixed-domains.md) | Human-friendly Titles and Prefixed Domains for the Knowledge Graph | Implemented |
| [2026-07-04](2026-07-04-knowledge-contexts.md) | Knowledge Contexts: Work, School, Private | Implemented |
| [2026-07-04](2026-07-04-multi-learner-shared-knowledge.md) | Closed-Group Learning Library: Curation, Privacy and Deployment | Accepted |
| [2026-07-05](../plans/2026-07-05-titles-doctor-adaptation.md) | Human-friendly Titles + `zam doctor` adaptation plan (post Fable 5 review) | In progress |
| [2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) | MCP as the Canonical Agent Transport (and the Surface Topology Around It) | Partially implemented |
| [2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md) | Checkpointed Review Dialogue | Implemented |
| [2026-07-07](2026-07-07-resilient-self-update-and-dependency-isolation.md) | Resilient Self-Update and Dependency-Failure Isolation | Implemented |
| [2026-07-08](2026-07-08-multilingual-windows-installer.md) | Multilingual Windows Installer | Implemented |
| [2026-07-10](2026-07-10-recall-card-ux.md) | Recall Card UX — Adaptive Button, Finish/Summary, Domain Focus | Implemented |
| [2026-07-11](2026-07-11-codex-and-vscode-companion-surfaces.md) | Codex and VS Code Companion Surfaces | Accepted |
| [2026-07-12](2026-07-12-unified-capability-model-registry.md) | Unified Capability-Based Model Registry | Implemented |
| [2026-07-12a](2026-07-12a-agent-backed-ai-provider.md) | Agent-Backed AI Provider (Third Path Beside Local and Cloud) | Accepted |
| [2026-07-16](2026-07-16-companion-context-and-harness-affinity.md) | Companion Context Bar and Harness Affinity | Implemented |
| [2026-07-16b](2026-07-16b-in-recall-card-management.md) | In-Recall Card Management: Stop, Fix, and Remove | Implemented |
| [2026-07-17](2026-07-17-okf-knowledge-base.md) | OKF Knowledge Base — Living Repo Knowledge as Learning Sources | Implemented |
| [2026-07-17b](2026-07-17b-okf-visualizer-panel.md) | OKF Visualizer Panel (MCP App) | Implemented |
| [2026-07-18](2026-07-18-okf-learning-import.md) | Knowledge-to-Learning Import (OKF Articles → Learning Tokens) | Implemented |
| [2026-07-18b](2026-07-18b-graph-repo-scope.md) | Learning Graph Scope Selectors and the Repo Scope | Implemented |
| [2026-07-18c](2026-07-18c-okf-import-handoff.md) | OKF Import Handoff — Chat Delivery and the Focused-Article State | Implemented |
| [2026-07-21](2026-07-21-android-companion-tauri-shell.md) | Android Companion: Tauri 2 Shell with Kernel-in-WebView | Accepted — offline-sync product goal superseded by 2026-07-23 |
| [2026-07-23](2026-07-23-online-only-server-db-and-mobile-gating.md) | Online-Only Server Database, Mobile Gating, and Cloud Config in the DB | Accepted |
| [2026-07-24](2026-07-24-first-run-onboarding.md) | First-Run Onboarding: Personas, Goal-Driven Import, Cloud LLM Connect, and Agent Choice | Accepted |
| [2026-07-25](2026-07-25-shared-curated-learning-content.md) | Shared Curated Learning Content — Review Once, Serve Many | Accepted |
| [2026-07-26](2026-07-26-ipados-companion-target.md) | iPadOS Companion: Second Mobile Target on the Existing Tauri Shell | Accepted — not yet validated on hardware |
