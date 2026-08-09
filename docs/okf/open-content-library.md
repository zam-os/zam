---
type: protocol
title: Curated Open-Content Library
description: ZAM exposes a Studio-first catalog of reviewed open-licensed decks whose pinned artifacts are downloaded, integrity-checked, previewed, and imported through the normal safe card-import contract.
tags:
  - import
  - open-content
  - licensing
  - studio
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/open-content-library.md"
timestamp: 2026-08-09T10:50:00Z
---

The Learning Content Studio opens on the **Open Library** tab. It lists the
catalog bundled with the installed ZAM release and lets the learner search by
title, description, author, subject, or tag and filter by language and subject.
Listing the catalog is local; a deck is downloaded only when the learner asks
for its preview.

Every catalog entry contains a stable ID, description, author and attribution,
an explicit compatible license with upstream evidence, source and project URLs,
language and subject metadata, and one immutable artifact record. The artifact
record pins the upstream revision, APKG filename, byte size, expected card
count, SHA-256 digest, HTTPS download URL, and permitted final download hosts.
Catalog validation runs when the CLI module loads. Entries with missing
attribution, unsupported licenses, mutable-looking revisions, unsafe URLs,
invalid digests, or incomplete discovery metadata stop the catalog from
loading.

Catalog revision 1 contains three English decks from Donne Martin's System
Design Primer: System Design Fundamentals (42 cards), System Design Exercises
(8 cards), and Object-Oriented Design Exercises (6 cards). All three artifacts
are pinned to upstream commit
`ae9bbd7b02d90b9866215de185217d33f39ab733`; the upstream repository licenses
its code and resources under CC BY 4.0. ZAM does not query, scrape, automate, or
mirror AnkiWeb, and it does not load catalog entries from a remote registry.

A preview download uses HTTPS without credentials or a referrer and accepts
redirects only when the final host remains on the entry's allowlist. The
response's declared and streamed sizes are bounded by the pinned byte count,
then the complete body must match the pinned SHA-256 digest. Verified artifacts
are stored under `~/.zam/open-content` with a filename derived only from the
reviewed item ID and digest. Every cache hit is size-checked and re-hashed before
use; an invalid cache entry is replaced only after a fresh artifact passes all
checks.

The verified APKG then enters the same untrusted-file parser described in
[local-card-file-import.md](local-card-file-import.md). A curated artifact must
still produce its reviewed card count and no unsupported cards. ZAM overlays
the catalog's pinned source URL, author, CC license, and catalog tags on every
card, so provenance persists in imported bindings and token source links
instead of depending on optional package fields.

The Studio shows attribution, source, license, deck counts, sanitizer warnings,
conflicts, and proposed actions before enabling import. Confirmation selects the
catalog item by ID, re-verifies the cache, reparses the APKG, and passes the
preview's exact plan hash to the normal atomic import transaction. Once the
artifact is cached, preview and confirmation need no further network access.
No LLM participates in listing, verification, parsing, preview, or commit.

The JSON bridge exposes the same flow as
`open-content-list [--query ...] [--language ...] [--subject ...]`,
`open-content-preview --id <catalog-id>`, and
`open-content-confirm --id <catalog-id> --plan-hash <hash>`. The list response
also states that the catalog is curated, explicit licensing is required, and
AnkiWeb automation is disabled.

# Citations

- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [System Design Primer — upstream project and deck links](https://github.com/donnemartin/system-design-primer)
- [System Design Primer — CC BY 4.0 license](https://github.com/donnemartin/system-design-primer/blob/ae9bbd7b02d90b9866215de185217d33f39ab733/LICENSE.txt)
- Code: `src/cli/open-content/catalog.ts`, `src/cli/open-content/download.ts`, `src/cli/open-content/service.ts`, `src/cli/commands/bridge.ts`, `src/cli/import/text-file.ts`, `src/kernel/import/text-import.ts`, `desktop/src/learning-content.ts`, `desktop/src/main.ts`
- Tests: `tests/cli/open-content.test.ts`, `tests/cli/bridge-open-content.test.ts`, `tests/desktop/open-content-wiring.test.ts`
