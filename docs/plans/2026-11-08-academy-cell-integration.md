# Integrating ZAM Academy cells

How a cell published in `zam-os/zam-academy` reaches the ZAM bundle, and how
the bundled `de-by:` school cells are replaced one by one. This plan stays
until no `de-by:` school cell is bundled any more. Decisions: ADR 2026-10-19
(Academy cells), ADR 2026-08-14 Decisions 8–10 (rebuildable ids, explicit
mappings, the cell before the generic import). The package standard that
Academy authors follow is `AGENTS.md` in `zam-os/zam-academy`.

## Where it stands

On 2026-11-08, 47 Academy cells were bundled, together with 186 `de-by:`
school cells in 123 grade/subject places. In 16 of those places an Academy
cell stands next to the school cells. 38 school cells have already left the
bundle; their snapshots are in `tests/fixtures/legacy/`. Count again when
you pick this up.

## One integration round

1. **Compare the catalog with the lock.** Read
   `https://academy.zam-os.org/catalog.json` and
   `tests/fixtures/curriculum/zam-academy-cells.lock.json`: which cells are
   new, which have a new version, and which are marked `preview`.
2. **Close the approval gap first.** For each new cell, read its
   `replaces-de-by.json`. If the mapping has A or B rows and is still
   `proposal-only`, ask Thomas to approve it *before* ZAM bundles the cell. An
   approval means a new cell version in zam-academy, in which every A/B
   successor declares `replaces`. The mapping is then `approved`, and the
   package's `validate-migration.mjs` checks the approved state (Mathematik
   5 Gymnasium is the template). Without that step, a learner can collect
   cards on the old and the new id, and zam-core then refuses the later
   install. A mapping with only C rows needs no approval.
3. **Fix content upstream, never here.** If a ZAM check refuses a cell (for
   example `tests/kernel/bundled-tiles-card-text.test.ts`), fix it in
   zam-academy with a new version, add the check to
   `scripts/validate-cells.mjs` there, merge, and wait for the Pages deploy.
   A flaky lab test can fail that deploy; rerun the failed job.
4. **Sync.** Run `npm run academy:sync`. It copies the cells byte for byte,
   updates the lock (with `preview`), and appends new cells to
   `src/kernel/library/bundled-cells.ts`. Copy each new cell's
   `replaces-de-by.json` byte for byte to
   `tests/fixtures/legacy/zam-academy-<app>-replaces-de-by.json`.
5. **Test.** Run `npm run build` first, because the CLI tests need `dist/`.
   Then add the cells to a table-driven test, as in
   `tests/kernel/zam-academy-2026-11-cells.test.ts`: version and size,
   discovery at its grade only, lesson links, exactly the approved
   `replaces`, enrolment, and the history move. Also update the full id lists
   in `tests/cli/academy.test.ts`, and the preview list in
   `tests/kernel/academy-cells-lock.test.ts`. A cell for a new school type or
   school stage may need atlas work (see the Grundschule 4 integration, #473).
6. **Describe it.** Write a paragraph in `docs/okf/token-card-model.md`
   through `upsertArticle`. Then run
   `npm run dev -- knowledge-map validate --repo . --write`.
7. **Release.** Open a PR, admin-merge it, and run the usual release flow.

## Replacing a school cell

A school cell is replaced once an Academy cell covers its place and Thomas
has approved the mapping. Its A/B cards then move to the successors. Its C
cards keep their history and stay active for learners who hold them. Then
the school cell leaves the bundle, as with Englisch 8 in #470 or Chemie 8 in #465. Move its
fixture to `tests/fixtures/legacy/`, drop its import from `bundled-cells.ts`,
and test that discovery no longer offers it. Retiring a cell is a separate
decision by Thomas for each cell. An approved mapping does not retire the
cell by itself.

## Open

- [ ] The school cells next to the nine cells of 2026-11-08 are still
  bundled: Mathematik 5, 6, 11, 12, 13 Gymnasium, Mathematik 5 and 6
  Realschule, Englisch 5 Realschule, Geographie 8 Realschule. Each needs
  Thomas's decision to retire it.
- [ ] Geographie 8: its mapping (4 C) is still a proposal.
- [ ] The Gymnasium places from grade 7 to 13 outside Mathematik have no
  Academy cell yet. The Realschule places without one include grade 7
  outside Mathematik, and grades 5 and 6 outside Mathematik and Englisch.
