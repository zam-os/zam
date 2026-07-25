# Closed-group learning library — implementation handover

Read [`AGENTS.md`](../../AGENTS.md) first, then
[ADR 2026-07-04](../adr/2026-07-04-multi-learner-shared-knowledge.md)
("Closed-Group Learning Library: Curation, Privacy and Deployment", **Accepted**
2026-07-25). Work exactly the next unchecked phase. Keep multi-phase work on one
branch with one focused commit per completed phase.

Handover written 2026-07-25 after Phase B. Harness-agnostic: nothing below
depends on which agent does the work.

## Where things stand

| | State |
|---|---|
| ADR 2026-07-04 | **Accepted**, merged (#104). 15 decisions, all owner-answered |
| ADR 2026-07-25 "Review Once, Serve Many" | Accepted; the *product principle* this ADR implements. Cross-linked both ways |
| Phase B — content versioning | **Done**, [PR #227](https://github.com/zam-os/zam/pull/227) green on all five checks, **not merged** |
| Everything else | Not started |

Repo state at handover: `main` = `7e69b99`; Phase B branch
`feat/library-content-versioning`.

## What Phase B already gives you

`M015` (`src/kernel/db/connection.ts`) added `tokens.content_version` and
`cards.learned_content_version`, both defaulting to `1` — that default *is* the
backfill, so existing decks migrate in sync.

`src/kernel/library/revision.ts` exports:

- `publishTokenRevision(db, { tokenId, materiality, changes? })` —
  `materiality` is `"cosmetic" | "material"` and is **never defaulted**;
  omitting it throws. Cosmetic updates the text; material bumps
  `content_version` and sets every card that learned an older version due now.
- `isAwaitingRetest(db, cardId)` — true when this learner has not been
  re-tested since a material change. **Phase 1 below needs this.**

`evaluateRating` syncs `learned_content_version` to the token's current version
after every rating, so a re-tested card is not pulled forward again.

**The invariant to preserve:** a material change *re-tests*, it does not reset.
`due_at` is the only field touched — stability, difficulty, reps and lapses all
survive so the learner's next rating recalibrates from real evidence. Do not
"improve" this by zeroing FSRS state or applying a stability penalty; ADR
Decision 3 explains at length why both are wrong.

Tests: `tests/kernel/library-revision.test.ts` (10 cases, including the
pre-M015 upgrade path). Full suite 1565 passing.

## Phases

- [x] **Phase 1 — explain the re-test on the card.** A card reappearing after a
      material publish is correct but currently unexplained, which reads as a
      bug. Surface "content changed by …, <date>" plus what changed, on the
      recall surfaces (desktop `study-view` and `desktop/src/panel/recall.ts`).
      `isAwaitingRetest()` is exported for this; the queue query in
      `src/kernel/scheduler/queue.ts` (two SELECTs, due + new) is where a
      `contentChanged` flag belongs. Needs provenance — who published and when
      — which the schema does **not** carry yet; add it in this phase or state
      that the notice omits the author.
      *Open question the ADR left for a human: may a learner defer or dispute a
      reset? Do not invent an answer — ask the project owner.*

- [x] **Phase 2 — the Studio release step** (ADR Decision 2). Authoring and
      review happen in git (as OKF already works); the Studio owns **release**:
      show a curator what a merge would change for learners, force the
      cosmetic/material classification, then publish. Merging a PR must **not**
      by itself reach anyone's queue — publishing does. This is the half git
      cannot do, because "what happens to people who already learned the old
      version?" is a scheduling question.

- [ ] **Phase 3 — editorial state.** `draft` / `in_review` / `published` /
      `deprecated` on tokens, and learners only ever consume `published`.
      Deliberately deferred out of Phase B: the kernel does not need these
      states until Phase 2's surface exists. Note `tokens.deprecated_at` already
      exists and `maintenance_at` is a working precedent for a token-level state
      that removes cards from scheduling.

- [ ] **Phase C0 — Postgres provider on local Docker.** No Azure resource is
      needed and none should be created. Add a third case to
      `describeDatabaseContract(...)` in
      `tests/kernel/provider-contract.test.ts` (today: local SQLite + an Hrana
      stub) and a Postgres service container in `.github/workflows/ci.yml`.
      Scope, measured 2026-07-25 — re-confirm before starting:
      `datetime('now')` ×21, `LIKE` ×16 (SQLite's is case-insensitive for
      ASCII, Postgres' is not → `ILIKE`), `INSERT OR IGNORE` ×4,
      `last_insert_rowid` ×3, plus mechanical `?`→`$n` in the adapter. ULIDs
      mean almost no autoincrement coupling. Tens of sites, not hundreds.
      **Also in this phase: the RLS isolation suite** — "learner A cannot read
      learner B's review logs" through any supported query path. RLS is the
      load-bearing privacy boundary (Decision 6) and it is ordinary PostgreSQL,
      so it is provable locally on every CI run.

- [ ] **Phase C — Deployment B.** Blocked on external decisions, see below.
      Entra token acquisition and refresh, the ULID ↔ Entra principal mapping,
      RLS policies applied for real, and the admin runbook.

- [ ] **Phase D — assignments** (ADR Decision 10). Binding while active — the
      learner cannot detach the card; once withdrawn, cards and full history
      stay with the learner to keep, detach ("not for me"), or delete. An
      assigner may withdraw an assignment but **never** delete another person's
      cards or review history.

Phase E (a broad curriculum library) is explicitly gated on real experience
from the closed group. Do not start it.

## Constraints that are not obvious from the code

- **No aggregates about people. At all.** Not opt-in, not "just coverage".
  Decision 11 — beyond privacy, FSRS only works when a rating of 1 is safe to
  give; a learner who believes failures are visible rates generously and the
  scheduler starts optimising against fiction. If a feature request arrives for
  "team progress", it is a content-level signal (anonymous, thresholded, about
  cards) or it is nothing.
- **PostgreSQL 17, never 18.** Azure's Entra integration targets the PG11–17
  token model; PG18 replaced the auth framework and Entra sign-in **fails** on
  it. The documented workaround is static passwords, which discards the whole
  point.
- **PostgreSQL roles are cluster-wide.** There is no per-database user as in
  Azure SQL. Isolation is `REVOKE CONNECT … FROM PUBLIC` plus per-database
  grants — built, not inherited.
- **Existing database paths must keep working.** Local SQLite, the libsql
  replica and Turso/`sqld` stay the default. Everything new is parallel and
  opt-in.
- **The kernel stays single-learner**: no RLS, no auth, no HTTP in
  `src/kernel/`. Multi-learner semantics live in the CLI/sync layer.
- **New i18n strings**: en/de only, then allowlist in
  `tests/desktop/i18n-completeness.test.ts`. Do not machine-fill the other five
  packs — they await native review.

## Blocked on humans, not on code

1. **PG17 vs PG18 with the Azure SQL migration prototype.** The server will
   host ~5 databases (three for the service being replaced, plus `zam_test` and
   `zam_prod`). One major version per server, and an in-place upgrade is
   irreversible. If that prototype targets 18, it cannot share a server with
   ZAM. Settle before the server is created.
2. **The subscription itself** — DocuWare must provide it before Phase C can
   touch anything real. ZAM's marginal cost is $0 (billing is per server).
3. **Whether a learner may defer or dispute a re-test** (Phase 1).

## Verifying

```bash
npm run lint && npm run typecheck && npm run test
```

Desktop is a separate typecheck and is **not** covered by the root one — a
missing import there broke the 0.20.0 release build:

```bash
cd desktop && npx tsc --noEmit
```

MCP Apps panels cannot be verified by opening `file://` in a browser pane (it
hangs). Verify via the test suite, both typechecks, and by grepping the built
`dist/ui/*.html` for the change.
