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
    channel: readInstallChannel(
      // Honor the repo-standard config override, mirroring the kernel's
      // defaultConfigPath() (install-config.ts) so bootstrap and kernel can
      // never disagree about the install channel.
      process.env.ZAM_CONFIG_PATH || join(homedir(), ".zam", "config.json"),
      (p) => readFileSync(p, "utf-8"),
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
