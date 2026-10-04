/**
 * DOM pieces shared by Gemini's views: a related-statement card, the anchor
 * list and the macro-statement block. Text only through `textContent`.
 */

import type { ViewHost } from "./contract.js";
import type { Anchor, RelatedItem } from "./gemini-adapter.js";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A clickable card: the joining sentence in small type, then the statement. */
export function itemCard(
  item: RelatedItem,
  host: ViewHost,
  className = "km-g-card",
): HTMLButtonElement {
  const card = el("button", className);
  card.type = "button";
  const caption = el(
    "span",
    `km-g-caption km-k-${item.kind}`,
    item.proposition ?? host.t(item.connectiveKey),
  );
  card.append(caption, el("span", "km-g-text", item.text));
  card.addEventListener("click", () => host.navigate(item.id));
  return card;
}

/** Up to `max` cards, then a "+n more" button that shows the rest. */
export function itemList(
  items: RelatedItem[],
  host: ViewHost,
  emptyText: string,
  max = Number.POSITIVE_INFINITY,
): HTMLElement {
  const list = el("div", "km-g-list");
  if (items.length === 0) {
    list.appendChild(el("p", "km-g-empty", emptyText));
    return list;
  }
  for (const item of items.slice(0, max))
    list.appendChild(itemCard(item, host));
  if (items.length > max) {
    const more = el(
      "button",
      "km-g-more",
      host.tf("km_more", { count: items.length - max }),
    );
    more.type = "button";
    more.addEventListener("click", () => {
      more.replaceWith(...items.slice(max).map((item) => itemCard(item, host)));
    });
    list.appendChild(more);
  }
  return list;
}

export function anchorList(
  anchors: Anchor[],
  host: ViewHost,
  emptyText: string,
): HTMLElement {
  const list = el("ul", "km-g-anchors");
  if (anchors.length === 0) {
    list.appendChild(el("li", "km-g-empty", emptyText));
    return list;
  }
  for (const anchor of anchors) {
    const li = el("li");
    li.appendChild(
      el(
        "span",
        `km-g-badge km-g-badge-${anchor.type}`,
        anchor.type.toUpperCase(),
      ),
    );
    const url = anchor.url;
    if (url) {
      const link = el("a", "km-g-path", anchor.path);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.addEventListener("click", (event) => {
        if (!host.openSource) return;
        event.preventDefault();
        host.openSource(url);
      });
      li.appendChild(link);
    } else {
      li.appendChild(el("span", "km-g-path", anchor.path));
    }
    list.appendChild(li);
  }
  return list;
}

export function synthesisBlock(text: string, host: ViewHost): HTMLElement {
  const block = el("section", "km-g-synthesis");
  block.append(
    el("h4", undefined, host.t("km_g_synthesis")),
    el("p", undefined, text || host.t("km_g_synthesis_empty")),
  );
  return block;
}

export function focusCard(
  text: string,
  kicker: string,
  className = "km-g-focus",
): HTMLElement {
  const card = el("div", className);
  card.append(
    el("span", "km-g-kicker", kicker),
    el("span", "km-g-focus-text", text),
  );
  return card;
}
