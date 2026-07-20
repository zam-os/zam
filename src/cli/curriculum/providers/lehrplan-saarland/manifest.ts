import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface SaarlandCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Saarland Lehrpläne catalog (Bildungsserver Saarland).
 *
 * Captured 2026-07-20 from
 * https://www.saarland.de/mbk/DE/portale/bildungsserver/schulen-und-bildungswege/lehrplaene
 * Content URLs are official SharedDocs PDF downloads.
 *
 * School types: Grundschule, Gemeinschaftsschule, Gymnasium Sek I,
 * Gymnasiale Oberstufe, Förderschule. Berufliche Schulen, ESS and
 * Schengen-Lyzeum out of scope; Handreichungen / bilingual annexes skipped.
 */
export interface LehrplanSaarlandManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: SaarlandCatalogPath[];
}

export const LEHRPLAN_SAARLAND_MANIFEST: LehrplanSaarlandManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Bildungsserver Saarland Lehrpläne (allgemeinbildend)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "gemeinschaftsschule",
      label: "Gemeinschaftsschule",
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
      id: "foerderschule",
      label: "Förderschule",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    gemeinschaftsschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "gymnasiale-oberstufe": ["11", "12", "13"],
    foerderschule: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  },

  subjects: {
    grundschule: [
      {
        id: "bildende-kunst",
        label: "Bildende Kunst",
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
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "herkunftssprache",
        label: "Herkunftssprachlicher Unterricht",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
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
        id: "sachunterricht",
        label: "Sachunterricht",
      },
      {
        id: "sport",
        label: "Sport",
      },
    ],
    gemeinschaftsschule: [
      {
        id: "allgemeine-ethik",
        label: "Allgemeine Ethik",
      },
      {
        id: "arbeitslehre",
        label: "Arbeitslehre",
      },
      {
        id: "beruf-wirtschaft",
        label: "Beruf und Wirtschaft",
      },
      {
        id: "bildende-kunst",
        label: "Bildende Kunst",
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "herkunftssprache",
        label: "Herkunftssprachlicher Unterricht",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
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
        label: "Naturwissenschaften",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
      },
      {
        id: "sport",
        label: "Sport",
      },
    ],
    gymnasium: [
      {
        id: "allgemeine-ethik",
        label: "Allgemeine Ethik",
      },
      {
        id: "bildende-kunst",
        label: "Bildende Kunst",
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "griechisch",
        label: "Griechisch",
      },
      {
        id: "herkunftssprache",
        label: "Herkunftssprachlicher Unterricht",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "itg",
        label: "Informationstechnische Grundbildung",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
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
        label: "Naturwissenschaften",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
      },
      {
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
    ],
    "gymnasiale-oberstufe": [
      {
        id: "allgemeine-ethik",
        label: "Allgemeine Ethik",
      },
      {
        id: "bildende-kunst",
        label: "Bildende Kunst",
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "griechisch",
        label: "Griechisch",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
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
        id: "physik",
        label: "Physik",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
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
        id: "technik",
        label: "Technik",
      },
      {
        id: "wirtschaft",
        label: "Wirtschaft",
      },
    ],
    foerderschule: [
      {
        id: "arbeitslehre",
        label: "Arbeitslehre",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "geistige-entwicklung",
        label: "Geistige Entwicklung",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
    ],
  },

  tracks: {},

  topics: {
    "foerderschule|10|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|10|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|1|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|1|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|2|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|2|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|3|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|3|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|4|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|4|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|5|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|6|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|7|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|7|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|8|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|8|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule|9|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|9|geistige-entwicklung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|10|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|beruf-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|beruf-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|beruf-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|beruf-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|bildende-kunst": [
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
    "grundschule|1|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|herkunftssprache": [
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
    "grundschule|1|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|bildende-kunst": [
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
    "grundschule|2|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|herkunftssprache": [
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
    "grundschule|2|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|bildende-kunst": [
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
    "grundschule|3|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|herkunftssprache": [
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
    "grundschule|3|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|bildende-kunst": [
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
    "grundschule|4|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|herkunftssprache": [
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
    "grundschule|4|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|bildende-kunst": [
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
    "gymnasiale-oberstufe|11|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|11|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|katholische-religion": [
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
    "gymnasiale-oberstufe|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasiale-oberstufe|11|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|bildende-kunst": [
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
    "gymnasiale-oberstufe|12|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|12|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|katholische-religion": [
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
    "gymnasiale-oberstufe|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|bildende-kunst": [
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
    "gymnasiale-oberstufe|13|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|13|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|katholische-religion": [
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
    "gymnasiale-oberstufe|13|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|bildende-kunst": [
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
    "gymnasium|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|katholische-religion": [
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
    "gymnasium|5|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|5|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|itg": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|katholische-religion": [
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
    "gymnasium|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|6|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|katholische-religion": [
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
    "gymnasium|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|bildende-kunst": [
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
    "gymnasium|7|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|katholische-religion": [
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
    "gymnasium|8|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|bildende-kunst": [
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
    "gymnasium|8|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|katholische-religion": [
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
    "gymnasium|9|allgemeine-ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|bildende-kunst": [
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
    "gymnasium|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|herkunftssprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|katholische-religion": [
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
  },

  contentUrls: {
    "foerderschule|10|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|10|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|10|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|10|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|1|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|1|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|1|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|1|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|2|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|2|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|2|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|2|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|3|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|3|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|3|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|3|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|4|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|4|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|4|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|4|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|5|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|5|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|5|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|5|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|6|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|6|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|6|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|6|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|7|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|7|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|7|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|7|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|8|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|8|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|8|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|8|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "foerderschule|9|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_AL.pdf?__blob=publicationFile&v=1",
    "foerderschule|9|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_DE.pdf?__blob=publicationFile&v=1",
    "foerderschule|9|geistige-entwicklung":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_G/LP_F%C3%B6rderschule_geistige_Entw_2004.pdf?__blob=publicationFile&v=1",
    "foerderschule|9|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Foerderschulen/LP_FS_L/LP_F%C3%B6rderschule_Lernen_MA.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|10|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_9_10_GemS_2018.pdf?__blob=publicationFile&v=6",
    "gemeinschaftsschule|10|beruf-wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Beruf_und_Wirtschaft/LP_BW_7-10_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|10|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_10_2017.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Bi_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Ch_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|10|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/LP_En_1FS_GemS_jahrgangs%C3%BCbergreifend_2026.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|10|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_EK_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|10|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|10|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franzoesisch/LP_Fr_1FS_GemS_9_und_10_EA_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|10|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_Ge_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|10|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|10|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/LP_Ma_GemS_9_und_10_EA-Kurs_2018.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_10_2017.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_Vorwort_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Ph_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_Sk_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|10|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_5_6_GemS_2018.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Arbeitslehre/LP_AL_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_5_und_6_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/LP_En_sbU_Gems_5_6_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|5|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franz%C3%B6sisch/LP_Fr_SbU_Gems_5_6_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|5|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/LP_Ma_GemS_5-6_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|5|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_5_und_6_2017.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|5|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_5und6_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|5|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_5_6_GemS_2018.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|arbeitslehre":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Arbeitslehre/LP_AL_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_5_und_6_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/LP_En_sbU_Gems_5_6_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|6|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franz%C3%B6sisch/LP_Fr_SbU_Gems_5_6_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|6|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/LP_Ma_GemS_5-6_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|6|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_5_und_6_2017.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|6|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_5und6_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|6|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|7|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_7_8_GemS_2018.pdf?__blob=publicationFile&v=5",
    "gemeinschaftsschule|7|beruf-wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Beruf_und_Wirtschaft/LP_BW_7-10_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|7|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_7_und_8_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|7|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|7|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/KLP_En_1FS_GemS_7_und_8_E_2014.pdf?__blob=publicationFile&v=5",
    "gemeinschaftsschule|7|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|7|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franzoesisch/LP_Fr_1FS_GemS_7_und_8_E_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|7|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|7|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Informatik/LP_Info_gems_gym_7_2023.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|7|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|7|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/Lp_MA_GemS_7_8_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|7|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_7_und_8_2017.pdf?__blob=publicationFile&v=4",
    "gemeinschaftsschule|7|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_7_8_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|7|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|8|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_7_8_GemS_2018.pdf?__blob=publicationFile&v=5",
    "gemeinschaftsschule|8|beruf-wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Beruf_und_Wirtschaft/LP_BW_7-10_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|8|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_7_und_8_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|8|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|8|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/KLP_En_1FS_GemS_7_und_8_E_2014.pdf?__blob=publicationFile&v=5",
    "gemeinschaftsschule|8|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|8|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franzoesisch/LP_Fr_1FS_GemS_7_und_8_E_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|8|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|8|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Informatik/LP__Info_gems_gym_8_2023.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|8|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|8|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/Lp_MA_GemS_7_8_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|8|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_7_und_8_2017.pdf?__blob=publicationFile&v=4",
    "gemeinschaftsschule|8|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_7_8_2025.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|8|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|9|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Allgemeine_Ethik/LP_allgemeine_Ethik_9_10_GemS_2018.pdf?__blob=publicationFile&v=6",
    "gemeinschaftsschule|9|beruf-wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Beruf_und_Wirtschaft/LP_BW_7-10_2014.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|9|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Bildende_Kunst/LP_BK_GemS_9_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Bi_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Ch_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Deutsch/KLP_De_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|9|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Englisch/LP_En_1FS_GemS_jahrgangs%C3%BCbergreifend_2026.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|9|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_EK_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|9|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Evangelische_Religion/lp_ev_Rel_Gems_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|9|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Franzoesisch/LP_Fr_1FS_GemS_9_und_10_EA_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|9|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_Ge_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Herkunftssprachlicher_Unterricht/LP_HSU_Weiterfuehrende_Schulen_2019.pdf?__blob=publicationFile&v=2",
    "gemeinschaftsschule|9|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Informatik/LP_info_gems__9_2025.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Katholische_Religion/lp_RK_GemS_2025.pdf?__blob=publicationFile&v=1",
    "gemeinschaftsschule|9|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Mathematik/LP_Ma_GemS_9_und_10_EA-Kurs_2018.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Musik/LP_Mu_GemS_9_2017.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_NW_GemS_Vorwort_2014.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Naturwissenschaften/LP_Ph_GemS_9und10_2016.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gemeinschaftsschulen/Gesellschaftswissenschaften/LP_Sk_GemS_9und10_Oktober_2015.pdf?__blob=publicationFile&v=3",
    "gemeinschaftsschule|9|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gemeinschaftsschulen/Sport/LP_Sport_GemS_Juli_2012.pdf?__blob=publicationFile&v=2",
    "grundschule|1|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_BildendeKunst.pdf?__blob=publicationFile&v=6",
    "grundschule|1|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Deutsch_2025.pdf?__blob=publicationFile&v=6",
    "grundschule|1|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_EvangelischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|1|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Franz%C3%B6sisch.pdf?__blob=publicationFile&v=3",
    "grundschule|1|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_HSU.pdf?__blob=publicationFile&v=3",
    "grundschule|1|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_KatholischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|1|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Mathematik_2025.pdf?__blob=publicationFile&v=4",
    "grundschule|1|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Musik.pdf?__blob=publicationFile&v=5",
    "grundschule|1|sachunterricht":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sachunterricht.pdf?__blob=publicationFile&v=3",
    "grundschule|1|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sport_2025.pdf?__blob=publicationFile&v=8",
    "grundschule|2|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_BildendeKunst.pdf?__blob=publicationFile&v=6",
    "grundschule|2|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Deutsch_2025.pdf?__blob=publicationFile&v=6",
    "grundschule|2|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_EvangelischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|2|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Franz%C3%B6sisch.pdf?__blob=publicationFile&v=3",
    "grundschule|2|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_HSU.pdf?__blob=publicationFile&v=3",
    "grundschule|2|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_KatholischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|2|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Mathematik_2025.pdf?__blob=publicationFile&v=4",
    "grundschule|2|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Musik.pdf?__blob=publicationFile&v=5",
    "grundschule|2|sachunterricht":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sachunterricht.pdf?__blob=publicationFile&v=3",
    "grundschule|2|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sport_2025.pdf?__blob=publicationFile&v=8",
    "grundschule|3|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_BildendeKunst.pdf?__blob=publicationFile&v=6",
    "grundschule|3|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Deutsch_2025.pdf?__blob=publicationFile&v=6",
    "grundschule|3|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_EvangelischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|3|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Franz%C3%B6sisch.pdf?__blob=publicationFile&v=3",
    "grundschule|3|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_HSU.pdf?__blob=publicationFile&v=3",
    "grundschule|3|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_KatholischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|3|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Mathematik_2025.pdf?__blob=publicationFile&v=4",
    "grundschule|3|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Musik.pdf?__blob=publicationFile&v=5",
    "grundschule|3|sachunterricht":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sachunterricht.pdf?__blob=publicationFile&v=3",
    "grundschule|3|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sport_2025.pdf?__blob=publicationFile&v=8",
    "grundschule|4|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_BildendeKunst.pdf?__blob=publicationFile&v=6",
    "grundschule|4|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Deutsch_2025.pdf?__blob=publicationFile&v=6",
    "grundschule|4|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_EvangelischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|4|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Franz%C3%B6sisch.pdf?__blob=publicationFile&v=3",
    "grundschule|4|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_HSU.pdf?__blob=publicationFile&v=3",
    "grundschule|4|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Lehrplan_KatholischeReligion.pdf?__blob=publicationFile&v=3",
    "grundschule|4|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Mathematik_2025.pdf?__blob=publicationFile&v=4",
    "grundschule|4|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Musik.pdf?__blob=publicationFile&v=5",
    "grundschule|4|sachunterricht":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sachunterricht.pdf?__blob=publicationFile&v=3",
    "grundschule|4|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Grundschule/GS_Kernlehrplan_Sport_2025.pdf?__blob=publicationFile&v=8",
    "gymnasiale-oberstufe|11|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/AllgemeineEthik/LP_Et_EP_2020.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|11|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/BildendeKunst/LP_BK_EP_2020.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|11|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Biologie/LP_Bi_EP_2019.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|11|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Chemie/LP_CH_LK_2023.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|11|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Deutsch/LP_De_EP_2019.pdf?__blob=publicationFile&v=5",
    "gymnasiale-oberstufe|11|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Englisch/LP_En_EP_1und2FS_Juni_2017.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|11|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Erdkunde/LP_Ek_GOS_EP_2015.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/EvangelischeReligion/LP_evR_EP__2023.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Franzoesisch/LP_Fr_Gym_EP_1und2FS_2023.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Geschichte/LP_Ge_Abibac_EP_2020.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|11|griechisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Griechisch/GR3EinfphFeb2006.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|11|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Informatik/INEinfphFeb2006.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Italienisch/LP_IT_GOS_G8_neu_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/KatholischeReligion/KREinfphDez2012.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Latein/LP_LA_gos_%C3%BCbergreifend_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|11|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Mathematik/LP_Ma_EP_GOS_2014.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Musik/LP_Mu_EP_GOS_2018.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|philosophie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Philosophie/Lp_Pi_EP_2024.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|11|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Physik/LP_Ph_EP_GOS_2023.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|11|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/SozialkundePolitik/LP_SK_EP_gos_2021.pdf?__blob=publicationFile&v=5",
    "gymnasiale-oberstufe|11|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Spanisch/LP_Sn_EP_3FS_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Sport/SpEinfphMaerz2008.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|11|technik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Technik/TE-EP-160608.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|11|wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Wirtschaftslehre/LP_WL_EP_2023.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|12|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/AllgemeineEthik/LP_ET_LK_DigitaleEthik_2024.pdf?__blob=publicationFile&v=8",
    "gymnasiale-oberstufe|12|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/BildendeKunst/LP-BK-HP-LK-2019.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|12|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Biologie/LP_BI_HP_LK_2023.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Chemie/LP_CH_LK_2023.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|12|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Deutsch/LP_De_HP_LK_2019_2022.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|12|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Englisch/LP_EN_HP_GOS_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|12|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Erdkunde/LP_EK_HP_LK_2019.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/EvangelischeReligion/LP_evR_HP_LK_2024.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Franzoesisch/LP_Fr_HP_GOS_2022_2026.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|12|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Geschichte/LP_Ge_HP_LK_2019.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|12|griechisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Griechisch/GR-GOS-Feb2008.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Informatik/LP_In_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Italienisch/LP_IT_GOS_G8_HP_2023.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/KatholischeReligion/LP_kathR_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Latein/LP_LA_gos_%C3%BCbergreifend_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|12|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Mathematik/LP_Ma_LK_HP_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Musik/LP_Mu_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|philosophie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Philosophie/LP_PI_GK_HP_2024.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|12|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Physik/LP_Ph_HP_LK_2023.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|12|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Spanisch/LP_SN_HP_LK_GK_2019_ab_2020-21.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Sport/LP_Sport_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|12|technik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Technik/TE2-GOS-Juli2009.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|12|wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Wirtschaftslehre/LP_Wl_HP_LK_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|13|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/AllgemeineEthik/LP_ET_LK_DigitaleEthik_2024.pdf?__blob=publicationFile&v=8",
    "gymnasiale-oberstufe|13|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/BildendeKunst/LP-BK-HP-LK-2019.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|13|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Biologie/LP_BI_HP_LK_2023.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Chemie/LP_CH_LK_2023.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|13|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Deutsch/LP_De_HP_LK_2019_2022.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|13|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Englisch/LP_EN_HP_GOS_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|13|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Erdkunde/LP_EK_HP_LK_2019.pdf?__blob=publicationFile&v=6",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/EvangelischeReligion/LP_evR_HP_LK_2024.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Franzoesisch/LP_Fr_HP_GOS_2022_2026.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|13|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Geschichte/LP_Ge_HP_LK_2019.pdf?__blob=publicationFile&v=4",
    "gymnasiale-oberstufe|13|griechisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Griechisch/GR-GOS-Feb2008.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Informatik/LP_In_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Italienisch/LP_IT_GOS_G8_HP_2023.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/KatholischeReligion/LP_kathR_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Latein/LP_LA_gos_%C3%BCbergreifend_2023.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|13|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Mathematik/LP_Ma_LK_HP_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Musik/LP_Mu_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|philosophie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Philosophie/LP_PI_GK_HP_2024.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|13|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Physik/LP_Ph_HP_LK_2023.pdf?__blob=publicationFile&v=1",
    "gymnasiale-oberstufe|13|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Spanisch/LP_SN_HP_LK_GK_2019_ab_2020-21.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Sport/LP_Sport_HP_LK_2019.pdf?__blob=publicationFile&v=3",
    "gymnasiale-oberstufe|13|technik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Technik/TE2-GOS-Juli2009.pdf?__blob=publicationFile&v=2",
    "gymnasiale-oberstufe|13|wirtschaft":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_GOS_ab_2019_2020/Wirtschaftslehre/LP_Wl_HP_LK_2023.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_9und10_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/BK/lp_bk_jahrgangsuebergreifender_teil_Gym_2021.pdf?__blob=publicationFile&v=4",
    "gymnasium|10|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Biologie/LP_gym9_Bi_10_2025.pdf?__blob=publicationFile&v=3",
    "gymnasium|10|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Chemie/LP_gym9_CH_10_s_2026.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gym9_Dt_10_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Englisch/LP_EN_gym9_1._und_2.FS_9_und_10_2025.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Erdkunde/lp_ek_10_g9_gy.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev-gym9_9und10_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/LP_FR_j%C3%BCT_2024.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Geschichte/LP_Ge_gym9_10_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|10|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Informatik/LP_gym9_INFO_10_MINT_2026.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_%C3%BCgr_3FS_G9.pdf?__blob=publicationFile&v=3",
    "gymnasium|10|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_9u10_g9_gy.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Latein/Latein_1.FS_9u10_Gym_2005.pdf?__blob=publicationFile&v=4",
    "gymnasium|10|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_10_2026.pdf?__blob=publicationFile&v=5",
    "gymnasium|10|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Musik/musik_jahrgangsuebergreifend_gy_2020.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Physik/LP_PH_gym9_10_nw_Zweig_2026.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sozialkunde/Lp_SK_gym9_9_10_2025.pdf?__blob=publicationFile&v=2",
    "gymnasium|10|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_Sn_gym9_10_3.FS_2026.pdf?__blob=publicationFile&v=1",
    "gymnasium|10|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_10_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|5|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_5und6_2023.pdf?__blob=publicationFile&v=7",
    "gymnasium|5|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/BK/LP_BK_gym9_5und6_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|5|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gymn9_Dt_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Englisch/LP_EN_gym9_1.FS_5und6_2023.pdf?__blob=publicationFile&v=6",
    "gymnasium|5|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Erdkunde/lp_ek_5_g9_gy.pdf?__blob=publicationFile&v=11",
    "gymnasium|5|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev_gym9_5und6_2023.pdf?__blob=publicationFile&v=2",
    "gymnasium|5|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/LP_FR_gym9_1.FS_5und6_2003.pdf?__blob=publicationFile&v=9",
    "gymnasium|5|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Geschichte/Geschichte_Vorwort_Gym_2014.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|5|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_%C3%BCgr_3FS_G9.pdf?__blob=publicationFile&v=3",
    "gymnasium|5|itg":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/ITG/ITG_Gym_2011.pdf?__blob=publicationFile&v=3",
    "gymnasium|5|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_5u6_g9_gy.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Latein/LP_LA_gym9_5und6.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Musik/lp_mus_5u6_gy_g9.pdf?__blob=publicationFile&v=4",
    "gymnasium|5|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/NW/LP_NW_5_und_6_GYM_2023.pdf?__blob=publicationFile&v=9",
    "gymnasium|5|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_SN_gym9_3.FS_jg%C3%BCT_20024.pdf?__blob=publicationFile&v=1",
    "gymnasium|5|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_5und6_2023.pdf?__blob=publicationFile&v=7",
    "gymnasium|6|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/BK/LP_BK_gym9_5und6_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|6|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gymn9_Dt_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Englisch/LP_EN_gym9_1.FS_5und6_2023.pdf?__blob=publicationFile&v=6",
    "gymnasium|6|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Erdkunde/Erdkunde_Vorwort_Gym_2014.pdf?__blob=publicationFile&v=3",
    "gymnasium|6|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev_gym9_5und6_2023.pdf?__blob=publicationFile&v=2",
    "gymnasium|6|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/lp_fr_2fs_6_gym.pdf?__blob=publicationFile&v=3",
    "gymnasium|6|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Geschichte/LP_Ge_gym9_6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|6|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_%C3%BCgr_3FS_G9.pdf?__blob=publicationFile&v=3",
    "gymnasium|6|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_5u6_g9_gy.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Latein/LP_LA_gym9_5und6.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Musik/lp_mus_5u6_gy_g9.pdf?__blob=publicationFile&v=4",
    "gymnasium|6|naturwissenschaften":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/NW/LP_NW_5_und_6_GYM_2023.pdf?__blob=publicationFile&v=9",
    "gymnasium|6|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_SN_gym9_3.FS_jg%C3%BCT_20024.pdf?__blob=publicationFile&v=1",
    "gymnasium|6|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_5und6_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|7|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_7und8_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|7|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/BK/Bildende_Kunst_7und8_Gym_2021.pdf?__blob=publicationFile&v=4",
    "gymnasium|7|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Biologie/LP_gym9_Bi_7_2023.pdf?__blob=publicationFile&v=9",
    "gymnasium|7|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gym9_Dt_7_2023.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Englisch/LP_EN_gym9_1.FS_7_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|7|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Erdkunde/lp_ek_7_g9_gy.pdf?__blob=publicationFile&v=6",
    "gymnasium|7|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev_gym9_7_2023.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/LP_FR_gym9_1.FS_7_2023.pdf?__blob=publicationFile&v=11",
    "gymnasium|7|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Geschichte/LP_Ge_gym9_7_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|7|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Informatik/LP_gym9_INFO_7_2023.pdf?__blob=publicationFile&v=8",
    "gymnasium|7|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_%C3%BCgr_3FS_G9.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_7u8_g9_gy.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Latein/LP_LA_gym9_7_2023.pdf?__blob=publicationFile&v=6",
    "gymnasium|7|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_7_2023.pdf?__blob=publicationFile&v=4",
    "gymnasium|7|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Musik/lp_mus_7_g9_gym.pdf?__blob=publicationFile&v=3",
    "gymnasium|7|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Physik/LP_PH_gym9_7_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|7|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_SN_gym9_3.FS_jg%C3%BCT_20024.pdf?__blob=publicationFile&v=1",
    "gymnasium|7|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_7_2023.pdf?__blob=publicationFile&v=6",
    "gymnasium|8|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_7und8_2023.pdf?__blob=publicationFile&v=5",
    "gymnasium|8|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/BK/LP_BK_gym9_8_2024.pdf?__blob=publicationFile&v=2",
    "gymnasium|8|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Biologie/LP_gym9_Bi_8_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Chemie/LP_gym9_CH_8_2024.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gym9_Dt_8_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Englisch/LP_EN_gym9_1.FS_8_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Erdkunde/lp_ek_8_g9_gy.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev_gym9_7_2023.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/LP_FR_gym9_1.FS_8_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Geschichte/Geschichte_8_Gym_2014.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|griechisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Griechisch/Griechisch_8und9_Gym_2004.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Informatik/LP_gym9_INFO_8_2023.pdf?__blob=publicationFile&v=6",
    "gymnasium|8|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_G9_8_24.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_7u8_g9_gy.pdf?__blob=publicationFile&v=3",
    "gymnasium|8|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Latein/LP_LA_gym9_3.FS_8_2024.pdf?__blob=publicationFile&v=5",
    "gymnasium|8|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_8_2024.pdf?__blob=publicationFile&v=2",
    "gymnasium|8|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Musik/LP_gym9_mu_8_2025.pdf?__blob=publicationFile&v=2",
    "gymnasium|8|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Physik/LP_PH_gym9_8_NW_Zweig_2024.pdf?__blob=publicationFile&v=4",
    "gymnasium|8|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sozialkunde/Lp_Sk_gym9_8_2024.pdf?__blob=publicationFile&v=4",
    "gymnasium|8|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_SN_gym9_8_3.FS_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|8|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_8_2024.pdf?__blob=publicationFile&v=3",
    "gymnasium|9|allgemeine-ethik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Ethik/LP_Et_gym9_9und10_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|bildende-kunst":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/BK/LP_BK_gym9_9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|biologie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Biologie/LP_gym9_Bi_9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|chemie":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Chemie/LP_gym9_CH_9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|deutsch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Deutsch/LP_gym9_Dt_9_2024.pdf?__blob=publicationFile&v=2",
    "gymnasium|9|englisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_GOS_ab_2019_2020/Englisch/LP_EN_gym9_1._und_2.FS_9_und_10_2025.pdf?__blob=publicationFile&v=2",
    "gymnasium|9|erdkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Erdkunde/Erdkunde_Vorwort_Gym_2014.pdf?__blob=publicationFile&v=3",
    "gymnasium|9|evangelische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/ev.Religion/LP_Rev-gym9_9und10_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|franzoesisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Franz%C3%B6sisch/lp_fr_gym9_1.FS_9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|geschichte":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Geschichte/LP_Ge_gym9_9_2024.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|griechisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/Griechisch/Griechisch_8und9_Gym_2004.pdf?__blob=publicationFile&v=3",
    "gymnasium|9|herkunftssprache":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium/HSU/HSU_Gym_2019.pdf?__blob=publicationFile&v=3",
    "gymnasium|9|informatik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Informatik/LP_gym9_Info_Kl9_InfoZweig_2024.pdf?__blob=publicationFile&v=4",
    "gymnasium|9|italienisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Italienisch/Lp_It_G9_9_24.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|katholische-religion":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/kath.Religion/lp_kr_9u10_g9_gy.pdf?__blob=publicationFile&v=2",
    "gymnasium|9|latein":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Latein/LP_LA_gym9_1.FS_9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|mathematik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Mathe/LP_MA_gym9_9_2025.pdf?__blob=publicationFile&v=3",
    "gymnasium|9|musik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/Musik/LP_gym9_mu_allg._9_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|physik":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Physik/LP_PH_gym9_9_nw_Zweig_2024.pdf?__blob=publicationFile&v=4",
    "gymnasium|9|sozialkunde":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sozialkunde/Lp_SK_gym9_9_10_2025.pdf?__blob=publicationFile&v=2",
    "gymnasium|9|spanisch":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Spanisch/LP_SN_gym9_3.FS_2025.pdf?__blob=publicationFile&v=1",
    "gymnasium|9|sport":
      "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrplaene/Lehrplaene_Gymnasium_neunjaehriges_23/Sport/LP_gym9_SP_9_2024.pdf?__blob=publicationFile&v=1",
  },

  catalogPaths: [
    { schoolType: "foerderschule", grade: "1", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "1", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "1",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "1", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "10", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "10", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "10",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "10", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "2", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "2", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "2",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "2", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "3", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "3", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "3",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "3", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "4", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "4", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "4",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "4", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "5", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "5", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "5",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "5", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "6", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "6", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "6",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "6", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "7", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "7", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "7",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "7", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "8", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "8", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "8",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "8", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "9", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "9", subject: "deutsch" },
    {
      schoolType: "foerderschule",
      grade: "9",
      subject: "geistige-entwicklung",
    },
    { schoolType: "foerderschule", grade: "9", subject: "mathematik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "beruf-wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "herkunftssprache",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "sport" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "allgemeine-ethik",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "arbeitslehre" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "englisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "franzoesisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "herkunftssprache",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "sport" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "allgemeine-ethik",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "arbeitslehre" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "englisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "franzoesisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "herkunftssprache",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "sport" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "beruf-wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "englisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "franzoesisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "herkunftssprache",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "sport" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "beruf-wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "englisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "franzoesisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "herkunftssprache",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "sport" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "beruf-wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "bildende-kunst",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "herkunftssprache",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "1", subject: "herkunftssprache" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "2", subject: "herkunftssprache" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "3", subject: "herkunftssprache" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "4", subject: "herkunftssprache" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "erdkunde" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "italienisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "wirtschaft" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "erdkunde" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "italienisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "wirtschaft" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "allgemeine-ethik",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "erdkunde" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "italienisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "katholische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "10", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "5", subject: "itg" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "allgemeine-ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "herkunftssprache" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
  ],
};
