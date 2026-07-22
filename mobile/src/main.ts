/** Phase-1 Android companion: QR pairing, encrypted credentials, and due queue. */

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

const db = createTauriDatabase((command, args) => invoke(command, args));

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
const summary = element<HTMLElement>("summary");
const queueList = element<HTMLOListElement>("queue");
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

function formatDue(dueAt: string): string {
  const due = new Date(`${dueAt.replace(" ", "T")}Z`);
  return Number.isNaN(due.getTime()) ? dueAt : due.toLocaleString();
}

function render(queue: ReviewQueue): void {
  summary.textContent =
    `${queue.items.length} Karten in der Queue — ` +
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
      `fällig ${formatDue(item.dueAt)}`;
    entry.append(title, meta);
    queueList.append(entry);
  }
}

async function refresh(userId: string): Promise<void> {
  const user = (await db
    .prepare("SELECT COUNT(*) AS card_count FROM cards WHERE user_id = ?")
    .get(userId)) as { card_count: number } | undefined;
  const cardCount = Number(user?.card_count ?? 0);
  if (cardCount === 0) {
    setStatus(`Gekoppelt mit ${userId} — noch keine Karten für diesen Lernenden.`);
    summary.textContent = "";
    queueList.replaceChildren();
    return;
  }
  const queue = await buildReviewQueue(db, { userId });
  setStatus(`Queue für ${userId} (${cardCount} Karten).`);
  render(queue);
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
