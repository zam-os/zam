# ZAM 0.68.0 Release Notes

ZAM 0.68.0 adds a fast index-backed ZAM Academy browser with multi-stage navigation, filters and live search, removes the legacy curriculum wizard, fixes unblocking cards after a successful review, and bundles six new Grade 7 Academy courses.

## ZAM Academy Browser and Curriculum Wizard Removal

- **Fast index-backed Academy browser:** Opening ZAM Academy now fetches only `catalog.json` and the lightweight `academy.json` index in parallel instead of eagerly downloading individual `cell.json` bundles; a cell downloads lazily when a learner clicks „Aufnehmen“ or „Aktualisieren“.
- **Multi-stage navigation, filters and search:** Desktop Studio offers *Schulsicht* (School → Grade → Subject → Packages), *Weltwissen* (Area → Subject → Packages), direct list dropdown filters, and live search. Mobile provides a compact touch drilldown (School chips → Grade → Subject → Packages) and live search.
- **Curriculum wizard removed:** The legacy manifest-driven curriculum wizard has been retired in favor of ZAM Academy and Free Import ([ADR 2026-11-22](adr/2026-11-22-academy-index-browser-and-wizard-removal.md), [ZAM #496](https://github.com/zam-os/zam/pull/496)).

## ZAM Academy Courses

| Course | School type | Lessons | Review items |
| --- | --- | ---: | ---: |
| German 7 | Gymnasium | 50 | 100 |
| Geography 7 | Gymnasium | 23 | 46 |
| BwR 7 (tracks II and IIIa) | Realschule | 36 | 72 |
| English 7 | Realschule | 45 | 135 |
| French 7 (track IIIa) | Realschule | 54 | 162 |
| History 7 | Realschule | 41 | 123 |

The bundle now includes 99 Academy courses. When learners take the new cells, 17 matching cards carry their review histories to their Academy successors under approved `replaces` mappings (BwR 7: 4, German 7 Gymnasium: 3, English 7 Realschule: 2, French 7 Realschule: 2, Geography 7 Gymnasium: 2, History 7 Realschule: 4). Other legacy cards keep their IDs and histories.

## Review Scheduling

- Blocked cards are now released immediately after a successful review ([ZAM #495](https://github.com/zam-os/zam/pull/495)).
