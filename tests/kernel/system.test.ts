import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyLocalAiHardware,
  distributeGlobalSkills,
  getPackageSkillPath,
  getSystemProfile,
  hasCommand,
  injectShellHooks,
  isOllamaInstalled,
  resolveOllamaCommand,
  supportsLocalGeneration,
} from "../../src/kernel/index.js";

describe("System Profiling & Tool Detections", () => {
  describe("getSystemProfile", () => {
    // Hardware probing shells out (WMI on Windows); cold CI runners can take
    // well over the default 5s — seen at 7s on the windows-11-arm runner.
    it("returns a valid profile matching OS structure", {
      timeout: 30_000,
    }, () => {
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
    it("recognizes only the explicitly supported accelerated hardware", () => {
      const cases = [
        [
          {
            platform: "win32" as const,
            arch: "arm64",
            processorName:
              "Snapdragon(R) X - X126100 - Qualcomm(R) Oryon(TM) CPU",
            acceleratorNames:
              "Snapdragon(R) X - X126100 - Qualcomm(R) Hexagon(TM) NPU",
          },
          "snapdragon-x",
        ],
        [
          {
            platform: "win32" as const,
            arch: "x64",
            processorName: "AMD Ryzen AI 9 HX 370",
            acceleratorNames: "AMD IPU Device",
          },
          "ryzen-ai",
        ],
        [
          {
            platform: "darwin" as const,
            arch: "arm64",
            processorName: "Apple M4",
          },
          "apple-silicon",
        ],
        [
          {
            platform: "win32" as const,
            arch: "x64",
            processorName: "Intel Core Ultra",
            acceleratorNames: "Intel AI Boost NPU",
          },
          "unsupported",
        ],
        [
          {
            platform: "win32" as const,
            arch: "x64",
            processorName: "Intel Core i7-13700K",
            gpuNames: "NVIDIA GeForce RTX 4070",
          },
          "discrete-gpu",
        ],
        [
          {
            platform: "linux" as const,
            arch: "x64",
            processorName: "AMD Ryzen 9 7950X",
            gpuNames: "NVIDIA GeForce RTX 3090",
          },
          "discrete-gpu",
        ],
        [
          {
            platform: "win32" as const,
            arch: "x64",
            processorName: "AMD Ryzen 7 5800H",
            gpuNames: "AMD Radeon RX 6700 XT",
          },
          "discrete-gpu",
        ],
      ] as const;

      for (const [fingerprint, expected] of cases) {
        expect(classifyLocalAiHardware(fingerprint)).toBe(expected);
      }
    });

    it("does not mistake integrated graphics for a usable accelerator", () => {
      // An iGPU shares memory and bandwidth with the CPU, so it belongs in the
      // same "too slow to review with" band the allowlist exists to exclude.
      const integrated = [
        "Intel(R) UHD Graphics 770",
        "Intel(R) Iris(R) Xe Graphics",
        "AMD Radeon(TM) Graphics",
        "Microsoft Basic Display Adapter",
      ];

      for (const gpuNames of integrated) {
        expect(
          classifyLocalAiHardware({
            platform: "win32",
            arch: "x64",
            processorName: "Intel Core i5-1235U",
            gpuNames,
          }),
        ).toBe("unsupported");
      }
    });

    it("withholds the guided local setup only when nothing is accelerated", () => {
      expect(supportsLocalGeneration("npu")).toBe(true);
      expect(supportsLocalGeneration("gpu")).toBe(true);
      expect(supportsLocalGeneration("none")).toBe(false);
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

  describe("Ollama detection", () => {
    it("finds an Apple Silicon Homebrew install outside the GUI PATH", () => {
      const options = {
        platform: "darwin" as const,
        homeDir: "/Users/test",
        commandAvailable: () => false,
        pathExists: (path: string) => path === "/opt/homebrew/bin/ollama",
      };

      expect(resolveOllamaCommand(options)).toBe("/opt/homebrew/bin/ollama");
      expect(isOllamaInstalled(options)).toBe(true);
    });

    it("recognizes the macOS app bundle even without a CLI executable", () => {
      expect(
        isOllamaInstalled({
          platform: "darwin",
          homeDir: "/Users/test",
          commandAvailable: () => false,
          pathExists: (path) => path === "/Applications/Ollama.app",
        }),
      ).toBe(true);
    });

    it("does not report Ollama when neither command nor standard path exists", () => {
      expect(
        isOllamaInstalled({
          platform: "linux",
          homeDir: "/home/test",
          commandAvailable: () => false,
          pathExists: () => false,
        }),
      ).toBe(false);
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

    it("resolves the Codex-specific skill source", () => {
      const path = getPackageSkillPath("codex");

      expect(path).toContain(join(".agents", "skills", "zam", "SKILL.md"));
      expect(readFileSync(path, "utf8")).toContain("$zam");
    });
  });

  describe("distributeGlobalSkills", () => {
    it("installs the Codex-specific skill under the user .agents directory", () => {
      const home = mkdtempSync(join(tmpdir(), "zam-global-skills-"));

      try {
        const results = distributeGlobalSkills(home);
        const codexPath = join(home, ".agents", "skills", "zam", "SKILL.md");

        expect(results).toContainEqual({
          name: "Codex Global",
          path: codexPath,
          success: true,
        });
        expect(existsSync(codexPath)).toBe(true);
        expect(readFileSync(codexPath, "utf8")).toContain(
          "Codex does not expose repository skills",
        );
      } finally {
        rmSync(home, { recursive: true, force: true });
      }
    });
  });

  describe("injectShellHooks", () => {
    it("installs explicit monitored-session helpers idempotently", () => {
      const home = mkdtempSync(join(tmpdir(), "zam-shell-hooks-"));
      const bashrc = join(home, ".bashrc");
      const zshrc = join(home, ".zshrc");

      try {
        writeFileSync(bashrc, "# bash profile\n", "utf8");
        writeFileSync(zshrc, "# zsh profile\n", "utf8");

        const first = injectShellHooks(home);
        const second = injectShellHooks(home);
        const bashContent = readFileSync(bashrc, "utf8");
        const zshContent = readFileSync(zshrc, "utf8");

        expect(first.every((result) => result.success)).toBe(true);
        expect(second.every((result) => result.alreadyHooked)).toBe(true);
        expect(bashContent).toContain(
          'monitor start --session "$session_id" --shell bash',
        );
        expect(zshContent).toContain(
          'monitor start --session "$session_id" --shell zsh',
        );
        expect(bashContent).not.toContain("--quiet");
      } finally {
        rmSync(home, { recursive: true, force: true });
      }
    });

    it("migrates the invalid automatic startup hook", () => {
      const home = mkdtempSync(join(tmpdir(), "zam-shell-hook-migration-"));
      const bashrc = join(home, ".bashrc");

      try {
        writeFileSync(
          bashrc,
          '# ZAM Shell Observation Hooks\nif (command -v zam >/dev/null 2>&1); then eval "$(zam monitor start --quiet)"; fi\n',
          "utf8",
        );

        injectShellHooks(home);
        const content = readFileSync(bashrc, "utf8");

        expect(content).toContain("# ZAM Monitor Session Helper");
        expect(content).not.toContain("--quiet");
      } finally {
        rmSync(home, { recursive: true, force: true });
      }
    });
  });
});
