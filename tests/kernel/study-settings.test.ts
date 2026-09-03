import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../../src/kernel/index.js";
import {
  DEFAULT_STUDY_LEARNING_SETTINGS,
  DEFAULT_STUDY_WORKLOAD,
  getStudyLearningSettings,
  getStudyWorkloadSettings,
  isStudyLearningMode,
  openDatabase,
  setStudyLearningSettings,
  setStudyWorkloadSettings,
} from "../../src/kernel/index.js";

let directory: string;
let db: Database;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "zam-study-settings-test-"));
  db = await openDatabase({
    dbPath: join(directory, "zam.db"),
    initialize: true,
    useConfiguredCloud: false,
  });
});

afterEach(async () => {
  await db.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("study workload and learning settings", () => {
  it("defaults workload to balanced preset", async () => {
    const workload = await getStudyWorkloadSettings(db, "alice");
    expect(workload).toEqual(DEFAULT_STUDY_WORKLOAD);
    expect(workload.preset).toBe("balanced");
  });

  it("updates workload settings", async () => {
    const updated = await setStudyWorkloadSettings(db, "alice", {
      preset: "exam",
    });
    expect(updated.preset).toBe("exam");
    expect(updated.maxNew).toBe(40);
    const reloaded = await getStudyWorkloadSettings(db, "alice");
    expect(reloaded.preset).toBe("exam");
  });

  it("defaults learning settings to flash mode when no setting exists", async () => {
    const settings = await getStudyLearningSettings(db, "bob");
    expect(settings).toEqual(DEFAULT_STUDY_LEARNING_SETTINGS);
    expect(settings.learningMode).toBe("flash");
    expect(settings.voiceRevealTimeoutSec).toBe(20);
    expect(settings.voiceRatingTimeoutSec).toBe(20);
  });

  it("honors caller fallback learning mode for existing learners with AI configured", async () => {
    const settings = await getStudyLearningSettings(db, "charlie", {
      fallbackLearningMode: "answer_feedback",
    });
    expect(settings.learningMode).toBe("answer_feedback");
    expect(settings.voiceRevealTimeoutSec).toBe(20);
  });

  it("persists and updates learning settings", async () => {
    const saved = await setStudyLearningSettings(db, "bob", {
      learningMode: "answer_feedback",
      voiceRevealTimeoutSec: 15,
    });
    expect(saved.learningMode).toBe("answer_feedback");
    expect(saved.voiceRevealTimeoutSec).toBe(15);
    expect(saved.voiceRatingTimeoutSec).toBe(20);

    const reloaded = await getStudyLearningSettings(db, "bob");
    expect(reloaded.learningMode).toBe("answer_feedback");
    expect(reloaded.voiceRevealTimeoutSec).toBe(15);
    expect(reloaded.voiceRatingTimeoutSec).toBe(20);
  });

  it("supports answer_variation mode and clamps invalid timeout ranges", async () => {
    const saved = await setStudyLearningSettings(db, "dave", {
      learningMode: "answer_variation",
      voiceRevealTimeoutSec: 100, // exceeds max (60) -> falls back to default 20
      voiceRatingTimeoutSec: 2, // below min (5) -> falls back to default 20
    });
    expect(saved.learningMode).toBe("answer_variation");
    expect(saved.voiceRevealTimeoutSec).toBe(20);
    expect(saved.voiceRatingTimeoutSec).toBe(20);
  });

  it("validates isStudyLearningMode helper", () => {
    expect(isStudyLearningMode("flash")).toBe(true);
    expect(isStudyLearningMode("answer_feedback")).toBe(true);
    expect(isStudyLearningMode("answer_variation")).toBe(true);
    expect(isStudyLearningMode("custom")).toBe(false);
    expect(isStudyLearningMode(undefined)).toBe(false);
    expect(isStudyLearningMode(null)).toBe(false);
  });

  it("throws on empty userId", async () => {
    await expect(getStudyLearningSettings(db, "   ")).rejects.toThrow(
      "Study learning settings require a user ID",
    );
    await expect(
      setStudyLearningSettings(db, "", { learningMode: "flash" }),
    ).rejects.toThrow("Study learning settings require a user ID");
  });
});
