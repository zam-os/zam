# Android Companion: Tauri 2 Shell with Kernel-in-WebView

**Status:** Accepted — stack and Phase-0 sync path validated on the Pixel 9
(Thomas, 2026-07-21); Pixel 6 compatibility is optional
**Deciders:** Thomas (project owner)
**Related:**
[2026-05-31b-tauri-active-recall-studio.md](2026-05-31b-tauri-active-recall-studio.md) ·
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md)

---

## Context

The Android companion app (plan: `docs/plans/2026-07-21-android-companion-app.md`)
must run active-recall sessions from the same learning state as CLI and
desktop, offline-capable, on the Pixel 9 Android 17 / API 37 reference
device. A Pixel 6 run may later lower the hardware minimum. The desktop
Studio reaches the kernel through a bundled Node-CLI bridge sidecar — that
path does not exist on Android, so the mobile shell needs its own way to run
kernel logic and reach the database.

## Decisions

- **Tauri 2 Android shell** (`mobile/`, mirroring `desktop/`): Vite/TS
  frontend, Rust core. Same stack family as the desktop Studio; Expo/
  op-sqlite remains the fallback only if the spike hits hard blockers.
- **Kernel runs in the WebView, unmodified.** The kernel is dependency-free
  TypeScript against the async `Database` contract (ADR 2026-06-09), so the
  mobile app imports `src/kernel/**` sources directly (single source of
  truth; no FSRS re-implementation).
- **New database provider over Tauri IPC** (`mobile/src/provider.ts`):
  implements the kernel `Database` contract by forwarding SQL through
  `invoke` to a Rust-owned libsql connection. Wire encoding: JSON
  primitives; blobs as `{"$blob": base64}`; bigints narrowed to safe
  integers; command errors travel as strings.
- **Sync via libsql's offline-writable synced database in Rust**
  (`mobile/src-tauri/src/db.rs`): `db_open` with URL + token builds a
  `new_synced_database` in the app-data dir; `db_sync` pushes local WAL
  frames and pulls remote changes. The initial bootstrap runs before the
  first connection, while later opens work from the local copy without
  network. Local-only development uses a separate file.
- **Android TLS uses packaged WebPKI roots.** The synced-database builder
  receives an Android-only `hyper-rustls` connector with WebPKI roots,
  avoiding reliance on native root discovery inside the Rust shared library.
- **`new_remote_replica` is insufficient for ZAM's offline requirement.**
  It delegates writes to the remote primary, so a review rating cannot be
  committed without network. Phase 0 therefore validates the synced-database
  path before review writes arrive in Phase 2.
- **Contract parity is enforced by the shared suite**: the provider runs
  `tests/helpers/db-contract.ts` against an invoke stub
  (`tests/helpers/tauri-invoke-stub.ts`) that mirrors the Rust wire
  semantics. Provider, Rust shell, and stub must change together.
- **Identifier `org.zamos.zam`**; transactions serialize through the
  provider (BEGIN IMMEDIATE … COMMIT/ROLLBACK), matching the contract's
  "nested calls deadlock by design" stance.
- **API 37 app with an API 35 native ABI baseline.** The versioned Android
  project uses AGP 9.2.1, Gradle 9.4.1, Build Tools 37.0.0, and
  min/compile/target SDK 37. Stable NDK r29 currently exposes Clang wrappers
  only through API 35, so the mobile npm scripts merge a narrow Tauri config
  override when compiling the Rust shared library. APK manifest and Java/
  Kotlin API availability remain API 37; only the native library's minimum
  ABI is lower.
- **The secret-bearing QR is an accepted field-test tradeoff.** It contains a
  long-lived database token and, when a cloud recall provider is paired, may
  also contain that provider's API key in clear text. The desktop hides the QR
  after five minutes, but this is display hygiene rather than a payload TTL or
  credential expiry. For the owner-present, two-device field test this is
  accepted; a later production pairing design should use short-lived/scoped
  database tokens or a server-mediated handshake.
- **Field-test recall is local and keyless on the phone.** The paired endpoint
  is marked `local: true`, has no API key and no cloud fallback, and is used for
  answer evaluation only. Questions remain the kernel's unchanged template
  prompts so local-model startup and inference do not delay the next card. The
  exact on-device runtime and model are selected by the Phase-6 Pixel 9 (12 GB)
  benchmark; a loopback URL in the paired config refers to the phone, not to a
  provider running on the desktop.
- **Android imports use the bridge-token contract without a Node sidecar.**
  The WebView normalizes `AddTokenRequest` JSON and quick-capture text, shows
  an editable confirmation draft, then uses kernel APIs to atomically create
  the token, paired learner's card, prerequisite edges and existing context
  assignments. A browser file input opens Android's document picker; the
  existing native plugin captures bounded `text/*` and `application/json`
  `ACTION_SEND` payloads for the same draft path.

## Validation

- [x] Synced-database build, queue render, offline write, and push/pull on
  the Pixel 9 (`aarch64-linux-android`, Android 17 / API 37).
- [x] `tauri android dev` toolchain end-to-end on the Pixel 9 (SDK/Build
  Tools 37 + NDK r29).
- [x] The Phase-1 universal debug APK declares
  `android.permission.CAMERA`; verified from the built artifact with
  `aapt2 dump permissions` on 2026-07-22. The native scanner permission flow
  was also exercised on the Pixel 9.
- [x] Phase-2 recall loop on the Pixel 9: template/manual question, typed
  answer, reveal, rating 3, FSRS update, review log, session step and summary.
  A forced process stop restored the same card and draft answer. The rating
  committed while Wi-Fi and mobile data were disabled, then reached the Turso
  test database through a manual sync after connectivity returned
  (2026-07-22).
- [x] Phase-3 import on the Pixel 9: confirmed quick capture from a text share,
  confirmed bridge-token JSON through the Android document picker, and
  editable bridge-token draft from an `application/json` stream share. Both
  confirmed cards appeared locally, then in the Turso test database after a
  manual sync with the expected question provenance (2026-07-22).

Optional follow-up: repeat kernel startup and the sync scenario on the Pixel
6. A pass lowers the supported hardware minimum; it does not gate Phase 0.

## Evidence

- `mobile/src/provider.ts`
- `mobile/src-tauri/src/db.rs`
- `mobile/src-tauri/capabilities/mobile.json`
- `mobile/src/main.ts`
- `mobile/src/import.ts`
- `mobile/src/review-session.ts`
- `mobile/src-tauri/gen/android/app/src/main/AndroidManifest.xml`
- `mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/SecurePairingPlugin.kt`
- `tests/mobile/tauri-provider.test.ts`
- `tests/mobile/import.test.ts`
- `tests/mobile/import-wiring.test.ts`
- `tests/mobile/review-session.test.ts`
- `tests/helpers/tauri-invoke-stub.ts`
- Pixel 9 field check, 2026-07-21: API-37 APK installed; the unmodified
  kernel rendered one synced due-queue item; with no active default network,
  an offline ULID write was committed locally and appeared in the Turso test
  database after reconnect + `db_sync`; Android reported a 273 ms cold app
  start. Credentials and the local replica cache are intentionally excluded
  from the repository.
