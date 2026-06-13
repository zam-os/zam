# Increment 1: Kernel and Shell Observation

## Implemented

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
