# Repo-Knowledge Mindmap Prototype — Implementation Plan

Implements an unreleased, fully navigable knowledge map of the ZAM repository.
Activated exclusively via a non-public URL query switch (`?prototype=mindmap`
or `?view=mindmap` or `?prototype=knowledge-map`) in the panel. When the switch
is absent, existing panel functionality (`reader`, `graph`, `log`) remains
100% untouched.

Per node, strictly ~1 proposition/statement is presented. Around any focal node,
the surrounding view forms a coherent Kintsch macro-synthesis and provides direct
orientation pointers ("where to look in the repo") without code-level syntax clutter.
Supports all 3 research-backed visualization modes (Radial Ego-Map, Bi-directional
Tree, Clustered Facet Map) with in-view toggling.

## Status

- [x] Phase 1: Repo Knowledge Graph Data Model & ZAM Knowledge Seed
- [x] Phase 2: Multi-Mode Layout & Navigation Engine (`mindmap-render.ts`)
- [x] Phase 3: OKF Panel Integration with Unreleased URL Query Switch
- [x] Phase 4: Module Boundaries, Tests & Build Verification
- [x] Phase 5: Plugin Architecture & Multi-Provider Registry (Antigravity, Claude, Grok)
- [x] Phase 6: Settings Integration (Alpha-Feature Toggle & Plugin Selector)
- [x] Phase 7: Verification, Tests & Final Build

---

## Phase 1: Repo Knowledge Graph Data Model & ZAM Knowledge Seed

- Define the typed structure for proposition-level repo knowledge:
  - `PropositionNode`:
    - `id`: unique identifier (slug)
    - `title`: short title of the concept / architectural domain
    - `statement`: atomic proposition (~1 sentence assertion)
    - `macroSynthesis`: higher-order integrated synthesis around this focus
    - `anchors`: list of concrete repo pointers (`{ path: string, type: string, description?: string }`)
    - `neighbors`: outgoing typed edges to related proposition nodes
    - `facets`: 4-quadrant facets (north: purpose, east: rule/invariant, south: repo anchor, west: interface/neighbor)
    - `tree`: upstream causes/premises and downstream consequences/rules
- Seed comprehensive ZAM repo knowledge covering:
  - System Overview (`zam_root`)
  - Kernel vs. CLI Layer Separation (`arch_separation`)
  - Kernel AI-Agnostic Purity & Persistence (`kernel_pure`)
  - Token vs. Card Separation (`token_card`)
  - Prerequisite Graph & Blocking (`blocking_mechanic`)
  - Living OKF Articles & Auditing (`okf_reference`)
  - FSRS Scheduling (`fsrs_scheduling`)
  - Observer Privacy & Local-First Guardrails (`observer_privacy`)

## Phase 2: Multi-Mode Layout & Navigation Engine (`mindmap-render.ts`)

- Pure, framework-free, SVG/DOM-based renderer following ZAM's panel design:
  - No Three.js, no external graph libraries (zero new dependencies).
  - Mode 1: **Radial Ego-Centric Map** (Freeman/Heer ego-network: central focus node with radial 1-hop proposition satellites).
  - Mode 2: **Bi-directional Cause-Effect Tree** (TreePlus/Toulmin layout: left upstream premises, center focal claim, right downstream consequences & repo anchors).
  - Mode 3: **Clustered Facet Map** (Storey SHriMP/Polyarchies: 4 cardinal quadrants for purpose, rules, repo locations, and interfaces).
- Interactive navigation:
  - Click-to-recenter on any proposition node.
  - Breadcrumbs trail for back/forward navigation.
  - "Home" reset button to return to the root overview.
  - Bottom panel rendering the integrated Kintsch macro-synthesis and clickable "where to look" repo anchors.

## Phase 3: OKF Panel Integration with Unreleased URL Query Switch

- In `desktop/src/panel/okf.ts` (and `okf-panel.html`):
  - Check `window.location.search` for `prototype=mindmap` or `view=mindmap` or `prototype=knowledge-map`.
  - When present, mount the interactive mindmap container instead of standard tabs, or provide the unreleased view mode.
  - When absent, panel behaves exactly as before — zero regressions for normal users.
  - Accessible directly in development or test via `ui://zam/okf?prototype=mindmap` or browser iframe URL.

## Phase 4: Module Boundaries, Tests & Build Verification

- Ensure `tests/desktop/module-boundaries.test.ts` remains clean (no Tauri, no Three.js, no main.ts leaks).
- Add unit tests for `mindmap-render.ts` and the knowledge graph data structure in `tests/desktop/mindmap-render.test.ts`.
- Run full verification suite:
  - `npm run format`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

## Phase 5: Plugin Architecture & Multi-Provider Registry (Antigravity, Claude, Grok)

- Define standard `MindmapPlugin` contract in `desktop/src/panel/mindmap-plugins.ts`:
  - `id`: `"antigravity" | "claude" | "grok"`
  - `name`: Human-readable title
  - `author`: Implementing author / model
  - `status`: `"ready" | "in_development"`
  - `description`: Architectural summary of the presentation format
  - `mount(container: HTMLElement, options?: MindmapOptions): MindmapController`
- Register 3 plugins:
  1. `antigravity`: The fully working proposition-level multi-mode Kintsch map (Radial, Tree, Facet).
  2. `claude`: Plugin slot for Claude's future mindmap implementation with clean styling and developer hook.
  3. `grok`: Plugin slot for Grok's future mindmap implementation with clean styling and developer hook.

## Phase 6: Settings Integration (Alpha-Feature Toggle & Plugin Selector)

- Provide configuration helper `desktop/src/panel/mindmap-settings.ts`:
  - `isMindmapFeatureEnabled()`: Reads from `localStorage` (`zam:mindmap:enabled`), default `false`. Also respects URL parameter as override.
  - `setMindmapFeatureEnabled(enabled: boolean)`
  - `getActiveMindmapPluginId()`: Default `"antigravity"`.
  - `setActiveMindmapPluginId(id: MindmapPluginId)`
- Add Alpha Feature Card in Desktop Settings (`desktop/index.html`):
  - Heading: "Repo-Wissenslandkarte" with Alpha badge (`settings-badge-alpha`).
  - Toggle checkbox (default: unchecked/off).
  - When enabled: reveals plugin selector with Antigravity (Bereit), Claude (In Entwicklung), Grok (In Entwicklung).
- Update OKF panel to use `getActiveMindmapPlugin().mount(...)` and display current active plugin with quick-switch option.

## Phase 7: Verification, Tests & Final Build

- Test plugin registry and settings storage in `tests/desktop/mindmap-render.test.ts`.
- Full check: `npm run format && npm run lint && npm run typecheck && npm run test && npm run build`.
