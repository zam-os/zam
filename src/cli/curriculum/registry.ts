import { withImportableContentOnly } from "./content-filter.js";
import { bildungsplanBremenProvider } from "./providers/bildungsplan-bremen/index.js";
import { bildungsplanBwProvider } from "./providers/bildungsplan-bw/index.js";
import { bildungsplanHamburgProvider } from "./providers/bildungsplan-hamburg/index.js";
import { fachanforderungenShProvider } from "./providers/fachanforderungen-sh/index.js";
import { kerncurriculumHessenProvider } from "./providers/kerncurriculum-hessen/index.js";
import { kerncurriculumNiedersachsenProvider } from "./providers/kerncurriculum-niedersachsen/index.js";
import { kernlehrplanNrwProvider } from "./providers/kernlehrplan-nrw/index.js";
import { lehrplaeneRpProvider } from "./providers/lehrplaene-rp/index.js";
import { lehrplanSaarlandProvider } from "./providers/lehrplan-saarland/index.js";
import { lehrplanSachsenProvider } from "./providers/lehrplan-sachsen/index.js";
import { lehrplanThueringenProvider } from "./providers/lehrplan-thueringen/index.js";
import { lehrplanplusBayernProvider } from "./providers/lehrplanplus-bayern/index.js";
import { rahmenlehrplanBerlinBrandenburgProvider } from "./providers/rahmenlehrplan-berlin-brandenburg/index.js";
import { rahmenplanMvProvider } from "./providers/rahmenplan-mv/index.js";
import { rahmenrichtlinienStProvider } from "./providers/rahmenrichtlinien-st/index.js";
import type { CurriculumProvider, TaxonomyNode } from "./types.js";

/**
 * Raw (unfiltered) curriculum plugins — full catalog as published in each
 * provider manifest, including school-type × grade × subject combinations
 * that still lack importable topics.
 *
 * Use this for coverage audits (Epic #132 Phase 0) and tooling that must see
 * the complete taxonomy. Runtime consumers (bridge, wizard) use
 * `CURRICULUM_PROVIDERS` instead.
 */
export const RAW_CURRICULUM_PROVIDERS: CurriculumProvider[] = [
  lehrplanplusBayernProvider,
  bildungsplanBwProvider,
  kernlehrplanNrwProvider,
  kerncurriculumHessenProvider,
  kerncurriculumNiedersachsenProvider,
  lehrplanSachsenProvider,
  rahmenlehrplanBerlinBrandenburgProvider,
  bildungsplanHamburgProvider,
  bildungsplanBremenProvider,
  rahmenplanMvProvider,
  lehrplaeneRpProvider,
  lehrplanSaarlandProvider,
  rahmenrichtlinienStProvider,
  fachanforderungenShProvider,
  lehrplanThueringenProvider,
];

/**
 * Registered curriculum providers. Add a new plugin to
 * `RAW_CURRICULUM_PROVIDERS` above.
 *
 * Every provider is wrapped in `withImportableContentOnly`, so consumers
 * (bridge, wizard) never see school types, grades, subjects, or tracks that
 * cannot reach an importable topic.
 */
export const CURRICULUM_PROVIDERS: CurriculumProvider[] =
  RAW_CURRICULUM_PROVIDERS.map(withImportableContentOnly);

export function getCurriculumProvider(
  id: string,
): CurriculumProvider | undefined {
  return CURRICULUM_PROVIDERS.find((provider) => provider.id === id);
}

/** Raw provider by id (full catalog, including empty topic paths). */
export function getRawCurriculumProvider(
  id: string,
): CurriculumProvider | undefined {
  return RAW_CURRICULUM_PROVIDERS.find((provider) => provider.id === id);
}

export interface CurriculumRegionOption extends TaxonomyNode {
  providerId: string;
}

/** Distinct countries across all registered providers (wizard step 1). */
export function listCurriculumCountries(): TaxonomyNode[] {
  const countries: TaxonomyNode[] = [];
  for (const provider of CURRICULUM_PROVIDERS) {
    if (!countries.some((c) => c.id === provider.country)) {
      countries.push({ id: provider.country, label: provider.countryLabel });
    }
  }
  return countries;
}

/** Regions within a country, each naming the provider that serves it (wizard step 2). */
export function listCurriculumRegions(
  country: string,
): CurriculumRegionOption[] {
  return CURRICULUM_PROVIDERS.filter(
    (provider) => provider.country === country,
  ).map((provider) => ({
    id: provider.region,
    label: provider.regionLabel,
    providerId: provider.id,
  }));
}
