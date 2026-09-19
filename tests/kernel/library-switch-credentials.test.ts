import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearPreviousLibrary,
  configuredLibraryKind,
  getPreviousLibrary,
  keepLibraryAsPrevious,
  loadStoredCredentials,
  restorePreviousLibrary,
  setPostgresCredentials,
  setTursoCredentials,
} from "../../src/kernel/credentials.js";

/**
 * Switching a machine between its personal Turso database and the team
 * library keeps the replaced connection (pilot plan phase 7), so the learner
 * switches back without fetching a new token. One kept connection at a time;
 * the undo of a failed switch drops the broken one instead of keeping it.
 */
describe("previous library", () => {
  const dirs: string[] = [];
  function credsPath(): string {
    const dir = mkdtempSync(join(tmpdir(), "zam-library-switch-"));
    dirs.push(dir);
    return join(dir, "credentials.json");
  }
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps the replaced Turso connection with its token and restores it", () => {
    const path = credsPath();
    setTursoCredentials("libsql://mine.turso.io", "tok-123", path, "remote");
    expect(configuredLibraryKind(path)).toBe("turso");

    expect(keepLibraryAsPrevious("turso", path)).toBe(true);
    setPostgresCredentials(
      {
        host: "team.example.org",
        database: "zam_prod",
        username: "me@example.org",
        auth: "entra-cli",
      },
      path,
    );
    expect(configuredLibraryKind(path)).toBe("postgres");
    expect(getPreviousLibrary(path)).toMatchObject({
      kind: "turso",
      location: "libsql://mine.turso.io",
    });
    // The secret stays on disk for the way back, but never in the status view.
    expect(JSON.stringify(getPreviousLibrary(path))).not.toContain("tok-123");
    expect(readFileSync(path, "utf-8")).toContain("tok-123");

    const back = restorePreviousLibrary(path);
    expect(back).toEqual({ restored: "turso", kept: "postgres" });
    const stored = loadStoredCredentials(path);
    expect(stored.turso).toEqual({
      url: "libsql://mine.turso.io",
      token: "tok-123",
      mode: "remote",
    });
    expect(stored.postgres).toBeUndefined();
    expect(getPreviousLibrary(path)).toMatchObject({
      kind: "postgres",
      location: "postgres://team.example.org:5432/zam_prod",
    });

    // …and forth again: flipping is symmetric.
    expect(restorePreviousLibrary(path)).toEqual({
      restored: "postgres",
      kept: "turso",
    });
    expect(configuredLibraryKind(path)).toBe("postgres");
  });

  it("drops the current connection when a switch is undone", () => {
    const path = credsPath();
    setTursoCredentials("libsql://mine.turso.io", "tok-123", path);
    keepLibraryAsPrevious("turso", path);
    setPostgresCredentials(
      {
        host: "wrong.example.org",
        database: "zam_prod",
        username: "me@example.org",
        auth: "entra-cli",
      },
      path,
    );
    expect(restorePreviousLibrary(path, { keepCurrent: false })).toEqual({
      restored: "turso",
      kept: null,
    });
    expect(configuredLibraryKind(path)).toBe("turso");
    expect(getPreviousLibrary(path)).toBeNull();
    expect(loadStoredCredentials(path).postgres).toBeUndefined();
  });

  it("refuses to restore when nothing is kept, and forgets on request", () => {
    const path = credsPath();
    expect(keepLibraryAsPrevious("turso", path)).toBe(false);
    expect(getPreviousLibrary(path)).toBeNull();
    expect(() => restorePreviousLibrary(path)).toThrow(/No previous library/);

    setTursoCredentials("libsql://mine.turso.io", "tok-123", path);
    keepLibraryAsPrevious("turso", path);
    clearPreviousLibrary(path);
    expect(getPreviousLibrary(path)).toBeNull();
    expect(readFileSync(path, "utf-8")).not.toContain("tok-123");
  });

  it("keeps only the latest replaced connection", () => {
    const path = credsPath();
    setTursoCredentials("libsql://first.turso.io", "tok-1", path);
    keepLibraryAsPrevious("turso", path);
    setTursoCredentials("libsql://second.turso.io", "tok-2", path);
    keepLibraryAsPrevious("turso", path);
    expect(getPreviousLibrary(path)?.location).toBe("libsql://second.turso.io");
    expect(readFileSync(path, "utf-8")).not.toContain("tok-1");
  });
});
