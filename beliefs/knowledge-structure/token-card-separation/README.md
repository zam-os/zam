# Token-card separation

**Belief**: A concept and a person's relationship to that concept are fundamentally different things. Conflating them makes knowledge management brittle and personal.

## Components

1. **Token = the concept** — Atomic, shared, identified by a slug. Has a [Bloom level](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy), a domain, and an optional symbiosis mode. Tokens are created once and shared across all learners.
2. **Card = personal state** — Per-user [FSRS](https://github.com/open-spaced-repetition/fsrs4anki) scheduling state: stability, difficulty, due date, reps, lapses, blocked status. Cards change with every review.
3. **Many cards per token** — Each learner has their own relationship to the same concept. One person may have mastered it; another may be struggling.
4. **Token metadata drives behavior** — The Bloom level determines [how the concept is prompted](../../learning-in-context/). The symbiosis mode suggests [how the agent should collaborate](../../symbiosis/modes/).
5. **Tokens are stable; cards are volatile** — Tokens change rarely (and such changes are belief-level events). Cards change every review session.

## Related beliefs

- [Dependency graphs](../dependency-graphs/) connect tokens to each other, not cards.
- [Bidirectional learning](../../symbiosis/bidirectional-learning/) — agent skills link to tokens, making the agent's knowledge inspectable through the same shared concepts.
