import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface NrwCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Nordrhein-Westfalen Kernlehrpläne catalog (Lehrplannavigator NRW).
 *
 * Captured 2026-07-20 from https://lehrplannavigator.nrw.de/
 * Content URLs are official Kernlehrplan PDFs under
 * `system/files/media/document/file/…`.
 *
 * School types: Grundschule, Hauptschule, Realschule, Gesamtschule,
 * Gymnasium Sek I, Gymnasiale Oberstufe. Archive pages and Weiterbildungskolleg
 * out of scope for this capture.
 */
export interface KernlehrplanNrwManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: NrwCatalogPath[];
}

export const KERNLEHRPLAN_NRW_MANIFEST: KernlehrplanNrwManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Lehrplannavigator NRW (KLP SI/SII/Primar)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule / Primarstufe",
    },
    {
      id: "hauptschule",
      label: "Hauptschule",
    },
    {
      id: "realschule",
      label: "Realschule",
    },
    {
      id: "gesamtschule",
      label: "Gesamtschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium (Sek I)",
    },
    {
      id: "gymnasiale-oberstufe",
      label: "Gymnasiale Oberstufe",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    hauptschule: ["5", "6", "7", "8", "9", "10"],
    realschule: ["5", "6", "7", "8", "9", "10"],
    gesamtschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "gymnasiale-oberstufe": ["11", "12", "13"],
  },

  subjects: {
    hauptschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
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
        label: "Evangelische Religionslehre",
      },
      {
        id: "gesellschaftslehre",
        label: "Gesellschaftslehre",
      },
      {
        id: "gesellschaftslehre-gl",
        label: "Gesellschaftslehre Erdkunde Geschichte Politik",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "islamische-religion",
        label: "Islamischer Religionsunterricht",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "naturwissenschaften",
        label: "Naturwissenschaften Bi/Ch/Ph",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "praktische-philosophie",
        label: "Praktische Philosophie",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch Orthodoxe Religionslehre",
      },
      {
        id: "textilgestaltung",
        label: "Textilgestaltung",
      },
      {
        id: "tuerkisch",
        label: "Tuerkisch",
      },
      {
        id: "wirtschaft-arbeitswelt",
        label: "Wirtschaft Arbeitswelt",
      },
      {
        id: "wp-informatik",
        label: "WP Informatik",
      },
      {
        id: "wp-wirtschaft-und-arbeitswelt",
        label: "WP Wirtschaft Und Arbeitswelt",
      },
    ],
    gesamtschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
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
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch",
        label: "Franzoesisch",
      },
      {
        id: "gesellschaftslehre-gl",
        label: "Gesellschaftslehre Wirtschaft Politik Erdkunde Geschichte",
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
        id: "islamische-religion",
        label: "Islamischer Religionsunterricht",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "japanisch",
        label: "Japanisch",
      },
      {
        id: "juedische-religion",
        label: "Juedische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "naturwissenschaften",
        label: "Naturwissenschaften",
      },
      {
        id: "niederlaendisch",
        label: "Niederlaendisch",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "praktische-philosophie",
        label: "Praktische Philosophie",
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
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch Orthodoxe Religionslehre",
      },
      {
        id: "technik",
        label: "Technik",
      },
      {
        id: "tuerkisch",
        label: "Tuerkisch",
      },
      {
        id: "wp-arbeitslehre",
        label: "WP Arbeitslehre",
      },
      {
        id: "wp-darstellen-und-gestalten",
        label: "WP Darstellen Und Gestalten",
      },
      {
        id: "wp-informatik",
        label: "WP Informatik",
      },
      {
        id: "wp-naturwissenschaften",
        label: "WP Naturwissenschaften",
      },
      {
        id: "wp-wirtschaft-und-arbeitswelt",
        label: "WP Wirtschaft Und Arbeitswelt",
      },
    ],
    realschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
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
        id: "erdkunde",
        label: "Erdkunde",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch",
        label: "Franzoesisch",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "informatik-realschule",
        label: "Informatik Realschule",
      },
      {
        id: "islamische-religion",
        label: "Islamischer Religionsunterricht",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "japanisch",
        label: "Japanisch",
      },
      {
        id: "juedische-religion",
        label: "Juedische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "niederlaendisch",
        label: "Niederlaendisch",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "politik",
        label: "Politik",
      },
      {
        id: "praktische-philosophie",
        label: "Praktische Philosophie",
      },
      {
        id: "russisch",
        label: "Russisch",
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
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch Orthodoxe Religionslehre",
      },
      {
        id: "textilgestaltung",
        label: "Textilgestaltung",
      },
      {
        id: "tuerkisch",
        label: "Tuerkisch",
      },
      {
        id: "wirtschaft",
        label: "Wirtschaft",
      },
      {
        id: "wp-biologie",
        label: "WP Biologie",
      },
      {
        id: "wp-chemie",
        label: "WP Chemie",
      },
      {
        id: "wp-informatik",
        label: "WP Informatik",
      },
      {
        id: "wp-kunst",
        label: "WP Kunst",
      },
      {
        id: "wp-musik",
        label: "WP Musik",
      },
      {
        id: "wp-physik",
        label: "WP Physik",
      },
      {
        id: "wp-sozialwissenschaften",
        label: "WP Sozialwissenschaften",
      },
      {
        id: "wp-technik",
        label: "WP Technik",
      },
      {
        id: "wp-wirtschaft",
        label: "WP Wirtschaft",
      },
    ],
    gymnasium: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
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
        id: "erdkunde",
        label: "Erdkunde",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch",
        label: "Franzoesisch",
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
        id: "islamische-religion",
        label: "Islamischer Religionsunterricht",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "japanisch",
        label: "Japanisch",
      },
      {
        id: "juedische-religion",
        label: "Juedische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "neugriechisch",
        label: "Neugriechisch",
      },
      {
        id: "niederlaendisch",
        label: "Niederlaendisch",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "portugiesisch",
        label: "Portugiesisch",
      },
      {
        id: "pp",
        label: "Pp",
      },
      {
        id: "praktische-philosophie",
        label: "Praktische Philosophie",
      },
      {
        id: "russisch",
        label: "Russisch",
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
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch Orthodoxe Religionslehre",
      },
      {
        id: "tuerkisch",
        label: "Tuerkisch",
      },
      {
        id: "wirtschaft-politik",
        label: "Wirtschaft Politik",
      },
      {
        id: "wp-informatik",
        label: "WP Informatik",
      },
      {
        id: "wp-kunst",
        label: "WP Kunst",
      },
      {
        id: "wp-musik",
        label: "WP Musik",
      },
      {
        id: "wp-technik",
        label: "WP Technik",
      },
      {
        id: "wp-wirtschaft",
        label: "WP Wirtschaft",
      },
    ],
    grundschule: [
      {
        id: "alevitische-religion",
        label: "Alevitischer",
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
        label: "Evangelische",
      },
      {
        id: "islamische-religion",
        label: "Islamischer",
      },
      {
        id: "juedische-religion",
        label: "Juedische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "praktische-philosophie",
        label: "Praktische Philosophie",
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
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch Orthodoxe",
      },
    ],
    "gymnasiale-oberstufe": [
      {
        id: "biologie",
        label: "Biologie",
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
        id: "ernaehrungslehre",
        label: "Ernaehrungslehre",
      },
      {
        id: "erziehungswissenschaft",
        label: "Erziehungswissenschaft",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch",
        label: "Franzoesisch",
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
        id: "hebraeisch",
        label: "Hebraeisch",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "islamische-religion",
        label: "Islamischer",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "japanisch",
        label: "Japanisch",
      },
      {
        id: "juedische-religion",
        label: "Juedische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
      },
      {
        id: "kernlehrplaene-fuer-die",
        label: "Kernlehrplaene Fuer Die",
      },
      {
        id: "kunst",
        label: "Kunst",
      },
      {
        id: "latein",
        label: "Lateinisch",
      },
      {
        id: "literatur",
        label: "Literatur",
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
        id: "neugriechisch",
        label: "Neugriechisch",
      },
      {
        id: "niederlaendisch",
        label: "Niederlaendisch",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
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
        id: "portugiesisch",
        label: "Portugiesisch",
      },
      {
        id: "psychologie",
        label: "Psychologie",
      },
      {
        id: "recht",
        label: "Recht",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sozialwissenschaften",
        label: "Sozialwissenschaften Und",
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
        id: "tuerkisch",
        label: "Tuerkisch",
      },
    ],
  },

  tracks: {},

  topics: {
    "gesamtschule|10|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|10|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|10|wp-arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|wp-darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|10|wp-naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|10|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|5|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|6|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|7|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|7|wp-arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|wp-darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|7|wp-naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|7|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|8|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|8|wp-arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|wp-darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|8|wp-naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|8|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "gesamtschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|hauswirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "gesamtschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|9|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gesamtschule|9|wp-arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|wp-darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gesamtschule|9|wp-naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gesamtschule|9|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "grundschule|1|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "grundschule|1|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|praktische-philosophie": [
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
    "grundschule|1|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "grundschule|2|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "grundschule|2|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|praktische-philosophie": [
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
    "grundschule|2|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "grundschule|3|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "grundschule|3|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|praktische-philosophie": [
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
    "grundschule|3|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "grundschule|4|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "grundschule|4|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|praktische-philosophie": [
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
    "grundschule|4|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|biologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|chemie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|chinesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|deutsch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|englisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|ernaehrungslehre": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|erziehungswissenschaft": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|geographie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|geschichte": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|griechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|hebraeisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|italienisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|japanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|kernlehrplaene-fuer-die": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|kunst": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|latein": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|literatur": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|mathematik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|musik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|neugriechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|niederlaendisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|orthodoxe-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|philosophie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|physik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|psychologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|recht": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|russisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|sozialwissenschaften": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|spanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|sport": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|technik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|biologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|chemie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|chinesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|deutsch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|englisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|ernaehrungslehre": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|erziehungswissenschaft": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|geographie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|geschichte": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|griechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|hebraeisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|italienisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|japanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|kernlehrplaene-fuer-die": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|kunst": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|latein": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|literatur": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|mathematik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|musik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|neugriechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|niederlaendisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|orthodoxe-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|philosophie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|physik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|psychologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|recht": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|russisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|sozialwissenschaften": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|sport": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|technik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|biologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|chemie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|chinesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|deutsch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|englisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|ernaehrungslehre": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|erziehungswissenschaft": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|geographie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|geschichte": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|griechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|hebraeisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|italienisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|japanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|kernlehrplaene-fuer-die": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|kunst": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|latein": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|literatur": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|mathematik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|musik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|neugriechisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|niederlaendisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|orthodoxe-religion": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|philosophie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|physik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|psychologie": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|recht": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|russisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|sozialwissenschaften": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|sport": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|technik": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasium|10|alevitische-religion": [
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
    "gymnasium|10|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|10|islamische-religion": [
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
    "gymnasium|10|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|10|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|orthodoxe-religion": [
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
    "gymnasium|10|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|praktische-philosophie": [
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
    "gymnasium|10|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|alevitische-religion": [
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
    "gymnasium|5|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|5|islamische-religion": [
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
    "gymnasium|5|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|5|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|orthodoxe-religion": [
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
    "gymnasium|5|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|praktische-philosophie": [
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
    "gymnasium|5|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|alevitische-religion": [
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
    "gymnasium|6|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|6|islamische-religion": [
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
    "gymnasium|6|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|6|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|orthodoxe-religion": [
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
    "gymnasium|6|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|russisch": [
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
    "gymnasium|6|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|alevitische-religion": [
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
    "gymnasium|7|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|7|islamische-religion": [
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
    "gymnasium|7|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|7|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|orthodoxe-religion": [
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
    "gymnasium|7|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|russisch": [
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
    "gymnasium|7|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|alevitische-religion": [
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
    "gymnasium|8|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|islamische-religion": [
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
    "gymnasium|8|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|8|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|orthodoxe-religion": [
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
    "gymnasium|8|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|russisch": [
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
    "gymnasium|8|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|alevitische-religion": [
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
    "gymnasium|9|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
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
    "gymnasium|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|islamische-religion": [
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
    "gymnasium|9|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|9|neugriechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|orthodoxe-religion": [
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
    "gymnasium|9|portugiesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|pp": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|russisch": [
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
    "gymnasium|9|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|wirtschaft-politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|10|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|10|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|5|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|5|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|6|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|6|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|7|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|7|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|8|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|8|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "hauptschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|gesellschaftslehre-gl": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "hauptschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|9|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|9|wirtschaft-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|wp-wirtschaft-und-arbeitswelt": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|wp-sozialwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|wp-sozialwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|wp-sozialwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|alevitische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|chinesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|informatik-realschule": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|islamische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|japanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|juedische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|niederlaendisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|politik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|praktische-philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|syrisch-orthodoxe-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|textilgestaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|wp-chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|wp-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|wp-sozialwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wp-wirtschaft": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "gesamtschule|10|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|10|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|10|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|10|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|10|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|10|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|10|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|10|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|10|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|10|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|10|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|10|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|10|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|10|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|10|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|10|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|10|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|10|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|10|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|10|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|10|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|10|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|10|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|10|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|10|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|10|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|10|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|10|wp-arbeitslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_al.pdf",
    "gesamtschule|10|wp-darstellen-und-gestalten":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/handreichungdug_0.pdf",
    "gesamtschule|10|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpif_klp_2023_06_01_0.pdf",
    "gesamtschule|10|wp-naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_naturwissenschaften.pdf",
    "gesamtschule|10|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpwiaw_klp_31031_2022_06_24.pdf",
    "gesamtschule|5|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|5|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|5|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|5|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|5|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|5|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|5|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|5|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|5|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|5|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|5|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|5|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|5|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|5|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|5|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|5|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|5|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|5|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|5|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|5|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|5|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|5|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|5|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|5|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|5|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|5|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|5|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|6|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|6|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|6|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|6|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|6|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|6|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|6|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|6|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|6|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|6|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|6|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|6|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|6|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|6|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|6|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|6|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|6|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|6|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|6|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|6|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|6|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|6|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|6|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|6|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|6|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|6|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|6|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|7|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|7|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|7|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|7|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|7|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|7|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|7|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|7|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|7|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|7|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|7|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|7|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|7|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|7|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|7|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|7|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|7|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|7|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|7|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|7|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|7|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|7|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|7|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|7|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|7|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|7|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|7|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|7|wp-arbeitslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_al.pdf",
    "gesamtschule|7|wp-darstellen-und-gestalten":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/handreichungdug_0.pdf",
    "gesamtschule|7|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpif_klp_2023_06_01_0.pdf",
    "gesamtschule|7|wp-naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_naturwissenschaften.pdf",
    "gesamtschule|7|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpwiaw_klp_31031_2022_06_24.pdf",
    "gesamtschule|8|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|8|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|8|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|8|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|8|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|8|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|8|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|8|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|8|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|8|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|8|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|8|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|8|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|8|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|8|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|8|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|8|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|8|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|8|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|8|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|8|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|8|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|8|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|8|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|8|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|8|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|8|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|8|wp-arbeitslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_al.pdf",
    "gesamtschule|8|wp-darstellen-und-gestalten":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/handreichungdug_0.pdf",
    "gesamtschule|8|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpif_klp_2023_06_01_0.pdf",
    "gesamtschule|8|wp-naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_naturwissenschaften.pdf",
    "gesamtschule|8|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpwiaw_klp_31031_2022_06_24.pdf",
    "gesamtschule|9|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gesamtschule|9|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_c_klp_2021_07_14.pdf",
    "gesamtschule|9|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_d_klp_2022_06_17.pdf",
    "gesamtschule|9|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_e_klp_2022_06_13.pdf",
    "gesamtschule|9|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ev_religionslehre.pdf",
    "gesamtschule|9|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_f_klp_2021_07_14.pdf",
    "gesamtschule|9|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_gl_klp_3120_2020_07_01.pdf",
    "gesamtschule|9|hauswirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_hw_klp_3123_2020_07_01.pdf",
    "gesamtschule|9|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gesamtschule|9|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gesamtschule|9|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_i_klp_2021_07_14.pdf",
    "gesamtschule|9|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_j_klp_2021_07_14.pdf",
    "gesamtschule|9|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gesamtschule|9|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_1.pdf",
    "gesamtschule|9|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_ku.pdf",
    "gesamtschule|9|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_l_klp_2021_07_14.pdf",
    "gesamtschule|9|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_m_klp_2022_06_17.pdf",
    "gesamtschule|9|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_mu.pdf",
    "gesamtschule|9|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_nw.pdf",
    "gesamtschule|9|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_n_klp_2021_07_14.pdf",
    "gesamtschule|9|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gesamtschule|9|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gesamtschule|9|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_s_klp_2021_07_14.pdf",
    "gesamtschule|9|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_sp.pdf",
    "gesamtschule|9|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gesamtschule|9|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_tc_klp_3124_2020_07_01.pdf",
    "gesamtschule|9|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_t_klp_2021_07_14.pdf",
    "gesamtschule|9|wp-arbeitslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_al.pdf",
    "gesamtschule|9|wp-darstellen-und-gestalten":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/handreichungdug_0.pdf",
    "gesamtschule|9|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpif_klp_2023_06_01_0.pdf",
    "gesamtschule|9|wp-naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_ge_wp_naturwissenschaften.pdf",
    "gesamtschule|9|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gesk_wpwiaw_klp_31031_2022_06_24.pdf",
    "grundschule|1|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ar.pdf",
    "grundschule|1|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_d_einzeldatei_2021_08_02.pdf",
    "grundschule|1|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_e_einzeldatei_2021_08_02.pdf",
    "grundschule|1|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_er_einzeldatei_2021_08_02.pdf",
    "grundschule|1|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_islamischer_ru_2021_07_29.pdf",
    "grundschule|1|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_juedische_rl_2021_07_29.pdf",
    "grundschule|1|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_kr_einzeldatei_2021_08_02.pdf",
    "grundschule|1|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ku_einzeldatei_2021_08_02.pdf",
    "grundschule|1|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_m_einzeldatei_2021_08_02.pdf",
    "grundschule|1|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_mu_einzeldatei_2021_08_02.pdf",
    "grundschule|1|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|1|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_pp_einzeldatei_2021_08_02.pdf",
    "grundschule|1|sachunterricht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_su_einzeldatei_2021_08_02.pdf",
    "grundschule|1|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_sp_einzeldatei_2021_08_02.pdf",
    "grundschule|1|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_syrisch_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|2|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ar.pdf",
    "grundschule|2|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_d_einzeldatei_2021_08_02.pdf",
    "grundschule|2|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_e_einzeldatei_2021_08_02.pdf",
    "grundschule|2|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_er_einzeldatei_2021_08_02.pdf",
    "grundschule|2|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_islamischer_ru_2021_07_29.pdf",
    "grundschule|2|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_juedische_rl_2021_07_29.pdf",
    "grundschule|2|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_kr_einzeldatei_2021_08_02.pdf",
    "grundschule|2|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ku_einzeldatei_2021_08_02.pdf",
    "grundschule|2|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_m_einzeldatei_2021_08_02.pdf",
    "grundschule|2|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_mu_einzeldatei_2021_08_02.pdf",
    "grundschule|2|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|2|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_pp_einzeldatei_2021_08_02.pdf",
    "grundschule|2|sachunterricht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_su_einzeldatei_2021_08_02.pdf",
    "grundschule|2|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_sp_einzeldatei_2021_08_02.pdf",
    "grundschule|2|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_syrisch_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|3|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ar.pdf",
    "grundschule|3|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_d_einzeldatei_2021_08_02.pdf",
    "grundschule|3|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_e_einzeldatei_2021_08_02.pdf",
    "grundschule|3|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_er_einzeldatei_2021_08_02.pdf",
    "grundschule|3|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_islamischer_ru_2021_07_29.pdf",
    "grundschule|3|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_juedische_rl_2021_07_29.pdf",
    "grundschule|3|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_kr_einzeldatei_2021_08_02.pdf",
    "grundschule|3|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ku_einzeldatei_2021_08_02.pdf",
    "grundschule|3|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_m_einzeldatei_2021_08_02.pdf",
    "grundschule|3|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_mu_einzeldatei_2021_08_02.pdf",
    "grundschule|3|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|3|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_pp_einzeldatei_2021_08_02.pdf",
    "grundschule|3|sachunterricht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_su_einzeldatei_2021_08_02.pdf",
    "grundschule|3|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_sp_einzeldatei_2021_08_02.pdf",
    "grundschule|3|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_syrisch_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|4|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ar.pdf",
    "grundschule|4|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_d_einzeldatei_2021_08_02.pdf",
    "grundschule|4|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_e_einzeldatei_2021_08_02.pdf",
    "grundschule|4|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_er_einzeldatei_2021_08_02.pdf",
    "grundschule|4|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_islamischer_ru_2021_07_29.pdf",
    "grundschule|4|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_juedische_rl_2021_07_29.pdf",
    "grundschule|4|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_kr_einzeldatei_2021_08_02.pdf",
    "grundschule|4|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_ku_einzeldatei_2021_08_02.pdf",
    "grundschule|4|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_m_einzeldatei_2021_08_02.pdf",
    "grundschule|4|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_mu_einzeldatei_2021_08_02.pdf",
    "grundschule|4|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_orthodoxe_rl_2021_07_29.pdf",
    "grundschule|4|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_pp_einzeldatei_2021_08_02.pdf",
    "grundschule|4|sachunterricht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_su_einzeldatei_2021_08_02.pdf",
    "grundschule|4|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_sp_einzeldatei_2021_08_02.pdf",
    "grundschule|4|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_syrisch_orthodoxe_rl_2021_07_29.pdf",
    "gymnasiale-oberstufe|11|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|11|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ch_2022_06_07.pdf",
    "gymnasiale-oberstufe|11|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_chinesisch.pdf",
    "gymnasiale-oberstufe|11|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_d_2023_06_07.pdf",
    "gymnasiale-oberstufe|11|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_e_2023_06_07_0.pdf",
    "gymnasiale-oberstufe|11|ernaehrungslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_ernaehrungslehre.pdf",
    "gymnasiale-oberstufe|11|erziehungswissenschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_erziehungswissenschaft.pdf",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ev.pdf",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_f_2023_06_07.pdf",
    "gymnasiale-oberstufe|11|geographie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geographie.pdf",
    "gymnasiale-oberstufe|11|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geschichte.pdf",
    "gymnasiale-oberstufe|11|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_griechisch.pdf",
    "gymnasiale-oberstufe|11|hebraeisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_hebraeisch.pdf",
    "gymnasiale-oberstufe|11|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_informatik.pdf",
    "gymnasiale-oberstufe|11|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_islamischer_religionsunterricht.pdf",
    "gymnasiale-oberstufe|11|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_italienisch.pdf",
    "gymnasiale-oberstufe|11|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_japanisch.pdf",
    "gymnasiale-oberstufe|11|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ju.pdf",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ka_0.pdf",
    "gymnasiale-oberstufe|11|kernlehrplaene-fuer-die":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|11|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_kunst.pdf",
    "gymnasiale-oberstufe|11|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_lateinisch.pdf",
    "gymnasiale-oberstufe|11|literatur":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_literatur.pdf",
    "gymnasiale-oberstufe|11|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_m_2023_06_07.pdf",
    "gymnasiale-oberstufe|11|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_musik.pdf",
    "gymnasiale-oberstufe|11|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_neugriechisch.pdf",
    "gymnasiale-oberstufe|11|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_niederlaendisch.pdf",
    "gymnasiale-oberstufe|11|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_orthodoxe_religionslehre.pdf",
    "gymnasiale-oberstufe|11|philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_philosophie.pdf",
    "gymnasiale-oberstufe|11|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ph_2022_06_07.pdf",
    "gymnasiale-oberstufe|11|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_portugiesisch.pdf",
    "gymnasiale-oberstufe|11|psychologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_psychologie.pdf",
    "gymnasiale-oberstufe|11|recht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_recht.pdf",
    "gymnasiale-oberstufe|11|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_russisch.pdf",
    "gymnasiale-oberstufe|11|sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sowi.pdf",
    "gymnasiale-oberstufe|11|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_spanisch.pdf",
    "gymnasiale-oberstufe|11|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sport.pdf",
    "gymnasiale-oberstufe|11|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_technik.pdf",
    "gymnasiale-oberstufe|11|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_tuerkisch.pdf",
    "gymnasiale-oberstufe|12|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|12|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ch_2022_06_07.pdf",
    "gymnasiale-oberstufe|12|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_chinesisch.pdf",
    "gymnasiale-oberstufe|12|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_d_2023_06_07.pdf",
    "gymnasiale-oberstufe|12|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_e_2023_06_07_0.pdf",
    "gymnasiale-oberstufe|12|ernaehrungslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_ernaehrungslehre.pdf",
    "gymnasiale-oberstufe|12|erziehungswissenschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_erziehungswissenschaft.pdf",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ev.pdf",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_f_2023_06_07.pdf",
    "gymnasiale-oberstufe|12|geographie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geographie.pdf",
    "gymnasiale-oberstufe|12|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geschichte.pdf",
    "gymnasiale-oberstufe|12|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_griechisch.pdf",
    "gymnasiale-oberstufe|12|hebraeisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_hebraeisch.pdf",
    "gymnasiale-oberstufe|12|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_informatik.pdf",
    "gymnasiale-oberstufe|12|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_islamischer_religionsunterricht.pdf",
    "gymnasiale-oberstufe|12|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_italienisch.pdf",
    "gymnasiale-oberstufe|12|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_japanisch.pdf",
    "gymnasiale-oberstufe|12|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ju.pdf",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ka_0.pdf",
    "gymnasiale-oberstufe|12|kernlehrplaene-fuer-die":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|12|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_kunst.pdf",
    "gymnasiale-oberstufe|12|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_lateinisch.pdf",
    "gymnasiale-oberstufe|12|literatur":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_literatur.pdf",
    "gymnasiale-oberstufe|12|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_m_2023_06_07.pdf",
    "gymnasiale-oberstufe|12|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_musik.pdf",
    "gymnasiale-oberstufe|12|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_neugriechisch.pdf",
    "gymnasiale-oberstufe|12|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_niederlaendisch.pdf",
    "gymnasiale-oberstufe|12|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_orthodoxe_religionslehre.pdf",
    "gymnasiale-oberstufe|12|philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_philosophie.pdf",
    "gymnasiale-oberstufe|12|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ph_2022_06_07.pdf",
    "gymnasiale-oberstufe|12|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_portugiesisch.pdf",
    "gymnasiale-oberstufe|12|psychologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_psychologie.pdf",
    "gymnasiale-oberstufe|12|recht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_recht.pdf",
    "gymnasiale-oberstufe|12|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_russisch.pdf",
    "gymnasiale-oberstufe|12|sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sowi.pdf",
    "gymnasiale-oberstufe|12|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_spanisch.pdf",
    "gymnasiale-oberstufe|12|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sport.pdf",
    "gymnasiale-oberstufe|12|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_technik.pdf",
    "gymnasiale-oberstufe|12|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_tuerkisch.pdf",
    "gymnasiale-oberstufe|13|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|13|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ch_2022_06_07.pdf",
    "gymnasiale-oberstufe|13|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_chinesisch.pdf",
    "gymnasiale-oberstufe|13|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_d_2023_06_07.pdf",
    "gymnasiale-oberstufe|13|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_e_2023_06_07_0.pdf",
    "gymnasiale-oberstufe|13|ernaehrungslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_ernaehrungslehre.pdf",
    "gymnasiale-oberstufe|13|erziehungswissenschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_erziehungswissenschaft.pdf",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ev.pdf",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_f_2023_06_07.pdf",
    "gymnasiale-oberstufe|13|geographie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geographie.pdf",
    "gymnasiale-oberstufe|13|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_geschichte.pdf",
    "gymnasiale-oberstufe|13|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_griechisch.pdf",
    "gymnasiale-oberstufe|13|hebraeisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_hebraeisch.pdf",
    "gymnasiale-oberstufe|13|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_informatik.pdf",
    "gymnasiale-oberstufe|13|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_islamischer_religionsunterricht.pdf",
    "gymnasiale-oberstufe|13|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_italienisch.pdf",
    "gymnasiale-oberstufe|13|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_japanisch.pdf",
    "gymnasiale-oberstufe|13|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ju.pdf",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_religionslehre_ka_0.pdf",
    "gymnasiale-oberstufe|13|kernlehrplaene-fuer-die":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_bi_2022_06_07_0.pdf",
    "gymnasiale-oberstufe|13|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_kunst.pdf",
    "gymnasiale-oberstufe|13|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_lateinisch.pdf",
    "gymnasiale-oberstufe|13|literatur":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_literatur.pdf",
    "gymnasiale-oberstufe|13|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_m_2023_06_07.pdf",
    "gymnasiale-oberstufe|13|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_musik.pdf",
    "gymnasiale-oberstufe|13|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_neugriechisch.pdf",
    "gymnasiale-oberstufe|13|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_niederlaendisch.pdf",
    "gymnasiale-oberstufe|13|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_orthodoxe_religionslehre.pdf",
    "gymnasiale-oberstufe|13|philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_philosophie.pdf",
    "gymnasiale-oberstufe|13|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gost_klp_ph_2022_06_07.pdf",
    "gymnasiale-oberstufe|13|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_portugiesisch.pdf",
    "gymnasiale-oberstufe|13|psychologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_psychologie.pdf",
    "gymnasiale-oberstufe|13|recht":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_recht.pdf",
    "gymnasiale-oberstufe|13|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_russisch.pdf",
    "gymnasiale-oberstufe|13|sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sowi.pdf",
    "gymnasiale-oberstufe|13|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_spanisch.pdf",
    "gymnasiale-oberstufe|13|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_sport.pdf",
    "gymnasiale-oberstufe|13|technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_technik.pdf",
    "gymnasiale-oberstufe|13|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_gost_tuerkisch.pdf",
    "gymnasium|10|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|10|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|10|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|10|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|10|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|10|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|10|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|10|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|10|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|10|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|10|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|10|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|10|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|10|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|10|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|10|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|10|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|10|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|10|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|10|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|10|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|10|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|10|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|10|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|10|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|10|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|10|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|10|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|10|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|10|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|10|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|10|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|10|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|10|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|10|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpif_klp_2023_06_01.pdf",
    "gymnasium|10|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpku_klp_34051_2019_06_23.pdf",
    "gymnasium|10|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpmu_klp_34061_2019_06_23.pdf",
    "gymnasium|10|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wptc_klp_34221_2019_06_23.pdf",
    "gymnasium|10|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpwi_klp_34231_2022_06_24.pdf",
    "gymnasium|5|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|5|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|5|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|5|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|5|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|5|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|5|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|5|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|5|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|5|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|5|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|5|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|5|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|5|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|5|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|5|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|5|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|5|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|5|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|5|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|5|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|5|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|5|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|5|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|5|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|5|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|5|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|5|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|5|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|5|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|5|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|5|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|5|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|5|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|6|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|6|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|6|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|6|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|6|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|6|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|6|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|6|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|6|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|6|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|6|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|6|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|6|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|6|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|6|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|6|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|6|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|6|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|6|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|6|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|6|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|6|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|6|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|6|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|6|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|6|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|6|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|6|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|6|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|6|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|6|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|6|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|6|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|6|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|7|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|7|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|7|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|7|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|7|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|7|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|7|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|7|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|7|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|7|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|7|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|7|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|7|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|7|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|7|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|7|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|7|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|7|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|7|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|7|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|7|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|7|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|7|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|7|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|7|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|7|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|7|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|7|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|7|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|7|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|7|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|7|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|7|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|7|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|7|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpif_klp_2023_06_01.pdf",
    "gymnasium|7|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpku_klp_34051_2019_06_23.pdf",
    "gymnasium|7|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpmu_klp_34061_2019_06_23.pdf",
    "gymnasium|7|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wptc_klp_34221_2019_06_23.pdf",
    "gymnasium|7|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpwi_klp_34231_2022_06_24.pdf",
    "gymnasium|8|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|8|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|8|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|8|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|8|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|8|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|8|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|8|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|8|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|8|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|8|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|8|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|8|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|8|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|8|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|8|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|8|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|8|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|8|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|8|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|8|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|8|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|8|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|8|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|8|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|8|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|8|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|8|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|8|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|8|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|8|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|8|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|8|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|8|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|8|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpif_klp_2023_06_01.pdf",
    "gymnasium|8|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpku_klp_34051_2019_06_23.pdf",
    "gymnasium|8|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpmu_klp_34061_2019_06_23.pdf",
    "gymnasium|8|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wptc_klp_34221_2019_06_23.pdf",
    "gymnasium|8|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpwi_klp_34231_2022_06_24.pdf",
    "gymnasium|9|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "gymnasium|9|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_bi_klp_-3413_2019_06_23.pdf",
    "gymnasium|9|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ch_klp_3415_2019_06_23.pdf",
    "gymnasium|9|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_c_klp_3432_2020_06_17.pdf",
    "gymnasium|9|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_d_klp_3409_2019_06_23.pdf",
    "gymnasium|9|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_e_klp_3417_2019_06_23.pdf",
    "gymnasium|9|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ek_klp_3408_2019_06_23.pdf",
    "gymnasium|9|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_er_klp_3414_2019_06_23.pdf",
    "gymnasium|9|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_f_klp_3410_2019_06_23.pdf",
    "gymnasium|9|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ge_klp_3407_2019_06_23.pdf",
    "gymnasium|9|griechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_g_klp_3404_2020_06_17.pdf",
    "gymnasium|9|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "gymnasium|9|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "gymnasium|9|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_i_klp_3418_2020_06_17.pdf",
    "gymnasium|9|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_j_klp_2021_07_14_1.pdf",
    "gymnasium|9|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "gymnasium|9|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_kr_klp_3403_2019_06_23_1.pdf",
    "gymnasium|9|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ku_klp_3405_2019_06_23.pdf",
    "gymnasium|9|latein":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_l_klp_3402_2019_06_23_0.pdf",
    "gymnasium|9|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_m_klp_3401_2019_06_23_0.pdf",
    "gymnasium|9|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_mu_klp_3406_2019_06_23_0.pdf",
    "gymnasium|9|neugriechisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_neug_klp_3436_2020_06_17.pdf",
    "gymnasium|9|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_n_klp_3420_2020_06_17.pdf",
    "gymnasium|9|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "gymnasium|9|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_ph_klp_3411_2019_06_23.pdf",
    "gymnasium|9|portugiesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_pt_klp_3435_2020_06_17.pdf",
    "gymnasium|9|pp":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "gymnasium|9|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/pp_klp_5017_2008_05_06.pdf",
    "gymnasium|9|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_r_klp_3419_2020_06_17.pdf",
    "gymnasium|9|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_s_klp_3416_2019_06_23.pdf",
    "gymnasium|9|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_sp_klp_3426_2019_06_23.pdf",
    "gymnasium|9|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "gymnasium|9|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_t_klp_3430_2020_06_17.pdf",
    "gymnasium|9|wirtschaft-politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wipo_klp_3429_2019_06_23.pdf",
    "gymnasium|9|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpif_klp_2023_06_01.pdf",
    "gymnasium|9|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpku_klp_34051_2019_06_23.pdf",
    "gymnasium|9|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpmu_klp_34061_2019_06_23.pdf",
    "gymnasium|9|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wptc_klp_34221_2019_06_23.pdf",
    "gymnasium|9|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/g9_wpwi_klp_34231_2022_06_24.pdf",
    "hauptschule|10|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|10|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|10|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|10|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|10|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|10|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|10|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|10|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|10|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|10|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|10|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|10|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|10|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|10|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|10|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|10|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|10|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|10|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|10|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|10|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|10|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|10|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpif_klp_2023_06_01_2.pdf",
    "hauptschule|10|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpwiaw_klp_32151_2022_06_24_0.pdf",
    "hauptschule|5|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|5|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|5|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|5|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|5|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|5|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|5|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|5|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|5|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|5|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|5|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|5|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|5|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|5|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|5|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|5|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|5|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|5|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|5|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|5|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|5|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|6|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|6|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|6|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|6|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|6|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|6|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|6|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|6|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|6|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|6|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|6|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|6|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|6|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|6|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|6|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|6|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|6|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|6|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|6|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|6|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|6|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|7|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|7|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|7|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|7|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|7|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|7|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|7|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|7|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|7|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|7|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|7|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|7|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|7|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|7|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|7|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|7|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|7|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|7|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|7|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|7|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|7|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|7|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpif_klp_2023_06_01_2.pdf",
    "hauptschule|7|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpwiaw_klp_32151_2022_06_24_0.pdf",
    "hauptschule|8|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|8|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|8|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|8|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|8|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|8|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|8|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|8|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|8|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|8|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|8|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|8|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|8|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|8|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|8|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|8|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|8|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|8|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|8|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|8|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|8|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|8|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpif_klp_2023_06_01_2.pdf",
    "hauptschule|8|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpwiaw_klp_32151_2022_06_24_0.pdf",
    "hauptschule|9|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "hauptschule|9|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_d_klp_2022_06_17_0.pdf",
    "hauptschule|9|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_e_klp_2022_06_13_0.pdf",
    "hauptschule|9|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_ev_religionslehre.pdf",
    "hauptschule|9|gesellschaftslehre":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/gl_hs_klp.pdf",
    "hauptschule|9|gesellschaftslehre-gl":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_gl_klp_3202_2022_03_15.pdf",
    "hauptschule|9|informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "hauptschule|9|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "hauptschule|9|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre_0.pdf",
    "hauptschule|9|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_kunst_0.pdf",
    "hauptschule|9|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_m_klp_2022_06_17_0.pdf",
    "hauptschule|9|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_musik_0.pdf",
    "hauptschule|9|naturwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/nw_hs_klp.pdf",
    "hauptschule|9|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "hauptschule|9|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "hauptschule|9|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_r_klp_2021_07_14_0.pdf",
    "hauptschule|9|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_sport_0.pdf",
    "hauptschule|9|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "hauptschule|9|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_hs_textilgestaltung_1.pdf",
    "hauptschule|9|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_t_klp_2021_07_14_0.pdf",
    "hauptschule|9|wirtschaft-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wiaw_klp_3215_2020_07_01.pdf",
    "hauptschule|9|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpif_klp_2023_06_01_2.pdf",
    "hauptschule|9|wp-wirtschaft-und-arbeitswelt":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/hs_wpwiaw_klp_32151_2022_06_24_0.pdf",
    "realschule|10|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|10|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|10|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|10|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|10|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|10|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|10|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|10|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|10|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|10|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|10|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|10|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|10|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|10|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|10|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|10|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|10|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|10|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|10|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|10|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|10|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|10|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|10|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|10|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|10|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|10|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|10|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|10|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|10|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|10|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|10|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|10|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|10|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|10|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpif_klp_2023_06_01.pdf",
    "realschule|10|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_kunst.pdf",
    "realschule|10|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_musik.pdf",
    "realschule|10|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|10|wp-sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpsw_klp_33111_2022_06_24.pdf",
    "realschule|10|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_technik.pdf",
    "realschule|10|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpwi_klp_33131_2022_06_24.pdf",
    "realschule|5|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|5|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|5|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|5|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|5|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|5|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|5|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|5|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|5|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|5|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|5|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|5|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|5|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|5|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|5|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|5|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|5|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|5|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|5|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|5|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|5|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|5|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|5|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|5|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|5|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|5|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|5|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|5|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|5|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|5|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|5|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|5|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|5|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|5|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|6|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|6|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|6|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|6|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|6|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|6|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|6|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|6|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|6|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|6|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|6|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|6|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|6|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|6|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|6|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|6|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|6|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|6|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|6|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|6|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|6|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|6|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|6|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|6|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|6|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|6|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|6|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|6|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|6|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|6|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|6|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|6|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|6|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|6|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|7|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|7|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|7|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|7|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|7|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|7|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|7|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|7|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|7|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|7|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|7|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|7|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|7|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|7|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|7|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|7|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|7|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|7|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|7|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|7|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|7|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|7|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|7|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|7|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|7|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|7|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|7|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|7|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|7|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|7|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|7|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|7|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|7|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|7|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpif_klp_2023_06_01.pdf",
    "realschule|7|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_kunst.pdf",
    "realschule|7|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_musik.pdf",
    "realschule|7|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|7|wp-sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpsw_klp_33111_2022_06_24.pdf",
    "realschule|7|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_technik.pdf",
    "realschule|7|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpwi_klp_33131_2022_06_24.pdf",
    "realschule|8|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|8|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|8|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|8|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|8|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|8|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|8|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|8|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|8|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|8|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|8|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|8|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|8|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|8|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|8|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|8|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|8|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|8|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|8|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|8|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|8|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|8|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|8|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|8|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|8|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|8|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|8|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|8|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|8|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|8|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|8|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|8|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|8|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|8|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpif_klp_2023_06_01.pdf",
    "realschule|8|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_kunst.pdf",
    "realschule|8|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_musik.pdf",
    "realschule|8|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|8|wp-sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpsw_klp_33111_2022_06_24.pdf",
    "realschule|8|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_technik.pdf",
    "realschule|8|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpwi_klp_33131_2022_06_24.pdf",
    "realschule|9|alevitische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ar_klp_5024_2012_02_03.pdf",
    "realschule|9|biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_bi.pdf",
    "realschule|9|chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ch.pdf",
    "realschule|9|chinesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_c_klp_2021_07_13.pdf",
    "realschule|9|deutsch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_d_klp_2022_06_17_0.pdf",
    "realschule|9|englisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_e_klp_2022_06_13.pdf",
    "realschule|9|erdkunde":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ek_klp_3301_2020_07_01.pdf",
    "realschule|9|evangelische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_ev_religionslehre.pdf",
    "realschule|9|franzoesisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_f_klp_2021_07_13.pdf",
    "realschule|9|geschichte":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_ge_klp_3316_2020_07_01.pdf",
    "realschule|9|informatik-realschule":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/si_kl5u6_if_klp_2021_07_01.pdf",
    "realschule|9|islamische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/ir_klp_5026_2014_09_02.pdf",
    "realschule|9|italienisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_i_klp_2021_07_13.pdf",
    "realschule|9|japanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_j_klp_2021_07_13.pdf",
    "realschule|9|juedische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/jr_klp_5025_2014_06_24_0.pdf",
    "realschule|9|katholische-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/kernlehrplan_kath.religionslehre.pdf",
    "realschule|9|kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_kunst.pdf",
    "realschule|9|mathematik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf",
    "realschule|9|musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_musik.pdf",
    "realschule|9|niederlaendisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_n_klp_2021_07_13.pdf",
    "realschule|9|orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/or_klp_5022_2011_04_06.pdf",
    "realschule|9|physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_physik.pdf",
    "realschule|9|politik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_pl_klp_3323_2020_07_01.pdf",
    "realschule|9|praktische-philosophie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_si_pp_2024_10_02.pdf",
    "realschule|9|russisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_r_klp_2021_07_13.pdf",
    "realschule|9|spanisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_s_klp_2021_07_13.pdf",
    "realschule|9|sport":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_sport_rs.pdf",
    "realschule|9|syrisch-orthodoxe-religion":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/sor_klp_5023_2011_04_06.pdf",
    "realschule|9|textilgestaltung":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_textilgestaltung.pdf",
    "realschule|9|tuerkisch":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_t_klp_2021_07_13.pdf",
    "realschule|9|wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wi_klp_3324_2020_07_01.pdf",
    "realschule|9|wp-biologie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_biologie.pdf",
    "realschule|9|wp-chemie":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_chemie.pdf",
    "realschule|9|wp-informatik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpif_klp_2023_06_01.pdf",
    "realschule|9|wp-kunst":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_kunst.pdf",
    "realschule|9|wp-musik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_musik.pdf",
    "realschule|9|wp-physik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_physik.pdf",
    "realschule|9|wp-sozialwissenschaften":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpsw_klp_33111_2022_06_24.pdf",
    "realschule|9|wp-technik":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/klp_rs_wp_technik.pdf",
    "realschule|9|wp-wirtschaft":
      "https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_wpwi_klp_33131_2022_06_24.pdf",
  },

  catalogPaths: [
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "alevitische-religion",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "10", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "10", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "10", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "10", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "juedische-religion" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "10", subject: "latein" },
    { schoolType: "gesamtschule", grade: "10", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "10", subject: "musik" },
    { schoolType: "gesamtschule", grade: "10", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "10", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "technik" },
    { schoolType: "gesamtschule", grade: "10", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "10", subject: "wp-arbeitslehre" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "wp-darstellen-und-gestalten",
    },
    { schoolType: "gesamtschule", grade: "10", subject: "wp-informatik" },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "wp-naturwissenschaften",
    },
    {
      schoolType: "gesamtschule",
      grade: "10",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "gesamtschule", grade: "5", subject: "alevitische-religion" },
    { schoolType: "gesamtschule", grade: "5", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "5", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "5", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "5", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "5",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "5", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "5", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "5", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "5", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "5", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "5", subject: "juedische-religion" },
    { schoolType: "gesamtschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "gesamtschule", grade: "5", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "5", subject: "latein" },
    { schoolType: "gesamtschule", grade: "5", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "5", subject: "musik" },
    { schoolType: "gesamtschule", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "5", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "5", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "5",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "5", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "5", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "5",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "5", subject: "technik" },
    { schoolType: "gesamtschule", grade: "5", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "alevitische-religion" },
    { schoolType: "gesamtschule", grade: "6", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "6", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "6", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "6",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "6", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "6", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "6", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "6", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "juedische-religion" },
    { schoolType: "gesamtschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "gesamtschule", grade: "6", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "6", subject: "latein" },
    { schoolType: "gesamtschule", grade: "6", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "6", subject: "musik" },
    { schoolType: "gesamtschule", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "6", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "6",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "6", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "6", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "6",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "6", subject: "technik" },
    { schoolType: "gesamtschule", grade: "6", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "alevitische-religion" },
    { schoolType: "gesamtschule", grade: "7", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "7", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "7", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "7", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "7", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "7", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "7", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "juedische-religion" },
    { schoolType: "gesamtschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "gesamtschule", grade: "7", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "7", subject: "latein" },
    { schoolType: "gesamtschule", grade: "7", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "7", subject: "musik" },
    { schoolType: "gesamtschule", grade: "7", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "7", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "7", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "7", subject: "technik" },
    { schoolType: "gesamtschule", grade: "7", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "7", subject: "wp-arbeitslehre" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "wp-darstellen-und-gestalten",
    },
    { schoolType: "gesamtschule", grade: "7", subject: "wp-informatik" },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "wp-naturwissenschaften",
    },
    {
      schoolType: "gesamtschule",
      grade: "7",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "alevitische-religion" },
    { schoolType: "gesamtschule", grade: "8", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "8", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "8", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "8", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "8", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "juedische-religion" },
    { schoolType: "gesamtschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "gesamtschule", grade: "8", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "8", subject: "latein" },
    { schoolType: "gesamtschule", grade: "8", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "8", subject: "musik" },
    { schoolType: "gesamtschule", grade: "8", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "8", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "technik" },
    { schoolType: "gesamtschule", grade: "8", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "8", subject: "wp-arbeitslehre" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "wp-darstellen-und-gestalten",
    },
    { schoolType: "gesamtschule", grade: "8", subject: "wp-informatik" },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "wp-naturwissenschaften",
    },
    {
      schoolType: "gesamtschule",
      grade: "8",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "alevitische-religion" },
    { schoolType: "gesamtschule", grade: "9", subject: "chinesisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "deutsch" },
    { schoolType: "gesamtschule", grade: "9", subject: "englisch" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "evangelische-religion",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "franzoesisch" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "hauswirtschaft" },
    { schoolType: "gesamtschule", grade: "9", subject: "informatik" },
    { schoolType: "gesamtschule", grade: "9", subject: "islamische-religion" },
    { schoolType: "gesamtschule", grade: "9", subject: "italienisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "japanisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "juedische-religion" },
    { schoolType: "gesamtschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "gesamtschule", grade: "9", subject: "kunst" },
    { schoolType: "gesamtschule", grade: "9", subject: "latein" },
    { schoolType: "gesamtschule", grade: "9", subject: "mathematik" },
    { schoolType: "gesamtschule", grade: "9", subject: "musik" },
    { schoolType: "gesamtschule", grade: "9", subject: "naturwissenschaften" },
    { schoolType: "gesamtschule", grade: "9", subject: "niederlaendisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "orthodoxe-religion" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "praktische-philosophie",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "spanisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "sport" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "technik" },
    { schoolType: "gesamtschule", grade: "9", subject: "tuerkisch" },
    { schoolType: "gesamtschule", grade: "9", subject: "wp-arbeitslehre" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "wp-darstellen-und-gestalten",
    },
    { schoolType: "gesamtschule", grade: "9", subject: "wp-informatik" },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "wp-naturwissenschaften",
    },
    {
      schoolType: "gesamtschule",
      grade: "9",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "grundschule", grade: "1", subject: "alevitische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "orthodoxe-religion" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "praktische-philosophie",
    },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "2", subject: "alevitische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "orthodoxe-religion" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "praktische-philosophie",
    },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "3", subject: "alevitische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "orthodoxe-religion" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "praktische-philosophie",
    },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "4", subject: "alevitische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "orthodoxe-religion" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "praktische-philosophie",
    },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "ernaehrungslehre",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "erziehungswissenschaft",
    },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "hebraeisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "italienisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "japanisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "juedische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "katholische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "kernlehrplaene-fuer-die",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "literatur" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "neugriechisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "niederlaendisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "orthodoxe-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "portugiesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "recht" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "sozialwissenschaften",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "tuerkisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "ernaehrungslehre",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "erziehungswissenschaft",
    },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "hebraeisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "italienisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "japanisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "juedische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "katholische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "kernlehrplaene-fuer-die",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "literatur" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "neugriechisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "niederlaendisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "orthodoxe-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "portugiesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "recht" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "sozialwissenschaften",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "tuerkisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "englisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "ernaehrungslehre",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "erziehungswissenschaft",
    },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "hebraeisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "italienisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "japanisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "juedische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "katholische-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "kernlehrplaene-fuer-die",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "literatur" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "neugriechisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "niederlaendisch",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "orthodoxe-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "portugiesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "recht" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "sozialwissenschaften",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "technik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "10", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "10", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "10", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "pp" },
    { schoolType: "gymnasium", grade: "10", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "10", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "10", subject: "wp-informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "wp-kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "wp-musik" },
    { schoolType: "gymnasium", grade: "10", subject: "wp-technik" },
    { schoolType: "gymnasium", grade: "10", subject: "wp-wirtschaft" },
    { schoolType: "gymnasium", grade: "5", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "chemie" },
    { schoolType: "gymnasium", grade: "5", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "5", subject: "informatik" },
    { schoolType: "gymnasium", grade: "5", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "5", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "5", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "5", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "physik" },
    { schoolType: "gymnasium", grade: "5", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "pp" },
    { schoolType: "gymnasium", grade: "5", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "5", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "5", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "6", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "chemie" },
    { schoolType: "gymnasium", grade: "6", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "6", subject: "informatik" },
    { schoolType: "gymnasium", grade: "6", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "6", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "6", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "6", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "pp" },
    { schoolType: "gymnasium", grade: "6", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "6", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "6", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "7", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "7", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "7", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "pp" },
    { schoolType: "gymnasium", grade: "7", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "7", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "7", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "7", subject: "wp-informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "wp-kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "wp-musik" },
    { schoolType: "gymnasium", grade: "7", subject: "wp-technik" },
    { schoolType: "gymnasium", grade: "7", subject: "wp-wirtschaft" },
    { schoolType: "gymnasium", grade: "8", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "8", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "8", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "pp" },
    { schoolType: "gymnasium", grade: "8", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "8", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "8", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "8", subject: "wp-informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "wp-kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "wp-musik" },
    { schoolType: "gymnasium", grade: "8", subject: "wp-technik" },
    { schoolType: "gymnasium", grade: "8", subject: "wp-wirtschaft" },
    { schoolType: "gymnasium", grade: "9", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "9", subject: "japanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "neugriechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "niederlaendisch" },
    { schoolType: "gymnasium", grade: "9", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "portugiesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "pp" },
    { schoolType: "gymnasium", grade: "9", subject: "praktische-philosophie" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "9", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "9", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "9", subject: "wp-informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "wp-kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "wp-musik" },
    { schoolType: "gymnasium", grade: "9", subject: "wp-technik" },
    { schoolType: "gymnasium", grade: "9", subject: "wp-wirtschaft" },
    { schoolType: "hauptschule", grade: "10", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "10", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "10", subject: "englisch" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "hauptschule", grade: "10", subject: "gesellschaftslehre" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "gesellschaftslehre-gl",
    },
    { schoolType: "hauptschule", grade: "10", subject: "informatik" },
    { schoolType: "hauptschule", grade: "10", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "10", subject: "kunst" },
    { schoolType: "hauptschule", grade: "10", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "10", subject: "musik" },
    { schoolType: "hauptschule", grade: "10", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "10", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "10", subject: "russisch" },
    { schoolType: "hauptschule", grade: "10", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "10", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "10", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "10", subject: "wp-informatik" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "5", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "5", subject: "englisch" },
    { schoolType: "hauptschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "gesellschaftslehre" },
    { schoolType: "hauptschule", grade: "5", subject: "gesellschaftslehre-gl" },
    { schoolType: "hauptschule", grade: "5", subject: "informatik" },
    { schoolType: "hauptschule", grade: "5", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "kunst" },
    { schoolType: "hauptschule", grade: "5", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "5", subject: "musik" },
    { schoolType: "hauptschule", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "5", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "5",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "5", subject: "russisch" },
    { schoolType: "hauptschule", grade: "5", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "5",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "5", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "5", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "5",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "6", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "6", subject: "englisch" },
    { schoolType: "hauptschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "gesellschaftslehre" },
    { schoolType: "hauptschule", grade: "6", subject: "gesellschaftslehre-gl" },
    { schoolType: "hauptschule", grade: "6", subject: "informatik" },
    { schoolType: "hauptschule", grade: "6", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "kunst" },
    { schoolType: "hauptschule", grade: "6", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "6", subject: "musik" },
    { schoolType: "hauptschule", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "6", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "6",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "6", subject: "russisch" },
    { schoolType: "hauptschule", grade: "6", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "6",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "6", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "6", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "6",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "7", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "7", subject: "englisch" },
    { schoolType: "hauptschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "gesellschaftslehre" },
    { schoolType: "hauptschule", grade: "7", subject: "gesellschaftslehre-gl" },
    { schoolType: "hauptschule", grade: "7", subject: "informatik" },
    { schoolType: "hauptschule", grade: "7", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "kunst" },
    { schoolType: "hauptschule", grade: "7", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "7", subject: "musik" },
    { schoolType: "hauptschule", grade: "7", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "7", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "7",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "7", subject: "russisch" },
    { schoolType: "hauptschule", grade: "7", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "7",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "7", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "7", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "7",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "7", subject: "wp-informatik" },
    {
      schoolType: "hauptschule",
      grade: "7",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "8", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "8", subject: "englisch" },
    { schoolType: "hauptschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "gesellschaftslehre" },
    { schoolType: "hauptschule", grade: "8", subject: "gesellschaftslehre-gl" },
    { schoolType: "hauptschule", grade: "8", subject: "informatik" },
    { schoolType: "hauptschule", grade: "8", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "kunst" },
    { schoolType: "hauptschule", grade: "8", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "8", subject: "musik" },
    { schoolType: "hauptschule", grade: "8", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "8", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "8",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "8", subject: "russisch" },
    { schoolType: "hauptschule", grade: "8", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "8",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "8", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "8", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "8",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "8", subject: "wp-informatik" },
    {
      schoolType: "hauptschule",
      grade: "8",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "9", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "9", subject: "englisch" },
    { schoolType: "hauptschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "gesellschaftslehre" },
    { schoolType: "hauptschule", grade: "9", subject: "gesellschaftslehre-gl" },
    { schoolType: "hauptschule", grade: "9", subject: "informatik" },
    { schoolType: "hauptschule", grade: "9", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "kunst" },
    { schoolType: "hauptschule", grade: "9", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "9", subject: "musik" },
    { schoolType: "hauptschule", grade: "9", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "9", subject: "orthodoxe-religion" },
    {
      schoolType: "hauptschule",
      grade: "9",
      subject: "praktische-philosophie",
    },
    { schoolType: "hauptschule", grade: "9", subject: "russisch" },
    { schoolType: "hauptschule", grade: "9", subject: "sport" },
    {
      schoolType: "hauptschule",
      grade: "9",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "hauptschule", grade: "9", subject: "textilgestaltung" },
    { schoolType: "hauptschule", grade: "9", subject: "tuerkisch" },
    {
      schoolType: "hauptschule",
      grade: "9",
      subject: "wirtschaft-arbeitswelt",
    },
    { schoolType: "hauptschule", grade: "9", subject: "wp-informatik" },
    {
      schoolType: "hauptschule",
      grade: "9",
      subject: "wp-wirtschaft-und-arbeitswelt",
    },
    { schoolType: "realschule", grade: "10", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "10", subject: "biologie" },
    { schoolType: "realschule", grade: "10", subject: "chemie" },
    { schoolType: "realschule", grade: "10", subject: "chinesisch" },
    { schoolType: "realschule", grade: "10", subject: "deutsch" },
    { schoolType: "realschule", grade: "10", subject: "englisch" },
    { schoolType: "realschule", grade: "10", subject: "erdkunde" },
    { schoolType: "realschule", grade: "10", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "10", subject: "geschichte" },
    { schoolType: "realschule", grade: "10", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "10", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "10", subject: "italienisch" },
    { schoolType: "realschule", grade: "10", subject: "japanisch" },
    { schoolType: "realschule", grade: "10", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "10", subject: "kunst" },
    { schoolType: "realschule", grade: "10", subject: "mathematik" },
    { schoolType: "realschule", grade: "10", subject: "musik" },
    { schoolType: "realschule", grade: "10", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "10", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "10", subject: "physik" },
    { schoolType: "realschule", grade: "10", subject: "politik" },
    {
      schoolType: "realschule",
      grade: "10",
      subject: "praktische-philosophie",
    },
    { schoolType: "realschule", grade: "10", subject: "russisch" },
    { schoolType: "realschule", grade: "10", subject: "spanisch" },
    { schoolType: "realschule", grade: "10", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "10",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "10", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "10", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "10", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "10", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "10", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "10", subject: "wp-informatik" },
    { schoolType: "realschule", grade: "10", subject: "wp-kunst" },
    { schoolType: "realschule", grade: "10", subject: "wp-musik" },
    { schoolType: "realschule", grade: "10", subject: "wp-physik" },
    {
      schoolType: "realschule",
      grade: "10",
      subject: "wp-sozialwissenschaften",
    },
    { schoolType: "realschule", grade: "10", subject: "wp-technik" },
    { schoolType: "realschule", grade: "10", subject: "wp-wirtschaft" },
    { schoolType: "realschule", grade: "5", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "5", subject: "biologie" },
    { schoolType: "realschule", grade: "5", subject: "chemie" },
    { schoolType: "realschule", grade: "5", subject: "chinesisch" },
    { schoolType: "realschule", grade: "5", subject: "deutsch" },
    { schoolType: "realschule", grade: "5", subject: "englisch" },
    { schoolType: "realschule", grade: "5", subject: "erdkunde" },
    { schoolType: "realschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "5", subject: "geschichte" },
    { schoolType: "realschule", grade: "5", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "5", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "5", subject: "italienisch" },
    { schoolType: "realschule", grade: "5", subject: "japanisch" },
    { schoolType: "realschule", grade: "5", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "5", subject: "kunst" },
    { schoolType: "realschule", grade: "5", subject: "mathematik" },
    { schoolType: "realschule", grade: "5", subject: "musik" },
    { schoolType: "realschule", grade: "5", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "5", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "5", subject: "physik" },
    { schoolType: "realschule", grade: "5", subject: "politik" },
    { schoolType: "realschule", grade: "5", subject: "praktische-philosophie" },
    { schoolType: "realschule", grade: "5", subject: "russisch" },
    { schoolType: "realschule", grade: "5", subject: "spanisch" },
    { schoolType: "realschule", grade: "5", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "5",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "5", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "5", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "5", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "5", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "5", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "5", subject: "wp-physik" },
    { schoolType: "realschule", grade: "6", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "6", subject: "biologie" },
    { schoolType: "realschule", grade: "6", subject: "chemie" },
    { schoolType: "realschule", grade: "6", subject: "chinesisch" },
    { schoolType: "realschule", grade: "6", subject: "deutsch" },
    { schoolType: "realschule", grade: "6", subject: "englisch" },
    { schoolType: "realschule", grade: "6", subject: "erdkunde" },
    { schoolType: "realschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "6", subject: "geschichte" },
    { schoolType: "realschule", grade: "6", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "6", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "6", subject: "italienisch" },
    { schoolType: "realschule", grade: "6", subject: "japanisch" },
    { schoolType: "realschule", grade: "6", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "6", subject: "kunst" },
    { schoolType: "realschule", grade: "6", subject: "mathematik" },
    { schoolType: "realschule", grade: "6", subject: "musik" },
    { schoolType: "realschule", grade: "6", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "6", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "6", subject: "physik" },
    { schoolType: "realschule", grade: "6", subject: "politik" },
    { schoolType: "realschule", grade: "6", subject: "praktische-philosophie" },
    { schoolType: "realschule", grade: "6", subject: "russisch" },
    { schoolType: "realschule", grade: "6", subject: "spanisch" },
    { schoolType: "realschule", grade: "6", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "6",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "6", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "6", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "6", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "6", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "6", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "6", subject: "wp-physik" },
    { schoolType: "realschule", grade: "7", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "7", subject: "biologie" },
    { schoolType: "realschule", grade: "7", subject: "chemie" },
    { schoolType: "realschule", grade: "7", subject: "chinesisch" },
    { schoolType: "realschule", grade: "7", subject: "deutsch" },
    { schoolType: "realschule", grade: "7", subject: "englisch" },
    { schoolType: "realschule", grade: "7", subject: "erdkunde" },
    { schoolType: "realschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "7", subject: "geschichte" },
    { schoolType: "realschule", grade: "7", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "7", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "7", subject: "italienisch" },
    { schoolType: "realschule", grade: "7", subject: "japanisch" },
    { schoolType: "realschule", grade: "7", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "7", subject: "kunst" },
    { schoolType: "realschule", grade: "7", subject: "mathematik" },
    { schoolType: "realschule", grade: "7", subject: "musik" },
    { schoolType: "realschule", grade: "7", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "7", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "7", subject: "physik" },
    { schoolType: "realschule", grade: "7", subject: "politik" },
    { schoolType: "realschule", grade: "7", subject: "praktische-philosophie" },
    { schoolType: "realschule", grade: "7", subject: "russisch" },
    { schoolType: "realschule", grade: "7", subject: "spanisch" },
    { schoolType: "realschule", grade: "7", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "7",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "7", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "7", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "7", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "7", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "7", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "7", subject: "wp-informatik" },
    { schoolType: "realschule", grade: "7", subject: "wp-kunst" },
    { schoolType: "realschule", grade: "7", subject: "wp-musik" },
    { schoolType: "realschule", grade: "7", subject: "wp-physik" },
    {
      schoolType: "realschule",
      grade: "7",
      subject: "wp-sozialwissenschaften",
    },
    { schoolType: "realschule", grade: "7", subject: "wp-technik" },
    { schoolType: "realschule", grade: "7", subject: "wp-wirtschaft" },
    { schoolType: "realschule", grade: "8", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "8", subject: "biologie" },
    { schoolType: "realschule", grade: "8", subject: "chemie" },
    { schoolType: "realschule", grade: "8", subject: "chinesisch" },
    { schoolType: "realschule", grade: "8", subject: "deutsch" },
    { schoolType: "realschule", grade: "8", subject: "englisch" },
    { schoolType: "realschule", grade: "8", subject: "erdkunde" },
    { schoolType: "realschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "8", subject: "geschichte" },
    { schoolType: "realschule", grade: "8", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "8", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "8", subject: "italienisch" },
    { schoolType: "realschule", grade: "8", subject: "japanisch" },
    { schoolType: "realschule", grade: "8", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "8", subject: "kunst" },
    { schoolType: "realschule", grade: "8", subject: "mathematik" },
    { schoolType: "realschule", grade: "8", subject: "musik" },
    { schoolType: "realschule", grade: "8", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "8", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "8", subject: "physik" },
    { schoolType: "realschule", grade: "8", subject: "politik" },
    { schoolType: "realschule", grade: "8", subject: "praktische-philosophie" },
    { schoolType: "realschule", grade: "8", subject: "russisch" },
    { schoolType: "realschule", grade: "8", subject: "spanisch" },
    { schoolType: "realschule", grade: "8", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "8",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "8", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "8", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "8", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "8", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "8", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "8", subject: "wp-informatik" },
    { schoolType: "realschule", grade: "8", subject: "wp-kunst" },
    { schoolType: "realschule", grade: "8", subject: "wp-musik" },
    { schoolType: "realschule", grade: "8", subject: "wp-physik" },
    {
      schoolType: "realschule",
      grade: "8",
      subject: "wp-sozialwissenschaften",
    },
    { schoolType: "realschule", grade: "8", subject: "wp-technik" },
    { schoolType: "realschule", grade: "8", subject: "wp-wirtschaft" },
    { schoolType: "realschule", grade: "9", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "9", subject: "biologie" },
    { schoolType: "realschule", grade: "9", subject: "chemie" },
    { schoolType: "realschule", grade: "9", subject: "chinesisch" },
    { schoolType: "realschule", grade: "9", subject: "deutsch" },
    { schoolType: "realschule", grade: "9", subject: "englisch" },
    { schoolType: "realschule", grade: "9", subject: "erdkunde" },
    { schoolType: "realschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "9", subject: "geschichte" },
    { schoolType: "realschule", grade: "9", subject: "informatik-realschule" },
    { schoolType: "realschule", grade: "9", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "9", subject: "italienisch" },
    { schoolType: "realschule", grade: "9", subject: "japanisch" },
    { schoolType: "realschule", grade: "9", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "9", subject: "kunst" },
    { schoolType: "realschule", grade: "9", subject: "mathematik" },
    { schoolType: "realschule", grade: "9", subject: "musik" },
    { schoolType: "realschule", grade: "9", subject: "niederlaendisch" },
    { schoolType: "realschule", grade: "9", subject: "orthodoxe-religion" },
    { schoolType: "realschule", grade: "9", subject: "physik" },
    { schoolType: "realschule", grade: "9", subject: "politik" },
    { schoolType: "realschule", grade: "9", subject: "praktische-philosophie" },
    { schoolType: "realschule", grade: "9", subject: "russisch" },
    { schoolType: "realschule", grade: "9", subject: "spanisch" },
    { schoolType: "realschule", grade: "9", subject: "sport" },
    {
      schoolType: "realschule",
      grade: "9",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "realschule", grade: "9", subject: "textilgestaltung" },
    { schoolType: "realschule", grade: "9", subject: "tuerkisch" },
    { schoolType: "realschule", grade: "9", subject: "wirtschaft" },
    { schoolType: "realschule", grade: "9", subject: "wp-biologie" },
    { schoolType: "realschule", grade: "9", subject: "wp-chemie" },
    { schoolType: "realschule", grade: "9", subject: "wp-informatik" },
    { schoolType: "realschule", grade: "9", subject: "wp-kunst" },
    { schoolType: "realschule", grade: "9", subject: "wp-musik" },
    { schoolType: "realschule", grade: "9", subject: "wp-physik" },
    {
      schoolType: "realschule",
      grade: "9",
      subject: "wp-sozialwissenschaften",
    },
    { schoolType: "realschule", grade: "9", subject: "wp-technik" },
    { schoolType: "realschule", grade: "9", subject: "wp-wirtschaft" },
  ],
};
