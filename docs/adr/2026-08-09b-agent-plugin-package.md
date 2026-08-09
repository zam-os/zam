# Portable Agent Plugin Package

**Status:** Implemented
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md](2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md)

---

## Context

ZAM already ships the two components standardized by Agent Plugins: an Agent
Skill and a stdio MCP server. They were distributed through host-specific
skill directories and `zam agent connect`, so each supported client needed a
separate registration path even though the underlying components were the
same.

Agent Plugins v1.0.0 defines a portable root manifest, a fixed `skills/`
directory, and a root `mcp.json`. Installation and trust remain client-owned.
The Agent Skills frontmatter contract is narrower than ZAM's existing
host-specific copies: fields such as `user-invocable` are not portable.

## Decision

1. The repository root and the published `zam-core` npm package are the ZAM
   Agent Plugin root. They carry `plugin.json`, `mcp.json`, and
   `skills/zam/SKILL.md` using the Agent Plugins v1.0.0 schemas.
2. The portable MCP entry launches the bundled CLI with Node:
   `node ${PLUGIN_ROOT}/dist/cli/index.js mcp`, with the plugin root as its
   working directory. Node 22 remains the package runtime requirement.
3. The portable skill uses only Agent Skills standard frontmatter. Existing
   `.claude/`, `.agent/`, and `.agents/` copies remain additive compatibility
   surfaces and keep any host-specific metadata or invocation guidance.
4. The npm `files` allowlist includes every portable manifest and component,
   so the registry artifact is a complete plugin rather than only the source
   checkout.
5. Tests pin the closed manifest shapes, synchronize plugin and npm versions,
   enforce package-contained runtime paths, and complete an MCP handshake from
   the declared configuration.
6. The plugin does not redirect learner state into `PLUGIN_DATA`. It keeps
   ZAM's configured database location so the Agent Plugin, CLI, and Desktop
   Studio operate on the same learning profile.

## Consequences

**Easier**

- A compatible client can install one directory and discover both ZAM's
  pedagogy and tool transport.
- The same package works across clients without translating the portable
  skill or MCP configuration.
- Existing users and clients without Agent Plugins support keep the established
  `zam agent connect` path.

**Harder**

- Release version bumps must update `plugin.json`; the focused test fails when
  it drifts from `package.json`.
- A source checkout must be built before its MCP component can start. Published
  npm artifacts already contain `dist/`.
- The portable skill is another distribution surface and must be kept aligned
  with meaningful workflow changes in the host-specific skills.
