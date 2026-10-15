# Card formulas, images and spoken text — implementation plan

**Status:** ADR accepted 2026-10-14; Phase 1 in progress on `feat/rich-card-text`.\
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

- [x] **Phase 1** — kernel: segment types, inventory, tokenizer, markup
  check, projections, converter — `dbb5a670`
- [x] **Phase 2** — schema and the one write path — `5c6e87f1`
- [x] **Phase 3** — Studio recall renders segments; voice speaks them;
  measurements — `ba3bf276` (WebKit and VoiceOver measurement open: owner)
- [x] **Phase 4** — tiles: segment fields, installer, `installed_tiles`,
  background reinstall, team step — `51209d5b`
- [ ] **Phase 5** — bundled tile migration (owner review gate) — `69520df1`,
  migrated and tested; owner gate open
  (`scripts/card-text-migration/review-sample.md`)
- [x] **Phase 6** — writers: prompts, tool contracts, `$` repair,
  placeholders — `c5e56ee8`
- [x] **Phase 7** — Anki formula lift and the Studio editor (D9) —
  `5ea17cd3`; editor not yet tried in a browser
- [x] **Phase 8** — Mobile, the MCP recall panel, image segments; device
  checks, the math font and SVG rasterising open
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

### As built (Phase 1)

- **Inventory = corpus + a reviewed supplement.**
  - **From the corpus:** 123 control words, 7 control symbols and exactly 4
    environments (`aligned`, `array`, `cases`, `pmatrix`).
  - **From the supplement:** the corpus misses everyday symbols a model
    writes for new cards (`\theta` never occurs), so
    `scripts/build-math-inventory.ts` adds a reviewed list of 90 standard
    commands and 6 control symbols. They complete the families the ADR
    names (Greek letters, operators, relations, arrows, functions,
    delimiters, one-argument fonts and accents), and nothing else.
  - **Environments** stay exactly the corpus's.
  - **Result:** 213 words, 13 symbols.
  - **The script** is TypeScript, run with `npx tsx`, so it reuses the
    kernel's lift. After `--write`, run `npx biome format --write` on the
    JSON.
- **Emphasis includes single `*…*` and `_…_`.** 163 bundled questions show
  single-star italics (`*'Ta-Ta-Ta'*`). Word-boundary edges keep `2*b*c`,
  `src/*.ts` and `snake_case` as text, and an underscore span that is an
  identifier (`__init__`) counts as code. This extends the ADR's wording of
  Decision 2 in its spirit: no Markdown in card text.
- **Converter conventions,** documented in `tex-plain.ts`:
  - **Spacing:** math spaces are insignificant, as in TeX, so the ADR's
    example renders as `W_el = ½CU²`. Relations and `+`/`-` get spaces; a
    product gets none.
  - **Subscripts:** letter subscripts stay `_el`.
  - **Dots:** a linear fraction next to a factor gets a `·` (`G·(M·m)/r²`,
    `1/LC·Q(t)`).
  - **Spacing after names:** functions and big operators put a space after
    their limits (`lim_(x→∞) f(x)`, `∑_(i=1)ⁿ i`).
- **The lift trims only spaces and newlines.** `trim()` had swallowed the
  tab that JSON made of `\t` in `\text`, which turned a damaged
  `ext{CH}_4` into a clean-looking formula.
- **Corpus facts for Phase 5:**
  - **Formulas:** 6,159 in all, 2,341 of them in questions; the longest has
    433 characters.
  - **Refused formulas:** in 14 fields.
    - **Seven** are the strings with tab or carriage-return damage.
    - **Four** carry unbalanced braces: one question (Trigonometrie J02)
      and three sample solutions.
    - **One** sample solution (Englisch Rhetorik J02) has a bare `&`
      outside an environment, which Temml refuses. The tokenizer has
      refused that since Phase 2.
    - **Two** sample solutions (Geographie 13 J02 and J04) write `\\lambda`
      and `\\text` for `\lambda` and `\text`. The tokenizer has refused a
      doubled backslash before a command name since Phase 3.

    They are listed as `KNOWN_DAMAGED` in `tests/kernel/card-text.test.ts`,
    and Phase 5 empties that list.
  - **Bare commands outside dollars:** 4 questions, 7 concepts, 9 options
    and 5 sample solutions, all in grade 11–13 tiles. Phase 5 patches the
    questions by hand. The concepts and options go into the ASCII-math
    worklist, because those fields are rewritten anyway.

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

### As built (Phase 2)

- **Migration M048, `CURRENT_SCHEMA_VERSION = 48`.**
  - **What it adds:** the token segment columns, `token_media.placement`
    (validated in code, no `CHECK`), `choice_distractors.text_segments` and
    `installed_tiles`.
  - **Where `installed_tiles` is classified:** as a snapshot table and as a
    team-library knowledge table (`team-provision.ts`).
  - **Tests:** `npm run pg:test` passes. It needs `npm run pg:up` first; on a
    Mac without Docker that is the Homebrew PostgreSQL 18.
- **`writeCardText`** (`src/kernel/library/card-text-store.ts`) is the only
  writer of a segment column.
  - **Images:** inline images must already be stored as PNG, JPEG, WebP or
    GIF. An SVG is refused here, because rasterising it is the importer's
    job (Phase 8).
  - **Reading back:** `parseStoredCardText` reads a column without ever
    throwing.
- **Revisions:** segments win. A plain `question`/`concept` passed beside
  segments is replaced by the projection, and `writeCardText` writes the
  plain column, so the embedding is dropped correctly.
- **The decompose action** (`token.ts`, the "block" branch that rewrites the
  original card) turns a segmented field plain when the learner changed its
  text. It is an explicit restructuring, not a silent edit.
- **Review payload.** Studio's `card` gains `questionSegments`,
  `conceptSegments`, `spokenQuestion` and `spokenConcept`, and so does the
  MCP batch payload. The protocol gains the optional `CardSegmentPayload`
  type and the matching optional fields.
- **Dynamic question variation skips segmented questions** until Phase 6
  brings placeholders. Without that, a model would rewrite the plain
  projection and lose the formulas.
- **Temml 0.13.5 is a root dev dependency** (exact pin), for the Phase 3
  output-check tests.

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

### As built (Phase 3)

- **Renderer modules.** `desktop/src/math-render.ts` (Temml, the options and
  the output check) and `desktop/src/card-text-render.ts` (segments into DOM
  nodes, progressive). `renderQuestionWithTopic` takes optional segments.
  - **What Studio renders as card text:** the question, the concept row of
    the reveal, and the fast-check buttons.
  - **Choice mode** still shows plain options; segment choices come with the
    presentation work in Phase 6.
- **Temml's real output decided the allowlist.** For the 6,147 clean corpus
  formulas, Temml writes `style` (spacing, borders, `math-depth`,
  `text-align`) and `class` (`tml-…`, `wbk-…`, `chr-…`, `mathcal`). The
  check allows exactly those properties and class names, and the test
  checks every corpus formula against it.
- **Fonts.** Phase 3 ships Temml's `Temml-Local.css` and `Temml.woff2`. That
  stylesheet uses the system math font: Cambria Math on Windows, STIX Two
  Math on macOS, Noto Sans Math where installed.
  - **Latin Modern Math is not bundled yet.** Committing the font file
    needs it downloaded from Temml's repository or GUST. That is the
    owner's call, not an unattended step.
  - **When it lands:** swap in `Temml-Latin-Modern.css` and commit the font
    with its GUST licence and SHA-256.
- **Studio bundle:** a lazy chunk of 204 KB (60 KB gzip), plus 5.6 KB CSS
  and a 9 KB font, loaded on the first formula. The recall panel inlines it
  (single-file build), which it needs from Phase 8 on.
- **Voice reads the spoken text** through the host's `currentCard`. The
  kernel loop needed no change: `question` and `expectedAnswer` simply
  carry `spokenQuestion` and `spokenConcept` when the card has segments.
- **Media placement.** `getTokenMedia` returns `placement`, and the
  attachment strip skips `inline` rows. Image segments look their asset up
  in the payload's media.
- **Two more tokenizer rules** came out of rendering the corpus:
  - a bare `&` outside an environment (Temml refuses it);
  - `\\name` outside a matrix, an escaping slip.

  Both are listed under the Phase 1 corpus facts.
- **Measurement gate: still open, and it needs the owner.**
  - **The page:** `desktop/dev/math-corpus.html` renders every unique corpus
    formula with the Studio's renderer and reports how many fell back. It
    is a dev-only page, not in the build.
  - **Start it** with `npm --prefix desktop run dev`, then open
    `http://localhost:1420/dev/math-corpus.html` in Safari (WebKit), and in
    Chrome or Edge for comparison. "Nur Rückfälle zeigen" lists the
    failures.
  - **VoiceOver on macOS** remains a manual check: does it read `alttext`,
    and can one navigate a fraction and a matrix?
  - **Why not done unattended:** the session's preview tool only starts
    servers from the main worktree's launch configuration, which this
    branch must not edit. Desktop control needs the owner's approval.

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

### As built (Phase 4)

- **Tile format.**
  - **Items:** `question_segments` and `concept_segments`; the plain
    `question`/`concept` may then be left out, and when given they must
    match the projection.
  - **Fast checks:** options may be segment lists; distractors may carry
    `segments`.
  - **Validation:** every tile segment is validated with
    `requireSpeech: true`.
  - **Readers that only need text** (material-import matching) use
    `kvtItemPlainTexts`.
- **Substance versus presentation.** The substance comparison reads plain
  projections. For fast checks it reads the options without
  `option_segments`, so a tile with no segments compares exactly as before.
  On every install the installer then calls `writeCardText` and updates the
  stored fast check. Both skip unchanged values, so an unchanged reinstall
  still touches no row (`updated_at` included).
- **`installed_tiles`.** A successful install upserts the row, but only when
  the version changed or a failure was recorded. A failed install records
  `failed_at`/`last_error` outside the rolled-back transaction, best effort.
- **`reconcileInstalledBundledTiles`.** A tile counts as installed when it
  is recorded, or when every one of its atoms and items is present. A single
  shared item is not enough: the Optik tiles share six items, and the first
  version reinstalled all four Optik tiles after one.
  - **Bridge:** `zam bridge bundled-tiles-reconcile --max 5`.
  - **Studio** calls it once per start, 20 s after load, and ignores
    errors.
  - **Team library:** the kernel refuses a PostgreSQL library unless called
    as `zam team reinstall-tiles` (administrator).

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

### As built (Phase 5)

- **One script instead of four.** `scripts/card-text-migration/migrate.ts`
  (run with `tsx`) does the lift, the merge and the worklist in one
  deterministic pass. Its inputs sit beside it and are reviewed in the diff:
  - **`patches.json`:** 15 patches. Eight repair the seven strings where
    JSON `\t`/`\r` ate a backslash. Four fix unbalanced braces, one escapes
    a bare `&`, and two undo a doubled backslash.
  - **`rewrites.txt`:** 135 whole-field rewrites. 27 are fields with a bare
    command (the plan counted four questions; concepts and options had more).
    The rest are the ASCII-math concepts and options, written as `$…$` TeX
    with `{,}` decimal commas. This file replaces the ASCII-math worklist.
  - **`speech.tsv`:** one reading per distinct learner-visible formula
    (`lang⇥tex⇥speech`, 1,753 lines).
- **Speech was not written by the content model.** No model was called from
  the implementing session. `speech-draft.ts` (rule-based, German) drafted
  all 1,753 readings. The coding agent then read every line and corrected
  694 of them: units, chemistry, vectors, point coordinates, ranges ("bis"),
  ratios ("zu"), genotypes, grammar productions and set notation. The owner
  review below covers the result.
- **Emphasis** is stripped across formula boundaries
  (`**Alkene ($C_nH_{2n}$)**`) and until none is left (`**,**` nested in
  `*…*`).
- **Sample solutions** are lifted to segments as well, so a tile has one
  format, but their formulas carry no speech: they are never installed.
- **Atom titles** become plain Unicode through `texToPlain`. `texToPlain` now
  keeps a star in a script (`p^*` → `p*`) instead of turning it into `·`.
- **Only rewritten items change:** 410 items in 186 tiles. They get
  `materiality: "cosmetic"` and the canonical key order; every other item
  stays byte for byte.
- **Repeatable.**
  - A fresh run from `main` reproduces the tiles byte for byte.
  - A second run changes nothing.
  - An unused patch, rewrite or speech line is an error.
- **Tile test** (`tests/kernel/bundled-tiles-card-text.test.ts`) covers the
  list above, with two adjustments:
  - **Projections:** a tile item stores either the plain field or segments,
    never both, so there is no stored projection to compare. The test asserts
    exactly one of the two, and that the derived projection carries no
    markup.
  - **Images:** `alt` is checked through `validateCardText`. No tile carries
    an image yet.

  It replaces the corpus test and its `KNOWN_DAMAGED` list in
  `card-text.test.ts`.
- **Speech lengths:**

  | median | p95 | p99 | max |
  |---|---|---|---|
  | 26 | 118 | 172 | 266 characters |

  The cap stays at 600. A model-written card near the 500-character TeX cap
  needs the room, and a lower cap buys nothing measurable.
- **Review material.** `diff-report.ts` writes:
  - one page per changed tile to the git-ignored `report/`: plain text
    before → after, each formula with its plain text and speech;
  - the committed `review-sample.md`: the 15 patches, eight rewrites,
    fractions, matrices, prescripts, reactions, the longest readings, and a
    spread per subject.
- **Owner gate: open.** Thomas's verdict on `review-sample.md` and the
  report goes here before the branch merges.

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

### As built (Phase 6)

- **One reader for writers' card text.** `readCardTextInput(value, mode)`
  (`src/kernel/library/card-text-input.ts`) takes a string or a segment
  list and returns the plain projection, segments when there is a formula,
  review notes, and the formulas still without speech.
  - **Repairs, in both modes:**
    - the lenient `$` lift;
    - emphasis dropped across formula boundaries (`dropEmphasis`, moved here
      from the migration);
    - a bare inventory command in text becomes Unicode (`\beta` → `β`);
    - backslashes a JSON escape ate are put back (`\f`+`rac` → `\frac`),
      only where the letters spell an inventory command.
  - **`agent` mode** returns a refused formula as an issue naming the
    segment. **`import` mode** keeps it as readable text (`texAsText`) and
    notes it.
  - **Images** are refused in both modes until Phase 8 attaches material.
- **Lenient lift fix.** A dollar now pairs only with the next one, so a
  formula never contains `$`. Before, `$HOME und $5 … $x^2$` became a
  single formula.
- **The rule.**
  - **`CARD_TEXT_RULE`** joins `CARD_SHAPE_RULES`. Its environment list
    comes from the inventory. Its example shows the JSON with doubled
    backslashes and says so: a model copying a single-backslash example
    would reproduce the tiles' `\t`-ate-`\text` damage.
  - **`PLAIN_FORMULA_RULE`** goes into the evaluation prompt and the
    generated-choice prompt.
  - **Imports.** `card-shape.ts` now imports the tokenizer, and its
    Mobile-bundle test checks that import chain instead of "no imports".
- **Material import.**
  - **Contract:** `question`/`answer` may be strings or segment lists. The
    parsed proposal keeps the plain text and adds `questionSegments`,
    `answerSegments` and `textNotes`. A staged batch re-parses to the same
    set.
  - **Harness path:** the staging reads the set in `agent` mode and refuses
    a formula without speech (`materialSpeechIssues`), naming
    `proposals[i].answer[j].speech`.
  - **Built-in path:** asks the answering text model once for missing
    speech (`src/cli/llm/speech-prompt.ts`, injectable as
    `deps.requestSpeech`). What is still missing stays empty.
  - **Commit:** through `createToken`. **Review list:** renders the
    segments and shows the notes (`material_text_notes`, en/de only).
- **Beyond the plan: every generated-card path.** The rule reaches the
  curriculum, topic, split and foundation prompts, so their parser had to
  accept segments.
  - **Parsing:** `parseGeneratedCardArray` reads both fields with
    `readCardTextInput(…, "import")`, and each generator asks once for
    missing speech (`withGeneratedSpeech`).
  - **Writing:** `createToken` takes `question_segments`/`concept_segments`
    and stores them through `writeCardText`. The four kernel writers (curriculum,
    split, foundations, source import) pass them through.
  - **Studio confirms:** split and foundation proposals keep their segments
    only while the learner has not edited that field; an edited field is
    plain again. The source and topic confirms pass them through as
    generated.
  - **Mobile's curriculum parser** stores the plain projection until Phase 8.
- **Agent tools.**
  - **`zam_add_token`** (and `bridge add-token`) take `questionSegments` /
    `conceptSegments`; `concept` becomes optional beside them.
  - **The OKF import tool** takes the same fields. Its update path writes
    segments through `writeCardText`, and a plain re-import clears a field's
    old segments first.
  - **Plain strings:** a formula in one is lifted. A refused formula, or a
    formula without speech, is an error that names the field and the
    segment and asks for segments.
  - **`zam_material_import`** takes a string or segments per side.
- **Variation and translation.**
  - **Kernel:** `toPlaceholderText` / `fromPlaceholderText`
    (`card-text-placeholders.ts`). Placeholders may move; a dropped,
    repeated or invented one, or markup in the reply, splices to `null`.
  - **Variation:** the review payload now carries the varied segments.
  - **Translation:** `translateQuestionSegmentsViaLLM` and `bridge
    translate-question --segments`. No Studio surface calls translation
    today, and Mobile's translator is Phase 8.
- **Known gap.** A learner who edits a varied segmented question in the
  review is refused by the kernel guard, as for any segmented field, until
  the Phase 7 editor.
- **Tests:**
  - `card-text-input.test.ts`, `material-card-text.test.ts`;
  - `card-text-writers.test.ts` (rule and example, placeholders, a scripted
    curriculum import with its speech follow-up, scripted variation and
    fallback);
  - additions to the staging, bridge-handler, dollar-lift and Mobile
    curriculum tests.

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

### As built (Phase 7)

- **Anki lift** (`src/cli/import/formula-lift.ts`).
  - **Before the HTML is made inert,** `holdFormulas` replaces every
    `\(…\)`, `\[…\]`, `[$]…[/$]`, `[$$]…[/$$]` and `[latex]…[/latex]` with a
    marker; tags and entities inside a formula are resolved. `[latex]`
    unwraps one `$`/`$$` pair.
  - **After sanitizing,** `restoreFormulas` turns the markers back into math
    segments and reads the side with `readCardTextInput(…, "import")`.
  - **A refused formula** becomes readable text (`texAsText`), not its
    source, and the card gets a `formula-kept-as-text` notice. Reason: a
    source formula beside a rendered one would fail the markup check, and
    raw TeX on a card is what this ADR removes.
  - **The sanitizer is unchanged** (an inline tag still becomes a space), so
    an unchanged source hashes as before.
  - **CSV/TSV imports** are not lifted; the plan names Anki only.
- **Kernel text import.**
  - **Cards** carry `questionSegments`/`answerSegments` and `unliftedText`,
    and new cards are written through `writeCardText`.
  - **Re-import:** when only the lift tells it from the last import, the
    preview marks the update `formulasOnly`. It is applied as a cosmetic
    revision, also to published content (D7), so cards imported before this
    phase get their formulas on their next re-import without anyone
    relearning them.
- **Studio editor** (`desktop/src/card-text-editor.ts`, under both fields).
  - **Default view:** the rendered side and each formula's spoken sentence.
  - **"Let the AI fix it":** one line, through the new read-only bridge
    command `card-text-fix` (in `STUDIO_BRIDGE_COMMANDS` and the reviewed
    list). The reply is read in `agent` mode, missing speech is asked for
    once, and the result is a preview to accept or discard.
  - **"Insert formula":** an empty math segment with a TeX field, a live
    preview and a speech field.
  - **Curators:** every formula's TeX and speech, and the text between them,
    behind a disclosure.
  - **The text area** is hidden in formula mode and holds the projection,
    so every existing check keeps working.
- **Saving.** `personal-card-create`, `personal-card-update` and
  `personal-card-publish-revision` take `--question-segments` /
  `--concept-segments`; `null` turns a side plain again. The bridge checks
  them first (`editedCardText`, `revisionSegments`) and returns the kernel's
  message. `personal-card-list` now returns the segments.
- **Kernel guard.** Its refusal now sends the learner to the card editor.
- **Not verified in a browser.** The browser pane serves only the main
  checkout, which this work does not touch.
  `desktop/dev/card-text-editor.html` shows the editor on a sample card
  with a scripted model reply (`npm --prefix desktop run dev`).
- **Tests:** a synthetic `.apkg` with `\(\frac{1}{2}\)`, `[$]…[/$]`,
  `[latex]` and a refused formula; kernel import create and lift-only
  re-import; the revision round trip and refusal; `card-text-fix` with a
  scripted model; the guard message.

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

### As built (Phase 8)

- **MCP recall panel.**
  - **Rendering:** question, fast-check options and the revealed answer go
    through the shared renderer.
  - **Size:** the single-file panel is 1.06 MB (308 KB gzip) with Temml
    inlined, as since Phase 3.
- **Mobile.**
  - **Rendering:** the review renders question, options and the revealed
    answer from segments.
  - **Voice** reads `spokenQuestion` / `spokenConcept`.
  - **Dependencies:** `temml` is pinned to `0.13.5` in `mobile/package.json`,
    and `mobile/src/css.d.ts` types the stylesheet import as the desktop
    does.
  - **Build:** `npm run typecheck` and `npm run build` in `mobile/` succeed.
    Temml is a lazy 204 KB chunk (60 KB gzip).
  - **Tiles:** the bundled tiles grew 15% minified with the Phase 5
    segments (2.91 → 3.35 MB).
  - **CSP** adds `img-src 'self' blob: data:`, `media-src 'self' blob:`
    and `font-src 'self' data:`. The app's own attachments are `blob:` URLs,
    which the old policy blocked.
  - **Editing:** a formula card is refused by the kernel guard on the phone,
    whose message points to the Studio's card editor.
- **Images.**
  - **The bytes decide:** `inline-image.ts` checks magic bytes (PNG, JPEG,
    WebP, GIF) and the 256 KB cap. `writeCardText` checks the stored bytes
    of every inline image, so a renamed SVG stays out.
  - **Tiles:** a tile declares `media: [{sha256, type}]`, and
    `installKvtTile(…, { media })` takes the bytes from the caller. It checks
    hash, type and size, then stores the asset before the items; their
    `inline` rows follow from `writeCardText`. A fast-check option may not
    show an image.
  - **The attachment strip:** `attachedMedia` in `card-text-render.ts`
    skips inline rows, and the Studio and Mobile share it.
- **Open, by design or for the owner:**
  - **Latin Modern Math is not bundled:** the download needs the owner's
    approval. Every surface uses the system math fonts through
    `Temml-Local.css`, and VS Code's CSP would refuse a font anyway.
  - **SVG rasterising is not built:** no writer accepts images yet (the
    readers refuse image segments), so it would have no caller. It comes
    with the first image writer.
  - **Bundled tiles:** the loader passes no media resolver. The first tile
    with images adds `media/` beside it and the resolver.
  - **Device checks:** Pixel 9, the field test's Pixel 6 (TalkBack) and the
    iPad simulator (VoiceOver) are open for the owner, under Open question 1.
- **Tests:**
  - `inline-images.test.ts` (formats, renamed SVG, oversize, tile install,
    refusals);
  - the strip filter in `card-text-render.test.ts`;
  - `tests/mobile/card-text-bundle.test.ts` (no Node built-in in the card-text
    import graph);
  - the source-shape tests follow the new calls.

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
