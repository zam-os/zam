/**
 * ADR 2026-10-08 R5/R6 — redaction at rest, retention, digests.
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applySessionSynthesis,
  closeSessionObservation,
  commandsFromDigest,
  createToken,
  discoverSkills,
  getMonitorPath,
  inventoryObservationFiles,
  loadInstallConfig,
  openDatabase,
  pairCommands,
  readMonitorLog,
  readSessionDigest,
  rewriteMonitorLogRedacted,
  startSession,
  sweepObservationFiles,
} from "../../../src/kernel/index.js";

const SECRET = "Fake5ecretValue42";
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-08T12:00:00.000Z");

let root: string;
let configPath: string;
let tempDir: string;
let desktopDir: string;
const saved: Record<string, string | undefined> = {};

function setEnv(name: string, value: string): void {
  saved[name] = process.env[name];
  process.env[name] = value;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "zam-retention-"));
  configPath = join(root, "config.json");
  tempDir = join(root, "tmp");
  desktopDir = join(root, "desktop-observer");
  mkdirSync(tempDir);
  mkdirSync(desktopDir);
  setEnv("ZAM_MONITOR_DIR", join(root, "monitor"));
  setEnv("ZAM_OBSERVER_DIR", join(root, "observer"));
  setEnv("ZAM_CONFIG_PATH", configPath);
});

afterEach(() => {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  rmSync(root, { recursive: true, force: true });
});

const locations = () => ({ tempDir, desktopObserverDir: desktopDir });

/** A raw log the way the shell hooks write it, secrets included. */
function writeRawLog(
  sessionId: string,
  commands: string[],
  options: { garbage?: boolean; ageDays?: number } = {},
): string {
  const path = getMonitorPath(sessionId);
  mkdirSync(join(root, "monitor"), { recursive: true });
  const lines: string[] = [
    JSON.stringify({ type: "monitor_meta", ts: "2026-10-01T10:00:00.000Z", event: "start", session_id: sessionId }),
  ];
  commands.forEach((command, index) => {
    const seq = index + 1;
    const at = new Date(Date.UTC(2026, 9, 1, 10, 0, seq)).toISOString();
    lines.push(JSON.stringify({ type: "command_start", ts: at, command, cwd: "/repo", seq, pid: 7 }));
    lines.push(JSON.stringify({ type: "command_end", ts: at, exit_code: 0, seq, pid: 7 }));
  });
  if (options.garbage) lines.push(`{"type":"command_start","command":"broken \\x ${SECRET}"`);
  writeFileSync(path, `${lines.join("\n")}\n`);
  if (options.ageDays !== undefined) age(path, options.ageDays);
  return path;
}

function age(path: string, days: number): void {
  const when = new Date(NOW.getTime() - days * DAY);
  utimesSync(path, when, when);
}

/** A session id whose ULID time is `daysAgo` before NOW. */
function sessionAt(daysAgo: number): string {
  return ulid(NOW.getTime() - daysAgo * DAY);
}

describe("redaction at rest", () => {
  it("reads redacted and rewrites the file redacted, keeping its time", () => {
    const id = sessionAt(1);
    const path = writeRawLog(id, [`export API_TOKEN=${SECRET}`, "npm publish"], {
      garbage: true,
      ageDays: 1,
    });
    const before = statSync(path).mtimeMs;

    // Every read is redacted even while the file is still raw.
    expect(JSON.stringify(readMonitorLog(id))).not.toContain(SECRET);
    expect(readFileSync(path, "utf8")).toContain(SECRET);

    expect(rewriteMonitorLogRedacted(id)).toBe(true);
    const content = readFileSync(path, "utf8");
    expect(content).not.toContain(SECRET);
    expect(content).toContain("export API_TOKEN=[redacted]");
    expect(content).toContain("npm publish");
    expect(statSync(path).mtimeMs).toBe(before);
    // Already redacted: nothing to do.
    expect(rewriteMonitorLogRedacted(id)).toBe(false);
  });
});

describe("closeSessionObservation", () => {
  it("keeps a value-free digest and deletes the raw files", () => {
    const id = sessionAt(1);
    writeRawLog(id, [`docker login --password ${SECRET}`, "docker push app"]);
    mkdirSync(join(root, "observer"), { recursive: true });
    writeFileSync(join(root, "observer", `${id}.reports.jsonl`), "{}\n");

    const result = closeSessionObservation(id, NOW);

    expect(result).toEqual({
      sessionId: id,
      digested: true,
      deleted: ["monitor-log", "observer-reports"],
    });
    expect(existsSync(getMonitorPath(id))).toBe(false);
    const digest = readSessionDigest(id);
    expect(digest?.prefixes).toEqual(["docker login", "docker push"]);
    expect(JSON.stringify(digest)).not.toContain(SECRET);
  });

  it("rejects odd session ids", () => {
    expect(() => closeSessionObservation("../etc", NOW)).toThrow(
      /Invalid session ID/,
    );
  });
});

describe("sweepObservationFiles", () => {
  it("records when retention started and treats older sessions as legacy", () => {
    const legacyId = sessionAt(40);
    const legacyPath = writeRawLog(legacyId, [`export TOKEN=${SECRET}`], {
      ageDays: 40,
    });

    const result = sweepObservationFiles({ now: NOW, configPath, locations: locations() });

    expect(loadInstallConfig(configPath).observation?.retentionSince).toBe(
      NOW.toISOString(),
    );
    // Legacy: redacted, but never deleted without the owner.
    expect(existsSync(legacyPath)).toBe(true);
    expect(readFileSync(legacyPath, "utf8")).not.toContain(SECRET);
    expect(result.legacyKept).toBe(1);
    expect(result.redacted).toEqual([legacyId]);
    expect(inventoryObservationFiles({ configPath, locations: locations() })).toEqual([
      expect.objectContaining({ kind: "monitor-log", sessionId: legacyId, legacy: true }),
    ]);
  });

  it("deletes files past the window and keeps a digest of each log", () => {
    // Retention started 30 days ago on this machine.
    writeFileSync(
      configPath,
      JSON.stringify({
        observation: { retentionSince: new Date(NOW.getTime() - 30 * DAY).toISOString() },
      }),
    );
    const oldId = sessionAt(20);
    const freshId = sessionAt(0.5);
    const oldPath = writeRawLog(oldId, ["git status", "git commit -m x"], { ageDays: 20 });
    const freshPath = writeRawLog(freshId, ["git status"], { ageDays: 0.5 });
    mkdirSync(join(root, "observer"), { recursive: true });
    const oldReports = join(root, "observer", `${oldId}.reports.jsonl`);
    writeFileSync(oldReports, "{}\n");
    age(oldReports, 20);
    const oldCapture = join(tempDir, "zam-capture-abcd1234.png");
    writeFileSync(oldCapture, "png");
    age(oldCapture, 20);
    const legacyCapture = join(tempDir, "zam-capture-beef0000.png");
    writeFileSync(legacyCapture, "png");
    age(legacyCapture, 40);
    const desktopSession = join(desktopDir, oldId);
    mkdirSync(desktopSession);
    writeFileSync(join(desktopSession, "watch-reports.jsonl"), "{}\n");
    age(join(desktopSession, "watch-reports.jsonl"), 20);
    age(desktopSession, 20);

    const result = sweepObservationFiles({ now: NOW, configPath, locations: locations() });

    expect(existsSync(oldPath)).toBe(false);
    expect(readSessionDigest(oldId)?.prefixes).toEqual(["git status", "git commit"]);
    expect(existsSync(oldReports)).toBe(false);
    expect(existsSync(oldCapture)).toBe(false);
    expect(existsSync(desktopSession)).toBe(false);
    expect(existsSync(freshPath)).toBe(true);
    expect(existsSync(legacyCapture)).toBe(true);
    expect(result.deleted).toEqual(
      expect.arrayContaining([
        { kind: "monitor-log", sessionId: oldId },
        { kind: "observer-reports", sessionId: oldId },
        { kind: "temp-capture", sessionId: null },
        { kind: "desktop-observer-session", sessionId: oldId },
      ]),
    );
  });

  it("never rewrites a config.json that does not parse, and deletes nothing", () => {
    // A trailing comma, as when the learner hand-edits the screen switch.
    const broken = '{ "observation": { "screen": true, }, "workspaces": [] }';
    writeFileSync(configPath, broken);
    const id = sessionAt(40);
    const path = writeRawLog(id, [`export TOKEN=${SECRET}`], { ageDays: 40 });

    const result = sweepObservationFiles({ now: NOW, configPath, locations: locations() });

    expect(readFileSync(configPath, "utf8")).toBe(broken);
    expect(result.retentionSince).toBeNull();
    expect(result.deleted).toEqual([]);
    expect(existsSync(path)).toBe(true);
    // Redaction does not depend on the config and still happens.
    expect(readFileSync(path, "utf8")).not.toContain(SECRET);
  });

  it("keeps raw files for 24 hours by default", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        observation: { retentionSince: new Date(NOW.getTime() - 30 * DAY).toISOString() },
      }),
    );
    const dayOld = writeRawLog(sessionAt(1.5), ["git status"], { ageDays: 1.5 });
    const hoursOld = writeRawLog(sessionAt(0.5), ["git status"], { ageDays: 0.5 });
    expect(
      sweepObservationFiles({ now: NOW, configPath, locations: locations() }).retentionDays,
    ).toBe(1);
    expect(existsSync(dayOld)).toBe(false);
    expect(existsSync(hoursOld)).toBe(true);
  });

  it("honours observation.retentionDays", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        observation: {
          retentionDays: 3,
          retentionSince: new Date(NOW.getTime() - 30 * DAY).toISOString(),
        },
      }),
    );
    const id = sessionAt(5);
    const path = writeRawLog(id, ["git status"], { ageDays: 5 });
    expect(sweepObservationFiles({ now: NOW, configPath, locations: locations() }).retentionDays).toBe(3);
    expect(existsSync(path)).toBe(false);
  });

  it("leaves a log alone while its session is still writing to it", () => {
    sweepObservationFiles({ now: new Date(NOW.getTime() - DAY), configPath, locations: locations() });
    const id = sessionAt(0);
    const path = writeRawLog(id, [`export TOKEN=${SECRET}`]);
    const result = sweepObservationFiles({ now: new Date(), configPath, locations: locations() });
    expect(result.redacted).toEqual([]);
    expect(readFileSync(path, "utf8")).toContain(SECRET);
    // Readers still only ever see the redacted text.
    expect(JSON.stringify(readMonitorLog(id))).not.toContain(SECRET);
  });

  it("deletes nothing locally because of a confirmation made elsewhere", async () => {
    sweepObservationFiles({ now: new Date(NOW.getTime() - DAY), configPath, locations: locations() });
    const db = await openDatabase({ dbPath: ":memory:", initialize: true, useConfiguredCloud: false });
    try {
      const token = await createToken(db, {
        slug: "npm-publish",
        concept: "Publish a package with npm",
        domain: "npm",
        bloom_level: 3,
      });
      const session = await startSession(db, { user_id: "tester", task: "Publish" });
      const path = writeRawLog(session.id, ["npm publish"], { ageDays: 1 });

      // The synced database says the synthesis was confirmed — on another
      // machine, as far as this one can tell.
      await applySessionSynthesis(db, {
        sessionId: session.id,
        tokenSlug: token.slug,
        inferredRating: 3,
        confirmedRating: 3,
        confidence: "high",
        evidence: {
          matchedCommands: 1,
          helpSeeking: false,
          errorCount: 0,
          selfCorrections: 0,
          medianGapMs: null,
          thinkingGapMs: null,
        },
        matchedCommandTexts: [`npm publish --otp ${SECRET}`],
      });

      sweepObservationFiles({ now: NOW, configPath, locations: locations() });
      expect(existsSync(path)).toBe(true);

      // What landed in the shared database is redacted too.
      const rows = [
        await db
          .prepare("SELECT evidence FROM session_syntheses WHERE session_id = ?")
          .all(session.id),
        await db
          .prepare("SELECT evidence FROM review_attempts WHERE session_id = ?")
          .all(session.id),
        await db
          .prepare("SELECT * FROM session_steps WHERE session_id = ?")
          .all(session.id),
      ];
      expect(JSON.stringify(rows)).toContain("npm publish --otp [redacted]");
      expect(JSON.stringify(rows)).not.toContain(SECRET);
    } finally {
      await db.close();
    }
  });
});

describe("skill discovery from digests", () => {
  it("finds the same patterns in digests as in the logs they replaced", () => {
    const sessions = [sessionAt(3), sessionAt(2), sessionAt(1)];
    for (const id of sessions) {
      writeRawLog(id, [
        "git checkout -b feat/x",
        `export NPM_TOKEN=${SECRET}`,
        "npm install",
        "npm run build",
        "ls",
      ]);
    }
    const fromLogs = new Map(
      sessions.map((id) => [id, pairCommands(readMonitorLog(id))]),
    );
    const before = discoverSkills(fromLogs);

    for (const id of sessions) closeSessionObservation(id, NOW);
    const fromDigests = new Map(
      sessions.map((id) => [
        id,
        commandsFromDigest(readSessionDigest(id)?.prefixes ?? []),
      ]),
    );
    const after = discoverSkills(fromDigests);

    const shape = (proposals: typeof before) =>
      proposals.map(({ slug, steps, sessionCount, confidence }) => ({
        slug,
        steps,
        sessionCount,
        confidence,
      }));
    expect(before.length).toBeGreaterThan(0);
    expect(shape(after)).toEqual(shape(before));
    expect(JSON.stringify(after)).not.toContain(SECRET);
  });
});
