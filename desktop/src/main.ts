import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join as joinPath } from "@tauri-apps/api/path";
import * as THREE from "three";

// ── LOCALIZATION DICTIONARIES ─────────────────────────────────────────────
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    ai_status_offline: "Local AI Offline",
    ai_status_online: "Local AI Online",
    ai_status_starting: "Starting Local AI...",
    ai_status_model_missing: "Local AI: model not found",
    lbl_due_reviews: "Due Reviews",
    lbl_caught_up: "You're all caught up!",
    dashboard_error: "Could not load your data",
    lbl_domains: "Active Domains",
    btn_start_session: "Start Learning Session",
    lbl_translating: "Translating dynamically...",
    placeholder_answer: "Type your conceptual answer here... (Ctrl+Enter to submit)",
    btn_reveal_answer: "Submit & Reveal Answer",
    lbl_ai_evaluating: "Local AI is evaluating your answer...",
    lbl_ai_working: "(This may take a moment as the local AI model processes.)",
    lbl_wait_warn: "⚠ Evaluation is taking longer than expected.",
    btn_wait_keep: "Keep Waiting",
    btn_wait_skip: "Skip Offline",
    lbl_ai_feedback_title: "ZAM Feedback",
    lbl_reveal_title: "Reference Answer",
    lbl_rating_instruction: "Rate your active recall honestly:",
    lbl_rate_1: "Again",
    lbl_rate_2: "Hard",
    lbl_rate_3: "Good",
    lbl_rate_4: "Easy",
    btn_pause_session: "Pause & Exit Session",
    lbl_generating_question: "Generating dynamic question...",
    token: "Token",
    concept: "Concept",
    context: "Context",
    source: "Source Reference",
    bloom_level: "Bloom Level",
    rating_again_shortcut: "(Shortcut: 1)",
    rating_hard_shortcut: "(Shortcut: 2)",
    rating_good_shortcut: "(Shortcut: 3)",
    rating_easy_shortcut: "(Shortcut: 4)",
    session_completed: "Learning Session Completed!",
    session_completed_sub: "Great job completing this session! Your memory traces have been updated.",
    btn_back_to_dashboard: "Back to Dashboard",
    btn_open_graph: "Knowledge Map (3D)",
    observer_title: "UI Observer",
    observer_idle: "Load windows and choose one application window to observe.",
    observer_loading: "Loading observable windows...",
    observer_ready: "Selected: {title}",
    observer_analyzing: "Capturing snapshot and asking the vision model...",
    observer_done: "Observation saved. Latest report confidence: {confidence}",
    observer_canceled: "Observation canceled.",
    observer_error: "Observer error: {message}",
    observer_refresh: "Refresh Windows",
    observer_analyze: "Snapshot & Analyze",
    observer_cancel: "Cancel",
    observer_empty: "No observable windows found.",
    observer_select_placeholder: "Select a window",
    observer_history_title: "Observation Reports",
    observer_history_refresh: "Refresh Reports",
    observer_history_empty: "No observation reports yet.",
    observer_history_loaded: "Loaded {count} observation report(s).",
    observer_loop_start: "Start Loop",
    observer_loop_stop: "Stop Loop",
    observer_loop_idle: "Manual snapshots only.",
    observer_loop_running: "Observer loop running. One snapshot at a time.",
    observer_loop_waiting: "Observer loop running. Next snapshot in {seconds}s.",
    observer_loop_stopped: "Observer loop stopped.",
    graph_title: "Knowledge Graph (3D)",
    graph_hint: "Drag to rotate • Click nodes to focus • Scroll to zoom",
    graph_focus: "Focus",
    graph_prereqs: "Bases (Prerequisites)",
    graph_dependents: "Higher Abilities (Dependents)",
    graph_no_card: "no personal card yet",
  },
  de: {
    ai_status_offline: "Lokale KI offline",
    ai_status_online: "Lokale KI online",
    ai_status_starting: "Starte lokale KI...",
    ai_status_model_missing: "Lokale KI: Modell fehlt",
    lbl_due_reviews: "Anstehende Wiederholungen",
    lbl_caught_up: "Du bist voll auf dem Laufenden!",
    dashboard_error: "Deine Daten konnten nicht geladen werden",
    lbl_domains: "Aktive Wissensbereiche",
    btn_start_session: "Lernsitzung starten",
    lbl_translating: "Übersetze dynamisch...",
    placeholder_answer: "Schreibe deine konzeptionelle Antwort... (Strg+Eingabe zum Absenden)",
    btn_reveal_answer: "Antwort aufdecken & absenden",
    lbl_ai_evaluating: "Lokale KI bewertet deine Antwort...",
    lbl_ai_working: "(Das kann einen Moment dauern, während die lokale KI arbeitet.)",
    lbl_wait_warn: "⚠ Die Bewertung dauert ungewöhnlich lange...",
    btn_wait_keep: "Weiter warten",
    btn_wait_skip: "Offline fortfahren",
    lbl_ai_feedback_title: "ZAM Feedback",
    lbl_reveal_title: "Musterlösung",
    lbl_rating_instruction: "Bewerte deine aktive Erinnerung ehrlich:",
    lbl_rate_1: "Nochmal",
    lbl_rate_2: "Schwer",
    lbl_rate_3: "Gut",
    lbl_rate_4: "Einfach",
    btn_pause_session: "Pause & Sitzung beenden",
    lbl_generating_question: "Erstelle dynamische Frage...",
    token: "Token",
    concept: "Konzept",
    context: "Kontext",
    source: "Quellen-Referenz",
    bloom_level: "Bloom-Stufe",
    rating_again_shortcut: "(Shortcut: 1)",
    rating_hard_shortcut: "(Shortcut: 2)",
    rating_good_shortcut: "(Shortcut: 3)",
    rating_easy_shortcut: "(Shortcut: 4)",
    session_completed: "Lernsitzung erfolgreich abgeschlossen!",
    session_completed_sub: "Hervorragende Arbeit! Deine Gedächtnispfade wurden aktualisiert.",
    btn_back_to_dashboard: "Zurück zur Übersicht",
    btn_open_graph: "Wissensnetz (3D)",
    observer_title: "UI Observer",
    observer_idle: "Fenster laden und ein Anwendungsfenster zur Beobachtung auswählen.",
    observer_loading: "Beobachtbare Fenster werden geladen...",
    observer_ready: "Ausgewählt: {title}",
    observer_analyzing: "Erzeuge Snapshot und frage das Vision-Modell...",
    observer_done: "Beobachtung gespeichert. Confidence des letzten Reports: {confidence}",
    observer_canceled: "Beobachtung abgebrochen.",
    observer_error: "Observer-Fehler: {message}",
    observer_refresh: "Fenster aktualisieren",
    observer_analyze: "Snapshot analysieren",
    observer_cancel: "Abbrechen",
    observer_empty: "Keine beobachtbaren Fenster gefunden.",
    observer_select_placeholder: "Fenster auswählen",
    observer_history_title: "Beobachtungsberichte",
    observer_history_refresh: "Berichte aktualisieren",
    observer_history_empty: "Noch keine Beobachtungsberichte.",
    observer_history_loaded: "{count} Beobachtungsbericht(e) geladen.",
    observer_loop_start: "Loop starten",
    observer_loop_stop: "Loop stoppen",
    observer_loop_idle: "Nur manuelle Snapshots.",
    observer_loop_running: "Observer-Loop läuft. Immer nur ein Snapshot gleichzeitig.",
    observer_loop_waiting: "Observer-Loop läuft. Nächster Snapshot in {seconds}s.",
    observer_loop_stopped: "Observer-Loop gestoppt.",
    graph_title: "Wissensnetz (3D)",
    graph_hint: "Ziehen zum Drehen • Knoten klicken = Fokus • Scroll = Zoomen",
    graph_focus: "Fokus",
    graph_prereqs: "Basis (Voraussetzungen)",
    graph_dependents: "Höhere Fähigkeiten (Darauf aufbauend)",
    graph_no_card: "noch keine persönliche Karte",
  }
};

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
  }
};

// ── STATE MANAGEMENT ──────────────────────────────────────────────────────
let currentLocale = "en";
let isLlmEnabled = false;
let totalDue = 0;
let cardsReviewedThisSession = 0;

interface BridgeCard {
  cardId: string;
  tokenId: string;
  slug: string;
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
let evaluationRequestId = 0;
let revealInProgress = false;
let ratingSubmitInProgress = false;
let observerWindows: ObserverWindowInfo[] = [];
let observerReports: UiObservationReport[] = [];
let observerSequence = 0;
let observerAnalyzeInProgress = false;
let observerAnalysisRequestId = 0;
let observerLoopRunning = false;
let observerLoopTimerId: number | null = null;
const OBSERVER_LOOP_DELAY_MS = 60000;
const observerSessionId = `desktop-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;

interface ObserverWindowInfo {
  version: number;
  hwnd: number;
  processId: number;
  processName?: string;
  title: string;
  width: number;
  height: number;
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
  candidateTokens: Array<{ slug: string; confidence: number; rationale: string }>;
}

interface UiObservationsResponse {
  sessionId: string;
  after: number | null;
  count: number;
  nextSequence: number | null;
  observations: UiObservationReport[];
}

// ── BRIDGE COMMAND RUNNER ────────────────────────────────────────────────
async function runBridge<T = any>(cmd: string, args: string[] = []): Promise<T> {
  try {
    const raw = await invoke<string>("execute_zam_bridge", { cmd, args });
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Bridge Error [${cmd}]:`, err);
    throw err;
  }
}

function t(key: string): string {
  return TRANSLATIONS[currentLocale]?.[key] || TRANSLATIONS["en"]?.[key] || key;
}

function tf(key: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    t(key),
  );
}

// ── STATIC TRANSLATIONS INITIALIZER ──────────────────────────────────────
function initializeTranslations() {
  document.getElementById("lbl-due-reviews")!.textContent = t("lbl_due_reviews");
  document.getElementById("lbl-domains")!.textContent = t("lbl_domains");
  document.getElementById("btn-start-session")!.textContent = t("btn_start_session");
  document.getElementById("lbl-translating")!.textContent = t("lbl_translating");
  document.getElementById("lbl-ai-evaluating")!.textContent = t("lbl_ai_evaluating");
  document.getElementById("lbl-ai-working")!.textContent = t("lbl_ai_working");
  document.getElementById("lbl-wait-warn")!.textContent = t("lbl_wait_warn");
  document.getElementById("btn-wait-keep")!.textContent = t("btn_wait_keep");
  document.getElementById("btn-wait-skip")!.textContent = t("btn_wait_skip");
  document.getElementById("lbl-ai-feedback-title")!.textContent = t("lbl_ai_feedback_title");
  document.getElementById("lbl-reveal-title")!.textContent = t("lbl_reveal_title");
  document.getElementById("lbl-rating-instruction")!.textContent = t("lbl_rating_instruction");
  document.getElementById("btn-pause-session")!.textContent = t("btn_pause_session");
  document.getElementById("btn-reveal-answer")!.textContent = t("btn_reveal_answer");
  document.getElementById("lbl-observer-title")!.textContent = t("observer_title");
  document.getElementById("observer-status")!.textContent = t("observer_idle");
  document.getElementById("btn-observer-refresh")!.textContent = t("observer_refresh");
  document.getElementById("btn-observer-analyze")!.textContent = t("observer_analyze");
  document.getElementById("btn-observer-cancel")!.textContent = t("observer_cancel");
  document.getElementById("lbl-observer-history-title")!.textContent = t("observer_history_title");
  document.getElementById("btn-observer-reports-refresh")!.textContent = t("observer_history_refresh");
  document.getElementById("btn-observer-loop-start")!.textContent = t("observer_loop_start");
  document.getElementById("btn-observer-loop-stop")!.textContent = t("observer_loop_stop");
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
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

  // Locale badge
  document.getElementById("locale-badge")!.textContent = currentLocale.toUpperCase();
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

function updateObserverSelection(): void {
  const status = document.getElementById("observer-status")!;
  const selected = selectedObserverWindow();
  syncObserverControls();
  status.textContent = selected
    ? tf("observer_ready", { title: selected.title })
    : t("observer_idle");
}

function syncObserverControls(): void {
  const selected = selectedObserverWindow();
  const refreshButton = document.getElementById("btn-observer-refresh") as HTMLButtonElement;
  const analyzeButton = document.getElementById("btn-observer-analyze") as HTMLButtonElement;
  const cancelButton = document.getElementById("btn-observer-cancel") as HTMLButtonElement;
  const loopStartButton = document.getElementById("btn-observer-loop-start") as HTMLButtonElement;
  const loopStopButton = document.getElementById("btn-observer-loop-stop") as HTMLButtonElement;
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const locked = observerAnalyzeInProgress || observerLoopRunning;

  refreshButton.disabled = locked;
  select.disabled = locked;
  analyzeButton.disabled = locked || selected === null;
  cancelButton.classList.toggle("hidden", !observerAnalyzeInProgress);
  cancelButton.disabled = !observerAnalyzeInProgress;
  loopStartButton.disabled = locked || selected === null;
  loopStopButton.classList.toggle("hidden", !observerLoopRunning);
  loopStopButton.disabled = !observerLoopRunning;
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
  const observedFrom = new Date().toISOString();
  const requestId = observerAnalysisRequestId + 1;
  observerAnalysisRequestId = requestId;

  setObserverAnalysisBusy(true);
  status.textContent = t("observer_analyzing");
  preview.classList.add("hidden");

  try {
    const sequence = observerSequence + 1;
    const snapshotDir = await joinPath(await appDataDir(), "observer", observerSessionId);
    const snapshotPath = await joinPath(snapshotDir, `${String(sequence).padStart(6, "0")}.png`);

    await invoke<string>("snapshot_zam_observer_window", {
      hwnd: String(selected.hwnd),
      output: snapshotPath,
    });
    if (requestId !== observerAnalysisRequestId) return false;

    const observedTo = new Date().toISOString();
    const report = await runBridge<UiObservationReport>("observe-ui-snapshot", [
      "--session",
      observerSessionId,
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
      snapshotPath,
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

async function loadObserverReports(
  opts: { updateStatus?: boolean } = {},
): Promise<void> {
  const status = document.getElementById("observer-status")!;

  try {
    const response = await runBridge<UiObservationsResponse>("get-observations", [
      "--session",
      observerSessionId,
      "--after",
      "0",
      "--limit",
      "25",
    ]);
    observerReports = response.observations;
    observerSequence = Math.max(
      observerSequence,
      ...observerReports.map((report) => report.sequence),
    );
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
        .map((token) => `${token.slug} (${token.confidence.toFixed(2)})`)
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
function switchView(viewId: "dashboard-view" | "study-view" | "graph-view") {
  if (viewId === "dashboard-view" && studySessionActive) {
    evaluationRequestId++;
    if (revealInProgress) cancelActiveBridgeRequest();
    revealInProgress = false;
    finishAiWait();
  }
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");
  studySessionActive = viewId === "study-view";

  const mainContainer = document.querySelector('main.container');
  if (viewId === "graph-view") {
    mainContainer?.classList.add('graph-full');
    // lazy init three when first shown
    requestAnimationFrame(() => initOrShowGraph());
  } else {
    mainContainer?.classList.remove('graph-full');
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
let graphYaw = 0.6;
let graphPitch = 0.3;
let graphDist = 7.5;
let currentNeighborhood: any = null;
let graphUserId: string | null = null;
let currentDomain: string | null = null;
let availableDomains: string[] = [];

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
}

function updateGraphCamera() {
  if (!graphCamera) return;
  const x = graphDist * Math.sin(graphPitch) * Math.sin(graphYaw);
  const y = graphDist * Math.cos(graphPitch);
  const z = graphDist * Math.sin(graphPitch) * Math.cos(graphYaw);
  graphCamera.position.set(x, y, z);
  graphCamera.lookAt(0, 0, 0);
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

  focusSlugEl.textContent = nb.center.slug;
  focusConceptEl.textContent = nb.center.concept;
  const c = nb.center.card;
  focusMetaEl.textContent = c
    ? `Bloom ${nb.center.bloomLevel} · ${c.state} · reps=${c.reps} · stab=${c.stability.toFixed(1)} ${c.blocked ? "· BLOCKED" : ""}`
    : `Bloom ${nb.center.bloomLevel} · ${t("graph_no_card")}`;

  // helper to make clickable pill
  const makePill = (gt: any, container: HTMLElement) => {
    const pill = document.createElement("div");
    pill.className = "neighbor-pill";
    pill.textContent = gt.slug;
    pill.title = gt.concept;
    pill.onclick = () => loadGraphFocus(gt.slug);
    container.appendChild(pill);
  };

  prereqList.innerHTML = "";
  const visiblePrereqs = currentDomain
    ? nb.prerequisites.filter((p: any) => p.domain === currentDomain)
    : nb.prerequisites;
  visiblePrereqs.forEach((p: any) => makePill(p, prereqList));
  if (visiblePrereqs.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--clr-text-muted)";
    empty.textContent = "—";
    prereqList.appendChild(empty);
  }

  depList.innerHTML = "";
  const visibleDependents = currentDomain
    ? nb.dependents.filter((d: any) => d.domain === currentDomain)
    : nb.dependents;
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
    context.fillStyle = isCenter ? "#67e8f9" : "#bae6fd";
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

    const scaleFactor = isCenter ? 0.85 : 0.65;
    sprite.scale.set(
      (canvas.width / 95) * scaleFactor,
      (canvas.height / 95) * scaleFactor,
      1
    );

    // Position label above the sphere
    sprite.position.y = isCenter ? 0.95 : 0.72;
    return sprite;
  }

  const makeNode = (gt: any, isCenter: boolean) => {
    const size = 0.35 + (gt.bloomLevel || 1) * 0.12;
    const geom = new THREE.SphereGeometry(size, 24, 18);
    let color = new THREE.Color().setHSL(domainHue(gt.domain || "general"), 0.65, 0.6);

    const card = gt.card;
    if (card) {
      if (card.blocked) {
        color = new THREE.Color(0xe11d48); // red-ish for blocked
      } else {
        const mastery = Math.min(1, (card.reps || 0) / 6 + (card.stability || 0) / 30);
        color = new THREE.Color().setHSL(domainHue(gt.domain || ""), 0.7, 0.45 + mastery * 0.35);
      }
    }

    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive: isCenter ? 0x222233 : 0x111111,
      shininess: isCenter ? 30 : 12,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.slug = gt.slug;
    graphNodeMeshes.set(gt.slug, mesh);

    // Add visible label (sprite with canvas text)
    const label = createLabelSprite(gt.slug, isCenter);
    mesh.add(label);

    return mesh;
  };

  // Center
  const centerMesh = makeNode(nb.center, true);
  centerMesh.position.set(0, 0, 0);
  group.add(centerMesh);

  // Place prerequisites (lower hemisphere / ring)
  const prereqs = nb.prerequisites;
  const depnds = nb.dependents;
  const prereqRadius = 2.4;
  const depRadius = 2.1;

  prereqs.forEach((p: any, i: number) => {
    if (currentDomain && p.domain !== currentDomain) return; // stay within independent knowledge area
    const angle = (i / Math.max(1, prereqs.length)) * Math.PI * 2;
    const m = makeNode(p, false);
    const y = -1.9 - (p.bloomLevel - 1) * 0.08;
    m.position.set(
      Math.cos(angle) * prereqRadius,
      y,
      Math.sin(angle) * prereqRadius * 0.9
    );
    group.add(m);

    // edge to center
    const points = [m.position.clone(), new THREE.Vector3(0, 0.1, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x555566, transparent: true, opacity: 0.55 }));
    group.add(line);
  });

  // Dependents (upper)
  depnds.forEach((d: any, i: number) => {
    if (currentDomain && d.domain !== currentDomain) return; // stay within independent knowledge area
    const angle = (i / Math.max(1, depnds.length)) * Math.PI * 2 + 0.4;
    const m = makeNode(d, false);
    const y = 1.85 + (d.bloomLevel - 1) * 0.06;
    m.position.set(
      Math.cos(angle) * depRadius,
      y,
      Math.sin(angle) * depRadius * 0.85
    );
    group.add(m);

    const points = [new THREE.Vector3(0, 0.1, 0), m.position.clone()];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x555566, transparent: true, opacity: 0.55 }));
    group.add(line);
  });

  // lights
  const amb = new THREE.AmbientLight(0x666688, 0.6);
  graphScene.add(amb);
  const p1 = new THREE.PointLight(0xaabbff, 0.9, 50);
  p1.position.set(4, 6, 3);
  graphScene.add(p1);
}

async function loadGraphFocus(slug: string) {
  try {
    const data = await runBridge<any>("get-neighborhood", ["--focus", slug, "--user", graphUserId || ""]);
    buildGraphScene(data);
    // recenter camera nicely
    graphYaw = 0.7;
    graphPitch = 0.35;
    graphDist = 7.2;
    updateGraphCamera();
  } catch (e) {
    console.error("Failed to load neighborhood for", slug, e);
  }
}

// --- Domain filter helpers for browsing independent knowledge areas ---
async function loadAndRenderDomains() {
  try {
    const resp = await runBridge<any>("list-tokens", ["--user", graphUserId || ""]);
    const tokens = resp.tokens || [];
    const domSet = new Set<string>();
    tokens.forEach((t: any) => {
      if (t.domain) domSet.add(t.domain);
    });
    availableDomains = Array.from(domSet).sort();
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
    pill.textContent = dom;
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
  // Similar to the original bootstrap but domain-aware
  let startSlug: string | null = null;

  try {
    if (currentDomain) {
      // Load only tokens of this domain and pick a good entry point (lowest bloom = base of the area)
      const list = await runBridge<any>("list-tokens", [
        "--domain", currentDomain,
        "--user", graphUserId || ""
      ]);
      const domTokens: any[] = list.tokens || [];
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
      const args = ["--user", graphUserId || ""];
      if (currentDomain) args.push("--domain", currentDomain);
      const list = await runBridge<any>("list-tokens", args);
      const tokens: any[] = list.tokens || [];
      if (tokens.length > 0) {
        const withCard = tokens.find((t: any) => t.card);
        startSlug = (withCard || tokens[0]).slug;

        if (currentDomain) {
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
    title.textContent = "Alle Tokens in Bereich (klickbar)";
    listSection.appendChild(title);
    const listEl = document.createElement("div");
    listEl.id = "domain-full-list";
    listEl.className = "neighbor-list";
    listSection.appendChild(listEl);
    side.appendChild(listSection);
  }

  const listEl = document.getElementById("domain-full-list")!;
  listEl.innerHTML = "";

  tokens.forEach((t: any) => {
    const pill = document.createElement("div");
    pill.className = "neighbor-pill";
    pill.textContent = t.slug;
    pill.title = t.concept || "";
    pill.onclick = () => loadGraphFocus(t.slug);
    listEl.appendChild(pill);
  });
}

// ── end domain helpers ────────────────────────────────────────────────────

async function initOrShowGraph() {
  const container = document.getElementById("graph-canvas-container") as HTMLDivElement;
  const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
  if (!container || !canvas) return;

  // ensure we have a user
  if (!graphUserId) {
    try {
      const due = await runBridge<any>("check-due");
      graphUserId = due.userId || "default";
    } catch {
      graphUserId = "default";
    }
  }

  if (!graphRenderer) {
    graphRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    graphRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    graphRenderer.setSize(container.clientWidth, container.clientHeight);

    graphScene = new THREE.Scene();
    graphCamera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    updateGraphCamera();

    // initial empty scene with soft fog
    graphScene.fog = new THREE.Fog(0x07080d, 12, 28);

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
      graphYaw = 0.6; graphPitch = 0.3; graphDist = 7.5;
      updateGraphCamera();
    });
  }

  // bootstrap / reload with current domain filter (if any)
  if (!currentNeighborhood) {
    await bootstrapGraphWithDomain();
  }

  // Load domain list for the filter/selector (only once per graph session)
  if (availableDomains.length === 0) {
    loadAndRenderDomains();
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
    const settings = await runBridge<{ locale: string; llm: { enabled: boolean } }>("desktop-bootstrap");
    currentLocale = settings.locale || "en";
    isLlmEnabled = settings.llm?.enabled || false;
    
    initializeTranslations();

    // 2. Check due cards count and active domains
    const dueInfo = await runBridge<{ dueCount: number; domains: string[] }>("check-due");
    totalDue = dueInfo.dueCount;

    const dueCountEl = document.getElementById("due-count")!;
    dueCountEl.textContent = String(totalDue);

    const caughtUpEl = document.getElementById("lbl-caught-up")!;
    const startBtn = document.getElementById("btn-start-session") as HTMLButtonElement;

    if (totalDue > 0) {
      caughtUpEl.classList.add("hidden");
      startBtn.disabled = false;
    } else {
      caughtUpEl.textContent = t("lbl_caught_up");
      caughtUpEl.classList.remove("hidden");
      startBtn.disabled = true;
    }

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
    //    and reflect status. Don't block the dashboard on model load — show a
    //    "starting" state and update the badge once it resolves.
    const aiStatusLabel = document.getElementById("ai-status-label")!;
    const pulseDot = document.querySelector(".pulse-dot")!;
    aiStatusLabel.textContent = t("ai_status_starting");
    pulseDot.className = "pulse-dot amber";

    runBridge<{ usable: boolean; online: boolean; reason?: string }>("ensure-llm", [
      "--timeout",
      "45000",
    ])
      .then((llm) => {
        if (llm.usable) {
          aiStatusLabel.textContent = t("ai_status_online");
          pulseDot.className = "pulse-dot green";
        } else if (llm.reason === "model-not-found") {
          aiStatusLabel.textContent = t("ai_status_model_missing");
          pulseDot.className = "pulse-dot gray";
        } else {
          aiStatusLabel.textContent = t("ai_status_offline");
          pulseDot.className = "pulse-dot gray";
        }
      })
      .catch(() => {
        aiStatusLabel.textContent = t("ai_status_offline");
        pulseDot.className = "pulse-dot gray";
      });
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
async function loadNextCard() {
  try {
    evaluationRequestId++;
    revealInProgress = false;
    finishAiWait();

    // Reset study screen elements
    document.getElementById("revealed-box")!.classList.add("hidden");
    document.getElementById("npu-loading")!.classList.add("hidden");
    document.getElementById("wait-prompt")!.classList.add("hidden");
    document.getElementById("answer-capture-box")!.classList.remove("hidden");
    
    const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
    textarea.value = "";
    textarea.disabled = false;
    textarea.focus();

    // Set question text to a pulsing loading state so the user has immediate visual feedback
    const questionText = document.getElementById("question-text")!;
    questionText.innerHTML = "";
    const loadingText = document.createElement("span");
    loadingText.className = "loading-pulse";
    loadingText.textContent = t("lbl_generating_question");
    questionText.appendChild(loadingText);

    // Fetch review
    const payload = await runBridge<ReviewPayload>("get-review");
    if (!payload.hasReview || !payload.card || !payload.prompt) {
      showCompletionState();
      return;
    }

    activeCard = payload.card;
    activePromptQuestion = payload.prompt.question;
    resolvedContextContent = payload.resolvedContext?.content || null;

    cardsReviewedThisSession++;
    
    // Set progress string
    const totalSessionCards = totalDue + cardsReviewedThisSession - 1;
    document.getElementById("card-progress")!.textContent = `${cardsReviewedThisSession} / ${totalSessionCards}`;

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

    // Set question text
    questionText.textContent = activePromptQuestion;
  } catch (err) {
    console.error("Failed to load next card:", err);
  }
}

// ── SUBMIT & REVEAL FLOW ──────────────────────────────────────────────────
async function submitAndReveal() {
  if (!activeCard || revealInProgress) return;
  revealInProgress = true;
  const requestId = ++evaluationRequestId;

  const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
  const userAnswer = textarea.value.trim();
  
  textarea.disabled = true;
  document.getElementById("answer-capture-box")!.classList.add("hidden");

  let aiFeedbackText = "";
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
      if (activeCard.sourceLink) {
        evalArgs.push("--source-link", activeCard.sourceLink);
      }

      const evalPayload = await runBridge<{ success: boolean; evaluation: string; error?: string }>("evaluate-answer", evalArgs);

      if (requestId !== evaluationRequestId) return;
      if (evalPayload.success) {
        aiFeedbackText = evalPayload.evaluation;
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
  renderReveal(aiFeedbackText, evaluationSuccessful);
  revealInProgress = false;
}

function renderReveal(aiFeedbackText: string, evaluationSuccessful: boolean) {
  if (!activeCard) return;

  // Display feedback if evaluated
  const feedbackContainer = document.getElementById("ai-feedback-container")!;
  const feedbackTextEl = document.getElementById("ai-feedback-text")!;
  
  if (evaluationSuccessful && aiFeedbackText) {
    feedbackTextEl.textContent = aiFeedbackText;
    feedbackContainer.classList.remove("hidden");
  } else {
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

  // 2. Token Slug Row
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

  // Show revealed box
  document.getElementById("revealed-box")!.classList.remove("hidden");
}

// ── INTERACTIVE TIMEOUT TIMER ────────────────────────────────────────────
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

function cancelActiveBridgeRequest() {
  void invoke<boolean>("cancel_zam_bridge").catch((err) => {
    console.warn("Failed to cancel active bridge request:", err);
  });
}

function skipAiWaitingAndReveal() {
  if (!revealInProgress) return;
  evaluationRequestId++;
  cancelActiveBridgeRequest();
  finishAiWait();
  renderReveal("", false);
  revealInProgress = false;
}

// ── RATING ACTION SUBMIT ─────────────────────────────────────────────────
async function submitRating(ratingVal: number) {
  if (!activeCard || ratingSubmitInProgress) return;
  ratingSubmitInProgress = true;
  document.querySelectorAll<HTMLButtonElement>(".rating-btn").forEach((button) => {
    button.disabled = true;
  });

  try {
    await runBridge("submit", [
      "--card-id", activeCard.cardId,
      "--rating", String(ratingVal)
    ]);
    
    // Load next card or finish
    await loadNextCard();
  } catch (err) {
    console.error("Failed to submit rating:", err);
  } finally {
    ratingSubmitInProgress = false;
    document.querySelectorAll<HTMLButtonElement>(".rating-btn").forEach((button) => {
      button.disabled = false;
    });
  }
}

// ── SESSION COMPLETION SCREEN ────────────────────────────────────────────
function showCompletionState() {
  const studyView = document.getElementById("study-view")!;
  studyView.innerHTML = `
    <div class="study-card frosted" style="text-align: center; justify-content: center; align-items: center; gap: 20px; padding: 50px 30px;">
      <div class="large-number" style="font-size: 60px; filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.4));">✓</div>
      <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 10px;">${t("session_completed")}</h2>
      <p style="color: var(--clr-text-secondary); max-width: 500px; line-height: 1.6; margin-bottom: 25px;">${t("session_completed_sub")}</p>
      <button id="btn-back-to-dashboard" class="btn primary-btn btn-large glow-btn">${t("btn_back_to_dashboard")}</button>
    </div>
  `;

  document.getElementById("btn-back-to-dashboard")!.addEventListener("click", () => {
    window.location.reload();
  });
}

// ── KEYBOARD SHORTCUTS & EVENT BINDINGS ──────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Load initial dashboard state
  loadDashboard();

  // Start Session Button
  document.getElementById("btn-start-session")!.addEventListener("click", () => {
    switchView("study-view");
    loadNextCard();
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

  // Pause & Exit Session Button
  document.getElementById("btn-pause-session")!.addEventListener("click", () => {
    switchView("dashboard-view");
    loadDashboard();
  });

  // Submit Answer / Reveal Answer Button
  document.getElementById("btn-reveal-answer")!.addEventListener("click", () => {
    submitAndReveal();
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

  // Rating Buttons (1-4 clicks)
  document.querySelectorAll(".rating-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rating = Number(btn.getAttribute("data-rating"));
      if (rating >= 1 && rating <= 4) {
        submitRating(rating);
      }
    });
  });

  // Keyboard events
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // 1. Esc key -> Pause and exit
    if (e.key === "Escape" && studySessionActive) {
      switchView("dashboard-view");
      loadDashboard();
      return;
    }

    // 2. Textarea triggers
    const isTextAreaFocused = document.activeElement === document.getElementById("user-answer-input");
    
    if (studySessionActive && isTextAreaFocused) {
      // Ctrl+Enter or Shift+Enter inside textarea -> Reveal answer
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submitAndReveal();
      }
      return;
    }

    // 3. FSRS Ratings keys (1-4)
    if (studySessionActive && !isTextAreaFocused) {
      const revealedBox = document.getElementById("revealed-box")!;
      const isRevealed = !revealedBox.classList.contains("hidden");

      if (isRevealed) {
        if (e.key === "1") submitRating(1);
        else if (e.key === "2") submitRating(2);
        else if (e.key === "3") submitRating(3);
        else if (e.key === "4") submitRating(4);
      }
    }
  });
});
