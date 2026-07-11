# Checkpointed Review Dialogue (Question → Answer → Feedback → Open Flow → Rating Check-in)

**Status:** Proposed (revised 2026-07-11)
**Date:** 2026-07-06
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (companion) ·
[2026-07-11-codex-and-vscode-companion-surfaces.md](2026-07-11-codex-and-vscode-companion-surfaces.md) ·
[2026-06-27-recall-session-llm-pipeline.md](2026-06-27-recall-session-llm-pipeline.md) ·
[2026-05-30a-standalone-learning-session.md](2026-05-30a-standalone-learning-session.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md)

> **Revision 2026-07-11** (scope sharpened by the project owner, still Proposed):
> the dialogue surface is **App-only**. Agent harnesses already have a superior
> flexible phase — the chat beside the review pane can take follow-up questions,
> build visualizations, anything the host model offers — and a fixed App cannot
> replicate that; per [2026-07-11](2026-07-11-codex-and-vscode-companion-surfaces.md)
> the MCP Recall card likewise keeps follow-ups in the agent chat. In the App the
> dialogue opens only **after** answer + AI feedback, so the originally proposed
> assisted-rating cap is obsolete (the pre-answer case cannot arise). Turns are
> **unbounded**, V1 is **conversation-only** (no graph actions from inside the
> thread), and `zam learn` stays unchanged.

---

## Context

Learning in a terminal harness is fast and flexible: the skill's verbal-probing
loop already checks the answer, gives feedback, and can drift into an open
discussion before the rating is submitted — a frontier model hosts the middle of
the flow. The ZAM App cannot do this. The Studio recall session and `zam learn`
run a fixed loop, and although the Studio already inserts one LLM step —
`evaluate-answer` patches AI feedback into the reveal
([2026-06-27](2026-06-27-recall-session-llm-pipeline.md),
[learn.ts](../../src/cli/commands/learn.ts) renders the same feedback block) —
that feedback is **one-shot**. You cannot reply to it, ask "but why?", or pull
the thread before rating. The skill even anticipates this gap: "that richer mode
will later be backed by an LLM"
([SKILL.md](../../.claude/skills/zam/SKILL.md)).

The forces:

- Sometimes `Question → Answer → Rating` is exactly right (speed). Sometimes the
  learner needs `Question → Answer → Feedback → open discussion → rating` — and
  today that is only available inside an agent harness.
- FSRS integrity must survive flexibility: only real recall events may move
  scheduling state, and help received *before* an answer is not the same as
  curiosity *after* it.
- The App must not need an agent harness (with its permission prompts and cost
  profile) just to talk about a card. ZAM already has role-based providers
  ([2026-06-25a](2026-06-25a-machine-local-llm-role-configuration.md)): the
  `recall` role points at a cheap cloud or local model.
- The [2026-06-27](2026-06-27-recall-session-llm-pipeline.md) pipeline (long-
  lived `bridge serve`, session-scoped prompt-prefix cache, prefetch, parallel
  eval) is precisely the machinery that makes multi-turn dialogue cheap: the
  card context is a stable cached prefix; each follow-up turn appends to it.

---

## Decision

### 1. Principle: the review loop is a conversation with checkpoints, not a form

Every review surface implements exactly three hard checkpoints:

1. **Question shown** — spoiler discipline applies before this point.
2. **Answer captured** — the learner's attempt is recorded (typed, spoken, or
   observed).
3. **Rating checked in** — the FSRS transaction; closes the card and returns to
   the queue.

Only checkpoints touch FSRS state. How flexible the stretch between checkpoints
2 and 3 is depends on the surface: in a harness the host chat makes it fully
open (feedback, tangents, visualizations, graph moves such as
`suggest-foundations` / `add-token` / `prereq`); the App gains the bounded
conversational phase defined in Decision 3. The rating is the exit gate — "the
flow can be left by checking in the rating."

The contract already supports this: `get_reviews → … → submit_review` is
stateless and re-entrant (companion ADR
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md)), so an interlude
of thirty seconds or twenty minutes lands the same way.

### 2. The App dialogue is post-feedback only; no assisted flag

The App offers the dialogue only **after** checkpoint 2, together with the
reveal's AI-feedback block. There is deliberately no pre-answer dialogue in the
App, so "help before answering" cannot happen there and the assisted-rating cap
sketched in the original proposal is dropped entirely — no flag, no capped
suggestion, a simpler state machine. In harness sessions the skill rubric
already covers assisted answers ("asked for help → 1", "looked something up →
3"); that stays where it is.

### 3. The App: an open-ended, card-scoped conversation after the reveal

**Surface scope:** this Decision applies to the standalone ZAM App
([desktop/src](../../desktop/src/main.ts)) only — not to harness chat (which
already has a better version of it natively) and not to the MCP Recall card
(follow-ups there belong in the agent chat, per
[2026-07-11](2026-07-11-codex-and-vscode-companion-surfaces.md)).

Behavior:

- With (or after) the AI-feedback block, an input field appears. Each assistant
  reply is followed by a **new input field** — the thread is **not limited to
  one follow-up** and has **no turn cap**; it runs as long as the learner needs.
- The conversation history scrolls upward like a normal chat and can be
  scrolled back at any time within the card.
- The **rating buttons move to the edge** of the card so they never sit in the
  way of the thread; they stay visible throughout. Checking in the rating is
  always one click away, closes the thread, and advances the queue.
- Each turn calls the `recall`-role provider with the card prefix (concept,
  question, learner answer, resolved `source_link` context) plus the thread
  history. When the [2026-06-27](2026-06-27-recall-session-llm-pipeline.md)
  prompt-prefix cache and prefetch land, the thread rides them; it does not
  depend on them.
- **V1 is conversation-only.** The thread does not offer graph actions
  (creating foundation tokens, linking prerequisites) from inside the dialogue;
  graph curation stays in the Studio's existing surfaces and in harness
  sessions.

Because ZAM calls **its own provider in-process**, this involves no agent
harness, no host permission prompts, and cost stays within the cheap-first
provider stance. If no provider is configured/reachable, the input field is
hidden and the flow degrades to today's one-shot feedback.

### 4. Out of scope: harness surfaces and `zam learn`

Harness sessions need no change — the chat beside the review pane *is* the
flexible phase, and the skill rubric already carries the checkpoint semantics.
`zam learn` deliberately stays the simple fixed loop it is today; whether the
terminal ever gets the same thread is a revisit item, not part of this ADR.
(This also answers the [2026-06-27](2026-06-27-recall-session-llm-pipeline.md)
open question "CLI parity" with *no* for the dialogue.)

### 5. Transcripts are ephemeral

Discussion threads live only in the running session. The durable outcomes of a
good discussion are already persisted through existing paths: new foundation
tokens, prerequisite edges, an edited concept, and the rating itself. No new
storage, no new privacy surface, no retention rules. **Revisit trigger:** if
foundation-mining from past discussions becomes a real need, a follow-up ADR can
add opt-in summary capture — full-transcript storage would need
ObserverPolicy-class retention controls and is not planned.

### 6. Provider role: reuse `recall`, keep `tutor` as an open option

The thread uses the `recall` role initially (one less thing to configure). If
discussions turn out to deserve a stronger model than question generation, a
dedicated `tutor` role slots into the existing `providers`/`roles` config
([2026-06-23](2026-06-23-pluggable-providers-and-agent-harnesses.md)) without
schema changes. Open decision, not blocking.

---

## Options weighed

**Status quo (one-shot feedback).** Insufficient — it is the stated gap: no way
to start a discussion about a knowledge question in the App.

**Full embedded agent chat in the App.** Rejected *for this need*: an agent
harness brings permission UX, vendor/cost coupling, and a chat stack — all to
answer follow-up questions about a card. The harness's open-ended flexibility
(visualizations, arbitrary tool use) cannot be replicated in a fixed App and
should not be imitated there. Work-execution chat (T3) stays a separately
deferred decision in the companion ADR.

**Threaded dialogue on the existing recall pipeline.** Chosen: smallest delta
(the second LLM call already exists; this makes it a loop), zero prompts, cheap
per turn thanks to the prompt-prefix cache, and it upgrades the App from
"rating terminal" to a viable primary learning surface.

---

## Consequences

**Easier**
- The App supports the flexible flow that previously required a harness —
  including for the school persona, where a coding harness was never the right
  answer.
- Harness surfaces and skills need no change at all: the host chat already
  implements the open phase, and the rubric already carries the assisted
  semantics. (No skill edits also means no overlap with the 0.10.3 skill work.)
- Dropping the assisted flag and the turn cap removes two state-machine
  concerns from the original sketch.
- The 2026-06-27 investments (long-lived bridge, prompt cache) get a second
  consumer, strengthening the case for that ADR.

**Harder**
- The desktop state machine still grows: thread state and its interaction with
  prefetch/eval-in-flight (`currentCard`, `prefetchedCard`, `evalInFlight` from
  2026-06-27, plus `dialogueThread`).
- Discussion turns cost tokens, and turns are deliberately **unbounded**; the
  bound is economic (cheap `recall` role, cached prefix), not a hard cap.
- Ephemeral means no later analysis of discussions — accepted trade-off
  (Decision 5).

**To revisit**
- A dedicated `tutor` provider role (Decision 6).
- Opt-in summary capture for foundation-mining (Decision 5 trigger).
- `zam learn` terminal parity for the thread (Decision 4).
- Graph actions from inside the thread (V2 candidate; V1 is
  conversation-only per Decision 3).

---

## Action Items

1. [ ] **Bridge: `discuss-review` request** (handler map from companion ADR
   item 1; exposed on `bridge serve` and as a bridge subcommand): input =
   cardId + thread history + new user turn; output = assistant turn. Reuses the
   `evaluate-answer` context assembly; adopts the session prompt-prefix cache
   from [2026-06-27](2026-06-27-recall-session-llm-pipeline.md) when that
   lands.
2. [ ] **App thread UI** ([desktop/src](../../desktop/src/main.ts)): input
   field appears with the AI feedback; a new input field after every assistant
   reply (unbounded turns); history scrolls up and stays scrollable; rating
   buttons relocated to the card edge and persistently visible; thread teardown
   on check-in/skip/stop; affordance hidden when no `recall` provider
   resolves.
3. ~~**`zam learn` `d` action**~~ — dropped in the 2026-07-11 revision
   (App-only scope; see Decision 4 and the revisit list).
4. ~~**Skill invariants note**~~ — dropped in the 2026-07-11 revision: harness
   surfaces already implement the flexible phase natively; no skill change
   needed.
5. [ ] **Tests**: dialogue reachable only after the reveal/feedback, multiple
   consecutive turns work (no cap), thread teardown on every exit action
   (rate/skip/stop), degradation without a provider, no FSRS mutation from
   thread turns.
