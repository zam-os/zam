import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface MvCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Mecklenburg-Vorpommern Rahmenpläne catalog (Bildungsserver MV).
 *
 * Captured 2026-07-20 from
 * https://www.bildung-mv.de/unterricht/rahmenplaene/rahmenplaene-fuer-die-allgemein-bildenden-faecher/
 * Content URLs are official PDF Rahmenpläne under
 * /export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/
 *
 * School types: Grundschule, Orientierungsstufe, Regionale Schule, Gymnasium
 * Sek I, Gymnasiale Oberstufe, Förderschule Lernen, Förderschule geistige
 * Entwicklung. Berufliche Bildungsgänge / FOS / Fachgymnasium out of scope;
 * auslaufende Fassungen preferred only when no aufwachsende exists.
 */
export interface RahmenplanMvManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: MvCatalogPath[];
}

export const RAHMENPLAN_MV_MANIFEST: RahmenplanMvManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision:
    "Bildungsserver MV Rahmenpläne (allgemeinbildend + Förderschulen)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "orientierungsstufe",
      label: "Orientierungsstufe",
    },
    {
      id: "regionale-schule",
      label: "Regionale Schule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium (Sek I)",
    },
    {
      id: "gymnasiale-oberstufe",
      label: "Gymnasiale Oberstufe",
    },
    {
      id: "foerderschule-lernen",
      label: "Förderschule Lernen",
    },
    {
      id: "foerderschule-geistige-entwicklung",
      label: "Förderschule geistige Entwicklung",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    orientierungsstufe: ["5", "6"],
    "regionale-schule": ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "gymnasiale-oberstufe": ["11", "12", "13"],
    "foerderschule-lernen": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    "foerderschule-geistige-entwicklung": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ],
  },

  subjects: {
    grundschule: [
      {
        id: "theater",
        label: "Darstellendes Spiel / Theater",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "fremdsprachen",
        label: "Fremdsprachen (Grundschule)",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst und Gestaltung",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "niederdeutsch",
        label: "Niederdeutsch",
      },
      {
        id: "philosophieren-mit-kindern",
        label: "Philosophieren mit Kindern",
      },
      {
        id: "sachunterricht",
        label: "Sachunterricht",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "werken",
        label: "Werken",
      },
    ],
    orientierungsstufe: [
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "theater",
        label: "Darstellendes Spiel / Theater",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "geografie",
        label: "Geografie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst und Gestaltung",
      },
      {
        id: "latein",
        label: "Latein",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "naturwissenschaften",
        label: "Naturwissenschaften Orientierungsstufe",
      },
      {
        id: "philosophieren-mit-kindern",
        label: "Philosophieren mit Kindern",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "weltkunde",
        label: "Weltkunde Orientierungsstufe",
      },
      {
        id: "werken",
        label: "Werken",
      },
    ],
    "regionale-schule": [
      {
        id: "awt",
        label: "Arbeit-Wirtschaft-Technik",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "theater",
        label: "Darstellendes Spiel / Theater",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "geografie",
        label: "Geografie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "informatik",
        label: "Informatik und Medienbildung",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst und Gestaltung",
      },
      {
        id: "latein",
        label: "Latein",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "naturwissenschaften",
        label: "Naturwissenschaften Orientierungsstufe",
      },
      {
        id: "philosophieren-mit-kindern",
        label: "Philosophieren mit Kindern",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "sozialkunde",
        label: "Politische Bildung / Sozialkunde",
      },
      {
        id: "polnisch",
        label: "Polnisch",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "schwedisch",
        label: "Schwedisch",
      },
      {
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "weltkunde",
        label: "Weltkunde Orientierungsstufe",
      },
      {
        id: "werken",
        label: "Werken",
      },
    ],
    gymnasium: [
      {
        id: "awt",
        label: "Arbeit-Wirtschaft-Technik",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "theater",
        label: "Darstellendes Spiel / Theater",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "geografie",
        label: "Geografie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "informatik",
        label: "Informatik und Medienbildung",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst und Gestaltung",
      },
      {
        id: "latein",
        label: "Latein",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "naturwissenschaften",
        label: "Naturwissenschaften Orientierungsstufe",
      },
      {
        id: "philosophieren-mit-kindern",
        label: "Philosophieren mit Kindern",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "sozialkunde",
        label: "Politische Bildung / Sozialkunde",
      },
      {
        id: "polnisch",
        label: "Polnisch",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "schwedisch",
        label: "Schwedisch",
      },
      {
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "weltkunde",
        label: "Weltkunde Orientierungsstufe",
      },
      {
        id: "werken",
        label: "Werken",
      },
    ],
    "gymnasiale-oberstufe": [
      {
        id: "berufliche-orientierung",
        label: "Berufliche Orientierung",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "geografie",
        label: "Geografie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "informatik",
        label: "Informatik und Medienbildung",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst und Gestaltung",
      },
      {
        id: "latein",
        label: "Latein",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "philosophie",
        label: "Philosophie",
      },
      {
        id: "sozialkunde",
        label: "Politische Bildung / Sozialkunde",
      },
      {
        id: "polnisch",
        label: "Polnisch",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "schwedisch",
        label: "Schwedisch",
      },
      {
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "wirtschaft",
        label: "Wirtschaft",
      },
    ],
    "foerderschule-lernen": [
      {
        id: "deutsche-gebaerdensprache",
        label: "Deutsche Gebärdensprache",
      },
      {
        id: "band-i",
        label: "Rahmenplan Band I",
      },
    ],
    "foerderschule-geistige-entwicklung": [
      {
        id: "geistige-entwicklung",
        label: "Geistige Entwicklung",
      },
      {
        id: "religionen",
        label: "Religionen",
      },
    ],
  },

  tracks: {},

  topics: {
    "foerderschule-geistige-entwicklung|10|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|religionen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|band-i": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|deutsche-gebaerdensprache": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "grundschule|1|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|1|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|1|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "grundschule|2|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|2|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|2|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "grundschule|3|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|3|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|3|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "grundschule|4|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|4|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasiale-oberstufe|11|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|mathematik": [
      { id: "analysis", label: "Analysis" },
      {
        id: "lineare-algebra",
        label: "Lineare Algebra / Analytische Geometrie",
      },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasiale-oberstufe|11|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|12|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|12|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasiale-oberstufe|12|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|mathematik": [
      { id: "analysis", label: "Analysis" },
      {
        id: "lineare-algebra",
        label: "Lineare Algebra / Analytische Geometrie",
      },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasiale-oberstufe|12|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|13|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|13|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasiale-oberstufe|13|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|mathematik": [
      { id: "analysis", label: "Analysis" },
      {
        id: "lineare-algebra",
        label: "Lineare Algebra / Analytische Geometrie",
      },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasiale-oberstufe|13|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "orientierungsstufe|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|5|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "orientierungsstufe|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|5|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|5|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "orientierungsstufe|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|6|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "orientierungsstufe|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "orientierungsstufe|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|6|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "orientierungsstufe|6|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "orientierungsstufe|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|10|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|10|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|5|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|5|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|5|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|6|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|6|philosophieren-mit-kindern": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|6|weltkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|7|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|7|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|8|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|8|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|awt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regionale-schule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regionale-schule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regionale-schule|9|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|schwedisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regionale-schule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regionale-schule|9|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "foerderschule-geistige-entwicklung|10|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|10|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|1|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|1|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|2|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|2|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|3|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|3|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|4|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|4|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|5|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|5|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|6|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|6|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|7|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|7|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|8|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|8|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-geistige-entwicklung|9|geistige-entwicklung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_geistige_Entwicklung.pdf",
    "foerderschule-geistige-entwicklung|9|religionen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geistige_entwicklung_religionen.pdf",
    "foerderschule-lernen|10|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|10|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|1|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|1|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|2|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|2|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|3|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|3|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|4|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|4|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|5|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|5|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|6|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|6|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|7|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|7|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|8|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|8|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "foerderschule-lernen|9|band-i":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-foerderschule-band-2.pdf",
    "foerderschule-lernen|9|deutsche-gebaerdensprache":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Deutsche-Gebaerdensprache-1-10-2026.pdf",
    "grundschule|1|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_1-4_2024.pdf",
    "grundschule|1|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-evrel-gs.pdf",
    "grundschule|1|fremdsprachen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_fremdsprachen-gs.pdf",
    "grundschule|1|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-katrel-gs.pdf",
    "grundschule|1|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ku_1-4_2024.pdf",
    "grundschule|1|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ma_1-4_2024.pdf",
    "grundschule|1|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Musik_1-4_2024.pdf",
    "grundschule|1|niederdeutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-niederdeutsch-grundschulen-berufliche-schulen.pdf",
    "grundschule|1|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-philosophie-gs.pdf",
    "grundschule|1|sachunterricht":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GS_Sachunterricht.pdf",
    "grundschule|1|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-sport-gs.pdf",
    "grundschule|1|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_darstellendes_spiel_grundschule.pdf",
    "grundschule|1|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Werken_1-4_2024.pdf",
    "grundschule|2|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_1-4_2024.pdf",
    "grundschule|2|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-evrel-gs.pdf",
    "grundschule|2|fremdsprachen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_fremdsprachen-gs.pdf",
    "grundschule|2|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-katrel-gs.pdf",
    "grundschule|2|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ku_1-4_2024.pdf",
    "grundschule|2|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ma_1-4_2024.pdf",
    "grundschule|2|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Musik_1-4_2024.pdf",
    "grundschule|2|niederdeutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-niederdeutsch-grundschulen-berufliche-schulen.pdf",
    "grundschule|2|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-philosophie-gs.pdf",
    "grundschule|2|sachunterricht":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GS_Sachunterricht.pdf",
    "grundschule|2|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-sport-gs.pdf",
    "grundschule|2|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_darstellendes_spiel_grundschule.pdf",
    "grundschule|2|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Werken_1-4_2024.pdf",
    "grundschule|3|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_1-4_2024.pdf",
    "grundschule|3|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-evrel-gs.pdf",
    "grundschule|3|fremdsprachen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_fremdsprachen-gs.pdf",
    "grundschule|3|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-katrel-gs.pdf",
    "grundschule|3|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ku_1-4_2024.pdf",
    "grundschule|3|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ma_1-4_2024.pdf",
    "grundschule|3|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Musik_1-4_2024.pdf",
    "grundschule|3|niederdeutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-niederdeutsch-grundschulen-berufliche-schulen.pdf",
    "grundschule|3|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-philosophie-gs.pdf",
    "grundschule|3|sachunterricht":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GS_Sachunterricht.pdf",
    "grundschule|3|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-sport-gs.pdf",
    "grundschule|3|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_darstellendes_spiel_grundschule.pdf",
    "grundschule|3|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Werken_1-4_2024.pdf",
    "grundschule|4|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_1-4_2024.pdf",
    "grundschule|4|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-evrel-gs.pdf",
    "grundschule|4|fremdsprachen":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_fremdsprachen-gs.pdf",
    "grundschule|4|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-katrel-gs.pdf",
    "grundschule|4|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ku_1-4_2024.pdf",
    "grundschule|4|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Ma_1-4_2024.pdf",
    "grundschule|4|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Musik_1-4_2024.pdf",
    "grundschule|4|niederdeutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-niederdeutsch-grundschulen-berufliche-schulen.pdf",
    "grundschule|4|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-philosophie-gs.pdf",
    "grundschule|4|sachunterricht":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GS_Sachunterricht.pdf",
    "grundschule|4|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-sport-gs.pdf",
    "grundschule|4|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_darstellendes_spiel_grundschule.pdf",
    "grundschule|4|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Werken_1-4_2024.pdf",
    "gymnasiale-oberstufe|11|berufliche-orientierung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SEK2_BO-Endfassung_.pdf",
    "gymnasiale-oberstufe|11|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_SEK2_Erprobuingsfassung.pdf",
    "gymnasiale-oberstufe|11|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-II-2026.pdf",
    "gymnasiale-oberstufe|11|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DEU_SEK2_2019.pdf",
    "gymnasiale-oberstufe|11|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EN_SEK2.pdf",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EVANGR_SEK2.pdf",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_FRZ_SEK2.pdf",
    "gymnasiale-oberstufe|11|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GEO_SEK2.pdf",
    "gymnasiale-oberstufe|11|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Geschichte_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|11|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_SEK2.pdf",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KATHR_SEK2.pdf",
    "gymnasiale-oberstufe|11|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_SEK2.pdf",
    "gymnasiale-oberstufe|11|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_LAT_SEK2.pdf",
    "gymnasiale-oberstufe|11|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MA_SEK2.pdf",
    "gymnasiale-oberstufe|11|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_SEK2.pdf",
    "gymnasiale-oberstufe|11|philosophie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_PHILO_SEK2.pdf",
    "gymnasiale-oberstufe|11|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_POLN_SEK2.pdf",
    "gymnasiale-oberstufe|11|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_RUS_SEK2.pdf",
    "gymnasiale-oberstufe|11|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SCHWED_SEK2.pdf",
    "gymnasiale-oberstufe|11|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Politische_Bildung_Sozialkunde_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|11|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SPAN_SEK2.pdf",
    "gymnasiale-oberstufe|11|wirtschaft":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_WIRT_SEK2.pdf",
    "gymnasiale-oberstufe|12|berufliche-orientierung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SEK2_BO-Endfassung_.pdf",
    "gymnasiale-oberstufe|12|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_SEK2_Erprobuingsfassung.pdf",
    "gymnasiale-oberstufe|12|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-II-2026.pdf",
    "gymnasiale-oberstufe|12|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DEU_SEK2_2019.pdf",
    "gymnasiale-oberstufe|12|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EN_SEK2.pdf",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EVANGR_SEK2.pdf",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_FRZ_SEK2.pdf",
    "gymnasiale-oberstufe|12|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GEO_SEK2.pdf",
    "gymnasiale-oberstufe|12|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Geschichte_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|12|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_SEK2.pdf",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KATHR_SEK2.pdf",
    "gymnasiale-oberstufe|12|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_SEK2.pdf",
    "gymnasiale-oberstufe|12|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_LAT_SEK2.pdf",
    "gymnasiale-oberstufe|12|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MA_SEK2.pdf",
    "gymnasiale-oberstufe|12|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_SEK2.pdf",
    "gymnasiale-oberstufe|12|philosophie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_PHILO_SEK2.pdf",
    "gymnasiale-oberstufe|12|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_POLN_SEK2.pdf",
    "gymnasiale-oberstufe|12|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_RUS_SEK2.pdf",
    "gymnasiale-oberstufe|12|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SCHWED_SEK2.pdf",
    "gymnasiale-oberstufe|12|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Politische_Bildung_Sozialkunde_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|12|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SPAN_SEK2.pdf",
    "gymnasiale-oberstufe|12|wirtschaft":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_WIRT_SEK2.pdf",
    "gymnasiale-oberstufe|13|berufliche-orientierung":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SEK2_BO-Endfassung_.pdf",
    "gymnasiale-oberstufe|13|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_SEK2_Erprobuingsfassung.pdf",
    "gymnasiale-oberstufe|13|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-II-2026.pdf",
    "gymnasiale-oberstufe|13|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DEU_SEK2_2019.pdf",
    "gymnasiale-oberstufe|13|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EN_SEK2.pdf",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_EVANGR_SEK2.pdf",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_FRZ_SEK2.pdf",
    "gymnasiale-oberstufe|13|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_GEO_SEK2.pdf",
    "gymnasiale-oberstufe|13|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Geschichte_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|13|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_SEK2.pdf",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KATHR_SEK2.pdf",
    "gymnasiale-oberstufe|13|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_SEK2.pdf",
    "gymnasiale-oberstufe|13|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_LAT_SEK2.pdf",
    "gymnasiale-oberstufe|13|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MA_SEK2.pdf",
    "gymnasiale-oberstufe|13|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_SEK2.pdf",
    "gymnasiale-oberstufe|13|philosophie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_PHILO_SEK2.pdf",
    "gymnasiale-oberstufe|13|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_POLN_SEK2.pdf",
    "gymnasiale-oberstufe|13|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_RUS_SEK2.pdf",
    "gymnasiale-oberstufe|13|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SCHWED_SEK2.pdf",
    "gymnasiale-oberstufe|13|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Rahmenplan_Politische_Bildung_Sozialkunde_Sekundarbereich_II_2026.pdf",
    "gymnasiale-oberstufe|13|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_SPAN_SEK2.pdf",
    "gymnasiale-oberstufe|13|wirtschaft":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_WIRT_SEK2.pdf",
    "gymnasium|10|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_gym_.pdf",
    "gymnasium|10|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|10|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarberiech-I-Gym-2026.pdf",
    "gymnasium|10|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I__Gym_Ges_2025.pdf",
    "gymnasium|10|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_Gym_2025.pdf",
    "gymnasium|10|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_Gym_2025.pdf",
    "gymnasium|10|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_gym_.pdf",
    "gymnasium|10|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_gym.pdf",
    "gymnasium|10|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_AHR_5-10.pdf",
    "gymnasium|10|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Kunst_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|10|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|10|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|10|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Musik_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|10|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|10|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_Gym_2025.pdf",
    "gymnasium|10|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_Gym_2025.pdf",
    "gymnasium|10|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_Gym_2025.pdf",
    "gymnasium|10|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "gymnasium|10|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_Gym_2025.pdf",
    "gymnasium|10|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "gymnasium|10|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_AHR_7-10.pdf",
    "gymnasium|5|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "gymnasium|5|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "gymnasium|5|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "gymnasium|5|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "gymnasium|5|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "gymnasium|5|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "gymnasium|5|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "gymnasium|5|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "gymnasium|5|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "gymnasium|5|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|5|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "gymnasium|5|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "gymnasium|5|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "gymnasium|5|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "gymnasium|5|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "gymnasium|5|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "gymnasium|5|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "gymnasium|5|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "gymnasium|5|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "gymnasium|6|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "gymnasium|6|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "gymnasium|6|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "gymnasium|6|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "gymnasium|6|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "gymnasium|6|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "gymnasium|6|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "gymnasium|6|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "gymnasium|6|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "gymnasium|6|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|6|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "gymnasium|6|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "gymnasium|6|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "gymnasium|6|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "gymnasium|6|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "gymnasium|6|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "gymnasium|6|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "gymnasium|6|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "gymnasium|6|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "gymnasium|7|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_gym_.pdf",
    "gymnasium|7|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|7|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarberiech-I-Gym-2026.pdf",
    "gymnasium|7|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I__Gym_Ges_2025.pdf",
    "gymnasium|7|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_Gym_2025.pdf",
    "gymnasium|7|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_Gym_2025.pdf",
    "gymnasium|7|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_gym_.pdf",
    "gymnasium|7|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_gym.pdf",
    "gymnasium|7|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_AHR_5-10.pdf",
    "gymnasium|7|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Kunst_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|7|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|7|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|7|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Musik_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|7|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|7|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_Gym_2025.pdf",
    "gymnasium|7|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_Gym_2025.pdf",
    "gymnasium|7|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_Gym_2025.pdf",
    "gymnasium|7|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "gymnasium|7|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_Gym_2025.pdf",
    "gymnasium|7|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "gymnasium|7|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_AHR_7-10.pdf",
    "gymnasium|8|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_gym_.pdf",
    "gymnasium|8|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|8|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarberiech-I-Gym-2026.pdf",
    "gymnasium|8|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I__Gym_Ges_2025.pdf",
    "gymnasium|8|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_Gym_2025.pdf",
    "gymnasium|8|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_Gym_2025.pdf",
    "gymnasium|8|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_gym_.pdf",
    "gymnasium|8|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_gym.pdf",
    "gymnasium|8|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_AHR_5-10.pdf",
    "gymnasium|8|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Kunst_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|8|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|8|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|8|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Musik_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|8|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|8|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_Gym_2025.pdf",
    "gymnasium|8|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_Gym_2025.pdf",
    "gymnasium|8|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_Gym_2025.pdf",
    "gymnasium|8|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "gymnasium|8|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_Gym_2025.pdf",
    "gymnasium|8|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "gymnasium|8|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_AHR_7-10.pdf",
    "gymnasium|9|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_gym_.pdf",
    "gymnasium|9|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|9|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarberiech-I-Gym-2026.pdf",
    "gymnasium|9|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I__Gym_Ges_2025.pdf",
    "gymnasium|9|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_Gym_2025.pdf",
    "gymnasium|9|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_Gym_2025.pdf",
    "gymnasium|9|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_gym_.pdf",
    "gymnasium|9|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_gym.pdf",
    "gymnasium|9|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_AHR_5-10.pdf",
    "gymnasium|9|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Kunst_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|9|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "gymnasium|9|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|9|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Musik_Gym_Sekundarbereich_I_2026.pdf",
    "gymnasium|9|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-Gym-2026.pdf",
    "gymnasium|9|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_Gym_2025.pdf",
    "gymnasium|9|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_Gym_2025.pdf",
    "gymnasium|9|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_Gym_2025.pdf",
    "gymnasium|9|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "gymnasium|9|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_Gym_2025.pdf",
    "gymnasium|9|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "gymnasium|9|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_AHR_7-10.pdf",
    "orientierungsstufe|5|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "orientierungsstufe|5|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "orientierungsstufe|5|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|5|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "orientierungsstufe|5|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|5|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "orientierungsstufe|5|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "orientierungsstufe|5|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "orientierungsstufe|5|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "orientierungsstufe|5|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-latein-5-6.pdf",
    "orientierungsstufe|5|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|5|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "orientierungsstufe|5|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "orientierungsstufe|5|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|5|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "orientierungsstufe|5|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "orientierungsstufe|5|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "orientierungsstufe|5|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "orientierungsstufe|5|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "orientierungsstufe|6|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "orientierungsstufe|6|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "orientierungsstufe|6|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|6|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "orientierungsstufe|6|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|6|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "orientierungsstufe|6|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "orientierungsstufe|6|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "orientierungsstufe|6|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "orientierungsstufe|6|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-latein-5-6.pdf",
    "orientierungsstufe|6|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|6|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "orientierungsstufe|6|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "orientierungsstufe|6|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "orientierungsstufe|6|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "orientierungsstufe|6|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "orientierungsstufe|6|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "orientierungsstufe|6|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "orientierungsstufe|6|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "regionale-schule|10|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_regs.pdf",
    "regionale-schule|10|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|10|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|10|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I_Reg_2025.pdf",
    "regionale-schule|10|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_RegS_2025.pdf",
    "regionale-schule|10|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_RegS_2025.pdf",
    "regionale-schule|10|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_regs_.pdf",
    "regionale-schule|10|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_regs.pdf",
    "regionale-schule|10|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_MR_5-10.pdf",
    "regionale-schule|10|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_5_RP_KU_MR_7-10_final1.pdf",
    "regionale-schule|10|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|10|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|10|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_6_RP_MUS_MR_7-10_final1.pdf",
    "regionale-schule|10|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|10|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_RegS_2025.pdf",
    "regionale-schule|10|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_RegS_2025.pdf",
    "regionale-schule|10|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_RegS_2025.pdf",
    "regionale-schule|10|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "regionale-schule|10|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_RegS_2025.pdf",
    "regionale-schule|10|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "regionale-schule|10|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_MR_7-10.pdf",
    "regionale-schule|5|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "regionale-schule|5|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "regionale-schule|5|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "regionale-schule|5|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "regionale-schule|5|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "regionale-schule|5|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "regionale-schule|5|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "regionale-schule|5|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "regionale-schule|5|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "regionale-schule|5|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|5|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "regionale-schule|5|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "regionale-schule|5|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "regionale-schule|5|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "regionale-schule|5|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "regionale-schule|5|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "regionale-schule|5|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "regionale-schule|5|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "regionale-schule|5|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "regionale-schule|6|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_BIO_OS.pdf",
    "regionale-schule|6|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_5-6_2025.pdf",
    "regionale-schule|6|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Englisch-Orientierungsstufe-2026.pdf",
    "regionale-schule|6|evangelische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_ev_Rel_5-6_OS_2025.pdf",
    "regionale-schule|6|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Franzoessich-Orientierungsstufe-2026.pdf",
    "regionale-schule|6|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Geo_5-6_OS_2025.pdf",
    "regionale-schule|6|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Ges_5-6_OS_2025.pdf",
    "regionale-schule|6|katholische-religion":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_kath_Rel_5-6_OS_2025.pdf",
    "regionale-schule|6|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_KU_OS.pdf",
    "regionale-schule|6|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|6|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Orientierungsstufe-2026.pdf",
    "regionale-schule|6|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_MUS_OS.pdf",
    "regionale-schule|6|naturwissenschaften":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "regionale-schule|6|philosophieren-mit-kindern":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Philosophieren-m.K.-Orientierungsstufe-2026.pdf",
    "regionale-schule|6|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_NaWi_OS.pdf",
    "regionale-schule|6|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Sport_5-6_OS_2025.pdf",
    "regionale-schule|6|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_DS_OS.pdf",
    "regionale-schule|6|weltkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-weltkunde-5-6-igs.pdf",
    "regionale-schule|6|werken":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp-werken-5-6.pdf",
    "regionale-schule|7|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_regs.pdf",
    "regionale-schule|7|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|7|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|7|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I_Reg_2025.pdf",
    "regionale-schule|7|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_RegS_2025.pdf",
    "regionale-schule|7|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_RegS_2025.pdf",
    "regionale-schule|7|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_regs_.pdf",
    "regionale-schule|7|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_regs.pdf",
    "regionale-schule|7|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_MR_5-10.pdf",
    "regionale-schule|7|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_5_RP_KU_MR_7-10_final1.pdf",
    "regionale-schule|7|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|7|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|7|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_6_RP_MUS_MR_7-10_final1.pdf",
    "regionale-schule|7|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|7|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_RegS_2025.pdf",
    "regionale-schule|7|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_RegS_2025.pdf",
    "regionale-schule|7|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_RegS_2025.pdf",
    "regionale-schule|7|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "regionale-schule|7|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_RegS_2025.pdf",
    "regionale-schule|7|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "regionale-schule|7|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_MR_7-10.pdf",
    "regionale-schule|8|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_regs.pdf",
    "regionale-schule|8|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|8|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|8|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I_Reg_2025.pdf",
    "regionale-schule|8|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_RegS_2025.pdf",
    "regionale-schule|8|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_RegS_2025.pdf",
    "regionale-schule|8|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_regs_.pdf",
    "regionale-schule|8|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_regs.pdf",
    "regionale-schule|8|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_MR_5-10.pdf",
    "regionale-schule|8|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_5_RP_KU_MR_7-10_final1.pdf",
    "regionale-schule|8|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|8|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|8|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_6_RP_MUS_MR_7-10_final1.pdf",
    "regionale-schule|8|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|8|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_RegS_2025.pdf",
    "regionale-schule|8|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_RegS_2025.pdf",
    "regionale-schule|8|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_RegS_2025.pdf",
    "regionale-schule|8|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "regionale-schule|8|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_RegS_2025.pdf",
    "regionale-schule|8|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "regionale-schule|8|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_MR_7-10.pdf",
    "regionale-schule|9|awt":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_awt_sek_I_regs.pdf",
    "regionale-schule|9|biologie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Biologie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|9|chemie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Chemie-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|9|deutsch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_AB_Deu_Sek_I_Reg_2025.pdf",
    "regionale-schule|9|englisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Eng_7-10_RegS_2025.pdf",
    "regionale-schule|9|franzoesisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Frz_7-10_RegS_2025.pdf",
    "regionale-schule|9|geografie":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geografie_sek_I_regs_.pdf",
    "regionale-schule|9|geschichte":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_geschichte_sek_I_regs.pdf",
    "regionale-schule|9|informatik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_INFO_MR_5-10.pdf",
    "regionale-schule|9|kunst":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_5_RP_KU_MR_7-10_final1.pdf",
    "regionale-schule|9|latein":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Lat_5-10_Sek_I_2025.pdf",
    "regionale-schule|9|mathematik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Mathematik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|9|musik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/Anlage_6_RP_MUS_MR_7-10_final1.pdf",
    "regionale-schule|9|physik":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP-Physik-Sekundarbereich-I-RegS-2026.pdf",
    "regionale-schule|9|polnisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Pol_7-10_RegS_2025.pdf",
    "regionale-schule|9|russisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Rus_7-10_RegS_2025.pdf",
    "regionale-schule|9|schwedisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Schwed_7-10_RegS_2025.pdf",
    "regionale-schule|9|sozialkunde":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sozialkunde_sek_I_regs_gym.pdf",
    "regionale-schule|9|spanisch":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Spa_7-10_RegS_2025.pdf",
    "regionale-schule|9|sport":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/rp_sport_sek_I_regs_gym_2023.pdf",
    "regionale-schule|9|theater":
      "https://www.bildung-mv.de/export/sites/bildungsserver/.galleries/dokumente/unterricht/rahmenplaene/RP_Theater-DarstSp_MR_7-10.pdf",
  },

  catalogPaths: [
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "religionen",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "geistige-entwicklung",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "religionen",
    },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "1",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "2",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "3",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "4",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "5",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "6",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "7",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "8",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "band-i" },
    {
      schoolType: "foerderschule-lernen",
      grade: "9",
      subject: "deutsche-gebaerdensprache",
    },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "fremdsprachen" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "niederdeutsch" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "theater" },
    { schoolType: "grundschule", grade: "1", subject: "werken" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "fremdsprachen" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "niederdeutsch" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "theater" },
    { schoolType: "grundschule", grade: "2", subject: "werken" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "fremdsprachen" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "niederdeutsch" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "theater" },
    { schoolType: "grundschule", grade: "3", subject: "werken" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "fremdsprachen" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "niederdeutsch" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "theater" },
    { schoolType: "grundschule", grade: "4", subject: "werken" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "berufliche-orientierung",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geografie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "schwedisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "wirtschaft" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "berufliche-orientierung",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geografie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "schwedisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "wirtschaft" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "berufliche-orientierung",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geografie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "schwedisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "10", subject: "awt" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geografie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "schwedisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "theater" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geografie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "naturwissenschaften" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "gymnasium", grade: "5", subject: "physik" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "theater" },
    { schoolType: "gymnasium", grade: "5", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "werken" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geografie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "naturwissenschaften" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "theater" },
    { schoolType: "gymnasium", grade: "6", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "werken" },
    { schoolType: "gymnasium", grade: "7", subject: "awt" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geografie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "schwedisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "theater" },
    { schoolType: "gymnasium", grade: "8", subject: "awt" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geografie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "schwedisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "theater" },
    { schoolType: "gymnasium", grade: "9", subject: "awt" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geografie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "schwedisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "theater" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "biologie" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "deutsch" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "englisch" },
    {
      schoolType: "orientierungsstufe",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "orientierungsstufe", grade: "5", subject: "franzoesisch" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "geografie" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "geschichte" },
    {
      schoolType: "orientierungsstufe",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "orientierungsstufe", grade: "5", subject: "kunst" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "latein" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "mathematik" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "musik" },
    {
      schoolType: "orientierungsstufe",
      grade: "5",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "orientierungsstufe",
      grade: "5",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "orientierungsstufe", grade: "5", subject: "physik" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "sport" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "theater" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "weltkunde" },
    { schoolType: "orientierungsstufe", grade: "5", subject: "werken" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "biologie" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "deutsch" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "englisch" },
    {
      schoolType: "orientierungsstufe",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "orientierungsstufe", grade: "6", subject: "franzoesisch" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "geografie" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "geschichte" },
    {
      schoolType: "orientierungsstufe",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "orientierungsstufe", grade: "6", subject: "kunst" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "latein" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "mathematik" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "musik" },
    {
      schoolType: "orientierungsstufe",
      grade: "6",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "orientierungsstufe",
      grade: "6",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "orientierungsstufe", grade: "6", subject: "physik" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "sport" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "theater" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "weltkunde" },
    { schoolType: "orientierungsstufe", grade: "6", subject: "werken" },
    { schoolType: "regionale-schule", grade: "10", subject: "awt" },
    { schoolType: "regionale-schule", grade: "10", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "10", subject: "chemie" },
    { schoolType: "regionale-schule", grade: "10", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "10", subject: "englisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "10", subject: "geschichte" },
    { schoolType: "regionale-schule", grade: "10", subject: "informatik" },
    { schoolType: "regionale-schule", grade: "10", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "10", subject: "latein" },
    { schoolType: "regionale-schule", grade: "10", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "10", subject: "musik" },
    { schoolType: "regionale-schule", grade: "10", subject: "physik" },
    { schoolType: "regionale-schule", grade: "10", subject: "polnisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "russisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "schwedisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "sozialkunde" },
    { schoolType: "regionale-schule", grade: "10", subject: "spanisch" },
    { schoolType: "regionale-schule", grade: "10", subject: "sport" },
    { schoolType: "regionale-schule", grade: "10", subject: "theater" },
    { schoolType: "regionale-schule", grade: "5", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "5", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "5", subject: "englisch" },
    {
      schoolType: "regionale-schule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "regionale-schule", grade: "5", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "5", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "5", subject: "geschichte" },
    {
      schoolType: "regionale-schule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "regionale-schule", grade: "5", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "5", subject: "latein" },
    { schoolType: "regionale-schule", grade: "5", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "5", subject: "musik" },
    {
      schoolType: "regionale-schule",
      grade: "5",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "regionale-schule",
      grade: "5",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "regionale-schule", grade: "5", subject: "physik" },
    { schoolType: "regionale-schule", grade: "5", subject: "sport" },
    { schoolType: "regionale-schule", grade: "5", subject: "theater" },
    { schoolType: "regionale-schule", grade: "5", subject: "weltkunde" },
    { schoolType: "regionale-schule", grade: "5", subject: "werken" },
    { schoolType: "regionale-schule", grade: "6", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "6", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "6", subject: "englisch" },
    {
      schoolType: "regionale-schule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "regionale-schule", grade: "6", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "6", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "6", subject: "geschichte" },
    {
      schoolType: "regionale-schule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "regionale-schule", grade: "6", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "6", subject: "latein" },
    { schoolType: "regionale-schule", grade: "6", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "6", subject: "musik" },
    {
      schoolType: "regionale-schule",
      grade: "6",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "regionale-schule",
      grade: "6",
      subject: "philosophieren-mit-kindern",
    },
    { schoolType: "regionale-schule", grade: "6", subject: "physik" },
    { schoolType: "regionale-schule", grade: "6", subject: "sport" },
    { schoolType: "regionale-schule", grade: "6", subject: "theater" },
    { schoolType: "regionale-schule", grade: "6", subject: "weltkunde" },
    { schoolType: "regionale-schule", grade: "6", subject: "werken" },
    { schoolType: "regionale-schule", grade: "7", subject: "awt" },
    { schoolType: "regionale-schule", grade: "7", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "7", subject: "chemie" },
    { schoolType: "regionale-schule", grade: "7", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "7", subject: "englisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "7", subject: "geschichte" },
    { schoolType: "regionale-schule", grade: "7", subject: "informatik" },
    { schoolType: "regionale-schule", grade: "7", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "7", subject: "latein" },
    { schoolType: "regionale-schule", grade: "7", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "7", subject: "musik" },
    { schoolType: "regionale-schule", grade: "7", subject: "physik" },
    { schoolType: "regionale-schule", grade: "7", subject: "polnisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "russisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "schwedisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "sozialkunde" },
    { schoolType: "regionale-schule", grade: "7", subject: "spanisch" },
    { schoolType: "regionale-schule", grade: "7", subject: "sport" },
    { schoolType: "regionale-schule", grade: "7", subject: "theater" },
    { schoolType: "regionale-schule", grade: "8", subject: "awt" },
    { schoolType: "regionale-schule", grade: "8", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "8", subject: "chemie" },
    { schoolType: "regionale-schule", grade: "8", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "8", subject: "englisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "8", subject: "geschichte" },
    { schoolType: "regionale-schule", grade: "8", subject: "informatik" },
    { schoolType: "regionale-schule", grade: "8", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "8", subject: "latein" },
    { schoolType: "regionale-schule", grade: "8", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "8", subject: "musik" },
    { schoolType: "regionale-schule", grade: "8", subject: "physik" },
    { schoolType: "regionale-schule", grade: "8", subject: "polnisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "russisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "schwedisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "sozialkunde" },
    { schoolType: "regionale-schule", grade: "8", subject: "spanisch" },
    { schoolType: "regionale-schule", grade: "8", subject: "sport" },
    { schoolType: "regionale-schule", grade: "8", subject: "theater" },
    { schoolType: "regionale-schule", grade: "9", subject: "awt" },
    { schoolType: "regionale-schule", grade: "9", subject: "biologie" },
    { schoolType: "regionale-schule", grade: "9", subject: "chemie" },
    { schoolType: "regionale-schule", grade: "9", subject: "deutsch" },
    { schoolType: "regionale-schule", grade: "9", subject: "englisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "franzoesisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "geografie" },
    { schoolType: "regionale-schule", grade: "9", subject: "geschichte" },
    { schoolType: "regionale-schule", grade: "9", subject: "informatik" },
    { schoolType: "regionale-schule", grade: "9", subject: "kunst" },
    { schoolType: "regionale-schule", grade: "9", subject: "latein" },
    { schoolType: "regionale-schule", grade: "9", subject: "mathematik" },
    { schoolType: "regionale-schule", grade: "9", subject: "musik" },
    { schoolType: "regionale-schule", grade: "9", subject: "physik" },
    { schoolType: "regionale-schule", grade: "9", subject: "polnisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "russisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "schwedisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "sozialkunde" },
    { schoolType: "regionale-schule", grade: "9", subject: "spanisch" },
    { schoolType: "regionale-schule", grade: "9", subject: "sport" },
    { schoolType: "regionale-schule", grade: "9", subject: "theater" },
  ],
};
