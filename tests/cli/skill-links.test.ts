import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifySkillDestination,
  inspectSkillLinks,
  parseSetupAgents,
  type SkillLinkInspection,
  summarizeSkillLinkHealth,
  wireSkills,
} from "../../src/cli/provisioning/index.js";

const codex = () => parseSetupAgents("codex");

function codexSkillDir(cwd: string): string {
  return join(cwd, ".agents", "skills", "zam");
}

function packagedSkillBody(): string {
  return readFileSync(
    join(process.cwd(), ".agents", "skills", "zam", "SKILL.md"),
    "utf8",
  );
}

function withTempWorkspace(run: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), "zam-skill-links-"));
  try {
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

describe("skill link inspection", () => {
  it("reports missing before wiring and linked after", () => {
    withTempWorkspace((cwd) => {
      const [before] = inspectSkillLinks(cwd, codex());
      expect(before.state).toBe("missing");

      wireSkills(cwd, codex(), { quiet: true });

      const [after] = inspectSkillLinks(cwd, codex());
      expect(after.state).toBe("linked");
    });
  });

  it("classifies a dangling junction as broken and heals it without force", () => {
    withTempWorkspace((cwd) => {
      const destination = codexSkillDir(cwd);
      mkdirSync(join(cwd, ".agents", "skills"), { recursive: true });
      symlinkSync(join(cwd, "missing-target"), destination, "dir");

      expect(classifySkillDestination(packageSource(), destination)).toBe(
        "broken",
      );

      const [result] = wireSkills(cwd, codex(), { quiet: true });
      expect(result.action).toBe("relinked");
      expect(inspectSkillLinks(cwd, codex())[0].state).toBe("linked");
      expect(lstatSync(destination).isSymbolicLink()).toBe(true);
    });
  });

  it("treats a multi-file ZAM copy as a stale copy and relinks it without force", () => {
    withTempWorkspace((cwd) => {
      const destination = codexSkillDir(cwd);
      mkdirSync(destination, { recursive: true });
      writeFileSync(join(destination, "SKILL.md"), packagedSkillBody(), "utf8");
      writeFileSync(join(destination, "OLD-EXTRA.md"), "outdated", "utf8");

      const [inspected] = inspectSkillLinks(cwd, codex());
      expect(inspected.state).toBe("stale-copy");

      const [result] = wireSkills(cwd, codex(), { quiet: true });
      expect(result.action).toBe("relinked");
      expect(lstatSync(destination).isSymbolicLink()).toBe(true);
    });
  });

  it("repairs a foreign skill directory only when force is explicit", () => {
    withTempWorkspace((cwd) => {
      const destination = codexSkillDir(cwd);
      mkdirSync(destination, { recursive: true });
      writeFileSync(
        join(destination, "SKILL.md"),
        "---\nname: custom-zam\n---\n",
        "utf8",
      );
      writeFileSync(join(destination, "notes.md"), "keep", "utf8");

      expect(inspectSkillLinks(cwd, codex())[0].state).toBe("unmanaged");

      const [skipped] = wireSkills(cwd, codex(), { quiet: true });
      expect(skipped).toMatchObject({
        action: "skipped",
        reason: "unmanaged-destination",
      });
      expect(readFileSync(join(destination, "notes.md"), "utf8")).toBe("keep");

      const [forced] = wireSkills(cwd, codex(), { quiet: true, force: true });
      expect(forced.action).toBe("relinked");
      expect(lstatSync(destination).isSymbolicLink()).toBe(true);
    });
  });
});

describe("skill link health summary", () => {
  it("maps a clean workspace to healthy", () => {
    withTempWorkspace((cwd) => {
      wireSkills(cwd, codex(), { quiet: true });
      expect(summarizeSkillLinkHealth(inspectSkillLinks(cwd, codex()))).toBe(
        "healthy",
      );
    });
  });

  it("escalates unmanaged over a merely broken link", () => {
    const inspections: SkillLinkInspection[] = [
      { agents: ["claude"], source: "s", destination: "a", state: "broken" },
      { agents: ["codex"], source: "s", destination: "b", state: "unmanaged" },
    ];
    expect(summarizeSkillLinkHealth(inspections)).toBe("unmanaged");
  });

  it("reports needs-repair when only broken or missing links remain", () => {
    const inspections: SkillLinkInspection[] = [
      { agents: ["claude"], source: "s", destination: "a", state: "linked" },
      { agents: ["codex"], source: "s", destination: "b", state: "missing" },
    ];
    expect(summarizeSkillLinkHealth(inspections)).toBe("needs-repair");
  });
});

function packageSource(): string {
  return join(process.cwd(), ".agents", "skills", "zam");
}
