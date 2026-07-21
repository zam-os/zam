# Android Companion: Tauri 2 Shell with Kernel-in-WebView

**Status:** Vorschlag — accepted stack decision (Thomas, 2026-07-21); pending
on-device validation of the Phase 0 spike on the Pixel 6
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
- **Sync via libsql embedded replica in Rust** (`mobile/src-tauri/src/db.rs`):
  `db_open` with URL + token builds a `new_remote_replica` database in the
  app-data dir; `db_sync` pulls from the server database. Local-only open
  stays possible for development.
- **Contract parity is enforced by the shared suite**: the provider runs
  `tests/helpers/db-contract.ts` against an invoke stub
  (`tests/helpers/tauri-invoke-stub.ts`) that mirrors the Rust wire
  semantics. Provider, Rust shell, and stub must change together.
- **Identifier `org.zamos.zam`**; transactions serialize through the
  provider (BEGIN IMMEDIATE … COMMIT/ROLLBACK), matching the contract's
  "nested calls deadlock by design" stance.

## Open validation (Phase 0 gate)

- Embedded-replica build/sync of libsql on `aarch64-linux-android`.
- Kernel bundle size/startup inside the Android WebView on the Pixel 6.
- `tauri android dev` toolchain end-to-end (SDK 37 + NDK).

## Evidence

- `mobile/src/provider.ts`
- `mobile/src-tauri/src/db.rs`
- `mobile/src/main.ts`
- `tests/mobile/tauri-provider.test.ts`
- `tests/helpers/tauri-invoke-stub.ts`
