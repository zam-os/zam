# Resilient Self-Update and Dependency-Failure Isolation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ADR [2026-07-07](../adr/2026-07-07-resilient-self-update-and-dependency-isolation.md): lazy-load the MCP transport out of the CLI's eager module graph, verify developer self-updates with a kernel-planned smoke test (+ one-shot `npm ci` clean-room retry), and invert the CLI entry into a builtins-only bootstrap that classifies load failures and auto-heals developer checkouts.

**Architecture:** `src/cli/index.ts` becomes a tiny bootstrap (Node builtins + bundled pure logic) that `await import()`s the real program, now in `src/cli/app.ts`. The MCP command becomes a stub whose action dynamically imports `commands/mcp.js`, built as its own dist output so `@modelcontextprotocol/sdk`/`zod` leave the eager graph. The kernel's `planUpdate` gains a `smoke-test` step; the CLI executor implements it with a `--version` spawn and an `npm ci` retry.

**Tech Stack:** TypeScript (ESM, `.js` import suffixes), tsup/esbuild, Commander, Vitest, Biome.

## Global Constraints

- Node >= 22 (`engines`); ESM throughout; relative imports use `.js` suffixes.
- `npm run lint` (Biome) must pass — note: no assignment-in-expression; Biome organizes imports (alphabetical, `node:` first).
- `npm run test` (Vitest) must pass after every task; run single files as `npm run test -- tests/kernel/update-check.test.ts`.
- Commit format: `<type>: <short summary>` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).
- Kernel (`src/kernel/`) must not import CLI or LLM code. New learning logic → kernel; these tasks only touch `update-check.ts` there.
- The bootstrap bundle (`dist/cli/index.js`) may depend on **Node builtins only** (its relative import of `./bootstrap/logic.js` is compiled in; `./app.js` stays external at runtime).
- All bootstrap/heal diagnostics go to **stderr**, never stdout (`zam mcp` stdout carries JSON-RPC frames — `tests/cli/mcp.test.ts` "stdout purity" spawn test enforces this).
- Env contract: `ZAM_BOOTSTRAP_HEALED=1` marks a completed heal (loop guard); `ZAM_NO_AUTO_HEAL=1` disables auto-heal.
- Working branch: `fix/resilient-self-update` (already created; ADR committed).

---

### Task 1: Kernel `smoke-test` step in `planUpdate`

**Files:**
- Modify: `src/kernel/system/update-check.ts` (types at ~line 146, `planUpdate` developer branch at ~line 171)
- Test: `tests/kernel/update-check.test.ts` (developer-plan assertion at lines 117–124)

**Interfaces:**
- Consumes: existing `UpdateStepKind`, `planUpdate(decision)`.
- Produces: `UpdateStepKind` union extended with `"smoke-test"`; developer plan order `["git-pull","npm-install","npm-build","smoke-test","distribute-skills"]`; the new step's `label` is `"Verify the rebuilt CLI launches"` (Task 5's executor and the `zam update` preview rendering rely on kind + label only).

- [ ] **Step 1: Extend the failing test**

In `tests/kernel/update-check.test.ts`, replace the developer-plan test (lines 117–124) with:

```ts
  it("plans pull → install → build → smoke-test → skills for a developer install", () => {
    expect(planUpdate(upgrade("developer")).map((s) => s.kind)).toEqual([
      "git-pull",
      "npm-install",
      "npm-build",
      "smoke-test",
      "distribute-skills",
    ]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/kernel/update-check.test.ts`
Expected: FAIL — received array missing `"smoke-test"`.

- [ ] **Step 3: Implement the step**

In `src/kernel/system/update-check.ts`:

Extend the union (currently `"git-pull" | "npm-install" | "npm-build" | "distribute-skills" | "run-command" | "self-update"`):

```ts
export type UpdateStepKind =
  | "git-pull"
  | "npm-install"
  | "npm-build"
  | "smoke-test"
  | "distribute-skills"
  | "run-command"
  | "self-update";
```

In `planUpdate`'s `case "developer":` array, insert between the `npm-build` and `distribute-skills` entries:

```ts
        { kind: "smoke-test", label: "Verify the rebuilt CLI launches" },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/kernel/update-check.test.ts`
Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add src/kernel/system/update-check.ts tests/kernel/update-check.test.ts
git commit -m "feat: add smoke-test step to the developer update plan"
```

---

### Task 2: Pure bootstrap logic (`classifyLoadError`, `planRecovery`, `readInstallChannel`)

**Files:**
- Create: `src/cli/bootstrap/logic.ts`
- Test: `tests/cli/bootstrap-logic.test.ts`

**Interfaces:**
- Consumes: nothing (Node-builtin-free pure module; not even `node:` imports).
- Produces (Task 4 imports these exact names from `./bootstrap/logic.js`):
  - `type LoadErrorKind = "missing-package" | "stale-build" | "native-abi" | "unknown"`
  - `interface LoadErrorClassification { kind: LoadErrorKind; subject?: string }`
  - `function classifyLoadError(err: unknown): LoadErrorClassification`
  - `interface RecoveryContext { channel: string; repoRoot: string | null; hasGit: boolean; healedFlag: boolean; noAutoHeal: boolean }`
  - `interface RecoveryPlan { mode: "auto-heal" | "instruct" | "passthrough"; commands: string[][]; message: string }`
  - `function planRecovery(c: LoadErrorClassification, ctx: RecoveryContext): RecoveryPlan`
  - `function readInstallChannel(configPath: string, readFile: (p: string) => string): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/cli/bootstrap-logic.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  classifyLoadError,
  planRecovery,
  readInstallChannel,
  type RecoveryContext,
} from "../../src/cli/bootstrap/logic.js";

function nodeError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

const devCtx: RecoveryContext = {
  channel: "developer",
  repoRoot: "C:\\src\\github\\zam",
  hasGit: true,
  healedFlag: false,
  noAutoHeal: false,
};

describe("classifyLoadError", () => {
  it("classifies a missing bare package", () => {
    const c = classifyLoadError(
      nodeError(
        "ERR_MODULE_NOT_FOUND",
        "Cannot find package '@modelcontextprotocol/sdk' imported from C:\\x\\dist\\cli\\app.js",
      ),
    );
    expect(c).toEqual({
      kind: "missing-package",
      subject: "@modelcontextprotocol/sdk",
    });
  });

  it("classifies a missing module file as a stale build", () => {
    const c = classifyLoadError(
      nodeError(
        "ERR_MODULE_NOT_FOUND",
        "Cannot find module 'C:\\x\\dist\\cli\\app.js' imported from C:\\x\\dist\\cli\\index.js",
      ),
    );
    expect(c.kind).toBe("stale-build");
    expect(c.subject).toContain("app.js");
  });

  it("classifies a native loader failure", () => {
    const c = classifyLoadError(
      nodeError(
        "ERR_DLOPEN_FAILED",
        "The module 'better_sqlite3.node' was compiled against a different Node.js version",
      ),
    );
    expect(c).toEqual({ kind: "native-abi", subject: "better_sqlite3" });
  });

  it("passes everything else through as unknown", () => {
    expect(classifyLoadError(new Error("boom")).kind).toBe("unknown");
    expect(classifyLoadError(undefined).kind).toBe("unknown");
    expect(classifyLoadError(nodeError("ENOENT", "no such file")).kind).toBe(
      "unknown",
    );
  });
});

describe("planRecovery", () => {
  it("auto-heals a missing package on a developer checkout: install then build", () => {
    const plan = planRecovery({ kind: "missing-package", subject: "zod" }, devCtx);
    expect(plan.mode).toBe("auto-heal");
    expect(plan.commands).toEqual([
      ["npm", "install"],
      ["npm", "run", "build"],
    ]);
    expect(plan.message).toContain('"zod"');
  });

  it("rebuilds only for a stale build", () => {
    const plan = planRecovery({ kind: "stale-build", subject: "./app.js" }, devCtx);
    expect(plan.mode).toBe("auto-heal");
    expect(plan.commands).toEqual([["npm", "run", "build"]]);
  });

  it("npm-rebuilds the named native module", () => {
    const plan = planRecovery(
      { kind: "native-abi", subject: "better_sqlite3" },
      devCtx,
    );
    expect(plan.mode).toBe("auto-heal");
    expect(plan.commands).toEqual([["npm", "rebuild", "better_sqlite3"]]);
  });

  it("only instructs when any heal guard blocks", () => {
    const overrides: Partial<RecoveryContext>[] = [
      { channel: "direct" },
      { repoRoot: null },
      { hasGit: false },
      { healedFlag: true },
      { noAutoHeal: true },
    ];
    for (const override of overrides) {
      const plan = planRecovery(
        { kind: "missing-package", subject: "zod" },
        { ...devCtx, ...override },
      );
      expect(plan.mode).toBe("instruct");
      expect(plan.message).toContain("npm install");
    }
  });

  it("mentions the failed self-heal when instructing after one already ran", () => {
    const plan = planRecovery(
      { kind: "missing-package" },
      { ...devCtx, healedFlag: true },
    );
    expect(plan.message).toContain("self-heal already ran");
  });

  it("passes unknown errors through untouched", () => {
    const plan = planRecovery({ kind: "unknown" }, devCtx);
    expect(plan.mode).toBe("passthrough");
    expect(plan.commands).toEqual([]);
  });
});

describe("readInstallChannel", () => {
  it("prefers an explicit channel", () => {
    expect(readInstallChannel("p", () => '{"channel":"homebrew"}')).toBe(
      "homebrew",
    );
  });

  it("derives developer from mode or absence", () => {
    expect(readInstallChannel("p", () => '{"mode":"developer"}')).toBe(
      "developer",
    );
    expect(readInstallChannel("p", () => "{}")).toBe("developer");
  });

  it("derives direct from a non-developer mode", () => {
    expect(readInstallChannel("p", () => '{"mode":"default"}')).toBe("direct");
  });

  it("falls back to developer when the config is unreadable", () => {
    expect(
      readInstallChannel("p", () => {
        throw new Error("ENOENT");
      }),
    ).toBe("developer");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/cli/bootstrap-logic.test.ts`
Expected: FAIL — cannot resolve `../../src/cli/bootstrap/logic.js`.

- [ ] **Step 3: Implement the module**

Create `src/cli/bootstrap/logic.ts`:

```ts
/**
 * Pure decision logic for the CLI bootstrap (src/cli/index.ts): classify a
 * load-time failure and plan the recovery. No side effects and no imports —
 * this module is compiled into the bootstrap bundle, which must stay loadable
 * when node_modules is broken (ADR 2026-07-07).
 */

export type LoadErrorKind =
  | "missing-package"
  | "stale-build"
  | "native-abi"
  | "unknown";

export interface LoadErrorClassification {
  kind: LoadErrorKind;
  /** The missing package, missing module path, or native module, if known. */
  subject?: string;
}

export function classifyLoadError(err: unknown): LoadErrorClassification {
  const code = (err as { code?: string } | null | undefined)?.code;
  const message = err instanceof Error ? err.message : String(err ?? "");

  if (code === "ERR_MODULE_NOT_FOUND") {
    // Node phrases a bare-specifier miss as "Cannot find package 'x'" and a
    // path miss (stale/partial dist) as "Cannot find module '/path/to/x.js'".
    const pkg = message.match(/Cannot find package '([^']+)'/);
    if (pkg) return { kind: "missing-package", subject: pkg[1] };
    const mod = message.match(/Cannot find module '([^']+)'/);
    if (mod) return { kind: "stale-build", subject: mod[1] };
    return { kind: "missing-package" };
  }
  if (code === "ERR_DLOPEN_FAILED") {
    const native = message.match(/([\w-]+)\.node/);
    return { kind: "native-abi", subject: native?.[1] };
  }
  return { kind: "unknown" };
}

export interface RecoveryContext {
  /** Install channel from ~/.zam/config.json; only "developer" may heal. */
  channel: string;
  /** Nearest ancestor of the bootstrap holding package.json, if any. */
  repoRoot: string | null;
  /** Whether repoRoot also holds .git (false for packaged bundles). */
  hasGit: boolean;
  /** ZAM_BOOTSTRAP_HEALED=1 — a self-heal already ran in a parent process. */
  healedFlag: boolean;
  /** ZAM_NO_AUTO_HEAL=1 — explicit opt-out. */
  noAutoHeal: boolean;
}

export interface RecoveryPlan {
  mode: "auto-heal" | "instruct" | "passthrough";
  /** Commands to run in repoRoot (auto-heal) or to surface (instruct). */
  commands: string[][];
  /** stderr copy: heal banner or instruction text. Empty for passthrough. */
  message: string;
}

function remedyCommands(c: LoadErrorClassification): string[][] {
  switch (c.kind) {
    case "missing-package":
      return [
        ["npm", "install"],
        ["npm", "run", "build"],
      ];
    case "stale-build":
      return [["npm", "run", "build"]];
    case "native-abi":
      return [["npm", "rebuild", c.subject ?? ""].filter(Boolean)];
    default:
      return [];
  }
}

function describeFailure(c: LoadErrorClassification): string {
  switch (c.kind) {
    case "missing-package":
      return c.subject
        ? `the dependency "${c.subject}" is not installed (node_modules is out of sync with package.json)`
        : "a dependency is not installed (node_modules is out of sync with package.json)";
    case "stale-build":
      return `the build output is stale or incomplete (${c.subject ?? "missing module"})`;
    case "native-abi":
      return `a native module failed to load (Node ABI mismatch${c.subject ? `: ${c.subject}` : ""})`;
    default:
      return "an unexpected error";
  }
}

export function planRecovery(
  c: LoadErrorClassification,
  ctx: RecoveryContext,
): RecoveryPlan {
  if (c.kind === "unknown") {
    return { mode: "passthrough", commands: [], message: "" };
  }

  const commands = remedyCommands(c);
  const rendered = commands.map((cmd) => cmd.join(" ")).join(" && ");
  const where = ctx.repoRoot ?? "your ZAM source checkout";

  const healable =
    ctx.channel === "developer" &&
    ctx.repoRoot !== null &&
    ctx.hasGit &&
    !ctx.healedFlag &&
    !ctx.noAutoHeal;

  if (healable) {
    return {
      mode: "auto-heal",
      commands,
      message: `zam: ${describeFailure(c)} — self-healing (${rendered}) in ${where}`,
    };
  }
  return {
    mode: "instruct",
    commands,
    message:
      `zam cannot start: ${describeFailure(c)}.\n` +
      `Fix: run \`${rendered}\` in ${where}` +
      (ctx.healedFlag
        ? "\n(an automatic self-heal already ran and did not resolve it — try `npm ci && npm run build`, and check your Node version)"
        : ""),
  };
}

/**
 * Read the install channel from ~/.zam/config.json without importing kernel
 * code. Mirrors kernel/system/install-config.ts getInstallChannel(): explicit
 * channel wins; otherwise mode "developer" (or absent/unreadable) → developer,
 * any other mode → direct.
 */
export function readInstallChannel(
  configPath: string,
  readFile: (p: string) => string,
): string {
  try {
    const parsed = JSON.parse(readFile(configPath)) as {
      mode?: string;
      channel?: string;
    };
    if (parsed.channel) return parsed.channel;
    return (parsed.mode ?? "developer") === "developer"
      ? "developer"
      : "direct";
  } catch {
    return "developer";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/cli/bootstrap-logic.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/cli/bootstrap/logic.ts tests/cli/bootstrap-logic.test.ts
git commit -m "feat: pure load-failure classification and recovery planning for the CLI bootstrap"
```

---

### Task 3: Invert the entry and lazy-load the MCP transport

**Files:**
- Create: `src/cli/app.ts` (the program, moved from `index.ts`)
- Modify: `src/cli/index.ts` (becomes a minimal passthrough bootstrap; Task 4 completes it)
- Modify: `src/cli/commands/mcp.ts` (extract `runMcpServer`; drop `mcpCommand`)
- Modify: `tsup.config.ts` (three CLI outputs)
- Test: `tests/cli/app-shape.test.ts` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `src/cli/app.ts` (default-less module; running it executes the CLI — ends in `await program.parseAsync()`); `runMcpServer(): Promise<void>` exported from `commands/mcp.ts` (`createMcpServer(db)` stays exported and unchanged for `tests/cli/mcp.test.ts`); dist layout `dist/cli/index.js` (bootstrap, shebang), `dist/cli/app.js`, `dist/cli/commands/mcp.js`. Task 4 rewrites only `src/cli/index.ts`.

- [ ] **Step 1: Write the failing shape test**

Create `tests/cli/app-shape.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards ADR 2026-07-07 Decision 1: the MCP transport (and with it
// @modelcontextprotocol/sdk and zod) must never enter the eager module graph,
// and the bootstrap must stay dependency-free so it always loads.
describe("CLI module-graph shape", () => {
  const read = (...p: string[]) =>
    readFileSync(join(process.cwd(), ...p), "utf-8");

  it("app.ts imports the MCP command only lazily", () => {
    const app = read("src", "cli", "app.ts");
    expect(app).not.toMatch(/^import .*commands\/mcp\.js/m);
    expect(app).toContain('import("./commands/mcp.js")');
  });

  it("the bootstrap imports only Node builtins, ./app.js, and bootstrap logic", () => {
    const bootstrap = read("src", "cli", "index.ts");
    const specifiers = [
      ...bootstrap.matchAll(/from "([^"]+)"|import\("([^"]+)"\)/g),
    ]
      .map((m) => m[1] ?? m[2])
      .filter((s): s is string => Boolean(s));
    expect(specifiers.length).toBeGreaterThan(0);
    for (const s of specifiers) {
      expect(
        s.startsWith("node:") || s === "./app.js" || s.startsWith("./bootstrap/"),
        `unexpected bootstrap import: ${s}`,
      ).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/cli/app-shape.test.ts`
Expected: FAIL — `src/cli/app.ts` does not exist (ENOENT).

- [ ] **Step 3: Create `src/cli/app.ts`**

Copy the entire current content of `src/cli/index.ts` into `src/cli/app.ts`, then apply exactly two changes:

1. Delete the line `import { mcpCommand } from "./commands/mcp.js";`
2. Replace the line `program.addCommand(mcpCommand);` with:

```ts
program.addCommand(
  // Stub: the MCP transport's deps (@modelcontextprotocol/sdk, zod) load only
  // when `zam mcp` actually runs (ADR 2026-07-07). Import failures bubble to
  // the bootstrap, which classifies and self-heals them.
  new Command("mcp")
    .description("Launch the Model Context Protocol (MCP) server over Stdio")
    .action(async () => {
      const { runMcpServer } = await import("./commands/mcp.js");
      await runMcpServer();
    }),
);
```

Everything else (the `package.json` version read, all other command imports and registrations, the final `await program.parseAsync();`) stays verbatim.

- [ ] **Step 4: Replace `src/cli/index.ts` with the minimal bootstrap**

Full new content of `src/cli/index.ts` (Task 4 expands the catch; keep it minimal here so this task stays behavior-neutral):

```ts
/**
 * CLI entry — a bootstrap that stays loadable even when node_modules or the
 * build is broken (ADR 2026-07-07). The real program lives in ./app.js; this
 * bundle depends only on Node builtins so it can diagnose and heal a broken
 * dependency tree instead of crashing before it can help.
 */
await import("./app.js");
```

- [ ] **Step 5: Extract `runMcpServer` in `src/cli/commands/mcp.ts`**

Replace the trailing `export const mcpCommand = new Command("mcp")…` block (currently lines 585–616) with a plain exported function containing the identical action body:

```ts
export async function runMcpServer(): Promise<void> {
  // Rebind console.log to console.error immediately to prevent stdio transport corruption
  console.log = console.error;

  const db = await openDatabase();
  const server = createMcpServer(db);

  let dbClosed = false;
  async function cleanup() {
    if (dbClosed) return;
    dbClosed = true;
    try {
      await server.close();
    } catch {}
    try {
      await db.close();
    } catch {}
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  const transport = new StdioServerTransport();
  transport.onclose = () => {
    cleanup();
  };

  await server.connect(transport);
}
```

Then delete `import { Command } from "commander";` from `mcp.ts` (it is now unused — Biome fails on unused imports).

- [ ] **Step 6: Rework `tsup.config.ts`**

Full new content:

```ts
import { defineConfig } from "tsup";

export default defineConfig([
  {
    // The bin bootstrap. `./app.js` stays a runtime import (external) so a
    // stale or half-built dist is caught and classified rather than inlined
    // away; the bundle itself must depend on Node builtins only.
    entry: { "cli/index": "src/cli/index.ts" },
    outDir: "dist",
    format: ["esm"],
    clean: true,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
    external: ["./app.js"],
  },
  {
    // The program, plus the MCP transport as its own bundle so that
    // @modelcontextprotocol/sdk and zod stay out of the eager module graph
    // (ADR 2026-07-07). app.ts's dynamic import of "./commands/mcp.js"
    // resolves at runtime against the mcp bundle below.
    entry: {
      "cli/app": "src/cli/app.ts",
      "cli/commands/mcp": "src/cli/commands/mcp.ts",
    },
    outDir: "dist",
    format: ["esm"],
    sourcemap: true,
    external: ["./commands/mcp.js"],
  },
  {
    entry: { index: "src/index.ts" },
    outDir: "dist",
    format: ["esm"],
    dts: true,
    sourcemap: true,
  },
]);
```

- [ ] **Step 7: Build and verify the dist shape**

```bash
npm run build
node dist/cli/index.js --version                      # expect: 0.9.0
node dist/cli/index.js --help | grep -c "mcp"          # expect: >= 1
grep -c "@modelcontextprotocol" dist/cli/app.js        # expect: 1 (the stub comment only — no code)
grep -c "McpServer" dist/cli/app.js                    # expect: 0 (no SDK code in the eager bundle)
grep -c "@modelcontextprotocol" dist/cli/commands/mcp.js  # expect: >= 1
```

(The stub's mandated comment itself names the SDK package, so a bare package-name grep on `app.js` hits exactly once. The binding check is the absence of SDK *code*: if `McpServer` appears in `dist/cli/app.js`, the dynamic import got inlined — re-check the `external: ["./commands/mcp.js"]` entry.)

- [ ] **Step 8: Run the full suite (mcp spawn test covers the lazy path)**

Run: `npm run test`
Expected: PASS — in particular `tests/cli/mcp.test.ts` ("stdout purity" spawns `src/cli/index.ts mcp` via tsx, now exercising bootstrap → app → stub → dynamic import) and `tests/cli/app-shape.test.ts`.

- [ ] **Step 9: Lint and commit**

```bash
npm run lint
git add src/cli/app.ts src/cli/index.ts src/cli/commands/mcp.ts tsup.config.ts tests/cli/app-shape.test.ts
git commit -m "refactor: invert CLI entry and lazy-load the MCP transport out of the eager graph"
```

---

### Task 4: Bootstrap classification, auto-heal, and re-exec

**Files:**
- Modify: `src/cli/index.ts` (full bootstrap behavior)
- Test: covered by `tests/cli/bootstrap-logic.test.ts` (Task 2) + the fault-injection checks below; the spawn/exec shell is deliberately thin.

**Interfaces:**
- Consumes: `classifyLoadError`, `planRecovery`, `readInstallChannel` from `./bootstrap/logic.js` (Task 2 signatures).
- Produces: the final `dist/cli/index.js` behavior contract — env vars `ZAM_BOOTSTRAP_HEALED` / `ZAM_NO_AUTO_HEAL`; all diagnostics on stderr; exit code = child's exit code after a heal re-exec, `1` on instruct/failed heal, rethrow (Node default print, exit 1) on passthrough.

- [ ] **Step 1: Write the full bootstrap**

Replace the entire content of `src/cli/index.ts` with:

```ts
/**
 * CLI entry — a bootstrap that stays loadable even when node_modules or the
 * build is broken (ADR 2026-07-07). The real program lives in ./app.js; this
 * bundle depends only on Node builtins. Load failures are classified and, on
 * a developer checkout, healed automatically (opt out: ZAM_NO_AUTO_HEAL=1).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyLoadError,
  planRecovery,
  readInstallChannel,
} from "./bootstrap/logic.js";

/** Nearest ancestor holding package.json — the checkout or bundle root. */
function findRepoRoot(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function runHealCommand(cmd: string[], cwd: string): boolean {
  const res = spawnSync(cmd[0], cmd.slice(1), {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // npm is npm.cmd on Windows, so child processes need a shell there.
    shell: process.platform === "win32",
  });
  // Heal output belongs on stderr: `zam mcp` must keep stdout protocol-clean.
  if (res.stdout) process.stderr.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  return res.status === 0;
}

try {
  await import("./app.js");
} catch (err) {
  const classified = classifyLoadError(err);
  const repoRoot = findRepoRoot();
  const plan = planRecovery(classified, {
    channel: readInstallChannel(join(homedir(), ".zam", "config.json"), (p) =>
      readFileSync(p, "utf-8"),
    ),
    repoRoot,
    hasGit: repoRoot !== null && existsSync(join(repoRoot, ".git")),
    healedFlag: process.env.ZAM_BOOTSTRAP_HEALED === "1",
    noAutoHeal: process.env.ZAM_NO_AUTO_HEAL === "1",
  });

  // Ordinary command errors surface through the same import() promise —
  // never mislabel them as install problems.
  if (plan.mode === "passthrough") throw err;

  process.stderr.write(`${plan.message}\n`);

  if (plan.mode === "auto-heal" && repoRoot) {
    const healed = plan.commands.every((cmd) => runHealCommand(cmd, repoRoot));
    if (healed) {
      const rerun = spawnSync(process.execPath, process.argv.slice(1), {
        stdio: "inherit",
        env: { ...process.env, ZAM_BOOTSTRAP_HEALED: "1" },
      });
      process.exit(rerun.status ?? 1);
    }
    process.stderr.write(
      "zam: self-heal failed — try `npm ci && npm run build` in the checkout, and check your Node version.\n",
    );
  }
  process.exit(1);
}
```

- [ ] **Step 2: Rebuild and re-run shape + full suite**

```bash
npm run build
npm run test
```
Expected: PASS — `tests/cli/app-shape.test.ts` still accepts the imports (`node:*`, `./app.js`, `./bootstrap/logic.js`); mcp stdout-purity test still green (bootstrap writes nothing on the success path).

- [ ] **Step 3: Quick fault-injection check (instruct path)**

```bash
cd C:/src/github/zam
mv node_modules/@modelcontextprotocol node_modules/@modelcontextprotocol.hidden
ZAM_NO_AUTO_HEAL=1 node dist/cli/index.js update check --latest 0.0.1   # expect: exit 0, "up to date" (isolation works)
ZAM_NO_AUTO_HEAL=1 node dist/cli/index.js mcp </dev/null; echo "exit=$?"  # expect: stderr names @modelcontextprotocol/sdk + npm install, exit=1
mv node_modules/@modelcontextprotocol.hidden node_modules/@modelcontextprotocol
```

- [ ] **Step 4: Quick fault-injection check (auto-heal path)**

```bash
mv node_modules/@modelcontextprotocol node_modules/@modelcontextprotocol.hidden
node dist/cli/index.js mcp </dev/null; echo "exit=$?"
# expect: stderr shows "self-healing (npm install && npm run build)", npm output, then exit=0
rm -rf node_modules/@modelcontextprotocol.hidden   # npm install restored the real dir
node dist/cli/index.js --version                    # expect: 0.9.0
```

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/cli/index.ts
git commit -m "feat: bootstrap classifies load failures and self-heals developer checkouts"
```

---

### Task 5: `zam update` smoke test with `npm ci` clean-room retry

**Files:**
- Modify: `src/cli/commands/update.ts` (helper near `runNpm` at ~line 185; execution inside `applyDeveloperUpdate` between the build step and the `zam setup --force` spawn, ~line 250)

**Interfaces:**
- Consumes: `smoke-test` step kind existing in `planUpdate` (Task 1 — the preview rendering in `applyUpdate` prints the new step's label automatically; no change needed there); bootstrap env contract `ZAM_NO_AUTO_HEAL` (Task 4).
- Produces: `smokeTestBuild(src: string): { ok: boolean; output: string }` (file-local helper).

- [ ] **Step 1: Add the smoke-test helper**

In `src/cli/commands/update.ts`, insert after the `runNpm` function:

```ts
/** Run the freshly built CLI once to prove its module graph loads. */
function smokeTestBuild(src: string): { ok: boolean; output: string } {
  const res = spawnSync(
    process.execPath,
    [join(src, "dist", "cli", "index.js"), "--version"],
    {
      cwd: src,
      encoding: "utf8",
      // The smoke test measures the update's own result — don't let the
      // bootstrap self-heal paper over a broken install/build (ADR 2026-07-07).
      env: { ...process.env, ZAM_NO_AUTO_HEAL: "1" },
    },
  );
  return {
    ok: res.status === 0,
    output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
  };
}
```

- [ ] **Step 2: Execute the step in `applyDeveloperUpdate`**

Insert between the `npm run build` block and the `zam setup --force` block:

```ts
  console.log(`${C.dim}→ smoke test (zam --version)${C.reset}`);
  let smoke = smokeTestBuild(src);
  if (!smoke.ok) {
    console.warn(
      `${C.yellow}⚠${C.reset} The rebuilt CLI failed to launch — retrying with a clean install (${C.cyan}npm ci${C.reset}).`,
    );
    const cleanRoomOk =
      runNpm(["ci"], src) === 0 && runNpm(["run", "build"], src) === 0;
    if (cleanRoomOk) {
      smoke = smokeTestBuild(src);
    }
    if (!smoke.ok) {
      console.error(
        `${C.red}✗${C.reset} The updated CLI still fails to launch:\n${smoke.output}\n` +
          `Fix it manually in ${src} (try \`npm ci && npm run build\`, and check your Node version), then re-run ${C.cyan}zam update${C.reset}.`,
      );
      process.exit(1);
    }
  }
```

(Biome note: keep the `smoke = smokeTestBuild(src)` reassignment as its own statement — no assignment inside expressions.)

- [ ] **Step 3: Verify behavior manually**

```bash
npm run build
node dist/cli/index.js update check --latest 99.0.0
# expect: update-available report with the legacy "Run: git pull && npm install && npm run build" line
# (the planUpdate step-list preview renders only in the interactive `zam update` path;
#  the smoke-test step's presence and order is kernel-tested in tests/kernel/update-check.test.ts)
node dist/cli/index.js --version   # expect: 0.9.0 (smoke helper's own target works)
```

The failure branch is exercised in Final Verification (stale-build injection); it has no unit test by design — the repo keeps the CLI layer thin and the sequencing decision kernel-tested (Task 1).

- [ ] **Step 4: Run the full suite, lint, commit**

```bash
npm run test
npm run lint
git add src/cli/commands/update.ts
git commit -m "feat: developer update smoke-tests the rebuilt CLI with an npm ci clean-room retry"
```

---

### Task 6: Documentation (CLAUDE.md convention, ADR/index status)

**Files:**
- Modify: `CLAUDE.md` (Key conventions list)
- Modify: `docs/adr/2026-07-07-resilient-self-update-and-dependency-isolation.md` (Status line)
- Modify: `docs/adr/README.md` (index row)

**Interfaces:** none (docs only).

- [ ] **Step 1: Add the convention to CLAUDE.md**

In the `## Key conventions` list, insert after the "Agent transport" bullet:

```markdown
- **Optional-surface deps stay lazy**: heavy or optional integrations (the MCP transport in `src/cli/commands/mcp.ts`) must not enter the CLI's eager module graph — register a stub command that `await import()`s the implementation, built as its own dist output. `src/cli/index.ts` is a builtins-only bootstrap that classifies load failures and self-heals developer checkouts (`ZAM_NO_AUTO_HEAL=1` opts out); see ADR 2026-07-07.
```

- [ ] **Step 2: Flip the ADR status**

In `docs/adr/2026-07-07-resilient-self-update-and-dependency-isolation.md`, change:

```markdown
**Status:** Accepted (2026-07-07 — Fable 5 review incorporated, open decisions resolved)
```

to:

```markdown
**Status:** Implemented (2026-07-07 — Fable 5 review incorporated, open decisions resolved)
```

In `docs/adr/README.md`, change the 2026-07-07 row's status cell from `Accepted` to `Implemented`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/adr/2026-07-07-resilient-self-update-and-dependency-isolation.md docs/adr/README.md
git commit -m "docs: record lazy-optional-deps convention and mark resilience ADR implemented"
```

---

## Final Verification (run after all tasks; part of the increment)

- [ ] **Gates:** `npm run build && npm run lint && npm run typecheck && npm run test` — all green.

- [ ] **Isolation + instruct (transport dep):**
```bash
mv node_modules/@modelcontextprotocol node_modules/@modelcontextprotocol.hidden
ZAM_NO_AUTO_HEAL=1 node dist/cli/index.js update check --latest 0.0.1        # exit 0
ZAM_NO_AUTO_HEAL=1 node dist/cli/index.js mcp </dev/null; echo "exit=$?"     # exit=1, stderr names the package
```

- [ ] **Auto-heal (transport dep):**
```bash
node dist/cli/index.js mcp </dev/null; echo "exit=$?"    # self-heal banner on stderr, exit=0
rm -rf node_modules/@modelcontextprotocol.hidden
```

- [ ] **Auto-heal (core dep):**
```bash
mv node_modules/commander node_modules/commander.hidden
node dist/cli/index.js --version    # heal banner, then 0.9.0, exit 0
rm -rf node_modules/commander.hidden
```

- [ ] **Stale build:**
```bash
rm dist/cli/app.js
ZAM_NO_AUTO_HEAL=1 node dist/cli/index.js --version; echo "exit=$?"   # instruct: npm run build, exit=1
node dist/cli/index.js --version                                       # heals (npm run build), prints 0.9.0
```

- [ ] **Loop guard:**
```bash
mv node_modules/commander node_modules/commander.hidden
ZAM_BOOTSTRAP_HEALED=1 node dist/cli/index.js --version; echo "exit=$?"
# instruct only (no npm run), message mentions the failed self-heal, exit=1
mv node_modules/commander.hidden node_modules/commander
```

- [ ] **Update plan contract:** the `smoke-test` step's presence, order, and label are kernel-tested (`tests/kernel/update-check.test.ts`); the interactive `zam update` preview prints `planUpdate` labels mechanically. Note: `update check` renders the legacy command string, not the step list — teaching it `planUpdate` parity is a possible follow-up outside this increment.
