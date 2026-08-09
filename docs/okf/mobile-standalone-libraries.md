---
type: architecture
title: Standalone Mobile Libraries
description: ZAM Mobile starts from a device-local library on Android and iOS; pairing and a server database are optional multi-device upgrades.
tags:
  - mobile
  - android
  - ios
  - offline
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/mobile-standalone-libraries.md"
timestamp: 2026-08-09T07:37:04.195Z
---

ZAM Mobile is a standalone learning app on Android and iOS. An unpaired first
launch opens the device-local `zam-local.db`, provisions it through the
kernel's async `Database` contract, and shows a three-step setup when the
database has no learner identity. No desktop, account, model, network
connection, camera permission, or server database is required.

The setup records the interface locale and the fixed local learner id `me`,
seeds the selected persona's knowledge context, and creates three localized
starter cards. Those cards are ordinary tokens plus personal cards: they enter
the normal review queue and can later be edited, paused, or deleted. Repeating
setup is idempotent and preserves an existing learner identity.

A local library and a server-backed library are two explicit modes. Local mode
has no upstream, hides synchronization controls, and rejects `db_sync` rather
than claiming to be synchronized. QR pairing remains available as an explicit
takeover for a learner who already has a server-backed ZAM library.

Moving a local library to a server database is a learner-chosen multi-device
upgrade. ZAM exports a portable snapshot before opening the remote, provisions
the remote schema, refuses a non-empty target unless replacement was confirmed,
imports the snapshot, and only then persists the pairing. On failure it reopens
the local library, and the local database file is never deleted. Once attached,
the remote mode remains online-only and does not pretend to provide an offline
replica.

The Rust shell owns the local or remote libSQL connection. The WebView uses the
same TypeScript kernel and node-free provisioning path on both mobile
platforms, so scheduling, migrations, snapshots, and token/card behavior do not
fork into Android or iOS implementations.

# Citations

- [ADR 2026-08-08 — ZAM on iPadOS Is a Standalone App, Not a Companion](../adr/2026-08-08-ios-standalone-app.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- Code: `mobile/src/main.ts`, `mobile/src/setup/first-run.ts`, `mobile/src/setup/upgrade.ts`, `mobile/src-tauri/src/db.rs`, `src/kernel/db/provision.ts`, `tests/mobile/first-run.test.ts`, `tests/mobile/upgrade.test.ts`
