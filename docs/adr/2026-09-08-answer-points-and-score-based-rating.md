# Answer Points and Score-Based Rating

**Status:** Accepted — 2026-09-08\
**Date:** 2026-09-08\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-06b-checkpointed-review-dialogue.md](2026-07-06b-checkpointed-review-dialogue.md) ·
[2026-08-14-central-learning-atoms-and-identity.md](2026-08-14-central-learning-atoms-and-identity.md)

---

## Context

The FSRS rating scale is binary before it is graded. `1` records a recall that
failed — missed outright or only partly there — and `2`–`4` all record a recall
that succeeded, differing only in effort. The review surfaces now present that
split as two labelled groups.

The evaluator does not respect the split, because it cannot. It is asked for a
single `suggestedRating: 1 | 2 | 3 | 4`, which conflates two judgements made by
two different parties:

- **Coverage** — did the answer contain what the reference answer requires?
  The evaluator can observe this. The learner is a poor judge of it, which is
  the reason an evaluator exists at all.
- **Effort** — how hard was it to produce? Only the learner can observe this.
  The evaluator sees final text, not the thirty seconds of staring that
  preceded it.

The prompt admits the fabrication in its own wording: *"use 3 when effort is
unknown"* and *"A short correct answer alone does not prove speed."* Effort is
always unknown to it. `reconcileRecallSuggestedRating()` contains the damage by
clamping any partial or incorrect verdict to `1`, but a correct verdict still
carries an invented effort value into the learner's suggested rating.

A second, smaller problem sits on the question side. A learner who does not
know how much is being asked for stops at the first thing they remember. The
reference answer knows how many distinct things it requires; the learner is not
told.

Both problems share a missing concept: the reference answer's **required
points**.

## Decision

### 1. Points are the reference answer's formatting, not a new field

A reference answer authored as a list has one point per list item. A reference
answer authored as prose has exactly one point.

```
Der Satz des Pythagoras:
- gilt nur für rechtwinklige Dreiecke
- a² + b² = c²
```
→ 2 points.

```
Die Hauptstadt von Bayern ist München.
```
→ 1 point.

Rejected: a separate `points` column, and inline annotation markers
(`{{…}}`) inside prose. Both were weighed and lose to formatting for the same
reason — every surface renders the reference answer as `textContent`
(`recall.ts`, `mobile/src/main.ts`, the study window), and the CLI, the Anki
export and the evaluator prompt consume the same plain string. A plain-text
list survives all of them with no rendering work. Annotation would have to be
stripped in each one, and any surface that forgot would show `{{…}}` to a
learner. A stored count would be a second artefact that can drift out of step
with the text it counts; derived points cannot drift, because the text is the
only artefact.

### 2. One point is the norm; more than one is allowed and noticed

A practice item should ask for one thing. Existing items do not always, and
some genuinely cannot be split — a formula and the precondition it only holds
under are one fact together.

So a multi-point answer is **valid**, and the publication check for it is
**non-blocking**: the author is shown that the item asks for more than one
thing and may publish anyway. This is the first non-blocking structural check;
`PublicationCheck.blocking` already carries the distinction.

Prose remains one point, so the existing corpus stays valid without migration.

Once any line is a list item, **only** list items are points: prose around them
is a lead-in or a closing remark. Guessing which unmarked sentences are
load-bearing would make the count depend on paragraph shape, and a count the
author cannot predict is worse than one they opt into.

The notice is only worth having if the author sees it. A non-blocking check
leaves `publication.ready` true, so Studio renders advisory checks in the ready
branch as well as the blocked one.

### 3. The evaluator reports coverage; it no longer proposes effort

The evaluation contract gains `recalledPoints: number` — how many of the
enumerated points the answer contained. The prompt receives the points as an
enumerated list, so identifying them becomes a lookup rather than a
decomposition the model re-derives on every review.

`suggestedRating` is no longer produced by the model. It is derived:

| Coverage | Consequence |
|---|---|
| `recalledPoints < total` | rating `1`; the recall failed |
| `recalledPoints === total` | no suggestion; the learner chooses among `2`–`4` |

The evaluator therefore decides the objective half and the learner decides the
subjective half. Neither is asked for the other's judgement.

`reconcileRecallSuggestedRating()` stays as the guard for replies that omit or
contradict the score, and for the Bloom levels of §5 where no score exists.

The verdict label follows the score too. A reply of `{verdict: "correct",
recalledPoints: 1}` on a two-point card must not read "Correct" above a rating
of `1`; on a scored card the label is derived from coverage, so one judgement
produces one signal.

Two evaluators exist and they land differently. The JSON evaluator shared by
the Recall panel and Mobile carries `recalledPoints`, so those surfaces show a
score. The CLI evaluator behind the study window replies in free prose and has
no structured field to carry one, so it states completeness in words instead
(§7). Deriving a score by parsing that prose would reinstate the fabrication in
a new place, so the study window shows the expected count and no score.

### 4. Partial coverage is rating 1, and nothing else

`3` of `4` points is rating `1`. Coverage does not map onto an intermediate
rating, and no partial-credit arithmetic enters FSRS. The score is feedback and
calibration; the rating is the scheduling input. Mapping a score onto `2` would
reinstate exactly the conflation this ADR removes, with more machinery in front
of it.

### 5. Points are shown as a count, never as content — and not above Bloom 3

When asking, the surface shows *how many* points are expected, never which. The
count is a retrieval-effort cue: a learner who knows three things are wanted
keeps digging past the first. This is a deliberate trade — free recall becomes
cued recall — accepted because the cue calibrates effort without revealing
content.

The count is suppressed above Bloom level 3. "Analyse" and "Synthesise"
answers do not decompose into countable facts, and a fabricated count there
would be worse than none. Those cards keep today's behaviour.

### 6. A wrong reference answer is now more expensive

If the stored answer is wrong, the point count is wrong too, and the error
reaches the learner *before* they answer rather than only in the verdict
afterwards. The mitigations are the ones already in place: the multi-point
notice puts the decomposition in front of the author at publish time, and
inline card editing during a review remains the escape hatch. This ADR accepts
the raised stakes on reference-answer quality rather than adding a mechanism.

### 7. No agent is asked for a rating anywhere — the metric is completeness

The rule is not limited to the JSON evaluator. Every place that asked an agent
or a model for a rating now asks for **complete / incomplete** instead, and on
incomplete, *how many* required elements are missing plus their names in the
feedback:

| Surface | Before | Now |
|---|---|---|
| JSON evaluator (Recall panel, Mobile) | `suggestedRating: 1–4` | `recalledPoints` + `gaps` |
| Prose evaluator (study window, agent harnesses) | `"Suggested rating: N"` | `"Complete"` / `"Incomplete (N)"`, localized |
| `skills/zam/SKILL.md` and its three harness copies | "Propose 1–4 … 4 = effortless complete success" | "State completeness — never a rating" |

Observation synthesis (`src/kernel/observation/session-synthesis.ts`) keeps its
`inferredRating`. It is not an agent judging a recall answer: it is rule-based
evidence from observed commands, and the learner confirms it before anything is
written. Changing it is a separate decision.

### 8. Judge generously — the asymmetry is real

A vague, imprecise or clumsily worded answer that points at the right thing
counts as covering its point, and genuine uncertainty resolves in the learner's
favour.

This is not softness, it is the asymmetry of the two errors. Being told you
failed when you nearly had it discourages, and discouragement does not reverse.
Being told you were complete when you were vague costs one scheduling step —
and the learner keeps the final word: they can mark themselves down when they
know they were guessing, or that they meant something else than what the
evaluator generously read into their words.

The cost is real and accepted: leniency moves some load onto learner honesty,
and a learner who always takes the generous reading will see cards scheduled
further out than their knowledge warrants. That is recoverable through the next
review; a learner who has stopped is not.

## Consequences

- The evaluator stops emitting a value it cannot observe. Suggested ratings
  become derivable and testable rather than modelled.
- `gaps` and `recalledPoints` become two views of one judgement, so a reply
  that lists two gaps against a four-point answer is self-checking.
- Point counts double as an atomicity signal. An item with six points is
  almost certainly several items, and the split tooling already exists.
- The corpus becomes uneven until it is revised: a prose card containing three
  facts counts as one point and is scored as one. This is visible, not silent,
  and the multi-point notice is the path to fixing it.
- Authors gain a formatting obligation for multi-point answers. It is the same
  obligation good cards already meet.
- The prose evaluator's trailing line changes shape. Nothing parses it — the
  harness adapters keep the whole reply and only *document* that line — but
  their comments name the new format so they do not describe a format that no
  longer exists.
- Leniency shifts some accuracy onto learner honesty, deliberately (§8).

## Alternatives considered

**A stored point count.** Rejected: two artefacts, one of which can drift. The
formatting carries the same information and cannot disagree with itself.

**Inline annotation of points inside prose.** Rejected: needs stripping at
every render site (three UIs, CLI, export) and teaches a micro-syntax whose
failure mode is leaking markup to a learner. Where a sentence truly carries two
load-bearing parts, two list items express it without new syntax.

**Blocking multi-point items at publish.** Rejected by the owner: some items
cannot be split, and a blocker would force authors to either lie about the
answer or leave the item unpublished.

**Partial credit into FSRS.** Rejected: reinstates the conflation. See §4.
