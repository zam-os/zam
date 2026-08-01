/**
 * Bitwarden vault backend — first and only shipped vault (ADR 2026-07-30b).
 *
 * Resolves via the learner's `bw` CLI. Master passwords are never stored;
 * BW_SESSION may be restored from a machine-local 30-day file. A locked or
 * dead session surfaces as `locked` and clears the stored session.
 *
 * Locator form: `<item>/<field>` where field is a standard property
 * (`password`, `username`, `notes`) or a custom field name under `fields[]`.
 * `bw get <object> <item>` only accepts Bitwarden's own object names, so
 * custom fields require reading the full item JSON.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveBwCommand } from "../bw-executable.js";
import {
  invalidateBwSession,
  restoreBwSessionToEnv,
} from "../session-store.js";
import type { SecretBackend } from "../types.js";
import { SecretResolutionError } from "../types.js";

const execFileAsync = promisify(execFile);

const BW_TIMEOUT_MS = 15_000;

/** Standard login/item properties we accept as field names. */
const STANDARD_FIELDS = new Set(["password", "username", "notes"]);

interface BwCustomField {
  name?: string;
  value?: string | null;
}

interface BwLogin {
  username?: string | null;
  password?: string | null;
}

interface BwItem {
  name?: string;
  notes?: string | null;
  login?: BwLogin | null;
  fields?: BwCustomField[] | null;
}

function parseLocator(locator: string): { item: string; field: string } | null {
  const slash = locator.indexOf("/");
  if (slash <= 0 || slash === locator.length - 1) return null;
  const item = locator.slice(0, slash);
  const field = locator.slice(slash + 1);
  if (!item || !field) return null;
  return { item, field };
}

function extractField(item: BwItem, field: string): string | null {
  const key = field.toLowerCase();
  if (key === "password") {
    const v = item.login?.password;
    return typeof v === "string" && v.length > 0 ? v : null;
  }
  if (key === "username") {
    const v = item.login?.username;
    return typeof v === "string" && v.length > 0 ? v : null;
  }
  if (key === "notes") {
    const v = item.notes;
    return typeof v === "string" && v.length > 0 ? v : null;
  }
  // Custom field matched by name (case-insensitive).
  for (const f of item.fields ?? []) {
    if (
      typeof f.name === "string" &&
      f.name.toLowerCase() === field.toLowerCase() &&
      typeof f.value === "string" &&
      f.value.length > 0
    ) {
      return f.value;
    }
  }
  return null;
}

/**
 * Map bw exit / stderr onto the four resolution reasons. Never includes
 * secret values in the message — only structural diagnostics.
 */
function classifyBwFailure(err: unknown, ref: string): SecretResolutionError {
  const e = err as {
    code?: string | number;
    status?: number;
    stderr?: string | Buffer;
    stdout?: string | Buffer;
    message?: string;
    killed?: boolean;
  };

  if (e.code === "ENOENT") {
    return new SecretResolutionError(
      "not-installed",
      ref,
      "Bitwarden CLI (`bw`) is not installed. Install with: npm install -g @bitwarden/cli",
    );
  }

  const stderr =
    typeof e.stderr === "string"
      ? e.stderr
      : Buffer.isBuffer(e.stderr)
        ? e.stderr.toString("utf8")
        : "";
  const stdout =
    typeof e.stdout === "string"
      ? e.stdout
      : Buffer.isBuffer(e.stdout)
        ? e.stdout.toString("utf8")
        : "";
  const combined = `${stderr}\n${stdout}\n${e.message ?? ""}`.toLowerCase();

  if (
    combined.includes("vault is locked") ||
    combined.includes("not unlocked") ||
    combined.includes("session key") ||
    combined.includes("you are not logged in") ||
    combined.includes("not logged in")
  ) {
    return new SecretResolutionError(
      "locked",
      ref,
      "Bitwarden vault is locked or you are not logged in. Run `bw unlock` (or `bw login`) in this shell, then retry.",
    );
  }

  if (
    combined.includes("not found") ||
    combined.includes("no item") ||
    e.status === 1
  ) {
    // status 1 is bw's common "not found / error" — prefer not-found when
    // the message is ambiguous so the learner checks the item name first.
    if (
      combined.includes("not found") ||
      combined.includes("no item") ||
      combined.includes("more than one result")
    ) {
      return new SecretResolutionError(
        "not-found",
        ref,
        `Bitwarden item not found for reference "${ref}". Check the item name and field.`,
      );
    }
  }

  // Never echo stderr — it can contain item names or, in rare cases, values.
  return new SecretResolutionError(
    "backend-error",
    ref,
    `Bitwarden CLI failed while resolving "${ref}" (exit ${e.status ?? e.code ?? "unknown"}).`,
  );
}

export type BwRunner = (
  args: string[],
) => Promise<{ stdout: string; stderr: string }>;

async function defaultRunBw(
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  restoreBwSessionToEnv();
  const session = process.env.BW_SESSION?.trim();
  const finalArgs =
    session && !args.includes("--session")
      ? [...args, "--session", session]
      : args;
  // Windows needs the executable resolved explicitly; never a shell — see
  // bw-executable.ts and ADR 2026-07-30b Decision 11.
  const { file, prefixArgs } = resolveBwCommand();
  const { stdout, stderr } = await execFileAsync(
    file,
    [...prefixArgs, ...finalArgs],
    {
      encoding: "utf8",
      timeout: BW_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: process.env,
    },
  );
  return {
    stdout: typeof stdout === "string" ? stdout : String(stdout),
    stderr: typeof stderr === "string" ? stderr : String(stderr),
  };
}

export function createBitwardenBackend(
  run: BwRunner = defaultRunBw,
): SecretBackend {
  return {
    id: "bw",

    async isAvailable(): Promise<boolean> {
      try {
        await run(["--version"]);
        return true;
      } catch {
        return false;
      }
    },

    async resolve(locator: string): Promise<string> {
      const ref = `bw://${locator}`;
      // Rehydrate ≤30-day session before each vault read (bridge restarts often).
      restoreBwSessionToEnv();
      const parsed = parseLocator(locator);
      if (!parsed) {
        throw new SecretResolutionError(
          "backend-error",
          ref,
          `Invalid Bitwarden locator "${locator}". Expected item/field (e.g. zam-turso/token).`,
        );
      }

      let stdout: string;
      try {
        // Full item JSON so custom fields are reachable.
        const result = await run(["get", "item", parsed.item, "--pretty"]);
        stdout = result.stdout;
      } catch (err) {
        const failure = classifyBwFailure(err, ref);
        if (failure.reason === "locked") {
          invalidateBwSession();
        }
        throw failure;
      }

      let item: BwItem;
      try {
        item = JSON.parse(stdout) as BwItem;
      } catch {
        throw new SecretResolutionError(
          "backend-error",
          ref,
          `Bitwarden returned non-JSON output for item "${parsed.item}".`,
        );
      }

      const value = extractField(item, parsed.field);
      if (value === null) {
        const hint = STANDARD_FIELDS.has(parsed.field.toLowerCase())
          ? `standard field "${parsed.field}"`
          : `custom field "${parsed.field}"`;
        throw new SecretResolutionError(
          "not-found",
          ref,
          `Bitwarden item "${parsed.item}" has no ${hint}.`,
        );
      }
      return value;
    },
  };
}
