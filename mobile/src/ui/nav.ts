/**
 * Navigation (ADR 2026-08-08b).
 *
 * Two levels, and only two. **Root views** fill the screen and replace each
 * other: first run, pairing, the app, and a review. **Tabs** live inside the
 * app and are always one tap apart.
 *
 * The old app had a single dashboard with three buttons stacked under each
 * other, and every other screen was reached by leaving it. That works for a
 * companion you open for one thing. It does not work for the app itself,
 * where "where am I and how do I get back" has to be answerable without
 * thinking.
 *
 * Review is deliberately a *root* view, not a tab: the tab bar disappears
 * while a card is on screen. Nothing should invite the learner away mid-card,
 * and the four ratings need the thumb space the bar would take.
 */

export type RootView = "setup" | "pairing" | "app" | "review";
export type TabId = "learn" | "library" | "progress" | "settings";

const ROOT_ELEMENT_IDS: Record<RootView, string> = {
  setup: "setup-view",
  pairing: "pairing-view",
  app: "app-view",
  review: "review-view",
};

const TAB_SECTION_IDS: Record<TabId, string> = {
  learn: "dashboard-view",
  library: "import-view",
  progress: "stats-view",
  settings: "settings-view",
};

/** Shown instead of a tab section after a session ends. */
const SUMMARY_SECTION_ID = "session-summary-view";

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
}

/**
 * Last-resort screen for a bootstrap that never finished.
 *
 * Element lookups run at module scope, so one renamed id in `index.html`
 * aborts the whole script: the app launches, paints the markup, and ignores
 * every tap with nothing to say why. `tests/mobile/dom-contract.test.ts`
 * keeps that from reaching a build, and this keeps it from being silent if it
 * ever does.
 */
export function showBootFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const screen = document.createElement("div");
  screen.className = "frame";
  screen.style.padding = "24px";
  screen.style.display = "flex";
  screen.style.flexDirection = "column";
  screen.style.justifyContent = "center";
  screen.style.gap = "8px";

  const title = document.createElement("h1");
  title.className = "t-title";
  title.textContent = "ZAM konnte nicht starten";
  const detail = document.createElement("p");
  detail.className = "t-secondary";
  detail.textContent = message;

  screen.append(title, detail);
  document.body.replaceChildren(screen);
}

export interface Nav {
  showRoot(view: RootView): void;
  currentRoot(): RootView;
  showTab(tab: TabId): void;
  currentTab(): TabId;
  /** Show the post-session summary in place of the tab sections. */
  showSummary(): void;
  /** Due-card count on the Learn tab; 0 hides the badge. */
  setDueBadge(count: number): void;
  onTabChange(listener: (tab: TabId) => void): void;
}

export function createNav(): Nav {
  const roots = new Map<RootView, HTMLElement>();
  for (const [view, id] of Object.entries(ROOT_ELEMENT_IDS)) {
    roots.set(view as RootView, byId(id));
  }
  const sections = new Map<TabId, HTMLElement>();
  for (const [tab, id] of Object.entries(TAB_SECTION_IDS)) {
    sections.set(tab as TabId, byId(id));
  }
  const summary = byId(SUMMARY_SECTION_ID);
  const badge = byId<HTMLElement>("tab-badge");
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".tab[data-tab]"),
  );

  let root: RootView = "setup";
  let tab: TabId = "learn";
  const listeners: Array<(tab: TabId) => void> = [];

  function paintRoot(): void {
    for (const [view, element] of roots) {
      element.hidden = view !== root;
    }
  }

  function paintTab(showingSummary: boolean): void {
    for (const [id, element] of sections) {
      element.hidden = showingSummary || id !== tab;
    }
    summary.hidden = !showingSummary;
    for (const button of buttons) {
      const selected = button.dataset.tab === tab && !showingSummary;
      button.setAttribute("aria-selected", String(selected));
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const next = button.dataset.tab as TabId | undefined;
      if (next) nav.showTab(next);
    });
  }

  const nav: Nav = {
    showRoot(view) {
      root = view;
      paintRoot();
      // A root change always lands at the top; carrying a previous scroll
      // position into a different screen is disorienting.
      for (const element of roots.values()) {
        const screen = element.querySelector(".screen");
        if (screen) screen.scrollTop = 0;
      }
    },
    currentRoot: () => root,
    showTab(next) {
      tab = next;
      if (root !== "app") {
        root = "app";
        paintRoot();
      }
      paintTab(false);
      const screen = roots.get("app")?.querySelector(".screen");
      if (screen) screen.scrollTop = 0;
      for (const listener of listeners) listener(next);
    },
    currentTab: () => tab,
    showSummary() {
      root = "app";
      paintRoot();
      paintTab(true);
    },
    setDueBadge(count) {
      badge.hidden = count <= 0;
      badge.textContent = count > 99 ? "99+" : String(count);
    },
    onTabChange(listener) {
      listeners.push(listener);
    },
  };

  paintRoot();
  paintTab(false);
  return nav;
}
