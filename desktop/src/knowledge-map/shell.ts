/**
 * The knowledge-map shell shared by the Studio and the standalone prototype
 * (ADR 2026-10-03). It owns the focus and its history, the breadcrumb, the
 * detail panel and the feedback bar; the swappable view in the middle only
 * draws and reports clicks.
 */

import type { MapIndex } from "../../../src/cli/knowledge-map/model.js";
import { conceptLabel, conceptProposition } from "./concept-layout.js";
import type { KnowledgeMapView, ViewHost } from "./contract.js";
import { relationLabelKey } from "./layout.js";
import {
  type KnowledgeMapViewId,
  knowledgeMapViewEntry,
  knowledgeMapViewsByAuthor,
  parseKnowledgeMapViewId,
} from "./registry.js";
import { ensureKnowledgeMapStyles } from "./styles.js";

export type FeedbackFound = "yes" | "partly" | "no";

export interface FeedbackInput {
  view: KnowledgeMapViewId;
  helpful: number;
  found: FeedbackFound | null;
  comment: string;
}

export interface FeedbackStore {
  save(entry: FeedbackInput): Promise<void>;
  count(): Promise<number>;
  /** Everything saved so far, as text a tester can paste into a message. */
  exportText(): Promise<string>;
}

export interface ShellOptions {
  index: MapIndex;
  viewId: KnowledgeMapViewId;
  t(key: string): string;
  tf(key: string, values: Record<string, string | number>): string;
  /** The prototype switches views in place; the Studio does it in Settings. */
  showViewSwitcher: boolean;
  /** A line above the map, e.g. that a sample map is shown. */
  notice?: string;
  /** Called instead of following a source link, when the host opens links itself. */
  openSource?(url: string): void;
  feedback: FeedbackStore | null;
  copyText(text: string): Promise<boolean>;
  onViewChange?(id: KnowledgeMapViewId): void;
}

export interface ShellHandle {
  setView(id: KnowledgeMapViewId): Promise<void>;
  destroy(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export async function mountKnowledgeMap(
  container: HTMLElement,
  options: ShellOptions,
): Promise<ShellHandle> {
  ensureKnowledgeMapStyles();
  const { index, t, tf } = options;
  container.replaceChildren();
  const root = el("div", "km-root");
  container.appendChild(root);

  // ── Header ──
  const header = el("header", "km-header");
  const titlebar = el("div", "km-titlebar");
  const title = el("div", "km-title");
  title.append(
    el("span", undefined, index.map.title),
    el("span", "km-badge", "Alpha"),
  );
  const question = el("div", "km-question");
  question.append(
    el("strong", undefined, `${t("km_focus_question")}: `),
    index.map.focus_question,
  );
  titlebar.append(title, question);

  const switcher = el("div", "km-switcher");
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", t("km_view_label"));
  const viewLabel = el("span", "km-view-label");
  if (options.showViewSwitcher) titlebar.appendChild(switcher);
  else titlebar.appendChild(viewLabel);
  header.appendChild(titlebar);

  if (options.notice)
    header.appendChild(el("div", "km-notice", options.notice));

  const crumbs = el("nav", "km-crumbs");
  crumbs.setAttribute("aria-label", t("km_path"));
  header.appendChild(crumbs);
  root.appendChild(header);

  // ── Body ──
  const body = el("div", "km-body");
  const stage = el("div", "km-stage");
  const details = el("aside", "km-details");
  body.append(stage, details);
  root.appendChild(body);

  const overviewSlot = el("div");
  const focusHeading = el("h3", undefined, t("km_in_focus"));
  const focusText = el("p", "km-details-text");
  const sourcesHeading = el("h4", undefined, t("km_sources"));
  const sources = el("ul", "km-sources");
  const contextHeading = el("h4", undefined, t("km_context"));
  const sentences = el("ul", "km-sentences");
  details.append(
    overviewSlot,
    focusHeading,
    focusText,
    contextHeading,
    sentences,
    sourcesHeading,
    sources,
  );

  // ── Feedback ──
  const feedbackBar = el("footer", "km-feedback");
  if (options.feedback) root.appendChild(feedbackBar);

  // ── State ──
  let focus = index.map.root;
  const history: string[] = [];
  let currentViewId = options.viewId;
  let view: KnowledgeMapView | null = null;

  const host: ViewHost = {
    navigate: (id) => go(id, true),
    t,
    tf,
    ...(options.openSource ? { openSource: options.openSource } : {}),
  };

  const renderCrumbs = () => {
    crumbs.replaceChildren();
    const back = el("button", "km-back", `← ${t("km_back")}`);
    back.type = "button";
    back.disabled = history.length === 0;
    back.addEventListener("click", () => {
      const previous = history.pop();
      if (previous !== undefined) go(previous, false);
    });
    crumbs.appendChild(back);
    const path = index.pathTo(focus);
    path.forEach((id, i) => {
      if (i > 0) crumbs.appendChild(el("span", "km-crumb-sep", "›"));
      const crumb = el("button", "km-crumb", index.get(id)?.text ?? id);
      crumb.type = "button";
      crumb.title = index.get(id)?.text ?? id;
      if (id === focus) crumb.setAttribute("aria-current", "true");
      crumb.addEventListener("click", () => go(id, true));
      crumbs.appendChild(crumb);
    });
  };

  const renderDetails = () => {
    const statement = index.get(focus);
    focusText.textContent = statement?.text ?? focus;
    sources.replaceChildren();
    for (const source of statement?.sources ?? []) {
      const li = el("li");
      const url = index.sourceUrl(source);
      if (url) {
        const link = el("a", undefined, source);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (options.openSource) {
          link.addEventListener("click", (event) => {
            event.preventDefault();
            options.openSource?.(url);
          });
        }
        li.appendChild(link);
      } else {
        li.appendChild(el("span", undefined, source));
      }
      sources.appendChild(li);
    }
    sentences.replaceChildren();
    for (const neighbor of index.neighbors(focus)) {
      const li = el("li");
      const button = el("button");
      button.type = "button";
      button.append(
        el(
          "span",
          `km-conn km-k-${neighbor.kind}`,
          t(relationLabelKey(neighbor)),
        ),
        index.get(neighbor.id)?.text ?? neighbor.id,
      );
      // The same edge between the two concepts ("ZAM rests on Beliefs"), as
      // the concept map and the C4 arrows read it.
      const proposition = conceptProposition(index, focus, neighbor);
      const fromConcept = proposition && index.get(proposition.fromId);
      const toConcept = proposition && index.get(proposition.toId);
      if (proposition && fromConcept && toConcept) {
        button.appendChild(
          el(
            "span",
            "km-proposition",
            `${conceptLabel(fromConcept)} ${proposition.phrase} ${conceptLabel(toConcept)}`,
          ),
        );
      }
      button.addEventListener("click", () => go(neighbor.id, true));
      li.appendChild(button);
      sentences.appendChild(li);
    }
  };

  function go(id: string, remember: boolean) {
    if (!index.has(id) || id === focus) return;
    const previous = focus;
    if (remember) history.push(previous);
    focus = id;
    renderCrumbs();
    renderDetails();
    view?.setFocus(id, { previous });
  }

  const renderSwitcher = () => {
    switcher.replaceChildren();
    const select = el("select", "km-switcher-select");
    select.setAttribute("aria-label", t("km_view_label"));
    for (const group of knowledgeMapViewsByAuthor()) {
      const optgroup = el("optgroup");
      optgroup.label = t(`km_author_${group.author}`);
      for (const entry of group.views) {
        const option = el("option", undefined, t(entry.nameKey));
        option.value = entry.id;
        option.title = t(entry.descriptionKey);
        option.selected = entry.id === currentViewId;
        optgroup.appendChild(option);
      }
      select.appendChild(optgroup);
    }
    select.addEventListener("change", () => {
      const id = parseKnowledgeMapViewId(select.value);
      void setView(id);
      options.onViewChange?.(id);
    });
    switcher.appendChild(select);
    viewLabel.textContent = `${t("km_view_label")}: ${t(knowledgeMapViewEntry(currentViewId).nameKey)} · ${t("km_view_switch_hint")}`;
  };

  async function setView(id: KnowledgeMapViewId) {
    currentViewId = id;
    renderSwitcher();
    const module = await knowledgeMapViewEntry(id).load();
    if (currentViewId !== id) return;
    view?.destroy();
    stage.replaceChildren();
    overviewSlot.replaceChildren();
    view = module.createView(stage, index, host, focus);
    if (view.overview) overviewSlot.appendChild(view.overview);
    resetFeedback();
  }

  // ── Feedback bar ──
  let helpful = 0;
  let found: FeedbackFound | null = null;
  const ratingButtons: HTMLButtonElement[] = [];
  const foundButtons = new Map<FeedbackFound, HTMLButtonElement>();
  const comment = el("textarea");
  const status = el("span", "km-status");
  const countLabel = el("span", "km-status");

  const refreshCount = async () => {
    if (!options.feedback) return;
    try {
      const count = await options.feedback.count();
      countLabel.textContent = tf("km_feedback_count", { count });
    } catch {
      countLabel.textContent = "";
    }
  };

  function resetFeedback() {
    helpful = 0;
    found = null;
    comment.value = "";
    status.textContent = "";
    for (const button of ratingButtons)
      button.setAttribute("aria-pressed", "false");
    for (const button of foundButtons.values())
      button.setAttribute("aria-pressed", "false");
  }

  if (options.feedback) {
    const store = options.feedback;
    const ratingGroup = el("div", "km-feedback-group");
    ratingGroup.appendChild(
      el("span", "km-feedback-label", t("km_feedback_title")),
    );
    for (let n = 1; n <= 5; n++) {
      const button = el("button", "km-chip", String(n));
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", tf("km_feedback_rating_label", { n }));
      button.addEventListener("click", () => {
        helpful = n;
        for (const other of ratingButtons) {
          other.setAttribute("aria-pressed", String(other === button));
        }
      });
      ratingButtons.push(button);
      ratingGroup.appendChild(button);
    }
    const foundGroup = el("div", "km-feedback-group");
    foundGroup.appendChild(
      el("span", "km-feedback-label", t("km_feedback_found")),
    );
    for (const value of ["yes", "partly", "no"] as const) {
      const button = el("button", "km-chip", t(`km_found_${value}`));
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        found = found === value ? null : value;
        for (const [key, other] of foundButtons) {
          other.setAttribute("aria-pressed", String(key === found));
        }
      });
      foundButtons.set(value, button);
      foundGroup.appendChild(button);
    }
    comment.placeholder = t("km_feedback_comment_placeholder");
    comment.rows = 1;
    const save = el("button", "km-primary", t("km_feedback_send"));
    save.type = "button";
    save.addEventListener("click", async () => {
      if (helpful < 1) {
        status.textContent = t("km_feedback_need_rating");
        return;
      }
      try {
        await store.save({
          view: currentViewId,
          helpful,
          found,
          comment: comment.value,
        });
        resetFeedback();
        status.textContent = t("km_feedback_saved");
        void refreshCount();
      } catch (err) {
        status.textContent = err instanceof Error ? err.message : String(err);
      }
    });
    const copy = el("button", "km-link", t("km_feedback_copy"));
    copy.type = "button";
    copy.addEventListener("click", async () => {
      const text = await store.exportText();
      const ok = await options.copyText(text);
      status.textContent = ok ? t("km_feedback_copied") : text;
    });
    const tail = el("div", "km-feedback-group");
    tail.append(save, status, countLabel, copy);
    feedbackBar.append(ratingGroup, foundGroup, comment, tail);
    void refreshCount();
  }

  renderCrumbs();
  renderDetails();
  await setView(currentViewId);

  return {
    setView,
    destroy() {
      view?.destroy();
      view = null;
      root.remove();
    },
  };
}
