/**
 * Studio form to attach a Turso/sqld server database (issue #218).
 * Gates mobile pairing: local-only installs show this CTA instead of QR.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

interface DatabaseTarget {
  kind: string;
  location: string;
}

interface DatabaseStatusResponse {
  success: boolean;
  connected: boolean;
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

  let serverDb = false;

  requiredElement("lbl-settings-server-db-title").textContent =
    t("server_db_title");
  requiredElement("lbl-settings-server-db-help").textContent =
    t("server_db_help");
  requiredElement("lbl-server-db-url").textContent = t("server_db_url");
  requiredElement("lbl-server-db-token").textContent = t("server_db_token");
  connectButton.textContent = t("server_db_connect");
  urlInput.placeholder = t("server_db_url_ph");
  tokenInput.placeholder = t("server_db_token_ph");

  // Create half of the wizard: ZAM deep-links to the host and the learner
  // creates the account and database there — it never signs up on their behalf
  // (same rule as the cloud-model card, ADR 2026-07-24 §5).
  requiredElement("server-db-create-hint").textContent =
    t("server_db_create_hint");
  const linkRow = requiredElement<HTMLElement>("server-db-links");
  linkRow.replaceChildren();
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
    linkRow.appendChild(link);
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

  const refresh = async (): Promise<boolean> => {
    setStatus(t("server_db_checking"));
    try {
      const status = await runBridge<DatabaseStatusResponse>("database-status");
      serverDb = status.target.kind !== "local";
      applyGate();
      if (serverDb) {
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
        setStatus(t("server_db_local_only"));
      }
      return serverDb;
    } catch (error) {
      serverDb = false;
      applyGate();
      setStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
      return false;
    }
  };

  const connect = async (): Promise<void> => {
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
