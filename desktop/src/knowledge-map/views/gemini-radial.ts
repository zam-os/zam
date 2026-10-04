/**
 * Radial ego map — Gemini's first mode (#381), on the shared map.
 *
 * The focus in the middle, its neighbours evenly on an orbit, each with the
 * sentence that joins it to the focus. Under the orbit, the macro-statement
 * those sentences form together (Kintsch's construction–integration model)
 * and the places in the repository to look at.
 */

import type { KnowledgeMapView, ViewFactory } from "../contract.js";
import { anchorsOf, macroSynthesis, relatedItems } from "../gemini-adapter.js";
import {
  anchorList,
  el,
  focusCard,
  itemCard,
  synthesisBlock,
} from "../gemini-cards.js";

const SVG_NS = "http://www.w3.org/2000/svg";
/** More satellites than this crowd the orbit; the rest are listed below. */
export const ORBIT_SLOTS = 8;
const NARROW = 640;

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = el("div", "km-g km-g-radial");
  container.appendChild(root);
  let focusId = initialFocus;
  let previous: string | null = null;

  const render = () => {
    root.replaceChildren();
    const items = relatedItems(index, focusId, previous);
    const orbit = items.slice(0, ORBIT_SLOTS);
    const rest = items.slice(ORBIT_SLOTS);
    const width = root.clientWidth || container.clientWidth || 800;

    const stage = el("div", "km-g-orbit");
    const centre = focusCard(
      index.get(focusId)?.text ?? focusId,
      host.t("km_g_focus"),
    );
    if (width < NARROW) {
      stage.classList.add("km-g-orbit-narrow");
      stage.appendChild(centre);
      for (const item of orbit) stage.appendChild(itemCard(item, host));
    } else {
      const height = 440;
      stage.style.height = `${height}px`;
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.classList.add("km-g-lines");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      stage.appendChild(svg);
      const cx = width / 2;
      const cy = height / 2;
      const rx = Math.min(width * 0.36, 330);
      const ry = height * 0.36;
      centre.style.left = `${cx}px`;
      centre.style.top = `${cy}px`;
      stage.appendChild(centre);
      orbit.forEach((item, i) => {
        const angle = (i * 2 * Math.PI) / orbit.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", String(cx));
        line.setAttribute("y1", String(cy));
        line.setAttribute("x2", String(x));
        line.setAttribute("y2", String(y));
        svg.appendChild(line);
        const card = itemCard(item, host, "km-g-card km-g-satellite");
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        stage.appendChild(card);
      });
    }
    root.appendChild(stage);

    if (rest.length > 0) {
      const more = el("div", "km-g-more");
      more.appendChild(
        el("span", "km-g-empty", host.tf("km_more", { count: rest.length })),
      );
      for (const item of rest) {
        const chip = el(
          "button",
          "km-chip",
          index.get(item.id)?.label ?? item.text,
        );
        chip.type = "button";
        chip.title = item.text;
        chip.addEventListener("click", () => host.navigate(item.id));
        more.appendChild(chip);
      }
      root.appendChild(more);
    }

    const footer = el("div", "km-g-footer");
    footer.appendChild(synthesisBlock(macroSynthesis(index, focusId), host));
    const anchors = el("section", "km-g-synthesis");
    anchors.append(
      el("h4", undefined, host.t("km_g_anchors")),
      anchorList(anchorsOf(index, focusId), host.t("km_g_empty")),
    );
    footer.appendChild(anchors);
    root.appendChild(footer);
  };

  // Re-lay the orbit only when the width changes; the height follows the
  // content and would otherwise feed back into the observer.
  let resizeTimer = 0;
  let lastWidth = -1;
  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          const width = root.clientWidth;
          if (width === lastWidth) return;
          lastWidth = width;
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(render, 80);
        });
  observer?.observe(root);
  render();

  const view: KnowledgeMapView = {
    setFocus(id, change) {
      previous = change.previous;
      focusId = id;
      render();
    },
    destroy() {
      window.clearTimeout(resizeTimer);
      observer?.disconnect();
      root.remove();
    },
  };
  return view;
};
