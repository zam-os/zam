# Semantic Token Search (Phases 1–3) — implementation handoff

Implements [ADR 2026-07-03 — RAG / Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
(Accepted). Read the ADR first; this plan turns its decisions into concrete
steps. It is written to be executed step-by-step without further architectural
decisions, by **any coding agent/harness** (Claude Code, Codex, Antigravity, …):
read the repo root `AGENTS.md` for the non-negotiable conventions, implement
**exactly one unchecked phase per run**, and make one commit per phase on this
branch.

## Status

- [x] **Phase 1** — done, commit `efab781` on `feat/semantic-token-search`
  (verified: 469 tests / 52 files, lint, typecheck, build all green).
  The Phase-1 sections below now describe **existing code** — treat them as
  documentation of what you inherit, including the post-review corrections
  marked *(as implemented)*.
- [x] **Phase 2** — done, commit `e729d9d` (+ review fixes in `64948ce`).
- [x] **Phase 3** — done, commit `663162e`, hardened by `891ad30`…`b48ca9e`
  after a Hermes/Codex review cycle (serve-mode stdin handling, corrupt-BLOB
  resilience, CLI-owned Gemma prompt templates, bounded dedup backfill,
  `register --json` compatibility). Final state verified: 500 tests / 55
  files, lint, typecheck, build all green.

All three phases are merged; Phase 4 (company-tier backend) remains future
work per the ADR. Note for existing databases embedded before the Gemma
prompt templates landed: run `zam token reembed --all` once.

## Goal

Make tokens findable by meaning, not just keywords: embeddings stored beside
tokens, exact cosine similarity in the kernel, hybrid (lexical + vector)
ranking behind one search path used by `zam token find`, the `/zam` dedup step,
and a new task-relevance query. Everything degrades gracefully to today's
lexical behavior when no embedding model is available.

## Decisions already made — do not relitigate

1. **No new dependencies, native or npm.** Embeddings are plain float32 BLOBs;
   similarity is TypeScript. No libsql-native vector functions, no sqlite-vec.
2. **Default embedding model: `embeddinggemma`** (768-dim, multilingual) via
   the OpenAI-compatible `/v1/embeddings` endpoint (Ollama serves this).
   The same weights run on other runtimes under different tags — see the
   runtime matrix below and the canonical-model-id rule in 1.3.
3. **Kernel stays AI-agnostic.** All HTTP lives in `src/cli/llm/`. The kernel
   only stores vectors, detects staleness, and ranks — pure functions + SQL.
4. **Staleness is derived via content hash**, not maintained by write-path
   hooks. `createToken`/`updateToken` are NOT modified.
5. **One branch, one PR** (`feat/semantic-token-search` off `main`), one commit
   per phase, commit format `feat: <summary>` / `test: <summary>`.

## Runtime matrix — who serves embeddings on which machine

Verified 2026-07-04. Each machine binds the `embedding` role to its local
runtime via the machine-local provider config (ADR 2026-06-25a); the canonical
model id (see 1.3) keeps vectors valid across machines sharing one Turso DB.

| Machine | Runtime | Wire model name | URL | Notes |
|---------|---------|-----------------|-----|-------|
| macOS / generic CPU | Ollama | `embeddinggemma` | `http://localhost:11434/v1` | `ollama pull embeddinggemma` (~600 MB) |
| Windows Ryzen AI (NPU) | FastFlowLM ≥ server mode with `--embed` | `embed-gemma` (pull tag `embed-gemma:300m`, weights `google/embeddinggemma-300m` Q4_1) | `http://127.0.0.1:52625/v1` | Runs fully on the NPU. **Constraint:** embeddings work only in server mode loaded *alongside* an LLM — `flm serve <llm-model> --embed 1`; not available in flm CLI mode. ZAM must not try to auto-start this (consistent with the no-autostart rule in 1.3). |
| Windows (Foundry Local) | **Not usable today** | (catalog has `qwen3-embedding-0.6b`, no EmbeddingGemma) | — | Foundry Local's embeddings are SDK-only (in-process); its OpenAI-compatible REST server exposes `/v1/chat/completions` and `/v1/audio/transcriptions` but **no `/v1/embeddings`** (checked against the REST reference, API "under active development"). Also uses a dynamic port. Revisit when `/v1/embeddings` lands; adopting its `qwen3-embedding-0.6b` (1024-dim) would be a model change → `zam token reembed` handles the full refresh. |

Windows/Ryzen AI settings example:

```bash
zam settings set llm.embedding.url http://127.0.0.1:52625/v1
zam settings set llm.embedding.model embed-gemma
```

## Ground rules (project conventions that bite here)

- `zam bridge` subcommands emit **JSON only** — every output through the
  existing `jsonOut`/`jsonError` helpers in
  [bridge.ts](../../src/cli/commands/bridge.ts).
- The DB is accessed through the async `Database` contract
  ([types.ts](../../src/kernel/db/types.ts)) — `await db.prepare(...).all(...)`,
  never a concrete driver import.
- BLOB values come back as `Buffer` (better-sqlite3) **or** `Uint8Array`
  (remote provider). Handle both — see the exact `decodeEmbedding` below;
  `Buffer`s from better-sqlite3 are views into a shared pool with non-zero
  `byteOffset`, and `new Float32Array(buf.buffer, ...)` throws or reads garbage
  if you ignore that.
- Existing hot queries do `SELECT * FROM tokens` — do not add columns to
  `tokens`, and do not modify `findTokens` (it becomes the lexical leg).
- New kernel API must be re-exported from
  [src/kernel/index.ts](../../src/kernel/index.ts).
- Run `npm run lint`, `npm run typecheck`, `npm run test` before each commit.

---

## Phase 1 — Embeddings pipeline

### 1.1 Schema

Add to [schema.ts](../../src/kernel/db/schema.ts) (with the other tables) and
as migration **M009** in `runMigrations`
([connection.ts](../../src/kernel/db/connection.ts)) — same idempotent
`CREATE TABLE IF NOT EXISTS` style as M006/M007:

```sql
CREATE TABLE IF NOT EXISTS token_embeddings (
  token_id     TEXT PRIMARY KEY REFERENCES tokens(id) ON DELETE CASCADE,
  embedding    BLOB NOT NULL,
  model        TEXT NOT NULL,
  dims         INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  embedded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 1.2 Kernel repo: `src/kernel/models/token-embedding.ts`

New module, exported from `src/kernel/index.ts`. Contents:

```ts
export interface TokenEmbedding {
  token_id: string;
  model: string;
  dims: number;
  content_hash: string;
  embedded_at: string;
  embedding: Float32Array;
}

export type EmbeddingStaleness =
  | "missing"
  | "content-changed"
  | "model-changed"
  | "dimension-changed";

export interface TokenNeedingEmbedding {
  token: Token;
  /** Canonical text to embed — already hashed the same way. */
  text: string;
  reason: EmbeddingStaleness;
}
```

Functions:

- `embeddingContentForToken(...)` builds
  `` `${t.concept}\n${t.question ?? ""}\n${t.domain}` ``;
  `embeddingTextForToken(...)` wraps it as EmbeddingGemma retrieval-document
  input (`title: none | text: ...`), while `embeddingTextForQuery(...)` uses
  the paired retrieval-query input (`task: search result | query: ...`). The
  prompted document text is canonical: every hash and stored vector derives
  from it, so a prompt-profile change automatically makes rows stale.
- `computeContentHash(text: string): string` — `node:crypto`
  `createHash("sha256").update(text, "utf8").digest("hex")`.
- `encodeEmbedding(vec: ArrayLike<number>): Uint8Array` —
  `const f = Float32Array.from(vec); return new Uint8Array(f.buffer);`
  (fresh buffer, so no aliasing). All supported platforms are little-endian;
  this matches libSQL's F32_BLOB layout for the future company tier.
- `decodeEmbedding(blob: Uint8Array): Float32Array` — *(as implemented; an
  earlier revision of this snippet used `blob.slice()`, which is broken for
  `Buffer` inputs: `Buffer.prototype.slice` returns a view, not a copy — a
  legacy Node API quirk caught by the Phase-1 tests)*:

  ```ts
  export function decodeEmbedding(blob: Uint8Array): Float32Array {
    if (blob.byteOffset % 4 === 0) {
      return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
    }
    // better-sqlite3 Buffers are pool-backed and may be unaligned — copy.
    // Uint8Array's slice must be borrowed explicitly to force a real copy.
    const copy = Uint8Array.prototype.slice.call(blob) as Uint8Array;
    return new Float32Array(copy.buffer, 0, copy.byteLength / 4);
  }
  ```

- `upsertTokenEmbedding(db, input: { tokenId: string; embedding: ArrayLike<number>; model: string; contentHash: string }): Promise<void>`
  — `INSERT … ON CONFLICT(token_id) DO UPDATE SET embedding=…, model=…, dims=…,
  content_hash=…, embedded_at=…`; `dims` = vector length, `embedded_at` =
  `new Date().toISOString()`.
- `getTokenEmbedding(db, tokenId): Promise<TokenEmbedding | undefined>` —
  decode the blob on the way out.
- `listTokensNeedingEmbedding(db, model: string, opts?: { limit?: number; force?: boolean; dims?: number }): Promise<TokenNeedingEmbedding[]>`
  — one query:
  `SELECT t.*, e.model AS emb_model, e.content_hash AS emb_hash FROM tokens t
  LEFT JOIN token_embeddings e ON e.token_id = t.id WHERE t.deprecated_at IS NULL`,
  then in JS: compute `embeddingTextForToken` + hash per row; classify
  `missing` (no row), `model-changed` (`emb_model !== model`),
  `dimension-changed` (expected dims differ), or `content-changed` (hash
  mismatch); `force: true` returns every row (reason
  `content-changed` if it would otherwise be fresh). Apply `limit` after
  classification.
- `getEmbeddingCoverage(db, model, { dims? }): Promise<{ tokens: number; embedded: number; missing: number; stale: number }>`
  — same scan, just counts (`stale` = content, model, or dimension mismatch).
- `listEmbeddedTokens(db, model: string): Promise<Array<{ token: Token; embedding: Float32Array }>>`
  — `SELECT t.*, e.embedding FROM token_embeddings e JOIN tokens t ON t.id =
  e.token_id WHERE e.model = ? AND t.deprecated_at IS NULL`. Used by the
  Phase-2 vector leg. Re-hashes rows before returning them because bounded
  top-up may leave additional stale rows for a later pass; old meanings must
  never enter search.

### 1.3 CLI embedder: `src/cli/llm/embedder.ts`

New module in the CLI layer (HTTP is allowed here). Reuses the role/provider
system in [client.ts](../../src/cli/llm/client.ts):

- In `client.ts`: extend `export type LlmRole = "vision" | "recall" | "text"`
  with `"embedding"`, and add an `embedding` branch to `getLegacyRoleConfig`:
  url = `llm.embedding.url` setting or `base.url`; model =
  `llm.embedding.model` setting or `DEFAULT_EMBEDDING_MODEL`; apiKey =
  `llm.embedding.api_key` or `base.apiKey`; enabled gate = `llm.enabled` (same
  as recall/text). The JSON `llm.providers`/`llm.roles` path then works for
  role `"embedding"` with no further changes.
- In [src/cli/providers/config.ts](../../src/cli/providers/config.ts): add
  `"embedding"` to `VALID_ROLES`. Grep the repo for other literal role lists
  (`"vision", "recall", "text"`) and extend them too (provider status command,
  Studio bridge status if present). *(as implemented, this also required:
  `MachineAiRole` in `src/kernel/system/install-config.ts` widened with
  `"embedding"` — a plain config string union, no AI logic — and
  `bridge provider-status` now reports the `embedding` role.)*
- In `embedder.ts`:
  - `export const DEFAULT_EMBEDDING_MODEL = "embeddinggemma";`
  - `canonicalEmbeddingModelId(model: string): string` — different runtimes
    serve the **same weights under different tags** (Ollama `embeddinggemma`,
    FastFlowLM `embed-gemma` / `embed-gemma:300m`, HF
    `google/embeddinggemma-300m`). Lowercase the input and map all of those
    aliases to `"embeddinggemma-300m"`; unknown ids pass through lowercased.
    **Every kernel call** (`listTokensNeedingEmbedding`, `upsertTokenEmbedding`
    `model` field, `listEmbeddedTokens`, the `model` in `embedQuery`'s result)
    uses the canonical id; the configured raw name is used **only on the wire**
    (`embedTexts` body, `getAvailableModels` check). Without this, a
    Turso-synced DB would re-embed everything whenever a differently-tagged
    machine (macOS Ollama vs. Ryzen AI flm) runs a search.
  - `resolveUsableEmbeddingEndpoint(db): Promise<ProviderConfig | null>` —
    `getProviderForRole(db, "embedding")`; check primary and configured
    fallback in order, returning `null` (never throw) when disabled or neither
    endpoint has an available model. Do NOT auto-start runners.
  - `embedTexts(endpoint: { url: string; model: string; apiKey: string }, texts: string[]): Promise<number[][]>`
    — POST `${url}/embeddings`, headers as in the chat calls, body
    `{ model, input: texts }`; parse `{ data: [{ embedding, index }] }`,
    reorder by `index`, validate every vector is a non-empty array of finite
    numbers and all lengths match. 60 s `AbortController` timeout. Errors match
    the house style (`` `Embedding request failed: ${res.statusText} (${res.status}) - ${body}` ``).
  - `ensureTokenEmbeddings(db, opts?: { limit?: number; force?: boolean; dims?: number }): Promise<{ status: "ok" | "unavailable"; embedded: number; remaining: number; reason?: string }>`
    — resolve endpoint (null → `unavailable` with a human-readable `reason`:
    disabled / all endpoints offline / no configured model available);
    `listTokensNeedingEmbedding(db, endpoint.model,
    { limit: opts?.limit ?? 64, force })`; embed in batches of 16 via
    `embedTexts`; `upsertTokenEmbedding` each with the hash of the exact
    `text` that was sent; `remaining` = coverage recount after.
    *(as implemented)* **This function never throws.** Mid-flight failures
    (server dies between the health check and the embed call, model 404s at
    embed time) are caught and returned as `status: "unavailable"` with the
    partial `embedded` count and the error text as `reason` — Phase 2's
    `token find` relies on this to keep search unbreakable.
  - `embedQuery(db, text: string): Promise<{ vector: number[]; model: string } | null>`
    — apply the retrieval-query prompt, then single-text embed; `null` on
    unavailable **or on any network error** (semantic search must never break
    search).

### 1.4 CLI command: `zam token reembed`

In [token.ts](../../src/cli/commands/token.ts), following the house style of
the other subcommands (`withDb`, `--json`, `--quiet`):

- Options: `--all` (force re-embed fresh vectors too), `--json`, `--quiet`.
- Flow *(as implemented)*: embed a small dimension probe → dimension-aware
  coverage before → loop `ensureTokenEmbeddings` until `remaining === 0` or no
  progress → coverage after → print
  `Embedded N tokens (M total, K stale before) with <model>` (where
  `K = missing + stale`) or the JSON equivalent.
  **`--all` runs as a single unbounded forced pass**
  (`{ force: true, limit: Number.MAX_SAFE_INTEGER }`, first iteration only):
  force with a per-call cap either loops forever (forcing every pass
  re-selects the same leading batch) or skips fresh tokens beyond the cap
  (forcing only a capped first pass) — unbounded is the only correct shape.
- If the endpoint is unavailable: exit code 1 with the actionable `reason`
  (plain text, or `{ "error": …, "embedded": <partial count> }` under
  `--json`).

### 1.5 Phase-1 tests

`tests/kernel/token-embeddings.test.ts` (open the DB like
[repos.test.ts](../../tests/kernel/repos.test.ts) does — temp dir +
`openDatabase`):

- encode/decode round-trip, including an unaligned view
  (`const pool = Buffer.concat([Buffer.alloc(2), Buffer.from(encoded)]); decodeEmbedding(pool.subarray(2))`).
- upsert → get returns the same vector, model, dims, hash.
- Staleness matrix: fresh token → `missing`; after
  `updateToken(db, slug, { concept: "…" })` → `content-changed`; stored with
  another model id → `model-changed`; same model with different expected dims
  → `dimension-changed`; fresh vector → not returned (and returned with
  `force: true`).
- `deleteToken` cascades the embedding row away.
- `getEmbeddingCoverage` counts match the matrix.

`tests/cli/embedder.test.ts` (see [hrana-stub.ts](../../tests/helpers/hrana-stub.ts)
for the in-process `node:http` server pattern):

- Stub `/v1/embeddings` (or `/embeddings` under the configured base) returning
  vectors with shuffled `index` values → `embedTexts` reorders correctly.
- Stub `/models` so the endpoint resolves; `ensureTokenEmbeddings` embeds
  pending tokens and stores correct hashes.
- Server down → `ensureTokenEmbeddings` returns `unavailable`, DB untouched,
  nothing thrown.
- Offline primary + healthy configured fallback → fallback embeds successfully.
- `canonicalEmbeddingModelId`: `embeddinggemma`, `embeddinggemma:300m`,
  `embed-gemma`, `Embed-Gemma:300m`, `google/embeddinggemma-300m` all map to
  `embeddinggemma-300m`; `qwen3-embedding-0.6b` passes through unchanged; the
  stored `model` column ends up canonical while the stubbed HTTP request body
  carries the configured raw name.

**Commit:** `feat: token embedding pipeline with content-hash staleness and reembed backfill`

---

## Phase 2 — Hybrid search + dedup surfacing

### 2.1 Kernel: `src/kernel/search/hybrid.ts`

New directory/module, exported from `src/kernel/index.ts`:

```ts
export interface HybridSearchOptions {
  queryEmbedding?: ArrayLike<number>;
  /** Model the stored vectors must match; required when queryEmbedding is set. */
  model?: string;
  limit?: number;      // default 20
  rrfK?: number;       // default 60
  vectorTopK?: number; // default 10 — how many vector hits enter the fusion
}

export interface HybridScoredToken extends Token {
  score: number;                 // fused RRF score
  lexicalRank: number | null;    // 1-based, null if not a lexical hit
  vectorRank: number | null;     // 1-based, null if not a vector hit
  similarity: number | null;     // cosine, null if not a vector hit
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number;
export async function searchTokensHybrid(
  db: Database, query: string, opts?: HybridSearchOptions,
): Promise<HybridScoredToken[]>;
```

Implementation:

1. Lexical leg: `findTokens(db, query)` — **unchanged**, ranks by its existing
   score.
2. Vector leg (only when `queryEmbedding` + `model` given):
   `listEmbeddedTokens(db, model)` → cosine against the query vector (skip
   rows whose `dims` differ from the query vector's length) → sort descending
   → keep `vectorTopK`.
3. Fusion: reciprocal-rank fusion, `score = Σ 1/(rrfK + rank)` over the legs a
   token appears in (rank is 1-based per leg). Union of both legs; attach
   `lexicalRank`/`vectorRank`/`similarity`.
4. Sort by `score` desc, **tie-break by `slug` ascending** (deterministic
   tests), apply `limit`.
5. `cosineSimilarity`: dot/(‖a‖·‖b‖); return 0 when either norm is 0.

### 2.2 Wire `zam token find`

In the `find` subcommand ([token.ts](../../src/cli/commands/token.ts)):

1. `const q = await embedQuery(db, opts.query)` so the active model's output
   dimension is known.
2. `await ensureTokenEmbeddings(db, { limit: 32, dims: q?.vector.length })` — if `status ===
   "unavailable"` and neither `--json` nor `--quiet`: one line to
   `console.error`: `` `Note: semantic search unavailable (${reason}) — lexical matches only.` ``
3. `searchTokensHybrid(db, opts.query, { queryEmbedding: q?.vector, model: q?.model })`
4. Table output: keep the existing columns, `Score` shows the fused score with
   `toFixed(3)`, add a `Sim` column (`similarity?.toFixed(2) ?? "-"`).
   `--json` prints the `HybridScoredToken[]` as-is. (Note in the PR text:
   `score` changes from an integer word-overlap count to a float — the `/zam`
   skill reads rows, not the score value.)

### 2.3 Dedup surfacing

- Shared helper in `embedder.ts` (or a small `src/cli/llm/dedup.ts`):

  ```ts
  export async function findPossibleDuplicates(
    db: Database,
    candidate: { concept: string; question?: string | null; domain?: string },
    embed: typeof embedQuery = embedQuery,   // injectable for tests
  ): Promise<Array<{ slug: string; concept: string; similarity: number }>>
  ```

  Build the raw candidate content with `embeddingContentForToken`, embed it as
  a retrieval query, exhaustively top up existing token documents on first use,
  run `searchTokensHybrid`, and return hits with `similarity >= threshold`.
  Threshold:
  setting `search.dedup_threshold` (parseFloat, default **0.85**). Returns `[]
  ` when the embedder is unavailable.
- `zam bridge add-token`: call it before `createToken`; add
  `possible_duplicates` (always present, possibly `[]`) to the success JSON.
  **Non-blocking** — the token is still created. The dedup helper's exhaustive
  pre-check makes upgraded/offline-era databases complete before comparison.
  After creation, best-effort `ensureTokenEmbeddings(db, { limit: 8 })` in a
  try/catch makes the newly created token search-ready.
- `zam token register` (human path): after creating, print a warning block
  listing possible duplicates (slug + similarity), non-blocking.
- [SKILL.md](../../.claude/skills/zam/SKILL.md): update the dedup bullet
  ("Always dedup before registering") to mention that `zam token find` now
  also matches paraphrases semantically, and that `add-token` returns
  `possible_duplicates` which the agent must surface to the user.

### 2.4 Phase-2 tests

`tests/kernel/hybrid-search.test.ts` — no embedder, vectors stored directly
via `upsertTokenEmbedding` (4-dim handcrafted unit vectors are enough):

- **Paraphrase recovery**: token concept `"dedicated runtime for each customer"`
  with vector `[1,0,0,0]`; query `"tenant isolation model"` (zero lexical word
  overlap) with `queryEmbedding [0.99, 0.1, 0, 0]` → token is returned, ranked
  first, `lexicalRank === null`.
- **Acronym recovery**: token `"SNAT port exhaustion"`; query `"SNAT"`, query
  vector orthogonal to its stored vector → still returned via the lexical leg.
- **Fusion**: a token hit by both legs outranks a token hit by one leg with
  the same single-leg rank.
- Dims mismatch → row skipped, no throw. No `queryEmbedding` → results equal
  `findTokens` order. Deprecated tokens and tokens without embeddings never
  enter the vector leg; content-stale vectors are excluded even when bounded
  top-up has not reached them yet.
- `findPossibleDuplicates` (CLI test): injectable `embed` stub → paraphrase
  above threshold appears; below threshold filtered; unavailable embed (`null`)
  → `[]`; a previously unembedded existing token is backfilled before the
  candidate is compared.

**Commit:** `feat: hybrid lexical+vector token search with dedup warnings`

---

## Phase 3 — Relevance recall

### 3.1 `zam bridge relevant-tokens`

New bridge subcommand (JSON in/out, mirror `add-token`'s structure):

- stdin: `{ "context": string, "limit"?: number }`; `--user <id>` option like
  the other bridge commands (`resolveUser`).
- Flow: validate `context` non-empty → truncate to 2 000 chars before
  embedding → `embedQuery` → dimension-aware
  `ensureTokenEmbeddings(db, { limit: 32, dims })` (best-effort) →
  `searchTokensHybrid(db, context, …, { limit: limit ?? 10 })`
  → for each hit, `getCard(db, token.id, userId)` → output:

  ```json
  {
    "semantic": true,
    "tokens": [
      { "slug": "…", "concept": "…", "domain": "…", "bloom_level": 2,
        "score": 0.03, "similarity": 0.71,
        "card": { "state": "review", "due_at": "…", "blocked": 0 } }
    ]
  }
  ```

  `card` is `null` when the user has none; `"semantic": false` when the
  embedder was unavailable (results are then lexical-only — still returned).
- Errors via `jsonError` (invalid JSON, empty context).

### 3.2 Skill integration

In [SKILL.md](../../.claude/skills/zam/SKILL.md), extend the work-session flow:
after checking due cards, pipe a 1–2 sentence description of the current task
to `zam bridge relevant-tokens` and weave the returned known-and-relevant
tokens into the session ("you already know X, it applies here").

### 3.3 Phase-3 tests

Follow the existing bridge test pattern (see
[tests/cli/bridge-database-status.test.ts](../../tests/cli/bridge-database-status.test.ts)):
lexical-only path (no embedder in CI) returns valid JSON with
`"semantic": false`, tokens ranked, `card` populated for the resolved user and
`null` otherwise; empty/invalid stdin → `jsonError` shape.

**Commit:** `feat: surface task-relevant tokens via bridge relevant-tokens`

---

## Documentation & finish line

- CLAUDE.md → "Key conventions": add one bullet —
  *Semantic search: kernel stores embeddings (`token_embeddings`) and ranks
  (`searchTokensHybrid`); the CLI layer embeds (role `embedding`,
  `src/cli/llm/embedder.ts`). Never import HTTP/LLM code into the kernel.*
- ADR index already lists 2026-07-03 as Accepted; flip to
  `Partially implemented` when the PR merges.
- PR body: summary, phases, the `score`-semantics note from 2.2, manual smoke
  results.

## Acceptance

- `npm run build && npm run test && npm run lint && npm run typecheck` pass;
  **no `package.json` dependency changes**.
- Without any LLM configured: `zam token find`, `token register`,
  `bridge add-token`, `bridge relevant-tokens` all work exactly as before
  (lexical), no errors, no stderr noise under `--json`.
- Manual smoke (document output in the PR):
  1. `ollama pull embeddinggemma`; ensure `llm.enabled=true` and the Ollama
     URL is configured (`zam settings set llm.embedding.url http://localhost:11434/v1`
     if the base URL points elsewhere). *Windows/Ryzen AI variant:* start
     `flm serve <llm-model> --embed 1` and use the two settings from the
     runtime matrix instead; afterwards verify `token_embeddings.model` says
     `embeddinggemma-300m` (canonical), not `embed-gemma`.
  2. `zam token reembed` → reports full coverage.
  3. Register `"exactly one dedicated application pod per organization"`, then
     `zam token find --query "one application instance per tenant"` → the token
     appears with a `Sim` value.
  4. `echo '{"slug":"t2","concept":"one application instance per tenant"}' | zam bridge add-token`
     → response contains the first token in `possible_duplicates`.
  5. `echo '{"context":"configuring per-tenant application deployments"}' | zam bridge relevant-tokens`
     → both tokens ranked with similarities and card state.
- Deleting a token leaves no orphan in `token_embeddings`; editing a token's
  concept makes the next `find`/`reembed` refresh its vector automatically.
