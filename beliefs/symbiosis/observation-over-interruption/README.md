# Observation over interruption

**Belief**: The most effective learning happens when the learner barely notices the bookkeeping. The agent should fade into the background during execution and speak up at the decision points.

## Components

1. **Judge the result** — Where work leaves a result (code, a document, terminal output), the result is the evidence. The agent checks it against the subtask's done-criterion; it does not watch the human type.
2. **Screen observation where no result remains** — Work that leaves no result, such as computer use, is observed with the environment's own screen tools, and only where observation is allowed. ZAM keeps it optional and off by default.
3. **Real-life observation** *(planned)* — Voice and AR overlay on actual physical work, bringing symbiosis into the non-digital world.
4. **Dialogue at the decision points, silence during execution** — The agent asks where the path splits and reviews a finished subtask like a colleague. While the human works, it stays quiet. Ratings are recorded at the end of the work, not during it.
5. **Invisible infrastructure** — Session start/stop, bridge calls, and monitoring noise are suppressed. The bookkeeping is invisible; the learning is not.

## Related beliefs

- [Session model](../../learning-in-context/session-model/) captures the context that observation produces.
- [Symbiosis modes](../modes/) suggest how much the agent takes on; the learner decides.
