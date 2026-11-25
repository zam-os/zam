# Private Academy providers — implementation plan

**Status:** Not started.\
**Decision:** [ADR 2026-11-25 — Private Academy Providers](../adr/2026-11-25-private-academy-providers.md). Its decisions are cited here as **D1–D9**. Read the ADR first; this plan does not repeat its reasons.\
**Branch:** `feat/private-academy-providers`, from `main`. One feature, one branch, one PR, one commit per phase.

This document is harness-agnostic. Any agent or person can pick up the next unchecked item without other context. An item is done when its exit evidence exists: a test, a grep result or a recorded check.

## What the code review for this plan found

The ADR describes the goal; reading the code showed three things it has to rest on. They are part of this plan, and Decision 5 was corrected accordingly (ADR status history, 2026-11-25):

- **The library does not record which atoms belong to which tile.** `installed_tiles` holds only `tile_id` and `version`, and neither `learning_atoms` nor `tokens` names a tile. A team-library member therefore cannot enrol from an installed tile without its JSON (D7), and the `replaces` guard (D5) cannot tell whose item it moves. Item 1.3 adds the record.
- **A tile can overwrite atoms and items it does not own.** `installKvtTile` upserts `learning_atoms` by id and revises tokens by item id. A private tile that reuses a public atom or item id would rewrite public content. Item 1.4 extends the namespace guard from tile ids to atom and item ids.
- **Prerequisites must stay inside one tile.** `installKvtTile` refuses an atom that requires an atom outside its tile. D5's sentence about prerequisites on public atoms does not hold today; the ADR now says a private package names a public package it builds on in its lesson text, and cross-tile prerequisites are a separate, later change.

## Rules that apply to every phase

- New learning logic goes into `src/kernel/`. The kernel imports no HTTP and no LLM code; fetching stays in `src/cli/`.
- **No provider is named in this repository.** Tests use the provider id `example-provider`, the origin `https://provider.example`, and the GUIDs `00000000-0000-0000-0000-000000000000` / `11111111-1111-1111-1111-111111111111`. Before each commit, grep the diff for organisation, tenant, host and group names.
- **The public ZAM Academy behaves exactly as before.** `tests/cli/academy.test.ts`, `tests/kernel/academy-catalog.test.ts`, `tests/kernel/academy-cells-lock.test.ts` and the bundled-cell tests stay green without edits to their expectations.
- A schema change goes into BOTH `src/kernel/db/schema.ts` and a numbered, idempotent migration in `runMigrations` (`src/kernel/db/provision.ts`), and raises `CURRENT_SCHEMA_VERSION` there. It is 49 today, so this plan uses **M050**. If `main` has moved, take the next free number.
- Every tool must be safe to auto-approve (`docs/okf/agent-trust-model.md`). The provider list is a security switch: no MCP tool and no `STUDIO_BRIDGE_COMMANDS` entry reads a URL from an argument to fetch it, or writes the list.
- Every regression test the ADR lists (Delivery, D9 of ADR 2026-10-08b) lands in the same commit as the code it guards.
- `zam bridge` prints JSON only, errors included. Error messages that Studio branches on start with a code: `ENTRA_LOGIN_REQUIRED`, `PROVIDER_ACCESS_DENIED`, `PROVIDER_NOT_CONFIRMED`, `PROVIDER_CHANGED`.
- No new dependency.
- Verify at the end of each phase: `npm run lint`, `npm run typecheck`, the named test files with `npm run test -- <file>`, then `npm run build`. Phases 1 and 4 also run `npm run pg:test`. If lint fails before you touched code, check that `biome.json` matches the installed Biome first.
- Commit format: `<type>: <short summary>`. Everything on GitHub is English.

## Phase 0 — Hosting spike (outside ZAM, owner)

Goal: the token path of the ADR's hosting section works before any client code depends on it. Phases 1–2 can start meanwhile; item 3.6 needs this phase.

- [ ] **0.1** A web app with built-in Entra authentication, "assignment required", and one test group.
- [ ] **0.2** The app registration exposes one API scope, and the Azure CLI's client id may request tokens for it. `az account get-access-token --tenant <t> --scope api://<api>/.default` returns a token whose `aud` the app accepts.
- [ ] **0.3** `/zam-provider.json` answers without login; every other path asks for it.
- [ ] **0.4** A member of the test group gets 200 with the token; a tenant user outside the group gets 403.
- [ ] **0.5** A one-card test package (`example`-style ids, published only there) for item 3.6.

Exit evidence: the four checks recorded in the organisation's own runbook, not in this repository. If 0.2 fails, the fallback is the ADR's Static Web App + private Blob alternative, and item 2.2 asks for the storage scope instead; stop and ask the owner before switching.

## Phase 1 — Kernel: provider file, namespaces, tile ownership

Goal: the kernel can parse a provider, parse its catalog against its own origin, install a provider tile only inside its namespace, and enrol a member from an installed tile. No fetching, no UI.

- [ ] **1.1** New module `src/kernel/library/academy-provider.ts`, exported through `src/kernel/index.ts` (D2):
  - `AcademyProvider` = `{ schema: 1; id; title; publisher; auth: { kind: "none" } | { kind: "entra-cli"; tenant; api }; feedback: string | null }`.
  - `parseAcademyProvider(raw)`: strict. `id` matches the catalog's tile-id prefix part (`^[a-z0-9-]{1,40}$`). `tenant` and `api` are GUIDs, lower-cased before the check `^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$`. `feedback` is an `https:` URL whose only `{…}` placeholders are `{tile}`, `{item}`, `{version}`. Unknown keys are ignored; anything missing or invalid throws.
  - `reservedProviderIds()`: `zam-academy` plus the prefix of every `BUNDLED_TILES` id.
  - `providerTokenScope(provider)` returns `api://<api>/.default`, built here, never taken from the file.
  - `providerFeedbackUrl(provider, { tile, item, version })` fills the three placeholders with `encodeURIComponent` and nothing else.
  - Exit: `tests/kernel/academy-provider.test.ts` — valid file; each invalid field; a scope string in the file is ignored; an unknown placeholder fails; reserved ids are refused.
- [ ] **1.2** Catalog parsing against a provider origin (D4, D5):
  - `academyUrl(path, where, origin = ACADEMY_ORIGIN)` and `parseAcademyCatalog(raw, options?: { origin: string; prefix: string })`. Without options the behaviour is today's, byte for byte.
  - With options, every entry id must start with `<prefix>:`, and `app` and `cell` resolve against `origin`.
  - `parseAcademyIndex` needs no change (it carries no URLs); confirm with a test that a vocational-school taxonomy (school with grades 10–12, subjects named after Lernfelder) parses.
  - Exit: `tests/kernel/academy-catalog.test.ts` gains provider cases (own origin, foreign prefix refused, path that escapes the origin refused); its existing cases are untouched.
- [ ] **1.3** Tile ownership and installed-tile metadata, migration **M050**:

  ```sql
  CREATE TABLE IF NOT EXISTS tile_atoms (
    tile_id  TEXT NOT NULL,
    atom_id  TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
    PRIMARY KEY (tile_id, atom_id)
  );
  CREATE INDEX IF NOT EXISTS idx_tile_atoms_atom ON tile_atoms(atom_id);
  ALTER TABLE installed_tiles ADD COLUMN title       TEXT NOT NULL DEFAULT '';
  ALTER TABLE installed_tiles ADD COLUMN description TEXT NOT NULL DEFAULT '';
  ALTER TABLE installed_tiles ADD COLUMN app_url     TEXT;
  ALTER TABLE installed_tiles ADD COLUMN preview     INTEGER NOT NULL DEFAULT 0;
  ```

  - An atom may belong to several tiles (overlay tiles), hence the composite key.
  - `installKvtTile` writes a `tile_atoms` row for every atom of the tile (insert or ignore) and the tile's `title` and `description` into `installed_tiles`. New install options `appUrl` and `preview` fill the other two columns; their default keeps today's values.
  - Add `tile_atoms` to `SNAPSHOT_TABLES` (`src/kernel/db/snapshot.ts`, next to `installed_tiles`) and to the curator-written knowledge tables in `src/cli/deploy/team-provision.ts` (next to `installed_tiles`).
  - Existing libraries get rows for a tile the next time it is installed or reconciled; nothing backfills. Provider tiles are always installed after M050, so they always have rows.
  - Exit: `tests/kernel/kvt-attach.test.ts` (rows written, reinstall idempotent, overlay tile adds its own rows), the provision tests for M050 on SQLite, and `tests/kernel/postgres-provision.test.ts` for PostgreSQL.
- [ ] **1.4** Namespace guard in `installKvtTile` (D5), active only with the new option `namespace: string`:
  - The tile id must start with `<namespace>:`.
  - Every atom id of the tile must be new to the library, or already owned in `tile_atoms` only by tiles with that prefix.
  - Every practice-item id must be new, or already a token whose atom passes the same rule.
  - Every `replaces` id: no such token → skipped and not recorded; a token on an atom owned by the namespace → moved as today; anything else → the install throws before it writes (the transaction rolls back).
  - Prerequisites keep today's same-tile rule.
  - Without `namespace`, nothing changes.
  - Exit: `tests/kernel/kvt-attach.test.ts` — foreign tile prefix; reused public atom id; reused public item id; foreign `replaces`; unknown `replaces` skipped without a `practice_item_replacements` row; own `replaces` moves cards and review logs; no option = old behaviour.
- [ ] **1.5** Enrolment from an installed tile (D7):
  - `enrolInstalledTile(db, userId, tileId)`: the atoms come from `tile_atoms`, then `materialiseKvtCards`. It refuses a tile that is not installed or has no `tile_atoms` rows, and writes only learning state.
  - `listInstalledProviderTiles(db, userId, prefixes?)`: every installed tile whose prefix is not reserved, with version, title, description, app URL, preview, published item count and whether the learner holds cards.
  - Exit: a new `tests/kernel/installed-tile-enrol.test.ts`, and a case in `tests/kernel/postgres-team.test.ts`: a member (not curator) can enrol and cannot install; a curator can install.

## Phase 2 — CLI: confirmed providers, token, fetch, commands

Goal: from the CLI, a learner can add a provider, list its catalog, enrol and update, with the token sent only to the provider's origin. Studio has the bridge commands it needs.

- [ ] **2.1** Confirmed providers in the install config (D3), helpers in a new `src/kernel/system/academy-providers.ts` beside `endpoint-confirmation.ts`:
  - `InstallConfig.academy?.providers?: ConfirmedAcademyProvider[]` with `{ origin, provider: AcademyProvider, sha256, confirmedAt }`; `sha256` is the hash of the provider file's bytes the learner saw.
  - `listConfirmedProviders`, `confirmProvider` (refuses a reserved id, a duplicate id and a duplicate origin), `removeConfirmedProvider`, `providerChange(confirmed, served)` → which of `id`, `auth`, `feedback` differ.
  - Exit: `tests/kernel/academy-providers.test.ts`, and the security-switch tests (`tests/cli/studio-bridge-review.test.ts`, `tests/cli/keys-follow-endpoints.test.ts` as the model) assert that no MCP tool and no `STUDIO_BRIDGE_COMMANDS` entry writes `academy.providers`.
- [ ] **2.2** Token for a provider API in `src/cli/db/entra-cli.ts` (D4):
  - `entraCliApiToken(tenant, api, exec = defaultExec)`: re-checks both GUIDs, then runs `az account get-access-token --tenant <tenant> --scope api://<api>/.default --query accessToken -o tsv`, with the same failure classification as `entraCliAccessToken`.
  - Exit: `tests/cli/entra-cli.test.ts` — exact arguments; a non-GUID or a GUID with shell metacharacters is refused **before** `exec` is called (the mock records no call).
- [ ] **2.3** Provider fetching, new `src/cli/academy/provider-client.ts` (D4):
  - Refactor `fetchBytes` in `src/cli/academy/catalog-client.ts` to take the allowed origin and extra headers; the public calls pass `ACADEMY_ORIGIN` and no headers.
  - `fetchProviderFile(url)`: https only; the URL is reduced to its origin plus the fixed path `/zam-provider.json`; no token; `maxRedirects: 0`; 16 KiB limit; returns parsed file and bytes.
  - `fetchProviderCatalog`, `fetchProviderIndex`, `fetchProviderCell` take the confirmed provider and a token supplier. The supplier is called at most once per learner action. The `Authorization` header is set only when the request URL's origin equals the confirmed origin. 401 and 403 become `PROVIDER_ACCESS_DENIED`.
  - Exit: a new `tests/cli/academy-provider.test.ts` with the `transport` seam — redirect refused; the token never reaches another origin (headers captured per request); 401 mapping; hash and prefix mismatches; `auth: none` sends no header.
- [ ] **2.4** Per-provider cache in `src/cli/academy/cache.ts`: every function takes an optional provider id; with one, files live under `~/.zam/academy/providers/<id>/`. Public paths are unchanged. `removeConfirmedProvider` deletes the provider's folder. Exit: cache tests for both layouts.
- [ ] **2.5** Handlers in `src/cli/academy/handlers.ts` take `provider?: string`:
  - Unknown provider → `PROVIDER_NOT_CONFIRMED`.
  - `academyListHandler` also fetches the provider file and reports `providerChanged` with the served values; it keeps using the confirmed copy.
  - Enrol and update pass `namespace` (1.4), `appUrl` and `preview` to the install, through `enrolBundledCell` or a sibling for provider tiles. A provider tile on a team library is refused with a pointer to `zam team install-cell` (Phase 4).
  - Exit: `tests/cli/academy-provider.test.ts` (list, enrol, update, changed provider file) and `tests/cli/academy.test.ts` unchanged.
- [ ] **2.6** Commands. None of them goes into `STUDIO_BRIDGE_COMMANDS`, and no MCP tool calls them:
  - Bridge: `academy-provider-check <url>` (reads and parses the provider file, returns what Studio shows, writes nothing); `academy-provider-add <url> --sha256 <hex>` (fetches again and saves only if the bytes still hash to what the learner confirmed); `academy-provider-remove <id>`; `academy-provider-list`; and `--provider <id>` on `academy-list`, `academy-enrol`, `academy-update`.
  - CLI: a new `zam academy provider add|list|remove` group; `add` shows the same details and asks for confirmation (`--yes` for scripts).
  - Exit: bridge tests for JSON-only output and error codes; `tests/cli/studio-bridge-review.test.ts` still lists none of them.
- [ ] **2.7** The review context never fetches a provider page (D6) in `src/cli/review-context.ts`: a link resolves to nothing when its origin is a confirmed provider's, or the origin of an `installed_tiles.app_url` whose tile is a provider tile. Suppressing a fetch is always safe, so library content may widen this list. Exit: review-context tests for both cases and for an unrelated link that still resolves.

## Phase 3 — Studio

Goal: a learner adds a provider, browses and enrols in Studio, opens lessons, and reports a card. Verified in the real Studio window.

- [ ] **3.1** „Anbieter hinzufügen“ in the Academy dialog and in Settings (D3): paste → `academy-provider-check` → show title, publisher, host in punycode, login kind and the report link's host → „Hinzufügen“ calls `academy-provider-add --sha256`. Settings lists confirmed providers with „Entfernen“. A `providerChanged` answer shows a banner with the changed values and „Bestätigen“.
- [ ] **3.2** Provider switch in `desktop/src/academy-list.ts` (D6): chips „ZAM Academy“ plus one per provider, shown only when a provider is confirmed; each chip keeps its own browser state and passes `--provider`. Rows name the provider and show the preview mark. `isAcademyCellId` gets a sibling that also knows provider prefixes, used by `desktop/src/learning-content.ts` for the Lern-Karten row and its update button; `desktop/src/atlas/import.ts` stays public-only.
- [ ] **3.3** Lesson labels (D6): `webSourceLink` and `academyPracticeLink` in `desktop/src/source-link.ts` take an optional list of lesson hosts, default `[ACADEMY_HOST]`, so Mobile's calls stay as they are. Desktop passes the Academy host plus the confirmed providers' hosts.
- [ ] **3.4** „Fehler melden ↗“ (D8): the review payload carries `feedbackUrl` for a card whose tile (via `tokens.atom_id` → `tile_atoms` → `installed_tiles`) belongs to a confirmed provider with `feedback`. The CLI builds it with `providerFeedbackUrl`. Studio shows the button after the answer is revealed and opens the system browser through the existing source-link path. Exit: a unit test that the URL carries only tile, item and version; a desktop test that the button appears only then.
- [ ] **3.5** Errors: `ENTRA_LOGIN_REQUIRED` shows „Mit Microsoft anmelden“ through the existing `entra-login` flow (as in `desktop/src/server-db.ts`); `PROVIDER_ACCESS_DENIED` shows „Kein Zugang — bitte an <publisher> wenden“.
- [ ] **3.6** End-to-end check in the real Studio, against the spike host and its test package (Phase 0), in an isolated profile: add the provider, enrol, review one card, open the lesson (browser sign-in), „Fehler melden“, remove the provider. Exit: screenshots and the bridge log of that run, summarised in the PR.

## Phase 4 — Team library: curator installs, members enrol

Goal: D7 on PostgreSQL.

- [ ] **4.1** `zam team install-cell <id>:<slug>` on the learner's normal library connection: refuses when the connected role is not a curator (`pg_has_role(current_user, 'zam_curator', 'member')`, the check `zam team members` runs for others); fetches with the curator's own token; installs with `namespace`, `appUrl` and `preview`; creates no cards.
- [ ] **4.2** Studio: in a team library, a curator sees „Für die Bibliothek installieren“ on provider rows. Every member sees the provider tiles installed in the library (`listInstalledProviderTiles`) with „Aufnehmen“, which calls a new bridge command `academy-enrol-installed <tileId>` → `enrolInstalledTile`. No provider confirmation and no network are needed for that.
- [ ] **4.3** Updates: the curator installs the newer version; `replaces` moves members' history inside the namespace. New items reach members the same way they reach members after `zam team reinstall-tiles` today. Find that path and reuse it; do not invent a second one.
- [ ] **4.4** `docs/okf/learning-content.md` (through `zam_okf_upsert`): the curator install, and that apprentices are added with `zam team add-member --no-curator`.
- [ ] Exit for the phase: `npm run pg:test` with the member/curator cases from 1.5 and an install-cell case; a namespace violation is refused on PostgreSQL too.

## Phase 5 — Agent tools

- [ ] **5.1** `zam_bundled_cells_list` (in `src/cli/bridge-handlers.ts`) also lists cached provider cells of every confirmed provider, with `provider: { id, title }` and `requiresLearnerEnrol` as today, and the provider tiles installed in a team library with `installedInLibrary: true`.
- [ ] **5.2** `zam_bundled_cell_enrol` enrols a cached provider cell (with `namespace`) or, in a team library, an installed provider tile (`enrolInstalledTile`). It never fetches.
- [ ] Exit: `tests/cli/mcp.test.ts` — provider fields present; the fetch transport is never called from either tool.

## Phase 6 — Documentation and acceptance

- [ ] **6.1** `docs/okf/agent-trust-model.md` through `zam_okf_upsert`: the provider list as a security switch, the token rule, the namespace guard, the review-context suppression.
- [ ] **6.2** Knowledge map: update `academy-learner-fetch` to cover provider catalogs and add one statement for private providers, citing the new modules; run `npm run dev -- knowledge-map validate --repo . --write`. Exit: the "ZAM's own map" test in `tests/cli/knowledge-map.test.ts` passes.
- [ ] **6.3** `CLAUDE.md` key conventions: one line on private providers (ADR 2026-11-25) — never named in this repository, never bundled, namespace guard, learner-confirmed list.
- [ ] **6.4** ADR status → Implemented with the PR number, a status-history line, and the README row.

## Phase 7 — Pilot (outside ZAM, owner)

- [ ] **7.1** Private content repository in the zam-academy layout and CI, with `zam-core` pinned to the release that ships Phases 1–2.
- [ ] **7.2** The first two packages (LF3, LF5 of the vocational school's year 10), `preview: true`, with `feedback` pointing at the repository's issue form.
- [ ] **7.3** Hosting from Phase 0, the apprentices' group, the apprentices added to the team library as members.
- [ ] **7.4** One test round by the apprentices; reports closed; `preview` removed.

## Final check — nothing slipped

Before the PR leaves draft, walk this table and every checkbox above; each row needs its evidence.

| ADR | Items |
|---|---|
| D1 format, never bundled | 1.2, 2.3, 2.4; grep: no provider tile under `tests/fixtures/curriculum/` |
| D2 provider file | 1.1, 2.3 |
| D3 learner-only confirmation | 2.1, 2.6, 3.1 |
| D4 fetch rules and token | 2.2, 2.3, 2.5 |
| D5 namespace | 1.2, 1.4 |
| D6 Studio, lesson links, review context | 2.7, 3.2, 3.3 |
| D7 team library | 1.3, 1.5, 4.1–4.3 |
| D8 report link | 1.1, 3.4 |
| D9 desktop first, agents | 3.3 (Mobile unchanged), 5.1, 5.2 |
| Regression-test list (ADR Delivery) | 1.4, 2.1, 2.2, 2.3, 2.5, 2.7, 3.4, rule "public Academy unchanged" |
