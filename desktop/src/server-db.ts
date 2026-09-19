/**
 * Studio card for the library this machine is bound to (issue #218, ADR
 * 2026-09-04 Decision 9, pilot plan phase 7).
 *
 * One machine, one library. The card shows which one is active — the local
 * file, a personal Turso/sqld server database, or the team library on
 * PostgreSQL — and offers the switch in both directions. A switch keeps the
 * replaced connection as the *previous* library, so switching back is one
 * button and needs no new token.
 *
 * Turso: paste URL and token (the dashboard behind the link hands the token
 * out after a Google or GitHub sign-in). Team library: host and database, a
 * "Sign in with Microsoft" step that runs `az login` from the app when the
 * Azure CLI has no session, and the identity comes from the connection. The
 * disclosure of parent ADR 2026-07-04 Decision 6 is shown once with
 * **Understood** / **Learn locally instead** and stays visible while the
 * team library is active.
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

interface PreviousLibrary {
  kind: "turso" | "postgres";
  location: string;
  replacedAt: string;
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
  /** Team library: the database role the connection runs as. */
  role?: string | null;
  previous?: PreviousLibrary | null;
}

interface LibraryStatusResponse {
  success: boolean;
  target: DatabaseTarget;
  connected: boolean;
  provisioned: boolean;
  userId: string | null;
  role: string | null;
  member: boolean;
  previous: PreviousLibrary | null;
  verifyError?: string;
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

/** Per-machine memory of the disclosure being acknowledged for one library. */
const DISCLOSURE_ACK_PREFIX = "zam.teamLibraryDisclosure.";

function disclosureAcknowledged(location: string): boolean {
  try {
    return localStorage.getItem(DISCLOSURE_ACK_PREFIX + location) === "1";
  } catch {
    return false;
  }
}

function rememberDisclosure(location: string): void {
  try {
    localStorage.setItem(DISCLOSURE_ACK_PREFIX + location, "1");
  } catch {
    // A browser without storage simply shows the buttons again next time.
  }
}

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
  // Team library (ADR 2026-09-04): the connection carries the identity, so
  // an unmapped account and a missing Azure sign-in are the two states a
  // colleague can actually act on.
  if (m.includes("not_a_member") || m.includes("not yet a member")) {
    return t("server_db_err_not_member");
  }
  if (m.includes("entra_login_required") || m.includes("az login")) {
    return t("server_db_err_entra_login");
  }
  if (m.includes("library_configured")) {
    return t("server_db_err_library_configured");
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
  if (
    /quota|429|too many requests|limit exceeded|free tier|storage limit/.test(m)
  ) {
    return t("server_db_err_quota");
  }
  return tf("server_db_error", { message });
}

export function isServerDbError(message: string): boolean {
  const m = message.toLowerCase();
  return /bitwarden|enotfound|eai_again|econnrefused|etimedout|econnreset|fetch failed|network|dns|401|403|unauthorized|forbidden|invalid token|authentication|auth failed|jwt|quota|429|too many requests|limit exceeded|free tier|storage limit|turso|sqld|database|not_a_member|not yet a member|entra_login_required|identity_mismatch|library_configured|team library/.test(
    m,
  );
}

type LibraryKind = "local" | "turso" | "postgres";

function kindOf(target: DatabaseTarget): LibraryKind {
  if (target.kind === "postgres") return "postgres";
  if (target.kind === "local") return "local";
  return "turso";
}

/** One line that says which library is active and, for the team, who you are. */
export function describeLibraryStatus(status: LibraryStatusResponse): string {
  if (kindOf(status.target) !== "postgres") {
    return tf("server_db_active", {
      kind: status.target.kind,
      location: status.target.location,
    });
  }
  if (!status.provisioned) {
    return tf("team_db_not_provisioned", {
      location: status.target.location,
      database: status.target.location.split("/").pop() ?? "",
    });
  }
  if (!status.member) {
    return tf("team_db_not_member", {
      location: status.target.location,
      role: status.role ?? "",
    });
  }
  return tf("team_db_active", {
    location: status.target.location,
    role: status.role ?? "",
    userId: status.userId ?? "",
  });
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
  const tursoTitle = requiredElement<HTMLElement>("lbl-server-db-turso-title");

  const teamSection = requiredElement<HTMLElement>("team-db-section");
  const teamTitle = requiredElement<HTMLElement>("lbl-team-db-title");
  const teamHelp = requiredElement<HTMLElement>("lbl-team-db-help");
  const hostInput = requiredElement<HTMLInputElement>("team-db-host");
  const databaseInput = requiredElement<HTMLInputElement>("team-db-database");
  const signInButton = requiredElement<HTMLButtonElement>("btn-team-db-signin");
  const teamConnectButton = requiredElement<HTMLButtonElement>(
    "btn-team-db-connect",
  );
  const teamStatus = requiredElement<HTMLElement>("team-db-status");

  const notice = requiredElement<HTMLElement>("team-db-notice");
  const disclosureText = requiredElement<HTMLElement>("team-db-disclosure");
  const disclosureActions = requiredElement<HTMLElement>(
    "team-db-disclosure-actions",
  );
  const understoodButton = requiredElement<HTMLButtonElement>(
    "btn-team-db-understood",
  );
  const learnLocallyButton = requiredElement<HTMLButtonElement>(
    "btn-team-db-learn-locally",
  );
  const switchBack = requiredElement<HTMLElement>("library-switch-back");
  const restoreButton = requiredElement<HTMLButtonElement>(
    "btn-library-restore",
  );

  let kind: LibraryKind = "local";
  let location = "";
  let previous: PreviousLibrary | null = null;
  /** True when credentials point at cloud via Bitwarden (no re-paste needed). */
  let vaultBacked = false;
  /** Shown once right after connecting to a team library. */
  let disclosurePending = false;

  requiredElement("lbl-settings-server-db-title").textContent =
    t("server_db_title");
  requiredElement("lbl-settings-server-db-help").textContent =
    t("server_db_help");
  requiredElement("lbl-server-db-url").textContent = t("server_db_url");
  requiredElement("lbl-server-db-token").textContent = t("server_db_token");
  connectButton.textContent = t("server_db_connect");
  urlInput.placeholder = t("server_db_url_ph");
  tokenInput.placeholder = t("server_db_token_ph");
  tursoTitle.textContent = t("server_db_turso_title");
  teamTitle.textContent = t("team_db_title");
  teamHelp.textContent = t("team_db_help");
  requiredElement("lbl-team-db-host").textContent = t("team_db_host");
  requiredElement("lbl-team-db-database").textContent = t("team_db_database");
  hostInput.placeholder = t("team_db_host_ph");
  databaseInput.placeholder = t("team_db_database_ph");
  signInButton.textContent = t("team_db_signin");
  teamConnectButton.textContent = t("team_db_connect");
  disclosureText.textContent = t("team_db_disclosure");
  understoodButton.textContent = t("team_db_understood");
  learnLocallyButton.textContent = t("team_db_learn_locally");

  createHint.textContent = t("server_db_create_hint");
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
  const setTeamStatus = (message: string, error = false): void => {
    teamStatus.textContent = message;
    teamStatus.classList.toggle("error-banner", error);
  };

  const serverDb = (): boolean => kind !== "local";

  /** The team library (PostgreSQL) has no mobile path yet (ADR 2026-09-04 Decision 9). */
  const applyGate = (): void => {
    const pairable = kind === "turso";
    pairButton.disabled = !pairable;
    pairButton.title = pairable
      ? ""
      : kind === "postgres"
        ? t("server_db_team_pair_blocked")
        : t("server_db_pair_blocked");
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

  const renderSwitchBack = (): void => {
    switchBack.hidden = !previous;
    if (previous) {
      restoreButton.textContent = tf("library_restore_btn", {
        kind: t(
          previous.kind === "turso"
            ? "library_kind_turso"
            : "library_kind_postgres",
        ),
        location: previous.location,
      });
    }
  };

  const renderNotice = (): void => {
    notice.hidden = kind !== "postgres";
    disclosureActions.hidden =
      kind !== "postgres" ||
      (!disclosurePending && disclosureAcknowledged(location));
  };

  /** Lay the card out for the library that is active now. */
  const render = (): void => {
    applyGate();
    renderSwitchBack();
    renderNotice();
    // The team form is for joining; once joined it makes no sense to show it.
    teamSection.hidden = kind === "postgres";
    if (kind !== "postgres") setTeamStatus("");
  };

  const refresh = async (): Promise<boolean> => {
    setStatus(t("server_db_checking"));
    try {
      const status = await runBridge<DatabaseStatusResponse>("database-status");
      previous = status.previous ?? null;

      if (status.bitwardenRequired) {
        vaultBacked = true;
        kind = "local";
        location = "";
        render();
        if (status.tursoUrl) urlInput.value = status.tursoUrl;
        setFormMode("vault-locked");
        setStatus(t("server_db_err_bitwarden"), false);
        statusLine.classList.remove("error-banner");
        return false;
      }

      kind = status.success ? kindOf(status.target) : "local";
      location = status.target.location ?? "";
      render();
      if (kind === "turso") {
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
      } else if (kind === "postgres") {
        vaultBacked = false;
        // Switching to a personal database is the paste form again.
        setFormMode("paste");
        setStatus(
          status.userId
            ? tf("team_db_active", {
                location: status.target.location,
                role: status.role ?? "",
                userId: status.userId,
              })
            : tf("team_db_not_member", {
                location: status.target.location,
                role: status.role ?? "",
              }),
        );
      } else {
        vaultBacked = false;
        setFormMode("paste");
        setStatus(t("server_db_local_only"));
      }
      return serverDb();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("BITWARDEN_REQUIRED") || /bitwarden/i.test(msg)) {
        vaultBacked = true;
        kind = "local";
        render();
        setFormMode("vault-locked");
        setStatus(t("server_db_err_bitwarden"), false);
        return false;
      }
      kind = "local";
      render();
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

  const connectTurso = async (): Promise<void> => {
    // Vault-backed path: only unlock, never re-paste.
    if (
      vaultBacked ||
      connectButton.textContent === t("server_db_unlock_bitwarden")
    ) {
      await unlockAndRefresh();
      return;
    }

    const url = urlInput.value.trim();
    const token = tokenInput.value.trim();
    if (!url || !token) {
      setStatus(t("server_db_fields_required"), true);
      return;
    }
    const replace = kind === "postgres";
    if (replace && !window.confirm(t("library_switch_confirm_turso"))) return;
    connectButton.disabled = true;
    setStatus(t("server_db_connecting"));
    try {
      const result = await runBridge<DatabaseStatusResponse>(
        "server-db-connect",
        [
          "--url",
          url,
          "--token",
          token,
          "--mode",
          "remote",
          ...(replace ? ["--replace"] : []),
        ],
      );
      tokenInput.value = "";
      kind = kindOf(result.target);
      location = result.target.location;
      previous = result.previous ?? null;
      render();
      setFormMode(kind === "turso" ? "connected" : "paste");
      setStatus(
        tf("server_db_connected", {
          kind: result.target.kind,
          location: result.target.location,
        }),
      );
      if (serverDb()) onServerDbReady();
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

  const signIn = async (): Promise<void> => {
    signInButton.disabled = true;
    teamConnectButton.disabled = true;
    setTeamStatus(t("team_db_signing_in"));
    try {
      const result = await runBridge<{ success: boolean; upn: string }>(
        "entra-login",
      );
      setTeamStatus(tf("team_db_signed_in", { upn: result.upn }));
    } catch (error) {
      setTeamStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
    } finally {
      signInButton.disabled = false;
      teamConnectButton.disabled = false;
    }
  };

  const connectTeam = async (): Promise<void> => {
    const host = hostInput.value.trim();
    const database = databaseInput.value.trim();
    if (!host || !database) {
      setTeamStatus(t("team_db_fields_required"), true);
      return;
    }
    const replace = kind === "turso";
    if (replace && !window.confirm(t("library_switch_confirm_team"))) return;
    teamConnectButton.disabled = true;
    signInButton.disabled = true;
    setTeamStatus(t("team_db_connecting"));
    try {
      const result = await runBridge<LibraryStatusResponse>("team-db-connect", [
        "--host",
        host,
        "--database",
        database,
        ...(replace ? ["--replace"] : []),
      ]);
      kind = kindOf(result.target);
      location = result.target.location;
      previous = result.previous;
      disclosurePending = true;
      render();
      setFormMode("paste");
      setStatus(describeLibraryStatus(result), !result.member);
      statusLine.classList.remove("error-banner");
      onServerDbReady();
    } catch (error) {
      setTeamStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
    } finally {
      teamConnectButton.disabled = false;
      signInButton.disabled = false;
    }
  };

  const restore = async (): Promise<void> => {
    if (!previous) return;
    if (
      !window.confirm(
        tf("library_restore_confirm", { location: previous.location }),
      )
    ) {
      return;
    }
    restoreButton.disabled = true;
    setStatus(t("library_restoring"));
    try {
      const result = await runBridge<LibraryStatusResponse>("library-restore");
      kind = kindOf(result.target);
      location = result.target.location;
      previous = result.previous;
      disclosurePending = false;
      render();
      setFormMode(kind === "turso" ? "connected" : "paste");
      setStatus(
        result.verifyError
          ? tf("library_verify_failed", { message: result.verifyError })
          : kind === "postgres"
            ? describeLibraryStatus(result)
            : tf("library_switched", { location: result.target.location }),
        Boolean(result.verifyError),
      );
      onServerDbReady();
    } catch (error) {
      setStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
    } finally {
      restoreButton.disabled = false;
    }
  };

  const understood = (): void => {
    rememberDisclosure(location);
    disclosurePending = false;
    renderNotice();
  };

  const learnLocally = async (): Promise<void> => {
    learnLocallyButton.disabled = true;
    setStatus(t("library_restoring"));
    try {
      const result =
        await runBridge<LibraryStatusResponse>("team-db-disconnect");
      kind = kindOf(result.target);
      location = result.target.location;
      previous = result.previous;
      disclosurePending = false;
      render();
      setFormMode(kind === "turso" ? "connected" : "paste");
      setStatus(
        kind === "local"
          ? t("server_db_local_only")
          : tf("library_switched", { location: result.target.location }),
      );
      onServerDbReady();
    } catch (error) {
      setStatus(
        classifyServerDbError(
          error instanceof Error ? error.message : String(error),
        ),
        true,
      );
    } finally {
      learnLocallyButton.disabled = false;
    }
  };

  connectButton.addEventListener("click", () => void connectTurso());
  signInButton.addEventListener("click", () => void signIn());
  teamConnectButton.addEventListener("click", () => void connectTeam());
  restoreButton.addEventListener("click", () => void restore());
  understoodButton.addEventListener("click", understood);
  learnLocallyButton.addEventListener("click", () => void learnLocally());
  void refresh();

  return {
    refresh,
    isServerDb: serverDb,
  };
}
