# Semantic Token Search (Phases 1–3) — implementation handoff

Implements [ADR 2026-07-03 — RAG / Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
(Accepted). Read the ADR first; this plan turns its decisions into concrete
steps. It is written to be executed step-by-step without further architectural
decisions.

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

export type EmbeddingStaleness = "missing" | "content-changed" | "model-changed";

export interface TokenNeedingEmbedding {
  token: Token;
  /** Canonical text to embed — already hashed the same way. */
  text: string;
  reason: EmbeddingStaleness;
}
```

Functions:

- `embeddingTextForToken(t: Pick<Token, "concept" | "question" | "domain">): string`
  → `` `${t.concept}\n${t.question ?? ""}\n${t.domain}` ``. This is THE
  canonical text; every hash and every stored vector derives from it.
- `computeContentHash(text: string): string` — `node:crypto`
  `createHash("sha256").update(text, "utf8").digest("hex")`.
- `encodeEmbedding(vec: ArrayLike<number>): Uint8Array` —
  `const f = Float32Array.from(vec); return new Uint8Array(f.buffer);`
  (fresh buffer, so no aliasing). All supported platforms are little-endian;
  this matches libSQL's F32_BLOB layout for the future company tier.
- `decodeEmbedding(blob: Uint8Array): Float32Array` — use exactly:

  ```ts
  export function decodeEmbedding(blob: Uint8Array): Float32Array {
    if (blob.byteOffset % 4 === 0) {
      return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
    }
    // better-sqlite3 Buffers are pool-backed and may be unaligned — copy.
    const copy = blob.slice();
    return new Float32Array(copy.buffer, 0, copy.byteLength / 4);
  }
  ```

- `upsertTokenEmbedding(db, input: { tokenId: string; embedding: ArrayLike<number>; model: string; contentHash: string }): Promise<void>`
  — `INSERT … ON CONFLICT(token_id) DO UPDATE SET embedding=…, model=…, dims=…,
  content_hash=…, embedded_at=…`; `dims` = vector length, `embedded_at` =
  `new Date().toISOString()`.
- `getTokenEmbedding(db, tokenId): Promise<TokenEmbedding | undefined>` —
  decode the blob on the way out.
- `listTokensNeedingEmbedding(db, model: string, opts?: { limit?: number; force?: boolean }): Promise<TokenNeedingEmbedding[]>`
  — one query:
  `SELECT t.*, e.model AS emb_model, e.content_hash AS emb_hash FROM tokens t
  LEFT JOIN token_embeddings e ON e.token_id = t.id WHERE t.deprecated_at IS NULL`,
  then in JS: compute `embeddingTextForToken` + hash per row; classify
  `missing` (no row), `model-changed` (`emb_model !== model`),
  `content-changed` (hash mismatch); `force: true` returns every row (reason
  `content-changed` if it would otherwise be fresh). Apply `limit` after
  classification.
- `getEmbeddingCoverage(db, model): Promise<{ tokens: number; embedded: number; missing: number; stale: number }>`
  — same scan, just counts (`stale` = content or model mismatch).
- `listEmbeddedTokens(db, model: string): Promise<Array<{ token: Token; embedding: Float32Array }>>`
  — `SELECT t.*, e.embedding FROM token_embeddings e JOIN tokens t ON t.id =
  e.token_id WHERE e.model = ? AND t.deprecated_at IS NULL`. Used by the
  Phase-2 vector leg. Trusts stored vectors (top-up handles staleness);
  do not re-hash here.

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
  Studio bridge status if present).
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
    `getProviderForRole(db, "embedding")`; return `null` (never throw) when
    disabled, offline (`isLlmOnline`), or the model is not in
    `getAvailableModels` (case-insensitive, same check as recall). Do NOT
    auto-start runners.
  - `embedTexts(endpoint: { url: string; model: string; apiKey: string }, texts: string[]): Promise<number[][]>`
    — POST `${url}/embeddings`, headers as in the chat calls, body
    `{ model, input: texts }`; parse `{ data: [{ embedding, index }] }`,
    reorder by `index`, validate every vector is a non-empty array of finite
    numbers and all lengths match. 60 s `AbortController` timeout. Errors match
    the house style (`` `Embedding request failed: ${res.statusText} (${res.status}) - ${body}` ``).
  - `ensureTokenEmbeddings(db, opts?: { limit?: number }): Promise<{ status: "ok" | "unavailable"; embedded: number; remaining: number; reason?: string }>`
    — resolve endpoint (null → `unavailable` with a human-readable `reason`:
    disabled / offline / `model "embeddinggemma" not available — run: ollama
    pull embeddinggemma`); `listTokensNeedingEmbedding(db, endpoint.model,
    { limit: opts?.limit ?? 64 })`; embed in batches of 16 via `embedTexts`;
    `upsertTokenEmbedding` each with the hash of the exact `text` that was
    sent; `remaining` = coverage recount after.
  - `embedQuery(db, text: string): Promise<{ vector: number[]; model: string } | null>`
    — single-text embed; `null` on unavailable **or on any network error**
    (semantic search must never break search).

### 1.4 CLI command: `zam token reembed`

In [token.ts](../../src/cli/commands/token.ts), following the house style of
the other subcommands (`withDb`, `--json`, `--quiet`):

- Options: `--all` (force re-embed fresh vectors too), `--json`, `--quiet`.
- Flow: coverage before → loop `ensureTokenEmbeddings` (pass
  `force` through a widened opts object, no cap: loop until `remaining === 0`
  or no progress) → coverage after → print
  `Embedded N tokens (M total, K stale before) with <model>` or the JSON
  equivalent.
- If the endpoint is unavailable: exit code 1 with the actionable `reason`
  (plain text, or `{ "error": … }` under `--json`).

### 1.5 Phase-1 tests

`tests/kernel/token-embeddings.test.ts` (open the DB like
[repos.test.ts](../../tests/kernel/repos.test.ts) does — temp dir +
`openDatabase`):

- encode/decode round-trip, including an unaligned view
  (`const pool = Buffer.concat([Buffer.alloc(2), Buffer.from(encoded)]); decodeEmbedding(pool.subarray(2))`).
- upsert → get returns the same vector, model, dims, hash.
- Staleness matrix: fresh token → `missing`; after
  `updateToken(db, slug, { concept: "…" })` → `content-changed`; stored with
  another model id → `model-changed`; fresh vector → not returned (and
  returned with `force: true`).
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

1. `await ensureTokenEmbeddings(db, { limit: 32 })` — if `status ===
   "unavailable"` and neither `--json` nor `--quiet`: one line to
   `console.error`: `` `Note: semantic search unavailable (${reason}) — lexical matches only.` ``
2. `const q = await embedQuery(db, opts.query);`
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

  Build the query text with `embeddingTextForToken`, embed it, run
  `searchTokensHybrid`, return hits with `similarity >= threshold`. Threshold:
  setting `search.dedup_threshold` (parseFloat, default **0.85**). Returns `[]
  ` when the embedder is unavailable.
- `zam bridge add-token`: call it before `createToken`; add
  `possible_duplicates` (always present, possibly `[]`) to the success JSON.
  **Non-blocking** — the token is still created. After creation, best-effort
  `ensureTokenEmbeddings(db, { limit: 8 })` in a try/catch so the new token's
  vector lands immediately when the model is up.
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
  enter the vector leg.
- `findPossibleDuplicates` (CLI test): injectable `embed` stub → paraphrase
  above threshold appears; below threshold filtered; unavailable embed (`null`)
  → `[]`.

**Commit:** `feat: hybrid lexical+vector token search with dedup warnings`

---

## Phase 3 — Relevance recall

### 3.1 `zam bridge relevant-tokens`

New bridge subcommand (JSON in/out, mirror `add-token`'s structure):

- stdin: `{ "context": string, "limit"?: number }`; `--user <id>` option like
  the other bridge commands (`resolveUser`).
- Flow: validate `context` non-empty → truncate to 2 000 chars before
  embedding → `ensureTokenEmbeddings(db, { limit: 32 })` (best-effort) →
  `embedQuery` → `searchTokensHybrid(db, context, …, { limit: limit ?? 10 })`
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
  3. Register `"exactly one dedicated Ivy pod per organization"`, then
     `zam token find --query "one Ivy instance per tenant"` → the token
     appears with a `Sim` value.
  4. `echo '{"slug":"t2","concept":"one Ivy instance per tenant"}' | zam bridge add-token`
     → response contains the first token in `possible_duplicates`.
  5. `echo '{"context":"configuring per-tenant Ivy deployments"}' | zam bridge relevant-tokens`
     → both tokens ranked with similarities and card state.
- Deleting a token leaves no orphan in `token_embeddings`; editing a token's
  concept makes the next `find`/`reembed` refresh its vector automatically.
