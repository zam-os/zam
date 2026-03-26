# Skill decay

**Belief**: Automation without practice causes capability loss. This is true for both humans and agents.

## Components

1. **Automation paradox** — The more a task is automated, the less the human practices it, the less capable they become at it. This is well-documented in [automation complacency research](https://en.wikipedia.org/wiki/Automation_complacency).
2. **Periodic practice prevents decay** — [Autonomy mode](../../symbiosis/modes/) includes real practice tasks, not quizzes. The human engages with the actual skill periodically.
3. **Practice, not quizzing** — In autonomy mode, the system creates real work opportunities ("here's a situation where you'd normally handle this — go ahead"), not flashcard prompts. This leverages [productive retrieval](https://en.wikipedia.org/wiki/Testing_effect).
4. **Agent skills decay too** — [Bidirectional learning](../../symbiosis/bidirectional-learning/) applies the same principle to agent knowledge. A skill the agent hasn't used may need revalidation.
5. **FSRS models the decay** — [FSRS-5](https://github.com/open-spaced-repetition/fsrs4anki) provides the mathematical model: memory strength (stability) determines when practice is needed.

## Related beliefs

- [Symbiosis modes](../../symbiosis/modes/) — autonomy mode is where skill decay is most dangerous and where periodic practice is most critical.
- [Bidirectional learning](../../symbiosis/bidirectional-learning/) — extends this principle to the agent.
