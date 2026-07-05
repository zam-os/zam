import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
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

  describe("Plain CLI Commands", () => {
    it("can CRUD and assign contexts using plain CLI commands", () => {
      // 1. Create a context
      const createOut = runCli([
        "knowledge-context",
        "create",
        "--name",
        "work-dw",
        "--label",
        "DocuWare Work",
        "--language",
        "en",
      ]);
      expect(createOut).toContain("Created knowledge context: work-dw");

      // 2. List contexts
      const listOut = runCli(["kc", "list"]);
      expect(listOut).toContain("work-dw");
      expect(listOut).toContain("DocuWare Work (en)");

      // 3. Register a token with a context
      const registerOut = runCli([
        "token",
        "register",
        "--slug",
        "cops-monitoring",
        "--concept",
        "DW COPS platform monitoring metrics",
        "--knowledge-context",
        "work-dw",
      ]);
      expect(registerOut).toContain("Registered token: cops-monitoring");
      expect(registerOut).toContain("Contexts: work-dw");

      // 4. List tokens filtered by context
      const tokenListOut = runCli(["token", "list", "--knowledge-context", "work-dw"]);
      expect(tokenListOut).toContain("cops-monitoring");

      const tokenListEmpty = runCli(["token", "list", "--knowledge-context", "nonexistent"]);
      expect(tokenListEmpty).toContain("No tokens registered.");
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
  });
});
