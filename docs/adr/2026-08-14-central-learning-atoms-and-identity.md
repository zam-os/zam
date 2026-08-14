# Five-Object Learning Model and Reactive Scheduling

**Status:** Accepted (2026-08-14)  
**Date:** 2026-08-14  
**Deciders:** Thomas (project owner)  
**Split note:** This ADR originally also decided published atom identity and
SKOS alignments. Those are unsettled and moved to
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md) with status
`Proposed`. What remains here is decided and implemented.  
**Related:**
[2026-08-14b-published-atom-identity-and-alignment.md](2026-08-14b-published-atom-identity-and-alignment.md) ·
[2026-07-26b-central-curriculum-content-service.md](2026-07-26b-central-curriculum-content-service.md) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md) ·
[2026-07-04-hierarchical-domain-ontology-and-token-identity.md](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)

---

## Context

ADR [2026-07-26b](2026-07-26b-central-curriculum-content-service.md) established
that the central curriculum service delivers content only — anonymous,
read-only, CDN-distributed — while all learning state stays on the learner's
device.

Cross-agent design rounds (Gemini, Grok, Codex, Claude Opus) plus an owner
round resolved two questions that do not depend on how a published atom is
identified:

1. **What kinds of object exist**, so that an official curriculum section, a
   language-neutral learning objective, a concrete recall task and a personal
   scheduling record stop being conflated.
2. **How a learner enters a large prerequisite graph** without either being
   walled off behind hundreds of unproven foundations or having memory state
   fabricated for them.

## Decision

### 1. The five-object model

| # | Object | What it is | Identity |
|---|---|---|---|
| 1 | **LearningAtom** | Language-neutral learning objective in the universal DAG. Carries prerequisites, reduction profile, typical minimum age. | see [2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md) — **open** |
| 2 | **ConceptAlignment** | Typed link to an external vocabulary or another objective. | semantics **open**, see 2026-08-14b |
| 3 | **CurriculumBinding** | n:m attachment to an official standard: provider, school type, grade, track, topic code, exam relevance. | `(atom, provider, topic_code, grade, track)` |
| 4 | **PracticeItem / Token** | Concrete, language-specific recall task: question, reference answer, Bloom level, interaction tier. | ULID |
| 5 | **PersonalCard** | Per-user FSRS-6 scheduling record, local to the device. | ULID |

Two conflations are hereby rejected and must not return:

- An official Lernbereich is **not** the smallest learning objective. One
  section routinely decomposes into several atoms.
- A learning objective is **not** the same thing as a concrete question, nor as
  a personal review state. Today's `tokens` row is object 4, not object 2.

`tokens.provider` / `tokens.topic_id` remain as a legacy 1:1 projection of
object 3. They are written deterministically from the full stored binding set
and are scheduled for replacement by binding-based queries.

### 2. Reactive scheduling; no proactive gate

- **No admission gate.** An unmet prerequisite does not bar a dependent token.
  The graph influences *selection and order*, never access.
- **Preconditions are materialised on demand.** Cards are created for the direct
  preconditions of tokens a learner actually encounters — never for the
  transitive hull.
- **Precondition self-assessment sets a date and nothing else.** It writes
  `cards.buried_until` / `buried_reason` only. Never `stability`, `difficulty`,
  `reps`, `state`, or a `review_logs` row. The card stays `new` and FSRS
  cold-starts on first real contact.
- **Every buried card is eventually asked.** The horizon expires, or the learner
  empties the queue and asks for more. Both end in a genuine retrieval.
- **Empty queue.** When the queue runs dry and the learner wants to continue,
  buried precondition cards may be pulled forward.

Rationale: an entry assumption does not need to be *correct*, only cheaply
falsifiable. ZAM already owns the falsifier (`cascadeBlock`), so it can afford a
generous assumption where a placement test would have to be right once.

### 3. Content install never enrols

Installing published content and enrolling a learner are separate operations.
Installation writes atoms, bindings, edges and practice items and creates zero
cards; materialisation is explicit and scoped. A tile may legitimately carry
atoms outside a given learner's curriculum, and they must not become that
learner's cards.

### 4. Diagnostic triage is a knob, not a kernel invariant

`cascadeBlock` currently treats every `Again` as a missing foundation. Whether
to first check the direct prerequisite — pass, keep it buried; fail, surface it
— is a behaviour knob. The default stays the current cascade until field
`review_logs` show that "foundation intact, application failed" is common. The
measurement is the share of failures where the surfaced foundation then passes
first try.

## Consequences

- Learners start in any grade immediately, with no entrance exam and no wall of
  known material.
- A wrong entry assumption costs at most one late card and one detour. It can
  never cost a fabricated memory estimate, because nothing below an observed
  retrieval writes FSRS state.
- One canonical atom binds cleanly to several grades and tracks — Optik is
  required in Realschule Bayern grade 7 (Zweig I) and grade 8 (Zweig II/III),
  which is the same objective at two grades and therefore proof that grade
  belongs to the binding, not to the atom.
- Curation must author practice items per atom. Whether **both** a Tier 1 and a
  Tier 2 item are required per atom is **not decided here** — see 2026-08-14b,
  open question 5.
- Ordering (topology versus due date) is stated as a direction, not a
  calibrated rule — see open question below.

### 5. Topology orders exploration; due dates order retention

The owner's earlier "topology weighs more than due date" was **withdrawn on
2026-08-14** once it became clear it collapsed two opposite orders into one. It
applied to the exploration of new content, not to review.

- **Retention (due cards).** The due date decides. Every day past due costs
  retention, and securing what a learner already holds is a goal in its own
  right. Topology does not reorder due reviews.
- **Acquisition and exploration (new cards).** Topology decides: foundations
  before dependents, and — for optional content — reachability and leverage
  (see below).

Whether a *frontier-first* rule for due reviews (test the most advanced due
node; on success defer its due ancestors within the session) beats plain
due-order remains an untested hypothesis. It is to be settled by replaying
existing `review_logs`, not by argument, and nothing may hard-code it first.

### 6. Optional content may be offered as a bonus

Atoms outside the learner's current curriculum cell — a neighbouring track, a
later grade, another school type — may be **offered**, never scheduled. The
graph decides what is offerable (its hard prerequisites are already held) and
what is worth offering (how much it eases later acquisition).

This is the constructive counterpart to the install/enrol split in Decision 3:
the same out-of-curriculum atom that must never *silently* become a card is
legitimate content the moment the learner chooses it.

The motivational design is constrained, because it can backfire — see
[central-learning-path-possession.md](../concepts/central-learning-path-possession.md).
