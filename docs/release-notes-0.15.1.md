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

Rebuild/update the Companion to pick up the panel-side fixes — the OKF
panel ships inside the app bundle.
