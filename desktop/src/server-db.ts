/**
 * Studio form to attach a Turso/sqld server database (issue #218).
 * Gates mobile pairing: local-only installs show this CTA instead of QR.
 *
 * When the token is vault-backed (Bitwarden), never push the learner to re-paste
 * URL/token — unlock once (≤30 day session) and reconnect automatically.
 */

import { assureBitwardenAccess } from "./bitwarden-assure.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

interface DatabaseTarget {
  kind: string;
  location: string;
}

interface DatabaseStatusResponse {
  success: boolean;
  connected: boolean;
  bitwardenRequired?: boolean;
  tursoUrl?: string | null;
  error?: string;
  target: DatabaseTarget;
  userId: string | null;
  cardCount: number;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing server-db element #${id}`);
  return element as T;
}

export interface ServerDbController {
  /** Refresh status from the bridge; returns true when a server DB is active. */
  refresh(): Promise<boolean>;
  isServerDb(): boolean;
}

/** Where a learner creates the database ZAM then connects to (issue #218). */
const TURSO_SIGNUP_URL = "https://turso.tech/";
const TURSO_DASHBOARD_URL = "https://app.turso.tech/";
const SQLD_SELFHOST_URL = "https://github.com/tursodatabase/libsql";

/**
 * Map a raw connect failure onto a localized, actionable message. The bridge
 * surfaces the driver's own English text; the three cases below are the ones a
 * learner can actually act on (issue #218). Anything else keeps the raw detail
 * rather than guessing.
 */
export function classifyServerDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bitwarden_required") || m.includes("bitwarden")) {
    return t("server_db_err_bitwarden");
  }
  if (
    /enotfound|eai_again|econnrefused|etimedout|econnreset|fetch failed|network|dns/.test(
      m,
    )
  ) {
    return t("server_db_err_network");
  }
  if (
    /401|403|unauthorized|forbidden|invalid token|authentication|auth failed|jwt/.test(
      m,
    )
  ) {
    return t("server_db_err_token");
  }
  if (/quota|429|too many requests|limit exceeded|free tier|storage limit/.test(m)) {
    return t("server_db_err_quota");
  }
  return tf("server_db_error", { message });
}

export function initServerDbWizard(
  onServerDbReady: () => void,
  actions: { openExternal(url: string): void },
): ServerDbController {
  const statusLine = requiredElement<HTMLElement>("server-db-status");
  const urlInput = requiredElement<HTMLInputElement>("server-db-url");
  const tokenInput = requiredElement<HTMLInputElement>("server-db-token");
  const connectButton = requiredElement<HTMLButtonElement>(
    "btn-server-db-connect",
  );
  const form = requiredElement<HTMLElement>("server-db-form");
  const pairButton = requiredElement<HTMLButtonElement>("btn-pair-mobile");
  const createHint = requiredElement<HTMLElement>("server-db-create-hint");
  const links = requiredElement<HTMLElement>("server-db-links");
  const urlField = urlInput.closest("label") as HTMLElement | null;
  const tokenField = tokenInput.closest("label") as HTMLElement | null;

  let serverDb = false;
  /** True when credentials point at cloud via Bitwarden (no re-paste needed). */
  let vaultBacked = false;

  requiredElement("lbl-settings-server-db-title").textContent =
    t("server_db_title");
  requiredElement("lbl-settings-server-db-help").textContent =
    t("server_db_help");
  requiredElement("lbl-server-db-url").textContent = t("server_db_url");
  requiredElement("lbl-server-db-token").textContent = t("server_db_token");
  connectButton.textContent = t("server_db_connect");
  urlInput.placeholder = t("server_db_url_ph");
  tokenInput.placeholder = t("server_db_token_ph");

  requiredElement("server-db-create-hint").textContent =
    t("server_db_create_hint");
  links.replaceChildren();
  for (const [label, url] of [
    [t("server_db_link_signup"), TURSO_SIGNUP_URL],
    [t("server_db_link_dashboard"), TURSO_DASHBOARD_URL],
    [t("server_db_link_selfhost"), SQLD_SELFHOST_URL],
  ] as const) {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "btn secondary-btn btn-sm";
    link.textContent = label;
    link.addEventListener("click", () => actions.openExternal(url));
    links.appendChild(link);
  }

  const migrateHint = document.createElement("p");
  migrateHint.className = "sub-label";
  migrateHint.textContent = t("server_db_migrate_hint");
  form.appendChild(migrateHint);

  const setStatus = (message: string, error = false): void => {
    statusLine.textContent = message;
    statusLine.classList.toggle("error-banner", error);
  };

  const applyGate = (): void => {
    pairButton.disabled = !serverDb;
    pairButton.title = serverDb ? "" : t("server_db_pair_blocked");
    form.hidden = false;
  };

  /** Show/hide the first-time paste form vs vault-backed state. */
  const setFormMode = (mode: "paste" | "vault-locked" | "connected"): void => {
    const showPaste = mode === "paste";
    createHint.hidden = !showPaste;
    links.hidden = !showPaste;
    if (urlField) urlField.hidden = !showPaste;
    if (tokenField) tokenField.hidden = !showPaste;
    connectButton.hidden = mode === "connected";
    if (mode === "vault-locked") {
      connectButton.hidden = false;
      connectButton.textContent = t("server_db_unlock_bitwarden");
    } else if (mode === "paste") {
      connectButton.textContent = t("server_db_connect");
    }
  };

  const refresh = async (): Promise<boolean> => {
    setStatus(t("server_db_checking"));
    try {
      const status = await runBridge<DatabaseStatusResponse>("database-status");

      if (status.bitwardenRequired) {
        vaultBacked = true;
        serverDb = false;
        applyGate();
        if (status.tursoUrl) urlInput.value = status.tursoUrl;
        setFormMode("vault-locked");
        setStatus(t("server_db_err_bitwarden"), false);
        statusLine.classList.remove("error-banner");
        return false;
      }

      serverDb = status.success && status.target.kind !== "local";
      applyGate();
      if (serverDb) {
        vaultBacked = true;
        setFormMode("connected");
        setStatus(
          tf("server_db_active", {
            kind: status.target.kind,
            location: status.target.location,
          }),
        );
        if (status.target.location && !urlInput.value) {
          urlInput.value = status.target.location;
        }
      } else {
        vaultBacked = false;
        setFormMode("paste");
        setStatus(t("server_db_local_only"));
      }
      return serverDb;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("BITWARDEN_REQUIRED") || /bitwarden/i.test(msg)) {
        vaultBacked = true;
        serverDb = false;
        applyGate();
        setFormMode("vault-locked");
        setStatus(t("server_db_err_bitwarden"), false);
        return false;
      }
      serverDb = false;
      applyGate();
      setFormMode("paste");
      setStatus(classifyServerDbError(msg), true);
      return false;
    }
  };

  const unlockAndRefresh = async (): Promise<void> => {
    connectButton.disabled = true;
    setStatus(t("server_db_unlocking_bw"));
    try {
      const ok = await assureBitwardenAccess();
      if (!ok) {
        setStatus(t("bw_assure_cancelled"), true);
        return;
      }
      const connected = await refresh();
      if (connected) onServerDbReady();
    } finally {
      connectButton.disabled = false;
    }
  };

  const connect = async (): Promise<void> => {
    // Vault-backed path: only unlock, never re-paste.
    if (vaultBacked || connectButton.textContent === t("server_db_unlock_bitwarden")) {
      await unlockAndRefresh();
      return;
    }

    const url = urlInput.value.trim();
    const token = tokenInput.value.trim();
    if (!url || !token) {
      setStatus(t("server_db_fields_required"), true);
      return;
    }
    connectButton.disabled = true;
    setStatus(t("server_db_connecting"));
    try {
      const result = await runBridge<DatabaseStatusResponse>(
        "server-db-connect",
        ["--url", url, "--token", token, "--mode", "remote"],
      );
      serverDb = result.target.kind !== "local";
      applyGate();
      tokenInput.value = "";
      setFormMode(serverDb ? "connected" : "paste");
      setStatus(
        tf("server_db_connected", {
          kind: result.target.kind,
          location: result.target.location,
        }),
      );
      if (serverDb) onServerDbReady();
    } catch (error) {
      setStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
    } finally {
      connectButton.disabled = false;
    }
  };

  connectButton.addEventListener("click", () => void connect());
  void refresh();

  return {
    refresh,
    isServerDb: () => serverDb,
  };
}
