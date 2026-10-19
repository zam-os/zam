import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  join(process.cwd(), ".github", "workflows", "release.yml"),
  "utf8",
);

describe("the macOS release job", () => {
  it("staples the ticket, with retries, before the strict check and the zip", () => {
    // v0.54.0: notarization was accepted, but the ticket was not stapled yet,
    // so the verify step failed and the hand-installable zip was missing.
    const order = [
      "uses: tauri-apps/tauri-action",
      "xcrun stapler staple ZAM.app",
      "scripts/verify-macos-bundle.mjs",
      "name: Upload macOS .app zip for manual download",
    ].map((marker) => workflow.indexOf(marker));
    expect(order.every((index) => index !== -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("keeps the check strict: a ticket that never comes fails the job", () => {
    const step = workflow.slice(
      workflow.indexOf("name: Staple the notarization ticket"),
      workflow.indexOf("name: Verify signature and notarization (macOS)"),
    );
    expect(step).toContain("for wait in 0 30 60 120 240; do");
    expect(step).toMatch(/::error::[^\n]*\n\s*exit 1/);
    expect(workflow).toMatch(
      /verify-macos-bundle\.mjs\n[^\n]+ZAM\.app\n\s+--notarized/,
    );
  });
});
