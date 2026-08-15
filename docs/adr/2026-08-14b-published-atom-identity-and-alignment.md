# Published Atom Identity and Alignment Semantics

**Status:** Accepted — staged pilot and publication boundaries (2026-08-14)\
**Date:** 2026-08-14  
**Deciders:** Thomas (project owner)  
**Split from:** [2026-08-14](2026-08-14-central-learning-atoms-and-identity.md),
whose five-object model, reactive scheduling and rebuildable-compatibility
invariant remain `Accepted`.\
**Reviews that drive this:**
[Codex-Folgereview](../concepts/central-learning-path-codex-follow-up-review.md) ·
[Opus-Schiedsspruch](../concepts/central-learning-path-opus-arbitration.md)

---

## Context

The first version of ADR 2026-08-14 conflated the field-test model with a public
interchange contract. Review separated them. The owner has now fixed the
boundary: every learning state may rebuild its compatibility with the eventual
shared central knowledge base and migrate to its new data model.

Therefore the four repository fixtures are **trusted pilot input**, not public
packages. Their identifiers and compatibility projection may change. The
decisions below are final in two different senses:

- Pilot rules are binding now and permit a learner-facing field test from
  bundled, commit-controlled fixtures.
- Publication gates are binding before arbitrary file/network import, a second
  publisher, or any tile leaving the repository.

This is a staged decision, not an open ADR. A trigger below may require a new
ADR, but does not reopen the field-test architecture.

## Decision drivers

1. **Publication starts at an explicit boundary.** Pilot rows may be rebuilt;
   an identifier that leaves the repository under a release contract becomes
   another party's data and must be stable.
2. **Classification changes; identity must not.** Subject taxonomies get
   refactored — canonical identity must not encode them.
3. **A wrong equivalence is worse than a missed one.** A missed join costs a
   duplicate or a re-test. A false join can silently transfer learning state
   between objectives that are not substitutable.
4. **The repo rule.** `AGENTS.md`: *IDs are ULIDs, never UUIDs or numeric ids.*
5. **External joinability.** Other publishers and standards should be able to
   point at ZAM atoms without adopting ZAM's taxonomy.
6. **Observed learning evidence is durable.** A compatibility rebuild may
   change catalog identifiers and relationships; it may not fabricate reviews
   or copy mastery across an uncertain mapping.

---

## Question 1 — What identifies an atom? — **decided**

The canonical central model uses an opaque identity separate from mutable
`namespace`/`slug` classification. Once publicly released, that identity is
stable. Before that boundary, repository-fixture IDs are provisional and every
learning state may rebuild its compatibility to the new central model.

This supersedes the claim that M026 already solved migration. Its random ULID
rewrite was removed on 2026-08-15 once the release history was checked: no tag
and not `main` contains `learning_atoms`, so no released database can hold the
legacy form and there was nothing to migrate. The pilot rebuilds that
projection.

Practice-item continuity follows the same boundary, and the same-question check
went with it — text equality cannot establish identity, and Decision 7 had
already made language and tier substance, so two items may legitimately ask the
same thing. Succession is now **declared** by the publisher (`replaces`) and
recorded in `practice_item_replacements`; a full release/migration manifest
supersedes that field later without invalidating what it recorded. The safety
semantics are Decision 9 in
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md).

## Question 2 — What does an alignment mean? — **decided**

### The problem

`skos:exactMatch` between a learning objective and a Wikidata entity is a
category error with a concrete failure mode. Per the
[W3C SKOS Reference](https://www.w3.org/TR/skos-reference/#mapping), mapping
properties relate **concepts in different concept schemes**, and `exactMatch` is
**transitive** and asserts substitutability in information retrieval.

"Explains refraction qualitatively" is not the same kind of thing as the entity
*Snell's law*. Usually the link only says what the objective is **about**. If
that is recorded as `exactMatch`, a later deduplication pass — exactly the kind
of pass a central graph invites — can merge two non-substitutable objectives and
silently move learning state between them. That is the failure the whole
identity debate was about.

### External evidence (verified 2026-08-14)

[schema.org / LRMI](https://schema.org/AlignmentObject) already separates these:

- `AlignmentObject` + `alignmentType` with values **`teaches`**, **`assesses`**,
  `educationalLevel` describes how a resource relates to a node in an
  educational framework.
- schema.org later added **direct `teaches` and `assesses` properties**, and the
  `AlignmentObject` documentation states it *should not* be used where a simple
  property expresses the relation.
- `about` is the schema.org property for subject matter.

### Decision

Split `atom_alignments` three ways, by what the link actually claims:

| Kind | Predicate | Points at | May be used for |
|---|---|---|---|
| **World anchor** | `about` | Wikidata entity, ontology term | search, candidate generation, disambiguation |
| **Concept mapping** | SKOS `exactMatch`/`closeMatch`/… | a concept in a concept scheme, both sides modelled as concepts | vocabulary interop only |
| **Competency alignment** | CASE-style association / `teaches`, `assesses` | another objective or a framework node | curriculum coverage |

**No kind may ever produce automatic atom equality, learning-state transfer or
deduplication.** Reuse of an atom across curricula stays an editorial act with
a named reviewer.

For the pilot, existing entity links are interpreted as `about`, regardless of
the transitional storage spelling. Before any automated matching, external
consumer or public package, storage must distinguish the three kinds above and
carry provenance.

---

## Question 3 — What is the reduction vocabulary? — **decided for the pilot**

`reduction` is a free-text column with no `CHECK`. The fixtures already use
`qualitative`, `geometric`, `formal_formula` **and** `formula`; the accepted ADR
listed only `formal_formula`. One fixture is already outside its own vocabulary
and nothing catches it.

For the one-publisher pilot, `reduction` remains descriptive free text and must
not gate scheduling, equality or compatibility. This avoids freezing an
unresearched vocabulary into data behaviour.

Before a second publisher or the first query that groups by reduction, adopt a
cited controlled vocabulary or document why a ZAM-specific one is necessary,
then validate it. That trigger requires a follow-up ADR; it does not block the
field test.

---

## Question 4 — Which item represents an atom in the token graph? — **decided for the pilot**

Hard atom edges are projected onto practice items. For the pilot, the lowest
stored item id remains the deterministic representative. This is an
implementation placeholder, not a didactic or mastery claim.

The first atom for which that choice changes `held`, bonus eligibility or the
desired prerequisite check ends the deferral. At that point the central model
must name an explicit representative/diagnostic item or replace the projection
rule. No UI may describe "lowest id" as pedagogical meaning.

---

## Question 5 — PracticeItem substance — **decided 2026-08-14**

Resolved by the owner and moved to
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md), Decision 7:
language, interaction tier and the structured fast check **are** PracticeItem
substance, and Tier 1 + Tier 2 per atom is a **quality guideline**, not a
publish invariant. Implemented in M025 with a round-trip test.

## Question 6 — The release and provenance contract — **publication gate**

Identity is necessary but not sufficient. Before any public tile, ZAM needs a
release manifest, artefact digests, publisher and key identity, declarative
removal (a statement withdrawn in v2 must not linger locally), per-row release
provenance, and rollback/rotation rules. The Codex follow-up review specifies
this in detail and it is larger than this ADR.

This becomes its own ADR before the first public package. The Update
Framework's threat model —
rollback, freeze, mix-and-match — is the right checklist, without committing to
TUF as an implementation.

Until then, the only allowed learner-facing source for this spike is bundled,
commit-controlled repository content. A general file picker, arbitrary local
JSON, a network catalog, a second publisher or a tile leaving the repository
crosses the boundary and is blocked by this gate.

---

## Final staging decision

There is no remaining architecture gate before building the bounded field
test. The accepted stages are:

| Concern | Binding pilot rule | Trigger for the next contract |
|---|---|---|
| Identity | Fixture IDs are provisional; compatibility may be rebuilt from an explicit mapping | first public package or external consumer |
| Alignment | Existing entity links mean `about`; no automated equality, deduplication or state transfer | first automated matcher, deduplication pass or external consumer |
| Reduction | Descriptive free text only; it drives no behaviour | second publisher or first grouped query |
| Representative item | Lowest item id, explicitly a deterministic placeholder | first case where that choice changes learner-facing semantics |
| Trust/provenance | Only bundled, commit-controlled fixtures | arbitrary file/network import, second publisher, or an identifier reaching a party who can join against it |
| Cross-package references | Pilot cells may only claim the prerequisite closure they actually encode | first field-test cell that requires a cross-package edge to be pedagogically honest |

The field-test UI may therefore use `installKvtTile` for bundled repository
fixtures. It must not expose the spike as a general import mechanism or imply
that its identifiers are already the shared public catalog.

**Where the boundary actually runs.** Not geography — a bundled tile on a
field-test device has left the repository in every literal sense, and that is
allowed. The trigger is whether an identifier reaches someone who can *join*
against it: a second publisher, an external consumer, a public package. Inside
the pilot we hold both ends of the migration, so a rebuild costs us a rebuild.
Outside it, a rebuild costs somebody else their data.

### Compatibility safety

`cards` and `review_logs` currently reference local `tokens(id)`. The future
central model may preserve that local handle or migrate it transactionally; the
choice is deliberately deferred until the model exists. What is not deferred
is the semantic rule:

- exact mappings preserve card state and history;
- material changes use the content-revision path and require a real re-test;
- ambiguous split/merge mappings preserve history but transfer no mastery;
- no question-, slug- or embedding-similarity heuristic decides silently.

This makes the deferral safe without pretending that today's identifiers are
permanent.

Two of those four are now executable rather than written down (2026-08-15): a
declared `replaces` moves card and history, a card held on both ids is refused
as a merge, and `review_logs.content_version` keeps the evidence a later
classification needs. The rest waits for the migration itself.

### Not deferred

Content correctness reaches the learner immediately. No anchor ships in the
pilot without resolution against its primary source, and the selected cell
needs a subject-matter review. A cell with a known missing prerequisite must be
narrowed or labelled; the absence cannot be hidden behind the future release
contract.

### Required implementation follow-up — **done 2026-08-15**

The two pieces of spike code that lagged behind this ADR were brought in line
before the build phase, together with the two additions the owner approved as
"cheap now, impossible later":

1. ~~Remove M026's random legacy-ID rewrite.~~ Removed outright. The release
   history settled the question: `learning_atoms` exists in no tag and not on
   `main`, so there was never anything to migrate.
2. ~~Remove or relabel the same-question check.~~ Removed, and replaced by the
   publisher's `replaces` declaration, which is what Decision 9 actually needs.
3. `review_logs.content_version` (M027) — the wording a rating was earned on.
4. Practice-item ids are validated as ULIDs on install.

The release/trust ADR remains mandatory at its trigger. That future work does
not reopen the decisions above.

---

## Research tasks worth funding

**R1 — Is there an existing vocabulary for pedagogical reduction?** `reduction`
was invented on this branch. The obvious candidate to evaluate is the **SOLO
taxonomy** (Biggs & Collis): levels of understanding *of the same content*,
independent of age — which is precisely what reduction reaches for, and unlike
Piaget stages it is not developmental. Also worth checking: Webb's Depth of
Knowledge, and whether Bloom already covers enough that a second axis is
redundant. Deliverable: either adopt an existing vocabulary with a citation, or
document why a ZAM-specific one is necessary.

**R2 — Minimum viable release trust.** What is the smallest contract that
survives rollback, freeze and mix-and-match for a single-publisher, anonymous,
read-only CDN? Deliverable: the ADR for question 6.

**R3 — Ordering, by replay not argument.** Foundations-first versus
frontier-first for *due* reviews, measured against existing `review_logs`:
retention, session length, lapses in ancestors. This settles the open question
carried by the accepted ADR, and it is the cheapest of the three.

**R4 — Does an atom need more than one world anchor?** Real competences are
compositional ("refraction *and* light speed *and* a diagram"). One `about` link
per atom may be too few, and a required canonical anchor was already rejected.
Deliverable: a rule for multiple anchors with roles, or evidence that one
suffices.
