import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("bridge open-content discovery", () => {
  function run(args: string[]): Record<string, any> {
    const output = execFileSync(
      "node",
      ["dist/cli/index.js", "bridge", "open-content-list", ...args],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    return JSON.parse(output);
  }

  it("lists only curated entries with explicit licensing and attribution", () => {
    const result = run([]);
    expect(result).toMatchObject({
      success: true,
      revision: 1,
      policy: {
        curated: true,
        explicitLicenseRequired: true,
        ankiWebAutomated: false,
      },
    });
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({
      author: { name: "Donne Martin" },
      license: { id: "CC-BY-4.0" },
      artifact: { format: "apkg" },
    });
    expect(result.items.every((item: any) => item.attribution)).toBe(true);
  });

  it("filters by query, language, and subject", () => {
    const result = run([
      "--query",
      "exercise",
      "--language",
      "en",
      "--subject",
      "Software Design",
    ]);
    expect(result.items.map((item: any) => item.id)).toEqual([
      "system-design-primer-object-oriented-exercises",
    ]);
  });
});
