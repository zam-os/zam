# ZAM 0.22.0 — iPadOS companion

ZAM Mobile now runs on **iPadOS** as well, as a second target on the same
Tauri shell. The kernel, the frontend and the libsql database path are shared
unchanged — there is no second app and no second kernel.

The reason is the school day: where a class is issued iPads, iPadOS decides
whether ZAM is part of lessons or only of the evening.

This is an **alpha**. The iOS target builds, signs and is wired into the
release pipeline, but it has **not been installed on a device**, and
TestFlight distribution is untested.

## Highlights

- **iPadOS target (ADR 2026-07-26).** QR pairing with Keychain-backed
  credential storage, sync, offline review, de/en, daily reminders. Reference
  device is the iPad (A16, 11th generation); the intended minimum is an
  iPhone 14. Deployment target is iOS/iPadOS 17.0.

- **Responsive tablet layout.** Breakpoints at 700 px and 1000 px widen the
  reading column to 680/760 px and put all four FSRS ratings on one row. The
  column stays deliberately narrow — a full 11-inch measure hurts recall. This
  applies to Android tablets too.

- **No on-device evaluation on iOS.** The iPad (A16) and iPhone 14 (A15) are
  both below the Apple Intelligence floor, so the Foundation Models framework
  is unavailable and Gemini Nano has no counterpart. Evaluation uses a
  configured cloud endpoint, or self-rating. This is a hardware fact, not a
  scheduling decision.

- **Also not ported:** voice mode, in-app update, and share-sheet quick
  capture. Each for a platform reason rather than a time reason; iOS has no
  sideload channel at all, so updates go through TestFlight.

- **Curriculum import creates prerequisite edges automatically** (#231).
  Imported topics arrive already linked, instead of needing the dependencies
  wired up afterwards.

- **Central curriculum service: scope decided** (ADR 2026-07-26b). The planned
  service will carry **content only** — no cards, no review logs, no sessions.
  Learner state has no table in its schema, so the boundary is structural
  rather than a promise, which also keeps third-party hosting uncomplicated.

## Android

Unchanged. The Pixel 9 remains the reference device, and a **Pixel 10 passed
validation on 2026-07-26** with no changes required.

## Under the hood

- Swift plugins live in a SwiftPM package that the Rust build links
  (`mobile/src-tauri/ios/`), not in the Xcode app target — the Rust staticlib
  links before Swift compiles, so `@_cdecl` symbols in the app target are
  invisible to it. Android needs no equivalent because it loads its plugin
  class reflectively at runtime.
- CI gained an `ios` job that compiles the Swift against the simulator SDK
  without code signing, so the gate needs no secrets and works on forks.
- `secure_store` and `reminder` now gate on Tauri's `mobile` cfg and differ
  only at plugin registration.
