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
  confirmMobileImport,
  type MobileTokenDraft,
  parseMobileImport,
} from "./import.js";
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
const prepareImportButton = element<HTMLButtonElement>("prepare-import");
const cancelImportButton = element<HTMLButtonElement>("cancel-import");
const importStatus = element<HTMLParagraphElement>("import-status");
const importDraftForm = element<HTMLFormElement>("import-draft-form");
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

let currentPairing: ZamPairPayloadV1 | null = null;
let reminderConfig: ReminderConfig = parseReminderConfig(
  localStorage.getItem(REMINDER_STORAGE_KEY),
);
let currentImportDraft: MobileTokenDraft | null = null;
let takingSharedImport = false;
const PENDING_IMPORT_STORAGE_KEY = "zam.mobile-pending-import.v1";

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

const voicePort: VoicePort = {
  async start(locale: VoiceLocale): Promise<void> {
    let permission = await invoke<VoicePermissionState>(
      "voice_check_permissions",
    );
    if (permission.microphone !== "granted") {
      permission = await invoke<VoicePermissionState>(
        "voice_request_permissions",
      );
    }
    if (permission.microphone !== "granted") {
      throw new Error(
        "Mikrofonzugriff wurde nicht erlaubt. Berechtigung in den App-Einstellungen freigeben.",
      );
    }
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
    renderCurrentReview("Antwort erkannt. Erwartete Antwort wird vorgelesen.");
  },
  rate: (rating) => rateCurrentReview(rating),
  setStatus: (message, isError) => setReviewStatus(message, isError),
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  setPairingStatus(
    canCancel
      ? "Neue Kopplung scannen oder die bestehende Ansicht beibehalten."
      : "QR-Code aus ZAM Desktop scannen.",
  );
}

function showApp(payload: ZamPairPayloadV1): void {
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
  setImportStatus(
    message ??
      (draft.origin === "bridge-json"
        ? "Bridge-JSON geprüft. Ziel-Lernenden und Felder vor dem Speichern kontrollieren."
        : "Schnellnotiz vorbereitet. Lerninhalt vor dem Speichern vervollständigen."),
  );
  showImport();
  importConcept.focus();
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
  if (!currentImportDraft) throw new Error("Zuerst einen Entwurf erstellen");
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
  };
}

function resetImport(): void {
  currentImportDraft = null;
  importFile.value = "";
  importInput.value = "";
  importDraftForm.reset();
  importDraftForm.hidden = true;
  setImportStatus("");
}

function queueSharedImport(payload: SharedImportPayload): void {
  localStorage.setItem(PENDING_IMPORT_STORAGE_KEY, payload.content);
  if (reviewSession.active) {
    setReviewStatus("Geteilter Lerninhalt wartet bis zum Ende der Sitzung.");
  }
}

function openPendingImport(): boolean {
  if (reviewSession.active) return false;
  const pending = localStorage.getItem(PENDING_IMPORT_STORAGE_KEY);
  if (!pending) return false;
  localStorage.removeItem(PENDING_IMPORT_STORAGE_KEY);
  prepareImportText(pending, "Geteilten Inhalt als Entwurf übernommen.");
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
        `Geteilter Inhalt konnte nicht gelesen werden: ${errorMessage(error)}`,
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
  const cards = queue.items.length === 1 ? "Karte" : "Karten";
  summary.textContent =
    `${queue.items.length} ${cards} in der Queue — ` +
    `${queue.reviewCount} fällig, ${queue.newCount} neu, ` +
    `${queue.relearnCount} erneut lernen · Domänen: ` +
    (queue.totalDomains.join(", ") || "–");
  queueList.replaceChildren();
  for (const item of queue.items) {
    const entry = document.createElement("li");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent =
      `${item.domain} · Bloom ${item.bloomLevel} · ${item.state} · ` +
      `fällig ${formatDateTime(item.dueAt)}`;
    entry.append(title, meta);
    queueList.append(entry);
  }
  startReviewButton.disabled = queue.items.length === 0;
}

function setReviewStatus(text: string, isError = false): void {
  reviewStatus.textContent = text;
  reviewStatus.classList.toggle("error", isError);
}

function updateVoiceButton(): void {
  toggleVoiceButton.textContent = voiceController.active
    ? "Sprachmodus pausieren"
    : "Sprachmodus starten";
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
      setReviewStatus(`Sprachmodus pausiert: ${message}`, true);
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
  reviewProgress.textContent = `Karte ${progress.current} von ${progress.total}`;
  reviewMeta.textContent = `${item.title} · ${item.domain || "Ohne Domäne"} · Bloom ${item.bloomLevel}`;
  reviewQuestion.textContent = prompt.question;
  reviewAnswer.value = reviewSession.draftAnswer;
  reviewAnswer.disabled = reviewSession.revealed;
  revealAnswerButton.hidden = reviewSession.revealed;
  revealedAnswer.hidden = !reviewSession.revealed;
  expectedAnswer.textContent = prompt.concept;
  const sourceUrl = externalSourceUrl(prompt.sourceLink);
  reviewSource.hidden = !sourceUrl;
  if (sourceUrl) reviewSource.href = sourceUrl;
  for (const button of ratingButtons) {
    button.disabled = !reviewSession.revealed;
  }
  updateVoiceButton();
  setReviewStatus(message);
  if (!reviewSession.revealed && !voiceController.active) reviewAnswer.focus();
}

function renderSessionSummary(result: MobileReviewSummary): void {
  const completion = result.stopped ? "Sitzung beendet" : "Sitzung geschafft";
  const cards = result.totalCount === 1 ? "Karte" : "Karten";
  const nextDue = result.nextDueAt
    ? formatDateTime(result.nextDueAt)
    : "keine weitere Karte geplant";
  sessionSummaryText.textContent =
    `${completion}: ${result.completedCount} von ${result.totalCount} ${cards}, ` +
    `${result.againCount}× „Nochmal“. Nächste Fälligkeit: ${nextDue}.`;
  showSessionSummary();
}

async function refresh(userId: string): Promise<void> {
  const user = (await db
    .prepare("SELECT COUNT(*) AS card_count FROM cards WHERE user_id = ?")
    .get(userId)) as { card_count: number } | undefined;
  const cardCount = Number(user?.card_count ?? 0);
  if (cardCount === 0) {
    setStatus(
      `Gekoppelt mit ${userId} — noch keine Karten für diesen Lernenden.`,
    );
    summary.textContent = "";
    queueList.replaceChildren();
    startReviewButton.disabled = true;
    await updateReminderDue(0);
    return;
  }
  const queue = await buildReviewQueue(db, { userId });
  setStatus(
    `Queue für ${userId} (${cardCount} ${cardCount === 1 ? "Karte" : "Karten"}).`,
  );
  renderQueue(queue);
  await updateReminderDue(queue.reviewCount + queue.relearnCount);
}

async function restoreReviewSession(userId: string): Promise<void> {
  const restored = await reviewSession.restore(userId);
  if (restored.kind === "active") {
    renderCurrentReview("Unterbrochene Sitzung fortgesetzt.");
  } else if (restored.kind === "completed") {
    renderSessionSummary(restored.summary);
  } else {
    showDashboard();
  }
}

/** Sync the paired replica with bounded retry, reporting each retry attempt. */
async function synchronize(report?: (message: string) => void): Promise<void> {
  await syncWithRetry(
    async () => {
      await db.sync?.();
    },
    {
      onRetry: ({ attempt, error }) =>
        report?.(
          `Synchronisierung wiederholt (Versuch ${attempt}): ${error.message}`,
        ),
    },
  );
}

/** Route an expired/rotated token to re-pairing without discarding the session. */
function promptRepair(reason: string): void {
  connection.textContent = "Offline";
  connection.classList.add("offline");
  showPairing(Boolean(currentPairing));
  setPairingStatus(reason, true);
}

async function connect(
  payload: ZamPairPayloadV1,
  requireInitialSync: boolean,
): Promise<void> {
  setStatus("Öffne lokale Server-Replik…");
  await invoke("db_close");
  await invoke("db_open", {
    syncUrl: payload.database.url,
    authToken: payload.database.token,
  });

  let syncError: SyncError | undefined;
  try {
    setStatus("Synchronisiere…");
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
  connection.textContent = syncError ? "Offline" : "Synchronisiert";
  connection.classList.toggle("offline", Boolean(syncError));
  if (syncError?.kind === "auth") {
    promptRepair(
      `Zugangsdaten abgelaufen — bitte neu koppeln (${syncError.message}).`,
    );
  } else if (syncError) {
    setStatus(
      `Offline geöffnet. Synchronisierung fehlgeschlagen — später erneut synchronisieren: ${syncError.message}`,
      true,
    );
  }
}

async function applyPairing(input: string | unknown): Promise<void> {
  const payload = parseZamPairPayload(input);
  const previousPairing = currentPairing;
  setPairingStatus("Kopplung wird geprüft und initial synchronisiert…");
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
    setPairingStatus(`Kopplung fehlgeschlagen: ${errorMessage(error)}`, true);
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
      setPairingStatus(
        "Kamerazugriff wurde nicht erlaubt. Berechtigung in den App-Einstellungen freigeben.",
        true,
      );
      return;
    }
    setPairingStatus("Kamera geöffnet — QR-Code vollständig ins Bild halten.");
    const result = await scan({
      cameraDirection: "back",
      formats: [Format.QRCode],
    });
    await applyPairing(result.content);
  } catch (error) {
    setPairingStatus(`Scan fehlgeschlagen: ${errorMessage(error)}`, true);
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
  try {
    const content = await file.text();
    prepareImportText(content, `Datei „${file.name}“ als Entwurf geladen.`);
  } catch (error) {
    setImportStatus(
      `Datei konnte nicht gelesen werden: ${errorMessage(error)}`,
      true,
    );
  }
});

prepareImportButton.addEventListener("click", () => {
  prepareImportText(importInput.value);
});

cancelImportButton.addEventListener("click", () => {
  resetImport();
  showDashboard();
});

importDraftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentPairing) return;
  confirmImportButton.disabled = true;
  try {
    const result = await confirmMobileImport(
      db,
      currentPairing.learner.userId,
      draftFromForm(),
    );
    resetImport();
    await refresh(currentPairing.learner.userId);
    showDashboard();
    setStatus(
      `„${result.token.title || result.token.slug}“ gespeichert und der Queue hinzugefügt.`,
    );
  } catch (error) {
    setImportStatus(`Import fehlgeschlagen: ${errorMessage(error)}`, true);
  } finally {
    confirmImportButton.disabled = false;
  }
});

async function rateCurrentReview(rating: 1 | 2 | 3 | 4): Promise<boolean> {
  for (const candidate of ratingButtons) candidate.disabled = true;
  stopReviewButton.disabled = true;
  try {
    const result = await reviewSession.rate(rating);
    if (result.summary) {
      renderSessionSummary(result.summary);
      return false;
    }
    const blocking = result.blockedPrerequisites.length
      ? ` Voraussetzungen eingeplant: ${result.blockedPrerequisites.join(", ")}.`
      : "";
    renderCurrentReview(
      `Gespeichert · nächste Fälligkeit ${formatDateTime(result.nextDueAt)}.${blocking}`,
    );
    return true;
  } catch (error) {
    renderCurrentReview(`Bewertung fehlgeschlagen: ${errorMessage(error)}`);
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
      setStatus("Aktuell sind keine Karten zur Wiederholung fällig.");
      await refresh(currentPairing.learner.userId);
      return;
    }
    renderCurrentReview();
  } catch (error) {
    setStatus(
      `Sitzung konnte nicht gestartet werden: ${errorMessage(error)}`,
      true,
    );
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
      setReviewStatus("Sprachmodus pausiert. Tippen bleibt verfügbar.");
    } else {
      startVoiceMode();
    }
  } catch (error) {
    setReviewStatus(
      `Sprachmodus konnte nicht pausiert werden: ${errorMessage(error)}`,
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
    setReviewStatus(
      "Android-Sprachdaten geöffnet. Deutsch oder Englisch lokal herunterladen und danach den Sprachmodus erneut starten.",
    );
  } catch (error) {
    setReviewStatus(
      `Sprachdaten konnten nicht geöffnet werden: ${errorMessage(error)}`,
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
    renderCurrentReview("Antwort vergleichen und ehrlich bewerten.");
  } catch {
    setReviewStatus("Bitte zuerst eine eigene Antwort eingeben.", true);
    reviewAnswer.focus();
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
      `Sitzung konnte nicht beendet werden: ${errorMessage(error)}`,
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
    setStatus(
      `Queue konnte nicht geladen werden: ${errorMessage(error)}`,
      true,
    );
  } finally {
    backToQueueButton.disabled = false;
  }
});

resyncButton.addEventListener("click", async () => {
  if (!currentPairing) return;
  resyncButton.disabled = true;
  try {
    setStatus("Synchronisiere…");
    await synchronize((message) => setStatus(message, true));
    await refresh(currentPairing.learner.userId);
    connection.textContent = "Synchronisiert";
    connection.classList.remove("offline");
  } catch (error) {
    if (error instanceof SyncError && error.kind === "auth") {
      promptRepair(
        `Zugangsdaten abgelaufen — bitte neu koppeln (${error.message}).`,
      );
    } else {
      connection.textContent = "Offline";
      connection.classList.add("offline");
      setStatus(`Sync fehlgeschlagen: ${errorMessage(error)}`, true);
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
      `Gespeicherte Kopplung konnte nicht geöffnet werden: ${errorMessage(error)}`,
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
      setReminderStatus("Erinnerung aus.");
    } else if (denied) {
      setReminderStatus(
        "Benachrichtigungen sind nicht erlaubt — in den Android-Einstellungen freigeben.",
        true,
      );
    } else {
      setReminderStatus(
        `Erinnerung aktiv — täglich um ${formatTimeInput(reminderConfig)} Uhr.`,
      );
    }
  } catch (error) {
    setReminderStatus(
      `Erinnerung konnte nicht gesetzt werden: ${errorMessage(error)}`,
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
    setReminderStatus("Ungültige Uhrzeit.", true);
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

renderReminderControls();
if (reminderConfig.enabled) {
  // Re-arm the schedule from stored config on launch without a permission prompt.
  void applyReminder(false);
}

void start();
