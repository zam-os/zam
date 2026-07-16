import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findExecutable } from "./terminal-open.js";

const packageRoot =
  [
    fileURLToPath(new URL("../..", import.meta.url)),
    fileURLToPath(new URL("../../..", import.meta.url)),
  ].find((candidate) => existsSync(join(candidate, "package.json"))) ??
  fileURLToPath(new URL("../..", import.meta.url));

export type VscodeExtensionInstallAction =
  | "installed"
  | "updated"
  | "unchanged"
  | "planned"
  | "kept-newer";

export interface VscodeExtensionPlan {
  version: string;
  vsixPath: string;
  codePath: string;
  launchConfigPath: string;
  launch: { command: string; args: string[] };
}

export interface VscodeExtensionInstallResult extends VscodeExtensionPlan {
  action: VscodeExtensionInstallAction;
}

export interface VscodeExtensionOptions {
  home?: string;
  platform?: NodeJS.Platform;
  assetsDir?: string;
  version?: string;
  zamPath: string;
  codePath?: string;
  dryRun?: boolean;
  find?: (command: string) => string | null;
  exists?: (path: string) => boolean;
  run?: (command: string, args: string[]) => void;
  /** Like `run`, but returns the command's stdout — used to read the installed extension version. */
  query?: (command: string, args: string[]) => string;
}

export function resolveVscodeExecutable(
  options: Pick<
    VscodeExtensionOptions,
    "home" | "platform" | "find" | "exists"
  > = {},
): string | null {
  const home = options.home ?? homedir();
  const platform = options.platform ?? process.platform;
  const find = options.find ?? findExecutable;
  const exists = options.exists ?? existsSync;
  const found = find("code");
  if (found) return found;

  const candidates =
    platform === "darwin"
      ? [
          "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
          join(
            home,
            "Applications",
            "Visual Studio Code.app",
            "Contents",
            "Resources",
            "app",
            "bin",
            "code",
          ),
        ]
      : platform === "win32"
        ? [
            join(
              home,
              "AppData",
              "Local",
              "Programs",
              "Microsoft VS Code",
              "bin",
              "code.cmd",
            ),
          ]
        : ["/usr/bin/code", "/usr/local/bin/code", "/snap/bin/code"];
  return candidates.find((candidate) => exists(candidate)) ?? null;
}

export interface VscodeCliInvocation {
  command: string;
  args: string[];
  shell: boolean;
}

/**
 * Windows refuses to spawn .cmd/.bat shims without a shell (Node's
 * CVE-2024-27980 hardening throws EINVAL), and with a shell the command
 * line is concatenated, so paths with spaces must be quoted.
 */
export function buildVscodeCliInvocation(
  command: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
): VscodeCliInvocation {
  const needsShell = platform === "win32" && /\.(cmd|bat)$/i.test(command);
  if (!needsShell) return { command, args, shell: false };
  const quote = (value: string) => `"${value}"`;
  return { command: quote(command), args: args.map(quote), shell: true };
}

function packageVersion(): string {
  const parsed = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  ) as { version?: unknown };
  if (typeof parsed.version !== "string" || !parsed.version) {
    throw new Error("Cannot determine the ZAM package version");
  }
  return parsed.version;
}

export function planVscodeExtensionInstall(
  options: VscodeExtensionOptions,
): VscodeExtensionPlan {
  const home = options.home ?? homedir();
  const version = options.version ?? packageVersion();
  const assetsDir =
    options.assetsDir ?? join(packageRoot, "dist", "vscode-extension");
  const vsixPath = join(assetsDir, `ZAM_Companion_${version}.vsix`);
  if (!existsSync(vsixPath)) {
    throw new Error(
      `ZAM Companion VSIX asset is missing: ${vsixPath}. Run \`npm run build\` and retry.`,
    );
  }
  const codePath =
    options.codePath ??
    resolveVscodeExecutable({
      home,
      platform: options.platform,
      find: options.find,
      exists: options.exists,
    });
  if (!codePath) {
    throw new Error(
      "Visual Studio Code was not detected. Install VS Code or add its 'code' command to PATH.",
    );
  }
  return {
    version,
    vsixPath,
    codePath,
    launchConfigPath: join(home, ".zam", "vscode-launch.json"),
    launch: { command: options.zamPath, args: ["mcp"] },
  };
}

/** `"0.10.10" vs "0.11.0"` → negative when `a` is older. Numeric triples only. */
function compareVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const [aParts, bParts] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * The Companion version VS Code currently has installed, or null when absent
 * or undeterminable (a query failure must never block the install).
 */
function installedCompanionVersion(
  codePath: string,
  query: (command: string, args: string[]) => string,
): string | null {
  try {
    const output = query(codePath, ["--list-extensions", "--show-versions"]);
    const match = output.match(/^zam-os\.zam-companion@(\S+)$/im);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function installVscodeExtension(
  options: VscodeExtensionOptions,
): VscodeExtensionInstallResult {
  const plan = planVscodeExtensionInstall(options);
  if (options.dryRun) return { ...plan, action: "planned" };

  const launchContent = `${JSON.stringify(
    {
      schemaVersion: 1,
      version: plan.version,
      command: plan.launch.command,
      args: plan.launch.args,
    },
    null,
    2,
  )}\n`;
  const existed = existsSync(plan.launchConfigPath);
  const changed =
    !existed || readFileSync(plan.launchConfigPath, "utf8") !== launchContent;

  const run =
    options.run ??
    ((command: string, args: string[]) => {
      const invocation = buildVscodeCliInvocation(command, args);
      execFileSync(invocation.command, invocation.args, {
        stdio: "pipe",
        shell: invocation.shell,
      });
    });
  const query =
    options.query ??
    ((command: string, args: string[]) => {
      const invocation = buildVscodeCliInvocation(command, args);
      return execFileSync(invocation.command, invocation.args, {
        stdio: "pipe",
        shell: invocation.shell,
        encoding: "utf8",
      });
    });

  // Never downgrade: `--install-extension --force` happily replaces a newer
  // Companion with this package's older VSIX (observed live: an installed
  // ZAM 0.10.10 app's connect pass clobbered a freshly installed 0.10.11
  // Companion minutes after installation, leaving a stale extension whose
  // tool-proxy allowlist no longer matched the current MCP server — every
  // panel bridge call then failed with MCP error -32603). Same-version
  // reinstalls stay allowed: during development the version is stable while
  // content changes, and reinstalling also repairs a corrupted install.
  const installed = installedCompanionVersion(plan.codePath, query);
  if (installed && compareVersions(plan.version, installed) < 0) {
    return { ...plan, action: "kept-newer" };
  }

  run(plan.codePath, ["--install-extension", plan.vsixPath, "--force"]);

  if (changed) {
    mkdirSync(dirname(plan.launchConfigPath), { recursive: true });
    writeFileSync(plan.launchConfigPath, launchContent, "utf8");
  }

  return {
    ...plan,
    action: !existed ? "installed" : changed ? "updated" : "unchanged",
  };
}
