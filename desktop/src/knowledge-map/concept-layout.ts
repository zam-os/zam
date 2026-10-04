/**
 * Pure layout for the concept-map view. No DOM.
 *
 * A spoke exists only when both ends have a short label and the edge has
 * its own linking phrase. Sentence connectives are not reused as phrases.
 * The parent stays above the centre, so the way back up does not fall off.
 */

import type {
  KnowledgeStatement,
  MapIndex,
  Neighbor,
} from "../../../src/cli/knowledge-map/model.js";
import { type CompassSide, compassSide, rankNeighbors } from "./layout.js";

export const CONCEPT_SPOKES = 4;

export interface ConceptSpoke {
  id: string;
  fromId: string;
  toId: string;
  phrase: string;
  side: CompassSide;
}

export interface ConceptPicture {
  centerId: string;
  spokes: ConceptSpoke[];
  more: string[];
}

/** The word on the node. Missing labels are not shown as slugs. */
export function conceptLabel(statement: KnowledgeStatement): string | null {
  const label = statement.label?.trim();
  return label ? label : null;
}

function relationLink(index: MapIndex, a: string, b: string): string | null {
  const relation = index.map.relations.find(
    (item) =>
      (item.from === a && item.to === b) || (item.from === b && item.to === a),
  );
  const link = relation?.link?.trim();
  if (!relation || !link) return null;
  return link;
}

/**
 * The proposition on this edge, written in the direction the phrase was
 * stored. A relation phrase wins over the child's parent phrase.
 */
export function conceptProposition(
  index: MapIndex,
  focusId: string,
  neighbor: Neighbor,
): { fromId: string; toId: string; phrase: string } | null {
  const center = index.get(focusId);
  const other = index.get(neighbor.id);
  if (!center || !other) return null;
  if (!conceptLabel(center) || !conceptLabel(other)) return null;
  const relationPhrase = relationLink(index, focusId, neighbor.id);
  if (relationPhrase) {
    const relation = index.map.relations.find(
      (item) =>
        (item.from === focusId && item.to === neighbor.id) ||
        (item.from === neighbor.id && item.to === focusId),
    );
    if (!relation) return null;
    return { fromId: relation.from, toId: relation.to, phrase: relationPhrase };
  }
  const child = neighbor.tree === "child" ? other : center;
  const parentId = neighbor.tree === "child" ? focusId : neighbor.id;
  if (neighbor.tree === null) return null;
  const phrase = child.link?.trim();
  if (!phrase) return null;
  return { fromId: parentId, toId: child.id, phrase };
}

/**
 * Parent first, then the concept just left, then other propositions.
 * An unknown id falls back to the root. Only edges with a phrase are drawn.
 */
export function conceptPicture(
  index: MapIndex,
  conceptId: string,
  previous: string | null = null,
): ConceptPicture {
  const centerId = index.has(conceptId) ? conceptId : index.map.root;
  const propositions = rankNeighbors(index, centerId, previous).flatMap(
    (neighbor) => {
      const proposition = conceptProposition(index, centerId, neighbor);
      return proposition ? [{ neighbor, ...proposition }] : [];
    },
  );
  return {
    centerId,
    spokes: propositions.slice(0, CONCEPT_SPOKES).map((item) => ({
      id: item.neighbor.id,
      fromId: item.fromId,
      toId: item.toId,
      phrase: item.phrase,
      side: compassSide(item.neighbor),
    })),
    more: propositions.slice(CONCEPT_SPOKES).map((item) => item.neighbor.id),
  };
}

/** The sentences formed by the visible spokes only. */
export function conceptReading(
  index: MapIndex,
  picture: ConceptPicture,
): string {
  return picture.spokes
    .map((spoke) => {
      const from = index.get(spoke.fromId);
      const to = index.get(spoke.toId);
      const fromLabel = from ? conceptLabel(from) : null;
      const toLabel = to ? conceptLabel(to) : null;
      if (!fromLabel || !toLabel) return "";
      return `${fromLabel} ${spoke.phrase} ${toLabel}.`;
    })
    .filter((sentence) => sentence.length > 0)
    .join(" ");
}
