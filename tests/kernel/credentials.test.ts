import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkCredentials,
  clearSecretBackends,
  getProviderApiKey,
  getTursoCredentials,
  loadCredentials,
  loadStoredCredentials,
  registerSecretBackend,
  resetCredentialsResolutionState,
  resolveCredentials,
  saveCredentials,
  type SecretBackend,
  SecretResolutionError,
  setProviderApiKey,
  setTursoCredentials,
} from "../../src/kernel/index.js";

const tempDirs: string[] = [];

function tempCredsPath(): string {
  const root = mkdtempSync(join(tmpdir(), "zam-credentials-"));
  tempDirs.push(root);
  const dir = join(root, ".zam");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return join(dir, "credentials.json");
}

function stubBackend(
  id: string,
  resolveImpl: (locator: string) => Promise<string>,
): SecretBackend {
  return {
    id,
    isAvailable: async () => true,
    resolve: resolveImpl,
  };
}

beforeEach(() => {
  resetCredentialsResolutionState();
  clearSecretBackends();
});

afterEach(() => {
  resetCredentialsResolutionState();
  clearSecretBackends();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("credential storage", () => {
  it("writes credentials and tightens Unix permissions", () => {
    const path = tempCredsPath();

    saveCredentials({ turso: { url: "libsql://db", token: "secret" } }, path);

    expect(loadCredentials(path)).toEqual({
      turso: { url: "libsql://db", token: "secret" },
    });
    if (process.platform !== "win32") {
      expect(statSync(dirname(path)).mode & 0o777).toBe(0o700);
      expect(statSync(path).mode & 0o777).toBe(0o600);
    }
  });
});

describe("literal-only credentials (backward compatible)", () => {
  it("behaves exactly as before without any resolve step", () => {
    const path = tempCredsPath();
    setTursoCredentials("libsql://db", "tok-literal", path, "remote");
    setProviderApiKey("openrouter", "sk-test", path);

    expect(getTursoCredentials(path)).toEqual({
      url: "libsql://db",
      token: "tok-literal",
      mode: "remote",
    });
    expect(getProviderApiKey("openrouter", path)).toBe("sk-test");
  });

  it("resolveCredentials is a no-op for literals and still works", async () => {
    const path = tempCredsPath();
    setTursoCredentials("libsql://db", "tok", path);
    const resolved = await resolveCredentials(path);
    expect(resolved.turso?.token).toBe("tok");
    expect(getTursoCredentials(path)?.token).toBe("tok");
  });
});

describe("vault references", () => {
  it("resolves a reference through a stubbed backend", async () => {
    const path = tempCredsPath();
    registerSecretBackend(
      stubBackend("bw", async (locator) => {
        expect(locator).toBe("zam-turso/token");
        return "resolved-token-value";
      }),
    );

    setTursoCredentials(
      "libsql://db",
      { $secret: "bw://zam-turso/token" },
      path,
    );

    // On disk the reference is stored, never the plaintext.
    const onDisk = JSON.parse(readFileSync(path, "utf-8")) as {
      turso: { token: unknown };
    };
    expect(onDisk.turso.token).toEqual({ $secret: "bw://zam-turso/token" });
    expect(JSON.stringify(onDisk)).not.toContain("resolved-token-value");

    await resolveCredentials(path);
    expect(getTursoCredentials(path)).toEqual({
      url: "libsql://db",
      token: "resolved-token-value",
    });
  });

  it("resolves provider keys in parallel with turso", async () => {
    const path = tempCredsPath();
    const order: string[] = [];
    registerSecretBackend(
      stubBackend("bw", async (locator) => {
        order.push(locator);
        await new Promise((r) => setTimeout(r, 5));
        return `val:${locator}`;
      }),
    );

    writeFileSync(
      path,
      JSON.stringify(
        {
          turso: {
            url: "libsql://db",
            token: { $secret: "bw://item-a/password" },
          },
          llmProviders: {
            a: { apiKey: { $secret: "bw://item-b/apiKey" } },
            b: { apiKey: { $secret: "bw://item-c/apiKey" } },
          },
        },
        null,
        2,
      ),
      { encoding: "utf-8", mode: 0o600 },
    );

    await resolveCredentials(path);
    expect(getTursoCredentials(path)?.token).toBe("val:item-a/password");
    expect(getProviderApiKey("a", path)).toBe("val:item-b/apiKey");
    expect(getProviderApiKey("b", path)).toBe("val:item-c/apiKey");
    expect(order).toHaveLength(3);
  });

  it("each failure reason yields null accessors and no secret in diagnostics", async () => {
    const path = tempCredsPath();
    // If a backend ever resolved successfully, that value must never appear
    // in failure diagnostics for a different ref (or in check output).
    const secretValue = "super-secret-should-never-log";
    registerSecretBackend({
      id: "bw",
      isAvailable: async () => true,
      resolve: async (locator) => {
        if (locator === "x/locked") {
          throw new SecretResolutionError(
            "locked",
            `bw://${locator}`,
            "vault locked — run bw unlock",
          );
        }
        if (locator === "x/missing") {
          throw new SecretResolutionError(
            "not-found",
            `bw://${locator}`,
            "item not found",
          );
        }
        if (locator === "x/ni") {
          throw new SecretResolutionError(
            "not-installed",
            `bw://${locator}`,
            "bw not installed",
          );
        }
        if (locator === "x/ok") {
          return secretValue;
        }
        // Structural message only — backends must not embed secret material.
        throw new SecretResolutionError(
          "backend-error",
          `bw://${locator}`,
          "backend failed",
        );
      },
    });

    const cases: Array<{
      uri: string;
      reason: SecretResolutionError["reason"];
    }> = [
      { uri: "bw://x/locked", reason: "locked" },
      { uri: "bw://x/missing", reason: "not-found" },
      { uri: "bw://x/ni", reason: "not-installed" },
      { uri: "bw://x/err", reason: "backend-error" },
    ];

    for (const c of cases) {
      resetCredentialsResolutionState();
      // Also store a successfully-resolved provider key so we can assert it
      // never leaks into the failure diagnostics for turso.token.
      setTursoCredentials("libsql://db", { $secret: c.uri }, path);
      setProviderApiKey("ok", { $secret: "bw://x/ok" }, path);
      const stderr: string[] = [];
      const spy = vi
        .spyOn(process.stderr, "write")
        .mockImplementation((chunk) => {
          stderr.push(String(chunk));
          return true;
        });
      await resolveCredentials(path);
      spy.mockRestore();

      expect(getTursoCredentials(path)).toBeNull();
      expect(getProviderApiKey("ok", path)).toBe(secretValue);
      const joined = stderr.join("");
      expect(joined).toContain(c.reason);
      expect(joined).toContain(c.uri);
      expect(joined).not.toContain(secretValue);

      const check = checkCredentials(path);
      const token = check.find((e) => e.field === "turso.token");
      expect(token?.ok).toBe(false);
      expect(token?.reason).toBe(c.reason);
      expect(JSON.stringify(token)).not.toContain(secretValue);
      expect(JSON.stringify(check)).not.toContain(secretValue);
    }
  });

  it("accessor before resolveCredentials returns literals and warns once", async () => {
    const path = tempCredsPath();
    registerSecretBackend(
      stubBackend("bw", async () => "from-vault"),
    );

    writeFileSync(
      path,
      JSON.stringify({
        turso: {
          url: "libsql://db",
          token: { $secret: "bw://item/token" },
        },
        llmProviders: {
          local: { apiKey: "literal-key" },
        },
      }),
      { encoding: "utf-8", mode: 0o600 },
    );

    const stderr: string[] = [];
    const spy = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(String(chunk));
      return true;
    });

    // Before resolve: ref → null, literal → works, one warning.
    expect(getTursoCredentials(path)).toBeNull();
    expect(getProviderApiKey("local", path)).toBe("literal-key");
    expect(getTursoCredentials(path)).toBeNull();
    spy.mockRestore();

    const warnings = stderr.join("");
    expect(warnings).toMatch(/before resolveCredentials/i);
    expect(
      warnings.split("before resolveCredentials").length - 1,
    ).toBe(1);

    await resolveCredentials(path);
    expect(getTursoCredentials(path)?.token).toBe("from-vault");
  });

  it("unknown backend scheme fails and is never sent as a token", async () => {
    const path = tempCredsPath();
    // No backends registered.
    setTursoCredentials(
      "libsql://db",
      { $secret: "op://vault/item/field" },
      path,
    );
    const stderr: string[] = [];
    const spy = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(String(chunk));
      return true;
    });
    await resolveCredentials(path);
    spy.mockRestore();

    expect(getTursoCredentials(path)).toBeNull();
    expect(stderr.join("")).toMatch(/not-installed|No secret backend/i);
    // The scheme-qualified ref must not appear as the token value on disk.
    const stored = loadStoredCredentials(path);
    expect(stored.turso?.token).toEqual({
      $secret: "op://vault/item/field",
    });
  });

  it("checkCredentials never prints secret values", async () => {
    const path = tempCredsPath();
    registerSecretBackend(stubBackend("bw", async () => "TOP-SECRET-VALUE"));
    setTursoCredentials(
      "libsql://db",
      { $secret: "bw://zam-turso/token" },
      path,
    );
    setProviderApiKey("or", "literal-also-secret", path);
    await resolveCredentials(path);

    const report = checkCredentials(path);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("TOP-SECRET-VALUE");
    expect(serialized).not.toContain("literal-also-secret");
    expect(report.find((e) => e.field === "turso.token")?.ok).toBe(true);
    expect(report.find((e) => e.field === "llmProviders.or.apiKey")?.ok).toBe(
      true,
    );
  });
});
