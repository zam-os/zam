/**
 * Provider contract suite — every `Database` implementation must pass these,
 * independent of the concrete database package behind it.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../../src/kernel/db/types.js";

export interface ContractContext {
  db: Database;
  cleanup(): Promise<void>;
}

export function describeDatabaseContract(
  name: string,
  open: () => Promise<ContractContext>,
): void {
  describe(`database contract: ${name}`, () => {
    let ctx: ContractContext;

    beforeEach(async () => {
      ctx = await open();
      await ctx.db.exec(
        `CREATE TABLE items (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           label TEXT NOT NULL,
           weight REAL,
           payload BLOB
         );
         CREATE TABLE audit (item_id INTEGER NOT NULL);`,
      );
    });

    afterEach(async () => {
      await ctx.cleanup();
    });

    it("run reports changes and lastInsertRowid", async () => {
      const first = await ctx.db
        .prepare("INSERT INTO items (label) VALUES (?)")
        .run("alpha");
      expect(first.changes).toBe(1);
      expect(Number(first.lastInsertRowid)).toBe(1);

      const update = await ctx.db
        .prepare("UPDATE items SET label = ? WHERE label = ?")
        .run("beta", "alpha");
      expect(update.changes).toBe(1);
    });

    it("get returns a plain row object, or undefined when empty", async () => {
      await ctx.db.prepare("INSERT INTO items (label) VALUES (?)").run("alpha");

      const row = (await ctx.db
        .prepare("SELECT id, label FROM items WHERE label = ?")
        .get("alpha")) as { id: number; label: string };
      expect(row).toEqual({ id: 1, label: "alpha" });

      const missing = await ctx.db
        .prepare("SELECT id FROM items WHERE label = ?")
        .get("nope");
      expect(missing).toBeUndefined();
    });

    it("all returns every row in order", async () => {
      const insert = ctx.db.prepare("INSERT INTO items (label) VALUES (?)");
      await insert.run("a");
      await insert.run("b");

      const rows = (await ctx.db
        .prepare("SELECT label FROM items ORDER BY id")
        .all()) as Array<{ label: string }>;
      expect(rows.map((r) => r.label)).toEqual(["a", "b"]);
    });

    it("round-trips text, integers, floats, nulls, and blobs", async () => {
      const payload = new Uint8Array([0, 1, 254, 255]);
      await ctx.db
        .prepare("INSERT INTO items (label, weight, payload) VALUES (?, ?, ?)")
        .run("blob-row", 2.5, payload);
      await ctx.db
        .prepare("INSERT INTO items (label, weight, payload) VALUES (?, ?, ?)")
        .run("null-row", null, null);

      const blobRow = (await ctx.db
        .prepare("SELECT label, weight, payload FROM items WHERE label = ?")
        .get("blob-row")) as {
        label: string;
        weight: number;
        payload: Uint8Array;
      };
      expect(blobRow.weight).toBe(2.5);
      expect(new Uint8Array(blobRow.payload)).toEqual(payload);

      const nullRow = (await ctx.db
        .prepare("SELECT weight, payload FROM items WHERE label = ?")
        .get("null-row")) as { weight: null; payload: null };
      expect(nullRow.weight).toBeNull();
      expect(nullRow.payload).toBeNull();

      const big = (await ctx.db
        .prepare("SELECT 9007199254740991 AS n")
        .get()) as { n: number };
      expect(big.n).toBe(9007199254740991);
    });

    it("rejects parameters SQLite cannot bind", async () => {
      const stmt = ctx.db.prepare("INSERT INTO items (label) VALUES (?)");
      await expect(stmt.run(undefined)).rejects.toThrow();
      await expect(stmt.run(true)).rejects.toThrow();
    });

    it("exec runs multiple statements", async () => {
      await ctx.db.exec(
        `INSERT INTO items (label) VALUES ('one');
         INSERT INTO items (label) VALUES ('two');`,
      );
      const rows = await ctx.db.prepare("SELECT id FROM items").all();
      expect(rows).toHaveLength(2);
    });

    it("pragma table_info describes columns on every provider", async () => {
      const cols = (await ctx.db.pragma("table_info(items)")) as Array<{
        name: string;
      }>;
      expect(cols.map((c) => c.name)).toEqual([
        "id",
        "label",
        "weight",
        "payload",
      ]);
    });

    it("propagates SQL errors with their message", async () => {
      await expect(
        ctx.db.prepare("SELECT * FROM missing_table").all(),
      ).rejects.toThrow(/missing_table/);
    });

    it("transaction commits multi-table writes atomically", async () => {
      await ctx.db.transaction(async (tx) => {
        const item = await tx
          .prepare("INSERT INTO items (label) VALUES (?)")
          .run("tx");
        await tx
          .prepare("INSERT INTO audit (item_id) VALUES (?)")
          .run(item.lastInsertRowid);
      });

      expect(await ctx.db.prepare("SELECT * FROM audit").all()).toHaveLength(1);
    });

    it("transaction rolls back every write on error", async () => {
      await expect(
        ctx.db.transaction(async (tx) => {
          await tx
            .prepare("INSERT INTO items (label) VALUES (?)")
            .run("doomed");
          await tx.prepare("INSERT INTO audit (item_id) VALUES (?)").run(1);
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      expect(await ctx.db.prepare("SELECT * FROM items").all()).toHaveLength(0);
      expect(await ctx.db.prepare("SELECT * FROM audit").all()).toHaveLength(0);
    });

    it("serializes concurrent transactions instead of interleaving", async () => {
      const order: string[] = [];
      await Promise.all([
        ctx.db.transaction(async (tx) => {
          order.push("a:start");
          await tx.prepare("INSERT INTO items (label) VALUES ('a')").run();
          await new Promise((resolve) => setTimeout(resolve, 20));
          order.push("a:end");
        }),
        ctx.db.transaction(async (tx) => {
          order.push("b:start");
          await tx.prepare("INSERT INTO items (label) VALUES ('b')").run();
          order.push("b:end");
        }),
      ]);

      expect(order).toEqual(["a:start", "a:end", "b:start", "b:end"]);
      expect(await ctx.db.prepare("SELECT * FROM items").all()).toHaveLength(2);
    });
  });
}
