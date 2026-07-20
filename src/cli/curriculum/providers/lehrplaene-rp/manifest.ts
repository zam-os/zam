import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface RpCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Rheinland-Pfalz Lehrpläne catalog (Bildungsserver RLP).
 *
 * Captured 2026-07-20 from https://bildung.rlp.de/lehrplaene/
 * Content URLs are official download endpoints (tx_rlpbase_download).
 *
 * School types: Grundschule, Hauptschule, Realschule, Realschule plus,
 * Gymnasium Sek I, Integrierte Gesamtschule, Gymnasiale Oberstufe (MSS),
 * Förderschule. Berufsbildende Schule (separate portal section) and
 * Handreichungen / obsolete versions out of scope.
 */
export interface LehrplaeneRpManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: RpCatalogPath[];
}

export const LEHRPLAENE_RP_MANIFEST: LehrplaeneRpManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Bildungsserver RLP Lehrpläne (allgemeinbildend)",

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
      id: "realschule-plus",
      label: "Realschule plus",
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
      label: "Gymnasiale Oberstufe (MSS)",
    },
    {
      id: "foerderschule",
      label: "Förderschule",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    hauptschule: ["5", "6", "7", "8", "9", "10"],
    realschule: ["5", "6", "7", "8", "9", "10"],
    "realschule-plus": ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "integrierte-gesamtschule": ["5", "6", "7", "8", "9", "10"],
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
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "informatik",
        label: "Informatik",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
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
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    hauptschule: [
      {
        id: "arbeitslehre",
        label: "Arbeitslehre",
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
        id: "ethik",
        label: "Ethik",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
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
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    realschule: [
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
        id: "ethik",
        label: "Ethik",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
      },
      {
        id: "sozialkunde",
        label: "Sozialkunde",
      },
      {
        id: "sozialpaedagogik",
        label: "Sozialpädagogik",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "sport-gesundheit",
        label: "Sport und Gesundheit",
      },
      {
        id: "wirtschaft-sozialkunde",
        label: "Wirtschaft und Sozialkunde",
      },
      {
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    "realschule-plus": [
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
        id: "ethik",
        label: "Ethik",
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
        id: "gesellschaftslehre",
        label: "Gesellschaftslehre",
      },
      {
        id: "hauswirtschaft-sozialwesen",
        label: "Hauswirtschaft und Sozialwesen",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
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
        id: "sport-gesundheit",
        label: "Sport und Gesundheit",
      },
      {
        id: "technik-naturwissenschaften",
        label: "Technik und Naturwissenschaften",
      },
      {
        id: "wirtschaft-verwaltung",
        label: "Wirtschaft und Verwaltung",
      },
      {
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    gymnasium: [
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
        id: "ethik",
        label: "Ethik",
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
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "kultur",
        label: "Kultur",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
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
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    "integrierte-gesamtschule": [
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
        id: "ethik",
        label: "Ethik",
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
        id: "gesellschaftslehre",
        label: "Gesellschaftslehre",
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
        id: "kommunikation-medien",
        label: "Kommunikation und Medien",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
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
        id: "sport-gesundheit",
        label: "Sport und Gesundheit",
      },
      {
        id: "oekologie",
        label: "Ökologie",
      },
      {
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
      },
    ],
    "gymnasiale-oberstufe": [
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
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "gemeinschaftskunde",
        label: "Gemeinschaftskunde",
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
        id: "evangelische-religion",
        label: "Religion (evangelisch)",
      },
      {
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "weitere-religion",
        label: "Religion (weitere Religionsgemeinschaften)",
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
    ],
    foerderschule: [
      {
        id: "arbeitslehre",
        label: "Arbeitslehre",
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
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "geschichte",
        label: "Geschichte",
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
        id: "katholische-religion",
        label: "Religion (katholisch)",
      },
      {
        id: "sachunterricht",
        label: "Sachunterricht",
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
        id: "textiles-gestalten",
        label: "Textiles Gestalten",
      },
      {
        id: "werken",
        label: "Werken",
      },
      {
        id: "oekonomische-bildung",
        label: "Ökonomische Bildung",
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
    "foerderschule|10|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|katholische-religion": [
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
    "foerderschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|10|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|10|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|1|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|1|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|1|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|katholische-religion": [
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
    "foerderschule|1|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|1|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|1|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|2|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|2|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|2|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|katholische-religion": [
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
    "foerderschule|2|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|2|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|2|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|3|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|3|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|3|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|katholische-religion": [
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
    "foerderschule|3|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|3|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|3|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|4|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|4|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|4|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|katholische-religion": [
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
    "foerderschule|4|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|4|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|4|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|5|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|katholische-religion": [
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
    "foerderschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|5|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|5|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|6|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|katholische-religion": [
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
    "foerderschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|6|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|6|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|7|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|katholische-religion": [
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
    "foerderschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|7|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|7|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|8|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|katholische-religion": [
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
    "foerderschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|8|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|8|werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "foerderschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "foerderschule|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|katholische-religion": [
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
    "foerderschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "foerderschule|9|sachunterricht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|textiles-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "foerderschule|9|werken": [
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
    "grundschule|1|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|1|oekonomische-bildung": [
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
    "grundschule|2|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|2|oekonomische-bildung": [
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
    "grundschule|3|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|3|oekonomische-bildung": [
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
    "grundschule|4|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|4|oekonomische-bildung": [
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
    "gymnasiale-oberstufe|11|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|11|ethik": [
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
    "gymnasiale-oberstufe|11|gemeinschaftskunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|11|russisch": [
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
    "gymnasiale-oberstufe|11|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|weitere-religion": [
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
    "gymnasiale-oberstufe|12|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|12|ethik": [
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
    "gymnasiale-oberstufe|12|gemeinschaftskunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|12|russisch": [
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
    "gymnasiale-oberstufe|12|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|12|weitere-religion": [
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
    "gymnasiale-oberstufe|13|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|13|ethik": [
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
    "gymnasiale-oberstufe|13|gemeinschaftskunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasiale-oberstufe|13|russisch": [
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
    "gymnasiale-oberstufe|13|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|13|weitere-religion": [
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
    "gymnasium|10|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|10|oekonomische-bildung": [
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
    "gymnasium|10|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|darstellendes-spiel": [
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
    "gymnasium|5|oekonomische-bildung": [
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
    "gymnasium|5|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|darstellendes-spiel": [
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
    "gymnasium|6|oekonomische-bildung": [
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
    "gymnasium|6|weitere-religion": [
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
    "gymnasium|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|7|oekonomische-bildung": [
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
    "gymnasium|7|weitere-religion": [
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
    "gymnasium|8|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|8|kultur": [
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
    "gymnasium|8|oekonomische-bildung": [
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
    "gymnasium|8|weitere-religion": [
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
    "gymnasium|9|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|9|kultur": [
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
    "gymnasium|9|oekonomische-bildung": [
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
    "gymnasium|9|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|10|ethik": [
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
    "hauptschule|10|katholische-religion": [
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
    "hauptschule|10|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|10|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|katholische-religion": [
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
    "hauptschule|5|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|6|ethik": [
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
    "hauptschule|6|katholische-religion": [
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
    "hauptschule|6|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|7|ethik": [
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
    "hauptschule|7|katholische-religion": [
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
    "hauptschule|7|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|8|ethik": [
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
    "hauptschule|8|katholische-religion": [
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
    "hauptschule|8|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "hauptschule|9|ethik": [
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
    "hauptschule|9|katholische-religion": [
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
    "hauptschule|9|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|10|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "integrierte-gesamtschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "integrierte-gesamtschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|10|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|5|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
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
    "integrierte-gesamtschule|5|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|5|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|6|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "integrierte-gesamtschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
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
    "integrierte-gesamtschule|6|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|6|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|7|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|7|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "integrierte-gesamtschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "integrierte-gesamtschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|7|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|8|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|8|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "integrierte-gesamtschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "integrierte-gesamtschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|8|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|9|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "integrierte-gesamtschule|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "integrierte-gesamtschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|italienisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|kommunikation-medien": [
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
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "integrierte-gesamtschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|oekologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "integrierte-gesamtschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "integrierte-gesamtschule|9|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|10|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|10|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|10|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|5|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|5|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|5|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|6|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|6|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|6|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|7|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|7|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|7|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|8|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|8|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|gesellschaftslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|8|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|9|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "realschule-plus|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|9|erdkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|evangelische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule-plus|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|hauswirtschaft-sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|katholische-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule-plus|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule-plus|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|technik-naturwissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule-plus|9|wirtschaft-verwaltung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|bildende-kunst": [
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
    "realschule|10|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|10|ethik": [
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
    "realschule|10|katholische-religion": [
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
    "realschule|10|oekonomische-bildung": [
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
    "realschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|sozialpaedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|wirtschaft-sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|5|ethik": [
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
    "realschule|5|katholische-religion": [
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
    "realschule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|5|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|bildende-kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|6|ethik": [
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
    "realschule|6|katholische-religion": [
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
    "realschule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|6|oekonomische-bildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|bildende-kunst": [
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
    "realschule|7|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|7|ethik": [
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
    "realschule|7|katholische-religion": [
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
    "realschule|7|oekonomische-bildung": [
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
    "realschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|bildende-kunst": [
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
    "realschule|8|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|8|ethik": [
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
    "realschule|8|katholische-religion": [
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
    "realschule|8|oekonomische-bildung": [
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
    "realschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|bildende-kunst": [
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
    "realschule|9|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
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
    "realschule|9|ethik": [
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
    "realschule|9|katholische-religion": [
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
    "realschule|9|oekonomische-bildung": [
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
    "realschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|sozialpaedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|sport-gesundheit": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|weitere-religion": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|wirtschaft-sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "foerderschule|10|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|10|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|10|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|10|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|1|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|1|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|1|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|1|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|1|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|1|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|1|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|1|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|1|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|1|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|1|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|1|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|1|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|1|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|1|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|1|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|1|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|1|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|1|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|2|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|2|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|2|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|2|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|2|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|2|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|2|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|2|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|2|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|2|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|2|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|2|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|2|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|2|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|2|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|2|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|2|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|2|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|2|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|3|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|3|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|3|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|3|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|3|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|3|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|3|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|3|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|3|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|3|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|3|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|3|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|3|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|3|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|3|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|3|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|3|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|3|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|3|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|4|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|4|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|4|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|4|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|4|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|4|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|4|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|4|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|4|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|4|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|4|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|4|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|4|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|4|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|4|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|4|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|4|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|4|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|4|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|5|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|5|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|5|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|5|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|5|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|5|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|5|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|6|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|6|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|6|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|6|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|6|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|6|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|6|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|7|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|7|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|7|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|7|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|8|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|8|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|8|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|8|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|9|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56455&type=432522&cHash=2f3ec809136b887e19e566c58682dffb",
    "foerderschule|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "foerderschule|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56461&type=432522&cHash=b597769735845b621eabaeecf3db3a9b",
    "foerderschule|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "foerderschule|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "foerderschule|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56464&type=432522&cHash=158890b41ba1c261ae9d6ae872f0bebb",
    "foerderschule|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56465&type=432522&cHash=991bc7d269f7beaf04634c1423824381",
    "foerderschule|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56468&type=432522&cHash=6cbd80fb9ca6121d1068c84f7a257f78",
    "foerderschule|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56469&type=432522&cHash=3e66e1f6239d7928ec083d0fc9ab01cc",
    "foerderschule|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56474&type=432522&cHash=a5e5c4527d09eee28b19d199e4723831",
    "foerderschule|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "foerderschule|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56476&type=432522&cHash=89101dc51ac5152e0957ee341b9e3ed5",
    "foerderschule|9|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56488&type=432522&cHash=d207247cfc1c425416f47c4a227758f8",
    "foerderschule|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56466&type=432522&cHash=79364ac3c1722fe04cb2edab4899a045",
    "foerderschule|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56491&type=432522&cHash=a9922da1f5d2708cf9ce973495bc8477",
    "foerderschule|9|textiles-gestalten":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56493&type=432522&cHash=07cb1441d752c93f65426ee40220aac0",
    "foerderschule|9|werken":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56460&type=432522&cHash=91fd4c7739831240b7ead2500e0d4109",
    "grundschule|1|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56489&type=432522&cHash=de04760394aee86ec12d5ef1e2039c15",
    "grundschule|1|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56478&type=432522&cHash=1d161f047fc964a2558a50984c861dd2",
    "grundschule|1|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|1|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56482&type=432522&cHash=156d20d0cffb069fe7d7d649de1f5181",
    "grundschule|1|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56499&type=432522&cHash=d09cf564347659c1cf441a867b53be08",
    "grundschule|1|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|1|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "grundschule|1|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56501&type=432522&cHash=e9668d203821519753514c86a3337d4e",
    "grundschule|1|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56473&type=432522&cHash=dd26b34a738b5cace42c005ba52247eb",
    "grundschule|1|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56492&type=432522&cHash=a47be251af5ecf44d1e875c2a2f05a9f",
    "grundschule|1|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "grundschule|1|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56503&type=432522&cHash=e586a5bd6d60b78b77361447ec0544d9",
    "grundschule|1|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56506&type=432522&cHash=53aee90f3a5edf1a30409cab8aabaa13",
    "grundschule|2|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56489&type=432522&cHash=de04760394aee86ec12d5ef1e2039c15",
    "grundschule|2|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56478&type=432522&cHash=1d161f047fc964a2558a50984c861dd2",
    "grundschule|2|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|2|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56482&type=432522&cHash=156d20d0cffb069fe7d7d649de1f5181",
    "grundschule|2|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56499&type=432522&cHash=d09cf564347659c1cf441a867b53be08",
    "grundschule|2|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|2|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "grundschule|2|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56501&type=432522&cHash=e9668d203821519753514c86a3337d4e",
    "grundschule|2|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56473&type=432522&cHash=dd26b34a738b5cace42c005ba52247eb",
    "grundschule|2|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56492&type=432522&cHash=a47be251af5ecf44d1e875c2a2f05a9f",
    "grundschule|2|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "grundschule|2|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56503&type=432522&cHash=e586a5bd6d60b78b77361447ec0544d9",
    "grundschule|2|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56506&type=432522&cHash=53aee90f3a5edf1a30409cab8aabaa13",
    "grundschule|3|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56489&type=432522&cHash=de04760394aee86ec12d5ef1e2039c15",
    "grundschule|3|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56478&type=432522&cHash=1d161f047fc964a2558a50984c861dd2",
    "grundschule|3|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|3|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56482&type=432522&cHash=156d20d0cffb069fe7d7d649de1f5181",
    "grundschule|3|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56499&type=432522&cHash=d09cf564347659c1cf441a867b53be08",
    "grundschule|3|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|3|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "grundschule|3|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56501&type=432522&cHash=e9668d203821519753514c86a3337d4e",
    "grundschule|3|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56473&type=432522&cHash=dd26b34a738b5cace42c005ba52247eb",
    "grundschule|3|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56492&type=432522&cHash=a47be251af5ecf44d1e875c2a2f05a9f",
    "grundschule|3|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "grundschule|3|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56503&type=432522&cHash=e586a5bd6d60b78b77361447ec0544d9",
    "grundschule|3|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56506&type=432522&cHash=53aee90f3a5edf1a30409cab8aabaa13",
    "grundschule|4|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56489&type=432522&cHash=de04760394aee86ec12d5ef1e2039c15",
    "grundschule|4|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56478&type=432522&cHash=1d161f047fc964a2558a50984c861dd2",
    "grundschule|4|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|4|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56482&type=432522&cHash=156d20d0cffb069fe7d7d649de1f5181",
    "grundschule|4|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56499&type=432522&cHash=d09cf564347659c1cf441a867b53be08",
    "grundschule|4|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56485&type=432522&cHash=1a4a02c6628acfdecdadaeaa7875e9e9",
    "grundschule|4|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "grundschule|4|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56501&type=432522&cHash=e9668d203821519753514c86a3337d4e",
    "grundschule|4|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56473&type=432522&cHash=dd26b34a738b5cace42c005ba52247eb",
    "grundschule|4|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56492&type=432522&cHash=a47be251af5ecf44d1e875c2a2f05a9f",
    "grundschule|4|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "grundschule|4|sachunterricht":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56503&type=432522&cHash=e586a5bd6d60b78b77361447ec0544d9",
    "grundschule|4|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56506&type=432522&cHash=53aee90f3a5edf1a30409cab8aabaa13",
    "gymnasiale-oberstufe|11|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56443&type=432522&cHash=f79cbda645606803432980906edf790b",
    "gymnasiale-oberstufe|11|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56518&type=432522&cHash=93e006879c67caf19aa2532295cdc04a",
    "gymnasiale-oberstufe|11|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=67901&type=432522&cHash=d79e73a212abb51b925d738539194af4",
    "gymnasiale-oberstufe|11|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56504&type=432522&cHash=5f7f51a4b6788ff839fafea6b89aaf1b",
    "gymnasiale-oberstufe|11|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56457&type=432522&cHash=9bffe23ebd6d709c97b97eadbf0b19b5",
    "gymnasiale-oberstufe|11|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56471&type=432522&cHash=885fd0901a9d09cd7ba1d8484bd5a645",
    "gymnasiale-oberstufe|11|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|11|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56909&type=432522&cHash=b5a8395c4fb7f89ee404078771a71bbe",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56912&type=432522&cHash=b4a97152c78343b90041b8c4f5908627",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56477&type=432522&cHash=c6d0e5cf471fe0dd7634c8f81b7e1c0c",
    "gymnasiale-oberstufe|11|gemeinschaftskunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|11|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|11|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56483&type=432522&cHash=16b60aaac73f7a4f8e429c1379e4171f",
    "gymnasiale-oberstufe|11|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56536&type=432522&cHash=5dbe4391d4189c119127061c79ceb4d2",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56915&type=432522&cHash=f1e6604fb87609a0b0508b4717fc8931",
    "gymnasiale-oberstufe|11|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56500&type=432522&cHash=8f3102c17f653021a1715f01049745d0",
    "gymnasiale-oberstufe|11|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56486&type=432522&cHash=9d657e3ab0dc693de509d67c39f2a5b7",
    "gymnasiale-oberstufe|11|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56446&type=432522&cHash=f35ea8860cbc0a30216fcffd59027c44",
    "gymnasiale-oberstufe|11|philosophie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56538&type=432522&cHash=ab07bf259b8d6531aa7a146cfc08362b",
    "gymnasiale-oberstufe|11|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56524&type=432522&cHash=4d3a6213f84db6adc6f4cd208df364b3",
    "gymnasiale-oberstufe|11|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56510&type=432522&cHash=8094d54afa4675bd382245a102e69efe",
    "gymnasiale-oberstufe|11|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|11|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56449&type=432522&cHash=467819bc552b2f59a1855f06b9fc8561",
    "gymnasiale-oberstufe|11|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56918&type=432522&cHash=31bf941599394e76a4ba4d55dda8eec3",
    "gymnasiale-oberstufe|12|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56443&type=432522&cHash=f79cbda645606803432980906edf790b",
    "gymnasiale-oberstufe|12|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56518&type=432522&cHash=93e006879c67caf19aa2532295cdc04a",
    "gymnasiale-oberstufe|12|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=67901&type=432522&cHash=d79e73a212abb51b925d738539194af4",
    "gymnasiale-oberstufe|12|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56504&type=432522&cHash=5f7f51a4b6788ff839fafea6b89aaf1b",
    "gymnasiale-oberstufe|12|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56457&type=432522&cHash=9bffe23ebd6d709c97b97eadbf0b19b5",
    "gymnasiale-oberstufe|12|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56471&type=432522&cHash=885fd0901a9d09cd7ba1d8484bd5a645",
    "gymnasiale-oberstufe|12|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|12|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56909&type=432522&cHash=b5a8395c4fb7f89ee404078771a71bbe",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56912&type=432522&cHash=b4a97152c78343b90041b8c4f5908627",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56477&type=432522&cHash=c6d0e5cf471fe0dd7634c8f81b7e1c0c",
    "gymnasiale-oberstufe|12|gemeinschaftskunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|12|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|12|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56483&type=432522&cHash=16b60aaac73f7a4f8e429c1379e4171f",
    "gymnasiale-oberstufe|12|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56536&type=432522&cHash=5dbe4391d4189c119127061c79ceb4d2",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56915&type=432522&cHash=f1e6604fb87609a0b0508b4717fc8931",
    "gymnasiale-oberstufe|12|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56500&type=432522&cHash=8f3102c17f653021a1715f01049745d0",
    "gymnasiale-oberstufe|12|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56486&type=432522&cHash=9d657e3ab0dc693de509d67c39f2a5b7",
    "gymnasiale-oberstufe|12|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56446&type=432522&cHash=f35ea8860cbc0a30216fcffd59027c44",
    "gymnasiale-oberstufe|12|philosophie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56538&type=432522&cHash=ab07bf259b8d6531aa7a146cfc08362b",
    "gymnasiale-oberstufe|12|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56524&type=432522&cHash=4d3a6213f84db6adc6f4cd208df364b3",
    "gymnasiale-oberstufe|12|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56510&type=432522&cHash=8094d54afa4675bd382245a102e69efe",
    "gymnasiale-oberstufe|12|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|12|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56449&type=432522&cHash=467819bc552b2f59a1855f06b9fc8561",
    "gymnasiale-oberstufe|12|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56918&type=432522&cHash=31bf941599394e76a4ba4d55dda8eec3",
    "gymnasiale-oberstufe|13|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56443&type=432522&cHash=f79cbda645606803432980906edf790b",
    "gymnasiale-oberstufe|13|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56518&type=432522&cHash=93e006879c67caf19aa2532295cdc04a",
    "gymnasiale-oberstufe|13|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=67901&type=432522&cHash=d79e73a212abb51b925d738539194af4",
    "gymnasiale-oberstufe|13|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56504&type=432522&cHash=5f7f51a4b6788ff839fafea6b89aaf1b",
    "gymnasiale-oberstufe|13|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56457&type=432522&cHash=9bffe23ebd6d709c97b97eadbf0b19b5",
    "gymnasiale-oberstufe|13|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56471&type=432522&cHash=885fd0901a9d09cd7ba1d8484bd5a645",
    "gymnasiale-oberstufe|13|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|13|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56909&type=432522&cHash=b5a8395c4fb7f89ee404078771a71bbe",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56912&type=432522&cHash=b4a97152c78343b90041b8c4f5908627",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56477&type=432522&cHash=c6d0e5cf471fe0dd7634c8f81b7e1c0c",
    "gymnasiale-oberstufe|13|gemeinschaftskunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|13|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|13|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56483&type=432522&cHash=16b60aaac73f7a4f8e429c1379e4171f",
    "gymnasiale-oberstufe|13|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56536&type=432522&cHash=5dbe4391d4189c119127061c79ceb4d2",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56915&type=432522&cHash=f1e6604fb87609a0b0508b4717fc8931",
    "gymnasiale-oberstufe|13|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56500&type=432522&cHash=8f3102c17f653021a1715f01049745d0",
    "gymnasiale-oberstufe|13|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56486&type=432522&cHash=9d657e3ab0dc693de509d67c39f2a5b7",
    "gymnasiale-oberstufe|13|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56446&type=432522&cHash=f35ea8860cbc0a30216fcffd59027c44",
    "gymnasiale-oberstufe|13|philosophie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56538&type=432522&cHash=ab07bf259b8d6531aa7a146cfc08362b",
    "gymnasiale-oberstufe|13|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56524&type=432522&cHash=4d3a6213f84db6adc6f4cd208df364b3",
    "gymnasiale-oberstufe|13|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56510&type=432522&cHash=8094d54afa4675bd382245a102e69efe",
    "gymnasiale-oberstufe|13|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56898&type=432522&cHash=87abfb50985dbd74a5d8d44dc56f6a63",
    "gymnasiale-oberstufe|13|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56449&type=432522&cHash=467819bc552b2f59a1855f06b9fc8561",
    "gymnasiale-oberstufe|13|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56918&type=432522&cHash=31bf941599394e76a4ba4d55dda8eec3",
    "gymnasium|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|10|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|10|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|10|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|10|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|10|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|10|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|10|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|10|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|10|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "gymnasium|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|5|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|5|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|5|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|5|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|5|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|5|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|5|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "gymnasium|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|5|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|5|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|5|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "gymnasium|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|6|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|6|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|6|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|6|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|6|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|6|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|6|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "gymnasium|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|6|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|6|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|6|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "gymnasium|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|7|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|7|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|7|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|7|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|7|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|7|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|7|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|7|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|7|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "gymnasium|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|8|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|8|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|8|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|8|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|8|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|8|kultur":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56513&type=432522&cHash=fb42b7f9af2fc3b52b9063b3651c0ab5",
    "gymnasium|8|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|8|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|8|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|8|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "gymnasium|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "gymnasium|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|9|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "gymnasium|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "gymnasium|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "gymnasium|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "gymnasium|9|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "gymnasium|9|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "gymnasium|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|9|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "gymnasium|9|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "gymnasium|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "gymnasium|9|kultur":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56513&type=432522&cHash=fb42b7f9af2fc3b52b9063b3651c0ab5",
    "gymnasium|9|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "gymnasium|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "gymnasium|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "gymnasium|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "gymnasium|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "gymnasium|9|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "gymnasium|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "gymnasium|9|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "gymnasium|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "gymnasium|9|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|10|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56441&type=432522&cHash=21666826a03ec702641aea53b743076e",
    "hauptschule|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|10|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|10|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|10|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|5|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|5|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|5|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "hauptschule|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|5|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|6|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|6|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|6|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "hauptschule|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|6|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|7|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56441&type=432522&cHash=21666826a03ec702641aea53b743076e",
    "hauptschule|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|7|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|7|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|7|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|8|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56441&type=432522&cHash=21666826a03ec702641aea53b743076e",
    "hauptschule|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|8|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|8|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|8|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "hauptschule|9|arbeitslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56441&type=432522&cHash=21666826a03ec702641aea53b743076e",
    "hauptschule|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "hauptschule|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "hauptschule|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "hauptschule|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "hauptschule|9|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "hauptschule|9|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "hauptschule|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "hauptschule|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "hauptschule|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "hauptschule|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "hauptschule|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "hauptschule|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "hauptschule|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "hauptschule|9|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|10|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|10|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|10|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|10|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|10|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|10|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|10|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|10|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|10|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|10|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|10|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|10|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|10|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|5|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|5|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|5|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|5|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "integrierte-gesamtschule|5|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|5|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|5|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|5|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|5|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|5|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "integrierte-gesamtschule|5|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|5|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|5|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|5|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|5|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|6|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|6|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|6|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|6|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "integrierte-gesamtschule|6|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|6|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|6|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|6|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|6|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|6|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "integrierte-gesamtschule|6|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|6|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|6|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|6|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|6|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|7|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|7|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|7|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|7|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "integrierte-gesamtschule|7|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|7|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|7|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|7|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|7|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|7|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|7|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|7|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|7|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|7|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|8|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|8|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|8|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|8|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "integrierte-gesamtschule|8|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|8|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|8|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|8|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|8|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|8|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|8|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|8|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|8|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|8|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "integrierte-gesamtschule|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "integrierte-gesamtschule|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|9|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "integrierte-gesamtschule|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "integrierte-gesamtschule|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "integrierte-gesamtschule|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "integrierte-gesamtschule|9|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "integrierte-gesamtschule|9|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "integrierte-gesamtschule|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|9|griechisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56480&type=432522&cHash=17451e4b7c721d719322e93172a16337",
    "integrierte-gesamtschule|9|informatik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56535&type=432522&cHash=768bb5c012e1169a07ad4f6615640cf8",
    "integrierte-gesamtschule|9|italienisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56494&type=432522&cHash=3df8b7388e8e2381be65e2603682507c",
    "integrierte-gesamtschule|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "integrierte-gesamtschule|9|kommunikation-medien":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56508&type=432522&cHash=6b7a4261e53186a42605b4d57584571d",
    "integrierte-gesamtschule|9|latein":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56497&type=432522&cHash=86744df3a8ce6f5a8a32a9abd3538559",
    "integrierte-gesamtschule|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "integrierte-gesamtschule|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "integrierte-gesamtschule|9|oekologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56516&type=432522&cHash=e691a2405330c6cfdf22b1120c8e5ecc",
    "integrierte-gesamtschule|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "integrierte-gesamtschule|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "integrierte-gesamtschule|9|russisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56509&type=432522&cHash=204f24231332ad85c2c34f6871215dd8",
    "integrierte-gesamtschule|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76442&type=432522&cHash=9f5b4e7825359f254e73c607fd06cfcd",
    "integrierte-gesamtschule|9|spanisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56514&type=432522&cHash=aea5c823719fcff79d658930dee3c279",
    "integrierte-gesamtschule|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "integrierte-gesamtschule|9|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "integrierte-gesamtschule|9|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|10|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|10|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|10|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|10|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|10|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|10|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|10|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|10|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|5|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|5|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|5|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|5|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "realschule-plus|5|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|5|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "realschule-plus|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|5|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|5|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|5|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|5|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|6|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|6|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|6|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|6|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "realschule-plus|6|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|6|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "realschule-plus|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|6|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|6|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|6|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|6|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|7|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|7|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|7|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|7|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "realschule-plus|7|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|7|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|7|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|7|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|7|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|8|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|8|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|8|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|8|gesellschaftslehre":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56905&type=432522&cHash=03dcdff7d9b0e333ec49fdc7abfb59ac",
    "realschule-plus|8|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|8|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|8|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|8|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|8|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule-plus|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|9|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule-plus|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule-plus|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule-plus|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule-plus|9|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule-plus|9|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule-plus|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|9|hauswirtschaft-sozialwesen":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule-plus|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule-plus|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule-plus|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule-plus|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule-plus|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule-plus|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule-plus|9|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule-plus|9|technik-naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule-plus|9|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule-plus|9|wirtschaft-verwaltung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56522&type=432522&cHash=a60dbe0c6da84e7f3d3d4799a201d3a6",
    "realschule|10|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|10|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|10|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|10|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|10|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|10|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|10|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|10|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|10|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|10|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|10|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|10|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|10|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|10|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|10|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|10|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|10|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|10|sozialpaedagogik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56517&type=432522&cHash=a28bed48b7e674c132543e238a86a28b",
    "realschule|10|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|10|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|10|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|10|wirtschaft-sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56520&type=432522&cHash=d7fd48eaa4de2597b6aebf929bd6b275",
    "realschule|5|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|5|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|5|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|5|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|5|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|5|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|5|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|5|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|5|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|5|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|5|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|5|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|5|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "realschule|5|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|5|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|5|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|5|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|5|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|6|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|6|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|6|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|6|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|6|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|6|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|6|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|6|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|6|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|6|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|6|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|6|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|6|naturwissenschaften":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56532&type=432522&cHash=a433bb508ab20e85ef9373dbcee0a7e8",
    "realschule|6|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|6|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|6|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|6|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|6|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|7|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|7|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|7|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|7|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|7|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|7|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|7|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|7|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|7|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|7|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|7|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|7|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|7|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|7|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|7|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|7|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|7|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|7|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|7|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|7|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|8|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|8|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|8|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|8|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|8|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|8|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|8|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|8|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|8|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|8|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|8|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|8|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|8|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|8|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|8|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|8|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|8|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|8|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|8|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|8|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|9|bildende-kunst":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=76604&type=432522&cHash=ef1bd5b47330c7709f6fd9479062e406",
    "realschule|9|biologie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|9|chemie":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|9|darstellendes-spiel":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56496&type=432522&cHash=cebc75ef72b784d48045aa4e4f0b5092",
    "realschule|9|deutsch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56458&type=432522&cHash=451ab34498bbb890d09487fc6fe1577a",
    "realschule|9|englisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=65390&type=432522&cHash=2acbcd6b2995212986c37b737330f157",
    "realschule|9|erdkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|9|ethik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56910&type=432522&cHash=f9eb5a9b60ad421a5f46f6d6033523bc",
    "realschule|9|evangelische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56934&type=432522&cHash=8313020fa926d3de749419f80da88820",
    "realschule|9|franzoesisch":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56507&type=432522&cHash=e6e35cc6d1184c0e4b9a8347022b0920",
    "realschule|9|geschichte":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|9|katholische-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56914&type=432522&cHash=953db1f57f5f075ade147f8ef456ce9e",
    "realschule|9|mathematik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56490&type=432522&cHash=a23c232416037e96006b9277a0170bfc",
    "realschule|9|musik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56445&type=432522&cHash=c2d04d07adb85f4446ca902d27819bb7",
    "realschule|9|oekonomische-bildung":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56447&type=432522&cHash=6cef45c8e4e85bf9e18e20e57bfc0c27",
    "realschule|9|physik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56515&type=432522&cHash=27e7a0cebb702666fd7b54f188713702",
    "realschule|9|sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56896&type=432522&cHash=cd581447af4bf4b87bb017556e4321a4",
    "realschule|9|sozialpaedagogik":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56517&type=432522&cHash=a28bed48b7e674c132543e238a86a28b",
    "realschule|9|sport":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56448&type=432522&cHash=fc36e6a7c084169db394946037574a10",
    "realschule|9|sport-gesundheit":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56519&type=432522&cHash=fb10d2a07bba486a00e893a1acc58648",
    "realschule|9|weitere-religion":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56916&type=432522&cHash=7d92050be1661fbbbc2f7f16076fa7c7",
    "realschule|9|wirtschaft-sozialkunde":
      "https://bildung.rlp.de/lehrplaene/?tx_rlpbase_download%5Baction%5D=download&tx_rlpbase_download%5Bcontroller%5D=Download&tx_rlpbase_download%5Bitem%5D=56520&type=432522&cHash=d7fd48eaa4de2597b6aebf929bd6b275",
  },

  catalogPaths: [
    { schoolType: "foerderschule", grade: "1", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "1", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "1", subject: "biologie" },
    { schoolType: "foerderschule", grade: "1", subject: "chemie" },
    { schoolType: "foerderschule", grade: "1", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "1", subject: "englisch" },
    { schoolType: "foerderschule", grade: "1", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "1", subject: "ethik" },
    { schoolType: "foerderschule", grade: "1", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "1",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "1", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "1", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "1",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "1", subject: "physik" },
    { schoolType: "foerderschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "1", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "1", subject: "sport" },
    { schoolType: "foerderschule", grade: "1", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "1", subject: "werken" },
    { schoolType: "foerderschule", grade: "10", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "10", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "10", subject: "biologie" },
    { schoolType: "foerderschule", grade: "10", subject: "chemie" },
    { schoolType: "foerderschule", grade: "10", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "10", subject: "englisch" },
    { schoolType: "foerderschule", grade: "10", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "10", subject: "ethik" },
    { schoolType: "foerderschule", grade: "10", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "10", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "10", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "10",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "10", subject: "physik" },
    { schoolType: "foerderschule", grade: "10", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "10", subject: "sport" },
    { schoolType: "foerderschule", grade: "10", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "10", subject: "werken" },
    { schoolType: "foerderschule", grade: "2", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "2", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "2", subject: "biologie" },
    { schoolType: "foerderschule", grade: "2", subject: "chemie" },
    { schoolType: "foerderschule", grade: "2", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "2", subject: "englisch" },
    { schoolType: "foerderschule", grade: "2", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "2", subject: "ethik" },
    { schoolType: "foerderschule", grade: "2", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "2",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "2", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "2", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "2",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "2", subject: "physik" },
    { schoolType: "foerderschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "2", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "2", subject: "sport" },
    { schoolType: "foerderschule", grade: "2", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "2", subject: "werken" },
    { schoolType: "foerderschule", grade: "3", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "3", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "3", subject: "biologie" },
    { schoolType: "foerderschule", grade: "3", subject: "chemie" },
    { schoolType: "foerderschule", grade: "3", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "3", subject: "englisch" },
    { schoolType: "foerderschule", grade: "3", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "3", subject: "ethik" },
    { schoolType: "foerderschule", grade: "3", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "3",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "3", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "3", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "3",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "3", subject: "physik" },
    { schoolType: "foerderschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "3", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "3", subject: "sport" },
    { schoolType: "foerderschule", grade: "3", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "3", subject: "werken" },
    { schoolType: "foerderschule", grade: "4", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "4", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "4", subject: "biologie" },
    { schoolType: "foerderschule", grade: "4", subject: "chemie" },
    { schoolType: "foerderschule", grade: "4", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "4", subject: "englisch" },
    { schoolType: "foerderschule", grade: "4", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "4", subject: "ethik" },
    { schoolType: "foerderschule", grade: "4", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "4",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "4", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "4", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "4",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "4", subject: "physik" },
    { schoolType: "foerderschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "4", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "4", subject: "sport" },
    { schoolType: "foerderschule", grade: "4", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "4", subject: "werken" },
    { schoolType: "foerderschule", grade: "5", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "5", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "5", subject: "biologie" },
    { schoolType: "foerderschule", grade: "5", subject: "chemie" },
    { schoolType: "foerderschule", grade: "5", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "5", subject: "englisch" },
    { schoolType: "foerderschule", grade: "5", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "5", subject: "ethik" },
    { schoolType: "foerderschule", grade: "5", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "5", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "5", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "5",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "5", subject: "physik" },
    { schoolType: "foerderschule", grade: "5", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "5", subject: "sport" },
    { schoolType: "foerderschule", grade: "5", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "5", subject: "werken" },
    { schoolType: "foerderschule", grade: "6", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "6", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "6", subject: "biologie" },
    { schoolType: "foerderschule", grade: "6", subject: "chemie" },
    { schoolType: "foerderschule", grade: "6", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "6", subject: "englisch" },
    { schoolType: "foerderschule", grade: "6", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "6", subject: "ethik" },
    { schoolType: "foerderschule", grade: "6", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "6", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "6", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "6",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "6", subject: "physik" },
    { schoolType: "foerderschule", grade: "6", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "6", subject: "sport" },
    { schoolType: "foerderschule", grade: "6", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "6", subject: "werken" },
    { schoolType: "foerderschule", grade: "7", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "7", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "7", subject: "biologie" },
    { schoolType: "foerderschule", grade: "7", subject: "chemie" },
    { schoolType: "foerderschule", grade: "7", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "7", subject: "englisch" },
    { schoolType: "foerderschule", grade: "7", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "7", subject: "ethik" },
    { schoolType: "foerderschule", grade: "7", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "7", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "7", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "7",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "7", subject: "physik" },
    { schoolType: "foerderschule", grade: "7", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "7", subject: "sport" },
    { schoolType: "foerderschule", grade: "7", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "7", subject: "werken" },
    { schoolType: "foerderschule", grade: "8", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "8", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "8", subject: "biologie" },
    { schoolType: "foerderschule", grade: "8", subject: "chemie" },
    { schoolType: "foerderschule", grade: "8", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "8", subject: "englisch" },
    { schoolType: "foerderschule", grade: "8", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "8", subject: "ethik" },
    { schoolType: "foerderschule", grade: "8", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "8", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "8", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "8",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "8", subject: "physik" },
    { schoolType: "foerderschule", grade: "8", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "8", subject: "sport" },
    { schoolType: "foerderschule", grade: "8", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "8", subject: "werken" },
    { schoolType: "foerderschule", grade: "9", subject: "arbeitslehre" },
    { schoolType: "foerderschule", grade: "9", subject: "bildende-kunst" },
    { schoolType: "foerderschule", grade: "9", subject: "biologie" },
    { schoolType: "foerderschule", grade: "9", subject: "chemie" },
    { schoolType: "foerderschule", grade: "9", subject: "deutsch" },
    { schoolType: "foerderschule", grade: "9", subject: "englisch" },
    { schoolType: "foerderschule", grade: "9", subject: "erdkunde" },
    { schoolType: "foerderschule", grade: "9", subject: "ethik" },
    { schoolType: "foerderschule", grade: "9", subject: "geschichte" },
    {
      schoolType: "foerderschule",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "foerderschule", grade: "9", subject: "mathematik" },
    { schoolType: "foerderschule", grade: "9", subject: "musik" },
    {
      schoolType: "foerderschule",
      grade: "9",
      subject: "oekonomische-bildung",
    },
    { schoolType: "foerderschule", grade: "9", subject: "physik" },
    { schoolType: "foerderschule", grade: "9", subject: "sachunterricht" },
    { schoolType: "foerderschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "foerderschule", grade: "9", subject: "sport" },
    { schoolType: "foerderschule", grade: "9", subject: "textiles-gestalten" },
    { schoolType: "foerderschule", grade: "9", subject: "werken" },
    { schoolType: "grundschule", grade: "1", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "ethik" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "1", subject: "informatik" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "oekonomische-bildung" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "ethik" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "2", subject: "informatik" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "oekonomische-bildung" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "ethik" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "3", subject: "informatik" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "oekonomische-bildung" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "ethik" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "4", subject: "informatik" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "oekonomische-bildung" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "erdkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "ethik" },
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
      subject: "gemeinschaftskunde",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "weitere-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "erdkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "ethik" },
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
      subject: "gemeinschaftskunde",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "weitere-religion",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "englisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "erdkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "ethik" },
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
      subject: "gemeinschaftskunde",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sozialkunde" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "weitere-religion",
    },
    { schoolType: "gymnasium", grade: "10", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "weitere-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "5", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "weitere-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "6", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "weitere-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "weitere-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kultur" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "weitere-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kultur" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "oekonomische-bildung" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "10", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "10", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "10", subject: "biologie" },
    { schoolType: "hauptschule", grade: "10", subject: "chemie" },
    { schoolType: "hauptschule", grade: "10", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "10", subject: "englisch" },
    { schoolType: "hauptschule", grade: "10", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "10", subject: "ethik" },
    {
      schoolType: "hauptschule",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "hauptschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "10", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "10", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "10", subject: "musik" },
    { schoolType: "hauptschule", grade: "10", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "10", subject: "physik" },
    { schoolType: "hauptschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "10", subject: "sport" },
    { schoolType: "hauptschule", grade: "10", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "5", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "5", subject: "englisch" },
    { schoolType: "hauptschule", grade: "5", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "5", subject: "ethik" },
    { schoolType: "hauptschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "5", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "5", subject: "musik" },
    { schoolType: "hauptschule", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "5", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "5", subject: "sport" },
    { schoolType: "hauptschule", grade: "5", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "6", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "6", subject: "englisch" },
    { schoolType: "hauptschule", grade: "6", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "6", subject: "ethik" },
    { schoolType: "hauptschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "6", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "6", subject: "musik" },
    { schoolType: "hauptschule", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "hauptschule", grade: "6", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "6", subject: "sport" },
    { schoolType: "hauptschule", grade: "6", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "7", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "7", subject: "biologie" },
    { schoolType: "hauptschule", grade: "7", subject: "chemie" },
    { schoolType: "hauptschule", grade: "7", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "7", subject: "englisch" },
    { schoolType: "hauptschule", grade: "7", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "7", subject: "ethik" },
    { schoolType: "hauptschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "7", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "7", subject: "musik" },
    { schoolType: "hauptschule", grade: "7", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "7", subject: "physik" },
    { schoolType: "hauptschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "7", subject: "sport" },
    { schoolType: "hauptschule", grade: "7", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "8", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "8", subject: "biologie" },
    { schoolType: "hauptschule", grade: "8", subject: "chemie" },
    { schoolType: "hauptschule", grade: "8", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "8", subject: "englisch" },
    { schoolType: "hauptschule", grade: "8", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "8", subject: "ethik" },
    { schoolType: "hauptschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "8", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "8", subject: "musik" },
    { schoolType: "hauptschule", grade: "8", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "8", subject: "physik" },
    { schoolType: "hauptschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "8", subject: "sport" },
    { schoolType: "hauptschule", grade: "8", subject: "weitere-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "9", subject: "bildende-kunst" },
    { schoolType: "hauptschule", grade: "9", subject: "biologie" },
    { schoolType: "hauptschule", grade: "9", subject: "chemie" },
    { schoolType: "hauptschule", grade: "9", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "9", subject: "englisch" },
    { schoolType: "hauptschule", grade: "9", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "9", subject: "ethik" },
    { schoolType: "hauptschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "hauptschule", grade: "9", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "9", subject: "musik" },
    { schoolType: "hauptschule", grade: "9", subject: "oekonomische-bildung" },
    { schoolType: "hauptschule", grade: "9", subject: "physik" },
    { schoolType: "hauptschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "hauptschule", grade: "9", subject: "sport" },
    { schoolType: "hauptschule", grade: "9", subject: "weitere-religion" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "bildende-kunst",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "biologie",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "chemie" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "deutsch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "englisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "erdkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "ethik" },
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
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "kommunikation-medien",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "latein" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "mathematik",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "musik" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "physik" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "russisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "sozialkunde",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "spanisch",
    },
    { schoolType: "integrierte-gesamtschule", grade: "10", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "10",
      subject: "weitere-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "bildende-kunst",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "deutsch" },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "englisch" },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "erdkunde" },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "ethik" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "franzoesisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "kommunikation-medien",
    },
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
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "russisch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "sozialkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "spanisch" },
    { schoolType: "integrierte-gesamtschule", grade: "5", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "5",
      subject: "weitere-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "bildende-kunst",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "deutsch" },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "englisch" },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "erdkunde" },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "ethik" },
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
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "kommunikation-medien",
    },
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
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "russisch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "sozialkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "spanisch" },
    { schoolType: "integrierte-gesamtschule", grade: "6", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "6",
      subject: "weitere-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "bildende-kunst",
    },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "biologie" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "chemie" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "deutsch" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "englisch" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "erdkunde" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "ethik" },
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
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "kommunikation-medien",
    },
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
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "physik" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "russisch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "sozialkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "spanisch" },
    { schoolType: "integrierte-gesamtschule", grade: "7", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "7",
      subject: "weitere-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "bildende-kunst",
    },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "biologie" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "chemie" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "deutsch" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "englisch" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "erdkunde" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "ethik" },
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
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "kommunikation-medien",
    },
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
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "physik" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "russisch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "sozialkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "spanisch" },
    { schoolType: "integrierte-gesamtschule", grade: "8", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "8",
      subject: "weitere-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "bildende-kunst",
    },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "biologie" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "chemie" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "darstellendes-spiel",
    },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "deutsch" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "englisch" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "erdkunde" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "ethik" },
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
      subject: "geschichte",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "griechisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "informatik",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "italienisch",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "katholische-religion",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "kommunikation-medien",
    },
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
      subject: "oekologie",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "oekonomische-bildung",
    },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "physik" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "russisch" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "sozialkunde",
    },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "spanisch" },
    { schoolType: "integrierte-gesamtschule", grade: "9", subject: "sport" },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "sport-gesundheit",
    },
    {
      schoolType: "integrierte-gesamtschule",
      grade: "9",
      subject: "weitere-religion",
    },
    { schoolType: "realschule", grade: "10", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "10", subject: "biologie" },
    { schoolType: "realschule", grade: "10", subject: "chemie" },
    { schoolType: "realschule", grade: "10", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "10", subject: "deutsch" },
    { schoolType: "realschule", grade: "10", subject: "englisch" },
    { schoolType: "realschule", grade: "10", subject: "erdkunde" },
    { schoolType: "realschule", grade: "10", subject: "ethik" },
    { schoolType: "realschule", grade: "10", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "10", subject: "geschichte" },
    { schoolType: "realschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "10", subject: "mathematik" },
    { schoolType: "realschule", grade: "10", subject: "musik" },
    { schoolType: "realschule", grade: "10", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "10", subject: "physik" },
    { schoolType: "realschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "10", subject: "sozialpaedagogik" },
    { schoolType: "realschule", grade: "10", subject: "sport" },
    { schoolType: "realschule", grade: "10", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "10", subject: "weitere-religion" },
    {
      schoolType: "realschule",
      grade: "10",
      subject: "wirtschaft-sozialkunde",
    },
    { schoolType: "realschule", grade: "5", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "5", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "5", subject: "deutsch" },
    { schoolType: "realschule", grade: "5", subject: "englisch" },
    { schoolType: "realschule", grade: "5", subject: "erdkunde" },
    { schoolType: "realschule", grade: "5", subject: "ethik" },
    { schoolType: "realschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "5", subject: "geschichte" },
    { schoolType: "realschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "5", subject: "mathematik" },
    { schoolType: "realschule", grade: "5", subject: "musik" },
    { schoolType: "realschule", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "realschule", grade: "5", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "5", subject: "sport" },
    { schoolType: "realschule", grade: "5", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "5", subject: "weitere-religion" },
    { schoolType: "realschule", grade: "6", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "6", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "6", subject: "deutsch" },
    { schoolType: "realschule", grade: "6", subject: "englisch" },
    { schoolType: "realschule", grade: "6", subject: "erdkunde" },
    { schoolType: "realschule", grade: "6", subject: "ethik" },
    { schoolType: "realschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "6", subject: "geschichte" },
    { schoolType: "realschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "6", subject: "mathematik" },
    { schoolType: "realschule", grade: "6", subject: "musik" },
    { schoolType: "realschule", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "realschule", grade: "6", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "6", subject: "sport" },
    { schoolType: "realschule", grade: "6", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "6", subject: "weitere-religion" },
    { schoolType: "realschule", grade: "7", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "7", subject: "biologie" },
    { schoolType: "realschule", grade: "7", subject: "chemie" },
    { schoolType: "realschule", grade: "7", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "7", subject: "deutsch" },
    { schoolType: "realschule", grade: "7", subject: "englisch" },
    { schoolType: "realschule", grade: "7", subject: "erdkunde" },
    { schoolType: "realschule", grade: "7", subject: "ethik" },
    { schoolType: "realschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "7", subject: "geschichte" },
    { schoolType: "realschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "7", subject: "mathematik" },
    { schoolType: "realschule", grade: "7", subject: "musik" },
    { schoolType: "realschule", grade: "7", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "7", subject: "physik" },
    { schoolType: "realschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "7", subject: "sport" },
    { schoolType: "realschule", grade: "7", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "7", subject: "weitere-religion" },
    { schoolType: "realschule", grade: "8", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "8", subject: "biologie" },
    { schoolType: "realschule", grade: "8", subject: "chemie" },
    { schoolType: "realschule", grade: "8", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "8", subject: "deutsch" },
    { schoolType: "realschule", grade: "8", subject: "englisch" },
    { schoolType: "realschule", grade: "8", subject: "erdkunde" },
    { schoolType: "realschule", grade: "8", subject: "ethik" },
    { schoolType: "realschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "8", subject: "geschichte" },
    { schoolType: "realschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "8", subject: "mathematik" },
    { schoolType: "realschule", grade: "8", subject: "musik" },
    { schoolType: "realschule", grade: "8", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "8", subject: "physik" },
    { schoolType: "realschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "8", subject: "sport" },
    { schoolType: "realschule", grade: "8", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "8", subject: "weitere-religion" },
    { schoolType: "realschule", grade: "9", subject: "bildende-kunst" },
    { schoolType: "realschule", grade: "9", subject: "biologie" },
    { schoolType: "realschule", grade: "9", subject: "chemie" },
    { schoolType: "realschule", grade: "9", subject: "darstellendes-spiel" },
    { schoolType: "realschule", grade: "9", subject: "deutsch" },
    { schoolType: "realschule", grade: "9", subject: "englisch" },
    { schoolType: "realschule", grade: "9", subject: "erdkunde" },
    { schoolType: "realschule", grade: "9", subject: "ethik" },
    { schoolType: "realschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "realschule", grade: "9", subject: "geschichte" },
    { schoolType: "realschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "9", subject: "mathematik" },
    { schoolType: "realschule", grade: "9", subject: "musik" },
    { schoolType: "realschule", grade: "9", subject: "oekonomische-bildung" },
    { schoolType: "realschule", grade: "9", subject: "physik" },
    { schoolType: "realschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "realschule", grade: "9", subject: "sozialpaedagogik" },
    { schoolType: "realschule", grade: "9", subject: "sport" },
    { schoolType: "realschule", grade: "9", subject: "sport-gesundheit" },
    { schoolType: "realschule", grade: "9", subject: "weitere-religion" },
    { schoolType: "realschule", grade: "9", subject: "wirtschaft-sozialkunde" },
    { schoolType: "realschule-plus", grade: "10", subject: "bildende-kunst" },
    { schoolType: "realschule-plus", grade: "10", subject: "biologie" },
    { schoolType: "realschule-plus", grade: "10", subject: "chemie" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "10", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "10", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "10", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "10", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "10", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "10", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "10", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "10", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "10", subject: "physik" },
    { schoolType: "realschule-plus", grade: "10", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "10", subject: "sport" },
    { schoolType: "realschule-plus", grade: "10", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "10", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "10",
      subject: "wirtschaft-verwaltung",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "bildende-kunst" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "5", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "5", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "5", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "5", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "5", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "5", subject: "sport" },
    { schoolType: "realschule-plus", grade: "5", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "5", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "5",
      subject: "wirtschaft-verwaltung",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "bildende-kunst" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "6", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "6", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "6", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "6", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "6", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "naturwissenschaften",
    },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "6", subject: "sport" },
    { schoolType: "realschule-plus", grade: "6", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "6", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "6",
      subject: "wirtschaft-verwaltung",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "bildende-kunst" },
    { schoolType: "realschule-plus", grade: "7", subject: "biologie" },
    { schoolType: "realschule-plus", grade: "7", subject: "chemie" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "7", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "7", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "7", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "7", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "7", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "physik" },
    { schoolType: "realschule-plus", grade: "7", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "7", subject: "sport" },
    { schoolType: "realschule-plus", grade: "7", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "7", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "7",
      subject: "wirtschaft-verwaltung",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "bildende-kunst" },
    { schoolType: "realschule-plus", grade: "8", subject: "biologie" },
    { schoolType: "realschule-plus", grade: "8", subject: "chemie" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "8", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "8", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "8", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "8", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "gesellschaftslehre",
    },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "8", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "physik" },
    { schoolType: "realschule-plus", grade: "8", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "8", subject: "sport" },
    { schoolType: "realschule-plus", grade: "8", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "8", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "8",
      subject: "wirtschaft-verwaltung",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "bildende-kunst" },
    { schoolType: "realschule-plus", grade: "9", subject: "biologie" },
    { schoolType: "realschule-plus", grade: "9", subject: "chemie" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "darstellendes-spiel",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "deutsch" },
    { schoolType: "realschule-plus", grade: "9", subject: "englisch" },
    { schoolType: "realschule-plus", grade: "9", subject: "erdkunde" },
    { schoolType: "realschule-plus", grade: "9", subject: "ethik" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "evangelische-religion",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "franzoesisch" },
    { schoolType: "realschule-plus", grade: "9", subject: "geschichte" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "hauswirtschaft-sozialwesen",
    },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "mathematik" },
    { schoolType: "realschule-plus", grade: "9", subject: "musik" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "oekonomische-bildung",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "physik" },
    { schoolType: "realschule-plus", grade: "9", subject: "sozialkunde" },
    { schoolType: "realschule-plus", grade: "9", subject: "sport" },
    { schoolType: "realschule-plus", grade: "9", subject: "sport-gesundheit" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "technik-naturwissenschaften",
    },
    { schoolType: "realschule-plus", grade: "9", subject: "weitere-religion" },
    {
      schoolType: "realschule-plus",
      grade: "9",
      subject: "wirtschaft-verwaltung",
    },
  ],
};
