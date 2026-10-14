# Card Text Beyond Plain Strings: Formulas, Images and Spoken Text

**Status:** Proposed — revised after review round 1\
**Date:** 2026-10-14\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-05-31a](2026-05-31a-locale-aware-active-recall.md) (questions are
translated for the learner) ·
[2026-07-21](2026-07-21-android-companion-tauri-shell.md) (Android shell,
API 37 floor) ·
[2026-07-31](2026-07-31-cross-platform-voice-mode.md) (voice mode) ·
[2026-08-09](2026-08-09-free-offline-learning-and-anki-interoperability.md)
(Anki import, card media) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) (card text is written
`quality-first`) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) and
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md)
(knowledge tiles; content is rebuildable during the pilot) ·
[2026-09-04](2026-09-04-team-library-postgres-entra-pilot.md) (team
library: the administrator provisions) ·
[2026-09-08](2026-09-08-answer-points-and-score-based-rating.md) (answer
points) ·
[2026-09-27](2026-09-27-choice-and-auto-learning-modes.md) (fast checks and
choice options) ·
[2026-10-05](2026-10-05-learning-cards-from-photos-and-files.md) (cards
from photos and files) ·
[2026-10-08b](2026-10-08b-corporate-deployment-baseline.md) (agents and
library content are untrusted)

---

## Context

On 2026-10-14 a recall card in the Studio showed this question:

> Wie ändert sich die elektrische Feldenergie
> `$W_{\text{el}} = \frac{1}{2} C U^2$` eines aufgeladenen, von der
> Spannungsquelle getrennten Kondensators (`$Q = \text{konstant}$`), wenn
> der Plattenabstand `$d$` verdoppelt wird?

The question comes word for word from a bundled tile, *Physik 11: Das
elektrische Feld* (`tests/fixtures/curriculum/de-by-gymnasium-11-physik-…`).
The Studio renders card text as plain text on purpose: card text is never
parsed as HTML (`desktop/src/question-topic.ts`). No surface renders math.

**This is not a single card.** A scan of the 228 bundled tiles found the
following (counts as checked by both reviewers of round 1):

- **LaTeX in 281 of the 1,296 questions,** holding 2,341 formulas. 68 of
  them are fast checks, and 149 tiles carry LaTeX somewhere.
- **LaTeX in six atom titles.** They are copied onto the token's title, for
  example `$pK_s$-Wert` and `$\alpha$-Fehler`.
- **Markdown emphasis (`**…**`) in 287 questions.** It shows as raw
  asterisks.
- **ASCII math in reference answers and options.** One example is the option
  `a^2 = b^2 + c^2 - 2bc * cos(alpha)`. Powers written with a caret appear
  in 87 concepts and 30 fast-check options.
- **Seven strings broken by JSON escapes.** Each has a `\text`, `\to` or
  `\rightarrow` that JSON read as a tab or a carriage return. Two of them are
  questions; the visible result is a gap followed by `ext{CO}_2`. A math
  renderer would not fix these.
- **Another 3,810 formulas in `sample_solution`,** a field no code installs.

**Voice mode reads the raw string aloud.** The hands-free loop speaks
`card.question` (`src/kernel/recall/voice-review.ts`), so a learner hears
dollar signs and backslash commands.

**No writer prevents it either.** No card-writing prompt forbids LaTeX, and no
check rejects it. This covers the material import, the OKF import,
`zam_add_token`, the per-review question variation and translation. Models
write `$…$` almost by reflex for physics and mathematics.

**A plain-Unicode fix was considered first and set aside.** It meant
converting the tiles to `W_el = ½·C·U²`, rejecting LaTeX in card text and
adding a prompt rule. The owner asked for more than that:

- small images inside a card;
- a text to be read aloud for each of them and for each formula;
- the accessibility support modern apps are expected to have, which is also a
  gain for voice mode;
- possibly HTML, but nothing that can be attacked.

The owner also asked whether LaTeX is too expensive on mobile devices. This
ADR is the answer.

## Decisions

### 1. Card text is a sequence of typed segments; the plain string stays as its projection

A card's question and reference answer may hold an ordered list of
segments:

```json
[
  { "type": "text", "text": "Wie ändert sich die elektrische Feldenergie " },
  {
    "type": "math",
    "tex": "W_{\\text{el}} = \\frac{1}{2} C U^2",
    "speech": "W el gleich ein halb C U Quadrat"
  },
  { "type": "text", "text": ", wenn der Plattenabstand " },
  { "type": "math", "tex": "d", "speech": "d" },
  { "type": "text", "text": " verdoppelt wird?" }
]
```

- **Three segment types in version 1:** `text`, `math` and `image`.
- **Fields that carry segments:**
  - **Question and concept** (the concept is the reference answer): two
    nullable JSON columns, `tokens.question_segments` and
    `tokens.concept_segments`. `NULL` means a plain card, so no existing
    personal card has to migrate.
  - **Fast-check options:** an option is either a string, as today, or a
    segment list. `parseReviewFastCheck` (`src/kernel/scheduler/queue.ts`)
    learns segment options. Today it returns `null` for anything that is not
    a string, which would silently turn the card into an ordinary one.
  - **Curated choice distractors:** `choice_distractors` gains a
    `text_segments` column, and `text` keeps the projection.
- **Titles, domains and slugs stay plain strings.** The kernel checks them
  like a text segment (Decision 2). The six atom titles with LaTeX become
  plain Unicode, for example `pKₛ-Wert` and `α-Fehler`.
- **The plain columns stay and stay correct.** `question`, `concept`, an
  option's string and a distractor's `text` always hold the plain projection
  of the segments (Decision 4).
  - **One write function** writes both, and no surface writes either one by
    hand.
  - **A test** checks that every stored projection matches its segments.
  - **Unchanged readers:** every reader that only needs text keeps working.
    That is CLI, MCP text results, search, answer points and LLM prompts.
- **Embeddings follow the projection.** When a write changes a token's
  projection, it drops the token's stored embedding. The next embedding pass
  (`zam token reembed` today) recomputes it, and keyword search covers the
  gap.

### 2. No HTML, no Markdown and no inline delimiters in stored card text

- **A `text` segment, a title and every other plain field is plain text.**
  The kernel rejects three things in it:
  - LaTeX commands and `$…$` spans;
  - Markdown emphasis;
  - control characters other than the newline.

  Line-start `- ` list items stay, because answer points count them (ADR
  2026-09-08).
- **HTML exists only as output.** ZAM builds DOM nodes from the segments. No
  stored string is ever handed to `innerHTML`.
- **Why not Markdown with `$…$` math,** which models write naturally:
  - A `$` is ambiguous in ZAM's own technical cards (shell variables,
    prices).
  - Markdown has no slot for the text of a formula to be read aloud.
  - Markdown brings links and raw HTML, which would each need disabling.
  - Every consumer would have to parse it.

### 3. Formulas: restricted LaTeX in, MathML out, rendered on the device

- **Source:** `math.tex` is LaTeX math without delimiters. `block: true` marks
  a displayed formula.
- **The kernel validates it with a fail-closed tokenizer.** It needs no TeX
  parser and imports no renderer.
  - **Allowed:** a frozen inventory of control sequences and environments,
    checked into the repository. The allowlist and the tile test are both
    generated from that one file, so prose and test cannot drift.
  - **What the inventory covers:** the bundled corpus. That means
    fractions, roots, sub- and superscripts (including isotope prescripts
    such as `^4_2\text{He}`), Greek letters, operators, relations and arrows
    (including `\rightleftharpoons`). Also accents (`\vec`, `\bar`,
    `\overline`, `\dot`), `\text`/`\mathrm`/`\mathbf`, and the `matrix`,
    `pmatrix`, `cases`, `aligned` and `array` environments.
  - **Rejected:** every other control sequence. That includes, explicitly,
    macro definitions (`\def`, `\edef`, `\let`, `\newcommand`) and every
    command that reaches outside the formula (`\href`, `\url`,
    `\includegraphics`, `\html…`, `\class`, `\id`, `\style`, `\data`).
  - **Shape limits:**
    - at most 500 characters (the longest formula in the corpus has 433);
    - balanced braces;
    - no `$`;
    - no bare `%`, which comments out the rest of a TeX line, and no bare
      `#`, the macro-parameter token. The escaped `\%` and `\#` stay
      allowed.
- **Renderer:** [Temml](https://temml.org), which converts LaTeX to
  MathML Core.
  - **Pinned to an exact version, 0.13.5.** Version 0.14.0 (2026-10-07)
    changes the argument order of `\prescript`, and the tiles use isotope
    prescripts. An upgrade lands only after the corpus render test passes.
  - **Settings:** `trust: false`, `maxExpand` lowered to 100, a bounded
    `maxSize`, and `throwOnError: true`. With `throwOnError: false` Temml
    still returns output, only with the unknown command in red. ZAM wants
    the error, so it can catch it and show the formula's plain projection.
  - **The output is checked too.** Temml renders into a detached element.
    ZAM walks the resulting MathML against an element and attribute
    allowlist before it enters the document: no `href`, no event handlers,
    no `annotation-xml`. Anything outside the list falls back to the plain
    projection.
  - **Loading:** Temml is loaded lazily, on the first card that has a math
    segment.
- **Every surface already has a math engine.** ZAM's surfaces all run in web
  views that display MathML Core themselves:
  - Studio in WebKit on macOS and Linux and in WebView2 on Windows;
  - the Android app in the Chromium-based Android System WebView;
  - the iPadOS app in WKWebView;
  - the MCP recall panel in the host's web view.

  MathML Core shipped in Chromium 109 (January 2023), and Temml supports
  Chrome, Edge, Firefox and Safari. The renderer only translates; layout is
  the browser's.
- **WebKit is the weaker engine.** Browser-engine reports put Safari near
  73% of the MathML tests and Chrome near 95% (webstatus.dev, retrieved for
  review round 1). WebKit carries macOS and Linux Studio and the iPadOS app.
  Delivery 1 therefore renders the whole corpus on WebKit first.
- **The format does not bind the renderer.** If WebKit falls short, KaTeX's
  HTML output can replace Temml on that engine. No stored content changes.
- **Fonts:** Temml advises Latin Modern Math (about 380 KB), because Chromium
  renders system math fonts with bugs, plus `Temml.woff2` (about 10 KB).
  - **App-owned surfaces bundle them.** Studio, Android and iPadOS control
    their content security policy and serve both fonts from the app
    (`font-src 'self'`), never from a CDN.
  - **The MCP recall panel uses system math fonts.** The panel resource
    declares no CSP of its own, and the VS Code web view's policy
    (`default-src 'none'`) has no `font-src`.
- **Cost on a phone.** Temml's README gives about 174 KB of minified
  JavaScript and CSS for 0.13.5, plus the font. Rendering a formula costs
  milliseconds and no network, so the cost is download size, not
  computation. On ZAM's Android floor (API 37) it does not matter. That holds
  for the Pixel 9 reference device and for the oldest phone in the field
  test, a Pixel 6.
- **Why the tokenizer matters more than the renderer's defaults.** Temml is
  a fork of KaTeX, and KaTeX had five advisories in 2024 and 2025:
  - CVE-2024-28243 and CVE-2024-28244: `maxExpand` bypasses through macro
    definitions, which loop forever.
  - CVE-2024-28245: `\includegraphics`.
  - CVE-2024-28246: a `trust` protocol check that could be bypassed.
  - CVE-2025-23207: `\htmlData`.

  The script cases need `trust` to admit the command. The loops need macro
  definitions. The tokenizer rejects both before a renderer sees the
  formula, whatever `trust` says. Whether Temml 0.13.5 carries fixes
  equivalent to all five advisories was not confirmed, and the design does
  not rely on it.

### 4. Every formula and every image carries text to be read

- **`math.speech`** is how the formula is read aloud, in the card's language.
  - **Plain text:** no `\`, `$` or `<`.
  - **Who writes it:** the model that writes the card.
  - **Length cap:** fixed in delivery 1 from the longest speech generated
    for the corpus, because matrices read long. 600 characters until then.
  - **When it is required:** for anything published to a shared library
    (tiles, team library) and for every model-written card. Only a personal
    import without a connected model may leave it empty (Decision 8). Voice
    mode then reads the plain projection.
- **`image.alt`** is required, without exception.
- **Plain projection: always derived, never authored.** The kernel derives
  each formula's plain Unicode form from `tex` with a deterministic converter
  for the inventory, for example `W_el = ½·C·U²`.
  - **2D constructs are written linearly:** matrix rows become
    `[[a, b], [c, d]]`, and `cases` becomes its branches separated by
    semicolons.
  - **No author override,** for the same reason answer points are derived:
    a second stored artefact drifts. A formula that reads badly is a
    converter fix.
  - **Who sees it:** CLI, MCP, search, embeddings and LLM prompts.
- **Spoken projection.** The kernel builds it: text segments as written,
  formulas by `speech`, images by `alt`. Voice mode speaks it, and so does
  the answer comparison voice mode reads after a reveal.
- **Accessibility keeps the native MathML tree.**
  - **No accessible name on `<math>`.** An `aria-label` there would flatten
    the formula into one leaf. Screen-reader users would lose navigation
    through numerators, radicands and matrix cells.
  - **`speech` goes into MathML's own `alttext` attribute.** Whether a
    screen reader should also hear it as a description is measured
    (Open question 1).
  - **Images carry `alt`.**
  - **Reflow:** a block formula scrolls inside its own container, never the
    page.
  - **Resize:** MathML scales with the text size.
  - **Target:** WCAG 2.2 AA for card display. The harmonised EN 301 549
    (V3.2.1), which the European Accessibility Act and the German BFSG
    point to, references WCAG 2.1 AA, and 2.2 AA covers it. This ADR does
    not decide whether the BFSG applies to ZAM.

### 5. Images are segments from the media store, never links

- **One link to the media store.** A segment image is a `token_media` row,
  like an Anki attachment. That keeps a single link to `media_assets`, with
  its `ON DELETE RESTRICT`.
  - **Why not a link table of its own:** the existing orphan cleanup
    (`pruneOrphanedMediaAssets` in `src/kernel/import/text-import.ts`)
    would have deleted every image only that table referenced.
  - **A new `placement` column** holds `attached`, as today, or `inline`.
    The segment names its row by side and hash, the write function keeps
    rows and segments in step, and the attachment strip skips `inline` rows.
- **Fields:** `alt` is required, `caption` is optional, and `inline: true`
  sizes the image to the line, for a symbol or an icon.
- **Allowed formats:** PNG, JPEG, WebP or GIF, recognised by their magic
  bytes, so a renamed SVG cannot enter as a PNG.
  - **Size cap:** at most 256 KB after the import scales the image down.
    That is a new, tighter cap for images in the text; attachments keep the
    Anki cap of 20 MB.
  - **No SVG.** An SVG diagram is rasterized to PNG or WebP at import, under
    the same rules. A sanitizer would be a second parser for untrusted
    content.
- **No remote URL, ever.** Tiles ship their images as hashed files. The
  installer checks hash, type and size before it writes them.
- **The Android app needs an image source.** Its policy has no `img-src`
  (`mobile/src-tauri/tauri.conf.json`), so `data:` and `blob:` images do not
  load there today. Delivery 4 adds the source the app's own images use.

### 6. Models read and write segments; the kernel validates every write

- **Card-writing prompts state the segment contract:**
  - formulas as `math` segments with `speech`;
  - images only from attached material;
  - never LaTeX or Markdown in a `text` segment.

  Each prompt carries a short example. The rule joins `CARD_SHAPE_RULES`,
  which already reaches the curriculum, material and OKF prompts.
  `zam_add_token`'s contract and the variation and translation prompts get
  it on their own.
- **Agent tools fail loudly.** An invalid segment returns a validation error
  that names the segment, and the agent retries. The tools stay safe to
  auto-approve: they only validate and write.
- **The learner's built-in import never fails over a formula.** It lifts a
  `$…$` left in a text segment into a math segment, but only when the span
  looks like math: a control sequence, `^`, `_` or `=`, or digits with
  operators. `$HOME` and a price stay text and are marked in the review
  list, where the learner decides. The import asks the model only for
  missing `speech`. A dead end is not an option (Product principle: degrade
  gracefully).
- **Variation and translation never see `tex` or an image hash.** The model
  gets the text with numbered placeholders and each formula's speech. It
  returns the text with the same placeholders, and translation also returns
  the speech. The kernel splices the stored formulas and images back in. A
  missing or duplicated placeholder serves the stored question. Asking the
  model to echo `tex` instead would lose the variation whenever it tidies a
  space.
- **Evaluation stays plain.** The evaluator and the generated choice options
  work on the plain projection and are told to answer in plain Unicode.
  Evaluation feedback and tutor dialogue are not cards. They stay plain text
  in version 1.

### 7. Render-only changes are cosmetic, and enrolled learners receive them

- **What counts as cosmetic.** The bundled migration declares
  `materiality: "cosmetic"` for:
  - lifting existing LaTeX into segments;
  - adding `speech` or `alt`;
  - dropping Markdown emphasis;
  - the seven escape patches. The prompt was broken, not different
    knowledge, so the learner's FSRS state stays.
  - the content model's rewrite of ASCII math in concepts and options, which
    is reviewed in the pull request's diff.

  An item whose rewrite changes what it asks is declared `material` on its
  own and re-tests its learners.
- **Today a fixed tile reaches only new enrolments.** `installKvtTile` runs
  only when someone enrols, so a learner who is already enrolled misses every
  fix. A table `installed_tiles(tile_id, version)` changes that.
- **On a personal library, a background pass reinstalls changed tiles.**
  - **It never blocks the start.** It runs after the start, tile by tile, and
    resumes where it stopped. On a remote Turso database each tile costs many
    round trips.
  - **It touches only installed tiles.** It reinstalls those whose version
    differs from the table, and a tile with installed items but no row yet
    counts as changed once.
  - **It is safe to repeat.** The installer is idempotent and revises only
    the items that changed.
- **On a team library the administrator publishes.** Members run no DDL, and
  an app update must not be what publishes curriculum into a school library.
  The reinstall is an administrator step, beside `zam team provision`.

### 8. Bundled tiles migrate to segments, not to Unicode

- **The LaTeX in the tiles is source, not waste.** A deterministic pass lifts
  `$…$` into math segments and `$$…$$` into block math segments, and drops
  Markdown emphasis from the text.
- **The seven broken strings get explicit patches,** reviewed in the diff
  before the lift. A pattern cannot repair them: a tab followed by `o` was
  `\to` in the Physik 11 question, but could as well have been `\times`,
  `\tau` or `\theta`.
- **The six atom titles become plain Unicode** (Decision 1).
- **ASCII math becomes math segments.** This covers 87 concepts and 30
  options. The content model writes them `quality-first`, and the change is
  reviewed in the pull request's diff.
- **Speech for every learner-visible formula comes from the content model.**
  Thomas reviews a sample stratified by subject and by kind of formula before
  the tiles merge.
- **`sample_solution` gets only the lift and the patches,** so a tile has one
  format. No code installs the field, so its 3,810 formulas need no speech
  and stay out of the owner's sample.
- **A test validates every bundled tile:**
  - no markup in text segments or titles;
  - every formula inside the inventory;
  - every learner-visible formula with `speech`;
  - every image with `alt`.

  The raw originals stay in git history.
- **The Anki import lifts formulas the same way.** MathJax `\(…\)` and
  `\[…\]` and Anki's `[$]…[/$]` and `[latex]…[/latex]` fragments become
  math segments. A connected content model adds `speech`; without one the
  formula keeps no speech (Decision 4).

### 9. A pupil edits words, not TeX

- **The Studio editor shows the rendered formula and its spoken sentence.**
- **The default edit is "let the model fix it",** with a short instruction
  in the learner's words.
- **A TeX field and a speech field sit behind a disclosure,** for curators.
  They are not on the default path.

This follows the simplicity principle in `CLAUDE.md`: a pupil who has never
seen LaTeX must still be able to correct a card.

## Consequences

**Easier**

- **Formulas look like formulas** on every surface, at any text size.
- **Voice mode reads them as words,** in the card's language.
- **Screen readers keep structure.** They can navigate each formula, and
  each formula and image carries its text.
- **Cards can carry small images,** without a remote URL and without HTML.
- **Readers that need plain text are untouched.** Search, CLI, MCP and
  answer points read the plain columns as today.
- **No raw markup can return quietly.** The kernel blocks every model-written
  card with raw markup, as it does every bundled tile.

**Harder**

- **Two parallel representations per formula.** Models write `tex` and
  `speech`, and the kernel derives the third. A curator who edits by hand
  must keep two fields apart.
- **Every app-owned web surface ships a renderer and a font,** about half a
  megabyte, loaded lazily.
- **Schema change:** two token columns, `choice_distractors.text_segments`,
  `token_media.placement` and the `installed_tiles` table. That means an
  M-series migration and a `CURRENT_SCHEMA_VERSION` bump. A team library
  gets it from the administrator.
- **Writes are checked more strictly.** An agent that writes LaTeX into text
  is refused and has to retry.
- **Variation and translation work with placeholders.** A model that drops
  or doubles one loses its variation for that review.
- **WebKit decides the renderer.** If its MathML Core rendering falls short,
  Studio on macOS and the iPadOS app need KaTeX's HTML output as a second
  renderer.

**Unchanged**

- Personal cards without segments, and every surface's plain-text path.
- FSRS state, review logs and the revision contract (ADR 2026-08-14).
- The trust model: no tool argument or library content reaches the DOM
  except through ZAM's own renderer, and its output is checked.

## Alternatives considered

- **Plain Unicode only.** This was the short-term fix proposed first.
  Rejected as the end state: fractions, roots and matrices lose their
  structure, and there is no slot for speech or images. It survives as the
  plain projection (Decision 4).
- **Stored, sanitized HTML.** Rejected:
  - it contradicts ADR 2026-10-08b;
  - sanitizers have a long bypass history;
  - every plain-text reader would have to strip it.
- **Markdown with `$…$` math.** Rejected; see Decision 2.
- **KaTeX.** Mature and fast, but larger: about 280 KB of JavaScript and CSS
  in Temml's comparison table, plus its own font set. Its main output is HTML
  spans, with the MathML as a hidden accessibility layer. It stays the
  fallback renderer for WebKit (Decision 3).
- **MathJax with its Speech Rule Engine.** It brings automatic speech,
  German included since SRE 3.1, at a much larger size. Rejected as the
  renderer. The Speech Rule Engine stays a candidate for imports without a
  content model.
- **math-core, a LaTeX-to-MathML Core converter in Rust.** It would let the
  Tauri backend validate and convert natively. It is still in development
  and lacks part of KaTeX's commands. To revisit.
- **Formulas rendered to images at authoring time.** No runtime renderer,
  but no reflow, no scaling with the text size and no structure for screen
  readers, and an alt text is still needed. Rejected.
- **Automatic speech only (SRE or MathCAT).** No authoring cost, but German
  school notation reads less naturally. MathCAT's German is a 2025
  translation, with a German-focused fork started the same summer. Kept as a
  fallback, not as the rule.
- **A link table for segment images** (the first draft of Decision 5).
  Rejected in review round 1: the existing orphan cleanup counts only
  `token_media` and would delete those images.
- **Asking variation and translation to echo `tex` unchanged** (the first
  draft of Decision 6). Rejected in review round 1 in favour of placeholders.

## Open questions

1. **What screen readers do with it.** The question is whether `alttext`
   reaches VoiceOver (macOS, iPadOS), NVDA (Windows) and TalkBack (Android),
   whether `speech` should also be a description, and whether MathML
   navigation is usable in each engine. How TalkBack announces MathML in
   Android System WebView is unverified. Delivery 1 measures macOS;
   later deliveries measure the other platforms.
2. **WebKit rendering quality.** Delivery 1 renders the corpus on WebKit with
   Latin Modern. What threshold makes KaTeX's HTML output the renderer there?

## Delivery

One branch and one PR after this ADR is accepted, with one commit per
delivery:

1. **Kernel and Studio recall.**
   - **Kernel:** segment types, the frozen inventory and the tokenizer, the
     plain and spoken projections and the Unicode converter; the M-series
     migration and the one write function; tests, including
     projection-matches-segments.
   - **Studio recall:** renders segments with Temml pinned at 0.13.5,
     loaded lazily, with the output check and the bundled font. Voice mode
     speaks the spoken projection.
   - **Measurements:** the corpus render on WebKit and the macOS screen
     reader (Open questions 1 and 2).
   - **Conventions:** the card-text rule joins `CLAUDE.md` and `AGENTS.md`.
2. **Tiles.**
   - The tile fields for segments, `installed_tiles` and the background
     reinstall, and the administrator step for team libraries.
   - The bundled-tile migration (Decision 8), with its explicit patches.
   - The validation test over every tile, and embeddings dropped with each
     changed projection.
3. **Writers.**
   - The segment contract in every card-writing prompt and tool: both
     material paths, the OKF import and `zam_add_token`.
   - Placeholders for variation and translation.
   - The narrow `$` repair, the Anki import's formula lift, and the Studio
     editor (Decision 9).
4. **Other surfaces and images.**
   - The Android and iPadOS apps; the Android `img-src`.
   - The MCP recall panel with system math fonts.
   - Image segments with `placement`, rasterized SVG and tile media.

Each delivery updates the OKF articles and the knowledge map statements it
touches, in the same commit.

## Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-14 | Proposed | Raw LaTeX found on a bundled Physik 11 card, and in 281 of 1,296 bundled questions. The owner asked for a flexible long-term solution instead of the plain-Unicode fix: small images, text to be read aloud, accessibility support, a gain for voice mode, and nothing that can be attacked. |
| 2026-10-14 | Proposed | Revised after review round 1 (Gemini 3.8 Flash, Grok 4.7). Both reviewers agreed with all eight decisions (Gemini with reservations on four, Grok on six), and every finding was adopted. Segment images use `token_media` with a `placement` column, because the orphan cleanup would otherwise delete them. The background reinstall never blocks the start, and the team library's administrator publishes. Fast-check options, distractors and titles each get a defined form, and embeddings follow the projection. The allowlist became a fail-closed tokenizer over a frozen inventory: `%` and `#` rejected, `aligned` and `array` added, a 500-character cap. Temml is pinned with `throwOnError: true`, and its MathML output is checked. WebKit is named the weaker engine. `speech` goes into `alttext` instead of an accessible name, and the derived plain form has no override. Variation and translation use placeholders, and the `$` repair is narrowed. The seven strings get explicit patches, and `sample_solution` needs no speech. Open questions 2–6 were decided: the panel uses system fonts, a pupil edits words (Decision 9), model replies stay plain, there is no SVG, and no override. Corrected: the Android reference device is the Pixel 9, the field test's oldest phone is a Pixel 6, and the counts are 281 and 68. MiMo's review is pending. |
