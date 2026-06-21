import { describe, expect, it } from "vitest";
import {
  compareVersions,
  decideUpdate,
  type InstallChannel,
  planUpdate,
} from "../../src/kernel/index.js";

describe("compareVersions", () => {
  it("orders core versions numerically, not lexically", () => {
    expect(compareVersions("0.3.7", "0.3.7")).toBe(0);
    expect(compareVersions("0.3.8", "0.3.7")).toBe(1);
    expect(compareVersions("0.3.6", "0.3.7")).toBe(-1);
    expect(compareVersions("0.10.0", "0.9.9")).toBe(1); // not lexical
    expect(compareVersions("1.0.0", "0.99.99")).toBe(1);
  });

  it("tolerates a leading v and missing patch", () => {
    expect(compareVersions("v1.2.0", "1.2.0")).toBe(0);
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("v2", "1.9.9")).toBe(1);
  });

  it("ranks a prerelease below its release", () => {
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(-1);
    expect(compareVersions("1.0.0", "1.0.0-beta")).toBe(1);
    expect(compareVersions("1.0.0-beta.2", "1.0.0-beta.10")).toBe(-1); // numeric
    expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
  });
});

describe("decideUpdate", () => {
  const channels: InstallChannel[] = [
    "developer",
    "direct",
    "winget",
    "homebrew",
  ];

  it("reports no update when already current or newer", () => {
    for (const channel of channels) {
      const same = decideUpdate({
        currentVersion: "0.3.7",
        latestVersion: "0.3.7",
        channel,
      });
      expect(same.updateAvailable).toBe(false);
      expect(same.action).toBe("none");

      const ahead = decideUpdate({
        currentVersion: "0.4.0",
        latestVersion: "0.3.7",
        channel,
      });
      expect(ahead.updateAvailable).toBe(false);
    }
  });

  it("self-updates a direct install", () => {
    const d = decideUpdate({
      currentVersion: "0.3.7",
      latestVersion: "0.4.0",
      channel: "direct",
    });
    expect(d.updateAvailable).toBe(true);
    expect(d.action).toBe("self-update");
  });

  it("defers a winget install to winget upgrade", () => {
    const d = decideUpdate({
      currentVersion: "0.3.7",
      latestVersion: "0.4.0",
      channel: "winget",
    });
    expect(d.action).toBe("run-command");
    expect(d.command).toContain("winget upgrade");
  });

  it("defers a homebrew install to brew upgrade", () => {
    const d = decideUpdate({
      currentVersion: "0.3.7",
      latestVersion: "0.4.0",
      channel: "homebrew",
    });
    expect(d.action).toBe("run-command");
    expect(d.command).toContain("brew upgrade --cask");
  });

  it("only informs a developer install", () => {
    const d = decideUpdate({
      currentVersion: "0.3.7",
      latestVersion: "0.4.0",
      channel: "developer",
    });
    expect(d.action).toBe("inform");
    expect(d.command).toContain("git pull");
  });
});

describe("planUpdate", () => {
  const upgrade = (channel: InstallChannel) =>
    decideUpdate({
      currentVersion: "0.3.7",
      latestVersion: "0.4.0",
      channel,
    });

  it("returns no steps when no update is available", () => {
    const d = decideUpdate({
      currentVersion: "0.4.0",
      latestVersion: "0.4.0",
      channel: "developer",
    });
    expect(planUpdate(d)).toEqual([]);
  });

  it("plans pull → install → build → skills for a developer install", () => {
    expect(planUpdate(upgrade("developer")).map((s) => s.kind)).toEqual([
      "git-pull",
      "npm-install",
      "npm-build",
      "distribute-skills",
    ]);
  });

  it("defers winget/homebrew to a single package-manager command", () => {
    for (const channel of ["winget", "homebrew"] as const) {
      const decision = upgrade(channel);
      const steps = planUpdate(decision);
      expect(steps).toHaveLength(1);
      expect(steps[0]?.kind).toBe("run-command");
      expect(steps[0]?.command).toBe(decision.command);
    }
  });

  it("routes a direct install to the desktop self-updater", () => {
    expect(planUpdate(upgrade("direct")).map((s) => s.kind)).toEqual([
      "self-update",
    ]);
  });
});
