/**
 * The authoring guide an agent follows to build a knowledge map for any
 * repository (ADR 2026-10-03, Decision 5). Served by the
 * `zam_knowledge_map_guide` MCP tool, so it ships and versions with the
 * validator it describes; the `zam` skill only points at that tool.
 */

import {
  KNOWLEDGE_MAP_FORMAT,
  KNOWLEDGE_MAP_VERSION,
  MAX_STATEMENT_LENGTH,
  RELATION_KINDS,
  SOFT_MAX_CHILDREN,
} from "./model.js";

export const KNOWLEDGE_MAP_GUIDE = `# Building a repository knowledge map (ZAM, alpha)

Goal: a navigable map of what this repository knows, for a person who has to
understand it. Every node is ONE statement. Read together with its neighbours,
a statement forms a bigger claim, so the connections matter as much as the
statements.

## 1. Read before writing

Read the repository's own knowledge first: README, docs/, architecture notes,
decision records (ADRs), an OKF bundle (docs/okf) if present, CONTRIBUTING,
and the layout of the main source folders and entry points. Prefer documented
truth. A statement taken from code cites that file. Never invent: if you are
not sure a statement is true, leave it out.

## 2. Shape

- One root statement: what this repository is for, in one sentence.
- \`focus_question\`: the question the map answers for a newcomer,
  e.g. "How does <project> turn X into Y?".
- Below the root: 3 to ${SOFT_MAX_CHILDREN} statements for the main areas. Below each, 2 to ${SOFT_MAX_CHILDREN}
  details. Three or four levels are plenty. A typical repository needs 40 to
  120 statements.
- Every statement except the root names exactly one \`parent\`: the statement
  it spells out in detail. The parents form a tree, and every statement must
  be reachable from the root.
- \`relations\` add cross-links between any two statements. Add them where a
  reason, a dependency, a consequence or a rejected alternative matters,
  typically 15 to 40. A relation between a statement and its own parent or
  child is allowed: it replaces the plain "in detail" reading with a reason.
  Join a pair of statements at most once.

## 3. Writing statements

- One declarative sentence of at most ${MAX_STATEMENT_LENGTH} characters, on one line.
- A claim, not a topic title: "Sessions expire after 30 minutes without
  activity." rather than "Session handling".
- Understandable on its own: name the subject instead of "it" or "this".
- Use the repository's own terms.
- Every statement lists at least one source: a repository-relative path,
  optionally with a #anchor (e.g. "docs/adr/0007-caching.md" or
  "src/auth/session.ts"). Never a URL; the file must exist.

## 4. Relation kinds (direction matters)

- A \`because\` B: B is a reason for A.
- A \`requires\` B: A only holds or works if B holds.
- A \`leads_to\` B: A causes or results in B.
- A \`instead_of\` B: A was chosen over B. B is the rejected alternative,
  written as its own statement (often a child of A).
- A \`example\` B: B is an instance of A.

Allowed kinds: ${RELATION_KINDS.join(", ")}.

## 5. File format

\`\`\`json
{
  "format": "${KNOWLEDGE_MAP_FORMAT}",
  "version": ${KNOWLEDGE_MAP_VERSION},
  "title": "Project name",
  "focus_question": "How does the project ...?",
  "language": "en",
  "repository_url": "https://github.com/<owner>/<repo>/blob/main/",
  "root": "project",
  "statements": [
    { "id": "project", "text": "One sentence on what the repository is for.", "sources": ["README.md"] },
    { "id": "storage", "parent": "project", "text": "All data lives in one PostgreSQL database.", "sources": ["docs/architecture.md"] },
    { "id": "no-orm", "parent": "storage", "text": "Queries are plain SQL files instead of an ORM.", "sources": ["src/db/queries/"] },
    { "id": "orm", "parent": "no-orm", "text": "An ORM would hide the query plans the team tunes by hand.", "sources": ["docs/adr/0003-sql.md"] }
  ],
  "relations": [
    { "from": "no-orm", "to": "orm", "kind": "instead_of" }
  ]
}
\`\`\`

- \`id\`: a lowercase slug (letters, digits, hyphens), unique and stable.
  When updating a map, keep existing ids.
- \`repository_url\` is optional: the base a source path is appended to, so the
  Studio can open sources in the browser. Leave it out if you do not know it.
- \`language\`: the language the statements are written in. Write them in the
  repository's documentation language unless the user asks otherwise.

## 6. Save and check

Call \`zam_knowledge_map_write\` with the whole map. It checks every rule above,
lists every problem, and writes docs/knowledge-map/map.json only when there is
no error. Fix the errors and call it again. Warnings (for example more than
${SOFT_MAX_CHILDREN} details under one statement) are advice.

Then tell the user the map is ready in ZAM Studio under "Knowledge map"
(Wissenskarte), which shows this repository's map from now on.
`;
