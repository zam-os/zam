import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentLocale } from "../../desktop/src/i18n.js";
import {
  analyzeArgs,
  analyzeRefusalKey,
  builtInState,
  connectedHarnesses,
  harnessNames,
  harnessRequestText,
  materialFileKind,
} from "../../desktop/src/material-import-start.js";
import type { MaterialImportModelsResponse } from "../../src/bridge/protocol.js";

function models(
  over: Partial<MaterialImportModelsResponse> = {},
): MaterialImportModelsResponse {
  return {
    success: true,
    image: { label: "Luna", model: "openai/gpt-6-luna" },
    file: null,
    convertsHeic: true,
    ...over,
  };
}

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
    expect(
      harnessRequestText(["/Users/learner/Desktop/Chemie, Seite 1.jpg"]),
    ).toBe(
      'Lies "/Users/learner/Desktop/Chemie, Seite 1.jpg" und mach daraus Lernkarten für ZAM. Frag mich, wenn du etwas nicht lesen kannst.',
    );
    expect(harnessRequestText([])).toContain("Ich gebe dir ein Foto oder PDF");
    setCurrentLocale("en");
    expect(harnessRequestText(["/a b.pdf", "/c.jpg"])).toBe(
      'Read these files and turn them into learning cards for ZAM. Ask me about anything you cannot read.\n"/a b.pdf"\n"/c.jpg"',
    );
  });

  it("reads photos with the image model and a PDF only with a file model", () => {
    expect(builtInState([], null)).toEqual({ kind: "hidden" });
    expect(builtInState([], models())).toEqual({
      kind: "waiting",
      model: "Luna",
    });
    expect(builtInState(["/a.jpg", "/b.HEIC"], models())).toEqual({
      kind: "ready",
      model: "Luna",
      pdf: false,
    });
    expect(builtInState(["/blatt.pdf"], models())).toEqual({
      kind: "blocked",
      key: "material_builtin_no_file_model",
      setup: false,
    });
    expect(
      builtInState(
        ["/blatt.pdf"],
        models({ file: { label: "Reader", model: "x" } }),
      ),
    ).toEqual({ kind: "ready", model: "Reader", pdf: true });
    expect(builtInState(["/a.jpg"], models({ image: null }))).toEqual({
      kind: "blocked",
      key: "material_builtin_no_image_model",
      setup: true,
    });
    expect(
      builtInState(["/a.heic"], models({ convertsHeic: false })),
    ).toMatchObject({ key: "material_builtin_heic" });
    expect(builtInState(["/a.jpg", "/b.pdf"], models())).toMatchObject({
      key: "material_builtin_mixed",
    });
    expect(
      builtInState(
        Array.from({ length: 11 }, (_, i) => `/${i}.png`),
        models(),
      ),
    ).toMatchObject({ key: "material_builtin_too_many" });
    expect(materialFileKind("/x/Notes.final.PDF")).toBe("pdf");
    expect(materialFileKind("/x/notes.docx")).toBe("other");
  });

  it("passes pages only when given, and names every refusal", () => {
    expect(analyzeArgs(["/a b.pdf"], " 2-4 ")).toEqual([
      "--file",
      "/a b.pdf",
      "--pages",
      "2-4",
    ]);
    expect(analyzeArgs(["/a.jpg", "/b.jpg"], "")).toEqual([
      "--file",
      "/a.jpg",
      "/b.jpg",
    ]);
    expect(analyzeRefusalKey("no-file-model")).toBe(
      "material_builtin_no_file_model",
    );
    expect(analyzeRefusalKey("invalid-answer")).toBe(
      "material_builtin_invalid",
    );
    expect(analyzeRefusalKey("model-failed")).toBe("material_builtin_failed");
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
    expect(studio).toContain("initMaterialImportStart(materialReview);");
    expect(main).toContain("setMaterialImportHost({");
    expect(main).toContain('"heic"');
    expect(main).toContain('"pdf"');
    expect(main).toContain('getElementById("settings-agents-card")');
  });

  it("reads files beside the persistent bridge and retires the OCR scan", () => {
    const root = process.cwd();
    const html = readFileSync(join(root, "desktop", "index.html"), "utf8");
    const main = readFileSync(join(root, "desktop", "src", "main.ts"), "utf8");
    const rust = readFileSync(
      join(root, "desktop", "src-tauri", "src", "lib.rs"),
      "utf8",
    );
    const studio = readFileSync(
      join(root, "desktop", "src", "learning-content.ts"),
      "utf8",
    );
    expect(rust).toMatch(
      /BACKGROUND_BRIDGE_COMMANDS: &\[&str\] = &\[[^\]]*"material-import-analyze"/,
    );
    expect(main).toContain("runInBackground: async (cmd, args)");
    expect(main).toContain("onDragDropEvent(");
    expect(main).toContain('openModelSetup: () => showOnboardingAt("model")');
    expect(studio).toContain("initMaterialImportStart(materialReview);");
    expect(html).not.toContain('value="scan"');
  });
});
