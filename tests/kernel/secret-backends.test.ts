import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBitwardenBackend } from "../../src/kernel/secrets/backends/bitwarden.js";
import {
  clearSecretBackends,
  isSecretRef,
  parseSecretUri,
  registerSecretBackend,
  resolveSecretUri,
  SecretResolutionError,
} from "../../src/kernel/index.js";

beforeEach(() => {
  clearSecretBackends();
});

afterEach(() => {
  clearSecretBackends();
});

describe("parseSecretUri / isSecretRef", () => {
  it("parses scheme and locator", () => {
    expect(parseSecretUri("bw://zam-turso/token")).toEqual({
      scheme: "bw",
      locator: "zam-turso/token",
    });
    expect(parseSecretUri("  OP://v/i/f  ")).toEqual({
      scheme: "op",
      locator: "v/i/f",
    });
  });

  it("rejects malformed URIs", () => {
    expect(parseSecretUri("not-a-ref")).toBeNull();
    expect(parseSecretUri("bw://")).toBeNull();
    expect(parseSecretUri("://missing")).toBeNull();
  });

  it("detects SecretRef objects", () => {
    expect(isSecretRef({ $secret: "bw://a/b" })).toBe(true);
    expect(isSecretRef({ $secret: "" })).toBe(false);
    expect(isSecretRef("bw://a/b")).toBe(false);
    expect(isSecretRef(null)).toBe(false);
  });
});

describe("resolveSecretUri", () => {
  it("routes to the registered backend", async () => {
    registerSecretBackend({
      id: "bw",
      isAvailable: async () => true,
      resolve: async (locator) => `ok:${locator}`,
    });
    await expect(resolveSecretUri("bw://item/field")).resolves.toBe(
      "ok:item/field",
    );
  });

  it("fails on unknown schemes without treating them as literals", async () => {
    await expect(resolveSecretUri("env://TOKEN")).rejects.toMatchObject({
      reason: "not-installed",
      ref: "env://TOKEN",
    });
  });
});

describe("bitwarden backend", () => {
  const itemJson = JSON.stringify({
    name: "zam-turso",
    notes: "note-value",
    login: { username: "user", password: "pass" },
    fields: [{ name: "token", value: "custom-token" }],
  });

  function backendWith(stdout: string) {
    return createBitwardenBackend(async (args) => {
      if (args[0] === "--version") return { stdout: "2024.1.0", stderr: "" };
      expect(args.slice(0, 3)).toEqual(["get", "item", "zam-turso"]);
      return { stdout, stderr: "" };
    });
  }

  it("reads password, username, notes and custom fields", async () => {
    const backend = backendWith(itemJson);
    await expect(backend.resolve("zam-turso/password")).resolves.toBe("pass");
    await expect(backend.resolve("zam-turso/username")).resolves.toBe("user");
    await expect(backend.resolve("zam-turso/notes")).resolves.toBe(
      "note-value",
    );
    await expect(backend.resolve("zam-turso/token")).resolves.toBe(
      "custom-token",
    );
  });

  it("maps missing fields and items to not-found", async () => {
    const backend = backendWith(itemJson);
    await expect(backend.resolve("zam-turso/missing")).rejects.toMatchObject({
      reason: "not-found",
    });

    const missing = createBitwardenBackend(async () => {
      const err = new Error("Not found.") as Error & {
        status: number;
        stderr: string;
      };
      err.status = 1;
      err.stderr = "Not found.";
      throw err;
    });
    await expect(missing.resolve("gone/password")).rejects.toMatchObject({
      reason: "not-found",
    });
  });

  it("maps locked vault and missing CLI", async () => {
    const locked = createBitwardenBackend(async () => {
      const err = new Error("Vault is locked.") as Error & {
        status: number;
        stderr: string;
      };
      err.status = 1;
      err.stderr = "Vault is locked.";
      throw err;
    });
    await expect(locked.resolve("x/password")).rejects.toMatchObject({
      reason: "locked",
    });

    const missingCli = createBitwardenBackend(async () => {
      const err = new Error("spawn bw ENOENT") as Error & { code: string };
      err.code = "ENOENT";
      throw err;
    });
    await expect(missingCli.resolve("x/password")).rejects.toMatchObject({
      reason: "not-installed",
    });
  });

  it("rejects malformed locators", async () => {
    const backend = createBitwardenBackend(async () => ({
      stdout: "",
      stderr: "",
    }));
    await expect(backend.resolve("no-field")).rejects.toMatchObject({
      reason: "backend-error",
    });
    await expect(backend.resolve("/only-field")).rejects.toMatchObject({
      reason: "backend-error",
    });
  });

  it("never puts secret values into error messages", async () => {
    const backend = backendWith(itemJson);
    try {
      await backend.resolve("zam-turso/missing");
      expect.unreachable("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(SecretResolutionError);
      const msg = (err as SecretResolutionError).message;
      expect(msg).not.toContain("pass");
      expect(msg).not.toContain("custom-token");
      expect(msg).not.toContain("note-value");
    }
  });
});
