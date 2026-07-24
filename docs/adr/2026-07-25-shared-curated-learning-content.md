# Shared Curated Learning Content — Review Once, Serve Many

**Status:** Accepted
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
(repo knowledge → personal tokens; different product surface)

---

## Context

Learning content — atomic cards grounded in a curriculum or a trusted source —
is **expensive to get right** and **cheap to reuse**.

A good card needs:

- grounding in an official or trusted source (e.g. LehrplanPLUS, a textbook);
- atomicity (one recallable unit);
- a fair Bloom level and domain;
- wording a learner can actually answer from memory;
- human judgment about what *must* be remembered vs. looked up.

Teachers (or other domain experts) are uniquely good at that last step. Paying
for their time **once**, then shipping the result to every learner, is far more
efficient than asking every device to regenerate the same material with a large
model on every import.

ZAM already has **device-side** paths that *can* mint content (LehrplanPLUS
wizard + text/agent AI, Learning Content Studio, OKF → token import). Those
paths remain useful for:

- bootstrap and personal notes;
- material that will never be shared;
- experimentation and field tests.

They must not become the **default story** for school curricula that thousands
of learners should share.

### What this is *not*

This ADR is **not** the deferred hierarchical-domain / ontology decision
(titles ADR Open Question 1). That question is about *how tokens are named and
grouped in the graph*. This ADR is about *how shared learning material is
produced, quality-gated, and amortized*.

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

### 2. Quality cost is paid once; value is shared forever

The preferred pipeline for curriculum cards is:

1. **Author or generate** a draft (human, AI-assisted, or hybrid).
2. **Teacher / expert review** — improve wording, prune fluff, fix Bloom level,
   confirm grounding in the official source.
3. **Publish once** into a shared library (or team/school workspace).
4. **Every learner** receives the reviewed tokens and only creates **personal
   cards** (FSRS state) against them.

Step 2 is the expensive step. It must not be re-run for every learner.

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

A teacher-reviewed token appears in many queues only because many cards point
at it — not because the content was duplicated per learner.

### 5. Import wizards stay grounded; they should prefer the library when it exists

LehrplanPLUS-style wizards remain valid to **discover** topics and attach
`source_link`s. When a shared library already holds reviewed cards for a
topic, ZAM should prefer **subscribing / cloning cards** over regenerating
proposals. Exact APIs and UX for that library are out of scope for this ADR;
the principle is binding for future design.

---

## Consequences

### Positive

- Teacher effort scales: one review cycle benefits every class and year.
- Content quality rises without every learner needing a strong LLM or expert
  judgment.
- Device AI stays light (and agent defaults stay cheap) for personal practice.
- Aligns with multi-learner / shared-database work: content is the thing to
  share; FSRS state is not.

### Negative / trade-offs

- Requires publishing, review, and distribution infrastructure that does not
  fully exist yet (central Lehrplan DB / school workspace content packs).
- Until that library is populated, device-side import remains the practical
  path — field tests will still generate drafts locally.
- Editorial process (who may publish, versioning, conflict) needs a later ADR
  once the library surface is designed.
- Risk of over-centralization: personal and experimental content must remain
  easy without a review gate.

### Explicit non-goals (for now)

- Replacing personal card creation or private knowledge bases.
- Forcing ontology/domain hierarchy (still its own ADR).
- Mandating a specific LLM for curriculum drafts.
- Defining the schema of the central Lehrplan database.

---

## Alternatives considered

- **Always generate on device with the strongest available model.** Burns
  quota, produces uneven quality, and re-pays the same cost for every learner.
  Rejected as the *default* for shared curricula.
- **No human review — trust LLM output.** Too unreliable for school-facing
  material; contradicts the product goal of trustworthy active recall.
- **Fold this into the ontology ADR.** Confuses graph structure with content
  economics; keeps both decisions hard to ship. Separated deliberately.
- **Only OKF-style repo imports.** OKF serves *repo* knowledge for ZAM
  developers; school curricula need a different authorship and distribution
  channel (teachers, ministries, publishers).

---

## Status history

| Date | State | Note |
|------|-------|------|
| 2026-07-25 | Accepted | Product principle: learning content is curated shared value; teacher review once, serve many. Distinct from deferred domain ontology. |
