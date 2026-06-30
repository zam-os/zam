import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDatabaseTargetInfo } from "../../src/kernel/db/connection.js";

describe("database target description", () => {
  it("describes explicit local SQLite targets", () => {
    const location = join("tmp", "zam.db");

    expect(
      getDatabaseTargetInfo({
        dbPath: location,
        useConfiguredCloud: false,
      }),
    ).toEqual({
      kind: "local",
      provider: "local",
      location,
    });
  });

  it("describes explicit Turso HTTP targets", () => {
    expect(
      getDatabaseTargetInfo({
        dbPath: "libsql://zam-example.turso.io",
        provider: "remote",
        useConfiguredCloud: false,
      }),
    ).toEqual({
      kind: "turso-remote",
      provider: "remote",
      location: "libsql://zam-example.turso.io",
    });
  });

  it("describes embedded replica targets", () => {
    expect(
      getDatabaseTargetInfo({
        dbPath: join("tmp", "replica.db"),
        syncUrl: "libsql://zam-example.turso.io",
        provider: "native",
        useConfiguredCloud: false,
      }),
    ).toEqual({
      kind: "turso-replica",
      provider: "native",
      location: join("tmp", "replica.db"),
      syncUrl: "libsql://zam-example.turso.io",
    });
  });
});
