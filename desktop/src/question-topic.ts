/**
 * The topic a question is asked in, shown in bold before it.
 *
 * The same question can mean different things in different contexts — "Which
 * probes do the pods use?" depends on which repository it is about — and the
 * card's title cannot say, because it is often the answer's first sentence.
 * A card from a curriculum names its topic; any other card falls back on its
 * domain, the stable, spoiler-free context every card carries. A domain is a
 * slug, so it is never prettified for a learner: "koerper" is no spelling of
 * "Körper".
 * Framework-free (like discussion.ts), so Studio, Mobile and the Recall panel
 * format it the same way.
 */

import type { CardSegmentPayload } from "../../src/bridge/protocol.js";
import {
  type RenderCardTextOptions,
  renderCardText,
} from "./card-text-render.js";

/** A readable topic label from a card's domain, or null when it has none. */
export function questionTopic(
  domain: string | null | undefined,
): string | null {
  const segments = (domain ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments.join(" › ") : null;
}

/** What a card's question is labelled with: its topic, else its domain. */
export function cardTopic(card: {
  topicTitle?: string | null;
  domain?: string | null;
}): string | null {
  return card.topicTitle?.trim() || questionTopic(card.domain);
}

/**
 * Put the topic in bold before the question, as DOM nodes — card text is
 * never parsed as HTML.
 *
 * With `segments` (ADR 2026-10-14b) the question itself is rendered by
 * `renderCardText`: formulas typeset, images shown, `question` as the plain
 * fallback.
 */
export function renderQuestionWithTopic(
  element: HTMLElement,
  topic: string | null,
  question: string,
  segments?: readonly CardSegmentPayload[] | null,
  options?: RenderCardTextOptions,
): void {
  const doc = element.ownerDocument;
  if (segments && segments.length > 0) {
    const body = doc.createElement("span");
    body.className = "question-body";
    if (topic) {
      const label = doc.createElement("strong");
      label.className = "question-topic";
      label.textContent = topic;
      element.replaceChildren(label, doc.createTextNode(" — "), body);
    } else {
      element.replaceChildren(body);
    }
    void renderCardText(body, segments, question, options);
    return;
  }
  if (!topic) {
    element.textContent = question;
    return;
  }
  const label = doc.createElement("strong");
  label.className = "question-topic";
  label.textContent = topic;
  element.replaceChildren(label, doc.createTextNode(` — ${question}`));
}
