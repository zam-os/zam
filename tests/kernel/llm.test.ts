import { describe, expect, it } from "vitest";
import { openDatabase, isLlmOnline, ensureLocalLlmRunning, setSetting } from "../../src/kernel/index.js";
import { fetchWithInteractiveTimeout } from "../../src/kernel/recall/llm.js";

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

  it("fetchWithInteractiveTimeout resolves when fetch resolves successfully", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("ok");
    try {
      const res = await fetchWithInteractiveTimeout("http://dummy", {}, 500);
      const text = await res.text();
      expect(text).toBe("ok");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
