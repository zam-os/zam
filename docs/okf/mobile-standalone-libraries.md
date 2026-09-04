---
type: architecture
title: Standalone Mobile Libraries
description: ZAM Mobile runs standalone libraries, per-learner Flash or answer review, and cell-first curriculum flows on Android and iOS; pairing remains an optional multi-device upgrade.
tags:
  - mobile
  - android
  - ios
  - recall
  - offline
  - curriculum
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/mobile-standalone-libraries.md"
timestamp: 2026-09-03T20:57:29.306Z
---

ZAM Mobile is a standalone learning app on Android and iOS. An unpaired first
launch opens the device-local `zam-local.db`, provisions it through the
kernel's async `Database` contract, and shows a three-step setup when the
database has no learner identity. No desktop, account, model, network
connection, camera permission, or server database is required.

The setup records the interface locale and the fixed local learner id `me`,
seeds the selected persona's knowledge context, and creates three localized
starter cards. Those cards are ordinary tokens plus personal cards: they enter
the normal review queue and can later be edited, paused, or deleted. Repeating
setup is idempotent and preserves an existing learner identity.

A local library and a server-backed library are two explicit modes. Local mode
has no upstream, hides synchronization controls, and rejects `db_sync` rather
than claiming to be synchronized. QR pairing remains available as an explicit
takeover for a learner who already has a server-backed ZAM library.

Moving a local library to a server database is a learner-chosen multi-device
upgrade. ZAM exports a portable snapshot before opening the remote, provisions
the remote schema, refuses a non-empty target unless replacement was confirmed,
imports the snapshot, and only then persists the pairing. On failure it reopens
the local library, and the local database file is never deleted. Once attached,
the remote mode remains online-only and does not pretend to provide an offline
replica.

The Rust shell owns the local or remote libSQL connection. The WebView uses the
same TypeScript kernel and node-free provisioning path on both mobile
platforms, so scheduling, migrations, snapshots, and token/card behavior do not
fork into Android or iOS implementations.

# Curriculum discovery and cell precedence

Mobile navigates the same provider registry and manifests as Desktop: country
or region, school type, grade, subject, optional track, then topic. A completed
position is resolved against bundled-cell curriculum scopes before any generic
import is offered. When one or more reviewed cells cover the position, those
cells are the only curriculum offer. Only a position with no covering cell
falls back to its provider's topic list. This implements the cell-precedence
rule at the surface instead of asking a learner to understand the distinction.

The ordinary Library screen shows active learning paths and one guided
curriculum action; it does not render the whole bundled catalog. Cell status is
computed with bulk queries over the relevant atoms, practice items, and cards,
and provider-specific track aliases are normalized when a manifest and a
published tile use different stable spellings.

Reviewed bundled cells install and enrol without a model or network connection.
A generic curriculum topic is stricter: its official source must have verified
content, the native shell performs a bounded HTTPS text fetch on both Android
and iOS, and a connected cloud text endpoint produces grounded card drafts.
Every draft carries the official `source_link`, provider, and stable topic id,
and must pass through the editable multi-draft confirmation UI before it
becomes a token and personal card. HTTP and model selection stay outside the
kernel.

# Bundled learning paths and field-test review

The Mobile Library uses the same commit-controlled bundled learning-cell
catalog as Desktop. One learner action installs the tile and then enrols the
current user, but the kernel operations remain separate: installation writes
shared atoms, bindings, edges, and practice items with zero cards; enrolment
materializes only the cell's scoped personal cards. Status checks require every
atom **and** every practice-item id, so overlapping cells cannot produce a
false installed badge.

A mobile review session persists a bounded kernel queue snapshot. It renders
the item tier, turns valid Tier-1 binary checks into one-tap choices, offers
finite hard-precondition self-assessment when the prerequisite reaches the
queue, and exposes keep-going only after the snapshot ends. Accepted unseen
cards use an explicit temporary `maxNew` budget; future reviews and active
precondition deferrals may be pulled to the present. A prepared out-of-scope
bonus atom is offered, never scheduled automatically. All of these paths work
against either the local or server-backed database through the same async
kernel contract.

Each learner also has a persisted learning interaction and voice timeout
object. Without a stored choice, a reachable cloud text evaluator defaults to
`answer_feedback`; otherwise Mobile starts in `flash`. Connecting or
disconnecting a model recomputes only that fallback and never overwrites an
explicit preference. Settings offers Flash, answer-and-feedback, and the
currently scaffolded answer-variation choice. The review header offers an
immediate Flash/AI switch, pauses active voice capture before saving, and rolls
the UI back with an error if persistence fails.

Flash hides the keyboard path and Tier-1 choice buttons, lets a tap reveal the
stored answer, skips evaluation and discussion, and exposes the same four FSRS
self-ratings. In hands-free Flash review, speech supplies reveal, stop, and
rating commands rather than a learner answer. Prompts become progressively
shorter, then earcon-only; reveal timeout auto-reveals, while rating timeout
pauses without manufacturing a lapse.

After a typed answer in an answer mode is revealed and an AI evaluation
succeeds, the same review screen opens an ephemeral follow-up discussion on
both Android and iOS. Every turn resends the stable card frame, the learner's original answer,
the evaluation feedback, and the complete prior thread through the configured
`recall` tier. Android follows the learner's device/cloud preference and can
answer with Gemini Nano; iOS uses a reachable cloud text model because the
supported iPad and iPhone range has no on-device evaluator.

The discussion has no turn cap, but it never becomes review evidence. Rating
a card, moving to another card, correcting the card, or ending the session
discards the thread and invalidates any reply still in flight. Follow-up turns
never call the scheduler or write FSRS state. If the initial evaluation did
not succeed, the follow-up control stays hidden and ordinary self-rating
continues to work without AI.

# Citations
- [Flashcard learning-mode plan](../plans/2026-09-03-flashcard-learning-mode.md)
- [ADR 2026-07-06b — Checkpointed Review Dialogue](../adr/2026-07-06b-checkpointed-review-dialogue.md)
- Tests: `tests/mobile/discuss.test.ts`, `tests/mobile/discussion-wiring.test.ts`, `tests/mobile/learning-mode-wiring.test.ts`, `tests/mobile/review-session.test.ts`, `tests/mobile/voice.test.ts`, `tests/desktop/discussion.test.ts`
- Code: `mobile/src/discuss.ts`, `mobile/src/evaluate.ts`, `mobile/src/main.ts`, `mobile/src/review-session.ts`, `mobile/src/voice.ts`, `mobile/index.html`, `src/kernel/scheduler/study-settings.ts`, `src/kernel/recall/voice-review.ts`, `desktop/src/discussion.ts`
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- Tests: `tests/mobile/curriculum.test.ts`, `tests/mobile/curriculum-wiring.test.ts`, `tests/mobile/review-session.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/precondition-assessment.test.ts`
- Code: `mobile/index.html`, `mobile/src/main.ts`, `mobile/src/curriculum.ts`, `mobile/src/import.ts`, `mobile/src-tauri/src/curriculum.rs`, `mobile/src-tauri/src/vision.rs`, `src/cli/curriculum/registry.ts`, `src/cli/curriculum/content-readiness.ts`, `src/kernel/library/bundled-cells.ts`

- [ADR 2026-08-08 — ZAM on iPadOS Is a Standalone App, Not a Companion](../adr/2026-08-08-ios-standalone-app.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- Code: `mobile/src/main.ts`, `mobile/src/setup/first-run.ts`, `mobile/src/setup/upgrade.ts`, `mobile/src-tauri/src/db.rs`, `src/kernel/db/provision.ts`, `tests/mobile/first-run.test.ts`, `tests/mobile/upgrade.test.ts`
