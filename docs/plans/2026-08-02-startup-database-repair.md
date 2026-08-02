# Handover — make a rejected database credential repairable during startup

**Status:** complete. The branch now starts `zam mcp` in degraded mode and
routes Desktop credential failures to the token field in Settings.
**Branch:** `claude/sharp-chaplygin-ae2159`, on top of `92cec02`.
**Trigger:** a Turso auth token expires. The database URL is still correct and
the learner's data is fine — only the token needs replacing.

This document is harness-agnostic: Claude Code, Antigravity, Codex, or a human
can pick it up.

## Why this needs doing

An expired token is the most likely thing to break a working ZAM install,
because Turso tokens expire on a schedule and nothing else does. It was hit for
real on 2026-08-02 while wiring the MCP server up, and neither surface handled
it as a repair:

- `zam mcp` **died at startup** with an unhandled `HranaResponseError` and a
  ten-frame stack trace. To the harness that is a server that will not start;
  there is nothing to click, nothing to read, and no way to use the harness to
  fix the problem.
- ZAM Desktop shows the raw driver message in the startup overlay. Better than
  before (it used to show nothing at all), but "Turso rejected the configured
  credentials (HTTP 401)" is a diagnosis, not a repair.

The repair itself now exists and is cheap — `zam connector token turso`, added
in `92cec02`, replaces the token while keeping the URL and access mode. What is
missing is *reaching* it from the two places where the failure actually shows
up.

## Task 1 — `zam mcp` must not die on a database it cannot open

`runMcpServer` opens the database as its first statement, with nothing around
it ([`src/cli/commands/mcp.ts:1874`](../../src/cli/commands/mcp.ts)):

```ts
export async function runMcpServer(): Promise<void> {
  console.log = console.error;
  const db = await openDatabase();          // ← throws straight out of the process
  const server = createMcpServer(db);
```

**There is an open design decision here — resolve it with the requester before
building.** Both options are defensible and they differ a lot in cost:

| | behavior | cost |
| --- | --- | --- |
| **A. Degraded start** | Server comes up. DB-backed tools return the actionable message; DB-free tools (`zam_okf_upsert` and friends) keep working, so the harness itself can be used to diagnose and document the problem. | `createMcpServer(db)` must tolerate an absent database. A lazy accessor that opens on first use and throws the actionable error is probably the smallest shape — but every tool takes `db` today, so check how many call sites that really is before committing. |
| **B. Clean refusal** | Server still exits, but with one readable line naming the repair instead of a stack trace. | Small: wrap the open, print, `process.exit(1)`. |

A is what "supported during startup" most plausibly means, since it is the only
option where the harness stays usable while the problem is fixed. B is an
honesty fix, not a repair path. Do not start A without checking the `db` call
sites first — the estimate above is unverified.

Whichever is chosen, the message should name `zam connector token turso`, not
`zam connector setup turso`. The distinction matters and is the point of
`92cec02`: token-only, no URL re-entry.

## Task 2 — the Desktop overlay should offer the repair, not just report it

The startup overlay landed in `e6040f1` and already has the right shape: it
names the step that failed and keeps itself on screen rather than handing over
a dashboard full of placeholders. What it does not do is classify the failure.

The classifier already exists and is already exported —
[`classifyServerDbError`](../../desktop/src/server-db.ts) maps 401/403 onto
`server_db_err_token` ("The database rejected this token. Create a fresh token
and paste it again."), plus network, quota, and Bitwarden cases. It is only
wired into the connect wizard today, not into startup.

Suggested shape:

1. In `loadDashboard`'s failure path, run the raw message through
   `classifyServerDbError` before it reaches `failBootStep`, so the overlay
   shows the actionable sentence rather than the driver's English.
2. When the failure classifies as a database problem, add a third overlay
   button beside "Try again" / "Continue anyway" that switches to the settings
   view and focuses the server-database card — the token field is already
   there, and `initServerDbWizard` already handles connect + verify + refresh.
3. After a successful reconnect, the wizard's `onServerDbReady` callback
   already reloads the dashboard; make sure that path also resets the boot
   state (`restartBoot`) so the overlay does not stay stuck on a failure that
   has been fixed.

The overlay state machine is DOM-free and unit-tested in
`tests/desktop/boot-progress.test.ts`; keep new decision logic there rather
than in `main.ts`, and the existing tests will tell you if the state machine
stops making sense.

Note that the desktop's DB errors arrive through the bridge, so the message
text is whatever the CLI produced. `classifyServerDbError` matches on
`/401|403|unauthorized|.../` and will therefore keep working if the CLI's
wording changes — but a test that pins the real 401 string through the
classifier is worth having, because that coupling is invisible otherwise.

## What is already done (do not redo)

- `zam connector token turso` — token-only refresh keeping URL and mode
  (`92cec02`). `setup turso` also stops demanding the URL: stored value as
  prompt default, `--token` alone works non-interactively.
- The `HranaResponseError` 401 text points at the token-only command.
- The Desktop startup overlay itself: step list, current step, slow notice
  after 6 s with elapsed seconds, failure state naming the step, retry /
  continue-anyway, locale cached so the first paint is not always English
  (`e6040f1`).
- `initPanel()` isolation, so one settings widget throwing can no longer take
  the dashboard down — that was the actual 0.27.0 startup crash
  (`initSecretsVault` deleting the Alpha badge it then required).

## Environment notes for whoever picks this up

Verified on the machine this was written on (Windows 11 ARM64, Snapdragon X,
Node 26.4.0 arm64):

- `npm ci` fails — node-gyp finds no Python for `better-sqlite3`. Use
  `npm ci --ignore-scripts`; the package ships an N-API
  `prebuilds/win32-arm64.node` that needs no build. The desktop frontend needs
  its own `npm ci` inside `desktop/` before `npx tsc --noEmit` resolves the
  Tauri types.
- `npm run lint` **cannot run here**: Biome 2.5.6's `win32-arm64` binary exits
  with an access violation (`0xC0000005`) and prints nothing, on an untouched
  `v0.27.0` checkout too. CI's Ubuntu `validate` job is the lint gate — do not
  report lint as passing from this machine.
- Several `tests/cli/*` suites spawn subprocesses under a 5 s vitest timeout and
  go red under parallel load (a running Vite dev server is enough). The
  untouched `v0.27.0` baseline shows the same failures. Re-run a suspect file
  alone before believing it.
- The MCP server can be pointed at this checkout instead of the global install
  via `.mcp.json` (gitignored): `node C:\src\zam\dist\cli\index.js mcp`.
  `zam agent connect claude-code` writes the global-install variant.

## Related

- [`2026-08-02-config-lock-windows-arm-verification.md`](2026-08-02-config-lock-windows-arm-verification.md)
  — the config-lock work this branch started as. **Complete**: verified on
  Windows ARM, and a fourth defect found and fixed there (`eb1beca`). Nothing
  outstanding except the OKF note below.
- `docs/okf/mcp-surfaces.md` § "Machine-local settings under concurrency"
  describes the config lock's retry behavior. The sentence "retried for half a
  second before giving up" only became true with `eb1beca`; the load-bearing
  nuance still missing is that the half second is measured **from the first
  refusal**, not from the start of the acquire — confusing the two was the
  defect. Must be written through the `zam_okf_upsert` MCP tool, never by hand
  (CLAUDE.md).
