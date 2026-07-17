# ZAM 0.13.0 — OKF visualizer panel

ZAM 0.13.0 turns any OKF knowledge bundle into a browsable panel that opens
right inside your agent host. Point it at a bundle and you get the articles,
their links, the decisions they cite, and the update history — without
leaving the tool you already work in.

## Highlights

- **`zam_okf_visualize` opens an OKF visualizer panel** (a new MCP Apps
  surface, `ui://zam/okf`) for any OKF bundle: a sidebar of articles grouped
  by `type` with search, a markdown reader with a frontmatter meta strip, a
  link graph, and the `log.md` history. It resolves the bundle directory the
  same way the other `zam_okf_*` tools do and never fails to open — a
  missing or invalid bundle shows a problem state instead of erroring.
- **Cited decision records expand inline.** Articles routinely cite ADRs
  with relative links like `../adr/…`; the panel now reads and renders those
  inline through a new `zam_okf_read_citation` tool, so you can follow the
  *why* behind an article without hunting for the file.
- **The link graph shows structure at a glance.** Articles are nodes grouped
  by type; inter-article links are edges; cited decision records appear as
  visually distinct nodes. Click a node to open it in the reader.
- **The header reflects the bundle**, showing its own `okf_version` when
  known rather than the app version.
- **`zam_okf_catalog` gains `include_log`**, returning the bundle's update
  log alongside the catalog in a single call.

## Fixes and hardening

- **Scoped, safe citation reads.** `zam_okf_read_citation` resolves only
  repo-relative `.md` targets and refuses to escape the repository root —
  absolute paths, `..` traversal, and authority-relative (`//host`,
  `\\host`) targets are all rejected, with a realpath check that also
  blocks symlink escapes.
- **The panel renderer is XSS-safe.** All content is HTML-escaped before
  rendering, and link targets pass a scheme allowlist (http/https/mailto),
  so `javascript:`/`data:` URIs and off-origin authority links render inert.
- **CLI-layer only.** The panel and its tools add no kernel code and no new
  dependencies; the learning engine is untouched.
