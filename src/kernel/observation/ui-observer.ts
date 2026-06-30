/**
 * Provider-neutral protocol for the native UI observer sidecar.
 *
 * Reports are evidence only. They must not update cards or FSRS state without
 * passing through confirmed session synthesis.
 */

export const UI_OBSERVATION_PROTOCOL_VERSION = 1 as const;

export type UiObservationKind =
  | "progress"
  | "step-completed"
  | "error"
  | "help-seeking"
  | "uncertain"
  | "privacy-pause"
  | "heartbeat";

export type UiActionType =
  | "click"
  | "shortcut"
  | "typing"
  | "scroll"
  | "window-change";

export type UiEvidenceType = "uia" | "keyframe" | "clip" | "window";

export interface UiApplicationContext {
  processName: string;
  processId?: number;
  windowTitle?: string;
}

export interface UiObservedAction {
  type: UiActionType;
  target?: string;
  result?: string;
}

export interface UiEvidenceRef {
  type: UiEvidenceType;
  ref: string;
  redacted: boolean;
}

export interface UiCandidateToken {
  slug: string;
  confidence: number;
  rationale: string;
}

export interface UiObservationReport {
  version: typeof UI_OBSERVATION_PROTOCOL_VERSION;
  sessionId: string;
  sequence: number;
  observedFrom: string;
  observedTo: string;
  kind: UiObservationKind;
  application: UiApplicationContext;
  summary: string;
  actions: UiObservedAction[];
  evidence: UiEvidenceRef[];
  candidateTokens: UiCandidateToken[];
  confidence: number;
}

const OBSERVATION_KINDS = new Set<UiObservationKind>([
  "progress",
  "step-completed",
  "error",
  "help-seeking",
  "uncertain",
  "privacy-pause",
  "heartbeat",
]);

const ACTION_TYPES = new Set<UiActionType>([
  "click",
  "shortcut",
  "typing",
  "scroll",
  "window-change",
]);

const EVIDENCE_TYPES = new Set<UiEvidenceType>([
  "uia",
  "keyframe",
  "clip",
  "window",
]);

export function isUiObservationReport(
  value: unknown,
): value is UiObservationReport {
  if (!isRecord(value)) return false;
  if (value.version !== UI_OBSERVATION_PROTOCOL_VERSION) return false;
  if (!isNonEmptyString(value.sessionId)) return false;
  if (!isNonNegativeInteger(value.sequence)) return false;
  if (!isNonEmptyString(value.observedFrom)) return false;
  if (!isNonEmptyString(value.observedTo)) return false;
  if (
    typeof value.kind !== "string" ||
    !OBSERVATION_KINDS.has(value.kind as UiObservationKind)
  ) {
    return false;
  }
  if (!isApplication(value.application)) return false;
  if (!isNonEmptyString(value.summary)) return false;
  if (!Array.isArray(value.actions) || !value.actions.every(isObservedAction)) {
    return false;
  }
  if (!Array.isArray(value.evidence) || !value.evidence.every(isEvidenceRef)) {
    return false;
  }
  if (
    !Array.isArray(value.candidateTokens) ||
    !value.candidateTokens.every(isCandidateToken)
  ) {
    return false;
  }
  return isConfidence(value.confidence);
}

/** Parse report JSONL and skip malformed or unsupported records. */
export function parseUiObservationLog(jsonl: string): UiObservationReport[] {
  const reports: UiObservationReport[] = [];

  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const value: unknown = JSON.parse(trimmed);
      if (isUiObservationReport(value)) {
        reports.push(value);
      }
    } catch {
      // A partially written final line must not break session recovery.
    }
  }

  return reports.sort((left, right) => left.sequence - right.sequence);
}

function isApplication(value: unknown): value is UiApplicationContext {
  if (!isRecord(value) || !isNonEmptyString(value.processName)) return false;
  if (value.processId !== undefined && !isNonNegativeInteger(value.processId)) {
    return false;
  }
  return (
    value.windowTitle === undefined || typeof value.windowTitle === "string"
  );
}

function isObservedAction(value: unknown): value is UiObservedAction {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (!ACTION_TYPES.has(value.type as UiActionType)) return false;
  if (value.target !== undefined && typeof value.target !== "string") {
    return false;
  }
  return value.result === undefined || typeof value.result === "string";
}

function isEvidenceRef(value: unknown): value is UiEvidenceRef {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  return (
    EVIDENCE_TYPES.has(value.type as UiEvidenceType) &&
    isNonEmptyString(value.ref) &&
    typeof value.redacted === "boolean"
  );
}

function isCandidateToken(value: unknown): value is UiCandidateToken {
  return (
    isRecord(value) &&
    isNonEmptyString(value.slug) &&
    isConfidence(value.confidence) &&
    isNonEmptyString(value.rationale)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isConfidence(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}
