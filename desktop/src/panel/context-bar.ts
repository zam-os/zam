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
 * Connection/startup/runtime errors are intentionally NOT this module's
 * job: each panel keeps its own small inline notice element next to its
 * content (see e.g. recall.ts's `showConnectionNotice`) so removing the
 * permanent status row never hides an error. `onError` below only reports
 * failures from *this* component's own write calls, using that same seam.
 */

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
  let state = initial;
  let collapsed = initial.collapsed;
  let pendingConfirm: { resolve: (proceed: boolean) => void } | undefined;

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
    return new Promise((resolve) => {
      pendingConfirm = { resolve };
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
        hideConfirm();
        pendingConfirm = undefined;
        resolve(true);
      });
      cancelBtn.addEventListener("click", () => {
        hideConfirm();
        pendingConfirm = undefined;
        resolve(false);
      });
      confirmArea.append(text, discardBtn, cancelBtn);
    });
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
      if (pendingConfirm) {
        pendingConfirm.resolve(false);
        pendingConfirm = undefined;
        hideConfirm();
      }
      state = next;
      collapsed = next.collapsed;
      render();
    },
  };
}
