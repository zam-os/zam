import {
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
  getUiIntentPath,
  getUiHostRegistrationPath,
  publishUiIntent,
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
