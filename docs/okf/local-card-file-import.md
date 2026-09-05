---
type: protocol
title: Local Card File Import
description: ZAM imports basic, Cloze, image-occlusion, image, and audio cards from local APKG files, plus text cards from CSV and TSV, through a deterministic preview and atomic model-free commit.
tags:
  - import
  - anki
  - offline
  - studio
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/local-card-file-import.md"
timestamp: 2026-09-05T22:00:00.000Z
---

ZAM's model-free file path starts in the Learning Content Studio: choose a
local file, inspect its preview, then confirm the import. Supported formats are
classic Anki packages (`.apkg` containing `collection.anki2` or
`collection.anki21`) and UTF-8 CSV/TSV tables. Neither preview nor commit
calls an LLM or the network.

CSV and TSV need one question column (`question`, `front`, or `prompt`)
and one answer column (`answer`, `back`, or `concept`). Optional columns
include `id`, `deck`, `tags`, `source`, `author`, `license`, and
`title`. An explicit `id` makes row identity stable across reordering.
Without it, identity is based on the source filename and row position, and the
preview warns that reordering can look like a content change. CSV and TSV stay
text-only and report media markup as unsupported.

The APKG reader preserves each Anki card's note GUID and card ordinal as its
stable external identity. The note GUID is also retained as the sibling group.
Scheduling data from Anki—due dates, ease, lapses, review history, and scheduler
parameters—is intentionally ignored; each imported card receives native ZAM
FSRS state for the importing learner.

Basic front/back cards, native Cloze cards, and native image-occlusion cards
with rectangular or elliptical masks are rendered without executing Anki
templates. Cloze questions reveal only the active deletion as `[...]` or its
hint; answers reveal that deletion. Image-occlusion questions draw the active
mask over the packaged image and answers show the unmasked image. Unsupported
template expressions, Cloze variants, occlusion shapes, or cards that become
empty after sanitizing are reported explicitly.

APKG media is resolved through Anki's numeric ZIP-entry manifest. Referenced
PNG, JPEG, GIF, and WebP images and MP3, Ogg, WAV, and M4A audio are
signature-checked, bounded by archive, item, image-dimension, and decoded-pixel
limits, hashed, and stored once in `media_assets`. `token_media` links an
asset to the question or answer, records its presentation kind and original
name, and stores normalized image-occlusion geometry. Remote URLs, active
formats such as SVG, mismatched signatures, unsafe names, oversized media, and
unreferenced package files never become review content.

Packages and templates are untrusted input. The ZIP reader validates paths,
encryption, compression methods, CRC checksums, entry counts, compressed and
expanded sizes, compression ratios, the media manifest, and the collection
database structure. It reads entries in memory without extracting archive paths
and never runs HTML, JavaScript, template code, or remote fetches. Rendered
text is reduced to inert plain text. Desktop and standalone mobile review
surfaces reconstruct only bounded image/audio blobs from the trusted database
bytes and render occlusion overlays themselves.

The preview reports create, update, skip, conflict, unsupported, new-personal-
card, media-item, and media-byte counts by deck. Its deterministic plan hash
covers parsed text, metadata, media digests and presentation metadata, warnings,
and the current library classification. Confirmation reparses the local file
and recomputes the plan inside the write transaction; a changed file or library
state invalidates confirmation before the first write.

`imported_card_bindings` maps an external identity to its token and last
imported hashes. Unchanged re-import skips shared content while still creating
a missing personal card. First import of an existing Anki or file card is an
adoption path: the new token is published. A later source wording change
against **published** content is linted (`published_content_opt_in`) and does
not overwrite the last published version or imported schedule unless the caller
opts in to apply a material revision. Drafts may still be updated. If local
content and the source both changed since the last import, preview reports a
conflict and preserves the local token. All non-conflicting cards, media
assets, links, and bindings commit together or the library remains unchanged.

The [curated open-content library](open-content-library.md) is a separate
network-assisted discovery surface in front of this same parser. It verifies a
catalog-owned artifact before parsing and overlays reviewed provenance; choosing
a learner-owned local file remains completely network-free.

The bridge exposes the operation as
`personal-card-import-file-preview --path <file>` followed by
`personal-card-import-file-confirm --path <file> --plan-hash <hash>`.
`get-review` inlines media bytes as base64 plus trusted MIME and presentation
metadata only for a rendering surface that passes `--media`; every other
caller, including an agent, gets the queue's `hasQuestionMedia` and
`hasAnswerMedia` flags instead of the payload. Portable snapshots include
bindings, media assets, media links, and card state, so restore retains both
safe re-import identity and rich reviews.

# Citations

- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Anki Manual — Editing](https://docs.ankiweb.net/editing.html)
- [Anki source — APKG importer](https://github.com/ankitects/anki/blob/main/pylib/anki/importing/apkg.py)
- Code: `src/cli/import/text-file.ts`, `src/cli/import/delimited.ts`, `src/cli/import/apkg.ts`, `src/cli/import/safe-zip.ts`, `src/cli/import/text-sanitizer.ts`, `src/kernel/import/text-import.ts`, `src/kernel/models/media.ts`, `src/kernel/db/schema.ts`, `src/kernel/db/provision.ts`, `src/kernel/db/snapshot.ts`, `src/cli/bridge-handlers.ts`, `src/cli/commands/bridge.ts`, `desktop/src/learning-content.ts`, `desktop/src/main.ts`, `mobile/src/main.ts`
- Tests: `tests/cli/text-file-import.test.ts`, `tests/kernel/text-import.test.ts`, `tests/kernel/snapshot.test.ts`
