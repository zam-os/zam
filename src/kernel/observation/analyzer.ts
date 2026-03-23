/**
 * Monitor log analyzer — maps observed shell commands to token ratings.
 *
 * Pure functions, no DB or filesystem access. Takes parsed command records
 * and a token-to-pattern mapping, returns ratings with evidence.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface MonitorEvent {
  type: "command_start" | "command_end" | "monitor_meta";
  ts: string;
  seq?: number;
  pid?: number;
  command?: string;
  cwd?: string;
  exit_code?: number;
  event?: "start" | "stop";
  session_id?: string;
  shell?: string;
}

export interface CommandRecord {
  seq: number;
  pid: number;
  command: string;
  cwd: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
}

export interface TokenPattern {
  slug: string;
  patterns: string[]; // command prefixes or regex strings
}

export interface ObservationRating {
  tokenSlug: string;
  rating: 1 | 2 | 3 | 4 | null;
  confidence: "high" | "medium" | "low";
  evidence: {
    matchedCommands: number;
    helpSeeking: boolean;
    errorCount: number;
    selfCorrections: number;
    medianGapMs: number | null;
    thinkingGapMs: number | null;
  };
  matchedCommandTexts: string[];
}

export interface AnalysisResult {
  ratings: ObservationRating[];
  unmatchedCommands: string[];
  timeSpan: { start: string; end: string; durationMs: number } | null;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse a JSONL string into MonitorEvent objects.
 * Skips malformed lines silently.
 */
export function parseMonitorLog(jsonl: string): MonitorEvent[] {
  const events: MonitorEvent[] = [];
  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as MonitorEvent);
    } catch {
      // skip malformed lines
    }
  }
  return events;
}

/**
 * Pair command_start and command_end events by (pid, seq) into CommandRecords.
 */
export function pairCommands(events: MonitorEvent[]): CommandRecord[] {
  const starts = new Map<string, MonitorEvent>();
  const records: CommandRecord[] = [];

  for (const e of events) {
    if (e.type === "command_start" && e.seq != null) {
      const key = `${e.pid ?? 0}:${e.seq}`;
      starts.set(key, e);
    } else if (e.type === "command_end" && e.seq != null) {
      const key = `${e.pid ?? 0}:${e.seq}`;
      const start = starts.get(key);
      if (start) {
        const startMs = new Date(start.ts).getTime();
        const endMs = new Date(e.ts).getTime();
        records.push({
          seq: e.seq,
          pid: e.pid ?? 0,
          command: start.command ?? "",
          cwd: start.cwd ?? "",
          startedAt: start.ts,
          endedAt: e.ts,
          durationMs: endMs - startMs,
          exitCode: e.exit_code ?? null,
        });
        starts.delete(key);
      }
    }
  }

  // Remaining unpaired starts (monitoring stopped mid-command)
  for (const [, start] of starts) {
    records.push({
      seq: start.seq ?? 0,
      pid: start.pid ?? 0,
      command: start.command ?? "",
      cwd: start.cwd ?? "",
      startedAt: start.ts,
      endedAt: null,
      durationMs: null,
      exitCode: null,
    });
  }

  records.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  return records;
}

// ── Analysis ─────────────────────────────────────────────────────────────────

const HELP_PATTERNS = ["--help", "man ", "tldr ", "help "];
const HELP_WINDOW_MS = 60_000;
const RETRY_WINDOW_MS = 30_000;

function matchesToken(command: string, patterns: string[]): boolean {
  const lower = command.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function isHelpCommand(command: string): boolean {
  const lower = command.toLowerCase();
  return HELP_PATTERNS.some((p) => lower.includes(p));
}

function commandPrefix(command: string): string {
  return command.split(/\s+/).slice(0, 2).join(" ").toLowerCase();
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Analyze observed commands against token patterns and produce ratings.
 */
export function analyzeObservation(
  commands: CommandRecord[],
  tokenPatterns: TokenPattern[],
): AnalysisResult {
  const matchedSet = new Set<number>(); // indices of commands matched to any token
  const ratings: ObservationRating[] = [];

  for (const tp of tokenPatterns) {
    const matchIndices: number[] = [];
    const matchedTexts: string[] = [];

    for (let i = 0; i < commands.length; i++) {
      if (matchesToken(commands[i].command, tp.patterns)) {
        matchIndices.push(i);
        matchedTexts.push(commands[i].command);
        matchedSet.add(i);
      }
    }

    if (matchIndices.length === 0) {
      ratings.push({
        tokenSlug: tp.slug,
        rating: null,
        confidence: "low",
        evidence: {
          matchedCommands: 0,
          helpSeeking: false,
          errorCount: 0,
          selfCorrections: 0,
          medianGapMs: null,
          thinkingGapMs: null,
        },
        matchedCommandTexts: [],
      });
      continue;
    }

    // Help-seeking: any help command within HELP_WINDOW_MS before a matched command
    let helpSeeking = false;
    for (const mi of matchIndices) {
      const matchTime = new Date(commands[mi].startedAt).getTime();
      for (let j = 0; j < commands.length; j++) {
        if (j === mi) continue;
        const cmdTime = new Date(commands[j].startedAt).getTime();
        if (cmdTime >= matchTime - HELP_WINDOW_MS && cmdTime < matchTime) {
          if (isHelpCommand(commands[j].command)) {
            helpSeeking = true;
            break;
          }
        }
      }
      if (helpSeeking) break;
    }

    // Error count: matched commands with non-zero exit code
    let errorCount = 0;
    for (const mi of matchIndices) {
      if (commands[mi].exitCode != null && commands[mi].exitCode !== 0) {
        errorCount++;
      }
    }

    // Self-corrections: same command prefix run multiple times with different args
    let selfCorrections = 0;
    const prefixGroups = new Map<string, number>();
    for (const mi of matchIndices) {
      const prefix = commandPrefix(commands[mi].command);
      prefixGroups.set(prefix, (prefixGroups.get(prefix) ?? 0) + 1);
    }
    for (const count of prefixGroups.values()) {
      if (count > 1) selfCorrections += count - 1;
    }

    // Speed: inter-command gaps between matched commands
    const gaps: number[] = [];
    for (let k = 1; k < matchIndices.length; k++) {
      const prev = commands[matchIndices[k - 1]];
      const curr = commands[matchIndices[k]];
      if (prev.endedAt) {
        const gap = new Date(curr.startedAt).getTime() - new Date(prev.endedAt).getTime();
        if (gap >= 0) gaps.push(gap);
      }
    }

    // Thinking gap: time before first matched command from previous command's end
    let thinkingGapMs: number | null = null;
    const firstMatchIdx = matchIndices[0];
    if (firstMatchIdx > 0) {
      const prev = commands[firstMatchIdx - 1];
      if (prev.endedAt) {
        thinkingGapMs =
          new Date(commands[firstMatchIdx].startedAt).getTime() -
          new Date(prev.endedAt).getTime();
      }
    }

    const medianGapMs = computeMedian(gaps);

    // Determine rating
    const rating = inferRating({
      helpSeeking,
      errorCount,
      selfCorrections,
      medianGapMs,
      thinkingGapMs,
      matchedCommands: matchIndices.length,
    });

    // Confidence: more matched commands = higher confidence
    const confidence =
      matchIndices.length >= 3 ? "high" : matchIndices.length >= 2 ? "medium" : "low";

    ratings.push({
      tokenSlug: tp.slug,
      rating,
      confidence,
      evidence: {
        matchedCommands: matchIndices.length,
        helpSeeking,
        errorCount,
        selfCorrections,
        medianGapMs,
        thinkingGapMs,
      },
      matchedCommandTexts: matchedTexts,
    });
  }

  // Unmatched commands
  const unmatchedCommands: string[] = [];
  for (let i = 0; i < commands.length; i++) {
    if (!matchedSet.has(i) && !isHelpCommand(commands[i].command)) {
      unmatchedCommands.push(commands[i].command);
    }
  }

  // Time span
  let timeSpan: AnalysisResult["timeSpan"] = null;
  if (commands.length > 0) {
    const first = commands[0];
    const last = commands[commands.length - 1];
    const endTs = last.endedAt ?? last.startedAt;
    timeSpan = {
      start: first.startedAt,
      end: endTs,
      durationMs: new Date(endTs).getTime() - new Date(first.startedAt).getTime(),
    };
  }

  return { ratings, unmatchedCommands, timeSpan };
}

// ── Rating Inference ─────────────────────────────────────────────────────────

interface RatingSignals {
  helpSeeking: boolean;
  errorCount: number;
  selfCorrections: number;
  medianGapMs: number | null;
  thinkingGapMs: number | null;
  matchedCommands: number;
}

function inferRating(signals: RatingSignals): 1 | 2 | 3 | 4 {
  const { helpSeeking, errorCount, selfCorrections, medianGapMs, thinkingGapMs } = signals;

  // Count negative signals
  let negatives = 0;
  if (helpSeeking) negatives += 2;
  if (errorCount >= 3) negatives += 3;
  else if (errorCount >= 1) negatives += 1;
  if (selfCorrections >= 2) negatives += 2;
  else if (selfCorrections >= 1) negatives += 1;
  if (medianGapMs != null && medianGapMs > 30_000) negatives += 2;
  else if (medianGapMs != null && medianGapMs > 10_000) negatives += 1;
  if (thinkingGapMs != null && thinkingGapMs > 30_000) negatives += 1;

  if (negatives >= 5) return 1;
  if (negatives >= 3) return 2;
  if (negatives >= 1) return 3;
  return 4;
}
