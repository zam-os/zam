# Supervised pilot protocol — flashcard quality contract

**Version:** 2026-09-06.1  
**Status:** technical rehearsal complete; **study parameters remain OPEN** until the owner starts the actual pilot.  
**Implements:** Phase 6 of [2026-09-05-flashcard-quality-contract.md](2026-09-05-flashcard-quality-contract.md).  
**Recording sheet:** [2026-09-06-supervised-pilot-recording-sheet.md](2026-09-06-supervised-pilot-recording-sheet.md).

This protocol prepares a supervised learning pilot. It does not conduct that
pilot. A passing technical rehearsal, a green test suite, or a complete product
log is not evidence of learning effectiveness.

Do not invent participant data. Do not backfill unknown events. Unobserved
cases stay missing data.

## 1. Non-claims

- This slice records independent attempts against a specific item's criterion
  and keeps assisted work off the FSRS path. It does not prove that the new
  channel is well calibrated.
- Pythagoras items that target the same goal are **one** learning-goal block.
  They are not independent topic blocks.
- `response_time_ms` is shown → rating. It is not retrieval time and not
  active learning time.
- Practice-sheet success does not write reviews on H, P1, P2, P3 or U.
- An automated pilot is **not** authorized until first answer, hint, reveal,
  break and task-version events are persisted and verified on every
  participating surface. Manual collection here does not substitute for that.

## 2. Device and learner route

The first pilot uses **exactly one** active device and one database. Two
offline copies of the same library cannot guarantee atom-sibling exclusivity
before sync; do not include that concurrency in a run reported as controlled.

| Field | Value |
|---|---|
| Primary device route | **OPEN** — owner selects one of the supported routes in §7 before first contact |
| Database | **OPEN** — local SQLite library on that device (default). A server DB is out of scope for the first supervised run. |
| Time zone | **OPEN** — the device's IANA zone; queue and admission must share it |
| Learner identity | **OPEN** — one learner code per person; not a display name in the public report |
| Supervisor | **OPEN** |

Recommended default when the owner does not need another surface: **Desktop
Studio study** on the learner's everyday machine, local `~/.zam/zam.db`,
Europe/Berlin or the device zone. That is a recommendation, not a filled
parameter.

## 3. Learning-goal blocks

Specify **several** blocks that are independent of each other. Items of the
Pythagorean atom (P1 formula, P2 area relation, P3 alternative labeling) plus
H and U are **one** block.

| Block id | Goal (one sentence) | Baseline material | New material | Independent of Pythagoras? |
|---|---|---|---|---|
| B-pythagoras | Locate the hypotenuse, state the relation, apply it, and test the converse | Previous J01/J02/J03 cards if the library has them; otherwise none | Tile `de-by:realschule-9-mathematik-pythagoras-trigonometrie` version `2026.09.1`; practice sheet `tests/fixtures/curriculum/de-by-realschule-9-pythagoras-practice-tasks.md` | — (this is the Pythagoras block) |
| B-2 | **OPEN** | **OPEN** | **OPEN** | must be yes |
| B-3 | **OPEN** | **OPEN** | **OPEN** | must be yes |

Further blocks must come from cells that do not share atoms with B-pythagoras.
Do not mint filler items to pad the design.

## 4. Conditions, rubric, presentation

The **new** grading rubric applies in both conditions. Old incorrect grader
ratings (Hard as partial credit, assisted work as 3, clean-exit-0 as 4) are
not a comparable baseline.

| Field | Value |
|---|---|
| Modes in scope | Flash, answer-feedback, and self-rating after reveal. Voice is optional and recorded as a mode, not mixed silently with typed study. |
| Rubric | Criterion = `concept`. Question is the reference. Context is not an extra hurdle. Complete independent success is 2/3/4; missing required content is 1, never Hard. Assisted work is record-only. Effort unknown → suggest 3, learner confirms. No automatic 4. |
| Presentation policy | At most one distinct item of an atom per learner and local learning day. A shown-then-abandoned P1 still occupies the day; a P1 learning step remains allowed. Queue fetch is not a presentation. |
| Practice vs assessment | Practice sheet is teaching/practice. Delayed untrained target tasks are a separate bank. |
| Blinded assessment | **OPEN** — required before first scored delayed test; rater must not see condition |
| Rubric/grader calibration | **OPEN** — one-time check on a small held-out answer set, recorded with model and prompt revision |

## 5. Study parameters — all OPEN until pilot start

Agree these with the owner **before the first learning contact**. Leave them
blank until then.

Choose **exactly one** primary question:

| Option | When to pick it | Margin |
|---|---|---|
| Superiority | New contract should beat the old materials on delayed untrained tasks | **OPEN** (justified d or percentage-point gap) |
| Noninferiority with time savings | Delayed performance may match if active time including tutor time is lower | **OPEN** (noninferiority margin + time saving) |
| Equivalence | Delayed performance should match within a margin; time is secondary | **OPEN** (equivalence bounds) |

| Field | Value |
|---|---|
| Primary question | **OPEN** — one row from the table above |
| Test delay | **OPEN** |
| Delay reference point | **OPEN** — last study contact of that block / switching time / other |
| Repeated equivalent test instances | **OPEN** — versioned items, not the same wording as study cards |
| Untrained target-task bank | **OPEN** — separate from the practice sheet |
| Randomized staggered switching times | **OPEN** |
| Active time budget per block, including tutor time | **OPEN** — equal across conditions |
| Break and skip policy | **OPEN** |
| Additional contacts (work, homework, sibling exclusion teaching) | record every one; they do not count as a second independent review of a different sibling on the same day |

## 6. What the product records vs what the supervisor collects

| Measure | Product after this slice | External (this protocol) |
|---|---|---|
| Rating, FSRS history, `content_version` | `review_logs`, cards | — |
| Attempt identity, channel, actor, assistance, independence | `review_attempts` | confirm independence when the product has `unknown` |
| Presented item, learning day, sibling occupation | `card_presentations` | uninstrumented contacts (other device, paper, tutor board) |
| First answer, hint, clarification, reveal timestamps | not persisted as events | recording sheet, live |
| Actual task variant, model/prompt version, mode, initial card state | `content_version` plus settings if read at session start | recording sheet |
| Active learning time including tutoring, breaks, skip denominators | `response_time_ms` is not a substitute | time tracking |
| Delayed untrained performance | not in product | task bank + blinded scoring |
| Application at work | synthesis/record-only when submitted | every opportunity including failures and “no chance to try” |

Extract for a rehearsal or session: presentations, attempts, review logs and
session steps for that learner and day. The extract must match the sheet.
Where they disagree, the sheet wins for missing product events; the product
wins for FSRS facts.

## 7. Supported and unsupported routes

Established by the technical rehearsal (code paths plus kernel run on a test
library). Surfaces not listed as supported are **unsupported** for a
controlled run — do not claim parity.

### Supported (instrumented enough for the supervised pilot)

| Route | Admission | Sibling rule | Reveal after a Tier-1 choice, correct **and** incorrect | Ratings / record-only |
|---|---|---|---|---|
| Desktop Studio study | yes | yes | yes — option click always reveals; concept is written into `#reveal-content-list` regardless of correctness | yes |
| Desktop Recall panel (MCP App) | yes | yes | yes — option click always `showReveal`; concept hits the DOM only then | yes |
| Mobile review | yes | yes | yes — option click always reveals; `expectedAnswer` is the concept | yes, and rating is refused until reveal |
| `zam learn` | yes | yes | typed-answer path always `formatReveal` after the answer; **no binary-choice UI** | yes |
| Voice on Desktop/Mobile | yes (via the host adapter) | via host | spoken answer always calls `revealAnswer`; **no binary-choice UI** | yes |

### Unsupported or partial — do not include in a controlled automated run

| Route | Limit |
|---|---|
| `zam review` | Admits before display, but goes question → rating with **no reference reveal** |
| `zam session` repetition phase | Same: question → `runInteractiveReviewAction`, no `formatReveal` |
| MCP chat verbal probing | Agent may speak a reference answer; that is not a product reveal event and is not logged as one |
| `zam_get_reviews` / bridge `get-review` | Raw tool payloads may contain the criterion; that is not a learner presentation |
| Two offline library copies | No global sibling exclusivity |
| Studio bulk `--apply-published` | Bridge flag only; Studio publishes per card |
| Paper / tutor-board / other-device contacts | Uninstrumented; sheet only |
| Practice sheet | Not an FSRS surface |

Tier-1 **binary choice** reveal is verified on Studio, Recall panel and Mobile.
CLI and Voice reveal the criterion after a produced answer, not after a
two-button choice.

## 8. Technical rehearsal

Run: `tests/kernel/quality-contract-rehearsal.test.ts` plus the reveal tests
named in §7. The rehearsal uses a **test library**, not a personal library.

Covered on the test library:

1. Draft → structural publish → card becomes queue-eligible.
2. P1 shown and left unrated → P2/P3 refused the same local day; P1 may be
   admitted again (same pending attempt until it is rated or recorded).
3. Next local day: H1 deferred as `precondition`; P3 Again lifts only that
   matching deferral; H1 FSRS fields stay put; P1 is not put into relearning.
4. Assisted user step on an open session: session step + recorded attempt, no
   review log, no FSRS change.
5. Independent rating: one review log, FSRS advances.
6. Same observation evidence submitted twice after `session_end`: one review,
   one FSRS step, second call is a replay.

The rehearsal does **not** enrol a real learner, randomize conditions, or
score delayed tasks.

## 9. Authorization

| Gate | State |
|---|---|
| Protocol + recording sheet usable | yes, this version |
| Technical rehearsal | yes, this PR |
| Supported routes and measurement limits named | yes, §6–§7 |
| Study parameters filled | **OPEN** — blocks start of the actual pilot, not of this PR |
| Automated pilot | **not authorized** |

## Citations

- Plan: `docs/plans/2026-09-05-flashcard-quality-contract.md` Phase 6
- RFC: `docs/concepts/flashcard-generation-and-decomposition-strategy.md` §7–§8
- Practice sheet: `tests/fixtures/curriculum/de-by-realschule-9-pythagoras-practice-tasks.md`
