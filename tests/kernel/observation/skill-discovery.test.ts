import { describe, it, expect } from "vitest";
import { discoverSkills } from "../../../src/kernel/observation/skill-discovery.js";
import type { CommandRecord } from "../../../src/kernel/observation/analyzer.js";

function makeCommand(command: string, seq: number): CommandRecord {
  return {
    seq,
    pid: 1000,
    command,
    cwd: "/home/user",
    startedAt: new Date(2026, 2, 28, 10, 0, seq).toISOString(),
    endedAt: new Date(2026, 2, 28, 10, 0, seq + 1).toISOString(),
    durationMs: 1000,
    exitCode: 0,
  };
}

describe("discoverSkills", () => {
  it("discovers a pattern that appears in multiple sessions", () => {
    const pattern = [
      makeCommand("git checkout -b feat/new", 1),
      makeCommand("npm install", 2),
      makeCommand("npm run build", 3),
    ];

    const sessions = new Map<string, CommandRecord[]>();
    sessions.set("session-1", [...pattern]);
    sessions.set("session-2", [...pattern]);
    sessions.set("session-3", [...pattern]);

    const proposals = discoverSkills(sessions, { minSessions: 2 });

    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals[0].steps).toContain("git checkout");
    expect(proposals[0].sessionCount).toBeGreaterThanOrEqual(2);
  });

  it("returns no proposals when pattern appears in only one session", () => {
    const sessions = new Map<string, CommandRecord[]>();
    sessions.set("session-1", [
      makeCommand("git checkout -b feat/new", 1),
      makeCommand("npm install", 2),
      makeCommand("npm run build", 3),
    ]);
    sessions.set("session-2", [
      makeCommand("docker compose up", 1),
      makeCommand("curl localhost:3000", 2),
    ]);

    const proposals = discoverSkills(sessions, { minSessions: 2 });

    // The git checkout → npm install → npm run build sequence only appears in session-1
    const gitPattern = proposals.find((p) => p.steps.includes("git checkout"));
    expect(gitPattern).toBeUndefined();
  });

  it("excludes existing skills", () => {
    const pattern = [
      makeCommand("git checkout -b feat/new", 1),
      makeCommand("npm install", 2),
    ];

    const sessions = new Map<string, CommandRecord[]>();
    sessions.set("session-1", [...pattern]);
    sessions.set("session-2", [...pattern]);

    const proposals = discoverSkills(sessions, {
      minSessions: 2,
      existingSkillSlugs: ["checkout-install"],
    });

    const matching = proposals.find((p) => p.slug === "checkout-install");
    expect(matching).toBeUndefined();
  });

  it("filters out trivial commands (cd, ls, pwd)", () => {
    const sessions = new Map<string, CommandRecord[]>();

    // Sessions with only trivial commands between real ones
    for (const id of ["s1", "s2", "s3"]) {
      sessions.set(id, [
        makeCommand("cd /project", 1),
        makeCommand("ls", 2),
        makeCommand("git status", 3),
        makeCommand("pwd", 4),
        makeCommand("git add .", 5),
      ]);
    }

    const proposals = discoverSkills(sessions, { minSessions: 2 });

    // Should find git status → git add pattern but not cd/ls/pwd
    for (const p of proposals) {
      expect(p.steps).not.toContain("cd /project");
      expect(p.steps).not.toContain("ls");
      expect(p.steps).not.toContain("pwd");
    }
  });

  it("returns empty array when no sessions provided", () => {
    const proposals = discoverSkills(new Map());
    expect(proposals).toEqual([]);
  });

  it("assigns higher confidence to patterns seen in more sessions", () => {
    const pattern = [
      makeCommand("git add .", 1),
      makeCommand("git commit -m 'test'", 2),
    ];

    const sessions = new Map<string, CommandRecord[]>();
    for (let i = 0; i < 5; i++) {
      sessions.set(`session-${i}`, [...pattern]);
    }

    const proposals = discoverSkills(sessions, { minSessions: 2 });
    const addCommit = proposals.find((p) =>
      p.steps.includes("git add") && p.steps.includes("git commit"),
    );

    expect(addCommit).toBeDefined();
    expect(addCommit!.confidence).toBe("high");
  });
});
