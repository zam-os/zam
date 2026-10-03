---
name: repo-knowledge-map
description: Analyze any repository to extract, structure, and generate its navigable proposition-level knowledge map (docs/knowledge-map/map.json) per ADR 2026-10-03. Use whenever the user asks to map a repository, create or update its knowledge map, or invokes `/repo-knowledge-map`.
user-invocable: true
---

# Repo Knowledge Map Authoring Skill

This skill guides any coding agent to analyze an arbitrary codebase and author
or update its navigable repository knowledge map in `docs/knowledge-map/map.json`.

Specification and architectural contract: [ADR 2026-10-03](file:///docs/adr/2026-10-03-repo-knowledge-map.md).

---

## 1. Core Principles & Hard Invariants

1. **One declarative statement per node ($\le 140$ characters)**:
   - Each statement is a single, complete, declarative sentence.
   - Maximum 140 characters.
   - Readable slug ID (e.g. `kernel-ai-agnostic`, not ULIDs or numeric IDs).
2. **Every statement cites real source paths**:
   - Each statement must list at least one existing repository path in `sources`.
   - Examples: `["README.md"]`, `["src/core/engine.ts"]`, `["docs/adr/001.md"]`.
   - Optional `#anchor` fragments allowed (e.g. `docs/okf/article.md#section`).
3. **Closed relation kind set**:
   - Only these six relation kinds are permitted:
     - `elaborates`: Spells out part of the source statement.
     - `requires`: Precondition or dependency.
     - `leads_to`: Direct consequence or downstream rule.
     - `because`: Architectural rationale or justification.
     - `instead_of`: Chosen alternative over a rejected option.
     - `example`: Concrete implementation or instantiation.
4. **Strict `elaborates` tree**:
   - There must be exactly one `root` statement.
   - Every non-root statement must have **exactly one** incoming `elaborates` parent (`from -> to`).
   - The root statement has **zero** incoming `elaborates` parents.
   - The `elaborates` relations must form an acyclic directed tree where **every statement is reachable from root**.
   - All other relation kinds (`requires`, `leads_to`, `because`, `instead_of`, `example`) are cross-links.
5. **Overarching focus question**:
   - The map must define a single `focus_question` (e.g. *"How does X achieve reliable local-first synchronization?"*).
6. **Diagnostic probe questions**:
   - Include 3–5 probe questions with answers pointing to existing statement IDs.

---

## 2. Step-by-Step Authoring Workflow

When asked to map a repository or when invoked via `/repo-knowledge-map`:

### Step 1: Repository Reconnaissance
Examine the repository structure to identify:
1. Root purpose and entry points (`README.md`, `package.json`, `Cargo.toml`, etc.).
2. Architecture documents, design records, or RFCs (`docs/`, `ADR`, etc.).
3. Core domain entities, storage contracts, and module boundaries.
4. Invariants and non-negotiable design rules.

### Step 2: Formulate Root & Focus Question
1. Create the root statement capturing the repository's primary mission in $\le 140$ chars.
2. Formulate a focus question that the map will answer for newcomers.

### Step 3: Decompose into Major Subsystems (Level 1)
Create 4 to 8 major architectural domain statements connected to root via `elaborates`:
- Architecture layer separation.
- Core data models / schemas.
- Execution engine / lifecycle.
- External interfaces (APIs, CLI, UI).
- Privacy, security, or concurrency invariants.

### Step 4: Decompose Mechanisms & Invariants (Level 2)
For each major subsystem, add 2 to 4 detailed mechanism statements connected to their subsystem parent via `elaborates`:
- Specific algorithms or guarantees.
- Data structures or storage contracts.
- Boundaries (what is forbidden or strictly separated).

### Step 5: Add Cross-Cutting Relations
Add non-`elaborates` edges between statements across branches:
- Use `requires` for dependencies between mechanisms.
- Use `because` for architectural rationale.
- Use `leads_to` for cause-and-effect rules.
- Use `instead_of` when documenting architectural decisions that rejected alternatives.
- Use `example` to point to canonical reference implementations.

### Step 6: Verify Every Source Path
Check that every file path listed in `sources` actually exists on disk in the target repo:
- If a path moved or was renamed, fix it.
- Never invent placeholder paths.

### Step 7: Formulate Probe Questions
Write 3 to 5 probe questions testing critical understanding of the codebase:
- Question: "Why does subsystem X not call Y directly?"
- Answers: `["id-of-statement-1", "id-of-statement-2"]`.

### Step 8: Validate & Save
Write the result to `docs/knowledge-map/map.json`.
Run validation:
```bash
zam knowledge-map validate
```
Or if running without ZAM installed, verify that:
- JSON parses cleanly.
- All statements have $\le 140$ characters.
- Every source exists.
- The `elaborates` tree has exactly 1 root and no cycles.

---

## 3. Schema Reference (`docs/knowledge-map/map.json`)

```json
{
  "root": "my-project-core",
  "focus_question": "How does MyProject process events with zero message loss?",
  "statements": [
    {
      "id": "my-project-core",
      "statement": "MyProject is an event broker that guarantees exactly-once delivery using local log partitions.",
      "sources": [
        "README.md",
        "src/index.ts"
      ],
      "detail": "Core architectural thesis and top-level entry point."
    },
    {
      "id": "partition-log",
      "statement": "Incoming events append sequentially to immutable, disk-backed partition files.",
      "sources": [
        "src/storage/partition.ts"
      ],
      "detail": "Append-only storage contract."
    }
  ],
  "relations": [
    {
      "from": "my-project-core",
      "to": "partition-log",
      "kind": "elaborates"
    }
  ],
  "probes": [
    {
      "id": "probe-storage-durability",
      "question": "How is incoming event durability achieved before acknowledgment?",
      "answers": [
        "partition-log"
      ]
    }
  ]
}
```
