# ZAM 0.14.0 — knowledge becomes learning

ZAM 0.14.0 closes the loop between the OKF knowledge base and the learning
engine: an article you want to *retain* becomes learning tokens — decomposed
by your agent, scheduled by ZAM.

## Highlights

- **Knowledge-to-learning import (`zam_okf_import`).** Your agent reads an
  OKF article in full, extracts the concepts worth remembering (recall-speed
  knowledge — look-up facts stay in the article), judges a Bloom level and a
  domain per concept, arranges them in prerequisite order, and records the
  decomposition atomically: tokens, cards for the importing user, and
  anchored source links back into the article. Decomposition is deliberately
  the agent's job — ZAM ships no mechanical splitter (ADR 2026-07-18). Also
  available as `zam bridge okf-import`.
- **Re-import is a lifecycle, not an overwrite.** When an article changes,
  each concept is classified: new concepts are added, obvious updates keep
  your learning state, changed concepts reset it to the beginning (the old
  knowledge is irrelevant — learn it fresh), and unconfirmed tokens move to
  a new **maintenance state** — kept and repairable, never deleted, excluded
  from scheduling until re-bound.
- **Import from the visualizer.** The OKF panel's article reader gains an
  "import as learning content" action that hands the decomposition request
  to your agent through the host conversation; hosts without a chat show the
  instruction as copyable text.
- **The OKF panel joins the Companion.** The VS Code Companion sidebar gains
  a Knowledge Base surface next to Recall and Settings — the title-bar slot
  toggles between the Knowledge Base and the Learning Graph — and a
  `zam-knowledge` canvas joins the GitHub Copilot extension.
- **A much nicer panel.** The reader no longer renders the frontmatter
  fence, keeps wrapped list items intact, and shows date-only timestamps;
  the link graph lays articles and their cited ADRs out on labeled,
  proximity-aware rings with curved edges and hover highlighting; a folder
  selector replaces the dead end when no bundle is found.

## Fixes and hardening

- **OKF tools now default to your workspace, not the server's cwd.** A
  host-spawned MCP server often runs from the editor's installation
  directory; the okf tools now resolve `docs/okf` under the client's
  workspace root (MCP roots), and the Companion spawns its server with the
  workspace as cwd.
- **`zam_okf_visualize` reaches the Companion.** 0.13.0 published a UI
  intent the Companion could not parse; the okf app is now registered in
  both the VS Code Companion and the Copilot extension, and a contract test
  keeps the intent producer and consumer in sync.
- **Learning-state safety.** The maintenance state and the learning-state
  reset are kernel primitives with their own tests; a narrower re-import can
  never silently erase learning history.
