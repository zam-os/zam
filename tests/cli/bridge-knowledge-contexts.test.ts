import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  openDatabase,
  setSetting,
  createToken,
  ensureCard,
} from "../../src/kernel/index.js";

describe("CLI and bridge knowledge contexts (Phase 2)", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-kc-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-kc-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, "config.json"),
      JSON.stringify({
        activeWorkspaceId: "test-workspace",
        workspaces: [
          {
            id: "test-workspace",
            kind: "personal",
            path: tempCwd,
            label: "Test Workspace",
          },
        ],
      }),
      "utf8",
    );

    // Bootstrap DB with migration
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runCli(args: string[], input?: string): string {
    return execFileSync("node", [cliPath, ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      input: input ?? "",
      encoding: "utf8",
    });
  }

  function runCliJson(args: string[], input?: string): any {
    return JSON.parse(runCli(args, input));
  }

  function runCliResult(args: string[], input?: string) {
    return spawnSync("node", [cliPath, ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      input: input ?? "",
      encoding: "utf8",
    });
  }

  describe("Plain CLI Commands", () => {
    it("can CRUD and assign contexts using plain CLI commands", () => {
      // 1. Create a context
      const createOut = runCli([
        "knowledge-context",
        "create",
        "--name",
        "work-company",
        "--label",
        "Company Work",
        "--language",
        "en",
      ]);
      expect(createOut).toContain("Created knowledge context: work-company");

      // 2. List contexts
      const listOut = runCli(["kc", "list"]);
      expect(listOut).toContain("work-company");
      expect(listOut).toContain("Company Work (en)");

      // 3. Register a token with a context
      const registerOut = runCli([
        "token",
        "register",
        "--slug",
        "system-monitoring",
        "--concept",
        "System platform monitoring metrics",
        "--knowledge-context",
        "work-company",
      ]);
      expect(registerOut).toContain("Registered token: system-monitoring");
      expect(registerOut).toContain("Contexts: work-company");

      // 4. List tokens filtered by context
      const tokenListOut = runCli(["token", "list", "--knowledge-context", "work-company"]);
      expect(tokenListOut).toContain("system-monitoring");

      const tokenListEmpty = runCli(["token", "list", "--knowledge-context", "nonexistent"]);
      expect(tokenListEmpty).toContain("No tokens registered.");
    });

    it("does not create a token when a requested context is invalid", () => {
      const result = runCliResult([
        "token",
        "register",
        "--slug",
        "orphaned-cli-token",
        "--concept",
        "Must never be persisted",
        "--knowledge-context",
        "missing-context",
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "Knowledge context not found: missing-context",
      );
      expect(runCli(["token", "list"])).not.toContain("orphaned-cli-token");
    });

    it("requires confirmation before deleting a context and clears its active default", () => {
      runCli(["kc", "create", "--name", "temporary"]);
      runCli(["kc", "use", "temporary"]);

      const preview = runCli(["kc", "delete", "--name", "temporary"]);
      expect(preview).toContain("Re-run with --confirm");
      expect(runCli(["kc", "show"])).toContain(
        "Active knowledge context: temporary",
      );

      const removed = runCli([
        "kc",
        "delete",
        "--name",
        "temporary",
        "--confirm",
      ]);
      expect(removed).toContain("Deleted knowledge context: temporary");
      expect(runCli(["kc", "show"])).toContain(
        "No active knowledge context default set.",
      );
    });

    it("uses the device default for creation unless an explicit context overrides it", () => {
      runCli(["kc", "create", "--name", "work"]);
      runCli(["kc", "create", "--name", "school"]);
      runCli(["kc", "use", "work"]);

      runCli([
        "token",
        "register",
        "--slug",
        "implicit-work",
        "--concept",
        "Uses the active default",
      ]);
      runCli([
        "token",
        "register",
        "--slug",
        "explicit-school",
        "--concept",
        "Overrides the active default",
        "--knowledge-context",
        "school",
      ]);

      expect(runCli(["token", "list", "--knowledge-context", "work"])).toContain(
        "implicit-work",
      );
      const school = runCli([
        "token",
        "list",
        "--knowledge-context",
        "school",
      ]);
      expect(school).toContain("explicit-school");
      expect(school).not.toContain("implicit-work");
    });
  });

  describe("Bridge Operations", () => {
    it("manages contexts via the bridge and respects filters", async () => {
      // Create context via CLI first
      runCli(["kc", "create", "--name", "school", "--label", "Schooling", "--language", "de"]);

      // 1. List via bridge
      const listRes = runCliJson(["bridge", "list-knowledge-contexts"]);
      expect(listRes.success).toBe(true);
      expect(listRes.contexts).toBeDefined();
      expect(listRes.contexts.some((c: any) => c.name === "school")).toBe(true);

      // 2. Add token with context via bridge add-token
      const addTokenJson = JSON.stringify({
        slug: "math-derivatives",
        concept: "Calculating derivatives in calculus",
        domain: "math",
        knowledgeContexts: ["school"],
      });
      const addRes = runCliJson(["bridge", "add-token"], addTokenJson);
      expect(addRes.success).toBe(true);
      expect(addRes.token.knowledgeContexts).toHaveLength(1);
      expect(addRes.token.knowledgeContexts[0].name).toBe("school");

      // 3. Filter list-tokens by context via bridge
      const listTokensRes = runCliJson(["bridge", "list-tokens", "--knowledge-context", "school"]);
      expect(listTokensRes.tokens).toHaveLength(1);
      expect(listTokensRes.tokens[0].slug).toBe("math-derivatives");
      expect(listTokensRes.tokens[0].knowledgeContexts[0].name).toBe("school");

      // 4. Assign & unassign context via bridge
      runCli(["kc", "create", "--name", "private"]);

      const assignRes = runCliJson([
        "bridge",
        "assign-knowledge-context",
        "--token",
        "math-derivatives",
        "--context",
        "private",
      ]);
      expect(assignRes.success).toBe(true);

      const listTokensResAfter = runCliJson(["bridge", "list-tokens", "--knowledge-context", "private"]);
      expect(listTokensResAfter.tokens).toHaveLength(1);
      expect(listTokensResAfter.tokens[0].slug).toBe("math-derivatives");

      const unassignRes = runCliJson([
        "bridge",
        "unassign-knowledge-context",
        "--token",
        "math-derivatives",
        "--context",
        "private",
      ]);
      expect(unassignRes.success).toBe(true);

      const listTokensResFinal = runCliJson(["bridge", "list-tokens", "--knowledge-context", "private"]);
      expect(listTokensResFinal.tokens).toHaveLength(0);
    });

    it("composes domain prefix filter and knowledge context filter correctly", () => {
      runCli(["kc", "create", "--name", "science-ctx", "--label", "Science Context", "--language", "en"]);

      runCli([
        "token",
        "register",
        "--slug",
        "physics-gravity",
        "--concept",
        "Newtonian gravity",
        "--domain",
        "physics",
        "--knowledge-context",
        "science-ctx",
      ]);

      runCli([
        "token",
        "register",
        "--slug",
        "chemistry-bonds",
        "--concept",
        "Covalent bonds",
        "--domain",
        "chemistry",
        "--knowledge-context",
        "science-ctx",
      ]);

      runCli([
        "token",
        "register",
        "--slug",
        "physics-relativity",
        "--concept",
        "General relativity",
        "--domain",
        "physics",
      ]);

      const resCtx = runCliJson(["bridge", "list-tokens", "--knowledge-context", "science-ctx"]);
      const slugsCtx = resCtx.tokens.map((t: any) => t.slug);
      expect(slugsCtx).toContain("physics-gravity");
      expect(slugsCtx).toContain("chemistry-bonds");
      expect(slugsCtx).not.toContain("physics-relativity");

      const resDom = runCliJson(["bridge", "list-tokens", "--domain-prefix", "physics"]);
      const slugsDom = resDom.tokens.map((t: any) => t.slug);
      expect(slugsDom).toContain("physics-gravity");
      expect(slugsDom).toContain("physics-relativity");
      expect(slugsDom).not.toContain("chemistry-bonds");

      const resComposed = runCliJson([
        "bridge",
        "list-tokens",
        "--domain-prefix",
        "physics",
        "--knowledge-context",
        "science-ctx",
      ]);
      const slugsComposed = resComposed.tokens.map((t: any) => t.slug);
      expect(slugsComposed).toHaveLength(1);
      expect(slugsComposed[0]).toBe("physics-gravity");
    });

    it("rejects invalid context payloads before creating bridge tokens", () => {
      for (const knowledgeContexts of [["missing-context"], "school"]) {
        const result = runCliResult(
          ["bridge", "add-token"],
          JSON.stringify({
            slug: `orphan-${typeof knowledgeContexts}`,
            concept: "Must never be persisted",
            knowledgeContexts,
          }),
        );

        expect(result.status).not.toBe(0);
        expect(JSON.parse(result.stdout).error).toEqual(expect.any(String));
      }

      expect(runCliJson(["bridge", "list-tokens"]).tokens).toHaveLength(0);
    });

    it("applies the device default to bridge token creation", () => {
      runCli(["kc", "create", "--name", "work"]);
      runCli(["kc", "use", "work"]);

      const created = runCliJson(
        ["bridge", "add-token"],
        JSON.stringify({
          slug: "bridge-default",
          concept: "Uses the active context",
        }),
      );

      expect(created.token.knowledgeContexts.map((context: any) => context.name)).toEqual([
        "work",
      ]);

      const personal = runCliJson([
        "bridge",
        "personal-card-create",
        "--concept",
        "Created in the Studio",
      ]);
      expect(
        personal.token.knowledgeContexts.map((context: any) => context.name),
      ).toEqual(["work"]);

      const studioList = runCliJson([
        "bridge",
        "personal-card-list",
        "--knowledge-context",
        "work",
      ]);
      expect(studioList.cards).toHaveLength(2);
      expect(
        studioList.cards.every((card: any) =>
          card.knowledgeContexts.some((context: any) => context.name === "work"),
        ),
      ).toBe(true);
    });

    it("scopes due cards and review queue size to the selected context", () => {
      runCli(["kc", "create", "--name", "work"]);
      runCli(["kc", "create", "--name", "school"]);

      for (const context of ["work", "school"]) {
        runCliJson(
          ["bridge", "add-token"],
          JSON.stringify({
            slug: `${context}-token`,
            concept: `${context} concept`,
            knowledgeContexts: [context],
          }),
        );
      }

      const due = runCliJson([
        "bridge",
        "check-due",
        "--knowledge-context",
        "work",
      ]);
      expect(due.cards.map((card: any) => card.slug)).toEqual(["work-token"]);

      const review = runCliJson([
        "bridge",
        "get-review",
        "--knowledge-context",
        "work",
        "--no-resolve",
        "--no-dynamic-question",
      ]);
      expect(review.card.slug).toBe("work-token");
      expect(review.queueSize).toBe(1);
    });
  });

  describe("Doctor JSON reporting", () => {
    it("runs a complete read-only diagnosis when no task is specified", () => {
      const report = runCliJson(["doctor", "--json"]);

      expect(report).toMatchObject({ success: true, readOnly: true });
      expect(report.tasks.map((task: any) => task.name)).toEqual([
        "titles",
        "texts",
        "duplicates",
        "domains",
        "contexts",
      ]);
      expect(
        report.tasks.every((task: any) => Array.isArray(task.lines)),
      ).toBe(true);
    });

    it("keeps task-specific JSON parseable and rejects interactive JSON fixes", () => {
      const report = runCliJson(["doctor", "titles", "--json"]);
      expect(report).toMatchObject({ success: true, task: "titles" });

      const rejected = runCliResult([
        "doctor",
        "titles",
        "--json",
        "--fix",
      ]);
      expect(rejected.status).not.toBe(0);
      expect(JSON.parse(rejected.stdout)).toMatchObject({
        success: false,
        error:
          "--json --fix requires --yes; interactive prompts are not machine-readable",
      });

      const missingContext = runCliResult([
        "doctor",
        "contexts",
        "--json",
        "--knowledge-context",
        "missing",
      ]);
      expect(missingContext.status).not.toBe(0);
      expect(JSON.parse(missingContext.stdout)).toMatchObject({
        success: false,
        task: "contexts",
        error: "Knowledge context not found: missing",
      });

      const interactive = runCliResult([
        "doctor",
        "duplicates",
        "--json",
        "--fix",
        "--yes",
      ]);
      expect(interactive.status).not.toBe(0);
      expect(JSON.parse(interactive.stdout)).toMatchObject({ success: false });
    });
  });
});
