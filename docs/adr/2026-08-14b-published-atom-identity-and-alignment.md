# Published Atom Identity and Alignment Semantics

**Status:** Proposed — open, nothing here is binding, **except questions 1 and
5, which are decided and moved to 2026-08-14**  
**Date:** 2026-08-14  
**Deciders:** Thomas (project owner)  
**Split from:** [2026-08-14](2026-08-14-central-learning-atoms-and-identity.md),
whose decided parts (five-object model, reactive scheduling) remain `Accepted`.  
**Reviews that drive this:**
[Codex-Folgereview](../concepts/central-learning-path-codex-follow-up-review.md) ·
[Opus-Schiedsspruch](../concepts/central-learning-path-opus-arbitration.md)

---

## Context

The first version of ADR 2026-08-14 decided three things at once: the
five-object model, reactive scheduling, and how a published learning atom is
identified and linked to the outside world. The first two survived review. The
third did not, and shipping it as `Accepted` would freeze open questions into
long-lived published data.

What is implemented today, and contested:

- `learning_atoms.id` is `atom:zam:<namespace>:<slug>`, e.g.
  `atom:zam:optik:brechung-qualitativ`. The ADR called this opaque. It is not:
  the installer validates its parts and the practice-item address is derived
  from it.
- `atom_alignments.alignment_type` holds SKOS mapping predicates
  (`skos:exactMatch`, `skos:closeMatch`, …) pointing from a *learning objective*
  to a *Wikidata entity*.

Both must be settled before any tile is published outside the repository,
because both become other people's data the moment they are.

## Decision drivers

1. **A published identifier is forever.** Local rows can be migrated; strings
   that shipped in a CDN artefact and were joined against by a third party
   cannot.
2. **Classification changes; identity must not.** Subject taxonomies get
   refactored — that is their purpose.
3. **A wrong equivalence is worse than a missed one.** A missed join costs a
   duplicate card. A false join silently transfers learning state between
   objectives that are not substitutable.
4. **The repo rule.** `AGENTS.md`: *IDs are ULIDs, never UUIDs or numeric ids.*
5. **External joinability.** Other publishers and standards should be able to
   point at ZAM atoms without adopting ZAM's taxonomy.

---

## Question 1 — What identifies a published atom? — **decided 2026-08-14**

Resolved as recommended (Option B) and moved to
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md), Decision 8:
ULID row identity, opaque `atom_uri`, mutable `namespace`/`slug`, alias table
for former addresses. Implemented in M026.

Pulled forward rather than deferred because the cost only grows: four fixtures
today, every consumer that stored the string later. The reasoning, the CASE 1.1
evidence and the rejected options are preserved in Decision 8.

## Question 2 — What does an alignment mean?

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

### Recommendation (not a decision)

Split `atom_alignments` three ways, by what the link actually claims:

| Kind | Predicate | Points at | May be used for |
|---|---|---|---|
| **World anchor** | `about` | Wikidata entity, ontology term | search, candidate generation, disambiguation |
| **Concept mapping** | SKOS `exactMatch`/`closeMatch`/… | a concept in a concept scheme, both sides modelled as concepts | vocabulary interop only |
| **Competency alignment** | CASE-style association / `teaches`, `assesses` | another objective or a framework node | curriculum coverage |

**No kind may ever produce automatic atom equality or deduplication.** Reuse of
an atom across curricula stays an editorial act with a named reviewer.

Practical consequence: today's Wikidata links become `about` — which is what
they always were.

---

## Question 3 — What is the reduction vocabulary?

`reduction` is a free-text column with no `CHECK`. The fixtures already use
`qualitative`, `geometric`, `formal_formula` **and** `formula`; the accepted ADR
listed only `formal_formula`. One fixture is already outside its own vocabulary
and nothing catches it.

Open: fix the vocabulary and add a `CHECK`, or model it as a controlled
vocabulary table with its own provenance. See research task R1 — the vocabulary
may not need to be invented.

---

## Question 4 — Which item represents an atom in the token graph?

Hard atom edges are projected onto practice items. The representative is
currently the lowest stored item id: deterministic, order-independent, and
didactically meaningless. The model owes an explicit representative or
diagnostic item, or a stated rule for why any item may stand for the atom.

---

## Question 5 — PracticeItem substance — **decided 2026-08-14**

Resolved by the owner and moved to
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md), Decision 7:
language, interaction tier and the structured fast check **are** PracticeItem
substance, and Tier 1 + Tier 2 per atom is a **quality guideline**, not a
publish invariant. Implemented in M025 with a round-trip test.

## Question 6 — The release and provenance contract

Identity is necessary but not sufficient. Before any public tile, ZAM needs a
release manifest, artefact digests, publisher and key identity, declarative
removal (a statement withdrawn in v2 must not linger locally), per-row release
provenance, and rollback/rotation rules. The Codex follow-up review specifies
this in detail and it is larger than this ADR.

**This should become its own ADR.** The Update Framework's threat model —
rollback, freeze, mix-and-match — is the right checklist, without committing to
TUF as an implementation.

---

## Sequencing decision (2026-08-14): deliberately deferred

**Everything still open in this ADR waits until distribution, by decision, not
by neglect.** The owner's direction is a runnable product first: without
something a learner can use there is no feedback, and without feedback no
evolutionary development. These questions do not block building — they block
publishing.

Recorded here so the next round does not renegotiate what is deliberately
waiting.

| Open item | Why it can wait | What ends the deferral |
|---|---|---|
| Alignment semantics (Q2) | Links are advisory today; nothing dedupes atoms automatically, so a wrong `exactMatch` cannot yet move learning state | The first automated matching or dedup pass, or the first external consumer of the links |
| Reduction vocabulary (Q3) | A free-text field with no `CHECK` costs nothing while one team writes the tiles | A second publisher, or the first query that groups by reduction |
| Representative item (Q4) | "Lowest item id" is deterministic and order-stable; it is imprecise, not wrong | An atom whose items differ enough that the choice changes what "held" means |
| Release, trust, provenance (Q6) | A tile installed from our own repo onto our own device needs no signature, manifest or rollback | The first tile that leaves the repository |
| Cross-package references | Painful but visible: it blocks modelling one prerequisite in the reference cell, and everybody knows | A cell whose prerequisites genuinely span subjects and must ship |
| Codex acceptance tests 5–9, 14–15 | All stand on the two contracts above | Those contracts |

**What makes the deferral safe rather than merely convenient**, checked against
the schema: `cards` and `review_logs` reference `tokens(id)`, never `atom_id`.
Learner history hangs on the practice-item ULID alone. Everything deferred here
touches published *content* identity and shape — none of it can reach a
learner's FSRS state.

The one identifier that would be expensive is therefore frozen, and enforced
rather than merely written down: a published practice-item id is never
re-minted (Decision 8; `installKvtTile` refuses a republished question under a
new id).

**What is not deferred:** content correctness. A wrong anchor or a wrong
curriculum reference reaches the learner directly, and no contract above
protects against it. The working rule stands — no anchor without resolution
against its primary source.

## Sequencing

1. **Questions 1 and 2 first.** Everything published carries their consequences,
   and both are cheap while the data is four fixtures.
2. **Questions 3–5** can follow; they are schema hygiene once the vocabulary and
   representative rules are named.
3. **Question 6 as its own ADR**, required before anything leaves the
   repository, not before further kernel work.

Until questions 1 and 2 are decided, `installKvtTile` stays a spike and no
learner feature builds on it.

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
