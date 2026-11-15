# ZAM 0.65.0 Release Notes

**Release Date:** 2026-11-15

ZAM 0.65.0 brings guided work: the agent and the learner split a real task, the learner does the hardest parts by hand, and each part ends with a colleague's review. It also adds five ZAM Academy learning packages (73 bundled Academy cells total) and retires three superseded Gymnasium 5 school cells.

## Highlights

### 1. Guided Work with Subtasks and Review (#486, ADR 2026-11-15)

- **Subtasks with an owner**: a task is split into at most nine subtasks, each owned by the learner, the agent or a colleague. The learner is asked to take the subtasks that are hardest for them and does them by hand.
- **Hand-over and colleague review**: after preparing the surroundings, the agent hands the learner's subtask over and stops. When the learner is back, the agent checks the result and reviews it like a colleague; it never asks whether they did it themselves. The review runs both ways.
- **Board kept in step**: work items are created with the environment's own tools after the learner chose, and are updated at every change so that a colleague can take over.
- **Cards only at the end**: no card step interrupts the work. At the end the agent proposes a few new cards for lasting knowledge, each asked one by one, and the learner confirms once the existing cards their own subtasks covered.
- **New `zam-work` skill and tools**: `zam_work_plan`, `zam_work_hand_over` and `zam_work_close` (also as `zam bridge work-*`). The skill ships beside the main `zam` skill in every harness. Token search now returns the learner's card id.
- **Beliefs updated**: six beliefs (session model, observation, modes, symbiosis, skill decay, bidirectional learning) now describe this way of working; card models are no longer asked for a symbiosis mode.

### 2. Five More ZAM Academy Cells (73 Bundled Total)

- **Biologie 5 Gymnasium (`2026.11.1`)**: 44 lessons, 88 items (Natur und Technik 5, Schwerpunkt Biologie); moves 4 A cards via `replaces`, retires one composite card with its history kept, and keeps 19 C cards active. The three superseded school cells `de-by:gymnasium-5-biologie-mensch-skelett-sexualbiologie`, `de-by:gymnasium-5-biologie-pflanzen-bluetenbau-samen` and `de-by:gymnasium-5-natur-technik-mikroskop-experiment-oop` leave the bundle.
- **Englisch 5 Gymnasium (`2026.11.2`)**: 40 lessons, 120 items; moves 4 A cards via `replaces` (mapping approved 2026-11-15) and keeps 4 C cards active.
- **Informatik 6 Gymnasium (`2026.11.2`)**: 12 lessons, 36 items (Natur und Technik 6, Schwerpunkt Informatik); moves 2 A cards via `replaces` (mapping approved 2026-11-15) and keeps 6 C cards active.
- **Englisch 5 Mittelschule (`2026.11.1`)**: 36 lessons, 108 items.
- **Natur und Technik 6 Mittelschule (`2026.11.2`, preview)**: 38 lessons, 114 items.

With these retirements, 82 school-cell snapshots live in `tests/fixtures/legacy/` and 141 `de-by:` school cells remain bundled.
