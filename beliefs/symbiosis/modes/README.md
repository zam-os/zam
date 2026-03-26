# Symbiosis modes

**Belief**: The right level of AI involvement depends on the human's current competence. Collaboration should evolve through stages, not be fixed.

## Components

1. **Shadowing** — AI plans and proposes; human executes. The agent observes silently and rates. This is the default for new or low-retention concepts.
2. **Copilot** — Human and AI alternate turns. The agent watches user actions and adapts. Appropriate when retention exceeds ~70% and stability exceeds ~7 days.
3. **Autonomy** — AI handles routine execution. The human receives periodic *practice tasks* — real work opportunities, not quizzes — to keep skills alive. Appropriate when retention exceeds ~90% and stability exceeds ~30 days.
4. **Progression is earned** — Mode advances as [FSRS](https://github.com/open-spaced-repetition/fsrs4anki) metrics (retention, stability) demonstrate growing competence.
5. **Practice in autonomy** — Even full automation includes periodic real practice. This is the mechanism that prevents [skill decay](../../forgetting/skill-decay/).
6. **Mode is per-concept** — A person may be in autonomy for one concept and shadowing for another. The `symbiosis_mode` field on each token reflects this.

## Related beliefs

- [Observation over interruption](../observation-over-interruption/) defines *how* the agent monitors in shadowing and copilot modes.
- [Skill decay](../../forgetting/skill-decay/) is the reason autonomy mode must include practice.
