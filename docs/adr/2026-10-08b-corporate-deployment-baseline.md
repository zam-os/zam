# Corporate Deployment Baseline: Agents and Shared Content Are Untrusted

**Status:** Proposed
**Date:** 2026-10-08
**Deciders:** Thomas (project owner), after external review
**Review:** first model review (Fable) on 2026-10-08; its findings are applied below
**Related:** [ADR 2026-10-08 — Observation without content](2026-10-08-skill-learner-observation.md) (companion: everything ZAM observes) · [ADR 2026-07-06a — MCP agent transport and surfaces](2026-07-06a-mcp-agent-transport-and-surfaces.md) · [ADR 2026-07-17 — OKF knowledge base](2026-07-17-okf-knowledge-base.md) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-30b — Credential secret backends](2026-07-30b-credential-secret-backends.md) · [ADR 2026-07-23 — Online-only server database and mobile gating](2026-07-23-online-only-server-db-and-mobile-gating.md) · [ADR 2026-07-07 — Resilient self-update](2026-07-07-resilient-self-update-and-dependency-isolation.md) · [ADR 2026-06-21 — Code signing and trusted installers](2026-06-21-code-signing-and-trusted-installers.md) · [ADR 2026-09-04 — Team library pilot](2026-09-04-team-library-postgres-entra-pilot.md)
**Amends on acceptance:** ADR 2026-07-30b (Decision 7 and Bitwarden session persistence), ADR 2026-07-12 (keys in shared model rows), ADR 2026-07-07 (what counts as a developer checkout).

---

## Context

### Why now

An enterprise security review of `zam-core` 0.43.2, a static source review, concluded "allow with conditions". Local use with local or no models is acceptable: ZAM has no telemetry, its MCP server is stdio-only, SQL is parameterised throughout, zip import is guarded, the desktop app has a strict CSP, and npm releases carry provenance. The review's main point was a different one: **the real risk is ZAM combined with an AI agent.** A prompt-injected agent can use ZAM's tools to reach things it should not, and several of those tools are marked or configured so that hosts approve them without asking.

The review ends with rollout conditions for colleagues: pin the version, keep observation off, keep per-tool approval on, use local models only, no secret sync, no shared database, no mobile pairing. Each condition is a setting or a habit the learner has to remember. ZAM enforces none of them, and an agent can change some of them.

Every finding below was re-checked against `main` at 87955c59 (0.47.1). Observation findings belong to the companion ADR 2026-10-08. This ADR covers the rest.

### Trust model

ZAM has never written its trust model down. The gaps below follow from that.

| Actor | Trusted? | Reason |
|---|---|---|
| The learner at the keyboard | Yes | ZAM acts for them |
| The machine's administrator or organisation | Yes | Sets policy for the machine |
| An agent connected through MCP or `zam bridge` | **No** | It reads content from many sources, inside and outside ZAM, and any of them can inject instructions |
| Content in the library: cards, OKF articles, source links, imports | **No** | In a shared library one curator's content reaches every learner's agent |
| The database host, and anyone holding the library's token | For learning state, **not** for where secrets go | Cloud model rows carry URL and key together, so whoever can rewrite a row can redirect the key |
| Other local processes and web pages in the learner's browser | **No** | They can reach loopback ports |
| Model and database endpoints the learner configured | For what the learner sends them | They receive learning content by design |

Out of scope: an agent with unrestricted shell access (it does not need ZAM to do harm), and a machine that is already compromised.

The rule that follows: **a ZAM tool must be safe for a host to approve automatically.** Hosts approve tools marked `readOnlyHint`, `zam agent connect codex` approves all of ZAM's tools, and learners click "always allow". So no ZAM tool may let its caller reach anything outside ZAM's own learning state: files, network hosts, stored secrets or security switches.

### Who benefits, and the strongest argument against

In a harness where the agent already reads files and runs shell commands, confining ZAM's tools does not stop an injected agent. The harness's own approvals are the control there. This is the strongest argument against the baseline: friction for no gain.

The baseline still matters in three places:

- **Tool-limited hosts**, where ZAM's tools are most of what the agent can reach: Copilot Chat with the Studio panel, Claude Desktop, the mobile companion.
- **Mixed approval**, where ZAM's tools are approved automatically and the shell is not. There, ZAM is the silent path.
- **Review.** A reviewer asks whether ZAM is the weakest link on the machine. The answer has to be no, whatever else the agent can do.

The friction is limited and mostly one-time: trusting a folder once (D1) and approval prompts for tools outside a reviewed list (D4).

### Gaps on `main`

Each row was traced in code. The review ID refers to the review's finding list.

| Gap | Where | Review ID |
|---|---|---|
| OKF tools accept any directory as `bundle_dir`; the file name check is the only check. `zam_okf_read` is marked read-only | `src/cli/commands/mcp.ts:1843`, `src/cli/okf/io.ts:81` | H1 |
| `zam_okf_upsert` writes any `*.md` other than `index.md` and `log.md` into `bundle_dir`, creates the directory, and regenerates `index.md` and `log.md` there. Pointed at a repository root, it can write the agent instruction files (`CLAUDE.md`, `AGENTS.md`) | `src/cli/okf/io.ts:205–245`, `src/cli/okf/bundle.ts:14` | H1 |
| A card's `source_link` is fetched with plain `fetch`, redirects followed, private ranges allowed. A non-URL link is read as a file: absolute paths are accepted, and a GitHub link's path is joined onto a sibling directory without normalisation | `src/cli/review-context.ts:28`, `src/kernel/recall/reference-resolver.ts:153–261` | H2 |
| The curriculum fetcher checks `isSafeUrl` once, then lets `fetch` follow redirects | `src/cli/commands/bridge.ts:7390` | L4 |
| The Bitwarden session key is passed as `--session` on the command line, stored for 30 days, and exported into the process environment that child processes inherit. ADR 2026-07-30b Decision 7 says ZAM never holds a `BW_SESSION` | `src/cli/secrets-bridge.ts:114–138`, `src/kernel/secrets/session-store.ts:21` | H4 |
| The recommended one-line installers are not in this repository and nothing verifies them; Windows builds are unsigned | `README.md:108–113`, ADR 2026-06-21 | H5 |
| `zam agent connect codex` writes `default_tools_approval_mode = "approve"` for all ZAM tools; only `zam_review_action` is set back to `prompt` | `src/cli/agent-harness.ts:668–675` | M1 |
| The Copilot extension's loopback server checks no token, `Host` or `Origin` before calling allowlisted tools | `src/copilot-extension/extension.mjs:277` | M2 |
| `model-upsert` keeps a row's stored key reference when its URL changes. Its probe, and `model-reprobe`, go to any caller-supplied URL and return the result. Both are on the Studio bridge allowlist, and app-only registration is a host hint the server cannot enforce | `src/cli/commands/bridge.ts:3549`, `src/cli/commands/mcp.ts:165–167`, `mcp.ts:1684` | M3 |
| Cloud model rows carry their API key inline in the synced database; machine keys sit in plain `credentials.json` | `src/cli/llm/model-registry.ts:20` | M4 |
| Card text, OKF articles and fetched pages reach agents with no marking as untrusted data | MCP tool results | M7 |
| A missing or unreadable `~/.zam/config.json` counts as a developer checkout, which may run `npm install` unprompted. The mobile pairing QR carries the database token and optionally model keys | `src/cli/bootstrap/logic.ts:136`, `src/bridge/mobile-pairing.ts:11–37` | M8 |
| No `SECURITY.md`; `ci.yml` has no `permissions` block; actions are pinned by tag | repository root, `.github/workflows/ci.yml` | M9 |
| The VS Code extension starts a bare `zam` with the workspace as working directory, and declares nothing for untrusted workspaces | `src/vscode-extension/extension.ts:184`, `extension.ts:244` | L2 |
| Endpoint locality trusts the row's stored `local` flag first, then a substring test, so a URL that merely contains `localhost` counts as local. A local primary keeps registry order, so an offline local runner falls through to a cloud row | `src/cli/llm/client.ts:486–500`, `client.ts:2514` | Egress note |
| `isSafeUrl` resolves the host, then the fetch resolves it again: a rebinding window | `src/cli/adapters/source-reader.ts:72` | L4 |

Already in place, and kept: `get-settings` and `model-list` return no keys; `isSafeUrl` rejects credentials in URLs and handles dotted IPv4-mapped addresses; `resolveCitationPath` confines citations to the repository root. That function is the model for D1.

## Decision (proposed)

1. **D1 — Paths named by a caller are confined.** One resolver, in the kernel, decides every path that a tool argument or a stored link names.

   - **Allowed roots** are the MCP client's roots (`roots/list`) and the trusted folders in `~/.zam/config.json` (`trustedFolders[]`). A learner-started OKF import adds its bundle's repository root automatically. Settings lists the trusted folders and lets the learner add or remove them. A drive root, the home directory or any ancestor of it is refused as a root, whatever its source.
   - **Upgrade.** OKF import stores absolute article paths as `source_link` (`src/cli/okf/io.ts:69–74`). In the desktop app and in `zam review` those paths lie outside any MCP root. The release that ships D1 therefore also ships a one-time check. It lists the folders that existing cards' local links point into, keeps only folders that hold an OKF bundle, and offers to trust them in one step. Cards whose links stay outside every root show the typed refusal.
   - **Resolution.** The resolver takes the native real path (`realpathSync.native`, which also resolves 8.3 short names and case) and checks containment, case-insensitively on Windows. It rejects `:` in file names (NTFS alternate data streams), and `\\?\` and UNC paths unless the root itself is UNC. It opens the file and compares the opened file's identity with the checked path, which closes the gap between check and read.
   - **OKF tools.** Reads accept only `*.md`. Writes go only into a directory that already is a bundle (it holds a ZAM-generated `index.md`) or into `docs/okf` under a root, and never into a root itself. Agent instruction files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`, anything under `.github/`) become reserved names.
   - **Source links.** A local path resolves inside an allowed root, never against an arbitrary working directory. Only files with a text extension on a fixed list and below a size limit are read. Dot-directories (`.ssh`, `.git`, `.aws` and similar) and dotfiles are refused as defence in depth. A GitHub link's path is normalised, `..` segments are rejected, and a sibling checkout is used only when it lies inside an allowed root.
   - **Refusal.** It is typed (`path-outside-trusted-folders`) and names the one action that fixes it: trust the folder in Settings.
   - Until D1 lands for a tool, that tool loses `readOnlyHint`.

2. **D2 — One outbound fetcher for content and probes.** Every request ZAM starts to a URL it did not choose itself goes through one fetcher in the CLI, injected into the kernel as the `ReferenceFetcher` seam already allows. That covers source links, web imports, curriculum pages (whose fetcher moves over from its own check) and the endpoint probes of `model-upsert` and `model-reprobe`. The fetcher:

   - is built on `node:http` and `node:https` with a `lookup` function that validates every resolved address and pins the connection to it. That closes the rebinding window without a new dependency; `globalThis.fetch` cannot do this on its own;
   - accepts `http` and `https` only, with no credentials in the URL and no cookies;
   - blocks loopback, private, link-local (including `169.254.169.254`), shared-address, multicast and unique-local ranges, in every IPv6 notation;
   - follows at most five redirects by hand and applies the same checks to each hop;
   - caps response size and time.

   Model endpoints and the configured database keep their own clients, but model calls apply the same address check. Link-local and metadata ranges are blocked for every model row. Loopback and private ranges are allowed only for rows whose parsed host is `local` or `lan`. Locality is decided from the parsed host name alone: loopback is `local`, private ranges are `lan`, everything else is `cloud`. The row's stored `local` flag becomes a display hint and never widens what the check or the policy allows.

3. **D3 — App-only is a hint, not a boundary.** MCP Apps visibility is a hint to the host, and hosts let models read `ui://` resources. So the server cannot tell a panel's call from a model's call, and a per-session secret placed in the panel resource would be readable by the model. Every tool is therefore assessed as if a model calls it, app-only tools included.

   - Security switches are never writable through a tool: observation (ADR 2026-10-08 R8), cloud use, secret backends, pairing. They live in `~/.zam/config.json` or the managed policy (D6).
   - The Studio bridge allowlist carries a test that fails when a command is added without an entry in a reviewed list. The entry records why the command is safe for a model to call.

4. **D4 — ZAM never approves on the learner's behalf.** `zam agent connect` writes no blanket auto-approval into any harness configuration. Approval stays with the host's default.

   - Where a harness supports per-tool approval, ZAM may pre-approve a fixed, reviewed list of tools that read only ZAM's own state and take no path or URL argument (status, due reviews, token search, progress statistics). The list lives in one place and has a test. For Codex this replaces the blanket block; the per-tool form it already uses for `zam_review_action` stays.
   - `readOnlyHint` follows the same rule.
   - The Copilot extension's loopback server requires a per-launch random token in its URL and accepts a request only when `Host` is `127.0.0.1:<port>`. Those two checks are the control. In addition, only the top-level host page may post: the app iframe is sandboxed with an opaque origin, so a `POST` with `Origin: null`, a foreign `Origin` or a body that is not JSON gets `403`.

5. **D5 — Secrets stay out of command lines, child processes and other people's hands.** OS-protected storage means DPAPI on Windows, the Keychain on macOS and the Secret Service on Linux. It protects against other users, other machines and backups, not against processes of the same user, and this ADR claims no more.

   - **Bitwarden.** The session reaches `bw` through that child's environment only, never as `--session`. Item JSON goes on stdin. The session is not exported into ZAM's own process environment, so agent harnesses and other children do not inherit it. It is remembered only in OS-protected storage; where none is available, as on Linux without a keyring daemon (SSH sessions, WSL), it is not remembered and the learner unlocks at each start. The default lifetime drops from 30 days to 7 (open question 1). This amends ADR 2026-07-30b Decision 7, which the session store already contradicts.
   - **Keys at rest on the machine.** Literal keys in `credentials.json` move to OS-protected storage where the OS offers it. OS storage becomes one more `SecretBackend`, resolved at start into the snapshot that `resolveCredentials()` already builds (`src/kernel/credentials.ts:252`), so the synchronous accessors of ADR 2026-07-30b stay as they are. DPAPI needs either a native module, with the ABI and supply-chain cost known from `better-sqlite3`, or a PowerShell call; the plan chooses.
   - **Keys follow endpoints.** Changing a model row's URL drops its key reference; the same save must name the key again. A synced row can also be rewritten by whoever holds the library's token, so each device remembers in `~/.zam/config.json` the endpoint it last confirmed for each row. When a row's URL differs from it, that device does not send the key until the learner confirms the new endpoint in Settings. `llm.endpoints` in D6 is the backstop an organisation enforces.
   - **Keys in shared rows.** A cloud model's key travels in the learner's database only in a personal library, and only while that model's "use on my other devices" stays on. It stays on by default, which keeps today's experience. A multi-learner library never carries keys, and the managed policy can forbid synced keys entirely.
   - **Output.** `zam settings show` and every log line show secrets masked.
   - **Pairing.** The QR code carries only the database URL and token; model keys reach the phone through the library, under the rules above. The code appears only after an explicit reveal and hides after 60 seconds, with a note not to show it while screen-sharing. Where the database backend can issue per-device tokens, pairing issues one.

6. **D6 — A managed policy file.** An organisation can place one file that ZAM reads and never writes:

   - Windows: `%ProgramData%\ZAM\policy.json`
   - macOS: `/Library/Application Support/ZAM/policy.json`
   - Linux: `/etc/zam/policy.json`

   **Trust.** On Windows, ordinary users can create folders under `%ProgramData%` and then own them. ZAM therefore trusts the file only when the file and its folder are owned by Administrators or SYSTEM and are not writable by ordinary users. On macOS and Linux both must be owned by root and not group- or world-writable. A file that fails the check is ignored, and Settings says so.

   **Semantics.** The policy can only restrict. A key it sets overrides settings, `~/.zam/config.json` and every tool call, but it cannot turn on something the learner turned off. Settings shows a managed value as "set by your organisation", so the learner sees why a switch is greyed out. The CLI and the MCP server read the file through the kernel, and nothing else needs to: the desktop shell no longer starts the screen observer (ADR 2026-10-08, Phase 0A). Whatever can capture the screen ships as a separate install that an organisation can prohibit with its own tooling; `observation.screen` is the counterpart inside ZAM (ADR 2026-10-08, *Trade-off analysis*, packaging).

   **Errors.** The file has a `version` field. Unknown keys are ignored with a warning. A known key with an invalid value takes that key's fail-closed value; a file that is not valid JSON applies every key's fail-closed value. Settings shows a banner ("Your organisation's ZAM policy could not be read — contact your administrator"), and `zam policy check` lets an administrator validate a file before deploying it.

   Version 1 keys map one to one onto the review's rollout conditions:

   | Key | Values | Effect | Fail-closed value |
   |---|---|---|---|
   | `observation.screen` | `denied` | No screen surface (ADR 2026-10-08 R8) | `denied` |
   | `observation.shell` | `denied`, `allowed` | `denied`: `zam monitor start` refuses and every monitor tool returns a typed refusal. When allowed, commands are always redacted (ADR 2026-10-08 R5) | `denied` |
   | `observation.retentionDays` | number | Upper bound for the retention window of raw observation files (ADR 2026-10-08 R6) | Built-in default (1 day) |
   | `llm.cloud` | `denied`, `allowed` | `denied`: only `local` and `lan` endpoints (D2), and no fallback to a cloud row | `denied` |
   | `llm.endpoints` | host list | Only these model hosts | Only `local` and `lan` endpoints |
   | `sourceLinks.remoteFetch` | `denied`, `allowed` | Content fetches off | `denied` |
   | `secrets.bitwarden` | `denied`, `allowed` | Bitwarden backend off | `denied` |
   | `secrets.sessionLifetimeHours` | number | Upper bound for D5 | `0` (not remembered) |
   | `secrets.syncApiKeys` | `denied`, `allowed` | No keys in shared rows | `denied` |
   | `mobile.pairing` | `denied`, `allowed` | No pairing code | `denied` |
   | `database.remoteHosts` | host list | Only these server databases | Only the host already configured; no new one |
   | `agent.preApproval` | `none`, `reviewed` | Whether D4's reviewed list may be pre-approved | `none` |
   | `selfHeal` | `denied`, `allowed` | No automatic `npm install` or build | `denied` |

   A registry or ADMX form for Group Policy is deferred until an organisation needs it. The JSON file can already be deployed by any device-management tool.

7. **D7 — Content handed to agents is marked as data.** Card text, OKF article bodies, fetched pages and import material in MCP tool results carry `untrusted: true` in structured content and fixed delimiters in text content. The server instructions tell agents that delimited text is data and never instructions. This reduces prompt injection; it does not prevent it. The controls are D1–D4, which limit what an injected agent can do through ZAM.

8. **D8 — Supply chain and install.**

   - `SECURITY.md` with private vulnerability reporting through GitHub security advisories and a supported-version statement.
   - CI: a top-level `permissions: contents: read` in `ci.yml`, third-party actions pinned by commit SHA and kept current by Dependabot, and `npm audit --omit=dev --audit-level=high` as a gate.
   - Install scripts: the one-line installers are versioned in this repository and published as release assets with SHA-256 checksums. The README names a pinned `npm install -g zam-core@<version>` as the path for managed machines. Windows signing stays with ADR 2026-06-21; its review covers the NSIS hook's `-ExecutionPolicy Bypass`.
   - Self-heal runs only when the install channel is explicitly `developer`. A missing or unreadable configuration no longer counts. The managed policy can deny it.
   - `zam agent connect` writes a timestamped backup before it changes a harness configuration. `git-sync --install` refuses to overwrite a `post-commit` hook it did not write.
   - A server database URL must use TLS unless its host is loopback.
   - The VS Code extension starts ZAM by an absolute path resolved outside the workspace, and declares limited support for untrusted workspaces.

9. **D9 — Every fix ships with its regression test.** The test reproduces the gap: a secret file outside every root, an instruction file written through OKF upsert, a metadata-service address, a redirect into a private range, a probe to a link-local host, a key sent to a changed URL, a Copilot request without a token, a session key in a child's command line or environment, an invalid policy file. A gap counts as closed when its test passes in the same PR as the fix.

## Options considered

**A. Document the rollout conditions and stop there.** Rejected. Every condition depends on the learner remembering it, nothing enforces any of them, and an agent can change some.

**B. Ship a separate corporate build with features compiled out.** Rejected. Two builds to test and release, and a learner who uses ZAM at home and at work would need both. The managed policy gets the same result in one build.

**C. Fix the findings one by one.** Rejected as the whole answer. Without a trust model the next tool with a path argument reopens H1. The fixes are the same as in D; the difference is the rule they are checked against.

**D. A written trust model, targeted fixes and a managed policy.** Recommended. Each fix is small and contained. The trust model gives every future tool a test to pass. The policy turns the review's conditions into something an administrator deploys once.

## Trade-off analysis

D1 is the largest regression for learners, larger than it first looks. Every OKF-imported card links to an absolute path, so without the upgrade check a learner would see refusals across their whole library after an update. The check, automatic trust on import and a Settings entry keep this to one confirmation. D1 does not ship without them.

D4 adds approval prompts in Codex for tools outside the reviewed list. The simplicity principle accepts this: the alternative is a tool that an injected agent can use silently to read the learner's keys, and no default should allow that.

D5 keeps synced keys on by default for personal libraries. Turning them off would break the phone for every learner who uses a cloud model, which the simplicity principle does not accept. The per-device endpoint confirmation costs one click when a URL changes, which is rare. Organisations that need synced keys off get it through D6, and multi-learner libraries never sync keys.

D6 is a new contract to version and test, and a broken policy file can switch features off for everyone on a machine. Per-key fail-closed values keep the basic product working, and `zam policy check` with the Settings banner make an error visible instead of mysterious. It is still cheaper than option B, and it answers the review's conditions without asking colleagues to configure anything.

D7 does not stop a determined injection, and the ADR does not claim it does. Its value is that agents which respect the marking stop following embedded instructions. The protection that holds even when an agent ignores it comes from D1–D4.

## Consequences

Easier:

- An administrator enables ZAM on managed machines with one file, and learners see in Settings which switches the organisation set.
- New tools have a written rule to pass: safe to approve automatically, or not shipped.
- A fresh security review can check the trust model and the regression tests instead of rediscovering each gap.

Harder:

- Local source links outside every trusted folder stop resolving. The upgrade check offers to trust the folders existing cards use; anything left shows the typed refusal.
- OKF upsert can no longer create a bundle in an arbitrary directory; a new bundle starts under `docs/okf` or in a folder the learner trusts.
- OS-protected secret storage adds platform code, and Linux learners without a keyring unlock at every start.
- Bitwarden users unlock more often (seven days instead of thirty).
- The managed policy needs a schema, an ownership check on three platforms, a parser with per-key fail-closed values, Settings UI for managed values and errors, and `zam policy check`.
- Harness configuration changes. Learners who connected Codex before this change keep the old blanket approval until they reconnect; the release notes say so, and `zam agent connect` offers the rewrite.

## Sequencing

A plan follows the review. The intended order:

1. **Patch release.** D1 with its upgrade check and trusted folders, D2 including the probes, the D3 allowlist test, the Copilot server check and the Codex change in D4, the key-follows-endpoint rule in D5, and Phase 0 of ADR 2026-10-08. These close the traced high findings and the agent chain. Every item ships with its D9 test.
2. **Next minor release.** The rest of D5, D7, and the `SECURITY.md` and CI items of D8.
3. **Following release.** D6, and the remaining D8 items.

## Open questions for review

1. **Bitwarden lifetime.** Is seven days the right default, and is OS-protected storage mandatory for remembering the session at all? **Decided 2026-10-10 (owner):** seven days, and only in OS-protected storage; without it the session is not remembered.
2. **Synced keys.** Should "use on my other devices" stay on by default for personal libraries? **Decided 2026-10-10 (owner):** yes, on by default; multi-learner libraries never carry keys.
3. **Self-heal.** ADR 2026-07-07 chose full automatic healing. Is requiring an explicit `developer` channel an acceptable narrowing?
4. **Pre-approval list.** Which tools belong on D4's reviewed list? **Decided 2026-10-10 (owner):** `zam_status`, `zam_get_reviews`, `zam_find_tokens` and `zam_progress_stats`.
5. **Source-link extensions.** Which text extensions does D1 accept, and is a configuration file type such as `.json` on the list? **Decided 2026-10-10 (owner):** Markdown and plain text, common source-code extensions, and configuration files including `.json`, `.yaml`, `.yml` and `.toml`. Images are never read as text.
6. **Policy file names.** `ZAM` or `zam` as the directory name on Windows and macOS, and is a per-user policy layer needed below the machine policy?
7. **Legal.** The companion ADR's legal question (monitoring of employees and minors) applies wherever an organisation deploys ZAM. This ADR does not assess compliance either.

## Appendix — Review findings and where they are answered

| Review ID | Answered by | Re-checked on `main` |
|---|---|---|
| H1 OKF tools read and write any directory | D1, D4 (`readOnlyHint`) | Present, including instruction files through upsert |
| H2 Source links fetch and read anything | D1, D2 | Present |
| H3 OCR in the screen observer | ADR 2026-10-08 R8 | Present |
| H4 Bitwarden session handling | D5 | Present; contradicts ADR 2026-07-30b Decision 7 |
| H5 Installer and signing | D8, ADR 2026-06-21 | Present (README one-liners; signing open) |
| M1 Codex blanket approval | D4 | Present |
| M2 Copilot server without authentication | D4 | Present |
| M3 Key sent to a changed URL; probes to any URL; app-only not enforced | D2 (probes), D3, D5 (keys follow endpoints) | Present |
| M4 Plain-text and synced keys | D5, D6 | Present |
| M5 Observer privacy controls | ADR 2026-10-08 R5, R6, R8 | Present (retention never enforced) |
| M6 Shell monitor unredacted | ADR 2026-10-08 R5 | Present |
| M7 Prompt injection through content | D7, with D1–D4 as the controls | Present |
| M8 Self-heal trigger; pairing QR secrets | D8, D5 | Present |
| M9 Maturity and supply chain | D8 | Present (no `SECURITY.md`, no `permissions` in `ci.yml`, tag pins) |
| L1 Plain `http`/`ws` to a server database | D8 | Not re-checked |
| L1 Mobile app trusts only its bundled root certificates, so corporate TLS inspection breaks it | Deferred: not part of this baseline; a later `tls.extraRoots` policy key is the likely answer | Not re-checked |
| L2 VS Code extension start path | D8 | Present (bare `zam`, workspace as working directory, no untrusted-workspace declaration) |
| L3 ffmpeg shell string; snapshot SQL import | ADR 2026-10-08 Phase 0A.5; snapshot import stays CLI-only, for the learner's own snapshots | ffmpeg string present |
| L4 `isSafeUrl` gaps; curriculum redirects | D2 | Present (rebinding window; curriculum follows redirects unchecked); dotted IPv4-mapped form already handled |
| L5 Third-party installers | Kept: they run only on an explicit learner action | Not changed |
| L6 Harness configuration rewrites; `post-commit` overwrite | D8 | Not re-checked |
| Egress: local primary falls back to a cloud model; substring locality | D2 (parsed-host locality), D6 (`llm.cloud: denied`) | Present |

## Citations

ZAM code, checked on `main` (87955c59):

- `src/cli/commands/mcp.ts`: Studio bridge allowlist (133–177, model commands 164–167), app-only registration (1684), OKF bundle resolver (1824–1859), `zam_okf_read` (1904–1930)
- `src/cli/okf/io.ts`: `collectSourceLinkBases` writes absolute paths (69–74), `resolveArticlePath` (81), `resolveCitationPath` (113), `upsertArticle` (205–245)
- `src/cli/okf/bundle.ts`: reserved files (14)
- `src/kernel/recall/reference-resolver.ts`: GitHub sibling resolution (153–211), generic fetch (215–240), local path (243–261)
- `src/cli/review-context.ts`: plain `fetch` injected (28)
- `src/cli/adapters/source-reader.ts`: `isSafeUrl` (72)
- `src/cli/commands/bridge.ts`: `model-upsert` (3325), key reference kept on URL change (3549), `get-settings` (4688), curriculum `fetchRawHtml` (7390)
- `src/cli/llm/model-registry.ts`: inline keys in cloud rows (14–24)
- `src/cli/llm/client.ts`: provider chain and locality (486–500), `isLocalEndpoint` (2514)
- `src/kernel/credentials.ts`: `resolveCredentials` snapshot (252)
- `src/cli/secrets-bridge.ts`: `--session` appended (114–120), environment passed to children (125–138)
- `src/kernel/secrets/session-store.ts`: 30-day lifetime (21), file mode (74–82)
- `src/cli/agent-harness.ts`: Codex block (668–675)
- `src/copilot-extension/extension.mjs`: sandboxed app iframe (262–266), loopback server (273–372)
- `src/vscode-extension/extension.ts`: bare `zam` (184), workspace working directory (244)
- `src/cli/bootstrap/logic.ts`: `readInstallChannel` (136–151)
- `src/bridge/mobile-pairing.ts`: pairing payload (11–37)
- `desktop/src-tauri/src/lib.rs`: sidecar spawned by the shell (556, 811); removed by ADR 2026-10-08 Phase 0A
- `.github/workflows/ci.yml`: no `permissions`, tag-pinned actions
- `README.md`: one-line installers (108–113)
