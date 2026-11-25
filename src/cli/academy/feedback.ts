/**
 * „Fehler melden ↗“ on a private provider's card (ADR 2026-11-25 Decision 8).
 *
 * The link is the provider's own `feedback` template from the file the
 * learner confirmed, filled with the tile id, item id and tile version — and
 * nothing else: no question, no answer, no learner. ZAM sends nothing itself;
 * Studio opens the link in the system browser on the learner's click.
 */

import {
  confirmedProvider,
  type Database,
  providerFeedbackUrl,
  providerTileForItem,
} from "../../kernel/index.js";

/** The report link for one item, or null when there is none to offer. */
export async function providerFeedbackFor(
  db: Database,
  itemId: string,
): Promise<string | null> {
  const tile = await providerTileForItem(db, itemId);
  if (!tile) return null;
  const providerId = tile.tileId.slice(0, tile.tileId.indexOf(":"));
  const confirmed = confirmedProvider(providerId);
  if (!confirmed) return null;
  return providerFeedbackUrl(confirmed.provider, {
    tile: tile.tileId,
    item: itemId,
    version: tile.version,
  });
}
