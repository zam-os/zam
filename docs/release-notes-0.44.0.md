# ZAM 0.44.0 — Choice and Auto learning modes

Two new ways to answer a card, for learners who do not want to type and do
not want to judge themselves. **Choice** shows three options and grades the
pick. **Auto** asks a new card as a choice and switches it to free recall the
moment choice can carry it no further. Recognising an answer is weaker
evidence than producing it, so no tapped answer ever schedules a card more
than 20 days ahead — that rule also applies to the fast checks the answer
modes already had. Both modes ship in the Studio and on Mobile.

## Choice and Auto

- **Choice: three options, one tap.** The correct option earns Good, a wrong
  one or "Don't know" earns Again; there is no self-rating and nothing to
  type. After a miss the correct option is marked, one line says why the
  picked option is wrong, and two buttons follow: **Ask** opens the follow-up
  chat with the starter "What's the difference?", and **My answer is also
  correct** counts the attempt and stops that option from being shown to you
  again.
- **Auto: choice while a card is new, free recall from the probe.** A card
  is asked as a choice until a correct choice would reach the 20-day
  ceiling; that review — the fourth presentation, day 10 with default
  settings — is asked freely instead, under the badge "Now without
  options". From its first free answer on, the card stays in free recall,
  including after a lapse. Free recall is an answer with AI feedback when a
  model is connected and Flash otherwise; Settings offer "later without
  typing" to pin Flash.
- **Every card whose answer is text qualifies**, at any Bloom level and with
  any number of answer points. Only an answer carried by media, such as an
  image occlusion, is asked freely, and the card says so.
- **Four segments in the switcher.** Flash · Choice · AI · Auto during a
  session, in the Studio and on Mobile; Settings offer both new modes and
  the Auto pin. Switching mid-card re-decides how the current card is
  asked.

## Where the options come from

- **Authored fast checks first.** A card's own fast check is shown in full;
  it may now carry three or four options, not only two.
- **Curated options** shipped with a knowledge tile come next.
- **Generated options are prepared in the background** by your text model
  for the next cards, each with a one-line reason, then checked by a second
  model call that drops every candidate that is also a correct answer, and by
  deterministic checks against duplicates, answers hidden in an option,
  "all of the above", negations and length give-aways. The badge next to the
  options names the model that wrote them. You see fresh wrong answers each
  time a card comes round: once you can recognise the wrong options, you no
  longer need to know the right one.
- **Answers of cards you have already met** are the last resort, drawn from
  cards you have seen in the same domain, never stored, and explained as
  "This answers: …" after a miss.
- **No options, no waiting.** A card without usable options is asked in
  Flash (in Choice) or freely (in Auto) with a short notice; nothing waits
  for a model.

## Scheduling: the tap ceiling

- **Every rating records how the card was answered**: `recall` for Flash,
  typed or spoken answers, `options` for a tapped fast check followed by a
  self-rating, `choice` for a rating derived from the pick.
- **A tapped answer builds stability to 20 days and never books longer.**
  Stability a card earned by free recall is kept, so the next free recall
  continues from it; a tap never lowers difficulty. A miss is an ordinary
  lapse.
- **Existing fast-check cards return more often.** In the answer modes the
  tap followed by a self-rating is now recorded as `options` and bounded by
  the same ceiling: a few taps could shelve a tier-1 card for months before,
  now it comes back within 20 days. This is intended.
- **Statistics are unchanged.** The ceiling sits below the 21-day maturity
  line, so a card answered only by taps never counts as mature.

## Studio, Recall panel and Mobile

- **The topic leads the question.** The card's domain appears in bold before
  the question in the Studio, on Mobile and in the Recall panel, so the same
  question in two contexts reads differently.
- **The Recall panel in VS Code has no choice screen yet.** It opens Choice
  as Flash and Auto in its free-recall format; the fast-check taps it already
  offered are bounded by the ceiling.
- **Mobile prepares options for the next three cards** through the connected
  cloud text model and generates nothing under "device only". Voice keeps its
  Flash loop; there are no spoken choices yet. The Studio's session summary
  line "N cards are ready for free recall" is not on Mobile yet.

## Team library

- **Two new tables.** `choice_distractors` is a shared, rebuildable cache of
  curated and generated options: every member's reviews add generated options
  and move the exposure and pick counters, row policies keep a curator's rows
  a curator's, and a disputed generated option is retired for everyone.
  `choice_exclusions` holds a learner's own disputes and sits under row-level
  security like cards.
- **Administrators re-run `zam team provision`** after updating. It applies
  the two migrations, the grants for the new tables and the new row policies;
  until then members see "schema version 34, this ZAM needs 36".

## Fixes found in review

- **Choice ratings on PostgreSQL.** The query that retires options nobody
  picks bound its 5 % share beside an integer column, which PostgreSQL typed
  as integer; every choice rating with cached options would have failed on a
  PostgreSQL library. The thresholds are written into the statement and a
  PostgreSQL suite books a choice end to end.
- **A cloud row without a key is skipped at readiness** instead of passing
  the check and failing at the call, and each generation call walks on to the
  next model of its chain when a row refuses.
- **The scheduling article** has its "Answer points and coverage" section
  back and describes the checks, the authored fast check and the keyless row
  as they are.

## Notes

- Schema version 36. M035 adds `review_logs.answer_format` (history stays
  `NULL` and counts as recall); M036 adds `choice_distractors` and
  `choice_exclusions`. The first start after the update migrates a personal
  library in place; a team library is migrated by `zam team provision`.
- Design and evidence: ADR 2026-09-27 — Choice and Auto Learning Modes;
  current behaviour: `docs/okf/fsrs-scheduling.md`.
- Updating from 0.43.3: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.44.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
