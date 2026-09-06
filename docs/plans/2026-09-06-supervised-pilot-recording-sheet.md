# Recording sheet — supervised flashcard-quality pilot

**Protocol version:** 2026-09-06.1  
**Use with:** [2026-09-06-supervised-pilot-protocol.md](2026-09-06-supervised-pilot-protocol.md)

Copy one **session header** plus as many **contact rows** as needed. Fill blanks
during the session. Do not reconstruct missing cells from `response_time_ms`
or from memory the next day. Write `missing` rather than guessing.

Study parameters (primary question, delay, budgets, participant codes) stay
**OPEN** until the owner starts the actual pilot. This sheet is the form, not
a filled run.

## Session header

| Field | Value |
|---|---|
| Protocol version | 2026-09-06.1 |
| Date (ISO, local) | |
| Learner code | |
| Supervisor | |
| Device route | Desktop Studio / Recall panel / Mobile / `zam learn` / Voice / other (name it) |
| Time zone | |
| Library (local path or “default”) | |
| Condition (once assigned) | **OPEN** until randomization exists |
| Learning-goal block | B-pythagoras / B-2 / B-3 / other |
| Mode | flash / answer_feedback / voice / mixed (describe) |
| Model + prompt revision (if a grader ran) | |
| Session id (product) | |
| Active time start | |
| Active time end | |
| Tutor time (min) | |
| Breaks (count + minutes) | |
| Notes | |

## Contact rows

One row per presentation, observation, practice-sheet task, untrained test, or
uninstrumented extra contact. Sibling teaching after a P3 Again that is not a
rated H review is still a row.

| t | kind | item id / task id | atom | content_version | presentation id | attempt id | first answer (verbatim) | hint? | clarification? | reveal at | assistance | independent? | product rating | FSRS written? | skip/abandon | extra contact? | missing |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | | | |

**kind:** `recall` · `observation` · `assisted-record-only` · `practice-sheet` · `untrained-test` · `uninstrumented`

**independent?:** `yes` · `no` · `unknown`  
If `no` or `unknown`, there must be no success rating. Record-only or skip.

**FSRS written?:** copy from the product extract (`review_logs` for that
attempt). If the sheet says a rating was given and the extract has none, stop
and resolve before the next card.

## End-of-session extract (product)

After the session, dump these for the learner and local day and staple them to
the sheet. They must agree.

```
card_presentations: id, attempt_id, card_id, token_id, atom_id, learning_day,
                    reserved_at, presented_at, abandoned_at, session_id
review_attempts:    id, status, rating, actor, independent, channel,
                    assistance, review_log_id, session_step_id
review_logs:        id, card_id, rating, content_version, attempt_id, reviewed_at
session_steps:      id, session_id, token_id, done_by, rating, notes
cards:              id, due_at, reps, lapses, state, buried_reason, buried_until
```

Not in the product, so they stay on this sheet only: first answer, hint,
clarification, reveal time, breaks, tutor time, untrained-test score,
uninstrumented contacts.

## Delayed test (separate sitting)

| Field | Value |
|---|---|
| Sitting date | **OPEN** |
| Delay reference used | **OPEN** |
| Rater (blinded) | **OPEN** |
| Task-bank version | **OPEN** |
| Items administered | |
| Scores | |
| Condition visible to rater? | must be no |

## Abandoned / skipped denominators

Count every shown item, every skip, every walk-away after reveal, and every
queue item never shown. Do not drop abandoned presentations from the
denominator. A reservation that was abandoned **before** display is not a
presentation; it must not appear as one in the report.
