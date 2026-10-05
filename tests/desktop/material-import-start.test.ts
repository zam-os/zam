import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentLocale } from "../../desktop/src/i18n.js";
import {
  connectedHarnesses,
  harnessNames,
  harnessRequestText,
} from "../../desktop/src/material-import-start.js";

/** ADR 2026-10-05 Decision 2: the Studio hands the material to a harness. */

afterEach(() => setCurrentLocale("en"));

describe("material import start", () => {
  it("offers only harnesses that carry ZAM's MCP entry", () => {
    expect(connectedHarnesses(null)).toEqual([]);
    expect(
      connectedHarnesses({
        success: true,
        zamOnPath: true,
        harnesses: [
          {
            harness: "opencode",
            label: "OpenCode",
            installed: true,
            configured: true,
            configPath: "~/.config/opencode/opencode.json",
          },
          {
            harness: "codex",
            label: "Codex",
            installed: true,
            configured: false,
            configPath: "~/.codex/config.toml",
          },
        ],
      }),
    ).toEqual(["OpenCode"]);
    expect(harnessNames(["OpenCode", "Claude Code"])).toBe(
      "OpenCode / Claude Code",
    );
  });

  it("names the picked files so a terminal agent can open them", () => {
    setCurrentLocale("de");
    expect(harnessRequestText(["/Users/learner/Desktop/IMG_1234.jpg"])).toBe(
      "Lies /Users/learner/Desktop/IMG_1234.jpg und mach daraus Lernkarten für ZAM. Frag mich, wenn du etwas nicht lesen kannst.",
    );
    expect(harnessRequestText([])).toContain("Ich gebe dir ein Foto oder PDF");
    setCurrentLocale("en");
    expect(harnessRequestText(["/a.pdf", "/b.jpg"])).toBe(
      "Read /a.pdf, /b.jpg and turn it into learning cards for ZAM. Ask me about anything you cannot read.",
    );
  });

  it("is wired into the Studio with a picker and the way to agent setup", () => {
    const root = process.cwd();
    const html = readFileSync(join(root, "desktop", "index.html"), "utf8");
    const studio = readFileSync(
      join(root, "desktop", "src", "learning-content.ts"),
      "utf8",
    );
    const main = readFileSync(join(root, "desktop", "src", "main.ts"), "utf8");
    expect(html).toContain('id="btn-content-material-import"');
    expect(studio).toContain("initMaterialImportStart();");
    expect(main).toContain("setMaterialImportHost({");
    expect(main).toContain('"heic"');
    expect(main).toContain('"pdf"');
    expect(main).toContain('getElementById("settings-agents-card")');
  });
});
