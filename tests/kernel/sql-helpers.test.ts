import { describe, expect, it } from "vitest";
import {
  dialectOf,
  nowIso,
  parseStoredTimestampUtc,
} from "../../src/kernel/db/sql.js";

/**
 * ADR 2026-09-04 Decision 5: every instant the kernel writes or compares is
 * ISO-8601 UTC text from JavaScript, and stored timestamps of any historical
 * shape are read back as UTC — never as local time, which shifted a review
 * by the learner's UTC offset.
 */
describe("sql helpers", () => {
  it("writes instants as ISO-8601 UTC with millisecond precision", () => {
    expect(nowIso(new Date(Date.UTC(2026, 8, 18, 14, 0, 0, 123)))).toBe(
      "2026-09-18T14:00:00.123Z",
    );
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("reads SQLite's zone-less default as UTC, not local time", () => {
    expect(parseStoredTimestampUtc("2026-07-15 12:00:00")).toBe(
      Date.UTC(2026, 6, 15, 12),
    );
    expect(parseStoredTimestampUtc("2026-07-15 12:00:00.250")).toBe(
      Date.UTC(2026, 6, 15, 12, 0, 0, 250),
    );
  });

  it("reads zone-less ISO text as UTC and honours explicit zones", () => {
    expect(parseStoredTimestampUtc("2026-07-15T12:00:00")).toBe(
      Date.UTC(2026, 6, 15, 12),
    );
    expect(parseStoredTimestampUtc("2026-07-15T12:00:00.000Z")).toBe(
      Date.UTC(2026, 6, 15, 12),
    );
    expect(parseStoredTimestampUtc("2026-07-15T14:00:00+02:00")).toBe(
      Date.UTC(2026, 6, 15, 12),
    );
  });

  it("returns NaN for text that is not a timestamp", () => {
    expect(parseStoredTimestampUtc("never")).toBeNaN();
  });

  it("treats a provider without a declared dialect as SQLite", () => {
    expect(dialectOf({})).toBe("sqlite");
    expect(dialectOf({ dialect: "postgres" })).toBe("postgres");
  });
});
