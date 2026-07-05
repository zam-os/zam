/**
 * `zam knowledge-context` — Spaced-repetition knowledge context subcommand group.
 */

import { Command } from "commander";
import {
  assignTokenToContext,
  createKnowledgeContext,
  deleteKnowledgeContext,
  getActiveWorkspaceContext,
  getKnowledgeContextByName,
  getTokenBySlug,
  listKnowledgeContexts,
  setActiveWorkspaceContext,
  unassignTokenFromContext,
} from "../../kernel/index.js";
import { jsonOut, withDb } from "./shared/db.js";

export const knowledgeContextCommand = new Command("knowledge-context")
  .alias("kc")
  .description("Manage knowledge contexts (work, school, private)");

// ── zam knowledge-context list ───────────────────────────────────────────

knowledgeContextCommand
  .command("list")
  .description("List all knowledge contexts")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const contexts = await listKnowledgeContexts(db);

      if (opts.json) {
        jsonOut(contexts);
        return;
      }

      if (contexts.length === 0) {
        console.log("No knowledge contexts registered yet.");
        return;
      }

      console.log(`Knowledge Contexts (${contexts.length})`);
      console.log("─".repeat(60));
      for (const c of contexts) {
        const lang = c.language ? ` (${c.language})` : "";
        const label = c.label ? ` - ${c.label}` : "";
        console.log(`  ${c.name.padEnd(20)}${label}${lang}`);
      }
    });
  });

// ── zam knowledge-context create ─────────────────────────────────────────

knowledgeContextCommand
  .command("create")
  .description("Create a new knowledge context")
  .requiredOption(
    "--name <name>",
    "Unique context identifier (e.g. work-docuware)",
  )
  .option("--label <label>", "Display name")
  .option(
    "--language <language>",
    "Default language (BCP-47 code, e.g. en, de)",
  )
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await createKnowledgeContext(db, {
        name: opts.name,
        label: opts.label || null,
        language: opts.language || null,
      });

      if (opts.json) {
        jsonOut({ success: true, context });
        return;
      }

      console.log(`Created knowledge context: ${context.name}`);
      if (context.label) console.log(`  Label:    ${context.label}`);
      if (context.language) console.log(`  Language: ${context.language}`);
    });
  });

// ── zam knowledge-context delete ─────────────────────────────────────────

knowledgeContextCommand
  .command("delete")
  .description("Delete a knowledge context")
  .requiredOption("--name <name>", "Context name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await getKnowledgeContextByName(db, opts.name);
      if (!context) {
        console.error(`Knowledge context not found: ${opts.name}`);
        process.exit(1);
      }

      await deleteKnowledgeContext(db, context.id);

      if (opts.json) {
        jsonOut({ success: true, name: opts.name });
        return;
      }

      console.log(`Deleted knowledge context: ${opts.name}`);
    });
  });

// ── zam knowledge-context assign ─────────────────────────────────────────

knowledgeContextCommand
  .command("assign")
  .description("Assign a token to a knowledge context")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--context <name>", "Context name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await getKnowledgeContextByName(db, opts.context);
      if (!context) {
        console.error(`Knowledge context not found: ${opts.context}`);
        process.exit(1);
      }

      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      await assignTokenToContext(db, token.id, context.id);

      if (opts.json) {
        jsonOut({ success: true, token: token.slug, context: context.name });
        return;
      }

      console.log(
        `Assigned token "${token.slug}" to context "${context.name}"`,
      );
    });
  });

// ── zam knowledge-context unassign ───────────────────────────────────────

knowledgeContextCommand
  .command("unassign")
  .description("Remove a token from a knowledge context")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--context <name>", "Context name")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await getKnowledgeContextByName(db, opts.context);
      if (!context) {
        console.error(`Knowledge context not found: ${opts.context}`);
        process.exit(1);
      }

      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      await unassignTokenFromContext(db, token.id, context.id);

      if (opts.json) {
        jsonOut({ success: true, token: token.slug, context: context.name });
        return;
      }

      console.log(
        `Unassigned token "${token.slug}" from context "${context.name}"`,
      );
    });
  });

// ── zam knowledge-context use ────────────────────────────────────────────

knowledgeContextCommand
  .command("use")
  .description("Set the active knowledge context default for this device")
  .argument("[name]", "Context name to use (use without argument to clear)")
  .option("--json", "Output as JSON")
  .action(async (name, opts) => {
    await withDb(async (db) => {
      if (!name) {
        setActiveWorkspaceContext(undefined);
        if (opts.json) {
          jsonOut({ success: true, activeContext: null });
          return;
        }
        console.log("Cleared active knowledge context default.");
        return;
      }

      const context = await getKnowledgeContextByName(db, name);
      if (!context) {
        console.error(`Knowledge context not found: ${name}`);
        process.exit(1);
      }

      setActiveWorkspaceContext(context.name);

      if (opts.json) {
        jsonOut({ success: true, activeContext: context.name });
        return;
      }

      console.log(`Active knowledge context set to: ${context.name}`);
    });
  });

// ── zam knowledge-context show ───────────────────────────────────────────

knowledgeContextCommand
  .command("show")
  .description("Show the active knowledge context default for this device")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const active = getActiveWorkspaceContext();

    if (opts.json) {
      jsonOut({ success: true, activeContext: active ?? null });
      return;
    }

    if (active) {
      console.log(`Active knowledge context: ${active}`);
    } else {
      console.log("No active knowledge context default set.");
    }
  });
