/**
 * C4 architecture view (ADR 2026-10-03, Decision 8).
 *
 * Boxes and arrows from the system context down to components, drawn from the
 * statements that carry a `c4` facet. People on top, the boxes inside the
 * current system or container in a dashed frame, everything outside below.
 * A box with parts zooms in; "one level up" zooms out. Every arrow is also
 * listed as text under the diagram.
 */

import {
  buildC4Diagram,
  buildC4Model,
  type C4Box,
  type C4Diagram,
  type C4Element,
  type C4Scope,
  clipToBoxes,
  homeScope,
  parentScope,
  zoomScope,
} from "../c4-layout.js";
import type { KnowledgeMapView, ViewFactory, ViewHost } from "../contract.js";

const SVG_NS = "http://www.w3.org/2000/svg";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Rect, b: Rect, margin = 2): boolean {
  return (
    a.x < b.x + b.width + margin &&
    b.x < a.x + a.width + margin &&
    a.y < b.y + b.height + margin &&
    b.y < a.y + a.height + margin
  );
}
let markerCount = 0;

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

function typeLine(host: ViewHost, element: C4Element): string {
  const kind = host.t(`km_c4_kind_${element.kind}`);
  const external = element.external ? `, ${host.t("km_c4_external")}` : "";
  return element.technology
    ? `[${kind}${external}: ${element.technology}]`
    : `[${kind}${external}]`;
}

function title(host: ViewHost, diagram: C4Diagram): string {
  if (diagram.scope.level === "context" || !diagram.boundary) {
    return host.t("km_c4_level_context");
  }
  return host.tf(
    diagram.scope.level === "container"
      ? "km_c4_level_container"
      : "km_c4_level_component",
    { name: diagram.boundary.name },
  );
}

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const model = buildC4Model(index);
  const root = el("div", "km-c4");
  container.appendChild(root);

  let focusId = initialFocus;
  let scope: C4Scope = homeScope(model, model.elementOf(initialFocus));
  let diagramEl: HTMLElement | null = null;
  let svg: SVGSVGElement | null = null;
  let labelLayer: HTMLElement | null = null;
  const boxEls = new Map<string, HTMLElement>();
  let current: C4Diagram | null = null;

  const drawArrows = () => {
    const area = diagramEl;
    const lines = svg;
    const labels = labelLayer;
    if (!area || !lines || !labels || !current || !area.isConnected) return;
    if (area.getBoundingClientRect().width === 0) return;
    const frame = area.getBoundingClientRect();
    lines.setAttribute("width", String(area.scrollWidth));
    lines.setAttribute("height", String(area.scrollHeight));
    for (const line of [...lines.querySelectorAll("line")]) line.remove();
    labels.replaceChildren();
    const markerId = lines.dataset.marker ?? "";
    // Labels sit nearer the box with fewer arrows, so the labels of several
    // arrows meeting at one box spread out instead of piling up there.
    const degree = new Map<string, number>();
    for (const arrow of current.arrows) {
      degree.set(arrow.from, (degree.get(arrow.from) ?? 0) + 1);
      degree.set(arrow.to, (degree.get(arrow.to) ?? 0) + 1);
    }
    const toArea = (r: DOMRect) => ({
      x: r.left - frame.left + area.scrollLeft,
      y: r.top - frame.top + area.scrollTop,
      width: r.width,
      height: r.height,
    });
    const taken: Rect[] = [...boxEls.values()].map((box) =>
      toArea(box.getBoundingClientRect()),
    );
    current.arrows.forEach((arrow, i) => {
      const a = boxEls.get(arrow.from)?.getBoundingClientRect();
      const b = boxEls.get(arrow.to)?.getBoundingClientRect();
      if (!a || !b) return;
      const { x1, y1, x2, y2 } = clipToBoxes(toArea(a), toArea(b));
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("marker-end", `url(#${markerId})`);
      lines.appendChild(line);
      // The label goes where it covers no box and no other label; where no
      // such spot exists the arrow shows only its number, which the
      // relationship list below spells out.
      const along = (t: number) => ({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
      });
      const near =
        (degree.get(arrow.from) ?? 0) >= (degree.get(arrow.to) ?? 0) ? 1 : -1;
      const tries = [
        0.5,
        0.5 + 0.12 * near,
        0.5 - 0.12 * near,
        0.5 + 0.24 * near,
        0.5 - 0.24 * near,
      ];
      const place = (chip: HTMLElement, positions: number[]): boolean => {
        labels.appendChild(chip);
        const w = chip.offsetWidth;
        const h = chip.offsetHeight;
        for (const t of positions) {
          const p = along(t);
          const rect = { x: p.x - w / 2, y: p.y - h / 2, width: w, height: h };
          if (taken.some((other) => overlaps(rect, other))) continue;
          chip.style.left = `${p.x}px`;
          chip.style.top = `${p.y}px`;
          taken.push(rect);
          return true;
        }
        chip.remove();
        return false;
      };
      const text = arrow.label ?? "";
      if (
        text &&
        place(el("span", "km-c4-arrow-label", `${i + 1} · ${text}`), tries)
      ) {
        return;
      }
      const badge = el("span", "km-c4-arrow-num", String(i + 1));
      if (text) badge.title = text;
      if (!place(badge, [...tries, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88])) {
        const p = along(0.5);
        badge.style.left = `${p.x}px`;
        badge.style.top = `${p.y}px`;
        labels.appendChild(badge);
      }
    });
  };

  const renderBox = (box: C4Box): HTMLElement => {
    const { element } = box;
    const button = el("button");
    button.type = "button";
    button.className = [
      "km-c4-box",
      `km-c4-${element.kind}`,
      element.external ? "km-c4-ext" : "",
      model.elementOf(focusId) === element.id ? "km-c4-focus" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.append(
      el("span", "km-c4-name", element.name),
      el("span", "km-c4-type", typeLine(host, element)),
      el("span", "km-c4-desc", element.description),
    );
    const zoom = zoomScope(model, element.id);
    if (zoom) {
      button.appendChild(
        el(
          "span",
          "km-c4-inside",
          `▸ ${host.tf("km_c4_inside", { count: element.inner.length })}`,
        ),
      );
    }
    button.addEventListener("click", () => {
      if (zoom) scope = zoom;
      if (element.id === focusId) render();
      else host.navigate(element.id);
    });
    boxEls.set(element.id, button);
    return button;
  };

  const render = () => {
    root.replaceChildren();
    boxEls.clear();
    if (model.elements.size === 0) {
      root.appendChild(el("p", "km-notice", host.t("km_c4_empty")));
      return;
    }
    const diagram = buildC4Diagram(index, model, scope);
    current = diagram;

    const top = el("div", "km-c4-top");
    const up = el("button", "km-lv-up", `▲ ${host.t("km_level_up")}`);
    up.type = "button";
    const parent = parentScope(model, scope);
    up.disabled = parent === null;
    up.addEventListener("click", () => {
      if (!parent) return;
      scope = parent;
      render();
    });
    top.append(up, el("strong", "km-c4-title", title(host, diagram)));
    root.appendChild(top);

    if (model.elementOf(focusId) === null) {
      root.appendChild(el("p", "km-notice", host.t("km_c4_outside")));
    }

    diagramEl = el("div", "km-c4-diagram");
    svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add("km-c4-arrows");
    svg.setAttribute("aria-hidden", "true");
    markerCount += 1;
    const markerId = `km-c4-head-${markerCount}`;
    svg.dataset.marker = markerId;
    const defs = document.createElementNS(SVG_NS, "defs");
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    const head = document.createElementNS(SVG_NS, "path");
    head.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    head.classList.add("km-c4-head");
    marker.appendChild(head);
    defs.appendChild(marker);
    svg.appendChild(defs);
    diagramEl.appendChild(svg);
    labelLayer = el("div", "km-c4-labels");
    labelLayer.setAttribute("aria-hidden", "true");

    const people = diagram.boxes.filter((box) => box.role === "person");
    const inside = diagram.boxes.filter((box) => box.role === "inside");
    const outside = diagram.boxes.filter((box) => box.role === "outside");
    if (people.length > 0) {
      const row = el("div", "km-c4-row");
      for (const box of people) row.appendChild(renderBox(box));
      diagramEl.appendChild(row);
    }
    if (diagram.boundary) {
      const frame = el("div", "km-c4-boundary");
      frame.appendChild(
        el(
          "span",
          "km-c4-boundary-label",
          `${diagram.boundary.name} ${typeLine(host, diagram.boundary)}`,
        ),
      );
      const row = el("div", "km-c4-row");
      for (const box of inside) row.appendChild(renderBox(box));
      frame.appendChild(row);
      diagramEl.appendChild(frame);
    } else if (inside.length > 0) {
      const row = el("div", "km-c4-row");
      for (const box of inside) row.appendChild(renderBox(box));
      diagramEl.appendChild(row);
    }
    if (outside.length > 0) {
      const row = el("div", "km-c4-row");
      for (const box of outside) row.appendChild(renderBox(box));
      diagramEl.appendChild(row);
    }
    diagramEl.appendChild(labelLayer);
    root.appendChild(diagramEl);

    const list = el("div", "km-c4-list");
    list.appendChild(el("h4", undefined, host.t("km_c4_relationships")));
    const items = el("ul");
    const nameOf = (id: string) => model.elements.get(id)?.name ?? id;
    for (const [i, arrow] of diagram.arrows.entries()) {
      const text = [
        `${i + 1}. ${nameOf(arrow.from)} → ${nameOf(arrow.to)}`,
        arrow.labels.length > 0 ? `: ${arrow.labels.join("; ")}` : "",
        arrow.technology ? ` [${arrow.technology}]` : "",
        arrow.count > 1 ? ` (×${arrow.count})` : "",
      ].join("");
      items.appendChild(el("li", undefined, text));
    }
    if (diagram.arrows.length === 0) {
      items.appendChild(el("li", undefined, host.t("km_c4_no_relationships")));
    }
    list.appendChild(items);
    root.appendChild(list);

    requestAnimationFrame(drawArrows);
  };

  let resizeTimer = 0;
  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(drawArrows, 60);
        });
  observer?.observe(root);

  render();

  const view: KnowledgeMapView = {
    setFocus(id) {
      focusId = id;
      const element = model.elementOf(id);
      const onScreen =
        element !== null && (boxEls.has(element) || element === scope.scopeId);
      if (!onScreen) scope = homeScope(model, element);
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
