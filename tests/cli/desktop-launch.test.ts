import { describe, expect, it } from "vitest";
import { focusOrLaunchStudio } from "../../src/cli/desktop-launch.js";

/** Bringing the Studio forward from the MCP server (ADR 2026-10-05). */

describe("focusOrLaunchStudio", () => {
  it("reports a missing app instead of throwing", () => {
    expect(
      focusOrLaunchStudio({
        findInstalled: () => null,
        findBuilt: () => null,
        spawn: () => {
          throw new Error("must not spawn");
        },
      }),
    ).toEqual({ opened: false, reason: "not-installed" });
  });

  it("starts the installed app detached and silently", () => {
    const calls: Array<{ command: string; args: string[]; detached: unknown }> =
      [];
    let errorHandled = false;
    const result = focusOrLaunchStudio({
      findInstalled: () => "/Applications/ZAM.app",
      spawn: (command, args, options) => {
        calls.push({ command, args, detached: options.detached });
        return {
          unref() {},
          on(event: "error") {
            errorHandled = event === "error";
            return this;
          },
        };
      },
    });
    expect(result).toEqual({ opened: true, appPath: "/Applications/ZAM.app" });
    expect(calls).toHaveLength(1);
    expect(calls[0].detached).toBe(true);
    if (process.platform === "darwin") {
      expect(calls[0]).toMatchObject({
        command: "open",
        args: ["/Applications/ZAM.app"],
      });
    }
    // An asynchronous start failure must not take the MCP server down.
    expect(errorHandled).toBe(true);
  });

  it("falls back to a developer build, and survives a failing spawn", () => {
    expect(
      focusOrLaunchStudio({
        findInstalled: () => null,
        findBuilt: () => "/repo/desktop/src-tauri/target/release/zam",
        spawn: () => {
          throw new Error("EACCES");
        },
      }),
    ).toEqual({ opened: false, reason: "launch-failed" });
  });
});
