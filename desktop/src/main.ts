import { invoke } from "@tauri-apps/api/core";

// ── LOCALIZATION DICTIONARIES ─────────────────────────────────────────────
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    ai_status_offline: "Local AI Offline",
    ai_status_online: "Local AI Online",
    lbl_due_reviews: "Due Reviews",
    lbl_caught_up: "You're all caught up!",
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
  },
  de: {
    ai_status_offline: "Lokale KI offline",
    ai_status_online: "Lokale KI online",
    lbl_due_reviews: "Anstehende Wiederholungen",
    lbl_caught_up: "Du bist voll auf dem Laufenden!",
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

// ── VIEW ROUTING ──────────────────────────────────────────────────────────
function switchView(viewId: "dashboard-view" | "study-view") {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");
  studySessionActive = viewId === "study-view";
}

// ── DASHBOARD LOADING ─────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    // 1. Get settings and apply translations
    const settings = await runBridge<{ locale: string; llm: { enabled: boolean } }>("get-settings");
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

    // 3. Check Local LLM Status
    const llmStatus = await runBridge<{ enabled: boolean; online: boolean }>("check-llm");
    const aiStatusLabel = document.getElementById("ai-status-label")!;
    const pulseDot = document.querySelector(".pulse-dot")!;
    
    if (llmStatus.enabled && llmStatus.online) {
      aiStatusLabel.textContent = t("ai_status_online");
      pulseDot.className = "pulse-dot green";
    } else {
      aiStatusLabel.textContent = t("ai_status_offline");
      pulseDot.className = "pulse-dot gray";
    }
  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

// ── ACTIVE STUDY FLOW ─────────────────────────────────────────────────────
async function loadNextCard() {
  try {
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
    questionText.innerHTML = `<span class="loading-pulse">${currentLocale === "de" ? "Erstelle lebendige Frage..." : "Generating dynamic question..."}</span>`;

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

    // Set question text (English first)
    questionText.textContent = activePromptQuestion;

    // Handle translation if required
    const translationLoading = document.getElementById("translation-loading")!;
    translationLoading.classList.add("hidden");

    if (currentLocale !== "en" && isLlmEnabled) {
      translationLoading.classList.remove("hidden");
      try {
        const transPayload = await runBridge<{ success: boolean; translation: string }>("translate-question", [
          "--question", activePromptQuestion
        ]);
        if (transPayload.success) {
          questionText.textContent = transPayload.translation;
        }
      } catch (err) {
        console.warn("Translation failed, falling back to original English question", err);
      } finally {
        translationLoading.classList.add("hidden");
      }
    }
  } catch (err) {
    console.error("Failed to load next card:", err);
  }
}

// ── SUBMIT & REVEAL FLOW ──────────────────────────────────────────────────
async function submitAndReveal() {
  if (!activeCard) return;

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
      
      if (evalPayload.success) {
        aiFeedbackText = evalPayload.evaluation;
        evaluationSuccessful = true;
      } else {
        console.warn("LLM evaluation returned error state:", evalPayload.error);
      }
    } catch (err) {
      console.warn("LLM evaluation call failed:", err);
    } finally {
      stopAiWaitTimer();
    }
  }

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

  // 1. Concept Row
  const conceptRow = document.createElement("div");
  conceptRow.className = "reveal-item";
  conceptRow.innerHTML = `<span class="reveal-label">${t("concept")}:</span> <span class="reveal-val">${activeCard.concept}</span>`;
  revealContentList.appendChild(conceptRow);

  // 2. Token Slug Row
  const slugRow = document.createElement("div");
  slugRow.className = "reveal-item";
  slugRow.innerHTML = `<span class="reveal-label">${t("token")}:</span> <span class="reveal-val"><code>${activeCard.slug}</code></span>`;
  revealContentList.appendChild(slugRow);

  // 3. Context Row (if any)
  if (activeCard.context) {
    const contextRow = document.createElement("div");
    contextRow.className = "reveal-item";
    contextRow.innerHTML = `<span class="reveal-label">${t("context")}:</span> <span class="reveal-val">${activeCard.context}</span>`;
    revealContentList.appendChild(contextRow);
  }

  // 4. Source Reference / Code Context Row (if any)
  if (activeCard.sourceLink) {
    const srcRow = document.createElement("div");
    srcRow.className = "reveal-item";
    srcRow.innerHTML = `<span class="reveal-label">${t("source")}:</span> <span class="reveal-val"><code style="font-size:12px;color:var(--clr-accent-cyan);">${activeCard.sourceLink}</code></span>`;
    revealContentList.appendChild(srcRow);

    if (resolvedContextContent) {
      const codeBox = document.createElement("pre");
      codeBox.className = "reveal-code-box";
      codeBox.textContent = resolvedContextContent;
      revealContentList.appendChild(codeBox);
    }
  }

  // Show revealed box
  document.getElementById("revealed-box")!.classList.remove("hidden");
}

// ── INTERACTIVE TIMEOUT TIMER ────────────────────────────────────────────
function startAiWaitTimer() {
  stopAiWaitTimer();
  
  // Triggers alert after 30 seconds
  waitTimeoutId = window.setTimeout(() => {
    if (isWaitingForAi) {
      document.getElementById("wait-prompt")!.classList.remove("hidden");
    }
  }, 30000);
}

function stopAiWaitTimer() {
  if (waitTimeoutId) {
    clearTimeout(waitTimeoutId);
    waitTimeoutId = null;
  }
  isWaitingForAi = false;
  document.getElementById("npu-loading")!.classList.add("hidden");
  document.getElementById("wait-prompt")!.classList.add("hidden");
}

function skipAiWaitingAndReveal() {
  stopAiWaitTimer();
  submitAndReveal(); // triggers immediate reveal, ignoring LLM evaluation
}

// ── RATING ACTION SUBMIT ─────────────────────────────────────────────────
async function submitRating(ratingVal: number) {
  if (!activeCard) return;

  try {
    await runBridge("submit", [
      "--card-id", activeCard.cardId,
      "--rating", String(ratingVal)
    ]);
    
    // Load next card or finish
    await loadNextCard();
  } catch (err) {
    console.error("Failed to submit rating:", err);
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
