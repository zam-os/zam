import { describe, expect, it } from "vitest";

// Importing the release helper must perform no network or file writes.
const { parseSyncArgs, selectCatalogEntries, mergeLockEntries } = await import(
  new URL("../../scripts/sync-academy-cells.mjs", import.meta.url).href
);

describe("targeted Academy release sync", () => {
  it("keeps the default full sync and accepts a single explicit app", () => {
    expect(parseSyncArgs([])).toEqual({});
    expect(parseSyncArgs(["--app", "geographie-realschule-9"])).toEqual({
      app: "geographie-realschule-9",
    });
  });

  it.each([
    ["--app"],
    ["--app", "../private"],
    ["--app", "https://elsewhere.example"],
    ["--app", "Geographie"],
    ["--app", "geo", "--app", "other"],
    ["--unknown", "geo"],
  ])("rejects malformed selection before fetching: %j", (args) => {
    expect(() => parseSyncArgs(args)).toThrow(/Usage/);
  });

  it("does not pull other published apps into a single-package change", () => {
    const geo = {
      id: "zam-academy:geographie-realschule-9",
      app: "/geographie-realschule-9/",
    };
    const history = {
      id: "zam-academy:geschichte-realschule-9",
      app: "/geschichte-realschule-9/",
    };
    expect(
      selectCatalogEntries([history, geo], "geographie-realschule-9"),
    ).toEqual([geo]);
    expect(selectCatalogEntries([history, geo], undefined)).toEqual([
      history,
      geo,
    ]);
    expect(() =>
      selectCatalogEntries([history], "geographie-realschule-9"),
    ).toThrow(/exactly one/);
    expect(() =>
      selectCatalogEntries([geo, geo], "geographie-realschule-9"),
    ).toThrow(/exactly one/);
  });

  it("preserves unselected lock entries verbatim and replaces only the copied versions", () => {
    const physics = {
      id: "zam-academy:physik-realschule-9",
      version: "2026.10.1",
      sha256: "keep",
    };
    const oldGeo = {
      id: "zam-academy:geographie-realschule-9",
      version: "2026.08.1",
      sha256: "old",
    };
    const geo = { ...oldGeo, version: "2026.10.1", sha256: "new" };
    expect(mergeLockEntries([physics, oldGeo], [geo])).toEqual([geo, physics]);
    expect(mergeLockEntries([], [physics, geo])).toEqual([geo, physics]);
    expect(oldGeo.sha256).toBe("old");
  });
});
