/**
 * `zam update check` — has a newer ZAM been released, and how should this
 * install update? (Increment 12, Phase 5.)
 *
 * The decision (self-update vs defer to a package manager vs inform a developer
 * install) lives in the kernel; this command supplies the current version, the
 * latest version (fetched from GitHub releases unless `--latest` is given), and
 * the detected install channel.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  decideUpdate,
  getInstallChannel,
  type InstallChannel,
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

export const updateCommand = new Command("update")
  .description("Check for ZAM updates")
  .addCommand(checkCmd);
