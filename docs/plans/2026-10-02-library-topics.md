# Library Topics — Phase 1

Implements [ADR 2026-10-02](../adr/2026-10-02-library-topics.md), phase 1:
derived topics, starting one, the learner's own catalog. Branch
`feat/team-topics`; the goal-step commit-on-Next fix it started from (PR #371)
reached `main` separately on 2026-10-02 and ships in the same release.

## Status

- [x] Kernel — `src/kernel/library/topics.ts` (SQLite and PostgreSQL 18 tests)
- [x] Bridge — `library-topics-list`, `library-topic-start` (also on the Studio panel allowlist)
- [x] Studio — Learning Content action, catalog dialog, empty-dashboard pointer (verified in the built desktop app, 2026-10-02)
- [x] Docs — colleague guide, OKF articles, ADR status
- [ ] MCP Apps panel click-through in VS Code (wiring shared with the desktop; not driven in the host yet)

## Kernel

`src/kernel/library/topics.ts`, exported from `src/kernel/index.ts`:

- `libraryTopicKey(sourceLink)` — trims, drops the `#fragment`; `null` for an
  empty link.
- `libraryTopicName(key)` — last path segment of a URL or file path, decoded,
  extension dropped, `-`/`_` to spaces, first letter upper case; `index` and
  `readme` take their parent folder's name.
- `listLibraryTopics(db, userId)` — one query: published, not deprecated, not
  in maintenance, `source_link` present, `LEFT JOIN cards` on the learner.
  Grouped in code (fragment stripping in SQL is not portable, and `LIKE` would
  treat `_` in URLs as a wildcard). Returns `{ key, name, domain, itemCount,
  heldCount, setAsideCount }`; not-started first, then by name, then key.
- `startLibraryTopic(db, userId, key)` — same filter, members of the key, one
  transaction, `ensureCard` per member without a card. Returns `{ key, name,
  itemCount, created, alreadyHeld, setAside }`. Unknown key → error.

Tests: `tests/kernel/library-topics.test.ts` on SQLite (grouping, filters,
naming, idempotence, detached stays detached, two learners independent) plus a
PostgreSQL block that skips without `POSTGRES_URL`.

## Bridge

`bridge-handlers.ts` handlers over the kernel; `bridge.ts` commands
`library-topics-list` and `library-topic-start --key <key>`, JSON only, user
from the usual resolution (team mode derives it). Both join the Studio panel
allowlist in `mcp.ts` — they write only the caller's own cards and call no
model.

## Studio

- `desktop/src/library-topics.ts`: builds its own dialog (shared by the
  desktop Studio and the MCP Apps panel), lists topics with "N cards · you
  have M", one **Start learning** per row, result line, reload after start.
- **Library topics** button in the Learning Content header of
  `desktop/index.html` and `desktop/src/panel/studio-panel.html`.
- Dashboard: when the deck is empty, ask `library-topics-list`; if it returns
  topics, show **Start with the library's topics** under the empty-deck line.
- i18n: all seven Studio locales (`en`, `de` and the `es`/`fr`/`pt`/`zh`/`ja`
  packs), as the locale completeness test requires for new keys.

## Docs

- `docs/team-library.md`: "Get your first cards".
- OKF `token-card-model.md` (library topics paragraph) and
  `bridge-protocol.md` (the two commands) via `zam_okf_upsert`.
- ADR status → Implemented (phase 1) once verified.

## Verification

`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`; the
dialog driven in the desktop preview against a mocked bridge; the bridge
commands against an isolated profile with an OKF-imported article.
