/**
 * Scope-selector logic for the 2D graph card — pure functions, no DOM, so
 * the selector behavior is unit-testable. Mirrors the desktop app's graph
 * selectors (main.ts `loadAndRenderDomains` / `bootstrapGraphWithDomain`):
 * domain options with `/`-prefix groups, prefix-aware domain filtering, and
 * the default-focus pick for a scoped token list.
 */

export interface DomainOption {
  value: string;
  /**
   * True when the option is a `/`-prefix group covering child domains
   * (e.g. "company-team" over "company-team/xyz") rather than a domain any
   * token carries verbatim.
   */
  isGroup: boolean;
}

/** Distinct domains of `tokens`, plus their `/`-prefix groups, sorted. */
export function buildDomainOptions(
  tokens: ReadonlyArray<{ domain: string }>,
): DomainOption[] {
  const real = new Set<string>();
  for (const token of tokens) {
    if (token.domain) real.add(token.domain);
  }
  const all = new Set<string>(real);
  for (const domain of real) {
    if (!domain.includes("/")) continue;
    const parts = domain.split("/");
    for (let i = 1; i < parts.length; i++) {
      all.add(parts.slice(0, i).join("/"));
    }
  }
  return [...all]
    .sort()
    .map((value) => ({ value, isGroup: !real.has(value) }));
}

/** `null` selects everything; otherwise exact match or `<selected>/…`. */
export function domainMatches(
  domain: string,
  selected: string | null,
): boolean {
  if (selected === null) return true;
  return domain === selected || domain.startsWith(`${selected}/`);
}

export function filterByDomain<T extends { domain: string }>(
  tokens: readonly T[],
  selected: string | null,
): T[] {
  return tokens.filter((token) => domainMatches(token.domain, selected));
}

/**
 * The token a scoped, focus-less graph should open on: lowest Bloom level
 * first (foundations before applications), preferring tokens the learner
 * actually has a card for. Ties keep the input order (stable sort), which
 * for bridge `list-tokens` results means domain/slug order.
 */
export function pickDefaultFocus<
  T extends { slug: string; bloomLevel: number; card: unknown },
>(tokens: readonly T[]): T | null {
  if (tokens.length === 0) return null;
  const sorted = [...tokens].sort(
    (a, b) => (a.bloomLevel || 99) - (b.bloomLevel || 99),
  );
  return sorted.find((token) => token.card != null) ?? sorted[0];
}
