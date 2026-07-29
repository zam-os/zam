# Name and Show the Surrounding Host as an Answering Route

**Status:** Proposed — decided in principle (Thomas, 2026-07-29), deliberately
not implemented in 0.22.8.
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-16-companion-context-and-harness-affinity.md](2026-07-16-companion-context-and-harness-affinity.md) (evaluator routes, §Decision 5) ·
[2026-07-12a-agent-backed-ai-provider.md](2026-07-12a-agent-backed-ai-provider.md) (agent transport) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP as the canonical transport)

---

## Context

ZAM's panels run in whatever MCP Apps host the user already works in, and the
answer to a recall evaluation can come from two different places:

- **the surrounding session** — the host the panel is embedded in answers, via
  MCP `sampling/createMessage` (or, in the VS Code Companion, the editor's own
  language-model adapter);
- **ZAM's own model registry** — the `zam-text-model` route, which samples back
  through the ZAM MCP server to a configured model, including an
  agent-transport model that shells out to a harness CLI.

Only the second one is fully visible today. The evaluator pill lists
`quick-mode`, `vscode-lm`, `zam-text-model` and `native-mcp-host`, but the
native-host entry carries the generic `displayIdentity` `{ provider: "Native
host" }` (`buildEvaluatorRouteInputs` in `src/cli/companion-context-server.ts`)
and is listed even when it is not routable, with a reason string. So a user
sitting in Codex, Goose, Claude Desktop or the Copilot app sees an anonymous
"Native host" option and cannot tell whether their environment is actually the
thing that would answer.

The identity is available and already flows through the code: the MCP
`initialize` handshake reports the client's name and version
(`getNativeClientInfo` in `src/cli/commands/mcp.ts`,
`normalizeNativeHostIdentity` in `src/vscode-extension/companion-context.ts`),
but `KNOWN_NATIVE_HOSTS` maps only ZAM's own two Companion clients; every other
host falls through to its raw client name and is never turned into a route
label. Routability has one honest signal — whether the client advertised
`sampling` during `initialize` (`getClientSamplingCapable`), which ADR
2026-07-16 §Decision 5 already established as the only non-guessed one.

## Decision

1. **The native-host route is named after the host that would answer.** Its
   `displayIdentity.provider` comes from the negotiated MCP client identity,
   mapped through an extended `KNOWN_NATIVE_HOSTS` (Claude Code, Claude
   Desktop, Codex, Goose, opencode, the Copilot app, Antigravity, plus ZAM's
   own Companions). An unrecognized client keeps its reported name verbatim —
   an honest raw name, never a guessed one.
2. **It is shown only when it is usable.** When the connecting client does not
   advertise `sampling`, the route is omitted from the evaluator list entirely
   rather than listed disabled-with-a-reason. An option a user cannot pick is
   noise; the other routes keep their existing honest-reason behavior.
3. **No model is claimed for it.** The host picks its own model for a sampling
   request and does not have to tell ZAM in advance, so the label names the
   host alone. If a sampling response reports a model, the label may name it
   from that point on — reported, never assumed.
4. **The choice stays in the evaluator pill.** The context bar is where the
   answering route is already selected, so that is where this information
   belongs. The AI-models settings card explains the *agent transport* and
   nothing more.
5. **Detached-harness relaying stays out of scope.** Claude Code, Codex,
   opencode and Goose remain configured-but-unroutable as detached harnesses;
   this ADR only covers the host ZAM is actually connected to.

## Options considered

- **Explain the two answering paths in the AI-models settings card** — built
  and rejected on 2026-07-29: prose in the model list describing "in a host
  environment X, in the ZAM app Y" duplicates a choice the evaluator pill
  already models concretely, and a user cannot act on it there. Either model
  the alternative where it is chosen, or leave it out.
- **Keep the generic "Native host" label** — rejected: it is the one route
  whose usefulness depends entirely on *which* host it is, and the name is
  already known at handshake time.
- **List the route disabled with a reason when sampling is absent** — the
  status quo; rejected per Decision 2 for the native-host route specifically.
- **Probe the host with a trial sampling request to prove usability** —
  rejected: a side-effecting probe against the user's subscription, just to
  render a menu entry.

## Consequences

- A user in Codex, Goose, Claude Desktop or the Copilot app sees their own
  environment named as an answering option when it can answer, and sees
  nothing extra when it cannot.
- Capability advertisement stays the only signal, so a host that advertises
  `sampling` but refuses the request still fails at request time — the
  existing honest inline error covers that; this ADR does not promise
  otherwise.
- `KNOWN_NATIVE_HOSTS` becomes a small piece of ecosystem knowledge that needs
  updating as clients rename themselves; the raw-name fallback keeps an
  unmapped client working, only less prettily.
- The evaluator list becomes surface-dependent in one more way, so the
  context-bar tests gain cases for "route present" and "route absent".
