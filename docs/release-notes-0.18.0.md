# ZAM 0.18.0 — Online-only companion, camera import, server-DB attach

This release pivots the Android companion off offline-writable libsql
replicas and onto an **online-only server database**. It also adds
**camera / screenshot import** via a cloud vision model, and a first
**Studio form to attach Turso/sqld** so mobile pairing is gated on a real
server DB.

## Highlights

- **Online-only mobile database (ADR 2026-07-23).** The phone opens the
  remote primary with `libsql::Builder::new_remote` instead of an
  offline-writable synced replica. Without network, durable writes are
  rejected honestly. Local desktop SQLite remains the fast single-machine
  path and **does not offer QR pairing**.

- **Server database attach in Studio (#218 MVP).** Settings → Server
  database stores and verifies Turso/sqld URL + token via
  `zam bridge server-db-connect`. The pair-mobile control stays disabled
  until a non-local target is active. Full create-DB / migration wizard
  remains on the tracking issue.

- **Camera / screenshot import (Phase 7 / #211).** Photograph or pick a
  worksheet image, downscale in the WebView, call a cloud chat-completions
  vision model through a native `vision_request` (reqwest), and confirm
  multiple token drafts with Save & next / Skip. Vision config is read from
  the server DB (`llm.vision.*`); tokens are stamped
  `provider: vision:<model>` with `question_source: llm`.

- **Remote open hardening.** Local-only PRAGMAs are skipped on remote
  connections (they failed with “unsupported statement”), `libsql://` is
  normalized to `https://` for the wire client, and Android keeps packaged
  WebPKI roots for TLS.

## Install

**Android (alpha, sideload)** — download `ZAM_Mobile_0.18.0_aarch64.apk` on
the phone, allow installs from this source, install, then:

1. On desktop: connect a Turso/sqld server DB (Settings → Server database),
   or `zam connector setup turso` / `zam bridge server-db-connect`.
2. Settings → Mobile companion → pair / QR scan.
3. Optional for image import: set `llm.vision.enabled`, `llm.vision.url`,
   `llm.vision.model`, and a key on the **server** DB.

**Windows** — `ZAM_Desktop_0.18.0_x64-setup.exe` (or arm64 setup).

**macOS / Linux** — platform bundles attached to the release.

**VS Code companion** — `ZAM_Companion_0.18.0.vsix`, or
`zam agent connect vscode`.

**CLI / kernel** — `npm install -g zam-core@0.18.0`.

## Notes

- Offline-first phone replicas are **no longer a product goal** (see ADR
  2026-07-23). Field-test devices should re-pair after updating.
- Cloud model configuration is intended to live in the server DB; local
  models stay machine-local.
- Pixel 9 / Android 17 remains the validated companion baseline.

**Full Changelog**: https://github.com/zam-os/zam/compare/v0.17.0...v0.18.0
