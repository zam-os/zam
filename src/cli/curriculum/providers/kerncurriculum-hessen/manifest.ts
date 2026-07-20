import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface HessenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Hessische Kerncurricula catalog (https://kultus.hessen.de/).
 *
 * Captured 2026-07-20. Content URLs are official KC PDFs:
 * - Primarstufe
 * - Sek I (Hauptschule / Realschule / Gymnasium)
 * - Gymnasiale Oberstufe (KCGO ab Schuljahr 2024/25)
 * Leitfäden and non-PDF worksheets are out of scope.
 */
export interface KerncurriculumHessenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: HessenCatalogPath[];
}

export const KERNCURRICULUM_HESSEN_MANIFEST: KerncurriculumHessenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Hessische Kerncurricula (Primar, Sek I, KCGO)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Primarstufe / Grundschule",
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
    hauptschule: ["5", "6", "7", "8", "9"],
    realschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    "gymnasiale-oberstufe": ["11", "12", "13"],
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
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religion",
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
        id: "moderne-fremdsprachen",
        label: "Moderne Fremdsprachen",
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
    hauptschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religion",
      },
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religion (DITIB Hessen sunnitisch)",
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
        id: "moderne-fremdsprachen",
        label: "Moderne Fremdsprachen",
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
        id: "politik-wirtschaft",
        label: "Politik und Wirtschaft",
      },
      {
        id: "sport",
        label: "Sport",
      },
    ],
    realschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religion",
      },
      {
        id: "arabisch",
        label: "Arabisch",
      },
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religion (DITIB Hessen sunnitisch)",
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
        id: "moderne-fremdsprachen",
        label: "Moderne Fremdsprachen",
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
        id: "politik-wirtschaft",
        label: "Politik und Wirtschaft",
      },
      {
        id: "sport",
        label: "Sport",
      },
    ],
    gymnasium: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religion",
      },
      {
        id: "arabisch",
        label: "Arabisch",
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
        id: "erdkunde",
        label: "Erdkunde",
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
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "griechisch",
        label: "Griechisch",
      },
      {
        id: "informatik",
        label: "Informatik (Wahlunterricht)",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religion (DITIB Hessen sunnitisch)",
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
        id: "moderne-fremdsprachen",
        label: "Moderne Fremdsprachen",
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
        id: "politik-wirtschaft",
        label: "Politik und Wirtschaft",
      },
      {
        id: "sport",
        label: "Sport",
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
        id: "islamische-religion",
        label: "Islamische Religion (DITIB Hessen sunnitisch)",
      },
      {
        id: "italienisch",
        label: "Italienisch",
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
        id: "litauisch",
        label: "Litauisch",
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
        id: "politik-wirtschaft",
        label: "Politik und Wirtschaft",
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
        id: "spanisch",
        label: "Spanisch",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "wirtschaftswissenschaften",
        label: "Wirtschaftswissenschaften",
      },
    ],
  },

  tracks: {},

  topics: {
    "grundschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "grundschule|1|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|1|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|1|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|1|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|1|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|1|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "grundschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "grundschule|2|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|2|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|2|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|2|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|2|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|2|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "grundschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "grundschule|3|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|3|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|3|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|3|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|3|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|3|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "grundschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "grundschule|4|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|4|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "grundschule|4|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "grundschule|4|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|4|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|4|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasiale-oberstufe|11|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|darstellendes-spiel": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|ethik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|litauisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|politik-wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|11|wirtschaftswissenschaften": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|darstellendes-spiel": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|ethik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|litauisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|politik-wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|12|wirtschaftswissenschaften": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|darstellendes-spiel": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|ethik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|islamische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|juedische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|litauisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|politik-wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasiale-oberstufe|13|wirtschaftswissenschaften": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Themenfelder" },
    ],
    "gymnasium|5|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|5|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|5|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|5|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|5|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|6|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|6|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|6|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|6|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|6|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|7|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|7|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
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
      { id: "daten", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme", label: "Systeme und Netze" },
    ],
    "gymnasium|7|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|7|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "gymnasium|7|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|8|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|8|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
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
      { id: "daten", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme", label: "Systeme und Netze" },
    ],
    "gymnasium|8|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|8|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "gymnasium|8|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|9|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|9|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
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
      { id: "daten", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme", label: "Systeme und Netze" },
    ],
    "gymnasium|9|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|9|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "gymnasium|9|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|10|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "gymnasium|10|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
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
      { id: "daten", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme", label: "Systeme und Netze" },
    ],
    "gymnasium|10|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gymnasium|10|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "gymnasium|10|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "hauptschule|5|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "hauptschule|5|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "hauptschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "hauptschule|5|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|5|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|5|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "hauptschule|5|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "hauptschule|5|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "hauptschule|5|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "hauptschule|6|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "hauptschule|6|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "hauptschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "hauptschule|6|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|6|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|6|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "hauptschule|6|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "hauptschule|6|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "hauptschule|6|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "hauptschule|7|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|7|arbeitslehre": [
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "hauptschule|7|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "hauptschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "hauptschule|7|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|7|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|7|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "hauptschule|7|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "hauptschule|7|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "hauptschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|7|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "hauptschule|7|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "hauptschule|8|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|8|arbeitslehre": [
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "hauptschule|8|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "hauptschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "hauptschule|8|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|8|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|8|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "hauptschule|8|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "hauptschule|8|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "hauptschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|8|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "hauptschule|8|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "hauptschule|9|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|9|arbeitslehre": [
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
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "hauptschule|9|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "hauptschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "hauptschule|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "hauptschule|9|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|9|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "hauptschule|9|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "hauptschule|9|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "hauptschule|9|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "hauptschule|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "hauptschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "hauptschule|9|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "hauptschule|9|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|5|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|5|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|5|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|5|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|5|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|5|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|5|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|5|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|5|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|5|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|6|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|6|arbeitslehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|6|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|6|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|6|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|6|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|6|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|6|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|6|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|6|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|7|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|7|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|arbeitslehre": [
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
    "realschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|7|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|7|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|7|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|7|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|7|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|7|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|7|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|7|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "realschule|7|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|8|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|8|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|arbeitslehre": [
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
    "realschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|8|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|8|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|8|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|8|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|8|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|8|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|8|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|8|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "realschule|8|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|9|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|9|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|arbeitslehre": [
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
    "realschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|9|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|9|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|9|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|9|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|9|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|9|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|9|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|9|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "realschule|9|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "realschule|10|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|10|arabisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|arbeitslehre": [
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
    "realschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch untersuchen" },
    ],
    "realschule|10|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "realschule|10|ethik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "realschule|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "realschule|10|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|10|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|10|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "realschule|10|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "realschule|10|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "realschule|10|moderne-fremdsprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "realschule|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "realschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "realschule|10|politik-wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
    "realschule|10|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
  },

  contentUrls: {
    "grundschule|1|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_deutsch_prst_2011_1.pdf",
    "grundschule|1|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_ethik_prst_2011_0.pdf",
    "grundschule|1|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_evreligion_prst_2011.pdf",
    "grundschule|1|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_islamischer_religionsunterricht.pdf",
    "grundschule|1|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_juedische_religion_-_primarstufe.pdf",
    "grundschule|1|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kathreligion_prst_2011.pdf",
    "grundschule|1|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kunst_prst_2011.pdf",
    "grundschule|1|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mathematik_prst_2011.pdf",
    "grundschule|1|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mfs_prst_201103_21.pdf",
    "grundschule|1|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_musik_prst_2011.pdf",
    "grundschule|1|sachunterricht":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_sachunterricht_prst_2011.pdf",
    "grundschule|1|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_primarstufe_sport.pdf",
    "grundschule|2|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_deutsch_prst_2011_1.pdf",
    "grundschule|2|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_ethik_prst_2011_0.pdf",
    "grundschule|2|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_evreligion_prst_2011.pdf",
    "grundschule|2|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_islamischer_religionsunterricht.pdf",
    "grundschule|2|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_juedische_religion_-_primarstufe.pdf",
    "grundschule|2|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kathreligion_prst_2011.pdf",
    "grundschule|2|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kunst_prst_2011.pdf",
    "grundschule|2|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mathematik_prst_2011.pdf",
    "grundschule|2|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mfs_prst_201103_21.pdf",
    "grundschule|2|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_musik_prst_2011.pdf",
    "grundschule|2|sachunterricht":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_sachunterricht_prst_2011.pdf",
    "grundschule|2|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_primarstufe_sport.pdf",
    "grundschule|3|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_deutsch_prst_2011_1.pdf",
    "grundschule|3|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_ethik_prst_2011_0.pdf",
    "grundschule|3|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_evreligion_prst_2011.pdf",
    "grundschule|3|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_islamischer_religionsunterricht.pdf",
    "grundschule|3|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_juedische_religion_-_primarstufe.pdf",
    "grundschule|3|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kathreligion_prst_2011.pdf",
    "grundschule|3|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kunst_prst_2011.pdf",
    "grundschule|3|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mathematik_prst_2011.pdf",
    "grundschule|3|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mfs_prst_201103_21.pdf",
    "grundschule|3|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_musik_prst_2011.pdf",
    "grundschule|3|sachunterricht":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_sachunterricht_prst_2011.pdf",
    "grundschule|3|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_primarstufe_sport.pdf",
    "grundschule|4|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_deutsch_prst_2011_1.pdf",
    "grundschule|4|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_ethik_prst_2011_0.pdf",
    "grundschule|4|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_evreligion_prst_2011.pdf",
    "grundschule|4|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_islamischer_religionsunterricht.pdf",
    "grundschule|4|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_juedische_religion_-_primarstufe.pdf",
    "grundschule|4|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kathreligion_prst_2011.pdf",
    "grundschule|4|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_kunst_prst_2011.pdf",
    "grundschule|4|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mathematik_prst_2011.pdf",
    "grundschule|4|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_mfs_prst_201103_21.pdf",
    "grundschule|4|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_musik_prst_2011.pdf",
    "grundschule|4|sachunterricht":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kc_sachunterricht_prst_2011.pdf",
    "grundschule|4|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_primarstufe_sport.pdf",
    "gymnasiale-oberstufe|11|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-biologie.pdf",
    "gymnasiale-oberstufe|11|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_chemie_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-chinesisch.pdf",
    "gymnasiale-oberstufe|11|darstellendes-spiel":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-darstellendes_spiel.pdf",
    "gymnasiale-oberstufe|11|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-deutsch.pdf",
    "gymnasiale-oberstufe|11|englisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-englisch.pdf",
    "gymnasiale-oberstufe|11|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-ethik.pdf",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_evangelische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-franzoesisch.pdf",
    "gymnasiale-oberstufe|11|geographie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-geographie.pdf",
    "gymnasiale-oberstufe|11|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-geschichte.pdf",
    "gymnasiale-oberstufe|11|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-griechisch.pdf",
    "gymnasiale-oberstufe|11|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-informatik.pdf",
    "gymnasiale-oberstufe|11|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-11/kcgo_islamische_religion_ditib_hessen_sunnitisch.pdf",
    "gymnasiale-oberstufe|11|italienisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_italienisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-juedische_religion.pdf",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_katholische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_kunst_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-latein.pdf",
    "gymnasiale-oberstufe|11|litauisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-litauisch.pdf",
    "gymnasiale-oberstufe|11|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-mathematik.pdf",
    "gymnasiale-oberstufe|11|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_musik_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|philosophie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_philosophie_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-physik.pdf",
    "gymnasiale-oberstufe|11|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_politik_und_wirtschaft_21.04.2026_0.pdf",
    "gymnasiale-oberstufe|11|polnisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-polnisch.pdf",
    "gymnasiale-oberstufe|11|russisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_russisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|11|spanisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-spanisch.pdf",
    "gymnasiale-oberstufe|11|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-sport.pdf",
    "gymnasiale-oberstufe|11|wirtschaftswissenschaften":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_wirtschaftswissenschaften_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-biologie.pdf",
    "gymnasiale-oberstufe|12|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_chemie_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-chinesisch.pdf",
    "gymnasiale-oberstufe|12|darstellendes-spiel":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-darstellendes_spiel.pdf",
    "gymnasiale-oberstufe|12|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-deutsch.pdf",
    "gymnasiale-oberstufe|12|englisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-englisch.pdf",
    "gymnasiale-oberstufe|12|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-ethik.pdf",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_evangelische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-franzoesisch.pdf",
    "gymnasiale-oberstufe|12|geographie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-geographie.pdf",
    "gymnasiale-oberstufe|12|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-geschichte.pdf",
    "gymnasiale-oberstufe|12|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-griechisch.pdf",
    "gymnasiale-oberstufe|12|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-informatik.pdf",
    "gymnasiale-oberstufe|12|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-11/kcgo_islamische_religion_ditib_hessen_sunnitisch.pdf",
    "gymnasiale-oberstufe|12|italienisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_italienisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-juedische_religion.pdf",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_katholische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_kunst_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-latein.pdf",
    "gymnasiale-oberstufe|12|litauisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-litauisch.pdf",
    "gymnasiale-oberstufe|12|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-mathematik.pdf",
    "gymnasiale-oberstufe|12|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_musik_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|philosophie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_philosophie_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-physik.pdf",
    "gymnasiale-oberstufe|12|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_politik_und_wirtschaft_21.04.2026_0.pdf",
    "gymnasiale-oberstufe|12|polnisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-polnisch.pdf",
    "gymnasiale-oberstufe|12|russisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_russisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|12|spanisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-spanisch.pdf",
    "gymnasiale-oberstufe|12|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-sport.pdf",
    "gymnasiale-oberstufe|12|wirtschaftswissenschaften":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_wirtschaftswissenschaften_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-biologie.pdf",
    "gymnasiale-oberstufe|13|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_chemie_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-chinesisch.pdf",
    "gymnasiale-oberstufe|13|darstellendes-spiel":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-darstellendes_spiel.pdf",
    "gymnasiale-oberstufe|13|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-deutsch.pdf",
    "gymnasiale-oberstufe|13|englisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-englisch.pdf",
    "gymnasiale-oberstufe|13|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-ethik.pdf",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_evangelische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-franzoesisch.pdf",
    "gymnasiale-oberstufe|13|geographie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-geographie.pdf",
    "gymnasiale-oberstufe|13|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-geschichte.pdf",
    "gymnasiale-oberstufe|13|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-griechisch.pdf",
    "gymnasiale-oberstufe|13|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-informatik.pdf",
    "gymnasiale-oberstufe|13|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-11/kcgo_islamische_religion_ditib_hessen_sunnitisch.pdf",
    "gymnasiale-oberstufe|13|italienisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_italienisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-juedische_religion.pdf",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_katholische_religion_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_kunst_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-latein.pdf",
    "gymnasiale-oberstufe|13|litauisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-litauisch.pdf",
    "gymnasiale-oberstufe|13|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-mathematik.pdf",
    "gymnasiale-oberstufe|13|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_musik_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|philosophie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_philosophie_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-physik.pdf",
    "gymnasiale-oberstufe|13|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_politik_und_wirtschaft_21.04.2026_0.pdf",
    "gymnasiale-oberstufe|13|polnisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kerncurriculum_gymnasiale_oberstufe-polnisch.pdf",
    "gymnasiale-oberstufe|13|russisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_russisch_21.04.2026.pdf",
    "gymnasiale-oberstufe|13|spanisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-spanisch.pdf",
    "gymnasiale-oberstufe|13|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2025-10/kernkurriculum_gymnasiale_oberstufe-sport.pdf",
    "gymnasiale-oberstufe|13|wirtschaftswissenschaften":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2026-07/kcgo_wirtschaftswissenschaften_21.04.2026.pdf",
    "gymnasium|5|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|5|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|5|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|5|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|5|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|5|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|5|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|5|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|5|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|5|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|5|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|5|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|5|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|5|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|5|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "gymnasium|6|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|6|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|6|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|6|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|6|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|6|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|6|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|6|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|6|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|6|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|6|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|6|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|6|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|6|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|6|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "gymnasium|7|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|7|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|7|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_gymnasium.pdf",
    "gymnasium|7|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_gymnasium-1.pdf",
    "gymnasium|7|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kch_sek1_gym_chinesisch_0.pdf",
    "gymnasium|7|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|7|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|7|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|7|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|7|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|7|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_griechisch_gymnasium.pdf",
    "gymnasium|7|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-08/kch_informatik.pdf",
    "gymnasium|7|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|7|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|7|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|7|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|7|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|7|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|7|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|7|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|7|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_uesekii_201102-uea.pdf",
    "gymnasium|7|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_gymnasium.pdf",
    "gymnasium|7|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "gymnasium|8|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|8|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|8|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_gymnasium.pdf",
    "gymnasium|8|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_gymnasium-1.pdf",
    "gymnasium|8|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kch_sek1_gym_chinesisch_0.pdf",
    "gymnasium|8|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|8|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|8|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|8|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|8|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|8|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_griechisch_gymnasium.pdf",
    "gymnasium|8|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-08/kch_informatik.pdf",
    "gymnasium|8|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|8|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|8|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|8|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|8|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|8|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|8|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|8|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|8|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_uesekii_201102-uea.pdf",
    "gymnasium|8|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_gymnasium.pdf",
    "gymnasium|8|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "gymnasium|9|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|9|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|9|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_gymnasium.pdf",
    "gymnasium|9|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_gymnasium-1.pdf",
    "gymnasium|9|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kch_sek1_gym_chinesisch_0.pdf",
    "gymnasium|9|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|9|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|9|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|9|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|9|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|9|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_griechisch_gymnasium.pdf",
    "gymnasium|9|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-08/kch_informatik.pdf",
    "gymnasium|9|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|9|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|9|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|9|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|9|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|9|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|9|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|9|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|9|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_uesekii_201102-uea.pdf",
    "gymnasium|9|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_gymnasium.pdf",
    "gymnasium|9|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "gymnasium|10|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_gymnasium.pdf",
    "gymnasium|10|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|10|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_gymnasium.pdf",
    "gymnasium|10|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_gymnasium-1.pdf",
    "gymnasium|10|chinesisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kch_sek1_gym_chinesisch_0.pdf",
    "gymnasium|10|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_gymnasium.pdf",
    "gymnasium|10|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_gymnasium.pdf",
    "gymnasium|10|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_gymnasium.pdf",
    "gymnasium|10|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_gymnasium.pdf",
    "gymnasium|10|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_gymnasium.pdf",
    "gymnasium|10|griechisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_griechisch_gymnasium.pdf",
    "gymnasium|10|informatik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-08/kch_informatik.pdf",
    "gymnasium|10|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/gym_ditib-he_kc_iru.pdf",
    "gymnasium|10|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_gy.pdf",
    "gymnasium|10|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_gymnasium.pdf",
    "gymnasium|10|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_gymnasium.pdf",
    "gymnasium|10|latein":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_latein_gymnasium.pdf",
    "gymnasium|10|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_gymnasium.pdf",
    "gymnasium|10|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_gymnasium.pdf",
    "gymnasium|10|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_gymnasium.pdf",
    "gymnasium|10|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_uesekii_201102-uea.pdf",
    "gymnasium|10|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_gymnasium.pdf",
    "gymnasium|10|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_gymnasium.pdf",
    "hauptschule|5|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_hauptschule_0.pdf",
    "hauptschule|5|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_hauptschule.pdf",
    "hauptschule|5|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_hauptschule.pdf",
    "hauptschule|5|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_hauptschule.pdf",
    "hauptschule|5|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_hauptschule.pdf",
    "hauptschule|5|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion.pdf",
    "hauptschule|5|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_hauptschule.pdf",
    "hauptschule|5|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/hs_ditib-he_kcpdf.pdf",
    "hauptschule|5|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_hs.pdf",
    "hauptschule|5|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_hauptschule.pdf",
    "hauptschule|5|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_hauptschule.pdf",
    "hauptschule|5|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_hauptschule.pdf",
    "hauptschule|5|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_moderne_fremdsprachen_hauptschule.pdf",
    "hauptschule|5|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_hauptschule.pdf",
    "hauptschule|5|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_hauptschule-1.pdf",
    "hauptschule|6|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_hauptschule_0.pdf",
    "hauptschule|6|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_hauptschule.pdf",
    "hauptschule|6|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_hauptschule.pdf",
    "hauptschule|6|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_hauptschule.pdf",
    "hauptschule|6|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_hauptschule.pdf",
    "hauptschule|6|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion.pdf",
    "hauptschule|6|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_hauptschule.pdf",
    "hauptschule|6|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/hs_ditib-he_kcpdf.pdf",
    "hauptschule|6|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_hs.pdf",
    "hauptschule|6|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_hauptschule.pdf",
    "hauptschule|6|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_hauptschule.pdf",
    "hauptschule|6|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_hauptschule.pdf",
    "hauptschule|6|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_moderne_fremdsprachen_hauptschule.pdf",
    "hauptschule|6|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_hauptschule.pdf",
    "hauptschule|6|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_hauptschule-1.pdf",
    "hauptschule|7|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_hauptschule_0.pdf",
    "hauptschule|7|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_hauptschule.pdf",
    "hauptschule|7|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_hauptschule.pdf",
    "hauptschule|7|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_hauptschule.pdf",
    "hauptschule|7|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_hauptschule.pdf",
    "hauptschule|7|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_hauptschule.pdf",
    "hauptschule|7|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_hauptschule.pdf",
    "hauptschule|7|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion.pdf",
    "hauptschule|7|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_hauptschule.pdf",
    "hauptschule|7|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/hs_ditib-he_kcpdf.pdf",
    "hauptschule|7|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_hs.pdf",
    "hauptschule|7|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_hauptschule.pdf",
    "hauptschule|7|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_hauptschule.pdf",
    "hauptschule|7|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_hauptschule.pdf",
    "hauptschule|7|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_moderne_fremdsprachen_hauptschule.pdf",
    "hauptschule|7|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_hauptschule.pdf",
    "hauptschule|7|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_hsa_201102-uea.pdf",
    "hauptschule|7|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_hauptschule.pdf",
    "hauptschule|7|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_hauptschule-1.pdf",
    "hauptschule|8|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_hauptschule_0.pdf",
    "hauptschule|8|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_hauptschule.pdf",
    "hauptschule|8|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_hauptschule.pdf",
    "hauptschule|8|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_hauptschule.pdf",
    "hauptschule|8|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_hauptschule.pdf",
    "hauptschule|8|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_hauptschule.pdf",
    "hauptschule|8|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_hauptschule.pdf",
    "hauptschule|8|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion.pdf",
    "hauptschule|8|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_hauptschule.pdf",
    "hauptschule|8|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/hs_ditib-he_kcpdf.pdf",
    "hauptschule|8|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_hs.pdf",
    "hauptschule|8|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_hauptschule.pdf",
    "hauptschule|8|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_hauptschule.pdf",
    "hauptschule|8|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_hauptschule.pdf",
    "hauptschule|8|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_moderne_fremdsprachen_hauptschule.pdf",
    "hauptschule|8|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_hauptschule.pdf",
    "hauptschule|8|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_hsa_201102-uea.pdf",
    "hauptschule|8|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_hauptschule.pdf",
    "hauptschule|8|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_hauptschule-1.pdf",
    "hauptschule|9|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_hauptschule_0.pdf",
    "hauptschule|9|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_hauptschule.pdf",
    "hauptschule|9|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_hauptschule.pdf",
    "hauptschule|9|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_hauptschule.pdf",
    "hauptschule|9|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_hauptschule.pdf",
    "hauptschule|9|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_hauptschule.pdf",
    "hauptschule|9|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_hauptschule.pdf",
    "hauptschule|9|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion.pdf",
    "hauptschule|9|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_hauptschule.pdf",
    "hauptschule|9|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/hs_ditib-he_kcpdf.pdf",
    "hauptschule|9|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_hs.pdf",
    "hauptschule|9|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_hauptschule.pdf",
    "hauptschule|9|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_hauptschule.pdf",
    "hauptschule|9|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_hauptschule.pdf",
    "hauptschule|9|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_moderne_fremdsprachen_hauptschule.pdf",
    "hauptschule|9|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_hauptschule.pdf",
    "hauptschule|9|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_hsa_201102-uea.pdf",
    "hauptschule|9|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_hauptschule.pdf",
    "hauptschule|9|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_hauptschule-1.pdf",
    "realschule|5|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|5|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|5|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|5|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|5|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|5|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|5|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|5|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|5|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|5|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|5|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|5|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|5|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|5|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|5|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
    "realschule|6|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|6|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|6|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|6|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|6|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|6|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|6|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|6|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|6|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|6|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|6|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|6|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|6|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|6|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|6|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
    "realschule|7|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|7|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_realschule.pdf",
    "realschule|7|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|7|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_realschule.pdf",
    "realschule|7|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_realschule.pdf",
    "realschule|7|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|7|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|7|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|7|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|7|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|7|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|7|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|7|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|7|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|7|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|7|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|7|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|7|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_msa_201102-uea.pdf",
    "realschule|7|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_realschule.pdf",
    "realschule|7|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
    "realschule|8|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|8|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_realschule.pdf",
    "realschule|8|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|8|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_realschule.pdf",
    "realschule|8|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_realschule.pdf",
    "realschule|8|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|8|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|8|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|8|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|8|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|8|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|8|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|8|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|8|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|8|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|8|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|8|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|8|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_msa_201102-uea.pdf",
    "realschule|8|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_realschule.pdf",
    "realschule|8|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
    "realschule|9|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|9|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_realschule.pdf",
    "realschule|9|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|9|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_realschule.pdf",
    "realschule|9|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_realschule.pdf",
    "realschule|9|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|9|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|9|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|9|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|9|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|9|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|9|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|9|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|9|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|9|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|9|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|9|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|9|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_msa_201102-uea.pdf",
    "realschule|9|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_realschule.pdf",
    "realschule|9|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
    "realschule|10|alevitische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_alevitische_religion_realschule.pdf",
    "realschule|10|arabisch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_arabisch_-_sekundarstufe_i_realschule.pdf",
    "realschule|10|arbeitslehre":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_arbeitslehre_realschule.pdf",
    "realschule|10|biologie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_biologie_realschule.pdf",
    "realschule|10|chemie":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_chemie_realschule.pdf",
    "realschule|10|deutsch":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_deutsch_realschule.pdf",
    "realschule|10|erdkunde":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_erdkunde_realschule.pdf",
    "realschule|10|ethik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-06/kerncurriculum_ethik_realschule.pdf",
    "realschule|10|evangelische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_evangelische_religion_realschule.pdf",
    "realschule|10|geschichte":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_geschichte_realschule.pdf",
    "realschule|10|islamische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-06/rs_ditib-he_kc_iru.pdf",
    "realschule|10|juedische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kc_jr_rs.pdf",
    "realschule|10|katholische-religion":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_katholische_religion_realschule.pdf",
    "realschule|10|kunst":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_kunst_realschule.pdf",
    "realschule|10|mathematik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_mathematik_realschule.pdf",
    "realschule|10|moderne-fremdsprachen":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2023-07/2023_-_kerncurriculum_moderne_fremdsprachen_-_sekundarstufe_i_realschule.pdf",
    "realschule|10|musik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_musik_realschule.pdf",
    "realschule|10|physik":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-02/kc_physik_msa_201102-uea.pdf",
    "realschule|10|politik-wirtschaft":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_politik_und_wirtschaft_realschule.pdf",
    "realschule|10|sport":
      "https://kultus.hessen.de/sites/kultus.hessen.de/files/2021-07/kerncurriculum_sport_realschule.pdf",
  },

  catalogPaths: [
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "ethik" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "moderne-fremdsprachen" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "ethik" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "moderne-fremdsprachen" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "ethik" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "moderne-fremdsprachen" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "ethik" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "moderne-fremdsprachen" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chinesisch" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "englisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "italienisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "litauisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "politik-wirtschaft",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "wirtschaftswissenschaften",
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "englisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "italienisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "litauisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "politik-wirtschaft",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "wirtschaftswissenschaften",
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "englisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geographie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "geschichte" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "griechisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "informatik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "islamische-religion",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "italienisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "kunst" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "latein" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "litauisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "mathematik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "musik" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "philosophie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "physik" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "politik-wirtschaft",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "polnisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "russisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "wirtschaftswissenschaften",
    },
    { schoolType: "gymnasium", grade: "5", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "arabisch" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "politik-wirtschaft" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "arabisch" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "politik-wirtschaft" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "arabisch" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "politik-wirtschaft" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "arabisch" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "chinesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "moderne-fremdsprachen" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "politik-wirtschaft" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "hauptschule", grade: "5", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "5", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "5", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "5", subject: "ethik" },
    { schoolType: "hauptschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "5", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "juedische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "5", subject: "kunst" },
    { schoolType: "hauptschule", grade: "5", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "5", subject: "moderne-fremdsprachen" },
    { schoolType: "hauptschule", grade: "5", subject: "musik" },
    { schoolType: "hauptschule", grade: "5", subject: "sport" },
    { schoolType: "hauptschule", grade: "6", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "6", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "6", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "6", subject: "ethik" },
    { schoolType: "hauptschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "6", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "juedische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "6", subject: "kunst" },
    { schoolType: "hauptschule", grade: "6", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "6", subject: "moderne-fremdsprachen" },
    { schoolType: "hauptschule", grade: "6", subject: "musik" },
    { schoolType: "hauptschule", grade: "6", subject: "sport" },
    { schoolType: "hauptschule", grade: "7", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "7", subject: "biologie" },
    { schoolType: "hauptschule", grade: "7", subject: "chemie" },
    { schoolType: "hauptschule", grade: "7", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "7", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "7", subject: "ethik" },
    { schoolType: "hauptschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "7", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "juedische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "7", subject: "kunst" },
    { schoolType: "hauptschule", grade: "7", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "7", subject: "moderne-fremdsprachen" },
    { schoolType: "hauptschule", grade: "7", subject: "musik" },
    { schoolType: "hauptschule", grade: "7", subject: "physik" },
    { schoolType: "hauptschule", grade: "7", subject: "politik-wirtschaft" },
    { schoolType: "hauptschule", grade: "7", subject: "sport" },
    { schoolType: "hauptschule", grade: "8", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "8", subject: "biologie" },
    { schoolType: "hauptschule", grade: "8", subject: "chemie" },
    { schoolType: "hauptschule", grade: "8", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "8", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "8", subject: "ethik" },
    { schoolType: "hauptschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "8", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "juedische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "8", subject: "kunst" },
    { schoolType: "hauptschule", grade: "8", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "8", subject: "moderne-fremdsprachen" },
    { schoolType: "hauptschule", grade: "8", subject: "musik" },
    { schoolType: "hauptschule", grade: "8", subject: "physik" },
    { schoolType: "hauptschule", grade: "8", subject: "politik-wirtschaft" },
    { schoolType: "hauptschule", grade: "8", subject: "sport" },
    { schoolType: "hauptschule", grade: "9", subject: "alevitische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "arbeitslehre" },
    { schoolType: "hauptschule", grade: "9", subject: "biologie" },
    { schoolType: "hauptschule", grade: "9", subject: "chemie" },
    { schoolType: "hauptschule", grade: "9", subject: "deutsch" },
    { schoolType: "hauptschule", grade: "9", subject: "erdkunde" },
    { schoolType: "hauptschule", grade: "9", subject: "ethik" },
    { schoolType: "hauptschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "geschichte" },
    { schoolType: "hauptschule", grade: "9", subject: "islamische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "juedische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "hauptschule", grade: "9", subject: "kunst" },
    { schoolType: "hauptschule", grade: "9", subject: "mathematik" },
    { schoolType: "hauptschule", grade: "9", subject: "moderne-fremdsprachen" },
    { schoolType: "hauptschule", grade: "9", subject: "musik" },
    { schoolType: "hauptschule", grade: "9", subject: "physik" },
    { schoolType: "hauptschule", grade: "9", subject: "politik-wirtschaft" },
    { schoolType: "hauptschule", grade: "9", subject: "sport" },
    { schoolType: "realschule", grade: "5", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "5", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "5", subject: "deutsch" },
    { schoolType: "realschule", grade: "5", subject: "erdkunde" },
    { schoolType: "realschule", grade: "5", subject: "ethik" },
    { schoolType: "realschule", grade: "5", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "5", subject: "geschichte" },
    { schoolType: "realschule", grade: "5", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "5", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "5", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "5", subject: "kunst" },
    { schoolType: "realschule", grade: "5", subject: "mathematik" },
    { schoolType: "realschule", grade: "5", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "5", subject: "musik" },
    { schoolType: "realschule", grade: "5", subject: "sport" },
    { schoolType: "realschule", grade: "6", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "6", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "6", subject: "deutsch" },
    { schoolType: "realschule", grade: "6", subject: "erdkunde" },
    { schoolType: "realschule", grade: "6", subject: "ethik" },
    { schoolType: "realschule", grade: "6", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "6", subject: "geschichte" },
    { schoolType: "realschule", grade: "6", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "6", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "6", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "6", subject: "kunst" },
    { schoolType: "realschule", grade: "6", subject: "mathematik" },
    { schoolType: "realschule", grade: "6", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "6", subject: "musik" },
    { schoolType: "realschule", grade: "6", subject: "sport" },
    { schoolType: "realschule", grade: "7", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "7", subject: "arabisch" },
    { schoolType: "realschule", grade: "7", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "7", subject: "biologie" },
    { schoolType: "realschule", grade: "7", subject: "chemie" },
    { schoolType: "realschule", grade: "7", subject: "deutsch" },
    { schoolType: "realschule", grade: "7", subject: "erdkunde" },
    { schoolType: "realschule", grade: "7", subject: "ethik" },
    { schoolType: "realschule", grade: "7", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "7", subject: "geschichte" },
    { schoolType: "realschule", grade: "7", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "7", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "7", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "7", subject: "kunst" },
    { schoolType: "realschule", grade: "7", subject: "mathematik" },
    { schoolType: "realschule", grade: "7", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "7", subject: "musik" },
    { schoolType: "realschule", grade: "7", subject: "physik" },
    { schoolType: "realschule", grade: "7", subject: "politik-wirtschaft" },
    { schoolType: "realschule", grade: "7", subject: "sport" },
    { schoolType: "realschule", grade: "8", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "8", subject: "arabisch" },
    { schoolType: "realschule", grade: "8", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "8", subject: "biologie" },
    { schoolType: "realschule", grade: "8", subject: "chemie" },
    { schoolType: "realschule", grade: "8", subject: "deutsch" },
    { schoolType: "realschule", grade: "8", subject: "erdkunde" },
    { schoolType: "realschule", grade: "8", subject: "ethik" },
    { schoolType: "realschule", grade: "8", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "8", subject: "geschichte" },
    { schoolType: "realschule", grade: "8", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "8", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "8", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "8", subject: "kunst" },
    { schoolType: "realschule", grade: "8", subject: "mathematik" },
    { schoolType: "realschule", grade: "8", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "8", subject: "musik" },
    { schoolType: "realschule", grade: "8", subject: "physik" },
    { schoolType: "realschule", grade: "8", subject: "politik-wirtschaft" },
    { schoolType: "realschule", grade: "8", subject: "sport" },
    { schoolType: "realschule", grade: "9", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "9", subject: "arabisch" },
    { schoolType: "realschule", grade: "9", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "9", subject: "biologie" },
    { schoolType: "realschule", grade: "9", subject: "chemie" },
    { schoolType: "realschule", grade: "9", subject: "deutsch" },
    { schoolType: "realschule", grade: "9", subject: "erdkunde" },
    { schoolType: "realschule", grade: "9", subject: "ethik" },
    { schoolType: "realschule", grade: "9", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "9", subject: "geschichte" },
    { schoolType: "realschule", grade: "9", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "9", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "9", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "9", subject: "kunst" },
    { schoolType: "realschule", grade: "9", subject: "mathematik" },
    { schoolType: "realschule", grade: "9", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "9", subject: "musik" },
    { schoolType: "realschule", grade: "9", subject: "physik" },
    { schoolType: "realschule", grade: "9", subject: "politik-wirtschaft" },
    { schoolType: "realschule", grade: "9", subject: "sport" },
    { schoolType: "realschule", grade: "10", subject: "alevitische-religion" },
    { schoolType: "realschule", grade: "10", subject: "arabisch" },
    { schoolType: "realschule", grade: "10", subject: "arbeitslehre" },
    { schoolType: "realschule", grade: "10", subject: "biologie" },
    { schoolType: "realschule", grade: "10", subject: "chemie" },
    { schoolType: "realschule", grade: "10", subject: "deutsch" },
    { schoolType: "realschule", grade: "10", subject: "erdkunde" },
    { schoolType: "realschule", grade: "10", subject: "ethik" },
    { schoolType: "realschule", grade: "10", subject: "evangelische-religion" },
    { schoolType: "realschule", grade: "10", subject: "geschichte" },
    { schoolType: "realschule", grade: "10", subject: "islamische-religion" },
    { schoolType: "realschule", grade: "10", subject: "juedische-religion" },
    { schoolType: "realschule", grade: "10", subject: "katholische-religion" },
    { schoolType: "realschule", grade: "10", subject: "kunst" },
    { schoolType: "realschule", grade: "10", subject: "mathematik" },
    { schoolType: "realschule", grade: "10", subject: "moderne-fremdsprachen" },
    { schoolType: "realschule", grade: "10", subject: "musik" },
    { schoolType: "realschule", grade: "10", subject: "physik" },
    { schoolType: "realschule", grade: "10", subject: "politik-wirtschaft" },
    { schoolType: "realschule", grade: "10", subject: "sport" },
  ],
};
