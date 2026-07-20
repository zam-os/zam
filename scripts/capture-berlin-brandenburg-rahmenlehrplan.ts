/**
 * Validates Berlin-Brandenburg complete catalog (offline).
 * Usage: npx tsx scripts/capture-berlin-brandenburg-rahmenlehrplan.ts
 */
import { rahmenlehrplanBerlinBrandenburgProvider } from "../src/cli/curriculum/providers/rahmenlehrplan-berlin-brandenburg/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(rahmenlehrplanBerlinBrandenburgProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: rahmenlehrplanBerlinBrandenburgProvider
        .listSchoolTypes()
        .map((s) => s.id),
      source:
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
