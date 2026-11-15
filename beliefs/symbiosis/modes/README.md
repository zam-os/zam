# Symbiosis modes

**Belief**: The right level of AI involvement depends on the human's current competence. Collaboration should evolve through stages, not be fixed.

## Components

1. **Shadowing** — AI plans and proposes; human executes. The agent observes silently and rates. This is the default for new or low-retention concepts.
2. **Copilot** — Human and AI alternate turns. The agent watches user actions and adapts. Appropriate when retention exceeds ~70% and stability exceeds ~7 days.
3. **Autonomy** — AI handles routine execution. Appropriate when retention exceeds ~90% and stability exceeds ~30 days.
4. **Progression is earned** — Mode advances as [FSRS](https://github.com/open-spaced-repetition/fsrs4anki) metrics (retention, stability) demonstrate growing competence.
5. **Practice comes from real work** — Even in autonomy the human keeps practising, by taking the subtasks of real work that are hardest for them. ZAM does not schedule practice tasks. This is what prevents [skill decay](../../forgetting/skill-decay/).
6. **Mode is derived, per learner and domain** — A person may be in autonomy in one domain and shadowing in another. The mode is computed from their own cards and is a suggestion; it is not a field on the shared token.

## Related beliefs

- [Observation over interruption](../observation-over-interruption/) defines *how* the agent monitors in shadowing and copilot modes.
- [Skill decay](../../forgetting/skill-decay/) is the reason autonomy must leave the human real work to do.
