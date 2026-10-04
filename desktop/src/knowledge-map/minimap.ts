/**
 * The overview every map view can show: the whole statement tree as dots, the
 * path from the root to the focus highlighted, visited statements tinted.
 * Clicking a dot jumps there (overview+detail, Cockburn et al. 2009).
 */

import type { MapIndex } from "../../../src/cli/knowledge-map/model.js";
import type { ViewHost } from "./contract.js";
import { layoutMinimap } from "./layout.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface Minimap {
  element: HTMLElement;
  setFocus(id: string): void;
}

export function createMinimap(
  index: MapIndex,
  host: ViewHost,
  width = 220,
  height = 96,
): Minimap {
  const element = document.createElement("div");
  element.className = "km-minimap";
  const title = document.createElement("div");
  title.className = "km-minimap-title";
  title.textContent = host.t("km_minimap");
  title.title = host.t("km_minimap_hint");
  element.appendChild(title);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", host.t("km_minimap"));
  element.appendChild(svg);

  const { points, edges } = layoutMinimap(index, width, height);
  const lines = new Map<string, SVGLineElement>();
  for (const [from, to] of edges) {
    const a = points.get(from);
    const b = points.get(to);
    if (!a || !b) continue;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(a.x));
    line.setAttribute("y1", String(a.y));
    line.setAttribute("x2", String(b.x));
    line.setAttribute("y2", String(b.y));
    svg.appendChild(line);
    lines.set(to, line);
  }
  const dots = new Map<string, SVGCircleElement>();
  for (const [id, point] of points) {
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", String(point.x));
    dot.setAttribute("cy", String(point.y));
    dot.setAttribute("r", "2.6");
    const tip = document.createElementNS(SVG_NS, "title");
    tip.textContent = index.get(id)?.text ?? id;
    dot.appendChild(tip);
    dot.addEventListener("click", () => host.navigate(id));
    svg.appendChild(dot);
    dots.set(id, dot);
  }

  const visited = new Set<string>();
  return {
    element,
    setFocus(id: string) {
      visited.add(id);
      const path = new Set(index.pathTo(id));
      for (const [dotId, dot] of dots) {
        dot.classList.toggle("km-mm-visited", visited.has(dotId));
        dot.classList.toggle("km-mm-path", path.has(dotId));
        dot.classList.toggle("km-mm-focus", dotId === id);
        dot.setAttribute(
          "r",
          dotId === id ? "4.4" : path.has(dotId) ? "3.2" : "2.6",
        );
      }
      for (const [childId, line] of lines) {
        line.classList.toggle("km-mm-path", path.has(childId));
      }
    },
  };
}
