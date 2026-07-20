import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface ShCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Schleswig-Holstein Fachanforderungen / Lehrpläne catalog
 * (https://fachportal.lernnetz.de/sh/fachanforderungen.html).
 *
 * Captured 2026-07-20. Content URLs are PDFs on fachportal.lernnetz.de.
 * - Biologie/Chemie/Physik Sekundarstufe: current Fachanforderungen (2026)
 * - Other subjects: Lehrpläne listed on the official portal (archive section
 *   "Historische Lehrpläne" remains the downloadable subject corpus for GS,
 *   Sek I and Sek II where no newer free PDF is published).
 * Anhörungsfassungen, außer Kraft gesetzte editions and Sonderpädagogik
 * framework plans are out of scope.
 */
export interface FachanforderungenShManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: ShCatalogPath[];
}

export const FACHANFORDERUNGEN_SH_MANIFEST: FachanforderungenShManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "IQSH Fachportal – Fachanforderungen und Lehrpläne SH",

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
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    gemeinschaftsschule: ["5", "6", "7", "8", "9", "10"],
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
        id: "englisch",
        label: "Englisch",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religion",
      },
      {
        id: "sachunterricht",
        label: "Heimat- und Sachunterricht",
      },
      {
        id: "islamunterricht",
        label: "Islamunterricht",
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
        id: "philosophie",
        label: "Philosophie",
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
        id: "textillehre",
        label: "Textillehre",
      },
    ],
    gemeinschaftsschule: [
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "daenisch",
        label: "Dänisch",
      },
      {
        id: "darstellendes-spiel",
        label: "Darstellendes Spiel / Theater",
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
        id: "gestalten",
        label: "Gestalten",
      },
      {
        id: "griechisch",
        label: "Griechisch",
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
        id: "textillehre",
        label: "Textillehre",
      },
      {
        id: "weltkunde",
        label: "Weltkunde",
      },
      {
        id: "wirtschaft-politik",
        label: "Wirtschaft/Politik",
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
        id: "daenisch",
        label: "Dänisch",
      },
      {
        id: "darstellendes-spiel",
        label: "Darstellendes Spiel / Theater",
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
        id: "gestalten",
        label: "Gestalten",
      },
      {
        id: "griechisch",
        label: "Griechisch",
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
        id: "textillehre",
        label: "Textillehre",
      },
      {
        id: "weltkunde",
        label: "Weltkunde",
      },
      {
        id: "wirtschaft-politik",
        label: "Wirtschaft/Politik",
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
        id: "chinesisch",
        label: "Chinesisch",
      },
      {
        id: "daenisch",
        label: "Dänisch",
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
        id: "wirtschaft-politik",
        label: "Wirtschaft/Politik",
      },
    ],
  },

  tracks: {},

  topics: {
    "gemeinschaftsschule|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|5|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|darstellendes-spiel": [
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
    "gemeinschaftsschule|5|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|5|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|5|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|5|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|5|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|5|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|5|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|6|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|darstellendes-spiel": [
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
    "gemeinschaftsschule|6|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|6|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|6|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|6|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule|6|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|russisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|6|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|6|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
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
    "gemeinschaftsschule|7|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|darstellendes-spiel": [
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
    "gemeinschaftsschule|7|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|7|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|7|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|7|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|7|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|7|philosophie": [
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
    "gemeinschaftsschule|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|7|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|7|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|7|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gemeinschaftsschule|8|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|darstellendes-spiel": [
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
    "gemeinschaftsschule|8|erdkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|8|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|8|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|8|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|8|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|8|philosophie": [
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
    "gemeinschaftsschule|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|8|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|8|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|8|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gemeinschaftsschule|9|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|9|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|9|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|9|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|9|philosophie": [
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
    "gemeinschaftsschule|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|9|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|9|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|9|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gemeinschaftsschule|10|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|darstellendes-spiel": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule|10|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|10|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule|10|kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "gemeinschaftsschule|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule|10|philosophie": [
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
    "gemeinschaftsschule|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gemeinschaftsschule|10|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gemeinschaftsschule|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule|10|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gemeinschaftsschule|10|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "grundschule|1|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|islamunterricht": [
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
    "grundschule|1|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|1|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|1|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|1|textillehre": [
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
    "grundschule|2|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|islamunterricht": [
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
    "grundschule|2|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|2|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|2|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|textillehre": [
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
    "grundschule|3|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|islamunterricht": [
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
    "grundschule|3|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|3|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|3|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|textillehre": [
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
    "grundschule|4|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|islamunterricht": [
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
    "grundschule|4|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "grundschule|4|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
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
    "grundschule|4|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasiale-oberstufe|11|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|daenisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|erdkunde": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|11|wirtschaft-politik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|daenisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|erdkunde": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|12|wirtschaft-politik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|daenisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|erdkunde": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|evangelische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|griechisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|katholische-religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|latein": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasiale-oberstufe|13|wirtschaft-politik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "gymnasium|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|5|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|5|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
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
    "gymnasium|5|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|5|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|5|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|6|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|6|naturwissenschaften": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|philosophie": [
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
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|6|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
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
    "gymnasium|7|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|7|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|7|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
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
    "gymnasium|7|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|7|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|7|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gymnasium|8|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|8|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|8|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
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
    "gymnasium|8|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|8|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|8|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gymnasium|9|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|9|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|9|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
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
    "gymnasium|9|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|9|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|9|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
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
    "gymnasium|10|daenisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen" },
      { id: "ethik", label: "Ethische Fragen" },
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
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|10|gestalten": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|10|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
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
    "gymnasium|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
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
    "gymnasium|10|spanisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
    ],
    "gymnasium|10|sport": [
      { id: "bewegen", label: "Bewegen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit" },
    ],
    "gymnasium|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|textillehre": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|weltkunde": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|10|wirtschaft-politik": [
      { id: "politik", label: "Politik" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "gesellschaft", label: "Gesellschaft" },
    ],
  },

  contentUrls: {
    "gemeinschaftsschule|5|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|5|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|naturwissenschaften":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Naturwissenschaften%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|5|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|6|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|naturwissenschaften":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Naturwissenschaften%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|6|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|7|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|7|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|7|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|7|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|8|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|8|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|8|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|8|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|9|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|9|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|9|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|9|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|10|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|10|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gemeinschaftsschule|10|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gemeinschaftsschule|10|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "grundschule|1|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Deutsch%20Grunschule.pdf",
    "grundschule|1|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Rahmenplan%20Englisch%20Grundschule.pdf",
    "grundschule|1|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Evangelische%20Religion%20Grunschule.pdf",
    "grundschule|1|islamunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Islamunterricht%20Grundschule.pdf",
    "grundschule|1|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Katholische%20Religion%20Grundschule.pdf",
    "grundschule|1|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Kunst%20Grundschule.pdf",
    "grundschule|1|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Mathematik%20Grundschule.pdf",
    "grundschule|1|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Musik%20Grundschule.pdf",
    "grundschule|1|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Philosophie%20Grundschule.pdf",
    "grundschule|1|sachunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Heimat-%20und%20Sachunterricht%20Grunschule.pdf",
    "grundschule|1|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Sport%20Grundschule.pdf",
    "grundschule|1|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Technik%20Grundschule.pdf",
    "grundschule|1|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Textillehre%20Grundschule.pdf",
    "grundschule|2|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Deutsch%20Grunschule.pdf",
    "grundschule|2|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Rahmenplan%20Englisch%20Grundschule.pdf",
    "grundschule|2|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Evangelische%20Religion%20Grunschule.pdf",
    "grundschule|2|islamunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Islamunterricht%20Grundschule.pdf",
    "grundschule|2|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Katholische%20Religion%20Grundschule.pdf",
    "grundschule|2|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Kunst%20Grundschule.pdf",
    "grundschule|2|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Mathematik%20Grundschule.pdf",
    "grundschule|2|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Musik%20Grundschule.pdf",
    "grundschule|2|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Philosophie%20Grundschule.pdf",
    "grundschule|2|sachunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Heimat-%20und%20Sachunterricht%20Grunschule.pdf",
    "grundschule|2|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Sport%20Grundschule.pdf",
    "grundschule|2|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Technik%20Grundschule.pdf",
    "grundschule|2|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Textillehre%20Grundschule.pdf",
    "grundschule|3|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Deutsch%20Grunschule.pdf",
    "grundschule|3|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Rahmenplan%20Englisch%20Grundschule.pdf",
    "grundschule|3|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Evangelische%20Religion%20Grunschule.pdf",
    "grundschule|3|islamunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Islamunterricht%20Grundschule.pdf",
    "grundschule|3|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Katholische%20Religion%20Grundschule.pdf",
    "grundschule|3|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Kunst%20Grundschule.pdf",
    "grundschule|3|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Mathematik%20Grundschule.pdf",
    "grundschule|3|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Musik%20Grundschule.pdf",
    "grundschule|3|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Philosophie%20Grundschule.pdf",
    "grundschule|3|sachunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Heimat-%20und%20Sachunterricht%20Grunschule.pdf",
    "grundschule|3|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Sport%20Grundschule.pdf",
    "grundschule|3|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Technik%20Grundschule.pdf",
    "grundschule|3|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Textillehre%20Grundschule.pdf",
    "grundschule|4|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Deutsch%20Grunschule.pdf",
    "grundschule|4|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Rahmenplan%20Englisch%20Grundschule.pdf",
    "grundschule|4|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Evangelische%20Religion%20Grunschule.pdf",
    "grundschule|4|islamunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Islamunterricht%20Grundschule.pdf",
    "grundschule|4|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Katholische%20Religion%20Grundschule.pdf",
    "grundschule|4|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Kunst%20Grundschule.pdf",
    "grundschule|4|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Mathematik%20Grundschule.pdf",
    "grundschule|4|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Musik%20Grundschule.pdf",
    "grundschule|4|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Philosophie%20Grundschule.pdf",
    "grundschule|4|sachunterricht":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Heimat-%20und%20Sachunterricht%20Grunschule.pdf",
    "grundschule|4|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Sport%20Grundschule.pdf",
    "grundschule|4|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Technik%20Grundschule.pdf",
    "grundschule|4|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Grundschule/Lehrplan%20Textillehre%20Grundschule.pdf",
    "gymnasiale-oberstufe|11|bildende-kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Bildende%20Kunst%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|11|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|11|chinesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Chinesisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Deutsch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Englisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Erdkunde%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Geschichte%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Griechisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|informatik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Informatik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Latein%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Mathematik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Musik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Philosophie%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|11|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Russisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Spanisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Sport%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|11|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|bildende-kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Bildende%20Kunst%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|12|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|12|chinesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Chinesisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Deutsch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Englisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Erdkunde%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Geschichte%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Griechisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|informatik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Informatik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Latein%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Mathematik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Musik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Philosophie%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|12|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Russisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Spanisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Sport%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|12|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|bildende-kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Bildende%20Kunst%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|13|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|13|chinesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Chinesisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Deutsch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Englisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Erdkunde%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Geschichte%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Griechisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|informatik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Informatik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Latein%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Mathematik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Musik%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Philosophie%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasiale-oberstufe|13|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Russisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Spanisch%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Sport%20Sekundarstufe%20II.pdf",
    "gymnasiale-oberstufe|13|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20II/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20II.pdf",
    "gymnasium|5|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|5|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|5|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|5|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|5|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|5|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|5|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|5|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|5|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|5|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|5|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|5|naturwissenschaften":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Naturwissenschaften%20Sekundarstufe%20I.pdf",
    "gymnasium|5|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|5|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|5|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|5|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|5|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|5|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|6|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|6|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|6|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|6|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|6|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|6|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|6|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|6|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|6|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|6|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|6|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|6|naturwissenschaften":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Naturwissenschaften%20Sekundarstufe%20I.pdf",
    "gymnasium|6|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|6|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|6|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|6|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|6|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|6|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|7|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|7|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|7|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|7|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|7|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|7|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|7|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|7|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|7|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|7|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|7|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|7|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|7|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|7|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasium|7|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|7|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|7|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|7|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|7|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|7|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gymnasium|8|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|8|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|8|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|8|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|8|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|8|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|8|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|8|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|8|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|8|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|8|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|8|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|8|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|8|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasium|8|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|8|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|8|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|8|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|8|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|8|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gymnasium|9|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|9|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|9|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|9|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|9|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|9|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|9|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|9|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|9|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|9|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|9|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|9|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|9|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|9|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasium|9|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|9|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|9|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|9|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|9|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|9|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
    "gymnasium|10|biologie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Biologie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|10|chemie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Chemie%20Sekundarstufe%20(2026).pdf",
    "gymnasium|10|daenisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20D%C3%A4nisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|darstellendes-spiel":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Darstellendes%20Spiel%20Theater%20Sekundarstufe%20I.pdf",
    "gymnasium|10|deutsch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Deutsch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|englisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Englisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|erdkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Erdkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|10|evangelische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Evangelische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|10|franzoesisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Franz%C3%B6sisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|geschichte":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Geschichte%20Sekundarstufe%20I.pdf",
    "gymnasium|10|gestalten":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Gestalten%20Sekundarstufe%20I.pdf",
    "gymnasium|10|griechisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Griechisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|katholische-religion":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Katholische%20Religion%20Sekundarstufe%20I.pdf",
    "gymnasium|10|kunst":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Kunst%20Sekundarstufe%20I.pdf",
    "gymnasium|10|latein":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Latein%20Sekundarstufe%20I.pdf",
    "gymnasium|10|mathematik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Mathematik%20Sekundarstufe%20I.pdf",
    "gymnasium|10|musik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Musik%20Sekundarstufe%20I.pdf",
    "gymnasium|10|philosophie":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Philosophie%20Sekundarstufe%20I.pdf",
    "gymnasium|10|physik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Sekundarstufe/Fachanforderungen/Fachanforderungen%20Physik%20Sekundarstufe%20(2026).pdf",
    "gymnasium|10|russisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Russisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|spanisch":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Spanisch%20Sekundarstufe%20I.pdf",
    "gymnasium|10|sport":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Sport%20Sekundarstufe%20I.pdf",
    "gymnasium|10|technik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Technik%20Sekundarstufe%20I.pdf",
    "gymnasium|10|textillehre":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Textillehre%20Sekundarstufe%20I.pdf",
    "gymnasium|10|weltkunde":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Weltkunde%20Sekundarstufe%20I.pdf",
    "gymnasium|10|wirtschaft-politik":
      "https://fachportal.lernnetz.de/files/Fachanforderungen%20und%20Leitf%C3%A4den/Historische%20Lehrpl%C3%A4ne/Sekundarstufe%20I/Lehrplan%20Wirtschaft%20Politik%20Sekundarstufe%20I.pdf",
  },

  catalogPaths: [
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "geschichte" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "gestalten" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "5",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "5", subject: "weltkunde" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "geschichte" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "gestalten" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "musik" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "6",
      subject: "naturwissenschaften",
    },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "6", subject: "weltkunde" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "geschichte" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "gestalten" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "griechisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "7", subject: "weltkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "wirtschaft-politik",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "darstellendes-spiel",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "deutsch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "englisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "erdkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "evangelische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "franzoesisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "geschichte" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "gestalten" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "griechisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "8", subject: "weltkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "8",
      subject: "wirtschaft-politik",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "darstellendes-spiel",
    },
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
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "gestalten" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "griechisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "9", subject: "weltkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "wirtschaft-politik",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "biologie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "chemie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "daenisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "darstellendes-spiel",
    },
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
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "gestalten" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "griechisch" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "katholische-religion",
    },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "kunst" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "latein" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "mathematik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "musik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "philosophie" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "physik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "russisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "spanisch" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "sport" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "technik" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "textillehre" },
    { schoolType: "gemeinschaftsschule", grade: "10", subject: "weltkunde" },
    {
      schoolType: "gemeinschaftsschule",
      grade: "10",
      subject: "wirtschaft-politik",
    },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "islamunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "philosophie" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "technik" },
    { schoolType: "grundschule", grade: "1", subject: "textillehre" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "islamunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "philosophie" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "technik" },
    { schoolType: "grundschule", grade: "2", subject: "textillehre" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "islamunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "philosophie" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "technik" },
    { schoolType: "grundschule", grade: "3", subject: "textillehre" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "islamunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "philosophie" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "technik" },
    { schoolType: "grundschule", grade: "4", subject: "textillehre" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "daenisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "11",
      subject: "wirtschaft-politik",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "daenisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "12",
      subject: "wirtschaft-politik",
    },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "bildende-kunst",
    },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "biologie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chemie" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "chinesisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "daenisch" },
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
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "spanisch" },
    { schoolType: "gymnasiale-oberstufe", grade: "13", subject: "sport" },
    {
      schoolType: "gymnasiale-oberstufe",
      grade: "13",
      subject: "wirtschaft-politik",
    },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "5", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "5", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "5", subject: "russisch" },
    { schoolType: "gymnasium", grade: "5", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "technik" },
    { schoolType: "gymnasium", grade: "5", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "5", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "6", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "naturwissenschaften" },
    { schoolType: "gymnasium", grade: "6", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "6", subject: "russisch" },
    { schoolType: "gymnasium", grade: "6", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "technik" },
    { schoolType: "gymnasium", grade: "6", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "6", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "7", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "russisch" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "technik" },
    { schoolType: "gymnasium", grade: "7", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "7", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "7", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "8", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "russisch" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "technik" },
    { schoolType: "gymnasium", grade: "8", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "8", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "8", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "9", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "russisch" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "technik" },
    { schoolType: "gymnasium", grade: "9", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "9", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "9", subject: "wirtschaft-politik" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "daenisch" },
    { schoolType: "gymnasium", grade: "10", subject: "darstellendes-spiel" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "erdkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "gestalten" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "russisch" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "technik" },
    { schoolType: "gymnasium", grade: "10", subject: "textillehre" },
    { schoolType: "gymnasium", grade: "10", subject: "weltkunde" },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft-politik" },
  ],
};
