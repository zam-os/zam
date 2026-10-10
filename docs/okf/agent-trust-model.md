---
type: architecture
title: Agent and Library Trust Model
description: Agents and library content are untrusted, so every ZAM tool must be safe to auto-approve; files, network, the agent surface and keys each have one rule that enforces this.
tags:
  - security
  - agents
  - mcp
  - secrets
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/agent-trust-model.md"
timestamp: 2026-10-10T18:00:00.000Z
---

ZAM treats two things as untrusted: the **agent** that calls its tools, and
the **content** of a library, which another learner, an import or a synced
device may have written. A tool argument and a stored field (a source link, a
model URL, an article) can therefore name anything. The rule that follows:
**every ZAM tool must be safe to auto-approve.** Nothing a model passes or a
library holds may make ZAM read a file outside the folders the learner
trusts, reach an address inside the learner's network, change a security
switch, or send a key somewhere the learner did not confirm.

The operating system's protections stop at the learner's own account: ZAM
does not defend against other processes of the same user.

# Files: trusted folders

A path that a caller names, or that a stored link holds, is read only inside
an **allowed root**:

- the folders the MCP client reports through `roots/list` (the agent app's
  open workspace), and
- `trustedFolders` in the machine's `~/.zam/config.json`.

A drive root, the home folder or a folder above it is never a root.
Containment is decided on the real path after symlinks and junctions, so
`..`, a symlink or a junction out of a root is refused. Dot-folders and
dotfiles are refused, and a source link reads only text, code and
configuration files (`.md`, `.txt`, source code, `.json`, `.yaml`, `.toml`, …)
below a size limit; images are never read as text. A refusal is typed,
`path-outside-trusted-folders`, and says how to trust the folder.

What each surface does with this:

- **Source links** of local files resolve against each root in turn, never
  against the working directory. A GitHub link may use a local checkout only
  inside a root.
- **OKF tools** read only `.md` files inside a root. They write only into an
  existing ZAM bundle or `docs/okf` below a root, and never an agent's
  instruction file (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`).
- **Knowledge-map tools** take their repository from an explicit `repo_root`
  or the client's roots, both confined the same way.
- **`zam_material_import`** ignores a file path outside every root: the cards
  still arrive, linked as `photo:<name>@<date>` instead of to the file. A file
  the learner picks in the desktop or the CLI is not confined.

Only the learner trusts a folder: `zam trust add|remove|list`, or Settings →
Data in the desktop. `zam trust suggested` and a button in Settings offer the
folders that existing cards link into and that hold a ZAM knowledge base. No
MCP tool and no Studio panel command can trust a folder.

# Network: one outbound fetcher

Content fetches — source links, web imports, curriculum pages — go through
one fetcher (`src/cli/net/safe-fetch.ts`). It resolves the host, checks every
address it gets and connects to the checked address, so a name cannot resolve
to a public address for the check and to a private one for the connection.
It refuses loopback, private, link-local (including the cloud metadata
address `169.254.169.254`), shared, multicast and unique-local ranges in every
IPv6 notation; follows at most five redirects, each checked again; sends no
cookies and no URL credentials; and caps size and time.

Model endpoints are the learner's own choice and may be local, so they follow
a different rule. A model's locality comes from its parsed host alone:
`local` for loopback and `localhost`, `lan` for private ranges, `.local`,
`.home.arpa` and `.internal`, `cloud` otherwise. Before every model call and
probe, the resolved addresses are checked: link-local and metadata addresses
are always refused, loopback and private addresses only for a row whose host
is itself local or LAN.

# The agent surface

- **Studio panel commands.** MCP Apps panels reach the bridge through the
  app-only `zam_studio_bridge`. Each allowed command is listed in
  `STUDIO_BRIDGE_COMMANDS` with the reason it is safe for a model to call, and
  with the options it may not pass (`backup-create --dir`,
  `model-upsert --key-ref`, `model-upsert --confirm-endpoint`). A test fails
  when a command joins the list without an entry. Trusted folders, secrets,
  pairing, observation and endpoint confirmation stay off the list.
- **Pre-approval.** Four read-only tools may run without asking:
  `zam_status`, `zam_get_reviews`, `zam_find_tokens`, `zam_progress_stats`
  (`src/cli/agent-approval.ts`). `zam agent connect codex` writes per-tool
  approval for exactly these and no blanket approval; an older configuration
  with a blanket approval is rewritten on the next connect.
  `zam_review_action` always asks. `readOnlyHint` sits only on tools that
  change nothing.
- **Backups.** Every harness file `zam agent connect` replaces is kept next to
  it as `<file>.zam-backup-<time>`.
- **Copilot canvas.** The extension's loopback server answers only under a
  random token in the URL path, only to `Host: 127.0.0.1:<port>`, and only to
  POSTs from its own host page with a JSON body.

# Keys and secrets

OS-protected storage means the Keychain on macOS, the Secret Service on Linux
and DPAPI on Windows. ZAM reaches it with the system's own tools, the secret
always on stdin, never on a command line.

- **Keys at rest.** Literal secrets in `~/.zam/credentials.json` — the library
  token, provider keys — move into OS storage at the next start and leave an
  `os://` reference behind. A value is replaced only after it reads back
  unchanged. Where the OS offers no storage (Linux without a keyring daemon),
  the file stays as it was. A library token in a keychain ZAM cannot read
  stops the start with `OS_SECRET_UNAVAILABLE` instead of opening an empty
  local library.
- **Bitwarden.** The vault session reaches `bw` only through that child's
  environment, never as `--session` and never in ZAM's own environment, so
  agent harnesses ZAM starts do not inherit it. It is remembered only in OS
  storage, for seven days after its last use.
- **Keys follow endpoints.** A save that changes a model's URL drops its key
  reference unless the save names a key again; Settings names the stored key
  and says so under the key field. Each device remembers in
  `~/.zam/config.json` the endpoint it last confirmed for each model, and
  sends that model's key nowhere else until the learner confirms the new
  address in Settings or with `zam trust endpoint <id>`. A model seen for the
  first time is confirmed as it stands.
- **Keys in shared rows.** A cloud model's key travels with it to the
  learner's other devices only in a personal library, and only while that
  model's "Use this key on my other devices" stays on (the default). The team
  library never carries keys.
- **Output.** `zam settings show` and the desktop bridge's log mask secrets.
- **Pairing.** The QR code carries the database address and token, never a
  model key; it appears only on request and hides after 60 seconds.

# Adding a tool

A new MCP tool, bridge command or Studio panel command passes four checks
before it ships:

1. A path argument resolves through `resolveTrustedPath` or
   `readTrustedTextFile` (`src/kernel/system/trusted-paths.ts`), never against
   the working directory.
2. A URL from an argument or the library is fetched only through `safeFetch`;
   a model call goes through the model client's endpoint check.
3. No argument can write a security switch: trusted folders, secret backends,
   observation, pairing, endpoint confirmation.
4. A Studio panel command gets its entry in `STUDIO_BRIDGE_COMMANDS`, with the
   options it must refuse; a pre-approved tool joins the reviewed list only
   if it changes nothing.

# Citations

- [ADR 2026-10-08b — Corporate Deployment Baseline](../adr/2026-10-08b-corporate-deployment-baseline.md)
- [ADR 2026-10-08 — Observation Without Content](../adr/2026-10-08-skill-learner-observation.md)
- [ADR 2026-07-30b — Credential Secret Backends](../adr/2026-07-30b-credential-secret-backends.md)
- Code: `src/kernel/system/trusted-paths.ts`, `src/cli/trusted-folders.ts`, `src/cli/commands/trust.ts`, `src/cli/net/safe-fetch.ts`, `src/cli/adapters/source-reader.ts`, `src/cli/review-context.ts`, `src/kernel/recall/reference-resolver.ts`, `src/cli/okf/io.ts`, `src/cli/okf/bundle.ts`, `src/cli/commands/mcp.ts`, `src/cli/agent-approval.ts`, `src/cli/agent-connect.ts`, `src/copilot-extension/loopback-guard.ts`, `src/kernel/secrets/os-store.ts`, `src/kernel/secrets/backends/os.ts`, `src/kernel/secrets/session-store.ts`, `src/kernel/credentials.ts`, `src/kernel/system/endpoint-confirmation.ts`, `src/cli/llm/model-registry.ts`, `src/cli/llm/client.ts`, `src/cli/llm/capability-probe.ts`, `src/kernel/models/settings.ts`, `desktop/src/mobile-pairing.ts`
- Tests: `tests/kernel/trusted-paths.test.ts`, `tests/cli/okf-confinement.test.ts`, `tests/cli/trusted-folders.test.ts`, `tests/cli/safe-fetch.test.ts`, `tests/cli/model-endpoint-check.test.ts`, `tests/cli/studio-bridge-review.test.ts`, `tests/cli/agent-approval.test.ts`, `tests/cli/copilot-loopback-guard.test.ts`, `tests/kernel/os-secret-store.test.ts`, `tests/kernel/credentials-os-store.test.ts`, `tests/kernel/bitwarden-session-store.test.ts`, `tests/cli/keys-follow-endpoints.test.ts`, `tests/cli/model-registry.test.ts`, `tests/kernel/secret-masking.test.ts`
