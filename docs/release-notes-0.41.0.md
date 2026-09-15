# ZAM 0.41.0 — Study time that counts what you did

Statistics after a Studio session often showed no learning time at all, and a
rating press could look as if it had not registered while the next card was
being fetched. This release fixes both: every rating from the Studio and the
Recall card now carries a time, that time measures the minutes you were
actually at the card, and the moment you rate, the card is gone and a busy
indicator takes its place.

## Learning time

- **Every Studio rating now counts toward your study time.** Ratings from the
  desktop study view used to arrive without a duration, so a whole session
  could show "—" in Statistics. Each rating now carries a time — zero if
  nothing was measured, never nothing.
- **Idle minutes are no longer study minutes.** The clock watches your clicks
  and keystrokes while a card is open. A pause of up to a minute — reading,
  thinking, looking back at the question — still counts. Walk away for
  longer and only that first minute is booked; the clock waits until your
  next reaction to continue.
- **Waiting for feedback counts; a runaway follow-up does not.** Time spent
  waiting for the AI to review your answer is learning time. A follow-up
  question to the tutor counts too, but at most two minutes per turn, so a
  hung model or a distraction during a reply does not inflate the number.
  The ten-minute ceiling per card in Statistics stays as a backstop.

## Rating feels immediate

- **The rated card disappears at once.** Choosing a rating — click or keys
  1–4 — hides the card immediately and shows a bouncing-dot indicator with a
  short status: *Saving your rating…*, then *Loading the next card…*. The same
  indicator covers AI evaluation and question generation, so a wait is always
  visible rather than a frozen screen. If the save fails, the rated card
  comes back so you can try again.
- **The Recall card follows the same rule.** No more next-due pause after a
  rating; the next card loads straight away. If a rating blocked the card
  behind unmet prerequisites, that notice now appears on the next screen
  instead of vanishing with the card.
- **A card that fails to load says so.** Instead of a blank question, the
  study view shows the error, so you know to retry rather than wait.

## Notes

- Historical Studio ratings stay without a time; Statistics changes from the
  first session on this version.
- The mobile companion and the command line still measure wall-clock time
  until they adopt the idle-aware clock; the ten-minute read-time cap applies
  to them as before.
- The new busy-indicator strings ship in English and German; the other
  languages carry provisional translations pending native review.
