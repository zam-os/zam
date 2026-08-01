import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join as joinPath } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openFolderDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check as checkForUpdate } from "@tauri-apps/plugin-updater";
import * as THREE from "three";
import { formatActivityBucketLabel } from "../../src/kernel/analytics/progress.js";
import { runBridge, setBridgeTransport } from "./bridge-transport.js";
import {
  BLOOM_PACKS,
  currentLocale,
  type Locale,
  LOCALE_LABELS,
  LOCALES,
  PRIVACY_PACKS,
  setCurrentLocale,
  t,
  tf,
} from "./i18n.js";
import {
  initCurriculumWizard,
  setCurriculumWizardModelSetup,
} from "./curriculum-wizard.js";
import { initMobilePairing } from "./mobile-pairing.js";
import {
  deriveOnboardingChecklist,
  initOnboarding,
  type OnboardingAgentOffer,
  type OnboardingCloudProvider,
  type OnboardingController,
  type OnboardingEmbeddingStatus,
  type OnboardingPersona,
  type OnboardingWorkspaceStructure,
} from "./onboarding.js";
import { initServerDbWizard } from "./server-db.js";
import {
  buildAvailability,
  createTieredVoicePort,
  createVoiceController,
  isVoiceModeUsable,
  type NativeVoiceCapabilities,
  probeNativeCapabilities,
  readStoredPreference,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  planLeavesDevice,
  unavailableReasonKey,
  type VoiceEnginePlan,
  type VoiceEnginePreference,
  type VoiceLocale,
} from "./voice.js";
import {
  beginTurn,
  buildDiscussReviewArgs,
  completeTurn,
  createDiscussionState,
  type DiscussionCardContext,
  failTurn,
  openDiscussion,
  resetDiscussion,
} from "./discussion.js";
import {
  initLearningContentStudio,
  loadStudioData,
  openCardInEditor,
} from "./learning-content.js";
import {
  StudyEditError,
  deleteConfirmCommand,
  deletePreviewCommand,
  editCommand,
  ratingShortcutForKey,
  removeConfirmCommand,
  removePreviewCommand,
} from "./study-card-actions.js";

// Re-exported so any other importer of "./main.js" keeps working unchanged;
// learning-content.ts and curriculum-wizard.ts now import these directly
// from bridge-transport.js/i18n.js instead.
export { runBridge, t, tf };

// Installed at module scope — before any DOMContentLoaded handler can fire —
// so every runBridge() call below (and in views that import it from
// bridge-transport.js) reaches the Tauri backend starting with the first call.
setBridgeTransport(async (cmd, args) => {
  const raw = await invoke<string>("execute_zam_bridge", { cmd, args });
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const preview = raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
    throw new Error(
      `Invalid bridge JSON for ${cmd}: ${preview} (${(err as Error).message})`,
    );
  }
});

const ZAM_RELEASES_URL = "https://github.com/zam-os/zam/releases";

const BLOOM_LEVEL_NAMES: Record<string, Record<number, string>> = {
  en: {
    1: "Remember (Bloom 1)",
    2: "Understand (Bloom 2)",
    3: "Apply (Bloom 3)",
    4: "Analyze (Bloom 4)",
    5: "Synthesize (Bloom 5)"
  },
  de: {
    1: "Erinnern (Bloom 1)",
    2: "Verstehen (Bloom 2)",
    3: "Anwenden (Bloom 3)",
    4: "Analysieren (Bloom 4)",
    5: "Synthetisieren (Bloom 5)"
  },
  ...BLOOM_PACKS,
};

// ── STATE MANAGEMENT ──────────────────────────────────────────────────────
type AppView = "dashboard-view" | "settings-view" | "study-view" | "graph-view" | "learning-content-view" | "onboarding-view" | "stats-view";
type ThemePreference = "light" | "dark";

let isLlmEnabled = false;
let aiConfigEditorOpen = false;
let modelRegistry: ModelRow[] = [];
let editingModelId: string | null = null;
let totalDue = 0;
let cardsReviewedThisSession = 0;
/** Ratings submitted this study session (for the end-of-session summary). */
const sessionRatingTally: {
  done: number;
  ratings: Record<1 | 2 | 3 | 4, number>;
} = {
  done: 0,
  ratings: { 1: 0, 2: 0, 3: 0, 4: 0 },
};
/** Due count when the current study session started (summary denominator). */
let sessionStartedDue = 0;
let sessionSummaryVisible = false;
/**
 * Snapshot of the #1 (fallback-order) model when Settings was opened. Leaving
 * Settings re-runs ensure-llm when this fingerprint differs so the header AI
 * badge reflects the newly primary model immediately — not only after the next
 * learning session / dashboard load.
 */
let primaryModelFingerprintOnSettingsEnter: string | null = null;

interface ProviderRoleStatus {
  enabled: boolean;
  providerName?: string;
  label?: string;
  source: "legacy" | "shared" | "machine";
  model: string;
  apiFlavor: string;
  local: boolean;
  usable: boolean;
  reason?: "disabled" | "offline" | "model-not-found" | "unsupported-provider";
}

interface ProviderStatusResponse {
  roles: {
    recall: ProviderRoleStatus;
    vision: ProviderRoleStatus;
    text?: ProviderRoleStatus;
  };
}

interface DatabaseStatusResponse {
  success: boolean;
  connected: boolean;
  target: {
    kind: "local" | "turso-native" | "turso-remote" | "turso-replica";
    location: string;
    syncUrl?: string;
  };
  userId: string | null;
  cardCount: number;
  users: Array<{ id: string; cardCount: number }>;
}

let databaseCurrentUserId: string | null = null;

// Unified capability model registry (ADR 2026-07-12). The Settings model table
// reads these rows from `zam bridge model-list`.
type ModelCapability = "text" | "embedding" | "image" | "video" | "stt" | "tts";
type CapabilityFlags = Record<ModelCapability, boolean>;

interface ModelRow {
  id: string;
  label: string;
  url: string;
  model: string;
  local: boolean;
  apiFlavor: string;
  runner?: string;
  order: number;
  capabilities: CapabilityFlags;
  detectedCapabilities: CapabilityFlags;
  probedAt?: string;
  apiKeyRef?: string;
  keyState: "set" | "missing" | "none";
  /** ADR 2026-07-12a — "http" (default) or "agent". */
  transport?: "http" | "agent";
  /** Harness id when transport is "agent" (e.g. "claude-code"). */
  agentHarness?: string;
  /**
   * Optional reasoning effort for agent harnesses that support it
   * (e.g. Copilot `--effort`). Unset = adapter picks from model id.
   */
  effort?:
    | "none"
    | "minimal"
    | "low"
    | "medium"
    | "high"
    | "xhigh"
    | "max";
}

interface AgentHarnessListEntry {
  id: string;
  label: string;
  kind: string;
  detected: boolean;
  /** True when this harness can back a `transport: "agent"` model. */
  outboundText?: boolean;
  /** True when the outbound adapter accepts local image files (vision/OCR). */
  outboundImage?: boolean;
  /** Recommended cheap default model id for this harness. */
  defaultModel?: string | null;
}

interface WorkspaceConfig {
  id: string;
  label?: string;
  kind: string;
  path: string;
  sourceControl?: string;
  knowledgeScopes?: string[];
  defaultAgent?: string;
}

type SkillLinkHealth = "healthy" | "needs-repair" | "unmanaged";

interface WorkspaceLinkHealth {
  health: SkillLinkHealth;
  states?: Record<string, string>;
}

interface WorkspaceListResponse {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string | null;
  activeWorkspace?: WorkspaceConfig | null;
  workspaceDir: string | null;
  defaultWorkspaceDir: string;
  dataDir: string;
  linkHealth?: Record<string, WorkspaceLinkHealth>;
  structure?: Record<string, OnboardingWorkspaceStructure>;
}

interface BridgeCard {
  cardId: string;
  tokenId: string;
  slug: string;
  title?: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  state: number;
  dueAt: string;
  sourceLink?: string;
  context?: string;
}

interface ReviewPayload {
  userId: string;
  hasReview: boolean;
  card: BridgeCard | null;
  prompt: {
    question: string;
    concept: string;
  } | null;
  questionSource?: "llm" | "original";
  questionModel?: string | null;
  resolvedContext: {
    content: string;
    filePath?: string;
  } | null;
  queueSize: number;
}

let activeCard: BridgeCard | null = null;
let activePromptQuestion = "";
let resolvedContextContent: string | null = null;
let studySessionActive = false;
let isWaitingForAi = false;
let waitTimeoutId: number | null = null;
let isWaitingForQuestion = false;
let questionWaitTimeoutId: number | null = null;
let questionRequestId = 0;
let evaluationRequestId = 0;
let revealInProgress = false;
let reviewActionInProgress = false;
let cardLoadInProgress = false;
// Post-reveal discussion thread (ADR 2026-07-06b) — ephemeral, App-only.
const discussion = createDiscussionState();
let activeUserAnswer = "";
let observerWindows: ObserverWindowInfo[] = [];
let observerReports: UiObservationReport[] = [];
let observerSequence = 0;
let observerAnalyzeInProgress = false;
let observerAnalysisRequestId = 0;
let observerLoopRunning = false;
let observerLoopTimerId: number | null = null;
let observerWatchRunning = false;
let observerWatchPollId: number | null = null;
let observerWatchLastEventCount = 0;
const OBSERVER_WATCH_POLL_MS = 1000;
// Forward-paging cursor for get-observations. The bridge returns reports with
// sequence > after (oldest-first), so we advance this past everything seen to
// keep pulling only new reports instead of re-reading the first page forever.
let observerReportsAfter = 0;
const OBSERVER_HISTORY_LIMIT = 100;
const OBSERVER_LOOP_DELAY_MS = 60000;
let desktopUserId: string | null = null;
let zamUiSessionId: string | null = null;
let activeWorkspaceId: string | null = null;
let activeWorkspaceDir: string | null = null;
const MAX_VISIBLE_WORKSPACES = 5;

interface ObserverWindowInfo {
  version: number;
  hwnd: number;
  processId: number;
  processName?: string;
  title: string;
  width: number;
  height: number;
  privacy?: {
    action: "observe" | "privacy-pause";
    reasons?: string[];
    titleRedacted?: boolean;
  };
}

interface UiObservationReport {
  version: number;
  sessionId: string;
  sequence: number;
  observedFrom: string;
  observedTo: string;
  kind: string;
  application: {
    processName: string;
    processId?: number;
    windowTitle?: string;
  };
  summary: string;
  actions: Array<{ type: string; target?: string; result?: string }>;
  evidence: Array<{ type: string; ref: string; redacted: boolean }>;
  confidence: number;
  candidateTokens: Array<{ slug: string; title?: string; confidence: number; rationale: string }>;
}

interface ObserverWatchStatus {
  running: boolean;
  pid: number | null;
  session: string | null;
  hwnd: string | null;
  eventLogPath: string | null;
  stderrLogPath: string | null;
  startedAt: number | null;
  eventCount: number;
  lastEventAt: number | null;
  lastError: string | null;
}

interface ZamSessionResponse {
  id: string;
  userId: string;
  task: string;
  executionContext: string;
  startedAt: string;
  completedAt: string | null;
}

interface UiObservationsResponse {
  sessionId: string;
  executionContext?: string;
  observationSource?: string;
  logExists?: boolean;
  after: number | null;
  count: number;
  nextSequence: number | null;
  observations: UiObservationReport[];
}

function resetObserverReportState(): void {
  observerSequence = 0;
  observerReportsAfter = 0;
  observerReports = [];
}

async function ensureDesktopUserId(): Promise<string> {
  if (desktopUserId) return desktopUserId;
  const bootstrap = await runBridge<{ userId: string }>("desktop-bootstrap");
  desktopUserId = bootstrap.userId;
  return desktopUserId;
}

async function ensureUiLearningSession(task: string): Promise<string> {
  if (zamUiSessionId) return zamUiSessionId;

  const userId = await ensureDesktopUserId();
  const session = await runBridge<ZamSessionResponse>("start-session", [
    "--task",
    task,
    "--context",
    "ui",
    "--user",
    userId,
  ]);
  zamUiSessionId = session.id;
  resetObserverReportState();
  return zamUiSessionId;
}

async function getObserverSessionId(): Promise<string> {
  return ensureUiLearningSession("Desktop UI observation");
}

async function closeUiLearningSession(): Promise<void> {
  if (!zamUiSessionId) return;

  const sessionId = zamUiSessionId;
  zamUiSessionId = null;
  try {
    await runBridge<ZamSessionResponse>("end-session", ["--session", sessionId]);
  } catch (error) {
    console.warn("Failed to end UI learning session", error);
  }
}

interface VisionStatus {
  enabled: boolean;
  online: boolean;
  url: string;
  model: string;
  modelAvailable: boolean;
  availableModels: string[];
  usable: boolean;
  visionModelExplicit: boolean;
  warning?: string;
}

const OBSERVER_PRIVACY_REASON_LABELS: Record<string, Record<string, string>> = {
  en: {
    authentication: "authentication or password screen",
    financial: "financial or payment screen",
    "private-browsing": "private browsing",
    "sensitive-process": "sensitive application",
  },
  de: {
    authentication: "Anmelde- oder Passwortfenster",
    financial: "Finanz- oder Zahlungsfenster",
    "private-browsing": "privater Browsermodus",
    "sensitive-process": "sensible Anwendung",
  },
  ...PRIVACY_PACKS,
};

function loadThemePreference(): ThemePreference {
  try {
    return localStorage.getItem("zam:theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: ThemePreference): void {
  document.documentElement.dataset.theme = theme;
  const select = document.getElementById("theme-select") as HTMLSelectElement | null;
  if (select) select.value = theme;
  try {
    void getCurrentWindow()
      .setTheme(theme)
      .catch(() => {
        // Browser preview has no native Tauri window; CSS theme still applies.
      });
  } catch {
    // Browser preview has no native Tauri window; CSS theme still applies.
  }
  if (graphScene) {
    graphScene.fog = new THREE.Fog(cssColorHex("--bg-deep-space", "#f5f7fb"), 12, 28);
  }
  if (graphRenderer) {
    graphRenderer.setClearColor(cssColorHex("--bg-deep-space", "#f5f7fb"), 1);
  }
  if (graphScene && currentNeighborhood) {
    // rebuild 3D materials/labels/lights for the new theme (light view visibility)
    buildGraphScene(currentNeighborhood);
  }
}

function saveThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem("zam:theme", theme);
  } catch {
    // The visual preference is non-critical; keep the current page theme.
  }
  applyTheme(theme);
}

// ── STATIC TRANSLATIONS INITIALIZER ──────────────────────────────────────
function initializeTranslations() {
  document.getElementById("nav-dashboard")!.textContent = t("nav_dashboard");
  document.getElementById("nav-settings")!.textContent = t("nav_settings");
  document.getElementById("nav-stats")!.textContent = t("nav_stats");
  document.getElementById("lbl-stats-kicker")!.textContent = t("stats_kicker");
  document.getElementById("lbl-stats-title")!.textContent = t("stats_title");
  document.getElementById("lbl-stats-subtitle")!.textContent =
    t("stats_subtitle");
  document.getElementById("btn-stats-back")!.textContent = t("btn_stats_back");
  document.getElementById("stats-period-day")!.textContent =
    t("stats_period_day");
  document.getElementById("stats-period-week")!.textContent =
    t("stats_period_week");
  document.getElementById("stats-period-month")!.textContent =
    t("stats_period_month");
  document.getElementById("lbl-stats-activity-title")!.textContent =
    t("stats_activity_title");
  document.getElementById("stats-loading-label")!.textContent =
    t("stats_loading");
  document.getElementById("lbl-dashboard-kicker")!.textContent =
    t("dashboard_kicker");
  document.getElementById("lbl-dashboard-title")!.textContent =
    t("dashboard_title");
  document.getElementById("lbl-dashboard-subtitle")!.textContent =
    t("dashboard_subtitle");
  document.getElementById("lbl-due-reviews")!.textContent = t("lbl_due_reviews");
  document.getElementById("lbl-domains")!.textContent = t("lbl_domains");
  document.getElementById("lbl-onboarding-checklist-title")!.textContent =
    t("onboarding_checklist_title");
  document.getElementById("lbl-onboarding-checklist-note")!.textContent =
    t("onboarding_checklist_note");
  // Checklist rows resolve their copy at render time — rebuild them so a
  // locale switch never leaves stale-language rows (no-op before bootstrap).
  renderOnboardingChecklist();
  document.getElementById("btn-start-session")!.textContent = t("btn_start_session");
  document.getElementById("btn-open-graph")!.textContent = t("btn_open_graph");
  document.getElementById("btn-open-settings")!.textContent =
    t("btn_open_settings");
  document.getElementById("lbl-translating")!.textContent = t("lbl_translating");
  document.getElementById("lbl-ai-evaluating")!.textContent = t("lbl_ai_evaluating");
  document.getElementById("lbl-ai-working")!.textContent = t("lbl_ai_working");
  document.getElementById("lbl-wait-warn")!.textContent = t("lbl_wait_warn");
  document.getElementById("btn-wait-keep")!.textContent = t("btn_wait_keep");
  document.getElementById("btn-wait-skip")!.textContent = t("btn_wait_skip");
  document.getElementById("lbl-question-wait-warn")!.textContent =
    t("lbl_question_wait_warn");
  document.getElementById("btn-question-wait-keep")!.textContent =
    t("btn_wait_keep");
  document.getElementById("btn-question-use-saved")!.textContent =
    t("btn_question_use_saved");
  document.getElementById("lbl-ai-feedback-title")!.textContent = t("lbl_ai_feedback_title");
  document.getElementById("lbl-reveal-title")!.textContent = t("lbl_reveal_title");
  document.getElementById("lbl-rating-instruction")!.textContent = t("lbl_rating_instruction");
  document.getElementById("btn-pause-session")!.textContent = t("btn_pause_session");
  document.getElementById("session-summary-title")!.textContent =
    t("lbl_recall_summary_title");
  document.getElementById("btn-session-summary-done")!.textContent =
    t("btn_back_to_dashboard");
  document.getElementById("btn-reveal-answer")!.textContent = t("btn_reveal_answer");
  document.getElementById("lbl-observer-title")!.textContent = t("observer_title");
  document.getElementById("observer-status")!.textContent = t("observer_idle");
  document.getElementById("observer-window-initial")!.textContent = t("observer_select_initial");
  document.getElementById("btn-observer-refresh")!.textContent = t("observer_refresh");
  document.getElementById("btn-observer-analyze")!.textContent = t("observer_analyze");
  document.getElementById("btn-observer-cancel")!.textContent = t("observer_cancel");
  document.getElementById("lbl-observer-history-title")!.textContent = t("observer_history_title");
  document.getElementById("btn-observer-reports-refresh")!.textContent = t("observer_history_refresh");
  document.getElementById("btn-observer-loop-start")!.textContent = t("observer_loop_start");
  document.getElementById("btn-observer-loop-stop")!.textContent = t("observer_loop_stop");
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
  document.getElementById("btn-observer-watch-start")!.textContent = t("observer_watch_start");
  document.getElementById("btn-observer-watch-stop")!.textContent = t("observer_watch_stop");
  if (!observerWatchRunning) {
    document.getElementById("observer-watch-note")!.textContent = t("observer_watch_idle");
  }
  renderObserverHistory();
  
  // Rating labels
  document.getElementById("lbl-rate-1")!.textContent = t("lbl_rate_1");
  document.getElementById("lbl-rate-2")!.textContent = t("lbl_rate_2");
  document.getElementById("lbl-rate-3")!.textContent = t("lbl_rate_3");
  document.getElementById("lbl-rate-4")!.textContent = t("lbl_rate_4");

  // Placeholders
  const answerInput = document.getElementById("user-answer-input") as HTMLTextAreaElement;
  if (answerInput) {
    answerInput.placeholder = t("placeholder_answer");
  }

  // Post-reveal discussion thread
  const discussionInput = document.getElementById("discussion-input") as HTMLTextAreaElement | null;
  if (discussionInput) {
    discussionInput.placeholder = t("placeholder_discussion");
  }
  document.getElementById("btn-discussion-send")!.textContent = t("btn_discussion_send");
  document.getElementById("discussion-error")!.textContent = t("discussion_error");

  // Setup & Data card
  document.getElementById("lbl-settings-kicker")!.textContent =
    t("settings_kicker");
  document.getElementById("lbl-settings-title")!.textContent =
    t("settings_title");
  document.getElementById("lbl-settings-subtitle")!.textContent =
    t("settings_subtitle");
  document.getElementById("btn-settings-back")!.textContent =
    t("settings_back");
  document.getElementById("lbl-settings-system-title")!.textContent =
    t("settings_system_title");
  document.getElementById("lbl-settings-ai-title")!.textContent =
    t("settings_ai_title");
  document.getElementById("lbl-settings-agents-title")!.textContent =
    t("settings_agents_title");
  document.getElementById("lbl-settings-agents-help")!.textContent =
    t("settings_agents_help");
  document.getElementById("btn-agents-connect-all")!.textContent =
    t("btn_agents_connect_all");
  const agentHarnessLoading = document.getElementById("agent-harness-loading");
  if (agentHarnessLoading) {
    agentHarnessLoading.textContent = t("agent_status_loading");
  }
  document.getElementById("lbl-settings-workspace-title")!.textContent =
    t("settings_workspace_title");
  document.getElementById("lbl-workspaces-help")!.textContent =
    t("workspaces_help");
  document.getElementById("lbl-settings-appearance-title")!.textContent =
    t("settings_appearance_title");
  document.getElementById("lbl-settings-voice-title")!.textContent =
    t("settings_voice_title");
  document.getElementById("lbl-settings-voice-help")!.textContent =
    t("settings_voice_help");
  document.getElementById("lbl-settings-voice-preference")!.textContent =
    t("settings_voice_preference");
  document.getElementById("voice-pref-device-only-option")!.textContent =
    t("voice_pref_device_only");
  document.getElementById("voice-pref-device-first-option")!.textContent =
    t("voice_pref_device_first");
  document.getElementById("voice-pref-quality-first-option")!.textContent =
    t("voice_pref_quality_first");
  renderVoicePreferenceDetail();
  document.getElementById("lbl-settings-data-title")!.textContent =
    t("settings_data_title");
  document.getElementById("lbl-settings-database")!.textContent =
    t("settings_database");
  document.getElementById("lbl-settings-learning-profile")!.textContent =
    t("settings_learning_profile");
  document.getElementById("lbl-settings-theme")!.textContent =
    t("settings_theme");
  document.getElementById("theme-light-option")!.textContent = t("theme_light");
  document.getElementById("theme-dark-option")!.textContent = t("theme_dark");
  document.getElementById("btn-open-data-folder")!.textContent = t("btn_open_data_folder");
  document.getElementById("btn-backup-db")!.textContent = t("btn_backup_db");
  document.getElementById("btn-refresh-database-status")!.textContent =
    t("database_refresh");
  document.getElementById("btn-choose-workspace")!.textContent =
    t("btn_choose_workspace");
  document.getElementById("btn-open-terminal")!.textContent =
    t("btn_open_terminal");
  document.getElementById("lbl-app-version")!.textContent = t("lbl_app_version");
  document.getElementById("lbl-learning-model")!.textContent =
    t("lbl_learning_model");
  document.getElementById("lbl-observer-model")!.textContent =
    t("lbl_observer_model");
  document.getElementById("lbl-dynamic-questions")!.textContent =
    t("lbl_dynamic_questions");
  document.getElementById("lbl-dynamic-questions-help")!.textContent =
    t("lbl_dynamic_questions_help");
  const aiConfigButton = document.getElementById("btn-toggle-ai-config");
  if (aiConfigButton) {
    aiConfigButton.textContent = aiConfigEditorOpen
      ? t("btn_ai_config_close")
      : t("btn_ai_config_open");
  }
  const addProviderButton = document.getElementById("btn-add-ai-provider");
  if (addProviderButton) addProviderButton.textContent = t("btn_add_model");
  document.getElementById("btn-check-updates")!.textContent = t("btn_check_updates");
  document.getElementById("btn-open-releases")!.textContent = t("btn_open_releases");
  document.getElementById("btn-run-onboarding")!.textContent =
    t("btn_run_onboarding");
  document.getElementById("graph-hint")!.textContent = t("graph_hint");

  // Knowledge Context settings and wizard
  const settingsContextTitle = document.getElementById("lbl-settings-context-title");
  if (settingsContextTitle) settingsContextTitle.textContent = t("settings_context_title");
  const settingsContextHelp = document.getElementById("lbl-settings-context-help");
  if (settingsContextHelp) settingsContextHelp.textContent = t("settings_context_help");
  const settingsContextLabel = document.getElementById("lbl-settings-context");
  if (settingsContextLabel) settingsContextLabel.textContent = t("settings_context_label");
  const deviceContextSelect = document.getElementById("device-context-select");
  if (deviceContextSelect) {
    const firstOpt = deviceContextSelect.querySelector("option");
    if (firstOpt) firstOpt.textContent = t("lbl_no_context_default");
  }
  const wizardContextLabel = document.getElementById("lbl-wizard-context");
  if (wizardContextLabel) wizardContextLabel.textContent = t("wizard_context_label");
  const wizardContextSelect = document.getElementById("wizard-context-select");
  if (wizardContextSelect) {
    const firstOpt = wizardContextSelect.querySelector("option");
    if (firstOpt) firstOpt.textContent = t("lbl_no_context_assignment");
  }

  // Learning Content Studio translations
  const navContent = document.getElementById("nav-content");
  if (navContent) navContent.textContent = t("nav_content");
  const lblContentKicker = document.getElementById("lbl-content-kicker");
  if (lblContentKicker) lblContentKicker.textContent = currentLocale === "de" ? "Persönlicher Katalog" : "Personal catalog";
  const lblContentTitle = document.getElementById("lbl-content-title");
  if (lblContentTitle) lblContentTitle.textContent = t("content_title");
  const lblContentSubtitle = document.getElementById("lbl-content-subtitle");
  if (lblContentSubtitle) lblContentSubtitle.textContent = t("content_subtitle");
  const btnContentNewCard = document.getElementById("btn-content-new-card");
  if (btnContentNewCard) btnContentNewCard.textContent = t("btn_new_card");
  const contentSearchInput = document.getElementById("content-search-input") as HTMLInputElement;
  if (contentSearchInput) contentSearchInput.placeholder = t("lbl_search_placeholder");
  const categoryFilterLabel = document.getElementById("content-category-filter");
  if (categoryFilterLabel) {
    const firstOpt = categoryFilterLabel.querySelector("option");
    if (firstOpt) firstOpt.textContent = t("lbl_all_categories");
  }
  const contextFilterLabel = document.getElementById("content-context-filter");
  if (contextFilterLabel) {
    const firstOpt = contextFilterLabel.querySelector("option");
    if (firstOpt) firstOpt.textContent = t("lbl_all_contexts");
  }
  const emptyContentDesc = document.getElementById("lbl-empty-content-desc");
  if (emptyContentDesc) emptyContentDesc.textContent = currentLocale === "de" ? "Wähle eine Karte aus der Liste aus, um sie zu bearbeiten, oder erstelle eine neue Karte." : "Select a card from the list to edit, or create a new card to start.";
  const btnCreateFirstCard = document.getElementById("btn-create-first-card");
  if (btnCreateFirstCard) btnCreateFirstCard.textContent = t("lbl_empty_content_btn");
  
  const lblEditorQuestion = document.getElementById("lbl-editor-question");
  if (lblEditorQuestion) lblEditorQuestion.textContent = t("lbl_question");
  const lblEditorConcept = document.getElementById("lbl-editor-concept");
  if (lblEditorConcept) lblEditorConcept.textContent = t("lbl_answer");
  const lblEditorDomain = document.getElementById("lbl-editor-domain");
  if (lblEditorDomain) lblEditorDomain.textContent = t("lbl_category");
  const lblEditorTitle = document.getElementById("lbl-editor-title");
  if (lblEditorTitle) lblEditorTitle.textContent = t("lbl_title");
  const lblEditorSourceLink = document.getElementById("lbl-editor-source-link");
  if (lblEditorSourceLink) lblEditorSourceLink.textContent = t("lbl_source_link");
  const lblEditorAdvanced = document.getElementById("lbl-editor-advanced");
  if (lblEditorAdvanced) lblEditorAdvanced.textContent = t("lbl_more_settings");
  const lblEditorContext = document.getElementById("lbl-editor-context");
  if (lblEditorContext) lblEditorContext.textContent = t("lbl_context");
  const lblEditorBloom = document.getElementById("lbl-editor-bloom");
  if (lblEditorBloom) lblEditorBloom.textContent = t("lbl_bloom_level");
  const lblEditorMode = document.getElementById("lbl-editor-mode");
  if (lblEditorMode) lblEditorMode.textContent = t("lbl_symbiosis_mode");
  const lblEditorSlug = document.getElementById("lbl-editor-slug");
  if (lblEditorSlug) lblEditorSlug.textContent = t("lbl_slug");
  const btnContentDeleteCard = document.getElementById("btn-content-delete-card");
  if (btnContentDeleteCard) btnContentDeleteCard.textContent = t("btn_remove");
  const btnContentCancelEdit = document.getElementById("btn-content-cancel-edit");
  if (btnContentCancelEdit) btnContentCancelEdit.textContent = t("lbl_cancel_action");
  const btnContentSaveCard = document.getElementById("btn-content-save-card");
  if (btnContentSaveCard) btnContentSaveCard.textContent = t("btn_save");

  // Modal Translations
  const lblModalCancel = document.getElementById("btn-modal-cancel");
  if (lblModalCancel) lblModalCancel.textContent = t("lbl_cancel_action");
  const lblModalConfirm = document.getElementById("btn-modal-confirm");
  if (lblModalConfirm) lblModalConfirm.textContent = t("lbl_confirm_action");
  const lblAdvancedDeleteTitle = document.getElementById("lbl-advanced-delete-title");
  if (lblAdvancedDeleteTitle) lblAdvancedDeleteTitle.textContent = currentLocale === "de" ? "Erweiterte Option:" : "Advanced option:";
  const btnModalHardDelete = document.getElementById("btn-modal-hard-delete");
  if (btnModalHardDelete) btnModalHardDelete.textContent = t("btn_delete");

  // In-recall card management (ADR 2026-07-16b)
  const btnStudyStopLbl = document.querySelector("#btn-study-stop .rating-label");
  if (btnStudyStopLbl) btnStudyStopLbl.textContent = t("study_btn_stop");
  const setStudyText = (id: string, key: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };
  setStudyText("btn-study-edit", "study_btn_edit");
  setStudyText("btn-study-manage-edit", "study_btn_edit");
  setStudyText("btn-study-manage-stop", "study_btn_stop");
  setStudyText("btn-study-open-editor", "study_btn_open_editor");
  setStudyText("btn-study-edit-save", "study_edit_save");
  setStudyText("btn-study-edit-cancel", "lbl_cancel_action");
  setStudyText("lbl-study-edit-question", "study_edit_question");
  setStudyText("lbl-study-edit-concept", "concept");
  setStudyText("btn-study-confirm-cancel", "lbl_cancel_action");
  const manageBtn = document.getElementById("btn-card-manage");
  if (manageBtn) manageBtn.setAttribute("aria-label", t("study_manage"));

  // Import Modal Translations
  const btnContentImport = document.getElementById("btn-content-import");
  if (btnContentImport) btnContentImport.textContent = t("btn_import_curriculum");
  const lblImportModalTitle = document.getElementById("lbl-import-modal-title");
  if (lblImportModalTitle) lblImportModalTitle.textContent = t("lbl_import_modal_title");
  const lblImportText = document.getElementById("lbl-import-text");
  if (lblImportText) lblImportText.textContent = t("lbl_import_text");
  const importFieldText = document.getElementById("import-field-text") as HTMLTextAreaElement;
  if (importFieldText) importFieldText.placeholder = t("placeholder_import_text");
  const lblImportSource = document.getElementById("lbl-import-source");
  if (lblImportSource) lblImportSource.textContent = t("lbl_import_source");
  const lblImportCategory = document.getElementById("lbl-import-category");
  if (lblImportCategory) lblImportCategory.textContent = t("lbl_import_category");
  const lblImportProgressStatus = document.getElementById("lbl-import-progress-status");
  if (lblImportProgressStatus) lblImportProgressStatus.textContent = t("lbl_import_progress_status");
  const lblImportProgressDetail = document.getElementById("lbl-import-progress-detail");
  if (lblImportProgressDetail) lblImportProgressDetail.textContent = t("lbl_import_progress_detail");
  const btnImportModalCancel = document.getElementById("btn-import-modal-cancel");
  if (btnImportModalCancel) btnImportModalCancel.textContent = t("lbl_cancel_action");
  const btnImportModalSubmit = document.getElementById("btn-import-modal-submit");
  if (btnImportModalSubmit) btnImportModalSubmit.textContent = t("btn_import_submit");

  // Curriculum Import Wizard Translations
  const btnContentCurriculumWizard = document.getElementById("btn-content-curriculum-wizard");
  if (btnContentCurriculumWizard) btnContentCurriculumWizard.textContent = t("btn_curriculum_wizard");
  // Goal import entry (plan Phase 8): reopens the onboarding goal page.
  const btnContentGoalImport = document.getElementById("btn-content-goal-import");
  if (btnContentGoalImport) btnContentGoalImport.textContent = t("btn_content_goal_import");
  const lblCurriculumWizardTitle = document.getElementById("lbl-curriculum-wizard-title");
  if (lblCurriculumWizardTitle) lblCurriculumWizardTitle.textContent = t("lbl_curriculum_wizard_title");
  const btnCurriculumWizardBack = document.getElementById("btn-curriculum-wizard-back");
  if (btnCurriculumWizardBack) btnCurriculumWizardBack.textContent = t("wizard_btn_back");
  const btnCurriculumWizardNext = document.getElementById("btn-curriculum-wizard-next");
  if (btnCurriculumWizardNext) btnCurriculumWizardNext.textContent = t("wizard_btn_next");
  const btnCurriculumWizardCancel = document.getElementById("btn-curriculum-wizard-cancel");
  if (btnCurriculumWizardCancel) btnCurriculumWizardCancel.textContent = t("lbl_cancel_action");
  const btnCurriculumWizardResume = document.getElementById("btn-curriculum-wizard-resume");
  if (btnCurriculumWizardResume) btnCurriculumWizardResume.textContent = t("wizard_btn_resume");
  const btnCurriculumWizardRestart = document.getElementById("btn-curriculum-wizard-restart");
  if (btnCurriculumWizardRestart) btnCurriculumWizardRestart.textContent = t("wizard_btn_restart");
  const lblCurriculumWizardLoading = document.getElementById("lbl-curriculum-wizard-loading");
  if (lblCurriculumWizardLoading) lblCurriculumWizardLoading.textContent = t("lbl_curriculum_wizard_loading");
  const lblCurriculumWizardProgressStatus = document.getElementById("lbl-curriculum-wizard-progress-status");
  if (lblCurriculumWizardProgressStatus) lblCurriculumWizardProgressStatus.textContent = t("lbl_curriculum_wizard_progress_status");
  const lblCurriculumWizardProgressDetail = document.getElementById("lbl-curriculum-wizard-progress-detail");
  if (lblCurriculumWizardProgressDetail) lblCurriculumWizardProgressDetail.textContent = t("lbl_curriculum_wizard_progress_detail");

  // Split Modal Translations
  const btnContentSplitCard = document.getElementById("btn-content-split-card");
  if (btnContentSplitCard) btnContentSplitCard.textContent = t("btn_split");
  const lblSplitModalTitle = document.getElementById("lbl-split-modal-title");
  if (lblSplitModalTitle) lblSplitModalTitle.textContent = t("lbl_split_modal_title");
  const lblOriginalCardTitle = document.getElementById("lbl-original-card-title");
  if (lblOriginalCardTitle) lblOriginalCardTitle.textContent = t("lbl_original_card_title");
  const lblSplitOriginalQuestion = document.getElementById("lbl-split-original-question");
  if (lblSplitOriginalQuestion) lblSplitOriginalQuestion.textContent = t("lbl_split_original_question");
  const lblSplitOriginalConcept = document.getElementById("lbl-split-original-concept");
  if (lblSplitOriginalConcept) lblSplitOriginalConcept.textContent = t("lbl_split_original_concept");
  const lblSplitActionTitle = document.getElementById("lbl-split-action-title");
  if (lblSplitActionTitle) lblSplitActionTitle.textContent = t("lbl_split_action_title");
  const lblActionBlock = document.getElementById("lbl-action-block");
  if (lblActionBlock) lblActionBlock.textContent = t("lbl_action_block");
  const lblActionRemove = document.getElementById("lbl-action-remove");
  if (lblActionRemove) lblActionRemove.textContent = t("lbl_action_remove");
  const lblSplitProgressStatus = document.getElementById("lbl-split-progress-status");
  if (lblSplitProgressStatus) lblSplitProgressStatus.textContent = t("lbl_split_progress_status");
  const lblSplitProgressDetail = document.getElementById("lbl-split-progress-detail");
  if (lblSplitProgressDetail) lblSplitProgressDetail.textContent = t("lbl_split_progress_detail");
  const lblAtomicProposalsTitle = document.getElementById("lbl-atomic-proposals-title");
  if (lblAtomicProposalsTitle) lblAtomicProposalsTitle.textContent = t("lbl_atomic_proposals_title");
  const btnSplitModalCancel = document.getElementById("btn-split-modal-cancel");
  if (btnSplitModalCancel) btnSplitModalCancel.textContent = t("lbl_cancel_action");
  const btnSplitModalSubmit = document.getElementById("btn-split-modal-submit");
  if (btnSplitModalSubmit) btnSplitModalSubmit.textContent = t("btn_split_modal_submit");

  // Foundations Modal Translations
  const btnContentFoundationsCard = document.getElementById("btn-content-foundations-card");
  if (btnContentFoundationsCard) btnContentFoundationsCard.textContent = t("btn_content_foundations_card");
  const lblFoundationsModalTitle = document.getElementById("lbl-foundations-modal-title");
  if (lblFoundationsModalTitle) lblFoundationsModalTitle.textContent = t("lbl_foundations_modal_title");
  const lblFoundationsProgressStatus = document.getElementById("lbl-foundations-progress-status");
  if (lblFoundationsProgressStatus) lblFoundationsProgressStatus.textContent = t("lbl_foundations_progress_status");
  const lblFoundationsProgressDetail = document.getElementById("lbl-foundations-progress-detail");
  if (lblFoundationsProgressDetail) lblFoundationsProgressDetail.textContent = t("lbl_foundations_progress_detail");
  const lblFoundationsAtomicTitle = document.getElementById("lbl-foundations-atomic-title");
  if (lblFoundationsAtomicTitle) lblFoundationsAtomicTitle.textContent = t("lbl_foundations_atomic_title");
  const btnFoundationsModalCancel = document.getElementById("btn-foundations-modal-cancel");
  if (btnFoundationsModalCancel) btnFoundationsModalCancel.textContent = t("lbl_cancel_action");
  const btnFoundationsModalSubmit = document.getElementById("btn-foundations-modal-submit");
  if (btnFoundationsModalSubmit) btnFoundationsModalSubmit.textContent = t("btn_foundations_modal_submit");

  // Source Import Translations
  const lblImportSourceType = document.getElementById("lbl-import-source-type");
  if (lblImportSourceType) lblImportSourceType.textContent = t("lbl_import_source_type");
  const lblImportSourceUri = document.getElementById("lbl-import-source-uri");
  if (lblImportSourceUri) lblImportSourceUri.textContent = t("lbl_import_source_uri");
  const btnImportSourceAnalyze = document.getElementById("btn-import-source-analyze");
  if (btnImportSourceAnalyze) btnImportSourceAnalyze.textContent = t("btn_import_source_analyze");
  const lblSourceExtractedPreview = document.getElementById("lbl-source-extracted-preview");
  if (lblSourceExtractedPreview) lblSourceExtractedPreview.textContent = t("lbl_source_extracted_preview");

  document.getElementById("graph-title")!.textContent = t("graph_title");
  document.getElementById("btn-graph-back")!.textContent =
    t("btn_back_to_dashboard");
  document.getElementById("btn-graph-refresh")!.textContent =
    t("graph_refresh");
  document.getElementById("graph-focus-title")!.textContent = t("graph_focus");
  document.getElementById("graph-prereqs-title")!.textContent =
    t("graph_prereqs");
  document.getElementById("graph-dependents-title")!.textContent =
    t("graph_dependents");
  document.getElementById("graph-hint")!.textContent = t("graph_hint");
  updateGraphLearnerFilterUi();

  // Locale badge — shows the active locale code; full language name on hover.
  const localeBadge = document.getElementById("locale-badge")!;
  localeBadge.textContent = currentLocale.toUpperCase();
  const safeLocale: Locale = isSupportedLocale(currentLocale) ? currentLocale : "en";
  localeBadge.title = LOCALE_LABELS[safeLocale];
  applyTheme(loadThemePreference());
}

// ── LOCALE SWITCHER ───────────────────────────────────────────────────────
// The locale derives from the OS by default (system.locale, resolved by the
// bridge). Clicking the badge lets the user override it for this machine; the
// choice persists via the system.locale setting and is read back on next launch.

function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

function closeLocaleMenu(): void {
  document.getElementById("locale-menu")?.classList.add("hidden");
  document
    .getElementById("locale-badge")
    ?.setAttribute("aria-expanded", "false");
}

function renderLocaleMenu(menu: HTMLElement): void {
  menu.replaceChildren();
  for (const locale of LOCALES) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "locale-menu-item";
    item.setAttribute("aria-current", String(locale === currentLocale));
    const code = document.createElement("span");
    code.className = "locale-menu-code";
    code.textContent = locale.toUpperCase();
    const label = document.createElement("span");
    label.textContent = LOCALE_LABELS[locale];
    item.append(code, label);
    item.addEventListener("click", () => {
      closeLocaleMenu();
      void setLocale(locale);
    });
    menu.appendChild(item);
  }
}

function setupLocaleSwitcher(): void {
  const badge = document.getElementById("locale-badge");
  if (!badge) return;

  badge.setAttribute("role", "button");
  badge.setAttribute("tabindex", "0");
  badge.setAttribute("aria-haspopup", "listbox");
  badge.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.id = "locale-menu";
  menu.className = "locale-menu hidden";
  badge.parentElement?.appendChild(menu);

  const toggle = () => {
    if (menu.classList.contains("hidden")) {
      renderLocaleMenu(menu);
      menu.classList.remove("hidden");
      badge.setAttribute("aria-expanded", "true");
    } else {
      closeLocaleMenu();
    }
  };

  badge.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });
  badge.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    } else if (event.key === "Escape") {
      closeLocaleMenu();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !menu.classList.contains("hidden") &&
      event.target instanceof Node &&
      !menu.contains(event.target) &&
      event.target !== badge
    ) {
      closeLocaleMenu();
    }
  });
}

async function setLocale(locale: Locale): Promise<void> {
  if (locale === currentLocale) return;
  setCurrentLocale(locale);

  // Persist as an OS-default override; read back by desktop-bootstrap on launch.
  try {
    await runBridge("setting-set", [
      "--key",
      "system.locale",
      "--value",
      locale,
    ]);
  } catch (error) {
    console.warn("Failed to persist locale override", error);
  }

  // Re-render static chrome plus the localized dynamic panels currently shown.
  initializeTranslations();
  void loadWorkspaceList();
  void loadProviderStatus();
  // Device speech availability is per-language: a machine with an English
  // speech pack and no German one gains or loses voice mode on this switch.
  void refreshVoiceAvailability();
}

function isActiveWorkspace(workspace: WorkspaceConfig): boolean {
  return Boolean(activeWorkspaceId && workspace.id === activeWorkspaceId);
}

function workspaceKindLabel(kind: string): string {
  switch (kind) {
    case "personal":
      return t("workspace_kind_personal");
    case "team":
      return t("workspace_kind_team");
    case "family":
      return t("workspace_kind_family");
    case "community":
      return t("workspace_kind_community");
    case "organization":
      return t("workspace_kind_organization");
    case "custom":
      return t("workspace_kind_custom");
    default:
      return tf("workspace_kind", { kind });
  }
}

function workspaceMeta(workspace: WorkspaceConfig): string {
  const parts = [workspaceKindLabel(workspace.kind)];
  if (workspace.sourceControl) parts.push(workspace.sourceControl);
  if (workspace.knowledgeScopes?.length) {
    parts.push(workspace.knowledgeScopes.slice(0, 3).join(", "));
  }
  return parts.join(" · ");
}

function buildVisibleWorkspaces(info: WorkspaceListResponse): WorkspaceConfig[] {
  activeWorkspaceId = info.activeWorkspaceId ?? info.activeWorkspace?.id ?? null;
  activeWorkspaceDir = info.activeWorkspace?.path ?? info.workspaceDir ?? null;
  const workspaces = [...info.workspaces];
  return workspaces.sort((left, right) => {
    const leftActive = isActiveWorkspace(left) ? 1 : 0;
    const rightActive = isActiveWorkspace(right) ? 1 : 0;
    return rightActive - leftActive;
  });
}

function renderWorkspaceList(info: WorkspaceListResponse): void {
  const list = document.getElementById("workspace-list");
  if (!list) return;
  list.replaceChildren();

  const workspaces = buildVisibleWorkspaces(info);
  const visible = workspaces.slice(0, MAX_VISIBLE_WORKSPACES);

  for (const workspace of visible) {
    const row = document.createElement("div");
    row.className = "workspace-row";
    row.dataset.active = String(isActiveWorkspace(workspace));
    const health = info.linkHealth?.[workspace.id]?.health;
    if (health && health !== "healthy") row.dataset.linkHealth = health;

    const main = document.createElement("div");
    main.className = "workspace-main";

    const titleRow = document.createElement("div");
    titleRow.className = "workspace-title-row";
    const title = document.createElement("span");
    title.className = "workspace-title";
    title.textContent = workspace.label || workspace.id;
    titleRow.appendChild(title);
    if (isActiveWorkspace(workspace)) {
      const badge = document.createElement("span");
      badge.className = "workspace-badge";
      badge.textContent = t("workspace_active");
      titleRow.appendChild(badge);
    }
    if (health) {
      const linkBadge = document.createElement("span");
      linkBadge.className = `workspace-badge workspace-link-badge ${
        health === "healthy" ? "ok" : "warn"
      }`;
      linkBadge.textContent =
        health === "healthy"
          ? t("workspace_link_ok")
          : health === "unmanaged"
            ? t("workspace_link_unmanaged")
            : t("workspace_link_broken");
      titleRow.appendChild(linkBadge);
    }
    // Missing-workspace state (ADR 2026-07-24 §4): a registered path whose
    // directory vanished — or lost parts of the fresh-setup structure — shows
    // a repairable badge here instead of failing at the point of use.
    const structure = info.structure?.[workspace.id];
    const structureBroken = structure ? !structure.complete : false;
    if (structureBroken) {
      const structureBadge = document.createElement("span");
      structureBadge.className = "workspace-badge workspace-link-badge warn";
      structureBadge.textContent = structure?.dirExists
        ? t("workspace_structure_incomplete")
        : t("workspace_structure_missing");
      titleRow.appendChild(structureBadge);
    }

    const path = document.createElement("code");
    path.textContent = workspace.path;

    const meta = document.createElement("span");
    meta.className = "workspace-meta";
    meta.textContent = workspaceMeta(workspace);

    main.append(titleRow, path, meta);

    const actions = document.createElement("div");
    actions.className = "workspace-actions";

    if (structureBroken) {
      // Structure repair recreates the directory and missing pieces additively
      // (and force-relinks skills), so it supersedes the link-only repair.
      const repairButton = document.createElement("button");
      repairButton.className = "btn warn-btn btn-sm";
      repairButton.type = "button";
      repairButton.textContent = t("workspace_repair_structure");
      repairButton.addEventListener("click", () => {
        void repairWorkspaceStructure(workspace);
      });
      actions.appendChild(repairButton);
    } else if (health === "needs-repair" || health === "unmanaged") {
      const repairButton = document.createElement("button");
      repairButton.className = "btn warn-btn btn-sm";
      repairButton.type = "button";
      repairButton.textContent = t("workspace_repair");
      repairButton.addEventListener("click", () => {
        void repairWorkspaceLinks(workspace, health);
      });
      actions.appendChild(repairButton);
    }

    const useButton = document.createElement("button");
    useButton.className = "btn secondary-btn btn-sm";
    useButton.type = "button";
    useButton.textContent = t("workspace_use");
    useButton.disabled = isActiveWorkspace(workspace);
    useButton.addEventListener("click", () => {
      void setActiveWorkspace(workspace.path);
    });

    const terminalButton = document.createElement("button");
    terminalButton.className = "btn primary-btn btn-sm";
    terminalButton.type = "button";
    terminalButton.textContent = t("workspace_open");
    terminalButton.addEventListener("click", () => {
      void openWorkspaceTerminal(workspace.path);
    });

    actions.append(useButton, terminalButton);
    if (info.workspaces.some((item) => item.id === workspace.id)) {
      const removeButton = document.createElement("button");
      removeButton.className = "btn danger-btn btn-sm";
      removeButton.type = "button";
      removeButton.textContent = t("workspace_remove");
      removeButton.addEventListener("click", () => {
        void removeWorkspace(workspace);
      });
      actions.appendChild(removeButton);
    }
    row.append(main, actions);
    list.appendChild(row);
  }

  const hiddenCount = workspaces.length - visible.length;
  if (hiddenCount > 0) {
    const more = document.createElement("p");
    more.className = "workspace-more";
    more.textContent = tf("workspace_more", { count: hiddenCount });
    list.appendChild(more);
  }
}

async function loadWorkspaceList(): Promise<void> {
  try {
    const info = await runBridge<WorkspaceListResponse>("workspace-list");
    renderWorkspaceList(info);
  } catch {
    // Leave the placeholder in place if the bridge is unavailable.
  }
}

async function setActiveWorkspace(dir: string): Promise<void> {
  const status = document.getElementById("setup-status");
  const res = await runBridge<{
    ok?: boolean;
    activeWorkspaceId?: string;
    activeWorkspace?: WorkspaceConfig;
    workspaceDir?: string;
  }>("set-workspace-dir", ["--dir", dir]);
  if (res.workspaceDir) {
    activeWorkspaceId = res.activeWorkspaceId ?? res.activeWorkspace?.id ?? null;
    activeWorkspaceDir = res.workspaceDir;
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_set", { path: res.workspaceDir });
    }
  }
}

async function removeWorkspace(workspace: WorkspaceConfig): Promise<void> {
  const label = workspace.label || workspace.id;
  if (!window.confirm(tf("workspace_remove_confirm", { label }))) return;

  const status = document.getElementById("setup-status");
  try {
    const result = await runBridge<{
      activeWorkspaceId?: string;
      activeWorkspace?: WorkspaceConfig;
      workspaceDir?: string;
    }>("workspace-remove", ["--id", workspace.id]);
    activeWorkspaceId =
      result.activeWorkspaceId ?? result.activeWorkspace?.id ?? activeWorkspaceId;
    activeWorkspaceDir = result.workspaceDir ?? activeWorkspaceDir;
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_removed", { label });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("workspace_remove_failed", {
        message: errorMessage(err),
      });
    }
  }
}

/**
 * Structure repair (ADR 2026-07-24 §4): recreate a vanished directory and the
 * missing fresh-setup pieces additively, re-link skills. Never overwrites a
 * user-authored file, so no confirmation is needed.
 */
async function repairWorkspaceStructure(
  workspace: WorkspaceConfig,
): Promise<void> {
  const label = workspace.label || workspace.id;
  const status = document.getElementById("setup-status");
  if (status) status.textContent = t("workspace_repairing");
  try {
    await runBridge("workspace-repair", ["--id", workspace.id]);
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_repaired", { label });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("workspace_repair_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function repairWorkspaceLinks(
  workspace: WorkspaceConfig,
  health: SkillLinkHealth,
): Promise<void> {
  const label = workspace.label || workspace.id;
  // Replacing a foreign skills/zam directory is destructive, so confirm first.
  // Broken links and outdated copies are clearly ZAM's and repair silently.
  if (
    health === "unmanaged" &&
    !window.confirm(tf("workspace_repair_confirm", { label }))
  ) {
    return;
  }

  const status = document.getElementById("setup-status");
  if (status) status.textContent = t("workspace_repairing");
  try {
    await runBridge("workspace-repair-links", ["--id", workspace.id]);
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_repaired", { label });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("workspace_repair_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function openWorkspaceTerminal(dir?: string | null): Promise<void> {
  const workspace = dir ?? activeWorkspaceDir;
  const status = document.getElementById("setup-status");
  if (!workspace) {
    if (status) status.textContent = t("workspace_empty");
    return;
  }
  if (status) status.textContent = t("terminal_opening");
  try {
    await invoke("open_terminal_in_dir", { dir: workspace });
    if (status) {
      status.textContent = tf("terminal_opened", { workspace });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("terminal_open_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function loadAppVersion(): Promise<void> {
  const versionEl = document.getElementById("app-version");
  if (!versionEl) return;
  try {
    const info = await invoke<{
      dev_checkout_path: string | null;
      dev_checkout_version: string | null;
      bundled_version: string;
      using_dev_checkout: boolean;
      version_mismatch: boolean;
      fallback_to_bundled: boolean;
    }>("get_bridge_info");

    let text = `v${info.bundled_version}`;
    if (info.using_dev_checkout && info.dev_checkout_path) {
      text += ` (Checkout: ${info.dev_checkout_path} v${info.dev_checkout_version})`;
    } else if (info.fallback_to_bundled && info.dev_checkout_path) {
      text += ` (Fallback: Mismatch checkout ${info.dev_checkout_path} v${info.dev_checkout_version})`;
      console.warn(
        `Developer checkout version mismatch: expected ${info.bundled_version}, got ${info.dev_checkout_version}. Fell back to bundled bridge.`,
      );
    }
    versionEl.textContent = text;
  } catch (err) {
    console.warn("Failed to get bridge info:", err);
    try {
      versionEl.textContent = `v${await getVersion()}`;
    } catch {
      versionEl.textContent = t("version_unknown");
    }
  }
}

function providerReasonText(status: ProviderRoleStatus): string {
  if (!status.enabled) return t("provider_disabled");
  if (status.usable) return t("provider_ready");
  switch (status.reason) {
    case "model-not-found":
      return t("provider_model_missing");
    case "unsupported-provider":
      return t("provider_unsupported");
    case "offline":
      return t("provider_offline");
    case "disabled":
      return t("provider_disabled");
    default:
      return t("provider_unknown");
  }
}

function formatProviderStatus(status: ProviderRoleStatus): string {
  const name =
    status.label ||
    status.providerName ||
    (status.source === "legacy" ? "legacy" : status.source);
  const location = status.local ? t("provider_local") : t("provider_cloud");
  return `${name}: ${status.model} · ${location} · ${providerReasonText(status)}`;
}

function setModelAttributionBadge(
  elementId: string,
  label: string | null | undefined,
): void {
  const badge = document.getElementById(elementId);
  if (!badge) return;
  const text = label?.trim();
  if (!text) {
    badge.textContent = "";
    badge.classList.add("hidden");
    return;
  }
  badge.textContent = text;
  badge.classList.remove("hidden");
}

function questionAttributionLabel(
  source?: "llm" | "original",
  model?: string | null,
): string {
  if (source === "llm" && model?.trim()) {
    return model.trim();
  }
  return t("study_question_original");
}

function setAiStatus(label: string, dotClass: "green" | "amber" | "gray"): void {
  const aiStatusLabel = document.getElementById("ai-status-label");
  const pulseDot = document.querySelector(".pulse-dot");
  if (aiStatusLabel) aiStatusLabel.textContent = label;
  if (pulseDot) {
    pulseDot.className = `pulse-dot ${dotClass}`;
    pulseDot.setAttribute("aria-label", label);
  }
}

/**
 * Bring the configured primary model online (or re-validate after Settings
 * changes) and update the header badge. Non-blocking: shows "starting" first.
 */
function refreshAiStatus(): void {
  setAiStatus(t("ai_status_starting"), "amber");
  runBridge<{
    usable: boolean;
    online: boolean;
    reason?: string;
    model?: string;
    label?: string;
    local?: boolean;
  }>("ensure-llm", ["--timeout", "45000"])
    .then((llm) => {
      // Prefer human label over raw model ids (esp. agent:harness).
      const display = llm.label?.trim() || llm.model?.trim() || "cloud";
      if (llm.usable) {
        setAiStatus(
          llm.local
            ? t("ai_status_online")
            : tf("ai_status_cloud_online", { model: display }),
          "green",
        );
      } else if (llm.reason === "model-not-found") {
        setAiStatus(t("ai_status_model_missing"), "gray");
      } else if (llm.local === false && (llm.model || llm.label)) {
        setAiStatus(
          tf("ai_status_cloud_offline", { model: display }),
          "gray",
        );
      } else {
        setAiStatus(t("ai_status_offline"), "gray");
      }
    })
    .catch(() => {
      setAiStatus(t("ai_status_offline"), "gray");
    });
  void loadProviderStatus();
}

/** Stable identity of the first model in fallback order (#1 in Settings). */
function primaryModelFingerprint(models: ModelRow[]): string {
  const ordered = [...models].sort((a, b) => a.order - b.order);
  const top = ordered[0];
  if (!top) return "empty";
  return [
    top.id,
    top.model,
    top.url,
    top.local ? "1" : "0",
    top.apiFlavor,
    top.keyState,
    top.capabilities.text ? "t" : "-",
    top.capabilities.embedding ? "e" : "-",
    top.capabilities.image ? "i" : "-",
  ].join("|");
}

async function capturePrimaryModelFingerprint(): Promise<void> {
  try {
    const response = await runBridge<{ models: ModelRow[] }>("model-list");
    primaryModelFingerprintOnSettingsEnter = primaryModelFingerprint(
      response.models ?? [],
    );
  } catch {
    // Unknown baseline → re-init on leave so a failed snapshot never leaves a
    // stale header badge after the user edited models.
    primaryModelFingerprintOnSettingsEnter = "unknown";
  }
}

/**
 * If the #1 model changed while Settings was open, re-initialize the AI so the
 * status badge matches the model already used for new requests.
 */
async function maybeReinitAiAfterSettings(): Promise<void> {
  if (primaryModelFingerprintOnSettingsEnter === null) return;
  const entered = primaryModelFingerprintOnSettingsEnter;
  primaryModelFingerprintOnSettingsEnter = null;
  try {
    const response = await runBridge<{ models: ModelRow[] }>("model-list");
    const current = primaryModelFingerprint(response.models ?? []);
    if (current !== entered) {
      refreshAiStatus();
    }
  } catch {
    // Still re-check readiness if we cannot compare — better a refresh than a
    // stale badge after the user edited models.
    refreshAiStatus();
  }
}

async function loadProviderStatus(): Promise<void> {
  const recallEl = document.getElementById("learning-model-status");
  const visionEl = document.getElementById("observer-model-status");
  if (!recallEl || !visionEl) return;

  try {
    const status = await runBridge<ProviderStatusResponse>("provider-status");
    recallEl.textContent = formatProviderStatus(status.roles.recall);
    visionEl.textContent = formatProviderStatus(status.roles.vision);
  } catch {
    recallEl.textContent = t("provider_unknown");
    visionEl.textContent = t("provider_unknown");
  }
}

/**
 * Dynamic questions (ADR 2026-06-15).
 *
 * ZAM normally rewrites a card's question for every review so the wording
 * cannot be memorised. That costs one model round-trip before the card can be
 * shown, which is exactly what makes the first card of a session feel slow on
 * a modest or cold model. The setting has existed since 0.x but had no way to
 * reach it short of writing the database row by hand.
 */
async function loadDynamicQuestionSetting(): Promise<void> {
  const toggle = document.getElementById(
    "toggle-dynamic-questions",
  ) as HTMLInputElement | null;
  if (!toggle) return;
  try {
    const settings = await runBridge<{
      recall?: { dynamicQuestions?: boolean };
    }>("get-settings");
    // Absent means on, matching the kernel-side `!== "false"` default.
    toggle.checked = settings?.recall?.dynamicQuestions !== false;
  } catch {
    // Leave the checkbox at its markup default rather than claiming a state
    // we could not read.
  }
}

async function setDynamicQuestions(enabled: boolean): Promise<void> {
  const status = document.getElementById("dynamic-questions-status");
  const toggle = document.getElementById(
    "toggle-dynamic-questions",
  ) as HTMLInputElement | null;
  if (status) status.textContent = "";
  try {
    await runBridge("setting-set", [
      "--key",
      "llm.dynamic_questions",
      "--value",
      enabled ? "true" : "false",
    ]);
    if (status) {
      status.textContent = enabled
        ? t("dynamic_questions_on")
        : t("dynamic_questions_off");
    }
  } catch (error) {
    console.error("Failed to persist the dynamic-question setting", error);
    // Put the checkbox back where it was: a toggle that silently did nothing
    // is worse than one that says it failed.
    if (toggle) toggle.checked = !enabled;
    if (status) status.textContent = t("dynamic_questions_error");
  }
}

// ── SETTINGS: AGENT HARNESS CONNECTIONS (ADR 2026-07-11) ─────────────────
interface AgentHarnessStatusEntry {
  harness: string;
  label: string;
  installed: boolean;
  configured: boolean;
  configPath: string;
  note?: string;
}

interface AgentConnectResultEntry {
  harness: string;
  label: string;
  error?: string;
}

interface AgentConnectPayload {
  success: boolean;
  skipped?: boolean;
  error?: string;
  detected?: string[];
  results?: AgentConnectResultEntry[];
  skills?: { refreshed: number; total: number } | null;
}

let agentConnectState: "not_run" | "running" | "success" | "failed" = "not_run";
let agentConnectErrorDetail = "";

function updateAgentConnectResultUI(): void {
  const resultEl = document.getElementById("agent-connect-result");
  if (!resultEl) return;
  resultEl.classList.remove("hidden");

  let statusText = "";
  switch (agentConnectState) {
    case "not_run":
      statusText = `${t("agent_connect_status")}: ${t("agent_connect_not_run")}`;
      resultEl.className = "sub-label settings-status-row not-run";
      break;
    case "running":
      statusText = `${t("agent_connect_status")}: ${t("agent_connect_running")}`;
      resultEl.className = "sub-label settings-status-row running";
      break;
    case "success":
      statusText = `${t("agent_connect_status")}: ${t("agent_connect_success")}`;
      if (agentConnectErrorDetail) {
        statusText += ` — ${agentConnectErrorDetail}`;
      }
      resultEl.className = "sub-label settings-status-row success";
      break;
    case "failed":
      statusText = `${t("agent_connect_status")}: ${t("agent_connect_failed")}`;
      if (agentConnectErrorDetail) {
        statusText += ` — ${agentConnectErrorDetail}`;
      }
      resultEl.className = "sub-label settings-status-row failed";
      break;
  }
  resultEl.textContent = statusText;
}

async function loadAgentHarnessStatus(): Promise<void> {
  const list = document.getElementById("agent-harness-list");
  if (!list) return;
  try {
    const status = await runBridge<{
      success: boolean;
      zamOnPath: boolean;
      connectAutoDone: boolean;
      harnesses: AgentHarnessStatusEntry[];
    }>("agent-harness-status");
    if (status.connectAutoDone && agentConnectState === "not_run") {
      agentConnectState = "success";
      agentConnectErrorDetail = "";
    }
    renderAgentHarnessList(status.harnesses);
    updateAgentConnectResultUI();
  } catch (err) {
    console.warn("Failed to load agent harness status:", err);
    list.textContent = "";
    const note = document.createElement("p");
    note.className = "sub-label";
    note.textContent = t("agent_connect_error");
    list.appendChild(note);

    agentConnectState = "failed";
    agentConnectErrorDetail = err instanceof Error ? err.message : String(err);
    updateAgentConnectResultUI();
  }
}

function renderAgentHarnessList(harnesses: AgentHarnessStatusEntry[]): void {
  const list = document.getElementById("agent-harness-list");
  if (!list) return;
  list.textContent = "";
  for (const entry of harnesses) {
    const row = document.createElement("div");
    row.className = "agent-harness-row";

    const name = document.createElement("span");
    name.className = "agent-harness-name";
    name.textContent = entry.label;

    const state = document.createElement("span");
    state.className = "agent-harness-state";
    if (entry.configured) {
      state.classList.add("connected");
      state.textContent = t("agent_status_connected");
    } else if (entry.installed) {
      state.classList.add("installed");
      state.textContent = t("agent_status_installed");
    } else {
      state.textContent = t("agent_status_not_installed");
    }
    if (entry.configPath) state.title = entry.configPath;

    row.append(name, state);

    // Connect stays available for already-connected hosts too — it refreshes
    // the global skill and companion extension idempotently.
    if (entry.installed || entry.configured) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn secondary-btn btn-sm";
      btn.textContent = t("btn_agent_connect");
      btn.addEventListener("click", () => {
        void connectAgentHarness(entry.harness);
      });
      row.appendChild(btn);
    }
    list.appendChild(row);
  }
}

async function connectAgentHarness(harness?: string): Promise<void> {
  if (agentConnectState === "running") return;
  agentConnectState = "running";
  agentConnectErrorDetail = "";
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "#agent-harness-list button, #btn-agents-connect-all",
  );
  for (const button of buttons) button.disabled = true;
  updateAgentConnectResultUI();

  try {
    const payload = await runBridge<AgentConnectPayload>(
      "agent-connect",
      harness ? ["--harness", harness] : [],
    );
    if ((payload.detected ?? []).length === 0) {
      agentConnectState = "success";
      agentConnectErrorDetail = t("agent_connect_none");
    } else if (payload.success) {
      const okCount = (payload.results ?? []).filter((r) => !r.error).length;
      agentConnectState = "success";
      agentConnectErrorDetail = tf("agent_connect_done", { n: okCount });
    } else {
      const failed = (payload.results ?? []).filter((r) => r.error);
      agentConnectState = "failed";
      agentConnectErrorDetail = failed.length
        ? `${t("agent_connect_error")} (${failed.map((r) => `${r.label}: ${r.error}`).join(", ")})`
        : t("agent_connect_error");
      console.warn("agent-connect errors:", failed);
    }
  } catch (err) {
    console.warn("agent-connect failed:", err);
    agentConnectState = "failed";
    agentConnectErrorDetail = err instanceof Error ? err.message : String(err);
  } finally {
    for (const button of buttons) button.disabled = false;
    updateAgentConnectResultUI();
    void loadAgentHarnessStatus();
  }
}

async function runAgentAutoConnectOnce(): Promise<void> {
  if (agentConnectState === "running") return;
  agentConnectState = "running";
  updateAgentConnectResultUI();
  try {
    const payload = await runBridge<AgentConnectPayload>("agent-connect", ["--auto-once"]);
    if (payload.skipped) {
      agentConnectState = "success";
      agentConnectErrorDetail = "";
    } else if ((payload.detected ?? []).length === 0) {
      agentConnectState = "success";
      agentConnectErrorDetail = t("agent_connect_none");
    } else if (payload.success) {
      const okCount = (payload.results ?? []).filter((r) => !r.error).length;
      agentConnectState = "success";
      agentConnectErrorDetail = tf("agent_connect_done", { n: okCount });
    } else {
      const failed = (payload.results ?? []).filter((r) => r.error);
      agentConnectState = "failed";
      agentConnectErrorDetail = failed.length
        ? `${t("agent_connect_error")} (${failed.map((r) => `${r.label}: ${r.error}`).join(", ")})`
        : t("agent_connect_error");
    }
  } catch (err) {
    console.warn("agent auto-connect failed:", err);
    agentConnectState = "failed";
    agentConnectErrorDetail = err instanceof Error ? err.message : String(err);
  } finally {
    updateAgentConnectResultUI();
  }
}

function aiConfigStatusEl(): HTMLElement | null {
  return document.getElementById("ai-config-status");
}

function capabilityLabel(cap: ModelCapability): string {
  switch (cap) {
    case "text":
      return t("model_cap_text");
    case "embedding":
      return t("model_cap_embedding");
    case "image":
      return t("model_cap_image");
    case "video":
      return t("model_cap_video");
    case "stt":
      return t("model_cap_stt");
    default:
      return t("model_cap_tts");
  }
}

// Capabilities exposed in the Settings UI. stt/tts joined the list in 0.24.0:
// voice mode's cloud tier reads `capabilities.stt`/`.tts`, and `validateModelSave`
// intersects what the learner ticked with what the probe detected — so a
// capability the editor never offers can never be stored, and a correctly
// detected Whisper endpoint would sit there permanently unusable. `video` stays
// out until something consumes it (ADR 2026-07-12, ADR 2026-07-31).
const UI_CAPABILITIES: ModelCapability[] = [
  "text",
  "embedding",
  "image",
  "stt",
  "tts",
];

async function loadModelRegistry(): Promise<void> {
  const status = aiConfigStatusEl();
  if (status) status.textContent = t("model_loading");
  try {
    const response = await runBridge<{ models: ModelRow[] }>("model-list");
    modelRegistry = response.models ?? [];
    renderModelTable();
    if (status) status.textContent = "";
  } catch (err) {
    if (status) {
      status.textContent = tf("model_load_failed", {
        message: errorMessage(err),
      });
    }
  }
}

function renderModelTable(): void {
  const list = document.getElementById("ai-provider-list");
  // The registry order IS the fallback order now; the old role-binding block is
  // retired (ADR 2026-07-12).
  const roleContainer = document.getElementById("ai-role-bindings");
  if (roleContainer) roleContainer.replaceChildren();
  if (!list) return;
  list.replaceChildren();

  if (modelRegistry.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ai-provider-meta";
    empty.textContent = t("model_empty");
    list.appendChild(empty);
    return;
  }

  const ordered = [...modelRegistry].sort((a, b) => a.order - b.order);
  ordered.forEach((row, index) => {
    list.appendChild(createModelRow(row, index, ordered.length));
  });
}

function iconButton(symbol: string, aria: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-sm ai-model-icon-btn";
  button.textContent = symbol;
  button.setAttribute("aria-label", aria);
  button.title = aria;
  return button;
}

function textButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-sm";
  button.textContent = label;
  return button;
}

function isAgentModel(row: ModelRow): boolean {
  return row.transport === "agent";
}

function createModelRow(
  row: ModelRow,
  index: number,
  total: number,
): HTMLElement {
  const el = document.createElement("div");
  el.className = "ai-model-row";
  const agent = isAgentModel(row);

  const header = document.createElement("div");
  header.className = "ai-model-row-head";
  const title = document.createElement("span");
  title.className = "ai-model-label";
  title.textContent = row.label;
  const badge = document.createElement("span");
  if (agent) {
    badge.className = "ai-model-badge agent";
    badge.textContent = t("model_agent_badge");
  } else {
    badge.className = row.local
      ? "ai-model-badge local"
      : "ai-model-badge cloud";
    badge.textContent = row.local
      ? t("model_local_badge")
      : t("model_cloud_badge");
  }
  header.append(title, badge);

  const meta = document.createElement("p");
  meta.className = "ai-provider-meta";
  if (agent) {
    const modelId = row.model?.startsWith("agent:") ? "—" : row.model || "—";
    meta.textContent = row.effort
      ? tf("model_agent_meta_with_effort", {
          harness: row.agentHarness || "—",
          model: modelId,
          effort: row.effort,
        })
      : tf("model_agent_meta_with_model", {
          harness: row.agentHarness || "—",
          model: modelId,
        });
  } else {
    meta.textContent = `${row.model} · ${row.url}`;
  }

  const caps = document.createElement("div");
  caps.className = "ai-model-caps";
  for (const cap of UI_CAPABILITIES) {
    // Agent entries: text always; image only when the harness is multimodal
    // (e.g. Antigravity/Gemini). Embedding is never agent-backed.
    if (agent && cap === "embedding") continue;
    if (agent && cap === "image" && !row.detectedCapabilities.image) continue;
    const label = document.createElement("label");
    label.className = "ai-model-cap";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = row.capabilities[cap];
    // The ceiling: only capabilities a probe detected can be enabled.
    box.disabled = !row.detectedCapabilities[cap];
    box.addEventListener("change", () => {
      void toggleCapability(row, cap, box.checked);
    });
    const text = document.createElement("span");
    text.textContent = capabilityLabel(cap);
    label.append(box, text);
    if (!row.detectedCapabilities[cap]) {
      label.title = agent
        ? t("model_agent_cap_undetected")
        : t("model_cap_undetected");
    }
    caps.append(label);
  }

  const statusChip = document.createElement("span");
  statusChip.className = "ai-model-status";
  if (agent) {
    if (row.detectedCapabilities.text) {
      statusChip.textContent = t("model_agent_status_ready");
    } else if (row.probedAt) {
      statusChip.textContent = t("model_agent_status_offline");
      statusChip.classList.add("warn");
    } else {
      statusChip.textContent = t("model_status_unprobed");
    }
  } else if (row.keyState === "missing") {
    statusChip.textContent = t("model_status_key_missing");
    statusChip.classList.add("warn");
  } else if (row.probedAt) {
    statusChip.textContent = t("model_status_probed");
  } else {
    statusChip.textContent = t("model_status_unprobed");
  }

  const actions = document.createElement("div");
  actions.className = "ai-model-actions";
  const upButton = iconButton("↑", t("model_btn_up"));
  upButton.disabled = index === 0;
  upButton.addEventListener("click", () => void moveModel(row.id, -1));
  const downButton = iconButton("↓", t("model_btn_down"));
  downButton.disabled = index === total - 1;
  downButton.addEventListener("click", () => void moveModel(row.id, 1));
  const reprobeButton = textButton(t("model_btn_reprobe"));
  reprobeButton.addEventListener("click", () => void reprobeModel(row.id));
  const editButton = textButton(t("model_btn_edit"));
  editButton.addEventListener("click", () => void showModelForm(row.id));
  const removeButton = textButton(t("model_btn_remove"));
  removeButton.classList.add("danger");
  removeButton.addEventListener("click", () => void removeModel(row));
  actions.append(upButton, downButton, reprobeButton, editButton, removeButton);

  el.append(header, meta, caps, statusChip, actions);
  return el;
}

async function toggleCapability(
  row: ModelRow,
  cap: ModelCapability,
  checked: boolean,
): Promise<void> {
  const status = aiConfigStatusEl();
  const capabilities = { ...row.capabilities, [cap]: checked };
  try {
    await runBridge("model-set-capabilities", [
      "--id",
      row.id,
      "--capabilities",
      JSON.stringify(capabilities),
    ]);
    await loadModelRegistry();
    await loadProviderStatus();
  } catch (err) {
    if (status) {
      status.textContent = tf("model_save_failed", {
        message: errorMessage(err),
      });
    }
    await loadModelRegistry();
  }
}

async function moveModel(id: string, delta: number): Promise<void> {
  const ordered = [...modelRegistry].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((m) => m.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= ordered.length) return;
  const ids = ordered.map((m) => m.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  const status = aiConfigStatusEl();
  try {
    await runBridge("model-reorder", ["--ids", JSON.stringify(ids)]);
    await loadModelRegistry();
    await loadProviderStatus();
  } catch (err) {
    if (status) {
      status.textContent = tf("model_save_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function reprobeModel(id: string): Promise<void> {
  const status = aiConfigStatusEl();
  if (status) status.textContent = t("model_reprobing");
  try {
    await runBridge("model-reprobe", ["--id", id]);
    await loadModelRegistry();
    await loadProviderStatus();
    if (status) status.textContent = "";
  } catch (err) {
    if (status) {
      status.textContent = tf("model_save_failed", {
        message: errorMessage(err),
      });
    }
    await loadModelRegistry();
  }
}

async function removeModel(row: ModelRow): Promise<void> {
  if (!window.confirm(tf("model_remove_confirm", { label: row.label }))) return;
  const status = aiConfigStatusEl();
  try {
    await runBridge("model-remove", ["--id", row.id]);
    hideModelForm();
    await loadModelRegistry();
    await loadProviderStatus();
    if (status) status.textContent = tf("model_removed", { label: row.label });
  } catch (err) {
    if (status) {
      status.textContent = tf("model_save_failed", {
        message: errorMessage(err),
      });
    }
  }
}

function hideModelForm(): void {
  editingModelId = null;
  const form = document.getElementById("ai-provider-form");
  if (form) {
    form.classList.add("hidden");
    form.replaceChildren();
  }
}

function modelFieldLabel(
  labelText: string,
  control: HTMLElement,
): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = "settings-field";
  const span = document.createElement("span");
  span.textContent = labelText;
  field.append(span, control);
  return field;
}

type ModelFormKind = "local" | "cloud" | "agent";

function existingModelKind(existing: ModelRow | undefined): ModelFormKind {
  if (!existing) return "local";
  if (isAgentModel(existing)) return "agent";
  return existing.local ? "local" : "cloud";
}

async function loadOutboundAgentHarnesses(): Promise<AgentHarnessListEntry[]> {
  try {
    const res = await runBridge<{ harnesses: AgentHarnessListEntry[] }>(
      "agent-list",
    );
    return (res.harnesses ?? []).filter((h) => h.outboundText);
  } catch {
    // Fallback when agent-list fails: still offer the shipped adapter.
    return [
      {
        id: "claude-code",
        label: "Claude Code",
        kind: "cli",
        detected: false,
        outboundText: true,
      },
    ];
  }
}

async function showModelForm(id?: string): Promise<void> {
  const form = document.getElementById("ai-provider-form");
  if (!form) return;
  editingModelId = id ?? null;
  const existing = id ? modelRegistry.find((m) => m.id === id) : undefined;
  const initialKind = existingModelKind(existing);

  form.classList.remove("hidden");
  form.replaceChildren();

  const title = document.createElement("h3");
  title.textContent = existing
    ? t("model_form_edit_title")
    : t("model_form_add_title");
  form.appendChild(title);

  const kindWrap = document.createElement("div");
  kindWrap.className = "provider-kind-switch";
  kindWrap.setAttribute("role", "radiogroup");

  const radios = new Map<ModelFormKind, HTMLInputElement>();
  for (const kind of ["local", "cloud", "agent"] as ModelFormKind[]) {
    const label = document.createElement("label");
    label.className = "provider-kind-option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "ai-model-kind";
    radio.value = kind;
    radio.checked = initialKind === kind;
    const text = document.createElement("span");
    text.textContent =
      kind === "local"
        ? t("model_kind_local")
        : kind === "cloud"
          ? t("model_kind_cloud")
          : t("model_kind_agent");
    label.append(radio, text);
    kindWrap.append(label);
    radios.set(kind, radio);
  }

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.value = existing?.label ?? "";
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.value = existing?.url ?? "";
  const modelInput = document.createElement("input");
  modelInput.type = "text";
  modelInput.value =
    existing?.model && !existing.model.startsWith("agent:")
      ? existing.model
      : "";
  const keyInput = document.createElement("input");
  keyInput.type = "password";
  keyInput.autocomplete = "off";
  keyInput.placeholder =
    existing?.keyState === "set" ? t("model_key_set_placeholder") : "";

  const harnessSelect = document.createElement("select");
  harnessSelect.className = "settings-select";
  const harnesses = await loadOutboundAgentHarnesses();
  for (const h of harnesses) {
    const opt = document.createElement("option");
    opt.value = h.id;
    const mark = h.detected ? "" : ` (${t("model_agent_harness_missing")})`;
    opt.textContent = `${h.label}${mark}`;
    harnessSelect.appendChild(opt);
  }
  if (existing?.agentHarness) {
    harnessSelect.value = existing.agentHarness;
  } else {
    const preferred = harnesses.find((h) => h.detected) ?? harnesses[0];
    if (preferred) harnessSelect.value = preferred.id;
  }
  if (harnesses.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = t("model_agent_harness_none");
    harnessSelect.appendChild(opt);
  }

  // The endpoint's own list of models, offered as suggestions on the model
  // field. A datalist rather than a dropdown: an endpoint that serves no
  // catalog (most local runners) must still accept a typed id, and so must a
  // model published after this build. Typing stays possible; guessing stops
  // being necessary.
  const modelCatalog = document.createElement("datalist");
  modelCatalog.id = "model-catalog-options";
  modelInput.setAttribute("list", modelCatalog.id);

  let catalogKey = "";
  const loadModelCatalog = async (): Promise<void> => {
    const url = urlInput.value.trim();
    const key = keyInput.value.trim();
    const signature = `${url} ${key} ${existing?.apiKeyRef ?? ""}`;
    if (!url || signature === catalogKey) return;
    catalogKey = signature;
    modelCatalog.replaceChildren();
    try {
      const args = ["--url", url];
      if (key) args.push("--key", key);
      else if (existing?.apiKeyRef) args.push("--key-ref", existing.apiKeyRef);
      const result = await runBridge<{ models?: string[] }>(
        "model-catalog",
        args,
      );
      for (const id of result?.models ?? []) {
        const option = document.createElement("option");
        option.value = id;
        modelCatalog.appendChild(option);
      }
    } catch {
      // No catalog is a normal state, not an error — the field still accepts
      // anything typed, exactly as before.
      catalogKey = "";
    }
  };

  urlInput.addEventListener("change", () => void loadModelCatalog());
  keyInput.addEventListener("change", () => void loadModelCatalog());
  modelInput.addEventListener("focus", () => void loadModelCatalog());

  const labelField = modelFieldLabel(t("model_field_label"), labelInput);
  const urlField = modelFieldLabel(t("model_field_url"), urlInput);
  const modelField = modelFieldLabel(t("model_field_model"), modelInput);
  modelField.appendChild(modelCatalog);
  const keyField = modelFieldLabel(t("model_field_key"), keyInput);
  const harnessField = modelFieldLabel(
    t("model_field_harness"),
    harnessSelect,
  );

  // Effort is mainly for Copilot (and future harnesses that accept --effort).
  // "auto" stores no value so the adapter picks from the model id.
  const effortSelect = document.createElement("select");
  effortSelect.className = "settings-select";
  const effortLevels = [
    "auto",
    "low",
    "medium",
    "high",
    "minimal",
    "xhigh",
    "max",
    "none",
  ] as const;
  const effortLabels: Record<(typeof effortLevels)[number], string> = {
    auto: t("model_effort_auto"),
    low: t("model_effort_low"),
    medium: t("model_effort_medium"),
    high: t("model_effort_high"),
    minimal: t("model_effort_minimal"),
    xhigh: t("model_effort_xhigh"),
    max: t("model_effort_max"),
    none: t("model_effort_none"),
  };
  for (const level of effortLevels) {
    const opt = document.createElement("option");
    opt.value = level;
    opt.textContent = effortLabels[level];
    effortSelect.appendChild(opt);
  }
  effortSelect.value = existing?.effort ?? "auto";
  const effortField = modelFieldLabel(t("model_field_effort"), effortSelect);

  const agentHint = document.createElement("p");
  agentHint.className = "ai-provider-hint";
  agentHint.textContent = t("model_agent_hint");

  const capsWrap = document.createElement("div");
  capsWrap.className = "ai-model-caps";
  const capBoxes = new Map<ModelCapability, HTMLInputElement>();
  for (const cap of UI_CAPABILITIES) {
    const label = document.createElement("label");
    label.className = "ai-model-cap";
    label.dataset.cap = cap;
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = existing?.capabilities[cap] ?? cap === "text";
    const text = document.createElement("span");
    text.textContent = capabilityLabel(cap);
    label.append(box, text);
    capsWrap.append(label);
    capBoxes.set(cap, box);
  }
  const capHint = document.createElement("p");
  capHint.className = "ai-provider-hint";
  capHint.textContent = t("model_cap_hint");

  const grid = document.createElement("div");
  grid.className = "ai-provider-form-grid";
  grid.append(
    labelField,
    urlField,
    modelField,
    keyField,
    harnessField,
    effortField,
  );

  const selectedKind = (): ModelFormKind => {
    for (const [kind, radio] of radios) {
      if (radio.checked) return kind;
    }
    return "local";
  };

  const syncAgentModelDefault = (force: boolean): void => {
    const selected = harnesses.find((h) => h.id === harnessSelect.value);
    const def = selected?.defaultModel ?? "";
    modelInput.placeholder = def
      ? tf("model_agent_model_placeholder", { model: def })
      : t("model_field_model");
    // Prefill when adding, or when the user clears the field / switches harness.
    if (force || !modelInput.value.trim()) {
      if (def) modelInput.value = def;
    }
  };

  const syncKindVisibility = (): void => {
    const kind = selectedKind();
    const isAgent = kind === "agent";
    const isLocal = kind === "local";
    urlField.classList.toggle("hidden", isAgent);
    // Model id stays visible for agent — it's the harness model to call.
    modelField.classList.toggle("hidden", false);
    keyField.classList.toggle("hidden", isAgent || isLocal);
    harnessField.classList.toggle("hidden", !isAgent);
    // Effort applies to agent harnesses that support it (e.g. Copilot).
    effortField.classList.toggle("hidden", !isAgent);
    agentHint.classList.toggle("hidden", !isAgent);
    // Agent: text always; image when the selected harness adapter is multimodal.
    // Embedding is never agent-backed.
    const harnessMeta = harnesses.find((h) => h.id === harnessSelect.value);
    const agentImageOk = isAgent && harnessMeta?.outboundImage === true;
    for (const cap of UI_CAPABILITIES) {
      const label = capsWrap.querySelector(
        `label[data-cap="${cap}"]`,
      ) as HTMLLabelElement | null;
      if (!label) continue;
      if (isAgent) {
        const show = cap === "text" || (cap === "image" && agentImageOk);
        label.classList.toggle("hidden", !show);
        const box = capBoxes.get(cap);
        if (box && cap === "text") box.checked = true;
        if (box && cap === "image" && agentImageOk && !editingModelId) {
          box.checked = true;
        }
      } else {
        label.classList.remove("hidden");
      }
    }
    capHint.textContent = isAgent
      ? agentImageOk
        ? t("model_agent_cap_hint_multimodal")
        : t("model_agent_cap_hint")
      : t("model_cap_hint");
    // Default label / model from harness when adding a new agent model.
    if (isAgent) {
      const selected = harnesses.find((h) => h.id === harnessSelect.value);
      if (selected && !editingModelId && !labelInput.value.trim()) {
        labelInput.placeholder = selected.label;
      }
      syncAgentModelDefault(!editingModelId);
    }
  };

  for (const radio of radios.values()) {
    radio.addEventListener("change", syncKindVisibility);
  }
  harnessSelect.addEventListener("change", () => {
    if (selectedKind() === "agent") {
      const selected = harnesses.find((h) => h.id === harnessSelect.value);
      if (selected && !editingModelId && !labelInput.value.trim()) {
        labelInput.placeholder = selected.label;
      }
      // Switching harness always offers the new cheap default.
      syncAgentModelDefault(true);
    }
    syncKindVisibility();
  });
  // Initial agent default when opening "add" form already on agent, or after
  // selecting agent radio — applied inside syncKindVisibility.
  if (!editingModelId && existingModelKind(existing) === "agent") {
    syncAgentModelDefault(true);
  } else if (!editingModelId && !existing) {
    // Default kind is local; model field will be filled when Agent is chosen.
  }
  syncKindVisibility();

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "btn primary-btn btn-sm";
  saveButton.textContent = t("model_btn_save");
  saveButton.addEventListener("click", () => {
    // One submit at a time: the agent probe can take seconds, and a second
    // click used to fire a second model-upsert that appended another row.
    if (saveButton.disabled) return;
    saveButton.disabled = true;
    const kind = selectedKind();
    const capabilities: Record<string, boolean> = {};
    for (const [cap, box] of capBoxes) {
      if (kind === "agent") {
        // Agent: text + optional image (multimodal harnesses); never embedding.
        capabilities[cap] =
          cap === "text" ? true : cap === "image" ? box.checked : false;
      } else {
        capabilities[cap] = box.checked;
      }
    }
    void saveModelForm({
      id: editingModelId ?? undefined,
      kind,
      label: labelInput.value.trim(),
      url: urlInput.value.trim(),
      model: modelInput.value.trim(),
      agentHarness: harnessSelect.value,
      effort: effortSelect.value,
      key: keyInput.value.trim(),
      existingKeyRef: existing?.apiKeyRef,
      capabilities,
    }).finally(() => {
      // The form is torn down on success; re-enabling only matters when it
      // stayed open because the save failed or a field was rejected.
      saveButton.disabled = false;
    });
  });
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn secondary-btn btn-sm";
  cancelButton.textContent = t("model_btn_cancel");
  cancelButton.addEventListener("click", hideModelForm);
  actions.append(saveButton, cancelButton);

  form.append(kindWrap, grid, agentHint, capsWrap, capHint, actions);
}

interface ModelFormData {
  id?: string;
  kind: ModelFormKind;
  label: string;
  url: string;
  model: string;
  agentHarness?: string;
  /** "auto" | effort level — auto clears a stored override. */
  effort?: string;
  key: string;
  existingKeyRef?: string;
  capabilities: Record<string, boolean>;
}

async function saveModelForm(data: ModelFormData): Promise<void> {
  const status = aiConfigStatusEl();

  if (data.kind === "agent") {
    if (!data.agentHarness) {
      if (status) status.textContent = t("model_agent_missing_harness");
      return;
    }
    const harnesses = await loadOutboundAgentHarnesses();
    const harnessMeta = harnesses.find((h) => h.id === data.agentHarness);
    const label = data.label || harnessMeta?.label || data.agentHarness;
    const args = [
      "--transport",
      "agent",
      "--agent-harness",
      data.agentHarness,
      "--label",
      label,
      "--capabilities",
      JSON.stringify({
        text: true,
        image: data.capabilities.image === true,
      }),
    ];
    if (data.model) {
      args.push("--model", data.model);
    }
    // Always send effort so "auto" can clear a previous override on edit.
    if (data.effort) {
      args.push("--effort", data.effort);
    }
    if (data.id) args.push("--id", data.id);
    try {
      await runBridge("model-upsert", args);
      hideModelForm();
      await loadModelRegistry();
      await loadProviderStatus();
      if (status) status.textContent = tf("model_saved", { label });
    } catch (err) {
      if (status) {
        status.textContent = tf("model_save_failed", {
          message: errorMessage(err),
        });
      }
    }
    return;
  }

  if (!data.url || !data.model) {
    if (status) status.textContent = t("model_missing_fields");
    return;
  }
  const label = data.label || data.model;
  const isLocal = data.kind === "local";

  let keyRef = data.existingKeyRef;
  if (!isLocal && data.key) {
    keyRef =
      keyRef ??
      `model-key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await runBridge("provider-set-key", ["--ref", keyRef, "--key", data.key]);
    } catch (err) {
      if (status) {
        status.textContent = tf("model_save_failed", {
          message: errorMessage(err),
        });
      }
      return;
    }
  }

  const args = [
    "--transport",
    "http",
    "--label",
    label,
    "--url",
    data.url,
    "--model",
    data.model,
    "--capabilities",
    JSON.stringify(data.capabilities),
    ...(isLocal ? ["--local"] : ["--no-local"]),
  ];
  if (data.id) args.push("--id", data.id);
  if (!isLocal && keyRef) args.push("--key-ref", keyRef);

  try {
    await runBridge("model-upsert", args);
    hideModelForm();
    await loadModelRegistry();
    await loadProviderStatus();
    if (status) status.textContent = tf("model_saved", { label });
  } catch (err) {
    if (status) {
      status.textContent = tf("model_save_failed", {
        message: errorMessage(err),
      });
    }
  }
}

function toggleAiConfigEditor(): void {
  const editor = document.getElementById("ai-config-editor");
  const button = document.getElementById("btn-toggle-ai-config");
  if (!editor || !button) return;
  aiConfigEditorOpen = !aiConfigEditorOpen;
  editor.classList.toggle("hidden", !aiConfigEditorOpen);
  button.textContent = aiConfigEditorOpen
    ? t("btn_ai_config_close")
    : t("btn_ai_config_open");
  if (aiConfigEditorOpen) void loadModelRegistry();
}

interface InstallRepairReport {
  version: string;
  skipped: boolean;
  cli: {
    status: "installed" | "refreshed" | "ok" | "external" | "skipped" | "error";
    shimPath: string;
    onPath: boolean;
    needsNewTerminal: boolean;
    detail?: string;
  } | null;
  workspaces: {
    provisioned: number;
    missing: number;
    relinked: number;
    error?: string;
  } | null;
  agents: {
    success: boolean;
    detected: string[];
    connected: number;
    companion: string | null;
    errors: string[];
  } | null;
}

function installRepairSummary(report: InstallRepairReport): string {
  const parts: string[] = [];

  const cli = report.cli;
  if (cli) {
    if (cli.status === "error") {
      parts.push(tf("repair_cli_error", { detail: cli.detail ?? "" }));
    } else if (cli.needsNewTerminal) {
      parts.push(t("repair_cli_new_terminal"));
    } else if (cli.status === "installed" || cli.status === "refreshed") {
      parts.push(t("repair_cli_fixed"));
    } else {
      parts.push(t("repair_cli_ok"));
    }
  }

  const workspaces = report.workspaces;
  if (workspaces) {
    if (workspaces.error) {
      parts.push(tf("repair_skills_error", { detail: workspaces.error }));
    } else if (workspaces.relinked > 0) {
      parts.push(tf("repair_skills_fixed", { n: String(workspaces.relinked) }));
    } else {
      parts.push(t("repair_skills_ok"));
    }
  }

  const agents = report.agents;
  if (agents) {
    if (agents.errors.length > 0) {
      parts.push(tf("repair_agents_error", { detail: agents.errors.join("; ") }));
    } else if (agents.companion === "installed" || agents.companion === "updated") {
      parts.push(t("repair_companion_updated"));
    } else {
      parts.push(t("repair_agents_ok"));
    }
  }

  return tf("repair_done", { details: parts.join(" · ") });
}

/** Run the bridge verify/repair pass and return a localized one-line summary. */
async function repairInstallation(): Promise<string> {
  try {
    const report = await runBridge<InstallRepairReport>("install-repair");
    return installRepairSummary(report);
  } catch (err) {
    return tf("repair_failed", { message: errorMessage(err) });
  }
}

/**
 * Post-update (and first-run) self-repair: refresh the CLI shim, workspace
 * skill links, and the ZAM Companion extensions exactly once per app version.
 * Fire-and-forget on startup so an auto-update also updates the Companion in
 * VS Code after the restart.
 */
function repairInstallationOnVersionChange(): void {
  void runBridge<InstallRepairReport>("install-repair", [
    "--if-version-changed",
  ]).catch((err) => {
    console.warn("install-repair on startup failed:", err);
  });
}

async function checkDesktopUpdates(): Promise<void> {
  const status = document.getElementById("update-status");
  const button = document.getElementById("btn-check-updates") as HTMLButtonElement | null;
  if (status) status.textContent = t("update_checking");
  if (button) button.disabled = true;
  try {
    const update = await checkForUpdate();
    if (!update) {
      // Already on the latest version: use the click to verify and repair the
      // rest of the installation (CLI shim + PATH, workspace skill links,
      // agent configs, ZAM Companion) instead of just saying "up to date".
      if (status) status.textContent = t("update_none_verifying");
      const summary = await repairInstallation();
      if (status) status.textContent = summary;
      return;
    }

    // Linux ships as .deb/.rpm, which the Tauri updater cannot install in
    // place — it only supports AppImage. Send the user straight to the new
    // release's assets instead of attempting (and failing) an auto-install.
    const os = await invoke<string>("current_os");
    if (os === "linux") {
      if (status) {
        status.textContent = tf("update_available_manual", { version: update.version });
      }
      await openUrl(`${ZAM_RELEASES_URL}/tag/v${update.version}`);
      return;
    }

    // macOS + Windows: download, install, and relaunch into the new version.
    let total = 0;
    let downloaded = 0;
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          total = event.data.contentLength ?? 0;
          if (status) {
            status.textContent = tf("update_downloading", { version: update.version });
          }
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (status && total > 0) {
            const pct = Math.min(100, Math.round((downloaded / total) * 100));
            status.textContent = tf("update_progress", {
              version: update.version,
              pct: String(pct),
            });
          }
          break;
        case "Finished":
          if (status) status.textContent = t("update_installing");
          break;
      }
    });

    if (status) status.textContent = t("update_restarting");
    await invoke("restart_app");
  } catch (err) {
    if (status) {
      status.textContent = tf("update_failed", { message: errorMessage(err) });
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function openReleasesPage(): Promise<void> {
  try {
    await openUrl(ZAM_RELEASES_URL);
  } catch (err) {
    const status = document.getElementById("update-status");
    if (status) {
      status.textContent = tf("release_link_failed", { message: errorMessage(err) });
    }
  }
}

async function listObserverWindows(): Promise<void> {
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const analyzeButton = document.getElementById("btn-observer-analyze") as HTMLButtonElement;
  const status = document.getElementById("observer-status")!;
  const preview = document.getElementById("observer-report-preview")!;

  status.textContent = t("observer_loading");
  preview.classList.add("hidden");
  analyzeButton.disabled = true;
  select.disabled = true;
  select.innerHTML = "";

  try {
    const raw = await invoke<string>("list_zam_observer_windows");
    observerWindows = JSON.parse(raw) as ObserverWindowInfo[];

    if (observerWindows.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("observer_empty");
      select.appendChild(option);
      status.textContent = t("observer_empty");
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("observer_select_placeholder");
    select.appendChild(placeholder);

    for (const windowInfo of observerWindows) {
      const option = document.createElement("option");
      const processName = windowInfo.processName ?? `pid-${windowInfo.processId}`;
      option.value = String(windowInfo.hwnd);
      option.textContent = `${windowInfo.title} (${processName}, ${windowInfo.width}x${windowInfo.height})`;
      if (observerWindowPrivacyPaused(windowInfo)) {
        const reason = observerPrivacyReasonText(windowInfo);
        option.textContent += ` - ${t("observer_privacy_option")}`;
        option.title = tf("observer_privacy_paused", { reason });
      }
      select.appendChild(option);
    }

    status.textContent = t("observer_idle");
  } catch (err) {
    observerWindows = [];
    status.textContent = tf("observer_error", { message: errorMessage(err) });
  } finally {
    syncObserverControls();
  }
}

function selectedObserverWindow(): ObserverWindowInfo | null {
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const hwnd = Number(select.value);
  if (!Number.isFinite(hwnd) || hwnd <= 0) return null;
  return observerWindows.find((windowInfo) => windowInfo.hwnd === hwnd) ?? null;
}

function observerWindowPrivacyPaused(windowInfo: ObserverWindowInfo | null): boolean {
  return windowInfo?.privacy?.action === "privacy-pause";
}

function observerPrivacyReasonText(windowInfo: ObserverWindowInfo): string {
  const reasons = windowInfo.privacy?.reasons ?? [];
  const labels = OBSERVER_PRIVACY_REASON_LABELS[currentLocale] ?? OBSERVER_PRIVACY_REASON_LABELS.en;
  return reasons.map((reason) => labels[reason] ?? reason).join(", ") || "privacy filter";
}

function updateObserverSelection(): void {
  const status = document.getElementById("observer-status")!;
  const selected = selectedObserverWindow();
  syncObserverControls();
  if (selected && observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
  } else {
    status.textContent = selected
      ? tf("observer_ready", { title: selected.title })
      : t("observer_idle");
  }
}

function syncObserverControls(): void {
  const selected = selectedObserverWindow();
  const refreshButton = document.getElementById("btn-observer-refresh") as HTMLButtonElement;
  const analyzeButton = document.getElementById("btn-observer-analyze") as HTMLButtonElement;
  const cancelButton = document.getElementById("btn-observer-cancel") as HTMLButtonElement;
  const loopStartButton = document.getElementById("btn-observer-loop-start") as HTMLButtonElement;
  const loopStopButton = document.getElementById("btn-observer-loop-stop") as HTMLButtonElement;
  const watchStartButton = document.getElementById("btn-observer-watch-start") as HTMLButtonElement;
  const watchStopButton = document.getElementById("btn-observer-watch-stop") as HTMLButtonElement;
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const locked = observerAnalyzeInProgress || observerLoopRunning || observerWatchRunning;
  const privacyPaused = observerWindowPrivacyPaused(selected);

  refreshButton.disabled = locked;
  select.disabled = locked;
  analyzeButton.disabled = locked || selected === null || privacyPaused;
  cancelButton.classList.toggle("hidden", !observerAnalyzeInProgress);
  cancelButton.disabled = !observerAnalyzeInProgress;
  loopStartButton.disabled = locked || selected === null || privacyPaused;
  loopStopButton.classList.toggle("hidden", !observerLoopRunning);
  loopStopButton.disabled = !observerLoopRunning;
  watchStartButton.disabled = locked || selected === null || privacyPaused;
  watchStopButton.classList.toggle("hidden", !observerWatchRunning);
  watchStopButton.disabled = !observerWatchRunning;
}

function setObserverAnalysisBusy(busy: boolean): void {
  observerAnalyzeInProgress = busy;
  syncObserverControls();
}

async function analyzeSelectedObserverWindow(): Promise<boolean> {
  if (observerAnalyzeInProgress) return false;
  const selected = selectedObserverWindow();
  if (!selected) return false;

  const status = document.getElementById("observer-status")!;
  const preview = document.getElementById("observer-report-preview")!;
  if (observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
    return false;
  }
  const requestId = observerAnalysisRequestId + 1;
  observerAnalysisRequestId = requestId;

  setObserverAnalysisBusy(true);
  status.textContent = t("observer_vision_checking");
  preview.classList.add("hidden");

  try {
    const visionReady = await ensureObserverVisionReady();
    if (!visionReady || requestId !== observerAnalysisRequestId) return false;

    status.textContent = t("observer_analyzing");
    const sessionId = await getObserverSessionId();
    const observedFrom = new Date().toISOString();
    const sequence = await nextObserverReportSequence();
    const snapshotName = `${String(sequence).padStart(6, "0")}.png`;
    const snapshotDir = await joinPath(await appDataDir(), "observer", sessionId);
    const snapshotPath = await joinPath(snapshotDir, snapshotName);
    // Portable, non-leaking evidence reference for the persisted report; the
    // absolute path stays in --image only.
    const evidenceRef = `${sessionId}/${snapshotName}`;

    await invoke<string>("snapshot_zam_observer_window", {
      hwnd: String(selected.hwnd),
      output: snapshotPath,
    });
    if (requestId !== observerAnalysisRequestId) return false;

    const observedTo = new Date().toISOString();
    const report = await runBridge<UiObservationReport>("observe-ui-snapshot", [
      "--session",
      sessionId,
      "--sequence",
      String(sequence),
      "--image",
      snapshotPath,
      "--observed-from",
      observedFrom,
      "--observed-to",
      observedTo,
      "--process-name",
      selected.processName ?? `pid-${selected.processId}`,
      "--process-id",
      String(selected.processId),
      "--window-title",
      selected.title,
      "--evidence-ref",
      evidenceRef,
      "--write-log",
    ]);
    if (requestId !== observerAnalysisRequestId) return false;

    observerSequence = sequence;
    await loadObserverReports({ updateStatus: false });
    status.textContent = tf("observer_done", {
      confidence: report.confidence.toFixed(2),
    });
    preview.textContent = JSON.stringify(report, null, 2);
    preview.classList.remove("hidden");
    return true;
  } catch (err) {
    if (requestId === observerAnalysisRequestId) {
      status.textContent = tf("observer_error", { message: errorMessage(err) });
    }
    return false;
  } finally {
    if (requestId === observerAnalysisRequestId) {
      setObserverAnalysisBusy(false);
    }
  }
}

async function ensureObserverVisionReady(): Promise<boolean> {
  const status = document.getElementById("observer-status")!;
  const vision = await runBridge<VisionStatus>("check-vision");

  if (!vision.enabled) {
    status.textContent = t("observer_vision_disabled");
    return false;
  }
  if (!vision.online) {
    status.textContent = tf("observer_vision_offline", { url: vision.url });
    return false;
  }
  if (!vision.modelAvailable) {
    status.textContent = tf("observer_vision_model_missing", {
      model: vision.model,
    });
    return false;
  }
  if (vision.warning) {
    status.textContent = vision.warning;
    // Continue anyway — the model might actually support images.
  }

  return true;
}

function cancelObserverAnalysis(): void {
  if (!observerAnalyzeInProgress) return;
  observerAnalysisRequestId++;
  setObserverAnalysisBusy(false);
  document.getElementById("observer-status")!.textContent = t("observer_canceled");
  cancelActiveBridgeRequest();
}

function startObserverLoop(): void {
  if (observerLoopRunning || observerAnalyzeInProgress || !selectedObserverWindow()) return;
  observerLoopRunning = true;
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_running");
  document.getElementById("observer-status")!.textContent = t("observer_loop_running");
  syncObserverControls();
  void runObserverLoopIteration();
}

function stopObserverLoop(): void {
  if (!observerLoopRunning) return;
  observerLoopRunning = false;
  clearObserverLoopTimer();
  if (observerAnalyzeInProgress) {
    cancelObserverAnalysis();
  }
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
  document.getElementById("observer-status")!.textContent = t("observer_loop_stopped");
  syncObserverControls();
}

async function runObserverLoopIteration(): Promise<void> {
  if (!observerLoopRunning) return;

  const success = await analyzeSelectedObserverWindow();
  if (!observerLoopRunning) return;

  if (!success) {
    observerLoopRunning = false;
    document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
    syncObserverControls();
    return;
  }

  const seconds = Math.round(OBSERVER_LOOP_DELAY_MS / 1000);
  document.getElementById("observer-loop-note")!.textContent = tf("observer_loop_waiting", {
    seconds,
  });
  clearObserverLoopTimer();
  observerLoopTimerId = window.setTimeout(() => {
    void runObserverLoopIteration();
  }, OBSERVER_LOOP_DELAY_MS);
}

function clearObserverLoopTimer(): void {
  if (observerLoopTimerId !== null) {
    clearTimeout(observerLoopTimerId);
    observerLoopTimerId = null;
  }
}

// Continuous watch: spawns the unified observer daemon as a background child
// process and polls its lifecycle status (event count, last event, errors).
async function startObserverWatch(): Promise<void> {
  if (observerWatchRunning || observerAnalyzeInProgress || observerLoopRunning) return;
  const selected = selectedObserverWindow();
  if (!selected) return;

  const status = document.getElementById("observer-status")!;
  const note = document.getElementById("observer-watch-note")!;
  if (observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
    return;
  }

  observerWatchRunning = true;
  observerWatchLastEventCount = 0;
  note.textContent = t("observer_watch_starting");
  status.textContent = t("observer_watch_starting");
  syncObserverControls();

  try {
    const task = selected.title.trim() || "Desktop UI observation";
    const sessionId = await ensureUiLearningSession(task);
    // Tauri truncates the reports JSONL on each watch start, so replay
    // sequences begin again at 1. Keep the desktop cursor aligned.
    resetObserverReportState();
    const result = await invoke<ObserverWatchStatus>("start_zam_observer_watch", {
      session: sessionId,
      hwnd: String(selected.hwnd),
      intervalMs: "1000",
    });
    renderObserverWatchStatus(result, selected.title);
    scheduleObserverWatchPoll();
  } catch (error) {
    observerWatchRunning = false;
    const message = tf("observer_watch_error", { message: String(error) });
    note.textContent = message;
    status.textContent = message;
    syncObserverControls();
  }
}

async function stopObserverWatch(): Promise<void> {
  if (!observerWatchRunning) return;
  clearObserverWatchPoll();
  const note = document.getElementById("observer-watch-note")!;
  const status = document.getElementById("observer-status")!;
  note.textContent = t("observer_watch_stopping");
  try {
    await invoke<ObserverWatchStatus>("stop_zam_observer_watch");
  } catch (error) {
    note.textContent = tf("observer_watch_error", { message: String(error) });
  } finally {
    observerWatchRunning = false;
    note.textContent = t("observer_watch_stopped");
    status.textContent = t("observer_watch_stopped");
    syncObserverControls();
  }
}

function scheduleObserverWatchPoll(): void {
  clearObserverWatchPoll();
  observerWatchPollId = window.setTimeout(() => {
    void pollObserverWatchStatus();
  }, OBSERVER_WATCH_POLL_MS);
}

function clearObserverWatchPoll(): void {
  if (observerWatchPollId !== null) {
    clearTimeout(observerWatchPollId);
    observerWatchPollId = null;
  }
}

async function pollObserverWatchStatus(): Promise<void> {
  if (!observerWatchRunning) return;
  try {
    const result = await invoke<ObserverWatchStatus>("status_zam_observer_watch");
    const selected = selectedObserverWindow();
    renderObserverWatchStatus(result, selected?.title);
    if (result.running && result.eventCount > observerWatchLastEventCount) {
      observerWatchLastEventCount = result.eventCount;
      await loadObserverReports({ updateStatus: false });
    }
    if (!result.running) {
      // The watch process exited on its own (sample bound or crash).
      observerWatchRunning = false;
      clearObserverWatchPoll();
      await loadObserverReports({ updateStatus: false });
      syncObserverControls();
      return;
    }
  } catch (error) {
    document.getElementById("observer-watch-note")!.textContent = tf("observer_watch_error", {
      message: String(error),
    });
  }
  if (observerWatchRunning) scheduleObserverWatchPoll();
}

function renderObserverWatchStatus(status: ObserverWatchStatus, fallbackTitle?: string): void {
  const note = document.getElementById("observer-watch-note")!;
  if (status.lastError) {
    note.textContent = tf("observer_watch_error", { message: status.lastError });
    return;
  }
  if (status.running) {
    note.textContent = tf("observer_watch_running", {
      title: fallbackTitle ?? status.session ?? "window",
      count: status.eventCount,
    });
  } else {
    note.textContent = t("observer_watch_stopped");
  }
}

/** Align the in-memory sequence cursor with the persisted observation log. */
async function syncObserverSequenceFromLog(): Promise<void> {
  if (!zamUiSessionId) return;

  try {
    const response = await runBridge<UiObservationsResponse>("observe-ui-watch", [
      "--session",
      zamUiSessionId,
      "--after",
      "0",
      "--limit",
      "10000",
    ]);
    if (response.observations.length === 0) return;

    const maxSequence = Math.max(...response.observations.map((report) => report.sequence));
    observerSequence = Math.max(observerSequence, maxSequence);
    observerReportsAfter = Math.max(observerReportsAfter, maxSequence);
  } catch {
    // Fall back to the in-memory cursor when the bridge is unavailable.
  }
}

async function nextObserverReportSequence(): Promise<number> {
  await syncObserverSequenceFromLog();
  return observerSequence + 1;
}

async function loadObserverReports(
  opts: { updateStatus?: boolean } = {},
): Promise<void> {
  const status = document.getElementById("observer-status")!;

  if (!zamUiSessionId) {
    if (opts.updateStatus) {
      status.textContent = t("observer_idle");
    }
    return;
  }

  try {
    const response = await runBridge<UiObservationsResponse>("observe-ui-watch", [
      "--session",
      zamUiSessionId,
      "--after",
      String(observerReportsAfter),
      "--limit",
      String(OBSERVER_HISTORY_LIMIT),
    ]);

    if (response.observations.length > 0) {
      const known = new Set(observerReports.map((report) => report.sequence));
      for (const report of response.observations) {
        if (!known.has(report.sequence)) observerReports.push(report);
      }
      observerReports.sort((left, right) => left.sequence - right.sequence);
      if (observerReports.length > OBSERVER_HISTORY_LIMIT) {
        observerReports = observerReports.slice(-OBSERVER_HISTORY_LIMIT);
      }
      // Advance the cursor so the next poll only fetches newer reports.
      observerReportsAfter = response.nextSequence ?? observerReportsAfter;
      observerSequence = Math.max(
        observerSequence,
        ...observerReports.map((report) => report.sequence),
      );
    }
    renderObserverHistory();
    if (opts.updateStatus) {
      status.textContent = tf("observer_history_loaded", {
        count: observerReports.length,
      });
    }
  } catch (err) {
    if (opts.updateStatus) {
      status.textContent = tf("observer_error", { message: errorMessage(err) });
    }
  }
}

function renderObserverHistory(): void {
  const list = document.getElementById("observer-history-list");
  if (!list) return;

  list.innerHTML = "";
  if (observerReports.length === 0) {
    const empty = document.createElement("p");
    empty.className = "observer-history-empty";
    empty.textContent = t("observer_history_empty");
    list.appendChild(empty);
    return;
  }

  for (const report of [...observerReports].sort((left, right) => right.sequence - left.sequence)) {
    const card = document.createElement("article");
    card.className = "observer-report-card";

    const meta = document.createElement("div");
    meta.className = "observer-report-meta";
    const processName = report.application.processName;
    const observedAt = new Date(report.observedTo).toLocaleTimeString();
    meta.textContent = `#${report.sequence} · ${report.kind} · ${processName} · ${observedAt} · ${report.confidence.toFixed(2)}`;

    const summary = document.createElement("p");
    summary.className = "observer-report-summary";
    summary.textContent = report.summary;

    card.appendChild(meta);
    card.appendChild(summary);

    if (report.candidateTokens.length > 0) {
      const tokens = document.createElement("div");
      tokens.className = "observer-report-tokens";
      tokens.textContent = report.candidateTokens
        .map((token) => {
          const name = token.title || token.slug;
          return `${name} (${token.confidence.toFixed(2)})`;
        })
        .join(", ");
      card.appendChild(tokens);
    }

    card.addEventListener("click", () => {
      const preview = document.getElementById("observer-report-preview")!;
      preview.textContent = JSON.stringify(report, null, 2);
      preview.classList.remove("hidden");
    });

    list.appendChild(card);
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── VIEW ROUTING ──────────────────────────────────────────────────────────
function setActiveNav(viewId: AppView): void {
  const navByView: Partial<Record<AppView, string>> = {
    "dashboard-view": "nav-dashboard",
    "settings-view": "nav-settings",
    "stats-view": "nav-stats",
    "learning-content-view": "nav-content",
  };
  for (const button of document.querySelectorAll<HTMLButtonElement>(".nav-btn")) {
    const active = button.id === navByView[viewId];
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }
}

// ── STATS VIEW ────────────────────────────────────────────────────────────
type StatsPeriod = "day" | "week" | "month";

interface StatsActivityBucket {
  bucket: string;
  reviewedCards: number;
  studyTimeMs: number;
}

interface StatsActivityResponse {
  userId: string;
  window: number;
  period: StatsPeriod;
  buckets: StatsActivityBucket[];
}

let statsPeriod: StatsPeriod = "day";

/**
 * Zero means the reviews in this bucket predate response-time logging
 * (ADR 2026-08-01 Decision 2) — an em dash says "not measured", where "0s"
 * would claim the learner spent no time on them.
 */
function formatStatsTime(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/** "Fr., 31. Juli" / "KW 31" / "Juli 2026" instead of the raw bucket key. */
function formatStatsBucket(bucket: string, period: StatsPeriod): string {
  return formatActivityBucketLabel(bucket, period, {
    locale: currentLocale,
    weekLabel: (isoWeek) => tf("stats_week_label", { week: isoWeek }),
  });
}

function setStatsPeriod(period: StatsPeriod): void {
  statsPeriod = period;
  for (const candidate of ["day", "week", "month"] as const) {
    document
      .getElementById(`stats-period-${candidate}`)
      ?.classList.toggle("active", candidate === period);
  }
  void loadStatsView();
}

async function loadStatsView(): Promise<void> {
  const container = document.getElementById("stats-activity");
  const summary = document.getElementById("stats-summary");
  if (!container || !summary) return;

  container.innerHTML = "";
  const loading = document.createElement("p");
  loading.className = "stats-loading";
  loading.textContent = t("stats_loading");
  container.appendChild(loading);
  summary.classList.add("hidden");

  let response: StatsActivityResponse;
  try {
    response = await runBridge<StatsActivityResponse>("stats-activity", [
      "--period",
      statsPeriod,
    ]);
  } catch (err) {
    container.innerHTML = "";
    const error = document.createElement("p");
    error.className = "stats-error";
    error.textContent = errorMessage(err);
    container.appendChild(error);
    return;
  }

  // The kernel already cut the series to `window` local periods; the totals
  // are simply the sum over what is drawn.
  const buckets = response.buckets;
  container.innerHTML = "";
  if (buckets.length === 0) {
    summary.classList.add("hidden");
    const empty = document.createElement("p");
    empty.className = "stats-empty";
    empty.textContent = t("stats_empty");
    container.appendChild(empty);
    return;
  }

  const totalCards = buckets.reduce((sum, b) => sum + b.reviewedCards, 0);
  const totalMs = buckets.reduce((sum, b) => sum + b.studyTimeMs, 0);
  summary.classList.remove("hidden");
  summary.innerHTML = "";
  const cards = document.createElement("span");
  cards.className = "stats-summary-item";
  cards.textContent = tf("stats_total_cards", { n: totalCards });
  const time = document.createElement("span");
  time.className = "stats-summary-item";
  time.textContent = tf("stats_total_time", { time: formatStatsTime(totalMs) });
  summary.append(cards, time);

  const maxCards = Math.max(...buckets.map((b) => b.reviewedCards), 1);
  for (const bucket of buckets) {
    const row = document.createElement("div");
    row.className = "stats-row";

    const label = document.createElement("span");
    label.className = "stats-row-label";
    label.textContent = formatStatsBucket(bucket.bucket, response.period);
    label.title = bucket.bucket;

    const bar = document.createElement("span");
    bar.className = "stats-row-bar";
    const fill = document.createElement("span");
    fill.className = "stats-row-fill";
    fill.style.width = `${Math.max(2, Math.round((bucket.reviewedCards / maxCards) * 100))}%`;
    bar.appendChild(fill);

    const count = document.createElement("span");
    count.className = "stats-row-count";
    count.textContent = String(bucket.reviewedCards);

    const timeMs = document.createElement("span");
    timeMs.className = "stats-row-time";
    timeMs.textContent = formatStatsTime(bucket.studyTimeMs);

    row.append(label, bar, count, timeMs);
    container.appendChild(row);
  }
}

async function loadDatabaseStatus(): Promise<void> {
  const status = document.getElementById("database-connection-status");
  const detail = document.getElementById("database-connection-detail");
  const select = document.getElementById(
    "database-user-select",
  ) as HTMLSelectElement | null;
  if (!status || !detail || !select) return;

  status.textContent = t("database_checking");
  detail.textContent = "";
  select.disabled = true;

  try {
    const result = await runBridge<DatabaseStatusResponse>("database-status");
    databaseCurrentUserId = result.userId;
    status.textContent =
      result.target.kind === "local"
        ? t("database_status_local")
        : t("database_status_turso");
    detail.textContent = tf("database_detail", {
      location: result.target.location,
      profile: result.userId ?? t("database_no_profile"),
      count: result.cardCount,
    });

    select.innerHTML = "";
    if (result.users.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("database_no_profile");
      select.appendChild(option);
      return;
    }

    for (const user of result.users) {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = tf("database_profile_option", {
        profile: user.id,
        count: user.cardCount,
      });
      select.appendChild(option);
    }
    select.value = result.userId ?? "";
    select.disabled = false;
  } catch (err) {
    databaseCurrentUserId = null;
    status.textContent = t("database_status_error");
    detail.textContent = errorMessage(err);
    select.innerHTML = `<option value="">${t("database_no_profile")}</option>`;
  }
}

async function selectDatabaseUser(userId: string): Promise<void> {
  const select = document.getElementById(
    "database-user-select",
  ) as HTMLSelectElement | null;
  const status = document.getElementById("setup-status");
  const previousUserId = databaseCurrentUserId;
  if (!select || !userId || userId === previousUserId) return;

  if (!window.confirm(tf("database_profile_switch_confirm", { profile: userId }))) {
    select.value = previousUserId ?? "";
    return;
  }

  select.disabled = true;
  try {
    const result = await runBridge<{
      success: boolean;
      userId: string;
      cardCount: number;
    }>("database-select-user", ["--user", userId]);
    desktopUserId = result.userId;
    databaseCurrentUserId = result.userId;
    if (status) {
      status.textContent = tf("database_profile_switched", {
        profile: result.userId,
        count: result.cardCount,
      });
    }
    await loadDatabaseStatus();
    await loadDashboard();
    updateGraphLearnerFilterUi();
    if (document.getElementById("graph-view")?.classList.contains("active")) {
      await refreshGraphScope();
    }
  } catch (err) {
    select.value = previousUserId ?? "";
    select.disabled = false;
    if (status) status.textContent = errorMessage(err);
  }
}

async function loadSettingsKnowledgeContext(): Promise<void> {
  const select = document.getElementById("device-context-select") as HTMLSelectElement;
  if (!select) return;

  try {
    const listRes = await runBridge<any>("list-knowledge-contexts");
    const contexts = (listRes && listRes.contexts) || [];

    select.innerHTML = `<option value="">${t("lbl_no_context_default")}</option>`;

    contexts.forEach((ctx: any) => {
      const opt = document.createElement("option");
      opt.value = ctx.name;
      opt.textContent = ctx.label ? `${ctx.label} (${ctx.name})` : ctx.name;
      select.appendChild(opt);
    });

    const activeRes = await runBridge<any>("get-active-knowledge-context");
    const active = (activeRes && activeRes.activeContext) || "";
    select.value = active;
  } catch (e) {
    console.error("Failed to load settings knowledge contexts", e);
  }
}

function refreshSettingsData(): void {
  void loadAppVersion();
  void loadWorkspaceList();
  void loadProviderStatus();
  void loadDatabaseStatus();
  void loadSettingsKnowledgeContext();
  void loadAgentHarnessStatus();
  void loadDynamicQuestionSetting();
  if (aiConfigEditorOpen) void loadModelRegistry();
}

// First-run onboarding controller (ADR 2026-07-24). Created once in
// DOMContentLoaded; `showOnboarding` reveals the flow both on the first-run
// gate and from the Settings "Run setup again" action.
let onboardingController: OnboardingController | null = null;

// Persona page data (Phase 1), filled from desktop-bootstrap before the flow
// can open — the kernel's descriptor list plus the persisted (or default
// "private") selection. Read live via getStepContext on each start().
let onboardingPersonas: OnboardingPersona[] = [];
let onboardingPersonaId = "private";
// Model page data (Phase 2): cloud provider descriptors and the copy-only
// local-hardware hint, also from desktop-bootstrap.
let onboardingCloudProviders: OnboardingCloudProvider[] = [];
let onboardingLocalAiCapable = false;
// Embedding enhancement state (Phase 3); all-false until bootstrap answers.
let onboardingEmbedding: OnboardingEmbeddingStatus = {
  ollamaInstalled: false,
  serverOnline: false,
  modelPresent: false,
  registered: false,
  usable: false,
};
// Agent offers for the no-harness branch (Phase 4); detection itself is
// probed live by the agent page, not carried in bootstrap.
let onboardingAgentOffers: OnboardingAgentOffer[] = [];
// Active-workspace structure for the workspace page (Phase 6).
let onboardingWorkspaceStructure: OnboardingWorkspaceStructure = {
  dirExists: false,
  missing: [],
  complete: false,
};
// Dashboard checklist state (Phase 9). Deck size comes from check-due's
// stats; the agent probe answers asynchronously. Both stay null until known
// so the checklist never claims a gap it has not positively established.
let deckCardCount: number | null = null;
let agentHarnessConfigured: boolean | null = null;
// True once desktop-bootstrap has answered — before that the module vars
// above are placeholders and the checklist must not render from them.
let dashboardSignalsLoaded = false;
// "Finish later" disarms the first-run auto-show for the rest of this app
// session, so the dashboard reload that refreshes the checklist does not
// bounce the user straight back into the flow (the machine-local gate stays
// armed for the next start).
let onboardingDeferredThisSession = false;

function showOnboarding(): void {
  if (!onboardingController) return;
  switchView("onboarding-view");
  onboardingController.start();
}

/** Open the flow directly at one page (e.g. Learning Content → goal import). */
function showOnboardingAt(stepId: string): void {
  if (!onboardingController) return;
  switchView("onboarding-view");
  onboardingController.startAt(stepId);
}

/**
 * Dashboard onboarding checklist (ADR 2026-07-24 §7, plan Phase 9): the
 * remaining setup steps as actionable rows, each reopening the flow at the
 * page that resolves it. Hidden entirely when nothing remains. Renders from
 * already-established signals only — see deriveOnboardingChecklist.
 */
function renderOnboardingChecklist(): void {
  const container = document.getElementById("onboarding-checklist");
  const itemsEl = document.getElementById("onboarding-checklist-items");
  if (!container || !itemsEl || !dashboardSignalsLoaded) return;

  const items = deriveOnboardingChecklist({
    aiConnected: isLlmEnabled,
    agentConfigured: agentHarnessConfigured,
    workspaceStructure: onboardingWorkspaceStructure,
    cardsInDeck: deckCardCount,
  });

  container.classList.toggle("hidden", items.length === 0);
  itemsEl.replaceChildren();
  for (const item of items) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "onboarding-checklist-item";
    row.dataset.checklistId = item.id;

    const title = document.createElement("span");
    title.className = "onboarding-checklist-item-title";
    title.textContent = t(item.titleKey);

    const note = document.createElement("span");
    note.className = "onboarding-checklist-item-note";
    note.textContent = t(item.noteKey);

    row.append(title, note);
    row.addEventListener("click", () => showOnboardingAt(item.step));
    itemsEl.appendChild(row);
  }
}

/**
 * The one checklist signal bootstrap does not carry: whether any known
 * harness already has ZAM's MCP entry. Probed asynchronously off the
 * dashboard's critical path; a failed probe keeps the signal unknown, which
 * deliberately shows no agent row rather than a possibly-wrong one.
 */
async function refreshAgentChecklistSignal(): Promise<void> {
  try {
    const res = await runBridge<{
      harnesses?: Array<{ configured?: boolean }>;
    }>("agent-harness-status");
    agentHarnessConfigured = (res.harnesses ?? []).some(
      (harness) => harness.configured === true,
    );
  } catch {
    agentHarnessConfigured = null;
  }
  renderOnboardingChecklist();
}

function switchView(
  viewId: AppView,
  options: { skipStudioLoad?: boolean } = {},
) {
  const wasSettings =
    document.getElementById("settings-view")?.classList.contains("active") ===
    true;

  if (viewId !== "study-view" && studySessionActive) {
    // Navigating away must silence the microphone and the speaker.
    void pauseVoiceMode();
    evaluationRequestId++;
    if (revealInProgress) cancelActiveBridgeRequest();
    revealInProgress = false;
    finishAiWait();
    closeManageMenu();
    closeInlineEditor();
    if (isStudyConfirmOpen()) hideStudyConfirm();
    activeCard = null;
    updateReviewControlState();
    // Leaving study via nav abandons the in-progress card; still close the
    // backend session so it does not linger. The summary path uses
    // finishStudySession() and stays on study-view.
    void closeUiLearningSession();
  }
  // Leaving the summary screen via nav restores the study shell for next time.
  if (viewId !== "study-view" && sessionSummaryVisible) {
    document.getElementById("session-summary")?.classList.add("hidden");
    document.getElementById("study-active-card")?.classList.remove("hidden");
    document.getElementById("study-footer")?.classList.remove("hidden");
    sessionSummaryVisible = false;
    resetSessionTally();
  }
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");
  studySessionActive = viewId === "study-view" && !sessionSummaryVisible;
  if (studySessionActive) void refreshVoiceAvailability();
  setActiveNav(viewId);

  const mainContainer = document.querySelector('main.container');
  mainContainer?.classList.toggle('content-full', viewId === "learning-content-view");
  if (viewId === "graph-view") {
    mainContainer?.classList.add('graph-full');
    // lazy init three when first shown
    requestAnimationFrame(() => initOrShowGraph());
  } else {
    mainContainer?.classList.remove('graph-full');
  }

  if (viewId === "settings-view") {
    refreshSettingsData();
    void capturePrimaryModelFingerprint();
  } else if (wasSettings) {
    void maybeReinitAiAfterSettings();
  }
  if (viewId === "stats-view") {
    void loadStatsView();
  }
  // openCardInEditor already loads + selects; skip the redundant fire-and-forget
  // load that would race with that path (ADR 2026-07-16b full-editor jump).
  if (viewId === "learning-content-view" && !options.skipStudioLoad) {
    loadStudioData();
  }
}

// Global window resize handler for the 3D graph (ensures full space usage on maximize/resize)
window.addEventListener('resize', () => {
  const graphView = document.getElementById('graph-view');
  if (graphView && graphView.classList.contains('active') && graphRenderer && graphCamera) {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  }
});

// ── 3D KNOWLEDGE GRAPH (experimental, focus + direct prereqs/dependents) ──
let graphRenderer: THREE.WebGLRenderer | null = null;
let graphScene: THREE.Scene | null = null;
let graphCamera: THREE.PerspectiveCamera | null = null;
let graphAnimationId: number | null = null;
let graphNodeMeshes: Map<string, THREE.Mesh> = new Map();
let graphIsDragging = false;
let graphLastX = 0;
let graphLastY = 0;
let graphYaw = 0.9;
let graphPitch = 1.1;
let graphDist = 8.0;
let currentNeighborhood: any = null;
/** When true (default), only tokens with a card for the active learner are shown. */
let graphFilterByLearner = true;
let currentDomain: string | null = null;
let availableDomains: string[] = [];
let originalDomainSet: Set<string> = new Set();
let currentKnowledgeContext: string | null = null;
let availableKnowledgeContexts: any[] = [];

function getShortSlug(slug: string): string {
  if (currentDomain) {
    const folded = currentDomain.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (folded && slug.startsWith(folded + "-")) {
      return slug.substring(folded.length + 1);
    }
  }
  return slug;
}

function getDisplayTitle(t: { title?: string; slug: string }): string {
  if (t.title && t.title.trim()) return t.title.trim();
  return getShortSlug(t.slug);
}

function getGraphUserId(): string {
  return desktopUserId ?? databaseCurrentUserId ?? "default";
}

function tokenMatchesLearnerFilter(token: { card?: unknown } | null): boolean {
  if (!graphFilterByLearner) return true;
  return token?.card != null;
}

function filterTokensForGraph<T extends { card?: unknown }>(tokens: T[]): T[] {
  if (!graphFilterByLearner) return tokens;
  return tokens.filter((token) => token.card != null);
}

function updateGraphLearnerFilterUi(): void {
  const label = document.getElementById("graph-filter-by-learner-label");
  const checkbox = document.getElementById(
    "graph-filter-by-learner",
  ) as HTMLInputElement | null;
  const focusLabel = document.getElementById("graph-focus-label");
  const profile = getGraphUserId();
  if (label) label.textContent = tf("graph_filter_by_learner", { profile });
  if (checkbox) checkbox.checked = graphFilterByLearner;
  if (focusLabel) {
    focusLabel.textContent = graphFilterByLearner ? profile : "";
  }
}

async function refreshGraphScope(): Promise<void> {
  currentNeighborhood = null;
  availableDomains = [];
  await loadAndRenderDomains();
  await bootstrapGraphWithDomain();
}

function disposeGraph() {
  if (graphAnimationId) {
    cancelAnimationFrame(graphAnimationId);
    graphAnimationId = null;
  }
  if (graphRenderer) {
    graphRenderer.dispose();
    graphRenderer = null;
  }
  graphScene = null;
  graphCamera = null;
  graphNodeMeshes.clear();
  currentNeighborhood = null;
  currentDomain = null;
  currentKnowledgeContext = null;
  availableDomains = [];
  availableKnowledgeContexts = [];
}

function updateGraphCamera() {
  if (!graphCamera) return;
  const x = graphDist * Math.sin(graphPitch) * Math.sin(graphYaw);
  const y = graphDist * Math.cos(graphPitch);
  const z = graphDist * Math.sin(graphPitch) * Math.cos(graphYaw);
  graphCamera.position.set(x, y, z);
  graphCamera.lookAt(0, 0, 0);
}

function cssColorHex(variableName: string, fallback: string): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return new THREE.Color(value || fallback).getHex();
}

function cssColorString(variableName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value || fallback;
}

function buildGraphScene(nb: any) {
  if (!graphScene) return;
  // clear previous
  while (graphScene.children.length > 0) {
    const child = graphScene.children[0];
    graphScene.remove(child);
    if ((child as any).geometry) (child as any).geometry.dispose();
    if ((child as any).material) (child as any).material.dispose?.();
  }
  graphNodeMeshes.clear();

  currentNeighborhood = nb;

  // update side panel
  const focusSlugEl = document.getElementById("focus-slug")!;
  const focusConceptEl = document.getElementById("focus-concept")!;
  const focusMetaEl = document.getElementById("focus-meta")!;
  const prereqList = document.getElementById("prereq-list")!;
  const depList = document.getElementById("dependent-list")!;

  focusSlugEl.textContent = getDisplayTitle(nb.center);
  focusConceptEl.textContent = nb.center.concept;
  const c = nb.center.card;
  const ctxNames = nb.center.knowledgeContexts ? nb.center.knowledgeContexts.map((cx: any) => cx.name).join(", ") : "";
  const ctxMeta = ctxNames ? ` · Contexts: ${ctxNames}` : "";
  focusMetaEl.textContent = c
    ? `Bloom ${nb.center.bloomLevel} · ${c.state} · reps=${c.reps} · stab=${c.stability.toFixed(1)} ${c.blocked ? "· BLOCKED" : ""}${ctxMeta}`
    : `Bloom ${nb.center.bloomLevel} · ${t("graph_no_card")}${ctxMeta}`;

  // helper to make clickable pill
  const makePill = (gt: any, container: HTMLElement) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "neighbor-pill";
    pill.textContent = getDisplayTitle(gt);
    pill.title = gt.concept;
    pill.addEventListener("click", () => loadGraphFocus(gt.slug));
    container.appendChild(pill);
  };

  prereqList.innerHTML = "";
  let visiblePrereqs = nb.prerequisites;
  if (currentDomain) {
    visiblePrereqs = visiblePrereqs.filter((p: any) => p.domain === currentDomain || p.domain.startsWith(currentDomain + '/'));
  }
  if (currentKnowledgeContext) {
    visiblePrereqs = visiblePrereqs.filter((p: any) => p.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext));
  }
  visiblePrereqs = visiblePrereqs.filter((p: any) => tokenMatchesLearnerFilter(p));
  visiblePrereqs.forEach((p: any) => makePill(p, prereqList));
  if (visiblePrereqs.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--clr-text-muted)";
    empty.textContent = "—";
    prereqList.appendChild(empty);
  }

  depList.innerHTML = "";
  let visibleDependents = nb.dependents;
  if (currentDomain) {
    visibleDependents = visibleDependents.filter((d: any) => d.domain === currentDomain || d.domain.startsWith(currentDomain + '/'));
  }
  if (currentKnowledgeContext) {
    visibleDependents = visibleDependents.filter((d: any) => d.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext));
  }
  visibleDependents = visibleDependents.filter((d: any) => tokenMatchesLearnerFilter(d));
  visibleDependents.forEach((d: any) => makePill(d, depList));
  if (visibleDependents.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--clr-text-muted)";
    empty.textContent = "—";
    depList.appendChild(empty);
  }

  // --- Three.js objects ---
  const group = new THREE.Group();
  graphScene.add(group);

  const isDark = document.documentElement.dataset.theme === "dark";

  // Subtle reference grid — gives the 3D viewport visual structure and depth
  // especially important in light mode and in the empty/sparse state.
  const gridColor = isDark ? 0x475569 : 0x94a3b8;
  const grid = new THREE.GridHelper(11, 11, gridColor, gridColor);
  grid.position.y = -3.1;
  grid.material.opacity = isDark ? 0.22 : 0.38;
  grid.material.transparent = true;
  grid.material.depthWrite = false;
  graphScene.add(grid);

  // simple palette by domain (stable hue per domain string)
  const domainHue = (domain: string) => {
    let h = 0;
    for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 360) / 360);
  };

  function createLabelSprite(text: string, isCenter: boolean): THREE.Sprite {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const fontSize = isCenter ? 64 : 42;
    context.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

    let displayText = text;
    if (text.length > 22) {
      displayText = text.slice(0, 19) + "…";
    }

    const metrics = context.measureText(displayText);
    const textWidth = Math.ceil(metrics.width);
    canvas.width = textWidth + 24;
    canvas.height = fontSize + 16;

    // Redraw text after canvas resize (width/height reset the context)
    context.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    // Light theme: dark readable labels; dark theme: bright cyan pops
    const labelColor = isCenter
      ? cssColorString("--clr-accent-cyan", isDark ? "#67e8f9" : "#0e7490")
      : (isDark ? "#bae6fd" : "#1e293b");
    context.fillStyle = labelColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // labels should stay readable
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    const scaleFactor = isCenter ? 0.85 : 0.55;
    sprite.scale.set(
      (canvas.width / 95) * scaleFactor,
      (canvas.height / 95) * scaleFactor,
      1
    );

    // y position is set by caller based on geometry (sphere / box / cone roof)
    sprite.position.y = 0;
    return sprite;
  }

  const makeNode = (gt: any, isCenter: boolean, isPrereq: boolean = false) => {
    const baseSize = 0.35 + (gt.bloomLevel || 1) * 0.12;

    let geom;
    let labelOffsetY;

    if (isCenter) {
      // Focus: small sphere (core knowledge)
      const size = baseSize * 0.85;
      geom = new THREE.SphereGeometry(size, 24, 18);
      labelOffsetY = size * 1.15;
    } else if (isPrereq) {
      // Basis: Quader (foundation / solid base)
      const size = baseSize * 1.05;
      geom = new THREE.BoxGeometry(size, size, size);
      labelOffsetY = size * 1.25;
    } else {
      // Höhere Fähigkeiten: Dach (roof / built on top) – pyramid-like cone
      const radius = baseSize * 0.85;
      const height = baseSize * 1.5;
      geom = new THREE.ConeGeometry(radius, height, 4); // 4-sided for roof feel
      labelOffsetY = height * 0.75; // above the peak
    }

    let color;
    if (isCenter) {
      // Center keeps its special treatment (from card or default)
      let sat = 0.68;
      let light = 0.58;
      if (!isDark) {
        sat = 0.78;
        light = 0.52;
      }
      color = new THREE.Color().setHSL(domainHue(gt.domain || "general"), sat, light);

      const card = gt.card;
      if (card) {
        if (card.blocked) {
          color = new THREE.Color(0xe11d48);
        } else {
          const mastery = Math.min(1, (card.reps || 0) / 6 + (card.stability || 0) / 30);
          const mLight = isDark ? (0.42 + mastery * 0.38) : (0.48 + mastery * 0.34);
          color = new THREE.Color().setHSL(domainHue(gt.domain || ""), isDark ? 0.72 : 0.80, mLight);
        }
      }
    } else if (isPrereq) {
      // BASIS / Voraussetzungen: distinct "foundation" color family (teal-greenish)
      const h = (0.42 + (domainHue(gt.domain || "") - 0.5) * 0.25 + 1) % 1;
      color = new THREE.Color().setHSL(h, 0.58, 0.46);
    } else {
      // HÖHERE FÄHIGKEITEN / Aufbauwissen: distinct "advanced" color family (blue-violet)
      const h = (0.68 + (domainHue(gt.domain || "") - 0.5) * 0.25 + 1) % 1;
      color = new THREE.Color().setHSL(h, 0.68, 0.52);
    }

    const emissive = isCenter
      ? (isDark ? 0x222233 : 0x445566)
      : (isDark ? 0x111111 : 0x333344);
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive,
      shininess: isCenter ? 28 : 10,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.slug = gt.slug;
    graphNodeMeshes.set(gt.slug, mesh);

    // Add visible label (sprite with canvas text)
    const label = createLabelSprite(getDisplayTitle(gt), isCenter);
    label.position.y = labelOffsetY;
    mesh.add(label);

    return mesh;
  };

  // Center
  const centerMesh = makeNode(nb.center, true, false);
  centerMesh.position.set(0, 0, 0);
  group.add(centerMesh);

  // Place prerequisites (lower hemisphere / ring)
  const prereqs = nb.prerequisites;
  const depnds = nb.dependents;
  const prereqRadius = 2.0;
  const depRadius = 1.8;

  prereqs.forEach((p: any, i: number) => {
    if (currentDomain && p.domain !== currentDomain && !p.domain.startsWith(currentDomain + "/")) return; // stay within independent knowledge area
    if (currentKnowledgeContext && !p.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext)) return;
    if (!tokenMatchesLearnerFilter(p)) return;
    const angle = (i / Math.max(1, prereqs.length)) * Math.PI * 2;
    const m = makeNode(p, false, true); // isPrereq
    const y = -1.6 - (p.bloomLevel - 1) * 0.06;
    m.position.set(
      Math.cos(angle) * prereqRadius,
      y,
      Math.sin(angle) * prereqRadius * 0.9
    );
    group.add(m);

    // edge to center (prereq / basis link)
    const points = [m.position.clone(), new THREE.Vector3(0, 0.1, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineColor = isDark ? 0x4ade80 : 0x16a34a; // green for basis/prereqs
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isDark ? 0.55 : 0.85 }));
    group.add(line);
  });

  // Dependents (upper)
  depnds.forEach((d: any, i: number) => {
    if (currentDomain && d.domain !== currentDomain && !d.domain.startsWith(currentDomain + "/")) return; // stay within independent knowledge area
    if (currentKnowledgeContext && !d.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext)) return;
    if (!tokenMatchesLearnerFilter(d)) return;
    const angle = (i / Math.max(1, depnds.length)) * Math.PI * 2 + 0.4;
    const m = makeNode(d, false, false); // not prereq
    const y = 1.9 + (d.bloomLevel - 1) * 0.05;
    m.position.set(
      Math.cos(angle) * depRadius,
      y,
      Math.sin(angle) * depRadius * 0.85
    );
    group.add(m);

    const points = [new THREE.Vector3(0, 0.1, 0), m.position.clone()];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineColor = isDark ? 0x60a5fa : 0x1e40af; // blue for higher abilities/dependents
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isDark ? 0.55 : 0.85 }));
    group.add(line);
  });

  // lights — tuned for visibility in light theme (brighter/neutral) while keeping dark moody
  const ambColor = isDark ? 0x666688 : 0x888899;
  const amb = new THREE.AmbientLight(ambColor, isDark ? 0.65 : 0.92);
  graphScene.add(amb);
  const pColor = isDark ? 0xaabbff : 0xccddee;
  const p1 = new THREE.PointLight(pColor, isDark ? 0.95 : 1.2, 50);
  p1.position.set(4, 6, 3);
  graphScene.add(p1);
}

async function loadGraphFocus(slug: string) {
  try {
    const data = await runBridge<any>("get-neighborhood", ["--focus", slug, "--user", getGraphUserId()]);
    buildGraphScene(data);
    // recenter camera nicely
    graphYaw = 0.9;
    graphPitch = 1.1;
    graphDist = 7.8;
    updateGraphCamera();
  } catch (e) {
    console.error("Failed to load neighborhood for", slug, e);
  }
}

// --- Knowledge Context filter helpers ---
async function loadAndRenderKnowledgeContexts() {
  try {
    const activeRes = await runBridge<any>("get-active-knowledge-context");
    if (activeRes && activeRes.success) {
      if (currentKnowledgeContext === null) {
        currentKnowledgeContext = activeRes.activeContext;
      }
    }
    const listRes = await runBridge<any>("list-knowledge-contexts");
    if (listRes && listRes.success) {
      availableKnowledgeContexts = listRes.contexts || [];
    }
    renderKnowledgeContextSelector();
  } catch (e) {
    console.warn("Could not load knowledge contexts for selector", e);
  }
}

function renderKnowledgeContextSelector() {
  const container = document.getElementById("graph-context-selector");
  if (!container) return;
  container.innerHTML = "";

  const allPill = document.createElement("span");
  allPill.className = "context-pill" + (currentKnowledgeContext === null ? " active" : "");
  allPill.textContent = t("lbl_all_contexts");
  allPill.onclick = () => switchToKnowledgeContext(null);
  container.appendChild(allPill);

  availableKnowledgeContexts.forEach((ctx) => {
    const pill = document.createElement("span");
    pill.className = "context-pill" + (currentKnowledgeContext === ctx.name ? " active" : "");
    pill.textContent = ctx.label ? `${ctx.label} (${ctx.name})` : ctx.name;
    pill.onclick = () => switchToKnowledgeContext(ctx.name);
    container.appendChild(pill);
  });
}

async function switchToKnowledgeContext(contextName: string | null) {
  currentKnowledgeContext = contextName;
  renderKnowledgeContextSelector();

  currentDomain = null;
  currentNeighborhood = null;

  await loadAndRenderDomains();
  await bootstrapGraphWithDomain();
}

// --- Domain filter helpers for browsing independent knowledge areas ---
async function loadAndRenderDomains() {
  try {
    const args = ["--user", getGraphUserId()];
    if (currentKnowledgeContext) {
      args.push("--knowledge-context", currentKnowledgeContext);
    }
    const resp = await runBridge<any>("list-tokens", args);
    const tokens = filterTokensForGraph(resp.tokens || []);
    originalDomainSet = new Set<string>();
    tokens.forEach((t: any) => {
      if (t.domain) originalDomainSet.add(t.domain);
    });
    // Support prefix-based domains for team/custom content e.g. "company-team/xxx"
    // Include parent prefixes so users can select e.g. "company-team" to see all children.
    const prefixSet = new Set<string>(originalDomainSet);
    for (const d of originalDomainSet) {
      if (d.includes('/')) {
        const parts = d.split('/');
        for (let i = 1; i < parts.length; i++) {
          const pref = parts.slice(0, i).join('/');
          prefixSet.add(pref);
        }
      }
    }
    availableDomains = Array.from(prefixSet).sort();
    renderDomainSelector();
  } catch (e) {
    console.warn("Could not load domains for selector", e);
  }
}

function renderDomainSelector() {
  const container = document.getElementById("graph-domain-selector");
  if (!container) return;
  container.innerHTML = "";

  // "All" pill
  const allPill = document.createElement("span");
  allPill.className = "domain-pill" + (currentDomain === null ? " active" : "");
  allPill.textContent = "All";
  allPill.onclick = () => switchToDomain(null);
  container.appendChild(allPill);

  availableDomains.forEach((dom) => {
    const pill = document.createElement("span");
    pill.className = "domain-pill" + (currentDomain === dom ? " active" : "");
    const isPrefix = !originalDomainSet.has(dom);
    pill.textContent = isPrefix ? dom + " ⋯" : dom;
    if (isPrefix) {
      pill.title = `Group: all under prefix "${dom}"`;
    }
    pill.onclick = () => switchToDomain(dom);
    container.appendChild(pill);
  });
}

async function switchToDomain(domain: string | null) {
  currentDomain = domain;
  renderDomainSelector();

  // Clear current to force re-bootstrap with (or without) domain scope
  currentNeighborhood = null;

  // Re-run the bootstrap logic with domain awareness
  await bootstrapGraphWithDomain();
}

async function bootstrapGraphWithDomain() {
  // Similar to the original bootstrap but domain-aware and context-aware
  let startSlug: string | null = null;

  try {
    if (currentDomain || currentKnowledgeContext) {
      const args = ["--user", getGraphUserId()];
      if (currentDomain) args.push("--domain-prefix", currentDomain);
      if (currentKnowledgeContext) args.push("--knowledge-context", currentKnowledgeContext);
      const list = await runBridge<any>("list-tokens", args);
      const domTokens: any[] = filterTokensForGraph(list.tokens || []);
      if (domTokens.length > 0) {
        domTokens.sort((a, b) => (a.bloomLevel || 99) - (b.bloomLevel || 99));
        startSlug = domTokens[0].slug;

        // Also show a browsable list of all tokens in this domain in the side panel
        populateDomainTokenList(domTokens);
      }
    } else {
      // All domains: use the "next to be queried" logic
      const review = await runBridge<any>("get-review");
      if (review && review.hasReview && review.card && review.card.slug) {
        startSlug = review.card.slug;
      }
    }
  } catch (e) {
    console.warn("Domain-aware bootstrap get-review/list failed", e);
  }

  if (!startSlug) {
    // Fallback to general list (respecting domain if set)
    try {
      const args = ["--user", getGraphUserId()];
      if (currentDomain) args.push("--domain-prefix", currentDomain);
      if (currentKnowledgeContext) args.push("--knowledge-context", currentKnowledgeContext);
      const list = await runBridge<any>("list-tokens", args);
      const tokens: any[] = filterTokensForGraph(list.tokens || []);
      if (tokens.length > 0) {
        const withCard = tokens.find((t: any) => t.card);
        startSlug = (withCard || tokens[0]).slug;

        if (currentDomain || currentKnowledgeContext) {
          populateDomainTokenList(tokens);
        }
      }
    } catch (e) {
      console.warn("Fallback list-tokens failed", e);
    }
  }

  if (startSlug) {
    await loadGraphFocus(startSlug);
  } else {
    // No tokens at all (or for this domain)
    const dummy = {
      focus: "empty",
      center: {
        id: "x",
        slug: currentDomain ? `no-tokens-in-${currentDomain}` : "no-tokens-yet",
        title: currentDomain ? `No tokens in ${currentDomain}` : "No tokens yet",
        concept: currentDomain
          ? `No tokens in domain "${currentDomain}" yet`
          : "Register some tokens first (zam token register)",
        domain: currentDomain || "",
        bloomLevel: 1,
        card: null
      },
      prerequisites: [],
      dependents: []
    };
    buildGraphScene(dummy);
  }
}

function populateDomainTokenList(tokens: any[]) {
  // Add or update a "Browse in domain" section in the side panel for full browsability
  const side = document.querySelector(".graph-side");
  if (!side) return;

  let listSection = document.getElementById("domain-tokens-list");
  if (!listSection) {
    listSection = document.createElement("div");
    listSection.id = "domain-tokens-list";
    listSection.className = "side-section";
    const title = document.createElement("div");
    title.className = "side-title";
    title.textContent = t("graph_domain_token_list_title");
    listSection.appendChild(title);
    const listEl = document.createElement("div");
    listEl.id = "domain-full-list";
    listEl.className = "neighbor-list";
    listSection.appendChild(listEl);
    side.appendChild(listSection);
  }

  const listEl = document.getElementById("domain-full-list")!;
  listEl.innerHTML = "";

  filterTokensForGraph(tokens).forEach((t: any) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "neighbor-pill";
    pill.textContent = getDisplayTitle(t);
    pill.title = t.concept || "";
    pill.addEventListener("click", () => loadGraphFocus(t.slug));
    listEl.appendChild(pill);
  });
}

// ── end domain helpers ────────────────────────────────────────────────────

async function initOrShowGraph() {
  const container = document.getElementById("graph-canvas-container") as HTMLDivElement;
  const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
  if (!container || !canvas) return;

  updateGraphLearnerFilterUi();

  if (!graphRenderer) {
    graphRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    graphRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    graphRenderer.setSize(container.clientWidth, container.clientHeight);
    graphRenderer.setClearColor(cssColorHex("--bg-deep-space", "#f5f7fb"), 1);

    graphScene = new THREE.Scene();
    graphCamera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    updateGraphCamera();

    // initial empty scene with soft fog
    graphScene.fog = new THREE.Fog(cssColorHex("--bg-deep-space", "#f5f7fb"), 12, 28);

    // Add a permanent subtle reference grid so the 3D area always feels like a
    // 3D viewport (especially useful in light mode and before/without data).
    const initIsDark = document.documentElement.dataset.theme === "dark";
    const initGrid = new THREE.GridHelper(11, 11,
      initIsDark ? 0x475569 : 0x94a3b8,
      initIsDark ? 0x334155 : 0xcbd5e1
    );
    initGrid.position.y = -3.1;
    initGrid.material.opacity = initIsDark ? 0.22 : 0.38;
    initGrid.material.transparent = true;
    initGrid.material.depthWrite = false;
    graphScene.add(initGrid);

    // resize observer
    const ro = new ResizeObserver(() => {
      if (!graphRenderer || !graphCamera || !container) return;
      graphRenderer.setSize(container.clientWidth, container.clientHeight);
      graphCamera.aspect = container.clientWidth / container.clientHeight;
      graphCamera.updateProjectionMatrix();
    });
    ro.observe(container);

    // mouse orbit + click
    canvas.addEventListener("pointerdown", (e) => {
      graphIsDragging = true;
      graphLastX = e.clientX;
      graphLastY = e.clientY;
    });
    window.addEventListener("pointerup", () => { graphIsDragging = false; });
    canvas.addEventListener("pointermove", (e) => {
      if (!graphIsDragging || !graphCamera) return;
      const dx = e.clientX - graphLastX;
      const dy = e.clientY - graphLastY;
      graphYaw += dx * 0.0045;
      graphPitch = Math.max(0.15, Math.min(1.35, graphPitch - dy * 0.0045));
      graphLastX = e.clientX;
      graphLastY = e.clientY;
      updateGraphCamera();
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      graphDist = Math.max(2.5, Math.min(22, graphDist + e.deltaY * 0.012));
      updateGraphCamera();
    }, { passive: false });

    canvas.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.12 : 0.06;
      if (e.key === "ArrowLeft") {
        graphYaw -= step;
      } else if (e.key === "ArrowRight") {
        graphYaw += step;
      } else if (e.key === "ArrowUp") {
        graphPitch = Math.max(0.15, graphPitch - step);
      } else if (e.key === "ArrowDown") {
        graphPitch = Math.min(1.35, graphPitch + step);
      } else {
        return;
      }
      e.preventDefault();
      updateGraphCamera();
    });

    // click to focus (after possible drag)
    let clickStart = 0;
    canvas.addEventListener("pointerdown", () => { clickStart = Date.now(); });
    canvas.addEventListener("pointerup", (e) => {
      if (Date.now() - clickStart > 220 || graphIsDragging) return; // was a drag
      if (!graphRenderer || !graphCamera || !graphScene) return;

      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(mx, my), graphCamera);

      const candidates: THREE.Mesh[] = [];
      graphNodeMeshes.forEach((m) => candidates.push(m));
      const hits = ray.intersectObjects(candidates, false);
      if (hits.length > 0) {
        const hitSlug = (hits[0].object as any).userData?.slug;
        if (hitSlug && hitSlug !== currentNeighborhood?.center?.slug) {
          loadGraphFocus(hitSlug);
        }
      }
    });

    // double click anywhere resets a bit
    canvas.addEventListener("dblclick", () => {
      graphYaw = 0.9; graphPitch = 1.1; graphDist = 8.0;
      updateGraphCamera();
    });
  }

  // Resolve the context default before the first graph query so selector and
  // graph contents start in the same scope.
  if (availableKnowledgeContexts.length === 0) {
    await loadAndRenderKnowledgeContexts();
  }

  // Load domain list for the filter/selector (only once per graph session).
  if (availableDomains.length === 0) {
    await loadAndRenderDomains();
  }

  // bootstrap / reload with current domain and context filters (if any)
  if (!currentNeighborhood) {
    await bootstrapGraphWithDomain();
  }

  // start render loop (idempotent-ish)
  const renderLoop = () => {
    if (graphRenderer && graphScene && graphCamera) {
      graphRenderer.render(graphScene, graphCamera);
    }
    graphAnimationId = requestAnimationFrame(renderLoop);
  };
  if (!graphAnimationId) renderLoop();

  // size once more
  setTimeout(() => {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (graphRenderer && graphCamera && c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  }, 30);

  // Force full space usage right after init (important for maximize / large windows)
  requestAnimationFrame(() => {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (graphRenderer && graphCamera && c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  });
}

// ── DASHBOARD LOADING ─────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    clearDashboardError();
    // 1. Initialize first-run state, then apply settings and translations.
    const settings = await runBridge<{
      userId: string;
      locale: string;
      llm: { enabled: boolean };
      activeWorkspaceId?: string;
      workspaceDir?: string;
      onboardingDone?: boolean;
      onboardingPersona?: string;
      onboardingPersonas?: OnboardingPersona[];
      cloudProviders?: OnboardingCloudProvider[];
      localAiCapable?: boolean;
      embedding?: OnboardingEmbeddingStatus;
      agentOffers?: OnboardingAgentOffer[];
      workspaceStructure?: OnboardingWorkspaceStructure;
    }>("desktop-bootstrap");
    desktopUserId = settings.userId;
    setCurrentLocale(settings.locale || "en");
    isLlmEnabled = settings.llm?.enabled || false;
    activeWorkspaceId = settings.activeWorkspaceId ?? activeWorkspaceId;
    activeWorkspaceDir = settings.workspaceDir ?? activeWorkspaceDir;
    onboardingPersonas = settings.onboardingPersonas ?? onboardingPersonas;
    onboardingPersonaId = settings.onboardingPersona ?? onboardingPersonaId;
    onboardingCloudProviders =
      settings.cloudProviders ?? onboardingCloudProviders;
    onboardingLocalAiCapable =
      settings.localAiCapable ?? onboardingLocalAiCapable;
    onboardingEmbedding = settings.embedding ?? onboardingEmbedding;
    onboardingAgentOffers = settings.agentOffers ?? onboardingAgentOffers;
    onboardingWorkspaceStructure =
      settings.workspaceStructure ?? onboardingWorkspaceStructure;
    dashboardSignalsLoaded = true;

    initializeTranslations();

    // First-run gate (ADR 2026-07-24): a machine that has not completed the
    // guided flow lands there instead of the empty dashboard. The rest of
    // loadDashboard still runs so the dashboard is ready behind "finish
    // later" — which disarms this auto-show for the session (Phase 9), so
    // the reload that refreshes the checklist stays on the dashboard.
    if (settings.onboardingDone === false && !onboardingDeferredThisSession) {
      showOnboarding();
    }
    void loadWorkspaceList();
    void loadProviderStatus();
    runAgentAutoConnectOnce();

    // 2. Check due cards count and active domains
    const dueInfo = await runBridge<{
      dueCount: number;
      domains: string[];
      stats?: { cardsInDeck?: number };
    }>("check-due");
    totalDue = dueInfo.dueCount;
    deckCardCount = dueInfo.stats?.cardsInDeck ?? null;

    const dueCountEl = document.getElementById("due-count")!;
    dueCountEl.textContent = String(totalDue);

    const caughtUpEl = document.getElementById("lbl-caught-up")!;
    const startBtn = document.getElementById("btn-start-session") as HTMLButtonElement;

    if (totalDue > 0) {
      caughtUpEl.classList.add("hidden");
      startBtn.disabled = false;
    } else {
      // An empty deck is not "caught up" — say so and point at the checklist
      // below, which carries the import paths (ADR 2026-07-24 §7: no import →
      // the dashboard shows the paths rather than an empty state).
      caughtUpEl.textContent =
        deckCardCount === 0 ? t("dashboard_empty_no_cards") : t("lbl_caught_up");
      caughtUpEl.classList.remove("hidden");
      startBtn.disabled = true;
    }

    // Remaining-setup checklist (plan Phase 9): render synchronously from
    // what bootstrap and check-due established, then refresh once the async
    // agent probe answers.
    renderOnboardingChecklist();
    void refreshAgentChecklistSignal();

    // Load active domains as badges
    const domainsContainer = document.getElementById("dashboard-domains")!;
    domainsContainer.innerHTML = "";
    if (dueInfo.domains && dueInfo.domains.length > 0) {
      dueInfo.domains.forEach((dom) => {
        const span = document.createElement("span");
        span.className = "domain-tag";
        span.textContent = dom;
        domainsContainer.appendChild(span);
      });
    } else {
      const span = document.createElement("span");
      span.className = "empty-tag";
      span.textContent = "—";
      domainsContainer.appendChild(span);
    }

    // 3. Bring the local LLM online (auto-starts the server like `zam learn`)
    //    and reflect status. Don't block the dashboard on model load.
    refreshAiStatus();
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    showDashboardError(err);
  }
}

/**
 * Surface a bridge/data error directly in the dashboard. Previously these were
 * only logged to the (invisible) console, so a failing bridge looked like an
 * empty "no tokens" dashboard with no explanation.
 */
function showDashboardError(err: unknown): void {
  const view = document.getElementById("dashboard-view");
  if (!view) return;
  let banner = document.getElementById("dashboard-error");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "dashboard-error";
    banner.className = "error-banner";
    view.prepend(banner);
  }
  const msg = err instanceof Error ? err.message : String(err);
  banner.textContent = `⚠ ${t("dashboard_error")}: ${msg}`;
  banner.classList.remove("hidden");
}

function clearDashboardError(): void {
  document.getElementById("dashboard-error")?.classList.add("hidden");
}

// ── ACTIVE STUDY FLOW ─────────────────────────────────────────────────────
async function loadNextCard(
  options: { dynamicQuestion?: boolean } = {},
) {
  const requestId = ++questionRequestId;
  cardLoadInProgress = true;
  activeCard = null;
  activePromptQuestion = "";
  updateReviewControlState();
  try {
    evaluationRequestId++;
    revealInProgress = false;
    resetDiscussionUi();
    finishAiWait();
    finishQuestionWait();

    // Reset study screen elements
    document.getElementById("revealed-box")!.classList.add("hidden");
    document.getElementById("npu-loading")!.classList.add("hidden");
    document.getElementById("wait-prompt")!.classList.add("hidden");
    document.getElementById("answer-capture-box")!.classList.remove("hidden");
    closeInlineEditor();
    closeManageMenu();
    
    const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
    textarea.value = "";
    textarea.disabled = true;

    setModelAttributionBadge("question-model-badge", null);

    // Set question text to a pulsing loading state so the user has immediate visual feedback
    const questionText = document.getElementById("question-text")!;
    questionText.innerHTML = "";
    const loadingText = document.createElement("span");
    loadingText.className = "loading-pulse";
    loadingText.textContent = t("lbl_generating_question");
    questionText.appendChild(loadingText);

    // Fetch review. Dynamic question generation may need to cold-start a local
    // model, so offer the learner a choice after 30 seconds instead of leaving
    // the loading state unexplained.
    // ADR Decision 4: the study queue stays unscoped (everything,
    // interleaved) — the device default never filters reviews.
    const reviewArgs =
      options.dynamicQuestion === false ? ["--no-dynamic-question"] : [];
    if (isLlmEnabled && options.dynamicQuestion !== false) {
      isWaitingForQuestion = true;
      startQuestionWaitTimer();
    }
    const payload = await runBridge<ReviewPayload>("get-review", reviewArgs);
    if (requestId !== questionRequestId) return;
    finishQuestionWait();
    if (!payload.hasReview || !payload.card || !payload.prompt) {
      void finishStudySession();
      return;
    }

    activeCard = payload.card;
    activePromptQuestion = payload.prompt.question;
    resolvedContextContent = payload.resolvedContext?.content || null;

    cardsReviewedThisSession++;

    // Set progress string
    const totalSessionCards = Math.max(
      sessionStartedDue,
      sessionRatingTally.done + 1,
      cardsReviewedThisSession,
    );
    document.getElementById("card-progress")!.textContent =
      `${sessionRatingTally.done + 1} / ${totalSessionCards}`;

    // Set domain badge
    const domainBadge = document.getElementById("domain-badge")!;
    domainBadge.textContent = activeCard.domain || "general";

    // Set Bloom taxonomy badge
    const bloomBadge = document.getElementById("bloom-badge")!;
    const bloomVal = activeCard.bloomLevel || 1;
    bloomBadge.textContent = BLOOM_LEVEL_NAMES[currentLocale]?.[bloomVal] || BLOOM_LEVEL_NAMES["en"]?.[bloomVal] || `Level ${bloomVal}`;
    bloomBadge.className = `badge bloom-badge bloom-${bloomVal}`;

    const translationLoading = document.getElementById("translation-loading")!;
    translationLoading.classList.add("hidden");

    // Set question text and model attribution
    questionText.textContent = activePromptQuestion;
    setModelAttributionBadge(
      "question-model-badge",
      questionAttributionLabel(payload.questionSource, payload.questionModel),
    );
    textarea.disabled = false;
    textarea.focus();
  } catch (err) {
    if (requestId !== questionRequestId) return;
    finishQuestionWait();
    console.error("Failed to load next card:", err);
  } finally {
    if (requestId === questionRequestId) {
      cardLoadInProgress = false;
      updateReviewControlState();
    }
  }
}

// ── SUBMIT & REVEAL FLOW ──────────────────────────────────────────────────
async function submitAndReveal() {
  if (!activeCard || revealInProgress) return;
  revealInProgress = true;
  const requestId = ++evaluationRequestId;

  const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
  const userAnswer = textarea.value.trim();
  activeUserAnswer = userAnswer;

  textarea.disabled = true;
  document.getElementById("answer-capture-box")!.classList.add("hidden");

  let aiFeedbackText = "";
  let evaluationModel: string | null = null;
  let evaluationSuccessful = false;

  // Run LLM evaluation if enabled and user wrote an answer
  if (isLlmEnabled && userAnswer.length > 0) {
    document.getElementById("npu-loading")!.classList.remove("hidden");
    isWaitingForAi = true;

    // Start UI timeout check (triggers wait confirm after 30 seconds)
    startAiWaitTimer();

    try {
      const evalArgs = [
        "--slug", activeCard.slug,
        "--concept", activeCard.concept,
        "--domain", activeCard.domain,
        "--bloom-level", String(activeCard.bloomLevel),
        "--question", activePromptQuestion,
        "--user-answer", userAnswer
      ];

      if (activeCard.context) {
        evalArgs.push("--context", activeCard.context);
      }
      if (resolvedContextContent) {
        evalArgs.push("--source-content", resolvedContextContent);
      } else if (activeCard.sourceLink) {
        evalArgs.push("--source-link", activeCard.sourceLink);
      }

      const evalPayload = await runBridge<{
        success: boolean;
        evaluation: string;
        evaluationModel?: string | null;
        error?: string;
      }>("evaluate-answer", evalArgs);

      if (requestId !== evaluationRequestId) return;
      if (evalPayload.success) {
        aiFeedbackText = evalPayload.evaluation;
        evaluationModel = evalPayload.evaluationModel ?? null;
        evaluationSuccessful = true;
      } else {
        console.warn("LLM evaluation returned error state:", evalPayload.error);
      }
    } catch (err) {
      if (requestId !== evaluationRequestId) return;
      console.warn("LLM evaluation call failed:", err);
    } finally {
      if (requestId === evaluationRequestId) {
        finishAiWait();
      }
    }
  }

  if (requestId !== evaluationRequestId) return;
  renderReveal(aiFeedbackText, evaluationSuccessful, evaluationModel);
  revealInProgress = false;
}

function renderReveal(
  aiFeedbackText: string,
  evaluationSuccessful: boolean,
  evaluationModel: string | null,
) {
  if (!activeCard) return;

  // Display feedback if evaluated
  const feedbackContainer = document.getElementById("ai-feedback-container")!;
  const feedbackTextEl = document.getElementById("ai-feedback-text")!;
  
  if (evaluationSuccessful && aiFeedbackText) {
    feedbackTextEl.textContent = aiFeedbackText;
    setModelAttributionBadge(
      "evaluation-model-badge",
      evaluationModel
        ? tf("study_evaluation_model", { model: evaluationModel })
        : null,
    );
    feedbackContainer.classList.remove("hidden");
  } else {
    setModelAttributionBadge("evaluation-model-badge", null);
    feedbackContainer.classList.add("hidden");
  }

  // Populate Musterlösung / Reference Answer
  const revealContentList = document.getElementById("reveal-content-list")!;
  revealContentList.innerHTML = "";

  // Build rows via DOM + textContent (never innerHTML) so that card content —
  // which can include resolved remote source links / web text — cannot inject
  // markup or script into the Tauri webview.
  const addRevealRow = (labelKey: string, value: string, opts?: { code?: boolean }) => {
    const row = document.createElement("div");
    row.className = "reveal-item";

    const label = document.createElement("span");
    label.className = "reveal-label";
    label.textContent = `${t(labelKey)}:`;

    const val = document.createElement("span");
    val.className = "reveal-val";
    if (opts?.code) {
      const code = document.createElement("code");
      code.textContent = value;
      val.appendChild(code);
    } else {
      val.textContent = value;
    }

    row.append(label, document.createTextNode(" "), val);
    revealContentList.appendChild(row);
  };

  // 1. Concept Row
  addRevealRow("concept", activeCard.concept);

  // 2. Title Row (human friendly)
  addRevealRow("title", getDisplayTitle(activeCard));

  // 3. Token Slug Row (technical)
  addRevealRow("token", activeCard.slug, { code: true });

  // 3. Context Row (if any)
  if (activeCard.context) {
    addRevealRow("context", activeCard.context);
  }

  // 4. Source Reference / Code Context Row (if any)
  if (activeCard.sourceLink) {
    addRevealRow("source", activeCard.sourceLink, { code: true });

    if (resolvedContextContent) {
      const codeBox = document.createElement("pre");
      codeBox.className = "reveal-code-box";
      codeBox.textContent = resolvedContextContent;
      revealContentList.appendChild(codeBox);
    }
  }

  // Show/hide the static reference answer box based on whether local AI evaluation succeeded
  const answerBox = document.querySelector("#revealed-box .answer-box") as HTMLElement;
  if (answerBox) {
    if (evaluationSuccessful) {
      answerBox.classList.add("hidden");
    } else {
      answerBox.classList.remove("hidden");
    }
  }

  setupDiscussionForReveal(aiFeedbackText, evaluationSuccessful);

  // Show revealed box
  document.getElementById("revealed-box")!.classList.remove("hidden");
}

// ── POST-REVEAL DISCUSSION THREAD (ADR 2026-07-06b) ─────────────────────
function discussionElements() {
  return {
    box: document.getElementById("discussion-box")!,
    turns: document.getElementById("discussion-turns")!,
    input: document.getElementById("discussion-input") as HTMLTextAreaElement,
    send: document.getElementById("btn-discussion-send") as HTMLButtonElement,
    error: document.getElementById("discussion-error")!,
  };
}

/** Teardown on every exit action (rate/skip/pause/next card). */
function resetDiscussionUi(): void {
  resetDiscussion(discussion);
  const els = discussionElements();
  els.box.classList.add("hidden");
  els.turns.textContent = "";
  els.error.classList.add("hidden");
  els.input.value = "";
  els.input.disabled = false;
  els.send.disabled = false;
}

/**
 * The dialogue exists only after a successful AI evaluation (post-feedback).
 * Without a reachable recall provider the affordance stays hidden and the
 * one-shot flow is unchanged.
 */
function setupDiscussionForReveal(
  aiFeedbackText: string,
  evaluationSuccessful: boolean,
): void {
  resetDiscussionUi();
  if (!activeCard) return;
  const card: DiscussionCardContext = {
    slug: activeCard.slug,
    concept: activeCard.concept,
    domain: activeCard.domain,
    bloomLevel: activeCard.bloomLevel || 1,
    context: activeCard.context || null,
    question: activePromptQuestion,
    userAnswer: activeUserAnswer,
    sourceContent: resolvedContextContent,
    sourceLink: activeCard.sourceLink || null,
    feedback: aiFeedbackText,
  };
  if (!openDiscussion(discussion, card, { evaluationSuccessful })) return;
  discussionElements().box.classList.remove("hidden");
}

function appendDiscussionTurnEl(
  role: "user" | "assistant",
  content: string,
): HTMLElement {
  const turnsEl = discussionElements().turns;
  const turn = document.createElement("div");
  turn.className = `discussion-turn ${role}`;
  // textContent only — discussion content must never inject markup into the
  // webview (same discipline as renderReveal).
  const text = document.createElement("p");
  text.className = "discussion-turn-text";
  text.textContent = content;
  turn.appendChild(text);
  turnsEl.appendChild(turn);
  turn.scrollIntoView({ block: "nearest" });
  return turn;
}

async function sendDiscussionTurn(): Promise<void> {
  const els = discussionElements();
  const message = els.input.value.trim();
  const guard = beginTurn(discussion, message);
  if (guard === null || !discussion.card) return;

  els.error.classList.add("hidden");
  els.input.value = "";
  els.input.disabled = true;
  els.send.disabled = true;

  const userEl = appendDiscussionTurnEl("user", message);
  const pendingEl = appendDiscussionTurnEl("assistant", "…");
  pendingEl.classList.add("pending");

  const args = buildDiscussReviewArgs(discussion.card, discussion.turns, message);
  try {
    const payload = await runBridge<{
      success: boolean;
      reply: string;
      replyModel?: string | null;
      error?: string;
    }>("discuss-review", args);
    if (guard !== discussion.seq) return; // thread torn down while waiting
    pendingEl.remove();
    if (payload.success && payload.reply) {
      completeTurn(discussion, guard, message, payload.reply);
      appendDiscussionTurnEl("assistant", payload.reply);
    } else {
      failTurn(discussion, guard);
      userEl.remove();
      els.input.value = message;
      els.error.classList.remove("hidden");
      console.warn("Discussion turn returned error state:", payload.error);
    }
  } catch (err) {
    if (guard !== discussion.seq) return;
    pendingEl.remove();
    userEl.remove();
    failTurn(discussion, guard);
    els.input.value = message;
    els.error.classList.remove("hidden");
    console.warn("Discussion turn failed:", err);
  } finally {
    if (guard === discussion.seq) {
      els.input.disabled = false;
      els.send.disabled = false;
      els.input.focus();
    }
  }
}

// ── INTERACTIVE TIMEOUT TIMER ────────────────────────────────────────────
function startQuestionWaitTimer() {
  clearQuestionWaitTimer();

  questionWaitTimeoutId = window.setTimeout(() => {
    if (isWaitingForQuestion) {
      document.getElementById("question-wait-prompt")!.classList.remove("hidden");
    }
  }, 30000);
}

function clearQuestionWaitTimer() {
  if (questionWaitTimeoutId) {
    clearTimeout(questionWaitTimeoutId);
    questionWaitTimeoutId = null;
  }
  document.getElementById("question-wait-prompt")!.classList.add("hidden");
}

function finishQuestionWait() {
  clearQuestionWaitTimer();
  isWaitingForQuestion = false;
}

function startAiWaitTimer() {
  clearAiWaitTimer();

  // Triggers alert after 30 seconds
  waitTimeoutId = window.setTimeout(() => {
    if (isWaitingForAi) {
      document.getElementById("wait-prompt")!.classList.remove("hidden");
    }
  }, 30000);
}

function clearAiWaitTimer() {
  if (waitTimeoutId) {
    clearTimeout(waitTimeoutId);
    waitTimeoutId = null;
  }
  document.getElementById("wait-prompt")!.classList.add("hidden");
}

function finishAiWait() {
  clearAiWaitTimer();
  isWaitingForAi = false;
  document.getElementById("npu-loading")!.classList.add("hidden");
}

async function cancelActiveBridgeRequest(): Promise<void> {
  await invoke<boolean>("cancel_zam_bridge").catch((err) => {
    console.warn("Failed to cancel active bridge request:", err);
  });
}

async function useStoredQuestion(): Promise<void> {
  if (!isWaitingForQuestion) return;
  questionRequestId++;
  finishQuestionWait();
  await cancelActiveBridgeRequest();
  await loadNextCard({ dynamicQuestion: false });
}

function skipAiWaitingAndReveal() {
  if (!revealInProgress) return;
  evaluationRequestId++;
  void cancelActiveBridgeRequest();
  finishAiWait();
  renderReveal("", false, null);
  revealInProgress = false;
}

// ── RATING ACTION SUBMIT ─────────────────────────────────────────────────
const REVIEW_ACTION_CONTROL_IDS = [
  "btn-card-manage",
  "btn-study-manage-edit",
  "btn-study-manage-stop",
  "btn-study-stop",
  "btn-study-edit",
  "btn-study-open-editor",
  "btn-study-edit-save",
  "btn-study-edit-cancel",
  "btn-study-confirm-advanced",
  "btn-study-confirm-ok",
  "btn-study-confirm-cancel",
] as const;

const REVIEW_ACTION_TRIGGER_IDS = [
  "btn-card-manage",
  "btn-study-manage-edit",
  "btn-study-manage-stop",
  "btn-study-stop",
  "btn-study-edit",
  "btn-study-open-editor",
] as const;

// ── HANDS-FREE VOICE MODE (ADR 2026-07-31) ──────────────────────────────────

/** Machine-local preference; loaded from ~/.zam/config.json on first probe. */
let voicePreference: VoiceEnginePreference = readStoredPreference(undefined);
let voiceCapabilities: NativeVoiceCapabilities | null = null;
/**
 * The review locale `voiceCapabilities` was probed for.
 *
 * Device speech availability is per-language, so the cached answer is only
 * valid for the language it was asked about; switching the app language must
 * re-probe rather than reuse a verdict about a different one.
 */
let voiceCapabilitiesLocale: VoiceLocale | null = null;
let voiceCloudAvailability = { stt: false, tts: false };
let voiceProbePending = false;

/**
 * The tier plan in force right now. Recomputed on every probe and read by the
 * port on each utterance, so changing the preference in Settings takes effect
 * without restarting the session.
 */
function currentVoicePlan(): VoiceEnginePlan {
  return resolveVoiceEnginePlan(
    voicePreference,
    buildAvailability(
      voiceCapabilities ?? {
        sttLocal: false,
        ttsLocal: false,
        sttDetail: null,
        ttsDetail: null,
      },
      voiceCloudAvailability,
    ),
  );
}

/** Play cloud-synthesized audio in the page; resolves when playback ends. */
async function playVoiceAudio(audioBase64: string, mime: string): Promise<void> {
  const bytes = Uint8Array.from(atob(audioBase64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  try {
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Could not play the spoken answer"));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Tauri's `invoke` narrowed to the shape desktop/src/voice.ts expects. */
const voiceInvoke = (<T>(command: string, args?: unknown): Promise<T> =>
  invoke<T>(command, args as Record<string, unknown> | undefined));

const voiceController = createVoiceController(
  {
  currentCard: () => {
    if (!activeCard) return null;
    const textarea = document.getElementById(
      "user-answer-input",
    ) as HTMLTextAreaElement | null;
    return {
      question: activePromptQuestion,
      // The card's concept is what the reveal box shows as the reference
      // answer; mobile reads the same field (mobile/src/main.ts).
      expectedAnswer: activeCard.concept,
      revealed: !document
        .getElementById("revealed-box")!
        .classList.contains("hidden"),
      draftAnswer: textarea?.value ?? "",
    };
  },
  captureAnswer: (transcript) => {
    const textarea = document.getElementById(
      "user-answer-input",
    ) as HTMLTextAreaElement | null;
    if (textarea) textarea.value = transcript;
    activeUserAnswer = transcript;
  },
  revealAnswer: () => submitAndReveal(),
  rate: async (rating) => {
    await submitRating(rating);
    // Stop the loop when the session ended or no card followed.
    return studySessionActive && activeCard !== null;
  },
    setStatus: (message, isError) => setVoiceStatus(message, isError),
    locale: () => currentLocale,
  },
  createTieredVoicePort(currentVoicePlan, voiceInvoke, {
    transcribe: async (audioFile, mime, locale) => {
      const result = await runBridge("voice-transcribe", [
        "--audio-file", audioFile,
        "--mime", mime,
        "--locale", locale,
      ]);
      return String(result?.text ?? "");
    },
    synthesize: async (text, locale) => {
      const result = await runBridge("voice-synthesize", [
        "--text", text,
        "--locale", locale,
      ]);
      return {
        audioBase64: String(result?.audioBase64 ?? ""),
        mime: String(result?.mime ?? "audio/wav"),
      };
    },
    play: playVoiceAudio,
  },
  (capability, message) => {
    // Say it plainly and keep going. A misconfigured endpoint — a model the
    // provider does not actually serve — otherwise ends the session with a raw
    // gateway error, which is the worst possible moment to learn about it.
    setVoiceStatus(
      tf(
        capability === "tts" ? "voice_cloud_tts_failed" : "voice_cloud_stt_failed",
        { message },
      ),
      true,
    );
  }),
);

function setVoiceStatus(message: string, isError = false): void {
  const status = document.getElementById("voice-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function updateVoiceButton(): void {
  const button = document.getElementById(
    "btn-toggle-voice",
  ) as HTMLButtonElement | null;
  if (!button) return;
  button.textContent = voiceController.active
    ? t("voice_pause")
    : t("voice_start");
  button.setAttribute("aria-pressed", voiceController.active ? "true" : "false");
}

/**
 * Probe the device for the current review language and show or explain the
 * control.
 *
 * The probe is cached per locale rather than per app run: device speech
 * availability differs by language, so switching the app language invalidates
 * the previous answer and must ask again.
 */
async function refreshVoiceAvailability(): Promise<void> {
  if (voiceProbePending) return;
  voiceProbePending = true;
  try {
    const locale = resolveVoiceLocale(currentLocale);
    if (!voiceCapabilities || voiceCapabilitiesLocale !== locale) {
      try {
        const stored = await runBridge("voice-preference-get", []);
        voicePreference = readStoredPreference(stored?.preference);
      } catch (error) {
        console.warn("Falling back to the default voice preference", error);
      }
      voiceCapabilities = await probeNativeCapabilities(voiceInvoke, locale);
      voiceCapabilitiesLocale = locale;
    }
    try {
      const cloud = await runBridge("voice-availability", []);
      voiceCloudAvailability = {
        stt: cloud?.stt === true,
        tts: cloud?.tts === true,
      };
    } catch {
      // No configured speech model is a normal state, not an error.
      voiceCloudAvailability = { stt: false, tts: false };
    }
    const plan = currentVoicePlan();
    const controls = document.getElementById("voice-controls");
    const notice = document.getElementById("voice-unavailable");
    const usable = isVoiceModeUsable(plan);
    controls?.classList.toggle("hidden", !usable);
    if (notice) {
      notice.classList.toggle("hidden", usable);
      if (!usable) {
        const key = unavailableReasonKey(plan) ?? "voice_unavailable";
        const detail =
          voiceCapabilities.sttDetail ?? voiceCapabilities.ttsDetail ?? "";
        notice.textContent = detail ? `${t(key)} ${detail}` : t(key);
      }
    }
    if (usable) updateVoiceButton();
    const select = document.getElementById(
      "voice-preference-select",
    ) as HTMLSelectElement | null;
    if (select) select.value = voicePreference;
    renderVoicePreferenceDetail();
  } catch (error) {
    console.warn("Voice capability probe failed", error);
    document.getElementById("voice-controls")?.classList.add("hidden");
  } finally {
    voiceProbePending = false;
  }
}

async function pauseVoiceMode(): Promise<void> {
  if (!voiceController.active) return;
  await voiceController.pause();
  setVoiceStatus("");
  updateVoiceButton();
}

function startVoiceMode(): void {
  const locale = resolveVoiceLocale(currentLocale);
  updateVoiceButton();
  void voiceController
    .start(locale)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      setVoiceStatus(tf("voice_paused_msg", { message }), true);
    })
    .finally(updateVoiceButton);
  updateVoiceButton();
}

/**
 * Explain what the current choice means on *this* machine.
 *
 * A preference alone is not informative — "best quality" on a machine with no
 * cloud model configured still runs on the device, and the learner deserves to
 * know that rather than assume otherwise.
 */
function renderVoicePreferenceDetail(): void {
  const detail = document.getElementById("voice-preference-detail");
  if (!detail) return;
  if (!voiceCapabilities) {
    detail.textContent = "";
    return;
  }
  const plan = currentVoicePlan();
  if (!isVoiceModeUsable(plan)) {
    const key = unavailableReasonKey(plan) ?? "voice_unavailable";
    const reason =
      voiceCapabilities.sttDetail ?? voiceCapabilities.ttsDetail ?? "";
    detail.textContent = reason ? `${t(key)} ${reason}` : t(key);
    return;
  }
  detail.textContent = planLeavesDevice(plan)
    ? t("voice_detail_uses_cloud")
    : t("voice_detail_on_device");
}

async function applyVoicePreference(next: VoiceEnginePreference): Promise<void> {
  voicePreference = next;
  renderVoicePreferenceDetail();
  try {
    await runBridge("voice-preference-set", ["--preference", next]);
  } catch (error) {
    console.warn("Could not persist the voice preference", error);
  }
}

function updateReviewControlState(): void {
  const disabled = reviewActionInProgress || cardLoadInProgress || !activeCard;
  const stateBlocked =
    disabled || isStudyConfirmOpen() || isStudyInlineEditorOpen();
  document.querySelectorAll<HTMLButtonElement>(".rating-btn").forEach((button) => {
    button.disabled = stateBlocked;
  });
  for (const id of REVIEW_ACTION_CONTROL_IDS) {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button) button.disabled = disabled;
  }
  for (const id of REVIEW_ACTION_TRIGGER_IDS) {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button) button.disabled = stateBlocked;
  }
}

function beginReviewAction(): boolean {
  if (reviewActionInProgress || cardLoadInProgress) return false;
  reviewActionInProgress = true;
  updateReviewControlState();
  return true;
}

function endReviewAction(): void {
  reviewActionInProgress = false;
  updateReviewControlState();
}

function isStudyConfirmOpen(): boolean {
  const overlay = document.getElementById("study-confirm-overlay");
  return overlay?.classList.contains("active") ?? false;
}

function isStudyInlineEditorOpen(): boolean {
  const editor = document.getElementById("study-inline-editor");
  return editor !== null && !editor.classList.contains("hidden");
}

function focusStudyConfirmPrimary(): void {
  if (isStudyConfirmOpen()) {
    document.getElementById("btn-study-confirm-ok")?.focus();
  }
}

function showStudyActionError(label: string, err: unknown): void {
  console.error(label, err);
  alert(err instanceof Error ? err.message : String(err));
}

async function submitRating(ratingVal: number) {
  if (
    !activeCard ||
    isStudyConfirmOpen() ||
    isStudyInlineEditorOpen() ||
    !beginReviewAction()
  ) {
    return;
  }
  const cardId = activeCard.cardId;
  // Checking in the rating closes the thread (ADR 2026-07-06b).
  resetDiscussionUi();

  try {
    await runBridge("submit", [
      "--card-id", cardId,
      "--rating", String(ratingVal)
    ]);

    if (ratingVal >= 1 && ratingVal <= 4) {
      const r = ratingVal as 1 | 2 | 3 | 4;
      sessionRatingTally.ratings[r] += 1;
      sessionRatingTally.done += 1;
    }

    // Load next card or finish
    if (studySessionActive) await loadNextCard();
  } catch (err) {
    console.error("Failed to submit rating:", err);
  } finally {
    endReviewAction();
  }
}

// ── IN-RECALL CARD MANAGEMENT (ADR 2026-07-16b) ─────────────────────────────
type ImpactPreview = {
  review_logs?: number;
  cards?: number;
  session_steps?: number;
  agent_skills?: number;
};

let studyConfirmAction: "remove" | "delete" | null = null;
let studyConfirmSlug: string | null = null;

function renderImpactList(el: HTMLElement, impact: ImpactPreview): void {
  el.innerHTML = "";
  const add = (text: string) => {
    const li = document.createElement("li");
    li.textContent = `• ${text}`;
    el.appendChild(li);
  };
  if (impact.cards !== undefined)
    add(tf("lbl_impact_cards", { count: impact.cards }));
  if (impact.review_logs !== undefined)
    add(tf("lbl_impact_reviews", { count: impact.review_logs }));
  if (impact.session_steps !== undefined)
    add(tf("lbl_impact_steps", { count: impact.session_steps }));
  if (impact.agent_skills !== undefined)
    add(tf("lbl_impact_skills", { count: impact.agent_skills }));
}

function hideStudyConfirm(): void {
  document.getElementById("study-confirm-overlay")!.classList.remove("active");
  studyConfirmAction = null;
  studyConfirmSlug = null;
  updateReviewControlState();
}

function closeManageMenu(): void {
  document.getElementById("study-manage-menu")?.classList.add("hidden");
  document
    .getElementById("btn-card-manage")
    ?.setAttribute("aria-expanded", "false");
}

/**
 * Open the study confirm modal for the "Not for me" (delete-card) path, with
 * an advanced escalation to the permanent "Outdated — remove it" delete.
 */
async function openStopModal(): Promise<void> {
  if (
    !activeCard ||
    isStudyConfirmOpen() ||
    isStudyInlineEditorOpen() ||
    !beginReviewAction()
  ) {
    return;
  }
  const slug = activeCard.slug;
  closeManageMenu();
  try {
    const call = removePreviewCommand(slug);
    const preview = await runBridge<{ impact: ImpactPreview }>(
      call.cmd,
      call.args,
    );
    if (!studySessionActive || activeCard?.slug !== slug) return;
    document.getElementById("study-confirm-title")!.textContent = t(
      "lbl_confirm_remove_title",
    );
    document.getElementById("study-confirm-desc")!.textContent = t(
      "lbl_confirm_remove_desc",
    );
    renderImpactList(
      document.getElementById("study-confirm-impact")!,
      preview.impact ?? {},
    );
    document
      .getElementById("study-confirm-advanced")!
      .classList.remove("hidden");
    document.getElementById("btn-study-confirm-ok")!.textContent =
      t("study_stop_not_for_me");
    document.getElementById("btn-study-confirm-advanced")!.textContent =
      t("study_stop_outdated");
    studyConfirmAction = "remove";
    studyConfirmSlug = slug;
    document.getElementById("study-confirm-overlay")!.classList.add("active");
  } catch (err) {
    showStudyActionError("Stop preview failed:", err);
  } finally {
    endReviewAction();
    focusStudyConfirmPrimary();
  }
}

/** Escalate to the permanent token delete: re-preview with full impact. */
async function escalateToOutdated(): Promise<void> {
  if (!studyConfirmSlug || !beginReviewAction()) return;
  const slug = studyConfirmSlug;
  try {
    const call = deletePreviewCommand(slug);
    const preview = await runBridge<{ impact: ImpactPreview }>(
      call.cmd,
      call.args,
    );
    // User may have cancelled or left the study view while the preview was in
    // flight — do not revive a closed dialog with a dangling action state.
    if (
      !studySessionActive ||
      !isStudyConfirmOpen() ||
      studyConfirmSlug !== slug
    ) {
      return;
    }
    document.getElementById("study-confirm-title")!.textContent = t(
      "lbl_confirm_delete_title",
    );
    document.getElementById("study-confirm-desc")!.textContent = t(
      "lbl_confirm_delete_desc",
    );
    renderImpactList(
      document.getElementById("study-confirm-impact")!,
      preview.impact ?? {},
    );
    document.getElementById("study-confirm-advanced")!.classList.add("hidden");
    document.getElementById("btn-study-confirm-ok")!.textContent =
      t("study_stop_outdated");
    studyConfirmAction = "delete";
  } catch (err) {
    showStudyActionError("Outdated preview failed:", err);
  } finally {
    endReviewAction();
    focusStudyConfirmPrimary();
  }
}

/** Confirm button: run the selected destructive action, then advance. */
async function confirmStudyStop(): Promise<void> {
  if (!studyConfirmSlug || !studyConfirmAction || !beginReviewAction()) return;
  const slug = studyConfirmSlug;
  const action = studyConfirmAction;
  try {
    const call =
      action === "remove"
        ? removeConfirmCommand(slug)
        : deleteConfirmCommand(slug);
    await runBridge(call.cmd, call.args);
    hideStudyConfirm();
    // Mirror submitRating: nav can leave the study view while the confirm
    // bridge call is in flight — only advance the queue if we still own it.
    if (studySessionActive) await loadNextCard();
  } catch (err) {
    showStudyActionError("Stop action failed:", err);
  } finally {
    endReviewAction();
    focusStudyConfirmPrimary();
  }
}

// ── inline edit ──
function openInlineEditor(): void {
  if (
    !activeCard ||
    reviewActionInProgress ||
    cardLoadInProgress ||
    isStudyConfirmOpen()
  ) {
    return;
  }
  closeManageMenu();
  (document.getElementById("study-edit-question") as HTMLTextAreaElement).value =
    activePromptQuestion;
  (document.getElementById("study-edit-concept") as HTMLTextAreaElement).value =
    activeCard.concept;
  document.getElementById("study-inline-editor")!.classList.remove("hidden");
  updateReviewControlState();
  (document.getElementById("study-edit-question") as HTMLTextAreaElement).focus();
}

function closeInlineEditor(): void {
  document.getElementById("study-inline-editor")!.classList.add("hidden");
  updateReviewControlState();
}

async function saveInlineEdit(): Promise<void> {
  if (
    !activeCard ||
    !isStudyInlineEditorOpen() ||
    reviewActionInProgress ||
    cardLoadInProgress
  ) {
    return;
  }
  const slug = activeCard.slug;
  const question = (
    document.getElementById("study-edit-question") as HTMLTextAreaElement
  ).value;
  const concept = (
    document.getElementById("study-edit-concept") as HTMLTextAreaElement
  ).value;
  let call: { cmd: string; args: string[] };
  try {
    call = editCommand({ slug, question, concept });
  } catch (err) {
    if (err instanceof StudyEditError) {
      alert(
        err.reason === "concept-required"
          ? t("lbl_err_concept_required")
          : t("lbl_err_question_required"),
      );
      return;
    }
    throw err;
  }
  if (!beginReviewAction()) return;
  try {
    await runBridge(call.cmd, call.args);
    if (!studySessionActive || activeCard?.slug !== slug) return;
    // Reflect the edit in place (no full re-render — feedback stays put).
    activeCard.concept = concept.trim();
    activePromptQuestion = question.trim();
    document.getElementById("question-text")!.textContent = activePromptQuestion;
    const conceptVal = document
      .getElementById("reveal-content-list")!
      .querySelector(".reveal-item .reveal-val");
    if (conceptVal) conceptVal.textContent = activeCard.concept;
    closeInlineEditor();
    alert(t("lbl_card_saved_toast"));
  } catch (err) {
    showStudyActionError("Inline edit failed:", err);
  } finally {
    endReviewAction();
  }
}

// ── pre-reveal manage menu ──
function toggleManageMenu(): void {
  if (
    !activeCard ||
    reviewActionInProgress ||
    cardLoadInProgress ||
    isStudyInlineEditorOpen() ||
    isStudyConfirmOpen()
  ) {
    closeManageMenu();
    return;
  }
  const menu = document.getElementById("study-manage-menu")!;
  const btn = document.getElementById("btn-card-manage")!;
  const open = menu.classList.toggle("hidden") === false;
  btn.setAttribute("aria-expanded", String(open));
}

async function jumpToFullEditor(): Promise<void> {
  if (
    !activeCard ||
    reviewActionInProgress ||
    cardLoadInProgress ||
    isStudyInlineEditorOpen() ||
    isStudyConfirmOpen()
  ) {
    return;
  }
  const slug = activeCard.slug;
  closeManageMenu();
  // skipStudioLoad: openCardInEditor is the sole loader+select for this jump.
  switchView("learning-content-view", { skipStudioLoad: true });
  const found = await openCardInEditor(slug);
  if (!found) {
    const message = `Card not found in editor: ${slug}`;
    console.warn(message);
    alert(`${t("lbl_error_loading")}: ${message}`);
  }
}

// ── SESSION COMPLETION / SUMMARY ─────────────────────────────────────────
function resetSessionTally(): void {
  sessionRatingTally.done = 0;
  sessionRatingTally.ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
  cardsReviewedThisSession = 0;
  sessionStartedDue = totalDue;
  sessionSummaryVisible = false;
}

function prepareStudyViewForSession(): void {
  document.getElementById("session-summary")?.classList.add("hidden");
  document.getElementById("study-active-card")?.classList.remove("hidden");
  document.getElementById("study-footer")?.classList.remove("hidden");
  resetSessionTally();
}

function renderSessionSummary(): void {
  const summary = document.getElementById("session-summary");
  const titleEl = document.getElementById("session-summary-title");
  const subEl = document.getElementById("session-summary-sub");
  const spreadEl = document.getElementById("session-summary-spread");
  const doneBtn = document.getElementById("btn-session-summary-done");
  if (!summary || !titleEl || !subEl || !spreadEl || !doneBtn) return;

  const total = Math.max(sessionStartedDue, sessionRatingTally.done);
  titleEl.textContent = t("lbl_recall_summary_title");
  subEl.textContent =
    sessionRatingTally.done > 0
      ? tf("lbl_recall_summary", {
          done: sessionRatingTally.done,
          total,
        })
      : t("session_completed_sub");

  spreadEl.replaceChildren();
  if (sessionRatingTally.done > 0) {
    for (const r of [1, 2, 3, 4] as const) {
      const chip = document.createElement("span");
      chip.className = "session-summary-chip";
      chip.textContent = `${t(`lbl_rate_${r}`)}: ${sessionRatingTally.ratings[r]}`;
      spreadEl.appendChild(chip);
    }
  }

  doneBtn.textContent = t("btn_back_to_dashboard");

  document.getElementById("study-active-card")?.classList.add("hidden");
  document.getElementById("study-footer")?.classList.add("hidden");
  summary.classList.remove("hidden");
}

/**
 * End the study session (button, Escape, or empty queue) and show the results
 * summary. Pause vs end is intentionally the same path — one exit, one summary.
 */
async function finishStudySession(): Promise<void> {
  if (sessionSummaryVisible) return;
  sessionSummaryVisible = true;
  studySessionActive = false;
  void pauseVoiceMode();

  evaluationRequestId++;
  if (revealInProgress) cancelActiveBridgeRequest();
  revealInProgress = false;
  finishAiWait();
  finishQuestionWait();
  closeManageMenu();
  closeInlineEditor();
  if (isStudyConfirmOpen()) hideStudyConfirm();
  resetDiscussionUi();
  activeCard = null;
  updateReviewControlState();

  if (observerWatchRunning) {
    await stopObserverWatch();
  }
  await closeUiLearningSession();

  // Keep the study view visible so the summary can render in place.
  document
    .querySelectorAll(".view")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("study-view")?.classList.add("active");
  setActiveNav("study-view");
  renderSessionSummary();
}

function leaveSessionSummaryToDashboard(): void {
  document.getElementById("session-summary")?.classList.add("hidden");
  document.getElementById("study-active-card")?.classList.remove("hidden");
  document.getElementById("study-footer")?.classList.remove("hidden");
  sessionSummaryVisible = false;
  resetSessionTally();
  switchView("dashboard-view");
  void loadDashboard();
}

// ── KEYBOARD SHORTCUTS & EVENT BINDINGS ──────────────────────────────────
/**
 * Dev-only gate for the manual "UI Observer" capture panel. Capture scope is
 * normally decided by the Agent harness (ADR 2026-06-23), so this panel is
 * hidden by default. Enable it for debugging from the devtools console:
 *   localStorage.setItem("zam:dev-observer", "1")  // then reload
 */
function devObserverEnabled(): boolean {
  try {
    return localStorage.getItem("zam:dev-observer") === "1";
  } catch {
    return false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  applyTheme(loadThemePreference());
  initializeTranslations();
  setupLocaleSwitcher();
  initLearningContentStudio();
  initCurriculumWizard();
  // Text-LLM-offline in the wizard links back to the onboarding model page
  // instead of dead-ending in an error (ADR 2026-07-24 §7, plan Phase 9).
  setCurriculumWizardModelSetup(() => showOnboardingAt("model"));
  initServerDbWizard(
    () => void loadDatabaseStatus(),
    { openExternal: (url: string) => void openUrl(url) },
  );
  initMobilePairing(() => void loadDatabaseStatus());
  // Goal-driven import stays reachable outside first run (plan Phase 8):
  // Learning Content's "Goal import" reopens the flow at the goal page.
  document
    .getElementById("btn-content-goal-import")
    ?.addEventListener("click", () => showOnboardingAt("goal"));
  onboardingController = initOnboarding({
    getStepContext: () => ({
      personas: onboardingPersonas,
      selectedPersonaId: onboardingPersonaId,
      cloudProviders: onboardingCloudProviders,
      localAiCapable: onboardingLocalAiCapable,
      aiConnected: isLlmEnabled,
      embedding: onboardingEmbedding,
      agentOffers: onboardingAgentOffers,
      workspaceDir: activeWorkspaceDir ?? "",
      activeWorkspaceId: activeWorkspaceId ?? "",
      workspaceStructure: onboardingWorkspaceStructure,
    }),
    openExternal: (url) => void openUrl(url),
    // Both entry points are document-level modal overlays initialized at
    // startup, so triggering their buttons opens them on top of the flow.
    openContentEntry: (entry) => {
      const id =
        entry === "curriculum"
          ? "btn-content-curriculum-wizard"
          : "btn-content-import";
      document.getElementById(id)?.click();
    },
    onLeave: (reason) => {
      switchView("dashboard-view");
      // Reload on BOTH paths so the checklist and status badges reflect what
      // happened inside the flow (Phase 9). "Finish later" first disarms the
      // session's auto-show gate — the machine-local first-run gate stays
      // armed for the next start, but this reload must not bounce back.
      if (reason === "later") onboardingDeferredThisSession = true;
      void loadDashboard();
    },
  });

  // Load initial dashboard state
  loadDashboard();
  void loadAppVersion();
  repairInstallationOnVersionChange();

  // The manual UI Observer is a developer-only affordance; reveal it only when
  // the dev key is set (see devObserverEnabled).
  if (devObserverEnabled()) {
    document.getElementById("observer-panel")?.classList.remove("hidden");
  }

  // Start Session Button
  document.getElementById("btn-start-session")!.addEventListener("click", () => {
    void (async () => {
      prepareStudyViewForSession();
      await ensureUiLearningSession("Desktop learning session");
      switchView("study-view");
      loadNextCard();
    })();
  });

  document.getElementById("nav-dashboard")?.addEventListener("click", () => {
    switchView("dashboard-view");
  });

  document.getElementById("nav-content")?.addEventListener("click", () => {
    switchView("learning-content-view");
  });

  document.getElementById("nav-settings")?.addEventListener("click", () => {
    switchView("settings-view");
  });

  document.getElementById("nav-stats")?.addEventListener("click", () => {
    switchView("stats-view");
  });

  document.getElementById("btn-stats-back")?.addEventListener("click", () => {
    switchView("dashboard-view");
  });

  document.getElementById("stats-period-day")?.addEventListener("click", () => {
    setStatsPeriod("day");
  });
  document.getElementById("stats-period-week")?.addEventListener("click", () => {
    setStatsPeriod("week");
  });
  document.getElementById("stats-period-month")?.addEventListener("click", () => {
    setStatsPeriod("month");
  });

  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    switchView("settings-view");
  });

  document.getElementById("btn-agents-connect-all")?.addEventListener("click", () => {
    void connectAgentHarness();
  });

  document.getElementById("btn-settings-back")?.addEventListener("click", () => {
    switchView("dashboard-view");
  });

  document.getElementById("btn-run-onboarding")?.addEventListener("click", () => {
    showOnboarding();
  });

  document.getElementById("theme-select")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    saveThemePreference(value === "dark" ? "dark" : "light");
  });

  document.getElementById("device-context-select")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    void (async () => {
      try {
        await runBridge<any>("set-active-knowledge-context", [value || "none"]);
      } catch (err) {
        console.error("Failed to update active knowledge context", err);
      }
    })();
  });

  document
    .getElementById("database-user-select")
    ?.addEventListener("change", (event) => {
      void selectDatabaseUser((event.target as HTMLSelectElement).value);
    });

  document
    .getElementById("btn-refresh-database-status")
    ?.addEventListener("click", () => {
      void loadDatabaseStatus();
    });

  // Setup & Data: reveal the data folder, back up the database.
  document
    .getElementById("btn-open-data-folder")
    ?.addEventListener("click", () => {
      void (async () => {
        const status = document.getElementById("setup-status");
        try {
          // Dedicated command resolves ~/.zam server-side, so the webview never
          // passes arbitrary paths to the opener (tighter than allow-open-path).
          await invoke("open_data_folder");
        } catch (err) {
          if (status) {
            status.textContent = tf("setup_open_folder_failed", {
              message: errorMessage(err),
            });
          }
        }
      })();
    });

  document.getElementById("btn-open-terminal")?.addEventListener("click", () => {
    void (async () => {
      await openWorkspaceTerminal();
    })();
  });

  document.getElementById("btn-backup-db")?.addEventListener("click", () => {
    void (async () => {
      const status = document.getElementById("setup-status");
      if (status) status.textContent = t("setup_backing_up");
      try {
        const res = await runBridge<{
          ok?: boolean;
          path?: string;
          reason?: string;
          target?: string;
        }>("backup-db");
        if (!status) return;
        if (res.ok && res.path) {
          status.textContent = tf("setup_backed_up", { path: res.path });
        } else if (res.reason === "remote") {
          status.textContent = tf("setup_remote_no_backup", {
            target: res.target ?? "remote",
          });
        } else {
          status.textContent = t("setup_backup_failed_generic");
        }
      } catch (err) {
        if (status) {
          status.textContent = tf("setup_backup_failed", {
            message: errorMessage(err),
          });
        }
      }
    })();
  });

  document.getElementById("btn-toggle-ai-config")?.addEventListener("click", () => {
    toggleAiConfigEditor();
  });

  document.getElementById("btn-add-ai-provider")?.addEventListener("click", () => {
    void showModelForm();
  });

  document.getElementById("btn-check-updates")?.addEventListener("click", () => {
    void checkDesktopUpdates();
  });

  document.getElementById("btn-open-releases")?.addEventListener("click", () => {
    void openReleasesPage();
  });

  // Setup & Data: choose the workspace directory (native folder picker).
  document
    .getElementById("btn-choose-workspace")
    ?.addEventListener("click", () => {
      void (async () => {
        const status = document.getElementById("setup-status");
        try {
          const selected = await openFolderDialog({
            directory: true,
            multiple: false,
            title: t("btn_choose_workspace"),
          });
          if (typeof selected !== "string") return; // cancelled
          const res = await runBridge<{
            ok?: boolean;
            workspace?: WorkspaceConfig;
            activeWorkspaceId?: string;
            activeWorkspace?: WorkspaceConfig;
            workspaceDir?: string;
          }>("workspace-add", ["--path", selected]);
          if (res.workspaceDir) {
            activeWorkspaceId = res.activeWorkspaceId ?? res.workspace?.id ?? null;
            activeWorkspaceDir = res.workspaceDir;
            await loadWorkspaceList();
            if (status) {
              status.textContent = tf("workspace_added", {
                path: res.workspaceDir,
              });
            }
          }
        } catch (err) {
          if (status) {
            status.textContent = tf("workspace_pick_failed", {
              message: errorMessage(err),
            });
          }
        }
      })();
    });

  // Open 3D Graph (experimental)
  const openGraphBtn = document.getElementById("btn-open-graph") as HTMLButtonElement | null;
  if (openGraphBtn) {
    openGraphBtn.textContent = t("btn_open_graph");
    openGraphBtn.addEventListener("click", () => {
      switchView("graph-view");
    });
  }

  document.getElementById("btn-observer-refresh")!.addEventListener("click", () => {
    void listObserverWindows();
  });

  document.getElementById("observer-window-select")!.addEventListener("change", () => {
    updateObserverSelection();
  });

  document.getElementById("btn-observer-analyze")!.addEventListener("click", () => {
    void analyzeSelectedObserverWindow();
  });

  document.getElementById("btn-observer-cancel")!.addEventListener("click", () => {
    cancelObserverAnalysis();
  });

  document.getElementById("btn-observer-loop-start")!.addEventListener("click", () => {
    startObserverLoop();
  });

  document.getElementById("btn-observer-loop-stop")!.addEventListener("click", () => {
    stopObserverLoop();
  });

  document.getElementById("btn-observer-watch-start")!.addEventListener("click", () => {
    void startObserverWatch();
  });

  document.getElementById("btn-observer-watch-stop")!.addEventListener("click", () => {
    void stopObserverWatch();
  });

  document.getElementById("btn-observer-reports-refresh")!.addEventListener("click", () => {
    void loadObserverReports({ updateStatus: true });
  });

  // Graph back + refresh
  const backBtn = document.getElementById("btn-graph-back");
  if (backBtn) backBtn.addEventListener("click", () => {
    disposeGraph();
    switchView("dashboard-view");
    loadDashboard();
  });

  const refreshBtn = document.getElementById("btn-graph-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", () => {
    if (currentNeighborhood?.center?.slug) {
      loadGraphFocus(currentNeighborhood.center.slug);
    }
  });

  const learnerFilterCheckbox = document.getElementById(
    "graph-filter-by-learner",
  ) as HTMLInputElement | null;
  if (learnerFilterCheckbox) {
    learnerFilterCheckbox.addEventListener("change", () => {
      graphFilterByLearner = learnerFilterCheckbox.checked;
      updateGraphLearnerFilterUi();
      void refreshGraphScope();
    });
  }

  // End session → summary (no separate pause path)
  document.getElementById("btn-pause-session")!.addEventListener("click", () => {
    void finishStudySession();
  });

  document
    .getElementById("btn-session-summary-done")
    ?.addEventListener("click", () => {
      leaveSessionSummaryToDashboard();
    });

  // Submit Answer / Reveal Answer Button
  document
    .getElementById("toggle-dynamic-questions")
    ?.addEventListener("change", (event) => {
      void setDynamicQuestions((event.target as HTMLInputElement).checked);
    });

  document.getElementById("btn-reveal-answer")!.addEventListener("click", () => {
    submitAndReveal();
  });

  document
    .getElementById("voice-preference-select")
    ?.addEventListener("change", (event) => {
      const value = (event.target as HTMLSelectElement).value;
      void applyVoicePreference(readStoredPreference(value));
    });

  document.getElementById("btn-toggle-voice")?.addEventListener("click", () => {
    if (voiceController.active) {
      void pauseVoiceMode();
    } else {
      startVoiceMode();
    }
  });

  // Keep Waiting Button in Timeout dialog
  document.getElementById("btn-wait-keep")!.addEventListener("click", () => {
    document.getElementById("wait-prompt")!.classList.add("hidden");
    startAiWaitTimer(); // restarts 30s timer
  });

  // Skip Offline Button in Timeout dialog
  document.getElementById("btn-wait-skip")!.addEventListener("click", () => {
    skipAiWaitingAndReveal();
  });

  // Dynamic-question timeout dialog
  document.getElementById("btn-question-wait-keep")!.addEventListener("click", () => {
    document.getElementById("question-wait-prompt")!.classList.add("hidden");
    startQuestionWaitTimer();
  });

  document.getElementById("btn-question-use-saved")!.addEventListener("click", () => {
    void useStoredQuestion();
  });

  // Rating Buttons (1-4 clicks)
  document.querySelectorAll(".rating-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rating = Number(btn.getAttribute("data-rating"));
      if (rating >= 1 && rating <= 4) {
        submitRating(rating);
      }
    });
  });

  // In-recall card management (ADR 2026-07-16b)
  document
    .getElementById("btn-study-stop")!
    .addEventListener("click", () => void openStopModal());
  document
    .getElementById("btn-study-edit")!
    .addEventListener("click", () => openInlineEditor());
  document
    .getElementById("btn-study-open-editor")!
    .addEventListener("click", () => void jumpToFullEditor());
  document
    .getElementById("btn-study-edit-save")!
    .addEventListener("click", () => void saveInlineEdit());
  document
    .getElementById("btn-study-edit-cancel")!
    .addEventListener("click", () => closeInlineEditor());

  document.getElementById("btn-card-manage")!.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleManageMenu();
  });
  document
    .getElementById("btn-study-manage-edit")!
    .addEventListener("click", () => openInlineEditor());
  document
    .getElementById("btn-study-manage-stop")!
    .addEventListener("click", () => void openStopModal());
  document.addEventListener("click", () => closeManageMenu());

  document
    .getElementById("btn-study-confirm-advanced")!
    .addEventListener("click", () => void escalateToOutdated());
  document
    .getElementById("btn-study-confirm-ok")!
    .addEventListener("click", () => void confirmStudyStop());
  document
    .getElementById("btn-study-confirm-cancel")!
    .addEventListener("click", () => hideStudyConfirm());

  // Post-reveal discussion thread: send button + Enter-to-send
  document.getElementById("btn-discussion-send")!.addEventListener("click", () => {
    void sendDiscussionTurn();
  });
  document.getElementById("discussion-input")!.addEventListener("keydown", (e) => {
    const key = e as KeyboardEvent;
    if (key.key === "Enter" && !key.shiftKey) {
      key.preventDefault();
      void sendDiscussionTurn();
    }
  });

  // Keyboard events
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // 1. Esc key → end session + summary (same as the footer button)
    if (e.key === "Escape" && studySessionActive) {
      if (reviewActionInProgress || cardLoadInProgress) return;
      if (isStudyConfirmOpen()) {
        hideStudyConfirm();
        return;
      }
      if (isStudyInlineEditorOpen()) {
        closeInlineEditor();
        return;
      }
      void finishStudySession();
      return;
    }

    // 2. Textarea triggers
    const target = e.target;
    // Buttons must NOT count as editable: after "Submit & Reveal" the focus
    // stays on #btn-reveal-answer, and classifying it as editable would block
    // the primary post-reveal path of pressing 1–4. Dialog/editor guards below
    // already suppress ratings while stop/edit UI is open.
    const isEditableTarget =
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable);
    const isAnswerFocused =
      document.activeElement === document.getElementById("user-answer-input");
    
    if (studySessionActive && isAnswerFocused) {
      // Ctrl+Enter or Shift+Enter inside textarea -> Reveal answer
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submitAndReveal();
      }
      return;
    }

    // 3. FSRS Ratings keys (1-4)
    if (studySessionActive) {
      const revealedBox = document.getElementById("revealed-box")!;
      const isRevealed = !revealedBox.classList.contains("hidden");
      const rating = ratingShortcutForKey(e.key, {
        editableTarget: isEditableTarget,
        revealed: isRevealed,
        dialogOpen: isStudyConfirmOpen(),
        editorOpen: isStudyInlineEditorOpen(),
        actionInProgress: reviewActionInProgress || cardLoadInProgress,
      });
      if (rating !== null) void submitRating(rating);
    }
  });
});
