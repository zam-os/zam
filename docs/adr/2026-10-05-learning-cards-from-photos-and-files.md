# Learning Cards from Photos and Files: The Model Reads the Page

**Status:** Proposed\
**Date:** 2026-10-05\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-06-30](2026-06-30-learning-content-studio.md) (Phase 5) ·
[2026-07-04](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) (draft; Decisions 1 and 3 adopted in Decision 7) ·
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-07-12a](2026-07-12a-agent-backed-ai-provider.md) ·
[2026-07-18](2026-07-18-okf-learning-import.md) ·
[2026-07-18c](2026-07-18c-okf-import-handoff.md) ·
[2026-07-24](2026-07-24-first-run-onboarding.md) (Decision 3) ·
[2026-07-25](2026-07-25-shared-curated-learning-content.md) (Decision 5) ·
[2026-08-08](2026-08-08-ios-standalone-app.md) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decisions 6, 9) ·
[2026-09-13](2026-09-13-model-capabilities-are-detected.md) ·
[2026-10-02](2026-10-02-library-topics.md) ·
[flashcard quality RFC](../concepts/flashcard-generation-and-decomposition-strategy.md)

> **Revision after review round 1** (Grok 4.7 and Gemini, PR #384). Both
> reviewed the first version, before the harness path was added. Grok's
> finding that the first version contradicted itself about a missing image
> model was already resolved by that addition. Changes:
>
> - Proposals marked `completed` get no preset; the first version preset them
>   to Yes. They are the model's additions, and the page is gone after the
>   import (Decision 5).
> - A library match no longer replaces the proposal. It stands beside it, and
>   the learner can keep their own wording (Decision 8).
> - Bonus gets a named place in the Studio and no longer relies on library
>   topics. Yes and Bonus tokens are written as published (Decisions 5–6).
> - Provenance:
>   - one `sources` row per import, keyed by an import id;
>   - one fingerprint per file, and the importing learner recorded on the row;
>   - each card's link names its own file;
>   - the display title no longer claims to name the library topic
>     (Decision 9).
> - The `schule/` rewrite is a direct migration that runs before cells
>   re-attach, so no card is re-tested. It also covers
>   `learning_atoms.domain` (Gemini). Stale embeddings are topped up
>   (Decision 7).
> - Bonus items are also offered once the due queue is done (Gemini,
>   Decision 6).
> - Photos are downscaled before sending (Gemini,
>   Decision 1).
> - PDFs: a strict `file` gate, because otherwise OpenRouter transcribes PDFs
>   on its server (Decision 1). The page renderer and text layer proposed in
>   review were not adopted (see the owner decisions below).
> - Smaller changes:
>   - the page stays visible during review;
>   - cards are grouped by area when a page mixes subjects;
>   - HEIC is converted on the device;
>   - requests with too many images are split;
>   - the schema version is bumped;
>   - the split between kernel and wire format is stated precisely;
>   - the context table is corrected;
>   - ADR 2026-08-14 Decision 10 is no longer cited as precedent.
>
> Not adopted: Gemini's proposal that library topics read the import's display
> title. A topic is keyed by a file's link and an import row by its import id,
> so the two do not join. Topic names stay with ADR 2026-10-02 (see
> Alternatives).
>
> **Revision after review round 2** (MiMo, PR #384; it reviewed the version
> with the harness path and re-checked the current one):
>
> - Harness proposals wait in a named staging file that the Studio can read,
>   with an expiry (Decision 2).
> - ADR 2026-07-04 is a draft again. The two of its rules this ADR relies on are
>   now adopted here explicitly (Decision 7).
> - `domain_meta` does not exist and is dropped from the migration scope
>   (Decision 7).
> - Wire format per API flavour, with a named home for the shared request
>   module (Decision 10).
> - The confirm button also counts unsaved rows, and Bonus rows collapse on
>   long lists (Decision 5).
> - The note on mixed subjects moves before the file picker (Decision 3).
> - The context table now records the existing exact-slug dedupe.
>
> **Owner decisions after round 1:**
>
> - PDFs are imported only by models that read them natively.
> - No PDF renderer: pdf.js is not added, and no PDF text layer is sent.
>   Handling PDFs for other models is a separate improvement, to be built if
>   learners ask for it often enough (Decision 1).
> - `completed` without a preset is confirmed.
> - The harness path comes first. The field-test learner uses opencode, a
>   terminal harness (Decisions 2, 10).

---

## Context

Learners at school carry most of what they have to learn on paper or in a note
app: their own notes from class and the handouts a teacher distributes. Turning
those into cards is the import a school learner needs most often, and ZAM
serves it poorly today.

### What exists

| | Studio (desktop) | Mobile |
|---|---|---|
| Image | The "File / Link / Scan" tab, option "OCR Scan": a vision model transcribes the image to plain text, then a second step drafts cards from that text. JPEG, PNG and WebP only | One vision call transcribes and decomposes a single photo (`mobile/src/vl-import.ts`) |
| File | UTF-8 text up to 2 MB; APKG, CSV and TSV decks | — |
| PDF | Not for learners (`pdftotext` serves only curriculum providers) | — |
| Area (domain) | The learner types it before the import | The model returns free text; a draft without one gets an empty area (`inbox` is only for quick capture) |
| Existing content | No content matching; only an exact slug match when writing | No content matching; only an exact slug match when writing |

ADR 2026-06-30 Phase 5 planned "images and scans through OCR/vision" as a
source adapter that yields text. This ADR replaces that part of Phase 5.

### A worked example

A field-test learner (ninth grade, Realschule, Bavaria) supplied a typical
input: one handwritten page from a tablet note app, written in an introductory
chemistry lesson. It defines chemistry and "Stoff", then lists, under "Mit den
Sinnen", three columns — appearance, smell, taste — each with its own
observations. Under the first two columns sits a "Problem" line (states of
matter change; odourless substances). Taste carries only "forbidden in
chemical experiments".

Three observations from that page shaped this ADR:

1. **Layout carries meaning.** Which "Problem" belongs to which sense is given
   only by the column. A transcription to plain text flattens the columns and
   loses exactly that association. Highlighted headings mark the structure the
   teacher intended.
2. **The value lies beyond the transcript.** A useful import recognises the
   subject (chemistry), the topic (substances and their properties, identified
   by the senses), the depth (introductory lesson; recall and understanding)
   and where the page leads: the two "Problem" lines motivate measurable
   properties — density, melting and boiling point — which is the next lesson.
   It can also supply what the note leaves out, such as *why* tasting is
   forbidden.
3. **The library holds related content, but not where a position lookup
   looks.** The bundled cell "Chemie 8: Stoffe, Gemische, Aggregatzustände und
   Trennverfahren" (Realschule, grade 8) contains the follow-up — its atom on
   identifying substances by measurable properties — but not the page itself.
   `findBundledCellsForScope` requires equal grades when both sides set one, so
   a learner whose curriculum position is grade 9 does not reach that cell
   through it; only the content connects them.

A real pilot library also shows three conventions for school areas side by
side: `Deutsch`, `mathematik-realschule-9-ii-iii` (grade in the path) and
`schule/physik/optik` (written by the bundled cells). An importer that invents
area names adds a fourth.

### What a single request cannot do

Poor notes raise questions that only the learner can answer: an illegible word,
the lesson a page belongs to, what an arrow or a "Problem" line refers to. A
single model request has to guess every one of them and put the whole
analysis into one response. The owner expects that path to work only
moderately well.

Harness apps — Claude, Codex, the Copilot app and others — have meanwhile
become ordinary desktop apps. They read images, PDFs and office files
themselves, hold a conversation, and call tools. ZAM already connects to them
over MCP (`zam agent connect`, ADR 2026-07-06a) and renders its panels inside
them. The OKF import already works this way: the agent judges, and a ZAM tool
validates and writes (ADR 2026-07-18).

### What learners will not do

School learners do not keep a repository, and many do not keep the file
either: a photo is taken, used and deleted. Whatever ZAM needs later has to be
in the cards; whatever points back to the original can only be a reference
that may stop resolving.

The field-test learner now studies on a laptop. The school tablet is managed
more strictly than last year and no longer runs ZAM.

## Decisions

### 1. The model reads the page itself — no transcription step

Images and PDFs go to the model as they are, as image or file content parts,
together with the instructions. No step replaces the input with plain text,
and no transcript is stored or shown. This holds on both paths (Decision 2).

- **Images** (photo, screenshot, exported note page) need a model with the
  `image` capability. HEIC, the iPhone default, is converted to JPEG by the
  platform's own image decoding before sending. Where the platform cannot
  decode HEIC, the dialog says so. Photos are downscaled before sending: the
  mobile import already caps the long edge at 1568 px, and ten pages at full
  resolution would cost tens of thousands of tokens.
- **PDFs** are imported only by a model that reads them natively.
  - On the built-in path a PDF goes as a file part **only** to a model whose
    endpoint metadata declares file input.
  - The capability registry (ADR 2026-09-13) gains a detected `file`
    capability. Like `video`, it is detected from declared metadata only
    (OpenRouter lists `file` in `input_modalities`), never from model names.
  - The gate is strict. OpenRouter parses a PDF sent to a model without native
    file input on its own server, with text extraction or OCR — the
    transcription step this decision rejects.
- **No PDF handling for other models.** ZAM adds no PDF renderer and sends no
  text layer. A PDF parser in the app means a new dependency that handles
  untrusted files, and models that read PDFs natively already cover the need.
  When the connected model cannot read PDFs, the dialog says so and points to
  the harness path, or to exporting the pages as images. If learners ask for
  it often enough, PDF handling for other models becomes a separate
  improvement.
- **No image-capable model connected:** the import is not a dead end. The
  Studio says in one line what it needs, links to the model setup, and points
  to the harness path. Pasting text stays available.

The Studio's current Scan path (vision → text → cards) is retired for card
import once this ships.

### 2. Two paths: built in, and through a harness

The import runs on two paths. They share everything after the model:

- the proposal format (Decision 4);
- the review list with Yes, No and Bonus (Decision 5);
- matching (Decision 8);
- provenance (Decision 9);
- the transactional write.

**Built in.** The Studio, and later Mobile, sends one request to the model the
learner connected. It needs nothing else installed and is the only path on a
phone or tablet. It is also the weaker path: it cannot ask back, so every
ambiguity is guessed. Running it through the agent transport (ADR 2026-07-12a)
changes which model answers, not that shape.

**Through a harness.** The learner hands the material to the AI app they
already use, with ZAM connected over MCP. The harness reads the file itself
and, unlike a single request, can:

- ask back before it proposes — an illegible word, which lesson the page
  belongs to, what a "Problem" line refers to;
- rework single cards when the learner asks ("make card 4 simpler", "what did
  the teacher mean here?");
- look up what ZAM holds through tools — areas, matching items, cells — as
  often as it needs, instead of receiving one candidate list in a prompt;
- read whatever the harness reads, office files included.

The agent proposes; it does not decide:

- It submits its proposals through a ZAM tool, which validates them against
  the kernel's schema and opens the same review list. That list appears as a
  panel in hosts that render MCP Apps panels. Otherwise it appears in the
  Studio, for example for a terminal harness such as opencode, which renders
  no panels. How the tool brings the Studio forward is for the plan; the
  existing UI intent is the obvious starting point.
- The learner chooses Yes, No or Bonus in that list, not in the chat. This is
  the OKF import's division of labour: the agent judges, the tool validates and
  writes.
- **Until the learner confirms, the proposals are not token or card rows.**
  They wait in a machine-local staging file under `~/.zam/`. The file is
  written atomically, like the UI intent and the focused OKF article.
  - The `zam mcp` process writes the file and the Studio reads it. The two are
    separate processes, and a waiting batch has to survive a restart.
  - The Studio shows waiting batches ("1 import waiting for review").
  - A batch the learner neither confirms nor discards expires after 7 days.
- The zam skill and the MCP server instructions describe the import, so every
  connected harness recognises the request.

**The Studio points to the stronger path.** When a harness is connected, the
import dialog offers both paths and says in one line that the harness path can
ask back and is often the smarter choice. ZAM cannot put a file into another
app's chat (ADR 2026-07-18c), so the dialog says what to do there: drop the
file in and ask to import it into ZAM, with the request ready to copy. When
the learner picked the file in the Studio, the request names the file's path,
so a harness that reads local files, such as a terminal agent, can open it
directly. Without a connected harness, the dialog mentions the option once and
links to the agent setup.

Whether the harness path can read an image or a PDF depends on the model the
harness runs. When it cannot, the agent says so in the chat. ZAM does not
second-guess the harness's model.

Harness apps need an account, and some set age limits or need a paid plan. For
school learners the built-in path therefore stays available everywhere; the
harness path is the better option for those who have one.

### 3. One import is one unit; one subject per run

An import takes one or more images, or one PDF, that belong together — a
double page, three photos of one entry, a handout — and the model sees all
pages together.

- **Page cap:** on the built-in path the cap is 10 images. A PDF goes whole,
  within the provider's size limit. ZAM does not split PDFs, because that
  would need a PDF parser. The learner can name the pages to use, and that goes
  into the instructions.
- **Too many images for the model:** if the model rejects the request because
  of its own image limit, the import splits the pages into smaller requests
  and tells the learner.
- **Mixed subjects:** both paths tell the learner, before the file is picked,
  that material from different subjects is imported in separate runs. A
  sentence will not stop a worksheet
  that mixes subjects, though. If the analysis finds more than one subject,
  the list groups the cards by area, and the learner confirms each area on its
  own (Decision 7).

### 4. Understand, then propose

The model returns one schema-validated object — in one request on the built-in
path, after any dialogue on the harness path:

- an **analysis**: the kind of material (own notes, handout, worksheet,
  solution sheet, board picture), subject, topic, depth (school level, Bloom
  range) and what the material leads to;
- **card proposals** — question, answer, Bloom level, page and proposed area —
  each with an **origin**:
  - `page` — stated on the page;
  - `completed` — explains, justifies or corrects a statement on the page (the
    reason behind "tasting is forbidden"; a word that was likely mis-noted);
  - `extra` — related knowledge the page does not state;
- a **legibility flag** on proposals the model could not read with confidence.

Over-delivery is intended. Proposals phrased as question and answer let a
learner with poor notes recognise what was actually said in class; the learner
removes what is wrong. Card wording follows the flashcard RFC (atomic, one
retrieval target per card). Unstructured model output is never written
(ADR 2026-06-30, testing strategy).

The analysis is shown as one line above the proposals. On the built-in path it
is not editable and nothing is regenerated from it: a wrongly named subject is
cheap, and a correction loop costs the learner more than it saves. On the
harness path the conversation is the correction loop.

### 5. The learner decides each card: Yes, No or Bonus

The proposals appear as a list like the goal import's card preview (ADR
2026-07-24 Decision 3), but each card takes one of three choices instead of a
checkbox:

| Choice | Effect |
|---|---|
| **Yes** | token and card — the card enters the learner's queue |
| **Bonus** | token without a card — offered, never scheduled |
| **No** | nothing is written |

**Presets.** The model presets each choice from the card's origin:

| Origin | Preset |
|---|---|
| `page` | Yes |
| `extra` | Bonus |
| `completed` | none |
| hard to read (legibility flag) | none |

A `completed` card is the model's own addition or correction. Once the import
is done the page is gone, and the learner has nothing to check that card
against, so it has to be chosen by hand.

**Unchosen rows.** A card without a choice is not saved. The confirm button
states all three counts ("Add 7 · 2 as Bonus · 3 not saved"), so the rows the
model was unsure about never drop out silently. On a long list, rows preset to
Bonus start collapsed.

**The page stays in view.** While the list is open, the page stays on screen
beside it, so a `page` card can be checked against the handwriting. On the
harness path this applies wherever the Studio can read the file.

**Writing.** Nothing is written before the learner confirms, and the confirmed
batch is written in one transaction. Yes and Bonus tokens are written as
`published`, because the learner's confirmation is the author review. The
existing source import writes drafts without a source link, and this import
does not reuse that writer.

### 6. Bonus means offered, never scheduled — and has a place to be taken from

"Bonus" applies the principle of ADR 2026-08-14 Decision 6 to personal
imports: the content is kept, the learner's queue is untouched, and the offer
carries no score, streak or target. It does not use `enrolBonusAtom`. That
mechanism serves cell atoms that rest on a held hard prerequisite, and it
rejects personal tokens.

Learning Content today lists cards, not tokens, so a token without a card
would be invisible there. The Studio therefore gets a **Bonus** view in
Learning Content:

- It lists the bonus items from the learner's own imports. These are found
  through `token_sources` and the import's `sources` row, which records the
  importing learner (Decision 9).
- Each item has an action that creates its card.
- The import's source line shows its bonus items too.

A view alone is still a place learners have to go looking. Bonus items are
therefore also offered when the due queue is done: a few items from the
learner's recent imports, named by what they belong to ("2 more from your
chemistry notes"), with the same take-one action.

A bonus token also carries its file's source link and is published. It is
therefore a member of that file's library topic, and starting the topic picks
it up as well. Nothing relies on that, though.

### 7. The area is proposed from what exists, with the subject as root

The model sees the learner's existing area paths and the subjects of the cells
for the learner's school type: in the request on the built-in path, and
through tools on the harness path. It picks the best existing path or proposes
a new one. The review list shows the area above the cards before anything is
saved. The learner can switch to another existing area or type one, without
regenerating the cards.

**Rules adopted here.** ADR 2026-07-04 is a draft again: it was reverted on
2026-08-14 because cross-publisher atom identity is open. Two of its points
this ADR adopts as binding on their own:

- **The root of an area path is the subject, never a life area.** Owner
  decision of 2026-10-05: no `schule/`. So the path is
  `chemie/stoffe-und-eigenschaften`, not `schule/chemie/…`. The grade belongs
  in the curriculum anchor, not in the path.
- **A token's identity is its id, and its area is metadata.** This is already
  how the code works: cards and review logs reference `token_id`, so changing
  a domain touches neither.

Bundled cells currently write `schule/<subject>/…`. That would split one
subject into two areas as soon as imports follow the rule above.
**Consequence:** the cell fixtures drop the `schule/` prefix, and a migration
rewrites stored paths.

- **Scope of the rewrite.** The migration rewrites every stored `schule/<rest>`
  path to `<rest>`: token domains, including paths a learner wrote by hand,
  and `learning_atoms.domain`. It is a direct `UPDATE` in an M-series
  migration.
- **Why it must not go through cell attach.** A cell attach treats a domain
  change as a material revision: absent materiality means `material`, and
  every non-new card becomes due.
- **Order.** Migrations run when the library opens, before any cell attach in
  that session, and the fixtures change in the same release. Re-attach
  therefore finds the domain unchanged and publishes no revision. Token ids,
  cards, scheduling and review history are untouched (see the rules adopted
  above).
- **Embeddings.** The embedding text includes the domain, so the rewritten
  tokens' embeddings become stale. The lazy top-up (`ensureTokenEmbeddings`)
  and `zam token reembed` renew them, and the import's matching tops up before
  it matches.

Other non-conforming paths (`Deutsch`, grade in the path) stay with the
doctor's `domains` task.

### 8. Existing content stands beside the proposal, labelled "already there"

Before the list is shown, each proposal is matched by content against the
learner's library and the items of the bundled cells.

- **Ranking, not filtering.** The curriculum position ranks candidates; it does
  not filter them (see the worked example).
- **Candidate pre-selection.** ZAM pre-selects candidates by the analysed
  subject; the catalog of a school type is too large to send whole.
- **Where it runs.** The match runs in ZAM on both paths, so a harness that
  skipped its own lookups still gets it.

A match is shown **beside** the proposal it matched, never instead of it:

- **Label.** The existing item is labelled **"already there"** (German UI:
  "vorhanden"), not "reviewed". The library is not a reviewed one yet, and the
  label must not claim it is.
- **Choices on a matched pair.** Each of the two rows takes its own choice. The
  existing item inherits the proposal's preset, and the proposal itself gets
  none. By default the learner takes what the library holds; their own wording
  stays one tap away for a near miss.
- **Yes on the existing item** gives the learner a card for it. A cell item
  whose token does not exist yet is installed first.
- **Yes on the proposal** keeps the learner's wording as a new token.
- **Card already held.** If the learner already has a card for the existing
  item, the row says so and takes no choice.
- **Continuation items.** Items that continue the material join the list,
  preset to Bonus. In the example that is the cell's atom on measurable
  properties. There are at most a few, and only from the same subject.

The principle is ADR 2026-07-25 Decision 5: prefer what a library already
holds over generating it again. ADR 2026-08-14 Decision 10 is a different
mechanism, position precedence through `findBundledCellsForScope`, and the
worked example shows why it is not the mechanism here. Similarity only
proposes a match; the learner's choice decides it, and no review history moves
between items (ADR 2026-08-14 Decision 9). The plan decides how the match is
computed: candidate lists, a pass over embeddings, or both.

### 9. Provenance is a reference, not a copy

Nothing of the material is stored: no image, no PDF, no transcript. What
remains is where it came from.

- **Each card names its own file.** Every token's `source_link` names the file
  that card came from:
  - `file:///…/Chemie-Stoffe.pdf#page=2` where the device has a path;
  - otherwise a placeholder naming the file and the import date, such as
    `photo:IMG_1234.HEIC@2026-10-05`. It is never a bare camera filename,
    because cameras reuse them.

  The link may stop resolving; it still says what the card came from.
- **One `sources` row per import**, keyed by an import id
  (`zam-import:<ULID>`), never by a file name, because `sources.uri` is
  unique.
  - `type` reuses `file` for files and `scan` for photos, and `content` stays
    empty.
  - New columns: a **display title** from the analysis ("Stofferkennung mit
    den Sinnen"), the **SHA-256 of each file** (a set, since an import can hold
    several photos), and the **importing learner**.
  - `token_sources` links each token to its import and records the page.
- **What the title names.** The title names the import in the Studio and on a
  card's source line. Library topics keep their own rules (ADR 2026-10-02
  Decision 1: the link without its fragment is the key, and the last path
  segment is the name). A single-file import therefore forms one topic named
  after its file. This ADR does not change topic naming.
- **Re-import.** A file whose fingerprint matches an earlier import is pointed
  out ("imported on 5 Oct"), not blocked.
- **Harness path.** The agent passes the file's name or path and, where it can
  read the bytes, the fingerprint. Without a fingerprint, re-import detection
  falls back to the link.

**Schema.** The new columns go into `schema.ts` and an M-series migration,
together with the domain rewrite (Decision 7). `CURRENT_SCHEMA_VERSION` (36 at
the time of writing) is incremented; otherwise an existing library would skip
the chain.

### 10. Delivery: shared contract first, then the paths

All of it lands on the same branch, in this order:

1. **The shared contract:** proposal format, review list, presets, matching,
   provenance and the transactional write.
2. **The harness path.** The field-test learner studies on a laptop and uses
   opencode. Its first target is therefore a terminal harness without panels,
   which takes the review list in the Studio.
3. **The built-in Studio path.**
4. **Mobile** (Android, iPadOS): the built-in path with camera, photo library
   and files. It replaces the current single-photo import.

**Where the code lives.** Both apps already import the kernel (the standalone
apps open it directly, ADR 2026-08-08).

- **In the kernel:** the response schema and its validation, the presets,
  matching and the transactional write.
- **Outside the kernel:** request construction and the provider wire format.
  - Both live in one HTTP-free module that both apps import.
    `src/cli/llm/choice-prompt.ts` already works this way and serves Mobile
    (`mobile/src/choice-generate.ts`). There is no third shared root.
  - The wire format follows the API flavour: OpenAI-style endpoints take image
    and file parts, and Anthropic Messages endpoints take image and `document`
    blocks. The capability probe already branches on the flavour.
  - The HTTP call itself stays with each app's existing vision client.
- **On the harness path,** the MCP tool validates the agent's submission
  against the kernel schema.

No HTTP or LLM client code enters the kernel.

"Share to ZAM" from other apps (the share sheet) comes later.

### 11. The learner sees where the pages go

The built-in dialog names the model the pages are sent to (ADR 2026-06-30
Phase 5). It uses the model the learner has connected for images; image import
is quality-first on a cloud model by default (ADR 2026-08-09c). There is no
import-specific model setting. On the harness path the material goes wherever
the learner's harness sends it; ZAM adds nothing to that.

## Consequences

### Positive

- The most common school input becomes one import, and its review step also
  helps a learner decode poor notes.
- A path that can ask back exists from the start, built on apps learners
  increasingly have and on ZAM's existing MCP connection.
- Areas converge instead of sprawling: cells and imports share one area per
  subject.
- What the library holds is reused, without taking the learner's own wording
  away.
- No storage or sync cost for originals. The material leaves the device only
  in the request to a model the learner chose.

### Negative and trade-offs

- **Two paths to keep consistent.** One shared contract after the model
  carries that; the paths differ only in how the proposals come about.
- **Dependence on third-party apps.** The harness path depends on their
  accounts, age limits and plans, and on their uneven support for MCP Apps
  panels. The Studio fallback for the review list covers the last point; the
  built-in path covers the rest.
- **An image-capable model is needed** on the built-in path. Without one, only
  the harness path and text paste remain.
- **On the built-in path, PDFs need a model that declares file input.** With
  any other model the built-in path offers no PDF import. The harness path, or
  exporting the pages as images, are then the way.
- **No original to go back to.** Once the file is gone, the card is all there
  is, so question and answer must stand on their own.
- **Over-delivery puts a selection step on every import.** For a ten-page
  handout the list is long. Presets carry most of that load. The `completed`
  rows stay open on purpose.
- **A migration rewrites stored area paths**, and their embeddings are renewed
  lazily afterwards.
- **Cost grows with the page count** on the built-in path; images are
  token-heavy.

## Falsification

The field test shows this design wrong if:

- learners keep fewer than half of the cards preset to Yes — over-delivery is
  noise, and the presets must get stricter;
- harness imports are not noticeably better than built-in ones (fewer
  deselections, fewer later edits) — the Studio should stop recommending the
  harness path;
- "already there" matches are wrong often enough that learners stop trusting
  them — the match must get stricter, or the label must change;
- re-importing the same file goes unnoticed despite the fingerprint —
  provenance identity is wrong.

## Out of scope

- The share sheet ("Share to ZAM").
- Office formats (Word, PowerPoint) on the built-in path. The harness path
  takes whatever the harness reads.
- PDF handling for models without native file input (page rendering, text
  layer). If learners ask for it often enough, it becomes a separate
  improvement.
- Storing originals or transcripts.
- Correcting the analysis and regenerating from it on the built-in path.
- Prerequisite edges between imported cards beyond the continuation hint
  (Studio Phase 4 covers foundations).
- Changing how library topics are named.
- Cleaning up other non-conforming area paths.

## Alternatives considered

- **Transcribe first, then generate** — Studio Phase 5 as planned and today's
  Scan path. Rejected: the transcript loses layout, and the worked example
  shows what that costs.
- **Render PDF pages on the device (pdf.js) for models without file input,
  optionally with the PDF's text layer** (proposed in review). Not adopted for
  now. It adds a dependency that parses untrusted files inside the app, and
  models that read PDFs natively already cover the need. It can come back as
  its own improvement.
- **Built-in path only.** Rejected: one request cannot ask back, and poor
  notes are exactly where asking back pays.
- **Harness path only.** Rejected: there is no harness on a phone or school
  tablet, harness apps need accounts and some set age limits, and the import
  must not depend on a third-party app to work at all.
- **Choosing Yes, No or Bonus in the harness chat.** Rejected: twenty cards
  are a list, not a conversation, and one review list keeps both paths
  identical where the learner decides.
- **Preset `completed` to Yes** (first version). Rejected: it puts the model's
  corrections into the queue on a default, and the page they correct is gone
  afterwards.
- **Replace a proposal with its library match** (first version). Rejected: a
  near miss would erase the wording from the learner's page, with no way to
  keep it.
- **Library topics name themselves from the import's title** (proposed in
  review). Rejected: topics are keyed by a file's link, and the import row by
  its import id, so the two do not join. Curated topic names are ADR
  2026-10-02's phase 3.
- **Bonus as a set-aside card** (a card with `detached_at`). Rejected: detached
  means "not for me" and is skipped by topic starts, while bonus means "maybe
  later". The owner chose no card.
- **Keep the original image or PDF with the cards.** Rejected: storage and
  sync cost in a database that may be shared or synced; learners do not keep
  repositories; class material stays private.
- **Strict grounding — only what is on the page.** Rejected: poor notes are
  the normal case. A reviewed over-supply recovers what was said, and extra
  knowledge goes to Bonus instead of being dropped.
- **Save every proposal and let the learner clean up afterwards** (Studio
  principle 2). Rejected for this source: notes can be wrong, and a wrong card
  in the queue costs more than a choice before saving.
- **An editable analysis that regenerates the cards** on the built-in path.
  Rejected: complexity for the learner, for a mistake that is cheap. The
  harness path offers that loop naturally.
- **Match cells by curriculum position only.** Rejected: in the worked example
  the cell sits at grade 8 and the learner at grade 9.
