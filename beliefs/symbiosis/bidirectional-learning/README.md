# Bidirectional learning

**Belief**: Both human and agent have knowledge that decays without practice. Learning flows in both directions — the human teaches the agent, and the agent teaches the human.

## Components

1. **Agent skills decay** — Learned agent procedures are scheduled via [FSRS](https://github.com/open-spaced-repetition/fsrs4anki), just like human knowledge. A skill that hasn't been practiced may become unreliable.
2. **User teaches agent** — When the agent gets stuck, the human guides it. That guidance is saved as an agent skill with linked tokens.
3. **Shared scheduling model** — The same decay and review mechanics apply to both parties. Neither has permanently reliable knowledge.
4. **No black boxes** — Agent knowledge (skills, linked tokens, scheduling state) is inspectable and reviewable by the human.
5. **Skill discovery** — New skills emerge from collaboration. They are not pre-programmed but discovered through real work.

## Related beliefs

- [Token-card separation](../../knowledge-structure/token-card-separation/) — agent skills link to tokens, which are shared concepts. The skill is the agent's "card" for those tokens.
- [Skill decay](../../forgetting/skill-decay/) — the broader principle that drives this design.
