import { describe, expect, it } from "vitest";
import {
  getPackageSkillPath,
  getSystemProfile,
  hasCommand,
} from "../../src/kernel/index.js";

describe("System Profiling & Tool Detections", () => {
  describe("getSystemProfile", () => {
    it("returns a valid profile matching OS structure", () => {
      const profile = getSystemProfile();
      expect(profile).toHaveProperty("os");
      expect(profile).toHaveProperty("arch");
      expect(profile).toHaveProperty("hasRyzenNPU");
      expect(profile).toHaveProperty("hasAppleSilicon");
      expect(profile).toHaveProperty("recommendedRunner");
      expect(profile).toHaveProperty("recommendedModel");

      const validOS = ["windows", "macos", "linux", "unknown"];
      expect(validOS).toContain(profile.os);

      const validArch = ["x64", "arm64", "unknown"];
      expect(validArch).toContain(profile.arch);

      const validRunner = ["fastflowlm", "ollama", "generic"];
      expect(validRunner).toContain(profile.recommendedRunner);
    });
  });

  describe("hasCommand", () => {
    it("correctly identifies common shell command availability", () => {
      // node is guaranteed to exist because this test is running in node
      expect(hasCommand("node")).toBe(true);
      // random command should not exist
      expect(hasCommand("some-random-non-existent-cmd-abc-123")).toBe(false);
    });
  });

  describe("getPackageSkillPath", () => {
    it("attempts to resolve the package skill file path", () => {
      const path = getPackageSkillPath();
      // Since it runs in the source checkout, it should find the repository's skill file
      expect(typeof path).toBe("string");
      if (path) {
        expect(path).toContain("SKILL.md");
      }
    });
  });
});
