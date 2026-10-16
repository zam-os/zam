# Knowledge Atlas: A Zoomable Map of What You Know

**Status:** Partially implemented — 2026-10-14 (PR #407): delivery phases 0
to 3 shipped, and of Phase 4 the MCP Apps panel and the outline on Mobile; the
map itself on Mobile is open. See the delivery note\
**Date:** 2026-10-13\
**Deciders:** Thomas (project owner)\
**Implementation plan:** `docs/plans/2026-10-13-knowledge-atlas.md`, removed
at release 0.52.0; read it in the history of zam-os/zam#407\
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
- **World knowledge is public domain.** It is knowledge that no individual
  and no organisation protects. A method taught at school is certainly not
  protected knowledge.
- **One goal, one method.** A state or a teacher decides that pupils learn a
  general skill, such as adding large numbers without a calculator. There are
  several methods to get there: a hand calculation system in China, written
  column procedures in Germany. The school prescribes the method, which is
  why class notes matter, and a school-specific tile may replace a published
  one. Nobody needs ten ways to add; one is enough.

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
  - Where a learner holds cards on both units, a decided sameness still
    never combines two retrieval histories; the install already refuses such
    a merge (2026-08-14, Decision 9). The superseded unit is no longer
    offered for new enrolment, both histories stay, and the surviving unit
    is offered for a real retrieval.
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
planet has its own map, its own lenses and its own colour of sea. Two things
about a unit are kept apart:

- its **kind**, the planet, which says who protects the knowledge;
- its **status**, published or own, which says where it comes from.

| Planet | Protected by | Lives on | Leaves its place |
|---|---|---|---|
| Weltwissen | nobody: public domain, or an open licence that lets everyone share it | published by a central knowledge server, installed into every library; most useful for schools | yes: it is meant for everyone |
| Firma | an organisation: confidential work, trade secrets | the company's learning server, or a local file on a company machine | never: company knowledge stays inside the company |
| Privat | a person: personal data, privacy | the learner's own device or private library | never: contacts, birthdays, anything kept private |

- **What may be published.** The editorial release checks exactly the
  "Protected by" column before an own unit is published as world knowledge.
  - The unit teaches common knowledge in its own words.
  - It holds nobody's secrets or personal data.
  - It copies no protected text.
- **How it is released.**
  - ZAM releases the world units it writes as CC0. In Germany, where authors
    cannot waive copyright, CC0 acts as an unrestricted licence.
  - Third-party content under an open licence that requires attribution,
    such as the CC BY decks of 2026-08-09, keeps its attribution in the
    source link.
- **The knowledge is free; a particular text about it may not be.**
  - A pupil's notes may quote a textbook. The units built from them are
    written anew, which is why they can become world knowledge at all.
  - It is also why the material itself is never stored (2026-10-05,
    Decision 9).
- **This settles the licensing rule for content ZAM writes.** The central
  content service raised it as its open question (2026-07-26b, Open
  question 1). Third-party curriculum text still needs its redistribution
  terms checked before publication.
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
- **The kind follows the place.** An import at a region takes that region's
  planet as its kind: under *Physik › Mechanik* it is world knowledge, under
  Team Boreas company knowledge.
  - The agent may propose another kind for a unit, for example "this note
    names a customer: Firma". The learner decides in the review list, or a
    curator on a team library.
  - In a mixed import, the agent proposes the kind per unit: Scrum's basics
    are world knowledge, how Team Boreas runs Scrum is Firma.
- **The status follows provenance, and it alone decides publishing.**
  - **Published units** come from the central content service.
  - **Own units** were written in this library: by an import, from notes, or
    by a team. They are drawn with a small marker for "eigene Einheit".
  - Own units are never published from a device, and a world sync never
    overwrites or removes them.
  - An own unit becomes published only through the editorial release of the
    central content service, with a named reviewer (2026-07-26b,
    Decisions 1–3: there is no write path from a learner's device;
    2026-08-14b).
  - A pupil's notes under *Physik › Mechanik* are therefore own world
    knowledge. A method taught at school protects nobody, so such a unit is
    a good candidate for that release, and the agent may propose it there.
- **One connected library per device.** The database binding carries the
  knowledge context (2026-07-04, Decision 9): a work device is connected to
  the company library, a private device to the personal library.
  - Each library holds two planets. One is world knowledge, published and
    own. The other is the library's own kind: Firma on a company library,
    Privat on a personal one. Firma and Privat never share a database. The
    kernel enforces the one-way rule on every write.
  - The company library is the company's server (2026-09-04). Where none has
    been set up yet, it may be a local database file on a company machine.
    It is never the learner's private library.
  - Published world knowledge arrives as content installed into the
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
| Leben | Bereich › Thema | the Privat planet of a personal library; the agent sorts from domains |

- **A library may add custom lenses on its own planet.** Beside the built-in
  lenses, whoever may write knowledge (a curator on a team library, the
  learner on a personal one) makes a lens with its own kind (a slug that is
  its permanent id), a name, and one to five level names, for example one
  island per repository with its projects below, next to Produkte's product
  landscape and Unternehmen's organisation. It starts empty and is filled
  like any curated lens: edits, aliases, an accepted proposal. Removing it
  takes its regions, aliases, placements and land; its units keep their
  places in every other lens. The world planet takes no custom lens: its
  lenses come with published content. (Amended 2026-10-16.)
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
  - A library may remove a world region it made itself, such as a Thema it
    added or a region of the unsorted island. A region of the published map,
    or one a published unit sits in, stays. (Amended 2026-10-15.)
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
    lens no longer fits by comparing it with that source. When the
    comparison fails, the curators see "this lens no longer fits its source"
    instead of waiting for someone to notice.
  - Every learner may still choose their own primary lens.
- **Know your own area precisely, the rest roughly.** A learner has a home
  region: their team, or their class. The map opens zoomed to it, with the
  neighbouring islands in view. From there, zooming out shows the whole, and
  zooming in shows the details of one's own area.
- **The primary lens and the home region follow the learner** across
  devices: they are how this person finds their work. On a team library they
  are `user_settings` rows, which the member writes (2026-09-04, Decision 4),
  never `user_config`, which curators write. Zoom and pan stay on the
  machine. When a lens edit removes the home region, the home falls back to
  its nearest surviving ancestor, else to the whole lens.
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
  screen-reader users, like the knowledge map's outline view. It says each
  condition in words ("fällig", "lange überfällig", "wohl vergessen"), so
  nobody has to read it from a texture.

### 6. Sinnbilder: agent-drawn SVG, shared first, personal override

- **What a Sinnbild is.**
  - A small SVG (`viewBox 0 0 64 64`) plus an optional glyph of up to 16
    characters, such as `a² + b² = c²`.
  - Text-only models draw them, because SVG is text. The spikes hold 100 such
    Sinnbilder.
- **Who carries one.** Every learning unit and every region can have a
  Sinnbild. A leaf region without its own shows its first unit's. A Fach is
  the same subject in every lens: Mathematik of the 9th grade and Mathematik
  in Weltwissen show one Sinnbild, the subject's.
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
  - A kernel validator runs on every path that stores an SVG: a tool, a
    curator, a tile install, a migration. It parses the SVG into a tree and
    accepts only the allowed elements and attributes: plain shapes and text.
    - It rejects scripts, styles, links (`a`, `href`, `xlink:href`), `use`,
      `foreignObject`, animation elements, images, event attributes,
      entities, `url()` and `data:`.
    - It requires `viewBox="0 0 64 64"` with bounded `width` and `height`,
      and allows at most 6000 characters.
    - A regular expression over the source is not enough.
  - What is stored and shown is the validator's own re-serialisation of the
    allowed tree, never the input text, so no difference between two parsers
    can slip through. Each row records the validator version, so a later
    tightening can re-check stored Sinnbilder.
  - Surfaces render that canonical form, base64-encoded, through `<img>`: in
    the atlas, the queue, the graph, search, Mobile and the MCP Apps panel.
    Never through `<object>`, `<embed>`, `<iframe>` or `innerHTML`.
  - The glyph is plain text, rendered escaped on every surface.
  - SVG text, glyphs and thread notes in MCP tool results carry
    `untrusted: true` (2026-10-08b, D7). The validator cannot stop
    `<text>ignore previous instructions</text>`; marking it as data can.
  - Writing a personal Sinnbild changes only learning state. Writing a shared
    one needs curator rights.
  - A shared Sinnbild that a library sets on a world unit lives in that
    library only. Like an alias, it never flows back to the central content
    service.
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
  - Only the layout engine and a curator's lens edit write positions, never
    a tool argument. Drift is not an agent capability.
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
- **Land no unit reaches goes back to the sea.** A freed hex stays its
  region's reserve while the region holds units. A region left without
  units keeps no reserve, and an island left without units disappears; a
  unit that comes back founds it anew. Nothing that holds a unit moves.
  (Amended 2026-10-15.)
- **Growth may found new islands or enlarge existing ones.**
  - A new island is founded when a new top-level region appears: a new
    product, grade or subject. A crowded island first uses its reserved land.
    A product that splits in two is a curator edit of the Produkte lens, not
    an automatic push.
  - Islands drift apart to make room, outward along their existing bearing
    and by a capped amount, so each neighbour stays in its direction. Where
    making room would turn a neighbour, the new island is placed farther out
    instead, and the existing constellation stays.
  - The caps are named constants, tested like the condition bands. Each
    island keeps its founding offset, so curators see how far it has drifted
    in total, not only per step.

### 9. Import starts at a place on the map

- **The map is where new knowledge comes in.** On any region the learner
  chooses *Hier importieren …*. They hand over class notes, a handout or a
  text, or describe what they are missing (the goal import), and the agent
  turns it into learning units *right there*.
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
  and goal import gain a *place* as their target.
- **Every import path works without a place.** An import started anywhere
  but the atlas works as today; started at a region, the place is an extra
  target.
- **The cell has precedence.** Where a cell covers the region, the offer goes
  through the cell: the surface asks `needsGenericCurriculumImport` first
  (2026-08-14, Decision 10). The agent may fill levels under that structure,
  but the cell's set stays the set.
- **Nothing of the material is stored** (2026-10-05, Decision 9). The
  material goes to the model in the same flow. An import request keeps the
  place, the source link and the units added, not the text.

### 10. Surfaces and agents

- **The Studio comes first.** The atlas takes the place of the 3D learning
  graph, in the sidebar and on Lern-Karten. The 3D graph becomes an alpha
  behind a switch like the knowledge map's (2026-10-03, Decision 4):
  machine-local in `~/.zam/config.json`, off by default, and no tool writes
  it. (Owner decision after the first Studio check; the atlas itself started
  behind such a switch.)
- **Reviewing a region** opens the due queue for that region's cards. Each
  submit declares its `answer_format` (2026-09-27). Layout and drift never
  touch scheduling.
  - The region's due count is what that review would show now, by the
    queue's own rules: a card waiting for its next short step, a blocked or
    buried card, and an atom's further items on a day one of them was shown
    are not counted. The condition still shows them.
  - When nothing in a small region is due, the learner is asked whether to
    go through its questions anyway, for instance before a test. Each card
    comes once, earliest due first, and is pulled forward only when it is
    shown (2026-08-14, pull-forward), so stopping half-way leaves the rest
    as they were. A large region offers no such run.
- **MCP tools.** Each stays safe even when a host approves it automatically
  (2026-10-08b):
  - read the atlas, a lens and the caller's own region statistics;
  - connect two units with a thread of a given kind (personal by default);
  - set a Sinnbild (personal by default; shared only with curator rights);
  - sort a unit that no rule places into a region (curator-only on a team
    library);
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

### 12. One goal, one method: a variant stands in

Some world knowledge is a goal that several methods reach. Adding large
numbers without a calculator is world knowledge; the method is not. Pupils in
China learn a hand calculation system, pupils in Germany written column
procedures. The school or the state's curriculum prescribes the method, and a
learner needs one, not ten.

- **A variant stands in for a published unit.** An own unit, or another
  published unit, may stand in for a published world unit when both reach
  the same goal by different methods.
  - It is drawn on the published unit's hex and gets no land of its own in
    that lens. An own variant carries the "eigene Einheit" marker.
  - The published unit is no longer offered to that learner: not in reach,
    not as bonus, not suggested by the agent.
  - Threads to and from the published unit are drawn to the variant on that
    learner's map.
- **Who decides.**
  - On a personal library, the learner decides. Usually the agent notices
    that class notes describe another method for an existing unit, and asks.
  - On a school or team library, a curator decides for all members.
- **Learning state is never merged.**
  - Cards the learner already holds on the published unit are detached ("Not
    for me", 2026-07-04, Decision 10): they keep their history but are no
    longer scheduled.
  - The variant starts with its own cards.
  - Nothing moves between the two units. `replaces` stays the publisher's tool
    for succession (2026-08-14, Decision 9).
  - Undoing the choice re-attaches the detached cards.
- **A whole tile can be replaced the same way.** A school-specific tile on
  the school's library declares, for each of its units, which published unit
  it stands in for. Installing it sets those variants for the school's
  members.
- **A method the curriculum prescribes comes with the content.** Where a
  state's curriculum prescribes a method, the published content carries that
  method's units, bound to that curriculum. Choosing the curriculum chooses
  the method, so no variant is needed.
- **A variant is not sameness.** It is the declared choice of another method
  for the same goal. The two units stay distinct units (Decision 1).
- **A school's method is world knowledge.** It protects nobody, so an own
  variant is a good candidate for the editorial release. Once published, it
  becomes a variant other schools can choose.

## Data model sketch

This is indicative; the plan fixes the names. Every schema change goes into
`schema.ts` and an M-series migration, and raises `CURRENT_SCHEMA_VERSION`.

| Table (sketch) | Class | Holds |
|---|---|---|
| (planet, status) | — | not a table: a unit's kind (planet) is the planet of the lenses it is placed in; its status is published when it came from the central content service, otherwise own (Decision 2) |
| `atlas_lenses` | knowledge | id, planet, name, kind (`weltwissen`, `schule`, `unternehmen`, `produkte`, …), level names, colour level |
| `atlas_regions` | knowledge | lens, parent, level, name, key (drives the hue), rank, pattern, optional `ontology_ref` |
| `atlas_domain_aliases` | knowledge | domain path → region (Weltwissen) |
| `atlas_members` | knowledge | lens, atom or token → leaf region (derived or curated) |
| `atlas_positions` | knowledge | lens, member → hex, assigned once; lens, island → offset |
| `emblems` | knowledge | subject (atom, token or region), SVG, glyph, author; no learner column |
| `learner_emblems` | learning state | learner, subject, SVG, glyph: a personal override |
| `connections` | knowledge | ends, kind (`nutzt`, `schnittstelle`, `ist-ein`, `verbindung`), note, author; no learner column |
| `learner_connections` | learning state | learner, ends, any kind including `voraussetzung`, note; never feeds blocking |
| `unit_variants` | knowledge | variant unit, published unit, deciding curator: for every member of a school or team library |
| `learner_variants` | learning state | learner, variant unit, published unit: the learner's own choice |
| `import_requests` | learning state | only if a harness path needs requests an agent can list; otherwise the material import's staging and `sources` row carry the place. Never the material itself |

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
  - Stored positions, and growth with island drift. In this phase the
    existing import paths make the land grow: tiles, cells, material import
    and OKF import. Their new units land by the lens rules, or on the
    unsorted island where no rule covers them.
- **Phase 1b: import at a place.** *Hier importieren …* on regions, with
  matching curriculum tiles and notes handed to the agent. *Neue Inhalte
  zeigen*, and taking content in from the map. Variants that stand in for a
  published unit (Decision 12).
- **Phase 2: Sinnbilder.** Storage, the validator and the MCP tool, shown in
  the atlas, the queue and the graph.
- **Phase 3: the company planet, team lenses and typed threads.**
  - Curated Unternehmen and Produkte lenses on the team library.
  - Threads of every kind, with notes, including threads to world knowledge.
  - A private planet, if the personal library holds private knowledge.
- **Phase 4:** Mobile and the MCP Apps panel.

> **Delivery note (2026-10-14, PR #407).** Phases 0 to 3 shipped, and of
> Phase 4 the MCP Apps panel and the outline on Mobile. The plan's "as built"
> notes, in the history of PR #407, record the details. What changed against
> the phases above, and what is open:
>
> - **The atlas is not an alpha.** After the first Studio check the owner
>   decided it is always shown and takes the 3D learning graph's place. The
>   3D graph is the alpha now, behind a switch on each computer.
> - **The goal import at a region** became the topic import of
>   [ADR 2026-10-14](2026-10-14-topic-import-and-source-provenance.md), for
>   world regions only.
> - **The MCP Apps panel** (`zam_show_atlas`) only reads. It offers nothing
>   that writes: no thread, Sinnbild, import, move, home or *Neue Inhalte
>   zeigen*, and no settle. A region review points to ZAM Desktop or the app.
> - **Mobile** shows the outline of one lens on the Fortschritt tab and
>   reviews a region from there; it writes nothing. The owner finds both
>   Fortschritt and Inhalte fitting; Fortschritt keeps Mobile at four tabs.
> - **Open:** the map itself on Mobile, with touch pan and pinch, follows as
>   its own feature (owner decision). The field test under Verification is
>   still to run.

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
  - an import creates own units only, of the place's kind unless the learner
    changes it, and publishes nothing; a world sync never overwrites or
    removes an own unit;
  - an import that mixes generic knowledge and a team's adaptation proposes
    the kind per unit, and every unit stays own;
  - an import at a region asks only for the missing levels below it, and
    stores no material;
  - condition: a unit takes its weakest card; the bands follow the learner's
    request retention; a card in short steps counts as due;
  - stable positions: adding a unit moves no other unit in its island;
  - land no unit reaches goes back to the sea and an empty island
    disappears, without moving a unit; a world lens removes only regions the
    library made itself;
  - a custom lens is made on the own planet only, under a kind no built-in
    lens has, is filled like a curated lens, and its removal leaves every
    other lens as it was;
  - island drift without overlap, keeping each neighbour's bearing;
  - the Sinnbild validator accepts a tree of plain shapes and rejects
    scripts, styles, images, `use`, `foreignObject`, animation, entities,
    `url()`, `data:` and a missing `viewBox`; what is stored is its
    re-serialisation, not the input; a glyph with markup renders as text;
  - a variant takes the published unit's hex; the published unit is not in
    reach; its cards are detached, not deleted and not moved, and undoing
    the variant re-attaches them;
  - when a lens edit removes the home region, the home falls back to the
    nearest surviving ancestor;
  - region statistics count only the caller's own cards;
  - a library never holds both Firma and Privat units;
  - a non-curator's first Sinnbild on a team library is personal;
  - land without a card is blank, unless *Neue Inhalte zeigen* is on; content
    the learner declined stays blank either way; taking content in from the
    map creates cards only on the learner's click.
- **Studio:**
  - every import path works without a place as before;
  - the atlas opens on the home region and every zoom level reads, with a
    busy indicator while the world is built;
  - a region with nothing due never ends as if questions had been answered;
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
| 2026-10-13 | Proposed | Implementation plan added. Clarified Decision 2: a unit imported into a world region stays in the connected library as unpublished world knowledge; "never writes to the world planet" meant the central service. |
| 2026-10-13 | Proposed | Review round 2 (MiMo, after merge) and owner decisions. Kind and status are kept apart. The kind (planet) says who protects the knowledge and follows the place. The status (published or own) follows provenance and alone decides publishing and sync. Own units carry an "eigene Einheit" marker, and only the editorial release publishes. New Decision 12, one goal and one method: a school's variant stands in for a published unit without merging learning state. Also: sameness never combines two histories; Sinnbilder are stored and shown as the validator's re-serialisation on every write path, and library Sinnbilder never flow back; home-region fallback; positions engine-written only; drift caps named, total drift visible; the Leben lens and the place tool listed; condition in words in the outline view. Owner input: world knowledge is public domain, and a method taught at school is not protected knowledge. The planets differ by who protects the knowledge: nobody, an organisation or a person. The editorial release checks that, and ZAM's own world units are released as CC0. |
| 2026-10-13 | Proposed | Owner decisions after the first Studio check of Phases 1–7: the atlas is always shown and takes the 3D learning graph's place in the sidebar and on Lern-Karten; the 3D graph becomes an alpha behind a machine-local switch. Building the world shows a busy indicator. A region's due count follows the queue's rules, and a small region with nothing due offers to go through its questions again, earliest due first (Decision 10). |
| 2026-10-13 | Proposed | Owner input after the second Studio check: a Fach's Sinnbild belongs to the subject and shows in every lens (Decision 6); the goal import is offered at a region, for describing missing knowledge rather than class notes (Decision 9). |
| 2026-10-14 | Partially implemented | PR #407: delivery phases 0 to 3 (the plan's Phases 1 to 9), and of Phase 4 the read-only MCP Apps panel and the outline on Mobile's Fortschritt tab with a region review. The goal import at a region became the topic import ([ADR 2026-10-14](2026-10-14-topic-import-and-source-provenance.md)). Owner decision: the map itself on Mobile moves to its own feature. |
| 2026-10-15 | Partially implemented | Owner request after a library deleted its legacy cards and kept an empty unsorted island of hundreds of hexes that no edit could remove: land no unit reaches goes back to the sea (Decision 8), and a library removes world regions it made itself (Decision 3). |
| 2026-10-16 | Partially implemented | Owner request after building a second view of a team library: more orders than the two built-in Firma lenses, as Weltwissen and Schule give the world planet two. A library may make custom lenses on its own planet (Decision 3); `atlas-lens-create` / `atlas-lens-remove` and the `create` / `remove` options of `zam_atlas_lens_edit` make and remove them. |
