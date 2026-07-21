# ZAM Mobile (Android companion, Phase 0 spike)

Walking skeleton for the Android companion app defined in
[`docs/plans/2026-07-21-android-companion-app.md`](../docs/plans/2026-07-21-android-companion-app.md):
a Tauri 2 shell whose WebView runs the **unmodified TypeScript kernel**
against a new database provider, while the Rust side owns a libsql database
— a plain local file or an **embedded replica** of the server database.

What the spike proves (Phase 0 checklist):

- [ ] Kernel-in-WebView: `buildReviewQueue` renders the due queue on the
  Pixel 6 without kernel changes.
- [ ] Embedded replica: `db_open` with a `libsql://` URL + token syncs a
  test server database onto the device; "Neu syncen" pulls new changes.
- [ ] Provider contract: `tests/mobile/tauri-provider.test.ts` passes
  (runs in CI; the invoke stub mirrors the Rust wire semantics).

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

## Run on the Pixel 6

One-time setup on the development machine:

1. Install Android Studio (or command-line tools) with **SDK Platform 37**,
   platform-tools, and the **NDK**; export `ANDROID_HOME` and `NDK_HOME`.
2. `rustup target add aarch64-linux-android armv7-linux-androideabi \
   i686-linux-android x86_64-linux-android`
3. `cd mobile && npm install && npm run tauri android init`
   (generates `src-tauri/gen/android`; currently gitignored — revisit once
   the Gradle project needs hand edits).

On the phone: enable developer options + USB debugging, connect via USB,
then:

```bash
npm run tauri android dev    # builds, installs, and attaches to the Pixel 6
```

In the app, either "Nur lokal öffnen" (empty local database) or paste the
URL + token of a **test** server database and "Replica verbinden".

## Spike limitations (intentional, resolved in later phases)

- Credentials sit unencrypted in `localStorage` — use test databases only.
  Phase 1 brings QR pairing + Android-Keystore storage.
- User selection is "most cards wins"; real user resolution comes with
  pairing (Phase 1).
- Read/list only — reviews, ratings, and write-back start in Phase 2.
- bigint parameters are narrowed to safe integers on the IPC wire (ZAM ids
  are TEXT ULIDs; bigints only appear as rowids).
