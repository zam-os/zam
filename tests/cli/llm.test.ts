import { describe, expect, it } from "vitest";
import {
  ensureHighQualityQuestion,
  ensureLocalLlmRunning,
  fetchWithInteractiveTimeout,
  isLlmOnline,
} from "../../src/cli/llm/client.js";
import {
  createToken,
  getTokenBySlug,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

describe("LLM client utilities (CLI layer)", () => {
  it("isLlmOnline returns false for invalid or unreachable URLs", async () => {
    const status = await isLlmOnline("http://localhost:9999/v1");
    expect(status).toBe(false);
  });

  it("ensureLocalLlmRunning reports 'disabled' immediately if llm.enabled is false", async () => {
    const db = openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    setSetting(db, "llm.enabled", "false");

    const readiness = await ensureLocalLlmRunning(db);
    expect(readiness).toEqual({ usable: false, reason: "disabled" });
    db.close();
  });

  it("ensureLocalLlmRunning reports 'model-not-found' when the server doesn't serve the configured model", async () => {
    const db = openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    setSetting(db, "llm.enabled", "true");
    setSetting(db, "llm.url", "http://localhost:8000/v1");
    setSetting(db, "llm.model", "gemma4-it:e4b");

    const originalFetch = global.fetch;
    // Server is reachable, but /models lists a different model than configured.
    global.fetch = (async () =>
      new Response(
        JSON.stringify({ data: [{ id: "qwen3.5:4b" }] }),
      )) as typeof fetch;
    try {
      const readiness = await ensureLocalLlmRunning(db);
      expect(readiness.usable).toBe(false);
      expect(readiness.reason).toBe("model-not-found");
    } finally {
      global.fetch = originalFetch;
      db.close();
    }
  });

  it("fetchWithInteractiveTimeout resolves when fetch resolves successfully", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("ok");
    try {
      const res = await fetchWithInteractiveTimeout("http://dummy", {
        timeoutMs: 500,
      });
      const text = await res.text();
      expect(text).toBe("ok");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("ensureHighQualityQuestion dynamically generates and self-heals a missing question when LLM is enabled", async () => {
    const db = openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    setSetting(db, "llm.enabled", "true");
    setSetting(db, "llm.url", "http://dummy/v1");

    const slug = "test-self-heal-" + Date.now();
    const token = createToken(db, {
      slug,
      concept: "Azure DevOps secure HTTPS credential storage on macOS Keychain",
      domain: "DevOps",
      bloom_level: 2,
    });

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  "How do you securely store Azure DevOps HTTPS credentials on macOS?",
              },
            },
          ],
        }),
      );

    try {
      const question = await ensureHighQualityQuestion(db, {
        id: token.id,
        slug: token.slug,
        concept: token.concept,
        domain: token.domain,
        bloomLevel: token.bloom_level,
        sourceLink: token.source_link,
        question: token.question,
      });

      expect(question).toBe(
        "How do you securely store Azure DevOps HTTPS credentials on macOS?",
      );

      // Verify that it self-healed in the database!
      const updated = getTokenBySlug(db, slug);
      expect(updated?.question).toBe(
        "How do you securely store Azure DevOps HTTPS credentials on macOS?",
      );
    } finally {
      global.fetch = originalFetch;
      db.close();
    }
  });
});
