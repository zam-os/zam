# Session model

**Belief**: A work session is the natural container for learning — not a flashcard deck. People learn while doing, and the system should capture that.

## Components

1. **Session = focused work block** — A session has a user, a task description, a start time, and an optional end time. It represents a single episode of purposeful work.
2. **Session steps = tokens touched** — Each step records which concept was engaged, by whom (user or agent), and with what result (optional rating). A step stays the record that a token was exercised.
3. **Record at the end** — No card step interrupts the work. When the work ends, the agent proposes a few new cards for lasting knowledge, each asked first, and the learner confirms once the existing cards their own subtasks covered. The context of the work enriches the learning signal.
4. **Execution contexts** — Sessions operate at different levels: shell (current), UI (planned), real-life (planned). Each context expands the surface of [observation](../../symbiosis/observation-over-interruption/).
5. **Analytics from sessions** — Sessions enable correlating task success with concept mastery, revealing patterns invisible to isolated flashcard reviews.
6. **Subtasks with an owner** — Guided work is planned as a few subtasks, each owned by the learner, the agent or a colleague. The learner takes the subtasks that are hardest for them, and the board of the environment stays in step so that a colleague can take over.

## Related beliefs

- [Observation over interruption](../../symbiosis/observation-over-interruption/) explains how session data is captured without disrupting work.
- [Token-card separation](../../knowledge-structure/token-card-separation/) — sessions record which tokens were touched; cards record the resulting FSRS state changes.
