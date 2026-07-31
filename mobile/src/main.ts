/** Android companion: pairing, offline recall/import/voice, and resilient sync. */

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
import {
  HandsFreeReviewController,
  resolveVoiceLocale,
  type VoiceLocale,
  type VoicePort,
} from "./voice.js";

const db = createTauriDatabase((command, args) => invoke(command, args));
const reviewSession = new MobileReviewSession(db, localStorage);

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
}

const pairingView = element<HTMLElement>("pairing-view");
const appView = element<HTMLElement>("app-view");
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
const dashboardView = element<HTMLElement>("dashboard-view");
const summary = element<HTMLElement>("summary");
const queueList = element<HTMLOListElement>("queue");
const startReviewButton = element<HTMLButtonElement>("start-review");
const openImportButton = element<HTMLButtonElement>("open-import");
const importView = element<HTMLElement>("import-view");
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
const reviewView = element<HTMLElement>("review-view");
const reviewProgress = element<HTMLElement>("review-progress");
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
const sessionSummaryView = element<HTMLElement>("session-summary-view");
const sessionSummaryText = element<HTMLElement>("session-summary-text");
const backToQueueButton = element<HTMLButtonElement>("back-to-queue");
const resyncButton = element<HTMLButtonElement>("resync");
const repairButton = element<HTMLButtonElement>("repair");
const reminderEnabled = element<HTMLInputElement>("reminder-enabled");
const reminderTime = element<HTMLInputElement>("reminder-time");
const reminderStatus = element<HTMLParagraphElement>("reminder-status");
const settingsView = element<HTMLElement>("settings-view");
const openSettingsButton = element<HTMLButtonElement>("open-settings");
const closeSettingsButton = element<HTMLButtonElement>("close-settings");
const updateVersion = element<HTMLElement>("update-version");
const updateStatus = element<HTMLParagraphElement>("update-status");
const checkUpdateButton = element<HTMLButtonElement>("check-update");
const installUpdateButton = element<HTMLButtonElement>("install-update");
const voiceControls = element<HTMLElement>("voice-controls");
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
  updateControls.hidden = !platformFeatures.inAppUpdate;
  updateUnavailable.hidden = platformFeatures.inAppUpdate;
}

let currentPairing: ZamPairPayloadV1 | null = null;
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

const voicePort: VoicePort = {
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
};

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

function setPairingStatus(text: string, isError = false): void {
  pairingStatus.textContent = text;
  pairingStatus.classList.toggle("error", isError);
}

function setStatus(text: string, isError = false): void {
  statusLine.textContent = text;
  statusLine.classList.toggle("error", isError);
}

function showPairing(canCancel: boolean): void {
  pairingView.hidden = false;
  appView.hidden = true;
  cancelPairingButton.hidden = !canCancel;
  cameraSettingsButton.hidden = true;
  setPairingStatus(t(canCancel ? "pairing_hint_keep" : "pairing_hint_scan"));
}

function showApp(payload: ZamPairPayloadV1): void {
  // Paint from the pairing snapshot at once, then correct from the database.
  learnerLocale = payload.settings?.locale ?? navigator.language;
  applyLocale(learnerLocale);
  void refreshLearnerLocaleFromDb();
  pairingView.hidden = true;
  appView.hidden = false;
  learner.textContent = payload.learner.userId;
}

function showDashboard(): void {
  dashboardView.hidden = false;
  importView.hidden = true;
  reviewView.hidden = true;
  sessionSummaryView.hidden = true;
  settingsView.hidden = true;
  openSettingsButton.disabled = false;
}

function showReview(): void {
  dashboardView.hidden = true;
  importView.hidden = true;
  reviewView.hidden = false;
  sessionSummaryView.hidden = true;
  settingsView.hidden = true;
  // No jumping to settings mid-review; the gear returns after the session.
  openSettingsButton.disabled = true;
}

function showSessionSummary(): void {
  dashboardView.hidden = true;
  importView.hidden = true;
  reviewView.hidden = true;
  sessionSummaryView.hidden = false;
  settingsView.hidden = true;
  openSettingsButton.disabled = false;
}

function showImport(): void {
  dashboardView.hidden = true;
  importView.hidden = false;
  reviewView.hidden = true;
  sessionSummaryView.hidden = true;
  settingsView.hidden = true;
  openSettingsButton.disabled = false;
}

function showSettings(): void {
  dashboardView.hidden = true;
  importView.hidden = true;
  reviewView.hidden = true;
  sessionSummaryView.hidden = true;
  settingsView.hidden = false;
  renderReminderControls();
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
  if (!currentPairing) return;

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
    if (currentPairing) openPendingImport();
  } catch (error) {
    if (currentPairing && !reviewSession.active) {
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
    due: queue.reviewCount,
    new: queue.newCount,
    relearn: queue.relearnCount,
    domains: queue.totalDomains.join(", ") || "–",
  });
  queueList.replaceChildren();
  for (const item of queue.items) {
    const entry = document.createElement("li");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = tf("queue_item_meta", {
      domain: item.domain,
      bloom: item.bloomLevel,
      state: item.state,
      due: formatDateTime(item.dueAt),
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
      endpoint: currentPairing?.llm?.recall ?? null,
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
  const locale = resolveVoiceLocale(
    currentPairing?.settings?.locale ?? navigator.language,
  );
  installVoiceDataButton.hidden = true;
  updateVoiceButton();
  void voiceController
    .start(locale)
    .catch((error) => {
      const message = errorMessage(error);
      installVoiceDataButton.hidden = !/(TTS|Sprachdaten|TTS-Stimme)/i.test(
        message,
      );
      setReviewStatus(tf("voice_paused_msg", { message }), true);
    })
    .finally(updateVoiceButton);
  updateVoiceButton();
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
  reviewMeta.textContent = tf("review_meta", {
    title: item.title,
    domain: item.domain || t("no_domain"),
    bloom: item.bloomLevel,
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
    setStatus(tf("paired_no_cards", { user: userId }));
    summary.textContent = "";
    queueList.replaceChildren();
    startReviewButton.disabled = true;
    await updateReminderDue(0);
    return;
  }
  const queue = await buildReviewQueue(db, { userId });
  setStatus(
    tf("queue_for", {
      user: userId,
      count: cardCount,
      cards: cardWord(cardCount),
    }),
  );
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

openSettingsButton.addEventListener("click", () => showSettings());
closeSettingsButton.addEventListener("click", () => showDashboard());

openImportButton.addEventListener("click", () => {
  resetImport();
  showImport();
  importInput.focus();
});

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
  if (!multiDraftController || !currentPairing) return;
  const hasMore = multiDraftController.skip();
  if (!hasMore) {
    const { saved, skipped } = multiDraftController.state();
    const userId = currentPairing.learner.userId;
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
  if (!currentPairing) return;
  confirmImportButton.disabled = true;
  skipImportDraftButton.disabled = true;
  try {
    const draft = draftFromForm();
    const result = await confirmMobileImport(
      db,
      currentPairing.learner.userId,
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
      await refresh(currentPairing.learner.userId);
      showDashboard();
      setStatus(tf("import_batch_done", { saved, skipped }));
      return;
    }

    resetImport();
    await refresh(currentPairing.learner.userId);
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
  if (!currentPairing) return;
  startReviewButton.disabled = true;
  try {
    const started = await reviewSession.start(currentPairing.learner.userId);
    if (!started) {
      setStatus(t("no_due_cards"));
      await refresh(currentPairing.learner.userId);
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
  if (!currentPairing) return;
  backToQueueButton.disabled = true;
  try {
    await refresh(currentPairing.learner.userId);
    showDashboard();
    openPendingImport();
  } catch (error) {
    setStatus(tf("queue_load_failed", { error: errorMessage(error) }), true);
  } finally {
    backToQueueButton.disabled = false;
  }
});

resyncButton.addEventListener("click", async () => {
  if (!currentPairing) return;
  resyncButton.disabled = true;
  try {
    setStatus(t("syncing"));
    await synchronize((message) => setStatus(message, true));
    await refresh(currentPairing.learner.userId);
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

async function start(): Promise<void> {
  // Remove the Phase-0 test shortcut if an upgraded installation still has it.
  localStorage.removeItem("zam.syncUrl");
  localStorage.removeItem("zam.authToken");
  try {
    const stored = await invoke<string | null>("pairing_load");
    if (!stored) {
      showPairing(false);
      return;
    }
    const payload = parseZamPairPayload(stored);
    currentPairing = payload;
    showApp(payload);
    await connect(payload, false);
  } catch (error) {
    showPairing(false);
    setPairingStatus(
      tf("stored_pairing_failed", { error: errorMessage(error) }),
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
