import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureWorkspaceStructure,
  inspectWorkspaceStructure,
} from "../../src/cli/provisioning/index.js";

describe("workspace structure provisioning (ADR 2026-07-24 §4)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-workspace-structure-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates the full fresh-setup structure in an empty directory", () => {
    const report = ensureWorkspaceStructure(dir);
    expect(report.created.map((p) => p.replaceAll("\\", "/")).sort()).toEqual([
      "beliefs",
      "beliefs/worldview.md",
      "goals",
      "goals/goals.md",
      "skills",
    ]);
    expect(report.preserved).toEqual([]);
    expect(existsSync(join(dir, "skills"))).toBe(true);
    expect(readFileSync(join(dir, "beliefs", "worldview.md"), "utf8")).toContain(
      "Personal Worldview",
    );
    expect(inspectWorkspaceStructure(dir).complete).toBe(true);
  });

  it("is idempotent: a second run creates nothing", () => {
    ensureWorkspaceStructure(dir);
    const again = ensureWorkspaceStructure(dir);
    expect(again.created).toEqual([]);
    expect(again.preserved.length).toBe(2);
  });

  it("never overwrites a user-edited seed file (additive proof)", () => {
    ensureWorkspaceStructure(dir);
    const goalsFile = join(dir, "goals", "goals.md");
    const userContent = "# My own goals\n\n- master the Abitur\n";
    writeFileSync(goalsFile, userContent, "utf8");

    const report = ensureWorkspaceStructure(dir);
    expect(readFileSync(goalsFile, "utf8")).toBe(userContent);
    expect(report.preserved.map((p) => p.replaceAll("\\", "/"))).toContain(
      "goals/goals.md",
    );
  });

  it("completes a partially-present structure without touching the rest", () => {
    ensureWorkspaceStructure(dir);
    rmSync(join(dir, "beliefs"), { recursive: true, force: true });
    const goalsFile = join(dir, "goals", "goals.md");
    writeFileSync(goalsFile, "user data", "utf8");

    const status = inspectWorkspaceStructure(dir);
    expect(status.complete).toBe(false);
    expect(status.missing.map((p) => p.replaceAll("\\", "/")).sort()).toEqual([
      "beliefs",
      "beliefs/worldview.md",
    ]);

    ensureWorkspaceStructure(dir);
    expect(existsSync(join(dir, "beliefs", "worldview.md"))).toBe(true);
    expect(readFileSync(goalsFile, "utf8")).toBe("user data");
    expect(inspectWorkspaceStructure(dir).complete).toBe(true);
  });

  it("reports a missing directory honestly", () => {
    const gone = join(dir, "vanished");
    const status = inspectWorkspaceStructure(gone);
    expect(status.dirExists).toBe(false);
    expect(status.complete).toBe(false);
    expect(status.missing.length).toBeGreaterThan(0);
  });
});
