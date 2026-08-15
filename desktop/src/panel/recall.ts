/**
 * ZAM spoiler-free Recall card — MCP Apps panel entry.
 *
 * Smart mode is the default: a typed answer is evaluated through the host's
 * MCP Apps sampling capability and follow-up questions stay in-card. A host
 * with message support but no sampling receives the grounded answer in its
 * conversation instead. The previous reveal-and-self-rate flow remains as
 * an opt-in quick mode for speed.
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
 * no Three.js, no import from ./panel.ts. The `callTool`/context-bar plumbing
 * below is shared via ./context-bar.js (item 9, 0.11.0 review) rather than
 * hand-copied, but every panel entry still bundles independently — that
 * module has no import of its own beyond the already-shared
 * `@modelcontextprotocol/ext-apps`.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { currentLocale, setCurrentLocale, t, tf } from "../i18n.js";
import {
  type BonusOffer,
  bonusBecause,
  keepGoingCardIds,
  matchUnassessedPrecondition,
  type PreconditionOffer,
} from "../study-offers.js";
import {
  type CompanionContextBarState,
  type ContextBarHandle,
  clearConnectionNotice as clearConnectionNoticeShared,
  createCallTool,
  createContextReader,
  createContextWriter,
  deriveQuickMode,
  ensureContextBar,
  fallbackContextBarState,
  showConnectionNotice as showConnectionNoticeShared,
} from "./context-bar.js";
import { preferredRecallDisplayMode } from "./display-mode.js";
import {
  buildRecallEvaluationPrompt,
  buildRecallFollowUpPrompt,
  parseRecallEvaluation,
  type RecallEvaluation,
  type RecallEvaluationRoute,
  resolveRecallEvaluationRoute,
} from "./recall-evaluation.js";

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const contentEl = document.getElementById("recall-content");

const showConnectionNotice = (message: string): void =>
  showConnectionNoticeShared(noticeEl, message);
const clearConnectionNotice = (): void => clearConnectionNoticeShared(noticeEl);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;

interface OpenRecallResult {
  recall?: string;
  version?: string;
  user?: string | null;
  domain?: string | null;
  quickMode?: boolean;
  companionContext?: CompanionContextBarState;
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
  resolvedContext?: { content?: string } | null;
  contentChanged?: boolean;
  publishedBy?: string | null;
  publishedAt?: string | null;
  atomId?: string | null;
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

type CardState =
  | "shown"
  | "revealed"
  | "evaluating"
  | "answered"
  | "discussing"
  | "rated";

const app = new App({ name: "ZAM Recall", version: "0.1.0" });

let currentUser: string | null = null;
let focusDomain: string | null = null;
let quickMode = false;
let connected = false;
let started = false;
let finished = false;
let cards: ReviewCard[] = [];
let index = 0;
let preconditionCache: PreconditionOffer[] = [];
const assessedAtoms = new Set<string>();
let bonusIgnoredThisSession = false;
/** When the current card was shown (Date.now()); sent as responseTimeMs with the rating (ADR 2026-08-01 Decision 5). */
let cardStartedAt = 0;

// Session-local tally for the finish/done summary. Never persisted; the card
// owns no ZAM session, so this is pure UI state.
const tally = {
  done: 0,
  ratings: { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
};

const SURFACE = "recall";

/**
 * The last companion context this panel received. Kept whole (not just the
 * derived `quickMode`) so answer evaluation can honor the Agent pill's
 * selection instead of routing purely on host capabilities (issue #209).
 */
let companionContext: CompanionContextBarState | undefined;

const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);
const readCompanionContext = createContextReader(callTool, SURFACE);

/**
 * True while the currently shown card has a typed-but-unsubmitted answer —
 * the concrete "unsubmitted, local state" case the ADR calls out for the
 * context bar's discard confirmation (ADR §Decision 4).
 */
function hasUnsavedRecallState(): boolean {
  const answer = contentEl?.querySelector<HTMLTextAreaElement>(
    ".recall-answer:not(:disabled)",
  );
  return Boolean(answer?.value.trim());
}

/**
 * A user/evaluator context change is a context boundary (ADR §Decision 4):
 * reset this session's local state and reload against the new context
 * rather than continue mid-card with a stale learner, mode, or agent.
 */
function reloadForContext(newState: CompanionContextBarState): void {
  currentUser = newState.user.currentId ?? null;
  companionContext = newState;
  quickMode = deriveQuickMode(newState, quickMode);
  started = false;
  finished = false;
  cards = [];
  index = 0;
  tally.done = 0;
  tally.ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
  start();
}

function remaining(): number {
  return Math.max(0, cards.length - index - 1);
}

/** Sync a compact card-state snapshot into the host's model context. */
function pushContext(
  card: ReviewCard,
  state: CardState,
  details: Record<string, unknown> = {},
): void {
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
              ...details,
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
  void offerAfterQueue("empty");
}

function recallUserArgs(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return currentUser ? { ...extra, user: currentUser } : extra;
}

function renderChoiceOffer(
  title: string,
  body: string,
  actions: Array<{ label: string; primary?: boolean; onClick: () => void }>,
): void {
  if (!contentEl) return;
  clearContent();
  const box = document.createElement("div");
  box.className = "zam-card recall-empty";
  const titleEl = document.createElement("div");
  titleEl.className = "recall-empty-title";
  titleEl.textContent = title;
  const subEl = document.createElement("div");
  subEl.className = "recall-empty-sub";
  subEl.textContent = body;
  const row = document.createElement("div");
  row.className = "study-offer-actions";
  for (const action of actions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = action.primary ? "btn primary-btn" : "btn secondary-btn";
    btn.textContent = action.label;
    btn.addEventListener("click", action.onClick);
    row.appendChild(btn);
  }
  box.append(titleEl, subEl, row);
  contentEl.appendChild(box);
}

async function loadPreconditionCache(): Promise<void> {
  try {
    const data = (await callTool(
      "zam_preconditions_get",
      recallUserArgs(),
    )) as { candidates?: PreconditionOffer[] };
    preconditionCache = data.candidates ?? [];
  } catch {
    preconditionCache = [];
  }
}

function skipAtomInBatch(atomId: string): void {
  assessedAtoms.add(atomId);
  cards = cards.filter(
    (card, cardIndex) => cardIndex <= index || card.atomId !== atomId,
  );
}

async function decideRecallPrecondition(
  atomId: string,
  decision: "known" | "learn",
): Promise<void> {
  try {
    await callTool(
      "zam_precondition_assess",
      recallUserArgs({ atomId, decision }),
    );
  } catch (error) {
    renderError(errorMessage(error));
    return;
  }
  assessedAtoms.add(atomId);
  if (decision === "known") {
    skipAtomInBatch(atomId);
    advance();
    return;
  }
  renderCard();
}

async function offerAfterQueue(mode: "empty" | "done"): Promise<void> {
  if (finished) return;
  try {
    const pull = (await callTool(
      "zam_pull_forward_candidates",
      recallUserArgs({ limit: 5 }),
    )) as {
      candidates?: Array<{
        cardId: string;
        reason: "precondition_buried" | "future_due" | "new_in_scope";
      }>;
    };
    const cardIds = keepGoingCardIds(pull.candidates ?? []);
    if (cardIds.length > 0) {
      renderChoiceOffer(t("lbl_keep_going_title"), t("lbl_keep_going_body"), [
        {
          label: t("btn_session_done"),
          onClick: () => {
            void offerRecallBonusOrFinish(mode);
          },
        },
        {
          label: t("btn_keep_going"),
          primary: true,
          onClick: () => {
            void acceptRecallKeepGoing(cardIds);
          },
        },
      ]);
      return;
    }
    await offerRecallBonusOrFinish(mode);
  } catch {
    await offerRecallBonusOrFinish(mode);
  }
}

async function acceptRecallKeepGoing(cardIds: string[]): Promise<void> {
  try {
    await callTool("zam_pull_forward_execute", recallUserArgs({ cardIds }));
    started = false;
    finished = false;
    void loadReviews();
  } catch (error) {
    renderError(errorMessage(error));
  }
}

async function offerRecallBonusOrFinish(mode: "empty" | "done"): Promise<void> {
  if (bonusIgnoredThisSession) {
    if (mode === "empty") {
      renderMessage("🎉", t("lbl_recall_empty_title"), t("lbl_caught_up"));
    } else {
      finishSession();
    }
    return;
  }
  try {
    const listed = (await callTool(
      "zam_bonus_candidates_list",
      recallUserArgs({ limit: 1 }),
    )) as { candidates?: BonusOffer[] };
    const bonus = listed.candidates?.[0];
    if (!bonus) {
      if (mode === "empty") {
        renderMessage("🎉", t("lbl_recall_empty_title"), t("lbl_caught_up"));
      } else {
        finishSession();
      }
      return;
    }
    renderChoiceOffer(
      t("lbl_bonus_title"),
      tf("lbl_bonus_body", {
        title: bonus.title,
        because: bonusBecause(bonus.restsOnTitles ?? []),
        unlocks: bonus.unlockCount,
      }),
      [
        {
          label: t("btn_bonus_skip"),
          onClick: () => {
            bonusIgnoredThisSession = true;
            if (mode === "empty") {
              renderMessage(
                "🎉",
                t("lbl_recall_empty_title"),
                t("lbl_caught_up"),
              );
            } else {
              finishSession();
            }
          },
        },
        {
          label: t("btn_bonus_accept"),
          primary: true,
          onClick: () => {
            void acceptRecallBonus(bonus.atomId, mode);
          },
        },
      ],
    );
  } catch {
    if (mode === "empty") {
      renderMessage("🎉", t("lbl_recall_empty_title"), t("lbl_caught_up"));
    } else {
      finishSession();
    }
  }
}

async function acceptRecallBonus(
  atomId: string,
  mode: "empty" | "done",
): Promise<void> {
  try {
    await callTool("zam_bonus_atom_enrol", recallUserArgs({ atomId }));
    bonusIgnoredThisSession = true;
    if (mode === "empty") {
      renderMessage("🎉", t("lbl_recall_empty_title"), t("lbl_caught_up"));
    } else {
      finishSession();
    }
  } catch (error) {
    renderError(errorMessage(error));
  }
}

function renderError(message: string): void {
  renderMessage("⚠️", t("recall_load_failed_title"), message);
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
    void offerAfterQueue("done");
  } else {
    renderCard();
  }
}

function samplingText(content: unknown): string {
  const blocks = Array.isArray(content) ? content : [content];
  return blocks
    .flatMap((block) => {
      if (!block || typeof block !== "object") return [];
      const value = block as { type?: unknown; text?: unknown };
      return value.type === "text" && typeof value.text === "string"
        ? [value.text]
        : [];
    })
    .join("\n")
    .trim();
}

/** The evaluation route implied by the Agent pill plus this host (issue #209). */
function currentEvaluationRoute(): RecallEvaluationRoute {
  return resolveRecallEvaluationRoute({
    selectedEvaluatorId: companionContext?.selectedEvaluatorId,
    evaluators: companionContext?.evaluators,
    capabilities: app.getHostCapabilities(),
  });
}

/**
 * Sample through ZAM's own recall model via `zam_companion_sample` — the path
 * that makes an explicit "ZAM text model" selection real on hosts without
 * bridge sampling (Claude Code). The VS Code extension already routes this id
 * through the same tool.
 */
async function sampleViaZamTextModel(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
): Promise<string> {
  const result = (await callTool("zam_companion_sample", { messages })) as {
    text?: unknown;
  };
  const text = typeof result?.text === "string" ? result.text.trim() : "";
  if (!text) throw new Error("The ZAM text model returned no text");
  return text;
}

/**
 * Sample using the effective evaluator. Both the first evaluation and every
 * follow-up turn go through here, so a discussion never silently changes
 * model mid-thread.
 */
async function sampleRecall(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
  maxTokens = 800,
): Promise<string> {
  const route = currentEvaluationRoute();
  if (route.kind === "zam-text-model") return sampleViaZamTextModel(messages);
  if (route.kind === "unavailable") throw new Error(route.reason);
  if (route.kind !== "host-sampling") {
    throw new Error("This evaluator cannot answer a follow-up in the card.");
  }
  return sampleViaHost(messages, maxTokens);
}

async function sampleViaHost(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
  maxTokens: number,
): Promise<string> {
  const result = await app.createSamplingMessage({
    systemPrompt:
      "You are the intelligence behind ZAM active recall. Be grounded, " +
      "concise, pedagogically useful, and never expose chain-of-thought.",
    messages: messages.map((message) => ({
      role: message.role,
      content: { type: "text" as const, text: message.text },
    })),
    maxTokens,
  });
  const text = samplingText(result.content);
  if (!text) throw new Error("The host model returned no text");
  return text;
}

function renderCard(): void {
  if (!contentEl) return;
  const card = cards[index];
  if (!card) {
    void offerAfterQueue("done");
    return;
  }
  if (card.atomId && !assessedAtoms.has(card.atomId)) {
    const precondition = matchUnassessedPrecondition(
      card.atomId,
      preconditionCache,
    );
    if (precondition) {
      renderChoiceOffer(
        t("lbl_precondition_title"),
        tf("lbl_precondition_body", { title: precondition.title }),
        [
          {
            label: t("btn_precondition_known"),
            onClick: () => {
              void decideRecallPrecondition(precondition.atomId, "known");
            },
          },
          {
            label: t("btn_precondition_learn"),
            primary: true,
            onClick: () => {
              void decideRecallPrecondition(precondition.atomId, "learn");
            },
          },
        ],
      );
      return;
    }
  }
  cardStartedAt = Date.now();
  // Spoiler discipline: `concept` stays in this closure and only reaches the
  // DOM inside showReveal(); it is never rendered before the user reveals.
  const concept = card.concept;
  clearContent();

  // Once the user commits, lock the answer so the same card cannot be
  // double-committed. `rated` guards against a second zam_submit_review.
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
  const modeBadge = document.createElement("span");
  modeBadge.className = "recall-badge";
  modeBadge.textContent = quickMode
    ? t("recall_badge_quick")
    : t("recall_badge_smart");
  badges.appendChild(modeBadge);
  root.appendChild(badges);

  if (card.contentChanged) {
    const retestNotice = document.createElement("div");
    retestNotice.className = "recall-notice recall-retest-notice";
    const dateStr = card.publishedAt ? formatDue(card.publishedAt) : "";
    retestNotice.textContent = card.publishedBy
      ? tf("recall_retest_notice_author_date", {
          author: card.publishedBy,
          date: dateStr,
        })
      : tf("recall_retest_notice_date", { date: dateStr });
    root.appendChild(retestNotice);
  }

  const question = document.createElement("div");
  question.className = "recall-question";
  question.textContent = card.question?.trim() ? card.question : card.slug;
  root.appendChild(question);

  const answer = document.createElement("textarea");
  answer.className = "recall-answer";
  answer.placeholder = t("placeholder_recall_answer");
  root.appendChild(answer);

  // Empty still reveals directly; a typed answer is either evaluated by the
  // host (smart mode) or compared locally (quick mode).
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

  function unlockInputs(): void {
    committed = false;
    actionBtn.disabled = false;
    answer.disabled = false;
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
    result.textContent = tf("recall_next_due", { due });
    root.appendChild(result);
    if (res.blocked) {
      showNotice(
        tf("recall_blocked_notice", { slug: res.blocked.blockedSlug }),
      );
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
        responseTimeMs: Math.max(0, Date.now() - cardStartedAt),
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
        tf("recall_rating_failed", {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  function appendRatings(
    reveal: HTMLElement,
    suggestedRating?: 1 | 2 | 3 | 4,
  ): void {
    const ratingLabel = document.createElement("div");
    ratingLabel.className = "recall-rating-label";
    ratingLabel.textContent = suggestedRating
      ? `${t("lbl_rating_instruction")} · ${tf("recall_host_suggestion", {
          rating: suggestedRating,
        })}`
      : t("lbl_rating_instruction");
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
      if (rating === suggestedRating) {
        ratingBtn.classList.add("recall-rating-suggested");
      }
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
      ownTitle.textContent = t("recall_your_answer_title");
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

    appendRatings(reveal);
    root.appendChild(reveal);
  }

  function appendDiscussion(
    reveal: HTMLElement,
    learnerAnswer: string,
    evaluation: RecallEvaluation,
  ): void {
    const discussion = document.createElement("div");
    discussion.className = "recall-discussion";
    const title = document.createElement("div");
    title.className = "recall-reveal-title";
    title.textContent = t("recall_discussion_title");
    const history = document.createElement("div");
    history.className = "recall-discussion-history";
    const followUp = document.createElement("textarea");
    followUp.className = "recall-answer recall-follow-up";
    followUp.placeholder = t("placeholder_recall_follow_up");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn secondary-btn";
    button.textContent = t("btn_recall_ask");
    const actions = document.createElement("div");
    actions.className = "recall-actions";
    actions.appendChild(button);
    discussion.append(title, history, followUp, actions);
    reveal.appendChild(discussion);

    const samplingMessages: Array<{
      role: "user" | "assistant";
      text: string;
    }> = [];

    button.addEventListener("click", () => {
      const question = followUp.value.trim();
      if (!question) return;
      button.disabled = true;
      followUp.disabled = true;
      const userLine = document.createElement("div");
      userLine.className = "recall-discussion-user";
      userLine.textContent = question;
      history.appendChild(userLine);

      const prompt = buildRecallFollowUpPrompt(
        {
          ...card,
          resolvedContext: card.resolvedContext?.content ?? null,
        },
        learnerAnswer,
        evaluation,
        question,
      );
      if (samplingMessages.length === 0) {
        samplingMessages.push({ role: "user", text: prompt });
      } else {
        samplingMessages.push({ role: "user", text: question });
      }
      pushContext(card, "discussing");
      void sampleRecall(samplingMessages)
        .then((reply) => {
          samplingMessages.push({ role: "assistant", text: reply });
          const assistantLine = document.createElement("div");
          assistantLine.className = "recall-discussion-assistant";
          assistantLine.textContent = reply;
          history.appendChild(assistantLine);
          followUp.value = "";
        })
        .catch((error) =>
          showNotice(
            tf("recall_follow_up_failed", { message: errorMessage(error) }),
          ),
        )
        .finally(() => {
          button.disabled = false;
          followUp.disabled = false;
        });
    });
  }

  function showSmartEvaluation(
    learnerAnswer: string,
    evaluation: RecallEvaluation,
  ): void {
    const reveal = document.createElement("div");
    reveal.className = "recall-reveal recall-smart-feedback";

    const ownTitle = document.createElement("div");
    ownTitle.className = "recall-reveal-title";
    ownTitle.textContent = t("recall_your_answer_title");
    const own = document.createElement("div");
    own.className = "recall-own-answer";
    own.textContent = learnerAnswer;

    const feedbackTitle = document.createElement("div");
    feedbackTitle.className = "recall-reveal-title";
    feedbackTitle.textContent = tf("recall_host_feedback_title", {
      verdict: evaluation.verdict,
    });
    const feedback = document.createElement("div");
    feedback.className = `recall-feedback recall-feedback-${evaluation.verdict}`;
    feedback.textContent = evaluation.feedback;
    reveal.append(ownTitle, own, feedbackTitle, feedback);

    if (evaluation.gaps.length > 0) {
      const gaps = document.createElement("ul");
      gaps.className = "recall-gaps";
      for (const gap of evaluation.gaps) {
        const item = document.createElement("li");
        item.textContent = gap;
        gaps.appendChild(item);
      }
      reveal.appendChild(gaps);
    }

    const referenceTitle = document.createElement("div");
    referenceTitle.className = "recall-reveal-title";
    referenceTitle.textContent = t("lbl_reveal_title");
    const reference = document.createElement("div");
    reference.className = "recall-concept";
    // Always reveal ZAM's stored concept, not a model-generated replacement.
    reference.textContent = concept;
    reveal.append(referenceTitle, reference);

    if (app.getHostCapabilities()?.sampling) {
      appendDiscussion(reveal, learnerAnswer, evaluation);
    }
    appendRatings(reveal, evaluation.suggestedRating);
    root.appendChild(reveal);
  }

  async function sendToHostConversation(learnerAnswer: string): Promise<void> {
    const questionText = card.question?.trim() || card.slug;
    await app.updateModelContext({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            zamRecall: {
              cardId: card.cardId,
              slug: card.slug,
              question: questionText,
              learnerAnswer,
              referenceAnswer: concept,
              sourceContext: card.resolvedContext?.content ?? null,
            },
          }),
        },
      ],
    });
    const result = await app.sendMessage({
      role: "user",
      content: [
        {
          type: "text",
          text:
            `Please evaluate my ZAM Recall answer to “${questionText}”, ` +
            "identify misconceptions, and discuss the learning content with me.",
        },
      ],
    });
    if (result.isError) throw new Error("The host rejected the Recall message");
  }

  async function evaluateAnswer(learnerAnswer: string): Promise<void> {
    // Selection first, capabilities second (issue #209): an explicit, routable
    // "ZAM text model" must evaluate in-card instead of taking the ui/message
    // detour just because the host happens to expose messaging.
    const route = currentEvaluationRoute();
    pushContext(card, "evaluating");
    if (route.kind === "zam-text-model" || route.kind === "host-sampling") {
      const prompt = buildRecallEvaluationPrompt(
        {
          ...card,
          resolvedContext: card.resolvedContext?.content ?? null,
        },
        learnerAnswer,
        // The panel has no settings access; its locale comes from the host's
        // browser language, resolved during connect().
        currentLocale,
      );
      const raw = await sampleRecall([{ role: "user", text: prompt }]);
      const evaluation = parseRecallEvaluation(raw);
      showSmartEvaluation(learnerAnswer, evaluation);
      pushContext(card, "answered");
      return;
    }
    if (route.kind === "host-message") {
      await sendToHostConversation(learnerAnswer);
      showReveal(learnerAnswer);
      showNotice(t("recall_sent_to_host"));
      pushContext(card, "answered", { learnerAnswer });
      return;
    }
    throw new Error(route.reason);
  }

  actionBtn.addEventListener("click", () => {
    if (committed) return;
    const text = answer.value.trim();
    lockInputs();
    if (!text) {
      showReveal();
      pushContext(card, "revealed");
    } else if (quickMode) {
      showReveal(text);
      pushContext(card, "answered");
    } else {
      actionBtn.textContent = t("btn_recall_checking");
      void evaluateAnswer(text).catch((error) => {
        showNotice(tf("recall_check_failed", { message: errorMessage(error) }));
        unlockInputs();
        actionBtn.textContent = t("btn_recall_check");
      });
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
    await loadPreconditionCache();
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
  panelVersion = structured.version;
  // A tool result may arrive AFTER the 800ms grace-period fallback below has
  // already started a session against the previous context (observed live:
  // an agent-opened Recall for the test profile kept showing the default
  // learner's queue while the User pill switched — a rating would then pair
  // the new user with the old user's card id). The authoritative context in
  // the tool result must win: if a session is running for a different
  // user/domain, discard it and reload instead of merely relabeling the bar.
  const previousUser = currentUser;
  const previousDomain = focusDomain;
  currentUser = structured.user ?? null;
  focusDomain = structured.domain ?? null;
  companionContext = structured.companionContext ?? companionContext;
  quickMode = deriveQuickMode(
    structured.companionContext,
    structured.quickMode === true,
  );
  const contextChanged =
    started && (previousUser !== currentUser || previousDomain !== focusDomain);
  if (contextChanged) {
    started = false;
    finished = false;
    cards = [];
    index = 0;
    preconditionCache = [];
    assessedAtoms.clear();
    bonusIgnoredThisSession = false;
    tally.done = 0;
    tally.ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
  }
  clearConnectionNotice();

  const contextState =
    structured.companionContext ??
    fallbackContextBarState(SURFACE, currentUser);
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    "ZAM Recall",
    panelVersion,
    contextState,
    {
      write: writeCompanionContext,
      read: readCompanionContext,
      hasUnsavedChanges: hasUnsavedRecallState,
      onReload: reloadForContext,
      onError: showConnectionNotice,
    },
  );
  start();
};

// Mount the bar immediately — before any tool result — so the title and an
// honest "no learner/agent resolved yet" state (fallbackContextBarState) are
// visible from first paint (review finding 6), not only once a host's
// ontoolresult (or the 800ms grace-period fallback below) actually fires.
contextBar = ensureContextBar(
  contextBar,
  contextBarRoot,
  "ZAM Recall",
  panelVersion,
  fallbackContextBarState(SURFACE, currentUser),
  {
    write: writeCompanionContext,
    read: readCompanionContext,
    hasUnsavedChanges: hasUnsavedRecallState,
    onReload: reloadForContext,
    onError: showConnectionNotice,
  },
);

// A plain file viewer (e.g. an editor preview) renders this HTML without
// ever answering ui/initialize — connect() then stays pending forever.
// Degrade honestly instead of showing "Connecting to host…" for good.
const NO_HOST_NOTICE =
  "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
  "(z. B. basic-host oder Copilot-Panel).";
const noHostTimer = setTimeout(
  () => showConnectionNotice(NO_HOST_NOTICE),
  4000,
);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    const preferredMode = preferredRecallDisplayMode(app.getHostContext());
    if (preferredMode) {
      // Placement remains host-owned. This is a capability-gated request,
      // and rejection must never prevent a review session from opening.
      void app.requestDisplayMode({ mode: preferredMode }).catch(() => {});
    }
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
    showConnectionNotice(`ZAM Recall failed to start: ${errorMessage(error)}`);
  });
