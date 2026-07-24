# First-Run Onboarding: Personas, Goal-Driven Import, Cloud LLM Connect, and Agent Choice

**Status:** Accepted
**Date:** 2026-07-24
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-13b-approachable-setup-and-self-update.md](2026-06-13b-approachable-setup-and-self-update.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md](2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md) ·
[2026-07-04-knowledge-contexts.md](2026-07-04-knowledge-contexts.md) ·
[2026-07-11-codex-and-vscode-companion-surfaces.md](2026-07-11-codex-and-vscode-companion-surfaces.md) ·
[2026-07-12-unified-capability-model-registry.md](2026-07-12-unified-capability-model-registry.md) ·
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md) ·
issues [#218](https://github.com/zam-os/zam/issues/218)

---

## Context

Issue #218 introduced a **guided desktop wizard for one piece of setup** (create or
connect a server database). Working on it exposed the larger gap: #218 is not a
one-off feature, it is the first instance of a missing product surface — a
**first-run onboarding**.

Today's reality:

- `zam init` (`src/cli/commands/init.ts`) *is* a decent onboarding wizard — but it
  is a terminal program with `@inquirer/prompts`. It is invisible to anyone who
  installs the signed desktop app and double-clicks it.
- The public landing page (zam-os.org) and README present a **command-line first
  start**. That matches developers and excludes the field-test audience: a
  ninth-grade Realschule learner (Bavaria), a retiree, a freelancer.
- The desktop app (`desktop/index.html`, three views: Dashboard, Learning content,
  Settings) has **no first-run state at all**. A fresh install opens on an empty
  dashboard: 0 due cards, no domains, no models, no content. Every capability that
  would fix that (model registry, agent connect, curriculum wizard, workspaces,
  server DB, mobile pairing) exists — but only as scattered controls inside the
  *Settings* view, which a new user has no reason to open.
- Consequently the AI-dependent paths silently fail: the curriculum wizard aborts
  with "text LLM offline" (`assertTextLlmReady`), semantic search has no
  embeddings, the Observer has no vision model.

The building blocks are there. What is missing is a **sequence** that walks a
newly installed user from "app opened" to "I can use ZAM fully", and the two
connectors that sequence depends on — a **cloud LLM** (nothing comparable to #218
exists for models) and an **agent harness** (the CLI auto-connects only harnesses
that happen to be installed already).

---

## Decision

### 1. First-run onboarding is a desktop surface, multi-page, resumable

A dedicated first-run flow in the Tauri Studio, shown when the install has not
completed onboarding (machine-local flag in `~/.zam/config.json`, alongside
`agentConnectAutoDone`), reachable afterwards from Settings ("Run setup again").

- **Multi-page, not a single dense form.** Each page carries one decision and one
  short explanation of *why* it matters for learning — the "wichtigsten Dinge",
  not a feature tour.
- **Resumable and skippable.** Every page can be deferred; the dashboard then
  shows the remaining steps as a checklist. Nobody is trapped behind a modal.
- **Idempotent.** Re-running it never destroys existing state (see §4).
- `zam init` stays as the CLI equivalent and **shares the same kernel-level
  steps**; the wizard is a second front-end, not a fork of the logic.

Page order (each page's *content* is persona-dependent, see §2):

| # | Page | Purpose | Skippable |
|---|------|---------|-----------|
| 1 | Welcome + language | What ZAM is, in three sentences; locale | no |
| 2 | Who are you learning as | Persona choice (§2) | no (defaults to "free learner") |
| 3 | Connect an AI model | Cloud LLM connect, OpenRouter first (§5) | yes (degraded mode) |
| 4 | Connect an agent | Harness choice or existing-agent detection (§6) | yes |
| 5 | Your workspace | Default personal directory, create/repair (§4) | no |
| 6 | Your first learning content | Persona-specific import path (§2) | yes |
| 7 | Your first goal | Define a `Lernziel`; optional goal-driven import (§3) | yes |
| 8 | Done | What just happened, where to continue, mention multi-device (#218) | — |

Multi-device (server DB, mobile pairing) is **not** part of first run. Per ADR
2026-07-23 the local DB is the fastest first-run path; #218's wizard stays an
explicit upgrade step, mentioned on page 8 and no earlier.

### 2. Four start personas

The persona is the only branching variable in onboarding. It exists because the
same product serves fundamentally different learning economies, and the *import
path* — not the scheduler, not the UI — is what differs.

| Persona | Typical content | Page 6 default path |
|---|---|---|
| **Pupil** (`school`) | State curriculum, fixed syllabus, exam dates | LehrplanPLUS curriculum wizard (ADR 2026-07-02) |
| **Student / apprentice** (`study`) | Lecture notes, a textbook chapter, a spec, a web source | Free import: URL or file → tokens |
| **Employee / freelancer** (`work`) | The project in front of them; knowledge that must not decay | Import from an existing project/repo (OKF import, ADR 2026-07-18) |
| **Retiree / free learner** (`private`) | Self-chosen interests, no external syllabus, no deadline | Goal-driven import (§3) |

Rules:

- The persona **selects a default, it does not lock anything.** Every import path
  stays reachable from Learning Content for every persona.
- **All four personas reach page 7** (define a goal). Goals are the one concept
  shared across all life phases.
- The persona is persisted as a machine-local setting and **seeds a matching
  knowledge context** (ADR 2026-07-04), which is otherwise user-created and
  therefore empty on a fresh install. That is the persona's only lasting
  side effect on the data model.
- The list is **extensible data, not a `switch`** — adding a fifth persona must
  not require touching the wizard's control flow.

### 3. A goal (`Lernziel`) is a first-class import path

Today `zam goal` manages markdown files in the workspace's `goals/` directory and
nothing more: goals reference tokens, they do not produce them.

**Decision:** a goal becomes an **import source of its own**, structurally parallel
to the curriculum import, with one difference — where LehrplanPLUS reads a fixed
external taxonomy (country → region → school type → grade → subject → topic), a
goal has **no external source**: the LLM generates the structure, **page by page,
under user confirmation at each page**, exactly like the curriculum wizard's
step-by-step confirmation loop.

- Same wizard shell, same confirmed-breadcrumb session model, same preview →
  select → import step (`CurriculumWizardSession`, `pushConfirmedStep`).
- Each generated page is a *proposed decomposition level* the user accepts,
  edits, or rejects before the next page is generated. No "generate 200 cards
  and hope".
- Output is the same as every other import: tokens + cards + prerequisites, with
  the goal file as `source_link`.
- **Requires a text LLM.** This is the hard dependency that makes §5 a
  prerequisite for §3, and the reason the model page precedes the content pages.

### 4. The default personal workspace is recreatable, not precious

Creating a git repository is a real barrier for the target audience. A **personal
working directory** is not — everyone has one. But an ordinary directory can be
deleted, moved, or emptied, and today that leaves the install in a half-broken
state with a workspace registered in `~/.zam/config.json` pointing at nothing.

**Decision:** the default personal workspace is treated as **regenerable
infrastructure**:

- The wizard offers **"create or repair the personal workspace"** for the
  configured path, producing the same structure a fresh setup produces
  (`beliefs/`, `goals/`, `skills/`, seed files, wired skill links — the current
  `bootstrapSandboxWorkspace` + `wireSkills` pair).
- **Repair is additive only.** It creates what is missing and re-links skills; it
  never overwrites or deletes a file the user has written. A "fresh setup" result
  on an existing directory means *complete*, not *reset*.
- The Studio surfaces a **missing-workspace state** (path registered, directory
  gone) with the repair action, instead of failing at the point of use.
- The learning **database is not in the workspace** and is unaffected by deleting
  it (`~/.zam/zam.db`). Losing the working directory must never mean losing cards.
- Source control stays optional and out of first run. Publishing to GitHub
  (`zam workspace publish`) remains a later, deliberate step.

### 5. Cloud LLM connect wizard — OpenRouter as the first provider

This is #218's counterpart for models: a guided connect flow, not a raw
"label / URL / model / key" form (`showModelForm`), which currently presumes the
user already knows a base URL and a model id.

**OpenRouter is the first supported provider** because it is the only one that
lets a first-time user satisfy all three of ZAM's onboarding constraints at once:

1. **Privacy-safe start.** OpenRouter exposes account-level privacy settings
   (separate for paid and free models) *and* per-request enforcement via the
   `provider` object: `data_collection: "deny"` restricts routing to endpoints
   that do not store prompts, and `zdr: true` restricts to zero-data-retention
   endpoints. ZAM can therefore make "my data is not trained on and not kept" a
   **checkbox we actually enforce on every request**, not a promise about someone
   else's dashboard.
2. **Free start.** `:free` model variants allow a zero-payment trial for users who
   do not care about (1) — the two are a deliberate either/or, see below and
   Consequences.
3. **Bounded cost.** Prepaid credits plus a per-key spend cap (`limit` +
   `limit_reset`) let a user cap themselves at ~€1/day, so a bad model choice
   cannot produce a surprise bill.

**Privacy is the default; free is an opt-in with a warning (decided 2026-07-24).**
Because "safe start" and "free start" are mutually exclusive at the routing layer
(`data_collection: "deny"` + `zdr: true` routes around exactly the `:free`
endpoints, which log in exchange for being free), the page does **not** present
them as equal choices. It starts with **privacy enforcement on** and
`xiaomi/mimo-v2.5` selected. Free models appear only as a **secondary, de-emphasised
option** carrying an explicit warning — "your inputs are stored and may be used for
training" — never pre-selected. This matches the target audience (a minor learner,
a retiree) for whom the privacy default must be the one that requires no
understanding of routing to be safe.

**Default start model: `xiaomi/mimo-v2.5`** — multimodal (text, image, audio,
video input) at $0.14 / $0.28 per million tokens (verified 2026-07-24), i.e. one
model that fills the `text`, `recall` **and** `vision` capabilities at roughly a
third of the price of `mimo-v2.5-pro`, which is text-only. It is registered
through the existing unified capability registry (ADR 2026-07-12) as a cloud
entry with `text` + `image` capabilities — no new storage concept.

Flow: choose OpenRouter → explain the three options above → user creates the
account and key **on openrouter.ai themselves** (ZAM deep-links to the key page
and the privacy settings page; ZAM never creates accounts or keys) → paste key →
probe (`capability-probe.ts`) → register `xiaomi/mimo-v2.5` → green AI status.

The provider list is **extensible**; OpenRouter is first, not exclusive.

**Cloud (OpenRouter) is the default offer on page 3; local is the equal-billing
second card (decided 2026-07-24).** ZAM still profiles hardware, but the default no
longer follows the profile: pasting one API key is reachable for the target
audience, while a multi-GB model download plus a runtime install is not, and the
outcome would differ per machine in a way that is hard to document and support. So
page 3 leads with OpenRouter + `xiaomi/mimo-v2.5` (one entry covering `text` and
`vision`), and presents local runtimes (Ollama, FastFlowLM) as a fully visible,
first-class second card — recommended in copy where the profile found capable NPU /
Apple-Silicon hardware, but not auto-selected. The machine-local vs. DB storage
split of ADR 2026-07-23 §4 is unchanged.

### 6. Agent harness page: four offers, or "use what you already have"

**If harnesses are already installed** (`inspectConnectHarnesses` already detects
Claude Code, Claude Desktop, Antigravity, VS Code, OpenCode, Goose, Copilot), the
page collapses to *"Use your existing agent"* with the detected list, and connect
runs idempotently. No installation is proposed to someone who already has one.

**If none is installed**, ZAM proposes **four options**, each with its strengths
*and* its consequences stated plainly, and lets the user choose:

| Option | Strength | Consequence to state |
|---|---|---|
| **Goose** | Open source, simple config, already a supported harness | Desktop/CLI, needs its own model config |
| **OpenCode** | Open source, terminal-native, already supported | Terminal-centric; steeper for non-developers |
| **GitHub Copilot** | Free monthly quota — cheapest real start; already supported | Account required; quota-limited; not open source |
| **Hermes Agent** (NousResearch) | Open source, MCP-native, reachable from chat surfaces (Telegram/Signal/…), which fits reviews away from the desk | **Net-new harness for ZAM** (built in this release); runs a gateway daemon; heaviest setup |

- The page is **data-driven and extensible** — a fifth harness is a table row plus
  an adapter, not a redesign.
- **All four ship in the first onboarding release (decided 2026-07-24)**, so the
  choice page is complete from day one. Goose, OpenCode and Copilot are already in
  `CONNECT_HARNESSES`; **Hermes is net-new** and blocks nothing else, so it is
  built alongside the page rather than deferred to a follow-on.
- **Hermes requires new work**: a `hermes` entry in `CONNECT_HARNESSES` writing
  `~/.hermes/config.yaml` (YAML, unlike the JSON/TOML harnesses ZAM writes today),
  plus gateway-daemon detection for which the repo has no precedent
  (`hermes mcp add zam` / `hermes config path`). Its chat-surface reach
  (Telegram/Signal/…) is genuinely differentiating for reviews away from the desk,
  which is why it earns day-one inclusion despite the added config-writer.
- ZAM **does not silently install** a harness. It links to the vendor's install
  instructions and verifies afterwards; unattended third-party installers stay out
  of the onboarding path.

### 7. Degraded modes are explicit, never silent

Any skipped page leaves the app **usable and honest**:

- No model → manual card authoring and reviews work; every AI-dependent entry
  point (curriculum wizard, goal import, Observer, semantic search) shows *what*
  is missing and links back to page 3 instead of erroring at the point of use.
- No agent → Studio-only usage works; `/zam` in a harness does not.
- No import → the dashboard shows the import paths rather than an empty state.

---

## Consequences

**Easier**

- A non-developer can install the app and reach a working, populated ZAM without
  ever opening a terminal — the actual goal of this ADR.
- #218's server-DB wizard stops being a special case: it becomes one step in a
  documented onboarding vocabulary (connect DB / connect model / connect agent).
- Every persona has a named path to their first cards, which makes the landing
  page rewritable around outcomes instead of commands.
- Losing the working directory becomes a recoverable annoyance, not a reinstall.

**Harder / follow-on work**

- **OpenRouter has no `/v1/embeddings` endpoint** (verified: 404). A cloud-only
  install therefore cannot fill the `embedding` role, and semantic token search
  (ADR 2026-07-03) degrades to lexical search. Cloud-only users need either a
  local embedder or a second provider for that role — this must be stated in the
  wizard, not discovered later.
- **Free models and the privacy guarantee are mutually exclusive in practice.**
  `:free` endpoints are exactly the ones that log; `data_collection: "deny"` +
  `zdr: true` will route around them. The page must present this as an explicit
  either/or ("free" *or* "private"), never imply both.
- **Free-tier throughput is thin.** With under $10 of credits purchased,
  `:free` models are capped at ~20 requests/minute and **50 requests/day**
  globally per account. A page-by-page goal import (§3) can exhaust that in one
  sitting. The free path is a taste test, not a working configuration.
- The spend cap is set **in the OpenRouter dashboard**, not by ZAM. The wizard can
  only instruct and link; it cannot enforce €1/day on the user's behalf.
- Two front-ends (`zam init` and the Studio wizard) must not drift — shared steps
  belong in the kernel/provisioning layer with the CLI and the wizard as thin
  callers.
- Hermes support is net-new: YAML config writing, daemon detection, and a
  verification path ZAM has no precedent for.
- Onboarding copy is user-facing text in **en + de** (ADR i18n reference pair),
  and it is the highest-visibility copy in the product.

**Explicitly out of scope**

- Multi-device / server DB / mobile pairing in first run (ADR 2026-07-23).
- Creating accounts or keys on the user's behalf, for any provider.
- Auto-installing agent harnesses.
- Any change to FSRS, the queue, or kernel scheduling semantics.

---

## Resolved (2026-07-24)

- **Free vs. private start (§5).** Privacy enforcement is the default; free models
  are a de-emphasised opt-in with an explicit logging/training warning, never
  pre-selected.
- **Retiree persona content path (§2, §3).** Goal-driven import — the retiree has
  no external syllabus, so the LLM-generated `Lernziel` decomposition is their hero
  path, not curriculum or a pre-existing source.
- **Local vs. cloud on page 3 (§5).** Cloud (OpenRouter + `xiaomi/mimo-v2.5`) is
  the default offer; local runtimes are the equal-billing, hardware-recommended
  second card, not auto-selected by the hardware profile.
- **Agent scope (§6).** All four harnesses ship in the first release; Hermes is
  built net-new alongside the page.

## Open questions

1. **Persona persistence.** Assumed machine-local + seeded knowledge context.
   Alternative: per-user in the DB, so a paired phone inherits it.
2. **Student vs. apprentice.** Treated as one persona with a free-import default.
   An apprentice (`Auszubildender`) arguably sits between "student" and "work".
3. **Goal-import depth.** How many pages deep does a goal decompose before the
   wizard stops proposing, and who decides — fixed depth, user-driven, or LLM?
4. **Default when the user skips the persona page.** Assumed "free learner".

---

## Implementation sketch (not this ADR's commit scope)

1. Onboarding shell: first-run detection, page container, resume/skip state,
   Settings entry point, en/de copy.
2. Persona model as data + knowledge-context seeding.
3. Cloud LLM connect wizard with the OpenRouter provider descriptor
   (privacy toggle → `provider.data_collection`/`zdr`, `xiaomi/mimo-v2.5`
   registration, capability probe, embedding-gap warning).
4. Workspace create/repair (additive) + missing-workspace state in Studio.
5. Agent page: reuse `inspectConnectHarnesses` for the "existing agent" branch;
   descriptor table for the four offers.
6. Goal-driven import reusing the curriculum wizard shell.
7. Hermes harness adapter (`~/.hermes/config.yaml`).
8. Landing-page and README rewrite around the desktop first start.

---

## References

- Issue [#218](https://github.com/zam-os/zam/issues/218) — server-DB create/connect wizard
- OpenRouter models API (`xiaomi/mimo-v2.5` modalities and pricing, verified 2026-07-24)
- OpenRouter provider routing (`data_collection`, `zdr`) and API key limits
  (`limit`, `limit_reset`; free-tier 20 rpm / 50 rpd below $10 credits)
- Hermes Agent (NousResearch) — `~/.hermes/config.yaml`, `hermes mcp add`, gateway daemon
- Thomas' onboarding notes, 2026-07-24
