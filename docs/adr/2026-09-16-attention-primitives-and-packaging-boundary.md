# Attention Primitives and the Packaging Boundary

**Status:** Proposed — 2026-09-16\
**Date:** 2026-09-16\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-03-26](2026-03-26-personal-workflow-foundations.md) (personal / team / organization repositories; board discovery at session start) ·
[2026-06-13a](2026-06-13a-automatic-session-synthesis.md) (a task episode becomes learning evidence) ·
[2026-06-20](2026-06-20-observer-permission-model.md) (perceive-only vs. act) ·
[2026-07-04](2026-07-04-knowledge-contexts.md) (work / private contexts are orthogonal) ·
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP as the agent transport) ·
[2026-07-12a](2026-07-12a-agent-backed-ai-provider.md) (the agent harness as an AI provider) ·
[2026-07-30b](2026-07-30b-credential-secret-backends.md) (tokens live in a vault) ·
[2026-09-15](2026-09-15-idle-aware-study-time.md) (active time, not wall-clock) ·
Ideas: [service connector contract](../../ideas/workflow/service-connector-contract.md) ·
[active-task priority](../../ideas/workflow/active-task-priority.md) ·
[privacy boundaries](../../ideas/organization/privacy-boundaries.md)

---

## Context

A knowledge worker's day is interrupted by two counters: the unread badge on
the mail client and the unread badge on the team chat. Every badge change
costs a task switch, and a task switch is exactly what ZAM's beliefs warn
against: a human processing volume instead of applying knowledge, with no
protected span for work or recovery.

A separately owned tool — an **attention shield** with a thin sidebar, an
agent that triages inbound items and conducts one active task at a time, and
a personal logbook — is being designed on top of ZAM by a sponsoring
organisation, as an internal tool first and possibly a product later. Its
concept and roadmap live with that organisation. This ADR decides what **ZAM
itself** provides so that such a product can exist without forking the
kernel, and where the line between the open learning engine and a packaged
product runs.

ZAM already has most of the pieces, unconnected: sessions as work-plus-
learning episodes, knowledge contexts, personal / team / organization
repositories, a board connector at session start, the Observer permission
model, and the agent-backed AI provider. The backlog already asks for a
generic connector contract, active-task priority and a privacy boundary.

## Decisions

### 1. A session is the unit of task work, not only of learning

The kernel `sessions` row is the active task. Starting a task is
`session_start`; parking or completing it is `session_end`. A session gains:

- a **source item reference**: connector id plus an opaque item id (never
  the item's title or body);
- **mode events** (Decision 2) and **pause intervals**, so a task that spans
  days keeps one identity and one effort total;
- **effort per day**, computed from active time (Decision 5).

**Invariant:** at most one session per user is active at a time. The kernel
enforces it; a surface that starts a second task must first park the first.

Session synthesis (ADR 2026-06-13a) and the Observer keep working unchanged:
what the learner does while the task is active becomes evidence for the
tokens the task touched. This is the precondition the
[active-task priority](../../ideas/workflow/active-task-priority.md) idea was
waiting for.

### 2. Three modes in the kernel: Work, Break, Private

A per-user **mode** state machine with `work`, `break`, `private` and
timestamped transitions. Break is rest, Private is the other knowledge
context; they are different needs and never one state. Time in Break and
Private books to its own bucket; nothing from Private is ever attributed to a
work session. The mode is readable by every surface and agent (Decision 6):
an agent should not start a review while the learner is on Break.

### 3. The connector contract is a kernel type; implementations live outside

The [service connector contract](../../ideas/workflow/service-connector-contract.md)
is promoted: kernel types for configuration, credential references (vault,
ADR 2026-07-30b), health, discovery and a small set of typed actions on
**items** (id, title, state, estimate, due, priority, tags) and **messages**
(id, kind, tier decision). Implementations that speak HTTP or drive a local
client live in the CLI layer or in a product, never in the kernel.

A **team repository** (ADR 2026-03-26) may supply `attention/connectors.yaml`
naming the connectors and conventions of the work context. ZAM reads it; the
team maintains it. A learner without a team repository configures the same
values in the Studio.

### 4. The logbook index holds structure only; content stays in its context's storage

ZAM indexes a learner's logbook — dates, session ids, opaque item references,
knowledge domains touched, embedding vectors, file paths — in the shared
database. It never stores the logbook's content there. The logbook itself is
Markdown in **two roots**, one per knowledge context, on storage the learner
chooses per machine; the roots never contain each other's content. This
keeps ADR 2026-07-04's boundary intact for a learner whose ZAM database is a
personal cloud database, and makes the
[privacy boundaries](../../ideas/organization/privacy-boundaries.md) idea
enforceable: the schema cannot hold what it must not leak.

### 5. Active time is the effort clock

Task effort and break timing reuse the idle-aware clock of ADR 2026-09-15:
reactions reset an idle watcher, a gap of up to one minute counts, longer
gaps pause. A learner who steps away is not booked, and a break already
taken away from the keyboard is not demanded again.

### 6. Read-only MCP tools expose mode and active task

`zam_attention_status`, `zam_attention_mode`, `zam_attention_active_task`
return the mode, the active session's opaque item reference and its active
time. Read-only first; any mutation goes through the two-layer consent of
ADR 2026-06-20.

### 7. Schema

New tables `conductor_events` (mode and session transitions), `fitness_events`
(a five-level self-report; never inferred), `triage_decisions`
(`item-ref, tier, confidence, rule-id, corrected-to` — no content),
`task_effort` (per session per day) and `logbook_index`, in `schema.ts` and an
M-series migration with a `CURRENT_SCHEMA_VERSION` bump.

### 8. The packaging boundary

ZAM is Apache-2.0 and its kernel stays vendor-agnostic (Openness belief). A
product built on these primitives may be open or proprietary and may be
shipped by a sponsor under its own name; the funded-learning belief welcomes
exactly that — the cost is borne by those who benefit from an unburdened,
learning person.

- **Stays in ZAM, open:** Decisions 1–7. They are learning primitives every
  ZAM surface needs, and they let a learner take sessions and logbook with
  them whatever happens to a product.
- **Belongs to a product:** the sidebar or any other runtime face, triage
  rules and heuristics, the connectors themselves, retention, digests, weekly
  reviews. A product consumes ZAM **only through the public API
  (`src/index.ts`), the bridge and MCP** — never kernel internals — so it
  cannot fork the kernel by accident, and primitives it needs are contributed
  upstream.
- **Hard principle in every packaging:** the individual's data — logbook,
  fitness, time, triage decisions — belongs to the individual. ZAM provides
  no employer-side view of an individual and no aggregate over individuals;
  a product that wants one decides and answers for it separately.

The first tool on these primitives is its own desktop application that
talks to ZAM over MCP and the public API; ZAM Desktop grows no dock window
for it. A later product may ask for one, and that is a new decision.

## Consequences

- Sessions become the unit of work time as well as of learning; every
  statistic ZAM already computes over sessions now also covers task work.
- The kernel gains a mode, an invariant (one active session) and a connector
  contract, all AI- and HTTP-free; the CLI gains connector implementations
  behind it, starting with the existing board connector.
- Personal repositories may grow an `attention/` folder and team
  repositories an `attention/connectors.yaml`; ZAM reads both and commits to
  neither.
- The public repository carries the primitives and this boundary, not a
  product concept. A product's documentation lives with its owner.

## Citations

- Existing board connector: `src/cli/connectors/azure-devops.ts`; discovery
  at session start: `src/cli/commands/session.ts`.
- Personal / team / organization repository paths: `src/kernel/system/repos.ts`.
- Sessions and steps: `src/kernel/db/schema.ts` (`sessions`,
  `session_steps`, `review_attempts`); contexts: `contexts`, `token_contexts`.
- Idle-aware clock: `src/kernel/analytics/learning-clock.ts`.
- Observer policy: `src/kernel/observation/`.
- Public library entry point a product may depend on: `src/index.ts`.
