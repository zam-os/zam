# Automatic Session Synthesis

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Designing idempotent, audit-tracked session synthesis to process monitor logs and update learning cards automatically.

## Decisions

- `zam session end --synthesize` previews monitor-derived ratings and requires an explicit accept, override, or skip decision for every candidate.
- Medium- and high-confidence candidates can update learning state; low confidence remains non-mutating evidence.
- Agent skills linked to exactly one token supply command patterns automatically. Ambiguous multi-token skills require an explicit JSON pattern file through `--patterns`.
- Each confirmed token update atomically writes the FSRS card state, immutable review log, session step, prerequisite blocking state, and synthesis audit.
- The `(session_id, token_id)` audit key makes repeated synthesis idempotent, including retries after the session has already ended.
- Existing databases gain the audit table through migration M006.

## Evidence

- `src/kernel/observation/session-synthesis.ts`
- `src/cli/commands/session.ts`
- `src/kernel/db/schema.ts`
- `src/kernel/db/connection.ts`
- `tests/kernel/session-synthesis.test.ts`
