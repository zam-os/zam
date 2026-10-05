# Learning cards from photos and files — implementation plan

**Status:** Phase 1 done (2026-10-05).\
**Decision:** [ADR 2026-10-05 — Learning Cards from Photos and Files](../adr/2026-10-05-learning-cards-from-photos-and-files.md).
Its decisions are cited here as D1–D11. Read the ADR first; this plan does not
repeat its reasons.\
**Branch:** create `feat/learning-cards-from-photos-and-files` from `main`
after PR #384 (the ADR and this plan) is merged. All phases go onto that one
branch and one PR, with one commit per phase.

This document is harness-agnostic. Claude Code, Antigravity, Codex or a human
can pick up the next unchecked phase without any other context.

## Goal

A learner imports class notes and teacher handouts — photos and PDFs — as
learning cards. There are two paths (D2):

- **Through a harness.** The learner's AI app (first target: opencode) reads
  the file, asks back, and submits proposals.
- **Built in.** The Studio, and later Mobile, sends one request to the
  connected model.

Both paths end in the same review list. There the learner chooses Yes, No or
Bonus for each card, with the area shown above the cards and existing content
offered beside the proposals. One transaction then writes the cards, a source
reference and file fingerprints. Nothing of the material itself is stored.

## Status

- [x] **Phase 1** — kernel contract: schema, validation, presets, matching,
  write, bonus queries — `b2aa6d29`
- [ ] **Phase 2** — the `schule/` rewrite: migration and fixtures
- [ ] **Phase 3** — staging store and bridge commands
- [ ] **Phase 4** — Studio review list
- [ ] **Phase 5** — harness path: MCP tools, skill, Studio handoff
- [ ] **Phase 6** — built-in Studio path: `file` capability, request module,
  picker
- [ ] **Phase 7** — Bonus view and the offer after the due queue
- [ ] **Phase 8** — Mobile
- [ ] **Phase 9** — the review list as an MCP Apps panel (optional)
- [ ] **Phase 10** — documentation and handover

**Order.**

- **Field-test milestone:** 1 → 3 → 4 → 5, plus 2 and 7. The field-test
  learner studies on a laptop and uses opencode with GPT-6-Luna, which reads
  images and PDFs natively (OpenRouter declares `file,image,text`).
- **Phase 2** is independent of the others and can run in parallel. It must
  land before the field test: otherwise the import proposes `chemie/…` while
  the installed cells still sit under `schule/chemie/…`, and the subject shows
  up twice.
- **Phases 6 and 8** follow the milestone. Phase 8 needs Phase 6's request
  module.
- **Phase 9** only matters for hosts that render panels. opencode does not.

## Ground rules for every phase

Repository conventions from `CLAUDE.md` / `AGENTS.md` that this feature
touches:

- **Kernel versus CLI.**
  - Learning logic lives in `src/kernel/`: validation, presets, matching,
    the transactional write and the bonus queries.
  - No HTTP, no LLM calls and no file reading in the kernel.
  - Embeddings for matching come in as an injected function, the way
    `ReferenceFetcher` comes in.
- **No new dependencies** (AGENTS.md).
  - Specifically, no pdf.js and no image library.
  - Platform tools that ship with the OS (macOS `sips`) are allowed.
- **Schema changes** go into BOTH `src/kernel/db/schema.ts` AND an idempotent
  numbered migration in `runMigrations` (`src/kernel/db/provision.ts`).
  - Increment `CURRENT_SCHEMA_VERSION`; it is 36 today.
    `tests/kernel/provision.test.ts` guards it.
  - Migrations must run on SQLite and PostgreSQL — check with
    `npm run pg:test`.
- **Bridge.** `zam bridge` emits JSON only, errors included.
  `src/bridge/protocol.ts` changes are additive and optional.
- **Optional surfaces stay lazy.** New MCP code lives in the lazily imported
  `src/cli/commands/mcp.ts` graph; nothing new enters the eager CLI bootstrap
  (ADR 2026-07-07).
- **IDs** are ULIDs (`ulid()`).
- **Privacy.**
  - Never persist image bytes, PDF bytes or a model's transcript — not in the
    database, not in the staging files, not in logs.
  - Tests use synthetic material written for the tests. Never commit a
    learner's photo or notes (owner instruction, 2026-10-05).
- **Modules Mobile imports** (`src/cli/llm/material-prompt.ts`, the shared
  review state) must not use Node built-ins; they end up in the WebView
  bundle.
- **i18n.**
  - New strings go into the `en` and `de` reference packs only:
    `desktop/src/i18n.ts` and `mobile/src/i18n.ts`.
  - Do not machine-fill `es/fr/pt/zh/ja`; the owner reviews those.
- **Commits** follow `<type>: <summary>` (`feat`, `fix`, `test`, `docs`,
  `refactor`, `chore`).
- **Verification** for each phase, before its commit:

  ```bash
  npm run typecheck
  ```

  ```bash
  npm run lint
  ```

  ```bash
  npm run test
  ```

  Schema phases add `npm run pg:test`; surface phases add `npm run build`.

## Shared vocabulary

| Name | Where | Value |
|---|---|---|
| `MaterialOrigin` | `src/kernel/import/material-import.ts` | `"page" \| "completed" \| "extra"` (D4) |
| `MaterialChoice` | same | `"yes" \| "bonus" \| "no"` (D5) |
| `MaterialProposalSet` | same | the contract object below, `version: 1` |
| `MaterialReviewRow` | same | `proposal`, `existing` or `continuation` row (D8) |
| `IMPORT_SOURCE_PREFIX` | same | `"zam-import:"` (`sources.uri` = prefix + ULID, D9) |
| `MAX_CONTINUATION_ITEMS` | same | `3` (D8) |
| `STAGED_IMPORT_TTL_DAYS` | `src/cli/material-staging.ts` | `7` (D2) |
| `MAX_IMAGES_PER_REQUEST` | `src/cli/llm/material-prompt.ts` | `10` (D3) |
| `IMAGE_LONG_EDGE_PX` | same | `1568` (Mobile's `IMAGE_MAX_LONG_EDGE`) |

The contract object. The example is synthetic and describes the worked example
in the ADR:

```json
{
  "version": 1,
  "analysis": {
    "kind": "own-notes",
    "title": "Stofferkennung mit den Sinnen",
    "subjects": ["chemie"],
    "topic": "Stoffe und Stoffeigenschaften",
    "level": "Realschule, Anfangsunterricht Chemie",
    "bloom": [1, 2],
    "leadsTo": "Messbare Stoffeigenschaften: Dichte, Schmelz- und Siedetemperatur"
  },
  "proposals": [
    {
      "question": "Welche Eigenschaften eines Stoffes erkennt man am Aussehen?",
      "answer": "Farbe, Aggregatzustand bei Raumtemperatur, metallischer Glanz.",
      "title": "Stofferkennung am Aussehen",
      "bloom": 1,
      "file": 0,
      "page": 1,
      "area": "chemie/stoffe-und-eigenschaften",
      "origin": "page",
      "hardToRead": false
    },
    {
      "question": "Warum ist die Geschmacksprobe bei chemischen Versuchen verboten?",
      "answer": "Weil Stoffe giftig oder ätzend sein können.",
      "title": "Keine Geschmacksprobe",
      "bloom": 2,
      "file": 0,
      "page": 1,
      "area": "chemie/stoffe-und-eigenschaften",
      "origin": "completed",
      "hardToRead": false
    }
  ],
  "files": [
    {
      "name": "IMG_1234.HEIC",
      "sourceLink": "photo:IMG_1234.HEIC@2026-10-05",
      "sha256": "…"
    }
  ]
}
```

`kind` is one of these values:

- `own-notes`
- `handout`
- `worksheet`
- `solution-sheet`
- `board-picture`
- `other`

`files[].sha256` is optional (D9, harness path). `files[].path` is optional:
the path the file had when it was imported, for display only.

---

## Phase 1 — kernel contract

New module `src/kernel/import/material-import.ts`, exported through
`src/kernel/index.ts`.

### Schema — M037, `CURRENT_SCHEMA_VERSION = 37`

`sources` gains three nullable columns:

- `title TEXT`
- `fingerprints TEXT` — a JSON array of lowercase SHA-256 hex strings
- `imported_by TEXT` — a user id

Add them in `schema.ts` and as guarded `ALTER TABLE … ADD COLUMN` in M037,
following the existing column-exists pattern. The `type` CHECK stays
`file | web | scan`: PDFs and image files write `file`, camera and library
photos write `scan`.

### Functions

1. **`parseMaterialProposalSet(input: unknown): MaterialProposalSet`**
   - Strict validation. On failure it throws one error that lists every bad
     path (`proposals[3].origin`).
   - Strings are trimmed. `bloom` is 1–5, `origin` and `kind` come from their
     enums, `file` is in range, and there are at most 200 proposals.
   - `area` is normalised by `normaliseMaterialArea`: trimmed segments, `/`
     as the only separator, a leading `schule/` stripped (D7). Case is kept, so
     a learner's existing area (`Deutsch`) still matches itself.
   - Unstructured output never passes this function (ADR 2026-06-30).
2. **`presetFor(proposal): MaterialChoice | null`** — the D5 table:
   - `page` → `yes`
   - `extra` → `bonus`
   - `completed` → `null`
   - `hardToRead` → `null`, whatever the origin
3. **`listMaterialAreaContext(db, scope?)`**
   - Returns the distinct area paths in use: non-deprecated tokens.
   - Also returns the subjects of the bundled cells for the scope's school type
     (`listBundledCells()` → `curriculumScopes`).
   - Read-only; it feeds the prompt and the MCP context tool.
4. **`matchMaterialProposals(db, userId, set, opts)` → `MaterialReviewRow[]`**
   (D8). `opts.embed?: (texts: string[]) => Promise<number[][]>`, together
   with `opts.embeddingModel`, enables the vector leg.
   - **Library candidates:** `searchTokensHybrid` per proposal, on question
     plus answer.
   - **Cell candidates:** practice items of the tiles whose
     `curriculumScopes[].subject` matches an analysed subject.
     - Any grade qualifies; the learner's school type ranks first.
     - Score lexically on the normalised word overlap of question and
       concept. When `embed` is given, add cosine similarity, embedding the
       candidate texts in one batch.
     - Thresholds are named constants, calibrated by the fixture test below.
   - **Rows:**
     - Every proposal yields a `proposal` row with `presetFor`.
     - A match yields an `existing` row placed directly after it. The
       existing row inherits the proposal's preset, and the proposal's own
       preset becomes `null`.
     - If the learner already holds a card for the match, the existing row is
       `held: true` and takes no choice.
     - A detached card counts as not held; Yes re-attaches it.
   - **Continuation rows:** atoms of the matched tiles that the analysis's
     `leadsTo` names, preset to `bonus`, at most `MAX_CONTINUATION_ITEMS`,
     same subject only.
   - **Deterministic:** sort by proposal order, then score, then id. No
     randomness.
5. **`commitMaterialImport(db, userId, set, rows, decisions, areas)`** — one
   `db.transaction`.
   - **The import's source row.** Insert one `sources` row:
     - `id`: a ULID;
     - `uri`: `zam-import:<ULID>`;
     - `type`: `file` or `scan`;
     - `content`: NULL;
     - `title`: `analysis.title`;
     - `fingerprints`: every known `sha256`;
     - `imported_by`: `userId`.
   - **Proposal rows:**
     - `yes`: `createToken` with `editorial_state: 'published'`.
       - Set `question`, `concept` = answer, `title`, `bloom_level`, and
         `domain` = the learner-confirmed area of its group.
       - Set `source_link` = the file's `sourceLink`, plus `#page=<n>` for
         PDFs.
       - Then `ensureCard` and a `token_sources` row with `page_number`.
     - `bonus`: the same, without `ensureCard`.
     - `no` or undecided: nothing.
     - An exact slug collision keeps today's behaviour (link, do not
       duplicate).
     - Do **not** reuse `applySourceProposals`: it writes drafts without a
       source link, and drafts never reach the queue.
   - **`existing` rows (library token):**
     - `yes`: `ensureCard`, or `reattachCardForUser` if the card was detached.
     - `bonus`: a `token_sources` link only, so the item appears in the Bonus
       view.
   - **`existing` and `continuation` rows (cell item):**
     - `installKvtTile(tile)` (idempotent, creates no cards).
     - `yes`: then `ensureCard` for that item's token only — not
       `materialiseKvtCards`, which takes every item of the atom.
     - `bonus`: the install and the `token_sources` link.
   - **Returns** `{ cardsCreated, bonusKept, linkedExisting, notSaved }`.
6. **`findImportsByFingerprints(db, sha256s)`** →
   `[{ sourceId, title, createdAt }]`, for the re-import notice ("imported on
   5 Oct"). It informs and never blocks.
7. **Bonus queries** (D6).
   - **`listMaterialBonusItems(db, userId, { limit })`** returns tokens linked
     through `token_sources` to a source with `imported_by = userId`, for which
     the learner holds no card. Newest import first. Each item carries the
     source title and date.
   - **`takeMaterialBonusItem(db, userId, tokenId)`** calls `ensureCard`. It
     refuses tokens that are not linked to one of the learner's imports.

### Tests (`tests/kernel/material-import.test.ts`)

- **Parser:** accepts the synthetic fixture
  `tests/fixtures/material-import/chemie-sinne.json` (written for the test).
  Rejects a wrong origin, an out-of-range file index or bloom, a missing
  answer, and strips a `schule/` prefix.
- **Presets:** the D5 table, and `hardToRead` overrides every origin.
- **Matching:**
  - A seeded library token near a proposal yields an `existing` row with the
    inherited preset, and the proposal itself gets `null`.
  - A grade-9 learner still sees the grade-8 Chemie cell item (rank, do not
    filter).
  - A held card shows `held`.
  - At most three continuation rows.
  - Output is deterministic.
- **Commit:**
  - `yes` writes a published token, a card, `source_link` and `token_sources`
    with the page. `bonus` writes a token without a card. `no` and undecided
    write nothing.
  - A failing row rolls back everything.
  - An existing `yes` creates no token.
  - A cell-item `yes` installs the tile and creates exactly one card.
  - The `sources` row has the `zam-import:` uri, the title, the fingerprints
    and `imported_by`.
- **Queue:** a `yes` card appears in the due/new queue (published), and a
  `bonus` token does not.
- **Bonus:** list and take; another learner's import is refused.
- **PostgreSQL:** the same write test under `npm run pg:test`, following
  `tests/kernel/postgres-choice.test.ts`.

---

## Phase 2 — the `schule/` rewrite (D7)

1. **Migration M038, `CURRENT_SCHEMA_VERSION = 38`.**
   - `UPDATE tokens SET domain = substr(domain, 8) WHERE domain LIKE 'schule/%'`,
     and the same for `learning_atoms.domain`. On PostgreSQL use
     `substring(domain from 8)`.
   - Every `schule/…` path is rewritten, including paths a learner wrote by
     hand. The statement is idempotent by construction.
2. **Fixtures.** Rewrite `"domain": "schule/` → `"domain": "` in all 228
   tiles under `tests/fixtures/curriculum/`, with a one-off script that is not
   committed.
   - Check: `grep -rl '"domain": "schule/' tests/fixtures | wc -l` is `0`.
3. **Tests that encode the old paths:** update
   `tests/desktop/question-topic.test.ts` and
   `tests/kernel/pythagoras-revision.test.ts`.
4. **New test (`tests/kernel/schule-domain-migration.test.ts`).**
   - Setup:
     - Install a copy of the Chemie 8 tile that still says `schule/…`.
     - Create a card and review it once.
     - Add a learner token `schule/notizen`.
     - Run the migrations.
     - Attach the current tile.
   - Expect:
     - `tokensRevised === 0`;
     - the card's `due_at` and `learned_content_version` unchanged;
     - `learning_atoms.domain` rewritten;
     - `notizen` rewritten;
     - a second run changes nothing.
   - Add a guard test: no bundled tile domain starts with `schule/`.
5. **Embeddings.** No code change; the lazy top-up renews them. The release
   note recommends `zam token reembed` for large libraries.

---

## Phase 3 — staging store and bridge commands

### Staging (`src/cli/material-staging.ts`)

- **Location.** The directory is `~/.zam/pending-imports/`; tests override it
  with `ZAM_PENDING_IMPORTS_DIR`.
- **File content.** One JSON file per batch:
  `{ version: 1, id, createdAt, origin: "harness" | "studio", harness?, set }`.
  The set holds proposals and file references, never bytes.
- **Writes** are atomic: a temporary file, then rename, following
  `src/cli/okf-focus.ts`.
- **`listStagedImports()`** drops files older than `STAGED_IMPORT_TTL_DAYS`
  and files it cannot parse.
- **Other operations:** `readStagedImport(id)`, `writeStagedImport(batch)`,
  `discardStagedImport(id)`.

### Bridge commands (`src/cli/commands/bridge.ts`)

| Command | Result |
|---|---|
| `material-import-stage --file <json>` | parse with the kernel, stage (origin `studio`), return `{ id }` — used by tests and Phase 6 |
| `material-import-pending` | `[{ id, title, createdAt, origin, harness, proposalCount }]` |
| `material-import-review --id` | rows with presets and matches, the analysis, area groups, re-import notices |
| `material-import-confirm --id --decisions <json> --areas <json>` | commit, then delete the staged file |
| `material-import-discard --id` | delete the staged file |
| `material-import-areas` | `listMaterialAreaContext` |
| `material-import-bonus-list [--limit]` | `listMaterialBonusItems` |
| `material-import-bonus-take --token` | `takeMaterialBonusItem` |

- **Embeddings in review.** `material-import-review` runs the bounded
  `ensureTokenEmbeddings` top-up first. It passes the CLI embedder as `embed`
  when an embedding model is configured, and runs lexical-only otherwise.
- **Protocol.** Add the response types to `src/bridge/protocol.ts`
  (additive).

### Tests

- `tests/cli/material-staging.test.ts`: atomic write, expiry, unparsable
  files dropped, env override.
- Bridge JSON contract tests in the style of the existing `tests/bridge/`
  suites: errors are JSON, and confirm deletes the staged file.

---

## Phase 4 — Studio review list

1. **State module `desktop/src/material-review.ts`** (pure, no DOM):
   - rows grouped by area;
   - choices initialised from presets;
   - counts for the confirm button ("Add 7 · 2 as Bonus · 3 not saved");
   - rows preset to Bonus start collapsed when the list has more than 12 rows;
   - `buildConfirmArgs()`.

   Keep it free of Node built-ins: Phase 8 moves or shares it.
2. **View in Learning Content** (`desktop/src/learning-content.ts`,
   `desktop/index.html`):
   - **Above the list:**
     - the analysis line (subject · topic · level);
     - per area group, the area with an editable field offering the existing
       areas (`buildDomainOptions`) and free text.
   - **Each row:**
     - a three-way segmented control Ja / Nein / Bonus, built on
       `radio-group.ts` for keyboard use;
     - an origin badge: "auf der Seite" / "on the page", "ergänzt" /
       "completed", "Extra";
     - a "schwer lesbar" / "hard to read" flag where set.
   - **Matched pairs:** the `existing` row sits directly under its proposal,
     labelled "vorhanden" / "already there". Held items show "hast du schon" /
     "you have this" and take no choice.
   - **Continuation rows** appear at the end of their group.
   - **The page stays in view** (D5):
     - Images: a thumbnail from `material-import-file-preview --id --file <n>`.
       Add that bridge command in this phase: it returns a data URL for images
       up to 5 MB (the CSP already allows `data:` images). Larger images and
       PDFs get an "Öffnen" / "Open" button through the opener plugin.
     - A missing file shows the name only.
   - **Confirm** calls `material-import-confirm`, then shows a toast with the
     counts and reloads the Studio data. **Discard** asks once.
3. **Waiting batches.**
   - Call `material-import-pending` when the Studio loads and on every window
     `focus` event.
   - A pending batch shows a banner in Learning Content ("1 Import wartet auf
     Prüfung" / "1 import waiting for review") and a badge on the nav item;
     the banner opens the newest batch.
4. **Re-import notice.** "Diese Datei hast du am 5. Okt. schon importiert" /
   "You imported this file on 5 Oct". It informs and does not block.
5. **i18n** (`en`, `de`):
   - the labels above;
   - the analysis line;
   - the counts;
   - the banner;
   - the notices.

### Tests

- `tests/desktop/material-review.test.ts`: presets, grouping, counts,
  collapsing, confirm args.
- A wiring test in the style of `tests/desktop/library-topics.test.ts`: the
  bridge commands and their arguments, and the focus listener.
- `tests/desktop/i18n-completeness.test.ts` stays green.

**Manual check.** Stage the synthetic fixture with `material-import-stage`,
open the Studio and take the batch through:

- all three choices;
- an area edit;
- a matched pair;
- discard.

---

## Phase 5 — harness path (field-test milestone)

1. **Shared rules text.** `src/cli/llm/material-prompt.ts` (HTTP-free, no Node
   built-ins) exports `MATERIAL_CARD_RULES`:
   - read the material itself;
   - ask back when something is illegible or ambiguous;
   - one atomic retrieval target per card (flashcard RFC);
   - set origins honestly;
   - over-delivery is fine;
   - one subject per run;
   - look up existing content first;
   - never decide for the learner.

   Phase 6 builds the request module on top of this file.
2. **MCP tools** (`src/cli/commands/mcp.ts`):
   - **`zam_material_import_context`** (read-only) returns
     `listMaterialAreaContext` for the learner's scope plus
     `MATERIAL_CARD_RULES`.
   - **`zam_material_import`**:
     - Input: `analysis`, `proposals` and `files` (`name`, optional `path`,
       optional `sha256`).
     - It validates with `parseMaterialProposalSet` and reports every bad
       path in one readable error.
     - It computes `sha256` itself for each `path` it can read.
     - It builds each file's `sourceLink`: `file://` for a path, otherwise
       `photo:<name>@<date>` (D9).
     - It stages the batch with origin `harness` and the host name from the
       MCP client identity (`getNativeClientInfo`).
     - It focuses or launches the Studio and returns "N Vorschläge warten im
       ZAM Studio auf deine Auswahl" with the batch id.
     - It writes no token or card row.
3. **Studio launch.**
   - Move `findInstalledApp` and `launchApp` from `src/cli/commands/ui.ts`
     into `src/cli/desktop-launch.ts` as `focusOrLaunchStudio()`.
   - When the app is already running, the single-instance plugin focuses its
     window, and Phase 4's focus listener shows the batch.
   - When no Studio is installed, the tool says so and gives the batch id.
4. **Guidance for agents.**
   - Add one sentence to `MCP_SERVER_INSTRUCTIONS`: class material (photos,
     PDFs) → `zam_material_import_context`, then `zam_material_import`; the
     learner decides in the Studio.
   - Add a short section "Import class material" to `skills/zam/SKILL.md`,
     and to every packaged copy (see `plugin.json`, ADR 2026-08-09b).
5. **Studio handoff** (D2). Add a new import tab "Foto / Datei" / "Photo /
   file":
   - **Before the picker:** "Ein Fach pro Import" / "One subject per import".
   - **When `agent-harness-status` reports a connected harness:**
     - an option "Mit <Harness> importieren — kann nachfragen, oft die klügere
       Wahl" / "Import with <harness> — it can ask back, often the smarter
       choice";
     - a copy button for the request. Once a file was picked, the request names
       its path ("Importiere /Users/…/IMG_1234.jpg mit ZAM als Lernkarten.").
   - **Without a harness:** one line and a link to Settings → Agent.
6. **opencode.** It is a terminal harness: it reads local files by path and
   renders no panels, so the review always opens in the Studio. Connect it
   with `zam agent connect opencode`.

### Tests

- `tests/cli/mcp-material-import.test.ts`:
  - both tools are registered;
  - an invalid payload gives a readable error;
  - a valid one stages a batch with origin `harness`;
  - no token or card rows exist afterwards;
  - `sha256` is filled for a readable path.
- The launcher with a mocked spawn.
- A wiring test for the handoff tab.

**Manual pass.**

- Setup: opencode with GPT-6-Luna and ZAM connected, and a synthetic
  handwritten page (written for the test, not the learner's).
- Path: ask to import it, answer a question the agent asks back, review in
  the Studio, confirm.
- Then check:
  - the cards are in the queue;
  - Bonus items are in the Bonus view (once Phase 7 is in);
  - the `sources` row has a fingerprint.

---

## Phase 6 — built-in Studio path

1. **Capability `file`** (D1).
   - Add it to `ModelCapability` and `ALL_CAPABILITIES`
     (`src/kernel/system/install-config.ts`).
   - In `src/cli/llm/capability-probe.ts`, set
     `catalogFile = declared ? declared.includes("file") : undefined`, from
     declared metadata only, with no name hint.
   - Mirror the type and add a label ("Dateien (PDF)" / "Files (PDF)") in
     `desktop/src/main.ts` and in Mobile's model registry.
   - Extend the existing capability tests.
2. **Request module** `src/cli/llm/material-prompt.ts`:
   - **`buildMaterialInstructions({ locale, areas, subjects, pages? })`**
     covers `MATERIAL_CARD_RULES`, the contract shape and the language rule:
     the cards use the material's language.
   - **`buildMaterialRequest(flavor, model, parts)`:**
     - `openai`: chat completions with `image_url` data URLs, and `file` parts
       (`filename`, `file_data`) for PDFs.
     - `anthropic`: `image` and `document` base64 blocks.
     - Request JSON output where the flavour supports it.
   - **Strict rule:** a PDF part is added only when the caller passes a model
     row with the `file` capability. Anything else throws (D1: OpenRouter
     would otherwise transcribe on its side).
3. **Client `src/cli/llm/material-import.ts`:
   `analyzeMaterialViaLLM(db, files, opts)`.**
   - **Model rows:** images use `getProviderForRole(db, "vision")`, and PDFs
     use `resolveCapability(db, "file")`. Without a file row, a PDF is
     refused with a learner-facing reason.
   - **Image preparation (D1):**
     - On macOS, `sips` converts HEIC to JPEG and caps the long edge at
       `IMAGE_LONG_EDGE_PX`, in a temporary directory that is deleted
       afterwards.
     - Elsewhere, JPEG, PNG and WebP go unchanged within a budget: 10 MB per
       file, 20 MB per request. HEIC is refused with "Bitte als JPEG
       exportieren" / "Please export as JPEG".
   - **Requests:**
     - At most `MAX_IMAGES_PER_REQUEST` images per request.
     - If the provider rejects the request for its image count or size, split
       the images in halves and merge the results. The learner sees a
       progress note.
   - **Result:** validate with `parseMaterialProposalSet`. Log no transcript
     and no model text.
4. **Bridge command:** `material-import-analyze --file <path>… [--pages <range>]`
   stages the result (origin `studio`) and returns `{ id }`, with progress
   through `throttledProgress`.
5. **Studio, tab "Foto / Datei":**
   - **Picking files:** extend `pickLearningContentFile` to multi-select
     images and PDFs. Add Tauri drag and drop on the tab
     (`getCurrentWebview().onDragDropEvent`): both give paths, which become
     the `source_link`.
   - **The line under the button** names the model: "Wird an <Modell>
     gesendet" / "Sent to <model>" (D11).
   - **Missing capabilities:**
     - Without an image model: one line, a link to the model setup and the
       harness hint.
     - A PDF without a file model: the D1 message.
   - **Analyze** opens the Phase 4 review list.
6. **Retire** the "OCR Scan" option in the "File / Link / Scan" tab. File and
   web link stay.

### Tests

- **Capability probe:**
  - `file` declared → set;
  - not declared → unset;
  - no name heuristics.
- **Request builder snapshots** per flavour. A PDF with a non-`file` row
  throws.
- **`analyzeMaterialViaLLM`** with a mocked transport:
  - the size budget;
  - the split on rejection;
  - HEIC off macOS → message;
  - nothing logged.
- **Studio wiring:** the tab, the model line, the missing-capability states.

---

## Phase 7 — Bonus view and the offer after the due queue

1. **Learning Content.** Add a "Bonus" segment that lists
   `material-import-bonus-list`: title, area, and "aus <Importtitel>,
   <Datum>" / "from <import title>, <date>". Each item has a "Lernen" /
   "Learn" action → `material-import-bonus-take`.
2. **After the due queue** (`desktop/src/study-offers.ts`):
   - Add `importBonusCommand(limit = 2)`.
   - When the learner's imports hold bonus items, offer "2 weitere aus deiner
     Chemie-Mitschrift" / "2 more from your chemistry notes" with take
     actions. Otherwise keep the existing atom bonus offer.
   - No score, streak or target (D6).
3. **i18n** (`en`, `de`).

### Tests

- The pure helpers in `study-offers.ts`.
- A wiring test for the segment and the offer.

---

## Phase 8 — Mobile

1. **Prompt.**
   - Replace the prompt in `mobile/src/vl-import.ts` with
     `buildMaterialInstructions` and `buildMaterialRequest`.
   - Keep the native `vision_request` transport and `downscaleImageFile`.
2. **Input.**
   - Several photos (camera and photo library) and files.
   - PDFs only with a `file` model row; otherwise the D1 message.
   - HEIC goes through the WebView's own decoding where available. Where it
     is not, the same "export as JPEG" message as on desktop.
3. **Review.**
   - Run `matchMaterialProposals`, with Mobile's embedder as `embed` when one
     is connected, and `commitMaterialImport` directly on the device database.
   - Move the pure review state from Phase 4 into a module both apps import,
     with no Node built-ins. The DOM stays per app.
   - No staging file: the built-in path does not cross a process boundary.
4. **Bonus.** Offer imported bonus items in `mobile/src/study-offers.ts`.
5. **Tests** in `tests/mobile/`, following the existing VL-import tests.

---

## Phase 9 — the review list as an MCP Apps panel (optional)

This phase is for hosts that render panels (Claude Desktop, Codex, the Copilot
app).

1. Add a review view to the Studio panel bundle (`vite.config.panel.mts`) that
   renders a staged batch.
2. Add app-only tools for confirm and discard, following `zam_studio_bridge`'s
   closed pattern: panel-callable and hidden from the model.
3. `zam_material_import` opens the panel when the host supports Apps, and the
   Studio otherwise.

opencode does not render panels, so this phase is not needed for the field
test.

---

## Phase 10 — documentation and handover

1. **OKF**, written **through the `zam_okf_upsert` MCP tool** — never edit
   bundle files by hand.
   - **New article `material-import.md`:**
     - the two paths;
     - the review list and its presets;
     - Bonus;
     - provenance without the original;
     - PDFs only natively.
   - **Updates:**
     - `mcp-surfaces.md`: the new tools;
     - `bridge-protocol.md`: the new commands;
     - `local-card-file-import.md`: how the model-free import differs from
       material import;
     - `mobile-standalone-libraries.md`: Mobile import;
     - `token-card-model.md`: bonus tokens without cards.
2. **Conventions.** Add one line to both `CLAUDE.md` and `AGENTS.md` under Key
   conventions:
   > Material import (photos, PDFs, ADR 2026-10-05): the model reads the file
   > itself; the learner decides each card in one review list (Yes / No /
   > Bonus); nothing of the material is stored — only a source link and file
   > fingerprints. PDFs go only to models that declare `file` input.
3. **ADR status.** Set ADR 2026-10-05 to `Implemented`, or to `Partially
   implemented` with a delivery note (for example without Phase 9), and update
   its row in `docs/adr/README.md`.
4. **This plan.** Mark each phase with its commit hash. Delete the plan before
   the release that ships the feature, unless open tasks remain.

## Deliberately not in this plan

- **PDF handling for models without `file` input** (page rendering, text
  layer). It becomes its own improvement if learners ask for it (owner
  decision, 2026-10-05).
- **The share sheet** ("Share to ZAM").
- **Office formats on the built-in path.** The harness path reads what its
  harness reads.
- **Desktop image downscaling outside macOS.** It needs an image decoder
  dependency or the Tauri asset protocol. Revisit if the request budget bites.
- **Curated library topic names** (ADR 2026-10-02 phase 3).
- **Cleaning up `Deutsch` and grade-in-path areas.** That is the
  `zam doctor domains` task.

## Pitfalls

- **Drafts never reach the queue.** The old source import writes
  `editorial_state = 'draft'` without a source link. Do not route through
  `applySourceProposals`.
- **Cell attach treats a domain change as material.** Never change a
  fixture's domain without the matching migration in the same release.
  Otherwise every reviewed card of that tile becomes due.
- **OpenRouter parses PDFs server-side** for models without native file
  input. The `file` gate must be strict in the request builder, not only in
  the UI.
- **`sources.uri` is UNIQUE.** Always use `zam-import:<ULID>`, never a file
  name — cameras reuse names.
- **Team libraries.** A member connection runs no DDL (ADR 2026-09-04
  Decision 8), so members see "update required" until the owner's client runs
  M037 and M038. Say so in the release notes.
- **Embeddings after M038.** Semantic search loses the rewritten tokens until
  they are re-embedded. The review command tops up before matching, and the
  release note recommends `zam token reembed`.
- **Mobile bundle.** `material-prompt.ts` and the shared review state are
  imported by Mobile; a Node built-in there breaks the WebView build.
- **Privacy.** The staging files hold proposals and file references only. No
  image bytes, no transcript, and no learner material in tests or commits.
