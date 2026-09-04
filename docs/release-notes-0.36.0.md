# ZAM 0.36.0 — Flash through a review

Some cards need a thoughtful written answer. Others only need one honest check:
did you remember it? ZAM now lets each learner choose **Flash** for that faster
rhythm on Desktop and Mobile. Reveal the stored answer, rate the recall, and
move on — no keyboard and no AI round trip required.

## A faster way to review

- **Flash mode removes the typing step.** The card starts with its prompt;
  reveal the answer with one tap or click, then give the usual FSRS rating.
- **Switch without leaving the session.** The review header can move between
  Flash and the guided answer-and-feedback mode at any time. The choice follows
  the learner across Desktop, Mobile and connected assistant surfaces.
- **A sensible first choice.** A learner without an available evaluator starts
  in Flash. Where evaluation is available, the guided answer mode remains the
  default. Once a learner chooses explicitly, connecting or disconnecting a
  model does not change that choice behind their back.

## Hands-free without prompt fatigue

- **Guidance gets quieter as the flow becomes familiar.** The first card gives
  the full voice instructions, cards two and three use shorter prompts, and
  later cards use subtle audio cues instead of repeating the same speech.
- **Waiting never becomes a false failure.** Voice mode can reveal a card after
  a configurable pause. If no rating follows, it pauses the session safely; it
  does not record a lapse or guess a rating.
- **No overlapping listeners.** A timed-out recognition attempt is stopped
  before the next interval begins, avoiding duplicate microphone sessions on
  mobile and desktop.

## Settings and compatibility

- Learning mode and voice timeouts are stored separately for each learner.
  Reveal and rating timeouts accept whole seconds from 5 through 60.
- Existing cards, review history and FSRS schedules are unchanged. Flash uses
  the same answers and the same four self-ratings as every other review.
- Existing bridge settings consumers keep their previous response contract;
  the new learner-specific settings have dedicated JSON bridge and MCP Apps
  surfaces.
