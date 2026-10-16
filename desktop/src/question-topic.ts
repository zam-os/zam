/**
 * The topic a question is asked in, shown in bold before it.
 *
 * The same question can mean different things in different contexts — "Which
 * probes do the pods use?" depends on which repository it is about — and the
 * card's title cannot say, because it is often the answer's first sentence.
 * The domain is the stable, spoiler-free context every card carries.
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
  domain: string | null | undefined,
  question: string,
  segments?: readonly CardSegmentPayload[] | null,
  options?: RenderCardTextOptions,
): void {
  const topic = questionTopic(domain);
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
