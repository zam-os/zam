# ZAM Architecture Handbook
*The Complete System Reference Manual for the Symbiotic Learning Kernel*

> Last updated: 2026-06-20 · Version 0.3.13 (Phase 1: Individual Symbiosis)
>
> Related Documentation:
> - [TEMPLATES.md](TEMPLATES.md) — template/instance model, repo families, setup protocol
> - [ui-observation-protocol.md](ui-observation-protocol.md) — bridge vision capture spec
> - [ADR Index](adr/README.md) — architectural decision records

---

## 1. Design Philosophy

ZAM (Symbiotic Learning Kernel) is designed to enhance human intelligence through frictionless, spaced-repetition learning integrated directly into real-world software engineering workflows. The architecture is guided by three core design invariants:

### 1.1 AI-Agnostic Kernel
The core learning engine is built entirely on pure learning science. It has **zero runtime dependencies** on Large Language Models (LLMs) or cloud AI providers. The scheduler, queue builder, prerequisite resolver, and database migrations are written in pure TypeScript/Rust. 

AI agents (such as Claude Code, Codex, or Gemini) are treated as **external clients**. They communicate with the kernel via a structured JSON bridge protocol. This decoupling ensures that ZAM is future-proof, private, and deterministic: the learning kernel remains constant even as AI models evolve.

### 1.2 Local-First & User-Owned
A learner's knowledge profile is intimate and private. ZAM enforces a local-first data model:
- All cards, tokens, review histories, and configuration keys are stored in a single SQLite database file at `~/.zam/zam.db` (configured for Write-Ahead Logging (WAL) to allow concurrent CLI and desktop access).
- Human-authored learning artifacts (beliefs, goals) are versioned in plain Markdown files inside the user's personal git repository.
- Cloud storage (such as Turso) is an opt-in, encrypted synchronization layer rather than a central source of truth.

### 1.3 Observation over Interruption
Traditional learning software requires active study sessions that interrupt flow. ZAM prioritizes **passive background observation**:
- **Level 1 (Shell):** The kernel intercepts terminal history to observe commands executed, errors encountered, and documentation searched.
- **Level 2 (Screen/UI):** The screen observer monitors active windows to infer ratings from task performance.
- Verbal active-recall testing is a secondary fallback. The system aims to rate the learner's comprehension silently by watching their hands-on work.

---

## 2. System Layers

ZAM is structured into four distinct execution layers:

```
┌──────────────────────────────────────────────────────────┐
│  AI Skill Layer  (SKILL.md)                              │
│  Claude Code / Codex / Copilot / Gemini / Voice / AR     │
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
│  ─ Observation: monitor analysis + confirmed synthesis   │
│  ─ Scheduler: FSRS-5, queue builder, blocker,            │
│               interleaver                                │
│  ─ Recall: Bloom-adapted prompter, rating evaluator      │
│  ─ Analytics: user stats, domain competence              │
├──────────────────────────────────────────────────────────┤
│  SQLite  (~/.zam/zam.db)                                 │
│  WAL mode · FK constraints · ULID primary keys           │
└──────────────────────────────────────────────────────────┘
```

### 2.1 The AI Skill Layer (`.agents/skills/zam/SKILL.md`)
The entry point for AI assistants. It exposes the ZAM playbook: how to discover knowledge cards, check for due reviews, evaluate the user's answers, and silently register work evidence. The skill layer translates native agent capabilities (like shell execution and screenshot vision) into ZAM bridge calls.

### 2.2 The CLI Layer (`src/cli/`)
The interface for both humans and daemons. Human commands (`zam review`, `zam stats`, `zam token`) output colorized, localized terminal formatting. Machine commands (`zam bridge ...`) take arguments and output raw JSON, ensuring a structured contract with no terminal pollution.

### 2.3 The Kernel Layer (`src/kernel/`)
The engine room. It defines the core entity models, handles data validation, computes memory decay curves (FSRS-5), manages domain interleaving, resolves prerequisite dependency graphs, and processes raw observation inputs into synthesized learning tokens.

### 2.4 The Persistence Layer (`src/kernel/db/`)
The database adapter. It handles connection pooling, schema migrations, and provides promise-based wrappers for both local SQLite (`better-sqlite3`) and remote Turso cloud sync (`libsql` over Hrana v3).

---

## 3. Data Model & Schema

ZAM's relational database schema is designed for absolute integrity. Primary keys are **ULIDs** (Universally Unique Lexicographically Sortable Identifiers) to facilitate conflict-free multi-device synchronization.

### 3.1 Entity Relationship Diagram

```
                 ┌──────────────┐
                 │    tokens    │◀┐
                 └──────┬───────┘ │
                        │ 1       │ M:N (Prerequisites)
                        │         │
                        │ N       │
  ┌──────────────┐      │      ┌──┴───────────┐
  │   sessions   │      ├─────▶│ prerequisites│
  └──────┬───────┘      │      └──────────────┘
         │ 1            │
         │              │ 1
         │ N            ▼
  ┌──────┴───────┐   ┌──────────┐
  │ session_steps│──▶│  cards   │
  └──────────────┘   └────┬─────┘
                          │ 1
                          │
                          │ N
                     ┌────▼──────┐
                     │review_logs│
                     └───────────┘
```

### 3.2 Database Table DDL Definitions

| Table | Column | Type | Role |
| :--- | :--- | :--- | :--- |
| **tokens** | `id`<br>`slug`<br>`concept`<br>`domain`<br>`bloom_level`<br>`question`<br>`question_source`<br>`source_link`<br>`symbiosis_mode`<br>`created_at`<br>`updated_at`<br>`deprecated_at` | TEXT (ULID) PK<br>TEXT UNIQUE<br>TEXT<br>TEXT<br>INTEGER (1–5)<br>TEXT NULL<br>TEXT NOT NULL<br>TEXT NULL<br>TEXT<br>TEXT<br>TEXT<br>TEXT NULL | Contains the atomic units of knowledge. Slugs are human-readable (e.g. `git-commit-amend`). `question_source` indicates origin (`manual`, `llm`, `template`). |
| **cards** | `id`<br>`token_id`<br>`user_id`<br>`stability`<br>`difficulty`<br>`reps`<br>`lapses`<br>`state`<br>`due_at`<br>`last_reviewed_at`<br>`blocked` | TEXT (ULID) PK<br>TEXT FK<br>TEXT<br>REAL<br>REAL<br>INTEGER<br>INTEGER<br>INTEGER (0–3)<br>TEXT<br>TEXT NULL<br>INTEGER (0/1) | Tracks a specific user's memory scheduling parameters. `blocked=1` means active prerequisites must be cleared first. |
| **prerequisites** | `token_id`<br>`requires_id` | TEXT FK<br>TEXT FK | Directed links representing dependency constraints. Composite PK: `(token_id, requires_id)`. |
| **review_logs** | `id`<br>`card_id`<br>`rating`<br>`state`<br>`stability`<br>`difficulty`<br>`elapsed_days`<br>`scheduled_days`<br>`reviewed_at`<br>`session_id` | TEXT (ULID) PK<br>TEXT FK<br>INTEGER (1–4)<br>INTEGER<br>REAL<br>REAL<br>REAL<br>INTEGER<br>TEXT<br>TEXT NULL | Immutable audit log of every study/observation transaction. Serves as raw training data for FSRS weight optimization. |
| **sessions** | `id`<br>`user_id`<br>`task`<br>`execution_context`<br>`started_at`<br>`ended_at` | TEXT (ULID) PK<br>TEXT<br>TEXT<br>TEXT (shell/ui)<br>TEXT<br>TEXT NULL | Tracks work episodes where learning context is gathered. |
| **session_steps** | `id`<br>`session_id`<br>`token_id`<br>`done_by`<br>`rating`<br>`created_at` | TEXT (ULID) PK<br>TEXT FK<br>TEXT FK<br>TEXT (user/agent)<br>INTEGER NULL<br>TEXT | Individual action nodes captured during work (e.g. executing a command associated with a token). |
| **session_syntheses**| `session_id`<br>`token_id`<br>`inferred_rating`<br>`confirmed_rating`<br>`evidence`<br>`created_at` | TEXT FK<br>TEXT FK<br>INTEGER<br>INTEGER<br>TEXT (JSON)<br>TEXT | Synthesis audit to ensure offline analysis updates cards exactly once (idempotent key: `(session_id, token_id)`). |
| **agent_skills** | `id`<br>`slug`<br>`description`<br>`steps`<br>`token_slugs`<br>`created_at`<br>`updated_at` | TEXT (ULID) PK<br>TEXT UNIQUE<br>TEXT<br>TEXT (JSON)<br>TEXT (JSON)<br>TEXT<br>TEXT | Procedural task recipes the AI agent has learned from guiding the user through novel tasks. |
| **user_config** | `key`<br>`value`<br>`updated_at` | TEXT PK<br>TEXT<br>TEXT | Flat key-value configurations (e.g. `observer.scope`, `llm.model`). |

### 3.3 Token vs. Card Separation
A **Token** is a shared semantic concept: *"A git commit can be modified with `git commit --amend`."* It belongs to the domain, containing the question, prerequisite links, and source documentation.

A **Card** is the individual learner's memory state regarding that token. It holds the FSRS parameters (stability, interval, repetitions). A token can exist without cards; a card is instantiated only when a user starts observing or active-recalling that specific token.

---

## 4. Scheduling Engine: FSRS-5

ZAM schedules cards using the **Free Spaced Repetition Scheduler, Version 5 (FSRS-5)**. The engine represents memory decay mathematically and calculates optimal intervals based on target retrievability.

### 4.1 Spaced Repetition Mechanics
Memory retrievability ($R$) decays over elapsed days ($t$) according to the power law:

$$R(t, S) = \left( 1 + \frac{t}{9 \cdot S} \right)^{-1}$$

Where:
- $R$ is the probability of successful recall (retrievability).
- $S$ is the half-life of memory in days (stability).
- $t$ is the number of days elapsed since the last review.

Given a user's target retrievability ($R_{target}$, default = $0.90$ or $90\%$), the scheduled interval ($I$) in days is calculated by solving for $t$:

$$I(S) = 9 \cdot S \cdot \left( \frac{1}{R_{target}} - 1 \right)$$

For $R_{target} = 0.90$, the formula simplifies to:

$$I(S) = S \cdot 9 \cdot \left( \frac{1}{0.90} - 1 \right) = S \cdot 9 \cdot \left( \frac{10}{9} - 1 \right) = S$$

Thus, at a target retrievability of 90%, the next review is scheduled exactly when $t = S$ (the elapsed time matches the current stability).

### 4.2 Card State Transitions
Each card transitions through four states:

```
            ┌────────────┐
            │   0: New   │
            └──────┬─────┘
                   │ First review (any rating)
            ┌──────▼─────┐
            │1: Learning │
            └──────┬─────┘
                   │ Rating ≥ 2 (Hard, Good, Easy)
            ┌──────▼─────┐◄────── Rating ≥ 2 ──┐
            │  2: Review │                      │
            └──────┬─────┘               ┌──────┴──────┐
                   │ Rating = 1 (Again)  │3: Relearning│
                   └────────────────────►└─────────────┘
```

- **New:** Card has never been reviewed.
- **Learning:** Card is in its initial learning loop (within the same session).
- **Review:** Card has passed the learning phase and is scheduled across days.
- **Relearning:** Card was forgotten during review (`rating = 1`) and must be re-memorized.

### 4.3 Parameter Matrix
FSRS-5 utilizes a 19-weight matrix ($w_0$ to $w_{18}$) to compute memory dynamics:
- **Initial Stability ($S_0$):** Determined by $w_0, w_1, w_2, w_3$ depending on the initial rating ($r \in \{1, 2, 3, 4\}$):
  $$S_0(r) = w_{r-1}$$
- **Initial Difficulty ($D_0$):** Determined by $w_4$ and the rating:
  $$D_0(r) = w_4 - (r - 3) \cdot w_5$$
  *Difficulty is bounded between 1.0 and 10.0.*
- **Difficulty Update ($D$):** If the card is reviewed, its difficulty changes:
  $$D_{new} = D_{old} \cdot (1 - w_6) + w_6 \cdot (w_7 - (r - 3) \cdot w_5)$$
- **Stability Update (Success):** If $r \ge 2$, stability grows:
  $$S_{new} = S_{old} \cdot \left( 1 + e^{w_8} \cdot (11 - D_{new}) \cdot S_{old}^{-w_9} \cdot (e^{(r-3) \cdot w_{10}} - 1) \cdot w_{11} \right)$$
- **Stability Update (Failure):** If $r = 1$, stability decays:
  $$S_{new} = w_{12} \cdot D_{new}^{-w_{13}} \cdot (S_{old} + 1)^{w_{14}} \cdot e^{(1 - R) \cdot w_{15}}$$

---

## 5. Review & Queue Lifecycle

Review queue construction is designed to balance memory retrieval, user energy levels, and domain context switches.

### 5.1 Queue Construction Pipeline (`src/kernel/scheduler/queue.ts`)
When `getReviewQueue()` is called:

```
Step 1: Fetch Due Cards
Query database for cards where (due_at <= NOW) in Review/Learning states.
Exclude blocked and deprecated cards.
Sort by urgency (most overdue first).
           │
           ▼
Step 2: Fetch New Cards
Query database for cards in New state. Order by Bloom taxonomy level (1 to 5).
Cap at `maxNew` limit (default 10).
           │
           ▼
Step 3: Interleave by Domain
Distribute due cards across domain groups.
Re-order using round-robin to avoid clustering.
Limit to maximum of 2 consecutive cards from the same domain.
           │
           ▼
Step 4: Intersperse New Cards
Inject 1 new card at every 5th slot in the interleaved due queue.
           │
           ▼
Step 5: Truncate
Apply absolute cap of `maxReviews` (default 50) to the final queue.
```

### 5.2 Bloom Taxonomy Prompters (`src/kernel/recall/prompter.ts`)
ZAM generates prompt structures adapted to the Bloom taxonomy level of the token, ensuring the learner moves from raw recall to synthesis:

| Bloom Level | Cognitive Action | Template Pattern |
| :--- | :--- | :--- |
| **1: Remember** | Recognize, Recall | *"What is the syntax/definition for: {concept}?"* |
| **2: Understand** | Describe, Explain | *"Explain the working mechanism or behavior of: {concept}"* |
| **3: Apply** | Execute, Implement | *"Demonstrate how to implement: {concept} in a concrete scenario"* |
| **4: Analyze** | Compare, Deconstruct | *"Analyze the trade-offs, constraints, and alternatives of: {concept}"* |
| **5: Synthesize** | Design, Integrate | *"Design a system or workflow that integrates: {concept}"* |

### 5.3 Cascading Blocker (`src/kernel/scheduler/blocker.ts`)
If a card is forgotten (`rating = 1`), its dependent concepts are automatically blocked to prevent frustration. ZAM builds a directed dependency chain:
1. When card $C$ fails, ZAM calls `cascadeBlock(C)`.
2. It sets `blocked = 1` for $C$ and recursively sets `blocked = 1` for all cards that directly or indirectly require $C$.
3. When prerequisites are reviewed and reach `reps >= 1` (known status), ZAM checks `unblockReady(C)`. If all prerequisites are cleared, $C$'s card is set back to `blocked = 0` and joins the review queue.

---

## 6. Observation & Privacy Model

The UI Screen Observer (Layer 2) requires a robust privacy and consent model, splitting responsibility between the host client and the ZAM kernel.

### 6.1 Two-Layer Consent Model

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1 — Invocation Gate (HOST-owned)                              │
│ "May this AI agent invoke ZAM's capture capability at all?"          │
│   - Gated by CLI permissions or MCP tool-consent UI                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼ Invocation Granted
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 2 — Capture Policy (ZAM-owned)                                │
│ "What is actually allowed to be photographed and analyzed?"        │
│   - Enforced by ZAM Kernel via `ObserverPolicy`                     │
│   - Built-in sensitive filter wins over user configs                │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 The `ObserverPolicy` Schema
The policy is resolved from `user_config` via dotted settings keys:
```ts
export interface ObserverPolicy {
  version: 1;
  scope: "off" | "window" | "fullscreen"; // window requires active target
  allowlist: string[];                     // permitted process names
  denylist: string[];                      // user-defined blocked processes
  consent: "per-capture" | "per-session" | "standing";
  retention: "none" | "session" | "persist";
  redactWindowTitles: boolean;
  audioOptIn: boolean;
}
```

### 6.3 Enforcement Flow (Two-Phase Gate)
1. **Phase 1 (Pre-Capture):** Run before taking a screenshot. If `scope === "off"` or the requested process target is in the denylist, the command exits immediately with `denied: true` and no pixels are read. The allowlist check is only enforced if `scope === "window"`.
2. **Phase 2 (Post-Capture):** Run after the Win32 window handles are resolved. If the captured window's title or process matches the built-in sensitive lists, ZAM deletes the temporary PNG file from disk and returns a blanked-out denied frame payload.

#### Built-in Sensitive Matchers (Always Denied):
- **Password Managers:** `1password`, `bitwarden`, `keepass`, `lastpass`, `dashlane`, `nordpass`, `enpass`, `proton pass`.
- **System Credentials:** `consentux` (UAC), `credentialuibroker`, `logonui`, `windowssecurity`.
- **Financial Hints:** `online banking`, `onlinebanking`, `banking`, `checkout`, `paypal`, `zahlung`.
- **Private surfaces:** `incognito`, `inkognito`, `private window`, `private browsing`.

### 6.4 Dynamic Title Checking (Rust Sidecar)
During active monitoring loops (`watch_window_keyframes`), the Rust sidecar fetches `window_info_with_policy(hwnd, &policy)` on every captured frame. If the window title transitions to a sensitive state:
- Capturing of pixels is paused (`capture = None`).
- The application context metadata is redacted to `[redacted by privacy filter]`.
- Frame capture resumes automatically once the user navigates away from the sensitive URL or page.

---

## 7. Bidirectional Learning: Agent Skills

When an AI assistant encounters a novel task, ZAM shifts from testing the user to learning from the user.

```
                  ┌──────────────────────────────┐
                  │ Agent encounters novel task │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ User guides agent in session │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Agent notes successful steps │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Register new tokens + cards  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Save recipe to `agent_skills`│
                  └──────────────────────────────┘
```

1. **Discovery:** The agent detects it has no automated recipe for a given task.
2. **Coaching:** The user guides the agent manually, executing terminal commands or modifying code.
3. **Registration:** The agent registers atomic **Tokens** representing the underlying concepts learned. The user receives **Cards** for those concepts—even though the agent automated the task, the user must retain the knowledge to supervise it.
4. **Recipe Persistence:** The agent saves the execution checklist into the `agent_skills` table as a JSON-serialized sequence of commands, linked to the related token slugs. When executing in `Autonomy` mode, the agent looks up the skill registry to perform routine tasks automatically.

---

## 8. Deployment & Synchronization

ZAM supports multiple database backends depending on the user's setup:

### 8.1 SQLite Local Backend
Uses a synchronous file connection (`better-sqlite3`). SQLite is compiled with WAL mode enabled, permitting concurrent read transactions from multiple terminal windows while a review session is in progress.

### 8.2 Turso Cloud Database Sync
For multi-device synchronization:
- Uses the `libsql` promise-based async adapter.
- Connects to Turso cloud servers via the **Hrana v3 protocol** (WebSocket/HTTP).
- Machine-local secrets (Turso auth tokens) are stored in local configuration files at `~/.zam/credentials.json` which are added to `.gitignore` and never committed to the user's repository.

### 8.3 Snapshots
For users syncing via OneDrive, Google Drive, or git repos:
- Storing a live, active SQLite database directly in a file-sync directory causes file corruption due to lock mismatches.
- ZAM enforces snapshot-based synchronization: the command `zam snapshot export` writes a clean, transactional SQL text dump into `<personal-repo>/snapshots/`. The matching `import` command loads and validates this SQL file on another machine.

---

## 9. Codebase Module Directory Map

The following map outlines the location of individual components inside the ZAM repository:

```
src/
├── index.ts                     ← Package root (re-exports kernel APIs)
├── cli/
│   ├── index.ts                 ← Commander CLI command registry
│   └── commands/
│       ├── init.ts              ← Workspace directory initializer
│       ├── token.ts             ← Token registration, search, and deprecation
│       ├── card.ts              ← Card due queries and manual block state changes
│       ├── review.ts            ← Interactive active-recall review loop
│       ├── session.ts           ← Shell monitoring session lifecycle
│       ├── stats.ts             ← User metrics and competence heatmaps
│       ├── skill.ts             ← Agent skill registration and lookup
│       ├── settings.ts          ← Configuration management (locale, llm, observer)
│       └── bridge.ts            ← JSON JSON-RPC bridge daemon
├── kernel/
│   ├── index.ts                 ← Unified kernel exports
│   ├── db/
│   │   ├── connection.ts        ← Database adapter lifecycle & migrations
│   │   ├── schema.ts            ← SQL DDL schemas and table indexes
│   │   └── types.ts             ← Abstract Database interface
│   ├── models/
│   │   ├── token.ts             ← Token data validations
│   │   ├── card.ts              ← Card property wrappers
│   │   ├── prerequisite.ts      ← Prerequisites resolver
│   │   ├── review.ts            ← Review log validation
│   │   ├── session.ts           ← Session event schemas
│   │   └── agent-skill.ts       ← Agent skill schemas
│   ├── scheduler/
│   │   ├── fsrs.ts              ← Mathematical implementation of FSRS-5
│   │   ├── queue.ts             ← Interleaved due-queue builder
│   │   ├── blocker.ts           ← Dependency block cascades
│   │   └── interleaver.ts       ← Domain context balancer
│   ├── recall/
│   │   ├── prompter.ts          ← Bloom taxonomy prompters
│   │   └── evaluator.ts         ← FSRS schedulers
│   ├── observation/
│   │   ├── policy.ts            ← Pre- and post-capture privacy filters
│   │   └── session-synthesis.ts ← Shell and UI log synthesizers
│   └── analytics/
│       └── stats.ts             ← Metrics calculators
├── bridge/
│   ├── index.ts                 ← Bridge exports
│   └── protocol.ts              ← JSON bridge response schemas
observer/                        ← Rust UI Observer Sidecar
├── Cargo.toml                   ← Cargo build configuration
└── src/
    ├── main.rs                  ← Daemon CLI wrappers
    ├── lib.rs                   ← Observer public library
    ├── capture.rs               ← DXGI capture loops with dynamic privacy rechecks
    ├── picker.rs                ← WinRT GraphicsCapturePicker & Win32 window describer
    ├── privacy.rs               ← Case-insensitive process/title filters
    ├── raw_input.rs             ← Mouse and keyboard input trackers
    ├── uia.rs                   ← UI Automation element focus watchers
    └── replay.rs                ← Capture event replayers
```
