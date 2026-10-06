/**
 * The review list on the phone (ADR 2026-10-05 Decisions 5, 7, 8): each
 * proposed card with Yes, No or Bonus, the area above its cards, what the
 * library already holds beside the proposal, and what the material leads to.
 *
 * The rules are the kernel's (`material-review-state.ts`), shared with the
 * desktop; the words and the DOM are this app's.
 */

import type { MaterialImportRecord } from "../../src/kernel/import/material-import.js";
import {
  analysisLine,
  type ConfirmCounts,
  confirmCounts,
  initialChoices,
  isChoosable,
  type MaterialChoices,
  type MaterialReviewChoice,
  reviewGroups,
} from "../../src/kernel/import/material-review-state.js";
import { t, tf } from "./i18n.js";
import type { DeviceReview } from "./material-import.js";
import {
  initRadioGroupKeyboard,
  syncRadioGroupTabStops,
} from "./ui/radio-group.js";

export interface MaterialReviewState {
  review: DeviceReview;
  /** The models that read the material, as the learner knows them. */
  model: string;
  /** Every model the material was sent to (D11). */
  sentTo: string[];
  choices: MaterialChoices;
  /** Proposed area → what the learner typed. */
  areas: Record<string, string>;
}

export function createReviewState(
  review: DeviceReview,
  model: string,
  sentTo: string[] = [],
): MaterialReviewState {
  return {
    review,
    model,
    sentTo,
    choices: initialChoices(review.rows),
    areas: {},
  };
}

/** "Add 7 · 2 as Bonus · 3 not saved" — unchosen rows never vanish silently. */
export function confirmText(counts: ConfirmCounts): string {
  const parts = [tf("material_confirm", { count: counts.yes })];
  if (counts.bonus > 0) {
    parts.push(tf("material_confirm_bonus", { count: counts.bonus }));
  }
  if (counts.notSaved > 0) {
    parts.push(tf("material_confirm_not_saved", { count: counts.notSaved }));
  }
  return parts.join(" · ");
}

/** "Luna (also sent to Gemma)" — a model that got the pages is named. */
export function modelText(model: string, sentTo: string[]): string {
  const readers = model.split(", ");
  const others = sentTo.filter((label) => !readers.includes(label));
  return others.length > 0
    ? tf("material_review_model_also", { model, others: others.join(", ") })
    : model;
}

export function originText(origin: "page" | "completed" | "extra"): string {
  return t(`material_origin_${origin}`);
}

/** "You imported this file on 5 Oct." — informs, never blocks. */
export function reimportText(
  reimports: MaterialImportRecord[],
  locale: string,
): string | null {
  const newest = [...reimports].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  if (!newest) return null;
  const date = new Date(newest.createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return tf("material_review_reimport", {
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date),
  });
}

export interface MaterialReviewElements {
  meta: HTMLElement;
  notice: HTMLElement;
  list: HTMLElement;
  confirm: HTMLButtonElement;
  areaOptions: HTMLDataListElement;
}

const CHOICES: MaterialReviewChoice[] = ["yes", "no", "bonus"];

function chip(text: string): HTMLElement {
  const node = document.createElement("span");
  node.className = "chip";
  node.textContent = text;
  return node;
}

function paintConfirm(
  elements: MaterialReviewElements,
  state: MaterialReviewState,
): void {
  const counts = confirmCounts(state.review.rows, state.choices);
  elements.confirm.textContent = confirmText(counts);
  elements.confirm.disabled = counts.yes + counts.bonus === 0;
}

function choiceControl(
  rowId: string,
  elements: MaterialReviewElements,
  state: MaterialReviewState,
): HTMLElement {
  const group = document.createElement("div");
  group.className = "segmented";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", t("material_choice_group"));
  const paint = () => {
    for (const button of group.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    )) {
      const checked = button.dataset.choice === state.choices[rowId];
      button.setAttribute("aria-checked", String(checked));
      button.classList.toggle("active", checked);
    }
    syncRadioGroupTabStops(group);
  };
  for (const choice of CHOICES) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.dataset.choice = choice;
    button.textContent = t(`material_choice_${choice}`);
    button.addEventListener("click", () => {
      state.choices[rowId] = choice;
      paint();
      paintConfirm(elements, state);
    });
    group.append(button);
  }
  paint();
  initRadioGroupKeyboard(group);
  return group;
}

function rowCard(
  row: DeviceReview["rows"][number],
  elements: MaterialReviewElements,
  state: MaterialReviewState,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "card";
  const chips = document.createElement("div");
  chips.className = "chip-row";
  let question: string;
  let answer: string;
  if (row.kind === "proposal") {
    const proposal = state.review.set.proposals[row.proposalIndex];
    question = proposal.question;
    answer = proposal.answer;
    chips.append(chip(originText(proposal.origin)));
    if (proposal.hardToRead) chips.append(chip(t("material_hard_to_read")));
  } else {
    question = row.question;
    answer = row.answer;
    if (row.kind === "existing") chips.append(chip(t("material_existing")));
  }
  const title = document.createElement("strong");
  title.textContent = question;
  const body = document.createElement("p");
  body.className = "t-footnote";
  body.style.margin = "0";
  body.textContent = answer;
  card.append(title, body);
  if (chips.childElementCount > 0) card.append(chips);
  if (isChoosable(row)) {
    card.append(choiceControl(row.id, elements, state));
  } else {
    const held = document.createElement("p");
    held.className = "t-footnote";
    held.style.margin = "0";
    held.textContent = t("material_existing_held");
    card.append(held);
  }
  return card;
}

/** Render the whole list; the state object carries the learner's choices. */
export function renderMaterialReview(
  elements: MaterialReviewElements,
  state: MaterialReviewState,
  locale: string,
): void {
  elements.meta.textContent = tf("material_review_meta", {
    model: modelText(state.model, state.sentTo),
    analysis: analysisLine(state.review.set.analysis),
  });
  const notice = reimportText(state.review.reimports, locale);
  elements.notice.hidden = notice === null;
  elements.notice.textContent = notice ?? "";
  elements.areaOptions.replaceChildren(
    ...state.review.areas.map((path) => {
      const option = document.createElement("option");
      option.value = path;
      return option;
    }),
  );

  const { groups, continuations } = reviewGroups(
    state.review.rows,
    state.review.areaGroups,
  );
  const sections: HTMLElement[] = groups.map((group) => {
    const section = document.createElement("section");
    section.className = "stack";
    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.textContent = t("material_area_label");
    const input = document.createElement("input");
    input.type = "text";
    input.value = state.areas[group.area] ?? group.area;
    input.setAttribute("list", elements.areaOptions.id);
    input.addEventListener("input", () => {
      state.areas[group.area] = input.value;
    });
    field.append(label, input);
    section.append(
      field,
      ...group.rows.map((row) => rowCard(row, elements, state)),
    );
    return section;
  });
  if (continuations.length > 0) {
    const section = document.createElement("section");
    section.className = "stack";
    const heading = document.createElement("h3");
    heading.className = "t-headline";
    heading.textContent = t("material_continuation_heading");
    section.append(
      heading,
      ...continuations.map((row) => rowCard(row, elements, state)),
    );
    sections.push(section);
  }
  elements.list.replaceChildren(...sections);
  paintConfirm(elements, state);
}
