/** Validates Hessen complete catalog (offline).
 */
import { kerncurriculumHessenProvider } from "../src/cli/curriculum/providers/kerncurriculum-hessen/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";
const report = auditProviderCoverage(kerncurriculumHessenProvider);
console.log(JSON.stringify({ success: report.catalogComplete && report.gaps===0, total: report.total, covered: report.covered, gaps: report.gaps, catalogStatus: report.catalogStatus, schoolTypes: kerncurriculumHessenProvider.listSchoolTypes().map(s=>s.id) }, null, 2));
if (!(report.catalogComplete && report.gaps===0)) process.exit(1);
