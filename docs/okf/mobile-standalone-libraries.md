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
timestamp: 2026-08-15T08:54:42.759Z
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

# Bundled learning paths and field-test review

The Mobile Library lists the same four commit-controlled bundled learning cells
as Desktop. One learner action installs the tile and then enrols the current
user, but the kernel operations remain separate: installation writes shared
atoms, bindings, edges, and practice items with zero cards; enrolment
materializes only the cell's scoped personal cards. Status checks require every
atom **and** every practice-item id, so overlapping cells cannot produce a
false installed badge.

A mobile review session persists a bounded kernel queue snapshot. It renders
the item tier, turns valid Tier-1 binary checks into one-tap choices, offers
finite hard-precondition self-assessment when the prerequisite reaches the
queue, and exposes keep-going only after the snapshot ends. Accepted unseen
cards use an explicit temporary `maxNew` budget; future reviews and active
precondition deferrals may be pulled to the present. A prepared out-of-scope
bonus atom is offered, never scheduled automatically. All of these paths work
against either the local or server-backed database through the same async
kernel contract.

# Citations
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- Tests: `tests/mobile/review-session.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/precondition-assessment.test.ts`
- Code: `mobile/index.html`, `mobile/src/main.ts`, `mobile/src/review-session.ts`, `src/kernel/library/bundled-cells.ts`

- [ADR 2026-08-08 — ZAM on iPadOS Is a Standalone App, Not a Companion](../adr/2026-08-08-ios-standalone-app.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- Code: `mobile/src/main.ts`, `mobile/src/setup/first-run.ts`, `mobile/src/setup/upgrade.ts`, `mobile/src-tauri/src/db.rs`, `src/kernel/db/provision.ts`, `tests/mobile/first-run.test.ts`, `tests/mobile/upgrade.test.ts`
