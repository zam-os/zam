# Review of the Current State: Phase 1 Foundations

## Executive Summary
ZAM has successfully transitioned from a conceptual manifesto to a functional, local-first learning kernel. The core architecture is remarkably clean, with a strong separation between the learning logic (Kernel) and the user interface (CLI). However, the repository is currently in a "fragmented" state where individual components work well in isolation but lack a unified, end-to-end user experience. The conceptual "beliefs" are well-documented but not yet fully enforced by the runtime.

## Core Subsystems

### 1. Learning Kernel (`src/kernel/`)
- **FSRS-5 Scheduler**: A high-quality, pure-function implementation of the FSRS-5 algorithm. It is the mathematical heart of the system and is well-tested.
- **Database Architecture**: SQLite with WAL mode provides a solid local-first foundation. The schema is well-normalized and covers tokens, cards, prerequisites, reviews, and sessions.
- **Queueing & Scheduling**: Implements complex behaviors like domain interleaving, prerequisite-aware blocking, and urgency-based sorting.

### 2. Command Line Interface (`src/cli/`)
- **Broad Surface**: 10 command groups covering the entire lifecycle of learning and work observation.
- **Thin Orchestration**: Commands are lightweight wrappers around the kernel, ensuring logic remains reusable and testable.
- **Usability Gaps**: Every command requires an explicit `--user` flag, which creates significant friction for the primary use case (single-user local dev).

### 3. JSON Bridge (`src/bridge/`)
- **Integration Surface**: Designed to allow external AI CLIs (Claude Code, Copilot) to interact with the kernel.
- **Protocol Drift**: There is a noticeable mismatch between the TypeScript types in `protocol.ts` and the actual JSON emitted by the CLI commands. This is a high-risk area for external integrations.

### 4. Observation Pipeline (`src/kernel/observation/`)
- **Shell Monitoring**: Real implementation of shell hooks (zsh/bash) and log analysis.
- **Heuristic Assessment**: The analyzer infers learning signals from command patterns, errors, and timing—a key differentiator from traditional SRS.

### 5. Beliefs System (`beliefs/`)
- **Conceptual Grounding**: A unique and powerful way to document the "why" behind the code. It serves as a living specification that guides both humans and agents.

## Technical Debt & Risks
- **Validation Failure**: `npm run lint` is currently broken due to a Biome configuration mismatch. This prevents automated quality checks.
- **Testing Gaps**: While the mathematical core and observation heuristics are tested, there are **no integration tests** for database operations, CLI workflows, or the bridge protocol.
- **Redundancy**: Duplicate and slightly divergent "skill" files for AI agents (`.claude/` vs `skills/`) create confusion about the "source of truth."
- **Unenforced Invariants**: Concepts like "acyclic prerequisites" are documented but not strictly enforced in the code (transitive cycles are possible).

## Alignment with Goals
The project is strongly aligned with its "Phase 1: Individual Symbiosis" goal at a subsystem level. It is "structurally complete but experientially fragmented." The foundation is ready for a major leap in usability and integration.
