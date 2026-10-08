# Corporate Deployment Baseline: Agents and Shared Content Are Untrusted

**Status:** Proposed
**Date:** 2026-10-08
**Deciders:** Thomas (project owner), after external review
**Related:** [ADR 2026-10-08 — Observation without content](2026-10-08-skill-learner-observation.md) (companion: everything ZAM observes) · [ADR 2026-07-06a — MCP agent transport and surfaces](2026-07-06a-mcp-agent-transport-and-surfaces.md) · [ADR 2026-07-17 — OKF knowledge base](2026-07-17-okf-knowledge-base.md) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-30b — Credential secret backends](2026-07-30b-credential-secret-backends.md) · [ADR 2026-07-23 — Online-only server database and mobile gating](2026-07-23-online-only-server-db-and-mobile-gating.md) · [ADR 2026-07-07 — Resilient self-update](2026-07-07-resilient-self-update-and-dependency-isolation.md) · [ADR 2026-06-21 — Code signing and trusted installers](2026-06-21-code-signing-and-trusted-installers.md) · [ADR 2026-09-04 — Team library pilot](2026-09-04-team-library-postgres-entra-pilot.md)
**Amends on acceptance:** ADR 2026-07-30b (Bitwarden session persistence), ADR 2026-07-12 (keys in shared model rows), ADR 2026-07-07 (what counts as a developer checkout).

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
| Other local processes and web pages in the learner's browser | **No** | They can reach loopback ports |
| Model and database endpoints the learner configured | For what the learner sends them | They receive learning content by design |

Out of scope: an agent with unrestricted shell access (it does not need ZAM to do harm), and a machine that is already compromised.

The rule that follows: **a ZAM tool must be safe for a host to approve automatically.** Hosts approve tools marked `readOnlyHint`, `zam agent connect codex` approves all of ZAM's tools, and learners click "always allow". So no ZAM tool may let its caller reach anything outside ZAM's own learning state: files, network hosts, stored secrets or security switches.

### Gaps on `main`

Each row was traced in code. The review ID refers to the review's finding list.

| Gap | Where | Review ID |
|---|---|---|
| OKF tools accept any directory as `bundle_dir`; the file name check is the only check. `zam_okf_read` is marked read-only | `src/cli/commands/mcp.ts:1843`, `src/cli/okf/io.ts:81` | H1 |
| A card's `source_link` is fetched with plain `fetch`, redirects followed, private ranges allowed. A non-URL link is read as a file: absolute paths are accepted, and a GitHub link's path is joined onto a sibling directory without normalisation | `src/cli/review-context.ts:28`, `src/kernel/recall/reference-resolver.ts:153–261` | H2 |
| The Bitwarden session key is passed as `--session` on the command line, stored for 30 days, and exported into the process environment that child processes inherit | `src/cli/secrets-bridge.ts:114–138`, `src/kernel/secrets/session-store.ts:21` | H4 |
| The recommended one-line installers are not in this repository and nothing verifies them; Windows builds are unsigned | `README.md:108–113`, ADR 2026-06-21 | H5 |
| `zam agent connect codex` writes `default_tools_approval_mode = "approve"` for all ZAM tools | `src/cli/agent-harness.ts:671` | M1 |
| The Copilot extension's loopback server checks no token, `Host` or `Origin` before calling allowlisted tools | `src/copilot-extension/extension.mjs:277` | M2 |
| `model-upsert` keeps a row's stored key reference when its URL changes, then probes the new URL. It is on the Studio bridge allowlist, and app-only registration is a host hint the server cannot enforce | `src/cli/commands/bridge.ts:3549`, `src/cli/commands/mcp.ts:165`, `mcp.ts:1684` | M3 |
| Cloud model rows carry their API key inline in the synced database; machine keys sit in plain `credentials.json` | `src/cli/llm/model-registry.ts:20` | M4 |
| Card text, OKF articles and fetched pages reach agents with no marking as untrusted data | MCP tool results | M7 |
| A missing or unreadable `~/.zam/config.json` counts as a developer checkout, which may run `npm install` unprompted. The mobile pairing QR carries the database token and optionally model keys | `src/cli/bootstrap/logic.ts:136`, `src/bridge/mobile-pairing.ts:11–37` | M8 |
| No `SECURITY.md`; `ci.yml` has no `permissions` block; actions are pinned by tag | repository root, `.github/workflows/ci.yml` | M9 |
| Endpoint locality is a substring test, so a URL that merely contains `localhost` counts as local | `src/cli/llm/client.ts:2514` | L4-related |
| `isSafeUrl` resolves the host, then the fetch resolves it again: a rebinding window | `src/cli/adapters/source-reader.ts:72` | L4 |

Already in place, and kept: `get-settings` and `model-list` return no keys; `isSafeUrl` rejects credentials in URLs and handles dotted IPv4-mapped addresses; `resolveCitationPath` confines citations to the repository root. That function is the model for D1.

## Decision (proposed)

1. **D1 — Paths named by a caller are confined.** One resolver, in the kernel, decides every path that a tool argument or a stored link names. Allowed roots are the MCP client's roots (`roots/list`), the workspaces registered in `~/.zam/config.json` (`workspaces[].path`), and ZAM's own directory. The resolver takes the real path, so a symbolic link cannot escape, and then checks containment.
   - OKF tools (`zam_okf_*`): `bundle_dir` must lie inside an allowed root, and only `*.md` files are read or written. A bundle in another repository keeps working when that repository is open in the editor or registered as a workspace.
   - Source links: a local path is resolved inside an allowed root, never against an arbitrary working directory. Absolute paths outside every root, dotfiles and dot-directories (`.ssh`, `.env`, `.npmrc`, `.git`) and files above a size limit are refused. A GitHub link's path is normalised, `..` segments are rejected, and a sibling checkout is used only when it is a registered workspace.
   - A refusal is typed (`path-outside-workspace`) and tells the learner the one action that fixes it: open the repository or add it as a workspace.
   - Until D1 lands for a tool, that tool loses `readOnlyHint`.

2. **D2 — One outbound fetcher for content.** Every content fetch ZAM starts (source links, web imports, curriculum pages) goes through one fetcher. It lives in the CLI and is injected into the kernel, as the `ReferenceFetcher` seam already allows. The fetcher:
   - accepts `http` and `https` only, with no credentials in the URL and no cookies;
   - checks the address the connection actually uses, not an earlier lookup, which closes the rebinding window;
   - blocks loopback, private, link-local (including `169.254.169.254`), shared-address, multicast and unique-local ranges, in every IPv6 notation;
   - follows at most five redirects by hand and applies the same checks to each hop;
   - caps response size and time.

   Model endpoints and the configured database are not content fetches. The learner or the administrator configured them, and they keep their own clients. Endpoint locality is decided from the parsed host name: loopback is `local`, private ranges are `lan`, and everything else is `cloud`.

3. **D3 — App-only is a hint, not a boundary.** The server cannot tell a panel's call from a model's call. A per-session secret placed in the panel resource does not help either, because hosts let models read resources. So every tool is assessed as if a model calls it, app-only tools included.
   - Changing a model row's URL drops its stored key reference. The same save must name the key again. A key is only ever sent to the URL it was saved with.
   - Security switches are never writable through a tool: observation (ADR 2026-10-08 R8), cloud use, secret backends, pairing. They live in `~/.zam/config.json` or the managed policy (D6).
   - The Studio bridge allowlist carries a test that fails when a command is added without an entry in a reviewed list. The entry records why the command is safe for a model to call.

4. **D4 — ZAM never approves on the learner's behalf.** `zam agent connect` writes no blanket auto-approval into any harness configuration. Approval stays with the host's default.
   - Where a harness supports per-tool approval, ZAM may pre-approve a fixed, reviewed list of tools that read only ZAM's own state and take no path or URL argument (status, due reviews, token search, progress statistics). The list lives in one place and has a test.
   - `readOnlyHint` follows the same rule.
   - The Copilot extension's loopback server requires a per-launch random token in its URL. It accepts a request only when `Host` is `127.0.0.1:<port>` and, for `POST`, `Origin` matches and the body is JSON. Anything else gets `403`.

5. **D5 — Secrets stay out of command lines, child processes and shared rows.**
   - **Bitwarden.** The session reaches `bw` through that child's environment only, never as `--session`. Item JSON goes on stdin. The session is not exported into ZAM's own process environment, so agent harnesses and other children do not inherit it. It is remembered only in OS-protected storage (DPAPI on Windows, the Keychain on macOS, the Secret Service on Linux); where none is available it is not remembered. The default lifetime drops from 30 days to 7 (open question 1).
   - **Keys at rest on the machine.** Literal keys in `credentials.json` move to OS-protected storage where the OS offers it. ADR 2026-07-30b keeps its accessors synchronous, and the mechanism has to respect that. The plan decides between a synchronous native binding and a resolve-at-start cache.
   - **Keys in shared rows.** A cloud model's key travels in the learner's database only in a personal library, and only while that model's "use on my other devices" stays on. It stays on by default, which keeps today's experience. A multi-learner library never carries keys, and the managed policy can forbid synced keys entirely.
   - **Output.** `zam settings show` and every log line show secrets masked.
   - **Pairing.** The QR code carries only the database URL and token; model keys reach the phone through the library, under the rule above. The code appears only after an explicit reveal and hides after 60 seconds, with a note not to show it while screen-sharing. Where the database backend can issue per-device tokens, pairing issues one.

6. **D6 — A managed policy file.** An organisation can place one file that ZAM reads and never writes:
   - Windows: `%ProgramData%\ZAM\policy.json`
   - macOS: `/Library/Application Support/ZAM/policy.json`
   - Linux: `/etc/zam/policy.json`

   Only administrators can write those locations. The policy can only restrict. A key it sets overrides settings, `~/.zam/config.json` and every tool call, but it cannot turn on something the learner turned off. Settings shows a managed value as "set by your organisation", so the learner sees why a switch is greyed out. If the file exists but cannot be parsed, ZAM applies the most restrictive value for every key. The CLI, the MCP server and the desktop app read the same file through the kernel.

   Version 1 keys map one to one onto the review's rollout conditions:

   | Key | Values | Effect |
   |---|---|---|
   | `observation.screen` | `denied` | No screen surface (ADR 2026-10-08 R8) |
   | `observation.shell` | `denied`, `redacted` | Shell monitor off, or redacted only |
   | `llm.cloud` | `denied`, `allowed` | `denied`: only `local` and `lan` endpoints (D2), with no fallback to a cloud model |
   | `llm.endpoints` | host list | Only these model hosts |
   | `sourceLinks.remoteFetch` | `denied`, `allowed` | Content fetches off |
   | `secrets.bitwarden` | `denied`, `allowed` | Bitwarden backend off |
   | `secrets.sessionLifetimeHours` | number | Upper bound for D5 |
   | `secrets.syncApiKeys` | `denied`, `allowed` | No keys in shared rows |
   | `mobile.pairing` | `denied`, `allowed` | No pairing code |
   | `database.remoteHosts` | host list | Only these server databases |
   | `agent.preApproval` | `none`, `reviewed` | Whether D4's reviewed list may be pre-approved |
   | `selfHeal` | `denied`, `allowed` | No automatic `npm install` or build |

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

9. **D9 — Every gap gets a regression test.** Each decision ships with a test that reproduces its gap: a secret file outside every root, a metadata-service address, a redirect into a private range, a key probe to a changed URL, a Copilot request without a token, a session key in a child's argv or environment. A gap counts as closed when its test passes, not when its fix is merged.

## Options considered

**A. Document the rollout conditions and stop there.** Rejected. Every condition depends on the learner remembering it, nothing enforces any of them, and an agent can change some.

**B. Ship a separate corporate build with features compiled out.** Rejected. Two builds to test and release, and a learner who uses ZAM at home and at work would need both. The managed policy gets the same result in one build.

**C. Fix the findings one by one.** Rejected as the whole answer. Without a trust model the next tool with a path argument reopens H1. The fixes are the same as in D; the difference is the rule they are checked against.

**D. A written trust model, targeted fixes and a managed policy.** Recommended. Each fix is small and contained. The trust model gives every future tool a test to pass. The policy turns the review's conditions into something an administrator deploys once.

## Trade-off analysis

D1 and D4 add friction. A learner who keeps a bundle outside every workspace has to register it once. A Codex user sees approval prompts for the tools that are not on the reviewed list. The simplicity principle accepts this: the alternative is a tool that an injected agent can use silently to read the learner's keys, and no default should allow that.

D5 keeps synced keys on by default for personal libraries. Turning them off would break the phone for every learner who uses a cloud model, which the simplicity principle does not accept. Organisations that need it off get it through D6, and multi-learner libraries never sync keys.

D6 is a new contract to version and test. It is still cheaper than option B, and it answers the review's conditions without asking colleagues to configure anything.

D7 does not stop a determined injection, and the ADR does not claim it does. Its value is that agents which respect the marking stop following embedded instructions. The protection that holds even when an agent ignores it comes from D1–D4.

## Consequences

Easier:

- An administrator enables ZAM on managed machines with one file, and learners see in Settings which switches the organisation set.
- New tools have a written rule to pass: safe to approve automatically, or not shipped.
- A fresh security review can check the trust model and the regression tests instead of rediscovering each gap.

Harder:

- Absolute-path source links and bundles outside any workspace stop resolving until the learner registers the workspace. Existing cards with such links show the typed refusal.
- OS-protected secret storage adds platform code, and ADR 2026-07-30b's synchronous accessors constrain how it is built.
- Bitwarden users unlock more often (seven days instead of thirty).
- The managed policy needs a schema, a parser that fails closed, Settings UI for managed values, and tests on all three platforms.
- Harness configuration changes. Learners who connected Codex before this change keep the old blanket approval until they reconnect; the release notes say so, and `zam agent connect` offers the rewrite.

## Sequencing

A plan follows the review. The intended order:

1. **Patch release.** D1, D2, the URL-change rule in D3, the Copilot server check and the Codex change in D4, together with Phase 0 of ADR 2026-10-08. These close the traced high findings and the agent chain.
2. **Next minor release.** D5, D7, the `SECURITY.md` and CI items of D8, and D9 for everything shipped so far.
3. **Following release.** D6, and the remaining D8 items.

## Open questions for review

1. **Bitwarden lifetime.** Is seven days the right default, and is OS-protected storage mandatory for remembering the session at all?
2. **Synced keys.** Should "use on my other devices" stay on by default for personal libraries?
3. **Self-heal.** ADR 2026-07-07 chose full automatic healing. Is requiring an explicit `developer` channel an acceptable narrowing?
4. **Pre-approval list.** Which tools belong on D4's reviewed list?
5. **Policy file names.** `ZAM` or `zam` as the directory name on Windows and macOS, and is a per-user policy layer needed below the machine policy?
6. **Legal.** The companion ADR's legal question (monitoring of employees and minors) applies wherever an organisation deploys ZAM. This ADR does not assess compliance either.

## Appendix — Review findings and where they are answered

| Review ID | Answered by | Re-checked on `main` |
|---|---|---|
| H1 OKF tools read any directory | D1, D4 (`readOnlyHint`) | Present |
| H2 Source links fetch and read anything | D1, D2 | Present |
| H3 OCR in the screen observer | ADR 2026-10-08 R8 | Present |
| H4 Bitwarden session handling | D5 | Present |
| H5 Installer and signing | D8, ADR 2026-06-21 | Present (README one-liners; signing open) |
| M1 Codex blanket approval | D4 | Present |
| M2 Copilot server without authentication | D4 | Present |
| M3 Key sent to a changed URL; app-only not enforced | D3 | Present |
| M4 Plain-text and synced keys | D5, D6 | Present |
| M5 Observer privacy controls | ADR 2026-10-08 R5, R6, R8 | Present (retention never enforced) |
| M6 Shell monitor unredacted | ADR 2026-10-08 R5 | Present |
| M7 Prompt injection through content | D7, with D1–D4 as the controls | Present |
| M8 Self-heal trigger; pairing QR secrets | D8, D5 | Present |
| M9 Maturity and supply chain | D8 | Present (no `SECURITY.md`, no `permissions` in `ci.yml`, tag pins) |
| L1 Plain `http`/`ws` to a server database | D8 | Not re-checked |
| L2 VS Code extension start path | D8 | Not re-checked |
| L3 ffmpeg shell string; snapshot SQL import | ADR 2026-10-08 Phase 0.3; snapshot import stays CLI-only, for the learner's own snapshots | ffmpeg string present |
| L4 `isSafeUrl` gaps | D2 | Rebinding window present; dotted IPv4-mapped form already handled |
| L5 Third-party installers | Kept: they run only on an explicit learner action | Not changed |
| L6 Harness configuration rewrites; `post-commit` overwrite | D8 | Not re-checked |

Also reported, not re-checked: a local primary model can fall back to a configured cloud model without asking. D6 `llm.cloud: denied` forbids it under policy; the plan checks the default behaviour.

## Citations

ZAM code, checked on `main` (87955c59):

- `src/cli/commands/mcp.ts`: Studio bridge allowlist (133–177, `model-upsert` 165), app-only registration (1684), OKF bundle resolver (1824–1859), `zam_okf_read` (1904–1930)
- `src/cli/okf/io.ts`: `resolveArticlePath` (81), `resolveCitationPath` (113)
- `src/kernel/recall/reference-resolver.ts`: GitHub sibling resolution (153–211), generic fetch (215–240), local path (243–261)
- `src/cli/review-context.ts`: plain `fetch` injected (28)
- `src/cli/adapters/source-reader.ts`: `isSafeUrl` (72)
- `src/cli/commands/bridge.ts`: `model-upsert` (3325), key reference kept on URL change (3549), `get-settings` (4688)
- `src/cli/llm/model-registry.ts`: inline keys in cloud rows (14–24)
- `src/cli/llm/client.ts`: `isLocalEndpoint` (2514)
- `src/cli/secrets-bridge.ts`: `--session` appended (114–120), environment passed to children (125–138)
- `src/kernel/secrets/session-store.ts`: 30-day lifetime (21), file mode (74–82)
- `src/cli/agent-harness.ts`: Codex block (668–675)
- `src/copilot-extension/extension.mjs`: loopback server (273–372)
- `src/cli/bootstrap/logic.ts`: `readInstallChannel` (136–151)
- `src/bridge/mobile-pairing.ts`: pairing payload (11–37)
- `.github/workflows/ci.yml`: no `permissions`, tag-pinned actions
- `README.md`: one-line installers (108–113)
