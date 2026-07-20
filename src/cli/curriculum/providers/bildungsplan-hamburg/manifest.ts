import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface HamburgCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Official Hamburg Bildungsplan catalog (BSB / hamburg.de).
 *
 * Captured 2026-07-20 from:
 * - https://www.hamburg.de/bildungsplaene
 * - Grundschule / Stadtteilschule 5–11 / Gymnasium Sek I / Studienstufe
 *
 * Content URLs are the published Rahmenplan PDFs on dokumente.hamburg.de.
 * Cross-cutting Rahmenvorgaben (Sprachbildung, Leistungsbewertung Teil C)
 * and Förderschwerpunkt geistige Entwicklung are out of scope for this
 * subject catalog.
 */
export interface BildungsplanHamburgManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: HamburgCatalogPath[];
}

export const BILDUNGSPLAN_HAMBURG_MANIFEST: BildungsplanHamburgManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision:
    "Hamburger Bildungspläne 2022/2023 (GS, STS, Gym Sek I, Studienstufe)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "stadtteilschule",
      label: "Stadtteilschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium (Sekundarstufe I)",
    },
    {
      id: "studienstufe",
      label: "Studienstufe",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    stadtteilschule: ["5", "6", "7", "8", "9", "10", "11"],
    gymnasium: ["5", "6", "7", "8", "9", "10"],
    studienstufe: ["11", "12", "13"],
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
        id: "daz",
        label: "Deutsch als Zweitsprache in Vorbereitungsklassen",
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
        id: "musik",
        label: "Musik",
      },
      {
        id: "niederdeutsch",
        label: "Niederdeutsch",
      },
      {
        id: "religion",
        label: "Religion",
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
        id: "theater",
        label: "Theater",
      },
    ],
    stadtteilschule: [
      {
        id: "latein",
        label: "Alte Sprachen: Latein",
      },
      {
        id: "berufliche-orientierung",
        label: "Berufliche Orientierung – Leben, Arbeit, Beruf",
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
        id: "daz",
        label: "Deutsch als Zweitsprache in Vorbereitungsklassen",
      },
      {
        id: "englisch",
        label: "Englisch",
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
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "naturwissenschaften-technik",
        label: "Naturwissenschaften/Technik",
      },
      {
        id: "nw-praktikum",
        label: "Naturwissenschaftliches Praktikum",
      },
      {
        id: "neuere-sprachen",
        label: "Neuere Sprachen",
      },
      {
        id: "niederdeutsch",
        label: "Niederdeutsch",
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
        id: "pgw",
        label: "Politik/Gesellschaft/Wirtschaft",
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
        id: "religion",
        label: "Religion",
      },
      {
        id: "seminar",
        label: "Seminar",
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
        id: "wirtschaft",
        label: "Wirtschaft",
      },
    ],
    gymnasium: [
      {
        id: "griechisch",
        label: "Alte Sprachen: Griechisch",
      },
      {
        id: "latein",
        label: "Alte Sprachen: Latein",
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
        id: "daz",
        label: "Deutsch als Zweitsprache in Vorbereitungsklassen",
      },
      {
        id: "englisch",
        label: "Englisch",
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
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "naturwissenschaften-technik",
        label: "Naturwissenschaften/Technik",
      },
      {
        id: "nw-praktikum",
        label: "Naturwissenschaftliches Praktikum",
      },
      {
        id: "neuere-sprachen",
        label: "Neuere Sprachen",
      },
      {
        id: "niederdeutsch",
        label: "Niederdeutsch",
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
        id: "pgw",
        label: "Politik/Gesellschaft/Wirtschaft",
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
        id: "religion",
        label: "Religion",
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
        id: "wirtschaft",
        label: "Wirtschaft",
      },
    ],
    studienstufe: [
      {
        id: "alte-sprachen",
        label: "Alte Sprachen",
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
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "arabisch",
        label: "Neuere Fremdsprachen: Arabisch",
      },
      {
        id: "chinesisch",
        label: "Neuere Fremdsprachen: Chinesisch",
      },
      {
        id: "englisch",
        label: "Neuere Fremdsprachen: Englisch",
      },
      {
        id: "farsi",
        label: "Neuere Fremdsprachen: Farsi",
      },
      {
        id: "franzoesisch",
        label: "Neuere Fremdsprachen: Französisch",
      },
      {
        id: "italienisch",
        label: "Neuere Fremdsprachen: Italienisch",
      },
      {
        id: "polnisch",
        label: "Neuere Fremdsprachen: Polnisch",
      },
      {
        id: "portugiesisch",
        label: "Neuere Fremdsprachen: Portugiesisch",
      },
      {
        id: "russisch",
        label: "Neuere Fremdsprachen: Russisch",
      },
      {
        id: "spanisch",
        label: "Neuere Fremdsprachen: Spanisch",
      },
      {
        id: "tuerkisch",
        label: "Neuere Fremdsprachen: Türkisch",
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
        id: "pgw",
        label: "Politik / Gesellschaft / Wirtschaft (PGW)",
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
        id: "religion",
        label: "Religion",
      },
      {
        id: "seminar",
        label: "Seminar",
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
        id: "wirtschaft",
        label: "Wirtschaft",
      },
    ],
  },

  tracks: {},

  topics: {
    "grundschule|1|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|1|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|1|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "grundschule|1|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|1|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|1|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|1|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|2|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|2|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|2|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "grundschule|2|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|2|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|2|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|2|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|3|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|3|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|3|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "grundschule|3|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|3|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|3|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|3|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "grundschule|4|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|4|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|4|herkunftssprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "grundschule|4|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|4|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|sachunterricht": [
      { id: "natur", label: "Natur und Umwelt" },
      { id: "technik", label: "Technik" },
      { id: "raum", label: "Raum" },
      { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
    ],
    "grundschule|4|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|4|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|5|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|5|naturwissenschaften-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|5|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|6|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|6|naturwissenschaften-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|6|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|7|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|7|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "gymnasium|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|7|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
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
    "gymnasium|7|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|7|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|7|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|8|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|8|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|8|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "gymnasium|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|8|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
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
    "gymnasium|8|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|8|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|8|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|9|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|9|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|9|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "gymnasium|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|9|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
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
    "gymnasium|9|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|9|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|9|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "gymnasium|10|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|10|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
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
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "gymnasium|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "gymnasium|10|griechisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "gymnasium|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
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
    "gymnasium|10|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
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
    "gymnasium|10|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|10|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|10|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|5|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|5|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|5|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|5|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|5|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|5|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|5|naturwissenschaften-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|5|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|5|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|5|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|5|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|5|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|6|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|6|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|6|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|6|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|6|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|6|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|6|naturwissenschaften-technik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|6|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|6|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|6|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|6|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|6|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|7|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|7|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|7|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|7|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "stadtteilschule|7|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|7|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|7|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|7|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|7|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|7|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|7|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|7|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|7|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|7|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|7|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|8|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|8|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|8|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|8|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|8|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "stadtteilschule|8|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|8|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|8|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|8|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|8|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|8|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|8|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|8|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|8|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|8|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|8|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|9|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|9|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|9|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|9|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|9|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "stadtteilschule|9|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|9|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|9|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|9|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|9|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|9|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|9|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|9|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|9|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|9|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|9|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|10|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|10|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|10|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|10|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|10|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "stadtteilschule|10|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|10|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|10|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|10|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|10|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|10|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|10|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|10|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|10|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|10|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|10|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|11|berufliche-orientierung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|bildende-kunst": [
      { id: "produktion", label: "Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "stadtteilschule|11|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|11|daz": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      { id: "sprache", label: "Sprache und Sprachgebrauch" },
    ],
    "stadtteilschule|11|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|11|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit" },
    ],
    "stadtteilschule|11|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
      { id: "urteilskompetenz", label: "Urteilskompetenz" },
    ],
    "stadtteilschule|11|informatik": [
      { id: "daten-information", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "systeme-netze", label: "Systeme und Netze" },
      { id: "informatik-gesellschaft", label: "Informatik und Gesellschaft" },
    ],
    "stadtteilschule|11|latein": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|11|mathematik": [
      { id: "zahlen-operationen", label: "Zahlen und Operationen" },
      { id: "raum-form", label: "Raum und Form" },
      { id: "groessen-messen", label: "Größen und Messen" },
      { id: "funktionaler-zusammenhang", label: "Funktionaler Zusammenhang" },
      { id: "daten-zufall", label: "Daten und Zufall" },
    ],
    "stadtteilschule|11|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "stadtteilschule|11|neuere-sprachen": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|11|niederdeutsch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "stadtteilschule|11|nw-praktikum": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|11|paedagogik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|pgw": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "stadtteilschule|11|philosophie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "stadtteilschule|11|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|recht": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "stadtteilschule|11|seminar": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "stadtteilschule|11|theater": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "stadtteilschule|11|wirtschaft": [
      { id: "politik", label: "Politik" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
    ],
    "studienstufe|11|alte-sprachen": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|arabisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|farsi": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|paedagogik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|pgw": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|psychologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|recht": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|seminar": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|theater": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|11|wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|alte-sprachen": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|arabisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|farsi": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|paedagogik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|pgw": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|psychologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|recht": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|seminar": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|theater": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|12|wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|alte-sprachen": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|arabisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|bildende-kunst": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|biologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|chemie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|chinesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|deutsch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|englisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|farsi": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|franzoesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|geographie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|geschichte": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|informatik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|italienisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|mathematik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|musik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|paedagogik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|pgw": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|philosophie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|physik": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|polnisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|portugiesisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|psychologie": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|recht": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|religion": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|russisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|seminar": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|spanisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|sport": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|theater": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|tuerkisch": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
    "studienstufe|13|wirtschaft": [
      { id: "einfuehrungsphase", label: "Einführungsphase" },
      { id: "qualifikationsphase", label: "Qualifikationsphase" },
      { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte" },
    ],
  },

  contentUrls: {
    "grundschule|1|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/122866/7c7be98e38215bbee201289172ebf5f3/bildende-kunst-gs-2022-data.pdf",
    "grundschule|1|daz":
      "https://dokumente.hamburg.de/resource/blob/122886/b39eb998df4cb5b57d34cb85560dcfa1/deutsch-zweitsprache-gs-2022-data.pdf",
    "grundschule|1|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122874/aacaaaccee5fe7b6d13400ccc89589ee/deutsch-gs-2022-data.pdf",
    "grundschule|1|englisch":
      "https://dokumente.hamburg.de/resource/blob/122890/4b72869d52ce04307b957f15e256795a/englisch-gs-2022-data.pdf",
    "grundschule|1|herkunftssprachen":
      "https://dokumente.hamburg.de/resource/blob/122894/e2d6ac4aec4ee759f7b7bc2835f095c6/herkunftsspr-unterricht-gs-2022-data.pdf",
    "grundschule|1|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122898/35b9d1599f2fa43cc76f979697addfe3/mathematik-gs-2022-data.pdf",
    "grundschule|1|musik":
      "https://dokumente.hamburg.de/resource/blob/122902/8f3cce1d07f44700a039330ff4274921/musik-gs-2022-data.pdf",
    "grundschule|1|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/122906/8d9e39f9939eb62f0036db3d1b417126/niederdeutsch-gs-2022-data.pdf",
    "grundschule|1|religion":
      "https://dokumente.hamburg.de/resource/blob/122910/c560589cfbff23cecc7a3e956eff5184/religion-gs-2022-data.pdf",
    "grundschule|1|sachunterricht":
      "https://dokumente.hamburg.de/resource/blob/122914/bea7592db01da8657f1c412bfbb0eb08/sachunterricht-gs-2022-data.pdf",
    "grundschule|1|sport":
      "https://dokumente.hamburg.de/resource/blob/122918/be1773856b4cec5691e90474e0e84512/sport-gs-2022-data.pdf",
    "grundschule|1|theater":
      "https://dokumente.hamburg.de/resource/blob/122926/5f8748c97f0628cdaff5cfbb9d25170e/theater-gs-2022-data.pdf",
    "grundschule|2|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/122866/7c7be98e38215bbee201289172ebf5f3/bildende-kunst-gs-2022-data.pdf",
    "grundschule|2|daz":
      "https://dokumente.hamburg.de/resource/blob/122886/b39eb998df4cb5b57d34cb85560dcfa1/deutsch-zweitsprache-gs-2022-data.pdf",
    "grundschule|2|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122874/aacaaaccee5fe7b6d13400ccc89589ee/deutsch-gs-2022-data.pdf",
    "grundschule|2|englisch":
      "https://dokumente.hamburg.de/resource/blob/122890/4b72869d52ce04307b957f15e256795a/englisch-gs-2022-data.pdf",
    "grundschule|2|herkunftssprachen":
      "https://dokumente.hamburg.de/resource/blob/122894/e2d6ac4aec4ee759f7b7bc2835f095c6/herkunftsspr-unterricht-gs-2022-data.pdf",
    "grundschule|2|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122898/35b9d1599f2fa43cc76f979697addfe3/mathematik-gs-2022-data.pdf",
    "grundschule|2|musik":
      "https://dokumente.hamburg.de/resource/blob/122902/8f3cce1d07f44700a039330ff4274921/musik-gs-2022-data.pdf",
    "grundschule|2|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/122906/8d9e39f9939eb62f0036db3d1b417126/niederdeutsch-gs-2022-data.pdf",
    "grundschule|2|religion":
      "https://dokumente.hamburg.de/resource/blob/122910/c560589cfbff23cecc7a3e956eff5184/religion-gs-2022-data.pdf",
    "grundschule|2|sachunterricht":
      "https://dokumente.hamburg.de/resource/blob/122914/bea7592db01da8657f1c412bfbb0eb08/sachunterricht-gs-2022-data.pdf",
    "grundschule|2|sport":
      "https://dokumente.hamburg.de/resource/blob/122918/be1773856b4cec5691e90474e0e84512/sport-gs-2022-data.pdf",
    "grundschule|2|theater":
      "https://dokumente.hamburg.de/resource/blob/122926/5f8748c97f0628cdaff5cfbb9d25170e/theater-gs-2022-data.pdf",
    "grundschule|3|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/122866/7c7be98e38215bbee201289172ebf5f3/bildende-kunst-gs-2022-data.pdf",
    "grundschule|3|daz":
      "https://dokumente.hamburg.de/resource/blob/122886/b39eb998df4cb5b57d34cb85560dcfa1/deutsch-zweitsprache-gs-2022-data.pdf",
    "grundschule|3|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122874/aacaaaccee5fe7b6d13400ccc89589ee/deutsch-gs-2022-data.pdf",
    "grundschule|3|englisch":
      "https://dokumente.hamburg.de/resource/blob/122890/4b72869d52ce04307b957f15e256795a/englisch-gs-2022-data.pdf",
    "grundschule|3|herkunftssprachen":
      "https://dokumente.hamburg.de/resource/blob/122894/e2d6ac4aec4ee759f7b7bc2835f095c6/herkunftsspr-unterricht-gs-2022-data.pdf",
    "grundschule|3|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122898/35b9d1599f2fa43cc76f979697addfe3/mathematik-gs-2022-data.pdf",
    "grundschule|3|musik":
      "https://dokumente.hamburg.de/resource/blob/122902/8f3cce1d07f44700a039330ff4274921/musik-gs-2022-data.pdf",
    "grundschule|3|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/122906/8d9e39f9939eb62f0036db3d1b417126/niederdeutsch-gs-2022-data.pdf",
    "grundschule|3|religion":
      "https://dokumente.hamburg.de/resource/blob/122910/c560589cfbff23cecc7a3e956eff5184/religion-gs-2022-data.pdf",
    "grundschule|3|sachunterricht":
      "https://dokumente.hamburg.de/resource/blob/122914/bea7592db01da8657f1c412bfbb0eb08/sachunterricht-gs-2022-data.pdf",
    "grundschule|3|sport":
      "https://dokumente.hamburg.de/resource/blob/122918/be1773856b4cec5691e90474e0e84512/sport-gs-2022-data.pdf",
    "grundschule|3|theater":
      "https://dokumente.hamburg.de/resource/blob/122926/5f8748c97f0628cdaff5cfbb9d25170e/theater-gs-2022-data.pdf",
    "grundschule|4|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/122866/7c7be98e38215bbee201289172ebf5f3/bildende-kunst-gs-2022-data.pdf",
    "grundschule|4|daz":
      "https://dokumente.hamburg.de/resource/blob/122886/b39eb998df4cb5b57d34cb85560dcfa1/deutsch-zweitsprache-gs-2022-data.pdf",
    "grundschule|4|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122874/aacaaaccee5fe7b6d13400ccc89589ee/deutsch-gs-2022-data.pdf",
    "grundschule|4|englisch":
      "https://dokumente.hamburg.de/resource/blob/122890/4b72869d52ce04307b957f15e256795a/englisch-gs-2022-data.pdf",
    "grundschule|4|herkunftssprachen":
      "https://dokumente.hamburg.de/resource/blob/122894/e2d6ac4aec4ee759f7b7bc2835f095c6/herkunftsspr-unterricht-gs-2022-data.pdf",
    "grundschule|4|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122898/35b9d1599f2fa43cc76f979697addfe3/mathematik-gs-2022-data.pdf",
    "grundschule|4|musik":
      "https://dokumente.hamburg.de/resource/blob/122902/8f3cce1d07f44700a039330ff4274921/musik-gs-2022-data.pdf",
    "grundschule|4|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/122906/8d9e39f9939eb62f0036db3d1b417126/niederdeutsch-gs-2022-data.pdf",
    "grundschule|4|religion":
      "https://dokumente.hamburg.de/resource/blob/122910/c560589cfbff23cecc7a3e956eff5184/religion-gs-2022-data.pdf",
    "grundschule|4|sachunterricht":
      "https://dokumente.hamburg.de/resource/blob/122914/bea7592db01da8657f1c412bfbb0eb08/sachunterricht-gs-2022-data.pdf",
    "grundschule|4|sport":
      "https://dokumente.hamburg.de/resource/blob/122918/be1773856b4cec5691e90474e0e84512/sport-gs-2022-data.pdf",
    "grundschule|4|theater":
      "https://dokumente.hamburg.de/resource/blob/122926/5f8748c97f0628cdaff5cfbb9d25170e/theater-gs-2022-data.pdf",
    "gymnasium|5|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|5|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|5|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|5|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|5|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|5|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|5|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|5|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|5|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|5|naturwissenschaften-technik":
      "https://dokumente.hamburg.de/resource/blob/798520/700d66232c2d07bad97d72b6e107e083/naturwissenschaften-technik-data.pdf",
    "gymnasium|5|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|5|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|5|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|5|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|5|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|6|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|6|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|6|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|6|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|6|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|6|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|6|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|6|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|6|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|6|naturwissenschaften-technik":
      "https://dokumente.hamburg.de/resource/blob/798520/700d66232c2d07bad97d72b6e107e083/naturwissenschaften-technik-data.pdf",
    "gymnasium|6|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|6|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|6|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|6|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|6|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|7|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|7|biologie":
      "https://dokumente.hamburg.de/resource/blob/798502/841e2c216f485a6f79d3e6705a65294d/biologie-data.pdf",
    "gymnasium|7|chemie":
      "https://dokumente.hamburg.de/resource/blob/798504/525ea40e785e1788a07082bfd216a72d/chemie-data.pdf",
    "gymnasium|7|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|7|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|7|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|7|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|7|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|7|griechisch":
      "https://dokumente.hamburg.de/resource/blob/798494/68e2827366b6cdc0a3db8eaa9fcb50e4/alte-sprachen-griechisch-data.pdf",
    "gymnasium|7|informatik":
      "https://dokumente.hamburg.de/resource/blob/798514/ad3c2fdfb3a32b9545a271dfceae5772/informatik-data.pdf",
    "gymnasium|7|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|7|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|7|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|7|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|7|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|7|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "gymnasium|7|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798528/7e7b2888d9b49830f131911e62b428a5/paedagogik-data.pdf",
    "gymnasium|7|pgw":
      "https://dokumente.hamburg.de/resource/blob/798540/139ccd5039fd548fae97e9918bb37827/politik-gesellschaft-wirtschaft-data.pdf",
    "gymnasium|7|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798532/588534f8a32cad82bfb3dde9e11a3046/philosophie-data.pdf",
    "gymnasium|7|physik":
      "https://dokumente.hamburg.de/resource/blob/798534/4cf0047ad61effacd1ff7e6ad819fa41/physik-data.pdf",
    "gymnasium|7|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "gymnasium|7|recht":
      "https://dokumente.hamburg.de/resource/blob/798550/f09a0f353d01eb9b3cf76a86ca53a2da/recht-data.pdf",
    "gymnasium|7|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|7|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|7|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|7|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798562/461bf725ee44c08d304cf3a3c5c84cb5/wirtschaft-data.pdf",
    "gymnasium|8|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|8|biologie":
      "https://dokumente.hamburg.de/resource/blob/798502/841e2c216f485a6f79d3e6705a65294d/biologie-data.pdf",
    "gymnasium|8|chemie":
      "https://dokumente.hamburg.de/resource/blob/798504/525ea40e785e1788a07082bfd216a72d/chemie-data.pdf",
    "gymnasium|8|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|8|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|8|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|8|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|8|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|8|griechisch":
      "https://dokumente.hamburg.de/resource/blob/798494/68e2827366b6cdc0a3db8eaa9fcb50e4/alte-sprachen-griechisch-data.pdf",
    "gymnasium|8|informatik":
      "https://dokumente.hamburg.de/resource/blob/798514/ad3c2fdfb3a32b9545a271dfceae5772/informatik-data.pdf",
    "gymnasium|8|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|8|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|8|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|8|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|8|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|8|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "gymnasium|8|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798528/7e7b2888d9b49830f131911e62b428a5/paedagogik-data.pdf",
    "gymnasium|8|pgw":
      "https://dokumente.hamburg.de/resource/blob/798540/139ccd5039fd548fae97e9918bb37827/politik-gesellschaft-wirtschaft-data.pdf",
    "gymnasium|8|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798532/588534f8a32cad82bfb3dde9e11a3046/philosophie-data.pdf",
    "gymnasium|8|physik":
      "https://dokumente.hamburg.de/resource/blob/798534/4cf0047ad61effacd1ff7e6ad819fa41/physik-data.pdf",
    "gymnasium|8|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "gymnasium|8|recht":
      "https://dokumente.hamburg.de/resource/blob/798550/f09a0f353d01eb9b3cf76a86ca53a2da/recht-data.pdf",
    "gymnasium|8|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|8|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|8|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|8|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798562/461bf725ee44c08d304cf3a3c5c84cb5/wirtschaft-data.pdf",
    "gymnasium|9|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|9|biologie":
      "https://dokumente.hamburg.de/resource/blob/798502/841e2c216f485a6f79d3e6705a65294d/biologie-data.pdf",
    "gymnasium|9|chemie":
      "https://dokumente.hamburg.de/resource/blob/798504/525ea40e785e1788a07082bfd216a72d/chemie-data.pdf",
    "gymnasium|9|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|9|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|9|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|9|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|9|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|9|griechisch":
      "https://dokumente.hamburg.de/resource/blob/798494/68e2827366b6cdc0a3db8eaa9fcb50e4/alte-sprachen-griechisch-data.pdf",
    "gymnasium|9|informatik":
      "https://dokumente.hamburg.de/resource/blob/798514/ad3c2fdfb3a32b9545a271dfceae5772/informatik-data.pdf",
    "gymnasium|9|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|9|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|9|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|9|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|9|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|9|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "gymnasium|9|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798528/7e7b2888d9b49830f131911e62b428a5/paedagogik-data.pdf",
    "gymnasium|9|pgw":
      "https://dokumente.hamburg.de/resource/blob/798540/139ccd5039fd548fae97e9918bb37827/politik-gesellschaft-wirtschaft-data.pdf",
    "gymnasium|9|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798532/588534f8a32cad82bfb3dde9e11a3046/philosophie-data.pdf",
    "gymnasium|9|physik":
      "https://dokumente.hamburg.de/resource/blob/798534/4cf0047ad61effacd1ff7e6ad819fa41/physik-data.pdf",
    "gymnasium|9|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "gymnasium|9|recht":
      "https://dokumente.hamburg.de/resource/blob/798550/f09a0f353d01eb9b3cf76a86ca53a2da/recht-data.pdf",
    "gymnasium|9|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|9|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|9|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|9|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798562/461bf725ee44c08d304cf3a3c5c84cb5/wirtschaft-data.pdf",
    "gymnasium|10|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798500/d37cc033bff958f6e7aa98687b1bd15c/bildende-kunst-data.pdf",
    "gymnasium|10|biologie":
      "https://dokumente.hamburg.de/resource/blob/798502/841e2c216f485a6f79d3e6705a65294d/biologie-data.pdf",
    "gymnasium|10|chemie":
      "https://dokumente.hamburg.de/resource/blob/798504/525ea40e785e1788a07082bfd216a72d/chemie-data.pdf",
    "gymnasium|10|daz":
      "https://dokumente.hamburg.de/resource/blob/798506/d3c76b9314ca4c0328862842fe226fb8/daz-data.pdf",
    "gymnasium|10|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122934/59b37bbb0712d24e773de536ce879146/deutsch-gym-seki-2022-data.pdf",
    "gymnasium|10|englisch":
      "https://dokumente.hamburg.de/resource/blob/122938/ea8fcb338d06e068c1e13091afa61761/englisch-gym-seki-2022-data.pdf",
    "gymnasium|10|geographie":
      "https://dokumente.hamburg.de/resource/blob/798508/861434f03667554b884d3fba9e747ecc/geographie-data.pdf",
    "gymnasium|10|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798512/1bced517d508b24e60871e63d286ea6c/geschichte-data.pdf",
    "gymnasium|10|griechisch":
      "https://dokumente.hamburg.de/resource/blob/798494/68e2827366b6cdc0a3db8eaa9fcb50e4/alte-sprachen-griechisch-data.pdf",
    "gymnasium|10|informatik":
      "https://dokumente.hamburg.de/resource/blob/798514/ad3c2fdfb3a32b9545a271dfceae5772/informatik-data.pdf",
    "gymnasium|10|latein":
      "https://dokumente.hamburg.de/resource/blob/798496/96483de36de5ffda921da25169018379/alte-sprachen-latein-data.pdf",
    "gymnasium|10|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122944/62db046dc3abf1ed671370d8c8b36c65/mathematik-gym-seki-2022-data.pdf",
    "gymnasium|10|musik":
      "https://dokumente.hamburg.de/resource/blob/798516/419d35fc65f4a37969f942e95fc8c290/musik-data.pdf",
    "gymnasium|10|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798522/fcb461a72b28cfe35b2ea0573c3d5d08/neuere-sprachen-data.pdf",
    "gymnasium|10|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798526/92831920372d674c892ec3a1ab96a6b0/niederdeutsch-data.pdf",
    "gymnasium|10|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "gymnasium|10|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798528/7e7b2888d9b49830f131911e62b428a5/paedagogik-data.pdf",
    "gymnasium|10|pgw":
      "https://dokumente.hamburg.de/resource/blob/798540/139ccd5039fd548fae97e9918bb37827/politik-gesellschaft-wirtschaft-data.pdf",
    "gymnasium|10|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798532/588534f8a32cad82bfb3dde9e11a3046/philosophie-data.pdf",
    "gymnasium|10|physik":
      "https://dokumente.hamburg.de/resource/blob/798534/4cf0047ad61effacd1ff7e6ad819fa41/physik-data.pdf",
    "gymnasium|10|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "gymnasium|10|recht":
      "https://dokumente.hamburg.de/resource/blob/798550/f09a0f353d01eb9b3cf76a86ca53a2da/recht-data.pdf",
    "gymnasium|10|religion":
      "https://dokumente.hamburg.de/resource/blob/122948/ca7d9df7f4657444f6b26f7532ea249c/religion-gym-seki-2022-data.pdf",
    "gymnasium|10|sport":
      "https://dokumente.hamburg.de/resource/blob/798556/8c90560accc1930b1a1a7bbf54739320/sport-data.pdf",
    "gymnasium|10|theater":
      "https://dokumente.hamburg.de/resource/blob/798560/4c15118a7875773ab5310f7d57706b76/theater-data.pdf",
    "gymnasium|10|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798562/461bf725ee44c08d304cf3a3c5c84cb5/wirtschaft-data.pdf",
    "stadtteilschule|5|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|5|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|5|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|5|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|5|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|5|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|5|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|5|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|5|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|5|naturwissenschaften-technik":
      "https://dokumente.hamburg.de/resource/blob/798394/033190c61a9908ff10401a5b66cedae9/naturwissenschaften-technik-data.pdf",
    "stadtteilschule|5|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|5|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|5|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|5|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|5|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|6|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|6|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|6|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|6|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|6|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|6|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|6|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|6|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|6|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|6|naturwissenschaften-technik":
      "https://dokumente.hamburg.de/resource/blob/798394/033190c61a9908ff10401a5b66cedae9/naturwissenschaften-technik-data.pdf",
    "stadtteilschule|6|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|6|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|6|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|6|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|6|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|7|berufliche-orientierung":
      "https://dokumente.hamburg.de/resource/blob/798360/6aff268bf4e31e9a9761304cbf3bca4c/berufliche-orientierung-leben-arbeit-beruf-data.pdf",
    "stadtteilschule|7|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|7|biologie":
      "https://dokumente.hamburg.de/resource/blob/798368/4a4ae47a31b14fb40d06d07b4ebfe405/biologie-data.pdf",
    "stadtteilschule|7|chemie":
      "https://dokumente.hamburg.de/resource/blob/798370/d2ebe12ab087b60136959e18fc89074a/chemie-data.pdf",
    "stadtteilschule|7|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|7|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|7|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|7|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|7|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|7|informatik":
      "https://dokumente.hamburg.de/resource/blob/798380/8e945876e1e47b59975f556ad58c53c9/informatik-data.pdf",
    "stadtteilschule|7|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|7|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|7|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|7|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|7|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|7|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "stadtteilschule|7|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798414/9d7c20894d22242398a923e15e1b957e/paedagogik-data.pdf",
    "stadtteilschule|7|pgw":
      "https://dokumente.hamburg.de/resource/blob/798428/2f747d8f3cfceca7c709e2cc81a03a61/politik-gesellschaft-wirtschaft-data.pdf",
    "stadtteilschule|7|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798418/732d887455ec0d1ec5bbd1c13899ef03/philosophie-data.pdf",
    "stadtteilschule|7|physik":
      "https://dokumente.hamburg.de/resource/blob/798426/ba414a0ace36d17b7813a855db625c42/physik-data.pdf",
    "stadtteilschule|7|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "stadtteilschule|7|recht":
      "https://dokumente.hamburg.de/resource/blob/798436/71c6270d069108cb2bc129ee29a749c2/recht-data.pdf",
    "stadtteilschule|7|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|7|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|7|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|7|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798442/a1aa5711bae16bddfcfc3cc6760318cb/wirtschaft-data.pdf",
    "stadtteilschule|8|berufliche-orientierung":
      "https://dokumente.hamburg.de/resource/blob/798360/6aff268bf4e31e9a9761304cbf3bca4c/berufliche-orientierung-leben-arbeit-beruf-data.pdf",
    "stadtteilschule|8|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|8|biologie":
      "https://dokumente.hamburg.de/resource/blob/798368/4a4ae47a31b14fb40d06d07b4ebfe405/biologie-data.pdf",
    "stadtteilschule|8|chemie":
      "https://dokumente.hamburg.de/resource/blob/798370/d2ebe12ab087b60136959e18fc89074a/chemie-data.pdf",
    "stadtteilschule|8|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|8|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|8|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|8|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|8|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|8|informatik":
      "https://dokumente.hamburg.de/resource/blob/798380/8e945876e1e47b59975f556ad58c53c9/informatik-data.pdf",
    "stadtteilschule|8|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|8|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|8|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|8|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|8|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|8|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "stadtteilschule|8|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798414/9d7c20894d22242398a923e15e1b957e/paedagogik-data.pdf",
    "stadtteilschule|8|pgw":
      "https://dokumente.hamburg.de/resource/blob/798428/2f747d8f3cfceca7c709e2cc81a03a61/politik-gesellschaft-wirtschaft-data.pdf",
    "stadtteilschule|8|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798418/732d887455ec0d1ec5bbd1c13899ef03/philosophie-data.pdf",
    "stadtteilschule|8|physik":
      "https://dokumente.hamburg.de/resource/blob/798426/ba414a0ace36d17b7813a855db625c42/physik-data.pdf",
    "stadtteilschule|8|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "stadtteilschule|8|recht":
      "https://dokumente.hamburg.de/resource/blob/798436/71c6270d069108cb2bc129ee29a749c2/recht-data.pdf",
    "stadtteilschule|8|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|8|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|8|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|8|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798442/a1aa5711bae16bddfcfc3cc6760318cb/wirtschaft-data.pdf",
    "stadtteilschule|9|berufliche-orientierung":
      "https://dokumente.hamburg.de/resource/blob/798360/6aff268bf4e31e9a9761304cbf3bca4c/berufliche-orientierung-leben-arbeit-beruf-data.pdf",
    "stadtteilschule|9|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|9|biologie":
      "https://dokumente.hamburg.de/resource/blob/798368/4a4ae47a31b14fb40d06d07b4ebfe405/biologie-data.pdf",
    "stadtteilschule|9|chemie":
      "https://dokumente.hamburg.de/resource/blob/798370/d2ebe12ab087b60136959e18fc89074a/chemie-data.pdf",
    "stadtteilschule|9|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|9|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|9|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|9|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|9|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|9|informatik":
      "https://dokumente.hamburg.de/resource/blob/798380/8e945876e1e47b59975f556ad58c53c9/informatik-data.pdf",
    "stadtteilschule|9|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|9|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|9|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|9|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|9|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|9|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "stadtteilschule|9|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798414/9d7c20894d22242398a923e15e1b957e/paedagogik-data.pdf",
    "stadtteilschule|9|pgw":
      "https://dokumente.hamburg.de/resource/blob/798428/2f747d8f3cfceca7c709e2cc81a03a61/politik-gesellschaft-wirtschaft-data.pdf",
    "stadtteilschule|9|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798418/732d887455ec0d1ec5bbd1c13899ef03/philosophie-data.pdf",
    "stadtteilschule|9|physik":
      "https://dokumente.hamburg.de/resource/blob/798426/ba414a0ace36d17b7813a855db625c42/physik-data.pdf",
    "stadtteilschule|9|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "stadtteilschule|9|recht":
      "https://dokumente.hamburg.de/resource/blob/798436/71c6270d069108cb2bc129ee29a749c2/recht-data.pdf",
    "stadtteilschule|9|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|9|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|9|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|9|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798442/a1aa5711bae16bddfcfc3cc6760318cb/wirtschaft-data.pdf",
    "stadtteilschule|10|berufliche-orientierung":
      "https://dokumente.hamburg.de/resource/blob/798360/6aff268bf4e31e9a9761304cbf3bca4c/berufliche-orientierung-leben-arbeit-beruf-data.pdf",
    "stadtteilschule|10|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|10|biologie":
      "https://dokumente.hamburg.de/resource/blob/798368/4a4ae47a31b14fb40d06d07b4ebfe405/biologie-data.pdf",
    "stadtteilschule|10|chemie":
      "https://dokumente.hamburg.de/resource/blob/798370/d2ebe12ab087b60136959e18fc89074a/chemie-data.pdf",
    "stadtteilschule|10|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|10|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|10|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|10|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|10|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|10|informatik":
      "https://dokumente.hamburg.de/resource/blob/798380/8e945876e1e47b59975f556ad58c53c9/informatik-data.pdf",
    "stadtteilschule|10|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|10|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|10|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|10|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|10|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|10|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "stadtteilschule|10|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798414/9d7c20894d22242398a923e15e1b957e/paedagogik-data.pdf",
    "stadtteilschule|10|pgw":
      "https://dokumente.hamburg.de/resource/blob/798428/2f747d8f3cfceca7c709e2cc81a03a61/politik-gesellschaft-wirtschaft-data.pdf",
    "stadtteilschule|10|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798418/732d887455ec0d1ec5bbd1c13899ef03/philosophie-data.pdf",
    "stadtteilschule|10|physik":
      "https://dokumente.hamburg.de/resource/blob/798426/ba414a0ace36d17b7813a855db625c42/physik-data.pdf",
    "stadtteilschule|10|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "stadtteilschule|10|recht":
      "https://dokumente.hamburg.de/resource/blob/798436/71c6270d069108cb2bc129ee29a749c2/recht-data.pdf",
    "stadtteilschule|10|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|10|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|10|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|10|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798442/a1aa5711bae16bddfcfc3cc6760318cb/wirtschaft-data.pdf",
    "stadtteilschule|11|berufliche-orientierung":
      "https://dokumente.hamburg.de/resource/blob/798360/6aff268bf4e31e9a9761304cbf3bca4c/berufliche-orientierung-leben-arbeit-beruf-data.pdf",
    "stadtteilschule|11|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/798366/3f3cf68c412eee6528fdfe09f99003e9/bildende-kunst-data.pdf",
    "stadtteilschule|11|biologie":
      "https://dokumente.hamburg.de/resource/blob/798368/4a4ae47a31b14fb40d06d07b4ebfe405/biologie-data.pdf",
    "stadtteilschule|11|chemie":
      "https://dokumente.hamburg.de/resource/blob/798370/d2ebe12ab087b60136959e18fc89074a/chemie-data.pdf",
    "stadtteilschule|11|daz":
      "https://dokumente.hamburg.de/resource/blob/798372/8d67eedbd4723ce3499227b7925e7419/daz-data.pdf",
    "stadtteilschule|11|deutsch":
      "https://dokumente.hamburg.de/resource/blob/122960/040b603ce22aae363c298d51757270ee/deutsch-sts-2022-data.pdf",
    "stadtteilschule|11|englisch":
      "https://dokumente.hamburg.de/resource/blob/122964/3812266b9334c5b6d4e13c1971939d98/englisch-sts-2022-data.pdf",
    "stadtteilschule|11|geographie":
      "https://dokumente.hamburg.de/resource/blob/798376/97b726a74293aa1ddd10c80e5955b864/geographie-data.pdf",
    "stadtteilschule|11|geschichte":
      "https://dokumente.hamburg.de/resource/blob/798378/25fe9509a2d564e855f56ef2e8a22813/geschichte-data.pdf",
    "stadtteilschule|11|informatik":
      "https://dokumente.hamburg.de/resource/blob/798380/8e945876e1e47b59975f556ad58c53c9/informatik-data.pdf",
    "stadtteilschule|11|latein":
      "https://dokumente.hamburg.de/resource/blob/798350/957db73ce8a5a0b44650ccd62beb4d33/alte-sprachen-latein-data.pdf",
    "stadtteilschule|11|mathematik":
      "https://dokumente.hamburg.de/resource/blob/122968/91ab0af4949763ef650814c06a77d127/mathematik-sts-2022-data.pdf",
    "stadtteilschule|11|musik":
      "https://dokumente.hamburg.de/resource/blob/798390/7b4a8b25fc1a4e0f8937292920c7e7fd/musik-data.pdf",
    "stadtteilschule|11|neuere-sprachen":
      "https://dokumente.hamburg.de/resource/blob/798400/d8dd00655fb6d5e306fa5eec20d60ae9/neuere-sprachen-data.pdf",
    "stadtteilschule|11|niederdeutsch":
      "https://dokumente.hamburg.de/resource/blob/798402/dd08c464f35f7ae79c7b787414dd25a1/niederdeutsch-data.pdf",
    "stadtteilschule|11|nw-praktikum":
      "https://dokumente.hamburg.de/resource/blob/798398/f8b1f56b66dd08946a71c61758ebd1e8/naturwissenschaftliches-praktikum-data.pdf",
    "stadtteilschule|11|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/798414/9d7c20894d22242398a923e15e1b957e/paedagogik-data.pdf",
    "stadtteilschule|11|pgw":
      "https://dokumente.hamburg.de/resource/blob/798428/2f747d8f3cfceca7c709e2cc81a03a61/politik-gesellschaft-wirtschaft-data.pdf",
    "stadtteilschule|11|philosophie":
      "https://dokumente.hamburg.de/resource/blob/798418/732d887455ec0d1ec5bbd1c13899ef03/philosophie-data.pdf",
    "stadtteilschule|11|physik":
      "https://dokumente.hamburg.de/resource/blob/798426/ba414a0ace36d17b7813a855db625c42/physik-data.pdf",
    "stadtteilschule|11|psychologie":
      "https://dokumente.hamburg.de/resource/blob/798408/12ecdbb73f4c799cb8e8b318340f47bc/psychologie-data.pdf",
    "stadtteilschule|11|recht":
      "https://dokumente.hamburg.de/resource/blob/798436/71c6270d069108cb2bc129ee29a749c2/recht-data.pdf",
    "stadtteilschule|11|religion":
      "https://dokumente.hamburg.de/resource/blob/122972/fc58a5e470ccb42d9bc5285603d3d108/religion-sts-2022-data.pdf",
    "stadtteilschule|11|seminar":
      "https://dokumente.hamburg.de/resource/blob/798438/f6b426ab761c54362b846af5bdb75e33/seminar-data.pdf",
    "stadtteilschule|11|sport":
      "https://dokumente.hamburg.de/resource/blob/798440/5f256fdc0976c501e54635e14362d3c5/sport-data.pdf",
    "stadtteilschule|11|theater":
      "https://dokumente.hamburg.de/resource/blob/798410/3be61f053ff38aceff202a2ed10f8873/theater-data.pdf",
    "stadtteilschule|11|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/798442/a1aa5711bae16bddfcfc3cc6760318cb/wirtschaft-data.pdf",
    "studienstufe|11|alte-sprachen":
      "https://dokumente.hamburg.de/resource/blob/123026/76a81e12f582a608c0a21a280e1f0d96/altesprachen-gyo-2022-data.pdf",
    "studienstufe|11|arabisch":
      "https://dokumente.hamburg.de/resource/blob/122982/60eb6a3eff658830a8f70be9f205b41b/fsp-arabisch-gyo-2022-data.pdf",
    "studienstufe|11|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/123034/0f9ac85658d0d8e9c1d141fb6da2d0a7/bildendekunst-gyo-2022-data.pdf",
    "studienstufe|11|biologie":
      "https://dokumente.hamburg.de/resource/blob/123038/52efc40f9172394cea670444018b89a3/biologie-gyo-2022-data.pdf",
    "studienstufe|11|chemie":
      "https://dokumente.hamburg.de/resource/blob/123042/e19828c45238e198fc9cfc2a73777685/chemie-gyo-2022-data.pdf",
    "studienstufe|11|chinesisch":
      "https://dokumente.hamburg.de/resource/blob/122986/24b04ec187f7488751f2de58b6a6063a/fsp-chinesisch-gyo-2022-data.pdf",
    "studienstufe|11|deutsch":
      "https://dokumente.hamburg.de/resource/blob/123046/1e58f3be0860bd56fcf3402fd10bcde5/deutsch-gyo-2022-data.pdf",
    "studienstufe|11|englisch":
      "https://dokumente.hamburg.de/resource/blob/122990/8be6c0cd2aef732c3931bab3dc97c664/fsp-englisch-gyo-2022-data.pdf",
    "studienstufe|11|farsi":
      "https://dokumente.hamburg.de/resource/blob/122994/924bbfe1bd39a6c15022ce8e0daead3e/fsp-farsi-gyo-2022-data.pdf",
    "studienstufe|11|franzoesisch":
      "https://dokumente.hamburg.de/resource/blob/122998/668098354023371a1e8961366b609b2f/fsp-franzoesisch-gyo-2022-data.pdf",
    "studienstufe|11|geographie":
      "https://dokumente.hamburg.de/resource/blob/123062/2d0432531247b6facba147b63e79328f/geographie-gyo-2022-data.pdf",
    "studienstufe|11|geschichte":
      "https://dokumente.hamburg.de/resource/blob/123066/390b95918bc023b3cc64885202d99ac8/geschichte-gyo-2022-data.pdf",
    "studienstufe|11|informatik":
      "https://dokumente.hamburg.de/resource/blob/123070/43be4b064591b08ff467d3a6dcbb3422/informatik-gyo-2022-data.pdf",
    "studienstufe|11|italienisch":
      "https://dokumente.hamburg.de/resource/blob/123002/b438f1eed6a5479a73cf10000147ede5/fsp-italienisch-gyo-2022-data.pdf",
    "studienstufe|11|mathematik":
      "https://dokumente.hamburg.de/resource/blob/123074/23276415bdfb32ba8bb652f7c1998a4c/mathematik-gyo-2022-data.pdf",
    "studienstufe|11|musik":
      "https://dokumente.hamburg.de/resource/blob/123078/a6c88bf664bcf27408c44f4a33d15ebd/musik-gyo-2022-data.pdf",
    "studienstufe|11|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/123086/869028cef3326f54f1bf53cc7d596cb0/paedagogik-gyo-2022-data.pdf",
    "studienstufe|11|pgw":
      "https://dokumente.hamburg.de/resource/blob/123082/9e8fca4bcac88da5c5d6aa02d15b43c8/p-g-w-gyo-2022-data.pdf",
    "studienstufe|11|philosophie":
      "https://dokumente.hamburg.de/resource/blob/123090/4ebb1840dfb42319a7bd50bf3f29a4e2/philosophie-gyo-2022-data.pdf",
    "studienstufe|11|physik":
      "https://dokumente.hamburg.de/resource/blob/123094/2691efabaaf2679cd7dd970a95a3c748/physik-gyo-2022-data.pdf",
    "studienstufe|11|polnisch":
      "https://dokumente.hamburg.de/resource/blob/123006/743fec1250cef94ec4f83a63839dfc2c/fsp-polnisch-gyo-2022-data.pdf",
    "studienstufe|11|portugiesisch":
      "https://dokumente.hamburg.de/resource/blob/123010/0f0a833f1f1b113165a3f68611f23e78/fsp-portugiesisch-gyo-2022-data.pdf",
    "studienstufe|11|psychologie":
      "https://dokumente.hamburg.de/resource/blob/123098/d7a3b747142bce77013ab01fced4112b/psychologie-gyo-2022-data.pdf",
    "studienstufe|11|recht":
      "https://dokumente.hamburg.de/resource/blob/123102/3f700fe1a2586b6b5862ec01e1bd7edb/recht-gyo-2022-data.pdf",
    "studienstufe|11|religion":
      "https://dokumente.hamburg.de/resource/blob/123106/a6e405e50687e99c7856f425d7823458/religion-gyo-2022-data.pdf",
    "studienstufe|11|russisch":
      "https://dokumente.hamburg.de/resource/blob/123014/b3042fc6c8b44914eb5e1316840ecf9d/fsp-russisch-gyo-2022-data.pdf",
    "studienstufe|11|seminar":
      "https://dokumente.hamburg.de/resource/blob/123110/d517d1f7fdfba5f1fa3e31a23d0d6616/seminar-gyo-2022-data.pdf",
    "studienstufe|11|spanisch":
      "https://dokumente.hamburg.de/resource/blob/123018/74c4a49e3a232f59f66f474f8bd63cd1/fsp-spanisch-gyo-2022-data.pdf",
    "studienstufe|11|sport":
      "https://dokumente.hamburg.de/resource/blob/123114/1811dfd629b6d16f2c659c03a05a46ce/sport-gyo-2022-data.pdf",
    "studienstufe|11|theater":
      "https://dokumente.hamburg.de/resource/blob/123120/dea68648343de6d5a599dff5711dc529/theater-gyo-2022-data.pdf",
    "studienstufe|11|tuerkisch":
      "https://dokumente.hamburg.de/resource/blob/123022/08ec94334ecb462d0e6c377a5ebc6f1b/fsp-tuerkisch-gyo-2022-data.pdf",
    "studienstufe|11|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/123124/fa273b2698b59b3c2cf727161af44e1d/wirtschaft-gyo-2022-data.pdf",
    "studienstufe|12|alte-sprachen":
      "https://dokumente.hamburg.de/resource/blob/123026/76a81e12f582a608c0a21a280e1f0d96/altesprachen-gyo-2022-data.pdf",
    "studienstufe|12|arabisch":
      "https://dokumente.hamburg.de/resource/blob/122982/60eb6a3eff658830a8f70be9f205b41b/fsp-arabisch-gyo-2022-data.pdf",
    "studienstufe|12|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/123034/0f9ac85658d0d8e9c1d141fb6da2d0a7/bildendekunst-gyo-2022-data.pdf",
    "studienstufe|12|biologie":
      "https://dokumente.hamburg.de/resource/blob/123038/52efc40f9172394cea670444018b89a3/biologie-gyo-2022-data.pdf",
    "studienstufe|12|chemie":
      "https://dokumente.hamburg.de/resource/blob/123042/e19828c45238e198fc9cfc2a73777685/chemie-gyo-2022-data.pdf",
    "studienstufe|12|chinesisch":
      "https://dokumente.hamburg.de/resource/blob/122986/24b04ec187f7488751f2de58b6a6063a/fsp-chinesisch-gyo-2022-data.pdf",
    "studienstufe|12|deutsch":
      "https://dokumente.hamburg.de/resource/blob/123046/1e58f3be0860bd56fcf3402fd10bcde5/deutsch-gyo-2022-data.pdf",
    "studienstufe|12|englisch":
      "https://dokumente.hamburg.de/resource/blob/122990/8be6c0cd2aef732c3931bab3dc97c664/fsp-englisch-gyo-2022-data.pdf",
    "studienstufe|12|farsi":
      "https://dokumente.hamburg.de/resource/blob/122994/924bbfe1bd39a6c15022ce8e0daead3e/fsp-farsi-gyo-2022-data.pdf",
    "studienstufe|12|franzoesisch":
      "https://dokumente.hamburg.de/resource/blob/122998/668098354023371a1e8961366b609b2f/fsp-franzoesisch-gyo-2022-data.pdf",
    "studienstufe|12|geographie":
      "https://dokumente.hamburg.de/resource/blob/123062/2d0432531247b6facba147b63e79328f/geographie-gyo-2022-data.pdf",
    "studienstufe|12|geschichte":
      "https://dokumente.hamburg.de/resource/blob/123066/390b95918bc023b3cc64885202d99ac8/geschichte-gyo-2022-data.pdf",
    "studienstufe|12|informatik":
      "https://dokumente.hamburg.de/resource/blob/123070/43be4b064591b08ff467d3a6dcbb3422/informatik-gyo-2022-data.pdf",
    "studienstufe|12|italienisch":
      "https://dokumente.hamburg.de/resource/blob/123002/b438f1eed6a5479a73cf10000147ede5/fsp-italienisch-gyo-2022-data.pdf",
    "studienstufe|12|mathematik":
      "https://dokumente.hamburg.de/resource/blob/123074/23276415bdfb32ba8bb652f7c1998a4c/mathematik-gyo-2022-data.pdf",
    "studienstufe|12|musik":
      "https://dokumente.hamburg.de/resource/blob/123078/a6c88bf664bcf27408c44f4a33d15ebd/musik-gyo-2022-data.pdf",
    "studienstufe|12|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/123086/869028cef3326f54f1bf53cc7d596cb0/paedagogik-gyo-2022-data.pdf",
    "studienstufe|12|pgw":
      "https://dokumente.hamburg.de/resource/blob/123082/9e8fca4bcac88da5c5d6aa02d15b43c8/p-g-w-gyo-2022-data.pdf",
    "studienstufe|12|philosophie":
      "https://dokumente.hamburg.de/resource/blob/123090/4ebb1840dfb42319a7bd50bf3f29a4e2/philosophie-gyo-2022-data.pdf",
    "studienstufe|12|physik":
      "https://dokumente.hamburg.de/resource/blob/123094/2691efabaaf2679cd7dd970a95a3c748/physik-gyo-2022-data.pdf",
    "studienstufe|12|polnisch":
      "https://dokumente.hamburg.de/resource/blob/123006/743fec1250cef94ec4f83a63839dfc2c/fsp-polnisch-gyo-2022-data.pdf",
    "studienstufe|12|portugiesisch":
      "https://dokumente.hamburg.de/resource/blob/123010/0f0a833f1f1b113165a3f68611f23e78/fsp-portugiesisch-gyo-2022-data.pdf",
    "studienstufe|12|psychologie":
      "https://dokumente.hamburg.de/resource/blob/123098/d7a3b747142bce77013ab01fced4112b/psychologie-gyo-2022-data.pdf",
    "studienstufe|12|recht":
      "https://dokumente.hamburg.de/resource/blob/123102/3f700fe1a2586b6b5862ec01e1bd7edb/recht-gyo-2022-data.pdf",
    "studienstufe|12|religion":
      "https://dokumente.hamburg.de/resource/blob/123106/a6e405e50687e99c7856f425d7823458/religion-gyo-2022-data.pdf",
    "studienstufe|12|russisch":
      "https://dokumente.hamburg.de/resource/blob/123014/b3042fc6c8b44914eb5e1316840ecf9d/fsp-russisch-gyo-2022-data.pdf",
    "studienstufe|12|seminar":
      "https://dokumente.hamburg.de/resource/blob/123110/d517d1f7fdfba5f1fa3e31a23d0d6616/seminar-gyo-2022-data.pdf",
    "studienstufe|12|spanisch":
      "https://dokumente.hamburg.de/resource/blob/123018/74c4a49e3a232f59f66f474f8bd63cd1/fsp-spanisch-gyo-2022-data.pdf",
    "studienstufe|12|sport":
      "https://dokumente.hamburg.de/resource/blob/123114/1811dfd629b6d16f2c659c03a05a46ce/sport-gyo-2022-data.pdf",
    "studienstufe|12|theater":
      "https://dokumente.hamburg.de/resource/blob/123120/dea68648343de6d5a599dff5711dc529/theater-gyo-2022-data.pdf",
    "studienstufe|12|tuerkisch":
      "https://dokumente.hamburg.de/resource/blob/123022/08ec94334ecb462d0e6c377a5ebc6f1b/fsp-tuerkisch-gyo-2022-data.pdf",
    "studienstufe|12|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/123124/fa273b2698b59b3c2cf727161af44e1d/wirtschaft-gyo-2022-data.pdf",
    "studienstufe|13|alte-sprachen":
      "https://dokumente.hamburg.de/resource/blob/123026/76a81e12f582a608c0a21a280e1f0d96/altesprachen-gyo-2022-data.pdf",
    "studienstufe|13|arabisch":
      "https://dokumente.hamburg.de/resource/blob/122982/60eb6a3eff658830a8f70be9f205b41b/fsp-arabisch-gyo-2022-data.pdf",
    "studienstufe|13|bildende-kunst":
      "https://dokumente.hamburg.de/resource/blob/123034/0f9ac85658d0d8e9c1d141fb6da2d0a7/bildendekunst-gyo-2022-data.pdf",
    "studienstufe|13|biologie":
      "https://dokumente.hamburg.de/resource/blob/123038/52efc40f9172394cea670444018b89a3/biologie-gyo-2022-data.pdf",
    "studienstufe|13|chemie":
      "https://dokumente.hamburg.de/resource/blob/123042/e19828c45238e198fc9cfc2a73777685/chemie-gyo-2022-data.pdf",
    "studienstufe|13|chinesisch":
      "https://dokumente.hamburg.de/resource/blob/122986/24b04ec187f7488751f2de58b6a6063a/fsp-chinesisch-gyo-2022-data.pdf",
    "studienstufe|13|deutsch":
      "https://dokumente.hamburg.de/resource/blob/123046/1e58f3be0860bd56fcf3402fd10bcde5/deutsch-gyo-2022-data.pdf",
    "studienstufe|13|englisch":
      "https://dokumente.hamburg.de/resource/blob/122990/8be6c0cd2aef732c3931bab3dc97c664/fsp-englisch-gyo-2022-data.pdf",
    "studienstufe|13|farsi":
      "https://dokumente.hamburg.de/resource/blob/122994/924bbfe1bd39a6c15022ce8e0daead3e/fsp-farsi-gyo-2022-data.pdf",
    "studienstufe|13|franzoesisch":
      "https://dokumente.hamburg.de/resource/blob/122998/668098354023371a1e8961366b609b2f/fsp-franzoesisch-gyo-2022-data.pdf",
    "studienstufe|13|geographie":
      "https://dokumente.hamburg.de/resource/blob/123062/2d0432531247b6facba147b63e79328f/geographie-gyo-2022-data.pdf",
    "studienstufe|13|geschichte":
      "https://dokumente.hamburg.de/resource/blob/123066/390b95918bc023b3cc64885202d99ac8/geschichte-gyo-2022-data.pdf",
    "studienstufe|13|informatik":
      "https://dokumente.hamburg.de/resource/blob/123070/43be4b064591b08ff467d3a6dcbb3422/informatik-gyo-2022-data.pdf",
    "studienstufe|13|italienisch":
      "https://dokumente.hamburg.de/resource/blob/123002/b438f1eed6a5479a73cf10000147ede5/fsp-italienisch-gyo-2022-data.pdf",
    "studienstufe|13|mathematik":
      "https://dokumente.hamburg.de/resource/blob/123074/23276415bdfb32ba8bb652f7c1998a4c/mathematik-gyo-2022-data.pdf",
    "studienstufe|13|musik":
      "https://dokumente.hamburg.de/resource/blob/123078/a6c88bf664bcf27408c44f4a33d15ebd/musik-gyo-2022-data.pdf",
    "studienstufe|13|paedagogik":
      "https://dokumente.hamburg.de/resource/blob/123086/869028cef3326f54f1bf53cc7d596cb0/paedagogik-gyo-2022-data.pdf",
    "studienstufe|13|pgw":
      "https://dokumente.hamburg.de/resource/blob/123082/9e8fca4bcac88da5c5d6aa02d15b43c8/p-g-w-gyo-2022-data.pdf",
    "studienstufe|13|philosophie":
      "https://dokumente.hamburg.de/resource/blob/123090/4ebb1840dfb42319a7bd50bf3f29a4e2/philosophie-gyo-2022-data.pdf",
    "studienstufe|13|physik":
      "https://dokumente.hamburg.de/resource/blob/123094/2691efabaaf2679cd7dd970a95a3c748/physik-gyo-2022-data.pdf",
    "studienstufe|13|polnisch":
      "https://dokumente.hamburg.de/resource/blob/123006/743fec1250cef94ec4f83a63839dfc2c/fsp-polnisch-gyo-2022-data.pdf",
    "studienstufe|13|portugiesisch":
      "https://dokumente.hamburg.de/resource/blob/123010/0f0a833f1f1b113165a3f68611f23e78/fsp-portugiesisch-gyo-2022-data.pdf",
    "studienstufe|13|psychologie":
      "https://dokumente.hamburg.de/resource/blob/123098/d7a3b747142bce77013ab01fced4112b/psychologie-gyo-2022-data.pdf",
    "studienstufe|13|recht":
      "https://dokumente.hamburg.de/resource/blob/123102/3f700fe1a2586b6b5862ec01e1bd7edb/recht-gyo-2022-data.pdf",
    "studienstufe|13|religion":
      "https://dokumente.hamburg.de/resource/blob/123106/a6e405e50687e99c7856f425d7823458/religion-gyo-2022-data.pdf",
    "studienstufe|13|russisch":
      "https://dokumente.hamburg.de/resource/blob/123014/b3042fc6c8b44914eb5e1316840ecf9d/fsp-russisch-gyo-2022-data.pdf",
    "studienstufe|13|seminar":
      "https://dokumente.hamburg.de/resource/blob/123110/d517d1f7fdfba5f1fa3e31a23d0d6616/seminar-gyo-2022-data.pdf",
    "studienstufe|13|spanisch":
      "https://dokumente.hamburg.de/resource/blob/123018/74c4a49e3a232f59f66f474f8bd63cd1/fsp-spanisch-gyo-2022-data.pdf",
    "studienstufe|13|sport":
      "https://dokumente.hamburg.de/resource/blob/123114/1811dfd629b6d16f2c659c03a05a46ce/sport-gyo-2022-data.pdf",
    "studienstufe|13|theater":
      "https://dokumente.hamburg.de/resource/blob/123120/dea68648343de6d5a599dff5711dc529/theater-gyo-2022-data.pdf",
    "studienstufe|13|tuerkisch":
      "https://dokumente.hamburg.de/resource/blob/123022/08ec94334ecb462d0e6c377a5ebc6f1b/fsp-tuerkisch-gyo-2022-data.pdf",
    "studienstufe|13|wirtschaft":
      "https://dokumente.hamburg.de/resource/blob/123124/fa273b2698b59b3c2cf727161af44e1d/wirtschaft-gyo-2022-data.pdf",
  },

  catalogPaths: [
    { schoolType: "grundschule", grade: "1", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "1", subject: "daz" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "herkunftssprachen" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "niederdeutsch" },
    { schoolType: "grundschule", grade: "1", subject: "religion" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "1", subject: "sport" },
    { schoolType: "grundschule", grade: "1", subject: "theater" },
    { schoolType: "grundschule", grade: "2", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "2", subject: "daz" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "herkunftssprachen" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "niederdeutsch" },
    { schoolType: "grundschule", grade: "2", subject: "religion" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "2", subject: "sport" },
    { schoolType: "grundschule", grade: "2", subject: "theater" },
    { schoolType: "grundschule", grade: "3", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "3", subject: "daz" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "herkunftssprachen" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "niederdeutsch" },
    { schoolType: "grundschule", grade: "3", subject: "religion" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "3", subject: "sport" },
    { schoolType: "grundschule", grade: "3", subject: "theater" },
    { schoolType: "grundschule", grade: "4", subject: "bildende-kunst" },
    { schoolType: "grundschule", grade: "4", subject: "daz" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "herkunftssprachen" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "niederdeutsch" },
    { schoolType: "grundschule", grade: "4", subject: "religion" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    { schoolType: "grundschule", grade: "4", subject: "sport" },
    { schoolType: "grundschule", grade: "4", subject: "theater" },
    { schoolType: "gymnasium", grade: "5", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "daz" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch" },
    { schoolType: "gymnasium", grade: "5", subject: "geographie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "latein" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "naturwissenschaften-technik",
    },
    { schoolType: "gymnasium", grade: "5", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "5", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "religion" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    { schoolType: "gymnasium", grade: "5", subject: "theater" },
    { schoolType: "gymnasium", grade: "6", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "daz" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch" },
    { schoolType: "gymnasium", grade: "6", subject: "geographie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "latein" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "naturwissenschaften-technik",
    },
    { schoolType: "gymnasium", grade: "6", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "6", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "religion" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    { schoolType: "gymnasium", grade: "6", subject: "theater" },
    { schoolType: "gymnasium", grade: "7", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "daz" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch" },
    { schoolType: "gymnasium", grade: "7", subject: "geographie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik" },
    { schoolType: "gymnasium", grade: "7", subject: "latein" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "7", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "nw-praktikum" },
    { schoolType: "gymnasium", grade: "7", subject: "paedagogik" },
    { schoolType: "gymnasium", grade: "7", subject: "pgw" },
    { schoolType: "gymnasium", grade: "7", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "7", subject: "recht" },
    { schoolType: "gymnasium", grade: "7", subject: "religion" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    { schoolType: "gymnasium", grade: "7", subject: "theater" },
    { schoolType: "gymnasium", grade: "7", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "8", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "daz" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch" },
    { schoolType: "gymnasium", grade: "8", subject: "geographie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik" },
    { schoolType: "gymnasium", grade: "8", subject: "latein" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "8", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "nw-praktikum" },
    { schoolType: "gymnasium", grade: "8", subject: "paedagogik" },
    { schoolType: "gymnasium", grade: "8", subject: "pgw" },
    { schoolType: "gymnasium", grade: "8", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "8", subject: "recht" },
    { schoolType: "gymnasium", grade: "8", subject: "religion" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    { schoolType: "gymnasium", grade: "8", subject: "theater" },
    { schoolType: "gymnasium", grade: "8", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "9", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "daz" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch" },
    { schoolType: "gymnasium", grade: "9", subject: "geographie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik" },
    { schoolType: "gymnasium", grade: "9", subject: "latein" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "9", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "nw-praktikum" },
    { schoolType: "gymnasium", grade: "9", subject: "paedagogik" },
    { schoolType: "gymnasium", grade: "9", subject: "pgw" },
    { schoolType: "gymnasium", grade: "9", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "9", subject: "recht" },
    { schoolType: "gymnasium", grade: "9", subject: "religion" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    { schoolType: "gymnasium", grade: "9", subject: "theater" },
    { schoolType: "gymnasium", grade: "9", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "10", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "daz" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch" },
    { schoolType: "gymnasium", grade: "10", subject: "geographie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "griechisch" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik" },
    { schoolType: "gymnasium", grade: "10", subject: "latein" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "neuere-sprachen" },
    { schoolType: "gymnasium", grade: "10", subject: "niederdeutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "nw-praktikum" },
    { schoolType: "gymnasium", grade: "10", subject: "paedagogik" },
    { schoolType: "gymnasium", grade: "10", subject: "pgw" },
    { schoolType: "gymnasium", grade: "10", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "10", subject: "recht" },
    { schoolType: "gymnasium", grade: "10", subject: "religion" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    { schoolType: "gymnasium", grade: "10", subject: "theater" },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft" },
    { schoolType: "stadtteilschule", grade: "5", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "5", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "5", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "5", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "5", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "5", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "5", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "5", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "5", subject: "musik" },
    {
      schoolType: "stadtteilschule",
      grade: "5",
      subject: "naturwissenschaften-technik",
    },
    { schoolType: "stadtteilschule", grade: "5", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "5", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "5", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "5", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "5", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "6", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "6", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "6", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "6", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "6", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "6", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "6", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "6", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "6", subject: "musik" },
    {
      schoolType: "stadtteilschule",
      grade: "6",
      subject: "naturwissenschaften-technik",
    },
    { schoolType: "stadtteilschule", grade: "6", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "6", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "6", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "6", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "6", subject: "theater" },
    {
      schoolType: "stadtteilschule",
      grade: "7",
      subject: "berufliche-orientierung",
    },
    { schoolType: "stadtteilschule", grade: "7", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "7", subject: "biologie" },
    { schoolType: "stadtteilschule", grade: "7", subject: "chemie" },
    { schoolType: "stadtteilschule", grade: "7", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "7", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "7", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "7", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "7", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "7", subject: "informatik" },
    { schoolType: "stadtteilschule", grade: "7", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "7", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "7", subject: "musik" },
    { schoolType: "stadtteilschule", grade: "7", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "7", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "7", subject: "nw-praktikum" },
    { schoolType: "stadtteilschule", grade: "7", subject: "paedagogik" },
    { schoolType: "stadtteilschule", grade: "7", subject: "pgw" },
    { schoolType: "stadtteilschule", grade: "7", subject: "philosophie" },
    { schoolType: "stadtteilschule", grade: "7", subject: "physik" },
    { schoolType: "stadtteilschule", grade: "7", subject: "psychologie" },
    { schoolType: "stadtteilschule", grade: "7", subject: "recht" },
    { schoolType: "stadtteilschule", grade: "7", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "7", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "7", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "7", subject: "wirtschaft" },
    {
      schoolType: "stadtteilschule",
      grade: "8",
      subject: "berufliche-orientierung",
    },
    { schoolType: "stadtteilschule", grade: "8", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "8", subject: "biologie" },
    { schoolType: "stadtteilschule", grade: "8", subject: "chemie" },
    { schoolType: "stadtteilschule", grade: "8", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "8", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "8", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "8", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "8", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "8", subject: "informatik" },
    { schoolType: "stadtteilschule", grade: "8", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "8", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "8", subject: "musik" },
    { schoolType: "stadtteilschule", grade: "8", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "8", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "8", subject: "nw-praktikum" },
    { schoolType: "stadtteilschule", grade: "8", subject: "paedagogik" },
    { schoolType: "stadtteilschule", grade: "8", subject: "pgw" },
    { schoolType: "stadtteilschule", grade: "8", subject: "philosophie" },
    { schoolType: "stadtteilschule", grade: "8", subject: "physik" },
    { schoolType: "stadtteilschule", grade: "8", subject: "psychologie" },
    { schoolType: "stadtteilschule", grade: "8", subject: "recht" },
    { schoolType: "stadtteilschule", grade: "8", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "8", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "8", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "8", subject: "wirtschaft" },
    {
      schoolType: "stadtteilschule",
      grade: "9",
      subject: "berufliche-orientierung",
    },
    { schoolType: "stadtteilschule", grade: "9", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "9", subject: "biologie" },
    { schoolType: "stadtteilschule", grade: "9", subject: "chemie" },
    { schoolType: "stadtteilschule", grade: "9", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "9", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "9", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "9", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "9", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "9", subject: "informatik" },
    { schoolType: "stadtteilschule", grade: "9", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "9", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "9", subject: "musik" },
    { schoolType: "stadtteilschule", grade: "9", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "9", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "9", subject: "nw-praktikum" },
    { schoolType: "stadtteilschule", grade: "9", subject: "paedagogik" },
    { schoolType: "stadtteilschule", grade: "9", subject: "pgw" },
    { schoolType: "stadtteilschule", grade: "9", subject: "philosophie" },
    { schoolType: "stadtteilschule", grade: "9", subject: "physik" },
    { schoolType: "stadtteilschule", grade: "9", subject: "psychologie" },
    { schoolType: "stadtteilschule", grade: "9", subject: "recht" },
    { schoolType: "stadtteilschule", grade: "9", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "9", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "9", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "9", subject: "wirtschaft" },
    {
      schoolType: "stadtteilschule",
      grade: "10",
      subject: "berufliche-orientierung",
    },
    { schoolType: "stadtteilschule", grade: "10", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "10", subject: "biologie" },
    { schoolType: "stadtteilschule", grade: "10", subject: "chemie" },
    { schoolType: "stadtteilschule", grade: "10", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "10", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "10", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "10", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "10", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "10", subject: "informatik" },
    { schoolType: "stadtteilschule", grade: "10", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "10", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "10", subject: "musik" },
    { schoolType: "stadtteilschule", grade: "10", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "10", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "10", subject: "nw-praktikum" },
    { schoolType: "stadtteilschule", grade: "10", subject: "paedagogik" },
    { schoolType: "stadtteilschule", grade: "10", subject: "pgw" },
    { schoolType: "stadtteilschule", grade: "10", subject: "philosophie" },
    { schoolType: "stadtteilschule", grade: "10", subject: "physik" },
    { schoolType: "stadtteilschule", grade: "10", subject: "psychologie" },
    { schoolType: "stadtteilschule", grade: "10", subject: "recht" },
    { schoolType: "stadtteilschule", grade: "10", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "10", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "10", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "10", subject: "wirtschaft" },
    {
      schoolType: "stadtteilschule",
      grade: "11",
      subject: "berufliche-orientierung",
    },
    { schoolType: "stadtteilschule", grade: "11", subject: "bildende-kunst" },
    { schoolType: "stadtteilschule", grade: "11", subject: "biologie" },
    { schoolType: "stadtteilschule", grade: "11", subject: "chemie" },
    { schoolType: "stadtteilschule", grade: "11", subject: "daz" },
    { schoolType: "stadtteilschule", grade: "11", subject: "deutsch" },
    { schoolType: "stadtteilschule", grade: "11", subject: "englisch" },
    { schoolType: "stadtteilschule", grade: "11", subject: "geographie" },
    { schoolType: "stadtteilschule", grade: "11", subject: "geschichte" },
    { schoolType: "stadtteilschule", grade: "11", subject: "informatik" },
    { schoolType: "stadtteilschule", grade: "11", subject: "latein" },
    { schoolType: "stadtteilschule", grade: "11", subject: "mathematik" },
    { schoolType: "stadtteilschule", grade: "11", subject: "musik" },
    { schoolType: "stadtteilschule", grade: "11", subject: "neuere-sprachen" },
    { schoolType: "stadtteilschule", grade: "11", subject: "niederdeutsch" },
    { schoolType: "stadtteilschule", grade: "11", subject: "nw-praktikum" },
    { schoolType: "stadtteilschule", grade: "11", subject: "paedagogik" },
    { schoolType: "stadtteilschule", grade: "11", subject: "pgw" },
    { schoolType: "stadtteilschule", grade: "11", subject: "philosophie" },
    { schoolType: "stadtteilschule", grade: "11", subject: "physik" },
    { schoolType: "stadtteilschule", grade: "11", subject: "psychologie" },
    { schoolType: "stadtteilschule", grade: "11", subject: "recht" },
    { schoolType: "stadtteilschule", grade: "11", subject: "religion" },
    { schoolType: "stadtteilschule", grade: "11", subject: "seminar" },
    { schoolType: "stadtteilschule", grade: "11", subject: "sport" },
    { schoolType: "stadtteilschule", grade: "11", subject: "theater" },
    { schoolType: "stadtteilschule", grade: "11", subject: "wirtschaft" },
    { schoolType: "studienstufe", grade: "11", subject: "alte-sprachen" },
    { schoolType: "studienstufe", grade: "11", subject: "arabisch" },
    { schoolType: "studienstufe", grade: "11", subject: "bildende-kunst" },
    { schoolType: "studienstufe", grade: "11", subject: "biologie" },
    { schoolType: "studienstufe", grade: "11", subject: "chemie" },
    { schoolType: "studienstufe", grade: "11", subject: "chinesisch" },
    { schoolType: "studienstufe", grade: "11", subject: "deutsch" },
    { schoolType: "studienstufe", grade: "11", subject: "englisch" },
    { schoolType: "studienstufe", grade: "11", subject: "farsi" },
    { schoolType: "studienstufe", grade: "11", subject: "franzoesisch" },
    { schoolType: "studienstufe", grade: "11", subject: "geographie" },
    { schoolType: "studienstufe", grade: "11", subject: "geschichte" },
    { schoolType: "studienstufe", grade: "11", subject: "informatik" },
    { schoolType: "studienstufe", grade: "11", subject: "italienisch" },
    { schoolType: "studienstufe", grade: "11", subject: "mathematik" },
    { schoolType: "studienstufe", grade: "11", subject: "musik" },
    { schoolType: "studienstufe", grade: "11", subject: "paedagogik" },
    { schoolType: "studienstufe", grade: "11", subject: "pgw" },
    { schoolType: "studienstufe", grade: "11", subject: "philosophie" },
    { schoolType: "studienstufe", grade: "11", subject: "physik" },
    { schoolType: "studienstufe", grade: "11", subject: "polnisch" },
    { schoolType: "studienstufe", grade: "11", subject: "portugiesisch" },
    { schoolType: "studienstufe", grade: "11", subject: "psychologie" },
    { schoolType: "studienstufe", grade: "11", subject: "recht" },
    { schoolType: "studienstufe", grade: "11", subject: "religion" },
    { schoolType: "studienstufe", grade: "11", subject: "russisch" },
    { schoolType: "studienstufe", grade: "11", subject: "seminar" },
    { schoolType: "studienstufe", grade: "11", subject: "spanisch" },
    { schoolType: "studienstufe", grade: "11", subject: "sport" },
    { schoolType: "studienstufe", grade: "11", subject: "theater" },
    { schoolType: "studienstufe", grade: "11", subject: "tuerkisch" },
    { schoolType: "studienstufe", grade: "11", subject: "wirtschaft" },
    { schoolType: "studienstufe", grade: "12", subject: "alte-sprachen" },
    { schoolType: "studienstufe", grade: "12", subject: "arabisch" },
    { schoolType: "studienstufe", grade: "12", subject: "bildende-kunst" },
    { schoolType: "studienstufe", grade: "12", subject: "biologie" },
    { schoolType: "studienstufe", grade: "12", subject: "chemie" },
    { schoolType: "studienstufe", grade: "12", subject: "chinesisch" },
    { schoolType: "studienstufe", grade: "12", subject: "deutsch" },
    { schoolType: "studienstufe", grade: "12", subject: "englisch" },
    { schoolType: "studienstufe", grade: "12", subject: "farsi" },
    { schoolType: "studienstufe", grade: "12", subject: "franzoesisch" },
    { schoolType: "studienstufe", grade: "12", subject: "geographie" },
    { schoolType: "studienstufe", grade: "12", subject: "geschichte" },
    { schoolType: "studienstufe", grade: "12", subject: "informatik" },
    { schoolType: "studienstufe", grade: "12", subject: "italienisch" },
    { schoolType: "studienstufe", grade: "12", subject: "mathematik" },
    { schoolType: "studienstufe", grade: "12", subject: "musik" },
    { schoolType: "studienstufe", grade: "12", subject: "paedagogik" },
    { schoolType: "studienstufe", grade: "12", subject: "pgw" },
    { schoolType: "studienstufe", grade: "12", subject: "philosophie" },
    { schoolType: "studienstufe", grade: "12", subject: "physik" },
    { schoolType: "studienstufe", grade: "12", subject: "polnisch" },
    { schoolType: "studienstufe", grade: "12", subject: "portugiesisch" },
    { schoolType: "studienstufe", grade: "12", subject: "psychologie" },
    { schoolType: "studienstufe", grade: "12", subject: "recht" },
    { schoolType: "studienstufe", grade: "12", subject: "religion" },
    { schoolType: "studienstufe", grade: "12", subject: "russisch" },
    { schoolType: "studienstufe", grade: "12", subject: "seminar" },
    { schoolType: "studienstufe", grade: "12", subject: "spanisch" },
    { schoolType: "studienstufe", grade: "12", subject: "sport" },
    { schoolType: "studienstufe", grade: "12", subject: "theater" },
    { schoolType: "studienstufe", grade: "12", subject: "tuerkisch" },
    { schoolType: "studienstufe", grade: "12", subject: "wirtschaft" },
    { schoolType: "studienstufe", grade: "13", subject: "alte-sprachen" },
    { schoolType: "studienstufe", grade: "13", subject: "arabisch" },
    { schoolType: "studienstufe", grade: "13", subject: "bildende-kunst" },
    { schoolType: "studienstufe", grade: "13", subject: "biologie" },
    { schoolType: "studienstufe", grade: "13", subject: "chemie" },
    { schoolType: "studienstufe", grade: "13", subject: "chinesisch" },
    { schoolType: "studienstufe", grade: "13", subject: "deutsch" },
    { schoolType: "studienstufe", grade: "13", subject: "englisch" },
    { schoolType: "studienstufe", grade: "13", subject: "farsi" },
    { schoolType: "studienstufe", grade: "13", subject: "franzoesisch" },
    { schoolType: "studienstufe", grade: "13", subject: "geographie" },
    { schoolType: "studienstufe", grade: "13", subject: "geschichte" },
    { schoolType: "studienstufe", grade: "13", subject: "informatik" },
    { schoolType: "studienstufe", grade: "13", subject: "italienisch" },
    { schoolType: "studienstufe", grade: "13", subject: "mathematik" },
    { schoolType: "studienstufe", grade: "13", subject: "musik" },
    { schoolType: "studienstufe", grade: "13", subject: "paedagogik" },
    { schoolType: "studienstufe", grade: "13", subject: "pgw" },
    { schoolType: "studienstufe", grade: "13", subject: "philosophie" },
    { schoolType: "studienstufe", grade: "13", subject: "physik" },
    { schoolType: "studienstufe", grade: "13", subject: "polnisch" },
    { schoolType: "studienstufe", grade: "13", subject: "portugiesisch" },
    { schoolType: "studienstufe", grade: "13", subject: "psychologie" },
    { schoolType: "studienstufe", grade: "13", subject: "recht" },
    { schoolType: "studienstufe", grade: "13", subject: "religion" },
    { schoolType: "studienstufe", grade: "13", subject: "russisch" },
    { schoolType: "studienstufe", grade: "13", subject: "seminar" },
    { schoolType: "studienstufe", grade: "13", subject: "spanisch" },
    { schoolType: "studienstufe", grade: "13", subject: "sport" },
    { schoolType: "studienstufe", grade: "13", subject: "theater" },
    { schoolType: "studienstufe", grade: "13", subject: "tuerkisch" },
    { schoolType: "studienstufe", grade: "13", subject: "wirtschaft" },
  ],
};
