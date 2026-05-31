import { describe, expect, it } from "vitest";
import {
  openDatabase,
  setSetting,
  createToken,
  getTokenBySlug,
} from "../../src/kernel/index.js";
import {
  isLlmOnline,
  ensureLocalLlmRunning,
  ensureHighQualityQuestion,
  fetchWithInteractiveTimeout,
} from "../../src/cli/llm/client.js";

describe("LLM client utilities (CLI layer)", () => {
  it("isLlmOnline returns false for invalid or unreachable URLs", async () => {
    const status = await isLlmOnline("http://localhost:9999/v1");
    expect(status).toBe(false);
  });

  it("ensureLocalLlmRunning returns immediately if llm.enabled is false", async () => {
    const db = openDatabase({ dbPath: ":memory:", initialize: true, useConfiguredCloud: false });
    setSetting(db, "llm.enabled", "false");

    // Should not throw or attempt connections
    await expect(ensureLocalLlmRunning(db)).resolves.not.toThrow();
    db.close();
  });

  it("fetchWithInteractiveTimeout resolves when fetch resolves successfully", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("ok");
    try {
      const res = await fetchWithInteractiveTimeout("http://dummy", { timeoutMs: 500 });
      const text = await res.text();
      expect(text).toBe("ok");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("ensureHighQualityQuestion dynamically generates and self-heals a missing question when LLM is enabled", async () => {
    const db = openDatabase({ dbPath: ":memory:", initialize: true, useConfiguredCloud: false });
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
                content: "How do you securely store Azure DevOps HTTPS credentials on macOS?",
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

      expect(question).toBe("How do you securely store Azure DevOps HTTPS credentials on macOS?");

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
