/**
 * Cross-domain interleaving — prevents same-domain streaks in review queues.
 *
 * Given an array of items with a `domain` field, reorders them using a
 * round-robin strategy so that consecutive items come from different domains.
 * This leverages the interleaving effect: mixing topics during practice
 * strengthens discrimination and long-term retention.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface QueueItem {
  cardId: string;
  tokenId: string;
  domain: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Reorder items so no domain appears more than `maxConsecutive` times in a row.
 *
 * Algorithm: group items by domain, then round-robin across domain groups.
 * Each round picks one item from each non-exhausted domain. Within a domain,
 * the original order is preserved (so urgency sorting survives).
 *
 * If a domain has more items than others, its extras will appear after all
 * other domains are exhausted — but the `maxConsecutive` cap is still
 * respected by inserting items from the largest remaining domains first.
 *
 * @param items - Array of items to interleave. Not mutated.
 * @param maxConsecutive - Max consecutive items from the same domain. Defaults to 2.
 * @returns A new array with the same items in interleaved order.
 */
export function interleave<T extends { domain: string }>(
  items: T[],
  maxConsecutive: number = 2,
): T[] {
  if (items.length <= 1) return [...items];

  // Group items by domain, preserving original order within each group
  const byDomain = new Map<string, T[]>();
  for (const item of items) {
    const group = byDomain.get(item.domain);
    if (group) {
      group.push(item);
    } else {
      byDomain.set(item.domain, [item]);
    }
  }

  // If there's only one domain, no interleaving possible
  if (byDomain.size === 1) return [...items];

  const result: T[] = [];
  let consecutiveCount = 0;
  let lastDomain: string | null = null;

  // Track how many items we've consumed from each domain
  const cursors = new Map<string, number>();
  for (const domain of byDomain.keys()) {
    cursors.set(domain, 0);
  }

  // Round-robin: sort domains by remaining count (largest first) each round
  while (result.length < items.length) {
    // Get domains that still have items, sorted by remaining count descending
    const activeDomains = [...byDomain.entries()]
      .filter(([domain]) => cursors.get(domain)! < byDomain.get(domain)!.length)
      .sort((a, b) => {
        const remainA = a[1].length - cursors.get(a[0])!;
        const remainB = b[1].length - cursors.get(b[0])!;
        return remainB - remainA;
      });

    if (activeDomains.length === 0) break;

    let pickedThisRound = false;

    for (const [domain, group] of activeDomains) {
      const cursor = cursors.get(domain)!;
      if (cursor >= group.length) continue;

      // Check if adding from this domain would exceed maxConsecutive
      if (domain === lastDomain && consecutiveCount >= maxConsecutive) {
        // Try to find another domain first
        continue;
      }

      // Pick one item from this domain
      result.push(group[cursor]);
      cursors.set(domain, cursor + 1);
      pickedThisRound = true;

      if (domain === lastDomain) {
        consecutiveCount++;
      } else {
        lastDomain = domain;
        consecutiveCount = 1;
      }

      break;
    }

    // If we couldn't pick without exceeding maxConsecutive, we must accept
    // a streak from whatever domain has items left
    if (!pickedThisRound) {
      for (const [domain, group] of activeDomains) {
        const cursor = cursors.get(domain)!;
        if (cursor >= group.length) continue;

        result.push(group[cursor]);
        cursors.set(domain, cursor + 1);

        if (domain === lastDomain) {
          consecutiveCount++;
        } else {
          lastDomain = domain;
          consecutiveCount = 1;
        }

        break;
      }
    }
  }

  return result;
}
