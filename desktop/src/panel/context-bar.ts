/**
 * Shared compact Companion context bar (ADR 2026-07-16 §Decision 1–4,
 * 0.11.0 Phase 4).
 *
 * One framework-free DOM component mounted by all four panel entries
 * (recall.ts, graph.ts, settings.ts, panel.ts) in place of the old
 * `.zam-header` + permanent "Connected to zam mcp" status row. Layout:
 * collapse/expand affordance + app title on the left, an **Agent** pill and
 * a **User** pill (both native `<select>` elements styled as pills, so
 * keyboard operation — tab/enter/escape/arrows — comes for free from the
 * browser) at the far right.
 *
 * Standalone by design, like every other module under desktop/src/panel/
 * (see tests/desktop/module-boundaries.test.ts and the docstrings on
 * recall.ts/graph.ts/settings.ts): no Tauri, no Three.js, no `vscode`
 * import, no import from `../../../src/vscode-extension/*`. The wire shapes
 * below mirror `CompanionContextReadResult`/`EvaluatorRoute` in
 * src/vscode-extension/companion-context.ts and companion-evaluator.ts
 * structurally (that module is this component's source of truth) rather
 * than importing them, so every panel entry stays independently
 * bundleable. `formatAgentLabel` likewise mirrors `formatEvaluatorLabel`
 * from src/vscode-extension/companion-evaluator.ts — keep the two in sync
 * by hand if that rule ever changes.
 *
 * Connection/startup/runtime errors are intentionally NOT this component's
 * job: each panel keeps its own small inline notice element next to its
 * content — `showConnectionNotice`/`clearConnectionNotice` below implement
 * that shared behavior, parameterized by element, so removing the permanent
 * status row never hides an error. `onError` on `mountContextBar` only
 * reports failures from *this* component's own write calls, using that same
 * seam. `createCallTool`/`createContextWriter`/`ensureContextBar` are the
 * rest of the plumbing every panel entry (recall.ts/graph.ts/settings.ts/
 * panel.ts) previously hand-copied (item 9, 0.11.0 review) — see their
 * docstrings below.
 */

import type { App } from "@modelcontextprotocol/ext-apps";

// ── Wire shapes (mirror src/vscode-extension/companion-context.ts) ────────

export type CompanionSurface = "recall" | "graph" | "settings" | "studio";

export type CompanionUserSource =
  | "invocation"
  | "manual"
  | "persisted"
  | "default";

export interface CompanionUserState {
  currentId?: string;
  persistedId?: string;
  source: CompanionUserSource;
}

export interface CompanionLearnerProfile {
  id: string;
  cardCount: number;
}

export interface CompanionEvaluatorDisplayIdentity {
  provider: string;
  model?: string;
}

export interface CompanionEvaluatorRoute {
  id: string;
  displayIdentity: CompanionEvaluatorDisplayIdentity;
  configured: boolean;
  routable: boolean;
  reason?: string;
  selected: boolean;
  active: boolean;
}

export interface CompanionContextBarState {
  surface: CompanionSurface;
  user: CompanionUserState;
  profiles: CompanionLearnerProfile[];
  evaluators: CompanionEvaluatorRoute[];
  selectedEvaluatorId?: string;
  activeEvaluatorId?: string;
  collapsed: boolean;
}

export interface CompanionContextWriteResult {
  read: CompanionContextBarState;
  reloadRequired: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ── Pure label/option helpers (unit-testable without a DOM) ───────────────

/**
 * Client-side mirror of `formatEvaluatorLabel` in
 * src/vscode-extension/companion-evaluator.ts — see that module for the
 * "never a bare VS Code / bare Claude" rule this enforces at the point
 * where provider and model join into display text. Unlike its source of
 * truth, this never throws: the server-side builder already refuses to
 * emit a dishonest bare label (ADR "Safety and privacy"), so this is
 * defense in depth for the UI, not the enforcement point — a UI must
 * degrade, never crash, on unexpected data.
 */
const DISHONEST_BARE_PROVIDERS = new Set(["vs code", "vscode", "claude"]);

export function formatAgentLabel(
  identity: CompanionEvaluatorDisplayIdentity,
): string {
  const provider = identity.provider.trim();
  if (!provider) return "Agent";
  if (
    !identity.model &&
    DISHONEST_BARE_PROVIDERS.has(provider.toLowerCase())
  ) {
    return provider;
  }
  return identity.model ? `${provider}: ${identity.model}` : provider;
}

/** The User pill value: the learner id, marked when scoped to this session only. */
export function userPillValue(user: CompanionUserState): string {
  if (!user.currentId) return "—";
  return user.source === "invocation"
    ? `${user.currentId} (this session)`
    : user.currentId;
}

export function userPillTitle(user: CompanionUserState): string {
  if (!user.currentId) return "No learner resolved yet";
  switch (user.source) {
    case "invocation":
      return `${user.currentId} — this session only; not saved as your Companion preference`;
    case "manual":
      return `${user.currentId} — selected in this context bar`;
    case "persisted":
      return `${user.currentId} — your saved Companion learner`;
    default:
      return `${user.currentId} — ZAM's default user`;
  }
}

/** What the Agent pill should say right now, honestly — never a silent fallback. */
export function agentPillSummary(state: CompanionContextBarState): {
  text: string;
  unavailable: boolean;
  title?: string;
} {
  const active = state.evaluators.find((r) => r.id === state.activeEvaluatorId);
  if (active) {
    return { text: formatAgentLabel(active.displayIdentity), unavailable: false };
  }
  const selected = state.evaluators.find(
    (r) => r.id === state.selectedEvaluatorId,
  );
  if (selected) {
    return {
      text: `${formatAgentLabel(selected.displayIdentity)} (unavailable)`,
      unavailable: true,
      title: selected.reason,
    };
  }
  return { text: "Quick mode — no agent", unavailable: false };
}

/**
 * The Agent pill is the single source of truth for quick-vs-smart mode
 * (review finding 1): once a `companionContext` is present, whether the
 * active evaluator route is `quick-mode` decides it for the panel that owns
 * the mode — never a legacy per-tool flag (e.g. `recall.ts`'s
 * `structured.quickMode`, from `zam_open_recall`'s top-level result), which
 * reflects the old `recall.quick_mode` setting and can disagree with what
 * the pill actually shows/selects. `legacyQuickMode` is only a fallback for
 * a `companionContext`-less result (an older cached tool result, or a host
 * that stripped structuredContent — the same case `fallbackContextBarState`
 * degrades for).
 *
 * Lives here rather than in recall.ts so it can be unit-tested directly:
 * recall.ts (like every panel entry) reads `document`/`window` at module
 * scope and cannot be imported under Node's default (DOM-less) Vitest
 * environment — see tests/desktop/context-bar-build.test.ts's docstring on
 * why this repo verifies DOM-real panel behavior via a build instead.
 */
export function deriveQuickMode(
  companionContext: CompanionContextBarState | undefined,
  legacyQuickMode: boolean,
): boolean {
  if (companionContext) {
    return companionContext.activeEvaluatorId === "quick-mode";
  }
  return legacyQuickMode;
}

export interface OptionModel {
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  title?: string;
}

/**
 * Options for the User `<select>`. `state.user.currentId` always appears
 * even if it is missing from `profiles` (e.g. a session-scoped invocation
 * user or a brand-new profile with no cards yet) — the bar must never
 * silently drop the learner actually in scope from its own picker.
 */
export function buildUserOptions(state: CompanionContextBarState): OptionModel[] {
  const options: OptionModel[] = state.profiles.map((profile) => ({
    value: profile.id,
    text:
      profile.id === state.user.currentId
        ? userPillValue(state.user)
        : `${profile.id} (${profile.cardCount})`,
    disabled: false,
    selected: profile.id === state.user.currentId,
  }));
  if (
    state.user.currentId &&
    !state.profiles.some((profile) => profile.id === state.user.currentId)
  ) {
    options.unshift({
      value: state.user.currentId,
      text: userPillValue(state.user),
      disabled: false,
      selected: true,
      title: userPillTitle(state.user),
    });
  } else if (!state.user.currentId && state.profiles.length > 0) {
    // No learner resolved yet, but real profiles exist to pick from: a
    // native <select> with no option marked `selected` implicitly selects
    // the first one, which would silently claim a learner the bar never
    // actually resolved (map above never marks anything selected in this
    // case, since nothing equals the undefined currentId). A disabled,
    // selected placeholder keeps the display honest instead — and picking
    // any real profile afterward still fires a normal `change` event, since
    // its value differs from this placeholder's empty value.
    options.unshift({
      value: "",
      text: "– Lernprofil wählen –",
      disabled: true,
      selected: true,
    });
  }
  if (options.length === 0) {
    options.push({ value: "", text: "No learner", disabled: true, selected: true });
  }
  return options;
}

/**
 * Options for the Agent `<select>`. An unroutable evaluator (configured but
 * not reachable from this surface) stays in the list, disabled, with its
 * reason appended to the visible text — never selectable as active (ADR
 * "Separate configured, routable, selected, and active").
 */
export function buildEvaluatorOptions(
  state: CompanionContextBarState,
): OptionModel[] {
  const selectedValue = state.selectedEvaluatorId ?? state.activeEvaluatorId;
  return state.evaluators.map((route) => {
    const label = formatAgentLabel(route.displayIdentity);
    return {
      value: route.id,
      text: route.routable ? label : `${label} — unavailable`,
      disabled: !route.routable,
      selected: route.id === selectedValue,
      title: route.reason,
    };
  });
}

// ── DOM mounting ────────────────────────────────────────────────────────

export interface ContextBarCallbacks {
  /** Persist a manual user/evaluator/collapsed choice; the server resolves it. */
  write(payload: {
    userId?: string;
    evaluatorId?: string;
    collapsed?: boolean;
  }): Promise<CompanionContextWriteResult>;
  /**
   * True when the surface has unsubmitted local state a context change
   * would discard (e.g. a typed, unsubmitted Recall answer). When it
   * returns true, the bar asks inline before writing the new selection.
   */
  hasUnsavedChanges?: () => boolean;
  /** Called after a user/evaluator write whose result requires a reload. */
  onReload(newState: CompanionContextBarState): void;
  /** Reports a failed write inline, next to the affected content. */
  onError?: (message: string) => void;
}

export interface ContextBarHandle {
  readonly root: HTMLElement;
  update(state: CompanionContextBarState): void;
}

/**
 * Build a context-bar-shaped fallback for a tool result that carries no
 * `companionContext` (an older cached result, or a host that stripped
 * structuredContent) — degrades honestly instead of leaving the bar with
 * literally nothing to render.
 */
export function fallbackContextBarState(
  surface: CompanionSurface,
  userId: string | null | undefined,
): CompanionContextBarState {
  return {
    surface,
    user: { currentId: userId ?? undefined, source: "default" },
    profiles: userId ? [{ id: userId, cardCount: 0 }] : [],
    evaluators: [
      {
        id: "quick-mode",
        displayIdentity: { provider: "Quick mode — no agent" },
        configured: true,
        routable: true,
        selected: true,
        active: true,
      },
    ],
    selectedEvaluatorId: "quick-mode",
    activeEvaluatorId: "quick-mode",
    collapsed: false,
  };
}

// ── Shared per-panel plumbing (item 9: four-panel dedup) ───────────────────
//
// recall.ts/graph.ts/settings.ts/panel.ts each hand-copied the same
// `callTool`/`writeCompanionContext`/`showConnectionNotice`/
// `clearConnectionNotice` implementations (their own docstrings said so
// explicitly — "Copied from panel.ts's mcpTransport"). Centralizing them
// here does not change what each panel does; it removes the four-way copy
// so a future fix only has to land once. Panels stay independently
// bundleable regardless: `@modelcontextprotocol/ext-apps` is already a
// shared dependency of every one of them, not a new import surface.

/**
 * Build the one `zam_*` tool-call helper every panel needs. Success answers
 * carry JSON on `content[0].text` (never `structuredContent` — the server's
 * `wrapHandler` re-wraps a bare-array result as `{ result }`, which would
 * silently corrupt a list-shaped response); on `isError`, the JSON `error`
 * field is surfaced as the thrown message.
 */
export function createCallTool(
  app: App,
): (name: string, args: Record<string, unknown>) => Promise<unknown> {
  return async (name, args) => {
    const result = await app.callServerTool({ name, arguments: args });
    const first = result.content?.[0];
    const text = first && first.type === "text" ? first.text : undefined;

    if (result.isError) {
      let message = text ?? `${name} call failed`;
      if (text) {
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (typeof parsed.error === "string") message = parsed.error;
        } catch {
          // Not JSON — keep the raw text assigned above.
        }
      }
      throw new Error(message);
    }

    return text === undefined ? undefined : JSON.parse(text);
  };
}

/** Write a manual user/evaluator/collapsed choice through the shared `zam_companion_context` contract, for one fixed surface. */
export function createContextWriter(
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  surface: CompanionSurface,
): (payload: {
  userId?: string;
  evaluatorId?: string;
  collapsed?: boolean;
}) => Promise<CompanionContextWriteResult> {
  return async (payload) => {
    const result = await callTool("zam_companion_context", {
      action: "write",
      surface,
      ...payload,
    });
    return result as CompanionContextWriteResult;
  };
}

/**
 * Connection/startup errors previously lived in the permanent "Connected to
 * zam mcp" status row (removed — ADR 2026-07-16 §Decision 1). This inline
 * notice is the replacement seam: it stays visible next to the content it
 * affects instead of disappearing along with that row. Parameterized by
 * element (each panel keeps its own `#zam-connection-notice`) rather than a
 * closure, since the show/clear behavior itself never varies by panel.
 */
export function showConnectionNotice(
  noticeEl: HTMLElement | null,
  message: string,
): void {
  if (!noticeEl) return;
  noticeEl.textContent = message;
  noticeEl.hidden = false;
}

export function clearConnectionNotice(noticeEl: HTMLElement | null): void {
  if (!noticeEl) return;
  noticeEl.hidden = true;
  noticeEl.textContent = "";
}

const CONTEXT_BAR_STYLE_ELEMENT_ID = "zam-contextbar-styles";

/**
 * The ~120-line context-bar stylesheet every panel's HTML used to carry as
 * its own literal `<style>` copy (recall/graph/studio agreed byte-for-byte;
 * settings-panel.html had already drifted to 14px margins where the other
 * three used 12px — this is the 12px version, unified). Injected once per
 * document by `injectContextBarStyles` instead. Each panel's own HTML keeps
 * only what is genuinely surface-specific (`.zam-card` padding, the graph's
 * bloom-badge colors, …).
 */
const CONTEXT_BAR_CSS = `
.zam-contextbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--card);
  border: 1px solid var(--border);
}
.zam-contextbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.zam-contextbar-toggle {
  font: inherit;
  line-height: 1;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 6px;
}
.zam-contextbar-toggle:hover {
  background: var(--hover);
  color: var(--accent);
}
.zam-contextbar-title {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zam-contextbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.zam-contextbar.collapsed .zam-contextbar-right {
  display: none;
}
.zam-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--muted);
  max-width: 220px;
}
.zam-pill-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.zam-pill-select {
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--fg);
  background: var(--hover);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 9px;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.zam-pill-select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.zam-pill-select.zam-pill-unavailable {
  color: var(--danger);
  border-color: var(--danger);
  background: var(--danger-bg);
}
.zam-contextbar-confirm {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--fg);
  background: var(--hover);
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 6px;
}
.zam-connection-notice {
  font-size: 0.85rem;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  border-radius: 8px;
  padding: 9px 11px;
  margin: 0 0 12px;
}
@media (max-width: 420px) {
  .zam-contextbar {
    flex-direction: column;
    align-items: stretch;
  }
  .zam-contextbar-right {
    justify-content: flex-end;
  }
}
`;

/** Inject the shared context-bar stylesheet once per document, however many panels/instances mount. */
function injectContextBarStyles(): void {
  if (document.getElementById(CONTEXT_BAR_STYLE_ELEMENT_ID)) return;
  const style = document.createElement("style");
  style.id = CONTEXT_BAR_STYLE_ELEMENT_ID;
  style.textContent = CONTEXT_BAR_CSS;
  document.head.appendChild(style);
}

function applyOptions(select: HTMLSelectElement, options: OptionModel[]): void {
  select.replaceChildren();
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.text;
    el.disabled = option.disabled;
    if (option.title) el.title = option.title;
    if (option.selected) el.selected = true;
    select.appendChild(el);
  }
}

/**
 * Tracks at most one pending inline confirm at a time (review finding 5). A
 * second `start()` call — e.g. two pill changes in quick succession, before
 * the first confirm was answered — resolves the *previous* call's promise
 * with `false` and runs `onSuperseded` (hiding its now-stale inline UI)
 * BEFORE returning a fresh promise for the new one. Without this, the first
 * call's promise was simply abandoned: nothing ever resolved it, so its
 * caller's `await` never returned and the first `<select>` was never
 * reverted to match the (unchanged) still-current state.
 *
 * Factored out of `mountContextBar` as a plain class with no DOM dependency
 * so the race itself is unit-testable without jsdom/happy-dom (this repo
 * has neither — see tests/desktop/context-bar-build.test.ts). The DOM-visible
 * half of the fix (hiding the stale confirm UI, reverting the `<select>`)
 * lives in `mountContextBar`'s `confirmIfNeeded`/`change`, verified via a
 * real build instead.
 */
export class PendingConfirmGate {
  private pending: { resolve: (proceed: boolean) => void } | undefined;

  /** Resolve any pending confirm with `proceed`, then register and return a fresh one. */
  start(onSuperseded?: () => void): Promise<boolean> {
    this.resolve(false, onSuperseded);
    return new Promise((resolve) => {
      this.pending = { resolve };
    });
  }

  /** Resolve the current pending confirm, if any, and clear it. A no-op with nothing pending. */
  resolve(proceed: boolean, onResolved?: () => void): void {
    const current = this.pending;
    if (!current) return;
    this.pending = undefined;
    onResolved?.();
    current.resolve(proceed);
  }
}

/**
 * Mount the shared context bar into `container` (replacing its children)
 * and return a handle whose `update()` re-renders it against a fresh
 * `CompanionContextBarState` — e.g. after `app.ontoolresult` delivers a new
 * `companionContext` for first paint, or after this bar's own write calls.
 */
export function mountContextBar(
  container: HTMLElement,
  title: string,
  version: string | undefined,
  initial: CompanionContextBarState,
  callbacks: ContextBarCallbacks,
): ContextBarHandle {
  injectContextBarStyles();

  let state = initial;
  let collapsed = initial.collapsed;
  const confirmGate = new PendingConfirmGate();

  container.replaceChildren();

  const bar = document.createElement("div");
  bar.className = "zam-contextbar";

  const left = document.createElement("div");
  left.className = "zam-contextbar-left";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "zam-contextbar-toggle";
  const titleEl = document.createElement("span");
  titleEl.className = "zam-contextbar-title";
  titleEl.textContent = title;
  left.append(toggle, titleEl);

  const right = document.createElement("div");
  right.className = "zam-contextbar-right";

  function buildPill(
    label: string,
    selectId: string,
  ): { wrapper: HTMLLabelElement; select: HTMLSelectElement } {
    const wrapper = document.createElement("label");
    wrapper.className = "zam-pill";
    const labelEl = document.createElement("span");
    labelEl.className = "zam-pill-label";
    labelEl.textContent = label;
    const select = document.createElement("select");
    select.className = "zam-pill-select";
    select.id = selectId;
    wrapper.append(labelEl, select);
    return { wrapper, select };
  }

  const agentPill = buildPill("Agent", `zam-agent-select-${state.surface}`);
  const userPill = buildPill("User", `zam-user-select-${state.surface}`);
  right.append(agentPill.wrapper, userPill.wrapper);

  bar.append(left, right);

  const confirmArea = document.createElement("div");
  confirmArea.className = "zam-contextbar-confirm";
  confirmArea.hidden = true;

  container.append(bar, confirmArea);

  function render(): void {
    bar.classList.toggle("collapsed", collapsed);
    toggle.textContent = collapsed ? "▸" : "▾";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute(
      "aria-label",
      collapsed ? "Expand context bar" : "Collapse context bar",
    );
    titleEl.title = version ? `${title} · v${version} · zam mcp` : title;

    applyOptions(agentPill.select, buildEvaluatorOptions(state));
    const agent = agentPillSummary(state);
    agentPill.select.classList.toggle("zam-pill-unavailable", agent.unavailable);
    agentPill.select.title = agent.title ?? agent.text;

    applyOptions(userPill.select, buildUserOptions(state));
    userPill.select.title = userPillTitle(state.user);
  }

  function hideConfirm(): void {
    confirmArea.hidden = true;
    confirmArea.replaceChildren();
  }

  /** Ask inline (no native dialogs in an iframe) before a context change discards local state. */
  function confirmIfNeeded(message: string): Promise<boolean> {
    if (!callbacks.hasUnsavedChanges?.()) return Promise.resolve(true);
    // A second selection can arrive before the first confirm is answered
    // (e.g. two quick pill changes). `start()` resolves any still-pending
    // confirm as `false` and hides its now-stale UI first, so the first
    // selection's `change()` call reverts its <select> instead of awaiting a
    // promise nothing would otherwise ever resolve.
    const confirmed = confirmGate.start(hideConfirm);
    confirmArea.replaceChildren();
    confirmArea.hidden = false;
    const text = document.createElement("span");
    text.textContent = message;
    const discardBtn = document.createElement("button");
    discardBtn.type = "button";
    discardBtn.className = "btn secondary-btn btn-sm";
    discardBtn.textContent = "Discard & switch";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn secondary-btn btn-sm";
    cancelBtn.textContent = "Cancel";
    discardBtn.addEventListener("click", () => {
      confirmGate.resolve(true, hideConfirm);
    });
    cancelBtn.addEventListener("click", () => {
      confirmGate.resolve(false, hideConfirm);
    });
    confirmArea.append(text, discardBtn, cancelBtn);
    return confirmed;
  }

  async function change(
    payload: { userId?: string; evaluatorId?: string },
    confirmMessage: string,
  ): Promise<void> {
    const proceed = await confirmIfNeeded(confirmMessage);
    if (!proceed) {
      render(); // revert the <select> to the still-current state
      return;
    }
    try {
      const outcome = await callbacks.write(payload);
      state = outcome.read;
      collapsed = state.collapsed;
      render();
      if (outcome.reloadRequired) callbacks.onReload(state);
    } catch (error) {
      render();
      callbacks.onError?.(errorMessage(error));
    }
  }

  userPill.select.addEventListener("change", () => {
    const nextId = userPill.select.value;
    if (!nextId || nextId === state.user.currentId) return;
    void change(
      { userId: nextId },
      `Switch learner to ${nextId}? Unsubmitted work in this panel will be discarded.`,
    );
  });

  agentPill.select.addEventListener("change", () => {
    const nextId = agentPill.select.value;
    if (!nextId || nextId === (state.selectedEvaluatorId ?? state.activeEvaluatorId)) {
      return;
    }
    void change(
      { evaluatorId: nextId },
      `Switch agent? Unsubmitted work in this panel will be discarded.`,
    );
  });

  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    render();
    void callbacks.write({ collapsed }).catch((error: unknown) => {
      callbacks.onError?.(errorMessage(error));
    });
  });

  render();

  return {
    root: bar,
    update(next: CompanionContextBarState): void {
      // A pending inline confirm belongs to the *previous* state's choice;
      // an externally-driven update (e.g. a fresh ontoolresult) supersedes
      // it rather than leaving a stale confirmation dangling.
      confirmGate.resolve(false, hideConfirm);
      state = next;
      collapsed = next.collapsed;
      render();
    },
  };
}

/**
 * Mount-or-update the shared context bar (item 6/9): with no existing
 * `current` handle, mounts fresh into `container`; with one, just updates it
 * in place. Every panel calls this twice — once immediately at startup with
 * `fallbackContextBarState` (so the title/bar is visible before any tool
 * result, showing no learner/agent claim it can't back yet — review finding
 * 6), and again from `app.ontoolresult` once the real companionContext is
 * known — so the two call sites collapse into one helper instead of each
 * panel re-implementing the same `if (contextBar) { update } else if
 * (container) { mount }` branch.
 */
export function ensureContextBar(
  current: ContextBarHandle | undefined,
  container: HTMLElement | null,
  title: string,
  version: string | undefined,
  state: CompanionContextBarState,
  callbacks: ContextBarCallbacks,
): ContextBarHandle | undefined {
  if (current) {
    current.update(state);
    return current;
  }
  if (!container) return undefined;
  return mountContextBar(container, title, version, state, callbacks);
}
