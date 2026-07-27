# macOS Distribution: Developer ID Notarization, Not the Mac App Store

**Status:** Accepted (Thomas, 2026-07-27). Verified end to end on a local
build: all six Mach-O objects in the bundle carry the Developer ID signature
and the hardened runtime, Apple issued a notarization ticket, and the bundled
Node runtime starts under the hardened runtime.
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-21-code-signing-and-trusted-installers.md](2026-06-21-code-signing-and-trusted-installers.md)
(this decides and implements its macOS half; Windows Authenticode stays open) ·
[2026-07-26-ipados-companion-target.md](2026-07-26-ipados-companion-target.md) ·
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md)

---

## Context

ZAM Desktop shipped unsigned up to 0.22.2. macOS therefore treats a downloaded
`.app` as untrusted: the first launch has to go through right-click → Open, and
on recent macOS versions the dialog reads as though the download were damaged.
For a field test that starts with a parent installing the app on a family Mac,
that first impression is a real obstacle, not a cosmetic one.

Apple Developer Program membership already exists — it was bought for the
iPadOS companion. macOS offers two distribution routes on top of it, and they
are not variations of the same thing:

- **Developer ID + notarization** — signed with a Developer ID Application
  certificate, scanned by Apple's notary service, distributed by us.
- **Mac App Store** — signed with a Mac App Distribution certificate,
  reviewed by Apple, distributed by Apple.

Publishing through the App Store is a stated long-term goal. This ADR records
why it is not the near-term route, and what would have to change first.

## Decisions

### 1. Developer ID with notarization; the Mac App Store stays deferred

The Mac App Store mandates the **App Sandbox**
(`com.apple.security.app-sandbox`). ZAM Desktop reads and writes
`~/.zam/zam.db` (`src/kernel/db/connection.ts`), and that file is shared *by
design* with the CLI and the MCP transport — one learner, one database, three
front ends. A sandboxed process is confined to its own container and cannot
reach that path.

Making ZAM sandboxable therefore means one of:

- moving the database into the app container, which breaks the CLI/MCP sharing
  that the product is built on; or
- a security-scoped bookmark flow, where the user grants access to `~/.zam`
  through a file picker and the app persists the bookmark — workable, but it
  turns a plain path into a permission the user can revoke, and every non-GUI
  entry point (CLI, MCP) still has to work without it.

That is an architectural decision about where learner data lives, not a
signing detail. It is deliberately **not** decided here. Notarization gets a
double-clickable app today and does not foreclose the App Store later.

### 2. Bundled binaries are signed inside-out, via `beforeBundleCommand`

Notarization rejects a bundle if *any* Mach-O object inside it lacks a
Developer ID signature. Five arrive ad-hoc signed, from npm and from cargo:

| Object | Origin |
| --- | --- |
| `zam-cli/runtime/node` | the bundled Node runtime |
| `zam-cli/node_modules/@libsql/darwin-arm64/index.node` | npm prebuild |
| `zam-cli/node_modules/better-sqlite3/prebuilds/darwin-arm64.node` | npm prebuild |
| `zam-cli/node_modules/better-sqlite3/prebuilds/darwin-x64.node` | npm prebuild (other architecture, still scanned) |
| `zam-observer/<triple>/zam-observer` | our own cargo build |

Tauri does not sign them. It signs the app bundle, its frameworks and declared
sidecars, and it does not pass `--deep`; resources are not in its scope.

The hook has to be `beforeBundleCommand`, and that is the only choice that
works. Signing earlier is undone: `beforeBuildCommand` runs
`desktop:prepare`, which reinstalls the whole resource tree from scratch.
Signing later is worse: the updater artifact (`ZAM.app.tar.gz`) is generated
during bundling and signed with the Tauri updater key, so any post-build
modification of the `.app` silently invalidates it.

`scripts/sign-macos-resources.mjs` therefore discovers Mach-O objects by
reading file headers rather than from a hardcoded list — the set changes with
the dependency tree. This repository already produced two different layouts:
a locally compiled `build/Release/better_sqlite3.node` and, on a clean
install, two files under `prebuilds/`.

### 3. Minimal entitlements: `allow-jit`, on the Node runtime only

The bundled Node runtime gets `com.apple.security.cs.allow-jit`
(`desktop/src-tauri/node.entitlements`) because V8 compiles JavaScript to
machine code at runtime, which the hardened runtime forbids by default.

Nothing else gets entitlements:

- **The app binary needs none.** It is Rust, and WKWebView runs JavaScript in
  its own system process.
- **`allow-unsigned-executable-memory` and `disable-library-validation` are
  not needed**, although the usual Electron/Node recipe includes them. Library
  validation is satisfied because the native modules Node `dlopen()`s are now
  signed with the same Team ID by the same script. Verified: `bridge
  desktop-bootstrap` and `bridge check-due` both run from inside the signed
  bundle.

The point is not tidiness. `disable-library-validation` would let any
code-injection foothold load unsigned libraries into the process that holds
the learner's database.

### 4. `minimumSystemVersion` 14.0

Release builds target `aarch64-apple-darwin` only, so every machine that can
run ZAM is an Apple Silicon Mac, and every Apple Silicon Mac — down to the
2020 M1 — can run the current macOS. There is no user stranded on an old
version by hardware. 14.0 (Sonoma) is the oldest macOS still receiving
security updates in July 2026.

### 5. A release fails rather than ships a partially signed bundle

`scripts/verify-macos-bundle.mjs` runs in the release workflow after the
build. It walks every Mach-O object in the finished `.app`, rejects any
ad-hoc signature or missing hardened runtime, and checks the stapled ticket
and the Gatekeeper assessment.

This guards a failure mode that is easy to reintroduce and invisible until a
user downloads the app: adding one dependency that ships a prebuilt binary is
enough.

## Consequences

- **The updater payload is notarized too.** With notarization enabled, Tauri
  bundles `ZAM.app.tar.gz` *after* stapling the ticket into the `.app`, so
  in-app updates install an app that passes Gatekeeper offline. Verified by
  extracting the tarball and running `stapler validate` on the result.
- **Three new repository secrets** are required: `APPLE_CERTIFICATE` (base64
  of the Developer ID `.p12`), `APPLE_CERTIFICATE_PASSWORD`, and
  `APPLE_SIGNING_IDENTITY`. Notarization reuses the existing
  `APPLE_API_KEY`, `APPLE_API_ISSUER` and `APPLE_API_KEY_CONTENT` secrets.
- **The certificate expires 2031-07-28** and can only be replaced by the
  Account Holder in person: the App Store Connect API refuses to create
  Developer ID certificates (403, "This operation can only be performed by the
  Account Holder").
- **Intel Macs remain unserved.** Unchanged by this ADR, but now a deliberate
  gap rather than an incidental one, because the deployment target assumes it.

## Alternatives considered

- **`codesign --deep`** — Apple explicitly discourages it, and it applies one
  entitlement set to every nested binary, which is the opposite of decision 3.
- **Re-signing the finished `.app` after the build** — invalidates the updater
  artifacts generated during bundling.
- **An ad-hoc signature plus documented right-click → Open** — the status quo.
  Rejected: it puts the burden on the least technical user in the field test.
