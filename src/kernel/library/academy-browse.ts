/**
 * Pure ZAM Academy browsing, enrichment, multi-stage navigation and search
 * (shared by CLI, Desktop Studio and Mobile — zero Node or DOM imports).
 *
 * Mirrors the structure of `https://academy.zam-os.org/`:
 * - Schulsicht: Klassenstufe (4–13 + Übergreifend) → Fach → Schule & Pakete
 * - Weltwissen: Wissensbereich → Fach → Pakete
 * - Direct filtering by Schule, Klasse, Fach and multi-token search.
 */

import type {
  AcademyBereich,
  AcademyFach,
  AcademyFachverbund,
  AcademyIndex,
  AcademyPackageMeta,
  AcademySchool,
} from "./academy-catalog.js";
import { academyAppSlug } from "./academy-catalog.js";

/** Special grade key representing cross-grade / modular packages (`grade: null`). */
export const ACADEMY_GRADE_CROSS = "uebergreifend" as const;

/** Special subject / area key for packages not classified in the taxonomy. */
export const ACADEMY_OTHER_BUCKET = "other" as const;

/** Special school filter key for school-independent packages (`school: null`). */
export const ACADEMY_SCHOOL_INDEPENDENT = "independent" as const;

export type AcademyGradeFilter = number | typeof ACADEMY_GRADE_CROSS | null;

export interface AcademyTaxonomy {
  goal: string;
  schulen: AcademySchool[];
  bereiche: AcademyBereich[];
  faecher: AcademyFach[];
  fachverbunde: AcademyFachverbund[];
}

export interface AcademyCellFacet {
  app: string;
  fach: string | null;
  /** Subject ids under which this cell appears (expanded for Fachverbunde). */
  subjectIds: string[];
  subjectName: string | null;
  /** Area ids under which this cell appears. */
  bereichIds: string[];
  bereich: string | null;
  bereichName: string | null;
  glyph: string | null;
  hue: number | null;
  /** Covered grades sorted ascending; empty means cross-grade ("Übergreifend"). */
  grades: number[];
  school: string | null;
  schoolName: string | null;
  schoolShort: string | null;
  zweige: string | null;
  lessons: number | null;
  gebiete: string[];
  combinationName: string | null;
  combinationGlyph: string | null;
}

export interface AcademyCellBase {
  id: string;
  title: string;
  description: string;
  appUrl: string | null;
  held: boolean;
  facet?: AcademyCellFacet;
}

/** Minimal tile metadata shape used for offline fallback inference. */
export interface AcademyTileHint {
  tile_id: string;
  atoms: Array<{
    domain?: string;
    curricula?: Array<{
      provider?: string;
      school_type?: string;
      grade?: number | null;
      subject?: string;
    }>;
  }>;
}

export interface AcademyFilter {
  school?: string | null;
  grade?: AcademyGradeFilter;
  bereich?: string | null;
  subject?: string | null;
  query?: string;
}

export interface AcademyGradeTile {
  key: number | typeof ACADEMY_GRADE_CROSS;
  glyph: string;
  hue: number;
  total: number;
  held: number;
  schools: string[];
}

export interface AcademyBereichTile {
  id: string;
  name: string | null;
  glyph: string;
  hue: number;
  total: number;
  held: number;
  subjectCount: number;
}

export interface AcademySubjectSchoolBadge {
  id: string;
  short: string;
  combination: string | null;
  combinationGlyph: string | null;
}

export interface AcademySubjectTile {
  id: string;
  name: string | null;
  glyph: string;
  hue: number;
  total: number;
  held: number;
  schools: AcademySubjectSchoolBadge[];
}

export interface AcademySchoolOption {
  id: string;
  name: string | null;
  short: string | null;
  total: number;
  held: number;
}

/**
 * Fallback taxonomy matching `academy.zam-os.org/academy.json` so offline
 * bundled cells still get clean school, grade and subject navigation before
 * the learner has fetched `academy.json` once.
 */
export const DEFAULT_ACADEMY_TAXONOMY: AcademyTaxonomy = {
  goal: "",
  schulen: [
    {
      id: "grundschule",
      name: "Grundschule",
      wo: "an der Grundschule",
      short: "GS",
      from: 4,
      to: 4,
    },
    {
      id: "mittelschule",
      name: "Mittelschule",
      wo: "an der Mittelschule",
      short: "MS",
      from: 5,
      to: 10,
    },
    {
      id: "realschule",
      name: "Realschule",
      wo: "an der Realschule",
      short: "Real",
      from: 5,
      to: 10,
    },
    {
      id: "gymnasium",
      name: "Gymnasium",
      wo: "am Gymnasium",
      short: "Gym",
      from: 5,
      to: 13,
    },
    {
      id: "fosbos",
      name: "FOS / BOS",
      wo: "an der FOS / BOS",
      short: "FOS/BOS",
      from: 11,
      to: 13,
    },
  ],
  bereiche: [
    { id: "sprachen", name: "Sprachen", glyph: "Aa" },
    { id: "mathematik", name: "Mathematik", glyph: "∑" },
    { id: "naturwissenschaften", name: "Naturwissenschaften", glyph: "⚛" },
    { id: "informatik", name: "Informatik", glyph: "</>" },
    { id: "gesellschaft", name: "Gesellschaft", glyph: "⌛" },
    { id: "wirtschaft", name: "Wirtschaft", glyph: "€" },
  ],
  faecher: [
    {
      id: "deutsch",
      name: "Deutsch",
      bereich: "sprachen",
      glyph: "Aa",
      hue: 340,
      from: 4,
    },
    {
      id: "englisch",
      name: "Englisch",
      bereich: "sprachen",
      glyph: "EN",
      hue: 8,
      from: 5,
    },
    {
      id: "franzoesisch",
      name: "Französisch",
      bereich: "sprachen",
      glyph: "FR",
      hue: 322,
      from: 5,
    },
    {
      id: "mathematik",
      name: "Mathematik",
      bereich: "mathematik",
      glyph: "a²+b²=c²",
      hue: 215,
      from: 4,
    },
    {
      id: "physik",
      name: "Physik",
      bereich: "naturwissenschaften",
      glyph: "F=m·a",
      hue: 258,
      from: 6,
    },
    {
      id: "chemie",
      name: "Chemie",
      bereich: "naturwissenschaften",
      glyph: "H₂O",
      hue: 168,
      from: 8,
    },
    {
      id: "biologie",
      name: "Biologie",
      bereich: "naturwissenschaften",
      glyph: "DNA",
      hue: 130,
      from: 5,
    },
    {
      id: "informatik",
      name: "Informatik",
      bereich: "informatik",
      glyph: "</>",
      hue: 190,
      from: 6,
    },
    {
      id: "geschichte",
      name: "Geschichte",
      bereich: "gesellschaft",
      glyph: "1918",
      hue: 30,
      from: 6,
    },
    {
      id: "geographie",
      name: "Geographie",
      bereich: "gesellschaft",
      glyph: "N↑",
      hue: 76,
      from: 5,
    },
    {
      id: "hsu",
      name: "Heimat- und Sachunterricht",
      bereich: "gesellschaft",
      glyph: "HSU",
      hue: 110,
      from: 4,
      to: 4,
    },
    {
      id: "wirtschaft",
      name: "Wirtschaft",
      bereich: "wirtschaft",
      glyph: "€",
      hue: 296,
      from: 7,
    },
    {
      id: "pug",
      name: "Politik und Gesellschaft",
      bereich: "gesellschaft",
      glyph: "§",
      hue: 205,
      from: 8,
    },
  ],
  fachverbunde: [
    {
      id: "gpg",
      name: "Geschichte/Politik/Geographie",
      glyph: "GPG",
      school: "mittelschule",
      grades: [5, 6, 7, 8, 9, 10],
      paths: ["geschichte", "pug", "geographie"],
    },
    {
      id: "nt",
      name: "Natur und Technik",
      glyph: "NuT",
      school: "mittelschule",
      grades: [5, 6, 7, 8, 9, 10],
      paths: ["biologie", "chemie", "physik"],
    },
  ],
};

const SUBJECT_ALIASES: Record<string, string> = {
  it: "informatik",
  bwr: "wirtschaft",
  "bwl-rechnungswesen": "wirtschaft",
  "wirtschaft-und-recht": "wirtschaft",
  "wirtschaft-recht": "wirtschaft",
  "politik-und-gesellschaft": "pug",
  politik: "pug",
  "heimat-und-sachunterricht": "hsu",
};

const SLUG_SCHOOL_GRADE =
  /-(grundschule|mittelschule|realschule|gymnasium|fosbos)-(\d{1,2})$/;

export function taxonomyFromIndex(
  index: AcademyIndex | null | undefined,
): AcademyTaxonomy {
  if (!index) return DEFAULT_ACADEMY_TAXONOMY;
  return {
    goal: index.goal,
    schulen: index.schulen,
    bereiche: index.bereiche,
    faecher: index.faecher,
    fachverbunde: index.fachverbunde,
  };
}

function normalizeSubjectAlias(raw: string | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return SUBJECT_ALIASES[key] ?? key;
}

function inferFromTile(
  app: string,
  tile: AcademyTileHint | undefined,
  taxonomy: AcademyTaxonomy,
): { fach: string | null; grades: number[]; school: string | null } {
  const knownSchools = new Set(taxonomy.schulen.map((s) => s.id));
  const knownSubjects = new Set([
    ...taxonomy.faecher.map((f) => f.id),
    ...taxonomy.fachverbunde.map((v) => v.id),
  ]);

  let school: string | null = null;
  const gradeSet = new Set<number>();
  let fach: string | null = null;

  if (tile) {
    for (const atom of tile.atoms) {
      for (const cur of atom.curricula ?? []) {
        if (cur.provider !== "lehrplanplus-bayern") continue;
        if (!school && cur.school_type && knownSchools.has(cur.school_type)) {
          school = cur.school_type;
        }
        if (
          typeof cur.grade === "number" &&
          Number.isInteger(cur.grade) &&
          cur.grade >= 1 &&
          cur.grade <= 13
        ) {
          gradeSet.add(cur.grade);
        }
        if (!fach && cur.subject) {
          const normalized = normalizeSubjectAlias(cur.subject);
          if (normalized && knownSubjects.has(normalized)) {
            fach = normalized;
          }
        }
      }
      if (!fach && atom.domain) {
        const prefix = normalizeSubjectAlias(atom.domain.split("/")[0]);
        if (prefix && knownSubjects.has(prefix)) {
          fach = prefix;
        }
      }
    }
  }

  // Slug pattern fallback (e.g. `informatik-realschule-10` whose IT binding has no grade).
  const match = SLUG_SCHOOL_GRADE.exec(app);
  if (match) {
    if (!school && knownSchools.has(match[1])) school = match[1];
    if (gradeSet.size === 0) {
      const g = Number(match[2]);
      if (g >= 1 && g <= 13) gradeSet.add(g);
    }
  }
  if (!fach) {
    const firstPart = normalizeSubjectAlias(app.split("-")[0]);
    if (firstPart && knownSubjects.has(firstPart)) {
      fach = firstPart;
    }
  }

  return {
    fach,
    grades: [...gradeSet].sort((a, b) => a - b),
    school,
  };
}

function resolveFacet(
  app: string,
  pkg: AcademyPackageMeta | undefined,
  tile: AcademyTileHint | undefined,
  taxonomy: AcademyTaxonomy,
): AcademyCellFacet {
  const schoolById = new Map(taxonomy.schulen.map((s) => [s.id, s]));
  const bereichById = new Map(taxonomy.bereiche.map((b) => [b.id, b]));
  const fachById = new Map(taxonomy.faecher.map((f) => [f.id, f]));
  const verbundById = new Map(taxonomy.fachverbunde.map((v) => [v.id, v]));

  const fallback = pkg ? null : inferFromTile(app, tile, taxonomy);
  const fachId = pkg ? pkg.fach : (fallback?.fach ?? null);
  const grades = pkg ? [...pkg.grades] : (fallback?.grades ?? []);
  const schoolId = pkg ? pkg.school : (fallback?.school ?? null);
  const school = schoolId ? (schoolById.get(schoolId) ?? null) : null;

  const directFach = fachId ? (fachById.get(fachId) ?? null) : null;
  const verbund = fachId ? (verbundById.get(fachId) ?? null) : null;

  let subjectIds: string[];
  let subjectName: string | null;
  let bereichIds: string[];
  let bereichId: string | null;
  let glyph: string | null;
  let hue: number | null;
  let combinationName: string | null = null;
  let combinationGlyph: string | null = null;

  if (directFach) {
    subjectIds = [directFach.id];
    subjectName = directFach.name;
    bereichId = directFach.bereich;
    bereichIds = [directFach.bereich];
    glyph = directFach.glyph;
    hue = directFach.hue;
  } else if (verbund) {
    // Combined subjects (Mittelschule GPG / NuT) are reachable through each
    // constituent subject path, just like on academy.zam-os.org.
    subjectIds = [...new Set([...verbund.paths, verbund.id])];
    subjectName = verbund.name;
    combinationName = verbund.name;
    combinationGlyph = verbund.glyph;
    const constituent = verbund.paths
      .map((id) => fachById.get(id))
      .filter((f): f is AcademyFach => f !== undefined);
    bereichIds = [...new Set(constituent.map((f) => f.bereich))];
    bereichId = bereichIds[0] ?? null;
    glyph = verbund.glyph;
    hue = constituent[0]?.hue ?? 220;
  } else {
    subjectIds = [];
    subjectName = null;
    bereichIds = [];
    bereichId = null;
    glyph = null;
    hue = null;
  }

  return {
    app,
    fach: fachId,
    subjectIds,
    subjectName,
    bereichIds,
    bereich: bereichId,
    bereichName: bereichId ? (bereichById.get(bereichId)?.name ?? null) : null,
    glyph,
    hue,
    grades,
    school: schoolId,
    schoolName: school?.name ?? null,
    schoolShort: school?.short ?? null,
    zweige: pkg?.zweige ?? null,
    lessons: pkg?.lessons ?? null,
    gebiete: pkg ? [...pkg.gebiete] : [],
    combinationName,
    combinationGlyph,
  };
}

/**
 * Enriches academy cell rows with structured metadata from `academy.json`
 * (or bundled-tile fallback when the index is unavailable).
 */
export function buildAcademyFacet(
  cell: { id: string; appUrl: string | null },
  index: AcademyIndex | null | undefined,
  tile?: AcademyTileHint,
): AcademyCellFacet {
  const taxonomy = taxonomyFromIndex(index);
  const app = academyAppSlug(cell.appUrl ?? cell.id);
  const pkg = index?.pakete.find((p) => p.app === app);
  return resolveFacet(app, pkg, tile, taxonomy);
}

/**
 * Enriches an entire listing with facets and returns the active taxonomy.
 */
export function enrichAcademyCells<
  T extends { id: string; appUrl: string | null },
>(
  cells: readonly T[],
  index: AcademyIndex | null | undefined,
  tileOf?: (id: string) => AcademyTileHint | undefined,
): {
  taxonomy: AcademyTaxonomy;
  cells: Array<T & { facet: AcademyCellFacet }>;
} {
  const taxonomy = taxonomyFromIndex(index);
  const pkgByApp = new Map(
    (index?.pakete ?? []).map((pkg) => [pkg.app, pkg] as const),
  );
  return {
    taxonomy,
    cells: cells.map((cell) => {
      const app = academyAppSlug(cell.appUrl ?? cell.id);
      const pkg = pkgByApp.get(app);
      const facet = resolveFacet(app, pkg, tileOf?.(cell.id), taxonomy);
      return { ...cell, facet };
    }),
  };
}

/** Folds German umlauts/ß so e.g. "franzoesisch" and "französisch" both match. */
function foldGerman(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function searchHaystack(
  cell: AcademyCellBase,
  fachById: Map<string, AcademyFach>,
): { raw: string; folded: string } {
  const f = cell.facet;
  const parts: string[] = [cell.title, cell.description, cell.id];
  if (f) {
    parts.push(f.app);
    if (f.subjectName) parts.push(f.subjectName);
    if (f.combinationName) parts.push(f.combinationName);
    for (const sid of f.subjectIds) {
      parts.push(sid);
      const subject = fachById.get(sid);
      if (subject) parts.push(subject.name);
    }
    if (f.bereichName) parts.push(f.bereichName);
    if (f.schoolName) parts.push(f.schoolName);
    if (f.schoolShort) parts.push(f.schoolShort);
    if (f.zweige) parts.push(f.zweige);
    for (const g of f.gebiete) parts.push(g);
    if (f.grades.length > 0) {
      for (const g of f.grades) {
        parts.push(`klasse ${g}`, `kl. ${g}`, String(g));
      }
    } else {
      parts.push("übergreifend", "jahrgangsübergreifend", "modular");
    }
  }
  const raw = parts.join(" ").toLowerCase();
  return { raw, folded: foldGerman(raw) };
}

function matchesSchool(
  facet: AcademyCellFacet | undefined,
  school: string | null | undefined,
): boolean {
  if (!school) return true;
  if (school === ACADEMY_SCHOOL_INDEPENDENT) {
    return (facet?.school ?? null) === null;
  }
  return facet?.school === school;
}

function matchesGrade(
  facet: AcademyCellFacet | undefined,
  grade: AcademyGradeFilter | undefined,
): boolean {
  if (grade === null || grade === undefined) return true;
  const grades = facet?.grades ?? [];
  if (grade === ACADEMY_GRADE_CROSS) return grades.length === 0;
  return grades.includes(grade);
}

function matchesBereich(
  facet: AcademyCellFacet | undefined,
  bereich: string | null | undefined,
): boolean {
  if (!bereich) return true;
  const ids = facet?.bereichIds ?? [];
  if (bereich === ACADEMY_OTHER_BUCKET) return ids.length === 0;
  return ids.includes(bereich);
}

function matchesSubject(
  facet: AcademyCellFacet | undefined,
  subject: string | null | undefined,
): boolean {
  if (!subject) return true;
  const ids = facet?.subjectIds ?? [];
  if (subject === ACADEMY_OTHER_BUCKET) return ids.length === 0;
  return ids.includes(subject);
}

/**
 * Filters academy cells by school, grade, knowledge area, subject and
 * multi-token search query (every token must match).
 */
export function filterAcademyCells<T extends AcademyCellBase>(
  cells: readonly T[],
  filter: AcademyFilter,
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
): T[] {
  const tokens = (filter.query ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const foldedTokens = tokens.map(foldGerman);
  const fachById =
    tokens.length > 0
      ? new Map(taxonomy.faecher.map((f) => [f.id, f]))
      : new Map<string, AcademyFach>();

  return cells.filter((cell) => {
    if (!matchesSchool(cell.facet, filter.school)) return false;
    if (!matchesGrade(cell.facet, filter.grade)) return false;
    if (!matchesBereich(cell.facet, filter.bereich)) return false;
    if (!matchesSubject(cell.facet, filter.subject)) return false;
    if (tokens.length > 0) {
      const hay = searchHaystack(cell, fachById);
      for (let i = 0; i < tokens.length; i++) {
        if (
          !hay.raw.includes(tokens[i]) &&
          !hay.folded.includes(foldedTokens[i])
        ) {
          return false;
        }
      }
    }
    return true;
  });
}

function schoolOrder(taxonomy: AcademyTaxonomy): Map<string, number> {
  return new Map(taxonomy.schulen.map((s, idx) => [s.id, idx]));
}

/**
 * Stage 1 (Schulsicht): grade tiles (`4`..`13` + `uebergreifend`) that hold
 * at least one matching package.
 */
export function buildAcademyGradeTiles(
  cells: readonly AcademyCellBase[],
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
  schoolFilter: string | null = null,
): AcademyGradeTile[] {
  const scoped = filterAcademyCells(cells, { school: schoolFilter }, taxonomy);
  const buckets = new Map<
    number | typeof ACADEMY_GRADE_CROSS,
    { cells: Map<string, AcademyCellBase>; schools: Set<string> }
  >();
  const schoolShortById = new Map(taxonomy.schulen.map((s) => [s.id, s.short]));
  const order = schoolOrder(taxonomy);

  const add = (
    key: number | typeof ACADEMY_GRADE_CROSS,
    cell: AcademyCellBase,
  ) => {
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { cells: new Map(), schools: new Set() };
      buckets.set(key, bucket);
    }
    bucket.cells.set(cell.id, cell);
    if (cell.facet?.school) bucket.schools.add(cell.facet.school);
  };

  for (const cell of scoped) {
    const grades = cell.facet?.grades ?? [];
    if (grades.length === 0) {
      add(ACADEMY_GRADE_CROSS, cell);
    } else {
      for (const g of grades) add(g, cell);
    }
  }

  const keys = [...buckets.keys()].sort((a, b) => {
    if (a === ACADEMY_GRADE_CROSS) return 1;
    if (b === ACADEMY_GRADE_CROSS) return -1;
    return a - b;
  });

  return keys.map((key) => {
    const bucket = buckets.get(key)!;
    const list = [...bucket.cells.values()];
    const schools = [...bucket.schools]
      .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
      .map((id) => schoolShortById.get(id) ?? id);
    const hue =
      key === ACADEMY_GRADE_CROSS
        ? 190
        : (((235 + (key - 5) * 9) % 360) + 360) % 360;
    return {
      key,
      glyph: key === ACADEMY_GRADE_CROSS ? "∞" : String(key),
      hue,
      total: list.length,
      held: list.filter((c) => c.held).length,
      schools,
    };
  });
}

/**
 * Stage 1 (Weltwissen): knowledge-area tiles (`Sprachen`, `Mathematik`, …)
 * that hold at least one matching package.
 */
export function buildAcademyBereichTiles(
  cells: readonly AcademyCellBase[],
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
  schoolFilter: string | null = null,
): AcademyBereichTile[] {
  const scoped = filterAcademyCells(cells, { school: schoolFilter }, taxonomy);
  const buckets = new Map<
    string,
    { cells: Map<string, AcademyCellBase>; subjects: Set<string> }
  >();
  const bereichById = new Map(taxonomy.bereiche.map((b) => [b.id, b]));
  const firstHue = new Map<string, number>();
  for (const f of taxonomy.faecher) {
    if (!firstHue.has(f.bereich)) firstHue.set(f.bereich, f.hue);
  }

  const add = (bereichId: string, cell: AcademyCellBase) => {
    let bucket = buckets.get(bereichId);
    if (!bucket) {
      bucket = { cells: new Map(), subjects: new Set() };
      buckets.set(bereichId, bucket);
    }
    bucket.cells.set(cell.id, cell);
    for (const sid of cell.facet?.subjectIds ?? []) {
      const f = taxonomy.faecher.find((x) => x.id === sid);
      if (f && f.bereich === bereichId) bucket.subjects.add(sid);
    }
  };

  for (const cell of scoped) {
    const ids = cell.facet?.bereichIds ?? [];
    if (ids.length === 0) {
      add(ACADEMY_OTHER_BUCKET, cell);
    } else {
      for (const id of ids) add(id, cell);
    }
  }

  const orderedIds = [
    ...taxonomy.bereiche.map((b) => b.id).filter((id) => buckets.has(id)),
    ...[...buckets.keys()].filter(
      (id) => !bereichById.has(id) && id !== ACADEMY_OTHER_BUCKET,
    ),
    ...(buckets.has(ACADEMY_OTHER_BUCKET) ? [ACADEMY_OTHER_BUCKET] : []),
  ];

  return orderedIds.map((id) => {
    const bucket = buckets.get(id)!;
    const list = [...bucket.cells.values()];
    const info = bereichById.get(id);
    return {
      id,
      name: info?.name ?? null,
      glyph: info?.glyph ?? "✦",
      hue: firstHue.get(id) ?? 230,
      total: list.length,
      held: list.filter((c) => c.held).length,
      subjectCount: bucket.subjects.size,
    };
  });
}

/**
 * Stage 2 (both lenses): subject tiles within the chosen grade or knowledge
 * area, keeping subject hue/glyph and school badges (including Fachverbunde).
 */
export function buildAcademySubjectTiles(
  cells: readonly AcademyCellBase[],
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
  scope: {
    school?: string | null;
    grade?: AcademyGradeFilter;
    bereich?: string | null;
  } = {},
): AcademySubjectTile[] {
  const scoped = filterAcademyCells(
    cells,
    { school: scope.school, grade: scope.grade, bereich: scope.bereich },
    taxonomy,
  );
  const fachById = new Map(taxonomy.faecher.map((f) => [f.id, f]));
  const schoolById = new Map(taxonomy.schulen.map((s) => [s.id, s]));
  const order = schoolOrder(taxonomy);

  const buckets = new Map<
    string,
    {
      cells: Map<string, AcademyCellBase>;
      schools: Map<string, AcademySubjectSchoolBadge>;
    }
  >();

  const add = (subjectId: string, cell: AcademyCellBase) => {
    let bucket = buckets.get(subjectId);
    if (!bucket) {
      bucket = { cells: new Map(), schools: new Map() };
      buckets.set(subjectId, bucket);
    }
    bucket.cells.set(cell.id, cell);
    const schoolId = cell.facet?.school;
    if (schoolId && !bucket.schools.has(schoolId)) {
      const s = schoolById.get(schoolId);
      bucket.schools.set(schoolId, {
        id: schoolId,
        short: s?.short ?? schoolId,
        combination: cell.facet?.combinationName ?? null,
        combinationGlyph: cell.facet?.combinationGlyph ?? null,
      });
    }
  };

  for (const cell of scoped) {
    const knownSubjects = (cell.facet?.subjectIds ?? []).filter((sid) => {
      const f = fachById.get(sid);
      if (!f) return false;
      if (scope.bereich && scope.bereich !== ACADEMY_OTHER_BUCKET) {
        return f.bereich === scope.bereich;
      }
      return true;
    });
    if (knownSubjects.length === 0) {
      add(ACADEMY_OTHER_BUCKET, cell);
    } else {
      for (const sid of knownSubjects) add(sid, cell);
    }
  }

  const orderedIds = [
    ...taxonomy.faecher.map((f) => f.id).filter((id) => buckets.has(id)),
    ...(buckets.has(ACADEMY_OTHER_BUCKET) ? [ACADEMY_OTHER_BUCKET] : []),
  ];

  return orderedIds.map((id) => {
    const bucket = buckets.get(id)!;
    const list = [...bucket.cells.values()];
    const f = fachById.get(id);
    const schools = [...bucket.schools.values()].sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
    );
    return {
      id,
      name: f?.name ?? null,
      glyph: f?.glyph ?? "✦",
      hue: f?.hue ?? 225,
      total: list.length,
      held: list.filter((c) => c.held).length,
      schools,
    };
  });
}

/**
 * Available school options with package counts for the current scope.
 * Includes `ACADEMY_SCHOOL_INDEPENDENT` when school-independent packages
 * (such as UML) exist alongside school packages.
 */
export function buildAcademySchoolOptions(
  cells: readonly AcademyCellBase[],
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
  scope: {
    grade?: AcademyGradeFilter;
    bereich?: string | null;
    subject?: string | null;
    query?: string;
  } = {},
): AcademySchoolOption[] {
  const scoped = filterAcademyCells(cells, scope, taxonomy);
  const buckets = new Map<string, Map<string, AcademyCellBase>>();

  for (const cell of scoped) {
    const key = cell.facet?.school ?? ACADEMY_SCHOOL_INDEPENDENT;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = new Map();
      buckets.set(key, bucket);
    }
    bucket.set(cell.id, cell);
  }

  const schoolById = new Map(taxonomy.schulen.map((s) => [s.id, s]));
  const orderedIds = [
    ...taxonomy.schulen.map((s) => s.id).filter((id) => buckets.has(id)),
    ...[...buckets.keys()].filter(
      (id) => !schoolById.has(id) && id !== ACADEMY_SCHOOL_INDEPENDENT,
    ),
    ...(buckets.has(ACADEMY_SCHOOL_INDEPENDENT)
      ? [ACADEMY_SCHOOL_INDEPENDENT]
      : []),
  ];

  return orderedIds.map((id) => {
    const list = [...buckets.get(id)!.values()];
    const s = schoolById.get(id);
    return {
      id,
      name: s?.name ?? null,
      short: s?.short ?? null,
      total: list.length,
      held: list.filter((c) => c.held).length,
    };
  });
}

/**
 * Sorts academy cells cleanly for display: by lowest grade ascending
 * (cross-grade at the end), then school order, then title.
 */
export function sortAcademyCellsForDisplay<T extends AcademyCellBase>(
  cells: readonly T[],
  taxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY,
): T[] {
  const order = schoolOrder(taxonomy);
  return [...cells].sort((a, b) => {
    const ga = a.facet?.grades[0] ?? 99;
    const gb = b.facet?.grades[0] ?? 99;
    if (ga !== gb) return ga - gb;
    const sa = a.facet?.school ? (order.get(a.facet.school) ?? 90) : 99;
    const sb = b.facet?.school ? (order.get(b.facet.school) ?? 90) : 99;
    if (sa !== sb) return sa - sb;
    return a.title.localeCompare(b.title, "de");
  });
}

/**
 * Formats a grade list compactly, e.g. `[8]` -> `"Klasse 8"`,
 * `[6, 7, 8]` -> `"Klassen 6–8"`, `[]` -> `"Übergreifend"`.
 */
export function formatAcademyGrades(
  grades: readonly number[],
  labels: {
    gradeSingle: (n: number) => string;
    gradeRange: (range: string) => string;
    crossGrade: string;
  },
): string {
  if (grades.length === 0) return labels.crossGrade;
  if (grades.length === 1) return labels.gradeSingle(grades[0]);
  const consecutive = grades.every((g, i) => g === grades[0] + i);
  const span = consecutive
    ? `${grades[0]}–${grades[grades.length - 1]}`
    : grades.join(", ");
  return labels.gradeRange(span);
}
