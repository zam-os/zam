# Human-friendly Titles + `zam doctor` — implementation adaptation plan

Follows the **revised ADR 2026-07-04** (post Claude Fable 5 concept review).
The deltas section and final decisions must be reflected in code.

Written for any agent: read repo `AGENTS.md` and `CLAUDE.md` first.
Implement **one phase per focused run**, one commit (or clear PR) per phase.
Verify build + relevant tests after each phase.

## Current implementation snapshot (2026-07-04)

- `title` column exists (M010 migration, default '').
- `createToken` / `updateToken` accept `title`.
- Lexical `findTokens` already matches on `title`.
- `embeddingContentForToken` does **NOT** include title yet.
- Domain prefix logic (`-` and `LIKE '%-'`) still lives in:
  - `src/kernel/models/token.ts` (listTokens)
  - `desktop/src/main.ts` (getShortSlug, prereq/dependent filters, bootstrap, prefix collection)
  - Bridge help text.
- No `zam doctor` command.
- Some surfaces (CLI list, desktop editor, graph) already prefer `title`.
- Title generation in curriculum/LLM paths and bulk backfills are ad-hoc (previous manual edits).
- Many existing titles still contain domain echoes or are concept prefixes.
- Fallback in `createToken`: `title ?? concept ?? slug` (to be phased out for explicit titles).
- No unified "display title" helper yet.
- Bridge token responses include title in most places (additive, good).

## Goal

Make the system match the final ADR decisions exactly:
- Titles are findable (embedding + lexical).
- Domains use unambiguous `/` scoping.
- Display is always `title ?? shortSlug` (never `concept`).
- All maintenance goes through `zam doctor`.
- Generation + doctor enforce **no domain echo**; surfaces show domain context separately.
- Clean backfill path for the existing base.

## Phases (implement in order)

### Phase 1: Embedding content includes title (search coherence)

- [x] Update `embeddingContentForToken` (in `src/kernel/models/token-embedding.ts`) to accept `title?: string` and append `\n${title ?? ""}`.
- [x] Update the type `Pick<...>` to include title.
- [x] Update all call sites:
  - `src/cli/commands/token.ts`
  - `src/cli/commands/bridge.ts` (dedup and register paths)
  - Any tests.
- [x] Document in release notes / doctor output that this triggers a full re-embed (use existing staleness mechanism; `zam doctor titles` will drive it).
- [x] Add/adjust tests that the embedded text now contains the title line.
- [x] Verify `findTokens` already covers title (it does).

**Verification**: semantic search and dedup now see titles; run a small re-embed test.

### Phase 2: Switch domain scoping to `/` everywhere [x]

- Backend:
  - `src/kernel/models/token.ts`: change `listTokens` domainPrefix logic to `prefix + '/%'` (and exact match).
  - Update `ListTokensOptions` docs.
- Desktop (`desktop/src/main.ts`):
  - `getShortSlug`: change from `+ '-'` to `+ '/'`.
  - `visiblePrereqs` / `visibleDependents` filters.
  - `bootstrapGraphWithDomain` and `populateDomainTokenList`.
  - Prefix collection / grouping logic in `loadAndRenderDomains` and `renderDomainSelector` (the `includes('-')` and split logic).
- Bridge:
  - `src/cli/commands/bridge.ts`: update `--domain-prefix` description and any examples (use `/`).
  - `list-tokens` call sites.
- Docs / help / tests / ADR examples: replace all `docuware-cops-ai` style with `docuware-cops/ai`.
- `slugify` behavior when embedding domains into slugs: keep folding `/` → `-` (already intended).

**Note**: existing flat domains and old data stay valid. New scoped domains use `/`.

**Verification**: `--domain-prefix docuware-cops` correctly returns children with `/` ; short slugs strip correctly; no breakage for old `-` data (they remain flat).

### Phase 3: Unified display title helper + ban concept-as-label [x]

- Introduce a single helper, e.g.:
  ```ts
  // kernel or shared util
  export function getDisplayTitle(
    t: { title?: string | null; slug: string },
    activeDomainScope?: string | null
  ): string {
    if (t.title && t.title.trim()) return t.title.trim();
    return getShortSlug(t.slug, activeDomainScope); // existing logic moved here
  }
  ```
- Replace all ad-hoc `title || getShortSlug(...)` (desktop graph, pills, CLI list, status, etc.) with the helper.
- Audit and remove any place that falls back to `concept` for a human label (graph, lists, reports, etc.).
- In desktop content studio and graph, ensure the **domain** is shown alongside the title (badge, tooltip, or separate pill) when context is useful. Never strip domain words out of the title itself.
- Update any "no tokens" dummy objects to use the helper.

**Verification**: no `concept` text appears as node/pill/list labels; titles without domain echo + domain shown separately.

### Phase 4: `zam doctor` command skeleton [x]

- New CLI command `src/cli/commands/doctor.ts` (or extend existing).
- Entry point: `npx tsx src/cli/index.ts doctor [task] [--fix] [--dry-run] [--yes]`
- Default (no args): list available tasks with short descriptions + current health.
- Tasks are discovered (hard-coded registry for now, easy to extend).
- Common plumbing:
  - Dry-run by default.
  - Confirmation prompt unless `--yes` / non-interactive.
  - Progress reporting.
  - Use existing `withDb`, LLM config, etc.
- Wire into root CLI help and main index.

**Verification**: `zam doctor` runs, shows tasks, `--help` works, no side effects on dry-run.

### Phase 5: `titles` doctor task (backfill + quality rework) [x]

Implement inside doctor:

- [x] Task `titles`:
  - Scan for tokens with `title IS NULL OR title = '' OR title = slug` (or suspiciously short).
  - For weak titles (domain echo like "Axon Ivy …" when domain is `axon-ivy`, concept-prefix copies, question-stumps like "RAG Why", inconsistent casing, overly long).
  - Use LLM (respecting the token's established language from its content) with the strict prompt rules from the ADR:
    - Thoughtful name, ≤ ~80 chars.
    - **No domain echo**.
    - Prefer name over definition.
  - Show proposed changes (old → new) + reason. (dry-run)
  - On `--fix`: apply via `updateToken`, which will mark content stale → auto re-embed on next use.
- [x] Also handle the one-time "title now participates in embeddings" re-embed for tokens that get a title for the first time. (via update)
- [x] Support `--dry-run`, interactive review, or bulk `--fix`.

[x] Add the generation prompt rules (no-domain-echo) to any curriculum import paths that create titles (already in LLM prompt).

**Verification**: running `doctor titles --dry-run` on the current base proposes sensible clean titles; applying a few works and search sees them. (tested manually)

### Phase 6: `texts` doctor task (legacy umlaut repair in prose) [x]

- [x] Task `texts`:
  - Find tokens where `question`, `concept`, or `context` still contain ASCII-folded umlauts ("Ueber", "fuer", "naechste", etc.) from the pre-fix era.
  - Also cover slugs if any slipped through (though slugs should already be fixed).
  - Use heuristics + optional LLM inference when source not available.
  - Propose repaired text.
  - On apply: update fields; because content changed → re-embed automatically.
- This fixes the "legacy data contains folded prose" problem mentioned in the ADR.

**Verification**: German content with old folds gets repaired; English unaffected. (heuristic impl + tested)

### Phase 7: Remaining doctor tasks + wiring [x] (basic impl)

- `duplicates`: surface semantic duplicates (reuse existing dedup code) for user review/merge/deprecate.
- `domains`: help rename/unify domains into `/` hierarchy (update the `domain` field only; never mutate slugs).
- Make sure `doctor` is registered in the main CLI.
- Add basic tests (at least smoke + that tasks report without writing by default).

### Phase 8: Polish, tests, docs, release notes [x partial]

- [x] Update all help texts (`--help`, bridge descriptions) to use `/` for scoped domains.
- [x] Ensure curriculum/LLM title prompts (wherever they live) contain the no-domain-echo instruction + language awareness. (prompt already has it)
- [x] Update any remaining references in plans, README, AGENTS.md if relevant. (plan updated)
- [x] Add regression tests for:
  - title in embedded content (updated tests)
  - `/` prefix matching (manual + bridge)
  - display helper (used in CLI/desktop)
  - doctor dry-run behavior (tested)
- [ ] Write release note text...
- [x] Verify the 3D graph (logic), Content Studio editor, CLI list/status, and search all behave correctly with the new titles + domains. (manual CLI + code tests done)

**Manual tests performed at end (as requested):**
- token list/status shows titles
- doctor titles/texts/domains work (dry + fix)
- domain-prefix with / works in bridge (e.g. health/ matches health/sleep)
- getDisplayTitle + getShortSlug with / prefix logic correct
- build + full tests pass
- bad title -> doctor fix produces good non-echo descriptive title
- embedding includes title (verified in code)


## Non-goals (per ADR open questions)

- Full hierarchical ontology / composite domain+slug identity (separate future ADR).
- First-class "context" (work vs private) attribute.
- Deep doctor UX polish (interactive wizard etc.) — basic usable version first.

## How to run

```bash
# after each phase
npm run build
npm test
# manual smoke
npx tsx src/cli/index.ts doctor --help
npx tsx src/cli/index.ts doctor titles --dry-run
```

Prefer small, reviewable changes. Update this plan file (check off phases) as you go.

## References

- ADR: `docs/adr/2026-07-04-human-friendly-titles-and-prefixed-domains.md` (especially Post-review deltas and Decision sections)
- Related: semantic search embedding pipeline, existing `findTokens`, domain filtering code, `personal-card-create`/`edit`.

Start with Phase 1.
