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
