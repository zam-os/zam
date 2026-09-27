# Choice and Auto Learning Modes

**Status:** Proposed — 2026-09-27\
**Date:** 2026-09-27\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md) ·
[2026-08-09](2026-08-09-free-offline-learning-and-anki-interoperability.md) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) ·
[2026-09-08](2026-09-08-answer-points-and-score-based-rating.md) ·
[flashcard quality RFC](../concepts/flashcard-generation-and-decomposition-strategy.md)

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
  g = 0.57 for multiple-choice quizzes. Recognition and recall formats were
  equal (0.52 and 0.52), and with feedback recognition was 0.61 against 0.54
  (Yang et al. 2021). In grade-7 science and high-school history, multiple
  choice with feedback matched short-answer quizzing, and the benefit carried
  over to the other format (McDermott et al. 2014). Older meta-analyses
  disagree in both directions (Rowland 2014; Adesope et al. 2017).
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
- **Competitive distractors bring choice closer to recall** and even
  strengthen related knowledge (Little et al. 2012). Asking for recall before
  showing the options gave no reliable gain over plain multiple choice (Smith
  & Karpicke 2014).
- **Machine-written items need checking.** In one study, 49 % of
  model-written questions had item-writing flaws and 22 % had factual errors
  (Camarata et al. 2025). Language models also favour particular answer
  positions (Zheng et al. 2024; Tang et al. 2026).
- **Comparable products treat choice as a stage.** Quizlet Learn and Memrise
  move from multiple choice to typed answers. RemNote never books a choice as
  "Good". FSRS publishes no guidance for multiple choice.

### What the scheduler would do

The following was simulated with ZAM's default FSRS-6 parameters
(`src/kernel/scheduler/fsrs.ts`), for a new card answered correctly every time:

| Mapping of a correct choice | Course of the card | Problem |
|---|---|---|
| Good, unrestricted | 10 min → 2 → 11 → 46 → 163 → 498 days | five taps shelve a card for half a year |
| Hard | repeats its learning step forever; difficulty climbs to 9.9 | the card never graduates |
| Good, only the interval capped at 20 days | stability grows to 276 days behind the cap; one recall success then schedules 329 days | recognition inflates the recall estimate |
| Good, stability raised to 20 days and held above | 2 → 11 → 20 → 20 …; recall 20 → 78; choice holds 78; recall 78 → 260 | — |

Guessing is not the lasting risk. Five lucky guesses in a row happen with
probability 0.4 % at three options and 0.1 % at four.

The lasting risk is systematic. Recognising an answer does not show that it
can be recalled, and every round of feedback makes the correct option more
familiar. More successful choices do not shrink that error.

## Decisions

### 1. Two new modes: Choice and Auto

`StudyLearningMode` gains `choice` and `auto`. Both are opt-in. The existing
modes and their contextual defaults are unchanged: Flash without an
evaluator, the answer mode with one.

| Mode | Label (de / en) | What the learner does |
|---|---|---|
| `choice` | 🔘 Auswahl / Choice | picks one of three options; no typing, no self-assessment |
| `auto` | 🔄 Auto / Auto | choice while a card is young, free recall once it is established (Decision 8) |

The in-session switcher offers ⚡ Flash · 🔘 Auswahl · 💬 KI · 🔄 Auto.
`answer_variation` remains a Settings choice.

A mode still decides how a surface gathers evidence. Decision 4 adds one
scheduling consequence. It is keyed on how a rating arose, not on the mode: it
applies to a rating derived automatically from a choice.

### 2. Three options

A choice shows the correct answer and two distractors. Existing binary fast
checks keep their two options. A curated item may carry up to four options
when every distractor is plausible. No surface pads a set with weak options.

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
would bring self-assessment back. Decision 4 limits what a lucky guess can
cost.

The rating is derived at the tap. It is written when the learner moves on —
checkpoint 3 of ADR 2026-07-06b — so a dispute (Decision 7) can still change
it. The follow-up chat never does.

### 4. A choice raises stability to 20 days and holds it above

After FSRS has scheduled a correct choice:

```
S_new = min(S_fsrs, max(CHOICE_CEILING_DAYS, S_old))      CHOICE_CEILING_DAYS = 20
```

The next interval follows from `S_new`. Difficulty, repetitions and state
follow FSRS unchanged. A distractor or "Don't know" is an ordinary lapse.
Ratings the learner chooses — Flash, or the answer modes — schedule exactly as
today.

Each consequence is intended:

- **Choice alone never makes a card mature.** It stays below the 21-day
  maturity threshold used by statistics (`stability >= 21`).
- **A guessed card comes back.** It returns within 20 days and faces another
  two-in-three chance of being caught.
- **Earned stability is kept.** A card whose stability was earned by recall
  keeps it under choice review, so a choice phase does not pull mature cards
  forward.
- **The rule needs no history lookup.** It reads only the card's state.

Graduating a card after a number of successful choices was weighed and
rejected (see Alternatives). The constant is not a learner setting; it is to be
calibrated against field review logs.

### 5. Every review records how its rating arose

`review_logs` gains `rating_source`:

- `learner` — Flash, the answer modes, and today's tier-1 tap followed by
  self-rating;
- `choice` — derived from the selected option;
- `NULL` — history recorded before this change, which was learner-rated.

Decision 4 reads `rating_source`.

The review attempt's evidence records:

- the options shown and where each came from;
- the chosen option and the correct option;
- any dispute.

The records serve statistics, the distractor analysis of Decision 6, and the
summary hint of Decision 8. They also serve later FSRS parameter fitting, which
must exclude or down-weight choice reviews because guessing inflates their pass
rate.

### 6. Where options come from

The first available source wins:

1. **Curated.** Options authored and reviewed with the content. Today this is
   the tier-1 `fast_check`, which is item substance (ADR 2026-08-14 Decision
   7). Curated options for recall items would ship as presentation data, like
   the cache below.
2. **Derived, without AI.** Answers of other published items in the same
   domain and knowledge context:
   - They are ranked by closeness to the correct answer, using stored
     embeddings where present and otherwise domain and form, with a similar
     length and answer type.
   - Excluded: the item's own atom, its sibling group, near-duplicates of the
     correct answer, and anything the learner may not already see — private
     items of other learners are never used.
   - A derived distractor is a true statement about another item, so it
     teaches nothing false. Its explanation is free: "This answers: <the other
     question>". Vocabulary and imported Anki decks fit well.
3. **Generated.** For any other suitable item, the `text` role — ZAM's
   content-generation role — writes four to six candidates, each with a
   one-line reason.
   - A second, blind pass answers the question from the full option set and
     discards any candidate that could be correct.
   - Deterministic checks reject duplicates, options that contain the answer,
     "all/none of the above", negation tricks and length outliers.
   - Generation runs ahead of the review, for queued cards.
   - It respects the learner's AI tier preference (ADR 2026-08-09c):
     `device-only` never reaches the cloud.
4. **None available** — offline, no model, or too small a domain. The card is
   asked in a recall format (Flash, or Auto's recall format), with a short
   notice.

Derived and generated options are a **rebuildable presentation cache, not item
substance**:

- They are keyed to the item's question and answer text and regenerated when
  either changes.
- They contain no learner data, so the library shares them: one generation
  serves every learner.
- Unlike a `fast_check` change, regenerating them never makes a card due.

Each presentation shows two distractors from the pool. The choice and order
are derived deterministically from the card and its due date, as
`presentFastCheck()` already does. A model's own option order is never used.

A distractor is retired when it is disputed (Decision 7), or when enough
exposures show that fewer than 5 % of learners choose it.

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
as correct and retires that distractor for this item. This follows the
leniency of ADR 2026-09-08 §8: being told you were wrong when you were right
discourages, and discouragement does not reverse. A disputed curated option is
flagged for its curator instead of being edited locally.

### 8. Auto: choice while young, free recall once established

In `auto`, each card's format follows the card's own state:

| Card | Asked as |
|---|---|
| stability below 20 days — new, learning, relearning or young review | choice |
| stability of 20 days or more | free recall |
| not suitable for choice (Decision 9), or no options available | free recall |

The switch point is the choice ceiling itself. Choice carries a card as far as
choice evidence can, then free recall takes over. After a lapse, relearning
starts in choice again while stability is below the ceiling.

Research favours this progression, and Quizlet and Memrise use it. Here it is
derived from FSRS state rather than from a counter.

**The free-recall format:**

- It is an answer with AI feedback when an evaluator is available, and Flash
  otherwise.
- The learner can pin it to Flash in Settings ("später ohne Tippen" / "later
  without typing"). On a tablet, typing is exactly what a learner chose Auto
  to avoid; where voice capture exists, answers can also be spoken.
- An unset pin follows evaluator availability when it is read and is not
  persisted by that read.
- If no evaluator answers when a card comes up, that card falls back to Flash.

The surface names the moment of the switch: "Jetzt ohne Auswahl" / "Now
without options".

Plain `choice` mode never asks a card as free recall. Its session summary
counts the cards that have reached the ceiling ("12 Karten sind bereit für
freien Abruf") and points to Auto, Flash or the answer mode. It does not
interrupt the session.

### 9. Where choice applies

- **Choice:** single-point answers at Bloom levels 1–3 — terms, definitions,
  formulas, values, vocabulary, cloze gaps, and applications whose
  distractors model typical mistakes.
- **A recall format instead**, in both new modes:
  - Bloom levels 4–5;
  - answers with more than one point (ADR 2026-09-08);
  - answers carried by answer media such as image occlusion.
- **Tier-1 binary fast checks:**
  - In both new modes they are graded automatically, under Decisions 3 and 4.
  - In the answer modes they keep today's tap followed by self-rating, which
    stays `learner`-rated. Grading them automatically there is a separate
    decision.

### 10. Surfaces

Version one ships in the desktop Studio study window and on Mobile (iPadOS
and Android).

- The format decision and the rule of Decision 4 live in the kernel, so every
  surface agrees.
- Review items gain optional choice data, added to the bridge protocol without
  breaking it.
- The MCP Recall panel, `zam learn`, voice mode and agent harnesses follow
  later.

## Consequences

- A learner can study without typing and without judging themselves, and
  still receives an objective result and explanatory feedback.
- The free offline contract of ADR 2026-08-09 holds. Curated and derived
  options need no model, and everything else degrades to Flash.
- Generation costs about one evaluation per item, once, shared across a
  library — instead of a model call per review.
- Choice alone cannot shelve a card. In plain Choice mode, a card never
  recalled freely returns at least every 20 days; 300 such cards mean about 15
  quick reviews a day. Auto moves established cards to free recall instead.
- `docs/okf/fsrs-scheduling.md` says learning modes "never change the FSRS
  calculation". That statement changes with the implementation: modes decide
  what evidence is gathered, and ratings derived from a choice are bounded by
  Decision 4.
- Distractor quality becomes a maintained concern. Retirement, disputes and
  verification all need to be observable.
- Existing binary fast checks carry answer cues. In one chemistry item the
  correct option is the longer one, with a technical term in parentheses. The
  generation checks apply to new options; curated options need a content pass.
- The ceiling value and Auto's switch point remain hypotheses until field
  data exists.

## Falsification

The design is wrong if field review logs show any of these:

- Cards that reach the ceiling by choice fail their first free recall far more
  often than cards that reached it by recall. Then the ceiling is too high, or
  Auto switches too late.
- Learners who practised a card by choice fail its free recall about as often
  as learners who never practised it. Then the mode teaches nothing that
  transfers.
- A substantial share of generated distractors is disputed or never chosen.
  Then generation quality is insufficient.
- Learners leave Auto at the switch to free recall.

## Alternatives considered

- **Four options.** Rejected. Four options bring no psychometric gain over
  three, add reading and lure exposure, and a third plausible distractor is
  rarely available.
- **Booking a correct choice as Hard, as RemNote does.** Rejected. In ZAM's
  learning steps, Hard repeats the step and raises difficulty, so a new card
  would never graduate.
- **Graduation after N successful choices.** Rejected. A count shrinks the
  chance of guessing, which is already negligible after five successes, but
  not the systematic gap between recognition and recall.
- **Capping only the interval.** Rejected. Stability keeps growing behind the
  cap, and the first recall success turns inflated recognition stability into
  a very long interval.
- **A separate recognition state per card.** Rejected. It doubles scheduling
  state, splits progress, and treats one practice item as two.
- **Fresh generated options on every review.** Rejected. It means a model call
  and a verification per review and latency in the flow, and bad distractors
  could never be retired.
- **Recall before the options ("think first").** Deferred. It costs a tap per
  card and showed no reliable gain over plain choice.
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

Research:

- Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research*, 87(3), 659–701. <https://doi.org/10.3102/0034654316689306>
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
- [RemNote — multiple-choice flashcards](https://help.remnote.com/en/articles/8191873-using-multiple-choice-flashcards-effectively) — recognition, not durable understanding
