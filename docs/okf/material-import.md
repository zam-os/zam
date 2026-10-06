---
type: protocol
title: Learning Cards from Photos and Files
description: A model reads a learner's photos or PDF itself and proposes cards; the learner decides each one as Yes, No or Bonus in one review list, and only a source link and file fingerprints are kept.
tags:
  - import
  - llm
  - studio
  - mobile
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/material-import.md"
timestamp: 2026-10-06T08:00:00.000Z
---

A learner's class notes and handouts become learning cards in three steps:
a model reads the material, ZAM matches its proposals against the library,
and the learner decides each card in one review list. Nothing is written
before that decision, and nothing of the material itself is ever stored.

# The model reads the page

Images and PDFs go to the model as they are, as image or file content parts.
No step turns them into plain text first, and no transcript is stored or
shown: layout, arrows and highlighted headings carry meaning a transcript
loses.

- **One import** is up to ten photos, or one PDF — never both. Photos of one
  entry belong together; a PDF goes whole, and the learner can name the pages
  to use. One subject per import: material from several subjects is imported
  in separate runs.
- **Photos** are scaled to a long edge of 1568 px before sending where the
  platform can do it without a new dependency: `sips` on macOS (which also
  converts HEIC to JPEG), the WebView canvas on Mobile. Elsewhere photos go
  unchanged within 10 MB per file and 20 MB per request, and HEIC is refused
  with a hint to export JPEG.
- **PDFs go only to models that read them natively.** The `file` capability is
  detected from the provider's declared input modalities (OpenRouter lists
  `file`), never from a model name; the Anthropic Messages API has it by
  contract, since it takes `document` blocks. The gate sits in the request
  builder, not only in the UI: on OpenRouter a PDF sent to another model would
  be transcribed on the provider's server. On OpenRouter the request also pins
  the native PDF engine, so a mismatch fails instead of falling back to OCR.
  There is no PDF renderer and no text layer for other models.

# Two ways in

**Through a harness** (opencode, Claude, Codex, Copilot …). The learner's AI
app reads the file, can ask back about an illegible word or the lesson, and
submits its proposals. `zam_material_import_context` hands the agent the
rules, the contract, an example, the learner's areas and the subject codes;
`zam_material_import` validates the proposals, fingerprints files it can read
from disk, stages the batch and brings the Studio forward, where the review
list opens by itself for a batch submitted in the last ten minutes. The
Studio's "Photo / PDF" dialog hands the learner a ready request to paste, with
each picked path quoted. This path is often the smarter one, because a
harness can ask back.

**Built in.** The same dialog can send the picked or dropped files to the
learner's connected model, named in the dialog ("Sent to …"). Photos go to the
first `image` row of the model registry, a PDF to the first `file` row;
harness-backed rows are left out. The request carries no reasoning-effort
control, so card writing gets the model's own default rather than the cheap
level verified for recall. A request the provider rejects for its image count
or size is split in halves and the cards are merged; a card whose file number
falls outside its half rejects the answer instead of landing on another photo.
When the named model fails, even after splitting, the next connected row gets
the whole request, as on the vision path — so the review list names the model
that read the pages and every model they were sent to ("Sent to Gemma, Luna;
read by Luna"), and Mobile does the same in its review line. The Studio runs the
analysis in its background bridge process, so the rest of the app stays
responsive. **On Mobile** the same request goes through the native
`vision_request` command; its 8 MB body limit is met by batching the photos
and merging the replies, and the whole pipeline runs on the device without a
staging file.

A harness or Studio batch waits in `~/.zam/pending-imports/<ULID>.json` for
up to seven days. A staging file holds the proposals and file references only
— no image bytes, no transcript — and is machine-local, never in the library.

# The review list

Every proposal is a row with Yes, No or Bonus:

- **Presets.** A card stated on the page starts on Yes; an `extra` card
  (related knowledge the page does not state) starts on Bonus; a `completed`
  card (the model's explanation or correction) and a card marked hard to read
  start without a choice. A row without a choice is not saved, and the confirm
  button says how many: "Add 7 · 2 as Bonus · 3 not saved".
- **Already there.** Each proposal is matched against the learner's library
  and the bundled cells: lexically on word stems, and by meaning when an
  embedding model is connected (the vector leg searches the whole library;
  the subject only bounds the word match and the cell catalog). A match stands
  **beside** the proposal, labelled "Already there", and inherits its preset,
  so by default the learner takes what the library holds while their own
  wording stays one tap away. A card the learner already holds is shown and
  takes no choice; a card set aside earlier counts as not held, and Yes
  re-attaches it.
- **Leads on to.** Up to three items of the same subject that the material
  leads to join the end of the list, preset to Bonus.
- **Areas.** The proposed area is shown above its cards and can be changed
  without regenerating them. The root of an area is the subject, never a life
  area: `chemie/stoffe`, not `schule/chemie/stoffe` (M038 rewrote stored
  `schule/` paths, and the bundled cells dropped the prefix in the same
  release, so no card was re-tested).
- **Re-import.** A file fingerprinted before is named ("You imported this file
  on 5 Oct."); it informs and never blocks.

The rules — presets, counts, grouping — live once in
`src/kernel/import/material-review-state.ts`, shared by the desktop Studio and
Mobile, with the CLI using its area grouping; each app keeps its own words and
DOM. The review list is not an MCP Apps panel.

# What one confirm writes

One transaction writes the learner's choices for exactly the rows they saw:

- one `sources` row for the import, keyed `zam-import:<ULID>` (never a file
  name — cameras reuse names), with the analysis title, the files' SHA-256
  fingerprints and the importing learner;
- for Yes on a proposal, a **published** token (`question_source = 'llm'`)
  and its card; for Bonus, the same token without a card;
- for Yes on an existing or continuation row, a card for what the library
  holds (a cell is installed first, outside the transaction); for Bonus, a
  link only;
- a `token_sources` link from every kept token to the import, with its page.

Each token's `source_link` names its own file: `file:///…/Arbeitsblatt.pdf#page=2`
for a file read from disk, `photo:IMG_1234.HEIC@2026-10-05` where there is no
path (a harness that did not pass one, every file on Mobile). The file itself
may be gone later; the link still says where the card came from. An exact
duplicate — same area, same question as a published token outside maintenance
— is linked instead of written twice.

# Bonus

Bonus means kept, offered, never scheduled: the token is published and linked
to the import, but the learner has no card for it, so it never enters the
queue. It has two places to be taken from:

- the **Bonus** view in Learning Content, a "Bonus (n)" button shown only while
  items are kept, grouped by import with a "Learn" action each;
- the **offer after the due queue**, on desktop and on Mobile (also on the
  Mobile dashboard): up to two items from the newest import, named by it,
  before the atom bonus — "Save for later" creates the cards. No score, streak
  or target.

A card the learner set aside ("not for me") before the import and then kept
as Bonus is listed; one set aside after the import stays out of every offer.

# Surfaces

- **MCP:** `zam_material_import_context`, `zam_material_import`.
- **Bridge:** `material-import-stage`, `material-import-pending`,
  `material-import-review`, `material-import-confirm`,
  `material-import-file-preview`, `material-import-discard`,
  `material-import-areas`, `material-import-models`,
  `material-import-analyze`, `material-import-bonus-list`,
  `material-import-bonus-take`. `material-import-analyze` answers a refusal as
  `{ success: false, code, message }` so the Studio can explain it.
- **Studio:** the "Photo / PDF" dialog and the review list in Learning Content;
  the Bonus button; the offer after the due queue.
- **Mobile:** "Photos or PDF" in the library's add view, the review list, and
  the Bonus offers.

The model-free [card file import](local-card-file-import.md) (APKG, CSV, TSV)
is a different path: it parses a card file deterministically and never calls
a model.

# Citations

- [ADR 2026-10-05 — Learning Cards from Photos and Files](../adr/2026-10-05-learning-cards-from-photos-and-files.md)
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md) (Decision 6: bonus means offered)
- [ADR 2026-09-13 — Model Capabilities Are Detected](../adr/2026-09-13-model-capabilities-are-detected.md)
- [OpenRouter — PDF inputs](https://openrouter.ai/docs/features/multimodal/pdfs)
- Code: `src/kernel/import/material-import.ts`, `src/kernel/import/material-contract.ts`, `src/kernel/import/material-review-state.ts`, `src/kernel/db/provision.ts` (M037, M038), `src/cli/material-import.ts`, `src/cli/material-staging.ts`, `src/cli/llm/material-prompt.ts`, `src/cli/llm/material-analyze.ts`, `src/cli/llm/capability-probe.ts`, `src/cli/commands/mcp.ts`, `src/cli/commands/bridge.ts`, `src/cli/desktop-launch.ts`, `desktop/src/material-import-start.ts`, `desktop/src/material-review.ts`, `desktop/src/material-bonus.ts`, `desktop/src/study-offers.ts`, `mobile/src/material-import.ts`, `mobile/src/material-review-view.ts`, `mobile/src/vl-import.ts`, `skills/zam/SKILL.md`
- Tests: `tests/kernel/material-import.test.ts`, `tests/kernel/material-review-state.test.ts`, `tests/kernel/postgres-material-import.test.ts`, `tests/kernel/schule-domain-migration.test.ts`, `tests/cli/material-import.test.ts`, `tests/cli/material-analyze.test.ts`, `tests/cli/material-prompt.test.ts`, `tests/cli/mcp-material-import.test.ts`, `tests/cli/bridge-material-import.test.ts`, `tests/desktop/material-review.test.ts`, `tests/desktop/material-import-start.test.ts`, `tests/desktop/material-bonus.test.ts`, `tests/mobile/material-import.test.ts`
