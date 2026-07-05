# Learning Governance: Assignments, Time, Decline, Coverage, and Audit

**Status:** Proposed (note only)
**Date:** 2026-07-05
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-04-knowledge-contexts.md](2026-07-04-knowledge-contexts.md) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md) ·
[2026-03-26-personal-workflow-foundations.md](2026-03-26-personal-workflow-foundations.md)

---

## Why this note exists

The knowledge-context decision answers *in whose world knowledge is relevant*.
It deliberately does not answer who may require learning, when it should happen,
how much paid time is available, what a team may see, or how compliance is
audited. Those concerns need one coherent governance model rather than being
smuggled into context, cards, or FSRS ratings.

This note captures the questions exposed by a DocuWare apprentice who is at once
an employee, vocational-school student, private learner, and member of a team
that needs deliberate expertise coverage.

## Working vocabulary

- **Curriculum:** a versioned body of learning objectives published by a
  provider or organization.
- **Learning assignment:** a relationship saying who should learn which
  curriculum/objectives, issued by whom, with priority, timing, and obligation
  level.
- **Active situation:** the learner-selected situation used to choose eligible
  and prioritized assignments. It may have a per-device default.
- **Learning state:** the learner's private card, FSRS history, and review
  evidence.
- **Coverage objective:** knowledge a team needs collectively, including named
  focus owners, universal baseline knowledge, and minimum redundancy.
- **Completion evidence:** the smallest reportable fact that an assignment or
  mandated assessment was completed. It is not the learner's private review log.

## Candidate principles

1. **Context, assignment, and learning state stay separate.** The same token may
   satisfy several curricula or assignments through one learner-owned card and
   one FSRS history.
2. **Working-time policy affects eligibility and priority.** In the initial
   DocuWare scenario, company learning is prioritized, vocational-school
   learning remains eligible, and private learning is excluded. A later policy
   may reserve a percentage of paid time for private learning as an incentive.
3. **Situation is explicitly selectable.** A company laptop may default to the
   DocuWare situation and still be switched at home. Device defaults are hints,
   not access-control decisions.
4. **Recall ratings remain 1–4.** Rating 1 means "I intend to know this but did
   not recall it." Declining an optional item is a separate action, shown
   compactly as `-`, and records a personal token suppression so optional
   automation does not repeatedly recreate the same unwanted learning item.
   Obvious mandatory content does not offer `-`.
5. **Automation can satisfy the operational need without faking retention.** A
   script or agent execution never advances FSRS. It may make an optional
   learning assignment unnecessary and provide a reason to decline it.
6. **Mandatory does not mean forced cognition.** A learner can refuse a
   mandatory assignment, but refusal cannot hide the obligation or appear as
   completion. Consequences belong to the issuing organization, not to FSRS.
7. **Reporting is purpose-limited.** A manager or auditor may receive explicit
   assignment/completion evidence needed for team operation, ISO, SOC, or other
   certifications. Individual answers, failures, response times, and private
   review logs remain private unless a later, explicit policy proves they are
   necessary.
8. **Team coverage is not uniformity.** A team may require knowledge every
   member needs, named focus areas for particular people, and a minimum number
   of maintainers so no domain depends on one person. Team-visible plans show
   required coverage and responsibility, not the learner's private recall
   stream.
9. **Classified sources control portability.** Public-resource links ground
   portable world knowledge. Team repositories, internal Confluence pages, and
   comparable organization-only resources ground confidential knowledge. When
   organization membership ends, access to those sources and their confidential
   derived data disappears. Useful publicly grounded world knowledge remains.

## Example policy outcomes

- A helpdesk task reveals a knowledge gap. ZAM may create an optional DocuWare
  learning assignment automatically.
- At review time the learner can rate 1–4, or decline it. Decline suppresses
  repeated optional re-creation.
- If a script now performs the task, the learner may decline the associated
  knowledge without the script being counted as human mastery.
- A quarterly People & Culture quiz can be mandatory. ZAM records completion
  evidence visible to defined managers/auditors, while ordinary recall details
  remain private.
- A team can require two active maintainers for a product domain and assign a
  focus owner without requiring every member to learn every token.

## Open questions before an ADR can be accepted

1. Which obligation levels are needed: optional, recommended, required, and
   regulated/attested — or a smaller set plus policy metadata?
2. What counts as completion evidence for mandatory content: viewed material,
   passed quiz, attestation, demonstrated work, or issuer-defined evidence?
3. Who can see named assignments, completion state, overdue state, and aggregate
   coverage? How long is that evidence retained, and can access be revoked?
4. How does a team prove sufficient current expertise without exposing private
   FSRS history: learner attestation, observed work, assessment, certification,
   or opt-in aggregate?
5. How are paid learning-time budgets recorded and enforced? Is time tracking
   manual, inferred from sessions, imported from another system, or explicitly
   outside ZAM?
6. How is source confidentiality stored or inferred, how are mixed/public and
   confidential sources handled, and what exactly is purged on membership loss:
   tokens, sources, embeddings, cards, review logs, session evidence, backups,
   and sync replicas?
7. When an operational goal implies a learning need, may policy create the
   assignment automatically, or must a learner/manager confirm it first?
8. Where do governance records live: organization workspace, sync service,
   learner device, or a deliberately split model by data class?

## Relationship to current architecture

- The kernel stays AI-agnostic; policy evaluation belongs in kernel logic only
  where it is deterministic and local.
- Authentication, organization roles, sync, and auditor authorization stay in
  the CLI/service layer defined by the multi-learner work.
- Cards remain per-user learning state. Assignments and completion evidence must
  not be squeezed into cards or review ratings.
- Goals remain git-tracked outcomes. They may propose assignments, but completing
  a goal and retaining knowledge are different facts.

## Delivery

No implementation is authorized by this note. Before acceptance, work through
the open questions with at least three personas: a voluntary private learner, a
DocuWare apprentice with mixed school/work obligations, and an employee taking
regulated mandatory training. Then write a phased implementation plan on one
feature branch.
