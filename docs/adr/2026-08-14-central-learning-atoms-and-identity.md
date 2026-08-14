# Published Learning Atom Identity, 5-Object Model, and SKOS Alignments

**Status:** Accepted (2026-08-14)  
**Date:** 2026-08-14  
**Deciders:** Thomas (project owner)  
**Related:**
[2026-07-26b-central-curriculum-content-service.md](2026-07-26b-central-curriculum-content-service.md) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md) ·
[2026-07-04-hierarchical-domain-ontology-and-token-identity.md](2026-07-04-hierarchical-domain-ontology-and-token-identity.md) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)

---

## Context

ADR [2026-07-26b](2026-07-26b-central-curriculum-content-service.md) established that the central curriculum service delivers content only (anonymous, read-only, CDN-distributed), while all learning state stays on the learner's device.

Subsequent cross-agent design rounds (Gemini, Grok, Codex, Claude Opus) investigated how learning atoms must be identified, linked, and scheduled across diverse state curricula (e.g. LehrplanPLUS Bayern) and global knowledge ontologies (Wikidata, ConceptNet).

Three core architectural challenges required formal resolution:
1. **Published Atom Identity:** A naive composite key `(scheme, entity, reduction)` (PAID) failed because a single curriculum section often contains multiple distinct learning atoms at the same reduction level, producing false equalities.
2. **5-Object Separation:** The existing `tokens` table in the kernel represents a concrete, language-specific practice exercise (question, Bloom level, single prompt), not a language-neutral conceptual learning objective.
3. **Graph Entry & Gating:** Proactive entry gates (preventing a 9th grader from accessing physics until all 1st–8th grade prerequisites are verified) contradict the product principle of lightweight onboarding and frictionless daily practice.

---

## Decision

### 1. Opaque, Namespaced Atom IDs as Published Primary Keys
A published learning atom is identified by an **opaque, namespaced Atom ID**:
- Format: `atom:zam:<namespace>:<slug>` (e.g., `atom:zam:optik:brechung-qualitativ`).
- `<namespace>` is a **subject partition** (`optik`, `bruchrechnung`), never a
  region, school type, or publisher. Those live only on `CurriculumBinding`.
- The Atom ID is immutable and serves as the published anchor across Knowledge Vector Tiles (KVT).
- Didactic reduction levels (`qualitative`, `geometric`, `formal_formula`, `conceptual`, `computational`) are retained as **descriptive profile attributes**, not as parts of the primary key.

**Reuse.** A second curriculum **reuses the existing Atom ID** when the
learning objective is substitutable (same reduction profile, same recall
demand). It adds a `CurriculumBinding`. It mints a new atom only when the
objectives are not substitutable, and may then add a SKOS alignment *between
atoms*. ZAM is the only minter of `atom:zam:*`.

This is the leftover of the rejected PAID join: cross-curriculum equality is
an editorial reuse of one ID, not a computed fingerprint.

### 2. The 5-Object Model
To bridge canonical knowledge, multiple curricula, and personal scheduling, ZAM defines five distinct data entities:
1. **LearningAtom (`atom:*`):** The conceptual, language-neutral learning objective in the universal DAG. Carries prerequisites, typical minimum age, and reduction profile.
2. **ConceptAlignment:** Typed external links using W3C SKOS predicates (`skos:exactMatch`, `skos:closeMatch`, `skos:broadMatch`, `skos:narrowMatch`) to Wikidata Q-IDs or standard vocabularies.
3. **CurriculumBinding:** n:m attachment to official educational standards (e.g. LehrplanPLUS provider, school type, grade, track, topic code, exam relevance flag).
4. **PracticeItem / Token (ULID):** Concrete, language-specific active recall item (question, concept answer, Bloom level, interaction tier: Tier 1 fast check vs. Tier 2 synthesis).
5. **PersonalCard (ULID):** Per-user FSRS-6 scheduling record stored locally in the learner's device database.

### 3. Reactive Scheduling over Proactive Gates (Gate = OFF)
- **No proactive blocking gate:** Unerfüllte Voraussetzungen sperren ein abhängiges Ziel-Token nicht.
- **Precondition Self-Assessment:** Beim ersten Kontakt mit einem Thema kann der Lerner Voraussetzungen einschätzen. Dies setzt **ausschließlich `cards.buried_until`** (und lässt `stability`, `reps` und FSRS-Zustand unverfälscht auf Werkseinstellungen).
- **Ordering Invariant:** Topologie und Fälligkeit steuern die Queue gemeinsam; Topologie wiegt schwerer.
- **Empty Queue Invariant:** Wenn die Queue leerläuft und der Lerner weiterüben möchte, dürfen vergrabene (`buried`) Karten vorgezogen werden.

### 4. Diagnostic Triage is a knob, not a kernel invariant
Today `cascadeBlock` still treats every `Again` as a missing foundation.
Whether to insert a Tier-1 check of the direct prerequisite (pass → keep the
foundation buried; fail → surface it) is a **behavior knob**. Default stays
the current cascade until field `review_logs` show that "foundation intact,
application failed" is common. The rule is cheap to change; it is not an
identity or schema decision.

---

## Consequences

### Positive
- **No False Equivalences:** Opaque Atom IDs prevent unintended cross-curriculum collisions.
- **Curriculum Reuse:** A single canonical atom (e.g. *Optics - Refraction qualitative*) is cleanly bound to multiple grades/tracks (e.g., Realschule Bayern Grade 7 Track I and Grade 8 Track II/III).
- **Zero FSRS Distortion:** Self-assessments merely schedule dates without corrupting memory stability mathematics.
- **Frictionless Entry:** Learners can start in any grade instantly without forced 50-question entrance exams.

### Negative / Trade-offs
- Requires compilers to manage Atom IDs and maintain SKOS alignments explicitly during curation.
- Curation workflows must author both Tier 1 (fast checks) and Tier 2 (synthesis) items for each atom.
