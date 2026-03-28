/**
 * Skill Discovery — identifies recurring non-standard command patterns
 * across multiple sessions and proposes them as minimal reusable skills.
 *
 * The key insight from Increment 2: "The human's demonstrated competence
 * is the gate for automation — not the other way around." A pattern must
 * appear consistently across sessions before being proposed as a skill.
 *
 * Pure functions — no DB access. Callers provide command records and
 * existing skills; this module returns proposed skills.
 */

import type { CommandRecord } from "./analyzer.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CommandSequence {
  /** The ordered command prefixes forming the pattern (e.g., ["git checkout", "npm install", "npm run build"]) */
  steps: string[];
  /** How many sessions contained this sequence */
  sessionCount: number;
  /** Total occurrences across all sessions */
  totalOccurrences: number;
  /** Example full commands from the most recent occurrence */
  examples: string[];
}

export interface SkillProposal {
  /** Suggested slug for the skill */
  slug: string;
  /** Human-readable description of what the pattern does */
  description: string;
  /** The command steps forming the skill */
  steps: string[];
  /** How many sessions demonstrated this pattern */
  sessionCount: number;
  /** Confidence that this is a real, repeatable skill */
  confidence: "high" | "medium" | "low";
  /** Example commands from actual usage */
  examples: string[];
}

export interface DiscoveryOptions {
  /** Minimum number of sessions a pattern must appear in (default: 2) */
  minSessions?: number;
  /** Minimum sequence length to consider (default: 2) */
  minSequenceLength?: number;
  /** Maximum sequence length to consider (default: 5) */
  maxSequenceLength?: number;
  /** Existing skill slugs to exclude from proposals */
  existingSkillSlugs?: string[];
}

// ── Discovery ────────────────────────────────────────────────────────────────

/**
 * Discover recurring command patterns across multiple sessions.
 *
 * Takes a map of session ID → command records, finds command sequences
 * that appear in multiple sessions, and proposes them as skills.
 *
 * @param sessionCommands - Map of session ID to that session's commands
 * @param options - Discovery configuration
 * @returns Array of skill proposals, sorted by confidence then session count
 */
export function discoverSkills(
  sessionCommands: Map<string, CommandRecord[]>,
  options: DiscoveryOptions = {},
): SkillProposal[] {
  const minSessions = options.minSessions ?? 2;
  const minLen = options.minSequenceLength ?? 2;
  const maxLen = options.maxSequenceLength ?? 5;
  const existing = new Set(options.existingSkillSlugs ?? []);

  // Step 1: Extract normalized command sequences from each session
  const sessionSequences = new Map<string, string[][]>();
  for (const [sessionId, commands] of sessionCommands) {
    const sequences = extractSequences(commands, minLen, maxLen);
    if (sequences.length > 0) {
      sessionSequences.set(sessionId, sequences);
    }
  }

  // Step 2: Count how many sessions contain each unique sequence
  const sequenceIndex = new Map<string, CommandSequence>();

  for (const [, sequences] of sessionSequences) {
    // Deduplicate within a session — count each sequence once per session
    const seen = new Set<string>();
    for (const seq of sequences) {
      const key = seq.join(" → ");
      if (seen.has(key)) continue;
      seen.add(key);

      const entry = sequenceIndex.get(key);
      if (entry) {
        entry.sessionCount++;
        entry.totalOccurrences++;
      } else {
        sequenceIndex.set(key, {
          steps: seq,
          sessionCount: 1,
          totalOccurrences: 1,
          examples: [],
        });
      }
    }
  }

  // Step 3: Collect examples from the most recent session for qualifying sequences
  const lastSessionId = [...sessionCommands.keys()].pop();
  if (lastSessionId) {
    const lastCommands = sessionCommands.get(lastSessionId)!;
    for (const [key, entry] of sequenceIndex) {
      if (entry.sessionCount >= minSessions) {
        entry.examples = findExamplesForSequence(lastCommands, entry.steps);
      }
    }
  }

  // Step 4: Filter to patterns that appear in enough sessions
  const candidates = [...sequenceIndex.values()].filter(
    (s) => s.sessionCount >= minSessions,
  );

  // Step 5: Remove subsequences of longer patterns (prefer maximal patterns)
  const pruned = removeSubsequences(candidates);

  // Step 6: Convert to skill proposals
  const proposals: SkillProposal[] = [];
  for (const seq of pruned) {
    const slug = generateSlug(seq.steps);

    // Skip if this skill already exists
    if (existing.has(slug)) continue;

    proposals.push({
      slug,
      description: describeSequence(seq.steps),
      steps: seq.steps,
      sessionCount: seq.sessionCount,
      confidence: seq.sessionCount >= 4 ? "high" : seq.sessionCount >= 3 ? "medium" : "low",
      examples: seq.examples,
    });
  }

  // Sort: high confidence first, then by session count
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  proposals.sort((a, b) => {
    const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confDiff !== 0) return confDiff;
    return b.sessionCount - a.sessionCount;
  });

  return proposals;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a command to its tool + subcommand prefix.
 * "git checkout -b feat/foo" → "git checkout"
 * "npm run build" → "npm run build"
 * "docker compose up -d" → "docker compose up"
 */
function normalizeCommand(command: string): string {
  const parts = command.trim().split(/\s+/);

  // Known multi-word tools
  const multiWord = ["docker compose", "npm run", "npx", "git"];
  const lower = command.toLowerCase();

  for (const mw of multiWord) {
    if (lower.startsWith(mw) && parts.length >= mw.split(" ").length + 1) {
      return parts.slice(0, mw.split(" ").length + 1).join(" ").toLowerCase();
    }
  }

  // Default: first two words
  return parts.slice(0, Math.min(2, parts.length)).join(" ").toLowerCase();
}

/**
 * Extract all command subsequences of length minLen..maxLen from a session.
 * Uses normalized command prefixes for comparison.
 */
function extractSequences(
  commands: CommandRecord[],
  minLen: number,
  maxLen: number,
): string[][] {
  // Filter out trivial commands
  const filtered = commands.filter((c) => {
    const lower = c.command.toLowerCase().trim();
    return (
      lower.length > 0 &&
      !lower.startsWith("cd ") &&
      lower !== "cd" &&
      lower !== "ls" &&
      lower !== "pwd" &&
      lower !== "clear" &&
      lower !== "exit" &&
      !lower.startsWith("echo ")
    );
  });

  const normalized = filtered.map((c) => normalizeCommand(c.command));
  const sequences: string[][] = [];

  for (let len = minLen; len <= maxLen; len++) {
    for (let i = 0; i <= normalized.length - len; i++) {
      const seq = normalized.slice(i, i + len);
      // Only include if at least 2 distinct commands (not just "git commit" repeated)
      if (new Set(seq).size >= 2) {
        sequences.push(seq);
      }
    }
  }

  return sequences;
}

/**
 * Find example full commands for a given normalized sequence in a command list.
 */
function findExamplesForSequence(
  commands: CommandRecord[],
  steps: string[],
): string[] {
  const normalized = commands.map((c) => ({
    norm: normalizeCommand(c.command),
    full: c.command,
  }));

  for (let i = 0; i <= normalized.length - steps.length; i++) {
    let match = true;
    for (let j = 0; j < steps.length; j++) {
      if (normalized[i + j].norm !== steps[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return normalized.slice(i, i + steps.length).map((n) => n.full);
    }
  }

  return [];
}

/**
 * Remove sequences that are strict subsequences of longer qualifying sequences.
 */
function removeSubsequences(candidates: CommandSequence[]): CommandSequence[] {
  // Sort by length descending so we check long sequences first
  const sorted = [...candidates].sort((a, b) => b.steps.length - a.steps.length);
  const result: CommandSequence[] = [];

  for (const candidate of sorted) {
    const key = candidate.steps.join(" → ");
    const isSubsequence = result.some((longer) => {
      const longerKey = longer.steps.join(" → ");
      return longerKey.includes(key) && longerKey !== key;
    });

    if (!isSubsequence) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Generate a slug from command steps.
 * ["git checkout", "npm install", "npm run build"] → "checkout-install-build"
 */
function generateSlug(steps: string[]): string {
  return steps
    .map((s) => {
      const parts = s.split(/\s+/);
      return parts[parts.length - 1]; // last word of each step
    })
    .join("-");
}

/**
 * Generate a human-readable description of what a command sequence does.
 */
function describeSequence(steps: string[]): string {
  return `Recurring pattern: ${steps.join(" → ")}`;
}
