/**
 * Required points of a reference answer (ADR 2026-09-08).
 *
 * A reference answer authored as a list asks for one point per list item; one
 * authored as prose asks for exactly one. The points are therefore *derived*
 * from the answer text rather than stored beside it — a stored count would be
 * a second artefact that can drift out of step with the text it counts, while
 * derived points cannot disagree with themselves.
 *
 * Kept in the kernel because "how much does this card ask for" is learning
 * logic: the queue, the publication gate, and every surface need the same
 * answer, and none of them may reach a different one.
 */

/** Bullet markers a list item may start with, before its text. */
const BULLET = /^\s*(?:[-*•·–—]|\d{1,2}[.)])\s+(?<text>\S.*)$/u;

/**
 * The points a reference answer asks for, in the order they are written.
 *
 * Returns the whole trimmed answer as a single point when it is prose — the
 * common and correct case for an atomic item, which is why it needs no
 * authoring ceremony. An empty answer asks for nothing.
 */
export function parseAnswerPoints(concept: string): string[] {
  const lines = concept.split(/\r?\n/);
  const points: string[] = [];
  for (const line of lines) {
    const text = BULLET.exec(line)?.groups?.text?.trim();
    if (text) points.push(text);
  }
  if (points.length > 0) return points;

  const prose = concept.trim();
  return prose ? [prose] : [];
}

/**
 * How many points the answer asks for. `0` only for an empty answer, which the
 * publication gate blocks separately (`empty_criterion`).
 */
export function countAnswerPoints(concept: string): number {
  return parseAnswerPoints(concept).length;
}

/**
 * Bloom levels whose answers decompose into countable facts.
 *
 * "Analyse" (4) and "Synthesise" (5) do not: their answers are arguments, not
 * enumerable details, and a count there would be fabricated. Those cards keep
 * the unscored behaviour (ADR 2026-09-08 §5).
 */
export const MAX_SCORED_BLOOM_LEVEL = 3;

/** Whether a card's answer may be scored by points at all. */
export function supportsAnswerPoints(bloomLevel: number): boolean {
  return Number.isFinite(bloomLevel) && bloomLevel <= MAX_SCORED_BLOOM_LEVEL;
}

/**
 * Whether the learner should be told how many points are expected.
 *
 * Only above one: telling someone a single-point answer wants one thing is
 * noise, and it is the *plural* that does the work — a learner who knows three
 * things are wanted keeps digging past the first. Never the content, only the
 * count (ADR 2026-09-08 §5).
 */
export function shouldShowPointCount(
  concept: string,
  bloomLevel: number,
): boolean {
  return supportsAnswerPoints(bloomLevel) && countAnswerPoints(concept) > 1;
}

/**
 * The rating a coverage score implies, or `null` when the learner still has a
 * genuine choice.
 *
 * Missing any point is rating 1 — a failed recall, whether three of four points
 * landed or none did. Full coverage yields no suggestion at all: which of
 * Hard/Good/Easy applies is about effort, which the evaluator never observes
 * (ADR 2026-09-08 §3, §4).
 */
export function ratingFromCoverage(
  recalledPoints: number,
  totalPoints: number,
): 1 | null {
  if (totalPoints <= 0) return null;
  const recalled = Math.max(0, Math.min(recalledPoints, totalPoints));
  return recalled < totalPoints ? 1 : null;
}
