import { describe, expect, it } from "vitest";
import {
  bindRoleProviders,
  buildProviderListing,
  findOrphanKeyRefs,
  maskSecret,
  type ProvidersMap,
  removeProviderRecord,
  rolesReferencing,
  upsertProviderRecord,
} from "../../src/cli/providers/config.js";

describe("upsertProviderRecord", () => {
  it("creates a new record from the patch", () => {
    const next = upsertProviderRecord({}, "deepseek", {
      url: "https://api.deepseek.com/v1",
      model: "deepseek-v4-flash",
      apiKeyRef: "deepseek",
    });
    expect(next.deepseek).toEqual({
      url: "https://api.deepseek.com/v1",
      model: "deepseek-v4-flash",
      apiKeyRef: "deepseek",
    });
  });

  it("merges only the provided fields, preserving the rest", () => {
    const providers: ProvidersMap = {
      mimo: {
        url: "https://api.xiaomi.com/mimo/v1",
        model: "mimo-v2.5",
        apiKeyRef: "mimo",
      },
    };
    const next = upsertProviderRecord(providers, "mimo", { model: "mimo-v3" });
    expect(next.mimo).toEqual({
      url: "https://api.xiaomi.com/mimo/v1",
      model: "mimo-v3",
      apiKeyRef: "mimo",
    });
    // Original is untouched (pure function).
    expect(providers.mimo.model).toBe("mimo-v2.5");
  });
});

describe("removeProviderRecord", () => {
  it("removes an existing provider", () => {
    const { providers, removed } = removeProviderRecord(
      { a: { url: "x" }, b: { url: "y" } },
      "a",
    );
    expect(removed).toBe(true);
    expect(providers).toEqual({ b: { url: "y" } });
  });

  it("reports removed=false for an unknown provider", () => {
    const { providers, removed } = removeProviderRecord({ a: {} }, "missing");
    expect(removed).toBe(false);
    expect(providers).toEqual({ a: {} });
  });
});

describe("bindRoleProviders / rolesReferencing", () => {
  it("binds primary only", () => {
    expect(bindRoleProviders({}, "recall", "deepseek")).toEqual({
      recall: { primary: "deepseek" },
    });
  });

  it("binds primary and fallback", () => {
    expect(bindRoleProviders({}, "vision", "local-vl", "mimo")).toEqual({
      vision: { primary: "local-vl", fallback: "mimo" },
    });
  });

  it("finds roles referencing a provider as primary or fallback", () => {
    const roles = {
      vision: { primary: "local-vl", fallback: "mimo" },
      recall: { primary: "deepseek", fallback: "mimo" },
      text: { primary: "deepseek" },
    };
    expect(rolesReferencing(roles, "mimo").sort()).toEqual([
      "recall",
      "vision",
    ]);
    expect(rolesReferencing(roles, "deepseek").sort()).toEqual([
      "recall",
      "text",
    ]);
    expect(rolesReferencing(roles, "absent")).toEqual([]);
  });
});

describe("maskSecret", () => {
  it("shows only the last four characters of a long key", () => {
    expect(maskSecret("sk-abcdef1234")).toBe("…1234");
  });

  it("fully masks a short key", () => {
    expect(maskSecret("abcd")).toBe("••••");
    expect(maskSecret("")).toBe("••••");
  });
});

describe("buildProviderListing", () => {
  it("resolves flavor and key state per provider", () => {
    const providers: ProvidersMap = {
      deepseek: {
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        apiKeyRef: "deepseek",
      },
      claude: {
        url: "https://api.anthropic.com",
        model: "claude-haiku-4-5",
        apiKeyRef: "anthropic",
      },
      local: { url: "http://localhost:8000/v1", model: "mimo-vl" },
    };
    const hasKey = (ref: string) => ref === "deepseek";
    const rows = buildProviderListing(providers, hasKey);

    expect(rows).toEqual([
      {
        name: "deepseek",
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        apiFlavor: "chat-completions",
        apiKeyRef: "deepseek",
        keyState: "set",
      },
      {
        name: "claude",
        url: "https://api.anthropic.com",
        model: "claude-haiku-4-5",
        // Inferred from the anthropic.com host.
        apiFlavor: "anthropic-messages",
        apiKeyRef: "anthropic",
        keyState: "missing",
      },
      {
        name: "local",
        url: "http://localhost:8000/v1",
        model: "mimo-vl",
        apiFlavor: "chat-completions",
        apiKeyRef: undefined,
        keyState: "none",
      },
    ]);
  });

  it("honors an explicit flavor over URL inference", () => {
    const rows = buildProviderListing(
      {
        weird: {
          url: "https://api.anthropic.com",
          apiFlavor: "chat-completions",
        },
      },
      () => false,
    );
    expect(rows[0].apiFlavor).toBe("chat-completions");
  });
});

describe("findOrphanKeyRefs", () => {
  it("returns stored refs not referenced by any provider", () => {
    const providers: ProvidersMap = {
      deepseek: { apiKeyRef: "deepseek" },
      mimo: { apiKeyRef: "shared" },
    };
    expect(
      findOrphanKeyRefs(["deepseek", "shared", "leftover"], providers).sort(),
    ).toEqual(["leftover"]);
  });

  it("returns all stored refs when no provider references any", () => {
    expect(findOrphanKeyRefs(["a", "b"], {})).toEqual(["a", "b"]);
  });
});
