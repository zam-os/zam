# ZAM 0.45.0 — Library topics

A colleague who joins a team library now has a way in. The library's
knowledge was always shared, but cards are personal, so a newcomer started
with an empty queue and nothing showed them what the library held. Library
topics list that content by source and turn a topic into your own cards in
one click. This release also fixes the onboarding goal step, which dropped
the cards it had drafted when you left it with **Next**.

## Library topics

- **See what the library holds.** **Library Topics** in Learning Content
  lists one topic per source the library's cards come from — usually one
  per imported knowledge article — with how many of its cards you already
  have. The numbers are yours only; nobody sees which topics you started or
  how you do.
- **Start a topic in one click.** **Start learning** creates your own cards
  for that topic. They join your reviews over the next days, paced by your
  daily limit for new cards. Starting it again later adds only the cards
  that were added to the topic since, and a card you set aside as "not for
  me" stays set aside.
- **No curator rights needed.** Starting a topic writes nothing but your own
  learning state, so every member of a team library can do it — including
  members added without curator rights.
- **A clear first step.** When your deck is empty and the library holds
  topics, the dashboard offers **Start with the library's topics**.
- **Everywhere the Studio runs.** The same dialog works in the desktop app
  and in the Studio panel of VS Code and other MCP Apps hosts. Agents and
  scripts use `zam bridge library-topics-list` and
  `zam bridge library-topic-start --key <key>`.

## Fixes

- **Goal step keeps your drafted cards.** In onboarding (and Goal Import),
  leaving the goal step with **Next** now imports the ticked cards instead of
  discarding them. If saving fails, you stay on the step with the error;
  **Skip** still leaves without importing.

## Worth knowing

- No schema change; nothing to migrate, and team libraries need no
  `zam team provision` run for this release.
- A topic is named after its source file — `rest-api-basics.md` reads
  "Rest api basics". Curated topic names, bundles across articles, required
  topics and an export for other teams are planned (ADR 2026-10-02).
- Design note: ADR 2026-10-02; current behaviour in
  `docs/okf/token-card-model.md` and `docs/team-library.md`.
- Updating from 0.44.1: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.45.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
