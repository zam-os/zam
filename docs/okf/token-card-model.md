---
type: data-model
title: Token and Card Model
description: ZAM separates learning objectives, alignments, curriculum bindings, shared practice items, and each learner's personal FSRS card state.
tags:
  - kernel
  - data-model
  - tokens
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/token-card-model.md"
timestamp: 2026-10-26T15:10:50Z
---

ZAM's published central-learning model separates five objects:

1. A **LearningAtom** is a language-neutral learning objective in the shared
   prerequisite DAG.
2. A **ConceptAlignment** is a typed advisory link from that objective to an
   external vocabulary or another objective; it is not automatic identity.
3. A **CurriculumBinding** says where an objective appears in a provider,
   school type, grade, track, subject, and topic.
4. A **PracticeItem** is learner-facing recall substance for an atom: wording,
   reference answer, language, Bloom level, interaction tier, and optional
   structured fast check.
5. A **Card** is one learner's scheduling and participation state for one local
   practice item.

The database still names the shared local PracticeItem row **token**. A token
therefore carries the item text and metadata plus an optional `atom_id`;
legacy, imported, and repo-knowledge tokens may stand alone without an atom.
It is not the canonical cross-language objective. Token fields include slug,
title, concept, domain, Bloom level, context, `source_link`, editorial and
revision provenance, `language`, `tier`, and serialized `fast_check`.
Bloom drives prompt generation, while tier and fast-check metadata define the
review interaction. `provider` and `topic_id` remain a legacy one-binding
projection for curriculum imports; the n:m truth is stored in atom curriculum
bindings.

A token's question and concept may be **card-text segments**
(`question_segments`, `concept_segments`, M048): text, formulas with their
speech, and images. The plain `question`/`concept` columns then hold the
segments' derived projection, and only `writeCardText` writes either, so
they cannot drift; a plain write to a segmented field is refused unless it
echoes the projection. Fast-check options and curated distractors may carry
segments too. See [card-text-segments.md](card-text-segments.md).

Tokens imported from OKF articles carry an **anchored source link**:
`<article resource>#<anchor>` (or the bare resource URL without an
anchor). The base identifies the article, the anchor the heading the
concept came from. This makes "the tokens anchored in this bundle" a
queryable set — `listTokens({ sourceLinkBases })`, exposed as
`zam bridge list-tokens --source-link-base` — which the learning graph's
repo scope is built on.

A token can be in **maintenance**: `maintenance_at`/`maintenance_reason`
mark a token whose source binding needs repair (a stale source link, or
a re-import that did not confirm it). A maintenance token is kept — never
deleted — with its learning state preserved, but its cards leave the
review queue and due list until the binding is repaired and maintenance
cleared.

Tokens carry an **editorial state**: `draft`, `in_review`, `published`, or
`deprecated`. Only `published` content enters review queues, due lists,
presentation admission and rating. Raw captures —
MCP/Bridge `zam_add_token`, `zam token register`, Studio create, generic
curriculum extract, source/URL capture, Mobile import, and generated
split/foundation items — write `draft`. Curated KVT cells, OKF import that
passes structural checks, and adoption of existing Anki/file cards remain
identifiable published paths. `createToken()` still defaults to `published`
so those curated callers stay explicit. First-run starter cards pass
`published` so they remain immediately reviewable.

Publishing runs inexpensive structural checks: a required question for first
publication of a draft, a non-empty criterion that is not a slug echo, and
valid referenced atoms and prerequisite edges. A slug that ZAM derived from
the token's own question or concept is never an echo of them; a raw slug
pasted into a field always is. OKF import parks a token without a question
as a draft (listed under `drafts`) and publishes it on a re-import that
supplies the question. Semantic review of scope,
leakage, and subject-matter dependencies stays with the author. Publishing
records `published_by` / `published_at`; a material revision increments
`content_version`, while a cosmetic revision keeps the version. The version
lets ZAM identify cards whose learner last answered older substance. First
publication of a draft is typically cosmetic. Studio and Mobile expose a
Publish action that uses the same `personal-card-publish-revision` /
`zam_publish_revision` contract as MCP/Bridge. `zam_list_drafts` and
`zam bridge list-drafts` list unpublished captures.

A **card** is one user's FSRS and participation state for a token:
stability, difficulty, due date, state, block status, the
`learned_content_version`, optional assignment provenance, and optional
`detached_at` (see [fsrs-scheduling.md](fsrs-scheduling.md) and
[prerequisite-blocking.md](prerequisite-blocking.md)).

The practical consequence: **a concept needs a card for that user and must
be published to enter the review queue.** `zam token register` creates the
shared token as a draft; `zam bridge add-token` creates the draft *and* the
calling user's card. The card is visible in Studio and Mobile, but unpublished
drafts stay out of the queue until publish. The Android additive-import and
quick-capture flow preserves the same split: after explicit confirmation it
atomically creates a draft token and the paired learner's card, together with
requested prerequisite and knowledge-context links. Editing and publication
remain reachable there after Save.

Local APKG, CSV, and TSV imports preserve the same split. One valid external
card direction maps to one shared token. The importer then ensures a separate
personal card for the importing learner; importing unchanged content for a
second learner reuses the token and creates only that learner's card.
`imported_card_bindings` holds stable external identity and source metadata,
not scheduling state. For Anki the identity is note GUID plus card ordinal, so
siblings remain distinct directions with independent personal schedules. See
[local-card-file-import.md](local-card-file-import.md).

A learner can detach a card as "not for me": the card and review history
remain, scheduling stops, and reattaching resumes the preserved state.
An **assignment** is written as a row only: the assigner never touches the
assignee's cards. The assignee's own client creates and binds the card the
next time it builds a review queue (`bindStandingAssignments`), which also
re-attaches a card the learner had declined earlier. While an assignment
stands it prevents detaching or deleting; that refusal asks the assignments
table, not the card's cached `assignment_id`, so it holds before the card
exists. On the shared team library this is what row-level security demands
— no learner may write another learner's state — and the personal library
follows the same rule.
Removing a card (`personal-card-remove`) clears that user's learning state
and history but leaves the shared token untouched; deleting a token
(`personal-card-delete`) removes the concept for everyone. The same command
deletes every token of an area at once (a torn-down project, old
experiments), in one transaction.

Supporting tables: `imported_card_bindings` (stable file-import identity and
provenance), `prerequisites` (directed dependency edges between tokens),
`assignments` (curator-to-learner bindings), `review_logs` (immutable audit
trail of review events), `session`/`session_step` (work+learning episodes
with per-step ratings), and `token_embeddings` (semantic-search vectors,
produced by the CLI layer, stored by the kernel).

# Library topics: starting on a library's content

A shared library holds tokens but none of a newcomer's cards. A **library
topic** is how a learner starts on that content: the tokens that are
published, not deprecated and not in maintenance, and whose `source_link`
shares the part before `#` — one topic per OKF article or other cited
source. The key compares literally, the rule `getTokensBySourceLinkBase`
applies to one article: a trailing slash, another casing or a query string
is another topic. Topics are derived on every read and never stored. A
topic's name comes from the source's last path segment without its extension,
dashes and underscores read as spaces (`index` and `readme` name their
folder, a bare host names itself, and a link that names its file in a `path`
query parameter — an Azure DevOps file link — is named after that file);
`tokens.topic_id`, a curriculum provider's topic code, is unrelated. Tokens without a source link form no topic.

`listLibraryTopics` reports per topic its item count, its most frequent
domain, and the learner's own held and set-aside cards — nothing about other
learners. `startLibraryTopic` creates the learner's card for every member
token they lack, in one transaction. It writes learning state only, so it
needs no curator rights on the team library; it is idempotent, so a later
start adds only the tokens added since, and two clients of one learner
starting the same topic at once both succeed; and a detached card stays
detached.
The new cards then enter the queue under the normal new-card budget. Bridge:
`library-topics-list` and `library-topic-start --key <key>`; Studio:
**Library Topics** in Learning Content, and a pointer on a dashboard whose
deck is empty.

# Material imports: published tokens, cards by choice

A [material import](material-import.md) — cards a model proposed from a
learner's photos or PDF — is the one capture path that writes **published**
tokens: the learner has already decided each card in the review list, and
that decision is the editorial step. The choice then splits token and card
along the usual line:

- **Yes** writes the published token and the learner's card (or, for an item
  the library already holds, only the card; a detached one is re-attached).
- **Bonus** writes the same published token, or links an existing one, with
  **no card**. Without a card it never enters the queue, the due list or a
  rating — Bonus means kept and offered, never scheduled. The token still
  carries its file's `source_link`, so it is a member of that file's library
  topic.
- **No** writes nothing.

One `sources` row records each import: `uri = zam-import:<ULID>`, the
analysis `title`, the files' SHA-256 `fingerprints` and `imported_by`, the
learner who imported (M037). `token_sources` links every kept token to it.
Those links are how a learner's Bonus items are found again
(`listMaterialBonusItems`: linked to one of their imports, no card of theirs
in the queue) and how taking one (`takeMaterialBonusItem`) is restricted to
the learner's own imports. A card the learner set aside ("not for me") before
the import counts as absent, because keeping it as Bonus was the newer
choice; one set aside after the import stays out of every Bonus offer.

# Bundled cells: installation and enrolment

A bundled cell is commit-controlled shared content plus an explicit list of
in-scope atom ids. Installing it creates or reconciles atoms, alignments,
curriculum bindings, prerequisite edges, and local PracticeItem/token rows; it
creates **zero cards**. Enrolling a learner is a second operation that
materializes cards for the in-scope atoms' practice items: every item of an
atom the learner has no card on yet, and one new item per enrolment call
for an atom that already carries cards, so a content revision feeds new
items within the normal learning budget instead of enrolling existing
learners in every new card at once. A concept appears in a learner's queue
only after that card exists and the token is published. Installation,
enrolment, and publication remain separate kernel steps.

Curriculum bindings merge across cells: an omitted binding remains installed.
An atom can explicitly withdraw a wrong published binding through
`retired_curricula`. Each entry names the complete provider, school type,
grade (or explicit `null`), track, subject and topic code, plus a reason.
Missing scope fields and a simultaneous declaration of the same binding
are refused. Installation removes only the exact rows, then adds current
bindings in the same transaction. All existing practice items of the atom,
including overlay items, receive the corrected legacy provider/topic
projection. Cards and reviews are unchanged.

`installed_tiles` (M048) records each installed tile's version, or its
last failure. `reconcileInstalledBundledTiles` reinstalls the bundled tiles
whose version changed or whose explicit binding withdrawals are still pending
(the Studio runs it once per start, a few at a time),
so a fix that is only presentation — `materiality: "cosmetic"`, such as the
formula migration — reaches every enrolled learner without making anyone
relearn a card. A team library refuses it: there, tiles change only through
`zam team reinstall-tiles`, run by the administrator. Reconcile never
downgrades: versions compare as dotted numbers (`compareTileVersions`), and
a tile recorded at a newer version — installed from the academy catalog —
stays. If an older kernel recorded the current tile version without
understanding its withdrawals, `hasPendingCurriculumRetirements` makes
reconciliation apply that correction once; a later start finds no pending
row and skips it.

A practice item may name a `source_link`; an item without one takes its
atom's. Installing writes it to the token, so a card cites where its
knowledge is taught, such as a lesson of a ZAM Academy app
(`https://academy.zam-os.org/uml/#lesson=uc-1-boxes`). Links that differ
only after `#` form one library topic. A reinstall moves a link the tile
names; a tile that names none keeps a link set elsewhere.

**ZAM Academy cells** (ADR 2026-10-19) live in `zam-os/zam-academy` next to
their training apps. They are published at
`https://academy.zam-os.org/<app>/cell.json` and listed in `/catalog.json`
with a SHA-256 each.

- **Bundled copies.** `npm run academy:sync` copies every published catalog
  cell into the release. `npm run academy:sync -- --app <app-name>` copies
  one app and preserves the other bundled versions and lock entries. Both
  modes verify the catalog's SHA-256, tile id and version, and copy the cell
  bytes unchanged. A test checks the copies against
  `zam-academy-cells.lock.json`.
- **Reading.** Opening „Aus der ZAM Academy“ in Studio or Mobile reads the
  catalog and writes nothing to the library.
- **„Aufnehmen“** enrols through `enrolBundledCell`, with the fetched tile as
  `resolveTile`.
- **„Aktualisieren“** installs the newer catalog version of one held cell.
- **No downgrade.** Enrolling never installs an older version than the
  library holds.
- **Team libraries** refuse a cell their build does not bundle.
- **Label.** A curriculum binding with neither school type nor grade (an
  academy stage) is labelled by the tile's publisher.

Curriculum discovery compares official subject ids with their fixture aliases
(for example, `bwl-rechnungswesen` with `bwr`). For LehrplanPLUS Realschule,
track bindings keep groups II, IIIa and IIIb separate. A shared II/III binding
reaches each of those groups; a binding for II alone never matches a learner
in III, IIIa or IIIb. A combined II/III scope is a broad search filter.
The BwR 9 manifest offers group II only. Its Academy cell binds the five
grade-9 learning areas to that group; its two optional VAT refreshers carry
only an Academy binding. Wirtschaft und Recht 9 is the opposite case: one
Fachlehrplan serves groups I and III, so its manifest track `wpfg1-3` reaches
I, IIIa and IIIb, and its Academy cell binds the four grade-9 learning areas
to `I` and `III` and never to II. Its four optional English lessons carry only
an Academy binding. It replaces the old partial school cell of this grade:
three of that cell's eight cards pass their review history to Academy
successors, five retire without transferring mastery (approved 2026-10-22).
Deutsch 9 is a third case: the Realschule has one Fachlehrplan for every group,
so its Academy cell binds the four learning areas to grade 9 and names no
track, and the cell is offered to I, II, IIIa and IIIb alike. Its first
version sat beside the old partial school cell; version 2026.10.2 retires all
eight of that cell's cards without transferring mastery (approved
2026-10-23). The old cell is then no longer bundled, and its review history
stays.

Englisch 9 also serves every Realschule group through one Fachlehrplan. Its
Academy cell, version 2026.10.2, contains 36 core lessons bound to grade 9
and the five learning areas, plus four optional grammar refreshers with
only an Academy binding. Its 80 English practice items link to their lessons
in the training app. It replaces the old eight-card grammar cell: three
unchanged single-point recalls take their whole review histories to their
Academy successors, and five corrected or multi-part recalls retire without
transferring mastery (approved 2026-10-24). The old cell is no longer bundled;
all eight personal card states and review histories remain intact.

Französisch 9 is a second foreign language that only Wahlpflichtfächergruppe
IIIa teaches in this grade (groups I, II and IIIb have no French), so its
Academy cell binds all 56 lessons to grade 9 and track `IIIa` and is offered
to IIIa and to a learner who has not chosen a group, never to I, II or IIIb.
Its 168 French practice items link to their lessons in the training app. The
old four-card partial school cell has no safely equal single retrieval in the
new cell, so version 2026.10.2 retires all four cards as `retired_items`
without any mastery transfer and declares no `replaces` (approved 2026-10-24).
The old cell is no longer bundled; all four personal card states and review
histories remain intact.

Französisch 10 Realschule is bundled as an additional Academy cell, version
2026.10.2, with 57 lessons and 171 French practice items (2026.10.2 corrects
two distractor reasons and one sample solution; ids are unchanged). Like Französisch 9
it binds every lesson to track `IIIa` (grade 10, exam-relevant), so discovery
offers it to IIIa and to a learner without a chosen group, never to I, II or
IIIb. ZAM has no earlier Französisch-10 school cell for the Realschule; the
Gymnasium-10 cell stays bound to its own school type. The Academy cell
therefore declares neither `replaces` nor `retired_items`. Taking it creates
171 unlearned cards and leaves every French card state and review history
of grade 9, the Realschule-8 cell and the Gymnasium-10 cell unchanged.

Deutsch 10 Realschule is bundled as an additional Academy cell, version
2026.10.2, with 30 lessons and 60 practice items. Its official bindings name
grade 10 and the four learning areas of the common German curriculum, with
no track restriction, so discovery offers it to I, II, IIIa and IIIb alike.
Each practice item links back to its lesson in the training app; the links
form one library topic. The reading and language lessons use the existing
Literature, Media, Grammar and Spelling atlas areas. All official bindings
are marked exam-relevant. Five fast checks carry their required material
in the question, and a fixed publication timestamp keeps the displayed date
stable.

The earlier four-card Deutsch-10 school cell remains bundled and active.
The Academy cell declares neither `replaces` nor `retired_items`; its
upstream mapping records four C rows without an approved history transfer.
A bundled copy pins that proposal and the legacy fixture hash for review.
Installing the additional cell creates no personal cards. Taking it creates
60 unlearned cards for a learner who has none of its items yet and leaves
all four earlier card states and review histories unchanged. Repeating
installation and enrolment changes no schedule or review history.

Englisch 10 Realschule is bundled as an additional Academy cell, version
2026.10.1, with 46 lessons and 92 practice items. Its official bindings name
grade 10 and the five learning areas of the common English curriculum,
without a track restriction, so discovery offers it to I, II, IIIa and IIIb.
The language workshop and two general method lessons do not claim thematic
LB 5 coverage. Its items use the established English Grammar, Writing,
Landeskunde and Literature atlas areas. Each links back to its training
lesson, and all lesson links form one library topic. The declared task
language is English; English-to-German mediation has German answers.

The earlier four-card Englisch-10 school cell remains bundled and active.
The Academy cell declares neither `replaces` nor `retired_items`. Its
upstream proposal records four C rows, `keep-active`, without an approved
history transfer; a byte-exact bundled copy pins that proposal and its
legacy source hash. Installing the cell creates no personal cards. Taking
it creates 92 unlearned cards for a learner who has none of its items yet,
while all four earlier card states and their review histories stay
unchanged. Repeating installation and enrolment changes no schedule or
review history. New Tier-2 siblings wait for their atom's initial Tier-1
review under the normal review policy.

Politik und Gesellschaft 10 Realschule is bundled as an additional Academy
cell, version 2026.10.2, with 32 lessons and 64 practice items. Each lesson
has one primary official binding using subject `pug`, grade 10 and its
learning area, with no track restriction. Discovery offers it to I, II,
IIIa and IIIb alike. The four areas contain 6 methods, 8 participation,
10 political structures and 8 political, social and economic action-field
lessons. The knowledge atlas places them under Mensch & Gesellschaft →
Politik und Gesellschaft in the corresponding areas, with one shared
subject hue also used for the official `pug` key.

The published timestamp is fixed and official bindings explicitly set
`exam_relevant: false`. Bloom levels describe the actual retrieval:
recalling facts is level 1, explaining relations level 2, and applying the
percentage or quantity/price model level 3. The tier alone does not decide
the Bloom level. Each item links to its training lesson; all lesson links
form one library topic.

Version 2026.10.2 explicitly withdraws the 42 surplus official bindings
published in .1, which otherwise put all lessons into methods in the school
atlas. The byte-exact .1 fixture is kept as the update regression source.
The 96 identifiers, slugs and all card wording stay unchanged. Bloom
classification corrections declare `materiality: "cosmetic"`, so existing
schedules and review histories stay intact. The update also catches up
withdrawals missed by older kernels even when .2 is already recorded.

The cell declares neither `replaces` nor `retired_items` and replaces no
earlier school cell. Installing it creates no personal cards. Taking it
creates 64 unlearned cards for a learner who has none of its items yet,
without changing existing geography, history or economics evidence.
Repeated installation and enrolment changes no card state or review
history. New Tier-2 siblings wait for their atom's initial Tier-1 review.

Informatik 10 Realschule is bundled as an additional Academy cell, version
2026.10.1, with 36 lessons and 72 practice items. It binds the five elective
IT modules Datennetze II (2.5.2), Objektorientierte Softwareentwicklung
(2.6.2), Logische Schaltungen (2.7.1), Robotik und eingebettete Systeme
(2.7.2), and Künstliche Intelligenz (2.7.3) without a grade or track.
The school chooses when these modules are taught. Curriculum discovery
therefore offers the cell at Realschule IT positions in grades 5 to 10,
under both `it` and `informatik`, across groups. Where only grade-less
modules fit, including grade 10, the generic curriculum importer stays
available alongside the cell.

Every practice item links to its lesson in the training app. The cell
declares neither `replaces` nor `retired_items`; it replaces no earlier
school cell. Installing it creates no personal cards. Enrolling creates
72 unlearned cards and preserves the existing Algorithmen, Datennetze, SQL,
and UML cards and their review histories. Repeating enrolment changes no
card state or review history.

Mathematik 10 has two Fachlehrpläne that differ in content, not only in
depth: Zweig I learns Abbildungen and Logarithmusfunktionen, Zweig II/III
Raumgeometrie and quadratische Funktionen. Its Academy cell therefore binds
each lesson to `I`, to `II_III` or to both, with that branch's own learning
area. It replaces both old school cells of the grade with seven A and nine B
rows and retires nothing (approved 2026-10-22). A B successor keeps the whole
old multi-part question and its whole answer, with the sample solution where
the old card had one, so its history moves with the same `replaces` as an A
row; the approval also covered two B
successors that correct inaccurate details of the old answer.

Chemie 10 also has two Fachlehrpläne with different content: only Zweig I
learns pH and Oxonium concentration, titration, substitution, alkanones and
silicones; only II/III learns electron transfer, Brönsted and the
Redoxanwendungen. Its Academy cell, version 2026.10.1, binds 30 lessons to
`I` and 34 to `II_III`, each with that branch's learning area, and offers
every elective subarea. It replaces both old school cells of the grade with
five A and two B rows (approved 2026-10-24). The nine C rows get no
successor and are not retired: six ask grade-9 content and three
Gymnasium content, so those cards stay active in the libraries that hold
them. The old cells are no longer bundled.

Geschichte 10 has one Fachlehrplan for all Wahlpflichtfächergruppen, so its
Academy cell, version 2026.10.3, binds its 53 lessons (49 core lessons and
four optional English ones) to grade 10 without a track and is offered to
every group. It replaces the old school cell of the grade with two A rows,
the crisis of October 1962 and the date the border opened in 1989, and
retires the two multi-part C cards as `retired_items` (approved
2026-10-25). Both retired cards keep their personal card states and review
histories; they no longer enter the review queue. The old cell is no longer
bundled. On an atom where a learner already holds the moved card, enrolment
adds the two new sibling cards one per enrolment.

BwR 10 is offered only in group II, like BwR 9: the manifest track `wpfg2`
is the only one, and its Academy cell, version 2026.10.2, binds 36 core
lessons to the four grade-10 learning areas with track `II`; its two
optional refreshers (input VAT, percentages "im Hundert") carry only an
Academy binding. It replaces the old school cell of the grade with two A rows,
the Herstellkosten of the Zuschlagskalkulation and the unit contribution
margin db = p − kv, and retires the two multi-part C cards as
`retired_items` (approved 2026-10-25). Both retired cards keep their
personal card states and review histories; they no longer enter the review
queue. The old cell is no longer bundled.

Mathematik 7 is bundled as an additional Academy cell, version 2026.10.1,
with 42 lessons and 126 practice items. Its bindings cover all 42 lessons in
the eight learning areas of Zweig I, and 31 lessons in the six learning
areas of II/III; the latter binding reaches II, IIIa and IIIb. Every card
links to its lesson in the training app. Curriculum discovery offers the
cell as a whole: taking the Academy cell enrols all 126 cards, rather than
filtering them to the learner's branch.

The four earlier Mathematik-7 school cells remain bundled. The published
Academy cell declares neither `replaces` nor `retired_items`; its mapping
proposal has not been approved. Installing or enrolling it leaves all 30
old cards and their review histories untouched and creates the Academy
cards unlearned. Repeating enrolment creates no duplicates and changes no
schedule or review history.

Mathematik 8 has two Fachlehrpläne as well: Zweig I learns the Drehung, space
coordinates, Ungleichungen and lines y = mx + t, Zweig II/III triangles and
Schrägbilder, which Zweig I learnt in grade 7. Its Academy cell binds each
lesson to `I`, to `II_III` or to both, with that branch's learning area. It
replaces the three old school cells of the grade, which were version 1 of
this content and are no longer bundled: nine A and eight B rows pass their
review history to one successor each, seven C cards keep their own history
and stay in active use, and nothing is retired (approved 2026-10-23).

Physik 8 also has two Fachlehrpläne that differ in content: Zweig I learns
Mechanik und Energie, Wärmelehre and Elektrizitätslehre with an elective area
of Astronomie or Akustik, Zweig II/III Mechanik, Optik and Magnetismus und
Elektrizitätslehre. Its Academy cell binds each lesson to `I`, to `II_III` or
to both, and the two elective areas to `lb4.1` and `lb4.2` of `I`. It replaces
the two old school cells of the grade, which held sixteen cards: four pass their
review history to Academy successors, ten retire without transferring mastery,
and two cards of Jahrgangsstufe 9 content stay active unchanged (approved
2026-10-23). The old cells are then no longer bundled, and their review history
stays.

A tile may retire practice items. A retired item keeps its cards and review
history but stops representing its atom: token prerequisites derived from
atom edges move to the item flagged `edge_representative` (else the first
published Tier-1 item, else the lowest published id), and edges that
pointed at the retired item are removed so it cannot block a learner who
never reviewed it.

Different cells may reuse the same atom and some of the same practice items.
Installation status therefore checks every declared atom and item id, while
enrolment status checks personal card coverage of every in-scope atom. Personal
review evidence can later be rebound to a rebuilt central knowledge-base model;
exact successor declarations may preserve it, while ambiguous or materially
changed mappings require real re-retrieval.

# Citations
- [ADR 2026-10-26 — Explicit Withdrawal of Published Curriculum Bindings](../adr/2026-10-26-curriculum-binding-withdrawals.md)
- [ADR 2026-10-19 — ZAM Academy Cells](../adr/2026-10-19-zam-academy-cells.md)
- [ADR 2026-10-14b — Formulas, Images and Spoken Text in Cards](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md)
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- [ADR 2026-10-02 — Library Topics](../adr/2026-10-02-library-topics.md)
- [ADR 2026-10-05 — Learning Cards from Photos and Files](../adr/2026-10-05-learning-cards-from-photos-and-files.md)
- Tests: `tests/kernel/kvt-card-text.test.ts`, `tests/kernel/zam-academy-politik-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-franzoesisch-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-englisch-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-deutsch-realschule-10-cell.test.ts`, `tests/kernel/kvt-attach.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/tier-interaction-bonus.test.ts`, `tests/kernel/publication.test.ts`, `tests/kernel/assignment.test.ts`, `tests/kernel/library-topics.test.ts`, `tests/kernel/postgres-team.test.ts`, `tests/kernel/material-import.test.ts`, `tests/kernel/academy-catalog.test.ts`, `tests/kernel/academy-cells-lock.test.ts`, `tests/kernel/tile-version.test.ts`, `tests/kernel/zam-academy-uml-cell.test.ts`, `tests/kernel/zam-academy-geographie-realschule-9-cell.test.ts`, `tests/kernel/zam-academy-geschichte-realschule-9-cell.test.ts`, `tests/kernel/zam-academy-biologie-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-physik-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-physik-realschule-8-cell.test.ts`, `tests/kernel/zam-academy-mathematik-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-chemie-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-mathematik-realschule-8-cell.test.ts`, `tests/kernel/zam-academy-mathematik-realschule-7-cell.test.ts`, `tests/kernel/zam-academy-it-cells.test.ts`, `tests/kernel/zam-academy-informatik-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-bwr-realschule-9-cell.test.ts`, `tests/kernel/zam-academy-englisch-realschule-9-cell.test.ts`, `tests/kernel/zam-academy-franzoesisch-realschule-9-cell.test.ts`, `tests/cli/curriculum-lehrplanplus-bayern.test.ts`, `tests/cli/academy-sync-script.test.ts`, `tests/kernel/zam-academy-geschichte-realschule-10-cell.test.ts`, `tests/kernel/zam-academy-bwr-realschule-10-cell.test.ts`
- Code: `src/kernel/atlas/weltwissen-seed.ts`, `src/kernel/atlas/palette.ts`, `src/kernel/library/kvt-attach.ts`, `src/kernel/library/bundled-cells.ts`, `src/kernel/library/bonus.ts`, `src/kernel/library/publication.ts`, `src/kernel/library/topics.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/import/material-import.ts`, `src/kernel/library/academy-catalog.ts`, `src/kernel/library/tile-version.ts`, `scripts/sync-academy-cells.mjs`, `src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts`

- [ADR 2026-03-26 — Personal Workflow Foundations](../adr/2026-03-26-personal-workflow-foundations.md)
- [ADR 2026-07-04 — Knowledge Contexts](../adr/2026-07-04-knowledge-contexts.md)
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-09-04 — Team Library on PostgreSQL with Entra](../adr/2026-09-04-team-library-postgres-entra-pilot.md)
- [ADR 2026-07-25 — Shared Curated Learning Content](../adr/2026-07-25-shared-curated-learning-content.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-07-18b — Learning Graph Scope Selectors and the Repo Scope](../adr/2026-07-18b-graph-repo-scope.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/kernel/models/token.ts`, `src/kernel/models/card.ts`, `src/kernel/models/assignment.ts`, `src/kernel/library/revision.ts`, `src/kernel/import/text-import.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/prompter.ts`, `src/kernel/db/schema.ts`, `mobile/src/import.ts`
