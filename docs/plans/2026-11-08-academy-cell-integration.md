# Integrating ZAM Academy cells

How a cell published in `zam-os/zam-academy` reaches the ZAM bundle, and how
the bundled `de-by:` school cells are replaced one by one. This plan stays
until no `de-by:` school cell is bundled any more. Decisions: ADR 2026-10-19
(Academy cells), ADR 2026-08-14 Decisions 8–10 (rebuildable ids, explicit
mappings, the cell before the generic import). The package standard that
Academy authors follow is `AGENTS.md` in `zam-os/zam-academy`.

## Where it stands

ZAM 0.68.0 bundles 99 Academy cells and 127 active `de-by:` school cells.
There are 96 legacy school-cell snapshots. The Academy catalog dropped the
preview flag, so the bundle no longer marks the nine former previews.

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

- [x] Retire the school cells superseded by the nine cells of 2026-11-08, the eight earlier `C`-only Realschule cells (Geographie 8, Biologie 8, Deutsch 8, Französisch 8, Geschichte 8, Deutsch 10, Englisch 10), Mathematik 7 Realschule (`2026.11.1`, 7 A / 1 C retire / 22 C keep-active), and Deutsch 5 Realschule (`2026.11.2` preview, 8 A / 5 C retire / 3 C keep-active): 33 school cells moved to `tests/fixtures/legacy/` on 2026-11-13 (0.63.0).
- [x] Integrate the 10 new Academy cells in 0.64.0 (`biologie-realschule-5`, `biologie-realschule-6` preview, `franzoesisch-gymnasium-5`, `geographie-gymnasium-5`, `geographie-realschule-5` preview, `gpg-mittelschule-5`, `mathematik-gymnasium-7`, `mathematik-mittelschule-9`, `mathematik-mittelschule-10`, `nt-mittelschule-5`) and retire 9 superseded `de-by:` school cells (`gymnasium-5-geographie`, both `gymnasium-7-mathematik`, both `realschule-5-biologie`, `realschule-5-natur-technik`, `realschule-5-geographie`, and both `realschule-6-biologie`): all 9 moved to `tests/fixtures/legacy/` on 2026-11-14 (79 legacy snapshots total), while `realschule-6-geographie-deutschland-bayern-raum` and `realschule-7-biologie-wirbeltiere-oekologie` remain active.
- [x] Integrate the 5 new Academy cells in 0.65.0 (`biologie-gymnasium-5`, `englisch-gymnasium-5` and `informatik-gymnasium-6` with mappings approved 2026-11-14/15 and republished upstream in zam-academy#144, plus `englisch-mittelschule-5` and `nt-mittelschule-6` preview) and retire the 3 Gymnasium 5 school cells superseded by Biologie 5 Gymnasium (`gymnasium-5-biologie-mensch-skelett-sexualbiologie`, `gymnasium-5-biologie-pflanzen-bluetenbau-samen`, `gymnasium-5-natur-technik-mikroskop-experiment-oop`): 82 legacy snapshots total. `gymnasium-5-englisch-starter-grammar-tenses` and `gymnasium-6-natur-technik-informatik-vektorgrafik-texte` stay active.
- [x] Integrate ten Academy cells and move fourteen superseded school cells to
  legacy in 0.66.0. The Grade 7 German syntax, English and Geography school
  cells stay active.
- [x] Integrate ten Academy cells in 0.67.0. The mappings for Biologie 7
  Realschule, Deutsch 7 Realschule, Französisch 6 Gymnasium and Natur und
  Technik 7 Gymnasium (Informatik) transfer eleven approved review histories.
  Their source cells and the source cells considered for Physik 7 Gymnasium
  stay active.
- [x] Integrate six Grade 7 Academy cells in 0.68.0 (`bwr-realschule-7`,
  `deutsch-gymnasium-7`, `englisch-realschule-7`, `franzoesisch-realschule-7`,
  `geographie-gymnasium-7`, `geschichte-realschule-7`), bringing the bundle to
  99 Academy cells. All six mappings are approved and transfer 17 matching
  practice-item histories via `replaces` while all source `de-by:` school cells
  stay bundled for existing learners.
- [ ] Physik 10/11 Gymnasium (`physik-gymnasium-11`, `keine Stilllegung` decided) and Biologie 11 Gymnasium (`biologie-gymnasium-11` is `einfuehrungsklasse` under `isb-bayern-einfuehrungsklasse`): their 5 + 2 `de-by:` cells deliberately stay bundled and active.
- [x] Sync the withdrawn preview flags. The Academy now records teacher
  acceptance through its package versions.
- [ ] Continue replacing the 127 active `de-by:` school cells (111 Gymnasium,
  15 Realschule, 1 BOS). In Gymnasium grades 5 and 6, the active school cells
  cover English 5 and Geography and Informatics 6. Realschule's remaining
  school cells cover subjects in Grade 7, plus business accounting and optics
  in Grade 8 and economics and law in Grades 8 and 10. The BOS 10 optics cell
  also remains active.
