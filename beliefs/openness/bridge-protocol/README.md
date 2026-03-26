# Bridge protocol

**Belief**: A stable, machine-readable contract between the kernel and any AI is the foundation of vendor independence. The protocol is a covenant — once a field is published, it is guaranteed.

## Components

1. **Pure JSON** — All bridge responses are machine-readable, including errors. No human-formatted text in the protocol layer.
2. **Stable fields** — Fields, once published in `protocol.ts`, are guaranteed across versions. This is the contract between the kernel and all integrating AIs.
3. **Core commands** — The command set covers the full learning cycle: check what's due, get a review item, submit a rating, register a token, query skills, observe work.
4. **Forward-compatible** — New fields and commands can be added. Existing fields are never removed or have their types changed.
5. **`protocol.ts` as source of truth** — The TypeScript types in `src/bridge/protocol.ts` *are* the contract. If a type changes, all integrations must be considered.

## Related beliefs

- [AI-agnostic kernel](../) — the bridge exists because the kernel must work with any AI.
- [Symbiosis](../../symbiosis/) — the bridge is how different AIs participate in the symbiotic relationship.
