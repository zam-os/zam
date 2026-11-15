import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { classifySkillDestination } from "../../src/cli/provisioning/index.js";
import {
  distributeGlobalSkills,
  getPackageSkillPath,
} from "../../src/kernel/index.js";

const root = process.cwd();
const COPIES = [
  join("skills", "zam-work", "SKILL.md"),
  join(".claude", "skills", "zam-work", "SKILL.md"),
  join(".agent", "skills", "zam-work", "SKILL.md"),
  join(".agents", "skills", "zam-work", "SKILL.md"),
];
const MAIN_COPIES = COPIES.map((copy) => copy.replace("zam-work", "zam"));

const read = (path: string) => readFileSync(join(root, path), "utf8");

/** Front matter and body of a skill file. */
function split(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("no front matter");
  return { frontmatter: match[1], body: match[2] };
}

describe("the zam-work skill (ADR 2026-11-15)", () => {
  it("has the same body in all four copies", () => {
    const bodies = COPIES.map((copy) => split(read(copy)).body);
    for (const body of bodies) expect(body).toBe(bodies[0]);
  });

  it("names itself zam-work, and the portable copy keeps the standard keys", () => {
    for (const copy of COPIES) {
      expect(split(read(copy)).frontmatter).toMatch(/^name: zam-work$/m);
    }
    const portable = split(read(COPIES[0])).frontmatter;
    expect(portable).toContain("license: Apache-2.0");
    expect(portable).not.toContain("user-invocable:");
  });

  it("stays short, names the three tools and never tells the agent to pass a tokenId", () => {
    const content = read(COPIES[0]);
    expect(content.split("\n").length).toBeLessThanOrEqual(80);
    for (const tool of [
      "zam_work_plan",
      "zam_work_hand_over",
      "zam_work_close",
    ]) {
      expect(content).toContain(tool);
    }
    // The record at the end goes by card id only (Decision 8): a review for
    // a token id would enrol the learner.
    expect(content).not.toMatch(/\btokenId\b/);
    expect(content).toContain("cardId");
    expect(content).toContain("Never ask whether they did it themselves");
  });

  it("is what the main skill's menu points to, in every copy", () => {
    for (const copy of MAIN_COPIES) {
      const content = read(copy);
      expect(content).toContain("load the `zam-work` skill");
      expect(content).not.toContain(
        "alternate useful agent assistance with concrete steps",
      );
    }
  });

  it("ships in the npm package", () => {
    const files = JSON.parse(read("package.json")).files as string[];
    for (const folder of [
      "skills",
      ".claude/skills",
      ".agent/skills",
      ".agents/skills",
    ]) {
      expect(files).toContain(`${folder}/zam-work/`);
    }
  });

  it("is found as a package skill for every harness", () => {
    for (const agent of ["default", "claude", "codex"] as const) {
      const path = getPackageSkillPath(agent, "zam-work");
      expect(path, agent).toContain(join("skills", "zam-work", "SKILL.md"));
    }
    expect(getPackageSkillPath()).toContain(join("skills", "zam", "SKILL.md"));
  });

  it("is distributed globally beside the main skill", () => {
    const home = mkdtempSync(join(tmpdir(), "zam-work-global-"));
    try {
      const results = distributeGlobalSkills(home);
      expect(results).toHaveLength(8);
      expect(results.every((result) => result.success)).toBe(true);
      for (const dir of [".claude", ".gemini", ".agents", ".goose"]) {
        const path = join(home, dir, "skills", "zam-work", "SKILL.md");
        expect(existsSync(path), dir).toBe(true);
        expect(readFileSync(path, "utf8")).toMatch(/^name: zam-work$/m);
      }
      expect(results.map((result) => result.name)).toContain(
        "Codex Global (zam-work)",
      );
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it("treats an old copy of one skill as stale only in its own folder", () => {
    const source = join(root, ".claude", "skills", "zam-work");
    const workspace = mkdtempSync(join(tmpdir(), "zam-work-classify-"));
    try {
      const own = join(workspace, "own");
      const other = join(workspace, "other");
      for (const [dir, name] of [
        [own, "zam-work"],
        [other, "zam"],
      ] as const) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\n---\n`);
      }
      expect(classifySkillDestination(source, own)).toBe("stale-copy");
      expect(classifySkillDestination(source, other)).toBe("unmanaged");
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
});
