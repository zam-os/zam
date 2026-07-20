import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface ThueringenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Thüringen Lehrpläne catalog (Thüringer Schulportal).
 *
 * Captured 2026-07-20 from https://www.schulportal-thueringen.de/lehrplaene
 * Content URLs are official PDF downloads under /tip/resources/medien/…
 *
 * School types: Grundschule, Regelschule, Gymnasium, Thüringer
 * Gemeinschaftsschule. Berufsbildende Schulen and Entwurfsfassungen out of
 * scope; bilingual language variants skipped.
 */
export interface LehrplanThueringenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: ThueringenCatalogPath[];
}

export const LEHRPLAN_THUERINGEN_MANIFEST: LehrplanThueringenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Thüringer Schulportal Lehrpläne (allgemeinbildend)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "regelschule",
      label: "Regelschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium",
    },
    {
      id: "gemeinschaftsschule",
      label: "Thüringer Gemeinschaftsschule",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    regelschule: ["5", "6", "7", "8", "9", "10"],
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
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religionslehre",
        label: "Evangelische Religionslehre",
      },
      {
        id: "fremdsprache",
        label: "Fremdsprache",
      },
      {
        id: "heimat-und-sachkunde",
        label: "Heimat- und Sachkunde",
      },
      {
        id: "juedische-religionslehre",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religionslehre",
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
        id: "schulgarten",
        label: "Schulgarten",
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
    regelschule: [
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
        id: "darstellen-und-gestalten",
        label: "Darstellen und Gestalten",
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
        id: "evangelische-religionslehre",
        label: "Evangelische Religionslehre",
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
        id: "juedische-religionslehre",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religionslehre",
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
        id: "medienbildung-und-informatik-5-6",
        label: "Medienbildung und Informatik 5/6",
      },
      {
        id: "mensch-natur-technik",
        label: "Mensch-Natur-Technik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "natur-und-technik",
        label: "Natur und Technik",
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
        id: "sozialwesen",
        label: "Sozialwesen",
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
        id: "technisches-werken",
        label: "Technisches Werken",
      },
      {
        id: "wahlpflichtfach-informatik",
        label: "Wahlpflichtfach Informatik",
      },
      {
        id: "wirtschaft-recht-technik",
        label: "Wirtschaft-Recht-Technik",
      },
      {
        id: "wirtschaft-umwelt-europa",
        label: "Wirtschaft-Umwelt-Europa",
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
        id: "darstellen-und-gestalten",
        label: "Darstellen und Gestalten",
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
        id: "evangelische-religionslehre",
        label: "Evangelische Religionslehre",
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
        id: "juedische-religionslehre",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religionslehre",
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
        id: "medienbildung-und-informatik-5-6",
        label: "Medienbildung und Informatik 5/6",
      },
      {
        id: "mensch-natur-technik",
        label: "Mensch-Natur-Technik",
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
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "wahlpflichtfach-gesellschaftswissenschaften",
        label: "Wahlpflichtfach Gesellschaftswissenschaften",
      },
      {
        id: "wahlpflichtfach-naturwissenschaften-und-technik",
        label: "Wahlpflichtfach Naturwissenschaften und Technik",
      },
      {
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
    ],
    gemeinschaftsschule: [
      {
        id: "technik",
        label: "Technik",
      },
      {
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
    ],
  },

  tracks: {},

  topics: {
    "gemeinschaftsschule|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|11|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|12|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|wirtschaft-und-recht": [
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
    "grundschule|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|heimat-und-sachkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|1|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|katholische-religionslehre": [
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
    "grundschule|1|schulgarten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|heimat-und-sachkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|2|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|katholische-religionslehre": [
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
    "grundschule|2|schulgarten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|heimat-und-sachkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|3|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|katholische-religionslehre": [
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
    "grundschule|3|schulgarten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|fremdsprache": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|heimat-und-sachkunde": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "grundschule|4|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|katholische-religionslehre": [
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
    "grundschule|4|schulgarten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|darstellen-und-gestalten": [
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
    "gymnasium|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|evangelische-religionslehre": [
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
    "gymnasium|10|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|katholische-religionslehre": [
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
    "gymnasium|10|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|wirtschaft-und-recht": [
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
    "gymnasium|11|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|11|evangelische-religionslehre": [
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
    "gymnasium|11|geografie": [
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
    "gymnasium|11|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|katholische-religionslehre": [
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
    "gymnasium|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|11|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|wirtschaft-und-recht": [
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
    "gymnasium|12|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "gymnasium|12|evangelische-religionslehre": [
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
    "gymnasium|12|geografie": [
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
    "gymnasium|12|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|katholische-religionslehre": [
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
    "gymnasium|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|12|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|wirtschaft-und-recht": [
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
    "gymnasium|5|darstellen-und-gestalten": [
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
    "gymnasium|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|evangelische-religionslehre": [
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
    "gymnasium|5|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|katholische-religionslehre": [
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
    "gymnasium|5|medienbildung-und-informatik-5-6": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|mensch-natur-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|5|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|wirtschaft-und-recht": [
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
    "gymnasium|6|darstellen-und-gestalten": [
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
    "gymnasium|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|evangelische-religionslehre": [
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
    "gymnasium|6|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|katholische-religionslehre": [
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
    "gymnasium|6|medienbildung-und-informatik-5-6": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|mensch-natur-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|6|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|wirtschaft-und-recht": [
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
    "gymnasium|7|darstellen-und-gestalten": [
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
    "gymnasium|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|evangelische-religionslehre": [
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
    "gymnasium|7|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|katholische-religionslehre": [
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
    "gymnasium|7|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|wirtschaft-und-recht": [
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
    "gymnasium|8|darstellen-und-gestalten": [
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
    "gymnasium|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|evangelische-religionslehre": [
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
    "gymnasium|8|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|katholische-religionslehre": [
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
    "gymnasium|8|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|wirtschaft-und-recht": [
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
    "gymnasium|9|darstellen-und-gestalten": [
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
    "gymnasium|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|evangelische-religionslehre": [
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
    "gymnasium|9|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|katholische-religionslehre": [
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
    "gymnasium|9|wahlpflichtfach-gesellschaftswissenschaften": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wahlpflichtfach-naturwissenschaften-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|wirtschaft-und-recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|10|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|10|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|10|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|10|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|10|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|10|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|wahlpflichtfach-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|10|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|5|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|5|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|5|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|5|medienbildung-und-informatik-5-6": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|mensch-natur-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|5|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|5|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|5|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|5|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|6|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|6|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|6|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|6|medienbildung-und-informatik-5-6": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|mensch-natur-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|6|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|6|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|6|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|6|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|7|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|7|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|7|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|7|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|7|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|7|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|wahlpflichtfach-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|7|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|8|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|8|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|8|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|8|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|8|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|8|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|wahlpflichtfach-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|8|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|9|darstellen-und-gestalten": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "regelschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|evangelische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|9|geografie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|geschichte": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|juedische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|katholische-religionslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|kunst": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "regelschule|9|musik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|natur-und-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "regelschule|9|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|9|sozialkunde": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|sozialwesen": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "regelschule|9|sport": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|technisches-werken": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|wahlpflichtfach-informatik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|wirtschaft-recht-technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "regelschule|9|wirtschaft-umwelt-europa": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
  },

  contentUrls: {
    "gemeinschaftsschule|10|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|10|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|11|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|11|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|12|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|12|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|5|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|5|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|6|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|6|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|7|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|7|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|8|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|8|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "gemeinschaftsschule|9|technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30486?dateiname=LP_Technik_TGS_2014.pdf",
    "gemeinschaftsschule|9|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/31748?dateiname=LP_WR_TGS_+25.06.2015_neu.pdf",
    "grundschule|1|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13946?dateiname=lp_gs_D_2010_2012.pdf",
    "grundschule|1|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13961?dateiname=lp_gs_Et_2010.pdf",
    "grundschule|1|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13965?dateiname=lp_gs_ER_2010.pdf",
    "grundschule|1|fremdsprache":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19745?dateiname=lp_gs_FS_2010.pdf",
    "grundschule|1|heimat-und-sachkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13947?dateiname=lp_HSK_2015.pdf",
    "grundschule|1|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/39374?dateiname=LP_J%C3%BCdische_Religionslehre_GS_2018.pdf",
    "grundschule|1|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13971?dateiname=lp_gs_KR_2010.pdf",
    "grundschule|1|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/7178?dateiname=lp_gs_Ku_2010.pdf",
    "grundschule|1|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13959?dateiname=lp_gs_Ma_2010.pdf",
    "grundschule|1|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13960?dateiname=lp_gs_Mu_2010.pdf",
    "grundschule|1|schulgarten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13962?dateiname=lp_gs_Sg_2010.pdf",
    "grundschule|1|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15532?dateiname=lp_gs_sp_2010.pdf",
    "grundschule|1|werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13963?dateiname=lp_gs_we_2010.pdf",
    "grundschule|2|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13946?dateiname=lp_gs_D_2010_2012.pdf",
    "grundschule|2|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13961?dateiname=lp_gs_Et_2010.pdf",
    "grundschule|2|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13965?dateiname=lp_gs_ER_2010.pdf",
    "grundschule|2|fremdsprache":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19745?dateiname=lp_gs_FS_2010.pdf",
    "grundschule|2|heimat-und-sachkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13947?dateiname=lp_HSK_2015.pdf",
    "grundschule|2|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/39374?dateiname=LP_J%C3%BCdische_Religionslehre_GS_2018.pdf",
    "grundschule|2|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13971?dateiname=lp_gs_KR_2010.pdf",
    "grundschule|2|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/7178?dateiname=lp_gs_Ku_2010.pdf",
    "grundschule|2|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13959?dateiname=lp_gs_Ma_2010.pdf",
    "grundschule|2|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13960?dateiname=lp_gs_Mu_2010.pdf",
    "grundschule|2|schulgarten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13962?dateiname=lp_gs_Sg_2010.pdf",
    "grundschule|2|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15532?dateiname=lp_gs_sp_2010.pdf",
    "grundschule|2|werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13963?dateiname=lp_gs_we_2010.pdf",
    "grundschule|3|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13946?dateiname=lp_gs_D_2010_2012.pdf",
    "grundschule|3|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13961?dateiname=lp_gs_Et_2010.pdf",
    "grundschule|3|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13965?dateiname=lp_gs_ER_2010.pdf",
    "grundschule|3|fremdsprache":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19745?dateiname=lp_gs_FS_2010.pdf",
    "grundschule|3|heimat-und-sachkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13947?dateiname=lp_HSK_2015.pdf",
    "grundschule|3|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/39374?dateiname=LP_J%C3%BCdische_Religionslehre_GS_2018.pdf",
    "grundschule|3|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13971?dateiname=lp_gs_KR_2010.pdf",
    "grundschule|3|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/7178?dateiname=lp_gs_Ku_2010.pdf",
    "grundschule|3|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13959?dateiname=lp_gs_Ma_2010.pdf",
    "grundschule|3|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13960?dateiname=lp_gs_Mu_2010.pdf",
    "grundschule|3|schulgarten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13962?dateiname=lp_gs_Sg_2010.pdf",
    "grundschule|3|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15532?dateiname=lp_gs_sp_2010.pdf",
    "grundschule|3|werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13963?dateiname=lp_gs_we_2010.pdf",
    "grundschule|4|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13946?dateiname=lp_gs_D_2010_2012.pdf",
    "grundschule|4|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13961?dateiname=lp_gs_Et_2010.pdf",
    "grundschule|4|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13965?dateiname=lp_gs_ER_2010.pdf",
    "grundschule|4|fremdsprache":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19745?dateiname=lp_gs_FS_2010.pdf",
    "grundschule|4|heimat-und-sachkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13947?dateiname=lp_HSK_2015.pdf",
    "grundschule|4|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/39374?dateiname=LP_J%C3%BCdische_Religionslehre_GS_2018.pdf",
    "grundschule|4|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13971?dateiname=lp_gs_KR_2010.pdf",
    "grundschule|4|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/7178?dateiname=lp_gs_Ku_2010.pdf",
    "grundschule|4|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13959?dateiname=lp_gs_Ma_2010.pdf",
    "grundschule|4|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13960?dateiname=lp_gs_Mu_2010.pdf",
    "grundschule|4|schulgarten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13962?dateiname=lp_gs_Sg_2010.pdf",
    "grundschule|4|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15532?dateiname=lp_gs_sp_2010.pdf",
    "grundschule|4|werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/13963?dateiname=lp_gs_we_2010.pdf",
    "gymnasium|10|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18045?dateiname=Endfsg_Astronomie_Gymnasium_2012.pdf",
    "gymnasium|10|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|10|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|10|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|10|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|10|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|10|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|10|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|10|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|10|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|10|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|10|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|10|informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21770?dateiname=Lehrplan_inf_Gym_9_12_26112012.pdf",
    "gymnasium|10|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|10|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|10|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|10|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|10|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|10|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|10|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|10|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|10|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|10|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|10|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|10|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|10|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|10|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|10|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|11|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18045?dateiname=Endfsg_Astronomie_Gymnasium_2012.pdf",
    "gymnasium|11|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|11|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|11|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|11|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|11|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|11|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|11|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|11|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|11|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|11|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|11|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|11|informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21770?dateiname=Lehrplan_inf_Gym_9_12_26112012.pdf",
    "gymnasium|11|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|11|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|11|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|11|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|11|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|11|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|11|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|11|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|11|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|11|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|11|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|11|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|11|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|11|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|11|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|12|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18045?dateiname=Endfsg_Astronomie_Gymnasium_2012.pdf",
    "gymnasium|12|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|12|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|12|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|12|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|12|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|12|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|12|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|12|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|12|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|12|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|12|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|12|informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21770?dateiname=Lehrplan_inf_Gym_9_12_26112012.pdf",
    "gymnasium|12|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|12|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|12|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|12|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|12|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|12|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|12|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|12|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|12|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|12|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|12|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|12|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|12|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|12|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|12|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|5|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|5|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|5|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|5|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|5|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|5|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|5|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|5|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|5|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|5|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|5|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|5|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|5|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|5|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|5|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|5|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|5|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|5|medienbildung-und-informatik-5-6":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63137?dateiname=Lehrplan_MBI_Klassenstufen_5-6.pdf",
    "gymnasium|5|mensch-natur-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14011?dateiname=Lehrplan_MNT_Gy_24_02_2015.pdf",
    "gymnasium|5|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|5|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|5|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|5|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|5|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|5|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|5|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|5|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|5|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|6|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|6|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|6|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|6|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|6|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|6|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|6|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|6|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|6|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|6|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|6|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|6|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|6|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|6|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|6|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|6|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|6|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|6|medienbildung-und-informatik-5-6":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63137?dateiname=Lehrplan_MBI_Klassenstufen_5-6.pdf",
    "gymnasium|6|mensch-natur-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14011?dateiname=Lehrplan_MNT_Gy_24_02_2015.pdf",
    "gymnasium|6|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|6|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|6|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|6|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|6|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|6|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|6|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|6|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|6|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|7|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|7|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|7|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|7|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|7|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|7|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|7|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|7|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|7|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|7|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|7|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|7|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|7|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|7|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|7|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|7|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|7|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|7|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|7|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|7|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|7|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|7|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|7|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|7|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|7|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|7|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|8|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|8|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|8|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|8|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|8|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|8|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|8|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|8|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|8|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|8|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|8|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|8|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|8|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|8|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|8|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|8|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|8|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|8|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|8|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|8|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|8|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|8|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|8|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|8|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|8|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|8|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "gymnasium|9|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18045?dateiname=Endfsg_Astronomie_Gymnasium_2012.pdf",
    "gymnasium|9|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63705?dateiname=Biologie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|9|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63707?dateiname=Chemie_Lehrplan_AHR_2024-11-13.pdf",
    "gymnasium|9|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27922?dateiname=LP_DG_2014_04_07_GYM.pdf",
    "gymnasium|9|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/43341?dateiname=lp_gy_deutsch_neue+Fassung_08.02.2019_TSP.pdf",
    "gymnasium|9|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14691?dateiname=lp_gy_englisch_2019_EN_2FS_Stand_12032019.pdf",
    "gymnasium|9|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15748?dateiname=LP_GY_Ethik_Endfassung_300713.pdf",
    "gymnasium|9|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15756?dateiname=LP_GY_ER_Endfassung_22_8_13.pdf",
    "gymnasium|9|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62800?dateiname=lp_gy_franzoesisch_04_24.pdf",
    "gymnasium|9|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15776?dateiname=LP_GY_Geo_Endfassung_11_10_2013.pdf",
    "gymnasium|9|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15749?dateiname=LP_GY_Ge_Fassung_20210913.pdf",
    "gymnasium|9|griechisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14698?dateiname=lp_gy_griechisch_Endfassung_gesamt.pdf",
    "gymnasium|9|informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21770?dateiname=Lehrplan_inf_Gym_9_12_26112012.pdf",
    "gymnasium|9|italienisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63126?dateiname=LP_Italienisch-2024.pdf",
    "gymnasium|9|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63376?dateiname=LP_Jued_Religionslehre_Gym_2024.pdf",
    "gymnasium|9|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17261?dateiname=LP_GY_KR_Endfassung_050913.pdf",
    "gymnasium|9|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15755?dateiname=LP_GY_Kunst_Endfassung_030614.pdf",
    "gymnasium|9|latein":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63127?dateiname=LP_Latein-2024.pdf",
    "gymnasium|9|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19980?dateiname=lp_gy_mathematik_10.04.2019_TSP.pdf",
    "gymnasium|9|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15751?dateiname=LP_GY_Musik_Endfassung_Maerz_2013.pdf",
    "gymnasium|9|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63792?dateiname=LP_GY_OSt_Physik_final_2024-10-28.pdf",
    "gymnasium|9|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/62801?dateiname=lp_gy_russisch_04_24.pdf",
    "gymnasium|9|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15753?dateiname=LP_GY_SK_Endfassung_21_06_13.pdf",
    "gymnasium|9|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63128?dateiname=LP_Spanisch_2024-07-19_TSP.pdf",
    "gymnasium|9|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20399?dateiname=LP_GY_Sp_2016.pdf",
    "gymnasium|9|wahlpflichtfach-gesellschaftswissenschaften":
      "https://www.schulportal-thueringen.de/tip/resources/medien/21303?dateiname=LP_GEWI__2017_23_10_Endfassung.pdf",
    "gymnasium|9|wahlpflichtfach-naturwissenschaften-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/22300?dateiname=18_09_2018_LP_WPF_NWuT_GY_End_TSP.pdf",
    "gymnasium|9|wirtschaft-und-recht":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15754?dateiname=LP_GY_WR_Endfassung_290713_1.pdf",
    "regelschule|10|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18046?dateiname=Endfsg_Astronomie_Regelschule_2012.pdf",
    "regelschule|10|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|10|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|10|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|10|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|10|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|10|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|10|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|10|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|10|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|10|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|10|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|10|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|10|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|10|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|10|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|10|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|10|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|10|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|10|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|10|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|10|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|10|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|10|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|10|wahlpflichtfach-informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19807?dateiname=RS_WPF_Inf7_10_25_07_2013_final.pdf",
    "regelschule|10|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|10|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
    "regelschule|5|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|5|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|5|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|5|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|5|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|5|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|5|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|5|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|5|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|5|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|5|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|5|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|5|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|5|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|5|medienbildung-und-informatik-5-6":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63137?dateiname=Lehrplan_MBI_Klassenstufen_5-6.pdf",
    "regelschule|5|mensch-natur-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16113?dateiname=Lehrplan_MNT_RS_24-02-2015.pdf",
    "regelschule|5|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|5|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|5|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|5|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|5|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|5|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|5|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|5|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|5|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|5|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|5|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
    "regelschule|6|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|6|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|6|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|6|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|6|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|6|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|6|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|6|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|6|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|6|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|6|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|6|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|6|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|6|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|6|medienbildung-und-informatik-5-6":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63137?dateiname=Lehrplan_MBI_Klassenstufen_5-6.pdf",
    "regelschule|6|mensch-natur-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16113?dateiname=Lehrplan_MNT_RS_24-02-2015.pdf",
    "regelschule|6|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|6|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|6|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|6|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|6|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|6|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|6|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|6|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|6|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|6|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|6|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
    "regelschule|7|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|7|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|7|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|7|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|7|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|7|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|7|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|7|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|7|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|7|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|7|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|7|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|7|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|7|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|7|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|7|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|7|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|7|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|7|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|7|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|7|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|7|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|7|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|7|wahlpflichtfach-informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19807?dateiname=RS_WPF_Inf7_10_25_07_2013_final.pdf",
    "regelschule|7|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|7|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
    "regelschule|8|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|8|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|8|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|8|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|8|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|8|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|8|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|8|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|8|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|8|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|8|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|8|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|8|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|8|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|8|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|8|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|8|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|8|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|8|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|8|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|8|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|8|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|8|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|8|wahlpflichtfach-informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19807?dateiname=RS_WPF_Inf7_10_25_07_2013_final.pdf",
    "regelschule|8|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|8|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
    "regelschule|9|astronomie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/18046?dateiname=Endfsg_Astronomie_Regelschule_2012.pdf",
    "regelschule|9|biologie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63706?dateiname=Biologie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|9|chemie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63708?dateiname=Chemie_Lehrplan_HRA_2024-11-13.pdf",
    "regelschule|9|darstellen-und-gestalten":
      "https://www.schulportal-thueringen.de/tip/resources/medien/27923?dateiname=LP_DG_2014_04_07_RS.pdf",
    "regelschule|9|deutsch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19801?dateiname=lp_rs_deutsch_endfassung_171212.pdf",
    "regelschule|9|englisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14654?dateiname=lp_rs_englisch_21072014.pdf",
    "regelschule|9|ethik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15761?dateiname=LP_RS_Ethik_Endfassung_060514.pdf",
    "regelschule|9|evangelische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15763?dateiname=LP_RS_ER_Endfassung_22_8_13.pdf",
    "regelschule|9|franzoesisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14655?dateiname=lp_rs_franzoesisch_endfassung_270911.pdf",
    "regelschule|9|geografie":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15775?dateiname=LP_RS_Geo_Endfassung_02_07_2013.pdf",
    "regelschule|9|geschichte":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15758?dateiname=LP_RS_Ge_Endfassung_150213.pdf",
    "regelschule|9|juedische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/63373?dateiname=LP_Jued_Religionslehre_RS_2024.pdf",
    "regelschule|9|katholische-religionslehre":
      "https://www.schulportal-thueringen.de/tip/resources/medien/17260?dateiname=LP_RS_KR_Endfassung_050913.pdf",
    "regelschule|9|kunst":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15760?dateiname=LP_RS_Kunst_Endfassung_030614.pdf",
    "regelschule|9|mathematik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19979?dateiname=lp_rs_mathematik_endfassung_280812.pdf",
    "regelschule|9|musik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15762?dateiname=LP_RS_Musik_Endfassung_2012.pdf",
    "regelschule|9|natur-und-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/16126?dateiname=LP_NT_RS_2012.pdf",
    "regelschule|9|physik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14629?dateiname=Physik_RS_Nov_2012_7_10.pdf",
    "regelschule|9|russisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14656?dateiname=lp_rs_russisch_endfassung_070714.pdf",
    "regelschule|9|sozialkunde":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15768?dateiname=LP_RS_SK_Endfassung_18_02_13.pdf",
    "regelschule|9|sozialwesen":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15767?dateiname=LP_Sozialwesen_Endfassung_06_11_2012.pdf",
    "regelschule|9|spanisch":
      "https://www.schulportal-thueringen.de/tip/resources/medien/30311?dateiname=lp_rs_SPANISCH_2014_endfassung.pdf",
    "regelschule|9|sport":
      "https://www.schulportal-thueringen.de/tip/resources/medien/20402?dateiname=LP_RS_Sport_2017.pdf",
    "regelschule|9|technisches-werken":
      "https://www.schulportal-thueringen.de/tip/resources/medien/14657?dateiname=LP_rs_tw_09_05_2016.pdf",
    "regelschule|9|wahlpflichtfach-informatik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/19807?dateiname=RS_WPF_Inf7_10_25_07_2013_final.pdf",
    "regelschule|9|wirtschaft-recht-technik":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15764?dateiname=LP_RS_WRT_Endfassung_01_10_12.pdf",
    "regelschule|9|wirtschaft-umwelt-europa":
      "https://www.schulportal-thueringen.de/tip/resources/medien/15765?dateiname=LP_WUE_RS_2012.pdf",
  },

  catalogPaths: [
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "11", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "11",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "12", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "12",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "technik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "wirtschaft-und-recht",
    },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "ethik" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "grundschule", grade: "1", subject: "fremdsprache" },
    { schoolType: "grundschule", grade: "1", subject: "heimat-und-sachkunde" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "katholische-religionslehre",
    },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "schulgarten" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "werken" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "ethik" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "grundschule", grade: "2", subject: "fremdsprache" },
    { schoolType: "grundschule", grade: "2", subject: "heimat-und-sachkunde" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "katholische-religionslehre",
    },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "schulgarten" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "werken" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "ethik" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "grundschule", grade: "3", subject: "fremdsprache" },
    { schoolType: "grundschule", grade: "3", subject: "heimat-und-sachkunde" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "katholische-religionslehre",
    },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "schulgarten" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "werken" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "ethik" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "grundschule", grade: "4", subject: "fremdsprache" },
    { schoolType: "grundschule", grade: "4", subject: "heimat-und-sachkunde" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "katholische-religionslehre",
    },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "schulgarten" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "werken" },
    { schoolType: "gymnasium", grade: "10", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geografie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "11", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "11", subject: "biologie" },
    { schoolType: "gymnasium", grade: "11", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "11", subject: "englisch" },
    { schoolType: "gymnasium", grade: "11", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "11", subject: "geografie" },
    { schoolType: "gymnasium", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "11", subject: "informatik" },
    { schoolType: "gymnasium", grade: "11", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "11", subject: "kunst" },
    { schoolType: "gymnasium", grade: "11", subject: "latein" },
    { schoolType: "gymnasium", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "11", subject: "musik" },
    { schoolType: "gymnasium", grade: "11", subject: "physik" },
    { schoolType: "gymnasium", grade: "11", subject: "russisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "11", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "12", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "12", subject: "biologie" },
    { schoolType: "gymnasium", grade: "12", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "12", subject: "englisch" },
    { schoolType: "gymnasium", grade: "12", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "12", subject: "geografie" },
    { schoolType: "gymnasium", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "12", subject: "informatik" },
    { schoolType: "gymnasium", grade: "12", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "12", subject: "kunst" },
    { schoolType: "gymnasium", grade: "12", subject: "latein" },
    { schoolType: "gymnasium", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "12", subject: "musik" },
    { schoolType: "gymnasium", grade: "12", subject: "physik" },
    { schoolType: "gymnasium", grade: "12", subject: "russisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "12", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geografie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "5", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "medienbildung-und-informatik-5-6",
    },
    { schoolType: "gymnasium", grade: "5", subject: "mensch-natur-technik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "physik" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "5", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geografie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "6", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "medienbildung-und-informatik-5-6",
    },
    { schoolType: "gymnasium", grade: "6", subject: "mensch-natur-technik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "6", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geografie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "7", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geografie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "8", subject: "wirtschaft-und-recht" },
    { schoolType: "gymnasium", grade: "9", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geografie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "italienisch" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "katholische-religionslehre",
    },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sozialkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "wahlpflichtfach-gesellschaftswissenschaften",
    },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "wahlpflichtfach-naturwissenschaften-und-technik",
    },
    { schoolType: "gymnasium", grade: "9", subject: "wirtschaft-und-recht" },
    { schoolType: "regelschule", grade: "10", subject: "astronomie" },
    { schoolType: "regelschule", grade: "10", subject: "biologie" },
    { schoolType: "regelschule", grade: "10", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "10", subject: "deutsch" },
    { schoolType: "regelschule", grade: "10", subject: "englisch" },
    { schoolType: "regelschule", grade: "10", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "10", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "10", subject: "geografie" },
    { schoolType: "regelschule", grade: "10", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "10", subject: "kunst" },
    { schoolType: "regelschule", grade: "10", subject: "mathematik" },
    { schoolType: "regelschule", grade: "10", subject: "musik" },
    { schoolType: "regelschule", grade: "10", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "10", subject: "physik" },
    { schoolType: "regelschule", grade: "10", subject: "russisch" },
    { schoolType: "regelschule", grade: "10", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "10", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "10", subject: "spanisch" },
    { schoolType: "regelschule", grade: "10", subject: "sport" },
    { schoolType: "regelschule", grade: "10", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "wahlpflichtfach-informatik",
    },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "10",
      subject: "wirtschaft-umwelt-europa",
    },
    { schoolType: "regelschule", grade: "5", subject: "biologie" },
    { schoolType: "regelschule", grade: "5", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "5", subject: "deutsch" },
    { schoolType: "regelschule", grade: "5", subject: "englisch" },
    { schoolType: "regelschule", grade: "5", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "5", subject: "geografie" },
    { schoolType: "regelschule", grade: "5", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "5", subject: "kunst" },
    { schoolType: "regelschule", grade: "5", subject: "mathematik" },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "medienbildung-und-informatik-5-6",
    },
    { schoolType: "regelschule", grade: "5", subject: "mensch-natur-technik" },
    { schoolType: "regelschule", grade: "5", subject: "musik" },
    { schoolType: "regelschule", grade: "5", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "5", subject: "physik" },
    { schoolType: "regelschule", grade: "5", subject: "russisch" },
    { schoolType: "regelschule", grade: "5", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "5", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "5", subject: "spanisch" },
    { schoolType: "regelschule", grade: "5", subject: "sport" },
    { schoolType: "regelschule", grade: "5", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "5",
      subject: "wirtschaft-umwelt-europa",
    },
    { schoolType: "regelschule", grade: "6", subject: "biologie" },
    { schoolType: "regelschule", grade: "6", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "6", subject: "deutsch" },
    { schoolType: "regelschule", grade: "6", subject: "englisch" },
    { schoolType: "regelschule", grade: "6", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "6", subject: "geografie" },
    { schoolType: "regelschule", grade: "6", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "6", subject: "kunst" },
    { schoolType: "regelschule", grade: "6", subject: "mathematik" },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "medienbildung-und-informatik-5-6",
    },
    { schoolType: "regelschule", grade: "6", subject: "mensch-natur-technik" },
    { schoolType: "regelschule", grade: "6", subject: "musik" },
    { schoolType: "regelschule", grade: "6", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "6", subject: "physik" },
    { schoolType: "regelschule", grade: "6", subject: "russisch" },
    { schoolType: "regelschule", grade: "6", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "6", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "6", subject: "spanisch" },
    { schoolType: "regelschule", grade: "6", subject: "sport" },
    { schoolType: "regelschule", grade: "6", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "6",
      subject: "wirtschaft-umwelt-europa",
    },
    { schoolType: "regelschule", grade: "7", subject: "biologie" },
    { schoolType: "regelschule", grade: "7", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "7", subject: "deutsch" },
    { schoolType: "regelschule", grade: "7", subject: "englisch" },
    { schoolType: "regelschule", grade: "7", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "7", subject: "geografie" },
    { schoolType: "regelschule", grade: "7", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "7", subject: "kunst" },
    { schoolType: "regelschule", grade: "7", subject: "mathematik" },
    { schoolType: "regelschule", grade: "7", subject: "musik" },
    { schoolType: "regelschule", grade: "7", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "7", subject: "physik" },
    { schoolType: "regelschule", grade: "7", subject: "russisch" },
    { schoolType: "regelschule", grade: "7", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "7", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "7", subject: "spanisch" },
    { schoolType: "regelschule", grade: "7", subject: "sport" },
    { schoolType: "regelschule", grade: "7", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "wahlpflichtfach-informatik",
    },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "7",
      subject: "wirtschaft-umwelt-europa",
    },
    { schoolType: "regelschule", grade: "8", subject: "biologie" },
    { schoolType: "regelschule", grade: "8", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "8", subject: "deutsch" },
    { schoolType: "regelschule", grade: "8", subject: "englisch" },
    { schoolType: "regelschule", grade: "8", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "8", subject: "geografie" },
    { schoolType: "regelschule", grade: "8", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "8", subject: "kunst" },
    { schoolType: "regelschule", grade: "8", subject: "mathematik" },
    { schoolType: "regelschule", grade: "8", subject: "musik" },
    { schoolType: "regelschule", grade: "8", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "8", subject: "physik" },
    { schoolType: "regelschule", grade: "8", subject: "russisch" },
    { schoolType: "regelschule", grade: "8", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "8", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "8", subject: "spanisch" },
    { schoolType: "regelschule", grade: "8", subject: "sport" },
    { schoolType: "regelschule", grade: "8", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "wahlpflichtfach-informatik",
    },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "8",
      subject: "wirtschaft-umwelt-europa",
    },
    { schoolType: "regelschule", grade: "9", subject: "astronomie" },
    { schoolType: "regelschule", grade: "9", subject: "biologie" },
    { schoolType: "regelschule", grade: "9", subject: "chemie" },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "darstellen-und-gestalten",
    },
    { schoolType: "regelschule", grade: "9", subject: "deutsch" },
    { schoolType: "regelschule", grade: "9", subject: "englisch" },
    { schoolType: "regelschule", grade: "9", subject: "ethik" },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "evangelische-religionslehre",
    },
    { schoolType: "regelschule", grade: "9", subject: "franzoesisch" },
    { schoolType: "regelschule", grade: "9", subject: "geografie" },
    { schoolType: "regelschule", grade: "9", subject: "geschichte" },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "juedische-religionslehre",
    },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "katholische-religionslehre",
    },
    { schoolType: "regelschule", grade: "9", subject: "kunst" },
    { schoolType: "regelschule", grade: "9", subject: "mathematik" },
    { schoolType: "regelschule", grade: "9", subject: "musik" },
    { schoolType: "regelschule", grade: "9", subject: "natur-und-technik" },
    { schoolType: "regelschule", grade: "9", subject: "physik" },
    { schoolType: "regelschule", grade: "9", subject: "russisch" },
    { schoolType: "regelschule", grade: "9", subject: "sozialkunde" },
    { schoolType: "regelschule", grade: "9", subject: "sozialwesen" },
    { schoolType: "regelschule", grade: "9", subject: "spanisch" },
    { schoolType: "regelschule", grade: "9", subject: "sport" },
    { schoolType: "regelschule", grade: "9", subject: "technisches-werken" },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "wahlpflichtfach-informatik",
    },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "wirtschaft-recht-technik",
    },
    {
      schoolType: "regelschule",
      grade: "9",
      subject: "wirtschaft-umwelt-europa",
    },
  ],
};
