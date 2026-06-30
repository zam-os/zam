import { describe, expect, it } from "vitest";
import { ensureDefaultUser } from "../../src/cli/users/identity.js";
import {
  getSetting,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

describe("desktop first-run identity", () => {
  it("persists the preferred identity when no user is configured", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      useConfiguredCloud: false,
    });

    expect(await ensureDefaultUser(db, "first-user")).toBe("first-user");
    expect(await getSetting(db, "user.id")).toBe("first-user");
    await db.close();
  });

  it("preserves an existing explicit identity", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "configured-user");

    expect(await ensureDefaultUser(db, "replacement")).toBe("configured-user");
    await db.close();
  });
});
