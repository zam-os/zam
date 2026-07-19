# ZAM 0.15.4 — an honest green on Windows

A patch release with no product-code changes: it repairs the project's
Windows verification so that "tests pass" means the same thing on every
platform. Found while live-testing 0.15.3 for release
([issue #190](https://github.com/zam-os/zam/issues/190)).

## Fixed

- **The `windows-arm64` CI job can no longer mask test failures.** The job
  ran typecheck, build, `npm test`, and two cargo commands in a single
  PowerShell block, where only the last command's exit code decides the
  step result — the v0.15.3 run shows `Tests 3 failed` in its log yet
  concluded green. Each command is now its own step, and the CLI smoke
  sequence runs under `bash -e`.
- **`npm test` is genuinely green on Windows again.** Three tests failed
  deterministically on win32 behind that masking:
  - *ui-intent*: the `/dev/null/…` "unwritable" sentinel is a perfectly
    creatable directory name on Windows — every run silently deposited a
    stray `C:\dev\null\…\ui-intent.json` on the system drive. The test now
    blocks the write with a path beneath a regular file, which no platform
    can create.
  - *agent-harness*: Copilot detection compared `path.join` output against
    POSIX literals; separators are normalized before comparing (closes
    [#159](https://github.com/zam-os/zam/issues/159)).
  - *cli-install*: the unix-shim execute-bit assertion is meaningless on
    Windows (`chmod` is a no-op) and now runs only off-Windows; the shim
    content and profile-append behavior stay asserted everywhere.
- **MCP test cleanup no longer races Windows file locks.** The stdio-server
  suite's temp-dir removal retries (`rmSync` with `maxRetries`) instead of
  failing the whole file when a handle closes a beat late.

## Verification

Full suite on Windows 11 x64: 111 files, 1144 tests, 0 failures — the
first honest all-green Windows run since the ARM64 job was added. The
0.15.3 live-test pass (OKF import lifecycle, re-import classification,
cycle rollback, CRLF+BOM articles, bridge JSON error envelopes, FSRS
reset-on-replace) was re-run against this tree unchanged.
