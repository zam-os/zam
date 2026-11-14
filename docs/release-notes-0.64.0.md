# ZAM 0.64.0 Release Notes

**Release Date:** 2026-11-14

ZAM 0.64.0 pairs ten additional ZAM Academy learning packages (68 bundled Academy cells total) and the retirement of 9 superseded `de-by:` school cells with the redesigned free/AI/developer mode experience and Studio Learning Content improvements.

## Highlights

### 1. Ten More ZAM Academy Cells (68 Bundled Total)

Ten new curriculum packages join the offline bundle via `npm run academy:sync`, together with approved history-preservation mappings:

- **Geographie 5 Gymnasium (`2026.11.1`)**: 44 lessons, 88 items (`lehrplanplus-bayern`, grade 5); moves 3 A cards via `replaces` and keeps 5 C cards active while retiring `de-by:gymnasium-5-geographie-erde-gradnetz-orientierung`.
- **Französisch 5 Gymnasium (`2026.11.1`)**: 40 lessons, 120 items (`lehrplanplus-bayern`, grade 5); regular publication with an empty `replaces-de-by.json`.
- **Mathematik 7 Gymnasium (`2026.11.2`)**: 44 lessons, 132 items (`lehrplanplus-bayern`, grade 7); moves 4 A cards via `replaces` and keeps 8 C cards active while retiring both grade-7 Mathematik school cells.
- **Biologie 5 Realschule (`2026.11.1`)**: 25 lessons, 50 items (`lehrplanplus-bayern`, grade 5); moves 5 A cards via `replaces` and keeps 19 C cards active while retiring `de-by:realschule-5-biologie-mensch-skelett-bewegung-organe`, `de-by:realschule-5-biologie-pflanzen-bluetenbau-samen`, and `de-by:realschule-5-natur-technik-mikroskop-experiment-dateien`.
- **Geographie 5 Realschule (`2026.11.2`, preview)**: 31 lessons, 62 items (`lehrplanplus-bayern`, grade 5); moves 6 A cards via `replaces` and keeps all 10 C cards active; retires `de-by:realschule-5-geographie-erde-gradnetz-orientierung` while keeping `de-by:realschule-6-geographie-deutschland-bayern-raum` active.
- **Biologie 6 Realschule (`2026.11.2`, preview)**: 30 lessons, 60 items (`lehrplanplus-bayern`, grade 6); moves 3 A cards via `replaces` and keeps all 37 C cards active; retires both grade-6 Biology school cells while keeping `de-by:realschule-7-biologie-wirbeltiere-oekologie` active.
- **Mittelschule GPG 5, NuT 5, Mathematik 9, and Mathematik 10**:
  - `gpg-mittelschule-5` (`2026.11.1`): 34 lessons, 68 items
  - `nt-mittelschule-5` (`2026.11.1`): 32 lessons, 64 items
  - `mathematik-mittelschule-9` (`2026.11.1`): 40 lessons, 80 items with `R` (`regelklasse`) and `M` (`mittlere-reife-klasse`) track matching
  - `mathematik-mittelschule-10` (`2026.11.1`): 35 lessons, 70 items

With the retirement of the 9 superseded `de-by:` school cells to `tests/fixtures/legacy/` (79 archived school-cell snapshots total), 144 `de-by:` school cells remain bundled and zero `de-by:realschule-5-*` school cells remain.

### 2. Free Mode, AI Cascade & Studio Usability (#483)

- **Settings & Onboarding Mode Cascade**: Free mode (`Kostenlos`) works without an API key; AI features unlock behind the AI mode switch, and Developer mode (`Entwickler`) installs the `zam` CLI and deploys workspace skills only when enabled on top of AI mode.
- **Curriculum First-Run Offer**: Offers the Bavarian school curriculum during onboarding while non-Academy local cells are still bundled (`hasNonAcademyCurriculumCells`).
- **Offline Study & Fast-Check Polish**: Hides AI-only actions ("Nachfragen" and "Meine Antwort stimmt auch") in non-AI mode when reviewing non-AI-generated options.
- **Learning Content Editor**: Displays the card title (or question as fallback) in the card list instead of the answer text, and pins the detail pane sticky so it stays visible while scrolling long card lists.
