# Online-Only Server Database, Mobile Gating, and Cloud Config in the DB

**Status:** Accepted
**Date:** 2026-07-23
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md) ·
[2026-07-12-unified-capability-model-registry.md](2026-07-12-unified-capability-model-registry.md) ·
[2026-07-21-android-companion-tauri-shell.md](2026-07-21-android-companion-tauri-shell.md) ·
plan [2026-07-21-android-companion-app.md](../plans/2026-07-21-android-companion-app.md)

---

## Context

The Android companion was designed **offline-capable** after pairing: a local
libsql offline-writable synced replica of a Turso/sqld primary, with manual
`db_sync`, conflict policy, and dual-device offline reviews (plan FR-4, ADR
2026-07-21). That path:

- complicated every follow-on feature (cloud model config, pairing payload
  size, vision import, multi-device semantics);
- is already unreliable in the field-test environment;
- was never the product differentiator — learners need **the same learning
  state as the desk**, not offline independence on day one.

Separately, machine-local vs shared storage for AI models (ADR 2026-07-12)
left open whether cloud catalog entries should live in the synced learner
database. Mobile needs cloud vision/text without shipping secrets in every
QR scan.

Local SQLite on the desktop remains valuable as the **fastest first-run
setup** (no account, no network). It was never meant to be the multi-device
source of truth.

---

## Decision

### 1. Companion database access is **online-only** (target A)

- The phone talks to the **server database primary over the network**
  (Turso/sqld, host-agnostic URL + token). No offline-writable local
  replica; no “review offline, sync later” product goal.
- Without connectivity (or with auth failure), the app surfaces an honest
  error and does not pretend to accept durable writes.
- The previous Phase-0 path (`new_synced_database` + local WAL push/pull)
  is **abandoned as a product requirement**. Implementation may keep
  transitional code until the remote-open path ships; new work must not
  depend on offline sync semantics.

### 2. Local desktop DB does **not** offer mobile QR pairing

- Pair mobile / QR connect is available **only when a server database is
  configured** on that desktop (or workspace).
- A pure local `zam.db` install is for single-machine learning only: fast
  setup, no multi-device.
- Mobile is **unlocked after** the learner attaches a server database.

### 3. Server-DB attachment via a dedicated setup wizard (issue #218)

- Desktop gains a **wizard to create/connect a Turso (or compatible sqld)
  database** and store credentials — not invent ad-hoc pairing from local
  files.
- Details (UX, free-tier bootstrap, token scoping, migration of an existing
  local library into Turso) live in
  [#218](https://github.com/zam-os/zam/issues/218) and a follow-on plan;
  this ADR only gates mobile on “server DB present.”

### 4. Cloud model configuration lives in the **server database**

- Cloud model endpoint records (URL, model id, api flavor, capability
  flags, ordering among cloud peers, non-secret metadata) are stored in
  the learner/server DB so every online client (desktop on server DB,
  phone) sees the same cloud config after attach.
- **Local models** (Ollama, Foundry, loopback URLs, runners) and **where
  the local model sits** in the preference order remain **machine-local**
  (`~/.zam/config.json` / capability registry local slice).
- Secrets: prefer `apiKeyRef` + machine-local credentials on desktop;
  mobile field-test may read cloud keys from server-DB settings when the
  endpoint is intentionally shared with the phone (explicit, not default
  for every secret). Refine in the model-registry follow-on if needed.

### 5. Pairing payload stays thin

- QR / manual pair carries server DB URL + token + learner id (+ optional
  locale). It does **not** need to embed the full cloud model matrix;
  clients load that from the DB once online.
- LLM recall on the phone may still use on-device paths (e.g. Gemini Nano)
  without any cloud key in the QR.

---

## Consequences

**Easier**

- No offline conflict story for card rows.
- Cloud vision / text import on mobile is “settings in DB + network.”
- Local-only desktop stays simple; multi-device is an explicit upgrade
  step (wizard → pair).
- Architecture matches operational reality (sync already painful).

**Harder / follow-on work**

- Mobile shell must open a **remote** libsql/Hrana connection (or
  equivalent) instead of `new_synced_database`; every write needs network.
- UI copy and FR-4 must drop “works offline after pairing.”
- Existing field-test devices re-pair after the open-path change.
- Migrating a local library into Turso is part of the wizard issue, not
  silent magic on first QR.

**Supersedes (in part)**

- Offline-capable product claims in plan
  `2026-07-21-android-companion-app.md` (FR-4, NFR offline) — plan text
  updated to match this ADR.
- ADR 2026-07-21’s requirement that `new_remote_replica` is “insufficient”
  because offline writes were required — offline writes are no longer
  required; remote primary writes are the intended path.
- ADR 2026-07-12 open question on a shared cloud catalog: **yes for cloud
  models in the server DB**; local models stay machine-local.

**Does not change**

- Kernel remains AI-agnostic; FSRS and queue semantics unchanged.
- On-device speech and on-device answer evaluation (Nano) remain local.
- Desktop may still use a local SQLite file when no server DB is attached.

---

## Implementation sketch (not this ADR’s commit scope)

1. Issue #218 + plan: Turso create/connect wizard; gate “Pair mobile” on server DB.
2. Mobile: open remote DB (online-only); remove or stub sync UX that implied
   offline durability.
3. Model registry: split cloud rows → DB, local rows → machine config;
   `resolveCapability` merges by order.
4. Phase-7 image import continues to read cloud vision from DB settings
   (interim `llm.vision.*` or registry cloud image capability).

---

## References

- Plan: `docs/plans/2026-07-21-android-companion-app.md`
- Field-test decision notes: Thomas, 2026-07-23 (online-only A; no QR on
  local-only desktop; Turso wizard gates mobile; cloud config in DB;
  local models machine-local only)
