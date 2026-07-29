# ZAM 0.23.0 — OKF freshness radar

Engineering knowledge now tells you when it deserves another look.

`zam_okf_audit` compares each OKF article with the repo-relative code paths it
declares under `# Citations`. The result is intentionally conservative:
`current`, `review-recommended`, or `unknown`, with the changed paths included
as evidence. Git ancestry is the normal baseline, and an uncommitted change to
cited code is visible immediately.

The OKF visualizer shows the same signal without turning the article list into
a dashboard: only a review recommendation gets a small amber dot in the
sidebar, while the open article carries a labeled status and an explanatory
tooltip. Git inspection now follows the first paint asynchronously, so opening
the app stays responsive even on slower Windows hosts and larger repositories.

## Clear knowledge surfaces in every agent host

ZAM now distinguishes its two graphs explicitly:

- “knowledge graph”, “learning graph”, or “Wissensgraph” opens the renamed
  **ZAM Learning Graph** with learning tokens and prerequisite relations;
- “knowledge articles”, “Wissensartikel”, “OKFs”, or “ADRs” opens the OKF
  visualizer with `view: "graph"`, showing articles and their cited ADRs.

`zam_okf_visualize` accepts `view: "reader" | "graph" | "log"` and forwards it
through the VS Code and Copilot companions. Read-only graph surfaces no longer
show an irrelevant evaluator/model selector. Recall asks for the standard MCP
Apps picture-in-picture mode when a host advertises it; hosts retain control of
the actual placement, so inline-only clients continue to work unchanged.

## For developer teams

- Run `zam_okf_audit` during normal task or release work to find reference
  articles whose cited implementation moved after the article was reviewed.
- Read the article and changed code, then update deliberately through
  `zam_okf_upsert`. The audit never rewrites prose.
- A green result means that no *declared* code citation is newer. It does not
  claim that citations are complete or that prose was semantically proved.
- Bundles without usable Git history, and articles without code citations,
  remain available with an honest `unknown` status.

The repository's six existing OKF articles were reviewed while building the
feature. The bridge, scheduling, architecture, MCP-surface, and token/card
articles now cover behavior that had landed since their previous review; the
prerequisite article was confirmed unchanged.

## Unchanged

Freshness is repository guidance, not learning state. It never changes an
article, token, card, imported source binding, or FSRS schedule. If an article
review reveals that a memorized concept changed, the existing explicit
`zam_okf_import` re-import classifications remain the place to decide whether
learning state is kept or reset.

The visualizer also fixes a narrow-window layout issue found during browser
verification: the article pane now uses the full width below its mobile
breakpoint.

The design and its limits are recorded in
[ADR 2026-07-29b](adr/2026-07-29b-okf-freshness-radar.md).
