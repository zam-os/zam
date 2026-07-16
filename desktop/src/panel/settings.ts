/**
 * ZAM Settings-lite card — MCP Apps panel entry.
 *
 * A utility card rather than a chat tool: workspaces + skill-link health,
 * the active knowledge context, database status, an on-demand backup
 * snapshot, and an info-only update check — all read/write through
 * zam_studio_bridge. Unlike recall/graph this card can mutate state (repair
 * links, switch context, write a backup), so its zam_open_settings tool
 * omits readOnlyHint (see src/cli/commands/mcp.ts).
 *
 * Standalone by design (tests/desktop/module-boundaries.test.ts): no Tauri,
 * no Three.js, no import from ./panel.ts, ./recall.ts, or ./graph.ts. The
 * `callTool`/context-bar plumbing below is shared via ./context-bar.js
 * (item 9, 0.11.0 review) rather than hand-copied, but this panel entry
 * still bundles independently — that module has no import of its own beyond
 * the already-shared `@modelcontextprotocol/ext-apps`.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import {
  clearConnectionNotice as clearConnectionNoticeShared,
  type CompanionContextBarState,
  type ContextBarHandle,
  createCallTool,
  createContextWriter,
  ensureContextBar,
  fallbackContextBarState,
  showConnectionNotice as showConnectionNoticeShared,
} from "./context-bar.js";

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const recallEl = document.getElementById("settings-recall");
const workspacesEl = document.getElementById("settings-workspaces");
const kcEl = document.getElementById("settings-kc");
const dbEl = document.getElementById("settings-db");
const backupEl = document.getElementById("settings-backup");
const updateEl = document.getElementById("settings-update");

const showConnectionNotice = (message: string): void =>
  showConnectionNoticeShared(noticeEl, message);
const clearConnectionNotice = (): void => clearConnectionNoticeShared(noticeEl);

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;

interface OpenSettingsResult {
  settings?: string;
  version?: string;
  user?: string | null;
  companionContext?: CompanionContextBarState;
}

interface WorkspaceConfig {
  id: string;
  label: string;
  kind: string;
  path: string;
}

interface WorkspaceLinkHealth {
  health: "healthy" | "needs-repair" | "unmanaged";
  states: Record<string, string>;
}

interface WorkspaceListResult {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  linkHealth: Record<string, WorkspaceLinkHealth>;
}

interface KnowledgeContext {
  id: string;
  name: string;
  label: string | null;
  language: string | null;
}

interface KnowledgeContextListResult {
  success: boolean;
  contexts: KnowledgeContext[];
}

interface ActiveKnowledgeContextResult {
  success: boolean;
  activeContext: string | null;
  staleContext: string | null;
}

interface DatabaseStatusResult {
  success: boolean;
  connected: boolean;
  target: { kind: string; location?: string };
  userId: string | null;
  cardCount: number;
  users: Array<{ id: string; cardCount: number }>;
}

interface BackupCreateResult {
  ok: boolean;
  path: string;
  createdAt: string;
  checksum: string;
  tables: Record<string, number>;
}

interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  channel: string;
  action: string;
  command?: string;
  reason: string;
}

interface SettingsResult {
  recall?: { quickMode?: boolean };
}

const LINK_HEALTH_LABEL: Record<WorkspaceLinkHealth["health"], string> = {
  healthy: "verknüpft",
  "needs-repair": "reparaturbedürftig",
  unmanaged: "nicht verwaltet",
};

const app = new App({ name: "ZAM Settings", version: "0.1.0" });

let connected = false;
let started = false;

const SURFACE = "settings";

const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);

/** Run one allowlisted `zam bridge` command through zam_studio_bridge. */
function bridgeCall(cmd: string, args: string[] = []): Promise<unknown> {
  return callTool("zam_studio_bridge", { cmd, args });
}

/**
 * Every settings section reads global (not per-learner) state, so a
 * user/evaluator context change has nothing per-learner to reload here —
 * unlike Recall/Graph. Still refresh every section for consistency instead
 * of silently doing nothing on a context boundary (ADR §Decision 4).
 */
function reloadForContext(_newState: CompanionContextBarState): void {
  void loadRecallSettings();
  void loadWorkspaces();
  void loadKnowledgeContext();
  void loadDatabaseStatus();
  void loadUpdateCheck();
}

function clearEl(el: HTMLElement | null): void {
  el?.replaceChildren();
}

function renderLoading(el: HTMLElement | null, text: string): void {
  if (!el) return;
  clearEl(el);
  const loading = document.createElement("div");
  loading.className = "settings-loading";
  loading.textContent = text;
  el.appendChild(loading);
}

function renderInlineError(el: HTMLElement | null, message: string): void {
  if (!el) return;
  const notice = document.createElement("div");
  notice.className = "settings-error";
  notice.textContent = message;
  el.appendChild(notice);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ── Recall ─────────────────────────────────────────────────────────────────

async function loadRecallSettings(): Promise<void> {
  renderLoading(recallEl, "Lade Recall-Einstellungen…");
  try {
    const data = (await bridgeCall("get-settings")) as SettingsResult;
    renderRecallSettings(Boolean(data.recall?.quickMode));
  } catch (error) {
    clearEl(recallEl);
    renderInlineError(recallEl, errorMessage(error));
  }
}

function renderRecallSettings(quickMode: boolean): void {
  if (!recallEl) return;
  clearEl(recallEl);

  const label = document.createElement("label");
  label.className = "settings-checkbox-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = quickMode;
  const text = document.createElement("span");
  text.textContent = "Just show questions and answers for speed";
  label.append(checkbox, text);

  const hint = document.createElement("div");
  hint.className = "settings-hint";
  hint.textContent =
    "Disabled by default. When off, Recall asks the connected host to check " +
    "your answer and supports follow-up questions.";
  recallEl.append(label, hint);

  checkbox.addEventListener("change", () => {
    void setRecallQuickMode(checkbox);
  });
}

async function setRecallQuickMode(checkbox: HTMLInputElement): Promise<void> {
  const requested = checkbox.checked;
  checkbox.disabled = true;
  try {
    await bridgeCall("setting-set", [
      "--key",
      "recall.quick_mode",
      "--value",
      String(requested),
    ]);
  } catch (error) {
    checkbox.checked = !requested;
    renderInlineError(recallEl, errorMessage(error));
  } finally {
    checkbox.disabled = false;
  }
}

// ── Workspaces ──────────────────────────────────────────────────────────────

async function loadWorkspaces(): Promise<void> {
  renderLoading(workspacesEl, "Lade Workspaces…");
  try {
    const data = (await bridgeCall("workspace-list")) as WorkspaceListResult;
    renderWorkspaces(data);
  } catch (error) {
    clearEl(workspacesEl);
    renderInlineError(workspacesEl, errorMessage(error));
  }
}

function renderWorkspaces(data: WorkspaceListResult): void {
  if (!workspacesEl) return;
  clearEl(workspacesEl);
  if (data.workspaces.length === 0) {
    const empty = document.createElement("div");
    empty.className = "settings-empty";
    empty.textContent = "Keine Workspaces konfiguriert.";
    workspacesEl.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "settings-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Label", "Pfad", "Verknüpfung", ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const workspace of data.workspaces) {
    tbody.appendChild(renderWorkspaceRow(workspace, data));
  }
  table.appendChild(tbody);
  workspacesEl.appendChild(table);
}

function renderWorkspaceRow(
  workspace: WorkspaceConfig,
  data: WorkspaceListResult,
): HTMLTableRowElement {
  const row = document.createElement("tr");
  if (workspace.id === data.activeWorkspaceId) {
    row.className = "settings-row-active";
  }

  const labelCell = document.createElement("td");
  labelCell.textContent = workspace.label;
  row.appendChild(labelCell);

  const pathCell = document.createElement("td");
  pathCell.className = "settings-path-cell";
  pathCell.textContent = workspace.path;
  pathCell.title = workspace.path;
  row.appendChild(pathCell);

  const healthCell = document.createElement("td");
  const health = data.linkHealth[workspace.id]?.health;
  const healthKey = health ?? "unmanaged";
  const badge = document.createElement("span");
  badge.className = `settings-health-badge settings-health-${healthKey}`;
  badge.textContent = health ? LINK_HEALTH_LABEL[health] : "unbekannt";
  healthCell.appendChild(badge);
  row.appendChild(healthCell);

  const actionCell = document.createElement("td");
  const repairBtn = document.createElement("button");
  repairBtn.type = "button";
  repairBtn.className = "btn secondary-btn btn-sm";
  repairBtn.textContent = "Links reparieren";
  repairBtn.addEventListener("click", () => {
    void repairWorkspaceLinks(workspace.id, repairBtn);
  });
  actionCell.appendChild(repairBtn);
  row.appendChild(actionCell);

  return row;
}

async function repairWorkspaceLinks(
  id: string,
  button: HTMLButtonElement,
): Promise<void> {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Repariere…";
  try {
    await bridgeCall("workspace-repair-links", ["--id", id]);
    await loadWorkspaces(); // refresh (plan Step 5: refresh after repair)
  } catch (error) {
    button.disabled = false;
    button.textContent = original;
    renderInlineError(workspacesEl, errorMessage(error));
  }
}

// ── Knowledge context ───────────────────────────────────────────────────────

async function loadKnowledgeContext(): Promise<void> {
  renderLoading(kcEl, "Lade Wissenskontext…");
  try {
    const [active, list] = await Promise.all([
      bridgeCall(
        "get-active-knowledge-context",
      ) as Promise<ActiveKnowledgeContextResult>,
      bridgeCall(
        "list-knowledge-contexts",
      ) as Promise<KnowledgeContextListResult>,
    ]);
    renderKnowledgeContext(active, list.contexts ?? []);
  } catch (error) {
    clearEl(kcEl);
    renderInlineError(kcEl, errorMessage(error));
  }
}

function renderKnowledgeContext(
  active: ActiveKnowledgeContextResult,
  contexts: KnowledgeContext[],
): void {
  if (!kcEl) return;
  clearEl(kcEl);

  const row = document.createElement("div");
  row.className = "settings-field-row";

  const select = document.createElement("select");
  select.className = "editor-select settings-select";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "— keiner —";
  select.appendChild(noneOpt);
  for (const ctx of contexts) {
    const opt = document.createElement("option");
    opt.value = ctx.name;
    opt.textContent = ctx.label ? `${ctx.label} (${ctx.name})` : ctx.name;
    select.appendChild(opt);
  }
  const previousValue = active.activeContext ?? "";
  select.value = previousValue;
  row.appendChild(select);
  kcEl.appendChild(row);

  if (active.staleContext) {
    const stale = document.createElement("div");
    stale.className = "settings-hint";
    stale.textContent =
      `Gespeicherter Kontext "${active.staleContext}" ` +
      "existiert nicht mehr.";
    kcEl.appendChild(stale);
  }

  select.addEventListener("change", () => {
    void setKnowledgeContext(select.value, select, previousValue);
  });
}

async function setKnowledgeContext(
  name: string,
  select: HTMLSelectElement,
  previousValue: string,
): Promise<void> {
  select.disabled = true;
  try {
    // Positional arg (see set-active-knowledge-context in bridge.ts): an
    // empty selection sends no args at all, which clears the active context.
    await bridgeCall("set-active-knowledge-context", name ? [name] : []);
    await loadKnowledgeContext();
  } catch (error) {
    // The browser already moved the <select> to the new value as part of
    // the native change event — revert it so the display matches the
    // (unchanged) server-side active context, then re-enable for a retry.
    select.value = previousValue;
    select.disabled = false;
    renderInlineError(kcEl, errorMessage(error));
  }
}

// ── Database ────────────────────────────────────────────────────────────────

async function loadDatabaseStatus(): Promise<void> {
  renderLoading(dbEl, "Lade Datenbankstatus…");
  try {
    const data = (await bridgeCall("database-status")) as DatabaseStatusResult;
    renderDatabaseStatus(data);
  } catch (error) {
    clearEl(dbEl);
    renderInlineError(dbEl, errorMessage(error));
  }
}

function renderDatabaseStatus(data: DatabaseStatusResult): void {
  if (!dbEl) return;
  clearEl(dbEl);
  const line = document.createElement("div");
  line.className = "settings-status-line";
  const location = data.target.location ? ` (${data.target.location})` : "";
  const who = data.userId ?? "—";
  line.textContent =
    `${data.target.kind}${location} · ${data.users.length} Profil(e) · ` +
    `${data.cardCount} Karten für ${who}`;
  dbEl.appendChild(line);
}

// ── Backup ──────────────────────────────────────────────────────────────────

function setupBackup(): void {
  if (!backupEl) return;
  clearEl(backupEl);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn primary-btn";
  button.textContent = "Jetzt sichern";
  const result = document.createElement("div");
  backupEl.append(button, result);

  button.addEventListener("click", () => {
    void runBackup(button, result);
  });
}

async function runBackup(
  button: HTMLButtonElement,
  result: HTMLDivElement,
): Promise<void> {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Sichere…";
  result.className = "settings-backup-result";
  result.textContent = "";
  try {
    const data = (await bridgeCall("backup-create")) as BackupCreateResult;
    const tableCount = Object.keys(data.tables).length;
    const rowCount = Object.values(data.tables).reduce((a, b) => a + b, 0);
    result.className = "settings-backup-result settings-ok";
    result.textContent =
      `Gesichert: ${data.path} ` +
      `(${tableCount} Tabellen, ${rowCount} Zeilen)`;
  } catch (error) {
    result.className = "settings-backup-result settings-error";
    result.textContent = errorMessage(error);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

// ── Update check ────────────────────────────────────────────────────────────

async function loadUpdateCheck(): Promise<void> {
  renderLoading(updateEl, "Prüfe auf Updates…");
  try {
    const data = (await bridgeCall("update-check")) as UpdateCheckResult;
    renderUpdateCheck(data);
  } catch (error) {
    // Offline/unreachable release server: fail gracefully, inline, without
    // breaking the rest of the panel (plan Step 5).
    clearEl(updateEl);
    renderInlineError(updateEl, errorMessage(error));
  }
}

function renderUpdateCheck(data: UpdateCheckResult): void {
  if (!updateEl) return;
  clearEl(updateEl);
  const line = document.createElement("div");
  line.className = "settings-status-line";
  line.textContent = data.updateAvailable
    ? `${data.currentVersion} → ${data.latestVersion} (${data.channel})`
    : `${data.currentVersion} ist aktuell (${data.channel})`;
  updateEl.appendChild(line);

  const reason = document.createElement("div");
  reason.className = "settings-hint";
  reason.textContent = data.reason;
  updateEl.appendChild(reason);
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

function start(): void {
  if (started || !connected) return;
  started = true;
  // Each section loads independently — one section's failure (e.g. an
  // offline update check) must never block the others.
  void loadRecallSettings();
  void loadWorkspaces();
  void loadKnowledgeContext();
  void loadDatabaseStatus();
  setupBackup();
  void loadUpdateCheck();
}

app.ontoolresult = (params) => {
  const structured = (params.structuredContent ?? {}) as OpenSettingsResult;
  panelVersion = structured.version;
  const user = structured.user ?? null;
  clearConnectionNotice();

  const contextState =
    structured.companionContext ?? fallbackContextBarState(SURFACE, user);
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    "ZAM Settings",
    panelVersion,
    contextState,
    {
      write: writeCompanionContext,
      onReload: reloadForContext,
      onError: showConnectionNotice,
    },
  );
  start();
};

// Mount the bar immediately — before any tool result — so the title and an
// honest "no learner/agent resolved yet" state (fallbackContextBarState) are
// visible from first paint (review finding 6), not only once a host's
// ontoolresult (or the 800ms grace-period fallback below) actually fires.
contextBar = ensureContextBar(
  contextBar,
  contextBarRoot,
  "ZAM Settings",
  panelVersion,
  fallbackContextBarState(SURFACE, null),
  {
    write: writeCompanionContext,
    onReload: reloadForContext,
    onError: showConnectionNotice,
  },
);

// A plain file viewer (e.g. an editor preview) renders this HTML without
// ever answering ui/initialize — connect() then stays pending forever.
// Degrade honestly instead of showing "Connecting to host…" for good.
const NO_HOST_NOTICE =
  "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
  "(z. B. basic-host oder Copilot-Panel).";
const noHostTimer = setTimeout(() => showConnectionNotice(NO_HOST_NOTICE), 4000);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    // ontoolresult normally fires right after the handshake and triggers the
    // load. If a host never delivers it, still start after a short grace
    // period instead of leaving the card stuck waiting.
    window.setTimeout(start, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(`ZAM Settings failed to start: ${errorMessage(error)}`);
  });
