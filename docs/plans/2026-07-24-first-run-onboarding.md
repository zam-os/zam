# First-run onboarding — implementation plan

Implements ADR [2026-07-24-first-run-onboarding](../adr/2026-07-24-first-run-onboarding.md)
(personas, goal-driven import, cloud LLM connect, agent choice) and closes the
product gap behind issue [#218](https://github.com/zam-os/zam/issues/218).

Read `AGENTS.md` / `CLAUDE.md` first and work on **exactly the next unchecked
phase**. All phases stay on the single branch `feat/first-run-onboarding` with
**one focused commit per completed phase** (no per-phase branches). The plan is
**harness-agnostic** — later phases may be handed to Antigravity/Codex, so keep
`AGENTS.md` and `CLAUDE.md` in sync and never assume a specific author.

## Goal

Turn a freshly installed **desktop app** (no terminal) into a fully usable ZAM:
the user lands in a **multi-page, resumable first-run flow** that connects a
cloud model, optionally an agent, ensures a working personal workspace, and
seeds their first learning content along a **persona-appropriate import path**.
`zam init` remains the CLI equivalent and shares the same kernel/provisioning
steps so the two front-ends never drift.

Non-negotiables from the ADR:

- **One cloud, local embeddings.** Chat/vision = OpenRouter (`xiaomi/mimo-v2.5`,
  ~€1 prepaid, `data_collection: "deny"` + `zdr: true` on every request). No
  free tier. Embeddings = local `embeddinggemma-300m` only (Ollama on desktop),
  optional and off the critical path.
- **Multi-device stays out of first run.** Server DB / mobile pairing (#218,
  ADR 2026-07-23) is mentioned only on the final page as a later upgrade.
- **Degraded modes are explicit.** Every skippable page leaves the app usable and
  honest; AI-dependent entry points link back to the relevant page instead of
  erroring at the point of use.
- **No kernel scheduling changes.** FSRS, queue, and blocking semantics are
  untouched; `tests/kernel/fsrs.test.ts` stays the source of truth.

## Status

- [x] **Phase 0 — Onboarding shell & first-run gate** — page container, machine-local
  `onboardingDone` flag, Settings re-entry, en/de copy scaffold.
- [x] **Phase 1 — Persona selection + knowledge-context seed** — data-driven personas,
  seeded context, machine-local persistence.
- [ ] **Phase 2 — OpenRouter connect (privacy-enforced)** — guided model page,
  `mimo-v2.5` registration, `deny`/`zdr` injected on every OpenRouter request.
- [ ] **Phase 3 — Local embedding enhancement** — Ollama `embeddinggemma` descriptor,
  optional, surfaced from the model page and the semantic-search entry point.
- [ ] **Phase 4 — Agent page: detect existing / offer ready harnesses** — reuse
  `inspectConnectHarnesses`; Goose / OpenCode / Copilot descriptors.
- [ ] **Phase 5 — Hermes harness adapter** — net-new `hermes` connect target
  (`~/.hermes/config.yaml`, daemon detection).
- [ ] **Phase 6 — Workspace create/repair** — additive repair, missing-workspace
  state in Studio, shared with `zam init`.
- [ ] **Phase 7 — Goal-driven import** — `Lernziel` as an import path reusing the
  curriculum wizard shell.
- [ ] **Phase 8 — Persona content routing** — page 6 wires each persona to its
  default import path; all paths reachable for all personas.
- [ ] **Phase 9 — Degraded-mode surfacing** — dashboard onboarding checklist,
  AI-gated entry points link back to their page.
- [ ] **Phase 10 — Landing page & README rewrite** — desktop-first start; move the
  command-line narrative below the fold.

## Guiding constraints (apply to every phase)

- **Shared logic lives in the kernel/provisioning layer.** The Studio wizard and
  `zam init` (`src/cli/commands/init.ts`) are thin callers of the same functions.
  When a phase adds a step, add it once and wire both fronts — a diverged wizard
  is a defect.
- **Copy is en + de**, authored through the existing kernel i18n
  (`src/kernel/system/i18n.ts`) and the desktop i18n (`desktop/src/i18n.ts`).
  Onboarding is the highest-visibility copy in the product; German-first per the
  field-test audience. Leave further locale packs to Thomas' native-review
  backlog — do not machine-fill them.
- **Machine-local state → `~/.zam/config.json`** via `install-config.ts` helpers,
  never the (shareable) DB. Follow the `agentConnectAutoDone` precedent for new
  flags.
- **IDs are ULIDs**; model rows go through the unified capability registry
  (`ModelEntry`, ADR 2026-07-12) — no new model-storage concept.
- **Verify previewable UI** via the Browser-pane workflow (see each phase's
  Verification). MCP-Apps panels served over `file://` hang in the pane — verify
  the wizard through the desktop dev server plus a double `tsc` and a `dist/ui`
  grep, per the panel-verification note.

## Phase 0 — Onboarding shell & first-run gate

Foundation: a page container and the flag that decides whether first-run shows.

- [x] Add a machine-local `onboardingDone` flag to `InstallConfig`
  (`src/kernel/system/install-config.ts`) with get/set helpers, mirroring
  `getAgentConnectAutoDone` / `setAgentConnectAutoDone`.
- [x] Desktop: on startup, when `onboardingDone` is false **and** the app is not
  mid-review, route to a new `onboarding-view` (`desktop/index.html` +
  `desktop/src/main.ts`) instead of the dashboard. A fourth view alongside
  Dashboard / Learning content / Settings.
- [x] Page container: numbered steps, **Back / Skip / Next**, a progress
  indicator, and a persistent **"Finish later"** that sets no flag but returns to
  the dashboard with the remaining steps visible (Phase 9). Completing the last
  page sets `onboardingDone = true`.
- [x] Settings entry point: a **"Run setup again"** action in the Settings view
  that re-opens the flow without clearing existing state (idempotent; never
  destructive).
- [x] en/de copy scaffold for page chrome (title, Back/Skip/Next, finish).
- [x] `zam init` parity: no behavior change yet, but factor its step sequence so
  later phases can share it (extract a `provisioning/onboarding-steps.ts` seam if
  helpful).

**Verification:** dev server (`preview_start {name}`); fresh config
(`ZAM_CONFIG_PATH` to a temp file) shows the flow; `onboardingDone=true` shows the
dashboard; "Run setup again" re-enters. `read_page` confirms step chrome and refs;
`read_console_messages` clean. `npm run test` + `npm run lint`.

## Phase 1 — Persona selection + knowledge-context seed

- [x] Persona model as **data, not a switch**: a descriptor list
  (`id`, label key, description key, `knowledgeContextSlug`, `defaultImportPath`)
  in the kernel so a fifth persona is a row, not control-flow. Four rows:
  `school` (pupil), `study` (student/apprentice), `work` (employee/freelancer),
  `private` (retiree/free learner).
- [x] Page 2 UI: one card per persona with its one-line *why*, default =
  `private` when skipped.
- [x] Persist the chosen persona machine-local (`install-config.ts`).
- [x] **Seed a matching knowledge context** (ADR 2026-07-04,
  `src/kernel/models/knowledge-context.ts`) if absent — the persona's only lasting
  data-model side effect. Idempotent: never duplicate an existing context.
- [x] en/de copy for the four personas.

**Verification:** selecting each persona seeds exactly one context (inspect via
`zam knowledge-context list` or the kernel); re-running does not duplicate;
skipping yields `private`. Unit test for the seeding idempotency. `npm run test`.

## Phase 2 — OpenRouter connect (privacy-enforced)

The model page — #218's counterpart for models. Guided, not a raw URL/model form.

- [ ] **Provider descriptor** for OpenRouter: base URL, the deep-links (key page,
  credits page, privacy settings), the default model `xiaomi/mimo-v2.5`, and the
  fixed capability set (`text` + `image`).
- [ ] Page 3 UI: explain the two-point story (privacy-by-default, €1 prepaid
  bounded cost); **OpenRouter + `mimo-v2.5` is the default card**, local runtimes
  (Ollama/FastFlowLM) the equal-billing second card (recommended in copy only when
  the hardware profile finds capable NPU/Apple-Silicon). ZAM never creates
  accounts, adds credit, or creates keys — deep-link out; user pastes the key.
- [ ] Register the pasted key + `mimo-v2.5` as a cloud `ModelEntry` and run the
  capability probe (`src/cli/llm/capability-probe.ts`); green AI status on success.
- [ ] **Enforce privacy on every OpenRouter request.** In the chat-completions
  body builder (`src/cli/llm/client.ts`, the `body: JSON.stringify({...})` sites),
  when the endpoint host is `openrouter.ai` (detection already exists near
  `client.ts:130`), inject `provider: { data_collection: "deny", zdr: true }`.
  Prefer a URL-conditional injection over a schema change to `ModelEntry`; if a
  per-model preference is unavoidable, add one optional field, do not reshape the
  registry.
- [ ] `zam init` parity: the CLI model step offers the same OpenRouter path with
  the same enforced request preferences.
- [ ] **Open item to resolve in this phase:** confirm OpenRouter's real minimum
  top-up against the credits page before the copy commits to "€1" (ADR open
  question 6). If it is higher, state the true figure.

**Verification:** register a key (use a throwaway/scratch key or a mocked probe);
`read_network_requests` on a recall/generation call shows the request body carries
`provider.data_collection: "deny"` and `zdr: true` for OpenRouter and **omits**
them for a non-OpenRouter endpoint. AI status flips green. Unit test on the body
builder asserting the preferences are present iff host is `openrouter.ai`.
`npm run test` + `npm run lint`.

## Phase 3 — Local embedding enhancement

Optional, off the critical path — semantic search degrades to lexical without it.

- [ ] Ollama `embeddinggemma` descriptor for the capability-registry `embedding`
  slot (local `ModelEntry`, `runner: "ollama"`), reusing the canonical model id
  from `src/cli/llm/embedder.ts` (`DEFAULT_EMBEDDING_MODEL`).
- [ ] Surface enabling it from two places: a subtle control on the model page
  ("make search understand meaning, not just words") and the semantic-search
  entry point when no embedder is configured. Never block first run on it.
- [ ] If the user chose the **local** chat model in Phase 2, note the runtime is
  already present and enabling embeddings is just a model pull; if they chose
  cloud chat, this is the one place a local runtime is installed — framed as an
  enhancement.
- [ ] Honest empty state: semantic search UI states it is on lexical fallback and
  links here, rather than silently returning worse results.
- [ ] **Mobile is out of scope here** — the on-device runtime path (LiteRT/
  MediaPipe) is ADR open question 5, its own follow-on; desktop only in this plan.

**Verification:** with Ollama + `embeddinggemma` available, enabling fills the
`embedding` role and semantic search returns vector-ranked results; without it,
search still works (lexical) and surfaces the fallback notice. `npm run test`.

## Phase 4 — Agent page: detect existing / offer ready harnesses

- [ ] **Existing-agent branch:** reuse `inspectConnectHarnesses`
  (`src/cli/agent-connect.ts`) to detect installed harnesses (Claude Code/Desktop,
  Antigravity, VS Code, OpenCode, Goose, Copilot). If any are present, the page
  collapses to "Use your existing agent" with the detected list and runs the
  idempotent connect — no install proposed.
- [ ] **Offer branch (none installed):** a **data-driven descriptor table** (row =
  label, strength, consequence, install link, connect target). Ship the three
  already-wired harnesses first: **Goose**, **OpenCode**, **GitHub Copilot** —
  each with its strengths *and* consequences stated plainly (incl. that Copilot's
  free quota and OpenCode Zen's promotional free models are **agent-axis**, run the
  learner's content through that model's own data policy, which ZAM cannot enforce
  `deny`/`zdr` on).
- [ ] ZAM **never silently installs** a harness — link to the vendor instructions,
  verify afterwards.
- [ ] Page is skippable: Studio-only usage works without any agent; `/zam` in a
  harness does not (state this).

**Verification:** on a machine with a detected harness, the page shows the collapse
branch and connect is idempotent; with none, the three offers render from the
descriptor table. `npm run test` + `npm run lint`.

## Phase 5 — Hermes harness adapter

Net-new; the only one of the four not already wired. Blocks nothing else.

- [ ] Add `hermes` to `CONNECT_HARNESSES` / `CONNECT_HARNESS_LABELS`
  (`src/cli/agent-connect.ts`) and the harness-adapter layer
  (`src/cli/agent-harness.ts`).
- [ ] Config writer for **`~/.hermes/config.yaml`** (YAML — new for ZAM, which
  writes JSON/TOML today); register the ZAM MCP server the way `hermes mcp add`
  expects. Idempotent; failures degrade to a warning like every other harness.
- [ ] Gateway-daemon detection (no repo precedent): detect an installed Hermes and
  a running gateway; surface honest status. Do not start the daemon for the user.
- [ ] Add the Hermes row to the Phase 4 descriptor table with its consequence
  (heaviest setup, runs a gateway daemon) and chat-surface strength.
- [ ] `zam agent connect hermes` works from the CLI with the same writer.

**Verification:** `zam agent connect hermes --dry-run` reports the intended
`~/.hermes/config.yaml` change; a real connect writes valid YAML that Hermes reads
(`hermes mcp list` / `hermes config path` if Hermes is installed locally); absent
Hermes, status is an honest "not installed". Unit test for the YAML writer.
`npm run test`.

## Phase 6 — Workspace create/repair

The default personal directory is regenerable infrastructure, not precious.

- [ ] A **"create or repair the personal workspace"** step for the configured path
  producing the fresh-setup structure (`beliefs/`, `goals/`, `skills/`, seed files,
  wired skill links) — reuse `bootstrapSandboxWorkspace` + `wireSkills` from
  `init.ts`. Extract to the provisioning layer so the wizard and `zam init` call
  the same code.
- [ ] **Additive only:** create what is missing, re-link skills; never overwrite or
  delete a user-authored file. "Fresh setup" on an existing directory means
  *complete*, not *reset*.
- [ ] **Missing-workspace state in Studio:** when a workspace is registered
  (`~/.zam/config.json`) but its directory is gone, `renderWorkspaceList`
  (`desktop/src/main.ts`) shows a repair action instead of failing at point of use.
- [ ] Reassure in copy that the DB (`~/.zam/zam.db`) is outside the workspace —
  deleting the directory never loses cards. Source control stays out of first run.

**Verification:** delete the workspace directory → Studio shows the missing state →
repair recreates the structure and re-links skills; a hand-edited seed file is
preserved across repair (additive proof). Unit test: repair is idempotent and
non-destructive. `npm run test`.

## Phase 7 — Goal-driven import

A `Lernziel` becomes an import path of its own, parallel to curriculum import.

- [ ] Reuse the curriculum wizard **shell and confirmed-breadcrumb session**
  (`desktop/src/curriculum-wizard.ts`, `curriculum-wizard-session.ts`,
  `pushConfirmedStep`). Difference: no external taxonomy — the LLM **generates each
  decomposition level page by page**, user confirms/edits/rejects before the next
  page is generated. No "generate 200 cards and hope".
- [ ] Output is the standard import result: tokens + cards + prerequisites, with
  the goal file (`goals/…md`, `src/cli/commands/goal.ts`) as `source_link`.
- [ ] **Hard dependency on a text LLM** — reuse the existing readiness check
  (`assertTextLlmReady`); when absent, link back to Phase 2 rather than erroring.
- [ ] Page 7 of the flow: define a goal; offer goal-driven import inline. All four
  personas reach this page.
- [ ] **Open question to pin before build:** goal-import depth — fixed, user-driven,
  or LLM-decided (ADR open question 3). Decide with Thomas; default to user-driven
  "propose next level until I stop".

**Verification:** with a configured text LLM, a goal decomposes one confirmable
page at a time and importing yields tokens+cards+prereqs citing the goal file;
without an LLM, the path shows the connect-model CTA. `npm run test`.

## Phase 8 — Persona content routing

Page 6 ("your first learning content") routes by persona but locks nothing.

- [ ] Route each persona to its default path: `school` → LehrplanPLUS curriculum
  wizard (ADR 2026-07-02); `study` → free URL/file import; `work` → import from an
  existing project/repo (OKF import, ADR 2026-07-18); `private` → goal-driven
  import (Phase 7).
- [ ] **Every path stays reachable for every persona** from Learning Content — the
  persona picks a default, not a lock.
- [ ] Wire the existing import entry points (`btn-content-import`,
  `btn-content-curriculum-wizard`, the goal path) into the page rather than
  reimplementing them.

**Verification:** each persona lands on its default path; switching persona or
opening Learning Content exposes all paths. `read_page` confirms the routing.
`npm run test`.

## Phase 9 — Degraded-mode surfacing

Make "finish later" and skipped pages first-class, never dead ends.

- [ ] Dashboard **onboarding checklist**: when steps remain (no model, no agent,
  no content, workspace missing), the dashboard shows them as actionable items
  instead of an empty 0-due state.
- [ ] AI-gated entry points (curriculum wizard, goal import, Observer, semantic
  search) show *what* is missing and link to the relevant page — audit for any
  that currently throw at point of use and convert them to a link-back.
- [ ] No agent → Studio-only works; `/zam` in a harness does not — stated, not
  silent.

**Verification:** with each capability missing in turn, the app is usable and the
dashboard/entry points guide the user back to the right page; no unhandled errors
in `read_console_messages`. `npm run test` + `npm run lint`.

## Phase 10 — Landing page & README rewrite

- [ ] Rewrite `README.md` / `README.de.md` and the zam-os.org landing narrative
  around the **desktop first start** (install → open → guided setup), moving the
  command-line story below the fold. Public docs show only what works today; no
  Phase-2/vision/"coming soon" on the landing page.
- [ ] Mention multi-device (server DB + mobile pairing) only as a later upgrade,
  consistent with the flow's final page and ADR 2026-07-23.
- [ ] Keep the landing site privacy-safe (no third-party fonts), per the existing
  site constraints.

**Verification:** links resolve; the install→open→setup path is the primary
narrative; no unshipped features promised. Landing-site changes live in the
separate site repo — coordinate, do not fold into this branch.

## Touchpoints (file map)

- First-run gate & config: `src/kernel/system/install-config.ts`
  (`onboardingDone` + persona, following `agentConnectAutoDone`).
- Desktop shell & views: `desktop/index.html`, `desktop/src/main.ts`,
  `desktop/src/i18n.ts`.
- Model registry & requests: `src/cli/llm/client.ts` (privacy prefs injection),
  `src/cli/llm/capability-probe.ts`, `ModelEntry` (ADR 2026-07-12).
- Embeddings: `src/cli/llm/embedder.ts` (`DEFAULT_EMBEDDING_MODEL`).
- Agents: `src/cli/agent-connect.ts`, `src/cli/agent-harness.ts` (Hermes).
- Workspace: `src/cli/commands/init.ts` (`bootstrapSandboxWorkspace`, `wireSkills`),
  `src/cli/provisioning/*`, `install-config` workspace helpers.
- Knowledge context: `src/kernel/models/knowledge-context.ts`.
- Content/import: `desktop/src/learning-content.ts`,
  `desktop/src/curriculum-wizard*.ts`, `src/cli/commands/goal.ts`.
- CLI parity: `src/cli/commands/init.ts`, `src/cli/commands/setup.ts`.

## Out of scope

- Multi-device / server DB / mobile pairing in first run (that is #218 +
  ADR 2026-07-23; only referenced on the final page).
- Creating accounts, adding credit, or creating API keys on the user's behalf.
- Auto-installing agent harnesses.
- A cloud embedding provider (DeepInfra option was considered and dropped).
- Mobile on-device embedding runtime (ADR open question 5, separate follow-on).
- Any FSRS/queue/kernel scheduling change.

## References

- ADR [2026-07-24-first-run-onboarding](../adr/2026-07-24-first-run-onboarding.md)
- Issue [#218](https://github.com/zam-os/zam/issues/218)
- ADRs 2026-07-04 (knowledge contexts), 2026-07-02 (LehrplanPLUS), 2026-07-11
  (Codex/VS Code surfaces), 2026-07-12 (capability registry), 2026-07-18 (OKF
  import), 2026-07-23 (online-only server DB / mobile gating).
