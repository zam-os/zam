# ZAM Mobile (Android companion)

Tauri-2-Android companion defined in
[`docs/plans/2026-07-21-android-companion-app.md`](../docs/plans/2026-07-21-android-companion-app.md).
The WebView runs the unmodified TypeScript learning kernel; Rust owns a
libsql offline-writable synced database.

Phase 1 adds the real first-run path:

- ZAM Desktop creates a versioned `zam-pair` QR code from the configured
  server database, selected learner, and enabled Recall-LLM endpoint.
- Android scans the code with the official Tauri barcode-scanner plugin.
- The complete payload is AES-GCM encrypted with a key held by Android
  Keystore; plaintext credentials are never written to `localStorage`.
- The first sync must succeed before a new pairing is stored. Later starts
  open the local replica first and remain useful offline.
- Queue construction is bound to the learner in the pairing payload; the
  Phase-0 "most cards wins" heuristic is gone.
- Manual server URL/token/learner entry remains available as a fallback.

## Layout

- `src/provider.ts` — kernel `Database` contract over Tauri IPC. Wire
  encoding (blobs as `{"$blob": base64}`, errors as strings) is mirrored
  by `src-tauri/src/db.rs` and `tests/helpers/tauri-invoke-stub.ts`; change
  all three together.
- `src/main.ts` — first-run pairing, sync status, and learner-bound due queue.
- `src-tauri/src/db.rs` — libsql connection and sync commands. A stable hash
  of the server URL gives every server database a separate local replica.
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

On first run, open ZAM Desktop → Settings → Mobile companion, select or
create the learner, explicitly show the QR code, and scan it in ZAM Mobile.
The QR contains live secrets and automatically disappears after five minutes;
avoid shoulder surfing and prefer a database-scoped token.

## Current boundary

Phase 1 is read-only: it shows the learner's due queue and sync state. Reviews,
ratings, `review_logs`, interruption-safe sessions, and summaries arrive in
Phase 2.
