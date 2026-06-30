# Learning Content Studio

**Status:** Accepted
**Deciders:** Thomas (project owner)

## Context

A new ZAM installation does not contain any learning content. Creating the
first content currently requires the learner to open a suitable workspace,
start an agent there, and know about the ZAM skill. That is too high a barrier
for the first productive interaction with ZAM.

ZAM Desktop should therefore gain a **Learning Content** page alongside the
dashboard and settings. It will initially allow people to create, search,
filter by category, edit, and remove personal learning cards. Later iterations
will generate cards from curricula, textbook pages, class notes, scans, and
web pages.

The existing data model separates knowledge content from its learning state:

- A `token` contains the question, reference answer, category, source, and
  Bloom level.
- A `card` contains one person's FSRS learning state for a token.

The UI may refer to both together as a learning card in everyday language,
but it must respect their different effects when content is changed or
deleted.

## Product principles

1. **The empty state is a starting point, not an error.** A fresh installation
   presents a clear “Create your first learning card” action.
2. **Make bulk import practical.** A user-initiated import may persist multiple
   schema-valid cards in one operation without requiring each card to be
   approved first. Newly imported cards remain easy to find and inspect
   afterward.
3. **Stay grounded in the source.** Curriculum-derived content remains within
   the source's explicit scope. Additional general knowledge is not presented
   as curriculum content.
4. **Keep learning cards atomic.** A card should test one transferable unit of
   knowledge whenever possible. Broad competency statements may initially be
   imported and later split in a controlled workflow.
5. **Never destroy learning history silently.** Removing a card, permanently
   deleting a token, and replacing a card during splitting require distinct,
   understandable confirmations.
6. **Keep local AI viable.** The import pipeline uses the configured text AI
   role and does not require a specific cloud provider.

## Scope and delivery plan

### Phase 0 — Decisions and contracts

- Resolve the open product decisions listed below.
- Define stable JSON contracts for listing, creating, updating, and removing
  learning content through the bridge.
- Establish UI terminology: “Learning Content” for the page, “learning card”
  for a personal token with learning state, and “category” as the UI label for
  the existing `domain` field.

Outcome: this ADR is changed to `Accepted` and can be committed independently
of the implementation.

### Phase 1 — Card management (first deliverable)

#### User flow

The main navigation gains a **Learning Content** entry. On wide windows, the
page displays a list on the left and an editor on the right. On narrow windows,
the list and editor are shown sequentially.

- Full-text search across question, answer, category, and technical key.
- A category selector populated from existing categories; “All” is the
  default.
- Cards are sorted by creation date, newest first, so newly created and
  imported content is immediately visible.
- A list of all personal learning cards, including their learning state.
- “New learning card” opens an empty editor.
- Editable fields:
  - question (`question`)
  - answer / learning content (`concept`)
  - category (`domain`)
  - source link (`source_link`)
  - optionally expanded: context, Bloom level, and symbiosis mode
- The technical `slug` is generated without collisions and is read-only after
  creation.
- Saving does not change the existing FSRS learning state.
- Removing a card shows the affected learning history before confirmation.
- An empty collection presents a direct “Create your first learning card”
  action.

#### Technical boundary

The kernel gains a query for personal learning cards with optional text search
and category filtering. It joins tokens and cards on the server instead of
loading and filtering the entire collection in the webview.

The persistent desktop bridge gains explicit argument-based commands for:

- listing and searching personal learning cards,
- atomically creating a token and its personal card,
- updating the editable token fields,
- previewing the effects of deletion,
- performing the confirmed removal or deletion action.

The existing `add-token` bridge command reads raw data from `stdin` and is
therefore not suitable for the persistent desktop server, which already uses
`stdin` for its request stream. The UI receives a dedicated command that
passes all values in the request argument array.

Files expected to be affected:

- `src/kernel/models/token.ts` and/or a new card-list repository
- `src/kernel/index.ts`
- `src/cli/commands/bridge.ts`
- `desktop/index.html`
- `desktop/src/main.ts` for routing and initialization
- a new desktop module such as `desktop/src/learning-content.ts`
- `desktop/src/styles.css`
- `desktop/src/i18n.ts` and all seven supported locale dictionaries
- kernel, bridge, and desktop build tests

#### Acceptance criteria

1. On a fresh database, the first card can be created without a terminal and
   appears immediately in both the list and the learning schedule.
2. Search finds matches in questions, answers, and categories.
3. The category filter shows only cards in the selected category.
4. Newly created cards appear at the top of the list.
5. Changes survive an application restart while review data remains unchanged.
6. Removal requires confirmation and shows the affected learning history.
7. Bridge errors appear on the page and are not mistaken for an empty
   collection.
8. User-facing copy is present for all seven supported locales.
9. The root typecheck, tests, and desktop build pass.

### Phase 2 — Import curriculum text

An import dialog starts with the **Curriculum** type and initially accepts only:

- pasted curriculum text,
- an optional source URL,
- a target category.

The configured text AI produces a structured result. Each generated card
contains a question, reference answer, category, source reference, and the
corresponding source excerpt. The AI selects the initial Bloom level and
symbiosis mode. Both remain editable under “More settings.”

Before writing, the system searches existing tokens for possible duplicates.
The validated result is created in one transaction as tokens with personal
cards. A batch must not be saved partially. After a successful import, the UI
opens the Learning Content page with the newest cards at the top. The learner
can then inspect the imported cards one by one and edit, remove, or split them
as needed.

This phase does not fetch web content. A supplied URL serves only as a
provenance reference.

### Phase 3 — Split a broad learning card

On a selected card, **Split** generates two to four more atomic proposals. The
current question, answer, category, and source form the binding context. The
learner reviews and edits the result before anything is saved.

Before implementation, we must decide what happens to the original card: keep
and block it, remove only its personal card, or replace it with the new cards.
Existing review data must never be lost silently.

### Phase 4 — Import foundational knowledge

**Import foundational knowledge** first searches for existing tokens that fit
as prerequisites. The text AI then proposes no more than two to four missing
foundations. For a curriculum source, only foundations explicitly named there
may be presented as official curriculum content.

After confirmation, new foundations are created as personal cards and linked
to the selected card through `prerequisites`. Existing matching tokens are
reused. Before saving, the action shows which tokens will be created and which
will only be linked.

### Phase 5 — Files, scans, HTML, and web links

The import pipeline gains source adapters for:

1. textbook or class-note files,
2. images and scans through OCR/vision,
3. local HTML,
4. web links with safe text extraction.

This phase requires a dedicated source model because a single `source_link`
cannot represent multiple scans, text excerpts, page numbers, import status,
and provenance cleanly. The expected design includes a `sources` table, a
mapping between tokens and sources, and stored source excerpts or page
references.

Web fetching additionally requires size limits, timeouts, content-type checks,
protection against access to local or private network targets, and a clear
indication of which content is sent to which AI model.

## Testing strategy

- **Kernel:** search, category filtering, personal visibility, slug
  collisions, transactions, and unchanged FSRS fields after editing.
- **Bridge:** JSON contracts, Unicode and multiline fields, an empty database,
  destructive-action previews and confirmations, and execution in persistent
  `serve` mode.
- **Desktop:** TypeScript/Vite build, responsive list/editor states,
  empty/loading/error states, and copy for all seven supported locales.
- **Manual smoke test:** fresh temporary database, add/edit/search/filter/
  remove, application restart, and a subsequent learning session.
- **Import phases:** fixed curriculum fixtures and schema-validated AI
  responses; unstructured model output must never be written directly to the
  database.

## Out of scope for the first release

- automatically fetching the LehrplanPLUS web page,
- image, PDF, scan, or HTML import,
- imports initiated without an explicit user action,
- automatic prerequisite searches on the open web,
- collaborative editing of a shared global token catalog,
- changes to the existing review or FSRS behavior.

## Open decisions

1. **What does “Delete” mean in Phase 1?**
   Recommendation: the primary action removes the personal card after an
   impact preview. A global hard-delete of the token remains a second action
   explicitly marked as advanced.

2. **May Phase 1 update tokens globally in a shared or remote database?**
   Recommendation: describe Phase 1 as personal and local-first management and
   do not promise global editing in a multi-user system. True personal
   overrides will require a separate data model later.

3. **How is the technical key (`slug`) created?**
   Recommendation: derive it automatically from the category and question or
   answer, limit it to a reasonable length, and append a short stable suffix on
   collision. The key is not editable in the standard form.

4. **Which fields are visible in the standard form?**
   Recommendation: show question, answer, category, and source directly. Place
   context, Bloom level, and symbiosis mode under “More settings.” For imported
   cards, the AI supplies the initial Bloom level and symbiosis mode; the user
   can change either value.

5. **What happens to the original card after splitting?**
   Recommendation: create the new cards as prerequisites, rewrite the original
   card as an atomic higher-level application question, and block it until the
   foundations have been recalled successfully once. If no meaningful
   higher-level question remains, remove only the personal original card while
   retaining the token for traceability.

6. **Should curriculum text import create exactly one card per bullet, or
   should it atomize the content immediately?**
   Recommendation: preserve bullets that are already atomic; import broad
   bullets as cards and defer their controlled decomposition to Phase 3. This
   keeps the first AI pipeline small and makes post-import correction easy.

## Consequences

- The first useful ZAM workflow becomes available without a terminal or agent.
- Phase 1 largely reuses the existing data model.
- The token/card distinction remains intact but must be explained clearly in
  deletion dialogs and when shared databases are involved.
- AI import deliberately follows the reliable manual editor, which provides
  the post-import workflow for inspecting and correcting generated cards.
- Multi-source provenance is kept out of the MVP but is explicitly planned
  before scan and web imports.
