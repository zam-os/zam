import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const resourceRoot = join(
  repoRoot,
  "desktop",
  "src-tauri",
  "resources",
  "zam-cli",
);
const cliEntry = join(repoRoot, "dist", "cli", "index.js");
const args = process.argv.slice(2);

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (!existsSync(cliEntry)) {
  throw new Error(
    "CLI build missing. Run `npm run build` before preparing desktop resources.",
  );
}

const packageJson = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8"),
);
const packageLock = join(repoRoot, "package-lock.json");
if (!existsSync(packageLock)) {
  throw new Error("Root package-lock.json is required for desktop packaging.");
}
const requestedNode = optionValue("--node");
const nodeSource = requestedNode
  ? resolve(requestedNode)
  : args.includes("--bundle-node")
    ? process.execPath
    : undefined;

if (nodeSource && !existsSync(nodeSource)) {
  throw new Error(`Node runtime not found: ${nodeSource}`);
}

rmSync(resourceRoot, { recursive: true, force: true });
mkdirSync(resourceRoot, { recursive: true });
cpSync(join(repoRoot, "dist"), join(resourceRoot, "dist"), {
  recursive: true,
});

// Bundle the agent skill files alongside the CLI so the desktop app's `zam
// setup` can provision them from the installed program directory in Default
// mode — end users have no git checkout to copy them from. `copySkills`
// resolves them relative to its own (self-located) packageRoot, which in the
// bundle is this resource root.
for (const agentDir of [".claude", ".agent", ".agents"]) {
  const skillsSrc = join(repoRoot, agentDir, "skills");
  if (existsSync(skillsSrc)) {
    cpSync(skillsSrc, join(resourceRoot, agentDir, "skills"), {
      recursive: true,
    });
  }
}

writeFileSync(
  join(resourceRoot, "package.json"),
  `${JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      private: true,
      type: "module",
      license: packageJson.license,
      engines: packageJson.engines,
      bin: packageJson.bin,
      dependencies: packageJson.dependencies,
      optionalDependencies: packageJson.optionalDependencies,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
cpSync(packageLock, join(resourceRoot, "package-lock.json"));

// `--ignore-scripts` is what keeps this build possible without a C++
// toolchain. better-sqlite3 ships a `binding.gyp`, and npm defaults to
// `node-gyp rebuild` for any package that has one and declares no install
// script of its own — so the bundled CLI was compiled from source on every
// desktop build. It never needed to be: the package also ships a prebuilt
// `prebuilds/win32-x64.node` (and one per supported platform), which is what
// it loads at runtime anyway.
//
// The compile is not merely wasted work, it fails outright on a machine whose
// Visual Studio is newer than node-gyp knows: against Visual Studio 2026,
// node-gyp 11.5.0 reports "Could not find any Visual Studio installation to
// use" while listing only VS2013–2017 as candidates, and takes the whole
// `zam ui --build` down with it. None of the four runtime dependencies needs
// an install script to work.
const npmArgs = [
  "ci",
  "--omit=dev",
  "--include=optional",
  "--ignore-scripts",
  "--no-audit",
  "--no-fund",
];
const npmExecPath = process.env.npm_execpath;
const install = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, ...npmArgs], {
      cwd: resourceRoot,
      stdio: "inherit",
    })
  : spawnSync("npm", npmArgs, {
      cwd: resourceRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
if (install.status !== 0) {
  throw new Error(
    `Failed to install production dependencies for the desktop: ${
      install.error?.message || `exit code ${install.status}`
    }`,
  );
}

if (nodeSource) {
  const runtimeDir = join(resourceRoot, "runtime");
  const nodeName = process.platform === "win32" ? "node.exe" : "node";
  mkdirSync(runtimeDir, { recursive: true });
  const nodeDestination = join(runtimeDir, nodeName);
  cpSync(nodeSource, nodeDestination);
  if (process.platform !== "win32") {
    chmodSync(nodeDestination, 0o755);
  }
}

writeFileSync(
  join(resourceRoot, "manifest.json"),
  `${JSON.stringify(
    {
      version: packageJson.version,
      nodeBundled: Boolean(nodeSource),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `Prepared desktop bridge resources at ${resourceRoot}${nodeSource ? " with Node runtime" : ""}.`,
);
