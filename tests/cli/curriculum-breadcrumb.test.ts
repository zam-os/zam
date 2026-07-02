import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getLastCurriculumSelection,
  setLastCurriculumSelection,
} from "../../src/cli/curriculum/breadcrumb.js";
import { type Database, openDatabase } from "../../src/kernel/index.js";

describe("curriculum breadcrumb persistence", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-curriculum-breadcrumb-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    try {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      });
    } catch {
      // Best-effort cleanup
    }
  });

  it("returns undefined when nothing has been navigated yet", async () => {
    expect(await getLastCurriculumSelection(db)).toBeUndefined();
  });

  it("round-trips a full breadcrumb", async () => {
    await setLastCurriculumSelection(db, {
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    });

    expect(await getLastCurriculumSelection(db)).toEqual({
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    });
  });

  it("round-trips a partial breadcrumb from an abandoned mid-navigation", async () => {
    await setLastCurriculumSelection(db, {
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
    });

    expect(await getLastCurriculumSelection(db)).toEqual({
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
    });
  });

  it("overwrites the previous breadcrumb on repeated navigation", async () => {
    await setLastCurriculumSelection(db, {
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "deutsch",
    });
    await setLastCurriculumSelection(db, {
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "englisch",
    });

    expect(await getLastCurriculumSelection(db)).toEqual({
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "englisch",
    });
  });
});
