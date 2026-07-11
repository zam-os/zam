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
  | "planned";

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
      `VS Code Companion asset is missing: ${vsixPath}. Run \`npm run build\` and retry.`,
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
      execFileSync(command, args, { stdio: "pipe" });
    });
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
