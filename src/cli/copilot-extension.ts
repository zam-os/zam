import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXTENSION_NAME = "zam-mcp-apps";
const EXTENSION_FILES = [
  "extension.mjs",
  "host.bundle.js",
  "mcp-client.bundle.mjs",
  "manifest.json",
] as const;

const packageRoot =
  [
    fileURLToPath(new URL("../..", import.meta.url)),
    fileURLToPath(new URL("../../..", import.meta.url)),
  ].find((candidate) => existsSync(join(candidate, "package.json"))) ??
  fileURLToPath(new URL("../..", import.meta.url));

export interface CopilotExtensionLaunch {
  command: string;
  args: string[];
}

export interface CopilotExtensionPlan {
  sourceDir: string;
  destinationDir: string;
  launch: CopilotExtensionLaunch;
  files: readonly string[];
}

export type CopilotExtensionInstallAction =
  | "installed"
  | "updated"
  | "unchanged"
  | "planned";

export interface CopilotExtensionInstallResult extends CopilotExtensionPlan {
  action: CopilotExtensionInstallAction;
  changedFiles: string[];
}

export interface CopilotExtensionOptions {
  home?: string;
  copilotHome?: string;
  assetsDir?: string;
  zamPath: string;
  nodePath?: string;
  cliEntry?: string;
  dryRun?: boolean;
}

function defaultCliEntry(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "index.js");
}

export function resolveCopilotHome(
  home = homedir(),
  configuredHome = process.env.COPILOT_HOME,
): string {
  return configuredHome?.trim()
    ? resolve(configuredHome)
    : join(home, ".copilot");
}

export function resolveCopilotZamLaunch(
  zamPath: string,
  options: Pick<CopilotExtensionOptions, "cliEntry" | "nodePath"> = {},
): CopilotExtensionLaunch {
  const cliEntry = options.cliEntry ?? defaultCliEntry();
  if (existsSync(cliEntry)) {
    return {
      command: options.nodePath ?? process.execPath,
      args: [cliEntry, "mcp"],
    };
  }
  return {
    command: zamPath,
    args: ["mcp"],
  };
}

export function planCopilotExtensionInstall(
  options: CopilotExtensionOptions,
): CopilotExtensionPlan {
  const sourceDir =
    options.assetsDir ?? join(packageRoot, "dist", "copilot-extension");
  for (const file of EXTENSION_FILES) {
    if (!existsSync(join(sourceDir, file))) {
      throw new Error(
        `Copilot MCP Apps asset is missing: ${join(sourceDir, file)}. Run \`npm run build\` and retry.`,
      );
    }
  }

  const manifest = JSON.parse(
    readFileSync(join(sourceDir, "manifest.json"), "utf8"),
  ) as { name?: unknown; version?: unknown };
  if (
    manifest.name !== EXTENSION_NAME ||
    typeof manifest.version !== "string" ||
    !manifest.version
  ) {
    throw new Error(
      `Invalid Copilot MCP Apps manifest: ${join(sourceDir, "manifest.json")}`,
    );
  }

  const copilotHome = resolveCopilotHome(
    options.home,
    options.copilotHome ?? process.env.COPILOT_HOME,
  );
  return {
    sourceDir,
    destinationDir: join(copilotHome, "extensions", EXTENSION_NAME),
    launch: resolveCopilotZamLaunch(options.zamPath, options),
    files: EXTENSION_FILES,
  };
}

function writeIfChanged(path: string, content: Buffer | string): boolean {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (existsSync(path) && readFileSync(path).equals(next)) return false;
  writeFileSync(path, next);
  return true;
}

export function installCopilotExtension(
  options: CopilotExtensionOptions,
): CopilotExtensionInstallResult {
  const plan = planCopilotExtensionInstall(options);
  if (options.dryRun) {
    return { ...plan, action: "planned", changedFiles: [] };
  }

  const destinationExisted = existsSync(plan.destinationDir);
  if (destinationExisted && lstatSync(plan.destinationDir).isSymbolicLink()) {
    throw new Error(
      `Refusing to replace symlinked Copilot extension directory: ${plan.destinationDir}`,
    );
  }
  mkdirSync(plan.destinationDir, { recursive: true });

  const changedFiles: string[] = [];
  for (const file of plan.files) {
    const source = join(plan.sourceDir, file);
    const destination = join(plan.destinationDir, file);
    if (writeIfChanged(destination, readFileSync(source))) {
      changedFiles.push(file);
    }
  }

  const launchContent = `${JSON.stringify(
    {
      schemaVersion: 1,
      command: plan.launch.command,
      args: plan.launch.args,
    },
    null,
    2,
  )}\n`;
  if (writeIfChanged(join(plan.destinationDir, "launch.json"), launchContent)) {
    changedFiles.push("launch.json");
  }

  return {
    ...plan,
    action: !destinationExisted
      ? "installed"
      : changedFiles.length > 0
        ? "updated"
        : "unchanged",
    changedFiles,
  };
}
