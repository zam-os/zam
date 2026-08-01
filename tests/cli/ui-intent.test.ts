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
import { afterEach, describe, expect, it } from "vitest";
import {
  getUiHostIntentPath,
  getUiHostsDirPath,
  getUiIntentPath,
  getUiHostRegistrationPath,
  type UiHostEntry,
  pruneUiHosts,
  publishUiIntent,
  selectUiHost,
  writeUiIntent,
} from "../../src/cli/ui-intent.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-ui-intent-"));
  tempDirs.push(dir);
  return dir;
}

const NOW = "2026-08-01T09:26:24.878Z";

function host(overrides: Partial<UiHostEntry> = {}): UiHostEntry {
  return {
    version: 2,
    hostId: "vscode-1",
    intentPath: "/home/thomas/.zam/intents/vscode-1.json",
    focused: false,
    updatedAt: NOW,
    ...overrides,
  };
}

/** Write a host entry into a temp home's registry. */
function registerHost(home: string, entry: UiHostEntry): string {
  const dir = getUiHostsDirPath(home);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${entry.hostId}.json`),
    JSON.stringify(entry),
    "utf8",
  );
  return entry.intentPath;
}

describe("VS Code UI intent", () => {
  it("uses one user-scoped handoff file", () => {
    expect(getUiIntentPath("/home/thomas")).toBe(
      join("/home/thomas", ".zam", "ui-intent.json"),
    );
  });

  it("atomically writes a focused MCP App request", async () => {
    const path = getUiIntentPath(tempHome());
    const intent = await writeUiIntent(
      "recall",
      { domain: "rag", user: undefined },
      {
        path,
        id: "01KX87ZQBE4QGDVJCBFX5PVWGW",
        now: () => new Date("2026-07-11T09:26:24.878Z"),
      },
    );

    expect(intent).toEqual({
      version: 1,
      id: "01KX87ZQBE4QGDVJCBFX5PVWGW",
      app: "recall",
      input: { domain: "rag" },
      createdAt: "2026-07-11T09:26:24.878Z",
    });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(intent);
  });

  it("keeps UI publication best-effort for hosts without the companion", async () => {
    // Sentinel: a path beneath a regular *file* cannot be created on any
    // platform. The previous POSIX sentinel (/dev/null/…) is a perfectly
    // creatable directory name on Windows and left stray C:\dev droppings
    // on every test run (issue #190).
    const home = tempHome();
    const blocker = join(home, "blocker-file");
    writeFileSync(blocker, "", "utf8");

    const intent = await publishUiIntent(
      "graph",
      { focus: "zam-mcp-server-architecture" },
      { path: join(blocker, "not-a-directory", "ui-intent.json") },
    );

    expect(intent).toBeUndefined();
  });

  it("publishes through a fresh VS Code host registration", async () => {
    const home = tempHome();
    const path = getUiIntentPath(home);
    const registrationPath = getUiHostRegistrationPath(home);
    mkdirSync(join(home, ".zam"), { recursive: true });
    writeFileSync(
      registrationPath,
      JSON.stringify({
        version: 1,
        intentPath: path,
        updatedAt: "2026-07-11T09:26:20.000Z",
      }),
      "utf8",
    );

    const intent = await publishUiIntent(
      "settings",
      {},
      {
        hostRegistrationPath: registrationPath,
        id: "01KX87ZQBE4QGDVJCBFX5PVWGW",
        now: () => new Date("2026-07-11T09:26:24.878Z"),
      },
    );

    expect(intent?.app).toBe("settings");
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(intent);
  });

  it("ignores a stale VS Code host registration", async () => {
    const home = tempHome();
    const path = getUiIntentPath(home);
    const registrationPath = getUiHostRegistrationPath(home);
    mkdirSync(join(home, ".zam"), { recursive: true });
    writeFileSync(
      registrationPath,
      JSON.stringify({
        version: 1,
        intentPath: path,
        updatedAt: "2026-07-11T09:25:00.000Z",
      }),
      "utf8",
    );

    const intent = await publishUiIntent(
      "recall",
      {},
      {
        hostRegistrationPath: registrationPath,
        now: () => new Date("2026-07-11T09:26:24.878Z"),
      },
    );

    expect(intent).toBeUndefined();
  });
});

describe("Companion host registry (multi-window)", () => {
  const now = Date.parse(NOW);

  it("gives every window its own intent file", () => {
    expect(getUiHostIntentPath("vscode-42", "/home/thomas")).toBe(
      join("/home/thomas", ".zam", "intents", "vscode-42.json"),
    );
    expect(getUiHostsDirPath("/home/thomas")).toBe(
      join("/home/thomas", ".zam", "hosts"),
    );
  });

  it("prefers the window whose workspace the publisher runs in", () => {
    const picked = selectUiHost(
      [
        host({ hostId: "a", workspace: "/src/other", focused: true }),
        host({
          hostId: "b",
          workspace: "/src/zam",
          intentPath: "/intents/b.json",
        }),
      ],
      { now, cwd: "/src/zam/docs/okf" },
    );

    // Focus must not outrank workspace affinity: opening a panel in the
    // window that merely has focus is the pre-0.25 bug.
    expect(picked?.hostId).toBe("b");
  });

  it("falls back to the focused window when no workspace matches", () => {
    const picked = selectUiHost(
      [
        host({ hostId: "a", workspace: "/src/other" }),
        host({ hostId: "b", workspace: "/src/another", focused: true }),
      ],
      { now, cwd: "/somewhere/else" },
    );

    expect(picked?.hostId).toBe("b");
  });

  it("breaks ties on the most recently focused window", () => {
    const picked = selectUiHost(
      [
        host({ hostId: "a", focusedAt: "2026-08-01T09:20:00.000Z" }),
        host({ hostId: "b", focusedAt: "2026-08-01T09:26:00.000Z" }),
      ],
      { now },
    );

    expect(picked?.hostId).toBe("b");
  });

  it("ignores windows whose heartbeat stopped", () => {
    expect(
      selectUiHost([host({ updatedAt: "2026-08-01T09:26:00.000Z" })], { now }),
    ).toBeUndefined();
  });

  it("still reaches an unfocused window", () => {
    // The pre-0.25 handoff only registered while a window had focus, so a
    // request published from a terminal-side agent reached nothing at all.
    const picked = selectUiHost([host({ hostId: "a", focused: false })], {
      now,
    });

    expect(picked?.hostId).toBe("a");
  });

  it("publishes into the registered window's own intent file", async () => {
    const home = tempHome();
    const intentPath = registerHost(
      home,
      host({
        hostId: "vscode-7",
        intentPath: getUiHostIntentPath("vscode-7", home),
        workspace: "/src/zam",
        focused: true,
      }),
    );

    const intent = await publishUiIntent(
      "graph",
      {},
      {
        hostRegistrationPath: getUiHostRegistrationPath(home),
        cwd: "/src/zam",
        now: () => new Date(NOW),
      },
    );

    expect(intent?.app).toBe("graph");
    expect(JSON.parse(readFileSync(intentPath, "utf8"))).toEqual(intent);
    // The shared legacy file must stay untouched, or a second window would
    // pick the request up as well.
    expect(existsSync(getUiIntentPath(home))).toBe(false);
  });

  it("falls back to the legacy registration when no window registered", async () => {
    const home = tempHome();
    const legacyPath = getUiIntentPath(home);
    mkdirSync(join(home, ".zam"), { recursive: true });
    writeFileSync(
      getUiHostRegistrationPath(home),
      JSON.stringify({
        version: 1,
        intentPath: legacyPath,
        updatedAt: "2026-08-01T09:26:20.000Z",
      }),
      "utf8",
    );

    const intent = await publishUiIntent(
      "settings",
      {},
      {
        hostRegistrationPath: getUiHostRegistrationPath(home),
        now: () => new Date(NOW),
      },
    );

    expect(intent?.app).toBe("settings");
    expect(JSON.parse(readFileSync(legacyPath, "utf8"))).toEqual(intent);
  });

  it("drops entries and intent files of windows that died", async () => {
    const home = tempHome();
    const dead = getUiHostIntentPath("vscode-dead", home);
    registerHost(
      home,
      host({
        hostId: "vscode-dead",
        intentPath: dead,
        updatedAt: "2026-08-01T09:20:00.000Z",
      }),
    );
    const alive = getUiHostIntentPath("vscode-alive", home);
    registerHost(home, host({ hostId: "vscode-alive", intentPath: alive }));
    mkdirSync(join(home, ".zam", "intents"), { recursive: true });
    writeFileSync(dead, "{}", "utf8");

    await pruneUiHosts(getUiHostsDirPath(home), { now });

    expect(existsSync(join(getUiHostsDirPath(home), "vscode-dead.json"))).toBe(
      false,
    );
    expect(existsSync(dead)).toBe(false);
    expect(existsSync(join(getUiHostsDirPath(home), "vscode-alive.json"))).toBe(
      true,
    );
  });

  it("skips a half-written registry entry instead of failing the publish", async () => {
    const home = tempHome();
    const dir = getUiHostsDirPath(home);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "vscode-torn.json"), "{ not json", "utf8");
    const intentPath = registerHost(
      home,
      host({
        hostId: "vscode-good",
        intentPath: getUiHostIntentPath("vscode-good", home),
        focused: true,
      }),
    );

    const intent = await publishUiIntent(
      "recall",
      {},
      {
        hostRegistrationPath: getUiHostRegistrationPath(home),
        now: () => new Date(NOW),
      },
    );

    expect(JSON.parse(readFileSync(intentPath, "utf8"))).toEqual(intent);
  });
});
