/**
 * The atlas as an outline (ADR 2026-10-13, Decision 5): the same lens as a
 * nested list, for the keyboard and the screen reader. Every entry names its
 * condition in words ("fällig", "lange überfällig", "wohl vergessen"), never
 * only as a texture, and counts only the learner's own cards.
 *
 * Plain buttons in nested lists: Tab walks them, Enter or Space opens a
 * region and selects it on the map, and `aria-expanded` tells a screen reader
 * what is open.
 */

import type { AtlasLensInfoWire } from "../../../src/bridge/protocol.js";
import {
  type AtlasLayout,
  regionCondition,
  regionDue,
  unitsIn,
} from "./layout.js";
import type { Selection } from "./render.js";

export interface OutlineDeps {
  t(key: string): string;
  tf(key: string, vars: Record<string, string | number>): string;
  /** Select on the map and open the panel. */
  onSelect(selection: Selection): void;
}

export interface OutlineState {
  expanded: Set<string>;
  selection: Selection | null;
}

/** Words for a region's or unit's condition and the learner's due count. */
export function conditionWords(
  deps: Pick<OutlineDeps, "t" | "tf">,
  condition: string | null,
  due: number,
): string {
  const parts: string[] = [];
  if (due > 0) parts.push(deps.tf("atlas_due_count", { count: due }));
  if (condition) parts.push(deps.t(`condition_${condition}`));
  else parts.push(deps.t("atlas_no_cards"));
  return parts.join(" · ");
}

/** The lenses every library of their planet has, with translated names. */
const BUILT_IN_LENSES: ReadonlySet<string> = new Set([
  "weltwissen",
  "schule",
  "leben",
  "produkte",
  "unternehmen",
]);

/**
 * A lens's label: a built-in lens in the learner's language, a custom lens
 * under the name its library gave it (Decision 3).
 */
export function lensLabel(
  deps: Pick<OutlineDeps, "t">,
  lens: Pick<AtlasLensInfoWire, "kind" | "name">,
): string {
  return BUILT_IN_LENSES.has(lens.kind)
    ? deps.t(`atlas_lens_${lens.kind}`)
    : lens.name;
}

export function renderOutline(
  container: HTMLElement,
  layout: AtlasLayout,
  state: OutlineState,
  deps: OutlineDeps,
): void {
  const focusedKey = (document.activeElement as HTMLElement | null)?.dataset
    ?.atlasKey;
  container.replaceChildren();
  const list = document.createElement("ul");
  list.className = "atlas-outline-list";
  list.setAttribute("aria-label", layout.view.lens.name);
  for (const key of layout.roots) list.appendChild(regionItem(key));
  container.appendChild(list);
  if (focusedKey) {
    container
      .querySelector<HTMLElement>(
        `[data-atlas-key="${CSS.escape(focusedKey)}"]`,
      )
      ?.focus();
  }

  function regionItem(key: string): HTMLLIElement {
    const region = layout.regions.get(key);
    const li = document.createElement("li");
    if (!region) return li;
    const open = state.expanded.has(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "atlas-outline-entry";
    button.dataset.atlasKey = key;
    button.setAttribute("aria-expanded", String(open));
    if (state.selection?.kind === "region" && state.selection.key === key) {
      button.setAttribute("aria-current", "true");
    }
    const units = unitsIn(layout, key).length;
    const name = document.createElement("span");
    name.className = "atlas-outline-name";
    name.textContent = region.name;
    const meta = document.createElement("span");
    meta.className = "atlas-outline-meta";
    meta.textContent = [
      layout.view.lens.levels[region.level] ?? "",
      deps.tf("atlas_unit_count", { count: units }),
      conditionWords(
        deps,
        regionCondition(layout, key),
        regionDue(layout, key),
      ),
    ]
      .filter(Boolean)
      .join(" · ");
    button.append(name, meta);
    button.addEventListener("click", () => {
      if (open) state.expanded.delete(key);
      else state.expanded.add(key);
      deps.onSelect({ kind: "region", key });
    });
    li.appendChild(button);
    if (!open) return li;

    const children = document.createElement("ul");
    for (const child of region.children) {
      if (layout.geoms.has(child)) children.appendChild(regionItem(child));
    }
    if (region.children.length === 0) {
      const geom = layout.geoms.get(key);
      for (const cell of geom?.cells ?? []) {
        if (cell.unit) children.appendChild(unitItem(cell.unit.key));
      }
    }
    if (children.childElementCount > 0) li.appendChild(children);
    return li;
  }

  function unitItem(key: string): HTMLLIElement {
    const unit = layout.units.get(key);
    const li = document.createElement("li");
    if (!unit) return li;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "atlas-outline-entry atlas-outline-unit";
    button.dataset.atlasKey = key;
    if (state.selection?.kind === "unit" && state.selection.key === key) {
      button.setAttribute("aria-current", "true");
    }
    const name = document.createElement("span");
    name.className = "atlas-outline-name";
    name.textContent = unit.title;
    const meta = document.createElement("span");
    meta.className = "atlas-outline-meta";
    const words = [conditionWords(deps, unit.condition, unit.due)];
    if (unit.own) words.push(deps.t("atlas_own_unit"));
    meta.textContent = words.join(" · ");
    button.append(name, meta);
    button.addEventListener("click", () => {
      deps.onSelect({ kind: "unit", key });
    });
    li.appendChild(button);
    return li;
  }
}
