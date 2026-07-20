/**
 * Bridge/CI smoke: assert every raw catalog path has importable topics.
 *
 * Epic #132 Phase 0 / issue #133. Walks each unfiltered curriculum provider
 * (schoolType × grade × subject [× track]) and requires listTopics ≥ 1 with a
 * resolvable http(s) source URL — the same data `zam bridge curriculum-list-level
 * --level topic` exposes for a concrete selection.
 *
 * Usage:
 *   npx tsx scripts/curriculum-topic-coverage-smoke.ts
 *   npx tsx scripts/curriculum-topic-coverage-smoke.ts --provider lehrplanplus-bayern
 *   npx tsx scripts/curriculum-topic-coverage-smoke.ts --json
 *   npx tsx scripts/curriculum-topic-coverage-smoke.ts --report-only
 *   npx tsx scripts/curriculum-topic-coverage-smoke.ts --min-coverage 0.5
 *
 * Exit codes:
 *   0 — coverage meets the bar (full coverage by default, or --min-coverage)
 *   1 — gaps remain (or unknown --provider)
 *   2 — invalid CLI flags
 *
 * CI gate once manifests are complete: drop --report-only and require exit 0
 * (see docs/plans/2026-07-12-curriculum-manifest-coverage.md Phase 0).
 */

import {
  auditAllProviders,
  formatCoverageHuman,
  getRawCurriculumProvider,
  RAW_CURRICULUM_PROVIDERS,
  type CoverageSummary,
} from "../src/cli/curriculum/index.js";

interface CliOptions {
  providerIds: string[] | null;
  json: boolean;
  reportOnly: boolean;
  /** Require coverageRatio ≥ this value (0–1). Default 1 = zero gaps. */
  minCoverage: number;
  maxGapList: number;
}

function parseArgs(argv: string[]): CliOptions {
  const providerIds: string[] = [];
  let json = false;
  let reportOnly = false;
  let minCoverage = 1;
  let maxGapList = 50;
  let minCoverageSet = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--report-only") {
      reportOnly = true;
      continue;
    }
    if (arg === "--provider" || arg === "-p") {
      const id = argv[++i];
      if (!id) {
        console.error("Missing value for --provider");
        process.exit(2);
      }
      providerIds.push(id);
      continue;
    }
    if (arg === "--min-coverage") {
      const raw = argv[++i];
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        console.error(
          `--min-coverage must be a number between 0 and 1 (got ${raw})`,
        );
        process.exit(2);
      }
      minCoverage = value;
      minCoverageSet = true;
      continue;
    }
    if (arg === "--max-gap-list") {
      const raw = argv[++i];
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        console.error(`--max-gap-list must be a non-negative number (got ${raw})`);
        process.exit(2);
      }
      maxGapList = Math.floor(value);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    console.error(`Unknown argument: ${arg}`);
    printHelp();
    process.exit(2);
  }

  if (reportOnly && minCoverageSet) {
    console.error("Use either --report-only or --min-coverage, not both");
    process.exit(2);
  }

  return {
    providerIds: providerIds.length > 0 ? providerIds : null,
    json,
    reportOnly,
    minCoverage,
    maxGapList,
  };
}

function printHelp(): void {
  console.log(`Usage: npx tsx scripts/curriculum-topic-coverage-smoke.ts [options]

Options:
  --provider <id>       Limit to one provider (repeatable)
  --json                Emit machine-readable JSON
  --report-only         Always exit 0 (progress report while coverage is incomplete)
  --min-coverage <0-1>  Exit 0 when overall ratio ≥ value (default: 1 = zero gaps)
  --max-gap-list <n>    Cap gap keys in JSON output (default: 50)
  -h, --help            Show this help
`);
}

function selectProviders(ids: string[] | null) {
  if (!ids) return [...RAW_CURRICULUM_PROVIDERS];
  const selected = [];
  for (const id of ids) {
    const provider = getRawCurriculumProvider(id);
    if (!provider) {
      console.error(
        `Unknown curriculum provider: ${id}. Known: ${RAW_CURRICULUM_PROVIDERS.map((p) => p.id).join(", ")}`,
      );
      process.exit(1);
    }
    selected.push(provider);
  }
  return selected;
}

function toJsonPayload(summary: CoverageSummary, maxGapList: number) {
  return {
    success: summary.gaps === 0,
    total: summary.total,
    covered: summary.covered,
    gaps: summary.gaps,
    coverageRatio: summary.coverageRatio,
    providers: summary.providers.map((report) => {
      const gapPaths = report.paths
        .filter((p) => !p.ok)
        .map((p) => ({
          key: p.key,
          issue: p.issue,
          detail: p.detail,
        }));
      return {
        providerId: report.providerId,
        region: report.region,
        regionLabel: report.regionLabel,
        total: report.total,
        covered: report.covered,
        gaps: report.gaps,
        coverageRatio: report.coverageRatio,
        gapSample: gapPaths.slice(0, maxGapList),
        gapSampleTruncated: gapPaths.length > maxGapList,
      };
    }),
  };
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const providers = selectProviders(opts.providerIds);
  const summary = auditAllProviders(providers);

  if (opts.json) {
    console.log(JSON.stringify(toJsonPayload(summary, opts.maxGapList), null, 2));
  } else {
    console.log(formatCoverageHuman(summary));
  }

  if (opts.reportOnly) {
    process.exit(0);
  }

  if (summary.coverageRatio + Number.EPSILON < opts.minCoverage) {
    if (!opts.json) {
      console.error(
        `\nFAIL: coverage ${(summary.coverageRatio * 100).toFixed(1)}% ` +
          `< required ${(opts.minCoverage * 100).toFixed(1)}% ` +
          `(${summary.gaps} gap path(s)).`,
      );
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
