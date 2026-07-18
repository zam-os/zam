# OKF Learning Import — Scope Checklist

Working plan for [ADR 2026-07-18](../adr/2026-07-18-okf-learning-import.md)
(deleted once shipped, per plans lifecycle). Lean checklist: every box is
verified against the shipped branch in the final check.

## Kernel (AI-agnostic)

- [ ] `tokens.maintenance_at` / `tokens.maintenance_reason` columns
      (schema.ts + idempotent migration M014)
- [ ] `Token` interface + row mapping carry the new fields
- [ ] `setTokenMaintenance(db, tokenId, reason)` /
      `clearTokenMaintenance(db, tokenId)`
- [ ] Review queue excludes tokens in maintenance (both legs of
      `buildReviewQueue`, plus `getDueCards`)
- [ ] `resetCardsForToken(db, tokenId)` — learning state back to the
      beginning for all users' cards of a token (stability, difficulty,
      elapsed/scheduled, reps, lapses, state='new', due now, last review
      cleared); `blocked` untouched (prereq-derived)
- [ ] Kernel exports via `src/kernel/index.ts`
- [ ] Kernel tests: maintenance set/clear + queue exclusion + reset
      semantics

## CLI import operation

- [ ] `importOkfTokens(db, params)` in bridge-handlers: transactional;
      resolves the article (bundle dir + file → frontmatter `resource`
      as source_link base, `#anchor` per token); per-token mode
      `new | update | replace`; `new` collision → instructive error;
      `update` keeps learning state; `replace` updates + resets cards;
      previously-imported tokens of the article absent from the call →
      maintenance (reason names the re-import); prerequisites resolve
      in-import names first, then existing token slugs (cycle detection
      via kernel); cards created for the importing user; ≥1 token
      accepted (no minimum-two gate)
- [ ] Best-effort embeddings refresh after import (mirrors add-token)
- [ ] `zam bridge okf-import` command (JSON payload)
- [ ] `zam_okf_import` MCP tool with the quality contract in its
      description; registered alongside the other okf tools
- [ ] Handler tests: create (tokens+cards+prereqs+source_links),
      update-keeps-state, replace-resets-state, absent→maintenance,
      new-collision error, prereq-to-existing-token, cycle rejection,
      single-token accepted

## Panel

- [ ] Article reader action "Import as learning content" →
      `app.sendMessage` with the decomposition request (mirrors
      recall.ts's existing sendMessage usage)
- [ ] Rejected/failed sendMessage → copyable instruction fallback shown
      in the panel

## Skill & docs (same-PR rule)

- [ ] okf skill (`.claude/.agent/.agents` triplet): quality-contract
      section (read full article; recall-speed concepts only; judged
      Bloom per token; judged domain reusing existing; prerequisite DAG;
      dedup via zam_find_tokens; re-import classification
      new/update/replace/maintenance)
- [ ] `docs/okf/mcp-surfaces.md` documents `zam_okf_import` (guarded
      upsert path)
- [ ] ADR 2026-07-18 status → Implemented (+ README index)

## Final check (prove nothing slipped)

- [ ] Every box above verified against the branch diff
- [ ] Full test suite: no new failures vs. the known environmental
      baseline
- [ ] Root + desktop typechecks, lint, build
- [ ] E2E with isolated DB (USERPROFILE/HOME temp): real
      `zam bridge okf-import` against a fixture bundle — tokens, cards,
      prereqs, re-import lifecycle observed via bridge reads
- [ ] Panel action verified in the real host (dev server + Companion)
