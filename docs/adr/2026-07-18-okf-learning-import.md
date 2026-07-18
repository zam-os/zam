# Knowledge-to-Learning Import (OKF Articles → Learning Tokens)

**Status:** Proposed
**Date:** 2026-07-18
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-17-okf-knowledge-base.md](2026-07-17-okf-knowledge-base.md) (OKF bundles as the source layer) ·
[2026-07-17b-okf-visualizer-panel.md](2026-07-17b-okf-visualizer-panel.md) (the visualizer panel) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP as the agent transport)

---

## Context

OKF articles are ZAM's source layer — learning cards cite an article's
`resource` URL as `source_link` — but there is no path *from* an article
*to* learning content. A reader who decides "I want to retain this" must
create tokens by hand.

Articles are dense: today's real articles run 60–120 lines and carry
several distinct concepts each. Two failure modes are explicitly ruled
out by the project owner:

1. **One token per article as the lazy default.** An umbrella "know the
   article" token schedules re-reading, not recall. Real articles carry
   several concepts, and decomposition must surface them — while a
   deliberate one-concept import stays legitimate.
2. **Mechanical decomposition.** Splitting by headings (or any other
   structural heuristic) measures how the article is *written*, not what
   must be *remembered*. Decomposition is a highest-intelligence task:
   the full text must be understood, the concepts worth remembering
   identified, brought into prerequisite order, and only then created.

The kernel is AI-agnostic by charter; the strongest intelligence in the
loop is the MCP-connected agent itself.

## Decision

1. **The agent decomposes; ZAM records.** Concept extraction,
   prerequisite ordering, and Bloom judgment are performed by the
   connected agent under a written quality contract. ZAM ships no
   decomposition heuristic and makes no LLM call for this.

2. **The quality contract** lives in the import tool's description and
   the `okf` skill (same-PR rule applies to both):
   - Read the *full* article before proposing anything.
   - Extract the concepts a practitioner must produce **from memory** —
     recall-speed knowledge. Facts one would reasonably look up stay in
     the article; the article remains the reference, tokens are what must
     survive without it.
   - One atomic concept per token; a judged Bloom level per token — not a
     fixed default. Multiple tokens are the expected outcome for real
     articles; a single-token import is allowed but signals
     under-decomposition unless the article genuinely carries one concept.
   - Assign each token's `domain` by judgment of its content (an auth
     concept belongs to the auth domain even when it appears in a CLI
     article), reusing existing domains where they fit — domain drives
     queue interleaving.
   - Arrange tokens in a prerequisite DAG from foundational to dependent.
     Prerequisites may name tokens from the same import *and* pre-existing
     tokens, captured in the same call.
   - Every token carries the article's `resource` URL (plus nearest
     heading anchor) as `source_link`.
   - Check for existing tokens first (`zam_find_tokens`) — link to them
     as prerequisites instead of duplicating them.

3. **A `zam_okf_import` batch tool records a finished decomposition
   atomically.** Input: `{ user?, bundle_dir?, file, tokens: [{ name,
   description, bloom, domain, tags?, prerequisites: [names], anchor? }] }`,
   where `prerequisites` may reference in-import names or existing
   tokens. The tool validates — at least one token, unique names, acyclic
   prerequisites, article exists — then creates tokens, cards for the
   importing user (import means "I want to learn this"), prerequisite
   edges, and source links in one transaction. The same operation is
   exposed as a `zam bridge` command.

4. **Re-import is a lifecycle event, not an overwrite.** When an article
   changes and is imported again, the agent classifies each concept and
   the tool acts accordingly:
   - **New concept** → token added (the common case; additions are the
     default effect of a re-import).
   - **Obvious update** (wording/detail refresh, same concept) → token
     description/metadata updated; **learning state untouched**.
   - **Concept changed** (the old knowledge is now irrelevant) → token
     content replaced and its **learning state reset to the beginning** —
     it must be learned fresh.
   - **Unclear** (ambiguous mapping, e.g. after an article was split and
     tokens' source links went stale) → the token enters a new
     **maintenance state**: kept, flagged, excluded from normal
     scheduling until repaired — manually or by the doctor's auto-heal,
     which can locate an article's new home and re-point `source_link`s
     (e.g. after a bundle restructuring) when the concept is intact.

5. **The panel jump goes through the conversation, not around it.** The
   visualizer's article reader gets an "Import as learning content"
   action that posts a user-role message into the host conversation via
   MCP Apps `sendMessage` ("Decompose article X from bundle Y into
   learning tokens per the ZAM quality contract"). The agent then does
   the thinking and calls `zam_okf_import` with its result. Hosts without
   a conversation surface (e.g. the VS Code Companion sidebar) reject the
   message; the panel then displays the equivalent instruction to give
   the agent manually. The panel never calls the import tool directly —
   recording without understanding is exactly the failure mode this ADR
   exists to prevent.

6. **Kernel boundary respected, but extended.** The tool composes
   existing kernel primitives (token/card creation, prerequisite linking)
   in the CLI layer. The lifecycle in Decision 4 requires two kernel
   additions, both AI-agnostic and dependency-free: a **maintenance
   state** in the card/token model (flagged, excluded from normal
   scheduling, surfaced for repair) and a **learning-state reset**
   primitive (concept replaced → FSRS state back to the beginning).
   Doctor auto-heal builds on the existing repair surface
   (workspace-repair-links family).

## Options considered

- **Mechanical section-based decomposition** (one token per `##` section
  plus an umbrella) — rejected: deterministic and cheap, but it tokenizes
  the article's structure rather than its memorable concepts; violates
  the intelligence requirement outright.
- **ZAM-side LLM decomposition** (the CLI's existing LLM client) —
  rejected: binds decomposition quality to the configured evaluator
  model instead of the strongest available agent, duplicates what the
  connected agent does better, and grows the CLI's LLM surface.
- **Single umbrella token per article** as the default outcome —
  rejected by requirement: it schedules re-reading, not recall.
- **Hard minimum-two-token gate in the tool** — rejected: legitimate
  one-concept imports exist; the expectation of multiple tokens is the
  quality contract's job, not a mechanical validator's.
- **Destructive re-import** (auto-remove tokens absent from the new
  decomposition) — rejected: an agent's narrower second pass could erase
  real learning history; absence routes to the maintenance state
  instead.

## Consequences

- Import quality rides on the agent and the contract text; the contract
  is load-bearing documentation and must evolve with observed import
  quality.
- The tool count grows by one MCP tool and one bridge command; the okf
  panel's tool allowlist in the Companion/Copilot hosts gains no new
  entry (the panel only sends a conversation message).
- `source_link` idempotency makes the article the durable anchor for its
  tokens; the OKF rename rule (permanent file names, stub on rename)
  keeps those links valid.
- The card/token model grows a maintenance state and a reset primitive —
  kernel changes with their own tests; `tests/kernel/fsrs.test.ts`
  remains the source of truth for what a reset means.
- Tests: tool contract (cycle rejection, re-import classification
  semantics — add/update/replace-with-reset/maintenance — card creation
  for the importing user, prerequisite linking to existing tokens);
  panel fallback when `sendMessage` is rejected.
