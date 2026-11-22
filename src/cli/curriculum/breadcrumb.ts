/**
 * Stores and reads a learner's remembered curriculum position (`settings` key
 * `curriculum.lastSelection`), still consulted as an optional scope hint by
 * material import and atlas scope-cell upgrades.
 */

import { type Database, getSetting, setSetting } from "../../kernel/index.js";

const LAST_SELECTION_KEY = "curriculum.lastSelection";

export interface CurriculumSelection {
  schoolType?: string;
  grade?: string;
  subject?: string;
  track?: string;
}

export interface CurriculumBreadcrumb extends CurriculumSelection {
  providerId: string;
}

export async function getLastCurriculumSelection(
  db: Database,
): Promise<CurriculumBreadcrumb | undefined> {
  const raw = await getSetting(db, LAST_SELECTION_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as CurriculumBreadcrumb;
  } catch {
    return undefined;
  }
}

export async function setLastCurriculumSelection(
  db: Database,
  breadcrumb: CurriculumBreadcrumb,
): Promise<void> {
  await setSetting(db, LAST_SELECTION_KEY, JSON.stringify(breadcrumb));
}
