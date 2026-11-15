# Guided Work: Subtasks with an Owner, Evidence from the Result, and a Colleague's Review

**Status:** Proposed\
**Date:** 2026-11-15\
**Decider:** Thomas (project owner)\
**Related:** [2026-10-08](2026-10-08-skill-learner-observation.md) (observation without content) · [2026-10-08b](2026-10-08b-corporate-deployment-baseline.md) (agents are untrusted) · [2026-07-17](2026-07-17-okf-knowledge-base.md) (OKF knowledge base) · [2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP transport) · [2026-06-13a](2026-06-13a-automatic-session-synthesis.md) (session synthesis)

---

## Context

### What fails

ZAM's promise is that the learner keeps doing real work while an agent
helps. In practice the agent does the work. The owner's observation
(2026-11-15): agents rarely recognise a single work step as something the
human could do. The one part that works, sometimes only when asked, is
creating learning tokens afterwards.

### Why it fails

Read against `skills/zam/SKILL.md` and the schema:

1. **There is no unit for a work step.** The skill defines a token as "Not
   a step. Not a procedure." and STEP 2 asks for a *knowledge* plan. In the
   schema a session step is a token that was touched
   (`session_steps.token_id NOT NULL`). Nothing describes a piece of work
   that has an owner.
2. **The hand-over is all or nothing.** Shadowing hands over the whole task
   ("This is now your job"). Guided collaboration is one sentence without a
   criterion for which step is the learner's.
3. **Only what has a tool happens reliably.** `zam_add_token` exists, so
   tokens get created. No tool allocates a step or records a hand-over, and
   every agent harness pulls its agent towards finishing the task itself.
4. **The work flow is a small part of a long skill.** About 15 of 355 lines
   and none of the 26 listed tools concern handing work to the learner.
5. **The symbiosis mode is not behaviour.** `tokens.symbiosis_mode` sits on
   the token all learners share, a model guesses it when a card is generated
   (`src/cli/llm/client.ts`), and the only kernel reader is the observation
   policy (`src/kernel/observation/policy.ts`).
   `ideas/learning/runtime-symbiosis-modes.md` records the same gap.

The flow is also expensive before any work starts: STEP 2 registers
knowledge tokens up front, with up to four tool calls per token (search,
foundations, add, link).

### What the owner asked for

- The learner does real programming work by hand: add an interface, extend
  documentation, write a test. Answering questions about it is not enough.
- Finding the solution is a path search. The task often already carries the
  learner's sketch. The agent plans and works ahead far enough to judge.
  Then comes "where do I start?". Either side can reveal the other's gap.
- When the learner proposes an alternative, the agent always names its
  drawbacks and says whether they are negligible.
- Think of a team: the task is split into subtasks, and the split itself can
  be the agent's work or the learner's. The learner picks the subtasks they
  feel unsure about. Work items are created after this planning, on a board
  where one exists (at least the learner's; blocked agent tasks may be
  created too), otherwise the session holds them.
- ZAM is injected into an environment that has its own skills and
  connectors. The way that environment already works with tasks is used.
- The learner is trusted. Whatever tools they use for their solution are
  theirs to choose. ZAM never asks whether they did it themselves.
- Questions about the solution afterwards extend and secure knowledge. They
  are a colleague's questions: why was it solved this way, would another
  way be more elegant? Like a pull-request review, in more and smaller
  steps, with short, focused feedback. A more elegant solution found this
  way should be kept.
- The agent's solution can be questioned in the same way. The learner often
  knows more of the context and has the more elegant solution. The agent
  then sees to it that the missing context is stored in OKF articles and
  ADRs.
- For anything that produces text (code, documentation, a terminal call),
  checking the result is enough. Only computer use needs the actions
  judged. Observation stays available where it can be defended (private
  use, teams that allow it) and is never required elsewhere.
- Subagents sparingly. Token use stays low.
- Harness-neutral: MCP and CLI only. Development first; school later.

### What already exists

- Sessions with an execution context, and `review_attempts`, which already
  holds `activity`, `assistance`, `independent` and `channel` and refuses to
  record assisted work as a success (`AssistedSuccessError`,
  `src/kernel/observation/attempts.ts`).
- An Azure DevOps connector that **reads** the learner's active work items
  (`src/cli/connectors/azure-devops.ts`); `zam session` and
  `zam connector tasks` offer them. It creates nothing, and this ADR does
  not change that.
- Shell observation with redaction on every read (ADR 2026-10-08, R5).
- For GUI tasks the skill already allows the harness's own screen or
  browser view (`skills/zam/SKILL.md`, *UI / screen tasks*).
- The OKF knowledge base with its write tool `zam_okf_upsert`
  (ADR 2026-07-17).

## Decisions

### 1. Guided work is planned as subtasks with an owner

A session holds a short list of subtasks, nine at most. Each has a title, a
done-criterion, an owner (`user` or `agent`), a state (`open`, `blocked`,
`done`), the subtasks it waits for, a kind of work (Decision 5) and an
optional external reference. The session is the record. Private use needs
nothing beyond it.

Dependencies are part of the list: manual tests wait until the code is
written and builds; an agent subtask can wait for the learner's.

### 2. The path is searched before the work is split, and either side may split

Splitting the task is work with an owner like any other.

1. The agent reads the code and forms its own view of the path. It does not
   show it yet.
2. The learner says where they would start, or splits the task themselves.
   A sketch in the task statement counts as that answer. The learner may
   also leave the split to the agent and review what it proposes.
3. The two paths are compared. Three outcomes:
   - **They agree.** Go on.
   - **The learner's path has a gap.** The agent explains it, and the gap
     becomes a knowledge card (Decision 8).
   - **The learner's path is one the agent did not have.** The agent names
     every drawback it sees, says for each whether it is negligible, and
     says whether the path is good enough to follow. The learner decides.

The agent may change its plan as a result. That is intended.

### 3. The learner chooses

When the subtasks are on the table, the learner takes the ones they want to
do, by their own sense of where they are unsure. ZAM computes no owner,
stores no preference and shows no score.

A feeling of uncertainty misses what one does not know to be missing. The
path comparison before the work and the review after it (Decision 7) are
the two correctives.

### 4. Work items are created after planning, with the environment's tools

ZAM is a guest in an environment that already has skills and connectors
for its task board. Guided work uses that way of working and adds no
second one.

- Nothing is created on a board before Decision 3 is done.
- **Board tooling present.** The agent creates the learner's subtasks as
  work items with the tools the environment provides, for example as child
  tasks in Azure DevOps. Blocked agent subtasks may be created as well. ZAM
  stores the reference on the subtask, so session and board stay linked.
- **No board tooling.** The session's list is the record.

ZAM itself writes to no board. Its Azure DevOps connector stays read-only.

### 5. Evidence follows the kind of work

| Kind of work | What is judged | Where it comes from |
|---|---|---|
| Text in the repository (code, tests, documentation) | The change | The difference to the state at hand-over, read by the agent with its own tools |
| Terminal | The terminal record at the end | The session's shell log, redacted (ADR 2026-10-08, R5) |
| Computer use | The actions | The environment's own screen capability, only where it is allowed |

Development work needs no observation of the learner. That is what makes it
defensible in a company. For computer use the agent looks with the screen
capability of its environment, in private use and in teams that allow it.
ZAM captures nothing itself, so ADR 2026-10-08 stays as it is.

What ZAM stores about a closed subtask carries no content: who did it,
whether the checks passed, what help the agent gave, and optionally a
commit id. No code, no file path.

The learner is trusted. A change in the learner's subtask is the learner's
work, whatever tools they used for it. ZAM does not ask how it was produced
and does not try to find out.

### 6. The hand-over is a state, not a sentence

- The agent works its own unblocked subtasks. When every remaining subtask
  is the learner's or waits for one of the learner's, it ends its turn and
  names the subtask, its done-criterion and what it prepared.
- For a learner subtask the agent prepares the surroundings and leaves the
  gap: the caller and a failing test exist, the interface is missing.
- If the learner is stuck, help comes in three steps: where to look; a
  pattern elsewhere in the repository; the agent does it. The first two are
  help among colleagues, and the subtask stays the learner's. After the
  third it is agent work.
- When the learner returns, the agent checks the result against the
  done-criterion and says what is missing, if anything. Then comes the
  review (Decision 7).

Two tools carry this, each with a bridge command: one records the plan and
returns the instruction which subtasks the agent must not write; one closes
a subtask with its evidence. A learner-owned subtask closes only with
`done_by: user`. Work the agent did is closed as agent work and never
counts as the learner's.

ZAM cannot stop an agent from editing a file. It can refuse to record the
result as the learner's and it keeps the state visible. Harness hooks that
block edits were considered and rejected (see *Alternatives*).

### 7. After a subtask comes a colleague's review, in both directions

A finished subtask is reviewed the way a colleague reviews a pull request,
only in smaller steps: one subtask at a time, one or two focused questions,
short feedback.

**The agent reviews the learner's subtask.**

- The questions are about the reasons: why this way, what else was
  considered, what it costs. They are never about whether the learner did
  it themselves.
- The agent says what it would have done differently and why. If one of
  the two solutions is more elegant, they say so and decide together
  whether the code changes.

**The learner may question the agent's subtask.** The learner often knows
more of the context and therefore often has the more elegant solution. The
agent then changes its work and sees to it that the context it lacked is
written down where the repository keeps its knowledge: what is true now in
an OKF article, a decision and its reasons in an ADR. The next agent starts
with that context. The same holds when the path comparison of Decision 2
shows that the agent lacked context.

**What the conversation brings out is kept.** A reason the learner could
not give becomes a knowledge card (Decision 8). A more elegant solution
becomes a knowledge card as well, so the next occasion starts from it.

The review ends when the questions are answered, not when a checklist is
complete.

### 8. Knowledge stays in knowledge cards; there is no card for a kind of work

- Guided work registers no knowledge tokens before the work. A card is
  added when the path comparison or the review brings out a gap or a better
  solution. The rules for a good token are unchanged.
- Work the learner did can count for cards they already have, under
  today's rules and with today's tools. Nothing changes there.
- There is no new card type for a recurring kind of step (see
  *Alternatives*, work cards). What ZAM keeps about the doing is the
  session's list: which subtasks the learner took and closed.

### 9. The flow is cheap by construction

- One call for the plan, one call per closed subtask.
- No subagent by default. One background check of a path is allowed when
  the two paths disagree and reading does not settle it.
- A separate, short work skill. Recall, atlas and import stay in the
  existing skill. Tool results carry the next instruction, so the skill
  does not have to.
- No fixed limit on turns. Path discussion and review end when the
  questions are answered.

### 10. The symbiosis mode is derived, not stored

For guided work, who does a subtask is the learner's choice (Decision 3).
Models are no longer asked to guess `symbiosis_mode` for a new card. The
column stays until the observation policy that reads it is settled by
ADR 2026-10-08.

### 11. Four beliefs change with acceptance

Following the change protocol in `beliefs/README.md`, in the PR that
accepts this ADR:

- **Session model:** a session step is a work step with an owner; it
  exercises tokens.
- **Observation over interruption:** judge the result where one remains;
  observe actions only where none does, with the environment's tools and
  only where it is allowed.
  Dialogue at the decision points, silence during execution. The
  bookkeeping is invisible, the learning is not.
- **Modes:** the mode belongs to a person and a subtask and is derived. It
  is not a field on the shared token.
- **Bidirectional learning:** context the agent lacked is written into the
  repository's knowledge (OKF article, ADR), where both sides can read it.

## Consequences

**Gained**

- The agent has an object to hand over and a state that tells it to stop.
- The learner does real work, chosen by themselves, and the evidence is the
  work.
- Knowledge grows in a conversation among colleagues, and the cards come
  out of it.
- Context the agent lacked ends up in the repository's knowledge, where the
  next agent and the next colleague find it.
- No observation of the learner for development work.
- Fewer tool calls before work starts.

**Costs and limits**

- A new table for subtasks and two tools with bridge commands. Schema
  changes go into `schema.ts` and a numbered migration.
- A second skill to keep in step across the copies in the repository. The
  `.claude` copy of today's skill has already drifted from `skills/zam`.
- Board items depend on the environment's tooling. Where there is none, the
  session's list is all there is.
- ZAM cannot enforce that the agent leaves the learner's subtask alone.
- ZAM takes the learner's word.
- ZAM schedules knowledge, not the practice of doing. The session shows
  what the learner did by hand; nothing reminds them of a kind of work they
  have not done for a long time.

## Alternatives considered

- **Better wording in the existing skill.** Rejected: the failure is
  structural. Prose loses against the harness default, and there is still
  no object to hand over.
- **Work cards.** A card per recurring kind of step ("add a numbered
  migration"), scheduled by FSRS, with the work itself as evidence, as
  cognitive tutors trace a skill step by step. Set aside on the owner's
  doubt: the cards would become too many and too varied. Such tutors work
  in a closed field with a hand-built catalogue of step kinds. Development
  work has none; a coarse kind says little, a fine one never recurs, and
  different agents would not name the same step alike. It can return if the
  session lists show kinds of work that do recur.
- **The kernel computes the owner** from a personal preference per kind of
  step (can / understand / hand off). Rejected by the owner in favour of the
  learner's own choice: less state, no extra question to the learner.
- **Harness hooks that block the agent's edits.** Rejected: not
  harness-neutral.
- **Observe the learner while editing.** Rejected: the result is enough for
  text work, and observation is hard to defend in a company.
- **ZAM keeps a screen capture of its own behind a switch** for computer
  use. Rejected by the owner: the environment's screen capability is
  enough, and ADR 2026-10-08 removes ZAM's own capture.
- **ZAM creates board items through its own connector.** Rejected by the
  owner: the environment already has its way of working with tasks. ZAM
  would duplicate it and would need write access to a system a team shares.
- **Check that the learner worked unaided.** Rejected by the owner: the
  learner is trusted and their tools are free. Questions serve
  understanding, not control.
- **A limit on turns for discussion and review.** Rejected by the owner.

## Open questions

None at the time of proposal. The owner settled the earlier ones on
2026-11-15. The model review may add new ones.

## Delivery

The plan follows the review of this ADR. Intended order:

1. Work skill, session subtasks and the two tools. Path search, hand-over
   and review work.
2. Belief changes and the end of the guessed symbiosis mode.

**How we will know it works:** over ten real development tasks, count the
sessions in which at least one subtask was handed to the learner and closed
with evidence without the learner having to ask for it.

## Grounding in external work

- Leaving a gap in prepared work is the completion problem of the
  [worked-example](https://en.wikipedia.org/wiki/Worked-example_effect)
  research.
- Asking for reasons is articulation in
  [cognitive apprenticeship](https://en.wikipedia.org/wiki/Cognitive_apprenticeship).
- The set-aside work cards follow
  [knowledge tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing)
  as used in the [cognitive tutor](https://en.wikipedia.org/wiki/Cognitive_tutor).

## Status history

- 2026-11-15 — Proposed.
