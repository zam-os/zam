# Semantic Prerequisite Suggestions — implementation handoff

Builds on the shipped semantic-search infrastructure
([ADR 2026-07-03](../adr/2026-07-03-rag-semantic-token-search.md), Phases 1–3,
released in v0.7.0). No new ADR needed: this feature reuses the accepted
decisions (portable BLOB embeddings, exact kernel cosine, `embedding` provider
role, graceful lexical degradation) and adds one new capability on top.

Written for **any coding agent/harness** (Claude, Codex, Antigravity/Gemini, …):
read the repo root `AGENTS.md` first, implement **exactly one unchecked phase
per run**, one commit per phase on this branch
(`feat/semantic-prerequisite-suggestions`).

## Status

- [x] **Phase 1** — kernel: `suggestFoundations` (start at section 1)
- [x] **Phase 2** — CLI/bridge: `zam bridge suggest-foundations` + register hint
- [x] **Phase 3** — /zam skill integration (all three SKILL.md copies)

## Goal

When a learner registers a new token — or fails an existing one with a rating
of 1 — ZAM should propose **existing** tokens that are semantically related as
prerequisite ("foundation") candidates, instead of only inventing new
foundations via the LLM. Linking accepted candidates strengthens the
prerequisite graph that drives blocking/unblocking, using knowledge the
learner already has. Everything degrades gracefully: without an embedding
model there are simply no suggestions.

## Decisions already made — do not relitigate

1. **Similarity band, not top-K alone.** A candidate is a *foundation
   suggestion* when `minSimilarity <= similarity < maxSimilarity`, defaults
   **0.45 ≤ sim < 0.85**. At or above 0.85 it is dedup territory
   (`possible_duplicates` already covers it — same scale, same setting).
   - `minSimilarity` is configurable via a new setting
     `search.suggest_min_similarity` (parse like `search.dedup_threshold`:
     `Number.parseFloat`, fall back to 0.45 unless finite and in (0, 1)).
   - `maxSimilarity` is **the dedup threshold** — read
     `search.dedup_threshold` with the same 0.85 fallback, so the two bands
     never overlap or leave a gap.
2. **Vector-only, no lexical leg.** Relatedness is a meaning question;
   keyword overlap would only re-suggest near-duplicates. Do not call
   `findTokens`/`searchTokensHybrid` here — use `listEmbeddedTokens` +
   `cosineSimilarity` directly.
3. **Flags, not filters.** Candidates that are already prerequisites, would
   create a cycle, or have a *higher* Bloom level than the target are
   **returned with flags**, not silently dropped — the agent/user decides.
   Only hard exclusions: the target token itself and deprecated tokens
   (the latter is already handled by `listEmbeddedTokens`).
4. **Query embedding via `embedQuery`** (the same query-prompted path the
   dedup check uses) so similarities live on the same scale as
   `search.dedup_threshold`.
5. **Suggestions never write.** Linking stays an explicit separate action
   through the existing `zam token prereq add` / `confirmFoundations`
   (`exists: true` + `slug`) paths. No auto-linking.
6. **No new dependencies**, kernel stays AI-agnostic (pure math + SQL only).

## Ground rules (conventions that bite here — see AGENTS.md for the full set)

- Kernel code goes in `src/kernel/search/`, is exported from
  [src/kernel/index.ts](../../src/kernel/index.ts), and must not import
  anything from `src/cli/`.
- `zam bridge` output is **JSON only** via the `jsonOut`/`jsonError` helpers
  in [bridge.ts](../../src/cli/commands/bridge.ts). Do not add `console.log`
  or `console.warn` calls in bridge paths.
- **Serve mode:** bridge commands that read stdin must use the
  `serveStdinPayload` pattern — copy it exactly from the `relevant-tokens`
  command in bridge.ts (`isServeMode ? serveStdinPayload ?? "" : <stdin
  loop>`). A plain `for await (process.stdin)` deadlocks under
  `bridge serve`.
- The /zam skill exists as **three synced copies**:
  `.claude/skills/zam/SKILL.md`, `.agent/skills/zam/SKILL.md`,
  `.agents/skills/zam/SKILL.md`. Phase 3 edits ALL THREE (the `.agents` copy
  has different line numbers — match by content, not by line).
- Verification before every commit: `npm run format && npm run lint &&
  npm run typecheck && npm run test && npm run build` — all green, no
  `package.json` changes.

## Existing API you build on (read these files first)

- [src/kernel/search/hybrid.ts](../../src/kernel/search/hybrid.ts) —
  `cosineSimilarity(a, b)` (handles length mismatch → 0).
- [src/kernel/models/token-embedding.ts](../../src/kernel/models/token-embedding.ts)
  — `listEmbeddedTokens(db, model)` returns `{ token, embedding }` for fresh,
  non-deprecated vectors; `embeddingContentForToken`.
- [src/kernel/models/prerequisite.ts](../../src/kernel/models/prerequisite.ts)
  — `wouldCreateCycle(...)` (exported, line ~57 — read its exact signature),
  `getPrerequisites(db, tokenId)`, `addPrerequisite`.
- [src/cli/llm/embedder.ts](../../src/cli/llm/embedder.ts) — `embedQuery(db,
  text)` (null when unavailable), `ensureTokenEmbeddings(db, { limit, dims })`
  (never throws), `findPossibleDuplicates` (band-neighbor: study how it reads
  `search.dedup_threshold`).
- [src/cli/commands/bridge.ts](../../src/cli/commands/bridge.ts) — the
  `relevant-tokens` command is the structural template for Phase 2.

---

## Phase 1 — Kernel: `suggestFoundations`

New module `src/kernel/search/suggestions.ts`, exported from
`src/kernel/index.ts`:

```ts
import type { BloomLevel, Token } from "../models/token.js";

export interface FoundationSuggestion {
  token: Token;
  similarity: number;
  alreadyPrerequisite: boolean;
  wouldCreateCycle: boolean;
  /** Candidate's bloom_level is higher than the target's — unusual for a foundation. */
  bloomAboveTarget: boolean;
}

export interface SuggestFoundationsOptions {
  queryEmbedding: ArrayLike<number>;
  /** Canonical embedding model id the stored vectors must match. */
  model: string;
  /** Set when the target token already exists (register-after / rating-1 flow). */
  targetTokenId?: string;
  /** Used for the bloomAboveTarget flag; defaults to 5 (nothing flagged). */
  targetBloomLevel?: BloomLevel;
  limit?: number;         // default 5
  minSimilarity?: number; // default 0.45
  maxSimilarity?: number; // default 0.85 (exclusive upper bound)
}

export async function suggestFoundations(
  db: Database,
  opts: SuggestFoundationsOptions,
): Promise<FoundationSuggestion[]>;
```

Implementation:

1. `listEmbeddedTokens(db, opts.model)` → cosine each against
   `Float32Array.from(opts.queryEmbedding)` (skip dims mismatches — the
   existing `cosineSimilarity` already returns 0 for those, which the band
   filter then drops).
2. Keep candidates with `minSimilarity <= sim < maxSimilarity`; drop the
   target token itself (`token.id === opts.targetTokenId`).
3. Sort by similarity descending, **tie-break by slug ascending**
   (deterministic tests), apply `limit`.
4. Only for the surviving ≤ `limit` candidates (not for the whole table),
   compute the flags:
   - `alreadyPrerequisite`: candidate id appears in
     `getPrerequisites(db, opts.targetTokenId)` (empty/false when no target).
   - `wouldCreateCycle`: `wouldCreateCycle(db, opts.targetTokenId,
     candidate.id)` — false when no target. Match the real signature from
     prerequisite.ts; note the direction: "target requires candidate".
   - `bloomAboveTarget`: `candidate.bloom_level > (opts.targetBloomLevel ?? 5)`.

### Phase-1 tests — `tests/kernel/foundation-suggestions.test.ts`

Open the DB like [hybrid-search.test.ts](../../tests/kernel/hybrid-search.test.ts)
does (temp dir + `openDatabase`), store handcrafted 4-dim vectors via
`upsertTokenEmbedding` (canonical model `"embeddinggemma-300m"`); no embedder,
no HTTP. Cases:

- Band boundaries: candidates engineered at sim ≈ 0.44 (out), 0.45 (in),
  0.84 (in), 0.86 (out — dedup territory). Build exact vectors, e.g. query
  `[1,0,0,0]` and candidate `[c, sqrt(1-c²), 0, 0]` gives sim = c.
- Target token excluded; deprecated token excluded (via `deprecateToken`).
- `alreadyPrerequisite` flag set when a prerequisite link exists.
- `wouldCreateCycle` flag: given existing edge A requires B, suggesting for B
  must flag A.
- `bloomAboveTarget`: candidate bloom 4, target bloom 2 → flagged; equal → not.
- `limit` caps results; equal similarities order by slug.
- No target id → all flags false, still ranked.

**Commit:** `feat: kernel foundation suggestions from embedding similarity`

---

## Phase 2 — Bridge command + register hint

### 2.1 `zam bridge suggest-foundations`

Mirror the `relevant-tokens` command structure (withDb, serve-mode payload,
jsonError validation):

- stdin JSON, two accepted shapes:
  - `{ "slug": "existing-token" }` — register-after / rating-1 flow. Resolve
    via `getTokenBySlug`; unknown slug → `jsonError("Token not found: …")`.
    Query text = `embeddingContentForToken(token)`; target id + bloom from
    the token.
  - `{ "concept": "...", "question"?: "...", "domain"?: "...",
    "bloom_level"?: n }` — pre-registration flow (token doesn't exist yet).
    Query text = `embeddingContentForToken({concept, question ?? null,
    domain ?? ""})`; no target id.
  - optional `"limit"` (validate like relevant-tokens: positive integer,
    default 5, cap 20).
- Flow: parse/validate → `embedQuery(db, queryText)`; if null →
  `jsonOut({ semantic: false, suggestions: [] })` and return (no error) →
  best-effort `ensureTokenEmbeddings(db, { limit: 100, dims:
  q.vector.length })` in try/catch → read the two band settings (reuse the
  exact parsing pattern from `findPossibleDuplicates`) →
  `suggestFoundations(...)` → output:

```json
{
  "semantic": true,
  "target": { "slug": "existing-token" },
  "suggestions": [
    { "slug": "…", "concept": "…", "domain": "…", "bloom_level": 2,
      "similarity": 0.63, "already_prerequisite": false,
      "would_create_cycle": false, "bloom_above_target": false }
  ]
}
```

  (`"target": null` in the pre-registration shape. Field names snake_case on
  the wire, matching `possible_duplicates`.)

### 2.2 `zam token register` hint (human output only)

After the existing duplicate warning block: if the embedder was available and
suggestions (excluding `would_create_cycle` and `already_prerequisite` ones)
exist, print at most 3:

```
Related foundations you already know:
  - <slug> (similarity: 0.63)
Link with: zam token prereq add … (see zam token prereq --help)
```

No change to `--json` output of `register` in this phase (agents use the
bridge command instead). Reuse the query embedding that the duplicate check
already produced if that is easy to thread through; otherwise one extra
`embedQuery` call is acceptable.

### Phase-2 tests

- `tests/cli/bridge-suggest-foundations.test.ts` — follow
  [bridge-relevant-tokens.test.ts](../../tests/cli/bridge-relevant-tokens.test.ts)
  as the template: offline embedder → `{ semantic: false, suggestions: [] }`;
  unknown slug → jsonError shape; invalid JSON → jsonError; limit clamped.
- Happy path with vectors: follow the stub-server pattern of
  [embedder.test.ts](../../tests/cli/embedder.test.ts) (settings point the
  `embedding` role at an in-process HTTP stub; seed tokens +
  `upsertTokenEmbedding` rows so band/flags are exercised end-to-end).
- Serve mode: extend
  [tests/integration/bridge-serve-mode.test.ts](../../tests/integration/bridge-serve-mode.test.ts)
  with one `suggest-foundations` request via the `stdin` payload field
  (no deadlock, valid JSON out).

**Commit:** `feat: bridge suggest-foundations and register-time foundation hints`

---

## Phase 3 — /zam skill integration (all three copies)

1. **Register flow** (near the existing dedup step "Always dedup before
   registering"): after dedup and *before* inventing prerequisites, call

   ```bash
   echo '{"concept":"<concept>","question":"<question>","domain":"<domain>"}' | zam bridge suggest-foundations
   ```

   Present non-flagged suggestions to the user ("You already know X — link it
   as a foundation?"); on approval link via the existing prereq path after
   registering.
2. **Rating-1 flow** (the skill section about foundations after a failed
   review): instruct the agent to call `suggest-foundations` with the failed
   token's `{"slug": …}` FIRST, offer existing tokens as foundations (these
   feed the existing `confirmFoundations` path with `exists: true` + `slug`),
   and only generate NEW foundation proposals via the LLM for gaps the
   suggestions don't cover.
3. Keep wording consistent across `.claude`, `.agent`, `.agents` copies
   (content-match, not line-match) and verify with
   `grep -c "suggest-foundations" <each file>` → same count in all three.

**Commit:** `feat: wire foundation suggestions into the zam skill flows`

---

## Out of scope

- Studio/desktop UI ("related tokens" panel in the editor) — separate effort
  once the bridge command exists.
- Auto-linking without user confirmation.
- Tuning the similarity band beyond the two settings; no per-domain bands.
- Changing `findPossibleDuplicates` or the dedup threshold semantics.

## Acceptance

- `npm run lint` / `typecheck` / `test` / `build` green; no dependency
  changes; all pre-existing tests untouched and passing.
- Without an embedding model: `suggest-foundations` returns
  `{ semantic: false, suggestions: [] }`; `token register` output is
  unchanged; nothing errors.
- Manual smoke (document in the PR): register
  `"Grundlagen der Bruchrechnung"` and `"Erweitern und Kürzen von Brüchen"`
  (with embeddings live), then `echo '{"slug":"<second-slug>"}' | zam bridge
  suggest-foundations` lists the first with a plausible similarity and
  correct flags; adding the link via `zam token prereq add` then shows
  `already_prerequisite: true` on a second call.
- Serve-mode request works (integration test proves it).
