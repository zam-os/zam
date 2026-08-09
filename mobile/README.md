# ZAM Mobile (iOS + Android)

Tauri-2 shell whose WebView runs the unmodified TypeScript learning kernel.
Rust owns the database connection.

**On Android and iPadOS this is a standalone app**, not a companion
([ADR 2026-08-08](../docs/adr/2026-08-08-ios-standalone-app.md),
[ADR 2026-08-09](../docs/adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)):
first run provisions a device-local SQLite library — no account, no network,
no desktop — and a server database is an upgrade the learner chooses later.
QR pairing survives as a *takeover* path ("I already use ZAM on a computer"),
not as the entrance.

## What a learner can do on the device

- **First run**: language, what they are learning for, done. Three starter
  cards explain active recall, spaced repetition and honest rating, and are
  learned like any other card.
- **Review**: typed or spoken, full-screen, with FSRS scheduling.
- **Library**: search (full text always, by meaning when an AI model is
  connected), edit, pause, delete.
- **AI**: one field, one button. An OpenRouter key covers answer feedback,
  photo import *and* embeddings — the provider serves all three from the same
  key.
- **Multiple devices**: move the whole library onto a Turso database from
  Settings. The local copy stays as a backup.
- **Statistics**, daily reminders, de/en.

Not on the device: the OKF reader, the Observer, agent connect, workspaces,
the knowledge graph and the LehrplanPLUS wizard. Those stay desktop.

## Layout

- `src/provider.ts` — kernel `Database` contract over Tauri IPC. Wire
  encoding (blobs as `{"$blob": base64}`, errors as strings) is mirrored
  by `src-tauri/src/db.rs` and `tests/helpers/tauri-invoke-stub.ts`; change
  all three together.
- `src/main.ts` — screen wiring. Still large; navigation, first run and the
  design system are extracted (`src/ui/`, `src/setup/`), the functional blocks
  are not (see ADR 2026-08-08b).
- `src/ui/` — design system and navigation. `tokens.css` carries the palette,
  the type scale and Dynamic Type; `nav.ts` owns the two navigation levels.
- `src/setup/` — first run (`first-run.ts`, `wizard.ts`) and the move to a
  server database (`upgrade.ts`).
- `src/ai/` — cloud model connect and embeddings.
- `src/library.ts` — the learner's own cards: search, edit, pause, delete.
- `src-tauri/src/db.rs` — libsql connection. Opens a device-local file by
  default, or an online-only remote when credentials are given; `db_describe`
  tells the WebView which, because the two are not interchangeable to a
  learner.
- `src-tauri/src/secure_store.rs` and `SecurePairingPlugin.kt` — Tauri bridge
  to AES-GCM credential storage backed by Android Keystore.

## Local checks

```bash
cd mobile
npm ci
npm run build
cd src-tauri
cargo test --locked
```

The root `validate` job runs the provider contract suite. The `mobile` CI job
also compiles `aarch64-linux-android`, so Android-only Rust and plugin setup
cannot silently drift.

## Run on Android 17

One-time setup on the development machine:

1. Install Android Studio (or command-line tools) with **SDK Platform 37**,
   **Build Tools 37.0.0**, platform-tools, and stable **NDK r29**.
2. `rustup target add aarch64-linux-android`.
3. `cd mobile && npm ci`. The generated Android project under
   `src-tauri/gen/android` is versioned because API-37 support currently
   requires Gradle customizations; do not regenerate it casually.

Android 17 requires min/compile/target SDK 37. The stable NDK r29 exposes
native Clang wrappers through API 35, so `android:dev`/`android:build` merge
`src-tauri/tauri.native-api35.conf.json` for Rust while the resulting APK
remains min/compile/target SDK 37.

With USB debugging enabled:

```bash
npm run android:dev -- --target aarch64
```

On first run, choose the language and learning context; ZAM creates the local
library and three starter cards directly on the Android device. No permission,
account or network is required. To take over an existing server-backed library
instead, choose **I already use ZAM on a computer**, show its QR code in ZAM
Desktop and scan it. The QR contains live secrets and automatically disappears
after five minutes; avoid shoulder surfing and prefer a database-scoped token.

## Run on iPad / iPhone

Requires **full Xcode** (Command Line Tools alone is not enough — `xcrun
--sdk iphoneos` must resolve) plus CocoaPods and xcodegen:

```bash
brew install cocoapods xcodegen
```

Then:

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
cd mobile && npm ci && npx tauri ios init
npm run ios:dev
```

`src-tauri/gen/apple` is versioned **except** its `.xcodeproj`, which
`tauri ios init` regenerates from `project.yml`. Put iOS settings in
`project.yml` (it regenerates `Info.plist`), never in the Xcode UI.

The Swift plugins live in the SwiftPM package at **`src-tauri/ios/`**, not in
the Xcode app target — the Rust staticlib links before Swift compiles, so
`@_cdecl` symbols in the app target are invisible to it. `build.rs` stages the
Tauri Swift API into `src-tauri/.tauri/` (generated, ignored) and links the
package via `tauri_utils::build::link_apple_library`.

Deploying to a physical device needs a paid Apple Developer Program membership
and `APPLE_DEVELOPMENT_TEAM` set to your team ID. Free personal-team
provisioning expires after 7 days and is not a supported path here.

`NSCameraUsageDescription` is required for the optional QR takeover path: iOS
terminates the app on first camera access without it.

### Platform differences from Android

| Capability | Android | iOS |
| --- | --- | --- |
| Credential store | Keystore + AES-GCM envelope | Keychain (`SecurePairingPlugin.swift`) |
| Daily reminder | WorkManager, count read at fire time | `UNCalendarNotificationTrigger`, count baked in at schedule time |
| On-device evaluation | Gemini Nano (AICore) | none — no supported iPad or iPhone in the field-test range meets the Apple Intelligence floor |
| Voice mode | foreground service | not ported |
| Share-sheet capture | `ACTION_SEND` intent | not ported (needs a Share Extension) |
| Updates | APK sideload + `mobile-latest.json` | TestFlight |

## Current boundary

The mobile app supports standalone local libraries, optional pairing, offline
review (typed + voice), import, sync hardening, daily reminders, de/en UI,
on-device evaluation (Gemini Nano), and a **GitHub Releases sideload update
channel**.

### Distribution / updates

1. **First install**: download `ZAM_Mobile_<version>_aarch64.apk` from the
   GitHub Release (or `adb install` a local build).
2. **Later updates**: Settings → App-Update, or automatic quiet check on
   launch. The app fetches
   `https://github.com/zam-os/zam/releases/latest/download/mobile-latest.json`,
   downloads the APK, and opens the system installer.
3. **CI**: tag `v*` runs `publish-android` in `.github/workflows/release.yml`.
   Optional secrets for a stable field-test keystore:
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
   `ANDROID_KEY_PASSWORD`. Same key is required for in-place updates.

Screenshot import is not in this build.

On **iOS there is no sideload channel at all**: `publish-ios` in
`release.yml` builds with `--export-method app-store-connect` and uploads to
TestFlight via `altool`. It needs `IOS_CERTIFICATE`,
`IOS_CERTIFICATE_PASSWORD`, `IOS_MOBILE_PROVISION`, `APPLE_DEVELOPMENT_TEAM`,
`APPLE_API_KEY`, `APPLE_API_ISSUER`, and `APPLE_API_KEY_CONTENT`, and skips
with a warning when they are absent.
