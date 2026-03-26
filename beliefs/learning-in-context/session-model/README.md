# Session model

**Belief**: A work session is the natural container for learning — not a flashcard deck. People learn while doing, and the system should capture that.

## Components

1. **Session = focused work block** — A session has a user, a task description, a start time, and an optional end time. It represents a single episode of purposeful work.
2. **Session steps = tokens touched** — Each step records which concept was engaged, by whom (user or agent), and with what result (optional rating).
3. **Rating in context** — Ratings happen during real work, not in a separate review mode. The context of the work enriches the learning signal.
4. **Execution contexts** — Sessions operate at different levels: shell (current), UI (planned), real-life (planned). Each context expands the surface of [observation](../../symbiosis/observation-over-interruption/).
5. **Analytics from sessions** — Sessions enable correlating task success with concept mastery, revealing patterns invisible to isolated flashcard reviews.

## Related beliefs

- [Observation over interruption](../../symbiosis/observation-over-interruption/) explains how session data is captured without disrupting work.
- [Token-card separation](../../knowledge-structure/token-card-separation/) — sessions record which tokens were touched; cards record the resulting FSRS state changes.
