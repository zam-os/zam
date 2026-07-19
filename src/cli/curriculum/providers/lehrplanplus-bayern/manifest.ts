/**
 * Bundled LehrplanPLUS (Bayern) taxonomy manifest.
 *
 * Per ADR 2026-07-02, this manifest is refreshed by an agent once per
 * school year (not a scraper script), because an agent can adapt to a
 * redesigned page or a moved link the way a brittle parser cannot. Each
 * refresh is expected to add or revise entries rather than replace the
 * whole file — `capturedOn` marks when a given branch was last verified
 * against the live site.
 *
 * Every entry below was captured by navigating https://www.lehrplanplus.bayern.de
 * on `capturedOn`; nothing here is inferred or guessed.
 */

import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplanPlusBayernManifest {
  /** Bavarian school year this branch of the manifest was captured for. */
  schoolYear: string;
  /** Date the entries below were last verified against the live site. */
  capturedOn: string;
  /** The official curriculum edition these entries were read from. */
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  /** Verified grade options, keyed by school-type id. */
  grades: Record<string, string[]>;
  /** Verified subject catalog, keyed by school-type id. */
  subjects: Record<string, TaxonomyNode[]>;
  /** Verified track (Ausprägung) options, keyed by "schoolType|grade|subject". */
  tracks: Record<string, TaxonomyNode[]>;
  /** Verified Lernbereiche, keyed by "schoolType|grade|subject[|track]". */
  topics: Record<string, ManifestTopic[]>;
  /** Verified content-page URL, keyed the same way as `topics`. */
  contentUrls: Record<string, string>;
}

export const LEHRPLANPLUS_BAYERN_MANIFEST: LehrplanPlusBayernManifest = {
  schoolYear: "2026/2027",
  capturedOn: "2026-07-19",
  sourceRevision: "LehrplanPLUS Bayern – including WS/FOS/BOS (2026-07-19)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "mittelschule",
      label: "Mittelschule",
    },
    {
      id: "foerderschule",
      label: "Förderschule",
    },
    {
      id: "realschule",
      label: "Realschule",
    },
    {
      id: "gymnasium",
      label: "Gymnasium",
    },
    {
      id: "wirtschaftsschule",
      label: "Wirtschaftsschule",
    },
    {
      id: "fos",
      label: "Fachoberschule",
    },
    {
      id: "bos",
      label: "Berufsoberschule",
    },
  ],

  grades: {
    realschule: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10", "11", "12", "13"],
    wirtschaftsschule: ["5", "6", "7", "8", "9", "10", "11"],
    fos: ["10", "11", "12", "13"],
    bos: ["10", "12", "13"],
  },

  subjects: {
    realschule: [
      {
        id: "bwl-rechnungswesen",
        label: "Betriebswirtschaftslehre / Rechnungswesen",
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
        id: "ernaehrung_und_gesundheit",
        label: "Ernährung und Gesundheit",
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
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "it",
        label: "Informationstechnologie",
      },
      {
        id: "iu",
        label: "Islamischer Unterricht",
      },
      {
        id: "ir",
        label: "Israelitische Religionslehre",
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
        id: "or",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "pug",
        label: "Politik und Gesellschaft",
      },
      {
        id: "soziallehre",
        label: "Soziallehre",
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
        id: "textiles-gestalten",
        label: "Textiles Gestalten",
      },
      {
        id: "werken",
        label: "Werken",
      },
      {
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
    ],
    gymnasium: [
      {
        id: "biologie",
        label: "Biologie",
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
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "iu",
        label: "Islamischer Unterricht",
      },
      {
        id: "ir",
        label: "Israelitische Religionslehre",
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
        id: "musik",
        label: "Musik",
      },
      {
        id: "nt_gym",
        label: "Natur und Technik (Gym)",
      },
      {
        id: "or",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "chemie",
        label: "Chemie",
      },
      {
        id: "chi",
        label: "Chinesisch",
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
        id: "pug",
        label: "Politik und Gesellschaft",
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
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
      {
        id: "wirtschaftsinformatik",
        label: "Wirtschaftsinformatik",
      },
      {
        id: "berufliche_orientierung",
        label: "Berufliche Orientierung",
      },
      {
        id: "sozialpraktische-grundbildung",
        label: "Sozialpraktische Grundbildung",
      },
      {
        id: "biolog-chem-praktikum",
        label: "Biologisch-chemisches Praktikum",
      },
      {
        id: "pln",
        label: "Polnisch",
      },
      {
        id: "sozialwissenschaftl-arbeitsfelder",
        label: "Sozialwissenschaftliche Arbeitsfelder",
      },
      {
        id: "tsh",
        label: "Tschechisch",
      },
      {
        id: "tr",
        label: "Türkisch",
      },
      {
        id: "ar",
        label: "Archäologie",
      },
      {
        id: "instrumentalensemble",
        label: "Instrumentalensemble",
      },
      {
        id: "ps",
        label: "Psychologie",
      },
      {
        id: "sug",
        label: "Sport und Gesellschaft",
      },
      {
        id: "stb",
        label: "Tanz- und Bewegungskünstetheater",
      },
      {
        id: "tuf",
        label: "Theater und Film",
      },
      {
        id: "vokalensemble",
        label: "Vokalensemble",
      },
      {
        id: "w-seminar",
        label: "Wissenschaftspropädeutisches Seminar",
      },
      {
        id: "geol",
        label: "Geologie",
      },
    ],
    wirtschaftsschule: [
      {
        id: "bsk",
        label: "Betriebswirtschaftliche Steuerung und Kontrolle",
      },
      {
        id: "deutsch",
        label: "Deutsch",
      },
      {
        id: "digitales-leben-und-arbeiten",
        label: "Digitale Bildung",
      },
      {
        id: "e-commerce",
        label: "E-Commerce",
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
        id: "fit_for_finance",
        label: "Fit for Finance",
      },
      {
        id: "gamification",
        label: "Gamification",
      },
      {
        id: "gesundheit",
        label: "Gesundheit",
      },
      {
        id: "gpug-ws",
        label: "Geschichte/Politik und Gesellschaft (WS)",
      },
      {
        id: "informationsverarbeitung",
        label: "Informationsverarbeitung",
      },
      {
        id: "katholische-religionslehre",
        label: "Katholische Religionslehre",
      },
      {
        id: "life_skills",
        label: "Life Skills",
      },
      {
        id: "mathematik",
        label: "Mathematik",
      },
      {
        id: "mensch-und-umwelt",
        label: "Mensch und Umwelt",
      },
      {
        id: "musischaesthetischebildung",
        label: "Musisch-ästhetische Bildung",
      },
      {
        id: "mut",
        label: "Mensch, Umwelt, Technik",
      },
      {
        id: "oeb",
        label: "Ökonomische Bildung",
      },
      {
        id: "oebdb",
        label: "Ökonomische Bildung und Digitale Bildung",
      },
      {
        id: "oeg",
        label: "Ökonomische Grundlagen",
      },
      {
        id: "pug",
        label: "Politik und Gesellschaft",
      },
      {
        id: "robotik",
        label: "Robotik",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "tourismus",
        label: "Tourismus",
      },
      {
        id: "uebungsunternehmen",
        label: "Übungsunternehmen",
      },
      {
        id: "umweltoekonomie",
        label: "Umweltökonomie",
      },
      {
        id: "umwelttechnik",
        label: "Umwelttechnik",
      },
      {
        id: "wirtschaft_aktuell",
        label: "Wirtschaft Aktuell",
      },
      {
        id: "wirtschaftsgeografie",
        label: "Wirtschaftsgeographie",
      },
    ],
    fos: [
      {
        id: "betriebswirtschaftslehre",
        label: "Betriebswirtschaftslehre",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "biotechnologie",
        label: "Biotechnologie",
      },
      {
        id: "bwl-rechnungswesen",
        label: "Betriebswirtschaftslehre / Rechnungswesen",
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
        id: "ebc",
        label: "English Book Club",
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
        id: "experimentelles_gestalten",
        label: "Experimentelles Gestalten",
      },
      {
        id: "fpa",
        label: "Fachpraktische Ausbildung",
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
        id: "gestaltung",
        label: "Gestaltung",
      },
      {
        id: "gpug-fosbos",
        label: "Geschichte/Politik und Gesellschaft (FOS/BOS)",
      },
      {
        id: "gw",
        label: "Gesundheitswissenschaften",
      },
      {
        id: "gwr",
        label: "Gesundheitswirtschaft und Recht",
      },
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "internationale_politik",
        label: "Internationale Politik",
      },
      {
        id: "isb",
        label: "International Business Studies",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "katholische-religionslehre",
        label: "Katholische Religionslehre",
      },
      {
        id: "ki",
        label: "Kommunikation und Interaktion",
      },
      {
        id: "kuenstliche_intelligenz_informatik_u_technologie",
        label: "Künstliche Intelligenz, Informatik und Technologie",
      },
      {
        id: "kuenstliche_intelligenz_u_wirtschaftsinformatik",
        label: "Künstliche Intelligenz und Wirtschaftsinformatik",
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
        id: "medien",
        label: "Medien",
      },
      {
        id: "musik",
        label: "Musik",
      },
      {
        id: "nt-bo",
        label: "Naturwissenschaften",
      },
      {
        id: "paedagigik-psychologie",
        label: "Pädagogik/Psychologie",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "pug",
        label: "Politik und Gesellschaft",
      },
      {
        id: "rechtslehre",
        label: "Rechtslehre",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sg",
        label: "Spektrum der Gesundheit",
      },
      {
        id: "sozialwirtschaft-und-recht",
        label: "Sozialwirtschaft und Recht",
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
        id: "studier-und-arbeitstechniken",
        label: "Studier- und Arbeitstechniken",
      },
      {
        id: "technologie",
        label: "Technologie",
      },
      {
        id: "volkswirtschaftslehre",
        label: "Volkswirtschaftslehre",
      },
      {
        id: "wirtschaft_aktuell",
        label: "Wirtschaft Aktuell",
      },
      {
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
    ],
    bos: [
      {
        id: "betriebswirtschaftslehre",
        label: "Betriebswirtschaftslehre",
      },
      {
        id: "biologie",
        label: "Biologie",
      },
      {
        id: "biotechnologie",
        label: "Biotechnologie",
      },
      {
        id: "bwl-rechnungswesen",
        label: "Betriebswirtschaftslehre / Rechnungswesen",
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
        id: "ebc",
        label: "English Book Club",
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
        id: "gpug-fosbos",
        label: "Geschichte/Politik und Gesellschaft (FOS/BOS)",
      },
      {
        id: "gw",
        label: "Gesundheitswissenschaften",
      },
      {
        id: "gwr",
        label: "Gesundheitswirtschaft und Recht",
      },
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre",
      },
      {
        id: "informatik",
        label: "Informatik",
      },
      {
        id: "internationale_politik",
        label: "Internationale Politik",
      },
      {
        id: "isb",
        label: "International Business Studies",
      },
      {
        id: "italienisch",
        label: "Italienisch",
      },
      {
        id: "katholische-religionslehre",
        label: "Katholische Religionslehre",
      },
      {
        id: "ki",
        label: "Kommunikation und Interaktion",
      },
      {
        id: "kuenstliche_intelligenz_informatik_u_technologie",
        label: "Künstliche Intelligenz, Informatik und Technologie",
      },
      {
        id: "kuenstliche_intelligenz_u_wirtschaftsinformatik",
        label: "Künstliche Intelligenz und Wirtschaftsinformatik",
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
        id: "nt-bo",
        label: "Naturwissenschaften",
      },
      {
        id: "paedagigik-psychologie",
        label: "Pädagogik/Psychologie",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "pug",
        label: "Politik und Gesellschaft",
      },
      {
        id: "russisch",
        label: "Russisch",
      },
      {
        id: "sg",
        label: "Spektrum der Gesundheit",
      },
      {
        id: "sozialwirtschaft-und-recht",
        label: "Sozialwirtschaft und Recht",
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
        id: "studier-und-arbeitstechniken",
        label: "Studier- und Arbeitstechniken",
      },
      {
        id: "technologie",
        label: "Technologie",
      },
      {
        id: "volkswirtschaftslehre",
        label: "Volkswirtschaftslehre",
      },
      {
        id: "wirtschaft_aktuell",
        label: "Wirtschaft Aktuell",
      },
      {
        id: "wirtschaft-und-recht",
        label: "Wirtschaft und Recht",
      },
    ],
  },

  tracks: {
    "realschule|5|sport": [
      {
        id: "basis_sport",
        label: "Basissport 5",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "realschule|6|sport": [
      {
        id: "basis_sport",
        label: "Basissport 6",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "realschule|7|mathematik": [
      {
        id: "wpfg1",
        label: "Mathematik 7 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 7 (II/III)",
      },
    ],
    "realschule|7|sport": [
      {
        id: "basis_sport",
        label: "Basissport 7",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "realschule|8|mathematik": [
      {
        id: "wpfg1",
        label: "Mathematik 8 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 8 (II/III)",
      },
    ],
    "realschule|8|physik": [
      {
        id: "wpfg1",
        label: "Physik 8 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Physik 8 (II/III)",
      },
    ],
    "realschule|8|sport": [
      {
        id: "basis_sport",
        label: "Basissport 8",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "realschule|9|mathematik": [
      {
        id: "wpfg1",
        label: "Mathematik 9 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 9 (II/III)",
      },
    ],
    "realschule|9|physik": [
      {
        id: "wpfg1",
        label: "Physik 9 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Physik 9 (II/III)",
      },
    ],
    "realschule|9|sport": [
      {
        id: "basis_sport",
        label: "Basissport 9",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "realschule|10|mathematik": [
      {
        id: "wpfg1",
        label: "Mathematik 10 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 10 (II/III)",
      },
    ],
    "realschule|10|physik": [
      {
        id: "wpfg1",
        label: "Physik 10 (I)",
      },
      {
        id: "wpfg2-3",
        label: "Physik 10 (II/III)",
      },
    ],
    "realschule|10|sport": [
      {
        id: "basis_sport",
        label: "Basissport 10",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|5|sport": [
      {
        id: "basis_sport",
        label: "Basissport 5",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|6|englisch": [
      {
        id: "1-fremdsprache",
        label: "Englisch 6 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Englisch 6 (2. Fremdsprache)",
      },
    ],
    "gymnasium|6|franzoesisch": [
      {
        id: "1-fremdsprache",
        label: "Französisch 6 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Französisch 6 (2. Fremdsprache)",
      },
    ],
    "gymnasium|6|latein": [
      {
        id: "1-fremdsprache",
        label: "Latein 6 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Latein 6 (2. Fremdsprache)",
      },
    ],
    "gymnasium|6|sport": [
      {
        id: "basis_sport",
        label: "Basissport 6",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|7|englisch": [
      {
        id: "1-fremdsprache",
        label: "Englisch 7 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Englisch 7 (2. Fremdsprache)",
      },
    ],
    "gymnasium|7|franzoesisch": [
      {
        id: "1-fremdsprache",
        label: "Französisch 7 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Französisch 7 (2. Fremdsprache)",
      },
    ],
    "gymnasium|7|latein": [
      {
        id: "1-fremdsprache",
        label: "Latein 7 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Latein 7 (2. Fremdsprache)",
      },
    ],
    "gymnasium|7|sport": [
      {
        id: "basis_sport",
        label: "Basissport 7",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|8|englisch": [
      {
        id: "1-fremdsprache",
        label: "Englisch 8 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Englisch 8 (2. Fremdsprache)",
      },
    ],
    "gymnasium|8|franzoesisch": [
      {
        id: "1fs",
        label: "Französisch 8 (1. Fremdsprache)",
      },
      {
        id: "2fs",
        label: "Französisch 8 (2. Fremdsprache)",
      },
      {
        id: "3-fremdsprache",
        label: "Französisch 8 (3. Fremdsprache)",
      },
    ],
    "gymnasium|8|latein": [
      {
        id: "1-fremdsprache",
        label: "Latein 8 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Latein 8 (2. Fremdsprache)",
      },
    ],
    "gymnasium|8|sport": [
      {
        id: "basis_sport",
        label: "Basissport 8",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|9|chemie": [
      {
        id: "ch",
        label: "Chemie 9 (HG, SG, MuG, WWG, SWG)",
      },
      {
        id: "ch-ntg",
        label: "Chemie 9 (NTG)",
      },
    ],
    "gymnasium|9|englisch": [
      {
        id: "1-fremdsprache",
        label: "Englisch 9 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Englisch 9 (2. Fremdsprache)",
      },
    ],
    "gymnasium|9|franzoesisch": [
      {
        id: "1-fremdsprache",
        label: "Französisch 9 (1. Fremdsprache)",
      },
      {
        id: "2-fremdsprache",
        label: "Französisch 9 (2. Fremdsprache)",
      },
      {
        id: "3-fremdsprache",
        label: "Französisch 9 (3. Fremdsprache)",
      },
    ],
    "gymnasium|9|sport": [
      {
        id: "basis_sport",
        label: "Basissport 9",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|10|chemie": [
      {
        id: "ch",
        label: "Chemie 10 (HG, SG, MuG, WWG, SWG)",
      },
      {
        id: "ch-ntg",
        label: "Chemie 10 (NTG)",
      },
    ],
    "gymnasium|10|franzoesisch": [
      {
        id: "1-2-fremdsprache",
        label: "Französisch 10 (1. und 2. Fremdsprache)",
      },
      {
        id: "3-fremdsprache",
        label: "Französisch 10 (3. Fremdsprache)",
      },
    ],
    "gymnasium|10|pug": [
      {
        id: "einstuendig",
        label: "Politik und Gesellschaft 10 (HG, SG, NTG, MuG, WWG)",
      },
      {
        id: "zweistuendig",
        label: "Politik und Gesellschaft 10 (SWG)",
      },
    ],
    "gymnasium|10|sport": [
      {
        id: "basis_sport",
        label: "Basissport 10",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|10|wirtschaft-und-recht": [
      {
        id: "andere",
        label: "Wirtschaft und Recht 10 (HG, SG, NTG, MuG, SWG)",
      },
      {
        id: "wwg",
        label: "Wirtschaft und Recht 10 (WWG)",
      },
    ],
    "gymnasium|11|chi": [
      {
        id: "fs3",
        label: "Chinesisch 11 (3. Fremdsprache)",
      },
      {
        id: "spaet",
        label: "Chinesisch 11 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|11|franzoesisch": [
      {
        id: "1-2-fremdsprache",
        label: "Französisch 11 (1. und 2. Fremdsprache)",
      },
      {
        id: "3-fremdsprache",
        label: "Französisch 11 (3. Fremdsprache)",
      },
      {
        id: "spaet-fremdsprache",
        label: "Französisch 11 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|11|informatik": [
      {
        id: "ntg",
        label: "Informatik 11 (NTG)",
      },
      {
        id: "mug_swg_sg",
        label: "spät beginnende Informatik 11 (HG, SG, MuG, SWG)",
      },
    ],
    "gymnasium|11|italienisch": [
      {
        id: "3-fremdsprache",
        label: "Italienisch 11 (3. Fremdsprache)",
      },
      {
        id: "spaet-fremdsprache",
        label: "Italienisch 11 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|11|pug": [
      {
        id: "zweistuendig",
        label: "Politik und Gesellschaft 11 (HG, SG, NTG, MuG, WWG)",
      },
      {
        id: "dreistuendig",
        label: "Politik und Gesellschaft 11 (SWG)",
      },
    ],
    "gymnasium|11|russisch": [
      {
        id: "3-fremdsprache",
        label: "Russisch 11 (3. Fremdsprache)",
      },
      {
        id: "spaet-fremdsprache",
        label: "Russisch 11 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|11|spanisch": [
      {
        id: "3-fremdsprache",
        label: "Spanisch 11 (3. Fremdsprache)",
      },
      {
        id: "spaet-fremdsprache",
        label: "Spanisch 11 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|11|sport": [
      {
        id: "basis_sport",
        label: "Basissport 11",
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
      },
    ],
    "gymnasium|11|wirtschaft-und-recht": [
      {
        id: "andere",
        label: "Wirtschaft und Recht 11 (HG, SG, NTG, MuG, SWG)",
      },
      {
        id: "wwg",
        label: "Wirtschaft und Recht 11 (WWG)",
      },
    ],
    "gymnasium|12|biologie": [
      {
        id: "grundlegend",
        label: "Biologie 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Biologie 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|chemie": [
      {
        id: "grundlegend",
        label: "Chemie 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Chemie 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|chi": [
      {
        id: "grundlegend-spaet",
        label: "Chinesisch 12 (spät beginnende Fremdsprache)",
      },
      {
        id: "grundlegend-3",
        label:
          "Chinesisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
    ],
    "gymnasium|12|deutsch": [
      {
        id: "regulaer",
        label: "Deutsch 12/13 (erhöhtes Anforderungsniveau)",
      },
      {
        id: "vertieft",
        label: "Deutsch 12 (Vertiefungskurs)",
      },
    ],
    "gymnasium|12|englisch": [
      {
        id: "grundlegend",
        label: "Englisch 12/13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Englisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|ethik": [
      {
        id: "grundlegend",
        label: "Ethik 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Ethik 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|evangelische-religionslehre": [
      {
        id: "grundlegend",
        label:
          "Evangelische Religionslehre 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Evangelische Religionslehre 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|franzoesisch": [
      {
        id: "grundlegend-1-2-3",
        label:
          "Französisch 12/13 (grundlegendes Anforderungsniveau, 1., 2. und 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Französisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Französisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|geographie": [
      {
        id: "grundlegend",
        label: "Geographie 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Geographie 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|geschichte": [
      {
        id: "grundlegend",
        label: "Geschichte 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Geschichte 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|griechisch": [
      {
        id: "grundlegend",
        label: "Griechisch 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Griechisch 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|informatik": [
      {
        id: "grundlegend",
        label: "Informatik 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Informatik 12 (erhöhtes Anforderungsniveau)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "spät beginnende Informatik 12 (grundlegendes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|ir": [
      {
        id: "grundlegend",
        label:
          "Israelitische Religionslehre 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Israelitische Religionslehre 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|italienisch": [
      {
        id: "grundlegend-3",
        label:
          "Italienisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Italienisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label:
          "Italienisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache)",
      },
    ],
    "gymnasium|12|katholische-religionslehre": [
      {
        id: "grundlegend",
        label:
          "Katholische Religionslehre 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Katholische Religionslehre 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|kunst": [
      {
        id: "grundlegend",
        label: "Kunst 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Kunst 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|latein": [
      {
        id: "grundlegend",
        label: "Latein 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Latein 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|mathematik": [
      {
        id: "regulaer",
        label: "Mathematik 12 (erhöhtes Anforderungsniveau)",
      },
      {
        id: "vertieft",
        label: "Mathematik 12 (Vertiefungskurs)",
      },
    ],
    "gymnasium|12|musik": [
      {
        id: "grundlegend",
        label: "Musik 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Musik 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|or": [
      {
        id: "grundlegend",
        label: "Orthodoxe Religionslehre 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Orthodoxe Religionslehre 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|physik": [
      {
        id: "grundlegend",
        label: "Physik 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "grundlegend-bio",
        label: "Physik 12 (grundlegendes Anforderungsniveau, Biophysik)",
      },
      {
        id: "erhoeht",
        label: "Physik 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|pug": [
      {
        id: "grundlegend",
        label: "Politik und Gesellschaft 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Politik und Gesellschaft 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|russisch": [
      {
        id: "grundlegend-3",
        label:
          "Russisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Russisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Russisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache)",
      },
    ],
    "gymnasium|12|spanisch": [
      {
        id: "grundlegend-3",
        label:
          "Spanisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Spanisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Spanisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|sport": [
      {
        id: "basissport",
        label: "Sport 12/13",
      },
      {
        id: "sporttheorie",
        label: "Sporttheorie 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|12|wirtschaft-und-recht": [
      {
        id: "grundlegend",
        label: "Wirtschaft und Recht 12 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Wirtschaft und Recht 12 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|biologie": [
      {
        id: "grundlegend",
        label: "Biologie 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Biologie 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|chemie": [
      {
        id: "grundlegend",
        label: "Chemie 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Chemie 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|chi": [
      {
        id: "grundlegend-3",
        label:
          "Chinesisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label: "Chinesisch 13 (spät beginnende Fremdsprache)",
      },
    ],
    "gymnasium|13|englisch": [
      {
        id: "grundlegend",
        label: "Englisch 12/13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Englisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|ethik": [
      {
        id: "grundlegend",
        label: "Ethik 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Ethik 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|evangelische-religionslehre": [
      {
        id: "grundlegend",
        label:
          "Evangelische Religionslehre 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Evangelische Religionslehre 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|franzoesisch": [
      {
        id: "grundlegend-1-2-3",
        label:
          "Französisch 12/13 (grundlegendes Anforderungsniveau, 1., 2. und 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Französisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Französisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|geographie": [
      {
        id: "grundlegend",
        label: "Geographie 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Geographie 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|geschichte": [
      {
        id: "grundlegend",
        label: "Geschichte 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Geschichte 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|griechisch": [
      {
        id: "grundlegend",
        label: "Griechisch 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Griechisch 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|informatik": [
      {
        id: "grundlegend",
        label:
          "Informatik 13 und spät beginnende Informatik 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Informatik 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|ir": [
      {
        id: "grundlegend",
        label:
          "Israelitische Religionslehre 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Israelitische Religionslehre 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|italienisch": [
      {
        id: "grundlegend-3",
        label:
          "Italienisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Italienisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label:
          "Italienisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache)",
      },
    ],
    "gymnasium|13|katholische-religionslehre": [
      {
        id: "grundlegend",
        label:
          "Katholische Religionslehre 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Katholische Religionslehre 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|kunst": [
      {
        id: "grundlegend",
        label: "Kunst 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Kunst 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|latein": [
      {
        id: "grundlegend",
        label: "Latein 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Latein 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|musik": [
      {
        id: "grundlegend",
        label: "Musik 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Musik 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|or": [
      {
        id: "grundlegend",
        label: "Orthodoxe Religionslehre 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Orthodoxe Religionslehre 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|physik": [
      {
        id: "grundlegend",
        label: "Physik 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "grundlegend-astro",
        label: "Physik 13 (grundlegendes Anforderungsniveau, Astrophysik)",
      },
      {
        id: "erhoeht",
        label: "Physik 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|pug": [
      {
        id: "grundlegend",
        label: "Politik und Gesellschaft 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Politik und Gesellschaft 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|russisch": [
      {
        id: "grundlegend-3",
        label:
          "Russisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Russisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Russisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache)",
      },
    ],
    "gymnasium|13|spanisch": [
      {
        id: "grundlegend-3",
        label:
          "Spanisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache)",
      },
      {
        id: "grundlegend-spaet",
        label:
          "Spanisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache)",
      },
      {
        id: "erhoeht",
        label: "Spanisch 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|sport": [
      {
        id: "basissport",
        label: "Sport 12/13",
      },
      {
        id: "sporttheorie",
        label: "Sporttheorie 12/13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "gymnasium|13|wirtschaft-und-recht": [
      {
        id: "grundlegend",
        label: "Wirtschaft und Recht 13 (grundlegendes Anforderungsniveau)",
      },
      {
        id: "erhoeht",
        label: "Wirtschaft und Recht 13 (erhöhtes Anforderungsniveau)",
      },
    ],
    "bos|10|biologie": [
      {
        id: "abu",
        label: "Biologie Vorklasse (ABU)",
      },
      {
        id: "s-gh",
        label: "Biologie Vorklasse (S, GH)",
      },
    ],
    "bos|10|deutsch": [
      {
        id: "vorklasse",
        label: "Deutsch Vorklasse",
      },
      {
        id: "vorklasse_gueltig_ab_26_27",
        label: "Deutsch Vorklasse, gültig ab SJ 2026/27",
      },
      {
        id: "vorkurs",
        label: "Deutsch Vorkurs",
      },
      {
        id: "vorkurs_guelitg_ab_26_27",
        label: "Deutsch Vorkurs, gültig ab SJ 2026/27",
      },
    ],
    "bos|10|englisch": [
      {
        id: "vorklasse",
        label: "Englisch Vorklasse",
      },
      {
        id: "vorkurs",
        label: "Englisch Vorkurs",
      },
    ],
    "bos|10|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften Vorklasse (GH)",
      },
      {
        id: "aktuell_gueltig_ab_26_27",
        label: "Gesundheitswissenschaften Vorklasse (GH), gültig ab SJ 2026/27",
      },
    ],
    "bos|10|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre Vorklasse (IW)",
      },
      {
        id: "ibv_gueltig_ab_26_27",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre Vorklasse (IW), gültig ab SJ 2026/27",
      },
    ],
    "bos|10|mathematik": [
      {
        id: "vorklasse",
        label: "Mathematik Vorklasse",
      },
      {
        id: "vorkurs",
        label: "Mathematik Vorkurs",
      },
    ],
    "bos|12|biologie": [
      {
        id: "abu",
        label: "Biologie 12 (ABU)",
      },
      {
        id: "g",
        label: "Biologie 12 (GH)",
      },
      {
        id: "s",
        label: "Biologie 12 (S)",
      },
      {
        id: "wahl-t-w-iw",
        label:
          "Aspekte der Biologie 12 oder 13 (erweiterndes Wahlpflichtfach T, W, IW)",
      },
    ],
    "bos|12|chemie": [
      {
        id: "abu",
        label: "Chemie 12 (ABU)",
      },
      {
        id: "gh",
        label: "Chemie 12 (GH)",
      },
      {
        id: "t",
        label: "Chemie 12 (T)",
      },
    ],
    "bos|12|franzoesisch": [
      {
        id: "franzoesisch_ahr",
        label: "Französisch 12 (AHR)",
      },
      {
        id: "franzoesisch_aufbaukurs",
        label: "Französisch Aufbaukurs 12 (Pflichtfach IW)",
      },
      {
        id: "franzoesisch_fortgefuehrt",
        label:
          "Französisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "franzoesisch_grundkurs",
        label: "Französisch Grundkurs 12 (Pflichtfach IW)",
      },
    ],
    "bos|12|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften 12 (GH)",
      },
    ],
    "bos|12|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 12 (IW)",
      },
    ],
    "bos|12|informatik": [
      {
        id: "abu-s-w-gh",
        label:
          "Informatik 12 (Profilfach W, vertiefendes Wahlpflichtfach IW, erweiterndes Wahlpflichtfach S, ABU, GH)",
      },
      {
        id: "wahl-t-iw",
        label: "Informatik 12 (vertiefendes Wahlpflichtfach T)",
      },
    ],
    "bos|12|isb": [
      {
        id: "pflicht-iw",
        label: "International Business Studies 12 (Pflichtfach IW)",
      },
      {
        id: "wahl-abu-t-w-s-gh",
        label:
          "International Business Studies 12 oder 13 (erweiterndes Wahlpflichtfach ABU, T, W, S, GH)",
      },
    ],
    "bos|12|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "abu",
        label: "Künstliche Intelligenz, Informatik und Technologie 12",
      },
      {
        id: "t",
        label: "Künstliche Intelligenz, Informatik und Technologie 12",
      },
    ],
    "bos|12|mathematik": [
      {
        id: "abu-s-w-gh-iw",
        label: "Mathematik 12 (ABU, S, W, GH, IW)",
      },
      {
        id: "t",
        label: "Mathematik 12 (T)",
      },
      {
        id: "Wahl-abu-s-w-gh-iw",
        label: "Mathematik Additum 12 (ABU, S, W, GH, IW)",
      },
      {
        id: "wahl-t",
        label: "Mathematik Additum 12 (T)",
      },
    ],
    "bos|12|paedagigik-psychologie": [
      {
        id: "s",
        label: "Pädagogik/Psychologie 12 (S)",
      },
    ],
    "bos|12|physik": [
      {
        id: "abu",
        label: "Physik 12 (ABU)",
      },
      {
        id: "s-w-gh-iw",
        label:
          "Aspekte der Physik 12 (erweiterndes Wahlplichtfach S,W, GH, IW)",
      },
      {
        id: "t",
        label: "Physik 12 (T)",
      },
    ],
    "bos|12|soziologie": [
      {
        id: "s",
        label: "Soziologie 12 (Pflichtfach S)",
      },
      {
        id: "wahl-abu-t-w-iw-gh",
        label:
          "Soziologie 12 oder 13 (erweiterndes Wahlpflichtfach ABU, T, W, IW, GH)",
      },
    ],
    "bos|12|spanisch": [
      {
        id: "spanisch_ahr",
        label: "Spanisch 12 (AHR)",
      },
      {
        id: "spanisch_aufbaukurs",
        label: "Spanisch Aufbaukurs 12 (Pflichtfach IW)",
      },
      {
        id: "spanisch_fortgefuehrt",
        label: "Spanisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "spanisch_grundkurs",
        label: "Spanisch Grundkurs 12 (Pflichtfach IW)",
      },
    ],
    "bos|12|technologie": [
      {
        id: "abu",
        label: "Technologie 12 (ABU)",
      },
      {
        id: "t",
        label: "Technologie 12 (T)",
      },
    ],
    "bos|13|biologie": [
      {
        id: "abu",
        label: "Biologie 13 (ABU)",
      },
      {
        id: "g",
        label: "Biologie 13 (GH)",
      },
      {
        id: "s",
        label: "Biologie 13 (S)",
      },
      {
        id: "wahl-t-w-iw",
        label:
          "Aspekte der Biologie 12 oder 13 (erweiterndes Wahlpflichtfach T, W, IW)",
      },
    ],
    "bos|13|chemie": [
      {
        id: "abu",
        label: "Chemie 13 (ABU)",
      },
      {
        id: "t",
        label: "Chemie 13 (T)",
      },
    ],
    "bos|13|franzoesisch": [
      {
        id: "franzoesisch_ahr",
        label: "Französisch 13 (AHR)",
      },
      {
        id: "franzoesisch_aufbaukurs",
        label: "Französisch Aufbaukurs 13 (Pflichtfach IW)",
      },
      {
        id: "franzoesisch_fortgefuehrt",
        label:
          "Französisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "franzoesisch_grundkurs",
        label: "Französisch Grundkurs 13 (Pflichtfach IW)",
      },
    ],
    "bos|13|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften 13 (GH)",
      },
    ],
    "bos|13|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 13 (IW)",
      },
    ],
    "bos|13|informatik": [
      {
        id: "wahl-abu-s-w-gh",
        label:
          "Informatik 13 (vertiefendes Wahlpflichtfach IW, erweiterndes Wahlpflichtfach S, ABU, W, GH)",
      },
      {
        id: "wahl-t-iw",
        label: "Informatik 13 (vertiefendes Wahlpflichtfach T)",
      },
    ],
    "bos|13|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "abu",
        label: "Künstliche Intelligenz, Informatik und Technologie 13",
      },
      {
        id: "t",
        label: "Künstliche Intelligenz, Informatik und Technologie 13",
      },
    ],
    "bos|13|mathematik": [
      {
        id: "abu-s-w-gh-iw",
        label: "Mathematik 13 (ABU, S, W, GH, IW)",
      },
      {
        id: "t",
        label: "Mathematik 13 (T)",
      },
      {
        id: "wahl-abu-s-w-t",
        label: "Mathematik Additum 13",
      },
    ],
    "bos|13|paedagigik-psychologie": [
      {
        id: "s",
        label: "Pädagogik/Psychologie 13 (S)",
      },
    ],
    "bos|13|physik": [
      {
        id: "s-w-gh-iw",
        label:
          "Aspekte der Physik 13 (erweiterndes Wahlplichtfach S,W, GH, IW)",
      },
      {
        id: "t",
        label: "Physik 13 (T)",
      },
      {
        id: "wahl-abu",
        label: "Physik Additum 13 (ABU)",
      },
    ],
    "bos|13|spanisch": [
      {
        id: "spanisch_ahr",
        label: "Spanisch 13 (AHR)",
      },
      {
        id: "spanisch_aufbaukurs",
        label: "Spanisch Aufbaukurs 13 (Pflichtfach IW)",
      },
      {
        id: "spanisch_fortgefuehrt",
        label: "Spanisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "spanisch_grundkurs",
        label: "Spanisch Grundkurs 13 (Pflichtfach IW)",
      },
    ],
    "bos|13|technologie": [
      {
        id: "abu",
        label: "Technologie 13 (ABU)",
      },
      {
        id: "t",
        label: "Technologie 13 (T)",
      },
    ],
    "fos|10|biologie": [
      {
        id: "abu",
        label: "Biologie Vorklasse (ABU)",
      },
      {
        id: "s-gh",
        label: "Biologie Vorklasse (S, GH)",
      },
    ],
    "fos|10|deutsch": [
      {
        id: "vorklasse",
        label: "Deutsch Vorklasse",
      },
      {
        id: "vorklasse_gueltig_ab_26_27",
        label: "Deutsch Vorklasse, gültig ab SJ 2026/27",
      },
      {
        id: "vorkurs",
        label: "Deutsch Vorkurs",
      },
      {
        id: "vorkurs_guelitg_ab_26_27",
        label: "Deutsch Vorkurs, gültig ab SJ 2026/27",
      },
    ],
    "fos|10|englisch": [
      {
        id: "vorklasse",
        label: "Englisch Vorklasse",
      },
      {
        id: "vorkurs",
        label: "Englisch Vorkurs",
      },
    ],
    "fos|10|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften Vorklasse (GH)",
      },
      {
        id: "aktuell_gueltig_ab_26_27",
        label: "Gesundheitswissenschaften Vorklasse (GH), gültig ab SJ 2026/27",
      },
    ],
    "fos|10|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre Vorklasse (IW)",
      },
      {
        id: "ibv_gueltig_ab_26_27",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre Vorklasse (IW), gültig ab SJ 2026/27",
      },
    ],
    "fos|10|mathematik": [
      {
        id: "vorklasse",
        label: "Mathematik Vorklasse",
      },
      {
        id: "vorkurs",
        label: "Mathematik Vorkurs",
      },
    ],
    "fos|11|chemie": [
      {
        id: "abu",
        label: "Chemie 11 (ABU)",
      },
      {
        id: "gh",
        label: "Chemie 11 (GH)",
      },
      {
        id: "s",
        label: "Chemie 11 (S)",
      },
      {
        id: "t",
        label: "Chemie 11 (T)",
      },
    ],
    "fos|11|deutsch": [
      {
        id: "gueltig_ab_26_27",
        label: "Deutsch 11, gültig ab SJ 2026/27",
      },
      {
        id: "gueltig_bis_26_27",
        label: "Deutsch 11",
      },
    ],
    "fos|11|fpa": [
      {
        id: "abu-taetigkeit",
        label:
          "Agrarwirtschaft, Bio- und Umwelttechnologie – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "abu-vertiefung",
        label:
          "Agrarwirtschaft, Bio- und Umwelttechnologie – fachpraktische Vertiefung",
      },
      {
        id: "g-taetigkeit",
        label: "Gestaltung – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "g-vertiefung",
        label: "Gestaltung – fachpraktische Vertiefung",
      },
      {
        id: "gesundheit-taetigkeit",
        label: "Gesundheit – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "gesundheit-vertiefung",
        label: "Gesundheit – fachpraktische Vertiefung",
      },
      {
        id: "internat-wirtschaft-vertiefung",
        label: "Internationale Wirtschaft – fachpraktische Vertiefung",
      },
      {
        id: "iw-taetigkeit",
        label:
          "Internationale Wirtschaft – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "s-taetigkeit",
        label: "Sozialwesen – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "s-vertiefung",
        label: "Sozialwesen – fachpraktische Vertiefung",
      },
      {
        id: "t-taetigkeit",
        label: "Technik – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "t-vertiefung",
        label: "Technik – fachpraktische Vertiefung",
      },
      {
        id: "w-taetigkeit",
        label:
          "Wirtschaft und Verwaltung – fachpraktische Tätigkeit und Anleitung",
      },
      {
        id: "w-vertiefung",
        label: "Wirtschaft und Verwaltung – fachpraktische Vertiefung",
      },
    ],
    "fos|11|franzoesisch": [
      {
        id: "franzoesisch_aufbaukurs",
        label: "Französisch Aufbaukurs 11/12 (Pflichtfach IW)",
      },
      {
        id: "franzoesisch_grundkurs",
        label: "Französisch Grundkurs 11/12 (Pflichtfach IW)",
      },
    ],
    "fos|11|gestaltung": [
      {
        id: "praxis",
        label: "Gestaltung – Praxis 11",
      },
      {
        id: "theorie",
        label: "Gestaltung – Theorie 11",
      },
    ],
    "fos|11|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften 11 (GH)",
      },
      {
        id: "aktuell_gueltig_ab_26_27",
        label: "Gesundheitswissenschaften 11 (GH), gültig ab SJ 2026/27",
      },
    ],
    "fos|11|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 11 (IW)",
      },
      {
        id: "ibv_gueltig_ab_26_27",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 11 (IW), gültig ab SJ 2026/27",
      },
    ],
    "fos|11|mathematik": [
      {
        id: "abu-g-s-w-gh-iw",
        label: "Mathematik 11 (ABU, G, S, W, GH, IW)",
      },
      {
        id: "abu-g-s-w-gh-iw_gueltig_ab_26_27",
        label: "Mathematik 11 (ABU, G, S, W, GH, IW), gültig ab SJ 2026/27",
      },
      {
        id: "t",
        label: "Mathematik 11 (T)",
      },
      {
        id: "t_gueltig_ab_26_27",
        label: "Mathematik 11 (T), gültig ab SJ 2026/27",
      },
    ],
    "fos|11|paedagigik-psychologie": [
      {
        id: "s",
        label: "Pädagogik/Psychologie 11 (S)",
      },
      {
        id: "s_gueltig_ab_26_27",
        label: "Pädagogik/Psychologie 11 (S), gültig ab SJ 2026/27",
      },
    ],
    "fos|11|physik": [
      {
        id: "abu",
        label: "Physik 11 (ABU)",
      },
      {
        id: "t",
        label: "Physik 11 (T)",
      },
      {
        id: "t_gueltig_ab_26_27",
        label: "Physik 11 (T), gültig ab SJ 2026/27",
      },
    ],
    "fos|11|rechtslehre": [
      {
        id: "iw",
        label: "Rechtslehre 11 (IW)",
      },
      {
        id: "w",
        label: "Rechtslehre 11 (W)",
      },
    ],
    "fos|11|spanisch": [
      {
        id: "spanisch_aufbaukurs",
        label: "Spanisch Aufbaukurs 11/12 (Pflichtfach IW)",
      },
      {
        id: "spanisch_grundkurs",
        label: "Spanisch Grundkurs 11/12 (Pflichtfach IW)",
      },
    ],
    "fos|12|biologie": [
      {
        id: "abu",
        label: "Biologie 12 (ABU)",
      },
      {
        id: "g",
        label: "Biologie 12 (GH)",
      },
      {
        id: "s",
        label: "Biologie 12 (S)",
      },
      {
        id: "wahl-g-t-w-iw",
        label:
          "Aspekte der Biologie 12 oder 13 (erweiterndes Wahlpflichtfach G, T, W, IW)",
      },
    ],
    "fos|12|chemie": [
      {
        id: "abu",
        label: "Chemie 12 (ABU)",
      },
      {
        id: "gh",
        label: "Chemie 12 (GH)",
      },
      {
        id: "t",
        label: "Chemie 12 (T)",
      },
    ],
    "fos|12|deutsch": [
      {
        id: "gueltig_bis_26_27",
        label: "Deutsch 12",
      },
    ],
    "fos|12|franzoesisch": [
      {
        id: "franzoesisch_ahr",
        label: "Französisch 12 (AHR)",
      },
      {
        id: "franzoesisch_aufbaukurs",
        label: "Französisch Aufbaukurs 11/12 (Pflichtfach IW)",
      },
      {
        id: "franzoesisch_fortgefuehrt",
        label:
          "Französisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "franzoesisch_grundkurs",
        label: "Französisch Grundkurs 11/12 (Pflichtfach IW)",
      },
    ],
    "fos|12|gestaltung": [
      {
        id: "praxis",
        label: "Gestaltung – Praxis 12",
      },
      {
        id: "theorie",
        label: "Gestaltung – Theorie 12",
      },
    ],
    "fos|12|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften 12 (GH)",
      },
    ],
    "fos|12|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 12 (IW)",
      },
    ],
    "fos|12|informatik": [
      {
        id: "w-s-abu-g-gh",
        label:
          "Informatik 12 (Profilfach W, vertiefendes Wahlpflichtfach IW, erweiterndes Wahlpflichtfach S, ABU, G, GH)",
      },
      {
        id: "wahl-t-iw",
        label: "Informatik 12 (vertiefendes Wahlpflichtfach T)",
      },
    ],
    "fos|12|isb": [
      {
        id: "pflicht-iw",
        label: "International Business Studies 12 (Pflichtfach IW)",
      },
      {
        id: "wahl-abu-g-t-w-s-gh",
        label:
          "International Business Studies 12 oder 13 (erweiterndes Wahlpflichtfach ABU, G, T, W, S, GH)",
      },
    ],
    "fos|12|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "abu",
        label: "Künstliche Intelligenz, Informatik und Technologie 12",
      },
      {
        id: "t",
        label: "Künstliche Intelligenz, Informatik und Technologie 12",
      },
    ],
    "fos|12|mathematik": [
      {
        id: "abu-g-s-w-gh-iw",
        label: "Mathematik 12 (ABU, G, S, W, GH, IW)",
      },
      {
        id: "t",
        label: "Mathematik 12 (T)",
      },
      {
        id: "Wahl-abu-g-s-w-gh-iw",
        label: "Mathematik Additum 12 (ABU, G, S, W, GH, IW)",
      },
      {
        id: "wahl-t",
        label: "Mathematik Additum 12 (T)",
      },
    ],
    "fos|12|nt-bo": [
      {
        id: "g",
        label: "Naturwissenschaften 12 (G)",
      },
      {
        id: "w-iw",
        label: "Naturwissenschaften 12 (W, IW)",
      },
    ],
    "fos|12|paedagigik-psychologie": [
      {
        id: "s",
        label: "Pädagogik/Psychologie 12 (S)",
      },
    ],
    "fos|12|physik": [
      {
        id: "abu",
        label: "Physik 12 (ABU)",
      },
      {
        id: "t",
        label: "Physik 12 (T)",
      },
    ],
    "fos|12|soziologie": [
      {
        id: "abu-g-t-w-iw-gh",
        label:
          "Soziologie 12 oder 13 (erweiterndes Wahlpflichtfach ABU, G, T, W, IW, GH)",
      },
      {
        id: "s",
        label: "Soziologie 12 (Pflichtfach S)",
      },
    ],
    "fos|12|spanisch": [
      {
        id: "spanisch_ahr",
        label: "Spanisch 12 (AHR)",
      },
      {
        id: "spanisch_aufbaukurs",
        label: "Spanisch Aufbaukurs 11/12 (Pflichtfach IW)",
      },
      {
        id: "spanisch_fortgefuehrt",
        label: "Spanisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "spanisch_grundkurs",
        label: "Spanisch Grundkurs 11/12 (Pflichtfach IW)",
      },
    ],
    "fos|12|technologie": [
      {
        id: "abu",
        label: "Technologie 12 (ABU)",
      },
      {
        id: "t",
        label: "Technologie 12 (T)",
      },
    ],
    "fos|13|biologie": [
      {
        id: "abu",
        label: "Biologie 13 (ABU)",
      },
      {
        id: "g",
        label: "Biologie 13 (GH)",
      },
      {
        id: "s",
        label: "Biologie 13 (S)",
      },
      {
        id: "wahl-g-t-w-iw",
        label:
          "Aspekte der Biologie 12 oder 13 (erweiterndes Wahlpflichtfach G, T, W, IW)",
      },
    ],
    "fos|13|chemie": [
      {
        id: "abu",
        label: "Chemie 13 (ABU)",
      },
      {
        id: "t",
        label: "Chemie 13 (T)",
      },
    ],
    "fos|13|deutsch": [
      {
        id: "gueltig_bis_26_27",
        label: "Deutsch 13",
      },
    ],
    "fos|13|franzoesisch": [
      {
        id: "franzoesisch_ahr",
        label: "Französisch 13 (AHR)",
      },
      {
        id: "franzoesisch_aufbaukurs",
        label: "Französisch Aufbaukurs 13 (Pflichtfach IW)",
      },
      {
        id: "franzoesisch_fortgefuehrt",
        label:
          "Französisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "franzoesisch_grundkurs",
        label: "Französisch Grundkurs 13 (Pflichtfach IW)",
      },
    ],
    "fos|13|gw": [
      {
        id: "aktuell",
        label: "Gesundheitswissenschaften 13 (GH)",
      },
    ],
    "fos|13|ibv": [
      {
        id: "ibv",
        label:
          "Internationale Betriebswirtschaftslehre und Volkswirtschaftslehre 13 (IW)",
      },
    ],
    "fos|13|informatik": [
      {
        id: "w-s-abu-g-gh",
        label:
          "Informatik 13 (vertiefendes Wahlpflichtfach IW, erweiterndes Wahlpflichtfach S, ABU, G, W, GH)",
      },
      {
        id: "wahl-t-iw",
        label: "Informatik 13 (vertiefendes Wahlpflichtfach T)",
      },
    ],
    "fos|13|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "abu",
        label: "Künstliche Intelligenz, Informatik und Technologie 13",
      },
      {
        id: "t",
        label: "Künstliche Intelligenz, Informatik und Technologie 13",
      },
    ],
    "fos|13|mathematik": [
      {
        id: "abu-g-s-w-gh-iw",
        label: "Mathematik 13 (ABU, G, S, W, GH, IW)",
      },
      {
        id: "t",
        label: "Mathematik 13 (T)",
      },
      {
        id: "wahl-abu-g-s-w-t",
        label: "Mathematik Additum 13",
      },
    ],
    "fos|13|nt-bo": [
      {
        id: "g",
        label: "Naturwissenschaften 13 (G)",
      },
      {
        id: "w-iw",
        label: "Naturwissenschaften 13 (W, IW)",
      },
    ],
    "fos|13|paedagigik-psychologie": [
      {
        id: "s",
        label: "Pädagogik/Psychologie 13 (S)",
      },
    ],
    "fos|13|physik": [
      {
        id: "t",
        label: "Physik 13 (T)",
      },
      {
        id: "wahl-abu",
        label: "Physik Additum 13 (ABU)",
      },
    ],
    "fos|13|spanisch": [
      {
        id: "spanisch_ahr",
        label: "Spanisch 13 (AHR)",
      },
      {
        id: "spanisch_aufbaukurs",
        label: "Spanisch Aufbaukurs 13 (Pflichtfach IW)",
      },
      {
        id: "spanisch_fortgefuehrt",
        label: "Spanisch fortgeführt 12 und 13 (erweiterndes Wahlpflichtfach)",
      },
      {
        id: "spanisch_grundkurs",
        label: "Spanisch Grundkurs 13 (Pflichtfach IW)",
      },
    ],
    "fos|13|technologie": [
      {
        id: "abu",
        label: "Technologie 13 (ABU)",
      },
      {
        id: "t",
        label: "Technologie 13 (T)",
      },
    ],
    "wirtschaftsschule|10|bsk": [
      {
        id: "dreistufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|deutsch": [
      {
        id: "dreistufig_gueltig_ab_2627",
        label:
          "Deutsch 10 (dreistufige Wirtschaftsschule) - gültig ab SJ 2026/27",
      },
      {
        id: "vierstufig",
        label: "Deutsch 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig_gueltig_ab_2627",
        label:
          "Deutsch 10 (vierstufige Wirtschaftsschule) - gültig ab SJ 2026/27",
      },
      {
        id: "zweistufig_gueltig_ab_2526",
        label: "Deutsch 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|englisch": [
      {
        id: "dreistufig",
        label: "Englisch 10 (dreistufig Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Englisch 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig_gueltig_ab_2526",
        label:
          "Englisch 10 (zweistufige Wirtschaftsschule) - gültig ab SJ 2025/26",
      },
    ],
    "wirtschaftsschule|10|ethik": [
      {
        id: "dreistufig",
        label: "Ethik 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Ethik 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Ethik 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|evangelische-religionslehre": [
      {
        id: "dreistufig",
        label: "Evangelische Religionslehre 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Evangelische Religionslehre 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Evangelische Religionslehre 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|gpug-ws": [
      {
        id: "dreistufig",
        label:
          "Geschichte/Politik und Gesellschaft 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Geschichte/Politik und Gesellschaft 10 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|katholische-religionslehre": [
      {
        id: "dreistufig",
        label: "Katholische Religionslehre 10 (dreistufig Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Katholische Religionslehre 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Katholische Religionslehre 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|mathematik": [
      {
        id: "dreistufig",
        label: "Mathematik 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Mathematik 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Mathematik 10 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|sport": [
      {
        id: "diffsport",
        label:
          "Differenzierter Sport (vier- und dreistufige Wirtschaftsschule)",
      },
      {
        id: "dreistufig",
        label: "Basissport 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Basissport 10 (vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Basissport 10/11 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|uebungsunternehmen": [
      {
        id: "drei_vierstufig",
        label:
          "Übungsunternehmen 9/10 (drei- und vierstufige Wirtschaftsschule)",
      },
      {
        id: "zweistufig",
        label: "Übungsunternehmen 10/11 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|10|wirtschaftsgeografie": [
      {
        id: "dreistufig",
        label: "Wirtschaftsgeographie 10 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Wirtschaftsgeographie 10 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|11|deutsch": [
      {
        id: "zweistufig_gueltig_ab_2627",
        label:
          "Deutsch 11 (zweistufige Wirtschaftsschule) - gültig ab SJ 2026/27",
      },
    ],
    "wirtschaftsschule|11|uebungsunternehmen": [
      {
        id: "zweistufig",
        label: "Übungsunternehmen 10/11 (zweistufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|7|mathematik": [
      {
        id: "vierstufig",
        label: "Mathematik 7 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|7|sport": [
      {
        id: "diffsport",
        label:
          "Differenzierter Sport (vier- und dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Basissport 7 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|bsk": [
      {
        id: "dreistufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|deutsch": [
      {
        id: "dreistufig_gueltig_ab_2425",
        label: "Deutsch 8 (dreistufige Wirtschaftsschule) - gültig ab 2024/25",
      },
      {
        id: "vierstufig_gueltig_ab_2425",
        label: "Deutsch 8 (vierstufige Wirtschaftsschule) - gültig ab 2024/25",
      },
    ],
    "wirtschaftsschule|8|englisch": [
      {
        id: "dreistufig",
        label: "Englisch 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Englisch 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|ethik": [
      {
        id: "dreistufig",
        label: "Ethik 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Ethik 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|evangelische-religionslehre": [
      {
        id: "dreistufig",
        label: "Evangelische Religionslehre 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Evangelische Religionslehre 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|gpug-ws": [
      {
        id: "dreistufig",
        label:
          "Geschichte/Politik und Gesellschaft 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Geschichte/Politik und Gesellschaft 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|informationsverarbeitung": [
      {
        id: "dreistufig",
        label: "Informationsverarbeitung 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Informationsverarbeitung 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|katholische-religionslehre": [
      {
        id: "dreistufig",
        label: "Katholische Religionslehre 8 (dreistufig Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Katholische Religionslehre 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|mathematik": [
      {
        id: "dreistufig",
        label: "Mathematik 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Mathematik 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|mensch-und-umwelt": [
      {
        id: "dreistufig",
        label: "Mensch und Umwelt 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Mensch und Umwelt 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|musischaesthetischebildung": [
      {
        id: "dreistufig",
        label: "Musisch-ästhetische Bildung 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Musisch-ästhetische Bildung 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|mut": [
      {
        id: "dreistufig",
        label: "Mensch, Umwelt, Technik 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Mensch, Umwelt, Technik 7/8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|oebdb": [
      {
        id: "dreistufig",
        label:
          "Ökonomische Bildung und Digitale Bildung 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Ökonomische Bildung und Digitale Bildung 7/8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|8|sport": [
      {
        id: "diffsport",
        label:
          "Differenzierter Sport (vier- und dreistufige Wirtschaftsschule)",
      },
      {
        id: "dreistufig",
        label: "Basissport 8 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Basissport 8 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|bsk": [
      {
        id: "dreistufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Betriebswirtschaftliche Steuerung und Kontrolle 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|deutsch": [
      {
        id: "%20dreistufig",
        label: "Deutsch 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Deutsch 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|englisch": [
      {
        id: "dreistufig",
        label: "Englisch 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Englisch 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|ethik": [
      {
        id: "dreistufig",
        label: "Ethik 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Ethik 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|evangelische-religionslehre": [
      {
        id: "dreistufig",
        label: "Evangelische Religionslehre 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Evangelische Religionslehre 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|gpug-ws": [
      {
        id: "dreistufig",
        label:
          "Geschichte/Politik und Gesellschaft 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label:
          "Geschichte/Politik und Gesellschaft 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|katholische-religionslehre": [
      {
        id: "dreistufig",
        label: "Katholische Religionslehre 9 (dreistufig Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Katholische Religionslehre 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|mathematik": [
      {
        id: "dreistufig",
        label: "Mathematik 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Mathematik 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|sport": [
      {
        id: "diffsport",
        label:
          "Differenzierter Sport (vier- und dreistufige Wirtschaftsschule)",
      },
      {
        id: "dreistufig",
        label: "Basissport 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Basissport 9 (vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|uebungsunternehmen": [
      {
        id: "drei_vierstufig",
        label:
          "Übungsunternehmen 9/10 (drei- und vierstufige Wirtschaftsschule)",
      },
    ],
    "wirtschaftsschule|9|wirtschaft_aktuell": [
      {
        id: "dreistufig",
        label: "Wirtschaft Aktuell 9 (dreistufige Wirtschaftsschule)",
      },
      {
        id: "vierstufig",
        label: "Wirtschaft Aktuell 9 (vierstufige Wirtschaftsschule)",
      },
    ],
  },

  topics: {
    "realschule|5|biologie": [
      {
        id: "lb1",
        label: "Prozessbezogene Kompetenzen",
      },
      {
        id: "lb2",
        label: "Biologie, die Wissenschaft von den Lebewesen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Bau und Funktion des menschlichen Körpers",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Tiere und Pflanzen in der Umgebung des Menschen",
        hours: 20,
      },
    ],
    "realschule|5|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|5|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "realschule|5|ethik": [
      {
        id: "lb1",
        label: "Meine Wirklichkeit und ich",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Leben in der Familie",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Spielen",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Feste und Riten in Religion und Brauchtum",
        hours: 16,
      },
    ],
    "realschule|5|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Leben in Gemeinschaft",
      },
      {
        id: "lb2",
        label: "Die Bibel – Buch des Lebens",
      },
      {
        id: "lb3",
        label: "Erfahrungen mit Gott als Begleiter auf dem Lebensweg",
      },
      {
        id: "lb4",
        label: "Glaube wird sichtbar und hinterlässt Spuren",
      },
      {
        id: "lb5",
        label: "Schöpfung – Unsere Welt und unser Leben als Geschenk Gottes?",
      },
    ],
    "realschule|5|geographie": [
      {
        id: "lb1",
        label: "Einführung in das Fach",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Planet Erde",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Gestalt und Gliederung der Erde",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Veränderung der Erdoberfläche",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Naturräumliche und politische Strukturen in Deutschland und Bayern",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Anwendung im Nahraum",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Aktuelle geographische Fragestellung",
        hours: 4,
      },
    ],
    "realschule|5|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|5|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Eigene Aufgaben wahrnehmen",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Ausdrucksformen des Islams kennen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Gottesvorstellungen reflektieren",
      },
      {
        id: "lb4",
        label: "Propheten – Gottes Offenbarungen beschreiben",
      },
      {
        id: "lb5",
        label:
          "Muhammads Leben und Wirken – Eigenschaften von Vorbildern reflektieren",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Fachsprache entwickeln",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Historische Kontexte erläutern",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Gemeinsamkeiten und Unterschiede vergleichen",
      },
    ],
    "realschule|5|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Grundlagen des jüdischen Kalenders, Feiertage im Jahreskreis, Chanukka und Purim",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Schma und Amida, die beiden Hauptgebete",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Vertrauend einen neuen Anfang wagen",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Biblische Zeit und Monotheismus",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tora und Anawa (Bescheidenheit)",
        hours: 12,
      },
    ],
    "realschule|5|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Auf Gott vertrauen – einen neuen Anfang wagen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "„Umsorge mich mit deiner Liebe“ – beten und meditieren",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Erfahrungen mit Gott – Die Heilige Schrift",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          '„In jenen Tagen trat einer auf" – Jesus im Blickwinkel seiner Zeit und Umwelt',
        hours: 12,
      },
      {
        id: "lb5",
        label: "Leben in der Pfarrgemeinde – Eingebundensein in die Kirche",
        hours: 12,
      },
    ],
    "realschule|5|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 44,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 20,
      },
    ],
    "realschule|5|mathematik": [
      {
        id: "lb1",
        label: "Natürliche Zahlen",
        hours: 50,
      },
      {
        id: "lb2",
        label: "Ganze Zahlen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Geometrische Grundvorstellungen und Grundbegriffe",
        hours: 30,
      },
      {
        id: "lb4",
        label: "Größen",
        hours: 20,
      },
      {
        id: "lb5",
        label: "Umfang und Flächeninhalt ebener Figuren",
        hours: 15,
      },
      {
        id: "lb6",
        label: "Auswertung von Daten",
        hours: 5,
      },
    ],
    "realschule|5|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 16,
      },
    ],
    "realschule|5|or": [
      {
        id: "lb1",
        label: "Miteinander leben",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Von Gott und zu Gott sprechen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Die Bibel",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ursprung der Kirche",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Kirche vor Ort",
        hours: 12,
      },
    ],
    "realschule|5|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|5|sport|diff_sport": [
      {
        id: "lb1",
        label: "Bewegungskünste",
      },
      {
        id: "lb2",
        label: "Radsport",
      },
      {
        id: "lb3",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb4",
        label: "Sportklettern",
      },
    ],
    "realschule|5|textiles-gestalten": [
      {
        id: "lb1",
        label: "Eine textile Fläche bilden – Filzen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Eine textile Fläche bilden – Häkeln",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Eine textile Fläche bilden – Weben",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Eine textile Fläche bilden – Knüpfen",
        hours: 24,
      },
      {
        id: "lb5",
        label: "Eine textile Fläche verarbeiten – Handnähen, Maschinennähen",
        hours: 42,
      },
    ],
    "realschule|5|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Holz",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Arbeiten mit Papierwerkstoffen",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Arbeiten mit plastischen Massen",
        hours: 28,
      },
    ],
    "realschule|6|biologie": [
      {
        id: "lb1",
        label: "Prozessbezogene Kompetenzen",
      },
      {
        id: "lb2",
        label: "Fortpflanzung und Sexualität",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Vielfalt von Wirbeltieren",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Ein heimatnahes Ökosystem",
        hours: 18,
      },
    ],
    "realschule|6|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|6|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "realschule|6|ethik": [
      {
        id: "lb1",
        label: "Was ich mag und was mir gut tut",
        hours: 26,
      },
      {
        id: "lb2",
        label: "Das Fremde verstehen und damit umgehen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Elektronische Medien im eigenen Leben",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Judentum, Christentum und Islam",
        hours: 10,
      },
    ],
    "realschule|6|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Zeit und Umwelt Jesu",
      },
      {
        id: "lb2",
        label: "Leben und Botschaft Jesu",
      },
      {
        id: "lb3",
        label: "Wer bin ich?",
      },
      {
        id: "lb4",
        label: "Auszeiten und Feste",
      },
      {
        id: "lb5",
        label: "Umgang mit Konflikten",
      },
    ],
    "realschule|6|geographie": [
      {
        id: "lb1",
        label: "Europa – Einheit und Vielfalt eines Kontinents",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Wetter und Klima",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Landwirtschaft und Nahrungsmittel",
        hours: 9,
      },
      {
        id: "lb4",
        label: "Verkehr und Industrie",
        hours: 9,
      },
      {
        id: "lb5",
        label: "Energie",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Tourismus",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Aktuelle geographische Fragestellung",
        hours: 4,
      },
    ],
    "realschule|6|geschichte": [
      {
        id: "lb1",
        label: "Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Der Mensch und seine Geschichte",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Ägypten – eine frühe Hochkultur",
        hours: 6,
      },
      {
        id: "lb4",
        label: "Die griechische Antike",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Das Imperium Romanum",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Von der Antike zum Frühmittelalter",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Technik verändert das Leben der Menschen (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb8",
        label: "Menschen machen Geschichte (Längsschnitt)",
        hours: 5,
      },
    ],
    "realschule|6|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|6|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Konflikte erkennen und lösen",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Gebet verstehen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Göttliche Begleitung verstehen",
      },
      {
        id: "lb4",
        label: "Propheten – Botschafter und Botschaften reflektieren",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Widerständen begegnen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferung erklären",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Heterogenität wahrnehmen",
      },
      {
        id: "lb8",
        label: "Religionen und Weltanschauungen – Feste reflektieren",
      },
    ],
    "realschule|6|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Feier der Feste Pessach, Schawuot und Sukkot (Schalosch Regalim)",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Jüdische Gebote und Speisegesetze",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Miteinander leben",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Jüdische Geschichte und Philosophie: Zeit der Könige",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tanach und Schalom",
        hours: 10,
      },
    ],
    "realschule|6|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Im Takt der Zeit – seinen Rhythmus finden",
        hours: 10,
      },
      {
        id: "lb2",
        label: "„Ich will mitten unter euch wohnen!“ – Gott nahe sein",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mitten im Leben – Glaubensgestalten des Alten Testaments",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Gottes Geist bewegt – Von der Jesusbewegung zur Kirche",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Judentum – Gott lieben mit ganzem Herzen",
        hours: 12,
      },
    ],
    "realschule|6|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 14,
      },
    ],
    "realschule|6|mathematik": [
      {
        id: "lb1",
        label: "Rationale Zahlen",
        hours: 68,
      },
      {
        id: "lb2",
        label: "Achsenspiegelung und Symmetrie",
        hours: 13,
      },
      {
        id: "lb3",
        label: "Flächeninhalt ebener Figuren",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Raumgeometrie",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Terme und Gleichungen",
        hours: 15,
      },
      {
        id: "lb6",
        label: "Direkte Proportionalität",
        hours: 12,
      },
    ],
    "realschule|6|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 18,
      },
    ],
    "realschule|6|or": [
      {
        id: "lb1",
        label: "Menschwerdung und Leben Jesu Christi",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gotteserfahrungen im Alten Testament",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Kinder in aller Welt",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Alte Kirche",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Gelebter Glaube im Judentum",
        hours: 12,
      },
    ],
    "realschule|6|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|6|sport|diff_sport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "realschule|6|textiles-gestalten": [
      {
        id: "lb1",
        label: "Eine textile Fläche bilden – Stricken",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Eine textile Fläche gestalten – Drucken",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Eine textile Fläche gestalten – Färben",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Eine textile Fläche verarbeiten – Hand- und Maschinennähen",
        hours: 24,
      },
    ],
    "realschule|6|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Holz",
        hours: 34,
      },
      {
        id: "lb2",
        label: "Arbeiten mit dem Werkstoff Metall",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Arbeiten mit plastischen Massen",
        hours: 26,
      },
    ],
    "realschule|7|biologie": [
      {
        id: "lb1",
        label: "Prozessbezogene Kompetenzen",
      },
      {
        id: "lb2",
        label: "Die Zelle – Grundbaustein aller Lebewesen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Stoffwechselvorgänge bei Pflanzen",
        hours: 15,
      },
      {
        id: "lb4",
        label: "Organsysteme des Menschen",
        hours: 30,
      },
    ],
    "realschule|7|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|7|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "realschule|7|ethik": [
      {
        id: "lb1",
        label: "Ich und die Gleichaltrigen",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Sich für andere einsetzen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Den Wert der Natur erkennen",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Mensch und Natur in den Religionen und Weltanschauungen",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|7|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Bereicherung durch Verschiedenheit?",
      },
      {
        id: "lb2",
        label: "Paulus überwindet Grenzen",
      },
      {
        id: "lb3",
        label: "Frühe Kirche – Entstehung und Entwicklung",
      },
      {
        id: "lb4",
        label: "Ich werde erwachsen",
      },
      {
        id: "lb5",
        label: "Islam",
      },
    ],
    "realschule|7|franzoesisch": [
      {
        id: "lb1",
        label: "F7 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "F7 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "F7 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "F7 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "F7 5 Themengebiete",
      },
    ],
    "realschule|7|geographie": [
      {
        id: "lb1",
        label:
          "Planetarische Grundlagen im Zusammenhang mit Klima und Vegetation",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Afrika südlich der Sahara",
        hours: 11,
      },
      {
        id: "lb3",
        label: "Nordafrika und westliches Asien",
        hours: 11,
      },
      {
        id: "lb4",
        label: "Asiatisch-pazifische Inselwelt (ohne Japan)",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Japan und Australien im Vergleich",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Aktuelle geographische Fragestellung",
        hours: 4,
      },
      {
        id: "lb7",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|7|geschichte": [
      {
        id: "lb1",
        label: "Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Leben und Herrschaft im Mittelalter",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Europa im Wandel vom Mittelalter zur Neuzeit",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Reformation und Konfessionalisierung",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "Das frühneuzeitliche Europa zwischen konfessioneller Auseinandersetzung und absolutistischem Herrschaftsanspruch",
        hours: 10,
      },
      {
        id: "lb6",
        label:
          "Bauwerke als Ausdruck politischen und religiösen Denkens (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb7",
        label: "Warenaustausch und Kulturtransfer (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb8",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|7|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|7|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Sinn finden",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Fasten erklären",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Offenbarungen erklären",
      },
      {
        id: "lb4",
        label: "Propheten – Orientierung gewinnen",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Konflikte lösen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen nachgehen",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Kulturelle Errungenschaften kennen",
      },
      {
        id: "lb8",
        label: "Religionen und Weltanschauungen – Gebetsstätten kennen",
      },
    ],
    "realschule|7|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Rosch haSchana, Jom Kippur (Die hohen Feiertage)",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Die Psalmen und Pijutim",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Jüdische Gemeinde",
        hours: 14,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Zerstörung des Tempels und die Zeit im babylonischen Exil",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "Schriftliche Quellen – Werte: Propheten und Tochecha (Kritik/Ermahnung)",
        hours: 12,
      },
    ],
    "realschule|7|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Auf dem Weg – Gott suchen und finden",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Biblische Weisungen – Orientierung für ein gelingendes Leben",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "„Bei euch aber soll es anders sein!“ – Jesu Botschaft vom Reich Gottes",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ökumene – Verbindendes führt zusammen!",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Islam – Hingabe an Gott",
        hours: 12,
      },
    ],
    "realschule|7|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 34,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 20,
      },
    ],
    "realschule|7|mathematik|wpfg1": [
      {
        id: "lb1",
        label: "Potenzen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Parallelverschiebung",
        hours: 23,
      },
      {
        id: "lb3",
        label: "Dreiecke",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Raumgeometrie",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Geometrische Ortslinien und Ortsbereiche",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Terme, Gleichungen und Ungleichungen",
        hours: 22,
      },
      {
        id: "lb7",
        label: "Proportionalitäten",
        hours: 12,
      },
      {
        id: "lb8",
        label: "Auswertung von Daten",
        hours: 9,
      },
    ],
    "realschule|7|mathematik|wpfg2-3": [
      {
        id: "lb1",
        label: "Potenzen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Parallelverschiebung",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Geometrische Ortslinien und Ortsbereiche",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Terme, Gleichungen und Ungleichungen",
        hours: 22,
      },
      {
        id: "lb5",
        label: "Proportionalitäten",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Auswertung von Daten",
        hours: 9,
      },
    ],
    "realschule|7|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 5,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 7,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|7|or": [
      {
        id: "lb1",
        label: "Kreuz und Auferstehung",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Das Neue Testament",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Mysterien und Göttliche Liturgie",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Die orthodoxe Kirchenfamilie",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Der Islam",
        hours: 12,
      },
    ],
    "realschule|7|physik": [
      {
        id: "lb1",
        label: "Ph7 Mechanik",
        hours: 26,
      },
      {
        id: "lb2",
        label: "Ph7 Optik",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Ph7 Magnetismus und Elektrizitätslehre",
        hours: 12,
      },
    ],
    "realschule|7|sozialwesen": [
      {
        id: "lb1",
        label: "Sow7 Primärsozialisation in Familie und Kindertagesstätte",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Sow7 Sekundärsozialisation in der Schule",
        hours: 30,
      },
      {
        id: "lb3",
        label: "Sow7 Kommunikation als Grundlage gelungener Sozialisation",
        hours: 14,
      },
    ],
    "realschule|7|spanisch": [
      {
        id: "lb1",
        label: "Sp7 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Sp7 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Sp7 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Sp7 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Sp7 Themengebiete",
      },
    ],
    "realschule|7|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|7|sport|diff_sport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "realschule|7|textiles-gestalten": [
      {
        id: "lb1",
        label: "Eine textile Fläche gestalten – Sticken",
        hours: 27,
      },
      {
        id: "lb2",
        label: "Eine textile Fläche gestalten – Applikation",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Eine textile Fläche verarbeiten – Maschinennähen",
        hours: 36,
      },
    ],
    "realschule|7|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Holz",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Arbeiten mit Papierwerkstoffen",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Arbeiten mit plastischen Massen",
        hours: 26,
      },
    ],
    "realschule|8|biologie": [
      {
        id: "lb1",
        label: "Prozessbezogene Kompetenzen",
      },
      {
        id: "lb2",
        label: "Pilze, Bakterien und Viren",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Schutz- und Abwehrsystem beim Menschen",
        hours: 17,
      },
      {
        id: "lb4",
        label: "Menschliche Sexualität und Entwicklung",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Evolution",
        hours: 16,
      },
    ],
    "realschule|8|chemie": [
      {
        id: "lb1",
        label: "C8 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C8 Stoffe und ihre Eigenschaften",
        hours: 12,
      },
      {
        id: "lb3",
        label: "C8 Aufbau der Materie",
        hours: 12,
      },
      {
        id: "lb4",
        label: "C8 Chemische Reaktion",
        hours: 24,
      },
      {
        id: "lb5",
        label: "C8 Atombau und Periodensystem der Elemente",
        hours: 8,
      },
    ],
    "realschule|8|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|8|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "realschule|8|ernaehrung_und_gesundheit": [
      {
        id: "lb1",
        label: "EG8 Ernährung – Gesundheit – Lebensführung",
        hours: 27,
      },
      {
        id: "lb2",
        label: "EG8 Umwelt- und Verbraucherbewusstsein",
        hours: 15,
      },
      {
        id: "lb3",
        label: "EG8 Arbeitsprozesse – Arbeitstechniken",
        hours: 42,
      },
    ],
    "realschule|8|ethik": [
      {
        id: "lb1",
        label: "Das eigene Leben gestalten und einen Sinn finden",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Glück",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Ethik in der Welt der digitalen Medien",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Mit Konsumgütern verantwortungsbewusst umgehen",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|8|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Martin Luther und die Reformation",
      },
      {
        id: "lb2",
        label: "Ökumene – Einheit in der Vielfalt",
      },
      {
        id: "lb3",
        label: "Propheten und die Frage nach Recht und Gerechtigkeit",
      },
      {
        id: "lb4",
        label: "Diakonie – praktizierte Nächstenliebe",
      },
      {
        id: "lb5",
        label: "Buddhismus – eine fernöstliche Religion",
      },
    ],
    "realschule|8|franzoesisch": [
      {
        id: "lb1",
        label: "F8 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "F8 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "F8 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "F8 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "F8 5 Themengebiete",
      },
    ],
    "realschule|8|geographie": [
      {
        id: "lb1",
        label: "Doppelkontinent Amerika",
        hours: 17,
      },
      {
        id: "lb2",
        label: "China und Indien",
        hours: 17,
      },
      {
        id: "lb3",
        label: "Russland",
        hours: 6,
      },
      {
        id: "lb4",
        label: "Globale Verflechtungen im Alltag",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Aktuelle geographische Fragestellung",
        hours: 4,
      },
      {
        id: "lb6",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|8|geschichte": [
      {
        id: "lb1",
        label: "Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label:
          "Grundlagen der Moderne – Aufklärung, Unabhängigkeit der USA und Französische Revolution",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Napoleon und die Umgestaltung Europas",
        hours: 9,
      },
      {
        id: "lb4",
        label: "Deutschland zwischen Restauration und Revolution",
        hours: 8,
      },
      {
        id: "lb5",
        label: "Industrialisierung und Soziale Frage",
        hours: 9,
      },
      {
        id: "lb6",
        label: "Das Deutsche Kaiserreich",
        hours: 8,
      },
      {
        id: "lb7",
        label:
          "Protest, Aufstand und Revolution – Menschen kämpfen für ihre Freiheit (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb8",
        label: "Kriege und ihre Folgen (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb9",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|8|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|8|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Partnerschaft gestalten",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Hilfsbereitschaft entwickeln",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Göttliche Botschaften erkennen",
      },
      {
        id: "lb4",
        label: "Propheten – Weisheit verstehen",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Familiengeschichte(n) verstehen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen aktualisieren",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Herrschaftskonflikte reflektieren",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Heilige Schriften vergleichen",
      },
    ],
    "realschule|8|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Berechnung des Kalenders und Bedeutung der Schalosch Regalim",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Aspekte und Inhalte des Siddur",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt: Dialog mit anderen monotheistischen Religionen (Christentum und Islam)",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Anfänge und Geschichte des Christentums und Islam",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tora und Chessed (liebende Güte)",
        hours: 10,
      },
    ],
    "realschule|8|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "„Wenn er mich doch küsste ...“ – Sexualität als Ausdruck personaler Liebe",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Unfassbar und geheimnisvoll? – Von Gott in Bildern sprechen",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "„Ich lege meine Worte in deinen Mund“ – Prophetinnen und Propheten",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Jesus Christus – das Sakrament Gottes",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Hinduismus und Buddhismus – aus dem Rad der Wiedergeburten ausbrechen",
        hours: 12,
      },
    ],
    "realschule|8|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 34,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 20,
      },
    ],
    "realschule|8|mathematik|wpfg1": [
      {
        id: "lb1",
        label: "Vierecke",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Drehung",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Raumgeometrie",
        hours: 13,
      },
      {
        id: "lb4",
        label: "Terme, Gleichungen und Ungleichungen",
        hours: 40,
      },
      {
        id: "lb5",
        label: "Bruchterme und Bruchgleichungen",
        hours: 7,
      },
      {
        id: "lb6",
        label: "Funktionen",
        hours: 26,
      },
      {
        id: "lb7",
        label: "Daten und Zufall",
        hours: 8,
      },
    ],
    "realschule|8|mathematik|wpfg2-3": [
      {
        id: "lb1",
        label: "Dreiecke und Vierecke",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Raumgeometrie",
        hours: 7,
      },
      {
        id: "lb3",
        label: "Terme und Gleichungen",
        hours: 40,
      },
      {
        id: "lb4",
        label: "Bruchterme und Bruchgleichungen",
        hours: 5,
      },
      {
        id: "lb5",
        label: "Funktionen",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Daten und Zufall",
        hours: 8,
      },
    ],
    "realschule|8|physik|wpfg1": [
      {
        id: "lb1",
        label: "Mechanik und Energie",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Wärmelehre",
        hours: 15,
      },
      {
        id: "lb3",
        label: "Elektrizitätslehre",
        hours: 15,
      },
      {
        id: "lb4",
        label: "Wahlbereich: Astronomie oder Akustik",
        hours: 6,
      },
    ],
    "realschule|8|physik|wpfg2-3": [
      {
        id: "lb1",
        label: "Mechanik",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Optik",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Magnetismus und Elektrizitätslehre",
        hours: 20,
      },
    ],
    "realschule|8|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 5,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 7,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|8|or": [
      {
        id: "lb1",
        label: "Pfingsten und Heiliger Geist",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Schöpfung",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Meinen Weg finden",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Patrologie",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Weitere christliche Konfessionen",
        hours: 12,
      },
    ],
    "realschule|8|soziallehre": [
      {
        id: "lb1",
        label: "SL8 Der Einzelne und die Gesellschaft",
      },
      {
        id: "lb2",
        label: "SL8 Kommunikation",
      },
      {
        id: "lb3",
        label: "SL8 Familie und Gesellschaft",
      },
      {
        id: "lb4",
        label: "SL8 Auf dem Weg in die heutige Gesellschaft",
      },
      {
        id: "lb5",
        label: "SL8 Wirtschaftliches Handeln in der Konsumgesellschaft",
      },
    ],
    "realschule|8|sozialwesen": [
      {
        id: "lb1",
        label: "Sow8 Der Mensch als soziales Wesen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Sow8 Jugendliche zwischen Kindheit und Erwachsenenalter",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Sow8 Verantwortung für sich und andere übernehmen",
        hours: 32,
      },
      {
        id: "lb4",
        label: "Sow8 Menschen mit Beeinträchtigungen",
        hours: 22,
      },
    ],
    "realschule|8|spanisch": [
      {
        id: "lb1",
        label: "Sp8 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Sp8 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Sp8 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Sp8 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Sp8 Themengebiete",
      },
    ],
    "realschule|8|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|8|sport|diff_sport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "realschule|8|textiles-gestalten": [
      {
        id: "lb1",
        label: "Eine textile Fläche verarbeiten – Patchwork",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Eine textile Fläche verarbeiten – Maschinennähen",
        hours: 14,
      },
    ],
    "realschule|8|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Holz",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Arbeiten mit dem Werkstoff Metall",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Arbeiten mit dem Werkstoff Kunststoff",
        hours: 28,
      },
    ],
    "realschule|8|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "WR8 Grundzüge des Wirtschaftens auf dem Gütermarkt",
        hours: 8,
      },
      {
        id: "lb2",
        label:
          "WR8 Verbraucherschutz und verantwortungsbewusstes Verbraucherverhalten",
        hours: 10,
      },
      {
        id: "lb3",
        label: "WR8 Der Jugendliche in unserer Rechtsordnung",
        hours: 10,
      },
      {
        id: "lb4",
        label: "WR8 Privatrechtliche Regelungen",
        hours: 18,
      },
      {
        id: "lb5",
        label: "WR8 Berufliche Orientierung",
        hours: 10,
      },
      {
        id: "lb6",
        label: "WR8 Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|bwl-rechnungswesen": [
      {
        id: "lb1",
        label: "BwR9 Unternehmensführung und Einkommen des Unternehmers",
        hours: 12,
      },
      {
        id: "lb2",
        label: "BwR9 Anlagenbereich",
        hours: 19,
      },
      {
        id: "lb3",
        label: "BwR9 Möglichkeiten der Finanzierung",
        hours: 20,
      },
      {
        id: "lb4",
        label: "BwR9 Kapitalanlage",
        hours: 19,
      },
      {
        id: "lb5",
        label: "BwR9 Ausfall und Bewertung von Forderungen",
        hours: 14,
      },
    ],
    "realschule|9|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|9|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "realschule|9|ernaehrung_und_gesundheit": [
      {
        id: "lb1",
        label: "EG9 Ernährung – Gesundheit – Lebensführung",
        hours: 27,
      },
      {
        id: "lb2",
        label: "EG9 Umwelt- und Verbraucherbewusstsein",
        hours: 15,
      },
      {
        id: "lb3",
        label: "EG9 Arbeitsprozesse – Arbeitstechniken",
        hours: 42,
      },
    ],
    "realschule|9|ethik": [
      {
        id: "lb1",
        label: "Liebe und Partnerschaft",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Arbeit und Leistung in Schule und Beruf",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Sich für den Frieden einsetzen",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Ethische Werte in Religion und Philosophie",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Arbeit und Freizeit",
      },
      {
        id: "lb2",
        label: "Judentum",
      },
      {
        id: "lb3",
        label: "Tod und Auferstehung",
      },
      {
        id: "lb4",
        label: "Gelebter christlicher Glaube",
      },
      {
        id: "lb5",
        label: "Liebe, Partnerschaft und Sexualität",
      },
    ],
    "realschule|9|franzoesisch": [
      {
        id: "lb1",
        label: "F9 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "F9 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "F9 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "F9 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "F9 5 Themengebiete",
      },
    ],
    "realschule|9|geographie": [
      {
        id: "lb1",
        label: "Landschaft und Naturrisiken",
        hours: 9,
      },
      {
        id: "lb2",
        label: "Klima und Klimawandel",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Landwirtschaft, Ernährung und Boden",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Städtische Siedlungs- und Lebensräume",
        hours: 8,
      },
      {
        id: "lb5",
        label: "Bevölkerung und Bevölkerungspolitik",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Grenzen im Wandel",
        hours: 5,
      },
      {
        id: "lb7",
        label: "Aktuelle geographische Fragestellung im Nahraum",
        hours: 4,
      },
      {
        id: "lb8",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|geschichte": [
      {
        id: "lb1",
        label: "Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Imperialismus und Erster Weltkrieg",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Weimarer Republik – die erste deutsche Demokratie",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Nationalsozialismus – Ideologie und Politik bis 1939",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Nationalsozialismus, Zweiter Weltkrieg und Holocaust – Schuld, Widerstand und Verantwortung",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Jugend und Jugendkultur im Wandel der Zeit (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb7",
        label: "Menschenrechte – Rechte für alle Menschen (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb8",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Verantwortung wahrnehmen",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Innehalten reflektieren",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Leben angesichts des Todes bedenken",
      },
      {
        id: "lb4",
        label: "Propheten – Ungerechtigkeiten entgegentreten",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Frieden machen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen erklären",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Glaubensrichtungen verstehen",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Extremismus und Toleranz reflektieren",
      },
    ],
    "realschule|9|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Der Schabbat im Kontext von Arbeit und Leistung",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gebet und Ritus: Rituale am Schabbat und ihre spirituelle Bedeutung",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Liebe und Familie im Judentum",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Jüdische Gemeinden in Deutschland im Mittelalter",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Midrasch und Limmud",
        hours: 12,
      },
    ],
    "realschule|9|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Verantwortlich handeln – Gewissen, Schuld und Versöhnung",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Warum es uns gibt – Antworten des Schöpfungsglaubens",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Jesus Christus – „Der Erstgeborene von den Toten“",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Kirche in der Zeit – Licht und Schatten",
        hours: 12,
      },
      {
        id: "lb5",
        label:
          "Sinn und Sehnsucht – Orientierung in der Vielfalt religiöser und weltanschaulicher Angebote",
        hours: 10,
      },
    ],
    "realschule|9|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 34,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 20,
      },
    ],
    "realschule|9|mathematik|wpfg1": [
      {
        id: "lb1",
        label: "Reelle Zahlen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Zentrische Streckung",
        hours: 17,
      },
      {
        id: "lb3",
        label: "Rechtwinklige Dreiecke",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Kreis",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Raumgeometrie",
        hours: 20,
      },
      {
        id: "lb6",
        label: "Systeme linearer Gleichungen",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Quadratische Funktionen und quadratische Gleichungen",
        hours: 42,
      },
      {
        id: "lb8",
        label: "Daten und Zufall",
        hours: 9,
      },
    ],
    "realschule|9|mathematik|wpfg2-3": [
      {
        id: "lb1",
        label: "Reelle Zahlen",
        hours: 7,
      },
      {
        id: "lb2",
        label: "Zentrische Streckung",
        hours: 13,
      },
      {
        id: "lb3",
        label: "Rechtwinklige Dreiecke",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Kreis",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Lineare Funktionen",
        hours: 15,
      },
      {
        id: "lb6",
        label: "Systeme linearer Gleichungen",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Daten und Zufall",
        hours: 9,
      },
    ],
    "realschule|9|physik|wpfg1": [
      {
        id: "lb1",
        label: "Mechanik von Flüssigkeiten und Gasen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Wärmelehre",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Elektrizitätslehre",
        hours: 38,
      },
    ],
    "realschule|9|physik|wpfg2-3": [
      {
        id: "lb1",
        label: "Mechanik und Energie",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Wärmelehre",
        hours: 15,
      },
      {
        id: "lb3",
        label: "Elektrizitätslehre",
        hours: 19,
      },
    ],
    "realschule|9|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 5,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 7,
      },
      {
        id: "lb5",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|9|or": [
      {
        id: "lb1",
        label: "Die Ökumenischen Konzile",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Liebe und Sexualität",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Der Sinn der Gebote",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Die orthodoxen Kirchen im 20. und 21. Jahrhundert",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Einblick in fernöstliche Religionen",
        hours: 10,
      },
    ],
    "realschule|9|soziallehre": [
      {
        id: "lb1",
        label: "SL9 Der Einzelne im Werte- und Normensystem",
      },
      {
        id: "lb2",
        label: "SL9 Der demokratische Verfassungsstaat",
      },
      {
        id: "lb3",
        label:
          "SL9 Mitwirkungsformen und Interessenvertretung des Einzelnen in der Politik",
      },
      {
        id: "lb4",
        label: "SL9 Die staatliche Ordnung in der Bundesrepublik",
      },
      {
        id: "lb5",
        label:
          "SL9 Ziele und Maßnahmen der Wirtschaftspolitik in der Sozialen Marktwirtschaft",
      },
    ],
    "realschule|9|sozialwesen": [
      {
        id: "lb1",
        label: "Sow9 Partnerschaft, Ehe und Familie",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Sow9 Tertiäre Sozialisation in der Arbeitswelt",
        hours: 40,
      },
      {
        id: "lb3",
        label: "Sow9 Quartäre Sozialisation im Alter",
        hours: 22,
      },
    ],
    "realschule|9|spanisch": [
      {
        id: "lb1",
        label: "Sp9 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Sp9 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Sp9 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Sp9 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Sp9 Themengebiete",
      },
    ],
    "realschule|9|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|9|sport|diff_sport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "realschule|9|textiles-gestalten": [
      {
        id: "lb1",
        label: "Eine textile Fläche verarbeiten – Maschinennähen",
        hours: 28,
      },
    ],
    "realschule|9|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Metall",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Arbeiten mit Papierwerkstoffen",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Arbeiten mit plastischen Massen",
        hours: 26,
      },
    ],
    "realschule|10|bwl-rechnungswesen": [
      {
        id: "lb1",
        label: "BwR10 Periodenrichtige Erfolgsermittlung und Rückstellungen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "BwR10 Unternehmensabschluss und Auswertung",
        hours: 17,
      },
      {
        id: "lb3",
        label:
          "BwR10 Vollkostenrechnung: Kostenarten-, Kostenstellen- und Kostenträgerrechnung",
        hours: 30,
      },
      {
        id: "lb4",
        label: "BwR10 Teilkostenrechnung",
        hours: 15,
      },
    ],
    "realschule|10|biologie": [
      {
        id: "lb1",
        label: "Prozessbezogene Kompetenzen",
      },
      {
        id: "lb2",
        label: "Genetik",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "Lokale und globale Auswirkungen auf Ökosysteme durch Eingriffe des Menschen",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Verantwortungsvolle Elternschaft",
        hours: 8,
      },
    ],
    "realschule|10|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|10|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "realschule|10|ernaehrung_und_gesundheit": [
      {
        id: "lb1",
        label: "EG10 Ernährung – Gesundheit – Lebensführung",
        hours: 30,
      },
      {
        id: "lb2",
        label: "EG10 Umwelt- und Verbraucherbewusstsein",
        hours: 6,
      },
      {
        id: "lb3",
        label: "EG10 Arbeitsprozesse und Arbeitstechniken",
        hours: 36,
      },
    ],
    "realschule|10|ethik": [
      {
        id: "lb1",
        label: "Erwachsen sein als Frau und Mann",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Gewissen und Verantwortung",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Angewandte Ethik: Medizinethik oder Medienethik",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|10|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Religiöse Sinnangebote",
      },
      {
        id: "lb2",
        label: "Die Frage nach Gott",
      },
      {
        id: "lb3",
        label: "Kirche in der Welt",
      },
      {
        id: "lb4",
        label: "Verantwortung übernehmen",
      },
    ],
    "realschule|10|franzoesisch": [
      {
        id: "lb1",
        label: "F10 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "F10 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "F10 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "F10 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "F10 5 Themengebiete",
      },
    ],
    "realschule|10|geschichte": [
      {
        id: "lb1",
        label: "Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Nachkriegszeit und politischer Neubeginn in Deutschland",
        hours: 7,
      },
      {
        id: "lb3",
        label: "Die Teilung Deutschlands",
        hours: 9,
      },
      {
        id: "lb4",
        label:
          "Kalter Krieg, Entspannung und Neuorientierung in Europa und der Welt",
        hours: 11,
      },
      {
        id: "lb5",
        label:
          "Herausforderungen und Chancen globaler Entwicklungen der Gegenwart",
        hours: 11,
      },
      {
        id: "lb6",
        label: "Migration in der Geschichte (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb7",
        label:
          "Geschichtskultur – wie wir mit Geschichte umgehen (Längsschnitt)",
        hours: 5,
      },
      {
        id: "lb8",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|10|it": [
      {
        id: "lb1",
        label: "Anfangsunterricht",
      },
      {
        id: "lb2",
        label: "Aufbauunterricht",
      },
      {
        id: "lb3",
        label: "Bilingualer Sachfachunterricht (optional)",
      },
    ],
    "realschule|10|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Menschenrechte erörtern",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Frömmigkeit wahrnehmen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Menschliche Freiheit reflektieren",
      },
      {
        id: "lb4",
        label: "Propheten – Frauen als Vorbilder verstehen",
      },
      {
        id: "lb5",
        label:
          "Muhammads Leben und Wirken – sich mit Vorbildern auseinandersetzen",
      },
      {
        id: "lb6",
        label:
          "Koran und Schrifttradition – Überlieferungen kritisch reflektieren",
      },
      {
        id: "lb7",
        label: "Geschichte und Geographie des Islams – Heterogenität verstehen",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Fernöstliche Religionen verstehen",
      },
    ],
    "realschule|10|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Bedeutung von Fest- und Gedenktagen für die eigene jüdische Identität",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus",
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt: Dialog mit fernöstlichen Religionen und Weltanschauungen",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Zionismus und Gründung des Staates Israel",
        hours: 13,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Mischna und Sikaron",
        hours: 11,
      },
    ],
    "realschule|10|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Grenzen erkennen – auf der Suche nach dem rechten Maß",
        hours: 14,
      },
      {
        id: "lb2",
        label: "„Wo ist nun dein Gott?“ – Anfragen und Erfahrungen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Jesus Christus – Fragen und Bekenntnis",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Kirche in der Welt – Christsein heute",
        hours: 14,
      },
    ],
    "realschule|10|kunst": [
      {
        id: "lb1",
        label: "Bildnerische Auseinandersetzung mit Wirklichkeit und Fantasie",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Bildende Kunst",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Angewandte Kunst",
        hours: 20,
      },
    ],
    "realschule|10|mathematik|wpfg1": [
      {
        id: "lb1",
        label: "Trigonometrie",
        hours: 42,
      },
      {
        id: "lb2",
        label: "Abbildungen",
        hours: 30,
      },
      {
        id: "lb3",
        label: "Potenzen und Potenzfunktionen",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Exponentialfunktionen, Logarithmen und Logarithmusfunktionen",
        hours: 22,
      },
      {
        id: "lb5",
        label: "Daten und Zufall",
        hours: 10,
      },
    ],
    "realschule|10|mathematik|wpfg2-3": [
      {
        id: "lb1",
        label: "Trigonometrie",
        hours: 21,
      },
      {
        id: "lb2",
        label: "Raumgeometrie",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Exponentialfunktionen, Logarithmen",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Quadratische Funktionen und quadratische Gleichungen",
        hours: 35,
      },
      {
        id: "lb5",
        label: "Daten und Zufall",
        hours: 10,
      },
    ],
    "realschule|10|physik|wpfg1": [
      {
        id: "lb1",
        label: "Mechanik",
        hours: 17,
      },
      {
        id: "lb2",
        label: "Elektrizitätslehre",
        hours: 29,
      },
      {
        id: "lb3",
        label: "Atom- und Kernphysik",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Energieversorgung",
        hours: 12,
      },
    ],
    "realschule|10|physik|wpfg2-3": [
      {
        id: "lb1",
        label: "Mechanik",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Elektrizitätslehre",
        hours: 19,
      },
      {
        id: "lb3",
        label: "Atom- und Kernphysik",
        hours: 7,
      },
      {
        id: "lb4",
        label: "Energieversorgung",
        hours: 12,
      },
    ],
    "realschule|10|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
        hours: 6,
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Bewegung – Tanz – Szene",
        hours: 4,
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
        hours: 6,
      },
    ],
    "realschule|10|or": [
      {
        id: "lb1",
        label: "Mystik",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Das Glaubensbekenntnis",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Ethik des Lebens",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Lebensgestaltung: Ehe, Familie und Klosterleben",
        hours: 12,
      },
    ],
    "realschule|10|pug": [
      {
        id: "lb1",
        label: "PuG10 Methoden und Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "PuG10 Politische Mitwirkungsmöglichkeiten",
        hours: 14,
      },
      {
        id: "lb3",
        label: "PuG10 Politische Strukturen",
        hours: 14,
      },
      {
        id: "lb4",
        label:
          "PuG10 Politische, gesellschaftliche und wirtschaftliche Handlungsfelder",
        hours: 20,
      },
    ],
    "realschule|10|soziallehre": [
      {
        id: "lb1",
        label: "SL10 Der Einzelne in der Arbeits- und Berufswelt",
      },
      {
        id: "lb2",
        label: "SL10 Lebenskonzepte heute",
      },
      {
        id: "lb3",
        label: "SL10 Sozialstaatlichkeit",
      },
      {
        id: "lb4",
        label: "SL10 Die europäische Integration",
      },
      {
        id: "lb5",
        label: "SL10 Das Zusammenwachsen der Welt",
      },
    ],
    "realschule|10|sozialwesen": [
      {
        id: "lb1",
        label: "Sow10 Sozialstaat – Vergangenheit, Gegenwart und Zukunft",
        hours: 24,
      },
      {
        id: "lb2",
        label:
          "Sow10 Migration und Integration als gesellschaftliche Herausforderungen",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Sow10 Lebenskrisen als persönliche Herausforderungen",
        hours: 24,
      },
    ],
    "realschule|10|spanisch": [
      {
        id: "lb1",
        label: "Sp10 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Sp10 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Sp10 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Sp10 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Sp10 Themengebiete",
      },
    ],
    "realschule|10|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "realschule|10|sport|diff_sport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "realschule|10|werken": [
      {
        id: "lb1",
        label: "Arbeiten mit dem Werkstoff Holz",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Arbeiten mit dem Werkstoff Kunststoff",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Materialverbindendes Arbeiten",
        hours: 24,
      },
    ],
    "gymnasium|5|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|5|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|5|ethik": [
      {
        id: "lb1",
        label: "Wahrnehmung und Bedürfnisse",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Familie",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Spielen",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Feste",
        hours: 10,
      },
    ],
    "gymnasium|5|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Ich und die anderen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Die Bibel und ihre Geschichten",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Lebenswege mit Gott",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Von Gott erschaffen",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Spuren des Glaubens",
        hours: 10,
      },
    ],
    "gymnasium|5|franzoesisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|5|geographie": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Planet Erde",
      },
      {
        id: "lb3",
        label: "Naturräume in Bayern und Deutschland",
      },
      {
        id: "lb4",
        label: "Ländliche Räume in Bayern und Deutschland",
      },
      {
        id: "lb5",
        label: "Städtische Räume in Bayern und Deutschland",
      },
    ],
    "gymnasium|5|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Eigene Aufgaben bedenken",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Ausdrucksformen des Islams kennen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Gottesvorstellungen reflektieren",
      },
      {
        id: "lb4",
        label: "Propheten – Gottes Offenbarungen erklären",
      },
      {
        id: "lb5",
        label:
          "Muhammads Leben und Wirken – Eigenschaften von Vorbildern reflektieren",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Fachsprache entwickeln",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Historische Kontexte erläutern",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Gemeinsamkeiten und Unterschiede vergleichen",
      },
    ],
    "gymnasium|5|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Grundlagen des jüdischen Kalenders, Feiertage im Jahreskreis, Chanukka und Purim",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Schma und Amida, die beiden Hauptgebete",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Vertrauend einen neuen Anfang wagen",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Biblische Zeit und Monotheismus",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tora und Anawa (Bescheidenheit)",
        hours: 12,
      },
    ],
    "gymnasium|5|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Gott offenbart sich: die Bibel als Heilige Schrift des Christentums",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "„Eines Tages kam einer ...“: Gott wird Mensch in Jesus Christus",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Menschen fragen nach Gott – Zugänge zum christlichen Gottesverständnis",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Wir sind alle Kinder des einen Gottes – miteinander leben und den Glauben entdecken",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Heilige Orte: Kirchen als Mittelpunkte christlichen Glaubens und Lebens",
        hours: 12,
      },
    ],
    "gymnasium|5|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|5|latein": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|5|mathematik": [
      {
        id: "lb1",
        label: "1 Natürliche und ganze Zahlen – Addition und Subtraktion",
        hours: 30,
      },
      {
        id: "lb2",
        label: "2 Geometrische Figuren und Lagebeziehungen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "3 Natürliche und ganze Zahlen – Multiplikation und Division",
        hours: 34,
      },
      {
        id: "lb4",
        label: "4 Größen und ihre Einheiten",
        hours: 34,
      },
    ],
    "gymnasium|5|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|5|nt_gym": [
      {
        id: "lb1",
        label: "NT5 1 Schwerpunkt Naturwissenschaftliches Arbeiten",
        hours: 42,
      },
      {
        id: "lb2",
        label: "NT5 2 Schwerpunkt Biologie",
        hours: 42,
      },
    ],
    "gymnasium|5|or": [
      {
        id: "lb1",
        label: "Miteinander leben",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Von Gott und zu Gott sprechen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Die Bibel",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ursprung der Kirche",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Kirche vor Ort",
        hours: 10,
      },
    ],
    "gymnasium|5|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|5|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|6|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|6|englisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|6|englisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|6|ethik": [
      {
        id: "lb1",
        label: "Judentum und Christentum",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Umgang mit Medien",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Dem Anderen begegnen",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Konsum und Freizeit",
        hours: 18,
      },
    ],
    "gymnasium|6|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "In Beziehung",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Zwischen Galiläa und Jerusalem",
        hours: 8,
      },
      {
        id: "lb3",
        label: "„Mitten unter euch“ – Jesu Botschaft und Leben",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Feste und Auszeiten",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Anders – fremd – verschieden",
        hours: 10,
      },
    ],
    "gymnasium|6|franzoesisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|6|franzoesisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|6|geschichte": [
      {
        id: "lb1",
        label: "Der Mensch und seine Geschichte",
        hours: 6,
      },
      {
        id: "lb2",
        label: "Ägypten – eine frühe Hochkultur",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Die griechische Antike",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Menschen machen Geschichte (Längsschnitt)",
        hours: 6,
      },
      {
        id: "lb5",
        label: "Das Imperium Romanum",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Von der Antike zum Mittelalter",
        hours: 8,
      },
      {
        id: "lb7",
        label:
          "Gesellschaftsordnung im Kleinen: Leben in der Familie (Längsschnitt)",
        hours: 6,
      },
    ],
    "gymnasium|6|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Konflikte erkennen und lösen",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Gebet verstehen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Göttliche Begleitung verstehen",
      },
      {
        id: "lb4",
        label: "Propheten – Botschafter und Botschaften reflektieren",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Offenbarung deuten",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferung erklären",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Heterogenität wahrnehmen",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Judentum und Christentum verstehen",
      },
    ],
    "gymnasium|6|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Feier der Feste Pessach, Schawot und Sukkot (Schalosch Regalim)",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Jüdische Gebote und Speisegesetze",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Miteinander leben",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Jüdische Geschichte und Philosophie: Zeit der Könige",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tanach und Schalom (Frieden)",
        hours: 10,
      },
    ],
    "gymnasium|6|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Staunen und Nachdenken über Gottes Welt",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Zwischen Scheitern und Gelingen – Exemplarische Erfahrungen im Alten Testament",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Jesus Christus – Hoffnung in Leid und Tod",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Christliches Gemeindeleben: die Begeisterung des Anfangs",
        hours: 12,
      },
      {
        id: "lb5",
        label:
          "Vielfalt der Kulturen und Lebenswelten – Solidarität im Namen Gottes",
        hours: 10,
      },
    ],
    "gymnasium|6|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|6|latein|1-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|6|latein|2-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|6|mathematik": [
      {
        id: "lb1",
        label: "1 Rationale Zahlen",
        hours: 68,
      },
      {
        id: "lb2",
        label: "2 Flächeninhalt und Volumen",
        hours: 24,
      },
      {
        id: "lb3",
        label: "3 Prozentrechnung, Daten und Diagramme",
        hours: 20,
      },
    ],
    "gymnasium|6|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|6|nt_gym": [
      {
        id: "lb1",
        label: "NT6 1 Schwerpunkt Biologie",
        hours: 56,
      },
      {
        id: "lb2",
        label: "NT6 2 Schwerpunkt Informatik",
        hours: 28,
      },
    ],
    "gymnasium|6|or": [
      {
        id: "lb1",
        label: "Menschwerdung und Leben Jesu Christi",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gotteserfahrungen im Alten Testament",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Kinder in aller Welt",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Alte Kirche",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Gelebter Glaube im Judentum",
        hours: 12,
      },
    ],
    "gymnasium|6|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|6|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|7|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|7|englisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|7|englisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|7|ethik": [
      {
        id: "lb1",
        label: "Islam",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Konflikte und ihre Regelung",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Erwachsen werden",
        hours: 18,
      },
    ],
    "gymnasium|7|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Glaube findet Sprache",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Kirche hat Geschichte",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Islam",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ich und meine Wünsche",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Nächstenliebe und diakonisches Handeln der Kirche",
        hours: 10,
      },
    ],
    "gymnasium|7|franzoesisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|7|franzoesisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|7|geographie": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Einheit und Vielfalt in Europa",
      },
      {
        id: "lb3",
        label: "Naturgeographie Europas im Überblick",
      },
      {
        id: "lb4",
        label: "Ländliche Räume Europas",
      },
      {
        id: "lb5",
        label: "Metropolen und Verdichtungsräume in Europa",
      },
      {
        id: "lb6",
        label: "Meere und Küsten Europas",
      },
    ],
    "gymnasium|7|geschichte": [
      {
        id: "lb1",
        label: "König und Reich: Herrschaft im Mittelalter",
        hours: 7,
      },
      {
        id: "lb2",
        label: "Leben und Kultur im Mittelalter",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Neue räumliche und geistige Horizonte",
        hours: 11,
      },
      {
        id: "lb4",
        label: "Wirtschaft und Handel gestern und heute (Längsschnitt)",
        hours: 6,
      },
      {
        id: "lb5",
        label: "Das konfessionelle Zeitalter",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Absolutismus und Barock",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Bauwerke als Ausdruck politischen Denkens (Längsschnitt)",
        hours: 6,
      },
    ],
    "gymnasium|7|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Partnerschaft gestalten",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Rhythmen des Lebens erklären",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Offenbarungen reflektieren",
      },
      {
        id: "lb4",
        label: "Propheten – Orientierung gewinnen",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Konflikte lösen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen nachgehen",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Kulturelle Errungenschaften kennen",
      },
      {
        id: "lb8",
        label: "Religionen und Weltanschauungen – Feste reflektieren",
      },
    ],
    "gymnasium|7|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Rosch haSchana, Jom Kippur (Die hohen Feiertage)",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Die Psalmen und Pijutim",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Jüdische Gemeinde",
        hours: 14,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Zerstörung des Tempels und die Zeit im babylonischen Exil",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "Schriftliche Quellen – Werte: Propheten und Tochecha (Kritik/Ermahnung)",
        hours: 12,
      },
    ],
    "gymnasium|7|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Auf dem Weg zu mir selbst – Herausforderungen im Jugendalter",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Im Sichtbaren wird Unsichtbares gegenwärtig – Symbole und Sakramente",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Das Markusevangelium – verheißungsvolle Botschaft vom Reich Gottes",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Kirche zwischen Macht und Spiritualität: christliche Grundüberzeugungen und gesellschaftliche Lebensweisen im Mittelalter",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Muslimen begegnen – Glaube, Geschichte und Kulturen des Islam",
        hours: 12,
      },
    ],
    "gymnasium|7|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|7|latein|1-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|7|latein|2-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|7|mathematik": [
      {
        id: "lb1",
        label: "1 Terme mit Variablen",
        hours: 37,
      },
      {
        id: "lb2",
        label: "2 Geometrische Figuren: Symmetrie und Winkel",
        hours: 21,
      },
      {
        id: "lb3",
        label: "3 Lineare Gleichungen und Vertiefung der Prozentrechnung",
        hours: 17,
      },
      {
        id: "lb4",
        label: "4 Kenngrößen von Daten",
        hours: 8,
      },
      {
        id: "lb5",
        label: "5 Kongruenz, besondere Dreiecke und Dreieckskonstruktionen",
        hours: 29,
      },
    ],
    "gymnasium|7|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|7|nt_gym": [
      {
        id: "lb1",
        label: "NT7 1 Physik in Natur und Technik entdecken",
        hours: 28,
      },
      {
        id: "lb2",
        label: "NT7 2 Schwerpunkt Informatik",
        hours: 28,
      },
    ],
    "gymnasium|7|or": [
      {
        id: "lb1",
        label: "Kreuz und Auferstehung",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Das Neue Testament",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mysterien und Göttliche Liturgie",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Die orthodoxe Kirchenfamilie",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Der Islam",
        hours: 12,
      },
    ],
    "gymnasium|7|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|7|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|8|biologie": [
      {
        id: "lb1",
        label: "Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label:
          "Informationsaufnahme, &#x2011;verarbeitung und Reaktion beim Menschen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Fortpflanzung und Individualentwicklung des Menschen",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Verhalten – genetisch bedingt und erlernt",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Suchtgefahren und Gesundheit",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Ökosysteme unter dem Einfluss des Menschen",
        hours: 10,
      },
    ],
    "gymnasium|8|chemie": [
      {
        id: "lb1",
        label: "C8 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "C8 Stoffe und ihre Eigenschaften – Von beobachtbaren Stoffeigenschaften zum Teilchenmodell",
        hours: 23,
      },
      {
        id: "lb3",
        label:
          "C8 Chemische Reaktion – Vom Teilchenmodell zum Daltonschen Atommodell",
        hours: 36,
      },
      {
        id: "lb4",
        label:
          "C8 Chemische Verbindungen und ihre Eigenschaften – Vom Daltonschen Atommodell zum Kern-Hülle-Modell",
        hours: 25,
      },
    ],
    "gymnasium|8|chi": [
      {
        id: "lb1",
        label: "Chi8 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi8 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi8 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi8 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi8 Themengebiete",
      },
    ],
    "gymnasium|8|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
      {
        id: "lb5",
        label: "Profilbereich am MuG",
      },
    ],
    "gymnasium|8|englisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|englisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|ethik": [
      {
        id: "lb1",
        label: "Sinnsuche",
        hours: 15,
      },
      {
        id: "lb2",
        label: "Soziales Engagement",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Liebe, Freundschaft, Sexualität",
        hours: 15,
      },
      {
        id: "lb4",
        label: "Umwelt- und Tierethik",
        hours: 18,
      },
    ],
    "gymnasium|8|evangelische-religionslehre": [
      {
        id: "lb1",
        label:
          "Befreit vor Gott und Mensch? – Voraussetzungen und Folgen der Reformation",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Propheten und die Frage nach Gerechtigkeit",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Die Welt als Gottes Schöpfung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ich in der Zeit",
        hours: 8,
      },
      {
        id: "lb5",
        label: "„Was glaubst denn du?“ – Vielfalt des Glaubens",
        hours: 12,
      },
    ],
    "gymnasium|8|franzoesisch|1fs": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|franzoesisch|2fs": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|franzoesisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|geschichte": [
      {
        id: "lb1",
        label: "Aufklärung, Französische Revolution und Napoleon",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Einigkeit und Freiheit? Deutschland zwischen Restauration und Revolution",
        hours: 9,
      },
      {
        id: "lb3",
        label:
          "Bayern – Identität, Staatsgebiet und kulturelles Erbe (Längsschnitt)",
        hours: 6,
      },
      {
        id: "lb4",
        label: "Industrialisierung und Soziale Frage",
        hours: 9,
      },
      {
        id: "lb5",
        label: "Das Deutsche Kaiserreich",
        hours: 9,
      },
      {
        id: "lb6",
        label: "Imperialismus und Erster Weltkrieg",
        hours: 13,
      },
    ],
    "gymnasium|8|griechisch": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|8|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Sinn finden",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Verantwortung entwickeln",
      },
      {
        id: "lb3",
        label:
          "Glaubenslehre des Islams – Göttliche Botschaften interpretieren",
      },
      {
        id: "lb4",
        label: "Propheten – Weisheit verstehen",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Familiengeschichte(n) verstehen",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen aktualisieren",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Herrschaftskonflikte reflektieren",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Religiöse Erscheinungsformen respektieren",
      },
    ],
    "gymnasium|8|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Berechnung des Kalenders und Bedeutung der Schalosch Regalim",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Aspekte und Inhalte des Siddur",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt: Dialog mit anderen monotheistischen Religionen (Christentum und Islam)",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Anfänge und Geschichte des Christentums und des Islam",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Tora und Chessed (liebende Güte)",
        hours: 10,
      },
    ],
    "gymnasium|8|italienisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Was ist der Mensch? Die Frage nach der Stellung des Menschen in der Schöpfung",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Von Gott berufen: prophetische Impulse für eine gerechtere Welt",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Der Mensch vor Gottes Gerechtigkeit: Das religiöse Ringen in Reformation und katholischer Reform",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Zur Kirche gehören – aus dem Glauben handeln",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Unterscheiden können: Vielfalt religiöser Angebote",
        hours: 10,
      },
    ],
    "gymnasium|8|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|8|latein|1-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Latein 7.5.3 – aktuell, digital, kreativ",
      },
      {
        id: "lb5",
        label: "Methodik",
      },
    ],
    "gymnasium|8|latein|2-fremdsprache": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|8|mathematik": [
      {
        id: "lb1",
        label: "1 Funktion und Term",
        hours: 8,
      },
      {
        id: "lb2",
        label: "2 Lineare Funktionen",
        hours: 16,
      },
      {
        id: "lb3",
        label: "3 Elementare gebrochen-rationale Funktionen",
        hours: 13,
      },
      {
        id: "lb4",
        label: "4 Bruchterme und Bruchgleichungen",
        hours: 13,
      },
      {
        id: "lb5",
        label: "5 Laplace-Experimente",
        hours: 14,
      },
      {
        id: "lb6",
        label: "6 Lineare Gleichungssysteme",
        hours: 10,
      },
      {
        id: "lb7",
        label: "7 Kreis und Zylinder",
        hours: 10,
      },
    ],
    "gymnasium|8|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|8|or": [
      {
        id: "lb1",
        label: "Pfingsten und Heiliger Geist",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Schöpfung",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Meinen Weg finden",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Orthodoxie im Osmanenreich und im russischen Reich",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Weitere christliche Konfessionen",
        hours: 12,
      },
    ],
    "gymnasium|8|physik": [
      {
        id: "lb1",
        label: "Elektrischer Strom",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Optik",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Mechanik",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Profilbereich am NTG",
        hours: 28,
      },
    ],
    "gymnasium|8|pug": [
      {
        id: "lb1",
        label: "PuG8 Die Jugendphase bewusst erleben und gestalten",
        hours: 18,
      },
      {
        id: "lb2",
        label:
          "PuG8 Gesellschaftliche Grundwerte und soziale Normen reflektieren",
        hours: 18,
      },
      {
        id: "lb3",
        label:
          "PuG8 Sich im Leben orientieren &#x202f;–&#x202f; Vorbilder, Idole und Influencer hinterfragen",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "PuG8 Politik als Gestaltungsmittel für das Zusammenleben verstehen",
        hours: 20,
      },
      {
        id: "lb5",
        label: "PuG8 Grenzüberschreitende Zusammenarbeit vor Ort untersuchen",
        hours: 12,
      },
      {
        id: "lb6",
        label: "PuG8 Profilbereich",
        hours: 28,
      },
    ],
    "gymnasium|8|russisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|spanisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|8|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|8|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|8|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Ökonomisches Handeln im privaten Haushalt",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Ökonomisches Handeln im Unternehmen",
        hours: 38,
      },
      {
        id: "lb3",
        label: "Rechtlich verantwortliches Handeln",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Profilbereich am WWG",
      },
    ],
    "gymnasium|9|berufliche_orientierung": [
      {
        id: "lb1",
        label: "BO9",
      },
    ],
    "gymnasium|9|biologie": [
      {
        id: "lb1",
        label: "Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Mikroorganismen in der Biotechnologie",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Genetik und Gentechnik",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Evolution",
        hours: 8,
      },
      {
        id: "lb5",
        label: "Biodiversität bei Wirbellosen – Variabilität und Angepasstheit",
        hours: 16,
      },
      {
        id: "lb6",
        label: "Ökosystem Boden",
        hours: 6,
      },
    ],
    "gymnasium|9|chemie|ch": [
      {
        id: "lb1",
        label: "C9 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "C9 Stoffe und ihre Eigenschaften – Von beobachtbaren Stoffeigenschaften zum Teilchenmodell",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "C9 Chemische Reaktion – Vom Teilchenmodell zum Daltonschen Atommodell",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "C9 Chemische Verbindungen und ihre Eigenschaften – Vom Daltonschen Atommodell zum Kern-Hülle-Modell",
        hours: 11,
      },
      {
        id: "lb5",
        label:
          "C9 Atombau und gekürztes Periodensystem – Vom Kern-Hülle-Modell zum Energiestufenmodell und zum Ordnungsprinzip des gekürzten Periodensystems",
        hours: 6,
      },
      {
        id: "lb6",
        label:
          "C9 Donator-Akzeptor-Konzept – Elektronenübergänge (Entladen und Bilden von Ionen)",
        hours: 9,
      },
    ],
    "gymnasium|9|chemie|ch-ntg": [
      {
        id: "lb1",
        label: "C9 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "C9 Atombau und gekürztes Periodensystem – Vom Kern-Hülle-Modell zum Energiestufenmodell und zum Ordnungsprinzip des gekürzten Periodensystems",
        hours: 9,
      },
      {
        id: "lb3",
        label:
          "C9 Donator-Akzeptor-Konzept – Elektronenübergänge (Entladen und Bilden von Ionen)",
        hours: 18,
      },
      {
        id: "lb4",
        label:
          "C9 Moleküle – Mit dem einfachen Orbitalmodell zum Elektronenpaarabstoßungsmodell",
        hours: 21,
      },
      {
        id: "lb5",
        label: "C9 Wechselwirkungskonzept – Anziehung zwischen Teilchen",
        hours: 36,
      },
    ],
    "gymnasium|9|chi": [
      {
        id: "lb1",
        label: "Chi9 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi9 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi9 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi9 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi9 Themengebiete",
      },
    ],
    "gymnasium|9|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
      {
        id: "lb5",
        label: "Profilbereich am MuG",
      },
    ],
    "gymnasium|9|englisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|englisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|ethik": [
      {
        id: "lb1",
        label: "Fernöstliche Religionen",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gewissen und Verantwortung",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Friedensethik",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Arbeitsethik",
        hours: 10,
      },
    ],
    "gymnasium|9|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Frei im Netz!?",
        hours: 10,
      },
      {
        id: "lb2",
        label: "„Für uns“ – der Glaube an Jesus Christus",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Judentum",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "„In Verantwortung vor Gott“ – das Verhältnis von Kirche und Staat",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Liebe – der Himmel auf Erden?",
        hours: 8,
      },
    ],
    "gymnasium|9|franzoesisch|1-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|franzoesisch|2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|franzoesisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|geschichte": [
      {
        id: "lb1",
        label: "Weimarer Republik – die erste deutsche Demokratie",
        hours: 13,
      },
      {
        id: "lb2",
        label: "Nationalsozialismus, Zweiter Weltkrieg und Holocaust",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Rechte des Menschen gestern und heute (Längsschnitt)",
        hours: 6,
      },
      {
        id: "lb4",
        label: "Deutschland und die Siegermächte 1945&#x202f;–&#x202f;1949",
        hours: 9,
      },
      {
        id: "lb5",
        label: "Weltpolitik im Kalten Krieg",
        hours: 10,
      },
    ],
    "gymnasium|9|griechisch": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultureller Kontext",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "gymnasium|9|informatik": [
      {
        id: "lb1",
        label: "Funktionen und Datenflüsse, Tabellenkalkulationsprogramm",
        hours: 14,
      },
      {
        id: "lb2",
        label:
          "Grundlagen der Datenmodellierung und relationaler Datenbanksysteme",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Grundlagen der objektorientierten Modellierung und Programmierung",
        hours: 26,
      },
      {
        id: "lb4",
        label: "Datenschutz",
        hours: 6,
      },
    ],
    "gymnasium|9|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Partnerschaft und Familie reflektieren",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Spiritualität diskutieren",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Menschliche Freiheit reflektieren",
      },
      {
        id: "lb4",
        label: "Propheten – Ungerechtigkeiten entgegentreten",
      },
      {
        id: "lb5",
        label: "Muhammads Leben und Wirken – Frieden gestalten",
      },
      {
        id: "lb6",
        label: "Koran und Schrifttradition – Überlieferungen erklären",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Glaubensrichtungen verstehen",
      },
      {
        id: "lb8",
        label: "Religionen und Weltanschauungen – Extremismus reflektieren",
      },
    ],
    "gymnasium|9|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Der Schabbat im Kontext von Arbeit und Leistung",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gebet und Ritus: Rituale am Schabbat und ihre spirituelle Bedeutung",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Mensch und Welt: Liebe und Familie im Judentum",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Jüdische Gemeinden im Mittelalter",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Midrasch und Limmud (Lernen)",
        hours: 12,
      },
    ],
    "gymnasium|9|italienisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Christliche Verantwortung im Alltag: Orientierung in Entscheidungsprozessen",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Jesus von Nazaret – Gott nimmt sich des Menschen an",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Freundschaft – Partnerschaft – Liebe: verantwortliche Gestaltung von menschlichen Beziehungen",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Unter dem Anspruch der Wahrheit: Christsein in gesellschaftlicher Bedrängnis",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Begegnung mit dem jüdischen Glauben",
        hours: 12,
      },
    ],
    "gymnasium|9|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|9|latein": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|9|mathematik": [
      {
        id: "lb1",
        label: "1 Quadratwurzeln",
        hours: 17,
      },
      {
        id: "lb2",
        label: "2 Quadratische Funktionen",
        hours: 36,
      },
      {
        id: "lb3",
        label: "3 Wahrscheinlichkeit verknüpfter Ereignisse",
        hours: 8,
      },
      {
        id: "lb4",
        label: "4 Ähnlichkeit und Strahlensatz",
        hours: 14,
      },
      {
        id: "lb5",
        label:
          "5 Potenzfunktionen mit natürlichen Exponenten und Erweiterung des Potenzbegriffs",
        hours: 9,
      },
      {
        id: "lb6",
        label: "6 Satz des Pythagoras",
        hours: 11,
      },
      {
        id: "lb7",
        label: "7 Trigonometrie",
        hours: 17,
      },
    ],
    "gymnasium|9|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|9|or": [
      {
        id: "lb1",
        label: "Die Ökumenischen Konzile",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Patrologie",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Liebe und Sexualität",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Die Orthodoxen Ortskirchen im 19. und 20. Jahrhundert",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Sinn der Gebote",
        hours: 12,
      },
    ],
    "gymnasium|9|physik": [
      {
        id: "lb1",
        label: "Energie als Erhaltungsgröße",
        hours: 26,
      },
      {
        id: "lb2",
        label: "Atome",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Wärmelehre",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Profilbereich am NTG",
        hours: 28,
      },
    ],
    "gymnasium|9|pug": [
      {
        id: "lb1",
        label:
          "PuG9 Auswirkungen von Politik erfahren &#x202f;–&#x202f; Politik für Jugendliche, Politik von Jugendlichen",
        hours: 18,
      },
      {
        id: "lb2",
        label:
          "PuG9 Zusammenhalten früher und heute &#x202f;–&#x202f; den gesellschaftlichen Wandel verstehen",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "PuG9 Politik mitgestalten in der Kommune und im Freistaat Bayern",
        hours: 14,
      },
      {
        id: "lb4",
        label: "PuG9 Globalisierung verstehen und mitgestalten",
        hours: 10,
      },
    ],
    "gymnasium|9|russisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|sozialpraktische-grundbildung": [
      {
        id: "lb1",
        label:
          "SpG9 Erziehung als Hilfe zur Persönlichkeitsentwicklung verstehen",
        hours: 14,
      },
      {
        id: "lb2",
        label:
          "SpG9 Inklusion und Integration als gemeinsame Aufgabe begreifen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "SpG9 Freizeit und Medienkonsum reflektiert gestalten",
        hours: 14,
      },
      {
        id: "lb4",
        label:
          "SpG9 Die natürlichen Lebensgrundlagen wertschätzen und verantwortungsbewusstes Konsumverhalten entwickeln",
        hours: 14,
      },
    ],
    "gymnasium|9|spanisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|9|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|9|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|9|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Recht als Handlungsrahmen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Unternehmerisch denken und entscheiden",
        hours: 42,
      },
    ],
    "gymnasium|9|wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "WIn9 Informationstechnologie im Unternehmen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "WIn9 Kommunikation zwischen Unternehmen und Öffentlichkeit",
        hours: 24,
      },
      {
        id: "lb3",
        label: "WIn9 Datenspuren und Datenschutz",
        hours: 8,
      },
      {
        id: "lb4",
        label: "WIn9 IT-Sicherheit und Internetkriminalität",
        hours: 14,
      },
    ],
    "gymnasium|10|biologie": [
      {
        id: "lb1",
        label: "Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Ökosystem Mensch",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Stoff- und Energieumwandlung im Menschen",
        hours: 33,
      },
      {
        id: "lb4",
        label: "Vergangenheit und Zukunft des Menschen",
        hours: 7,
      },
    ],
    "gymnasium|10|chemie|ch": [
      {
        id: "lb1",
        label: "C10 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "C10 Moleküle – Mit dem einfachen Orbitalmodell zum Elektronenpaarabstoßungsmodell",
        hours: 15,
      },
      {
        id: "lb3",
        label: "C10 Wechselwirkungskonzept – Anziehung zwischen Teilchen",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität chemischer Reaktionen bei Protonenübergängen",
        hours: 18,
      },
      {
        id: "lb5",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität chemischer Reaktionen bei Redoxreaktionen in wässriger Lösung",
        hours: 18,
      },
      {
        id: "lb6",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität bei Nukleophil-Elektrophil-Reaktionen",
        hours: 13,
      },
    ],
    "gymnasium|10|chemie|ch-ntg": [
      {
        id: "lb1",
        label: "C10 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität chemischer Reaktionen bei Protonenübergängen",
        hours: 28,
      },
      {
        id: "lb3",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität chemischer Reaktionen bei Elektronenübergängen: Redoxreaktionen",
        hours: 28,
      },
      {
        id: "lb4",
        label:
          "C10 Donator-Akzeptor-Konzept und Reversibilität bei Nukleophil-Elektrophil-Reaktionen",
        hours: 28,
      },
    ],
    "gymnasium|10|chi": [
      {
        id: "lb1",
        label: "Chi10 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi10 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi10 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi10 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi10 Themengebiete",
      },
    ],
    "gymnasium|10|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
      {
        id: "lb5",
        label: "Profilbereich am MuG",
      },
    ],
    "gymnasium|10|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|ethik": [
      {
        id: "lb1",
        label: "Ursprünge des Philosophierens",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Religionsphilosophie und vergleichende Religionsbetrachtung",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Wirtschaftsethik",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Medienethik",
        hours: 14,
      },
    ],
    "gymnasium|10|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Wie halt ich’s mit der Religion?",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Buddhismus",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Zum Glück?!",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Mitten im Tod: das Leben",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Gerechtigkeit und Frieden in der einen Welt",
        hours: 12,
      },
    ],
    "gymnasium|10|franzoesisch|1-2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|franzoesisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|geographie": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Leben in der Einen Welt",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Klima- und Vegetationszonen der Tropen und ariden Subtropen",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Klima im Wandel",
        hours: 9,
      },
      {
        id: "lb5",
        label:
          "Traditionsreicher Kulturraum im Spannungsfeld aktueller Geopolitik – Nordafrika, Naher und Mittlerer Osten",
        hours: 10,
      },
      {
        id: "lb6",
        label:
          "Entwicklungsperspektiven in tropischen Räumen – Afrika südlich der Sahara",
        hours: 12,
      },
      {
        id: "lb7",
        label:
          "Herausforderungen der Entwicklung in tropischen Räumen – Mittel- und Südamerika, Karibik",
        hours: 11,
      },
    ],
    "gymnasium|10|geschichte": [
      {
        id: "lb1",
        label: "Das geteilte Deutschland und die Wiedervereinigung",
        hours: 17,
      },
      {
        id: "lb2",
        label:
          "Europäische Integration und globalisierte Welt bis zum Beginn des 21. Jahrhunderts",
        hours: 11,
      },
    ],
    "gymnasium|10|griechisch": [
      {
        id: "lb1",
        label: "Spracherwerb",
      },
      {
        id: "lb2",
        label: "Übergangslektüre (fakultative Ergänzung zum .1)",
      },
      {
        id: "lb3",
        label: "Texte und ihr kultureller Kontext (Lektürephase)",
      },
      {
        id: "lb4",
        label: "Sprachliche Basis (zur Lektürephase)",
      },
      {
        id: "lb5",
        label: "Methodik",
      },
    ],
    "gymnasium|10|informatik": [
      {
        id: "lb1",
        label: "Datenmodellierung und relationale Datenbanksysteme",
        hours: 17,
      },
      {
        id: "lb2",
        label: "Objektorientierte Modellierung und Programmierung",
        hours: 27,
      },
      {
        id: "lb3",
        label: "Projekt",
        hours: 12,
      },
    ],
    "gymnasium|10|iu": [
      {
        id: "lb1",
        label: "Miteinander leben – Menschenrechte erörtern",
      },
      {
        id: "lb2",
        label: "Religiöses Leben – Frömmigkeit wahrnehmen",
      },
      {
        id: "lb3",
        label: "Glaubenslehre des Islams – Leben angesichts des Todes bedenken",
      },
      {
        id: "lb4",
        label: "Propheten – Frauen als Vorbilder verstehen",
      },
      {
        id: "lb5",
        label:
          "Muhammads Leben und Wirken – Sich mit Vorbildern auseinandersetzen",
      },
      {
        id: "lb6",
        label:
          "Koran und Schrifttradition – Überlieferungen kritisch reflektieren",
      },
      {
        id: "lb7",
        label:
          "Geschichte und Geographie des Islams – Glaubenskonflikte diskutieren",
      },
      {
        id: "lb8",
        label:
          "Religionen und Weltanschauungen – Fernöstliche Religionen verstehen",
      },
    ],
    "gymnasium|10|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Jüdisches Zeitverständnis – Fest- und Gedenktage und ihre Bedeutung für die eigene jüdische Identität",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gebet und Ritus: Einschaltungen in die Gebete an Feiertagen und Gedenktagen",
        hours: 8,
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt: Dialog mit fernöstlichen Religionen und Weltanschauungen",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie: Zionismus und Gründung des Staates Israel",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Mischna und Sikaron (Erinnerung)",
        hours: 12,
      },
    ],
    "gymnasium|10|italienisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Unantastbar: Recht auf Leben und Menschenwürde",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Tod und Auferstehung – Die christliche Hoffnung auf ein Leben nach dem Tod",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          '„Für uns Menschen und zu unserem Heil ist er vom Himmel gekommen" – Jesus, der Christus',
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Auf der Suche nach Orientierung und Glück: Grundlinien christlich verantworteter Lebensentwürfe",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Fernöstliche Glaubens- und Lebensweisen – Begegnung mit Hinduismus und Buddhismus",
        hours: 12,
      },
    ],
    "gymnasium|10|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion, Inszenierung und Kommunikation",
      },
    ],
    "gymnasium|10|latein": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|10|mathematik": [
      {
        id: "lb1",
        label: "1 Exponentielles Wachstum und Logarithmus",
        hours: 18,
      },
      {
        id: "lb2",
        label:
          "2 Zusammengesetzte Zufallsexperimente und stochastische Simulationen",
        hours: 15,
      },
      {
        id: "lb3",
        label: "3 Sinus- und Kosinusfunktion",
        hours: 17,
      },
      {
        id: "lb4",
        label: "4 Ganzrationale Funktionen",
        hours: 12,
      },
      {
        id: "lb5",
        label: "5 Fortführung der Raumgeometrie",
        hours: 22,
      },
    ],
    "gymnasium|10|musik": [
      {
        id: "lb1",
        label: "Sprechen - Singen - Musizieren",
      },
      {
        id: "lb2",
        label: "Musik - Mensch - Zeit",
      },
      {
        id: "lb3",
        label: "Bewegung - Tanz - Szene",
      },
      {
        id: "lb4",
        label: "Musik und ihre Grundlagen",
      },
    ],
    "gymnasium|10|or": [
      {
        id: "lb1",
        label: "Mystik",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Das Glaubensbekenntnis",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Ethik des Lebens",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Gebet und Klosterleben",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Einblick in fernöstliche Religionen",
        hours: 10,
      },
    ],
    "gymnasium|10|physik": [
      {
        id: "lb1",
        label: "Elektromagnetismus",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Impulserhaltung in der Mechanik",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Bewegungen und ihre Modellierung in der Physik",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Kernphysik",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Profilbereich am NTG",
        hours: 28,
      },
    ],
    "gymnasium|10|pug|einstuendig": [
      {
        id: "lb1",
        label: "PuG10 Werte leben im demokratischen Staat",
        hours: 6,
      },
      {
        id: "lb2",
        label: "PuG10 Politische Verantwortung übernehmen für sich und andere",
        hours: 8,
      },
      {
        id: "lb3",
        label:
          "PuG10 Das Zusammenwirken der politischen Institutionen in Deutschland verstehen",
        hours: 8,
      },
      {
        id: "lb4",
        label: "PuG10 Grundzüge der internationalen Zusammenarbeit erfassen",
        hours: 6,
      },
    ],
    "gymnasium|10|pug|zweistuendig": [
      {
        id: "lb1",
        label: "PuG10 Werte leben im demokratischen Staat",
        hours: 14,
      },
      {
        id: "lb2",
        label: "PuG10 Politische Verantwortung übernehmen für sich und andere",
        hours: 16,
      },
      {
        id: "lb3",
        label:
          "PuG10 Das Zusammenwirken der politischen Institutionen in Deutschland verstehen",
        hours: 16,
      },
      {
        id: "lb4",
        label: "PuG10 Grundzüge der internationalen Zusammenarbeit erfassen",
        hours: 10,
      },
    ],
    "gymnasium|10|russisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|sozialpraktische-grundbildung": [
      {
        id: "lb1",
        label:
          "SpG10 Herausforderungen des Erwachsenenlebens erkennen und diskutieren",
        hours: 14,
      },
      {
        id: "lb2",
        label:
          "SpG10 Die Medienlandschaft überblicken und ihren Pluralismus wertschätzen",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "SpG10 Ethische Fragen in ihrer politisch-gesellschaftlichen Dimension diskutieren",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "SpG10 Chancen und Herausforderungen Sozialer Arbeit untersuchen",
        hours: 16,
      },
    ],
    "gymnasium|10|spanisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|10|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|10|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|10|wirtschaft-und-recht|andere": [
      {
        id: "lb1",
        label: "Ökonomisches Handeln auf dem Markt",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Recht als Handlungsrahmen",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Entwicklung eines Geschäftsmodells",
        hours: 20,
      },
    ],
    "gymnasium|10|wirtschaft-und-recht|wwg": [
      {
        id: "lb1",
        label: "Unternehmen als Teil von Gesamtwirtschaft und Gesellschaft",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Recht als Handlungsrahmen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Ökonomisches Handeln auf Märkten",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Entscheidungen aus verhaltensökonomischer Sicht",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Profilbereich am WWG",
      },
    ],
    "gymnasium|10|wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "WIn10 Unternehmen als vernetzte Systeme",
        hours: 28,
      },
      {
        id: "lb2",
        label: "WIn10 Algorithmik",
        hours: 22,
      },
      {
        id: "lb3",
        label: "WIn10 Informationstechnologische Zukunftstrends",
        hours: 6,
      },
      {
        id: "lb4",
        label: "WIn10 Profilbereich am WWG",
      },
    ],
    "gymnasium|11|berufliche_orientierung": [
      {
        id: "lb1",
        label: "BO11",
      },
    ],
    "gymnasium|11|chemie": [
      {
        id: "lb1",
        label: "C11 Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C11 Lebensmittelchemie",
        hours: 34,
      },
      {
        id: "lb3",
        label: "C11 Pharmazie",
        hours: 20,
      },
    ],
    "gymnasium|11|chi|fs3": [
      {
        id: "lb1",
        label: "Chi11 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi11 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi11 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi11 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi11 5 Themengebiete",
      },
    ],
    "gymnasium|11|chi|spaet": [
      {
        id: "lb1",
        label: "Chi11 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi11 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi11 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi11 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi11 5 Themengebiete",
      },
    ],
    "gymnasium|11|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|11|englisch": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|ethik": [
      {
        id: "lb1",
        label: "Philosophische Deutung des Menschen",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Politische Ethik",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Medizinethik",
        hours: 12,
      },
    ],
    "gymnasium|11|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Glaube und Vernunft – alte und neue Herausforderungen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Freiheit leben",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Sola scriptura!? – Zugänge zur Bibel",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Zwischen Distanz und Nähe: Judentum, Christentum, Islam",
        hours: 12,
      },
    ],
    "gymnasium|11|franzoesisch|1-2-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|franzoesisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|franzoesisch|spaet-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|geographie": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken",
      },
      {
        id: "lb2",
        label: "Einblick in die Globalisierung",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Die USA im Spannungsfeld globaler Einflüsse",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Russland – Raum als Potenzial und Herausforderung",
        hours: 10,
      },
      {
        id: "lb5",
        label: "China – Global Player mit nationaler und globaler Agenda",
        hours: 12,
      },
      {
        id: "lb6",
        label:
          "Australien und Ozeanien zwischen Vulnerabilität und Nachhaltigkeit",
        hours: 12,
      },
    ],
    "gymnasium|11|geschichte": [
      {
        id: "lb1",
        label: "Geschichte erinnern",
        hours: 15,
      },
      {
        id: "lb2",
        label:
          "Migration in Bayern von der Frühen Neuzeit bis zum 20. Jahrhundert",
        hours: 12,
      },
    ],
    "gymnasium|11|griechisch": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|11|informatik|ntg": [
      {
        id: "lb1",
        label: "Graphen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Codierung und Verschlüsselung",
        hours: 11,
      },
      {
        id: "lb3",
        label: "Kommunikation in Netzwerken, Internet",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Künstliche Intelligenz",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Vertiefung",
        hours: 7,
      },
    ],
    "gymnasium|11|informatik|mug_swg_sg": [
      {
        id: "lb1",
        label: "Algorithmik",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Codierung und Verschlüsselung",
        hours: 11,
      },
      {
        id: "lb3",
        label: "Kommunikation in Netzwerken, Internet",
        hours: 9,
      },
      {
        id: "lb4",
        label: "Künstliche Intelligenz",
        hours: 12,
      },
    ],
    "gymnasium|11|ir": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus: Mizwot der Feiertage (Schwerpunkt: Sukkot)",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus: Gebet (Tefilla) und jüdischer Lebenszyklus",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt: Lebenserhaltung (Schmirat haGuf we haNefesch) und Bewahrung der Schöpfung (Bal Taschchit und Tikkun Olam)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Jüdische Geschichte und Philosophie: Jerusalem",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Halacha - Cherut (Freiheit)",
        hours: 10,
      },
    ],
    "gymnasium|11|italienisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|italienisch|spaet-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Zwischen Tradition und Aufbruch – Kirche im gesellschaftlichen Modernisierungsprozess",
        hours: 15,
      },
      {
        id: "lb2",
        label: "Der Mensch angesichts des medizinisch-technischen Fortschritts",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Theodizee – Ernstfall der Gottesfrage",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Erkenntnis und Sprache – Zugänge zur religiösen Wirklichkeit",
        hours: 15,
      },
    ],
    "gymnasium|11|kunst": [
      {
        id: "lb1",
        label: "Bildende Kunst",
      },
      {
        id: "lb2",
        label: "Architektur und Produktdesign",
      },
      {
        id: "lb3",
        label: "Interaktion und Kommunikation",
      },
    ],
    "gymnasium|11|latein": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|11|mathematik": [
      {
        id: "lb1",
        label: "1 Spezielle Eigenschaften von Funktionen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "2 Gebrochen-rationale Funktionen – Grenzwerte und Asymptoten",
        hours: 15,
      },
      {
        id: "lb3",
        label: "3 Bedingte Wahrscheinlichkeit und stochastische Unabhängigkeit",
        hours: 15,
      },
      {
        id: "lb4",
        label: "4 Grundlagen der Differentialrechnung",
        hours: 37,
      },
    ],
    "gymnasium|11|musik": [
      {
        id: "lb1",
        label: "Musik politisch",
      },
      {
        id: "lb2",
        label:
          "Musik interdisziplinär (aus den Lernbereichen 11.2.1 mit 11.2.4 wird mindestens ein Bereich ausgewählt)",
      },
      {
        id: "lb3",
        label: "Musik kreativ",
      },
      {
        id: "lb4",
        label: "Musik explorativ",
      },
    ],
    "gymnasium|11|or": [
      {
        id: "lb1",
        label: "Schöpfungstheologie und Naturwissenschaft",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Religionskritik und Leidbewältigung",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Ethische Kompetenz in der modernen Welt",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Christliche Hermeneutik",
        hours: 14,
      },
    ],
    "gymnasium|11|physik": [
      {
        id: "lb1",
        label: "Kreisbewegung",
        hours: 13,
      },
      {
        id: "lb2",
        label: "Schwingungen und Wellen",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Eigenverantwortliche Arbeit an physikalischen Themen",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Profilbereich am NTG (27 Std.)",
      },
    ],
    "gymnasium|11|pug|zweistuendig": [
      {
        id: "lb1",
        label:
          "PuG11 Die Bedeutung der demografischen Entwicklung für den gesellschaftlichen Zusammenhalt verstehen",
        hours: 11,
      },
      {
        id: "lb2",
        label:
          "PuG11 Politische Willensbildung im Medienzeitalter reflektieren",
        hours: 12,
      },
      {
        id: "lb3",
        label: "PuG11 Für den demokratischen Rechtsstaat eintreten",
        hours: 12,
      },
      {
        id: "lb4",
        label: "PuG11 Die föderale Demokratie Deutschlands mitgestalten",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "PuG11 Die politische Gestaltung globalen Zusammenlebens reflektieren",
        hours: 11,
      },
    ],
    "gymnasium|11|pug|dreistuendig": [
      {
        id: "lb1",
        label:
          "PuG11 Die Bedeutung der demografischen Entwicklung für den gesellschaftlichen Zusammenhalt verstehen",
        hours: 17,
      },
      {
        id: "lb2",
        label:
          "PuG11 Politische Willensbildung im Medienzeitalter reflektieren",
        hours: 17,
      },
      {
        id: "lb3",
        label: "PuG11 Für den demokratischen Rechtsstaat eintreten",
        hours: 17,
      },
      {
        id: "lb4",
        label: "PuG11 Die föderale Demokratie Deutschlands mitgestalten",
        hours: 14,
      },
      {
        id: "lb5",
        label:
          "PuG11 Die politische Gestaltung globalen Zusammenlebens reflektieren",
        hours: 16,
      },
    ],
    "gymnasium|11|pln": [
      {
        id: "lb1",
        label: "Pol11 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Pol11 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Pol11 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Pol11 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Pol11 5 Themengebiete",
      },
    ],
    "gymnasium|11|russisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|russisch|spaet-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|sozialpraktische-grundbildung": [
      {
        id: "lb1",
        label:
          "SpG11 Mit Herausforderungen der Digitalisierung verantwortungsvoll umgehen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "SpG11 Zukunft prognostizieren und für die Zukunft forschen",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "SpG11 Alter und Pflege als individuelle und zugleich gesellschaftliche Verantwortung wahrnehmen",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "SpG11 Gesundheitsförderung als politisch-soziale Aufgabe verstehen",
        hours: 11,
      },
      {
        id: "lb5",
        label:
          "SpG11 Stadt- und Dorfentwicklung als politisch-soziale Aufgabe verstehen",
        hours: 11,
      },
    ],
    "gymnasium|11|spanisch|3-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|spanisch|spaet-fremdsprache": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|11|sport|basis_sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|11|sport|diff_sport": [
      {
        id: "lb1",
        label: "1 Badminton",
      },
      {
        id: "lb2",
        label: "2 Basketball",
      },
      {
        id: "lb3",
        label: "3 Bewegungskünste",
      },
      {
        id: "lb4",
        label: "4 Eishockey",
      },
      {
        id: "lb5",
        label: "5 Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "6 Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "7 Fußball",
      },
      {
        id: "lb8",
        label: "8 Gerätturnen",
      },
      {
        id: "lb9",
        label: "9 Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "10 Golf",
      },
      {
        id: "lb11",
        label: "11 Handball",
      },
      {
        id: "lb12",
        label: "12 Hockey",
      },
      {
        id: "lb13",
        label: "13 Judo",
      },
      {
        id: "lb14",
        label: "14 Kanu",
      },
      {
        id: "lb15",
        label: "15 Leichtathletik",
      },
      {
        id: "lb16",
        label: "16 Radsport",
      },
      {
        id: "lb17",
        label: "17 Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "18 Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "19 Ringen",
      },
      {
        id: "lb20",
        label: "20 Rodeln",
      },
      {
        id: "lb21",
        label: "21 Rudern",
      },
      {
        id: "lb22",
        label: "22 Schwimmen",
      },
      {
        id: "lb23",
        label: "23 Segeln",
      },
      {
        id: "lb24",
        label: "24 Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "25 Ski Alpin",
      },
      {
        id: "lb26",
        label: "26 Skilanglauf",
      },
      {
        id: "lb27",
        label: "27 Snowboard",
      },
      {
        id: "lb28",
        label: "28 Sportklettern",
      },
      {
        id: "lb29",
        label: "29 Tanz",
      },
      {
        id: "lb30",
        label: "30 Tennis",
      },
      {
        id: "lb31",
        label: "31 Tischtennis",
      },
      {
        id: "lb32",
        label: "32 Triathlon",
      },
      {
        id: "lb33",
        label: "33 Volleyball",
      },
    ],
    "gymnasium|11|tsh": [
      {
        id: "lb1",
        label: "Tsh11 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tsh11 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tsh11 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tsh11 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tsh11 5 Themengebiete",
      },
    ],
    "gymnasium|11|tr": [
      {
        id: "lb1",
        label: "Tr11 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tr11 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tr11 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tr11 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tr11 5 Themengebiete",
      },
    ],
    "gymnasium|11|wirtschaft-und-recht|andere": [
      {
        id: "lb1",
        label: "Die Wirtschaftsordnung als Handlungsrahmen",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Recht als Handlungsrahmen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Internationale wirtschaftliche Verflechtung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Globale Zukunftstrends",
        hours: 6,
      },
    ],
    "gymnasium|11|wirtschaft-und-recht|wwg": [
      {
        id: "lb1",
        label: "Die Wirtschaftsordnung als Handlungsrahmen",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Recht als Handlungsrahmen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Internationale wirtschaftliche Verflechtung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Kapitalmarkt und Geldanlage",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Wirtschaftliches und rechtliches Handeln aus institutionenökonomischer Sicht",
        hours: 17,
      },
      {
        id: "lb6",
        label: "Globale Zukunftstrends",
        hours: 6,
      },
      {
        id: "lb7",
        label: "Profilbereich am WWG",
      },
    ],
    "gymnasium|11|wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "WIn11 Verbesserung von Geschäftsprozessen",
        hours: 16,
      },
      {
        id: "lb2",
        label: "WIn11 Datenbanksysteme",
        hours: 26,
      },
      {
        id: "lb3",
        label: "WIn11 Künstliche Intelligenz",
        hours: 12,
      },
      {
        id: "lb4",
        label: "WIn11 Profilbereich am WWG",
      },
    ],
    "gymnasium|12|ar": [
      {
        id: "lb1",
        label:
          "Ar12/13 1 Basismodul „Grundlagen der Archäologie und des Denkmalschutzes“",
      },
      {
        id: "lb2",
        label: "Ar12/13 2 Modul „Steinzeit und Bronzezeit“",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Ar12/13 3 Modul „Der Alte Orient&#x202f;–&#x202f;Mesopotamien und Kleinasien“",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ar12/13 4 Modul „Das Alte Ägypten“",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Ar12/13 5 Modul „Die minoische und mykenische Kultur“",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Ar12/13 6 Modul „Griechische Antike“",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Ar12/13 7 Modul „Römische Antike“",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Ar12/13 8 Modul „Die Etrusker“",
        hours: 8,
      },
      {
        id: "lb9",
        label: "Ar12/13 9 Modul „Die Kelten“",
        hours: 12,
      },
      {
        id: "lb10",
        label:
          "Ar12/13 10 Modul „Die Römer in Bayern&#x202f;–&#x202f;Provinzialrömische Archäologie“",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Ar12/13 11 Modul „Archäologie des Mittelalters“",
        hours: 12,
      },
      {
        id: "lb12",
        label: "Ar12/13 12 Modul „Archäologie der Neuzeit“",
        hours: 12,
      },
      {
        id: "lb13",
        label: "Ar12/13 13 Modul „Archäologie in außereuropäischen Räumen“",
        hours: 8,
      },
    ],
    "gymnasium|12|berufliche_orientierung": [
      {
        id: "lb1",
        label: "BO12/13 Selbsterkundung",
      },
      {
        id: "lb2",
        label: "BO12/13 Berufserkundung",
      },
      {
        id: "lb3",
        label:
          "BO12/13 Studienerkundung (in Kombination mit dem Wissenschaftspropädeutischen Seminar)",
      },
      {
        id: "lb4",
        label: "BO12/13 Bewerbung",
      },
      {
        id: "lb5",
        label: "BO12/13 Reflexion",
      },
    ],
    "gymnasium|12|biologie|grundlegend": [
      {
        id: "lb1",
        label:
          "Biologische Sachverhalte und Zusammenhänge betrachten – Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Genetik und Gentechnik",
        hours: 51,
      },
      {
        id: "lb3",
        label: "Evolution",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Verhaltensökologie – Evolution und Angepasstheit von Verhalten",
        hours: 15,
      },
    ],
    "gymnasium|12|biologie|erhoeht": [
      {
        id: "lb1",
        label:
          "Biologische Sachverhalte und Zusammenhänge betrachten – Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Genetik und Gentechnik",
        hours: 86,
      },
      {
        id: "lb3",
        label: "Evolution",
        hours: 30,
      },
      {
        id: "lb4",
        label: "Verhaltensökologie – Evolution und Angepasstheit von Verhalten",
        hours: 24,
      },
    ],
    "gymnasium|12|biolog-chem-praktikum": [
      {
        id: "lb1",
        label:
          "BcP12/13 Allgemeine naturwissenschaftliche Kompetenzen und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "BcP12/13 Verfahren zur Isolierung von Stoffen",
      },
      {
        id: "lb3",
        label: "BcP12/13 Analyseverfahren",
      },
      {
        id: "lb4",
        label:
          "BcP12/13 Herstellung, Prüfung und Verwendung von Grund- und Werkstoffen",
      },
      {
        id: "lb5",
        label: "BcP12/13 Mikroskopieren",
      },
      {
        id: "lb6",
        label:
          "BcP12/13 Untersuchungen und Beobachtungen zu grundlegenden Anforderungen an Lebewesen",
      },
      {
        id: "lb7",
        label: "BcP12/13 Ökologische Untersuchungen",
      },
    ],
    "gymnasium|12|chemie|grundlegend": [
      {
        id: "lb1",
        label: "C12 Wie Chemikerinnen und Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C12 Atombau",
        hours: 7,
      },
      {
        id: "lb3",
        label: "C12 Analytik",
        hours: 8,
      },
      {
        id: "lb4",
        label: "C12 Chemische Bindung",
        hours: 13,
      },
      {
        id: "lb5",
        label: "C12 Kohlenwasserstoffe – Energieträger und Reaktionspartner",
        hours: 17,
      },
      {
        id: "lb6",
        label:
          "C12 Reaktionsgeschwindigkeit – Ermittlung und Deutung auf Teilchenebene",
        hours: 7,
      },
      {
        id: "lb7",
        label:
          "C12 Chemisches Gleichgewicht – Reversible Reaktion und dynamisches Gleichgewicht",
        hours: 14,
      },
      {
        id: "lb8",
        label: "C12 Redoxgleichgewichte – Energetik und technische Anwendung",
        hours: 18,
      },
    ],
    "gymnasium|12|chemie|erhoeht": [
      {
        id: "lb1",
        label: "C12 Wie Chemikerinnen und Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C12 Atombau und koordinative Bindung",
        hours: 17,
      },
      {
        id: "lb3",
        label: "C12 Analytik",
        hours: 30,
      },
      {
        id: "lb4",
        label: "C12 Chemische Bindung",
        hours: 13,
      },
      {
        id: "lb5",
        label: "C12 Kohlenwasserstoffe – Energieträger und Reaktionspartner",
        hours: 29,
      },
      {
        id: "lb6",
        label:
          "C12 Reaktionsgeschwindigkeit – Ermittlung und Deutung auf Teilchenebene",
        hours: 8,
      },
      {
        id: "lb7",
        label:
          "C12 Chemisches Gleichgewicht – Reversible Reaktion und dynamisches Gleichgewicht",
        hours: 18,
      },
      {
        id: "lb8",
        label: "C12 Redoxgleichgewichte – Energetik und technische Anwendung",
        hours: 25,
      },
    ],
    "gymnasium|12|chi|grundlegend-spaet": [
      {
        id: "lb1",
        label: "Chi12 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi12 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi12 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi12 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi12 5 Themengebiete",
      },
    ],
    "gymnasium|12|chi|grundlegend-3": [
      {
        id: "lb1",
        label: "Chi12/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi12/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi12/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi12/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi12/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|deutsch|regulaer": [
      {
        id: "lb1",
        label: "/13 Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "/13 Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "/13 Schreiben",
      },
      {
        id: "lb4",
        label: "/13 Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|12|deutsch|vertieft": [
      {
        id: "lb1",
        label: "1 Korb „Aspekte der Literatur“",
      },
      {
        id: "lb2",
        label: "2 Korb „Sprache und weitere Medien“",
      },
    ],
    "gymnasium|12|englisch|grundlegend": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|englisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|ethik|grundlegend": [
      {
        id: "lb1",
        label: "Theorie und Praxis des Handelns",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Freiheit und Determination",
        hours: 28,
      },
    ],
    "gymnasium|12|ethik|erhoeht": [
      {
        id: "lb1",
        label:
          "Theorie und Praxis des Handelns und moralisches Urteil in den Bereichsethiken",
        hours: 72,
      },
      {
        id: "lb2",
        label: "Erkenntnistheorie, Freiheit und Determination",
        hours: 40,
      },
    ],
    "gymnasium|12|evangelische-religionslehre|grundlegend": [
      {
        id: "lb1",
        label: "Woran dein Herz hängt – Sinnfrage und Gottesfrage",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Der im-perfekte Mensch",
        hours: 14,
      },
      {
        id: "lb3",
        label: "„Homo faber“ – Der Mensch und seine Möglichkeiten",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Mittendrin?! – Christsein in der Gesellschaft",
        hours: 12,
      },
    ],
    "gymnasium|12|evangelische-religionslehre|erhoeht": [
      {
        id: "lb1",
        label: "Woran dein Herz hängt – Sinnfrage und Gottesfrage",
        hours: 36,
      },
      {
        id: "lb2",
        label: "Der im-perfekte Mensch",
        hours: 28,
      },
      {
        id: "lb3",
        label: "„Homo faber“ – Der Mensch und seine Möglichkeiten",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Mittendrin!? – Christsein in der Gesellschaft",
        hours: 24,
      },
    ],
    "gymnasium|12|franzoesisch|grundlegend-1-2-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|franzoesisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|12|franzoesisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|geographie|grundlegend": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken für Jahrgangsstufe 12 und 13",
      },
      {
        id: "lb2",
        label:
          "Klima und Klimawandel als Folge atmosphärischer und ozeanischer Prozesse sowie anthropogener Einflüsse",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Mensch-Umwelt-Beziehungen in den Tropen zwischen Vulnerabilität und Nachhaltigkeit",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Globale Bedeutung der Subpolaren und Polaren Zone",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "Ressourcenkonflikte und Ressourcenmanagement in den Mittleren Breiten und Subtropen in Europa",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Nutzung und Vulnerabilität von Hochgebirgsräumen",
        hours: 10,
      },
      {
        id: "lb7",
        label:
          "Gefährdungspotenzial und Risikomanagement am Beispiel eines tektonisch bedingten Ereignisses",
        hours: 4,
      },
    ],
    "gymnasium|12|geographie|erhoeht": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken für Jahrgangsstufe 12 und 13",
      },
      {
        id: "lb2",
        label:
          "Klima und Klimawandel als Folge atmosphärischer und ozeanischer Prozesse sowie anthropogener Einflüsse",
        hours: 24,
      },
      {
        id: "lb3",
        label:
          "Mensch-Umwelt-Beziehungen in den Tropen zwischen Vulnerabilität und Nachhaltigkeit",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Globale Bedeutung der Subpolaren und Polaren Zone - Klimaforschung und Geopolitik",
        hours: 16,
      },
      {
        id: "lb5",
        label:
          "Ressourcenkonflikte und Ressourcenmanagement in den Mittleren Breiten und Subtropen in Europa",
        hours: 24,
      },
      {
        id: "lb6",
        label: "Nutzung und Vulnerabilität von Hochgebirgsräumen",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Naturkatastrophen im Fokus der geographischen Risikoforschung",
        hours: 12,
      },
    ],
    "gymnasium|12|geschichte|grundlegend": [
      {
        id: "lb1",
        label:
          "1 Auf dem Weg zu gesellschaftlicher und politischer Partizipation vom 19. Jh. bis zur Weimarer Republik",
        hours: 28,
      },
      {
        id: "lb2",
        label: "2 Deutschland zwischen Demokratie und Diktatur",
        hours: 28,
      },
    ],
    "gymnasium|12|geschichte|erhoeht": [
      {
        id: "lb1",
        label:
          "1 Auf dem Weg zu gesellschaftlicher und politischer Partizipation vom Ende des 18. Jh. bis zur Weimarer Republik",
        hours: 56,
      },
      {
        id: "lb2",
        label: "2 Deutschland zwischen Demokratie und Diktatur",
        hours: 56,
      },
    ],
    "gymnasium|12|griechisch|grundlegend": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|12|griechisch|erhoeht": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|12|informatik|grundlegend": [
      {
        id: "lb1",
        label: "Rekursion",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Listen",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Binärbäume",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Nebenläufige Prozesse",
        hours: 9,
      },
      {
        id: "lb5",
        label: "Informationssicherheit",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Praktische Softwareentwicklung, Projekt",
        hours: 26,
      },
    ],
    "gymnasium|12|informatik|erhoeht": [
      {
        id: "lb1",
        label: "Rekursion",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Listen",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Bäume",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Funktionsweise eines Rechners",
        hours: 26,
      },
      {
        id: "lb5",
        label: "Betriebssysteme, Prozesse und Nebenläufigkeit",
        hours: 23,
      },
      {
        id: "lb6",
        label: "Informationssicherheit",
        hours: 6,
      },
      {
        id: "lb7",
        label: "Praktische Softwareentwicklung, Projekt",
        hours: 40,
      },
    ],
    "gymnasium|12|informatik|grundlegend-spaet": [
      {
        id: "lb1",
        label: "Objektorientierte Modellierung und Programmierung",
        hours: 37,
      },
      {
        id: "lb2",
        label: "Rekursion",
        hours: 5,
      },
      {
        id: "lb3",
        label: "Listen",
        hours: 11,
      },
      {
        id: "lb4",
        label: "Graphen",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Informationssicherheit",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Praktische Softwareentwicklung, Projekt",
        hours: 15,
      },
    ],
    "gymnasium|12|instrumentalensemble": [
      {
        id: "lb1",
        label: "InE12/13 Musikstücke und ihre Hintergründe",
      },
      {
        id: "lb2",
        label:
          "InE12/13 Leitung von Instrumentalensembles der klassischen Musik und der konzertanten Blasmusik",
      },
      {
        id: "lb3",
        label:
          "InE12/13 Aspekte der Arbeit mit Instrumentalensembles der klassischen Musik und der konzertanten Blasmusik",
      },
      {
        id: "lb4",
        label:
          "InE12/13 Leitung von Ensembles in den Bereichen Jazz, Pop, Rock",
      },
      {
        id: "lb5",
        label:
          "InE12/13 Aspekte der Arbeit mit Ensembles in den Bereichen Jazz, Pop, Rock",
      },
      {
        id: "lb6",
        label: "InE12/13 Leitung von Volksmusikensembles",
      },
      {
        id: "lb7",
        label: "InE12/13 Aspekte der Arbeit mit Volksmusikensembles",
      },
    ],
    "gymnasium|12|ir|grundlegend": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus – Ethik der Feiertage: jüdisches Menschenbild und jüdische Gottesidee I (Pessach und Schawuot)",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gebet und Ritus – Schabbat im persönlichen Leben – Ethik des wichtigsten Feiertags: jüdisches Menschenbild und Gottesliebe",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Mensch und Welt – Sozial- und Medizinethik",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie – jüdisches Leben in Europa vom Mittelalter bis zur Aufklärung: Verfolgung und Zusammenleben",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Talmud – Gemilut Chassadim",
        hours: 10,
      },
    ],
    "gymnasium|12|ir|erhoeht": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus – Ethik der Feiertage Menschenbild und Gottesidee I (Pessach und Schawuot)",
        hours: 20,
      },
      {
        id: "lb2",
        label:
          "Gebet und Ritus – Schabbat im persönlichen Leben – Ethik des wichtigsten Feiertags: jüdisches Menschenbild und Gottesliebe",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Mensch und Welt – Sozial- und Medizinethik",
        hours: 24,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie – jüdisches Leben in Europa vom Mittelalter bis zur Aufklärung: Verfolgung und Zusammenleben",
        hours: 24,
      },
      {
        id: "lb5",
        label: "Schriftliche Quellen – Werte: Talmud – Gemilut Chassadim",
        hours: 20,
      },
    ],
    "gymnasium|12|italienisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|italienisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|12|italienisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|katholische-religionslehre|grundlegend": [
      {
        id: "lb1",
        label:
          "1 Grundfragen des Menschen im Horizont des Glaubens: Personalität",
        hours: 28,
      },
      {
        id: "lb2",
        label:
          "2 Grundfragen des Menschen im Horizont des Glaubens: Transzendentalität",
        hours: 28,
      },
    ],
    "gymnasium|12|katholische-religionslehre|erhoeht": [
      {
        id: "lb1",
        label:
          "1 Grundfragen des Menschen im Horizont des Glaubens: Personalität",
        hours: 56,
      },
      {
        id: "lb2",
        label:
          "2 Grundfragen des Menschen im Horizont des Glaubens: Transzendentalität",
        hours: 56,
      },
    ],
    "gymnasium|12|kunst|grundlegend": [
      {
        id: "lb1",
        label: "Objekt",
      },
      {
        id: "lb2",
        label: "Raum",
      },
    ],
    "gymnasium|12|kunst|erhoeht": [
      {
        id: "lb1",
        label: "Objekt",
      },
      {
        id: "lb2",
        label: "Raum",
      },
    ],
    "gymnasium|12|latein|grundlegend": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|12|latein|erhoeht": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|12|mathematik|regulaer": [
      {
        id: "lb1",
        label:
          "1 Untersuchung von Funktionen – Stammfunktion, Produkt- und Kettenregel",
        hours: 33,
      },
      {
        id: "lb2",
        label: "2 Zufallsgrößen und Binomialverteilung",
        hours: 22,
      },
      {
        id: "lb3",
        label:
          "3 Einseitiger Signifikanztest (bei als binomialverteilt angenommenen Merkmalen)",
        hours: 8,
      },
      {
        id: "lb4",
        label:
          "4 Untersuchung von Funktionen – Quotientenregel, Umkehrfunktion",
        hours: 29,
      },
      {
        id: "lb5",
        label: "5 Grundlagen der Koordinatengeometrie im Raum",
        hours: 20,
      },
    ],
    "gymnasium|12|mathematik|vertieft": [
      {
        id: "lb1",
        label: "1 Modul „Komplexe Zahlen“",
      },
      {
        id: "lb2",
        label: "2 Modul „Folgen und Reihen“",
      },
      {
        id: "lb3",
        label: "3 Modul „Matrizen“",
      },
      {
        id: "lb4",
        label: "4 Modul „Zahlentheorie und Kryptologie“",
      },
      {
        id: "lb5",
        label: "5 Modul „Statistik“",
      },
    ],
    "gymnasium|12|musik|grundlegend": [
      {
        id: "lb1",
        label: "Entwicklungen abendländischer Vokalmusik (12/1)",
      },
      {
        id: "lb2",
        label: "Musik und Tradition (12/2.1)",
      },
      {
        id: "lb3",
        label:
          "Musik und Technik: Mittel, Ausprägungen und Auswirkungen (12/2.2)",
      },
    ],
    "gymnasium|12|musik|erhoeht": [
      {
        id: "lb1",
        label: "Entwicklungen abendländischer Vokalmusik (12/1)",
      },
      {
        id: "lb2",
        label: "Musik und Tradition (12/2.1)",
      },
      {
        id: "lb3",
        label:
          "Musik und Technik: Mittel, Ausprägungen und Auswirkungen (12/2.2)",
      },
    ],
    "gymnasium|12|or|grundlegend": [
      {
        id: "lb1",
        label: "Was ist Religion?",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Das Verhältnis von Kirche und Staat",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Lebensgestaltung in orthodoxer Perspektive",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Gotteserfahrung und Vergöttlichung des Menschen",
        hours: 14,
      },
    ],
    "gymnasium|12|or|erhoeht": [
      {
        id: "lb1",
        label: "Was ist Religion?",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Das Verhältnis von Kirche und Staat",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Lebensgestaltung in orthodoxer Perspektive",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Gotteserfahrung und Vergöttlichung des Menschen",
        hours: 28,
      },
    ],
    "gymnasium|12|physik|grundlegend": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Statische elektrische und magnetische Felder",
        hours: 42,
      },
      {
        id: "lb3",
        label: "Elektromagnetische Induktion und Schwingungen",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Elektromagnetische Wellen",
        hours: 22,
      },
    ],
    "gymnasium|12|physik|grundlegend-bio": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Das Auge",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Das Ohr",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Strahlenbiophysik und medizintechnische Anwendungen",
        hours: 22,
      },
      {
        id: "lb5",
        label: "Neuronale Signalleitung",
        hours: 26,
      },
    ],
    "gymnasium|12|physik|erhoeht": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Statische elektrische und magnetische Felder",
        hours: 46,
      },
      {
        id: "lb3",
        label: "Elektromagnetische Induktion und Schwingungen",
        hours: 33,
      },
      {
        id: "lb4",
        label: "Elektromagnetische Wellen",
        hours: 37,
      },
      {
        id: "lb5",
        label: "Experimentelles Arbeiten",
        hours: 20,
      },
    ],
    "gymnasium|12|pug|grundlegend": [
      {
        id: "lb1",
        label:
          "PuG12 Frieden und Sicherheit als zentrale Motive deutscher Außenpolitik verstehen",
        hours: 12,
      },
      {
        id: "lb2",
        label: "PuG12 Das europäische Projekt verstehen und mitgestalten",
        hours: 16,
      },
      {
        id: "lb3",
        label:
          "PuG12 Politische Systeme vor dem Hintergrund aktueller Entwicklungen vergleichen und Demokratie wertschätzen",
        hours: 20,
      },
      {
        id: "lb4",
        label: "PuG12 Möglichkeiten der Demokratieförderung beurteilen",
        hours: 8,
      },
    ],
    "gymnasium|12|pug|erhoeht": [
      {
        id: "lb1",
        label:
          "PuG12 Frieden und Sicherheit als zentrale Motive deutscher Außenpolitik verstehen",
        hours: 24,
      },
      {
        id: "lb2",
        label: "PuG12 Das europäische Projekt verstehen und mitgestalten",
        hours: 32,
      },
      {
        id: "lb3",
        label:
          "PuG12 Politische Theorien und Utopien für die Gestaltung der Zukunft nutzen",
        hours: 12,
      },
      {
        id: "lb4",
        label:
          "PuG12 Politische Systeme vor dem Hintergrund aktueller Entwicklungen vergleichen und Demokratie wertschätzen",
        hours: 34,
      },
      {
        id: "lb5",
        label: "PuG12 Möglichkeiten der Demokratieförderung beurteilen",
        hours: 10,
      },
    ],
    "gymnasium|12|pln": [
      {
        id: "lb1",
        label: "Pol12 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Pol12 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Pol12 3 Text- und Methodenkompetenzen",
      },
      {
        id: "lb4",
        label: "Pol12 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Pol12 5 Themengebiete",
      },
    ],
    "gymnasium|12|ps": [
      {
        id: "lb1",
        label: "Ps12/13 1 Basismodul „Psychologie als Wissenschaft“",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Ps12/13 2 Basismodul „Allgemeine Psychologie“",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Ps12/13 3 Modul „Entwicklungspsychologie“",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ps12/13 4 Modul „Lernpsychologie“",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Ps12/13 5 Modul „Persönlichkeitspsychologie“",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Ps12/13 6 Modul „Sozialpsychologie“",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Ps12/13 7 Modul „Kommunikationspsychologie“",
        hours: 14,
      },
    ],
    "gymnasium|12|russisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|russisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|12|russisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|sozialwissenschaftl-arbeitsfelder": [
      {
        id: "lb1",
        label:
          "SwA12 1 Grundthemen und Forschungsmethoden der Sozialwissenschaften reflektieren",
        hours: 16,
      },
      {
        id: "lb2",
        label:
          "SwA12 2 Identitätsentwicklung als Thema der Sozialforschung begreifen",
        hours: 12,
      },
      {
        id: "lb3",
        label: "SwA12 3 Konzepte sozialer Verantwortung im Wandel reflektieren",
        hours: 8,
      },
      {
        id: "lb4",
        label:
          "SwA12 4 Zivilgesellschaftliches Engagement und staatliche Engagementpolitik untersuchen",
        hours: 20,
      },
    ],
    "gymnasium|12|spanisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|spanisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|12|spanisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|12|sport|basissport": [
      {
        id: "lb1",
        label: "/13 Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "/13 Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "/13 Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "/13 Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|12|sport|sporttheorie": [
      {
        id: "lb1",
        label: "/13 Trainingslehre",
      },
      {
        id: "lb2",
        label: "/13 Bewegungslehre",
      },
      {
        id: "lb3",
        label: "/13 Sport und Gesundheit",
      },
      {
        id: "lb4",
        label:
          "/13 Psychologische, soziale und gesellschaftspolitische Aspekte des Sports",
      },
    ],
    "gymnasium|12|sug": [
      {
        id: "lb1",
        label: "SuG12/13",
      },
    ],
    "gymnasium|12|stb": [
      {
        id: "lb1",
        label: "STB12/13",
      },
    ],
    "gymnasium|12|tuf": [
      {
        id: "lb1",
        label: "TuF12/13 1 Theater und Film erschließen",
      },
      {
        id: "lb2",
        label: "TuF12/13 2 Theater und Film gestalten",
      },
      {
        id: "lb3",
        label: "TuF12/13 3 Theater und Film reflektieren",
      },
      {
        id: "lb4",
        label: "TuF12/13 4 An Theater und Film teilhaben",
      },
    ],
    "gymnasium|12|tsh": [
      {
        id: "lb1",
        label: "Tsh12 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tsh12 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tsh12 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tsh12 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tsh12 5 Themengebiete",
      },
    ],
    "gymnasium|12|tr": [
      {
        id: "lb1",
        label: "Tr12 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tr12 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tr12 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tr12 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tr12 5 Themengebiete",
      },
    ],
    "gymnasium|12|vokalensemble": [
      {
        id: "lb1",
        label: "Vok12/13 Musikstücke und ihre Hintergründe",
      },
      {
        id: "lb2",
        label: "Vok12/13 Stimmphysiologische Grundlagen",
      },
      {
        id: "lb3",
        label: "Vok12/13 Probenarbeit",
      },
      {
        id: "lb4",
        label: "Vok12/13 Leitung eines Vokalensembles",
      },
      {
        id: "lb5",
        label: "Vok12/13 Bühnenpräsenz",
      },
    ],
    "gymnasium|12|wirtschaft-und-recht|grundlegend": [
      {
        id: "lb1",
        label: "BWL",
        hours: 16,
      },
      {
        id: "lb2",
        label: "VWL",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Recht",
        hours: 14,
      },
    ],
    "gymnasium|12|wirtschaft-und-recht|erhoeht": [
      {
        id: "lb1",
        label: "BWL",
        hours: 54,
      },
      {
        id: "lb2",
        label: "VWL",
        hours: 40,
      },
      {
        id: "lb3",
        label: "Recht",
        hours: 18,
      },
    ],
    "gymnasium|12|wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "WIn12/13 Verwaltung großer Datenmengen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "WIn12/13 Verteilte Informationssysteme",
        hours: 10,
      },
      {
        id: "lb3",
        label: "WIn12/13 Digitale Transformation und digitale Disruption",
        hours: 14,
      },
      {
        id: "lb4",
        label: "WIn12/13 Projekt",
        hours: 14,
      },
      {
        id: "lb5",
        label: "WIn12/13 Datenintegration mit ERP-Systemen",
        hours: 28,
      },
      {
        id: "lb6",
        label: "WIn12/13 IT-Sicherheit und Kryptologie",
        hours: 14,
      },
    ],
    "gymnasium|12|w-seminar": [
      {
        id: "lb1",
        label: "WSem12/13",
      },
    ],
    "gymnasium|13|ar": [
      {
        id: "lb1",
        label:
          "Ar12/13 1 Basismodul „Grundlagen der Archäologie und des Denkmalschutzes“",
      },
      {
        id: "lb2",
        label: "Ar12/13 2 Modul „Steinzeit und Bronzezeit“",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Ar12/13 3 Modul „Der Alte Orient&#x202f;–&#x202f;Mesopotamien und Kleinasien“",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ar12/13 4 Modul „Das Alte Ägypten“",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Ar12/13 5 Modul „Die minoische und mykenische Kultur“",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Ar12/13 6 Modul „Griechische Antike“",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Ar12/13 7 Modul „Römische Antike“",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Ar12/13 8 Modul „Die Etrusker“",
        hours: 8,
      },
      {
        id: "lb9",
        label: "Ar12/13 9 Modul „Die Kelten“",
        hours: 12,
      },
      {
        id: "lb10",
        label:
          "Ar12/13 10 Modul „Die Römer in Bayern&#x202f;–&#x202f;Provinzialrömische Archäologie“",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Ar12/13 11 Modul „Archäologie des Mittelalters“",
        hours: 12,
      },
      {
        id: "lb12",
        label: "Ar12/13 12 Modul „Archäologie der Neuzeit“",
        hours: 12,
      },
      {
        id: "lb13",
        label: "Ar12/13 13 Modul „Archäologie in außereuropäischen Räumen“",
        hours: 8,
      },
    ],
    "gymnasium|13|berufliche_orientierung": [
      {
        id: "lb1",
        label: "BO12/13 Selbsterkundung",
      },
      {
        id: "lb2",
        label: "BO12/13 Berufserkundung",
      },
      {
        id: "lb3",
        label:
          "BO12/13 Studienerkundung (in Kombination mit dem Wissenschaftspropädeutischen Seminar)",
      },
      {
        id: "lb4",
        label: "BO12/13 Bewerbung",
      },
      {
        id: "lb5",
        label: "BO12/13 Reflexion",
      },
    ],
    "gymnasium|13|biologie|grundlegend": [
      {
        id: "lb1",
        label:
          "Biologische Sachverhalte und Zusammenhänge betrachten – Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Neuronale Informationsverarbeitung",
        hours: 15,
      },
      {
        id: "lb3",
        label: "Stoffwechselphysiologie der Zelle",
        hours: 27,
      },
      {
        id: "lb4",
        label: "Ökologie und Biodiversität",
        hours: 21,
      },
    ],
    "gymnasium|13|biologie|erhoeht": [
      {
        id: "lb1",
        label:
          "Biologische Sachverhalte und Zusammenhänge betrachten – Erkenntnisse gewinnen – kommunizieren – bewerten",
      },
      {
        id: "lb2",
        label: "Neuronale Informationsverarbeitung",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Stoffwechselphysiologie der Zelle",
        hours: 43,
      },
      {
        id: "lb4",
        label: "Ökologie und Biodiversität",
        hours: 34,
      },
    ],
    "gymnasium|13|biolog-chem-praktikum": [
      {
        id: "lb1",
        label:
          "BcP12/13 Allgemeine naturwissenschaftliche Kompetenzen und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "BcP12/13 Verfahren zur Isolierung von Stoffen",
      },
      {
        id: "lb3",
        label: "BcP12/13 Analyseverfahren",
      },
      {
        id: "lb4",
        label:
          "BcP12/13 Herstellung, Prüfung und Verwendung von Grund- und Werkstoffen",
      },
      {
        id: "lb5",
        label: "BcP12/13 Mikroskopieren",
      },
      {
        id: "lb6",
        label:
          "BcP12/13 Untersuchungen und Beobachtungen zu grundlegenden Anforderungen an Lebewesen",
      },
      {
        id: "lb7",
        label: "BcP12/13 Ökologische Untersuchungen",
      },
    ],
    "gymnasium|13|chemie|grundlegend": [
      {
        id: "lb1",
        label: "C13 Wie Chemikerinnen und Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C13 Farbigkeit",
        hours: 7,
      },
      {
        id: "lb3",
        label:
          "C13 Säure-Base-Gleichgewichte – Quantitative Analytik und deren Anwendung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "C13 Natürliche und synthetische Makromoleküle",
        hours: 32,
      },
      {
        id: "lb5",
        label: "C13 Chemie und Nachhaltigkeit",
        hours: 10,
      },
    ],
    "gymnasium|13|chemie|erhoeht": [
      {
        id: "lb1",
        label: "C13 Wie Chemikerinnen und Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "C13 Farbigkeit und Farbstoffe",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "C13 Säure-Base-Gleichgewichte – Quantitative Analytik und deren Anwendung",
        hours: 20,
      },
      {
        id: "lb4",
        label: "C13 Natürliche und synthetische Makromoleküle",
        hours: 41,
      },
      {
        id: "lb5",
        label: "C13 Energie und Nachhaltigkeit",
        hours: 24,
      },
    ],
    "gymnasium|13|chi|grundlegend-3": [
      {
        id: "lb1",
        label: "Chi12/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi12/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi12/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi12/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi12/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|chi|grundlegend-spaet": [
      {
        id: "lb1",
        label: "Chi13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Chi13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Chi13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Chi13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Chi13 5 Themengebiete",
      },
    ],
    "gymnasium|13|deutsch": [
      {
        id: "lb1",
        label: "/13 Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "/13 Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "/13 Schreiben",
      },
      {
        id: "lb4",
        label: "/13 Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "gymnasium|13|englisch|grundlegend": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|englisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|ethik|grundlegend": [
      {
        id: "lb1",
        label: "Recht und Gerechtigkeit",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Sinnorientierung und Lebensgestaltung",
        hours: 18,
      },
    ],
    "gymnasium|13|ethik|erhoeht": [
      {
        id: "lb1",
        label: "Recht und Gerechtigkeit",
        hours: 48,
      },
      {
        id: "lb2",
        label: "Sinnorientierung und Lebensgestaltung",
        hours: 36,
      },
    ],
    "gymnasium|13|evangelische-religionslehre|grundlegend": [
      {
        id: "lb1",
        label: "Die Frage nach dem guten Leben und richtigen Handeln",
        hours: 18,
      },
      {
        id: "lb2",
        label:
          "Konkret und komplex – differenzierte Perspektiven auf ethische Problemstellungen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Schon und noch nicht – christliche Hoffnungsbilder",
        hours: 14,
      },
    ],
    "gymnasium|13|evangelische-religionslehre|erhoeht": [
      {
        id: "lb1",
        label: "Die Frage nach dem guten Leben und richtigen Handeln",
        hours: 30,
      },
      {
        id: "lb2",
        label:
          "Konkret und komplex – differenzierte Perspektiven auf ethische Problemstellungen",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Schon und noch nicht – christliche Hoffnungsbilder",
        hours: 28,
      },
    ],
    "gymnasium|13|franzoesisch|grundlegend-1-2-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|franzoesisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|13|franzoesisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|geographie|grundlegend": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken für Jahrgangsstufe 12 und 13",
      },
      {
        id: "lb2",
        label: "Wirtschaftliche Entwicklungen in einer globalisierten Welt",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Ressourcen und nachhaltige Entwicklung",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Bevölkerung und Migration",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Stadtentwicklung und urbane Räume",
        hours: 8,
      },
    ],
    "gymnasium|13|geographie|erhoeht": [
      {
        id: "lb1",
        label: "Geographische Arbeitstechniken für Jahrgangsstufe 12 und 13",
      },
      {
        id: "lb2",
        label: "Wirtschaftliche Entwicklungen in einer globalisierten Welt",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ressourcen und nachhaltige Entwicklung",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Bevölkerung und Migration",
        hours: 22,
      },
      {
        id: "lb5",
        label: "Stadtentwicklung und urbane Räume",
        hours: 20,
      },
    ],
    "gymnasium|13|geol": [
      {
        id: "lb1",
        label: "Geol13 Geologische Arbeitstechniken für Jahrgangsstufe 13",
      },
      {
        id: "lb2",
        label: "Geol13 Das System Erde: Grundlagen der Geologie",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Geol13 Das endogene System: Geologische Prozesse im Erdinneren",
        hours: 6,
      },
      {
        id: "lb4",
        label: "Geol13 Das exogene System: Dynamik an der Erdoberfläche",
        hours: 4,
      },
      {
        id: "lb5",
        label: "Geol13 Das System Erde: Geologie und Klima",
        hours: 6,
      },
      {
        id: "lb6",
        label:
          "Geol13 Landschaftsentwicklung in Bayern an einem ausgewählten Raumbeispiel",
        hours: 6,
      },
      {
        id: "lb7",
        label: "Geol13 Mensch-Umwelt-System im geologischen Umfeld",
        hours: 6,
      },
      {
        id: "lb8",
        label: "Geol13 Geologische Exkursion",
      },
    ],
    "gymnasium|13|geschichte|grundlegend": [
      {
        id: "lb1",
        label: "1 Akteure internationaler Politik in historischer Perspektive",
        hours: 24,
      },
      {
        id: "lb2",
        label:
          "2 Historische Grundlagen moderner politischer Ordnungsformen und Identifikationsmuster in Europa",
        hours: 18,
      },
    ],
    "gymnasium|13|geschichte|erhoeht": [
      {
        id: "lb1",
        label: "1 Akteure internationaler Politik in historischer Perspektive",
        hours: 48,
      },
      {
        id: "lb2",
        label:
          "2 Historische Grundlagen moderner politischer Ordnungsformen und Identifikationsmuster in Europa",
        hours: 36,
      },
    ],
    "gymnasium|13|griechisch|grundlegend": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|13|griechisch|erhoeht": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|13|informatik|grundlegend": [
      {
        id: "lb1",
        label: "Formale Sprachen und Automaten",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Funktionsweise eines Rechners",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Grenzen der Berechenbarkeit",
        hours: 13,
      },
      {
        id: "lb4",
        label: "Künstliche Intelligenz",
        hours: 18,
      },
    ],
    "gymnasium|13|informatik|erhoeht": [
      {
        id: "lb1",
        label: "Internet der Dinge",
        hours: 15,
      },
      {
        id: "lb2",
        label: "Künstliche Intelligenz",
        hours: 34,
      },
      {
        id: "lb3",
        label: "Formale Sprachen und Automaten",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Algorithmen, Komplexität und Berechenbarkeit",
        hours: 32,
      },
    ],
    "gymnasium|13|instrumentalensemble": [
      {
        id: "lb1",
        label: "InE12/13 Musikstücke und ihre Hintergründe",
      },
      {
        id: "lb2",
        label:
          "InE12/13 Leitung von Instrumentalensembles der klassischen Musik und der konzertanten Blasmusik",
      },
      {
        id: "lb3",
        label:
          "InE12/13 Aspekte der Arbeit mit Instrumentalensembles der klassischen Musik und der konzertanten Blasmusik",
      },
      {
        id: "lb4",
        label:
          "InE12/13 Leitung von Ensembles in den Bereichen Jazz, Pop, Rock",
      },
      {
        id: "lb5",
        label:
          "InE12/13 Aspekte der Arbeit mit Ensembles in den Bereichen Jazz, Pop, Rock",
      },
      {
        id: "lb6",
        label: "InE12/13 Leitung von Volksmusikensembles",
      },
      {
        id: "lb7",
        label: "InE12/13 Aspekte der Arbeit mit Volksmusikensembles",
      },
    ],
    "gymnasium|13|ir|grundlegend": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus – Ethik der Feiertage: jüdisches Menschenbild und jüdische Gottesidee II (Rosch haSchana und Jom Kippur)",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus",
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt – jüdische Identität, Vielfalt, Familie im Judentum",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie – Umbrüche in der jüdischen Geschichte und Philosophie der Neuzeit",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Schriftliche Quellen – Werte: Anfang der Welt und der Menschheit",
        hours: 10,
      },
    ],
    "gymnasium|13|ir|erhoeht": [
      {
        id: "lb1",
        label:
          "Jüdischer Kalender und Jahreszyklus – Ethik der Feiertage: jüdisches Menschenbild und jüdische Gottesidee II (Rosch haSchana und Jom Kippur)",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Gebet und Ritus",
      },
      {
        id: "lb3",
        label:
          "Mensch und Welt – jüdische Identität, Vielfalt, Familie im Judentum",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Jüdische Geschichte und Philosophie – Umbrüche in der jüdischen Geschichte und Philosophie der Neuzeit",
        hours: 20,
      },
      {
        id: "lb5",
        label:
          "Schriftliche Quellen – Werte: Anfang der Welt und der Menschheit – Tikwa",
        hours: 20,
      },
    ],
    "gymnasium|13|italienisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|italienisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|13|italienisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|katholische-religionslehre|grundlegend": [
      {
        id: "lb1",
        label:
          "1 Grundfragen des Menschen im Horizont des Glaubens: Sozialität",
        hours: 24,
      },
      {
        id: "lb2",
        label: "2 Existentielle Fragen und christliche Antwortangebote",
        hours: 18,
      },
    ],
    "gymnasium|13|katholische-religionslehre|erhoeht": [
      {
        id: "lb1",
        label:
          "1 Grundfragen des Menschen im Horizont des Glaubens: Sozialität",
        hours: 48,
      },
      {
        id: "lb2",
        label: "2 Existentielle Fragen und christliche Antwortangebote",
        hours: 36,
      },
    ],
    "gymnasium|13|kunst|grundlegend": [
      {
        id: "lb1",
        label: "Körper",
      },
      {
        id: "lb2",
        label: "Interaktion und Transformation",
      },
    ],
    "gymnasium|13|kunst|erhoeht": [
      {
        id: "lb1",
        label: "Körper",
      },
      {
        id: "lb2",
        label: "Interaktion und Transformation",
      },
    ],
    "gymnasium|13|latein|grundlegend": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|13|latein|erhoeht": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "gymnasium|13|mathematik": [
      {
        id: "lb1",
        label: "1 Flächeninhalt und bestimmtes Integral",
        hours: 26,
      },
      {
        id: "lb2",
        label: "2 Normalverteilung",
        hours: 14,
      },
      {
        id: "lb3",
        label: "3 Geraden und Ebenen im Raum",
        hours: 24,
      },
      {
        id: "lb4",
        label: "4 Anwendungen der Differential- und Integralrechnung",
        hours: 20,
      },
    ],
    "gymnasium|13|musik|grundlegend": [
      {
        id: "lb1",
        label: "Entwicklungen abendländischer Instrumentalmusik (13/1)",
      },
      {
        id: "lb2",
        label: "Ausgewählte Musik seit Beginn des 20. Jahrhunderts (13/2)",
      },
    ],
    "gymnasium|13|musik|erhoeht": [
      {
        id: "lb1",
        label: "Entwicklungen abendländischer Instrumentalmusik (13/1)",
      },
      {
        id: "lb2",
        label: "Ausgewählte Musik seit Beginn des 20. Jahrhunderts (13/2)",
      },
    ],
    "gymnasium|13|or|grundlegend": [
      {
        id: "lb1",
        label: "Kirchenstruktur und eucharistische Gemeinschaft",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Konziliarität",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Trinitätstheologie",
        hours: 11,
      },
      {
        id: "lb4",
        label: "Christologie",
        hours: 11,
      },
    ],
    "gymnasium|13|or|erhoeht": [
      {
        id: "lb1",
        label: "Kirchenstruktur und eucharistische Gemeinschaft",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Konziliarität",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Trinitätstheologie",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Christologie",
        hours: 22,
      },
    ],
    "gymnasium|13|physik|grundlegend": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Grundideen der Quantenphysik",
        hours: 15,
      },
      {
        id: "lb3",
        label: "Ein Atommodell der Quantenphysik",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Strukturuntersuchungen zum Aufbau der Materie",
        hours: 7,
      },
      {
        id: "lb5",
        label: "Kernphysik",
        hours: 25,
      },
    ],
    "gymnasium|13|physik|grundlegend-astro": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Orientierung am Himmel",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Das Sonnensystem",
        hours: 11,
      },
      {
        id: "lb4",
        label: "Die Sonne",
        hours: 15,
      },
      {
        id: "lb5",
        label: "Sterne",
        hours: 19,
      },
      {
        id: "lb6",
        label: "Großstrukturen im Weltall",
        hours: 12,
      },
    ],
    "gymnasium|13|physik|erhoeht": [
      {
        id: "lb1",
        label:
          "Bildungsstandards, Lehrplanalternativen und Anforderungsniveaus",
      },
      {
        id: "lb2",
        label: "Grundideen der Quantenphysik",
        hours: 27,
      },
      {
        id: "lb3",
        label: "Ein Atommodell der Quantenphysik",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Strukturuntersuchungen zum Aufbau der Materie",
        hours: 9,
      },
      {
        id: "lb5",
        label: "Kernphysik",
        hours: 33,
      },
      {
        id: "lb6",
        label: "Experimentelles Arbeiten",
        hours: 14,
      },
    ],
    "gymnasium|13|pug|grundlegend": [
      {
        id: "lb1",
        label:
          "PuG13 Modernisierungsprozesse und ihre Auswirkungen auf das Zusammenleben in Deutschland reflektieren",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "PuG13 Formen sowie Auswirkungen sozialer Ungleichheit und sozialer Mobilität reflektieren",
        hours: 6,
      },
      {
        id: "lb3",
        label:
          "PuG13 Die Bedeutung des Sozialstaats vor dem Hintergrund aktueller Herausforderungen erkennen",
        hours: 6,
      },
      {
        id: "lb4",
        label:
          "PuG13 Internationale Konfliktbearbeitung vor dem Hintergrund des Völkerrechts reflektieren",
        hours: 18,
      },
    ],
    "gymnasium|13|pug|erhoeht": [
      {
        id: "lb1",
        label:
          "PuG13 Soziologische Theorien als Erklärungsansätze für die moderne Gesellschaft nachvollziehen und für die eigene Lebenswelt reflektieren",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "PuG13 Modernisierungsprozesse und ihre Auswirkungen auf das Zusammenleben in Deutschland reflektieren",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "PuG13 Formen sowie Auswirkungen sozialer Ungleichheit und sozialer Mobilität reflektieren",
        hours: 6,
      },
      {
        id: "lb4",
        label:
          "PuG13 Die Bedeutung des Sozialstaats vor dem Hintergrund aktueller Herausforderungen erkennen",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "PuG13 Internationale Konfliktbearbeitung vor dem Hintergrund des Völkerrechts reflektieren",
        hours: 36,
      },
    ],
    "gymnasium|13|pln": [
      {
        id: "lb1",
        label: "Pol13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Pol13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Pol13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Pol13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Pol13 5 Themengebiete",
      },
    ],
    "gymnasium|13|ps": [
      {
        id: "lb1",
        label: "Ps12/13 1 Basismodul „Psychologie als Wissenschaft“",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Ps12/13 2 Basismodul „Allgemeine Psychologie“",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Ps12/13 3 Modul „Entwicklungspsychologie“",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Ps12/13 4 Modul „Lernpsychologie“",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Ps12/13 5 Modul „Persönlichkeitspsychologie“",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Ps12/13 6 Modul „Sozialpsychologie“",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Ps12/13 7 Modul „Kommunikationspsychologie“",
        hours: 14,
      },
    ],
    "gymnasium|13|russisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|russisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|13|russisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|sozialwissenschaftl-arbeitsfelder": [
      {
        id: "lb1",
        label:
          "SwA13 1 Ansätze zum Zeitmanagement und zum nachhaltigen Handeln analysieren und für die eigene Lebensgestaltung nutzen",
        hours: 14,
      },
      {
        id: "lb2",
        label:
          "SwA13 2 Chancen und Herausforderungen soziokultureller Heterogenität für Staat und Gesellschaft untersuchen",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "SwA13 3 Für Interkulturalität als zentralen Wert in einer globalen Gesellschaft eintreten",
        hours: 8,
      },
      {
        id: "lb4",
        label: "SwA13 4 Soziale Auswirkungen der Globalisierung reflektieren",
        hours: 10,
      },
    ],
    "gymnasium|13|spanisch|grundlegend-3": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|spanisch|grundlegend-spaet": [
      {
        id: "lb1",
        label: "1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "5 Themengebiete",
      },
    ],
    "gymnasium|13|spanisch|erhoeht": [
      {
        id: "lb1",
        label: "/13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "/13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "/13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "/13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "/13 5 Themengebiete",
      },
    ],
    "gymnasium|13|sport|basissport": [
      {
        id: "lb1",
        label: "/13 Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "/13 Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "/13 Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "/13 Sportliche Handlungsfelder",
      },
    ],
    "gymnasium|13|sport|sporttheorie": [
      {
        id: "lb1",
        label: "/13 Trainingslehre",
      },
      {
        id: "lb2",
        label: "/13 Bewegungslehre",
      },
      {
        id: "lb3",
        label: "/13 Sport und Gesundheit",
      },
      {
        id: "lb4",
        label:
          "/13 Psychologische, soziale und gesellschaftspolitische Aspekte des Sports",
      },
    ],
    "gymnasium|13|sug": [
      {
        id: "lb1",
        label: "SuG12/13",
      },
    ],
    "gymnasium|13|stb": [
      {
        id: "lb1",
        label: "STB12/13",
      },
    ],
    "gymnasium|13|tuf": [
      {
        id: "lb1",
        label: "TuF12/13 1 Theater und Film erschließen",
      },
      {
        id: "lb2",
        label: "TuF12/13 2 Theater und Film gestalten",
      },
      {
        id: "lb3",
        label: "TuF12/13 3 Theater und Film reflektieren",
      },
      {
        id: "lb4",
        label: "TuF12/13 4 An Theater und Film teilhaben",
      },
    ],
    "gymnasium|13|tsh": [
      {
        id: "lb1",
        label: "Tsh13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tsh13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tsh13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tsh13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tsh13 5 Themengebiete",
      },
    ],
    "gymnasium|13|tr": [
      {
        id: "lb1",
        label: "Tr13 1 Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Tr13 2 Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Tr13 3 Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Tr13 4 Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Tr13 5 Themengebiete",
      },
    ],
    "gymnasium|13|vokalensemble": [
      {
        id: "lb1",
        label: "Vok12/13 Musikstücke und ihre Hintergründe",
      },
      {
        id: "lb2",
        label: "Vok12/13 Stimmphysiologische Grundlagen",
      },
      {
        id: "lb3",
        label: "Vok12/13 Probenarbeit",
      },
      {
        id: "lb4",
        label: "Vok12/13 Leitung eines Vokalensembles",
      },
      {
        id: "lb5",
        label: "Vok12/13 Bühnenpräsenz",
      },
    ],
    "gymnasium|13|wirtschaft-und-recht|grundlegend": [
      {
        id: "lb1",
        label: "Recht",
        hours: 24,
      },
      {
        id: "lb2",
        label: "VWL",
        hours: 18,
      },
    ],
    "gymnasium|13|wirtschaft-und-recht|erhoeht": [
      {
        id: "lb1",
        label: "Recht",
        hours: 48,
      },
      {
        id: "lb2",
        label: "VWL",
        hours: 36,
      },
    ],
    "gymnasium|13|wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "WIn12/13 Verwaltung großer Datenmengen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "WIn12/13 Verteilte Informationssysteme",
        hours: 10,
      },
      {
        id: "lb3",
        label: "WIn12/13 Digitale Transformation und digitale Disruption",
        hours: 14,
      },
      {
        id: "lb4",
        label: "WIn12/13 Projekt",
        hours: 14,
      },
      {
        id: "lb5",
        label: "WIn12/13 Datenintegration mit ERP-Systemen",
        hours: 28,
      },
      {
        id: "lb6",
        label: "WIn12/13 IT-Sicherheit und Kryptologie",
        hours: 14,
      },
    ],
    "gymnasium|13|w-seminar": [
      {
        id: "lb1",
        label: "WSem12/13",
      },
    ],
    "bos|10|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren, Kennzahlen berechnen und betriebliche Zielsetzungen abgrenzen",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Typische Aufgaben im Personalbereich planen und organisieren",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Mithilfe des externen Rechnungswesens Bilanz und GuV erläutern",
        hours: 30,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und Maschinenkosten ermitteln",
        hours: 30,
      },
      {
        id: "lb5",
        label: "Ein Unternehmen erkunden",
        hours: 20,
      },
    ],
    "bos|10|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Formenvielfalt des Lebens",
      },
      {
        id: "lb3",
        label: "Mikroorganismen und Viren",
      },
      {
        id: "lb4",
        label: "Humanbiologie",
      },
      {
        id: "lb5",
        label: "Menschliche Sexualität",
      },
    ],
    "bos|10|biologie|s-gh": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Organisationsstufen des Lebens",
      },
      {
        id: "lb3",
        label: "Weitergabe genetischer Information",
      },
      {
        id: "lb4",
        label: "Systematik der Lebewesen",
      },
      {
        id: "lb5",
        label: "Gesunde Lebensführung",
      },
      {
        id: "lb6",
        label: "Stammesgeschichtliche Entwicklung des Menschen",
      },
    ],
    "bos|10|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen überprüfen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Material beschaffen sowie Fertigungsverfahren festlegen",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "Personalbedarf planen, Personal beschaffen, einsetzen und beurteilen",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Geschäftsbuchführung das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 35,
      },
      {
        id: "lb5",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 28,
      },
      {
        id: "lb6",
        label: "Ein Unternehmensplanspiel durchführen",
        hours: 11,
      },
    ],
    "bos|10|chemie": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Reinstoffe und Stoffgemische",
      },
      {
        id: "lb3",
        label: "Atombau und Periodensystem",
      },
      {
        id: "lb4",
        label: "Formeln und Reaktionsgleichungen",
      },
      {
        id: "lb5",
        label: "Chemische Bindungen",
      },
      {
        id: "lb6",
        label: "Energetik",
      },
    ],
    "bos|10|deutsch|vorklasse": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "bos|10|deutsch|vorklasse_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "bos|10|deutsch|vorkurs": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "bos|10|deutsch|vorkurs_guelitg_ab_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "bos|10|englisch|vorklasse": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|10|englisch|vorkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|10|ethik": [
      {
        id: "lb1",
        label: "Einführung in die Grundbegriffe der Ethik",
      },
      {
        id: "lb2",
        label: "Verantwortung und Gewissen",
      },
      {
        id: "lb3",
        label: "Angewandte Ethik",
      },
    ],
    "bos|10|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Bibel im Dialog",
      },
      {
        id: "lb2",
        label: "Glaube in der Welt",
      },
      {
        id: "lb3",
        label: "Im Netz",
      },
      {
        id: "lb4",
        label: "Lebenszeiten",
      },
    ],
    "bos|10|gpug-fosbos": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label: "Teilhabe: Gestaltung der eigenen Lebenswirklichkeit (optional)",
        hours: 28,
      },
      {
        id: "lb3",
        label:
          "Freiheitlich demokratische Rechte und Werte als Fundament der Lebenswirklichkeit in Deutschland (optional)",
        hours: 28,
      },
      {
        id: "lb4",
        label:
          "Weimarer Republik: Lebenswirklichkeiten in der ersten deutschen Demokratie (optional)",
        hours: 28,
      },
      {
        id: "lb5",
        label: "Lebenswirklichkeiten im Nationalsozialismus (optional)",
        hours: 28,
      },
    ],
    "bos|10|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Gesundheit multifaktoriell begreifen (optional)",
      },
      {
        id: "lb3",
        label: "Sich im Gesundheitswesen orientieren (optional)",
      },
      {
        id: "lb4",
        label:
          "Die Komplexität des menschlichen Organismus darstellen (optional)",
      },
      {
        id: "lb5",
        label: "Geschichte der Medizin und Pflege (optional)",
      },
    ],
    "bos|10|gw|aktuell_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label:
          "Aufbau und Funktion des menschlichen Körpers sowie Auswirkungen von Krankheitsbildern erfassen (optional)",
      },
      {
        id: "lb3",
        label:
          "Strukturen und Herausforderungen des Gesundheitswesens kennenlernen (optional)",
      },
      {
        id: "lb4",
        label:
          "Sich auf das Praktikum im Gesundheitswesen vorbereiten (optional)",
      },
      {
        id: "lb5",
        label: "Berufliche Erfahrungen einbringen (optional)",
      },
    ],
    "bos|10|ibv|ibv": [
      {
        id: "lb1",
        label: "Ein Unternehmen international ausrichten",
        hours: 15,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 28,
      },
      {
        id: "lb3",
        label:
          "Mithilfe der Geschäftsbuchführung das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 33,
      },
      {
        id: "lb4",
        label:
          "Grundprobleme einer Volkswirtschaft identifizieren und wirtschaftliche Prozesse mikroökonomisch analysieren und beurteilen",
        hours: 21,
      },
      {
        id: "lb5",
        label:
          "Ziele der Wirtschaftspolitik bestimmen und das Inlandsprodukt als Wohlstandsindikator analysieren",
        hours: 16,
      },
      {
        id: "lb6",
        label:
          "Ein Unternehmensplanspiel für ein internationales Unternehmen durchführen (optional)",
        hours: 11,
      },
      {
        id: "lb7",
        label:
          "Eine Fallstudie für ein internationales Unternehmen durchführen (optional)",
        hours: 11,
      },
    ],
    "bos|10|ibv|ibv_gueltig_ab_26_27": [
      {
        id: "lb1",
        label:
          "Unternehmerisch denken, sich im Unternehmen orientieren und Ziele formulieren",
        hours: 30,
      },
      {
        id: "lb2",
        label:
          "Den Erfolg betrieblichen Handelns mithilfe der Teilkostenrechnung analysieren",
        hours: 30,
      },
      {
        id: "lb3",
        label:
          "Ziele und Verhaltensweisen von Wirtschaftsakteuren erklären und deren Zusammenwirken bei der Preisbildung im vollkommenen Markt analysieren",
        hours: 32,
      },
      {
        id: "lb4",
        label:
          "Konsumentscheidungen aus verhaltensökonomischer Perspektive verstehen und optimieren",
        hours: 20,
      },
    ],
    "bos|10|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Freiheit und Menschenwürde – Identität als Aufgabe christlicher Lebensgestaltung",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gewissen und Verantwortung – Menschen in Entscheidungssituationen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Gott und Mensch – Jesus Christus in Tradition und Gegenwart",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Symbole und Sakramente – Ausdruck einer tieferen Wirklichkeit",
        hours: 10,
      },
    ],
    "bos|10|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
      {
        id: "lb8",
        label: "Arbeiten und Lernen mit KI − unplugged (optional)",
      },
    ],
    "bos|10|mathematik|vorklasse": [
      {
        id: "lb1",
        label: "Aussagenlogik, Mengenlehre mit Zahlenmengen, Rechenregeln",
        hours: 50,
      },
      {
        id: "lb2",
        label: "Gleichungen und lineare Ungleichungen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Lineare und quadratische Funktionen",
        hours: 60,
      },
      {
        id: "lb4",
        label: "Lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb5",
        label: "Dreieckslehre",
        hours: 13,
      },
      {
        id: "lb6",
        label: "Berechnungen von Längen, Flächeninhalten und Volumina",
        hours: 25,
      },
      {
        id: "lb7",
        label: "Daten und Zufall, Wahrscheinlichkeit",
        hours: 18,
      },
      {
        id: "lb8",
        label: "Exponentialfunktion und Logarithmus",
        hours: 18,
      },
    ],
    "bos|10|mathematik|vorkurs": [
      {
        id: "lb1",
        label: "Rechenregeln",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Gleichungen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Lineare und quadratische Funktionen",
        hours: 30,
      },
    ],
    "bos|10|nt-bo": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
    ],
    "bos|10|paedagigik-psychologie": [
      {
        id: "lb1",
        label: "Selbstmanagementstrategien effektiv nutzen",
      },
      {
        id: "lb2",
        label:
          "Ressourcenorientiert arbeiten in sozialpädagogischen Handlungsfeldern",
      },
      {
        id: "lb3",
        label: "Emotional belastende Situationen bewältigen",
      },
      {
        id: "lb4",
        label: "Wertschätzend und konfliktlösend kommunizieren",
      },
    ],
    "bos|10|physik": [
      {
        id: "lb1",
        label: "Grundlagen der Mechanik I",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Grundlagen der Mechanik II",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Grundlagen der Elektrizitätslehre",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Grundlagen der Wärmelehre",
        hours: 28,
      },
      {
        id: "lb5",
        label: "Grundlagen der Optik",
        hours: 28,
      },
    ],
    "bos|10|technologie": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
    ],
    "bos|12|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen analysieren",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Material beschaffen",
        hours: 18,
      },
      {
        id: "lb3",
        label:
          "Jahresabschlussarbeiten durchführen und das Gesamtergebnis eines Unternehmens ermitteln",
        hours: 42,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise ermitteln, Maschinenkosten berechnen und Abweichungen analysieren",
        hours: 24,
      },
      {
        id: "lb5",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 26,
      },
      {
        id: "lb6",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 24,
      },
      {
        id: "lb7",
        label:
          "Personal sach- und personenorientiert führen und zukunftsorientiert entwickeln",
        hours: 24,
      },
    ],
    "bos|12|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Grundlagen der Evolution",
        hours: 5,
      },
      {
        id: "lb3",
        label: "Ökologie",
        hours: 32,
      },
      {
        id: "lb4",
        label: "Cytologie",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Genetik",
        hours: 50,
      },
      {
        id: "lb6",
        label: "Mikrobiologie",
        hours: 9,
      },
      {
        id: "lb7",
        label: "Immunologie",
        hours: 10,
      },
      {
        id: "lb8",
        label: "Physiologie",
        hours: 52,
      },
    ],
    "bos|12|biologie|g": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Zellbiologische Grundlagen",
        hours: 9,
      },
      {
        id: "lb3",
        label: "Genetik",
        hours: 27,
      },
      {
        id: "lb4",
        label: "Stoffwechsel",
        hours: 23,
      },
      {
        id: "lb5",
        label: "Evolution",
        hours: 25,
      },
    ],
    "bos|12|biologie|s": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Zellbiologische Grundlagen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Genetik des Menschen",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Der Mensch als Evolutionsfaktor",
        hours: 14,
      },
    ],
    "bos|12|biologie|wahl-t-w-iw": [
      {
        id: "lb1",
        label: "Biologie des Alltags (optional)",
      },
      {
        id: "lb2",
        label: "Bionik (optional)",
      },
      {
        id: "lb3",
        label: "Evolution (optional)",
      },
      {
        id: "lb4",
        label: "Genetik/Gentechnik (optional)",
      },
      {
        id: "lb5",
        label: "Immunologie (optional)",
      },
      {
        id: "lb6",
        label: "Sinnesphysiologie (optional)",
      },
      {
        id: "lb7",
        label: "Stoffkreisläufe und Bioökonomie (optional)",
      },
    ],
    "bos|12|biotechnologie": [
      {
        id: "lb1",
        label: "Grundlagen naturwissenschaftlichen Experimentierens",
      },
      {
        id: "lb2",
        label: "Mikrobiologische Nachweismethoden (optional)",
      },
      {
        id: "lb3",
        label:
          "Biotechnologie der Nahrungs- und Genussmittelproduktion (optional)",
      },
      {
        id: "lb4",
        label: "Pflanzenproduktion und Energiegewinnung (optional)",
      },
      {
        id: "lb5",
        label: "Nanobiotechnologie (optional)",
      },
    ],
    "bos|12|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen überprüfen",
        hours: 4,
      },
      {
        id: "lb2",
        label: "Material beschaffen sowie Fertigungsverfahren festlegen",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Personal beschaffen und einsetzen",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 24,
      },
      {
        id: "lb5",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 28,
      },
      {
        id: "lb6",
        label: "Marketingprozesse planen und steuern",
        hours: 20,
      },
      {
        id: "lb7",
        label:
          "Jahresabschlussarbeiten durchführen und das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 48,
      },
      {
        id: "lb8",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 24,
      },
    ],
    "bos|12|chemie|abu": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Säure-Base-Reaktionen",
        hours: 16,
      },
      {
        id: "lb6",
        label:
          "Funktionelle Gruppen und Reaktionsmechanismen der organischen Chemie",
        hours: 18,
      },
      {
        id: "lb7",
        label: "Reaktionsgeschwindigkeit und chemisches Gleichgewicht",
        hours: 16,
      },
    ],
    "bos|12|chemie|gh": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Säure-Base-Reaktionen",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Grundlagen der organischen Chemie",
        hours: 12,
      },
    ],
    "bos|12|chemie|t": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Säure-Base-Reaktionen",
        hours: 14,
      },
      {
        id: "lb6",
        label:
          "Funktionelle Gruppen und Reaktionsmechanismen der organischen Chemie",
        hours: 12,
      },
    ],
    "bos|12|ebc": [
      {
        id: "lb1",
        label: "Reading, Understanding and Interpreting Literature – a Toolbox",
      },
      {
        id: "lb2",
        label: "Topics and Issues",
      },
    ],
    "bos|12|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|ethik": [
      {
        id: "lb1",
        label: "Moral und Ethik",
      },
      {
        id: "lb2",
        label: "Angewandte Ethik",
      },
      {
        id: "lb3",
        label: "Glück und Sinnerfüllung",
      },
    ],
    "bos|12|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Gott in Beziehung",
      },
      {
        id: "lb2",
        label: "Mensch, du bist wer",
      },
      {
        id: "lb3",
        label: "Lebenswert",
      },
      {
        id: "lb4",
        label: "Global gerecht",
      },
      {
        id: "lb5",
        label: "Religion vielfältig",
      },
    ],
    "bos|12|franzoesisch|franzoesisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|franzoesisch|franzoesisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|franzoesisch|franzoesisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|franzoesisch|franzoesisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|gpug-fosbos": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label:
          "Historische und aktuelle Lebenswirklichkeiten: Stehen wir am Beginn einer neuen Epoche?",
        hours: 6,
      },
      {
        id: "lb3",
        label:
          "Einflüsse auf die Lebenswirklichkeit: Ideen und Ideologien des kurzen 20. Jahrhunderts im globalen Wettstreit",
        hours: 13,
      },
      {
        id: "lb4",
        label:
          "Historische Lebenswirklichkeiten in Deutschland: Deutsche Geschichte seit dem Ende des Zweiten Weltkriegs",
        hours: 18,
      },
      {
        id: "lb5",
        label:
          "Die Auseinandersetzung mit historischen Lebenswirklichkeiten: Der Umgang mit Diktaturen in Deutschland",
        hours: 13,
      },
      {
        id: "lb6",
        label: "Gesellschaftliche Lebenswirklichkeiten des Einzelnen",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Einflussfaktoren auf die Lebenswirklichkeit",
      },
      {
        id: "lb8",
        label:
          "Aktuelle internationale Herausforderungen und deren Einfluss auf die Lebenswirklichkeiten in Staat und Gesellschaft",
        hours: 16,
      },
    ],
    "bos|12|gwr": [
      {
        id: "lb1",
        label: "Ein Unternehmen im Gesundheitswesen strategisch ausrichten",
        hours: 19,
      },
      {
        id: "lb2",
        label:
          "Liquide Mittel für ein Unternehmen im Gesundheitswesen beschaffen",
        hours: 19,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines Unternehmens im Gesundheitswesen analysieren",
        hours: 19,
      },
      {
        id: "lb4",
        label:
          "Für ein Unternehmen im Gesundheitswesen Personal einsetzen und führen",
        hours: 19,
      },
      {
        id: "lb5",
        label: "Dienstleistungen des Gesundheitswesens vermarkten",
        hours: 19,
      },
      {
        id: "lb6",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Als Marktteilnehmer agieren",
        hours: 26,
      },
    ],
    "bos|12|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Gesundheit multifaktoriell begreifen",
      },
      {
        id: "lb3",
        label: "Sich im Gesundheitswesen orientieren",
      },
      {
        id: "lb4",
        label: "Infektionen vorbeugen",
      },
      {
        id: "lb5",
        label: "Sich gesundheitsbewusst ernähren",
      },
      {
        id: "lb6",
        label: "Bewegung fördern",
      },
      {
        id: "lb7",
        label:
          "Herz‑Kreislauf‑Erkrankungen vorbeugen und deren Konsequenzen erfassen",
      },
    ],
    "bos|12|ibv|ibv": [
      {
        id: "lb1",
        label: "Ein Unternehmen international ausrichten",
        hours: 8,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Jahresabschlussarbeiten durchführen",
        hours: 43,
      },
      {
        id: "lb5",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 24,
      },
      {
        id: "lb6",
        label:
          "Wirtschaftliche Prozesse mikroökonomisch analysieren und beurteilen",
        hours: 19,
      },
      {
        id: "lb7",
        label: "Ziele der Wirtschaftspolitik analysieren",
        hours: 32,
      },
    ],
    "bos|12|informatik|abu-s-w-gh": [
      {
        id: "lb1",
        label: "Entwicklung relationaler Datenbanken",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Implementierung und Nutzung relationaler Datenbanken",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb5",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Grundlagen der Softwareentwicklung (optional)",
        hours: 24,
      },
      {
        id: "lb9",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "Modellbildung und Simulation (optional)",
        hours: 16,
      },
      {
        id: "lb13",
        label: "Objektorientierte Analyse (optional)",
        hours: 8,
      },
      {
        id: "lb14",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb15",
        label: "ERP-Systeme - Material- und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb16",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "bos|12|informatik|wahl-t-iw": [
      {
        id: "lb1",
        label: "Grundlagen der Softwareentwicklung",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Entwicklung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb3",
        label:
          "Implementierung und Nutzung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb9",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Material- und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb14",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "bos|12|internationale_politik": [
      {
        id: "lb1",
        label:
          "Akteure, Strukturen und Theorien in der internationalen Politik",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Handlungsfelder und Herausforderungen in der internationalen Politik",
        hours: 22,
      },
      {
        id: "lb3",
        label: "Kontroversen in der und über die internationale Politik",
        hours: 22,
      },
    ],
    "bos|12|isb|pflicht-iw": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "bos|12|isb|wahl-abu-t-w-s-gh": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "bos|12|italienisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Religion und Vernunft – Perspektiven für Menschenbild und Weltdeutung",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Lesen und handeln – die Botschaft der Bibel für die Gesellschaft",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Erfahrbar und nah – dem dreieinen Gott begegnen",
        hours: 10,
      },
    ],
    "bos|12|ki": [
      {
        id: "lb1",
        label:
          "Die eigene Wahrnehmung als Voraussetzung für erfolgreiche Kommunikation analysieren und reflektieren",
      },
      {
        id: "lb2",
        label: "Kranken Menschen angemessen begegnen",
      },
      {
        id: "lb3",
        label:
          "Mit Klienten unter Beachtung des Alters und der Lebensphase kommunizieren",
      },
      {
        id: "lb4",
        label: "Im multiprofessionellen Team im Gesundheitswesen arbeiten",
      },
      {
        id: "lb5",
        label: "Konflikte im Team bewältigen",
      },
      {
        id: "lb6",
        label: "Mit Krisen und Trauer umgehen",
      },
    ],
    "bos|12|kuenstliche_intelligenz_informatik_u_technologie|abu": [
      {
        id: "lb1",
        label: "Künstliche Intelligenz und digitale Anwendungen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Grundlagen nachhaltiger Pflanzenproduktion (optional)",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Zukunftsfähige Düngung (optional)",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Nutztierhaltung im Spannungsfeld von Ökonomie, Umweltschutz und Tierwohl (optional)",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Nutztierfütterung – leistungsorientiert und nachhaltig (optional)",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Moderne Werkstoffe (optional)",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Allgemeine Energietechnik (optional)",
        hours: 10,
      },
      {
        id: "lb8",
        label: "Erneuerbare Energien (optional)",
        hours: 10,
      },
      {
        id: "lb9",
        label: "Umwelttechnik (optional)",
        hours: 10,
      },
      {
        id: "lb10",
        label: "Enzyme – Biokatalysatoren in Industrie und Haushalt (optional)",
        hours: 10,
      },
      {
        id: "lb11",
        label:
          "Lebensmittelchemie und -technologie am Beispiel der Produktion eines Lebensmittels (optional)",
        hours: 10,
      },
      {
        id: "lb12",
        label: "Lebensmittelkonservierung (optional)",
        hours: 10,
      },
      {
        id: "lb13",
        label: "Medizinische und pharmakologische Verfahren (optional)",
        hours: 10,
      },
      {
        id: "lb14",
        label: "Bioinformatik – Simulationen (optional)",
        hours: 10,
      },
      {
        id: "lb15",
        label: "Kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "bos|12|kuenstliche_intelligenz_informatik_u_technologie|t": [
      {
        id: "lb1",
        label: "Informatik – Grundlagen der Programmierung",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Künstliche Intelligenz (KI)",
      },
      {
        id: "lb3",
        label: "Thermodynamik",
      },
      {
        id: "lb4",
        label: "Energie",
      },
      {
        id: "lb5",
        label: "Technische Mechanik (optional)",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Elektrotechnik – elektronische Bauelemente (optional)",
        hours: 12,
      },
      {
        id: "lb8",
        label: "Moderne Werkstoffe (optional)",
        hours: 12,
      },
      {
        id: "lb9",
        label: "Kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "bos|12|kuenstliche_intelligenz_u_wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "Systeme der Künstlichen Intelligenz untersuchen",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Informatiksysteme entwickeln",
        hours: 32,
      },
    ],
    "bos|12|kunst": [
      {
        id: "lb1",
        label: "Zeichnen und Malen (optional)",
      },
      {
        id: "lb2",
        label: "Druck und Experiment (optional)",
      },
      {
        id: "lb3",
        label: "Skulptur und Objekt (optional)",
      },
      {
        id: "lb4",
        label: "Film und Inszenierung (optional)",
      },
      {
        id: "lb5",
        label: "Foto und Inszenierung (optional)",
      },
    ],
    "bos|12|latein": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultur",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "bos|12|mathematik|Wahl-abu-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Trigonometrie und trigonometrische Funktionen (verpflichtend)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Lineare Gleichungssysteme (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Vektorrechnung (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Folgen und Reihen (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Gebrochen-rationale Funktionen (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Statistik (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Näherungsverfahren (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Freies Projekt (optional)",
        hours: 14,
      },
    ],
    "bos|12|mathematik|abu-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen",
        hours: 25,
      },
      {
        id: "lb2",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 40,
      },
      {
        id: "lb3",
        label: "Exponentialfunktion und Logarithmus",
        hours: 15,
      },
      {
        id: "lb4",
        label:
          "Kurvendiskussion von Funktionen, die aus Verknüpfung von Exponentialfunktionen mit linearen und quadratischen Funktionen hervorgehen",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Integralrechnung",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Zufallsexperiment und Ereignis",
        hours: 5,
      },
      {
        id: "lb7",
        label: "Relative Häufigkeit und Wahrscheinlichkeit",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Grundlagen der Kombinatorik",
        hours: 4,
      },
      {
        id: "lb9",
        label: "Bernoulli-Ketten",
        hours: 4,
      },
      {
        id: "lb10",
        label: "Zufallsgröße und Wahrscheinlichkeitsverteilung",
        hours: 10,
      },
      {
        id: "lb11",
        label: "Testen von Hypothesen",
        hours: 5,
      },
    ],
    "bos|12|mathematik|t": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen",
        hours: 25,
      },
      {
        id: "lb2",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 44,
      },
      {
        id: "lb3",
        label: "Exponentialfunktion und Logarithmus",
        hours: 13,
      },
      {
        id: "lb4",
        label:
          "Kurvendiskussion von Funktionen, die aus Verknüpfung/Verkettung von Exponentialfunktionen mit linearen und quadratischen Funktionen hervorgehen",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Integralrechnung",
        hours: 8,
      },
      {
        id: "lb6",
        label:
          "Vektoren im IR 2 und IR 3 , lineare Unabhängigkeit und lineare Gleichungssysteme",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Produkte von Vektoren",
        hours: 9,
      },
      {
        id: "lb8",
        label: "Geraden und Ebenen im Raum – Geometrische Anwendungen im IR 3",
        hours: 15,
      },
    ],
    "bos|12|mathematik|wahl-t": [
      {
        id: "lb1",
        label: "Abschnittsweise definierte Funktionen",
        hours: 6,
      },
      {
        id: "lb2",
        label: "Trigonometrische Funktionen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Gebrochen-rationale Funktionen",
        hours: 30,
      },
    ],
    "bos|12|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
      },
    ],
    "bos|12|nt-bo": [
      {
        id: "lb1",
        label: "Physikalische Grundlagen",
      },
      {
        id: "lb2",
        label: "Chemische Grundlagen",
      },
      {
        id: "lb3",
        label: "Werkstoffe und Werkstoffeigenschaften (optional)",
      },
      {
        id: "lb4",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb5",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb7",
        label: "Elektrotechnik-Anwendung (optional)",
      },
      {
        id: "lb8",
        label: "Systeme und Prozesse (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|12|paedagigik-psychologie|s": [
      {
        id: "lb1",
        label:
          "Wesenzüge wissenschaftlicher Pädagogik und Psychologie begreifen",
      },
      {
        id: "lb2",
        label:
          "Grundlagen des Erlebens, Verhaltens und Handelns analysieren, verstehen und anwenden",
      },
      {
        id: "lb3",
        label:
          "Erziehungs- und Bildungsprozesse individuumsbezogen und verantwortlich gestalten",
      },
      {
        id: "lb4",
        label:
          "Lernen als multidimensionalen und steuerbaren Prozess verstehen",
      },
      {
        id: "lb5",
        label:
          "Entwicklung als lebensumfassenden, multifaktoriell beeinflussten Prozess begreifen und pädagogisch gestalten",
      },
      {
        id: "lb6",
        label:
          "Persönlichkeit und Identität beschreiben, erklären und reflektieren",
      },
      {
        id: "lb7",
        label:
          "Aufgaben und Arbeitsfelder Sozialer Arbeit professionell einordnen",
      },
      {
        id: "lb8",
        label:
          "In sozialen Beziehungen empathisch und zielführend kommunizieren und interagieren",
      },
    ],
    "bos|12|physik|abu": [
      {
        id: "lb1",
        label: "Geradlinige Bewegung",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Dynamik, Newton'sche Gesetze",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Kreisbewegung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Energie, Arbeit und Leistung",
        hours: 12,
      },
    ],
    "bos|12|physik|s-w-gh-iw": [
      {
        id: "lb1",
        label: "Grundlagen der Elektrizitätslehre",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Grundlagen der Optik",
        hours: 28,
      },
    ],
    "bos|12|physik|t": [
      {
        id: "lb1",
        label: "Beschreibung von Bewegungen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Dynamik, Newton'sche Gesetze",
        hours: 17,
      },
      {
        id: "lb3",
        label: "Energie und Arbeit",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Kreisbewegung",
        hours: 17,
      },
      {
        id: "lb5",
        label: "Mechanische Schwingungen und Wellen",
        hours: 46,
      },
      {
        id: "lb6",
        label: "Klassische Felder",
        hours: 34,
      },
      {
        id: "lb7",
        label: "Elektromagnetische Induktion",
        hours: 22,
      },
    ],
    "bos|12|russisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|sg": [
      {
        id: "lb1",
        label: "Vom Kinderwunsch bis zur Geburt (optional)",
      },
      {
        id: "lb2",
        label:
          "Humanmedizinische Vertiefung I: Dermatologie und Zahnheilkunde (optional)",
      },
      {
        id: "lb3",
        label: "Pflegewissenschaften (optional)",
      },
      {
        id: "lb4",
        label:
          "Humanmedizinische Vertiefung II: Pharmakologie, Notfallmedizin und Pathologie (optional)",
      },
      {
        id: "lb5",
        label: "Alternative und komplementäre Heilverfahren (optional)",
      },
      {
        id: "lb6",
        label: "Umwelt und Gesundheit (optional)",
      },
    ],
    "bos|12|sozialwirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Ein soziales Unternehmen strategisch ausrichten",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Liquide Mittel für ein soziales Unternehmen beschaffen",
        hours: 17,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines sozialen Unternehmens analysieren",
        hours: 17,
      },
      {
        id: "lb4",
        label:
          "Für ein soziales Unternehmen Personal führen und Arbeitsverträge beenden",
        hours: 18,
      },
      {
        id: "lb5",
        label: "Soziale Dienstleistungen vermarkten",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 10,
      },
    ],
    "bos|12|soziologie|s": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "bos|12|soziologie|wahl-abu-t-w-iw-gh": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "bos|12|spanisch|spanisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|spanisch|spanisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|spanisch|spanisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|spanisch|spanisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|12|studier-und-arbeitstechniken": [
      {
        id: "lb1",
        label: "Arbeits- und Lernprozesse optimieren",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Quellen zur wissenschaftlichen Arbeit nutzen",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Ergebnisse präsentieren",
        hours: 20,
      },
    ],
    "bos|12|technologie|abu": [
      {
        id: "lb1",
        label: "Industrielle Biotechnologie",
      },
      {
        id: "lb2",
        label: "Pflanzenproduktion-Grundlagen",
      },
      {
        id: "lb3",
        label: "Tierproduktion-Grundlagen",
      },
      {
        id: "lb4",
        label: "Werkstoffe und Werkstoffeigenschaften (optional)",
      },
      {
        id: "lb5",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb6",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb7",
        label: "Lebensmittelchemie und -technologie der Milch (optional)",
      },
      {
        id: "lb8",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|12|technologie|t": [
      {
        id: "lb1",
        label: "Thermodynamik-Grundlagen",
      },
      {
        id: "lb2",
        label: "Technische Mechanik",
      },
      {
        id: "lb3",
        label: "Metallische Werkstoffe",
      },
      {
        id: "lb4",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb5",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb7",
        label: "Elektronische Bauelemente (optional)",
      },
      {
        id: "lb8",
        label: "Systeme und Prozesse (optional)",
      },
      {
        id: "lb9",
        label: "Modellbildung-Grundlagen (optional)",
      },
      {
        id: "lb10",
        label: "Verbrennungsmotoren (optional)",
      },
      {
        id: "lb11",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|12|volkswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Grundlagen ökonomischen Denkens und Handelns analysieren und beurteilen",
        hours: 4,
      },
      {
        id: "lb2",
        label:
          "Die Preisbildung bei vollkommenem Wettbewerb analysieren und beurteilen",
        hours: 12,
      },
      {
        id: "lb3",
        label:
          "Die Preisbildung bei unvollkommenem Wettbewerb analysieren und beurteilen",
        hours: 18,
      },
      {
        id: "lb4",
        label:
          "Das Wirtschaftswachstum als volkswirtschaftliche Größe beurteilen",
        hours: 14,
      },
      {
        id: "lb5",
        label:
          "Die Einkommens- und Vermögenspolitik als Steuerungsinstrument analysieren und beurteilen",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Geldpolitische Instrumente und Maßnahmen beurteilen",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Internationale Verflechtungen analysieren und beurteilen",
        hours: 12,
      },
    ],
    "bos|12|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Als Unternehmer Kaufverträge schließen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Arbeitsverträge schließen und Personal führen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Als Staatsbürger agieren",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Als Marktteilnehmer agieren",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sich selbständig machen",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Den Preis für ein Produkt kalkulieren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Den Produktionsprozess steuern",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Ein Marketingkonzept gestalten",
        hours: 14,
      },
    ],
    "bos|12|wirtschaft_aktuell": [
      {
        id: "lb1",
        label: "Ausgewählte Aspekte der Internationalisierung (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Angewandte Entwicklungspolitik (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "Betriebswirtschaftlich Planen, Entscheiden und Kontrollieren (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Gesellschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Wirtschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Märkte im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Innovation und Existenzgründung (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Standortentscheidungen treffen (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Zukunftsorientiertes Personalmanagement (optional)",
        hours: 14,
      },
      {
        id: "lb10",
        label: "Qualitätsmanagement im Betrieb (optional)",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Stakeholder-Konzept (optional)",
        hours: 14,
      },
      {
        id: "lb12",
        label: "Finanzmanagement (optional)",
        hours: 14,
      },
    ],
    "bos|13|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und Finanzierungs- und Investitionsentscheidungen treffen",
        hours: 40,
      },
      {
        id: "lb2",
        label: "Marketingprozesse planen und steuern",
        hours: 25,
      },
      {
        id: "lb3",
        label:
          "Den Faktoreinsatz optimieren, Kosteneinflussgrößen unterscheiden und bei Änderung der Beschäftigung die optimale Anpassungsform in der Produktion ermitteln",
        hours: 40,
      },
      {
        id: "lb4",
        label: "Mithilfe des Controllings ein Unternehmen strategisch steuern",
        hours: 35,
      },
    ],
    "bos|13|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Informations- und Steuerungssysteme",
        hours: 50,
      },
      {
        id: "lb3",
        label: "Evolution",
        hours: 30,
      },
      {
        id: "lb4",
        label: "Angewandte Genetik",
        hours: 30,
      },
      {
        id: "lb5",
        label: "Angewandte Ökologie",
        hours: 30,
      },
    ],
    "bos|13|biologie|g": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Informations- und Steuerungssysteme",
        hours: 52,
      },
      {
        id: "lb3",
        label: "Ökologie",
        hours: 32,
      },
    ],
    "bos|13|biologie|s": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Mechanismen und Belege der Evolution",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Neuro- und Muskelphysiologie",
        hours: 26,
      },
      {
        id: "lb4",
        label: "Immunologie",
        hours: 14,
      },
    ],
    "bos|13|biologie|wahl-t-w-iw": [
      {
        id: "lb1",
        label: "Biologie des Alltags (optional)",
      },
      {
        id: "lb2",
        label: "Bionik (optional)",
      },
      {
        id: "lb3",
        label: "Evolution (optional)",
      },
      {
        id: "lb4",
        label: "Genetik/Gentechnik (optional)",
      },
      {
        id: "lb5",
        label: "Immunologie (optional)",
      },
      {
        id: "lb6",
        label: "Sinnesphysiologie (optional)",
      },
      {
        id: "lb7",
        label: "Stoffkreisläufe und Bioökonomie (optional)",
      },
    ],
    "bos|13|biotechnologie": [
      {
        id: "lb1",
        label: "Grundlagen der Mikroskopier- und Präparationstechniken",
      },
      {
        id: "lb2",
        label: "Medizinische und pharmakologische Verfahren (optional)",
      },
      {
        id: "lb3",
        label: "Gentechnik (optional)",
      },
      {
        id: "lb4",
        label: "Bioinformatik (optional)",
      },
      {
        id: "lb5",
        label: "Aktuelle Entwicklungen in der Biotechnologie (optional)",
      },
    ],
    "bos|13|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und weitere Formen der Finanzierung nutzen",
        hours: 40,
      },
      {
        id: "lb2",
        label:
          "Mithilfe des Controllings das Unternehmen operativ und strategisch steuern",
        hours: 40,
      },
      {
        id: "lb3",
        label:
          "Den Faktoreinsatz optimieren, Kosteneinflussgrößen unterscheiden und bei Änderung der Beschäftigung die optimale Anpassungsform ermitteln",
        hours: 40,
      },
      {
        id: "lb4",
        label:
          "Personal sach- und personenorientiert führen und zukunftsorientiert entwickeln",
        hours: 20,
      },
    ],
    "bos|13|chemie|abu": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Biomoleküle und Tenside",
        hours: 42,
      },
      {
        id: "lb3",
        label: "Polymere",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Stoffe mit delokalisierten Elektronensystemen",
        hours: 22,
      },
    ],
    "bos|13|chemie|t": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Biomoleküle",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Polymere",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Stoffe mit delokalisierten Elektronensystemen",
        hours: 20,
      },
    ],
    "bos|13|ebc": [
      {
        id: "lb1",
        label: "Reading, Understanding and Interpreting Literature – a Toolbox",
      },
      {
        id: "lb2",
        label: "Topics and Issues",
      },
    ],
    "bos|13|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|ethik": [
      {
        id: "lb1",
        label: "Freiheit und Determination",
      },
      {
        id: "lb2",
        label: "Recht und Gerechtigkeit",
      },
      {
        id: "lb3",
        label: "Glaube und Religion",
      },
    ],
    "bos|13|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Fragender Glaube",
      },
      {
        id: "lb2",
        label: "Bedacht entschieden",
      },
      {
        id: "lb3",
        label: "Zukunftswerkstatt",
      },
    ],
    "bos|13|franzoesisch|franzoesisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|franzoesisch|franzoesisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|franzoesisch|franzoesisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|franzoesisch|franzoesisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|gpug-fosbos": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label: "Lebenswirklichkeiten in einer historischen Epoche",
      },
      {
        id: "lb3",
        label: "Lebenswirklichkeiten in der gegenwärtigen Welt",
      },
    ],
    "bos|13|gwr": [
      {
        id: "lb1",
        label: "Ein Unternehmen im Gesundheitswesen strategisch ausrichten",
        hours: 19,
      },
      {
        id: "lb2",
        label:
          "Liquide Mittel für ein Unternehmen im Gesundheitswesen beschaffen",
        hours: 19,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines Unternehmens im Gesundheitswesen analysieren",
        hours: 19,
      },
      {
        id: "lb4",
        label:
          "Für ein Unternehmen im Gesundheitswesen Personal einsetzen und führen",
        hours: 19,
      },
      {
        id: "lb5",
        label: "Dienstleistungen des Gesundheitswesens vermarkten",
        hours: 19,
      },
      {
        id: "lb6",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Als Marktteilnehmer agieren",
        hours: 26,
      },
    ],
    "bos|13|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Die eigenständige Lebensführung von Senioren unterstützen",
      },
      {
        id: "lb3",
        label:
          "Sucht und Depression als gesellschaftliche Herausforderung erfassen",
      },
      {
        id: "lb4",
        label: "Onkologische Erkrankungen in ihrer Komplexität begreifen",
      },
      {
        id: "lb5",
        label: "Entwicklungen im Gesundheitswesen kritisch verfolgen",
      },
    ],
    "bos|13|ibv|ibv": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und Verfahren der dynamischen Investitionsrechnung nutzen",
        hours: 32,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der flexiblen Plankostenrechnung Abweichungen analysieren und die optimale Anpassungsform bei Änderung der Beschäftigung ermitteln",
        hours: 48,
      },
      {
        id: "lb3",
        label:
          "Volkswirtschaftliche Modelle als Grundlage für die Angebotsentscheidung nutzen",
        hours: 25,
      },
      {
        id: "lb4",
        label: "Wirtschaftspolitische Instrumente und Maßnahmen beurteilen",
        hours: 35,
      },
    ],
    "bos|13|informatik|wahl-abu-s-w-gh": [
      {
        id: "lb1",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Grundlagen der Softwareentwicklung (optional)",
        hours: 24,
      },
      {
        id: "lb7",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Modellbildung und Simulation (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Objektorientierte Analyse (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Material- und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb14",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "bos|13|informatik|wahl-t-iw": [
      {
        id: "lb1",
        label: "Modellbildung und Simulation",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Objektorientierte Analyse",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Entwicklung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "Implementierung und Nutzung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb6",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb11",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb12",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb14",
        label: "ERP-Systeme – Material-und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb15",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "bos|13|internationale_politik": [
      {
        id: "lb1",
        label:
          "Akteure, Strukturen und Theorien in der internationalen Politik",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Handlungsfelder und Herausforderungen in der internationalen Politik",
        hours: 22,
      },
      {
        id: "lb3",
        label: "Kontroversen in der und über die internationale Politik",
        hours: 22,
      },
    ],
    "bos|13|isb": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "bos|13|italienisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Gestiftet und gelebt – die Sendung der Kirche",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Fragen und Antworten – der Mensch und die Sinnsuche",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Gemeinschaft und Gerechtigkeit – christliche Perspektiven für die Gesellschaft",
        hours: 10,
      },
    ],
    "bos|13|ki": [
      {
        id: "lb1",
        label: "Andere in Arbeitsfeldern des Gesundheitswesens anleiten",
      },
      {
        id: "lb2",
        label: "Sich mit Vorurteilen auseinandersetzen",
      },
      {
        id: "lb3",
        label:
          "Interkulturalität im Berufsalltag des Gesundheitswesens als Bereicherung wahrnehmen",
      },
    ],
    "bos|13|kuenstliche_intelligenz_informatik_u_technologie|abu": [
      {
        id: "lb1",
        label: "Künstliche Intelligenz und digitale Anwendungen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Anbau von nachwachsenden Rohstoffen (optional)",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Fertilität und Reproduktion beim Nutztier (optional)",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Bio- und Gentechnologie in der Pflanzenzüchtung (optional)",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Bio- und Gentechnologie in der Tierzüchtung (optional)",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Ernährung zwischen Mangel und Überfluss (optional)",
        hours: 10,
      },
      {
        id: "lb7",
        label:
          "Lebensmittelchemie und -technologie am Beispiel der Produktion eines Lebensmittels (optional)",
        hours: 10,
      },
      {
        id: "lb8",
        label: "Energetische Nutzung von Biorohstoffen (optional)",
        hours: 10,
      },
      {
        id: "lb9",
        label: "Moderne Kunststofftechnologien (optional)",
        hours: 10,
      },
      {
        id: "lb10",
        label:
          "Entwicklung, Herstellung und Funktionsweisen von Arzneimitteln (optional)",
        hours: 10,
      },
      {
        id: "lb11",
        label: "Gendiagnostische Methoden und Gentherapie (optional)",
        hours: 10,
      },
      {
        id: "lb12",
        label:
          "Bioinformatik – Sequenzvergleiche und -identifikation (optional)",
        hours: 10,
      },
      {
        id: "lb13",
        label: "Farbstoffe und Färbemethoden (optional)",
        hours: 10,
      },
      {
        id: "lb14",
        label: "Vertiefende kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "bos|13|kuenstliche_intelligenz_informatik_u_technologie|t": [
      {
        id: "lb1",
        label: "Lernen über KI − vertieft",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Netzwerktechnik (optional)",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Mechatronik (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Regelungstechnik (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Elektrotechnik – Wechselstromtechnik (optional)",
        hours: 16,
      },
      {
        id: "lb6",
        label: "Bautechnik und Gestaltung (optional)",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Festigkeitslehre (optional)",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Fachwerke (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Modellbildung (optional)",
        hours: 16,
      },
      {
        id: "lb10",
        label: "Vertiefende kompetenzorientierte Projektarbeit",
        hours: 20,
      },
    ],
    "bos|13|kunst": [
      {
        id: "lb1",
        label: "Zeichnen und Malen (optional)",
      },
      {
        id: "lb2",
        label: "Druck und Experiment (optional)",
      },
      {
        id: "lb3",
        label: "Skulptur und Objekt (optional)",
      },
      {
        id: "lb4",
        label: "Film und Inszenierung (optional)",
      },
      {
        id: "lb5",
        label: "Foto und Inszenierung (optional)",
      },
    ],
    "bos|13|latein": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "bos|13|mathematik|abu-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Grundlegende Eigenschaften der gebrochen-rationalen Funktionen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Kurvendiskussion der gebrochen-rationalen Funktionen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Grundlegende Eigenschaften der ln-Funktion",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Kurvendiskussion von Funktionen, die aus Verkettung und/oder Verknüpfungen von Exponentialfunktionen bzw. Logarithmusfunktionen mit rationalen Funktionen hervorgehen",
        hours: 30,
      },
      {
        id: "lb5",
        label:
          "Vektoren im IR 2 und IR 3 , lineare Unabhängigkeit und lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb6",
        label: "Produkte von Vektoren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Geraden und Ebenen im Raum – Geometrische Anwendungen im IR 3",
        hours: 22,
      },
    ],
    "bos|13|mathematik|t": [
      {
        id: "lb1",
        label: "Umkehrfunktionen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Vertiefung des Integralbegriffs",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Integralrechnung, Integrationsverfahren",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Anwendung der Differenzial- und Integralrechnung",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Gewöhnliche Differenzialgleichungen",
        hours: 20,
      },
      {
        id: "lb6",
        label: "Zufallsexperiment und Ereignis",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Relative Häufigkeit und Wahrscheinlichkeit",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Grundlagen der Kombinatorik",
        hours: 6,
      },
      {
        id: "lb9",
        label: "Bernoulli-Ketten",
        hours: 6,
      },
      {
        id: "lb10",
        label: "Zufallsgröße und Wahrscheinlichkeitsverteilung",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Testen von Hypothesen",
        hours: 8,
      },
    ],
    "bos|13|mathematik|wahl-abu-s-w-t": [
      {
        id: "lb1",
        label: "Komplexe Zahlen (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Beweisverfahren (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Beurteilende Statistik (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Matrizen und Determinanten (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sphärische Geometrie (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Taylorpolynome (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Boole'sche Algebra (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Kurvenparametrisierung (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Freies Projekt (optional)",
        hours: 14,
      },
    ],
    "bos|13|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
      },
    ],
    "bos|13|nt-bo": [
      {
        id: "lb1",
        label: "Werkstoffanwendung (optional)",
      },
      {
        id: "lb2",
        label: "Energieträger (optional)",
      },
      {
        id: "lb3",
        label: "Festigkeitslehre (optional)",
      },
      {
        id: "lb4",
        label: "Bautechnik und Gestaltung (optional)",
      },
      {
        id: "lb5",
        label: "Modellbildung-Grundlagen (optional)",
      },
      {
        id: "lb6",
        label: "Modellbildung-Anwendung (optional)",
      },
      {
        id: "lb7",
        label: "Regelungstechnik (optional)",
      },
      {
        id: "lb8",
        label: "Mechatronik (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|13|paedagigik-psychologie|s": [
      {
        id: "lb1",
        label:
          "Wissenschaftliche Grundlagen der pädagogisch-psychologischen Forschung reflektiert anwenden",
      },
      {
        id: "lb2",
        label:
          "Beeinträchtigten Menschen angemessen begegnen und sie unterstützen",
      },
      {
        id: "lb3",
        label:
          "Sich mit der klinischen Psychologie kritisch und wissenschaftlich fundiert auseinandersetzen",
      },
      {
        id: "lb4",
        label:
          "Organisationen als Systeme von Menschen und Kontexten auf verschiedenen Ebenen begreifen und mitgestalten",
      },
      {
        id: "lb5",
        label:
          "Theorien und Konzepte auf einer Metaebene lernbereichsübergreifend kritisch reflektieren und anwenden",
      },
    ],
    "bos|13|physik|s-w-gh-iw": [
      {
        id: "lb1",
        label: "Grundlagen der Mechanik I",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Grundlagen der Mechanik II",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Grundlagen der Wärmelehre",
        hours: 28,
      },
    ],
    "bos|13|physik|t": [
      {
        id: "lb1",
        label: "Geladene Teilchen in elektrischen und magnetischen Feldern",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Elektromagnetische Schwingungen und Wellen",
        hours: 40,
      },
      {
        id: "lb3",
        label: "Quanten- und Atomphysik",
        hours: 55,
      },
      {
        id: "lb4",
        label: "Kernphysik",
        hours: 25,
      },
    ],
    "bos|13|physik|wahl-abu": [
      {
        id: "lb1",
        label: "Mechanische Schwingungen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Wellen",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Kernphysik",
        hours: 20,
      },
    ],
    "bos|13|russisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|sg": [
      {
        id: "lb1",
        label: "Vom Kinderwunsch bis zur Geburt (optional)",
      },
      {
        id: "lb2",
        label:
          "Humanmedizinische Vertiefung I: Dermatologie und Zahnheilkunde (optional)",
      },
      {
        id: "lb3",
        label: "Pflegewissenschaften (optional)",
      },
      {
        id: "lb4",
        label:
          "Humanmedizinische Vertiefung II: Pharmakologie, Notfallmedizin und Pathologie (optional)",
      },
      {
        id: "lb5",
        label: "Alternative und komplementäre Heilverfahren (optional)",
      },
      {
        id: "lb6",
        label: "Umwelt und Gesundheit (optional)",
      },
    ],
    "bos|13|sozialwirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Junge Menschen in besonderen Lebensumständen beraten",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Als Staatsbürger agieren",
        hours: 27,
      },
      {
        id: "lb3",
        label: "Als Marktteilnehmer agieren",
        hours: 27,
      },
    ],
    "bos|13|soziologie": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "bos|13|spanisch|spanisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|spanisch|spanisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|spanisch|spanisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|spanisch|spanisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "bos|13|technologie|abu": [
      {
        id: "lb1",
        label: "Anbau und Verwertung von Energiepflanzen (optional)",
      },
      {
        id: "lb2",
        label: "Fertilität und Reproduktion beim Nutztier (optional)",
      },
      {
        id: "lb3",
        label: "Bio- und Gentechnologie in der Pflanzenzüchtung (optional)",
      },
      {
        id: "lb4",
        label: "Bio- und Gentechnologie in der Tierzüchtung (optional)",
      },
      {
        id: "lb5",
        label: "Ernährung zwischen Mangel und Überfluss (optional)",
      },
      {
        id: "lb6",
        label: "Lebensmittelkonservierung (optional)",
      },
      {
        id: "lb7",
        label: "Lebensmittelchemie und -technologie des Getreides (optional)",
      },
      {
        id: "lb8",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|13|technologie|t": [
      {
        id: "lb1",
        label: "Nichtmetallische Werkstoffe (optional)",
      },
      {
        id: "lb2",
        label: "Netzwerktechnik (optional)",
      },
      {
        id: "lb3",
        label: "Festigkeitslehre (optional)",
      },
      {
        id: "lb4",
        label: "Fachwerke (optional)",
      },
      {
        id: "lb5",
        label: "Bautechnik und Gestaltung (optional)",
      },
      {
        id: "lb6",
        label: "Modellbildung-Anwendung (optional)",
      },
      {
        id: "lb7",
        label: "Regelungstechnik (optional)",
      },
      {
        id: "lb8",
        label: "Mechatronik (optional)",
      },
      {
        id: "lb9",
        label: "Nachrichtentechnik (optional)",
      },
      {
        id: "lb10",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "bos|13|volkswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Wirtschaftspolitische Konzeptionen und fiskalpolitische Maßnahmen beurteilen",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Beschäftigungs- und arbeitsmarktpolitische Maßnahmen analysieren und beurteilen",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Strukturpolitische Maßnahmen beurteilen",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Wettbewerbspolitische Maßnahmen beurteilen",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Umweltpolitische Maßnahmen beurteilen",
        hours: 14,
      },
      {
        id: "lb6",
        label:
          "Entwicklungspolitische Problemstellungen analysieren und beurteilen",
        hours: 14,
      },
    ],
    "bos|13|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Als Unternehmer Kaufverträge schließen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Arbeitsverträge schließen und Personal führen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Als Staatsbürger agieren",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Als Marktteilnehmer agieren",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sich selbständig machen",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Den Preis für ein Produkt kalkulieren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Den Produktionsprozess steuern",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Ein Marketingkonzept gestalten",
        hours: 14,
      },
    ],
    "bos|13|wirtschaft_aktuell": [
      {
        id: "lb1",
        label: "Ausgewählte Aspekte der Internationalisierung (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Angewandte Entwicklungspolitik (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "Betriebswirtschaftlich Planen, Entscheiden und Kontrollieren (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Gesellschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Wirtschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Märkte im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Innovation und Existenzgründung (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Standortentscheidungen treffen (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Zukunftsorientiertes Personalmanagement (optional)",
        hours: 14,
      },
      {
        id: "lb10",
        label: "Qualitätsmanagement im Betrieb (optional)",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Stakeholder-Konzept (optional)",
        hours: 14,
      },
      {
        id: "lb12",
        label: "Finanzmanagement (optional)",
        hours: 14,
      },
    ],
    "fos|10|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren, Kennzahlen berechnen und betriebliche Zielsetzungen abgrenzen",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Typische Aufgaben im Personalbereich planen und organisieren",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Mithilfe des externen Rechnungswesens Bilanz und GuV erläutern",
        hours: 30,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und Maschinenkosten ermitteln",
        hours: 30,
      },
      {
        id: "lb5",
        label: "Ein Unternehmen erkunden",
        hours: 20,
      },
    ],
    "fos|10|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Formenvielfalt des Lebens",
      },
      {
        id: "lb3",
        label: "Mikroorganismen und Viren",
      },
      {
        id: "lb4",
        label: "Humanbiologie",
      },
      {
        id: "lb5",
        label: "Menschliche Sexualität",
      },
    ],
    "fos|10|biologie|s-gh": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Organisationsstufen des Lebens",
      },
      {
        id: "lb3",
        label: "Weitergabe genetischer Information",
      },
      {
        id: "lb4",
        label: "Systematik der Lebewesen",
      },
      {
        id: "lb5",
        label: "Gesunde Lebensführung",
      },
      {
        id: "lb6",
        label: "Stammesgeschichtliche Entwicklung des Menschen",
      },
    ],
    "fos|10|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen überprüfen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Material beschaffen sowie Fertigungsverfahren festlegen",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "Personalbedarf planen, Personal beschaffen, einsetzen und beurteilen",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Geschäftsbuchführung das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 35,
      },
      {
        id: "lb5",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 28,
      },
      {
        id: "lb6",
        label: "Ein Unternehmensplanspiel durchführen",
        hours: 11,
      },
    ],
    "fos|10|chemie": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Reinstoffe und Stoffgemische",
      },
      {
        id: "lb3",
        label: "Atombau und Periodensystem",
      },
      {
        id: "lb4",
        label: "Formeln und Reaktionsgleichungen",
      },
      {
        id: "lb5",
        label: "Chemische Bindungen",
      },
      {
        id: "lb6",
        label: "Energetik",
      },
    ],
    "fos|10|deutsch|vorklasse": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|10|deutsch|vorklasse_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|10|deutsch|vorkurs": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|10|deutsch|vorkurs_guelitg_ab_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|10|englisch|vorklasse": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|10|englisch|vorkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|10|ethik": [
      {
        id: "lb1",
        label: "Einführung in die Grundbegriffe der Ethik",
      },
      {
        id: "lb2",
        label: "Verantwortung und Gewissen",
      },
      {
        id: "lb3",
        label: "Angewandte Ethik",
      },
    ],
    "fos|10|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Bibel im Dialog",
      },
      {
        id: "lb2",
        label: "Glaube in der Welt",
      },
      {
        id: "lb3",
        label: "Im Netz",
      },
      {
        id: "lb4",
        label: "Lebenszeiten",
      },
    ],
    "fos|10|gpug-fosbos": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label: "Teilhabe: Gestaltung der eigenen Lebenswirklichkeit (optional)",
        hours: 28,
      },
      {
        id: "lb3",
        label:
          "Freiheitlich demokratische Rechte und Werte als Fundament der Lebenswirklichkeit in Deutschland (optional)",
        hours: 28,
      },
      {
        id: "lb4",
        label:
          "Weimarer Republik: Lebenswirklichkeiten in der ersten deutschen Demokratie (optional)",
        hours: 28,
      },
      {
        id: "lb5",
        label: "Lebenswirklichkeiten im Nationalsozialismus (optional)",
        hours: 28,
      },
    ],
    "fos|10|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Gesundheit multifaktoriell begreifen (optional)",
      },
      {
        id: "lb3",
        label: "Sich im Gesundheitswesen orientieren (optional)",
      },
      {
        id: "lb4",
        label:
          "Die Komplexität des menschlichen Organismus darstellen (optional)",
      },
      {
        id: "lb5",
        label: "Geschichte der Medizin und Pflege (optional)",
      },
    ],
    "fos|10|gw|aktuell_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label:
          "Aufbau und Funktion des menschlichen Körpers sowie Auswirkungen von Krankheitsbildern erfassen (optional)",
      },
      {
        id: "lb3",
        label:
          "Strukturen und Herausforderungen des Gesundheitswesens kennenlernen (optional)",
      },
      {
        id: "lb4",
        label:
          "Sich auf das Praktikum im Gesundheitswesen vorbereiten (optional)",
      },
      {
        id: "lb5",
        label: "Berufliche Erfahrungen einbringen (optional)",
      },
    ],
    "fos|10|ibv|ibv": [
      {
        id: "lb1",
        label: "Ein Unternehmen international ausrichten",
        hours: 15,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 28,
      },
      {
        id: "lb3",
        label:
          "Mithilfe der Geschäftsbuchführung das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 33,
      },
      {
        id: "lb4",
        label:
          "Grundprobleme einer Volkswirtschaft identifizieren und wirtschaftliche Prozesse mikroökonomisch analysieren und beurteilen",
        hours: 21,
      },
      {
        id: "lb5",
        label:
          "Ziele der Wirtschaftspolitik bestimmen und das Inlandsprodukt als Wohlstandsindikator analysieren",
        hours: 16,
      },
      {
        id: "lb6",
        label:
          "Ein Unternehmensplanspiel für ein internationales Unternehmen durchführen (optional)",
        hours: 11,
      },
      {
        id: "lb7",
        label:
          "Eine Fallstudie für ein internationales Unternehmen durchführen (optional)",
        hours: 11,
      },
    ],
    "fos|10|ibv|ibv_gueltig_ab_26_27": [
      {
        id: "lb1",
        label:
          "Unternehmerisch denken, sich im Unternehmen orientieren und Ziele formulieren",
        hours: 30,
      },
      {
        id: "lb2",
        label:
          "Den Erfolg betrieblichen Handelns mithilfe der Teilkostenrechnung analysieren",
        hours: 30,
      },
      {
        id: "lb3",
        label:
          "Ziele und Verhaltensweisen von Wirtschaftsakteuren erklären und deren Zusammenwirken bei der Preisbildung im vollkommenen Markt analysieren",
        hours: 32,
      },
      {
        id: "lb4",
        label:
          "Konsumentscheidungen aus verhaltensökonomischer Perspektive verstehen und optimieren",
        hours: 20,
      },
    ],
    "fos|10|katholische-religionslehre": [
      {
        id: "lb1",
        label:
          "Freiheit und Menschenwürde – Identität als Aufgabe christlicher Lebensgestaltung",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Gewissen und Verantwortung – Menschen in Entscheidungssituationen",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Konfessionen und Religionen – das Miteinander in einer pluralen Welt",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Symbole und Sakramente – Ausdruck einer tieferen Wirklichkeit",
        hours: 10,
      },
    ],
    "fos|10|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
      {
        id: "lb8",
        label: "Arbeiten und Lernen mit KI − unplugged (optional)",
      },
    ],
    "fos|10|mathematik|vorklasse": [
      {
        id: "lb1",
        label: "Aussagenlogik, Mengenlehre mit Zahlenmengen, Rechenregeln",
        hours: 50,
      },
      {
        id: "lb2",
        label: "Gleichungen und lineare Ungleichungen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Lineare und quadratische Funktionen",
        hours: 60,
      },
      {
        id: "lb4",
        label: "Lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb5",
        label: "Dreieckslehre",
        hours: 13,
      },
      {
        id: "lb6",
        label: "Berechnungen von Längen, Flächeninhalten und Volumina",
        hours: 25,
      },
      {
        id: "lb7",
        label: "Daten und Zufall, Wahrscheinlichkeit",
        hours: 18,
      },
      {
        id: "lb8",
        label: "Exponentialfunktion und Logarithmus",
        hours: 18,
      },
    ],
    "fos|10|mathematik|vorkurs": [
      {
        id: "lb1",
        label: "Rechenregeln",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Lineare und quadratische Funktionen",
        hours: 18,
      },
    ],
    "fos|10|nt-bo": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
    ],
    "fos|10|paedagigik-psychologie": [
      {
        id: "lb1",
        label: "Selbstmanagementstrategien effektiv nutzen",
      },
      {
        id: "lb2",
        label:
          "Ressourcenorientiert arbeiten in sozialpädagogischen Handlungsfeldern",
      },
      {
        id: "lb3",
        label: "Emotional belastende Situationen bewältigen",
      },
      {
        id: "lb4",
        label: "Wertschätzend und konfliktlösend kommunizieren",
      },
    ],
    "fos|10|physik": [
      {
        id: "lb1",
        label: "Grundlagen der Mechanik I",
        hours: 28,
      },
      {
        id: "lb2",
        label: "Grundlagen der Mechanik II",
        hours: 28,
      },
      {
        id: "lb3",
        label: "Grundlagen der Elektrizitätslehre",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Grundlagen der Wärmelehre",
        hours: 28,
      },
      {
        id: "lb5",
        label: "Grundlagen der Optik",
        hours: 28,
      },
    ],
    "fos|10|technologie": [
      {
        id: "lb1",
        label: "Physik-Basis",
      },
      {
        id: "lb2",
        label: "Kräfte und ihre Wirkungen (optional)",
      },
      {
        id: "lb3",
        label: "Wärmezustand und Wärmeausdehnung fester Körper (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik-Grundlagen (optional)",
      },
      {
        id: "lb5",
        label: "Chemische Eigenschaften von Stoffen (optional)",
      },
      {
        id: "lb6",
        label: "Atomaufbau und chemische Bindungen (optional)",
      },
      {
        id: "lb7",
        label: "Informationstechnik-Grundlagen (optional)",
      },
    ],
    "fos|11|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen analysieren",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Material beschaffen",
        hours: 22,
      },
      {
        id: "lb3",
        label:
          "Mithilfe des externen Rechnungswesens Bilanz und GuV analysieren",
        hours: 22,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise ermitteln, Maschinenkosten berechnen und Abweichungen analysieren",
        hours: 28,
      },
    ],
    "fos|11|biologie": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Grundlagen der Evolution",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Cytologie",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Mikrobiologie",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Biomoleküle als Energieträger und Strukturelemente",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Grundlagen der Cytogenetik",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Immunologie",
        hours: 12,
      },
      {
        id: "lb8",
        label: "Biologisches Praktikum",
        hours: 28,
      },
    ],
    "fos|11|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Sich im Unternehmen orientieren und betriebliche Zielsetzungen überprüfen",
        hours: 8,
      },
      {
        id: "lb2",
        label: "Material beschaffen sowie Fertigungsverfahren festlegen",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Personal beschaffen und einsetzen",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "Mithilfe der Geschäftsbuchführung das Gesamtergebnis einer Unternehmung ermitteln",
        hours: 20,
      },
      {
        id: "lb5",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 28,
      },
    ],
    "fos|11|chemie|abu": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Stöchiometrie",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Säure-Base-Reaktionen",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Chemisches Praktikum",
      },
    ],
    "fos|11|chemie|gh": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Säure-Base-Reaktionen",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Biomoleküle",
        hours: 12,
      },
    ],
    "fos|11|chemie|s": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Säure-Base-Reaktionen",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Biomoleküle",
        hours: 12,
      },
    ],
    "fos|11|chemie|t": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Aufbau des Periodensystems",
        hours: 6,
      },
      {
        id: "lb3",
        label: "Salze und Ionenbindung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Molekulare Stoffe und Elektronenpaarbindung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Stöchiometrie",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Säure-Base-Reaktionen",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Chemisches Praktikum",
      },
    ],
    "fos|11|deutsch|gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|11|deutsch|gueltig_bis_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|11|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|11|fpa|abu-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label:
          "Organisationsstrukturen erfassen und sich in Ausbildung und Beruf orientieren",
      },
      {
        id: "lb3",
        label:
          "In der Praktikumsstelle bei Produktion und Dienstleistungen mitwirken",
      },
      {
        id: "lb4",
        label: "Praktikumserfahrungen reflektieren",
      },
    ],
    "fos|11|fpa|abu-vertiefung": [
      {
        id: "lb1",
        label: "Bodenentstehung und Bodenbestandteile (optional)",
      },
      {
        id: "lb2",
        label: "Bodenaufbau und Bodengefüge (optional)",
      },
      {
        id: "lb3",
        label: "Bodenfruchtbarkeit und Bodenbewertung (optional)",
      },
      {
        id: "lb4",
        label: "Bodenschutz und Bodenschäden (optional)",
      },
      {
        id: "lb5",
        label: "Nährstoffe und Ernährungskonzepte (optional)",
      },
      {
        id: "lb6",
        label: "Verdauungsapparat und Ernährungstherapien (optional)",
      },
    ],
    "fos|11|fpa|g-taetigkeit": [
      {
        id: "lb1",
        label: "Materialbasiertes Gestalten",
      },
      {
        id: "lb2",
        label: "Visuelle Gestaltung",
      },
      {
        id: "lb3",
        label: "Betriebliche Strukturen",
      },
      {
        id: "lb4",
        label: "Kommunikation und Interaktion",
      },
      {
        id: "lb5",
        label: "Präsentation und Reflexion",
      },
    ],
    "fos|11|fpa|g-vertiefung": [
      {
        id: "lb1",
        label: "Technische Kommunikation",
      },
      {
        id: "lb2",
        label: "Raumdarstellung",
      },
    ],
    "fos|11|fpa|gesundheit-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label: "In der Praktikumsstelle mitwirken",
      },
      {
        id: "lb3",
        label: "Praktikumserfahrungen reflektieren und aufarbeiten",
      },
    ],
    "fos|11|fpa|gesundheit-vertiefung": [
      {
        id: "lb1",
        label: "Cytologie",
      },
    ],
    "fos|11|fpa|internat-wirtschaft-vertiefung": [
      {
        id: "lb1",
        label:
          "Betriebliche Aufgaben mithilfe eines Tabellenkalkulationsprogramms lösen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Betriebliche Aufgaben anwendungsorientiert lösen",
        hours: 10,
      },
    ],
    "fos|11|fpa|iw-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label:
          "Organisationsstrukturen erfassen und sich in Ausbildung und Beruf orientieren",
      },
      {
        id: "lb3",
        label: "Informations‑ und Kommunikationsprozesse gestalten",
      },
      {
        id: "lb4",
        label:
          "Werteströme und Wertschöpfungsprozesse dokumentieren, auswerten und steuern",
      },
      {
        id: "lb5",
        label: "Marketingprozesse planen und durchführen",
      },
      {
        id: "lb6",
        label: "Unternehmensprozesse planen, steuern und kontrollieren",
      },
    ],
    "fos|11|fpa|s-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label: "In der Praktikumsstelle mitwirken",
      },
      {
        id: "lb3",
        label: "Praktikumserfahrungen reflektieren und aufarbeiten",
      },
    ],
    "fos|11|fpa|s-vertiefung": [
      {
        id: "lb1",
        label: "Musik im Kontext Sozialer Arbeit (optional)",
      },
      {
        id: "lb2",
        label: "Kunst im Kontext Sozialer Arbeit (optional)",
      },
      {
        id: "lb3",
        label:
          "Methoden und Prinzipien Sozialer und pädagogischer Arbeit (optional)",
      },
    ],
    "fos|11|fpa|t-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label: "Elektrische Systeme analysieren und ihre Funktionen testen",
      },
      {
        id: "lb3",
        label: "Elektrische Anlagen planen und erstellen",
      },
      {
        id: "lb4",
        label: "Werkstücke konventionell fertigen",
      },
      {
        id: "lb5",
        label:
          "Fertigungsprozesse mit numerisch gesteuerten Werkzeugmaschinen simulieren oder durchführen",
      },
      {
        id: "lb6",
        label: "Verbindungen durch Fügetechniken herstellen",
      },
      {
        id: "lb7",
        label:
          "Bautechnische Gestaltungen und Konstruktionen untersuchen und planen",
      },
      {
        id: "lb8",
        label:
          "Steuerungstechnische Systeme installieren und in Betrieb nehmen",
      },
    ],
    "fos|11|fpa|t-vertiefung": [
      {
        id: "lb1",
        label: "Technische Zeichnungen manuell und rechnergestützt erstellen",
      },
    ],
    "fos|11|fpa|w-taetigkeit": [
      {
        id: "lb1",
        label: "Sich über die Praktikumsstelle informieren",
      },
      {
        id: "lb2",
        label:
          "Organisationsstrukturen erfassen und sich in Ausbildung und Beruf orientieren",
      },
      {
        id: "lb3",
        label: "Informations‑ und Kommunikationsprozesse gestalten",
      },
      {
        id: "lb4",
        label:
          "Werteströme und Wertschöpfungsprozesse dokumentieren, auswerten und steuern",
      },
      {
        id: "lb5",
        label: "Marketingprozesse planen und durchführen",
      },
      {
        id: "lb6",
        label: "Unternehmensprozesse planen, steuern und kontrollieren",
      },
    ],
    "fos|11|fpa|w-vertiefung": [
      {
        id: "lb1",
        label:
          "Betriebliche Aufgaben mithilfe eines Tabellenkalkulationsprogramms lösen",
        hours: 18,
      },
      {
        id: "lb2",
        label: "Betriebliche Aufgaben anwendungsorientiert lösen",
        hours: 10,
      },
    ],
    "fos|11|franzoesisch|franzoesisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|11|franzoesisch|franzoesisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|11|geschichte": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label:
          "Historische und aktuelle Lebenswirklichkeiten: Stehen wir am Beginn einer neuen Epoche?",
        hours: 8,
      },
      {
        id: "lb3",
        label:
          "Einflüsse auf die Lebenswirklichkeit: Ideen und Ideologien des kurzen 20. Jahrhunderts im globalen Wettstreit",
        hours: 14,
      },
      {
        id: "lb4",
        label:
          "Historische Lebenswirklichkeiten in Deutschland: Deutsche Geschichte seit dem Ende des Zweiten Weltkriegs",
        hours: 20,
      },
      {
        id: "lb5",
        label:
          "Die Auseinandersetzung mit historischen Lebenswirklichkeiten: Der Umgang mit Diktaturen in Deutschland",
        hours: 14,
      },
    ],
    "fos|11|gestaltung|praxis": [
      {
        id: "lb1",
        label: "Zeichnung",
      },
      {
        id: "lb2",
        label: "Malerei",
      },
      {
        id: "lb3",
        label: "Objekt",
      },
      {
        id: "lb4",
        label: "Konzept",
      },
    ],
    "fos|11|gestaltung|theorie": [
      {
        id: "lb1",
        label: "Werkanalyse",
      },
      {
        id: "lb2",
        label: "Kunstgeschichte",
      },
      {
        id: "lb3",
        label: "Gestaltungstechniken",
      },
      {
        id: "lb4",
        label: "Visuelle Kommunikation",
      },
    ],
    "fos|11|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Gesundheit multifaktoriell begreifen",
      },
      {
        id: "lb3",
        label: "Sich im Gesundheitswesen orientieren",
      },
      {
        id: "lb4",
        label: "Infektionen vorbeugen",
      },
    ],
    "fos|11|gw|aktuell_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Infektionskrankheiten und Resistenzentwicklungen vorbeugen",
      },
      {
        id: "lb3",
        label: "Bewegung fördern und mit Verletzungen umgehen",
      },
    ],
    "fos|11|ibv|ibv": [
      {
        id: "lb1",
        label: "Ein Unternehmen international ausrichten",
        hours: 19,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der Vollkostenrechnung Angebotspreise und das Betriebsergebnis ermitteln",
        hours: 27,
      },
      {
        id: "lb3",
        label:
          "Wirtschaftliche Prozesse mikroökonomisch analysieren und beurteilen",
        hours: 25,
      },
      {
        id: "lb4",
        label:
          "Ziele der Wirtschaftspolitik bestimmen und das Inlandsprodukt als Wohlstandsindikator analysieren",
        hours: 19,
      },
    ],
    "fos|11|ibv|ibv_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Establishing a business and managing it sustainably",
        hours: 17,
      },
      {
        id: "lb2",
        label:
          "Den Erfolg betrieblichen Handelns mithilfe der Teilkostenrechnung analysieren und zukünftige Erfolgspotenziale durch Investitionen sichern",
        hours: 26,
      },
      {
        id: "lb3",
        label:
          "Mikroökonomische Prozesse am Modell des vollkommenen Markts analysieren und beurteilen",
        hours: 29,
      },
      {
        id: "lb4",
        label:
          "Understanding and optimising decisions from a behavioural economics perspective",
        hours: 12,
      },
    ],
    "fos|11|ki": [
      {
        id: "lb1",
        label:
          "Die eigene Wahrnehmung als Voraussetzung für erfolgreiche Kommunikation analysieren und reflektieren",
      },
      {
        id: "lb2",
        label: "Kranken Menschen angemessen begegnen",
      },
      {
        id: "lb3",
        label:
          "Mit Klienten unter Beachtung des Alters und der Lebensphase kommunizieren",
      },
    ],
    "fos|11|kuenstliche_intelligenz_informatik_u_technologie": [
      {
        id: "lb1",
        label: "Arbeiten und Lernen mit KI",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Tabellenkalkulation",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Maschinenbau (optional)",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Elektrotechnik – Gleichstromtechnik (optional)",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Bautechnik (optional)",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Informations- und Kommunikationstechnik (optional)",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Einfache kompetenzorientierte Projektarbeit",
        hours: 12,
      },
    ],
    "fos|11|mathematik|abu-g-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen",
        hours: 32,
      },
      {
        id: "lb2",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Zufallsexperiment und Ereignis",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Relative Häufigkeit und Wahrscheinlichkeit",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Grundlagen der Kombinatorik",
        hours: 6,
      },
    ],
    "fos|11|mathematik|abu-g-s-w-gh-iw_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen: lineare und quadratische Funktionen",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Ganzrationale Funktionen allgemein",
        hours: 16,
      },
      {
        id: "lb3",
        label:
          "Grundlagen der Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Grundlagen der Wahrscheinlichkeitsrechnung",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Bedingte Wahrscheinlichkeit und stochastische Unabhängigkeit",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Kombinatorik",
        hours: 6,
      },
    ],
    "fos|11|mathematik|t": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen",
        hours: 32,
      },
      {
        id: "lb2",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 24,
      },
      {
        id: "lb3",
        label:
          "Vektoren im IR 2 und IR 3 , lineare Unabhängigkeit und lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Produkte von Vektoren",
        hours: 8,
      },
    ],
    "fos|11|mathematik|t_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Ganzrationale Funktionen: lineare und quadratische Funktionen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Ganzrationale Funktionen allgemein",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "Grundlagen der Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 24,
      },
      {
        id: "lb4",
        label:
          "Vektoren im zwei- und dreidimensionalen Anschauungsraum und lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb5",
        label: "Produkte von Vektoren",
        hours: 12,
      },
    ],
    "fos|11|medien": [
      {
        id: "lb1",
        label:
          "Fotografie im medientheoretischen und kunsthistorischen Kontext",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Fotografische Techniken",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Fotografische Bildideen",
        hours: 22,
      },
      {
        id: "lb4",
        label: "Editieren, Bearbeiten und Präsentieren",
        hours: 10,
      },
    ],
    "fos|11|paedagigik-psychologie|s": [
      {
        id: "lb1",
        label:
          "Wesenzüge wissenschaftlicher Pädagogik und Psychologie begreifen",
      },
      {
        id: "lb2",
        label:
          "Grundlagen des Erlebens, Verhaltens und Handelns analysieren, verstehen und anwenden",
      },
      {
        id: "lb3",
        label:
          "Erziehungs- und Bildungsprozesse individuumsbezogen und verantwortlich gestalten",
      },
      {
        id: "lb4",
        label:
          "Lernen als multidimensionalen und steuerbaren Prozess verstehen",
      },
    ],
    "fos|11|paedagigik-psychologie|s_gueltig_ab_26_27": [
      {
        id: "lb1",
        label:
          "Wesenszüge wissenschaftlicher Pädagogik und Psychologie begreifen",
      },
      {
        id: "lb2",
        label:
          "Grundlagen des Erlebens und Verhaltens analysieren, verstehen und anwenden",
      },
      {
        id: "lb3",
        label:
          "Erziehungsprozesse individuumsbezogen und kompetenzorientiert gestalten",
      },
      {
        id: "lb4",
        label:
          "Lernen als multidimensionalen und steuerbaren Prozess verstehen",
      },
    ],
    "fos|11|physik|abu": [
      {
        id: "lb1",
        label: "Geradlinige Bewegung",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Dynamik, Newton'sche Gesetze",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Kreisbewegung",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Energie, Arbeit und Leistung",
        hours: 12,
      },
    ],
    "fos|11|physik|t": [
      {
        id: "lb1",
        label: "Beschreibung von Bewegungen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Dynamik, Newton'sche Gesetze",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Energie und Arbeit",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Physikalisches Praktikum",
        hours: 28,
      },
    ],
    "fos|11|physik|t_gueltig_ab_26_27": [
      {
        id: "lb1",
        label: "Beschreibung von Bewegungen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Dynamik, Newton'sche Gesetze",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Energie und Arbeit",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Experimentelles Arbeiten",
        hours: 28,
      },
    ],
    "fos|11|rechtslehre|iw": [
      {
        id: "lb1",
        label:
          "Kaufverträge mit inländischen und ausländischen Partnern abschließen und erfüllen",
        hours: 22,
      },
      {
        id: "lb2",
        label:
          "Im nationalen und internationalen kaufmännischen Geschäftsverkehr agieren",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Arbeitsverhältnisse rechtlich gestalten",
        hours: 14,
      },
    ],
    "fos|11|rechtslehre|w": [
      {
        id: "lb1",
        label: "Kaufverträge abschließen und erfüllen",
        hours: 22,
      },
      {
        id: "lb2",
        label: "Im kaufmännischen Geschäftsverkehr agieren",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Arbeitsverhältnisse rechtlich gestalten",
        hours: 14,
      },
    ],
    "fos|11|sozialwirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Ein soziales Unternehmen strategisch ausrichten",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Liquide Mittel für ein soziales Unternehmen beschaffen",
        hours: 22,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines sozialen Unternehmens analysieren",
        hours: 22,
      },
    ],
    "fos|11|spanisch|spanisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|11|spanisch|spanisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|11|technologie": [
      {
        id: "lb1",
        label: "Technologische Grundlagen",
      },
      {
        id: "lb2",
        label: "Informatik",
      },
      {
        id: "lb3",
        label: "Maschinenbau (optional)",
      },
      {
        id: "lb4",
        label: "Elektrotechnik (optional)",
      },
      {
        id: "lb5",
        label: "Bautechnik (optional)",
      },
      {
        id: "lb6",
        label: "Informations- und Kommunikationstechnik (optional)",
      },
    ],
    "fos|11|volkswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Grundlagen ökonomischen Denkens und Handelns analysieren und beurteilen",
        hours: 10,
      },
      {
        id: "lb2",
        label:
          "Die Preisbildung bei vollkommenem Wettbewerb analysieren und beurteilen",
        hours: 18,
      },
      {
        id: "lb3",
        label:
          "Die Preisbildung bei unvollkommenem Wettbewerb analysieren und beurteilen",
        hours: 28,
      },
    ],
    "fos|12|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Jahresabschlussarbeiten durchführen und das Gesamtergebnis eines Unternehmens ermitteln",
        hours: 44,
      },
      {
        id: "lb2",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 32,
      },
      {
        id: "lb3",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 32,
      },
      {
        id: "lb4",
        label:
          "Personal sach- und personenorientiert führen und zukunftsorientiert entwickeln",
        hours: 32,
      },
    ],
    "fos|12|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Ökologie",
        hours: 35,
      },
      {
        id: "lb3",
        label: "Genetik",
        hours: 50,
      },
      {
        id: "lb4",
        label: "Physiologie",
        hours: 55,
      },
    ],
    "fos|12|biologie|g": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Genetik",
        hours: 30,
      },
      {
        id: "lb3",
        label: "Stoffwechsel",
        hours: 26,
      },
      {
        id: "lb4",
        label: "Evolution",
        hours: 28,
      },
    ],
    "fos|12|biologie|s": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Zellbiologische Grundlagen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Genetik des Menschen",
        hours: 28,
      },
      {
        id: "lb4",
        label: "Der Mensch als Evolutionsfaktor",
        hours: 14,
      },
    ],
    "fos|12|biologie|wahl-g-t-w-iw": [
      {
        id: "lb1",
        label: "Biologie des Alltags (optional)",
      },
      {
        id: "lb2",
        label: "Bionik (optional)",
      },
      {
        id: "lb3",
        label: "Evolution (optional)",
      },
      {
        id: "lb4",
        label: "Genetik/Gentechnik (optional)",
      },
      {
        id: "lb5",
        label: "Immunologie (optional)",
      },
      {
        id: "lb6",
        label: "Sinnesphysiologie (optional)",
      },
      {
        id: "lb7",
        label: "Stoffkreisläufe und Bioökonomie (optional)",
      },
    ],
    "fos|12|biotechnologie": [
      {
        id: "lb1",
        label: "Grundlagen naturwissenschaftlichen Experimentierens",
      },
      {
        id: "lb2",
        label: "Mikrobiologische Nachweismethoden (optional)",
      },
      {
        id: "lb3",
        label:
          "Biotechnologie der Nahrungs- und Genussmittelproduktion (optional)",
      },
      {
        id: "lb4",
        label: "Pflanzenproduktion und Energiegewinnung (optional)",
      },
      {
        id: "lb5",
        label: "Nanobiotechnologie (optional)",
      },
    ],
    "fos|12|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 32,
      },
      {
        id: "lb2",
        label: "Marketingprozesse planen und steuern",
        hours: 25,
      },
      {
        id: "lb3",
        label: "Jahresabschlussarbeiten durchführen",
        hours: 50,
      },
      {
        id: "lb4",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 33,
      },
    ],
    "fos|12|chemie|abu": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "Funktionelle Gruppen und Reaktionsmechanismen der organischen Chemie",
        hours: 30,
      },
      {
        id: "lb3",
        label: "Reaktionsgeschwindigkeit und chemisches Gleichgewicht",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Redoxreaktionen und Elektrochemie",
        hours: 30,
      },
    ],
    "fos|12|chemie|gh": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "Funktionelle Gruppen und Reaktionsmechanismen der organischen Chemie",
        hours: 30,
      },
      {
        id: "lb3",
        label: "Redoxreaktionen im physiologischen Kontext",
        hours: 26,
      },
    ],
    "fos|12|chemie|t": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label:
          "Funktionelle Gruppen und Reaktionsmechanismen der organischen Chemie",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Reaktionsgeschwindigkeit und chemisches Gleichgewicht",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Redoxreaktionen und Elektrochemie",
        hours: 20,
      },
    ],
    "fos|12|deutsch|gueltig_bis_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|12|ebc": [
      {
        id: "lb1",
        label: "Reading, Understanding and Interpreting Literature – a Toolbox",
      },
      {
        id: "lb2",
        label: "Topics and Issues",
      },
    ],
    "fos|12|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|ethik": [
      {
        id: "lb1",
        label: "Moral und Ethik",
      },
      {
        id: "lb2",
        label: "Angewandte Ethik",
      },
      {
        id: "lb3",
        label: "Glück und Sinnerfüllung",
      },
    ],
    "fos|12|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Gott in Beziehung",
      },
      {
        id: "lb2",
        label: "Mensch, du bist wer",
      },
      {
        id: "lb3",
        label: "Lebenswert",
      },
      {
        id: "lb4",
        label: "Global gerecht",
      },
      {
        id: "lb5",
        label: "Religion vielfältig",
      },
    ],
    "fos|12|experimentelles_gestalten": [
      {
        id: "lb1",
        label: "Malerei und Grafik (optional)",
      },
      {
        id: "lb2",
        label: "Plastik und Objekt (optional)",
      },
      {
        id: "lb3",
        label: "Gestalten im Raum (optional)",
      },
      {
        id: "lb4",
        label: "Visuelle Medien (optional)",
      },
      {
        id: "lb5",
        label: "Aktionskunst (optional)",
      },
    ],
    "fos|12|franzoesisch|franzoesisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|franzoesisch|franzoesisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|franzoesisch|franzoesisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|franzoesisch|franzoesisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|gestaltung|praxis": [
      {
        id: "lb1",
        label: "Zeichnung und Malerei",
      },
      {
        id: "lb2",
        label: "Grafikdesign",
      },
      {
        id: "lb3",
        label: "Objekt",
      },
      {
        id: "lb4",
        label: "Konzept",
      },
    ],
    "fos|12|gestaltung|theorie": [
      {
        id: "lb1",
        label: "Werkanalyse",
      },
      {
        id: "lb2",
        label: "Kunstgeschichte",
      },
      {
        id: "lb3",
        label: "Gestaltungstechniken",
      },
      {
        id: "lb4",
        label: "Visuelle Kommunikation",
      },
      {
        id: "lb5",
        label: "Produktdesign",
      },
    ],
    "fos|12|gwr": [
      {
        id: "lb1",
        label: "Ein Unternehmen im Gesundheitswesen strategisch ausrichten",
        hours: 19,
      },
      {
        id: "lb2",
        label:
          "Liquide Mittel für ein Unternehmen im Gesundheitswesen beschaffen",
        hours: 19,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines Unternehmens im Gesundheitswesen analysieren",
        hours: 19,
      },
      {
        id: "lb4",
        label:
          "Für ein Unternehmen im Gesundheitswesen Personal einsetzen und führen",
        hours: 19,
      },
      {
        id: "lb5",
        label: "Dienstleistungen des Gesundheitswesens vermarkten",
        hours: 19,
      },
      {
        id: "lb6",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Als Marktteilnehmer agieren",
        hours: 26,
      },
    ],
    "fos|12|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Sich gesundheitsbewusst ernähren",
      },
      {
        id: "lb3",
        label: "Bewegung fördern",
      },
      {
        id: "lb4",
        label:
          "Herz‑Kreislauf‑Erkrankungen vorbeugen und deren Konsequenzen erfassen",
      },
    ],
    "fos|12|ibv|ibv": [
      {
        id: "lb1",
        label: "Jahresabschlussarbeiten durchführen",
        hours: 52,
      },
      {
        id: "lb2",
        label:
          "Finanzierungs- und Investitionsvorgänge analysieren, liquide Mittel beschaffen und Investitionen tätigen",
        hours: 30,
      },
      {
        id: "lb3",
        label:
          "Entscheidungen mithilfe der Teilkostenrechnung vorbereiten und begründet treffen",
        hours: 32,
      },
      {
        id: "lb4",
        label: "Weitere Ziele der Wirtschaftspolitik analysieren",
        hours: 26,
      },
    ],
    "fos|12|informatik|w-s-abu-g-gh": [
      {
        id: "lb1",
        label: "Entwicklung relationaler Datenbanken",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Implementierung und Nutzung relationaler Datenbanken",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb5",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Grundlagen der Softwareentwicklung (optional)",
        hours: 24,
      },
      {
        id: "lb9",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "Modellbildung und Simulation (optional)",
        hours: 16,
      },
      {
        id: "lb13",
        label: "Objektorientierte Analyse (optional)",
        hours: 8,
      },
      {
        id: "lb14",
        label: "ERP-Systeme - Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb15",
        label: "ERP-Systeme - Material- und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb16",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "fos|12|informatik|wahl-t-iw": [
      {
        id: "lb1",
        label: "Grundlagen der Softwareentwicklung",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Entwicklung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb3",
        label:
          "Implementierung und Nutzung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb9",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Material-und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb14",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "fos|12|internationale_politik": [
      {
        id: "lb1",
        label:
          "Akteure, Strukturen und Theorien in der internationalen Politik",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Handlungsfelder und Herausforderungen in der internationalen Politik",
        hours: 22,
      },
      {
        id: "lb3",
        label: "Kontroversen in der und über die internationale Politik",
        hours: 22,
      },
    ],
    "fos|12|isb|pflicht-iw": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "fos|12|isb|wahl-abu-g-t-w-s-gh": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "fos|12|italienisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Religion und Vernunft – Herausforderung der Weltdeutung",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Lesen und verstehen – Deutungshorizonte biblischer Texte",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Geschaffen und erlöst – das christliche Menschenbild",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Erfahrbar und nah – dem dreieinen Gott begegnen",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Gerechtigkeit und Verantwortung – die Botschaft der Propheten für heute",
        hours: 10,
      },
    ],
    "fos|12|ki": [
      {
        id: "lb1",
        label: "Im multiprofessionellen Team im Gesundheitswesen arbeiten",
      },
      {
        id: "lb2",
        label: "Konflikte im Team bewältigen",
      },
      {
        id: "lb3",
        label: "Mit Krisen und Trauer umgehen",
      },
    ],
    "fos|12|kuenstliche_intelligenz_informatik_u_technologie|abu": [
      {
        id: "lb1",
        label: "Künstliche Intelligenz und digitale Anwendungen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Grundlagen nachhaltiger Pflanzenproduktion (optional)",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Zukunftsfähige Düngung (optional)",
        hours: 10,
      },
      {
        id: "lb4",
        label:
          "Nutztierhaltung im Spannungsfeld von Ökonomie, Umweltschutz und Tierwohl (optional)",
        hours: 10,
      },
      {
        id: "lb5",
        label:
          "Nutztierfütterung – leistungsorientiert und nachhaltig (optional)",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Moderne Werkstoffe (optional)",
        hours: 10,
      },
      {
        id: "lb7",
        label: "Allgemeine Energietechnik (optional)",
        hours: 10,
      },
      {
        id: "lb8",
        label: "Erneuerbare Energien (optional)",
        hours: 10,
      },
      {
        id: "lb9",
        label: "Umwelttechnik (optional)",
        hours: 10,
      },
      {
        id: "lb10",
        label: "Enzyme – Biokatalysatoren in Industrie und Haushalt (optional)",
        hours: 10,
      },
      {
        id: "lb11",
        label:
          "Lebensmittelchemie und -technologie am Beispiel der Produktion eines Lebensmittels (optional)",
        hours: 10,
      },
      {
        id: "lb12",
        label: "Lebensmittelkonservierung (optional)",
        hours: 10,
      },
      {
        id: "lb13",
        label: "Medizinische und pharmakologische Verfahren (optional)",
        hours: 10,
      },
      {
        id: "lb14",
        label: "Bioinformatik – Simulationen (optional)",
        hours: 10,
      },
      {
        id: "lb15",
        label: "Kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "fos|12|kuenstliche_intelligenz_informatik_u_technologie|t": [
      {
        id: "lb1",
        label: "Informatik – Grundlagen der Programmierung",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Lernen über KI – Grundlagen",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Thermodynamik",
      },
      {
        id: "lb4",
        label: "Energie",
      },
      {
        id: "lb5",
        label: "Technische Mechanik (optional)",
        hours: 12,
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Elektrotechnik – elektronische Bauelemente (optional)",
        hours: 12,
      },
      {
        id: "lb8",
        label: "Moderne Werkstoffe (optional)",
        hours: 12,
      },
      {
        id: "lb9",
        label: "Kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "fos|12|kuenstliche_intelligenz_u_wirtschaftsinformatik": [
      {
        id: "lb1",
        label: "Systeme der Künstlichen Intelligenz untersuchen",
        hours: 24,
      },
      {
        id: "lb2",
        label: "Informatiksysteme entwickeln",
        hours: 32,
      },
    ],
    "fos|12|kunst": [
      {
        id: "lb1",
        label: "Zeichnen und Malen (optional)",
      },
      {
        id: "lb2",
        label: "Druck und Experiment (optional)",
      },
      {
        id: "lb3",
        label: "Skulptur und Objekt (optional)",
      },
      {
        id: "lb4",
        label: "Film und Inszenierung (optional)",
      },
      {
        id: "lb5",
        label: "Foto und Inszenierung (optional)",
      },
    ],
    "fos|12|latein": [
      {
        id: "lb1",
        label: "Texte",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Kultur",
      },
      {
        id: "lb4",
        label: "Methodik",
      },
    ],
    "fos|12|mathematik|Wahl-abu-g-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Trigonometrie und trigonometrische Funktionen (verpflichtend)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Lineare Gleichungssysteme (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Vektorrechnung (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Folgen und Reihen (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Gebrochen-rationale Funktionen (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Statistik (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Näherungsverfahren (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Freies Projekt (optional)",
        hours: 14,
      },
    ],
    "fos|12|mathematik|abu-g-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Exponentialfunktion und Logarithmus",
        hours: 20,
      },
      {
        id: "lb3",
        label:
          "Kurvendiskussion von Funktionen, die aus Verknüpfung von Exponentialfunktionen mit linearen und quadratischen Funktionen hervorgehen",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Integralrechnung",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Bernoulli-Ketten",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Zufallsgröße und Wahrscheinlichkeitsverteilung",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Testen von Hypothesen",
        hours: 8,
      },
    ],
    "fos|12|mathematik|t": [
      {
        id: "lb1",
        label: "Differenzialrechnung bei ganzrationalen Funktionen",
        hours: 36,
      },
      {
        id: "lb2",
        label: "Exponentialfunktion und Logarithmus",
        hours: 18,
      },
      {
        id: "lb3",
        label:
          "Kurvendiskussion von Funktionen, die aus Verknüpfung/Verkettung von Exponentialfunktionen mit linearen und quadratischen Funktionen hervorgehen",
        hours: 18,
      },
      {
        id: "lb4",
        label: "Integralrechnung",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Produkte von Vektoren",
        hours: 6,
      },
      {
        id: "lb6",
        label: "Geraden und Ebenen im Raum – Geometrische Anwendungen im IR 3",
        hours: 22,
      },
    ],
    "fos|12|mathematik|wahl-t": [
      {
        id: "lb1",
        label: "Abschnittsweise definierte Funktionen",
        hours: 6,
      },
      {
        id: "lb2",
        label: "Trigonometrische Funktionen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Gebrochen-rationale Funktionen",
        hours: 30,
      },
    ],
    "fos|12|medien": [
      {
        id: "lb1",
        label: "Visuelle Zeichen und Schrift",
        hours: 12,
      },
      {
        id: "lb2",
        label: "Layoutgestaltung – Kombination von Schrift, Zeichen und Bild",
        hours: 12,
      },
      {
        id: "lb3",
        label: "Digitale interaktive Medien",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Medienprojekt",
        hours: 20,
      },
    ],
    "fos|12|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
      },
    ],
    "fos|12|nt-bo|g": [
      {
        id: "lb1",
        label: "Physikalische Grundlagen",
      },
      {
        id: "lb2",
        label: "Chemische Grundlagen",
      },
      {
        id: "lb3",
        label: "Werkstoffe und Werkstoffeigenschaften (optional)",
      },
      {
        id: "lb4",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb5",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb7",
        label: "Technische Mechanik (optional)",
      },
      {
        id: "lb8",
        label: "Systeme und Prozesse (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|12|nt-bo|w-iw": [
      {
        id: "lb1",
        label: "Physikalische Grundlagen",
      },
      {
        id: "lb2",
        label: "Chemische Grundlagen",
      },
      {
        id: "lb3",
        label: "Werkstoffe und Werkstoffeigenschaften (optional)",
      },
      {
        id: "lb4",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb5",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb7",
        label: "Elektrotechnik-Anwendung (optional)",
      },
      {
        id: "lb8",
        label: "Systeme und Prozesse (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|12|paedagigik-psychologie|s": [
      {
        id: "lb1",
        label:
          "Entwicklung als lebensumfassenden, multifaktoriell beeinflussten Prozess begreifen und pädagogisch gestalten",
      },
      {
        id: "lb2",
        label:
          "Persönlichkeit und Identität beschreiben, erklären und reflektieren",
      },
      {
        id: "lb3",
        label:
          "Aufgaben und Arbeitsfelder Sozialer Arbeit professionell einordnen",
      },
      {
        id: "lb4",
        label:
          "In sozialen Beziehungen empathisch und zielführend kommunizieren und interagieren",
      },
    ],
    "fos|12|physik|abu": [
      {
        id: "lb1",
        label: "Wärme als Energieform",
        hours: 40,
      },
      {
        id: "lb2",
        label: "Dynamik von Flüssigkeiten und Gasen",
        hours: 16,
      },
    ],
    "fos|12|physik|t": [
      {
        id: "lb1",
        label: "Kreisbewegung",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Mechanische Schwingungen und Wellen",
        hours: 55,
      },
      {
        id: "lb3",
        label: "Klassische Felder",
        hours: 40,
      },
      {
        id: "lb4",
        label: "Elektromagnetische Induktion",
        hours: 25,
      },
    ],
    "fos|12|pug": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label:
          "Aktuelle Lebenswirklichkeiten im politischen System der Bundesrepublik Deutschland im Vergleich mit anderen Staaten",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Gesellschaftliche Lebenswirklichkeiten des Einzelnen",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Einflussfaktoren auf die Lebenswirklichkeit",
        hours: 8,
      },
      {
        id: "lb5",
        label:
          "Aktuelle internationale Herausforderungen und deren Einfluss auf die Lebenswirklichkeiten in Staat und Gesellschaft",
        hours: 16,
      },
    ],
    "fos|12|russisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|sg": [
      {
        id: "lb1",
        label: "Vom Kinderwunsch bis zur Geburt (optional)",
      },
      {
        id: "lb2",
        label:
          "Humanmedizinische Vertiefung I: Dermatologie und Zahnheilkunde (optional)",
      },
      {
        id: "lb3",
        label: "Pflegewissenschaften (optional)",
      },
      {
        id: "lb4",
        label:
          "Humanmedizinische Vertiefung II: Pharmakologie, Notfallmedizin und Pathologie (optional)",
      },
      {
        id: "lb5",
        label: "Alternative und komplementäre Heilverfahren (optional)",
      },
      {
        id: "lb6",
        label: "Umwelt und Gesundheit (optional)",
      },
    ],
    "fos|12|sozialwirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Für ein soziales Unternehmen Kaufverträge abschließen",
        hours: 25,
      },
      {
        id: "lb2",
        label:
          "Für ein soziales Unternehmen Personal einstellen, führen und Arbeitsverträge beenden",
        hours: 29,
      },
      {
        id: "lb3",
        label: "Soziale Dienstleistungen vermarkten",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 10,
      },
    ],
    "fos|12|soziologie|abu-g-t-w-iw-gh": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "fos|12|soziologie|s": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "fos|12|spanisch|spanisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|spanisch|spanisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|spanisch|spanisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|spanisch|spanisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|12|sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "fos|12|studier-und-arbeitstechniken": [
      {
        id: "lb1",
        label: "Arbeits- und Lernprozesse optimieren",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Quellen zur wissenschaftlichen Arbeit nutzen",
        hours: 26,
      },
      {
        id: "lb3",
        label: "Ergebnisse präsentieren",
        hours: 20,
      },
    ],
    "fos|12|technologie|abu": [
      {
        id: "lb1",
        label: "Industrielle Biotechnologie",
      },
      {
        id: "lb2",
        label: "Pflanzenproduktion-Grundlagen",
      },
      {
        id: "lb3",
        label: "Tierproduktion-Grundlagen",
      },
      {
        id: "lb4",
        label: "Werkstoffe und Werkstoffeigenschaften (optional)",
      },
      {
        id: "lb5",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb6",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb7",
        label: "Lebensmittelchemie und -technologie der Milch (optional)",
      },
      {
        id: "lb8",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|12|technologie|t": [
      {
        id: "lb1",
        label: "Thermodynamik-Grundlagen",
      },
      {
        id: "lb2",
        label: "Technische Mechanik",
      },
      {
        id: "lb3",
        label: "Metallische Werkstoffe",
      },
      {
        id: "lb4",
        label: "Allgemeine Energietechnik (optional)",
      },
      {
        id: "lb5",
        label: "Erneuerbare Energien (optional)",
      },
      {
        id: "lb6",
        label: "Umwelttechnik (optional)",
      },
      {
        id: "lb7",
        label: "Elektronische Bauelemente (optional)",
      },
      {
        id: "lb8",
        label: "Systeme und Prozesse (optional)",
      },
      {
        id: "lb9",
        label: "Modellbildung-Grundlagen (optional)",
      },
      {
        id: "lb10",
        label: "Verbrennungsmotoren (optional)",
      },
      {
        id: "lb11",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|12|volkswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Das Wirtschaftswachstum als volkswirtschaftliche Größe beurteilen",
        hours: 22,
      },
      {
        id: "lb2",
        label:
          "Die Einkommens- und Vermögenspolitik als Steuerungsinstrument analysieren und beurteilen",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Geldpolitische Instrumente und Maßnahmen beurteilen",
        hours: 24,
      },
      {
        id: "lb4",
        label: "Internationale Verflechtungen analysieren und beurteilen",
        hours: 22,
      },
    ],
    "fos|12|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Als Unternehmer Kaufverträge schließen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Arbeitsverträge schließen und Personal führen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Als Staatsbürger agieren",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Als Marktteilnehmer agieren",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sich selbständig machen",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Den Preis für ein Produkt kalkulieren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Den Produktionsprozess steuern",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Ein Marktingkonzept gestalten",
        hours: 14,
      },
    ],
    "fos|12|wirtschaft_aktuell": [
      {
        id: "lb1",
        label: "Ausgewählte Aspekte der Internationalisierung (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Angewandte Entwicklungspolitik (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "Betriebswirtschaftlich Planen, Entscheiden und Kontrollieren (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Gesellschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Wirtschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Märkte im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Innovation und Existenzgründung (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Standortentscheidungen treffen (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Zukunftsorientiertes Personalmanagement (optional)",
        hours: 14,
      },
      {
        id: "lb10",
        label: "Qualitätsmanagement im Betrieb (optional)",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Stakeholder-Konzept (optional)",
        hours: 14,
      },
      {
        id: "lb12",
        label: "Finanzmanagement (optional)",
        hours: 14,
      },
    ],
    "fos|13|betriebswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und Finanzierungs- und Investitionsentscheidungen treffen",
        hours: 40,
      },
      {
        id: "lb2",
        label: "Marketingprozesse planen und steuern",
        hours: 25,
      },
      {
        id: "lb3",
        label:
          "Den Faktoreinsatz optimieren, Kosteneinflussgrößen unterscheiden und bei Änderung der Beschäftigung die optimale Anpassungsform in der Produktion ermitteln",
        hours: 40,
      },
      {
        id: "lb4",
        label: "Mithilfe des Controllings ein Unternehmen strategisch steuern",
        hours: 35,
      },
    ],
    "fos|13|biologie|abu": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Informations- und Steuerungssysteme",
        hours: 50,
      },
      {
        id: "lb3",
        label: "Evolution",
        hours: 30,
      },
      {
        id: "lb4",
        label: "Angewandte Genetik",
        hours: 30,
      },
      {
        id: "lb5",
        label: "Angewandte Ökologie",
        hours: 30,
      },
    ],
    "fos|13|biologie|g": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Informations- und Steuerungssysteme",
        hours: 52,
      },
      {
        id: "lb3",
        label: "Ökologie",
        hours: 32,
      },
    ],
    "fos|13|biologie|s": [
      {
        id: "lb1",
        label: "Naturwissenschaftliche Denk- und Arbeitsweisen",
      },
      {
        id: "lb2",
        label: "Mechanismen und Belege der Evolution",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Neuro- und Muskelphysiologie",
        hours: 26,
      },
      {
        id: "lb4",
        label: "Immunologie",
        hours: 14,
      },
    ],
    "fos|13|biologie|wahl-g-t-w-iw": [
      {
        id: "lb1",
        label: "Biologie des Alltags (optional)",
      },
      {
        id: "lb2",
        label: "Bionik (optional)",
      },
      {
        id: "lb3",
        label: "Evolution (optional)",
      },
      {
        id: "lb4",
        label: "Genetik/Gentechnik (optional)",
      },
      {
        id: "lb5",
        label: "Immunologie (optional)",
      },
      {
        id: "lb6",
        label: "Sinnesphysiologie (optional)",
      },
      {
        id: "lb7",
        label: "Stoffkreisläufe und Bioökonomie (optional)",
      },
    ],
    "fos|13|biotechnologie": [
      {
        id: "lb1",
        label: "Grundlagen der Mikroskopier- und Präparationstechniken",
      },
      {
        id: "lb2",
        label: "Medizinische und pharmakologische Verfahren (optional)",
      },
      {
        id: "lb3",
        label: "Gentechnik (optional)",
      },
      {
        id: "lb4",
        label: "Bioinformatik (optional)",
      },
      {
        id: "lb5",
        label: "Aktuelle Entwicklungen in der Biotechnologie (optional)",
      },
    ],
    "fos|13|bwl-rechnungswesen": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und weitere Formen der Finanzierung nutzen",
        hours: 40,
      },
      {
        id: "lb2",
        label:
          "Mithilfe des Controllings das Unternehmen operativ und strategisch steuern",
        hours: 40,
      },
      {
        id: "lb3",
        label:
          "Den Faktoreinsatz optimieren, Kosteneinflussgrößen unterscheiden und bei Änderung der Beschäftigung die optimale Anpassungsform ermitteln",
        hours: 40,
      },
      {
        id: "lb4",
        label:
          "Personal sach- und personenorientiert führen und zukunftsorientiert entwickeln",
        hours: 20,
      },
    ],
    "fos|13|chemie|abu": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Biomoleküle und Tenside",
        hours: 42,
      },
      {
        id: "lb3",
        label: "Polymere",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Stoffe mit delokalisierten Elektronensystemen",
        hours: 22,
      },
    ],
    "fos|13|chemie|t": [
      {
        id: "lb1",
        label: "Wie Chemiker denken und arbeiten",
      },
      {
        id: "lb2",
        label: "Biomoleküle",
        hours: 24,
      },
      {
        id: "lb3",
        label: "Polymere",
        hours: 12,
      },
      {
        id: "lb4",
        label: "Stoffe mit delokalisierten Elektronensystemen",
        hours: 20,
      },
    ],
    "fos|13|deutsch|gueltig_bis_26_27": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "fos|13|ebc": [
      {
        id: "lb1",
        label: "Reading, Understanding and Interpreting Literature – a Toolbox",
      },
      {
        id: "lb2",
        label: "Topics and Issues",
      },
    ],
    "fos|13|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|ethik": [
      {
        id: "lb1",
        label: "Freiheit und Determination",
      },
      {
        id: "lb2",
        label: "Recht und Gerechtigkeit",
      },
      {
        id: "lb3",
        label: "Glaube und Religion",
      },
    ],
    "fos|13|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Fragender Glaube",
      },
      {
        id: "lb2",
        label: "Bedacht entschieden",
      },
      {
        id: "lb3",
        label: "Zukunftswerkstatt",
      },
    ],
    "fos|13|experimentelles_gestalten": [
      {
        id: "lb1",
        label: "Malerei und Grafik (optional)",
      },
      {
        id: "lb2",
        label: "Plastik und Objekt (optional)",
      },
      {
        id: "lb3",
        label: "Gestalten im Raum (optional)",
      },
      {
        id: "lb4",
        label: "Visuelle Medien (optional)",
      },
      {
        id: "lb5",
        label: "Aktionskunst (optional)",
      },
    ],
    "fos|13|franzoesisch|franzoesisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|franzoesisch|franzoesisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|franzoesisch|franzoesisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|franzoesisch|franzoesisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|gestaltung": [
      {
        id: "lb1",
        label: "Grafik und Malerei",
      },
      {
        id: "lb2",
        label: "Plastik, Objekt, Architektur",
      },
      {
        id: "lb3",
        label: "Konzept",
      },
      {
        id: "lb4",
        label: "Werkanalyse und Kunstgeschichte",
      },
    ],
    "fos|13|gpug-fosbos": [
      {
        id: "lb1",
        label: "Methodenkompetenzen",
      },
      {
        id: "lb2",
        label: "Lebenswirklichkeiten in einer historischen Epoche",
      },
      {
        id: "lb3",
        label: "Lebenswirklichkeiten in der gegenwärtigen Welt",
      },
    ],
    "fos|13|gwr": [
      {
        id: "lb1",
        label: "Ein Unternehmen im Gesundheitswesen strategisch ausrichten",
        hours: 19,
      },
      {
        id: "lb2",
        label:
          "Liquide Mittel für ein Unternehmen im Gesundheitswesen beschaffen",
        hours: 19,
      },
      {
        id: "lb3",
        label: "Den Erfolg eines Unternehmens im Gesundheitswesen analysieren",
        hours: 19,
      },
      {
        id: "lb4",
        label:
          "Für ein Unternehmen im Gesundheitswesen Personal einsetzen und führen",
        hours: 19,
      },
      {
        id: "lb5",
        label: "Dienstleistungen des Gesundheitswesens vermarkten",
        hours: 19,
      },
      {
        id: "lb6",
        label: "Familien in besonderen Lebensumständen beraten",
        hours: 12,
      },
      {
        id: "lb7",
        label: "Als Marktteilnehmer agieren",
        hours: 26,
      },
    ],
    "fos|13|gw|aktuell": [
      {
        id: "lb1",
        label: "Wissenschaftlich arbeiten",
      },
      {
        id: "lb2",
        label: "Die eigenständige Lebensführung von Senioren unterstützen",
      },
      {
        id: "lb3",
        label:
          "Sucht und Depression als gesellschaftliche Herausforderung erfassen",
      },
      {
        id: "lb4",
        label: "Onkologische Erkrankungen in ihrer Komplexität begreifen",
      },
      {
        id: "lb5",
        label: "Entwicklungen im Gesundheitswesen kritisch verfolgen",
      },
    ],
    "fos|13|ibv|ibv": [
      {
        id: "lb1",
        label:
          "Den Jahresabschluss analysieren und Verfahren der dynamischen Investitionsrechnung nutzen",
        hours: 32,
      },
      {
        id: "lb2",
        label:
          "Mithilfe der flexiblen Plankostenrechnung Abweichungen analysieren und die optimale Anpassungsform bei Änderung der Beschäftigung ermitteln",
        hours: 48,
      },
      {
        id: "lb3",
        label:
          "Volkswirtschaftliche Modelle als Grundlage für die Angebotsentscheidung nutzen",
        hours: 25,
      },
      {
        id: "lb4",
        label: "Wirtschaftspolitische Instrumente und Maßnahmen beurteilen",
        hours: 35,
      },
    ],
    "fos|13|informatik|w-s-abu-g-gh": [
      {
        id: "lb1",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb4",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb6",
        label: "Grundlagen der Softwareentwicklung (optional)",
        hours: 24,
      },
      {
        id: "lb7",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Modellbildung und Simulation (optional)",
        hours: 16,
      },
      {
        id: "lb11",
        label: "Objektorientierte Analyse (optional)",
        hours: 8,
      },
      {
        id: "lb12",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Material-und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb14",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "fos|13|informatik|wahl-t-iw": [
      {
        id: "lb1",
        label: "Modellbildung und Simulation",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Objektorientierte Analyse",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Entwicklung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label:
          "Implementierung und Nutzung relationaler Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Datenmanagement in relationalen Datenbanken (optional)",
        hours: 16,
      },
      {
        id: "lb6",
        label: "Gesellschaft und Informatik (optional)",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Technische Grundlagen (optional)",
        hours: 8,
      },
      {
        id: "lb8",
        label: "Netzwerke realisieren (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Visualisierung von Daten (optional)",
        hours: 8,
      },
      {
        id: "lb10",
        label: "Prozedurale Programmierung (optional)",
        hours: 8,
      },
      {
        id: "lb11",
        label: "Objektorientierte Programmierung (optional)",
        hours: 16,
      },
      {
        id: "lb12",
        label: "Gestaltung von IT-Anwendungen (optional)",
        hours: 8,
      },
      {
        id: "lb13",
        label: "ERP-Systeme – Finanzbuchhaltung (optional)",
        hours: 8,
      },
      {
        id: "lb14",
        label: "ERP-Systeme – Material-und Produktionswirtschaft (optional)",
        hours: 16,
      },
      {
        id: "lb15",
        label: "IT-Projekt (optional)",
        hours: 24,
      },
    ],
    "fos|13|internationale_politik": [
      {
        id: "lb1",
        label:
          "Akteure, Strukturen und Theorien in der internationalen Politik",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Handlungsfelder und Herausforderungen in der internationalen Politik",
        hours: 22,
      },
      {
        id: "lb3",
        label: "Kontroversen in der und über die internationale Politik",
        hours: 22,
      },
    ],
    "fos|13|isb": [
      {
        id: "lb1",
        label: "Sich auf dem internationalen Arbeitsmarkt erfolgreich bewerben",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Interkulturelle Teams führen und Personal entwickeln",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Ein neues Produkt auf einem internationalen Markt einführen",
        hours: 20,
      },
    ],
    "fos|13|italienisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Gestiftet und gelebt – die Sendung der Kirche",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Fragen und Antworten – der Mensch und die Sinnsuche",
        hours: 10,
      },
      {
        id: "lb3",
        label:
          "Gemeinschaft und Gerechtigkeit – christliche Perspektiven für die Gesellschaft",
        hours: 10,
      },
    ],
    "fos|13|ki": [
      {
        id: "lb1",
        label: "Andere in Arbeitsfeldern des Gesundheitswesens anleiten",
      },
      {
        id: "lb2",
        label: "Sich mit Vorurteilen auseinandersetzen",
      },
      {
        id: "lb3",
        label:
          "Interkulturalität im Berufsalltag des Gesundheitswesens als Bereicherung wahrnehmen",
      },
    ],
    "fos|13|kuenstliche_intelligenz_informatik_u_technologie|abu": [
      {
        id: "lb1",
        label: "Künstliche Intelligenz und digitale Anwendungen",
        hours: 10,
      },
      {
        id: "lb2",
        label: "Anbau von nachwachsenden Rohstoffen (optional)",
        hours: 10,
      },
      {
        id: "lb3",
        label: "Fertilität und Reproduktion beim Nutztier (optional)",
        hours: 10,
      },
      {
        id: "lb4",
        label: "Bio- und Gentechnologie in der Pflanzenzüchtung (optional)",
        hours: 10,
      },
      {
        id: "lb5",
        label: "Bio- und Gentechnologie in der Tierzüchtung (optional)",
        hours: 10,
      },
      {
        id: "lb6",
        label: "Ernährung zwischen Mangel und Überfluss (optional)",
        hours: 10,
      },
      {
        id: "lb7",
        label:
          "Lebensmittelchemie und -technologie am Beispiel der Produktion eines Lebensmittels (optional)",
        hours: 10,
      },
      {
        id: "lb8",
        label: "Energetische Nutzung von Biorohstoffen (optional)",
        hours: 10,
      },
      {
        id: "lb9",
        label: "Moderne Kunststofftechnologien (optional)",
        hours: 10,
      },
      {
        id: "lb10",
        label:
          "Entwicklung, Herstellung und Funktionsweisen von Arzneimitteln (optional)",
        hours: 10,
      },
      {
        id: "lb11",
        label: "Gendiagnostische Methoden und Gentherapie (optional)",
        hours: 10,
      },
      {
        id: "lb12",
        label:
          "Bioinformatik – Sequenzvergleiche und -identifikation (optional)",
        hours: 10,
      },
      {
        id: "lb13",
        label: "Farbstoffe und Färbemethoden (optional)",
        hours: 10,
      },
      {
        id: "lb14",
        label: "Vertiefende kompetenzorientierte Projektarbeit",
        hours: 16,
      },
    ],
    "fos|13|kuenstliche_intelligenz_informatik_u_technologie|t": [
      {
        id: "lb1",
        label: "Lernen über KI − vertieft",
        hours: 16,
      },
      {
        id: "lb2",
        label: "Netzwerktechnik (optional)",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Mechatronik (optional)",
        hours: 16,
      },
      {
        id: "lb4",
        label: "Regelungstechnik (optional)",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Elektrotechnik – Wechselstromtechnik (optional)",
        hours: 16,
      },
      {
        id: "lb6",
        label: "Bautechnik und Gestaltung (optional)",
        hours: 16,
      },
      {
        id: "lb7",
        label: "Festigkeitslehre (optional)",
        hours: 16,
      },
      {
        id: "lb8",
        label: "Fachwerke (optional)",
        hours: 16,
      },
      {
        id: "lb9",
        label: "Modellbildung (optional)",
        hours: 16,
      },
      {
        id: "lb10",
        label: "Vertiefende kompetenzorientierte Projektarbeit",
        hours: 20,
      },
    ],
    "fos|13|kunst": [
      {
        id: "lb1",
        label: "Zeichnen und Malen (optional)",
      },
      {
        id: "lb2",
        label: "Druck und Experiment (optional)",
      },
      {
        id: "lb3",
        label: "Skulptur und Objekt (optional)",
      },
      {
        id: "lb4",
        label: "Film und Inszenierung (optional)",
      },
      {
        id: "lb5",
        label: "Foto und Inszenierung (optional)",
      },
    ],
    "fos|13|latein": [
      {
        id: "lb1",
        label: "Texte und ihr kultureller Kontext",
      },
      {
        id: "lb2",
        label: "Sprachliche Basis",
      },
      {
        id: "lb3",
        label: "Methodik",
      },
    ],
    "fos|13|mathematik|abu-g-s-w-gh-iw": [
      {
        id: "lb1",
        label: "Grundlegende Eigenschaften der gebrochen-rationalen Funktionen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Kurvendiskussion der gebrochen-rationalen Funktionen",
        hours: 20,
      },
      {
        id: "lb3",
        label: "Grundlegende Eigenschaften der ln-Funktion",
        hours: 20,
      },
      {
        id: "lb4",
        label:
          "Kurvendiskussion von Funktionen, die aus Verkettung und/oder Verknüpfungen von Exponentialfunktionen bzw. Logarithmusfunktionen mit rationalen Funktionen hervorgehen",
        hours: 30,
      },
      {
        id: "lb5",
        label:
          "Vektoren im IR 2 und IR 3 , lineare Unabhängigkeit und lineare Gleichungssysteme",
        hours: 20,
      },
      {
        id: "lb6",
        label: "Produkte von Vektoren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Geraden und Ebenen im Raum – Geometrische Anwendungen im IR 3",
        hours: 22,
      },
    ],
    "fos|13|mathematik|t": [
      {
        id: "lb1",
        label: "Umkehrfunktionen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Vertiefung des Integralbegriffs",
        hours: 8,
      },
      {
        id: "lb3",
        label: "Integralrechnung, Integrationsverfahren",
        hours: 20,
      },
      {
        id: "lb4",
        label: "Anwendung der Differenzial- und Integralrechnung",
        hours: 16,
      },
      {
        id: "lb5",
        label: "Gewöhnliche Differenzialgleichungen",
        hours: 20,
      },
      {
        id: "lb6",
        label: "Zufallsexperiment und Ereignis",
        hours: 8,
      },
      {
        id: "lb7",
        label: "Relative Häufigkeit und Wahrscheinlichkeit",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Grundlagen der Kombinatorik",
        hours: 6,
      },
      {
        id: "lb9",
        label: "Bernoulli-Ketten",
        hours: 6,
      },
      {
        id: "lb10",
        label: "Zufallsgröße und Wahrscheinlichkeitsverteilung",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Testen von Hypothesen",
        hours: 8,
      },
    ],
    "fos|13|mathematik|wahl-abu-g-s-w-t": [
      {
        id: "lb1",
        label: "Komplexe Zahlen (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Beweisverfahren (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Beurteilende Statistik (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Matrizen und Determinanten (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sphärische Geometrie (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Taylorpolynome (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Boole'sche Algebra (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Kurvenparametrisierung (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Freies Projekt (optional)",
        hours: 14,
      },
    ],
    "fos|13|medien": [
      {
        id: "lb1",
        label: "Filmische Gestaltungsmittel",
        hours: 21,
      },
      {
        id: "lb2",
        label:
          "Bewegtbilder in filmhistorischen und medientheoretischen Kontexten",
        hours: 21,
      },
      {
        id: "lb3",
        label: "Gestalten von Bewegtbildern",
        hours: 42,
      },
    ],
    "fos|13|musik": [
      {
        id: "lb1",
        label: "Sprechen – Singen – Musizieren",
      },
      {
        id: "lb2",
        label: "Musik – Mensch – Zeit",
      },
    ],
    "fos|13|nt-bo|g": [
      {
        id: "lb1",
        label: "Werkstoffanwendung (optional)",
      },
      {
        id: "lb2",
        label: "Energieträger (optional)",
      },
      {
        id: "lb3",
        label: "Festigkeitslehre (optional)",
      },
      {
        id: "lb4",
        label: "Fachwerke (optional)",
      },
      {
        id: "lb5",
        label: "Bautechnik und Gestaltung (optional)",
      },
      {
        id: "lb6",
        label: "Modellbildung-Grundlagen (optional)",
      },
      {
        id: "lb7",
        label: "Modellbildung-Anwendung (optional)",
      },
      {
        id: "lb8",
        label: "Elektrotechnik-Anwendung (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|13|nt-bo|w-iw": [
      {
        id: "lb1",
        label: "Werkstoffanwendung (optional)",
      },
      {
        id: "lb2",
        label: "Energieträger (optional)",
      },
      {
        id: "lb3",
        label: "Festigkeitslehre (optional)",
      },
      {
        id: "lb4",
        label: "Bautechnik und Gestaltung (optional)",
      },
      {
        id: "lb5",
        label: "Modellbildung-Grundlagen (optional)",
      },
      {
        id: "lb6",
        label: "Modellbildung-Anwendung (optional)",
      },
      {
        id: "lb7",
        label: "Regelungstechnik (optional)",
      },
      {
        id: "lb8",
        label: "Mechatronik (optional)",
      },
      {
        id: "lb9",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|13|paedagigik-psychologie|s": [
      {
        id: "lb1",
        label:
          "Wissenschaftliche Grundlagen der pädagogisch-psychologischen Forschung reflektiert anwenden",
      },
      {
        id: "lb2",
        label:
          "Beeinträchtigten Menschen angemessen begegnen und sie unterstützen",
      },
      {
        id: "lb3",
        label:
          "Sich mit der klinischen Psychologie kritisch und wissenschaftlich fundiert auseinandersetzen",
      },
      {
        id: "lb4",
        label:
          "Organisationen als Systeme von Menschen und Kontexten auf verschiedenen Ebenen begreifen und mitgestalten",
      },
      {
        id: "lb5",
        label:
          "Theorien und Konzepte auf einer Metaebene lernbereichsübergreifend kritisch reflektieren und anwenden",
      },
    ],
    "fos|13|physik|t": [
      {
        id: "lb1",
        label: "Geladene Teilchen in elektrischen und magnetischen Feldern",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Elektromagnetische Schwingungen und Wellen",
        hours: 40,
      },
      {
        id: "lb3",
        label: "Quanten- und Atomphysik",
        hours: 55,
      },
      {
        id: "lb4",
        label: "Kernphysik",
        hours: 25,
      },
    ],
    "fos|13|physik|wahl-abu": [
      {
        id: "lb1",
        label: "Mechanische Schwingungen",
        hours: 20,
      },
      {
        id: "lb2",
        label: "Wellen",
        hours: 16,
      },
      {
        id: "lb3",
        label: "Kernphysik",
        hours: 20,
      },
    ],
    "fos|13|russisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|sg": [
      {
        id: "lb1",
        label: "Vom Kinderwunsch bis zur Geburt (optional)",
      },
      {
        id: "lb2",
        label:
          "Humanmedizinische Vertiefung I: Dermatologie und Zahnheilkunde (optional)",
      },
      {
        id: "lb3",
        label: "Pflegewissenschaften (optional)",
      },
      {
        id: "lb4",
        label:
          "Humanmedizinische Vertiefung II: Pharmakologie, Notfallmedizin und Pathologie (optional)",
      },
      {
        id: "lb5",
        label: "Alternative und komplementäre Heilverfahren (optional)",
      },
      {
        id: "lb6",
        label: "Umwelt und Gesundheit (optional)",
      },
    ],
    "fos|13|sozialwirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Junge Menschen in besonderen Lebensumständen beraten",
        hours: 30,
      },
      {
        id: "lb2",
        label: "Als Staatsbürger agieren",
        hours: 27,
      },
      {
        id: "lb3",
        label: "Als Marktteilnehmer agieren",
        hours: 27,
      },
    ],
    "fos|13|soziologie": [
      {
        id: "lb1",
        label: "Individuum in der Gesellschaft",
      },
      {
        id: "lb2",
        label: "Handeln in sozialen Gruppen",
      },
      {
        id: "lb3",
        label: "Heterogenität in der Gesellschaft",
      },
      {
        id: "lb4",
        label: "Wandel der Gesellschaft",
      },
    ],
    "fos|13|spanisch|spanisch_ahr": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|spanisch|spanisch_aufbaukurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|spanisch|spanisch_fortgefuehrt": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenzen",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|spanisch|spanisch_grundkurs": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb3",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb4",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "fos|13|technologie|abu": [
      {
        id: "lb1",
        label: "Anbau und Verwertung von Energiepflanzen (optional)",
      },
      {
        id: "lb2",
        label: "Fertilität und Reproduktion beim Nutztier (optional)",
      },
      {
        id: "lb3",
        label: "Bio- und Gentechnologie in der Pflanzenzüchtung (optional)",
      },
      {
        id: "lb4",
        label: "Bio- und Gentechnologie in der Tierzüchtung (optional)",
      },
      {
        id: "lb5",
        label: "Ernährung zwischen Mangel und Überfluss (optional)",
      },
      {
        id: "lb6",
        label: "Lebensmittelkonservierung (optional)",
      },
      {
        id: "lb7",
        label: "Lebensmittelchemie und -technologie des Getreides (optional)",
      },
      {
        id: "lb8",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|13|technologie|t": [
      {
        id: "lb1",
        label: "Nichtmetallische Werkstoffe (optional)",
      },
      {
        id: "lb2",
        label: "Netzwerktechnik (optional)",
      },
      {
        id: "lb3",
        label: "Festigkeitslehre (optional)",
      },
      {
        id: "lb4",
        label: "Fachwerke (optional)",
      },
      {
        id: "lb5",
        label: "Bautechnik und Gestaltung (optional)",
      },
      {
        id: "lb6",
        label: "Modellbildung-Anwendung (optional)",
      },
      {
        id: "lb7",
        label: "Regelungstechnik (optional)",
      },
      {
        id: "lb8",
        label: "Mechatronik (optional)",
      },
      {
        id: "lb9",
        label: "Nachrichtentechnik (optional)",
      },
      {
        id: "lb10",
        label: "Komplexe technische Systeme (optional)",
      },
    ],
    "fos|13|volkswirtschaftslehre": [
      {
        id: "lb1",
        label:
          "Wirtschaftspolitische Konzeptionen und fiskalpolitische Maßnahmen beurteilen",
        hours: 12,
      },
      {
        id: "lb2",
        label:
          "Beschäftigungs- und arbeitsmarktpolitische Maßnahmen analysieren und beurteilen",
        hours: 18,
      },
      {
        id: "lb3",
        label: "Strukturpolitische Maßnahmen beurteilen",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Wettbewerbspolitische Maßnahmen beurteilen",
        hours: 12,
      },
      {
        id: "lb5",
        label: "Umweltpolitische Maßnahmen beurteilen",
        hours: 14,
      },
      {
        id: "lb6",
        label:
          "Entwicklungspolitische Problemstellungen analysieren und beurteilen",
        hours: 14,
      },
    ],
    "fos|13|wirtschaft-und-recht": [
      {
        id: "lb1",
        label: "Als Unternehmer Kaufverträge schließen",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Arbeitsverträge schließen und Personal führen",
        hours: 14,
      },
      {
        id: "lb3",
        label: "Als Staatsbürger agieren",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Als Marktteilnehmer agieren",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Sich selbständig machen",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Den Preis für ein Produkt kalkulieren",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Den Produktionsprozess steuern",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Ein Marktingkonzept gestalten",
        hours: 14,
      },
    ],
    "fos|13|wirtschaft_aktuell": [
      {
        id: "lb1",
        label: "Ausgewählte Aspekte der Internationalisierung (optional)",
        hours: 14,
      },
      {
        id: "lb2",
        label: "Angewandte Entwicklungspolitik (optional)",
        hours: 14,
      },
      {
        id: "lb3",
        label:
          "Betriebswirtschaftlich Planen, Entscheiden und Kontrollieren (optional)",
        hours: 14,
      },
      {
        id: "lb4",
        label: "Gesellschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb5",
        label: "Wirtschaft im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb6",
        label: "Märkte im Wandel (optional)",
        hours: 14,
      },
      {
        id: "lb7",
        label: "Innovation und Existenzgründung (optional)",
        hours: 14,
      },
      {
        id: "lb8",
        label: "Standortentscheidungen treffen (optional)",
        hours: 14,
      },
      {
        id: "lb9",
        label: "Zukunftsorientiertes Personalmanagement (optional)",
        hours: 14,
      },
      {
        id: "lb10",
        label: "Qualitätsmanagement im Betrieb (optional)",
        hours: 14,
      },
      {
        id: "lb11",
        label: "Stakeholder-Konzept (optional)",
        hours: 14,
      },
      {
        id: "lb12",
        label: "Finanzmanagement (optional)",
        hours: 14,
      },
    ],
    "wirtschaftsschule|10|bsk|dreistufig": [
      {
        id: "lb1",
        label: "Fit fürs Leben sein",
      },
      {
        id: "lb2",
        label: "Wettbewerbsfähig bleiben",
      },
    ],
    "wirtschaftsschule|10|bsk|vierstufig": [
      {
        id: "lb1",
        label: "Fit fürs Leben sein",
      },
      {
        id: "lb2",
        label: "Wettbewerbsfähig bleiben",
      },
    ],
    "wirtschaftsschule|10|bsk|zweistufig": [
      {
        id: "lb1",
        label: "Kaufverträge abschließen",
      },
      {
        id: "lb2",
        label: "Berufsorientierung",
      },
      {
        id: "lb3",
        label:
          "In einem kleinen, regional tätigen Unternehmen erfolgreich agieren",
      },
      {
        id: "lb4",
        label: "Die Beschaffung neuer Waren organisieren",
      },
    ],
    "wirtschaftsschule|10|deutsch|dreistufig_gueltig_ab_2627": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|10|deutsch|vierstufig": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|10|deutsch|vierstufig_gueltig_ab_2627": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|10|deutsch|zweistufig_gueltig_ab_2526": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|10|e-commerce": [
      {
        id: "lb1",
        label:
          "Ein Bewusstsein für die Beeinflussung durch Online-Marketing entwickeln",
      },
      {
        id: "lb2",
        label: "Im privaten Kontext online einkaufen",
      },
      {
        id: "lb3",
        label: "Im privaten Kontext online verkaufen",
      },
      {
        id: "lb4",
        label: "Erste berufliche Erfahrungen im E-Commerce sammeln",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|englisch|dreistufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|10|englisch|vierstufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|10|englisch|zweistufig_gueltig_ab_2526": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|10|ethik|dreistufig": [
      {
        id: "lb1",
        label: "Erwachsen sein als Frau und Mann",
      },
      {
        id: "lb2",
        label: "Gewissen und Verantwortung",
      },
      {
        id: "lb3",
        label:
          "Angewandte Ethik: Medizinethik oder Medienethik (einer der beiden Lernbereiche ist zu wählen)",
      },
    ],
    "wirtschaftsschule|10|ethik|vierstufig": [
      {
        id: "lb1",
        label: "Erwachsen sein als Frau und Mann",
      },
      {
        id: "lb2",
        label: "Gewissen und Verantwortung",
      },
      {
        id: "lb3",
        label: "Angewandte Ethik: Medizinethik oder Medienethik",
      },
    ],
    "wirtschaftsschule|10|ethik|zweistufig": [
      {
        id: "lb1",
        label: "Erwachsen sein als Frau und Mann",
      },
      {
        id: "lb2",
        label: "Angewandte Ethik: Medizinethik",
      },
    ],
    "wirtschaftsschule|10|evangelische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label: "Religiöse und nicht-religiöse Sinnangebote",
      },
      {
        id: "lb2",
        label: "Die Frage nach Gott",
      },
      {
        id: "lb3",
        label: "Kirche in der Welt",
      },
      {
        id: "lb4",
        label: "Verantwortung übernehmen",
      },
    ],
    "wirtschaftsschule|10|evangelische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label: "Religiöse und nicht-religiöse Sinnangebote",
      },
      {
        id: "lb2",
        label: "Die Frage nach Gott",
      },
      {
        id: "lb3",
        label: "Kirche in der Welt",
      },
      {
        id: "lb4",
        label: "Verantwortung übernehmen",
      },
    ],
    "wirtschaftsschule|10|evangelische-religionslehre|zweistufig": [
      {
        id: "lb1",
        label: "Religiöse und nicht-religiöse Sinnangebote",
      },
      {
        id: "lb2",
        label: "Kirche in der Welt",
      },
    ],
    "wirtschaftsschule|10|fit_for_finance": [
      {
        id: "lb1",
        label: "Geld verdienen und versteuern",
      },
      {
        id: "lb2",
        label: "Bewusstsein für Schulden entwickeln",
      },
      {
        id: "lb3",
        label: "Geld sparen und anlegen",
      },
      {
        id: "lb4",
        label: "Absichern und vorsorgen",
      },
      {
        id: "lb5",
        label: "Eine Wohnung mieten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|gamification": [
      {
        id: "lb1",
        label: "Gesellschaftsspiele entschlüsseln",
      },
      {
        id: "lb2",
        label: "Digitale Spiele untersuchen und bewerten",
      },
      {
        id: "lb3",
        label: "Mit Lernspielen motivieren und fördern",
      },
      {
        id: "lb4",
        label: "Gamification identifizieren und nutzen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|gesundheit": [
      {
        id: "lb1",
        label: "Gesundheitsbewusst leben",
      },
      {
        id: "lb2",
        label: "Medizinische Zusammenhänge erkennen",
      },
      {
        id: "lb3",
        label: "Im Gesundheitssystem orientieren",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|gpug-ws|dreistufig": [
      {
        id: "lb1",
        label:
          "Rekurs: Alltagsleben und Demokratisierungsprozess im Nachkriegsdeutschland",
      },
      {
        id: "lb2",
        label:
          "Nationale Entwicklungen: Deutschland von der Teilung über die Wiedervereinigung bis zur Gegenwart",
      },
      {
        id: "lb3",
        label: "Internationale Entwicklungen (nach 1945) bis heute",
      },
      {
        id: "lb4",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 3 zu integrieren)",
      },
    ],
    "wirtschaftsschule|10|gpug-ws|vierstufig": [
      {
        id: "lb1",
        label:
          "Rekurs: Alltagsleben und Demokratisierungsprozess im Nachkriegsdeutschland",
      },
      {
        id: "lb2",
        label:
          "Nationale Entwicklungen: Deutschland von der Teilung über die Wiedervereinigung bis zur Gegenwart",
      },
      {
        id: "lb3",
        label: "Internationale Entwicklungen (nach 1945) bis heute",
      },
      {
        id: "lb4",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 3 zu integrieren)",
      },
    ],
    "wirtschaftsschule|10|informationsverarbeitung": [
      {
        id: "lb1",
        label: "Sachgemäß und rationell mit dem Computer umgehen",
      },
      {
        id: "lb2",
        label:
          "Moderne Kommunikationsmöglichkeiten zur Berufsorientierung nutzen",
      },
      {
        id: "lb3",
        label:
          "Standardsoftware nutzen, um betriebliche Aufgaben zu bewältigen",
      },
    ],
    "wirtschaftsschule|10|katholische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label: "Grenzen erkennen – auf der Suche nach dem rechten Maß",
      },
      {
        id: "lb2",
        label: "„Wo ist nun dein Gott?“ – Anfragen und Erfahrungen",
      },
      {
        id: "lb3",
        label: "Jesus Christus – Fragen und Bekenntnis",
      },
      {
        id: "lb4",
        label: "Kirche in der Welt – Christsein heute",
      },
    ],
    "wirtschaftsschule|10|katholische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label: "Grenzen erkennen – auf der Suche nach dem rechten Maß",
      },
      {
        id: "lb2",
        label: "„Wo ist nun dein Gott?“ – Anfragen und Erfahrungen",
      },
      {
        id: "lb3",
        label: "Jesus Christus – Fragen und Bekenntnis",
      },
      {
        id: "lb4",
        label: "Kirche in der Welt – Christsein heute",
      },
    ],
    "wirtschaftsschule|10|katholische-religionslehre|zweistufig": [
      {
        id: "lb1",
        label: "Grenzen erkennen – auf der Suche nach dem rechten Maß",
      },
      {
        id: "lb2",
        label: "„Wo ist nun dein Gott?“ – Anfragen und Erfahrungen",
      },
    ],
    "wirtschaftsschule|10|life_skills": [
      {
        id: "lb1",
        label: "Umgang mit Emotionen",
      },
      {
        id: "lb2",
        label: "Gelingende Kommunikation",
      },
      {
        id: "lb3",
        label: "Motivation und Zielsetzung",
      },
      {
        id: "lb4",
        label: "Selbstorganisation und Selbstfürsorge",
      },
      {
        id: "lb5",
        label: "Entdecke Deine beruflichen Möglichkeiten",
      },
    ],
    "wirtschaftsschule|10|mathematik|dreistufig": [
      {
        id: "lb1",
        label: "Finanzmathematik (2)",
      },
      {
        id: "lb2",
        label: "Raumgeometrie (2)",
      },
      {
        id: "lb3",
        label: "Trigonometrie (2)",
      },
      {
        id: "lb4",
        label: "Lineare und quadratische Funktionen",
      },
      {
        id: "lb5",
        label: "Zusammengesetzte Zufallsexperimente",
      },
    ],
    "wirtschaftsschule|10|mathematik|vierstufig": [
      {
        id: "lb1",
        label: "Finanzmathematik (2)",
      },
      {
        id: "lb2",
        label: "Raumgeometrie (2)",
      },
      {
        id: "lb3",
        label: "Trigonometrie (2)",
      },
      {
        id: "lb4",
        label: "Lineare und quadratische Funktionen",
      },
      {
        id: "lb5",
        label: "Zusammengesetzte Zufallsexperimente",
      },
    ],
    "wirtschaftsschule|10|mathematik|zweistufig": [
      {
        id: "lb1",
        label: "Funktionaler Zusammenhang (1)",
      },
      {
        id: "lb2",
        label: "Lineare Gleichungssysteme",
      },
      {
        id: "lb3",
        label: "Quadratische Gleichungen",
      },
      {
        id: "lb4",
        label: "Funktionaler Zusammenhang (2)",
      },
      {
        id: "lb5",
        label: "Strahlensätze",
      },
      {
        id: "lb6",
        label: "Trigonometrie (1)",
      },
      {
        id: "lb7",
        label: "Raum und Form (1)",
      },
    ],
    "wirtschaftsschule|10|oebdb": [
      {
        id: "lb1",
        label: "Pflichtlernbereich: Grundlegende digitale Kompetenzen anwenden",
      },
      {
        id: "lb2",
        label: "Pflichtlernbereich: Im privaten Kontext einkaufen",
      },
      {
        id: "lb3",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext einkaufen",
      },
      {
        id: "lb4",
        label: "Pflichtlernbereich: Im privaten Kontext verkaufen",
      },
      {
        id: "lb5",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext verkaufen",
      },
      {
        id: "lb6",
        label: "Pflichtlernbereich: Wertströme und Werte beurteilen",
      },
      {
        id: "lb7",
        label: "Pflichtlernbereich: Künstliche Intelligenz nutzen",
      },
      {
        id: "lb8",
        label: "Pflichtlernbereich: Sich in der Berufswelt orientieren",
      },
      {
        id: "lb9",
        label: "Wahllernbereich: Informationen im Internet",
      },
      {
        id: "lb10",
        label: "Wahllernbereich: Eigene Spuren im Netz",
      },
      {
        id: "lb11",
        label: "Wahllernbereich: Selbstdarstellung im Netz",
      },
      {
        id: "lb12",
        label: "Wahllernbereich: Cybermobbing",
      },
      {
        id: "lb13",
        label: "Wahllernbereich: Digitale Medien erstellen",
      },
      {
        id: "lb14",
        label: "Wahllernbereich: Extended Reality nutzen",
      },
      {
        id: "lb15",
        label: "Wahllernbereich: Lebensmittel wertschätzen",
      },
      {
        id: "lb16",
        label: "Wahllernbereich: Zukunftsvisionen entwickeln",
      },
      {
        id: "lb17",
        label: "Wahllernbereich: Eine unternehmerische Idee entwickel",
      },
      {
        id: "lb18",
        label: "Wahllernbereich: Beeinflussung durch Werbung erkennen",
      },
      {
        id: "lb19",
        label: "Wahllernbereich: Einen Secondhand-Laden betreiben",
      },
      {
        id: "lb20",
        label: "Wahllernbereich: Sich ehrenamtlich engagieren",
      },
      {
        id: "lb21",
        label: "Wahllernbereich: Eine Veranstaltung durchführen",
      },
      {
        id: "lb22",
        label: "Wahllernbereich: Eigene Talente entdecken",
      },
    ],
    "wirtschaftsschule|10|pug": [
      {
        id: "lb1",
        label: "Lebenswelt und Mitgestaltung",
      },
      {
        id: "lb2",
        label: "Zusammenleben in der Gesellschaft",
      },
      {
        id: "lb3",
        label: "Politische Strukturen der Bundesrepublik Deutschland",
      },
      {
        id: "lb4",
        label: "Herausforderungen der internationalen Politik",
      },
      {
        id: "lb5",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 4 zu integrieren)",
      },
    ],
    "wirtschaftsschule|10|robotik": [
      {
        id: "lb1",
        label: "Roboter im Einsatz erleben",
      },
      {
        id: "lb2",
        label: "Die Mechanik eines Roboters konstruieren",
      },
      {
        id: "lb3",
        label: "Die Elektronik eines Roboters installieren",
      },
      {
        id: "lb4",
        label: "Einen Roboter blockorientiert programmieren",
      },
      {
        id: "lb5",
        label: "Einen Roboter warten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|sport|diffsport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "wirtschaftsschule|10|sport|dreistufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|10|sport|vierstufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|10|sport|zweistufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|10|tourismus": [
      {
        id: "lb1",
        label: "Tourismus entdecken",
      },
      {
        id: "lb2",
        label: "Regionalen Tourismus untersuchen",
      },
      {
        id: "lb3",
        label: "Tourismus in der Region erleben",
      },
      {
        id: "lb4",
        label: "Reisen planen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|uebungsunternehmen|drei_vierstufig": [
      {
        id: "lb1",
        label: "Kennenlernen des Unternehmens",
      },
      {
        id: "lb2",
        label: "Einkauf",
      },
      {
        id: "lb3",
        label: "Verkauf",
      },
      {
        id: "lb4",
        label: "Personal",
      },
      {
        id: "lb5",
        label: "Marketing",
      },
      {
        id: "lb6",
        label: "Controlling",
      },
      {
        id: "lb7",
        label: "Finanzen",
      },
    ],
    "wirtschaftsschule|10|uebungsunternehmen|zweistufig": [
      {
        id: "lb1",
        label: "Kennenlernen des Unternehmens",
      },
      {
        id: "lb2",
        label: "Einkauf",
      },
      {
        id: "lb3",
        label: "Verkauf",
      },
      {
        id: "lb4",
        label: "Personal",
      },
      {
        id: "lb5",
        label: "Marketing",
      },
      {
        id: "lb6",
        label: "Controlling",
      },
      {
        id: "lb7",
        label: "Finanzen",
      },
    ],
    "wirtschaftsschule|10|umweltoekonomie": [
      {
        id: "lb1",
        label: "Energieversorgung gestalten",
      },
      {
        id: "lb2",
        label: "Mobilität managen",
      },
      {
        id: "lb3",
        label: "Umweltökonomisch konsumieren",
      },
      {
        id: "lb4",
        label: "Betriebliche Umweltökonomie untersuchen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|umwelttechnik": [
      {
        id: "lb1",
        label: "Energie einsparen",
      },
      {
        id: "lb2",
        label: "Abfall vermeiden",
      },
      {
        id: "lb3",
        label: "Lärm messen und Schutzmaßnahmen ergreifen",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|10|wirtschaftsgeografie|dreistufig": [
      {
        id: "lb1",
        label: "Den Heimatraum mitgestalten",
      },
      {
        id: "lb2",
        label: "Einen Unternehmensstandort in der Region wählen",
      },
      {
        id: "lb3",
        label:
          "Verantwortungsbewusste Konsumentscheidungen im Bereich Non-Food-Artikel treffen",
      },
      {
        id: "lb4",
        label: "Neue Beschaffungsmärkte im Ausland erschließen",
      },
      {
        id: "lb5",
        label: "Bei Naturkatastrophen aktiv helfen",
      },
      {
        id: "lb6",
        label: "Ein touristisches Produkt entwickeln",
      },
    ],
    "wirtschaftsschule|10|wirtschaftsgeografie|vierstufig": [
      {
        id: "lb1",
        label: "Einen Unternehmensstandort in der Region wählen",
      },
      {
        id: "lb2",
        label: "Neue Beschaffungsmärkte im Ausland erschließen",
      },
      {
        id: "lb3",
        label: "Ein Vertriebsnetz international aufbauen",
      },
      {
        id: "lb4",
        label: "Auf eine Krise reagieren",
      },
      {
        id: "lb5",
        label: "Ein touristisches Produkt entwickeln",
      },
      {
        id: "lb6",
        label: "International leben",
      },
    ],
    "wirtschaftsschule|11|bsk": [
      {
        id: "lb1",
        label:
          "Das Sortiment optimieren und den Absatz neuer Waren organisieren",
      },
      {
        id: "lb2",
        label: "Fit fürs Leben sein",
      },
      {
        id: "lb3",
        label: "Wettbewerbsfähig bleiben",
      },
      {
        id: "lb4",
        label: "Eine Veranstaltung zum Erfolg führen",
      },
    ],
    "wirtschaftsschule|11|deutsch|zweistufig_gueltig_ab_2627": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|11|e-commerce": [
      {
        id: "lb1",
        label:
          "Ein Bewusstsein für die Beeinflussung durch Online-Marketing entwickeln",
      },
      {
        id: "lb2",
        label: "Im privaten Kontext online einkaufen",
      },
      {
        id: "lb3",
        label: "Im privaten Kontext online verkaufen",
      },
      {
        id: "lb4",
        label: "Erste berufliche Erfahrungen im E-Commerce sammeln",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|11|ethik": [
      {
        id: "lb1",
        label: "Gewissen und Verantwortung",
      },
      {
        id: "lb2",
        label: "Angewandte Ethik: Medienethik",
      },
    ],
    "wirtschaftsschule|11|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Die Frage nach Gott",
      },
      {
        id: "lb2",
        label: "Verantwortung übernehmen",
      },
    ],
    "wirtschaftsschule|11|fit_for_finance": [
      {
        id: "lb1",
        label: "Geld verdienen und versteuern",
      },
      {
        id: "lb2",
        label: "Bewusstsein für Schulden entwickeln",
      },
      {
        id: "lb3",
        label: "Geld sparen und anlegen",
      },
      {
        id: "lb4",
        label: "Absichern und vorsorgen",
      },
      {
        id: "lb5",
        label: "Eine Wohnung mieten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|gamification": [
      {
        id: "lb1",
        label: "Gesellschaftsspiele entschlüsseln",
      },
      {
        id: "lb2",
        label: "Digitale Spiele untersuchen und bewerten",
      },
      {
        id: "lb3",
        label: "Mit Lernspielen motivieren und fördern",
      },
      {
        id: "lb4",
        label: "Gamification identifizieren und nutzen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|gesundheit": [
      {
        id: "lb1",
        label: "Gesundheitsbewusst leben",
      },
      {
        id: "lb2",
        label: "Medizinische Zusammenhänge erkennen",
      },
      {
        id: "lb3",
        label: "Im Gesundheitssystem orientieren",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|informationsverarbeitung": [
      {
        id: "lb1",
        label:
          "Standardsoftware einsetzen, um in einem Unternehmen erfolgreich zu agieren",
      },
      {
        id: "lb2",
        label:
          "Standardsoftware einsetzen, um eine Veranstaltung zum Erfolg zu führen",
      },
    ],
    "wirtschaftsschule|11|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Jesus Christus – Fragen und Bekenntnis",
      },
      {
        id: "lb2",
        label: "Kirche in der Welt – Christsein heute",
      },
    ],
    "wirtschaftsschule|11|life_skills": [
      {
        id: "lb1",
        label: "Umgang mit Emotionen",
      },
      {
        id: "lb2",
        label: "Gelingende Kommunikation",
      },
      {
        id: "lb3",
        label: "Motivation und Zielsetzung",
      },
      {
        id: "lb4",
        label: "Selbstorganisation und Selbstfürsorge",
      },
      {
        id: "lb5",
        label: "Entdecke Deine beruflichen Möglichkeiten",
      },
    ],
    "wirtschaftsschule|11|mathematik": [
      {
        id: "lb1",
        label: "Finanzmathematik",
      },
      {
        id: "lb2",
        label: "Raumgeometrie",
      },
      {
        id: "lb3",
        label: "Trigonometrie",
      },
      {
        id: "lb4",
        label: "Lineare und quadratische Funktionen",
      },
      {
        id: "lb5",
        label: "Zusammengesetzte Zufallsexperimente",
      },
    ],
    "wirtschaftsschule|11|oebdb": [
      {
        id: "lb1",
        label: "Pflichtlernbereich: Grundlegende digitale Kompetenzen anwenden",
      },
      {
        id: "lb2",
        label: "Pflichtlernbereich: Im privaten Kontext einkaufen",
      },
      {
        id: "lb3",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext einkaufen",
      },
      {
        id: "lb4",
        label: "Pflichtlernbereich: Im privaten Kontext verkaufen",
      },
      {
        id: "lb5",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext verkaufen",
      },
      {
        id: "lb6",
        label: "Pflichtlernbereich: Wertströme und Werte beurteilen",
      },
      {
        id: "lb7",
        label: "Pflichtlernbereich: Künstliche Intelligenz nutzen",
      },
      {
        id: "lb8",
        label: "Pflichtlernbereich: Sich in der Berufswelt orientieren",
      },
      {
        id: "lb9",
        label: "Wahllernbereich: Informationen im Internet",
      },
      {
        id: "lb10",
        label: "Wahllernbereich: Eigene Spuren im Netz",
      },
      {
        id: "lb11",
        label: "Wahllernbereich: Selbstdarstellung im Netz",
      },
      {
        id: "lb12",
        label: "Wahllernbereich: Cybermobbing",
      },
      {
        id: "lb13",
        label: "Wahllernbereich: Digitale Medien erstellen",
      },
      {
        id: "lb14",
        label: "Wahllernbereich: Extended Reality nutzen",
      },
      {
        id: "lb15",
        label: "Wahllernbereich: Lebensmittel wertschätzen",
      },
      {
        id: "lb16",
        label: "Wahllernbereich: Zukunftsvisionen entwickeln",
      },
      {
        id: "lb17",
        label: "Wahllernbereich: Eine unternehmerische Idee entwickel",
      },
      {
        id: "lb18",
        label: "Wahllernbereich: Beeinflussung durch Werbung erkennen",
      },
      {
        id: "lb19",
        label: "Wahllernbereich: Einen Secondhand-Laden betreiben",
      },
      {
        id: "lb20",
        label: "Wahllernbereich: Sich ehrenamtlich engagieren",
      },
      {
        id: "lb21",
        label: "Wahllernbereich: Eine Veranstaltung durchführen",
      },
      {
        id: "lb22",
        label: "Wahllernbereich: Eigene Talente entdecken",
      },
    ],
    "wirtschaftsschule|11|robotik": [
      {
        id: "lb1",
        label: "Roboter im Einsatz erleben",
      },
      {
        id: "lb2",
        label: "Die Mechanik eines Roboters konstruieren",
      },
      {
        id: "lb3",
        label: "Die Elektronik eines Roboters installieren",
      },
      {
        id: "lb4",
        label: "Einen Roboter blockorientiert programmieren",
      },
      {
        id: "lb5",
        label: "Einen Roboter warten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|11|tourismus": [
      {
        id: "lb1",
        label: "Tourismus entdecken",
      },
      {
        id: "lb2",
        label: "Regionalen Tourismus untersuchen",
      },
      {
        id: "lb3",
        label: "Tourismus in der Region erleben",
      },
      {
        id: "lb4",
        label: "Reisen planen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|uebungsunternehmen|zweistufig": [
      {
        id: "lb1",
        label: "Kennenlernen des Unternehmens",
      },
      {
        id: "lb2",
        label: "Einkauf",
      },
      {
        id: "lb3",
        label: "Verkauf",
      },
      {
        id: "lb4",
        label: "Personal",
      },
      {
        id: "lb5",
        label: "Marketing",
      },
      {
        id: "lb6",
        label: "Controlling",
      },
      {
        id: "lb7",
        label: "Finanzen",
      },
    ],
    "wirtschaftsschule|11|umweltoekonomie": [
      {
        id: "lb1",
        label: "Energieversorgung gestalten",
      },
      {
        id: "lb2",
        label: "Mobilität managen",
      },
      {
        id: "lb3",
        label: "Umweltökonomisch konsumieren",
      },
      {
        id: "lb4",
        label: "Betriebliche Umweltökonomie untersuchen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|umwelttechnik": [
      {
        id: "lb1",
        label: "Energie einsparen",
      },
      {
        id: "lb2",
        label: "Abfall vermeiden",
      },
      {
        id: "lb3",
        label: "Lärm messen und Schutzmaßnahmen ergreifen",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|11|wirtschaft_aktuell": [
      {
        id: "lb1",
        label: "Leben und Arbeiten in Deutschland",
      },
      {
        id: "lb2",
        label: "Der demographische Wandel – Herausforderung für die Wirtschaft",
      },
      {
        id: "lb3",
        label: "Grundlagen des Wirtschaftens",
      },
      {
        id: "lb4",
        label: "Märkte im Wandel",
      },
      {
        id: "lb5",
        label: "Wandel in der Arbeitswelt",
      },
      {
        id: "lb6",
        label:
          "Verbraucherschutz und verantwortungsbewusstes Verbraucherverhalten",
      },
      {
        id: "lb7",
        label: "Wirtschaftspolitik in einer globalisierten Welt",
      },
      {
        id: "lb8",
        label: "Wirtschaftliche Zusammenarbeit in der Europäischen Union",
      },
      {
        id: "lb9",
        label: "Die Weltwirtschaft gestalten",
      },
    ],
    "wirtschaftsschule|5|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|5|digitales-leben-und-arbeiten": [
      {
        id: "lb1",
        label: "Die digitale Bildungsinfrastruktur nutzen",
      },
      {
        id: "lb2",
        label: "Digitale Medien nutzen",
      },
      {
        id: "lb3",
        label: "Digitale Medien erstellen",
      },
      {
        id: "lb4",
        label: "Nutzung digitaler Medien kritisch hinterfragen",
      },
      {
        id: "lb5",
        label: "Cybermobbing",
      },
    ],
    "wirtschaftsschule|5|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|5|ethik": [
      {
        id: "lb1",
        label: "Meine Wirklichkeit und ich",
      },
      {
        id: "lb2",
        label: "Leben in der Familie",
      },
      {
        id: "lb3",
        label: "Spielen",
      },
      {
        id: "lb4",
        label: "Feste und Riten in Religion und Brauchtum",
      },
    ],
    "wirtschaftsschule|5|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Die Bibel – Buch des Lebens",
      },
      {
        id: "lb2",
        label: "Erfahrungen mit Gott als Begleiter auf dem Lebensweg",
      },
      {
        id: "lb3",
        label: "Glaube wird sichtbar und hinterlässt Spuren",
      },
      {
        id: "lb4",
        label: "Schöpfung - Unsere Welt und unser Leben als Geschenk Gottes?",
      },
    ],
    "wirtschaftsschule|5|gpug-ws": [
      {
        id: "lb1",
        label: "Politische Mitwirkungsmöglichkeiten",
      },
      {
        id: "lb2",
        label: "Gesellschaftliches Miteinander",
      },
      {
        id: "lb3",
        label: "Der Mensch in der Welt von gestern, heute und morgen",
      },
      {
        id: "lb4",
        label: "Menschen in vorgeschichtlicher Zeit",
      },
      {
        id: "lb5",
        label: "Gesellschaftliche Herausforderungen",
      },
      {
        id: "lb6",
        label: "Methodenkompetenz",
      },
    ],
    "wirtschaftsschule|5|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Auf Gott vertrauen – einen neuen Anfang wagen",
      },
      {
        id: "lb2",
        label: "„Umsorge mich mit deiner Liebe“ – beten und meditieren",
      },
      {
        id: "lb3",
        label: "Erfahrungen mit Gott – Die Heilige Schrift",
      },
      {
        id: "lb4",
        label:
          '„In jenen Tagen trat einer auf" – Jesus im Blickwinkel seiner Zeit und Umwelt',
      },
      {
        id: "lb5",
        label: "Leben in der Pfarrgemeinde – Eingebundensein in die Kirche",
      },
    ],
    "wirtschaftsschule|5|mathematik": [
      {
        id: "lb1",
        label: "Natürliche Zahlen",
      },
      {
        id: "lb2",
        label: "Rechnen mit natürlichen Zahlen",
      },
      {
        id: "lb3",
        label: "Geometrische Grundvorstellungen",
      },
      {
        id: "lb4",
        label: "Geometrische Figuren",
      },
      {
        id: "lb5",
        label: "Ganze Zahlen",
      },
      {
        id: "lb6",
        label: "Größen im Alltag",
      },
      {
        id: "lb7",
        label: "Auswertung von Daten",
      },
    ],
    "wirtschaftsschule|5|musischaesthetischebildung": [
      {
        id: "lb1",
        label: "Kunst: Bilder und Objekte kreativ adaptieren",
      },
      {
        id: "lb2",
        label: "Kunst: Bilder gestalten",
      },
      {
        id: "lb3",
        label: "Kunst: Kunst bewusst wahrnehmen",
      },
      {
        id: "lb4",
        label: "Kunst: Die Handschrift als Kunst",
      },
      {
        id: "lb5",
        label:
          "Musik: Lieder aus verschiedenen Regionen Deutschlands singen, rhythmisch begleiten und durch Bewegung darstellen",
      },
      {
        id: "lb6",
        label:
          "Musik: Zeitreise durch die verschiedenen Epochen der Musikgeschichte",
      },
      {
        id: "lb7",
        label: "Musik: Grundlagen der Musik",
      },
      {
        id: "lb8",
        label:
          "Kunst und Musik: Zeitreise durch die verschiedenen Epochen der Musikgeschichte verknüpft mit Aspekten der Kunst",
      },
    ],
    "wirtschaftsschule|5|mut": [
      {
        id: "lb1",
        label: "Sich in der Natur bewegen",
      },
      {
        id: "lb2",
        label: "Die Landwirtschaft erleben",
      },
      {
        id: "lb3",
        label: "Im Haushalt Aufgaben übernehmen",
      },
      {
        id: "lb4",
        label: "Sich selbst wertschätzen",
      },
      {
        id: "lb5",
        label: "Den schulischen Alltag bewältigen",
      },
      {
        id: "lb6",
        label: "Naturwissenschaften im Alltag erleben",
      },
      {
        id: "lb7",
        label: "Lifehacks nutzen",
      },
    ],
    "wirtschaftsschule|5|oeb": [
      {
        id: "lb1",
        label: "Als Klasse im Team erfolgreich arbeiten",
      },
      {
        id: "lb2",
        label: "Den eigenen Schulalltag organisieren",
      },
      {
        id: "lb3",
        label: "Ökonomie spielerisch und praxisnah entdecken",
      },
      {
        id: "lb4",
        label: "Mit Taschengeld verantwortungsbewusst umgehen",
      },
      {
        id: "lb5",
        label: "Die Welt der Werbung erkunden",
      },
    ],
    "wirtschaftsschule|5|sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Firness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|6|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|6|digitales-leben-und-arbeiten": [
      {
        id: "lb1",
        label:
          "Vorhandene Dokumente mit einem Textverarbeitungsprogramm gestalten",
      },
      {
        id: "lb2",
        label: "Eine Präsentation erstellen",
      },
      {
        id: "lb3",
        label: "Informationen im Internet finden",
      },
      {
        id: "lb4",
        label: "Mobile digitale Endgeräte auswählen",
      },
      {
        id: "lb5",
        label:
          "Dokumente mithilfe von Tabellen in einem Textverarbeitungsprogramm gestalten",
      },
      {
        id: "lb6",
        label: "An einer Videokonferenz teilnehmen",
      },
    ],
    "wirtschaftsschule|6|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|6|ethik": [
      {
        id: "lb1",
        label: "Das Fremde verstehen und damit richtig umgehen",
      },
      {
        id: "lb2",
        label: "Elektronische Medien im eigenen Leben",
      },
      {
        id: "lb3",
        label: "Was ich mag und was mir gut tut",
      },
    ],
    "wirtschaftsschule|6|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Orientierung im Zusammenleben",
      },
      {
        id: "lb2",
        label: "Zeit und Umwelt Jesu",
      },
      {
        id: "lb3",
        label: "Leben und Botschaft Jesu",
      },
      {
        id: "lb4",
        label: "Feste und Bräuche",
      },
      {
        id: "lb5",
        label: "Wer bin ich?",
      },
    ],
    "wirtschaftsschule|6|gpug-ws": [
      {
        id: "lb1",
        label: "Der Mensch in der Welt von gestern, heute und morgen",
      },
      {
        id: "lb2",
        label: "Menschen in vorgeschichtlicher Zeit",
      },
      {
        id: "lb3",
        label: "Ägypten als Beispiel einer frühen Hochkultur",
      },
      {
        id: "lb4",
        label: "Athen in der Antike",
      },
      {
        id: "lb5",
        label: "Römische Antike",
      },
      {
        id: "lb6",
        label: "Der Wandel von der Antike zum Mittelalter",
      },
      {
        id: "lb7",
        label: "Methodenkompetenz",
      },
    ],
    "wirtschaftsschule|6|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Jesus von Nazareth – wer war er wirklich?",
      },
      {
        id: "lb2",
        label: "Menschen fragen nach Gott – auf der Suche nach Antworten",
      },
      {
        id: "lb3",
        label: "Ein Buch wie kein anderes: die Bibel",
      },
      {
        id: "lb4",
        label: "Von Gott erwählt: König David",
      },
      {
        id: "lb5",
        label: "Neu sehen und verstehen: die verändernde Kraft des Hl. Geistes",
      },
      {
        id: "lb6",
        label: "Alles hat seine Zeit: Zeit haben für sich und andere",
      },
    ],
    "wirtschaftsschule|6|mathematik": [
      {
        id: "lb1",
        label: "Natürliche Zahlen",
      },
      {
        id: "lb2",
        label: "Ganze Zahlen",
      },
      {
        id: "lb3",
        label: "Bruchzahlen Q",
      },
      {
        id: "lb4",
        label: "Geometrische Grundvorstellungen",
      },
      {
        id: "lb5",
        label: "Figuren- und Raumgeometrie",
      },
      {
        id: "lb6",
        label: "Geometrische Abbildungen",
      },
      {
        id: "lb7",
        label: "Proportionale Größen",
      },
      {
        id: "lb8",
        label: "Terme",
      },
      {
        id: "lb9",
        label: "Daten und Zufall",
      },
    ],
    "wirtschaftsschule|6|musischaesthetischebildung": [
      {
        id: "lb1",
        label: "Kunst: Bilder gestalten",
      },
      {
        id: "lb2",
        label: "Kunst: Kunst bewusst wahrnehmen",
      },
      {
        id: "lb3",
        label: "Kunst: Schrift gestalten",
      },
      {
        id: "lb4",
        label: "Musik: Lieder aus aller Welt singen und rhythmisch begleiten",
      },
      {
        id: "lb5",
        label: "Musik: Musik bewusst hören",
      },
      {
        id: "lb6",
        label: "Musik: Klanggeschichten erfinden und präsentieren",
      },
    ],
    "wirtschaftsschule|6|mut": [
      {
        id: "lb1",
        label: "Von der Natur lernen",
      },
      {
        id: "lb2",
        label: "Sich gesundheitsbewusst ernähren",
      },
      {
        id: "lb3",
        label: "Wasser verantwortungsbewusst nutzen",
      },
    ],
    "wirtschaftsschule|6|oeb": [
      {
        id: "lb1",
        label: "Einen schulischen Ausflug organisieren",
      },
      {
        id: "lb2",
        label: "Bewusst einkaufen",
      },
      {
        id: "lb3",
        label: "Freizeit sinnvoll gestalten",
      },
      {
        id: "lb4",
        label: "Verkaufserfolge erzielen",
      },
      {
        id: "lb5",
        label: "Ein nachhaltiges Projekt umsetzen",
      },
      {
        id: "lb6",
        label: "Sich als Teil der Wirtschaftseinheit Familie verstehen",
      },
      {
        id: "lb7",
        label: "Persönlichkeit stärken",
      },
      {
        id: "lb8",
        label: "Wertvorstellungen entwickeln",
      },
    ],
    "wirtschaftsschule|6|sport": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|7|bsk": [
      {
        id: "lb1",
        label: "Ein Unternehmen in der Region erkunden",
      },
      {
        id: "lb2",
        label: "Als privater Endverbraucher wirtschaftlich handeln",
      },
    ],
    "wirtschaftsschule|7|deutsch": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|7|englisch": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|7|ethik": [
      {
        id: "lb1",
        label: "Ich und die Gleichaltrigen",
      },
      {
        id: "lb2",
        label: "Sich für andere einsetzen",
      },
      {
        id: "lb3",
        label: "Den Wert der Natur erkennen",
      },
      {
        id: "lb4",
        label: "Mensch und Natur in den Religionen",
      },
    ],
    "wirtschaftsschule|7|evangelische-religionslehre": [
      {
        id: "lb1",
        label: "Bereicherung durch Verschiedenheit",
      },
      {
        id: "lb2",
        label: "Paulus überwindet Grenzen",
      },
      {
        id: "lb3",
        label: "Frühe Kirche im Wandel",
      },
      {
        id: "lb4",
        label: "Ich werde erwachsen",
      },
      {
        id: "lb5",
        label: "Islam",
      },
    ],
    "wirtschaftsschule|7|gpug-ws": [
      {
        id: "lb1",
        label: "Rekurs – Leben in Frühgeschichte und Antike",
      },
      {
        id: "lb2",
        label: "Werte und Normen im Mittelalter und heute",
      },
      {
        id: "lb3",
        label:
          "Wandel in Gesellschaft und Staatenwelt vom Mittelalter zur Frühen Neuzeit",
      },
      {
        id: "lb4",
        label: "Religiöse Konflikte und Umbrüche im konfessionellen Zeitalter",
      },
      {
        id: "lb5",
        label: "Streben nach unumschränkter Herrschaft im Absolutismus",
      },
      {
        id: "lb6",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 5 zu integrieren)",
      },
    ],
    "wirtschaftsschule|7|informationsverarbeitung": [
      {
        id: "lb1",
        label: "Sachgemäß und rationell mit dem Computer umgehen",
      },
      {
        id: "lb2",
        label: "Soziale Netzwerke verantwortungsbewusst nutzen",
      },
      {
        id: "lb3",
        label:
          "Informationen suchen, bewerten, verarbeiten und präsentieren, um ein Unternehmen in der Region zu erkunden",
      },
      {
        id: "lb4",
        label:
          "Kalkulationen mit einem Tabellenkalkulationsprogramm durchführen, um als privater Endverbraucher wirtschaftlich zu handeln",
      },
      {
        id: "lb5",
        label: "Digitale Werbeträger gestalten und bewerten",
      },
      {
        id: "lb6",
        label: "Kaufverträge im Internet abschließen",
      },
    ],
    "wirtschaftsschule|7|katholische-religionslehre": [
      {
        id: "lb1",
        label: "Auf dem Weg – Gott suchen und finden",
      },
      {
        id: "lb2",
        label: "Biblische Weisungen – Orientierung für ein gelingendes Leben",
      },
      {
        id: "lb3",
        label:
          "„Bei euch aber soll es anders sein!“ – Jesu Botschaft vom Reich Gottes",
      },
      {
        id: "lb4",
        label: "„Dass alle eins seien“ – Verbindendes führt zusammen!",
      },
      {
        id: "lb5",
        label: "Islam – Hingabe an Gott",
      },
    ],
    "wirtschaftsschule|7|mathematik|vierstufig": [
      {
        id: "lb1",
        label: "Prozentrechnung",
      },
      {
        id: "lb2",
        label: "Terme und lineare Gleichungen",
      },
      {
        id: "lb3",
        label: "Geometrische Grundvorstellung",
      },
      {
        id: "lb4",
        label: "Raum und Form (1)",
      },
      {
        id: "lb5",
        label: "Daten und Zufall (1)",
      },
    ],
    "wirtschaftsschule|7|mensch-und-umwelt": [
      {
        id: "lb1",
        label: "An einem Bildschirmarbeitsplatz ergonomisch arbeiten",
      },
      {
        id: "lb2",
        label: "Mobiltelefone verantwortungsbewusst nutzen",
      },
      {
        id: "lb3",
        label: "Mobilität effizient gestalten",
      },
    ],
    "wirtschaftsschule|7|musischaesthetischebildung": [
      {
        id: "lb1",
        label: "Kunst",
      },
      {
        id: "lb2",
        label: "Musik",
      },
    ],
    "wirtschaftsschule|7|mut": [
      {
        id: "lb1",
        label: "Erste Hilfe leisten",
      },
      {
        id: "lb2",
        label: "Ergonomisch arbeiten",
      },
      {
        id: "lb3",
        label: "Gesund kochen",
      },
      {
        id: "lb4",
        label: "Sexualität verantwortungsbewusst leben",
      },
      {
        id: "lb5",
        label: "Mit dem Smartphone sinnvoll umgehen",
      },
      {
        id: "lb6",
        label: "Mobilität im Alltag",
      },
      {
        id: "lb7",
        label: "Lifehacks nutzen",
      },
      {
        id: "lb8",
        label: "Eine Wetterstation betreiben",
      },
      {
        id: "lb9",
        label: "Eine nachhaltige Exkursion durchführen",
      },
      {
        id: "lb10",
        label: "Ein Repaircafé betreiben",
      },
      {
        id: "lb11",
        label: "Wald nutzen und schützen",
      },
      {
        id: "lb12",
        label: "Nachhaltig leben",
      },
      {
        id: "lb13",
        label: "Astronomie",
      },
      {
        id: "lb14",
        label: "3D-Drucker nutzen",
      },
      {
        id: "lb15",
        label: "Flugobjekte bauen und einsetzen",
      },
      {
        id: "lb16",
        label: "Programmieren",
      },
      {
        id: "lb17",
        label: "Einfache Roboter bauen und programmieren",
      },
      {
        id: "lb18",
        label: "Prinzipien der Bionik anwenden",
      },
      {
        id: "lb19",
        label: "Elektrische Energie erzeugen und nutzen",
      },
      {
        id: "lb20",
        label: "Prinzipien der Mechanik anwenden",
      },
    ],
    "wirtschaftsschule|7|oebdb": [
      {
        id: "lb1",
        label: "Pflichtlernbereich: Grundlegende digitale Kompetenzen anwenden",
      },
      {
        id: "lb2",
        label: "Pflichtlernbereich: Im privaten Kontext einkaufen",
      },
      {
        id: "lb3",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext einkaufen",
      },
      {
        id: "lb4",
        label: "Pflichtlernbereich: Im privaten Kontext verkaufen",
      },
      {
        id: "lb5",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext verkaufen",
      },
      {
        id: "lb6",
        label: "Pflichtlernbereich: Wertströme und Werte beurteilen",
      },
      {
        id: "lb7",
        label: "Pflichtlernbereich: Künstliche Intelligenz nutzen",
      },
      {
        id: "lb8",
        label: "Pflichtlernbereich: Sich in der Berufswelt orientieren",
      },
      {
        id: "lb9",
        label: "Wahllernbereich: Informationen im Internet",
      },
      {
        id: "lb10",
        label: "Wahllernbereich: Eigene Spuren im Netz",
      },
      {
        id: "lb11",
        label: "Wahllernbereich: Selbstdarstellung im Netz",
      },
      {
        id: "lb12",
        label: "Wahllernbereich: Cybermobbing",
      },
      {
        id: "lb13",
        label: "Wahllernbereich: Digitale Medien erstellen",
      },
      {
        id: "lb14",
        label: "Wahllernbereich: Extended Reality nutzen",
      },
      {
        id: "lb15",
        label: "Wahllernbereich: Lebensmittel wertschätzen",
      },
      {
        id: "lb16",
        label: "Wahllernbereich: Zukunftsvisionen entwickeln",
      },
      {
        id: "lb17",
        label: "Wahllernbereich: Eine unternehmerische Idee entwickeln",
      },
      {
        id: "lb18",
        label: "Wahllernbereich: Beeinflussung durch Werbung erkennen",
      },
      {
        id: "lb19",
        label: "Wahllernbereich: Einen Secondhand-Laden betreiben",
      },
      {
        id: "lb20",
        label: "Wahllernbereich: Sich ehrenamtlich engagieren",
      },
      {
        id: "lb21",
        label: "Wahllernbereich: Eine Veranstaltung durchführen",
      },
      {
        id: "lb22",
        label: "Wahllernbereich: Eigene Talente entdecken",
      },
    ],
    "wirtschaftsschule|7|sport|diffsport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "wirtschaftsschule|7|sport|vierstufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|8|bsk|dreistufig": [
      {
        id: "lb1",
        label: "Kaufverträge abschließen",
      },
      {
        id: "lb2",
        label: "Sich einen Einblick in die Arbeitswelt verschaffen",
      },
      {
        id: "lb3",
        label: "Eine Veranstaltung zum Erfolg führen",
      },
      {
        id: "lb4",
        label:
          "In einem kleinen, regional tätigen Unternehmen erfolgreich agieren",
      },
    ],
    "wirtschaftsschule|8|bsk|vierstufig": [
      {
        id: "lb1",
        label: "Sich einen Einblick in die Arbeitswelt verschaffen",
      },
      {
        id: "lb2",
        label:
          "In einem kleinen, regional tätigen Unternehmen erfolgreich agieren",
      },
      {
        id: "lb3",
        label: "Eine Veranstaltung zum Erfolg führen",
      },
    ],
    "wirtschaftsschule|8|deutsch|dreistufig_gueltig_ab_2425": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|8|deutsch|vierstufig_gueltig_ab_2425": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|8|englisch|dreistufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|8|englisch|vierstufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|8|ethik|dreistufig": [
      {
        id: "lb1",
        label: "Das eigene Leben gestalten und einen Sinn finden",
      },
      {
        id: "lb2",
        label: "Glück",
      },
      {
        id: "lb3",
        label: "Ethik in der virtuellen Welt",
      },
      {
        id: "lb4",
        label: "Mit Konsumgütern verantwortungsbewusst umgehen",
      },
    ],
    "wirtschaftsschule|8|ethik|vierstufig": [
      {
        id: "lb1",
        label: "Das eigene Leben gestalten und einen Sinn finden",
      },
      {
        id: "lb2",
        label: "Glück",
      },
      {
        id: "lb3",
        label: "Ethik in der virtuellen Welt",
      },
      {
        id: "lb4",
        label: "Mit Konsumgütern verantwortungsbewusst umgehen",
      },
    ],
    "wirtschaftsschule|8|evangelische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label: "Martin Luther und die Reformation",
      },
      {
        id: "lb2",
        label: "Ökumene – Einheit in der Vielfalt",
      },
      {
        id: "lb3",
        label: "Propheten und die Frage nach Recht und Gerechtigkeit",
      },
      {
        id: "lb4",
        label: "Diakonie – praktizierte Nächstenliebe",
      },
      {
        id: "lb5",
        label: "Buddhismus – eine fernöstliche Religion",
      },
    ],
    "wirtschaftsschule|8|evangelische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label: "Martin Luther und die Reformation",
      },
      {
        id: "lb2",
        label: "Ökumene – Einheit in der Vielfalt",
      },
      {
        id: "lb3",
        label: "Propheten und die Frage nach Recht und Gerechtigkeit",
      },
      {
        id: "lb4",
        label: "Diakonie – praktizierte Nächstenliebe",
      },
      {
        id: "lb5",
        label: "Buddhismus – eine fernöstliche Religion",
      },
    ],
    "wirtschaftsschule|8|gpug-ws|dreistufig": [
      {
        id: "lb1",
        label:
          "Rekurs: Die Entwicklung der politischen Mitbestimmungsmöglichkeiten vom Absolutismus bis hin zur Aufklärung als Grundlage für unsere moderne Demokratie",
      },
      {
        id: "lb2",
        label: "Die Anfänge einer Demokratiebewegung in Deutschland",
      },
      {
        id: "lb3",
        label: "Wandel der Arbeits- und Lebenswelt",
      },
      {
        id: "lb4",
        label: "Verfassung, Sozialpolitik und Alltag im Deutschen Kaiserreich",
      },
      {
        id: "lb5",
        label: "Methodenkompetenz (in die Lernbereiche 1 bis 4 zu integrieren)",
      },
    ],
    "wirtschaftsschule|8|gpug-ws|vierstufig": [
      {
        id: "lb1",
        label:
          "Rekurs: Die Entwicklung der politischen Mitbestimmungsmöglichkeiten vom Absolutismus bis hin zur Aufklärung als Grundlage für unsere moderne Demokratie",
      },
      {
        id: "lb2",
        label: "Die Anfänge einer Demokratiebewegung in Deutschland",
      },
      {
        id: "lb3",
        label: "Wandel der Arbeits- und Lebenswelt",
      },
      {
        id: "lb4",
        label: "Verfassung, Sozialpolitik und Alltag im Deutschen Kaiserreich",
      },
      {
        id: "lb5",
        label: "Methodenkompetenz (in die Lernbereiche 1 bis 4 zu integrieren)",
      },
    ],
    "wirtschaftsschule|8|informationsverarbeitung|dreistufig": [
      {
        id: "lb1",
        label: "Sachgemäß und rationell mit dem Computer umgehen",
      },
      {
        id: "lb2",
        label: "Soziale Netzwerke verantwortungsbewusst nutzen",
      },
      {
        id: "lb3",
        label:
          "Standardsoftware einsetzen, um eine Veranstaltung zum Erfolg zu führen",
      },
    ],
    "wirtschaftsschule|8|informationsverarbeitung|vierstufig": [
      {
        id: "lb1",
        label:
          "Moderne Kommunikationsmöglichkeiten nutzen, um sich einen Einblick in die Arbeitswelt zu verschaffen",
      },
      {
        id: "lb2",
        label:
          "Standardsoftware einsetzen, um eine Veranstaltung zum Erfolg zu führen",
      },
      {
        id: "lb3",
        label:
          "Standardsoftware einsetzen, um in einem Unternehmen erfolgreich zu agieren",
      },
    ],
    "wirtschaftsschule|8|katholische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label:
          "„Wenn er mich doch küsste ...“ – Sexualität als Ausdruck personaler Liebe",
      },
      {
        id: "lb2",
        label: "Unfassbar und geheimnisvoll? – Von Gott in Bildern sprechen",
      },
      {
        id: "lb3",
        label:
          "„Ich lege meine Worte in deinen Mund“ – Prophetinnen und Propheten",
      },
      {
        id: "lb4",
        label: "Jesus Christus – das Sakrament Gottes",
      },
      {
        id: "lb5",
        label:
          "Hinduismus und Buddhismus – aus dem Rad der Wiedergeburten ausbrechen",
      },
    ],
    "wirtschaftsschule|8|katholische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label:
          "„Wenn er mich doch küsste ...“ – Sexualität als Ausdruck personaler Liebe",
      },
      {
        id: "lb2",
        label: "Unfassbar und geheimnisvoll? – Von Gott in Bildern sprechen",
      },
      {
        id: "lb3",
        label:
          "„Ich lege meine Worte in deinen Mund“ – Prophetinnen und Propheten",
      },
      {
        id: "lb4",
        label: "Jesus Christus – das Sakrament Gottes",
      },
      {
        id: "lb5",
        label:
          "Hinduismus und Buddhismus – aus dem Rad der Wiedergeburten ausbrechen",
      },
    ],
    "wirtschaftsschule|8|mathematik|dreistufig": [
      {
        id: "lb1",
        label: "Finanzmathematik (1)",
      },
      {
        id: "lb2",
        label: "Potenzen und Wurzeln",
      },
      {
        id: "lb3",
        label: "Pythagoras",
      },
      {
        id: "lb4",
        label: "Raum und Form (2)",
      },
      {
        id: "lb5",
        label: "Funktionaler Zusammenhang (1)",
      },
      {
        id: "lb6",
        label: "Lineare Gleichungssysteme",
      },
      {
        id: "lb7",
        label: "Daten und Zufall (2)",
      },
    ],
    "wirtschaftsschule|8|mathematik|vierstufig": [
      {
        id: "lb1",
        label: "Finanzmathematik (1)",
      },
      {
        id: "lb2",
        label: "Potenzen und Wurzeln",
      },
      {
        id: "lb3",
        label: "Pythagoras",
      },
      {
        id: "lb4",
        label: "Raum und Form (2)",
      },
      {
        id: "lb5",
        label: "Funktionaler Zusammenhang (1)",
      },
      {
        id: "lb6",
        label: "Lineare Gleichungssysteme",
      },
      {
        id: "lb7",
        label: "Daten und Zufall (2)",
      },
    ],
    "wirtschaftsschule|8|mensch-und-umwelt|dreistufig": [
      {
        id: "lb1",
        label: "Elektrische Haushaltsgeräte effizient nutzen",
      },
      {
        id: "lb2",
        label: "Wald als wichtigen Lebensraum schützen",
      },
      {
        id: "lb3",
        label: "Sexualität verantwortungsbewusst leben",
      },
    ],
    "wirtschaftsschule|8|mensch-und-umwelt|vierstufig": [
      {
        id: "lb1",
        label: "Elektrische Haushaltsgeräte effizient nutzen",
      },
      {
        id: "lb2",
        label: "Wald als wichtigen Lebensraum schützen",
      },
      {
        id: "lb3",
        label: "Sexualität verantwortungsbewusst leben",
      },
    ],
    "wirtschaftsschule|8|musischaesthetischebildung|dreistufig": [
      {
        id: "lb1",
        label: "Kunst",
      },
      {
        id: "lb2",
        label: "Musik",
      },
    ],
    "wirtschaftsschule|8|musischaesthetischebildung|vierstufig": [
      {
        id: "lb1",
        label: "Kunst",
      },
      {
        id: "lb2",
        label: "Musik",
      },
    ],
    "wirtschaftsschule|8|mut|dreistufig": [
      {
        id: "lb1",
        label: "Erste Hilfe leisten",
      },
      {
        id: "lb2",
        label: "Ergonomisch arbeiten",
      },
      {
        id: "lb3",
        label: "Gesund kochen",
      },
      {
        id: "lb4",
        label: "Sexualität verantwortungsbewusst leben",
      },
      {
        id: "lb5",
        label: "Mit dem Smartphone sinnvoll umgehen",
      },
      {
        id: "lb6",
        label: "Mobilität im Alltag",
      },
      {
        id: "lb7",
        label: "Lifehacks nutzen",
      },
      {
        id: "lb8",
        label: "Eine Wetterstation betreiben",
      },
      {
        id: "lb9",
        label: "Eine nachhaltige Exkursion durchführen",
      },
      {
        id: "lb10",
        label: "Ein Repaircafé betreiben",
      },
      {
        id: "lb11",
        label: "Wald nutzen und schützen",
      },
      {
        id: "lb12",
        label: "Nachhaltig leben",
      },
      {
        id: "lb13",
        label: "Astronomie",
      },
      {
        id: "lb14",
        label: "3D-Drucker nutzen",
      },
      {
        id: "lb15",
        label: "Flugobjekte bauen und einsetzen",
      },
      {
        id: "lb16",
        label: "Programmieren",
      },
      {
        id: "lb17",
        label: "Einfache Roboter bauen und programmieren",
      },
      {
        id: "lb18",
        label: "Prinzipien der Bionik anwenden",
      },
      {
        id: "lb19",
        label: "Elektrische Energie erzeugen und nutzen",
      },
      {
        id: "lb20",
        label: "Prinzipien der Mechanik anwenden",
      },
    ],
    "wirtschaftsschule|8|mut|vierstufig": [
      {
        id: "lb1",
        label: "Erste Hilfe leisten",
      },
      {
        id: "lb2",
        label: "Ergonomisch arbeiten",
      },
      {
        id: "lb3",
        label: "Gesund kochen",
      },
      {
        id: "lb4",
        label: "Sexualität verantwortungsbewusst leben",
      },
      {
        id: "lb5",
        label: "Mit dem Smartphone sinnvoll umgehen",
      },
      {
        id: "lb6",
        label: "Mobilität im Alltag",
      },
      {
        id: "lb7",
        label: "Lifehacks nutzen",
      },
      {
        id: "lb8",
        label: "Eine Wetterstation betreiben",
      },
      {
        id: "lb9",
        label: "Eine nachhaltige Exkursion durchführen",
      },
      {
        id: "lb10",
        label: "Ein Repaircafé betreiben",
      },
      {
        id: "lb11",
        label: "Wald nutzen und schützen",
      },
      {
        id: "lb12",
        label: "Nachhaltig leben",
      },
      {
        id: "lb13",
        label: "Astronomie",
      },
      {
        id: "lb14",
        label: "3D-Drucker nutzen",
      },
      {
        id: "lb15",
        label: "Flugobjekte bauen und einsetzen",
      },
      {
        id: "lb16",
        label: "Programmieren",
      },
      {
        id: "lb17",
        label: "Einfache Roboter bauen und programmieren",
      },
      {
        id: "lb18",
        label: "Prinzipien der Bionik anwenden",
      },
      {
        id: "lb19",
        label: "Elektrische Energie erzeugen und nutzen",
      },
      {
        id: "lb20",
        label: "Prinzipien der Mechanik anwenden",
      },
    ],
    "wirtschaftsschule|8|oebdb|dreistufig": [
      {
        id: "lb1",
        label: "Pflichtlernbereich: Grundlegende digitale Kompetenzen anwenden",
      },
      {
        id: "lb2",
        label: "Pflichtlernbereich: Im privaten Kontext einkaufen",
      },
      {
        id: "lb3",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext einkaufen",
      },
      {
        id: "lb4",
        label: "Pflichtlernbereich: Im privaten Kontext verkaufen",
      },
      {
        id: "lb5",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext verkaufen",
      },
      {
        id: "lb6",
        label: "Pflichtlernbereich: Wertströme und Werte beurteilen",
      },
      {
        id: "lb7",
        label: "Pflichtlernbereich: Künstliche Intelligenz nutzen",
      },
      {
        id: "lb8",
        label: "Pflichtlernbereich: Sich in der Berufswelt orientieren",
      },
      {
        id: "lb9",
        label: "Wahllernbereich: Informationen im Internet",
      },
      {
        id: "lb10",
        label: "Wahllernbereich: Eigene Spuren im Netz",
      },
      {
        id: "lb11",
        label: "Wahllernbereich: Selbstdarstellung im Netz",
      },
      {
        id: "lb12",
        label: "Wahllernbereich: Cybermobbing",
      },
      {
        id: "lb13",
        label: "Wahllernbereich: Digitale Medien erstellen",
      },
      {
        id: "lb14",
        label: "Wahllernbereich: Extended Reality nutzen",
      },
      {
        id: "lb15",
        label: "Wahllernbereich: Lebensmittel wertschätzen",
      },
      {
        id: "lb16",
        label: "Wahllernbereich: Zukunftsvisionen entwickeln",
      },
      {
        id: "lb17",
        label: "Wahllernbereich: Eine unternehmerische Idee entwickeln",
      },
      {
        id: "lb18",
        label: "Wahllernbereich: Beeinflussung durch Werbung erkennen",
      },
      {
        id: "lb19",
        label: "Wahllernbereich: Einen Secondhand-Laden betreiben",
      },
      {
        id: "lb20",
        label: "Wahllernbereich: Sich ehrenamtlich engagieren",
      },
      {
        id: "lb21",
        label: "Wahllernbereich: Eine Veranstaltung durchführen",
      },
      {
        id: "lb22",
        label: "Wahllernbereich: Eigene Talente entdecken",
      },
    ],
    "wirtschaftsschule|8|oebdb|vierstufig": [
      {
        id: "lb1",
        label: "Pflichtlernbereich: Grundlegende digitale Kompetenzen anwenden",
      },
      {
        id: "lb2",
        label: "Pflichtlernbereich: Im privaten Kontext einkaufen",
      },
      {
        id: "lb3",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext einkaufen",
      },
      {
        id: "lb4",
        label: "Pflichtlernbereich: Im privaten Kontext verkaufen",
      },
      {
        id: "lb5",
        label: "Pflichtlernbereich: Im unternehmerischen Kontext verkaufen",
      },
      {
        id: "lb6",
        label: "Pflichtlernbereich: Wertströme und Werte beurteilen",
      },
      {
        id: "lb7",
        label: "Pflichtlernbereich: Künstliche Intelligenz nutzen",
      },
      {
        id: "lb8",
        label: "Pflichtlernbereich: Sich in der Berufswelt orientieren",
      },
      {
        id: "lb9",
        label: "Wahllernbereich: Informationen im Internet",
      },
      {
        id: "lb10",
        label: "Wahllernbereich: Eigene Spuren im Netz",
      },
      {
        id: "lb11",
        label: "Wahllernbereich: Selbstdarstellung im Netz",
      },
      {
        id: "lb12",
        label: "Wahllernbereich: Cybermobbing",
      },
      {
        id: "lb13",
        label: "Wahllernbereich: Digitale Medien erstellen",
      },
      {
        id: "lb14",
        label: "Wahllernbereich: Extended Reality nutzen",
      },
      {
        id: "lb15",
        label: "Wahllernbereich: Lebensmittel wertschätzen",
      },
      {
        id: "lb16",
        label: "Wahllernbereich: Zukunftsvisionen entwickeln",
      },
      {
        id: "lb17",
        label: "Wahllernbereich: Eine unternehmerische Idee entwickeln",
      },
      {
        id: "lb18",
        label: "Wahllernbereich: Beeinflussung durch Werbung erkennen",
      },
      {
        id: "lb19",
        label: "Wahllernbereich: Einen Secondhand-Laden betreiben",
      },
      {
        id: "lb20",
        label: "Wahllernbereich: Sich ehrenamtlich engagieren",
      },
      {
        id: "lb21",
        label: "Wahllernbereich: Eine Veranstaltung durchführen",
      },
      {
        id: "lb22",
        label: "Wahllernbereich: Eigene Talente entdecken",
      },
    ],
    "wirtschaftsschule|8|sport|diffsport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "wirtschaftsschule|8|sport|dreistufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|8|sport|vierstufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|9|bsk|dreistufig": [
      {
        id: "lb1",
        label: "Berufsorientierung",
      },
      {
        id: "lb2",
        label:
          "Das Sortiment optimieren sowie Beschaffung und Absatz neuer Waren organisieren",
      },
    ],
    "wirtschaftsschule|9|bsk|vierstufig": [
      {
        id: "lb1",
        label: "Berufsorientierung",
      },
      {
        id: "lb2",
        label:
          "Das Sortiment optimieren sowie Beschaffung und Absatz neuer Waren organisieren",
      },
    ],
    "wirtschaftsschule|9|deutsch|%20dreistufig": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|9|deutsch|vierstufig": [
      {
        id: "lb1",
        label: "Sprechen und Zuhören",
      },
      {
        id: "lb2",
        label: "Lesen – mit Texten und weiteren Medien umgehen",
      },
      {
        id: "lb3",
        label: "Schreiben",
      },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "wirtschaftsschule|9|e-commerce": [
      {
        id: "lb1",
        label:
          "Ein Bewusstsein für die Beeinflussung durch Online-Marketing entwickeln",
      },
      {
        id: "lb2",
        label: "Im privaten Kontext online einkaufen",
      },
      {
        id: "lb3",
        label: "Im privaten Kontext online verkaufen",
      },
      {
        id: "lb4",
        label: "Erste berufliche Erfahrungen im E-Commerce sammeln",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|englisch|dreistufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|9|englisch|vierstufig": [
      {
        id: "lb1",
        label: "Kommunikative Kompetenzen",
      },
      {
        id: "lb2",
        label: "Text- und Medienkompetenz",
      },
      {
        id: "lb3",
        label: "Methodische Kompetenzen",
      },
      {
        id: "lb4",
        label: "Interkulturelle Kompetenzen",
      },
      {
        id: "lb5",
        label: "Themengebiete",
      },
    ],
    "wirtschaftsschule|9|ethik|dreistufig": [
      {
        id: "lb1",
        label: "Liebe und Partnerschaft",
      },
      {
        id: "lb2",
        label: "Arbeit und Leistung in Schule und Beruf",
      },
      {
        id: "lb3",
        label: "Sich für den Frieden einsetzen",
      },
      {
        id: "lb4",
        label: "Religionen und Weltgeschehen",
      },
    ],
    "wirtschaftsschule|9|ethik|vierstufig": [
      {
        id: "lb1",
        label: "Liebe und Partnerschaft",
      },
      {
        id: "lb2",
        label: "Arbeit und Leistung in Schule und Beruf",
      },
      {
        id: "lb3",
        label: "Sich für den Frieden einsetzen",
      },
      {
        id: "lb4",
        label: "Religionen und Weltgeschehen",
      },
    ],
    "wirtschaftsschule|9|evangelische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label: "Arbeit und Freizeit",
      },
      {
        id: "lb2",
        label: "Judentum",
      },
      {
        id: "lb3",
        label: "Tod und Auferstehung",
      },
      {
        id: "lb4",
        label: "Gelebter christlicher Glaube",
      },
      {
        id: "lb5",
        label: "Liebe, Partnerschaft und Sexualität",
      },
    ],
    "wirtschaftsschule|9|evangelische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label: "Arbeit und Freizeit",
      },
      {
        id: "lb2",
        label: "Judentum",
      },
      {
        id: "lb3",
        label: "Tod und Auferstehung",
      },
      {
        id: "lb4",
        label: "Gelebter christlicher Glaube",
      },
      {
        id: "lb5",
        label: "Liebe, Partnerschaft und Sexualität",
      },
    ],
    "wirtschaftsschule|9|fit_for_finance": [
      {
        id: "lb1",
        label: "Geld verdienen und versteuern",
      },
      {
        id: "lb2",
        label: "Bewusstsein für Schulden entwickeln",
      },
      {
        id: "lb3",
        label: "Geld sparen und anlegen",
      },
      {
        id: "lb4",
        label: "Absichern und vorsorgen",
      },
      {
        id: "lb5",
        label: "Eine Wohnung mieten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|gamification": [
      {
        id: "lb1",
        label: "Gesellschaftsspiele entschlüsseln",
      },
      {
        id: "lb2",
        label: "Digitale Spiele untersuchen und bewerten",
      },
      {
        id: "lb3",
        label: "Mit Lernspielen motivieren und fördern",
      },
      {
        id: "lb4",
        label: "Gamification identifizieren und nutzen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|gesundheit": [
      {
        id: "lb1",
        label: "Gesundheitsbewusst leben",
      },
      {
        id: "lb2",
        label: "Medizinische Zusammenhänge erkennen",
      },
      {
        id: "lb3",
        label: "Im Gesundheitssystem orientieren",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|gpug-ws|dreistufig": [
      {
        id: "lb1",
        label: "Rekurs: Industrialisierung und Ökologie",
      },
      {
        id: "lb2",
        label: "Globale Herausforderungen: Imperialismus und die Folgen",
      },
      {
        id: "lb3",
        label:
          "Internationaler Konflikt zu Beginn des 20. Jahrhunderts: Der Erste Weltkrieg",
      },
      {
        id: "lb4",
        label:
          "Die erste deutsche Demokratie – Leben zur Zeit der Weimarer Republik",
      },
      {
        id: "lb5",
        label:
          "Leben zur Zeit der nationalsozialistischen Diktatur in Deutschland",
      },
      {
        id: "lb6",
        label:
          "Rückblick und Ausblick: Staatsformen im 20. Jahrhundert in Deutschland",
      },
      {
        id: "lb7",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 6 zu integrieren)",
      },
    ],
    "wirtschaftsschule|9|gpug-ws|vierstufig": [
      {
        id: "lb1",
        label: "Rekurs: Industrialisierung und Ökologie",
      },
      {
        id: "lb2",
        label: "Globale Herausforderungen: Imperialismus und die Folgen",
      },
      {
        id: "lb3",
        label:
          "Internationaler Konflikt zu Beginn des 20. Jahrhunderts: Der Erste Weltkrieg",
      },
      {
        id: "lb4",
        label:
          "Die erste deutsche Demokratie – Leben zur Zeit der Weimarer Republik",
      },
      {
        id: "lb5",
        label:
          "Leben zur Zeit der nationalsozialistischen Diktatur in Deutschland",
      },
      {
        id: "lb6",
        label:
          "Rückblick und Ausblick: Staatsformen im 20. Jahrhundert in Deutschland",
      },
      {
        id: "lb7",
        label:
          "Methodenkompetenzen (in die Lernbereiche 1 bis 6 zu integrieren)",
      },
    ],
    "wirtschaftsschule|9|informationsverarbeitung": [
      {
        id: "lb1",
        label:
          "Moderne Kommunikationsmöglichkeiten zur Berufsorientierung nutzen",
      },
      {
        id: "lb2",
        label:
          "Standardsoftware einsetzen, um in einem Unternehmen erfolgreich zu agieren",
      },
    ],
    "wirtschaftsschule|9|katholische-religionslehre|dreistufig": [
      {
        id: "lb1",
        label: "Verantwortlich handeln – Gewissen, Schuld und Versöhnung",
      },
      {
        id: "lb2",
        label: "Warum es uns gibt – Antworten des Schöpfungsglaubens",
      },
      {
        id: "lb3",
        label: "Jesus Christus – „Der Erstgeborene von den Toten“",
      },
      {
        id: "lb4",
        label: "Kirche in der Zeit – Licht und Schatten",
      },
      {
        id: "lb5",
        label:
          "Sinn und Sehnsucht – Orientierung in der Vielfalt religiöser und weltanschaulicher Angebote",
      },
    ],
    "wirtschaftsschule|9|katholische-religionslehre|vierstufig": [
      {
        id: "lb1",
        label: "Verantwortlich handeln – Gewissen, Schuld und Versöhnung",
      },
      {
        id: "lb2",
        label: "Warum es uns gibt – Antworten des Schöpfungsglaubens",
      },
      {
        id: "lb3",
        label: "Jesus Christus – „Der Erstgeborene von den Toten“",
      },
      {
        id: "lb4",
        label: "Kirche in der Zeit – Licht und Schatten",
      },
      {
        id: "lb5",
        label:
          "Sinn und Sehnsucht – Orientierung in der Vielfalt religiöser und weltanschaulicher Angebote",
      },
    ],
    "wirtschaftsschule|9|life_skills": [
      {
        id: "lb1",
        label: "Umgang mit Emotionen",
      },
      {
        id: "lb2",
        label: "Gelingende Kommunikation",
      },
      {
        id: "lb3",
        label: "Motivation und Zielsetzung",
      },
      {
        id: "lb4",
        label: "Selbstorganisation und Selbstfürsorge",
      },
      {
        id: "lb5",
        label: "Entdecke Deine beruflichen Möglichkeiten",
      },
    ],
    "wirtschaftsschule|9|mathematik|dreistufig": [
      {
        id: "lb1",
        label: "Wachstum und Zerfall",
      },
      {
        id: "lb2",
        label: "Strahlensätze",
      },
      {
        id: "lb3",
        label: "Trigonometrie (1)",
      },
      {
        id: "lb4",
        label: "Raum und Form (3)",
      },
      {
        id: "lb5",
        label: "Quadratische Gleichungen",
      },
      {
        id: "lb6",
        label: "Funktionaler Zusammenhang (2)",
      },
    ],
    "wirtschaftsschule|9|mathematik|vierstufig": [
      {
        id: "lb1",
        label: "Wachstum und Zerfall",
      },
      {
        id: "lb2",
        label: "Strahlensätze",
      },
      {
        id: "lb3",
        label: "Trigonometrie (1)",
      },
      {
        id: "lb4",
        label: "Raum und Form (3)",
      },
      {
        id: "lb5",
        label: "Quadratische Gleichungen",
      },
      {
        id: "lb6",
        label: "Funktionaler Zusammenhang (2)",
      },
    ],
    "wirtschaftsschule|9|robotik": [
      {
        id: "lb1",
        label: "Roboter im Einsatz erleben",
      },
      {
        id: "lb2",
        label: "Die Mechanik eines Roboters konstruieren",
      },
      {
        id: "lb3",
        label: "Die Elektronik eines Roboters installieren",
      },
      {
        id: "lb4",
        label: "Einen Roboter blockorientiert programmieren",
      },
      {
        id: "lb5",
        label: "Einen Roboter warten",
      },
      {
        id: "lb6",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|sport|diffsport": [
      {
        id: "lb1",
        label: "Badminton",
      },
      {
        id: "lb2",
        label: "Basketball",
      },
      {
        id: "lb3",
        label: "Bewegungskünste",
      },
      {
        id: "lb4",
        label: "Eishockey",
      },
      {
        id: "lb5",
        label: "Eiskunstlauf/Eistanz",
      },
      {
        id: "lb6",
        label: "Eisschnelllauf",
      },
      {
        id: "lb7",
        label: "Fußball",
      },
      {
        id: "lb8",
        label: "Gerätturnen",
      },
      {
        id: "lb9",
        label: "Gesundheitsorientierte Fitness",
      },
      {
        id: "lb10",
        label: "Golf",
      },
      {
        id: "lb11",
        label: "Handball",
      },
      {
        id: "lb12",
        label: "Hockey",
      },
      {
        id: "lb13",
        label: "Judo",
      },
      {
        id: "lb14",
        label: "Kanu",
      },
      {
        id: "lb15",
        label: "Leichtathletik",
      },
      {
        id: "lb16",
        label: "Radsport",
      },
      {
        id: "lb17",
        label: "Rettungsschwimmen",
      },
      {
        id: "lb18",
        label: "Rhythmische Sportgymnastik",
      },
      {
        id: "lb19",
        label: "Ringen",
      },
      {
        id: "lb20",
        label: "Rodeln",
      },
      {
        id: "lb21",
        label: "Rudern",
      },
      {
        id: "lb22",
        label: "Schwimmen",
      },
      {
        id: "lb23",
        label: "Segeln",
      },
      {
        id: "lb24",
        label: "Selbstverteidigung",
      },
      {
        id: "lb25",
        label: "Ski Alpin",
      },
      {
        id: "lb26",
        label: "Skilanglauf",
      },
      {
        id: "lb27",
        label: "Snowboard",
      },
      {
        id: "lb28",
        label: "Sportklettern",
      },
      {
        id: "lb29",
        label: "Tanz",
      },
      {
        id: "lb30",
        label: "Tennis",
      },
      {
        id: "lb31",
        label: "Tischtennis",
      },
      {
        id: "lb32",
        label: "Triathlon",
      },
      {
        id: "lb33",
        label: "Volleyball",
      },
    ],
    "wirtschaftsschule|9|sport|dreistufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|9|sport|vierstufig": [
      {
        id: "lb1",
        label: "Gesundheit und Fitness",
      },
      {
        id: "lb2",
        label: "Fairness/Kooperation/Selbstkompetenz",
      },
      {
        id: "lb3",
        label: "Freizeit und Umwelt",
      },
      {
        id: "lb4",
        label: "Sportliche Handlungsfelder",
      },
    ],
    "wirtschaftsschule|9|tourismus": [
      {
        id: "lb1",
        label: "Tourismus entdecken",
      },
      {
        id: "lb2",
        label: "Regionalen Tourismus untersuchen",
      },
      {
        id: "lb3",
        label: "Tourismus in der Region erleben",
      },
      {
        id: "lb4",
        label: "Reisen planen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|uebungsunternehmen|drei_vierstufig": [
      {
        id: "lb1",
        label: "Kennenlernen des Unternehmens",
      },
      {
        id: "lb2",
        label: "Einkauf",
      },
      {
        id: "lb3",
        label: "Verkauf",
      },
      {
        id: "lb4",
        label: "Personal",
      },
      {
        id: "lb5",
        label: "Marketing",
      },
      {
        id: "lb6",
        label: "Controlling",
      },
      {
        id: "lb7",
        label: "Finanzen",
      },
    ],
    "wirtschaftsschule|9|umweltoekonomie": [
      {
        id: "lb1",
        label: "Energieversorgung gestalten",
      },
      {
        id: "lb2",
        label: "Mobilität managen",
      },
      {
        id: "lb3",
        label: "Umweltökonomisch konsumieren",
      },
      {
        id: "lb4",
        label: "Betriebliche Umweltökonomie untersuchen",
      },
      {
        id: "lb5",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|umwelttechnik": [
      {
        id: "lb1",
        label: "Energie einsparen",
      },
      {
        id: "lb2",
        label: "Abfall vermeiden",
      },
      {
        id: "lb3",
        label: "Lärm messen und Schutzmaßnahmen ergreifen",
      },
      {
        id: "lb4",
        label: "Berufliche Möglichkeiten entdecken",
      },
    ],
    "wirtschaftsschule|9|wirtschaft_aktuell|dreistufig": [
      {
        id: "lb1",
        label: "Leben und Arbeiten in Deutschland",
      },
      {
        id: "lb2",
        label: "Der demographische Wandel – Herausforderung für die Wirtschaft",
      },
      {
        id: "lb3",
        label: "Grundlagen des Wirtschaftens",
      },
      {
        id: "lb4",
        label: "Märkte im Wandel",
      },
      {
        id: "lb5",
        label: "Wandel in der Arbeitswelt",
      },
      {
        id: "lb6",
        label:
          "Verbraucherschutz und verantwortungsbewusstes Verbraucherverhalten",
      },
      {
        id: "lb7",
        label: "Wirtschaftspolitik in einer globalisierten Welt",
      },
      {
        id: "lb8",
        label: "Wirtschaftliche Zusammenarbeit in der Europäischen Union",
      },
      {
        id: "lb9",
        label: "Die Weltwirtschaft gestalten",
      },
    ],
    "wirtschaftsschule|9|wirtschaft_aktuell|vierstufig": [
      {
        id: "lb1",
        label: "Leben und Arbeiten in Deutschland",
      },
      {
        id: "lb2",
        label: "Der demographische Wandel – Herausforderung für die Wirtschaft",
      },
      {
        id: "lb3",
        label: "Grundlagen des Wirtschaftens",
      },
      {
        id: "lb4",
        label: "Märkte im Wandel",
      },
      {
        id: "lb5",
        label: "Wandel in der Arbeitswelt",
      },
      {
        id: "lb6",
        label:
          "Verbraucherschutz und verantwortungsbewusstes Verbraucherverhalten",
      },
      {
        id: "lb7",
        label: "Wirtschaftspolitik in einer globalisierten Welt",
      },
      {
        id: "lb8",
        label: "Wirtschaftliche Zusammenarbeit in der Europäischen Union",
      },
      {
        id: "lb9",
        label: "Die Weltwirtschaft gestalten",
      },
    ],
    "wirtschaftsschule|9|wirtschaftsgeografie": [
      {
        id: "lb1",
        label: "Eine Gruppenreise in der Region planen",
      },
      {
        id: "lb2",
        label: "Einen Ausbildungsort auswählen und erreichen",
      },
      {
        id: "lb3",
        label: "Verantwortungsbewusste Konsumentscheidungen treffen",
      },
      {
        id: "lb4",
        label: "Den Heimatraum mitgestalten",
      },
      {
        id: "lb5",
        label: "Bei Naturkatastrophen aktiv helfen",
      },
    ],
  },

  contentUrls: {
    "realschule|5|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/biologie/inhalt/fachlehrplaene",
    "realschule|5|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|5|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/englisch/inhalt/fachlehrplaene",
    "realschule|5|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/ethik/inhalt/fachlehrplaene",
    "realschule|5|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|5|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/geographie/inhalt/fachlehrplaene",
    "realschule|5|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/it/inhalt/fachlehrplaene",
    "realschule|5|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/iu/inhalt/fachlehrplaene",
    "realschule|5|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/ir/inhalt/fachlehrplaene",
    "realschule|5|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|5|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/kunst/inhalt/fachlehrplaene",
    "realschule|5|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/mathematik/inhalt/fachlehrplaene",
    "realschule|5|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/musik/inhalt/fachlehrplaene",
    "realschule|5|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/or/inhalt/fachlehrplaene",
    "realschule|5|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=5&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|5|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=5&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|5|textiles-gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/textiles-gestalten/inhalt/fachlehrplaene",
    "realschule|5|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/5/fach/werken/inhalt/fachlehrplaene",
    "realschule|6|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/biologie/inhalt/fachlehrplaene",
    "realschule|6|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|6|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/englisch/inhalt/fachlehrplaene",
    "realschule|6|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/ethik/inhalt/fachlehrplaene",
    "realschule|6|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|6|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/geographie/inhalt/fachlehrplaene",
    "realschule|6|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/geschichte/inhalt/fachlehrplaene",
    "realschule|6|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/it/inhalt/fachlehrplaene",
    "realschule|6|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/iu/inhalt/fachlehrplaene",
    "realschule|6|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/ir/inhalt/fachlehrplaene",
    "realschule|6|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|6|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/kunst/inhalt/fachlehrplaene",
    "realschule|6|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/mathematik/inhalt/fachlehrplaene",
    "realschule|6|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/musik/inhalt/fachlehrplaene",
    "realschule|6|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/or/inhalt/fachlehrplaene",
    "realschule|6|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|6|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|6|textiles-gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/textiles-gestalten/inhalt/fachlehrplaene",
    "realschule|6|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/6/fach/werken/inhalt/fachlehrplaene",
    "realschule|7|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/biologie/inhalt/fachlehrplaene",
    "realschule|7|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|7|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/englisch/inhalt/fachlehrplaene",
    "realschule|7|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/ethik/inhalt/fachlehrplaene",
    "realschule|7|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|7|franzoesisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/franzoesisch/inhalt/fachlehrplaene",
    "realschule|7|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/geographie/inhalt/fachlehrplaene",
    "realschule|7|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/geschichte/inhalt/fachlehrplaene",
    "realschule|7|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/it/inhalt/fachlehrplaene",
    "realschule|7|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/iu/inhalt/fachlehrplaene",
    "realschule|7|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/ir/inhalt/fachlehrplaene",
    "realschule|7|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|7|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/kunst/inhalt/fachlehrplaene",
    "realschule|7|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|7|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|7|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/musik/inhalt/fachlehrplaene",
    "realschule|7|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/or/inhalt/fachlehrplaene",
    "realschule|7|physik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/physik/inhalt/fachlehrplaene",
    "realschule|7|sozialwesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/sozialwesen/inhalt/fachlehrplaene",
    "realschule|7|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/spanisch/inhalt/fachlehrplaene",
    "realschule|7|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|7|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|7|textiles-gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/textiles-gestalten/inhalt/fachlehrplaene",
    "realschule|7|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/7/fach/werken/inhalt/fachlehrplaene",
    "realschule|8|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/biologie/inhalt/fachlehrplaene",
    "realschule|8|chemie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/chemie/inhalt/fachlehrplaene",
    "realschule|8|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|8|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/englisch/inhalt/fachlehrplaene",
    "realschule|8|ernaehrung_und_gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/ernaehrung_und_gesundheit/inhalt/fachlehrplaene",
    "realschule|8|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/ethik/inhalt/fachlehrplaene",
    "realschule|8|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|8|franzoesisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/franzoesisch/inhalt/fachlehrplaene",
    "realschule|8|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/geographie/inhalt/fachlehrplaene",
    "realschule|8|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/geschichte/inhalt/fachlehrplaene",
    "realschule|8|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/it/inhalt/fachlehrplaene",
    "realschule|8|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/iu/inhalt/fachlehrplaene",
    "realschule|8|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/ir/inhalt/fachlehrplaene",
    "realschule|8|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|8|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/kunst/inhalt/fachlehrplaene",
    "realschule|8|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|8|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|8|physik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|8|physik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|8|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/musik/inhalt/fachlehrplaene",
    "realschule|8|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/or/inhalt/fachlehrplaene",
    "realschule|8|soziallehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/soziallehre/inhalt/fachlehrplaene",
    "realschule|8|sozialwesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/sozialwesen/inhalt/fachlehrplaene",
    "realschule|8|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/spanisch/inhalt/fachlehrplaene",
    "realschule|8|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|8|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|8|textiles-gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/textiles-gestalten/inhalt/fachlehrplaene",
    "realschule|8|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/werken/inhalt/fachlehrplaene",
    "realschule|8|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/8/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "realschule|9|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "realschule|9|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|9|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/englisch/inhalt/fachlehrplaene",
    "realschule|9|ernaehrung_und_gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/ernaehrung_und_gesundheit/inhalt/fachlehrplaene",
    "realschule|9|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/ethik/inhalt/fachlehrplaene",
    "realschule|9|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|9|franzoesisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/franzoesisch/inhalt/fachlehrplaene",
    "realschule|9|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/geographie/inhalt/fachlehrplaene",
    "realschule|9|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/geschichte/inhalt/fachlehrplaene",
    "realschule|9|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/it/inhalt/fachlehrplaene",
    "realschule|9|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/iu/inhalt/fachlehrplaene",
    "realschule|9|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/ir/inhalt/fachlehrplaene",
    "realschule|9|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|9|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/kunst/inhalt/fachlehrplaene",
    "realschule|9|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|9|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|9|physik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|9|physik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|9|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/musik/inhalt/fachlehrplaene",
    "realschule|9|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/or/inhalt/fachlehrplaene",
    "realschule|9|soziallehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/soziallehre/inhalt/fachlehrplaene",
    "realschule|9|sozialwesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/sozialwesen/inhalt/fachlehrplaene",
    "realschule|9|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/spanisch/inhalt/fachlehrplaene",
    "realschule|9|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|9|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|9|textiles-gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/textiles-gestalten/inhalt/fachlehrplaene",
    "realschule|9|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/werken/inhalt/fachlehrplaene",
    "realschule|10|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "realschule|10|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/biologie/inhalt/fachlehrplaene",
    "realschule|10|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|10|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/englisch/inhalt/fachlehrplaene",
    "realschule|10|ernaehrung_und_gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/ernaehrung_und_gesundheit/inhalt/fachlehrplaene",
    "realschule|10|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/ethik/inhalt/fachlehrplaene",
    "realschule|10|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "realschule|10|franzoesisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/franzoesisch/inhalt/fachlehrplaene",
    "realschule|10|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/geschichte/inhalt/fachlehrplaene",
    "realschule|10|it":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/it/inhalt/fachlehrplaene",
    "realschule|10|iu":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/iu/inhalt/fachlehrplaene",
    "realschule|10|ir":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/ir/inhalt/fachlehrplaene",
    "realschule|10|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "realschule|10|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/kunst/inhalt/fachlehrplaene",
    "realschule|10|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|10|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|10|physik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|10|physik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/physik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|10|musik":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/musik/inhalt/fachlehrplaene",
    "realschule|10|or":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/or/inhalt/fachlehrplaene",
    "realschule|10|pug":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/pug/inhalt/fachlehrplaene",
    "realschule|10|soziallehre":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/soziallehre/inhalt/fachlehrplaene",
    "realschule|10|sozialwesen":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/sozialwesen/inhalt/fachlehrplaene",
    "realschule|10|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/spanisch/inhalt/fachlehrplaene",
    "realschule|10|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=basis_sport",
    "realschule|10|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=diff_sport",
    "realschule|10|werken":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/10/fach/werken/inhalt/fachlehrplaene",
    "gymnasium|5|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|5|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/englisch/inhalt/fachlehrplaene",
    "gymnasium|5|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|5|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|5|franzoesisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/franzoesisch/inhalt/fachlehrplaene",
    "gymnasium|5|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/geographie/inhalt/fachlehrplaene",
    "gymnasium|5|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|5|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|5|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|5|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|5|latein":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/latein/inhalt/fachlehrplaene",
    "gymnasium|5|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|5|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|5|nt_gym":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/nt_gym/inhalt/fachlehrplaene",
    "gymnasium|5|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/or/inhalt/fachlehrplaene",
    "gymnasium|5|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=5&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|5|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/5/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=5&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|6|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|6|englisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|6|englisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|6|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|6|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|6|franzoesisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|6|franzoesisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|6|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|6|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|6|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|6|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|6|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|6|latein|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|6|latein|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|6|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|6|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|6|nt_gym":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/nt_gym/inhalt/fachlehrplaene",
    "gymnasium|6|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/or/inhalt/fachlehrplaene",
    "gymnasium|6|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|6|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/6/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=6&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|7|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|7|englisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|7|englisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|7|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|7|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|7|franzoesisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|7|franzoesisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|7|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/geographie/inhalt/fachlehrplaene",
    "gymnasium|7|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|7|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|7|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|7|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|7|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|7|latein|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|7|latein|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|7|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|7|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|7|nt_gym":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/nt_gym/inhalt/fachlehrplaene",
    "gymnasium|7|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/or/inhalt/fachlehrplaene",
    "gymnasium|7|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|7|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|8|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/biologie/inhalt/fachlehrplaene",
    "gymnasium|8|chemie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/chemie/inhalt/fachlehrplaene",
    "gymnasium|8|chi":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/chi/inhalt/fachlehrplaene",
    "gymnasium|8|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|8|englisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|8|englisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|8|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|8|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|8|franzoesisch|1fs":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=1fs",
    "gymnasium|8|franzoesisch|2fs":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=2fs",
    "gymnasium|8|franzoesisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|8|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|8|griechisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/griechisch/inhalt/fachlehrplaene",
    "gymnasium|8|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|8|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|8|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/italienisch/inhalt/fachlehrplaene",
    "gymnasium|8|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|8|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|8|latein|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|8|latein|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|8|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|8|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|8|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/or/inhalt/fachlehrplaene",
    "gymnasium|8|physik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/physik/inhalt/fachlehrplaene",
    "gymnasium|8|pug":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/pug/inhalt/fachlehrplaene",
    "gymnasium|8|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/russisch/inhalt/fachlehrplaene",
    "gymnasium|8|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/spanisch/inhalt/fachlehrplaene",
    "gymnasium|8|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|8|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|8|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/8/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "gymnasium|9|berufliche_orientierung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/berufliche_orientierung/inhalt/fachlehrplaene",
    "gymnasium|9|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/biologie/inhalt/fachlehrplaene",
    "gymnasium|9|chemie|ch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=ch",
    "gymnasium|9|chemie|ch-ntg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=ch-ntg",
    "gymnasium|9|chi":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/chi/inhalt/fachlehrplaene",
    "gymnasium|9|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|9|englisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|9|englisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|9|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|9|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|9|franzoesisch|1-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=1-fremdsprache",
    "gymnasium|9|franzoesisch|2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=2-fremdsprache",
    "gymnasium|9|franzoesisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|9|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|9|griechisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/griechisch/inhalt/fachlehrplaene",
    "gymnasium|9|informatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/informatik/inhalt/fachlehrplaene",
    "gymnasium|9|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|9|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|9|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/italienisch/inhalt/fachlehrplaene",
    "gymnasium|9|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|9|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|9|latein":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/latein/inhalt/fachlehrplaene",
    "gymnasium|9|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|9|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|9|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/or/inhalt/fachlehrplaene",
    "gymnasium|9|physik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/physik/inhalt/fachlehrplaene",
    "gymnasium|9|pug":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/pug/inhalt/fachlehrplaene",
    "gymnasium|9|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/russisch/inhalt/fachlehrplaene",
    "gymnasium|9|sozialpraktische-grundbildung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/sozialpraktische-grundbildung/inhalt/fachlehrplaene",
    "gymnasium|9|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/spanisch/inhalt/fachlehrplaene",
    "gymnasium|9|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|9|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|9|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "gymnasium|9|wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/9/fach/wirtschaftsinformatik/inhalt/fachlehrplaene",
    "gymnasium|10|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/biologie/inhalt/fachlehrplaene",
    "gymnasium|10|chemie|ch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ch",
    "gymnasium|10|chemie|ch-ntg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ch-ntg",
    "gymnasium|10|chi":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/chi/inhalt/fachlehrplaene",
    "gymnasium|10|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|10|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/englisch/inhalt/fachlehrplaene",
    "gymnasium|10|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|10|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|10|franzoesisch|1-2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=1-2-fremdsprache",
    "gymnasium|10|franzoesisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|10|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/geographie/inhalt/fachlehrplaene",
    "gymnasium|10|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|10|griechisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/griechisch/inhalt/fachlehrplaene",
    "gymnasium|10|informatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/informatik/inhalt/fachlehrplaene",
    "gymnasium|10|iu":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/iu/inhalt/fachlehrplaene",
    "gymnasium|10|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|10|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/italienisch/inhalt/fachlehrplaene",
    "gymnasium|10|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|10|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|10|latein":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/latein/inhalt/fachlehrplaene",
    "gymnasium|10|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|10|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|10|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/or/inhalt/fachlehrplaene",
    "gymnasium|10|physik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/physik/inhalt/fachlehrplaene",
    "gymnasium|10|pug|einstuendig":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=einstuendig",
    "gymnasium|10|pug|zweistuendig":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistuendig",
    "gymnasium|10|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/russisch/inhalt/fachlehrplaene",
    "gymnasium|10|sozialpraktische-grundbildung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/sozialpraktische-grundbildung/inhalt/fachlehrplaene",
    "gymnasium|10|spanisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/spanisch/inhalt/fachlehrplaene",
    "gymnasium|10|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|10|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|10|wirtschaft-und-recht|andere":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=andere",
    "gymnasium|10|wirtschaft-und-recht|wwg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=wwg",
    "gymnasium|10|wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/10/fach/wirtschaftsinformatik/inhalt/fachlehrplaene",
    "gymnasium|11|berufliche_orientierung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/berufliche_orientierung/inhalt/fachlehrplaene",
    "gymnasium|11|chemie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/chemie/inhalt/fachlehrplaene",
    "gymnasium|11|chi|fs3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=fs3",
    "gymnasium|11|chi|spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spaet",
    "gymnasium|11|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|11|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/englisch/inhalt/fachlehrplaene",
    "gymnasium|11|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/ethik/inhalt/fachlehrplaene",
    "gymnasium|11|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|11|franzoesisch|1-2-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=1-2-fremdsprache",
    "gymnasium|11|franzoesisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|11|franzoesisch|spaet-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spaet-fremdsprache",
    "gymnasium|11|geographie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/geographie/inhalt/fachlehrplaene",
    "gymnasium|11|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/geschichte/inhalt/fachlehrplaene",
    "gymnasium|11|griechisch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/griechisch/inhalt/fachlehrplaene",
    "gymnasium|11|informatik|ntg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=ntg",
    "gymnasium|11|informatik|mug_swg_sg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=mug_swg_sg",
    "gymnasium|11|ir":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/ir/inhalt/fachlehrplaene",
    "gymnasium|11|italienisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|11|italienisch|spaet-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spaet-fremdsprache",
    "gymnasium|11|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "gymnasium|11|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/kunst/inhalt/fachlehrplaene",
    "gymnasium|11|latein":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/latein/inhalt/fachlehrplaene",
    "gymnasium|11|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|11|musik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/musik/inhalt/fachlehrplaene",
    "gymnasium|11|or":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/or/inhalt/fachlehrplaene",
    "gymnasium|11|physik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/physik/inhalt/fachlehrplaene",
    "gymnasium|11|pug|zweistuendig":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=zweistuendig",
    "gymnasium|11|pug|dreistuendig":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=dreistuendig",
    "gymnasium|11|pln":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/pln/inhalt/fachlehrplaene",
    "gymnasium|11|russisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|11|russisch|spaet-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spaet-fremdsprache",
    "gymnasium|11|sozialpraktische-grundbildung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/sozialpraktische-grundbildung/inhalt/fachlehrplaene",
    "gymnasium|11|spanisch|3-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=3-fremdsprache",
    "gymnasium|11|spanisch|spaet-fremdsprache":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spaet-fremdsprache",
    "gymnasium|11|sport|basis_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=basis_sport",
    "gymnasium|11|sport|diff_sport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=diff_sport",
    "gymnasium|11|tsh":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/tsh/inhalt/fachlehrplaene",
    "gymnasium|11|tr":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/tr/inhalt/fachlehrplaene",
    "gymnasium|11|wirtschaft-und-recht|andere":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=andere",
    "gymnasium|11|wirtschaft-und-recht|wwg":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=wwg",
    "gymnasium|11|wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/11/fach/wirtschaftsinformatik/inhalt/fachlehrplaene",
    "gymnasium|12|ar":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ar/inhalt/fachlehrplaene",
    "gymnasium|12|berufliche_orientierung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/berufliche_orientierung/inhalt/fachlehrplaene",
    "gymnasium|12|biologie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|biologie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|biolog-chem-praktikum":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/biolog-chem-praktikum/inhalt/fachlehrplaene",
    "gymnasium|12|chemie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|chemie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|chi|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|chi|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|12|deutsch|regulaer":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/deutsch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=regulaer",
    "gymnasium|12|deutsch|vertieft":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/deutsch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=vertieft",
    "gymnasium|12|englisch|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|englisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|ethik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ethik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|ethik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ethik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|evangelische-religionslehre|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|evangelische-religionslehre|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|franzoesisch|grundlegend-1-2-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-1-2-3",
    "gymnasium|12|franzoesisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|franzoesisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|geographie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/geographie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geographie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|geographie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/geographie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geographie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|geschichte|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/geschichte/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geschichte&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|geschichte|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/geschichte/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geschichte&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|griechisch|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/griechisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=griechisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|griechisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/griechisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=griechisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|informatik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|informatik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|informatik|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|instrumentalensemble":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/instrumentalensemble/inhalt/fachlehrplaene",
    "gymnasium|12|ir|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ir/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ir&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|ir|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ir/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ir&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|italienisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|12|italienisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|italienisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|katholische-religionslehre|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|katholische-religionslehre|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|kunst|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/kunst/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=kunst&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|kunst|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/kunst/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=kunst&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|latein|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|latein|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|mathematik|regulaer":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=regulaer",
    "gymnasium|12|mathematik|vertieft":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=vertieft",
    "gymnasium|12|musik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/musik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=musik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|musik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/musik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=musik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|or|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/or/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=or&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|or|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/or/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=or&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|physik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|physik|grundlegend-bio":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-bio",
    "gymnasium|12|physik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|pug|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|pug|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|pln":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/pln/inhalt/fachlehrplaene",
    "gymnasium|12|ps":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/ps/inhalt/fachlehrplaene",
    "gymnasium|12|russisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|12|russisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|russisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|sozialwissenschaftl-arbeitsfelder":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/sozialwissenschaftl-arbeitsfelder/inhalt/fachlehrplaene",
    "gymnasium|12|spanisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|12|spanisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|12|spanisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|sport|basissport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=basissport",
    "gymnasium|12|sport|sporttheorie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=sporttheorie",
    "gymnasium|12|sug":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/sug/inhalt/fachlehrplaene",
    "gymnasium|12|stb":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/stb/inhalt/fachlehrplaene",
    "gymnasium|12|tuf":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/tuf/inhalt/fachlehrplaene",
    "gymnasium|12|tsh":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/tsh/inhalt/fachlehrplaene",
    "gymnasium|12|tr":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/tr/inhalt/fachlehrplaene",
    "gymnasium|12|vokalensemble":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/vokalensemble/inhalt/fachlehrplaene",
    "gymnasium|12|wirtschaft-und-recht|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|12|wirtschaft-und-recht|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|12|wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/wirtschaftsinformatik/inhalt/fachlehrplaene",
    "gymnasium|12|w-seminar":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/12/fach/w-seminar/inhalt/fachlehrplaene",
    "gymnasium|13|ar":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ar/inhalt/fachlehrplaene",
    "gymnasium|13|berufliche_orientierung":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/berufliche_orientierung/inhalt/fachlehrplaene",
    "gymnasium|13|biologie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|biologie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|biolog-chem-praktikum":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/biolog-chem-praktikum/inhalt/fachlehrplaene",
    "gymnasium|13|chemie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|chemie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|chi|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|13|chi|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/chi/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=chi&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|13|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/deutsch/inhalt/fachlehrplaene",
    "gymnasium|13|englisch|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|englisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/englisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|ethik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ethik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|ethik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ethik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|evangelische-religionslehre|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|evangelische-religionslehre|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|franzoesisch|grundlegend-1-2-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-1-2-3",
    "gymnasium|13|franzoesisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|13|franzoesisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|geographie|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/geographie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geographie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|geographie|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/geographie/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geographie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|geol":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/geol/inhalt/fachlehrplaene",
    "gymnasium|13|geschichte|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/geschichte/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geschichte&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|geschichte|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/geschichte/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=geschichte&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|griechisch|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/griechisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=griechisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|griechisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/griechisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=griechisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|informatik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|informatik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|instrumentalensemble":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/instrumentalensemble/inhalt/fachlehrplaene",
    "gymnasium|13|ir|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ir/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ir&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|ir|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ir/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=ir&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|italienisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|13|italienisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|13|italienisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/italienisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=italienisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|katholische-religionslehre|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|katholische-religionslehre|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|kunst|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/kunst/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=kunst&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|kunst|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/kunst/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=kunst&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|latein|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|latein|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/latein/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=latein&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/mathematik/inhalt/fachlehrplaene",
    "gymnasium|13|musik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/musik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=musik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|musik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/musik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=musik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|or|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/or/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=or&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|or|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/or/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=or&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|physik|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|physik|grundlegend-astro":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-astro",
    "gymnasium|13|physik|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|pug|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|pug|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/pug/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=pug&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|pln":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/pln/inhalt/fachlehrplaene",
    "gymnasium|13|ps":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/ps/inhalt/fachlehrplaene",
    "gymnasium|13|russisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|13|russisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|13|russisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/russisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=russisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|sozialwissenschaftl-arbeitsfelder":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/sozialwissenschaftl-arbeitsfelder/inhalt/fachlehrplaene",
    "gymnasium|13|spanisch|grundlegend-3":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-3",
    "gymnasium|13|spanisch|grundlegend-spaet":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend-spaet",
    "gymnasium|13|spanisch|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|sport|basissport":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=basissport",
    "gymnasium|13|sport|sporttheorie":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/sport/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=sporttheorie",
    "gymnasium|13|sug":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/sug/inhalt/fachlehrplaene",
    "gymnasium|13|stb":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/stb/inhalt/fachlehrplaene",
    "gymnasium|13|tuf":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/tuf/inhalt/fachlehrplaene",
    "gymnasium|13|tsh":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/tsh/inhalt/fachlehrplaene",
    "gymnasium|13|tr":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/tr/inhalt/fachlehrplaene",
    "gymnasium|13|vokalensemble":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/vokalensemble/inhalt/fachlehrplaene",
    "gymnasium|13|wirtschaft-und-recht|grundlegend":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=grundlegend",
    "gymnasium|13|wirtschaft-und-recht|erhoeht":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/wirtschaft-und-recht/inhalt/fachlehrplaene?w_schulart=gymnasium&wt_1=schulart&w_fach=wirtschaft-und-recht&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=erhoeht",
    "gymnasium|13|wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/wirtschaftsinformatik/inhalt/fachlehrplaene",
    "gymnasium|13|w-seminar":
      "https://www.lehrplanplus.bayern.de/schulart/gymnasium/jgs/13/fach/w-seminar/inhalt/fachlehrplaene",
    "bos|10|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "bos|10|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=abu",
    "bos|10|biologie|s-gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=s-gh",
    "bos|10|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "bos|10|chemie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/chemie/inhalt/fachlehrplaene",
    "bos|10|deutsch|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "bos|10|deutsch|vorklasse_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse_gueltig_ab_26_27",
    "bos|10|deutsch|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "bos|10|deutsch|vorkurs_guelitg_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs_guelitg_ab_26_27",
    "bos|10|englisch|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "bos|10|englisch|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "bos|10|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/ethik/inhalt/fachlehrplaene",
    "bos|10|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "bos|10|gpug-fosbos":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/gpug-fosbos/inhalt/fachlehrplaene",
    "bos|10|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/gw/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=aktuell",
    "bos|10|gw|aktuell_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/gw/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=aktuell_gueltig_ab_26_27",
    "bos|10|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/ibv/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ibv",
    "bos|10|ibv|ibv_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/ibv/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ibv_gueltig_ab_26_27",
    "bos|10|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "bos|10|kuenstliche_intelligenz_informatik_u_technologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene",
    "bos|10|mathematik|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "bos|10|mathematik|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "bos|10|nt-bo":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/nt-bo/inhalt/fachlehrplaene",
    "bos|10|paedagigik-psychologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/paedagigik-psychologie/inhalt/fachlehrplaene",
    "bos|10|physik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/physik/inhalt/fachlehrplaene",
    "bos|10|technologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/10/fach/technologie/inhalt/fachlehrplaene",
    "bos|12|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "bos|12|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "bos|12|biologie|g":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=g",
    "bos|12|biologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "bos|12|biologie|wahl-t-w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-t-w-iw",
    "bos|12|biotechnologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/biotechnologie/inhalt/fachlehrplaene",
    "bos|12|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "bos|12|chemie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "bos|12|chemie|gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=gh",
    "bos|12|chemie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "bos|12|ebc":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/ebc/inhalt/fachlehrplaene",
    "bos|12|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/englisch/inhalt/fachlehrplaene",
    "bos|12|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/ethik/inhalt/fachlehrplaene",
    "bos|12|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "bos|12|franzoesisch|franzoesisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_ahr",
    "bos|12|franzoesisch|franzoesisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_aufbaukurs",
    "bos|12|franzoesisch|franzoesisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_fortgefuehrt",
    "bos|12|franzoesisch|franzoesisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_grundkurs",
    "bos|12|gpug-fosbos":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/gpug-fosbos/inhalt/fachlehrplaene",
    "bos|12|gwr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/gwr/inhalt/fachlehrplaene",
    "bos|12|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/gw/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=aktuell",
    "bos|12|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/ibv/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=ibv",
    "bos|12|informatik|abu-s-w-gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu-s-w-gh",
    "bos|12|informatik|wahl-t-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-t-iw",
    "bos|12|internationale_politik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/internationale_politik/inhalt/fachlehrplaene",
    "bos|12|isb|pflicht-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/isb/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=isb&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=pflicht-iw",
    "bos|12|isb|wahl-abu-t-w-s-gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/isb/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=isb&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-abu-t-w-s-gh",
    "bos|12|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/italienisch/inhalt/fachlehrplaene",
    "bos|12|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "bos|12|ki":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/ki/inhalt/fachlehrplaene",
    "bos|12|kuenstliche_intelligenz_informatik_u_technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "bos|12|kuenstliche_intelligenz_informatik_u_technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "bos|12|kuenstliche_intelligenz_u_wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/kuenstliche_intelligenz_u_wirtschaftsinformatik/inhalt/fachlehrplaene",
    "bos|12|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/kunst/inhalt/fachlehrplaene",
    "bos|12|latein":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/latein/inhalt/fachlehrplaene",
    "bos|12|mathematik|Wahl-abu-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=Wahl-abu-s-w-gh-iw",
    "bos|12|mathematik|abu-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu-s-w-gh-iw",
    "bos|12|mathematik|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "bos|12|mathematik|wahl-t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-t",
    "bos|12|musik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/musik/inhalt/fachlehrplaene",
    "bos|12|nt-bo":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/nt-bo/inhalt/fachlehrplaene",
    "bos|12|paedagigik-psychologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "bos|12|physik|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "bos|12|physik|s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s-w-gh-iw",
    "bos|12|physik|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "bos|12|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/russisch/inhalt/fachlehrplaene",
    "bos|12|sg":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/sg/inhalt/fachlehrplaene",
    "bos|12|sozialwirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/sozialwirtschaft-und-recht/inhalt/fachlehrplaene",
    "bos|12|soziologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/soziologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=soziologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "bos|12|soziologie|wahl-abu-t-w-iw-gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/soziologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=soziologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-abu-t-w-iw-gh",
    "bos|12|spanisch|spanisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_ahr",
    "bos|12|spanisch|spanisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_aufbaukurs",
    "bos|12|spanisch|spanisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_fortgefuehrt",
    "bos|12|spanisch|spanisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_grundkurs",
    "bos|12|studier-und-arbeitstechniken":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/studier-und-arbeitstechniken/inhalt/fachlehrplaene",
    "bos|12|technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "bos|12|technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "bos|12|volkswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/volkswirtschaftslehre/inhalt/fachlehrplaene",
    "bos|12|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "bos|12|wirtschaft_aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/12/fach/wirtschaft_aktuell/inhalt/fachlehrplaene",
    "bos|13|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "bos|13|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "bos|13|biologie|g":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=g",
    "bos|13|biologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=s",
    "bos|13|biologie|wahl-t-w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-t-w-iw",
    "bos|13|biotechnologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/biotechnologie/inhalt/fachlehrplaene",
    "bos|13|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "bos|13|chemie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "bos|13|chemie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "bos|13|ebc":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/ebc/inhalt/fachlehrplaene",
    "bos|13|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/englisch/inhalt/fachlehrplaene",
    "bos|13|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/ethik/inhalt/fachlehrplaene",
    "bos|13|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "bos|13|franzoesisch|franzoesisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_ahr",
    "bos|13|franzoesisch|franzoesisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_aufbaukurs",
    "bos|13|franzoesisch|franzoesisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_fortgefuehrt",
    "bos|13|franzoesisch|franzoesisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_grundkurs",
    "bos|13|gpug-fosbos":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/gpug-fosbos/inhalt/fachlehrplaene",
    "bos|13|gwr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/gwr/inhalt/fachlehrplaene",
    "bos|13|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/gw/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=aktuell",
    "bos|13|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/ibv/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=ibv",
    "bos|13|informatik|wahl-abu-s-w-gh":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-abu-s-w-gh",
    "bos|13|informatik|wahl-t-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-t-iw",
    "bos|13|internationale_politik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/internationale_politik/inhalt/fachlehrplaene",
    "bos|13|isb":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/isb/inhalt/fachlehrplaene",
    "bos|13|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/italienisch/inhalt/fachlehrplaene",
    "bos|13|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "bos|13|ki":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/ki/inhalt/fachlehrplaene",
    "bos|13|kuenstliche_intelligenz_informatik_u_technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "bos|13|kuenstliche_intelligenz_informatik_u_technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "bos|13|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/kunst/inhalt/fachlehrplaene",
    "bos|13|latein":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/latein/inhalt/fachlehrplaene",
    "bos|13|mathematik|abu-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu-s-w-gh-iw",
    "bos|13|mathematik|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "bos|13|mathematik|wahl-abu-s-w-t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-abu-s-w-t",
    "bos|13|musik":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/musik/inhalt/fachlehrplaene",
    "bos|13|nt-bo":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/nt-bo/inhalt/fachlehrplaene",
    "bos|13|paedagigik-psychologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=s",
    "bos|13|physik|s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=s-w-gh-iw",
    "bos|13|physik|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "bos|13|physik|wahl-abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-abu",
    "bos|13|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/russisch/inhalt/fachlehrplaene",
    "bos|13|sg":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/sg/inhalt/fachlehrplaene",
    "bos|13|sozialwirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/sozialwirtschaft-und-recht/inhalt/fachlehrplaene",
    "bos|13|soziologie":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/soziologie/inhalt/fachlehrplaene",
    "bos|13|spanisch|spanisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_ahr",
    "bos|13|spanisch|spanisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_aufbaukurs",
    "bos|13|spanisch|spanisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_fortgefuehrt",
    "bos|13|spanisch|spanisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_grundkurs",
    "bos|13|technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "bos|13|technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/technologie/inhalt/fachlehrplaene?w_schulart=bos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "bos|13|volkswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/volkswirtschaftslehre/inhalt/fachlehrplaene",
    "bos|13|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "bos|13|wirtschaft_aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/bos/jgs/13/fach/wirtschaft_aktuell/inhalt/fachlehrplaene",
    "fos|10|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|10|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=abu",
    "fos|10|biologie|s-gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=s-gh",
    "fos|10|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "fos|10|chemie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/chemie/inhalt/fachlehrplaene",
    "fos|10|deutsch|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "fos|10|deutsch|vorklasse_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse_gueltig_ab_26_27",
    "fos|10|deutsch|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "fos|10|deutsch|vorkurs_guelitg_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs_guelitg_ab_26_27",
    "fos|10|englisch|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "fos|10|englisch|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "fos|10|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/ethik/inhalt/fachlehrplaene",
    "fos|10|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "fos|10|gpug-fosbos":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/gpug-fosbos/inhalt/fachlehrplaene",
    "fos|10|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=aktuell",
    "fos|10|gw|aktuell_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=aktuell_gueltig_ab_26_27",
    "fos|10|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ibv",
    "fos|10|ibv|ibv_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=ibv_gueltig_ab_26_27",
    "fos|10|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "fos|10|kuenstliche_intelligenz_informatik_u_technologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene",
    "fos|10|mathematik|vorklasse":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorklasse",
    "fos|10|mathematik|vorkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vorkurs",
    "fos|10|nt-bo":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/nt-bo/inhalt/fachlehrplaene",
    "fos|10|paedagigik-psychologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/paedagigik-psychologie/inhalt/fachlehrplaene",
    "fos|10|physik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/physik/inhalt/fachlehrplaene",
    "fos|10|technologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/10/fach/technologie/inhalt/fachlehrplaene",
    "fos|11|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|11|biologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/biologie/inhalt/fachlehrplaene",
    "fos|11|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "fos|11|chemie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu",
    "fos|11|chemie|gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=gh",
    "fos|11|chemie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=s",
    "fos|11|chemie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t",
    "fos|11|deutsch|gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=gueltig_ab_26_27",
    "fos|11|deutsch|gueltig_bis_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=gueltig_bis_26_27",
    "fos|11|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/englisch/inhalt/fachlehrplaene",
    "fos|11|fpa|abu-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu-taetigkeit",
    "fos|11|fpa|abu-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu-vertiefung",
    "fos|11|fpa|g-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=g-taetigkeit",
    "fos|11|fpa|g-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=g-vertiefung",
    "fos|11|fpa|gesundheit-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=gesundheit-taetigkeit",
    "fos|11|fpa|gesundheit-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=gesundheit-vertiefung",
    "fos|11|fpa|internat-wirtschaft-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=internat-wirtschaft-vertiefung",
    "fos|11|fpa|iw-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=iw-taetigkeit",
    "fos|11|fpa|s-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=s-taetigkeit",
    "fos|11|fpa|s-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=s-vertiefung",
    "fos|11|fpa|t-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t-taetigkeit",
    "fos|11|fpa|t-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t-vertiefung",
    "fos|11|fpa|w-taetigkeit":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=w-taetigkeit",
    "fos|11|fpa|w-vertiefung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/fpa/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=fpa&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=w-vertiefung",
    "fos|11|franzoesisch|franzoesisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=franzoesisch_aufbaukurs",
    "fos|11|franzoesisch|franzoesisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=franzoesisch_grundkurs",
    "fos|11|geschichte":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/geschichte/inhalt/fachlehrplaene",
    "fos|11|gestaltung|praxis":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/gestaltung/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gestaltung&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=praxis",
    "fos|11|gestaltung|theorie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/gestaltung/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gestaltung&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=theorie",
    "fos|11|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=aktuell",
    "fos|11|gw|aktuell_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=aktuell_gueltig_ab_26_27",
    "fos|11|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=ibv",
    "fos|11|ibv|ibv_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=ibv_gueltig_ab_26_27",
    "fos|11|ki":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/ki/inhalt/fachlehrplaene",
    "fos|11|kuenstliche_intelligenz_informatik_u_technologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene",
    "fos|11|mathematik|abu-g-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu-g-s-w-gh-iw",
    "fos|11|mathematik|abu-g-s-w-gh-iw_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu-g-s-w-gh-iw_gueltig_ab_26_27",
    "fos|11|mathematik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t",
    "fos|11|mathematik|t_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t_gueltig_ab_26_27",
    "fos|11|medien":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/medien/inhalt/fachlehrplaene",
    "fos|11|paedagigik-psychologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=s",
    "fos|11|paedagigik-psychologie|s_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=s_gueltig_ab_26_27",
    "fos|11|physik|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=abu",
    "fos|11|physik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t",
    "fos|11|physik|t_gueltig_ab_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=t_gueltig_ab_26_27",
    "fos|11|rechtslehre|iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/rechtslehre/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=rechtslehre&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=iw",
    "fos|11|rechtslehre|w":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/rechtslehre/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=rechtslehre&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=w",
    "fos|11|sozialwirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/sozialwirtschaft-und-recht/inhalt/fachlehrplaene",
    "fos|11|spanisch|spanisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spanisch_aufbaukurs",
    "fos|11|spanisch|spanisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=spanisch_grundkurs",
    "fos|11|technologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/technologie/inhalt/fachlehrplaene",
    "fos|11|volkswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/11/fach/volkswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|12|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|12|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "fos|12|biologie|g":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=g",
    "fos|12|biologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "fos|12|biologie|wahl-g-t-w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-g-t-w-iw",
    "fos|12|biotechnologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/biotechnologie/inhalt/fachlehrplaene",
    "fos|12|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "fos|12|chemie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "fos|12|chemie|gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=gh",
    "fos|12|chemie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "fos|12|deutsch|gueltig_bis_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=gueltig_bis_26_27",
    "fos|12|ebc":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/ebc/inhalt/fachlehrplaene",
    "fos|12|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/englisch/inhalt/fachlehrplaene",
    "fos|12|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/ethik/inhalt/fachlehrplaene",
    "fos|12|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "fos|12|experimentelles_gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/experimentelles_gestalten/inhalt/fachlehrplaene",
    "fos|12|franzoesisch|franzoesisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_ahr",
    "fos|12|franzoesisch|franzoesisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_aufbaukurs",
    "fos|12|franzoesisch|franzoesisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_fortgefuehrt",
    "fos|12|franzoesisch|franzoesisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=franzoesisch_grundkurs",
    "fos|12|gestaltung|praxis":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/gestaltung/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gestaltung&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=praxis",
    "fos|12|gestaltung|theorie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/gestaltung/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gestaltung&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=theorie",
    "fos|12|gwr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/gwr/inhalt/fachlehrplaene",
    "fos|12|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=aktuell",
    "fos|12|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=ibv",
    "fos|12|informatik|w-s-abu-g-gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=w-s-abu-g-gh",
    "fos|12|informatik|wahl-t-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/informatik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-t-iw",
    "fos|12|internationale_politik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/internationale_politik/inhalt/fachlehrplaene",
    "fos|12|isb|pflicht-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/isb/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=isb&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=pflicht-iw",
    "fos|12|isb|wahl-abu-g-t-w-s-gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/isb/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=isb&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-abu-g-t-w-s-gh",
    "fos|12|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/italienisch/inhalt/fachlehrplaene",
    "fos|12|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "fos|12|ki":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/ki/inhalt/fachlehrplaene",
    "fos|12|kuenstliche_intelligenz_informatik_u_technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "fos|12|kuenstliche_intelligenz_informatik_u_technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "fos|12|kuenstliche_intelligenz_u_wirtschaftsinformatik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/kuenstliche_intelligenz_u_wirtschaftsinformatik/inhalt/fachlehrplaene",
    "fos|12|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/kunst/inhalt/fachlehrplaene",
    "fos|12|latein":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/latein/inhalt/fachlehrplaene",
    "fos|12|mathematik|Wahl-abu-g-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=Wahl-abu-g-s-w-gh-iw",
    "fos|12|mathematik|abu-g-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu-g-s-w-gh-iw",
    "fos|12|mathematik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "fos|12|mathematik|wahl-t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=wahl-t",
    "fos|12|medien":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/medien/inhalt/fachlehrplaene",
    "fos|12|musik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/musik/inhalt/fachlehrplaene",
    "fos|12|nt-bo|g":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/nt-bo/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=nt-bo&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=g",
    "fos|12|nt-bo|w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/nt-bo/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=nt-bo&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=w-iw",
    "fos|12|paedagigik-psychologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "fos|12|physik|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "fos|12|physik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "fos|12|pug":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/pug/inhalt/fachlehrplaene",
    "fos|12|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/russisch/inhalt/fachlehrplaene",
    "fos|12|sg":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/sg/inhalt/fachlehrplaene",
    "fos|12|sozialwirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/sozialwirtschaft-und-recht/inhalt/fachlehrplaene",
    "fos|12|soziologie|abu-g-t-w-iw-gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/soziologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=soziologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu-g-t-w-iw-gh",
    "fos|12|soziologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/soziologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=soziologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=s",
    "fos|12|spanisch|spanisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_ahr",
    "fos|12|spanisch|spanisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_aufbaukurs",
    "fos|12|spanisch|spanisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_fortgefuehrt",
    "fos|12|spanisch|spanisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=spanisch_grundkurs",
    "fos|12|sport":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/sport/inhalt/fachlehrplaene",
    "fos|12|studier-und-arbeitstechniken":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/studier-und-arbeitstechniken/inhalt/fachlehrplaene",
    "fos|12|technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=abu",
    "fos|12|technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=12&wt_3=jgs&w_auspraegung=t",
    "fos|12|volkswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/volkswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|12|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "fos|12|wirtschaft_aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/12/fach/wirtschaft_aktuell/inhalt/fachlehrplaene",
    "fos|13|betriebswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/betriebswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|13|biologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "fos|13|biologie|g":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=g",
    "fos|13|biologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=s",
    "fos|13|biologie|wahl-g-t-w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/biologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=biologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-g-t-w-iw",
    "fos|13|biotechnologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/biotechnologie/inhalt/fachlehrplaene",
    "fos|13|bwl-rechnungswesen":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/bwl-rechnungswesen/inhalt/fachlehrplaene",
    "fos|13|chemie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "fos|13|chemie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/chemie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=chemie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "fos|13|deutsch|gueltig_bis_26_27":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/deutsch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=gueltig_bis_26_27",
    "fos|13|ebc":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/ebc/inhalt/fachlehrplaene",
    "fos|13|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/englisch/inhalt/fachlehrplaene",
    "fos|13|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/ethik/inhalt/fachlehrplaene",
    "fos|13|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "fos|13|experimentelles_gestalten":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/experimentelles_gestalten/inhalt/fachlehrplaene",
    "fos|13|franzoesisch|franzoesisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_ahr",
    "fos|13|franzoesisch|franzoesisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_aufbaukurs",
    "fos|13|franzoesisch|franzoesisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_fortgefuehrt",
    "fos|13|franzoesisch|franzoesisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/franzoesisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=franzoesisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=franzoesisch_grundkurs",
    "fos|13|gestaltung":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/gestaltung/inhalt/fachlehrplaene",
    "fos|13|gpug-fosbos":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/gpug-fosbos/inhalt/fachlehrplaene",
    "fos|13|gwr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/gwr/inhalt/fachlehrplaene",
    "fos|13|gw|aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/gw/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=gw&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=aktuell",
    "fos|13|ibv|ibv":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/ibv/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=ibv&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=ibv",
    "fos|13|informatik|w-s-abu-g-gh":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=w-s-abu-g-gh",
    "fos|13|informatik|wahl-t-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/informatik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=informatik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-t-iw",
    "fos|13|internationale_politik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/internationale_politik/inhalt/fachlehrplaene",
    "fos|13|isb":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/isb/inhalt/fachlehrplaene",
    "fos|13|italienisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/italienisch/inhalt/fachlehrplaene",
    "fos|13|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "fos|13|ki":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/ki/inhalt/fachlehrplaene",
    "fos|13|kuenstliche_intelligenz_informatik_u_technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "fos|13|kuenstliche_intelligenz_informatik_u_technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/kuenstliche_intelligenz_informatik_u_technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=kuenstliche_intelligenz_informatik_u_technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "fos|13|kunst":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/kunst/inhalt/fachlehrplaene",
    "fos|13|latein":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/latein/inhalt/fachlehrplaene",
    "fos|13|mathematik|abu-g-s-w-gh-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu-g-s-w-gh-iw",
    "fos|13|mathematik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "fos|13|mathematik|wahl-abu-g-s-w-t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/mathematik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-abu-g-s-w-t",
    "fos|13|medien":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/medien/inhalt/fachlehrplaene",
    "fos|13|musik":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/musik/inhalt/fachlehrplaene",
    "fos|13|nt-bo|g":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/nt-bo/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=nt-bo&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=g",
    "fos|13|nt-bo|w-iw":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/nt-bo/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=nt-bo&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=w-iw",
    "fos|13|paedagigik-psychologie|s":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/paedagigik-psychologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=paedagigik-psychologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=s",
    "fos|13|physik|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "fos|13|physik|wahl-abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/physik/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=physik&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=wahl-abu",
    "fos|13|russisch":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/russisch/inhalt/fachlehrplaene",
    "fos|13|sg":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/sg/inhalt/fachlehrplaene",
    "fos|13|sozialwirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/sozialwirtschaft-und-recht/inhalt/fachlehrplaene",
    "fos|13|soziologie":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/soziologie/inhalt/fachlehrplaene",
    "fos|13|spanisch|spanisch_ahr":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_ahr",
    "fos|13|spanisch|spanisch_aufbaukurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_aufbaukurs",
    "fos|13|spanisch|spanisch_fortgefuehrt":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_fortgefuehrt",
    "fos|13|spanisch|spanisch_grundkurs":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/spanisch/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=spanisch&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=spanisch_grundkurs",
    "fos|13|technologie|abu":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=abu",
    "fos|13|technologie|t":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/technologie/inhalt/fachlehrplaene?w_schulart=fos&wt_1=schulart&w_fach=technologie&wt_2=fach&w_jgs=13&wt_3=jgs&w_auspraegung=t",
    "fos|13|volkswirtschaftslehre":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/volkswirtschaftslehre/inhalt/fachlehrplaene",
    "fos|13|wirtschaft-und-recht":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/wirtschaft-und-recht/inhalt/fachlehrplaene",
    "fos|13|wirtschaft_aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/fos/jgs/13/fach/wirtschaft_aktuell/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|bsk|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|bsk|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|bsk|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|deutsch|dreistufig_gueltig_ab_2627":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig_gueltig_ab_2627",
    "wirtschaftsschule|10|deutsch|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|deutsch|vierstufig_gueltig_ab_2627":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig_gueltig_ab_2627",
    "wirtschaftsschule|10|deutsch|zweistufig_gueltig_ab_2526":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig_gueltig_ab_2526",
    "wirtschaftsschule|10|e-commerce":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/e-commerce/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|englisch|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|englisch|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|englisch|zweistufig_gueltig_ab_2526":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig_gueltig_ab_2526",
    "wirtschaftsschule|10|ethik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|ethik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|ethik|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|evangelische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|evangelische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|evangelische-religionslehre|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|fit_for_finance":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/fit_for_finance/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|gamification":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/gamification/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/gesundheit/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|gpug-ws|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|gpug-ws|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|informationsverarbeitung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/informationsverarbeitung/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|katholische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|katholische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|katholische-religionslehre|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|life_skills":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/life_skills/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|mathematik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|mathematik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|mathematik|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|oebdb":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/oebdb/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|pug":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/pug/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|robotik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/robotik/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|sport|diffsport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=diffsport",
    "wirtschaftsschule|10|sport|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|sport|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|10|sport|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|tourismus":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/tourismus/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|uebungsunternehmen|drei_vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/uebungsunternehmen/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=uebungsunternehmen&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=drei_vierstufig",
    "wirtschaftsschule|10|uebungsunternehmen|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/uebungsunternehmen/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=uebungsunternehmen&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|10|umweltoekonomie":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/umweltoekonomie/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|umwelttechnik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/umwelttechnik/inhalt/fachlehrplaene",
    "wirtschaftsschule|10|wirtschaftsgeografie|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/wirtschaftsgeografie/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=wirtschaftsgeografie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|10|wirtschaftsgeografie|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/10/fach/wirtschaftsgeografie/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=wirtschaftsgeografie&wt_2=fach&w_jgs=10&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|11|bsk":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/bsk/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|deutsch|zweistufig_gueltig_ab_2627":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=zweistufig_gueltig_ab_2627",
    "wirtschaftsschule|11|e-commerce":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/e-commerce/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/englisch/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/ethik/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|fit_for_finance":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/fit_for_finance/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|gamification":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/gamification/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/gesundheit/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|informationsverarbeitung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/informationsverarbeitung/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|life_skills":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/life_skills/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/mathematik/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|oebdb":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/oebdb/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|robotik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/robotik/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|sport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/sport/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|tourismus":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/tourismus/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|uebungsunternehmen|zweistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/uebungsunternehmen/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=uebungsunternehmen&wt_2=fach&w_jgs=11&wt_3=jgs&w_auspraegung=zweistufig",
    "wirtschaftsschule|11|umweltoekonomie":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/umweltoekonomie/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|umwelttechnik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/umwelttechnik/inhalt/fachlehrplaene",
    "wirtschaftsschule|11|wirtschaft_aktuell":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/11/fach/wirtschaft_aktuell/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/deutsch/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|digitales-leben-und-arbeiten":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/digitales-leben-und-arbeiten/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/englisch/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/ethik/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|gpug-ws":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/gpug-ws/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/mathematik/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|musischaesthetischebildung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/musischaesthetischebildung/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|mut":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/mut/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|oeb":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/oeb/inhalt/fachlehrplaene",
    "wirtschaftsschule|5|sport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/5/fach/sport/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/deutsch/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|digitales-leben-und-arbeiten":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/digitales-leben-und-arbeiten/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/englisch/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/ethik/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|gpug-ws":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/gpug-ws/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|mathematik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/mathematik/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|musischaesthetischebildung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/musischaesthetischebildung/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|mut":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/mut/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|oeb":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/oeb/inhalt/fachlehrplaene",
    "wirtschaftsschule|6|sport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/6/fach/sport/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|bsk":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/bsk/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/deutsch/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/englisch/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|ethik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/ethik/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|evangelische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/evangelische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|gpug-ws":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/gpug-ws/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|informationsverarbeitung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/informationsverarbeitung/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|katholische-religionslehre":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/katholische-religionslehre/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|mathematik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|7|mensch-und-umwelt":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/mensch-und-umwelt/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|musischaesthetischebildung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/musischaesthetischebildung/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|mut":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/mut/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|oebdb":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/oebdb/inhalt/fachlehrplaene",
    "wirtschaftsschule|7|sport|diffsport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=diffsport",
    "wirtschaftsschule|7|sport|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/7/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=7&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|bsk|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|bsk|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|deutsch|dreistufig_gueltig_ab_2425":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig_gueltig_ab_2425",
    "wirtschaftsschule|8|deutsch|vierstufig_gueltig_ab_2425":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig_gueltig_ab_2425",
    "wirtschaftsschule|8|englisch|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|englisch|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|ethik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|ethik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|evangelische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|evangelische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|gpug-ws|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|gpug-ws|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|informationsverarbeitung|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/informationsverarbeitung/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=informationsverarbeitung&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|informationsverarbeitung|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/informationsverarbeitung/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=informationsverarbeitung&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|katholische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|katholische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|mathematik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|mathematik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|mensch-und-umwelt|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mensch-und-umwelt/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mensch-und-umwelt&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|mensch-und-umwelt|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mensch-und-umwelt/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mensch-und-umwelt&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|musischaesthetischebildung|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/musischaesthetischebildung/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=musischaesthetischebildung&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|musischaesthetischebildung|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/musischaesthetischebildung/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=musischaesthetischebildung&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|mut|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mut/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mut&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|mut|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/mut/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mut&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|oebdb|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/oebdb/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=oebdb&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|oebdb|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/oebdb/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=oebdb&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|8|sport|diffsport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=diffsport",
    "wirtschaftsschule|8|sport|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|8|sport|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/8/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=8&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|bsk|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|bsk|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/bsk/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=bsk&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|deutsch|%20dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=%20dreistufig",
    "wirtschaftsschule|9|deutsch|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=deutsch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|e-commerce":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/e-commerce/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|englisch|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|englisch|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/englisch/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=englisch&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|ethik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|ethik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/ethik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=ethik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|evangelische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|evangelische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/evangelische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=evangelische-religionslehre&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|fit_for_finance":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/fit_for_finance/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|gamification":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/gamification/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|gesundheit":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/gesundheit/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|gpug-ws|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|gpug-ws|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/gpug-ws/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=gpug-ws&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|informationsverarbeitung":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/informationsverarbeitung/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|katholische-religionslehre|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|katholische-religionslehre|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/katholische-religionslehre/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=katholische-religionslehre&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|life_skills":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/life_skills/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|mathematik|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|mathematik|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|robotik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/robotik/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|sport|diffsport":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=diffsport",
    "wirtschaftsschule|9|sport|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|sport|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/sport/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=sport&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|tourismus":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/tourismus/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|uebungsunternehmen|drei_vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/uebungsunternehmen/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=uebungsunternehmen&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=drei_vierstufig",
    "wirtschaftsschule|9|umweltoekonomie":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/umweltoekonomie/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|umwelttechnik":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/umwelttechnik/inhalt/fachlehrplaene",
    "wirtschaftsschule|9|wirtschaft_aktuell|dreistufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/wirtschaft_aktuell/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=wirtschaft_aktuell&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=dreistufig",
    "wirtschaftsschule|9|wirtschaft_aktuell|vierstufig":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/wirtschaft_aktuell/inhalt/fachlehrplaene?w_schulart=wirtschaftsschule&wt_1=schulart&w_fach=wirtschaft_aktuell&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=vierstufig",
    "wirtschaftsschule|9|wirtschaftsgeografie":
      "https://www.lehrplanplus.bayern.de/schulart/wirtschaftsschule/jgs/9/fach/wirtschaftsgeografie/inhalt/fachlehrplaene",
  },
};
