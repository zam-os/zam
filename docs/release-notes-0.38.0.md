# ZAM 0.38.0 — Who judges what

0.37.0 settled what counts as knowing something. This release settles who gets
to say so.

Two very different judgements were hiding behind one button. Whether an answer
contained what it needed is something you can read off the text — and an AI is
better placed to see it than the person who just wrote it. How hard the answer
was to produce is something only you can know; no evaluator sees the thirty
seconds of staring that came before the typing. ZAM was asking one party for
both, and putting four equal-looking buttons underneath.

## The rating buttons say what they mean

- **Again is its own group now.** The four ratings appear as two labelled
  groups: *Not, or only partly, recalled* over Again, and *Fully recalled — how
  easy was it?* over Hard, Good and Easy. If you half-remembered a card, Again
  is the honest answer, and the buttons finally say so instead of leaving you to
  work it out from four peers in a row.
- **Colours you can see without a mouse.** Each rating keeps its colour at rest
  rather than only when hovered — which never worked on a tablet at all.
- **Your own answer stays on screen.** In the Studio window, submitting an
  answer used to sweep it away just as the feedback, the reference answer and
  the rating buttons all started talking about it. It now sits above the
  feedback, so you can check a claim that something was missing instead of
  taking it on faith.

## The AI reports what it can see, and nothing else

- **No suggested rating, anywhere.** Every place ZAM asked an AI for a rating —
  in the app, on your phone, in the terminal, and in the instructions given to
  external assistants — now asks whether the answer was **complete** or
  **incomplete**, and when incomplete, how many required points were missing and
  which ones. The rating itself is yours.
- **Cards can ask for more than one thing, and say how many.** If a reference
  answer is written as a list, each item is a point. Before you answer, you are
  told how many points are expected — never which — so you keep digging past the
  first thing that comes to mind instead of stopping there. Answers written as
  ordinary prose count as one point and need no changes.
- **Vague answers are judged kindly.** An answer that is imprecise or clumsily
  worded but points at the right thing counts, and genuine uncertainty is
  resolved in your favour. Being told you failed when you nearly had it is the
  more expensive mistake — and you can always mark yourself down when you know
  you were guessing.
- **Partly right is still Again.** Three points out of four does not become a
  softer rating. The score tells you where the gap was; it never quietly
  stretches your next interval.

## For people writing cards

- **A card that asks for several things now says so.** When you publish a card
  whose reference answer lists more than one point, the editor tells you — as a
  note, not a blocker. Some facts only make sense together, and those cards stay
  perfectly valid.

## Notes

- Answers to *Analyse* and *Synthesise* cards are arguments rather than
  countable facts, so those cards keep the previous behaviour and show no point
  count.
- The new labels are written in English and German. The Spanish, French,
  Portuguese, Chinese and Japanese packs carry machine translations for now.
