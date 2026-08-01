import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildStatsView,
  loadStatsView,
  type StatsFormatters,
} from "../../mobile/src/stats.js";
import {
  createToken,
  type Database,
  ensureCard,
  openDatabase,
  STUDY_TIME_CAP_MS,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-08-01: the mobile companion (Android and iOS) shows the same
 * activity series as the desktop app, read straight from the shared kernel so
 * it also works offline. These tests pin the view model — labels, bar scaling
 * and the "not measured" case — not the DOM.
 */
const formatters: StatsFormatters = {
  locale: "de-DE",
  weekLabel: (week) => `KW ${week}`,
  duration: (ms) => `${Math.round(ms / 1000)}s`,
};

describe("buildStatsView", () => {
  it("scales bars against the busiest bucket and totals the series", () => {
    const view = buildStatsView(
      "day",
      [
        { bucket: "2026-07-15", reviewedCards: 10, studyTimeMs: 60_000 },
        { bucket: "2026-07-16", reviewedCards: 5, studyTimeMs: 30_000 },
      ],
      formatters,
    );

    expect(view.totalCards).toBe(15);
    expect(view.totalStudyTime).toBe("90s");
    expect(view.rows.map((r) => r.barPercent)).toEqual([100, 50]);
    expect(view.rows.map((r) => r.studyTime)).toEqual(["60s", "30s"]);
  });

  it("keeps a tiny bucket visible instead of collapsing its bar", () => {
    const view = buildStatsView(
      "day",
      [
        { bucket: "2026-07-15", reviewedCards: 500, studyTimeMs: 0 },
        { bucket: "2026-07-16", reviewedCards: 1, studyTimeMs: 0 },
      ],
      formatters,
    );
    // 1/500 rounds to 0% — the bar must still be drawable.
    expect(view.rows[1].barPercent).toBe(2);
  });

  it("reports unmeasured study time as null rather than zero", () => {
    // Reviews logged before the response-time gap was closed carry no time:
    // the card count is real, the duration is unknown, and the UI must be
    // able to tell the difference.
    const view = buildStatsView(
      "day",
      [{ bucket: "2026-07-15", reviewedCards: 3, studyTimeMs: 0 }],
      formatters,
    );
    expect(view.totalCards).toBe(3);
    expect(view.totalStudyTime).toBeNull();
    expect(view.rows[0].studyTime).toBeNull();
  });

  it("localizes day, week and month labels and keeps the raw key", () => {
    const day = buildStatsView(
      "day",
      [{ bucket: "2026-07-15", reviewedCards: 1, studyTimeMs: 0 }],
      formatters,
    );
    expect(day.rows[0].label).not.toBe("2026-07-15");
    expect(day.rows[0].label).toContain("15");
    expect(day.rows[0].bucket).toBe("2026-07-15");

    const week = buildStatsView(
      "week",
      [{ bucket: "2026-W29", reviewedCards: 1, studyTimeMs: 0 }],
      formatters,
    );
    expect(week.rows[0].label).toBe("KW 29");

    const month = buildStatsView(
      "month",
      [{ bucket: "2026-07", reviewedCards: 1, studyTimeMs: 0 }],
      formatters,
    );
    expect(month.rows[0].label).toContain("2026");
    expect(month.rows[0].label).not.toBe("2026-07");
  });

  it("returns an empty view without dividing by zero", () => {
    const view = buildStatsView("day", [], formatters);
    expect(view.rows).toEqual([]);
    expect(view.totalCards).toBe(0);
    expect(view.totalStudyTime).toBeNull();
  });
});

describe("loadStatsView", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mobile-stats-"));
    db = await openDatabase({
      dbPath: join(tempDir, "stats.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("reads today's activity from the local database and caps outliers", async () => {
    const token = await createToken(db, {
      slug: "mobile-stats-token",
      concept: "Concept",
      domain: "test",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "klara");

    // One honest answer plus one card that sat on a locked phone overnight.
    const now = new Date().toISOString();
    const times = [4_000, 9 * 60 * 60_000];
    for (let i = 0; i < times.length; i++) {
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, response_time_ms,
              reviewed_at, scheduled_at, session_id)
           VALUES (?, ?, ?, 'klara', 3, ?, ?, '2000-01-01 00:00:00', NULL)`,
        )
        .run(`mobile-log-${i}`, card.id, token.id, times[i], now);
    }

    const view = await loadStatsView(db, "klara", "day", {
      ...formatters,
      duration: (ms) => String(ms),
    });

    expect(view.period).toBe("day");
    expect(view.totalCards).toBe(2);
    expect(view.totalStudyTime).toBe(String(4_000 + STUDY_TIME_CAP_MS));
  });

  it("returns an empty view for a learner with no reviews", async () => {
    const view = await loadStatsView(db, "nobody", "week", formatters);
    expect(view.rows).toEqual([]);
    expect(view.totalCards).toBe(0);
  });
});
