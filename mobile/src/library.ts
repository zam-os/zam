/**
 * The learner's own cards: finding them, changing them, putting them aside.
 *
 * Until the app became standalone this did not exist on mobile at all —
 * content arrived from the desktop and could only be added, never revisited.
 * A learner who cannot fix a badly worded card, or stop one they no longer
 * need, is stuck with whatever they typed on a bus.
 *
 * Search has two legs. Full text always works and needs nothing. Semantic
 * search joins in only when an embedding model is connected *and* the query
 * itself can be embedded — a network hiccup degrades to full text rather than
 * to an error, because finding fewer cards is better than finding none.
 *
 * Every kernel call here already existed for the desktop; what was missing was
 * a device-shaped path to it.
 */

import type { Database } from "../../src/kernel/db/types.js";
import {
  deleteCardForUser,
  detachCardForUser,
  reattachCardForUser,
} from "../../src/kernel/models/card.js";
import {
  type BloomLevel,
  getTokenById,
  listPersonalCards,
  type PersonalCard,
  updateToken,
} from "../../src/kernel/models/token.js";
import { searchTokensHybrid } from "../../src/kernel/search/hybrid.js";
import { CLOUD_EMBEDDING_MODEL_ID } from "./ai/connect.js";
import { requestEmbeddings } from "./ai/embedder.js";
import { resolveMobileCloudChain } from "./model-registry.js";

export type LibraryEntry = PersonalCard & {
  /** True when the card is set aside — kept, with its history, but unscheduled. */
  paused: boolean;
};

export interface LibraryQuery {
  /** Free text. Empty lists everything. */
  query?: string;
  domain?: string;
  limit?: number;
}

function toEntry(card: PersonalCard): LibraryEntry {
  return { ...card, paused: card.detachedAt !== null };
}

/**
 * Embed a search query so the vector leg can run. Returns null whenever that
 * is not possible — no model, no network, an odd response — and the caller
 * then searches lexically, which is the honest degradation.
 */
async function embedQuery(
  db: Database,
  query: string,
  fetchImpl?: typeof fetch,
): Promise<number[] | null> {
  try {
    const endpoint = await resolveMobileCloudChain(db, "embedding");
    if (!endpoint) return null;
    const [vector] = await requestEmbeddings(endpoint, [query], fetchImpl);
    return vector ?? null;
  } catch {
    return null;
  }
}

/**
 * The learner's cards, most recently touched first, optionally filtered.
 *
 * `listPersonalCards` already scopes to one learner and matches text, so a
 * plain browse and a lexical search are the same call.
 */
export async function listLibrary(
  db: Database,
  userId: string,
  options: LibraryQuery = {},
): Promise<LibraryEntry[]> {
  const cards = await listPersonalCards(db, userId, {
    query: options.query?.trim() || undefined,
    domain: options.domain,
  });
  const entries = cards.map(toEntry);
  return options.limit ? entries.slice(0, options.limit) : entries;
}

/**
 * Search the learner's cards by meaning as well as by wording.
 *
 * The hybrid ranking is computed over all tokens, then narrowed to the ones
 * this learner actually has — a shared library can hold cards that were never
 * assigned here, and surfacing those would promise something the queue will
 * not deliver.
 */
export async function searchLibrary(
  db: Database,
  userId: string,
  query: string,
  options: { limit?: number; fetchImpl?: typeof fetch } = {},
): Promise<LibraryEntry[]> {
  const trimmed = query.trim();
  if (!trimmed) return listLibrary(db, userId, { limit: options.limit });

  const queryEmbedding = await embedQuery(db, trimmed, options.fetchImpl);
  if (!queryEmbedding) {
    return listLibrary(db, userId, { query: trimmed, limit: options.limit });
  }

  const ranked = await searchTokensHybrid(db, trimmed, {
    queryEmbedding,
    model: CLOUD_EMBEDDING_MODEL_ID,
    limit: options.limit ?? 30,
  });

  const mine = new Map(
    (await listPersonalCards(db, userId)).map((card) => [card.tokenId, card]),
  );
  const hits: LibraryEntry[] = [];
  for (const token of ranked) {
    const card = mine.get(token.id);
    if (card) hits.push(toEntry(card));
  }
  return hits;
}

export interface CardEdit {
  title?: string;
  question?: string | null;
  concept?: string;
  domain?: string;
  bloomLevel?: BloomLevel;
}

/**
 * Save a learner's edit.
 *
 * `question_source` flips to "manual" whenever the question itself is
 * touched: a question a person wrote must not be silently replaced by the
 * dynamic rewriter later, which is exactly what the provenance column is for.
 *
 * Everything in this module is addressed by token id, which is what a
 * `LibraryEntry` carries. `updateToken` keys on the slug, so the lookup
 * happens here rather than leaking a second identifier to every caller.
 */
export async function saveCardEdit(
  db: Database,
  tokenId: string,
  edit: CardEdit,
): Promise<void> {
  const token = await getTokenById(db, tokenId);
  if (!token) throw new Error(`Card not found: ${tokenId}`);
  await updateToken(db, token.slug, {
    ...(edit.title !== undefined ? { title: edit.title } : {}),
    ...(edit.concept !== undefined ? { concept: edit.concept } : {}),
    ...(edit.domain !== undefined ? { domain: edit.domain } : {}),
    ...(edit.bloomLevel !== undefined ? { bloom_level: edit.bloomLevel } : {}),
    ...(edit.question !== undefined
      ? { question: edit.question, question_source: "manual" as const }
      : {}),
  });
}

/**
 * Stop scheduling a card without losing it.
 *
 * Deliberately distinct from deleting: the card and every review of it stay,
 * so a learner can put a topic down for a term and pick it up with their
 * history intact.
 */
export async function pauseCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<void> {
  await detachCardForUser(db, tokenId, userId);
}

export async function resumeCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<void> {
  await reattachCardForUser(db, tokenId, userId);
}

/** Remove the card and its review history for this learner. */
export async function removeCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<void> {
  await deleteCardForUser(db, tokenId, userId);
}

/** Subjects present in the learner's library, for the filter row. */
export async function listSubjects(
  db: Database,
  userId: string,
): Promise<string[]> {
  const cards = await listPersonalCards(db, userId);
  const subjects = new Set<string>();
  for (const card of cards) {
    if (card.domain) subjects.add(card.domain);
  }
  return [...subjects].sort((a, b) => a.localeCompare(b));
}
