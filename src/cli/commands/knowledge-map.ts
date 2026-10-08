/**
 * `zam knowledge-map` — the authoring guide and validator for repository
 * knowledge maps (ADR 2026-10-03), for agents without ZAM's MCP tools and for
 * CI. The MCP tools `zam_knowledge_map_guide` / `zam_knowledge_map_write`
 * remain the preferred path.
 */

import { resolve } from "node:path";
import { Command } from "commander";

export const knowledgeMapCommand = new Command("knowledge-map").description(
  "Guide and validator for repository knowledge maps (docs/knowledge-map/map.json)",
);

knowledgeMapCommand
  .command("guide")
  .description("Print the authoring guide an agent follows to build a map")
  .action(async () => {
    const { KNOWLEDGE_MAP_GUIDE } = await import("../knowledge-map/guide.js");
    process.stdout.write(KNOWLEDGE_MAP_GUIDE);
  });

knowledgeMapCommand
  .command("view")
  .description(
    "Open a repository's knowledge map in the browser, all views in one page",
  )
  .option("--repo <path>", "Repository root (default: the current directory)")
  .option("--out <file>", "Write the page here instead of a temporary file")
  .option("--no-open", "Write the page without opening it")
  .option("--json", "Emit the result as JSON")
  .action(
    async (opts: {
      repo?: string;
      out?: string;
      open: boolean;
      json?: boolean;
    }) => {
      const { viewKnowledgeMap } = await import(
        "../knowledge-map/viewer-page.js"
      );
      const result = viewKnowledgeMap({
        repo: resolve(opts.repo ?? process.cwd()),
        out: opts.out,
        open: opts.open,
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (!result.ok) {
        console.error(result.error);
        for (const issue of result.issues.filter(
          (entry) => entry.level === "error",
        )) {
          console.error(
            `error: ${issue.id ? `${issue.id}: ` : ""}${issue.message}`,
          );
        }
      } else {
        console.log(
          `${result.opened ? "Opened" : "Wrote"} ${result.path} (${result.statements} statements, ${result.relations} links).`,
        );
      }
      if (!result.ok) process.exitCode = 1;
    },
  );

knowledgeMapCommand
  .command("validate")
  .description(
    "Check docs/knowledge-map/map.json of a repository; exits 1 on errors",
  )
  .option("--repo <path>", "Repository root (default: the current directory)")
  .option(
    "--write",
    "When valid, rewrite the file in canonical form with the JSON-LD context and schema link",
  )
  .option("--json", "Emit the result as JSON")
  .action(async (opts: { repo?: string; write?: boolean; json?: boolean }) => {
    const { loadKnowledgeMap, writeKnowledgeMap } = await import(
      "../knowledge-map/load.js"
    );
    const repo = resolve(opts.repo ?? process.cwd());
    const loaded = loadKnowledgeMap(repo);
    let written = false;
    if (loaded.map && opts.write) {
      written = writeKnowledgeMap(repo, loaded.map).ok;
    }
    const errors = loaded.issues.filter((issue) => issue.level === "error");
    const ok = loaded.found && loaded.map !== null;
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            ok,
            found: loaded.found,
            path: loaded.path,
            written,
            statements: loaded.map?.statements.length ?? 0,
            relations: loaded.map?.relations.length ?? 0,
            issues: loaded.issues,
          },
          null,
          2,
        ),
      );
    } else if (!loaded.found) {
      console.error(`No knowledge map at ${loaded.path}`);
    } else {
      for (const issue of loaded.issues) {
        const where = issue.id ? `${issue.id}: ` : "";
        const out = issue.level === "error" ? console.error : console.warn;
        out(`${issue.level}: ${where}${issue.message}`);
      }
      if (ok) {
        console.log(
          `Valid: ${loaded.map?.statements.length} statements, ${loaded.map?.relations.length} links${written ? " (rewritten)" : ""}.`,
        );
      } else {
        console.error(`${errors.length} error(s) in ${loaded.path}`);
      }
    }
    if (!ok) process.exitCode = 1;
  });
