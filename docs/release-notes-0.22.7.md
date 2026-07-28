# ZAM 0.22.7 — evaluations answer in your language

Feedback on an answer came back in English, whatever language the learner was
working in. The prompt that asks a model to evaluate an answer is written in
English and never said which language to reply in, so the model used the one
it was addressed in.

It now names the language, and the mobile app takes that language from
`system.locale` in the database — the same learner setting the desktop reads,
so changing it in one place changes it everywhere. An unpaired or offline
start falls back to the device language.

The command-line path was never affected; it has always named the language in
its own prompt. What went wrong is that the studio panel and the mobile app
share a *different* prompt builder, and that one had no language at all.

## Unchanged

Everything else from [0.22.6](release-notes-0.22.6.md): the desktop layout
fixes, the iPad fixes, and the signed and notarized macOS build.

## Still unproven

Whether the model actually obeys the instruction has only been checked against
the prompt, not against a real evaluation on a device. That is the next thing
to confirm.
