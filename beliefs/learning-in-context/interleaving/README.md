# Interleaving

**Belief**: Mixing topics during review is more effective than studying one domain at a time. The brain learns to *discriminate* between concepts, not just *recognize* them.

## Components

1. **Cross-domain round-robin** — The review queue cycles through domains, allowing at most 2 consecutive items from the same domain.
2. **New cards interspersed** — A fresh concept is inserted every 5th position, preventing front-loading (boredom) and back-loading (fatigue).
3. **Strengthens discrimination** — Mixing forces the learner to identify *which* concept applies, not just recall a concept already primed by the previous card.
4. **Largest-domain-first ordering** — Domains with more due items are drawn from first in each round, ensuring balanced coverage.
5. **Grounded in research** — This implements the [interleaving effect](https://en.wikipedia.org/wiki/Interleaving_(learning)), supported by [desirable difficulty](https://en.wikipedia.org/wiki/Desirable_difficulty) theory.

## Related beliefs

- [Knowledge structure domains](../../knowledge-structure/) — domains as token categories make interleaving possible.
- [Session model](../session-model/) — interleaving happens within sessions, not across them.
