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
