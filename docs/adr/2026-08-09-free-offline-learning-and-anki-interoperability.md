# Free Offline Learning and Anki Interoperability

**Status:** Accepted — decided by Thomas, 2026-08-09.
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-30-learning-content-studio.md](2026-06-30-learning-content-studio.md) ·
[2026-07-10-recall-card-ux.md](2026-07-10-recall-card-ux.md) ·
[2026-07-21-android-companion-tauri-shell.md](2026-07-21-android-companion-tauri-shell.md) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md) ·
[2026-07-26b-central-curriculum-content-service.md](2026-07-26b-central-curriculum-content-service.md) ·
[2026-08-08-ios-standalone-app.md](2026-08-08-ios-standalone-app.md)

---

## Context

ZAM can review existing cards without an AI model, but it does not yet offer a
complete zero-cost path for a new learner who already has, or can obtain, useful
learning material. Creating or importing substantial content still tends to
lead toward an LLM, a provider account, or ZAM-specific authoring.

Anki demonstrates the product value of a different path: learners can exchange
packaged decks, import them locally, and keep reviewing without a model call.
The important capability is not an AnkiWeb mirror. It is interoperability with
files learners are entitled to use, combined with trustworthy scheduling and a
standalone app on every supported device.

ZAM's scheduler currently implements the FSRS-5 parameter set and clamps a
scheduled interval to at least one day. That makes same-day learning and
relearning weaker than Anki's short-step workflow. Importing a large deck before
fixing that foundation would multiply the impact of the scheduling limitation.

"Fully free" in this ADR means that the normal learning loop requires no paid
model, API key, ZAM account, or hosted ZAM service. A learner can start with a
local file, review offline, and retain a portable backup. It does not grant
redistribution rights for third-party content and does not make every external
deck freely licensed.

## Decisions

### 1. A model-free learning path is a product contract

ZAM must support this end-to-end journey:

1. install and create a local library without an account;
2. import ready-made learning material from a local file with a preview;
3. review it offline using the normal scheduler;
4. export or back up both content and personal learning state.

AI may improve imported material later, but it must be an optional action after
the import. Missing model configuration must never block import, review, search
by ordinary fields, or backup.

### 2. Work is ordered by the value chain's dependencies

The product sequence for this zero-cost learning path is:

1. **Scheduling foundation:** add short learning/relearning steps and move from
   the current FSRS-5 implementation to the current supported FSRS generation,
   initially FSRS-6 compatible. Keep useful defaults so optimization is not a
   setup requirement.
2. **Safe text import:** add Studio-first `.apkg` and CSV/TSV import with a
   preview, explicit result counts, and an atomic commit.
3. **Android standalone mode:** make the existing local-first capability a
   learner-facing first-run path, matching the iPadOS decision: no desktop,
   pairing, account, or server database required.
4. **Rich Anki semantics and workload controls:** add media, Cloze and image
   occlusion support, sibling-aware scheduling/burying, and controls useful for
   exam or problem-card workloads.
5. **Broad open-content discovery:** only after import and local review are
   dependable, consider an open-licensed, user-facing deck registry or library.

This sequence does not delay the curated curriculum service already accepted
by ADR 2026-07-26b. The fifth item is the broader Anki-like discovery and
sharing surface, not the existing reviewed curriculum pipeline.

The Android standalone phase is implemented through the same node-free mobile
startup path as iPadOS: an unpaired launch opens `zam-local.db`, provisions it
through the kernel contract, and either restores its learner identity or shows
the three-step local setup. QR pairing remains an explicit takeover action.

The rich-semantics phase keeps the same safe rendering boundary. Classic APKG
media is resolved through Anki's numeric media manifest, verified and bounded,
then stored once by SHA-256 and attached declaratively to the question or
answer. Cloze deletions become ordinary spoiler-free question/answer text;
native rectangle and ellipse image occlusions become an image plus inert mask
geometry. ZAM still executes no Anki HTML, CSS, JavaScript, or add-on code.

Cards rendered from one Anki note use the retained note GUID as their sibling
group. Enabled new/review siblings are held out of the same queue and buried
until the next local day after a rating; active Learning/Relearning steps are
never buried. Each learner can choose a balanced, exam, problem-card, or custom
workload in Desktop or Mobile Settings. The same persisted limits and sibling
switches drive the kernel queue used by Studio, mobile, CLI, and agents.

### 3. The first interoperability boundary is files, not AnkiWeb

Version one accepts local `.apkg`, CSV, and TSV files. ZAM does not scrape,
automate downloads from, or mirror AnkiWeb. A learner may download a shared
deck through its normal distribution channel and then choose it in ZAM.

The learner-facing flow is Studio-first and has one clear action per step:

1. choose a file;
2. inspect a deterministic preview of decks, cards, warnings, and unsupported
   content;
3. import all valid rows/cards in one transaction or leave the library
   unchanged on failure.

CLI and agent entry points may expose the same kernel operation for automation,
but they are not the only setup path.

### 4. Imported content and imported progress are separate concerns

By default ZAM imports **content only**. It does not inherit another person's
review history, ease, due dates, lapses, or scheduler parameters. Personal
FSRS state starts in ZAM when the learner creates the imported cards.

An Anki note may render several cards whose recall directions differ. ZAM maps
each rendered Anki card to one token plus one personal card so recognition and
production can develop independently. Sibling identity is retained as metadata
for later burying and workload controls.

Stable external identity is based on the Anki note GUID plus card ordinal. ZAM
also retains the source deck path, tags, source/author/license metadata when
present, and a content hash. A re-import can therefore preview create, update,
skip, and conflict counts. Stable matches update content through ZAM's content
revision path while preserving personal scheduling state unless the learner
explicitly chooses to reset it.

A later, separate migration mode may import a learner's own Anki progress, but
only after the scheduler upgrade defines a tested state mapping. It is not part
of the initial importer.

### 5. Anki packages are untrusted input

The importer treats every package and template as untrusted:

- validate archive size, entry count, decompressed size, paths, and expected
  database structure before import;
- reject path traversal and archive bombs;
- never execute package JavaScript or add-ons;
- sanitize rendered HTML and block remote resource loads;
- report unsupported templates or fields instead of silently dropping them;
- store media only through a content-addressed, size-limited path when media
  support is implemented.

Local import does not imply a right to republish. A future public library must
require an explicit compatible license and attribution metadata. Unknown or
restrictive licensing remains suitable only for the learner's private import
where their rights allow it.

### 6. The contract is verified without network or AI

The feature is not complete until an automated end-to-end test starts from an
empty local library, imports a representative text deck with networking and AI
disabled, performs learning and same-day relearning, restarts, and exports a
recoverable backup. Import tests also cover rollback, duplicate re-import,
malformed archives, unsafe HTML, and unsupported content reporting.

## Consequences

### Positive

- A useful first session no longer depends on model availability or a learner
  authoring dozens of cards.
- Existing Anki communities become a source of privately importable material
  without ZAM operating a content marketplace.
- Scheduler quality improves before a large imported workload relies on it.
- Stable source identity permits safe re-imports instead of uncontrolled
  duplication.
- The same zero-account product promise applies to desktop, iPadOS, and Android.

### Negative / trade-offs

- `.apkg` compatibility is a maintained boundary against a foreign, evolving
  format; fixtures and explicit compatibility levels are required.
- One rendered Anki card per ZAM token may duplicate shared note text, but it
  preserves distinct recall directions and scheduling state.
- Content-only import is safer and more predictable, but it does not immediately
  migrate an experienced Anki learner's history.
- Safe interoperability is semantic, not pixel-identical: unsupported media
  codecs, template modifiers, and image-occlusion shapes produce clear
  warnings instead of executing foreign rendering code.
- A 1:1 visual rendering of arbitrary Anki templates is deliberately not a
  goal; safety and recall semantics take precedence.

## Alternatives considered

- **Build the importer before scheduling upgrades.** Rejected because every
  imported card would immediately inherit today's missing same-day behavior.
- **Use AI as the import bridge.** Rejected as the required path because it is
  slower, less deterministic, may alter card meaning, and violates the
  zero-cost contract.
- **Import all Anki scheduling state by default.** Rejected because shared decks
  often contain somebody else's history and Anki state has no lossless mapping
  onto the current ZAM scheduler.
- **Execute Anki templates for perfect fidelity.** Rejected because packages
  are untrusted and arbitrary script execution is incompatible with a safe
  importer.
- **Mirror AnkiWeb or launch a public deck catalog first.** Rejected because of
  licensing, moderation, operational cost, and the absence of a dependable
  import/review foundation.

## Citations

- `src/kernel/scheduler/fsrs.ts`
- `src/kernel/db/schema.ts`
- `desktop/src/i18n.ts`
- `mobile/README.md`, `mobile/src/main.ts`, `mobile/src/setup/first-run.ts`
- `mobile/src-tauri/src/db.rs`, `tests/mobile/first-run.test.ts`
- `docs/plans/2026-07-25-closed-group-library-handover.md`
- [Anki Manual: Packaged Decks](https://docs.ankiweb.net/importing/packaged-decks.html)
- [Anki Manual: Editing — Cloze and Image Occlusion](https://docs.ankiweb.net/editing.html)
- [Anki Manual: Deck Options — Limits and Sibling Burying](https://docs.ankiweb.net/deck-options.html)
- [Anki shared decks](https://ankiweb.net/shared/decks)
