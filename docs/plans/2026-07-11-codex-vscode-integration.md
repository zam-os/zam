# ZAM 0.10.3 Codex and VS Code integration plan

**Status:** In progress
**Scope:** Integration and setup hardening only. No new learning features.

## Phase 1 — Contracts and packaging

- [x] Add a tested local UI-intent contract for Recall, Graph, and Settings.
- [x] Package a dependency-free VS Code extension that hosts the existing MCP
  App resources in a movable WebviewView.
- [x] Produce a `.vsix` in every root build without adding dependencies.

## Phase 2 — Setup

- [x] Add user-scoped VS Code MCP configuration support.
- [x] Make `zam agent connect` parameterless, auto-detecting, idempotent, and
  non-destructive while retaining explicit harness arguments.
- [x] Install or refresh the global ZAM skill and VS Code extension from the
  same command.

## Phase 3 — Skill behavior

- [x] Document the dedicated MCP Apps in every packaged skill flavor.
- [x] Make parameterless ZAM invocation show the agreed choice menu, with
  Recall and relevant due topics first.
- [x] Keep Studio out of agent-harness choices and route visualization requests
  to focused app surfaces.

## Phase 4 — Verification and release

- [x] Pass format, lint, typecheck, full tests, and build.
- [x] Verify Codex Desktop and VS Code with the Codex extension; smoke-test
  Copilot without broadening scope.
- [x] Verify the shared Companion VSIX in Antigravity IDE 1.107 after the
  compatibility review.
- [x] Build and verify the Apple Silicon macOS application package.
- [ ] Publish npm, `.vsix`, desktop assets, and the 0.10.3 GitHub release using
  the established “What's new” structure.
