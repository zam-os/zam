/**
 * Tests for observation/analyzer.ts — pure-function monitor log analysis.
 */

import { describe, it, expect } from "vitest";
import {
  parseMonitorLog,
  pairCommands,
  analyzeObservation,
} from "../../../src/kernel/observation/analyzer.js";
import type {
  MonitorEvent,
  CommandRecord,
  TokenPattern,
} from "../../../src/kernel/observation/analyzer.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStart(seq: number, command: string, ts: string, pid = 1000): MonitorEvent {
  return { type: "command_start", ts, command, cwd: "/home/user", seq, pid };
}

function makeEnd(seq: number, exitCode: number, ts: string, pid = 1000): MonitorEvent {
  return { type: "command_end", ts, exit_code: exitCode, seq, pid };
}

function ts(minuteOffset: number, secondOffset = 0): string {
  const d = new Date("2026-03-23T10:00:00Z");
  d.setMinutes(d.getMinutes() + minuteOffset);
  d.setSeconds(d.getSeconds() + secondOffset);
  return d.toISOString();
}

// ── parseMonitorLog ─────────────────────────────────────────────────────────

describe("parseMonitorLog", () => {
  it("parses valid JSONL", () => {
    const jsonl = [
      JSON.stringify({ type: "monitor_meta", ts: ts(0), event: "start", session_id: "s1" }),
      JSON.stringify({ type: "command_start", ts: ts(0, 5), command: "ls", cwd: "/", seq: 1, pid: 100 }),
      JSON.stringify({ type: "command_end", ts: ts(0, 6), exit_code: 0, seq: 1, pid: 100 }),
    ].join("\n");

    const events = parseMonitorLog(jsonl);
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("monitor_meta");
    expect(events[1].command).toBe("ls");
    expect(events[2].exit_code).toBe(0);
  });

  it("skips malformed lines", () => {
    const jsonl = `{"type":"command_start","ts":"2026-01-01T00:00:00Z","command":"ls","seq":1,"pid":1}
not json at all
{"type":"command_end","ts":"2026-01-01T00:00:01Z","exit_code":0,"seq":1,"pid":1}`;

    const events = parseMonitorLog(jsonl);
    expect(events).toHaveLength(2);
  });

  it("handles empty input", () => {
    expect(parseMonitorLog("")).toEqual([]);
    expect(parseMonitorLog("  \n  \n  ")).toEqual([]);
  });
});

// ── pairCommands ────────────────────────────────────────────────────────────

describe("pairCommands", () => {
  it("pairs start and end events by pid+seq", () => {
    const events: MonitorEvent[] = [
      makeStart(1, "docker build .", ts(0)),
      makeEnd(1, 0, ts(0, 30)),
      makeStart(2, "docker run app", ts(1)),
      makeEnd(2, 1, ts(1, 5)),
    ];

    const records = pairCommands(events);
    expect(records).toHaveLength(2);
    expect(records[0].command).toBe("docker build .");
    expect(records[0].exitCode).toBe(0);
    expect(records[0].durationMs).toBe(30000);
    expect(records[1].command).toBe("docker run app");
    expect(records[1].exitCode).toBe(1);
  });

  it("handles unpaired start events", () => {
    const events: MonitorEvent[] = [
      makeStart(1, "long-running-cmd", ts(0)),
    ];

    const records = pairCommands(events);
    expect(records).toHaveLength(1);
    expect(records[0].endedAt).toBeNull();
    expect(records[0].durationMs).toBeNull();
    expect(records[0].exitCode).toBeNull();
  });

  it("distinguishes events from different PIDs", () => {
    const events: MonitorEvent[] = [
      makeStart(1, "cmd-a", ts(0), 100),
      makeStart(1, "cmd-b", ts(0), 200),
      makeEnd(1, 0, ts(0, 5), 100),
      makeEnd(1, 1, ts(0, 5), 200),
    ];

    const records = pairCommands(events);
    expect(records).toHaveLength(2);
    const cmdA = records.find((r) => r.command === "cmd-a")!;
    const cmdB = records.find((r) => r.command === "cmd-b")!;
    expect(cmdA.exitCode).toBe(0);
    expect(cmdB.exitCode).toBe(1);
  });

  it("sorts by start time", () => {
    const events: MonitorEvent[] = [
      makeStart(2, "second", ts(1)),
      makeStart(1, "first", ts(0)),
      makeEnd(1, 0, ts(0, 5)),
      makeEnd(2, 0, ts(1, 5)),
    ];

    const records = pairCommands(events);
    expect(records[0].command).toBe("first");
    expect(records[1].command).toBe("second");
  });

  it("skips meta events", () => {
    const events: MonitorEvent[] = [
      { type: "monitor_meta", ts: ts(0), event: "start", session_id: "s1" },
      makeStart(1, "ls", ts(0, 1)),
      makeEnd(1, 0, ts(0, 2)),
      { type: "monitor_meta", ts: ts(5), event: "stop", session_id: "s1" },
    ];

    const records = pairCommands(events);
    expect(records).toHaveLength(1);
    expect(records[0].command).toBe("ls");
  });
});

// ── analyzeObservation ──────────────────────────────────────────────────────

describe("analyzeObservation", () => {
  const dockerPatterns: TokenPattern[] = [
    { slug: "docker-build", patterns: ["docker build", "docker image build"] },
  ];

  it("returns null rating when no commands match", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "ls", cwd: "/", startedAt: ts(0), endedAt: ts(0, 1), durationMs: 1000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.ratings).toHaveLength(1);
    expect(result.ratings[0].rating).toBeNull();
    expect(result.ratings[0].confidence).toBe("low");
  });

  it("rates 4 for clean, fast execution with no errors", () => {
    // Each command needs a unique 2-word prefix to avoid self-correction signal
    const widePatterns: TokenPattern[] = [
      { slug: "docker-build", patterns: ["docker build", "docker image build", "docker buildx build"] },
    ];
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build -t app .", cwd: "/project", startedAt: ts(0), endedAt: ts(0, 5), durationMs: 5000, exitCode: 0 },
      { seq: 2, pid: 1, command: "docker image build -t app:v2 .", cwd: "/project", startedAt: ts(0, 8), endedAt: ts(0, 12), durationMs: 4000, exitCode: 0 },
      { seq: 3, pid: 1, command: "docker buildx build --no-cache .", cwd: "/project", startedAt: ts(0, 15), endedAt: ts(0, 25), durationMs: 10000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, widePatterns);
    expect(result.ratings[0].rating).toBe(4);
    expect(result.ratings[0].confidence).toBe("high");
    expect(result.ratings[0].evidence.matchedCommands).toBe(3);
    expect(result.ratings[0].evidence.errorCount).toBe(0);
    expect(result.ratings[0].evidence.helpSeeking).toBe(false);
  });

  it("rates lower when help-seeking detected", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build --help", cwd: "/", startedAt: ts(0), endedAt: ts(0, 1), durationMs: 1000, exitCode: 0 },
      { seq: 2, pid: 1, command: "docker build -t app .", cwd: "/project", startedAt: ts(0, 15), endedAt: ts(0, 20), durationMs: 5000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.ratings[0].evidence.helpSeeking).toBe(true);
    expect(result.ratings[0].rating).toBeLessThanOrEqual(3);
  });

  it("rates lower with errors", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build .", cwd: "/project", startedAt: ts(0), endedAt: ts(0, 2), durationMs: 2000, exitCode: 1 },
      { seq: 2, pid: 1, command: "docker build -f Dockerfile .", cwd: "/project", startedAt: ts(0, 10), endedAt: ts(0, 12), durationMs: 2000, exitCode: 1 },
      { seq: 3, pid: 1, command: "docker build -f Dockerfile.dev .", cwd: "/project", startedAt: ts(0, 20), endedAt: ts(0, 25), durationMs: 5000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.ratings[0].evidence.errorCount).toBe(2);
    expect(result.ratings[0].rating).toBeLessThanOrEqual(2);
  });

  it("rates 1 for extensive errors + help-seeking + slow", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "man docker", cwd: "/", startedAt: ts(0), endedAt: ts(0, 30), durationMs: 30000, exitCode: 0 },
      { seq: 2, pid: 1, command: "docker build .", cwd: "/project", startedAt: ts(0, 45), endedAt: ts(0, 50), durationMs: 5000, exitCode: 1 },
      { seq: 3, pid: 1, command: "docker build --help", cwd: "/", startedAt: ts(1), endedAt: ts(1, 2), durationMs: 2000, exitCode: 0 },
      { seq: 4, pid: 1, command: "docker build -t x .", cwd: "/project", startedAt: ts(2), endedAt: ts(2, 3), durationMs: 3000, exitCode: 1 },
      { seq: 5, pid: 1, command: "docker build -t x .", cwd: "/project", startedAt: ts(3), endedAt: ts(3, 5), durationMs: 5000, exitCode: 1 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.ratings[0].evidence.helpSeeking).toBe(true);
    expect(result.ratings[0].evidence.errorCount).toBeGreaterThanOrEqual(3);
    expect(result.ratings[0].rating).toBe(1);
  });

  it("tracks unmatched commands", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "cd /project", cwd: "/", startedAt: ts(0), endedAt: ts(0, 1), durationMs: 1000, exitCode: 0 },
      { seq: 2, pid: 1, command: "docker build .", cwd: "/project", startedAt: ts(0, 2), endedAt: ts(0, 5), durationMs: 3000, exitCode: 0 },
      { seq: 3, pid: 1, command: "git status", cwd: "/project", startedAt: ts(0, 6), endedAt: ts(0, 7), durationMs: 1000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.unmatchedCommands).toContain("cd /project");
    expect(result.unmatchedCommands).toContain("git status");
    expect(result.unmatchedCommands).not.toContain("docker build .");
  });

  it("computes time span", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build .", cwd: "/", startedAt: ts(0), endedAt: ts(0, 30), durationMs: 30000, exitCode: 0 },
      { seq: 2, pid: 1, command: "docker build -t app .", cwd: "/", startedAt: ts(1), endedAt: ts(2), durationMs: 60000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.timeSpan).not.toBeNull();
    expect(result.timeSpan!.durationMs).toBe(120000); // 2 minutes
  });

  it("handles multiple token patterns", () => {
    const patterns: TokenPattern[] = [
      { slug: "docker-build", patterns: ["docker build"] },
      { slug: "git-commit", patterns: ["git commit"] },
    ];

    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build .", cwd: "/", startedAt: ts(0), endedAt: ts(0, 5), durationMs: 5000, exitCode: 0 },
      { seq: 2, pid: 1, command: "git commit -m 'init'", cwd: "/", startedAt: ts(0, 10), endedAt: ts(0, 11), durationMs: 1000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, patterns);
    expect(result.ratings).toHaveLength(2);
    expect(result.ratings[0].tokenSlug).toBe("docker-build");
    expect(result.ratings[1].tokenSlug).toBe("git-commit");
  });

  it("detects self-corrections (same prefix, different args)", () => {
    const commands: CommandRecord[] = [
      { seq: 1, pid: 1, command: "docker build -t wrong .", cwd: "/", startedAt: ts(0), endedAt: ts(0, 5), durationMs: 5000, exitCode: 1 },
      { seq: 2, pid: 1, command: "docker build -t correct .", cwd: "/", startedAt: ts(0, 10), endedAt: ts(0, 15), durationMs: 5000, exitCode: 0 },
    ];

    const result = analyzeObservation(commands, dockerPatterns);
    expect(result.ratings[0].evidence.selfCorrections).toBeGreaterThanOrEqual(1);
  });

  it("returns empty results for empty command list", () => {
    const result = analyzeObservation([], dockerPatterns);
    expect(result.ratings).toHaveLength(1);
    expect(result.ratings[0].rating).toBeNull();
    expect(result.unmatchedCommands).toEqual([]);
    expect(result.timeSpan).toBeNull();
  });
});
