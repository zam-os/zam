import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BremenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Official Bremen Bildungsplan catalog (LIS portal).
 *
 * Captured from:
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/primarstufe-elementarbereich-21952
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/sekundarbereich-i-21953
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/sekundarbereich-ii-allgemeinbildend-21954
 *
 * Content sources are the published PDF Bildungspläne (not the landing page).
 * Grade ranges follow each plan's stated scope (Oberschule/Gymnasium 5–10,
 * Naturwissenschaften integrated 5–8 then Biologie/Chemie/Physik 9–10,
 * Primarstufe 1–4, Gymnasiale Oberstufe Qualifikationsphase 11–13).
 *
 * Dual vocational KMK Rahmenlehrpläne (external) and "in Bearbeitung"
 * berufsbildend drafts are out of scope for this capture.
 */
export interface BildungsplanBremenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  /** Union of subjects per school type (display); paths are grade-scoped. */
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  /** Explicit verified leaves — independent of topic payload. */
  catalogPaths: BremenCatalogPath[];
}

export const BILDUNGSPLAN_BREMEN_MANIFEST: BildungsplanBremenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "LIS Bremen Bildungspläne (Primar, Sek I, GyO)",

  schoolTypes: [
    {
      id: "primarstufe",
      label: "Primarstufe",
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
      id: "gymnasiale-oberstufe",
      label: "Gymnasiale Oberstufe",
    },
  ],

  grades: {
    primarstufe: ["1", "2", "3", "4"],
    oberschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "gymnasiale-oberstufe": ["11", "12", "13"],
  },

  subjects: {
    primarstufe: [
      {
        id: "aesthetische-bildung",
        label: "Ästhetische Bildung",
      },
      {
        id: "deutsch",
        label: "Deutsch / Sprache",
      },
      {
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "herkunftssprachen",
        label: "Herkunftssprachen",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "religion",
        label: "Religion",
      },
      {
        id: "sachunterricht",
        label: "Sachbildung und Sachunterricht",
      },
      {
        id: "sport",
        label: "Sport",
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
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "franzoesisch",
        label: "Französisch",
      },
      {
        id: "gesellschaft-politik",
        label: "Gesellschaft und Politik",
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
        id: "medienbildung",
        label: "Medienbildung",
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
        id: "philosophie",
        label: "Philosophie",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "polnisch",
        label: "Polnisch",
      },
      {
        id: "religion",
        label: "Religion",
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
        id: "tuerkisch",
        label: "Türkisch",
      },
      {
        id: "wirtschaft-arbeit-technik",
        label: "Wirtschaft/Arbeit/Technik",
      },
    ],
    gymnasium: [
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
        id: "european-studies",
        label: "European Studies",
      },
      {
        id: "franzoesisch-2",
        label: "Französisch (2. Fremdsprache)",
      },
      {
        id: "franzoesisch-3",
        label: "Französisch (3. Fremdsprache)",
      },
      {
        id: "kunst",
        label: "Kunst",
      },
      {
        id: "latein-2",
        label: "Latein (2. Fremdsprache)",
      },
      {
        id: "latein-3",
        label: "Latein (3. Fremdsprache)",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "medienbildung",
        label: "Medienbildung",
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
        id: "philosophie",
        label: "Philosophie",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "polnisch",
        label: "Polnisch",
      },
      {
        id: "religion",
        label: "Religion",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "spanisch-2",
        label: "Spanisch (2. Fremdsprache)",
      },
      {
        id: "spanisch-3",
        label: "Spanisch (3. Fremdsprache)",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "tuerkisch",
        label: "Türkisch",
      },
      {
        id: "welt-umweltkunde",
        label: "Welt-Umweltkunde, Geschichte, Geographie, Politik",
      },
      {
        id: "wirtschaft-arbeit-technik",
        label: "Wirtschaft – Arbeit – Technik",
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
        id: "informatik",
        label: "Informatik",
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
        id: "paedagogik",
        label: "Pädagogik",
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
        id: "politik",
        label: "Politik",
      },
      {
        id: "psychologie",
        label: "Psychologie",
      },
      {
        id: "religion",
        label: "Religion",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "soziologie",
        label: "Soziologie",
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
        id: "wirtschaftslehre",
        label: "Wirtschaftslehre",
      },
    ],
  },

  tracks: {},

  topics: {
    "gymnasiale-oberstufe|11|biologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|chemie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|chinesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|darstellendes-spiel": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|deutsch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|franzoesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|geographie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|geschichte": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|kunst": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|latein": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|mathematik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|musik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|paedagogik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|philosophie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|physik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|politik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|psychologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|religion": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|russisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|soziologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|spanisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|sport": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|11|wirtschaftslehre": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|biologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|chemie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|chinesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|darstellendes-spiel": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|deutsch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|franzoesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|geographie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|geschichte": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|kunst": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|latein": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|mathematik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|musik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|paedagogik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|philosophie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|physik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|politik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|psychologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|religion": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|russisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|soziologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|sport": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|12|wirtschaftslehre": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|biologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|chemie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|chinesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|darstellendes-spiel": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|deutsch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|franzoesisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|geographie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|geschichte": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|kunst": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|latein": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|mathematik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|musik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|paedagogik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|philosophie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|physik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|politik": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|psychologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|religion": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|russisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|soziologie": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|sport": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasiale-oberstufe|13|wirtschaftslehre": [
      {
        id: "einfuehrungsphase",
        label: "Einführungsphase / Anforderungsniveau",
      },
      { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
      { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
      {
        id: "abiturrelevante-inhalte",
        label: "Abiturrelevante Inhalte und Kompetenzen",
      },
    ],
    "gymnasium|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|5|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|5|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|5|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|5|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|5|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "gymnasium|5|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|5|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|5|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|6|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|6|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|6|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|6|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|6|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "gymnasium|6|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|6|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|6|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|7|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|7|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|7|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|7|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|7|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "gymnasium|7|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|7|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|7|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|8|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|8|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|8|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|8|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|8|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "gymnasium|8|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|8|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|8|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|9|biologie": [
      { id: "zelle-stoffwechsel", label: "Zelle und Stoffwechsel" },
      { id: "kontrolle-regulation", label: "Kontrolle und Regulation" },
      {
        id: "information-kommunikation",
        label: "Information und Kommunikation",
      },
      { id: "reproduktion-vererbung", label: "Reproduktion und Vererbung" },
      { id: "evolution-vielfalt", label: "Evolution und Vielfalt" },
      { id: "oekologie", label: "Ökologie und Nachhaltigkeit" },
    ],
    "gymnasium|9|chemie": [
      { id: "stoff-eigenschaft", label: "Stoffe und Eigenschaften" },
      { id: "chemische-reaktion", label: "Chemische Reaktion" },
      { id: "struktur-bindung", label: "Struktur und Bindung" },
      { id: "energie", label: "Energie bei chemischen Vorgängen" },
    ],
    "gymnasium|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|9|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|9|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|9|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|9|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|9|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|9|physik": [
      { id: "materie", label: "Materie" },
      { id: "wechselwirkungen", label: "Wechselwirkungen" },
      { id: "systeme", label: "Systeme" },
      { id: "energie-physik", label: "Energie" },
    ],
    "gymnasium|9|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|9|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|10|biologie": [
      { id: "zelle-stoffwechsel", label: "Zelle und Stoffwechsel" },
      { id: "kontrolle-regulation", label: "Kontrolle und Regulation" },
      {
        id: "information-kommunikation",
        label: "Information und Kommunikation",
      },
      { id: "reproduktion-vererbung", label: "Reproduktion und Vererbung" },
      { id: "evolution-vielfalt", label: "Evolution und Vielfalt" },
      { id: "oekologie", label: "Ökologie und Nachhaltigkeit" },
    ],
    "gymnasium|10|chemie": [
      { id: "stoff-eigenschaft", label: "Stoffe und Eigenschaften" },
      { id: "chemische-reaktion", label: "Chemische Reaktion" },
      { id: "struktur-bindung", label: "Struktur und Bindung" },
      { id: "energie", label: "Energie bei chemischen Vorgängen" },
    ],
    "gymnasium|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|10|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|european-studies": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|10|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
    ],
    "gymnasium|10|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "gymnasium|10|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "gymnasium|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|10|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "gymnasium|10|physik": [
      { id: "materie", label: "Materie" },
      { id: "wechselwirkungen", label: "Wechselwirkungen" },
      { id: "systeme", label: "Systeme" },
      { id: "energie-physik", label: "Energie" },
    ],
    "gymnasium|10|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|spanisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|welt-umweltkunde": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "gymnasium|10|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|5|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|5|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|5|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|5|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "oberschule|5|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|5|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|5|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|5|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|6|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|6|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|6|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|6|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "oberschule|6|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|6|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|6|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|6|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|7|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|7|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|7|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|7|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "oberschule|7|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|7|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|7|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|7|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|8|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|8|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|8|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|8|naturwissenschaften": [
      {
        id: "naturwissenschaftliche-erkenntnis",
        label: "Naturwissenschaftliche Erkenntnisgewinnung",
      },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
      { id: "fachwissen", label: "Fachwissen" },
    ],
    "oberschule|8|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|8|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|8|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|8|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|9|biologie": [
      { id: "zelle-stoffwechsel", label: "Zelle und Stoffwechsel" },
      { id: "kontrolle-regulation", label: "Kontrolle und Regulation" },
      {
        id: "information-kommunikation",
        label: "Information und Kommunikation",
      },
      { id: "reproduktion-vererbung", label: "Reproduktion und Vererbung" },
      { id: "evolution-vielfalt", label: "Evolution und Vielfalt" },
      { id: "oekologie", label: "Ökologie und Nachhaltigkeit" },
    ],
    "oberschule|9|chemie": [
      { id: "stoff-eigenschaft", label: "Stoffe und Eigenschaften" },
      { id: "chemische-reaktion", label: "Chemische Reaktion" },
      { id: "struktur-bindung", label: "Struktur und Bindung" },
      { id: "energie", label: "Energie bei chemischen Vorgängen" },
    ],
    "oberschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|9|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|9|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|9|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|9|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|9|physik": [
      { id: "materie", label: "Materie" },
      { id: "wechselwirkungen", label: "Wechselwirkungen" },
      { id: "systeme", label: "Systeme" },
      { id: "energie-physik", label: "Energie" },
    ],
    "oberschule|9|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|9|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|9|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "oberschule|10|biologie": [
      { id: "zelle-stoffwechsel", label: "Zelle und Stoffwechsel" },
      { id: "kontrolle-regulation", label: "Kontrolle und Regulation" },
      {
        id: "information-kommunikation",
        label: "Information und Kommunikation",
      },
      { id: "reproduktion-vererbung", label: "Reproduktion und Vererbung" },
      { id: "evolution-vielfalt", label: "Evolution und Vielfalt" },
      { id: "oekologie", label: "Ökologie und Nachhaltigkeit" },
    ],
    "oberschule|10|chemie": [
      { id: "stoff-eigenschaft", label: "Stoffe und Eigenschaften" },
      { id: "chemische-reaktion", label: "Chemische Reaktion" },
      { id: "struktur-bindung", label: "Struktur und Bindung" },
      { id: "energie", label: "Energie bei chemischen Vorgängen" },
    ],
    "oberschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "oberschule|10|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|gesellschaft-politik": [
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "politik", label: "Politik" },
      { id: "geschichte", label: "Geschichte" },
      { id: "geographie", label: "Geographie" },
    ],
    "oberschule|10|kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption und Reflexion" },
      { id: "reflexion", label: "Kulturelle und historische Kontexte" },
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
      { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
      { id: "geometrie", label: "Geometrie" },
      { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
      { id: "stochastik", label: "Stochastik – Daten und Zufall" },
    ],
    "oberschule|10|medienbildung": [
      { id: "mediennutzung", label: "Mediennutzung" },
      { id: "mediengestaltung", label: "Mediengestaltung" },
      { id: "medienkritik", label: "Medienkritik" },
    ],
    "oberschule|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören und Deuten" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "oberschule|10|philosophie": [
      { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
      { id: "gut-gerecht", label: "Das Gute und Gerechte" },
      { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
    ],
    "oberschule|10|physik": [
      { id: "materie", label: "Materie" },
      { id: "wechselwirkungen", label: "Wechselwirkungen" },
      { id: "systeme", label: "Systeme" },
      { id: "energie-physik", label: "Energie" },
    ],
    "oberschule|10|polnisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "oberschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "oberschule|10|tuerkisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "oberschule|10|wirtschaft-arbeit-technik": [
      { id: "arbeit-beruf", label: "Arbeit und Beruf" },
      { id: "technik-produktion", label: "Technik und Produktion" },
      { id: "haushalt-konsum", label: "Haushalt und Konsum" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "primarstufe|1|aesthetische-bildung": [
      { id: "wahrnehmen", label: "Wahrnehmen und Gestalten" },
      { id: "darstellen", label: "Darstellen und Präsentieren" },
      { id: "reflektieren", label: "Reflektieren" },
    ],
    "primarstufe|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "primarstufe|1|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|1|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|1|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten, Häufigkeit und Wahrscheinlichkeit" },
    ],
    "primarstufe|1|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "primarstufe|1|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik und Arbeitswelt" },
      { id: "raum", label: "Raum und Mobilität" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "primarstufe|1|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "primarstufe|2|aesthetische-bildung": [
      { id: "wahrnehmen", label: "Wahrnehmen und Gestalten" },
      { id: "darstellen", label: "Darstellen und Präsentieren" },
      { id: "reflektieren", label: "Reflektieren" },
    ],
    "primarstufe|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "primarstufe|2|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|2|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|2|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten, Häufigkeit und Wahrscheinlichkeit" },
    ],
    "primarstufe|2|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "primarstufe|2|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik und Arbeitswelt" },
      { id: "raum", label: "Raum und Mobilität" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "primarstufe|2|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "primarstufe|3|aesthetische-bildung": [
      { id: "wahrnehmen", label: "Wahrnehmen und Gestalten" },
      { id: "darstellen", label: "Darstellen und Präsentieren" },
      { id: "reflektieren", label: "Reflektieren" },
    ],
    "primarstufe|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "primarstufe|3|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|3|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|3|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten, Häufigkeit und Wahrscheinlichkeit" },
    ],
    "primarstufe|3|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "primarstufe|3|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik und Arbeitswelt" },
      { id: "raum", label: "Raum und Mobilität" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "primarstufe|3|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "primarstufe|4|aesthetische-bildung": [
      { id: "wahrnehmen", label: "Wahrnehmen und Gestalten" },
      { id: "darstellen", label: "Darstellen und Präsentieren" },
      { id: "reflektieren", label: "Reflektieren" },
    ],
    "primarstufe|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "primarstufe|4|englisch": [
      { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
      {
        id: "verfuegung-sprachliche-mittel",
        label: "Verfügung über sprachliche Mittel",
      },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|4|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "primarstufe|4|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "daten-zufall", label: "Daten, Häufigkeit und Wahrscheinlichkeit" },
    ],
    "primarstufe|4|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "primarstufe|4|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik und Arbeitswelt" },
      { id: "raum", label: "Raum und Mobilität" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "primarstufe|4|sport": [
      { id: "bewegen-spielen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten und Trainieren" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
  },

  contentUrls: {
    "gymnasiale-oberstufe|11|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Biologie_2022.pdf",
    "gymnasiale-oberstufe|11|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chemie_2022.pdf",
    "gymnasiale-oberstufe|11|chinesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chinesisch_2000.pdf",
    "gymnasiale-oberstufe|11|darstellendes-spiel":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Darstellendes_Spiel_2009.pdf",
    "gymnasiale-oberstufe|11|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Deutsch_2008.pdf",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Franz%C3%B6sisch_2008.pdf",
    "gymnasiale-oberstufe|11|geographie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geografie_2008.pdf",
    "gymnasiale-oberstufe|11|geschichte":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geschichte_2008.pdf",
    "gymnasiale-oberstufe|11|informatik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Informatik_2009.pdf",
    "gymnasiale-oberstufe|11|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Kunst_2009.pdf",
    "gymnasiale-oberstufe|11|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Latein_2008.pdf",
    "gymnasiale-oberstufe|11|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Mathematik_2022.pdf",
    "gymnasiale-oberstufe|11|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Musik_2009.pdf",
    "gymnasiale-oberstufe|11|paedagogik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_P%C3%A4dagogik_2009.pdf",
    "gymnasiale-oberstufe|11|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Philosophie_2009.pdf",
    "gymnasiale-oberstufe|11|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Physik_2022.pdf",
    "gymnasiale-oberstufe|11|politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Politik_2008.pdf",
    "gymnasiale-oberstufe|11|psychologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Psychologie_2009.pdf",
    "gymnasiale-oberstufe|11|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasiale-oberstufe|11|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Russisch_2009.pdf",
    "gymnasiale-oberstufe|11|soziologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/SOZ_GyQ_2009.pdf",
    "gymnasiale-oberstufe|11|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Spanisch_2008.pdf",
    "gymnasiale-oberstufe|11|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Sport_2008.pdf",
    "gymnasiale-oberstufe|11|wirtschaftslehre":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Wirtschaftslehre_2008.pdf",
    "gymnasiale-oberstufe|12|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Biologie_2022.pdf",
    "gymnasiale-oberstufe|12|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chemie_2022.pdf",
    "gymnasiale-oberstufe|12|chinesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chinesisch_2000.pdf",
    "gymnasiale-oberstufe|12|darstellendes-spiel":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Darstellendes_Spiel_2009.pdf",
    "gymnasiale-oberstufe|12|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Deutsch_2008.pdf",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Franz%C3%B6sisch_2008.pdf",
    "gymnasiale-oberstufe|12|geographie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geografie_2008.pdf",
    "gymnasiale-oberstufe|12|geschichte":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geschichte_2008.pdf",
    "gymnasiale-oberstufe|12|informatik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Informatik_2009.pdf",
    "gymnasiale-oberstufe|12|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Kunst_2009.pdf",
    "gymnasiale-oberstufe|12|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Latein_2008.pdf",
    "gymnasiale-oberstufe|12|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Mathematik_2022.pdf",
    "gymnasiale-oberstufe|12|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Musik_2009.pdf",
    "gymnasiale-oberstufe|12|paedagogik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_P%C3%A4dagogik_2009.pdf",
    "gymnasiale-oberstufe|12|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Philosophie_2009.pdf",
    "gymnasiale-oberstufe|12|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Physik_2022.pdf",
    "gymnasiale-oberstufe|12|politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Politik_2008.pdf",
    "gymnasiale-oberstufe|12|psychologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Psychologie_2009.pdf",
    "gymnasiale-oberstufe|12|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasiale-oberstufe|12|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Russisch_2009.pdf",
    "gymnasiale-oberstufe|12|soziologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/SOZ_GyQ_2009.pdf",
    "gymnasiale-oberstufe|12|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Spanisch_2008.pdf",
    "gymnasiale-oberstufe|12|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Sport_2008.pdf",
    "gymnasiale-oberstufe|12|wirtschaftslehre":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Wirtschaftslehre_2008.pdf",
    "gymnasiale-oberstufe|13|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Biologie_2022.pdf",
    "gymnasiale-oberstufe|13|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chemie_2022.pdf",
    "gymnasiale-oberstufe|13|chinesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Chinesisch_2000.pdf",
    "gymnasiale-oberstufe|13|darstellendes-spiel":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Darstellendes_Spiel_2009.pdf",
    "gymnasiale-oberstufe|13|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Deutsch_2008.pdf",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Franz%C3%B6sisch_2008.pdf",
    "gymnasiale-oberstufe|13|geographie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geografie_2008.pdf",
    "gymnasiale-oberstufe|13|geschichte":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Geschichte_2008.pdf",
    "gymnasiale-oberstufe|13|informatik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Informatik_2009.pdf",
    "gymnasiale-oberstufe|13|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Kunst_2009.pdf",
    "gymnasiale-oberstufe|13|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Latein_2008.pdf",
    "gymnasiale-oberstufe|13|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Mathematik_2022.pdf",
    "gymnasiale-oberstufe|13|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Musik_2009.pdf",
    "gymnasiale-oberstufe|13|paedagogik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_P%C3%A4dagogik_2009.pdf",
    "gymnasiale-oberstufe|13|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Philosophie_2009.pdf",
    "gymnasiale-oberstufe|13|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Physik_2022.pdf",
    "gymnasiale-oberstufe|13|politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Politik_2008.pdf",
    "gymnasiale-oberstufe|13|psychologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Psychologie_2009.pdf",
    "gymnasiale-oberstufe|13|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasiale-oberstufe|13|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Russisch_2009.pdf",
    "gymnasiale-oberstufe|13|soziologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/SOZ_GyQ_2009.pdf",
    "gymnasiale-oberstufe|13|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Spanisch_2008.pdf",
    "gymnasiale-oberstufe|13|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Sport_2008.pdf",
    "gymnasiale-oberstufe|13|wirtschaftslehre":
      "https://www.lis.bremen.de/sixcms/media.php/13/GyO_Wirtschaftslehre_2008.pdf",
    "gymnasium|5|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|5|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|5|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|5|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|5|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|5|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|5|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|5|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|5|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|5|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|5|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|5|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|5|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|5|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|5|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|5|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|5|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|5|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|5|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|5|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|5|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|5|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "gymnasium|6|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|6|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|6|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|6|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|6|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|6|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|6|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|6|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|6|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|6|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|6|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|6|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|6|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|6|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|6|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|6|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|6|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|6|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|6|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|6|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|6|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|6|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "gymnasium|7|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|7|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|7|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|7|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|7|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|7|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|7|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|7|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|7|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|7|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|7|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|7|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|7|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|7|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|7|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|7|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|7|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|7|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|7|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|7|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|7|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|7|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "gymnasium|8|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|8|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|8|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|8|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|8|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|8|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|8|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|8|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|8|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|8|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|8|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|8|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|8|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|8|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|8|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|8|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|8|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|8|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|8|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|8|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|8|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|8|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "gymnasium|9|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|9|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|9|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|9|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|9|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|9|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|9|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|9|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|9|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|9|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|9|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|9|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|9|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|9|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|9|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|9|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|9|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|9|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|9|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|9|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|9|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|9|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|9|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|9|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "gymnasium|10|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|10|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|10|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Deutsch_2007.pdf",
    "gymnasium|10|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Englisch_2006.pdf",
    "gymnasium|10|european-studies":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_EuStudies_2007.pdf",
    "gymnasium|10|franzoesisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|10|franzoesisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|10|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Kunst_2006.pdf",
    "gymnasium|10|latein-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_2._Fremdspr_2007.pdf",
    "gymnasium|10|latein-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Latein_3._Fremdspr_2007.14210.pdf",
    "gymnasium|10|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_mathe_gy.pdf",
    "gymnasium|10|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "gymnasium|10|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Musik_2007.pdf",
    "gymnasium|10|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Philosophie_2017.pdf",
    "gymnasium|10|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/06-12-06_nat_gy.pdf",
    "gymnasium|10|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Polnisch_2007.pdf",
    "gymnasium|10|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "gymnasium|10|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Russisch_2007.pdf",
    "gymnasium|10|spanisch-2":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf",
    "gymnasium|10|spanisch-3":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf",
    "gymnasium|10|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Sport_2006.pdf",
    "gymnasium|10|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_Tuerkisch_2007.pdf",
    "gymnasium|10|welt-umweltkunde":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WUK_2006.pdf",
    "gymnasium|10|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/Gy_WAT_2006.pdf",
    "oberschule|5|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|5|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|5|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|5|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|5|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|5|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|5|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|5|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|5|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|5|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|5|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|5|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|5|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|5|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|5|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|5|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|5|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|5|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "oberschule|6|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|6|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|6|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|6|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|6|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|6|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|6|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|6|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|6|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|6|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|6|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|6|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|6|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|6|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|6|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|6|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|6|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|6|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "oberschule|7|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|7|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|7|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|7|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|7|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|7|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|7|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|7|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|7|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|7|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|7|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|7|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|7|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|7|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|7|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|7|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|7|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|7|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "oberschule|8|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|8|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|8|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|8|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|8|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|8|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|8|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|8|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|8|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|8|naturwissenschaften":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|8|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|8|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|8|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|8|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|8|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|8|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|8|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|8|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "oberschule|9|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|9|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|9|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|9|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|9|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|9|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|9|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|9|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|9|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|9|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|9|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|9|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|9|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|9|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|9|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|9|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|9|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|9|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|9|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|9|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "oberschule|10|biologie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|10|chemie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|10|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Deutsch_2010.pdf",
    "oberschule|10|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Englisch_2010.pdf",
    "oberschule|10|franzoesisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|10|gesellschaft-politik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Gesellschaft_Politik_2010.pdf",
    "oberschule|10|kunst":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Kunst_2012.pdf",
    "oberschule|10|latein":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Latein_2012.pdf",
    "oberschule|10|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Mathematik_2010.pdf",
    "oberschule|10|medienbildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2012_Medienbildung.pdf",
    "oberschule|10|musik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Musik_2012.pdf",
    "oberschule|10|philosophie":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Philosophie_2017.pdf",
    "oberschule|10|physik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Naturwiss_2010.pdf",
    "oberschule|10|polnisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Polnisch_2012.pdf",
    "oberschule|10|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "oberschule|10|russisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Russisch_2012.pdf",
    "oberschule|10|spanisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Franz%C3%B6sisch_Spanisch_2012.pdf",
    "oberschule|10|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Sport_2012.pdf",
    "oberschule|10|tuerkisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_Tuerkisch_2012.pdf",
    "oberschule|10|wirtschaft-arbeit-technik":
      "https://www.lis.bremen.de/sixcms/media.php/13/OSch_WAT_2012.pdf",
    "primarstufe|1|aesthetische-bildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20%C3%84sthetische%20Bildung.pdf",
    "primarstufe|1|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sprache.pdf",
    "primarstufe|1|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Englisch_2013.pdf",
    "primarstufe|1|herkunftssprachen":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Herkunftssprachen_2015.pdf",
    "primarstufe|1|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Mathematik.pdf",
    "primarstufe|1|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "primarstufe|1|sachunterricht":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sachbildung%20und%20Sachunterricht.pdf",
    "primarstufe|1|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sport.pdf",
    "primarstufe|2|aesthetische-bildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20%C3%84sthetische%20Bildung.pdf",
    "primarstufe|2|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sprache.pdf",
    "primarstufe|2|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Englisch_2013.pdf",
    "primarstufe|2|herkunftssprachen":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Herkunftssprachen_2015.pdf",
    "primarstufe|2|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Mathematik.pdf",
    "primarstufe|2|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "primarstufe|2|sachunterricht":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sachbildung%20und%20Sachunterricht.pdf",
    "primarstufe|2|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sport.pdf",
    "primarstufe|3|aesthetische-bildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20%C3%84sthetische%20Bildung.pdf",
    "primarstufe|3|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sprache.pdf",
    "primarstufe|3|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Englisch_2013.pdf",
    "primarstufe|3|herkunftssprachen":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Herkunftssprachen_2015.pdf",
    "primarstufe|3|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Mathematik.pdf",
    "primarstufe|3|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "primarstufe|3|sachunterricht":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sachbildung%20und%20Sachunterricht.pdf",
    "primarstufe|3|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sport.pdf",
    "primarstufe|4|aesthetische-bildung":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20%C3%84sthetische%20Bildung.pdf",
    "primarstufe|4|deutsch":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sprache.pdf",
    "primarstufe|4|englisch":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Englisch_2013.pdf",
    "primarstufe|4|herkunftssprachen":
      "https://www.lis.bremen.de/sixcms/media.php/13/Primar_Herkunftssprachen_2015.pdf",
    "primarstufe|4|mathematik":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Mathematik.pdf",
    "primarstufe|4|religion":
      "https://www.lis.bremen.de/sixcms/media.php/13/2014_Religion.pdf",
    "primarstufe|4|sachunterricht":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sachbildung%20und%20Sachunterricht.pdf",
    "primarstufe|4|sport":
      "https://www.lis.bremen.de/sixcms/media.php/13/2025_BP%20Sport.pdf",
  },

  catalogPaths: [
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chinesisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "paedagogik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "politik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "religion" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "soziologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "wirtschaftslehre",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chinesisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "deutsch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "paedagogik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "politik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "religion" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "soziologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "wirtschaftslehre",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chinesisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "deutsch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "franzoesisch",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "paedagogik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "physik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "politik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "psychologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "religion" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "soziologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "wirtschaftslehre",
    },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "5", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "5", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "5", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "5", subject: "religion" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "5", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "6", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "6", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "6", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "6", subject: "religion" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "6", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "7", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "7", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "7", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "7", subject: "religion" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "7", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "8", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "8", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "8", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "8", subject: "religion" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "8", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "9", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "9", subject: "religion" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "9", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "european-studies" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "10", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "medienbildung" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "polnisch" },
    { schoolType: "gymnasium", grade: "10", subject: "religion" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch-2" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "tuerkisch" },
    { schoolType: "gymnasium", grade: "10", subject: "welt-umweltkunde" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "5", subject: "deutsch" },
    { schoolType: "oberschule", grade: "5", subject: "englisch" },
    { schoolType: "oberschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "5", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "5", subject: "kunst" },
    { schoolType: "oberschule", grade: "5", subject: "latein" },
    { schoolType: "oberschule", grade: "5", subject: "mathematik" },
    { schoolType: "oberschule", grade: "5", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "5", subject: "musik" },
    { schoolType: "oberschule", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "oberschule", grade: "5", subject: "philosophie" },
    { schoolType: "oberschule", grade: "5", subject: "polnisch" },
    { schoolType: "oberschule", grade: "5", subject: "religion" },
    { schoolType: "oberschule", grade: "5", subject: "russisch" },
    { schoolType: "oberschule", grade: "5", subject: "spanisch" },
    { schoolType: "oberschule", grade: "5", subject: "sport" },
    { schoolType: "oberschule", grade: "5", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "5",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "6", subject: "deutsch" },
    { schoolType: "oberschule", grade: "6", subject: "englisch" },
    { schoolType: "oberschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "6", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "6", subject: "kunst" },
    { schoolType: "oberschule", grade: "6", subject: "latein" },
    { schoolType: "oberschule", grade: "6", subject: "mathematik" },
    { schoolType: "oberschule", grade: "6", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "6", subject: "musik" },
    { schoolType: "oberschule", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "oberschule", grade: "6", subject: "philosophie" },
    { schoolType: "oberschule", grade: "6", subject: "polnisch" },
    { schoolType: "oberschule", grade: "6", subject: "religion" },
    { schoolType: "oberschule", grade: "6", subject: "russisch" },
    { schoolType: "oberschule", grade: "6", subject: "spanisch" },
    { schoolType: "oberschule", grade: "6", subject: "sport" },
    { schoolType: "oberschule", grade: "6", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "6",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "7", subject: "deutsch" },
    { schoolType: "oberschule", grade: "7", subject: "englisch" },
    { schoolType: "oberschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "7", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "7", subject: "kunst" },
    { schoolType: "oberschule", grade: "7", subject: "latein" },
    { schoolType: "oberschule", grade: "7", subject: "mathematik" },
    { schoolType: "oberschule", grade: "7", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "7", subject: "musik" },
    { schoolType: "oberschule", grade: "7", subject: "naturwissenschaften" },
    { schoolType: "oberschule", grade: "7", subject: "philosophie" },
    { schoolType: "oberschule", grade: "7", subject: "polnisch" },
    { schoolType: "oberschule", grade: "7", subject: "religion" },
    { schoolType: "oberschule", grade: "7", subject: "russisch" },
    { schoolType: "oberschule", grade: "7", subject: "spanisch" },
    { schoolType: "oberschule", grade: "7", subject: "sport" },
    { schoolType: "oberschule", grade: "7", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "7",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "8", subject: "deutsch" },
    { schoolType: "oberschule", grade: "8", subject: "englisch" },
    { schoolType: "oberschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "8", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "8", subject: "kunst" },
    { schoolType: "oberschule", grade: "8", subject: "latein" },
    { schoolType: "oberschule", grade: "8", subject: "mathematik" },
    { schoolType: "oberschule", grade: "8", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "8", subject: "musik" },
    { schoolType: "oberschule", grade: "8", subject: "naturwissenschaften" },
    { schoolType: "oberschule", grade: "8", subject: "philosophie" },
    { schoolType: "oberschule", grade: "8", subject: "polnisch" },
    { schoolType: "oberschule", grade: "8", subject: "religion" },
    { schoolType: "oberschule", grade: "8", subject: "russisch" },
    { schoolType: "oberschule", grade: "8", subject: "spanisch" },
    { schoolType: "oberschule", grade: "8", subject: "sport" },
    { schoolType: "oberschule", grade: "8", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "8",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "9", subject: "biologie" },
    { schoolType: "oberschule", grade: "9", subject: "chemie" },
    { schoolType: "oberschule", grade: "9", subject: "deutsch" },
    { schoolType: "oberschule", grade: "9", subject: "englisch" },
    { schoolType: "oberschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "9", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "9", subject: "kunst" },
    { schoolType: "oberschule", grade: "9", subject: "latein" },
    { schoolType: "oberschule", grade: "9", subject: "mathematik" },
    { schoolType: "oberschule", grade: "9", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "9", subject: "musik" },
    { schoolType: "oberschule", grade: "9", subject: "philosophie" },
    { schoolType: "oberschule", grade: "9", subject: "physik" },
    { schoolType: "oberschule", grade: "9", subject: "polnisch" },
    { schoolType: "oberschule", grade: "9", subject: "religion" },
    { schoolType: "oberschule", grade: "9", subject: "russisch" },
    { schoolType: "oberschule", grade: "9", subject: "spanisch" },
    { schoolType: "oberschule", grade: "9", subject: "sport" },
    { schoolType: "oberschule", grade: "9", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "9",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "oberschule", grade: "10", subject: "biologie" },
    { schoolType: "oberschule", grade: "10", subject: "chemie" },
    { schoolType: "oberschule", grade: "10", subject: "deutsch" },
    { schoolType: "oberschule", grade: "10", subject: "englisch" },
    { schoolType: "oberschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "oberschule", grade: "10", subject: "gesellschaft-politik" },
    { schoolType: "oberschule", grade: "10", subject: "kunst" },
    { schoolType: "oberschule", grade: "10", subject: "latein" },
    { schoolType: "oberschule", grade: "10", subject: "mathematik" },
    { schoolType: "oberschule", grade: "10", subject: "medienbildung" },
    { schoolType: "oberschule", grade: "10", subject: "musik" },
    { schoolType: "oberschule", grade: "10", subject: "philosophie" },
    { schoolType: "oberschule", grade: "10", subject: "physik" },
    { schoolType: "oberschule", grade: "10", subject: "polnisch" },
    { schoolType: "oberschule", grade: "10", subject: "religion" },
    { schoolType: "oberschule", grade: "10", subject: "russisch" },
    { schoolType: "oberschule", grade: "10", subject: "spanisch" },
    { schoolType: "oberschule", grade: "10", subject: "sport" },
    { schoolType: "oberschule", grade: "10", subject: "tuerkisch" },
    {
      schoolType: "oberschule",
      grade: "10",
      subject: "wirtschaft-arbeit-technik",
    },
    { schoolType: "primarstufe", grade: "1", subject: "aesthetische-bildung" },
    { schoolType: "primarstufe", grade: "1", subject: "deutsch" },
    { schoolType: "primarstufe", grade: "1", subject: "englisch" },
    { schoolType: "primarstufe", grade: "1", subject: "herkunftssprachen" },
    { schoolType: "primarstufe", grade: "1", subject: "mathematik" },
    { schoolType: "primarstufe", grade: "1", subject: "religion" },
    { schoolType: "primarstufe", grade: "1", subject: "sachunterricht" },
    { schoolType: "primarstufe", grade: "1", subject: "sport" },
    { schoolType: "primarstufe", grade: "2", subject: "aesthetische-bildung" },
    { schoolType: "primarstufe", grade: "2", subject: "deutsch" },
    { schoolType: "primarstufe", grade: "2", subject: "englisch" },
    { schoolType: "primarstufe", grade: "2", subject: "herkunftssprachen" },
    { schoolType: "primarstufe", grade: "2", subject: "mathematik" },
    { schoolType: "primarstufe", grade: "2", subject: "religion" },
    { schoolType: "primarstufe", grade: "2", subject: "sachunterricht" },
    { schoolType: "primarstufe", grade: "2", subject: "sport" },
    { schoolType: "primarstufe", grade: "3", subject: "aesthetische-bildung" },
    { schoolType: "primarstufe", grade: "3", subject: "deutsch" },
    { schoolType: "primarstufe", grade: "3", subject: "englisch" },
    { schoolType: "primarstufe", grade: "3", subject: "herkunftssprachen" },
    { schoolType: "primarstufe", grade: "3", subject: "mathematik" },
    { schoolType: "primarstufe", grade: "3", subject: "religion" },
    { schoolType: "primarstufe", grade: "3", subject: "sachunterricht" },
    { schoolType: "primarstufe", grade: "3", subject: "sport" },
    { schoolType: "primarstufe", grade: "4", subject: "aesthetische-bildung" },
    { schoolType: "primarstufe", grade: "4", subject: "deutsch" },
    { schoolType: "primarstufe", grade: "4", subject: "englisch" },
    { schoolType: "primarstufe", grade: "4", subject: "herkunftssprachen" },
    { schoolType: "primarstufe", grade: "4", subject: "mathematik" },
    { schoolType: "primarstufe", grade: "4", subject: "religion" },
    { schoolType: "primarstufe", grade: "4", subject: "sachunterricht" },
    { schoolType: "primarstufe", grade: "4", subject: "sport" },
  ],
};
