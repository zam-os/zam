# Kernel and Shell Observation

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Implementation of the initial core behavior: scheduling, knowledge tokens, shell hooks, monitor log analysis, session persistence, and agent-skill bridge.

## Decisions

- FSRS-5 scheduling with card states, stability, difficulty, and due dates.
- Atomic knowledge tokens with Bloom levels and prerequisite graphs.
- Prerequisite-aware blocking, unblocking, and domain interleaving.
- Shell observation for zsh, bash, and PowerShell.
- Monitor-log analysis based on errors, help seeking, retries, and timing.
- Session, review-log, and agent-skill persistence.
- A JSON bridge for AI-agent integrations.

## Evidence

- `src/kernel/models/`
- `src/kernel/scheduler/`
- `src/kernel/observation/`
- `src/bridge/`
- `tests/kernel/`
- `tests/integration/token-card-review.test.ts`
