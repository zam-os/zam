/**
 * The Bonus view in Learning Content (ADR 2026-10-05 Decision 6): what the
 * learner kept as Bonus from their own imports, grouped by import, each with
 * a Learn action that creates its card. Learning Content lists cards, and a
 * bonus item has none until it is taken, so without this view it would be
 * invisible. Nothing here is scheduled until the learner takes it, and there
 * is no score, streak or target.
 *
 * Desktop only for now: the MCP Apps panel cannot reach the
 * `material-import-*` commands until they are on its allowlist (Phase 9).
 */

import type {
  MaterialImportBonusItemWire,
  MaterialImportBonusListResponse,
  MaterialImportBonusTakeResponse,
} from "../../src/bridge/protocol.js";
import { runBridge } from "./bridge-transport.js";
import { currentLocale, t, tf } from "./i18n.js";

/** More than any learner keeps; the view shows every item. */
export const BONUS_VIEW_LIMIT = 500;

// ── Rules (pure) ─────────────────────────────────────────────────────────────

export interface BonusGroup {
  sourceId: string;
  sourceTitle: string | null;
  importedAt: string;
  items: MaterialImportBonusItemWire[];
}

/** One group per import, in the order the bridge lists them: newest first. */
export function bonusGroups(
  items: MaterialImportBonusItemWire[],
): BonusGroup[] {
  const groups = new Map<string, BonusGroup>();
  for (const item of items) {
    let group = groups.get(item.sourceId);
    if (!group) {
      group = {
        sourceId: item.sourceId,
        sourceTitle: item.sourceTitle,
        importedAt: item.importedAt,
        items: [],
      };
      groups.set(item.sourceId, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}

/** "from “Stofferkennung mit den Sinnen”, 5 Oct" */
export function bonusSourceLine(
  group: Pick<BonusGroup, "sourceTitle" | "importedAt">,
  locale: string = currentLocale,
): string {
  const date = new Date(group.importedAt);
  return tf("material_bonus_from", {
    title: group.sourceTitle ?? t("material_bonus_untitled"),
    date: Number.isNaN(date.getTime())
      ? group.importedAt
      : new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(date),
  });
}

/** The Learning Content button, or null when there is nothing to show. */
export function bonusButtonLabel(count: number): string | null {
  return count > 0 ? tf("btn_material_bonus", { count }) : null;
}

// ── Dialog ───────────────────────────────────────────────────────────────────

export interface MaterialBonusOptions {
  /** Runs after an item became a card — e.g. reload the card list. */
  onTaken?: () => void | Promise<void>;
}

interface DialogParts {
  overlay: HTMLElement;
  title: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  close: HTMLButtonElement;
}

const OVERLAY_ID = "material-bonus-overlay";
const BUTTON_ID = "btn-content-material-bonus";
const BORDER =
  "1px solid var(--clr-border, var(--border-card-frosted, rgba(127, 127, 127, 0.3)))";

let dialog: DialogParts | null = null;
let items: MaterialImportBonusItemWire[] = [];
let options: MaterialBonusOptions = {};
const taking = new Set<string>();

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  return node;
}

function ensureDialog(): DialogParts {
  if (dialog?.overlay.isConnected) return dialog;
  const overlay = element("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";
  const box = element("div", { maxWidth: "720px", width: "94vw" });
  box.className = "modal-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const header = element("div");
  header.className = "modal-header";
  const title = element("h3");
  title.id = "lbl-material-bonus-title";
  header.append(title);
  box.setAttribute("aria-labelledby", title.id);

  const body = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "65vh",
    overflowY: "auto",
  });
  body.className = "modal-body";
  const intro = element("p", { margin: "0" });
  const status = element("p", { margin: "0", fontSize: "0.85rem" });
  status.setAttribute("aria-live", "polite");
  const list = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  });
  body.append(intro, status, list);

  const actions = element("div");
  actions.className = "modal-actions";
  const close = element("button");
  close.type = "button";
  close.className = "btn secondary-btn btn-sm";
  close.addEventListener("click", () => closeMaterialBonus());
  actions.append(close);

  box.append(header, body, actions);
  overlay.append(box);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeMaterialBonus();
    }
  });
  document.body.append(overlay);
  dialog = { overlay, title, intro, status, list, close };
  return dialog;
}

function itemRow(item: MaterialImportBonusItemWire): HTMLElement {
  const row = element("div", {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: "10px",
    border: BORDER,
  });
  const text = element("div", {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "0",
  });
  const title = element("strong");
  title.textContent = item.title;
  text.append(title);
  if (item.question) {
    const question = element("span", { fontSize: "0.9rem" });
    question.textContent = item.question;
    text.append(question);
  }
  if (item.domain) {
    const area = element("span", { fontSize: "0.78rem", opacity: "0.8" });
    area.textContent = item.domain;
    text.append(area);
  }
  const learn = element("button");
  learn.type = "button";
  learn.className = "btn primary-btn btn-sm";
  learn.textContent = t("material_bonus_learn");
  learn.disabled = taking.has(item.tokenId);
  learn.addEventListener("click", () => {
    void take(item);
  });
  row.append(text, learn);
  return row;
}

function render(parts: DialogParts): void {
  parts.title.textContent = t("material_bonus_title");
  parts.intro.textContent = t("material_bonus_intro");
  parts.close.textContent = t("material_bonus_close");
  const groups = bonusGroups(items);
  parts.list.replaceChildren(
    ...groups.map((group) => {
      const section = element("section", {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      });
      const heading = element("p", {
        margin: "0",
        fontSize: "0.85rem",
        fontWeight: "600",
      });
      heading.textContent = bonusSourceLine(group);
      section.append(heading, ...group.items.map(itemRow));
      return section;
    }),
  );
  if (groups.length === 0 && !parts.status.textContent) {
    parts.status.textContent = t("material_bonus_empty");
  }
}

async function take(item: MaterialImportBonusItemWire): Promise<void> {
  if (taking.has(item.tokenId)) return;
  const parts = ensureDialog();
  taking.add(item.tokenId);
  render(parts);
  try {
    const result = await runBridge<MaterialImportBonusTakeResponse>(
      "material-import-bonus-take",
      ["--token", item.tokenId],
    );
    if (!result?.success) throw new Error(t("material_bonus_error"));
    items = items.filter((entry) => entry.tokenId !== item.tokenId);
    parts.status.textContent = tf("material_bonus_taken", {
      title: item.title,
    });
    renderButton();
    await options.onTaken?.();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    parts.status.textContent = `${t("material_bonus_error")}: ${reason}`;
  } finally {
    taking.delete(item.tokenId);
    render(parts);
  }
}

export function closeMaterialBonus(): void {
  dialog?.overlay.classList.remove("active");
}

/** Open the Bonus view with a fresh list. */
export async function openMaterialBonus(): Promise<void> {
  const parts = ensureDialog();
  parts.status.textContent = t("material_bonus_loading");
  render(parts);
  parts.overlay.classList.add("active");
  parts.close.focus();
  const loaded = await refreshMaterialBonus();
  parts.status.textContent = loaded ? "" : t("material_bonus_error");
  render(parts);
}

// ── Learning Content button ──────────────────────────────────────────────────

function renderButton(): void {
  if (typeof document === "undefined") return;
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  const label = bonusButtonLabel(items.length);
  button.hidden = label === null;
  button.textContent = label ?? "";
}

/** Ask the bridge for the kept items and update the button. */
export async function refreshMaterialBonus(): Promise<boolean> {
  try {
    const response = await runBridge<MaterialImportBonusListResponse>(
      "material-import-bonus-list",
      ["--limit", String(BONUS_VIEW_LIMIT)],
    );
    if (!response?.success) return false;
    items = response.items;
    renderButton();
    return true;
  } catch (err) {
    console.warn("material-import-bonus-list failed", err);
    return false;
  }
}

/** Wire the Learning Content button; it shows only when items are kept. */
export function initMaterialBonus(next: MaterialBonusOptions = {}): void {
  options = next;
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  button.hidden = true;
  button.addEventListener("click", () => {
    void openMaterialBonus();
  });
  void refreshMaterialBonus();
}
