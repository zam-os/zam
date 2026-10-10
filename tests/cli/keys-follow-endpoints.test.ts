import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const SECRET = "sk-follow-me-0123456789";

/**
 * ADR 2026-10-08b D5 and D9: a key follows its endpoint. A changed URL drops
 * the key reference, and a synced row whose URL someone else rewrote gets no
 * key on this device until the learner confirms the new address. Runs the
 * built CLI (`npm run build`) against two local endpoints that record the
 * Authorization header of every request.
 */
describe("keys follow endpoints", () => {
  let tempHome: string;
  let cliPath: string;
  const servers: Server[] = [];
  const seen: Record<"a" | "b", string[]> = { a: [], b: [] };
  let urlA = "";
  let urlB = "";

  async function endpoint(name: "a" | "b"): Promise<string> {
    const server = createServer((req, res) => {
      seen[name].push(req.headers.authorization ?? "");
      if (req.url === "/v1/models") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ data: [{ id: "mimo-v2.5" }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    servers.push(server);
    const address = server.address();
    if (!address || typeof address !== "object") throw new Error("no port");
    return `http://127.0.0.1:${address.port}/v1`;
  }

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-keys-follow-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    seen.a = [];
    seen.b = [];
    urlA = await endpoint("a");
    urlB = await endpoint("b");
  });

  afterEach(async () => {
    for (const server of servers.splice(0)) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    rmSync(tempHome, { recursive: true, force: true });
  });

  async function zam(args: string[]): Promise<string> {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      USERPROFILE: tempHome,
      HOME: tempHome,
      ZAM_CONFIG_PATH: join(tempHome, "config.json"),
    };
    try {
      return (
        await execFileAsync(process.execPath, [cliPath, ...args], { env })
      ).stdout;
    } catch (err) {
      return (err as { stdout?: string }).stdout ?? "";
    }
  }

  async function bridge(args: string[]): Promise<Record<string, unknown>> {
    const stdout = await zam(["bridge", ...args]);
    const start = stdout.indexOf("{");
    return start >= 0 ? JSON.parse(stdout.slice(start)) : {};
  }

  /** A cloud row on endpoint A with a key, saved in Settings on this device. */
  async function saveRowOnA(): Promise<string> {
    await bridge(["provider-set-key", "--ref", "test-key", "--key", SECRET]);
    const saved = await bridge([
      "model-upsert",
      "--url",
      urlA,
      "--model",
      "mimo-v2.5",
      "--no-local",
      "--key-ref",
      "test-key",
      "--confirm-endpoint",
    ]);
    const id = (saved.model as { id?: string } | undefined)?.id;
    expect(id).toBeTruthy();
    expect(seen.a).toContain(`Bearer ${SECRET}`);
    return id as string;
  }

  it("drops the key reference when a save changes the URL", async () => {
    const id = await saveRowOnA();
    const moved = await bridge([
      "model-upsert",
      "--id",
      id,
      "--url",
      urlB,
      "--model",
      "mimo-v2.5",
    ]);
    expect(moved.ok).toBe(true);
    expect(seen.b.join("\n")).not.toContain(SECRET);
    expect((moved.model as { apiKeyRef?: string }).apiKeyRef).toBeUndefined();
  });

  it("sends no key to a synced row's rewritten URL until the learner confirms it", async () => {
    const id = await saveRowOnA();

    // Whoever holds the library token rewrites the row's URL and keeps the
    // key reference.
    const rows = JSON.parse(
      (await zam(["settings", "get", "ai.models.cloud"])).trim() || "[]",
    ) as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    rows[0].url = urlB;
    await zam(["settings", "set", "ai.models.cloud", JSON.stringify(rows)]);

    const listed = await bridge(["model-list"]);
    const row = (listed.models as Array<Record<string, unknown>>)[0];
    expect(row.endpointUnconfirmed).toBe(true);

    await bridge(["model-reprobe", "--id", id]);
    expect(seen.b.length).toBeGreaterThan(0);
    expect(seen.b.join("\n")).not.toContain(SECRET);

    const confirmed = await bridge(["model-confirm-endpoint", "--id", id]);
    expect(
      (confirmed.model as { endpointUnconfirmed?: boolean })
        .endpointUnconfirmed,
    ).toBe(false);
    await bridge(["model-reprobe", "--id", id]);
    expect(seen.b).toContain(`Bearer ${SECRET}`);

    // The confirmation lives in this machine's config, not in the library.
    const config = JSON.parse(
      readFileSync(join(tempHome, "config.json"), "utf-8"),
    );
    expect(config.ai.confirmedEndpoints[id]).toBe(urlB);
  });

  it("keeps a key on this machine when its device sync is turned off", async () => {
    const id = await saveRowOnA();
    const shared = await zam(["settings", "get", "ai.models.cloud"]);
    expect(shared).toContain(SECRET);

    const off = await bridge(["model-key-sync", "--id", id, "--off"]);
    expect((off.model as { keySync?: boolean }).keySync).toBe(false);
    expect(await zam(["settings", "get", "ai.models.cloud"])).not.toContain(
      SECRET,
    );

    // Still usable here: the probe sends the key from this machine's store.
    seen.a = [];
    await bridge(["model-reprobe", "--id", id]);
    expect(seen.a).toContain(`Bearer ${SECRET}`);

    await bridge(["model-key-sync", "--id", id, "--on"]);
    expect(await zam(["settings", "get", "ai.models.cloud"])).toContain(SECRET);
  });
});
