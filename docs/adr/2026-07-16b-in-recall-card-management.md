# In-Recall Card Management: Stop, Fix, and Remove

- **Status:** Proposed (2026-07-16)
- **Target:** ZAM 0.12.0 (proposed)
- **Date:** 2026-07-16
- **Decider:** Thomas (project owner)
- **Review:** Pending Fable 5 review per the ADR-driven workflow.

**Related:**
[2026-05-31b](2026-05-31b-tauri-active-recall-studio.md) ·
[2026-06-30](2026-06-30-learning-content-studio.md) ·
[2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md)

---

## Context

The desktop Recall Studio (`study-view` in `desktop/index.html`, wired in
`desktop/src/main.ts`) lets a learner answer a card, reveal the reference
answer and AI feedback, and self-rate it `1`–`4`. The only other control on a
card is **Pause & Exit**. There is no way, from inside a review, to say "stop
teaching me this" or "this question is wrong — fix it."

That gap has a real cost during live use. Some cards capture knowledge that was
worth learning once but no longer is — a historical architectural decision, a
fix for a bug that is long gone. Others are simply misleading or too hard to
parse as written. Today the learner's only options are to keep rating a card
they do not want, or to abandon the session, navigate to the Learning Content
Studio, find the card by slug, and edit or remove it there. In practice neither
happens, so dead and broken cards keep surfacing. Forcing a learner to keep
reviewing knowledge they have judged irrelevant is exactly the friction ZAM
exists to remove: if a student does not want to learn something, the system
should make dropping it trivial rather than fighting them.

A second observation shapes *when* these controls should appear. The instinct
on seeing a confusing question is to hit delete immediately — but the reference
answer and feedback often reveal that the card had value after all. The decision
to keep, fix, or drop is more informed **after** the reveal than before it. The
design must therefore lead with a post-reveal decision point while still
offering a fast escape for a question that is obviously broken before it is even
answered.

The backend for all of this already exists. The kernel exposes
`deleteCardForUser`, `deleteToken`, `deprecateToken`, and `updateToken`
(`src/kernel/models/`), and `executeReviewAction` (`src/kernel/recall/actions.ts`)
already models the full action set `rate | skip | edit-token | deprecate-token |
delete-token | delete-card | stop`. Crucially, the Learning Content Studio drives
these through slug-keyed bridge commands that already implement a preview →
confirm handshake returning an *impact* summary:

- `personal-card-update` (accepts `--question`, `--concept`, and all token fields),
- `personal-card-remove` (preview shows review-log impact; confirm deletes the
  learner's own card via `deleteCardForUser`),
- `personal-card-delete` (preview shows full dependency/card impact; confirm hard-
  deletes the token via `deleteToken`).

The desktop `activeCard` (`BridgeCard`) already carries `cardId`, `tokenId`, and
`slug`, so every command can be addressed from the study view without any new
data plumbing. This ADR is therefore about **surfacing existing capability in
the study view**, not building new capability.

## Decision

Add card-management controls to the desktop `study-view`. **No kernel, bridge, or
MCP changes are required**; the study view calls the same bridge commands the
Learning Content Studio already uses. The guiding principle is the same one that
governs the rest of the Recall loop: the controls stay out of the way until the
learner reaches for them.

### Interaction model

**Post-reveal (primary).** After the reference answer is shown, the rating bar
gains a visually separated fifth control alongside the four ratings:

```
[1 Again] [2 Hard] [3 Good] [4 Easy]        [ – Stop ]
```

`– Stop` is styled to read as *not a rating* (a gap plus a muted/danger tint).
Clicking it opens a small popover with two clearly-worded choices:

- **Not for me** — removes *this learner's* card; the shared token and its
  content are untouched.
- **Outdated — remove it** — removes the shared token and its cards entirely.

A quiet **✎ Edit this card** affordance also appears in the post-reveal area. It
turns the question and reference answer into editable fields inline (see
*Editing* below) and offers a secondary **Open in full editor →** link for
deeper structural edits.

**Pre-reveal escape (secondary).** A single low-emphasis affordance in the card
header (a small `⋯` menu near the badges) exposes the same **Stop…** and **Edit**
actions before the learner answers, so a plainly broken or unwanted question can
be dropped or fixed without first forcing an answer. This is deliberately quieter
than the post-reveal controls: the reveal is the intended decision point.

### Action → command mapping

| Control | Bridge command | Effect |
|---|---|---|
| **Not for me** | `personal-card-remove --slug <slug>` → confirm with `--confirm` | Preview returns review-log impact; confirm removes the learner's card. Non-destructive to shared content. |
| **Outdated — remove it** | `personal-card-delete --slug <slug>` → confirm with `--confirm` | Preview returns full dependency/card impact; confirm permanently hard-deletes the token. |
| **Edit this card (inline)** | `personal-card-update --slug <slug> --question … --concept … …` | Same command the Content Editor uses; persists question and concept edits. |
| **Open in full editor →** | in-app navigation | `switchView("learning-content-view")` and select this card by slug; pauses the review session. |

Both destructive paths reuse the existing confirmation dialog pattern
(`showRemovalConfirmation` in `desktop/src/learning-content.ts`, extracted for
reuse). Surfacing the impact preview before a delete is what makes the
"decide with more information" principle concrete: the learner sees how many
review logs or dependents a removal touches before committing. **Outdated —
remove it** is permanent by decision (below); the preview is its safeguard.

### Editing

Inline edit is the primary fix path. Selecting **✎ Edit this card** makes the
question text and reference answer editable in place, with Save / Cancel. Save
calls `personal-card-update`. Because that command overwrites the token fields it
receives, the study view must send the card's *full current field set* (title,
concept, domain, bloom, mode, context, question, source link), not only the two
edited fields, to avoid clobbering unshown fields with blanks. The study view
must therefore have those values available — either already present on
`BridgeCard` or fetched for the active card before opening the inline editor.
This is the one implementation risk worth calling out for the plan.

After a successful save the learner stays on the card, the reference answer
refreshes, and they rate `1`–`4` normally.

**Open in full editor →** covers edits the inline form should not carry — Split,
Foundations, and other structural operations the Learning Content Studio already
provides. It navigates to `learning-content-view` focused on this card. This
requires the Learning Content Studio to expose a small entry point to select a
card by slug (its `selectCard` is currently module-internal). Taking this path
pauses the session; the learner resumes from the Dashboard, matching today's
Pause & Exit model.

### Session behavior

- After **Not for me** or **Outdated — remove it**: the current card is gone from
  the queue, so advance to the next card (the `submitRating` → `loadNextCard`
  path), or show the completion state if the queue is now empty.
- After an **inline edit save**: stay on the card and let the learner rate it.
- After **Open in full editor →**: pause the session (return to Dashboard to
  resume), consistent with Pause & Exit.
- All controls guard against concurrent bridge calls (reuse the
  `ratingSubmitInProgress` pattern) and disable during an in-flight request.

## Consequences

- **No backend surface added.** The feature is desktop UI wiring over existing,
  tested bridge commands. This keeps risk low and avoids widening the kernel or
  bridge contract.
- **Dead and broken cards become removable in the moment they surface**, which is
  the only moment the learner has the context to judge them. This directly serves
  ZAM's goal of not forcing irrelevant review.
- **"Outdated — remove it" is permanent** (`personal-card-delete` → `deleteToken`).
  This matches the literal intent of "remove," and the impact-preview confirm is
  its guardrail. The recoverable soft-retire (`deprecate-token`) was considered
  and rejected as the default for this gesture; it remains available through the
  full editor / CLI if a recoverable path is later wanted.
- **Two edit paths (inline + full editor)** add a little surface but keep quick
  fixes fast while preserving access to structural edits. Inline edit inherits the
  `personal-card-update` full-field-overwrite behavior, which the plan must handle
  by sending the complete current field set.
- **The MCP Apps recall panel** (`desktop/src/panel/recall.ts`) gains none of this
  yet. That surface is intentionally out of scope here; mirroring the controls
  there is a candidate follow-up, noted so the omission is a decision rather than
  an oversight.

## Testing

- New user-facing strings go through the existing `t()` / i18n table in both `en`
  and `de`, satisfying `tests/desktop/i18n-completeness.test.ts`.
- The underlying commands (`personal-card-update`, `personal-card-remove`,
  `personal-card-delete`) and kernel actions are already covered by CLI and
  kernel tests (`tests/kernel/review-maintenance.test.ts`,
  `tests/kernel/token-embeddings.test.ts`). This ADR adds no kernel behavior to
  cover.
- Add desktop-level coverage for the new study-view wiring — that each control
  invokes the correct bridge command with the active card's slug, that the
  destructive paths require a confirm step, and that inline edit sends the full
  field set — alongside the existing study-view desktop tests.

## Open questions

None outstanding. The two decisions that were open during design — whether
"Outdated" deprecates or deletes, and whether to keep the full-editor jump — were
resolved in favor of **permanent delete** and **keeping the jump**, and are
recorded above.
