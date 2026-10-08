/**
 * ADR 2026-10-08 R8 — screen containment. Every screen surface refuses with a
 * typed `screen-observation-off` reason, before it captures, reads, spawns or
 * analyzes anything, until the learner sets `observation.screen: true` in the
 * machine-local config.json by hand. No setting or tool opens it.
 */

import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STUDIO_BRIDGE_ALLOWED_COMMANDS } from "../../src/cli/commands/mcp.js";
import { observeUiSnapshotViaLLM } from "../../src/cli/llm/vision.js";
import {
  isScreenObservationEnabled,
  openDatabase,
  ScreenObservationOffError,
  screenObservationGate,
  setSetting,
} from "../../src/kernel/index.js";

// A one-pixel PNG: enough for capture-ui --image to return it when allowed.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe("screen observation switch (kernel)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-screen-switch-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("is off without a config file and unless the value is literally true", () => {
    const path = join(dir, "config.json");
    expect(isScreenObservationEnabled(path)).toBe(false);
    for (const config of [
      {},
      { observation: {} },
      { observation: { screen: false } },
      { observation: { screen: "true" } },
      { observation: { screen: 1 } },
    ]) {
      writeFileSync(path, JSON.stringify(config));
      expect(isScreenObservationEnabled(path)).toBe(false);
      expect(screenObservationGate(path)?.denialReason).toBe(
        "screen-observation-off",
      );
    }
    writeFileSync(path, "{ not json");
    expect(isScreenObservationEnabled(path)).toBe(false);

    writeFileSync(path, JSON.stringify({ observation: { screen: true } }));
    expect(isScreenObservationEnabled(path)).toBe(true);
    expect(screenObservationGate(path)).toBeNull();
  });

  it("observeUiSnapshotViaLLM refuses before any model call while off", async () => {
    const previous = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    const originalFetch = global.fetch;
    let fetched = false;
    global.fetch = (async () => {
      fetched = true;
      throw new Error("no network in this test");
    }) as typeof fetch;
    try {
      await setSetting(db, "llm.vision.enabled", "true");
      await expect(
        observeUiSnapshotViaLLM(db, {
          sessionId: "s1",
          sequence: 1,
          observedFrom: "2026-10-08T00:00:00.000Z",
          observedTo: "2026-10-08T00:00:01.000Z",
          imagePath: join(dir, "screen.png"),
          application: { processName: "notepad.exe" },
        }),
      ).rejects.toBeInstanceOf(ScreenObservationOffError);
      expect(fetched).toBe(false);
    } finally {
      global.fetch = originalFetch;
      await db.close();
      if (previous === undefined) delete process.env.ZAM_CONFIG_PATH;
      else process.env.ZAM_CONFIG_PATH = previous;
    }
  });

  it("leaves no OCR in the sidecar, so unnamed elements stay unnamed", () => {
    const uia = readFileSync(
      join(process.cwd(), "observer", "src", "uia.rs"),
      "utf8",
    );
    const cargo = readFileSync(
      join(process.cwd(), "observer", "Cargo.toml"),
      "utf8",
    );
    expect(uia).not.toMatch(/OcrEngine|ocr_bitmap|capture_rect_gdi/);
    expect(cargo).not.toContain("Media_Ocr");
  });

  it("gates every sidecar start in the desktop shell", () => {
    const lib = readFileSync(
      join(process.cwd(), "desktop", "src-tauri", "src", "lib.rs"),
      "utf8",
    );
    // The runtime is found in exactly one place, and that place checks the
    // switch before it looks for an executable.
    expect(lib.match(/find_observer_runtime\(/g)).toHaveLength(2);
    expect(lib).toMatch(
      /fn resolve_observer_runtime\([^)]*\)[^{]*\{\s*machine_config::screen_observation_gate\(\)\?;/,
    );
  });

  it("keeps material-import-analyze off the Studio bridge (R7)", () => {
    expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has("material-import-analyze")).toBe(
      false,
    );
    for (const command of [
      "capture-ui",
      "start-recording",
      "stop-recording",
      "observe-ui-snapshot",
      "observe-ui-watch",
      "get-observations",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command)).toBe(false);
    }
    // No MCP tool runs the model-side material reader either: the MCP
    // server never names the command or its implementation.
    const mcpSource = readFileSync(
      join(process.cwd(), "src", "cli", "commands", "mcp.ts"),
      "utf8",
    );
    expect(mcpSource).not.toContain("material-import-analyze");
    expect(mcpSource).not.toContain("analyzeMaterialViaLLM");
  });
});

describe("screen observation switch (bridge)", () => {
  const tsxImport = import.meta.resolve("tsx");
  const cliPath = join(process.cwd(), "src", "cli", "index.ts");
  let tempHome: string;
  let tempCwd: string;
  let binDir: string;
  let ffmpegMarker: string;
  let sessionId: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-screen-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-screen-cwd-"));
    binDir = mkdtempSync(join(tmpdir(), "zam-screen-bin-"));
    ffmpegMarker = join(binDir, "ffmpeg-was-called");
    // A fake ffmpeg that only leaves a marker, so a test can prove that no
    // capture process was started.
    const posix = join(binDir, "ffmpeg");
    writeFileSync(posix, `#!/bin/sh\ntouch "${ffmpegMarker}"\n`);
    chmodSync(posix, 0o755);
    writeFileSync(
      join(binDir, "ffmpeg.cmd"),
      `@echo off\r\necho.> "${ffmpegMarker}"\r\n`,
    );

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db.close();
    sessionId = `01K7SCREEN${Date.now().toString(36).toUpperCase()}`;
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd, binDir]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function writeMachineConfig(config: unknown): void {
    writeFileSync(join(tempHome, ".zam", "config.json"), JSON.stringify(config));
  }

  function runBridge(args: string[]): Record<string, unknown> {
    const output = execFileSync(
      process.execPath,
      ["--import", tsxImport, cliPath, "bridge", ...args],
      {
        cwd: tempCwd,
        env: {
          ...process.env,
          HOME: tempHome,
          USERPROFILE: tempHome,
          PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}`,
        },
        encoding: "utf8",
      },
    );
    return JSON.parse(output) as Record<string, unknown>;
  }

  function expectRefused(result: Record<string, unknown>): void {
    expect(result.denied).toBe(true);
    expect(result.denialReason).toBe("screen-observation-off");
    expect(result).not.toHaveProperty("base64");
    expect(result).not.toHaveProperty("imagePath");
    expect(result).not.toHaveProperty("videoPath");
  }

  it("refuses every screen surface under the default config", () => {
    const image = join(tempCwd, "screen.png");
    writeFileSync(image, PNG_1PX);
    const video = join(tempCwd, "screen.mp4");
    writeFileSync(video, "not really a video");
    // A stored report must not come back either: it carries screen text.
    const observerDir = join(tempHome, ".zam", "observer");
    mkdirSync(observerDir, { recursive: true });
    writeFileSync(
      join(observerDir, `${sessionId}.reports.jsonl`),
      `${JSON.stringify({ sequence: 1, summary: "secret-on-screen" })}\n`,
    );

    const results = [
      runBridge(["capture-ui", "--session", sessionId]),
      runBridge(["capture-ui", "--session", sessionId, "--image", image]),
      runBridge(["start-recording", "--session", sessionId]),
      runBridge(["stop-recording", "--session", sessionId]),
      runBridge([
        "observe-ui-snapshot",
        "--session",
        sessionId,
        "--sequence",
        "1",
        "--image",
        video,
        "--observed-from",
        "2026-10-08T00:00:00.000Z",
        "--observed-to",
        "2026-10-08T00:00:03.000Z",
        "--process-name",
        "notepad.exe",
      ]),
      runBridge(["get-observations", "--session", sessionId]),
      runBridge(["observe-ui-watch", "--session", sessionId]),
    ];

    for (const result of results) {
      expectRefused(result);
      expect(JSON.stringify(result)).not.toContain("secret-on-screen");
    }
    expect(results[2].started).toBe(false);
    expect(existsSync(join(tmpdir(), `zam-recording-${sessionId}.json`))).toBe(
      false,
    );
    expect(existsSync(ffmpegMarker)).toBe(false);
  });

  it("stays closed when a setting turns vision on or names the switch", () => {
    const image = join(tempCwd, "screen.png");
    writeFileSync(image, PNG_1PX);

    expect(
      runBridge(["setting-set", "--key", "llm.vision.enabled", "--value", "true"]),
    ).toMatchObject({ ok: true });
    expectRefused(
      runBridge(["capture-ui", "--session", sessionId, "--image", image]),
    );

    // The switch is no database setting: setting-set cannot write it.
    expect(() =>
      runBridge([
        "setting-set",
        "--key",
        "observation.screen",
        "--value",
        "true",
      ]),
    ).toThrow();
    expectRefused(
      runBridge(["capture-ui", "--session", sessionId, "--image", image]),
    );

    // A string "true" in config.json is not the switch either.
    writeMachineConfig({ observation: { screen: "true" } });
    expectRefused(
      runBridge(["capture-ui", "--session", sessionId, "--image", image]),
    );
  });

  it("reports the switch in get-observer-policy", () => {
    expect(runBridge(["get-observer-policy"]).screenObservation).toBe("off");
    writeMachineConfig({ observation: { screen: true } });
    expect(runBridge(["get-observer-policy"]).screenObservation).toBe("on");
  });

  it("returns the image once the learner switched screen observation on", () => {
    writeMachineConfig({ observation: { screen: true } });
    const image = join(tempCwd, "screen.png");
    writeFileSync(image, PNG_1PX);
    const result = runBridge([
      "capture-ui",
      "--session",
      sessionId,
      "--image",
      image,
    ]);
    expect(result.granted).toBe(true);
    expect(result.base64).toBe(PNG_1PX.toString("base64"));
  });

  it("stops a recording started while on, and discards it once off", async () => {
    // A stand-in for a running ffmpeg recording.
    const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    const outputPath = join(tempCwd, `zam-recording-${sessionId}.mov`);
    writeFileSync(outputPath, "pixels");
    const statePath = join(tmpdir(), `zam-recording-${sessionId}.json`);
    writeFileSync(
      statePath,
      JSON.stringify({ pid: child.pid, outputPath, startedAt: "" }),
    );
    const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));

    try {
      const result = runBridge(["stop-recording", "--session", sessionId]);
      expectRefused(result);
      expect(result.stopped).toBe(true);
      expect(result.discarded).toBe(true);
      expect(existsSync(outputPath)).toBe(false);
      expect(existsSync(statePath)).toBe(false);
      await exited;
      expect(existsSync(ffmpegMarker)).toBe(false);
    } finally {
      child.kill("SIGKILL");
      rmSync(statePath, { force: true });
    }
  });
});
