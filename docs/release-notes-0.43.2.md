# ZAM 0.43.2 — Honest card counts and sturdier model endpoints

A patch release. Splitting a card and suggesting foundations now let the
content decide how many cards come out, and adding a model endpoint checks
each capability against the right part of the provider's catalogue. Nothing
here changes the schema; installs update in place.

## Card suggestions

- **A split proposes as many cards as the card holds.** Splitting a
  too-detailed card came back with four cards almost every time, because the
  prompt asked for "2 to 4". The model now names the distinct ideas first and
  proposes exactly one card per idea, never padding. A card with five ideas
  can now be split into five — including a fifth card added by hand in the
  split dialog, which used to be rejected.
- **Suggest Foundations can propose a single card.** When exactly one
  prerequisite is missing, it no longer invents a second one to reach a
  minimum of two.

## Adding models

- **Speech capabilities are checked against the right catalogue.** Some
  providers list transcription and voice models in separate catalogues. A
  model whose name suggested both could be accepted as a voice on the strength
  of the transcription listing. Each capability is now verified against the
  listing for that capability, and a model whose name also reads as an
  embedding model still gets its speech lookups.
- **Cleaner "not offered" message.** When the endpoint does not offer the
  model you typed, the list of models it does offer no longer repeats entries.
- **Endpoint addresses with parameters work.** An address that already
  carries parameters — the Azure-style `…/v1?api-version=…` — had every route
  (chat, speech, embeddings, model list) appended inside those parameters, so
  the request went to the wrong place. Routes are now added to the address
  path and the parameters are kept, on the desktop, in the CLI and in the
  mobile companion.

## Notes

- No schema change; nothing to migrate.
- Updating from 0.43.1: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.43.2`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
