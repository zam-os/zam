import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards Tasks 2 and 3 of the MCP-Apps Studio panel plan
// (docs/plans/2026-07-08): learning-content.ts and curriculum-wizard.ts must
// not pull in main.ts (Tauri APIs + Three.js), and the bridge-transport/i18n
// seams they now use instead must stay framework-free — the MCP panel
// (desktop/src/panel/panel.ts, Task 3) reuses them standalone, with no
// Tauri bridge and no Three.js in its bundle, and must itself stay clear of
// the same three imports.
//
// Import specifiers are extracted with a global match rather than a
// line-anchored regex (e.g. `/^import .*from "\.\/main"/m`), because a
// multi-line named-import list (`import {\n  runBridge,\n} from "./main.js";`)
// would evade that anchor while still importing the module.
describe("desktop module boundaries", () => {
  const read = (file: string) =>
    readFileSync(join(process.cwd(), "desktop", "src", file), "utf-8");

  const importSpecifiers = (source: string): string[] =>
    [...source.matchAll(/from\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g)].map(
      (m) => m[1] ?? m[2],
    );

  it("learning-content.ts and curriculum-wizard.ts do not import from main", () => {
    for (const file of ["learning-content.ts", "curriculum-wizard.ts"]) {
      const specifiers = importSpecifiers(read(file));
      for (const specifier of specifiers) {
        expect(
          specifier.startsWith("./main") || specifier.startsWith("../main"),
          `${file} must not import from main.js (found "${specifier}")`,
        ).toBe(false);
      }
    }
  });

  it("bridge-transport.ts and i18n.ts stay framework-free", () => {
    for (const file of ["bridge-transport.ts", "i18n.ts"]) {
      const specifiers = importSpecifiers(read(file));
      for (const specifier of specifiers) {
        expect(
          specifier.startsWith("@tauri-apps"),
          `${file} must not import Tauri APIs (found "${specifier}")`,
        ).toBe(false);
        expect(
          specifier === "three" || specifier.startsWith("three/"),
          `${file} must not import Three.js (found "${specifier}")`,
        ).toBe(false);
        expect(
          specifier.startsWith("./main") || specifier.startsWith("../main"),
          `${file} must not import main.js (found "${specifier}")`,
        ).toBe(false);
      }
    }
  });

  it("panel.ts stays Tauri-free and Three-free", () => {
    const specifiers = importSpecifiers(read("panel/panel.ts"));
    for (const specifier of specifiers) {
      expect(
        specifier.startsWith("@tauri-apps"),
        `panel.ts must not import Tauri APIs (found "${specifier}")`,
      ).toBe(false);
      expect(
        specifier === "three" || specifier.startsWith("three/"),
        `panel.ts must not import Three.js (found "${specifier}")`,
      ).toBe(false);
      expect(
        specifier.startsWith("./main") || specifier.startsWith("../main"),
        `panel.ts must not import main.js (found "${specifier}")`,
      ).toBe(false);
    }
  });
});
