# Knowledge Contexts: Work, School, Private

**Status:** Implemented (2026-07-05)
**Date:** 2026-07-04
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-04-human-friendly-titles-and-prefixed-domains.md](2026-07-04-human-friendly-titles-and-prefixed-domains.md)
(Decision 7, Open Question 4) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)
(data classes / sharing circles) ·
[2026-07-04-hierarchical-domain-ontology-and-token-identity.md](2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
(seed note — decided there: contexts stay orthogonal, never absorbed)

---

## Context

One learner, several lives. The same knowledge base currently holds DocuWare
COPS platform knowledge (authored in **English** by explicit decision — an
8-nationality team should be able to read it), German school curricula for
the family, and private interests. Today these worlds are distinguishable
only by *guessing from domain names* (`axon-ivy` is probably work,
`Deutsch` is probably school).

Three recent decisions all tripped over this missing notion:

1. **Language** (titles ADR, Decision 7): `system.locale` had to be demoted
   from "mandate" to "default" because the COPS area is deliberately
   English. The *rule* ("this area is English") currently lives nowhere —
   it exists only as owner intent.
2. **Sharing** (multi-learner ADR): a context is a useful library slice, but it
   is not an authorization boundary. The publishing workspace and classified
   source determine who may receive content; tagging something `DocuWare` must
   never make it shareable by itself.
3. **Graph overview**: the graph is getting crowded; the coarsest useful
   filter ("show me only work") is not expressible.

Domains cannot carry this cleanly: a domain is a **subject area**
(`mathematik`, `kubernetes`), and subjects are context-ambiguous — math can
be school *and* work. Overloading domains with context semantics is exactly
the kind of implicit convention the titles ADR just removed for prefixes.

The hierarchical-ontology ADR (seed note) may eventually restructure
domains entirely; whatever we do here must be **small, additive, and
forward-compatible** with that outcome.

### Worked persona: a DocuWare apprentice

An apprentice may be all of these at the same time:

- a DocuWare employee working in IT helpdesk or first-/second-level support;
- a vocational-school student following an official curriculum provider;
- a private learner pursuing goals at home;
- a member of a DocuWare team whose operational goals can create new learning
  needs.

The corresponding material need not live in one repository. Personal and
vocational-school goals may live in `zam-personal`; company goals and curricula
may live in a DocuWare team workspace; a school could later publish its own
workspace. Work tasks can also produce knowledge that belongs to the DocuWare
world even when no curriculum prescribed it in advance.

This persona exposes several independent questions that **context alone must
not answer**:

| Dimension | Question it answers |
|-----------|---------------------|
| Knowledge context | In whose world is this relevant: DocuWare, vocational school, private? |
| Curriculum | Which structured body of learning objectives is offered or required? |
| Learning assignment | Who says this learner should learn which objectives, with what priority or due date? |
| Goal | What outcome should an individual or organization achieve? A goal may imply learning assignments, but is not itself one. |
| Workspace/repository | Who owns and versions the goal, curriculum, rules, or process? |
| Access policy | From which workspace, device, network, or place may material be read or practised? |
| Active situation | Which learning is appropriate now, for example during DocuWare working time or at home? |
| Learning state | What has this learner personally reviewed, forgotten, or mastered? |

`Learning assignment` is a Phase 0 working term, not yet a schema decision. It
can represent a self-chosen commitment, an employer assignment, or a later
school/teacher assignment while preserving who issued it. The active situation
may prioritize assignments, but it must not change token identity or ownership
silently.

## Decision drivers

1. **Make existing owner intent explicit** — "COPS is English" and "this
   knowledge is relevant to vocational school" should be data, not memory.
   Sharing policy remains with the publishing workspace/source.
2. **Orthogonality** — context (whose world) ⊥ domain (which subject).
3. **Smallest additive change** — no identity changes, no domain
   restructuring, no schema churn ahead of the ontology ADR.
4. **Sync-ready without becoming access control** — the multi-learner service
   may filter a library by context, while the publishing workspace and source
   classification still govern visibility.
5. **Graceful absence** — tokens without a context behave exactly like
   today; single-context users never need to see the feature.

## Options considered

| Option | Shape | Verdict |
|--------|-------|---------|
| **A. Context = top domain level by convention** (`work/…`, `school/…`) | No schema change; reuses the `/` separator | Conflates context with subject taxonomy (`work/mathematik` vs `school/mathematik` duplicates subjects under two roots); no place to attach attributes like language; a rename-only convention — rejected; the ontology ADR has since ruled out absorbing contexts into domain paths. |
| **B. `contexts` table + token↔context assignment** | Context as a small first-class facet with attributes such as language | Additive, one M-migration; attributes have a home; graph and sync filtering become explicit without granting access. **Chosen — in the n:m variant (owner decision):** a `token_contexts` join table instead of a single FK, so a token can live in several worlds (`git` at work AND privately). |
| **C. Settings-only mapping** (domain-prefix → language in `settings`) | Zero schema | Solves only the language symptom; invisible to graph and sync filtering; another implicit convention. Rejected. |

## Decision

**1. Introduce `contexts` as a small first-class entity.**

```sql
CREATE TABLE IF NOT EXISTS contexts (
  id         TEXT PRIMARY KEY,            -- ULID
  name       TEXT NOT NULL UNIQUE,        -- "work-docuware", "school", "private"
  label      TEXT,                        -- display name, Unicode
  language   TEXT,                        -- BCP-47 ("en", "de"); NULL = system.locale
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

plus an n:m assignment table (idempotent M-series migration; the `tokens`
table itself is untouched):

```sql
CREATE TABLE IF NOT EXISTS token_contexts (
  token_id   TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  PRIMARY KEY (token_id, context_id)
);
```

A token with no context rows behaves exactly like today. **Multiple
contexts per token are allowed** (owner decision) — the shared-concept
case (`git` at work and privately) is modeled directly instead of via
per-context duplicates. Ambiguity is resolved by three fixed rules:

- **Filtering is OR:** a token appears in every context it belongs to.
- **Language: content wins.** A context's `language` is only the *default
  for new generation*, and there the **active context** of the operation
  (the machine-local per-device default or the
  `--knowledge-context` flag) decides; existing tokens
  keep their established content language (titles ADR Decision 7) — doctor
  tasks never translate on the basis of a context alone.
- **Context never grants access:** publishing and portability follow the
  classified source and publishing workspace. A public source link denotes
  public knowledge; a team repository, internal Confluence page, or comparable
  organization-only source denotes confidential knowledge. If sources disagree
  or classification is absent, sharing fails closed until an authoritative
  public source grounds a portable version.

**2. Context is orthogonal to domain.** A token's domain stays the subject
(`mathematik`); its context says whose world it belongs to (`school`).
Nothing about slugs, identity, or domain names changes.

**3. Language resolution becomes explicit:** generation paths (curriculum
import, title generation, `zam doctor titles`) use
`context.language ?? system.locale`. This turns the COPS-is-English rule
from owner memory into data, and completes titles-ADR Decision 7.

**4. Context is the coarsest filter.** `zam token list --knowledge-context`,
bridge `list-tokens` knowledge-context field (additive), graph: context selector
above the domain selector. The review queue gains an *optional*
`--knowledge-context` scope (default remains: everything, interleaved —
learning across contexts is a feature, not a bug).

**5. Context is a sync/filter facet, not the sharing anchor.** The sync service
may publish a workspace's library slice per context, but workspace membership
and source classification authorize the transfer. Personal and future school
workspaces can both use a `vocational-school` context without becoming the same
publisher or gaining access to each other's private material. Detailed access
and purge mechanics stay in the multi-learner and learning-governance ADRs.

**6. Assignment is maintained by `zam doctor` (task `contexts`).** The
doctor proposes context assignments from domain names and content language
(LLM-assisted, confirmed by the user, like every doctor task), so the
existing 253-token base gets classified without hand-editing. New tokens:
`--knowledge-context <name>` flags on register/import wizards, plus an optional
per-device default stored machine-locally on the active workspace entry in
`~/.zam/config.json` (never a synced setting) for "I'm currently working".
These names
are fixed because `Token.context` and `--context` already mean explanatory token
text in the stable API; the management command is `zam knowledge-context`
(alias `zam kc`) for the same reason.

**Owner decision on the doctor interaction model (applies to ALL doctor
tasks across ADRs, resolving the titles ADR's open question):** plain
`zam doctor` is a pure diagnosis report and never writes;
`zam doctor <task> --fix` applies changes with a preview and confirmation;
`--yes` skips confirmation for agents/scripts; `--json` emits the report
for bridge consumers.

**7. Bridge/protocol changes are additive:** a distinct `knowledgeContexts`
field in token payloads, `list-knowledge-contexts` (plus assign/unassign)
commands, and
`--knowledge-context` filters. The existing string-valued `Token.context`
field remains unchanged. No breaking changes.

### Phase 0 refinement decisions (2026-07-05)

The DocuWare-apprentice walkthrough fixes the following behavioral boundaries:

1. **Active situation prioritizes; it does not redefine knowledge.** In the
   DocuWare working situation, DocuWare learning assignments are prioritized,
   vocational-school assignments remain eligible, and private assignments are
   excluded by default. A later policy may reserve a percentage of working time
   for private learning. Time budgets, tracking, reporting, and incentives belong
   to a separate learning-governance ADR.
2. **The active knowledge context is explicitly selectable with a per-device
   default.** A company laptop can default to DocuWare without preventing an
   explicit switch at home. A device default is a convenience, not proof of
   location, ownership, or permission. View filters (graph, lists) read the
   default but never write it; changing the default is always an explicit act.
3. **One learner-token pair has one card and one FSRS history.** If the same
   token occurs in company and vocational-school curricula, that retained
   knowledge can satisfy both learning assignments. Assignment provenance,
   priority, due dates, and completion views remain separate from the card.
4. **Publisher and assigner are different roles.** A curriculum provider
   publishes authoritative content; a learner, employer, or later a school or
   teacher assigns it. Without a school workspace, the learner can self-assign
   provider content from the personal workspace.
5. **Team-visible planning describes required coverage, not private recall.** A
   team may publish which domains or expertise it needs, which members are
   responsible for building and maintaining them, which knowledge everyone
   needs, and where redundancy is required to avoid a single expert. Individual
   review answers, failures, and review logs remain private. Mandatory completion
   reporting is a separate governance concern.
6. **Knowledge portability follows the classified source, not the device used.**
   Public-resource links ground portable world knowledge. Team repositories,
   internal Confluence pages, and comparable organization-only resources ground
   confidential knowledge. When membership ends, access to those sources and
   their confidential derived knowledge disappears; portable world knowledge
   remains. Exact purge mechanics belong to learning governance and
   multi-learner sync.
7. **Declining is not a fifth FSRS rating.** Ratings 1–4 continue to describe
   recall quality for knowledge the learner still intends to retain. A separate
   decline action (rendered compactly as `-`) removes an optional item from the
   queue and records a personal token suppression so suggestion/import
   automation does not add it again.
8. **Automation may remove the need to learn.** Agent execution or a script does
   not prove human retention and therefore never advances FSRS. It can,
   nevertheless, satisfy the underlying operational need and justify declining
   an optional learning assignment.
9. **Obvious mandatory learning does not offer `-`.** It remains an explicit
   obligation and cannot be silently hidden or reported as complete. Due dates,
   completion evidence, consequences, auditor access, and compliance reporting
   belong to the separate learning-governance ADR.

## Deferred questions

1. **Confidential purge boundary** — does membership loss purge cards, review
   logs, embeddings, session evidence, and local source caches as well as token
   content? Resolve in learning governance and multi-learner sync.
2. **Team coverage evidence** — how does a team know that a required expertise
   area has enough active maintainers without exposing private review history?
   Completion attestations, demonstrated work, or learner-approved aggregates
   are candidates for the learning-governance ADR.
3. **Per-context review pacing** — beyond the resolved DocuWare/school/private
   eligibility rule, how should the queue divide time among simultaneously
   eligible assignments? Defer to learning governance.
4. **Data class of context assignments** — in multi-learner sync, are
   `contexts`/`token_contexts` shared library data (curator-maintained) or
   per-learner facets (one learner's "private" is not another's)? The schema
   is deliberately user-unscoped; the multi-learner ADR's data-class table
   must answer this before sync Phase D ships.

## Scope and delivery plan

- **Phase 0 — accepted ADR refinement (complete):** worked persona, authority,
  ownership, visibility, active-situation, and public naming contracts are
  resolved above; the implementation plan lives in `docs/plans/`.
- **Phase A — schema + kernel + CLI filters** (`contexts` and `token_contexts`,
  list/register/edit support, optional review-queue scope, language resolution
  in generation paths).
- **Phase B — doctor task `contexts`** (LLM-assisted backfill of the
  existing base).
- **Phase C — Studio/graph selector** (context above domain).
- **Phase D — sync filter** lands with multi-learner Phase B (workspace library
  slices may be filtered per context; authorization remains source/workspace
  based).

## Out of scope

- Permissions/roles (multi-learner ADR owns them).
- Learning assignment authority, time budgets, mandatory completion, team
  coverage reporting, audit access, and decline semantics (learning-governance
  ADR).
- Domain restructuring or ontology alignment (seed-note ADR).
- Per-context FSRS parameters or scheduling changes.

## Consequences

- Per-area language, sync filtering, and coarse graph filtering get one small,
  common answer without turning context into access control.
- Two new tables and no new token column; every existing flow is unaffected
  until a context is assigned (strict opt-in).
- The multi-learner service gains a context filter before it is built, while
  source/workspace authorization remains explicit.
- A future ontology decision is not constrained: contexts are data and can
  be migrated by a doctor task if the hierarchy absorbs them.
- The n:m model buys the shared-concept case without broadening access:
  filtering is OR, content language wins over context defaults, and source plus
  workspace govern visibility and portability.
