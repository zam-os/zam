# ZAM 0.15.3 — reliable OKF switching, re-imports, and bridge errors

A patch release that closes the live-test findings from issue #188 across
the VS Code Companion, OKF learning import, the JSON bridge, and the local
verification workflow.

## Fixed

- **Deterministic Companion panel switching.** Overlapping Recall, Graph,
  Settings, and OKF webview replacements are now serialized and coalesced by
  recency. The latest requested panel always mounts last, so switching from
  Recall to the OKF Knowledge Base can no longer leave the stale Recall iframe
  visible.
- **Exact prerequisite reconciliation on OKF re-import.** Each confirmed
  token's submitted prerequisite list is now its complete desired set.
  Re-import removes obsolete edges as well as adding new ones; an empty list
  clears the set. Reconciliation remains inside the import transaction, so a
  cycle rejection restores both the prior token content and graph.
- **JSON-only bridge parse failures.** Missing required options and unknown
  flags are intercepted before Commander writes human-readable stderr. They
  now return the standard JSON error envelope on stdout with a non-zero exit
  status.
- **Clean-checkout test reliability.** `npm test` now builds the CLI and MCP
  App resources it exercises before Vitest starts. Test results no longer
  depend on an ignored, possibly stale `dist/` directory.

## Verification

The release includes regression coverage for an overlapping Recall-to-OKF
mount, prerequisite removal and cycle rollback, both Commander error classes,
and a test invocation that prepares its own production bundles.

See [issue #188](https://github.com/zam-os/zam/issues/188) for the original
live reproductions.
