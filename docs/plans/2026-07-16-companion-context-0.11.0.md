# ZAM 0.11.0 Companion context and harness-affinity plan

- **Architecture:**
  [Companion Context Bar and Harness Affinity](../adr/2026-07-16-companion-context-and-harness-affinity.md)
- **Target:** 0.11.0
- **Status:** ADR accepted 2026-07-16 after Fable 5 review; implementation has
  not started.

## Status

- [x] **Phase 0 — architecture preparation:** ADR reviewed with Fable 5 on
  2026-07-16; open questions resolved and recorded in the ADR.
- [ ] **Phase 1 — context and evaluator contracts**
- [ ] **Phase 2 — Companion persistence and context selection**
- [ ] **Phase 3 — evaluator routing and sampling repair**
- [ ] **Phase 4 — shared compact MCP App title bar**
- [ ] **Phase 5 — multi-harness verification and 0.11.0 release readiness**

## Working rules

- The ADR was reviewed and accepted 2026-07-16. Decisions: pill label “Agent”
  with concrete route as value; persistence in `~/.zam/config.json`
  (`companion` section); harness identity from normalized `clientInfo` plus an
  explicit opening-argument override; harness relay deferred past 0.11.0 —
  working intelligence first, via Copilot's roster (which includes Claude
  models). Do not silently pick an IPC design during implementation — the
  relay effort starts with its own spike and follow-up ADR after 0.11.0.
- Implement exactly the next unchecked phase.
- Use one future implementation branch and PR, with one commit per phase.
- Keep the kernel AI-agnostic and add no dependency without Thomas's explicit
  approval.
- A connected/configured harness is not an active evaluator until a tested
  adapter can route an answer to it.
- Use `test-user-0.6.2` for live Recall checks. Never rate Thomas's cards while
  validating context switching.
- Do not bump versions until Phase 5 is accepted.

## Phase 1 — context and evaluator contracts

Goal: establish pure, testable semantics before changing UI.

- Add wire types for app context: surface, current/persisted user, native host
  identity, configured harnesses, evaluator routes, selected/active evaluator,
  availability reason, and collapsed state.
- Decide the app-only MCP tool shape after ADR review. Ensure it cannot be
  invoked by the chat model merely because the app needs it.
- Define an evaluator adapter interface covering availability, display
  identity, answer evaluation, and follow-up turns.
- Define selection precedence for explicit opening input, manual selection,
  persisted preference, and legacy `user.id` fallback.
- Add pure tests for:
  - context parsing and backward-compatible defaults;
  - configured versus routable versus selected versus active states;
  - explicit invocation context not silently becoming a persisted preference;
  - user identity remaining attached to every rating call; and
  - unavailable evaluator selections failing without fallback.

**Commit:** `feat: define companion context and evaluator contracts`

## Phase 2 — Companion persistence and context selection

Goal: make menu launches deterministic without yet broadening model routing.

- Add machine-local storage for selected learner, selected evaluator, and
  collapsed state per surface. Do not use the Turso-shared database.
- Return learner profiles and connection inventory through the app-context
  contract. Reuse the existing database-status and agent-harness inspection
  logic rather than creating parallel discovery.
- Make Companion-menu opening pass the persisted learner into Recall, Graph,
  and Settings.
- Make explicit agent-tool opening arguments session-scoped and visibly
  distinguish them from persisted preferences.
- On context change, confirm before discarding an unsubmitted answer or local
  edit, then remount/reload against the new context.
- Add tests covering restart persistence, precedence, test-user isolation, and
  corrupt/missing local preferences.

**Commit:** `feat: persist companion learner and evaluator context`

## Phase 3 — evaluator routing and sampling repair

Goal: make the Agent pill truthful and Smart Recall functional.

- Replace first-model selection with the evaluator adapter registry.
- Repair VS Code cancellation by using and disposing a real
  `CancellationTokenSource`; add a runtime-shaped regression test.
- Add explicit VS Code model discovery/selection and surface the actual
  provider/model label (e.g. “Copilot: Claude Sonnet 5”, never “VS Code” and
  never a bare “Claude”).
- Show Claude Code, Codex, and other detached harnesses as
  configured-but-unroutable with a concise reason; the relay is a post-0.11.0
  follow-up.
- Never fall back from an unavailable selected evaluator to another model.
- Preserve VS Code consent, quota, and cancellation behavior.
- Exercise evaluation and at least one follow-up through each enabled adapter.

**Commit:** `fix: route recall through the selected evaluator`

## Phase 4 — shared compact MCP App title bar

Goal: reclaim app space and make stable context visible only when useful.

- Replace the old header plus permanent status row in Recall, Graph, Settings,
  and Studio with one shared, framework-free context bar.
- Layout: collapse affordance and title on the left, Agent selector, and User
  selector at the far right.
- Move version information to an accessible tooltip/About detail.
- Remove all “Connected to zam mcp” copy and decorative connection dots.
- Preserve actionable startup and runtime failures inline; connection text must
  not disappear without an error replacement.
- Make the bar keyboard accessible, responsive in narrow sidebars, and
  theme-correct in light/dark mode.
- Persist collapse independently for each surface.
- Add structural/bundle tests and visual fixtures for expanded, collapsed,
  narrow, unavailable-agent, and test-user states.

**Commit:** `feat: add compact context bars to ZAM apps`

## Phase 5 — multi-harness verification and 0.11.0 release readiness

Goal: prove the labels and routing match reality before versioning.

- Run the required repository checks:

  ```bash
  npm run format
  npm run lint
  npm run typecheck
  npm run test
  npm run build
  ```

- Package and install the Companion VSIX in a clean VS Code extension host.
- With `test-user-0.6.2`, verify:
  - selection survives reload;
  - menu-opened Recall stays on the test profile;
  - the typed answer reaches the evaluator named in the Agent pill;
  - follow-up discussion uses the same evaluator;
  - switching profile cannot rate the previous profile's card; and
  - quick mode uses no evaluator.
- Run the smoke matrix:
  - VS Code Companion with an explicitly selected Copilot-roster model —
    Claude Sonnet 5 and MAI‑Code‑1‑Flash are configured for experiments on
    the test machine; the Agent pill shows the provider and model;
  - one native MCP Apps host (Codex Desktop) using host sampling;
  - quick mode with no evaluator; and
  - captured configured-but-unroutable states for the remaining installed
    harnesses (Claude Code, OpenCode, Goose as applicable).
- Verify Graph, Settings, and Studio header behavior in both narrow and wide
  mounts.
- Update release notes and all version surfaces to 0.11.0 only after the live
  checks pass.

**Commit:** `release: prepare 0.11.0`

## Review checklist for Thomas and Fable 5 (completed 2026-07-16)

- Does the ADR draw the correct boundary between harness connection and
  evaluator routing? — **Yes**; confirmed against the live VS Code MCP host:
  `vscode.lm` carries only extension-contributed (Copilot) models.
- Is a detached initiating-harness relay required for 0.11.0? — **No; deferred
  past 0.11.0** (owner decision 2026-07-16): working intelligence first, then
  the harness integration as its own effort.
- Is machine-local context storage the right ownership boundary? —
  **Yes, `~/.zam/config.json`**; the MCP server process must resolve
  first-paint context and cannot read VS Code global state.
- Should the learner-facing label be Agent, Harness, or Evaluator? —
  **Agent**, with the concrete route as the pill value.
- Is the proposed title-bar collapse behavior appropriate for the VS Code
  panel, native MCP Apps, and the standalone Studio? — Yes; collapse persists
  per surface in the same config section.
- Are any consent, privacy, or wrong-user rating paths missing? — Two gaps
  were found and folded into the ADR: cross-surface context propagation
  (changes apply to other surfaces on next open/reload, never mid-card) and a
  definition of “session-scoped” (one mounted app instance).

## Post-0.11.0 follow-up — harness integration

Deferred by owner decision on 2026-07-16. Expected benefits: Recall
conversation living in the harness chat pane and host-rendered visualizations
for learning content. First step is a time-boxed (one day) sampling spike, then
its own ADR:

- With `zam mcp` running inside each harness's own session, test whether the
  server can issue `sampling/createMessage` and receive a completion from
  Claude Code and Codex. VS Code's native MCP host is already confirmed
  working (“Configure Model Access”/“Show Sampling Requests”), but its pool is
  the Copilot-contributed `vscode.lm` set, so it adds no harness affinity.
- Record per client: supported yes/no, consent UX, returned model identity,
  and failure mode.
- The relay is pursued only if Claude Code or Codex honors server-initiated
  sampling and the remaining work is a thin, authenticated local hand-off,
  designed in a follow-up ADR (rendezvous point: the harness-side `zam mcp`
  process).
