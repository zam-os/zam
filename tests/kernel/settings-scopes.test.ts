import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../../src/kernel/index.js";
import {
  bindSettingsScope,
  deleteSetting,
  forgetSettingsScope,
  getAllSettings,
  getAllSettingsDetailed,
  getSetting,
  getSettings,
  registerSettingsScopeResolver,
  setSetting,
  settingScopeOf,
} from "../../src/kernel/index.js";
import {
  describeWithProviders,
  type ProvidedDatabase,
} from "../helpers/provider-matrix.js";

/**
 * Settings scopes (ADR 2026-09-04 Decision 4): one API, three places.
 * Library keys live in `user_config`; a person's and a machine's keys in
 * `user_settings`, resolved machine → person → library. A handle without a
 * scope behaves exactly as before — that is the mobile companion's and every
 * embedded caller's contract, and the path a learner is on until `user.id`
 * exists.
 */
describe("setting key registry", () => {
  it("classifies the keys the clients write", () => {
    expect(settingScopeOf("user.id")).toBe("library");
    expect(settingScopeOf("search.dedup_threshold")).toBe("library");
    for (const key of [
      "system.locale",
      "system.timezone",
      "review_method",
      "monitor_method",
      "recall.quick_mode",
      "agent.default",
      "llm.providers",
      "llm.roles",
      "study.workload.alice",
      "study.learning.alice",
    ]) {
      expect(settingScopeOf(key), key).toBe("person");
    }
    for (const key of [
      "llm.enabled",
      "llm.url",
      "llm.model",
      "llm.api_key",
      "llm.vision.url",
      "llm.embedding.model",
      "llm.dynamic_questions",
      "observer.scope",
      "observer.allowlist",
      "repo.personal",
      "personal.goals_dir",
      "personal.workspace_dir",
      "agent.claude-code.command",
      "ai.models.cloud",
    ]) {
      expect(settingScopeOf(key), key).toBe("machine");
    }
    // Anything new follows the person until the registry says otherwise.
    expect(settingScopeOf("some.future.key")).toBe("person");
  });
});

describeWithProviders("settings scopes", "zam_settings_scopes", (provider) => {
  let provided: ProvidedDatabase;
  let db: Database;

  beforeEach(async () => {
    provided = await provider.open();
    db = provided.db;
  });

  afterEach(async () => {
    registerSettingsScopeResolver(null);
    forgetSettingsScope(db);
    await provided.cleanup();
  });

  async function libraryRow(key: string): Promise<string | undefined> {
    const row = (await db
      .prepare("SELECT value FROM user_config WHERE key = ?")
      .get(key)) as { value: string } | undefined;
    return row?.value;
  }

  async function scopedRows(
    key: string,
  ): Promise<Array<{ user_id: string; machine_id: string; value: string }>> {
    return (await db
      .prepare(
        "SELECT user_id, machine_id, value FROM user_settings WHERE key = ? ORDER BY user_id, machine_id",
      )
      .all(key)) as Array<{
      user_id: string;
      machine_id: string;
      value: string;
    }>;
  }

  it("keeps the library-only behaviour without a scope", async () => {
    await setSetting(db, "system.locale", "de");
    await setSetting(db, "llm.url", "http://localhost:11434/v1");
    expect(await getSetting(db, "system.locale")).toBe("de");
    expect(await libraryRow("llm.url")).toBe("http://localhost:11434/v1");
    expect(await scopedRows("llm.url")).toEqual([]);
    expect(await deleteSetting(db, "llm.url")).toBe(true);
    expect(await getSetting(db, "llm.url")).toBeUndefined();
  });

  describe("personal library", () => {
    const pc = {
      userId: "thomas",
      machineId: "01MACHINEPC0000000000000000",
      shared: false,
    };
    const phone = {
      userId: "thomas",
      machineId: "01MACHINEPHONE00000000000000",
      shared: false,
    };

    it("leaves a person's keys where they always were", async () => {
      bindSettingsScope(db, pc);
      await setSetting(db, "system.locale", "de");
      await setSetting(db, "recall.quick_mode", "true");
      expect(await getSetting(db, "system.locale")).toBe("de");
      expect(await libraryRow("system.locale")).toBe("de");
      expect(await scopedRows("system.locale")).toEqual([]);
      // What an older client or the mobile companion wrote is still read.
      await db
        .prepare(
          "UPDATE user_config SET value = 'fr' WHERE key = 'system.locale'",
        )
        .run();
      expect(await getSetting(db, "system.locale")).toBe("fr");
    });

    it("gives every install its own machine keys and mirrors the last write", async () => {
      // Before scopes existed the PC configured a local model.
      bindSettingsScope(db, null);
      await setSetting(db, "llm.url", "http://pc:11434/v1");

      // The PC reads through to that value, then writes its own row.
      bindSettingsScope(db, pc);
      expect(await getSetting(db, "llm.url")).toBe("http://pc:11434/v1");
      await setSetting(db, "llm.url", "http://pc:8000/v1");
      expect(await scopedRows("llm.url")).toEqual([
        {
          user_id: "thomas",
          machine_id: pc.machineId,
          value: "http://pc:8000/v1",
        },
      ]);
      expect(await libraryRow("llm.url")).toBe("http://pc:8000/v1");

      // The phone has no row yet: it sees the mirrored value, then diverges.
      bindSettingsScope(db, phone);
      expect(await getSetting(db, "llm.url")).toBe("http://pc:8000/v1");
      await setSetting(db, "llm.url", "http://phone:11434/v1");
      expect(await getSetting(db, "llm.url")).toBe("http://phone:11434/v1");

      // The PC keeps its own endpoint; the mirror carries the last write.
      bindSettingsScope(db, pc);
      expect(await getSetting(db, "llm.url")).toBe("http://pc:8000/v1");
      expect(await libraryRow("llm.url")).toBe("http://phone:11434/v1");

      // Batched and single reads agree, and the overview shows what is in effect.
      expect(
        await getSettings(db, ["llm.url", "system.locale", "missing"]),
      ).toEqual({
        "llm.url": "http://pc:8000/v1",
        "system.locale": undefined,
        missing: undefined,
      });
      expect((await getAllSettings(db))["llm.url"]).toBe("http://pc:8000/v1");

      // Deleting clears this install's row and the mirror.
      expect(await deleteSetting(db, "llm.url")).toBe(true);
      expect(await getSetting(db, "llm.url")).toBeUndefined();
      bindSettingsScope(db, phone);
      expect(await getSetting(db, "llm.url")).toBe("http://phone:11434/v1");
    });
  });

  describe("team library", () => {
    const alice = {
      userId: "01JALICE0000000000000000",
      machineId: "01MALICEPC000000000000000000",
      shared: true,
    };
    const bob = {
      userId: "01JBOB000000000000000000",
      machineId: "01MBOBPC00000000000000000000",
      shared: true,
    };

    it("keeps each person's settings apart and the shared table untouched", async () => {
      bindSettingsScope(db, alice);
      await setSetting(db, "system.locale", "de");
      await setSetting(db, "llm.url", "http://alice-pc:11434/v1");
      bindSettingsScope(db, bob);
      await setSetting(db, "system.locale", "en");

      expect(await getSetting(db, "system.locale")).toBe("en");
      expect(await getSetting(db, "llm.url")).toBeUndefined();
      bindSettingsScope(db, alice);
      expect(await getSetting(db, "system.locale")).toBe("de");
      expect(await getSetting(db, "llm.url")).toBe("http://alice-pc:11434/v1");

      expect(await libraryRow("system.locale")).toBeUndefined();
      expect(await libraryRow("llm.url")).toBeUndefined();
      expect(await scopedRows("system.locale")).toEqual([
        { user_id: alice.userId, machine_id: "", value: "de" },
        { user_id: bob.userId, machine_id: "", value: "en" },
      ]);
    });

    it("resolves machine → person → library", async () => {
      bindSettingsScope(db, null);
      await setSetting(db, "llm.model", "library-default");
      bindSettingsScope(db, alice);
      expect(await getSetting(db, "llm.model")).toBe("library-default");
      await db
        .prepare(
          `INSERT INTO user_settings (user_id, machine_id, key, value, updated_at)
           VALUES (?, '', 'llm.model', 'all-my-devices', '2026-09-19T00:00:00.000Z')`,
        )
        .run(alice.userId);
      expect(await getSetting(db, "llm.model")).toBe("all-my-devices");
      await setSetting(db, "llm.model", "this-pc");
      expect(await getSetting(db, "llm.model")).toBe("this-pc");
      expect(await libraryRow("llm.model")).toBe("library-default");

      const detailed = await getAllSettingsDetailed(db);
      expect(detailed.find((row) => row.key === "llm.model")?.value).toBe(
        "this-pc",
      );
      expect(await deleteSetting(db, "llm.model")).toBe(true);
      expect(await getSetting(db, "llm.model")).toBe("all-my-devices");
    });

    it("writes library keys to the shared table only", async () => {
      bindSettingsScope(db, alice);
      await setSetting(db, "search.dedup_threshold", "0.9");
      expect(await libraryRow("search.dedup_threshold")).toBe("0.9");
      expect(await scopedRows("search.dedup_threshold")).toEqual([]);
    });
  });

  describe("resolver", () => {
    it("asks once per handle, retries while nobody is configured, and forgets on user.id", async () => {
      let calls = 0;
      let userId: string | null = null;
      registerSettingsScopeResolver(async () => {
        calls += 1;
        return userId
          ? { userId, machineId: "01MRESOLVER00000000000000000", shared: false }
          : null;
      });

      // No identity yet: library behaviour, and the question is asked again.
      await setSetting(db, "llm.url", "http://first-run:11434/v1");
      expect(await getSetting(db, "llm.url")).toBe("http://first-run:11434/v1");
      expect(await scopedRows("llm.url")).toEqual([]);
      const askedWhileUnknown = calls;
      expect(askedWhileUnknown).toBeGreaterThanOrEqual(2);

      // The identity appears (the CLI does this through user.id).
      userId = "klara";
      await setSetting(db, "user.id", "klara");
      await setSetting(db, "llm.url", "http://klara:11434/v1");
      expect(await scopedRows("llm.url")).toEqual([
        {
          user_id: "klara",
          machine_id: "01MRESOLVER00000000000000000",
          value: "http://klara:11434/v1",
        },
      ]);
      const askedAfterIdentity = calls;
      await getSetting(db, "llm.url");
      await getSetting(db, "system.locale");
      expect(calls).toBe(askedAfterIdentity);

      // Switching the profile forgets the cached answer.
      userId = "thomas";
      await setSetting(db, "user.id", "thomas");
      await setSetting(db, "llm.url", "http://thomas:11434/v1");
      expect((await scopedRows("llm.url")).map((row) => row.user_id)).toEqual([
        "klara",
        "thomas",
      ]);
    });

    it("lets the resolver read user.id through the API without re-entering itself", async () => {
      // This is the CLI's resolver in miniature: whose settings these are is
      // itself a (library) setting. Reading it must not ask for a scope.
      let calls = 0;
      registerSettingsScopeResolver(async (handle) => {
        calls += 1;
        const userId = await getSetting(handle, "user.id");
        return userId
          ? { userId, machineId: "01MRESOLVER00000000000000000", shared: false }
          : null;
      });
      await setSetting(db, "user.id", "klara");
      await setSetting(db, "llm.url", "http://klara:11434/v1");
      expect(await scopedRows("llm.url")).toEqual([
        {
          user_id: "klara",
          machine_id: "01MRESOLVER00000000000000000",
          value: "http://klara:11434/v1",
        },
      ]);
      expect(await getSetting(db, "llm.url")).toBe("http://klara:11434/v1");
      expect(calls).toBe(1);
    });

    it("falls back to the library when the resolver throws", async () => {
      registerSettingsScopeResolver(async () => {
        throw new Error("NOT_A_MEMBER");
      });
      await setSetting(db, "system.locale", "de");
      expect(await getSetting(db, "system.locale")).toBe("de");
      expect(await libraryRow("system.locale")).toBe("de");
    });
  });
});
