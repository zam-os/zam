import { describe, expect, it } from "vitest";
import {
  currentUserIdOrNull,
  describeIdentity,
  ensureDefaultUser,
  forgetDerivedIdentity,
  IdentityMismatchError,
  NotAMemberError,
  resolveLearnerId,
} from "../../src/cli/users/identity.js";
import type { Database } from "../../src/kernel/index.js";
import { openDatabase, setSetting } from "../../src/kernel/index.js";

/**
 * ADR 2026-09-04 Decision 2: on the team library the identity is the
 * connection. The PostgreSQL leg (`tests/kernel/postgres-identity.test.ts`)
 * proves it against real roles; this suite pins the client rules with a
 * stand-in database that answers `current_learner_id()` like the server.
 */
function teamDb(answer: {
  role: string | null;
  learner: string | null;
}): Database & { queries: number } {
  const db = {
    dialect: "postgres" as const,
    queries: 0,
    prepare() {
      return {
        async run() {
          return { changes: 0, lastInsertRowid: 0 };
        },
        async get() {
          db.queries += 1;
          return answer;
        },
        async all() {
          return [answer];
        },
      };
    },
    async exec() {},
    async pragma() {
      return [];
    },
    async transaction<T>(fn: (tx: Database) => Promise<T>) {
      return fn(db as unknown as Database);
    },
    async close() {},
  };
  return db as unknown as Database & { queries: number };
}

const ALICE = "01JALICE0000000000000000";

describe("team library identity", () => {
  it("derives the learner from the connection and never writes user.id", async () => {
    const db = teamDb({ role: "alice@example.org", learner: ALICE });
    expect(await resolveLearnerId(db)).toBe(ALICE);
    expect(await ensureDefaultUser(db, "someone-else")).toBe(ALICE);
    expect(await describeIdentity(db)).toEqual({
      userId: ALICE,
      source: "team-library",
      role: "alice@example.org",
    });
  });

  it("resolves once per handle and remembers it for the host's lifetime", async () => {
    const db = teamDb({ role: "alice@example.org", learner: ALICE });
    await resolveLearnerId(db);
    await resolveLearnerId(db);
    await currentUserIdOrNull(db);
    expect(db.queries).toBe(1);
  });

  it("accepts an explicit id only when it equals the derived one", async () => {
    const db = teamDb({ role: "alice@example.org", learner: ALICE });
    expect(await resolveLearnerId(db, ALICE)).toBe(ALICE);
    await expect(
      resolveLearnerId(db, "01JBOB000000000000000000"),
    ).rejects.toThrow(IdentityMismatchError);
  });

  it("locks an unmapped role out with one plain message, and forgets the failure", async () => {
    const answer = {
      role: "newcomer@example.org",
      learner: null as string | null,
    };
    const db = teamDb(answer);
    const error = await resolveLearnerId(db).catch((e) => e);
    expect(error).toBeInstanceOf(NotAMemberError);
    expect((error as Error).message).toMatch(/not yet a member/);
    expect((error as Error).message).toMatch(/newcomer@example.org/);
    expect(await currentUserIdOrNull(db)).toBeNull();
    expect(await describeIdentity(db)).toEqual({
      userId: null,
      source: "team-library",
      role: "newcomer@example.org",
    });

    // The administrator maps the role while the host keeps running: the next
    // command sees it — a failed derivation was not cached.
    answer.learner = ALICE;
    forgetDerivedIdentity(db);
    expect(await resolveLearnerId(db)).toBe(ALICE);
  });
});

describe("personal library identity", () => {
  it("keeps the explicit id, the stored default and the null case", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      useConfiguredCloud: false,
    });
    try {
      expect(await resolveLearnerId(db)).toBeNull();
      expect(await resolveLearnerId(db, "explicit")).toBe("explicit");
      await setSetting(db, "user.id", "configured");
      expect(await resolveLearnerId(db)).toBe("configured");
      expect(await resolveLearnerId(db, "other")).toBe("other");
      expect(await describeIdentity(db)).toEqual({
        userId: "configured",
        source: "configured",
        role: null,
      });
    } finally {
      await db.close();
    }
  });
});
