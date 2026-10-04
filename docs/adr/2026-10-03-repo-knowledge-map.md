# Repo Knowledge Map: An Alpha Feature with Swappable Views

**Status:** Accepted — alpha implemented (2026-10-03); JSON-LD and C4 added (2026-10-04)\
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

In a second round the same day, the owner decided:

4. **No multi-model review round** for this alpha. The variants are built
   right away and switched in Settings. Nobody expects alpha quality to be
   high; **learner feedback decides** which view gets more time.
5. It must work for **any repository**, through the agent skill, so it can be
   tried at work. A browsable prototype makes it tangible beforehand.

On 2026-10-04, after reviews of two parallel proposals (#381, #382), the owner
decided:

6. The map file becomes **JSON-LD** with a published JSON Schema (Decision 7),
   not Turtle or another RDF syntax.
7. A **C4 view** is offered for good. Its architecture lives **in the same
   map**, not in a separate file (Decision 8).
8. Everything is integrated on #380: Grok's concept map (#382) now, Gemini's
   views (#381) once Antigravity has finished. Gemini and Grok then review
   the combined branch.

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

**Concept and phrase.** A statement may also carry a `label`, the concept in
at most four words, and a `link`, a phrase of at most six words from its
parent's concept to its own, so that "parent label + link + label" reads as a
sentence ("ZAM rests on Beliefs"). A relation may carry its own `link` from
`from` to `to`, which wins when the pair is also parent and child, and a
`technology`. The concept map reads these phrases; the C4 view draws a
relation's `link` on its arrow, so one field serves both. The validator
requires a `label` on every statement, a `link` on every statement below the
root and on every `uses` relation; another relation without a `link` gets a
warning, because the concept map leaves it out.

**Relations.** A relation joins two statements and has a `kind` from a small
closed set. An edge therefore reads at two levels:

- **Between sentences**, the focus map, outline and levels render the kind as
  a fixed connective in the UI language, so "statement — connective —
  statement" reads as a sentence. This keeps those views translatable.
- **Between concepts**, the concept map and the C4 view read the `link`
  phrase: "label — link — label" ("ZAM rests on Beliefs").

The detail panel shows both for every connection: the connective with the
full statement, and under it the concept sentence when both labels and a
phrase exist. A view never presents one edge as two unrelated sentences.

| Kind | Reads as | Meaning |
|---|---|---|
| `elaborates` | "in detail" | The target spells out part of the source. |
| `requires` | "requires" | The source only holds if the target holds. |
| `leads_to` | "leads to" | The source causes or results in the target. |
| `because` | "because" | The target is a reason for the source. |
| `instead_of` | "instead of" | The source was chosen over the target. |
| `example` | "for example" | The target is an instance of the source. |
| `uses` | "uses" | The source calls, reads, writes or depends on the target at run time; the kind for architecture links (Decision 8). |

**Structure.**

- The map has one root statement and a focus question.
- Every statement except the root names its `parent`; that edge is the
  `elaborates` relation. The parents form a tree.
- Every statement is reachable from the root. This makes the map fully
  navigable, gives every statement a level and a path, and feeds the
  breadcrumb and the mini-map.
- `relations` hold the cross-links, with the other five kinds. A statement may
  have any number of them, but a pair of statements is joined at most once.
- A cross-link between a statement and its own parent or child replaces the
  plain "in detail" reading of that tree edge, so a detail can say *why*
  ("FSRS-6 … instead of SM-2 …").

**Identifiers.** Statement ids are readable slugs, not ULIDs. The map is a
reviewed text artifact, and readable ids make its diffs reviewable.

**Views only read.** A view reads the model and nothing else. It never
fetches or generates content.

### 2. Views are internal plugins behind one contract

**The contract.** A view receives:

- the map index and the statement in focus;
- a host with three functions: navigate to a statement, translate, and
  translate with values.

A view renders into a container it is given, may hand the shell an overview
to show beside it, and can be torn down. The shell around every view owns the
focus and its history, the breadcrumb, the detail panel (statement, sources,
all connections as sentences) and the feedback bar. Views do
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
  fixed compass: the statement it belongs to above, its details below,
  statements it points to on the right, statements pointing at it on the left.
  Because every edge keeps its side, the statement you came from lands
  opposite the one you clicked.
- A ranking picks the visible neighbours: the parent, the statement just left,
  up to three cross-links, then the details. The rest folds into a
  "+n more" node that expands on demand.
- Each neighbour card opens with its connective, so centre and card read as
  one sentence.
- Clicking a neighbour recentres the map with an animated transition, and
  statements that stay visible glide instead of jumping.
- A breadcrumb shows the path from the root.
- A mini-map of the whole tree, beside the view, marks the current position.
- On a narrow screen the compass stacks into one column.

**Outline** (baseline). The same statements as a collapsible outline of the
`elaborates` tree. Under each statement, its cross-links are listed as
sentences. The outline costs little. It exists so that the comparison can
show whether any map beats a plain list.

**Levels** (second variant, built in the same phase).

- A semantic zoom over the tree: the statement being spelled out on top, its
  details as cards below, with the mini-map beside it.
- Zooming moves one level at a time, animated. Cross-links appear only as
  counts on the cards.

**Concept map** (contributed by Grok, #382).

- The node is the statement's `label`; the edge is the `link` phrase.
- At most four spokes around the centre, ranked like the focus map and placed
  on the same compass, so the parent stays on top.
- The visible spokes are read together as sentences under the star; further
  concepts are chips that open them.
- A spoke is drawn only when both ends have a label and the edge has its own
  phrase. The sentence connectives are not reused between short concepts.

**Gemini's three views** (from #381, ported onto the shared map).

- **Radial ego map**: the focus in the middle, at most eight neighbours evenly
  on an orbit, each captioned with its concept sentence; under it the
  macro-statement those sentences form (Kintsch's construction–integration
  model) and the repository places to look at.
- **Causal tree**: what the focus rests on to the left (parent, reasons,
  preconditions, causes, the general case, what it uses), the focus in the
  middle, what follows to the right (details, consequences, dependants,
  examples, rejected alternatives).
- **Zoned facets**: purpose above, connections to the left, rules and
  decisions to the right, places in the repository below.
- Gemini's prototype wrote syntheses, facets and cause trees by hand per node.
  Here an adapter (`gemini-adapter.ts`) derives them from the statements,
  their phrases and the relation kinds, so the views work on any map. The
  macro-statement is assembled from the map, never generated by a model.
- Gemini's own Studio page, settings card, `localStorage` switch, data model,
  validator, map file and skill were not taken over: #380 already has those
  parts, and a second set would have split the feature.

**Not built now: an argument view.** It would show a claim with its reasons
and rejected alternatives (argument mapping, IBIS). The `because` and
`instead_of` kinds keep that door open.

**Rules for every view:**

- at most seven visible neighbours;
- relations read as connectives between sentences, or as `link` phrases
  between labels (Decision 1);
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

- the Studio's top navigation shows a "Knowledge map" entry;
- the card lists every view in the registry as a choice, grouped by the
  model that built it (baseline, Claude, Gemini, Grok). The map page uses the chosen
  view the next time it opens; the page itself has no switcher, so a tester
  compares views deliberately through Settings.

**Storage.**

- The switch, the selected view and the repository whose map is shown live in
  `~/.zam/config.json` (key `knowledgeMap`) through an `install-config.ts`
  getter/setter pair. The Studio reads them through a
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
- that no relation dangles, and that relation labels and technologies are
  short single lines;
- a single root;
- one `elaborates` parent per statement and no `elaborates` cycle;
- that every statement is reachable from the root;
- C4 facets: a known kind, an optional short name, and a place to sit for
  every internal container, database and component (Decision 8);
- a `label` on every statement, a `link` below the root and on every `uses`
  relation (Decision 1); a warning for other relations without a `link`.

**Any repository, through the agent.**

- Two MCP tools, registered only while the alpha is on:
  - `zam_knowledge_map_guide` returns the authoring guide (shape, statement
    rules, relation kinds, file format), the map's location, and the current
    map with its problems.
  - `zam_knowledge_map_write` validates a whole map against the repository
    and writes it only when there is no error, in the manner of
    `zam_okf_upsert`.
- The guide ships with the validator in `src/cli/knowledge-map/guide.ts`, so
  rules and checks cannot drift apart. The shipped `zam` skill only routes
  "knowledge map" and "Wissenskarte" requests to these tools, and asks the
  learner to switch the alpha on when the tools are missing. No new skill
  needs installing.
- Which repository the tools use:
  - an explicit `repo_root`, always made absolute before it is used or stored;
  - else the MCP client's roots: for reading, the first root that already has
    a map; for writing, the first root, so a write cannot overwrite the map of
    another workspace folder;
  - never the server's working directory. A host-started `zam mcp` often runs
    in the editor's install folder (the 0.13.0 finding behind the OKF tools).
    Without roots, the guide asks for `repo_root` and the write refuses.
- The tools are registered when `zam mcp` starts. An agent started before the
  alpha was switched on needs a restart; the Settings card and the skill say
  so.
- Agents without the MCP tools, and CI, use the CLI: `zam knowledge-map guide`
  prints the same guide, and `zam knowledge-map validate --repo <path>`
  checks a map file and exits with 1 on errors. With `--write` it also
  rewrites a valid file with the JSON-LD header.

**Which repository the Studio shows.**

- The repository the learner's agent last wrote a map for; a successful
  write records it. Else the active workspace.
- "Choose repository…" on the map page picks another folder; "Reload" reads
  the file again.
- Without a usable map, the page shows ZAM's own map as an example, says so,
  lists the errors of a broken map, and offers the request to copy for the
  agent ("Build a ZAM knowledge map for this repository."). Never a dead end.

**Later:** marking a statement as possibly stale when its source changed after
the map was written, as the OKF freshness radar does for articles.

**Review of #380 (2026-10-04).**

- Adopted:
  - no working-directory fallback, absolute paths, first root for writing;
  - the restart hint in skill and Settings;
  - the CLI path for agents without MCP (Gemini's point 4, served by the
    shipped CLI instead of an unshipped standalone skill).
- Deferred to the next round: grouping views by author in the registry, to
  host Gemini's views (#381) in the shared shell.
- Not adopted:
  - A generated macro-statement: the detail panel already lists every
    connection of the statement in focus as a sentence, and writing a
    synthesis would need a model at viewing time.
  - Extra path containment: sources are already rejected when they are
    absolute, contain `..` or a URL, and they are resolved and checked to stay
    inside the repository. Anchors such as `#L1-L20` already pass.

**Grok's review of the combined branch (2026-10-04).**

- Adopted:
  - Decision 1 now describes both readings of an edge, and the detail panel
    shows the concept sentence under each connection, so a side-by-side test
    does not meet one edge as two different sentences.
  - Labels and links are required where a view needs them, so a map that
    validates is never mute in the concept map or the C4 view.
  - The schema checks the word limits and the required fields, and a test
    keeps its patterns in step with the validator.
  - The C4 relationship list shows every phrase of a rolled-up arrow, not
    only the first.
  - Decision 4 no longer counts the views.
- Known and accepted: the `$schema` link points at `main` and resolves only
  once this branch is merged.
### 6. How the preferred view is chosen

Learner feedback decides (owner decision 4). Every view has the same feedback
bar under the map:

- "How helpful is this view?" from 1 to 5;
- "Did you find what you were looking for?" yes, partly or no;
- an optional comment.

The second question is a light check on performance, because preference and
performance can diverge (Wang et al., 2026). The view is recorded with every
entry.

**Privacy.** Feedback stays on the machine, in `knowledge-map-feedback.json`
next to `config.json`. "Copy all feedback" puts it on the clipboard so a
tester can pass it on deliberately.

**Reading the result.** A tester should try every view; with few testers the
comparison is within each person. A view is worth refining when it is rated
at least as helpful as the outline and testers find what they look for. If no
map beats the outline, that is a finding, not a failure.

**Possible later:** probe questions stored in the map, with a self-checked
answer, time and navigation counts per view, if the simple feedback does not
separate the views.

### 7. The map file is JSON-LD with a published schema

The file stays the JSON that agents already write, and it becomes JSON-LD.

- `zam_knowledge_map_write` adds two keys itself, so an agent writes neither:
  - `@context` maps the fields to RDF: the tree as SKOS `broader`, the root as
    SKOS `hasTopConcept`, short labels as SKOS `prefLabel`, sources as Dublin
    Core `source`, everything else in a small ZAM vocabulary
    (`https://zam-os.org/ns/knowledge-map#`). Ids are relative IRIs, resolved
    against the file's own location.
  - `$schema` links the JSON Schema (`docs/knowledge-map/map.schema.json`), so
    editors and agents can check a map while writing it.
- ZAM's validator stays authoritative. The schema cannot check that sources
  exist or that the tree is reachable; a test keeps its enums and length
  limits in step with the validator.
- Verified once with an RDF library: ZAM's map reads as about 600 triples,
  and SPARQL finds the tree, the sources, the C4 facets and the `uses` links.

**Why not Turtle or another RDF syntax.**

- Agents would have to invent IRIs and prefixes, which adds failure points
  that JSON does not have.
- The checks that matter (sources exist, tree reachable, at most 140
  characters) need ZAM's own code either way.
- Diffs are harder to review.
- The Studio and the panels would need an RDF parser.

JSON-LD keeps the door to RDF tools open without those costs.

### 8. C4 architecture in the same map

A C4 view shows structure: people, systems, containers and components as
boxes, joined by labelled arrows.

**The data lives in the map.**

- A statement may carry a `c4` facet:
  - `kind`: person, system, container, database or component;
  - `name`: the name in the box, defaulting to the statement's `label`;
  - optional `technology`;
  - optional `external` for things outside the repository;
  - optional `within`, the element it sits in.
- The statement text is the element's one-sentence description, which keeps
  "one statement per node".
- An internal container or database sits in a system, a component in a
  container or database. By default that is the nearest such ancestor in the
  statement tree; `within` overrides it when the statement is explained
  elsewhere in the tree.
- A statement without a facet belongs to its nearest ancestor element. The C4
  view therefore highlights the right box for any statement in focus.

**Links.**

- Architecture links use the new kind `uses`, with a `link` phrase
  ("stores cards in") and an optional `technology` ("SQL").
- The C4 view draws only `uses` links. A link between parts rolls up to the
  boxes visible at the current level, as C4 tools show implied
  relationships; several links between the same boxes become one arrow that
  counts them.

**The view.**

- It has three levels:
  - **system context**: people, the system, external systems;
  - **containers** inside a system, in a dashed frame;
  - **components** inside a container.
- A box with parts zooms in; "one level up" zooms out.
- People sit on top, the frame in the middle, everything outside below.
- An arrow carries its label where the label covers no box. Otherwise it shows
  a number, and the relationship list under the diagram spells out every
  arrow with label and technology.
- Without any C4 facet, the view explains how to get one instead of showing
  an empty canvas.

**Why one map and not a separate Structurizr file.**

- One set of statements serves every view, and the focus survives switching
  between the C4 view and the knowledge views.
- One agent pass and one validator cover both.
- A Structurizr DSL or Mermaid C4 export can be added later from the same
  data.

C4 is established practice rather than an empirically tested format like
concept maps; the feedback per view applies to it like to the others.

## Phases

Implemented on 2026-10-03, on one branch:

1. **Model.** The model, the validator, ZAM's own map (78 statements, 26
   cross-links) and its CI check.
2. **Views.** The view registry, the shell, the Focus map, the Outline and the
   Levels view.
3. **Alpha in the Studio.** The Settings card with switch and view choice,
   the navigation entry, the map page with repository choice and the sample
   map fallback, and the bridge commands behind them.
4. **Any repository.** The two MCP tools, the guide, and the `zam` skill
   routing.
5. **Feedback.** The feedback bar and its local store.
6. **Prototype.** `scripts/build-knowledge-map-prototype.mjs` builds one
   self-contained HTML page with ZAM's map and all views, switchable in place,
   for trying the idea without installing anything.

Added on 2026-10-04:

7. **JSON-LD and schema.** The context and schema link in every written map,
   and `docs/knowledge-map/map.schema.json`.
8. **C4.** The `c4` facet, the `uses` kind, the C4 view, and C4 elements in
   ZAM's own map (81 statements, 39 links).
9. **Concept map.** Grok's view from #382, merged: `label` and `link` on
   statements and relations, a label on every statement of ZAM's map and a
   phrase on every edge. Grok's relation `link` and the C4 arrow text were the
   same thing and are one field now.
10. **Gemini's views.** Radial ego map, causal tree and zoned facets from
    #381, as registry views fed by an adapter from the shared map; the
    registry records each view's author.

**Later:**

- staleness marking;
- the views inside an MCP Apps panel, so the map opens next to the agent;
- an argument view;
- probe questions, if the feedback does not separate the views;
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

- With every map view, testers find what they look for no more often than
  with the outline.
- Testers get lost: they go back often, restart from the root, or cannot say
  where they are.
- Many statements contradict their sources a few weeks after being written.
- Keeping the map current costs more than the value testers report.

## Alternatives considered

- **An unpublished switch (environment variable).** Replaced by the owner's
  decision. An alpha card in Settings lets testers find the feature without a
  terminal.
- **A review round with several models before building.** Skipped by the
  owner for this alpha: building the variants and asking learners is cheaper
  and more telling.
- **A second skill for map authoring.** Rejected: the provisioning installs
  only the `zam` skill into agents. A short routing rule there plus a guide
  served by the MCP server reaches every connected agent without new
  installation steps.
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
- **Turtle or another RDF syntax as the written format.** Rejected for
  JSON-LD (Decision 7).
- **C4 in a separate Structurizr DSL file.** Rejected for one map with C4
  facets (Decision 8); an export can follow.
- **Drawing every link kind in the C4 view.** Rejected: reasons and
  alternatives are knowledge, not run-time use. Only `uses` links become
  arrows.

## Verification

- `tests/cli/knowledge-map.test.ts`: every validator rule, the navigation
  index, writing and loading, MCP root resolution, the feedback store, the
  machine-local settings, the MCP tools absent while the alpha is off and
  working once it is on, and ZAM's own map valid with every source present.
- `tests/desktop/knowledge-map.test.ts`: the compass layout, the seven-slot
  cap with "+n more", the narrow stacking, the mini-map, the view registry,
  `en`/`de` strings for every connective and label, the module boundaries (no
  Tauri, no Three.js, views off the bridge), and the lazy loading and hidden
  defaults in the Studio.
- C4 and JSON-LD (2026-10-04):
  - the C4 facet rules, host resolution, relation labels;
  - the written `@context` and `$schema`;
  - the schema's enums and limits matching the validator;
  - the C4 levels, zoom and roll-up on ZAM's own map;
  - arrow clipping.
- The prototype was clicked through in every view, at desktop and phone
  width, in light and dark.

## Citations

Code and repository documents:

- `src/cli/knowledge-map/` — model and validator, JSON-LD context, loading and writing, guide, feedback
- `desktop/src/knowledge-map/c4-layout.ts`, `views/c4.ts` — the C4 model and view
- `docs/knowledge-map/map.schema.json` — the published JSON Schema
- `desktop/src/knowledge-map/` — shell, layout, registry, views, Studio page, Settings card, prototype entry
- `docs/knowledge-map/map.json` — ZAM's own map
- `scripts/build-knowledge-map-prototype.mjs` — the browsable prototype
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
