# Shared Curated Learning Content — Create Once, Improve Continuously, Serve Many

**Status:** Accepted; process intent clarified 2026-08-15
**Date:** 2026-07-25
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-30-learning-content-studio.md](2026-06-30-learning-content-studio.md)
(personal cards and bulk import) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)
(curriculum import as a device-side pipeline today) ·
[2026-07-04-knowledge-contexts.md](2026-07-04-knowledge-contexts.md)
(work / school / private worlds; curriculum ≠ context) ·
[2026-07-04-human-friendly-titles-and-prefixed-domains.md](2026-07-04-human-friendly-titles-and-prefixed-domains.md)
(Open Question 1: hierarchical domains / ontology — *structure*, not this ADR) ·
[2026-07-12a-agent-backed-ai-provider.md](2026-07-12a-agent-backed-ai-provider.md)
(personal AI for recall and assistance; not the path for canonical curricula) ·
[2026-07-18-okf-learning-import.md](2026-07-18-okf-learning-import.md)
(repo knowledge → personal tokens; different product surface) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)
(**implements this principle for a closed group**: editorial workflow,
content versioning, privacy and deployment — it supplies the "central
library schema" this ADR lists as a non-goal)

> **Owner clarification (2026-08-15):** The curation sequence below describes
> how shared content can improve over time. It is not a teacher-approval gate
> for building, field-testing or publishing initial content. Source-grounded
> agents may create the first useful version to the best of their knowledge;
> teachers and other experts can improve later revisions. Coverage of Bavarian
> curricula comes first, while other curricula and school notes should map to
> the same knowledge wherever their substance matches.

---

## Context

Learning content — atomic cards grounded in a curriculum or a trusted source —
is **expensive to get right** and **cheap to reuse**.

A good card benefits from:

- grounding in an official or trusted source (e.g. LehrplanPLUS, a textbook);
- atomicity (one recallable unit);
- a fair Bloom level and domain;
- wording a learner can actually answer from memory;
- editorial judgment about what *must* be remembered vs. looked up.

Teachers and other domain experts can contribute particularly valuable
classroom and didactic judgment. When that expertise becomes available, its
improvements should be made **once** and then shared with every learner. Its
absence does not prevent a source-grounded agent-produced first version.

There is a second, practical cost: **time**. Device-side generation of learning
cards (curriculum text → many atomic proposals via local, cloud, or agent
LLMs) is **slow** today — often minutes of wait while the model decomposes a
topic, and longer still for agent-backed harnesses (process start + framing).
Learners and teachers experience that wait on every import of the *same*
official topic. A central library turns "generate cards" into "attach me to
already-published tokens," which is a database operation and should feel
**near-instant**.

ZAM already has **device-side** paths that *can* mint content (LehrplanPLUS
wizard + text/agent AI, Learning Content Studio, OKF → token import). Those
paths remain useful for:

- bootstrap and personal notes;
- material that will never be shared;
- experimentation and field tests;
- filling gaps until the shared library covers a topic.

They must not become the **default story** for school curricula that thousands
of learners should share.

### What this is *not*

This ADR is **not** the deferred hierarchical-domain / ontology decision
(titles ADR Open Question 1). That question is about *how tokens are named and
grouped in the graph*. This ADR is about *how shared learning material is
produced, improved, and amortized*.

Ontology and curation may meet later (a shared library still needs stable
identity and domains), but they solve different problems:

| Concern | Question | Where |
|---------|----------|--------|
| **Ontology / identity** | How is a concept named, nested, and linked? | Deferred hierarchical-domain ADR |
| **Curation & distribution** | Who authors quality content, who reviews it, who reuses it? | **This ADR** |
| **Knowledge context** | In whose *world* is this relevant (work / school / private)? | ADR 2026-07-04 knowledge contexts |
| **Personal FSRS state** | What has *this* learner practised? | Cards (kernel); always per-user |

---

## Decision

### 1. Shared curriculum content is a first-class product asset

Canonical learning material for a curriculum (school subjects, grades, topics)
is treated as **shared infrastructure**, not as disposable LLM output on each
device. A central (or workspace-published) **Lehrplan / content library** is the
intended long-term source of truth for that material.

### 2. Improvement cost is paid once; value is shared forever

The preferred pipeline for curriculum cards is:

1. **Author or generate** a source-grounded draft (agent, human, or hybrid).
2. **Check what can be checked now** — source resolution, scope, internal
   consistency and multi-agent review.
3. **Publish the current best version** into a shared library (or team/school
   workspace).
4. **Improve continuously** when learners, teachers or other experts report
   errors or better formulations; publish those changes as explicit revisions.
5. **Every learner** reuses the shared tokens and creates only **personal
   cards** (FSRS state) against them.

The work in steps 1–4 is shared rather than repeated on every device. This is a
target process for scaling quality, not a requirement that every item pass a
specific human role before learners may use it.

### 3. Device-side AI remains for personal work, not for canonical curricula

Local models, cloud API keys, and **agent-backed** harnesses (ADR 2026-07-12a)
excel at **personal** jobs: recall feedback, discussion, OCR of a worksheet,
personal notes, one-off imports. Defaults stay **cheap** models so everyday
use does not burn subscription quota.

**Not required by this ADR (and deferred):** routing Lehrplan import through
frontier models by default. If a large model is used for draft generation, that
is a **publishing-side** choice, not something every pupil's laptop must repeat.

### 4. Tokens are shared; cards stay personal

This restates the kernel model with product emphasis:

- **Token** = shared concept (question, concept text, domain, source link, …).
- **Card** = per-user scheduling state.

A shared token appears in many queues only because many cards point at it — not
because the content was duplicated per learner. Its provenance and revision
history show how it was produced and improved.

### 5. Import wizards stay grounded; they should prefer the library when it exists

LehrplanPLUS-style wizards remain valid to **discover** topics and attach
`source_link`s. When a shared library already holds source-grounded cards for a
topic, ZAM should prefer **subscribing / cloning cards** over regenerating
proposals — both for quality and so import completes in **seconds, not
minutes**. Exact APIs and UX for that library are out of scope for this ADR;
the principle is binding for future design.

### 6. Generation cost is amortized at publish time, not at learn time

If AI assists drafting, that run happens on the **publisher** side (agent batch,
teacher tooling, editorial pipeline, or a one-time job), not on the critical
path of every learner's "Import curriculum" click. Learner import of covered
topics is library attach + card creation, not LLM generation.

---

## Consequences

### Positive

- Any later teacher or expert effort scales: one improvement benefits every
  class and year.
- Content quality rises without every learner needing a strong LLM or expert
  judgment.
- **Import latency drops**: covered topics attach from the library instead of
  waiting on multi-minute LLM/agent card generation on the device.
- Device AI stays light (and agent defaults stay cheap) for personal practice.
- Aligns with multi-learner / shared-database work: content is the thing to
  share; FSRS state is not.

### Negative / trade-offs

- A mature library benefits from publishing, review, and distribution
  infrastructure that does not fully exist yet (central Lehrplan DB / school
  workspace content packs); this does not block bundled or otherwise controlled
  first versions.
- Until that library is populated, device-side import remains the practical
  path — field tests will still generate drafts locally **and still wait on
  generation** for uncovered topics.
- Editorial process (who may publish, versioning, conflict) needs a later ADR
  once the library surface is designed.
- Risk of over-centralization: personal, experimental and early shared content
  must remain easy without mandatory expert approval.

### Explicit non-goals (for now)

- Replacing personal card creation or private knowledge bases.
- Forcing ontology/domain hierarchy (still its own ADR).
- Mandating a specific LLM for curriculum drafts.
- Defining the schema of the central Lehrplan database.

---

## Alternatives considered

- **Always generate on device with the strongest available model.** Burns
  quota, produces uneven quality, re-pays the same cost for every learner, and
  keeps import **slow**. Rejected as the *default* for shared curricula.
- **Publish raw, ungrounded model output.** Too unreliable for school-facing
  material. Rejected in favour of named sources, automated checks, multi-agent
  scrutiny and explicit revisions. This does not imply mandatory human review.
- **Fold this into the ontology ADR.** Confuses graph structure with content
  economics; keeps both decisions hard to ship. Separated deliberately.
- **Only OKF-style repo imports.** OKF serves *repo* knowledge for ZAM
  developers; school curricula need a different authorship and distribution
  channel (teachers, ministries, publishers).

---

## Status history

| Date | State | Note |
|------|-------|------|
| 2026-07-25 | Accepted | Product principle: learning content is curated shared value; improvement effort is shared rather than repeated per learner. Distinct from deferred domain ontology. |
| 2026-07-25 | Accepted (amended) | Co-equal motivation: central library removes multi-minute device-side generation from learner import — quality *and* speed. |
| 2026-08-15 | Accepted (clarified) | Source-grounded agents may publish the initial version. Teacher/expert input is a later improvement process, not a build, field-test or publication gate. Coverage proceeds Bayern-first; other curricula and school notes map to shared knowledge where possible. |
