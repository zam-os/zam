# ZAM 0.35.0 — Ask one more question

AI feedback on a recall answer is no longer the end of the conversation on
Mobile. After a successful evaluation, learners can ask follow-up questions on
iPadOS and Android just as they already can on Desktop — without leaving the
card or losing the review context.

## Follow-up learning on every device

- **Ask directly below the feedback.** The revealed review screen opens a
  compact discussion with the original question, the learner's answer, the
  target concept and the evaluation feedback already in context.
- **Keep going as long as needed.** There is no artificial turn cap. Older
  turns scroll inside the discussion so the answer field, send button and
  rating controls remain close at hand on phones and iPads.
- **German and English UI.** Follow-up labels, progress, failures and model
  information use the learner's interface language.

## The right model for each platform

- **Android respects the recall preference.** Supported devices can answer
  with Gemini Nano on-device; when that model is unavailable or fails, the
  configured cloud recall model remains the fallback unless device-only mode
  was selected.
- **iPadOS uses the connected cloud model.** A reachable paired text endpoint
  handles the same grounded discussion prompt because iOS has no on-device
  text evaluator in the current mobile tier.
- **Graceful fallback remains intact.** The discussion appears only after an
  AI evaluation succeeds. Without a usable model, the normal reveal and
  self-rating flow continues unchanged.

## Review integrity and compatibility

- Follow-up turns are ephemeral coaching, not review evidence. They never
  write FSRS state or influence the learner's rating.
- Rating the card, moving to another card, editing the card or ending the
  session discards the discussion. Replies arriving after that teardown are
  ignored rather than attached to the wrong card.
- Card text and model replies are rendered as inert text. There are no schema
  changes, migrations or changes to existing cards and schedules in this
  release.
