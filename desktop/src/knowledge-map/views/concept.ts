/**
 * Concept map. The centre is one concept; each link is one statement.
 *
 * Further neighbours navigate instead of becoming a fifth spoke, so the
 * picture stays a sentence you can read off the star.
 */

import {
  conceptLabel,
  conceptPicture,
  conceptReading,
} from "../concept-layout.js";
import type { KnowledgeMapView, ViewFactory } from "../contract.js";

export const createView: ViewFactory = (
  container,
  index,
  host,
  initialFocus,
) => {
  const root = document.createElement("div");
  root.className = "km-concept";
  container.appendChild(root);

  const paint = (id: string) => {
    const picture = conceptPicture(index, id);
    const center = index.get(picture.centerId);
    const centerLabel = center ? conceptLabel(center) : picture.centerId;
    root.replaceChildren();

    const stage = document.createElement("div");
    stage.className = "km-concept-stage";
    stage.setAttribute("role", "group");
    stage.setAttribute(
      "aria-label",
      host.tf("km_concept_around", { label: centerLabel }),
    );
    const centerNode = document.createElement("div");
    centerNode.className = "km-concept-center";
    centerNode.textContent = centerLabel;
    stage.appendChild(centerNode);
    for (const spoke of picture.spokes) {
      const other = index.get(spoke.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `km-concept-spoke km-concept-${spoke.position}`;
      const link = document.createElement("span");
      link.className = "km-concept-link";
      link.textContent = host.t(spoke.linkKey);
      const name = document.createElement("span");
      name.className = "km-concept-name";
      name.textContent = other ? conceptLabel(other) : spoke.id;
      button.append(link, name);
      button.addEventListener("click", () => host.navigate(spoke.id));
      stage.appendChild(button);
    }
    root.appendChild(stage);

    const reading = conceptReading(index, picture, (key) => host.t(key));
    if (reading) {
      const block = document.createElement("p");
      block.className = "km-concept-reading";
      const label = document.createElement("span");
      label.className = "km-concept-reading-label";
      label.textContent = host.t("km_concept_reading");
      const text = document.createElement("span");
      text.className = "km-concept-reading-text";
      text.textContent = reading;
      block.append(label, text);
      root.appendChild(block);
    }

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
        button.textContent = extra ? conceptLabel(extra) : extraId;
        button.addEventListener("click", () => host.navigate(extraId));
        more.appendChild(button);
      }
      root.appendChild(more);
    }
  };

  paint(initialFocus);

  const view: KnowledgeMapView = {
    setFocus(id) {
      paint(id);
    },
    destroy() {
      root.remove();
    },
  };
  return view;
};
