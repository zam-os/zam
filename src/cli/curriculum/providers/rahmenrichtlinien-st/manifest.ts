import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface SachsenAnhaltCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Sachsen-Anhalt Fachlehrpläne / Rahmenrichtlinien catalog (Bildungsserver LSA).
 *
 * Captured 2026-07-20 from
 * https://lisa.sachsen-anhalt.de/schulqualitaet/lehrplaene-rahmenrichtlinien
 * via school-type Lehrplan hubs on https://www.bildung-lsa.de/
 * Content URLs are official Fachlehrplan PDFs under /files/…
 *
 * School types: Grundschule, Sekundarschule, Gymnasium, Gemeinschaftsschule
 * (GemS reuses Sekundarschule Fachlehrpläne for core subjects). Berufliche
 * Bildung and supplementary LISA publications out of scope.
 */
export interface RahmenrichtlinienStManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: SachsenAnhaltCatalogPath[];
}

export const RAHMENRICHTLINIEN_ST_MANIFEST: RahmenrichtlinienStManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Bildungsserver LSA / LISA Fachlehrpläne",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "sekundarschule",
      label: "Sekundarschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium",
    },
    {
      id: "gemeinschaftsschule",
      label: "Gemeinschaftsschule",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    sekundarschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10", "11", "12"],
    gemeinschaftsschule: ["5", "6", "7", "8", "9", "10", "11", "12"],
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
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst / Gestalten",
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
    sekundarschule: [
      {
        id: "astronomie",
        label: "Astronomie",
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
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst / Gestalten",
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
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
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
        label: "Wirtschaft / Wirtschaftslehre",
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
        id: "geographie",
        label: "Geographie",
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
        id: "kunst",
        label: "Kunst / Gestalten",
      },
      {
        id: "latein",
        label: "Latein",
      },
      {
        id: "lernen-in-der-digitalen-welt",
        label: "Lernen in der digitalen Welt",
      },
      {
        id: "lernmethoden",
        label: "Lernmethoden / Arbeit am PC",
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
        id: "psychologie",
        label: "Psychologie",
      },
      {
        id: "rechtskunde",
        label: "Rechtskunde",
      },
      {
        id: "russisch",
        label: "Russisch",
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
        label: "Wirtschaft / Wirtschaftslehre",
      },
    ],
    gemeinschaftsschule: [
      {
        id: "astronomie",
        label: "Astronomie",
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
        id: "katholische-religion",
        label: "Katholische Religion",
      },
      {
        id: "kunst",
        label: "Kunst / Gestalten",
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
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
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
        label: "Wirtschaft / Wirtschaftslehre",
      },
    ],
  },

  tracks: {},

  topics: {
    "gemeinschaftsschule|10|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|10|ethik": [
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
    "gemeinschaftsschule|10|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|kunst": [
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
    "gemeinschaftsschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gemeinschaftsschule|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|11|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|11|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|11|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|11|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|11|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|11|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|11|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|12|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|12|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|12|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gemeinschaftsschule|12|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|12|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|12|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gemeinschaftsschule|12|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|12|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|12|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|5|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|kunst": [
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
    "gemeinschaftsschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|6|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|kunst": [
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
    "gemeinschaftsschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|7|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|7|kunst": [
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
    "gemeinschaftsschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|8|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|8|kunst": [
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
    "gemeinschaftsschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gemeinschaftsschule|9|ethik": [
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
    "gemeinschaftsschule|9|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gemeinschaftsschule|9|kunst": [
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
    "gemeinschaftsschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gemeinschaftsschule|9|technik": [
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
    "grundschule|1|sport": [
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
    "grundschule|2|sport": [
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
    "grundschule|3|sport": [
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
    "grundschule|4|sport": [
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
    "gymnasium|10|griechisch": [
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
    "gymnasium|10|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|10|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|rechtskunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|russisch": [
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
    "gymnasium|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wirtschaft": [
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
    "gymnasium|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|11|griechisch": [
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
    "gymnasium|11|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
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
    "gymnasium|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|rechtskunde": [
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
    "gymnasium|11|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|11|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|wirtschaft": [
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
    "gymnasium|12|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|12|griechisch": [
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
    "gymnasium|12|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
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
    "gymnasium|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|rechtskunde": [
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
    "gymnasium|12|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|12|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|wirtschaft": [
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
    "gymnasium|5|chemie": [
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
    "gymnasium|5|griechisch": [
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
    "gymnasium|5|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|5|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|5|technik": [
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
    "gymnasium|6|chemie": [
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
    "gymnasium|6|griechisch": [
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
    "gymnasium|6|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|6|technik": [
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
    "gymnasium|7|griechisch": [
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
    "gymnasium|7|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|7|russisch": [
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
    "gymnasium|7|technik": [
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
    "gymnasium|8|griechisch": [
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
    "gymnasium|8|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|8|russisch": [
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
    "gymnasium|8|technik": [
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
    "gymnasium|9|griechisch": [
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
    "gymnasium|9|lernen-in-der-digitalen-welt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|lernmethoden": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|9|russisch": [
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
    "gymnasium|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|10|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|10|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|5|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|5|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|6|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|6|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|7|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|7|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|8|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|8|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "sekundarschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|9|geographie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "sekundarschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sekundarschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "sekundarschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sekundarschule|9|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "gemeinschaftsschule|10|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "gemeinschaftsschule|10|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|10|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|10|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|10|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|10|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|10|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|10|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|10|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|10|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|10|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|10|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|10|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|10|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|10|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|10|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|10|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|10|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|10|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|10|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|10|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|10|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "gemeinschaftsschule|11|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "gemeinschaftsschule|11|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|11|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|11|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|11|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|11|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|11|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|11|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|11|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|11|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|11|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|11|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|11|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|11|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|11|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|11|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|11|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|11|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|11|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|11|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|11|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|11|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "gemeinschaftsschule|12|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "gemeinschaftsschule|12|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|12|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|12|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|12|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|12|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|12|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|12|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|12|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|12|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|12|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|12|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|12|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|12|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|12|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|12|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|12|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|12|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|12|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|12|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|12|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|12|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "gemeinschaftsschule|5|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|5|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|5|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|5|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|5|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|5|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|5|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|5|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|5|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|5|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|5|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|5|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|5|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|5|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|5|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|5|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|5|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|5|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|5|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|5|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|6|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|6|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|6|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|6|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|6|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|6|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|6|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|6|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|6|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|6|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|6|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|6|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|6|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|6|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|6|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|6|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|6|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|6|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|6|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|6|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|7|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|7|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|7|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|7|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|7|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|7|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|7|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|7|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|7|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|7|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|7|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|7|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|7|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|7|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|7|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|7|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|7|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|7|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|7|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|7|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|8|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|8|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|8|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|8|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|8|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|8|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|8|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|8|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|8|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|8|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|8|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|8|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|8|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|8|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|8|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|8|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|8|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|8|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|8|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|8|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "gemeinschaftsschule|9|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "gemeinschaftsschule|9|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "gemeinschaftsschule|9|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "gemeinschaftsschule|9|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "gemeinschaftsschule|9|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "gemeinschaftsschule|9|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "gemeinschaftsschule|9|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "gemeinschaftsschule|9|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "gemeinschaftsschule|9|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "gemeinschaftsschule|9|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "gemeinschaftsschule|9|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "gemeinschaftsschule|9|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "gemeinschaftsschule|9|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "gemeinschaftsschule|9|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "gemeinschaftsschule|9|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "gemeinschaftsschule|9|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "gemeinschaftsschule|9|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "gemeinschaftsschule|9|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "gemeinschaftsschule|9|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "gemeinschaftsschule|9|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "gemeinschaftsschule|9|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "grundschule|1|deutsch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Deutsch_LT_01082026.pdf",
    "grundschule|1|englisch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Engl_LT_01082026.pdf",
    "grundschule|1|ethik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Ethik_LT_01082026.pdf",
    "grundschule|1|evangelische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_evRU_LT_01082026.pdf",
    "grundschule|1|katholische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_kathRU_LT_01082026.pdf",
    "grundschule|1|kunst":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Gest_LT_01082026.pdf",
    "grundschule|1|mathematik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Mathe_LT_01082026.pdf",
    "grundschule|1|musik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Musik_LT_01082026.pdf",
    "grundschule|1|sachunterricht":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sachunt_LT_01082026.pdf",
    "grundschule|1|sport":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sport_LT_01082026.pdf",
    "grundschule|2|deutsch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Deutsch_LT_01082026.pdf",
    "grundschule|2|englisch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Engl_LT_01082026.pdf",
    "grundschule|2|ethik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Ethik_LT_01082026.pdf",
    "grundschule|2|evangelische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_evRU_LT_01082026.pdf",
    "grundschule|2|katholische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_kathRU_LT_01082026.pdf",
    "grundschule|2|kunst":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Gest_LT_01082026.pdf",
    "grundschule|2|mathematik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Mathe_LT_01082026.pdf",
    "grundschule|2|musik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Musik_LT_01082026.pdf",
    "grundschule|2|sachunterricht":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sachunt_LT_01082026.pdf",
    "grundschule|2|sport":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sport_LT_01082026.pdf",
    "grundschule|3|deutsch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Deutsch_LT_01082026.pdf",
    "grundschule|3|englisch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Engl_LT_01082026.pdf",
    "grundschule|3|ethik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Ethik_LT_01082026.pdf",
    "grundschule|3|evangelische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_evRU_LT_01082026.pdf",
    "grundschule|3|katholische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_kathRU_LT_01082026.pdf",
    "grundschule|3|kunst":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Gest_LT_01082026.pdf",
    "grundschule|3|mathematik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Mathe_LT_01082026.pdf",
    "grundschule|3|musik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Musik_LT_01082026.pdf",
    "grundschule|3|sachunterricht":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sachunt_LT_01082026.pdf",
    "grundschule|3|sport":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sport_LT_01082026.pdf",
    "grundschule|4|deutsch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Deutsch_LT_01082026.pdf",
    "grundschule|4|englisch":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Engl_LT_01082026.pdf",
    "grundschule|4|ethik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Ethik_LT_01082026.pdf",
    "grundschule|4|evangelische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_evRU_LT_01082026.pdf",
    "grundschule|4|katholische-religion":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_kathRU_LT_01082026.pdf",
    "grundschule|4|kunst":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Gest_LT_01082026.pdf",
    "grundschule|4|mathematik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Mathe_LT_01082026.pdf",
    "grundschule|4|musik":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Musik_LT_01082026.pdf",
    "grundschule|4|sachunterricht":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sachunt_LT_01082026.pdf",
    "grundschule|4|sport":
      "https://www.bildung-lsa.de/files/7c5f6ff122fa27b7eb9822ab54ee6396/FLP_GS_Sport_LT_01082026.pdf",
    "gymnasium|10|astronomie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Astronomie_01082024_LTd.pdf",
    "gymnasium|10|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|10|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|10|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|10|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|10|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|10|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|10|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|10|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|10|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|10|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|10|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|10|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|10|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|10|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|10|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|10|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|10|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|10|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|10|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|10|philosophie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Gym_Philosophie_010824_LTd.pdf",
    "gymnasium|10|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|10|psychologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Psychologie_010824_LTd.pdf",
    "gymnasium|10|rechtskunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Rechtskunde_010824_LTd.pdf",
    "gymnasium|10|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|10|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|10|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|10|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|10|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|10|wirtschaft":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Wirtschaftslehre_010824_LTd.pdf",
    "gymnasium|11|astronomie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Astronomie_01082024_LTd.pdf",
    "gymnasium|11|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|11|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|11|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|11|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|11|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|11|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|11|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|11|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|11|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|11|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|11|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|11|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|11|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|11|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|11|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|11|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|11|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|11|philosophie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Gym_Philosophie_010824_LTd.pdf",
    "gymnasium|11|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|11|psychologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Psychologie_010824_LTd.pdf",
    "gymnasium|11|rechtskunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Rechtskunde_010824_LTd.pdf",
    "gymnasium|11|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|11|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|11|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|11|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|11|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|11|wirtschaft":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Wirtschaftslehre_010824_LTd.pdf",
    "gymnasium|12|astronomie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Astronomie_01082024_LTd.pdf",
    "gymnasium|12|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|12|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|12|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|12|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|12|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|12|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|12|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|12|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|12|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|12|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|12|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|12|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|12|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|12|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|12|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|12|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|12|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|12|philosophie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Gym_Philosophie_010824_LTd.pdf",
    "gymnasium|12|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|12|psychologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Psychologie_010824_LTd.pdf",
    "gymnasium|12|rechtskunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Rechtskunde_010824_LTd.pdf",
    "gymnasium|12|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|12|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|12|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|12|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|12|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|12|wirtschaft":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Wirtschaftslehre_010824_LTd.pdf",
    "gymnasium|5|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|5|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|5|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|5|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|5|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|5|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|5|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|5|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|5|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|5|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|5|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|5|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|5|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|5|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|5|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|5|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|5|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|5|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|5|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|5|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|5|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|5|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|5|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|5|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|5|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|6|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|6|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|6|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|6|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|6|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|6|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|6|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|6|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|6|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|6|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|6|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|6|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|6|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|6|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|6|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|6|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|6|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|6|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|6|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|6|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|6|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|6|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|6|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|6|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|6|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|7|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|7|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|7|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|7|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|7|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|7|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|7|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|7|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|7|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|7|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|7|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|7|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|7|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|7|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|7|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|7|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|7|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|7|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|7|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|7|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|7|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|7|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|7|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|7|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|7|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|8|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|8|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|8|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|8|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|8|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|8|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|8|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|8|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|8|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|8|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|8|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|8|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|8|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|8|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|8|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|8|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|8|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|8|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|8|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|8|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|8|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|8|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|8|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|8|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|8|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "gymnasium|9|astronomie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Astronomie_01082024_LTd.pdf",
    "gymnasium|9|biologie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Biologie_Gym_01082022_swd.pdf",
    "gymnasium|9|chemie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Chemie_Gym_01082022_swd.pdf",
    "gymnasium|9|deutsch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Deutsch_Gym_swd.pdf",
    "gymnasium|9|englisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Englisch_Gym_010822_swd.pdf",
    "gymnasium|9|ethik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ethik_Gym_01082022_swd.pdf",
    "gymnasium|9|evangelische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_EvangRU_Gym_01082022_swd.pdf",
    "gymnasium|9|franzoesisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Franz_Gym_010822_swd.pdf",
    "gymnasium|9|geographie":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geo_Gym_010822_swd.pdf",
    "gymnasium|9|geschichte":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Geschichte_Gym_01082022_swd.pdf",
    "gymnasium|9|griechisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/Griechisch_FLP_Gym_01082022k_swd.pdf",
    "gymnasium|9|informatik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Informatik_Gym_01082022_swd.pdf",
    "gymnasium|9|italienisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Ital_Gym_010822_swn.pdf",
    "gymnasium|9|katholische-religion":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_KathRU_Gym_01082022_swd.pdf",
    "gymnasium|9|kunst":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Kunst_Gym_01082022_swd.pdf",
    "gymnasium|9|latein":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Lat_Gym_01082022_sw.pdf",
    "gymnasium|9|lernen-in-der-digitalen-welt":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_LeDiWe_Gym_St01082023.pdf",
    "gymnasium|9|lernmethoden":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/RPL_Gym_Lernmeth_LT.pdf",
    "gymnasium|9|mathematik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Mathe_Gym_010822_swd.pdf",
    "gymnasium|9|musik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Musik_Gym_01082022_swd.pdf",
    "gymnasium|9|physik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Physik_Gym_01082022_swd.pdf",
    "gymnasium|9|russisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Russisch_Gym_01082022_swd.pdf",
    "gymnasium|9|sozialkunde":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sozi_Gym_01082022_swd.pdf",
    "gymnasium|9|spanisch":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Spanisch_Gym_010822_swd.pdf",
    "gymnasium|9|sport":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Sport_Gym_01082022_swd.pdf",
    "gymnasium|9|technik":
      "https://www.bildung-lsa.de/files/b45de329c361a40a2f0a7211902d5815/FLP_Technik_010824_LTnd.pdf",
    "sekundarschule|10|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "sekundarschule|10|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|10|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|10|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|10|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|10|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|10|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|10|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|10|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|10|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|10|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|10|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|10|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|10|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|10|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|10|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|10|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|10|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|10|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|10|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|10|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|10|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "sekundarschule|5|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|5|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|5|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|5|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|5|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|5|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|5|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|5|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|5|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|5|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|5|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|5|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|5|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|5|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|5|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|5|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|5|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|5|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|5|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|5|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|5|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "sekundarschule|6|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|6|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|6|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|6|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|6|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|6|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|6|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|6|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|6|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|6|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|6|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|6|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|6|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|6|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|6|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|6|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|6|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|6|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|6|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|6|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|6|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "sekundarschule|7|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|7|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|7|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|7|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|7|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|7|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|7|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|7|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|7|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|7|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|7|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|7|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|7|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|7|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|7|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|7|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|7|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|7|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|7|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|7|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|7|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "sekundarschule|8|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|8|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|8|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|8|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|8|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|8|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|8|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|8|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|8|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|8|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|8|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|8|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|8|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|8|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|8|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|8|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|8|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|8|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|8|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|8|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|8|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
    "sekundarschule|9|astronomie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_astro_01_08_2019.pdf",
    "sekundarschule|9|biologie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_biologie_01_08_2019.pdf",
    "sekundarschule|9|chemie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_chemie_01_08_2019.pdf",
    "sekundarschule|9|deutsch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_deutsch_01_08_2019_k2.pdf",
    "sekundarschule|9|englisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_engl_01_08_2019.pdf",
    "sekundarschule|9|ethik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_ethik_01_08_2019.pdf",
    "sekundarschule|9|evangelische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_evrel_01_08_2019.pdf",
    "sekundarschule|9|franzoesisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_franz_01_08_2019.pdf",
    "sekundarschule|9|geographie":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_geo_01_08_2019.pdf",
    "sekundarschule|9|geschichte":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_gesch_01_08_2019.pdf",
    "sekundarschule|9|hauswirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_hausw_01_08_2019.pdf",
    "sekundarschule|9|informatik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/LP_SKS_Informatik_SpE_01082026n.pdf",
    "sekundarschule|9|katholische-religion":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_karel_01_08_2019.pdf",
    "sekundarschule|9|kunst":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_kunst_01_08_2019.pdf",
    "sekundarschule|9|mathematik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_mathe_01_08_2019.pdf",
    "sekundarschule|9|musik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_musik_01_08_2019.pdf",
    "sekundarschule|9|physik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_physik_01_08_2019.pdf",
    "sekundarschule|9|russisch":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_russ_01_08_2019.pdf",
    "sekundarschule|9|sozialkunde":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sozi_01_08_2019.pdf",
    "sekundarschule|9|sport":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_sport_01_08_2019.pdf",
    "sekundarschule|9|technik":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_tech_01_08_2019.pdf",
    "sekundarschule|9|wirtschaft":
      "https://www.bildung-lsa.de/files/164f3f97e3adf65ff6f44685dd9e1ced/lp_sks_wirt_01_08_2019.pdf",
  },

  catalogPaths: [
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "astronomie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "wirtschaft" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "astronomie" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "11",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "11",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "11",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "wirtschaft" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "astronomie" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "12",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "12",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "12",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "wirtschaft" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "astronomie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "ethik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "geographie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "geschichte" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "hauswirtschaft",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "informatik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "technik" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "ethik" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "ethik" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "ethik" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "ethik" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geographie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "10", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "10", subject: "rechtskunde" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "technik" },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "11", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "11", subject: "biologie" },
    { schoolType: "gymnasium", grade: "11", subject: "chemie" },
    { schoolType: "gymnasium", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "11", subject: "englisch" },
    { schoolType: "gymnasium", grade: "11", subject: "ethik" },
    { schoolType: "gymnasium", grade: "11", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "11", subject: "geographie" },
    { schoolType: "gymnasium", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "11", subject: "informatik" },
    { schoolType: "gymnasium", grade: "11", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "11", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "kunst" },
    { schoolType: "gymnasium", grade: "11", subject: "latein" },
    { schoolType: "gymnasium", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "11", subject: "musik" },
    { schoolType: "gymnasium", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "11", subject: "physik" },
    { schoolType: "gymnasium", grade: "11", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "11", subject: "rechtskunde" },
    { schoolType: "gymnasium", grade: "11", subject: "russisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sport" },
    { schoolType: "gymnasium", grade: "11", subject: "technik" },
    { schoolType: "gymnasium", grade: "11", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "12", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "12", subject: "biologie" },
    { schoolType: "gymnasium", grade: "12", subject: "chemie" },
    { schoolType: "gymnasium", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "12", subject: "englisch" },
    { schoolType: "gymnasium", grade: "12", subject: "ethik" },
    { schoolType: "gymnasium", grade: "12", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "12", subject: "geographie" },
    { schoolType: "gymnasium", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "12", subject: "informatik" },
    { schoolType: "gymnasium", grade: "12", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "12", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "kunst" },
    { schoolType: "gymnasium", grade: "12", subject: "latein" },
    { schoolType: "gymnasium", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "12", subject: "musik" },
    { schoolType: "gymnasium", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "12", subject: "physik" },
    { schoolType: "gymnasium", grade: "12", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "12", subject: "rechtskunde" },
    { schoolType: "gymnasium", grade: "12", subject: "russisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sport" },
    { schoolType: "gymnasium", grade: "12", subject: "technik" },
    { schoolType: "gymnasium", grade: "12", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "chemie" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geographie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "5", subject: "informatik" },
    { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "5", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "physik" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "technik" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "chemie" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geographie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "6", subject: "informatik" },
    { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "6", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "technik" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geographie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "7", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "technik" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geographie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "8", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "technik" },
    { schoolType: "gymnasium", grade: "9", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geographie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "lernen-in-der-digitalen-welt",
    },
    { schoolType: "gymnasium", grade: "9", subject: "lernmethoden" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "technik" },
    { schoolType: "sekundarschule", grade: "10", subject: "astronomie" },
    { schoolType: "sekundarschule", grade: "10", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "10", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "10", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "10", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "10", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "10", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "10", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "10", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "10", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "10", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "10", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "10", subject: "musik" },
    { schoolType: "sekundarschule", grade: "10", subject: "physik" },
    { schoolType: "sekundarschule", grade: "10", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "10", subject: "sport" },
    { schoolType: "sekundarschule", grade: "10", subject: "technik" },
    { schoolType: "sekundarschule", grade: "10", subject: "wirtschaft" },
    { schoolType: "sekundarschule", grade: "5", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "5", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "5", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "5", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "5", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "5", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "5", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "5", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "5", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "5", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "5", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "5", subject: "musik" },
    { schoolType: "sekundarschule", grade: "5", subject: "physik" },
    { schoolType: "sekundarschule", grade: "5", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "5", subject: "sport" },
    { schoolType: "sekundarschule", grade: "5", subject: "technik" },
    { schoolType: "sekundarschule", grade: "5", subject: "wirtschaft" },
    { schoolType: "sekundarschule", grade: "6", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "6", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "6", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "6", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "6", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "6", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "6", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "6", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "6", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "6", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "6", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "6", subject: "musik" },
    { schoolType: "sekundarschule", grade: "6", subject: "physik" },
    { schoolType: "sekundarschule", grade: "6", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "6", subject: "sport" },
    { schoolType: "sekundarschule", grade: "6", subject: "technik" },
    { schoolType: "sekundarschule", grade: "6", subject: "wirtschaft" },
    { schoolType: "sekundarschule", grade: "7", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "7", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "7", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "7", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "7", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "7", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "7", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "7", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "7", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "7", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "7", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "7", subject: "musik" },
    { schoolType: "sekundarschule", grade: "7", subject: "physik" },
    { schoolType: "sekundarschule", grade: "7", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "7", subject: "sport" },
    { schoolType: "sekundarschule", grade: "7", subject: "technik" },
    { schoolType: "sekundarschule", grade: "7", subject: "wirtschaft" },
    { schoolType: "sekundarschule", grade: "8", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "8", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "8", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "8", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "8", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "8", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "8", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "8", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "8", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "8", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "8", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "8", subject: "musik" },
    { schoolType: "sekundarschule", grade: "8", subject: "physik" },
    { schoolType: "sekundarschule", grade: "8", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "8", subject: "sport" },
    { schoolType: "sekundarschule", grade: "8", subject: "technik" },
    { schoolType: "sekundarschule", grade: "8", subject: "wirtschaft" },
    { schoolType: "sekundarschule", grade: "9", subject: "astronomie" },
    { schoolType: "sekundarschule", grade: "9", subject: "biologie" },
    { schoolType: "sekundarschule", grade: "9", subject: "chemie" },
    { schoolType: "sekundarschule", grade: "9", subject: "deutsch" },
    { schoolType: "sekundarschule", grade: "9", subject: "englisch" },
    { schoolType: "sekundarschule", grade: "9", subject: "ethik" },
    {
      schoolType: "sekundarschule",
      grade: "9",
      subject: "evangelische-religion",
    },
    { schoolType: "sekundarschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "sekundarschule", grade: "9", subject: "geographie" },
    { schoolType: "sekundarschule", grade: "9", subject: "geschichte" },
    { schoolType: "sekundarschule", grade: "9", subject: "hauswirtschaft" },
    { schoolType: "sekundarschule", grade: "9", subject: "informatik" },
    {
      schoolType: "sekundarschule",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "sekundarschule", grade: "9", subject: "kunst" },
    { schoolType: "sekundarschule", grade: "9", subject: "mathematik" },
    { schoolType: "sekundarschule", grade: "9", subject: "musik" },
    { schoolType: "sekundarschule", grade: "9", subject: "physik" },
    { schoolType: "sekundarschule", grade: "9", subject: "russisch" },
    { schoolType: "sekundarschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "sekundarschule", grade: "9", subject: "sport" },
    { schoolType: "sekundarschule", grade: "9", subject: "technik" },
    { schoolType: "sekundarschule", grade: "9", subject: "wirtschaft" },
  ],
};
