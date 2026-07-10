/**
 * ZAM spoiler-free Recall card — MCP Apps panel entry.
 *
 * The user answers due review questions inside this card. The whole flow
 * stays IN-CARD — the card never sends chat messages (Thomas, 2026-07-10:
 * hosts may render app.sendMessage as a chat-composer draft the user must
 * send manually; the cryptic contract text pollutes the conversation and
 * every chat turn scrolls the card out of view):
 *  - A single adaptive button drives the reveal. With a typed answer it reads
 *    "Antwort prüfen" and shows the answer next to the stored concept for
 *    honest self-comparison; empty, it reads "Aufdecken" and reveals the
 *    concept directly. Both paths end in the same four-rating row.
 *  - The empty-vs-typed distinction is the "did the learner attempt?" signal
 *    a later conversational mode (ADR 2026-07-06b) will consume.
 * The four rating buttons book via callServerTool zam_submit_review; the
 * `rated` guard allows at most one call per card.
 *
 * A "Sitzung beenden" control ends the loop early and shows a local summary
 * (count + rating spread). The card owns no ZAM session, so finishing has no
 * server side effect. An optional domain focus (from zam_open_recall) scopes
 * the queue and is shown as a badge.
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
import { setCurrentLocale, t, tf } from "../i18n.js";

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
  domain?: string | null;
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
let focusDomain: string | null = null;
let connected = false;
let started = false;
let finished = false;
let cards: ReviewCard[] = [];
let index = 0;

// Session-local tally for the finish/done summary. Never persisted; the card
// owns no ZAM session, so this is pure UI state.
const tally = {
  done: 0,
  ratings: { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
};

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
  renderMessage("🎉", t("lbl_recall_empty_title"), t("lbl_caught_up"));
}

function renderError(message: string): void {
  renderMessage("⚠️", "Karten konnten nicht geladen werden", message);
}

/**
 * End state for both natural completion and an early "Sitzung beenden": the
 * count of what was rated this session plus the rating spread.
 */
function renderSummary(): void {
  if (!contentEl) return;
  clearContent();
  const box = document.createElement("div");
  box.className = "zam-card recall-empty";

  const emojiEl = document.createElement("div");
  emojiEl.className = "recall-empty-emoji";
  emojiEl.textContent = "✅";
  const titleEl = document.createElement("div");
  titleEl.className = "recall-empty-title";
  titleEl.textContent = t("lbl_recall_summary_title");
  const subEl = document.createElement("div");
  subEl.className = "recall-empty-sub";
  subEl.textContent = tf("lbl_recall_summary", {
    done: tally.done,
    total: cards.length,
  });
  box.append(emojiEl, titleEl, subEl);

  if (tally.done > 0) {
    const spread = document.createElement("div");
    spread.className = "recall-summary-spread";
    for (let r = 1; r <= 4; r += 1) {
      const chip = document.createElement("span");
      chip.className = "recall-summary-chip";
      chip.textContent = `${t(`lbl_rate_${r}`)}: ${tally.ratings[r]}`;
      spread.appendChild(chip);
    }
    box.appendChild(spread);
  }
  contentEl.appendChild(box);
}

function finishSession(): void {
  if (finished) return;
  finished = true;
  renderSummary();
}

function advance(): void {
  if (finished) return;
  index += 1;
  if (index >= cards.length) {
    finished = true;
    renderSummary();
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

  // Once the user commits (reveal), lock the inputs so the same card cannot be
  // double-committed. Both empty/typed paths end in the same self-rating row;
  // `rated` guards against a second zam_submit_review.
  let committed = false;
  let rated = false;

  const root = document.createElement("div");
  root.className = "zam-card";

  const topbar = document.createElement("div");
  topbar.className = "recall-topbar";
  const counter = document.createElement("div");
  counter.className = "recall-counter";
  counter.textContent = `${index + 1} / ${cards.length}`;
  const finishBtn = document.createElement("button");
  finishBtn.className = "recall-finish-btn";
  finishBtn.type = "button";
  finishBtn.textContent = t("btn_recall_finish");
  finishBtn.addEventListener("click", () => finishSession());
  topbar.append(counter, finishBtn);
  root.appendChild(topbar);

  const badges = document.createElement("div");
  badges.className = "recall-badges";
  if (focusDomain) {
    const focusBadge = document.createElement("span");
    focusBadge.className = "recall-badge recall-focus-badge";
    focusBadge.textContent = tf("lbl_recall_focus", { domain: focusDomain });
    badges.appendChild(focusBadge);
  }
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

  // One adaptive button: empty → reveal directly; text present → check the
  // typed answer against the concept. Never disabled (empty is a valid path).
  const actions = document.createElement("div");
  actions.className = "recall-actions";
  const actionBtn = document.createElement("button");
  actionBtn.className = "btn primary-btn";
  actionBtn.type = "button";
  actionBtn.textContent = t("btn_recall_reveal");
  actions.appendChild(actionBtn);
  root.appendChild(actions);

  answer.addEventListener("input", () => {
    actionBtn.textContent = answer.value.trim()
      ? t("btn_recall_check")
      : t("btn_recall_reveal");
  });

  function lockInputs(): void {
    committed = true;
    actionBtn.disabled = true;
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
      tally.done += 1;
      tally.ratings[rating] = (tally.ratings[rating] ?? 0) + 1;
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

  // With a `userAnswer` (the check path) the typed answer is shown above the
  // stored concept so the user can compare honestly before self-rating —
  // everything stays inside the card.
  function showReveal(userAnswer?: string): void {
    const reveal = document.createElement("div");
    reveal.className = "recall-reveal";

    if (userAnswer !== undefined) {
      const ownTitle = document.createElement("div");
      ownTitle.className = "recall-reveal-title";
      ownTitle.textContent = "Deine Antwort";
      reveal.appendChild(ownTitle);
      const own = document.createElement("div");
      own.className = "recall-own-answer";
      own.textContent = userAnswer;
      reveal.appendChild(own);
    }

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

  actionBtn.addEventListener("click", () => {
    if (committed) return;
    const text = answer.value.trim();
    lockInputs();
    if (text) {
      showReveal(text);
      pushContext(card, "answered");
    } else {
      showReveal();
      pushContext(card, "revealed");
    }
  });

  contentEl.appendChild(root);
  pushContext(card, "shown");
}

async function loadReviews(): Promise<void> {
  try {
    const args: Record<string, unknown> = { includeQuestions: true };
    if (currentUser) args.user = currentUser;
    if (focusDomain) args.domain = focusDomain;
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
  focusDomain = structured.domain ?? null;
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
