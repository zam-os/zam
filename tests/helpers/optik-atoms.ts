/**
 * Named ids for the Optik reference cell.
 *
 * Atom identity is an opaque ULID (ADR 2026-08-14 Decision 8), which is right
 * for the data and unreadable in a test. The fixtures therefore use fixed,
 * deterministic ULIDs and this module gives them back their names.
 */
export const OPTIK = {
  strahlengangLot: "01K3X9A7R4B8C1D2E3F4G5A001",
  brechungQualitativ: "01K3X9A7R4B8C1D2E3F4G5A002",
  totalreflexionGrenzwinkel: "01K3X9A7R4B8C1D2E3F4G5A003",
  snelliusFormel: "01K3X9A7R4B8C1D2E3F4G5A004",
  reflexionsgesetz: "01K3X9A7R4B8C1D2E3F4G5A005",
  sammellinseAbbildung: "01K3X9A7R4B8C1D2E3F4G5A006",
  totalreflexionAnwendungen: "01K3X9A7R4B8C1D2E3F4G5A007",
  dispersionSpektrum: "01K3X9A7R4B8C1D2E3F4G5A008",
  brechungsindexBestimmen: "01K3X9A7R4B8C1D2E3F4G5A009",
} as const;

/** The three atoms a Realschule Optik learner's own curriculum covers. */
export const REALSCHULE_CELL = [
  OPTIK.strahlengangLot,
  OPTIK.brechungQualitativ,
  OPTIK.totalreflexionGrenzwinkel,
];
