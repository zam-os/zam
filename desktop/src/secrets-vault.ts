/**
 * Studio Settings: Bitwarden multi-machine secret sync (ADR 2026-07-30b).
 *
 * Deliberately simple: unlock if needed, one Sync button. Secrets already live
 * in ZAM (server DB token; cloud model keys are usually in the shared DB).
 * No re-paste forms. After the first successful sync, auto-sync stays on while
 * the vault is unlocked for this session.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

export interface SecretsStatusResponse {
  success: boolean;
  kind: "not-installed" | "unauthenticated" | "locked" | "unlocked" | "error";
  serverUrl: string | null;
  userEmail: string | null;
  region: "eu" | "us" | "self-hosted" | "unknown";
  sessionInProcess: boolean;
  autoSync: boolean;
  lastSyncAt: string | null;
  pendingLiteralCount: number;
  message: string;
}

export interface SecretsSyncResponse extends SecretsStatusResponse {
  entries?: Array<{
    field: string;
    secretRef: string;
    itemName: string;
    seeded: boolean;
    skipped?: string;
  }>;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing secrets-vault element #${id}`);
  return el as T;
}

export interface SecretsVaultController {
  refresh(): Promise<void>;
}

export function initSecretsVault(
  actions: { openExternal(url: string): void },
): SecretsVaultController {
  const statusLine = requiredElement<HTMLElement>("secrets-vault-status");
  const detailLine = requiredElement<HTMLElement>("secrets-vault-detail");
  const passwordInput = requiredElement<HTMLInputElement>(
    "secrets-vault-password",
  );
  const unlockRow = requiredElement<HTMLElement>("secrets-vault-unlock-row");
  const unlockBtn = requiredElement<HTMLButtonElement>("btn-secrets-unlock");
  const syncBtn = requiredElement<HTMLButtonElement>("btn-secrets-sync");
  const openVaultBtn = requiredElement<HTMLButtonElement>(
    "btn-secrets-open-vault",
  );
  const disconnectBtn = requiredElement<HTMLButtonElement>(
    "btn-secrets-disconnect",
  );

  let lastStatus: SecretsStatusResponse | null = null;

  const applyLabels = (): void => {
    requiredElement("lbl-settings-secrets-title").textContent = t(
      "secrets_vault_title",
    );
    requiredElement("lbl-settings-secrets-help").textContent = t(
      "secrets_vault_help",
    );
    requiredElement("lbl-secrets-unlock").textContent = t(
      "secrets_vault_unlock_label",
    );
    unlockBtn.textContent = t("secrets_vault_unlock");
    syncBtn.textContent = t("secrets_vault_sync");
    openVaultBtn.textContent = t("secrets_vault_open");
    disconnectBtn.textContent = t("secrets_vault_disconnect");
    passwordInput.placeholder = t("secrets_vault_password_ph");
  };

  const setStatus = (message: string, error = false): void => {
    statusLine.textContent = message;
    statusLine.classList.toggle("error-banner", error);
  };

  const setDetail = (message: string): void => {
    detailLine.textContent = message;
  };

  const refresh = async (): Promise<void> => {
    applyLabels();
    setStatus(t("secrets_vault_checking"));
    setDetail("");
    try {
      const status = await runBridge<SecretsStatusResponse>("secrets-status");
      lastStatus = status;
      const email = status.userEmail ? ` · ${status.userEmail}` : "";
      const regionLabel =
        status.region === "eu"
          ? t("secrets_vault_region_badge_eu")
          : status.region === "us"
            ? t("secrets_vault_region_badge_us")
            : status.region;

      if (status.kind === "unlocked") {
        setStatus(
          status.autoSync
            ? tf("secrets_vault_status_connected", { region: regionLabel, email })
            : tf("secrets_vault_status_unlocked", { region: regionLabel, email }),
        );
        if (status.autoSync && status.pendingLiteralCount === 0) {
          setDetail(t("secrets_vault_detail_synced"));
        } else if (status.pendingLiteralCount > 0) {
          setDetail(
            tf("secrets_vault_detail_pending", {
              count: String(status.pendingLiteralCount),
            }),
          );
        } else {
          setDetail(t("secrets_vault_detail_ready"));
        }
      } else if (status.kind === "locked") {
        setStatus(
          tf("secrets_vault_status_locked", { region: regionLabel, email }),
        );
        setDetail(t("secrets_vault_detail_locked"));
      } else if (status.kind === "unauthenticated") {
        setStatus(t("secrets_vault_status_logged_out"), true);
        setDetail(t("secrets_vault_detail_login"));
      } else if (status.kind === "not-installed") {
        setStatus(t("secrets_vault_status_missing"), true);
        setDetail(t("secrets_vault_detail_optional"));
      } else {
        setStatus(status.message, true);
      }

      const needUnlock =
        status.kind === "locked" || status.kind === "unauthenticated";
      unlockRow.hidden = !needUnlock && status.kind !== "error";
      // Always show unlock row when locked; hide when unlocked.
      unlockRow.hidden = status.kind === "unlocked" || status.kind === "not-installed";
      passwordInput.disabled = status.kind === "not-installed";
      unlockBtn.disabled = status.kind === "not-installed";
      syncBtn.disabled = status.kind !== "unlocked";
      openVaultBtn.disabled = false;
      // Disconnect needs vault access only if refs must be resolved first;
      // always allow the button — bridge will ask to unlock if needed.
      disconnectBtn.disabled = status.kind === "not-installed";

      // Primary action label: first connect vs later re-sync
      syncBtn.textContent = status.autoSync
        ? t("secrets_vault_sync_again")
        : t("secrets_vault_sync");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
      syncBtn.disabled = true;
      disconnectBtn.disabled = false;
    }
  };

  const unlock = async (): Promise<void> => {
    const password = passwordInput.value;
    if (!password.trim()) {
      setStatus(t("secrets_vault_password_required"), true);
      return;
    }
    unlockBtn.disabled = true;
    setStatus(t("secrets_vault_unlocking"));
    try {
      await runBridge("secrets-unlock", ["--password", password]);
      passwordInput.value = "";
      // Session is persisted for 30 days — hide unlock UI immediately.
      unlockRow.hidden = true;
      await refresh();
      // Auto-sync if pending; otherwise stay quiet (user has 30 days peace).
      if (
        lastStatus?.kind === "unlocked" &&
        (lastStatus.autoSync || lastStatus.pendingLiteralCount > 0)
      ) {
        await sync();
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err), true);
    } finally {
      unlockBtn.disabled = false;
    }
  };

  const sync = async (): Promise<void> => {
    syncBtn.disabled = true;
    setDetail(t("secrets_vault_syncing"));
    try {
      const result = await runBridge<SecretsSyncResponse>("secrets-sync");
      const seeded = (result.entries ?? []).filter((e) => e.seeded).length;
      setDetail(
        seeded > 0
          ? tf("secrets_vault_sync_ok", { count: String(seeded) })
          : t("secrets_vault_sync_ok_none"),
      );
      await refresh();
    } catch (err) {
      setDetail(err instanceof Error ? err.message : String(err));
      statusLine.classList.add("error-banner");
    } finally {
      syncBtn.disabled = false;
    }
  };

  const openVault = (): void => {
    const region = lastStatus?.region === "us" ? "us" : "eu";
    const url =
      region === "us"
        ? "https://vault.bitwarden.com"
        : "https://vault.bitwarden.eu";
    actions.openExternal(url);
  };

  const disconnect = async (): Promise<void> => {
    const ok = window.confirm(t("secrets_vault_disconnect_confirm"));
    if (!ok) return;
    disconnectBtn.disabled = true;
    setDetail(t("secrets_vault_disconnecting"));
    try {
      // Unlock first if needed so vault refs can be read back as literals.
      if (lastStatus?.kind === "locked" || lastStatus?.kind === "unauthenticated") {
        setDetail(t("secrets_vault_disconnect_need_unlock"));
        disconnectBtn.disabled = false;
        unlockRow.hidden = false;
        passwordInput.focus();
        return;
      }
      const result = (await runBridge("secrets-disconnect")) as {
        success?: boolean;
        entries?: Array<{ field: string; restored: boolean }>;
      };
      const restored = (result.entries ?? []).filter((e) => e.restored).length;
      setDetail(tf("secrets_vault_disconnect_ok", { count: String(restored) }));
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/locked|unlock/i.test(msg)) {
        setDetail(t("secrets_vault_disconnect_need_unlock"));
        unlockRow.hidden = false;
        passwordInput.focus();
      } else {
        setDetail(msg);
        statusLine.classList.add("error-banner");
      }
    } finally {
      disconnectBtn.disabled = false;
    }
  };

  unlockBtn.addEventListener("click", () => void unlock());
  syncBtn.addEventListener("click", () => void sync());
  openVaultBtn.addEventListener("click", () => openVault());
  disconnectBtn.addEventListener("click", () => void disconnect());
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void unlock();
  });

  applyLabels();
  void refresh();

  return { refresh };
}
