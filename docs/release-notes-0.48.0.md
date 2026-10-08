# ZAM 0.48.0 — Knowledge maps in VS Code and the browser

A repository's knowledge map used to open only in ZAM Studio. Now it also
opens where you work: in the VS Code Companion, in AI assistants that show
ZAM's panels, and as a page in your browser. And a map now stays current the
way the knowledge articles do.

## Knowledge maps where you work (alpha)

- **In VS Code.** Run **ZAM: Show Knowledge Map** from the command palette.
  The Companion opens the map of the folder you have open, in the view you
  chose in Studio Settings. Every other view, C4 included, is one click away.
- **In your AI assistant.** Ask your assistant to show the knowledge map.
  An assistant that shows ZAM's panels opens it the same way it opens Recall
  or the knowledge base. In VS Code the Companion opens it too.
- **In the browser.** `zam knowledge-map view` opens the map of the current
  repository as a page of its own that fills the window. The page needs
  nothing else, so you can save it with `--out map.html` and send it on.
- **No map yet?** You see ZAM's own map as an example, with a note that says
  so. Never an empty page.
- **Still an alpha.** Like the Studio page, it needs **Knowledge map
  (Alpha)** switched on in Studio Settings. If it is off, VS Code tells you.
  After you switch it on, reload the VS Code window.

## A map stays current

- When you or your assistant build a map, the guide now asks for one more
  thing: a change that makes a statement untrue, or moves or deletes a file
  a statement cites, updates the map in the same change. After saving a new
  map, the assistant offers to write that rule into the repository's
  instructions.
- `zam knowledge-map validate` fails while a map has errors, so it can run
  as a check in CI.

## Worth knowing

- No schema change: libraries open exactly as before.
- The prototype page (`npm run knowledge-map:prototype`) is now the same page
  that `zam knowledge-map view` writes.
- Design note: ADR 2026-10-03, addition of 2026-10-08.
- Updating from 0.47.1: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.48.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
