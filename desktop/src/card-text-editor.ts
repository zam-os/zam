/**
 * Editing a card side that holds formulas (ADR 2026-10-14b, Decision 9: a
 * pupil edits words, not TeX).
 *
 * The editor attaches under a question or answer text area:
 *
 * - **The default view** shows the card as it will look, and each formula's
 *   spoken sentence.
 * - **The default edit is "let the model fix it":** one line in the
 *   learner's words; the model's correction is shown as a preview to accept
 *   or discard. Nothing is written until the card is saved.
 * - **"Insert formula"** adds an empty formula with a TeX field, a live
 *   preview and a speech field. Nobody types dollar signs.
 * - **Curators** find every formula's TeX and speech, and the text between
 *   them, behind a disclosure.
 *
 * A side without formulas stays the plain text area it always was. In
 * formula mode the text area is hidden and holds the plain projection, so
 * every check that reads it keeps working. The DOM is built with nodes,
 * never parsed from strings (Decision 2).
 */

import type { CardSegmentPayload } from "../../src/bridge/protocol.js";
import {
  type CardText,
  normalizeCardText,
  plainProjection,
  validateCardText,
} from "../../src/kernel/library/card-text.js";
import { runBridge } from "./bridge-transport.js";
import { renderCardText } from "./card-text-render.js";
import { t } from "./i18n.js";

export interface CardTextEditor {
  /** Show a card side: its plain text and its segments, if any. */
  load(plain: string, segments: CardSegmentPayload[] | null | undefined): void;
  /** Read-only for a card the learner may not edit. */
  setLocked(locked: boolean): void;
  /**
   * What the save sends for this side: segments, `null` to turn a side that
   * had formulas back into plain text, or `undefined` to send the plain
   * text area as before.
   */
  segmentsForSave(): CardSegmentPayload[] | null | undefined;
}

export interface CardTextEditorOptions {
  side: "question" | "answer";
  /** The other side's plain text, as context for the model. */
  otherSide: () => string;
  /** The model's correction; defaults to the `card-text-fix` bridge call. */
  fix?: (args: string[]) => Promise<FixResult>;
}

interface FixResult {
  plain: string;
  segments: CardSegmentPayload[] | null;
}

type Segment = CardSegmentPayload;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Segments a save may send: empty formulas dropped, text merged. */
function cleaned(segments: Segment[]): Segment[] {
  return normalizeCardText(
    segments.filter(
      (segment) => segment.type !== "math" || segment.tex.trim().length > 0,
    ) as CardText,
  ) as Segment[];
}

const hasFormula = (segments: Segment[]) =>
  segments.some((segment) => segment.type !== "text");

export function attachCardTextEditor(
  textarea: HTMLTextAreaElement,
  options: CardTextEditorOptions,
): CardTextEditor {
  let segments: Segment[] | null = null;
  let loadedWithSegments = false;
  let locked = false;

  const root = el("div", "card-text-editor");
  const preview = el("div", "cte-preview");
  const readings = el("ul", "cte-readings");
  const fixRow = el("div", "cte-fix");
  const fixInput = el("input", "cte-fix-input");
  fixInput.type = "text";
  fixInput.placeholder = t("cte_fix_placeholder");
  fixInput.setAttribute("aria-label", t("cte_fix_placeholder"));
  const fixButton = el(
    "button",
    "btn secondary-btn btn-sm",
    t("cte_fix_button"),
  );
  fixButton.type = "button";
  const insertButton = el(
    "button",
    "btn secondary-btn btn-sm",
    t("cte_insert_formula"),
  );
  insertButton.type = "button";
  fixRow.append(fixInput, fixButton, insertButton);
  const proposal = el("div", "cte-proposal");
  proposal.hidden = true;
  const status = el("div", "cte-status");
  status.setAttribute("role", "status");
  const source = el("details", "cte-source");
  const sourceSummary = el("summary", "", t("cte_source_summary"));
  const sourceList = el("div", "cte-source-list");
  source.append(sourceSummary, sourceList);
  root.append(preview, readings, fixRow, proposal, status, source);
  textarea.insertAdjacentElement("afterend", root);

  /** Keep the hidden text area on the plain projection, for every check. */
  function syncTextarea(): void {
    if (!segments) return;
    const valid = cleaned(segments);
    textarea.value =
      valid.length > 0 && validateCardText(valid).length === 0
        ? plainProjection(valid as CardText)
        : valid
            .map((segment) => (segment.type === "text" ? segment.text : ""))
            .join("");
  }

  function renderView(): void {
    const formulaMode = segments !== null;
    textarea.hidden = formulaMode;
    preview.hidden = !formulaMode;
    readings.hidden = !formulaMode;
    source.hidden = !formulaMode;
    fixRow.hidden = locked;
    preview.replaceChildren();
    readings.replaceChildren();
    if (!segments) return;
    const valid = cleaned(segments);
    void renderCardText(preview, valid, textarea.value);
    for (const segment of valid) {
      if (segment.type !== "math") continue;
      const item = el("li", "");
      item.textContent = segment.speech
        ? `${t("cte_reads")} ${segment.speech}`
        : t("cte_no_speech");
      readings.append(item);
    }
  }

  function renderSource(focusIndex?: number): void {
    sourceList.replaceChildren();
    if (!segments) return;
    segments.forEach((segment, index) => {
      const row = el("div", `cte-source-row cte-${segment.type}`);
      if (segment.type === "text") {
        const area = el("textarea", "cte-text");
        area.value = segment.text;
        area.rows = 2;
        area.readOnly = locked;
        area.setAttribute("aria-label", t("cte_text_label"));
        area.addEventListener("input", () => {
          if (segments?.[index]?.type !== "text") return;
          segments[index] = { type: "text", text: area.value };
          changed(false);
        });
        row.append(area);
      } else if (segment.type === "math") {
        const tex = el("input", "cte-tex");
        tex.type = "text";
        tex.value = segment.tex;
        tex.readOnly = locked;
        tex.spellcheck = false;
        tex.setAttribute("aria-label", t("cte_tex_label"));
        tex.placeholder = t("cte_tex_label");
        const live = el("div", "cte-live");
        const speech = el("input", "cte-speech");
        speech.type = "text";
        speech.value = segment.speech ?? "";
        speech.readOnly = locked;
        speech.setAttribute("aria-label", t("cte_speech_label"));
        speech.placeholder = t("cte_speech_label");
        const remove = el(
          "button",
          "btn secondary-btn btn-sm",
          t("cte_remove"),
        );
        remove.type = "button";
        remove.hidden = locked;
        const update = () => {
          const list = segments;
          const current = list?.[index];
          if (!list || current?.type !== "math") return;
          const spoken = speech.value.trim();
          const next: Segment = {
            type: "math",
            tex: tex.value,
            ...(spoken ? { speech: spoken } : {}),
            ...(current.block ? { block: true } : {}),
          };
          list[index] = next;
          renderLive(live, next);
          changed(false);
        };
        tex.addEventListener("input", update);
        speech.addEventListener("input", update);
        remove.addEventListener("click", () => {
          segments?.splice(index, 1);
          changed(true);
        });
        renderLive(live, segment);
        row.append(tex, live, speech, remove);
        if (index === focusIndex) queueMicrotask(() => tex.focus());
      }
      sourceList.append(row);
    });
  }

  /** A formula's live preview, or why it cannot be shown yet. */
  function renderLive(target: HTMLElement, segment: Segment): void {
    target.replaceChildren();
    if (segment.type !== "math" || !segment.tex.trim()) return;
    const issues = validateCardText([{ type: "math", tex: segment.tex }]);
    if (issues.length > 0) {
      target.textContent = issues[0].message;
      target.classList.add("cte-invalid");
      return;
    }
    target.classList.remove("cte-invalid");
    void renderCardText(
      target,
      [{ type: "math", tex: segment.tex }],
      segment.tex,
    );
  }

  function changed(rebuildSource: boolean): void {
    syncTextarea();
    renderView();
    if (rebuildSource) renderSource();
  }

  function enterFormulaMode(next: Segment[], focusIndex?: number): void {
    segments = next;
    syncTextarea();
    renderView();
    renderSource(focusIndex);
  }

  insertButton.addEventListener("click", () => {
    const base: Segment[] =
      segments ??
      (textarea.value.trim()
        ? [{ type: "text", text: `${textarea.value.trimEnd()} ` }]
        : []);
    const next = [...base, { type: "math" as const, tex: "" }];
    source.open = true;
    enterFormulaMode(next, next.length - 1);
  });

  fixButton.addEventListener("click", async () => {
    const instruction = fixInput.value.trim();
    if (!instruction) {
      fixInput.focus();
      return;
    }
    fixButton.disabled = true;
    status.textContent = t("cte_fix_working");
    proposal.hidden = true;
    try {
      const current = segments ? cleaned(segments) : null;
      const fix =
        options.fix ??
        ((args: string[]) => runBridge<FixResult>("card-text-fix", args));
      const result = await fix([
        "--side",
        options.side,
        "--instruction",
        instruction,
        ...(current && hasFormula(current)
          ? ["--segments", JSON.stringify(current)]
          : ["--text", textarea.value]),
        "--other",
        options.otherSide(),
      ]);
      status.textContent = "";
      showProposal(result.plain, result.segments);
    } catch (err) {
      status.textContent = `${t("cte_fix_failed")} ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      fixButton.disabled = false;
    }
  });

  function showProposal(plain: string, next: Segment[] | null): void {
    proposal.replaceChildren();
    const heading = el("div", "cte-proposal-heading", t("cte_proposal"));
    const body = el("div", "cte-proposal-body");
    void renderCardText(body, next, plain);
    const accept = el("button", "btn primary-btn btn-sm", t("cte_accept"));
    accept.type = "button";
    const discard = el("button", "btn secondary-btn btn-sm", t("cte_discard"));
    discard.type = "button";
    accept.addEventListener("click", () => {
      proposal.hidden = true;
      fixInput.value = "";
      if (next && hasFormula(next)) {
        enterFormulaMode(next);
      } else {
        segments = null;
        textarea.value = plain;
        renderView();
        renderSource();
      }
    });
    discard.addEventListener("click", () => {
      proposal.hidden = true;
    });
    proposal.append(heading, body, accept, discard);
    proposal.hidden = false;
  }

  const editor: CardTextEditor = {
    load(plain, loaded) {
      proposal.hidden = true;
      status.textContent = "";
      fixInput.value = "";
      source.open = false;
      loadedWithSegments = Boolean(loaded && loaded.length > 0);
      segments = loadedWithSegments ? [...(loaded as Segment[])] : null;
      textarea.value = plain;
      if (segments) syncTextarea();
      renderView();
      renderSource();
    },
    setLocked(next) {
      locked = next;
      renderView();
      renderSource();
    },
    segmentsForSave() {
      if (segments) {
        const valid = cleaned(segments);
        if (hasFormula(valid)) return valid;
        // Every formula removed: the side is plain again.
        return loadedWithSegments ? null : undefined;
      }
      return loadedWithSegments ? null : undefined;
    },
  };
  return editor;
}
