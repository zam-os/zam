# Goal Engine: High-Level Intentions & Decomposed Paths

**Target State**: A system that manages the user's long-term learning intentions as high-level goals that decompose into executable tokens and cards.

## Target Components

1. **Hierarchical Markdown Goals** — Goals are stored as nested markdown files (e.g., `goals/master-backend-arch.md`), mirroring the decomposition of `beliefs/`.
2. **Goal-to-Token Mapping** — A clear relationship where a high-level goal (e.g., "Master SQL Performance") is automatically linked to a set of relevant tokens.
3. **Agent-Guided Refinement** — The ZAM agent proactively suggests goal refinements and sub-goals based on observation and user performance.
4. **Proactive Session Proposals** — At the start of a session, ZAM proposes a specific task or learning path based on the user's active goals.
5. **Goal Progress Tracking** — Moving beyond card-level "mature" status to goal-level "competence" metrics.
6. **Task-Goal Alignment** — Ensuring that sprint tasks and learning goals are matched for maximal relevance and "coworking" impact.
7. **Intentionality Over Automation** — The agent helps the user *define* what to learn, rather than just *completing* tasks on their behalf.
