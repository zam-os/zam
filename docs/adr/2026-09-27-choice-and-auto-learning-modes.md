# Choice and Auto Learning Modes

**Status:** Implemented — 2026-09-29 (PR #369). Accepted after review rounds 1
and 2; the Studio and Mobile ship both modes. Not yet built: the "ready for
free recall" session line on Mobile.\
**Date:** 2026-09-27\
**Deciders:** Thomas (project owner)\
**Implementation plan:** [2026-09-27-choice-and-auto-learning-modes.md](../plans/2026-09-27-choice-and-auto-learning-modes.md)\
**Related:**
[2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md) ·
[2026-08-09](2026-08-09-free-offline-learning-and-anki-interoperability.md) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) ·
[2026-09-08](2026-09-08-answer-points-and-score-based-rating.md) ·
[flashcard quality RFC](../concepts/flashcard-generation-and-decomposition-strategy.md)

> **Revision after review round 1** (Gemini, Grok; PR #368). Five changes:
>
> - A correct choice no longer holds a mature card's full interval. It never
>   books more than 20 days (Decision 4).
> - A choice no longer sets or lowers difficulty (Decision 4).
> - Auto asks for free recall one review before a choice would reach the
>   ceiling, and keeps a card in free recall from then on (Decision 8).
> - Options chosen from other items are scoped to the learner and filtered like
>   generated options (Decision 6).
> - Three statements about the evidence were corrected: Smith & Karpicke 2014,
>   RemNote, and the scope of Yang et al. 2021.
>
> **Revision after review round 2** (MiMo, which reviewed the first version).
> Five changes:
>
> - Cards that plain Choice cannot ask as a choice are asked as Flash, so the
>   modes no longer contradict each other (Decisions 6, 8, 9).
> - A dispute writes a `choice` rating, so the ceiling still applies
>   (Decision 7).
> - Options from other items come only from items the learner has already
>   met (Decision 6).
> - The checks run again on the set actually shown, and a card with one usable
>   distractor is asked in a recall format (Decisions 2, 6).
> - `choice` rows are excluded from parameter fitting, the ceiling is named an
>   engineering hypothesis, and Rowland 2014 is cited for its checked direction.
>
> **Owner decision after round 2:** tier-1 taps in the answer modes fall under
> the ceiling as well (Decisions 1, 4, 5, 9).

---

## Context

ZAM has three learning modes (`src/kernel/scheduler/study-settings.ts`):

- **Flash** reveals the reference answer; the learner rates their own recall.
- **Answer with AI feedback** (`answer_feedback`) takes a typed or spoken
  answer. An evaluator judges coverage, and the learner still rates effort
  (ADR 2026-09-08).
- **Answer with question variations** (`answer_variation`) does the same with
  generated question wording.

There is a gap between them. Flash depends on honest self-assessment, which is
hardest for exactly the learners who most need feedback. The answer modes
depend on typing — a real burden on a school tablet — and on a model call for
every review. Neither mode gives a learner who does not want to type an
objective right or wrong.

Choice items already exist in a narrow form. Tier-1 practice items carry a
`binary_choice` fast check — 651 of 651 in the curriculum fixtures. The answer
modes show it as one-tap options; Flash hides it. After the tap the learner
still rates themselves. The flashcard quality RFC recorded the consequence: a
guessed correct choice can earn a successful FSRS rating, and the scheduler
cannot see the guess. The RFC deliberately left a new study mode undecided.

### Evidence

Multiple choice is legitimate retrieval practice, with known limits.

- **It works in classrooms.** A meta-analysis of 222 classroom studies found
  an overall testing effect of g = 0.50, and g = 0.57 for multiple-choice
  quizzes (Yang et al. 2021). Recognition and recall practice gave similar
  gains on classroom exams — 0.52 and 0.52, and 0.61 and 0.54 with feedback.
  Those exams often used the practice format, so this does not show that
  choice practice transfers to later free recall; the format result below
  does. In grade-7 science and high-school history, multiple choice with
  feedback matched short-answer quizzing on unit exams (McDermott et al. 2014).
  Laboratory evidence leans the other way: a meta-analysis found larger
  benefits from recall than from recognition practice (Rowland 2014).
- **Feedback and repetition carry the effect.** Quizzes help with feedback
  (g = 0.54) far more than without it (0.37). One quiz gives 0.44, three or
  more give 0.64 (Yang et al. 2021). A cheap format buys repetitions.
- **Format mismatch costs.** When the practice format matched the exam format
  the effect was 0.53; when it did not, 0.40 (Yang et al. 2021). Recognising
  an answer is not the same as recalling it.
- **Lures are learned.** Learners who read false alternatives later produce
  them as answers, and more alternatives make it worse (Roediger & Marsh
  2005). Lower-achieving high-school students showed net costs from
  multiple-choice testing when no feedback followed (Marsh et al. 2009).
  Feedback removes most of the harm (Butler & Roediger 2008).
- **Feedback content matters.** Elaborated feedback reaches 0.49, the correct
  answer alone 0.32, and right/wrong alone 0.05 (Van der Kleij et al. 2015).
  Explanations help most on new inference questions (Butler, Godbole & Marsh
  2013).
- **Three options are enough.** Going from four to three options leaves
  difficulty, discrimination and reliability essentially unchanged, while two
  options cost reliability (Rodriguez 2005). On average only 1.5 distractors
  per item are chosen by at least 5 % of examinees; only 14 % of items have
  three such distractors (Tarrant et al. 2009). Three-option items take less
  time to answer (Schneid et al. 2014).
- **Choice approaches recall under conditions.** Competitive distractors bring
  choice closer to recall and even strengthen related knowledge (Little et al.
  2012). Adding a recall attempt to choice practice gave little or no
  advantage in three of four experiments. In the fourth, once initial recall
  succeeded, short-answer and hybrid practice beat plain multiple choice
  (Smith & Karpicke 2014). Retrieval success matters, which argues for asking
  for free recall once a card is answerable.
- **Machine-written items need checking.** In one study, 49 % of
  model-written questions had item-writing flaws and 22 % had factual errors
  (Camarata et al. 2025). Language models also favour particular answer
  positions (Zheng et al. 2024; Tang et al. 2026).
- **Comparable products treat choice as a stage.** Quizlet Learn and Memrise
  move from multiple choice to typed answers. RemNote pre-selects "Forgot" or
  "Recalled with effort" — its third, Good-level grade — for a
  multiple-choice answer and lets the learner override it. FSRS publishes no
  guidance for multiple choice.
- **No study tests a ceiling.** No study we found examines capping scheduler
  stability that was earned by recognition. The ceiling below is an
  engineering hypothesis; the falsification checks exist to test it.

### What the scheduler would do

The following was simulated with ZAM's default FSRS-6 parameters
(`src/kernel/scheduler/fsrs.ts`), for a new card answered correctly every time:

| Mapping of a correct choice | Course of the card | Problem |
|---|---|---|
| Good, unrestricted | 10 min → 2 → 11 → 46 → 163 → 498 days | five taps shelve a card for half a year |
| Hard | repeats its learning step forever; difficulty climbs to 9.9 | the card never graduates |
| Good, only the interval capped at 20 days | stability keeps growing behind the cap — 276 days after eight choices and still climbing; one recall success then schedules 329 days | recognition inflates the recall estimate |
| Good, stability held above 20 days (first version of this ADR) | 10 min → 2 → 11 → 20 → 20 …, but a card at 260 days is re-booked for 260 days on one tap | one lucky tap shelves a mature card |
| **Choice, as decided** (Decision 4) | 10 min → 2 → 8 → 20 → 20 …; a card at 260 days returns every 20 days and keeps its 260 | — |
| **Auto, as decided** (Decision 8) | choice 10 min → 2 → 8, free recall on day 10: Good → 26 → 74 → 189 days, Easy → 42 | — |

**Guessing is bounded by the rules.** It does not need a count. A pure guesser
reaches Choice's ceiling with four correct taps: 1.2 % at three options, 6.25 %
at two. The curriculum's tier-1 items have two options. Auto asks for free
recall after three correct taps, which a guesser reaches with 3.7 % or 12.5 %;
that free-recall question is the one they cannot guess. For comparison,
unrestricted FSRS shelves a card for half a year after five taps: 0.4 % or
3.1 %. These figures assume blind guessing; a learner who can rule out one of
three options faces the two-option odds.

**The lasting risk is systematic.** Recognising an answer does not show that
it can be recalled, and every round of feedback makes the correct option more
familiar. More successful choices do not shrink that error.

## Decisions

### 1. Two new modes: Choice and Auto

`StudyLearningMode` gains `choice` and `auto`. Both are opt-in. The existing
modes and their contextual defaults are unchanged: Flash without an
evaluator, the answer mode with one.

| Mode | Label (de / en) | What the learner does |
|---|---|---|
| `choice` | 🔘 Auswahl / Choice | picks one of three options; no typing, no self-assessment |
| `auto` | 🔄 Auto / Auto | choice while a card is new, free recall from the moment it can be asked (Decision 8) |

The in-session switcher offers ⚡ Flash · 🔘 Auswahl · 💬 KI · 🔄 Auto.
`answer_variation` remains a Settings choice.

A mode still decides how a surface gathers evidence. Decision 4 adds one
scheduling consequence, keyed not on the mode but on how the card was
answered: it applies to every rating that rests on a tapped option.

### 2. Three options

A choice shows the correct answer and two distractors. Existing binary fast
checks keep their two options. A curated item may carry up to four options
when every distractor is plausible. No surface pads a set with weak options:
a card with only one usable distractor is asked in a recall format.

### 3. Grading without self-assessment

| Learner action | Rating |
|---|---|
| picks the correct option | `3` Good |
| picks a distractor | `1` Again |
| taps "Weiß ich nicht" / "Don't know" | `1` Again |

A choice never produces `2` or `4`. Effort is not observable (ADR 2026-09-08),
and Hard would keep a new card in its learning step while raising its
difficulty.

"Don't know" exists so that nobody has to guess, and so nobody endorses a lure
by guessing. There is no "I guessed" control after a correct answer: that
would bring self-assessment back. Decisions 4 and 8 limit what a lucky guess
can cost.

The rating is derived at the tap. It is written when the learner moves on —
checkpoint 3 of ADR 2026-07-06b — so a dispute (Decision 7) can still change
it. The follow-up chat never does.

### 4. A tapped answer builds stability to 20 days and never books longer

After FSRS has scheduled a successful answer that rests on a tapped option — a
`choice`, or an `options` tap the learner then rated (Decision 5):

```
S_stored = min(S_fsrs, max(CHOICE_CEILING_DAYS, S_old))      CHOICE_CEILING_DAYS = 20
interval = nextInterval(min(S_stored, CHOICE_CEILING_DAYS))   (long-term reviews only)
```

**How this applies:**

- **Steps keep their timing.** Learning and relearning steps keep their minute
  intervals. The interval rule applies only when FSRS returns a long-term
  review.
- **Difficulty is not lowered.** A new card answered by a tap starts at
  FSRS's initial difficulty for Hard (5.1 with the default parameters),
  instead of Good's 2.1. Later successful taps leave difficulty unchanged,
  whatever grade the learner gave after an `options` tap. A tap says nothing
  about how hard recall is, so only free recall may change difficulty on
  success.
- **Misses are ordinary.** A distractor, "Don't know", or Again after a tap is
  an ordinary lapse, and difficulty updates as FSRS defines.
- **Free recall is untouched.** Flash ratings and typed or spoken answers
  schedule exactly as today.

**Each consequence is intended:**

- **Taps alone never make a card mature.** Stability built by taps stays
  at or below 20 days, below the 21-day maturity threshold used by statistics
  (`stability >= 21`). A test pins the ceiling below that threshold;
  calibrating it higher means changing the maturity definition with it.
- **No tapped answer is booked beyond 20 days.** One lucky tap on a mature
  card brings it back within 20 days.
- **Earned stability is kept.** Stability earned by recall is neither lowered
  nor raised, so the next free recall continues from it.
- **The rule needs no history lookup.** It reads only the card's state.

The constant is not a learner setting. It is to be calibrated against field
review logs.

### 5. Every review records how it was answered

`review_logs` gains `answer_format`:

| Value | Meaning |
|---|---|
| `recall` | the learner answered freely — Flash, or a typed or spoken answer — and the rating is theirs |
| `options` | options were shown, then the learner rated after the reveal (today's tier-1 tap in the answer modes) |
| `choice` | the rating was derived from the selected option |
| `NULL` | history before this change; those ratings were learner-rated and count as `recall` for these rules |

Decision 4 reads `choice` and `options`; Decision 8 reads `recall`.

The review attempt's evidence records:

- the options shown and where each came from;
- the chosen option and the correct option;
- any dispute;
- whether an evaluator judged a free answer.

The records serve statistics, the distractor analysis of Decision 6, and the
falsification checks below. Later FSRS parameter fitting must exclude
`choice` and `options` rows. Recognition inflates their pass rate, and a
`choice` row stores a clamped stability, which is not an FSRS outcome.

### 6. Where options come from

The first available source wins.

**1. Curated.** Options authored and reviewed with the content. Today this is
the tier-1 `fast_check`, which is item substance (ADR 2026-08-14 Decision 7).
Curated options for recall items ship in tiles as presentation data. This is
the route for bundled curriculum cells and for iPads without a model. The
review contract's fast check is generalised beyond `binary_choice` to carry
up to four options; `presentFastCheck()` remains the permutation.

**2. Derived, without AI.** Answers of other items. They are computed per
learner when the card is presented, and never shared.

- **Donors.** Only items this learner has already been presented, in the
  knowledge context being studied. Never an item the learner has not met: the
  contrast line shows a derived distractor's own question, which would spoil
  later material and plant a lure.
- **Ranking.** Closeness to the correct answer — by stored embeddings where
  present, otherwise by domain and form — with a similar length and answer
  type.
- **Exclusions.** The item's own atom and sibling group, and every candidate
  that fails the deterministic checks of source 3.
- **Filtering.** A derived set passes the deterministic checks of source 3
  and nothing more; the reject filter runs on generated candidates only
  (amended 2026-09-29, below). Dispute and retirement are the safeguard: a
  different correct answer, such as Neon for "a noble gas", survives any
  string check.
- **Explanation.** It comes free: "This answers: <the other question>".
  Vocabulary and imported Anki decks fit well.

**3. Generated.** Any other suitable item gets options from the `text` role,
ZAM's content-generation role.

- The model writes four to six candidates, each with a one-line reason.
- A second call, the **reject filter**, answers the question from the shuffled
  set and discards every candidate it considers correct. A different model is
  preferred for it when one is configured. Its verdicts are logged, so that
  samples can be audited.
- Deterministic checks reject duplicates, options equal to or containing the
  answer after normalisation, "all/none of the above", negation tricks and
  length outliers.
- This budgets two `text` calls per item, once. They run ahead of the review,
  for queued cards.
- The learner's AI tier preference applies (ADR 2026-08-09c). On an iPad set
  to `device-only` there are no generated options, only curated or derived
  ones, or a recall format.

**4. None available** — offline, no model, or too small a domain. The card is
asked in a recall format — Flash in plain Choice, free recall in Auto — with a
short notice.

**The generated cache.** Generated options are a rebuildable presentation
cache, not item substance.

- They are keyed to the item and the text of its question and answer, and
  regenerated when either changes.
- They contain only the item's own content, so the library shares them.
- Unlike a `fast_check` change, regenerating them never makes a card due.
- They live in the library database beside the items. Any device with a model
  can fill the cache for the others: a desktop on the same library prepares
  options for an iPad.
- A card whose options are not ready is asked in a recall format; it never
  waits for generation. On an iPad set to `device-only`, fewer cards come as
  choices. That degradation is accepted, and it weakens the no-typing promise
  for those learners.

**Presentation.** Each presentation shows two distractors from the pool. The
choice and order are derived deterministically from the card and its due
date, as `presentFastCheck()` already does. A model's option order is never
used. The deterministic checks run again on the set actually shown: the
correct option must not be the only long, short or parenthesised one.

**Retirement.** A distractor is retired when any of these holds:

- it is disputed (Decision 7);
- enough exposures show that fewer than 5 % of learners choose it;
- in shared content, learners who otherwise answer correctly choose it more
  often than others. That pattern marks an alternative correct answer.

A filtered set is not a verified one. The quality gate that works everywhere,
offline included, is dispute and retirement, plus curator review for tiles.

**Amended 2026-09-29 (owner decisions, field test).**

- **Order.** Generated options now come before derived ones: authored fast
  check → curated → generated → derived. An answer taken from another
  question is easy to recognise as belonging to that other question, so
  derived options are only the last resort — mainly for learners without a
  model.
- **Fresh wrong answers.** A choice works like a question variation, and it
  loses its value once the learner can recognise the wrong options instead
  of knowing the right one. A presentation therefore prefers generated
  options this learner has not been shown yet (read from the choice evidence
  of their attempts), and the background preparation generates new ones
  whenever fewer than two unseen ones are left, passing the existing options
  to the model as ones to avoid. Seen options are reused only when no fresh
  ones are ready. Cost: roughly one generation (two model calls) per choice
  presentation of a card without an authored or curated set.
- **Attribution.** A generated option records the model that wrote it, and
  the surfaces name it next to the options ("Options: <model>"), as they do
  for a generated question variation.
- **Fallback on refusal.** Each generation call walks on to the next model of
  its role's chain when a row refuses the call. A row of a known cloud
  provider without a stored key is skipped at readiness and does not count
  as the cloud having answered, so it neither serves nor closes the offline
  tier.

**Amended 2026-09-29 (owner decision, review of PR #369).**

- **Derived sets are not filtered.** As proposed, a derived set passed the
  reject filter before first use whenever a text model was available. That
  is not built, and it will not be: since derived options became the last
  resort, a learner with a model sees them only while generated options are
  not ready, and filtering them at presentation would put a model call
  before the card, against the rule that a card never waits for generation.
  Filtering them in the background would need a per-learner store of
  rejected donors for a source that is meant for learners without a model.
  Derived candidates pass the deterministic checks; a derived option that
  is itself a correct answer is caught by dispute (Decision 7), which
  excludes that donor for the learner. The falsification check on
  generation quality covers derived options as well: a high dispute rate on
  derived options reopens this decision.

**Amended 2026-10-01 (owner decision, field test).**

- **Derived options are off by default.** In practice a set built from
  answers of other items too often leaves one option obviously right: the
  learner recognises the distractors as answers to questions they have met
  and picks the remaining one without knowing it. The source stays, but
  only as an opt-in: the learning setting `derivedChoiceOptions` (default
  `false`), shown under the advanced settings in the Studio and on Mobile and
  set through `zam bridge study-learning-set --derived-choice-options on|off`.
  With it off, a card without an authored, curated or generated set is asked
  in a recall format (source 4). This weakens the "curated and derived
  options need no model" consequence for learners without a model: they get
  a choice only from authored or curated sets unless they opt in.

### 7. Feedback after a wrong answer, and disputes

After a distractor or "Don't know", the card waits for the learner:

- The chosen option is marked wrong and the correct one right.
- One contrast line explains the difference: the distractor's stored reason,
  or, for a derived distractor, the question it belongs to.
- The reference answer is shown as usual.
- **"Nachfragen" / "Ask"** opens the follow-up chat of ADR 2026-07-06b with a
  one-tap starter, "Was ist der Unterschied?" / "What's the difference?". The
  chat's card frame carries the question, the options, the choice and the
  solution.
- Without a model the contrast line remains.

After a correct answer the surface confirms briefly and moves on. The chat
stays reachable but is not offered prominently.

**"Meine Antwort stimmt auch" / "My answer is also correct"** counts the attempt
as correct and retires that distractor for this item. The rating becomes `3`
and stays recorded as `choice`, so Decision 4 still applies: a dispute
corrects a distractor, it does not turn recognition into recall. This follows
the leniency of ADR 2026-09-08 §8: being told you were wrong when you were
right discourages, and discouragement does not reverse.

- **Curated options** are flagged for their curator instead of being edited
  locally.
- **A disputed binary fast check** leaves one option, which is no choice.
  That learner's card is asked in a recall format until the curator publishes
  a fix.

### 8. Auto: choice while new, free recall from the moment it can be asked

In `auto`, each card passes through two stages:

1. **Recognition stage.** The card has never been answered in free recall.
   - It is asked as choice.
   - The exception is the review where a correct choice would reach the
     ceiling: that review is asked as free recall instead, the **recall
     probe**.
   - With the default parameters the probe is the fourth presentation, on
     day 10, after three correct choices. An overdue young card is probed
     immediately.
2. **Recall stage.** From the first free-recall answer on, whatever its
   outcome, the card is always asked in free recall. That includes relearning
   after a lapse: after a missed probe, 10 min → 1 → 3 → 6 → 13 days.

**Which cards are in which stage:**

- A card whose reviews include `recall` or `NULL` rows is in the recall stage.
  Existing cards with history are therefore asked as before. Auto brings new
  material in through choice.
- Cards not suitable for choice (Decision 9), and cards without options, are
  asked in free recall from the start.

The probe asks one review before a choice would reach the ceiling. After that
point, further choices could no longer add stability that the scheduler may
use. The probe also supplies the free-recall evidence that plain Choice never
collects. It moves with the ceiling by design: it exists because choice
cannot carry the card any further.

**The free-recall format:**

- It is an answer with AI feedback when an evaluator is available, and Flash
  otherwise.
- The learner can pin it to Flash in Settings ("später ohne Tippen" / "later
  without typing"). On a tablet, typing is exactly what a learner chose Auto
  to avoid.
- An unset pin follows evaluator availability when it is read, and is not
  persisted by that read.
- If no evaluator answers when a card comes up, that card falls back to Flash.
- Spoken answers are possible where voice capture exists. Voice capture is not
  an evaluator, though: without one, the rating stays the learner's.

The surface names the moment of the switch: "Jetzt ohne Auswahl" / "Now
without options".

Plain `choice` never moves a card to free recall because of its state. Cards
it cannot ask as a choice (Decisions 6 and 9) are asked as Flash. Its session
summary counts the cards ready for free recall ("12 Karten sind bereit für
freien Abruf") and
points to Auto, Flash or the answer mode. It does not interrupt the session.

### 9. Where choice applies

- **Choice:** every item whose answer is text, at any Bloom level and with
  any number of answer points.
- **A recall format instead** — Flash in plain Choice, free recall in Auto:
  answers carried by answer media such as image occlusion. The presentation
  says so (`detail: "answer_media"`), so a surface can name the reason.
- **Amended 2026-09-29 (owner decisions).** As proposed, Choice covered only
  single-point answers at Bloom levels 1–3. The field test showed that this
  left many cards without the mode: libraries hold items written before the
  one-point rule (ADR 2026-09-08), and the Bloom label of an item says little
  about whether its options can be told apart. Both limits are lifted.
  Options remain a first stage, not an end state: the tap ceiling (Decision 4)
  keeps a card answered by choice from maturing, so once a card reaches the
  ceiling the learner takes it further in Flash or an answer mode — or Auto
  does it at the recall probe (Decision 8). Higher-order items are where
  generated distractors are least likely to be clearly wrong; disputes and
  retirement (Decisions 6 and 7) remain the safeguard.
- **Tier-1 binary fast checks:**
  - In both new modes they are graded automatically, under Decisions 3 and 4.
  - In the answer modes they keep today's tap followed by self-rating,
    recorded as `options`, and Decision 4 bounds them too. The screen does
    not change, and a guess can still be rated Again.

### 10. Surfaces

Version one ships in the desktop Studio study window and on Mobile (iPadOS
and Android).

- The format decision and the rules of Decisions 4 and 8 live in the kernel,
  so every surface agrees.
- Review items gain optional choice data, added to the bridge protocol without
  breaking it.
- The MCP Recall panel, `zam learn`, voice mode and agent harnesses follow
  later.

## Consequences

- A learner can study without typing and without judging themselves, and
  still receives an objective result and explanatory feedback.
- The free offline contract of ADR 2026-08-09 holds. Curated and derived
  options need no model, and everything else degrades to a recall format.
- Generation costs two `text` calls per item, once, shared across a library —
  instead of a model call per review.
- Choice alone cannot shelve a card. In plain Choice every card returns at
  least every 20 days, mature cards included; 300 cards mean about 15 quick
  reviews a day. When the learner returns to free recall, a mature card
  continues from its kept stability.
- **Existing tier-1 cards change schedule.** Taps in the answer modes are
  bounded from now on. The screen is unchanged, but no tap books more than 20
  days, so tier-1 cards return more often than before.
- `docs/okf/fsrs-scheduling.md` says learning modes "never change the FSRS
  calculation". That statement changes with the implementation: modes decide
  what evidence is gathered, and ratings derived from a choice are bounded by
  Decision 4.
- Distractor quality becomes a maintained concern. Retirement, disputes and
  the reject filter all need to be observable.
- Existing binary fast checks carry answer cues. In one chemistry item the
  correct option is the longer one, with a technical term in parentheses. The
  generation checks apply to new options; curated options need a content pass.
- The ceiling value and the probe point remain hypotheses until field data
  exists.

## Falsification

The design is wrong if field review logs show any of these:

- **The probe fails too often.** Probes fail far more often than the first
  long-term review of cards learned by free recall. Then choice teaches little
  that transfers, or the probe comes too late. Probes judged by an evaluator
  are compared separately from probes rated in Flash.
- **Choice practice does not transfer.** Learners who practised a card by
  choice fail its free recall about as often as learners who never practised
  it.
- **Generation quality is insufficient.** A substantial share of generated
  distractors is disputed or never chosen.
- **Learners leave Auto** at the switch to free recall.
- **The probe comes at the wrong point.** The failure rate of the first free
  recall, broken down by the number of correct choices before it, shows
  whether the probe comes too early or too late.

Plain Choice never asks for free recall, so its logs cannot test the first two
points. Auto's probe provides that data.

## Alternatives considered

- **Four options.** Rejected. Four options bring no psychometric gain over
  three, add reading and lure exposure, and a third plausible distractor is
  rarely available.
- **Booking a correct choice as Hard.** Rejected. In ZAM's learning steps,
  Hard repeats the step and raises difficulty, so a new card would never
  graduate.
- **Hard's difficulty update for every correct choice.** Rejected. Repeated
  updates drive difficulty toward 10 (9.9 after twelve), which shrinks all
  later growth. Hard's initial difficulty with no further change is used
  instead.
- **Graduation after N successful choices.** Rejected. A count shrinks the
  chance of guessing, but not the systematic gap between recognition and
  recall.
- **Capping only the interval.** Rejected. Stability keeps growing behind the
  cap, and the first recall success turns inflated recognition stability into
  a very long interval.
- **Holding stability above the ceiling** (first version). Rejected in review.
  One correct tap re-books a mature card for its full interval, which can
  shelter it from free recall indefinitely.
- **Switching Auto at the ceiling** (first version). Rejected in review. The
  first free recall came on day 33, after 20 days of choice practice the
  scheduler could not count toward stability. A lapse also sent a card back
  to choice for weeks.
- **Keeping Auto on choice when no evaluator is available** (review
  proposal). Declined. Switching to Flash without AI is the owner's design,
  and a Flash self-rating is the evidence every Flash learner already
  provides. The probe now comes early, with a moderate step (8 → 26 days).
- **Leaving tier-1 taps in the answer modes unbounded** (first version).
  Rejected by the owner after review round 2. The tap is the response, and the
  self-rating that follows rates a recognition, so five taps could shelve a
  card for half a year.
- **Grading tier-1 taps automatically in every mode** (review proposal).
  Declined. Bounding the interval closes the gap without changing the screen,
  and the learner can still rate a guess as Again.
- **Letting an overdue correct choice raise stability past the ceiling**
  (review proposal). Declined. A late tap is still recognition, which
  outlasts recall. At three options, one lucky tap after a long break would
  shelve the card for months — the failure round 1 removed. A learner's own
  rhythm is honoured through free recall.
- **A probe point independent of the ceiling** (review proposal). Deferred.
  One constant keeps one reason: ask for recall once choice can carry the card
  no further. The falsification check on the probe point can justify a
  separate constant later.
- **Restricting derived distractors to one-to-one relations** (review
  proposal). Declined. Such relations cannot be detected reliably; the reject
  filter, disputes and retirement cover the risk.
- **A separate recognition state per card.** Rejected. It doubles scheduling
  state, splits progress, and treats one practice item as two.
- **Fresh generated options on every review.** Rejected. It means two model
  calls per review, latency in the flow, and bad distractors that could never
  be retired.
- **Recall before the options ("think first").** Deferred. It gave little or
  no advantage in three of four experiments, and its benefit depends on recall
  succeeding. Auto's probe targets that point directly.
- **Answer until correct, confidence marking, options shown one at a time.**
  Deferred. Each is promising or unmeasured, and each adds interaction the
  first version does not need.
- **Auto as the default for new learners.** Deferred until field data exists.

## Citations

Code and repository documents:

- `src/kernel/scheduler/study-settings.ts` — learning modes and their defaults
- `src/kernel/scheduler/fsrs.ts` — the FSRS-6 scheduler behind the simulation
- `src/kernel/scheduler/queue.ts` — `presentFastCheck()`, `parseReviewFastCheck()`
- `src/kernel/recall/evaluator.ts` — the rating transaction
- `src/kernel/analytics/stats.ts` — the maturity threshold
- `src/kernel/search/hybrid.ts` — embedding similarity
- `src/cli/llm/client.ts` — `discussReviewViaLLM()`, the `text` role
- `desktop/src/main.ts`, `mobile/src/main.ts`, `mobile/src/discuss.ts`
- [docs/okf/fsrs-scheduling.md](../okf/fsrs-scheduling.md)
- [Flashcard quality RFC](../concepts/flashcard-generation-and-decomposition-strategy.md)
- Review rounds: [PR #368](https://github.com/zam-os/zam/pull/368) (Gemini 3.8 Flash, Grok 4.7, MiMo v2.6 Pro)

Research:

- Butler, A. C., Godbole, N., & Marsh, E. J. (2013). Explanation feedback is better than correct answer feedback for promoting transfer of learning. *Journal of Educational Psychology*, 105(2), 290–298. <https://doi.org/10.1037/a0031026>
- Butler, A. C., & Roediger, H. L. (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition*, 36(3), 604–616. <https://doi.org/10.3758/MC.36.3.604>
- Camarata et al. (2025). LLM-generated multiple choice practice quizzes for preclinical medical students. *Advances in Physiology Education*, 49, 758–763. <https://doi.org/10.1152/advan.00106.2024>
- Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012). Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced forgetting. *Psychological Science*, 23(11), 1337–1344. <https://doi.org/10.1177/0956797612443370>
- Marsh, E. J., Agarwal, P. K., & Roediger, H. L. (2009). Memorial consequences of answering SAT II questions. *Journal of Experimental Psychology: Applied*, 15(1), 1–11. <https://doi.org/10.1037/a0014721>
- McDermott, K. B., Agarwal, P. K., D'Antonio, L., Roediger, H. L., & McDaniel, M. A. (2014). Both multiple-choice and short-answer quizzes enhance later exam performance in middle and high school classes. *Journal of Experimental Psychology: Applied*, 20(1), 3–21. <https://doi.org/10.1037/xap0000004>
- Rodriguez, M. C. (2005). Three options are optimal for multiple-choice items: A meta-analysis of 80 years of research. *Educational Measurement: Issues and Practice*, 24(2), 3–13. <https://doi.org/10.1111/j.1745-3992.2005.00006.x>
- Roediger, H. L., & Marsh, E. J. (2005). The positive and negative consequences of multiple-choice testing. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(5), 1155–1159. <https://doi.org/10.1037/0278-7393.31.5.1155>
- Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin*, 140(6), 1432–1463. <https://doi.org/10.1037/a0037559>
- Schneid, S. D., Armour, C., Park, Y. S., Yudkowsky, R., & Bordage, G. (2014). Reducing the number of options on multiple-choice questions: Response time, psychometrics and standard setting. *Medical Education*, 48(10), 1020–1027. <https://doi.org/10.1111/medu.12525>
- Smith, M. A., & Karpicke, J. D. (2014). Retrieval practice with short-answer, multiple-choice, and hybrid tests. *Memory*, 22(7), 784–802. <https://doi.org/10.1080/09658211.2013.831454>
- Tang, X., Duan, X., & Cai, Z. G. (2026). Do large language models plan answer positions? Position bias in multiple-choice question generation. arXiv:2605.01846. <https://arxiv.org/abs/2605.01846>
- Tarrant, M., Ware, J., & Mohammed, A. M. (2009). An assessment of functioning and non-functioning distractors in multiple-choice questions: A descriptive analysis. *BMC Medical Education*, 9, 40. <https://doi.org/10.1186/1472-6920-9-40>
- Van der Kleij, F. M., Feskens, R. C. W., & Eggen, T. J. H. M. (2015). Effects of feedback in a computer-based learning environment on students' learning outcomes: A meta-analysis. *Review of Educational Research*, 85(4), 475–511. <https://doi.org/10.3102/0034654314564881>
- Yang, C., Luo, L., Vadillo, M. A., Yu, R., & Shanks, D. R. (2021). Testing (quizzing) boosts classroom learning: A systematic and meta-analytic review. *Psychological Bulletin*, 147(4), 399–435. <https://doi.org/10.1037/bul0000309>
- Zheng, C., Zhou, H., Meng, F., Zhou, J., & Huang, M. (2024). Large language models are not robust multiple choice selectors. *ICLR 2024*. <https://arxiv.org/abs/2309.03882>

Products:

- [Quizlet Learn](https://quizlet.com/features/learn) — progression from multiple choice to written answers
- [Memrise — spaced repetition](https://memrise.zendesk.com/hc/en-us/articles/360015889057-How-does-the-spaced-repetition-system-work) — multiple-choice tests before typing
- [RemNote — creating flashcards](https://help.remnote.com/en/articles/6025481-creating-flashcards) — a multiple-choice answer pre-selects "Forgot" or "Recalled with effort"
- [RemNote — rating buttons](https://help.remnote.com/en/articles/6022755-getting-started-with-spaced-repetition) — "Recalled with effort" is the third of four grades
