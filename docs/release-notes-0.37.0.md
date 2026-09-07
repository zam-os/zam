# ZAM 0.37.0 — What counts as knowing it

A spaced-repetition schedule is only as good as the evidence behind it. If a
half-remembered answer counts as a success, or the same piece of work is scored
twice, the intervals drift away from what the learner can actually recall. This
release tightens what ZAM accepts as evidence — in the rating scale, in the
cards themselves, and in work observed alongside a task.

## A rating scale that means one thing

- **Hard no longer means half-right.** All four ratings now describe a *complete*
  answer: Again for an answer that missed a required part, Hard for a complete
  answer that took effort, Good for an ordinary complete answer, Easy for one
  that came without hesitation. A partial answer is Again — it is not a small
  success, it is a gap worth revisiting sooner.
- **The evaluator judges the answer, not the person.** Feedback stays warm in
  tone but stops handing out praise for effort, and it no longer invents units,
  facts, or extra steps the card never asked for. Typos, abbreviations and
  equivalent phrasings pass when the substance is there.
- **Work you were helped through is recorded, not scored.** An assisted first
  attempt used to slip into the schedule as a 3 or a 4. It is now logged as what
  it was — work you did with help — and leaves your intervals alone until you
  show the recall yourself.

## Cards enter the queue only when they are ready

- **New cards start as drafts.** Anything captured quickly — from a chat, an
  import, a note on your phone — is stored as a draft and stays out of every
  queue, due list and rating until you publish it.
- **Structural checks before publication.** A card cannot be published without a
  question, or with a criterion that only restates its own slug. These are cheap
  lints, not a judgement on the content; they catch the captures that would have
  been unanswerable a week later.
- **Drafts you finish later publish themselves.** Supply the missing question in
  a re-import and the parked card goes live, without losing anything.

## One learning objective, one item a day

- **Sibling items no longer stack up.** When several practice items cover the
  same learning objective, ZAM shows at most one of them per day. Seeing three
  phrasings of the same idea in one sitting feels like recall but mostly tests
  the wording.
- **A prefetch is not an exposure.** The slot is taken at the moment a card is
  actually shown. Cards you never saw — a session stopped early, an item skipped
  — release their slot instead of silently blocking a sibling.
- **"I already know this" is undone by getting it wrong.** Rating Again on an
  item lifts exactly the deferrals you set for its direct foundations, and
  nothing else about your schedule.

## Observed work counts once

- **One attempt, one review.** Rating a piece of observed work directly and
  confirming it again later in the session summary now produces a single review
  and a single scheduling step, on every surface.
- **Disagreements surface instead of overwriting.** If two assessments of the
  same attempt disagree, ZAM reports the conflict rather than quietly keeping
  the last one.
- **A green exit code is not a success rating.** Work that merely finished
  without errors no longer suggests Good. ZAM only proposes a rating where the
  recording shows something — visible struggle, or a failed attempt.

## Also in this release

- **A withdrawn card costs one card, not the session.** If an item is pulled
  back for revision while you are reviewing, that card is skipped and the
  session continues, on Desktop, Mobile and in the terminal.
- **Foundations that cannot be shown no longer hold cards hostage.** A card
  whose only prerequisite is an unpublished draft is no longer taken out of
  circulation waiting for a review that could never happen.
- **The Pythagoras sample content was rewritten** to the new criteria, with the
  old items retired rather than deleted — existing review history is preserved.
- **A supervised pilot protocol and recording sheet** ship as working documents
  for the upcoming classroom test.

## Compatibility

Existing libraries upgrade in place (schema version 33). Review history, FSRS
state and published cards are untouched; the migrations only add the tables and
columns the new evidence rules need. Cards that were already in your queue stay
published — the draft rule applies to new captures.
