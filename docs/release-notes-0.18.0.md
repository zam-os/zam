# ZAM 0.18.0 — online-only companion, camera import, server DB

The Android companion no longer keeps an offline-writable database replica.
It works **online against a server database** (Turso/sqld). Pairing is unlocked
only after that server DB is attached on the desktop. The phone can also
**import learning content from a photo or screenshot** via a cloud vision model.

This remains an **alpha for the two-device field test**: Pixel 9 / Android 17
(API 37), sideload + in-app updates.

## Highlights

- **Online-only mobile database (ADR 2026-07-23).** The phone opens the remote
  primary (`libsql::Builder::new_remote`). Without network, durable writes are
  rejected honestly. Local desktop SQLite stays the fast single-machine path
  and does **not** offer QR pairing.

- **Server database attach in Studio (#218 MVP).** Settings → Server database
  stores and verifies Turso/sqld URL + token (`zam bridge server-db-connect`).
  Pair mobile stays disabled until a non-local target is active. Full create-DB
  / migrate-local wizard remains on the tracking issue.

- **Camera / screenshot import (Phase 7 / #211).** Photograph or pick a
  worksheet image → downscale in the WebView → cloud chat-completions vision
  via native `vision_request` → confirm multiple drafts (Save & next / Skip).
  Vision settings come from the server DB (`llm.vision.*`); tokens are stamped
  `provider: vision:<model>` with `question_source: llm`.

- **Remote open hardening.** Local-only PRAGMAs are skipped on remote
  connections, `libsql://` is normalized to `https://` for the wire client, and
  Android keeps packaged WebPKI roots for TLS.

## Notes

- Offline-first phone replicas are **no longer a product goal**. Re-pair after
  updating from 0.17.x.
- Cloud model configuration is intended to live in the server DB; local models
  stay machine-local.
- Devices: Pixel 9 / Android 17 remains the validated companion baseline.
- Pairing security tradeoff (live DB token in the QR) is unchanged from 0.17
  for the owner-present field test.

## Install

**Android (alpha, sideload)** — download `ZAM_Mobile_0.18.0_aarch64.apk`, allow
installs from this source, install, then:

1. Desktop: connect Turso/sqld (Settings → Server database, or
   `zam connector setup turso`).
2. Settings → Mobile companion → QR pair.
3. Optional for image import: set `llm.vision.enabled`, `llm.vision.url`,
   `llm.vision.model`, and a key on the **server** DB.

**Windows** — `ZAM_Desktop_0.18.0_x64-setup.exe` (or the arm64 setup).

**macOS / Linux** — platform bundles on the release page.

**VS Code companion** — `ZAM_Companion_0.18.0.vsix`, or
`zam agent connect vscode`.

**CLI / kernel** — `npm install -g zam-core@0.18.0`.

Already on 0.17.x? Desktop: check for updates in the app. Android: install the
new APK (same signing key updates in place when you came from a prior release
build; a debug sideload may need a reinstall).
