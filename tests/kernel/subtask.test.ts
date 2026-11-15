import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
  runMigrations,
} from "../../src/kernel/db/provision.js";
import {
  closeSubtask,
  type Database,
  endSession,
  handOverSubtask,
  listSubtasks,
  openDatabase,
  planSubtasks,
  SubtaskRuleError,
  startSession,
} from "../../src/kernel/index.js";

describe("guided-work subtasks", () => {
  let tempDir: string;
  let db: Database;
  let sessionId: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-subtask-"));
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    sessionId = (
      await startSession(db, { user_id: "learner", task: "Add an interface" })
    ).id;
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Three subtasks: the agent's caller, the learner's interface, a manual test. */
  async function plan() {
    return planSubtasks(db, {
      sessionId,
      subtasks: [
        { ordinal: 1, title: "Write the caller", kind: "text", owner: "agent" },
        {
          ordinal: 2,
          title: "Add the interface",
          doneCriterion: "The failing test passes",
          kind: "text",
          owner: "user",
          waitsFor: [1],
        },
        {
          ordinal: 3,
          title: "Test by hand",
          kind: "terminal",
          owner: "agent",
          waitsFor: [2],
        },
      ],
    });
  }

  const pass = { checked: "passed" as const };

  describe("planSubtasks", () => {
    it("records a plan and derives what is blocked", async () => {
      const subtasks = await plan();

      expect(subtasks.map((s) => [s.ordinal, s.owner, s.state])).toEqual([
        [1, "agent", "open"],
        [2, "user", "open"],
        [3, "agent", "open"],
      ]);
      expect(subtasks.map((s) => s.blocked)).toEqual([false, true, true]);
      expect(subtasks[1].waits_for).toEqual([1]);
      expect(subtasks[1].done_criterion).toBe("The failing test passes");
    });

    it("can be repeated: it changes what is named and keeps the rest", async () => {
      const first = await plan();
      const again = await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 2, externalRef: "https://dev.example/item/42" }],
      });

      expect(again).toHaveLength(3);
      expect(again[1].id).toBe(first[1].id);
      expect(again[1].external_ref).toBe("https://dev.example/item/42");
      expect(again[1].title).toBe("Add the interface");
    });

    it("reads the current list with an empty plan, also after the session ended", async () => {
      await plan();
      await endSession(db, sessionId);

      const subtasks = await planSubtasks(db, { sessionId, subtasks: [] });

      expect(subtasks).toHaveLength(3);
      expect(await listSubtasks(db, sessionId)).toEqual(subtasks);
    });

    it("refuses a write once the session has ended", async () => {
      await plan();
      await endSession(db, sessionId);

      await expect(
        planSubtasks(db, { sessionId, subtasks: [{ ordinal: 1, title: "x" }] }),
      ).rejects.toThrow(SubtaskRuleError);
      await expect(
        handOverSubtask(db, { sessionId, ordinal: 2 }),
      ).rejects.toThrow(/already completed/);
      await expect(
        closeSubtask(db, { sessionId, ordinal: 1, doneBy: "agent", ...pass }),
      ).rejects.toThrow(/already completed/);
    });

    it("refuses an unknown session", async () => {
      await expect(
        planSubtasks(db, { sessionId: "nope", subtasks: [] }),
      ).rejects.toThrow(/Session not found/);
    });

    it("holds at most nine subtasks", async () => {
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 10, title: "x", kind: "text", owner: "agent" }],
        }),
      ).rejects.toThrow(/from 1 to 9/);
    });

    it("needs title, kind and owner for a new subtask", async () => {
      await expect(
        planSubtasks(db, { sessionId, subtasks: [{ ordinal: 1, title: "x" }] }),
      ).rejects.toThrow(/needs a title and a kind/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 1, title: "x", kind: "text" }],
        }),
      ).rejects.toThrow(/needs an owner/);
    });

    it("refuses one ordinal twice in a plan", async () => {
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [
            { ordinal: 1, title: "a", kind: "text", owner: "agent" },
            { ordinal: 1, title: "b", kind: "text", owner: "agent" },
          ],
        }),
      ).rejects.toThrow(/appears twice/);
    });

    it("refuses waiting for a missing subtask, for itself or in a circle", async () => {
      const one = {
        title: "a",
        kind: "text" as const,
        owner: "agent" as const,
      };
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 1, ...one, waitsFor: [4] }],
        }),
      ).rejects.toThrow(/does not exist/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 1, ...one, waitsFor: [1] }],
        }),
      ).rejects.toThrow(/cannot wait for itself/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [
            { ordinal: 1, ...one, waitsFor: [2] },
            { ordinal: 2, ...one, waitsFor: [1] },
          ],
        }),
      ).rejects.toThrow(/through other subtasks/);
      expect(await listSubtasks(db, sessionId)).toEqual([]);
    });

    it("limits the text it stores", async () => {
      const base = {
        ordinal: 1,
        kind: "text" as const,
        owner: "agent" as const,
      };
      await expect(
        planSubtasks(db, { sessionId, subtasks: [{ ...base, title: "  " }] }),
      ).rejects.toThrow(/must not be empty/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ...base, title: "x".repeat(121) }],
        }),
      ).rejects.toThrow(/at most 120/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ...base, title: "line\nbreak" }],
        }),
      ).rejects.toThrow(/control characters/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ...base, title: "ok", doneCriterion: "y".repeat(301) }],
        }),
      ).rejects.toThrow(/at most 300/);
    });

    it("takes a link or a short id as reference and nothing else", async () => {
      const base = {
        ordinal: 1,
        title: "a",
        kind: "text" as const,
        owner: "agent" as const,
      };
      const withId = await planSubtasks(db, {
        sessionId,
        subtasks: [{ ...base, externalRef: "AB#1234" }],
      });
      expect(withId[0].external_ref).toBe("AB#1234");

      for (const bad of [
        "file:///etc/passwd",
        "javascript:alert(1)",
        "not a ref",
      ]) {
        await expect(
          planSubtasks(db, {
            sessionId,
            subtasks: [{ ordinal: 1, externalRef: bad }],
          }),
        ).rejects.toThrow(/http\(s\) link or a short id/);
      }
    });

    it("records a colleague's work from the board", async () => {
      await plan();
      const subtasks = await planSubtasks(db, {
        sessionId,
        subtasks: [
          { ordinal: 1, state: "done_by_other" },
          { ordinal: 3, owner: "other" },
        ],
      });

      expect(subtasks[0].state).toBe("done");
      expect(subtasks[0].done_by).toBe("other");
      expect(subtasks[0].closed_at).not.toBeNull();
      expect(subtasks[1].blocked).toBe(false);
      expect(subtasks[2].owner).toBe("other");
      expect(subtasks[2].state).toBe("open");
    });

    it("unblocks what waited for a cancelled subtask", async () => {
      await plan();
      const subtasks = await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 1, state: "cancelled" }],
      });

      expect(subtasks[0].state).toBe("cancelled");
      expect(subtasks[0].done_by).toBeNull();
      expect(subtasks[1].blocked).toBe(false);
    });

    it("takes a handed-over subtask back when a colleague takes it over", async () => {
      await plan();
      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });
      await handOverSubtask(db, { sessionId, ordinal: 2 });

      const subtasks = await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 2, owner: "other" }],
      });

      expect(subtasks[1].owner).toBe("other");
      expect(subtasks[1].state).toBe("open");
      expect(subtasks[1].handed_over_at).toBeNull();
    });

    it("lets an ended subtask change only its reference", async () => {
      await plan();
      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });

      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 1, title: "New" }],
        }),
      ).rejects.toThrow(/Only its reference/);
      await expect(
        planSubtasks(db, {
          sessionId,
          subtasks: [{ ordinal: 1, state: "cancelled" }],
        }),
      ).rejects.toThrow(/Only its reference/);

      const subtasks = await planSubtasks(db, {
        sessionId,
        subtasks: [
          { ordinal: 1, title: "Write the caller", externalRef: "T-7" },
        ],
      });
      expect(subtasks[0].external_ref).toBe("T-7");
      expect(subtasks[0].done_by).toBe("agent");
    });
  });

  describe("handOverSubtask", () => {
    it("hands the learner's subtask over once it no longer waits", async () => {
      await plan();
      await expect(
        handOverSubtask(db, { sessionId, ordinal: 2 }),
      ).rejects.toThrow(/still waits/);

      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });
      const subtasks = await handOverSubtask(db, { sessionId, ordinal: 2 });

      expect(subtasks[1].state).toBe("handed_over");
      expect(subtasks[1].handed_over_at).not.toBeNull();
    });

    it("changes nothing when repeated", async () => {
      await plan();
      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });
      const first = await handOverSubtask(db, { sessionId, ordinal: 2 });
      const second = await handOverSubtask(db, { sessionId, ordinal: 2 });

      expect(second).toEqual(first);
    });

    it("refuses the agent's subtask, a missing one and an ended one", async () => {
      await plan();
      await expect(
        handOverSubtask(db, { sessionId, ordinal: 1 }),
      ).rejects.toThrow(/not the learner's/);
      await expect(
        handOverSubtask(db, { sessionId, ordinal: 7 }),
      ).rejects.toThrow(/does not exist/);
      await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 2, state: "cancelled" }],
      });
      await expect(
        handOverSubtask(db, { sessionId, ordinal: 2 }),
      ).rejects.toThrow(/already ended/);
    });
  });

  describe("closeSubtask", () => {
    async function handedOver() {
      await plan();
      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });
      await handOverSubtask(db, { sessionId, ordinal: 2 });
    }

    it("closes the learner's subtask as theirs after the hand-over", async () => {
      await handedOver();
      const subtasks = await closeSubtask(db, {
        sessionId,
        ordinal: 2,
        doneBy: "user",
        checked: "passed",
        help: "pointer",
        commitId: "277816a3",
      });

      expect(subtasks[1]).toMatchObject({
        state: "done",
        done_by: "user",
        checked: "passed",
        help: "pointer",
        commit_id: "277816a3",
      });
      expect(subtasks[2].blocked).toBe(false);
    });

    it("never closes as the learner's what was not handed over", async () => {
      await plan();
      await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        ...pass,
      });

      await expect(
        closeSubtask(db, { sessionId, ordinal: 2, doneBy: "user", ...pass }),
      ).rejects.toThrow(/was not handed over/);
    });

    it("never closes the agent's subtask as the learner's", async () => {
      await plan();

      await expect(
        closeSubtask(db, { sessionId, ordinal: 1, doneBy: "user", ...pass }),
      ).rejects.toThrow(/is the agent's/);
    });

    it("closes the learner's subtask as the agent's only when the agent did it", async () => {
      await handedOver();

      await expect(
        closeSubtask(db, { sessionId, ordinal: 2, doneBy: "agent", ...pass }),
      ).rejects.toThrow(/only with help agent_did_it/);
      await expect(
        closeSubtask(db, {
          sessionId,
          ordinal: 2,
          doneBy: "user",
          help: "agent_did_it",
          ...pass,
        }),
      ).rejects.toThrow(/closes with doneBy agent/);

      const subtasks = await closeSubtask(db, {
        sessionId,
        ordinal: 2,
        doneBy: "agent",
        help: "agent_did_it",
        ...pass,
      });
      expect(subtasks[1]).toMatchObject({
        owner: "user",
        done_by: "agent",
        help: "agent_did_it",
      });
    });

    it("does not close the agent's subtask while it waits", async () => {
      await plan();

      await expect(
        closeSubtask(db, { sessionId, ordinal: 3, doneBy: "agent", ...pass }),
      ).rejects.toThrow(/still waits/);
    });

    it("does not close a colleague's subtask or one that has ended", async () => {
      await plan();
      await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 1, owner: "other" }],
      });
      await expect(
        closeSubtask(db, { sessionId, ordinal: 1, doneBy: "agent", ...pass }),
      ).rejects.toThrow(/belongs to a colleague/);

      await planSubtasks(db, {
        sessionId,
        subtasks: [{ ordinal: 1, state: "done_by_other" }],
      });
      await expect(
        closeSubtask(db, { sessionId, ordinal: 1, doneBy: "agent", ...pass }),
      ).rejects.toThrow(/already ended/);
    });

    it("records a check that was not possible, and refuses a bad commit id", async () => {
      await plan();
      const subtasks = await closeSubtask(db, {
        sessionId,
        ordinal: 1,
        doneBy: "agent",
        checked: "not_checked",
      });
      expect(subtasks[0].checked).toBe("not_checked");
      expect(subtasks[0].help).toBeNull();

      await expect(
        closeSubtask(db, {
          sessionId,
          ordinal: 3,
          doneBy: "agent",
          checked: "passed",
          commitId: "src/secret.ts",
        }),
      ).rejects.toThrow(/hex characters/);
    });
  });

  describe("schema", () => {
    it("leaves session_steps untouched and removes subtasks with their session", async () => {
      await plan();
      const steps = (await db
        .prepare("SELECT COUNT(*) AS n FROM session_steps")
        .get()) as { n: number };
      expect(Number(steps.n)).toBe(0);

      await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      const left = (await db
        .prepare("SELECT COUNT(*) AS n FROM session_subtasks")
        .get()) as { n: number };
      expect(Number(left.n)).toBe(0);
    });

    it("adds the table to a version-48 library, and running M049 twice changes nothing", async () => {
      await plan();
      await db.exec("DROP TABLE session_subtasks");
      await db
        .prepare(
          "UPDATE zam_schema_version SET version = ? WHERE singleton = 1",
        )
        .run(48);

      await applySchemaAndMigrations(db);
      await runMigrations(db);

      const marker = (await db
        .prepare("SELECT version FROM zam_schema_version WHERE singleton = 1")
        .get()) as { version: number };
      expect(Number(marker.version)).toBe(CURRENT_SCHEMA_VERSION);
      expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(49);
      expect(await listSubtasks(db, sessionId)).toEqual([]);
      expect(await plan()).toHaveLength(3);
    });
  });
});
