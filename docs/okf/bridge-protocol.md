---
type: protocol
title: Bridge CLI Protocol
description: zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
tags:
  - cli
  - bridge
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/bridge-protocol.md"
timestamp: 2026-07-29T21:07:20Z
---

`zam bridge <command>` is ZAM's machine-facing CLI transport: an agent
shells out, passes flags, and reads a JSON response from stdout. It is the
**fallback** transport — MCP is the preferred connection (see
[mcp-surfaces.md](mcp-surfaces.md)) — but it remains fully supported and
is what embedded surfaces (for example the desktop app's bundled runtime)
drive.

The hard contract:

- **JSON only.** Every bridge response is JSON, including errors — all
  action output goes through the `jsonOut`/`jsonError` helpers in
  `src/cli/commands/bridge.ts`; a stray `console.log` is a bug. Commander
  errors that occur before an action runs, such as an unknown flag or a
  missing required option, are intercepted by `src/cli/app.ts` and emitted
  through the same `{"error":"..."}` stdout envelope with a non-zero exit
  status and no plain-text stderr. (This is stricter than the `--json` flag
  other commands offer.)
- **`src/bridge/protocol.ts` types are the stable contract.** Agents,
  desktop panels, and the Android companion's additive import program
  against these shapes; breaking them breaks external callers.

Representative commands: `next` (pull the next queue card), `submit`
(apply a rating), `add-token` (register a token *and* create the calling
user's card — see [token-card-model.md](token-card-model.md)),
`personal-card-update` (partial update by slug), and
`personal-card-publish-revision` (publish with an explicit `cosmetic` or
`material` classification). The destructive pair `personal-card-remove` /
`personal-card-delete` uses a preview→confirm handshake: without
`--confirm` it returns an impact preview (affected cards, review logs,
session steps, agent skills); with `--confirm` it executes. Assignment
create, withdraw, and list commands use the same JSON-only surface.

The Android companion accepts one `AddTokenRequest`-shaped bridge-token
object from a selected JSON file or an Android share intent. It also accepts
the CLI's snake-case compatibility spellings, always shows an editable
confirmation draft, ignores a payload-supplied user in favor of the paired
learner, then atomically creates the token, that learner's card, requested
prerequisite edges, and existing knowledge-context assignments. Plain shared
or pasted text and URLs use the same confirmation path as quick-capture
drafts.

A photo or screenshot from the camera or gallery is downscaled on-device
and sent through the native Android command to the library's configured
HTTPS cloud-vision endpoint. The vision model returns one or more
bridge-token-shaped drafts; each stays editable and requires confirmation
before the same atomic import runs. The token records `vision:<model>`
provenance. Image import is online-only and unavailable when cloud vision
is not configured.

# Citations

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/cli/app.ts`, `src/cli/commands/bridge.ts`, `src/bridge/protocol.ts`, `mobile/src/import.ts`, `mobile/src/main.ts`, `mobile/src/vl-import.ts`, `mobile/src/vision-config.ts`, `mobile/src-tauri/src/vision.rs`
