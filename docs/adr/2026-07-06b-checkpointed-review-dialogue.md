# Checkpointed Review Dialogue (Question → Answer → Feedback → Open Flow → Rating Check-in)

**Status:** Proposed
**Date:** 2026-07-06
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (companion) ·
[2026-06-27-recall-session-llm-pipeline.md](2026-06-27-recall-session-llm-pipeline.md) ·
[2026-05-30a-standalone-learning-session.md](2026-05-30a-standalone-learning-session.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md)

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

Every review surface (harness chat via the skill, Studio, `zam learn`)
implements exactly three hard checkpoints:

1. **Question shown** — spoiler discipline applies before this point.
2. **Answer captured** — the learner's attempt is recorded (typed, spoken, or
   observed).
3. **Rating checked in** — the FSRS transaction; closes the card and returns to
   the queue.

Between checkpoints 2 and 3 the flow is **unrestricted**: feedback, follow-up
questions, tangents, splitting the token into foundations
(`suggest-foundations` / `add-token` / `prereq` are legitimate interlude
moves). Only checkpoints touch FSRS state; the interlude may mutate the
knowledge graph but never scheduling. The rating is the exit gate — "the flow
can be left by checking in the rating."

The contract already supports this: `get_reviews → … → submit_review` is
stateless and re-entrant (companion ADR
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md)), so an interlude
of thirty seconds or twenty minutes lands the same way.

### 2. Checkpoint order carries meaning: assisted answers cap the suggestion

Discussion *after* answer capture is feedback and costs nothing. Discussion
*before* answer capture is help. If the learner opens the dialogue before
checkpoint 2, the card is marked **assisted** for this review and the *suggested*
self-rating is capped at **2** (matching the skill rubric: "asked for help →
1", "looked something up → 3"). The learner still chooses the final rating —
the cap binds the suggestion, not the choice. The assisted flag is
session-local UI state; it is not persisted (see Decision 5).

### 3. Studio: a card-scoped discussion thread riding the recall pipeline

After feedback (or any time after checkpoint 2), the Studio offers **"ask a
follow-up"**: a thread scoped to the current card, each turn calling the
`recall`-role provider with the cached card prefix (concept, question, learner
answer, resolved `source_link` context) plus the thread history. The rating bar
stays visible throughout; checking in the rating closes the thread and advances
the queue (prefetch of card *N+1* continues underneath, per 2026-06-27).

Because ZAM calls **its own provider in-process**, this involves no agent
harness, no host permission prompts, and cost stays within the cheap-first
provider stance. If no provider is configured/reachable, the affordance is
hidden and the flow degrades to today's one-shot feedback.

### 4. `zam learn` parity

The terminal console gets a `d` (discuss) action after the reveal, entering the
same thread loop in-terminal. It reuses the identical bridge plumbing; the
2026-06-27 open question "CLI parity" is answered *yes* for the dialogue (the
prefetch pipeline remains optional there).

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
answer follow-up questions about a card. Work-execution chat (T3) stays a
separately deferred decision in the companion ADR.

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
- Harness surfaces need no change: the skill's verbal probing already implements
  the checkpointed conversation; this ADR just names the invariants it must
  keep (spoiler discipline before checkpoint 1, assisted semantics before 2,
  rating as the only FSRS mutation).
- The 2026-06-27 investments (long-lived bridge, prompt cache) get a second
  consumer, strengthening the case for that ADR.

**Harder**
- The desktop state machine grows again: thread state, assisted flag, and their
  interaction with prefetch/eval-in-flight (`currentCard`, `prefetchedCard`,
  `evalInFlight` from 2026-06-27, plus `dialogueThread`).
- `learn.ts` gains an interactive sub-loop in a console that is deliberately
  simple today.
- Discussion turns cost tokens; bounded by the cheap `recall` provider, the
  prefix cache, and a per-thread turn cap (default: 10 turns, then suggest
  checking in).
- Ephemeral means no later analysis of discussions — accepted trade-off
  (Decision 5).

**To revisit**
- A dedicated `tutor` provider role (Decision 6).
- Opt-in summary capture for foundation-mining (Decision 5 trigger).
- Whether the assisted cap should distinguish "clarified the question wording"
  (cap 3) from "explained the concept" (cap 2) — start simple with a single
  cap at 2.

---

## Action Items

1. [ ] **Bridge: `discuss-review` request** (handler map from companion ADR
   item 1; exposed on `bridge serve` and as a bridge subcommand): input =
   cardId + thread history + new user turn; output = assistant turn. Reuses the
   `evaluate-answer` context assembly and the session prompt-prefix cache from
   [2026-06-27](2026-06-27-recall-session-llm-pipeline.md).
2. [ ] **Studio thread UI** ([desktop/src](../../desktop/src/main.ts)): "ask a
   follow-up" after reveal, persistent rating bar, assisted flag when the
   thread opens pre-answer, thread teardown on check-in/skip/stop.
3. [ ] **`zam learn` `d` action** ([learn.ts](../../src/cli/commands/learn.ts)):
   same loop in-terminal; hidden when no `recall` provider resolves.
4. [ ] **Skill invariants note** (all flavors, with companion item 5): document
   the three checkpoints and the assisted-rating rule so harness sessions keep
   the same semantics.
5. [ ] **Tests**: assisted cap logic, thread teardown on every exit action
   (rate/skip/stop), degradation without a provider, no FSRS mutation from
   interlude operations.
