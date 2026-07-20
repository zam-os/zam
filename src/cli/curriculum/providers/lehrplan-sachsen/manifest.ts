import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface SachsenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Sachsen Lehrpläne catalog (Sächsische Lehrplan-Datenbank).
 *
 * Captured 2026-07-20 from https://www.schulportal.sachsen.de/lplandb/
 * Content URLs are stable public Lehrplan pages: /lplandb/lehrplan/<id>
 *
 * School types: Grundschule, Oberschule, Gymnasium, Förderschule Lernen,
 * Förderschule geistige Entwicklung. Berufliche Schulen out of scope;
 * AbiBac / bilingual special tracks and umbrella rows skipped.
 */
export interface LehrplanSachsenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: SachsenCatalogPath[];
}

export const LEHRPLAN_SACHSEN_MANIFEST: LehrplanSachsenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Sächsische Lehrplan-Datenbank (allgemeinbildend)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "oberschule",
      label: "Oberschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium",
    },
    {
      id: "foerderschule-lernen",
      label: "Schule mit dem Förderschwerpunkt Lernen",
    },
    {
      id: "foerderschule-geistige-entwicklung",
      label: "Schule mit dem Förderschwerpunkt geistige Entwicklung",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    oberschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10", "11", "12"],
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
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "herkunftssprache-im-wahlbereich",
        label: "Herkunftssprache im Wahlbereich",
      },
      {
        id: "intensives-sprachenlernen",
        label: "Intensives Sprachenlernen",
      },
      {
        id: "intensives-sprachenlernen-sorbisch-als-fremdsprache",
        label: "Intensives Sprachenlernen Sorbisch als Fremdsprache",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religion",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst",
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
        id: "sorbisch",
        label: "Sorbisch",
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
    oberschule: [
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
        id: "deutsch-als-zweitsprache",
        label: "Deutsch als Zweitsprache",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "gemeinschaftskunde-rechtserziehung",
        label: "Gemeinschaftskunde/Rechtserziehung",
      },
      {
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "herkunftssprache-ersatz-fuer-2-fremdsprache",
        label: "Herkunftssprache - Ersatz für 2. Fremdsprache",
      },
      {
        id: "herkunftssprache-im-wahlbereich",
        label: "Herkunftssprache im Wahlbereich",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religion",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst",
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
        id: "physik",
        label: "Physik",
      },
      {
        id: "sorbisch",
        label: "Sorbisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "technik-computer",
        label: "Technik/Computer",
      },
      {
        id: "wirtschaft-technik-haushalt-soziales",
        label: "Wirtschaft-Technik-Haushalt/Soziales",
      },
    ],
    gymnasium: [
      {
        id: "astronomie",
        label: "Astronomie",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "biotechnologie-und-bionik",
        label: "Biotechnologie und Bionik",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "chinesisch",
        label: "Chinesisch",
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
        id: "ethik",
        label: "Ethik",
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
        id: "gemeinschaftskunde-rechtserziehung-wirtschaft",
        label: "Gemeinschaftskunde/Rechtserziehung/Wirtschaft",
      },
      {
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "herkunftssprache-ersatz-fuer-2-fremdsprache",
        label: "Herkunftssprache - Ersatz für 2. Fremdsprache",
      },
      {
        id: "herkunftssprache-im-wahlbereich",
        label: "Herkunftssprache im Wahlbereich",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religion",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst",
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
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sorbisch",
        label: "Sorbisch",
      },
      {
        id: "sorbisch-im-wahlbereich",
        label: "Sorbisch im Wahlbereich",
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
        id: "technik-computer",
        label: "Technik/Computer",
      },
    ],
    "foerderschule-lernen": [
      {
        id: "arbeitslehre",
        label: "Arbeitslehre",
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
        id: "deutsch-heimatkunde-sachunterricht",
        label: "Deutsch - Heimatkunde/Sachunterricht",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "gemeinschaftskunde-rechtserziehung",
        label: "Gemeinschaftskunde/Rechtserziehung",
      },
      {
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "hauswirtschaft",
        label: "Hauswirtschaft",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "kunst",
        label: "Kunst",
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
        id: "physik",
        label: "Physik",
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
    "foerderschule-geistige-entwicklung": [
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "hauswirtschaft",
        label: "Hauswirtschaft",
      },
      {
        id: "kunst",
        label: "Kunst",
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
      {
        id: "werken",
        label: "Werken",
      },
    ],
  },

  tracks: {},

  topics: {
    "foerderschule-geistige-entwicklung|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|10|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|1|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|1|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|1|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|2|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|2|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|2|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|3|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|3|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|3|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|4|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|4|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|7|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|8|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-geistige-entwicklung|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-geistige-entwicklung|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-geistige-entwicklung|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-geistige-entwicklung|9|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|10|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|10|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|1|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|1|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|1|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|1|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|1|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|1|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|2|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|2|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|2|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|2|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|2|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|2|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|3|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|3|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|3|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|3|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|3|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|3|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|4|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|4|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|4|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|4|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|4|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|5|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|6|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|7|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|7|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|8|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|8|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule-lernen|9|deutsch-heimatkunde-sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule-lernen|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "foerderschule-lernen|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule-lernen|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule-lernen|9|werken": [
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
    "grundschule|1|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|intensives-sprachenlernen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|intensives-sprachenlernen-sorbisch-als-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|1|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|1|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|sport": [
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
    "grundschule|2|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|intensives-sprachenlernen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|intensives-sprachenlernen-sorbisch-als-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|2|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|2|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|sport": [
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
    "grundschule|3|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|intensives-sprachenlernen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|intensives-sprachenlernen-sorbisch-als-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|3|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|3|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|sport": [
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
    "grundschule|4|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|intensives-sprachenlernen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|intensives-sprachenlernen-sorbisch-als-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|4|sachunterricht": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|4|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|biotechnologie-und-bionik": [
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
    "gymnasium|10|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|10|ethik": [
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
    "gymnasium|10|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|herkunftssprache-im-wahlbereich": [
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
    "gymnasium|10|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|katholische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|philosophie": [
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
    "gymnasium|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|10|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|biotechnologie-und-bionik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|11|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|mathematik": [
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|11|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|11|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|biotechnologie-und-bionik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gymnasium|12|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|mathematik": [
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|12|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|12|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|biotechnologie-und-bionik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|5|ethik": [
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
    "gymnasium|5|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|juedische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|5|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|biotechnologie-und-bionik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|6|ethik": [
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
    "gymnasium|6|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|juedische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|philosophie": [
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
    "gymnasium|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|6|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|biotechnologie-und-bionik": [
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
    "gymnasium|7|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|7|ethik": [
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
    "gymnasium|7|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|herkunftssprache-im-wahlbereich": [
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
    "gymnasium|7|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|katholische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|philosophie": [
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
    "gymnasium|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|7|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|biotechnologie-und-bionik": [
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
    "gymnasium|8|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|8|ethik": [
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
    "gymnasium|8|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|herkunftssprache-im-wahlbereich": [
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
    "gymnasium|8|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|katholische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|philosophie": [
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
    "gymnasium|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|8|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|biotechnologie-und-bionik": [
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
    "gymnasium|9|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|9|ethik": [
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
    "gymnasium|9|gemeinschaftskunde-rechtserziehung-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|herkunftssprache-im-wahlbereich": [
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
    "gymnasium|9|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|katholische-religion": [
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
      { id: "zahlen-algebra", label: "Zahlen und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gymnasium|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|philosophie": [
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
    "gymnasium|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sorbisch-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|9|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|10|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|10|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|10|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|5|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|5|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|5|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|6|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|6|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|6|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|7|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|7|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|7|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|8|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|8|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|8|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "oberschule|9|deutsch-als-zweitsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|gemeinschaftskunde-rechtserziehung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|herkunftssprache-ersatz-fuer-2-fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|herkunftssprache-im-wahlbereich": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "oberschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "oberschule|9|sorbisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|technik-computer": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "oberschule|9|wirtschaft-technik-haushalt-soziales": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "foerderschule-geistige-entwicklung|10|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|10|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|10|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|10|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|10|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|10|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|10|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|10|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|10|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|1|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|1|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|1|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|1|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|1|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|1|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|1|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|1|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|1|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|2|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|2|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|2|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|2|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|2|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|2|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|2|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|2|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|2|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|3|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|3|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|3|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|3|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|3|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|3|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|3|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|3|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|3|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|4|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|4|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|4|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|4|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|4|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|4|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|4|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|4|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|4|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|5|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|5|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|5|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|5|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|5|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|5|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|5|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|5|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|5|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|6|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|6|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|6|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|6|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|6|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|6|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|6|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|6|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|6|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|7|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|7|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|7|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|7|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|7|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|7|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|7|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|7|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|7|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|8|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|8|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|8|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|8|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|8|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|8|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|8|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|8|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|8|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-geistige-entwicklung|9|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/178",
    "foerderschule-geistige-entwicklung|9|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/170",
    "foerderschule-geistige-entwicklung|9|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/171",
    "foerderschule-geistige-entwicklung|9|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/179",
    "foerderschule-geistige-entwicklung|9|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/173",
    "foerderschule-geistige-entwicklung|9|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/172",
    "foerderschule-geistige-entwicklung|9|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/169",
    "foerderschule-geistige-entwicklung|9|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/264",
    "foerderschule-geistige-entwicklung|9|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/177",
    "foerderschule-lernen|10|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|10|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|10|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|10|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|10|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|10|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|10|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|10|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|10|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|10|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|10|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|10|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|10|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|10|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|10|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|10|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|10|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|10|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|1|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|1|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|1|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|1|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|1|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|1|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|1|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|1|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|1|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|1|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|1|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|1|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|1|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|1|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|1|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|1|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|1|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|1|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|2|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|2|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|2|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|2|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|2|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|2|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|2|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|2|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|2|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|2|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|2|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|2|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|2|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|2|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|2|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|2|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|2|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|2|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|3|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|3|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|3|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|3|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|3|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|3|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|3|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|3|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|3|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|3|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|3|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|3|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|3|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|3|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|3|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|3|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|3|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|3|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|4|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|4|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|4|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|4|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|4|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|4|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|4|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|4|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|4|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|4|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|4|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|4|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|4|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|4|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|4|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|4|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|4|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|4|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|5|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|5|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|5|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|5|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|5|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|5|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|5|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|5|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|5|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|5|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|5|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|5|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|5|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/512",
    "foerderschule-lernen|5|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|5|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|5|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|5|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|5|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|5|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|6|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|6|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|6|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|6|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|6|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|6|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|6|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|6|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|6|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|6|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|6|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|6|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|6|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/512",
    "foerderschule-lernen|6|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|6|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|6|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|6|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|6|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|6|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|7|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|7|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|7|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|7|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|7|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|7|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|7|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|7|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|7|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|7|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|7|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|7|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|7|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/512",
    "foerderschule-lernen|7|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|7|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|7|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|7|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|7|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|7|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|8|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|8|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|8|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|8|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|8|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|8|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|8|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|8|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|8|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|8|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|8|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|8|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|8|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/512",
    "foerderschule-lernen|8|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|8|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|8|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|8|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|8|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|8|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "foerderschule-lernen|9|arbeitslehre":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/149",
    "foerderschule-lernen|9|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/144",
    "foerderschule-lernen|9|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/143",
    "foerderschule-lernen|9|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/159",
    "foerderschule-lernen|9|deutsch-heimatkunde-sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/146",
    "foerderschule-lernen|9|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/167",
    "foerderschule-lernen|9|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/155",
    "foerderschule-lernen|9|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/157",
    "foerderschule-lernen|9|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/153",
    "foerderschule-lernen|9|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/145",
    "foerderschule-lernen|9|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/158",
    "foerderschule-lernen|9|hauswirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/161",
    "foerderschule-lernen|9|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/162",
    "foerderschule-lernen|9|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/139",
    "foerderschule-lernen|9|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/154",
    "foerderschule-lernen|9|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/164",
    "foerderschule-lernen|9|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/147",
    "foerderschule-lernen|9|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/156",
    "grundschule|1|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/908",
    "grundschule|1|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/91",
    "grundschule|1|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/69",
    "grundschule|1|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/72",
    "grundschule|1|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/97",
    "grundschule|1|intensives-sprachenlernen":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/93",
    "grundschule|1|intensives-sprachenlernen-sorbisch-als-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/92",
    "grundschule|1|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/82",
    "grundschule|1|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/87",
    "grundschule|1|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/64",
    "grundschule|1|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/912",
    "grundschule|1|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/75",
    "grundschule|1|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/80",
    "grundschule|1|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/90",
    "grundschule|1|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/89",
    "grundschule|1|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/73",
    "grundschule|2|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/908",
    "grundschule|2|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/91",
    "grundschule|2|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/69",
    "grundschule|2|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/72",
    "grundschule|2|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/97",
    "grundschule|2|intensives-sprachenlernen":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/93",
    "grundschule|2|intensives-sprachenlernen-sorbisch-als-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/92",
    "grundschule|2|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/82",
    "grundschule|2|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/87",
    "grundschule|2|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/64",
    "grundschule|2|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/912",
    "grundschule|2|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/75",
    "grundschule|2|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/80",
    "grundschule|2|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/90",
    "grundschule|2|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/89",
    "grundschule|2|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/73",
    "grundschule|3|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/908",
    "grundschule|3|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/91",
    "grundschule|3|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/69",
    "grundschule|3|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/72",
    "grundschule|3|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/97",
    "grundschule|3|intensives-sprachenlernen":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/93",
    "grundschule|3|intensives-sprachenlernen-sorbisch-als-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/92",
    "grundschule|3|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/82",
    "grundschule|3|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/87",
    "grundschule|3|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/64",
    "grundschule|3|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/912",
    "grundschule|3|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/75",
    "grundschule|3|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/80",
    "grundschule|3|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/90",
    "grundschule|3|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/89",
    "grundschule|3|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/73",
    "grundschule|4|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/908",
    "grundschule|4|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/91",
    "grundschule|4|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/69",
    "grundschule|4|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/72",
    "grundschule|4|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/97",
    "grundschule|4|intensives-sprachenlernen":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/93",
    "grundschule|4|intensives-sprachenlernen-sorbisch-als-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/92",
    "grundschule|4|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/82",
    "grundschule|4|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/87",
    "grundschule|4|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/64",
    "grundschule|4|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/912",
    "grundschule|4|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/75",
    "grundschule|4|sachunterricht":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/80",
    "grundschule|4|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/90",
    "grundschule|4|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/89",
    "grundschule|4|werken":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/73",
    "gymnasium|10|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|10|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|10|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|10|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|10|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|10|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|10|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|10|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|10|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|10|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|10|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|10|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|10|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|10|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|10|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|10|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|10|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|10|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|10|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|10|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|10|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|10|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|10|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|10|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/523",
    "gymnasium|10|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|10|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|10|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|10|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|10|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|10|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|11|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|11|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|11|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|11|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|11|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|11|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|11|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|11|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|11|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|11|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|11|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|11|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|11|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|11|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|11|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|11|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|11|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|11|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|11|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|11|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|11|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|11|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|11|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|11|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|11|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|11|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|11|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|11|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|11|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|12|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|12|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|12|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|12|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|12|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|12|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|12|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|12|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|12|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|12|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|12|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|12|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|12|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|12|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|12|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|12|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|12|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|12|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|12|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|12|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|12|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|12|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|12|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|12|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|12|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|12|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|12|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|12|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|12|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|5|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|5|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|5|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|5|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|5|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|5|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|5|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|5|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|5|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|5|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|5|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|5|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|5|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|5|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|5|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|5|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|5|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|5|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|5|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|5|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|5|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|5|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|5|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|5|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|5|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|5|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|5|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|5|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|5|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|6|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|6|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|6|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|6|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|6|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|6|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|6|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|6|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|6|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|6|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|6|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|6|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|6|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|6|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|6|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|6|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|6|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|6|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|6|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|6|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|6|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|6|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|6|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|6|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/523",
    "gymnasium|6|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|6|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|6|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|6|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|6|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|6|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|7|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|7|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|7|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|7|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|7|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|7|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|7|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|7|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|7|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|7|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|7|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|7|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|7|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|7|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|7|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|7|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|7|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|7|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|7|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|7|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|7|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|7|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|7|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|7|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/523",
    "gymnasium|7|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|7|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|7|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|7|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|7|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|7|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|8|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|8|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|8|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|8|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|8|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|8|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|8|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|8|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|8|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|8|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|8|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|8|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|8|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|8|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|8|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|8|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|8|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|8|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|8|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|8|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|8|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|8|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|8|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|8|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/523",
    "gymnasium|8|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|8|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|8|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|8|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|8|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|8|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "gymnasium|9|astronomie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/102",
    "gymnasium|9|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/522",
    "gymnasium|9|biotechnologie-und-bionik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/128",
    "gymnasium|9|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "gymnasium|9|chinesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/113",
    "gymnasium|9|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/135",
    "gymnasium|9|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/816",
    "gymnasium|9|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/77",
    "gymnasium|9|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/78",
    "gymnasium|9|franzoesisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/817",
    "gymnasium|9|gemeinschaftskunde-rechtserziehung-wirtschaft":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/76",
    "gymnasium|9|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/74",
    "gymnasium|9|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/65",
    "gymnasium|9|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/137",
    "gymnasium|9|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/446",
    "gymnasium|9|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/630",
    "gymnasium|9|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/453",
    "gymnasium|9|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/81",
    "gymnasium|9|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/86",
    "gymnasium|9|latein":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/116",
    "gymnasium|9|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/461",
    "gymnasium|9|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/151",
    "gymnasium|9|philosophie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/94",
    "gymnasium|9|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/523",
    "gymnasium|9|russisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/140",
    "gymnasium|9|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/111",
    "gymnasium|9|sorbisch-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/133",
    "gymnasium|9|spanisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/115",
    "gymnasium|9|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/198",
    "gymnasium|9|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/130",
    "oberschule|10|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|10|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|10|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|10|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|10|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|10|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|10|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|10|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|10|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|10|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|10|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|10|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|10|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|10|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|10|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|10|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|10|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|10|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|10|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|10|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|10|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|10|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|10|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
    "oberschule|5|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|5|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|5|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|5|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|5|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|5|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|5|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|5|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|5|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|5|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|5|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|5|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|5|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|5|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|5|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|5|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|5|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|5|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|5|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|5|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|5|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|5|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|5|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
    "oberschule|6|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|6|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|6|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|6|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|6|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|6|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|6|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|6|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|6|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|6|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|6|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|6|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|6|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|6|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|6|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|6|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|6|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|6|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|6|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|6|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|6|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|6|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|6|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
    "oberschule|7|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|7|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|7|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|7|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|7|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|7|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|7|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|7|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|7|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|7|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|7|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|7|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|7|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|7|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|7|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|7|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|7|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|7|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|7|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|7|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|7|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|7|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|7|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
    "oberschule|8|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|8|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|8|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|8|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|8|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|8|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|8|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|8|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|8|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|8|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|8|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|8|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|8|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|8|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|8|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|8|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|8|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|8|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|8|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|8|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|8|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|8|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|8|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
    "oberschule|9|biologie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/95",
    "oberschule|9|chemie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
    "oberschule|9|deutsch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/106",
    "oberschule|9|deutsch-als-zweitsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/109",
    "oberschule|9|englisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/103",
    "oberschule|9|ethik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/96",
    "oberschule|9|evangelische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/105",
    "oberschule|9|gemeinschaftskunde-rechtserziehung":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/70",
    "oberschule|9|geographie":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/99",
    "oberschule|9|geschichte":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/66",
    "oberschule|9|herkunftssprache-ersatz-fuer-2-fremdsprache":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/108",
    "oberschule|9|herkunftssprache-im-wahlbereich":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/895",
    "oberschule|9|informatik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/514",
    "oberschule|9|juedische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/455",
    "oberschule|9|katholische-religion":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/107",
    "oberschule|9|kunst":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/120",
    "oberschule|9|mathematik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/67",
    "oberschule|9|musik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/148",
    "oberschule|9|physik":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/141",
    "oberschule|9|sorbisch":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/118",
    "oberschule|9|sport":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/265",
    "oberschule|9|technik-computer":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/123",
    "oberschule|9|wirtschaft-technik-haushalt-soziales":
      "https://www.schulportal.sachsen.de/lplandb/lehrplan/112",
  },

  catalogPaths: [
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "1",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "10",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "2",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "3",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "4",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "5",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "6",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "7",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "8",
      subject: "werken",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "deutsch",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "ethik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "hauswirtschaft",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "kunst",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "mathematik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "musik",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "sachunterricht",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "sport",
    },
    {
      schoolType: "foerderschule-geistige-entwicklung",
      grade: "9",
      subject: "werken",
    },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "1",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "1",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "1",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "1",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "1", subject: "werken" },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "arbeitslehre",
    },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "10",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "10", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "2",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "2",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "2",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "2",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "2", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "3",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "3",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "3",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "3",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "3", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "4",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "4",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "4",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "4",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "4", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "5",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "5",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "5",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "5",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "informatik" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "5", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "6",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "6",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "6",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "6",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "informatik" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "6", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "7",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "7",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "7",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "7",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "informatik" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "7", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "8",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "8",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "8",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "8",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "informatik" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "8", subject: "werken" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "arbeitslehre" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "biologie" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "chemie" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "deutsch" },
    {
      schoolType: "foerderschule-lernen",
      grade: "9",
      subject: "deutsch-heimatkunde-sachunterricht",
    },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "englisch" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "ethik" },
    {
      schoolType: "foerderschule-lernen",
      grade: "9",
      subject: "evangelische-religion",
    },
    {
      schoolType: "foerderschule-lernen",
      grade: "9",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "geographie" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "geschichte" },
    {
      schoolType: "foerderschule-lernen",
      grade: "9",
      subject: "hauswirtschaft",
    },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "kunst" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "mathematik" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "musik" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "physik" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "sport" },
    { schoolType: "foerderschule-lernen", grade: "9", subject: "werken" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "ethik" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "herkunftssprache-im-wahlbereich",
    },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "intensives-sprachenlernen",
    },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "intensives-sprachenlernen-sorbisch-als-fremdsprache",
    },
    { schoolType: "grundschule", grade: "1", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sorbisch" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "werken" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "ethik" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "herkunftssprache-im-wahlbereich",
    },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "intensives-sprachenlernen",
    },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "intensives-sprachenlernen-sorbisch-als-fremdsprache",
    },
    { schoolType: "grundschule", grade: "2", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sorbisch" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "werken" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "ethik" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "herkunftssprache-im-wahlbereich",
    },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "intensives-sprachenlernen",
    },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "intensives-sprachenlernen-sorbisch-als-fremdsprache",
    },
    { schoolType: "grundschule", grade: "3", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sorbisch" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "werken" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "ethik" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "herkunftssprache-im-wahlbereich",
    },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "intensives-sprachenlernen",
    },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "intensives-sprachenlernen-sorbisch-als-fremdsprache",
    },
    { schoolType: "grundschule", grade: "4", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sorbisch" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "werken" },
    { schoolType: "gymnasium", grade: "10", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "10", subject: "geographie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sorbisch" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "sorbisch-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "11", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "11", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "11", subject: "chemie" },
    { schoolType: "gymnasium", grade: "11", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "11", subject: "englisch" },
    { schoolType: "gymnasium", grade: "11", subject: "ethik" },
    { schoolType: "gymnasium", grade: "11", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "11", subject: "geographie" },
    { schoolType: "gymnasium", grade: "11", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "11", subject: "informatik" },
    { schoolType: "gymnasium", grade: "11", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "kunst" },
    { schoolType: "gymnasium", grade: "11", subject: "latein" },
    { schoolType: "gymnasium", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "11", subject: "musik" },
    { schoolType: "gymnasium", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "11", subject: "russisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sorbisch" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "sorbisch-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sport" },
    { schoolType: "gymnasium", grade: "11", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "12", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "12", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "12", subject: "chemie" },
    { schoolType: "gymnasium", grade: "12", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "12", subject: "englisch" },
    { schoolType: "gymnasium", grade: "12", subject: "ethik" },
    { schoolType: "gymnasium", grade: "12", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "12", subject: "geographie" },
    { schoolType: "gymnasium", grade: "12", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "12", subject: "informatik" },
    { schoolType: "gymnasium", grade: "12", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "kunst" },
    { schoolType: "gymnasium", grade: "12", subject: "latein" },
    { schoolType: "gymnasium", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "12", subject: "musik" },
    { schoolType: "gymnasium", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "12", subject: "russisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sorbisch" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "sorbisch-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sport" },
    { schoolType: "gymnasium", grade: "12", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "5", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "5", subject: "chemie" },
    { schoolType: "gymnasium", grade: "5", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "5", subject: "geographie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "5", subject: "informatik" },
    { schoolType: "gymnasium", grade: "5", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sorbisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sorbisch-im-wahlbereich" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "6", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "6", subject: "chemie" },
    { schoolType: "gymnasium", grade: "6", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "6", subject: "geographie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "6", subject: "informatik" },
    { schoolType: "gymnasium", grade: "6", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sorbisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sorbisch-im-wahlbereich" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "7", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "7", subject: "geographie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sorbisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sorbisch-im-wahlbereich" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "8", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "8", subject: "geographie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sorbisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sorbisch-im-wahlbereich" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "technik-computer" },
    { schoolType: "gymnasium", grade: "9", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "biotechnologie-und-bionik",
    },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "gemeinschaftskunde-rechtserziehung-wirtschaft",
    },
    { schoolType: "gymnasium", grade: "9", subject: "geographie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sorbisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sorbisch-im-wahlbereich" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "technik-computer" },
    { schoolType: "oberschule", grade: "10", subject: "biologie" },
    { schoolType: "oberschule", grade: "10", subject: "chemie" },
    { schoolType: "oberschule", grade: "10", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "10", subject: "englisch" },
    { schoolType: "oberschule", grade: "10", subject: "ethik" },
    { schoolType: "oberschule", grade: "10", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "10", subject: "geographie" },
    { schoolType: "oberschule", grade: "10", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "10", subject: "informatik" },
    { schoolType: "oberschule", grade: "10", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "10", subject: "kunst" },
    { schoolType: "oberschule", grade: "10", subject: "mathematik" },
    { schoolType: "oberschule", grade: "10", subject: "musik" },
    { schoolType: "oberschule", grade: "10", subject: "physik" },
    { schoolType: "oberschule", grade: "10", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "10", subject: "sport" },
    { schoolType: "oberschule", grade: "10", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
    { schoolType: "oberschule", grade: "5", subject: "biologie" },
    { schoolType: "oberschule", grade: "5", subject: "chemie" },
    { schoolType: "oberschule", grade: "5", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "5", subject: "englisch" },
    { schoolType: "oberschule", grade: "5", subject: "ethik" },
    { schoolType: "oberschule", grade: "5", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "5", subject: "geographie" },
    { schoolType: "oberschule", grade: "5", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "5", subject: "informatik" },
    { schoolType: "oberschule", grade: "5", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "5", subject: "kunst" },
    { schoolType: "oberschule", grade: "5", subject: "mathematik" },
    { schoolType: "oberschule", grade: "5", subject: "musik" },
    { schoolType: "oberschule", grade: "5", subject: "physik" },
    { schoolType: "oberschule", grade: "5", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "5", subject: "sport" },
    { schoolType: "oberschule", grade: "5", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
    { schoolType: "oberschule", grade: "6", subject: "biologie" },
    { schoolType: "oberschule", grade: "6", subject: "chemie" },
    { schoolType: "oberschule", grade: "6", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "6", subject: "englisch" },
    { schoolType: "oberschule", grade: "6", subject: "ethik" },
    { schoolType: "oberschule", grade: "6", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "6", subject: "geographie" },
    { schoolType: "oberschule", grade: "6", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "6", subject: "informatik" },
    { schoolType: "oberschule", grade: "6", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "6", subject: "kunst" },
    { schoolType: "oberschule", grade: "6", subject: "mathematik" },
    { schoolType: "oberschule", grade: "6", subject: "musik" },
    { schoolType: "oberschule", grade: "6", subject: "physik" },
    { schoolType: "oberschule", grade: "6", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "6", subject: "sport" },
    { schoolType: "oberschule", grade: "6", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
    { schoolType: "oberschule", grade: "7", subject: "biologie" },
    { schoolType: "oberschule", grade: "7", subject: "chemie" },
    { schoolType: "oberschule", grade: "7", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "7", subject: "englisch" },
    { schoolType: "oberschule", grade: "7", subject: "ethik" },
    { schoolType: "oberschule", grade: "7", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "7", subject: "geographie" },
    { schoolType: "oberschule", grade: "7", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "7", subject: "informatik" },
    { schoolType: "oberschule", grade: "7", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "7", subject: "kunst" },
    { schoolType: "oberschule", grade: "7", subject: "mathematik" },
    { schoolType: "oberschule", grade: "7", subject: "musik" },
    { schoolType: "oberschule", grade: "7", subject: "physik" },
    { schoolType: "oberschule", grade: "7", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "7", subject: "sport" },
    { schoolType: "oberschule", grade: "7", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
    { schoolType: "oberschule", grade: "8", subject: "biologie" },
    { schoolType: "oberschule", grade: "8", subject: "chemie" },
    { schoolType: "oberschule", grade: "8", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "8", subject: "englisch" },
    { schoolType: "oberschule", grade: "8", subject: "ethik" },
    { schoolType: "oberschule", grade: "8", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "8", subject: "geographie" },
    { schoolType: "oberschule", grade: "8", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "8", subject: "informatik" },
    { schoolType: "oberschule", grade: "8", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "8", subject: "kunst" },
    { schoolType: "oberschule", grade: "8", subject: "mathematik" },
    { schoolType: "oberschule", grade: "8", subject: "musik" },
    { schoolType: "oberschule", grade: "8", subject: "physik" },
    { schoolType: "oberschule", grade: "8", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "8", subject: "sport" },
    { schoolType: "oberschule", grade: "8", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
    { schoolType: "oberschule", grade: "9", subject: "biologie" },
    { schoolType: "oberschule", grade: "9", subject: "chemie" },
    { schoolType: "oberschule", grade: "9", subject: "deutsch" },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "deutsch-als-zweitsprache",
    },
    { schoolType: "oberschule", grade: "9", subject: "englisch" },
    { schoolType: "oberschule", grade: "9", subject: "ethik" },
    { schoolType: "oberschule", grade: "9", subject: "evangelische-religion" },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "gemeinschaftskunde-rechtserziehung",
    },
    { schoolType: "oberschule", grade: "9", subject: "geographie" },
    { schoolType: "oberschule", grade: "9", subject: "geschichte" },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "herkunftssprache-ersatz-fuer-2-fremdsprache",
    },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "herkunftssprache-im-wahlbereich",
    },
    { schoolType: "oberschule", grade: "9", subject: "informatik" },
    { schoolType: "oberschule", grade: "9", subject: "juedische-religion" },
    { schoolType: "oberschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "oberschule", grade: "9", subject: "kunst" },
    { schoolType: "oberschule", grade: "9", subject: "mathematik" },
    { schoolType: "oberschule", grade: "9", subject: "musik" },
    { schoolType: "oberschule", grade: "9", subject: "physik" },
    { schoolType: "oberschule", grade: "9", subject: "sorbisch" },
    { schoolType: "oberschule", grade: "9", subject: "sport" },
    { schoolType: "oberschule", grade: "9", subject: "technik-computer" },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "wirtschaft-technik-haushalt-soziales",
    },
  ],
};
