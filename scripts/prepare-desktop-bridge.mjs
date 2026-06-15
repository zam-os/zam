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

const npmArgs = [
  "ci",
  "--omit=dev",
  "--include=optional",
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
