/**
 * ZAM spoiler-free Recall card — MCP Apps panel entry.
 *
 * The user answers due review questions inside this card. Two MUTUALLY
 * EXCLUSIVE paths — only one of them may ever result in a zam_submit_review
 * call for a given card, never both:
 *  - "Antwort prüfen": inserts the answer as a user message (app.sendMessage)
 *    so the harness model evaluates it and books the FSRS rating via
 *    zam_submit_review — ZAM keeps zero model config of its own. The card
 *    then reveals the concept read-only (no rating row, no auto-advance
 *    timer); a "Nächste Karte" button is the only way to move on.
 *  - "Aufdecken": reveals the stored concept and lets the user self-rate via
 *    the four rating buttons (callServerTool zam_submit_review directly).
 *
 * Spoiler discipline: the stored `concept` lives only in a JS closure and is
 * written into the DOM for the first time on reveal — never before.
 *
 * Standalone by design (tests/desktop/module-boundaries.test.ts): no Tauri,
 * no Three.js, no import from ./panel.ts. The result-parsing helper below is
 * copied from panel.ts's mcpTransport rather than shared, to keep each panel
 * entry independently bundleable.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { setCurrentLocale, t } from "../i18n.js";

const statusEl = document.getElementById("zam-status");
const statusDot = document.getElementById("zam-status-dot");
const versionEl = document.getElementById("zam-version");
const contentEl = document.getElementById("recall-content");

function setStatus(text: string, connected: boolean): void {
  if (statusEl) statusEl.textContent = text;
  if (statusDot) statusDot.classList.toggle("connected", connected);
}

interface OpenRecallResult {
  recall?: string;
  version?: string;
  user?: string | null;
}

interface ReviewCard {
  cardId: string;
  tokenId: string;
  slug: string;
  concept: string;
  domain: string | null;
  bloomLevel: number;
  state: string;
  dueAt: string;
  bloomVerb?: string;
  question?: string;
  sourceLink?: string | null;
}

interface SubmitEvaluation {
  nextDueAt: string;
  stability: number;
  difficulty: number;
  state: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

interface BlockedInfo {
  blockedSlug: string;
  prerequisites: Array<{ slug: string; concept: string; bloomLevel: number }>;
}

interface SubmitResult {
  success: boolean;
  rating: number;
  evaluation: SubmitEvaluation;
  blocked: BlockedInfo | null;
}

type CardState = "shown" | "revealed" | "answered" | "rated";

const app = new App({ name: "ZAM Recall", version: "0.1.0" });

let currentUser: string | null = null;
let connected = false;
let started = false;
let cards: ReviewCard[] = [];
let index = 0;

/**
 * Parse a zam MCP tool result: success answers carry JSON on content[0].text
 * (never structuredContent — wrapHandler re-wraps arrays as `{ result }`); on
 * isError, surface the JSON `error` field. Copied from panel.ts.
 */
async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const result = await app.callServerTool({ name, arguments: args });
  const first = result.content?.[0];
  const text = first && first.type === "text" ? first.text : undefined;

  if (result.isError) {
    let message = text ?? `${name} call failed`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (typeof parsed.error === "string") message = parsed.error;
      } catch {
        // Not JSON — keep the raw text assigned above.
      }
    }
    throw new Error(message);
  }

  return text === undefined ? undefined : JSON.parse(text);
}

function remaining(): number {
  return Math.max(0, cards.length - index - 1);
}

/** Sync a compact card-state snapshot into the host's model context. */
function pushContext(card: ReviewCard, state: CardState): void {
  void app
    .updateModelContext({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            zamRecall: {
              cardId: card.cardId,
              slug: card.slug,
              state,
              remaining: remaining(),
            },
          }),
        },
      ],
    })
    .catch(() => {
      // Context sync is best-effort; a rejection must not break the card.
    });
}

function formatDue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function clearContent(): void {
  contentEl?.replaceChildren();
}

function renderMessage(emoji: string, title: string, sub: string): void {
  if (!contentEl) return;
  clearContent();
  const box = document.createElement("div");
  box.className = "zam-card recall-empty";
  const emojiEl = document.createElement("div");
  emojiEl.className = "recall-empty-emoji";
  emojiEl.textContent = emoji;
  const titleEl = document.createElement("div");
  titleEl.className = "recall-empty-title";
  titleEl.textContent = title;
  const subEl = document.createElement("div");
  subEl.className = "recall-empty-sub";
  subEl.textContent = sub;
  box.append(emojiEl, titleEl, subEl);
  contentEl.appendChild(box);
}

function renderEmpty(): void {
  renderMessage("🎉", "Nichts fällig", t("lbl_caught_up"));
}

function renderDone(): void {
  renderMessage("✅", "Alle Karten bearbeitet", t("lbl_caught_up"));
}

function renderError(message: string): void {
  renderMessage("⚠️", "Karten konnten nicht geladen werden", message);
}

function advance(): void {
  index += 1;
  if (index >= cards.length) {
    renderDone();
  } else {
    renderCard();
  }
}

function renderCard(): void {
  if (!contentEl) return;
  const card = cards[index];
  // Spoiler discipline: `concept` stays in this closure and only reaches the
  // DOM inside showReveal(); it is never rendered before the user reveals.
  const concept = card.concept;
  clearContent();

  // Once the user commits to a path (check/reveal), lock the inputs so the
  // same card cannot be double-sent. The two paths are mutually exclusive:
  // "Antwort prüfen" never shows a rating row (the harness model books the
  // rating after sendMessage) and "Aufdecken" never triggers a model
  // booking — so at most one zam_submit_review call ever happens per card.
  let committed = false;
  let rated = false;

  const root = document.createElement("div");
  root.className = "zam-card";

  const counter = document.createElement("div");
  counter.className = "recall-counter";
  counter.textContent = `${index + 1} / ${cards.length}`;
  root.appendChild(counter);

  const badges = document.createElement("div");
  badges.className = "recall-badges";
  if (card.domain) {
    const domainBadge = document.createElement("span");
    domainBadge.className = "recall-badge";
    domainBadge.textContent = card.domain;
    badges.appendChild(domainBadge);
  }
  const bloomBadge = document.createElement("span");
  bloomBadge.className = "recall-badge";
  bloomBadge.textContent = card.bloomVerb
    ? `Bloom ${card.bloomLevel} · ${card.bloomVerb}`
    : `Bloom ${card.bloomLevel}`;
  badges.appendChild(bloomBadge);
  root.appendChild(badges);

  const question = document.createElement("div");
  question.className = "recall-question";
  question.textContent = card.question?.trim() ? card.question : card.slug;
  root.appendChild(question);

  const answer = document.createElement("textarea");
  answer.className = "recall-answer";
  answer.placeholder = "Antwort aus dem Gedächtnis…";
  root.appendChild(answer);

  const actions = document.createElement("div");
  actions.className = "recall-actions";
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn primary-btn";
  checkBtn.type = "button";
  checkBtn.textContent = "Antwort prüfen";
  checkBtn.disabled = true;
  const revealBtn = document.createElement("button");
  revealBtn.className = "btn secondary-btn";
  revealBtn.type = "button";
  revealBtn.textContent = "Aufdecken";
  actions.append(checkBtn, revealBtn);
  root.appendChild(actions);

  answer.addEventListener("input", () => {
    checkBtn.disabled = answer.value.trim().length === 0;
  });

  function lockInputs(): void {
    committed = true;
    checkBtn.disabled = true;
    revealBtn.disabled = true;
    answer.disabled = true;
  }

  function showNotice(message: string): void {
    let notice = root.querySelector<HTMLDivElement>(".recall-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "recall-notice";
      root.appendChild(notice);
    }
    notice.textContent = message;
  }

  function showResult(res: SubmitResult): void {
    const result = document.createElement("div");
    result.className = "recall-result";
    const due = formatDue(res.evaluation.nextDueAt);
    result.textContent = `→ wieder fällig ${due}`;
    root.appendChild(result);
    if (res.blocked) {
      showNotice(`Blockiert: ${res.blocked.blockedSlug}`);
    }
  }

  async function submitRating(rating: 1 | 2 | 3 | 4): Promise<void> {
    if (rated) return;
    rated = true;
    const ratingButtons =
      root.querySelectorAll<HTMLButtonElement>(".recall-rating-btn");
    ratingButtons.forEach((b) => {
      b.disabled = true;
    });
    try {
      const args: Record<string, unknown> = {
        cardId: card.cardId,
        rating,
        doneBy: "user",
      };
      if (currentUser) args.user = currentUser;
      const res = (await callTool("zam_submit_review", args)) as SubmitResult;
      pushContext(card, "rated");
      showResult(res);
      // Let the user read the next-due line before moving on.
      window.setTimeout(advance, 1400);
    } catch (error) {
      rated = false; // allow a retry
      ratingButtons.forEach((b) => {
        b.disabled = false;
      });
      showNotice(
        `Bewertung fehlgeschlagen: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function showReveal(): void {
    const reveal = document.createElement("div");
    reveal.className = "recall-reveal";

    const title = document.createElement("div");
    title.className = "recall-reveal-title";
    title.textContent = t("lbl_reveal_title");
    reveal.appendChild(title);

    const conceptEl = document.createElement("div");
    conceptEl.className = "recall-concept";
    conceptEl.textContent = concept; // first and only time concept hits the DOM
    reveal.appendChild(conceptEl);

    const ratingLabel = document.createElement("div");
    ratingLabel.className = "recall-rating-label";
    ratingLabel.textContent = t("lbl_rating_instruction");
    reveal.appendChild(ratingLabel);

    const ratings = document.createElement("div");
    ratings.className = "recall-ratings";
    const labels = [
      t("lbl_rate_1"),
      t("lbl_rate_2"),
      t("lbl_rate_3"),
      t("lbl_rate_4"),
    ];
    for (let r = 1; r <= 4; r += 1) {
      const rating = r as 1 | 2 | 3 | 4;
      const ratingBtn = document.createElement("button");
      ratingBtn.className = "btn secondary-btn recall-rating-btn";
      ratingBtn.type = "button";
      const label = document.createElement("span");
      label.textContent = labels[r - 1];
      const num = document.createElement("span");
      num.className = "rating-num";
      num.textContent = String(r);
      ratingBtn.append(label, num);
      ratingBtn.addEventListener("click", () => {
        void submitRating(rating);
      });
      ratings.appendChild(ratingBtn);
    }
    reveal.appendChild(ratings);
    root.appendChild(reveal);
  }

  // Answer path only ("Antwort prüfen"): the harness model evaluates the
  // free-text answer and books the FSRS rating itself (see the
  // zam_open_recall tool description), so this card must stay read-only
  // here — no rating row, no self-rating, no auto-advance timer. A single
  // "Nächste Karte" button is the only way to move on, and it never calls
  // zam_submit_review.
  function showAnsweredReveal(): void {
    const reveal = document.createElement("div");
    reveal.className = "recall-reveal";

    const title = document.createElement("div");
    title.className = "recall-reveal-title";
    title.textContent = t("lbl_reveal_title");
    reveal.appendChild(title);

    const conceptEl = document.createElement("div");
    conceptEl.className = "recall-concept";
    conceptEl.textContent = concept; // first and only time concept hits the DOM
    reveal.appendChild(conceptEl);

    const note = document.createElement("div");
    note.className = "recall-hint";
    note.textContent = "Bewertung übernimmt der Assistent.";
    reveal.appendChild(note);

    const nextActions = document.createElement("div");
    nextActions.className = "recall-actions";
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn primary-btn";
    nextBtn.type = "button";
    nextBtn.textContent = "Nächste Karte";
    nextBtn.addEventListener("click", () => {
      nextBtn.disabled = true; // advance() re-renders synchronously
      advance();
    });
    nextActions.appendChild(nextBtn);
    reveal.appendChild(nextActions);
    root.appendChild(reveal);
  }

  checkBtn.addEventListener("click", () => {
    if (committed) return;
    const text = answer.value.trim();
    if (!text) return;
    lockInputs();
    // Insert the answer as a user message in the exact format the
    // zam_open_recall tool description instructs the model to match. The
    // model books the rating via zam_submit_review on its own turn, so this
    // card renders read-only below and must not also submit a rating.
    void app
      .sendMessage({
        role: "user",
        content: [
          {
            type: "text",
            text: `ZAM-Antwort zu Karte "${card.slug}" (cardId ${card.cardId}): ${text}`,
          },
        ],
      })
      .catch((error: unknown) => {
        showNotice(
          `Konnte Antwort nicht senden: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    showAnsweredReveal();
    pushContext(card, "answered");
  });

  revealBtn.addEventListener("click", () => {
    if (committed) return;
    lockInputs();
    showReveal(); // no model booking on this path — self-rating required
    pushContext(card, "revealed");
  });

  contentEl.appendChild(root);
  pushContext(card, "shown");
}

async function loadReviews(): Promise<void> {
  try {
    const args: Record<string, unknown> = { includeQuestions: true };
    if (currentUser) args.user = currentUser;
    const data = (await callTool("zam_get_reviews", args)) as {
      cards?: ReviewCard[];
    };
    cards = data.cards ?? [];
    index = 0;
    if (cards.length === 0) {
      renderEmpty();
    } else {
      renderCard();
    }
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

function start(): void {
  if (started || !connected) return;
  started = true;
  void loadReviews();
}

app.ontoolresult = (params) => {
  const structured = (params.structuredContent ?? {}) as OpenRecallResult;
  if (versionEl && structured.version) {
    versionEl.textContent = `v${structured.version}`;
  }
  currentUser = structured.user ?? null;
  const who = currentUser ? ` — ${currentUser}` : "";
  setStatus(`Connected to zam mcp${who}`, true);
  start();
};

// A plain file viewer (e.g. an editor preview) renders this HTML without
// ever answering ui/initialize — connect() then stays pending forever.
// Degrade honestly instead of showing "Connecting to host…" for good.
const NO_HOST_NOTICE =
  "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
  "(z. B. basic-host oder Copilot-Panel).";
const noHostTimer = setTimeout(() => setStatus(NO_HOST_NOTICE, false), 4000);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    setStatus("Connected to host — waiting for session…", true);
    if (navigator.language.startsWith("de")) {
      setCurrentLocale("de");
    }
    // ontoolresult (which carries the signed-in user) normally fires right
    // after the handshake and triggers the load. If a host never delivers it,
    // still load after a short grace period using the server's default user.
    window.setTimeout(start, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    setStatus(
      `ZAM Recall failed to start: ${
        error instanceof Error ? error.message : String(error)
      }`,
      false,
    );
  });
