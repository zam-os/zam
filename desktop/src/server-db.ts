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

export function initServerDbWizard(
  onServerDbReady: () => void,
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
        tf("server_db_error", {
          message: error instanceof Error ? error.message : String(error),
        }),
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
        tf("server_db_error", {
          message: error instanceof Error ? error.message : String(error),
        }),
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
