# Knowledge Atlas: A Zoomable Map of What You Know

**Status:** Proposed\
**Date:** 2026-10-13\
**Deciders:** Thomas (project owner)\
**Spikes:** zam-os/zam#405: `desktop/spikes/knowledge-world/` (3D) and
`desktop/spikes/knowledge-atlas/` (2D)\
**Related:**
[2026-07-04 domain ontology](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) (Draft) ·
[2026-07-04 titles and prefixed domains](2026-07-04-human-friendly-titles-and-prefixed-domains.md) (Decision 4) ·
[2026-07-04 shared knowledge](2026-07-04-multi-learner-shared-knowledge.md) (Decisions 2, 4, 11) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) ·
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md) ·
[2026-10-02 library topics](2026-10-02-library-topics.md) ·
[2026-10-03 repo knowledge map](2026-10-03-repo-knowledge-map.md) ·
[2026-10-08b untrusted agents](2026-10-08b-corporate-deployment-baseline.md)

---

## Context

Spaced repetition secures what a learner knows. It does not give that
knowledge a shape. The queue shows one card after another, and the learning
graph shows one token's neighbourhood. Nothing answers the questions a
learner asks about the whole: *what do I know, where does it belong, how well
do I know it, and what hangs together?*

On 2026-10-12 the owner asked whether spatial organisation could help: the
memory palace, or method of loci. Two spikes on PR #405 explored it.

**Spike 1: the knowledge world (3D).** The learner walks a world they build
themselves:

- a building is a Fach, a floor is a grade, and a room is a Thema;
- cabinets have compartments, with one concept per compartment;
- new knowledge arrives in moving boxes, and demolishing a place packs it back
  into a box.

Showing memory state as space reads at once: dusty, dark and decaying rooms,
and fog for what is forgotten. A time machine makes forgetting visible. But
building a world from scratch overwhelms the learner — in the owner's words,
*"eine Überforderung der Selbstorganisation"*.

**Spike 2: the knowledge atlas (2D).** This is a zoomable hex map of world
knowledge that the agent keeps in logical order, with red threads between
related concepts. The owner called it *"wunderschön"* and expects it to go
into the product.

Owner input that shapes the decisions below (2026-10-12/13):

- **ZAM is agent-first.** No design effort goes into an AI-free mode.
- **The 2D atlas is a fixed map, made by the agent.** Personal arrangement
  belongs to the 3D world, which stays a spike. The spike's "review before you
  move" mechanic was meant for the 3D world and is left out here.
- **Knowledge grows as land.** Growing knowledge may found new islands or
  enlarge existing ones. Islands drift apart to make room.
- **There is more than one useful order.**
  - Example: a software company with more than 20 development teams can be
    seen as an organisation of teams, or as a landscape of products. Both give
    good overview and orientation.
  - Teams get reorganised again and again, which is confusing.
  - A team should know the other teams and their areas roughly, and its own
    area precisely. Zoom can do both.
  - School works the same way: each grade can be its own island to zoom into.
- **Visualisations need colour.** Ours are too monochrome, the graphs too.
  Colour and pattern should carry meaning.
- **Zoom like C4, with a Sinnbild per level.** Kinnu's map of learning areas
  is a reference for the feel. Zooming should work like the C4 model, and
  every level needs a Sinnbild.
- **Red threads link what belongs together,** like an investigator's pin
  board. Dependencies on other products and the users of an interface are
  threads too; UML's connector types can inspire their look.
- **A name does not make a learning unit.** The same name may appear on
  several islands, and its context makes it different knowledge. Every
  software product has "Troubleshooting", with different content in each.
  - In software, a learning unit can rarely be explained by a single term:
    every team reinvents its world and names it anew.
  - World knowledge is different: many people have worked hard to make its
    terms precise. Private knowledge and fast-moving team knowledge lack that.
- **There is always one current view.** Lenses are not versioned. Historical
  knowledge is not part of the atlas, for now.
- **Some knowledge must never mix, even across servers.** World knowledge
  may live on a central knowledge server, which helps schools most. Company
  knowledge must not leave the company. Private knowledge, such as contact
  details, birthdays or anything else the learner keeps to themselves, stays
  private.
- **The map can be where imports start.** Notes or materials go into an
  existing Thema. A curriculum like Bavaria's has a good structure even where
  its content is weak, so importing into it is easier: nobody has to invent
  the category again. Optionally, the agent recognises the category itself,
  from the level where the learner started; the deeper the learner goes
  first, the better the fit.
- **The first Sinnbild of a concept applies to everyone.** A learner may
  override it for themselves.

Existing pieces this builds on:

- domain paths separated by `/` (titles ADR, Decision 4);
- the `domain_meta` idea from the draft ontology ADR — a candidate, not a
  constraint;
- learning atoms with prerequisites, curriculum bindings and alignments
  (2026-08-14);
- library topics, derived from source links (2026-10-02);
- the repo knowledge map, with switchable views including C4, behind an alpha
  switch (2026-10-03);
- the rule that agents and shared content are untrusted (2026-10-08b).

## Decisions

### 1. The atlas is a fixed view of the learning model

- **One hex, one learning unit.** Each hex is a *Lerneinheit*, a learning
  unit: one LearningAtom. A token without an atom stands as its own unit. In
  the Weltwissen lens a unit is usually a single Begriff; in team knowledge
  it rarely is.
- **A name is not an identity.** A title may repeat across islands, and each
  hex with that title is its own unit with its own content and cards. ZAM
  never merges units by name. As elsewhere, name, slug or embedding
  similarity may *propose* that two units are the same, but cannot decide it
  (ADR 2026-08-14, Decisions 8–9). Where a title repeats, the map shows it in
  context: island colour and breadcrumb, and the region name in search
  results and tooltips.

  | Title | On island | What the unit teaches |
  |---|---|---|
  | Troubleshooting | Produkt A (server) | reading the server log and the health endpoint |
  | Troubleshooting | Produkt B (desktop client) | resolving sync conflicts and resetting the local cache |
  | Spannung | Physik | electric potential difference, U in volts |
  | Spannung | Deutsch | the tension arc of a story |

- **Knowledge that really is the same lives once.** A REST basics unit that
  several products build on is world knowledge: it lives on the world planet
  (Decision 2). The products that use it link to it with threads (Decision 7)
  instead of holding copies. Only what a team adapts becomes team knowledge.
- **Sameness is proposed, then decided.** The agent may propose that two
  units are the same, judged by content, never by name. Until someone
  decides, both units stay.
  - On a personal library the learner decides, the way material import
    shows existing content beside a proposal (2026-10-05, Decision 8).
  - On a team library a curator decides.
  - A merge moves cards and review history only through an explicit
    `replaces` (2026-08-14, Decision 9). Without it, the units stay apart.
- **Condition is computed, never stored.** It comes from the learner's FSRS-6
  cards when the map is drawn.
- **The learner does not rearrange the map.** The agent keeps the order, and
  curators confirm it on a team library. Nothing the atlas does changes
  scheduling; only reviews do.
- **The atlas shows what the learner has, and on request what is in reach.**
  - By default the map shows the learner's own units. Published land they
    have no card for is blank: the coast is the same for everyone on a
    library, but it carries no names. *Wo nichts ist, kann man nichts
    vergessen.*
  - A switch, *Neue Inhalte zeigen*, draws published units without a card
    as pencil sketches, with title and Sinnbild. A pupil sees what comes up
    in school next and takes it in right from the map. Content not started
    yet and content never meant to be started look the same.
  - Taking content in is always the learner's own click. Install never
    enrols (2026-08-14, Decision 3), and bonus content is offered, never
    scheduled (Decision 6).
  - Content the learner actively declined stays blank, even with the switch
    on.
  - There is no counter and no percentage. The sketches show what is there,
    not how much is left.

### 2. Planets: world, company and private knowledge never mix

The atlas holds three kinds of knowledge, each on its own **planet**. Each
planet has its own map, its own lenses and its own colour of sea.

| Planet | Lives on | Leaves its place |
|---|---|---|
| Weltwissen | published by a central knowledge server, installed into every library; public, and most useful for schools | yes: it is meant for everyone |
| Firma | the company's learning server, or a local file on a company machine | never: company knowledge stays inside the company |
| Privat | the learner's own device or private library | never: contacts, birthdays, anything kept private |

- **No unit lives on two planets.** A REST basics unit belongs to world
  knowledge. Every team needs that world knowledge to work, so it is not
  copied into the company planet. Only a team-specific adaptation is company
  knowledge: for example, how Team Boreas runs Scrum. Scrum is deliberately a
  framework, so it differs from team to team, but it rests on foundations
  that are world knowledge.
- **Threads cross planets in one direction only:** from company or private
  knowledge to world knowledge.
  - The thread is stored on the dependent side, so world knowledge never
    learns about company or private units.
  - Company and private knowledge are never linked to each other.
  - The map shows such a thread as a portal on the coast; a click opens the
    other planet at that unit.
- **An import stays on the planet where it started.** The units an import
  creates belong to the planet of the region the learner chose.
  - The agent may link them to existing world units, and it may propose that
    something is world knowledge. It never writes to the world planet.
  - A new world unit goes out through the editorial release of the central
    content service, with a named reviewer (2026-07-26b, Decisions 1–3:
    there is no write path from a learner's device; 2026-08-14b).
- **One connected library per device.** The database binding carries the
  knowledge context (2026-07-04, Decision 9): a work device is connected to
  the company library, a private device to the personal library.
  - Each library holds two planets: world knowledge, installed as published
    content, and its own planet, which is Firma on a company library and
    Privat on a personal one. Firma and Privat never share a database. The
    kernel enforces the one-way rule on every write.
  - The company library is the company's server (2026-09-04). Where none has
    been set up yet, it may be a local database file on a company machine.
    It is never the learner's private library.
  - World knowledge arrives as published content, installed into the
    connected library (2026-07-26b). A portal is therefore a local row that
    names a world unit, and the client draws it. The world service has
    nowhere to store a company or private end.
  - Agent tools work on the connected library only. They take no library
    URL and return one planet per call.
  - Holding several connections at once is a separate topic. If it comes, it
    keeps these rules: no thread between Firma and Privat, and no company
    note in a private library.
- **Model calls leave the device too.** Judging sameness, proposing a lens
  or drawing a Sinnbild sends text to the configured model endpoint. An
  organisation confines that with `llm.cloud` and `llm.endpoints`
  (2026-10-08b, D6). Thread storage does not do that job.

### 3. Lenses: several orders over the same knowledge

A **lens** is one way to order the same learning units into a tree of
regions. Its top level forms the islands; its leaves hold the units. Each lens names its
own levels, and the depth may differ.

| Lens | Islands › … › leaf | Comes from |
|---|---|---|
| Weltwissen | Bereich › Fach › Gebiet › Thema | domain paths through aliases (agent) |
| Schule | Klasse › Fach › Lernbereich | curriculum bindings: school type, grade, subject, `topic_title` (deterministic) |
| Unternehmen | Organisation › Bereich › Team › Verantwortung | curated on the team library; the agent proposes from the sources |
| Produkte | Produktlinie › Produkt › Komponente | curated on the team library; the agent proposes, e.g. from the repo knowledge map's C4 model |

- **Every lens is shared knowledge, kept by the agent.**
  - Weltwissen and Schule derive from data ZAM already holds.
  - Unternehmen and Produkte are curated on a team library.
  - Raw domains are messy: the bundled tiles alone use about 190 area slugs,
    several of them meaning the same thing. The agent maps them onto readable
    regions through aliases. The learner never builds structure before
    learning.
  - Regions and aliases for public content are published with that content
    by the central content service, so every learner starts with the same
    readable map. A library adds aliases for its own units only, and one
    school's import never moves the published map.
  - Library topics (2026-10-02) stay the catalogue of sources. A lens is the
    spatial order; the two exist side by side.
- **One home per unit and lens; titles may repeat.**
  - Each learning unit has exactly one home in a lens.
  - The same title can still appear on several islands, as different units
    (Decision 1).
  - A unit that no rule of the lens covers lands on an island for the
    unsorted, such as "Außerhalb des Lehrplans".
  - In Schule, a unit bound to several grades lives on the island of the
    earliest grade, where it is first taught. Later grades reach it through
    a Voraussetzung thread. A later grade that teaches something else is a
    different unit, even under the same title.
- **The learner chooses a primary lens.** Switching lenses keeps the
  selection: the same unit simply sits somewhere else.
- **On a team library, Produkte is the default primary lens.** The product
  landscape stays stable while the organisation moves.
  - Produkte comes from the repo knowledge map's C4 model or from the
    structure of the team's knowledge hub (2026-09-04, Decision 10).
  - Unternehmen is optional. The agent proposes the whole order anew from
    one named source, such as the company's list of teams; a curator accepts
    it, and the map shows the new current view. The agent notices that the
    lens no longer fits by comparing it with that source.
  - Every learner may still choose their own primary lens.
- **Know your own area precisely, the rest roughly.** A learner has a home
  region: their team, or their class. The map opens zoomed to it, with the
  neighbouring islands in view. From there, zooming out shows the whole, and
  zooming in shows the details of one's own area.
- **The primary lens and the home region follow the learner** across
  devices: they are how this person finds their work. On a team library they
  are `user_settings` rows, which the member writes (2026-09-04, Decision 4),
  never `user_config`, which curators write. Zoom and pan stay on the
  machine.
- **Always the current view.**
  - A lens has no versions. When teams are reorganised, the curators (helped
    by the agent) change the lens, and the map simply shows the new order.
  - History is not part of the atlas, for now: the map holds only what is
    true today.
  - Lenses that change rarely, such as the product landscape, give a stable
    way to find one's bearings while the organisation moves.
- **Dependency.** Weltwissen needs only labels, order and aliases on domain
  paths — the `domain_meta` idea plus a rank and an alias. It does not wait
  for token identity to be settled.

### 4. Colour says where, texture says how well

- **Colour.** Each lens has a colour level: Fach in Weltwissen and Schule,
  Team in Unternehmen, Produkt in Produkte. Each region on that level gets a
  hue.
  - The hue follows the region's key, such as the subject, and is not stored
    per region. Mathematik is therefore the same blue on every grade island.
  - A region below the colour level gets a shade of the hue plus a pattern
    (hatching, dots, waves, rings, …), so neighbours stay apart even where
    colour fades.
- **Texture shows condition:**

  | Texture | Means |
  |---|---|
  | full colour | known |
  | washed out and dusty | due |
  | dark | long overdue |
  | cracked | decaying (keeps lapsing) |
  | fog | probably forgotten |
  | sketched on parchment | never practised (a card in state `new`) |
  | pencil sketch, no fill | no card yet; shown only with *Neue Inhalte zeigen* |
  | blank land | no card, or declined |

- **Never colour alone, on the map itself.** On the colour level, the
  Sinnbild and the name carry what the hue says. Below it, the pattern does.
  Texture repeats the condition. Colour-blind learners need not switch to the
  outline view to tell regions apart.
- **One kernel function computes the condition classes**, from
  retrievability, due state and lapses. Queue, statistics, atlas and graphs
  then agree.
  - A card that is not due is *known*. The classes below it lie past the due
    point, so their bands are relative to the learner's request retention
    (default 0.9), not fixed numbers. The spike's R 0.85 / 0.75 / 0.65 and 3
    lapses assume the default.
  - A card in short steps (learning, relearning) counts as due. A card in
    state `new` is parchment.
  - A unit has as many cards as its practice items. Its condition is the
    weakest of them: the representative item is no mastery claim
    (2026-08-14b, Question 4).
  - The bands are named constants, tested like scheduling.
- **The encoding becomes shared design tokens.** That answers "too
  monochrome" once for every view.
  - The learning graph (the 3D view and the 2D panel) adopts hue and
    condition texture.
  - The repo knowledge map has no cards (2026-10-03), so it adopts the hue
    only.

### 5. Semantic zoom with a Sinnbild on every level

- **Zoom walks the lens's levels, like C4.** From afar you see the islands and
  their first level, each with its Sinnbild. Closer, the deeper levels appear,
  and closest, the learning units with their Sinnbilder and titles. Labels give way
  to the next level; big names fade into watermarks across their land.
- **Navigation.** A click selects on the level in view. A breadcrumb and
  search help you find your way, and Esc goes up one level.
- **Accessibility.** An outline view lists the same lens, for keyboard and
  screen-reader users, like the knowledge map's outline view.

### 6. Sinnbilder: agent-drawn SVG, shared first, personal override

- **What a Sinnbild is.**
  - A small SVG (`viewBox 0 0 64 64`) plus an optional glyph of up to 16
    characters, such as `a² + b² = c²`.
  - Text-only models draw them, because SVG is text. The spikes hold 100 such
    Sinnbilder.
- **Who carries one.** Every learning unit and every region can have a
  Sinnbild. A leaf region without its own shows its first unit's.
- **Shared first, personal override.** The first Sinnbild is shared when its
  writer may write knowledge: on a personal library the learner, on a team
  library a curator. In the pilot every member is a curator (2026-09-04,
  Decision 7).
  - A shared Sinnbild counts as knowledge, like the order itself.
  - Without that right, the first Sinnbild is personal, and the agent may
    propose it for sharing.
  - A learner may always set their own, which only they see. It counts as
    their learning state.
  - This refines the owner's decision of 2026-10-12 ("the first Sinnbild
    applies to everyone") after review round 1.
- **Sinnbilder are untrusted content (2026-10-08b).**
  - A kernel validator runs on every write. It parses the SVG into a tree and
    accepts only the allowed elements and attributes: plain shapes and text.
    It rejects scripts, styles, links, images, entities, `url()` and `data:`,
    requires `viewBox="0 0 64 64"` with bounded `width` and `height`, and
    allows at most 6000 characters. A regular expression over the source is
    not enough.
  - Surfaces render only the validated bytes, base64-encoded, through
    `<img>`: in the atlas, the queue, the graph, search, Mobile and the MCP
    Apps panel. Never through `<object>`, `<embed>`, `<iframe>` or
    `innerHTML`.
  - The glyph is plain text, rendered escaped on every surface.
  - SVG text, glyphs and thread notes in MCP tool results carry
    `untrusted: true` (2026-10-08b, D7). The validator cannot stop
    `<text>ignore previous instructions</text>`; marking it as data can.
  - Writing a personal Sinnbild changes only learning state. Writing a shared
    one needs curator rights.
- **Reuse.** The same Sinnbilder appear on review cards, learning-graph nodes
  and search results.

### 7. Red threads

- **Thread kinds, with connector shapes borrowed from UML.** All threads are
  red, and the line and its end say what kind it is.
  - Every kind also says it in words: on hover, in the unit panel, and beside
    the line at the closest zoom ("baut auf", "nutzt", "Schnittstelle",
    "ist ein"). The shapes help those who know UML; nobody needs UML to read
    a thread. A pupil on the Schule lens mostly meets Voraussetzung and
    Verbindung.

  | Kind | Means | Drawn like (UML) | Typical source |
  |---|---|---|---|
  | Voraussetzung | B builds on A | solid line, arrowhead at A | atom and token prerequisites |
  | nutzt | A depends on B | dashed line, open arrowhead at B («use» dependency) | product and component dependencies |
  | Schnittstelle | A provides an interface, B uses it | ball at A, socket at B (provided and required interface) | an API, its consumers |
  | ist ein | A is a special case of B | solid line, hollow triangle at B (generalisation) | world knowledge: a square is a rectangle |
  | Verbindung | related, with a note | plain line with a paper note (association) | the agent's or the learner's insight |

- **Voraussetzung threads are the existing prerequisite edges**, also across
  planets: a world unit is installed in the connected library (Decision 2),
  so a company unit can require it like any other.
- **The other kinds are new data**: two ends, a kind, a note and an author.
  - The agent proposes shared threads; on a team library a curator publishes
    them.
  - A learner's own threads, of any kind, are learning state. They never
    feed blocking.
  - A thread is not an alignment. Alignments link to external vocabularies
    and stay advisory (2026-08-14b). A thread is a hint for learning, never
    a statement of identity or equality — two units with the same title are
    not linked just because of it. An "ist ein" thread never dedupes units or
    moves learning state.
- **Threads bundle to the level in view.** From afar they run island to
  island, then region to region. Up close they connect single units, with
  prerequisites shown only around the focus. The learner chooses between all
  threads, only those of the selection, or none.
- **Each lens tells something different.**
  - In Schule, a thread to another island shows a foundation from an earlier
    grade.
  - In Unternehmen and Produkte, «nutzt» and interface threads show which
    products depend on which, and who consumes an interface. This is the
    question a team asks most about its neighbours.
  - The bundled tiles carry over 400 prerequisites, almost all within one Fach.
    Links across Fächer are where the agent adds value.

### 8. Knowledge grows as land; islands drift apart

- **Positions belong to the lens and are shared.** They are stored once laid
  out, so everyone on a team library sees the same map. "The platform island
  is top left" then works in conversation.
- **Inside an island, places stay put.** A unit's hex is assigned once and
  stored.
  - When an island is founded, a Gosper curve lays it out, so every region is
    one connected patch at every zoom level. Each region gets reserved land
    for growth.
  - A new unit takes its region's reserved land or the nearest free coast.
  - ZAM never recomputes the curve for an existing island: that would move
    units. A relayout happens only when a region outgrows all of its land,
    and the library is told. (The spike still recomputes the curve on every
    change; the product must not.)
- **Growth may found new islands or enlarge existing ones.**
  - A new island is founded when a new top-level region appears: a new
    product, grade or subject. A crowded island first uses its reserved land.
    A product that splits in two is a curator edit of the Produkte lens, not
    an automatic push.
  - Islands drift apart to make room, outward along their existing bearing
    and by a capped amount, so each neighbour stays in its direction. Where
    making room would turn a neighbour, the new island is placed farther out
    instead, and the existing constellation stays.

### 9. Import starts at a place on the map

- **The map is where new knowledge comes in.** On any region the learner
  chooses *Hier importieren …*. They hand over class notes, a handout or a
  text, and the agent turns it into learning units *right there*.
  - The agent fills in only the levels missing below the chosen region: for
    example a Thema under a Gebiet.
  - The deeper the learner starts, the less the agent has to guess. Started
    at the planet as a whole, the agent finds the place itself.
- **Structure first, especially from the curriculum.** The Bavarian
  curriculum (LehrplanPLUS) has a good structure, even where its content is
  thin. When the structure already exists, an import does not have to invent
  categories. At a region, the import dialog offers the curriculum tiles that
  land inside it: under *Physik › Mechanik*, the Mechanik tiles of every
  grade.
- **The agent does the sorting in every import path**, as part of the import
  and never as a separate step for the learner. The import paths are tiles,
  material import (2026-10-05), OKF import and goal import. Material import
  gains a *place* as its target.
- **Every import path works without the atlas.** The atlas sits behind an
  alpha switch (Decision 10). While it is off, every import path works as
  today; while it is on, a place is an extra target.
- **The cell has precedence.** Where a cell covers the region, the offer goes
  through the cell: the surface asks `needsGenericCurriculumImport` first
  (2026-08-14, Decision 10). The agent may fill levels under that structure,
  but the cell's set stays the set.
- **Nothing of the material is stored** (2026-10-05, Decision 9). The
  material goes to the model in the same flow. An import request keeps the
  place, the source link and the units added, not the text.

### 10. Surfaces and agents

- **The Studio comes first**, with the atlas as a view beside the learning
  graph. It sits behind an alpha switch, like the knowledge map (2026-10-03,
  Decision 4): machine-local in `~/.zam/config.json`, off by default, and no
  tool writes it.
- **Reviewing a region** opens the due queue for that region's cards. Each
  submit declares its `answer_format` (2026-09-27). Layout and drift never
  touch scheduling.
- **MCP tools.** Each stays safe even when a host approves it automatically
  (2026-10-08b):
  - read the atlas, a lens and the caller's own region statistics;
  - connect two units with a thread of a given kind (personal by default);
  - set a Sinnbild (personal by default; shared only with curator rights);
  - for curators, edit a lens: regions, names, order, aliases.

  Only the read tool is a candidate for the reviewed pre-approval list
  (2026-10-08b, D4). Writing a thread, a Sinnbild or a lens always asks. The
  open Studio follows agent changes live.
- **Statistics are the caller's own.** A region shows "3 due here", from the
  learner's own cards. There are no figures about other people (2026-07-04,
  Decision 11), and no coverage percentage, which would be a target
  (2026-08-14, Decision 6).
- **Sorting is part of every import path**: tiles, material import, OKF import
  and goal import. It is never a separate step for the learner.
- **Later:** Mobile and an MCP Apps panel.

### 11. The 3D world stays a spike

The 3D world is where personal arrangement lives: building, moving and
demolishing, and reviewing before a move. It is not pursued for the product
now. It may return as a walk-through mode over the same lenses and condition
data, and nothing here depends on it.

## Data model sketch

This is indicative; the plan fixes the names. Every schema change goes into
`schema.ts` and an M-series migration, and raises `CURRENT_SCHEMA_VERSION`.

| Table (sketch) | Class | Holds |
|---|---|---|
| (planet) | — | not a table: world units are installed published content, the library's own units form its own planet (Decision 2) |
| `atlas_lenses` | knowledge | id, name, kind (`weltwissen`, `schule`, `unternehmen`, `produkte`, …), level names, colour level |
| `atlas_regions` | knowledge | lens, parent, level, name, key (drives the hue), rank, pattern, optional `ontology_ref` |
| `atlas_domain_aliases` | knowledge | domain path → region (Weltwissen) |
| `atlas_members` | knowledge | lens, atom or token → leaf region (derived or curated) |
| `atlas_positions` | knowledge | lens, member → hex, assigned once; lens, island → offset |
| `emblems` | knowledge | subject (atom, token or region), SVG, glyph, author; no learner column |
| `learner_emblems` | learning state | learner, subject, SVG, glyph: a personal override |
| `connections` | knowledge | ends, kind (`nutzt`, `schnittstelle`, `ist-ein`, `verbindung`), note, author; no learner column |
| `learner_connections` | learning state | learner, ends, any kind including `voraussetzung`, note; never feeds blocking |
| `import_requests` | learning state | lens, region, source link, units added; never the material itself |

Shared and personal rows live in separate tables, like tokens and cards, so
row-level security on a team library never has to tell them apart inside one
table. An end that names a world unit uses its published id; while pilot ids
are provisional (2026-08-14, Decision 8), a rebuild remaps it through the same
explicit mapping as cards. Prerequisite threads stay in the existing
prerequisite tables.

## Delivery

All phases ship on one branch.

- **Phase 0: shared look.**
  - The kernel condition function.
  - Shared design tokens; the learning graph adopts hue and condition texture.
- **Phase 1: a read-only atlas in the Studio (alpha).**
  - The Weltwissen and Schule lenses, both derived from existing data.
  - Condition, semantic zoom, search, home region and prerequisite threads.
  - Reviewing a region.
  - Stored positions, and growth with island drift.
- **Phase 1b: import at a place.** *Hier importieren …* on regions, with
  matching curriculum tiles and notes handed to the agent. *Neue Inhalte
  zeigen*, and taking content in from the map.
- **Phase 2: Sinnbilder.** Storage, the validator and the MCP tool, shown in
  the atlas, the queue and the graph.
- **Phase 3: the company planet, team lenses and typed threads.**
  - Curated Unternehmen and Produkte lenses on the team library.
  - Threads of every kind, with notes, including threads to world knowledge.
  - A private planet, if the personal library holds private knowledge.
- **Phase 4:** Mobile and the MCP Apps panel.

## Consequences

**Positive:**

- One view of everything a learner knows, through the order that suits the
  moment: subject, grade, team or product.
- Forgetting becomes visible.
- A shared, stable map gives a team common places to talk about, even through
  reorganisations.
- Dependencies and interface consumers become visible as threads between
  products and teams.
- No setup work for the learner: the order comes from the agent and the
  curators.
- One colour language across all knowledge views.
- Sinnbilder are useful well beyond the atlas.

**Trade-offs:**

- New knowledge tables, to provision on the team library.
- Curated lenses cost curator effort, and they go stale when the organisation
  changes faster than the lens.
- Telling "the same knowledge" from "the same name" takes judgement. The agent
  proposes and curators decide; until they do, a unit may exist twice.
- Thousands of atoms on a team library need culling, bundling and label
  thinning. The canvas spike holds a few hundred with ease.
- Sinnbilder take storage: up to 6 KB per subject.

## Alternatives considered

- **The walkable 3D world as the product (spike 1).** Rejected for now: the
  self-organisation overload, its cost, and accessibility.
- **Identity by name** (merge units with the same title). Rejected: in team
  knowledge the same name means different things on different islands.
- **The learner rearranges the 2D map** (the spike's review-before-move).
  Rejected: a fixed, shared map gives a common picture. Personal arrangement
  stays with the 3D spike.
- **One fixed order for everything.** Rejected: subject, grade, team and
  product each orient a different question, and the owner wants to switch
  between them.
- **Treemap or circle packing.** These nest clearly, but have no map feel, and
  neighbours carry no meaning. They remain possible as an extra view.
- **A force-directed graph** (today's learning graph). It is good for one
  neighbourhood, but turns into a hairball for the whole. It stays for focused
  work.
- **A Voronoi treemap.** It looks organic, but is more complex and less stable
  under growth. The Gosper curve gives connected regions cheaply.

## Open questions

None remain after review round 1. Resolved there:

- placing a unit on its planet, and where the company planet lives
  (Decision 2);
- content in reach (Decision 1);
- curated lenses and the default lens on a team library, public aliases,
  several grade bindings, and where preferences live (Decision 3);
- splitting an island and drift (Decision 8).

The field test checks the default of *Neue Inhalte zeigen*.

## Verification

- **Kernel tests:**
  - condition classes at their threshold boundaries;
  - the Weltwissen and Schule lenses derived from domains and bindings;
  - two units with the same title stay apart;
  - a thread from world knowledge to company or private knowledge is
    refused, and so is one between company and private knowledge;
  - an import creates units only on the planet of the chosen region, never
    on the world planet;
  - an import at a region asks only for the missing levels below it, and
    stores no material;
  - condition: a unit takes its weakest card; the bands follow the learner's
    request retention; a card in short steps counts as due;
  - stable positions: adding a unit moves no other unit in its island;
  - island drift without overlap, keeping each neighbour's bearing;
  - the Sinnbild validator accepts a tree of plain shapes and rejects
    scripts, styles, images, entities, `url()`, `data:` and a missing
    `viewBox`; a glyph with markup renders as text;
  - region statistics count only the caller's own cards;
  - a library never holds both Firma and Privat units;
  - a non-curator's first Sinnbild on a team library is personal;
  - land without a card is blank, unless *Neue Inhalte zeigen* is on; content
    the learner declined stays blank either way; taking content in from the
    map creates cards only on the learner's click.
- **Studio:**
  - with the alpha switch off, every import path works as before;
  - with the alpha switch on, the atlas opens on the home region and every
    zoom level reads;
  - switching lenses keeps the selection;
  - reviewing a region recolours it;
  - an agent change shows up live;
  - dark mode works, and the outline view works by keyboard.
- **Field test:** a pupil uses the Schule lens for a week. Does seeing the
  whole change what they review? Do they turn on *Neue Inhalte zeigen*, and
  do they take in what comes up in school from the map?

## Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-13 | Draft | Written after the two spikes on PR #405. Revised the same day: the map is fixed (no rearranging), lenses for several orders, growth through new and drifting islands; learning units instead of terms (titles may repeat), UML-style thread kinds, no versions or history; planets for world, company and private knowledge; import at a place. |
| 2026-10-13 | Proposed | Opened as a docs PR for review before the plan. |
| 2026-10-13 | Proposed | Review round 1 (Grok, Gemini) folded in: imports stay on their planet and never write world knowledge; one connected library per device; model calls named as egress; sameness decided by learner or curator, merged only through `replaces`; stored hexes, Gosper only when an island is founded, bounded drift; condition from the weakest card, bands relative to request retention; Sinnbild validator parses a tree, glyph escaped, `untrusted: true`; words beside the UML shapes; prerequisite threads are the existing edges; shared and personal rows in separate tables; imports work with the atlas off, cells first, no stored material; only the read tool may be pre-approved; statistics only the caller's own. Six open questions resolved. |
| 2026-10-13 | Proposed | Owner decisions on round 1: each library holds world knowledge plus its own planet (Firma on the company server, or a local file on a company machine where none exists; Privat on the personal library); land without a card is blank, *Neue Inhalte zeigen* shows it as pencil sketches to take in, declined content stays blank; Produkte is the default lens on a team library; the first Sinnbild is shared only when its writer may write knowledge. No open questions remain. |
