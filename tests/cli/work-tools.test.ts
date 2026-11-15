import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRE_APPROVED_TOOLS } from "../../src/cli/agent-approval.js";
import { endSession as handleEndSession } from "../../src/cli/bridge-handlers.js";
import {
  createMcpServer,
  STUDIO_BRIDGE_COMMANDS,
} from "../../src/cli/commands/mcp.js";
import {
  workClose,
  workHandOver,
  workPlan,
} from "../../src/cli/work-handlers.js";
import {
  type Database,
  openDatabase,
  setSetting,
  startSession,
} from "../../src/kernel/index.js";

const WORK_TOOLS = ["zam_work_plan", "zam_work_hand_over", "zam_work_close"];

/** The agent's caller, the learner's interface, a manual test after both. */
const PLAN = [
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
] as const;

describe("guided-work handlers", () => {
  let tempDir: string;
  let db: Database;
  let session: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-work-tools-"));
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    session = (await startSession(db, { user_id: "thomas", task: "Interface" }))
      .id;
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  const plan = () => workPlan(db, { session, subtasks: [...PLAN] });

  it("tells the agent on the first plan to create board items only after the learner chose", async () => {
    const res = await plan();

    expect(res.subtasks).toHaveLength(3);
    expect(res.instruction).toContain(
      "board items only after the learner chose",
    );
    expect(res.instruction).toContain(
      `Do not write the learner's subtask 2 ("Add the interface")`,
    );
    expect(res.instruction).toContain("Do your own subtask 1");
  });

  it("asks the learner to take the hardest subtasks while none is theirs", async () => {
    const res = await workPlan(db, {
      session,
      subtasks: [
        { ordinal: 1, title: "Caller", kind: "text", owner: "agent" },
        { ordinal: 2, title: "Interface", kind: "text", owner: "agent" },
      ],
    });

    expect(res.instruction).toContain("hardest for them");
    expect(res.instruction).toContain("setting owner user");
  });

  it("does not repeat the first-plan advice on a later plan", async () => {
    await plan();
    const res = await workPlan(db, {
      session,
      subtasks: [{ ordinal: 2, externalRef: "AB#12" }],
    });

    expect(res.instruction).not.toContain("board items only after");
    expect(res.subtasks[1].external_ref).toBe("AB#12");
  });

  it("says to hand over once only the learner's subtask is left, and to stop after it", async () => {
    await plan();
    const afterClose = await workClose(db, {
      session,
      subtask: 1,
      doneBy: "agent",
      checked: "passed",
    });
    expect(afterClose.instruction).toContain(
      "call zam_work_hand_over for subtask 2",
    );
    expect(afterClose.instruction).toContain("last call this turn");

    const handed = await workHandOver(db, { session, subtask: 2 });
    expect(handed.instruction).toMatch(/^End your turn now\./);
    expect(handed.instruction).toContain("The failing test passes");
    expect(handed.instruction).toContain("Wait for the learner.");
  });

  it("asks for a colleague's review after the learner's subtask, never about who did it", async () => {
    await plan();
    await workPlan(db, {
      session,
      subtasks: [{ ordinal: 2, externalRef: "https://dev.example/item/2" }],
    });
    await workClose(db, {
      session,
      subtask: 1,
      doneBy: "agent",
      checked: "passed",
    });
    await workHandOver(db, { session, subtask: 2 });

    const res = await workClose(db, {
      session,
      subtask: 2,
      doneBy: "user",
      checked: "passed",
      help: "pointer",
    });

    expect(res.instruction).toContain("Review this subtask with the learner");
    expect(res.instruction).toContain(
      "Never ask whether they did it themselves",
    );
    expect(res.instruction).toContain(
      "Update its board item (https://dev.example/item/2)",
    );
    expect(res.instruction).toContain("Do your own subtask 3");
  });

  it("leads to the record at the end once every subtask has ended", async () => {
    await plan();
    await workClose(db, {
      session,
      subtask: 1,
      doneBy: "agent",
      checked: "passed",
    });
    await workHandOver(db, { session, subtask: 2 });
    await workClose(db, {
      session,
      subtask: 2,
      doneBy: "user",
      checked: "passed",
    });
    const res = await workClose(db, {
      session,
      subtask: 3,
      doneBy: "agent",
      checked: "not_checked",
    });

    expect(res.instruction).toContain("Draw up the record at the end");
    expect(res.instruction).toContain("independent true");
    expect(res.instruction).toContain("Never pass a tokenId");
  });

  it("passes the kernel's refusals through", async () => {
    await plan();

    await expect(
      workClose(db, { session, subtask: 2, doneBy: "user", checked: "passed" }),
    ).rejects.toThrow(/was not handed over/);
    await expect(workHandOver(db, { session, subtask: 1 })).rejects.toThrow(
      /not the learner's/,
    );
  });

  it("treats another learner's session as missing", async () => {
    const theirs = (
      await startSession(db, { user_id: "someone-else", task: "Theirs" })
    ).id;

    await expect(
      workPlan(db, { session: theirs, subtasks: [] }),
    ).rejects.toThrow(`Session not found: ${theirs}`);
  });

  it("reads the list with an empty plan and returns it with the end of the session", async () => {
    await plan();
    const read = await workPlan(db, { session, subtasks: [] });
    expect(read.subtasks.map((s) => s.ordinal)).toEqual([1, 2, 3]);

    const ended = await handleEndSession(db, { session });
    expect(ended.subtasks.map((s) => s.title)).toEqual([
      "Write the caller",
      "Add the interface",
      "Test by hand",
    ]);
  });
});

describe("guided-work MCP tools", () => {
  let tempDir: string;
  let db: Database;
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-work-mcp-"));
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client(
      { name: "test", version: "1.0.0" },
      { capabilities: {} },
    );
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
    await db.close();
    rmSync(tempDir, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 100,
    });
  });

  async function call(name: string, args: Record<string, unknown>) {
    const res = (await client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };
    return { isError: res.isError, text: res.content[0].text };
  }

  it("lists the three tools, none of them pre-approved or open to the Studio", async () => {
    const { tools } = await client.listTools();
    for (const name of WORK_TOOLS) {
      const tool = tools.find((t) => t.name === name);
      expect(tool, name).toBeDefined();
      expect(tool?.annotations?.destructiveHint).toBe(false);
      expect(PRE_APPROVED_TOOLS).not.toContain(name);
    }
    for (const command of ["work-plan", "work-hand-over", "work-close"]) {
      expect(Object.keys(STUDIO_BRIDGE_COMMANDS)).not.toContain(command);
    }
  });

  it("carries a session from plan through hand-over to close", async () => {
    const started = JSON.parse(
      (await call("zam_session_start", { task: "Interface" })).text,
    );

    const planned = await call("zam_work_plan", {
      session: started.id,
      subtasks: PLAN,
    });
    expect(planned.isError).toBeFalsy();
    expect(JSON.parse(planned.text).subtasks).toHaveLength(3);

    await call("zam_work_close", {
      session: started.id,
      subtask: 1,
      doneBy: "agent",
      checked: "passed",
    });
    const handed = JSON.parse(
      (await call("zam_work_hand_over", { session: started.id, subtask: 2 }))
        .text,
    );
    expect(handed.instruction).toMatch(/^End your turn now\./);

    const closed = JSON.parse(
      (
        await call("zam_work_close", {
          session: started.id,
          subtask: 2,
          doneBy: "user",
          checked: "passed",
          commit: "444bbadc",
        })
      ).text,
    );
    expect(closed.subtasks[1]).toMatchObject({
      state: "done",
      done_by: "user",
      commit_id: "444bbadc",
    });
  });

  it("returns a refusal as a tool error", async () => {
    const started = JSON.parse(
      (await call("zam_session_start", { task: "Interface" })).text,
    );
    await call("zam_work_plan", { session: started.id, subtasks: PLAN });

    const refused = await call("zam_work_close", {
      session: started.id,
      subtask: 1,
      doneBy: "user",
      checked: "passed",
    });
    expect(refused.isError).toBe(true);
    expect(refused.text).toContain("is the agent's");
  });
});

describe("guided-work bridge commands", () => {
  const tsxImport = import.meta.resolve("tsx");
  const cliPath = join(process.cwd(), "src", "cli", "index.ts");
  let tempHome: string;
  let session: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-work-bridge-"));
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    session = (await startSession(db, { user_id: "thomas", task: "Interface" }))
      .id;
    await db.close();
  });

  afterEach(() => {
    rmSync(tempHome, { recursive: true, force: true });
  });

  /** Runs a bridge command and returns its JSON, whether it succeeded or not. */
  function runBridge(args: string[], stdin = ""): any {
    try {
      const output = execFileSync(
        process.execPath,
        ["--import", tsxImport, cliPath, "bridge", ...args],
        {
          cwd: tempHome,
          env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
          input: stdin,
          encoding: "utf8",
        },
      );
      return JSON.parse(output);
    } catch (err: any) {
      return JSON.parse(err.stdout || err.stderr);
    }
  }

  it("plans from stdin, hands over and closes, all in JSON", () => {
    const planned = runBridge(
      ["work-plan", "--session", session],
      JSON.stringify({ subtasks: PLAN }),
    );
    expect(planned.subtasks).toHaveLength(3);

    runBridge([
      "work-close",
      "--session",
      session,
      "--subtask",
      "1",
      "--done-by",
      "agent",
      "--checked",
      "passed",
    ]);
    const handed = runBridge([
      "work-hand-over",
      "--session",
      session,
      "--subtask",
      "2",
    ]);
    expect(handed.instruction).toMatch(/^End your turn now\./);

    const closed = runBridge([
      "work-close",
      "--session",
      session,
      "--subtask",
      "2",
      "--done-by",
      "user",
      "--checked",
      "passed",
      "--help-given",
      "pattern",
    ]);
    expect(closed.subtasks[1]).toMatchObject({
      done_by: "user",
      help: "pattern",
    });
  });

  it("answers every error in JSON", () => {
    expect(
      runBridge(["work-plan", "--session", session], "not json").error,
    ).toMatch(/Invalid JSON/);
    expect(
      runBridge(["work-hand-over", "--session", session, "--subtask", "12"])
        .error,
    ).toMatch(/from 1 to 9/);
    expect(
      runBridge(["work-plan", "--session", "missing"], "[]").error,
    ).toMatch(/Session not found/);
  });
});
