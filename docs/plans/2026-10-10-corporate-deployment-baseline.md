# Plan: Corporate Deployment Baseline, D1–D5

ADR: [2026-10-08b — Corporate Deployment Baseline](../adr/2026-10-08b-corporate-deployment-baseline.md). Owner decisions of 2026-10-10 are recorded there: Bitwarden sessions are remembered for seven days, and only in OS-protected storage. Synced keys stay on by default for personal libraries. Four tools are pre-approved. Source links may be text, code or configuration files, `.json` included.

Scope: D1–D5 on one branch (`feat/corporate-baseline`), one phase per commit series, every gap with its D9 regression test. D6 (managed policy), D7 (content marking) and D8 (supply chain) are not part of this plan.

## Phase A — Agent surface (D3, D4)

- [x] **A.1** Studio bridge allowlist: each command carries the reason it is safe for a model to call (`src/cli/commands/mcp.ts`). A test fails when a command is added without a reviewed entry (D3).
- [x] **A.2** Security switches are not writable through any tool. Audit `setting-set` and the allowlist; trusted folders (D1), secret backends and pairing stay off the Studio bridge.
- [x] **A.3** One reviewed pre-approval list (`zam_status`, `zam_get_reviews`, `zam_find_tokens`, `zam_progress_stats`) in one place, with a test. `zam agent connect codex` writes per-tool approval for exactly these tools and no `default_tools_approval_mode`. A config that still carries the old blanket approval is rewritten on the next connect, with a backup (D4).
- [x] **A.4** `readOnlyHint` only on tools that change nothing. A test lists them.
- [x] **A.5** Copilot extension loopback server: per-launch random token in the URL path, `Host` must be `127.0.0.1:<port>`, POSTs only with `Origin` equal to the host page and a JSON body; anything else gets `403`.

Done in Phase A, with deviations:

- A.1: `STUDIO_BRIDGE_COMMANDS` in `src/cli/commands/mcp.ts` maps each command to its reason and to options the panel may not pass; `backup-create --dir` is refused, because it let a caller choose where the library snapshot goes. Test: `tests/cli/studio-bridge-review.test.ts`.
- A.3: the list lives in `src/cli/agent-approval.ts`. `zam_review_action` keeps its explicit `prompt`. `writeHarnessConfig` keeps a timestamped copy of every harness file it replaces, for all harnesses (a D8 item, taken along because the Codex rewrite needs it). Test: `tests/cli/agent-approval.test.ts`, `tests/cli/agent-harness.test.ts`.
- A.4: no tool lost its hint; the reviewed list is in `tests/cli/agent-approval.test.ts`. The knowledge-map tools (alpha) take a `repo_root` and write into it; they belong to C.4.
- A.5: the checks are `src/copilot-extension/loopback-guard.ts`, shipped inside `mcp-client.bundle.mjs`; the host page uses relative paths so every request carries the token. Test: `tests/cli/copilot-loopback-guard.test.ts`.

## Phase B — One outbound fetcher (D2)

- [x] **B.1** `src/cli/net/safe-fetch.ts`: `node:http`/`node:https` with a `lookup` that validates every resolved address and pins the connection to it; `http`/`https` only, no URL credentials, no cookies; blocks loopback, private, link-local (incl. `169.254.169.254`), shared-address, multicast and unique-local ranges in every IPv6 notation; at most five redirects, each re-checked; size and time caps.
- [x] **B.2** Source links (`src/cli/review-context.ts`), web imports (`src/cli/adapters/source-reader.ts`) and curriculum pages (`fetchRawHtml` in `src/cli/commands/bridge.ts`) use it.
- [x] **B.3** Endpoint locality from the parsed host only (`local`: loopback and `localhost`; `lan`: private ranges, `*.local`, `*.home.arpa`; else `cloud`). The stored `local` flag is a display hint. Model calls and the probes of `model-upsert`/`model-reprobe` check resolved addresses against it: link-local and metadata ranges are always blocked, loopback and private ranges only for `local`/`lan` rows.
- [x] **B.4** Tests: metadata address, redirect into a private range, rebinding (a name that resolves to a private address), IPv6 notations, a probe to a link-local host, a cloud-named host resolving to a private range.

Done in Phase B, with deviations:

- B.1: `src/cli/net/safe-fetch.ts`. Every resolved address must pass, so a name that also resolves to loopback is refused rather than half-allowed. Shared-address space (`100.64.0.0/10`, Tailscale) counts as LAN. Bodies are decompressed (gzip, deflate, br) and the cap applies after decompression.
- B.2: curriculum pages get a 30 MB cap, because official curriculum PDFs are large. One `CONTENT_USER_AGENT` in `src/cli/adapters/source-reader.ts` replaces the copy in `bridge.ts`, so a release bumps one User-Agent string instead of two.
- B.3: model clients keep `globalThis.fetch`; `assertModelEndpointAllowed` runs before each call (`fetchWithInteractiveTimeout`, `isLlmOnline`, the `/models` catalogue, embeddings, the reasoning probe). Unlike content fetches, the connection is not pinned, so a rebinding window remains for model rows; D6's `llm.endpoints` is the backstop. A name that does not resolve passes to the call, which then fails on its own. `isLocalEndpoint` uses the parsed host.
- B.4: `tests/cli/safe-fetch.test.ts`, `tests/cli/model-endpoint-check.test.ts`.

## Phase C — Paths named by a caller are confined (D1)

- [ ] **C.1** Kernel resolver for paths named by a tool argument or a stored link: allowed roots are MCP client roots plus `trustedFolders[]` in `~/.zam/config.json`; a drive root, the home directory or an ancestor of it is never a root; native real path, case-insensitive containment on Windows, no `:` in names, no `\\?\` or UNC unless the root is UNC; the opened file's identity is compared with the checked path.
- [ ] **C.2** Typed refusal `path-outside-trusted-folders`, naming the fix (trust the folder in Settings).
- [ ] **C.3** Source links: local paths resolve only inside a root (never against the working directory); only text, code and configuration extensions below a size limit; dot-directories and dotfiles refused; GitHub links normalised, `..` rejected, a sibling checkout used only inside a root.
- [ ] **C.4** OKF tools: reads only `*.md` inside a root; writes only into an existing ZAM bundle or `docs/okf` under a root, never a root itself; `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md` and anything under `.github/` are reserved.
- [ ] **C.5** Trusted folders: CLI (`zam trust list|add|remove`), desktop Settings, never on the Studio bridge or MCP. A learner-started OKF import trusts its bundle's repository root.
- [ ] **C.6** Upgrade check: list the folders that existing cards' local links point into, keep those that hold an OKF bundle, offer to trust them in one step (desktop and CLI).
- [ ] **C.7** Tests: a secret file outside every root, an instruction file written through OKF upsert, `..`, symlink and junction escapes, dotfiles, a GitHub sibling outside every root.

## Phase D — Secrets (D5)

- [ ] **D.1** OS-protected storage as a `SecretBackend`: Keychain (`security -i`, secret on stdin), Secret Service (`secret-tool`, secret on stdin), DPAPI (PowerShell, secret on stdin); no native module. Unavailable means "not remembered".
- [ ] **D.2** Bitwarden: the session reaches `bw` only through that child's environment, never `--session`; item JSON on stdin; never exported into ZAM's own environment; remembered only in OS-protected storage, for seven days.
- [ ] **D.3** Literal keys in `credentials.json` move to OS-protected storage where available, resolved at start into the existing snapshot.
- [ ] **D.4** Keys follow endpoints: a URL change drops the key reference; each device remembers the endpoint it last confirmed per row in `~/.zam/config.json` and sends no key to a changed URL until the learner confirms it in Settings.
- [ ] **D.5** Keys in shared rows only in a personal library and only while the row's "use on my other devices" is on (default on); a multi-learner library never carries keys.
- [ ] **D.6** `zam settings show` and log lines mask secrets.
- [ ] **D.7** Pairing QR carries only the database URL and token; it appears after an explicit reveal, hides after 60 seconds, with a note about screen sharing. Per-device tokens only where the backend can issue them.
- [ ] **D.8** Tests: a session key in a child's command line or environment, a key sent to a changed URL, keys in a multi-learner library, a key in log output, keys in the pairing payload.

## Phase E — Docs and release

- [ ] **E.1** OKF articles that describe changed behaviour, `docs/knowledge-map/map.json`, `CLAUDE.md`/`AGENTS.md` conventions (the trust model rule for new tools).
- [ ] **E.2** Release notes: Codex users reconnect once; trusted folders; Bitwarden unlocks after seven days.
