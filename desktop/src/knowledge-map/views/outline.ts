/**
 * Outline — the deliberate baseline (ADR 2026-10-03, Decision 3).
 *
 * The same statements as a collapsible outline of the tree. The statement in
 * focus lists its cross-links underneath as sentences. If no map view beats
 * this, that is a finding (Kobsa 2004).
 */

import type { MapIndex } from "../../../../src/cli/knowledge-map/model.js";
import type { KnowledgeMapView, ViewFactory, ViewHost } from "../contract.js";
import { relationLabelKey } from "../layout.js";

interface Row {
  item: HTMLLIElement;
  row: HTMLDivElement;
  toggle: HTMLButtonElement;
  list: HTMLUListElement | null;
  links: HTMLUListElement;
}

function crossLinks(
  index: MapIndex,
  host: ViewHost,
  id: string,
  links: HTMLUListElement,
) {
  links.replaceChildren();
  for (const neighbor of index.neighbors(id)) {
    if (neighbor.tree !== null) continue;
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const connective = document.createElement("span");
    connective.className = `km-conn km-k-${neighbor.kind}`;
    connective.textContent = host.t(relationLabelKey(neighbor));
    button.append(connective, index.get(neighbor.id)?.text ?? neighbor.id);
    button.addEventListener("click", () => host.navigate(neighbor.id));
    li.appendChild(button);
    links.appendChild(li);
  }
  links.hidden = links.childElementCount === 0;
}

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = document.createElement("div");
  root.className = "km-outline";
  container.appendChild(root);
  const rows = new Map<string, Row>();
  const expanded = new Set<string>([index.map.root]);

  const setExpanded = (id: string, open: boolean) => {
    const row = rows.get(id);
    if (!row?.list) return;
    if (open) expanded.add(id);
    else expanded.delete(id);
    row.list.hidden = !open;
    row.toggle.textContent = open ? "▾" : "▸";
    row.item.setAttribute("aria-expanded", String(open));
  };

  const build = (id: string, parentList: HTMLUListElement) => {
    const statement = index.get(id);
    if (!statement) return;
    const item = document.createElement("li");
    item.setAttribute("role", "treeitem");
    const row = document.createElement("div");
    row.className = "km-ol-row";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "km-ol-toggle";
    toggle.setAttribute("aria-label", statement.text);
    const text = document.createElement("button");
    text.type = "button";
    text.className = "km-ol-text";
    text.textContent = statement.text;
    const crossCount = index
      .neighbors(id)
      .filter((n) => n.tree === null).length;
    if (crossCount > 0) {
      const count = document.createElement("span");
      count.className = "km-ol-count";
      count.textContent = `↔ ${crossCount}`;
      count.title = host.tf("km_links_count", { count: crossCount });
      text.appendChild(count);
    }
    text.addEventListener("click", () => host.navigate(id));
    row.append(toggle, text);
    item.appendChild(row);
    const links = document.createElement("ul");
    links.className = "km-ol-links";
    links.hidden = true;
    item.appendChild(links);

    const children = index.children(id);
    let list: HTMLUListElement | null = null;
    if (children.length > 0) {
      list = document.createElement("ul");
      list.setAttribute("role", "group");
      item.appendChild(list);
      for (const child of children) build(child, list);
      toggle.addEventListener("click", () =>
        setExpanded(id, !expanded.has(id)),
      );
    } else {
      toggle.hidden = true;
      toggle.tabIndex = -1;
    }
    parentList.appendChild(item);
    rows.set(id, { item, row, toggle, list, links });
    setExpanded(id, expanded.has(id));
  };

  const tree = document.createElement("ul");
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", index.map.title);
  root.appendChild(tree);
  build(index.map.root, tree);

  let current: string | null = null;
  const show = (id: string, scroll: boolean) => {
    if (current) {
      const old = rows.get(current);
      old?.row.classList.remove("km-ol-current");
      if (old) old.links.hidden = true;
    }
    for (const ancestor of index.pathTo(id).slice(0, -1))
      setExpanded(ancestor, true);
    setExpanded(id, true);
    const row = rows.get(id);
    if (!row) return;
    row.row.classList.add("km-ol-current");
    crossLinks(index, host, id, row.links);
    current = id;
    if (scroll)
      row.row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  show(initialFocus, false);

  const view: KnowledgeMapView = {
    setFocus(id) {
      show(id, true);
    },
    destroy() {
      root.remove();
    },
  };
  return view;
};
