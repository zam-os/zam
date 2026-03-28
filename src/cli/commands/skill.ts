/**
 * `zam skill` — Manage agent skill entries (task recipes).
 */

import { Command } from "commander";
import type { Database } from "libsql";
import {
  openDatabase,
  createAgentSkill,
  getAgentSkill,
  listAgentSkills,
} from "../../kernel/index.js";

function withDb(fn: (db: Database) => void): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  } finally {
    db?.close();
  }
}

export const skillCommand = new Command("skill")
  .description("Manage agent skill entries (task recipes)");

// ── zam skill list ────────────────────────────────────────────────────────

skillCommand
  .command("list")
  .description("List all agent skills")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const skills = listAgentSkills(db);

      if (opts.json) {
        console.log(JSON.stringify(skills, null, 2));
        return;
      }

      if (skills.length === 0) {
        console.log("No agent skills registered yet.");
        return;
      }

      console.log(`Agent Skills (${skills.length})`);
      console.log("─".repeat(60));
      for (const s of skills) {
        console.log(`  ${s.slug.padEnd(30)} [${s.source}]  ${s.description.slice(0, 40)}`);
        console.log(`    ${s.steps.length} step(s)  tokens: ${s.token_slugs.join(", ") || "none"}`);
      }
    });
  });

// ── zam skill show ────────────────────────────────────────────────────────

skillCommand
  .command("show")
  .description("Show a specific agent skill")
  .requiredOption("--slug <slug>", "Skill slug")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const skill = getAgentSkill(db, opts.slug);
      if (!skill) {
        console.error(`Skill not found: ${opts.slug}`);
        process.exit(1);
      }

      if (opts.json) {
        console.log(JSON.stringify(skill, null, 2));
        return;
      }

      console.log(`Skill: ${skill.slug}`);
      console.log(`  Description: ${skill.description}`);
      console.log(`  Source:      ${skill.source}`);
      console.log(`  Tokens:      ${skill.token_slugs.join(", ") || "none"}`);
      console.log(`  Created:     ${skill.created_at}`);
      console.log(`\nSteps:`);
      skill.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    });
  });

// ── zam skill add ─────────────────────────────────────────────────────────

skillCommand
  .command("add")
  .description("Register a new agent skill")
  .requiredOption("--slug <slug>", "Unique skill identifier")
  .requiredOption("--description <text>", "One-sentence description")
  .requiredOption("--steps <json>", "JSON array of step strings")
  .option("--tokens <slugs>", "Comma-separated token slugs related to this skill")
  .option("--source <type>", "Source: learned | builtin (default: learned)", "learned")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      let steps: string[];
      try {
        steps = JSON.parse(opts.steps) as string[];
        if (!Array.isArray(steps)) throw new Error("steps must be a JSON array");
      } catch {
        console.error("Invalid --steps: must be a valid JSON array of strings");
        process.exit(1);
      }

      const tokenSlugs = opts.tokens
        ? opts.tokens.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const skill = createAgentSkill(db, {
        slug: opts.slug,
        description: opts.description,
        steps,
        token_slugs: tokenSlugs,
        source: opts.source as "learned" | "builtin",
      });

      if (opts.json) {
        console.log(JSON.stringify(skill, null, 2));
      } else {
        console.log(`Skill registered: ${skill.slug}`);
        console.log(`  ${skill.steps.length} step(s) saved`);
      }
    });
  });
