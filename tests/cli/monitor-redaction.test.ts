/**
 * ADR 2026-10-08 R5/R6 at the outside: no MCP tool or bridge command hands
 * an agent a raw command line, the end of a session redacts the log at rest,
 * and closing a session's observation deletes it.
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import {
  createAgentSkill,
  createToken,
  getMonitorPath,
  openDatabase,
  readSessionDigest,
} from "../../src/kernel/index.js";

const SECRET = "Fake5ecretValue77";

function writeRawLog(sessionId: string, commands: string[]): string {
  const path = getMonitorPath(sessionId);
  mkdirSync(join(path, ".."), { recursive: true });
  const lines: string[] = [];
  commands.forEach((command, index) => {
    const seq = index + 1;
    const at = new Date(Date.UTC(2026, 9, 8, 10, 0, seq * 20)).toISOString();
    const end = new Date(Date.UTC(2026, 9, 8, 10, 0, seq * 20 + 2)).toISOString();
    lines.push(JSON.stringify({ type: "command_start", ts: at, command, cwd: "/repo", seq, pid: 7 }));
    lines.push(JSON.stringify({ type: "command_end", ts: end, exit_code: 0, seq, pid: 7 }));
  });
  writeFileSync(path, `${lines.join("\n")}\n`);
  return path;
}

describe("monitor payloads are redacted", () => {
  let tempDir: string;
  let db: any;
  let server: any;
  let client: Client;
  const saved: Record<string, string | undefined> = {};

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-monitor-redaction-"));
    for (const [name, value] of Object.entries({
      ZAM_CONFIG_PATH: join(tempDir, "config.json"),
      ZAM_MONITOR_DIR: join(tempDir, "monitor"),
      ZAM_OBSERVER_DIR: join(tempDir, "observer"),
    })) {
      saved[name] = process.env[name];
      process.env[name] = value;
    }
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'thomas')",
      )
      .run();
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client?.close();
    await server?.close();
    await db?.close();
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  });

  async function call(name: string, args: Record<string, unknown>) {
    const response = (await client.callTool({ name, arguments: args })) as {
      content: Array<{ text: string }>;
      isError?: boolean;
    };
    expect(response.isError).toBeUndefined();
    return { text: response.content[0].text, data: JSON.parse(response.content[0].text) };
  }

  async function startedSession(): Promise<string> {
    const { data } = await call("zam_session_start", {
      user: "thomas",
      task: "Publish a package",
    });
    return data.id as string;
  }

  it("zam_monitor never returns a raw command, read or analyzed", async () => {
    const session = await startedSession();
    writeRawLog(session, [
      `export NPM_TOKEN=${SECRET}`,
      `npm publish --otp ${SECRET}`,
      `curl -H 'Authorization: Bearer ${SECRET}' https://x.test`,
    ]);

    const read = await call("zam_monitor", { session });
    expect(read.data.commands).toHaveLength(3);
    expect(read.text).not.toContain(SECRET);

    const analyzed = await call("zam_monitor", {
      session,
      patterns: [
        { slug: "npm-publish", patterns: ["npm publish"] },
        // A pattern cannot probe for the secret: it runs on redacted text.
        { slug: "probe", patterns: [SECRET.slice(0, 8)] },
      ],
    });
    expect(analyzed.text).not.toContain(SECRET);
    const ratings = new Map(
      analyzed.data.ratings.map((r: { tokenSlug: string }) => [r.tokenSlug, r]),
    );
    expect((ratings.get("npm-publish") as any).evidence.matchedCommands).toBe(1);
    expect((ratings.get("probe") as any).evidence.matchedCommands).toBe(0);
    expect(analyzed.data.unmatchedCommands.length).toBeGreaterThan(0);
  });

  it("zam_session_end redacts the synthesis and the log at rest", async () => {
    const token = await createToken(db, {
      slug: "npm-publish",
      concept: "Publish a package with npm",
      domain: "npm",
      bloom_level: 3,
    });
    await createAgentSkill(db, {
      slug: "publish-package",
      description: "Publish a package",
      steps: ["npm publish"],
      token_slugs: [token.slug],
    });
    const session = await startedSession();
    const path = writeRawLog(session, [
      `npm publish --otp ${SECRET}`,
      `export OTHER_TOKEN=${SECRET}`,
    ]);

    const ended = await call("zam_session_end", { session, synthesize: true });

    expect(ended.text).not.toContain(SECRET);
    expect(readFileSync(path, "utf8")).not.toContain(SECRET);
    expect(readFileSync(path, "utf8")).toContain("npm publish --otp [redacted]");
  });

  it("zam_observation_close keeps a digest and deletes the log", async () => {
    const session = await startedSession();
    const path = writeRawLog(session, ["git status", `git push https://bob:${SECRET}@x.test/r`]);

    const { data } = await call("zam_observation_close", {
      session,
      outcome: "dismissed",
    });

    expect(data).toMatchObject({
      sessionId: session,
      outcome: "dismissed",
      digested: true,
      deleted: ["monitor-log"],
    });
    expect(existsSync(path)).toBe(false);
    expect(readSessionDigest(session)?.prefixes).toEqual(["git status", "git push"]);

    const tools = await client.listTools();
    const close = tools.tools.find((t) => t.name === "zam_observation_close");
    expect(close?.annotations?.destructiveHint).toBe(true);
    expect(close?.annotations?.readOnlyHint).not.toBe(true);
    const monitor = tools.tools.find((t) => t.name === "zam_monitor");
    expect(monitor?.annotations?.readOnlyHint).toBe(true);
  });

  it("deletes nothing for an unknown session and refuses odd ids", async () => {
    const { data } = await call("zam_observation_close", {
      session: "01K7UNKNOWNSESSION000000000",
      outcome: "confirmed",
    });
    expect(data.deleted).toEqual([]);

    const response = (await client.callTool({
      name: "zam_observation_close",
      arguments: { session: "../../etc/passwd", outcome: "dismissed" },
    })) as { isError?: boolean; content: Array<{ text: string }> };
    expect(JSON.stringify(response)).toContain("Invalid session ID");
  });

  it("bridge discover-skills, get-monitor and observation-status stay redacted", async () => {
    const sessions: string[] = [];
    for (let i = 0; i < 3; i++) sessions.push(await startedSession());
    for (const session of sessions) {
      writeRawLog(session, [
        "git checkout -b feat/x",
        `npm config set //registry.npmjs.org/:_authToken ${SECRET}`,
        "npm run build",
      ]);
    }
    // One session is already closed: its digest stands in for the log.
    await call("zam_observation_close", { session: sessions[0], outcome: "confirmed" });

    const discovered = await executeBridgeCommandJson("discover-skills", []);
    expect(JSON.stringify(discovered)).not.toContain(SECRET);
    expect((discovered as { sessionsAnalyzed: number }).sessionsAnalyzed).toBe(3);
    expect((discovered as { proposals: unknown[] }).proposals.length).toBeGreaterThan(0);

    const monitor = await executeBridgeCommandJson("get-monitor", [
      "--session",
      sessions[1],
    ]);
    expect(JSON.stringify(monitor)).not.toContain(SECRET);

    const status = (await executeBridgeCommandJson("observation-status", [])) as {
      sessions: Array<{ sessionId: string }>;
      retentionDays: number;
      screenObservation: string;
    };
    expect(status.retentionDays).toBe(1);
    expect(status.screenObservation).toBe("off");
    expect(status.sessions.map((s) => s.sessionId).sort()).toEqual(
      sessions.slice(1).sort(),
    );
  });
});
