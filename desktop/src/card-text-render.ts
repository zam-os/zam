/**
 * Card text on screen (ADR 2026-10-14b).
 *
 * A card's question, answer and options may arrive as segments. This module
 * turns them into DOM nodes — text nodes for text, an element per formula
 * and per image — and never parses a string as HTML: HTML exists only as the
 * output of this code (Decision 2).
 *
 * Rendering is progressive. Every formula first shows its plain Unicode form
 * (`W_el = ½CU²`), so a card never flashes empty and never depends on the
 * renderer; the MathML replaces it once Temml has loaded. A surface without
 * segments gets its plain string, exactly as before.
 *
 * Framework-free (like `question-topic.ts`), so Studio, Mobile and the recall
 * panel render card text the same way.
 */

import type { CardSegmentPayload } from "../../src/bridge/protocol.js";
import { texToPlain } from "../../src/kernel/library/tex-plain.js";
import { renderMath } from "./math-render.js";

export interface RenderCardTextOptions {
  /**
   * A displayable URL for an image segment's asset hash — the review
   * payload's media as a `data:` URL. Without one, the image's alt text is
   * shown in its place.
   */
  imageSource?: (hash: string) => string | null;
}

/** One rendered formula, for a caller that wants to wait for the MathML. */
export type PendingMath = Promise<boolean>;

/**
 * Render `segments` into `element`, or `plain` when there are none.
 * Returns once the text is in place; the promise it hands back settles when
 * every formula has its MathML (or kept its plain form).
 */
export function renderCardText(
  element: Element,
  segments: readonly CardSegmentPayload[] | null | undefined,
  plain: string,
  options: RenderCardTextOptions = {},
): Promise<void> {
  if (!segments || segments.length === 0) {
    element.textContent = plain;
    return Promise.resolve();
  }
  const doc = element.ownerDocument;
  const nodes: Node[] = [];
  const pending: PendingMath[] = [];
  for (const segment of segments) {
    switch (segment.type) {
      case "text":
        nodes.push(doc.createTextNode(segment.text));
        break;
      case "math": {
        const holder = doc.createElement("span");
        holder.className = segment.block
          ? "card-math card-math-block"
          : "card-math";
        holder.textContent = texToPlain(segment.tex);
        nodes.push(holder);
        pending.push(
          renderMath(holder, {
            tex: segment.tex,
            block: segment.block,
            speech: segment.speech,
          }),
        );
        break;
      }
      case "image": {
        const source = options.imageSource?.(segment.media) ?? null;
        if (!source) {
          nodes.push(doc.createTextNode(segment.alt));
          break;
        }
        const image = doc.createElement("img");
        image.className = segment.inline
          ? "card-image card-image-inline"
          : "card-image";
        image.alt = segment.alt;
        image.src = source;
        if (segment.caption && !segment.inline) {
          const figure = doc.createElement("figure");
          figure.className = "card-figure";
          const caption = doc.createElement("figcaption");
          caption.textContent = segment.caption;
          figure.append(image, caption);
          nodes.push(figure);
        } else {
          nodes.push(image);
        }
        break;
      }
    }
  }
  element.replaceChildren(...nodes);
  return Promise.all(pending).then(() => undefined);
}
