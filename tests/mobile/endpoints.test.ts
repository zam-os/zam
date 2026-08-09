import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkEndpoint,
  type EndpointDraft,
  listEndpoints,
  moveEndpoint,
  removeEndpoint,
  saveEndpoint,
  validateDraft,
} from "../../mobile/src/ai/endpoints.js";
import { resolveMobileCloudChain } from "../../mobile/src/model-registry.js";
import { type Database, openDatabase } from "../../src/kernel/index.js";

function draft(overrides: Partial<EndpointDraft> = {}): EndpointDraft {
  return {
    label: "Xiaomi",
    url: "https://api.example.com/v1",
    model: "mimo-v2.5",
    apiKey: "prepaid-key",
    capabilities: { text: true },
    ...overrides,
  };
}

describe("validateDraft", () => {
  it("accepts a complete endpoint", () => {
    expect(validateDraft(draft())).toBeNull();
  });

  it("names what is missing", () => {
    expect(validateDraft(draft({ label: "  " }))).toBe("empty_label");
    expect(validateDraft(draft({ url: "" }))).toBe("empty_url");
    expect(validateDraft(draft({ url: "api.example.com" }))).toBe("bad_url");
    expect(validateDraft(draft({ model: "" }))).toBe("empty_model");
  });

  it("refuses an endpoint set for nothing", () => {
    // A row with no capability is invisible to `resolveMobileCloudChain`: it
    // would sit in the list looking configured and never be called.
    expect(validateDraft(draft({ capabilities: {} }))).toBe("no_capability");
  });
});

describe("endpoint storage", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-endpoints-"));
    db = await openDatabase({
      dbPath: join(tempDir, "endpoints.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("starts empty, which is a legitimate state", async () => {
    // ADR 2026-08-09 §1: a missing model configuration must never be treated
    // as a fault. Nothing here is required to review, import or search.
    expect(await listEndpoints(db)).toEqual([]);
    expect(await resolveMobileCloudChain(db, "text")).toBeNull();
  });

  it("stores an endpoint the chain can then resolve", async () => {
    const saved = await saveEndpoint(db, draft());
    expect(saved.ok).toBe(true);

    const chain = await resolveMobileCloudChain(db, "text");
    expect(chain?.model).toBe("mimo-v2.5");
    expect(chain?.apiKey).toBe("prepaid-key");
    expect(chain?.url).toBe("https://api.example.com/v1");
  });

  it("trims a trailing slash so the chat path is not doubled", async () => {
    await saveEndpoint(db, draft({ url: "https://api.example.com/v1/" }));
    const [row] = await listEndpoints(db);
    expect(row?.url).toBe("https://api.example.com/v1");
  });

  it("marks a hand-entered capability as detected, or nothing resolves", async () => {
    // `resolveMobileCloudChain` needs both flags. There is no probe behind a
    // typed URL, so the tick is the assertion — otherwise every hand-added
    // endpoint would be stored and then silently ignored.
    await saveEndpoint(db, draft({ capabilities: { embedding: true } }));
    const [row] = await listEndpoints(db);
    expect(row?.detectedCapabilities.embedding).toBe(true);
    expect(await resolveMobileCloudChain(db, "embedding")).not.toBeNull();
  });

  it("updates in place instead of stacking a second row", async () => {
    const first = await saveEndpoint(db, draft());
    await saveEndpoint(db, {
      ...draft({ model: "mimo-v3" }),
      id: first.id as string,
    });
    const rows = await listEndpoints(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.model).toBe("mimo-v3");
  });

  it("orders the chain, and reordering changes which model answers", async () => {
    await saveEndpoint(db, draft({ label: "First", model: "first" }));
    const second = await saveEndpoint(
      db,
      draft({ label: "Second", model: "second" }),
    );
    expect((await resolveMobileCloudChain(db, "text"))?.model).toBe("first");

    expect(await moveEndpoint(db, second.id as string, "up")).toBe(true);
    expect((await resolveMobileCloudChain(db, "text"))?.model).toBe("second");
    // The one it displaced becomes the fallback rather than disappearing.
    expect((await resolveMobileCloudChain(db, "text"))?.fallback?.model).toBe(
      "first",
    );
  });

  it("refuses to move past either end", async () => {
    const only = await saveEndpoint(db, draft());
    expect(await moveEndpoint(db, only.id as string, "up")).toBe(false);
    expect(await moveEndpoint(db, only.id as string, "down")).toBe(false);
    expect(await moveEndpoint(db, "not-a-row", "up")).toBe(false);
  });

  it("keeps order dense after a removal", async () => {
    const a = await saveEndpoint(db, draft({ label: "A", model: "a" }));
    await saveEndpoint(db, draft({ label: "B", model: "b" }));
    await saveEndpoint(db, draft({ label: "C", model: "c" }));
    await removeEndpoint(db, a.id as string);

    const rows = await listEndpoints(db);
    // A gap left behind would decide priority by accident on the next move.
    expect(rows.map((row) => row.order)).toEqual([0, 1]);
    expect(rows.map((row) => row.model)).toEqual(["b", "c"]);
  });
});

describe("checkEndpoint", () => {
  it("asks the one endpoint every OpenAI-compatible server answers", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const result = await checkEndpoint(
      { url: "https://api.example.com/v1/", apiKey: "k" },
      fetchImpl as unknown as typeof fetch,
    );
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/models");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer k",
    );
  });

  it("separates a rejected key from an unreachable host", async () => {
    const rejected = await checkEndpoint(
      { url: "https://api.example.com/v1", apiKey: "bad" },
      (async () => new Response("", { status: 401 })) as unknown as typeof fetch,
    );
    expect(rejected).toMatchObject({ ok: false, status: 401 });

    const unreachable = await checkEndpoint(
      { url: "https://nope.example.com/v1", apiKey: "k" },
      (async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      }) as unknown as typeof fetch,
    );
    expect(unreachable.ok).toBe(false);
    expect(unreachable.status).toBeUndefined();
  });
});
