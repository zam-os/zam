/** Validates SH complete catalog (offline).
 * Usage: npx tsx scripts/capture-sh-fachanforderungen.ts
 */
import { fachanforderungenShProvider } from "../src/cli/curriculum/providers/fachanforderungen-sh/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";
const report = auditProviderCoverage(fachanforderungenShProvider);
console.log(JSON.stringify({ success: report.catalogComplete && report.gaps===0, total: report.total, covered: report.covered, gaps: report.gaps, catalogStatus: report.catalogStatus, schoolTypes: fachanforderungenShProvider.listSchoolTypes().map(s=>s.id) }, null, 2));
if (!(report.catalogComplete && report.gaps===0)) process.exit(1);
