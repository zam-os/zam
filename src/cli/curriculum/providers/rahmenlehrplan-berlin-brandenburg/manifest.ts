import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BerlinBbCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Berlin-Brandenburg Rahmenlehrplan catalog (RLP Online).
 *
 * Captured 2026-07-20 from
 * https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher
 * Content URLs prefer official Teil C PDFs under fileadmin/…/amtliche_Fassung/
 * and fall back to the RLP-online subject page.
 *
 * The common RLP 1–10 is school-form-agnostic (Niveaus A–H). Catalog school
 * types map grades onto Grundschule (1–6), ISS/Oberschule (7–10) and
 * Gymnasium Sek I (5–10). Gymnasiale Oberstufe (separate Berlin/BB portal
 * section) out of scope for this capture.
 */
export interface RahmenlehrplanBerlinBrandenburgManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: BerlinBbCatalogPath[];
}

export const RAHMENLEHRPLAN_BERLIN_BRANDENBURG_MANIFEST: RahmenlehrplanBerlinBrandenburgManifest =
  {
    schoolYear: "2025/2026",
    capturedOn: "2026-07-20",
    sourceRevision: "RLP Online Berlin-Brandenburg (Teil C, amtliche Fassung)",

    schoolTypes: [
      {
        id: "grundschule",
        label: "Grundschule",
      },
      {
        id: "integrierte-sekundarschule",
        label: "Integrierte Sekundarschule / Oberschule",
      },
      {
        id: "gymnasium",
        label: "Gymnasium (Sek I)",
      },
    ],

    grades: {
      grundschule: ["1", "2", "3", "4", "5", "6"],
      "integrierte-sekundarschule": ["7", "8", "9", "10"],
      gymnasium: ["5", "6", "7", "8", "9", "10"],
    },

    subjects: {
      grundschule: [
        {
          id: "altgriechisch",
          label: "Altgriechisch",
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
          id: "deutsche-gebaerdensprache",
          label: "Deutsche Gebärdensprache",
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
          id: "gesellschaftswissenschaften-5-6",
          label: "Gesellschaftswissenschaften (5/6)",
        },
        {
          id: "hebraeisch",
          label: "Hebräisch",
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
          id: "japanisch",
          label: "Japanisch",
        },
        {
          id: "kunst",
          label: "Kunst",
        },
        {
          id: "ler",
          label: "L-E-R",
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
          id: "naturwissenschaften-5-6",
          label: "Naturwissenschaften (5/6)",
        },
        {
          id: "neugriechisch",
          label: "Neugriechisch",
        },
        {
          id: "polnisch",
          label: "Polnisch",
        },
        {
          id: "portugiesisch",
          label: "Portugiesisch",
        },
        {
          id: "russisch",
          label: "Russisch",
        },
        {
          id: "sachunterricht",
          label: "Sachunterricht",
        },
        {
          id: "sorbisch-wendisch",
          label: "Sorbisch/Wendisch",
        },
        {
          id: "sowi-wiwi",
          label: "Sozialwissenschaften / Wirtschaftswissenschaft",
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
          label: "Theater",
        },
        {
          id: "tuerkisch",
          label: "Türkisch",
        },
        {
          id: "wirtschaft-arbeit-technik",
          label: "Wirtschaft-Arbeit-Technik",
        },
      ],
      "integrierte-sekundarschule": [
        {
          id: "altgriechisch",
          label: "Altgriechisch",
        },
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
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "deutsch",
          label: "Deutsch",
        },
        {
          id: "deutsche-gebaerdensprache",
          label: "Deutsche Gebärdensprache",
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
          id: "geografie",
          label: "Geografie",
        },
        {
          id: "geschichte",
          label: "Geschichte",
        },
        {
          id: "hebraeisch",
          label: "Hebräisch",
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
          id: "japanisch",
          label: "Japanisch",
        },
        {
          id: "kunst",
          label: "Kunst",
        },
        {
          id: "ler",
          label: "L-E-R",
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
          id: "naturwissenschaften-7-10",
          label: "Naturwissenschaften (7–10)",
        },
        {
          id: "neugriechisch",
          label: "Neugriechisch",
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
          id: "politische-bildung",
          label: "Politische Bildung",
        },
        {
          id: "polnisch",
          label: "Polnisch",
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
          id: "russisch",
          label: "Russisch",
        },
        {
          id: "sorbisch-wendisch",
          label: "Sorbisch/Wendisch",
        },
        {
          id: "sowi-wiwi",
          label: "Sozialwissenschaften / Wirtschaftswissenschaft",
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
          label: "Theater",
        },
        {
          id: "tuerkisch",
          label: "Türkisch",
        },
        {
          id: "wirtschaft-arbeit-technik",
          label: "Wirtschaft-Arbeit-Technik",
        },
      ],
      gymnasium: [
        {
          id: "altgriechisch",
          label: "Altgriechisch",
        },
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
          id: "chinesisch",
          label: "Chinesisch",
        },
        {
          id: "deutsch",
          label: "Deutsch",
        },
        {
          id: "deutsche-gebaerdensprache",
          label: "Deutsche Gebärdensprache",
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
          id: "geografie",
          label: "Geografie",
        },
        {
          id: "geschichte",
          label: "Geschichte",
        },
        {
          id: "gesellschaftswissenschaften-5-6",
          label: "Gesellschaftswissenschaften (5/6)",
        },
        {
          id: "hebraeisch",
          label: "Hebräisch",
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
          id: "japanisch",
          label: "Japanisch",
        },
        {
          id: "kunst",
          label: "Kunst",
        },
        {
          id: "ler",
          label: "L-E-R",
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
          id: "naturwissenschaften-5-6",
          label: "Naturwissenschaften (5/6)",
        },
        {
          id: "naturwissenschaften-7-10",
          label: "Naturwissenschaften (7–10)",
        },
        {
          id: "neugriechisch",
          label: "Neugriechisch",
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
          id: "politische-bildung",
          label: "Politische Bildung",
        },
        {
          id: "polnisch",
          label: "Polnisch",
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
          id: "russisch",
          label: "Russisch",
        },
        {
          id: "sorbisch-wendisch",
          label: "Sorbisch/Wendisch",
        },
        {
          id: "sowi-wiwi",
          label: "Sozialwissenschaften / Wirtschaftswissenschaft",
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
          label: "Theater",
        },
        {
          id: "tuerkisch",
          label: "Türkisch",
        },
        {
          id: "wirtschaft-arbeit-technik",
          label: "Wirtschaft-Arbeit-Technik",
        },
      ],
    },

    tracks: {},

    topics: {
      "grundschule|1|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|1|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "grundschule|1|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|hebraeisch": [
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
      "grundschule|1|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|1|ler": [
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
      "grundschule|1|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|sachunterricht": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|1|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|1|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|1|spanisch": [
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
      "grundschule|1|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|1|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|2|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "grundschule|2|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|hebraeisch": [
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
      "grundschule|2|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|2|ler": [
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
      "grundschule|2|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|sachunterricht": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|2|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|2|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|2|spanisch": [
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
      "grundschule|2|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|2|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|3|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "grundschule|3|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|hebraeisch": [
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
      "grundschule|3|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|3|ler": [
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
      "grundschule|3|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|sachunterricht": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|3|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|3|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|3|spanisch": [
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
      "grundschule|3|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|3|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|4|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "grundschule|4|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|hebraeisch": [
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
      "grundschule|4|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|4|ler": [
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
      "grundschule|4|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|sachunterricht": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|4|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|4|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|4|spanisch": [
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
      "grundschule|4|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|4|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|5|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|gesellschaftswissenschaften-5-6": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Größen und Messen" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "grundschule|5|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|naturwissenschaften-5-6": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|5|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|5|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|5|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "grundschule|6|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|gesellschaftswissenschaften-5-6": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|mathematik": [
        { id: "zahlen-operationen", label: "Zahlen und Operationen" },
        { id: "raum-form", label: "Raum und Form" },
        { id: "groessen-messen", label: "Größen und Messen" },
        { id: "daten-zufall", label: "Daten und Zufall" },
      ],
      "grundschule|6|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|naturwissenschaften-5-6": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "grundschule|6|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "grundschule|6|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "grundschule|6|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|10|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|10|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|10|hebraeisch": [
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
      "gymnasium|10|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|10|ler": [
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
      "gymnasium|10|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|10|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|10|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|10|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|psychologie": [
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
      "gymnasium|10|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|sowi-wiwi": [
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
      "gymnasium|10|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|10|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|5|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|5|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|5|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|gesellschaftswissenschaften-5-6": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|5|hebraeisch": [
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
      "gymnasium|5|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|5|ler": [
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
      "gymnasium|5|naturwissenschaften-5-6": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|5|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|5|sowi-wiwi": [
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
      "gymnasium|5|theater": [
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
      "gymnasium|5|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|6|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|6|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|6|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|gesellschaftswissenschaften-5-6": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|6|hebraeisch": [
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
      "gymnasium|6|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|6|ler": [
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
      "gymnasium|6|naturwissenschaften-5-6": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|6|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|6|sowi-wiwi": [
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
      "gymnasium|6|theater": [
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
      "gymnasium|6|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|7|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|7|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|7|hebraeisch": [
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
      "gymnasium|7|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|7|ler": [
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
      "gymnasium|7|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|7|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|7|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|7|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|psychologie": [
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
      "gymnasium|7|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|sowi-wiwi": [
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
      "gymnasium|7|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|7|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|8|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|8|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|8|hebraeisch": [
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
      "gymnasium|8|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|8|ler": [
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
      "gymnasium|8|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|8|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|8|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|8|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|psychologie": [
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
      "gymnasium|8|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|sowi-wiwi": [
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
      "gymnasium|8|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|8|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|9|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|9|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|9|hebraeisch": [
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
      "gymnasium|9|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|9|ler": [
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
      "gymnasium|9|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "gymnasium|9|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      "gymnasium|9|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "gymnasium|9|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|psychologie": [
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
      "gymnasium|9|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|sowi-wiwi": [
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
      "gymnasium|9|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "gymnasium|9|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|astronomie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|10|biologie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|10|chemie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|10|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-sekundarschule|10|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|geografie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|mathematik": [
        { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
        { id: "funktionen", label: "Funktionen" },
        { id: "geometrie", label: "Geometrie" },
        { id: "stochastik", label: "Stochastik" },
      ],
      "integrierte-sekundarschule|10|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|10|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|philosophie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|physik": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|10|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|psychologie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|10|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|astronomie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|7|biologie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|7|chemie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|7|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-sekundarschule|7|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|geografie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|mathematik": [
        { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
        { id: "funktionen", label: "Funktionen" },
        { id: "geometrie", label: "Geometrie" },
        { id: "stochastik", label: "Stochastik" },
      ],
      "integrierte-sekundarschule|7|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|7|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|philosophie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|physik": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|7|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|psychologie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|7|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|astronomie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|8|biologie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|8|chemie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|8|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-sekundarschule|8|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|geografie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|mathematik": [
        { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
        { id: "funktionen", label: "Funktionen" },
        { id: "geometrie", label: "Geometrie" },
        { id: "stochastik", label: "Stochastik" },
      ],
      "integrierte-sekundarschule|8|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|8|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|philosophie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|physik": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|8|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|psychologie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|8|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|altgriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|astronomie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|9|biologie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|9|chemie": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|9|chinesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|deutsch": [
        { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
        { id: "schreiben", label: "Schreiben" },
        { id: "lesen", label: "Lesen" },
        { id: "sprache", label: "Sprache und Sprachgebrauch" },
      ],
      "integrierte-sekundarschule|9|deutsche-gebaerdensprache": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|englisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|ethik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|franzoesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|geografie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|geschichte": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|hebraeisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|informatik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|italienisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|japanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|kunst": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|latein": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|ler": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|mathematik": [
        { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
        { id: "funktionen", label: "Funktionen" },
        { id: "geometrie", label: "Geometrie" },
        { id: "stochastik", label: "Stochastik" },
      ],
      "integrierte-sekundarschule|9|musik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|naturwissenschaften-7-10": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|9|neugriechisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|philosophie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|physik": [
        { id: "fachwissen", label: "Fachwissen" },
        { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
        { id: "kommunikation", label: "Kommunikation" },
        { id: "bewertung", label: "Bewertung" },
      ],
      "integrierte-sekundarschule|9|politische-bildung": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|polnisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|portugiesisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|psychologie": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|russisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|sorbisch-wendisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|sowi-wiwi": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|spanisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|sport": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|theater": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|tuerkisch": [
        { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
        {
          id: "interkulturelle-kompetenzen",
          label: "Interkulturelle Kompetenzen",
        },
        { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      ],
      "integrierte-sekundarschule|9|wirtschaft-arbeit-technik": [
        { id: "kompetenzen", label: "Kompetenzen und Standards" },
        { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
        { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
      ],
    },

    contentUrls: {
      "grundschule|1|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|1|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|1|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|1|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|1|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|1|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|1|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|1|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|1|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|1|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|sachunterricht":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sachunterricht_2015_11_16.pdf",
      "grundschule|1|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|1|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|1|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|1|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|1|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|2|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|2|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|2|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|2|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|2|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|2|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|2|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|2|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|2|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|sachunterricht":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sachunterricht_2015_11_16.pdf",
      "grundschule|2|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|2|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|2|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|2|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|2|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|3|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|3|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|3|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|3|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|3|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|3|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|3|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|3|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|3|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|sachunterricht":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sachunterricht_2015_11_16.pdf",
      "grundschule|3|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|3|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|3|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|3|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|3|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|4|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|4|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|4|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|4|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|4|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|4|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|4|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|4|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|4|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|sachunterricht":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sachunterricht_2015_11_16.pdf",
      "grundschule|4|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|4|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|4|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|4|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|4|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|5|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|5|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|5|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|5|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|gesellschaftswissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Gesellschaftswissenschaften_2015_11_10.pdf",
      "grundschule|5|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|5|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|5|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "grundschule|5|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|5|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|5|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|5|naturwissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_5-6_2015_11_16.pdf",
      "grundschule|5|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|5|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|5|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|5|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|5|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "grundschule|6|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "grundschule|6|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "grundschule|6|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "grundschule|6|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "grundschule|6|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|gesellschaftswissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Gesellschaftswissenschaften_2015_11_10.pdf",
      "grundschule|6|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "grundschule|6|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "grundschule|6|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "grundschule|6|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "grundschule|6|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "grundschule|6|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "grundschule|6|naturwissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_5-6_2015_11_16.pdf",
      "grundschule|6|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "grundschule|6|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "grundschule|6|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "grundschule|6|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "grundschule|6|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|10|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|10|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "gymnasium|10|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "gymnasium|10|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "gymnasium|10|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|10|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|10|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|10|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "gymnasium|10|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "gymnasium|10|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|10|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|10|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|10|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|10|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|10|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|10|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "gymnasium|10|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "gymnasium|10|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "gymnasium|10|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "gymnasium|10|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "gymnasium|10|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|10|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|10|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|10|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|10|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|5|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|5|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|5|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|5|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|5|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|gesellschaftswissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Gesellschaftswissenschaften_2015_11_10.pdf",
      "gymnasium|5|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|5|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|5|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|5|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|5|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|5|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|5|naturwissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_5-6_2015_11_16.pdf",
      "gymnasium|5|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|5|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|5|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|5|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|5|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|6|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|6|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|6|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|6|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|6|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|gesellschaftswissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Gesellschaftswissenschaften_2015_11_10.pdf",
      "gymnasium|6|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|6|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|6|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|6|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|6|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|6|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|6|naturwissenschaften-5-6":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_5-6_2015_11_16.pdf",
      "gymnasium|6|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|6|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|6|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|6|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|6|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|7|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|7|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "gymnasium|7|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "gymnasium|7|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "gymnasium|7|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|7|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|7|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|7|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "gymnasium|7|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "gymnasium|7|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|7|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|7|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|7|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|7|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|7|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|7|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "gymnasium|7|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "gymnasium|7|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "gymnasium|7|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "gymnasium|7|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "gymnasium|7|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|7|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|7|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|7|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|7|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|8|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|8|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "gymnasium|8|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "gymnasium|8|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "gymnasium|8|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|8|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|8|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|8|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "gymnasium|8|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "gymnasium|8|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|8|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|8|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|8|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|8|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|8|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|8|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "gymnasium|8|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "gymnasium|8|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "gymnasium|8|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "gymnasium|8|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "gymnasium|8|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|8|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|8|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|8|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|8|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "gymnasium|9|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "gymnasium|9|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "gymnasium|9|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "gymnasium|9|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "gymnasium|9|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "gymnasium|9|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "gymnasium|9|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "gymnasium|9|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "gymnasium|9|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "gymnasium|9|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "gymnasium|9|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "gymnasium|9|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "gymnasium|9|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "gymnasium|9|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "gymnasium|9|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "gymnasium|9|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "gymnasium|9|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "gymnasium|9|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "gymnasium|9|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "gymnasium|9|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "gymnasium|9|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "gymnasium|9|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "gymnasium|9|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "gymnasium|9|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "gymnasium|9|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "integrierte-sekundarschule|10|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "integrierte-sekundarschule|10|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "integrierte-sekundarschule|10|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "integrierte-sekundarschule|10|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "integrierte-sekundarschule|10|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "integrierte-sekundarschule|10|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "integrierte-sekundarschule|10|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "integrierte-sekundarschule|10|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "integrierte-sekundarschule|10|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "integrierte-sekundarschule|10|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "integrierte-sekundarschule|10|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "integrierte-sekundarschule|10|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "integrierte-sekundarschule|10|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "integrierte-sekundarschule|10|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "integrierte-sekundarschule|10|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "integrierte-sekundarschule|10|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "integrierte-sekundarschule|10|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "integrierte-sekundarschule|10|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "integrierte-sekundarschule|10|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "integrierte-sekundarschule|10|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "integrierte-sekundarschule|10|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "integrierte-sekundarschule|10|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "integrierte-sekundarschule|10|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "integrierte-sekundarschule|10|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|10|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "integrierte-sekundarschule|7|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "integrierte-sekundarschule|7|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "integrierte-sekundarschule|7|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "integrierte-sekundarschule|7|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "integrierte-sekundarschule|7|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "integrierte-sekundarschule|7|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "integrierte-sekundarschule|7|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "integrierte-sekundarschule|7|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "integrierte-sekundarschule|7|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "integrierte-sekundarschule|7|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "integrierte-sekundarschule|7|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "integrierte-sekundarschule|7|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "integrierte-sekundarschule|7|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "integrierte-sekundarschule|7|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "integrierte-sekundarschule|7|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "integrierte-sekundarschule|7|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "integrierte-sekundarschule|7|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "integrierte-sekundarschule|7|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "integrierte-sekundarschule|7|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "integrierte-sekundarschule|7|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "integrierte-sekundarschule|7|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "integrierte-sekundarschule|7|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "integrierte-sekundarschule|7|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "integrierte-sekundarschule|7|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|7|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "integrierte-sekundarschule|8|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "integrierte-sekundarschule|8|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "integrierte-sekundarschule|8|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "integrierte-sekundarschule|8|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "integrierte-sekundarschule|8|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "integrierte-sekundarschule|8|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "integrierte-sekundarschule|8|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "integrierte-sekundarschule|8|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "integrierte-sekundarschule|8|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "integrierte-sekundarschule|8|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "integrierte-sekundarschule|8|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "integrierte-sekundarschule|8|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "integrierte-sekundarschule|8|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "integrierte-sekundarschule|8|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "integrierte-sekundarschule|8|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "integrierte-sekundarschule|8|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "integrierte-sekundarschule|8|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "integrierte-sekundarschule|8|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "integrierte-sekundarschule|8|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "integrierte-sekundarschule|8|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "integrierte-sekundarschule|8|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "integrierte-sekundarschule|8|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "integrierte-sekundarschule|8|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "integrierte-sekundarschule|8|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|8|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
      "integrierte-sekundarschule|9|altgriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Altgriechisch_2015_11_10.pdf",
      "integrierte-sekundarschule|9|astronomie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Astronomie_2015_11_10.pdf",
      "integrierte-sekundarschule|9|biologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Biologie_2015_11_10.pdf",
      "integrierte-sekundarschule|9|chemie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf",
      "integrierte-sekundarschule|9|chinesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|deutsch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Deutsch_2015_11_10.pdf",
      "integrierte-sekundarschule|9|deutsche-gebaerdensprache":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_DGS_2015_11_16.pdf",
      "integrierte-sekundarschule|9|englisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|ethik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Ethik_2015_11_10.pdf",
      "integrierte-sekundarschule|9|franzoesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|geografie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geografie_2015_11_10.pdf",
      "integrierte-sekundarschule|9|geschichte":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Geschichte_2015_11_10.pdf",
      "integrierte-sekundarschule|9|hebraeisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|informatik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Informatik_2015_11_10.pdf",
      "integrierte-sekundarschule|9|italienisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|japanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|kunst":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Kunst_2015_11_10.pdf",
      "integrierte-sekundarschule|9|latein":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Latein_2015_11_10.pdf",
      "integrierte-sekundarschule|9|ler":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_L-E-R_2015_11_10.pdf",
      "integrierte-sekundarschule|9|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mathematik_2015_11_10.pdf",
      "integrierte-sekundarschule|9|musik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Musik_2015_11_16.pdf",
      "integrierte-sekundarschule|9|naturwissenschaften-7-10":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Nawi_7-10_2015_11_16.pdf",
      "integrierte-sekundarschule|9|neugriechisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|philosophie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Philosophie_2015_11_16.pdf",
      "integrierte-sekundarschule|9|physik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Physik_2015_11_16.pdf",
      "integrierte-sekundarschule|9|politische-bildung":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Politische_Bildung_2015_11_16.pdf",
      "integrierte-sekundarschule|9|polnisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|portugiesisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|psychologie":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Psychologie_2015_11_10.pdf",
      "integrierte-sekundarschule|9|russisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|sorbisch-wendisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|sowi-wiwi":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sowi_Wiwi_2015_11_16.pdf",
      "integrierte-sekundarschule|9|spanisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|sport":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Sport_2015_11_16.pdf",
      "integrierte-sekundarschule|9|theater":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Theater_2015_11_10.pdf",
      "integrierte-sekundarschule|9|tuerkisch":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_Mod_Fremdsprachen_2015_11_16.pdf",
      "integrierte-sekundarschule|9|wirtschaft-arbeit-technik":
        "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/amtliche_Fassung/Teil_C_WAT_2015_11_10.pdf",
    },

    catalogPaths: [
      { schoolType: "grundschule", grade: "1", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "1", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "1", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "1",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "1", subject: "englisch" },
      { schoolType: "grundschule", grade: "1", subject: "ethik" },
      { schoolType: "grundschule", grade: "1", subject: "franzoesisch" },
      { schoolType: "grundschule", grade: "1", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "1", subject: "informatik" },
      { schoolType: "grundschule", grade: "1", subject: "italienisch" },
      { schoolType: "grundschule", grade: "1", subject: "japanisch" },
      { schoolType: "grundschule", grade: "1", subject: "kunst" },
      { schoolType: "grundschule", grade: "1", subject: "ler" },
      { schoolType: "grundschule", grade: "1", subject: "mathematik" },
      { schoolType: "grundschule", grade: "1", subject: "musik" },
      { schoolType: "grundschule", grade: "1", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "1", subject: "polnisch" },
      { schoolType: "grundschule", grade: "1", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "1", subject: "russisch" },
      { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "1", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "1", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "1", subject: "spanisch" },
      { schoolType: "grundschule", grade: "1", subject: "sport" },
      { schoolType: "grundschule", grade: "1", subject: "theater" },
      { schoolType: "grundschule", grade: "1", subject: "tuerkisch" },
      { schoolType: "grundschule", grade: "2", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "2", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "2", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "2",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "2", subject: "englisch" },
      { schoolType: "grundschule", grade: "2", subject: "ethik" },
      { schoolType: "grundschule", grade: "2", subject: "franzoesisch" },
      { schoolType: "grundschule", grade: "2", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "2", subject: "informatik" },
      { schoolType: "grundschule", grade: "2", subject: "italienisch" },
      { schoolType: "grundschule", grade: "2", subject: "japanisch" },
      { schoolType: "grundschule", grade: "2", subject: "kunst" },
      { schoolType: "grundschule", grade: "2", subject: "ler" },
      { schoolType: "grundschule", grade: "2", subject: "mathematik" },
      { schoolType: "grundschule", grade: "2", subject: "musik" },
      { schoolType: "grundschule", grade: "2", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "2", subject: "polnisch" },
      { schoolType: "grundschule", grade: "2", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "2", subject: "russisch" },
      { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "2", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "2", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "2", subject: "spanisch" },
      { schoolType: "grundschule", grade: "2", subject: "sport" },
      { schoolType: "grundschule", grade: "2", subject: "theater" },
      { schoolType: "grundschule", grade: "2", subject: "tuerkisch" },
      { schoolType: "grundschule", grade: "3", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "3", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "3", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "3",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "3", subject: "englisch" },
      { schoolType: "grundschule", grade: "3", subject: "ethik" },
      { schoolType: "grundschule", grade: "3", subject: "franzoesisch" },
      { schoolType: "grundschule", grade: "3", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "3", subject: "informatik" },
      { schoolType: "grundschule", grade: "3", subject: "italienisch" },
      { schoolType: "grundschule", grade: "3", subject: "japanisch" },
      { schoolType: "grundschule", grade: "3", subject: "kunst" },
      { schoolType: "grundschule", grade: "3", subject: "ler" },
      { schoolType: "grundschule", grade: "3", subject: "mathematik" },
      { schoolType: "grundschule", grade: "3", subject: "musik" },
      { schoolType: "grundschule", grade: "3", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "3", subject: "polnisch" },
      { schoolType: "grundschule", grade: "3", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "3", subject: "russisch" },
      { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "3", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "3", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "3", subject: "spanisch" },
      { schoolType: "grundschule", grade: "3", subject: "sport" },
      { schoolType: "grundschule", grade: "3", subject: "theater" },
      { schoolType: "grundschule", grade: "3", subject: "tuerkisch" },
      { schoolType: "grundschule", grade: "4", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "4", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "4", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "4",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "4", subject: "englisch" },
      { schoolType: "grundschule", grade: "4", subject: "ethik" },
      { schoolType: "grundschule", grade: "4", subject: "franzoesisch" },
      { schoolType: "grundschule", grade: "4", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "4", subject: "informatik" },
      { schoolType: "grundschule", grade: "4", subject: "italienisch" },
      { schoolType: "grundschule", grade: "4", subject: "japanisch" },
      { schoolType: "grundschule", grade: "4", subject: "kunst" },
      { schoolType: "grundschule", grade: "4", subject: "ler" },
      { schoolType: "grundschule", grade: "4", subject: "mathematik" },
      { schoolType: "grundschule", grade: "4", subject: "musik" },
      { schoolType: "grundschule", grade: "4", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "4", subject: "polnisch" },
      { schoolType: "grundschule", grade: "4", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "4", subject: "russisch" },
      { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
      { schoolType: "grundschule", grade: "4", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "4", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "4", subject: "spanisch" },
      { schoolType: "grundschule", grade: "4", subject: "sport" },
      { schoolType: "grundschule", grade: "4", subject: "theater" },
      { schoolType: "grundschule", grade: "4", subject: "tuerkisch" },
      { schoolType: "grundschule", grade: "5", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "5", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "5", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "5",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "5", subject: "englisch" },
      { schoolType: "grundschule", grade: "5", subject: "ethik" },
      { schoolType: "grundschule", grade: "5", subject: "franzoesisch" },
      {
        schoolType: "grundschule",
        grade: "5",
        subject: "gesellschaftswissenschaften-5-6",
      },
      { schoolType: "grundschule", grade: "5", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "5", subject: "informatik" },
      { schoolType: "grundschule", grade: "5", subject: "italienisch" },
      { schoolType: "grundschule", grade: "5", subject: "japanisch" },
      { schoolType: "grundschule", grade: "5", subject: "kunst" },
      { schoolType: "grundschule", grade: "5", subject: "latein" },
      { schoolType: "grundschule", grade: "5", subject: "ler" },
      { schoolType: "grundschule", grade: "5", subject: "mathematik" },
      { schoolType: "grundschule", grade: "5", subject: "musik" },
      {
        schoolType: "grundschule",
        grade: "5",
        subject: "naturwissenschaften-5-6",
      },
      { schoolType: "grundschule", grade: "5", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "5", subject: "polnisch" },
      { schoolType: "grundschule", grade: "5", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "5", subject: "russisch" },
      { schoolType: "grundschule", grade: "5", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "5", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "5", subject: "spanisch" },
      { schoolType: "grundschule", grade: "5", subject: "sport" },
      { schoolType: "grundschule", grade: "5", subject: "theater" },
      { schoolType: "grundschule", grade: "5", subject: "tuerkisch" },
      {
        schoolType: "grundschule",
        grade: "5",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "grundschule", grade: "6", subject: "altgriechisch" },
      { schoolType: "grundschule", grade: "6", subject: "chinesisch" },
      { schoolType: "grundschule", grade: "6", subject: "deutsch" },
      {
        schoolType: "grundschule",
        grade: "6",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "grundschule", grade: "6", subject: "englisch" },
      { schoolType: "grundschule", grade: "6", subject: "ethik" },
      { schoolType: "grundschule", grade: "6", subject: "franzoesisch" },
      {
        schoolType: "grundschule",
        grade: "6",
        subject: "gesellschaftswissenschaften-5-6",
      },
      { schoolType: "grundschule", grade: "6", subject: "hebraeisch" },
      { schoolType: "grundschule", grade: "6", subject: "informatik" },
      { schoolType: "grundschule", grade: "6", subject: "italienisch" },
      { schoolType: "grundschule", grade: "6", subject: "japanisch" },
      { schoolType: "grundschule", grade: "6", subject: "kunst" },
      { schoolType: "grundschule", grade: "6", subject: "latein" },
      { schoolType: "grundschule", grade: "6", subject: "ler" },
      { schoolType: "grundschule", grade: "6", subject: "mathematik" },
      { schoolType: "grundschule", grade: "6", subject: "musik" },
      {
        schoolType: "grundschule",
        grade: "6",
        subject: "naturwissenschaften-5-6",
      },
      { schoolType: "grundschule", grade: "6", subject: "neugriechisch" },
      { schoolType: "grundschule", grade: "6", subject: "polnisch" },
      { schoolType: "grundschule", grade: "6", subject: "portugiesisch" },
      { schoolType: "grundschule", grade: "6", subject: "russisch" },
      { schoolType: "grundschule", grade: "6", subject: "sorbisch-wendisch" },
      { schoolType: "grundschule", grade: "6", subject: "sowi-wiwi" },
      { schoolType: "grundschule", grade: "6", subject: "spanisch" },
      { schoolType: "grundschule", grade: "6", subject: "sport" },
      { schoolType: "grundschule", grade: "6", subject: "theater" },
      { schoolType: "grundschule", grade: "6", subject: "tuerkisch" },
      {
        schoolType: "grundschule",
        grade: "6",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "10", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "10", subject: "astronomie" },
      { schoolType: "gymnasium", grade: "10", subject: "biologie" },
      { schoolType: "gymnasium", grade: "10", subject: "chemie" },
      { schoolType: "gymnasium", grade: "10", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "10",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "10", subject: "englisch" },
      { schoolType: "gymnasium", grade: "10", subject: "ethik" },
      { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "10", subject: "geografie" },
      { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "10", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "10", subject: "informatik" },
      { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "10", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "10", subject: "kunst" },
      { schoolType: "gymnasium", grade: "10", subject: "latein" },
      { schoolType: "gymnasium", grade: "10", subject: "ler" },
      { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "10", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "10",
        subject: "naturwissenschaften-7-10",
      },
      { schoolType: "gymnasium", grade: "10", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
      { schoolType: "gymnasium", grade: "10", subject: "physik" },
      { schoolType: "gymnasium", grade: "10", subject: "politische-bildung" },
      { schoolType: "gymnasium", grade: "10", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "10", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "10", subject: "psychologie" },
      { schoolType: "gymnasium", grade: "10", subject: "russisch" },
      { schoolType: "gymnasium", grade: "10", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "10", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "10", subject: "sport" },
      { schoolType: "gymnasium", grade: "10", subject: "theater" },
      { schoolType: "gymnasium", grade: "10", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "10",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "5", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "5", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "5",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "5", subject: "englisch" },
      { schoolType: "gymnasium", grade: "5", subject: "ethik" },
      { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
      {
        schoolType: "gymnasium",
        grade: "5",
        subject: "gesellschaftswissenschaften-5-6",
      },
      { schoolType: "gymnasium", grade: "5", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "5", subject: "informatik" },
      { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "5", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "5", subject: "kunst" },
      { schoolType: "gymnasium", grade: "5", subject: "latein" },
      { schoolType: "gymnasium", grade: "5", subject: "ler" },
      { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "5", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "5",
        subject: "naturwissenschaften-5-6",
      },
      { schoolType: "gymnasium", grade: "5", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "5", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "5", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "5", subject: "russisch" },
      { schoolType: "gymnasium", grade: "5", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "5", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "5", subject: "sport" },
      { schoolType: "gymnasium", grade: "5", subject: "theater" },
      { schoolType: "gymnasium", grade: "5", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "5",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "6", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "6", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "6",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "6", subject: "englisch" },
      { schoolType: "gymnasium", grade: "6", subject: "ethik" },
      { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
      {
        schoolType: "gymnasium",
        grade: "6",
        subject: "gesellschaftswissenschaften-5-6",
      },
      { schoolType: "gymnasium", grade: "6", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "6", subject: "informatik" },
      { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "6", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "6", subject: "kunst" },
      { schoolType: "gymnasium", grade: "6", subject: "latein" },
      { schoolType: "gymnasium", grade: "6", subject: "ler" },
      { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "6", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "6",
        subject: "naturwissenschaften-5-6",
      },
      { schoolType: "gymnasium", grade: "6", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "6", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "6", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "6", subject: "russisch" },
      { schoolType: "gymnasium", grade: "6", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "6", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "6", subject: "sport" },
      { schoolType: "gymnasium", grade: "6", subject: "theater" },
      { schoolType: "gymnasium", grade: "6", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "6",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "7", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "7", subject: "astronomie" },
      { schoolType: "gymnasium", grade: "7", subject: "biologie" },
      { schoolType: "gymnasium", grade: "7", subject: "chemie" },
      { schoolType: "gymnasium", grade: "7", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "7",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "7", subject: "englisch" },
      { schoolType: "gymnasium", grade: "7", subject: "ethik" },
      { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "7", subject: "geografie" },
      { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "7", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "7", subject: "informatik" },
      { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "7", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "7", subject: "kunst" },
      { schoolType: "gymnasium", grade: "7", subject: "latein" },
      { schoolType: "gymnasium", grade: "7", subject: "ler" },
      { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "7", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "7",
        subject: "naturwissenschaften-7-10",
      },
      { schoolType: "gymnasium", grade: "7", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "7", subject: "philosophie" },
      { schoolType: "gymnasium", grade: "7", subject: "physik" },
      { schoolType: "gymnasium", grade: "7", subject: "politische-bildung" },
      { schoolType: "gymnasium", grade: "7", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "7", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "7", subject: "psychologie" },
      { schoolType: "gymnasium", grade: "7", subject: "russisch" },
      { schoolType: "gymnasium", grade: "7", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "7", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "7", subject: "sport" },
      { schoolType: "gymnasium", grade: "7", subject: "theater" },
      { schoolType: "gymnasium", grade: "7", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "7",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "8", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "8", subject: "astronomie" },
      { schoolType: "gymnasium", grade: "8", subject: "biologie" },
      { schoolType: "gymnasium", grade: "8", subject: "chemie" },
      { schoolType: "gymnasium", grade: "8", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "8",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "8", subject: "englisch" },
      { schoolType: "gymnasium", grade: "8", subject: "ethik" },
      { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "8", subject: "geografie" },
      { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "8", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "8", subject: "informatik" },
      { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "8", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "8", subject: "kunst" },
      { schoolType: "gymnasium", grade: "8", subject: "latein" },
      { schoolType: "gymnasium", grade: "8", subject: "ler" },
      { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "8", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "8",
        subject: "naturwissenschaften-7-10",
      },
      { schoolType: "gymnasium", grade: "8", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "8", subject: "philosophie" },
      { schoolType: "gymnasium", grade: "8", subject: "physik" },
      { schoolType: "gymnasium", grade: "8", subject: "politische-bildung" },
      { schoolType: "gymnasium", grade: "8", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "8", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "8", subject: "psychologie" },
      { schoolType: "gymnasium", grade: "8", subject: "russisch" },
      { schoolType: "gymnasium", grade: "8", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "8", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "8", subject: "sport" },
      { schoolType: "gymnasium", grade: "8", subject: "theater" },
      { schoolType: "gymnasium", grade: "8", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "8",
        subject: "wirtschaft-arbeit-technik",
      },
      { schoolType: "gymnasium", grade: "9", subject: "altgriechisch" },
      { schoolType: "gymnasium", grade: "9", subject: "astronomie" },
      { schoolType: "gymnasium", grade: "9", subject: "biologie" },
      { schoolType: "gymnasium", grade: "9", subject: "chemie" },
      { schoolType: "gymnasium", grade: "9", subject: "chinesisch" },
      { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
      {
        schoolType: "gymnasium",
        grade: "9",
        subject: "deutsche-gebaerdensprache",
      },
      { schoolType: "gymnasium", grade: "9", subject: "englisch" },
      { schoolType: "gymnasium", grade: "9", subject: "ethik" },
      { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
      { schoolType: "gymnasium", grade: "9", subject: "geografie" },
      { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
      { schoolType: "gymnasium", grade: "9", subject: "hebraeisch" },
      { schoolType: "gymnasium", grade: "9", subject: "informatik" },
      { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
      { schoolType: "gymnasium", grade: "9", subject: "japanisch" },
      { schoolType: "gymnasium", grade: "9", subject: "kunst" },
      { schoolType: "gymnasium", grade: "9", subject: "latein" },
      { schoolType: "gymnasium", grade: "9", subject: "ler" },
      { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
      { schoolType: "gymnasium", grade: "9", subject: "musik" },
      {
        schoolType: "gymnasium",
        grade: "9",
        subject: "naturwissenschaften-7-10",
      },
      { schoolType: "gymnasium", grade: "9", subject: "neugriechisch" },
      { schoolType: "gymnasium", grade: "9", subject: "philosophie" },
      { schoolType: "gymnasium", grade: "9", subject: "physik" },
      { schoolType: "gymnasium", grade: "9", subject: "politische-bildung" },
      { schoolType: "gymnasium", grade: "9", subject: "polnisch" },
      { schoolType: "gymnasium", grade: "9", subject: "portugiesisch" },
      { schoolType: "gymnasium", grade: "9", subject: "psychologie" },
      { schoolType: "gymnasium", grade: "9", subject: "russisch" },
      { schoolType: "gymnasium", grade: "9", subject: "sorbisch-wendisch" },
      { schoolType: "gymnasium", grade: "9", subject: "sowi-wiwi" },
      { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
      { schoolType: "gymnasium", grade: "9", subject: "sport" },
      { schoolType: "gymnasium", grade: "9", subject: "theater" },
      { schoolType: "gymnasium", grade: "9", subject: "tuerkisch" },
      {
        schoolType: "gymnasium",
        grade: "9",
        subject: "wirtschaft-arbeit-technik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "altgriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "astronomie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "biologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "chemie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "deutsche-gebaerdensprache",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "ethik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "geografie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "geschichte",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "hebraeisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "informatik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "italienisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "japanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "kunst",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "latein",
      },
      { schoolType: "integrierte-sekundarschule", grade: "10", subject: "ler" },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "mathematik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "musik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "naturwissenschaften-7-10",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "neugriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "philosophie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "physik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "politische-bildung",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "polnisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "portugiesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "psychologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "sorbisch-wendisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "sowi-wiwi",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "sport",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "theater",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "tuerkisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "10",
        subject: "wirtschaft-arbeit-technik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "altgriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "astronomie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "biologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "chemie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "deutsche-gebaerdensprache",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "ethik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "geografie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "geschichte",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "hebraeisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "informatik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "italienisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "japanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "kunst",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "latein",
      },
      { schoolType: "integrierte-sekundarschule", grade: "7", subject: "ler" },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "mathematik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "musik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "naturwissenschaften-7-10",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "neugriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "philosophie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "physik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "politische-bildung",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "polnisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "portugiesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "psychologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "sorbisch-wendisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "sowi-wiwi",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "sport",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "theater",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "tuerkisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "7",
        subject: "wirtschaft-arbeit-technik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "altgriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "astronomie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "biologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "chemie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "deutsche-gebaerdensprache",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "ethik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "geografie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "geschichte",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "hebraeisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "informatik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "italienisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "japanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "kunst",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "latein",
      },
      { schoolType: "integrierte-sekundarschule", grade: "8", subject: "ler" },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "mathematik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "musik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "naturwissenschaften-7-10",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "neugriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "philosophie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "physik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "politische-bildung",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "polnisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "portugiesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "psychologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "sorbisch-wendisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "sowi-wiwi",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "sport",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "theater",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "tuerkisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "8",
        subject: "wirtschaft-arbeit-technik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "altgriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "astronomie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "biologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "chemie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "chinesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "deutsch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "deutsche-gebaerdensprache",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "englisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "ethik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "franzoesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "geografie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "geschichte",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "hebraeisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "informatik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "italienisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "japanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "kunst",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "latein",
      },
      { schoolType: "integrierte-sekundarschule", grade: "9", subject: "ler" },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "mathematik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "musik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "naturwissenschaften-7-10",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "neugriechisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "philosophie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "physik",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "politische-bildung",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "polnisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "portugiesisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "psychologie",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "russisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "sorbisch-wendisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "sowi-wiwi",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "spanisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "sport",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "theater",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "tuerkisch",
      },
      {
        schoolType: "integrierte-sekundarschule",
        grade: "9",
        subject: "wirtschaft-arbeit-technik",
      },
    ],
  };
