---
type: protocol
title: Local Card File Import
description: ZAM imports text cards from local APKG, CSV, and TSV files through a deterministic preview and one atomic, model-free commit.
tags:
  - import
  - anki
  - offline
  - studio
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/local-card-file-import.md"
timestamp: 2026-08-09T06:54:25Z
---

ZAM's model-free file path starts in the Learning Content Studio: choose a
local file, inspect its preview, then confirm the import. The supported formats
are classic text-capable Anki packages (`.apkg` containing
`collection.anki2` or `collection.anki21`) and UTF-8 CSV/TSV tables. Neither
preview nor commit calls an LLM or the network.

CSV and TSV need one question column (`question`, `front`, or `prompt`)
and one answer column (`answer`, `back`, or `concept`). Optional columns
include `id`, `deck`, `tags`, `source`, `author`, `license`, and
`title`. An explicit `id` makes row identity stable across reordering.
Without it, identity is based on the source filename and row position, and the
preview warns that reordering can look like a content change.

The APKG reader renders each basic Anki card direction separately. Its stable
external identity is the note GUID plus card ordinal; the binding also keeps
the deck path, sibling note GUID, tags, source, author, license, and content
hash. Import is content-only: Anki due dates, ease, lapses, review history, and
scheduler parameters are ignored. Each valid rendered card becomes one shared
token and one card for the importing learner.

Packages and templates are untrusted input. The ZIP reader validates entry
paths, encryption, compression methods, CRC checksums, entry count, compressed
size, expanded size, compression ratio, and the collection database structure
before reading cards. It never extracts archive paths and never executes
template JavaScript. Rendered HTML becomes inert plain text; active HTML and
remote resource references are removed and reported. Media is reported as
omitted. Cloze, filtered or unknown template expressions, and cards that have
no text after sanitizing are reported as unsupported rather than silently
converted. Rich media and Cloze semantics are not part of the text importer.

The preview groups decks and reports create, update, skip, conflict,
unsupported, and new-personal-card counts. It carries a deterministic plan hash
over the parsed content, metadata, warnings, and current library classification.
Confirmation reparses the local file and recomputes the plan inside the write
transaction; a changed file or library state invalidates the confirmation
before the first write.

`imported_card_bindings` maps an external identity to its shared token and
last imported hashes. An unchanged re-import skips shared content while still
creating a missing personal card for another learner. A source content change
uses the material content-revision path: token content changes and learned
cards become due for a re-test, while stability, difficulty, review history,
and other FSRS state remain intact. If both local content and the source differ
from the last imported version, the preview reports a conflict and preserves
the local token. All non-conflicting cards commit in one transaction or the
library remains unchanged on failure.

The bridge exposes the same operation as
`personal-card-import-file-preview --path <file>` followed by
`personal-card-import-file-confirm --path <file> --plan-hash <hash>`.
Imported bindings are included in portable database snapshots, so backup and
restore retain safe re-import identity alongside content and learning state.

# Citations

- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- Code: `src/cli/import/text-file.ts`, `src/cli/import/delimited.ts`, `src/cli/import/apkg.ts`, `src/cli/import/safe-zip.ts`, `src/cli/import/text-sanitizer.ts`, `src/kernel/import/text-import.ts`, `src/kernel/db/schema.ts`, `src/kernel/db/provision.ts`, `src/kernel/db/snapshot.ts`, `src/cli/commands/bridge.ts`, `desktop/src/learning-content.ts`, `desktop/src/main.ts`
