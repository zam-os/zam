/**
 * Zoned facets — Gemini's third mode (#381), on the shared map.
 *
 * Four zones around the focus: its purpose above, its connections to the
 * left, the rules and decisions it is bound by to the right, and the places
 * in the repository below.
 */

import type { KnowledgeMapView, ViewFactory } from "../contract.js";
import { facetsOf } from "../gemini-adapter.js";
import { anchorList, el, focusCard, itemList } from "../gemini-cards.js";

/** Cards per zone before "+n more". */
const PER_ZONE = 3;

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = el("div", "km-g km-g-facets");
  container.appendChild(root);

  const zone = (area: string, titleKey: string, body: HTMLElement) => {
    const section = el("section", `km-g-zone km-g-zone-${area}`);
    section.append(el("h4", undefined, host.t(titleKey)), body);
    return section;
  };

  const render = (focusId: string) => {
    root.replaceChildren();
    const facets = facetsOf(index, focusId);
    const empty = host.t("km_g_empty");
    root.append(
      zone(
        "north",
        "km_g_purpose",
        itemList(facets.purpose, host, empty, PER_ZONE),
      ),
      zone(
        "west",
        "km_g_connections",
        itemList(facets.connections, host, empty, PER_ZONE),
      ),
      focusCard(
        index.get(focusId)?.text ?? focusId,
        index.get(focusId)?.label ?? host.t("km_g_focus"),
        "km-g-focus km-g-zone-centre",
      ),
      zone("east", "km_g_rules", itemList(facets.rules, host, empty, PER_ZONE)),
      zone("south", "km_g_places", anchorList(facets.places, empty)),
    );
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
