# Trustworthy kernel

**Goal**: The kernel becomes a dependable substrate for learning workflows, not a set of loosely aligned internal modules.

## Components

1. **[Contract and tests](contract-and-tests/)** - bridge JSON, CLI behavior, and public types are exercised end-to-end.
2. **Schema integrity** - database schema and migrations stay explicit, idempotent, and backward-safe.
3. **Knowledge-graph invariants** - core structural rules such as acyclic prerequisites are enforced, not just documented.
4. **Consistent lifecycles** - tokens, cards, skills, settings, and deprecation behavior are clearly defined.
5. **Release confidence** - external integrations can depend on the kernel without reverse-engineering current behavior.

## Related goals

- [Phase 1 complete](../phase-1-complete/)
- [Open ecosystem](../open-ecosystem/)
