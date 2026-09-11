# Kernel fetch boundary and the architecture handbook

Follow-up to the review in [issue #334](https://github.com/zam-os/zam/issues/334)
(P2 kernel boundary, P4 stale architecture document). The housekeeping
items from that review — migration guards, dead links, `CONTRIBUTING.md`,
duplicated helpers — shipped separately; this plan covers the two changes
that need a decision on shape rather than a mechanical fix.

Work on exactly the next unchecked phase. Keep all phases on one branch and
use one focused commit per completed phase. This plan is harness-agnostic:
any coding agent (or a person) can pick up the next phase from this file
alone.

## Goal

Make the "no fetch in the kernel" rule true again, so the rule in
`AGENTS.md`/`CLAUDE.md` describes the code rather than an aspiration, and
replace the stale *Complete System Reference Manual* with a short map that
cannot rot because it only points at sources that are maintained.

Neither phase changes learner-visible behavior. Neither phase requires a
schema change or a release note beyond one line.

## Status

- [x] **Phase 1 — Azure DevOps connector moves to the CLI layer**
- [x] **Phase 2 — reference resolver takes an injected fetcher**
- [x] **Phase 3 — the rule names its one exception**
- [x] **Phase 4 — `docs/ARCHITECTURE.md` becomes a map**

## Baseline (2026-09-11, `main` @ `9efba6c`)

```bash
grep -rn "fetch(" src/kernel/ --include="*.ts" | grep -v test
```

returns five call sites in three files:

| File | Lines | Verdict |
|------|-------|---------|
| `src/kernel/connectors/azure-devops.ts` | 51, 76 | HTTP to a third-party API — belongs in the CLI layer |
| `src/kernel/recall/reference-resolver.ts` | 171, 190 | HTTP to fetch a card's `source_link` — transport must be injected |
| `src/kernel/db/remote/hrana.ts` | 196 | The binding-free Turso **database driver**; a legitimate exception |

`docs/ARCHITECTURE.md` (401 lines) is stamped *Version 0.4.1 · 2026-06-21*
while the code is at 0.38.2. It describes Turso as opt-in, the bridge CLI as
the primary transport, and a module map that predates the MCP transport,
cells, atoms, the mobile app and the OKF knowledge base. It is linked from
`README.md`, `README.de.md`, ADR 2026-06-20 and one idea document.

## Phase 1 — Azure DevOps connector moves to the CLI layer

The connector talks to `dev.azure.com`; nothing in it is learning logic.
Its only consumers are CLI commands.

1. `git mv src/kernel/connectors/azure-devops.ts src/cli/connectors/azure-devops.ts`.
   The `src/cli/connectors/` directory is new. Adjust the relative import of
   `getADOCredentials` (`../../kernel/credentials.js` or, better, the kernel
   barrel `../../kernel/index.js`, which already exports it).
2. Delete the four re-exports from `src/kernel/index.ts` (the `ADOConfig`,
   `WorkItem` types and the `// Connectors` block with `fetchActiveWorkItems`
   and `loadADOConfig`). `src/index.ts` re-exports the barrel, so the public
   library API loses these two functions — they were never learning API and
   nothing outside the CLI imports them. Say so in the release note line.
3. Update the two consumers:
   - `src/cli/commands/session.ts` imports `fetchActiveWorkItems` and
     `loadADOConfig` from the kernel barrel today; point both at
     `../connectors/azure-devops.js`.
   - `src/cli/commands/connector.ts` imports the file directly from the kernel
     path; point it at `../connectors/azure-devops.js`.
4. If `src/kernel/connectors/` is now empty, remove the directory.
5. Verification: `npm run typecheck`, `npm run lint`,
   `npm run test -- tests/cli/connector-token-refresh.test.ts`, then the full
   suite. `grep -rn "fetch(" src/kernel/` must no longer list `azure-devops`.

## Phase 2 — reference resolver takes an injected fetcher

`resolveReference` in `src/kernel/recall/reference-resolver.ts` does real
work the kernel should keep: `search://` directives, local file reads, mapping
a GitHub URL onto a checked-out repository, HTML-to-text, truncation and the
review-context cache. Only the two remote fallbacks (raw GitHub content and
generic HTTPS) need a transport. Inject it, the way `VoiceReviewAdapter`
(`src/kernel/recall/voice-review.ts`) is injected by the CLI.

1. In `reference-resolver.ts` add

   ```ts
   /** Minimal transport the resolver needs; `globalThis.fetch` satisfies it. */
   export type ReferenceFetcher = (url: string) => Promise<{
     ok: boolean;
     status: number;
     statusText: string;
     text(): Promise<string>;
   }>;
   ```

   and an options bag `{ fetch?: ReferenceFetcher; maxChars?: number }` on
   `resolveReviewContext` (extend the existing `opts`) and a matching
   `{ fetch?: ReferenceFetcher }` on `resolveReference`. Replace the two
   `await fetch(...)` calls with the injected function.
2. Without a fetcher the remote branches do **not** fall back to
   `globalThis.fetch`. They return the shape the generic-URL branch already
   produces when a fetch throws: `sourceType: "remote_web"` with an
   `Error fetching URL reference: …` content line — callers see nothing new.
   Include the fetcher's presence in the review-context cache key, otherwise
   an offline miss would be cached for five minutes and served to a caller
   that does have a fetcher.
3. Add `src/cli/review-context.ts` exporting a `resolveReviewContext` with the
   same signature as the kernel's, minus the `fetch` option, that passes
   `globalThis.fetch`. Repoint the six CLI call sites at it:
   `src/cli/bridge-handlers.ts` (two), `src/cli/llm/client.ts`,
   `src/cli/commands/learn.ts`, `src/cli/commands/review.ts`,
   `src/cli/commands/bridge.ts`. Their import lines change; their call
   expressions do not.
4. `tests/kernel/reference-resolver.test.ts`: add one case that a remote
   `source_link` without a fetcher resolves to the unresolvable shape and
   makes no network call, and one that a stubbed fetcher's text is used. If
   an existing test relied on a live network call, it now needs the stub —
   there should be none.
5. Verification: `npm run typecheck`, `npm run lint`, the resolver test file,
   then the full suite. `grep -rn "fetch(" src/kernel/` must list only
   `hrana.ts`.

## Phase 3 — the rule names its one exception

`AGENTS.md` and `CLAUDE.md` carry the same rule in different words
(`No fetch/LLM/embedding calls under src/kernel/` and
`Never import HTTP/LLM code into the kernel`). Both files must stay in sync.

1. Amend the hard rule in `AGENTS.md` to:
   *No fetch/LLM/embedding calls under `src/kernel/`. The one exception is the
   binding-free database driver in `src/kernel/db/remote/hrana.ts`, which is
   transport for the `Database` contract, not an integration. Anything else
   that needs HTTP takes it as an injected function (see
   `ReferenceFetcher`).*
2. Mirror the same sentence in the *Semantic search* bullet of `CLAUDE.md`.
3. Update the OKF article `docs/okf/kernel-architecture.md` through the
   `zam_okf_upsert` tool (never by hand): its first paragraph says "no fetch
   to model endpoints"; add the injected-transport sentence and the hrana
   exception. Cite ADR 2026-06-09 (Async Database Providers) for the driver.
4. Verification: `git grep -n "hrana" AGENTS.md CLAUDE.md docs/okf/kernel-architecture.md`
   shows all three.

## Phase 4 — `docs/ARCHITECTURE.md` becomes a map

Do not rewrite the handbook. Everything it tries to be is already maintained
elsewhere: the OKF articles are the living reference (ADR 2026-07-17), ADRs
hold the decisions, `AGENTS.md` holds the rules. A second full reference will
drift again within a release cycle. Replace it with a page that fits on one
screen and only points.

1. Rewrite `docs/ARCHITECTURE.md` to roughly this shape (English):
   - Title and a two-sentence framing: kernel vs. CLI, and where the details
     live. Drop the version stamp; the file no longer states facts that age.
   - Keep §1 *Design Philosophy* (three short subsections: AI-agnostic
     kernel, local-first and user-owned, observation over interruption) —
     these are beliefs and still true. Trim, do not extend.
   - A table *Topic → where it is documented*, one row per current handbook
     section:

     | Handbook section today | Replace with |
     |---|---|
     | 2 System Layers | `docs/okf/kernel-architecture.md`, `docs/okf/mcp-surfaces.md`, `docs/okf/bridge-protocol.md` |
     | 3 Data Model & Schema | `docs/okf/token-card-model.md`; DDL is `src/kernel/db/schema.ts` |
     | 4 Scheduling Engine | `docs/okf/fsrs-scheduling.md` |
     | 5 Review & Queue Lifecycle | `docs/okf/fsrs-scheduling.md`, `docs/okf/prerequisite-blocking.md` |
     | 6 Observation & Privacy | ADR 2026-06-20 (observer permission model) — no OKF article exists yet, see step 2 |
     | 7 Agent Skills | `skills/zam/SKILL.md`, `docs/okf/mcp-surfaces.md` |
     | 8 Deployment & Sync | `docs/okf/kernel-architecture.md` §Persistence, ADR 2026-07-23, `docs/okf/mobile-standalone-libraries.md` |
     | 9 Module Directory Map | delete; `AGENTS.md` §Architecture and the OKF index (`docs/okf/index.md`) cover it and are maintained |

   - A closing pointer to `docs/adr/README.md` for decisions and to
     `docs/okf/index.md` for the article list.
2. Section 6 (observation and privacy) is the only handbook content without
   a current-truth home. Before deleting it, write
   `docs/okf/observer-privacy-model.md` through `zam_okf_upsert` from the
   **code** (`src/kernel/observation/policy.ts` and
   `src/kernel/observation/observer-sidecar-policy.ts`), not from the
   handbook text: the handbook predates the Rust sidecar changes and may be
   wrong. Cite
   ADR 2026-06-20. If the code has moved on from what the ADR says, the
   article describes the code and links the ADR under `# Citations`.
3. Fix the inbound links:
   - `README.md:151` and `README.de.md:161` say "See Architecture" for the
     kernel/agent split — point them at `docs/okf/kernel-architecture.md`
     instead; keep the footer link to `docs/ARCHITECTURE.md` (it is now the
     map).
   - ADR 2026-06-20 links `ARCHITECTURE.md §Symbiosis Modes` — ADRs are
     immutable once accepted; leave the ADR text alone. The new map page
     keeps a one-line anchor `## Symbiosis Modes` that points to the OKF
     article so the ADR link still resolves.
   - `ideas/learning/global-curriculum-registry.md` uses `file:///c:/src/...`
     links with line numbers; replace with repository-relative links to the
     OKF articles. Ideas are not immutable.
4. Verification: every relative link in the new `docs/ARCHITECTURE.md`
   resolves (`for f in $(grep -o '](\.\./[^)]*\|]([a-z][^)]*' docs/ARCHITECTURE.md | tr -d '](' ); do test -e docs/$f || echo "dead: $f"; done`),
   `npm run test -- tests/cli/okf-bundle.test.ts tests/cli/okf-conformance.test.ts`
   passes after the upsert, and `git diff --stat`
   shows the handbook shrinking, not growing.

## Non-goals

- Splitting `src/cli/commands/bridge.ts` or `src/cli/llm/client.ts` (P1 in
  the issue). Deliberately deferred: highest effort, highest regression risk
  in the most-used transport path, no learner value during the field test.
  Move a subcommand group out only when it is touched for another reason.
- Moving `src/kernel/system/install-config.ts` or `src/kernel/credentials.ts`
  out of the kernel (P2 "platform layer"). Worth an ADR first; not this plan.
- Replacing the in-process Commander re-parse in `bridge serve` (P5).
