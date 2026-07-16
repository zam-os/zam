/**
 * Pure command builders for the study-view card-management controls
 * (ADR 2026-07-16b). Framework-free by design: no DOM, no Tauri, no imports —
 * the same discipline as bridge-transport.ts, so it is unit-testable in
 * isolation and its output IS the contract the e2e walkthrough exercises.
 *
 * All three underlying bridge commands (personal-card-remove /-delete /-update)
 * are slug-keyed. The two destructive commands implement a preview -> confirm
 * handshake; their confirm step is the same command plus --confirm.
 */
export type BridgeCall = { cmd: string; args: string[] };
export type StudyRating = 1 | 2 | 3 | 4;

export interface RatingShortcutContext {
  editableTarget: boolean;
  revealed: boolean;
  dialogOpen: boolean;
  editorOpen: boolean;
  actionInProgress: boolean;
}

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

/**
 * Resolve a 1-4 keyboard shortcut only when the study view can safely accept a
 * rating. Keeping this decision pure makes the destructive/navigation guard
 * testable without a browser DOM.
 */
export function ratingShortcutForKey(
  key: string,
  context: RatingShortcutContext,
): StudyRating | null {
  if (
    context.editableTarget ||
    !context.revealed ||
    context.dialogOpen ||
    context.editorOpen ||
    context.actionInProgress
  ) {
    return null;
  }
  if (key === "1" || key === "2" || key === "3" || key === "4") {
    return Number(key) as StudyRating;
  }
  return null;
}
