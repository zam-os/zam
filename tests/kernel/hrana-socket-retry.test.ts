import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { HranaTransport } from "../../src/kernel/db/remote/hrana.js";

let server: Server | undefined;

/** Kills the first `drops` connections mid-request, then answers normally. */
async function serveAfterDrops(drops: number): Promise<{
  url: string;
  requests: () => number;
}> {
  let seen = 0;
  server = createServer((req, res) => {
    seen++;
    if (seen <= drops) {
      req.socket.destroy();
      return;
    }
    req.resume();
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          baton: null,
          base_url: null,
          results: [{ type: "ok", response: { type: "close" } }],
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, requests: () => seen };
}

afterEach(async () => {
  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
  server = undefined;
});

describe("HranaTransport after a dropped connection", () => {
  it("repeats a read-only pipeline once", async () => {
    const { url, requests } = await serveAfterDrops(1);
    const transport = new HranaTransport({ url });
    await transport.pipeline([
      {
        type: "execute",
        stmt: { sql: "SELECT value FROM user_config", want_rows: true },
      },
      { type: "close" },
    ]);
    expect(requests()).toBe(2);
  });

  it("never repeats a write that may have reached the server", async () => {
    const { url, requests } = await serveAfterDrops(1);
    const transport = new HranaTransport({ url });
    await expect(
      transport.pipeline([
        {
          type: "execute",
          stmt: { sql: "INSERT INTO t VALUES (1)", want_rows: false },
        },
        { type: "close" },
      ]),
    ).rejects.toThrow(/Cannot reach the Turso database/);
    expect(requests()).toBe(1);
  });
});
