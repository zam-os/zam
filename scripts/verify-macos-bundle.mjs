import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { findMachO } from "./macho.mjs";

/**
 * Verifies that a built ZAM.app is fully signed — and, with --notarized, that
 * Apple has issued and stapled a ticket for it.
 *
 * The check that matters is the ad-hoc one: a single unsigned Mach-O object
 * anywhere in the bundle makes Apple reject the whole app, and it is easy to
 * reintroduce by adding a dependency that ships a prebuilt binary. The release
 * workflow runs this so that failure mode cannot reach a release unnoticed.
 *
 * Usage: node scripts/verify-macos-bundle.mjs <path to .app> [--notarized]
 */

const args = process.argv.slice(2);
const notarized = args.includes("--notarized");
const appPath = args.find((arg) => !arg.startsWith("--"));

if (!appPath) {
  throw new Error(
    "usage: verify-macos-bundle.mjs <path to .app> [--notarized]",
  );
}

const app = resolve(appPath);
if (!existsSync(app)) {
  throw new Error(`no such bundle: ${app}`);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

const problems = [];

for (const target of findMachO(app)) {
  const label = relative(app, target.path) || "(main executable)";
  const { status, output } = run("codesign", [
    "-dv",
    "--verbose=2",
    target.path,
  ]);
  if (status !== 0) {
    problems.push(`${label}: no code signature`);
    continue;
  }
  if (/Signature=adhoc/.test(output)) {
    problems.push(`${label}: ad-hoc signature — Apple will reject this bundle`);
    continue;
  }
  const team = output.match(/TeamIdentifier=(\S+)/)?.[1];
  if (!team || team === "not") {
    problems.push(`${label}: no Team ID in signature`);
    continue;
  }
  const runtime = /flags=0x[0-9a-f]*\(.*runtime.*\)/.test(output);
  if (target.executable && !runtime) {
    problems.push(`${label}: executable without hardened runtime`);
    continue;
  }
  console.log(`ok ${label} (${team})${runtime ? " runtime" : ""}`);
}

const deep = run("codesign", [
  "--verify",
  "--deep",
  "--strict",
  "--verbose=2",
  app,
]);
if (deep.status !== 0) {
  problems.push(`codesign --verify --deep --strict failed:\n${deep.output}`);
} else {
  console.log("ok codesign --verify --deep --strict");
}

if (notarized) {
  const staple = run("xcrun", ["stapler", "validate", app]);
  if (staple.status !== 0) {
    problems.push(`stapler validate failed:\n${staple.output}`);
  } else {
    console.log("ok stapled notarization ticket");
  }

  const assess = run("spctl", ["--assess", "--type", "execute", "-vvv", app]);
  if (assess.status !== 0) {
    problems.push(`spctl assessment failed:\n${assess.output}`);
  } else {
    console.log(`ok Gatekeeper: ${assess.output.trim().split("\n").pop()}`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  throw new Error(`${problems.length} problem(s) with ${app}`);
}

console.log(`\n${app} is fully signed${notarized ? " and notarized" : ""}`);
