# ZAM 0.16.0 — Curriculum imports that stay out of the way

Curriculum imports are now easier to follow, faster with cloud AI, and ready
for the next run as soon as an import finishes. New cards also carry a compact
subject/grade/topic category, so a learner can focus the Studio on the year
they are currently studying.

## Highlights

- **The curriculum assistant remains reusable**
  ([#200](https://github.com/zam-os/zam/pull/200)). Closing or completing an
  import now clears transient loading state, restores navigation, and ignores
  stale background results. The next assistant run starts cleanly instead of
  remaining stuck in the previous import state.

- **Useful progress during long generation**
  ([#200](https://github.com/zam-os/zam/pull/200)). The wizard shows the current
  topic or save step together with a continuously updated elapsed time. Its
  wording is model-neutral: card generation can take several minutes per topic
  with local or cloud AI. Independent competence units use bounded concurrency
  for cloud providers; local providers remain sequential.

- **All preview cards selected by default**
  ([#200](https://github.com/zam-os/zam/pull/200)). The final preview starts
  with every card selected, displays the selected count, and provides one
  control to select or deselect the complete set.

- **Categories that follow the learner's year**
  ([#200](https://github.com/zam-os/zam/pull/200)). New curriculum cards use a
  compact hierarchy such as `Mathematik/9/Systeme linearer Gleichungen`.
  Country, state, and school type stay implicit. The Learning Content Studio
  exposes subject, grade, and topic as hierarchical filters, so `Mathematik ›
  9` shows exactly that year's imported material.

## Notes

- Existing cards keep their stored category. This release does not rewrite
  previously imported flat domains such as `Mathematik`; new curriculum
  imports use the hierarchy automatically.
- The flow was live-tested in ZAM Desktop with Realschule 9 Mathematik II/III
  and the current cloud-AI configuration, including preview, bulk selection,
  saving, reopening the assistant, and filtering the resulting cards.
