/**
 * `zam knowledge-map` — Inspect and validate repository knowledge maps.
 *
 * Implements ADR 2026-10-03 (Repo Knowledge Map).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Command } from "commander";
import type { KnowledgeMap } from "../knowledge-map/types.js";
import { validateKnowledgeMap } from "../knowledge-map/validator.js";

export const knowledgeMapCommand = new Command("knowledge-map").description(
  "Inspect and validate repository knowledge maps (ADR 2026-10-03)",
);

knowledgeMapCommand
  .command("validate")
  .description(
    "Validate a repository knowledge map (default: docs/knowledge-map/map.json)",
  )
  .argument(
    "[path]",
    "Path to map.json file (default: docs/knowledge-map/map.json)",
  )
  .option("--json", "Emit validation result as JSON")
  .action((customPath?: string, opts?: { json?: boolean }) => {
    const cwd = process.cwd();
    const targetFile = customPath
      ? resolve(cwd, customPath)
      : join(cwd, "docs", "knowledge-map", "map.json");

    if (!existsSync(targetFile)) {
      if (opts?.json) {
        console.log(
          JSON.stringify({
            valid: false,
            errors: [`File not found: ${targetFile}`],
          }),
        );
      } else {
        console.error(`✗ Knowledge map file not found: ${targetFile}`);
      }
      process.exitCode = 1;
      return;
    }

    let parsed: unknown;
    try {
      const raw = readFileSync(targetFile, "utf-8");
      parsed = JSON.parse(raw);
    } catch (err) {
      const msg = `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`;
      if (opts?.json) {
        console.log(JSON.stringify({ valid: false, errors: [msg] }));
      } else {
        console.error(`✗ ${msg}`);
      }
      process.exitCode = 1;
      return;
    }

    // Infer repo root from target file location or cwd
    const repoRoot = customPath ? dirname(dirname(dirname(targetFile))) : cwd;

    const result = validateKnowledgeMap(parsed, repoRoot);

    if (opts?.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.valid) {
      const map = parsed as KnowledgeMap;
      console.log(
        `✓ ${targetFile} is valid (${map.statements.length} statements, ${map.relations.length} relations)`,
      );
    } else {
      console.error(`✗ Validation failed for ${targetFile}:`);
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
    }

    if (!result.valid) {
      process.exitCode = 1;
    }
  });
