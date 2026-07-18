---
name: okf
description: Author and maintain the OKF knowledge base in docs/okf — living repo reference articles that ZAM cards cite as learning sources. Use whenever the user invokes `$okf`, asks to document current repo behavior as reference knowledge, when a code change alters behavior an OKF article describes, or when a learning token about this repo needs a source_link.
user-invocable: true
---

# OKF — Repo Knowledge Base Authoring

In Codex, invoke this workflow as `$okf` or select `okf` through `/skills`.
Codex does not expose repository skills as custom `/okf` slash commands.

`docs/okf/` is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog)
v0.1 bundle: the living, current-truth reference for this repository.
Learners' ZAM cards cite these articles as `source_link`, so **a stale or
wrong article actively teaches wrong knowledge**. Treat every edit with
release-level care. Contract: ADR 2026-07-17.

## The one hard rule

**Never edit files in `docs/okf/` by hand.** The only sanctioned write
path is the `zam_okf_upsert` MCP tool (server: `zam mcp`): it validates
the frontmatter contract, regenerates `index.md`, and appends the `log.md`
entry. `zam_okf_catalog` lists articles plus conformance problems;
`zam_okf_read` returns one article. CI enforces bundle conformance
(`tests/cli/okf-conformance.test.ts`).

## ADR vs OKF

OKF states **what is true today**; ADRs record **why it was decided**.
Never restate decision rationale in an article — any sentence shaped like
"we chose X because…" belongs in an ADR. Reference ADRs (and code paths)
in the article's `# Citations` section instead. Every article must have
one.

## Article contract

- File name: kebab-case `*.md`, flat (no subdirectories). Names are
  **permanent IDs** — learners' stored source links break on rename, so
  never rename; supersede with a new article and a `log.md` note instead.
- Frontmatter (the validated subset — scalars and block string lists
  only, no nested maps):
  - `type` (required): short kind, e.g. `architecture`, `algorithm`,
    `data-model`, `protocol` — reuse existing types before inventing one
  - `description` (required here): one sentence; it becomes the index line
  - `title`, `tags` (at least one), `timestamp` (ISO 8601)
  - `resource`: the canonical URL
    `https://github.com/zam-os/zam/blob/main/docs/okf/<file>` — exactly
    this shape, CI-pinned
- Body: current truth in plain prose, links to related articles as
  ordinary markdown links, then `# Citations` with ADRs and code paths.
  English only.

## Staleness duty

If a PR changes behavior that an OKF article describes, update the
article via `zam_okf_upsert` **in the same PR**. Check
`zam_okf_catalog` when touching kernel scheduling, the token/card model,
prerequisite blocking, the bridge protocol, or MCP surfaces.

## Articles as learning sources

When creating ZAM tokens about this repo (e.g. via `zam_add_token`), set
the token's `source_link` to the article's `resource` URL. The article —
not the chat — is the durable source a learner returns to.

## Importing an article as learning content (ADR 2026-07-18)

When the user wants to LEARN an article ("import this as learning
content", the visualizer's import button, or any request that ends in
`zam_okf_import`), **you do the decomposition** — it is a judgment task,
never mechanical.

"Import this okf" / "the currently focused article" / "the open
article": resolve which article is meant via `zam_okf_focused` — the
visualizer panel records what its reader shows. Name the resolved
article in your reply (and double-check with the user if `updatedAt`
looks stale) before decomposing. Then:

1. Read the FULL article (`zam_okf_read`) before proposing anything.
2. Extract the concepts a practitioner must produce **from memory** —
   recall-speed knowledge. Facts one would reasonably look up stay in the
   article; do not tokenize structure (headings are not concepts).
3. One atomic concept per token; judge a Bloom level (1–5) and a domain
   per token, reusing existing domains where they fit.
4. Arrange a prerequisite DAG from foundational to dependent.
5. Check existing tokens first (`zam_find_tokens`); link them as
   prerequisites instead of duplicating them.
6. Record once, atomically, with `zam_okf_import` — every token gets a
   card for the importing user, and each token's `source_link` anchors
   back into the article. Multiple tokens are the expected outcome for a
   real article; a single token usually means under-decomposition.

Re-import after the article changed: classify each token — `new` (add),
`update` (content refreshed, learning state kept), `replace` (the concept
changed, learning state resets to the beginning). Previously imported
tokens you do not confirm move to maintenance (kept, unscheduled,
awaiting repair) — never deleted.
