# Release Hardening

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Hardening the desktop releases, decoupling startup dependencies, validating resource packaging, and testing cross-compilation environments.

## Decisions

- Bundled bridge startup without a source checkout.
- Packaged production dependencies and a Node runtime.
- Explicit monitor helpers instead of invalid automatic shell startup.
- Model configuration only after successful preparation.
- Local fonts and a desktop content security policy.
- Separate Intel and ARM macOS release targets.
- Windows ARM64-compatible local SQLite storage.
- CI checks for frontend compilation, Rust, resource preparation, and bridge startup.

## Evidence

- `scripts/prepare-desktop-bridge.mjs`
- `desktop/src-tauri/src/lib.rs`
- `src/kernel/system/hooks.ts`
- `src/kernel/db/connection.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
