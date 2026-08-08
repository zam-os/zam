/**
 * ZAM mobile: standalone first run, recall/import/voice, and — once a learner
 * attaches a server database — pairing and its sync status.
 */

import { invoke } from "@tauri-apps/api/core";
import {
  checkPermissions,
  Format,
  openAppSettings,
  requestPermissions,
  scan,
} from "@tauri-apps/plugin-barcode-scanner";
import {
  parseZamPairPayload,
  serializeZamPairPayload,
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairLlmEndpoint,
  type ZamPairPayloadV1,
} from "../../src/bridge/mobile-pairing.js";
import {
  buildReviewQueue,
  type ReviewQueue,
} from "../../src/kernel/scheduler/queue.js";
import {
  evaluateMobileAnswer,
  evaluationSpeech,
  type MobileEvaluationResult,
  type OnDeviceLlmGenerateResult,
  type OnDeviceLlmStatus,
} from "./evaluate.js";
import {
  applyStaticTranslations,
  cardWord,
  getLocale,
  resolveLocale,
  setLocale,
  t,
  tf,
} from "./i18n.js";
import { downscaleImageFile } from "./image-import.js";
import {
  confirmMobileImport,
  type MobileTokenDraft,
  parseMobileImport,
} from "./import.js";
import {
  createMultiDraftController,
  type MultiDraftController,
} from "./multi-draft.js";
import { getSetting } from "../../src/kernel/models/settings.js";
import { createTauriDatabase } from "./provider.js";
import {
  completeFirstRun,
  type LocalSetup,
  prepareLocalLibrary,
} from "./setup/first-run.js";
import { starterCards } from "./setup/starter-content.js";
import { initSetupWizard, type SetupChoices } from "./setup/wizard.js";
import { createNav } from "./ui/nav.js";
import {
  formatTimeInput,
  millisUntilNext,
  parseReminderConfig,
  parseTimeInput,
  REMINDER_STORAGE_KEY,
  type ReminderConfig,
} from "./reminder.js";
import {
  MobileReviewSession,
  type MobileReviewSummary,
} from "./review-session.js";
import {
  loadStatsView,
  type StatsFormatters,
  type StatsPeriod,
  type StatsView,
} from "./stats.js";
import { SyncError, syncWithRetry } from "./sync.js";
import {
  DEFAULT_MOBILE_UPDATE_MANIFEST,
  type MobileUpdateInfo,
} from "./update.js";
import {
  resolveMobileVisionEndpoint,
  visionImportUnavailableReason,
} from "./vision-config.js";
import { decomposeImageViaVision } from "./vl-import.js";
import { resolveMobileCloudChain } from "./model-registry.js";
import { synthesizeViaCloud, transcribeViaCloud } from "./speech.js";
import {
  buildMobileAvailability,
  cloudSpeechAvailability,
  createMobileTieredVoicePort,
  HandsFreeReviewController,
  isVoiceModeUsable,
  type MobileVoiceCapabilities,
  type MobileVoiceNative,
  planLeavesDevice,
  readStoredVoicePreference,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  VOICE_ENGINE_PREFERENCES,
  VOICE_PREFERENCE_STORAGE_KEY,
  type VoiceEnginePlan,
  type VoiceEnginePreference,
  type VoiceLocale,
  type VoicePort,
  voiceUnavailableKey,
} from "./voice.js";

const db = createTauriDatabase((command, args) => invoke(command, args));
const nav = createNav();

interface DatabaseDescription {
  mode: "local" | "remote" | "closed";
  location?: string;
  sizeBytes?: number;
}

/**
 * Settings says where the library lives, in the learner's terms. On a
 * device-local library that line is the whole answer to "where is my
 * learning, and what would I lose" — which is why it carries the size rather
 * than a file path nobody can act on.
 */
async function refreshStorageRow(): Promise<void> {
  const row = document.getElementById("settings-storage");
  if (!row) return;
  try {
    const info = await invoke<DatabaseDescription>("db_describe");
    if (info.mode === "remote") {
      row.textContent = t("storage_server");
      return;
    }
    const megabytes = (info.sizeBytes ?? 0) / 1_000_000;
    row.textContent = tf("storage_local", {
      // toFixed would print "0.2" in German, where the separator is a comma.
      size:
        megabytes < 0.1
          ? "< 0,1"
          : megabytes.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            }),
    });
  } catch {
    // A settings row is never worth an error dialog.
    row.textContent = "—";
  }
}
const reviewSession = new MobileReviewSession(db, localStorage);

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
}

const scanButton = element<HTMLButtonElement>("scan-pairing-code");
const cameraSettingsButton = element<HTMLButtonElement>("camera-settings");
const cancelPairingButton = element<HTMLButtonElement>("cancel-pairing");
const manualForm = element<HTMLFormElement>("manual-pairing-form");
const manualUrl = element<HTMLInputElement>("manual-sync-url");
const manualToken = element<HTMLInputElement>("manual-auth-token");
const manualUser = element<HTMLInputElement>("manual-user-id");
const pairingStatus = element<HTMLParagraphElement>("pairing-status");
const learner = element<HTMLElement>("learner");
const connection = element<HTMLElement>("connection");
const statusLine = element<HTMLParagraphElement>("status");
const summary = element<HTMLElement>("summary");
const queueList = element<HTMLOListElement>("queue");
const startReviewButton = element<HTMLButtonElement>("start-review");
const openImportButton = element<HTMLButtonElement>("open-import");
const statsSummary = element<HTMLParagraphElement>("stats-summary");
const statsRows = element<HTMLElement>("stats-rows");
const importFile = element<HTMLInputElement>("import-file");
const importInput = element<HTMLTextAreaElement>("import-input");
const importImage = element<HTMLInputElement>("import-image");
const prepareImportButton = element<HTMLButtonElement>("prepare-import");
const decomposeImageButton = element<HTMLButtonElement>("decompose-image");
const cancelImportButton = element<HTMLButtonElement>("cancel-import");
const importStatus = element<HTMLParagraphElement>("import-status");
const importDraftForm = element<HTMLFormElement>("import-draft-form");
const importDraftProgress = element<HTMLParagraphElement>(
  "import-draft-progress",
);
const importSlug = element<HTMLInputElement>("import-slug");
const importTitle = element<HTMLInputElement>("import-title");
const importConcept = element<HTMLTextAreaElement>("import-concept");
const importDomain = element<HTMLInputElement>("import-domain");
const importBloom = element<HTMLSelectElement>("import-bloom");
const importQuestion = element<HTMLTextAreaElement>("import-question");
const importContext = element<HTMLTextAreaElement>("import-context");
const importSourceLink = element<HTMLInputElement>("import-source-link");
const importPrerequisites = element<HTMLInputElement>("import-prerequisites");
const importKnowledgeContexts = element<HTMLInputElement>(
  "import-knowledge-contexts",
);
const importSymbiosisMode = element<HTMLSelectElement>("import-symbiosis-mode");
const confirmImportButton = element<HTMLButtonElement>("confirm-import");
const skipImportDraftButton = element<HTMLButtonElement>("skip-import-draft");
const reviewProgress = element<HTMLElement>("review-progress");
const reviewProgressFill = element<HTMLElement>("review-progress-fill");
const reviewMeta = element<HTMLElement>("review-meta");
const toggleVoiceButton = element<HTMLButtonElement>("toggle-voice");
const installVoiceDataButton = element<HTMLButtonElement>("install-voice-data");
const reviewQuestion = element<HTMLElement>("review-question");
const reviewAnswer = element<HTMLTextAreaElement>("review-answer");
const revealAnswerButton = element<HTMLButtonElement>("reveal-answer");
const revealedAnswer = element<HTMLElement>("revealed-answer");
const expectedAnswer = element<HTMLElement>("expected-answer");
const reviewSource = element<HTMLAnchorElement>("review-source");
const evaluationPanel = element<HTMLElement>("evaluation-panel");
const evaluationVerdict = element<HTMLElement>("evaluation-verdict");
const evaluationFeedback = element<HTMLElement>("evaluation-feedback");
const evaluationMeta = element<HTMLElement>("evaluation-meta");
const ratingButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-rating]"),
);
const stopReviewButton = element<HTMLButtonElement>("stop-review");
const reviewStatus = element<HTMLParagraphElement>("review-status");
const sessionSummaryText = element<HTMLElement>("session-summary-text");
const backToQueueButton = element<HTMLButtonElement>("back-to-queue");
const resyncButton = element<HTMLButtonElement>("resync");
const repairButton = element<HTMLButtonElement>("repair");
const reminderEnabled = element<HTMLInputElement>("reminder-enabled");
const reminderTime = element<HTMLInputElement>("reminder-time");
const reminderStatus = element<HTMLParagraphElement>("reminder-status");
const updateVersion = element<HTMLElement>("update-version");
const updateStatus = element<HTMLParagraphElement>("update-status");
const checkUpdateButton = element<HTMLButtonElement>("check-update");
const installUpdateButton = element<HTMLButtonElement>("install-update");
const voiceControls = element<HTMLElement>("voice-controls");
const voiceSettings = element<HTMLElement>("voice-settings");
const voiceEngineSelect = element<HTMLSelectElement>("voice-engine");
const voiceEngineStatus = element<HTMLParagraphElement>("voice-engine-status");
const updateControls = element<HTMLElement>("update-controls");
const updateUnavailable = element<HTMLElement>("update-unavailable");

interface PlatformFeatures {
  voice: boolean;
  /** Whether a started voice session outlives the app leaving the foreground. */
  voiceSurvivesBackground: boolean;
  inAppUpdate: boolean;
  onDeviceEvaluation: boolean;
}

/**
 * Voice, in-app update and on-device evaluation are Android-only, but their
 * stubs answer on iOS too — an answering stub is not a feature. Offering them
 * anyway is what made the iPad report a denied microphone permission for a
 * subsystem that simply is not there. Defaults stay optimistic so an older
 * shell without the command behaves as before.
 */
let platformFeatures: PlatformFeatures = {
  voice: true,
  voiceSurvivesBackground: true,
  inAppUpdate: true,
  onDeviceEvaluation: true,
};

async function applyPlatformFeatures(): Promise<void> {
  try {
    platformFeatures = await invoke<PlatformFeatures>("platform_features");
  } catch {
    return;
  }
  voiceControls.hidden = !platformFeatures.voice;
  voiceSettings.hidden = !platformFeatures.voice;
  updateControls.hidden = !platformFeatures.inAppUpdate;
  updateUnavailable.hidden = platformFeatures.inAppUpdate;
}

let currentPairing: ZamPairPayloadV1 | null = null;
/**
 * The learner this session belongs to, in both device modes: taken from the
 * pairing payload when paired, and from the local library's `user.id` when
 * the app runs on its own (ADR 2026-08-08). Null means nothing is loaded.
 */
let currentUserId: string | null = null;
let reminderConfig: ReminderConfig = parseReminderConfig(
  localStorage.getItem(REMINDER_STORAGE_KEY),
);
let currentImportDraft: MobileTokenDraft | null = null;
let multiDraftController: MultiDraftController<MobileTokenDraft> | null = null;
let takingSharedImport = false;
let pendingUpdate: MobileUpdateInfo | null = null;
let currentEvaluation: MobileEvaluationResult | null = null;
const PENDING_IMPORT_STORAGE_KEY = "zam.mobile-pending-import.v1";

const evaluationPorts = {
  checkOnDeviceStatus: () =>
    invoke<OnDeviceLlmStatus>("on_device_llm_check_status"),
  generateOnDevice: async (prompt: string) =>
    invoke<OnDeviceLlmGenerateResult>("on_device_llm_generate", {
      prompt,
      // Gemini Nano Prompt API caps output tokens at 256.
      maxOutputTokens: 256,
      temperature: 0.2,
    }),
};

interface SharedImportPayload {
  content: string;
  mimeType?: string | null;
}

interface VoicePermissionState {
  microphone?: string;
}

interface VoiceRecognitionResult {
  transcript: string;
}

async function ensureMicrophonePermission(): Promise<void> {
  let permission = await invoke<VoicePermissionState>(
    "voice_check_permissions",
  );
  if (permission.microphone !== "granted") {
    try {
      permission = await invoke<VoicePermissionState>(
        "voice_request_permissions",
      );
    } catch (error) {
      throw new Error(
        `${t("mic_denied")} (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }
  if (permission.microphone !== "granted") {
    // Show the same recovery affordance as the camera-denied path.
    installVoiceDataButton.hidden = true;
    try {
      await invoke("voice_open_app_settings");
    } catch {
      // Settings open is best-effort; the status line still explains the fix.
    }
    throw new Error(t("mic_denied"));
  }
}

const voiceNative: MobileVoiceNative = {
  async start(locale: VoiceLocale): Promise<void> {
    await ensureMicrophonePermission();
    await invoke("voice_start", { locale });
  },
  async stop(): Promise<void> {
    await invoke("voice_stop");
  },
  async speak(text: string, locale: VoiceLocale): Promise<void> {
    await invoke("voice_speak", { text, locale });
  },
  async listen(locale: VoiceLocale): Promise<string> {
    const result = await invoke<VoiceRecognitionResult>("voice_listen", {
      locale,
    });
    return result.transcript;
  },
  capture: (locale: VoiceLocale) =>
    invoke<{ audioBase64: string; mime: string }>("voice_capture", { locale }),
  play: async (audioBase64: string, mime: string): Promise<void> => {
    await invoke("voice_play", { audioBase64, mime });
  },
};

/** The learner's engine preference; machine-local, like every device setting. */
let voicePreference: VoiceEnginePreference = readStoredVoicePreference(
  localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY),
);
/** What the device reports for the language last probed, and for which one. */
let voiceDeviceCapabilities: MobileVoiceCapabilities | null = null;
let voiceCapabilitiesLocale: VoiceLocale | null = null;

/**
 * Resolve the preference against what this device and this pairing can serve.
 *
 * Read fresh on every utterance rather than captured once: changing the
 * preference in Settings then takes effect on the next sentence instead of
 * needing the session restarted. Until the device has been probed, both local
 * tiers are assumed present — the optimistic default the companion has always
 * used, so an older shell without the command behaves as before.
 */
function currentVoicePlan(): VoiceEnginePlan {
  return resolveVoiceEnginePlan(
    voicePreference,
    buildMobileAvailability(
      voiceDeviceCapabilities ?? { sttLocal: true, ttsLocal: true },
      cloudSpeechAvailability(cloudEndpoints),
    ),
  );
}

const voicePort: VoicePort = createMobileTieredVoicePort(
  currentVoicePlan,
  voiceNative,
  {
    transcribe: (audioBase64, mime, locale) => {
      const endpoint = cloudEndpoints.stt;
      if (!endpoint) throw new Error(t("voice_no_cloud_stt"));
      return transcribeViaCloud(endpoint, { audioBase64, mime, locale });
    },
    synthesize: (text, locale) => {
      const endpoint = cloudEndpoints.tts;
      if (!endpoint) throw new Error(t("voice_no_cloud_tts"));
      return synthesizeViaCloud(endpoint, { text, locale });
    },
  },
  (capability, message) => {
    setReviewStatus(
      tf(
        capability === "tts"
          ? "voice_cloud_tts_failed"
          : "voice_cloud_stt_failed",
        { message },
      ),
      true,
    );
  },
);

const voiceController = new HandsFreeReviewController(voicePort, {
  currentCard: () => {
    const prompt = reviewSession.currentPrompt;
    if (!prompt) return null;
    return {
      question: prompt.question,
      expectedAnswer: prompt.concept,
      revealed: reviewSession.revealed,
      draftAnswer: reviewSession.draftAnswer,
    };
  },
  captureAnswer: (transcript) => {
    reviewSession.updateDraftAnswer(transcript);
    reviewAnswer.value = transcript;
  },
  revealAnswer: () => {
    reviewSession.reveal();
    renderCurrentReview(t("voice_answer_recognized"));
  },
  evaluateAnswer: async () => {
    const result = await runSmartEvaluation();
    if (!result) return null;
    return {
      speech: evaluationSpeech(result.evaluation, getLocale()),
      suggestedRating: result.evaluation.suggestedRating,
    };
  },
  rate: (rating) => rateCurrentReview(rating),
  setStatus: (message, isError) => setReviewStatus(message, isError),
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Switch the UI locale (from the paired settings, else the device) and repaint. */
function applyLocale(source: string | null | undefined): void {
  setLocale(resolveLocale(source));
  applyStaticTranslations();
}

/**
 * Language the learner reads in, used for the UI and — the reason it has to be
 * right — for the language the model writes its evaluation in.
 *
 * `system.locale` in the database is the authority: it is a learner setting
 * that travels with the database and is edited on the desktop. The pairing
 * payload carries a snapshot of it so the first paint is not blank, and the
 * device locale is the last resort.
 *
 * Kept as the raw string, not the narrowed UI `Locale`: the interface ships
 * de/en, while the model can answer in any supported language.
 */
let learnerLocale: string | null | undefined;

async function refreshLearnerLocaleFromDb(): Promise<void> {
  try {
    const stored = await getSetting(db, "system.locale");
    if (stored) {
      learnerLocale = stored;
      applyLocale(stored);
    }
  } catch {
    // Database not open yet, or offline. The pairing snapshot stays in effect.
  }
}

/**
 * Cloud models this device can call, loaded from the learner database
 * (ADR 2026-07-23). Refreshed whenever the database is, so a model changed on
 * the desktop reaches the phone without re-pairing.
 */
let cloudEndpoints: Record<
  "text" | "stt" | "tts",
  ZamPairLlmEndpoint | null
> = { text: null, stt: null, tts: null };

async function refreshCloudEndpointsFromDb(): Promise<void> {
  try {
    const [text, stt, tts] = await Promise.all([
      resolveMobileCloudChain(db, "text"),
      resolveMobileCloudChain(db, "stt"),
      resolveMobileCloudChain(db, "tts"),
    ]);
    cloudEndpoints = { text, stt, tts };
  } catch {
    // Offline or not yet paired. Whatever was resolved last stays in effect;
    // the evaluation path falls back to self-rating on its own.
  }
}

/**
 * The recall endpoint chain.
 *
 * The database is the source. A payload from 0.24–0.25 still carries an
 * embedded recall endpoint, and it is honoured while the paired desktop has not
 * been upgraded yet — otherwise upgrading the phone first would silently take
 * evaluation away.
 */
function recallEndpoint(): ZamPairLlmEndpoint | null {
  return cloudEndpoints.text ?? currentPairing?.llm?.recall ?? null;
}

function setPairingStatus(text: string, isError = false): void {
  pairingStatus.textContent = text;
  pairingStatus.classList.toggle("error", isError);
}

function setStatus(text: string, isError = false): void {
  statusLine.textContent = text;
  statusLine.classList.toggle("error", isError);
}

function showPairing(canCancel: boolean): void {
  nav.showRoot("pairing");
  cancelPairingButton.hidden = !canCancel;
  cameraSettingsButton.hidden = true;
  // Re-pairing gets an instruction; a first run does not. Arriving here from
  // the welcome screen, a line telling a learner to go find a QR code would
  // contradict the choice they just made.
  setPairingStatus(canCancel ? t("pairing_hint_keep") : "");
}

function showApp(payload: ZamPairPayloadV1): void {
  // Paint from the pairing snapshot at once, then correct from the database.
  learnerLocale = payload.settings?.locale ?? navigator.language;
  applyLocale(learnerLocale);
  void refreshLearnerLocaleFromDb();
  void refreshCloudEndpointsFromDb();
  resyncButton.hidden = false;
  learner.hidden = false;
  learner.textContent = payload.learner.userId;
  nav.showTab("learn");
}

function showDashboard(): void {
  nav.showTab("learn");
}

/**
 * Review takes the whole screen and drops the tab bar: nothing should invite
 * the learner away mid-card, and the four ratings want the space the bar
 * would otherwise occupy.
 */
function showReview(): void {
  nav.showRoot("review");
}

function showSessionSummary(): void {
  nav.showSummary();
}

function showImport(): void {
  nav.showTab("library");
}

function showStats(): void {
  nav.showTab("progress");
}

function showSettings(): void {
  nav.showTab("settings");
}

function setImportStatus(text: string, isError = false): void {
  importStatus.textContent = text;
  importStatus.classList.toggle("error", isError);
}

function commaList(value: string): string[] | undefined {
  const entries = [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
  return entries.length ? entries : undefined;
}

function updateMultiDraftChrome(): void {
  if (!multiDraftController || multiDraftController.isDone()) {
    importDraftProgress.hidden = true;
    importDraftProgress.textContent = "";
    skipImportDraftButton.hidden = true;
    confirmImportButton.textContent = t("save_token");
    return;
  }
  const { current, total } = multiDraftController.progress();
  importDraftProgress.hidden = false;
  importDraftProgress.textContent = tf("import_draft_progress", {
    current,
    total,
  });
  skipImportDraftButton.hidden = false;
  confirmImportButton.textContent =
    total > 1 ? t("import_save_next") : t("save_token");
}

function renderImportDraft(draft: MobileTokenDraft, message?: string): void {
  currentImportDraft = draft;
  importSlug.value = draft.slug;
  importTitle.value = draft.title ?? "";
  importConcept.value = draft.concept;
  importDomain.value = draft.domain;
  importBloom.value = String(draft.bloomLevel);
  importQuestion.value = draft.question ?? "";
  importContext.value = draft.context ?? "";
  importSourceLink.value = draft.source_link ?? "";
  importPrerequisites.value = draft.prerequisites?.join(", ") ?? "";
  importKnowledgeContexts.value = draft.knowledgeContexts?.join(", ") ?? "";
  importSymbiosisMode.value = draft.symbiosisMode ?? "";
  importDraftForm.hidden = false;
  updateMultiDraftChrome();
  setImportStatus(
    message ??
      t(
        draft.origin === "bridge-json"
          ? "import_bridge_checked"
          : draft.origin === "image-vl"
            ? "import_bridge_checked"
            : "import_quick_prepared",
      ),
  );
  showImport();
  importConcept.focus();
}

function startMultiDraftImport(drafts: MobileTokenDraft[]): void {
  multiDraftController = createMultiDraftController(drafts);
  const first = multiDraftController.current();
  if (!first) return;
  renderImportDraft(first);
}

function prepareImportText(text: string, message?: string): void {
  importInput.value = text;
  try {
    renderImportDraft(parseMobileImport(text), message);
  } catch (error) {
    currentImportDraft = null;
    importDraftForm.hidden = true;
    showImport();
    setImportStatus(errorMessage(error), true);
    importInput.focus();
  }
}

function draftFromForm(): MobileTokenDraft {
  if (!currentImportDraft) throw new Error(t("draft_first"));
  return {
    origin: currentImportDraft.origin,
    slug: importSlug.value.trim(),
    title: importTitle.value.trim() || undefined,
    concept: importConcept.value.trim(),
    domain: importDomain.value.trim(),
    bloomLevel: Number(importBloom.value),
    question: importQuestion.value.trim() || null,
    context: importContext.value.trim() || undefined,
    source_link: importSourceLink.value.trim() || null,
    prerequisites: commaList(importPrerequisites.value),
    knowledgeContexts: commaList(importKnowledgeContexts.value),
    symbiosisMode:
      (importSymbiosisMode.value as MobileTokenDraft["symbiosisMode"]) ||
      undefined,
    provider: currentImportDraft.provider ?? undefined,
  };
}

function resetImport(): void {
  currentImportDraft = null;
  multiDraftController = null;
  importFile.value = "";
  importInput.value = "";
  importImage.value = "";
  importDraftForm.reset();
  importDraftForm.hidden = true;
  importDraftProgress.hidden = true;
  importDraftProgress.textContent = "";
  skipImportDraftButton.hidden = true;
  confirmImportButton.textContent = t("save_token");
  setImportStatus("");
}

async function runImageDecompose(): Promise<void> {
  const file = importImage.files?.[0];
  if (!file) {
    setImportStatus(t("import_image_hint"), true);
    return;
  }
  if (!currentUserId) return;

  decomposeImageButton.disabled = true;
  prepareImportButton.disabled = true;
  setImportStatus(t("import_image_working"));
  try {
    const unavailable = await visionImportUnavailableReason(db);
    const endpoint = await resolveMobileVisionEndpoint(db);
    if (!endpoint) {
      setImportStatus(
        tf("import_image_unavailable", {
          error: unavailable ?? "cloud vision not configured",
        }),
        true,
      );
      return;
    }

    const image = await downscaleImageFile(file);
    const drafts = await decomposeImageViaVision({
      endpoint,
      imageDataUrl: image.dataUrl,
      locale: getLocale(),
      request: async ({ url, headers, body, timeoutMs }) => {
        const result = await invoke<string>("vision_request", {
          url,
          headers,
          body,
          timeoutMs,
        });
        return result;
      },
    });
    startMultiDraftImport(drafts);
  } catch (error) {
    multiDraftController = null;
    currentImportDraft = null;
    importDraftForm.hidden = true;
    setImportStatus(
      tf("import_image_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    decomposeImageButton.disabled = false;
    prepareImportButton.disabled = false;
  }
}

function queueSharedImport(payload: SharedImportPayload): void {
  localStorage.setItem(PENDING_IMPORT_STORAGE_KEY, payload.content);
  if (reviewSession.active) {
    setReviewStatus(t("shared_waits"));
  }
}

function openPendingImport(): boolean {
  if (reviewSession.active) return false;
  const pending = localStorage.getItem(PENDING_IMPORT_STORAGE_KEY);
  if (!pending) return false;
  localStorage.removeItem(PENDING_IMPORT_STORAGE_KEY);
  prepareImportText(pending, t("shared_as_draft"));
  return true;
}

async function takeSharedImport(): Promise<void> {
  if (takingSharedImport) return;
  takingSharedImport = true;
  try {
    const payload = await invoke<SharedImportPayload | null>(
      "shared_import_take",
    );
    if (!payload?.content) return;
    queueSharedImport(payload);
    if (currentUserId) openPendingImport();
  } catch (error) {
    if (currentUserId && !reviewSession.active) {
      showImport();
      setImportStatus(
        tf("shared_read_failed", { error: errorMessage(error) }),
        true,
      );
    }
  } finally {
    takingSharedImport = false;
  }
}

function parseDate(value: string): Date {
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}

function formatDateTime(value: string): string {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * When a card is next up, in the terms a learner thinks in. A due date is
 * either "now-ish" or "some day" — the second and the year in
 * `8.8.2026, 07:34:53` were noise on every single row.
 */
function formatDueDay(value: string): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86_400_000,
  );
  if (days <= 0) return t("due_today");
  if (days === 1) return t("due_tomorrow");
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// ── Statistics (ADR 2026-08-01) ────────────────────────────────────────────
let statsPeriod: StatsPeriod = "day";

/** "45 s" / "3 min" / "3 min 20 s" — units come from the translation table. */
function formatStudyDuration(ms: number): string {
  if (ms < 60_000) return tf("duration_seconds", { n: Math.round(ms / 1000) });
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds > 0
    ? tf("duration_minutes_seconds", { m: minutes, s: seconds })
    : tf("duration_minutes", { n: minutes });
}

function statsFormatters(): StatsFormatters {
  return {
    locale: learnerLocale ?? navigator.language,
    weekLabel: (week) => tf("stats_week_label", { week }),
    duration: formatStudyDuration,
  };
}

function setStatsPeriod(period: StatsPeriod): void {
  statsPeriod = period;
  for (const candidate of ["day", "week", "month"] as const) {
    const button = document.getElementById(`stats-period-${candidate}`);
    const active = candidate === period;
    button?.classList.toggle("active", active);
    button?.setAttribute("aria-selected", String(active));
  }
}

function renderStats(view: StatsView): void {
  statsSummary.textContent = view.rows.length
    ? [
        tf("stats_total_cards", {
          n: view.totalCards,
          cards: cardWord(view.totalCards),
        }),
        view.totalStudyTime
          ? tf("stats_total_time", { time: view.totalStudyTime })
          : t("stats_total_time_none"),
      ].join(" · ")
    : "";

  statsRows.replaceChildren();
  if (view.rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "stats-note";
    empty.textContent = t("stats_empty");
    statsRows.appendChild(empty);
    return;
  }

  for (const row of view.rows) {
    const entry = document.createElement("div");
    entry.className = "stats-row";

    const label = document.createElement("span");
    label.className = "stats-row-label";
    label.textContent = row.label;
    // The raw bucket key stays reachable for anyone comparing with the CLI.
    label.title = row.bucket;

    const bar = document.createElement("span");
    bar.className = "stats-row-bar";
    bar.setAttribute(
      "aria-label",
      tf("stats_row_aria", {
        label: row.label,
        n: row.reviewedCards,
        cards: cardWord(row.reviewedCards),
      }),
    );
    const fill = document.createElement("span");
    fill.className = "stats-row-fill";
    fill.style.width = `${row.barPercent}%`;
    bar.appendChild(fill);

    const count = document.createElement("span");
    count.className = "stats-row-count";
    count.textContent = String(row.reviewedCards);

    const time = document.createElement("span");
    time.className = "stats-row-time";
    time.textContent = row.studyTime ?? t("stats_time_none");

    entry.append(label, bar, count, time);
    statsRows.appendChild(entry);
  }
}

/** Load and paint the series; the kernel read is local, so this works offline. */
async function refreshStats(): Promise<void> {
  if (!currentUserId) return;
  statsSummary.textContent = t("stats_loading");
  statsRows.replaceChildren();
  try {
    const view = await loadStatsView(
      db,
      currentUserId,
      statsPeriod,
      statsFormatters(),
    );
    renderStats(view);
  } catch (err) {
    statsSummary.textContent = "";
    statsRows.replaceChildren();
    const failed = document.createElement("p");
    failed.className = "stats-note error";
    failed.textContent = tf("stats_failed", { error: errorMessage(err) });
    statsRows.appendChild(failed);
  }
}

function externalSourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function renderQueue(queue: ReviewQueue): void {
  summary.textContent = tf("queue_summary", {
    count: queue.items.length,
    cards: cardWord(queue.items.length),
  });
  // The breakdown only names the buckets that are actually populated. Listing
  // "0 due, 0 again" every day taught the learner to stop reading the line.
  const parts: string[] = [];
  if (queue.reviewCount > 0) {
    parts.push(tf("queue_breakdown_due", { n: queue.reviewCount }));
  }
  if (queue.relearnCount > 0) {
    parts.push(tf("queue_breakdown_relearn", { n: queue.relearnCount }));
  }
  if (queue.newCount > 0) {
    parts.push(tf("queue_breakdown_new", { n: queue.newCount }));
  }
  setStatus(parts.join(" · "));
  nav.setDueBadge(queue.reviewCount + queue.relearnCount);
  queueList.replaceChildren();
  for (const item of queue.items) {
    const entry = document.createElement("li");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = tf("queue_item_meta", {
      domain: item.domain || t("no_domain"),
      due: formatDueDay(item.dueAt),
    });
    entry.append(title, meta);
    queueList.append(entry);
  }
  startReviewButton.disabled = queue.items.length === 0;
}

function setReviewStatus(text: string, isError = false): void {
  reviewStatus.textContent = text;
  reviewStatus.classList.toggle("error", isError);
}

function clearEvaluationUi(): void {
  currentEvaluation = null;
  evaluationPanel.hidden = true;
  evaluationVerdict.textContent = "";
  evaluationFeedback.textContent = "";
  evaluationMeta.textContent = "";
  for (const button of ratingButtons) button.classList.remove("suggested");
}

function ratingI18nKey(rating: 1 | 2 | 3 | 4): string {
  return (
    {
      1: "rating_again",
      2: "rating_hard",
      3: "rating_good",
      4: "rating_easy",
    } as const
  )[rating];
}

function verdictI18nKey(verdict: "correct" | "partial" | "incorrect"): string {
  return (
    {
      correct: "evaluation_verdict_correct",
      partial: "evaluation_verdict_partial",
      incorrect: "evaluation_verdict_incorrect",
    } as const
  )[verdict];
}

function showEvaluationUi(result: MobileEvaluationResult): void {
  currentEvaluation = result;
  evaluationPanel.hidden = false;
  evaluationVerdict.textContent = t(verdictI18nKey(result.evaluation.verdict));
  evaluationFeedback.textContent = result.evaluation.feedback;
  evaluationMeta.textContent = [
    tf("evaluation_suggested", {
      rating: t(ratingI18nKey(result.evaluation.suggestedRating)),
    }),
    tf("evaluation_backend", { model: result.modelLabel }),
  ].join(" · ");
  for (const button of ratingButtons) {
    const rating = Number(button.dataset.rating);
    button.classList.toggle(
      "suggested",
      rating === result.evaluation.suggestedRating,
    );
  }
}

/** Run intelligent evaluation for the current draft answer; null = self-rate. */
async function runSmartEvaluation(): Promise<MobileEvaluationResult | null> {
  const item = reviewSession.currentItem;
  const prompt = reviewSession.currentPrompt;
  const answer = reviewSession.draftAnswer.trim();
  if (!item || !prompt || !answer) return null;

  setReviewStatus(t("evaluating_answer"));
  try {
    const result = await evaluateMobileAnswer({
      card: {
        slug: item.slug,
        question: prompt.question,
        concept: prompt.concept,
        bloomLevel: item.bloomLevel,
        // Mobile queue items do not carry resolved source context yet.
        resolvedContext: null,
      },
      learnerAnswer: answer,
      locale: learnerLocale ?? navigator.language,
      endpoint: recallEndpoint(),
      onDeviceAvailable: platformFeatures.onDeviceEvaluation,
      ports: evaluationPorts,
    });
    if (isStaleEvaluation(item.cardId)) return null;
    if (result) {
      showEvaluationUi(result);
      setReviewStatus(
        tf("evaluation_suggested", {
          rating: t(ratingI18nKey(result.evaluation.suggestedRating)),
        }),
      );
      return result;
    }
    setReviewStatus(t("compare_and_rate"));
    return null;
  } catch (error) {
    if (isStaleEvaluation(item.cardId)) return null;
    clearEvaluationUi();
    setReviewStatus(
      tf("evaluation_failed_self_rate", { error: errorMessage(error) }),
      true,
    );
    return null;
  }
}

/**
 * The learner can rate and move on while an evaluation is still running
 * (Nano generation, or even a first-use model download); a result for a card
 * that is no longer the revealed current card must not repaint the UI.
 */
function isStaleEvaluation(cardId: string): boolean {
  return (
    reviewSession.currentItem?.cardId !== cardId || !reviewSession.revealed
  );
}

function updateVoiceButton(): void {
  toggleVoiceButton.textContent = t(
    voiceController.active ? "voice_pause" : "voice_start",
  );
  toggleVoiceButton.setAttribute(
    "aria-pressed",
    voiceController.active ? "true" : "false",
  );
}

async function pauseVoiceMode(): Promise<void> {
  if (!voiceController.active) return;
  await voiceController.pause();
  updateVoiceButton();
}

function startVoiceMode(): void {
  // `learnerLocale` first, exactly as the evaluation path does. The pairing
  // payload's locale is a snapshot taken once, when the device was paired, and
  // `system.locale` defaults to "en" — so a device paired before the learner's
  // language was stored keeps speaking English forever, while the UI and the
  // evaluation have long since followed the database. And because "en" is a
  // real value, `??` never falls through to the device language either.
  const locale = resolveVoiceLocale(
    learnerLocale ?? currentPairing?.settings?.locale ?? navigator.language,
  );
  installVoiceDataButton.hidden = true;
  updateVoiceButton();
  void (async () => {
    await refreshVoiceCapabilities(locale);
    const plan = currentVoicePlan();
    if (!isVoiceModeUsable(plan)) {
      setReviewStatus(t(voiceUnavailableKey(plan) ?? "voice_unavailable"), true);
      updateVoiceButton();
      return;
    }
    // Only meaningful while the device is doing the reading; pointing at an iOS
    // voice download would be nonsense when a cloud voice is speaking.
    if (plan.tts.tier === "local") void hintWhenOnlyCompactVoice(locale);
    // Never let a session leave the device without saying so. A learner who
    // chose quality-first knew the trade; one who fell back to the cloud
    // because the device could not serve the language did not.
    if (planLeavesDevice(plan)) setReviewStatus(t("voice_cloud_notice"));
    try {
      await voiceController.start(locale);
    } catch (error) {
      const message = errorMessage(error);
      installVoiceDataButton.hidden = !/(TTS|Sprachdaten|TTS-Stimme)/i.test(
        message,
      );
      setReviewStatus(tf("voice_paused_msg", { message }), true);
    } finally {
      updateVoiceButton();
    }
  })();
  updateVoiceButton();
}

/**
 * Ask the device what it can do locally **for one review language**.
 *
 * Cached per locale, not per app run: recognition and voices are per-language
 * on both platforms, so switching the review language invalidates the previous
 * answer. A shell without the command keeps the optimistic default, which is
 * how the companion behaved before the cloud tier existed.
 */
async function refreshVoiceCapabilities(locale: VoiceLocale): Promise<void> {
  if (voiceDeviceCapabilities && voiceCapabilitiesLocale === locale) return;
  try {
    voiceDeviceCapabilities = await invoke<MobileVoiceCapabilities>(
      "voice_capabilities",
      { locale },
    );
    voiceCapabilitiesLocale = locale;
  } catch {
    voiceDeviceCapabilities = null;
    voiceCapabilitiesLocale = null;
  }
}

/**
 * Render the engine selector and say what the current choice would actually
 * do, so "quality first" cannot silently mean "device anyway" on a device with
 * no speech model paired.
 */
function renderVoiceSettings(): void {
  voiceEngineSelect.value = voicePreference;
  for (const option of voiceEngineSelect.options) {
    option.textContent = t(`voice_engine_${option.value.replace(/-/g, "_")}`);
  }
  const cloud = cloudSpeechAvailability(cloudEndpoints);
  if (voicePreference === "quality-first" && !cloud.stt && !cloud.tts) {
    // The endpoints live in machine-local config on the desktop, so they only
    // reach a device through a pairing code made after one was configured.
    voiceEngineStatus.textContent = t("voice_cloud_unpaired");
    return;
  }
  voiceEngineStatus.textContent = t(
    `voice_engine_${voicePreference.replace(/-/g, "_")}_desc`,
  );
}

/**
 * Point at the one-time download when only a compact voice is installed.
 *
 * Every iOS language ships a small `default`-quality voice; the natural
 * sounding ones are downloaded on request. Without this the learner has no way
 * to know the flat read-aloud is a missing download rather than what ZAM
 * sounds like.
 */
async function hintWhenOnlyCompactVoice(locale: VoiceLocale): Promise<void> {
  if (!platformFeatures.voice) return;
  try {
    const result = await invoke<{ quality?: string }>("voice_quality", {
      locale,
    });
    if (result?.quality === "default") {
      setReviewStatus(t("voice_compact_voice_hint"));
    }
  } catch {
    // Android has no such command, and a missing hint must never stop a
    // session from starting.
  }
}

function renderCurrentReview(message = ""): void {
  const item = reviewSession.currentItem;
  const prompt = reviewSession.currentPrompt;
  if (!item || !prompt) return;

  showReview();
  const progress = reviewSession.progress;
  reviewProgress.textContent = tf("review_progress", {
    current: progress.current,
    total: progress.total,
  });
  // A bar as well as the count: "3 of 12" is precise, but how much is left is
  // read faster from a length than from arithmetic.
  reviewProgressFill.style.width = `${
    progress.total > 0 ? ((progress.current - 1) / progress.total) * 100 : 0
  }%`;
  reviewMeta.textContent = tf("review_meta", {
    title: item.title,
    domain: item.domain || t("no_domain"),
  });
  reviewQuestion.textContent = prompt.question;
  reviewAnswer.value = reviewSession.draftAnswer;
  reviewAnswer.disabled = reviewSession.revealed;
  revealAnswerButton.hidden = reviewSession.revealed;
  revealedAnswer.hidden = !reviewSession.revealed;
  expectedAnswer.textContent = prompt.concept;
  const sourceUrl = externalSourceUrl(prompt.sourceLink);
  reviewSource.hidden = !sourceUrl;
  if (sourceUrl) reviewSource.href = sourceUrl;
  if (!reviewSession.revealed) clearEvaluationUi();
  else if (currentEvaluation) showEvaluationUi(currentEvaluation);
  for (const button of ratingButtons) {
    button.disabled = !reviewSession.revealed;
  }
  updateVoiceButton();
  setReviewStatus(message);
  if (!reviewSession.revealed && !voiceController.active) reviewAnswer.focus();
}

function renderSessionSummary(result: MobileReviewSummary): void {
  sessionSummaryText.textContent = tf("summary_text", {
    completion: t(result.stopped ? "session_ended" : "session_done"),
    done: result.completedCount,
    total: result.totalCount,
    cards: cardWord(result.totalCount),
    again: result.againCount,
    next: result.nextDueAt
      ? formatDateTime(result.nextDueAt)
      : t("no_more_cards"),
  });
  showSessionSummary();
}

async function refresh(userId: string): Promise<void> {
  const user = (await db
    .prepare("SELECT COUNT(*) AS card_count FROM cards WHERE user_id = ?")
    .get(userId)) as { card_count: number } | undefined;
  const cardCount = Number(user?.card_count ?? 0);
  if (cardCount === 0) {
    summary.textContent = t("library_empty");
    setStatus("");
    queueList.replaceChildren();
    startReviewButton.disabled = true;
    nav.setDueBadge(0);
    await updateReminderDue(0);
    return;
  }
  const queue = await buildReviewQueue(db, { userId });
  if (queue.items.length === 0) {
    // A library with cards but nothing scheduled is a good day, not an empty
    // screen — say so rather than showing "0".
    summary.textContent = t("queue_nothing_due");
    setStatus("");
    queueList.replaceChildren();
    startReviewButton.disabled = true;
    nav.setDueBadge(0);
    await updateReminderDue(0);
    return;
  }
  renderQueue(queue);
  await updateReminderDue(queue.reviewCount + queue.relearnCount);
}

async function restoreReviewSession(userId: string): Promise<void> {
  const restored = await reviewSession.restore(userId);
  if (restored.kind === "active") {
    renderCurrentReview(t("session_resumed"));
  } else if (restored.kind === "completed") {
    renderSessionSummary(restored.summary);
  } else {
    showDashboard();
  }
}

/**
 * Online-only reachability check (ADR 2026-07-23). There is no local replica
 * to push/pull; `db.sync` verifies the remote primary answers.
 */
async function synchronize(report?: (message: string) => void): Promise<void> {
  await syncWithRetry(
    async () => {
      await db.sync?.();
    },
    {
      onRetry: ({ attempt, error }) =>
        report?.(tf("sync_retry", { attempt, error: error.message })),
    },
  );
}

/** Route an expired/rotated token to re-pairing without discarding the session. */
function promptRepair(reason: string): void {
  connection.textContent = t("offline");
  connection.classList.add("offline");
  showPairing(Boolean(currentPairing));
  setPairingStatus(reason, true);
}

async function connect(
  payload: ZamPairPayloadV1,
  requireInitialSync: boolean,
): Promise<void> {
  setStatus(t("opening_server_db"));
  await invoke("db_close");
  await invoke("db_open", {
    syncUrl: payload.database.url,
    authToken: payload.database.token,
  });

  let syncError: SyncError | undefined;
  try {
    setStatus(t("syncing"));
    await synchronize(
      requireInitialSync
        ? (message) => setPairingStatus(message, true)
        : (message) => setStatus(message, true),
    );
  } catch (error) {
    syncError =
      error instanceof SyncError
        ? error
        : new SyncError("transient", errorMessage(error));
    if (requireInitialSync) throw error;
  }

  currentUserId = payload.learner.userId;
  await refresh(payload.learner.userId);
  if (requireInitialSync) {
    await invoke("pairing_save", {
      payload: serializeZamPairPayload(payload),
    });
  }
  currentPairing = payload;
  showApp(payload);
  await restoreReviewSession(payload.learner.userId);
  await takeSharedImport();
  openPendingImport();
  connection.textContent = syncError ? t("offline") : t("synced");
  connection.classList.toggle("offline", Boolean(syncError));
  if (syncError?.kind === "auth") {
    promptRepair(tf("token_expired_repair", { message: syncError.message }));
  } else if (syncError) {
    setStatus(tf("offline_sync_failed", { error: syncError.message }), true);
  }
}

async function applyPairing(input: string | unknown): Promise<void> {
  const payload = parseZamPairPayload(input);
  const previousPairing = currentPairing;
  setPairingStatus(t("pairing_checking"));
  scanButton.disabled = true;
  try {
    await connect(payload, true);
  } catch (error) {
    if (previousPairing) {
      try {
        await connect(previousPairing, false);
      } catch {
        // Keep the re-pair screen usable even if the previous replica is unavailable.
      }
    }
    showPairing(Boolean(previousPairing));
    setPairingStatus(
      tf("pairing_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    scanButton.disabled = false;
  }
}

scanButton.addEventListener("click", async () => {
  try {
    let permission = await checkPermissions();
    if (permission !== "granted") permission = await requestPermissions();
    if (permission !== "granted") {
      cameraSettingsButton.hidden = false;
      setPairingStatus(t("camera_denied"), true);
      return;
    }
    setPairingStatus(t("camera_open"));
    const result = await scan({
      cameraDirection: "back",
      formats: [Format.QRCode],
    });
    await applyPairing(result.content);
  } catch (error) {
    setPairingStatus(tf("scan_failed", { error: errorMessage(error) }), true);
  }
});

cameraSettingsButton.addEventListener("click", () => void openAppSettings());

manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void applyPairing({
    type: ZAM_PAIR_TYPE,
    version: ZAM_PAIR_VERSION,
    createdAt: new Date().toISOString(),
    database: {
      url: manualUrl.value.trim(),
      token: manualToken.value.trim(),
    },
    learner: { userId: manualUser.value.trim() },
    settings: { locale: navigator.language.split("-")[0] || "de" },
  });
});

cancelPairingButton.addEventListener("click", () => {
  if (currentPairing) showApp(currentPairing);
});

repairButton.addEventListener("click", () => showPairing(true));

element<HTMLButtonElement>("pairing-back").addEventListener("click", () => {
  if (currentUserId) showDashboard();
  else nav.showRoot("setup");
});

/**
 * A tab is reachable at any moment, so each one refreshes what it shows on
 * arrival rather than relying on whoever navigated there to have done it.
 */
nav.onTabChange((tab) => {
  if (tab === "library") {
    resetImport();
    return;
  }
  if (tab === "progress") {
    void refreshStats();
    return;
  }
  if (tab === "settings") {
    renderReminderControls();
    renderVoiceSettings();
    void refreshStorageRow();
  }
});

openImportButton.addEventListener("click", () => {
  showImport();
  importInput.focus();
});


for (const period of ["day", "week", "month"] as const) {
  document
    .getElementById(`stats-period-${period}`)
    ?.addEventListener("click", () => {
      setStatsPeriod(period);
      void refreshStats();
    });
}

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  multiDraftController = null;
  try {
    const content = await file.text();
    prepareImportText(content, tf("file_loaded", { name: file.name }));
  } catch (error) {
    setImportStatus(
      tf("file_read_failed", { error: errorMessage(error) }),
      true,
    );
  }
});

importImage.addEventListener("change", () => {
  if (importImage.files?.[0]) {
    setImportStatus(tf("file_loaded", { name: importImage.files[0].name }));
  }
});

prepareImportButton.addEventListener("click", () => {
  multiDraftController = null;
  prepareImportText(importInput.value);
});

decomposeImageButton.addEventListener("click", () => {
  void runImageDecompose();
});

cancelImportButton.addEventListener("click", () => {
  resetImport();
  showDashboard();
});

skipImportDraftButton.addEventListener("click", () => {
  if (!multiDraftController || !currentUserId) return;
  const hasMore = multiDraftController.skip();
  if (!hasMore) {
    const { saved, skipped } = multiDraftController.state();
    const userId = currentUserId;
    resetImport();
    void refresh(userId).then(() => {
      showDashboard();
      setStatus(tf("import_batch_done", { saved, skipped }));
    });
    return;
  }
  const next = multiDraftController.current();
  if (next) renderImportDraft(next);
});

importDraftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUserId) return;
  confirmImportButton.disabled = true;
  skipImportDraftButton.disabled = true;
  try {
    const draft = draftFromForm();
    const result = await confirmMobileImport(
      db,
      currentUserId,
      draft,
    );

    if (multiDraftController) {
      const hasMore = multiDraftController.saveAndNext();
      if (hasMore) {
        const next = multiDraftController.current();
        if (next) renderImportDraft(next);
        setImportStatus(
          tf("token_saved", {
            title: result.token.title || result.token.slug,
          }),
        );
        return;
      }
      const { saved, skipped } = multiDraftController.state();
      resetImport();
      await refresh(currentUserId);
      showDashboard();
      setStatus(tf("import_batch_done", { saved, skipped }));
      return;
    }

    resetImport();
    await refresh(currentUserId);
    showDashboard();
    setStatus(
      tf("token_saved", { title: result.token.title || result.token.slug }),
    );
  } catch (error) {
    setImportStatus(tf("import_failed", { error: errorMessage(error) }), true);
  } finally {
    confirmImportButton.disabled = false;
    skipImportDraftButton.disabled = false;
  }
});

async function rateCurrentReview(rating: 1 | 2 | 3 | 4): Promise<boolean> {
  for (const candidate of ratingButtons) candidate.disabled = true;
  stopReviewButton.disabled = true;
  try {
    const result = await reviewSession.rate(rating);
    clearEvaluationUi();
    if (result.summary) {
      renderSessionSummary(result.summary);
      return false;
    }
    const blocking = result.blockedPrerequisites.length
      ? tf("prereqs_scheduled", {
          slugs: result.blockedPrerequisites.join(", "),
        })
      : "";
    renderCurrentReview(
      tf("saved_next_due", {
        next: formatDateTime(result.nextDueAt),
        blocking,
      }),
    );
    return true;
  } catch (error) {
    renderCurrentReview(tf("rating_failed", { error: errorMessage(error) }));
    reviewStatus.classList.add("error");
    return false;
  } finally {
    stopReviewButton.disabled = false;
  }
}

startReviewButton.addEventListener("click", async () => {
  if (!currentUserId) return;
  startReviewButton.disabled = true;
  try {
    const started = await reviewSession.start(currentUserId);
    if (!started) {
      setStatus(t("no_due_cards"));
      await refresh(currentUserId);
      return;
    }
    renderCurrentReview();
  } catch (error) {
    setStatus(tf("session_start_failed", { error: errorMessage(error) }), true);
    startReviewButton.disabled = false;
  }
});

reviewAnswer.addEventListener("input", () => {
  if (voiceController.active) void pauseVoiceMode();
  reviewSession.updateDraftAnswer(reviewAnswer.value);
  setReviewStatus("");
});

toggleVoiceButton.addEventListener("click", async () => {
  toggleVoiceButton.disabled = true;
  try {
    if (voiceController.active) {
      await pauseVoiceMode();
      setReviewStatus(t("voice_paused_typing"));
    } else {
      startVoiceMode();
    }
  } catch (error) {
    setReviewStatus(
      tf("voice_pause_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    toggleVoiceButton.disabled = false;
    updateVoiceButton();
  }
});

installVoiceDataButton.addEventListener("click", async () => {
  installVoiceDataButton.disabled = true;
  try {
    await invoke("voice_install_data");
    setReviewStatus(t("voice_data_opened"));
  } catch (error) {
    setReviewStatus(
      tf("voice_data_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    installVoiceDataButton.disabled = false;
  }
});

revealAnswerButton.addEventListener("click", async () => {
  await pauseVoiceMode().catch(() => undefined);
  try {
    reviewSession.updateDraftAnswer(reviewAnswer.value);
    reviewSession.reveal();
    clearEvaluationUi();
    renderCurrentReview(t("evaluating_answer"));
    revealAnswerButton.disabled = true;
    await runSmartEvaluation();
  } catch {
    setReviewStatus(t("answer_required"), true);
    reviewAnswer.focus();
  } finally {
    revealAnswerButton.disabled = false;
  }
});

for (const button of ratingButtons) {
  button.addEventListener("click", async () => {
    const rating = Number(button.dataset.rating) as 1 | 2 | 3 | 4;
    if (rating < 1 || rating > 4) return;
    await pauseVoiceMode().catch(() => undefined);
    await rateCurrentReview(rating);
  });
}

stopReviewButton.addEventListener("click", async () => {
  stopReviewButton.disabled = true;
  try {
    await pauseVoiceMode();
    renderSessionSummary(await reviewSession.finish());
  } catch (error) {
    setReviewStatus(
      tf("session_end_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    stopReviewButton.disabled = false;
  }
});

backToQueueButton.addEventListener("click", async () => {
  if (!currentUserId) return;
  backToQueueButton.disabled = true;
  try {
    await refresh(currentUserId);
    showDashboard();
    openPendingImport();
  } catch (error) {
    setStatus(tf("queue_load_failed", { error: errorMessage(error) }), true);
  } finally {
    backToQueueButton.disabled = false;
  }
});

resyncButton.addEventListener("click", async () => {
  if (!currentUserId) return;
  resyncButton.disabled = true;
  try {
    setStatus(t("syncing"));
    await synchronize((message) => setStatus(message, true));
    await refresh(currentUserId);
    connection.textContent = t("synced");
    connection.classList.remove("offline");
  } catch (error) {
    if (error instanceof SyncError && error.kind === "auth") {
      promptRepair(tf("token_expired_repair", { message: error.message }));
    } else {
      connection.textContent = t("offline");
      connection.classList.add("offline");
      setStatus(tf("sync_failed", { error: errorMessage(error) }), true);
    }
  } finally {
    resyncButton.disabled = false;
  }
});

/**
 * Open the device-local library and show the app (ADR 2026-08-08).
 *
 * There is no upstream here, so nothing synchronizes and the connection chip
 * says where the library lives rather than claiming a sync state it cannot
 * have. `db_sync` refuses on a local database for exactly that reason.
 */
async function openLocalLibrary(setup: LocalSetup): Promise<void> {
  currentUserId = setup.userId;
  currentPairing = null;
  learnerLocale = setup.locale;
  applyLocale(setup.locale);
  void refreshCloudEndpointsFromDb();
  // One learner owns a device-local library, so naming them says nothing.
  learner.hidden = true;
  // Nothing to synchronize with: offering the button would only produce
  // "database is local-only; nothing to sync" from the Rust side.
  resyncButton.hidden = true;
  connection.textContent = t("on_this_device");
  connection.classList.remove("offline");
  await refresh(setup.userId);
  await restoreReviewSession(setup.userId);
  nav.showTab("learn");
}

/** Run the first run the wizard collected, then open what it produced. */
async function startOnThisDevice(choices: SetupChoices): Promise<void> {
  await invoke("db_close");
  await invoke("db_open", {});
  const setup = await completeFirstRun(db, {
    locale: choices.locale,
    persona: choices.persona,
    personaContextLabel: choices.personaContextLabel,
    starterCards: starterCards(choices.locale),
  });
  await openLocalLibrary(setup);
}

const setupWizard = initSetupWizard({
  complete: startOnThisDevice,
  openPairing: () => showPairing(false),
});

async function start(): Promise<void> {
  // Remove the Phase-0 test shortcut if an upgraded installation still has it.
  localStorage.removeItem("zam.syncUrl");
  localStorage.removeItem("zam.authToken");

  // A pairing store that cannot be *read* is not the same as no pairing, and
  // neither is a reason to give up: the device-local library is still there.
  // An unsigned simulator build has no keychain entitlement and fails here
  // with OSStatus -34018 — a learner opening the app for the first time must
  // not be met with that.
  let stored: string | null = null;
  try {
    stored = await invoke<string | null>("pairing_load");
  } catch {
    stored = null;
  }

  if (stored) {
    try {
      const payload = parseZamPairPayload(stored);
      currentPairing = payload;
      currentUserId = payload.learner.userId;
      showApp(payload);
      await connect(payload, false);
      return;
    } catch (error) {
      showPairing(false);
      setPairingStatus(
        tf("stored_pairing_failed", { error: errorMessage(error) }),
        true,
      );
      return;
    }
  }

  // No pairing: either a device-local library from an earlier run, or a fresh
  // install that has never been set up.
  try {
    await invoke("db_open", {});
    const setup = await prepareLocalLibrary(db);
    if (setup) {
      await openLocalLibrary(setup);
      return;
    }
    setupWizard.restart();
    nav.showRoot("setup");
  } catch (error) {
    setupWizard.restart();
    nav.showRoot("setup");
    setupWizard.setStatus(
      tf("local_open_failed", { error: errorMessage(error) }),
      true,
    );
  }
}

window.addEventListener("focus", () => {
  window.setTimeout(() => void takeSharedImport(), 150);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    window.setTimeout(() => void takeSharedImport(), 150);
    return;
  }
  // Where a session cannot outlive backgrounding (iOS), end it explicitly:
  // the OS takes the microphone back regardless, and a session left "running"
  // would sit waiting for audio that can never arrive. Android deliberately
  // keeps going here — reviewing with the screen off is the whole point of
  // hands-free (ADR 2026-07-31).
  if (!platformFeatures.voiceSurvivesBackground && voiceController.active) {
    void pauseVoiceMode();
  }
});

function setReminderStatus(text: string, isError = false): void {
  reminderStatus.textContent = text;
  reminderStatus.classList.toggle("error", isError);
}

function renderReminderControls(): void {
  reminderEnabled.checked = reminderConfig.enabled;
  reminderTime.value = formatTimeInput(reminderConfig);
}

/** Best-effort: hand the latest due count to the native reminder store. */
async function updateReminderDue(dueCount: number): Promise<void> {
  try {
    await invoke("reminder_update_due", { count: Math.max(0, dueCount) });
  } catch {
    // The daily reminder is best-effort and must never break the queue view.
  }
}

/** Persist config and (re)schedule or cancel the daily WorkManager reminder. */
async function applyReminder(requestPermission: boolean): Promise<void> {
  localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminderConfig));
  try {
    let denied = false;
    if (reminderConfig.enabled && requestPermission) {
      const permission = await invoke<{ notifications?: string }>(
        "reminder_request_permissions",
      );
      denied = Boolean(
        permission?.notifications && permission.notifications !== "granted",
      );
    }
    await invoke("reminder_schedule", {
      enabled: reminderConfig.enabled,
      initialDelayMs: millisUntilNext(
        reminderConfig.hour,
        reminderConfig.minute,
      ),
    });
    if (!reminderConfig.enabled) {
      setReminderStatus(t("reminder_off"));
    } else if (denied) {
      setReminderStatus(t("reminder_denied"), true);
    } else {
      setReminderStatus(
        tf("reminder_active", { time: formatTimeInput(reminderConfig) }),
      );
    }
  } catch (error) {
    setReminderStatus(
      tf("reminder_set_failed", { error: errorMessage(error) }),
      true,
    );
  }
}

reminderEnabled.addEventListener("change", () => {
  reminderConfig = { ...reminderConfig, enabled: reminderEnabled.checked };
  void applyReminder(true);
});

reminderTime.addEventListener("change", () => {
  const parsed = parseTimeInput(reminderTime.value);
  if (!parsed) {
    setReminderStatus(t("invalid_time"), true);
    renderReminderControls();
    return;
  }
  reminderConfig = {
    ...reminderConfig,
    hour: parsed.hour,
    minute: parsed.minute,
  };
  void applyReminder(false);
});

function setUpdateStatus(text: string, isError = false): void {
  updateStatus.textContent = text;
  updateStatus.classList.toggle("error", isError);
}

async function refreshInstalledVersion(): Promise<void> {
  try {
    const info = await invoke<{ versionName: string; versionCode: number }>(
      "update_get_version",
    );
    updateVersion.textContent = tf("update_current", {
      version: info.versionName,
    });
  } catch {
    updateVersion.textContent = "";
  }
}

async function checkForAppUpdate(quiet = false): Promise<void> {
  checkUpdateButton.disabled = true;
  installUpdateButton.hidden = true;
  pendingUpdate = null;
  if (!quiet) setUpdateStatus(t("update_checking"));
  try {
    const info = await invoke<MobileUpdateInfo>("update_check", {
      manifestUrl: DEFAULT_MOBILE_UPDATE_MANIFEST,
    });
    updateVersion.textContent = tf("update_current", {
      version: info.currentVersionName,
    });
    if (info.updateAvailable) {
      pendingUpdate = info;
      installUpdateButton.hidden = false;
      setUpdateStatus(tf("update_available", { version: info.version }));
    } else if (!quiet) {
      setUpdateStatus(
        tf("update_current_ok", { version: info.currentVersionName }),
      );
    }
  } catch (error) {
    if (!quiet) {
      setUpdateStatus(
        tf("update_failed", { error: errorMessage(error) }),
        true,
      );
    }
  } finally {
    checkUpdateButton.disabled = false;
  }
}

voiceEngineSelect.addEventListener("change", () => {
  const chosen = voiceEngineSelect.value as VoiceEnginePreference;
  if (!VOICE_ENGINE_PREFERENCES.includes(chosen)) return;
  voicePreference = chosen;
  localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, chosen);
  renderVoiceSettings();
});

checkUpdateButton.addEventListener("click", () => {
  void checkForAppUpdate(false);
});

installUpdateButton.addEventListener("click", async () => {
  if (!pendingUpdate?.url) return;
  installUpdateButton.disabled = true;
  setUpdateStatus(t("update_downloading"));
  try {
    await invoke("update_install", { url: pendingUpdate.url });
    setUpdateStatus(t("update_install_started"));
  } catch (error) {
    setUpdateStatus(tf("update_failed", { error: errorMessage(error) }), true);
  } finally {
    installUpdateButton.disabled = false;
  }
});

// Localise the static chrome from the device locale; showApp re-applies the
// paired learner's locale once a pairing is loaded.
applyLocale(navigator.language);
renderReminderControls();
void refreshInstalledVersion();
// Hide what this platform does not have, then run the quiet update check only
// where in-app updates exist — on iOS it fails by design and would surface a
// misleading error.
void applyPlatformFeatures().then(() => {
  if (platformFeatures.inAppUpdate) void checkForAppUpdate(true);
});
if (reminderConfig.enabled) {
  // Re-arm the schedule from stored config on launch without a permission prompt.
  void applyReminder(false);
}

void start();
