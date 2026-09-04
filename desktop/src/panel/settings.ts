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
import { setCurrentLocale, t, tf } from "../i18n.js";
import {
  type CompanionContextBarState,
  type ContextBarHandle,
  clearConnectionNotice as clearConnectionNoticeShared,
  createCallTool,
  createContextReader,
  createContextWriter,
  ensureContextBar,
  fallbackContextBarState,
  showConnectionNotice as showConnectionNoticeShared,
} from "./context-bar.js";

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const recallEl = document.getElementById("settings-recall");
const aiEl = document.getElementById("settings-ai");
const workspacesEl = document.getElementById("settings-workspaces");
const kcEl = document.getElementById("settings-kc");
const dbEl = document.getElementById("settings-db");
const backupEl = document.getElementById("settings-backup");
const updateEl = document.getElementById("settings-update");

function setSectionTitle(id: string, label: string): void {
  const title = document.getElementById(id);
  if (title) title.textContent = label;
}

/** Localize the section titles rendered statically by settings-panel.html. */
function applyStaticLocale(): void {
  setSectionTitle(
    "settings-section-recall-title",
    t("settings_section_recall"),
  );
  setSectionTitle("settings-section-ai-title", t("settings_section_ai"));
  setSectionTitle(
    "settings-section-workspaces-title",
    t("settings_workspace_title"),
  );
  setSectionTitle("settings-section-kc-title", t("settings_context_title"));
  setSectionTitle("settings-section-db-title", t("settings_database"));
  setSectionTitle(
    "settings-section-backup-title",
    t("settings_section_backup"),
  );
  setSectionTitle(
    "settings-section-update-title",
    t("settings_section_update"),
  );
}

applyStaticLocale();

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

type StudyLearningMode = "flash" | "answer_feedback" | "answer_variation";

interface StudyLearningResult {
  success: boolean;
  userId: string;
  settings: {
    learningMode: StudyLearningMode;
    voiceRevealTimeoutSec: number;
    voiceRatingTimeoutSec: number;
  };
}

const LINK_HEALTH_LABEL: Record<WorkspaceLinkHealth["health"], string> = {
  healthy: "verknüpft",
  "needs-repair": "reparaturbedürftig",
  unmanaged: "nicht verwaltet",
};

const app = new App({ name: "ZAM Settings", version: "0.1.0" });

let connected = false;
let started = false;
let currentUser: string | null = null;
let fallbackLearningMode: "flash" | "answer_feedback" = "flash";
let settingsContextRevision = 0;

const SURFACE = "settings";

const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);
const readCompanionContext = createContextReader(callTool, SURFACE);

/** Run one allowlisted `zam bridge` command through zam_studio_bridge. */
function bridgeCall(cmd: string, args: string[] = []): Promise<unknown> {
  return callTool("zam_studio_bridge", { cmd, args });
}

/**
 * Learning-mode settings belong to the selected learner. A context change
 * must therefore update the bridge target before any section reloads.
 */
function reloadForContext(newState: CompanionContextBarState): void {
  settingsContextRevision += 1;
  currentUser = newState.user.currentId ?? null;
  fallbackLearningMode =
    newState.activeEvaluatorId && newState.activeEvaluatorId !== "quick-mode"
      ? "answer_feedback"
      : "flash";
  void loadRecallSettings();
  void loadAiModels();
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
  renderLoading(recallEl, t("settings_recall_loading"));
  const revision = settingsContextRevision;
  const requestedUser = currentUser;
  const requestedFallback = fallbackLearningMode;
  try {
    const userArgs = requestedUser ? ["--user", requestedUser] : [];
    userArgs.push("--fallback-mode", requestedFallback);
    const [globalData, learningData] = (await Promise.all([
      bridgeCall("get-settings"),
      bridgeCall("study-learning-get", userArgs),
    ])) as [SettingsResult, StudyLearningResult];
    if (revision !== settingsContextRevision || requestedUser !== currentUser) {
      return;
    }
    renderRecallSettings({
      quickMode: Boolean(globalData.recall?.quickMode),
      learningMode: learningData.settings.learningMode,
      voiceRevealTimeoutSec: learningData.settings.voiceRevealTimeoutSec,
    });
  } catch (error) {
    if (revision !== settingsContextRevision || requestedUser !== currentUser) {
      return;
    }
    clearEl(recallEl);
    renderInlineError(recallEl, errorMessage(error));
  }
}

function renderRecallSettings(data: {
  quickMode: boolean;
  learningMode: StudyLearningMode;
  voiceRevealTimeoutSec: number;
}): void {
  if (!recallEl) return;
  clearEl(recallEl);

  // Learning mode field
  const modeGroup = document.createElement("div");
  modeGroup.className = "settings-group";
  modeGroup.style.marginBottom = "14px";

  const modeLabel = document.createElement("label");
  modeLabel.htmlFor = "settings-learning-mode";
  modeLabel.style.display = "block";
  modeLabel.style.fontWeight = "600";
  modeLabel.style.fontSize = "0.85rem";
  modeLabel.style.marginBottom = "6px";
  modeLabel.textContent = t("learning_mode_label");

  const modeSelect = document.createElement("select");
  modeSelect.id = "settings-learning-mode";
  modeSelect.className = "settings-select";
  modeSelect.style.width = "100%";
  modeSelect.style.padding = "6px 8px";
  modeSelect.style.borderRadius = "6px";
  modeSelect.style.border = "1px solid var(--border)";
  modeSelect.style.background = "var(--field-bg)";
  modeSelect.style.color = "var(--fg)";
  modeSelect.style.fontSize = "0.85rem";

  const modes: Array<{
    value: StudyLearningMode;
    label: string;
  }> = [
    {
      value: "flash",
      label: t("learning_mode_flash"),
    },
    {
      value: "answer_feedback",
      label: t("learning_mode_answer_feedback"),
    },
    {
      value: "answer_variation",
      label: t("learning_mode_answer_variation"),
    },
  ];

  for (const m of modes) {
    const opt = document.createElement("option");
    opt.value = m.value;
    opt.textContent = m.label;
    if (m.value === data.learningMode) opt.selected = true;
    modeSelect.appendChild(opt);
  }

  let persistedMode = data.learningMode;
  modeSelect.addEventListener("change", () => {
    const requestedMode = modeSelect.value;
    void setStudyLearningSetting(["--mode", requestedMode], modeSelect).then(
      (saved) => {
        if (saved) persistedMode = requestedMode as StudyLearningMode;
        else modeSelect.value = persistedMode;
      },
    );
  });

  const modeHint = document.createElement("div");
  modeHint.className = "settings-hint";
  modeHint.style.marginTop = "4px";
  modeHint.textContent = t("learning_mode_hint");

  modeGroup.append(modeLabel, modeSelect, modeHint);

  // Auto-reveal delay field (Voice mode)
  const timeoutGroup = document.createElement("div");
  timeoutGroup.className = "settings-group";
  timeoutGroup.style.marginBottom = "14px";

  const timeoutLabel = document.createElement("label");
  timeoutLabel.htmlFor = "settings-voice-reveal-timeout";
  timeoutLabel.style.display = "block";
  timeoutLabel.style.fontWeight = "600";
  timeoutLabel.style.fontSize = "0.85rem";
  timeoutLabel.style.marginBottom = "6px";
  timeoutLabel.textContent = t("study_voice_timeout");

  const timeoutInput = document.createElement("input");
  timeoutInput.id = "settings-voice-reveal-timeout";
  timeoutInput.type = "number";
  timeoutInput.min = "5";
  timeoutInput.max = "60";
  timeoutInput.step = "1";
  timeoutInput.value = String(data.voiceRevealTimeoutSec);
  timeoutInput.style.width = "80px";
  timeoutInput.style.padding = "6px 8px";
  timeoutInput.style.borderRadius = "6px";
  timeoutInput.style.border = "1px solid var(--border)";
  timeoutInput.style.background = "var(--field-bg)";
  timeoutInput.style.color = "var(--fg)";
  timeoutInput.style.fontSize = "0.85rem";

  let persistedTimeout = data.voiceRevealTimeoutSec;
  timeoutInput.addEventListener("change", () => {
    const sec = Math.max(
      5,
      Math.min(60, Math.trunc(Number(timeoutInput.value) || 20)),
    );
    timeoutInput.value = String(sec);
    void setStudyLearningSetting(
      ["--reveal-timeout", String(sec)],
      timeoutInput,
    ).then((saved) => {
      if (saved) persistedTimeout = sec;
      else timeoutInput.value = String(persistedTimeout);
    });
  });

  timeoutGroup.append(timeoutLabel, timeoutInput);

  const label = document.createElement("label");
  label.className = "settings-checkbox-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = data.quickMode;
  const text = document.createElement("span");
  text.textContent = t("recall_quick_setting");
  label.append(checkbox, text);

  const hint = document.createElement("div");
  hint.className = "settings-hint";
  hint.textContent = t("recall_quick_setting_hint");

  checkbox.addEventListener("change", () => {
    void setRecallQuickMode(checkbox);
  });

  recallEl.append(modeGroup, timeoutGroup, label, hint);
}

async function setRecallQuickMode(checkbox: HTMLInputElement): Promise<void> {
  const revision = settingsContextRevision;
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
    if (revision === settingsContextRevision) {
      renderInlineError(recallEl, errorMessage(error));
    }
  } finally {
    checkbox.disabled = false;
  }
}

async function setStudyLearningSetting(
  args: string[],
  control: HTMLInputElement | HTMLSelectElement,
): Promise<boolean> {
  const revision = settingsContextRevision;
  const requestedUser = currentUser;
  const requestedFallback = fallbackLearningMode;
  control.disabled = true;
  try {
    const userArgs = requestedUser ? ["--user", requestedUser] : [];
    await bridgeCall("study-learning-set", [
      ...userArgs,
      "--fallback-mode",
      requestedFallback,
      ...args,
    ]);
    return (
      revision === settingsContextRevision && requestedUser === currentUser
    );
  } catch (error) {
    if (revision === settingsContextRevision && requestedUser === currentUser) {
      renderInlineError(
        recallEl,
        tf("study_learning_failed", { message: errorMessage(error) }),
      );
    }
    return false;
  } finally {
    control.disabled = false;
  }
}

// ── AI models (unified registry + Agent transport, ADR 2026-07-12a) ─────────

interface SettingsModelRow {
  id: string;
  label: string;
  url: string;
  model: string;
  local: boolean;
  transport?: "http" | "agent";
  agentHarness?: string;
  /** Stored reasoning-effort override; absent means the adapter default. */
  effort?: string;
  order: number;
  detectedCapabilities?: { text?: boolean };
}

interface SettingsAgentHarness {
  id: string;
  label: string;
  detected: boolean;
  outboundText?: boolean;
  outboundImage?: boolean;
  /** True when this harness's adapter forwards a reasoning-effort setting. */
  outboundEffort?: boolean;
  defaultModel?: string | null;
}

async function loadAiModels(): Promise<void> {
  renderLoading(aiEl, t("model_loading"));
  try {
    const data = (await bridgeCall("model-list")) as {
      models?: SettingsModelRow[];
    };
    renderAiModels(data.models ?? [], await loadAgentHarnesses());
  } catch (error) {
    clearEl(aiEl);
    renderInlineError(aiEl, errorMessage(error));
  }
}

/**
 * Outbound-text harnesses, for the agent-transport card below the list.
 * Never fatal: without them the card still explains the option and falls
 * back to what the configured rows say.
 */
async function loadAgentHarnesses(): Promise<SettingsAgentHarness[]> {
  try {
    const res = (await bridgeCall("agent-list")) as {
      harnesses?: SettingsAgentHarness[];
    };
    return (res.harnesses ?? []).filter((h) => h.outboundText);
  } catch {
    return [];
  }
}

function modelKindBadge(row: SettingsModelRow): {
  className: string;
  text: string;
} {
  if (row.transport === "agent") {
    return { className: "agent", text: t("model_agent_badge") };
  }
  if (row.local) {
    return { className: "local", text: t("model_local_badge") };
  }
  return { className: "cloud", text: t("model_cloud_badge") };
}

function renderAiModels(
  models: SettingsModelRow[],
  harnesses: SettingsAgentHarness[] = [],
): void {
  if (!aiEl) return;
  clearEl(aiEl);

  if (models.length === 0) {
    const empty = document.createElement("div");
    empty.className = "settings-empty";
    empty.textContent = t("model_empty");
    aiEl.appendChild(empty);
  } else {
    const ordered = [...models].sort((a, b) => a.order - b.order);
    for (const row of ordered) {
      aiEl.appendChild(renderAiModelRow(row));
    }
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn secondary-btn btn-sm";
  addBtn.textContent = t("btn_add_model");
  addBtn.addEventListener("click", () => {
    void showAgentModelForm();
  });
  aiEl.appendChild(addBtn);

  const formHost = document.createElement("div");
  formHost.id = "settings-ai-form";
  formHost.className = "settings-ai-form hidden";
  aiEl.appendChild(formHost);

  // The agent-transport explanation used to sit above the list as a bare
  // subtitle, where it read as a claim about the models listed under it --
  // confusing next to plain cloud/local entries. It is its own card now, in
  // the same visual language as the rows, and it comes last.
  aiEl.appendChild(buildAgentTransportCard(models, harnesses));
}

/**
 * Explains the agent transport (ADR 2026-07-12a) as a card rather than a
 * section subtitle: what it is, why it needs no key or URL, and which
 * harness is actually in use or available on this machine.
 */
function buildAgentTransportCard(
  models: SettingsModelRow[],
  harnesses: SettingsAgentHarness[],
): HTMLElement {
  const card = document.createElement("div");
  card.className = "settings-ai-row settings-ai-note";

  const head = document.createElement("div");
  head.className = "settings-ai-row-head";
  const title = document.createElement("span");
  title.className = "settings-ai-label";
  title.textContent = t("model_agent_card_title");
  const badge = document.createElement("span");
  badge.className = "settings-ai-badge agent";
  badge.textContent = t("model_agent_badge");
  head.append(title, badge);

  const body = document.createElement("p");
  body.className = "settings-ai-meta";
  body.textContent = `${t("model_agent_card_body")} ${t("model_agent_card_no_key")}`;

  const labelOf = (id: string): string =>
    harnesses.find((h) => h.id === id)?.label ?? id;
  const inUse = [
    ...new Set(
      models
        .filter((m) => m.transport === "agent")
        .map((m) => m.agentHarness)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const detected = harnesses.filter((h) => h.detected);

  const status = document.createElement("p");
  status.className = "settings-ai-meta settings-ai-note-status";
  if (inUse.length > 0) {
    status.textContent = tf("model_agent_card_active", {
      harnesses: inUse.map(labelOf).join(", "),
    });
  } else if (detected.length > 0) {
    status.textContent = tf("model_agent_card_available", {
      harnesses: detected.map((h) => h.label).join(", "),
      action: t("btn_add_model"),
    });
  } else {
    status.textContent = t("model_agent_harness_none");
  }

  card.append(head, body, status);
  return card;
}

function renderAiModelRow(row: SettingsModelRow): HTMLElement {
  const el = document.createElement("div");
  el.className = "settings-ai-row";

  const head = document.createElement("div");
  head.className = "settings-ai-row-head";
  const label = document.createElement("span");
  label.className = "settings-ai-label";
  label.textContent = row.label;
  const badge = document.createElement("span");
  const kind = modelKindBadge(row);
  badge.className = `settings-ai-badge ${kind.className}`;
  badge.textContent = kind.text;
  head.append(label, badge);

  const meta = document.createElement("p");
  meta.className = "settings-ai-meta";
  meta.textContent =
    row.transport === "agent"
      ? tf("model_agent_meta_with_model", {
          harness: row.agentHarness ?? "—",
          model: row.model && !row.model.startsWith("agent:") ? row.model : "—",
        })
      : `${row.model} · ${row.url}`;

  const actions = document.createElement("div");
  actions.className = "settings-ai-actions";
  if (row.transport === "agent") {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn secondary-btn btn-sm";
    edit.textContent = t("model_btn_edit");
    edit.addEventListener("click", () => {
      void showAgentModelForm(row);
    });
    actions.appendChild(edit);

    const recheck = document.createElement("button");
    recheck.type = "button";
    recheck.className = "btn secondary-btn btn-sm";
    recheck.textContent = t("model_btn_reprobe");
    recheck.addEventListener("click", () => {
      void reprobeAiModel(row.id, recheck);
    });
    actions.appendChild(recheck);
  }
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn secondary-btn btn-sm";
  remove.textContent = t("model_btn_remove");
  remove.addEventListener("click", () => {
    void removeAiModel(row);
  });
  actions.appendChild(remove);

  el.append(head, meta, actions);
  return el;
}

async function reprobeAiModel(
  id: string,
  button: HTMLButtonElement,
): Promise<void> {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = t("model_reprobing");
  try {
    await bridgeCall("model-reprobe", ["--id", id]);
    await loadAiModels();
  } catch (error) {
    button.disabled = false;
    button.textContent = original;
    renderInlineError(aiEl, errorMessage(error));
  }
}

async function removeAiModel(row: SettingsModelRow): Promise<void> {
  if (!window.confirm(`${t("model_btn_remove")}: ${row.label}?`)) return;
  try {
    await bridgeCall("model-remove", ["--id", row.id]);
    await loadAiModels();
  } catch (error) {
    renderInlineError(aiEl, errorMessage(error));
  }
}

/**
 * Add or edit an agent-transport model. Passing `existing` turns the form into
 * an edit of that registry row: `model-upsert` is then called with `--id`, so a
 * changed model or effort updates the row in place instead of appending a
 * duplicate that competes for the same fallback order.
 */
async function showAgentModelForm(existing?: SettingsModelRow): Promise<void> {
  const formHost = document.getElementById("settings-ai-form");
  if (!formHost) return;
  formHost.classList.remove("hidden");
  formHost.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = existing
    ? t("model_form_edit_title")
    : t("model_form_add_title");

  const kindNote = document.createElement("div");
  kindNote.className = "settings-hint";
  kindNote.textContent = `${t("model_kind_agent")} — ${t("model_agent_hint")}`;

  let harnesses: SettingsAgentHarness[] = [];
  try {
    const res = (await bridgeCall("agent-list")) as {
      harnesses?: SettingsAgentHarness[];
    };
    harnesses = (res.harnesses ?? []).filter((h) => h.outboundText);
  } catch {
    harnesses = [
      {
        id: "claude-code",
        label: "Claude Code",
        detected: false,
        outboundText: true,
      },
    ];
  }

  const harnessSelect = document.createElement("select");
  harnessSelect.className = "editor-select settings-select";
  for (const h of harnesses) {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.detected
      ? h.label
      : `${h.label} (${t("model_agent_harness_missing")})`;
    harnessSelect.appendChild(opt);
  }
  if (harnesses.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = t("model_agent_harness_none");
    harnessSelect.appendChild(opt);
  } else {
    const preferred = harnesses.find((h) => h.detected) ?? harnesses[0];
    harnessSelect.value = preferred.id;
  }
  // Editing keeps the row on its own harness even when it is not detected
  // right now (an offline CLI must not silently re-point the entry).
  if (existing?.agentHarness) {
    if (!harnesses.some((h) => h.id === existing.agentHarness)) {
      const opt = document.createElement("option");
      opt.value = existing.agentHarness;
      opt.textContent = `${existing.agentHarness} (${t("model_agent_harness_missing")})`;
      harnessSelect.appendChild(opt);
    }
    harnessSelect.value = existing.agentHarness;
  }

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.placeholder = t("model_field_label");
  const preferredLabel =
    harnesses.find((h) => h.id === harnessSelect.value)?.label ?? "";
  labelInput.placeholder = preferredLabel || t("model_field_label");
  if (existing) labelInput.value = existing.label;

  const modelInput = document.createElement("input");
  modelInput.type = "text";
  // A placeholder `agent:<harness>` from an early build is not a real model id.
  if (existing?.model && !existing.model.startsWith("agent:")) {
    modelInput.value = existing.model;
  }

  const effortSelect = document.createElement("select");
  effortSelect.className = "editor-select settings-select";
  // Labels come from the i18n layer (all packs already carry model_effort_*).
  // Spelled out as literal t() calls so the i18n completeness scan sees them.
  const effortOptions: Array<[string, string]> = [
    ["auto", t("model_effort_auto")],
    ["low", t("model_effort_low")],
    ["medium", t("model_effort_medium")],
    ["high", t("model_effort_high")],
    ["none", t("model_effort_none")],
  ];
  for (const [value, label] of effortOptions) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    effortSelect.appendChild(opt);
  }
  // An unset stored effort means "auto" (the adapter derives one from the id).
  effortSelect.value = existing?.effort ?? "auto";

  // Only Antigravity, Codex and Copilot forward effort today; for every other
  // harness the adapter drops it, so offering the control would be a lie.
  const effortLabel = document.createElement("label");
  effortLabel.className = "settings-hint";
  effortLabel.textContent = t("model_field_effort");

  const updateEffortVisibility = (): void => {
    const harness = harnesses.find((x) => x.id === harnessSelect.value);
    const supported = harness?.outboundEffort === true;
    // Inline display: the panel has no generic `.hidden` rule to rely on.
    effortLabel.style.display = supported ? "" : "none";
    effortSelect.style.display = supported ? "" : "none";
    if (!supported) {
      effortSelect.disabled = true;
      effortSelect.title = "";
      return;
    }
    // Thinking models pick their own effort, so the control does not apply.
    const isThinking = modelInput.value
      .trim()
      .toLowerCase()
      .includes("thinking");
    effortSelect.disabled = isThinking;
    effortSelect.title = isThinking ? t("model_effort_thinking_hint") : "";
  };

  const applyDefaultModel = (): void => {
    const h = harnesses.find((x) => x.id === harnessSelect.value);
    const def = h?.defaultModel ?? "";
    modelInput.placeholder = def
      ? tf("model_agent_model_placeholder", { model: def })
      : t("model_field_model");
    if (def && !modelInput.value) modelInput.value = def;
    updateEffortVisibility();

    // Query models dynamically for the selected harness
    if (harnessSelect.value) {
      void (async () => {
        try {
          const res = (await bridgeCall("agent-models", [
            "--harness",
            harnessSelect.value,
          ])) as { models?: string[] };
          if (res.models && res.models.length > 0) {
            // Provide suggestions if dynamic models are returned
            let datalist = document.getElementById(
              "agent-models-datalist",
            ) as HTMLDataListElement | null;
            if (!datalist) {
              datalist = document.createElement("datalist");
              datalist.id = "agent-models-datalist";
              document.body.appendChild(datalist);
            }
            datalist.replaceChildren();
            for (const m of res.models) {
              const opt = document.createElement("option");
              opt.value = m;
              datalist.appendChild(opt);
            }
            modelInput.setAttribute("list", "agent-models-datalist");
          }
        } catch {
          // Ignore model listing errors
        }
      })();
    }
  };

  applyDefaultModel();
  harnessSelect.addEventListener("change", applyDefaultModel);
  modelInput.addEventListener("input", updateEffortVisibility);

  const actions = document.createElement("div");
  actions.className = "settings-ai-actions";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn primary-btn btn-sm";
  save.textContent = t("model_btn_save");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn secondary-btn btn-sm";
  cancel.textContent = t("model_btn_cancel");
  cancel.addEventListener("click", () => {
    formHost.classList.add("hidden");
    formHost.replaceChildren();
  });
  save.addEventListener("click", () => {
    void saveAgentModel(
      harnessSelect,
      labelInput,
      modelInput,
      effortSelect,
      save,
      existing?.id,
    );
  });
  actions.append(save, cancel);

  const harnessLabel = document.createElement("label");
  harnessLabel.className = "settings-hint";
  harnessLabel.textContent = t("model_field_harness");
  const modelLabel = document.createElement("label");
  modelLabel.className = "settings-hint";
  modelLabel.textContent = t("model_field_model");

  formHost.append(
    title,
    kindNote,
    harnessLabel,
    harnessSelect,
    modelLabel,
    modelInput,
    effortLabel,
    effortSelect,
    labelInput,
    actions,
  );
}

async function saveAgentModel(
  harnessSelect: HTMLSelectElement,
  labelInput: HTMLInputElement,
  modelInput: HTMLInputElement,
  effortSelect: HTMLSelectElement,
  saveButton: HTMLButtonElement,
  existingId?: string,
): Promise<void> {
  const harness = harnessSelect.value;
  if (!harness) {
    renderInlineError(aiEl, t("model_agent_missing_harness"));
    return;
  }
  saveButton.disabled = true;
  const label =
    labelInput.value.trim() ||
    harnessSelect.selectedOptions[0]?.textContent?.replace(/\s*\(.*\)$/, "") ||
    harness;
  const model = modelInput.value.trim();
  const effort = effortSelect.disabled ? undefined : effortSelect.value;
  try {
    const args = [
      "--transport",
      "agent",
      "--agent-harness",
      harness,
      "--label",
      label,
      "--capabilities",
      JSON.stringify({ text: true, image: true }),
    ];
    if (existingId) args.push("--id", existingId);
    if (model) args.push("--model", model);
    // On edit "auto" must be sent so the bridge clears a stored override;
    // omitting it would keep the previous effort forever.
    if (effort && (effort !== "auto" || existingId)) {
      args.push("--effort", effort);
    }
    await bridgeCall("model-upsert", args);
    await loadAiModels();
  } catch (error) {
    saveButton.disabled = false;
    renderInlineError(aiEl, errorMessage(error));
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
  void loadAiModels();
  void loadWorkspaces();
  void loadKnowledgeContext();
  void loadDatabaseStatus();
  setupBackup();
  void loadUpdateCheck();
}

app.ontoolresult = (params) => {
  const wasStarted = started;
  settingsContextRevision += 1;
  const structured = (params.structuredContent ?? {}) as OpenSettingsResult;
  panelVersion = structured.version;
  const user = structured.user ?? null;
  currentUser = user;
  clearConnectionNotice();

  const contextState =
    structured.companionContext ?? fallbackContextBarState(SURFACE, user);
  fallbackLearningMode =
    contextState.activeEvaluatorId &&
    contextState.activeEvaluatorId !== "quick-mode"
      ? "answer_feedback"
      : "flash";
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    "ZAM Settings",
    panelVersion,
    contextState,
    {
      write: writeCompanionContext,
      read: readCompanionContext,
      onReload: reloadForContext,
      onError: showConnectionNotice,
    },
  );
  if (wasStarted) void loadRecallSettings();
  else start();
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
    read: readCompanionContext,
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
const noHostTimer = setTimeout(
  () => showConnectionNotice(NO_HOST_NOTICE),
  4000,
);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    if (navigator.language.startsWith("de")) {
      setCurrentLocale("de");
      applyStaticLocale();
    }
    // ontoolresult normally fires right after the handshake and triggers the
    // load. If a host never delivers it, still start after a short grace
    // period instead of leaving the card stuck waiting.
    window.setTimeout(start, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(
      `ZAM Settings failed to start: ${errorMessage(error)}`,
    );
  });
