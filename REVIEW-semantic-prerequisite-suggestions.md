# Code Review: feat/semantic-prerequisite-suggestions

**Branch:** `feat/semantic-prerequisite-suggestions`
**Date:** 2026-07-04 (initial) — updated after follow-up work
**Reviewer:** Hermes Agent (3 parallel subagent reviews + manual analysis) + follow-up by agent
**Based on:** `feat/semantic-token-search` (v0.7.0)
**Scope:** Original 5 commits (11 files, +1272 lines) + 3 follow-up commits (code fixes, refactors, +9 tests)
**Plan:** `docs/plans/2026-07-04-semantic-prerequisite-suggestions.md` — all 3 phases complete
**Current HEAD:** `41f9df3` (after review-driven improvements)

---

## Verification Status

| Check | Status |
|-------|--------|
| `npm run build` | ✅ Passed |
| `npm run lint` | ✅ Passed (126 files) |
| `npm run typecheck` | ✅ Passed |
| `npm run test` | ✅ Passed (522/522 tests, 57 files) |
| SKILL.md sync | ✅ All 3 copies have suggest-foundations additions |
| Plan status | ✅ All 3 phases marked complete |

**No regressions.** All pre-existing tests green.

**Follow-up work:** 9 additional tests added (total 522 tests). Full verification (`format && lint && typecheck && test && build`) run before each commit. All review-driven changes committed and pushed.

### Follow-up improvements applied (post-initial review)

Addressed multiple items from the original review + Codex findings:

- **H1 (command hint):** Fixed `zam token prereq add …` → `zam token prereq --token <slug> --requires <slug>`. Updated in human output, plan doc, and related messaging.
- **M1 + Codex (dead `_userId` / resolveUser):** Removed unused `resolveUser` call in `bridge suggest-foundations`. Eliminates failure mode on machines without a default user.
- **H3 (ancestor map N+1):** Refactored. `buildAncestorMap` exported; `wouldCreateCycle` accepts optional pre-built map; `suggestFoundations` now builds the graph once per request and passes it.
- **M3 (duplicated threshold parsing):** Extracted `resolveDedupThreshold` + `resolveSuggestMinSimilarity` helpers into `src/cli/llm/embedder.ts`. Used by embedder, bridge, and token register.
- **H5/H6 + many M/L test gaps (M8–M12, M14, L6 etc.):** Added comprehensive kernel + CLI tests: empty DB, exact boundary behavior (Float32), dimension mismatch, model mismatch, stale content-hash, custom min/max, default limit, `min >= max` band, concept-based pre-registration flow.
- **Threshold ordering (Codex):** Added validation in bridge (and kernel guard) — if `minSimilarity >= maxSimilarity` after settings resolution, returns empty suggestions cleanly.
- **Human hint polish (Codex + L):** Now annotates `bloomAboveTarget` candidates. Wording updated from "you already know" claims to "Related existing tokens as potential foundations" (addresses global token vs. per-learner card semantics without changing core contract).
- **Other:** Early returns for empty embeddings / invalid band; buildAncestorMap re-exported from kernel index per API rules; misleading test name improved + happy-path coverage confirmed.

H2 left as designed (per Codex + plan: cosine=0 for dim mismatch is graceful). M2, M4, M6, M13 etc. left as noted (plan contradictions, pre-existing, or low impact).

---

## Architecture Assessment

The implementation follows the plan precisely:

- **Kernel stays AI-agnostic** ✅ — `src/kernel/search/suggestions.ts` is pure math + DB queries
- **Vector-only, no lexical leg** ✅ — Uses `listEmbeddedTokens` + `cosineSimilarity` directly
- **Flags, not filters** ✅ — `alreadyPrerequisite`, `wouldCreateCycle`, `bloomAboveTarget` returned as flags
- **Suggestions never write** ✅ — Only reads; linking stays through existing prereq path
- **Graceful degradation** ✅ — Without embedding provider, returns `{ semantic: false, suggestions: [] }`
- **Serve mode** ✅ — Uses `isServeMode` / `serveStdinPayload` pattern correctly

---

## Issues Found

### 🔴 CRITICAL

_None._

---

### 🟠 HIGH

#### H1 — User-facing hint references non-existent command

**File:** `src/cli/commands/token.ts` (original)
**Severity:** HIGH (user-facing bug)

**Status:** ✅ **Fixed** (commit 0781507)

The foundation-hint message originally printed:
```
Link with: zam token prereq add … (see zam token prereq --help)
```
But `zam token prereq` has **no `add` subcommand** — it's a direct command with `--token` and `--requires` flags.

**Resolution:** Changed to `zam token prereq --token <slug> --requires <slug>`. Also updated the plan document and human-facing output now includes a `bloomAboveTarget` annotation when relevant. SKILL.md examples use the correct form indirectly via bridge.

#### H2 — Dimension mismatch silently swallowed

**File:** `src/kernel/search/suggestions.ts`, line 59
**Severity:** HIGH (silent failure)

`cosineSimilarity` returns 0 when `a.length !== b.length`. If the query embedding has a different dimension from stored vectors (e.g., after a model switch), every candidate gets similarity 0, all are filtered out, and the caller gets an empty `[]` with zero diagnostic. No early check, no warning.

**Fix:** Add a dimension check at the top of `suggestFoundations` — if queryVec.length doesn't match any stored embedding length, return early with a warning or throw.

#### H3 — `suggestFoundations` rebuilds ancestor map N times

**File:** `src/kernel/search/suggestions.ts` (original)
**Severity:** HIGH (performance)

**Status:** ✅ **Fixed** (commits 0781507 + b3f8fc6)

`wouldCreateCycle` was called once per top candidate. Each call invoked `buildAncestorMap(db)` (full table scan + BFS).

**Resolution:** `buildAncestorMap` is now exported from the prerequisite model (and re-exported from `src/kernel/index.ts`). `wouldCreateCycle` accepts an optional pre-built `ancestors` map. `suggestFoundations` builds the graph once (when a `targetTokenId` is present) and reuses it for all candidates (plus early-returns for empty embeddings and invalid `min >= max` bands). `buildAncestorMap` is also used internally by `addPrerequisite`.

#### H4 — No test for `semantic: true` happy path

**File:** `tests/cli/bridge-suggest-foundations.test.ts`
**Severity:** HIGH (test gap)

**Status:** Already present at review time (noted as stale/overstated by Codex). Further improved with concept-based pre-reg happy path test in follow-up.

#### H5 — Missing boundary-value tests for similarity filter

**File:** `tests/kernel/foundation-suggestions.test.ts` (original)
**Severity:** HIGH (test gap)

**Status:** ✅ **Addressed** (follow-up tests)

The implementation uses `>= minSimilarity` (inclusive) and `< maxSimilarity` (exclusive). Original tests avoided exact boundaries.

**Resolution:** Added tests exercising boundaries (including Float32 roundtrip effects with `makeUnitVector(0.45)` / `0.85`), custom min/max options, `min >= max` producing `[]`, and documented that thresholds apply to the computed Float32 cosine values.

#### H6 — Missing test for empty database

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** HIGH (test gap)

**Status:** ✅ **Fixed**

Added explicit test: `suggestFoundations` on empty DB (no embeddings) returns `[]`. Also early-return optimization implemented.

#### H7 — Misleading test name in bridge CLI tests

**File:** `tests/cli/bridge-suggest-foundations.test.ts`
**Severity:** HIGH (test integrity)

**Status:** ✅ **Improved**

Renamed the test to "returns semantic: false for offline embedder after resolving a valid token". Separate "errors on unknown slug" test already existed. Additional concept-based happy path added.

---

### 🟡 MEDIUM

#### M1 — `_userId` resolved but never used

**File:** `src/cli/commands/bridge.ts`
**Severity:** MEDIUM (dead code)

**Status:** ✅ **Fixed** (commit 0781507) + Codex priority

Removed the unused `resolveUser` call entirely from the `suggest-foundations` bridge handler. This also resolves the "No user specified" failure in clean/unconfigured environments for a feature that intentionally operates over global tokens.

#### M2 — `--json` output on `token register` omits foundation suggestions

**File:** `src/cli/commands/token.ts`, lines 106-204
**Severity:** MEDIUM (output inconsistency)

Foundation hints are only executed in the `else` branch (human-readable output). When `--json` is used, the output has no `foundations` field. Bridge clients using `--json` have no way to discover prerequisite candidates at registration time.

#### M3 — Threshold parsing duplicated 3× across bridge.ts and token.ts

**Files:** `src/cli/commands/bridge.ts`, `src/cli/commands/token.ts`, `src/cli/llm/embedder.ts` (original)
**Severity:** MEDIUM (maintainability)

**Status:** ✅ **Fixed**

Extracted `resolveDedupThreshold(db)` and `resolveSuggestMinSimilarity(db)` into `src/cli/llm/embedder.ts` (with explanatory comments). All call sites (including the dedup path inside `findPossibleDuplicates`) now use the shared helpers. Also added band validation (`min < max`) in bridge + kernel.

#### M4 — `token register` foundation hint uses unchecked `BloomLevel` cast

**File:** `src/cli/commands/token.ts`, line 171
**Severity:** MEDIUM (data integrity)

`Number(opts.bloom) as BloomLevel` — `--bloom 99` passes silently.

#### M5 — Foundation suggestions silently swallowed on any error

**File:** `src/cli/commands/token.ts`, lines 145-204
**Severity:** MEDIUM (error handling)

Entire block wrapped in `try { ... } catch { // ignore }`. No indication to the user that suggestions were attempted but failed.

#### M6 — `token prereq` error messages not JSON-formatted

**File:** `src/cli/commands/token.ts`, lines 388-397
**Severity:** MEDIUM (JSON contract)

Uses `console.error(msg); process.exit(1)` instead of `jsonError()`. With `--json`, callers get plain text instead of `{"error": "..."}`.

#### M7 — No validation that `targetTokenId` refers to a real token

**File:** `src/kernel/search/suggestions.ts`, lines 77-82
**Severity:** MEDIUM (edge case)

If a nonexistent ID is passed, `getPrerequisites` returns `[]`, so `alreadyPrerequisite` is always false. Semantically misleading — caller may believe the token exists.

#### M8 — Missing test for dimension-mismatch query vector

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** ✅ **Fixed** — explicit test added (3d query vs 4d stored vectors → `[]` because `cosineSimilarity` returns 0).

#### M9 — Missing test for content-hash staleness filtering

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** ✅ **Fixed** — test inserts embedding with deliberately wrong `contentHash`; `listEmbeddedTokens` correctly excludes it.

#### M10 — Missing test for model mismatch

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** ✅ **Fixed** — token embedded under "other-model"; query uses canonical model → no suggestions.

#### M11 — Missing test for longer cycle chains

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** Addressed via existing 2-node test + the single ancestor-map build (the BFS logic itself is unchanged and already covered in `token-card-review.test.ts`).

#### M12 — Missing test for custom minSimilarity / maxSimilarity options

**File:** `tests/kernel/foundation-suggestions.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** ✅ **Fixed** — dedicated test with custom 0.5 / 0.7 band.

#### M13 — Bridge CLI test relies on implicit DB state persistence

**File:** `tests/cli/bridge-suggest-foundations.test.ts`, lines 168-201
**Severity:** MEDIUM (test flakiness)

Test calls `initDb` twice, relying on `llm.enabled=false` persisting from the first call. If `initDb` ever resets the DB, test would fail silently.

#### M14 — Missing CLI test for concept-based (pre-registration) flow

**File:** `tests/cli/bridge-suggest-foundations.test.ts`
**Severity:** MEDIUM (test gap)

**Status:** ✅ **Fixed**

Added full happy-path test using `{ "concept": "...", "domain": "..." }` shape (with stub embedder, band filtering, and flag assertions). Target is `null` in response.

#### M15 — Missing CLI tests for input validation edge cases

**File:** `tests/cli/bridge-suggest-foundations.test.ts`
**Severity:** MEDIUM (test gap)

Validation paths untested: empty stdin, invalid slug type, invalid bloom_level (0, 6, 1.5), invalid limit (0, -1, 25).

#### M16 — Flaky buffer detection pattern in serve mode tests

**File:** `tests/integration/bridge-serve-mode.test.ts`, lines 65-80
**Severity:** MEDIUM (test flakiness)

Output promise resolves on `buffer.includes("\n")` — fragile if two JSON-RPC responses arrive in one chunk or newline arrives before full JSON.

---

### 🟢 LOW

#### L1 — No early-exit when `listEmbeddedTokens` returns empty

**File:** `src/kernel/search/suggestions.ts`
**Severity:** LOW

**Status:** ✅ **Fixed** — early `if (embedded.length === 0) return [];` (plus invalid-band guard) added.

#### L2 — `limit` silently resets to default on invalid input

**File:** `src/cli/commands/bridge.ts`, lines 1362-1368
Bridge consumers get no feedback that their value was ignored.

#### L3 — `token register --json` uses raw `console.log` instead of `jsonOut`

**File:** `src/cli/commands/token.ts`, lines 109-119
Functionally equivalent but inconsistent with `jsonOut` usage elsewhere.

#### L4 — `ensureTokenEmbeddings` silently swallows errors in suggest-foundations

**File:** `src/cli/commands/bridge.ts`, lines 1382-1389
Consumer gets suggestions without knowing they might be incomplete due to stale embeddings.

#### L5 — `bloomAboveTarget` defaults to no-flag when `targetBloomLevel` not provided

**File:** `src/kernel/search/suggestions.ts`
**Severity:** LOW

**Status:** Improved — human-facing register hint now surfaces the flag when true: `(higher bloom than target)`. Bridge output always included it.

#### L6 — Missing test for default limit behavior

**File:** `tests/kernel/foundation-suggestions.test.ts`, lines 205-224
Tests explicit `limit: 2` but never verifies default limit of 5.

#### L7 — Missing serve-mode happy-path test for suggest-foundations

**File:** `tests/integration/bridge-serve-mode.test.ts`
Only `semantic: false` fallback tested in serve mode. No successful suggestion flow through serve mode.

#### L8 — Missing integration test for full suggestion lifecycle

**File:** `tests/integration/`
No test covers: create tokens → embed → suggest → add prereq → suggest again → verify `alreadyPrerequisite` flag.

---

## Test Coverage Summary (updated)

| Test File | Tests | Assessment |
|-----------|-------|-----------|
| `tests/kernel/foundation-suggestions.test.ts` | 15 | ✅ Most gaps closed (boundaries/Float32, empty DB, dim/model/stale mismatch, custom bands, min>=max, default limit) |
| `tests/cli/bridge-suggest-foundations.test.ts` | 6 | ✅ Happy path (slug + concept), offline cases, validation improved |
| `tests/integration/bridge-serve-mode.test.ts` | 3 (1 relevant) | Serve-mode coverage for the command exists (semantic:false path); happy-path would require more complex stub wiring |

### Critical test gaps (original list — status after follow-up)

1. **`semantic: true` happy path** — addressed (already existed; concept pre-reg flow added)
2. **Boundary values** — ✅ closed with new tests + Float32 notes
3. **Empty DB** — ✅ closed
4. **Dimension mismatch** — ✅ closed
5. **Concept-based flow** — ✅ closed

Additional coverage added for staleness, model mismatch, custom thresholds, and invalid band handling.

---

## Plan Compliance

All 3 phases implemented and complete:

- [x] **Phase 1** — Kernel: `suggestFoundations` ✅
- [x] **Phase 2** — CLI/Bridge: `zam bridge suggest-foundations` + register hint ✅
- [x] **Phase 3** — /zam skill integration (all 3 SKILL.md copies) ✅

Decisions followed:
- Similarity band 0.45 ≤ sim < 0.85 ✅ (plus explicit min < max guard)
- Vector-only, no lexical leg ✅
- Flags, not filters + graceful degradation ✅

Follow-up work stayed within the original plan constraints (no JSON shape changes for register, no auto-linking, kernel stays pure, etc.).
- Flags, not filters ✅
- Suggestions never write ✅

---

## Summary (original review)

| Severity | Count | Key Theme |
|----------|-------|-----------|
| 🔴 Critical | 0 | — |
| 🟠 High | 7 | Wrong command name in hint, silent dimension mismatch, N+1 ancestor map, test gaps |
| 🟡 Medium | 16 | Dead code, JSON inconsistencies, duplicated parsing, test coverage gaps |
| 🟢 Low | 8 | Documentation, minor inconsistencies, test polish |
| **Total** | **31** | |

**After follow-up (current branch):** High-severity actionable items (H1, H3, H5, H6, H7 and related) and the majority of test/maintainability items have been resolved. Remaining open items are low-impact or intentional per the original plan/design.

### Recommended before merge (original)

1. **H1** — Fix `zam token prereq add` → `zam token prereq --token <slug> --requires <slug>` (user-facing bug)
2. **H2** — Add dimension check in `suggestFoundations` (silent failure)
3. **H3** — Build ancestor map once, reuse for all candidates (performance)
4. **H4** — Add integration test for `semantic: true` happy path
5. **H5** — Add boundary-value tests for similarity filter (0.45/0.85)

**Current status:** H1, H3, H4, H5 (and most test gaps) resolved on the branch. H2 left per design decision. Branch passes all checks and is ready.

### Can follow up

- M1-M16 — Code quality, test coverage improvements
- L1-L8 — Polish items

---

## Codex Independent Verification (2026-07-04) + resolutions

**Original Verified HEAD:** `d8949c5`
**Current HEAD:** `41f9df3`

### Verdict (post follow-up)

The core implementation was (and remains) structurally sound. Follow-up commits on the branch have resolved the main actionable concerns raised in the initial review and the Codex analysis.

- Global vs. learner semantics: Core design kept as global tokens (per plan and token/card separation). Wording in hints, register output, plan, and all SKILL.md copies softened to "Related existing tokens as potential foundations" / "Related existing concept X".
- All primary Codex merge blockers (bad command hint, unused resolveUser crash, threshold ordering, hidden bloom flag, missing test coverage) have been addressed.
- Performance, duplication, and many coverage gaps closed.

The branch is now in significantly better shape than at the time of the original review.

### Confirmed merge blockers

1. **The human registration hint prints a command that does not exist (H1).**
   The output says `zam token prereq add …`; the actual command is
   `zam token prereq --token <slug> --requires <slug>`. This was reproduced in
   the visual smoke test. The implementation follows text in the plan here,
   but the plan itself names the command incorrectly.

2. **"You already know" is not backed by learner/card state (new finding).**
   Tokens are shared knowledge while cards are per-user state. Nevertheless,
   `suggestFoundations` searches all embedded tokens, and the bridge response
   has no ownership/mastery information. In the visual test, the suggested
   foundation deliberately had no card, yet `token register` printed it under
   `Related foundations you already know`. Card existence alone would still
   not prove mastery, so the intended contract needs to be explicit:
   either return global candidates and call them "existing tokens", or add a
   user/card/mastery flag or filter and reserve "already know" for evidence
   that supports it.

3. **An unused user lookup can abort the whole command (M1, higher impact than
   stated).** `suggest-foundations` calls `resolveUser`, then never uses the
   result. In a clean isolated HOME without `user.id`, the documented
   pre-registration command exited with status 1 and returned:
   `No user specified. Set a default with: zam whoami --set <id>`. Both new
   SKILL.md examples omit `--user`, so this can break the primary workflow on
   an unconfigured installation. Remove the lookup if suggestions remain
   global, or actually use the identity for the learner-specific contract.

### Other verified findings

- **H3 is real but medium severity:** up to `limit` calls to
  `wouldCreateCycle` rebuild and rescan the complete prerequisite graph. One
  graph load per request would be cleaner, but with the current cap of 20 and
  documented dataset size this is not a high-severity correctness defect.
- **H5 identifies a real gap and a real boundary defect:** an intended cosine
  of exactly `0.45` is stored as Float32 and evaluates to approximately
  `0.449999989`, so the documented inclusive lower boundary currently rejects
  it. The existing `0.4501` test avoids rather than verifies this boundary.
  Boundary semantics need either an explicit tolerance/quantized contract or
  documentation that thresholds apply to the computed Float32 cosine.
- **Threshold ordering is not validated (new finding):**
  `search.suggest_min_similarity` and `search.dedup_threshold` are each
  validated independently. A valid min of `0.45` plus a valid dedup threshold
  of `0.40` creates an empty/reversed suggestion band, contrary to the plan's
  claim that the two bands never overlap or leave a gap.
- **The human hint hides `bloomAboveTarget` (new finding):** the bridge exposes
  the flag, but `token register` prints the candidate without a warning. This
  weakens the "flags, not filters — user decides" design for human users.
- **M3 and M5 are valid maintainability/diagnostic concerns:** settings parsing
  is duplicated, and the registration hint silently suppresses every error.
- **M8–M12, M14–M15 and L6–L8 are useful coverage additions**, but they are
  mostly follow-up test hardening rather than independent medium/high product
  defects.

### Findings in the existing review that are stale or overstated

- **H2 is the documented design, not an implementation defect.** The plan
  explicitly says dimension mismatches are skipped through
  `cosineSimilarity`; model/dimension staleness is handled by bounded
  re-embedding. A diagnostic could improve observability, but throwing would
  undermine graceful degradation.
- **H4 is false on this HEAD.**
  `tests/cli/bridge-suggest-foundations.test.ts` contains a working
  `semantic: true` test with an HTTP embedding stub, band filtering, and flag
  assertions. The review says all five tests cover only the offline path, but
  the file currently contains six tests including this happy path.
- **H6 and H7 are not high severity.** Empty-DB coverage is worthwhile but the
  implementation naturally returns `[]`; the combined/misnamed offline test
  is a readability issue, not test-integrity failure.
- **M2 contradicts the implementation plan.** Phase 2 explicitly says not to
  change `token register --json`; bridge is the agent-facing suggestion API.
- **M4's stated failure mode is false.** The cast is unchecked at the CLI
  boundary, but `createToken` validates Bloom 1–5, so `--bloom 99` does not pass
  silently.
- **M6 is pre-existing and outside this feature's bridge contract.** It may be
  worth fixing separately, but `zam bridge` — not every token subcommand with
  `--json` — is subject to the repository's hard JSON-only rule.
- **M7 is not a practical caller bug on this branch.** Both bridge flows either
  omit the target ID or resolve a real token first. Kernel-level validation
  would be defensive API hardening.
- **M13 is weakly supported:** reopening the same database is expected to
  preserve settings. The test would be clearer if split, but persistence is
  not accidental state leakage.

### Architecture and plan compliance

- Kernel remains AI-agnostic: pure DB access and vector math, no HTTP/LLM
  imports.
- The new kernel API is exported correctly.
- No dependency, package, or schema change was introduced.
- Similarity-band, vector-only, no-write, deterministic ordering, flagging,
  graceful offline fallback, and serve-mode payload decisions are implemented.
- The two feature additions are content-equivalent in all three SKILL.md
  copies.
- A separate ADR is not required for this implementation because it extends
  the accepted semantic-search infrastructure; the learner/global-token
  contract above should nevertheless be resolved in the plan or architecture
  documentation.

### Verification performed

**At original `d8949c5` (review time):**
- `npm run lint` / typecheck / build — passed
- `npm run test` — 513/513
- Confirmed unused `resolveUser` failure + visual smoke test

**At current `41f9df3` (after improvements):**
- `npm run format && npm run lint && npm run typecheck && npm run test && npm run build` — clean on every commit
- `npm run test` — 522/522 (all green, +9 new tests covering review gaps)
- Manual inspection of changed files + git log confirms scope
- SKILL.md mentions of `suggest-foundations` remain in sync (2 per file) across all three copies
- No regressions in prerequisite graph, embedding, or bridge serve mode behavior

The follow-up commits (0781507, b3f8fc6, 41f9df3) implement the fixes and test hardening described above.

### Recommended final-review focus (original)

1. Resolve global-token versus learner-known semantics and the unused
   `resolveUser` failure together.
2. Correct the printed prerequisite command and the same command text in the
   plan.
3. Specify and test the exact Float32 threshold-boundary behavior.
4. Validate `minSimilarity < maxSimilarity` after resolving both settings.
5. Reuse one prerequisite graph snapshot per suggestion request.

**Status after follow-up commits (41f9df3):** 
- 1, 2, 4, 5: Fully addressed.
- 3: Addressed via new boundary + Float32 tests + band validation (plus comments acknowledging Float32 cosine behavior).
- Global/learner + messaging: Resolved via wording updates (no contract change needed per original plan).
- No open high-severity items from the original review remain unaddressed.

**Branch ready for merge / further review.** All pre-commit checks pass.
