import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(repoRoot, "src", "copilot-extension");
const destinationDir = join(repoRoot, "dist", "copilot-extension");
const packageJson = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8"),
);
const version = packageJson.version;

mkdirSync(destinationDir, { recursive: true });

for (const bundle of ["host.bundle.js", "mcp-client.bundle.mjs"]) {
  if (!existsSync(join(destinationDir, bundle))) {
    throw new Error(`Copilot extension bundle is missing: ${bundle}`);
  }
}

for (const file of [
  "extension.mjs",
  "host.bundle.js",
  "mcp-client.bundle.mjs",
]) {
  const source =
    file === "extension.mjs"
      ? join(sourceDir, file)
      : join(destinationDir, file);
  const content = readFileSync(source, "utf8").replaceAll(
    "__ZAM_VERSION__",
    version,
  );
  writeFileSync(join(destinationDir, file), content, "utf8");
}

writeFileSync(
  join(destinationDir, "manifest.json"),
  `${JSON.stringify(
    {
      name: "zam-mcp-apps",
      version,
      files: ["extension.mjs", "host.bundle.js", "mcp-client.bundle.mjs"],
    },
    null,
    2,
  )}\n`,
  "utf8",
);
