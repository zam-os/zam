/**
 * Standalone first run (ADRs 2026-08-08 and 2026-08-09).
 *
 * The claim under test is the product claim: a learner with nothing but an
 * Android device or iPad — no desktop, no account, no network — ends the first
 * run with a database they own and something to review. Everything runs
 * through the mobile provider and the invoke stub, so it exercises the same
 * IPC path the device does.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import {
  completeFirstRun,
  LOCAL_USER_ID,
  prepareLocalLibrary,
  prepareStandaloneLaunch,
  readLocalSetup,
} from "../../mobile/src/setup/first-run.js";
import { starterCards } from "../../mobile/src/setup/starter-content.js";
import { getKnowledgeContextByName } from "../../src/kernel/models/knowledge-context.js";
import { getSetting } from "../../src/kernel/models/settings.js";
import { buildReviewQueue } from "../../src/kernel/scheduler/queue.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

const open = () => {
  const dir = mkdtempSync(join(tmpdir(), "zam-first-run-"));
  const stub = createTauriInvokeStub(join(dir, "zam-local.db"));
  cleanups.push(() => {
    stub.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return createTauriDatabase(stub.invoke);
};

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) (cleanups.pop() as () => void)();
});

describe("completeFirstRun", () => {
  it("turns an empty database into one the learner can review from", async () => {
    const db = open();
    // What launch actually does on a brand-new install: the file exists but
    // carries no tables at all, so provisioning and the setup check are one
    // step.
    expect(await prepareLocalLibrary(db)).toBeNull();

    const setup = await completeFirstRun(db, {
      locale: "de",
      persona: "school",
      personaContextLabel: "Schule",
      starterCards: starterCards("de"),
    });

    expect(setup.userId).toBe(LOCAL_USER_ID);
    expect(await readLocalSetup(db)).toEqual({ userId: "me", locale: "de" });

    const queue = await buildReviewQueue(db, { userId: setup.userId });
    expect(queue.items.length).toBe(3);
  });

  it("seeds the persona's knowledge context and files the cards into it", async () => {
    const db = open();
    await completeFirstRun(db, {
      locale: "de",
      persona: "school",
      personaContextLabel: "Schule",
      starterCards: starterCards("de"),
    });

    const context = await getKnowledgeContextByName(db, "school");
    expect(context?.label).toBe("Schule");

    const rows = (await db
      .prepare(
        `SELECT COUNT(*) AS n FROM token_contexts WHERE context_id = ?`,
      )
      .get(context?.id)) as { n: number };
    expect(Number(rows.n)).toBe(3);
  });

  it("records the language so the app opens in it next time", async () => {
    const db = open();
    await completeFirstRun(db, { locale: "en", persona: "private" });
    expect(await getSetting(db, "system.locale")).toBe("en");
  });

  it("starts on an empty library when no starter cards are passed", async () => {
    const db = open();
    const setup = await completeFirstRun(db, {
      locale: "de",
      persona: "private",
    });
    const queue = await buildReviewQueue(db, { userId: setup.userId });
    expect(queue.items).toEqual([]);
  });

  it("is idempotent — a repeated run neither duplicates nor resets", async () => {
    const db = open();
    await completeFirstRun(db, {
      locale: "de",
      persona: "school",
      personaContextLabel: "Schule",
      starterCards: starterCards("de"),
    });
    // A learner who edited the seeded context must not have it overwritten.
    await db
      .prepare(`UPDATE contexts SET label = ? WHERE name = ?`)
      .run("Realschule", "school");

    const setup = await completeFirstRun(db, {
      locale: "de",
      persona: "school",
      personaContextLabel: "Schule",
      starterCards: starterCards("de"),
    });

    const queue = await buildReviewQueue(db, { userId: setup.userId });
    expect(queue.items.length).toBe(3);
    expect((await getKnowledgeContextByName(db, "school"))?.label).toBe(
      "Realschule",
    );
  });

  it("keeps an identity that already exists", async () => {
    // The case that matters: a library restored from a server database already
    // carries its learner, and first run must not rename them to "me".
    const db = open();
    await completeFirstRun(db, { locale: "de", persona: "private" });
    await db
      .prepare(`UPDATE user_config SET value = ? WHERE key = 'user.id'`)
      .run("klara");

    const second = await completeFirstRun(db, {
      locale: "de",
      persona: "private",
    });
    expect(second.userId).toBe("klara");
  });
});

describe("prepareStandaloneLaunch", () => {
  it("routes an unpaired fresh install to local first run", async () => {
    const db = open();
    let opened = 0;

    const launch = await prepareStandaloneLaunch(db, async () => {
      opened += 1;
    });

    expect(opened).toBe(1);
    expect(launch).toEqual({ kind: "first-run" });
  });

  it("reopens an existing local library without pairing", async () => {
    const db = open();
    await completeFirstRun(db, { locale: "de", persona: "private" });

    const launch = await prepareStandaloneLaunch(db, async () => {});

    expect(launch).toEqual({
      kind: "library",
      setup: { userId: LOCAL_USER_ID, locale: "de" },
    });
  });
});

describe("starterCards", () => {
  it("differs per language and carries a question for every card", () => {
    for (const locale of ["de", "en"] as const) {
      const cards = starterCards(locale);
      expect(cards.length).toBe(3);
      for (const card of cards) {
        expect(card.question?.trim()).toBeTruthy();
        expect(card.concept.trim()).toBeTruthy();
        expect(card.slug.startsWith("zam/")).toBe(true);
      }
    }
    expect(starterCards("de")[0]?.slug).not.toBe(starterCards("en")[0]?.slug);
  });
});
