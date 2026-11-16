export interface EditorCardCandidate {
  slug: string;
}

export type EditorSegment = "personal" | "unpublished";

export interface LocateCardHost<T extends EditorCardCandidate> {
  getContext: () => string;
  setSegment: (segment: EditorSegment) => void;
  clearSearchAndCategory: () => void;
  clearContext: () => void;
  loadCards: () => Promise<T[]>;
}

/**
 * Find a card by slug in Learning Content Studio without losing it to active
 * Studio filters or mismatched knowledge contexts.
 *
 * The study queue stays unscoped across all knowledge contexts (ADR Decision
 * 4), whereas Studio defaults `#content-context-filter` to the device context.
 * When the active context hides the card being studied, widen to All Contexts
 * before checking unpublished drafts; if missing everywhere, restore Personal so
 * the caller never strands the learner on the Unpublished tab.
 */
export async function locateCardForEditor<T extends EditorCardCandidate>(
  slug: string,
  host: LocateCardHost<T>,
): Promise<T | null> {
  host.clearSearchAndCategory();
  host.setSegment("personal");
  let cards = await host.loadCards();
  let card = cards.find((item) => item.slug === slug);

  if (!card && host.getContext()) {
    host.clearContext();
    cards = await host.loadCards();
    card = cards.find((item) => item.slug === slug);
  }

  if (!card) {
    host.setSegment("unpublished");
    cards = await host.loadCards();
    card = cards.find((item) => item.slug === slug);
  }

  if (!card) {
    host.setSegment("personal");
    await host.loadCards();
    return null;
  }

  return card;
}
