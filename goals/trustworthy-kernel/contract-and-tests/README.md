# Contract and tests

**Goal**: The repository's declared public contract matches the executable behavior, and tests protect that promise.

## Components

1. **Exact protocol shapes** - `protocol.ts` matches emitted JSON exactly.
2. **Complete public exports** - the bridge package exports every supported public type.
3. **Workflow integration tests** - real CLI and bridge flows are tested across persistence boundaries.
4. **Contract-aware documentation** - docs are updated when supported behavior changes.
5. **Deliberate compatibility changes** - breaking contract changes are treated as explicit versioned events.

## Related goals

- [Phase 1 complete](../../phase-1-complete/)
- [Single-source agent guidance](../../open-ecosystem/single-source-agent-guidance/)
