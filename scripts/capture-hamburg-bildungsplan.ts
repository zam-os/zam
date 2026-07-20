/** Validates Hamburg complete catalog (offline).
 * Usage: npx tsx scripts/capture-hamburg-bildungsplan.ts
 */
import { bildungsplanHamburgProvider } from "../src/cli/curriculum/providers/bildungsplan-hamburg/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";
const report = auditProviderCoverage(bildungsplanHamburgProvider);
const summary = { success: report.catalogComplete && report.gaps === 0, ...report, schoolTypes: bildungsplanHamburgProvider.listSchoolTypes().map(s=>s.id) };
console.log(JSON.stringify({ success: summary.success, total: report.total, covered: report.covered, gaps: report.gaps, catalogStatus: report.catalogStatus, schoolTypes: summary.schoolTypes }, null, 2));
if (!summary.success) process.exit(1);
