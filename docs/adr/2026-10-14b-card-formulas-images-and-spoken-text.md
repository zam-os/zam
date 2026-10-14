# Card Text Beyond Plain Strings: Formulas, Images and Spoken Text

**Status:** Proposed\
**Date:** 2026-10-14\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-05-31a](2026-05-31a-locale-aware-active-recall.md) (questions are
translated for the learner) ·
[2026-07-31](2026-07-31-cross-platform-voice-mode.md) (voice mode) ·
[2026-08-09](2026-08-09-free-offline-learning-and-anki-interoperability.md)
(Anki import, card media) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) (card text is written
`quality-first`) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) and
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md)
(knowledge tiles; content is rebuildable during the pilot) ·
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

**This is not a single card.** A scan of the 228 bundled tiles found:

- **LaTeX in 280 of the 1,296 questions.** 67 of them are fast checks, and
  149 tiles carry LaTeX somewhere.
- **Markdown emphasis (`**…**`) in 287 questions.** It shows as raw
  asterisks.
- **ASCII math in reference answers and options.** An example is
  `a^2 = b^2 + c^2 - 2*b*c*cos(alpha)`. Powers written with a caret appear
  in 87 concepts and 30 fast-check options.
- **Seven strings broken by JSON escapes.** Each has a `\text`, `\to` or
  `\rightarrow` that JSON read as a tab or a carriage return. Two of them are
  questions; the visible result is a gap followed by `ext{CO}_2`. A math
  renderer would not fix these.

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
  - the question;
  - the concept, which is the reference answer;
  - fast-check options;
  - curated choice distractors.

  Titles, domains and slugs stay plain strings.
- **Storage:** two nullable JSON columns, `tokens.question_segments` and
  `tokens.concept_segments`. A fast-check option is either a string, as
  today, or a segment list. `NULL` means a plain card, so no existing
  personal card has to migrate.
- **The plain columns stay and stay correct.** `question` and `concept` always
  hold the plain projection of the segments (Decision 4). The kernel writes
  both through one function; no surface writes either one by hand. Every
  reader that only needs text therefore keeps working unchanged: CLI, MCP
  text results, embeddings and search, answer points, LLM prompts.

### 2. No HTML, no Markdown and no inline delimiters in stored card text

- **A `text` segment is plain text.** The kernel rejects three things in it:
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

- **Source:** `math.tex` is LaTeX math from an allowlist, without delimiters.
  `block: true` marks a displayed formula.
  - **The allowlist is derived from the bundled corpus.** It covers
    fractions, roots, sub- and superscripts (including isotope prescripts
    such as `^4_2\text{He}`), Greek letters, operators, relations, arrows
    including `\rightleftharpoons`, accents (`\vec`, `\bar`, `\overline`,
    `\dot`), `\text`/`\mathrm`/`\mathbf`, and the `matrix`, `pmatrix` and
    `cases` environments.
  - **Always rejected:** macro definitions (`\def`, `\edef`, `\let`,
    `\newcommand`) and every command that reaches outside the formula
    (`\href`, `\url`, `\includegraphics`, `\html…`, `\class`, `\id`,
    `\style`, `\data`).
  - **Shape limits:** at most 400 characters, balanced braces, no `$`.
- **Renderer:** [Temml](https://temml.org), which converts LaTeX to
  MathML Core.
  - **Settings:** `trust: false`, `maxExpand` lowered to 100, a bounded
    `maxSize`, and `throwOnError: false`.
  - **Failure:** a formula that fails to render shows its plain projection.
  - **Loading:** Temml is loaded lazily, on the first card that has a math
    segment.
- **Every surface already has a math engine.** ZAM's surfaces all run in web
  views that display MathML Core themselves:
  - Studio in WebKit on macOS and Linux and in WebView2 on Windows;
  - the Android app in Android System WebView;
  - the iPadOS app in WKWebView;
  - the MCP recall panel in the host's web view (Chromium in Claude Desktop
    and VS Code).

  MathML Core shipped in Chromium 109 (January 2023), and Temml supports
  Chrome, Edge, Firefox and Safari. The renderer only translates; layout is
  the browser's.
- **Cost on a phone:** about 174 KB of minified JavaScript and CSS (Temml
  0.13.5), plus a math font. Temml advises Latin Modern Math (about 380 KB)
  because Chromium renders system math fonts with bugs. ZAM bundles that font
  and its small companion `Temml.woff2` (about 10 KB) and serves them from
  the app (`font-src 'self'`), never from a CDN. Rendering a formula costs
  milliseconds and no network. The cost is download size, not computation.
  On ZAM's Android floor (API 37, Pixel 6) neither matters.
- **Why the allowlist matters more than the renderer's defaults.** Temml is
  a fork of KaTeX, and KaTeX had five advisories in 2024 and 2025:
  - CVE-2024-28243 and CVE-2024-28244: `maxExpand` bypasses that loop
    forever.
  - CVE-2024-28245: `\includegraphics`.
  - CVE-2024-28246: a `trust` protocol check that could be bypassed.
  - CVE-2025-23207: `\htmlData`.

  The script cases needed `trust` to admit the command, and the loops did
  not. The kernel's allowlist rejects every such command before a renderer
  sees the formula, whatever `trust` says.

### 4. Every formula and every image carries text to be read

- **`math.speech`** is how the formula is read aloud, in the card's language:
  - plain text, at most 300 characters;
  - written by the model that writes the card;
  - required for anything published to a shared library (tiles, team
    library) and for every model-written card. Only a personal import without
    a connected model may leave it empty (Decision 8). Voice mode then reads
    the plain projection.
- **`image.alt`** is required, without exception.
- **Plain projection: `math.text`** is the formula as plain Unicode, such as
  `W_el = ½·C·U²`. It is optional. When absent, the kernel derives it from
  `tex` with a deterministic converter for the allowlisted commands. This is
  what CLI, MCP, search, embeddings and LLM prompts see.
- **Spoken projection.** Voice mode speaks text segments as written, formulas
  by `speech`, and images by `alt`. The same applies to the answer
  comparison it speaks after a reveal.
- **Accessibility.** The `<math>` element exposes the formula's structure.
  The authored `speech` becomes its accessible name (Open question 1), and
  images carry `alt`.
  - **Reflow:** a block formula scrolls inside its own container, never the
    page.
  - **Resize:** MathML scales with the text size.
  - **Target:** WCAG 2.2 AA for card display. EN 301 549, which the European
    Accessibility Act and the German BFSG point to, references WCAG 2.1 AA,
    and 2.2 AA covers it. This ADR does not decide whether the BFSG applies
    to ZAM.

### 5. Images are segments from the media store, never links

- **What a segment references.** An `image` segment names an asset in
  `media_assets` by its hash, the store Anki media already uses.
  - **Fields:** `alt` is required, `caption` is optional, and
    `inline: true` sizes the image to the line, for a symbol or an icon.
  - **Link table:** the write function keeps `token_segment_media(token_id,
    asset_hash)` current, so an asset in use cannot be deleted.
- **Allowed formats:** PNG, JPEG, WebP or GIF, at most 256 KB after the
  import scales the image down. SVG stays out of version 1 (Open
  question 5).
- **No remote URL, ever.** Tiles ship their images as hashed files. The
  installer checks hash, type and size before it writes them.

### 6. Models read and write segments; the kernel validates every write

- **Card-writing prompts state the segment contract:**
  - formulas as `math` segments with `speech`;
  - images only from attached material;
  - never LaTeX or Markdown in a `text` segment.

  This covers the material import on both paths, the OKF import,
  `zam_add_token` and the per-review question variation. The rule joins
  `CARD_SHAPE_RULES`, so every card prompt carries it.
- **Agent tools fail loudly.** An invalid segment returns a validation error
  that names the segment, and the agent retries. The tools stay safe to
  auto-approve: they only validate and write.
- **The learner's built-in import never fails over a formula.** It repairs a
  `$…$` left in a text segment by lifting it into a math segment, and asks
  the model only for the missing `speech`. A card it cannot repair is marked
  in the review list, where the learner decides. A dead end is not an option
  (Product principle: degrade gracefully).
- **Variation and translation keep the formula.** They may rewrite `text`,
  `speech`, `alt` and `caption`, but every `tex` and every image hash must
  come back unchanged. The kernel compares them and serves the stored
  question when they differ.
- **Evaluation stays plain.** The evaluator and the generated choice options
  work on the plain projection and are told to answer in plain Unicode. Model
  replies are not rendered as segments in version 1 (Open question 4).

### 7. A render-only change is cosmetic, and enrolled learners receive it

- **No learner is re-tested.** The following leave the substance alone, and
  the tile declares `materiality: "cosmetic"`:
  - lifting existing LaTeX into segments;
  - adding `speech` or `alt`;
  - repairing a mangled escape.
- **Today a fixed tile reaches only new enrolments.** `installKvtTile` runs
  only when someone enrols. A table `installed_tiles(tile_id, version)` lets
  the first start after an update reinstall exactly the bundled tiles whose
  version changed. The installer is already idempotent and revises only the
  items that changed.

### 8. Bundled tiles migrate to segments, not to Unicode

- **The LaTeX in the tiles is source, not waste.** A deterministic pass lifts
  `$…$` into math segments and `$$…$$` into block math segments.
  - **Escapes first:** before the lift it repairs the seven mangled strings
    from their context, for example a tab before `ext{` becomes `\text{`.
  - **Emphasis:** it drops Markdown emphasis from the text.
- **ASCII math becomes math segments.** This covers 87 concepts and 30
  options. The content model writes them `quality-first`, and the change is
  reviewed in the pull request's diff.
- **Speech for every formula comes from the content model.** Thomas reviews
  a sample before the tiles merge.
- **`sample_solution` converts in the same pass.** No code installs it
  today; converting it keeps each tile in one format.
- **A test validates every bundled tile:**
  - no markup in text segments;
  - every formula inside the allowlist;
  - every formula with `speech`;
  - every image with `alt`.

  The raw originals stay in git history.
- **The Anki import lifts formulas the same way.** MathJax `\(…\)` and
  `\[…\]` and Anki's `[$]…[/$]` and `[latex]…[/latex]` fragments become
  math segments. A connected content model adds `speech`; without one the
  formula keeps no speech (Decision 4).

## Consequences

**Easier**

- **Formulas look like formulas** on every surface, at any text size.
- **Voice mode reads them as words,** in the card's language.
- **Screen readers get structure.** Each formula carries its own spoken text,
  and each image carries alt text.
- **Cards can carry small images,** without a remote URL and without HTML.
- **Readers that need plain text are untouched.** Search, embeddings, CLI,
  MCP and answer points read the plain columns exactly as today.
- **No raw markup can return quietly.** The kernel blocks every model-written
  card with raw markup, as it does every bundled tile.

**Harder**

- **A formula has up to three faces:** `tex`, `speech` and `text`. Models
  write two of them, and a person editing in the Studio must keep them
  apart (Open question 3).
- **Every web surface ships a renderer and a font,** about half a megabyte,
  loaded lazily.
- **Schema change:** two token columns, a link table and the
  `installed_tiles` table. That means an M-series migration and a
  `CURRENT_SCHEMA_VERSION` bump.
- **Writes are checked more strictly.** An agent that writes LaTeX into text
  is refused and has to retry.
- **Variation and translation must preserve each `tex` exactly.** A model
  that rewrites a formula loses its variation for that review.

**Unchanged**

- Personal cards without segments, and every surface's plain-text path.
- FSRS state, review logs and the revision contract (ADR 2026-08-14).
- The trust model: no tool argument or library content reaches the DOM
  except through ZAM's own renderer.

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
  plus its own font set. Its main output is HTML spans, with the MathML as a
  hidden accessibility layer. It stays the fallback if Temml's rendering
  disappoints on a device.
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
  school notation reads less naturally. MathCAT's German is a fork that
  started in 2025. Kept as a fallback, not as the rule.

## Open questions

1. **Accessible name or native navigation?** Authored `speech` as the
   `<math>` element's accessible name gives one consistent reading. It may,
   however, hide MathML navigation from screen-reader users who rely on it.
   Delivery 1 tests VoiceOver (macOS, iPadOS), NVDA (Windows) and TalkBack
   (Android). How TalkBack announces MathML in Android WebView is unverified.
2. **The MCP recall panel's font.** The host sets the panel's content
   security policy. Can it load a bundled font (a `data:` URI in the
   single-file panel), or does the panel fall back to system math fonts?
3. **Editing a formula in the Studio.** The proposal is a preview with two
   fields, the formula and its spoken text, plus "let the model fix it". Is
   that simple enough for a pupil who has never seen LaTeX?
4. **Formulas in model replies.** Evaluation feedback and tutor dialogue stay
   plain Unicode in version 1. Should they later return segments too?
5. **SVG diagrams.** They are valuable for geometry and physics. Admitting
   them needs a sanitizer or a rasterizing import step.
6. **Does `math.text` need an author override at all,** or is the derived
   form always good enough?

## Delivery

One branch and one PR after this ADR is accepted, with one commit per
delivery:

1. **Kernel and Studio recall.**
   - **Kernel:** segment types, the validator with its allowlist, the plain
     and spoken projections and the Unicode converter; the M-series
     migration and the one write function; tests.
   - **Studio recall:** renders segments with lazily loaded Temml and the
     bundled font, and voice mode speaks the spoken projection.
   - Open question 1 is tested on macOS.
   - The card-text rule joins `CLAUDE.md` and `AGENTS.md`.
2. **Tiles.** The tile fields for segments; `installed_tiles` and the
   update-time reinstall; the bundled-tile migration (Decision 8); and the
   validation test over every tile.
3. **Writers.** The segment contract in every card-writing prompt and tool:
   both material paths, the OKF import, `zam_add_token`, variation and
   translation. Also the Anki import's formula lift.
4. **Other surfaces and images.** The Android and iPadOS apps, the MCP recall
   panel, image segments and tile media.

Each delivery updates the OKF articles and the knowledge map statements it
touches, in the same commit.

## Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-14 | Proposed | Raw LaTeX found on a bundled Physik 11 card, and in 280 of 1,296 bundled questions. The owner asked for a flexible long-term solution instead of the plain-Unicode fix: small images, text to be read aloud, accessibility support, a gain for voice mode, and nothing that can be attacked. |
