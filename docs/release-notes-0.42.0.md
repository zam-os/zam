# ZAM 0.42.0 — Goals that survive a busy model

A learner's goal import failed with a cryptic parse error when the cloud
model behind it was momentarily rate-limited. This release makes the goal
step as robust as the answer feedback already is: a busy model hands over to
the next one, a cut-off reply is retried, and when nothing can serve, the
message says why. The Android APK is back in the release, and the release
run itself can no longer split its files across two drafts.

## Learning goals

- **A rate-limited model no longer fails your goal.** The goal breakdown
  used to stop with *Invalid goal decomposition response: JSON array
  brackets not found* when the provider answered "temporarily rate-limited"
  in a way ZAM did not recognise. That answer is now read for what it is:
  the next configured model takes over, exactly as it does for answer
  feedback.
- **A cut-off breakdown is retried.** Reasoning models spend part of the
  reply budget thinking before they write. If that leaves no room for the
  breakdown, ZAM asks once more with a larger allowance instead of failing.
- **Clear reasons when nothing can serve.** If every configured model is
  busy or refuses, the goal step now shows the provider's own message —
  not an empty-response or parse error. The same applies to answer
  feedback, follow-up discussion and curriculum import.

## Release plumbing

- **Android APK is back.** The 0.41.0 release shipped without it after a
  change in Google's SDK repository broke the build step; fixed.
- **One draft per release.** The desktop builds no longer race to create
  the GitHub draft, so every installer and the updater manifest land on the
  same release.

## Notes

- No changes to the study view, the Recall card or scheduling in this
  release; 0.41.0's idle-aware study time and busy overlay are unchanged.
- The mobile companions and the VS Code companion are rebuilt with the
  version bump only.
