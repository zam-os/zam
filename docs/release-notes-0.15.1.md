# ZAM 0.15.1 — the knowledge base survives Windows

A patch release: OKF bundles checked out on Windows now parse, render,
and graph.

## Fixed

- **CRLF bundles load.** Git's `autocrlf` delivers CRLF files on Windows
  checkouts; the OKF frontmatter parser, the panel's frontmatter strip,
  and the markdown renderer split on `\n` only, so every line kept a
  trailing `\r` that defeated the `$`-anchored key-value, heading, fence,
  and list patterns. Every article failed with `frontmatter line 2:
  expected "key: value"`, and the Companion OKF panel showed neither the
  catalog nor the graph. All three seams now split CRLF-safe and emit
  LF-normalized text. Verified against a real 41-article bundle: before,
  all articles rejected; after, 41 articles, 4 type groups, and a
  42-node/92-edge graph. (#185)
- **BOM tolerance.** A UTF-8 BOM (some Windows editors) no longer defeats
  the `---` fence checks in the parser and the panel reader. (#185)
- **appendLog normalizes.** Appending to a CRLF or BOM-carrying `log.md`
  now emits a uniformly LF-normalized log instead of mixed line endings,
  and the fenced-code scanner that guards graph link extraction splits
  CRLF-safe. (#185)

## Notes

**Update the `zam-core` CLI, not just the Companion.** The catalog-blocking
bug is in the OKF frontmatter *parser*, which runs inside the `zam mcp`
server — i.e. the global `zam-core` CLI, a separate artifact from the
Companion VSIX. Updating the extension alone leaves a stale CLI parsing
CRLF bundles, so the OKF panel stays empty. Update the CLI with:

```sh
npm install -g zam-core@0.15.1
```

then reload the VS Code window so the Companion respawns `zam mcp`. The
panel also carries fixes (frontmatter strip and renderer ship in the app
bundle), so update the Companion too — but the CLI is the one that
unblocks the catalog. 0.15.2 adds a launch-time guard that warns when the
two versions drift, so this can't fail silently again.
