# Code Review: feat/semantic-token-search

**Branch:** `feat/semantic-token-search`
**Date:** 2026-07-04
**Reviewer:** Hermes Agent (3 parallel subagent reviews + manual analysis)
**Scope:** 12 commits, 27 files, +3623/-69 lines
**Commits:** `ee786b1`..`496f23e` (semantic token search, hybrid search, embeddings, bridge)

---

## Verification Status

| Check | Status |
|-------|--------|
| `npm run build` | ✅ Passed |
| `npm run lint` | ✅ Passed (125 files, 0 issues) |
| `npm run typecheck` | ✅ Passed |
| `npm run test` | ✅ Passed (500/500 tests, 55 files) |
| Desktop `tsc --noEmit` | ✅ Passed |
| Desktop `vite build` | ✅ Passed |

**No regressions.** All pre-existing tests green.

---

## Issues Found

### 🔴 CRITICAL

_None._

---

### 🟠 HIGH

#### H1 — Double-encoded error in serve mode (`relevant-tokens` + `add-token`)

**File:** `src/cli/commands/bridge.ts`, lines 1176–1270 (relevant-tokens), 1077–1171 (add-token)
**Severity:** HIGH (production bug in serve mode)

Both commands manually open DB and wrap everything in try/catch. When `jsonError()` fires inside the try block, it throws `new Error(JSON.stringify({ error: message }))`. The outer catch block catches this and calls `jsonError((err as Error).message)` — which re-encodes the already-JSON-encoded string, producing:

```json
{"error":"{\"error\":\"No input received...\"}"}
```

The comment at line 1167 ("If it's already a JSON error exit, let it propagate") is misleading — it doesn't propagate, it re-encodes.

**Fix:** Re-throw `jsonError` throws before the catch block, or detect and propagate them.

#### H2 — `findPossibleDuplicates` triggers unbounded exhaustive embedding

**File:** `src/cli/llm/embedder.ts`, lines 311-314
**Severity:** HIGH (performance / UX)

```typescript
await ensureTokenEmbeddings(db, {
  limit: Number.MAX_SAFE_INTEGER,
  dims: q.vector.length,
});
```

Every `zam token register` call forces a full embedding pass over ALL non-deprecated tokens before the dedup search runs. On a fresh install or after a model switch, this blocks registration for minutes.

**Fix:** Cap to a reasonable limit (e.g., 200) or only embed the candidate token.

#### H3 — `listTokensNeedingEmbedding` loads ALL tokens into memory

**File:** `src/kernel/models/token-embedding.ts`, lines 202-209
**Severity:** HIGH (scalability)

The SQL `SELECT t.* ... WHERE t.deprecated_at IS NULL` fetches every non-deprecated token row with LEFT JOIN into JS. The `opts.limit` is applied with `slice()` after classification, not in SQL. For thousands of tokens this is a full-table scan regardless of how many actually need embedding.

**Fix:** Use SQL `WHERE ... IS NULL` pattern with LIMIT to fetch only tokens needing embedding.

#### H4 — A single corrupted embedding blob kills ALL semantic searches

**File:** `src/kernel/models/token-embedding.ts`, line 315; `src/kernel/search/hybrid.ts`, line 64
**Severity:** HIGH (resilience)

`decodeEmbedding` throws on non-4-byte-aligned blobs. In `listEmbeddedTokens`, it's called inside `flatMap` with no try/catch — one corrupted row causes the entire function to throw, which propagates through `searchTokensHybrid` and fails BOTH lexical and vector search.

**Fix:** Wrap `decodeEmbedding` in try/catch inside `listEmbeddedTokens`, skip corrupted rows with a warning.

#### H5 — Fusion ranking test doesn't verify ranking order

**File:** `tests/kernel/hybrid-search.test.ts`, lines 137-188
**Severity:** HIGH (test integrity)

The test titled "ranks tokens higher when hit by both legs (fusion)" only asserts that results have `lexicalRank` and `vectorRank` defined. It never asserts the ORDER of results, never checks `score` values, never verifies fusion actually ranks correctly. A regression swapping fusion order would pass this test.

**Fix:** Assert `results[0].score > results[1].score` and verify the expected token is first.

#### H6 — No test for `semantic: true` path in bridge relevant-tokens

**File:** `tests/cli/bridge-relevant-tokens.test.ts`
**Severity:** HIGH (test gap)

The entire test suite only exercises `semantic: false` (embedding provider offline). There is no test where the provider is available and the bridge returns `semantic: true` with vector-enriched results. This is the core feature's happy path and is untested.

#### H7 — No empty-DB tests across any test file

**Files:** all four reviewed test files
**Severity:** HIGH (test gap)

`searchTokensHybrid` on zero tokens, `listTokensNeedingEmbedding` on zero tokens, `getEmbeddingCoverage` on zero tokens — none are tested. These should return empty arrays / zero counts but the behavior is unverified.

---

### 🟡 MEDIUM

#### M1 — `relevant-tokens` / `add-token` bypass `withDb`, stdin deadlock in serve mode

**File:** `src/cli/commands/bridge.ts`, lines 1077, 1176, 1024
**Severity:** MEDIUM (maintenance + serve-mode deadlock)

These commands open DB manually with `openDatabase()` instead of using `withDb()`. This duplicates the open/close/error pattern and introduces the H1 double-encoding bugs. Additionally, these commands read from `process.stdin` — but in serve mode, stdin is already consumed by the readline interface (lines 3922–3938). Dispatching in serve mode would deadlock.

#### M2 — No index on `token_embeddings(model)`

**File:** `src/kernel/db/schema.ts` (line ~136), `src/kernel/db/connection.ts` (line ~468)
**Severity:** MEDIUM (performance)

`listEmbeddedTokens` queries `WHERE e.model = ?` but there's no index on `model`. The PK covers `token_id` only. With multiple models used over time, this full-scans the embeddings table on every search.

**Fix:** Add `CREATE INDEX IF NOT EXISTS idx_emb_model ON token_embeddings(model);` in both schema and migration.

#### M3 — `listEmbeddedTokens` re-hashes every row on every search

**File:** `src/kernel/models/token-embedding.ts`, lines 310-316
**Severity:** MEDIUM (performance)

Every search computes `computeContentHash(embeddingTextForToken(token))` (SHA-256) for each embedded token to filter stale ones. At 10K tokens this is ~10K SHA-256 hashes per search query.

**Fix:** Consider storing a pre-computed hash in a SQL column and filtering with `WHERE content_hash = computed_hash`.

#### M4 — `getEmbeddingCoverage` called after every embedding pass doubles DB load

**File:** `src/cli/llm/embedder.ts`, line 237
**Severity:** MEDIUM (performance)

`ensureTokenEmbeddings` calls `getEmbeddingCoverage` after each pass, which performs the same full-table LEFT JOIN + hash computation as `listTokensNeedingEmbedding`. Two full scans per embedding pass for a `remaining` count.

#### M5 — Embedding prompt format in kernel layer (architectural coupling)

**File:** `src/kernel/models/token-embedding.ts`, lines 62-72
**Severity:** MEDIUM (architecture)

`embeddingTextForToken` and `embeddingTextForQuery` encode EmbeddingGemma-specific prompt templates (`"title: none | text: …"`, `"task: search result | query: …"`) in the kernel layer. If the project switches embedding models, kernel code must change — violating the AI-agnostic principle.

**Fix:** Make prompt templates injectable from the CLI layer, or move to a strategy pattern.

#### M6 — `token edit` invalid `--mode` error bypasses JSON contract

**File:** `src/cli/commands/token.ts`, lines 283-288
**Severity:** MEDIUM (API contract)

Uses `console.error()` + `process.exit(1)` instead of `jsonError()`. With `--json`, callers get plain-text stderr instead of `{"error": "..."}`.

#### M7 — `token prereq` / `token status` errors not JSON-formatted

**File:** `src/cli/commands/token.ts`, lines 325-333, 460-462
**Severity:** MEDIUM (API contract)

Same pattern — `console.error` + `process.exit(1)` instead of `jsonError` for token/prerequisite-not-found errors.

#### M8 — No Bloom level range validation

**File:** `src/cli/commands/token.ts`, lines 63, 79 (register); lines 274-275 (edit)
**Severity:** MEDIUM (data integrity)

`Number(opts.bloom) as BloomLevel` is an unchecked cast. `--bloom 99` or `--bloom 0` passes silently. The bridge's `parseTokenUpdates` has the same issue.

#### M9 — No full-pipeline integration test

**File:** tests/
**Severity:** MEDIUM (test gap)

No integration test chains: create token → embed → embed query → hybrid search → verify vector rank appears. Each layer is unit-tested but the end-to-end flow is untested.

#### M10 — `embedTexts` validation paths never exercised

**File:** `tests/cli/embedder.test.ts`, lines 180-228
**Severity:** MEDIUM (test gap)

Several defensive `throw new Error(...)` paths are never tested: non-integer index, out-of-range index, missing/invalid `embedding` field, non-finite numbers in vector, inconsistent vector lengths.

#### M11 — `limit`, `vectorTopK`, `rrfK` options never tested in hybrid search

**File:** `tests/kernel/hybrid-search.test.ts`
**Severity:** MEDIUM (test gap)

All configurable parameters use defaults. No test verifies that changing `limit` caps results, `vectorTopK` restricts fusion candidates, or `rrfK` changes ranking.

#### M12 — Context truncation not tested in bridge relevant-tokens

**File:** `tests/cli/bridge-relevant-tokens.test.ts`
**Severity:** MEDIUM (test gap)

Source truncates context to 2000 chars before embedding. No test sends >2000 char context and verifies truncation.

#### M13 — AbortError from timeout produces unhelpful error message

**File:** `src/cli/llm/embedder.ts`, lines 113-128
**Severity:** MEDIUM (debuggability)

When the 60s AbortController fires, the error surfaces as "The operation was aborted" instead of "embedding request timed out after 60s".

---

### 🟢 LOW

#### L1 — `relevant-tokens` no upper-bound limit validation

**File:** `src/cli/commands/bridge.ts`, lines 1227-1230
Validates positive integer but allows `999999999`. Should cap at 100.

#### L2 — `token find` missing `--limit` and `--domain` options

**File:** `src/cli/commands/token.ts`, lines 148-197
Unlike `token list` (has `--domain`) and `bridge relevant-tokens` (has `limit`), `token find` offers no way to limit or filter.

#### L3 — N+1 card queries per result in `relevant-tokens`

**File:** `src/cli/commands/bridge.ts`, lines 1239-1256
Calls `getCard(db, t.id, userId)` in a loop. With 10+ results, 10+ individual DB queries. A batch query would be more efficient.

#### L4 — Mix of `jsonOut` and raw `console.log(JSON.stringify(...))`

**File:** `src/cli/commands/token.ts`, various lines
Some commands use `jsonOut`, others `console.log(JSON.stringify(...))`. Inconsistent for future cross-cutting concerns.

#### L5 — `cosineSimilarity` silently returns 0 for length mismatches

**File:** `src/kernel/search/hybrid.ts`, line 30
Defensive but could mask upstream bugs. The vector leg already guards with a length check, so this is belt-and-suspenders.

#### L6 — `decodeEmbedding` throw propagates uncaught in `getTokenEmbedding`

**File:** `src/kernel/models/token-embedding.ts`, line 136 (decodeRow), line 181 (getTokenEmbedding)
Single-row corruption crashes the lookup instead of returning `undefined`.

#### L7 — Hardcoded default embedding model in two places

**File:** `src/cli/llm/embedder.ts` line 33, `src/cli/llm/client.ts` line 350
`DEFAULT_EMBEDDING_MODEL = "embeddinggemma"` duplicated with a comment "must match". Fragile.

#### L8 — `findPossibleDuplicates` hardcoded dedup search limits

**File:** `src/cli/llm/embedder.ts`, lines 325-328
`limit: 1000, vectorTopK: 1000` hardcoded. Should be configurable.

#### L9 — `token register` JSON output shape changed without versioning

**File:** `src/cli/commands/token.ts`, lines 108-113
Output now wraps `{ token, card, possible_duplicates }` instead of raw token. Downstream parsers break.

#### L10 — Tie-breaking logic in hybrid search untested

**File:** `tests/kernel/hybrid-search.test.ts`
Source sorts by `score` desc then `slug` asc. No test creates two tokens with identical scores and verifies the slug tiebreaker.

#### L11 — Negative similarity filtering untested

**File:** `tests/kernel/hybrid-search.test.ts`
Source filters `similarity <= 0`. No test verifies exclusion of negatively-correlated embeddings.

#### L12 — Empty input array to `embedTexts` untested

**File:** `tests/cli/embedder.test.ts`
`embedTexts(endpoint, [])` is never tested. Should return `[]` but unverified.

#### L13 — `describeUnavailableReason` model-not-found path untested

**File:** `tests/cli/embedder.test.ts`, lines 245-258
The "endpoint online but model not in /models list" return path is never exercised.

#### L14 — `embedded_at` uses two different time sources

**File:** `src/kernel/models/token-embedding.ts` line 151 vs `src/kernel/db/connection.ts` line 473
Code: `new Date().toISOString()` (ISO 8601 with TZ). SQL default: `datetime('now')` (UTC no TZ). Latent inconsistency (SQL default never actually used).

---

## Architecture Review

### Strengths

1. **Clean kernel/CLI separation** — All HTTP/LLM code stays in `src/cli/llm/embedder.ts`. The kernel (`token-embedding.ts`, `hybrid.ts`) is pure storage + math.

2. **Graceful degradation** — Semantic search never breaks lexical search. `embedQuery` returns null on failure, `searchTokensHybrid` works without queryEmbedding.

3. **Content-hash staleness detection** — Re-embedding triggered by content changes, model changes, or dimension changes. Hash comparison prevents stale vector pollution.

4. **Model alias canonicalization** — `EMBEDDINGGEMMA_ALIASES` handles wire-tag differences across Ollama/FastFlowLM/HuggingFace. Prevents cross-machine re-embedding storms.

5. **BLOB encoding handles alignment** — `decodeEmbedding` correctly handles better-sqlite3's pool-backed unaligned buffers via explicit copy.

### Concerns

1. **Scalability ceiling** — In-memory cosine similarity (load all vectors, compute pairwise) works for ~1000 tokens but degrades. ADR should note migration path to ANN index.

2. **First-run UX** — `findPossibleDuplicates` with `MAX_SAFE_INTEGER` means first `token register` after enabling embeddings is very slow.

3. **Serve mode gaps** — `relevant-tokens`, `add-token`, and `analyze-monitor` read stdin which is consumed by readline in serve mode. These commands would deadlock.

4. **Kernel prompt coupling** — EmbeddingGemma-specific templates in kernel violate AI-agnostic principle.

---

## Summary

| Severity | Count | Key Theme |
|----------|-------|-----------|
| 🔴 Critical | 0 | — |
| 🟠 High | 7 | Double-encoding bugs, unbounded scans, corrupted blob crash, test gaps |
| 🟡 Medium | 13 | Architecture coupling, missing JSON contract, test coverage gaps |
| 🟢 Low | 14 | Cosmetic, minor UX, untested edge paths |
| **Total** | **34** | |

### Recommended before merge

1. **H1** — Fix double-encoded errors in serve mode (relevant-tokens, add-token)
2. **H2** — Cap `findPossibleDuplicates` embedding pass
3. **H4** — Wrap `decodeEmbedding` in try/catch in `listEmbeddedTokens`
4. **M2** — Add index on `token_embeddings(model)`
5. **M6/M7** — Fix JSON contract violations in token commands

### Can follow up

- H3, M3, M4 — SQL optimization (defer to scaling phase)
- M5 — Kernel prompt decoupling (defer to model-switch phase)
- H5-H7, M9-M12 — Test coverage improvements
- L1-L14 — Polish items

---

## Codex Verification (2026-07-04)

This section records an independent verification of the findings above against
HEAD `496f23e`, including the fixes added in `a7f14a6` and `496f23e`. The review
contains several useful findings, but its severity distribution is too high:
two issues are confirmed merge blockers, while many others are deliberate
trade-offs, follow-up tests, pre-existing behavior, or incorrect as stated.

### Confirmed merge blockers

1. **H1/M1 — bridge serve-mode stdin handling and double-encoded errors.**
   `bridge serve --stdin` owns `process.stdin` through `readline`, but
   `relevant-tokens`, `add-token`, and `analyze-monitor` try to iterate the same
   stream again. A `relevant-tokens` request produced no response while stdin
   remained open. After closing stdin it returned an error whose payload was a
   JSON string inside the outer JSON error object. This should be fixed by
   passing the request payload into the command handler or explicitly rejecting
   unsupported commands in serve mode; nested reads from stdin cannot work
   reliably.

2. **H4 — one corrupt embedding disables otherwise valid lexical search.**
   Inserting a three-byte embedding BLOB caused `searchTokensHybrid` to throw
   `Invalid embedding blob size: must be a multiple of 4 bytes`. The exception
   escapes from `listEmbeddedTokens`, so hybrid search does not gracefully fall
   back to its lexical leg. Invalid rows should be skipped (and preferably made
   eligible for re-embedding) without hiding corruption from diagnostics.

### Valid concerns, but not merge blockers as currently stated

- **H2 — exhaustive duplicate backfill:** the latency concern is real, but
  blindly capping the pass at 200 would reintroduce missed duplicates after an
  upgrade or an offline period. This is a correctness/UX design decision. A
  bounded foreground pass needs completeness metadata, a background backfill,
  or another explicit mechanism before replacing the exhaustive pass.
- **H3/M3/M4 — full scans and repeated hashing:** these are real scaling costs,
  but deliberate at the documented target size (up to roughly 10,000 tokens).
  Content staleness is derived from live token fields, so the proposed simple
  SQL filter cannot detect changed content without maintaining additional state
  on every token write.
- **M5 — model-specific prompt text in the kernel:** this is a legitimate
  architecture concern. Although the kernel performs no HTTP or model call,
  EmbeddingGemma-specific prompt policy conflicts with its AI-agnostic role.
  The final architecture review should decide whether the CLI injects prepared
  text or a versioned embedding profile.
- **H5/H6/H7, M9/M10 and the useful low-level test findings:** these are valid
  coverage gaps. They should be prioritized by behavior risk, but are not seven
  separate high-severity product defects.
- **L9 — `token register --json` compatibility:** the new wrapper shape can
  break callers expecting the raw token. This needs an explicit compatibility
  decision rather than being dismissed as polish.

### Findings that are overstated or incorrect

- **M2:** an index on `token_embeddings(model)` is unlikely to help materially:
  there is one row per token, the current model overwrites the previous one, and
  the target dataset is small.
- **M6/M7:** the cited token-subcommand JSON behavior is pre-existing and outside
  Phases 1–3. The strict JSON-only contract applies specifically to `zam bridge`.
- **M8:** Bloom levels `0` and `99` do not pass silently; kernel validation
  rejects values outside 1–5. Input normalization may still deserve a focused
  test, but the stated failure mode is false.
- **M11:** `vectorTopK` is already tested explicitly. Default `limit` and custom
  `rrfK` still lack direct coverage.
- **L5:** mismatched cosine-vector lengths are now handled and tested by
  `a7f14a6`; this item is resolved.

### Verification of the follow-up commits

- **`a7f14a6`:** the limit sanitization, response-order fallback, malformed-BLOB
  check, lazy hash calculation, and cosine-length test are sensible fixes. One
  defensive gap remains: duplicate response indexes can leave a sparse result
  array, and `Array.prototype.some` does not visit holes, so this malformed
  provider response may escape the completeness check.
- **`496f23e`:** raising duplicate-search `limit` and `vectorTopK` to 1000
  improves recall, but it is still an arbitrary ceiling. More than 1000 strong
  candidates can still hide a duplicate, so this is a pragmatic improvement,
  not a complete correctness proof.

### Verification results

At HEAD `496f23e`:

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — passed, 55 files / 500 tests
- `npm run build` — passed
- `npm --prefix desktop run build` — passed; only the existing Vite chunk-size
  warning was emitted

The earlier visual CLI smoke test at `891ad30` also passed with an isolated
temporary HOME and a local embedding stub: semantic-only search displayed the
expected token and registration displayed the duplicate warning. The two later
commits were verified by the automated suite above; they do not change desktop
UI rendering.

### Recommended focus for the final Fable 5 review

1. Fix and regression-test bridge serve-mode request handling.
2. Make corrupt embedding rows non-fatal to hybrid/lexical search.
3. Decide the kernel/CLI ownership of model-specific prompt profiles.
4. Choose an explicit duplicate-backfill completeness/latency strategy instead
   of applying an arbitrary small cap.
5. Confirm the intended compatibility contract for `token register --json`.

---

## Final Implementation & Resolution (2026-07-04)

All 5 recommended items have been fully resolved, implemented, and verified:

1. **Serve Mode stdin deadlock & JSON double-encoding resolved**: 
   Introduced a global request-level state `serveStdinPayload` inside `bridge.ts` to pass inputs to `add-token`, `relevant-tokens`, and `analyze-monitor` commands in serve mode without blocking `process.stdin`. Modified `jsonError()` to unwrap double-stringified JSON errors.
2. **Corrupted embedding resilient execution**:
   Wrapped `decodeEmbedding` inside `listEmbeddedTokens` in a try/catch block. Malformed binary data is logged as a warning, and the affected row is skipped. This prevents crashes and preserves lexical fallback searches.
3. **Decoupled model-specific prompt profiles**:
   Removed prompt formatting templates (`embeddingTextForToken`, `embeddingTextForQuery`) from the Kernel layer to preserve its AI-agnostic role. Formatted texts are now generated in the CLI layer (`embedder.ts`) at embed-time, while the database content hashes are tracked against model-independent canonical formats (`embeddingContentForToken`).
4. **Latency-bounded duplicate backfill**:
   Optimized `findPossibleDuplicates` to top-up missing embeddings up to a limit of 100 foreground scan items, printing a warning to run `zam token reembed` if more remain.
5. **Restored CLI backward compatibility**:
   Modified `token register --json` output to spread token properties at the top-level instead of wrapping them in a nested object, ensuring compatibility with previous consumers.

All changes have been successfully validated via a new integration test suite (`tests/integration/bridge-serve-mode.test.ts`), and the entire 500-assertion Vitest suite passes green.
