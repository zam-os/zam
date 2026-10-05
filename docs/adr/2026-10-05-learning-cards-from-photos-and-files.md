# Learning Cards from Photos and Files: The Model Reads the Page

**Status:** Proposed\
**Date:** 2026-10-05\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-06-30](2026-06-30-learning-content-studio.md) (Phase 5) ·
[2026-07-04](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) (Decisions 1, 3) ·
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-07-12a](2026-07-12a-agent-backed-ai-provider.md) ·
[2026-07-18](2026-07-18-okf-learning-import.md) ·
[2026-07-18c](2026-07-18c-okf-import-handoff.md) ·
[2026-07-24](2026-07-24-first-run-onboarding.md) (Decision 3) ·
[2026-07-25](2026-07-25-shared-curated-learning-content.md) (Decision 5) ·
[2026-08-08](2026-08-08-ios-standalone-app.md) ·
[2026-08-09c](2026-08-09c-on-device-ai-preference.md) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decisions 6, 9, 10) ·
[2026-09-13](2026-09-13-model-capabilities-are-detected.md) ·
[2026-10-02](2026-10-02-library-topics.md) ·
[flashcard quality RFC](../concepts/flashcard-generation-and-decomposition-strategy.md)

---

## Context

Learners at school carry most of what they have to learn on paper or in a note
app: their own notes from class and the handouts a teacher distributes. Turning
those into cards is the import a school learner needs most often, and ZAM
serves it poorly today.

### What exists

| | Studio (desktop) | Mobile |
|---|---|---|
| Image | "Source → Scan": a vision model transcribes the image to plain text; a second step drafts cards from that text | One vision call transcribes and decomposes a single photo (`mobile/src/vl-import.ts`) |
| File | UTF-8 text up to 2 MB; APKG, CSV and TSV decks | — |
| PDF | Not for learners (`pdftotext` serves only curriculum providers) | — |
| Area (domain) | The learner types it before the import | The model invents free text; fallback `inbox` |
| Existing content | Not consulted | Not consulted |

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
   A learner whose curriculum position is grade 9 does not reach that cell
   through `findBundledCellsForScope`; only the content connects them.

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
together with the instructions. No step turns the input into plain text first,
and no transcript is stored or shown. This holds on both paths (Decision 2).

- **Images** (photo, screenshot, exported note page) need a model with the
  `image` capability.
- **PDFs** go as a file part to a model whose endpoint declares document
  input. The capability registry (ADR 2026-09-13) gains a detected `file`
  capability; like `video`, it is detected from declared metadata only
  (OpenRouter lists `file` in `input_modalities`), never from model names.
  Where the connected model declares no document input, the device renders the
  pages as images and sends those — still visual, layout intact.
- **No image-capable model connected:** the import is not a dead end. The
  Studio says in one line what it needs, links to the model setup, and points
  to the harness path. Pasting text stays available.

The Studio's current Scan path (vision → text → cards) is retired for card
import once this ships.

### 2. Two paths: built in, and through a harness

The import runs on two paths. They share everything after the model: the
proposal format (Decision 4), the review list with Yes, No and Bonus
(Decision 5), matching (Decision 8), provenance (Decision 9) and the
transactional write.

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

The agent proposes; it does not decide. It submits its proposals through a ZAM
tool, which validates them and opens the same review list: as a panel in hosts
that render MCP Apps panels, otherwise in the Studio. The learner chooses Yes,
No or Bonus in that list, not in the chat. This is the OKF import's division
of labour: the agent judges, the tool validates and writes. Until the learner
confirms, the proposals are machine-local state, not database rows. The zam
skill and the MCP server instructions describe the import, so every connected
harness recognises the request.

**The Studio points to the stronger path.** When a harness is connected, the
import dialog offers both and says in one line that the harness path can ask
back and is often the smarter choice. ZAM cannot put a file into another app's
chat (ADR 2026-07-18c), so the dialog says what to do there — drop the file in
and ask to import it into ZAM — with the request ready to copy. Without a
connected harness, the dialog mentions the option once and links to the agent
setup.

Harness apps need an account, and some set age limits or need a paid plan. For
school learners the built-in path therefore stays available everywhere; the
harness path is the better option for those who have one.

### 3. One import is one unit; one subject per run

An import takes one or more images, or one PDF, that belong together — a
double page, three photos of one entry, a handout — and the model sees all
pages together. On the built-in path the cap is 10 pages; for a longer PDF the
learner picks a page range. Both paths tell the learner that material from
different subjects is imported in separate runs.

### 4. Understand, then propose

The model returns one schema-validated object — in one request on the built-in
path, after any dialogue on the harness path:

- an **analysis**: the kind of material (own notes, handout, worksheet,
  solution sheet, board picture), subject, topic, depth (school level, Bloom
  range) and what the material leads to;
- **card proposals** — question, answer, Bloom level, page — each with an
  **origin**:
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

The model presets the choice: `page` and `completed` → Yes, `extra` → Bonus,
flagged as hard to read → no preset. A card without a choice is not saved, and
the confirm button states the counts ("Add 7 · 2 as Bonus"). Nothing is
written before the learner confirms; the confirmed batch is written in one
transaction.

### 6. Bonus means offered, never scheduled

"Bonus" applies ADR 2026-08-14 Decision 6 to personal imports: the content is
kept and the learner's queue is untouched. A bonus token carries the same
source link as its siblings, so it stays where the import is — in the Studio
under that source, and as a member of the source's library topic. Starting the
topic (ADR 2026-10-02 Decision 2) creates the missing cards then, and taking a
single bonus card creates that card. Choosing Bonus over Yes loses nothing.

The label is "Bonus". Like every bonus offer it carries no score, streak or
target. Where else bonus content is offered (for example after the due queue)
is left to the plan.

### 7. The area is proposed from what exists, with the subject as root

The model sees the learner's existing area paths and the subjects of the cells
for the learner's school type — in the request on the built-in path, through
tools on the harness path. It picks the best existing path or proposes a new
one. The review list shows the area above the cards before anything is saved;
the learner can switch to another existing area or type one, without
regenerating the cards.

Proposed paths follow ADR 2026-07-04 Decision 3: the root is the subject, never
a life area — `chemie/stoffe-und-eigenschaften`, not `schule/chemie/…`. The
grade belongs in the curriculum anchor, not in the path.

Bundled cells currently write `schule/<subject>/…`. That contradicts the same
decision and would split one subject into two areas as soon as imports follow
it. **Consequence:** the cell fixtures drop the `schule/` prefix, and an
idempotent migration rewrites `schule/<rest>` to `<rest>` for tokens already
installed. A domain is metadata; token ids, cards and review history are
untouched (ADR 2026-07-04 Decision 1). Other non-conforming paths (`Deutsch`,
grade in the path) stay with the doctor's `domains` task.

### 8. Existing content is offered instead of a duplicate, labelled "already there"

Before the list is shown, each proposal is matched by content against the
learner's library and the items of the bundled cells. The curriculum position
ranks candidates; it does not filter them (see the worked example). The match
runs in ZAM, on both paths, so a harness that skipped its own lookups still
gets it.

- A match takes the place of the generated proposal and is labelled
  **"already there"** (German UI: "vorhanden") — not "reviewed". The library is
  not a reviewed one yet, and the label must not claim it is. Yes creates the
  learner's card for the existing item; no new token is written.
- If the learner already has a card for it, the row says so and takes no
  choice.
- Items that continue the material — in the example, the cell's atom on
  measurable properties — join the list, preset to Bonus.

This is the precedence of ADR 2026-07-25 Decision 5 and ADR 2026-08-14
Decision 10, applied to a photo: what the library holds is offered before
anything is generated. Similarity only proposes a match; the learner's choice
decides it, and no review history moves between items (ADR 2026-08-14
Decision 9). How the match is computed — candidate lists in the request, a
pass over embeddings, or both — is left to the plan.

### 9. Provenance is a reference, not a copy

Nothing of the material is stored: no image, no PDF, no transcript. What
remains is where it came from.

- Every token from an import carries a `source_link` naming the original:
  `file:///…/Chemie-Stoffe.pdf#page=2` where the device has a path, and a
  readable placeholder where it has none — `photo:IMG_1234.HEIC` for a photo
  from the library, a timestamped placeholder for a photo taken in the app. The
  link may stop resolving; it still says what the card came from.
- The import writes one row to the existing `sources` table with `content`
  left empty, plus two new columns: a **display title** from the analysis
  ("Stofferkennung mit den Sinnen") and a **SHA-256 fingerprint** of the file.
  The title names the source in the Studio and names the library topic instead
  of "IMG 1234". The fingerprint recognises a file imported before.
  `token_sources.page_number` records the page.

On the harness path the agent passes the file's name or path and, where it can
read the bytes, the fingerprint; without one, re-import detection falls back to
the link.

Both columns go into `schema.ts` and an M-series migration.

### 10. Delivery: shared contract first, then the paths

The shared contract comes first: proposal format, review list, presets,
matching, provenance and the transactional write. The two desktop paths follow
on the same branch, in the order the plan sets; the field-test learner studies
on a laptop, so the desktop comes before Mobile. Mobile (Android, iPadOS) then
gets the built-in path with camera, photo library and files, replacing the
current single-photo import.

Both apps already share the kernel (the standalone apps open it directly, ADR
2026-08-08). The kernel owns what is learning logic: presets, matching and the
transactional write. Request construction and the response schema live in one
module both apps and the MCP tool import, with no HTTP in it; the model call
itself is injected, as `ReferenceFetcher` is. Its exact place is left to the
plan, within the rule that no HTTP or LLM client code enters the kernel.

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
- What the library holds is reused; a generated duplicate of library content
  becomes the exception.
- No storage or sync cost for originals. The material leaves the device only
  in the request to a model the learner chose.

### Negative and trade-offs

- Two paths to keep consistent. One shared contract after the model carries
  that; the paths differ only in how the proposals come about.
- The harness path depends on third-party apps: their accounts, age limits,
  plans and uneven support for MCP Apps panels. The Studio fallback for the
  review list covers the last point; the built-in path covers the rest.
- The built-in path needs an image-capable model; without one, only the
  harness path and text paste remain.
- There is no original to go back to. Once the file is gone, the card is all
  there is, so question and answer must stand on their own.
- Over-delivery puts a selection step on every import; for a ten-page handout
  the list is long. Presets carry most of that load.
- Presetting `completed` to Yes trusts the model's corrections of the
  learner's notes, and a wrong correction looks authoritative. The origin must
  stay visible on those rows.
- A migration rewrites the domain of installed cell tokens.
- Cost per built-in import grows with the page count; images are token-heavy.

## Falsification

The field test shows this design wrong if:

- learners keep fewer than half of the cards preset to Yes — over-delivery is
  noise, and the presets must get stricter;
- harness imports are not noticeably better than built-in ones (fewer
  deselections, fewer later edits) — the Studio should stop recommending the
  harness path;
- "already there" matches are wrong often enough that learners stop trusting
  them — the match must get stricter, or the label must change;
- re-importing the same file produces duplicates despite the fingerprint —
  provenance identity is wrong.

## Out of scope

- The share sheet ("Share to ZAM").
- Office formats (Word, PowerPoint) on the built-in path. The harness path
  takes whatever the harness reads.
- Storing originals or transcripts.
- Correcting the analysis and regenerating from it on the built-in path.
- Prerequisite edges between imported cards beyond the continuation hint
  (Studio Phase 4 covers foundations).
- Cleaning up other non-conforming area paths.

## Alternatives considered

- **Transcribe first, then generate** — Studio Phase 5 as planned and today's
  Scan path. Rejected: the transcript loses layout, and the worked example
  shows what that costs.
- **Built-in path only.** Rejected: one request cannot ask back, and poor
  notes are exactly where asking back pays.
- **Harness path only.** Rejected: there is no harness on a phone or school
  tablet, harness apps need accounts and some set age limits, and the import
  must not depend on a third-party app to work at all.
- **Choosing Yes, No or Bonus in the harness chat.** Rejected: twenty cards
  are a list, not a conversation, and one review list keeps both paths
  identical where the learner decides.
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
