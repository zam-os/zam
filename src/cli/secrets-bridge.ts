/**
 * Desktop/bridge helpers for Bitwarden vault access (ADR 2026-07-30b).
 *
 * The Studio never prints secret values. Session unlock keeps the master
 * password only long enough to call `bw unlock` and stores BW_SESSION only in
 * the bridge process environment (not on disk).
 *
 * Setup may **create** vault items (learner-directed write) so the user does
 * not have to hand-craft Bitwarden entries — only unlock + paste once in ZAM.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  getADOCredentials,
  getProviderApiKey,
  getTursoCredentials,
  listProviderApiKeyRefs,
  loadStoredCredentials,
  resolveCredentials,
  setADOCredentials,
  setProviderApiKey,
  setTursoCredentials,
} from "../kernel/credentials.js";
import {
  invalidateBwSession,
  isSecretRef,
  restoreBwSessionToEnv,
  savePersistedBwSession,
} from "../kernel/secrets/index.js";
import {
  clearBitwardenSyncConfig,
  getBitwardenSyncConfig,
  setBitwardenAutoSync,
  setBitwardenSyncConfig,
} from "../kernel/system/install-config.js";

const execFileAsync = promisify(execFile);
const BW_TIMEOUT_MS = 30_000;

/** Default item names ZAM creates during setup. */
export const ZAM_VAULT_ITEM_TURSO = "zam-turso";
export const ZAM_VAULT_ITEM_ADO = "zam-ado";
export function zamVaultItemProvider(ref: string): string {
  const safe = ref.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `zam-${safe || "provider"}`;
}

export type BitwardenCliStatusKind =
  | "not-installed"
  | "unauthenticated"
  | "locked"
  | "unlocked"
  | "error";

export interface BitwardenCliStatus {
  kind: BitwardenCliStatusKind;
  serverUrl: string | null;
  userEmail: string | null;
  region: "eu" | "us" | "self-hosted" | "unknown";
  /** True when process.env.BW_SESSION is set (this bridge process). */
  sessionInProcess: boolean;
  /** Learner opted in: keep vault in sync after changes (machine-local). */
  autoSync: boolean;
  /** ISO time of last successful transfer, if any. */
  lastSyncAt: string | null;
  /**
   * Machine-local secrets still stored as plaintext literals (mainly the
   * server DB token). Cloud model keys in the shared DB are not listed here.
   */
  pendingLiteralCount: number;
  message: string;
}

/** Count secrets still held as plaintext in credentials.json. */
export function countPendingLiteralSecrets(): number {
  const stored = loadStoredCredentials();
  let n = 0;
  if (stored.turso?.token !== undefined && !isSecretRef(stored.turso.token)) {
    if (
      typeof stored.turso.token === "string" &&
      stored.turso.token.length > 0
    ) {
      n += 1;
    }
  }
  if (stored.ado?.pat !== undefined && !isSecretRef(stored.ado.pat)) {
    if (typeof stored.ado.pat === "string" && stored.ado.pat.length > 0) n += 1;
  }
  for (const name of listProviderApiKeyRefs()) {
    const key = stored.llmProviders?.[name]?.apiKey;
    if (
      key !== undefined &&
      !isSecretRef(key) &&
      typeof key === "string" &&
      key.length > 0
    ) {
      n += 1;
    }
  }
  return n;
}

function classifyRegion(
  serverUrl: string | null,
): BitwardenCliStatus["region"] {
  if (!serverUrl) return "us"; // CLI default
  if (serverUrl.includes("bitwarden.eu")) return "eu";
  if (serverUrl.includes("bitwarden.com")) return "us";
  return "self-hosted";
}

/** Append --session when we have a live/restored session (more reliable than env alone). */
function withSessionArgs(args: string[]): string[] {
  const session = process.env.BW_SESSION?.trim();
  if (!session) return args;
  // Avoid duplicating if caller already passed --session.
  if (args.includes("--session")) return args;
  return [...args, "--session", session];
}

async function runBw(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync("bw", withSessionArgs(args), {
    encoding: "utf8",
    timeout: BW_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...env, BW_SESSION: process.env.BW_SESSION ?? env.BW_SESSION },
  });
  return {
    stdout: typeof stdout === "string" ? stdout : String(stdout),
    stderr: typeof stderr === "string" ? stderr : String(stderr),
  };
}

export async function getBitwardenCliStatus(): Promise<BitwardenCliStatus> {
  // Prefer a still-valid 30-day session over prompting again.
  restoreBwSessionToEnv();
  const sessionInProcess = Boolean(process.env.BW_SESSION?.trim());
  const syncCfg = getBitwardenSyncConfig();
  const autoSync = syncCfg.autoSync === true;
  const lastSyncAt = syncCfg.lastSyncAt ?? null;
  const pendingLiteralCount = countPendingLiteralSecrets();
  const base = {
    sessionInProcess,
    autoSync,
    lastSyncAt,
    pendingLiteralCount,
  };

  try {
    const { stdout } = await runBw(["status"]);
    const parsed = JSON.parse(stdout) as {
      status?: string;
      serverUrl?: string | null;
      userEmail?: string | null;
    };
    const status = parsed.status ?? "error";
    const serverUrl = parsed.serverUrl ?? null;
    const userEmail = parsed.userEmail ?? null;
    const region = classifyRegion(serverUrl);

    if (status === "unauthenticated") {
      return {
        kind: "unauthenticated",
        serverUrl,
        userEmail,
        region,
        ...base,
        message:
          "Bitwarden is not logged in on this machine. Open Bitwarden once, then unlock here.",
      };
    }
    if (status === "locked") {
      return {
        kind: "locked",
        serverUrl,
        userEmail,
        region,
        ...base,
        message: autoSync
          ? "Vault locked — unlock to resume automatic secret sync."
          : "Vault locked — unlock, then sync once to connect Bitwarden.",
      };
    }
    if (status === "unlocked") {
      return {
        kind: "unlocked",
        serverUrl,
        userEmail,
        region,
        ...base,
        message: autoSync
          ? pendingLiteralCount > 0
            ? "Connected — sync will move remaining machine secrets into Bitwarden."
            : "Connected — machine secrets stay in sync with Bitwarden while unlocked."
          : pendingLiteralCount > 0
            ? "Unlocked — press Sync to move known secrets into Bitwarden."
            : "Unlocked — press Sync to connect Bitwarden for this machine.",
      };
    }
    return {
      kind: "error",
      serverUrl,
      userEmail,
      region,
      ...base,
      message: `Unexpected Bitwarden status: ${status}`,
    };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === "ENOENT") {
      return {
        kind: "not-installed",
        serverUrl: null,
        userEmail: null,
        region: "unknown",
        ...base,
        message:
          "Bitwarden CLI is not installed. Optional — paste secrets still work. Install only if you want multi-machine sync.",
      };
    }
    return {
      kind: "error",
      serverUrl: null,
      userEmail: null,
      region: "unknown",
      ...base,
      message: e.message ?? String(err),
    };
  }
}

/**
 * Point the CLI at the EU or US cloud (idempotent). Does not log in.
 */
export async function configureBitwardenServer(
  region: "eu" | "us",
): Promise<void> {
  const url =
    region === "eu"
      ? "https://vault.bitwarden.eu"
      : "https://vault.bitwarden.com";
  await runBw(["config", "server", url]);
  setBitwardenSyncConfig({ region });
}

/**
 * Log in to Bitwarden CLI for this process. Password never stored.
 * Prefer authenticator 2FA (`code`) — FIDO2 is not available in the CLI.
 */
export async function loginBitwardenForProcess(opts: {
  email: string;
  password: string;
  /** TOTP from authenticator app */
  code?: string;
}): Promise<{ ok: true } | { ok: false; message: string; needs2fa?: boolean }> {
  const email = opts.email.trim();
  const password = opts.password;
  if (!email || !password) {
    return { ok: false, message: "Email and master password are required." };
  }

  const args = ["login", email, password, "--raw"];
  if (opts.code?.trim()) {
    // 0 = Authenticator (CLI-friendly); FIDO2 is not supported by bw CLI.
    args.push("--method", "0", "--code", opts.code.trim());
  }

  try {
    const { stdout } = await runBw(args);
    const session = stdout.trim();
    if (!session) {
      return { ok: false, message: "Login returned an empty session." };
    }
    process.env.BW_SESSION = session;
    savePersistedBwSession(session, { email });
    return { ok: true };
  } catch (err) {
    const e = err as {
      code?: string;
      stderr?: string | Buffer;
      message?: string;
    };
    if (e.code === "ENOENT") {
      return { ok: false, message: "Bitwarden CLI (`bw`) is not installed." };
    }
    const stderr =
      typeof e.stderr === "string"
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString("utf8")
          : "";
    const combined = `${stderr}\n${e.message ?? ""}`.toLowerCase();
    if (
      combined.includes("two-step") ||
      combined.includes("2fa") ||
      combined.includes("two step") ||
      combined.includes("code is required") ||
      combined.includes("verification")
    ) {
      return {
        ok: false,
        needs2fa: true,
        message:
          "Two-step login required. Enter the code from your authenticator app (FIDO2 is not supported in the CLI).",
      };
    }
    if (
      combined.includes("already logged in") ||
      combined.includes("you are already logged")
    ) {
      // Treat as success path: try unlock next.
      return { ok: true };
    }
    if (
      combined.includes("username or password is incorrect") ||
      combined.includes("invalid") ||
      combined.includes("incorrect")
    ) {
      return { ok: false, message: "Incorrect email or master password." };
    }
    if (combined.includes("no providers available")) {
      return {
        ok: false,
        message:
          "CLI cannot use FIDO2. Enable an Authenticator app under Bitwarden Two-step login, then try again.",
      };
    }
    return {
      ok: false,
      message: "Bitwarden login failed. Check email, password, and 2FA method.",
    };
  }
}

/**
 * Unlock the vault for this process only. Password never written to disk or logs.
 */
export async function unlockBitwardenForProcess(
  masterPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const password = masterPassword.trim();
  if (!password) {
    return { ok: false, message: "Master password is required." };
  }

  const env = {
    ...process.env,
    BW_PASSWORD: password,
  };

  try {
    const { stdout } = await runBw(
      ["unlock", "--passwordenv", "BW_PASSWORD", "--raw"],
      env,
    );
    const session = stdout.trim();
    if (!session) {
      return {
        ok: false,
        message: "Bitwarden unlock returned an empty session.",
      };
    }
    process.env.BW_SESSION = session;
    savePersistedBwSession(session);
    // Drop password from this env object; process.env.BW_PASSWORD was never set.
    return { ok: true };
  } catch (err) {
    const e = err as {
      code?: string;
      stderr?: string | Buffer;
      message?: string;
    };
    if (e.code === "ENOENT") {
      return {
        ok: false,
        message: "Bitwarden CLI (`bw`) is not installed.",
      };
    }
    const stderr =
      typeof e.stderr === "string"
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString("utf8")
          : "";
    const combined = `${stderr}\n${e.message ?? ""}`.toLowerCase();
    // Never echo stderr if it might contain secrets; map common cases only.
    if (
      combined.includes("invalid master password") ||
      combined.includes("incorrect")
    ) {
      return { ok: false, message: "Incorrect master password." };
    }
    if (
      combined.includes("not logged in") ||
      combined.includes("you are not logged in")
    ) {
      return {
        ok: false,
        message:
          "Bitwarden CLI is not logged in. Log in once with the Bitwarden app or: bw login",
      };
    }
    if (combined.includes("no providers available")) {
      return {
        ok: false,
        message:
          "CLI cannot complete 2FA with FIDO2 alone. Enable an Authenticator app under Two-step login, then unlock again.",
      };
    }
    // Session token may be stale after 30 days or vault timeout.
    if (
      combined.includes("session") ||
      combined.includes("unauthorized") ||
      combined.includes("locked")
    ) {
      invalidateBwSession();
    }
    return {
      ok: false,
      message:
        "Could not unlock Bitwarden. Check the master password and that the CLI is logged in.",
    };
  }
}

function requireUnlockedSession():
  | { ok: true }
  | { ok: false; message: string } {
  if (!process.env.BW_SESSION?.trim()) {
    return {
      ok: false,
      message:
        "Bitwarden is not unlocked for this ZAM session. Unlock in Settings first.",
    };
  }
  return { ok: true };
}

function bwEncode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

interface BwListItem {
  id?: string;
  name?: string;
}

async function findItemIdByName(name: string): Promise<string | null> {
  const { stdout } = await runBw(["list", "items", "--search", name]);
  let items: BwListItem[] = [];
  try {
    items = JSON.parse(stdout || "[]") as BwListItem[];
  } catch {
    return null;
  }
  const hit = items.find((i) => i.name === name && typeof i.id === "string");
  return hit?.id ?? null;
}

async function deleteItemByName(name: string): Promise<boolean> {
  const id = await findItemIdByName(name);
  if (!id) return false;
  await runBw(["delete", "item", id]);
  return true;
}

/**
 * Create (or replace) a login item with a custom field ZAM can resolve via
 * `bw://item/field`. Secret goes in both login.password and the named field.
 */
export async function upsertBitwardenSecretItem(opts: {
  itemName: string;
  fieldName: string;
  secret: string;
  notes?: string;
}): Promise<
  | { ok: true; itemName: string; fieldName: string; secretRef: string }
  | {
      ok: false;
      message: string;
    }
> {
  const gate = requireUnlockedSession();
  if (!gate.ok) return gate;

  const itemName = opts.itemName.trim();
  const fieldName = opts.fieldName.trim();
  const secret = opts.secret;
  if (!itemName || !fieldName || !secret) {
    return {
      ok: false,
      message: "itemName, fieldName, and secret are required.",
    };
  }

  try {
    await deleteItemByName(itemName);
    const item = {
      type: 1,
      name: itemName,
      notes: opts.notes ?? "Created by ZAM — multi-machine secrets setup",
      login: {
        username: "zam",
        password: secret,
        totp: null,
        uris: [] as unknown[],
      },
      fields: [{ name: fieldName, value: secret, type: 0 }],
      favorite: false,
      reprompt: 0,
    };
    await runBw(["create", "item", bwEncode(item)]);
    // Push so other machines see the item after sync.
    try {
      await runBw(["sync"]);
    } catch {
      // offline sync failure is non-fatal for this machine
    }
    return {
      ok: true,
      itemName,
      fieldName,
      secretRef: `bw://${itemName}/${fieldName}`,
    };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === "ENOENT") {
      return { ok: false, message: "Bitwarden CLI (`bw`) is not installed." };
    }
    return {
      ok: false,
      message:
        "Could not create the Bitwarden item. Unlock the vault and try again.",
    };
  }
}

export interface SeedResultEntry {
  field: string;
  secretRef: string;
  itemName: string;
  /** true when a literal was present and moved into the vault */
  seeded: boolean;
  skipped?: string;
}

/**
 * Copy every literal secret currently in credentials.json into Bitwarden and
 * replace on-disk values with vault references. Idempotent for refs already set.
 */
export async function seedCredentialsIntoBitwarden(): Promise<
  | { ok: true; entries: SeedResultEntry[] }
  | { ok: false; message: string; entries: SeedResultEntry[] }
> {
  const gate = requireUnlockedSession();
  if (!gate.ok) return { ...gate, entries: [] };

  const stored = loadStoredCredentials();
  const entries: SeedResultEntry[] = [];
  let failed: string | null = null;

  // Turso token
  if (stored.turso?.token !== undefined) {
    if (isSecretRef(stored.turso.token)) {
      entries.push({
        field: "turso.token",
        secretRef: stored.turso.token.$secret,
        itemName: ZAM_VAULT_ITEM_TURSO,
        seeded: false,
        skipped: "already-a-reference",
      });
    } else if (stored.turso.token.length > 0 && stored.turso.url) {
      const created = await upsertBitwardenSecretItem({
        itemName: ZAM_VAULT_ITEM_TURSO,
        fieldName: "token",
        secret: stored.turso.token,
      });
      if (!created.ok) {
        failed = created.message;
      } else {
        setTursoCredentials(
          stored.turso.url,
          { $secret: created.secretRef },
          undefined,
          stored.turso.mode,
        );
        entries.push({
          field: "turso.token",
          secretRef: created.secretRef,
          itemName: created.itemName,
          seeded: true,
        });
      }
    }
  }

  // ADO PAT
  if (!failed && stored.ado?.pat !== undefined) {
    if (isSecretRef(stored.ado.pat)) {
      entries.push({
        field: "ado.pat",
        secretRef: stored.ado.pat.$secret,
        itemName: ZAM_VAULT_ITEM_ADO,
        seeded: false,
        skipped: "already-a-reference",
      });
    } else if (
      stored.ado.pat.length > 0 &&
      stored.ado.org_url &&
      stored.ado.project
    ) {
      const created = await upsertBitwardenSecretItem({
        itemName: ZAM_VAULT_ITEM_ADO,
        fieldName: "pat",
        secret: stored.ado.pat,
      });
      if (!created.ok) {
        failed = created.message;
      } else {
        setADOCredentials(stored.ado.org_url, stored.ado.project, {
          $secret: created.secretRef,
        });
        entries.push({
          field: "ado.pat",
          secretRef: created.secretRef,
          itemName: created.itemName,
          seeded: true,
        });
      }
    }
  }

  // Provider API keys
  for (const name of listProviderApiKeyRefs()) {
    if (failed) break;
    const storedKey = stored.llmProviders?.[name]?.apiKey;
    if (storedKey === undefined) continue;
    if (isSecretRef(storedKey)) {
      entries.push({
        field: `llmProviders.${name}.apiKey`,
        secretRef: storedKey.$secret,
        itemName: zamVaultItemProvider(name),
        seeded: false,
        skipped: "already-a-reference",
      });
      continue;
    }
    // getProviderApiKey after resolve would need resolve — use stored literal
    if (typeof storedKey !== "string" || storedKey.length === 0) continue;
    const created = await upsertBitwardenSecretItem({
      itemName: zamVaultItemProvider(name),
      fieldName: "apiKey",
      secret: storedKey,
    });
    if (!created.ok) {
      failed = created.message;
      break;
    }
    setProviderApiKey(name, { $secret: created.secretRef });
    entries.push({
      field: `llmProviders.${name}.apiKey`,
      secretRef: created.secretRef,
      itemName: created.itemName,
      seeded: true,
    });
  }

  await resolveCredentials();

  if (failed) {
    return { ok: false, message: failed, entries };
  }
  if (entries.length === 0) {
    // Already fully referenced — still mark auto-sync connected.
    setBitwardenAutoSync(true);
    return { ok: true, entries };
  }
  setBitwardenAutoSync(true);
  return { ok: true, entries };
}

/**
 * One-button sync: push known machine-local secrets into Bitwarden and enable
 * auto-sync for later changes. Prefer this over asking the learner to re-paste.
 */
export async function syncSecretsWithBitwarden(): Promise<
  | { ok: true; entries: SeedResultEntry[]; autoSync: true }
  | { ok: false; message: string; entries: SeedResultEntry[] }
> {
  const result = await seedCredentialsIntoBitwarden();
  if (!result.ok) return result;
  return { ok: true, entries: result.entries, autoSync: true };
}

/** If auto-sync is on and the vault is unlocked, push current literals. */
export async function maybeAutoSyncSecrets(): Promise<void> {
  if (getBitwardenSyncConfig().autoSync !== true) return;
  if (!process.env.BW_SESSION?.trim()) return;
  if (countPendingLiteralSecrets() === 0) return;
  await seedCredentialsIntoBitwarden();
}

export interface DisconnectResultEntry {
  field: string;
  /** Was a vault reference converted back to a local literal. */
  restored: boolean;
  skipped?: string;
}

/**
 * Offboard Bitwarden: resolve every vault reference into a local literal in
 * credentials.json, disable auto-sync, and drop the persisted BW session.
 * Does **not** delete items in the learner's Bitwarden vault (they keep ownership).
 */
export async function disconnectBitwardenToLocalSecrets(): Promise<
  | { ok: true; entries: DisconnectResultEntry[] }
  | { ok: false; message: string; entries: DisconnectResultEntry[] }
> {
  restoreBwSessionToEnv();
  const entries: DisconnectResultEntry[] = [];
  const stored = loadStoredCredentials();

  // Need a live vault if any refs remain.
  const hasRefs =
    (stored.turso && isSecretRef(stored.turso.token)) ||
    (stored.ado && isSecretRef(stored.ado.pat)) ||
    Object.values(stored.llmProviders ?? {}).some((e) =>
      isSecretRef(e?.apiKey),
    );

  if (hasRefs) {
    if (!process.env.BW_SESSION?.trim()) {
      return {
        ok: false,
        message:
          "Bitwarden is locked. Unlock once so ZAM can copy secrets back into the local config.",
        entries,
      };
    }
    await resolveCredentials();
  }

  // Turso
  if (stored.turso?.token !== undefined) {
    if (isSecretRef(stored.turso.token)) {
      const token = getTursoCredentials()?.token;
      const url = stored.turso.url ?? getTursoCredentials()?.url;
      if (!token || !url) {
        return {
          ok: false,
          message:
            "Could not resolve the server-database token from Bitwarden. Unlock and try again.",
          entries,
        };
      }
      setTursoCredentials(url, token, undefined, stored.turso.mode);
      entries.push({ field: "turso.token", restored: true });
    } else {
      entries.push({
        field: "turso.token",
        restored: false,
        skipped: "already-local",
      });
    }
  }

  // ADO
  if (stored.ado?.pat !== undefined) {
    if (isSecretRef(stored.ado.pat)) {
      // re-resolve after turso write may have invalidated snapshot — resolve again
      await resolveCredentials();
      const ado = getADOCredentials();
      if (!ado) {
        return {
          ok: false,
          message:
            "Could not resolve the Azure DevOps token from Bitwarden. Unlock and try again.",
          entries,
        };
      }
      setADOCredentials(ado.org_url, ado.project, ado.pat);
      entries.push({ field: "ado.pat", restored: true });
    } else {
      entries.push({
        field: "ado.pat",
        restored: false,
        skipped: "already-local",
      });
    }
  }

  // Provider keys
  const providerNames = Object.keys(stored.llmProviders ?? {});
  for (const name of providerNames) {
    const entry = stored.llmProviders?.[name]?.apiKey;
    if (entry === undefined) continue;
    if (isSecretRef(entry)) {
      await resolveCredentials();
      const key = getProviderApiKey(name);
      if (!key) {
        return {
          ok: false,
          message: `Could not resolve API key "${name}" from Bitwarden. Unlock and try again.`,
          entries,
        };
      }
      setProviderApiKey(name, key);
      entries.push({
        field: `llmProviders.${name}.apiKey`,
        restored: true,
      });
    } else {
      entries.push({
        field: `llmProviders.${name}.apiKey`,
        restored: false,
        skipped: "already-local",
      });
    }
  }

  // End Bitwarden linkage for this install.
  clearBitwardenSyncConfig();
  invalidateBwSession();
  // Snapshot holds plaintext again via setters; force a clean resolve from disk.
  await resolveCredentials();

  return { ok: true, entries };
}

/**
 * Create a Turso vault item and point credentials.json at it (and optional URL).
 */
export async function seedTursoIntoBitwarden(opts: {
  url: string;
  token: string;
  mode?: "native" | "remote";
}): Promise<
  | { ok: true; secretRef: string; itemName: string }
  | { ok: false; message: string }
> {
  const url = opts.url.trim();
  const token = opts.token.trim();
  if (!url || !token) {
    return { ok: false, message: "URL and token are required." };
  }
  const created = await upsertBitwardenSecretItem({
    itemName: ZAM_VAULT_ITEM_TURSO,
    fieldName: "token",
    secret: token,
  });
  if (!created.ok) return created;
  setTursoCredentials(
    url,
    { $secret: created.secretRef },
    undefined,
    opts.mode,
  );
  await resolveCredentials();
  if (!getTursoCredentials()) {
    return {
      ok: false,
      message:
        "Vault item was created but the token could not be resolved. Check unlock state.",
    };
  }
  return {
    ok: true,
    secretRef: created.secretRef,
    itemName: created.itemName,
  };
}

export async function seedProviderKeyIntoBitwarden(opts: {
  ref: string;
  apiKey: string;
}): Promise<
  | { ok: true; secretRef: string; itemName: string; ref: string }
  | { ok: false; message: string }
> {
  const ref = opts.ref.trim();
  const apiKey = opts.apiKey.trim();
  if (!ref || !apiKey) {
    return { ok: false, message: "Provider ref and API key are required." };
  }
  const created = await upsertBitwardenSecretItem({
    itemName: zamVaultItemProvider(ref),
    fieldName: "apiKey",
    secret: apiKey,
  });
  if (!created.ok) return created;
  setProviderApiKey(ref, { $secret: created.secretRef });
  await resolveCredentials();
  if (getProviderApiKey(ref) === null) {
    return {
      ok: false,
      message:
        "Vault item was created but the key could not be resolved. Check unlock state.",
    };
  }
  return {
    ok: true,
    secretRef: created.secretRef,
    itemName: created.itemName,
    ref,
  };
}
