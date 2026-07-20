/**
 * One-shot provisioner: register curriculum E2E test users in the active DB.
 * Each user gets one card on a shared anchor token so database-select-user works.
 * Does not touch thomas or test-user-0.6.2.
 *
 * Usage: npx tsx scripts/provision-curriculum-test-users.ts
 */

import { RAW_CURRICULUM_PROVIDERS } from "../src/cli/curriculum/registry.js";
import {
  curriculumTestUserId,
  isLegacyCurriculumTestUserId,
} from "./curriculum-test-user-id.js";
import { openDatabase } from "../src/kernel/index.js";
import { deleteCardForUser, ensureCard } from "../src/kernel/models/card.js";
import { createToken, getTokenBySlug } from "../src/kernel/models/token.js";

const ANCHOR_SLUG = "curriculum-test-profile-anchor";
const SKIP_USERS = new Set(["thomas", "test-user-0.6.2"]);

function collectUserIds(): string[] {
  const ids = new Set<string>();
  // Raw catalog: one test user per school type × grade, even when topics
  // for that path are still missing (Epic #132 coverage work).
  for (const provider of RAW_CURRICULUM_PROVIDERS) {
    for (const schoolType of provider.listSchoolTypes()) {
      const grades = provider.listGrades(schoolType.id);
      if (grades.length === 0) continue;
      for (const grade of grades) {
        ids.add(curriculumTestUserId(provider, schoolType.id, grade.id));
      }
    }
  }
  return [...ids].sort();
}

async function ensureAnchorToken(db: Awaited<ReturnType<typeof openDatabase>>) {
  const existing = await getTokenBySlug(db, ANCHOR_SLUG);
  if (existing) return existing;
  return createToken(db, {
    slug: ANCHOR_SLUG,
    concept:
      "Shared anchor token so curriculum import test users appear as selectable learning profiles.",
    domain: "zam",
    bloom_level: 1,
    question: "What is this token for?",
    symbiosis_mode: "autonomy",
  });
}

async function removeLegacyCurriculumUsers(
  db: Awaited<ReturnType<typeof openDatabase>>,
  anchorTokenId: string,
): Promise<string[]> {
  const rows = (await db
    .prepare(
      `SELECT DISTINCT user_id AS userId
       FROM cards
       WHERE user_id LIKE 'curriculum-%'`,
    )
    .all()) as Array<{ userId: string }>;

  const removed: string[] = [];
  for (const { userId } of rows) {
    if (!isLegacyCurriculumTestUserId(userId) || SKIP_USERS.has(userId)) {
      continue;
    }
    try {
      await deleteCardForUser(db, anchorTokenId, userId);
      removed.push(userId);
    } catch {
      // Anchor card may already be gone; ignore.
    }
  }
  return removed.sort();
}

async function main(): Promise<void> {
  const userIds = collectUserIds().filter((id) => !SKIP_USERS.has(id));
  const db = await openDatabase();
  try {
    const anchor = await ensureAnchorToken(db);
    const removedLegacy = await removeLegacyCurriculumUsers(db, anchor.id);
    for (const userId of userIds) {
      await ensureCard(db, anchor.id, userId);
    }
    console.log(
      JSON.stringify(
        {
          success: true,
          anchorSlug: ANCHOR_SLUG,
          usersProvisioned: userIds.length,
          legacyUsersRemoved: removedLegacy.length,
          userIds,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});