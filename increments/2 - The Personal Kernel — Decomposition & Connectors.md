# Vision for the Next Increment: The Personal Kernel — Decomposition & Connectors

## One-Sentence Vision
Decompose ZAM into a shared core and a forkable personal kernel, connect it to the user's real-world services through a connector model, and redesign sessions around task-driven learning with a repetition-first flow.

## Why this is the right next increment
Phase 1 proved the learning kernel works: FSRS scheduling, Bloom-adapted prompting, prerequisite graphs, and shell observation are solid. But everything lives in a single repository, there is no connection to the tools people actually use for work, and sessions require manual orchestration. This increment turns ZAM from a developer prototype into a personal system that integrates with real workflows — where learning happens as a natural byproduct of getting things done.

## Significant Changes (Max 7)

### 1. Repository Decomposition
The monorepo splits into two concerns:
- **`zam-os/zam`** (core) — The AI-agnostic learning kernel, CLI, bridge protocol, and shared infrastructure. This is what everyone depends on.
- **`zam-os/zam-personal`** (template) — A forkable repository that each user clones into their own private personal repo (e.g. `Josefczak/zam-Thomas`). This is where ZAM is started from.
- **What moves to personal**: Beliefs, top-level goals, and the entry point for starting ZAM. The personal repo is the user's individual world view.
- **Commits as approval**: All ground-breaking changes to beliefs and goals must be committed and pushed. No policy layer needed — the git history *is* the approval trail.

### 2. Cloud-Ready Database
- **Dual persistence model**: Fast-changing data (tokens, cards, review logs, sessions) stays in the database. Slow-changing data (beliefs, goals) stays as markdown in git.
- **Turso migration**: Provide an easy setup path to migrate the local SQLite database to a cloud provider, starting with Turso. The user's learning state becomes portable and accessible across devices.
- **Local-first remains the default**: The local `~/.zam/zam.db` continues to work. Cloud sync is opt-in, not mandatory.

### 3. Connector Architecture
- **Service subscriptions**: Introduce a model where external services are accessed via endpoint + credentials. ZAM agent learns to use any connected service.
- **Priority connectors**: Document storage (Google Drive, OneDrive, iCloud, DocuWare), communication (email), and task management (see below).
- **Replacing the filing cabinet**: Connectors allow ZAM to manage documents and communications on the user's behalf — replacing the scattered, dust-collecting approach most individuals currently maintain.

### 4. Task Connector & Active Task Priority
- **Integration targets**: Azure DevOps, GitHub Projects, Jira — any system that holds work items and goals at different organizational levels.
- **Active task check**: At session start, ZAM checks for active tasks. Finishing an active task takes priority over starting new ones, preventing task starvation.
- **Tasks as learning source**: Every task is a potential learning opportunity. When the user works on a task, ZAM identifies which knowledge tokens are exercised and which gaps emerge.
- **Hierarchical goals**: If the connected service supports it (e.g. Azure DevOps epics/features/PBIs), ZAM can map organizational goals down to individual learning paths.

### 5. Markdown Goal Engine
- **Goals in the personal repo**: Top-level goals are persisted as markdown files, maintained collaboratively by the user and the ZAM agent.
- **Agent-maintained**: The ZAM agent proposes, refines, and evolves goal and belief changes through conversation. *"Did I get this right? You now believe the earth is a ball and there is no conspiracy about this fact."*
- **Decomposition**: High-level goals decompose into lower-level goals, which become tasks, which surface learning tokens. The hierarchy is: Goals (markdown) → Tasks (connector) → Tokens (database).

### 6. Session Redesign: Repetition-First, Then Task Execution
- **Phase 1 — Repetition** (up to 20 minutes, configurable): The session opens with spaced repetition review of due cards. It begins with cards that are difficult to put into task execution — pure recall. Once those are processed, it continues with cards that can be exercised in the observable environment (for now, the terminal). The user can abort early and skip to task execution at any time.
- **Phase 2 — Task execution with observation**: The user works on the next active task. ZAM observes, identifies learning moments, and files new tokens. The daily job gets done, and learning happens alongside it. When all active tasks are completed or blocked, ZAM presents a ranked list of available work items. The ranking balances team goals and personal learning goals — initially weighted equally (50/50), tunable later. The user can override the suggested order manually. Committing to a work item means changing its state to active. Higher-level work items require task decomposition first. When new tasks arise during execution, they are created on the fly. Both task creation and work item decomposition are supported by ZAM skills.
- **Smooth transition**: The boundary between repetition and execution is fluid. If a review topic is directly relevant to the active task, the agent can bridge naturally into execution.

### 7. Skill Discovery Through Observation
- **Pattern recognition**: By observing task execution, the agent identifies recurring non-standard patterns — things that deviate from default tool behavior (e.g. filling an alternative description field when creating a PBI in Azure DevOps).
- **Minimal skills**: Discovered skills should be as small as possible to remain flexible and composable. Not every click is interesting — only the out-of-the-ordinary steps that would be invisible if done the standard way.
- **From observation to automation**: Once a pattern is stable enough (the user has demonstrated it consistently), the agent can propose automating it. The human's demonstrated competence is the gate for automation — not the other way around.

## Success Criteria
1. ZAM starts from a personal repo fork, not from the core repo.
2. Beliefs and goals live in the personal repo and are maintained through git commits. The core repo retains its own beliefs and goals — these describe the system's principles, not personal information.
3. At least one connector type (task management or document storage) is functional end-to-end.
4. Sessions open with a repetition phase that transitions naturally into task execution.
5. The local database can be migrated to Turso with a single setup command.
6. The agent can identify and propose at least one skill from observed task execution patterns.
7. Active tasks from a connected service appear in the session start proposal.
