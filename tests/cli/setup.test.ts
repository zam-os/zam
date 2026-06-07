import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  copySkills,
  writeAgentsMd,
} from "../../src/cli/commands/setup.js";

describe("setup command helpers", () => {
  it("copies ZAM skills for Claude, shared agents, and Codex", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-setup-skills-"));

    try {
      copySkills(false, cwd);

      const destinations = [
        join(cwd, ".claude", "skills", "zam", "SKILL.md"),
        join(cwd, ".agent", "skills", "zam", "SKILL.md"),
        join(cwd, ".agents", "skills", "zam", "SKILL.md"),
      ];

      for (const destination of destinations) {
        expect(existsSync(destination)).toBe(true);
      }
      expect(readFileSync(destinations[2], "utf8")).toContain("$zam");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("generates Codex repository instructions", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-agents-md-"));

    try {
      writeAgentsMd(false, cwd);

      const content = readFileSync(join(cwd, "AGENTS.md"), "utf8");
      expect(content).toContain("$setup");
      expect(content).toContain("$zam");
      expect(content).toContain(".agents/skills/");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("ships valid frontmatter for every packaged ZAM skill", () => {
    for (const directory of [".claude", ".agent", ".agents"]) {
      const content = readFileSync(
        join(process.cwd(), directory, "skills", "zam", "SKILL.md"),
        "utf8",
      );
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

      expect(frontmatter, `${directory} frontmatter`).not.toBeNull();
      expect(frontmatter?.[1]).toMatch(/^name:\s+\S+/m);
      expect(frontmatter?.[1]).toMatch(/^description:\s+.+/m);
    }
  });
});
