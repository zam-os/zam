import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getTursoCredentials,
  loadStoredCredentials,
  saveCredentials,
  setTursoCredentials,
} from "../../src/kernel/index.js";

/**
 * `zam connector token turso` replaces an expired auth token while keeping the
 * database URL and access mode already on disk. Turso tokens expire; the
 * database they point at does not, and re-typing a `libsql://…` URL to fix a
 * token is both pointless and easy to get subtly wrong.
 *
 * The command's own flow needs a reachable database to verify against, so what
 * is covered here is the storage contract it is built on.
 */
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempCredsPath(): string {
  const root = mkdtempSync(join(tmpdir(), "zam-connector-token-"));
  tempDirs.push(root);
  const dir = join(root, ".zam");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return join(dir, "credentials.json");
}

describe("Turso token refresh", () => {
  it("replaces only the token, keeping the URL and the access mode", () => {
    const path = tempCredsPath();
    setTursoCredentials(
      "libsql://deck-user.turso.io",
      "expired-token",
      path,
      "remote",
    );

    // What the command does once it has the new token.
    const stored = loadStoredCredentials(path).turso;
    setTursoCredentials(stored?.url ?? "", "fresh-token", path, stored?.mode);

    expect(getTursoCredentials(path)).toEqual({
      url: "libsql://deck-user.turso.io",
      token: "fresh-token",
      mode: "remote",
    });
  });

  it("reads the URL from the stored document, not the resolved view", () => {
    // A token held as a vault reference resolves to nothing while the vault is
    // locked, so `getTursoCredentials` reports no credentials at all — but the
    // URL is still right there, and this is exactly when it is needed back.
    const path = tempCredsPath();
    saveCredentials(
      {
        turso: {
          url: "libsql://deck-user.turso.io",
          token: { $secret: { backend: "bitwarden", locator: "zam-turso" } },
          mode: "remote",
        },
      },
      path,
    );

    expect(getTursoCredentials(path)).toBeNull();
    expect(loadStoredCredentials(path).turso?.url).toBe(
      "libsql://deck-user.turso.io",
    );
    expect(loadStoredCredentials(path).turso?.mode).toBe("remote");
  });

  it("leaves unrelated credentials untouched", () => {
    const path = tempCredsPath();
    saveCredentials(
      {
        turso: { url: "libsql://deck-user.turso.io", token: "expired" },
        llmProviders: { openrouter: { apiKey: "sk-keep-me" } },
      },
      path,
    );

    const stored = loadStoredCredentials(path).turso;
    setTursoCredentials(stored?.url ?? "", "fresh-token", path, stored?.mode);

    const after = loadStoredCredentials(path);
    expect(after.llmProviders?.openrouter).toEqual({ apiKey: "sk-keep-me" });
    expect(after.turso?.token).toBe("fresh-token");
  });
});

describe("connector command surface", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "cli", "commands", "connector.ts"),
    "utf8",
  );

  it("exposes a token-only refresh that asks for no URL", () => {
    expect(source).toContain('.command("token")');
    expect(source).toContain("refreshTursoToken");
    // The whole point: the refresh path must not prompt for a URL.
    const refresh = source.slice(source.indexOf("async function refreshTursoToken"));
    expect(refresh.slice(0, refresh.indexOf("async function setupTurso"))).not.toContain(
      "Turso database URL",
    );
  });

  it("points the rejected-credentials error at the token-only command", () => {
    const hrana = readFileSync(
      join(process.cwd(), "src", "kernel", "db", "remote", "hrana.ts"),
      "utf8",
    );
    expect(hrana).toContain("zam connector token turso");
  });
});
