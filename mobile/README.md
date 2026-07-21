# ZAM Mobile (Android companion, Phase 0 spike)

Walking skeleton for the Android companion app defined in
[`docs/plans/2026-07-21-android-companion-app.md`](../docs/plans/2026-07-21-android-companion-app.md):
a Tauri 2 shell whose WebView runs the **unmodified TypeScript kernel**
against a new database provider, while the Rust side owns a libsql database
— a plain local file or an **offline-writable synced copy** of the server
database.

What the spike proves (Phase 0 checklist):

- [x] Kernel-in-WebView: `buildReviewQueue` renders the due queue on an
  Android 17 device without kernel changes (Pixel 9 development device;
  Pixel 6 remains the hardware-floor gate).
- [x] Synced database: `db_open` with a `libsql://` URL + token syncs a
  test server database onto the device; "Neu syncen" pushes local and pulls
  remote changes.
- [x] Offline write: without an active default network,
  "Offline-Schreibtest" stores a local ULID row; after reconnect + "Neu
  syncen" the row reaches the test server.
- [x] Provider contract: `tests/mobile/tauri-provider.test.ts` passes
  (runs in CI; the invoke stub mirrors the Rust wire semantics).
- [x] Dedicated mobile CI builds the frontend and runs the Rust tests.

## Layout

- `src/provider.ts` — kernel `Database` contract over Tauri IPC. Wire
  encoding (blobs as `{"$blob": base64}`, errors as strings) is mirrored
  by `src-tauri/src/db.rs` and `tests/helpers/tauri-invoke-stub.ts`;
  change all three together.
- `src/main.ts` — spike UI: connect form → sync → due-queue list.
- `src-tauri/` — Rust shell: `db_open/db_query/db_execute/db_execute_batch/
  db_sync/db_close` commands around one libsql connection.

## Run on the desktop host (no Android toolchain needed)

```bash
cd mobile
npm install
npm run tauri dev        # opens a desktop window; same IPC path as Android
```

Useful checks: `npm run typecheck` here, and from the repo root
`npm run mobile:check` (cargo) and `npm test` (provider contract).

## Run on Android 17

One-time setup on the development machine:

1. Install Android Studio (or command-line tools) with **SDK Platform 37**,
   **Build Tools 37.0.0**, platform-tools, and stable **NDK r29**; export
   `ANDROID_HOME` and `NDK_HOME`.
2. `rustup target add aarch64-linux-android armv7-linux-androideabi \
   i686-linux-android x86_64-linux-android`
3. `cd mobile && npm install`. The generated Android project under
   `src-tauri/gen/android` is versioned because API-37 support currently
   requires Gradle customizations; do not regenerate it casually.

Android 17 requires min/compile/target SDK 37 for the app, while the stable
NDK r29 only exposes native Clang wrappers through API 35. The
`android:dev`/`android:build` scripts merge
`src-tauri/tauri.native-api35.conf.json` so Tauri compiles the Rust shared
library against native API 35; the versioned Gradle app and resulting APK
remain min/compile/target SDK 37.

On the phone: enable developer options + USB debugging, connect via USB,
then:

```bash
npm run android:dev -- --target aarch64
```

In the app, either "Nur lokal öffnen" (empty local database) or paste the
URL + token of a **test** server database and "Sync-Datenbank verbinden".
The two modes use separate files so a development-only local database can
never be mistaken for sync metadata.

To validate the offline-write path, connect and sync once, disable Wi-Fi and
mobile data (or enable airplane mode), tap "Offline-Schreibtest", then
restore the network and tap "Neu syncen". Confirm the new ULID in the test
server's `mobile_phase0_probe` table.

## Spike limitations (intentional, resolved in later phases)

- Credentials sit unencrypted in `localStorage` — use test databases only.
  Phase 1 brings QR pairing + Android-Keystore storage.
- User selection is "most cards wins"; real user resolution comes with
  pairing (Phase 1).
- Read/list only — reviews, ratings, and write-back start in Phase 2.
- bigint parameters are narrowed to safe integers on the IPC wire (ZAM ids
  are TEXT ULIDs; bigints only appear as rowids).
