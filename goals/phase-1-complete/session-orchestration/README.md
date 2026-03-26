# Session orchestration

**Goal**: Every meaningful task can move through one session lifecycle that records what happened, who did it, and what was learned.

## Components

1. **Explicit session start** - a session captures user, task, context, and observation mode.
2. **Provenance-rich steps** - touched concepts become `session_steps` with clear user-versus-agent attribution.
3. **Connected learning state** - confirmed work updates cards and review logs without losing context.
4. **Honest session summaries** - the ending state makes clear what the human did and what the agent did.
5. **Shared workflow surface** - CLI commands and bridge calls expose the same lifecycle.

## Related goals

- [Observation-first workflow](../observation-first-workflow/)
- [Trustworthy kernel](../../trustworthy-kernel/)
