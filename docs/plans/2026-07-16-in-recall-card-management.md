# In-Recall Card Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a learner stop, fix, or remove a card from inside a desktop Recall Studio review, without leaving the session for the trivial cases.

**Architecture:** Pure UI wiring over existing bridge commands — no kernel, bridge, or MCP change. A new framework-free helper module (`study-card-actions.ts`) builds the exact `{cmd, args}` each control issues and is unit-tested in isolation; `main.ts` wires the study-view DOM to that helper and `runBridge`; `learning-content.ts` gains one exported entry point so "Open in full editor" can focus a card by slug. Destructive actions reuse the Content Editor's proven preview→confirm pattern via a study-view-owned modal.

**Tech Stack:** TypeScript, Vitest, the ZAM desktop Tauri app (`desktop/`), the `zam bridge` JSON CLI, the `t()`/`tf()` i18n layer in `desktop/src/i18n.ts`.

Design source: [docs/adr/2026-07-16b-in-recall-card-management.md](../adr/2026-07-16b-in-recall-card-management.md).

## Status

- [x] **Phase 0 — feature branch and reviewed design**
- [x] **Phase 1 — pure command builders and unit tests**
- [x] **Phase 2 — seven-locale i18n coverage**
- [x] **Phase 3 — study-view markup and styling**
- [x] **Phase 4 — full-editor navigation entry point**
- [x] **Phase 5 — stop, edit, remove, and delete wiring**
- [x] **Phase 6 — end-to-end bridge verification**
- [x] **Phase 7 — branch pushed and PR #170 opened**
- [x] **Independent review corrective pass** — make edit controls visible in
  every intended state, share the rating/card-management action lock, suppress
  rating shortcuts while editing or confirming, expose action errors, align the
  ADR, and add regression coverage.

The phase checklist above is authoritative for handoff. The detailed task
checkboxes below preserve the original execution recipe.

## Global Constraints

- **No kernel / bridge / MCP changes.** Reuse existing bridge commands only: `personal-card-remove`, `personal-card-delete`, `personal-card-update` (all in `src/cli/commands/bridge.ts`).
- **`runBridge` passes args as an array** (`desktop/src/bridge-transport.ts`) — no shell, so no quoting/escaping of slugs or user text.
- **`personal-card-update` and `updateToken` are partial updates** — only flags that are present change; omitted fields are preserved. Inline edit therefore sends **only** `--slug --question --concept`. Never send blank flags for fields you are not editing.
- **Every `t("...")`/`tf("...")` key used under `desktop/src` MUST exist in all 7 locales** (`en`, `de`, `es`, `fr`, `pt`, `zh`, `ja`) or `tests/desktop/i18n-completeness.test.ts` fails. Reuse existing keys where possible; every new key gets all 7 values.
- **Build DOM with `createElement` + `textContent`, never `innerHTML`, for card-derived content** — matches the security note at `desktop/src/main.ts:3924` (card content can include resolved remote text).
- **Commit format:** `<type>: <short summary>` — `feat`, `fix`, `docs`, `refactor`, `test`, `chore` (per `CLAUDE.md`).
- Lint/format with Biome (`npm run lint`, `npm run format`); full test run is `npm run test`.

Reusable existing i18n keys (present in all 7 locales — do **not** redefine): `lbl_confirm_remove_title`, `lbl_confirm_remove_desc`, `lbl_confirm_delete_title`, `lbl_confirm_delete_desc`, `lbl_impact_reviews`, `lbl_impact_cards`, `lbl_impact_steps`, `lbl_impact_skills`, `lbl_card_removed_toast`, `lbl_card_deleted_toast`, `lbl_card_saved_toast`, `lbl_cancel_action`, `lbl_confirm_action`, `concept`.

---

### Task 0: Feature branch

- [ ] **Step 1: Create the branch off `main`**

```bash
git checkout main
git checkout -b feat/recall-card-management
git status
```
Expected: `On branch feat/recall-card-management`, working tree clean (the ADR from the design step is already committed or staged separately — if the ADR is uncommitted, commit it first with `docs: add ADR for in-recall card management`).

---

### Task 1: Pure action-builder module (`study-card-actions.ts`)

The testable core: pure functions that return the exact bridge `{cmd, args}` each control issues, plus inline-edit validation. No DOM, no Tauri, no imports — mirrors `bridge-transport.ts` / `recall-evaluation.ts` being framework-free.

**Files:**
- Create: `desktop/src/study-card-actions.ts`
- Test: `tests/desktop/study-card-actions.test.ts`

**Interfaces:**
- Produces (consumed by Task 5 `main.ts`):
  - `removePreviewCommand(slug: string): BridgeCall`
  - `removeConfirmCommand(slug: string): BridgeCall`
  - `deletePreviewCommand(slug: string): BridgeCall`
  - `deleteConfirmCommand(slug: string): BridgeCall`
  - `editCommand(edit: InlineEdit): BridgeCall` — throws `StudyEditError` with `.reason` of `"concept-required"` or `"question-required"`
  - `type BridgeCall = { cmd: string; args: string[] }`
  - `interface InlineEdit { slug: string; question: string; concept: string }`
  - `class StudyEditError extends Error { reason: "concept-required" | "question-required" }`

- [ ] **Step 1: Write the failing test**

Create `tests/desktop/study-card-actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  StudyEditError,
  deleteConfirmCommand,
  deletePreviewCommand,
  editCommand,
  removeConfirmCommand,
  removePreviewCommand,
} from "../../desktop/src/study-card-actions.js";

describe("study-card-actions", () => {
  it("builds the remove (delete-card) preview and confirm calls", () => {
    expect(removePreviewCommand("git-init")).toEqual({
      cmd: "personal-card-remove",
      args: ["--slug", "git-init"],
    });
    expect(removeConfirmCommand("git-init")).toEqual({
      cmd: "personal-card-remove",
      args: ["--slug", "git-init", "--confirm"],
    });
  });

  it("builds the outdated (delete-token) preview and confirm calls", () => {
    expect(deletePreviewCommand("git-init")).toEqual({
      cmd: "personal-card-delete",
      args: ["--slug", "git-init"],
    });
    expect(deleteConfirmCommand("git-init")).toEqual({
      cmd: "personal-card-delete",
      args: ["--slug", "git-init", "--confirm"],
    });
  });

  it("builds a partial edit call with only slug, question and concept, trimmed", () => {
    expect(
      editCommand({ slug: "git-init", question: "  What inits? ", concept: " git init " }),
    ).toEqual({
      cmd: "personal-card-update",
      args: ["--slug", "git-init", "--question", "What inits?", "--concept", "git init"],
    });
  });

  it("rejects an empty concept", () => {
    try {
      editCommand({ slug: "s", question: "q", concept: "   " });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(StudyEditError);
      expect((err as StudyEditError).reason).toBe("concept-required");
    }
  });

  it("rejects an empty question", () => {
    try {
      editCommand({ slug: "s", question: "  ", concept: "c" });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(StudyEditError);
      expect((err as StudyEditError).reason).toBe("question-required");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/desktop/study-card-actions.test.ts`
Expected: FAIL — cannot resolve `../../desktop/src/study-card-actions.js`.

- [ ] **Step 3: Write minimal implementation**

Create `desktop/src/study-card-actions.ts`:

```ts
/**
 * Pure command builders for the study-view card-management controls
 * (ADR 2026-07-16b). Framework-free by design: no DOM, no Tauri, no imports —
 * the same discipline as bridge-transport.ts, so it is unit-testable in
 * isolation and its output IS the contract the e2e walkthrough exercises.
 *
 * All three underlying bridge commands (personal-card-remove /-delete /-update)
 * are slug-keyed and implement a preview -> confirm handshake; the confirm step
 * is the same command plus --confirm.
 */
export type BridgeCall = { cmd: string; args: string[] };

export interface InlineEdit {
  slug: string;
  question: string;
  concept: string;
}

export type StudyEditReason = "concept-required" | "question-required";

export class StudyEditError extends Error {
  reason: StudyEditReason;
  constructor(reason: StudyEditReason) {
    super(reason);
    this.name = "StudyEditError";
    this.reason = reason;
  }
}

/** "Not for me": remove this learner's card; shared content untouched. */
export function removePreviewCommand(slug: string): BridgeCall {
  return { cmd: "personal-card-remove", args: ["--slug", slug] };
}
export function removeConfirmCommand(slug: string): BridgeCall {
  return { cmd: "personal-card-remove", args: ["--slug", slug, "--confirm"] };
}

/** "Outdated — remove it": permanently hard-delete the shared token. */
export function deletePreviewCommand(slug: string): BridgeCall {
  return { cmd: "personal-card-delete", args: ["--slug", slug] };
}
export function deleteConfirmCommand(slug: string): BridgeCall {
  return { cmd: "personal-card-delete", args: ["--slug", slug, "--confirm"] };
}

/**
 * Inline edit: send ONLY the two edited fields. personal-card-update is a
 * partial update, so omitting the rest preserves title/domain/bloom/mode/
 * context/source-link. Both fields are required and trimmed.
 */
export function editCommand(edit: InlineEdit): BridgeCall {
  const question = edit.question.trim();
  const concept = edit.concept.trim();
  if (!concept) throw new StudyEditError("concept-required");
  if (!question) throw new StudyEditError("question-required");
  return {
    cmd: "personal-card-update",
    args: ["--slug", edit.slug, "--question", question, "--concept", concept],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/desktop/study-card-actions.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/study-card-actions.ts tests/desktop/study-card-actions.test.ts
git commit -m "feat: add pure command builders for study-view card management"
```

---

### Task 2: New i18n keys in all 7 locales

**Files:**
- Modify: `desktop/src/i18n.ts` (7 locale blocks: `es`≈L27, `fr`≈L597, `pt`≈L1172, `zh`≈L1739, `ja`≈L2265, `en`≈L2896, `de`≈L3462)
- Test: `tests/desktop/i18n-completeness.test.ts` (existing — must stay green)

**Interfaces:**
- Produces (consumed by Tasks 3 & 5): the keys `study_btn_stop`, `study_btn_edit`, `study_btn_open_editor`, `study_stop_not_for_me`, `study_stop_outdated`, `study_edit_save`, `study_edit_question`, `study_manage`.

- [ ] **Step 1: Add the 8 keys to each locale**

In each of the 7 locale objects, insert these lines immediately after the existing `lbl_confirm_remove_title:` line (that key exists exactly once per locale, so it is an unambiguous anchor). Use the values for that locale:

**en:**
```ts
    study_btn_stop: "Stop",
    study_btn_edit: "Edit this card",
    study_btn_open_editor: "Open in full editor",
    study_stop_not_for_me: "Not for me",
    study_stop_outdated: "Outdated — remove it",
    study_edit_save: "Save",
    study_edit_question: "Question",
    study_manage: "Manage card",
```
**de:**
```ts
    study_btn_stop: "Stopp",
    study_btn_edit: "Karte bearbeiten",
    study_btn_open_editor: "Im Editor öffnen",
    study_stop_not_for_me: "Nichts für mich",
    study_stop_outdated: "Veraltet — entfernen",
    study_edit_save: "Speichern",
    study_edit_question: "Frage",
    study_manage: "Karte verwalten",
```
**es:**
```ts
    study_btn_stop: "Detener",
    study_btn_edit: "Editar esta tarjeta",
    study_btn_open_editor: "Abrir en el editor",
    study_stop_not_for_me: "No es para mí",
    study_stop_outdated: "Obsoleto: eliminar",
    study_edit_save: "Guardar",
    study_edit_question: "Pregunta",
    study_manage: "Gestionar tarjeta",
```
**fr:**
```ts
    study_btn_stop: "Arrêter",
    study_btn_edit: "Modifier cette carte",
    study_btn_open_editor: "Ouvrir dans l'éditeur",
    study_stop_not_for_me: "Pas pour moi",
    study_stop_outdated: "Obsolète — supprimer",
    study_edit_save: "Enregistrer",
    study_edit_question: "Question",
    study_manage: "Gérer la carte",
```
**pt:**
```ts
    study_btn_stop: "Parar",
    study_btn_edit: "Editar este cartão",
    study_btn_open_editor: "Abrir no editor",
    study_stop_not_for_me: "Não é para mim",
    study_stop_outdated: "Desatualizado — remover",
    study_edit_save: "Salvar",
    study_edit_question: "Pergunta",
    study_manage: "Gerenciar cartão",
```
**zh:**
```ts
    study_btn_stop: "停止",
    study_btn_edit: "编辑此卡片",
    study_btn_open_editor: "在编辑器中打开",
    study_stop_not_for_me: "不适合我",
    study_stop_outdated: "已过时 — 删除",
    study_edit_save: "保存",
    study_edit_question: "问题",
    study_manage: "管理卡片",
```
**ja:**
```ts
    study_btn_stop: "停止",
    study_btn_edit: "このカードを編集",
    study_btn_open_editor: "エディターで開く",
    study_stop_not_for_me: "自分には不要",
    study_stop_outdated: "古い — 削除",
    study_edit_save: "保存",
    study_edit_question: "質問",
    study_manage: "カードを管理",
```

- [ ] **Step 2: Run the completeness suite**

Run: `npm run test -- tests/desktop/i18n-completeness.test.ts`
Expected: PASS. (The "reference locale has every key used" cases won't exercise the new keys until Task 5 uses them, but this proves the additions parse and the packs stay complete.)

- [ ] **Step 3: Commit**

```bash
git add desktop/src/i18n.ts
git commit -m "feat: add study-view card-management i18n keys (7 locales)"
```

---

### Task 3: Study-view markup + styling

Add the controls and a study-view-owned confirm modal to the HTML, and style them. No behavior yet (wired in Task 5) — this task ends with the elements present and the suite still green.

**Files:**
- Modify: `desktop/index.html` (card header ≈L418-424; rating bar ≈L510-531; answer-box ≈L493-498; confirmation modals region ≈L599-624)
- Modify: `desktop/src/styles.css`

**Interfaces:**
- Produces (consumed by Task 5) element IDs: `btn-study-stop`, `study-manage-menu` (+ its buttons `btn-study-manage-stop`, `btn-study-manage-edit`), `btn-card-manage` (the pre-reveal `⋯`), `btn-study-edit`, `btn-study-open-editor`, `study-inline-editor` (+ `study-edit-question`, `study-edit-concept`, `btn-study-edit-save`, `btn-study-edit-cancel`), and the modal `study-confirm-overlay` (+ `study-confirm-title`, `study-confirm-desc`, `study-confirm-impact`, `study-confirm-advanced`, `btn-study-confirm-advanced`, `btn-study-confirm-cancel`, `btn-study-confirm-ok`).

- [ ] **Step 1: Add the pre-reveal manage control to the card header**

In `desktop/index.html`, replace the `card-header` block (≈L418-424) with:

```html
          <div class="card-header">
            <span class="card-progress" id="card-progress">1/10</span>
            <div class="tag-row">
              <span class="badge bloom-badge" id="bloom-badge">Understand (Bloom 2)</span>
              <span class="badge domain-badge" id="domain-badge">git</span>
              <div class="card-manage-wrap">
                <button id="btn-card-manage" class="card-manage-btn" type="button" aria-haspopup="true" aria-expanded="false">⋯</button>
                <div id="study-manage-menu" class="card-manage-menu hidden">
                  <button id="btn-study-manage-edit" class="card-manage-item" type="button">Edit this card</button>
                  <button id="btn-study-manage-stop" class="card-manage-item danger" type="button">Stop</button>
                </div>
              </div>
            </div>
          </div>
```

- [ ] **Step 2: Add the Stop control to the rating bar**

In `desktop/index.html`, inside `rating-bar-container` (≈L511-531), after the closing `</div>` of `rating-buttons`, add:

```html
                <div class="rating-stop-wrap">
                  <button id="btn-study-stop" class="btn stop-btn" type="button">
                    <span class="rating-num">–</span>
                    <span class="rating-label">Stop</span>
                  </button>
                </div>
```

- [ ] **Step 3: Add edit controls + inline editor to the reveal**

In `desktop/index.html`, inside the `answer-box` (after `</div>` closing `reveal-content-list`, ≈L497), add:

```html
                <div class="study-edit-controls">
                  <button id="btn-study-edit" class="btn secondary-btn btn-sm" type="button">Edit this card</button>
                  <button id="btn-study-open-editor" class="btn ghost-btn btn-sm" type="button">Open in full editor →</button>
                </div>
                <div id="study-inline-editor" class="study-inline-editor hidden">
                  <label class="study-edit-label" for="study-edit-question" id="lbl-study-edit-question">Question</label>
                  <textarea id="study-edit-question" class="editor-textarea" rows="2"></textarea>
                  <label class="study-edit-label" for="study-edit-concept" id="lbl-study-edit-concept">Concept</label>
                  <textarea id="study-edit-concept" class="editor-textarea" rows="4"></textarea>
                  <div class="study-inline-editor-actions">
                    <button id="btn-study-edit-cancel" class="btn secondary-btn btn-sm" type="button">Cancel</button>
                    <button id="btn-study-edit-save" class="btn primary-btn btn-sm" type="button">Save</button>
                  </div>
                </div>
```

- [ ] **Step 4: Add the study-view confirm modal**

In `desktop/index.html`, in the `<!-- CONFIRMATION MODALS -->` region (after `#content-modal-overlay`'s closing `</div>`, ≈L624), add a **separate** overlay so it never collides with the Content Editor's modal listeners:

```html
      <div id="study-confirm-overlay" class="modal-overlay">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="study-confirm-title">Stop learning this card?</h3>
          </div>
          <div class="modal-body">
            <p id="study-confirm-desc"></p>
            <div class="modal-impact-section">
              <ul class="modal-impact-list" id="study-confirm-impact"></ul>
            </div>
            <div id="study-confirm-advanced" class="modal-impact-section hidden" style="border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.02);">
              <button id="btn-study-confirm-advanced" class="btn danger-btn btn-sm" type="button">Outdated — remove it</button>
            </div>
          </div>
          <div class="modal-actions">
            <button id="btn-study-confirm-cancel" class="btn secondary-btn btn-sm" type="button">Cancel</button>
            <button id="btn-study-confirm-ok" class="btn primary-btn btn-sm" type="button">Not for me</button>
          </div>
        </div>
      </div>
```

- [ ] **Step 5: Style the new controls**

Append to `desktop/src/styles.css`:

```css
/* In-recall card management (ADR 2026-07-16b) */
.rating-stop-wrap { display: flex; justify-content: center; margin-top: 12px; }
.stop-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; opacity: 0.75;
  background: transparent; border: 1px solid var(--clr-border, rgba(0,0,0,0.15));
  color: var(--clr-again, #ef4444);
}
.stop-btn:hover { opacity: 1; }

.study-edit-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.ghost-btn { background: transparent; border: none; color: var(--clr-accent, #6366f1); }
.study-inline-editor { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.study-edit-label { font-size: 0.8rem; font-weight: 600; opacity: 0.8; }
.study-inline-editor-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }

.card-manage-wrap { position: relative; display: inline-flex; }
.card-manage-btn {
  border: none; background: transparent; cursor: pointer;
  font-size: 1.1rem; line-height: 1; padding: 2px 8px; opacity: 0.6;
}
.card-manage-btn:hover { opacity: 1; }
.card-manage-menu {
  position: absolute; top: 100%; right: 0; z-index: 20; margin-top: 4px;
  display: flex; flex-direction: column; min-width: 160px;
  background: var(--clr-surface, #fff); border: 1px solid var(--clr-border, rgba(0,0,0,0.12));
  border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); overflow: hidden;
}
.card-manage-item { text-align: left; border: none; background: transparent; cursor: pointer; padding: 10px 14px; font-size: 0.9rem; }
.card-manage-item:hover { background: rgba(99,102,241,0.08); }
.card-manage-item.danger { color: var(--clr-again, #ef4444); }
```

Note: if `--clr-surface`/`--clr-border`/`--clr-accent` are not defined project variables, keep the fallbacks (they are the second value in each `var(...)`). Do not invent new CSS variables.

- [ ] **Step 6: Verify the suite is still green (nothing wired yet, but markup must not break existing tests)**

Run: `npm run test -- tests/desktop/`
Expected: PASS (module-boundaries, i18n-completeness, and the new action-builder test).

- [ ] **Step 7: Commit**

```bash
git add desktop/index.html desktop/src/styles.css
git commit -m "feat: add study-view card-management markup and styles"
```

---

### Task 4: `openCardInEditor` entry point in the Content Editor

Expose a single function so "Open in full editor" can focus a specific card by slug. `selectCard` is currently module-internal.

**Files:**
- Modify: `desktop/src/learning-content.ts` (near `loadStudioData` ≈L441 and `selectCard` ≈L548; `cardsList` is the module-level array populated by `loadStudioData`)

**Interfaces:**
- Produces (consumed by Task 5): `export async function openCardInEditor(slug: string): Promise<boolean>` — loads studio data if needed, selects the card, returns `true` if found.

- [ ] **Step 1: Add the exported function**

In `desktop/src/learning-content.ts`, after `selectCard` (≈L569), add:

```ts
/**
 * Focus the editor on a specific card by slug — the "Open in full editor"
 * jump from the study view (ADR 2026-07-16b). Reloads the card list so a card
 * created/edited elsewhere is present, then selects it. Returns false if the
 * slug is not among the learner's cards.
 */
export async function openCardInEditor(slug: string): Promise<boolean> {
  await loadStudioData();
  const card = cardsList.find((c) => c.slug === slug);
  if (!card) return false;
  selectCard(card);
  return true;
}
```

If `cardsList` is not the exact identifier for the loaded array, use whatever `loadStudioData` populates and `refreshCardsList` reads (grep `cardsList` in this file to confirm — it is referenced at the existing `saveCard`/`selectCard` sites).

- [ ] **Step 2: Verify it compiles and boundaries hold**

Run: `npm run test -- tests/desktop/module-boundaries.test.ts`
Expected: PASS (this export adds no new cross-module import into a forbidden layer; `learning-content.ts` already imports `runBridge`).

- [ ] **Step 3: Commit**

```bash
git add desktop/src/learning-content.ts
git commit -m "feat: expose openCardInEditor for study-view jump"
```

---

### Task 5: Wire the study-view controls in `main.ts`

Connect every control to `study-card-actions` + `runBridge`, using the study-view confirm modal, advancing/refreshing appropriately, and guarding against concurrent bridge calls.

**Files:**
- Modify: `desktop/src/main.ts` — add imports; add a wiring block inside the existing `DOMContentLoaded` handler (≈L4255); add helper functions near `submitRating` (≈L4184).

**Interfaces:**
- Consumes from Task 1: `removePreviewCommand`, `removeConfirmCommand`, `deletePreviewCommand`, `deleteConfirmCommand`, `editCommand`, `StudyEditError`.
- Consumes from Task 4: `openCardInEditor`.
- Consumes existing module state: `activeCard` (`BridgeCard` with `.slug`, `.concept`), `activePromptQuestion`, `ratingSubmitInProgress`, `loadNextCard()`, `switchView()`, `t()`, `tf()`.

- [ ] **Step 1: Add imports at the top of `main.ts`**

Add to the existing import section:

```ts
import { openCardInEditor } from "./learning-content.js";
import {
  StudyEditError,
  deleteConfirmCommand,
  deletePreviewCommand,
  editCommand,
  removeConfirmCommand,
  removePreviewCommand,
} from "./study-card-actions.js";
```
(If `main.ts` already imports from `./learning-content.js`, add `openCardInEditor` to that existing import list instead of duplicating.)

- [ ] **Step 2: Add the management helpers near `submitRating`**

Insert after `submitRating` (≈L4209):

```ts
// ── IN-RECALL CARD MANAGEMENT (ADR 2026-07-16b) ─────────────────────────────
type ImpactPreview = {
  review_logs?: number;
  cards?: number;
  session_steps?: number;
  agent_skills?: number;
};

let cardManageInProgress = false;

function renderImpactList(el: HTMLElement, impact: ImpactPreview): void {
  el.innerHTML = "";
  const add = (text: string) => {
    const li = document.createElement("li");
    li.textContent = `• ${text}`;
    el.appendChild(li);
  };
  if (impact.cards !== undefined) add(tf("lbl_impact_cards", { count: impact.cards }));
  if (impact.review_logs !== undefined) add(tf("lbl_impact_reviews", { count: impact.review_logs }));
  if (impact.session_steps !== undefined) add(tf("lbl_impact_steps", { count: impact.session_steps }));
  if (impact.agent_skills !== undefined) add(tf("lbl_impact_skills", { count: impact.agent_skills }));
}

function hideStudyConfirm(): void {
  document.getElementById("study-confirm-overlay")!.classList.remove("active");
}

/** Open the study confirm modal for the "Not for me" (delete-card) path, with
 *  an advanced escalation to the permanent "Outdated — remove it" delete. */
async function openStopModal(): Promise<void> {
  if (!activeCard || cardManageInProgress) return;
  const slug = activeCard.slug;
  closeManageMenu();
  try {
    const preview = await runBridge<{ impact: ImpactPreview }>(
      removePreviewCommand(slug).cmd,
      removePreviewCommand(slug).args,
    );
    document.getElementById("study-confirm-title")!.textContent = t("lbl_confirm_remove_title");
    document.getElementById("study-confirm-desc")!.textContent = t("lbl_confirm_remove_desc");
    renderImpactList(document.getElementById("study-confirm-impact")!, preview.impact);
    document.getElementById("study-confirm-advanced")!.classList.remove("hidden");
    const ok = document.getElementById("btn-study-confirm-ok")!;
    ok.textContent = t("study_stop_not_for_me");
    document.getElementById("btn-study-confirm-advanced")!.textContent = t("study_stop_outdated");
    studyConfirmAction = "remove";
    studyConfirmSlug = slug;
    document.getElementById("study-confirm-overlay")!.classList.add("active");
  } catch (err) {
    console.error("Stop preview failed:", err);
  }
}

let studyConfirmAction: "remove" | "delete" | null = null;
let studyConfirmSlug: string | null = null;

/** Escalate to the permanent token delete: re-preview with full impact. */
async function escalateToOutdated(): Promise<void> {
  if (!studyConfirmSlug) return;
  const slug = studyConfirmSlug;
  try {
    const preview = await runBridge<{ impact: ImpactPreview }>(
      deletePreviewCommand(slug).cmd,
      deletePreviewCommand(slug).args,
    );
    document.getElementById("study-confirm-title")!.textContent = t("lbl_confirm_delete_title");
    document.getElementById("study-confirm-desc")!.textContent = t("lbl_confirm_delete_desc");
    renderImpactList(document.getElementById("study-confirm-impact")!, preview.impact);
    document.getElementById("study-confirm-advanced")!.classList.add("hidden");
    document.getElementById("btn-study-confirm-ok")!.textContent = t("study_stop_outdated");
    studyConfirmAction = "delete";
  } catch (err) {
    console.error("Outdated preview failed:", err);
  }
}

/** Confirm button: run the selected destructive action, then advance. */
async function confirmStudyStop(): Promise<void> {
  if (!studyConfirmSlug || !studyConfirmAction || cardManageInProgress) return;
  cardManageInProgress = true;
  const slug = studyConfirmSlug;
  const action = studyConfirmAction;
  try {
    const call = action === "remove" ? removeConfirmCommand(slug) : deleteConfirmCommand(slug);
    await runBridge(call.cmd, call.args);
    hideStudyConfirm();
    studyConfirmAction = null;
    studyConfirmSlug = null;
    await loadNextCard();
  } catch (err) {
    console.error("Stop action failed:", err);
  } finally {
    cardManageInProgress = false;
  }
}

// ── inline edit ──
function openInlineEditor(): void {
  if (!activeCard) return;
  closeManageMenu();
  (document.getElementById("study-edit-question") as HTMLTextAreaElement).value = activePromptQuestion;
  (document.getElementById("study-edit-concept") as HTMLTextAreaElement).value = activeCard.concept;
  document.getElementById("study-inline-editor")!.classList.remove("hidden");
}
function closeInlineEditor(): void {
  document.getElementById("study-inline-editor")!.classList.add("hidden");
}
async function saveInlineEdit(): Promise<void> {
  if (!activeCard || cardManageInProgress) return;
  const question = (document.getElementById("study-edit-question") as HTMLTextAreaElement).value;
  const concept = (document.getElementById("study-edit-concept") as HTMLTextAreaElement).value;
  let call: { cmd: string; args: string[] };
  try {
    call = editCommand({ slug: activeCard.slug, question, concept });
  } catch (err) {
    if (err instanceof StudyEditError) {
      alert(err.reason === "concept-required" ? t("lbl_err_concept_required") : t("study_edit_question"));
      return;
    }
    throw err;
  }
  cardManageInProgress = true;
  try {
    await runBridge(call.cmd, call.args);
    // Reflect the edit in place (no full re-render — feedback stays put).
    activeCard.concept = concept.trim();
    activePromptQuestion = question.trim();
    document.getElementById("question-text")!.textContent = activePromptQuestion;
    const conceptVal = document
      .getElementById("reveal-content-list")!
      .querySelector(".reveal-item .reveal-val");
    if (conceptVal) conceptVal.textContent = activeCard.concept;
    closeInlineEditor();
    alert(t("lbl_card_saved_toast"));
  } catch (err) {
    console.error("Inline edit failed:", err);
    alert(err instanceof Error ? err.message : String(err));
  } finally {
    cardManageInProgress = false;
  }
}

// ── pre-reveal manage menu ──
function toggleManageMenu(): void {
  const menu = document.getElementById("study-manage-menu")!;
  const btn = document.getElementById("btn-card-manage")!;
  const open = menu.classList.toggle("hidden") === false;
  btn.setAttribute("aria-expanded", String(open));
}
function closeManageMenu(): void {
  document.getElementById("study-manage-menu")?.classList.add("hidden");
  document.getElementById("btn-card-manage")?.setAttribute("aria-expanded", "false");
}

async function jumpToFullEditor(): Promise<void> {
  if (!activeCard) return;
  const slug = activeCard.slug;
  closeManageMenu();
  switchView("learning-content-view");
  const found = await openCardInEditor(slug);
  if (!found) console.warn("Card not found in editor:", slug);
}
```

- [ ] **Step 3: Bind the controls inside `DOMContentLoaded`**

Add inside the existing `window.addEventListener("DOMContentLoaded", ...)` block (after the rating-button binding ≈L4565):

```ts
  // In-recall card management (ADR 2026-07-16b)
  document.getElementById("btn-study-stop")!.addEventListener("click", () => void openStopModal());
  document.getElementById("btn-study-edit")!.addEventListener("click", () => openInlineEditor());
  document.getElementById("btn-study-open-editor")!.addEventListener("click", () => void jumpToFullEditor());
  document.getElementById("btn-study-edit-save")!.addEventListener("click", () => void saveInlineEdit());
  document.getElementById("btn-study-edit-cancel")!.addEventListener("click", () => closeInlineEditor());

  document.getElementById("btn-card-manage")!.addEventListener("click", (e) => { e.stopPropagation(); toggleManageMenu(); });
  document.getElementById("btn-study-manage-edit")!.addEventListener("click", () => openInlineEditor());
  document.getElementById("btn-study-manage-stop")!.addEventListener("click", () => void openStopModal());
  document.addEventListener("click", () => closeManageMenu());

  document.getElementById("btn-study-confirm-advanced")!.addEventListener("click", () => void escalateToOutdated());
  document.getElementById("btn-study-confirm-ok")!.addEventListener("click", () => void confirmStudyStop());
  document.getElementById("btn-study-confirm-cancel")!.addEventListener("click", () => hideStudyConfirm());
```

- [ ] **Step 4: Localize the new static labels in `initializeTranslations`**

Find `initializeTranslations` (the function that sets `textContent` from `t(...)`, near the modal-translations block ≈L633) and add:

```ts
  const btnStudyStopLbl = document.querySelector("#btn-study-stop .rating-label");
  if (btnStudyStopLbl) btnStudyStopLbl.textContent = t("study_btn_stop");
  const setText = (id: string, key: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };
  setText("btn-study-edit", "study_btn_edit");
  setText("btn-study-manage-edit", "study_btn_edit");
  setText("btn-study-manage-stop", "study_btn_stop");
  setText("btn-study-open-editor", "study_btn_open_editor");
  setText("btn-study-edit-save", "study_edit_save");
  setText("btn-study-edit-cancel", "lbl_cancel_action");
  setText("lbl-study-edit-question", "study_edit_question");
  setText("lbl-study-edit-concept", "concept");
  setText("btn-study-confirm-cancel", "lbl_cancel_action");
  const manageBtn = document.getElementById("btn-card-manage");
  if (manageBtn) manageBtn.setAttribute("aria-label", t("study_manage"));
```

- [ ] **Step 5: Reset the inline editor + manage menu on card change**

In `loadNextCard` (≈L3744, the "Reset study screen elements" block), add:

```ts
    document.getElementById("study-inline-editor")?.classList.add("hidden");
    document.getElementById("study-manage-menu")?.classList.add("hidden");
```

- [ ] **Step 6: Typecheck + lint + full desktop tests**

Run: `npm run build`
Expected: builds without TypeScript errors.

Run: `npm run lint`
Expected: no Biome errors in changed files (run `npm run format` if formatting differs).

Run: `npm run test -- tests/desktop/`
Expected: PASS — critically, the "reference locale has every t()/tf() key used under desktop/src" case now sees the new `study_*` keys and confirms all 7 locales carry them.

- [ ] **Step 7: Commit**

```bash
git add desktop/src/main.ts desktop/src/i18n.ts
git commit -m "feat: wire in-recall stop, edit, and remove controls"
```

---

### Task 6: End-to-end verification with the test user

Prove the exact command sequences the UI issues produce the right database effects, against a throwaway test user so Thomas's own cards are untouched. Then run the whole suite.

**Files:** none (verification only).

- [ ] **Step 1: Seed a disposable test user with two tokens+cards**

```bash
npm run build
E2E_USER=test-user-recall-mgmt
node dist/cli/index.js bridge add-token --user "$E2E_USER" --slug e2e-keep-01 --concept "Keepable concept" --question "Keep question?" --domain e2e --bloom 2
node dist/cli/index.js bridge add-token --user "$E2E_USER" --slug e2e-drop-01 --concept "Droppable concept" --question "Drop question?" --domain e2e --bloom 2
node dist/cli/index.js bridge get-reviews --user "$E2E_USER"
```
Expected: `get-reviews` lists both `e2e-keep-01` and `e2e-drop-01` as cards with matching slugs. (Use `node dist/cli/index.js` — the exact invocation the desktop Tauri sidecar uses; confirm the CLI entry path with `ls dist/cli/index.js` first.)

- [ ] **Step 2: Exercise inline edit (personal-card-update, partial)**

```bash
node dist/cli/index.js bridge personal-card-update --user "$E2E_USER" --slug e2e-keep-01 --question "Edited question?" --concept "Edited concept"
node dist/cli/index.js bridge get-review --user "$E2E_USER" --no-dynamic-question
```
Expected: the token's `question`/`concept` are updated **and** `domain` is still `e2e`, `bloomLevel` still `2` (partial update preserved the untouched fields — the Global Constraint in action).

- [ ] **Step 3: Exercise "Not for me" (personal-card-remove: preview then confirm)**

```bash
node dist/cli/index.js bridge personal-card-remove --user "$E2E_USER" --slug e2e-keep-01
node dist/cli/index.js bridge personal-card-remove --user "$E2E_USER" --slug e2e-keep-01 --confirm
node dist/cli/index.js bridge get-reviews --user "$E2E_USER"
```
Expected: first call returns `preview: true` with an `impact.review_logs` number; second returns `deletedCard`; `get-reviews` no longer lists `e2e-keep-01`. Then confirm the token still exists globally (delete-card is per-learner): `node dist/cli/index.js token show --slug e2e-keep-01` (or `bridge get-token`/equivalent) still resolves.

- [ ] **Step 4: Exercise "Outdated — remove it" (personal-card-delete: preview then confirm)**

```bash
node dist/cli/index.js bridge personal-card-delete --slug e2e-drop-01
node dist/cli/index.js bridge personal-card-delete --slug e2e-drop-01 --confirm
node dist/cli/index.js bridge get-reviews --user "$E2E_USER"
```
Expected: first call returns `preview: true` with full impact (`cards`, `review_logs`, `session_steps`, `agent_skills`); second returns `deletedToken`; the token is gone globally.

- [ ] **Step 5: Launch the desktop app and click through the real UI**

Use the project run tooling to launch the desktop app (see the `/run` skill / `desktop/README.md`). In a live session: reveal a card, confirm the `– Stop` button shows the two-choice modal with an impact list; confirm **Not for me** advances to the next card; confirm **Edit this card** opens the inline editor, saves, and the question/concept update in place; confirm the pre-reveal `⋯` menu opens Stop/Edit; confirm **Open in full editor →** lands on the card in the Learning Content view. Capture a screenshot of the revealed card showing the new controls.

If the Tauri app cannot be launched headlessly in this environment, record that Steps 1–4 (the exact bridge contract the UI calls) passed and note the UI click-through as the remaining manual check for review.

- [ ] **Step 6: Clean up the test user's residue and run the full suite**

```bash
# remove any leftover e2e tokens (ignore "not found")
node dist/cli/index.js bridge personal-card-delete --slug e2e-keep-01 --confirm || true
npm run test
npm run lint
```
Expected: full Vitest suite green (note the known environmental baseline of 3–4 failures only when live `zam` processes are running — see the "local CLI test failures" memory; isolate with a clean `ZAM_CONFIG_PATH` if needed and compare against `main`). Lint clean.

- [ ] **Step 7: Final commit (if cleanup/verification produced any doc notes)**

```bash
git add -A
git commit -m "test: e2e-verify in-recall card management against a test user" --allow-empty
```

---

### Task 7: Push and open the PR (no merge)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/recall-card-management
```

- [ ] **Step 2: Open the PR against `main`**

```bash
gh pr create --base main --title "feat: in-recall card management (stop, fix, remove)" --body "$(cat <<'EOF'
Implements the design in docs/adr/2026-07-16b-in-recall-card-management.md.

Adds three controls to the desktop Recall Studio study view:
- **– Stop** (post-reveal, beside the 1–4 ratings; also in a pre-reveal ⋯ menu) → a two-choice modal: **Not for me** (`personal-card-remove`, per-learner) or **Outdated — remove it** (`personal-card-delete`, permanent, with impact preview).
- **Edit this card** → inline question/concept edit via `personal-card-update` (partial — preserves untouched fields).
- **Open in full editor →** → jumps to the Learning Content Studio focused on the card (pauses the session).

No kernel/bridge/MCP changes — pure UI wiring over existing bridge commands. New logic is isolated in a framework-free, unit-tested module (`study-card-actions.ts`). New i18n keys added across all 7 locales.

Verified end-to-end against a disposable test user (edit / remove-card / delete-token preview+confirm). **Do not merge** — pending review by Fable 5 or GPT-5.6 Sol.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Do **not** merge.

---

## Self-Review

**Spec coverage** (against ADR 2026-07-16b):
- `– Stop` beside ratings + two-choice popover → Tasks 3 (markup), 5 (`openStopModal`, advanced escalation). ✓
- "Not for me" = `personal-card-remove` → Tasks 1, 5, 6-Step3. ✓
- "Outdated — remove it" = permanent `personal-card-delete` with impact preview → Tasks 1, 5 (`escalateToOutdated`), 6-Step4. ✓
- Inline edit (question + concept) = `personal-card-update` partial → Tasks 1, 5 (`saveInlineEdit`), 6-Step2. ✓
- "Open in full editor →" jump, pausing session → Tasks 4, 5 (`jumpToFullEditor`). ✓
- Post-reveal primary + pre-reveal `⋯` escape → Task 3 (both locations), Task 5 (bindings). ✓
- Advance after stop / stay-and-refresh after edit → Task 5 (`confirmStudyStop` → `loadNextCard`; `saveInlineEdit` in-place update). ✓
- Concurrency guard → `cardManageInProgress` in Task 5. ✓
- i18n en+de+5 packs → Task 2. ✓
- Testing (unit + e2e with test user) → Tasks 1, 6. ✓
- MCP Apps panel explicitly out of scope → not planned (matches ADR). ✓

**Placeholder scan:** No TBD/TODO; every code step carries full code; the one conditional ("if `cardsList` isn't the identifier…") points to a concrete grep, not a vague instruction.

**Type consistency:** `BridgeCall = {cmd, args}` used consistently; `StudyEditError.reason` values match between Task 1 definition and Task 5 use (`"concept-required"`/`"question-required"`); element IDs declared in Task 3 match those queried in Task 5; `openCardInEditor` signature matches between Task 4 and Task 5.

**Note for the implementer:** verify the CLI entry path (`dist/cli/index.js`) and the desktop bridge invocation before Task 6; if the desktop sidecar shells a different binary, use that. The `renderImpactList` uses `innerHTML=""` only to clear, then `createElement`/`textContent` for content — consistent with the security constraint.
