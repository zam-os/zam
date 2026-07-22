/** Phase-2 Android companion: pairing plus offline active-recall sessions. */

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
  type ZamPairPayloadV1,
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
} from "../../src/bridge/mobile-pairing.js";
import {
  buildReviewQueue,
  type ReviewQueue,
} from "../../src/kernel/scheduler/queue.js";
import { createTauriDatabase } from "./provider.js";
import {
  type MobileReviewSummary,
  MobileReviewSession,
} from "./review-session.js";

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
const reviewView = element<HTMLElement>("review-view");
const reviewProgress = element<HTMLElement>("review-progress");
const reviewMeta = element<HTMLElement>("review-meta");
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

let currentPairing: ZamPairPayloadV1 | null = null;

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
  reviewView.hidden = true;
  sessionSummaryView.hidden = true;
  repairButton.disabled = false;
}

function showReview(): void {
  dashboardView.hidden = true;
  reviewView.hidden = false;
  sessionSummaryView.hidden = true;
  repairButton.disabled = true;
}

function showSessionSummary(): void {
  dashboardView.hidden = true;
  reviewView.hidden = true;
  sessionSummaryView.hidden = false;
  repairButton.disabled = false;
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
  setReviewStatus(message);
  if (!reviewSession.revealed) reviewAnswer.focus();
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
    return;
  }
  const queue = await buildReviewQueue(db, { userId });
  setStatus(
    `Queue für ${userId} (${cardCount} ${cardCount === 1 ? "Karte" : "Karten"}).`,
  );
  renderQueue(queue);
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

  let syncError: string | undefined;
  try {
    setStatus("Synchronisiere…");
    await db.sync?.();
  } catch (error) {
    syncError = errorMessage(error);
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
  connection.textContent = syncError ? "Offline" : "Synchronisiert";
  connection.classList.toggle("offline", Boolean(syncError));
  if (syncError) {
    setStatus(
      `Offline geöffnet. Sync fehlgeschlagen; bei abgelaufenen Zugangsdaten bitte neu koppeln: ${syncError}`,
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
  reviewSession.updateDraftAnswer(reviewAnswer.value);
  setReviewStatus("");
});

revealAnswerButton.addEventListener("click", () => {
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
    for (const candidate of ratingButtons) candidate.disabled = true;
    stopReviewButton.disabled = true;
    try {
      const result = await reviewSession.rate(rating);
      if (result.summary) {
        renderSessionSummary(result.summary);
        return;
      }
      const blocking = result.blockedPrerequisites.length
        ? ` Voraussetzungen eingeplant: ${result.blockedPrerequisites.join(", ")}.`
        : "";
      renderCurrentReview(
        `Gespeichert · nächste Fälligkeit ${formatDateTime(result.nextDueAt)}.${blocking}`,
      );
    } catch (error) {
      renderCurrentReview(`Bewertung fehlgeschlagen: ${errorMessage(error)}`);
      reviewStatus.classList.add("error");
    } finally {
      stopReviewButton.disabled = false;
    }
  });
}

stopReviewButton.addEventListener("click", async () => {
  stopReviewButton.disabled = true;
  try {
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
    await db.sync?.();
    await refresh(currentPairing.learner.userId);
    connection.textContent = "Synchronisiert";
    connection.classList.remove("offline");
  } catch (error) {
    connection.textContent = "Offline";
    connection.classList.add("offline");
    setStatus(`Sync fehlgeschlagen: ${errorMessage(error)}`, true);
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

void start();
