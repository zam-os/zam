# Repo Knowledge Map: An Alpha Feature with Swappable Views

**Status:** Proposed\
**Date:** 2026-10-03\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-17](2026-07-17-okf-knowledge-base.md) (OKF knowledge base) ·
[2026-07-17b](2026-07-17b-okf-visualizer-panel.md) (OKF visualizer panel) ·
[2026-07-18b](2026-07-18b-graph-repo-scope.md) (learning graph card) ·
[2026-07-30b](2026-07-30b-credential-secret-backends.md) (the alpha opt-in precedent) ·
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP Apps surfaces)

---

## Context

The goal is a navigable map of what a repository knows. It should be fully
navigable, like a mind map. Each node carries roughly one statement. A node
in the centre, together with what surrounds it, should add up to a more
complex statement. ZAM's own repository is the first test case.

ZAM already holds the raw material:

- the OKF bundle in `docs/okf/` (current truth, one article per topic);
- the ADRs in `docs/adr/` (decisions and their reasons);
- the `beliefs/` tree, whose levels hold at most seven components of one
  statement each.

ZAM also has three graph views, and none of them does what is asked:

| View | What it shows | Why it is not the map |
|---|---|---|
| OKF visualizer panel (`desktop/src/panel/okf.ts`) | Articles as nodes, links and ADR citations as edges; a focused ring layout (`layoutFocusGraph`) | A node is a whole article, not a statement. Edges carry no meaning. |
| 2D learning graph card (`desktop/src/panel/graph.ts`) | One token's prerequisites and dependents; click to recentre; a breadcrumb of the last five foci | Learning tokens and prerequisite edges only. |
| 3D graph in the Studio (experimental) | Tokens and prerequisites in 3D | Learning tokens only; 3D hurts precise navigation (see Evidence). |

None of the three shows statements or labels its relations, and none shows
the learner where they are in the whole.

The owner decided on 2026-10-03, after a literature review:

1. Build an **egocentric concept map**: one statement in the centre with its
   neighbours around it. Add a **mini-map** from the zoomable-levels approach
   so the learner always sees where they are.
2. Ship it as an **Alpha feature in Settings, off by default**, instead of an
   unpublished switch.
3. Make the visualization **swappable, like a plugin**. Several variants can
   be built and compared with users later. The preferred one then gets the
   refinement time.

### Evidence

- **Concept maps help learning.** A meta-analysis of 142 effect sizes found
  g = 0.58 overall. Studying a given map gave g = 0.43; constructing one gave
  g = 0.72 (Schroeder et al., 2018).
- **The meaning sits in the relation.** In a concept map, two nodes joined by
  a linking phrase form a proposition, a unit of meaning. A map answers a
  focus question (Novak & Cañas, 2008).
- **Repository knowledge is a network, not a tree.** In a mind map every node
  has one parent; in a concept map a node may have several. The two serve
  different purposes and combine well (Eppler, 2006).
- **Clear spatial structure prevents disorientation.** Placing related nodes
  close together reduced disorientation. Learning scores did not differ
  between conditions (Krieglstein et al., 2022). More cross-links lowered
  extraneous load rather than raising it (Costley et al., 2025).
- **Show little and expand on demand.** Browse the context around a node of
  interest, and select it with a degree-of-interest score (Furnas, 1986;
  van Ham & Perer, 2009). Above about 20 nodes, node-link diagrams lose to
  matrices on most tasks (Ghoniem et al., 2005). Wang et al. (2026) recommend
  progressive disclosure, because the benefit of a graph falls off as it
  grows.
- **Animate recentring and keep positions stable.** A radial layout around a
  focus node can be animated to a new focus while keeping the layout similar
  (Yee et al., 2001). Preserving the mental map made orientation faster and
  less error-prone (Archambault & Purchase, 2013).
- **An overview is preferred, and distortion hurts.** Overview+detail is
  preferred in many studies, and nothing has beaten it for document
  comprehension. Unanimated zooming creates load. Fisheye distortion impairs
  target acquisition (Cockburn et al., 2009). Testers judged semantic zoom
  and a mini-map useful in software cities (Hansen et al., 2025).
- **Simple baselines often win.** Windows Explorer's tree view outperformed
  most sophisticated tree visualizations (Kobsa, 2004). The hyperbolic tree
  only helped when node labels predicted what lay behind them (Pirolli et al.,
  2003).
- **LLM-built maps work for code and text.**
  - Graphologue and Sensecape turn LLM answers into node-link diagrams and
    abstraction levels (Jiang et al., 2023; Suh et al., 2023).
  - CodeMap's multi-level codebase maps cut reliance on reading LLM text by
    79% (Gao et al., 2026).
  - LLM-made concept maps cut perceived load by 31.5% at equal accuracy
    (Han & Choi, 2025; n = 14).
- **Preference is not performance.** Graph explanations that helped people
  felt harder, and those that hurt felt better (Wang et al., 2026).

The evidence for concept maps in learning is solid. For specific navigation
interfaces it comes mostly from small HCI studies.

## Decisions

### 1. One knowledge model, many views

The map's content and its rendering are separate.

**Statements.** A node is one statement: a single declarative sentence of at
most 140 characters. Every statement cites at least one source inside the
repository:

- an OKF article, optionally with an `#anchor`;
- an ADR;
- a `beliefs/` file;
- a repository file.

**Relations.** A relation joins two statements and has a `kind` from a small
closed set. The view renders each kind as a fixed connective in the UI
language, so "statement — connective — statement" reads as a sentence. This
keeps labels translatable and consistent.

| Kind | Reads as | Meaning |
|---|---|---|
| `elaborates` | "in detail" | The target spells out part of the source. |
| `requires` | "requires" | The source only holds if the target holds. |
| `leads_to` | "leads to" | The source causes or results in the target. |
| `because` | "because" | The target is a reason for the source. |
| `instead_of` | "instead of" | The source was chosen over the target. |
| `example` | "for example" | The target is an instance of the source. |

**Structure.**

- The map has one root statement and a focus question.
- `elaborates` relations form a tree, so each statement has exactly one
  `elaborates` parent.
- Every statement is reachable from the root through `elaborates`. This makes
  the map fully navigable, gives every statement a level and a path, and feeds
  the breadcrumb and the mini-map.
- All other kinds are cross-links, and a statement may have any number of
  them.

**Identifiers.** Statement ids are readable slugs, not ULIDs. The map is a
reviewed text artifact, and readable ids make its diffs reviewable.

**Views only read.** A view reads the model and nothing else. It never
fetches or generates content.

### 2. Views are internal plugins behind one contract

**The contract.** A view receives:

- the model and the current focus;
- a host with these functions: navigate to a statement, open a source,
  translate, read the theme, and record a local event.

A view renders into a container it is given and can be torn down. Views do
not call the bridge, and they import nothing from Tauri, so another host can
run them later. The MCP Apps panels follow the same module-boundary rule.

**The registry.** A registry in the app lists the views by id, name and a
one-line description. Each view is its own lazily loaded chunk, loaded only
when the alpha is on and that view is selected. This follows the convention
that optional surfaces stay out of the eager module graph.

**No external plugins.**

- Views cannot be loaded from outside the app: no third-party plugins, and
  no code from a repository or the network.
- "Swappable" means a new view is a new module in the registry. That keeps
  experiments cheap without opening an execution boundary that an alpha does
  not justify.
- The contract is internal and may change between versions during the alpha.

### 3. The first views

**Focus map** (primary; the owner's choice).

- The focus statement sits in the centre, with at most seven neighbours on a
  ring. A degree-of-interest score picks which neighbours to show. The rest
  folds into a "+n more" node that expands on demand.
- Each relation shows its connective.
- Clicking a neighbour recentres the map with an animated transition, and
  statements that stay visible keep their relative positions.
- A breadcrumb shows the path from the root.
- A mini-map of the `elaborates` tree marks the current position.

**Outline** (baseline). The same statements as a collapsible outline of the
`elaborates` tree. Under each statement, its cross-links are listed as
sentences. The outline costs little. It exists so that the comparison can
show whether any map beats a plain list.

**Levels** (second variant, later phase).

- A semantic zoom over the `elaborates` tree: the parent statement sits in
  the centre and its children surround it.
- Zooming moves one level at a time. Cross-links appear only as cues.

**Not built now: an argument view.** It would show a claim with its reasons
and rejected alternatives (argument mapping, IBIS). The `because` and
`instead_of` kinds keep that door open.

**Rules for every view:**

- at most seven visible neighbours;
- relations always read as connectives;
- no 3D and no fisheye or hyperbolic distortion;
- animated transitions with stable positions;
- statement text that predicts what lies behind it;
- the source of every statement one click away.

### 4. Alpha switch in Settings: machine-local, off by default

**The switch.** Settings gains an alpha card, "Repo knowledge map", in the
Advanced tier with the Alpha badge, next to the Bitwarden vault card.

**While it is off**, the feature is invisible and inert:

- no navigation entry;
- no bridge call for the map;
- no view code loaded.

**While it is on:**

- the Studio's top navigation shows a "Knowledge map" entry with the Alpha
  badge;
- the map view has a view picker.

**Storage.**

- The switch and the selected view live in `~/.zam/config.json` through an
  `install-config.ts` getter/setter pair. The Studio reads them through a
  bridge command, exactly like the Bitwarden vault opt-in.
- They are presentation state of one installation, not learning data. The
  shared database may be synced across machines, and a machine running an
  older version would get a switch it cannot honour.

### 5. The map is a committed file, written by an agent, checked by ZAM

**Where it lives.**

- The map is a JSON file committed to the repository, proposed at
  `docs/knowledge-map/map.json`.
- It belongs to the repository, so everyone who clones it gets it and PRs
  review it.
- No LLM is needed to view it, so the map, and with it the layout, stays the
  same between visits.

**Not inside the OKF bundle.** OKF v0.1 is an external format, and a foreign
file inside the bundle would break compatibility.

**ZAM's own map comes first.**

- An agent writes it from the OKF articles, the ADRs and `beliefs/`, in
  English like the rest of the repository.
- A validator in the CLI layer checks it, and a test runs the validator on
  ZAM's own map in CI.
- This is documentation plumbing, not learning logic, so nothing enters the
  kernel (as in ADR 2026-07-17b, Decision 6).

**What the validator checks:**

- the schema and statement length;
- that every source resolves inside the repository;
- that every kind is in the closed set;
- that no relation dangles;
- a single root;
- one `elaborates` parent per statement and no `elaborates` cycle;
- that every statement is reachable from the root.

**Which repository the Studio shows.** The Studio reads the map of the active
workspace through a bridge command; a workspace records its path. Without a
map file, the view shows one action instead of a dead end: a copyable
instruction for the learner's agent to build the map.

**Later, for other repositories:** a validating MCP write tool in the manner
of `zam_okf_upsert`, registered only while the alpha is on. Also later:
marking a statement as possibly stale when its source changed after the map
was written, as the OKF freshness radar does for articles.

### 6. How the preferred view is chosen

Asking testers which view they like is not enough, because preference and
performance can diverge (Wang et al., 2026). The choice therefore rests on
two signals: whether testers find answers, and what they prefer.

**The setup.**

- The map file carries a handful of **probe questions**, such as "Why does
  the kernel contain no LLM code?". Each names the statements that answer
  it.
- Each tester uses every view (within-subject, because there are few
  testers).
- Each view gets different probes, and the order of views rotates.

**One probe, step by step.**

1. The tester navigates until they think they have the answer.
2. They reveal the reference statements.
3. They mark themselves right or wrong, as in Flash.

**What is recorded:** whether the answer was right, the time taken, how often
the tester recentred and went back, and one preference question per view.

**Privacy.** The record stays on the machine. A tester can export it as a
file and send it on.

**Decision rule.**

- A map view is worth refining when it is at least as accurate as the
  outline and is preferred.
- If no map beats the outline, that is a finding, not a failure.

## Phases

All phases go on one feature branch after this ADR is accepted.

1. **Model.** The model, the validator, and ZAM's own map with its CI check.
2. **First views.** The alpha switch and Studio host, the view registry, the
   Outline view, and the Focus map with breadcrumb and mini-map.
3. **Levels.** The Levels view.
4. **Comparison kit.** The probe runner, the local record and its export.

**Later:**

- the MCP write tool, so other repositories can have maps;
- staleness marking;
- the views inside an MCP Apps panel;
- an argument view;
- a learning tie-in: hide a neighbour and ask the learner to recall it,
  since constructing a map outperforms studying one.

## Consequences

**Benefits:**

- A new variant costs one module, not one feature.
- Content and views evolve independently, and a better view reuses the same
  map.
- Every statement points to its source, so a doubtful statement can be
  checked in one click.

**Costs:**

- Repository knowledge gains a second representation beside OKF, which can
  drift. Mandatory sources, PR review of the map and later staleness marking
  limit this.
- Agent-written statements can be wrong. Mandatory sources and PR review are
  the guard.
- The machine-local switch has to be turned on per machine.

## Falsification

The design is wrong if any of these holds:

- With every map view, testers answer the probes no better than with the
  outline.
- Testers get lost: they go back often, restart from the root, or cannot say
  where they are.
- Many statements contradict their sources a few weeks after being written.
- Keeping the map current costs more than the value testers report.

## Alternatives considered

- **An unpublished switch (environment variable).** Replaced by the owner's
  decision. An alpha card in Settings lets testers find the feature without a
  terminal.
- **The switch as a database setting.** Rejected: it is machine-local
  presentation state (see Decision 4).
- **Extending the OKF visualizer's article graph.** Rejected as the main path,
  because a node there is a whole article, too coarse for one statement per
  node. It remains a possible host for the views later.
- **Generating the map when it is viewed.** Rejected because of:
  - cost and latency;
  - a layout that changes between visits;
  - no review of what the map claims.
- **Deriving the map from structure alone (links, the beliefs tree).**
  Rejected: that yields titles, not statements, and unlabelled edges. The
  beliefs tree can seed the map.
- **Free-text edge labels.** Rejected in favour of a closed set of kinds. The
  kinds translate, render consistently and support an argument view. Novak's
  free linking phrases suit noun concepts; between full statements,
  connectives suffice.
- **Loading third-party view plugins.** Rejected for the alpha: it opens an
  execution boundary, and nobody needs it yet.
- **Hyperbolic, fisheye or 3D views.** Rejected because of the evidence above.

## Verification

- Validator unit tests, one per rule, and a CI test that runs the validator on
  `docs/knowledge-map/map.json`.
- Alpha off: no navigation entry, no map bridge call, no view chunk loaded.
- Views import nothing from Tauri, checked by a module-boundary test like the
  one for panels.
- `en` and `de` strings complete for every new UI text.

## Citations

Code and repository documents:

- `desktop/src/panel/okf-render.ts` — `layoutFocusGraph`, the existing focused ring layout
- `desktop/src/panel/graph.ts` — click-to-recentre and breadcrumb in the learning graph card
- `desktop/src/secrets-vault.ts`, `src/kernel/system/install-config.ts` — the alpha opt-in pattern
- `beliefs/README.md` — the seven-component limit per level
- [docs/okf/index.md](../okf/index.md)

Research:

- Archambault, D., & Purchase, H. C. (2013). Mental map preservation helps user orientation in dynamic graphs. *Graph Drawing 2012*, LNCS 7704, 475–486. <https://doi.org/10.1007/978-3-642-36763-2_42>
- Cockburn, A., Karlson, A., & Bederson, B. B. (2009). A review of overview+detail, zooming, and focus+context interfaces. *ACM Computing Surveys*, 41(1), 1–31. <https://doi.org/10.1145/1456650.1456652>
- Costley, J., Kapuza, A., Gorbunova, A., & Shcheglova, I. (2025). How adding structure reduces complexity: More interconnections in concept maps do not increase cognitive load. *Instructional Science*, 53(5), 1243–1262. <https://doi.org/10.1007/s11251-025-09736-5>
- Eppler, M. J. (2006). A comparison between concept maps, mind maps, conceptual diagrams, and visual metaphors as complementary tools for knowledge construction and sharing. *Information Visualization*, 5(3), 202–210. <https://doi.org/10.1057/palgrave.ivs.9500131>
- Furnas, G. W. (1986). Generalized fisheye views. *Proceedings of CHI '86*, 16–23. <https://doi.org/10.1145/22627.22342>
- Gao, J., et al. (2026). Understanding codebase like a professional! Human–AI collaboration for code comprehension. *ICPC '26*, 343–354. <https://doi.org/10.1145/3794763.3794822>
- Ghoniem, M., Fekete, J.-D., & Castagliola, P. (2005). On the readability of graphs using node-link and matrix-based representations. *Information Visualization*, 4(2), 114–135. <https://doi.org/10.1057/palgrave.ivs.9500092>
- Han, J., & Choi, J. D. (2025). Beyond linear digital reading: An LLM-powered concept mapping approach for reducing cognitive load. *BEA 2025*. <https://aclanthology.org/2025.bea-1.58>
- Hansen, M., Bamberg, J., Baumann, N., & Hasselbring, W. (2025). Semantic zoom and mini-maps for software cities. *VISSOFT 2025*. arXiv:2510.00003. <https://arxiv.org/abs/2510.00003>
- Jiang, P., Rayan, J., Dow, S. P., & Xia, H. (2023). Graphologue: Exploring large language model responses with interactive diagrams. *UIST '23*. <https://doi.org/10.1145/3586183.3606737>
- Kobsa, A. (2004). User experiments with tree visualization systems. *IEEE InfoVis 2004*, 9–16. <https://doi.org/10.1109/INFVIS.2004.70>
- Krieglstein, F., Schneider, S., Beege, M., & Rey, G. D. (2022). How the design and complexity of concept maps influence cognitive learning processes. *Educational Technology Research and Development*, 70(1), 99–118. <https://doi.org/10.1007/s11423-022-10083-2>
- Novak, J. D., & Cañas, A. J. (2008). The theory underlying concept maps and how to construct them. Technical Report IHMC CmapTools 2006-01 Rev 01-2008.
- Pirolli, P., Card, S. K., & Van Der Wege, M. M. (2003). The effects of information scent on visual search in the hyperbolic tree browser. *ACM TOCHI*, 10(1), 20–53. <https://doi.org/10.1145/606658.606660>
- Schroeder, N. L., Nesbit, J. C., Anguiano, C. J., & Adesope, O. O. (2018). Studying and constructing concept maps: A meta-analysis. *Educational Psychology Review*, 30(2), 431–455. <https://doi.org/10.1007/s10648-017-9403-9>
- Suh, S., Min, B., Palani, S., & Xia, H. (2023). Sensecape: Enabling multilevel exploration and sensemaking with large language models. *UIST '23*. <https://doi.org/10.1145/3586183.3606756>
- van Ham, F., & Perer, A. (2009). "Search, show context, expand on demand": Supporting large graph exploration with degree-of-interest. *IEEE TVCG*, 15(6), 953–960. <https://doi.org/10.1109/TVCG.2009.108>
- Wang, X., Ma, Z., Yin, M., Ma, S., & Malone, T. W. (2026). Graphionale: How graph visualizations of LLM rationales affect human decision making. arXiv:2608.27932. <https://arxiv.org/abs/2608.27932>
- Yee, K.-P., Fisher, D., Dhamija, R., & Hearst, M. (2001). Animated exploration of dynamic graphs with radial layout. *IEEE InfoVis 2001*, 43–50. <https://doi.org/10.1109/INFVIS.2001.963279>
