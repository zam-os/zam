/**
 * Concept map. The centre is one concept; each link is a phrase that makes
 * a sentence with the two labels. Edges without that phrase stay in the
 * detail panel and do not appear in the star.
 */

import {
  conceptLabel,
  conceptPicture,
  conceptReading,
} from "../concept-layout.js";
import type { KnowledgeMapView, ViewFactory } from "../contract.js";
import type { CompassSide } from "../layout.js";

const SIDES: CompassSide[] = ["top", "right", "bottom", "left"];

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = document.createElement("div");
  root.className = "km-concept";
  container.appendChild(root);

  const paint = (id: string, previous: string | null) => {
    const picture = conceptPicture(index, id, previous);
    const center = index.get(picture.centerId);
    const centerLabel = center ? conceptLabel(center) : null;
    const centerText = centerLabel ?? center?.text ?? picture.centerId;
    root.replaceChildren();

    const stage = document.createElement("div");
    stage.className = "km-concept-stage";
    stage.setAttribute("role", "group");
    stage.setAttribute(
      "aria-label",
      host.tf("km_concept_around", { label: centerText }),
    );
    const columns = new Map<CompassSide, HTMLDivElement>();
    for (const side of SIDES) {
      const column = document.createElement("div");
      column.className = `km-concept-side km-concept-${side}`;
      columns.set(side, column);
    }
    const centerNode = document.createElement("div");
    centerNode.className = "km-concept-center";
    centerNode.textContent = centerText;
    stage.append(
      centerNode,
      ...SIDES.map((side) => columns.get(side) as HTMLDivElement),
    );
    for (const spoke of picture.spokes) {
      const other = index.get(spoke.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "km-concept-spoke";
      const link = document.createElement("span");
      link.className = "km-concept-link";
      link.textContent = spoke.phrase;
      const name = document.createElement("span");
      name.className = "km-concept-name";
      name.textContent =
        (other && conceptLabel(other)) || other?.text || spoke.id;
      button.append(link, name);
      button.addEventListener("click", () => host.navigate(spoke.id));
      columns.get(spoke.side)?.appendChild(button);
    }
    root.appendChild(stage);

    const reading = conceptReading(index, picture);
    const block = document.createElement("p");
    block.className = "km-concept-reading";
    const label = document.createElement("span");
    label.className = "km-concept-reading-label";
    label.textContent = host.t("km_concept_reading");
    const text = document.createElement("span");
    text.className = "km-concept-reading-text";
    text.textContent = reading || host.t("km_concept_empty");
    block.append(label, text);
    root.appendChild(block);

    if (picture.more.length > 0) {
      const more = document.createElement("div");
      more.className = "km-concept-more";
      const moreLabel = document.createElement("span");
      moreLabel.className = "km-concept-more-label";
      moreLabel.textContent = host.t("km_concept_more");
      more.appendChild(moreLabel);
      for (const extraId of picture.more) {
        const extra = index.get(extraId);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "km-concept-chip";
        button.textContent =
          (extra && conceptLabel(extra)) || extra?.text || extraId;
        button.addEventListener("click", () => host.navigate(extraId));
        more.appendChild(button);
      }
      root.appendChild(more);
    }
  };

  paint(initialFocus, null);

  const view: KnowledgeMapView = {
    setFocus(id, change) {
      paint(id, change.previous);
    },
    destroy() {
      root.remove();
    },
  };
  return view;
};
