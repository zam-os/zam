# Observation over interruption

**Belief**: The most effective learning happens when the learner barely notices it. The agent should fade into the background, not demand attention.

## Components

1. **Shell observation** — Monitor terminal commands, infer success from exit codes, help-seeking patterns, retries, and timing gaps. This is the current implementation.
2. **Screen observation** *(planned)* — Agent watches UI actions and rates visually, extending observation beyond the terminal.
3. **Real-life observation** *(planned)* — Voice and AR overlay on actual physical work, bringing symbiosis into the non-digital world.
4. **Silent rating** — The agent rates internally without interrupting the human's flow. No pop-ups, no quiz prompts during focused work.
5. **Invisible infrastructure** — Session start/stop, bridge calls, and monitoring noise are suppressed. The learning system should be felt, not seen.

## Related beliefs

- [Session model](../../learning-in-context/session-model/) captures the context that observation produces.
- [Symbiosis modes](../modes/) determine what the agent does with its observations — shadow silently, copilot actively, or practice periodically.
