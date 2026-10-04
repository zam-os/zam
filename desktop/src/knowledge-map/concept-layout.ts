/**
 * Pure layout for the concept-map view. No DOM.
 *
 * A node is a short concept. The link carries the statement, and at most
 * four neighbours are drawn. The rest stay reachable as further concepts.
 */

import type {
  KnowledgeStatement,
  MapIndex,
} from "../../../src/cli/knowledge-map/model.js";
import { relationLabelKey } from "./layout.js";

export const CONCEPT_SPOKES = 4;

export const CONCEPT_POSITIONS = ["north", "east", "south", "west"] as const;

export type ConceptPosition = (typeof CONCEPT_POSITIONS)[number];

export interface ConceptSpoke {
  id: string;
  linkKey: string;
  position: ConceptPosition;
}

export interface ConceptPicture {
  centerId: string;
  spokes: ConceptSpoke[];
  more: string[];
}

/** The word on the node. A missing label falls back to the slug. */
export function conceptLabel(statement: KnowledgeStatement): string {
  const label = statement.label?.trim();
  if (label) return label;
  return statement.id.replace(/-/g, " ");
}

/**
 * Outgoing links first, then incoming, each group ordered by id.
 * An unknown id falls back to the root.
 */
export function conceptPicture(
  index: MapIndex,
  conceptId: string,
): ConceptPicture {
  const centerId = index.has(conceptId) ? conceptId : index.map.root;
  const ranked = [...index.neighbors(centerId)].sort((a, b) => {
    const direction =
      Number(a.direction === "in") - Number(b.direction === "in");
    if (direction !== 0) return direction;
    return a.id.localeCompare(b.id);
  });
  return {
    centerId,
    spokes: ranked.slice(0, CONCEPT_SPOKES).map((neighbor, indexInStar) => ({
      id: neighbor.id,
      linkKey: relationLabelKey(neighbor),
      position: CONCEPT_POSITIONS[indexInStar],
    })),
    more: ranked.slice(CONCEPT_SPOKES).map((neighbor) => neighbor.id),
  };
}

/** The sentences formed by the visible spokes only. */
export function conceptReading(
  index: MapIndex,
  picture: ConceptPicture,
  linkText: (key: string) => string,
): string {
  const center = index.get(picture.centerId);
  if (!center) return "";
  const from = conceptLabel(center);
  return picture.spokes
    .map((spoke) => {
      const other = index.get(spoke.id);
      const to = other ? conceptLabel(other) : spoke.id;
      return `${from} ${linkText(spoke.linkKey)} ${to}.`;
    })
    .join(" ");
}
