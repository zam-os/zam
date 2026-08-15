# Handover — the first field-test slice of the central learning path

**Status:** implementation and source-grounded content review complete on
2026-08-15; the manual device trial is the next empirical validation step.
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
| install a cell | `installKvtTile` | built; bundled selection in Desktop, MCP Studio and Mobile |
| create cards on demand | `materialiseKvtCards` | built; enrolment remains explicit behind the one learner action |
| defer a card by date | `cards.buried_until` / `buried_reason`, honoured by the queue filter | built for hard preconditions with a finite, staggered horizon |
| bonus eligibility + ranking | `bonusCandidates`, `heldAtomIds` | built; accept/ignore surfaces in Desktop, MCP Recall and Mobile |
| item succession | `replaces`, `practice_item_replacements` | built |

So this slice is **surface plus the two scheduling rules**, not new
infrastructure.

## The device question — validate on the real delivery route

Klara's primary device is the school iPad, and the iPadOS companion is
TestFlight-only with an unresolved MDM question. That is a *delivery* risk, not
a build risk: the surfaces below live in the shared mobile code and in Desktop,
both of which already exist. Build them there. But settle the distribution
route as the next empirical step; its findings inform subsequent product work
rather than approving the content.

## Phases

Ordered so something is testable as early as possible. Phases 1 and 2 are
independent and can run in parallel; 3–5 build on 1.

### [x] Phase 1 — get one bundled cell onto a device

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

Implemented and covered by kernel/handler tests. Both native Desktop and the
shared mobile Library now expose the four commit-controlled cells; the MCP
Studio already uses the same bridge contract. The final iPad installation path
still needs the manual trial named above.

### [x] Phase 2 — source-grounded review of the Optik cell

Independent of all code and the error class that reaches the learner directly.
For the initial content build, the accepted quality threshold is careful agent
review against existing primary sources. A physics teacher may improve the
material later, but teacher sign-off is not a release or field-test gate.

- Every anchor resolved against its primary source. The working rule stands:
  no anchor without resolution.
- The known gap is documented and must be handled, not hidden: the
  trigonometric prerequisite of `brechungsindex-bestimmen` cannot be modelled
  while prerequisites must ship in the same tile
  ([Bonus-Notiz §9](../concepts/central-learning-path-bonus-content.md)).
  Narrow the cell or label the gap — ADR 2026-08-14b forbids claiming a
  prerequisite closure the tile does not encode.

**Done when** every shipped scope claim is resolved against a named source,
known gaps are excluded or stated, and automated guards keep the curriculum
bindings and selected scope from silently drifting.

Primary-source resolution is complete: the selected fixture records the
official LehrplanPLUS learning areas 65643 (Physik 7, I) and 65854 (Physik 8,
II/III), checked on 2026-08-15. The selected Realschule scope contains only
atoms 001–003. Formula atom 004 is installed shared knowledge but not enrolled
and is separately grounded in BOS learning area 119285; its earlier
Gymnasium-11/Wellenoptik binding was incorrect. `brechungsindex-bestimmen` is
not in this cell. Automated physics assertions are guards, **not** a teacher
review. Together with the multi-agent review against the named sources, they
meet the owner's initial quality threshold. Later teacher feedback enters as a
content revision rather than retroactively blocking this slice.

### [x] Phase 3 — precondition self-assessment

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

Implemented on all three learner surfaces. Only hard prerequisites can be
assessed; replay cannot extend an expired claim or bury real retrieval
evidence; expired claims enter genuine recall and no longer pollute the
stagger count.

### [x] Phase 4 — pull forward on an empty queue

Also decided, also unbuilt, and small.

- When due and new are both exhausted and the learner wants to continue, admit
  new cards past `maxNew`. `buildReviewQueue` already knows all three counts.
- It must be the learner's choice, not automatic: the daily limit exists for a
  reason and silently ignoring it teaches the learner the number is fake.

**Done when** a finished queue offers "keep going" and produces cards.

Implemented as an explicit choice. New-card acceptance is a session-local
`maxNew` allowance, not a fake due-date mutation; future reviews and active
precondition deferrals are the only persisted pull-forward changes. A pulled
precondition keeps a `precondition_ready` intent marker until its genuine
review, so every surface resumes the requested card instead of repeating the
self-assessment prompt after a restart.

### [x] Phase 5 — tier interaction and the bonus offer

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

The named pilot rule is `tier1-first`: a new Tier-2 synthesis item stays out
while the same atom still has an unseen Tier-1 item. Structured Tier-1 checks
are rendered as one-tap choices in Desktop, MCP Recall and Mobile. Accepted
bonus atoms are excluded from later offers even before their first review;
root atoms and atoms with unheld hard prerequisites cannot be accepted through
the enrolment endpoint.

## Next validation and improvement steps

- [x] Source-grounded agent review of the selected Realschule questions,
  reference answers, reductions and prerequisite scope. The owner accepted
  this as the initial quality threshold on 2026-08-15; teacher review is a
  later improvement path.
- [ ] The complete flow is run on a fresh database on the actual school-iPad
  delivery route: select cell → assess prerequisite → Tier-1/Tier-2 review →
  keep going → ignore/accept bonus.
- [x] `npm run format`, lint, typecheck, full test and build verification are
  required immediately before hand-off (record the final result in the branch
  hand-off). Final result 2026-08-15:
  format, lint, typecheck and build clean; 231 test files passed, 2 skipped,
  with 2235 tests passed and 7 skipped.

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
