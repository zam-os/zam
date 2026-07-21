# Android Companion: Tauri 2 Shell with Kernel-in-WebView

**Status:** Accepted stack decision (Thomas, 2026-07-21); validated on the
Pixel 9 development device, with the Pixel 6 hardware-floor gate still open
**Deciders:** Thomas (project owner)
**Related:**
[2026-05-31b-tauri-active-recall-studio.md](2026-05-31b-tauri-active-recall-studio.md) ·
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md)

---

## Context

The Android companion app (plan: `docs/plans/2026-07-21-android-companion-app.md`)
must run active-recall sessions from the same learning state as CLI and
desktop, offline-capable, on a Pixel 6 (Android 17 / API 37 floor). The
desktop Studio reaches the kernel through a bundled Node-CLI bridge
sidecar — that path does not exist on Android, so the mobile shell needs
its own way to run kernel logic and reach the database.

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

## Open validation (Phase 0 gate)

- [x] Synced-database build, queue render, offline write, and push/pull on
  the Pixel 9 (`aarch64-linux-android`, Android 17 / API 37).
- [x] `tauri android dev` toolchain end-to-end on the Pixel 9 (SDK/Build
  Tools 37 + NDK r29).
- [ ] Kernel bundle/startup and the same sync scenario on the Pixel 6
  hardware floor.

## Evidence

- `mobile/src/provider.ts`
- `mobile/src-tauri/src/db.rs`
- `mobile/src/main.ts`
- `tests/mobile/tauri-provider.test.ts`
- `tests/helpers/tauri-invoke-stub.ts`
- Pixel 9 field check, 2026-07-21: API-37 APK installed; the unmodified
  kernel rendered one synced due-queue item; with no active default network,
  an offline ULID write was committed locally and appeared in the Turso test
  database after reconnect + `db_sync`; Android reported a 273 ms cold app
  start. Credentials and the local replica cache are intentionally excluded
  from the repository.
