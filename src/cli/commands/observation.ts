/**
 * `zam observation` — what this machine keeps from observation, and the
 * owner's controls for it (ADR 2026-10-08 R6, R8).
 *
 * Deliberately a learner command, not a bridge or MCP surface: listing and
 * deleting raw observation files is the owner's decision, and turning screen
 * observation on is not offered at all — that switch is edited by hand in
 * ~/.zam/config.json.
 */

import { confirm } from "@inquirer/prompts";
import { Command } from "commander";
import {
  closeSessionObservation,
  deleteObservationFiles,
  getObservationRetentionDays,
  inventoryObservationFiles,
  isScreenObservationEnabled,
  type ObservationFile,
  sweepObservationFiles,
} from "../../kernel/index.js";

export const observationCommand = new Command("observation").description(
  "What this machine keeps from observation, and how long",
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function printFiles(files: ObservationFile[]): void {
  for (const file of files) {
    console.log(
      `  ${file.kind.padEnd(25)} ${formatSize(file.sizeBytes).padStart(9)}  ${file.modifiedAt.slice(0, 10)}  ${file.path}`,
    );
  }
}

// ── zam observation status ──────────────────────────────────────────────────

observationCommand
  .command("status")
  .description("Show the screen switch, the retention window and kept files")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const files = inventoryObservationFiles();
    const status = {
      screenObservation: isScreenObservationEnabled() ? "on" : "off",
      retentionDays: getObservationRetentionDays(),
      files: files.length,
      legacyFiles: files.filter((file) => file.legacy).length,
    };
    if (opts.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    console.log(
      `Screen observation: ${status.screenObservation} (observation.screen in ~/.zam/config.json)`,
    );
    console.log(
      `Raw observation files are deleted after ${status.retentionDays} days, or when a session's synthesis is confirmed or dismissed.`,
    );
    console.log(
      `Files kept on this machine: ${status.files} (${status.legacyFiles} from before retention started).`,
    );
    if (status.legacyFiles > 0) {
      console.log(
        "Run `zam observation inventory` to list them and delete the old ones.",
      );
    }
  });

// ── zam observation inventory ───────────────────────────────────────────────

observationCommand
  .command("inventory")
  .description(
    "List raw observation files; with --delete, delete the ones from before retention started after you confirm",
  )
  .option("--json", "Output as JSON")
  .option("--delete", "Delete the listed files from before retention started")
  .option("--yes", "Do not ask before deleting")
  .action(async (opts) => {
    // Redact idle logs and apply the window first, so the list shows what
    // is actually left.
    sweepObservationFiles();
    const files = inventoryObservationFiles();
    const legacy = files.filter((file) => file.legacy);

    if (opts.json && !opts.delete) {
      console.log(JSON.stringify({ files }, null, 2));
      return;
    }
    if (files.length === 0) {
      console.log("No raw observation files on this machine.");
      return;
    }
    console.log(`Raw observation files on this machine (${files.length}):\n`);
    printFiles(files);
    if (legacy.length === 0) {
      console.log(
        "\nAll of them are within the retention window and will be deleted automatically.",
      );
      return;
    }
    console.log(
      `\n${legacy.length} of them are from before retention started. They may hold screen text or commands recorded before redaction existed, and are deleted only when you say so.`,
    );
    if (!opts.delete) {
      console.log("Run `zam observation inventory --delete` to delete them.");
      return;
    }
    const approved =
      opts.yes === true ||
      (await confirm({
        message: `Delete these ${legacy.length} files from before retention started?`,
        default: false,
      }));
    if (!approved) {
      console.log("Nothing deleted.");
      return;
    }
    const deleted = deleteObservationFiles(legacy);
    if (opts.json) {
      console.log(JSON.stringify({ deleted }, null, 2));
      return;
    }
    console.log(`Deleted ${deleted.length} of ${legacy.length}.`);
  });

// ── zam observation close ───────────────────────────────────────────────────

observationCommand
  .command("close")
  .description(
    "Delete a running or never-ended session's raw files here now, keeping a digest (session end does this by itself)",
  )
  .requiredOption("--session <id>", "Session ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const result = closeSessionObservation(opts.session);
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(
      result.deleted.length > 0
        ? `Deleted ${result.deleted.join(" and ")} for session ${result.sessionId}.`
        : `Nothing to delete for session ${result.sessionId}.`,
    );
  });
