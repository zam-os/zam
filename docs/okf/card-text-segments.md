---
type: data-model
title: Card Text Segments
description: A card's question, answer and fast-check options may be a sequence of text, formula and image segments; the plain string stays as their derived projection, formulas are allowlisted LaTeX rendered to MathML on the device and read aloud by their speech, and one write path keeps both in step.
tags:
  - kernel
  - data-model
  - cards
  - accessibility
  - voice
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/card-text-segments.md"
timestamp: 2026-10-15T08:00:00.000Z
---

A card that needs a formula or a small picture stores its text as
**segments**. Plain cards stay plain strings; nothing changes for them.

# Segments and projections

Card text is a list of segments (`src/kernel/library/card-text.ts`):

- `{"type":"text","text":"…"}` — plain words. Never LaTeX, `$`, Markdown
  or HTML (`findPlainTextMarkup` names what it finds).
- `{"type":"math","tex":"…","speech":"…","block":true}` — a formula in
  restricted LaTeX, how it is read aloud, and whether it stands on its own
  line.
- `{"type":"image","media":"<sha256>","alt":"…","caption":"…","inline":true}`
  — an image from the media store with required alt text.

Three derived forms:

- **Plain projection** (`plainProjection`): text as written, each formula as
  deterministic plain Unicode (`texToPlain`: `W_el = ½CU²`), each image as
  its alt text. It is what search, embeddings, CLI, MCP text and LLM
  prompts see, and it fills the plain `question`/`concept` columns.
- **Spoken projection** (`spokenProjection`): text, each formula's
  `speech`, each image's alt. Voice mode speaks it.
- **Rendered**: the device turns the segments into DOM (below).

The projection is never authored; a formula that reads badly is a converter
fix.

# The inventory and the tokenizer

`math-inventory.json` freezes what `tex` may use: 213 control words, 13
control symbols and the environments `aligned`, `array`, `cases`,
`pmatrix`. `tokenizeTex` / `texIssues` (`tex-tokenizer.ts`) refuse
everything else and fail closed: forbidden commands (`\href`, `\def`, …),
unknown commands, unbalanced braces, comments (`%`), `#`, `$`, control
characters, a stray `&` outside an environment, and more than 500
characters. The tokenizer is a trust boundary: every write validates
through it before anything is stored or rendered.

# The renderer and its output check

Studio, the MCP recall panel and Mobile share `renderCardText`
(`desktop/src/card-text-render.ts`). It builds nodes and never parses a
string as HTML. Each formula first shows its plain form; Temml (pinned to
exactly 0.13.5, loaded lazily) then renders MathML with
`trust: false`, `throwOnError: true` and a small `maxExpand`. The result
must pass `isSafeMathTree` (an element, attribute, class and style
allowlist) or the plain form stays. Fonts are the system math fonts
(`Temml-Local.css`).

# Speech and alttext

`speech` is plain words in the card's language: no `\`, `$` or `<`, at most
600 characters (the bundled corpus's longest is 266). It goes into MathML's
own `alttext`; `<math>` gets no `aria-label`, so screen readers keep the
formula's structure. It is required for published content and every
model-written card; only a personal import without a model may leave it
empty, and voice then reads the plain projection.

# The write path

`writeCardText` (`card-text-store.ts`) is the only function that writes the
segment columns `tokens.question_segments` / `tokens.concept_segments`
(schema M048). It validates, derives and stores the plain projection with
the segments, skips unchanged values, drops the token's stale embedding
when the projection changed, and keeps `inline` `token_media` rows in step
with the image segments. A plain write to a field that has segments is
refused unless it echoes the stored projection (`assertPlainWriteAllowed`);
its message sends the learner to the card editor.

Images in card text are PNG, JPEG, WebP or GIF by their magic bytes and at
most 256 KB (`inline-image.ts`); a renamed SVG never enters. The attachment
strip skips `inline` rows (`attachedMedia`).

# Who writes segments

- **Bundled tiles** carry `question_segments` / `concept_segments` and
  segment fast-check options; their installer writes through
  `writeCardText`. Render-only changes are `materiality: "cosmetic"`.
- **Models and agents** read the segment contract from `CARD_TEXT_RULE`
  (part of `CARD_SHAPE_RULES`). `readCardTextInput` turns a string or a
  segment list into what is stored: it lifts `$…$` the lenient way, drops
  emphasis, repairs backslashes a JSON escape ate, and either names a
  refused formula (`agent`) or keeps it as readable text (`import`).
- **Variation and translation** work on `[[n]]` placeholders
  (`card-text-placeholders.ts`) and splice the stored formulas back.
- **Anki imports** lift Anki's math delimiters; see
  [local-card-file-import.md](local-card-file-import.md).
- **The Studio editor** lets a learner fix a card in words, insert a
  formula, or (for curators) edit TeX and speech; see
  [learning-content.md](learning-content.md).

# Citations
- [ADR 2026-10-14b — Formulas, Images and Spoken Text in Cards](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md)
- Code: `src/kernel/library/card-text.ts`, `src/kernel/library/tex-tokenizer.ts`, `src/kernel/library/tex-plain.ts`, `src/kernel/library/dollar-lift.ts`, `src/kernel/library/card-text-store.ts`, `src/kernel/library/card-text-input.ts`, `src/kernel/library/card-text-placeholders.ts`, `src/kernel/models/inline-image.ts`, `desktop/src/card-text-render.ts`, `desktop/src/math-render.ts`
- Tests: `tests/kernel/card-text.test.ts`, `tests/kernel/tex-tokenizer.test.ts`, `tests/kernel/tex-plain.test.ts`, `tests/kernel/card-text-store.test.ts`, `tests/kernel/card-text-input.test.ts`, `tests/kernel/bundled-tiles-card-text.test.ts`, `tests/desktop/math-render.test.ts`
