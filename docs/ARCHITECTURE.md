# ZAM Architecture

ZAM is split into an AI-agnostic learning kernel (`src/kernel/`) and a thin CLI orchestration layer (`src/cli/`). Detailed specifications, protocol contracts, and data models are maintained across living OKF knowledge articles and Architectural Decision Records (ADRs).

---

## 1. Design Philosophy

ZAM (Symbiotic Learning Kernel) enhances human intelligence through frictionless spaced-repetition learning integrated directly into software engineering workflows.

### 1.1 AI-Agnostic Kernel
The core learning engine is built on pure learning science with **zero runtime dependencies on LLMs or cloud AI providers**. Scheduling, queue building, prerequisite resolution, and migrations are deterministic TypeScript/Rust code. External AI agents interact through typed MCP tools or the JSON bridge protocol.

### 1.2 Local-First & User-Owned
Knowledge profiles are private. Cards, tokens, review histories, and configuration keys are stored in a personal database (`~/.zam/zam.db` by default) or user-configured Turso/PostgreSQL storage. Human-authored artifacts (beliefs, goals) are versioned in plain Markdown inside the repository. Secrets stay local under `~/.zam/` or in the user's password manager, never in shared databases.

### 1.3 Observation over Interruption
ZAM prioritizes passive background observation over intrusive testing:
- **Level 1 (Shell):** Intercepts command history to observe tools executed, errors encountered, and documentation browsed.
- **Level 2 (Screen/UI):** Monitors active windows to infer comprehension from hands-on work.
- Active recall testing is an intentional practice surface, while the observer rates comprehension silently during real tasks.

---

## Topic Map

| Topic | Primary Documentation |
|---|---|
| **System Layers & Boundaries** | [Kernel & CLI Architecture](okf/kernel-architecture.md) · [MCP Surfaces](okf/mcp-surfaces.md) · [Bridge Protocol](okf/bridge-protocol.md) |
| **Data Model & Schema** | [Token & Card Model](okf/token-card-model.md) · Schema DDL: [`src/kernel/db/schema.ts`](../src/kernel/db/schema.ts) |
| **Scheduling Engine** | [FSRS Scheduling](okf/fsrs-scheduling.md) |
| **Review & Queue Lifecycle** | [FSRS Scheduling](okf/fsrs-scheduling.md) · [Prerequisite Blocking](okf/prerequisite-blocking.md) |
| **Observation & Privacy** | [Observer Privacy Model](okf/observer-privacy-model.md) · [ADR 2026-06-20](adr/2026-06-20-observer-permission-model.md) |
| **Agent Skills** | [SKILL.md](../skills/zam/SKILL.md) · [MCP Surfaces](okf/mcp-surfaces.md) |
| **Deployment & Sync** | [Kernel & CLI Architecture §Persistence](okf/kernel-architecture.md#persistence) · [ADR 2026-07-23](adr/2026-07-23-online-only-server-db-and-mobile-gating.md) · [Standalone Mobile Libraries](okf/mobile-standalone-libraries.md) |

## Symbiosis Modes

A token's `symbiosis_mode` (`shadowing`, `copilot`, `autonomy`) is the balance between learner and AI agent during practice and observation. The observer policy presets each mode implies are documented in [Observer Privacy Model](okf/observer-privacy-model.md); the type lives in `src/kernel/models/token.ts`.

---

## Further Reading

- **Decisions & Rationale:** [Architectural Decision Records (ADRs)](adr/README.md)
- **Knowledge Base:** [OKF Article Index](okf/index.md)
