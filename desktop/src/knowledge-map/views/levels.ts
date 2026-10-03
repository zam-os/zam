/**
 * Levels — semantic zoom over the statement tree (ADR 2026-10-03, Decision 3).
 *
 * One level at a time: the statement being spelled out on top, its details as
 * cards below. A card with details of its own zooms in; "one level up" zooms
 * out. Cross-links appear only as counts on the cards. The zoom is animated so
 * the step between levels stays traceable (Cockburn et al. 2009).
 */

import type { KnowledgeMapView, ViewFactory } from "../contract.js";
import { createMinimap } from "../minimap.js";

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = document.createElement("div");
  root.className = "km-levels";
  container.appendChild(root);
  const minimap = createMinimap(index, host, 250, 104);

  /** The statement whose details are on screen. */
  let theme = "";
  let focusId = initialFocus;

  const themeFor = (id: string): string =>
    index.children(id).length > 0 ? id : (index.parent(id) ?? id);

  const render = (direction: "in" | "out" | null) => {
    root.replaceChildren();
    const top = document.createElement("div");
    top.className = "km-lv-top";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "km-lv-up";
    up.textContent = `▲ ${host.t("km_level_up")}`;
    const parent = index.parent(theme);
    up.disabled = parent === undefined;
    up.addEventListener("click", () => {
      if (parent !== undefined) host.navigate(parent);
    });
    top.appendChild(up);
    root.appendChild(top);

    const themeCard = document.createElement("div");
    themeCard.className = "km-lv-theme";
    themeCard.textContent = index.get(theme)?.text ?? theme;
    if (theme === focusId) themeCard.setAttribute("aria-current", "true");

    const grid = document.createElement("div");
    grid.className = "km-lv-grid";
    for (const child of index.children(theme)) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "km-lv-card";
      if (child === focusId) {
        card.classList.add("km-lv-current");
        card.setAttribute("aria-current", "true");
      }
      const text = document.createElement("span");
      text.textContent = index.get(child)?.text ?? child;
      card.appendChild(text);
      const meta = document.createElement("span");
      meta.className = "km-lv-meta";
      const details = index.children(child).length;
      if (details > 0) {
        const d = document.createElement("span");
        d.textContent = `▾ ${host.tf("km_details_count", { count: details })}`;
        meta.appendChild(d);
      }
      const links = index
        .neighbors(child)
        .filter((n) => n.tree === null).length;
      if (links > 0) {
        const l = document.createElement("span");
        l.textContent = `↔ ${host.tf("km_links_count", { count: links })}`;
        meta.appendChild(l);
      }
      if (meta.childElementCount > 0) card.appendChild(meta);
      card.addEventListener("click", () => host.navigate(child));
      grid.appendChild(card);
    }

    const stage = document.createElement("div");
    stage.style.display = "flex";
    stage.style.flexDirection = "column";
    stage.style.gap = "14px";
    stage.append(themeCard, grid);
    if (direction === "in") stage.classList.add("km-lv-anim-in");
    if (direction === "out") stage.classList.add("km-lv-anim-out");
    root.appendChild(stage);
  };

  const show = (id: string) => {
    const nextTheme = themeFor(id);
    const direction =
      theme === "" || nextTheme === theme
        ? null
        : index.depth(nextTheme) > index.depth(theme)
          ? "in"
          : "out";
    focusId = id;
    theme = nextTheme;
    render(direction);
    minimap.setFocus(id);
  };
  show(initialFocus);

  const view: KnowledgeMapView = {
    overview: minimap.element,
    setFocus(id) {
      show(id);
    },
    destroy() {
      root.remove();
    },
  };
  return view;
};
