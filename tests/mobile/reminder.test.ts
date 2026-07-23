import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER,
  formatTimeInput,
  millisUntilNext,
  parseReminderConfig,
  parseTimeInput,
} from "../../mobile/src/reminder.js";

const HOUR = 60 * 60 * 1000;

describe("parseReminderConfig", () => {
  it("returns the default when storage is empty or malformed", () => {
    expect(parseReminderConfig(null)).toEqual(DEFAULT_REMINDER);
    expect(parseReminderConfig("not json")).toEqual(DEFAULT_REMINDER);
  });

  it("keeps valid values and treats enabled strictly as a boolean", () => {
    expect(
      parseReminderConfig(
        JSON.stringify({ enabled: true, hour: 8, minute: 30 }),
      ),
    ).toEqual({ enabled: true, hour: 8, minute: 30 });
    expect(
      parseReminderConfig(
        JSON.stringify({ enabled: "yes", hour: 8, minute: 0 }),
      ).enabled,
    ).toBe(false);
  });

  it("clamps out-of-range hour/minute back to the default", () => {
    expect(
      parseReminderConfig(
        JSON.stringify({ enabled: true, hour: 40, minute: 90 }),
      ),
    ).toEqual({
      enabled: true,
      hour: DEFAULT_REMINDER.hour,
      minute: DEFAULT_REMINDER.minute,
    });
  });
});

describe("parseTimeInput", () => {
  it("parses valid HH:MM", () => {
    expect(parseTimeInput("17:30")).toEqual({ hour: 17, minute: 30 });
    expect(parseTimeInput("7:05")).toEqual({ hour: 7, minute: 5 });
  });

  it("rejects malformed or out-of-range values", () => {
    for (const value of ["", "bad", "24:00", "12:60", "1730", "12:5"]) {
      expect(parseTimeInput(value)).toBeNull();
    }
  });
});

describe("formatTimeInput", () => {
  it("zero-pads hour and minute", () => {
    expect(formatTimeInput({ enabled: true, hour: 7, minute: 5 })).toBe(
      "07:05",
    );
  });
});

describe("millisUntilNext", () => {
  it("returns the delay to later the same day", () => {
    const now = new Date(2026, 6, 22, 10, 0, 0, 0);
    expect(millisUntilNext(17, 0, now)).toBe(7 * HOUR);
  });

  it("rolls over to tomorrow when the time already passed today", () => {
    const now = new Date(2026, 6, 22, 18, 0, 0, 0);
    expect(millisUntilNext(17, 0, now)).toBe(23 * HOUR);
  });

  it("never fires immediately when the target equals now", () => {
    const now = new Date(2026, 6, 22, 17, 0, 0, 0);
    expect(millisUntilNext(17, 0, now)).toBe(24 * HOUR);
  });
});
