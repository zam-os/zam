# Vision for the Next Increment: Goal-Driven Stabilization

## One-Sentence Vision
Transform ZAM from a learning toolkit into a proactive personal agent by implementing a markdown-based Goal Engine, automated task discovery from organizational contexts, and a stable, self-validating build pipeline.

## Why this is the right next increment
ZAM's kernel is strong, but its integration with the user's actual work environment and long-term intentions is still manual. By connecting the learning engine to high-level goals and professional tasks (Scrum/OKRs), we turn "learning while working" from a manual setup into a proactive service.

## Significant Changes (Max 7)

### 1. Technical Stabilization & CI
- **Fix the Build**: Align `biome.json` with the current version and resolve all linting issues.
- **Continuous Integration**: Implement GitHub Actions to run `build`, `test`, and `lint` on every PR.
- **Stable Bridge**: Audit and fix the JSON bridge contract to match the `protocol.ts` declarations.

### 2. Multi-Repo Context & User Identity
- **Default User**: Eliminate the mandatory `--user` flag by establishing a `whoami` and default user preference.
- **Repo Settings**: Implement the settings structure for `personal_repo`, `team_repo`, and `org_repo` as described in Thomas's vision.
- **Automated Summarization**: Equip the agent with the "skill" to process organization wikis and OKRs to build context.

### 3. The Goal Engine (Markdown-Based)
- **Hierarchical Goals**: Implement a goal system where intentions are stored as decomposed markdown files (similar to the `beliefs/` structure).
- **Goal-to-Token Mapping**: Create a mechanism to link high-level goals to specific knowledge tokens.
- **Persistence**: Ensure goals are versioned and can be evolved collaboratively with the ZAM agent.

### 4. Automated Task Discovery & Proposal
- **Scrum Integration**: Implement a "Team Skill" that can fetch work items from external boards.
- **Proactive Onboarding**: When a session starts, ZAM should automatically propose the next unblocked task based on the current sprint and learning priorities.
- **Smart Priority**: Rank proposals by a balance of "Task Urgency" and "Learning Need" (due cards).

### 5. Integration Testing for the Kernel
- **Model Tests**: Add integration tests for all database-touching functions (tokens, cards, sessions).
- **In-Memory Validation**: Use in-memory SQLite for fast, isolated test runs in the CI.
- **Invariant Enforcement**: Add cycle detection for prerequisites and other core beliefs.

### 6. Automated ZAM-Backup
- **Session-End Export**: Implement an optional automated backup of the `zam.db` to the `personal_repo` at the end of every session.
- **Portable Learning State**: Ensure that the user's progress is always backed up in a location they own and control.

### 7. Consolidated Agent Guidance
- **Single Source of Truth**: Merge the diverging `.claude/` and `skills/` files into one canonical documentation layer.
- **Proactive Guidance**: Update the agent skills to reflect the new Goal Engine and Proactive Task Proposal workflows.

## Success Criteria
1. The repository build is "Green" on every push (CI).
2. A user can start a session and receive a personalized task/learning proposal without manual flags.
3. Personal goals are documented in markdown and linked to the learning queue.
4. Database state is automatically backed up to a user-defined folder.
5. The team trial (PO Thomas + 2 members) has a clear starting point and documented success metrics for the first quarter.
