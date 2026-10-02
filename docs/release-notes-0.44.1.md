# ZAM 0.44.1 — Fairer choice options

A patch release for the Choice and Auto modes. A choice no longer borrows its
wrong options from the answers of your other cards unless you ask for it.
Nothing here changes the schema; installs update in place.

## Choice and Auto

- **No more options from your other cards by default.** When a card had no
  options of its own, a choice filled the wrong ones with answers of other
  cards you had already studied. Those were easy to see through: you
  recognised them as answers to other questions and could pick the
  remaining option without knowing it. A choice now uses only a card's own
  fast check, options shipped with a knowledge tile, or options written by
  your AI model. A card without any of these is asked without options.
- **Still available if you want it.** Under the advanced learning settings,
  in the Studio and on Mobile, "Choice may use answers from your other
  cards" turns the old behaviour back on. It is off for everyone, including
  learners who used Choice or Auto in 0.44.0.

## Notes

- No schema change; nothing to migrate.
- Without an AI model connected, cards without their own options are now
  asked in Flash (Choice) or free recall (Auto) more often. Turn the setting
  above on if you prefer options from your other cards to no options.
- Updating from 0.44.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.44.1`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
