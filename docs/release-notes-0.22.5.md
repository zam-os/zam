# ZAM 0.22.5 — the iPad build stops promising what it does not have

Everything in this release comes from one hour with the app on a real iPad.
Nothing here was visible from a compiler, a test suite or CI.

## Fixed

- **Cloud evaluation of answers.** It failed with *"evaluation endpoint
  returned empty content"*, which reads like a broken endpoint and was not
  one. The mobile app allowed the model 256 tokens for an evaluation the
  desktop gives 1200 — a verdict, feedback, a reference answer and a list of
  gaps do not fit, and a reasoning model spends part of that budget before
  writing any of it. Every answer was cut off, and nothing checked for
  truncation, so it was reported as an empty one. Both are fixed: the budget
  now lives next to the prompt that determines it, and a truncated answer says
  so.
- **Voice mode no longer appears on iPadOS.** It is Android-only. iOS reported
  it as a *denied microphone permission*, which sent people looking through
  Settings for a switch that does not exist.
- **"Check for updates" no longer appears on iPadOS.** iOS has no sideload
  channel; TestFlight does the updating, and the app now says so instead of
  offering a button that fails.
- **Settings show the real version.** An 0.22.4 build reported 0.19.0, because
  the number came from a crate version that release bumps do not touch. It now
  comes from the app bundle, which cannot drift.

## Changed

- **The minimum supported device is now the iPad (9th generation, A13)**,
  lowered from the iPhone 14. It is the weaker device in every dimension that
  matters, and the app is confirmed to install, launch and pair on it. This
  says nothing about phones: an iPhone 11 has the same chip, but nothing has
  run there, and a 390pt phone is a different layout question from an 810pt
  tablet.

## Unchanged

Android, the kernel and the desktop app. The macOS app stays signed and
notarized as of [0.22.4](release-notes-0.22.4.md).
