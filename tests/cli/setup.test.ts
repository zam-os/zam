import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  activateMachineProviderConfig,
  formatDatabaseInitTarget,
  parseSetupAgents,
  writeAgentsMd,
  wireSkills,
  writeCopilotInstructions,
} from "../../src/cli/commands/setup.js";
import {
  getSetting,
  openDatabase,
  saveInstallConfig,
} from "../../src/kernel/index.js";

describe("setup command helpers", () => {
  it("links ZAM skills for Claude/Copilot, shared agents, and Codex", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-setup-skills-"));

    try {
      const first = wireSkills(cwd);

      const destinations = [
        join(cwd, ".claude", "skills", "zam", "SKILL.md"),
        join(cwd, ".agent", "skills", "zam", "SKILL.md"),
        join(cwd, ".agents", "skills", "zam", "SKILL.md"),
      ];

      for (const destination of destinations) {
        expect(existsSync(destination)).toBe(true);
        expect(lstatSync(dirname(destination)).isSymbolicLink()).toBe(true);
      }
      expect(first.map((result) => result.action)).toEqual([
        "linked",
        "linked",
        "linked",
      ]);
      expect(readFileSync(destinations[2], "utf8")).toContain("$zam");
      expect(realpathSync(dirname(destinations[2]))).toBe(
        realpathSync(join(process.cwd(), ".agents", "skills", "zam")),
      );

      const second = wireSkills(cwd, parseSetupAgents(), { quiet: true });
      expect(second.every((result) => result.reason === "already-linked")).toBe(
        true,
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("never replaces the package skill source with a self-link", () => {
    const [result] = wireSkills(
      process.cwd(),
      parseSetupAgents("codex"),
      { quiet: true },
    );

    expect(result).toMatchObject({
      action: "skipped",
      reason: "source-directory",
    });
    expect(
      lstatSync(join(process.cwd(), ".agents", "skills", "zam")).isSymbolicLink(),
    ).toBe(false);
  });

  it("migrates an old copied ZAM skill into a live link", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-setup-migrate-"));
    const destinationDir = join(cwd, ".agents", "skills", "zam");

    try {
      mkdirSync(destinationDir, { recursive: true });
      writeFileSync(
        join(destinationDir, "SKILL.md"),
        readFileSync(
          join(process.cwd(), ".agents", "skills", "zam", "SKILL.md"),
          "utf8",
        ),
        "utf8",
      );

      const [result] = wireSkills(cwd, parseSetupAgents("codex"), {
        quiet: true,
      });

      expect(result.action).toBe("relinked");
      expect(lstatSync(destinationDir).isSymbolicLink()).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("preserves an unmanaged skill directory unless force is explicit", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-setup-unmanaged-"));
    const destinationDir = join(cwd, ".agents", "skills", "zam");

    try {
      mkdirSync(destinationDir, { recursive: true });
      writeFileSync(
        join(destinationDir, "SKILL.md"),
        "---\nname: custom-zam\n---\n",
        "utf8",
      );
      writeFileSync(join(destinationDir, "notes.md"), "keep", "utf8");

      const [result] = wireSkills(cwd, parseSetupAgents("codex"), {
        quiet: true,
      });

      expect(result).toMatchObject({
        action: "skipped",
        reason: "unmanaged-destination",
      });
      expect(lstatSync(destinationDir).isSymbolicLink()).toBe(false);
      expect(readFileSync(join(destinationDir, "notes.md"), "utf8")).toBe(
        "keep",
      );
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

  it("parses targeted agent setup selections", () => {
    expect([...parseSetupAgents("copilot,claude")].sort()).toEqual([
      "claude",
      "copilot",
    ]);
    expect(parseSetupAgents("all").has("agent")).toBe(true);
  });

  it("maps Copilot setup to the project skill manifest path Copilot loads", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-copilot-skills-"));

    try {
      wireSkills(cwd, parseSetupAgents("copilot"));

      expect(
        existsSync(join(cwd, ".claude", "skills", "zam", "SKILL.md")),
      ).toBe(true);
      expect(
        existsSync(join(cwd, ".agents", "skills", "zam", "SKILL.md")),
      ).toBe(false);
      expect(
        existsSync(join(cwd, ".agent", "skills", "zam", "SKILL.md")),
      ).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("updates existing instruction files with a marked ZAM block", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-existing-instructions-"));

    try {
      const agentsPath = join(cwd, "AGENTS.md");
      writeFileSync(agentsPath, "# Existing instructions\n", "utf8");

      writeAgentsMd(false, cwd, { updateExisting: true });

      const content = readFileSync(agentsPath, "utf8");
      expect(content).toContain("# Existing instructions");
      expect(content).toContain("<!-- ZAM:START -->");
      expect(content).toContain(".agents/skills/zam/");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("writes Copilot instructions non-destructively", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-copilot-instructions-"));

    try {
      writeCopilotInstructions(cwd);

      const content = readFileSync(
        join(cwd, ".github", "copilot-instructions.md"),
        "utf8",
      );
      expect(content).toContain("<!-- ZAM:START -->");
      expect(content).toContain(".claude/skills/zam/");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("formats local database initialization clearly", () => {
    expect(
      formatDatabaseInitTarget({
        kind: "local",
        provider: "local",
        location: "C:\\Users\\example\\.zam\\zam.db",
      }),
    ).toBe(
      "ZAM database at C:\\Users\\example\\.zam\\zam.db (local SQLite)",
    );
  });

  it("formats Turso remote database initialization without implying local state", () => {
    expect(
      formatDatabaseInitTarget({
        kind: "turso-remote",
        provider: "remote",
        location: "libsql://zam-example.turso.io",
      }),
    ).toBe(
      "ZAM database via Turso remote at libsql://zam-example.turso.io",
    );
  });

  it("activates legacy machine-local provider config without moving it into shared settings", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "zam-setup-ai-config-"));
    const previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(configDir, "config.json");
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });

    try {
      saveInstallConfig({
        ai: {
          providers: {
            deepseek: {
              url: "https://api.deepseek.com/v1",
              model: "deepseek-v4-flash",
              apiFlavor: "chat-completions",
              apiKeyRef: "deepseek",
            },
          },
          roles: { recall: { primary: "deepseek" } },
        },
      });

      await activateMachineProviderConfig(db);

      expect(await getSetting(db, "llm.enabled")).toBe("true");
      expect(await getSetting(db, "llm.providers")).toBeUndefined();
      expect(await getSetting(db, "llm.roles")).toBeUndefined();
    } finally {
      await db.close();
      if (previousConfigPath === undefined) {
        delete process.env.ZAM_CONFIG_PATH;
      } else {
        process.env.ZAM_CONFIG_PATH = previousConfigPath;
      }
      rmSync(configDir, { recursive: true, force: true });
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

  it("ships Codex-specific UI observation and Windows execution guidance", () => {
    const content = readFileSync(
      join(process.cwd(), ".agents", "skills", "zam", "SKILL.md"),
      "utf8",
    );

    expect(content).toContain("Codex Execution Notes");
    expect(content).toContain("WindowsPowerShell");
    expect(content).toContain("zam bridge add-token --user <username>");
    expect(content).toContain("zam bridge capture-ui");
    expect(content).toContain("vision-capable subagent");
  });
});
