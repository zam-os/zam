# OKF Freshness Radar

**Status:** Implemented
**Date:** 2026-07-29
**Deciders:** Thomas (project owner), implemented with Codex
**Related:**
[2026-07-17-okf-knowledge-base.md](2026-07-17-okf-knowledge-base.md) (living repo knowledge) ·
[2026-07-17b-okf-visualizer-panel.md](2026-07-17b-okf-visualizer-panel.md) (OKF panel) ·
[2026-07-18-okf-learning-import.md](2026-07-18-okf-learning-import.md) (articles as learning sources)

---

## Context

An engineering team's OKF articles describe behavior that continues to change
in code. The existing `timestamp` says when an article was authored, but gives
no actionable signal when a cited implementation changes later. Finding that
drift by memory does not scale, while automatically rewriting the article would
mistake textual recency for reviewed knowledge.

The articles already declare their implementation anchors in a structured
enough place: repo-relative paths enclosed in backticks on `- Code:` rows under
`# Citations`. Git records both the article revision and the cited code
revision. Together they can provide a useful review hint without adding an LLM,
a watcher, or learning-state coupling.

## Decision

1. **ZAM exposes a read-only `zam_okf_audit` MCP tool.** It audits every
   article in a bundle and reports `current`, `review-recommended`, or
   `unknown`, plus per-code-reference evidence and aggregate counts.
2. **Only explicit, safe code citations are audit targets.** The audit reads
   backtick paths from `- Code:` rows under `# Citations` and keeps paths
   contained by the repository root (including realpath containment for
   existing targets). A missing path-shaped citation recommends review;
   descriptive identifiers without path syntax are ignored.
3. **Git ancestry is the primary baseline.** The article's latest commit is
   compared with each cited path's latest commit:
   - cited code at the same commit or at an ancestor of the article commit is
     `current`;
   - cited code at a descendant of the article commit is
     `review-recommended`;
   - unrelated or unavailable history is `unknown`.
   An untracked article may fall back to its valid frontmatter `timestamp`.
   An uncommitted change under a cited path recommends review immediately.
4. **The signal never mutates knowledge or learning state.** The audit does not
   update an article, invalidate imported tokens, create or suspend cards, or
   touch FSRS scheduling. A human or agent reviews the changed behavior and
   uses `zam_okf_upsert` deliberately.
5. **The visualizer presents the signal quietly.** A small amber sidebar dot
   marks only articles that merit review. The reader meta strip labels all
   three states and names the changed paths in the review tooltip. Missing Git
   or incomplete citations degrade to a neutral `unknown` badge and never
   prevent the panel from opening. The opening tool returns the catalog and log
   first; the panel requests the Git-backed audit asynchronously so repository
   history inspection cannot delay first paint or trip a slow host timeout.
6. **This remains CLI-layer repository tooling.** No kernel API, database
   migration, background watcher, network call, or dependency is added.

## Options considered

- **Compare code commit time only with the frontmatter timestamp** — rejected
  as the primary rule: an article and its code commonly land in the same PR,
  whose commit timestamp is later than the authored timestamp. Git ancestry
  represents the reviewed ordering more accurately; the timestamp remains a
  fallback for untracked articles.
- **Use filesystem modification times** — rejected: checkouts, rebases, and
  generated files make them unstable and machine-specific.
- **Automatically mark imported cards stale or reset their schedules** —
  rejected: code movement does not prove a memorized concept changed, and
  scheduling state belongs to each learner.
- **Ask an LLM whether the prose still matches the diff** — deferred: it adds
  cost, non-determinism, and a model dependency where a conservative local
  signal already removes the main discovery burden.

## Consequences

- Teams get an immediate, explainable list of articles worth reviewing during
  normal development work.
- A `current` result means no cited path is newer in the inspected Git history;
  it is not a proof that citations are complete or prose is semantically
  correct.
- Articles without code citations and bundles outside a usable Git checkout
  remain visible with `unknown` freshness.
- Accurate results depend on maintainers keeping each article's `- Code:`
  citations representative of the behavior it explains.

## Amendment 2026-07-30 — version-string churn is not a review signal

The first releases after the radar shipped exposed a systematic false positive.
Every release rewrites the `ZAM-Content-Studio/x.y.z` User-Agent in
`src/cli/commands/bridge.ts` and `src/cli/adapters/source-reader.ts`, so every
article citing one of those files was told to review a version number on each
release. A recurring signal nobody can act on trains people to ignore the
radar, which costs more than the drift it was built to catch.

Decision 3 is therefore refined: before a descendant commit or an uncommitted
change under a cited path recommends review, the audit reads that path's
accumulated diff and asks whether it changed nothing but version literals. If
so the reference stays `current` and carries the reason
`version-only-change`, so the evidence still says a change happened.

The test is deliberately strict, because a false `current` is the more
expensive error: removed and added lines must pair up one-to-one and be
identical once semver literals are masked. Any added line, removed line, or
other edit — including a behavior change riding along with a version bump —
still recommends review. An empty diff never qualifies, which keeps untracked
files on the review side. The untracked-article frontmatter fallback has no
baseline commit to diff against and is unchanged.
