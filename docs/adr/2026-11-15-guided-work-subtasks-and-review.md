# Guided Work: Subtasks with an Owner, Evidence from the Result, and a Colleague's Review

**Status:** Accepted\
**Date:** 2026-11-15\
**Decider:** Thomas (project owner)\
**Review:** GPT-6.1 Sol and Gemini 4 Argon on 2026-11-15; second pass by Gemini 4 Argon, Grok 4.7 and GPT-6 Astra the same day (zam-os/zam#485); see *Review record*\
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
5. **The authored symbiosis mode is not behaviour.**
   `tokens.symbiosis_mode` sits on the token all learners share, and a
   model guesses it when a card is generated (`src/cli/llm/client.ts`). The
   only kernel reader is the observation policy
   (`src/kernel/observation/policy.ts`).
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
- During the work there is no card management for now, so that it stays
  fast. The learner feels what is unsure and is explicitly told to take the
  subtasks that are hardest for them.
- At the end a record is made, so that some due reviews can fall away and
  new cards can be created. New cards are few: general knowledge rather
  than project detail that changes within weeks. Two tests decide. Will
  the concept probably still exist in two years? Is it more than something
  easily looked up? The learner is asked about each new card first and
  checks its question and its answer; they know whether it is worth
  remembering.
- The board shows the true state at any moment, so that work can be
  interrupted and a colleague can take over, for example in case of
  illness. At the end of the working day the work is on the feature
  branch, unless team rules already say how.
- For anything that produces text (code, documentation, a terminal call),
  checking the result is enough. Only computer use needs the actions
  judged. Observation stays available where it can be defended (private
  use, teams that allow it) and is never required elsewhere.
- Subagents sparingly. Token use stays low.
- Harness-neutral: MCP and CLI only. Development first; school later.

### What already exists

- Sessions with an execution context, and `review_attempts`, which holds
  `activity`, `assistance`, `independent` and `channel`. A rating of Hard,
  Good or Easy is accepted only for an attempt declared independent
  (`assertAttemptAllowsRating`, `src/kernel/observation/attempts.ts`).
- A mode derived per learner and domain from retention and stability
  (`getDomainCompetence`, `src/kernel/analytics/stats.ts`). The observation
  policy falls back to it when a token carries no authored mode.
- An Azure DevOps connector that **reads** the learner's active work items
  (`src/cli/connectors/azure-devops.ts`); `zam session` and
  `zam connector tasks` offer them. It creates nothing, and this ADR does
  not change that.
- A shell monitor whose log holds commands, timing and exit codes, no
  output (`src/kernel/observation/analyzer.ts`). It exists only when the
  learner opens a monitored shell, and a managed deployment denies it by
  default (ADR 2026-10-08b, D6).
- For GUI tasks the skill already allows the harness's own screen or
  browser view (`skills/zam/SKILL.md`, *UI / screen tasks*).
- The OKF knowledge base with its write tool `zam_okf_upsert`
  (ADR 2026-07-17).

## Decisions

### 1. Guided work is planned as subtasks with an owner

A session holds a short list of subtasks, nine at most. Each has a title, a
done-criterion, an owner (`user`, `agent` or `other`, a colleague), a state
(`open`, `blocked`, `handed_over`, `done`, `cancelled`), the subtasks it
waits for, a kind of work (Decision 5) and an optional external reference.
The owner is who took the subtask. Who finished it is recorded when it
ends (Decision 6). The session is the record. Private use needs nothing
beyond it.

Dependencies are part of the list: manual tests wait until the code is
written and builds; an agent subtask can wait for the learner's.

Subtasks live in a table of their own. `session_steps` stays what it is,
the record that a token was exercised. The reviews a session records at
its end (Decision 8) are written there as today. Existing review evidence
is untouched.

### 2. The path is searched before the work is split, and either side may split

Splitting the task is work with an owner like any other.

1. The agent reads the code and forms its own view of the path. It does not
   show it yet.
2. The learner says where they would start, or splits the task themselves.
   A sketch in the task statement counts as that answer. The learner may
   also leave the split to the agent and review what it proposes.
3. The two paths are compared. Three outcomes:
   - **They agree.** Go on.
   - **The learner's path has a gap.** The agent explains it.
   - **The learner's path is one the agent did not have.** The agent names
     every drawback it sees, says for each whether it is negligible, and
     says whether the path is good enough to follow. The learner decides.

The agent may change its plan as a result. That is intended.

### 3. The learner chooses

When the subtasks are on the table, the agent asks the learner, in so many
words, to take the ones that are hardest for them. The learner decides, by
their own sense of where they are unsure. ZAM computes no owner, stores no
preference and shows no score or hint.

A feeling of uncertainty misses what one does not know to be missing. The
path comparison before the work and the review after it (Decision 7) are
the two correctives. Beyond them ZAM relies on the learner.

### 4. Work items are created after planning, with the environment's tools

ZAM is a guest in an environment that already has skills and connectors
for its task board. Guided work uses that way of working and adds no
second one.

- Nothing is created on a board before Decision 3 is done.
- **Board tooling present.** The agent creates the learner's subtasks as
  work items with the tools the environment provides, for example as child
  tasks in Azure DevOps. Blocked agent subtasks may be created as well.
- **No board tooling.** The session's list is the record.

**The board is right at any moment.** Work can be interrupted at any time,
and a colleague must be able to take over, for example when someone falls
ill. The skill therefore tells the agent to keep board and session in
step, with the environment's tools:

- Whenever a subtask changes state, the agent updates its board item in
  the same turn.
- When a session resumes, the agent reads the items again and brings the
  session's list in line. What a colleague changed on the board wins:
  - an item a colleague finished is `done` by `other`;
  - an item a colleague took over gets the owner `other` and stays open
    until they finish it;
  - an item that was removed is `cancelled`.

  A subtask that waited for a cancelled one is no longer blocked by it. The
  agent shows it to the learner, who decides whether it still makes sense.
  None of the three ever counts as the learner's work.
- At the end of the working day, and whenever work is interrupted, the
  work in progress is on the feature branch. The agent reminds the learner
  and pushes when asked. Team rules for branches and pushes come first
  where they exist.

The agent creates the board items after the learner chose and then gives
ZAM their references with an update of the plan (Decision 6). A subtask
that has a reference is not created a second time. ZAM itself reads and
writes no board; the agent does. ZAM's Azure DevOps connector stays
read-only.

### 5. Evidence follows the kind of work

| Kind of work | What is judged | Where it comes from |
|---|---|---|
| Text in the repository (code, tests, documentation) | The change | The difference to the state at hand-over, read by the agent with its own tools |
| Terminal | The outcome | A check of the resulting state, run by the agent with its own tools |
| Computer use | The actions | The environment's own screen capability, only where it is allowed |

A terminal subtask is judged by what it left behind: a file, a status, an
exit code. A record of the terminal helps to explain a failure, whichever
the environment has: its terminal view, what the learner pastes, or ZAM's
monitored shell where the learner opened one and it is allowed. Guided
work never depends on that monitor. Where no check of the outcome exists,
the subtask closes as not checked.

Development work needs no observation of the learner. That is what makes it
defensible in a company. For computer use the agent looks with the screen
capability of its environment, in private use and in teams that allow it.
ZAM captures nothing itself, so ADR 2026-10-08 stays as it is.

What ZAM stores about a closed subtask carries no content: who did it,
whether the result was checked and passed, what help the agent gave, and
optionally a commit id. No code, no file path.

The learner is trusted. A change in the learner's subtask is the learner's
work, whatever tools they used for it. ZAM does not ask how it was produced
and does not try to find out. Closing a subtask says the work is done. It
says nothing about recall and touches no card (Decision 8).

### 6. The hand-over is a state, not a sentence

- The agent works its own unblocked subtasks. For a learner subtask it
  prepares the surroundings and leaves the gap: the caller and a failing
  test exist, the interface is missing.
- When every remaining subtask is the learner's or waits for one of the
  learner's, the agent records the hand-over and ends its turn. It names
  the subtask, its done-criterion and what it prepared.
- If the learner is stuck, help comes in three steps: where to look; a
  pattern elsewhere in the repository; the agent does it. The first two are
  help among colleagues, and the work stays the learner's. After the third
  the subtask closes as done by the agent.
- When the learner returns, the agent checks the result against the
  done-criterion and says what is missing, if anything. Then comes the
  review (Decision 7).

Three tools carry this, each with a bridge command:

- **Plan** records the subtasks and returns which ones the agent must not
  write. Called again, it updates the list: it attaches board references,
  and when a session resumes it applies what changed on the board
  (Decision 4). It always returns the session's current list, so a session
  can be picked up in a new conversation.
- **Hand over** marks a learner subtask as handed over. Its result is the
  instruction to stop, so it arrives at the moment of stopping and not
  several calls earlier. It is the last call of the turn.
- **Close** records who did the subtask and its evidence, for work this
  session finished. `done_by: user` is accepted only for a learner-owned
  subtask that was handed over. A learner-owned subtask may close with
  `done_by: agent`; that is the third step of help. An agent-owned subtask
  never closes as the learner's. What a colleague finished or removed
  comes in through Plan, not through Close.

This is a cooperative protocol. The agent itself reports who did the work,
and ZAM sees neither an agent's edits nor its turns. The tools make the
right behaviour the easy one and put the instruction to stop where the
agent reads it. They prove nothing. Whether agents then stop is measured
(*Delivery*). Harness hooks that block edits were considered and rejected
(see *Alternatives*).

### 7. After a subtask comes a colleague's review, in both directions

A finished subtask is reviewed the way a colleague reviews a pull request,
only in smaller steps: one subtask at a time, one or two focused questions,
short feedback. After a learner's subtask the review always follows. The
agent's subtask is reviewed when the learner asks.

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
written down. The same holds when the path comparison of Decision 2 shows
that the agent lacked context.

- It goes where the repository already keeps its knowledge: what is true
  now into an existing OKF bundle, a decision and its reasons into the
  repository's ADRs, otherwise into its own documentation or agent
  instructions. ZAM starts no new knowledge base in a repository for this.
- The agent proposes the text and the learner confirms it. Only what a
  later agent can use again is written.
- Agent skills stay the place for procedures the agent learned.

**What the conversation brings out is noted.** A reason the learner could
not give, a more elegant solution: the agent notes them for the record at
the end of the session (Decision 8). A better solution also lives on in the
code and, where it is context, in the repository's knowledge. Cards are not
made during the review.

The review ends when the questions are answered, not when a checklist is
complete. The learner can end or postpone it.

### 8. No card step during the work; at the end a few new cards, each asked first

For now, the work itself does without card management, so that it stays
fast. During the work ZAM searches, shows, rates, creates and links no
card. There is no lookup of matching cards, no due count and no rating.
The learner decides and feels which knowledge is unsure (Decision 3).

At the end of the session the agent draws up a short record. It is frugal
on purpose.

**New cards: few, and asked first.** A card is for knowledge worth
carrying in one's head, more than for project detail that changes within
weeks. The agent proposes a card only for what passes two tests:

- Will this concept probably still exist in two years?
- Is it more than something easily looked up?

Each proposal is shown by itself, with its question, its answer and one
line on why it passes the two tests, before anything is created. The
learner checks question and answer and accepts or rejects it;
they know best whether it is worth remembering. Nothing is accepted in
bulk. Project knowledge that fails the tests belongs in the repository's
knowledge (Decision 7), where it can be looked up, not in a card.

**Cards the learner already has: one confirmation.** The agent lists the
cards whose criterion the learner met in full in subtasks they closed
themselves. A subtask the agent finished brings no card onto the list, and
a card whose answer the agent supplied in the session is left out. The
list shows each card's title, not its answer, so a card the learner
strikes is not spoiled.

The confirmation asks what today's rule requires: did you apply each of
these in full and by yourself? The learner strikes what they did not and
confirms the rest with one yes. Those cards are recorded as reviewed, as
Good, the value today's rule uses when the effort is unknown, and their
due reviews fall away. The evidence rule itself does not change. The
question asked card by card is for new cards only.

How it is recorded:

- The kernel asks no one about independence. It accepts Hard, Good or Easy
  only for an attempt marked independent. The work skill therefore passes
  `independent: true` for the cards the learner kept, a fixed `activity`
  that tells a coverage confirmation from a recall, and `answer_format:
  recall`.
- One existing tool has to change. The token search returns no card id
  today, and a review needs one. It will return the id of a card the
  learner already has. A match without a card is dropped, because a review
  submitted for it would enrol the learner in that token.

The rules for a good token are unchanged.

There is no card type for a recurring kind of step (see *Alternatives*,
work cards). What ZAM keeps about the doing is the session's list: which
subtasks the learner took and closed.

Card steps during the work can come back once the cost of the flow is
known (*Delivery*).

### 9. The flow is cheap by construction

- One call for the plan and one each time it changes, one per hand-over,
  one per closed subtask.
- No card call during the work. The cards are settled once, at the end
  (Decision 8).
- No subagent by default. One background check of a path is allowed when
  the two paths disagree and reading does not settle it.
- A short work skill, separate from recall, atlas and import. Tool results
  carry the next instruction, so the skill does not have to.
- No fixed limit on turns. Path discussion and review end when the
  questions are answered. What a session costs is measured (*Delivery*).

### 10. The symbiosis mode is derived, not authored

The derived mode exists already: `getDomainCompetence` computes it per
learner and domain. That value is the mode. Guided work does not read it;
there the learner chooses (Decision 3).

The authored field goes out of use. Models are no longer asked for it, and
the parser for generated cards accepts a card without it, which it rejects
today. The `symbiosisMode` parameter of `zam_add_token` and
`zam_review_action` stays accepted, because a published field is not
removed. The column stays until ADR 2026-10-08 settles the observation
policy that reads it.

### 11. Six beliefs change with acceptance

Following the change protocol in `beliefs/README.md`, in the PR that
accepts this ADR:

- **Session model:** work is planned as subtasks with an owner. A session
  step stays the record that a token was exercised.
- **Observation over interruption:** judge the result where one remains;
  observe actions only where none does, with the environment's tools and
  only where it is allowed. Dialogue at the decision points, silence during
  execution. The bookkeeping is invisible, the learning is not.
- **Modes:** the mode is derived per learner and domain. It is a
  suggestion and not a field on the shared token.
- **Symbiosis** (competence drives autonomy): competence suggests how much
  to leave to the agent. The learner decides.
- **Skill decay:** practice of doing happens in real work, when the learner
  takes a subtask. ZAM does not schedule it. FSRS schedules knowledge.
- **Bidirectional learning:** context the agent lacked is also written
  into the repository's knowledge, where both sides can read it. Agent
  skills stay for procedures.

The acceptance PR rewrites every component that still describes the old
picture, not only the headline of each belief:

- Session model, component 3: ratings are given at the end of the work
  session and confirmed by the learner.
- Observation over interruption, components 1 and 4: success inferred from
  the shell log, and silent rating.
- Modes, components 5 and 6: scheduled practice tasks, and the mode stored
  on the shared token.
- Skill decay, components 2, 3 and 5, and the line in
  `beliefs/forgetting/README.md` that has autonomy detect forgetting
  through practice tasks.
- Symbiosis, component 6: "the system grants more autonomy".
- Bidirectional learning, component 1, says agent skills are scheduled by
  FSRS, while `agent_skills` has no scheduling columns. The PR settles
  that mismatch too.

## Consequences

**Gained**

- The agent has an object to hand over and a state that tells it to stop.
- The learner does real work, chosen by themselves, and the evidence is the
  work.
- Knowledge grows in a conversation among colleagues.
- No card step slows the work. The few new cards hold knowledge that
  lasts, and each one was read by the learner before it counted.
- Work lets due reviews fall away.
- The board is right when work stops, so a colleague can take over.
- Context the agent lacked ends up in the repository's knowledge, where the
  next agent and the next colleague find it.
- No observation of the learner for development work.
- Fewer tool calls before work starts.

**Costs and limits**

- A new table for subtasks and three tools with bridge commands. Schema
  changes go into `schema.ts` and a numbered migration. A new table also
  needs its entry in the snapshot
  list (`SNAPSHOT_TABLES`) and in the row-level-security policies
  (`src/cli/deploy/rls-policies.ts`).
- One existing tool changes: the token search returns the card id of a
  card the learner already has (Decision 8).
- Today's skill forbids inferring a running flow from old rows. Picking up
  guided work in a new conversation relaxes that for its sessions.
- Skill distribution knows one skill today (`distributeGlobalSkills`,
  `wireSkills`). A second one needs that code changed. The repository
  holds four copies of the skill, and the three harness copies have
  drifted from `skills/zam`.
- Board items depend on the environment's tooling. Where there is none, the
  session's list is all there is. Keeping board and session in step costs
  a call at every change of state and depends on the agent doing it.
- The protocol is cooperative. ZAM cannot enforce that the agent leaves the
  learner's subtask alone.
- ZAM takes the learner's word.
- ZAM schedules knowledge, not the practice of doing. The session shows
  what the learner did by hand; nothing reminds them of a kind of work they
  have not done for a long time.
- Cards change only at the end of a session. A session that is broken off
  leaves no record.
- Project knowledge that changes soon gets no card. It has to be found in
  the repository's knowledge.
- The joint confirmation rates on the learner's word, without a question
  per card. A card can count as reviewed although the learner would not
  have recalled it. It costs one search and one entry per covered card.

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
- **Card steps during the work:** matching the learner's cards to the
  subtasks, a hint where cards are due, a rating after each review, a new
  card as soon as a gap shows. Deferred by the owner: every card step costs
  calls and attention during the work. The learner feels what is unsure and
  is told to take the hardest subtasks; the cards are settled once, at the
  end.
- **Accept the proposed cards in one go.** Rejected by the owner: the
  learner reads every card's question and answer before it counts.
- **Ask about every existing card on its own, or leave existing cards
  alone.** Rejected by the owner: the first is not frugal, and the second
  lets no due review fall away. One confirmation covers the list.
- **A card for everything that came up.** Rejected by the owner: project
  detail changes within weeks. Only what lasts and is not easily looked up
  is worth a card.
- **ZAM's record alone, with no synchronisation to the board.** Rejected by
  the owner: the team must see the true state when work stops.
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

None. Settled by the owner on 2026-11-15: no card step during the work, no
hint where cards are due, no question the agent offers on its own subtask,
and one confirmation for the existing cards the work covered.

## Delivery

The plan follows the settling of this ADR. Intended order:

1. Work skill, subtask table and the three tools. Path search, hand-over,
   review and the record at the end work.
2. Belief changes and the end of the authored symbiosis mode.

**How we will know it works:** over ten real development tasks, on at
least two harnesses, count

- the sessions in which at least one subtask was handed to the learner and
  closed by them without the learner having to ask for it;
- the take-overs, where the agent did a learner's subtask unasked;
- tokens and duration per session, written context included;
- the cards proposed per session and how many the learner accepted.

## Grounding in external work

- Leaving a gap in prepared work is the completion problem of the
  [worked-example](https://en.wikipedia.org/wiki/Worked-example_effect)
  research.
- Asking for reasons is articulation in
  [cognitive apprenticeship](https://en.wikipedia.org/wiki/Cognitive_apprenticeship).
- The set-aside work cards follow
  [knowledge tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing)
  as used in the [cognitive tutor](https://en.wikipedia.org/wiki/Cognitive_tutor).

## Review record

GPT-6.1 Sol and Gemini 4 Argon commented on zam-os/zam#485 on 2026-11-15.
Every claim about the repository in the two reviews was checked and held.

**Applied**

- Subtasks get their own table; `session_steps` keeps its meaning (both;
  Decisions 1 and 11).
- A terminal subtask is judged by an outcome check and never depends on the
  shell monitor (both; Decision 5).
- The hand-over is a call of its own; owner and `done_by` are separate, so
  the third step of help can close; the protocol is named cooperative
  (both; Decision 6).
- Closing a subtask is separate from recall credit and rates no card.
  Credit for existing cards is given once, at the end, on the learner's
  confirmation (both; Decisions 5 and 8).
- Board and session are kept in step: the item is updated at every change
  of state and read again when a session resumes, and a subtask is not
  created twice. The agent does it with the environment's tools, not ZAM
  (GPT, Gemini; Decision 4). First set aside, then taken up by the owner.
- The agent's missing context goes only into places the repository already
  has, the learner confirms it, and agent skills stay (both; Decision 7).
- The derived mode that exists is named, with the code that still expects
  the authored one (both; Decision 10).
- Skill decay and Symbiosis joined the beliefs that change (both;
  Decision 11).
- Snapshot list, row-level security, the four skill copies and the
  distribution code are named as costs (Gemini).
- The review is fixed after a learner's subtask and on request after the
  agent's, and can be postponed (Gemini, GPT; Decision 7).
- The measure covers several harnesses, take-overs, tokens and duration
  (GPT; *Delivery*).

**Not applied**

- *Refuse a learner's close in the same turn as the hand-over* (Gemini).
  ZAM sees neither turns nor edits, and a time threshold would be a guess.
  The hand-over call and the measure stand in for it.
- *A board reference written once, with no synchronisation* (Gemini). The
  owner wants the board right at any moment, so that a colleague can take
  over.
- *A repository-scoped token as the fallback store for the agent's missing
  context* (Gemini). A token is the learner's knowledge. The fallback is
  the repository's own documentation.
- *A recency hint and an agent-initiated question* (Gemini). Both need
  card lookups during the work. The owner decided against card steps
  during the work; the learner is told to take the hardest subtasks
  instead (Decisions 3 and 8).

### Second pass

Gemini 4 Argon, Grok 4.7 and GPT-6 Astra reviewed commit `277816a3` on
2026-11-15. Their claims about the code were checked and held.

**Applied**

- A colleague's work can be recorded: the owner `other`, `done` by
  `other` and the state `cancelled`, with their effect on waiting subtasks
  and never as the learner's work. It comes in through Plan (all three;
  Decisions 1, 4 and 6).
- Plan is an update that can be repeated. It attaches board references
  and returns the current list (Gemini, Grok; Decisions 4, 6 and 9).
- The joint confirmation asks whether the learner applied each card in
  full and independently, so the evidence rule stays as it is (GPT-6
  Astra; Decision 8).
- Only subtasks the learner closed bring cards onto the list. The skill
  passes `independent: true`, a fixed `activity` and `answer_format:
  recall`. The token search has to return the card id, and a match without
  a card is dropped (Grok, Gemini; Decision 8).
- The hand-over is the last call of the turn (Grok, Gemini; Decision 6).
- Each proposed card carries one line on why it passes the two tests
  (Gemini; Decision 8).
- The belief components to rewrite are listed (Grok, Gemini; Decision 11).

**Not applied**

- *A fixed stop field in the hand-over result and a `board_sync` flag*
  (Gemini). The shape of a payload belongs to the plan.
- Gemini's second pass cites `beliefs/token-craft/worth-keeping`, which
  does not exist, and its agreement list describes decisions this ADR does
  not contain. Only its findings that could be checked in the code were
  used.

## Status history

- 2026-11-15 — Proposed.
- 2026-11-15 — Reviewed by GPT-6.1 Sol and Gemini 4 Argon; findings applied.
- 2026-11-15 — Owner: no card step during the work for now; at the end a
  few new cards for lasting knowledge, each asked first; one confirmation
  for the existing cards the work covered; board and session kept in step.
- 2026-11-15 — Second review pass by Gemini 4 Argon, Grok 4.7 and GPT-6
  Astra; findings applied.
- 2026-11-15 — Accepted by the owner, with the belief changes of
  Decision 11 (zam-os/zam#486).
