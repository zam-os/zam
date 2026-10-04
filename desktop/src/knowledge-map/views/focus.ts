/**
 * Focus map — the primary view (ADR 2026-10-03, Decision 3).
 *
 * One statement in the centre, at most seven neighbours on a fixed compass
 * (layout.ts), each card opening with the connective that joins it to the
 * centre, so centre + card read as one sentence. Clicking a card moves it to
 * the centre in an animated transition; cards that stay on screen glide
 * rather than jump. Its mini-map, shown beside the view, marks where in the
 * whole tree you are.
 */

import type { MapIndex } from "../../../../src/cli/knowledge-map/model.js";
import type { KnowledgeMapView, ViewFactory, ViewHost } from "../contract.js";
import {
  layoutFocus,
  MAX_VISIBLE_NEIGHBORS,
  NARROW_GAP,
  relationLabelKey,
} from "../layout.js";
import { createMinimap } from "../minimap.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const OVERFLOW_KEY = "\u0000overflow";
const DURATION_MS = 450;

interface Sprite {
  card: HTMLButtonElement;
  line: SVGLineElement | null;
  x: number;
  y: number;
  opacity: number;
  fromX: number;
  fromY: number;
  fromOpacity: number;
  toX: number;
  toY: number;
  toOpacity: number;
  leaving: boolean;
}

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function cardMeta(index: MapIndex, host: ViewHost, id: string): string {
  const parts: string[] = [];
  const details = index.children(id).length;
  if (details > 0) parts.push(host.tf("km_details_count", { count: details }));
  const links = index.neighbors(id).filter((n) => n.tree === null).length;
  if (links > 0) parts.push(host.tf("km_links_count", { count: links }));
  return parts.join(" · ");
}

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = document.createElement("div");
  root.className = "km-focus";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("km-edges");
  svg.setAttribute("aria-hidden", "true");
  root.appendChild(svg);
  const lessButton = document.createElement("button");
  lessButton.type = "button";
  lessButton.className = "km-chip";
  lessButton.style.position = "absolute";
  lessButton.style.left = "10px";
  lessButton.style.bottom = "10px";
  lessButton.textContent = host.t("km_less");
  lessButton.hidden = true;
  root.appendChild(lessButton);
  const minimap = createMinimap(index, host, 250, 104);
  container.appendChild(root);

  let focusId = initialFocus;
  let previous: string | null = null;
  let expanded = false;
  let frame = 0;
  const sprites = new Map<string, Sprite>();

  const makeSprite = (key: string, x: number, y: number): Sprite => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "km-node";
    root.insertBefore(card, lessButton);
    const sprite: Sprite = {
      card,
      line: null,
      x,
      y,
      opacity: 0,
      fromX: x,
      fromY: y,
      fromOpacity: 0,
      toX: x,
      toY: y,
      toOpacity: 1,
      leaving: false,
    };
    sprites.set(key, sprite);
    return sprite;
  };

  const paint = () => {
    const centre = sprites.get(focusId);
    for (const [key, sprite] of sprites) {
      sprite.card.style.left = `${sprite.x}px`;
      sprite.card.style.top = `${sprite.y}px`;
      sprite.card.style.opacity = String(sprite.opacity);
      if (sprite.line && centre) {
        sprite.line.setAttribute("x1", String(centre.x));
        sprite.line.setAttribute("y1", String(centre.y));
        sprite.line.setAttribute("x2", String(sprite.x));
        sprite.line.setAttribute("y2", String(sprite.y));
        sprite.line.style.opacity = String(
          Math.min(sprite.opacity, centre.opacity),
        );
      }
      if (key === focusId) sprite.card.style.zIndex = "2";
      else sprite.card.style.zIndex = "1";
    }
  };

  const render = (animate: boolean) => {
    const width = root.clientWidth || container.clientWidth || 800;
    root.style.height = "";
    const height = Math.max(root.clientHeight || 0, 460);
    const layout = layoutFocus(
      index,
      focusId,
      previous,
      width,
      height,
      expanded,
    );
    root.style.height =
      layout.minHeight > height ? `${layout.minHeight}px` : "";

    // Where new cards grow from: the clicked card's old spot, else the centre.
    const origin = sprites.get(focusId) ?? null;
    const startX = origin ? origin.x : layout.focus.x;
    const startY = origin ? origin.y : layout.focus.y;

    const targets = new Map<string, { x: number; y: number }>();
    targets.set(focusId, layout.focus);
    for (const placed of layout.nodes) targets.set(placed.neighbor.id, placed);
    if (layout.overflow) targets.set(OVERFLOW_KEY, layout.overflow);

    for (const [key, target] of targets) {
      const sprite = sprites.get(key) ?? makeSprite(key, startX, startY);
      sprite.leaving = false;
      sprite.toX = target.x;
      sprite.toY = target.y;
      sprite.toOpacity = 1;
    }
    for (const [key, sprite] of sprites) {
      if (!targets.has(key)) {
        sprite.leaving = true;
        sprite.toX = sprite.x;
        sprite.toY = sprite.y;
        sprite.toOpacity = 0;
      }
    }

    // Card content and edges for the new arrangement.
    for (const line of [...svg.querySelectorAll("line")]) line.remove();
    for (const sprite of sprites.values()) sprite.line = null;

    const focusSprite = sprites.get(focusId) as Sprite;
    const focusCard = focusSprite.card;
    focusCard.className = "km-node km-node-focus";
    focusCard.style.width = `${layout.focusWidth}px`;
    focusCard.textContent = index.get(focusId)?.text ?? focusId;
    focusCard.setAttribute("aria-current", "true");
    focusCard.onclick = null;

    for (const placed of layout.nodes) {
      const { neighbor } = placed;
      const sprite = sprites.get(neighbor.id) as Sprite;
      const card = sprite.card;
      card.className = "km-node";
      card.removeAttribute("aria-current");
      card.style.width = `${layout.cardWidth}px`;
      card.replaceChildren();
      const connective = document.createElement("span");
      connective.className = `km-conn km-k-${neighbor.kind}`;
      connective.textContent = host.t(relationLabelKey(neighbor));
      const text = document.createElement("span");
      text.textContent = index.get(neighbor.id)?.text ?? neighbor.id;
      card.append(connective, text);
      const meta = cardMeta(index, host, neighbor.id);
      if (meta) {
        const metaEl = document.createElement("span");
        metaEl.className = "km-node-meta";
        metaEl.textContent = meta;
        card.appendChild(metaEl);
      }
      card.onclick = () => host.navigate(neighbor.id);
      const line = document.createElementNS(SVG_NS, "line");
      svg.appendChild(line);
      sprite.line = line;
    }

    if (layout.overflow) {
      const sprite = sprites.get(OVERFLOW_KEY) as Sprite;
      sprite.card.className = "km-node km-node-overflow";
      sprite.card.style.width = "auto";
      sprite.card.textContent = host.tf("km_more", {
        count: layout.overflow.count,
      });
      sprite.card.onclick = () => {
        expanded = true;
        render(true);
      };
    }
    if (layout.narrow) {
      // Stack by measured height so long statements never overlap.
      const order = [
        ...layout.nodes
          .filter((p) => p.side === "top")
          .map((p) => p.neighbor.id),
        focusId,
        ...layout.nodes
          .filter((p) => p.side !== "top")
          .map((p) => p.neighbor.id),
        ...(layout.overflow ? [OVERFLOW_KEY] : []),
      ];
      let y = 12;
      for (const key of order) {
        const sprite = sprites.get(key);
        if (!sprite) continue;
        const h = sprite.card.offsetHeight || 120;
        sprite.toY = y + h / 2;
        y += h + NARROW_GAP;
      }
      root.style.height = `${Math.max(y, height)}px`;
    }
    lessButton.hidden = !(
      expanded && index.neighbors(focusId).length > MAX_VISIBLE_NEIGHBORS
    );

    cancelAnimationFrame(frame);
    for (const sprite of sprites.values()) {
      sprite.fromX = sprite.x;
      sprite.fromY = sprite.y;
      sprite.fromOpacity = sprite.opacity;
    }
    const finish = () => {
      for (const [key, sprite] of [...sprites]) {
        sprite.x = sprite.toX;
        sprite.y = sprite.toY;
        sprite.opacity = sprite.toOpacity;
        if (sprite.leaving) {
          sprite.card.remove();
          sprite.line?.remove();
          sprites.delete(key);
        }
      }
      paint();
    };
    if (!animate || prefersReducedMotion()) {
      finish();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const k = ease(t);
      for (const sprite of sprites.values()) {
        sprite.x = sprite.fromX + (sprite.toX - sprite.fromX) * k;
        sprite.y = sprite.fromY + (sprite.toY - sprite.fromY) * k;
        sprite.opacity =
          sprite.fromOpacity + (sprite.toOpacity - sprite.fromOpacity) * k;
      }
      paint();
      if (t < 1) frame = requestAnimationFrame(step);
      else finish();
    };
    frame = requestAnimationFrame(step);
  };

  lessButton.addEventListener("click", () => {
    expanded = false;
    render(true);
  });

  let resizeTimer = 0;
  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => render(false), 60);
        });
  observer?.observe(root);

  render(false);
  minimap.setFocus(focusId);

  const view: KnowledgeMapView = {
    overview: minimap.element,
    setFocus(id, change) {
      previous = change.previous;
      focusId = id;
      expanded = false;
      render(true);
      minimap.setFocus(id);
    },
    resize() {
      render(false);
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      root.remove();
    },
  };
  return view;
};
