# Skill decay

**Belief**: Automation without practice causes capability loss. This is true for both humans and agents.

## Components

1. **Automation paradox** — The more a task is automated, the less the human practices it, the less capable they become at it. This is well-documented in [automation complacency research](https://en.wikipedia.org/wiki/Automation_complacency).
2. **Practice of doing happens in real work** — The human keeps a skill alive by taking a subtask of real work, chosen because it is hard for them. ZAM does not schedule practice tasks, even in [autonomy](../../symbiosis/modes/).
3. **Doing, not quizzing** — The practice is the work itself, not a flashcard prompt about it. This leverages [productive retrieval](https://en.wikipedia.org/wiki/Testing_effect).
4. **Agent skills decay too** — [Bidirectional learning](../../symbiosis/bidirectional-learning/) applies the same principle to agent knowledge. A skill the agent hasn't used may need revalidation.
5. **FSRS schedules knowledge** — [FSRS-6](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm) models the decay of knowledge: memory strength (stability) determines when a card is due. It does not schedule the practice of doing.

## Related beliefs

- [Symbiosis modes](../../symbiosis/modes/) — autonomy mode is where skill decay is most dangerous and where taking real subtasks matters most.
- [Bidirectional learning](../../symbiosis/bidirectional-learning/) — extends this principle to the agent.
