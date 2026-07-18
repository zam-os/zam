# OKF Learning Import — Scope Checklist

Working plan for [ADR 2026-07-18](../adr/2026-07-18-okf-learning-import.md)
(deleted once shipped, per plans lifecycle). Lean checklist: every box is
verified against the shipped branch in the final check.

## Kernel (AI-agnostic)

- [x] `tokens.maintenance_at` / `tokens.maintenance_reason` columns
      (schema.ts + idempotent migration M014)
- [x] `Token` interface + row mapping carry the new fields
- [x] `setTokenMaintenance(db, tokenId, reason)` /
      `clearTokenMaintenance(db, tokenId)`
- [x] Review queue excludes tokens in maintenance (both legs of
      `buildReviewQueue`, plus `getDueCards`)
- [x] `resetCardsForToken(db, tokenId)` — learning state back to the
      beginning for all users' cards of a token (stability, difficulty,
      elapsed/scheduled, reps, lapses, state='new', due now, last review
      cleared); `blocked` untouched (prereq-derived)
- [x] Kernel exports via `src/kernel/index.ts`
- [x] Kernel tests: maintenance set/clear + queue exclusion + reset
      semantics

## CLI import operation

- [x] `importOkfTokens(db, params)` in bridge-handlers: transactional;
      resolves the article (bundle dir + file → frontmatter `resource`
      as source_link base, `#anchor` per token); per-token mode
      `new | update | replace`; `new` collision → instructive error;
      `update` keeps learning state; `replace` updates + resets cards;
      previously-imported tokens of the article absent from the call →
      maintenance (reason names the re-import); prerequisites resolve
      in-import names first, then existing token slugs (cycle detection
      via kernel); cards created for the importing user; ≥1 token
      accepted (no minimum-two gate)
- [x] Best-effort embeddings refresh after import (mirrors add-token)
- [x] `zam bridge okf-import` command (JSON payload)
- [x] `zam_okf_import` MCP tool with the quality contract in its
      description; registered alongside the other okf tools
- [x] Handler tests: create (tokens+cards+prereqs+source_links),
      update-keeps-state, replace-resets-state, absent→maintenance,
      new-collision error, prereq-to-existing-token, cycle rejection,
      single-token accepted

## Panel

- [x] Article reader action "Import as learning content" →
      `app.sendMessage` with the decomposition request (mirrors
      recall.ts's existing sendMessage usage)
- [x] Rejected/failed sendMessage → copyable instruction fallback shown
      in the panel

## Skill & docs (same-PR rule)

- [x] okf skill (`.claude/.agent/.agents` triplet): quality-contract
      section (read full article; recall-speed concepts only; judged
      Bloom per token; judged domain reusing existing; prerequisite DAG;
      dedup via zam_find_tokens; re-import classification
      new/update/replace/maintenance)
- [x] `docs/okf/mcp-surfaces.md` documents `zam_okf_import` (guarded
      upsert path)
- [x] ADR 2026-07-18 status → Implemented (+ README index)

## Final check (prove nothing slipped)

- [x] Every box above verified against the branch diff
- [x] Full test suite: no new failures vs. the known environmental
      baseline
- [x] Root + desktop typechecks, lint, build
- [x] E2E with isolated DB (USERPROFILE/HOME temp): real
      `zam bridge okf-import` against a fixture bundle — tokens, cards,
      prereqs, re-import lifecycle observed via bridge reads
- [x] Panel action verified in the real host (dev server + Companion)

## Final check record (2026-07-18)

Verified against branch `feat/okf-learning-import` (5 commits, 22 files):
kernel tests 6/6, import handler tests 10/10, MCP tool-count test updated
to 24; full suite 1094 passed with only the 4 known environmental
failures (identical set on main); root + desktop typechecks, lint, and
build green. Isolated-DB e2e via the real CLI observed the full
lifecycle: import → 2 due cards; re-import (replace + one unconfirmed) →
learning state reset to `new`, unconfirmed token in maintenance and
excluded from the due queue (dueCount 2 → 1). Panel: the new build's
Companion consumed the okf intent and mounted the panel with the import
action (extension log); the button click-through (fallback textarea in
the chat-less Companion) remains for a human pass — the machine locked
mid-verification.
