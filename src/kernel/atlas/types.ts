/**
 * Vocabulary of the knowledge atlas (ADR 2026-10-13). Pure.
 */

/**
 * The kind of knowledge, by who protects it (Decision 2): nobody, an
 * organisation, or a person.
 */
export type PlanetKind = "welt" | "firma" | "privat";

/**
 * The planet beside world knowledge that a library holds: Firma on a company
 * library, Privat on a personal one. They never share a database.
 */
export type OwnPlanet = Exclude<PlanetKind, "welt">;

/** One order over the same learning units (Decision 3). */
export type LensKind =
  | "weltwissen"
  | "schule"
  | "unternehmen"
  | "produkte"
  | "leben";

/** Red-thread kinds with UML-style ends (Decision 7). */
export type ThreadKind =
  | "voraussetzung"
  | "nutzt"
  | "schnittstelle"
  | "ist-ein"
  | "verbindung";

/** Every thread kind, in the order the Studio lists them. */
export const THREAD_KINDS: readonly ThreadKind[] = [
  "voraussetzung",
  "nutzt",
  "schnittstelle",
  "ist-ein",
  "verbindung",
];

/**
 * A learning unit (Decision 1): every practice item of one atom is one unit,
 * and a token without an atom is a unit of its own.
 */
export type UnitKey = `atom:${string}` | `token:${string}`;

export function unitKeyFor(tokenId: string, atomId: string | null): UnitKey {
  return atomId ? `atom:${atomId}` : `token:${tokenId}`;
}
