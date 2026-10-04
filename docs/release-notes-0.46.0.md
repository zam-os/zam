# ZAM 0.46.0 — Knowledge map (alpha)

A new alpha for finding your way around a repository. Your agent writes down
what a repository knows, one short statement at a time, each with the files
it comes from. ZAM shows it as a map you can click through: one statement in
the centre, its connections around it, and together they read as the bigger
picture. The alpha ships eight ways of drawing that map. Your feedback decides
which of them gets more work.

## Knowledge map (alpha)

- **Off until you switch it on.** In **Settings**, choose **Advanced**, then
  **Enable the knowledge map (Alpha)** on the **Knowledge map** card.
  **Knowledge map** then appears in the Studio. Nothing changes for anyone
  who leaves it off.
- **Your agent builds the map.** Ask your connected agent for a knowledge map
  of the repository you are working in. It reads the repository and saves
  the map as `docs/knowledge-map/map.json`, a file you can commit and review
  like any other document. Every statement names the files it comes from,
  and ZAM checks that they exist before it saves. An agent that was already
  running when you switched the alpha on needs a restart first. Agents
  without MCP use `zam knowledge-map guide` and
  `zam knowledge-map validate --write`.
- **Works for any repository.** The Studio shows the map your agent wrote
  last. **Choose repository…** opens another one. A repository without a map
  shows ZAM's own map as an example.
- **Click to move.** Click a statement to put it in the centre. The path back
  to the top stays visible, and the files behind a statement are listed
  beside it.
- **Eight views to compare.** Pick one on the **Knowledge map** card in
  Settings; the page names the view you are looking at:
  - **Outline**, as the baseline;
  - **Focus map**, **Levels** and **C4 architecture**, built by Claude;
  - **Radial ego map**, **Causal tree** and **Zoned facets**, built by
    Gemini;
  - **Concept map**, built by Grok.
- **Tell us which view helps.** Under each view you rate how helpful it was,
  say whether you found what you were looking for, and add a comment. The
  feedback stays on your device until you press **Copy all feedback** and
  send it to us.

## Worth knowing

- No schema change; nothing to migrate.
- This is an alpha: rough edges are expected, and views may change or
  disappear depending on your feedback.
- The map file is JSON-LD with a published JSON schema
  (`docs/knowledge-map/map.schema.json`), so other tools can read it. The C4
  view draws from the same file: a statement can mark itself as a person, a
  system, a container, a database or a component.
- Design note: ADR 2026-10-03; current behaviour in `docs/okf/mcp-surfaces.md`.
- Updating from 0.45.2: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.46.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
