# OKF import handoff — chat delivery + focused-article state (2026-07-18)

Request (Thomas): "Is there a chance you could fix the problem to not find
the chat for learn import? Or could the command come from chat - 'import the
currently focussed okf'" + "Codex also can use the vscode context knowledge."
Decision (AskUserQuestion): Both.

## Design

**A. Companion chat delivery.** The Companion webview host does not
advertise the MCP Apps `message` capability, so `app.sendMessage` always
rejects there. Fix: `host.ts` advertises `message: { text: {} }` and wires
`bridge.onmessage` → proxy request `"chatMessage"`; `extension.ts` handles
it by extracting the text blocks and calling
`vscode.commands.executeCommand("workbench.action.chat.open", { query })` —
the built-in Chat view receives the instruction. Any failure (no chat
available) returns `{ isError: true }`, which keeps the existing copy-text
fallback exactly as-is.

**B. Focused-article state (harness-agnostic).** For "import the currently
focused okf" to work from Claude Code, Copilot, AND Codex, the focus must
live where every harness already looks: the zam MCP server. Mirrors the
ui-intent pattern:
- `src/cli/okf-focus.ts`: `writeOkfFocus(file, bundleDir)` /
  `readOkfFocus()` on `~/.zam/okf-focus.json` (atomic rename write,
  `ZAM_OKF_FOCUS_PATH` env override for tests, `{version, file, bundleDir,
  updatedAt}`).
- MCP tool `zam_okf_focus` (app-only, `visibility: ["app"]`): records
  `{file, bundle_dir}`; rejects file names with path separators.
- MCP tool `zam_okf_focused` (model-visible, read-only): returns
  `{focused: {file, bundle_dir, updatedAt} | null}`; description tells the
  agent to use it when the user references "the currently focused/open
  article" and then follow the zam_okf_import contract.
- Panel `okf.ts`: after an article opens in the reader (`openArticle`),
  fire-and-forget `callTool("zam_okf_focus", {file, bundle_dir})`.
- Allowlists: `COMPANION_APPS.okf` (protocol.ts) and Copilot
  `APP_CONFIG.okf` gain `zam_okf_focus`.
- okf skill (3 copies): "import the currently focused article" flow.

## Checklist

- [ ] 1. `src/cli/okf-focus.ts` + unit test (write/read round-trip, env override, malformed file → null)
- [ ] 2. mcp.ts: `zam_okf_focus` (app-only) + `zam_okf_focused` (read-only) tools; mcp.test.ts: count 24→26, annotations, write→read round-trip (env-isolated path)
- [ ] 3. protocol.ts + copilot APP_CONFIG: allow `zam_okf_focus` for the okf app; contract test update
- [ ] 4. okf.ts: record focus on article open (fire-and-forget, never breaks the reader)
- [ ] 5. host.ts: `message` capability + onmessage → "chatMessage" proxy request
- [ ] 6. extension.ts: chatMessage handler → workbench.action.chat.open; `{isError:true}` on failure
- [ ] 7. okf skill triplet: focused-article import phrase
- [ ] 8. Docs: mcp-surfaces.md (tool surface + panel handoff paragraph) via zam_okf_upsert
- [ ] 9. Build + lint + full tests vs 3-4-failure environmental baseline
- [ ] 10. E2E: isolated VS Code — open panel, select article, `zam_okf_focused` returns it; button click → chat.open path or graceful fallback; screenshot
- [ ] 11. Final check vs plan; PR

## Final check record

(fill in before PR)
