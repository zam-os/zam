---
type: protocol
title: Bridge CLI Protocol
description: zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
tags:
  - cli
  - bridge
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/bridge-protocol.md"
timestamp: 2026-07-17T00:00:00Z
---

`zam bridge <command>` is ZAM's machine-facing CLI transport: an agent
shells out, passes flags, and reads a JSON response from stdout. It is the
**fallback** transport — MCP is the preferred connection (see
[mcp-surfaces.md](mcp-surfaces.md)) — but it remains fully supported and
is what embedded surfaces (for example the desktop app's bundled runtime)
drive.

The hard contract:

- **JSON only.** Every bridge response is JSON, including errors — all
  output goes through the `jsonOut`/`jsonError` helpers in
  `src/cli/commands/bridge.ts`; a stray `console.log` is a bug. (This is
  stricter than the `--json` flag other commands offer.)
- **`src/bridge/protocol.ts` types are the stable contract.** Agents and
  the desktop panels program against these shapes; breaking them breaks
  external callers.

Representative commands: `next` (pull the next queue card), `submit`
(apply a rating), `add-token` (register a token *and* create the calling
user's card — see [token-card-model.md](token-card-model.md)),
`personal-card-update` (partial update by slug), and the destructive pair
`personal-card-remove` / `personal-card-delete`, each a preview→confirm
handshake: without `--confirm` they return an impact preview (affected
cards, review logs, session steps, agent skills); with `--confirm` they
execute.

# Citations

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- Code: `src/cli/commands/bridge.ts`, `src/bridge/protocol.ts`
