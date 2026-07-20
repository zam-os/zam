/**
 * Baden-Württemberg Bildungsplan catalog regenerator (Epic #132 Phase B).
 *
 * The authoritative catalog lives in
 * `src/cli/curriculum/providers/bildungsplan-bw/manifest.ts` (generated from the
 * official portal listing at https://www.bildungsplaene-bw.de/).
 *
 * This script validates the complete-catalog invariant rather than scraping
 * the live site on every run (CI-safe, no network).
 *
 * Usage: npx tsx scripts/capture-bw-bildungsplan.ts
 */

import { bildungsplanBwProvider } from "../src/cli/curriculum/providers/bildungsplan-bw/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(bildungsplanBwProvider);

const summary = {
  success: report.catalogComplete && report.gaps === 0,
  providerId: report.providerId,
  catalogStatus: report.catalogStatus,
  catalogComplete: report.catalogComplete,
  total: report.total,
  covered: report.covered,
  gaps: report.gaps,
  schoolTypes: bildungsplanBwProvider.listSchoolTypes().map((s) => s.id),
  source: "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG",
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.success) process.exit(1);
