import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface NiedersachsenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Niedersachsen Kerncurricula catalog (CuVo / NIBIS).
 *
 * Captured 2026-07-20 from https://cuvo.nibis.de/cuvo.php
 * Content URLs are official download endpoints:
 * `https://cuvo.nibis.de/index.php?p=download&upload=<id>`
 *
 * School types: Grundschule, Hauptschule, Realschule, Oberschule, Gymnasium
 * Sek I, Integrierte Gesamtschule, Gymnasiale Oberstufe.
 * Förderschule and multi-subject bag rows are out of scope.
 */
export interface KerncurriculumNiedersachsenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: NiedersachsenCatalogPath[];
}

export const KERNCURRICULUM_NIEDERSACHSEN_MANIFEST: KerncurriculumNiedersachsenManifest =
  {
    schoolYear: "2025/2026",
    capturedOn: "2026-07-20",
    sourceRevision: "CuVo NIBIS Kerncurricula (allgemeinbildend)",

    schoolTypes: [
      {
        id: "grundschule",
        label: "Grundschule",
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
        id: "oberschule",
        label: "Oberschule",
      },
      {
        id: "gymnasium",
        label: "Gymnasium (Sek I)",
      },
      {
        id: "integrierte-gesamtschule",
        label: "Integrierte Gesamtschule",
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
      oberschule: ["5", "6", "7", "8", "9", "10"],
      gymnasium: ["5", "6", "7", "8", "9", "10"],
      "integrierte-gesamtschule": ["5", "6", "7", "8", "9", "10"],
      "gymnasiale-oberstufe": ["11", "12", "13"],
    },

    subjects: {
      realschule: [
        {
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "gestaltendes-werken",
          label: "Gestaltendes Werken",
        },
        {
          id: "hauswirtschaft",
          label: "Hauswirtschaft",
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
          id: "niederlaendisch",
          label: "Niederländisch",
        },
        {
          id: "politik",
          label: "Politik",
        },
        {
          id: "spanisch",
          label: "Spanisch",
        },
        {
          id: "technik",
          label: "Technik",
        },
        {
          id: "textiles-gestalten",
          label: "Textiles Gestalten",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
        {
          id: "wirtschaft",
          label: "Wirtschaft",
        },
      ],
      oberschule: [
        {
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "gestaltendes-werken",
          label: "Gestaltendes Werken",
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
          label: "Islamische Religion",
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
          id: "niederlaendisch",
          label: "Niederländisch",
        },
        {
          id: "politik",
          label: "Politik",
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
          id: "textiles-gestalten",
          label: "Textiles Gestalten",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
        {
          id: "wirtschaft",
          label: "Wirtschaft",
        },
      ],
      "integrierte-gesamtschule": [
        {
          id: "awt",
          label: "Arbeit-Wirtschaft-Technik",
        },
        {
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "gesellschaftslehre",
          label: "Gesellschaftslehre",
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
          id: "naturwissenschaften",
          label: "Naturwissenschaften",
        },
        {
          id: "niederlaendisch",
          label: "Niederländisch",
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
          id: "theater",
          label: "Theater / Darstellendes Spiel",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
      ],
      gymnasium: [
        {
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "islamische-religion",
          label: "Islamische Religion",
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
          id: "niederlaendisch",
          label: "Niederländisch",
        },
        {
          id: "politik-wirtschaft",
          label: "Politik-Wirtschaft",
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
          id: "theater",
          label: "Theater / Darstellendes Spiel",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
      ],
      hauptschule: [
        {
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "gestaltendes-werken",
          label: "Gestaltendes Werken",
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
          label: "Islamische Religion",
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
          id: "politik",
          label: "Politik",
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
          id: "textiles-gestalten",
          label: "Textiles Gestalten",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
        {
          id: "wirtschaft",
          label: "Wirtschaft",
        },
      ],
      grundschule: [
        {
          id: "christliche-religion",
          label: "Christliche Religion",
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
          id: "gestaltendes-werken",
          label: "Gestaltendes Werken",
        },
        {
          id: "herkunftssprachen",
          label: "Herkunftssprachlicher Unterricht",
        },
        {
          id: "islamische-religion",
          label: "Islamische Religion",
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
          id: "sport",
          label: "Sport",
        },
        {
          id: "textiles-gestalten",
          label: "Textiles Gestalten",
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
          id: "darstellendes-spiel",
          label: "Darstellendes Spiel",
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
          id: "islamische-religion",
          label: "Islamische Religion",
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
          id: "niederlaendisch",
          label: "Niederländisch",
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
          id: "spanisch",
          label: "Spanisch",
        },
        {
          id: "sport",
          label: "Sport",
        },
        {
          id: "werte-und-normen",
          label: "Werte und Normen",
        },
      ],
    },

    tracks: {},

    topics: {
      "grundschule|1|christliche-religion": [
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
      "grundschule|1|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|1|herkunftssprachen": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|islamische-religion": [
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
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
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
      "grundschule|1|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|2|christliche-religion": [
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
      "grundschule|2|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|2|herkunftssprachen": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|islamische-religion": [
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
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
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
      "grundschule|2|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|3|christliche-religion": [
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
      "grundschule|3|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|3|herkunftssprachen": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|islamische-religion": [
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
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
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
      "grundschule|3|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|4|christliche-religion": [
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
      "grundschule|4|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|4|herkunftssprachen": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|islamische-religion": [
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
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
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
      "grundschule|4|textiles-gestalten": [
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
      "gymnasiale-oberstufe|11|darstellendes-spiel": [
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
      "gymnasiale-oberstufe|11|erdkunde": [
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
      "gymnasiale-oberstufe|11|katholische-religion": [
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
      "gymnasiale-oberstufe|11|niederlaendisch": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|11|physik": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|11|russisch": [
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
      "gymnasiale-oberstufe|11|werte-und-normen": [
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
      "gymnasiale-oberstufe|12|darstellendes-spiel": [
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
      "gymnasiale-oberstufe|12|erdkunde": [
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
      "gymnasiale-oberstufe|12|katholische-religion": [
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
      "gymnasiale-oberstufe|12|niederlaendisch": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|12|physik": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|12|russisch": [
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
      "gymnasiale-oberstufe|12|werte-und-normen": [
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
      "gymnasiale-oberstufe|13|darstellendes-spiel": [
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
      "gymnasiale-oberstufe|13|erdkunde": [
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
      "gymnasiale-oberstufe|13|katholische-religion": [
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
      "gymnasiale-oberstufe|13|niederlaendisch": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|13|physik": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasiale-oberstufe|13|russisch": [
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
      "gymnasiale-oberstufe|13|werte-und-normen": [
        { id: "einfuehrungsphase", label: "Einf\u00fchrungsphase" },
        { id: "qualifikationsphase", label: "Qualifikationsphase" },
        { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
      ],
      "gymnasium|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|10|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|10|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|politik-wirtschaft": [
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
      "gymnasium|10|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|10|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|5|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|5|politik-wirtschaft": [
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
      "gymnasium|5|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|5|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|6|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|6|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|politik-wirtschaft": [
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
      "gymnasium|6|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|6|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|7|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|7|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|politik-wirtschaft": [
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
      "gymnasium|7|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|7|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|8|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|8|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|politik-wirtschaft": [
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
      "gymnasium|8|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|8|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "gymnasium|9|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|9|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|politik-wirtschaft": [
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
      "gymnasium|9|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|9|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|10|christliche-religion": [
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
      "hauptschule|10|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|10|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|10|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|spanisch": [
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
      "hauptschule|10|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|10|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|5|christliche-religion": [
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
      "hauptschule|5|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|5|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|spanisch": [
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
      "hauptschule|5|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|5|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|6|christliche-religion": [
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
      "hauptschule|6|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|6|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|6|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|spanisch": [
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
      "hauptschule|6|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|6|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|7|christliche-religion": [
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
      "hauptschule|7|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|7|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|7|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|spanisch": [
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
      "hauptschule|7|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|7|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|8|christliche-religion": [
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
      "hauptschule|8|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|8|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|8|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|spanisch": [
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
      "hauptschule|8|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|8|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|9|christliche-religion": [
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
      "hauptschule|9|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "hauptschule|9|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "hauptschule|9|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|spanisch": [
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
      "hauptschule|9|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "hauptschule|9|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|10|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|10|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|10|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|10|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|5|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|5|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|5|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|5|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|6|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|6|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|6|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|6|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|7|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|7|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|7|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|7|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|8|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|8|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|8|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|8|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|awt": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-gesamtschule|9|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|gesellschaftslehre": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|katholische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "integrierte-gesamtschule|9|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|naturwissenschaften": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-gesamtschule|9|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-gesamtschule|9|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|10|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|10|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|10|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|islamische-religion": [
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
      "oberschule|10|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|10|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|10|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|10|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|spanisch": [
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
      "oberschule|10|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|10|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|5|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "oberschule|5|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|5|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|islamische-religion": [
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
      "oberschule|5|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|5|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|5|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|5|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|spanisch": [
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
      "oberschule|5|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|5|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|6|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "oberschule|6|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|6|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|6|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|islamische-religion": [
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
      "oberschule|6|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|6|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|6|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|6|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|spanisch": [
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
      "oberschule|6|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|6|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|7|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuh\u00f6ren" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "oberschule|7|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|7|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|7|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|islamische-religion": [
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
      "oberschule|7|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|7|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|7|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|7|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|spanisch": [
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
      "oberschule|7|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|7|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|8|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|8|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|8|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|islamische-religion": [
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
      "oberschule|8|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|8|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|8|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|8|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|spanisch": [
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
      "oberschule|8|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|8|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|9|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|9|erdkunde": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|evangelische-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|9|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|hauswirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|islamische-religion": [
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
      "oberschule|9|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|9|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "oberschule|9|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|niederlaendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "oberschule|9|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|spanisch": [
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
      "oberschule|9|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "oberschule|9|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|10|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|10|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|10|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|10|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|10|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|5|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|5|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|5|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|5|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|5|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|6|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|6|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|6|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|6|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|6|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|7|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|7|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|7|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|7|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|7|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|8|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|8|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|8|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|8|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|8|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|9|christliche-religion": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      "realschule|9|gestaltendes-werken": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|hauswirtschaft": [
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
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Gr\u00f6\u00dfen und Messen" },
        { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
        { id: "daten-zufall", label: "Daten und Zufall" },
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
      "realschule|9|politik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "realschule|9|technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|textiles-gestalten": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|werte-und-normen": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "realschule|9|wirtschaft": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
    },

    contentUrls: {
      "grundschule|1|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=797",
      "grundschule|1|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=738",
      "grundschule|1|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=98",
      "grundschule|1|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=252",
      "grundschule|1|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=441",
      "grundschule|1|herkunftssprachen":
        "https://cuvo.nibis.de/index.php?p=download&upload=106",
      "grundschule|1|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=246",
      "grundschule|1|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=253",
      "grundschule|1|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=439",
      "grundschule|1|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=737",
      "grundschule|1|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=438",
      "grundschule|1|sachunterricht":
        "https://cuvo.nibis.de/index.php?p=download&upload=105",
      "grundschule|1|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=254",
      "grundschule|1|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=442",
      "grundschule|2|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=797",
      "grundschule|2|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=738",
      "grundschule|2|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=98",
      "grundschule|2|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=252",
      "grundschule|2|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=441",
      "grundschule|2|herkunftssprachen":
        "https://cuvo.nibis.de/index.php?p=download&upload=106",
      "grundschule|2|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=246",
      "grundschule|2|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=253",
      "grundschule|2|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=439",
      "grundschule|2|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=737",
      "grundschule|2|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=438",
      "grundschule|2|sachunterricht":
        "https://cuvo.nibis.de/index.php?p=download&upload=105",
      "grundschule|2|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=254",
      "grundschule|2|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=442",
      "grundschule|3|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=797",
      "grundschule|3|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=738",
      "grundschule|3|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=98",
      "grundschule|3|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=252",
      "grundschule|3|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=441",
      "grundschule|3|herkunftssprachen":
        "https://cuvo.nibis.de/index.php?p=download&upload=106",
      "grundschule|3|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=246",
      "grundschule|3|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=253",
      "grundschule|3|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=439",
      "grundschule|3|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=737",
      "grundschule|3|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=438",
      "grundschule|3|sachunterricht":
        "https://cuvo.nibis.de/index.php?p=download&upload=105",
      "grundschule|3|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=254",
      "grundschule|3|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=442",
      "grundschule|4|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=797",
      "grundschule|4|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=738",
      "grundschule|4|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=98",
      "grundschule|4|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=252",
      "grundschule|4|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=441",
      "grundschule|4|herkunftssprachen":
        "https://cuvo.nibis.de/index.php?p=download&upload=106",
      "grundschule|4|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=246",
      "grundschule|4|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=253",
      "grundschule|4|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=439",
      "grundschule|4|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=737",
      "grundschule|4|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=438",
      "grundschule|4|sachunterricht":
        "https://cuvo.nibis.de/index.php?p=download&upload=105",
      "grundschule|4|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=254",
      "grundschule|4|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=442",
      "gymnasiale-oberstufe|11|biologie":
        "https://cuvo.nibis.de/index.php?p=download&upload=359",
      "gymnasiale-oberstufe|11|chemie":
        "https://cuvo.nibis.de/index.php?p=download&upload=362",
      "gymnasiale-oberstufe|11|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasiale-oberstufe|11|darstellendes-spiel":
        "https://cuvo.nibis.de/index.php?p=download&upload=194",
      "gymnasiale-oberstufe|11|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=94",
      "gymnasiale-oberstufe|11|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=77",
      "gymnasiale-oberstufe|11|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=124",
      "gymnasiale-oberstufe|11|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=175",
      "gymnasiale-oberstufe|11|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=447",
      "gymnasiale-oberstufe|11|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=22",
      "gymnasiale-oberstufe|11|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=117",
      "gymnasiale-oberstufe|11|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=173",
      "gymnasiale-oberstufe|11|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=357",
      "gymnasiale-oberstufe|11|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=57",
      "gymnasiale-oberstufe|11|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=103",
      "gymnasiale-oberstufe|11|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=131",
      "gymnasiale-oberstufe|11|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=208",
      "gymnasiale-oberstufe|11|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=104",
      "gymnasiale-oberstufe|11|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=197",
      "gymnasiale-oberstufe|11|physik":
        "https://cuvo.nibis.de/index.php?p=download&upload=363",
      "gymnasiale-oberstufe|11|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=250",
      "gymnasiale-oberstufe|11|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=796",
      "gymnasiale-oberstufe|11|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=222",
      "gymnasiale-oberstufe|11|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=435",
      "gymnasiale-oberstufe|12|biologie":
        "https://cuvo.nibis.de/index.php?p=download&upload=359",
      "gymnasiale-oberstufe|12|chemie":
        "https://cuvo.nibis.de/index.php?p=download&upload=362",
      "gymnasiale-oberstufe|12|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasiale-oberstufe|12|darstellendes-spiel":
        "https://cuvo.nibis.de/index.php?p=download&upload=194",
      "gymnasiale-oberstufe|12|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=94",
      "gymnasiale-oberstufe|12|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=77",
      "gymnasiale-oberstufe|12|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=124",
      "gymnasiale-oberstufe|12|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=175",
      "gymnasiale-oberstufe|12|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=447",
      "gymnasiale-oberstufe|12|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=22",
      "gymnasiale-oberstufe|12|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=117",
      "gymnasiale-oberstufe|12|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=173",
      "gymnasiale-oberstufe|12|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=357",
      "gymnasiale-oberstufe|12|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=57",
      "gymnasiale-oberstufe|12|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=103",
      "gymnasiale-oberstufe|12|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=131",
      "gymnasiale-oberstufe|12|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=208",
      "gymnasiale-oberstufe|12|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=104",
      "gymnasiale-oberstufe|12|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=197",
      "gymnasiale-oberstufe|12|physik":
        "https://cuvo.nibis.de/index.php?p=download&upload=363",
      "gymnasiale-oberstufe|12|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=250",
      "gymnasiale-oberstufe|12|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=796",
      "gymnasiale-oberstufe|12|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=222",
      "gymnasiale-oberstufe|12|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=435",
      "gymnasiale-oberstufe|13|biologie":
        "https://cuvo.nibis.de/index.php?p=download&upload=359",
      "gymnasiale-oberstufe|13|chemie":
        "https://cuvo.nibis.de/index.php?p=download&upload=362",
      "gymnasiale-oberstufe|13|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasiale-oberstufe|13|darstellendes-spiel":
        "https://cuvo.nibis.de/index.php?p=download&upload=194",
      "gymnasiale-oberstufe|13|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=94",
      "gymnasiale-oberstufe|13|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=77",
      "gymnasiale-oberstufe|13|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=124",
      "gymnasiale-oberstufe|13|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=175",
      "gymnasiale-oberstufe|13|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=447",
      "gymnasiale-oberstufe|13|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=22",
      "gymnasiale-oberstufe|13|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=117",
      "gymnasiale-oberstufe|13|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=173",
      "gymnasiale-oberstufe|13|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=357",
      "gymnasiale-oberstufe|13|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=57",
      "gymnasiale-oberstufe|13|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=103",
      "gymnasiale-oberstufe|13|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=131",
      "gymnasiale-oberstufe|13|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=208",
      "gymnasiale-oberstufe|13|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=104",
      "gymnasiale-oberstufe|13|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=197",
      "gymnasiale-oberstufe|13|physik":
        "https://cuvo.nibis.de/index.php?p=download&upload=363",
      "gymnasiale-oberstufe|13|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=250",
      "gymnasiale-oberstufe|13|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=796",
      "gymnasiale-oberstufe|13|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=222",
      "gymnasiale-oberstufe|13|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=435",
      "gymnasium|10|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|10|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|10|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|10|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|10|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|10|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|10|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "gymnasium|10|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|10|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|10|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|10|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|10|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|10|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|10|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|10|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|10|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|10|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=198",
      "gymnasium|10|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|10|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|10|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|10|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|10|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|10|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "gymnasium|5|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|5|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|5|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|5|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|5|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|5|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|5|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|5|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|5|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|5|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|5|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|5|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|5|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|5|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|5|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|5|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|5|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|5|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|5|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|5|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|5|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "gymnasium|6|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|6|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|6|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|6|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|6|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|6|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|6|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "gymnasium|6|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|6|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|6|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|6|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|6|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|6|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|6|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|6|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|6|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|6|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=198",
      "gymnasium|6|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|6|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|6|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|6|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|6|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|6|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "gymnasium|7|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|7|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|7|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|7|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|7|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|7|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|7|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "gymnasium|7|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|7|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|7|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|7|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|7|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|7|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|7|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|7|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|7|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|7|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=198",
      "gymnasium|7|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|7|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|7|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|7|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|7|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|7|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "gymnasium|8|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|8|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|8|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|8|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|8|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|8|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|8|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "gymnasium|8|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|8|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|8|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|8|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|8|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|8|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|8|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|8|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|8|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|8|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=198",
      "gymnasium|8|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|8|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|8|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|8|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|8|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|8|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "gymnasium|9|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "gymnasium|9|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "gymnasium|9|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=186",
      "gymnasium|9|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=139",
      "gymnasium|9|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=61",
      "gymnasium|9|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=159",
      "gymnasium|9|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "gymnasium|9|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=62",
      "gymnasium|9|griechisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=195",
      "gymnasium|9|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "gymnasium|9|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "gymnasium|9|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=59",
      "gymnasium|9|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=138",
      "gymnasium|9|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=196",
      "gymnasium|9|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=63",
      "gymnasium|9|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=200",
      "gymnasium|9|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=198",
      "gymnasium|9|politik-wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=65",
      "gymnasium|9|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=19",
      "gymnasium|9|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "gymnasium|9|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "gymnasium|9|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "gymnasium|9|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=129",
      "hauptschule|10|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|10|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|10|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|10|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|10|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|10|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|10|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "hauptschule|10|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|10|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|10|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|10|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|10|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|10|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|10|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|10|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|10|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|10|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|10|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|10|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|10|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|10|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|10|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|10|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "hauptschule|5|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|5|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|5|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|5|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|5|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|5|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|5|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|5|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|5|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|5|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|5|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|5|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|5|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|5|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|5|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|5|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|5|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|5|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|5|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|5|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|5|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|5|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "hauptschule|6|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|6|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|6|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|6|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|6|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|6|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|6|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "hauptschule|6|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|6|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|6|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|6|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|6|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|6|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|6|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|6|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|6|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|6|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|6|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|6|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|6|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|6|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|6|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|6|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "hauptschule|7|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|7|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|7|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|7|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|7|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|7|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|7|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "hauptschule|7|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|7|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|7|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|7|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|7|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|7|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|7|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|7|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|7|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|7|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|7|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|7|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|7|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|7|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|7|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|7|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "hauptschule|8|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|8|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|8|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|8|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|8|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|8|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|8|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "hauptschule|8|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|8|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|8|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|8|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|8|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|8|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|8|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|8|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|8|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|8|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|8|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|8|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|8|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|8|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|8|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|8|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "hauptschule|9|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "hauptschule|9|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "hauptschule|9|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=347",
      "hauptschule|9|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=15",
      "hauptschule|9|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=83",
      "hauptschule|9|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=238",
      "hauptschule|9|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "hauptschule|9|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=191",
      "hauptschule|9|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=38",
      "hauptschule|9|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=155",
      "hauptschule|9|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "hauptschule|9|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "hauptschule|9|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=237",
      "hauptschule|9|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=39",
      "hauptschule|9|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=344",
      "hauptschule|9|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=40",
      "hauptschule|9|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=14",
      "hauptschule|9|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "hauptschule|9|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "hauptschule|9|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=153",
      "hauptschule|9|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=37",
      "hauptschule|9|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=223",
      "hauptschule|9|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=119",
      "integrierte-gesamtschule|10|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|10|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|10|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|10|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|10|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|10|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|10|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "integrierte-gesamtschule|10|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|10|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|10|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|10|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|10|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|10|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|10|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|10|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|10|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|10|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|10|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|10|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "integrierte-gesamtschule|5|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|5|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|5|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|5|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|5|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|5|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|5|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|5|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|5|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|5|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|5|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|5|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|5|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|5|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|5|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|5|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|5|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|5|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "integrierte-gesamtschule|6|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|6|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|6|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|6|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|6|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|6|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|6|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "integrierte-gesamtschule|6|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|6|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|6|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|6|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|6|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|6|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|6|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|6|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|6|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|6|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|6|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|6|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "integrierte-gesamtschule|7|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|7|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|7|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|7|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|7|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|7|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|7|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "integrierte-gesamtschule|7|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|7|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|7|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|7|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|7|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|7|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|7|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|7|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|7|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|7|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|7|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|7|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "integrierte-gesamtschule|8|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|8|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|8|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|8|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|8|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|8|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|8|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "integrierte-gesamtschule|8|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|8|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|8|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|8|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|8|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|8|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|8|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|8|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|8|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|8|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|8|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|8|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "integrierte-gesamtschule|9|awt":
        "https://cuvo.nibis.de/index.php?p=download&upload=434",
      "integrierte-gesamtschule|9|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "integrierte-gesamtschule|9|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "integrierte-gesamtschule|9|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=202",
      "integrierte-gesamtschule|9|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=66",
      "integrierte-gesamtschule|9|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=132",
      "integrierte-gesamtschule|9|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "integrierte-gesamtschule|9|gesellschaftslehre":
        "https://cuvo.nibis.de/index.php?p=download&upload=245",
      "integrierte-gesamtschule|9|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=133",
      "integrierte-gesamtschule|9|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=118",
      "integrierte-gesamtschule|9|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=134",
      "integrierte-gesamtschule|9|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=235",
      "integrierte-gesamtschule|9|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=127",
      "integrierte-gesamtschule|9|naturwissenschaften":
        "https://cuvo.nibis.de/index.php?p=download&upload=234",
      "integrierte-gesamtschule|9|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=177",
      "integrierte-gesamtschule|9|russisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=17",
      "integrierte-gesamtschule|9|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "integrierte-gesamtschule|9|theater":
        "https://cuvo.nibis.de/index.php?p=download&upload=448",
      "integrierte-gesamtschule|9|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=130",
      "oberschule|10|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|10|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|10|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|10|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|10|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|10|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "oberschule|10|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|10|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|10|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|10|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|10|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|10|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|10|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|10|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|10|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|10|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|10|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|10|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|10|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|10|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|10|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|10|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|10|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|10|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "oberschule|5|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|5|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|5|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=251",
      "oberschule|5|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|5|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|5|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|5|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|5|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|5|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|5|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|5|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|5|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|5|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|5|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|5|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|5|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|5|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|5|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|5|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|5|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|5|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|5|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|5|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|5|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "oberschule|6|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|6|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|6|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=251",
      "oberschule|6|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|6|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|6|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|6|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "oberschule|6|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|6|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|6|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|6|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|6|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|6|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|6|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|6|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|6|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|6|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|6|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|6|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|6|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|6|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|6|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|6|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|6|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|6|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "oberschule|7|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|7|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|7|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=251",
      "oberschule|7|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|7|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|7|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|7|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "oberschule|7|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|7|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|7|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|7|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|7|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|7|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|7|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|7|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|7|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|7|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|7|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|7|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|7|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|7|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|7|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|7|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|7|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|7|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "oberschule|8|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|8|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|8|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|8|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|8|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|8|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "oberschule|8|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|8|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|8|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|8|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|8|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|8|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|8|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|8|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|8|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|8|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|8|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|8|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|8|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|8|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|8|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|8|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|8|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|8|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "oberschule|9|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "oberschule|9|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "oberschule|9|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=32",
      "oberschule|9|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=33",
      "oberschule|9|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=239",
      "oberschule|9|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "oberschule|9|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=35",
      "oberschule|9|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=137",
      "oberschule|9|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=24",
      "oberschule|9|informatik":
        "https://cuvo.nibis.de/index.php?p=download&upload=185",
      "oberschule|9|islamische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=165",
      "oberschule|9|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=242",
      "oberschule|9|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=26",
      "oberschule|9|latein":
        "https://cuvo.nibis.de/index.php?p=download&upload=43",
      "oberschule|9|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=345",
      "oberschule|9|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=27",
      "oberschule|9|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=113",
      "oberschule|9|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=193",
      "oberschule|9|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "oberschule|9|sport":
        "https://cuvo.nibis.de/index.php?p=download&upload=179",
      "oberschule|9|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=25",
      "oberschule|9|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=136",
      "oberschule|9|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=78",
      "oberschule|9|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=79",
      "realschule|10|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|10|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|10|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|10|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|10|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|10|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|10|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "realschule|10|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|10|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|10|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|10|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|10|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|10|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|10|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|10|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|10|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|10|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|10|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|10|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|10|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|10|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
      "realschule|5|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|5|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|5|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|5|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|5|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|5|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|5|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|5|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|5|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|5|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|5|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|5|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|5|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|5|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|5|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|5|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|5|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|5|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|5|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|5|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
      "realschule|6|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|6|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|6|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|6|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|6|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|6|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|6|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "realschule|6|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|6|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|6|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|6|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|6|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|6|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|6|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|6|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|6|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|6|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|6|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|6|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|6|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|6|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
      "realschule|7|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|7|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|7|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|7|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|7|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|7|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|7|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "realschule|7|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|7|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|7|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|7|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|7|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|7|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|7|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|7|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|7|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|7|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|7|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|7|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|7|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|7|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
      "realschule|8|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|8|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|8|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|8|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|8|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|8|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|8|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "realschule|8|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|8|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|8|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|8|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|8|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|8|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|8|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|8|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|8|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|8|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|8|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|8|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|8|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|8|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
      "realschule|9|chinesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=449",
      "realschule|9|christliche-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=798",
      "realschule|9|deutsch":
        "https://cuvo.nibis.de/index.php?p=download&upload=346",
      "realschule|9|englisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=69",
      "realschule|9|erdkunde":
        "https://cuvo.nibis.de/index.php?p=download&upload=114",
      "realschule|9|evangelische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=240",
      "realschule|9|franzoesisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=756",
      "realschule|9|geschichte":
        "https://cuvo.nibis.de/index.php?p=download&upload=150",
      "realschule|9|gestaltendes-werken":
        "https://cuvo.nibis.de/index.php?p=download&upload=41",
      "realschule|9|hauswirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=156",
      "realschule|9|katholische-religion":
        "https://cuvo.nibis.de/index.php?p=download&upload=241",
      "realschule|9|kunst":
        "https://cuvo.nibis.de/index.php?p=download&upload=42",
      "realschule|9|mathematik":
        "https://cuvo.nibis.de/index.php?p=download&upload=255",
      "realschule|9|musik":
        "https://cuvo.nibis.de/index.php?p=download&upload=110",
      "realschule|9|niederlaendisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=184",
      "realschule|9|politik":
        "https://cuvo.nibis.de/index.php?p=download&upload=70",
      "realschule|9|spanisch":
        "https://cuvo.nibis.de/index.php?p=download&upload=450",
      "realschule|9|technik":
        "https://cuvo.nibis.de/index.php?p=download&upload=154",
      "realschule|9|textiles-gestalten":
        "https://cuvo.nibis.de/index.php?p=download&upload=111",
      "realschule|9|werte-und-normen":
        "https://cuvo.nibis.de/index.php?p=download&upload=123",
      "realschule|9|wirtschaft":
        "https://cuvo.nibis.de/index.php?p=download&upload=122",
    },

    catalogPaths: [
      {
        schoolType: "grundschule",
        grade: "1",
        subject: "christliche-religion",
      },
      { schoolType: "grundschule", grade: "1", subject: "deutsch" },
      { schoolType: "grundschule", grade: "1", subject: "englisch" },
      {
        schoolType: "grundschule",
        grade: "1",
        subject: "evangelische-religion",
      },
      { schoolType: "grundschule", grade: "1", subject: "gestaltendes-werken" },
      { schoolType: "grundschule", grade: "1", subject: "herkunftssprachen" },
      { schoolType: "grundschule", grade: "1", subject: "islamische-religion" },
      {
        schoolType: "grundschule",
        grade: "1",
        subject: "katholische-religion",
      },
      { schoolType: "grundschule", grade: "1", subject: "kunst" },
      { schoolType: "grundschule", grade: "1", subject: "mathematik" },
      { schoolType: "grundschule", grade: "1", subject: "musik" },
      { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "1", subject: "sport" },
      { schoolType: "grundschule", grade: "1", subject: "textiles-gestalten" },
      {
        schoolType: "grundschule",
        grade: "2",
        subject: "christliche-religion",
      },
      { schoolType: "grundschule", grade: "2", subject: "deutsch" },
      { schoolType: "grundschule", grade: "2", subject: "englisch" },
      {
        schoolType: "grundschule",
        grade: "2",
        subject: "evangelische-religion",
      },
      { schoolType: "grundschule", grade: "2", subject: "gestaltendes-werken" },
      { schoolType: "grundschule", grade: "2", subject: "herkunftssprachen" },
      { schoolType: "grundschule", grade: "2", subject: "islamische-religion" },
      {
        schoolType: "grundschule",
        grade: "2",
        subject: "katholische-religion",
      },
      { schoolType: "grundschule", grade: "2", subject: "kunst" },
      { schoolType: "grundschule", grade: "2", subject: "mathematik" },
      { schoolType: "grundschule", grade: "2", subject: "musik" },
      { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "2", subject: "sport" },
      { schoolType: "grundschule", grade: "2", subject: "textiles-gestalten" },
      {
        schoolType: "grundschule",
        grade: "3",
        subject: "christliche-religion",
      },
      { schoolType: "grundschule", grade: "3", subject: "deutsch" },
      { schoolType: "grundschule", grade: "3", subject: "englisch" },
      {
        schoolType: "grundschule",
        grade: "3",
        subject: "evangelische-religion",
      },
      { schoolType: "grundschule", grade: "3", subject: "gestaltendes-werken" },
      { schoolType: "grundschule", grade: "3", subject: "herkunftssprachen" },
      { schoolType: "grundschule", grade: "3", subject: "islamische-religion" },
      {
        schoolType: "grundschule",
        grade: "3",
        subject: "katholische-religion",
      },
      { schoolType: "grundschule", grade: "3", subject: "kunst" },
      { schoolType: "grundschule", grade: "3", subject: "mathematik" },
      { schoolType: "grundschule", grade: "3", subject: "musik" },
      { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "3", subject: "sport" },
      { schoolType: "grundschule", grade: "3", subject: "textiles-gestalten" },
      {
        schoolType: "grundschule",
        grade: "4",
        subject: "christliche-religion",
      },
      { schoolType: "grundschule", grade: "4", subject: "deutsch" },
      { schoolType: "grundschule", grade: "4", subject: "englisch" },
      {
        schoolType: "grundschule",
        grade: "4",
        subject: "evangelische-religion",
      },
      { schoolType: "grundschule", grade: "4", subject: "gestaltendes-werken" },
      { schoolType: "grundschule", grade: "4", subject: "herkunftssprachen" },
      { schoolType: "grundschule", grade: "4", subject: "islamische-religion" },
      {
        schoolType: "grundschule",
        grade: "4",
        subject: "katholische-religion",
      },
      { schoolType: "grundschule", grade: "4", subject: "kunst" },
      { schoolType: "grundschule", grade: "4", subject: "mathematik" },
      { schoolType: "grundschule", grade: "4", subject: "musik" },
      { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "4", subject: "sport" },
      { schoolType: "grundschule", grade: "4", subject: "textiles-gestalten" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "chinesisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "darstellendes-spiel",
      },
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
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "geschichte",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "griechisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "informatik",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "islamische-religion",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "katholische-religion",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "kunst" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "mathematik",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "niederlaendisch",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "physik" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "11",
        subject: "werte-und-normen",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "chinesisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "darstellendes-spiel",
      },
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
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "geschichte",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "griechisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "informatik",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "islamische-religion",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "katholische-religion",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "kunst" },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "mathematik",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "niederlaendisch",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "physik" },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "12",
        subject: "werte-und-normen",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "chinesisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "darstellendes-spiel",
      },
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
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "geschichte",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "griechisch",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "informatik",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "islamische-religion",
      },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "katholische-religion",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "kunst" },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "mathematik",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "niederlaendisch",
      },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "physik" },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
      { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
      {
        schoolType: "gymnasiale-oberstufe",
        grade: "13",
        subject: "werte-und-normen",
      },
      { schoolType: "gymnasium", grade: "10", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "10", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "10", subject: "englisch" },
      { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
      {
        schoolType: "gymnasium",
        grade: "10",
        subject: "evangelische-religion",
      },
      { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "10", subject: "informatik" },
      { schoolType: "gymnasium", grade: "10", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "10", subject: "kunst" },
      { schoolType: "gymnasium", grade: "10", subject: "latein" },
      { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "10", subject: "musik" },
      { schoolType: "gymnasium", grade: "10", subject: "niederlaendisch" },
      { schoolType: "gymnasium", grade: "10", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "10", subject: "russisch" },
      { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "10", subject: "sport" },
      { schoolType: "gymnasium", grade: "10", subject: "theater" },
      { schoolType: "gymnasium", grade: "10", subject: "werte-und-normen" },
      { schoolType: "gymnasium", grade: "5", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "5", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "5", subject: "englisch" },
      { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
      { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
      { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "5", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "5", subject: "informatik" },
      { schoolType: "gymnasium", grade: "5", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "5", subject: "kunst" },
      { schoolType: "gymnasium", grade: "5", subject: "latein" },
      { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "5", subject: "musik" },
      { schoolType: "gymnasium", grade: "5", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "5", subject: "russisch" },
      { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "5", subject: "sport" },
      { schoolType: "gymnasium", grade: "5", subject: "theater" },
      { schoolType: "gymnasium", grade: "5", subject: "werte-und-normen" },
      { schoolType: "gymnasium", grade: "6", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "6", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "6", subject: "englisch" },
      { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
      { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
      { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "6", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "6", subject: "informatik" },
      { schoolType: "gymnasium", grade: "6", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "6", subject: "kunst" },
      { schoolType: "gymnasium", grade: "6", subject: "latein" },
      { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "6", subject: "musik" },
      { schoolType: "gymnasium", grade: "6", subject: "niederlaendisch" },
      { schoolType: "gymnasium", grade: "6", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "6", subject: "russisch" },
      { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "6", subject: "sport" },
      { schoolType: "gymnasium", grade: "6", subject: "theater" },
      { schoolType: "gymnasium", grade: "6", subject: "werte-und-normen" },
      { schoolType: "gymnasium", grade: "7", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "7", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "7", subject: "englisch" },
      { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
      { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
      { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "7", subject: "informatik" },
      { schoolType: "gymnasium", grade: "7", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "7", subject: "kunst" },
      { schoolType: "gymnasium", grade: "7", subject: "latein" },
      { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "7", subject: "musik" },
      { schoolType: "gymnasium", grade: "7", subject: "niederlaendisch" },
      { schoolType: "gymnasium", grade: "7", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "7", subject: "russisch" },
      { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "7", subject: "sport" },
      { schoolType: "gymnasium", grade: "7", subject: "theater" },
      { schoolType: "gymnasium", grade: "7", subject: "werte-und-normen" },
      { schoolType: "gymnasium", grade: "8", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "8", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "8", subject: "englisch" },
      { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
      { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
      { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "8", subject: "informatik" },
      { schoolType: "gymnasium", grade: "8", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "8", subject: "kunst" },
      { schoolType: "gymnasium", grade: "8", subject: "latein" },
      { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "8", subject: "musik" },
      { schoolType: "gymnasium", grade: "8", subject: "niederlaendisch" },
      { schoolType: "gymnasium", grade: "8", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "8", subject: "russisch" },
      { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "8", subject: "sport" },
      { schoolType: "gymnasium", grade: "8", subject: "theater" },
      { schoolType: "gymnasium", grade: "8", subject: "werte-und-normen" },
      { schoolType: "gymnasium", grade: "9", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "9", subject: "christliche-religion" },
      { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
      { schoolType: "gymnasium", grade: "9", subject: "englisch" },
      { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
      { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
      { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
      { schoolType: "gymnasium", grade: "9", subject: "informatik" },
      { schoolType: "gymnasium", grade: "9", subject: "islamische-religion" },
      { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
      { schoolType: "gymnasium", grade: "9", subject: "kunst" },
      { schoolType: "gymnasium", grade: "9", subject: "latein" },
      { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "9", subject: "musik" },
      { schoolType: "gymnasium", grade: "9", subject: "niederlaendisch" },
      { schoolType: "gymnasium", grade: "9", subject: "politik-wirtschaft" },
      { schoolType: "gymnasium", grade: "9", subject: "russisch" },
      { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "9", subject: "sport" },
      { schoolType: "gymnasium", grade: "9", subject: "theater" },
      { schoolType: "gymnasium", grade: "9", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "10", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "10",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "10", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "10", subject: "englisch" },
      { schoolType: "hauptschule", grade: "10", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "10",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "10", subject: "franzoesisch" },
      { schoolType: "hauptschule", grade: "10", subject: "geschichte" },
      {
        schoolType: "hauptschule",
        grade: "10",
        subject: "gestaltendes-werken",
      },
      { schoolType: "hauptschule", grade: "10", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "10", subject: "informatik" },
      {
        schoolType: "hauptschule",
        grade: "10",
        subject: "islamische-religion",
      },
      {
        schoolType: "hauptschule",
        grade: "10",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "10", subject: "kunst" },
      { schoolType: "hauptschule", grade: "10", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "10", subject: "musik" },
      { schoolType: "hauptschule", grade: "10", subject: "politik" },
      { schoolType: "hauptschule", grade: "10", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "10", subject: "sport" },
      { schoolType: "hauptschule", grade: "10", subject: "technik" },
      { schoolType: "hauptschule", grade: "10", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "10", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "10", subject: "wirtschaft" },
      { schoolType: "hauptschule", grade: "5", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "5",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "5", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "5", subject: "englisch" },
      { schoolType: "hauptschule", grade: "5", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "5",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "5", subject: "geschichte" },
      { schoolType: "hauptschule", grade: "5", subject: "gestaltendes-werken" },
      { schoolType: "hauptschule", grade: "5", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "5", subject: "informatik" },
      { schoolType: "hauptschule", grade: "5", subject: "islamische-religion" },
      {
        schoolType: "hauptschule",
        grade: "5",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "5", subject: "kunst" },
      { schoolType: "hauptschule", grade: "5", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "5", subject: "musik" },
      { schoolType: "hauptschule", grade: "5", subject: "politik" },
      { schoolType: "hauptschule", grade: "5", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "5", subject: "sport" },
      { schoolType: "hauptschule", grade: "5", subject: "technik" },
      { schoolType: "hauptschule", grade: "5", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "5", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "5", subject: "wirtschaft" },
      { schoolType: "hauptschule", grade: "6", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "6",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "6", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "6", subject: "englisch" },
      { schoolType: "hauptschule", grade: "6", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "6",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "6", subject: "franzoesisch" },
      { schoolType: "hauptschule", grade: "6", subject: "geschichte" },
      { schoolType: "hauptschule", grade: "6", subject: "gestaltendes-werken" },
      { schoolType: "hauptschule", grade: "6", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "6", subject: "informatik" },
      { schoolType: "hauptschule", grade: "6", subject: "islamische-religion" },
      {
        schoolType: "hauptschule",
        grade: "6",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "6", subject: "kunst" },
      { schoolType: "hauptschule", grade: "6", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "6", subject: "musik" },
      { schoolType: "hauptschule", grade: "6", subject: "politik" },
      { schoolType: "hauptschule", grade: "6", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "6", subject: "sport" },
      { schoolType: "hauptschule", grade: "6", subject: "technik" },
      { schoolType: "hauptschule", grade: "6", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "6", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "6", subject: "wirtschaft" },
      { schoolType: "hauptschule", grade: "7", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "7",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "7", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "7", subject: "englisch" },
      { schoolType: "hauptschule", grade: "7", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "7",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "7", subject: "franzoesisch" },
      { schoolType: "hauptschule", grade: "7", subject: "geschichte" },
      { schoolType: "hauptschule", grade: "7", subject: "gestaltendes-werken" },
      { schoolType: "hauptschule", grade: "7", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "7", subject: "informatik" },
      { schoolType: "hauptschule", grade: "7", subject: "islamische-religion" },
      {
        schoolType: "hauptschule",
        grade: "7",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "7", subject: "kunst" },
      { schoolType: "hauptschule", grade: "7", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "7", subject: "musik" },
      { schoolType: "hauptschule", grade: "7", subject: "politik" },
      { schoolType: "hauptschule", grade: "7", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "7", subject: "sport" },
      { schoolType: "hauptschule", grade: "7", subject: "technik" },
      { schoolType: "hauptschule", grade: "7", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "7", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "7", subject: "wirtschaft" },
      { schoolType: "hauptschule", grade: "8", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "8",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "8", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "8", subject: "englisch" },
      { schoolType: "hauptschule", grade: "8", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "8",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "8", subject: "franzoesisch" },
      { schoolType: "hauptschule", grade: "8", subject: "geschichte" },
      { schoolType: "hauptschule", grade: "8", subject: "gestaltendes-werken" },
      { schoolType: "hauptschule", grade: "8", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "8", subject: "informatik" },
      { schoolType: "hauptschule", grade: "8", subject: "islamische-religion" },
      {
        schoolType: "hauptschule",
        grade: "8",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "8", subject: "kunst" },
      { schoolType: "hauptschule", grade: "8", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "8", subject: "musik" },
      { schoolType: "hauptschule", grade: "8", subject: "politik" },
      { schoolType: "hauptschule", grade: "8", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "8", subject: "sport" },
      { schoolType: "hauptschule", grade: "8", subject: "technik" },
      { schoolType: "hauptschule", grade: "8", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "8", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "8", subject: "wirtschaft" },
      { schoolType: "hauptschule", grade: "9", subject: "chinesisch" },
      {
        schoolType: "hauptschule",
        grade: "9",
        subject: "christliche-religion",
      },
      { schoolType: "hauptschule", grade: "9", subject: "deutsch" },
      { schoolType: "hauptschule", grade: "9", subject: "englisch" },
      { schoolType: "hauptschule", grade: "9", subject: "erdkunde" },
      {
        schoolType: "hauptschule",
        grade: "9",
        subject: "evangelische-religion",
      },
      { schoolType: "hauptschule", grade: "9", subject: "franzoesisch" },
      { schoolType: "hauptschule", grade: "9", subject: "geschichte" },
      { schoolType: "hauptschule", grade: "9", subject: "gestaltendes-werken" },
      { schoolType: "hauptschule", grade: "9", subject: "hauswirtschaft" },
      { schoolType: "hauptschule", grade: "9", subject: "informatik" },
      { schoolType: "hauptschule", grade: "9", subject: "islamische-religion" },
      {
        schoolType: "hauptschule",
        grade: "9",
        subject: "katholische-religion",
      },
      { schoolType: "hauptschule", grade: "9", subject: "kunst" },
      { schoolType: "hauptschule", grade: "9", subject: "mathematik" },
      { schoolType: "hauptschule", grade: "9", subject: "musik" },
      { schoolType: "hauptschule", grade: "9", subject: "politik" },
      { schoolType: "hauptschule", grade: "9", subject: "spanisch" },
      { schoolType: "hauptschule", grade: "9", subject: "sport" },
      { schoolType: "hauptschule", grade: "9", subject: "technik" },
      { schoolType: "hauptschule", grade: "9", subject: "textiles-gestalten" },
      { schoolType: "hauptschule", grade: "9", subject: "werte-und-normen" },
      { schoolType: "hauptschule", grade: "9", subject: "wirtschaft" },
      { schoolType: "integrierte-gesamtschule", grade: "10", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "10", subject: "kunst" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "latein",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "10", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "10",
        subject: "werte-und-normen",
      },
      { schoolType: "integrierte-gesamtschule", grade: "5", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "5", subject: "kunst" },
      { schoolType: "integrierte-gesamtschule", grade: "5", subject: "latein" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "5", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "5",
        subject: "werte-und-normen",
      },
      { schoolType: "integrierte-gesamtschule", grade: "6", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "6", subject: "kunst" },
      { schoolType: "integrierte-gesamtschule", grade: "6", subject: "latein" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "6", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "6",
        subject: "werte-und-normen",
      },
      { schoolType: "integrierte-gesamtschule", grade: "7", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "7", subject: "kunst" },
      { schoolType: "integrierte-gesamtschule", grade: "7", subject: "latein" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "7", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "7",
        subject: "werte-und-normen",
      },
      { schoolType: "integrierte-gesamtschule", grade: "8", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "8", subject: "kunst" },
      { schoolType: "integrierte-gesamtschule", grade: "8", subject: "latein" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "8", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "8",
        subject: "werte-und-normen",
      },
      { schoolType: "integrierte-gesamtschule", grade: "9", subject: "awt" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "christliche-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "evangelische-religion",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "gesellschaftslehre",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "katholische-religion",
      },
      { schoolType: "integrierte-gesamtschule", grade: "9", subject: "kunst" },
      { schoolType: "integrierte-gesamtschule", grade: "9", subject: "latein" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "mathematik",
      },
      { schoolType: "integrierte-gesamtschule", grade: "9", subject: "musik" },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "naturwissenschaften",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "niederlaendisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "theater",
      },
      {
        schoolType: "integrierte-gesamtschule",
        grade: "9",
        subject: "werte-und-normen",
      },
      { schoolType: "oberschule", grade: "10", subject: "chinesisch" },
      {
        schoolType: "oberschule",
        grade: "10",
        subject: "christliche-religion",
      },
      { schoolType: "oberschule", grade: "10", subject: "englisch" },
      { schoolType: "oberschule", grade: "10", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "10",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "10", subject: "franzoesisch" },
      { schoolType: "oberschule", grade: "10", subject: "geschichte" },
      { schoolType: "oberschule", grade: "10", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "10", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "10", subject: "informatik" },
      { schoolType: "oberschule", grade: "10", subject: "islamische-religion" },
      {
        schoolType: "oberschule",
        grade: "10",
        subject: "katholische-religion",
      },
      { schoolType: "oberschule", grade: "10", subject: "kunst" },
      { schoolType: "oberschule", grade: "10", subject: "latein" },
      { schoolType: "oberschule", grade: "10", subject: "mathematik" },
      { schoolType: "oberschule", grade: "10", subject: "musik" },
      { schoolType: "oberschule", grade: "10", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "10", subject: "politik" },
      { schoolType: "oberschule", grade: "10", subject: "spanisch" },
      { schoolType: "oberschule", grade: "10", subject: "sport" },
      { schoolType: "oberschule", grade: "10", subject: "technik" },
      { schoolType: "oberschule", grade: "10", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "10", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "10", subject: "wirtschaft" },
      { schoolType: "oberschule", grade: "5", subject: "chinesisch" },
      { schoolType: "oberschule", grade: "5", subject: "christliche-religion" },
      { schoolType: "oberschule", grade: "5", subject: "deutsch" },
      { schoolType: "oberschule", grade: "5", subject: "englisch" },
      { schoolType: "oberschule", grade: "5", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "5",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "5", subject: "geschichte" },
      { schoolType: "oberschule", grade: "5", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "5", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "5", subject: "informatik" },
      { schoolType: "oberschule", grade: "5", subject: "islamische-religion" },
      { schoolType: "oberschule", grade: "5", subject: "katholische-religion" },
      { schoolType: "oberschule", grade: "5", subject: "kunst" },
      { schoolType: "oberschule", grade: "5", subject: "latein" },
      { schoolType: "oberschule", grade: "5", subject: "mathematik" },
      { schoolType: "oberschule", grade: "5", subject: "musik" },
      { schoolType: "oberschule", grade: "5", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "5", subject: "politik" },
      { schoolType: "oberschule", grade: "5", subject: "spanisch" },
      { schoolType: "oberschule", grade: "5", subject: "sport" },
      { schoolType: "oberschule", grade: "5", subject: "technik" },
      { schoolType: "oberschule", grade: "5", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "5", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "5", subject: "wirtschaft" },
      { schoolType: "oberschule", grade: "6", subject: "chinesisch" },
      { schoolType: "oberschule", grade: "6", subject: "christliche-religion" },
      { schoolType: "oberschule", grade: "6", subject: "deutsch" },
      { schoolType: "oberschule", grade: "6", subject: "englisch" },
      { schoolType: "oberschule", grade: "6", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "6",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "6", subject: "franzoesisch" },
      { schoolType: "oberschule", grade: "6", subject: "geschichte" },
      { schoolType: "oberschule", grade: "6", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "6", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "6", subject: "informatik" },
      { schoolType: "oberschule", grade: "6", subject: "islamische-religion" },
      { schoolType: "oberschule", grade: "6", subject: "katholische-religion" },
      { schoolType: "oberschule", grade: "6", subject: "kunst" },
      { schoolType: "oberschule", grade: "6", subject: "latein" },
      { schoolType: "oberschule", grade: "6", subject: "mathematik" },
      { schoolType: "oberschule", grade: "6", subject: "musik" },
      { schoolType: "oberschule", grade: "6", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "6", subject: "politik" },
      { schoolType: "oberschule", grade: "6", subject: "spanisch" },
      { schoolType: "oberschule", grade: "6", subject: "sport" },
      { schoolType: "oberschule", grade: "6", subject: "technik" },
      { schoolType: "oberschule", grade: "6", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "6", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "6", subject: "wirtschaft" },
      { schoolType: "oberschule", grade: "7", subject: "chinesisch" },
      { schoolType: "oberschule", grade: "7", subject: "christliche-religion" },
      { schoolType: "oberschule", grade: "7", subject: "deutsch" },
      { schoolType: "oberschule", grade: "7", subject: "englisch" },
      { schoolType: "oberschule", grade: "7", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "7",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "7", subject: "franzoesisch" },
      { schoolType: "oberschule", grade: "7", subject: "geschichte" },
      { schoolType: "oberschule", grade: "7", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "7", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "7", subject: "informatik" },
      { schoolType: "oberschule", grade: "7", subject: "islamische-religion" },
      { schoolType: "oberschule", grade: "7", subject: "katholische-religion" },
      { schoolType: "oberschule", grade: "7", subject: "kunst" },
      { schoolType: "oberschule", grade: "7", subject: "latein" },
      { schoolType: "oberschule", grade: "7", subject: "mathematik" },
      { schoolType: "oberschule", grade: "7", subject: "musik" },
      { schoolType: "oberschule", grade: "7", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "7", subject: "politik" },
      { schoolType: "oberschule", grade: "7", subject: "spanisch" },
      { schoolType: "oberschule", grade: "7", subject: "sport" },
      { schoolType: "oberschule", grade: "7", subject: "technik" },
      { schoolType: "oberschule", grade: "7", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "7", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "7", subject: "wirtschaft" },
      { schoolType: "oberschule", grade: "8", subject: "chinesisch" },
      { schoolType: "oberschule", grade: "8", subject: "christliche-religion" },
      { schoolType: "oberschule", grade: "8", subject: "englisch" },
      { schoolType: "oberschule", grade: "8", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "8",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "8", subject: "franzoesisch" },
      { schoolType: "oberschule", grade: "8", subject: "geschichte" },
      { schoolType: "oberschule", grade: "8", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "8", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "8", subject: "informatik" },
      { schoolType: "oberschule", grade: "8", subject: "islamische-religion" },
      { schoolType: "oberschule", grade: "8", subject: "katholische-religion" },
      { schoolType: "oberschule", grade: "8", subject: "kunst" },
      { schoolType: "oberschule", grade: "8", subject: "latein" },
      { schoolType: "oberschule", grade: "8", subject: "mathematik" },
      { schoolType: "oberschule", grade: "8", subject: "musik" },
      { schoolType: "oberschule", grade: "8", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "8", subject: "politik" },
      { schoolType: "oberschule", grade: "8", subject: "spanisch" },
      { schoolType: "oberschule", grade: "8", subject: "sport" },
      { schoolType: "oberschule", grade: "8", subject: "technik" },
      { schoolType: "oberschule", grade: "8", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "8", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "8", subject: "wirtschaft" },
      { schoolType: "oberschule", grade: "9", subject: "chinesisch" },
      { schoolType: "oberschule", grade: "9", subject: "christliche-religion" },
      { schoolType: "oberschule", grade: "9", subject: "englisch" },
      { schoolType: "oberschule", grade: "9", subject: "erdkunde" },
      {
        schoolType: "oberschule",
        grade: "9",
        subject: "evangelische-religion",
      },
      { schoolType: "oberschule", grade: "9", subject: "franzoesisch" },
      { schoolType: "oberschule", grade: "9", subject: "geschichte" },
      { schoolType: "oberschule", grade: "9", subject: "gestaltendes-werken" },
      { schoolType: "oberschule", grade: "9", subject: "hauswirtschaft" },
      { schoolType: "oberschule", grade: "9", subject: "informatik" },
      { schoolType: "oberschule", grade: "9", subject: "islamische-religion" },
      { schoolType: "oberschule", grade: "9", subject: "katholische-religion" },
      { schoolType: "oberschule", grade: "9", subject: "kunst" },
      { schoolType: "oberschule", grade: "9", subject: "latein" },
      { schoolType: "oberschule", grade: "9", subject: "mathematik" },
      { schoolType: "oberschule", grade: "9", subject: "musik" },
      { schoolType: "oberschule", grade: "9", subject: "niederlaendisch" },
      { schoolType: "oberschule", grade: "9", subject: "politik" },
      { schoolType: "oberschule", grade: "9", subject: "spanisch" },
      { schoolType: "oberschule", grade: "9", subject: "sport" },
      { schoolType: "oberschule", grade: "9", subject: "technik" },
      { schoolType: "oberschule", grade: "9", subject: "textiles-gestalten" },
      { schoolType: "oberschule", grade: "9", subject: "werte-und-normen" },
      { schoolType: "oberschule", grade: "9", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "10", subject: "chinesisch" },
      {
        schoolType: "realschule",
        grade: "10",
        subject: "christliche-religion",
      },
      { schoolType: "realschule", grade: "10", subject: "deutsch" },
      { schoolType: "realschule", grade: "10", subject: "englisch" },
      { schoolType: "realschule", grade: "10", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "10",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "10", subject: "franzoesisch" },
      { schoolType: "realschule", grade: "10", subject: "geschichte" },
      { schoolType: "realschule", grade: "10", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "10", subject: "hauswirtschaft" },
      {
        schoolType: "realschule",
        grade: "10",
        subject: "katholische-religion",
      },
      { schoolType: "realschule", grade: "10", subject: "kunst" },
      { schoolType: "realschule", grade: "10", subject: "mathematik" },
      { schoolType: "realschule", grade: "10", subject: "musik" },
      { schoolType: "realschule", grade: "10", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "10", subject: "politik" },
      { schoolType: "realschule", grade: "10", subject: "spanisch" },
      { schoolType: "realschule", grade: "10", subject: "technik" },
      { schoolType: "realschule", grade: "10", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "10", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "10", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "5", subject: "chinesisch" },
      { schoolType: "realschule", grade: "5", subject: "christliche-religion" },
      { schoolType: "realschule", grade: "5", subject: "deutsch" },
      { schoolType: "realschule", grade: "5", subject: "englisch" },
      { schoolType: "realschule", grade: "5", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "5",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "5", subject: "geschichte" },
      { schoolType: "realschule", grade: "5", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "5", subject: "hauswirtschaft" },
      { schoolType: "realschule", grade: "5", subject: "katholische-religion" },
      { schoolType: "realschule", grade: "5", subject: "kunst" },
      { schoolType: "realschule", grade: "5", subject: "mathematik" },
      { schoolType: "realschule", grade: "5", subject: "musik" },
      { schoolType: "realschule", grade: "5", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "5", subject: "politik" },
      { schoolType: "realschule", grade: "5", subject: "spanisch" },
      { schoolType: "realschule", grade: "5", subject: "technik" },
      { schoolType: "realschule", grade: "5", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "5", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "5", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "6", subject: "chinesisch" },
      { schoolType: "realschule", grade: "6", subject: "christliche-religion" },
      { schoolType: "realschule", grade: "6", subject: "deutsch" },
      { schoolType: "realschule", grade: "6", subject: "englisch" },
      { schoolType: "realschule", grade: "6", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "6",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "6", subject: "franzoesisch" },
      { schoolType: "realschule", grade: "6", subject: "geschichte" },
      { schoolType: "realschule", grade: "6", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "6", subject: "hauswirtschaft" },
      { schoolType: "realschule", grade: "6", subject: "katholische-religion" },
      { schoolType: "realschule", grade: "6", subject: "kunst" },
      { schoolType: "realschule", grade: "6", subject: "mathematik" },
      { schoolType: "realschule", grade: "6", subject: "musik" },
      { schoolType: "realschule", grade: "6", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "6", subject: "politik" },
      { schoolType: "realschule", grade: "6", subject: "spanisch" },
      { schoolType: "realschule", grade: "6", subject: "technik" },
      { schoolType: "realschule", grade: "6", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "6", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "6", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "7", subject: "chinesisch" },
      { schoolType: "realschule", grade: "7", subject: "christliche-religion" },
      { schoolType: "realschule", grade: "7", subject: "deutsch" },
      { schoolType: "realschule", grade: "7", subject: "englisch" },
      { schoolType: "realschule", grade: "7", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "7",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "7", subject: "franzoesisch" },
      { schoolType: "realschule", grade: "7", subject: "geschichte" },
      { schoolType: "realschule", grade: "7", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "7", subject: "hauswirtschaft" },
      { schoolType: "realschule", grade: "7", subject: "katholische-religion" },
      { schoolType: "realschule", grade: "7", subject: "kunst" },
      { schoolType: "realschule", grade: "7", subject: "mathematik" },
      { schoolType: "realschule", grade: "7", subject: "musik" },
      { schoolType: "realschule", grade: "7", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "7", subject: "politik" },
      { schoolType: "realschule", grade: "7", subject: "spanisch" },
      { schoolType: "realschule", grade: "7", subject: "technik" },
      { schoolType: "realschule", grade: "7", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "7", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "7", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "8", subject: "chinesisch" },
      { schoolType: "realschule", grade: "8", subject: "christliche-religion" },
      { schoolType: "realschule", grade: "8", subject: "deutsch" },
      { schoolType: "realschule", grade: "8", subject: "englisch" },
      { schoolType: "realschule", grade: "8", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "8",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "8", subject: "franzoesisch" },
      { schoolType: "realschule", grade: "8", subject: "geschichte" },
      { schoolType: "realschule", grade: "8", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "8", subject: "hauswirtschaft" },
      { schoolType: "realschule", grade: "8", subject: "katholische-religion" },
      { schoolType: "realschule", grade: "8", subject: "kunst" },
      { schoolType: "realschule", grade: "8", subject: "mathematik" },
      { schoolType: "realschule", grade: "8", subject: "musik" },
      { schoolType: "realschule", grade: "8", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "8", subject: "politik" },
      { schoolType: "realschule", grade: "8", subject: "spanisch" },
      { schoolType: "realschule", grade: "8", subject: "technik" },
      { schoolType: "realschule", grade: "8", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "8", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "8", subject: "wirtschaft" },
      { schoolType: "realschule", grade: "9", subject: "chinesisch" },
      { schoolType: "realschule", grade: "9", subject: "christliche-religion" },
      { schoolType: "realschule", grade: "9", subject: "deutsch" },
      { schoolType: "realschule", grade: "9", subject: "englisch" },
      { schoolType: "realschule", grade: "9", subject: "erdkunde" },
      {
        schoolType: "realschule",
        grade: "9",
        subject: "evangelische-religion",
      },
      { schoolType: "realschule", grade: "9", subject: "franzoesisch" },
      { schoolType: "realschule", grade: "9", subject: "geschichte" },
      { schoolType: "realschule", grade: "9", subject: "gestaltendes-werken" },
      { schoolType: "realschule", grade: "9", subject: "hauswirtschaft" },
      { schoolType: "realschule", grade: "9", subject: "katholische-religion" },
      { schoolType: "realschule", grade: "9", subject: "kunst" },
      { schoolType: "realschule", grade: "9", subject: "mathematik" },
      { schoolType: "realschule", grade: "9", subject: "musik" },
      { schoolType: "realschule", grade: "9", subject: "niederlaendisch" },
      { schoolType: "realschule", grade: "9", subject: "politik" },
      { schoolType: "realschule", grade: "9", subject: "spanisch" },
      { schoolType: "realschule", grade: "9", subject: "technik" },
      { schoolType: "realschule", grade: "9", subject: "textiles-gestalten" },
      { schoolType: "realschule", grade: "9", subject: "werte-und-normen" },
      { schoolType: "realschule", grade: "9", subject: "wirtschaft" },
    ],
  };
