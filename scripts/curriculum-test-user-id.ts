/**
 * Stable IDs for curriculum E2E test users.
 * Pattern: curriculum-<bundesland>-<schulform>-klasse-<n>
 *
 * Examples:
 *   curriculum-bayern-realschule-klasse-9
 *   curriculum-nordrhein-westfalen-gymnasium-klasse-10
 *   curriculum-berlin-brandenburg-realschule-klasse-7
 */

import type { CurriculumProvider } from "../src/cli/curriculum/types.js";

const UMLAUT_MAP: Record<string, string> = {
  ä: "ae",
  Ä: "ae",
  ö: "oe",
  Ö: "oe",
  ü: "ue",
  Ü: "ue",
  ß: "ss",
};

/** Turn a provider region label into a readable, ASCII slug. */
export function bundeslandSlug(regionLabel: string): string {
  let slug = regionLabel.trim();
  for (const [from, to] of Object.entries(UMLAUT_MAP)) {
    slug = slug.split(from).join(to);
  }
  return slug
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function curriculumTestUserId(
  provider: Pick<CurriculumProvider, "regionLabel">,
  schoolType: string,
  grade: string,
): string {
  return `curriculum-${bundeslandSlug(provider.regionLabel)}-${schoolType}-klasse-${grade}`;
}

/** Legacy pattern before readable Bundesland + explicit Klasse segment. */
export function isLegacyCurriculumTestUserId(userId: string): boolean {
  return (
    userId.startsWith("curriculum-") &&
    !userId.includes("-klasse-") &&
    /^curriculum-[a-z0-9-]+$/.test(userId)
  );
}