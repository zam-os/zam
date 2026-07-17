# OKF Knowledge Base — Living Repo Knowledge as Learning Sources

**Status:** Implemented (2026-07-17, same PR)
**Date:** 2026-07-17
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP as canonical transport) ·
[2026-03-23-kernel-and-shell-observation.md](2026-03-23-kernel-and-shell-observation.md) (kernel/CLI split)

---

## Context

ZAM's repo documentation had three genres with only two homes. ADRs record
*why* something was decided — immutable, point-in-time. Plans are working
documents — deleted once implemented. What was missing is the third genre:
**current-truth reference knowledge** ("how does FSRS scheduling behave
*today*?") that stays maintained as the code evolves.

That genre has a product-shaped opportunity: ZAM cards carry a
`source_link`, and learners studying this repo (its owner and contributors)
need trustworthy sources for repo concepts. A wiki written for LLM and human
consumption alike can be that source — if it has a defined format, a
guarded write path, and a staleness strategy.

[Open Knowledge Format (OKF) v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog)
(Apache 2.0) is a vendor-neutral convention for exactly this: markdown files
with YAML frontmatter (only `type` is mandatory; `title`, `description`,
`resource`, `tags`, `timestamp` recommended), a reserved `index.md` for
progressive disclosure (frontmatter only in the root index, carrying
`okf_version`) and a reserved `log.md` update history. Links are ordinary
markdown links treated as untyped graph edges; consumers must tolerate
unknown types and broken links.

## Decision

1. **Living repo knowledge lives in an OKF v0.1 bundle at `docs/okf/`.**
   Articles are English, one concept per file, flat directory (no
   subfolders in v1). File names are permanent IDs — renames break
   learners' stored `source_link`s, so moves require an explicit stub and
   `log.md` entry.
2. **OKF complements ADRs, never duplicates them.** An OKF article states
   what is true today; every "we chose X because…" sentence belongs in an
   ADR. Articles reference ADRs (and code) in a `# Citations` section.
3. **`docs/okf/` is not freely editable.** The sanctioned write path is the
   `zam_okf_upsert` MCP tool: it validates the frontmatter contract,
   refuses reserved files, regenerates `index.md`, and appends the `log.md`
   entry. A conformance test (`tests/cli/okf-conformance.test.ts`) gates CI
   on bundle validity. The rule is mirrored in CLAUDE.md and AGENTS.md;
   the `okf` skill teaches agents the authoring discipline.
4. **Articles are addressable as learning sources.** Each article's
   `resource` field carries its canonical GitHub blob URL on `main`; ZAM
   tokens use that URL as `source_link`, which the existing source-reader
   pipeline can already ingest. No kernel change is needed.
5. **The implementation is generic CLI-layer code** (`src/cli/okf/`): a
   dependency-free frontmatter-subset parser, validator, catalog and
   index/log generators, exposed as three MCP tools
   (`zam_okf_catalog`, `zam_okf_read`, `zam_okf_upsert`) that operate on
   any bundle directory (default `docs/okf` under the server's working
   directory). Nothing enters the kernel — this is documentation
   plumbing, not learning logic.

## Options considered

- **Keep free-form specs in `docs/specs/`** — rejected; the two existing
  documents were ADRs in disguise (folded into `docs/adr/`, PR #171), and
  free-form prose gives agents no contract to validate against.
- **Skill only, no MCP tools** — rejected by Thomas: other agents should
  author articles through a validated write path, which a skill alone
  cannot enforce.
- **Full YAML dependency for frontmatter** — rejected (AGENTS.md: no new
  dependencies). The parser accepts the documented subset: scalar
  `key: value` pairs and block string lists; authors stay inside it.
- **Bridge-command parity from day one** — deferred, matching the
  `zam_companion_sample` precedent; `zam bridge` remains the fallback for
  the pre-existing surface.

## Consequences

- Staleness is the primary risk: an outdated article actively teaches
  wrong knowledge through recall cards. Mitigations: a deliberately small
  seed bundle of low-churn concepts, the CI conformance gate, the CLAUDE.md/
  AGENTS.md rule that behavior changes update the covering article in the
  same PR (plus `log.md` entry), and `timestamp` on every article.
- The frontmatter subset is a contract: articles that need richer YAML
  must extend the parser first (with tests), not hand-edit around it.
- Consumers of the bundle outside this repo (an LLM `cat`-ing a file, a
  future central sync service) get plain markdown — no ZAM dependency.
