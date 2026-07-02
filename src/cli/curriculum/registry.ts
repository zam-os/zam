import { lehrplanplusBayernProvider } from "./providers/lehrplanplus-bayern/index.js";
import type { CurriculumProvider, TaxonomyNode } from "./types.js";

/** Registered curriculum providers. Add a new plugin here to extend it. */
export const CURRICULUM_PROVIDERS: CurriculumProvider[] = [
  lehrplanplusBayernProvider,
];

export function getCurriculumProvider(
  id: string,
): CurriculumProvider | undefined {
  return CURRICULUM_PROVIDERS.find((provider) => provider.id === id);
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
