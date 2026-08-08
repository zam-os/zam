# ZAM on iPadOS Is a Standalone App, Not a Companion

**Status:** Accepted — decided by Thomas, 2026-08-08. Implemented on
`feat/ios-standalone`; first run, library management and the OpenRouter
connect are verified on the iPad (A16) simulator. The multi-device upgrade is
covered by tests but unverified against a live Turso database.
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md) ·
[2026-07-24-first-run-onboarding.md](2026-07-24-first-run-onboarding.md) ·
[2026-07-26-ipados-companion-target.md](2026-07-26-ipados-companion-target.md) ·
[2026-07-12-unified-capability-model-registry.md](2026-07-12-unified-capability-model-registry.md) ·
[2026-08-08b-ios-information-architecture.md](2026-08-08b-ios-information-architecture.md)

---

## Context

The iOS app could not start without ZAM Desktop. `start()` loaded a stored
pairing and, finding none, showed the pairing screen — and the only way past
that screen was a QR code generated on a desktop. A learner holding nothing
but an iPad had no way into the app at all.

That was the intended design. ADR 2026-07-23 made companion database access
**online-only** against a server database (§1) and gated mobile on a server
database being configured (§2), on the reasoning that learners need the same
state as the desk rather than offline independence.

Two things changed.

**The product goal moved.** The app is to be released on the App Store and
used as the starting point, with no desktop anywhere in the picture. A learner
should be able to buy an iPad, install ZAM, and be reviewing within a minute.

**App Store guideline 4.2 (Minimum Functionality) makes it a risk, not just a
preference.** Review asks whether a first-time user gets meaningful value
quickly, without special account states or extra instructions. An app whose
first screen demands a QR code from software on another machine — or, in the
alternative, a Turso account and a pasted token — is a plausible rejection.

---

## Decisions

### 1. The device-local database is the default, not a development shortcut

First run provisions a SQLite file in the app sandbox. No account, no network,
no desktop. `database_mode` in `mobile/src-tauri/src/db.rs` already supported
this; it was labelled "dev only" and unreachable from the UI.

**This supersedes ADR 2026-07-23 §2 for iOS.** Mobile is no longer gated on a
server database. §1 (online-only *when* a server database is attached) stands
unchanged — there is still no offline replica of a remote primary, and no
"review offline, sync later" story. The two modes are distinct and the app
says which one it is in: a local library has no upstream, so it offers no
sync button and never claims to be in sync.

### 2. A server database is an upgrade the learner chooses

Settings → *Mehrere Geräte* takes a Turso URL and token, provisions the schema,
and moves the whole library across. The order is load-bearing, because this is
the one flow where a learner can lose history:

1. export the local library to a portable snapshot — **before** anything
   remote is touched, so a failure here changes nothing;
2. open the remote and provision it (`applySchemaAndMigrations`);
3. refuse a target that already holds cards, unless the learner said replace;
4. import;
5. **only then** store the pairing, because that is what makes the switch
   survive a restart. Storing it earlier would strand the learner on an empty
   server database.

The local file is never deleted. It costs a few hundred kilobytes and is the
only copy of a learner's history if a token is later revoked.

QR pairing survives as a *takeover* path — "I already use ZAM on a computer" —
rather than as the entrance.

### 3. Provisioning moves into the kernel, node-free

`SCHEMA` and the migration chain lived in `src/kernel/db/connection.ts` behind
`node:fs`, which a WebView cannot load. They now live in
`src/kernel/db/provision.ts`, expressed purely through the async `Database`
contract, and `connection.ts` calls into it — so there is exactly one
migration path for every platform.

Two defects surfaced in doing this and are fixed:

- `SCHEMA` creates `idx_tokens_title`, but `tokens.title` only exists after
  M010, which ran afterwards. Provisioning a database created before that
  migration failed with `no such column: title`. The desktop never hit it
  because it skips `SCHEMA` for existing local files — but **every remote open
  runs it unconditionally**, so an older Turso database was already exposed.
  `SCHEMA` is split into `SCHEMA_TABLES` and `SCHEMA_INDEXES`, and
  provisioning orders tables → migrations → indexes.
- M010 lacked the `tokenCols.length > 0` guard its neighbours carry.

`computeContentHash` and the snapshot checksum used `node:crypto`. They use a
pure-TS SHA-256 whose output is byte-identical, pinned against `node:crypto` —
a digest differing by one bit would mark every stored embedding stale and
re-embed every library in the fleet.

### 4. The cloud model is connected on the device, and its key lives in the database

Settings → *KI* verifies a pasted key against the provider's authenticated key
endpoint and registers the descriptor's default model for text, image **and**
embeddings. OpenRouter now serves an OpenAI-shaped `/embeddings` endpoint from
the same key, so semantic search costs one paste and no second account.

The key is stored inline in the `ai.models.cloud` row, which is the rule the
desktop already follows for cloud rows (`src/cli/llm/model-registry.ts`):
`apiKeyRef` into a credentials file is meaningless on a device that has no
such file. On a device-local library the database never leaves the sandbox;
once a server database is attached the key travels with it, which is what
makes AI work on a second device without a second paste. This is the trade
ADR 2026-07-23 §4 already contemplated.

### 5. The canonical cloud embedding model id is fixed

Vectors are tagged **`qwen3-embedding-8b`**, and `canonicalEmbeddingModelId`
folds OpenRouter's `qwen/qwen3-embedding-8b` and Ollama's `qwen3-embedding:8b`
spellings onto it.

> **Amended 2026-08-08.** The decision — one fixed canonical id — stands; the
> model behind it has moved twice. It was `qwen3-embedding-0.6b` when this ADR
> was written; OpenRouter removed that model from its catalogue the same day
> and every `/embeddings` call answered 404 (0.29.1 → `qwen3-embedding-4b`).
> The 4B had the same weakness that caused the outage — a single provider —
> so the default is now the 8B, which three providers serve and which costs
> half as much per token. Superseded sizes are deliberately absent from the
> alias set: 1024, 2560 and 4096 dimensions are not comparable, so their rows
> must read as stale rather than be folded onto the current id. Nothing was
> migrated, because ZAM has no users outside the field test yet.

Without this the device and a desktop configured against the same provider
tag the same vectors differently, and on a shared Turso library each would
re-embed the other's tokens — forever, and at cost. The alias set is the
mechanism EmbeddingGemma already uses for the same reason.

### 6. Apple Intelligence is a slot, not an implementation

The Foundation Models framework needs A17 Pro / M-series and iOS 26. No device
in the field-test range qualifies, and the iPad Air (M4) is an October
purchase at the earliest. Building an on-device provider now would mean
shipping untested code for two months. The capability model already supports a
second provider as a registry row, so this stays a data change when hardware
exists.

### 7. Using a subscription instead of an API key: only without app switching

Investigated at Thomas' direction. The Shortcuts route — ZAM calls the "Ask
Claude" App Intent through `x-callback-url` — is technically available and
**rejected**: every evaluation would visibly switch apps and back.

The remaining candidate inverts the direction: ZAM as a **remote MCP
connector** inside the Claude iOS app, so the learner never leaves it. Claude
mobile supports custom connectors (registered on claude.ai, synchronised to
mobile). That requires an MCP server reachable over HTTP with per-learner
auth, so it presupposes the server database from decision 2. Text-based recall
is enough for a first pass; MCP Apps panels are later. Tracked as a spike, not
built.

A visible app switch remains conceivable only for rare side surfaces — the
knowledge graph is the one candidate — and never inside the review loop.

---

## Consequences

**Easier**

- First run is three pages and no account. Guideline 4.2 is answered by the
  app being fully usable — cards, reviews, statistics — without any third
  party.
- One migration path for desktop, CLI and device.
- A learner can fix or retire their own cards, which was impossible on mobile.

**Harder / follow-on**

- Two database modes to keep honest in the UI, forever. Anything that assumes
  a server database (sync status, `db_sync`) must ask first.
- The upgrade path has a failure surface that only a live Turso database can
  fully exercise; tests cover the branches, a field test must cover the rest.
- `mobile/src/main.ts` grew rather than shrank. The decomposition into
  `mobile/src/screens/` that ADR 2026-08-08b describes is not done.

**Supersedes**

- ADR 2026-07-23 §2 for iOS: mobile is no longer gated on a server database.
- The iOS non-goal in ADR 2026-07-26 §3 that evaluation "uses a configured
  cloud endpoint" only via desktop configuration — the device configures it.

**Does not change**

- Kernel stays AI-agnostic; FSRS and queue semantics are untouched.
- Online-only semantics *when* a server database is attached (2026-07-23 §1).
- TestFlight/App Store distribution and the CI compile gate (2026-07-26 §5–6).

---

## Citations

- `src/kernel/db/provision.ts`, `src/kernel/util/sha256.ts`
- `mobile/src/setup/first-run.ts`, `mobile/src/setup/upgrade.ts`
- `mobile/src/ai/connect.ts`, `mobile/src/library.ts`
- `tests/kernel/provision.test.ts`, `tests/mobile/upgrade.test.ts`
