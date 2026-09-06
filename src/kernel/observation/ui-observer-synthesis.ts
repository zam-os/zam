/**
 * Map persisted UI observer reports into session synthesis candidates.
 */

import type { Token } from "../models/token.js";
import type { Rating } from "../scheduler/fsrs.js";
import type { ObservationRating } from "./analyzer.js";
import type {
  SessionSynthesisCandidate,
  SynthesisConfidence,
} from "./session-synthesis.js";
import type { UiObservationReport } from "./ui-observer.js";

const MIN_UI_CONFIDENCE = 0.6;

function kindToRating(kind: UiObservationReport["kind"]): Rating | null {
  switch (kind) {
    case "step-completed":
      return 4;
    case "progress":
      return 3;
    case "error":
    case "help-seeking":
      return 2;
    default:
      return null;
  }
}

function toSynthesisConfidence(confidence: number): SynthesisConfidence {
  return confidence >= 0.85 ? "high" : "medium";
}

function confidenceRank(confidence: SynthesisConfidence): number {
  return confidence === "high" ? 2 : 1;
}

function buildEvidence(
  report: UiObservationReport,
): ObservationRating["evidence"] {
  return {
    matchedCommands: report.actions.length,
    helpSeeking: report.kind === "help-seeking",
    errorCount: report.kind === "error" ? 1 : 0,
    selfCorrections: 0,
    medianGapMs: null,
    thinkingGapMs: null,
  };
}

function matchedTexts(report: UiObservationReport): string[] {
  const texts = [report.summary];
  for (const action of report.actions) {
    const label = [action.type, action.target, action.result]
      .filter(Boolean)
      .join(" ");
    if (label) texts.push(label);
  }
  return texts;
}

export function buildUiSynthesisCandidates(
  reports: UiObservationReport[],
  tokens: Map<string, Token>,
  applied: Set<string>,
  minConfidence: SynthesisConfidence,
): {
  candidates: SessionSynthesisCandidate[];
  skippedLowConfidence: number;
} {
  const minRank = confidenceRank(minConfidence);
  const bestBySlug = new Map<
    string,
    {
      token: Token;
      inferredRating: Rating | null;
      confidence: SynthesisConfidence;
      evidence: ObservationRating["evidence"];
      matchedCommandTexts: string[];
      reportConfidence: number;
    }
  >();
  let skippedLowConfidence = 0;

  for (const report of reports) {
    if (report.confidence < MIN_UI_CONFIDENCE) continue;

    const fallbackRating = kindToRating(report.kind);
    const candidates =
      report.candidateTokens.length > 0
        ? report.candidateTokens.map((candidate) => ({
            slug: candidate.slug,
            confidence: candidate.confidence,
            rating: fallbackRating,
          }))
        : [];

    for (const candidate of candidates) {
      const token = tokens.get(candidate.slug);
      if (!token || applied.has(token.id)) continue;

      const synthesisConfidence = toSynthesisConfidence(candidate.confidence);
      if (confidenceRank(synthesisConfidence) < minRank) {
        skippedLowConfidence++;
        continue;
      }

      const inferredRating = candidate.rating;
      const existing = bestBySlug.get(candidate.slug);
      if (existing && existing.reportConfidence >= candidate.confidence) {
        continue;
      }

      bestBySlug.set(candidate.slug, {
        token,
        inferredRating,
        confidence: synthesisConfidence,
        evidence: buildEvidence(report),
        matchedCommandTexts: matchedTexts(report),
        reportConfidence: candidate.confidence,
      });
    }
  }

  const candidates = [...bestBySlug.values()]
    .sort((left, right) => right.reportConfidence - left.reportConfidence)
    .map((entry) => ({
      tokenId: entry.token.id,
      tokenSlug: entry.token.slug,
      concept: entry.token.concept,
      domain: entry.token.domain,
      inferredRating: entry.inferredRating,
      confidence: entry.confidence,
      evidence: entry.evidence,
      matchedCommandTexts: entry.matchedCommandTexts,
      evidenceKey: entry.matchedCommandTexts
        .map((text) => text.trim())
        .filter(Boolean)
        .join("\n"),
    }));

  return { candidates, skippedLowConfidence };
}

export function uiObservationTimeSpan(
  reports: UiObservationReport[],
): { start: string; end: string; durationMs: number } | null {
  if (reports.length === 0) return null;

  const start = reports[0].observedFrom;
  const end = reports[reports.length - 1].observedTo;
  const durationMs = Math.max(0, Date.parse(end) - Date.parse(start));

  return { start, end, durationMs };
}
