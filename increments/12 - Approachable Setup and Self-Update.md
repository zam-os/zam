# Increment 12: Approachable Setup and Self-Update

Status: planned

## Problem

Today the only way to run ZAM is the developer path: clone a GitHub repository,
install Node dependencies, run `zam setup`, and — for the desktop Studio —
install Rust and compile the Tauri app from source. "Your personal storage" is a
forked `zam-personal` git repository. For anyone who is not a software developer,
every one of these steps is a wall: GitHub accounts, forks, toolchains, and the
terminal. The product cannot reach its intended non-developer audience while the
front door is a source checkout.

## Goal

Make ZAM installable and updatable like any consumer application, while keeping
the existing developer path intact. A non-developer should be able to download a
signed installer (or `winget install` / `brew install`), pick a personal storage
location that can sit inside a folder they already sync (Google Drive, OneDrive,
Dropbox, iCloud), and let the desktop app keep itself up to date — without ever
opening a terminal or learning git.

## Decisions

1. **Two setup modes.**
   - *Developer* (today's behavior, preserved): source checkout, npm, git-backed
     personal instance, manual updates via `git`/`npm`.
   - *Default* (new): installed application in the platform's application
     directory, data in the platform data directory, updates through the package
     manager or the in-app updater. No source checkout, no Node, no Rust.

2. **Install channels (this increment):** signed direct-download installers
   (`.dmg`, `.msi`/`.exe`, `.deb`/`.AppImage`), a **winget** manifest, and a
   **Homebrew** cask. Mac App Store / Microsoft Store are deferred — their
   sandboxes conflict with ZAM writing `~/.zam`, installing git hooks, and
   spawning helper processes.

3. **Personal storage = a folder the user chooses.** The slow-changing personal
   content (beliefs, goals, identity) is plain files in a folder ZAM does not
   require to be a GitHub fork — local, or inside any synced provider's
   directory. The **live SQLite database is never the synced file** (file-sync of
   a WAL database corrupts it). Cross-device continuity uses portable **DB
   snapshots**: export a verified snapshot into the personal folder, import it on
   another machine. Turso remains the real-time cross-device option for users who
   want it.

4. **Channel-aware self-update.** The desktop app detects a newer release and
   offers to update, but the mechanism follows how it was installed (recorded as
   an install-channel marker baked into each artifact):
   - direct download / Default → Tauri updater applies a signed update in place;
   - winget / Homebrew → notify and defer to `winget upgrade` / `brew upgrade`
     (never self-replace a package-managed install);
   - Developer → inform only (`git pull`).

5. **Optional agent provisioning.** Default mode still relies on an external AI
   agent CLI to drive sessions; a fully console-free, GUI/agent-only experience
   is a follow-on (see *Related ideas*). To remove that hurdle here, setup can
   **download and configure a default, freely available open agent** and wire it
   to ZAM's skills and bridge — two birds with one stone: install ZAM and a
   working agent in a single flow. Candidate agents (one to be selected):
   opencode, goose, kilocode — preferring one that also ships a GUI.

## Scope

### In

- Default vs Developer mode selection and the Default-mode application/data
  directory layout.
- Signed installers + winget manifest + Homebrew cask, validated on clean
  machines (no Node, no source) before release.
- A self-contained desktop bundle: the compiled CLI bridge ships as a Tauri
  resource (extends `scripts/prepare-desktop-bridge.mjs`) so the app runs with no
  repo and no Node.
- Personal-folder chooser (local or any synced directory) plus verified DB
  snapshot export/import.
- Channel-aware in-app update detection and apply/notify flow.
- Optional download + configuration of one default open agent.

### Out (follow-on ideas)

- Console-free operation where the agent/GUI fully abstracts the terminal.
- Prepaid cloud LLM provider setup (DeepSeek V4-Pro, Mimo-2.5).
- Mac App Store / Microsoft Store submission.
- Real-time sync of fast-changing learning state through a file-sync provider.

## Progress (on `feat/increment-12-setup`)

Implemented and verified (lint + typecheck + 189 tests + smoke tests):

- **Phase 4 — Snapshots.** `zam snapshot export|import|verify`: portable,
  checksummed SQL text that never copies the live WAL file; import is
  transactional and row-count verified, defaulting into `<personal>/snapshots/`.
  Evidence: `src/kernel/db/snapshot.ts`, `src/cli/commands/snapshot.ts`,
  `tests/kernel/snapshot.test.ts`.
- **Phase 3 — Install mode & profile.** `zam profile` shows/sets the per-machine
  mode (`~/.zam/config.json`, not the DB) and personal folder, with file-sync
  detection. Evidence: `src/kernel/system/install-config.ts`,
  `src/cli/commands/profile.ts`, `tests/kernel/install-config.test.ts`.
- **Phase 5 — Update-decision logic.** `zam update check`: pure, channel-aware
  `decideUpdate` + `compareVersions`, fetching the latest GitHub release.
  Evidence: `src/kernel/system/update-check.ts`, `src/cli/commands/update.ts`,
  `tests/kernel/update-check.test.ts`. The in-app Tauri apply and GUI banner
  remain for the desktop, pending an updater keypair.
- **Phase 6 — Agent provisioning.** `zam agent install|status`: installs
  opencode (npm-first; native on Apple Silicon and Windows on ARM), wired via
  the AGENTS.md that `zam setup` writes. Evidence:
  `src/kernel/system/installer.ts`, `src/cli/commands/agent.ts`,
  `tests/kernel/agent-install.test.ts`.

Remaining: Phases 0–2 (signed installers, winget/Homebrew cask, self-contained
desktop, Tauri updater config). **Update-manifest host: GitHub Releases
(interim)** — `zam update check` works once a non-draft release is published;
the in-place signed self-update still needs an updater keypair.

## Phases (each a shippable PR)

0. **Release & signing foundation** — code-signing/notarization identities,
   updater signing keys, a release endpoint (GitHub Releases + Tauri updater
   manifest), `createUpdaterArtifacts` in the bundle, and the install-channel
   marker.
1. **Self-contained Default-mode desktop** — bundle the CLI bridge as a resource;
   the app runs from an installed location with no repo/Node; drop the `zam ui`
   "find the repo's `desktop/` dir" assumption for installed builds.
2. **Distribution channels** — signed direct-download installers, winget
   manifest, Homebrew cask, plus a clean-machine release-validation gate.
   *(Promotes package-manager-distribution and release-artifact-validation.)*
3. **Setup mode & personal-folder chooser** — first-run flow choosing Developer
   vs Default and the personal-content folder location; Default-mode data
   directories.
4. **Snapshot-based cross-device storage** — verified portable DB snapshot
   export/import into the personal folder, with explicit guardrails against
   syncing the live DB. *(Promotes database-backup-restore.)*
5. **Channel-aware self-update UI** — version detection, Tauri-updater apply for
   direct installs, notify/defer for package managers, inform for developer mode.
6. **Optional agent provisioning** — select and integrate one default open agent;
   extend the installer pattern (winget/brew/curl) and wire ZAM skills + bridge.

## Promotes (ideas folded in; remove from `ideas/` once shipped)

- `distribution/package-manager-distribution`
- `distribution/release-artifact-validation`
- `data/database-backup-restore`

## Related ideas (follow-on, newly filed)

- `distribution/agent-mediated-operation` — console-free, agent-mediated use.
- `distribution/cloud-llm-provider-setup` — prepaid DeepSeek/Mimo setup.

## Open decisions

- **Resolved — default agent: opencode.** Only candidate native on both Apple
  Silicon and Windows on ARM that also ships its own GUI; goose has no native
  Windows-on-ARM build, kilo's GUI lives inside VS Code. Hermes Desktop parked
  as a follow-on idea.
- **Resolved — personal-folder location:** default `~/Documents/zam` (the
  existing `personal.workspace_dir`); first run does not force a choice.
- **Resolved — update-manifest host: GitHub Releases (interim).**
- Pending: code-signing/notarization identities and a Tauri updater keypair
  (required for the in-place signed self-update).

## Risks

- *Live DB in file-sync → corruption.* Mitigated: only snapshots are synced; the
  live DB stays in the data directory.
- *Conflicting update channels.* Mitigated: the install-channel marker selects
  the update path; package-managed installs are never self-replaced.
- *Store sandboxes.* Deferred out of scope rather than worked around.
