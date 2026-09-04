import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { retiresPersistentDatabaseHost } from "../../src/cli/commands/bridge.js";

/**
 * `bridge serve` keeps one database handle for the life of the process. That
 * is only safe while every command that repoints the process at a different
 * library retires the old handle first — otherwise the Desktop keeps reading
 * and writing the library the learner just moved away from, silently and with
 * no error to notice.
 *
 * The guard is a string comparison, so the failure mode is a second
 * target-changing command being added and nobody remembering this list. The
 * source scan below derives the answer from the code that actually writes
 * credentials instead of from memory.
 */
describe("persistent database host rotation", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "cli", "commands", "bridge.ts"),
    "utf-8",
  );

  /** Bridge commands whose body writes Turso credentials. */
  const targetChangingCommands = (): string[] => {
    const declarations = [...source.matchAll(/\.command\(\s*"([^"]+)"/g)];
    const names = new Set<string>();
    // A call site belongs to the nearest `.command("…")` declared above it;
    // the bare identifier in the import list carries no parenthesis and so
    // never matches.
    for (const call of source.matchAll(/setTursoCredentials\(/g)) {
      const enclosing = declarations.filter(
        (declaration) => declaration.index < (call.index ?? 0),
      );
      const owner = enclosing.at(-1)?.[1];
      if (owner) names.add(owner);
    }
    return [...names].sort();
  };

  it("retires the handle for every command that changes the target", () => {
    const changing = targetChangingCommands();
    expect(changing.length).toBeGreaterThan(0);
    for (const cmd of changing) {
      expect(retiresPersistentDatabaseHost(cmd)).toBe(true);
    }
  });

  it("keeps ordinary commands on the shared handle", () => {
    for (const cmd of ["list-tokens", "get-settings", "database-status"]) {
      expect(retiresPersistentDatabaseHost(cmd)).toBe(false);
    }
  });
});
