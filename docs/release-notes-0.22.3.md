# ZAM 0.22.3 — the macOS app is notarized

The macOS app is now signed with an Apple Developer ID certificate and
notarized by Apple. A downloaded `ZAM.app` opens with a double-click; the
right-click → Open detour, and the dialog that made the download look damaged,
are gone.

Nothing else changed. This is the same application as
[0.22.2](release-notes-0.22.2.md) — see [0.22.0](release-notes-0.22.0.md) for
what the iPadOS companion does.

## What this covers

- **The app and everything inside it.** Notarization fails if any single
  executable in the bundle is unsigned, and ZAM ships several: the Node
  runtime that runs the bridge, the prebuilt SQLite modules, and the observer
  sidecar. All of them now carry the same signature and run under Apple's
  hardened runtime.
- **In-app updates.** The updater payload is notarized and stapled too, so an
  updated install passes Gatekeeper even offline.

The bundled Node runtime holds exactly one entitlement,
`com.apple.security.cs.allow-jit`, which it needs because it compiles
JavaScript at runtime. The two further entitlements that the usual recipe for
Node applications adds are not included — they were verified to be
unnecessary, and one of them would have allowed unsigned libraries to be
loaded into the process that holds your database.

## Not included

- **Windows** installers are still unsigned; SmartScreen still warns.
- **Intel Macs** are still not built — releases are Apple Silicon only.
- The **Mac App Store** is not the distribution route, and this does not move
  towards it. The reason is recorded in
  [ADR 2026-07-27](adr/2026-07-27-macos-notarization.md): the App Store
  requires the App Sandbox, and a sandboxed app cannot reach the `~/.zam`
  database that the desktop app, the CLI and the MCP transport share.
