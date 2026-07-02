/**
 * Persists the learner's last navigated curriculum path so a reopened
 * wizard can show it first and jump straight back to the right level,
 * instead of re-navigating all steps from scratch (ADR 2026-07-02,
 * resolved decision 6). Backed by the existing settings/user_config store.
 */

import { type Database, getSetting, setSetting } from "../../kernel/index.js";
import type { CurriculumSelection } from "./types.js";

const LAST_SELECTION_KEY = "curriculum.lastSelection";

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
