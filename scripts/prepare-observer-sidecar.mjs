import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const target = optionValue("--target");
if (!target) {
  throw new Error("--target <Rust target triple> is required");
}

const executable = target.includes("windows")
  ? "zam-observer.exe"
  : "zam-observer";
const source = resolve(
  optionValue("--binary") ??
    join(repoRoot, "observer", "target", target, "release", executable),
);

if (!existsSync(source)) {
  throw new Error(`Observer binary not found: ${source}`);
}

const destinationDir = join(
  repoRoot,
  "desktop",
  "src-tauri",
  "resources",
  "zam-observer",
  target,
);
mkdirSync(destinationDir, { recursive: true });

const destination = join(destinationDir, basename(source));
copyFileSync(source, destination);
writeFileSync(
  join(destinationDir, "manifest.json"),
  `${JSON.stringify(
    {
      target,
      executable: basename(destination),
      protocolVersion: 1,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Prepared observer sidecar at ${destination}`);
