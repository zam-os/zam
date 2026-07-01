import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clearRecallEndpointCache,
  ensureHighQualityQuestion,
  ensureLlmReadyHeadless,
  ensureLocalLlmRunning,
  fetchWithInteractiveTimeout,
  isLlmOnline,
  resolveUsableRecallEndpoint,
  importCurriculumViaLLM,
  generateSplitProposalsViaLLM,
} from "../../src/cli/llm/client.js";
import {
  createToken,
  getTokenBySlug,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

function withIsolatedMachineConfig<T>(run: () => Promise<T>): Promise<T> {
  const configDir = mkdtempSync(join(tmpdir(), "zam-llm-test-"));
  const configPath = join(configDir, "config.json");
  writeFileSync(configPath, JSON.stringify({ ai: { providers: {}, roles: {} } }));
  const previousConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = configPath;
  return run().finally(() => {
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    rmSync(configDir, { recursive: true, force: true });
  });
}

describe("LLM client utilities (CLI layer)", () => {
  it("isLlmOnline returns false for invalid or unreachable URLs", async () => {
    const status = await isLlmOnline("http://localhost:9999/v1");
    expect(status).toBe(false);
  });

  it("ensureLocalLlmRunning reports 'disabled' immediately if llm.enabled is false", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "false");

    const readiness = await ensureLocalLlmRunning(db);
    expect(readiness).toEqual({ usable: false, reason: "disabled" });
    await db.close();
  });

  it("ensureLocalLlmRunning reports 'model-not-found' when the server doesn't serve the configured model", async () => {
    await withIsolatedMachineConfig(async () => {
      const db = await openDatabase({
        dbPath: ":memory:",
        initialize: true,
        useConfiguredCloud: false,
      });
      await setSetting(db, "llm.enabled", "true");
      await setSetting(db, "llm.url", "http://localhost:8000/v1");
      await setSetting(db, "llm.model", "gemma4-it:e4b");

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
        await db.close();
      }
    });
  });
  it("ensureLlmReadyHeadless does not probe local fallback when cloud primary is online", async () => {
    await withIsolatedMachineConfig(async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        mimo: {
          url: "https://recall.example/v1",
          model: "mimo-v2.5",
          apiKey: "sk-mimo",
        },
        localFlm: {
          url: "http://localhost:8000/v1",
          model: "qwen3.5:4b",
          local: true,
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({
        recall: { primary: "mimo", fallback: "localFlm" },
      }),
    );

    const originalFetch = global.fetch;
    const urls: string[] = [];
    global.fetch = (async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ data: [{ id: "mimo-v2.5" }] }));
    }) as typeof fetch;

    try {
      const readiness = await ensureLlmReadyHeadless(db);
      expect(readiness).toMatchObject({
        usable: true,
        online: true,
        model: "mimo-v2.5",
        local: false,
        activeTier: "primary",
      });
      expect(urls.every((url) => !url.includes("localhost:8000"))).toBe(true);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
    });
  });

  it("recall endpoint cache is reused, then invalidated when the binding changes", async () => {
    await withIsolatedMachineConfig(async () => {
      clearRecallEndpointCache();
      const db = await openDatabase({
        dbPath: ":memory:",
        initialize: true,
        useConfiguredCloud: false,
      });
      await setSetting(db, "llm.enabled", "true");
      await setSetting(
        db,
        "llm.providers",
        JSON.stringify({
          cloudA: {
            url: "https://a.example/v1",
            model: "model-a",
            apiKey: "sk-a",
          },
          cloudB: {
            url: "https://b.example/v1",
            model: "model-b",
            apiKey: "sk-b",
          },
        }),
      );
      await setSetting(
        db,
        "llm.roles",
        JSON.stringify({ recall: { primary: "cloudA" } }),
      );

      const originalFetch = global.fetch;
      const urls: string[] = [];
      global.fetch = (async (url) => {
        urls.push(String(url));
        return new Response(
          JSON.stringify({ data: [{ id: "model-a" }, { id: "model-b" }] }),
        );
      }) as typeof fetch;

      try {
        const first = await resolveUsableRecallEndpoint(db);
        expect(first.url).toBe("https://a.example/v1");
        const probesAfterFirst = urls.length;
        expect(probesAfterFirst).toBeGreaterThan(0);

        // Unchanged config → served from cache, no new network probes.
        const second = await resolveUsableRecallEndpoint(db);
        expect(second.url).toBe("https://a.example/v1");
        expect(urls.length).toBe(probesAfterFirst);

        // Rebind recall → cloudB: the signature changes, so the cache must be
        // bypassed and the new endpoint resolved immediately (not after the TTL).
        await setSetting(
          db,
          "llm.roles",
          JSON.stringify({ recall: { primary: "cloudB" } }),
        );
        const third = await resolveUsableRecallEndpoint(db);
        expect(third.url).toBe("https://b.example/v1");
        expect(urls.length).toBeGreaterThan(probesAfterFirst);
        expect(urls.some((u) => u.includes("b.example"))).toBe(true);
      } finally {
        global.fetch = originalFetch;
        clearRecallEndpointCache();
        await db.close();
      }
    });
  });

  it("ensureLlmReadyHeadless checks the recall role provider, not legacy llm.*", async () => {
    await withIsolatedMachineConfig(async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://legacy-localhost:8000/v1");
    await setSetting(db, "llm.model", "legacy-model");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        recallCloud: {
          url: "https://recall.example/v1",
          model: "role-model",
          apiKey: "sk-role",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ recall: { primary: "recallCloud" } }),
    );

    const originalFetch = global.fetch;
    const urls: string[] = [];
    global.fetch = (async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ data: [{ id: "role-model" }] }));
    }) as typeof fetch;

    try {
      const readiness = await ensureLlmReadyHeadless(db);
      expect(readiness).toMatchObject({
        usable: true,
        online: true,
        model: "role-model",
        availableModels: ["role-model"],
      });
      expect(urls).toEqual([
        "https://recall.example/v1/models",
        "https://recall.example/v1/models",
      ]);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
    });
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

  it("fetchWithInteractiveTimeout aborts hung bridge requests at the hard deadline", async () => {
    const originalFetch = global.fetch;
    const originalBridge = process.env.ZAM_BRIDGE;
    let aborted = false;
    global.fetch = ((_url, options) =>
      new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      })) as typeof fetch;
    process.env.ZAM_BRIDGE = "true";

    try {
      await expect(
        fetchWithInteractiveTimeout("http://dummy", { hardTimeoutMs: 10 }),
      ).rejects.toThrow("LLM request timed out after 10ms");
      expect(aborted).toBe(true);
    } finally {
      global.fetch = originalFetch;
      if (originalBridge === undefined) {
        delete process.env.ZAM_BRIDGE;
      } else {
        process.env.ZAM_BRIDGE = originalBridge;
      }
    }
  });

  it("ensureHighQualityQuestion dynamically generates and self-heals a missing question when LLM is enabled", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");

    const slug = `test-self-heal-${Date.now()}`;
    const token = await createToken(db, {
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

      expect(question).toMatchObject({
        question:
          "How do you securely store Azure DevOps HTTPS credentials on macOS?",
        source: "llm",
      });

      // Verify that it self-healed in the database!
      const updated = await getTokenBySlug(db, slug);
      expect(updated?.question).toBe(
        "How do you securely store Azure DevOps HTTPS credentials on macOS?",
      );
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("importCurriculumViaLLM correctly queries LLM and parses JSON result", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");

    const mockResponseText = JSON.stringify([
      {
        question: "What is git revert?",
        concept: "Creates a new commit that node-undos the changes",
        domain: "git",
        bloom_level: 2,
        symbiosis_mode: "shadowing",
        context: "revert creates a new commit"
      }
    ]);

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `Here is the parsed JSON: \n${mockResponseText}\nHope it helps!`,
              },
            },
          ],
        }),
      );

    try {
      const cards = await importCurriculumViaLLM(
        db,
        "Syllabus: revert creates a new commit to undo changes",
        "git",
        "https://example.com"
      );

      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({
        question: "What is git revert?",
        concept: "Creates a new commit that node-undos the changes",
        domain: "git",
        bloom_level: 2,
        symbiosis_mode: "shadowing",
        context: "revert creates a new commit",
        source_link: "https://example.com"
      });
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("generateSplitProposalsViaLLM correctly queries LLM and parses proposal objects", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");

    const mockResponseText = JSON.stringify([
      {
        question: "What is git add?",
        concept: "Stages files",
        domain: "git",
        bloom_level: 1,
        symbiosis_mode: "shadowing",
        context: "add stages files"
      },
      {
        question: "What is git commit?",
        concept: "Saves staged snapshot",
        domain: "git",
        bloom_level: 2,
        symbiosis_mode: "shadowing",
        context: "commit saves snapshot"
      }
    ]);

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `Response block:\n${mockResponseText}`,
              },
            },
          ],
        }),
      );

    try {
      const proposals = await generateSplitProposalsViaLLM(db, {
        question: "Explain staging and committing in Git",
        concept: "Add stages changes; commit saves them",
        domain: "git",
        context: "Git workflow involves add and commit",
        source_link: "https://git-scm.com"
      });

      expect(proposals).toHaveLength(2);
      expect(proposals[0]).toMatchObject({
        question: "What is git add?",
        concept: "Stages files",
        domain: "git",
        bloom_level: 1,
        source_link: "https://git-scm.com"
      });
      expect(proposals[1]).toMatchObject({
        question: "What is git commit?",
        concept: "Saves staged snapshot",
        domain: "git",
        bloom_level: 2,
        source_link: "https://git-scm.com"
      });
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
});
