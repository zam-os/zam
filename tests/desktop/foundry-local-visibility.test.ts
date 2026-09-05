import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/**
 * Foundry Local is a Windows product installed through winget, and
 * `installFoundryLocal` throws on every other platform. The settings panel
 * still drew its section unconditionally, so a Mac was shown a heading, an
 * explanation, "not available on this computer" *and* a Set-up button — for
 * software it cannot run. In a panel a learner opens to find out which model
 * ZAM is using, that is three lines of pure noise.
 *
 * The section is now markup-hidden and revealed only for the machines it
 * exists for. These are text assertions because the alternative is booting the
 * Tauri shell; they fail the moment the gate is removed, which is the point.
 */
describe("Foundry Local section visibility", () => {
  const html = file("desktop/index.html");
  const main = file("desktop/src/main.ts");
  const bridge = file("src/cli/commands/bridge.ts");

  it("ships hidden, so no machine sees it before the check answers", () => {
    expect(html).toMatch(
      /<div id="foundry-local-setup" class="settings-stack hidden"[^>]*>/,
    );
  });

  it("reveals it only on Windows on ARM", () => {
    expect(main).toContain('status.os === "windows" && status.snapdragonX');
    // Revealing and hiding both have to be reachable, or the gate is a
    // one-way door that never opens on the machine it is for.
    expect(main).toContain('section?.classList.remove("hidden")');
    expect(main).toContain('section?.classList.add("hidden")');
  });

  it("carries the machine facts the gate needs over the bridge", () => {
    const command = bridge.slice(
      bridge.indexOf('.command("foundry-local-status")'),
      bridge.indexOf('.command("foundry-local-setup")'),
    );
    expect(command).toContain("os: profile.os");
    expect(command).toContain("snapdragonX: profile.hasSnapdragonX");
  });
});
