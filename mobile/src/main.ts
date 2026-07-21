/**
 * Phase-0 spike UI: open the database (local file or embedded replica of
 * the server database), then build and render the review queue with the
 * unmodified kernel scheduler running inside the WebView.
 */

import { invoke } from "@tauri-apps/api/core";
import {
  buildReviewQueue,
  type ReviewQueue,
} from "../../src/kernel/scheduler/queue.js";
import { createTauriDatabase } from "./provider.js";

const db = createTauriDatabase((command, args) => invoke(command, args));

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`missing element #${id}`);
  }
  return node as T;
}

const form = element<HTMLFormElement>("connect-form");
const urlInput = element<HTMLInputElement>("sync-url");
const tokenInput = element<HTMLInputElement>("auth-token");
const localButton = element<HTMLButtonElement>("open-local");
const resyncButton = element<HTMLButtonElement>("resync");
const statusLine = element<HTMLParagraphElement>("status");
const summary = element<HTMLElement>("summary");
const queueList = element<HTMLOListElement>("queue");

// Spike shortcut: credentials sit unencrypted in localStorage — use test
// databases only. Phase 1 replaces this with QR pairing + Keystore storage.
urlInput.value = localStorage.getItem("zam.syncUrl") ?? "";
tokenInput.value = localStorage.getItem("zam.authToken") ?? "";

let replicaMode = false;

function setStatus(text: string, isError = false): void {
  statusLine.textContent = text;
  statusLine.classList.toggle("error", isError);
}

function formatDue(dueAt: string): string {
  const due = new Date(`${dueAt.replace(" ", "T")}Z`);
  if (Number.isNaN(due.getTime())) {
    return dueAt;
  }
  return due.toLocaleString();
}

function render(queue: ReviewQueue): void {
  summary.textContent =
    `${queue.items.length} Karten in der Queue — ` +
    `${queue.reviewCount} fällig, ${queue.newCount} neu, ` +
    `${queue.relearnCount} relearning · Domänen: ` +
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

async function refresh(): Promise<void> {
  // Spike shortcut: sessions belong to the most active user in the synced
  // database; real user resolution arrives with pairing in Phase 1.
  const user = (await db
    .prepare(
      `SELECT user_id, COUNT(*) AS card_count FROM cards
       GROUP BY user_id ORDER BY card_count DESC LIMIT 1`,
    )
    .get()) as { user_id: string; card_count: number } | undefined;
  if (!user) {
    setStatus("Datenbank geöffnet — sie enthält noch keine Karten.");
    summary.textContent = "";
    queueList.replaceChildren();
    return;
  }
  const queue = await buildReviewQueue(db, { userId: user.user_id });
  setStatus(`Queue für ${user.user_id} (${user.card_count} Karten).`);
  render(queue);
}

async function open(replica: boolean): Promise<void> {
  try {
    setStatus("Öffne Datenbank…");
    const syncUrl = replica ? urlInput.value.trim() : undefined;
    const authToken = replica ? tokenInput.value.trim() : undefined;
    if (replica && (!syncUrl || !authToken)) {
      setStatus("Server-URL und Auth-Token angeben.", true);
      return;
    }
    if (replica && syncUrl && authToken) {
      localStorage.setItem("zam.syncUrl", syncUrl);
      localStorage.setItem("zam.authToken", authToken);
    }
    await invoke("db_open", { syncUrl, authToken });
    replicaMode = replica;
    resyncButton.hidden = !replica;
    if (replica) {
      setStatus("Synchronisiere Replica…");
      await db.sync?.();
    }
    await refresh();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void open(true);
});

localButton.addEventListener("click", () => {
  void open(false);
});

resyncButton.addEventListener("click", async () => {
  if (!replicaMode) {
    return;
  }
  try {
    setStatus("Synchronisiere Replica…");
    await db.sync?.();
    await refresh();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
});

setStatus("Bereit — Replica verbinden oder lokal öffnen.");
