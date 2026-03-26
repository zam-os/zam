# Single-source agent guidance

**Goal**: The repository explains the supported workflow once, then adapts it to each AI surface without behavioral drift.

## Components

1. **One canonical workflow description** - there is a primary source for supported agent behavior.
2. **Derived agent-specific wrappers** - Claude, Copilot, and Gemini guidance are derived from that source instead of hand-diverging.
3. **Synchronized updates** - behavior changes propagate across all agent surfaces together.
4. **Intentional differences only** - when two agent surfaces differ, the reason is explicit and documented.
5. **Code-aligned instructions** - guidance stays anchored to tested bridge and CLI behavior.

## Related goals

- [Open ecosystem](../)
- [Contract and tests](../../trustworthy-kernel/contract-and-tests/)
