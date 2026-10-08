/**
 * The authoring guide an agent follows to build a knowledge map for any
 * repository (ADR 2026-10-03, Decision 5). Served by the
 * `zam_knowledge_map_guide` MCP tool, so it ships and versions with the
 * validator it describes; the `zam` skill only points at that tool.
 */

import {
  C4_KINDS,
  KNOWLEDGE_MAP_FORMAT,
  KNOWLEDGE_MAP_SCHEMA_URL,
  KNOWLEDGE_MAP_VERSION,
  MAX_C4_NAME_LENGTH,
  MAX_CONCEPT_LABEL_WORDS,
  MAX_LINK_PHRASE_WORDS,
  MAX_STATEMENT_LENGTH,
  MAX_TECHNOLOGY_LENGTH,
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
- \`label\` (required): at most ${MAX_CONCEPT_LABEL_WORDS} words, the concept the concept-map
  view draws and the default name of a C4 box. The sentence stays in \`text\`.
- \`link\` (required on every statement except the root): at most ${MAX_LINK_PHRASE_WORDS} words
  from the parent concept to this one, such as "keeps" or "is scheduled by",
  so that "parent label + link + label" reads as a sentence.
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
- A \`uses\` B: A calls, reads, writes or depends on B at run time. This is the
  kind for architecture links between C4 elements (section 5).

Allowed kinds: ${RELATION_KINDS.join(", ")}.

A relation may carry a \`link\`: at most ${MAX_LINK_PHRASE_WORDS} words from \`from\` to \`to\`
that say what happens ("stores cards in", "calls tools of"), so that "from
label + link + to label" reads as a sentence. It wins over a child's own
\`link\` when the pair is also parent and child. The concept map reads it
between the labels, and the C4 view draws it on the arrow. It is required on
every \`uses\` relation; on other relations it is expected, and a relation
without one gets a warning because the concept map leaves it out. A \`uses\`
relation may also name its \`technology\` ("SQL", "MCP over stdio").

## 5. Architecture (C4)

The same map also describes the architecture, so the Studio can draw C4
diagrams from system context down to components. Mark the statements that
stand for an architecture element with a \`c4\` object. The statement text is
the element's one-sentence description.

- \`kind\`: one of ${C4_KINDS.join(", ")}.
  - \`person\`: someone who uses the system (add a statement for them).
  - \`system\`: the software system this repository builds, usually on the
    root, and other systems it talks to.
  - \`container\`: something that runs or is deployed on its own: an app, a
    service, a CLI, a library loaded at run time.
  - \`database\`: a container that stores data.
  - \`component\`: a major part inside one container.
- \`name\`: optional, the name drawn in the box, at most ${MAX_C4_NAME_LENGTH} characters.
  Without it the box shows the statement's \`label\`.
- \`technology\`: optional, at most ${MAX_TECHNOLOGY_LENGTH} characters ("Node.js", "PostgreSQL").
- \`external\`: true for systems and services outside this repository.
- \`within\`: the element this one sits in: a system for a container or
  database, a container or database for a component. Leave it out when that
  element is an ancestor in the statement tree; set it when the statement sits
  elsewhere in the tree (for example a component explained under a feature).

Aim for 1 to 3 people, the system, its external systems, 3 to 8 containers,
and components only for the containers that matter most. Connect them with
\`uses\` relations that carry a \`link\`. A link between components rolls up to their
containers in the container view, so do not repeat it at every level.

## 6. File format

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
    { "id": "project", "label": "Project", "text": "One sentence on what the repository is for.", "sources": ["README.md"],
      "c4": { "kind": "system" } },
    { "id": "api", "parent": "project", "label": "API", "link": "is served by", "text": "A REST API serves the web app and the partners.", "sources": ["src/api/"],
      "c4": { "kind": "container", "technology": "Node.js" } },
    { "id": "storage", "parent": "api", "label": "Order database", "link": "keeps data in", "text": "All data lives in one PostgreSQL database.", "sources": ["docs/architecture.md"],
      "c4": { "kind": "database", "technology": "PostgreSQL" } },
    { "id": "no-orm", "parent": "storage", "label": "Plain SQL", "link": "is queried with", "text": "Queries are plain SQL files instead of an ORM.", "sources": ["src/db/queries/"] },
    { "id": "orm", "parent": "no-orm", "label": "ORM", "link": "replaces", "text": "An ORM would hide the query plans the team tunes by hand.", "sources": ["docs/adr/0003-sql.md"] }
  ],
  "relations": [
    { "from": "api", "to": "storage", "kind": "uses", "link": "reads and writes", "technology": "SQL" },
    { "from": "no-orm", "to": "orm", "kind": "instead_of", "link": "replaces" }
  ]
}
\`\`\`

- \`id\`: a lowercase slug (letters, digits, hyphens), unique and stable.
  When updating a map, keep existing ids.
- \`repository_url\` is optional: the base a source path is appended to, so the
  Studio can open sources in the browser. Leave it out if you do not know it.
- \`language\`: the language the statements are written in. Write them in the
  repository's documentation language unless the user asks otherwise.
- The saved file is JSON-LD: ZAM adds the \`@context\` and the \`$schema\` link
  (${KNOWLEDGE_MAP_SCHEMA_URL})
  itself, so you do not write either.

## 7. Save and check

Call \`zam_knowledge_map_write\` with the whole map. It checks every rule above,
lists every problem, and writes docs/knowledge-map/map.json only when there is
no error. Fix the errors and call it again. Warnings (for example more than
${SOFT_MAX_CHILDREN} details under one statement) are advice.

Then tell the user the map is ready in ZAM Studio under "Knowledge map"
(Wissenskarte), which shows this repository's map from now on. In VS Code,
the Companion command "ZAM: Show Knowledge Map" opens it as well, and
\`zam knowledge-map view --repo <path>\` opens it in the browser.

Without ZAM's MCP tools, write the file yourself and run
\`zam knowledge-map validate --repo <path> --write\`. It prints every problem,
exits with 1 while there are errors, and once the map is valid rewrites it
with the JSON-LD context and schema link.

## 8. Keep it current

A map goes stale like any other documentation, and a stale statement teaches
the wrong thing. Treat it like the repository's other living docs:

- A change that makes a statement untrue, or renames, moves or deletes a file
  a statement cites, updates the map in the same change. Keep existing ids;
  only a new statement gets a new id.
- Check the map after every such change: \`zam_knowledge_map_write\`, or
  \`zam knowledge-map validate --repo <path>\`, which exits with 1 while there
  are errors and so also works as a CI step. The check finds missing sources
  and broken structure, not a statement that has become false: that part is
  the change author's.
- After saving a new map, offer the user to write that rule into the
  repository's agent instructions (CLAUDE.md, AGENTS.md or the like), next to
  any same-change rule its documentation already has. Write it only if the
  user agrees.
`;
