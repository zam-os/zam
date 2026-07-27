import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findMachO } from "./macho.mjs";

/**
 * Signs every Mach-O object under desktop/src-tauri/resources with the Apple
 * Developer ID identity, so that Apple's notary service accepts the bundle.
 *
 * Tauri signs the app bundle, its frameworks and its sidecars — but not
 * arbitrary resources, and it does not pass `--deep`. The bundled Node runtime
 * and the prebuilt `.node` modules therefore keep the ad-hoc signature they
 * arrive with, and notarization rejects the whole app with "The binary is not
 * signed with a valid Developer ID certificate".
 *
 * This runs as Tauri's `beforeBundleCommand`, which is the only hook that
 * works: the bundler copies the resources into the .app during the bundling
 * phase, so the signatures travel with the copies. Signing earlier is
 * pointless — `beforeBuildCommand` re-runs `desktop:prepare`, which reinstalls
 * the resource tree from scratch and throws any earlier signature away.
 *
 * Paths are discovered, never hardcoded: which prebuilt binaries npm installs
 * changes with the dependency tree (better-sqlite3 alone ships either
 * `prebuilds/darwin-*.node` or a locally compiled `build/Release/*.node`).
 */

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (process.platform !== "darwin") {
  console.log("Not macOS — nothing to sign");
  process.exit(0);
}

const identity =
  optionValue("--identity") ?? process.env.APPLE_SIGNING_IDENTITY;
if (!identity) {
  // Unsigned local builds are the norm; only the release workflow has an
  // identity. That workflow verifies the finished bundle separately, so a
  // missing secret cannot slip through as a silently unsigned release.
  console.log("No APPLE_SIGNING_IDENTITY — leaving bundled binaries unsigned");
  process.exit(0);
}

const keychain =
  optionValue("--keychain") ?? process.env.APPLE_SIGNING_KEYCHAIN;
const dryRun = args.includes("--dry-run");

const resourceRoot = join(repoRoot, "desktop", "src-tauri", "resources");
const nodeEntitlements = join(
  repoRoot,
  "desktop",
  "src-tauri",
  "node.entitlements",
);

const targets = [...findMachO(resourceRoot)];
if (targets.length === 0) {
  throw new Error(
    `No Mach-O objects found under ${resourceRoot} — run desktop:prepare and observer:prepare first`,
  );
}

/**
 * Only the bundled Node runtime needs entitlements: V8 compiles JavaScript to
 * machine code at runtime, which the hardened runtime forbids by default. The
 * observer sidecar is plain Rust and needs none, and entitlements do not apply
 * to libraries at all.
 */
function entitlementsFor(target) {
  if (!target.executable) return undefined;
  return target.path.endsWith(join("zam-cli", "runtime", "node"))
    ? nodeEntitlements
    : undefined;
}

const signed = [];
for (const target of targets) {
  const entitlements = entitlementsFor(target);
  const label = relative(repoRoot, target.path);
  const suffix = entitlements ? " (+ node.entitlements)" : "";

  if (dryRun) {
    console.log(`would sign ${label}${suffix}`);
    continue;
  }

  const codesignArgs = [
    "--force",
    "--timestamp",
    "--options",
    "runtime",
    "--sign",
    identity,
  ];
  if (keychain) codesignArgs.push("--keychain", keychain);
  if (entitlements) codesignArgs.push("--entitlements", entitlements);
  codesignArgs.push(target.path);

  const result = spawnSync("codesign", codesignArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`codesign failed for ${label}`);
  }
  signed.push(target);
  console.log(`signed ${label}${suffix}`);
}

for (const target of signed) {
  const verify = spawnSync("codesign", ["--verify", "--strict", target.path], {
    stdio: "inherit",
  });
  if (verify.status !== 0) {
    throw new Error(
      `signature verification failed for ${relative(repoRoot, target.path)}`,
    );
  }
}

console.log(
  `${dryRun ? "Would sign" : "Signed"} ${targets.length} bundled Mach-O object(s)`,
);
