# Handover — the first field-test slice of the central learning path

**Status:** not started. The architecture round is closed; this is the build.
**Branch:** `feat/central-learning-field-test`, on top of `3edf7b3` — the
squashed merge of the architecture work (PR #300).
**Goal:** one learner, one bundled cell, a loop that works end to end — the
thing that produces the feedback everything after this depends on.

This document is harness-agnostic: Claude Code, Antigravity, Codex or a human
can pick it up. **One branch and one PR for the whole slice** — commit each
phase onto it rather than opening a branch per phase.

## Why this and not more architecture

There is no learner feedback without something a learner can use, and no
evolutionary development without feedback. The owner closed the architecture
round on 2026-08-14 for exactly that reason. Everything still open in
[ADR 2026-08-14b](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
is a gate before *distribution*, not before this slice — read the staging table
there before reopening anything.

What is already decided and already built is listed in
[the handover](../concepts/central-learning-path-status.md) §7. Do not rebuild
it. In particular the kernel primitives this slice needs all exist:

| Needed | Exists as | State |
|---|---|---|
| install a cell | `installKvtTile` | built, no surface |
| create cards on demand | `materialiseKvtCards` | built, no surface |
| defer a card by date | `cards.buried_until` / `buried_reason`, honoured by the queue filter | built, nothing writes it for preconditions |
| bonus eligibility + ranking | `bonusCandidates`, `heldAtomIds` | built, no surface |
| item succession | `replaces`, `practice_item_replacements` | built |

So this slice is **surface plus the two scheduling rules**, not new
infrastructure.

## The device question — resolve before phase 1 lands

Klara's primary device is the school iPad, and the iPadOS companion is
TestFlight-only with an unresolved MDM question. That is a *delivery* risk, not
a build risk: the surfaces below live in the shared mobile code and in Desktop,
both of which already exist. Build them there. But settle the distribution
route in parallel — a finished slice nobody can install is not a field test.

## Phases

Ordered so something is testable as early as possible. Phases 1 and 2 are
independent and can run in parallel; 3–5 build on 1.

### Phase 1 — get one bundled cell onto a device

Without this there is nothing to learn and no other phase can be tried by hand.

- A **selection** surface, not an import surface: a short list of the four
  bundled fixtures with title and grade, one action each. No file picker, no
  URL field, no manifest, no signature — ADR 2026-08-14b blocks all of them at
  the publication gate, and a file picker is the exact thing that crosses it.
- Install (`installKvtTile`) and enrol (`materialiseKvtCards`) are two steps
  and must stay two: installing content enrols nobody. The surface may present
  them as one action, but it must not collapse them in the kernel.
- Re-selecting an installed cell is a no-op that says so. The installer is
  idempotent; the UI should not imply a second copy was made.
- Desktop first (Studio-first for learner-facing setup), then mobile.

**Done when** a learner picks "Optik — Realschule 8" on a fresh database and
gets a queue.

### Phase 2 — subject-matter review of the Optik cell

Independent of all code and the only error class that reaches the learner
directly. It needs a physics teacher's eyes, not an agent's.

- Every anchor resolved against its primary source. The working rule stands:
  no anchor without resolution.
- The known gap is documented and must be handled, not hidden: the
  trigonometric prerequisite of `brechungsindex-bestimmen` cannot be modelled
  while prerequisites must ship in the same tile
  ([Bonus-Notiz §9](../concepts/central-learning-path-bonus-content.md)).
  Narrow the cell or label the gap — ADR 2026-08-14b forbids claiming a
  prerequisite closure the tile does not encode.

**Done when** a subject-matter reviewer signs off, or the cell is narrowed to
what they will sign off on.

### Phase 3 — precondition self-assessment

Decided on 2026-08-14, never built. Today the deferral exists only on paper.

The owner's rule, restated so it is not re-derived: cards for prerequisites are
created; the learner may say "I already have this"; that defers the card rather
than deleting it, and **even a maximum self-assessment gets asked eventually**.
The point is that four preconditions must not all block progress at once.

- Kernel, not UI: a function that takes the learner's assessment and writes
  `buried_until` plus `buried_reason = 'precondition'`. Nothing else — no FSRS
  field is touched by an assessment, because nothing was retrieved.
  `heldAtomIds` already refuses to count such a card as held; keep it that way.
- The horizon is the whole mechanism. Pick one, name it in the code, and make
  it a single constant somebody can change after feedback — this is cheap to
  change and learner feedback decides.
- Surface: asked once, at the moment the prerequisite would otherwise be
  scheduled, in the learner's own words. Not a settings screen.

**Done when** a learner can decline four preconditions, keep working, and still
meet all four later.

### Phase 4 — pull forward on an empty queue

Also decided, also unbuilt, and small.

- When due and new are both exhausted and the learner wants to continue, admit
  new cards past `maxNew`. `buildReviewQueue` already knows all three counts.
- It must be the learner's choice, not automatic: the daily limit exists for a
  reason and silently ignoring it teaches the learner the number is fake.

**Done when** a finished queue offers "keep going" and produces cards.

### Phase 5 — tier interaction and the bonus offer

The last two, deliberately: both are improvements to a loop that must first
work.

- **Tier.** `tier` and `fast_check` are persisted (M025) and rendered nowhere;
  `materialiseKvtCards` currently materialises Tier 1 and Tier 2 together. The
  field test needs one explicit, measurable pilot rule for presentation and
  progression — write the rule down where the code implements it, so feedback
  can falsify a named rule rather than an accident.
- **Bonus.** `bonusCandidates` is a pure derivation with no surface. An offer
  the learner can accept or ignore — never scheduled work, never a score, and
  never framed as accumulating possession: that framing was rejected on the
  owner's values grounds and must not return through the UI. The honest
  sentence is what the offer rests on and what it opens, both of which the
  derivation already returns (`restsOn`, `unlockCount`).

**Done when** a learner sees an offer, ignores it once, accepts it once, and
neither changes their due work.

## Standing constraints for whoever picks this up

- Learning logic goes in the **kernel**; surfaces stay thin. Both scheduling
  rules above are kernel work with a UI on top.
- **No new dependencies** without Thomas's approval. A `package.json` change is
  a red flag in review.
- Schema changes go in **both** `src/kernel/db/schema.ts` and a numbered
  idempotent M-series migration.
- `zam bridge` emits JSON only. Everything on GitHub is English.
- Ease of use is a first-class requirement, not polish afterwards. Many
  learners never open a terminal, and this one is fifteen.

## What is explicitly not in this slice

Scanner, CDN, signatures, release manifests, a second publisher, cross-package
prerequisites, alignment-schema work, the reduction vocabulary, and any general
file or network import. Each has a named trigger in ADR 2026-08-14b; none of
them is this.
