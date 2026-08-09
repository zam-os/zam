# ZAM Agent Plugin

The ZAM repository root and the published `zam-core` npm package are portable
[Agent Plugins](https://agent-plugins.org/) v1.0.0 packages. A compatible
client can discover the ZAM skill and its stdio MCP server from one directory.

## Package layout

```text
zam/
├── plugin.json
├── mcp.json
├── skills/
│   └── zam/
│       └── SKILL.md
└── dist/
    └── cli/
        └── index.js
```

- `plugin.json` declares the portable package identity and Agent Plugins
  schema version.
- `skills/zam/SKILL.md` is the host-neutral Agent Skill. Existing
  `.claude/`, `.agent/`, and `.agents/` skill copies remain available for
  clients that use their earlier host-specific discovery paths.
- `mcp.json` starts `node ${PLUGIN_ROOT}/dist/cli/index.js mcp`. The client
  supplies `PLUGIN_ROOT` and `PLUGIN_DATA` as required by the standard.

ZAM continues to store learner data under its normal configured database
location (local installs default to `~/.zam`). That lets the plugin, CLI, and
Desktop Studio share one learning profile instead of creating an isolated
profile per client.

## Load the plugin

Agent Plugins deliberately leaves installation to each client. Give a
compatible client's plugin installer the directory containing `plugin.json`.

A published npm package already contains the built `dist/` runtime. For a
source checkout, prepare the same package before loading it:

```bash
npm ci
npm run build
```

The runtime requires Node.js 22 or newer. The client must support Agent Skills
and stdio MCP to load both portable components; clients may support only one
component type and still load that part. `zam agent connect <harness>` remains
the fallback for clients that do not install Agent Plugins directly.

## Validate the package

```bash
npm run test -- tests/cli/agent-plugin.test.ts
npm pack --dry-run --ignore-scripts
```

The focused test checks the closed manifest shapes, Agent Skills frontmatter,
npm package contents, path containment, and an actual MCP handshake through
the command declared in `mcp.json`.

The normative references are the
[Agent Plugins specification](https://agent-plugins.org/specification), its
[canonical schemas](https://agent-plugins.org/schemas), and the
[Agent Skills specification](https://agentskills.io/specification).
