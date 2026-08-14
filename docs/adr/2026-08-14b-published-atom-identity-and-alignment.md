# Published Atom Identity and Alignment Semantics

**Status:** Proposed — open, nothing here is binding  
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

## Question 1 — What identifies a published atom?

### Why the current form is contested

`atom:zam:optik:brechung-qualitativ` puts a subject partition (`optik`) and a
human slug into the primary key. Moving the atom under a better taxonomy, or
renaming the partition, becomes an identity migration across every published
tile and every third party that stored the string.

**This project already decided this exact question one level down.**
[ADR 2026-07-04](2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
rejected `(domain, slug)` as token identity because it *"bakes classification
into identity: every taxonomy refactor changes identities and breaks
references"*, and chose ULID as identity with `(domain path, slug)` as the
**address**. The atom ID reintroduces the rejected pattern at the atom level.

### External evidence (verified 2026-08-14)

[CASE 1.1](https://standards.1edtech.org/case/) is the closest established
analogue — an interchange standard for competency and standards frameworks,
already named in the research document as the right *adapter* format.

- CFItem identifiers are **UUIDs** (8-4-4-4-12, lower case), i.e. opaque. The
  best-practice guide pairs the opaque `identifier` with a separate resolvable
  `uri` such as `https://case.example.edu/ims/case/v1p0/CFItems/{uuid}`.
- CASE **1.1 added `subject` and `subjectURI` attributes to CFItem** so that
  subject coverage can be annotated. Subject classification is therefore
  explicitly metadata *beside* the identifier in the standard that has faced
  this problem longest.

*(Not verified and therefore not relied on here: the full `CFAssociationType`
enumeration. The spec section exists; the list was not readable in the fetched
document.)*

### Options

| Option | Identity | Verdict |
|---|---|---|
| **A. Status quo** — `atom:zam:<namespace>:<slug>` | semantic string | Legible in diffs, but classification is identity. Contradicts ADR 2026-07-04 and the repo ULID rule. |
| **B. ULID row id + opaque published URI** | ULID; `urn:zam:atom:<ulid>` published | Satisfies the repo rule and CASE's pattern. Namespace and slug become mutable attributes, with an alias table for former addresses. Costs legibility in raw tiles. |
| **C. Content hash** | digest of the atom profile | Self-verifying, but *any* correction mints a new identity — the opposite of what an atom ID is for. Rejected. |

### Recommendation (not a decision)

**Option B**, and now rather than later:

```
learning_atoms.id         ULID        row identity; FKs, edges, bindings
learning_atoms.atom_uri   TEXT UNIQUE published identity, urn:zam:atom:<ulid>
learning_atoms.namespace  TEXT        descriptive, mutable
learning_atoms.slug       TEXT        human address, mutable
atom_uri_aliases          (alias, id) former published identities
```

The cost today is four fixtures and one migration on a branch. The cost after
the first public tile is every consumer that stored the string.

---

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

## Question 5 — Is Tier 1 + Tier 2 per atom an invariant or a guideline?

The original ADR listed authoring both as a consequence; code and fixtures
frequently ship one. It must be one or the other: a checkable publish invariant,
or a quality guideline. Not both.

---

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
