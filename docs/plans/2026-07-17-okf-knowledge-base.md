# Plan — OKF Knowledge Base (ADR 2026-07-17)

Harness-agnostic implementation plan. Any agent picking up a phase should
read [the ADR](../adr/2026-07-17-okf-knowledge-base.md) first; the ADR is
the contract, this plan is the sequencing. Delete this file once all phases
ship (plans lifecycle rule).

## Status

- [x] **Phase 1 — ADR + plan**
- [x] **Phase 2 — `src/cli/okf/` core module + unit tests**
- [x] **Phase 3 — MCP tools (`zam_okf_catalog` / `zam_okf_read` / `zam_okf_upsert`)**
- [x] **Phase 4 — seed bundle `docs/okf/` (6 articles) + conformance test**
- [x] **Phase 5 — `okf` skill (three copies) + CLAUDE.md/AGENTS.md sync**
- [x] **Phase 6 — verification (lint, tests, build) + PR**

## Phase 2 — core module

`src/cli/okf/bundle.ts` — pure, no fs, unit-testable:

- `parseFrontmatter(md)` → `{ fields: Record<string, string | string[]>, body }`
  or a typed error. Subset: `---` fences, scalar `key: value` (optional
  single/double quotes), block string lists (`key:` + `- item` lines).
- `validateArticle(fileName, md)` → `{ ok, problems[] }`: parseable
  frontmatter, non-empty `type`, non-empty `description` (house rule,
  stricter than OKF), kebab-case `*.md` file name, not a reserved name.
- `buildCatalog(articles)` → sorted entries `{ file, type, title,
  description, tags, resource, timestamp }` (title falls back to file stem).
- `renderIndex(catalog, okfVersion)` → root `index.md` (frontmatter only
  here: `okf_version`), grouped by `type`, one line per article sourced
  from its `description`.
- `appendLog(existing, date, line)` → `log.md` content, newest day first.

`src/cli/okf/io.ts` — thin fs layer: `loadBundle(dir)`,
`upsertArticle(dir, file, articleMd)` (validate → write → regenerate
`index.md` → append `log.md`). Rejects paths that escape the bundle dir and
writes to reserved names.

Tests: `tests/cli/okf-bundle.test.ts` (parser edge cases, validator
problems, index/log generation), tmpdir round-trip for `io.ts`.

## Phase 3 — MCP tools

In `createMcpServer` (`src/cli/commands/mcp.ts`), following the existing
`wrapHandler` pattern; all three take optional `bundle_dir` (default
`docs/okf` relative to the server cwd):

- `zam_okf_catalog {}` → catalog + conformance problems (doubles as the
  validation report).
- `zam_okf_read { file }` → raw markdown + parsed frontmatter.
- `zam_okf_upsert { file, markdown }` → validated write through
  `upsertArticle`; returns the updated catalog entry. Never writes
  `index.md`/`log.md` directly.

Update `tests/cli/mcp.test.ts` tool count/name list (18 → 21).

## Phase 4 — seed bundle

`docs/okf/`: root `index.md` (`okf_version: "0.1"`), `log.md`, six
articles, each grounded in the current code and citing ADRs instead of
restating rationale (ADR rule 2): `kernel-architecture`, `fsrs-scheduling`,
`token-card-model`, `prerequisite-blocking`, `bridge-protocol`,
`mcp-surfaces`. Frontmatter per article: `type`, `title`, `description`,
`tags`, `resource` (canonical `https://github.com/zam-os/zam/blob/main/docs/okf/<file>` URL),
`timestamp`.

`tests/cli/okf-conformance.test.ts`: loads the real `docs/okf` through the
Phase-2 module; asserts zero problems, index lists every article, resource
URLs match the canonical prefix + file name, internal links resolve.

## Phase 5 — skill + rules

- `okf` skill in `.claude/skills/okf/SKILL.md`, `.agent/skills/okf/SKILL.md`
  (identical) and `.agents/skills/okf/SKILL.md` (`$okf` wording for Codex,
  mirroring the `zam` skill copies): when to write an article, the
  ADR-vs-OKF split, the frontmatter subset, "always write through
  `zam_okf_upsert`", how to cite articles as `source_link`.
- CLAUDE.md + AGENTS.md (kept in sync): short "OKF knowledge base" section
  with the not-freely-editable rule and the same-PR staleness rule.

## Phase 6 — verification

`npm run lint`, `npm run test`, `npm run build` green; PR from
`feat/okf-knowledge-base`, review by Thomas.
