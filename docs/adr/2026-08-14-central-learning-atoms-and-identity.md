# Five-Object Learning Model and Reactive Scheduling

**Status:** Accepted — finalised for the field-test architecture (2026-08-14)\
**Date:** 2026-08-14  
**Deciders:** Thomas (project owner)  
**Final owner amendment:** Every learning state may rebuild its compatibility
with the shared central knowledge base and migrate to its eventual data model.
Personal learning evidence is durable; the compatibility projection is not.\
**Companion decision:**
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md) is accepted
with staged gates: its pilot rules bind now, while its distribution contracts
become mandatory only when content leaves the repository.\
**Related:**
[2026-08-14b-published-atom-identity-and-alignment.md](2026-08-14b-published-atom-identity-and-alignment.md) ·
[2026-07-26b-central-curriculum-content-service.md](2026-07-26b-central-curriculum-content-service.md) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md) ·
[2026-07-04-hierarchical-domain-ontology-and-token-identity.md](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)

---

## Context

ADR [2026-07-26b](2026-07-26b-central-curriculum-content-service.md) established
that the central curriculum service delivers content only — anonymous,
read-only, CDN-distributed — while all learning state stays on the learner's
device.

Cross-agent design rounds (Gemini, Grok, Codex, Claude Opus) plus an owner
round resolved two questions that do not depend on how a published atom is
identified:

1. **What kinds of object exist**, so that an official curriculum section, a
   language-neutral learning objective, a concrete recall task and a personal
   scheduling record stop being conflated.
2. **How a learner enters a large prerequisite graph** without either being
   walled off behind hundreds of unproven foundations or having memory state
   fabricated for them.

The final owner round resolved the remaining compatibility question. The
current four fixtures and their database projection are **pilot data**, not a
public identity contract. A later central knowledge-base model may replace
their identifiers and relationships. Every local learning state may rebuild
that compatibility, provided the migration preserves observed learning
evidence and never invents mastery.

## Decision

### 1. The five-object model

| # | Object | What it is | Identity |
|---|---|---|---|
| 1 | **LearningAtom** | Language-neutral learning objective in the universal DAG. Carries prerequisites, reduction profile, typical minimum age. | opaque canonical identity once publicly released; pilot binding is rebuildable (Decisions 8–9) |
| 2 | **ConceptAlignment** | Typed link to an external vocabulary or another objective. | typed advisory relation; never automatic equality, see 2026-08-14b |
| 3 | **CurriculumBinding** | n:m attachment to an official standard: provider, school type, grade, track, topic code, exam relevance. | `(atom, provider, topic_code, grade, track)` |
| 4 | **PracticeItem / Token** | Concrete, language-specific recall task: question, reference answer, Bloom level, interaction tier. | local ULID; compatibility with a canonical item may be remapped (Decision 9) |
| 5 | **PersonalCard** | Per-user FSRS-6 scheduling record, local to the device. | ULID |

Two conflations are hereby rejected and must not return:

- An official Lernbereich is **not** the smallest learning objective. One
  section routinely decomposes into several atoms.
- A learning objective is **not** the same thing as a concrete question, nor as
  a personal review state. Today's `tokens` row is object 4, not object 2.

`tokens.provider` / `tokens.topic_id` remain as a legacy 1:1 projection of
object 3. They are written deterministically from the full stored binding set
and are scheduled for replacement by binding-based queries.

### 2. Reactive scheduling; no proactive gate

- **No admission gate.** An unmet prerequisite does not bar a dependent token.
  The graph influences *selection and order*, never access.
- **Preconditions are materialised on demand.** Cards are created for the direct
  preconditions of tokens a learner actually encounters — never for the
  transitive hull.
- **Precondition self-assessment sets a date and nothing else.** It writes
  `cards.buried_until` / `buried_reason` only. Never `stability`, `difficulty`,
  `reps`, `state`, or a `review_logs` row. The card stays `new` and FSRS
  cold-starts on first real contact.
- **Every buried card is eventually asked.** The horizon expires, or the learner
  empties the queue and asks for more. Both end in a genuine retrieval.
- **Empty queue.** When the queue runs dry and the learner wants to continue,
  buried precondition cards may be pulled forward.

Rationale: an entry assumption does not need to be *correct*, only cheaply
falsifiable. ZAM already owns the falsifier (`cascadeBlock`), so it can afford a
generous assumption where a placement test would have to be right once.

### 3. Content install never enrols

Installing published content and enrolling a learner are separate operations.
Installation writes atoms, bindings, edges and practice items and creates zero
cards; materialisation is explicit and scoped. A tile may legitimately carry
atoms outside a given learner's curriculum, and they must not become that
learner's cards.

### 4. Diagnostic triage is a knob, not a kernel invariant

`cascadeBlock` currently treats every `Again` as a missing foundation. Whether
to first check the direct prerequisite — pass, keep it buried; fail, surface it
— is a behaviour knob. The default stays the current cascade until field
`review_logs` show that "foundation intact, application failed" is common. The
measurement is the share of failures where the surfaced foundation then passes
first try.

### 5. Topology orders exploration; due dates order retention

The owner's earlier "topology weighs more than due date" was **withdrawn on
2026-08-14** once it became clear it collapsed two opposite orders into one. It
applied to the exploration of new content, not to review.

- **Retention (due cards).** The due date decides **admission and base
  urgency**, and topology never reorders due reviews. It is not a total order:
  the queue applies cross-domain interleaving after sorting by `due_at`, so a
  less overdue card can precede a more overdue one. Whether that interleaver
  earns its place is an open question — the studies behind it tested
  discrimination *within* a domain, not switching between subjects.
- **Acquisition and exploration (new cards).** Topology decides: foundations
  before dependents, and — for optional content — reachability and leverage
  (see below).

Whether a *frontier-first* rule for due reviews (test the most advanced due
node; on success defer its due ancestors within the session) beats plain
due-order remains an untested hypothesis. It is to be settled by replaying
existing `review_logs`, not by argument, and nothing may hard-code it first.

### 6. Optional content may be offered as a bonus

Atoms outside the learner's current curriculum cell — a neighbouring track, a
later grade, another school type — may be **offered**, never scheduled. The
graph decides what is offerable (its hard prerequisites are already held) and
what is worth offering (how much it eases later acquisition).

This is the constructive counterpart to the install/enrol split in Decision 3:
the same out-of-curriculum atom that must never *silently* become a card is
legitimate content the moment the learner chooses it.

**Motivation is curiosity, not acquisition.** Framing knowledge as possession —
a collection whose growth drives the learner — is **rejected**: it conflicts
with the owner's values, and the evidence independently warns against it
(completion-contingent rewards undermine intrinsic motivation, d = −0.36 across
128 studies). A bonus offer therefore never carries a score, a streak, or a
target to reach. It names what the atom connects to and what it eases. See
[central-learning-path-bonus-content.md](../concepts/central-learning-path-bonus-content.md).

### 7. What a PracticeItem is made of

**Language, interaction tier and the structured fast check are substance**, not
presentation. They are persisted (M025) and a change to any of them is a
material revision by default, because a learner who mastered a German binary
check has not thereby mastered an English free recall of the same objective.

A tile is therefore installed and read back without loss; previously the
installer accepted all three and dropped them, so a published item could not be
reconstructed from the database.

**Tier 1 plus Tier 2 per atom is a quality guideline, not a publish
invariant.** An atom may ship with one item. Curation aims for both; nothing
rejects a release that has one.

Corollary for embedded copies: when several tiles carry the same item id, the
copies must be identical. Partial copies made the resulting `content_version`
depend on install order, which a fixture guard now prevents.

### 8. Canonical identity is opaque; pilot identity is provisional

A central knowledge base needs identifiers that do not contain a mutable
taxonomy. Once an identifier is released outside the repository under the
release contract, it is stable and opaque. `namespace` and `slug` remain
readable, mutable addresses beside it.

The current fixtures have **not** crossed that publication boundary. Their
atom and practice-item identifiers are provisional pilot data and may be
replaced when the common central knowledge-base model is available. Code in
this branch must therefore not turn migration between unreleased fixture
versions into a permanent compatibility promise.

| Field | Role |
|---|---|
| `learning_atoms.id` | current local ULID row handle; replaceable as part of a compatibility rebuild |
| `learning_atoms.atom_uri` | eventual canonical identity; `urn:zam:atom:<ulid>` for ZAM-minted atoms, or the publisher's URI for an imported atom |
| `namespace`, `slug` | readable address, **mutable** — renaming breaks no reference |
| alias or migration mapping | explicit evidence that an old identity maps to a new one; never inferred from wording alone |

`atom:zam:<namespace>:<slug>` is withdrawn as a future canonical identity. It
called itself opaque while
putting a subject partition in the primary key, so re-filing an atom under a
better taxonomy would have been an identity migration across every published
tile — the pattern [ADR 2026-07-04](2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
already rejected one level down for tokens. CASE 1.1 makes the same split:
opaque UUID identifiers, a resolvable URI beside them, and subject coverage as
its own `subject`/`subjectURI` attributes.

M026's random rewrite was **removed** rather than made deterministic
(2026-08-15). Checked before deciding: `learning_atoms` first appears in commit
`056fa1b` of 2026-08-14, no tag contains it and neither does `main`, so no
released database can hold the legacy form. The rewrite therefore had an
audience of zero while doing real harm — it minted a fresh `ulid()` per row, so
the same atom acquired unrelated identities on every machine that ran it, and
the resulting id then collided with the fixtures' fixed ids on the next
install. A checkout from that one-day window rebuilds its projection: delete
the database and reinstall. That is the pilot rule of Decision 9, applied to
the first case that needed it.

### 9. Learning-state compatibility is rebuildable

The owner's final decision is:

> Alle Lernstände können die Kompatibilität zur gemeinsamen zentralen
> Wissensbasis neu aufbauen und sich auf ein neues Datenmodell umstellen, sobald
> es verfügbar wird.

This creates a boundary between two kinds of state:

| Durable personal evidence | Rebuildable compatibility projection |
|---|---|
| review events and their timestamps/ratings | atoms and their canonical identifiers |
| card scheduling state derived from real reviews | curriculum bindings and alignments |
| observations and provenance of learner actions | atom and derived token prerequisite edges |
| local history retained for audit | mappings from local items to a knowledge-base version |

A compatibility migration may change identifiers, relationships and even the
physical data model. It must classify every item mapping explicitly:

| Mapping result | Required treatment |
|---|---|
| same practice item | rebind it and preserve its card and history |
| materially revised item | rebind it through the content-revision contract and make it due for genuine re-evaluation |
| split, merge or uncertain match | preserve the old history, but do not transfer mastery automatically; create or surface the new item for a real retrieval |
| withdrawn item | retain audit history and remove it from active learning |

Question equality, slug similarity or embedding proximity may propose a
mapping; none may silently decide it. The final model may keep a stable local
learning-state handle beside a canonical item URI or may migrate references
transactionally; this ADR fixes the safety semantics, not that storage choice.

**Two consequences were built on 2026-08-15**, because both are cheap while the
corpus is four fixtures and unrecoverable afterwards:

- **The declaration has a home.** A tile states succession with `replaces` on a
  practice item, and only that declaration moves a card and its review history
  to a new id. It is recorded in `practice_item_replacements`, which outlives
  the tile that made it. A learner holding a card on both ids is a *merge*: the
  install refuses it, because two retrieval histories cannot become one without
  deciding which counts. The superseded item is deprecated, never deleted —
  every other table referencing a token cascades on delete.

  The question-text check that stood here before was removed. It could not do
  this job: any rewording slipped past it, and Decision 7 had already made
  `language`, `tier` and `fast_check` substance, so two items may legitimately
  ask the same thing.
- **The evidence is sufficient to classify.** `review_logs.content_version`
  records the wording a rating was actually earned on (M027). Without it the
  first row of the table above cannot be checked after the fact: the card holds
  only the current version, so a rating from three revisions ago was
  indistinguishable from one given yesterday. `NULL` means unknown, not
  version 1 — assuming 1 would invent evidence.

### 10. The cell has precedence over generic import

**Decided 2026-08-15.** Where a cell covers a learner's curriculum position,
import goes through that cell. The generic curriculum importer stays, but as
the **fallback for positions no cell reaches yet**. More cells will be
authored, so that remainder shrinks by design.

The reason is what the two paths carry. A cell brings resolved primary
sources, prerequisite edges, an explicit in-scope set and reviewed practice
items with their tier and fast check. A generic import brings extracted topic
text and nothing else — no prerequisites to block on, no grounding to check,
no reviewed wording. Offering both as equals would let the weaker path win by
being the one the learner happened to find first.

This also settles a vocabulary conflict rather than papering over it. Under
provider `lehrplanplus-bayern`, cells record the official learning-area id as
`topic_code` (`65643`), because it is resolvable — it is the last segment of
the source URL, and the content guard checks that every binding's code appears
in the tile's sources. The manifest-driven importer uses its own `lb2` form,
keyed by `schoolType|grade|subject`; the numeric ids are not in that manifest,
so the two cannot simply be mapped. Precedence means the codes rarely meet,
and when they do the cell's is the one that resolves.

Made checkable rather than left as an intention:
`findBundledCellsForScope(scope)` returns the cells covering a position, best
match first, and `needsGenericCurriculumImport(scope)` is what an import
surface asks before offering the wizard. Both read the bundled tiles only — no
database, no enrolment, no side effect.

What this does **not** change: installing a cell still enrols nobody
(Decision 3), and the publication gates in
[2026-08-14b](2026-08-14b-published-atom-identity-and-alignment.md) still
apply. Precedence orders two ingestion paths; it does not widen either.

## Delivery matrix

"Decided" and "built" are not the same claim, and the first version of this ADR
conflated them.

| Decision | Decided | Built | Covered by tests | Empirically validated |
|---|---|---|---|---|
| Five object kinds | yes | yes — `PracticeItem` substance persisted (M025) | yes, round-trip | no |
| Opaque canonical identity | yes | pilot projection only; the M026 rewrite was removed, not replaced | fixtures only | no |
| Rebuildable knowledge-base compatibility | yes | partly — declared succession (`replaces`) and per-review `content_version` are built; the migration contract itself is not | yes, for both built parts | no |
| Cell precedence over generic import | yes | yes — lookup plus the Desktop wizard, the only surface with a generic curriculum path | yes | no |
| Install ≠ enrolment | yes | yes | yes | no |
| No admission gate | yes | yes (never existed) | n/a | no |
| Demand-driven materialisation | yes | yes | yes | no |
| Self-assessment writes only `buried_until` | yes | yes — hard preconditions, finite horizon, Desktop/MCP/Mobile surfaces | yes | no |
| Empty-queue pull-forward | yes | yes — explicit session-local new-card admission plus early review/precondition choices | yes | no |
| Due date orders retention | yes | partly — interleaver reorders within it | no | no |
| Tier-1 before Tier-2 pilot rule | yes | yes — structured fast checks rendered on all learner surfaces | yes | no |
| Bonus offers | yes | yes — eligibility, ranking, accept/ignore surfaces; accepted atoms do not recur | yes | no |
| Diagnostic triage as a knob | yes | default only | n/a | no |

Schema provisioning is now exercised against a real PostgreSQL as well as
SQLite, because `runMigrations` is one path shared by every provider and M024
originally broke it.

The field-test implementation does not make the final empirical column true.
The selected Optik cell has completed the source-grounded multi-agent review
accepted by the owner for initial content and is ready for a manual device
pass. Teacher review remains a later improvement path, not a gate; see ADR
2026-08-14b.

## Consequences

- Learners start in any grade immediately, with no entrance exam and no wall of
  known material.
- A wrong entry assumption costs at most one late card and one detour. It can
  never cost a fabricated memory estimate, because nothing below an observed
  retrieval writes FSRS state.
- One canonical atom binds cleanly to several grades and tracks — Optik is
  required in Realschule Bayern grade 7 (Zweig I) and grade 8 (Zweig II/III),
  which is the same objective at two grades and therefore proof that grade
  belongs to the binding, not to the atom.
- Curation must author practice items per atom. Both tiers are a quality
  guideline (Decision 7), so a release with one item per atom is valid.
- Whether the queue's cross-domain interleaver earns its place inside the
  due-date ordering is an open, replayable question (Decision 5).
- A trusted, bundled repository fixture may support the field test before the
  public release contract exists. It is pilot input, not a public package.
- Changing the central knowledge model may rebuild compatibility state, but it
  never licenses fabricated reviews, copied mastery across an uncertain match,
  or loss of audit history (Decision 9).
- General file/network import and external distribution still require the
  staged contracts in ADR 2026-08-14b.
