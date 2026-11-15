# Bidirectional learning

**Belief**: Both human and agent have knowledge that decays without practice. Learning flows in both directions — the human teaches the agent, and the agent teaches the human.

## Components

1. **Agent skills decay** — A learned agent procedure that hasn't been used may become unreliable, as the repository and its tools move on. It is checked again when it is next used; it is not scheduled like a card.
2. **User teaches agent** — When the agent gets stuck, the human guides it. A procedure is saved as an agent skill with linked tokens.
3. **Neither side is permanently reliable** — Human knowledge decays and is scheduled by FSRS; agent knowledge goes stale and is revalidated in use.
4. **No black boxes** — Agent knowledge (skills, linked tokens, scheduling state) is inspectable and reviewable by the human.
5. **Skill discovery** — New skills emerge from collaboration. They are not pre-programmed but discovered through real work.
6. **Repository knowledge** — When the human questions the agent's solution and the agent lacked context, that context is written into the repository's own knowledge (articles, ADRs), where both sides can read it. Agent skills stay for procedures.

## Related beliefs

- [Token-card separation](../../knowledge-structure/token-card-separation/) — agent skills link to tokens, which are shared concepts. The skill is the agent's "card" for those tokens.
- [Skill decay](../../forgetting/skill-decay/) — the broader principle that drives this design.
