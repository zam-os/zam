# Knowledge Contexts — implementation plan

This plan follows
[`2026-07-04-knowledge-contexts.md`](../adr/2026-07-04-knowledge-contexts.md)
and the worked DocuWare-apprentice persona added during Phase 0. Read
`AGENTS.md` and `CLAUDE.md` before implementation. Work on exactly the next
unchecked phase; keep one branch and one focused commit per completed phase.

## Status

- [x] **Phase 0 — contracts and worked persona**
- [x] **Phase 1 — schema and kernel API**
- [x] **Phase 2 — CLI and bridge contracts**
- [x] **Phase 3 — language resolution and context assignment flows**
- [ ] **Phase 4 — `zam doctor contexts` backfill**
- [ ] **Phase 5 — Studio and Knowledge Graph context selector**
- [ ] **Phase 6 — integration hardening, docs, and release handoff**

## Phase 0 — contracts and worked persona

### Already established

- A knowledge context (`DocuWare`, `vocational-school`, `private`) is
  orthogonal to the subject domain.
- Tokens may belong to multiple knowledge contexts.
- Cards and FSRS state remain learner-owned and per-user.
- Context is not the same as curriculum, goal, workspace/repository, assigning
  authority, or the learner's active situation.
- Existing `Token.context: string` is explanatory token text and must not be
  repurposed.
- Public naming is `knowledgeContexts` in payloads, `--knowledge-context` in
  CLI options, `zam knowledge-context` (alias `zam kc`) as the management
  command, and `list-knowledge-contexts`-style bridge operation names;
  database names remain `contexts` and `token_contexts`. The bare word
  `context` stays reserved for explanatory token text everywhere.
- Context is a learner-facing facet and sync filter, never an authorization
  boundary. Sharing and portability follow the publishing workspace and
  classified source; therefore the minimal `contexts` table has no `visibility`.
- The active knowledge context is explicitly selectable with a per-device
  default; the assignment-prioritizing "active situation" is a separate,
  governance-owned concept and stays out of this feature.
- In the DocuWare working situation, DocuWare assignments are prioritized,
  vocational-school assignments remain eligible, and private assignments are
  excluded by default.
- One card/FSRS history per learner and token serves all contexts and curricula.
- Curriculum publisher and learning assigner are separate roles.
- Team-visible knowledge coverage and named responsibility do not expose private
  review events.
- Confidential company knowledge is removed when access ends; portable
  general-world knowledge remains.
- Declining (`-`) is separate from ratings 1–4 and creates personal suppression
  for an optional token. Obvious mandatory content does not offer `-`.
  Automation may remove the need to learn without counting as human retention.
- Time budgets, progress reporting, mandatory learning, audit, team coverage,
  and detailed decline semantics are deferred to a learning-governance ADR.

### Deferred decisions (not Phase 1 blockers)

- Confidential purge mechanics belong to learning governance and sync.
- Team coverage evidence, time budgets, mandatory completion/reporting, and
  queue pacing belong to learning governance.
- Source classification storage and inference belong to the governance/sync
  work; Knowledge Contexts only guarantees that context never grants access.
- Whether `contexts`/`token_contexts` are knowledge-class (shared, curated) or
  learner-class (private) data in multi-learner sync is open; the multi-learner
  ADR's data-class table gains that row when it is next updated. Sync Phase D
  must not ship before this is answered.

### Phase 0 deliverables

- [x] Record the owner decisions in the ADR and remove superseded open
  questions.
- [x] Freeze the minimal context contract and explicitly defer assignment,
  organization, and active-situation schemas that do not belong in this
  feature.
- [x] Expand the phases below into file-level implementation checklists only
  after the contract is frozen.

## Phase 1 — schema and kernel API

- Add `contexts` (without visibility/access fields) and `token_contexts` to
  `src/kernel/db/schema.ts`.
- Add the matching idempotent M-series migration to
  `src/kernel/db/connection.ts`.
- Add `src/kernel/models/knowledge-context.ts` with ULID-backed create/list/get,
  token assignment/removal, and token-context lookup through the async
  `Database` contract.
- Extend `ListTokensOptions` and `listTokens` in
  `src/kernel/models/token.ts` with a knowledge-context filter using an
  `EXISTS` query so tokens are returned once even with multiple assignments.
- Extend `ReviewQueueOptions` and `buildReviewQueue` in
  `src/kernel/scheduler/queue.ts` with an optional knowledge-context scope
  (ADR Decision 4) restricting due + new card selection to tokens assigned to
  the given context; without the option, queue behavior is unchanged
  (everything, interleaved).
- Re-export the complete public API from `src/kernel/index.ts`.
- Add `tests/kernel/knowledge-contexts.test.ts` covering CRUD, n:m assignment,
  OR membership, filtering, queue scoping, deletion cascades, and unchanged
  behavior for unassigned tokens and unscoped queues.
- Do not implement source classification, sharing, learning assignments, queue
  policy, LLM calls, or UI in this phase.

## Phase 2 — CLI and bridge contracts

- Add `zam knowledge-context list|create|assign|unassign` (alias `zam kc`) in a
  focused CLI command module.
- Add `--knowledge-context` filtering to `zam token list` and repeatable context
  assignment to token creation/import entry points that already create tokens.
- Add the optional `--knowledge-context` scope to `zam review` (ADR Decision 4);
  the queue default stays: everything, interleaved.
- Add additive bridge operations (`list-knowledge-contexts`,
  `assign-knowledge-context`, `unassign-knowledge-context`) plus
  `--knowledge-context` filters; route every bridge response through
  `jsonOut`/`jsonError`.
- Add `knowledgeContexts` arrays to affected token payloads without changing the
  existing string-valued `Token.context` field.
- Add CLI/bridge tests for exact JSON, unknown names/ids, duplicate assignment,
  multiple contexts, and compatibility payloads.

## Phase 3 — language resolution and context assignment flows

- Add `zam knowledge-context use [name]` (and `show`) to set and inspect the
  active context. The per-device default lives as a field on the active
  `WorkspaceConfig` entry in `~/.zam/config.json`
  (`src/kernel/system/install-config.ts`), stored by context name —
  machine-local by design, never synced `user_config`.
- Resolution order: explicit operation option → device default → no active
  context.
- Apply the selected context's language only as a generation default in
  CLI-owned curriculum, title, and doctor generation paths.
- Existing content language always wins; never translate existing tokens merely
  because context changed.
- Add tests for device defaults, explicit override, missing/deleted contexts,
  and language fallback to `system.locale`.

## Phase 4 — `zam doctor contexts` backfill

- Retrofit `src/cli/commands/doctor.ts` to the ADR interaction model first —
  the owner decision covers the existing titles/texts/duplicates/domains tasks
  too: plain `zam doctor` prints a read-only diagnosis report across all
  registered tasks (no LLM calls, no writes), and a new `--json` flag emits
  that report for bridge consumers.
- Register a `contexts` doctor task in `src/cli/commands/doctor.ts`.
- Diagnose unassigned tokens and propose assignments from domains, sources, and
  established content language; do not infer access/publication rights.
- Keep diagnosis read-only; `--fix` previews and confirms; `--yes` applies only
  complete deterministic/proposed choices; `--json` emits the machine-readable
  report.
- Keep all optional LLM assistance under `src/cli/llm/` and provide a no-LLM
  path.
- Add tests for no-write diagnosis, confirmed assignment, ambiguous proposals,
  JSON purity, and idempotent reruns.

## Phase 5 — Studio and Knowledge Graph context selector

- Add a knowledge-context selector above the domain selector in the Studio and
  Knowledge Graph as a pure view filter: it initializes from the per-device
  default, but changing it never writes that default back.
- Show multi-context membership as filtering metadata, never as a sharing or
  confidentiality badge.
- Editing the per-device default is a separate explicit control (settings
  action), persisted through the machine-local `WorkspaceConfig` field from
  Phase 3.
- Let the desktop curriculum-import wizard assign knowledge contexts on import
  (ADR Decision 6 names register/import wizards), prefilled from the device
  default.
- Add desktop logic/i18n tests for all supported locales and verify that domain
  filtering composes correctly with context filtering.
- No multi-learner sync, source classification, reporting, or auditor UI.

## Phase 6 — integration hardening, docs, and release handoff

- Run `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test`, and
  `npm run build`.
- Verify schema migration against a pre-M012 database and both SQLite provider
  result shapes.
- Update help, architecture docs, release notes, ADR status, and this plan.
- Verify no bridge path writes non-JSON output and no `Token.context` consumer
  changed meaning.
- Hand the complete branch to Claude Fable 5 for final acceptance and release
  creation.
