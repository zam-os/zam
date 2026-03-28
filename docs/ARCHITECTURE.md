# ZAM Architecture

> Last updated: 2026-03-28 · Phase 1: Individual Symbiosis
>
> Related: [TEMPLATES.md](TEMPLATES.md) — template/instance model, repo families, setup protocol

---

## Design Philosophy

ZAM is built on three principles:

1. **AI-agnostic kernel** — The learning engine has zero LLM dependencies. It is pure learning science: spaced repetition (FSRS-5), Bloom taxonomy, prerequisite graphs, and review scheduling. Any AI CLI (Claude Code, Copilot CLI, Gemini CLI, or future systems) integrates through a JSON bridge protocol.

2. **Local-first** — All data lives in a single SQLite file at `~/.zam/zam.db`, owned by the user. WAL mode enables concurrent access from multiple CLI processes.

3. **Observation over interruption** — The agent's primary assessment mode is silent observation of the user doing real work. Verbal probing is a secondary fallback. The best learning session is one the user barely notices.

---

## System Layers

```
┌──────────────────────────────────────────────────────────┐
│  AI Skill Layer  (SKILL.md)                              │
│  Claude Code / Copilot CLI / Gemini CLI / Voice / AR     │
│  ─ Reads SKILL.md instructions                           │
│  ─ Drives session protocol (observe → probe → rate)      │
│  ─ Calls zam bridge commands for data                    │
├──────────────────────────────────────────────────────────┤
│  CLI Layer  (src/cli/)                                   │
│  ─ Human-facing: zam token, card, review, session, stats │
│  ─ Machine-facing: zam bridge (JSON-only)                │
│  ─ Thin orchestration: open DB → call kernel → render    │
├──────────────────────────────────────────────────────────┤
│  Kernel  (src/kernel/)                                   │
│  ─ Models: token, card, prerequisite, review, session,   │
│            agent-skill                                   │
│  ─ Scheduler: FSRS-5, queue builder, blocker,            │
│               interleaver                                │
│  ─ Recall: Bloom-adapted prompter, rating evaluator      │
│  ─ Analytics: user stats, domain competence              │
├──────────────────────────────────────────────────────────┤
│  SQLite  (~/.zam/zam.db)                                 │
│  WAL mode · FK constraints · ULID primary keys           │
└──────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity Relationships

```
tokens ──1:N──▶ cards       (one concept, many user cards)
tokens ──M:N──▶ tokens      (prerequisites — directed graph)
cards  ──1:N──▶ review_logs (immutable audit trail)
sessions ─1:N─▶ session_steps ──▶ tokens
agent_skills ──▶ token_slugs (JSON link to related tokens)
```

### Tables

| Table | Role | Key Fields |
|-------|------|------------|
| **tokens** | Atomic knowledge concepts | `slug`, `concept`, `domain`, `bloom_level` (1–5), `symbiosis_mode`, `deprecated_at` |
| **cards** | Per-user FSRS scheduling state | `token_id`, `user_id`, `stability`, `difficulty`, `reps`, `lapses`, `state`, `due_at`, `blocked` |
| **prerequisites** | Dependency graph between tokens | `token_id` → `requires_id` |
| **review_logs** | Immutable record of every review | `card_id`, `rating` (1–4), `reviewed_at`, `session_id` |
| **sessions** | Work + learning episodes | `user_id`, `task`, `execution_context` (shell/ui/reallife) |
| **session_steps** | Who did what in a session | `token_id`, `done_by` (user/agent), `rating` |
| **agent_skills** | Task recipes learned from user guidance | `slug`, `description`, `steps` (JSON), `token_slugs` (JSON) |
| **user_config** | Key-value store for user settings | `key`, `value` |

### Token vs Card — The Core Distinction

A **token** is a shared concept: "Homebrew is installed by running a curl script from brew.sh". It exists once.

A **card** is one user's relationship with that concept: their stability, difficulty, number of repetitions, when it's next due. Creating a token does not create cards — `ensureCard()` must be called explicitly for a token to appear in a user's review queue.

---

## Scheduling Engine: FSRS-5

The heart of ZAM is a pure-function implementation of [FSRS-5](https://github.com/open-spaced-repetition/fsrs4anki) (Free Spaced Repetition Scheduler, version 5).

```
schedule(card, rating, now) → updated SchedulingCard
```

### Core Concepts

- **Stability** (S): Memory half-life in days. Higher = longer intervals.
- **Difficulty** (D): How hard a concept is for this user (1–10 scale).
- **Retrievability** (R): Probability of recall. `R = (1 + elapsed / (9 * S))^-1`
- **Rating**: 1 = Again (forgot), 2 = Hard, 3 = Good, 4 = Easy.

### Card State Machine

```
        ┌──────────┐
        │   new    │
        └────┬─────┘
             │ any rating
        ┌────▼─────┐
        │ learning │
        └────┬─────┘
             │ rating ≥ 2
        ┌────▼─────┐◄────── rating ≥ 2 ──┐
        │  review  │                      │
        └────┬─────┘               ┌──────┴─────┐
             │ rating = 1          │ relearning  │
             └────────────────────►└─────────────┘
```

### Interval Calculation

```
interval = round(9 × stability × (1/requestRetention − 1))
```

Default target retention: 90%. Higher retention → shorter intervals. Minimum interval: 1 day.

### 19-Weight Parameter Model

The scheduler uses 19 optimized weights (w0–w18) that control initial stability, difficulty evolution, stability growth after success, stability after forgetting, and hard/easy bonuses. These are empirically tuned defaults that can be overridden per user.

---

## Review Flow

### Queue Building (`scheduler/queue.ts`)

1. Fetch **due cards**: state ∈ {review, relearning, learning}, not blocked, not deprecated, due ≤ now
2. Fetch **new cards**: state = new, not blocked, not deprecated, up to `maxNew` (default 10), ordered by bloom level
3. Sort due cards by **urgency** (most overdue first)
4. **Interleave by domain** — round-robin across domains, max 2 consecutive from the same domain
5. **Intersperse new cards** every 5th position
6. Cap at `maxReviews` (default 50)

### Bloom-Adapted Prompts (`recall/prompter.ts`)

| Level | Verb | Question Pattern |
|-------|------|-----------------|
| 1 | Remember | "What is: {concept}?" |
| 2 | Understand | "Explain how this works: {concept}" |
| 3 | Apply | "Apply this concept: {concept}" |
| 4 | Analyze | "Analyze the trade-offs: {concept}" |
| 5 | Synthesize | "Design a solution using: {concept}" |

These are template-based (not LLM-generated). The AI skill layer uses them as starting points and adapts conversationally.

### Rating Evaluation (`recall/evaluator.ts`)

1. Load card from DB
2. Build `SchedulingCard` from DB state
3. Call `fsrs.schedule(card, rating, now)` — pure function
4. Write updated FSRS fields back to card
5. Append immutable entry to `review_logs`
6. Return result (next due date, stability, state)

Blocking logic is **not** in the evaluator. Callers invoke `cascadeBlock()` separately after a rating of 1.

---

## Prerequisite Blocking (`scheduler/blocker.ts`)

When a user rates a token as 1 (forgot):

1. **Block** the token's card (set `blocked = 1`)
2. **Ensure cards exist** for all direct prerequisites (unblocked, due now)
3. Prerequisites surface in the next review session

When prerequisites are learned (`reps ≥ 1` and unblocked), `unblockReady()` promotes the dependent token back into the queue. Run `zam card unblock` at session start.

```
Token A (blocked)
  └── requires Token B (reps=0 → must learn first)
  └── requires Token C (reps=2 → already known)

After B reaches reps ≥ 1 → A is unblocked automatically.
```

---

## Symbiosis Modes

Modes are suggested per domain based on analytics (`analytics/stats.ts`):

| Mode | Criteria | Agent Behavior |
|------|----------|----------------|
| **Shadowing** | Default / low retention | Agent plans, user executes. Agent observes silently and rates. |
| **Co-Pilot** | Retention > 70%, stability > 7 | Agent and user alternate. Agent observes user actions. |
| **Autonomy** | Retention > 90%, stability > 30 | Agent handles routine. Periodic practice tasks keep skills alive. |

A "mature" card has `reps ≥ 3` and `stability ≥ 21` (roughly 3 weeks half-life).

---

## Bridge Protocol (`src/bridge/`)

The bridge is the stable contract for AI CLIs. All responses are JSON, including errors.

| Command | Purpose | Key Fields |
|---------|---------|------------|
| `bridge check-due --user <id>` | What's due? | dueCount, domains, cards[] |
| `bridge get-review --user <id>` | Next card + Bloom prompt | card, prompt, queueSize |
| `bridge submit --user <id> --card-id <id> --rating <1-4>` | Record rating | evaluation, blocked |
| `bridge get-skill --slug <slug>` | Fetch a task recipe | steps[], tokenSlugs[] |
| `bridge add-token --user <id>` | Create token + card (stdin JSON) | token, card |

---

## Observation Levels

ZAM is designed for three observation levels, with a pluggable interface:

| Level | Medium | Status | How Assessment Works |
|-------|--------|--------|---------------------|
| **1 — Shell** | CLI commands | Active | Agent reads command history/output, infers success |
| **2 — Screen** | Full screen | Future | Agent observes UI actions, rates visually |
| **3 — Real life** | Voice + AR | Future | Agent as overlay on phone/glasses |

The `execution_context` field on sessions (shell/ui/reallife) tracks which level is in use. All three levels share the same kernel — only the observation primitive changes.

---

## Agent Skills (Bidirectional Learning)

When the agent can't execute a step, it learns from the user:

1. Agent admits uncertainty and asks for guidance
2. User guides, agent attempts, notes what worked
3. New tokens are registered for any discovered concepts
4. The approach is saved as an **agent skill** (`agent_skills` table)
5. Linked tokens get user cards that decay via FSRS — automation doesn't replace retention

Skills are stored as JSON step arrays with related token slugs, enabling the agent to look up learned procedures for future tasks.

---

## Token Deprecation

Knowledge goes stale. When a concept becomes outdated:

1. User indicates the token is obsolete during a review
2. `zam token deprecate --slug <slug>` sets `deprecated_at`
3. Token is excluded from search, list, and review queue
4. Token is **not deleted** — it remains in the DB for historical context

---

## Schema Migrations

Migrations run automatically on every `openDatabase()` call and are idempotent:

| ID | Migration | Purpose |
|----|-----------|---------|
| M001 | `ALTER TABLE sessions ADD COLUMN execution_context` | Observation level tracking |
| M002 | `ALTER TABLE tokens ADD COLUMN deprecated_at` | Token deprecation |
| M003 | `CREATE TABLE IF NOT EXISTS agent_skills` | Bidirectional learning |

New migrations are appended to `runMigrations()` in `src/kernel/db/connection.ts`. The schema in `schema.ts` reflects the latest state for fresh databases initialized via `zam init`.

---

## Module Map

```
src/
├── index.ts                      ← Package root (re-exports kernel)
├── cli/
│   ├── index.ts                  ← Commander setup (8 subcommands)
│   └── commands/
│       ├── init.ts               ← zam init
│       ├── token.ts              ← zam token register/find/list/prereq/deprecate/status
│       ├── card.ts               ← zam card due/update/unblock
│       ├── review.ts             ← zam review (interactive)
│       ├── session.ts            ← zam session start/log/end
│       ├── stats.ts              ← zam stats
│       ├── skill.ts              ← zam skill list/show/add
│       └── bridge.ts             ← zam bridge (JSON-only API)
├── kernel/
│   ├── index.ts                  ← Public kernel API
│   ├── db/
│   │   ├── connection.ts         ← SQLite lifecycle + migrations
│   │   └── schema.ts             ← DDL (8 tables, indexes)
│   ├── models/
│   │   ├── token.ts              ← Concepts with Bloom levels
│   │   ├── card.ts               ← Per-user FSRS state
│   │   ├── prerequisite.ts       ← Dependency graph
│   │   ├── review.ts             ← Immutable review log
│   │   ├── session.ts            ← Work + learning episodes
│   │   └── agent-skill.ts        ← Task recipes
│   ├── scheduler/
│   │   ├── fsrs.ts               ← FSRS-5 (pure functions, 297 lines)
│   │   ├── queue.ts              ← Review queue builder
│   │   ├── blocker.ts            ← Prerequisite blocking
│   │   └── interleaver.ts        ← Cross-domain interleaving
│   ├── recall/
│   │   ├── prompter.ts           ← Bloom-level prompt generation
│   │   └── evaluator.ts          ← Rating → FSRS → DB update
│   └── analytics/
│       └── stats.ts              ← Dashboard + domain competence
└── bridge/
    ├── index.ts                  ← Bridge exports
    └── protocol.ts               ← JSON request/response types
```
