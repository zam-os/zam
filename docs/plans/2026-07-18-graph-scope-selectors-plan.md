# Learning Graph scope selectors — plan (2026-07-18)

Request (Thomas): "The learning graph needs selectors - similar to the zam app.
Otherwise it stays usually empty. Maybe it could default to the tokens -
related to the current repo and okf bundles."

Goal: the MCP-Apps graph panel, opened without a focus, must never dead-end in
"Kein Fokus" when tokens exist. It gets scope selectors like the desktop app
(scope + domain pills + browsable token list) and defaults to tokens whose
`source_link` points into the current repo's OKF bundle (possible since the
0.14.0 import feature anchors tokens as `<article resource>#<anchor>`).

## Design

- **Repo scope, server-side**: `zam_show_graph` resolves the bundle dir via
  MCP roots (existing `resolveOkfBundleDir`), collects each article's
  source-link base (`resource` frontmatter, else resolved article path — same
  rule as `importOkfTokens`), and puts `repoScope: { label, bases }` into the
  tool result. Never fails the open: any error → no repoScope.
- **Token filter, kernel**: `ListTokensOptions.sourceLinkBases?: string[]` —
  matches `source_link = base OR source_link LIKE base||'#%' ESCAPE '\'`
  (same semantics as `getTokensBySourceLinkBase`, N bases OR-ed).
- **Bridge**: `zam bridge list-tokens --source-link-base <base>` repeatable
  (collector option). Already on the studio-bridge allowlist via list-tokens.
- **Panel** (`desktop/src/panel/graph.ts` + new pure `graph-scope.ts`):
  - Scope bar under the breadcrumb: pills `[<repo label>] [Alle]` (repo pill
    only when repoScope present) + domain pills (with `/`-prefix groups,
    ported from desktop `loadAndRenderDomains`) + scrollable token-pill list
    (click = focus, current focus highlighted).
  - No focus passed: load scoped tokens (repo scope first; empty → fall back
    to Alle), auto-focus first token with a card, else first token. Only a
    truly empty DB shows the empty message.
  - Focus passed: unchanged behavior, scope bar still shown for browsing.
  - Scope/domain switch: re-list, re-render pills + token list, focus the
    scope's default token. Context-bar user change keeps working (reload).

## Checklist

- [ ] 1. Kernel: `sourceLinkBases` filter in `listTokens` (src/kernel/models/token.ts) + kernel test
- [ ] 2. Bridge: repeatable `--source-link-base` on `list-tokens` (src/cli/commands/bridge.ts) + CLI test
- [ ] 3. `collectSourceLinkBases(dir)` in src/cli/okf/io.ts (resource ?? resolved path) + test in okf-bundle.test.ts
- [ ] 4. `zam_show_graph`: add `repoScope` to result (src/cli/commands/mcp.ts), update tool description; mcp.test.ts coverage
- [ ] 5. Pure helpers `desktop/src/panel/graph-scope.ts` (domain options w/ prefixes, domain filter, default-focus pick) + tests/desktop/graph-scope.test.ts
- [ ] 6. Panel wiring in graph.ts (scope state, bridge list-tokens call, selector bar render, bootstrap-without-focus) + CSS/containers in graph-panel.html
- [ ] 7. Docs: update docs/okf/mcp-surfaces.md if it describes the graph tool's no-focus behavior (via zam_okf_upsert only)
- [ ] 8. Build + lint + full test run, compare against 4-failure environmental baseline
- [ ] 9. E2E in real host: point Companion at dev dist (backup launch config), isolated VS Code, "Open Learning Graph" without focus → screenshot shows selectors + auto-focused graph; restore launch config
- [ ] 10. Final check: re-read this plan, verify nothing slipped; PR

## Final check record

(fill in before PR)
