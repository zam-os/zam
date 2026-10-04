/**
 * Causal tree — Gemini's second mode (#381), on the shared map.
 *
 * Read left to right: what the focus rests on (its parent, reasons,
 * preconditions, causes), the focus itself, and what follows from it
 * (details, consequences, dependants, examples, rejected alternatives).
 */

import type { KnowledgeMapView, ViewFactory } from "../contract.js";
import { causeTree } from "../gemini-adapter.js";
import { el, focusCard, itemList } from "../gemini-cards.js";

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = el("div", "km-g km-g-causal");
  container.appendChild(root);

  const render = (focusId: string) => {
    root.replaceChildren();
    const { upstream, downstream } = causeTree(index, focusId);
    const left = el("div", "km-g-column");
    left.append(
      el("h4", undefined, host.t("km_g_upstream")),
      itemList(upstream, host, host.t("km_g_no_upstream")),
    );
    const centre = el("div", "km-g-column km-g-column-centre");
    const card = focusCard(
      index.get(focusId)?.text ?? focusId,
      host.t("km_g_focus"),
    );
    centre.append(card, el("p", "km-g-hint", host.t("km_g_tree_hint")));
    const right = el("div", "km-g-column");
    right.append(
      el("h4", undefined, host.t("km_g_downstream")),
      itemList(downstream, host, host.t("km_g_no_downstream")),
    );
    root.append(left, centre, right);
  };
  render(initialFocus);

  const view: KnowledgeMapView = {
    setFocus(id) {
      render(id);
    },
    destroy() {
      root.remove();
    },
  };
  return view;
};
