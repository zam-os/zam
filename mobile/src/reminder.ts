/**
 * Daily due-reminder configuration and scheduling helpers.
 *
 * FR-5: one configurable daily notification with the due count, no streaks or
 * gamification. The pure logic here (config validation, next-occurrence delay)
 * is unit-tested; the native WorkManager job and notification live in the
 * Android `ReminderPlugin`/`DueReminderWorker`, which reads the last due count
 * the app stored. The count is therefore as fresh as the last app open — a
 * deliberate simplicity tradeoff recorded in the ADR.
 */

export interface ReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const REMINDER_STORAGE_KEY = "zam.mobile-reminder.v1";

export const DEFAULT_REMINDER: ReminderConfig = {
  enabled: false,
  hour: 17,
  minute: 0,
};

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? Math.trunc(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function parseReminderConfig(raw: string | null): ReminderConfig {
  if (!raw) return { ...DEFAULT_REMINDER };
  try {
    const value = JSON.parse(raw) as Partial<ReminderConfig>;
    return {
      enabled: value.enabled === true,
      hour: clampInt(value.hour, 0, 23, DEFAULT_REMINDER.hour),
      minute: clampInt(value.minute, 0, 59, DEFAULT_REMINDER.minute),
    };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

/** Parse an `<input type="time">` "HH:MM" value, or null when malformed. */
export function parseTimeInput(
  value: string,
): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function formatTimeInput(config: ReminderConfig): string {
  const hh = String(config.hour).padStart(2, "0");
  const mm = String(config.minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Milliseconds from `now` until the next local occurrence of `hour:minute`.
 * When the target is now or already past today, schedule for tomorrow so the
 * first notification never fires immediately on enable.
 */
export function millisUntilNext(
  hour: number,
  minute: number,
  now: Date = new Date(),
): number {
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}
