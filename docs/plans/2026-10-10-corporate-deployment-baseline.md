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

- [x] **C.1** Kernel resolver for paths named by a tool argument or a stored link: allowed roots are MCP client roots plus `trustedFolders[]` in `~/.zam/config.json`; a drive root, the home directory or an ancestor of it is never a root; native real path, case-insensitive containment on Windows, no `:` in names, no `\\?\` or UNC unless the root is UNC; the opened file's identity is compared with the checked path.
- [x] **C.2** Typed refusal `path-outside-trusted-folders`, naming the fix (trust the folder in Settings).
- [x] **C.3** Source links: local paths resolve only inside a root (never against the working directory); only text, code and configuration extensions below a size limit; dot-directories and dotfiles refused; GitHub links normalised, `..` rejected, a sibling checkout used only inside a root.
- [x] **C.4** OKF tools: reads only `*.md` inside a root; writes only into an existing ZAM bundle or `docs/okf` under a root, never a root itself; `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md` and anything under `.github/` are reserved.
- [x] **C.5** Trusted folders: CLI (`zam trust list|add|remove`), desktop Settings, never on the Studio bridge or MCP. A learner-started OKF import trusts its bundle's repository root.
- [x] **C.6** Upgrade check: list the folders that existing cards' local links point into, keep those that hold an OKF bundle, offer to trust them in one step (desktop and CLI).
- [x] **C.7** Tests: a secret file outside every root, an instruction file written through OKF upsert, `..`, symlink and junction escapes, dotfiles, a GitHub sibling outside every root.

Done in Phase C, with deviations:

- C.1: `src/kernel/system/trusted-paths.ts`. Only the real path decides containment; a lexical pre-check failed on macOS's `/var` → `/private/var` alias and was dropped. The file identity check compares device and inode of the opened file with the checked path.
- C.3: `file://` links (material imports) are converted before the check, so image links get "not a text file type" instead of being read as text. Relative links are tried against each root in turn.
- C.4: the knowledge-map tools (alpha) are confined the same way. `zam_okf_visualize` and `zam_knowledge_map_show` still open their panel and show the refusal as a problem. `loadBundle` skips an article that is a link out of its bundle. `zam_material_import` ignores a file path outside every root (no link, no ZAM fingerprint) instead of refusing the import, so a photo from Downloads still works; learner-picked files in desktop and CLI are not confined.
- C.5: there is no learner-only OKF import: every import goes through an agent (`zam_okf_import`, `zam bridge okf-import`). Instead of trusting on import, the upgrade check is a standing offer: `zam trust list` / `zam trust suggested`, and a "Trust these folders" button in Settings → Data. Desktop Settings uses the bridge commands `trusted-folders`, `trusted-folder-add`, `trusted-folder-remove` and `trusted-folder-add-suggested`, none of which is on the Studio allowlist.
- C.6: the offer covers only folders that hold a ZAM knowledge base (ADR). Links to other local files, such as scripts in a work repository, need the learner to trust the folder once; the refusal says how.
- C.7: `tests/kernel/trusted-paths.test.ts`, `tests/kernel/reference-resolver.test.ts`, `tests/cli/okf-confinement.test.ts`, `tests/cli/trusted-folders.test.ts`, `tests/cli/material-import.test.ts`.

## Phase D — Secrets (D5)

- [x] **D.1** OS-protected storage as a `SecretBackend`: Keychain (`security -i`, secret on stdin), Secret Service (`secret-tool`, secret on stdin), DPAPI (PowerShell, secret on stdin); no native module. Unavailable means "not remembered".
- [x] **D.2** Bitwarden: the session reaches `bw` only through that child's environment, never `--session`; item JSON on stdin; never exported into ZAM's own environment; remembered only in OS-protected storage, for seven days.
- [x] **D.3** Literal keys in `credentials.json` move to OS-protected storage where available, resolved at start into the existing snapshot.
- [x] **D.4** Keys follow endpoints: a URL change drops the key reference; each device remembers the endpoint it last confirmed per row in `~/.zam/config.json` and sends no key to a changed URL until the learner confirms it in Settings.
- [x] **D.5** Keys in shared rows only in a personal library and only while the row's "use on my other devices" is on (default on); a multi-learner library never carries keys.
- [x] **D.6** `zam settings show` and log lines mask secrets.
- [x] **D.7** Pairing QR carries only the database URL and token; it appears after an explicit reveal, hides after 60 seconds, with a note about screen sharing. Per-device tokens only where the backend can issue them.
- [x] **D.8** Tests: a session key in a child's command line or environment, a key sent to a changed URL, keys in a multi-learner library, a key in log output, keys in the pairing payload.

Done in Phase D, with deviations:

- D.1: `src/kernel/secrets/os-store.ts` holds the three stores; `src/kernel/secrets/backends/os.ts` is the `os://` backend. Reads of one start go to the store as one batch, so Windows pays one PowerShell launch, not one per key. Every store command is killed after 20 seconds, and macOS counts as available only with a default keychain: without one, `security add-generic-password` waits for a new keychain's password forever (seen with a temporary `HOME`). Verified against the real macOS Keychain; Linux and Windows are covered by tests with a recorded runner only. Tests never touch the developer's keychain (`ZAM_OS_SECRET_STORE=off` in the test setup).
- D.2: `src/kernel/secrets/session-store.ts`. A session the learner exported as `BW_SESSION` before starting ZAM is used but not re-exported. The plain session file of older releases is moved into OS storage once and deleted, and deleted even where there is no OS storage. The learner-facing copy says seven days.
- D.3: `moveLiteralSecretsToOsStore` in `src/kernel/credentials.ts` runs at every CLI start (`registerCliProcessServices`) and right after a key or library token is saved through the bridge. A field is rewritten only after its value reads back unchanged; a field another writer changed meanwhile stays as that writer left it. Each moved secret gets its own name (`credential:<field>:<random>`), so a kept previous library cannot collide with the current one. Entries ZAM created are listed in `osSecrets` and deleted only at a later start once nothing refers to them; deleting at once would break the undo of a library switch that did not verify. A library token in a keychain ZAM cannot read fails with `OS_SECRET_UNAVAILABLE` instead of opening an empty local database; Bitwarden prompts count only vault references. Bitwarden seed and disconnect treat `os://` secrets as local. An older ZAM release cannot read an `os://` reference, so mixed versions on one machine (a global npm CLI older than the desktop app) need the update too. There is no command that moves a secret back into the plain file (owner decision 2026-10-10): a library whose token is out of reach, such as a Linux keychain over SSH, gets a new token instead, which is easy to create.
- D.4: `src/kernel/system/endpoint-confirmation.ts`. A row seen for the first time is confirmed as it stands (trust on first use). The rule covers model calls, probes and re-probes of stored rows, and legacy provider records. Desktop Settings confirms the address it saves (`model-upsert --confirm-endpoint`) and shows a changed row with a "Confirm new address" button (`model-confirm-endpoint`); the CLI has `zam trust endpoints` and `zam trust endpoint <id>`. The Studio panel may pass neither `--key-ref` nor `--confirm-endpoint`. Saving a new address in Settings still sends the stored key there, with a note under the key field; the learner's own Settings form counts as naming the key again. The phone keeps no confirmations: every key it can use already sits in the library, readable with the same token, so a confirmation would protect nothing there. The legacy single-endpoint settings (`llm.url` with `llm.api_key`) are not covered for the same reason.
- D.5: the multi-learner library is the team library (PostgreSQL), the same split the settings scopes use. Its rows are written without keys and keys someone wrote there anyway are ignored on read. "Use this key on my other devices" (`model-key-sync`) is per cloud row; turning it off first moves a key that reached this device only inside the row into this machine's credentials, so the row keeps working here.
- D.6: log lines of `bridge serve` go through `redactCommand`, except the start line, which holds only paths and exists to show a wrong home directory. Request lines name the command as `command <name>`, because the redactor hid `cmd=<name>`.
- D.7: the payload was already key-free. The QR hides after 60 seconds (`PAIRING_QR_VISIBLE_MS`) with a note about screen sharing. Per-device tokens are not issued: Turso hands out database tokens only through its platform API, which ZAM does not hold.
- D.8: `tests/cli/bitwarden-password-handling.test.ts`, `tests/kernel/bitwarden-session-store.test.ts`, `tests/kernel/os-secret-store.test.ts`, `tests/kernel/credentials-os-store.test.ts`, `tests/cli/keys-follow-endpoints.test.ts`, `tests/cli/model-registry.test.ts`, `tests/kernel/secret-masking.test.ts`, `tests/cli/mobile-pairing.test.ts`, `tests/desktop/pairing-qr-visibility.test.ts`.

## Phase E — Docs and release

- [x] **E.1** OKF articles that describe changed behaviour, `docs/knowledge-map/map.json`, `CLAUDE.md`/`AGENTS.md` conventions (the trust model rule for new tools).
- [x] **E.2** Release notes: Codex users reconnect once; trusted folders; Bitwarden unlocks after seven days.

Done in Phase E, with deviations:

- E.1: a new article, `docs/okf/agent-trust-model.md`, states the rule and what each surface does with it, ending in a four-point checklist for new tools; `mcp-surfaces.md`, `bridge-protocol.md`, `voice-mode.md` and `material-import.md` were updated and point to it. The knowledge map gained three statements under "Agents" (`untrusted-callers`, `trusted-folders`, `keys-follow-endpoints`). The convention in `CLAUDE.md` and `AGENTS.md` names the four checks.
- E.2: `docs/release-notes-0.50.0.md`, assuming the next release is 0.50.0; the release PR renames it if not. The notes also tell learners to update every ZAM on a computer together, because older versions cannot read keys in the keychain.
