/**
 * The refusal every planet invariant raises (ADR 2026-10-13, Decision 2). On
 * its own so that `variants.ts`, which `planets.ts` imports, can raise it too.
 *
 * - `other-planet`: a lens or a thread end on a planet the write may not use.
 * - `published-is-world`: a published unit stays world knowledge.
 * - `held-by-thread`: a move would let world knowledge depend on a Firma or
 *   Privat unit.
 * - `variant-is-world`: a variant stands in for world knowledge, so it is
 *   world knowledge itself (Decision 12).
 */

export type PlanetErrorCode =
  | "other-planet"
  | "published-is-world"
  | "held-by-thread"
  | "variant-is-world";

/** A write that would break a planet invariant. */
export class PlanetError extends Error {
  constructor(
    readonly code: PlanetErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PlanetError";
  }
}
