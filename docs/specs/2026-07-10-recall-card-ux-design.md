# Recall Card UX — Single Adaptive Button, Finish/Summary, Domain Focus

**Status:** Proposed
**Date:** 2026-07-10
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-09-mcp-apps-card-wave.md](../plans/2026-07-09-mcp-apps-card-wave.md) (built the card) ·
[2026-07-06b-checkpointed-review-dialogue.md](../adr/2026-07-06b-checkpointed-review-dialogue.md) (the deferred "C") ·
[2026-06-27-recall-session-llm-pipeline.md](../adr/2026-06-27-recall-session-llm-pipeline.md)

---

## Context

The spoiler-free recall card ([desktop/src/panel/recall.ts](../../desktop/src/panel/recall.ts))
shipped in the 2026-07-09 card wave as a deliberately minimal "rating
terminal": show question → reveal → self-rate. In live use (2026-07-10) three
frictions surfaced, all of which the **Studio desktop panel**
([desktop/src/main.ts](../../desktop/src/main.ts)) already handles — the card
has *regressed* relative to Studio, not broken new ground:

1. **Two redundant buttons.** `Antwort prüfen` (disabled until text) and
   `Aufdecken` (always on) differ only in whether the typed answer is shown
   next to the concept. That is a textarea-state distinction, not a
   two-button one. Studio already uses a **single** button
   (`btn_reveal_answer`).
2. **No finish control.** The card only walks forward through the queue; the
   sole exits are draining the queue or closing the panel. There is no early
   "I'm done" and no session summary. Studio has a natural session-completed
   screen (`session_completed`).
3. **No domain focus.** `loadReviews()` calls `zam_get_reviews` with no
   `domain`, so a "let's review RAG" intent still serves Pythagoras cards.
   Studio already filters by `domain` and `knowledgeContext`.

This spec covers only the card-side parity fixes (A + B). The conversational
answer flow — grading, follow-up questions, surface-aware model routing — is a
larger, separate effort tracked as **C** (see Out of Scope).

## Scope

**In:**
- **A1** — collapse the two buttons into one adaptive button.
- **A2** — an always-available finish control that ends the loop early and
  shows a local summary.
- **B** — optional `domain` focus plumbed `zam_open_recall` → card →
  `zam_get_reviews`.

**Out:** everything in C (see below). No LLM calls are added by this spec; the
card still calls only `zam_get_reviews` and `zam_submit_review`.

## Design

### A1 — one adaptive button

Delete `revealBtn`. Keep a single primary button whose label tracks the
textarea on `input`:

- empty → `t("btn_recall_reveal")` ("Aufdecken")
- non-empty (trimmed) → `t("btn_recall_check")` ("Antwort prüfen")

The button is **never disabled** — an empty answer is a legitimate choice
(reveal without attempting). Click always calls `showReveal(text || undefined)`,
identical to today: a typed answer renders under "Deine Antwort" above the
concept; an empty one reveals the concept alone. Both paths end in the same
four-rating row. Spoiler discipline is unchanged — `concept` stays in the
closure and only reaches the DOM inside `showReveal()`.

Both labels move from hardcoded German string literals to `t()` keys, matching
the rating labels which are already localized.

*Forward seam for C:* the empty-vs-typed distinction **is** the "did the
learner attempt?" signal that C's assisted-rating cap consumes. Recording it
here (via which label was active at reveal) means C inherits it for free — this
change is not throwaway.

### A2 — finish + summary

Add a low-emphasis `Sitzung beenden` control (`t("btn_recall_finish")`) in the
card header next to the `1 / N` counter, present on **every** card. Clicking it
stops the loop immediately and renders a summary panel:

- headline count: *N von M bearbeitet* (`M` = queue length, `N` = rated so far)
- a rating spread: how many 1 / 2 / 3 / 4 were submitted this session

The card does **not** own a ZAM session (it never calls `session_start`), so
finish is purely local UI state: stop advancing, render the summary. No
`zam_submit_review`/`session_end` side effects. A small running tally
(`{1:0,2:0,3:0,4:0}` plus `answered`) is incremented in `submitRating()` and
read by the summary renderer and by the natural `renderDone()` end state (which
reuses the same summary component).

*Parity:* Studio has a natural completion screen but no verified early-finish
control. If Studio lacks one, add the equivalent early-finish there in the same
change so the two GUI surfaces stay consistent ("both places").

### B — domain focus

- `zam_open_recall` ([src/cli/commands/mcp.ts](../../src/cli/commands/mcp.ts))
  gains an optional `domain: z.string().optional()` in its `inputSchema`, kept
  `readOnlyHint: true`. Its handler adds `domain` to the returned
  `structuredContent` (`{ recall, version, user, domain }`).
- `recall.ts` reads `structuredContent.domain` in `ontoolresult`, stores it,
  and passes it to `zam_get_reviews` (`{ includeQuestions: true, domain, ...}`).
  `zam_get_reviews` already accepts `domain`; no kernel change.
- The card header shows the active focus (e.g. *Fokus: rag*) when `domain` is
  set, so the scoping is visible.
- Caller usage: the `/zam` skill (or any agent) opens a scoped session with
  `zam_open_recall { domain: "rag" }`, ending the "Pythagoras mid-RAG-session"
  problem.

`knowledgeContext` is a trivial follow-on with the same plumbing (Studio
supports it too); left out here to keep the change minimal — add only if
wanted.

### i18n

New keys in [desktop/src/i18n.ts](../../desktop/src/i18n.ts) for every locale
block (de, en, es, fr, pt, zh, ja), falling back to English where a translation
is not provided:

- `btn_recall_reveal` — "Aufdecken" / "Reveal"
- `btn_recall_check` — "Antwort prüfen" / "Check answer"
- `btn_recall_finish` — "Sitzung beenden" / "End session"
- `lbl_recall_summary` — "{done} von {total} bearbeitet" / "{done} of {total} reviewed"
- `lbl_recall_focus` — "Fokus: {domain}" / "Focus: {domain}"

The two interpolated keys (`lbl_recall_summary`, `lbl_recall_focus`) are read
via the format helper `tf`, not `t` (plain-string labels use `t`).

### Tests

- [tests/cli/mcp.test.ts](../../tests/cli/mcp.test.ts): assert `zam_open_recall`
  `inputSchema` accepts `{ domain?: string }` and still carries
  `readOnlyHint: true`; assert the tool result echoes `domain` in
  `structuredContent`. Tool/resource counts unchanged.
- [tests/desktop/module-boundaries.test.ts](../../tests/desktop/module-boundaries.test.ts):
  unchanged (no new imports; recall.ts stays Tauri-/Three-free).
- Card DOM behavior (button label toggle, finish summary) has no existing unit
  harness; verify by build + a basic-host smoke check per the card-wave
  verification step. If a lightweight jsdom test for `recall.ts` is cheap, add
  one for the label-toggle and the finish tally; otherwise rely on the smoke
  check and keep scope tight.

## Card vs Studio parity (after this spec)

| Concern | Card (before) | Card (after) | Studio |
|---|---|---|---|
| Reveal button | two buttons | one adaptive | one (`btn_reveal_answer`) |
| Early finish + summary | none | yes | completion screen; add early-finish if missing |
| Domain focus | none | yes | yes (`domain` + `knowledgeContext`) |
| Answer grading / dialogue | none | none (→ C) | one-shot AI feedback (→ C for dialogue) |

## Out of scope — captured for C

C = the conversational answer flow (your + your daughter's ask), designed at
ADR [2026-07-06b](../adr/2026-07-06b-checkpointed-review-dialogue.md) (status
Proposed). It is deferred to its own spec, but its **defining constraints**,
agreed 2026-07-10, are recorded here so C starts from them:

1. **Both GUI surfaces.** Implement the dialogue in **card + Studio**, kept at
   parity. The harness chat/skill already runs the conversation through the
   host model and is not the gap.
2. **Surface-aware model routing — no second endpoint in a harness.** This
   *refines* ADR 2026-07-06b, which chose ZAM's in-process `recall` provider.
   The correction: when a surface runs **inside an AI harness** (Claude Code,
   Copilot), grading + dialogue must reuse the **host's** model — no separate
   `recall` endpoint (no extra cost/config, higher quality). Standalone Studio
   (no host model) keeps ZAM's `recall` provider. The evaluator is *whoever
   already hosts the session*.
3. **Mechanism to validate.** MCP **sampling** (`sampling/createMessage`) is the
   candidate for "card-in-harness reuses the host model" without the
   `app.sendMessage` chat-draft problem that forced its removal in the card
   wave (Step 6). Confirm host support before committing to it.
4. **Checkpoints unchanged.** The three FSRS checkpoints (question shown →
   answer captured → rating checked in) and the assisted-rating cap from
   2026-07-06b still hold; A1's attempt signal feeds the cap.

C also owns the "grading exists in terminal/Studio but not the card" gap
(`evaluateAnswerViaLLM` / `generateQuestionViaLLM` already exist,
[src/cli/llm/client.ts](../../src/cli/llm/client.ts)).

## Files touched (A + B)

- `desktop/src/panel/recall.ts` — A1, A2, B (card side)
- `desktop/src/i18n.ts` — new keys, all locales
- `src/cli/commands/mcp.ts` — `zam_open_recall` optional `domain`
- `tests/cli/mcp.test.ts` — `domain` input + echo assertions
- `desktop/src/main.ts` — Studio early-finish, only if missing
- `docs/specs/2026-07-10-recall-card-ux-design.md` — this doc
