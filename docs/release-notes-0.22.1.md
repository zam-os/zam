# ZAM 0.22.1 — iOS ships from the pipeline

A release-plumbing fix. **Nothing about the product changed** — see
[0.22.0](release-notes-0.22.0.md) for what iPadOS support actually does.

In 0.22.0 every artefact published except the iOS build: desktop on four
platforms, the Android APK, the VS Code extension and the npm package all
succeeded, and `publish-ios` failed. This release makes that job work.

## What was wrong

- **The release job never generated the Xcode project.** `gen/apple/*.xcodeproj`
  is deliberately unversioned — it is pure xcodegen output from `project.yml` —
  and the `ios` CI job regenerates it with `tauri ios init`. The release job was
  missing that step and failed with `failed to locate xcodeproj`. The CI gate
  stayed green precisely because it created the file itself.

- **`DEVELOPMENT_TEAM` was written outside the settings block.** Tauri injects
  it into the generated `project.pbxproj` by text insertion, and placed it
  *after* the closing brace of `buildSettings`, where Xcode ignores it —
  `Signing requires a development team that matches the selected profile`.
  Giving the key an anchor in `project.yml` fixes it: when the key already
  exists, Tauri cleanly overwrites only its value, which is why
  `PROVISIONING_PROFILE_SPECIFIER` had worked all along. The value in the repo
  is only a default; `APPLE_DEVELOPMENT_TEAM` overrides it.

Only the second one would have survived a green CI run, and it was found by
building locally rather than by any gate.

## Status of the iOS build

It compiles, signs and exports a valid App Store IPA (`org.zamos.zam`,
minimum iOS 17.0, chain Apple Distribution → WWDR → Apple Root CA). It has
still **not been installed on a device**, and TestFlight distribution remains
unproven end to end — this release is the first run that exercises it.
