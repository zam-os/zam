/**
 * Bundled LehrplanPLUS (Bayern) taxonomy manifest.
 *
 * Per ADR 2026-07-02, this manifest is refreshed by an agent once per
 * school year (not a scraper script), because an agent can adapt to a
 * redesigned page or a moved link the way a brittle parser cannot. Each
 * refresh is expected to add or revise entries rather than replace the
 * whole file — `capturedOn` marks when a given branch was last verified
 * against the live site.
 *
 * Every entry below was captured by navigating https://www.lehrplanplus.bayern.de
 * on `capturedOn`; nothing here is inferred or guessed. Coverage is
 * intentionally partial — only Realschule, grade 9, and three subjects are
 * curated so far. Extending coverage (more grades, subjects, or school
 * types) is future agent work, not a Phase 1 requirement.
 */

import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplanPlusBayernManifest {
  /** Bavarian school year this branch of the manifest was captured for. */
  schoolYear: string;
  /** Date the entries below were last verified against the live site. */
  capturedOn: string;
  /** The official curriculum edition these entries were read from. */
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  /** Verified grade options, keyed by school-type id. */
  grades: Record<string, string[]>;
  /** Verified subject catalog, keyed by school-type id. */
  subjects: Record<string, TaxonomyNode[]>;
  /** Verified track (Ausprägung) options, keyed by "schoolType|grade|subject". */
  tracks: Record<string, TaxonomyNode[]>;
  /** Verified Lernbereiche, keyed by "schoolType|grade|subject[|track]". */
  topics: Record<string, ManifestTopic[]>;
  /** Verified content-page URL, keyed the same way as `topics`. */
  contentUrls: Record<string, string>;
}

export const LEHRPLANPLUS_BAYERN_MANIFEST: LehrplanPlusBayernManifest = {
  schoolYear: "2026/2027",
  capturedOn: "2026-07-02",
  sourceRevision: "LehrplanPLUS Realschule – Oktober 2023",

  schoolTypes: [
    { id: "grundschule", label: "Grundschule" },
    { id: "mittelschule", label: "Mittelschule" },
    { id: "foerderschule", label: "Förderschule" },
    { id: "realschule", label: "Realschule" },
    { id: "gymnasium", label: "Gymnasium" },
    { id: "wirtschaftsschule", label: "Wirtschaftsschule" },
    { id: "fos", label: "Fachoberschule" },
    { id: "bos", label: "Berufsoberschule" },
  ],

  grades: {
    realschule: ["5", "6", "7", "8", "9", "10"],
  },

  subjects: {
    realschule: [
      {
        id: "bwl-rechnungswesen",
        label: "Betriebswirtschaftslehre / Rechnungswesen",
      },
      { id: "biologie", label: "Biologie" },
      { id: "chemie", label: "Chemie" },
      { id: "deutsch", label: "Deutsch" },
      { id: "englisch", label: "Englisch" },
      { id: "ernaehrung_und_gesundheit", label: "Ernährung und Gesundheit" },
      { id: "ethik", label: "Ethik" },
      {
        id: "evangelische-religionslehre",
        label: "Evangelische Religionslehre",
      },
      { id: "franzoesisch", label: "Französisch" },
      { id: "geographie", label: "Geographie" },
      { id: "geschichte", label: "Geschichte" },
      { id: "it", label: "Informationstechnologie" },
      { id: "iu", label: "Islamischer Unterricht" },
      { id: "ir", label: "Israelitische Religionslehre" },
      {
        id: "katholische-religionslehre",
        label: "Katholische Religionslehre",
      },
      { id: "kunst", label: "Kunst" },
      { id: "mathematik", label: "Mathematik" },
      { id: "musik", label: "Musik" },
      { id: "or", label: "Orthodoxe Religionslehre" },
      { id: "physik", label: "Physik" },
      { id: "pug", label: "Politik und Gesellschaft" },
      { id: "soziallehre", label: "Soziallehre" },
      { id: "sozialwesen", label: "Sozialwesen" },
      { id: "spanisch", label: "Spanisch" },
      { id: "sport", label: "Sport" },
      { id: "textiles-gestalten", label: "Textiles Gestalten" },
      { id: "werken", label: "Werken" },
      { id: "wirtschaft-und-recht", label: "Wirtschaft und Recht" },
    ],
  },

  tracks: {
    "realschule|9|mathematik": [
      { id: "wpfg1", label: "Mathematik 9 (I)" },
      { id: "wpfg2-3", label: "Mathematik 9 (II/III)" },
    ],
  },

  topics: {
    "realschule|9|mathematik|wpfg1": [
      { id: "lb1", label: "Reelle Zahlen", hours: 10 },
      { id: "lb2", label: "Zentrische Streckung", hours: 17 },
      { id: "lb3", label: "Rechtwinklige Dreiecke", hours: 20 },
      { id: "lb4", label: "Kreis", hours: 10 },
      { id: "lb5", label: "Raumgeometrie", hours: 20 },
      { id: "lb6", label: "Systeme linearer Gleichungen", hours: 12 },
      {
        id: "lb7",
        label: "Quadratische Funktionen und quadratische Gleichungen",
        hours: 42,
      },
      { id: "lb8", label: "Daten und Zufall", hours: 9 },
    ],
    "realschule|9|mathematik|wpfg2-3": [
      { id: "lb1", label: "Reelle Zahlen", hours: 7 },
      { id: "lb2", label: "Zentrische Streckung", hours: 13 },
      { id: "lb3", label: "Rechtwinklige Dreiecke", hours: 20 },
      { id: "lb4", label: "Kreis", hours: 10 },
      { id: "lb5", label: "Lineare Funktionen", hours: 15 },
      { id: "lb6", label: "Systeme linearer Gleichungen", hours: 10 },
      { id: "lb7", label: "Daten und Zufall", hours: 9 },
    ],
    "realschule|9|deutsch": [
      { id: "lb1", label: "Sprechen und Zuhören" },
      { id: "lb2", label: "Lesen – mit Texten und weiteren Medien umgehen" },
      { id: "lb3", label: "Schreiben" },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|9|englisch": [
      { id: "lb1", label: "Kommunikative Kompetenzen" },
      { id: "lb2", label: "Interkulturelle Kompetenzen" },
      { id: "lb3", label: "Text- und Medienkompetenzen" },
      { id: "lb4", label: "Methodische Kompetenzen" },
      { id: "lb5", label: "Themengebiete" },
    ],
  },

  contentUrls: {
    "realschule|9|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|9|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|9|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|9|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/englisch/inhalt/fachlehrplaene",
  },
};
