# Companion Context Bar and Harness Affinity

- **Status:** Proposed
- **Target:** ZAM 0.11.0
- **Date:** 2026-07-16
- **Decider:** Thomas (project owner)
- **Review:** Fable 5 planned before acceptance

**Related:**
[2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-07-11](2026-07-11-codex-and-vscode-companion-surfaces.md) ·
[0.11.0 implementation plan](../plans/2026-07-16-companion-context-0.11.0.md)

---

## Context

ZAM 0.10.11 made Recall host-assisted by default. A typed answer can be checked
through MCP Apps sampling, and the previous reveal-and-self-rate flow remains
available as an opt-in quick mode. A live Companion test exposed two different
problems.

First, the VS Code sampling adapter dereferences
`vscode.CancellationToken.None`, which is undefined in the tested extension
runtime. The request therefore fails before the selected VS Code language
model sees the learner's answer.

Second, fixing that call would not answer the more important question: **which
agent is doing the checking?** One VS Code window can contain Claude Code,
Codex, GitHub Copilot, and other configured harnesses. Recall opened from the
Companion menu has no initiating agent conversation. The 0.10.11 adapter calls
`vscode.lm.selectChatModels({})` and uses the first result, so the visible
Companion has no honest affinity with Claude, Codex, or Copilot.

The current MCP App headers make this ambiguity worse. They spend a second row
on a green dot and text such as `Connected to zam mcp — thomas`. That was useful
while bootstrapping MCP Apps, but it now:

- describes transport health rather than learning context;
- combines the transport and learner profile in one technical sentence;
- does not identify the evaluator;
- occupies permanent vertical space; and
- lets a menu-opened Recall silently fall back to the database's default user.

The live test consequently opened 121 cards for `thomas`, even though a
separate agent-triggered test had intentionally used `test-user-0.6.2`.

The desktop Settings view already distinguishes installed and MCP-configured
harnesses such as OpenCode and Goose. That connection inventory is useful, but
it must not be confused with an active Recall evaluator. MCP configuration
means that a harness can call ZAM tools; it does not prove that the Companion
can send a sampling request into that harness's current conversation.

This ADR supersedes the following assumptions in the 2026-07-11 Companion ADR:

- “users normally run one agent harness at a time”; and
- cross-harness ownership can remain invisible to the Companion UI.

The decision to ship one host-neutral Companion extension remains unchanged.

## Decision

### 1. Make learning context explicit and compact

Every focused MCP App (Recall, Graph, and Settings) and the legacy Studio MCP
App gets one shared context title bar. It replaces the permanent connection
status row.

In its normal state the bar contains, from left to right:

1. a collapse/expand control and the app title;
2. an **Agent** pill/drop-down;
3. a **User** pill/drop-down aligned at the far right.

The User pill always shows the learner profile whose cards, queue, and ratings
are in scope. The Agent pill always shows the actual evaluation target. The
bar may include transient loading treatment, but it never says “Connected to
zam mcp”. Version information moves to an accessible title/tooltip or an About
surface instead of consuming a permanent row.

The bar can collapse to a narrow title/expand affordance. Its collapsed state
is remembered per surface. Connection failures and action errors remain
visible next to the affected content; removing the status row must not hide an
error.

### 2. Separate configured, routable, selected, and active

The UI and contracts use four distinct states:

- **configured** — ZAM MCP configuration exists for the harness;
- **routable** — the current surface has an implemented adapter that can send
  an evaluation request to it;
- **selected** — the user chose it as the preferred evaluator;
- **active** — the current Recall request is actually using it.

Only an active or provably routable selection may appear as the active Agent
pill. A configured but unroutable Claude Code or Codex installation can appear
in the drop-down with an explanation, but it must be disabled and must never be
presented as the model checking the answer.

VS Code language models are one evaluator adapter, not a synonym for all VS
Code agent extensions. The adapter must expose the provider/model it actually
selected rather than labelling an arbitrary `vscode.lm` result “Codex” or
“Claude”.

### 3. Use a shared app-context contract

Add an app-only MCP context contract used by every ZAM MCP App and by the
Companion host. Its read result contains at least:

- current surface and native MCP client identity when available;
- learner profiles and selected learner ID;
- configured harness inventory;
- evaluator routes with availability and explanatory reason;
- selected and active evaluator IDs; and
- collapsed state for the current surface.

Its write operation changes only the selected user, evaluator, or collapsed
state. The tool is not exposed as a general chat-model tool. Exact tool naming
and whether read/write use one action-based tool or two tools remain an
implementation detail, but the wire types must be tested independently of the
DOM.

The tool result returned by `zam_open_recall`, `zam_show_graph`, and
`zam_open_settings` includes the resolved context needed for first paint. The
app must not briefly render the wrong learner while waiting for a second call.

### 4. Persist UI affinity locally, not in the shared learning database

Harness availability and UI placement are machine-specific. Persist these
preferences in ZAM's machine-local configuration (or VS Code global state with
a migration path), never in the Turso-shared learning database:

- selected Companion evaluator;
- selected Companion learner profile; and
- collapsed state per app.

Changing the Companion learner must not silently rewrite the database-wide
`user.id` default used by unrelated CLI or harness sessions.

Opening arguments have the following precedence:

1. an explicit user/evaluator supplied for the current invocation;
2. a user selection made in the context bar;
3. the persisted Companion selection;
4. ZAM's existing default user, for backward compatibility.

An explicit agent invocation is session-scoped unless the user confirms it as
the new preference in the context bar. A manual drop-down choice is persisted
and reused on the next Companion-menu launch.

Changing user or evaluator is a context boundary. If the current surface has
an unsubmitted answer or other local edits, it asks before discarding them,
then reloads against the new context. A rating always carries the user shown in
the title bar.

### 5. Route evaluation through explicit adapters

Companion evaluation uses a small adapter boundary rather than selecting the
first model globally. Each adapter reports identity and availability and owns
answer evaluation plus follow-up turns.

The initial adapter set is:

- **native MCP Apps host** — authoritative when the app is rendered by the
  initiating harness and that host advertises sampling or `ui/message`;
- **VS Code Language Model API** — available in the Companion only for models
  actually returned by VS Code, with an explicit model choice and VS Code's
  consent/quota handling; and
- **quick mode** — model-free fallback, clearly labelled as such rather than as
  an agent.

Claude Code, Codex, Copilot, OpenCode, and Goose become selectable Companion
evaluators only when a tested adapter can reach that harness. Starting or
driving a harness CLI process for every answer is not an acceptable adapter.

Harness-initiated detached Companion rendering requires a return path to the
initiating MCP client if it is to use that client's intelligence. The exact
relay design is an acceptance gate for this ADR and must be reviewed before
implementation; see Open Questions.

### 6. Fix sampling without weakening cancellation

The VS Code adapter replaces `vscode.CancellationToken.None` with a real
`CancellationTokenSource`, passes its token to `sendRequest`, and disposes the
source. A regression test must exercise the adapter boundary so a locally
invented `.d.ts` shape cannot again mask a missing runtime API.

No LLM or harness dependency enters `src/kernel/`. Routing and model calls stay
in the CLI/host layer.

## Options considered

### Keep `selectChatModels({})[0]`

Rejected. It is fast to implement but cannot tell the learner which agent is
checking the answer and changes behavior when extension/model registration
order changes.

### Treat every MCP-configured harness as routable

Rejected. MCP configuration lets the harness call ZAM; it does not give the
detached Companion access to the harness conversation or sampling capability.

### Give the Companion its own provider credentials

Rejected. It duplicates ZAM provider configuration, bypasses host consent and
quota UI, and moves away from the requirement to use the chosen harness's
intelligence.

### Launch a CLI harness for each Recall request

Rejected. It adds process lifecycle, permissions, latency, and conversation
continuity problems, and would turn a compact learning interaction into an
automation side effect.

### Keep context in a permanent second status row

Rejected. Agent and user are stable context, not streaming status. A compact,
collapsible title bar preserves the information without reducing app space.

### Add A2UI

Rejected for this decision. A2UI can change how a host describes and renders
interfaces; it does not identify or connect the evaluator behind a detached
Companion surface.

## Consequences

### Positive

- The learner always sees which user will receive a rating and which agent or
  model is checking the answer.
- Test profiles can be selected once and reused without changing Thomas's
  global default profile.
- Recall, Graph, Settings, and Studio gain a consistent, smaller header.
- A configured-but-unroutable harness is represented honestly.
- New evaluator integrations fit behind one adapter contract.

### Costs

- Context selection becomes a real cross-surface contract rather than local
  header markup.
- Detached Companion routing to an initiating harness needs correlation and a
  safe return channel.
- User changes must handle unsaved in-card state.
- Native MCP App hosts expose different client identity and sampling
  capabilities, so the context bar must degrade without guessing.

## Safety and privacy

- Harness selection is not authorization. Existing host consent and ZAM tool
  restrictions remain authoritative.
- Learner answers are not persisted in the machine-local context preference.
- A future relay must not use the UI-intent file as a plaintext answer mailbox.
- The visible User pill is part of the FSRS safety boundary: submission code
  must use that same resolved user explicitly.
- Unavailable harnesses stay unavailable rather than silently falling back to
  a different model. The user may deliberately choose another route or quick
  mode.

## Open questions for Fable 5 review

1. What is the smallest safe relay from a detached Companion to the initiating
   MCP client's sampling capability: same-process hosting, authenticated local
   IPC, or a versioned request/response broker?
2. Can the initiating MCP client be identified reliably from SDK client info
   across Codex, Claude Code, Copilot, OpenCode, and Goose, or must launch
   presets inject an explicit harness ID?
3. Should the UI label say **Agent**, **Harness**, or **Evaluator**? “Agent” is
   clearest for learners, while “Evaluator” is technically more accurate for a
   direct VS Code model.
4. Should 0.11.0 ship only native-host and VS Code-LM adapters, showing other
   configured harnesses as unavailable, or is at least one detached harness
   relay required for the release?
5. Does context persistence belong solely in `~/.zam/config.json`, or should
   the VS Code extension own it and expose a synchronized context capability to
   the iframe?

## Acceptance criteria

- No ZAM MCP App renders “Connected to zam mcp” or the old permanent status
  dot.
- The title bar is compact, keyboard accessible, collapsible, and consistent
  across Recall, Graph, Settings, and Studio.
- Agent and User selections survive a Companion restart.
- A Companion-menu launch reuses the selected learner rather than silently
  using `user.id`.
- The active Agent pill matches the adapter/model that processes the answer.
- Configured but unroutable harnesses cannot be selected as if active.
- Switching learner cannot submit or rate a card for the previous learner.
- The test profile can complete Recall without changing Thomas's queue.
- The VS Code sampling request no longer crashes on cancellation-token setup.
- Format, lint, typecheck, full tests, build, Companion packaging, and a live
  multi-harness smoke test pass before 0.11.0 is released.
