# Tauri Active-Recall Studio

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Designing a desktop application for ZAM card reviews using Tauri v2, integrating the existing bridge, adding shortcut systems, packaging dependencies, and setting up release targets.

## Decisions

- A Tauri v2 desktop review application.
- A Rust command boundary that invokes the shared ZAM bridge.
- Dashboard, review, reveal, evaluation, and rating flows.
- Keyboard shortcuts for reveal, rating, and exit.
- Bundled CLI and Node runtime resources for packaged applications.
- Content security policy and local assets.
- Native release targets for Windows, Linux, and Intel/ARM macOS.

## Evidence

- `desktop/src/main.ts`
- `desktop/src/styles.css`
- `desktop/src-tauri/src/lib.rs`
- `desktop/src-tauri/tauri.conf.json`
- `.github/workflows/release.yml`
