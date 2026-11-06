/**
 * The Today headline: what a session started now would offer, in words that
 * keep the two kinds apart. A card nobody has seen yet is not due; calling it
 * so tells a fresh learner they are 354 cards behind on their first day.
 * Framework-free, like question-topic.ts.
 */

export interface DueHeadlineText {
  t(key: string): string;
  tf(key: string, values: Record<string, string | number>): string;
}

export function dueHeadline(
  offer: { reviews: number; newCards: number },
  { t, tf }: DueHeadlineText,
): string {
  const { reviews, newCards } = offer;
  if (reviews > 0 && newCards > 0) {
    return tf("dashboard_mixed_headline", {
      total: reviews + newCards,
      due: reviews,
      new: newCards,
    });
  }
  if (reviews === 1) return t("dashboard_due_headline_one");
  if (reviews > 1) return tf("dashboard_due_headline", { count: reviews });
  if (newCards === 1) return t("dashboard_new_headline_one");
  if (newCards > 1) return tf("dashboard_new_headline", { count: newCards });
  return t("dashboard_due_none");
}
