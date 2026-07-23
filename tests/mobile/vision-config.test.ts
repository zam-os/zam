import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveMobileVisionEndpoint,
  visionImportUnavailableReason,
  visionProviderStamp,
} from "../../mobile/src/vision-config.js";
import {
  type Database,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

describe("mobile vision config from DB settings", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mobile-vision-"));
    db = await openDatabase({
      dbPath: join(tempDir, "vision.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null when vision is not enabled", async () => {
    await setSetting(db, "llm.vision.url", "https://api.openai.com/v1");
    await setSetting(db, "llm.vision.model", "gpt-4o");
    expect(await resolveMobileVisionEndpoint(db)).toBeNull();
    expect(await visionImportUnavailableReason(db)).toMatch(/not enabled/i);
  });

  it("resolves a cloud OpenAI-compatible endpoint from llm.vision.*", async () => {
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.url", "https://api.openai.com/v1");
    await setSetting(db, "llm.vision.model", "gpt-4o");
    await setSetting(db, "llm.vision.api_key", "sk-test");

    expect(await resolveMobileVisionEndpoint(db)).toEqual({
      enabled: true,
      url: "https://api.openai.com/v1",
      model: "gpt-4o",
      apiKey: "sk-test",
      apiFlavor: "chat-completions",
      label: "gpt-4o",
    });
    expect(await visionImportUnavailableReason(db)).toBeNull();
  });

  it("falls back to llm.url / llm.model / llm.api_key", async () => {
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.url", "https://openrouter.ai/api/v1/");
    await setSetting(db, "llm.model", "openai/gpt-4o-mini");
    await setSetting(db, "llm.api_key", "sk-or");

    expect(await resolveMobileVisionEndpoint(db)).toMatchObject({
      url: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4o-mini",
      apiKey: "sk-or",
    });
  });

  it("rejects loopback and LAN endpoints", async () => {
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.url", "http://127.0.0.1:11434/v1");
    await setSetting(db, "llm.vision.model", "llava");
    expect(await resolveMobileVisionEndpoint(db)).toBeNull();
    expect(await visionImportUnavailableReason(db)).toMatch(/local|loopback/i);

    await setSetting(db, "llm.vision.url", "http://192.168.1.10:8000/v1");
    expect(await resolveMobileVisionEndpoint(db)).toBeNull();
  });

  it("rejects non-HTTPS cloud endpoints (the API key would leak on the wire)", async () => {
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.url", "http://vision.example.com/v1");
    await setSetting(db, "llm.vision.model", "gpt-4o");
    expect(await resolveMobileVisionEndpoint(db)).toBeNull();
    expect(await visionImportUnavailableReason(db)).toMatch(/https/i);
  });

  it("stamps provider as vision:<model>", () => {
    expect(visionProviderStamp("gpt-4o")).toBe("vision:gpt-4o");
    expect(visionProviderStamp("  ")).toBe("vision:unknown");
  });
});
