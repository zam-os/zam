# LehrplanPLUS Phase 3 — implementation handoff

## Goal

Import only the Lernbereiche selected in the curriculum wizard and retain
precise provider/topic provenance on every generated card. The official source
remains authoritative: cards are saved directly and can be edited afterward in
the Studio.

## Current boundary

- Navigation and topic selection are implemented from the bundled manifest.
- Several topics currently resolve to the same subject/track page, whose
  whitespace-collapsed text is imported in full.
- Web content is cached in `sources`; context-window recovery processes the
  complete text in bounded chunks.
- `topicId` reaches the desktop through `curriculum-resolve-topics`, but is not
  yet persisted with generated cards.

## Suggested sequence

1. Add saved LehrplanPLUS HTML fixtures for Mathematik, Deutsch, and Englisch;
   tests must never depend on the live site.
2. Introduce a provider-owned extraction function that receives the original
   HTML plus selected topic IDs and returns the complete text for each selected
   Lernbereich. Preserve headings, Kompetenzerwartungen, and grundlegende
   Wissensbestände/Begriffe.
3. Decide and implement stable topic identity in persistence. Prefer explicit
   `provider` and `topic_id` metadata over inventing URL fragments; include a
   migration and source-link fallback.
4. Extend the import transaction so proposals from several selected topics are
   deduplicated and saved atomically while each proposal keeps its precise
   source/topic mapping.
5. Wire the wizard to the new extraction/import contract, remove the Phase-2
   whole-page notice, and retain the existing direct-save behavior.
6. Add regression coverage for re-import, partial topic selection, sibling
   topics sharing one page, cache reuse, chunked LLM requests, and all seven
   locales.

## Acceptance

- Selecting one Lernbereich cannot generate cards grounded only in an
  unselected sibling Lernbereich.
- Every imported card resolves back to its provider and exact topic ID.
- Re-import creates no duplicate token or card and preserves review history.
- A failure in any selected topic leaves the batch uncommitted.
- Root tests/typecheck/lint and the desktop build pass; a manual smoke test
  covers Realschule 9 Mathematik with one and then two selected topics.
