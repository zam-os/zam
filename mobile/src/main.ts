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
  beginTurn,
  completeTurn,
  createDiscussionState,
  type DiscussionCardContext,
  failTurn,
  openDiscussion,
  resetDiscussion,
} from "../../desktop/src/discussion.js";
import {
  parseZamPairPayload,
  serializeZamPairPayload,
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairLlmEndpoint,
  type ZamPairPayloadV1,
} from "../../src/bridge/mobile-pairing.js";
import type { TopicNode } from "../../src/cli/curriculum/types.js";
import {
  OPENROUTER_PROVIDER,
  OPENROUTER_RECOMMENDED_MODELS,
} from "../../src/cli/llm/cloud-providers.js";
import {
  AI_TIER_PREFERENCES,
  type AiCapability,
  type AiPlatform,
  type AiTierPreference,
} from "../../src/kernel/ai/tier-preference.js";
import {
  bonusCandidates,
  enrolBonusAtom,
} from "../../src/kernel/library/bonus.js";
import {
  type BundledCellStatus,
  enrolBundledCell,
  getBundledCellsWithStatus,
} from "../../src/kernel/library/bundled-cells.js";
import {
  assessPrecondition,
  getPreconditionCandidates,
} from "../../src/kernel/library/precondition-assessment.js";
import {
  getPullForwardCandidates,
  pullForwardCards,
} from "../../src/kernel/library/pull-forward.js";
import {
  getTokenMedia,
  type TokenMedia,
} from "../../src/kernel/models/media.js";
import { getSetting } from "../../src/kernel/models/settings.js";
import {
  buildReviewQueue,
  type ReviewQueue,
} from "../../src/kernel/scheduler/queue.js";
import { unburySiblingCards } from "../../src/kernel/scheduler/siblings.js";
import {
  DEFAULT_STUDY_LEARNING_SETTINGS,
  getStudyLearningSettings,
  getStudyWorkloadSettings,
  setStudyLearningSettings,
  setStudyWorkloadSettings,
  STUDY_WORKLOAD_PRESETS,
  type StudyLearningMode,
  type StudyLearningSettings,
  type StudyWorkloadPreset,
  type StudyWorkloadSettings,
} from "../../src/kernel/scheduler/study-settings.js";
import {
  connectCloudModel,
  connectedCloudLabel,
  disconnectCloudModel,
  migrateStaleCloudDefaults,
} from "./ai/connect.js";
import { embedInBackground } from "./ai/embedder.js";
import {
  checkEndpoint,
  ENDPOINT_CAPABILITIES,
  type EndpointCapability,
  type EndpointError,
  listEndpoints,
  type ManagedEndpoint,
  moveEndpoint,
  removeEndpoint,
  saveEndpoint,
} from "./ai/endpoints.js";
import {
  AI_TIER_PREFERENCE_STORAGE_KEY,
  type AiSettingsRow,
  buildAiSettingsRows,
  parseStoredAiPreferences,
  readAiPreference,
  serializeAiPreferences,
} from "./ai/tier-preference.js";
import {
  NoTranslationBackendError,
  TranslationFailedError,
  translateCard,
} from "./ai/translate.js";
import {
  applyMobileCurriculumChoice,
  initialMobileCurriculumState,
  type MobileCurriculumOption,
  type MobileCurriculumState,
  type MobileCurriculumStep,
  type MobileCurriculumView,
  NoMobileCurriculumModelError,
  nextMobileCurriculumView,
  previewMobileCurriculumTopic,
  resolveMobileCurriculumPosition,
} from "./curriculum.js";
import { discussMobileReview } from "./discuss.js";
import {
  evaluateMobileAnswer,
  evaluationSpeech,
  generateViaHttp,
  type MobileEvaluationResult,
  NoEvaluationBackendError,
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
  type LibraryEntry,
  listLibrary,
  pauseCard,
  removeCard,
  resumeCard,
  saveCardEdit,
  searchLibrary,
} from "./library.js";
import {
  diagnoseMobileCloudCapability,
  resolveMobileCloudChain,
} from "./model-registry.js";
import {
  createMultiDraftController,
  type MultiDraftController,
} from "./multi-draft.js";
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
import {
  completeFirstRun,
  type LocalSetup,
  prepareLocalLibrary,
  prepareStandaloneLaunch,
} from "./setup/first-run.js";
import { starterCards } from "./setup/starter-content.js";
import { REMOTE_NOT_EMPTY, upgradeToServerDatabase } from "./setup/upgrade.js";
import { initSetupWizard, type SetupChoices } from "./setup/wizard.js";
import { synthesizeViaCloud, transcribeViaCloud } from "./speech.js";
import {
  loadStatsView,
  type StatsFormatters,
  type StatsPeriod,
  type StatsView,
} from "./stats.js";
import {
  type BonusOffer,
  bonusBecause,
  keepGoingCardIds,
  matchUnassessedPrecondition,
  type PreconditionOffer,
} from "./study-offers.js";
import { SyncError, syncWithRetry } from "./sync.js";
import { createNav } from "./ui/nav.js";
import {
  DEFAULT_MOBILE_UPDATE_MANIFEST,
  type MobileUpdateInfo,
} from "./update.js";
import {
  resolveMobileVisionEndpoint,
  visionImportUnavailableReason,
} from "./vision-config.js";
import {
  decomposeImageViaVision,
  extractChatCompletionsContent,
} from "./vl-import.js";
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
let preconditionCache: PreconditionOffer[] = [];
let bonusIgnoredThisSession = false;
let pendingSessionSummary: MobileReviewSummary | null = null;

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
const queueOffer = element<HTMLElement>("queue-offer");
const queueOfferTitle = element<HTMLElement>("queue-offer-title");
const queueOfferBody = element<HTMLElement>("queue-offer-body");
const queueOfferActions = element<HTMLElement>("queue-offer-actions");
const reviewOffer = element<HTMLElement>("review-offer");
const reviewOfferTitle = element<HTMLElement>("review-offer-title");
const reviewOfferBody = element<HTMLElement>("review-offer-body");
const reviewOfferActions = element<HTMLElement>("review-offer-actions");
const reviewCard = element<HTMLElement>("review-card");
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
const libraryBrowse = element<HTMLElement>("library-browse");
const libraryDetail = element<HTMLElement>("library-detail");
const librarySearch = element<HTMLInputElement>("library-search");
const libraryList = element<HTMLUListElement>("library-list");
const libraryCount = element<HTMLElement>("library-count");
const libraryEmpty = element<HTMLElement>("library-empty");
const bundledCellsList = element<HTMLElement>("bundled-cells-list");
const bundledCellsStatus = element<HTMLParagraphElement>(
  "bundled-cells-status",
);
const openCurriculumButton = element<HTMLButtonElement>("open-curriculum");
const libraryCurriculum = element<HTMLElement>("library-curriculum");
const curriculumBackButton = element<HTMLButtonElement>("curriculum-back");
const curriculumBreadcrumb = element<HTMLElement>("curriculum-breadcrumb");
const curriculumStepTitle = element<HTMLElement>("curriculum-step-title");
const curriculumStepHint = element<HTMLElement>("curriculum-step-hint");
const curriculumOptions = element<HTMLElement>("curriculum-options");
const curriculumModelSettings = element<HTMLButtonElement>(
  "curriculum-model-settings",
);
const curriculumStatus = element<HTMLParagraphElement>("curriculum-status");
const libraryAddButton = element<HTMLButtonElement>("library-add");
const libraryBackButton = element<HTMLButtonElement>("library-back");
const detailTitle = element<HTMLInputElement>("detail-title");
const detailQuestion = element<HTMLTextAreaElement>("detail-question");
const detailConcept = element<HTMLTextAreaElement>("detail-concept");
const detailDomain = element<HTMLInputElement>("detail-domain");
const detailSaveButton = element<HTMLButtonElement>("detail-save");
const detailPauseButton = element<HTMLButtonElement>("detail-pause");
const detailDeleteButton = element<HTMLButtonElement>("detail-delete");
const detailStatus = element<HTMLParagraphElement>("detail-status");
const importDescText = element<HTMLElement>("import-desc-text");
const importEntry = element<HTMLElement>("import-entry");
const upgradeUrl = element<HTMLInputElement>("upgrade-url");
const upgradeToken = element<HTMLInputElement>("upgrade-token");
const upgradeStartButton = element<HTMLButtonElement>("upgrade-start");
const upgradeReplaceButton = element<HTMLButtonElement>("upgrade-replace");
const upgradeStatus = element<HTMLParagraphElement>("upgrade-status");
const aiState = element<HTMLElement>("ai-state");
const aiDesc = element<HTMLElement>("ai-desc");
const aiKeyField = element<HTMLElement>("ai-key-field");
const aiKeyInput = element<HTMLInputElement>("ai-key");
const aiModelSelect = element<HTMLSelectElement>("ai-model");
const aiModelCustomField = element<HTMLElement>("ai-model-custom-field");
const aiModelCustomInput = element<HTMLInputElement>("ai-model-custom");
const aiConnectButton = element<HTMLButtonElement>("ai-connect");
const aiChangeKeyButton = element<HTMLButtonElement>("ai-change-key");
const aiGetKeyButton = element<HTMLButtonElement>("ai-get-key");
const aiDisconnectButton = element<HTMLButtonElement>("ai-disconnect");
const aiStatus = element<HTMLParagraphElement>("ai-status");
const endpointsToggle = element<HTMLButtonElement>("endpoints-toggle");
const endpointsPanel = element<HTMLElement>("endpoints-panel");
const endpointsList = element<HTMLUListElement>("endpoints-list");
const endpointsEmpty = element<HTMLElement>("endpoints-empty");
const endpointsStatus = element<HTMLParagraphElement>("endpoints-status");
const endpointAddButton = element<HTMLButtonElement>("endpoint-add");
const endpointForm = element<HTMLElement>("endpoint-form");
const endpointLabelInput = element<HTMLInputElement>("endpoint-label");
const endpointUrlInput = element<HTMLInputElement>("endpoint-url");
const endpointModelInput = element<HTMLInputElement>("endpoint-model");
const endpointKeyInput = element<HTMLInputElement>("endpoint-key");
const endpointCheckButton = element<HTMLButtonElement>("endpoint-check");
const endpointSaveButton = element<HTMLButtonElement>("endpoint-save");
const endpointCancelButton = element<HTMLButtonElement>("endpoint-cancel");
const endpointDeleteButton = element<HTMLButtonElement>("endpoint-delete");
const capabilityInputs: Record<EndpointCapability, HTMLInputElement> = {
  text: element<HTMLInputElement>("cap-text"),
  image: element<HTMLInputElement>("cap-image"),
  embedding: element<HTMLInputElement>("cap-embedding"),
  stt: element<HTMLInputElement>("cap-stt"),
};

/** Sentinel value for free-form OpenRouter model ids outside the short list. */
const AI_MODEL_CUSTOM = "__custom__";

/** Whether a cloud key is already registered (button label / empty-key path). */
let aiConnected = false;

/** Fill the model select; free-form ids land on "Other model…". */
function ensureAiModelOptions(selected?: string | null): void {
  const current = selected ?? selectedModelId();
  aiModelSelect.replaceChildren();
  for (const model of OPENROUTER_RECOMMENDED_MODELS) {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label;
    aiModelSelect.appendChild(option);
  }
  const customOption = document.createElement("option");
  customOption.value = AI_MODEL_CUSTOM;
  customOption.textContent = t("ai_model_custom");
  aiModelSelect.appendChild(customOption);

  const onList =
    current &&
    OPENROUTER_RECOMMENDED_MODELS.some((model) => model.id === current);
  if (current && !onList) {
    aiModelSelect.value = AI_MODEL_CUSTOM;
    aiModelCustomInput.value = current;
  } else {
    aiModelSelect.value = current || OPENROUTER_PROVIDER.defaultModel;
    if (onList) aiModelCustomInput.value = "";
  }
  syncAiModelCustomVisibility();
}

function syncAiModelCustomVisibility(): void {
  const custom = aiModelSelect.value === AI_MODEL_CUSTOM;
  aiModelCustomField.hidden = !custom;
}

/** Resolved model id from the select and optional free-form field. */
function selectedModelId(): string {
  if (aiModelSelect.value === AI_MODEL_CUSTOM) {
    return aiModelCustomInput.value.trim();
  }
  return (aiModelSelect.value || OPENROUTER_PROVIDER.defaultModel).trim();
}

ensureAiModelOptions();
aiModelSelect.addEventListener("change", () => {
  syncAiModelCustomVisibility();
  if (aiModelSelect.value === AI_MODEL_CUSTOM) {
    aiModelCustomInput.focus();
  }
});
const reviewProgress = element<HTMLElement>("review-progress");
const reviewProgressFill = element<HTMLElement>("review-progress-fill");
const reviewMeta = element<HTMLElement>("review-meta");
const toggleVoiceButton = element<HTMLButtonElement>("toggle-voice");
const installVoiceDataButton = element<HTMLButtonElement>("install-voice-data");
const reviewQuestion = element<HTMLElement>("review-question");
const reviewQuestionMedia = element<HTMLElement>("review-question-media");
const reviewAnswer = element<HTMLTextAreaElement>("review-answer");
const reviewAnswerField = element<HTMLElement>("review-answer-field");
const reviewFastCheckOptions = element<HTMLElement>(
  "review-fast-check-options",
);
const revealAnswerButton = element<HTMLButtonElement>("reveal-answer");
const revealedAnswer = element<HTMLElement>("revealed-answer");
const expectedAnswer = element<HTMLElement>("expected-answer");
const reviewAnswerMedia = element<HTMLElement>("review-answer-media");
const reviewSource = element<HTMLAnchorElement>("review-source");
const evaluationPanel = element<HTMLElement>("evaluation-panel");
const evaluationVerdict = element<HTMLElement>("evaluation-verdict");
const evaluationFeedback = element<HTMLElement>("evaluation-feedback");
const evaluationMeta = element<HTMLElement>("evaluation-meta");
const discussionPanel = element<HTMLElement>("discussion-panel");
const discussionTurns = element<HTMLElement>("discussion-turns");
const discussionInput = element<HTMLTextAreaElement>("discussion-input");
const discussionSendButton = element<HTMLButtonElement>("discussion-send");
const discussionStatus = element<HTMLParagraphElement>("discussion-status");
const ratingButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-rating]"),
);
const stopReviewButton = element<HTMLButtonElement>("stop-review");
const reviewStatus = element<HTMLParagraphElement>("review-status");

const SAFE_REVIEW_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/mp4",
]);
let reviewMediaRequest = 0;
let reviewMediaUrls: string[] = [];

function clearReviewMedia(): void {
  reviewQuestionMedia.replaceChildren();
  reviewAnswerMedia.replaceChildren();
  for (const url of reviewMediaUrls) URL.revokeObjectURL(url);
  reviewMediaUrls = [];
}

function appendMobileMedia(container: HTMLElement, media: TokenMedia): void {
  if (!SAFE_REVIEW_MEDIA_TYPES.has(media.mimeType)) return;
  const bytes = new Uint8Array(media.data.byteLength);
  bytes.set(media.data);
  const url = URL.createObjectURL(
    new Blob([bytes.buffer], { type: media.mimeType }),
  );
  reviewMediaUrls.push(url);
  if (media.kind === "audio") {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "metadata";
    audio.src = url;
    container.appendChild(audio);
    return;
  }
  const frame = document.createElement("div");
  frame.className = "review-media-frame";
  const image = document.createElement("img");
  image.src = url;
  image.alt = media.altText || media.originalName;
  frame.appendChild(image);
  for (const shape of media.occlusions) {
    const mask = document.createElement("span");
    mask.className = "review-media-occlusion";
    mask.style.left = `${shape.left * 100}%`;
    mask.style.top = `${shape.top * 100}%`;
    mask.style.width = `${shape.width * 100}%`;
    mask.style.height = `${shape.height * 100}%`;
    if (shape.shape === "ellipse") mask.style.borderRadius = "50%";
    frame.appendChild(mask);
  }
  container.appendChild(frame);
}

async function renderMobileReviewMedia(tokenId: string): Promise<void> {
  const request = ++reviewMediaRequest;
  clearReviewMedia();
  try {
    const media = await getTokenMedia(db, tokenId);
    if (
      request !== reviewMediaRequest ||
      reviewSession.currentItem?.tokenId !== tokenId
    ) {
      return;
    }
    for (const item of media) {
      appendMobileMedia(
        item.side === "question" ? reviewQuestionMedia : reviewAnswerMedia,
        item,
      );
    }
  } catch {
    // Text remains a complete, offline fallback if a legacy media row is bad.
  }
}
const cardManageButton = element<HTMLButtonElement>("card-manage");
const cardManageMenu = element<HTMLElement>("card-manage-menu");
const cardEditItem = element<HTMLButtonElement>("card-edit");
const cardTranslateItem = element<HTMLButtonElement>("card-translate");
const cardDeleteItem = element<HTMLButtonElement>("card-delete");
const cardEditPanel = element<HTMLElement>("card-edit-panel");
const cardEditQuestion = element<HTMLTextAreaElement>("card-edit-question");
const cardEditConcept = element<HTMLTextAreaElement>("card-edit-concept");
const cardEditSaveButton = element<HTMLButtonElement>("card-edit-save");
const cardEditCancelButton = element<HTMLButtonElement>("card-edit-cancel");
const cardEditStatus = element<HTMLParagraphElement>("card-edit-status");
const sessionSummaryText = element<HTMLElement>("session-summary-text");
const backToQueueButton = element<HTMLButtonElement>("back-to-queue");
const resyncButton = element<HTMLButtonElement>("resync");
const repairButton = element<HTMLButtonElement>("repair");
const reminderEnabled = element<HTMLInputElement>("reminder-enabled");
const reminderTime = element<HTMLInputElement>("reminder-time");
const reminderStatus = element<HTMLParagraphElement>("reminder-status");
const localAiRows = element<HTMLElement>("local-ai-rows");
const localAiPrepare = element<HTMLButtonElement>("local-ai-prepare");
const localAiStatus = element<HTMLParagraphElement>("local-ai-status");
const studyLearningMode = element<HTMLSelectElement>("study-learning-mode");
const studyVoiceRevealTimeout = element<HTMLInputElement>(
  "study-voice-reveal-timeout",
);
const studyLearningSave = element<HTMLButtonElement>("study-learning-save");
const studyLearningStatus = element<HTMLParagraphElement>(
  "study-learning-status",
);
const reviewModeFlash = element<HTMLButtonElement>("review-mode-flash");
const reviewModeFeedback = element<HTMLButtonElement>("review-mode-feedback");
const reviewModeSwitcher = element<HTMLElement>("review-mode-switcher");
const studyWorkloadPreset = element<HTMLSelectElement>("study-workload-preset");
const studyMaxNew = element<HTMLInputElement>("study-max-new");
const studyMaxReviews = element<HTMLInputElement>("study-max-reviews");
const studyBuryNew = element<HTMLInputElement>("study-bury-new");
const studyBuryReview = element<HTMLInputElement>("study-bury-review");
const studyWorkloadSave = element<HTMLButtonElement>("study-workload-save");
const studyUnbury = element<HTMLButtonElement>("study-unbury");
const studyWorkloadStatus = element<HTMLParagraphElement>(
  "study-workload-status",
);
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
const discussion = createDiscussionState();
const PENDING_IMPORT_STORAGE_KEY = "zam.mobile-pending-import.v1";

/** Device-local, read on demand so a Settings change applies to the next card. */
function storedAiPreferences() {
  return parseStoredAiPreferences(
    localStorage.getItem(AI_TIER_PREFERENCE_STORAGE_KEY),
  );
}

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

function playEarcon(kind: "cue" | "reveal" | "rate"): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (kind === "cue") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (kind === "reveal") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (kind === "rate") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

voicePort.playTone = async (kind) => {
  playEarcon(kind);
};

let currentLearningSettings: StudyLearningSettings = {
  ...DEFAULT_STUDY_LEARNING_SETTINGS,
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
    reviewSession.reveal({
      allowEmpty: currentLearningSettings.learningMode === "flash",
    });
    renderCurrentReview(t("voice_answer_recognized"));
  },
  evaluateAnswer: async () => {
    if (currentLearningSettings.learningMode === "flash") return null;
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
let cloudEndpoints: Record<"text" | "stt" | "tts", ZamPairLlmEndpoint | null> =
  { text: null, stt: null, tts: null };

async function refreshCloudEndpointsFromDb(): Promise<void> {
  try {
    // Quiet upgrade of ZAM defaults that no longer work (MiMo as default chat,
    // the retired qwen3-embedding-0.6b). Only rewrites models ZAM itself once
    // chose — never a hand-picked model.
    await migrateStaleCloudDefaults(db);
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
  void refreshStudyLearningSettings();
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

/**
 * The platform this build runs on, for the capability matrix.
 *
 * `onDeviceEvaluation` is the Rust shell's own android check, so it answers
 * the same question without a second detection path that could disagree.
 */
function aiPlatform(): AiPlatform {
  return platformFeatures.onDeviceEvaluation ? "android" : "ios";
}

let localAiDeviceStatus: string | null = null;

function localAiStateText(row: AiSettingsRow): string {
  return row.deviceState === "unsupported"
    ? t("local_ai_state_unsupported")
    : tf("local_ai_state", { state: t(`local_ai_status_${row.deviceState}`) });
}

function renderLocalAiRows(): void {
  const rows = buildAiSettingsRows(
    aiPlatform(),
    storedAiPreferences(),
    localAiDeviceStatus,
  );
  localAiRows.replaceChildren();
  for (const row of rows) {
    const label = document.createElement("label");
    label.className = "field";
    const name = document.createElement("span");
    name.textContent = t(`local_ai_capability_${row.capability}`);
    label.appendChild(name);

    if (!row.configurable) {
      // No control at all: a select that cannot change the outcome would be
      // a promise this device cannot keep.
      const state = document.createElement("span");
      state.className = "t-secondary";
      state.textContent = localAiStateText(row);
      label.appendChild(state);
      localAiRows.appendChild(label);
      continue;
    }

    const select = document.createElement("select");
    for (const preference of AI_TIER_PREFERENCES) {
      const option = document.createElement("option");
      option.value = preference;
      option.textContent = t(`local_ai_pref_${preference.replace(/-/g, "_")}`);
      select.appendChild(option);
    }
    select.value = row.preference;
    select.addEventListener("change", () => {
      void saveAiPreference(row.capability, select.value as AiTierPreference);
    });
    label.appendChild(select);
    localAiRows.appendChild(label);

    const state = document.createElement("p");
    state.className = "status";
    state.textContent = localAiStateText(row);
    localAiRows.appendChild(state);
  }
  localAiPrepare.hidden = !rows.some((row) => row.canPrepare);
}

function saveAiPreference(
  capability: AiCapability,
  preference: AiTierPreference,
): void {
  const next = { ...storedAiPreferences(), [capability]: preference };
  localStorage.setItem(
    AI_TIER_PREFERENCE_STORAGE_KEY,
    serializeAiPreferences(next),
  );
  localAiStatus.textContent = t("local_ai_saved");
  renderLocalAiRows();
}

/**
 * Read the device model's state for the Settings rows.
 *
 * This is the command that existed and was never called; asking here is what
 * lets the section say "downloadable" instead of the learner discovering it
 * mid-review.
 */
async function refreshLocalAi(): Promise<void> {
  if (!platformFeatures.onDeviceEvaluation) {
    localAiDeviceStatus = null;
    renderLocalAiRows();
    return;
  }
  try {
    const status = await invoke<OnDeviceLlmStatus>(
      "on_device_llm_check_status",
    );
    localAiDeviceStatus = status.status;
  } catch (error) {
    localAiDeviceStatus = null;
    localAiStatus.textContent = tf("local_ai_status_failed", {
      error: errorMessage(error),
    });
  }
  renderLocalAiRows();
}

/**
 * Explain which stored models this device can use for evaluation, and why the
 * others are out — the diagnosis a learner had to ask for by hand.
 */
async function renderLocalAiModels(): Promise<void> {
  localAiModels.replaceChildren();
  if (!currentUserId) return;
  let diagnosis: Awaited<ReturnType<typeof diagnoseMobileCloudCapability>>;
  try {
    diagnosis = await diagnoseMobileCloudCapability(db, "text");
  } catch {
    return;
  }

  const heading = document.createElement("p");
  heading.className = "t-secondary";
  heading.textContent =
    diagnosis.length === 0
      ? t("local_ai_models_none")
      : diagnosis.some((row) => row.usable)
        ? t("local_ai_models_some")
        : t("local_ai_models_unusable");
  localAiModels.appendChild(heading);

  for (const row of diagnosis) {
    const line = document.createElement("p");
    line.className = "status";
    line.textContent = row.usable
      ? tf("local_ai_model_usable", { model: row.label })
      : tf("local_ai_model_excluded", {
          model: row.label,
          reason: t(`local_ai_exclusion_${row.exclusion?.replace(/-/g, "_")}`),
        });
    localAiModels.appendChild(line);
  }
}

async function prepareLocalAi(): Promise<void> {
  localAiPrepare.disabled = true;
  localAiStatus.textContent = t("local_ai_preparing");
  try {
    await invoke("on_device_llm_ensure_ready");
    localAiStatus.textContent = t("local_ai_prepared");
  } catch (error) {
    localAiStatus.textContent = tf("local_ai_status_failed", {
      error: errorMessage(error),
    });
  } finally {
    localAiPrepare.disabled = false;
    await refreshLocalAi();
  }
}

function renderReviewModeSwitcher(mode: StudyLearningMode): void {
  const isFlash = mode === "flash";
  reviewModeFlash.classList.toggle("active", isFlash);
  reviewModeFeedback.classList.toggle("active", !isFlash);
  reviewCard.classList.toggle("flash-mode", isFlash);
}

function renderStudyLearningSettings(settings: StudyLearningSettings): void {
  studyLearningMode.value = settings.learningMode;
  studyVoiceRevealTimeout.value = String(settings.voiceRevealTimeoutSec);
  renderReviewModeSwitcher(settings.learningMode);
}

async function refreshStudyLearningSettings(): Promise<void> {
  if (!currentUserId) return;
  try {
    currentLearningSettings = await getStudyLearningSettings(
      db,
      currentUserId,
      {
        fallbackLearningMode: aiConnected ? "answer_feedback" : "flash",
      },
    );
    renderStudyLearningSettings(currentLearningSettings);
  } catch (error) {
    studyLearningStatus.textContent = tf("study_learning_failed", {
      error: errorMessage(error),
    });
  }
}

async function saveStudyLearningSettings(): Promise<void> {
  if (!currentUserId) return;
  studyLearningSave.disabled = true;
  studyLearningStatus.textContent = "";
  try {
    const learningMode = studyLearningMode.value as StudyLearningMode;
    const voiceRevealTimeoutSec =
      Number.parseInt(studyVoiceRevealTimeout.value, 10) || 20;
    currentLearningSettings = await setStudyLearningSettings(
      db,
      currentUserId,
      {
        learningMode,
        voiceRevealTimeoutSec,
      },
      { fallbackLearningMode: aiConnected ? "answer_feedback" : "flash" },
    );
    renderStudyLearningSettings(currentLearningSettings);
    studyLearningStatus.textContent = t("study_learning_saved");
    if (reviewSession.active) {
      renderCurrentReview();
    }
  } catch (error) {
    studyLearningStatus.textContent = tf("study_learning_failed", {
      error: errorMessage(error),
    });
  } finally {
    studyLearningSave.disabled = false;
  }
}

async function switchReviewMode(mode: StudyLearningMode): Promise<void> {
  if (!currentUserId) return;
  currentLearningSettings.learningMode = mode;
  renderReviewModeSwitcher(mode);
  studyLearningMode.value = mode;
  if (reviewSession.active) {
    renderCurrentReview();
  }
  void setStudyLearningSettings(db, currentUserId, {
    learningMode: mode,
  }).catch(() => undefined);
}

function renderStudyWorkload(settings: StudyWorkloadSettings): void {
  studyWorkloadPreset.value = settings.preset;
  studyMaxNew.value = String(settings.maxNew);
  studyMaxReviews.value = String(settings.maxReviews);
  studyBuryNew.checked = settings.buryNewSiblings;
  studyBuryReview.checked = settings.buryReviewSiblings;
}

async function refreshStudyWorkload(): Promise<void> {
  if (!currentUserId) return;
  try {
    renderStudyWorkload(await getStudyWorkloadSettings(db, currentUserId));
  } catch (error) {
    studyWorkloadStatus.textContent = tf("study_workload_failed", {
      error: errorMessage(error),
    });
  }
}

async function saveStudyWorkload(): Promise<void> {
  if (!currentUserId) return;
  studyWorkloadSave.disabled = true;
  studyWorkloadStatus.textContent = "";
  try {
    const preset = studyWorkloadPreset.value as StudyWorkloadPreset;
    const settings = await setStudyWorkloadSettings(
      db,
      currentUserId,
      preset === "custom"
        ? {
            preset,
            maxNew: Number(studyMaxNew.value),
            maxReviews: Number(studyMaxReviews.value),
            buryNewSiblings: studyBuryNew.checked,
            buryReviewSiblings: studyBuryReview.checked,
          }
        : { preset },
    );
    renderStudyWorkload(settings);
    studyWorkloadStatus.textContent = t("study_workload_saved");
    await refresh(currentUserId);
  } catch (error) {
    studyWorkloadStatus.textContent = tf("study_workload_failed", {
      error: errorMessage(error),
    });
  } finally {
    studyWorkloadSave.disabled = false;
  }
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
  // `showImport` triggers the library tab listener, which resets its child
  // view to browse. Select the add view afterwards so curriculum/photo batch
  // previews stay visible instead of flashing and disappearing.
  showImport();
  showLibraryMode("add");
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
            : draft.origin === "curriculum"
              ? "curriculum_preview_ready"
              : "import_quick_prepared",
      ),
  );
  importConcept.focus();
}

function startMultiDraftImport(
  drafts: MobileTokenDraft[],
  message?: string,
): void {
  multiDraftController = createMultiDraftController(drafts);
  const first = multiDraftController.current();
  if (!first) return;
  renderImportDraft(first, message);
}

function prepareImportText(text: string, message?: string): void {
  importInput.value = text;
  try {
    renderImportDraft(parseMobileImport(text), message);
  } catch (error) {
    currentImportDraft = null;
    importDraftForm.hidden = true;
    showImport();
    showLibraryMode("add");
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
    topicId: currentImportDraft.topicId ?? undefined,
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
    // Mobile CSS styles `.bars li` / `.track` / `.fill` (components.css).
    // Desktop class names (`stats-row*`) never had rules here, so iPad showed
    // only text while Android WebView sometimes still painted a bare width.
    const entry = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = row.label;
    // The raw bucket key stays reachable for anyone comparing with the CLI.
    label.title = row.bucket;

    const track = document.createElement("span");
    track.className = "track";
    track.setAttribute(
      "aria-label",
      tf("stats_row_aria", {
        label: row.label,
        n: row.reviewedCards,
        cards: cardWord(row.reviewedCards),
      }),
    );
    const fill = document.createElement("span");
    fill.className = "fill";
    fill.style.width = `${row.barPercent}%`;
    track.appendChild(fill);

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = String(row.reviewedCards);

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = row.studyTime ?? t("stats_time_none");

    entry.append(label, track, count, time);
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

function setDiscussionStatus(text: string, isError = false): void {
  discussionStatus.textContent = text;
  discussionStatus.classList.toggle("error", isError);
}

function appendDiscussionTurn(
  role: "user" | "assistant",
  content: string,
  pending = false,
): void {
  const turn = document.createElement("div");
  turn.className = `discussion-turn ${role}${pending ? " pending" : ""}`;
  const roleLabel = document.createElement("span");
  roleLabel.className = "discussion-role";
  roleLabel.textContent = t(
    role === "user" ? "discussion_learner" : "discussion_zam",
  );
  const body = document.createElement("p");
  body.className = "discussion-turn-text";
  // Imported card text and model output are always inert in the review UI.
  body.textContent = content;
  turn.append(roleLabel, body);
  discussionTurns.append(turn);
}

function renderDiscussionTurns(pendingMessage?: string): void {
  discussionTurns.replaceChildren();
  for (const turn of discussion.turns) {
    appendDiscussionTurn(turn.role, turn.content);
  }
  if (pendingMessage) {
    appendDiscussionTurn("user", pendingMessage);
    appendDiscussionTurn("assistant", "…", true);
  }
  discussionTurns.scrollTop = discussionTurns.scrollHeight;
}

function clearDiscussionUi(): void {
  resetDiscussion(discussion);
  discussionPanel.hidden = true;
  discussionTurns.replaceChildren();
  discussionInput.value = "";
  discussionInput.disabled = false;
  discussionSendButton.disabled = true;
  setDiscussionStatus("");
}

function openDiscussionForEvaluation(result: MobileEvaluationResult): void {
  const item = reviewSession.currentItem;
  const prompt = reviewSession.currentPrompt;
  if (!item || !prompt || !reviewSession.revealed) {
    clearDiscussionUi();
    return;
  }
  const card: DiscussionCardContext = {
    slug: item.slug,
    concept: prompt.concept,
    domain: item.domain,
    bloomLevel: item.bloomLevel,
    context: null,
    question: prompt.question,
    userAnswer: reviewSession.draftAnswer,
    sourceContent: null,
    sourceLink: prompt.sourceLink,
    feedback: result.evaluation.feedback,
  };
  if (!openDiscussion(discussion, card, { evaluationSuccessful: true })) {
    clearDiscussionUi();
    return;
  }
  discussionPanel.hidden = false;
  discussionInput.value = "";
  discussionInput.disabled = false;
  discussionSendButton.disabled = true;
  renderDiscussionTurns();
  setDiscussionStatus("");
}

async function sendDiscussionTurn(): Promise<void> {
  await pauseVoiceMode().catch(() => undefined);
  const message = discussionInput.value.trim();
  const guard = beginTurn(discussion, message);
  if (guard === null || !discussion.card) return;

  discussionInput.disabled = true;
  discussionSendButton.disabled = true;
  setDiscussionStatus(t("discussion_thinking"));
  renderDiscussionTurns(message);

  const card = discussion.card;
  const turns = [...discussion.turns];
  try {
    const result = await discussMobileReview({
      card,
      turns,
      message,
      locale: learnerLocale ?? navigator.language,
      endpoint: recallEndpoint(),
      onDeviceAvailable: platformFeatures.onDeviceEvaluation,
      preference: readAiPreference(storedAiPreferences(), "recall"),
      ports: evaluationPorts,
    });
    if (!completeTurn(discussion, guard, message, result.text)) return;
    discussionInput.value = "";
    renderDiscussionTurns();
    setDiscussionStatus(
      [
        tf("evaluation_backend", { model: result.modelLabel }),
        ...(result.fallbackReason
          ? [tf("evaluation_fallback", { reason: result.fallbackReason })]
          : []),
      ].join(" · "),
    );
  } catch (error) {
    if (!failTurn(discussion, guard)) return;
    renderDiscussionTurns();
    setDiscussionStatus(
      tf("discussion_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    if (guard === discussion.seq && discussion.active) {
      discussionInput.disabled = false;
      discussionSendButton.disabled = !discussionInput.value.trim();
      discussionInput.focus();
    }
  }
}

function clearEvaluationUi(): void {
  currentEvaluation = null;
  evaluationPanel.hidden = true;
  evaluationVerdict.textContent = "";
  evaluationFeedback.textContent = "";
  evaluationMeta.textContent = "";
  clearDiscussionUi();
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
    // A tier the learner did not choose says so, right where the model is
    // named (ADR 2026-08-09c §5). Null means they got what they asked for.
    ...(result.fallbackReason
      ? [tf("evaluation_fallback", { reason: result.fallbackReason })]
      : []),
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
      preference: readAiPreference(storedAiPreferences(), "recall"),
      ports: evaluationPorts,
    });
    if (isStaleEvaluation(item.cardId)) return null;
    if (result) {
      showEvaluationUi(result);
      openDiscussionForEvaluation(result);
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
    if (error instanceof NoEvaluationBackendError) {
      // No key connected — the ordinary state of a fresh install. Ask for a
      // self-rating the same way an unanswered card does, rather than showing
      // a red failure the learner cannot act on and did not cause.
      setReviewStatus(t("compare_and_rate"));
      return null;
    }
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
      setReviewStatus(
        t(voiceUnavailableKey(plan) ?? "voice_unavailable"),
        true,
      );
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
      await voiceController.start(locale, {
        mode: currentLearningSettings.learningMode,
        revealTimeoutMs: currentLearningSettings.voiceRevealTimeoutSec * 1000,
        ratingTimeoutMs: currentLearningSettings.voiceRatingTimeoutSec * 1000,
      });
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

async function loadPreconditionCache(userId: string): Promise<void> {
  try {
    preconditionCache = await getPreconditionCandidates(db, userId);
  } catch (err) {
    console.warn("Failed to load precondition candidates:", err);
    preconditionCache = [];
  }
}

async function enrolledInScopeAtomIds(userId: string): Promise<string[]> {
  const cells = await getBundledCellsWithStatus(db, userId);
  return [
    ...new Set(
      cells
        .filter((cell) => cell.enrolled)
        .flatMap((cell) => cell.inScopeAtomIds),
    ),
  ];
}

function fillOfferActions(
  container: HTMLElement,
  actions: Array<{ label: string; primary?: boolean; onClick: () => void }>,
): void {
  container.replaceChildren();
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.primary ? "btn primary" : "btn";
    button.textContent = action.label;
    button.addEventListener("click", action.onClick);
    container.appendChild(button);
  }
}

function hideReviewOffer(): void {
  reviewOffer.hidden = true;
  reviewCard.hidden = false;
}

function showReviewOffer(spec: {
  title: string;
  body: string;
  actions: Array<{ label: string; primary?: boolean; onClick: () => void }>;
}): void {
  showReview();
  reviewQuestion.textContent = "";
  reviewOfferTitle.textContent = spec.title;
  reviewOfferBody.textContent = spec.body;
  fillOfferActions(reviewOfferActions, spec.actions);
  reviewCard.hidden = true;
  reviewOffer.hidden = false;
}

function hideQueueOffer(): void {
  queueOffer.hidden = true;
  queueOfferActions.replaceChildren();
}

function showQueueOffer(spec: {
  title: string;
  body: string;
  actions: Array<{ label: string; primary?: boolean; onClick: () => void }>;
}): void {
  queueOfferTitle.textContent = spec.title;
  queueOfferBody.textContent = spec.body;
  fillOfferActions(queueOfferActions, spec.actions);
  queueOffer.hidden = false;
}

function showPreconditionOffer(precondition: PreconditionOffer): void {
  showReviewOffer({
    title: t("precondition_title"),
    body: tf("precondition_body", { title: precondition.title }),
    actions: [
      {
        label: t("precondition_known"),
        onClick: () => {
          void decidePrecondition(precondition.atomId, "known");
        },
      },
      {
        label: t("precondition_learn"),
        primary: true,
        onClick: () => {
          void decidePrecondition(precondition.atomId, "learn");
        },
      },
    ],
  });
}

async function decidePrecondition(
  atomId: string,
  decision: "known" | "learn",
): Promise<void> {
  if (!currentUserId) return;
  try {
    await assessPrecondition(db, {
      userId: currentUserId,
      atomId,
      decision,
    });
  } catch (error) {
    setReviewStatus(errorMessage(error), true);
    return;
  }
  reviewSession.markAtomAssessed(atomId);
  preconditionCache = [];
  if (decision === "learn") {
    hideReviewOffer();
    renderCurrentReview();
    return;
  }
  const summary = await reviewSession.dropAtom(atomId);
  if (summary) {
    await offerAfterQueueFromReview(summary);
    return;
  }
  renderCurrentReview();
}

async function offerAfterQueueFromReview(
  summary: MobileReviewSummary,
): Promise<void> {
  pendingSessionSummary = summary;
  if (!currentUserId) {
    renderSessionSummary(summary);
    return;
  }
  try {
    const candidates = await getPullForwardCandidates(db, currentUserId, {
      limit: 5,
    });
    const selectedCandidates = candidates.slice(0, 5);
    const cardIds = keepGoingCardIds(selectedCandidates);
    const extraNew = selectedCandidates.filter(
      (candidate) => candidate.reason === "new_in_scope",
    ).length;
    if (cardIds.length > 0) {
      showReviewOffer({
        title: t("keep_going_title"),
        body: t("keep_going_body"),
        actions: [
          {
            label: t("session_done_today"),
            onClick: () => {
              void offerBonusThenSummary(summary);
            },
          },
          {
            label: t("keep_going_yes"),
            primary: true,
            onClick: () => {
              void acceptKeepGoingFromReview(cardIds, extraNew, summary);
            },
          },
        ],
      });
      return;
    }
    await offerBonusThenSummary(summary);
  } catch (error) {
    console.warn("Failed to load keep-going candidates:", error);
    await offerBonusThenSummary(summary);
  }
}

async function acceptKeepGoingFromReview(
  cardIds: string[],
  extraNew: number,
  summary: MobileReviewSummary,
): Promise<void> {
  if (!currentUserId) return;
  try {
    await pullForwardCards(db, currentUserId, cardIds);
    const started = await reviewSession.start(currentUserId, {
      maxNew: extraNew,
    });
    if (!started) {
      renderSessionSummary(summary);
      return;
    }
    bonusIgnoredThisSession = false;
    await loadPreconditionCache(currentUserId);
    hideReviewOffer();
    renderCurrentReview();
  } catch (error) {
    setReviewStatus(errorMessage(error), true);
  }
}

async function offerBonusThenSummary(
  summary: MobileReviewSummary,
): Promise<void> {
  if (!currentUserId || bonusIgnoredThisSession) {
    renderSessionSummary(summary);
    return;
  }
  const bonus = await loadBonusOffer(currentUserId);
  if (!bonus) {
    renderSessionSummary(summary);
    return;
  }
  showReviewOffer({
    title: t("bonus_title"),
    body: tf("bonus_body", {
      title: bonus.title,
      because: bonusBecause(bonus.restsOnTitles),
      unlocks: bonus.unlockCount,
    }),
    actions: [
      {
        label: t("bonus_skip"),
        onClick: () => {
          bonusIgnoredThisSession = true;
          renderSessionSummary(summary);
        },
      },
      {
        label: t("bonus_accept"),
        primary: true,
        onClick: () => {
          void acceptBonusThenSummary(bonus.atomId, summary);
        },
      },
    ],
  });
}

async function acceptBonusThenSummary(
  atomId: string,
  summary: MobileReviewSummary,
): Promise<void> {
  if (!currentUserId) {
    renderSessionSummary(summary);
    return;
  }
  try {
    await enrolBonusAtom(db, currentUserId, atomId);
  } catch (error) {
    setReviewStatus(errorMessage(error), true);
    return;
  }
  bonusIgnoredThisSession = true;
  renderSessionSummary(summary);
}

async function loadBonusOffer(userId: string): Promise<BonusOffer | null> {
  try {
    const inScopeAtomIds = await enrolledInScopeAtomIds(userId);
    const candidates = await bonusCandidates(db, userId, {
      inScopeAtomIds,
      limit: 1,
    });
    return candidates[0] ?? null;
  } catch (error) {
    console.warn("Failed to load bonus candidates:", error);
    return null;
  }
}

async function renderDashboardOffers(userId: string): Promise<void> {
  hideQueueOffer();
  try {
    const candidates = await getPullForwardCandidates(db, userId, { limit: 5 });
    const selectedCandidates = candidates.slice(0, 5);
    const cardIds = keepGoingCardIds(selectedCandidates);
    const extraNew = selectedCandidates.filter(
      (candidate) => candidate.reason === "new_in_scope",
    ).length;
    if (cardIds.length > 0) {
      showQueueOffer({
        title: t("keep_going_title"),
        body: t("keep_going_body"),
        actions: [
          {
            label: t("session_done_today"),
            onClick: () => {
              void renderDashboardBonus(userId);
            },
          },
          {
            label: t("keep_going_yes"),
            primary: true,
            onClick: () => {
              void acceptKeepGoingFromDashboard(userId, cardIds, extraNew);
            },
          },
        ],
      });
      return;
    }
    await renderDashboardBonus(userId);
  } catch (error) {
    console.warn("Failed to load keep-going candidates:", error);
    await renderDashboardBonus(userId);
  }
}

async function renderDashboardBonus(userId: string): Promise<void> {
  if (bonusIgnoredThisSession) {
    hideQueueOffer();
    return;
  }
  const bonus = await loadBonusOffer(userId);
  if (!bonus) {
    hideQueueOffer();
    return;
  }
  showQueueOffer({
    title: t("bonus_title"),
    body: tf("bonus_body", {
      title: bonus.title,
      because: bonusBecause(bonus.restsOnTitles),
      unlocks: bonus.unlockCount,
    }),
    actions: [
      {
        label: t("bonus_skip"),
        onClick: () => {
          bonusIgnoredThisSession = true;
          hideQueueOffer();
        },
      },
      {
        label: t("bonus_accept"),
        primary: true,
        onClick: () => {
          void acceptBonusFromDashboard(userId, bonus.atomId);
        },
      },
    ],
  });
}

async function acceptKeepGoingFromDashboard(
  userId: string,
  cardIds: string[],
  extraNew: number,
): Promise<void> {
  try {
    await pullForwardCards(db, userId, cardIds);
    hideQueueOffer();
    const started = await reviewSession.start(userId, { maxNew: extraNew });
    if (!started) {
      await refresh(userId);
      return;
    }
    await loadPreconditionCache(userId);
    renderCurrentReview();
  } catch (error) {
    setStatus(errorMessage(error), true);
  }
}

async function acceptBonusFromDashboard(
  userId: string,
  atomId: string,
): Promise<void> {
  try {
    await enrolBonusAtom(db, userId, atomId);
    bonusIgnoredThisSession = true;
    hideQueueOffer();
    await refresh(userId);
  } catch (error) {
    setStatus(errorMessage(error), true);
  }
}

function renderCurrentReview(message = ""): void {
  const item = reviewSession.currentItem;
  const prompt = reviewSession.currentPrompt;
  if (!item || !prompt) return;

  const progress = reviewSession.progress;
  reviewProgress.textContent = tf("review_progress", {
    current: progress.current,
    total: progress.total,
  });
  reviewProgressFill.style.width = `${
    progress.total > 0 ? ((progress.current - 1) / progress.total) * 100 : 0
  }%`;

  if (item.atomId && !reviewSession.isAtomAssessed(item.atomId)) {
    const precondition = matchUnassessedPrecondition(
      item.atomId,
      preconditionCache,
    );
    if (precondition) {
      showPreconditionOffer(precondition);
      return;
    }
  }

  hideReviewOffer();
  showReview();
  // The title is free text, and for imported cards it is often the first
  // sentence of the answer — so before the reveal the meta line names only the
  // domain. A prompt that prints the answer underneath itself is not recall.
  const tierLabel =
    item.tier === "tier1_fast"
      ? t("tier_fast")
      : item.tier === "tier2_synthesis"
        ? t("tier_synthesis")
        : item.tier;
  const baseMeta = reviewSession.revealed
    ? tf("review_meta", {
        title: item.title,
        domain: item.domain || t("no_domain"),
      })
    : item.domain || t("no_domain");
  reviewMeta.textContent = tierLabel ? `${baseMeta} · ${tierLabel}` : baseMeta;
  reviewQuestion.textContent = prompt.question;
  void renderMobileReviewMedia(item.tokenId);
  reviewAnswer.value = reviewSession.draftAnswer;
  reviewAnswer.disabled = reviewSession.revealed;
  const fastCheck = item.fastCheck;
  const isFlash = currentLearningSettings.learningMode === "flash";
  renderReviewModeSwitcher(currentLearningSettings.learningMode);
  reviewAnswerField.hidden = Boolean(fastCheck) || isFlash;
  revealAnswerButton.hidden = reviewSession.revealed || Boolean(fastCheck);
  reviewFastCheckOptions.hidden = reviewSession.revealed || !fastCheck;
  reviewCard.classList.toggle(
    "flash-tap-zone",
    isFlash && !reviewSession.revealed,
  );
  reviewFastCheckOptions.replaceChildren();
  if (fastCheck && !reviewSession.revealed) {
    for (const [optionIndex, label] of fastCheck.options.entries()) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "btn";
      option.textContent = label;
      option.dataset.fastCheckIndex = String(optionIndex);
      option.addEventListener("click", () => {
        reviewAnswer.value = label;
        reviewSession.updateDraftAnswer(label);
        for (const button of reviewFastCheckOptions.querySelectorAll(
          "button",
        )) {
          (button as HTMLButtonElement).disabled = true;
        }
        revealAnswerButton.click();
      });
      reviewFastCheckOptions.appendChild(option);
    }
  }
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
  closeCardMenu();
  hideCardEditPanel();
  setReviewStatus(message);
  if (
    !reviewSession.revealed &&
    !voiceController.active &&
    !fastCheck &&
    !isFlash
  ) {
    reviewAnswer.focus();
  }
}

/* ── Confirming something destructive ────────────────────────────────────── */

/**
 * Two taps instead of a system dialog.
 *
 * `window.confirm` does nothing inside Tauri's WKWebView — no panel appears
 * and it returns `false` immediately, so every call guarded by it was a button
 * that quietly did nothing. That is how "Delete card" in the Library shipped
 * from 0.29.0 to 0.29.2: it looked like a working control and never removed a
 * card. Verified on the iPad (A16) simulator; the mobile shell has no dialog
 * plugin, which is why the desktop's approach cannot simply be copied.
 *
 * Arming the button in place is better here than a modal anyway: the warning
 * appears on the control the thumb is already on, and walking away — closing
 * the menu, leaving the card — disarms it.
 */
/*
 * Declared up here, assigned below: `closeCardMenu` and `showLibraryMode` both
 * disarm, and both are defined before the buttons they disarm are wired. A
 * `const` would put them in the temporal dead zone for anything that ran
 * during module evaluation — optional chaining does not save you from that.
 */
let disarmCardDelete: (() => void) | undefined;
let disarmLibraryDelete: (() => void) | undefined;
let disarmEndpointDelete: (() => void) | undefined;

function armDestructive(
  button: HTMLButtonElement,
  armedLabel: string,
  onConfirm: () => void | Promise<void>,
): () => void {
  const restingLabel = button.textContent ?? "";
  let armed = false;

  const disarm = (): void => {
    armed = false;
    button.textContent = restingLabel;
    button.classList.remove("armed");
  };

  button.addEventListener("click", async () => {
    if (!armed) {
      armed = true;
      button.textContent = armedLabel;
      button.classList.add("armed");
      return;
    }
    disarm();
    await onConfirm();
  });

  return disarm;
}

/* ── Fixing a card without leaving the session ───────────────────────────── */

function closeCardMenu(): void {
  cardManageMenu.classList.add("hidden");
  cardManageButton.setAttribute("aria-expanded", "false");
  // Walking away from the menu is a change of mind, not a pending deletion.
  disarmCardDelete?.();
}

function hideCardEditPanel(): void {
  cardEditPanel.classList.add("hidden");
  cardEditStatus.textContent = "";
  cardEditStatus.classList.remove("error");
}

function setCardEditStatus(text: string, isError = false): void {
  cardEditStatus.textContent = text;
  cardEditStatus.classList.toggle("error", isError);
}

/**
 * Open the editor on the card being reviewed.
 *
 * The answer is shown here whether or not it has been revealed — you cannot
 * correct a card you are not allowed to read, and someone who has opened the
 * editor has already decided this card is wrong rather than hard.
 */
function openCardEditPanel(): void {
  const prompt = reviewSession.currentPrompt;
  if (!prompt) return;
  cardEditQuestion.value = prompt.question;
  cardEditConcept.value = prompt.concept;
  cardEditPanel.classList.remove("hidden");
  setCardEditStatus("");
  cardEditQuestion.focus();
}

cardManageButton.addEventListener("click", () => {
  if (!cardManageMenu.classList.contains("hidden")) {
    closeCardMenu();
    return;
  }
  cardManageMenu.classList.remove("hidden");
  cardManageButton.setAttribute("aria-expanded", "true");
});

cardEditItem.addEventListener("click", () => {
  closeCardMenu();
  openCardEditPanel();
});

/*
 * Translate stays tappable even with no model connected.
 *
 * A greyed-out row cannot explain itself on a touch screen — there is no
 * hover, so `title` never appears and the learner is left with a dead entry
 * and no reason. `translateCard` resolves the registry before it touches the
 * network, so the "connect a model first" answer is immediate; a sentence in
 * the panel beats silence.
 */
cardTranslateItem.addEventListener("click", async () => {
  closeCardMenu();
  const prompt = reviewSession.currentPrompt;
  if (!prompt) return;
  openCardEditPanel();
  cardTranslateItem.disabled = true;
  setCardEditStatus(t("card_translating"));
  try {
    const translated = await translateCard(
      db,
      { question: cardEditQuestion.value, concept: cardEditConcept.value },
      learnerLocale ?? resolveLocale(navigator.language),
    );
    // Into the fields, not into the database: a model that mangles a term of
    // art is ordinary, and overwriting the card with its guess is not
    // recoverable. The learner reads it, fixes it, then saves.
    cardEditQuestion.value = translated.question;
    cardEditConcept.value = translated.concept;
    setCardEditStatus(t("card_translated"));
  } catch (error) {
    setCardEditStatus(translationFailureMessage(error), true);
  } finally {
    cardTranslateItem.disabled = false;
  }
});

/**
 * Say what the learner can do about it, not what the endpoint said.
 *
 * The raw failure is a line of provider JSON — the same kind of untranslated
 * internal text that made self-rating look like a crash. The two cases anyone
 * can act on are a rejected key and a rate limit; everything else is "it did
 * not work, try again", because nothing else is actionable from here.
 */
function translationFailureMessage(error: unknown): string {
  if (error instanceof NoTranslationBackendError) {
    return t("card_translate_needs_ai");
  }
  const status =
    error instanceof TranslationFailedError ? error.status : undefined;
  if (status === 401 || status === 403) return t("card_translate_bad_key");
  if (status === 429) return t("card_translate_busy");
  return tf("card_translate_failed", { error: errorMessage(error) });
}

cardEditSaveButton.addEventListener("click", async () => {
  const item = reviewSession.currentItem;
  if (!item) return;
  const question = cardEditQuestion.value.trim();
  const concept = cardEditConcept.value.trim();
  if (!concept) {
    setCardEditStatus(t("card_edit_needs_concept"), true);
    return;
  }
  cardEditSaveButton.disabled = true;
  setCardEditStatus(t("card_edit_saving"));
  try {
    await saveCardEdit(db, item.tokenId, { question, concept });
    // The queue is a snapshot from when the session started, so the running
    // session has to be told as well — otherwise the very next repaint shows
    // the old wording back again and the save looks like it failed.
    reviewSession.applyCardEdit({ question, concept });
    // Feedback and an open discussion were grounded in the old wording. Keep
    // neither attached to a card the learner has just corrected.
    clearEvaluationUi();
    renderCurrentReview(t("card_edit_saved"));
  } catch (error) {
    setCardEditStatus(errorMessage(error), true);
  } finally {
    cardEditSaveButton.disabled = false;
  }
});

cardEditCancelButton.addEventListener("click", () => {
  hideCardEditPanel();
});

disarmCardDelete = armDestructive(
  cardDeleteItem,
  t("card_delete_confirm"),
  async () => {
    closeCardMenu();
    const item = reviewSession.currentItem;
    if (!item || !currentUserId) return;
    try {
      await removeCard(db, item.tokenId, currentUserId);
      // No rating: a deleted card has no FSRS outcome to record. It leaves the
      // queue, and the session is one card shorter than it started.
      const summary = await reviewSession.dropCurrent();
      if (summary) {
        await offerAfterQueueFromReview(summary);
        await refresh(currentUserId);
      } else {
        renderCurrentReview(t("card_deleted"));
      }
    } catch (error) {
      setReviewStatus(errorMessage(error), true);
    }
  },
);

function renderSessionSummary(result: MobileReviewSummary): void {
  pendingSessionSummary = null;
  clearEvaluationUi();
  hideReviewOffer();
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
    hideQueueOffer();
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
    await renderDashboardOffers(userId);
    return;
  }
  hideQueueOffer();
  renderQueue(queue);
  await updateReminderDue(queue.reviewCount + queue.relearnCount);
}

async function restoreReviewSession(userId: string): Promise<void> {
  const restored = await reviewSession.restore(userId);
  if (restored.kind === "active") {
    await loadPreconditionCache(userId);
    renderCurrentReview(t("session_resumed"));
  } else if (restored.kind === "completed") {
    await offerAfterQueueFromReview(restored.summary);
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
  const previousUserId = currentUserId;
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
    } else if (previousUserId) {
      // No previous pairing, but a learner *was* loaded — so this session came
      // from a device-local library, and `connect` has already closed it in
      // order to open the remote. A bad token or an unreachable host then
      // leaves no database open at all: every screen renders "database is not
      // open" and only a force-quit recovers. Put the local library back.
      try {
        await invoke("db_close");
        await invoke("db_open", {});
        const setup = await prepareLocalLibrary(db);
        if (setup) await openLocalLibrary(setup);
      } catch {
        // Nothing further to try; the message below is still shown.
      }
    }
    showPairing(Boolean(previousPairing) || Boolean(previousUserId));
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
    openCard = null;
    showLibraryMode("browse");
    void refreshLibrary();
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
    void refreshAiSection();
    void refreshStudyLearningSettings();
    void refreshStudyWorkload();
    void refreshLocalAi();
  }
});

studyWorkloadPreset.addEventListener("change", () => {
  const preset = studyWorkloadPreset.value as StudyWorkloadPreset;
  if (preset === "custom") return;
  renderStudyWorkload(STUDY_WORKLOAD_PRESETS[preset]);
});
for (const input of [
  studyMaxNew,
  studyMaxReviews,
  studyBuryNew,
  studyBuryReview,
]) {
  input.addEventListener("change", () => {
    studyWorkloadPreset.value = "custom";
  });
}
localAiPrepare.addEventListener("click", () => void prepareLocalAi());
studyWorkloadSave.addEventListener("click", () => void saveStudyWorkload());
studyUnbury.addEventListener("click", () => {
  void (async () => {
    if (!currentUserId) return;
    try {
      const count = await unburySiblingCards(db, currentUserId);
      studyWorkloadStatus.textContent = tf("study_workload_unburied", {
        count,
      });
      await refresh(currentUserId);
    } catch (error) {
      studyWorkloadStatus.textContent = tf("study_workload_failed", {
        error: errorMessage(error),
      });
    }
  })();
});

openImportButton.addEventListener("click", () => {
  showImport();
  resetImport();
  showLibraryMode("add");
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
    const result = await confirmMobileImport(db, currentUserId, draft);

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
    // New cards are searchable by text immediately and by meaning shortly
    // after; nothing waits on the round trip.
    void runEmbeddingPass(false);
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
      await offerAfterQueueFromReview(result.summary);
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
    bonusIgnoredThisSession = false;
    await loadPreconditionCache(currentUserId);
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

discussionInput.addEventListener("input", () => {
  if (voiceController.active) void pauseVoiceMode();
  discussionSendButton.disabled =
    discussion.busy || !discussionInput.value.trim();
  setDiscussionStatus("");
});

discussionInput.addEventListener("keydown", (event) => {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.isComposing ||
    discussionSendButton.disabled
  ) {
    return;
  }
  event.preventDefault();
  void sendDiscussionTurn();
});

discussionSendButton.addEventListener("click", () => {
  void sendDiscussionTurn();
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
  const isFlash = currentLearningSettings.learningMode === "flash";
  try {
    if (!isFlash) {
      reviewSession.updateDraftAnswer(reviewAnswer.value);
    }
    reviewSession.reveal({ allowEmpty: isFlash });
    clearEvaluationUi();
    if (reviewSession.currentItem?.fastCheck || isFlash) {
      renderCurrentReview();
      return;
    }
    renderCurrentReview(t("evaluating_answer"));
    revealAnswerButton.disabled = true;
    await runSmartEvaluation();
  } catch {
    setReviewStatus(t("answer_required"), true);
    if (!isFlash) reviewAnswer.focus();
  } finally {
    revealAnswerButton.disabled = false;
  }
});

reviewCard.addEventListener("click", (event) => {
  if (
    currentLearningSettings.learningMode !== "flash" ||
    reviewSession.revealed
  ) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (
    target.closest(
      "button, a, input, textarea, #card-manage-menu, #card-edit-panel",
    )
  ) {
    return;
  }
  revealAnswerButton.click();
});

reviewModeFlash.addEventListener("click", () => {
  void switchReviewMode("flash");
});

reviewModeFeedback.addEventListener("click", () => {
  void switchReviewMode("answer_feedback");
});

studyLearningSave.addEventListener("click", () => {
  void saveStudyLearningSettings();
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
    if (!reviewSession.active) {
      if (pendingSessionSummary) {
        renderSessionSummary(pendingSessionSummary);
      } else {
        showDashboard();
      }
      return;
    }
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
  void refreshStudyLearningSettings();
  nav.showTab("learn");
}

// ── Library ────────────────────────────────────────────────────────────────

/** The card whose detail view is open, or null while browsing. */
let openCard: LibraryEntry | null = null;
/** Debounce handle for the search field. */
let librarySearchTimer: number | undefined;
/** Total cards, so the result count can say "8 of 240". */
let libraryTotal = 0;

interface CurriculumTrailEntry {
  step: MobileCurriculumStep;
  option: MobileCurriculumOption;
}

let curriculumState: MobileCurriculumState = initialMobileCurriculumState();
let curriculumTrail: CurriculumTrailEntry[] = [];
let curriculumView: MobileCurriculumView | null =
  nextMobileCurriculumView(curriculumState);
let curriculumRenderRevision = 0;

type LibraryMode = "browse" | "detail" | "add" | "curriculum";

function showLibraryMode(mode: LibraryMode): void {
  libraryBrowse.hidden = mode !== "browse";
  libraryDetail.hidden = mode !== "detail";
  libraryCurriculum.hidden = mode !== "curriculum";
  importDescText.hidden = mode !== "add";
  importEntry.hidden = mode !== "add";
  if (mode !== "add") importDraftForm.hidden = true;
  // An armed delete belongs to the card that armed it; leaving the detail
  // view must not leave it primed for whichever card is opened next.
  disarmLibraryDelete?.();
}

function setCurriculumStatus(text: string, isError = false): void {
  curriculumStatus.textContent = text;
  curriculumStatus.classList.toggle("error", isError);
}

function rebuildCurriculumSelection(): void {
  curriculumState = initialMobileCurriculumState();
  let after: MobileCurriculumStep | undefined;
  for (const entry of curriculumTrail) {
    curriculumState = applyMobileCurriculumChoice(
      curriculumState,
      entry.step,
      entry.option,
    );
    after = entry.step;
  }
  curriculumView = nextMobileCurriculumView(curriculumState, after);
}

function renderCurriculumBreadcrumb(): void {
  curriculumBreadcrumb.replaceChildren();
  curriculumTrail.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip curriculum-crumb";
    button.textContent = entry.option.label;
    button.addEventListener("click", () => {
      curriculumTrail = curriculumTrail.slice(0, index);
      rebuildCurriculumSelection();
      void renderCurriculumView();
    });
    curriculumBreadcrumb.appendChild(button);
  });
  curriculumBreadcrumb.hidden = curriculumTrail.length === 0;
}

function curriculumRow(
  titleText: string,
  detailText: string | undefined,
): { button: HTMLButtonElement; text: HTMLElement } {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "row";

  const text = document.createElement("span");
  text.className = "row-text";
  const title = document.createElement("span");
  title.textContent = titleText;
  text.appendChild(title);
  if (detailText) {
    const detail = document.createElement("span");
    detail.className = "t-footnote";
    detail.textContent = detailText;
    text.appendChild(detail);
  }

  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("class", "row-chevron");
  chevron.setAttribute("viewBox", "0 0 8 14");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M1 1l6 6-6 6");
  chevron.appendChild(path);
  button.append(text, chevron);
  return { button, text };
}

async function enrolCurriculumCell(
  cell: BundledCellStatus,
  action: HTMLButtonElement,
): Promise<void> {
  if (!currentUserId || cell.enrolled) return;
  action.disabled = true;
  setCurriculumStatus("…");
  try {
    const result = await enrolBundledCell(db, currentUserId, cell.id);
    setCurriculumStatus(
      tf("learning_path_enrolled", {
        title: cell.title,
        n: result.cardsCreated,
      }),
    );
    await Promise.all([refreshBundledCells(), refresh(currentUserId)]);
    await renderCurriculumView();
  } catch (error) {
    setCurriculumStatus(
      tf("library_failed", { error: errorMessage(error) }),
      true,
    );
    action.disabled = false;
  }
}

function renderCurriculumCells(cells: BundledCellStatus[]): void {
  const heading = document.createElement("p");
  heading.className = "group-title";
  heading.textContent = t("curriculum_cells_first_title");
  const body = document.createElement("p");
  body.className = "t-secondary";
  body.textContent = t("curriculum_cells_first_body");
  curriculumOptions.append(heading, body);

  for (const cell of cells) {
    const card = document.createElement("section");
    card.className = "curriculum-cell-offer stack";
    const title = document.createElement("h3");
    title.className = "t-headline";
    title.textContent = cell.title;
    const meta = document.createElement("p");
    meta.className = "t-footnote";
    meta.textContent = `${cell.gradeLabel} · ${tf("learning_path_atoms", {
      n: cell.inScopeAtomIds.length,
    })}`;
    const description = document.createElement("p");
    description.className = "t-secondary";
    description.textContent = cell.description;
    const action = document.createElement("button");
    action.type = "button";
    action.className = cell.enrolled ? "btn" : "btn primary";
    action.disabled = cell.enrolled;
    action.textContent = cell.enrolled
      ? t("learning_path_active")
      : t("learning_path_enrol");
    action.addEventListener("click", () => {
      void enrolCurriculumCell(cell, action);
    });
    card.append(title, meta, description, action);
    curriculumOptions.appendChild(card);
  }
}

async function previewCurriculumTopic(
  topic: TopicNode,
  button: HTMLButtonElement,
): Promise<void> {
  if (!currentUserId || !curriculumState.providerId) return;
  button.disabled = true;
  curriculumModelSettings.hidden = true;
  setCurriculumStatus(t("curriculum_generating"));
  try {
    const subject = curriculumTrail.find((entry) => entry.step === "subject")
      ?.option.label;
    const grade = curriculumTrail.find((entry) => entry.step === "grade")
      ?.option.label;
    const drafts = await previewMobileCurriculumTopic(db, {
      providerId: curriculumState.providerId,
      topic,
      category: [subject, grade].filter(Boolean).join(" · "),
      locale: learnerLocale || getLocale(),
      ports: {
        fetchSource: (url) =>
          invoke<string>("curriculum_source_request", {
            url,
            timeoutMs: 20_000,
          }),
        generateText: (endpoint, prompt) =>
          generateViaHttp(
            endpoint,
            prompt,
            async (url, init) => {
              const response = await invoke<string>("vision_request", {
                url,
                headers: Object.fromEntries(
                  new Headers(init.headers).entries(),
                ),
                body: String(init.body ?? ""),
                timeoutMs: 180_000,
              });
              return extractChatCompletionsContent(response);
            },
            12_000,
          ),
      },
    });
    resetImport();
    startMultiDraftImport(drafts, t("curriculum_preview_ready"));
  } catch (error) {
    const noModel = error instanceof NoMobileCurriculumModelError;
    curriculumModelSettings.hidden = !noModel;
    setCurriculumStatus(
      noModel
        ? t("curriculum_no_model")
        : tf("curriculum_failed", { error: errorMessage(error) }),
      true,
    );
    button.disabled = false;
  }
}

async function renderCurriculumPosition(revision: number): Promise<void> {
  if (!currentUserId) return;
  setCurriculumStatus(t("curriculum_loading"));
  try {
    const position = await resolveMobileCurriculumPosition(
      db,
      currentUserId,
      curriculumState,
    );
    if (revision !== curriculumRenderRevision) return;
    curriculumOptions.replaceChildren();
    setCurriculumStatus("");

    if (!position.needsGenericImport) {
      renderCurriculumCells(position.cells);
      return;
    }

    const heading = document.createElement("p");
    heading.className = "group-title";
    heading.textContent = t("curriculum_fallback_title");
    const body = document.createElement("p");
    body.className = "t-secondary";
    body.textContent = t("curriculum_fallback_body");
    curriculumOptions.append(heading, body);

    const list = document.createElement("div");
    list.className = "list";
    let available = 0;
    for (const topic of position.topics) {
      const detail = [
        topic.description,
        topic.hours
          ? tf("curriculum_hours", { hours: topic.hours })
          : undefined,
        topic.contentStatus === "verified"
          ? undefined
          : t("curriculum_topic_unavailable"),
      ]
        .filter(Boolean)
        .join(" · ");
      const { button } = curriculumRow(topic.label, detail || undefined);
      const verified = topic.contentStatus === "verified";
      button.disabled = !verified;
      if (verified) {
        available += 1;
        button.addEventListener("click", () => {
          void previewCurriculumTopic(topic, button);
        });
      }
      list.appendChild(button);
    }
    curriculumOptions.appendChild(list);
    if (available === 0) setCurriculumStatus(t("curriculum_no_topics"));
  } catch (error) {
    if (revision !== curriculumRenderRevision) return;
    curriculumOptions.replaceChildren();
    setCurriculumStatus(
      tf("curriculum_failed", { error: errorMessage(error) }),
      true,
    );
  }
}

async function renderCurriculumView(): Promise<void> {
  const revision = ++curriculumRenderRevision;
  const screen = libraryCurriculum.closest<HTMLElement>(".screen");
  if (screen) screen.scrollTop = 0;
  renderCurriculumBreadcrumb();
  curriculumOptions.replaceChildren();
  curriculumModelSettings.hidden = true;
  setCurriculumStatus("");

  if (!curriculumView) {
    curriculumStepTitle.textContent = t("curriculum_choose");
    curriculumStepHint.textContent = t("curriculum_no_topics");
    return;
  }
  curriculumStepTitle.textContent = t(`curriculum_step_${curriculumView.step}`);
  curriculumStepHint.textContent = t("curriculum_step_hint");

  if (curriculumView.step === "topic") {
    await renderCurriculumPosition(revision);
    return;
  }

  const list = document.createElement("div");
  list.className = "list";
  for (const option of curriculumView.options) {
    const { button } = curriculumRow(option.label, option.description);
    button.addEventListener("click", () => {
      if (!curriculumView) return;
      const step = curriculumView.step;
      curriculumState = applyMobileCurriculumChoice(
        curriculumState,
        step,
        option,
      );
      curriculumTrail.push({ step, option });
      curriculumView = nextMobileCurriculumView(curriculumState, step);
      void renderCurriculumView();
    });
    list.appendChild(button);
  }
  curriculumOptions.appendChild(list);
}

function openMobileCurriculum(): void {
  curriculumState = initialMobileCurriculumState();
  curriculumTrail = [];
  curriculumView = nextMobileCurriculumView(curriculumState);
  showImport();
  showLibraryMode("curriculum");
  void renderCurriculumView();
}

function renderLibrary(entries: LibraryEntry[]): void {
  libraryList.replaceChildren();
  for (const entry of entries) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "row";

    const text = document.createElement("span");
    text.className = "row-text";
    const title = document.createElement("span");
    title.textContent = entry.title || entry.slug;
    const meta = document.createElement("span");
    meta.className = "t-footnote";
    meta.textContent = entry.paused
      ? t("library_paused_note")
      : entry.domain || t("no_domain");
    text.append(title, meta);

    const chevron = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    chevron.setAttribute("class", "row-chevron");
    chevron.setAttribute("viewBox", "0 0 8 14");
    chevron.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M1 1l6 6-6 6");
    chevron.append(path);

    button.append(text, chevron);
    button.addEventListener("click", () => openLibraryDetail(entry));
    item.append(button);
    libraryList.append(item);
  }

  libraryList.hidden = entries.length === 0;
  libraryEmpty.hidden = entries.length > 0;
  libraryEmpty.textContent =
    libraryTotal === 0 ? t("library_none_yet") : t("library_no_hits");
  libraryCount.textContent =
    entries.length > 0
      ? tf("library_count", { n: entries.length, total: libraryTotal })
      : "";
}

function renderBundledCells(cells: BundledCellStatus[]): void {
  bundledCellsList.replaceChildren();
  const activeCells = cells.filter((cell) => cell.enrolled);
  bundledCellsStatus.classList.remove("error");
  bundledCellsStatus.textContent =
    activeCells.length === 0 ? t("learning_paths_none_active") : "";
  for (const cell of activeCells) {
    const card = document.createElement("div");
    card.className = "card stack";

    const title = document.createElement("p");
    title.className = "t-headline";
    title.textContent = cell.title;

    const grade = document.createElement("p");
    grade.className = "t-footnote";
    grade.textContent = `${cell.gradeLabel} · ${tf("learning_path_atoms", {
      n: cell.inScopeAtomIds.length,
    })}`;

    const description = document.createElement("p");
    description.className = "t-secondary";
    description.textContent = cell.description;

    // Active paths only; activating one happens in the curriculum chooser,
    // which is the surface that knows which cells cover a learner position.
    const action = document.createElement("button");
    action.type = "button";
    action.className = "btn";
    action.disabled = true;
    action.textContent = t("learning_path_active");

    card.append(title, grade, description, action);
    bundledCellsList.appendChild(card);
  }
}

async function refreshBundledCells(): Promise<void> {
  if (!currentUserId) return;
  try {
    renderBundledCells(await getBundledCellsWithStatus(db, currentUserId));
  } catch (error) {
    bundledCellsList.replaceChildren();
    bundledCellsStatus.textContent = tf("library_failed", {
      error: errorMessage(error),
    });
    bundledCellsStatus.classList.add("error");
  }
}

async function refreshLibrary(): Promise<void> {
  if (!currentUserId) return;
  await refreshBundledCells();
  const query = librarySearch.value.trim();
  try {
    libraryTotal = (await listLibrary(db, currentUserId)).length;
    const entries = query
      ? await searchLibrary(db, currentUserId, query)
      : await listLibrary(db, currentUserId);
    renderLibrary(entries);
  } catch (error) {
    libraryList.replaceChildren();
    libraryEmpty.hidden = false;
    libraryEmpty.textContent = tf("library_failed", {
      error: errorMessage(error),
    });
  }
}

function openLibraryDetail(entry: LibraryEntry): void {
  openCard = entry;
  detailTitle.value = entry.title || "";
  detailQuestion.value = entry.question ?? "";
  detailConcept.value = entry.concept;
  detailDomain.value = entry.domain;
  detailPauseButton.textContent = entry.paused
    ? t("library_resume")
    : t("library_pause");
  detailStatus.textContent = "";
  detailStatus.classList.remove("error");
  showLibraryMode("detail");
}

function setDetailStatus(text: string, isError = false): void {
  detailStatus.textContent = text;
  detailStatus.classList.toggle("error", isError);
}

librarySearch.addEventListener("input", () => {
  // Debounced because a keystroke can cost an embedding request.
  window.clearTimeout(librarySearchTimer);
  librarySearchTimer = window.setTimeout(() => void refreshLibrary(), 250);
});

openCurriculumButton.addEventListener("click", openMobileCurriculum);

curriculumBackButton.addEventListener("click", () => {
  if (curriculumTrail.length === 0) {
    showLibraryMode("browse");
    void refreshLibrary();
    return;
  }
  curriculumTrail.pop();
  rebuildCurriculumSelection();
  void renderCurriculumView();
});

curriculumModelSettings.addEventListener("click", showSettings);

libraryAddButton.addEventListener("click", () => {
  resetImport();
  showLibraryMode("add");
  importInput.focus();
});

libraryBackButton.addEventListener("click", () => {
  openCard = null;
  showLibraryMode("browse");
  void refreshLibrary();
});

detailSaveButton.addEventListener("click", async () => {
  if (!openCard) return;
  detailSaveButton.disabled = true;
  try {
    await saveCardEdit(db, openCard.tokenId, {
      title: detailTitle.value.trim(),
      question: detailQuestion.value.trim() || null,
      concept: detailConcept.value.trim(),
      domain: detailDomain.value.trim(),
    });
    setDetailStatus(t("library_saved"));
    // The wording changed, so the stored vector no longer describes it.
    void runEmbeddingPass(false);
    if (currentUserId) await refresh(currentUserId);
  } catch (error) {
    setDetailStatus(tf("library_failed", { error: errorMessage(error) }), true);
  } finally {
    detailSaveButton.disabled = false;
  }
});

detailPauseButton.addEventListener("click", async () => {
  if (!openCard || !currentUserId) return;
  detailPauseButton.disabled = true;
  try {
    if (openCard.paused) {
      await resumeCard(db, openCard.tokenId, currentUserId);
    } else {
      await pauseCard(db, openCard.tokenId, currentUserId);
    }
    openCard = { ...openCard, paused: !openCard.paused };
    detailPauseButton.textContent = openCard.paused
      ? t("library_resume")
      : t("library_pause");
    await refresh(currentUserId);
    setDetailStatus("");
  } catch (error) {
    setDetailStatus(tf("library_failed", { error: errorMessage(error) }), true);
  } finally {
    detailPauseButton.disabled = false;
  }
});

// Deleting takes the review history with it, so it is worth one question —
// asked by arming the button, because `window.confirm` never appears here.
disarmLibraryDelete = armDestructive(
  detailDeleteButton,
  t("library_delete_confirm"),
  async () => {
    if (!openCard || !currentUserId) return;
    try {
      await removeCard(db, openCard.tokenId, currentUserId);
      openCard = null;
      showLibraryMode("browse");
      await refreshLibrary();
      await refresh(currentUserId);
      setStatus(t("library_deleted"));
    } catch (error) {
      setDetailStatus(
        tf("library_failed", { error: errorMessage(error) }),
        true,
      );
    }
  },
);

function setAiStatus(text: string, isError = false): void {
  aiStatus.textContent = text;
  aiStatus.classList.toggle("error", isError);
}

/* ── Managing cloud endpoints by hand ────────────────────────────────────── */

/** The endpoint currently open in the form; null while adding a new one. */
let editingEndpointId: string | null = null;

function setEndpointsStatus(text: string, isError = false): void {
  endpointsStatus.textContent = text;
  endpointsStatus.classList.toggle("error", isError);
}

function endpointErrorMessage(code: EndpointError): string {
  return t(`endpoint_err_${code}`);
}

/** Which capabilities a row claims, as a short human line. */
function capabilitySummary(row: ManagedEndpoint): string {
  const claimed = ENDPOINT_CAPABILITIES.filter(
    (cap) => row.capabilities?.[cap],
  ).map((cap) => t(`cap_${cap}_short`));
  return claimed.length > 0 ? claimed.join(" · ") : t("endpoint_no_capability");
}

async function refreshEndpoints(): Promise<void> {
  const rows = await listEndpoints(db);
  endpointsList.replaceChildren();
  endpointsEmpty.hidden = rows.length > 0;

  rows.forEach((row, index) => {
    const item = document.createElement("li");
    item.className = "row";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "row-text endpoint-open";
    const title = document.createElement("span");
    title.className = "t-body";
    title.textContent = `${row.label} · ${row.model}`;
    const detail = document.createElement("span");
    detail.className = "t-footnote";
    detail.textContent = capabilitySummary(row);
    open.append(title, detail);
    open.addEventListener("click", () => {
      openEndpointForm(row);
    });

    // Up and down rather than drag: a drag on a list row fights the scroll
    // gesture, and the list is short enough that two taps win.
    const up = document.createElement("button");
    up.type = "button";
    up.className = "btn icon";
    up.textContent = "↑";
    up.disabled = index === 0;
    up.setAttribute("aria-label", t("endpoint_move_up"));
    up.addEventListener("click", async () => {
      await moveEndpoint(db, row.id, "up");
      await refreshEndpoints();
    });

    const down = document.createElement("button");
    down.type = "button";
    down.className = "btn icon";
    down.textContent = "↓";
    down.disabled = index === rows.length - 1;
    down.setAttribute("aria-label", t("endpoint_move_down"));
    down.addEventListener("click", async () => {
      await moveEndpoint(db, row.id, "down");
      await refreshEndpoints();
    });

    item.append(open, up, down);
    endpointsList.append(item);
  });
}

function openEndpointForm(row?: ManagedEndpoint): void {
  editingEndpointId = row?.id ?? null;
  endpointLabelInput.value = row?.label ?? "";
  endpointUrlInput.value = row?.url ?? "";
  endpointModelInput.value = row?.model ?? "";
  // Never echo a stored key back into the field; leaving it blank keeps the
  // one already saved, the same bargain the OpenRouter card makes.
  endpointKeyInput.value = "";
  endpointKeyInput.placeholder = row?.apiKey ? "••••••••" : "";
  for (const cap of ENDPOINT_CAPABILITIES) {
    capabilityInputs[cap].checked = row
      ? Boolean(row.capabilities?.[cap])
      : cap === "text";
  }
  endpointDeleteButton.classList.toggle("hidden", !row);
  endpointForm.classList.remove("hidden");
  endpointAddButton.classList.add("hidden");
  setEndpointsStatus("");
  endpointLabelInput.focus();
}

function closeEndpointForm(): void {
  editingEndpointId = null;
  endpointForm.classList.add("hidden");
  endpointAddButton.classList.remove("hidden");
  disarmEndpointDelete?.();
}

function readCapabilityDraft(): Record<string, boolean> {
  const capabilities: Record<string, boolean> = {};
  for (const cap of ENDPOINT_CAPABILITIES) {
    capabilities[cap] = capabilityInputs[cap].checked;
  }
  return capabilities;
}

/** The key a save should carry: what was typed, or the one already stored. */
async function endpointKeyForSave(): Promise<string> {
  const typed = endpointKeyInput.value.trim();
  if (typed || !editingEndpointId) return typed;
  const rows = await listEndpoints(db);
  return rows.find((row) => row.id === editingEndpointId)?.apiKey ?? "";
}

endpointsToggle.addEventListener("click", async () => {
  const open = !endpointsPanel.classList.contains("hidden");
  endpointsPanel.classList.toggle("hidden", open);
  endpointsToggle.setAttribute("aria-expanded", String(!open));
  if (!open) await refreshEndpoints();
});

endpointAddButton.addEventListener("click", () => {
  openEndpointForm();
});

endpointCancelButton.addEventListener("click", () => {
  closeEndpointForm();
});

endpointCheckButton.addEventListener("click", async () => {
  endpointCheckButton.disabled = true;
  setEndpointsStatus(t("endpoint_checking"));
  try {
    const result = await checkEndpoint({
      url: endpointUrlInput.value,
      apiKey: await endpointKeyForSave(),
    });
    if (result.ok) {
      setEndpointsStatus(t("endpoint_check_ok"));
    } else if (result.status === 401 || result.status === 403) {
      setEndpointsStatus(t("endpoint_check_rejected"), true);
    } else if (result.status) {
      setEndpointsStatus(
        tf("endpoint_check_status", { status: result.status }),
        true,
      );
    } else {
      setEndpointsStatus(t("endpoint_check_unreachable"), true);
    }
  } finally {
    endpointCheckButton.disabled = false;
  }
});

endpointSaveButton.addEventListener("click", async () => {
  endpointSaveButton.disabled = true;
  try {
    const result = await saveEndpoint(db, {
      ...(editingEndpointId ? { id: editingEndpointId } : {}),
      label: endpointLabelInput.value,
      url: endpointUrlInput.value,
      model: endpointModelInput.value,
      apiKey: await endpointKeyForSave(),
      capabilities: readCapabilityDraft(),
    });
    if (!result.ok) {
      setEndpointsStatus(
        endpointErrorMessage(result.error ?? "empty_url"),
        true,
      );
      return;
    }
    closeEndpointForm();
    await refreshEndpoints();
    await refreshAiSection();
    await refreshCloudEndpointsFromDb();
    setEndpointsStatus(t("endpoint_saved"));
  } catch (error) {
    setEndpointsStatus(errorMessage(error), true);
  } finally {
    endpointSaveButton.disabled = false;
  }
});

disarmEndpointDelete = armDestructive(
  endpointDeleteButton,
  t("endpoint_delete_confirm"),
  async () => {
    if (!editingEndpointId) return;
    await removeEndpoint(db, editingEndpointId);
    closeEndpointForm();
    await refreshEndpoints();
    await refreshAiSection();
    await refreshCloudEndpointsFromDb();
    setEndpointsStatus(t("endpoint_removed"));
  },
);

/**
 * Paint the AI section from what is actually registered in the database.
 *
 * A stored key is not a question worth asking again. While one is present the
 * field is removed rather than blanked: an empty password box sitting under
 * the word "Connected" reads as *your key is missing*, and the only thing a
 * connected learner normally wants here is a different model. `ai-change-key`
 * brings the field back for the one case that needs it.
 */
async function refreshAiSection(): Promise<void> {
  let label: string | null = null;
  let model: string | null = null;
  try {
    // Prefer the live chain model so the select matches what evaluation uses.
    const chain = await resolveMobileCloudChain(db, "text");
    model = chain?.model ?? null;
    label = await connectedCloudLabel(db);
  } catch {
    label = null;
  }
  aiConnected = Boolean(label);
  ensureAiModelOptions(model);
  aiState.textContent = label ? tf("ai_connected", { label }) : t("ai_none");
  aiDisconnectButton.hidden = !label;
  aiKeyInput.value = "";
  aiKeyInput.placeholder = "sk-or-…";
  showAiKeyField(!label);
  aiChangeKeyButton.classList.toggle("hidden", !label);
  // The paragraph explains what a key buys. Once there is one, it is answered
  // copy taking up the space the model row wants.
  aiDesc.classList.toggle("hidden", Boolean(label));
  aiGetKeyButton.classList.toggle("hidden", Boolean(label));
  // Connected: the button mostly switches models (key optional). First time:
  // it must paste a key.
  aiConnectButton.textContent = label ? t("ai_apply") : t("ai_connect");
}

/** Show or hide the key field; hiding it also clears whatever was typed. */
function showAiKeyField(visible: boolean): void {
  aiKeyField.classList.toggle("hidden", !visible);
  if (!visible) aiKeyInput.value = "";
}

/**
 * Embed whatever is outstanding, without ever getting in the way.
 *
 * Search works without this — full text always does — so a failure here is a
 * line in Settings, never a dialog and never a blocked import.
 */
async function runEmbeddingPass(report: boolean): Promise<void> {
  if (report) setAiStatus(t("ai_embed_running"));
  try {
    const result = await embedInBackground(db);
    if (!report) return;
    if (result.error) {
      setAiStatus(tf("ai_embed_failed", { error: result.error }), true);
    } else if (result.embedded > 0) {
      setAiStatus(tf("ai_embed_done", { n: result.embedded }));
    } else {
      setAiStatus("");
    }
  } catch (error) {
    if (report) {
      setAiStatus(tf("ai_embed_failed", { error: errorMessage(error) }), true);
    }
  }
}

/** Translate a connect failure into something the learner can act on. */
function aiErrorMessage(code: string): string {
  if (code === "empty") return t("ai_err_empty");
  if (code === "empty_model") return t("ai_err_empty_model");
  if (code === "rejected") return t("ai_err_rejected");
  if (code === "unreachable") return t("ai_err_unreachable");
  return tf("ai_err_other", { code });
}

aiConnectButton.addEventListener("click", async () => {
  aiConnectButton.disabled = true;
  const model = selectedModelId();
  const wasConnected = aiConnected;
  setAiStatus(t("ai_checking"));
  try {
    // Empty key is fine when already connected: connectCloudModel reuses the
    // stored key so switching models is one tap, not a re-paste.
    const result = await connectCloudModel(db, aiKeyInput.value, { model });
    if (!result.ok) {
      setAiStatus(aiErrorMessage(result.error ?? "rejected"), true);
      return;
    }
    await refreshAiSection();
    await refreshCloudEndpointsFromDb();
    if (wasConnected) {
      setAiStatus(tf("ai_model_updated", { model }));
    } else {
      setAiStatus(
        tf("ai_connected_msg", { min: OPENROUTER_PROVIDER.minTopUpUsd }),
      );
      if (currentLearningSettings.learningMode === "flash" && currentUserId) {
        currentLearningSettings.learningMode = "answer_feedback";
        void setStudyLearningSettings(db, currentUserId, {
          learningMode: "answer_feedback",
        }).catch(() => undefined);
        renderStudyLearningSettings(currentLearningSettings);
      }
      // Cards that existed before the key did are the ones a learner will
      // search for first, so start on them straight away.
      void runEmbeddingPass(true);
    }
  } catch (error) {
    setAiStatus(errorMessage(error), true);
  } finally {
    aiConnectButton.disabled = false;
  }
});

aiDisconnectButton.addEventListener("click", async () => {
  await disconnectCloudModel(db);
  await refreshAiSection();
  await refreshCloudEndpointsFromDb();
  setAiStatus("");
});

aiChangeKeyButton.addEventListener("click", () => {
  showAiKeyField(true);
  aiChangeKeyButton.classList.add("hidden");
  // The way back out is the "Get a key" link, which only makes sense again
  // once someone is actually looking for a key.
  aiGetKeyButton.classList.remove("hidden");
  aiKeyInput.focus();
  setAiStatus(t("ai_change_key_hint"));
});

aiGetKeyButton.addEventListener("click", () => {
  // ZAM never creates the account or the key — it only points at the page.
  window.open(OPENROUTER_PROVIDER.keysUrl, "_blank");
});

// ── Multi-device upgrade ───────────────────────────────────────────────────

function setUpgradeStatus(text: string, isError = false): void {
  upgradeStatus.textContent = text;
  upgradeStatus.classList.toggle("error", isError);
}

/**
 * Move this device's library onto a server database.
 *
 * The Rust shell owns exactly one connection, so switching means closing the
 * local one and opening the remote — and on any failure, opening the local
 * one again. `upgradeToServerDatabase` owns that ordering; this function only
 * supplies the two open calls and translates the outcome.
 */
async function runUpgrade(replaceRemote: boolean): Promise<void> {
  if (currentPairing) {
    setUpgradeStatus(t("upgrade_already"), true);
    return;
  }
  const url = upgradeUrl.value.trim();
  const token = upgradeToken.value.trim();
  if (!url || !token) {
    setUpgradeStatus(t("ai_err_empty"), true);
    return;
  }

  upgradeStartButton.disabled = true;
  upgradeReplaceButton.disabled = true;
  try {
    const result = await upgradeToServerDatabase(
      {
        local: db,
        async openRemote(remoteUrl, authToken) {
          await invoke("db_close");
          await invoke("db_open", { syncUrl: remoteUrl, authToken });
          return db;
        },
        async reopenLocal() {
          await invoke("db_close");
          await invoke("db_open", {});
          return db;
        },
      },
      {
        url,
        authToken: token,
        replaceRemote,
        // `upgrade_done` is a `tf` template with an {n}; the count only exists
        // after the call returns, so the final message is set below.
        onProgress: ({ stage }) => {
          if (stage !== "done") setUpgradeStatus(t(`upgrade_${stage}`));
        },
      },
    );

    if (!result.ok) {
      if (result.error === REMOTE_NOT_EMPTY) {
        setUpgradeStatus(t("upgrade_not_empty"), true);
        upgradeReplaceButton.hidden = false;
      } else {
        setUpgradeStatus(
          tf("upgrade_failed", { error: result.error ?? "" }),
          true,
        );
      }
      return;
    }

    // Store the pairing only now: it is what makes the switch survive a
    // restart, and storing it before the transfer worked would strand the
    // learner on an empty server database.
    const userId = result.userId ?? currentUserId ?? "me";
    const payload: ZamPairPayloadV1 = {
      type: ZAM_PAIR_TYPE,
      version: ZAM_PAIR_VERSION,
      createdAt: new Date().toISOString(),
      database: { url, token },
      learner: { userId },
      settings: { locale: learnerLocale ?? navigator.language },
    };

    let pairingStored = true;
    try {
      await invoke("pairing_save", {
        payload: serializeZamPairPayload(payload),
      });
    } catch {
      // The transfer already succeeded and this session is on the server
      // database, so reporting "the move failed" would be the opposite of the
      // truth. What is missing is only the *persistence* of the switch — and
      // the keychain is known to refuse on unsigned builds (OSStatus -34018),
      // so say precisely that instead.
      pairingStored = false;
    }

    // Without these the session still believes it is device-local: the
    // "already on a server database" guard stays dead, and a second run would
    // snapshot the remote into itself.
    currentPairing = payload;
    currentUserId = userId;
    upgradeReplaceButton.hidden = true;
    upgradeUrl.value = "";
    upgradeToken.value = "";
    setUpgradeStatus(
      pairingStored
        ? tf("upgrade_done", { n: result.transferred ?? 0 })
        : tf("upgrade_done_unsaved", { n: result.transferred ?? 0 }),
      !pairingStored,
    );
    resyncButton.hidden = false;
    learner.hidden = false;
    learner.textContent = userId;
    connection.textContent = t("synced");
    await refresh(userId);
    void refreshStorageRow();
  } catch (error) {
    setUpgradeStatus(
      tf("upgrade_failed", { error: errorMessage(error) }),
      true,
    );
  } finally {
    upgradeStartButton.disabled = false;
    upgradeReplaceButton.disabled = false;
  }
}

upgradeStartButton.addEventListener("click", () => void runUpgrade(false));
upgradeReplaceButton.addEventListener("click", () => void runUpgrade(true));

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

  // No pairing: Android and iOS both start from the device-local library. QR
  // pairing is a voluntary takeover, never a prerequisite (ADRs 2026-08-08
  // and 2026-08-09).
  try {
    const launch = await prepareStandaloneLaunch(db, () =>
      invoke("db_open", {}),
    );
    if (launch.kind === "library") {
      await openLocalLibrary(launch.setup);
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
