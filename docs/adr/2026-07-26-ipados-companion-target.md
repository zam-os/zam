# iPadOS Companion: Second Mobile Target on the Existing Tauri Shell

**Status:** Accepted — scope and distribution decided (Thomas, 2026-07-26).
Not yet validated on hardware: no build has run on a device, and the Swift
plugins have never been compiled. **Supersedes the "iOS" and
"tablet/large-screen layouts" non-goals** in
`docs/plans/2026-07-21-android-companion-app.md`.
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-21-android-companion-tauri-shell.md](2026-07-21-android-companion-tauri-shell.md) ·
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md)

---

## Context

The Android companion listed iOS as an explicit v1 non-goal, with the note
that the stack choice "keeps the door open". That door now has to open.

The primary field-test learner — a ninth-grade Realschule student in Bavaria —
is in a **Tablet-Klasse** ([tabletklasse.de](https://tabletklasse.de/)). The
school issues an **iPad (A16, 11th generation)** to every student in the
programme, subsidised at €350 per device under the Bavarian scheme, and that
iPad is the device physically carried to every lesson. The learner has already
used one for a full school year in grade 8.

This inverts the platform priority that the Android plan assumed. The Android
companion was built around a phone the learner *also* owns; the iPad is the
device the school day is actually built on. A learning tool that is not on it
is a tool used in the evening at best, and the whole premise of the field test
is that reviewing due cards has to be effortless and daily.

Tablet form factor is a second, independent reason: the existing UI is a
420×800 phone layout, and the plan deferred large-screen work.

## Decisions

### 1. Second target on the same Tauri shell, not a second app

`tauri ios init` generates `mobile/src-tauri/gen/apple` alongside the existing
`gen/android`. The TypeScript frontend, the kernel-in-WebView arrangement, and
the libsql/IPC provider are shared verbatim. No kernel or frontend logic forks
per platform.

### 2. `cfg(mobile)` replaces `cfg(target_os = "android")` where behaviour is shared

Tauri already injects a `mobile` cfg meaning android-or-iOS. `secure_store` and
`reminder` now gate on `cfg(mobile)` and differ only at plugin registration
(`register_android_plugin` vs `register_ios_plugin`). Their `not(mobile)` stubs
still serve desktop builds. Cargo target specifications cannot see Tauri's
injected cfg, so `Cargo.toml` spells out
`cfg(any(target_os = "android", target_os = "ios"))` for `hyper-rustls`.

### 3. Scope of the first increment: the Android Phase-0 set, no more

In scope: QR pairing with Keychain-backed credential storage, libsql sync,
offline typed review, de/en UI, local daily reminders, responsive tablet layout.

Deliberately **not** ported, each for a platform reason rather than a time
reason:

- **On-device evaluation.** Android uses Gemini Nano through AICore on the
  Tensor NPU. Neither target Apple device can host an equivalent: the iPad
  (A16) and the iPhone 14 (A15) are both below the A17 Pro / M-series floor
  for Apple Intelligence, so the Foundation Models framework is unavailable.
  Evaluation on iOS therefore uses a configured cloud endpoint, or falls back
  to self-rating. This is a hardware fact, not a scheduling decision — it does
  not change when the app matures.
- **Voice mode.** A Swift `SFSpeechRecognizer`/`AVAudioEngine` port comparable
  in size to the original Android voice work, with different
  foreground/background semantics. Deferred to its own increment.
- **In-app update.** iOS has no sideload channel. See decision 5.
- **Share-sheet quick capture.** Requires a separate Share Extension bundle
  target. `takeShared` resolves null on iOS.

### 4. Reference and minimum devices

- **Reference: iPad (A16, 11th generation)** — the Tablet-Klasse device, the
  one that has to work.
- **Minimum: iPhone 14** — an A15 phone at 390pt, narrower than any Android
  device the layout was validated on. *Not yet secured as a test device.*
- **Deployment target: iOS/iPadOS 17.0.** The iPad ships 18.3 and cannot go
  lower, so 17.0 is headroom for the iPhone, and hedges against a
  school-managed device having OS updates deferred by MDM.

### 5. Distribution is TestFlight, via a paid Apple Developer Program membership

There is no iOS equivalent of the APK + `mobile-latest.json` sideload channel.
The alternatives were weighed and rejected:

- **Free personal team provisioning** — the build expires after 7 days and must
  be re-signed with the device attached to the Mac. Unusable for a learner's
  device.
- **Ad-hoc distribution** — requires registering each UDID and still no update
  path.

`publish-ios` in `release.yml` builds with `--export-method app-store-connect`
and uploads with `altool`. It skips cleanly when `IOS_CERTIFICATE` is absent,
because unlike Android there is no useful unsigned artifact to fall back to.

### 6. CI is the compile gate, because contributors need not own Xcode

The `ios` job on `macos-15` runs `cargo check --target aarch64-apple-ios`, then
builds against the **simulator** SDK with `CODE_SIGNING_ALLOWED=NO`. That
compiles the Swift plugins without any signing secret, so the gate works on
fork pull requests. This mirrors the `mobile` job's role for Android-only Rust.

### 7. Tablet layout: wider column, not a redesign

Breakpoints at 700px and 1000px widen the reading column to 680/760px, increase
padding, and put all four FSRS ratings on one row. The column stays deliberately
narrow — a full 11" measure hurts recall prompts. iPad multitasking is left
enabled (no `UIRequiresFullScreen`), which is a feature on a school device where
ZAM sits beside a textbook PDF.

## Consequences

- `NSCameraUsageDescription` is **required**, not cosmetic: QR pairing is the
  entire first-run path (FR-0) and iOS terminates the app on first camera
  access without it. It is set in `project.yml`, which regenerates `Info.plist`.
- The iOS daily reminder shows the due count **as of the last time the app was
  open**, not as of fire time. iOS has no WorkManager equivalent that can
  compute at delivery. The count only grows while the app is closed, so the
  reminder understates rather than nags falsely.
- `gen/apple` is versioned, but its `.xcodeproj` is not — every iOS
  customization lives in `project.yml` or hand-written Swift, so the xcodegen
  output would be churn. This deliberately differs from `gen/android`, which is
  versioned wholesale because its API-37 customizations live in generated files.
- Two reminder notification strings now exist in two languages of
  implementation (Kotlin and Swift). They must be changed together.

## Risks

- **MDM / supervised device (highest).** Bavarian Tablet-Klasse iPads are
  typically enrolled in Apple School Manager and supervised. A supervised
  device can have App Store and TestFlight installation blocked outright by
  policy, in which case no amount of engineering puts ZAM on that iPad. The
  school's parent letters and Infoabend do not state the policy publicly.
  **Check `Settings → General → VPN & Device Management` on the actual device
  before investing further.** Fallbacks if blocked: request distribution
  through the school's Apple School Manager, or serve the WebView frontend as
  a browser-based PWA needing no install.
- **App-local Swift plugins do not link — confirmed by CI, not yet fixed.**
  `SecurePairingPlugin.swift` and `ReminderPlugin.swift` were first written
  into `gen/apple/Sources/zam-mobile/`, which puts them in the Xcode app
  target. That does not work: the Rust staticlib links *before* Swift is
  compiled, so `ios_plugin_binding!`'s `extern "C"` declarations resolve to
  nothing and the build fails with

  ```
  Undefined symbols for architecture arm64:
    "_init_plugin_reminder"
    "_init_plugin_secure_pairing"
  ```

  This is the iOS/Android asymmetry: Android loads `SecurePairingPlugin.kt`
  reflectively by class name at runtime, so compiling it into the APK is
  enough. iOS needs the symbol at **link** time.

  **Fixed** by moving the Swift into a SwiftPM package at
  `mobile/src-tauri/ios/` that the Rust build links. `build.rs` reproduces what
  `tauri_plugin::Builder::ios_path()` does for real plugin crates — stage the
  Tauri Swift API from `DEP_TAURI_IOS_LIBRARY_PATH` into `.tauri/tauri-api`,
  then call `tauri_utils::build::link_apple_library`. Promoting both plugins to
  full plugin crates was the alternative; it was rejected because it would
  namespace the commands and change the WebView contract, where this keeps
  every command exactly where it was.

  Verified locally: host and `aarch64-linux-android` still compile, and the
  `tauri-utils` `build-2` feature unifies with what `tauri-build` already
  enables (one added lock line). **The Swift itself still needs CI to compile
  it** — there is no Xcode on the authoring machine.
- Apple Developer Program membership is an ongoing €99/yr cost, and TestFlight
  builds expire after 90 days, so a dormant field test needs periodic rebuilds.

## Citations

- `docs/plans/2026-07-21-android-companion-app.md`
- `mobile/src-tauri/ios/` (Swift plugin package) and `mobile/src-tauri/build.rs`
