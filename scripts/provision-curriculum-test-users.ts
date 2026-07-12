/**
 * One-shot provisioner: register curriculum E2E test users in the active DB.
 * Each user gets one card on a shared anchor token so database-select-user works.
 * Does not touch thomas or test-user-0.6.2.
 *
 * Usage: npx tsx scripts/provision-curriculum-test-users.ts
 */

import { CURRICULUM_PROVIDERS } from "../src/cli/curriculum/registry.js";
import { openDatabase } from "../src/kernel/index.js";
import { ensureCard } from "../src/kernel/models/card.js";
import { createToken, getTokenBySlug } from "../src/kernel/models/token.js";

const ANCHOR_SLUG = "curriculum-test-profile-anchor";
const SKIP_USERS = new Set(["thomas", "test-user-0.6.2"]);

function collectUserIds(): string[] {
  const ids = new Set<string>();
  for (const provider of CURRICULUM_PROVIDERS) {
    const region = provider.region.toLowerCase();
    for (const schoolType of provider.listSchoolTypes()) {
      const grades = provider.listGrades(schoolType.id);
      if (grades.length === 0) continue;
      for (const grade of grades) {
        ids.add(`curriculum-${region}-${schoolType.id}-${grade.id}`);
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

async function main(): Promise<void> {
  const userIds = collectUserIds().filter((id) => !SKIP_USERS.has(id));
  const db = await openDatabase();
  try {
    const anchor = await ensureAnchorToken(db);
    for (const userId of userIds) {
      await ensureCard(db, anchor.id, userId);
    }
    console.log(
      JSON.stringify(
        {
          success: true,
          anchorSlug: ANCHOR_SLUG,
          usersProvisioned: userIds.length,
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