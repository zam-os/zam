/**
 * `zam update` — apply the latest ZAM release; `zam update check` — only report
 * whether one is available. (Increment 12, Phase 5.)
 *
 * The decision (self-update vs defer to a package manager vs update a developer
 * checkout) lives in the kernel (`decideUpdate`/`planUpdate`, pure and
 * unit-tested); this command supplies the current version, the latest version
 * (fetched from GitHub releases unless `--latest` is given), the detected
 * install channel, and the side effects that carry the plan out.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { confirm } from "@inquirer/prompts";
import { Command } from "commander";
import {
  decideUpdate,
  getInstallChannel,
  hasCommand,
  type InstallChannel,
  planUpdate,
  type UpdateDecision,
} from "../../kernel/index.js";

const GITHUB_REPO = "zam-os/zam";
const CHANNELS: InstallChannel[] = [
  "developer",
  "direct",
  "winget",
  "homebrew",
];

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

/** Read this build's version from the nearest package.json. */
function currentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const up of ["..", "../..", "../../.."]) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(here, up, "package.json"), "utf-8"),
      ) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // try the next candidate
    }
  }
  return "0.0.0";
}

/** Read the version recorded in a specific checkout's package.json. */
function versionAt(dir: string): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(dir, "package.json"), "utf-8"),
    ) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function fetchLatestVersion(repo: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "zam-cli",
      },
    },
  );
  if (!res.ok) {
    throw new Error(
      `Could not reach the release server (HTTP ${res.status}). ` +
        "Pass --latest <version> to check offline.",
    );
  }
  const data = (await res.json()) as { tag_name?: string };
  if (!data.tag_name) throw new Error("No published release found yet.");
  return data.tag_name;
}

function render(decision: UpdateDecision): void {
  if (!decision.updateAvailable) {
    console.log(
      `${C.green}✓${C.reset} ZAM is up to date (${C.cyan}${decision.currentVersion}${C.reset}).`,
    );
    return;
  }

  console.log(
    `${C.yellow}↑${C.reset} ${C.bold}Update available${C.reset}: ` +
      `${C.dim}${decision.currentVersion}${C.reset} → ${C.cyan}${decision.latestVersion}${C.reset}`,
  );
  console.log(`  ${decision.reason}`);
  if (decision.action === "run-command" || decision.action === "inform") {
    console.log(`  Run: ${C.cyan}${decision.command}${C.reset}`);
  } else if (decision.action === "self-update") {
    console.log(
      `  ${C.dim}The desktop app can apply this update for you.${C.reset}`,
    );
  }
}

const checkCmd = new Command("check")
  .description("Check whether a newer ZAM has been released")
  .option(
    "--latest <version>",
    "Compare against this version instead of fetching",
  )
  .option("--channel <channel>", "Override the detected install channel")
  .option("--json", "Output as JSON")
  .action(
    async (opts: { latest?: string; channel?: string; json?: boolean }) => {
      try {
        if (
          opts.channel &&
          !CHANNELS.includes(opts.channel as InstallChannel)
        ) {
          console.error(
            `Invalid --channel: ${opts.channel}. Use ${CHANNELS.join(", ")}.`,
          );
          process.exit(1);
        }

        const current = currentVersion();
        const latest = opts.latest ?? (await fetchLatestVersion(GITHUB_REPO));
        const channel = (opts.channel as InstallChannel) ?? getInstallChannel();

        const decision = decideUpdate({
          currentVersion: current,
          latestVersion: latest,
          channel,
        });

        if (opts.json) {
          console.log(JSON.stringify(decision, null, 2));
          return;
        }
        render(decision);
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    },
  );

/** Locate the ZAM source checkout by walking up from this module to a .git. */
function findSourceRepo(): string | null {
  let dir = realpathSync(dirname(fileURLToPath(import.meta.url)));
  let parent = dirname(dir);
  while (parent !== dir) {
    if (existsSync(join(dir, ".git"))) return dir;
    dir = parent;
    parent = dirname(dir);
  }
  return existsSync(join(dir, ".git")) ? dir : null;
}

function runGit(
  cwd: string,
  args: string[],
  capture: boolean,
): { ok: boolean; out: string } {
  const res = spawnSync("git", args, {
    cwd,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  return { ok: res.status === 0, out: (res.stdout ?? "").trim() };
}

/** npm is npm.cmd on Windows, so child processes need a shell there. */
function runNpm(args: string[], cwd: string): number {
  const res = spawnSync("npm", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return res.status ?? 1;
}

/** Run a package-manager command (winget/brew) through the shell. */
function runShell(command: string): boolean {
  const res = spawnSync(command, { stdio: "inherit", shell: true });
  return res.status === 0;
}

/**
 * Developer channel: pull, install, and rebuild the linked source checkout,
 * then refresh this instance's skill files with the freshly built CLI so the
 * new /zam skill lands in .claude/.agent/.agents.
 */
function applyDeveloperUpdate(force: boolean): void {
  if (!hasCommand("git")) {
    console.error(`${C.red}✗${C.reset} git was not found on PATH.`);
    process.exit(1);
  }

  const src = findSourceRepo();
  if (!src) {
    console.error(
      `${C.red}✗${C.reset} Could not locate the ZAM source checkout to update.`,
    );
    process.exit(1);
  }

  // Never clobber uncommitted work in the source checkout.
  const status = runGit(src, ["status", "--porcelain"], true);
  if (status.ok && status.out && !force) {
    console.error(
      `${C.red}✗${C.reset} The source checkout has uncommitted changes:\n${status.out}\n` +
        `Commit or stash them, or re-run with ${C.cyan}--force${C.reset}.`,
    );
    process.exit(1);
  }

  console.log(
    `${C.dim}→ git pull --ff-only${C.reset}  ${C.dim}(${src})${C.reset}`,
  );
  if (!runGit(src, ["pull", "--ff-only"], false).ok) {
    console.error(
      `${C.red}✗${C.reset} git pull failed — the branch may have diverged or you are offline. Resolve it manually, then retry.`,
    );
    process.exit(1);
  }

  console.log(`${C.dim}→ npm install${C.reset}`);
  if (runNpm(["install"], src) !== 0) {
    console.error(`${C.red}✗${C.reset} npm install failed.`);
    process.exit(1);
  }

  console.log(`${C.dim}→ npm run build${C.reset}`);
  if (runNpm(["run", "build"], src) !== 0) {
    console.error(`${C.red}✗${C.reset} Build failed.`);
    process.exit(1);
  }

  console.log(`${C.dim}→ zam setup --force${C.reset}`);
  const setup = spawnSync(
    process.execPath,
    [join(src, "dist", "cli", "index.js"), "setup", "--force"],
    { cwd: process.cwd(), stdio: "inherit" },
  );
  if (setup.status !== 0) {
    console.warn(
      `${C.yellow}⚠${C.reset} Skill refresh reported a problem — run '${C.cyan}zam setup --force${C.reset}' here manually.`,
    );
  }

  console.log(
    `\n${C.green}✓${C.reset} Updated to ${C.cyan}${versionAt(src)}${C.reset}. ` +
      `Restart your agent client (e.g. Claude Code) to load the refreshed ${C.cyan}/zam${C.reset} skill.`,
  );
}

async function applyUpdate(opts: {
  yes?: boolean;
  force?: boolean;
}): Promise<void> {
  try {
    const current = currentVersion();
    const latest = await fetchLatestVersion(GITHUB_REPO);
    const channel = getInstallChannel();
    const decision = decideUpdate({
      currentVersion: current,
      latestVersion: latest,
      channel,
    });

    if (!decision.updateAvailable) {
      console.log(
        `${C.green}✓${C.reset} ZAM is up to date (${C.cyan}${current}${C.reset}).`,
      );
      return;
    }

    console.log(
      `${C.yellow}↑${C.reset} ${C.bold}Update available${C.reset}: ` +
        `${C.dim}${current}${C.reset} → ${C.cyan}${latest}${C.reset} ${C.dim}(${channel} install)${C.reset}`,
    );
    for (const step of planUpdate(decision)) {
      console.log(`  ${C.dim}•${C.reset} ${step.label}`);
    }

    // The CLI cannot apply a signed in-place update; that is the desktop app.
    if (channel === "direct") {
      console.log(
        `\n${C.dim}This install updates through the desktop app's signed updater — open ZAM Desktop to install ${latest}.${C.reset}`,
      );
      return;
    }

    if (!opts.yes) {
      const ok = await confirm({
        message: "Apply this update?",
        default: true,
      });
      if (!ok) {
        console.log("Aborted.");
        return;
      }
    }

    console.log();

    if (channel === "winget" || channel === "homebrew") {
      if (!decision.command || !runShell(decision.command)) process.exit(1);
      return;
    }

    applyDeveloperUpdate(opts.force ?? false);
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}

export const updateCommand = new Command("update")
  .description(
    "Update ZAM to the latest release (use `update check` to only check)",
  )
  .option("-y, --yes", "Apply without confirmation")
  .option(
    "--force",
    "Update even if the source checkout has uncommitted changes",
  )
  .action(async (opts: { yes?: boolean; force?: boolean }) => {
    await applyUpdate(opts);
  })
  .addCommand(checkCmd);
