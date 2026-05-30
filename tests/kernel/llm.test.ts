import { describe, expect, it } from "vitest";
import { openDatabase, isLlmOnline, ensureLocalLlmRunning, setSetting } from "../../src/kernel/index.js";

describe("LLM Runner Utilities", () => {
  it("isLlmOnline returns false for invalid or unreachable URLs", async () => {
    const status = await isLlmOnline("http://localhost:9999/v1");
    expect(status).toBe(false);
  });

  it("ensureLocalLlmRunning returns immediately if llm.enabled is false", async () => {
    const db = openDatabase();
    setSetting(db, "llm.enabled", "false");
    
    // Should not throw or attempt connections
    await expect(ensureLocalLlmRunning(db)).resolves.not.toThrow();
    db.close();
  });
});
