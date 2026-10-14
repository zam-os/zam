# Card formulas, images and spoken text — implementation plan

**Status:** Proposed — no phase started.\
**Decision:** [ADR 2026-10-14b — Card Text Beyond Plain Strings: Formulas,
Images and Spoken Text](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md).
Its decisions are cited here as D1–D9. Read the ADR first; this plan does not
repeat its reasons.\
**Branch:** create `feat/rich-card-text` from `main` after PR #411 (the ADR
and this plan) is merged. All phases go onto that one branch and one PR, with
one commit per phase.

This document is harness-agnostic. Claude Code, Antigravity, Codex or a human
can pick up the next unchecked phase without any other context.

## Goal

A card's question, reference answer and fast-check options can hold
**segments**: text, formulas (allowlisted LaTeX, rendered as MathML) and
small images.

- **Every formula and image carries text to be read.** Voice mode speaks it
  and screen readers announce it.
- **The plain columns stay.** Every plain-text reader keeps working.
- **The bundled tiles move from raw LaTeX to segments.** A learner sees
  `W_el = ½·C·U²` typeset, and hears "W el gleich ein halb C U Quadrat",
  instead of `$W_{\text{el}} = \frac{1}{2} C U^2$`.

## Status

- [ ] **Phase 1** — kernel: segment types, inventory, tokenizer, markup
  check, projections, converter
- [ ] **Phase 2** — schema and the one write path
- [ ] **Phase 3** — Studio recall renders segments; voice speaks them;
  measurements
- [ ] **Phase 4** — tiles: segment fields, installer, `installed_tiles`,
  background reinstall, team step
- [ ] **Phase 5** — bundled tile migration (owner review gate)
- [ ] **Phase 6** — writers: prompts, tool contracts, `$` repair,
  placeholders
- [ ] **Phase 7** — Anki formula lift and the Studio editor (D9)
- [ ] **Phase 8** — Mobile, the MCP recall panel, image segments
- [ ] **Phase 9** — documentation and handover

**The ADR's deliveries map onto the phases:**

| ADR delivery | Phases |
|---|---|
| 1 | 1–3 |
| 2 | 4–5 |
| 3 | 6–7 |
| 4 | 8 |

Phase 9 closes the plan.

**Order.**

- **Field-test milestone: Phases 1–6.** The field-test learner studies in the
  desktop Studio and imports material through opencode. So the Studio
  rendering (3), the converted tiles (5) and the material import's contract
  (6) are what she meets.
- **Phase 5 has an owner gate.** It can only merge after Thomas has read the
  speech sample and the projection diff report.
- **Phase 3 has a measurement gate.** If the corpus renders badly on WebKit,
  stop and ask the owner before Phase 8. The ADR's fallback is KaTeX's HTML
  output on that engine (Open question 2).
- **Phases 7 and 8 follow the milestone.**

## Ground rules for every phase

Repository conventions from `CLAUDE.md` / `AGENTS.md` that this feature
touches:

- **Kernel versus CLI.**
  - Segment types, validation, projections, the converter, the write
    function and the tile reconcile live in `src/kernel/`.
  - No HTTP, no LLM calls and no renderer in the kernel. The kernel never
    imports Temml.
- **Dependencies.** `AGENTS.md` forbids new dependencies without the owner's
  approval. Accepting ADR 2026-10-14b approves exactly two:
  - **`temml`, pinned to exactly `0.13.5`** (no caret). It goes into
    `desktop/package.json` and `mobile/package.json`, plus the root
    `package.json` as a dev dependency for the panel build and tests.
  - **The Latin Modern Math font** as a committed `woff2`, with its GUST Font
    License text beside it. Temml's npm package carries only `Temml.woff2`,
    so take `latinmodern-math.woff2` from Temml's repository at the `v0.13.5`
    tag or from the GUST distribution. Record its source and SHA-256 in a
    `README` next to it.

  Nothing else: no jsdom, no image library, no Speech Rule Engine.
- **Schema changes** go into BOTH `src/kernel/db/schema.ts` AND an idempotent
  numbered migration in `runMigrations` (`src/kernel/db/provision.ts`).
  - Increment `CURRENT_SCHEMA_VERSION` (47 on `main` today). Take the next
    free M-number at implementation time, since other branches add
    migrations too.
  - Migrations must run on SQLite and PostgreSQL; check with
    `npm run pg:test`.
- **Bridge.** `zam bridge` emits JSON only, errors included.
  `src/bridge/protocol.ts` changes are additive and optional. Existing
  fields keep their types; segments travel in new optional fields beside
  them.
- **Optional surfaces stay lazy.** Temml is loaded with a dynamic `import()`
  on the first math segment. MCP code stays in the lazily imported
  `src/cli/commands/mcp.ts` graph (ADR 2026-07-07).
- **Modules Mobile imports** must not use Node built-ins, because they end up
  in the WebView bundle. That covers `src/kernel/library/card-text*.ts` and
  `desktop/src/card-text-render.ts`.
- **Trust model** (ADR 2026-10-08b, `docs/okf/agent-trust-model.md`):
  - No stored string reaches `innerHTML`.
  - Every tool stays safe to auto-approve.
  - No argument writes a security switch.
- **IDs** are ULIDs (`ulid()`).
- **Privacy.** Tests use synthetic formulas and cards written for the tests.
  The bundled tiles are public fixtures and may be read by tests. Never name
  the field-test learner in code, commits or PRs.
- **i18n.** New strings go into the `en` and `de` reference packs only
  (`desktop/src/i18n.ts`, `mobile/src/i18n.ts`). Do not machine-fill the
  other languages.
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

  Schema phases add `npm run pg:test`, and surface phases add
  `npm run build`. A phase that renames, moves or deletes a file cited by
  the knowledge map also runs:

  ```bash
  npm run dev -- knowledge-map validate --repo . --write
  ```

## Shared vocabulary

| Name | Where | Value |
|---|---|---|
| `CardSegment` | `src/kernel/library/card-text.ts` | `TextSegment \| MathSegment \| ImageSegment` |
| `TextSegment` | same | `{ type: "text"; text: string }` |
| `MathSegment` | same | `{ type: "math"; tex: string; speech?: string; block?: boolean }` |
| `ImageSegment` | same | `{ type: "image"; media: string; alt: string; caption?: string; inline?: boolean }` (`media` is the asset hash) |
| `CardText` | same | `CardSegment[]` |
| math inventory | `src/kernel/library/math-inventory.json` | `{ version, controlWords[], environments[] }`, frozen |
| `findPlainTextMarkup(text)` | `card-text.ts` | D2's three rules, as issues with offsets |
| `validateCardText(segments, opts)` | same | every rule of D2–D5; `opts.requireSpeech` |
| `tokenizeTex(tex)` | `src/kernel/library/tex-tokenizer.ts` | fail-closed lexer over the inventory |
| `texToPlain(tex)` | `src/kernel/library/tex-plain.ts` | the deterministic Unicode converter (D4) |
| `plainProjection(segments)` | `card-text.ts` | text as written, formulas by `texToPlain`, images by `alt` |
| `spokenProjection(segments)` | same | text as written, formulas by `speech` (else plain), images by `alt` |
| `liftDollarMath(text, mode)` | `src/kernel/library/dollar-lift.ts` | `$$…$$` before `$…$`; `mode: "strict"` (tiles) fails on an unbalanced `$`; `"lenient"` (import repair) lifts only math-looking spans |
| `writeCardText(tx, tokenId, fields)` | `src/kernel/library/card-text-store.ts` | the one write function (D1) |
| `installed_tiles` | schema | `tile_id` PK, `version`, `installed_at`, `failed_at`, `last_error` |
| `token_media.placement` | schema | `'attached'` (default) \| `'inline'` |
| `renderCardText(el, segments, plain)` | `desktop/src/card-text-render.ts` | framework-free DOM renderer, used by Studio, Mobile and panel |
| `renderMath(el, tex, plain)` | `desktop/src/math-render.ts` | lazy Temml, settings of D3, output check |

## Phase 1 — kernel: segments, inventory, tokenizer, projections

Pure functions only. No schema, no surface.

1. **Inventory.** `scripts/build-math-inventory.mjs` scans
   `tests/fixtures/curriculum/*-kvt.json` and collects the control words
   and environments inside `$…$`/`$$…$$` and bare commands. It writes
   `src/kernel/library/math-inventory.json`.
   - **Run it once and commit the result.** From then on the file is frozen:
     a change is a reviewed edit, never a regeneration in CI.
   - **Review the generated list by hand.** It must contain nothing from
     D3's rejected families (`\def`…, `\csname`, `\char`, `\href`…,
     `\label`/`\ref`/`\tag`). The script refuses to write if it finds one.
   - **Environments:** expect exactly `pmatrix`, `aligned`, `array` and
     `cases`.
   - **Windows paths:** the two informatics tiles (`C:\Schule\…`,
     `C:\Gymnasium\NuT\…`) are text. Apply D2's path rule before
     collecting.
2. **`tokenizeTex`.** It lexes control words (`\[A-Za-z]+`), control symbols
   (`\` plus one character), braces, `^`, `_`, `&`, `\\` and other
   characters.
   - **It rejects:**
     - every control word outside the inventory;
     - an environment outside it;
     - unbalanced braces;
     - `$`;
     - a bare `%` or `#` (`\%` and `\#` are allowed);
     - control characters;
     - more than 500 characters.
   - **Errors name the offending token and its offset.**
3. **`findPlainTextMarkup`** implements D2 exactly:
   - a `$…$` span that looks like math (shared with `liftDollarMath`'s
     lenient test);
   - an inventory control word that does not follow a letter, digit, `:`,
     `.`, `/` or `\`;
   - inline `**…**` or `__…__` (line-start list markers are not emphasis);
   - control characters other than `\n`.
4. **`validateCardText`.**
   - **Text segments:** `findPlainTextMarkup`.
   - **Math:** `tokenizeTex`. `speech`, when present, must be plain text
     without `\`, `$` or `<`, at most 600 characters (D4; Phase 5 may lower
     the cap from measured data). It is required when
     `opts.requireSpeech`.
   - **Image:** a non-empty `alt`.
   - **Whole value:** at least one segment, at most 200.
5. **`texToPlain`.** The deterministic converter for the inventory:
   - **Structure:**
     - `\frac{a}{b}` → `a/b`, with parentheses when either side holds an
       operator or a space;
     - `\sqrt{x}` → `√x` or `√(x)`;
     - sub- and superscripts become Unicode where every character maps,
       else `^(…)`/`_…`;
     - isotope prescripts `^4_2\text{He}` → `⁴₂He`.
   - **Text and symbols:**
     - `\text`/`\mathrm`/`\mathbf` → their content;
     - Greek letters, operators, relations and arrows → their Unicode
       characters;
     - `{,}` → `,`;
     - `\vec`, `\bar`/`\overline` and `\dot` → combining characters.
   - **Layout:**
     - `pmatrix`/`array` → `[[a, b], [c, d]]`;
     - `cases` → branches joined by `; `;
     - `aligned` → rows joined by `; `;
     - `\left`/`\right` are dropped.
6. **`plainProjection` / `spokenProjection`** as in the vocabulary table.
7. **`liftDollarMath`.** It consumes `$$…$$` before `$…$` and returns
   segments.
   - **`strict`** throws on an unbalanced `$`.
   - **`lenient`** lifts only spans with a control sequence, `^`, `_`, `=`,
     or digits with operators. It leaves `$HOME` and `5 $` as text and
     reports them.
8. **Export** the public functions from `src/kernel/index.ts`.

### Tests (`tests/kernel/card-text.test.ts`, `tex-tokenizer.test.ts`, `tex-plain.test.ts`, `dollar-lift.test.ts`)

- **Tokenizer:**
  - accepts every formula of the corpus;
  - rejects each rejected family, `%`, `#`, `$` and more than 500
    characters;
  - accepts `\%` and `\#`;
  - rejects an unknown environment.
- **Markup check:**
  - flags `\beta zwischen`, `**fett**` and a tab;
  - passes `C:\Schule\Mathe\test.pdf`, `..\Bilder\logo.png`,
    `* **Umfang**: …` (only the emphasis is flagged), `1. Punkt` and
    `- Punkt`.
- **Converter:** a golden table of at least 40 corpus formulas, covering
  fractions, roots, prescripts, matrices, `cases`, `aligned`, arrows and
  accents. Include `W_{\text{el}} = \frac{1}{2} C U^2` → `W_el = ½·C·U²`, or
  whatever form the converter's documented rules give.
- **Lift:**
  - a string mixing `$$…$$` and `$…$` lifts correctly;
  - an unbalanced `$` throws in strict mode and stays text in lenient mode;
  - `$HOME` stays text.
- **Projections:** speech falls back to plain, and images read their `alt`.

## Phase 2 — schema and the one write path

1. **Migration** (next M-number):
   - `tokens.question_segments TEXT`, `tokens.concept_segments TEXT` (JSON,
     nullable);
   - `choice_distractors.text_segments TEXT`;
   - `token_media.placement TEXT NOT NULL DEFAULT 'attached'`, checked to
     `'attached'`/`'inline'`;
   - `installed_tiles(tile_id TEXT PRIMARY KEY, version TEXT NOT NULL,
     installed_at TEXT NOT NULL, failed_at TEXT, last_error TEXT)`.

   Mirror all of it in `schema.ts`.
2. **`writeCardText(tx, tokenId, { question?, concept? })`.** It takes
   segments only. It validates with `validateCardText`, derives the
   projections and writes both columns. When a projection changed, it
   deletes the token's `token_embeddings` row.
   - **Images:** it syncs `token_media` rows with `placement = 'inline'`
     for the segment images of each side. It inserts missing rows, removes
     rows no segment names any more, and never touches `attached` rows.
   - **Revisions:** `publishTokenRevisionInTransaction`
     (`src/kernel/library/revision.ts`) gains `questionSegments` and
     `conceptSegments` in `changes` and routes them through
     `writeCardText`.
3. **Plain writes to a segmented field are refused.** `updateToken`,
   `createToken` and the revision path reject plain `question` or `concept`
   text for a field whose segments are not null. The message is: "this card
   has formulas or images; edit its segments". Phase 7 gives the Studio
   editor a segment-aware path. Until then the editor shows that message.
4. **Fast checks.**
   - **Storage:** `fast_check` JSON keeps `options: string[]` (the
     projections) and gains `option_segments?: (CardText | null)[]`.
   - **Reading:** `parseReviewFastCheck` (`src/kernel/scheduler/queue.ts`)
     accepts both and validates `option_segments` when present. On any
     invalid option segment it keeps the plain options, rather than
     returning `null` and silently dropping the fast check.
5. **Distractors.** `syncCuratedDistractors` writes `text_segments` and its
   projection. `choiceSourceHash` (`src/kernel/recall/choice-options.ts`)
   stays over plain projections; assert that in a test.
6. **Answer points** keep reading `concept`, the projection. No change, but
   add a test showing that a segmented concept with list lines counts the
   same.
7. **Review payload.** The kernel's review-card builder adds the segments
   and the spoken projections for question and concept. Find it from
   `get-review`/`get-reviews` in `src/cli/commands/bridge.ts`.
   - **Protocol:** `src/bridge/protocol.ts`'s `GetReviewResponse` gains
     optional `questionSegments`, `conceptSegments`, `spokenQuestion`,
     `spokenConcept` and `fastCheck.optionSegments`.

### Tests (`tests/kernel/card-text-store.test.ts`, provision tests)

- **Migration:** runs twice without error on SQLite. `pg:test` covers
  PostgreSQL.
- **Write path:**
  - `writeCardText` round-trips segments and derives the projections;
  - the embedding row is dropped only when a projection changed;
  - `inline` media rows are synced while `attached` rows stay.
- **Media cleanup:** `pruneOrphanedMediaAssets`
  (`src/kernel/import/text-import.ts`) keeps an asset that only an `inline`
  row references.
- **Refusal:** a plain update of a segmented field is refused.
- **Fast checks:** `parseReviewFastCheck` with segment options returns the
  fast check, and with a broken option segment still returns the plain
  options.
- **Distractors:** a speech-only change keeps `choiceSourceHash`, and a
  `tex` change alters it.

## Phase 3 — Studio recall, voice, measurements

1. **Dependency and font** as in the ground rules. The font goes under
   `desktop/src/assets/fonts/`, with its licence and README.
2. **`desktop/src/math-render.ts`.**
   - **Loading:** a lazy `import("temml")`.
   - **Options:** an object created with `Object.create(null)` that holds
     `trust: false`, `maxExpand: 100`, a bounded `maxSize`,
     `throwOnError: true` and `annotate: false`, each as an own property.
   - **Rendering:** into a detached element.
   - **First, find out how `temml.render` builds its nodes,** and write it
     down in the module comment. The output check must work whether Temml
     builds DOM nodes or parses a string.
   - **The output check** walks the produced MathML against an element and
     attribute allowlist: MathML Core presentation elements;
     `mathvariant`, `display`, `displaystyle`, `scriptlevel`, `stretchy`,
     `fence`, `separator`, `lspace`, `rspace`, `width`, `columnalign`,
     `rowspacing` and `columnspacing`. Refine the list against Temml's real
     output for the corpus.
   - **What is refused:** `href`, every `on*` attribute, `annotation-xml`,
     `style` and `class`.
   - **On any throw or failed check,** the element gets the formula's plain
     projection as text.
   - **Accessibility:** `alttext` set from `speech`, with no `aria-label`
     (D4). A block formula sits in a container with `overflow-x: auto`.
3. **`desktop/src/card-text-render.ts`.** It renders text segments as text
   nodes, math through `renderMath`, and images as `<img>` from the review
   payload's media, with `alt`. Without segments it falls back to the plain
   string.
   - **It replaces the text path of `renderQuestionWithTopic`**
     (`desktop/src/question-topic.ts`); the topic label stays.
   - **The reveal view** renders `conceptSegments` the same way.
   - **Fast-check buttons** render `optionSegments`.
4. **CSS.** `@font-face` for Latin Modern Math from the bundled file;
   `math { font-family: "Latin Modern Math", math; }`. The Studio CSP already
   allows `font-src 'self'`.
5. **Voice.**
   - **Card data:** `VoiceReviewCard` (`src/kernel/recall/voice-review.ts`)
     gains optional `spokenQuestion` and `spokenExpectedAnswer`.
   - **Speaking:** the loop speaks them when present
     (`card.spokenQuestion ?? card.question`), and so does
     `answerComparisonSpeech`.
   - **Studio:** its `currentCard` (in `desktop/src/main.ts`) fills both from
     the payload.
6. **Measurements (gate).**
   - **WebKit corpus page.** A dev-only page (not shipped) renders every
     corpus formula in Studio on macOS (WebKit). Record failures and visible
     defects in this plan with screenshots, and compare a sample on
     WebView2 if available.
   - **VoiceOver on macOS:** does it read `alttext`, an annotation or
     neither? Can a user navigate a fraction and a matrix?
   - **Write the results into the ADR's Open questions 1 and 2 and ask the
     owner** before Phase 8 if WebKit falls short.

### Tests (`tests/desktop/card-text-render.test.ts`, `math-render.test.ts`)

- **Renderer:** with fake elements, in the style of
  `tests/desktop/question-topic.test.ts`, assert the node sequence for text,
  math and image segments, and the plain fallback.
- **Output check:** run it in Node against `temml.renderToString` output for
  every corpus formula. All of it passes. Hand-made MathML with `href`,
  `onclick` or `annotation-xml` is refused.
- **Settings:** `math-render` builds its options without a prototype, so
  setting `Object.prototype.trust = true` in the test leaves `trust` false.
  Restore the prototype afterwards.
- **Voice:** `voice-review` speaks `spokenQuestion` when present.

## Phase 4 — tiles: fields, installer, reconcile, team step

1. **Tile format** (`src/kernel/library/kvt-attach.ts`, `KvtPracticeItem`).
   - **New optional fields:** `question_segments`, `concept_segments`, and
     segment lists allowed as `fast_check.options` entries.
   - **Precedence:** when an item has segments, its `question`/`concept`
     strings are derived and need not be written. If both are given, they
     must agree with the projection, or the install fails.
   - **Distractors:** segment lists are allowed in `choice_distractors`
     entries.
   - **Atom titles** are checked with `findPlainTextMarkup`.
2. **The installer writes segments on every install** (D7).
   - **What it writes:** after the substance comparison, for every item,
     `writeCardText` and the fast-check `option_segments`.
   - **Why outside the comparison:** speech and alt leave `substanceChanged`
     false, and must still arrive. They create no revision.
   - **Validation:** new items validate with `requireSpeech: true`
     (published content, D4).
3. **`installed_tiles`.** `installKvtTile` upserts the tile's row with its
   `version` on success. On failure it sets `failed_at`/`last_error` and
   rethrows.
4. **`reconcileInstalledBundledTiles(db, { signal })`**
   (`src/kernel/library/bundled-cells.ts`).
   - **Which tiles:** each bundled tile that has installed items and whose
     row is missing or carries a different `version`.
   - **How:** one `installKvtTile` per tile. It skips a tile whose
     `failed_at` is newer than this process's start, stops when `signal`
     aborts, and returns a summary.
   - **Never on a team library.** The function refuses when the database is
     the PostgreSQL team target; check how `src/kernel/db/connection.ts`
     tells them apart.
5. **Bridge command `bundled-tiles-reconcile`**
   (`src/cli/commands/bridge.ts`, JSON only).
   - **Studio** calls it once after start, in the background, after the
     first card is shown, and never blocks.
   - **Offline,** the call fails quietly and is retried at the next start.
6. **Team step.** `zam team reinstall-tiles --database …`
   (`src/cli/commands/team.ts`) runs the same reconcile with the
   administrator's credentials, next to `zam team provision`.

### Tests

- **Installer:**
  - an install with segments writes them;
  - a reinstall that adds only `speech` writes the segments and creates no
    revision;
  - a reinstall where `question` and the segment projection disagree fails.
- **Reconcile:**
  - installs only changed installed tiles;
  - records the version;
  - a failing tile gets `failed_at` and does not block the others;
  - a second call is a no-op;
  - it refuses on the team target. Use the existing Postgres test helpers
    when `pg:test` runs.

## Phase 5 — bundled tile migration (owner review gate)

Tools under `scripts/card-text-migration/` (Node, run by hand, not shipped):

1. **`lift.mjs`** applies to every `*-kvt.json`:
   - the eleven explicit patches from `patches.json`, which you write by hand:
     the seven strings with tab or carriage-return damage and the four
     questions with a bare command;
   - `liftDollarMath(…, "strict")` on `question`, `concept`, option strings
     and `sample_solution`;
   - dropping Markdown emphasis (D2);
   - `texToPlain`-based plain Unicode for the six atom titles. Check each by
     eye.

   Items whose text changed get `"materiality": "cosmetic"`. Shared item ids
   (the Optik tiles) are processed once and written identically.
2. **`ascii-math-worklist.mjs`** lists the concepts and options with ASCII
   math (carets, `sqrt(`, `*` as multiplication) for the content model to
   rewrite as segments.
3. **`speech-worklist.mjs`** writes one JSONL line per unique learner-visible
   formula: item id, field, `tex`, subject and language. Lines are
   deduplicated by item id and formula, and `sample_solution` is left out.
4. **Content-model pass.** Produce speech and the ASCII rewrites with the
   `quality-first` content model (GPT-6 Luna class, ADR 2026-08-09c) through
   ZAM's own LLM client.
   - **Prompt:** "how a German teacher reads the formula aloud", with
     examples from the ADR.
   - **Batches** of about 50 formulas.
   - **Output** is validated with `validateCardText`. Store the raw results
     under the script folder, not in the tiles.
5. **`merge.mjs`** writes speech and rewrites back into the tiles and fills
   in the projections.
6. **`diff-report.mjs`** writes one Markdown report per tile:
   plain projection before → after for every changed field, and every
   formula with its speech.
7. **Tile test** (`tests/kernel/bundled-tiles-card-text.test.ts`), over all
   228 tiles:
   - no markup in text segments or titles;
   - every formula tokenizes;
   - every learner-visible formula has `speech`;
   - every image has `alt`;
   - no tab or carriage return in any string;
   - stored projections equal derived projections;
   - tiles sharing an item id agree byte for byte;
   - every changed item declares `materiality`.
8. **Measure the speech lengths** and set the D4 cap from the maximum
   (rounded up). Lower it from 600 if the data allows.
9. **Owner gate.** Thomas reads a sample (fractions, matrices, prescripts,
   the eleven patches, per subject) and skims the diff reports. Note his
   verdict here before committing the phase.

## Phase 6 — writers

1. **Card rule.** Add the segment rule to `CARD_SHAPE_RULES`
   (`src/kernel/library/card-shape.ts`): formulas as math segments with
   speech, no LaTeX or Markdown in text, and images only from attached
   material.
   - **Generated from the inventory:** the rule text names the allowed
     environments from the inventory file, so prompt and validator agree.
   - **A short JSON example** goes into each card prompt.
2. **Material import** (`src/kernel/import/material-import.ts`,
   `material-contract.ts`, `src/cli/llm/material-prompt.ts`).
   - **Contract:** a proposal's `question`/`answer` may be a string or a
     segment list.
   - **Parsing:** `parseProposals` runs `liftDollarMath(…, "lenient")` on
     strings, and marks what it could not lift (`$HOME`-like spans) for the
     review list. It never turns that into a set-level issue.
   - **Missing speech:** the built-in path asks the model once for it,
     reusing the reply format; the harness path returns an issue naming the
     segment.
   - **Writing:** the commit writes through `writeCardText`.
3. **OKF import tool and `zam_add_token`** (`src/cli/bridge-handlers.ts`,
   `src/cli/commands/mcp.ts`). They accept optional segment fields, and the
   tool descriptions state the contract. Invalid segments return a
   validation error that names the segment; that is how an agent fails
   loudly.
4. **Variation and translation** (`generateQuestionViaLLM`,
   `translateQuestionViaLLM` in `src/cli/llm/client.ts`;
   `mobile/src/ai/translate.ts`).
   - **What the model sees:** a segmented question becomes text with
     placeholders `[[1]]`, `[[2]]`, … plus the formulas' speech.
   - **What it returns:** the text with the same placeholders, and, for
     translation, the translated speech.
   - **The kernel splices** the stored `tex` and image hashes back. A
     missing or duplicated placeholder serves the stored question.
   - **Tests** use a scripted model reply.
5. **Evaluation and generated choice options** (`src/cli/llm/client.ts`,
   `src/cli/llm/choice-prompt.ts`). They receive the plain projection, and
   one rule line says: write formulas as plain Unicode text, never LaTeX.

### Tests

- **Material import:**
  - a proposal with `$x^2$` is lifted;
  - one with `$HOME` stays text and is marked;
  - the set never fails on these;
  - the harness path reports missing speech.
- **Agent tools:** `zam_add_token` with an invalid segment returns the
  validation error.
- **Variation:** the round trip keeps `tex` byte for byte, and a dropped
  placeholder falls back.
- **Prompts:** the prompt snapshot contains the segment rule.

## Phase 7 — Anki formula lift and the Studio editor

1. **Anki import** (`src/cli/import/apkg.ts`,
   `src/cli/import/text-sanitizer.ts`).
   - **Lifting:** before HTML is made inert, it lifts `\(…\)`, `\[…\]`,
     `[$]…[/$]`, `[$$]…[/$$]` and `[latex]…[/latex]` into math segments.
   - **Unsupported formulas:** a formula the tokenizer refuses stays as its
     source text, so the card is still imported, and the import summary
     counts it.
   - **Speech:** none at import. A connected content model may fill it later
     through the same speech pass as Phase 5, run per import. That is
     optional and not part of this phase.
2. **Studio editor** (D9; `desktop/src/learning-content.ts`, bridge
   `personal-card-publish-revision` and `personal-card-revision-preview`).
   - **The default view** shows the rendered card and each formula's
     spoken sentence.
   - **The default edit:** "let the model fix it" takes a one-line
     instruction and returns segments, which pass the preview before
     publishing.
   - **"Insert formula"** opens an empty math segment, with a TeX field and
     live preview, and a speech field.
   - **Curators** find the TeX and speech fields of every formula behind a
     disclosure.
   - **Text segments** stay plain text areas.
   - **Bridge:** the publish-revision command accepts segments and
     validates them in the kernel.

### Tests

- **Anki:** a synthetic `.apkg` fixture with `\(\frac{1}{2}\)` and
  `[$]x^2[/$]` imports as math segments, and a refused formula stays text.
- **Editor:** the bridge revision with segments round-trips, and invalid
  segments are refused with the kernel's message.

## Phase 8 — Mobile, the MCP recall panel, image segments

1. **Mobile** (`mobile/src/main.ts`).
   - **Rendering:** uses `renderCardText` for question, reveal and
     fast-check options; Temml and the font are bundled as in Phase 3.
   - **Voice** uses the spoken projections.
   - **CSP:** add `font-src 'self'` and the `img-src` the app's own images
     need (`mobile/src-tauri/tauri.conf.json` has none today).
   - **Check on devices:** on the Pixel 9 and the field test's Pixel 6
     (rendering, TalkBack), and on the iPad simulator (VoiceOver). Record
     the results under the ADR's Open question 1.
2. **MCP recall panel** (`desktop/src/panel/recall.ts`, built by
   `vite.config.panel.mts`).
   - **Rendering:** the same renderer.
   - **Font:** embedded as a `data:` URI. Where the host refuses it, which
     is the rule in VS Code (`src/vscode-extension/extension.ts`'s CSP has
     no `font-src`), the system math fonts take over.
   - **Size:** keep the panel's single-file size in check, since Temml loads
     lazily there too.
3. **Image segments.**
   - **Kernel:** `ImageSegment` validation checks that the hash exists among
     the token's `inline` media.
   - **Format check:** imports check magic bytes (PNG, JPEG, WebP, GIF) and
     the 256 KB cap after scaling.
   - **SVG is rasterized in the web view:** load it as an `<img>`, where
     scripts do not run, draw it to a canvas and export PNG. No new
     dependency.
   - **Tiles** ship images as `media/<sha256>.<ext>` beside the tile. The
     installer checks hash, type and size, then writes `media_assets` and
     `inline` rows.
   - **The attachment strip** (`renderReviewMedia` in `desktop/src/main.ts`
     and its Mobile counterpart) skips `inline` rows.

### Tests

- **Images:**
  - a renamed SVG with a `.png` name is refused;
  - an oversize image is refused;
  - a tile with an image installs it with an `inline` row;
  - the attachment strip skips it.
- **Mobile:** the renderer is imported without Node built-ins; the mobile
  build succeeds (`npm run build` in `mobile/`).

## Phase 9 — documentation and handover

1. **OKF**, written **through the `zam_okf_upsert` MCP tool**; never edit
   bundle files by hand.
   - **New article `card-text-segments.md`:**
     - segments and projections;
     - the inventory and the tokenizer;
     - the renderer and its output check;
     - speech and `alttext`;
     - the write path.
   - **Updates:**
     - `token-card-model.md`;
     - `voice-mode.md`;
     - `bridge-protocol.md` (the new payload fields, `bundled-tiles-reconcile`);
     - `mcp-surfaces.md` (the tool contracts);
     - `material-import.md` (lift and repair);
     - `local-card-file-import.md` (the Anki lift);
     - `mobile-standalone-libraries.md`;
     - `agent-trust-model.md` (the tokenizer as a boundary);
     - `learning-content.md` (the editor).
2. **Conventions.** Add one line to `CLAUDE.md` (Key conventions) and
   `AGENTS.md` (Hard rules):
   > Card text (ADR 2026-10-14b): question, concept and fast-check options
   > may hold segments (text, math, image). Write them only through
   > `writeCardText`. Never put LaTeX, Markdown or HTML into a text segment
   > or a title. A formula is allowlisted LaTeX with `speech`, and an image
   > needs `alt`.
3. **Knowledge map.** Add or adjust statements for the new modules, and run
   `knowledge-map validate --write`.
4. **ADR status.** Set ADR 2026-10-14b to `Implemented` or `Partially
   implemented` with a delivery note, and update its row in
   `docs/adr/README.md`.
5. **Release notes** (for the release PR's "What's new" and pitfalls):
   - formulas and spoken formulas;
   - team libraries need the administrator's migration and
     `zam team reinstall-tiles`;
   - `zam token reembed` after the tile migration.
6. **This plan.** Mark each phase with its commit hash. Delete the plan
   before the release that ships the feature, unless open tasks remain.

## Deliberately not in this plan

- **Formulas in model replies** (evaluation feedback, tutor dialogue): plain
  Unicode in version 1 (D6).
- **An SVG sanitizer.** SVG is rasterized instead (D5).
- **Speech drafted by the Speech Rule Engine** (ADR, Alternatives).
- **KaTeX as a second renderer.** Only if the Phase 3 gate fails, and then as
  its own owner decision.
- **mhchem (`\ce`)** and math-core. The corpus does not use `\ce`.
- **Speech generation for personal Anki imports.** It is optional and later.

## Pitfalls

- **Substance comparison.** `installKvtTile` writes nothing for an item whose
  substance is unchanged. Segment writes must sit outside that comparison
  (Phase 4), or added speech never arrives.
- **Materiality.** Every item the migration changes must declare
  `materiality: "cosmetic"` unless its meaning changed. Absent means
  `material` and re-tests every learner of that card.
- **Shared item ids.** Six ids appear in up to four Optik tiles. Any
  difference between their copies publishes a revision at every reinstall.
- **Fast-check index.** Converting options must not reorder them;
  `correct_index` stays valid.
- **Temml version.** 0.14.0 changes `\prescript` argument order. Keep the
  exact pin, and upgrade only with the corpus render test.
- **`throwOnError`.** With `false`, Temml renders the error in red instead of
  throwing, and the plain fallback never triggers.
- **Backslashes in text.** Windows paths are legitimate card text; only
  inventory control words outside a path count as LaTeX.
- **`$` in technical cards.** The lenient lift must leave `$HOME` and prices
  alone.
- **Team libraries.** Members run no DDL. Members see "update required"
  until the administrator migrates, and tiles change only through
  `zam team reinstall-tiles`.
- **Embeddings.** Each changed projection drops its embedding, so semantic
  search loses those tokens until the next `zam token reembed`.
- **Media cleanup.** `pruneOrphanedMediaAssets` must keep counting every
  `token_media` row. Never add a second link table.
- **Mobile bundle.** A Node built-in in the shared card-text modules breaks
  the WebView build.
- **Privacy.** Never name the field-test learner in code, commits, PRs or
  test data.
