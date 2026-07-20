import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BwCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Official Baden-Württemberg Bildungsplan 2016 catalog
 * (https://www.bildungsplaene-bw.de/).
 *
 * Captured 2026-07-20. Content URLs point at the subject pages on the
 * official portal (HTML), not a generic landing page. Grade ranges follow the
 * portal bands (GS 1–4; SEK1 5–10; Gymnasium 5–12; GMSO Oberstufe 11–13).
 * V2 rewrites, dual/berufliche Schulen and SBBZ archives are out of scope.
 */
export interface BildungsplanBwManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  catalogPaths: BwCatalogPath[];
}

export const BILDUNGSPLAN_BW_MANIFEST: BildungsplanBwManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-20",
  sourceRevision: "Bildungspläne BW 2016 (GS, SEK1, Gymnasium, GMSO)",

  schoolTypes: [
    {
      id: "grundschule",
      label: "Grundschule",
    },
    {
      id: "sek1",
      label: "Gemeinsamer Bildungsplan Sekundarstufe I",
    },
    {
      id: "gymnasium",
      label: "Gymnasium",
    },
    {
      id: "gemeinschaftsschule-oberstufe",
      label: "Oberstufe an Gemeinschaftsschulen",
    },
  ],

  grades: {
    grundschule: ["1", "2", "3", "4"],
    sek1: ["5", "6", "7", "8", "9", "10"],
    gymnasium: ["5", "6", "7", "8", "9", "10", "11", "12"],
    "gemeinschaftsschule-oberstufe": ["11", "12", "13"],
  },

  subjects: {
    grundschule: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
      },
      {
        id: "altkatholische-religion",
        label: "Altkatholische Religionslehre",
      },
      {
        id: "bewegung-spiel-sport",
        label: "Bewegung, Spiel und Sport",
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
        label: "Französisch",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religionslehre sunnitischer Prägung",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
      },
      {
        id: "kunst-werken",
        label: "Kunst/Werken",
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
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch-Orthodoxe Religionslehre",
      },
    ],
    sek1: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
      },
      {
        id: "aes",
        label: "Alltagskultur, Ernährung, Soziales (AES)",
      },
      {
        id: "altkatholische-religion",
        label: "Altkatholische Religionslehre",
      },
      {
        id: "informatik-aufbaukurs",
        label: "Aufbaukurs Informatik",
      },
      {
        id: "basiskurs-medienbildung",
        label: "Basiskurs Medienbildung",
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
        id: "bnt",
        label: "Biologie, Naturphänomene und Technik (BNT)",
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
        id: "englisch-1",
        label: "Englisch als erste Fremdsprache",
      },
      {
        id: "englisch-2",
        label: "Englisch als zweite Fremdsprache",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch-1",
        label: "Französisch als erste Fremdsprache",
      },
      {
        id: "franzoesisch-2",
        label: "Französisch als zweite Fremdsprache",
      },
      {
        id: "gemeinschaftskunde",
        label: "Gemeinschaftskunde",
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
        id: "informatik-wahlfach",
        label: "Informatik (Wahlfach)",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religionslehre sunnitischer Prägung",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        id: "physik",
        label: "Physik",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch-Orthodoxe Religionslehre",
      },
      {
        id: "technik",
        label: "Technik – Wahlpflichtfach",
      },
      {
        id: "wbs",
        label: "Wirtschaft / Berufs- und Studienorientierung (WBS)",
      },
    ],
    gymnasium: [
      {
        id: "alevitische-religion",
        label: "Alevitische Religionslehre",
      },
      {
        id: "altkatholische-religion",
        label: "Altkatholische Religionslehre",
      },
      {
        id: "astronomie",
        label: "Astronomie – Wahlfach in der Oberstufe",
      },
      {
        id: "informatik-aufbaukurs",
        label: "Aufbaukurs Informatik",
      },
      {
        id: "basiskurs-medienbildung",
        label: "Basiskurs Medienbildung",
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
        id: "bnt",
        label: "Biologie, Naturphänomene und Technik (BNT)",
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
        id: "englisch-1",
        label: "Englisch als erste Fremdsprache",
      },
      {
        id: "englisch-2",
        label: "Englisch als zweite Fremdsprache",
      },
      {
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
      },
      {
        id: "franzoesisch-3",
        label: "Französisch als dritte Fremdsprache – Profilfach",
      },
      {
        id: "franzoesisch-1",
        label: "Französisch als erste Fremdsprache",
      },
      {
        id: "franzoesisch-2",
        label: "Französisch als zweite Fremdsprache",
      },
      {
        id: "gemeinschaftskunde",
        label: "Gemeinschaftskunde",
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
        id: "informatik-wahlfach-os",
        label: "Informatik – Wahlfach in der Oberstufe",
      },
      {
        id: "imp-profil",
        label: "Informatik, Mathematik, Physik (IMP) – Profilfach",
      },
      {
        id: "islamische-religion",
        label: "Islamische Religionslehre sunnitischer Prägung",
      },
      {
        id: "juedische-religion",
        label: "Jüdische Religionslehre",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
      },
      {
        id: "latein-3",
        label: "Latein als dritte Fremdsprache – Profilfach",
      },
      {
        id: "latein-1",
        label: "Latein als erste Fremdsprache",
      },
      {
        id: "latein-2",
        label: "Latein als zweite Fremdsprache",
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
        id: "nwt-profil",
        label: "Naturwissenschaft und Technik (NwT) – Profilfach",
      },
      {
        id: "orthodoxe-religion",
        label: "Orthodoxe Religionslehre",
      },
      {
        id: "philosophie",
        label: "Philosophie – Wahlfach in der Oberstufe",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "psychologie",
        label: "Psychologie – Wahlfach in der Oberstufe",
      },
      {
        id: "spanisch-3",
        label: "Spanisch als dritte Fremdsprache – Profilfach",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "syrisch-orthodoxe-religion",
        label: "Syrisch-Orthodoxe Religionslehre",
      },
      {
        id: "wirtschaft",
        label: "Wirtschaft",
      },
      {
        id: "wbs",
        label: "Wirtschaft / Berufs- und Studienorientierung (WBS)",
      },
    ],
    "gemeinschaftsschule-oberstufe": [
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
        id: "ethik",
        label: "Ethik",
      },
      {
        id: "evangelische-religion",
        label: "Evangelische Religionslehre",
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
        id: "geographie",
        label: "Geographie",
      },
      {
        id: "geschichte",
        label: "Geschichte",
      },
      {
        id: "katholische-religion",
        label: "Katholische Religionslehre",
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
        label: "Philosophie – Wahlfach in der Oberstufe",
      },
      {
        id: "physik",
        label: "Physik",
      },
      {
        id: "psychologie",
        label: "Psychologie – Wahlfach in der Oberstufe",
      },
      {
        id: "sport",
        label: "Sport",
      },
      {
        id: "wirtschaft",
        label: "Wirtschaft",
      },
      {
        id: "wbs",
        label: "Wirtschaft / Berufs- und Studienorientierung (WBS)",
      },
    ],
  },

  tracks: {},

  topics: {
    "gemeinschaftsschule-oberstufe|11|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule-oberstufe|11|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|11|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gemeinschaftsschule-oberstufe|11|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|11|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|11|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|11|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|11|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gemeinschaftsschule-oberstufe|11|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gemeinschaftsschule-oberstufe|11|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|11|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|11|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gemeinschaftsschule-oberstufe|11|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|11|philosophie": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|11|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule-oberstufe|11|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gemeinschaftsschule-oberstufe|11|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gemeinschaftsschule-oberstufe|11|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gemeinschaftsschule-oberstufe|12|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule-oberstufe|12|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|12|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|12|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gemeinschaftsschule-oberstufe|12|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|12|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|12|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|12|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|12|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gemeinschaftsschule-oberstufe|12|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gemeinschaftsschule-oberstufe|12|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|12|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|12|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gemeinschaftsschule-oberstufe|12|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|12|philosophie": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|12|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule-oberstufe|12|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gemeinschaftsschule-oberstufe|12|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gemeinschaftsschule-oberstufe|12|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gemeinschaftsschule-oberstufe|13|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gemeinschaftsschule-oberstufe|13|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|13|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|13|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gemeinschaftsschule-oberstufe|13|englisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|13|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|13|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|13|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|13|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gemeinschaftsschule-oberstufe|13|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gemeinschaftsschule-oberstufe|13|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gemeinschaftsschule-oberstufe|13|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gemeinschaftsschule-oberstufe|13|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gemeinschaftsschule-oberstufe|13|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|13|philosophie": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gemeinschaftsschule-oberstufe|13|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gemeinschaftsschule-oberstufe|13|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gemeinschaftsschule-oberstufe|13|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gemeinschaftsschule-oberstufe|13|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gemeinschaftsschule-oberstufe|13|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "grundschule|1|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|bewegung-spiel-sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|1|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
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
    "grundschule|1|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|1|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|1|kunst-werken": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|1|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
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
    "grundschule|1|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|bewegung-spiel-sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|2|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
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
    "grundschule|2|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|2|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|2|kunst-werken": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|2|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
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
    "grundschule|2|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|bewegung-spiel-sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|3|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
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
    "grundschule|3|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|3|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|3|kunst-werken": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|3|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
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
    "grundschule|3|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|bewegung-spiel-sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "grundschule|4|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
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
    "grundschule|4|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|franzoesisch": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "grundschule|4|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "grundschule|4|kunst-werken": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "grundschule|4|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
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
    "grundschule|4|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|basiskurs-medienbildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|5|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|5|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|bnt": [
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
    "gymnasium|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|5|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|franzoesisch-2": [
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
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|5|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|5|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|5|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|5|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|5|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|5|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|basiskurs-medienbildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|6|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "gymnasium|6|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|bnt": [
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
    "gymnasium|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|6|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|franzoesisch-2": [
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
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|6|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|6|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|6|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|6|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|6|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|6|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
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
    "gymnasium|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|7|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|7|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|7|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|7|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|7|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|7|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|7|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|7|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|7|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|7|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|8|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
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
    "gymnasium|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|8|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|8|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|8|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|8|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|8|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|8|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|8|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|8|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|8|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|8|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|8|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|9|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
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
    "gymnasium|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|9|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|9|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|9|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|9|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|9|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|9|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|9|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|9|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|9|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|9|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|9|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|10|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
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
    "gymnasium|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|10|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|10|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|10|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|10|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|10|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|10|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|10|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|10|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|10|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|10|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|10|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|11|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|11|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|11|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|11|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|11|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|11|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|11|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|11|informatik-wahlfach-os": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|11|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|11|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|11|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|philosophie": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|11|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|11|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|11|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|11|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|11|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|11|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "gymnasium|12|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|astronomie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
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
    "gymnasium|12|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "gymnasium|12|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|12|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|franzoesisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "gymnasium|12|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "gymnasium|12|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "gymnasium|12|imp-profil": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|12|informatik-wahlfach-os": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|12|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|latein-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|latein-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|latein-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|12|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "gymnasium|12|nwt-profil": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|philosophie": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "gymnasium|12|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "gymnasium|12|psychologie": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "gymnasium|12|spanisch-3": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "gymnasium|12|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "gymnasium|12|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "gymnasium|12|wirtschaft": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "sek1|5|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|basiskurs-medienbildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|5|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|5|bnt": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|5|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|5|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|5|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|5|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|5|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|5|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|5|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|5|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|5|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|5|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|5|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|basiskurs-medienbildung": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|6|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|6|bnt": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|6|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|6|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|6|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|6|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|6|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|6|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|6|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|6|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|6|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|6|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|6|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|aes": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|7|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|7|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|7|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|7|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|7|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|7|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|7|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|7|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|7|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|7|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "sek1|7|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|7|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|7|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|7|informatik-wahlfach": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|7|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|7|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|7|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|7|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|7|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|7|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|7|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "sek1|8|aes": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|8|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|8|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|8|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|8|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|8|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|8|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|8|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|8|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|8|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|8|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "sek1|8|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|8|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|8|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|8|informatik-wahlfach": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|8|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|8|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|8|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|8|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|8|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|8|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|8|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "sek1|9|aes": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|9|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|9|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|9|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|9|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|9|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|9|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|9|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|9|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|9|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|9|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "sek1|9|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|9|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|9|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|9|informatik-wahlfach": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|9|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|9|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|9|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|9|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|9|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|9|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|9|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
    "sek1|10|aes": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|10|alevitische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|altkatholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|bildende-kunst": [
      { id: "produktion", label: "Bildnerische Produktion" },
      { id: "rezeption", label: "Rezeption" },
      { id: "reflexion", label: "Reflexion" },
    ],
    "sek1|10|biologie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|10|chemie": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|10|deutsch": [
      { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
      { id: "schreiben", label: "Schreiben" },
      { id: "lesen", label: "Lesen" },
      {
        id: "sprache-sprachgebrauch",
        label: "Sprache und Sprachgebrauch untersuchen",
      },
    ],
    "sek1|10|englisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|10|englisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|10|ethik": [
      { id: "gutes-leben", label: "Gutes Leben" },
      { id: "gerechtigkeit", label: "Gerechtigkeit" },
      { id: "wahrheit", label: "Wahrheit und Wissen" },
    ],
    "sek1|10|evangelische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|franzoesisch-1": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|10|franzoesisch-2": [
      { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
      {
        id: "interkulturelle-kompetenzen",
        label: "Interkulturelle Kompetenzen",
      },
      { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
      { id: "text-medienkompetenz", label: "Text- und Medienkompetenz" },
    ],
    "sek1|10|gemeinschaftskunde": [
      { id: "politische-ordnung", label: "Politische Ordnung" },
      { id: "gesellschaft", label: "Gesellschaft" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "internationale-politik", label: "Internationale Politik" },
    ],
    "sek1|10|geographie": [
      { id: "raumorientierung", label: "Räumliche Orientierung" },
      { id: "systeme", label: "Systeme und Prozesse" },
      { id: "nachhaltigkeit", label: "Nachhaltigkeit und Zukunft" },
    ],
    "sek1|10|geschichte": [
      { id: "fragekompetenz", label: "Fragekompetenz" },
      { id: "methodenkompetenz", label: "Methodenkompetenz" },
      { id: "reflexionskompetenz", label: "Reflexionskompetenz" },
      { id: "sachkompetenz", label: "Sachkompetenz" },
    ],
    "sek1|10|informatik-aufbaukurs": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|10|informatik-wahlfach": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      { id: "rechner-netze", label: "Rechner und Netze" },
      {
        id: "informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "sek1|10|islamische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|juedische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|katholische-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl – Variable – Operation" },
      { id: "leitidee-messen", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "sek1|10|musik": [
      { id: "musizieren", label: "Musizieren" },
      { id: "hoeren", label: "Hören" },
      { id: "wissen", label: "Musikalisches Wissen" },
    ],
    "sek1|10|orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|physik": [
      { id: "fachwissen", label: "Fachwissen" },
      { id: "erkenntnisgewinnung", label: "Erkenntnisgewinnung" },
      { id: "kommunikation", label: "Kommunikation" },
      { id: "bewertung", label: "Bewertung" },
    ],
    "sek1|10|sport": [
      { id: "bewegen", label: "Bewegen und Spielen" },
      { id: "leisten", label: "Leisten" },
      { id: "gesundheit", label: "Gesundheit und Fairness" },
    ],
    "sek1|10|syrisch-orthodoxe-religion": [
      { id: "mensch-welt", label: "Mensch und Welt" },
      { id: "religionen", label: "Religionen und Weltanschauungen" },
      { id: "ethik", label: "Ethische Fragen" },
    ],
    "sek1|10|technik": [
      { id: "kompetenzen", label: "Kompetenzen und Standards" },
      { id: "inhalte", label: "Inhaltsbezogene Kompetenzen" },
      { id: "prozesse", label: "Prozessbezogene Kompetenzen" },
    ],
    "sek1|10|wbs": [
      { id: "berufliche-orientierung", label: "Berufliche Orientierung" },
      { id: "wirtschaft", label: "Wirtschaft" },
      { id: "verbraucherbildung", label: "Verbraucherbildung" },
    ],
  },

  contentUrls: {
    "gemeinschaftsschule-oberstufe|11|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BK",
    "gemeinschaftsschule-oberstufe|11|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BIO",
    "gemeinschaftsschule-oberstufe|11|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_CH",
    "gemeinschaftsschule-oberstufe|11|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_D",
    "gemeinschaftsschule-oberstufe|11|englisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_E",
    "gemeinschaftsschule-oberstufe|11|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_ETH",
    "gemeinschaftsschule-oberstufe|11|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_REV",
    "gemeinschaftsschule-oberstufe|11|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_F",
    "gemeinschaftsschule-oberstufe|11|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GK",
    "gemeinschaftsschule-oberstufe|11|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GEO",
    "gemeinschaftsschule-oberstufe|11|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_G",
    "gemeinschaftsschule-oberstufe|11|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_RRK",
    "gemeinschaftsschule-oberstufe|11|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_M",
    "gemeinschaftsschule-oberstufe|11|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_MUS",
    "gemeinschaftsschule-oberstufe|11|philosophie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PHIL",
    "gemeinschaftsschule-oberstufe|11|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PH",
    "gemeinschaftsschule-oberstufe|11|psychologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PSY",
    "gemeinschaftsschule-oberstufe|11|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_SPO",
    "gemeinschaftsschule-oberstufe|11|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WBS",
    "gemeinschaftsschule-oberstufe|11|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WI",
    "gemeinschaftsschule-oberstufe|12|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BK",
    "gemeinschaftsschule-oberstufe|12|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BIO",
    "gemeinschaftsschule-oberstufe|12|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_CH",
    "gemeinschaftsschule-oberstufe|12|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_D",
    "gemeinschaftsschule-oberstufe|12|englisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_E",
    "gemeinschaftsschule-oberstufe|12|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_ETH",
    "gemeinschaftsschule-oberstufe|12|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_REV",
    "gemeinschaftsschule-oberstufe|12|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_F",
    "gemeinschaftsschule-oberstufe|12|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GK",
    "gemeinschaftsschule-oberstufe|12|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GEO",
    "gemeinschaftsschule-oberstufe|12|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_G",
    "gemeinschaftsschule-oberstufe|12|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_RRK",
    "gemeinschaftsschule-oberstufe|12|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_M",
    "gemeinschaftsschule-oberstufe|12|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_MUS",
    "gemeinschaftsschule-oberstufe|12|philosophie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PHIL",
    "gemeinschaftsschule-oberstufe|12|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PH",
    "gemeinschaftsschule-oberstufe|12|psychologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PSY",
    "gemeinschaftsschule-oberstufe|12|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_SPO",
    "gemeinschaftsschule-oberstufe|12|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WBS",
    "gemeinschaftsschule-oberstufe|12|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WI",
    "gemeinschaftsschule-oberstufe|13|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BK",
    "gemeinschaftsschule-oberstufe|13|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_BIO",
    "gemeinschaftsschule-oberstufe|13|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_CH",
    "gemeinschaftsschule-oberstufe|13|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_D",
    "gemeinschaftsschule-oberstufe|13|englisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_E",
    "gemeinschaftsschule-oberstufe|13|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_ETH",
    "gemeinschaftsschule-oberstufe|13|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_REV",
    "gemeinschaftsschule-oberstufe|13|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_F",
    "gemeinschaftsschule-oberstufe|13|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GK",
    "gemeinschaftsschule-oberstufe|13|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_GEO",
    "gemeinschaftsschule-oberstufe|13|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_G",
    "gemeinschaftsschule-oberstufe|13|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_RRK",
    "gemeinschaftsschule-oberstufe|13|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_M",
    "gemeinschaftsschule-oberstufe|13|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_MUS",
    "gemeinschaftsschule-oberstufe|13|philosophie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PHIL",
    "gemeinschaftsschule-oberstufe|13|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PH",
    "gemeinschaftsschule-oberstufe|13|psychologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_PSY",
    "gemeinschaftsschule-oberstufe|13|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_SPO",
    "gemeinschaftsschule-oberstufe|13|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WBS",
    "gemeinschaftsschule-oberstufe|13|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GMSO_WI",
    "grundschule|1|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RALE",
    "grundschule|1|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RAK",
    "grundschule|1|bewegung-spiel-sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_BSS",
    "grundschule|1|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_D",
    "grundschule|1|englisch": "https://www.bildungsplaene-bw.de/,Lde/6211029",
    "grundschule|1|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_REV",
    "grundschule|1|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/6211051",
    "grundschule|1|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RISL",
    "grundschule|1|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RJUED",
    "grundschule|1|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RRK",
    "grundschule|1|kunst-werken":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_KUW",
    "grundschule|1|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M",
    "grundschule|1|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_MUS",
    "grundschule|1|sachunterricht":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_SU",
    "grundschule|1|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RSYR",
    "grundschule|2|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RALE",
    "grundschule|2|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RAK",
    "grundschule|2|bewegung-spiel-sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_BSS",
    "grundschule|2|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_D",
    "grundschule|2|englisch": "https://www.bildungsplaene-bw.de/,Lde/6211029",
    "grundschule|2|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_REV",
    "grundschule|2|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/6211051",
    "grundschule|2|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RISL",
    "grundschule|2|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RJUED",
    "grundschule|2|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RRK",
    "grundschule|2|kunst-werken":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_KUW",
    "grundschule|2|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M",
    "grundschule|2|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_MUS",
    "grundschule|2|sachunterricht":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_SU",
    "grundschule|2|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RSYR",
    "grundschule|3|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RALE",
    "grundschule|3|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RAK",
    "grundschule|3|bewegung-spiel-sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_BSS",
    "grundschule|3|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_D",
    "grundschule|3|englisch": "https://www.bildungsplaene-bw.de/,Lde/6211029",
    "grundschule|3|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_REV",
    "grundschule|3|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/6211051",
    "grundschule|3|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RISL",
    "grundschule|3|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RJUED",
    "grundschule|3|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RRK",
    "grundschule|3|kunst-werken":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_KUW",
    "grundschule|3|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M",
    "grundschule|3|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_MUS",
    "grundschule|3|sachunterricht":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_SU",
    "grundschule|3|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RSYR",
    "grundschule|4|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RALE",
    "grundschule|4|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RAK",
    "grundschule|4|bewegung-spiel-sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_BSS",
    "grundschule|4|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_D",
    "grundschule|4|englisch": "https://www.bildungsplaene-bw.de/,Lde/6211029",
    "grundschule|4|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_REV",
    "grundschule|4|franzoesisch":
      "https://www.bildungsplaene-bw.de/,Lde/6211051",
    "grundschule|4|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RISL",
    "grundschule|4|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RJUED",
    "grundschule|4|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RRK",
    "grundschule|4|kunst-werken":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_KUW",
    "grundschule|4|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M",
    "grundschule|4|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_MUS",
    "grundschule|4|sachunterricht":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_SU",
    "grundschule|4|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_RSYR",
    "gymnasium|5|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|5|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|5|basiskurs-medienbildung":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BMB",
    "gymnasium|5|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|5|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|5|bnt":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BNT",
    "gymnasium|5|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|5|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|5|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|5|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|5|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|5|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|5|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|5|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|5|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|5|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|5|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|5|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|5|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|5|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|5|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|5|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|5|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|5|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|5|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|5|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|5|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|6|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|6|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|6|basiskurs-medienbildung":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BMB",
    "gymnasium|6|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|6|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|6|bnt":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BNT",
    "gymnasium|6|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|6|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|6|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|6|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|6|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|6|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|6|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|6|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|6|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|6|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|6|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|6|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|6|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|6|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|6|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|6|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|6|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|6|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|6|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|6|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|6|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|7|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|7|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|7|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|7|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|7|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|7|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|7|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|7|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|7|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|7|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|7|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|7|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|7|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|7|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|7|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|7|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|7|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|7|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INF7",
    "gymnasium|7|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|7|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|7|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|7|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|7|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|7|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|7|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|7|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|7|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|7|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|7|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|7|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|7|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|7|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|7|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WBS",
    "gymnasium|8|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|8|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|8|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|8|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|8|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|8|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|8|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|8|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|8|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|8|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|8|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|8|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|8|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|8|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|8|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|8|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|8|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|8|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INF7",
    "gymnasium|8|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|8|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|8|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|8|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|8|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|8|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|8|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|8|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|8|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|8|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|8|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|8|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|8|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|8|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|8|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WBS",
    "gymnasium|8|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WI",
    "gymnasium|9|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|9|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|9|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|9|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|9|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|9|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|9|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|9|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|9|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|9|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|9|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|9|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|9|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|9|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|9|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|9|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|9|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|9|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INF7",
    "gymnasium|9|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|9|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|9|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|9|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|9|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|9|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|9|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|9|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|9|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|9|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|9|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|9|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|9|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|9|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|9|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WBS",
    "gymnasium|9|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WI",
    "gymnasium|10|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|10|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|10|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|10|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|10|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|10|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|10|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|10|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|10|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|10|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|10|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|10|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|10|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|10|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|10|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|10|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|10|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|10|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INF7",
    "gymnasium|10|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|10|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|10|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|10|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|10|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|10|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|10|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|10|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|10|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|10|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|10|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|10|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|10|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|10|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|10|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WBS",
    "gymnasium|10|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WI",
    "gymnasium|11|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|11|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|11|astronomie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ASTRO",
    "gymnasium|11|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|11|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|11|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|11|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|11|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|11|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|11|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|11|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|11|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|11|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|11|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|11|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|11|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|11|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|11|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|11|informatik-wahlfach-os":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INFWFO",
    "gymnasium|11|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|11|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|11|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|11|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|11|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|11|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|11|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|11|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|11|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|11|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|11|philosophie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PHIL",
    "gymnasium|11|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|11|psychologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PSY",
    "gymnasium|11|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|11|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|11|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|11|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WI",
    "gymnasium|12|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RALE",
    "gymnasium|12|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RAK",
    "gymnasium|12|astronomie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ASTRO",
    "gymnasium|12|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BK",
    "gymnasium|12|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
    "gymnasium|12|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|12|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_D",
    "gymnasium|12|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E1",
    "gymnasium|12|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_E2",
    "gymnasium|12|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_ETH",
    "gymnasium|12|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_REV",
    "gymnasium|12|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F1",
    "gymnasium|12|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F2",
    "gymnasium|12|franzoesisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_F3",
    "gymnasium|12|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GK",
    "gymnasium|12|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_GEO",
    "gymnasium|12|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_G",
    "gymnasium|12|imp-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_IMP",
    "gymnasium|12|informatik-wahlfach-os":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_INFWFO",
    "gymnasium|12|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RISL",
    "gymnasium|12|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RJUED",
    "gymnasium|12|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RRK",
    "gymnasium|12|latein-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L1",
    "gymnasium|12|latein-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L2",
    "gymnasium|12|latein-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_L3",
    "gymnasium|12|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_M",
    "gymnasium|12|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_MUS",
    "gymnasium|12|nwt-profil":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_NWT",
    "gymnasium|12|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RORTH",
    "gymnasium|12|philosophie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PHIL",
    "gymnasium|12|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|12|psychologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PSY",
    "gymnasium|12|spanisch-3":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPA3",
    "gymnasium|12|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_SPO",
    "gymnasium|12|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_RSYR",
    "gymnasium|12|wirtschaft":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_WI",
    "sek1|5|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|5|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|5|basiskurs-medienbildung":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BMB",
    "sek1|5|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|5|bnt":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BNT",
    "sek1|5|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|5|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|5|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|5|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|5|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|5|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|5|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|5|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|5|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|5|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|5|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|5|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|5|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|5|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|5|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|6|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|6|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|6|basiskurs-medienbildung":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BMB",
    "sek1|6|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|6|bnt":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BNT",
    "sek1|6|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|6|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|6|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|6|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|6|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|6|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|6|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|6|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|6|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|6|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|6|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|6|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|6|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|6|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|6|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|7|aes":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_AES",
    "sek1|7|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|7|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|7|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|7|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BIO",
    "sek1|7|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_CH",
    "sek1|7|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|7|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|7|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E2",
    "sek1|7|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|7|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|7|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|7|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F2",
    "sek1|7|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GK",
    "sek1|7|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|7|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|7|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INF7",
    "sek1|7|informatik-wahlfach":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INFWF",
    "sek1|7|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|7|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|7|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|7|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|7|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|7|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|7|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_PH",
    "sek1|7|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|7|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|7|technik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_T",
    "sek1|7|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_WBS",
    "sek1|8|aes":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_AES",
    "sek1|8|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|8|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|8|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|8|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BIO",
    "sek1|8|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_CH",
    "sek1|8|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|8|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|8|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E2",
    "sek1|8|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|8|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|8|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|8|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F2",
    "sek1|8|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GK",
    "sek1|8|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|8|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|8|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INF7",
    "sek1|8|informatik-wahlfach":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INFWF",
    "sek1|8|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|8|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|8|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|8|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|8|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|8|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|8|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_PH",
    "sek1|8|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|8|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|8|technik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_T",
    "sek1|8|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_WBS",
    "sek1|9|aes":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_AES",
    "sek1|9|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|9|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|9|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|9|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BIO",
    "sek1|9|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_CH",
    "sek1|9|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|9|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|9|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E2",
    "sek1|9|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|9|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|9|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|9|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F2",
    "sek1|9|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GK",
    "sek1|9|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|9|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|9|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INF7",
    "sek1|9|informatik-wahlfach":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INFWF",
    "sek1|9|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|9|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|9|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|9|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|9|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|9|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|9|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_PH",
    "sek1|9|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|9|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|9|technik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_T",
    "sek1|9|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_WBS",
    "sek1|10|aes":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_AES",
    "sek1|10|alevitische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RALE",
    "sek1|10|altkatholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RAK",
    "sek1|10|bildende-kunst":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BK",
    "sek1|10|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_BIO",
    "sek1|10|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_CH",
    "sek1|10|deutsch":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_D",
    "sek1|10|englisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E1",
    "sek1|10|englisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_E2",
    "sek1|10|ethik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_ETH",
    "sek1|10|evangelische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_REV",
    "sek1|10|franzoesisch-1":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F1",
    "sek1|10|franzoesisch-2":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_F2",
    "sek1|10|gemeinschaftskunde":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GK",
    "sek1|10|geographie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_GEO",
    "sek1|10|geschichte":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_G",
    "sek1|10|informatik-aufbaukurs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INF7",
    "sek1|10|informatik-wahlfach":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INFWF",
    "sek1|10|islamische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RISL",
    "sek1|10|juedische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RJUED",
    "sek1|10|katholische-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RRK",
    "sek1|10|mathematik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_M",
    "sek1|10|musik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_MUS",
    "sek1|10|orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RORTH",
    "sek1|10|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_PH",
    "sek1|10|sport":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_SPO",
    "sek1|10|syrisch-orthodoxe-religion":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_RSYR",
    "sek1|10|technik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_T",
    "sek1|10|wbs":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_WBS",
  },

  catalogPaths: [
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "bildende-kunst",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "biologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "chemie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "deutsch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "englisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "ethik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "franzoesisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "gemeinschaftskunde",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "geographie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "geschichte",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "katholische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "mathematik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "musik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "philosophie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "physik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "psychologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "sport",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "wbs",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "11",
      subject: "wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "bildende-kunst",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "biologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "chemie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "deutsch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "englisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "ethik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "franzoesisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "gemeinschaftskunde",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "geographie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "geschichte",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "katholische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "mathematik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "musik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "philosophie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "physik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "psychologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "sport",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "wbs",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "12",
      subject: "wirtschaft",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "bildende-kunst",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "biologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "chemie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "deutsch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "englisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "ethik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "evangelische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "franzoesisch",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "gemeinschaftskunde",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "geographie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "geschichte",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "katholische-religion",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "mathematik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "musik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "philosophie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "physik",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "psychologie",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "sport",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "wbs",
    },
    {
      schoolType: "gemeinschaftsschule-oberstufe",
      grade: "13",
      subject: "wirtschaft",
    },
    { schoolType: "grundschule", grade: "1", subject: "alevitische-religion" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "altkatholische-religion",
    },
    { schoolType: "grundschule", grade: "1", subject: "bewegung-spiel-sport" },
    { schoolType: "grundschule", grade: "1", subject: "deutsch" },
    { schoolType: "grundschule", grade: "1", subject: "englisch" },
    { schoolType: "grundschule", grade: "1", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "1", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "1", subject: "kunst-werken" },
    { schoolType: "grundschule", grade: "1", subject: "mathematik" },
    { schoolType: "grundschule", grade: "1", subject: "musik" },
    { schoolType: "grundschule", grade: "1", subject: "sachunterricht" },
    {
      schoolType: "grundschule",
      grade: "1",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "2", subject: "alevitische-religion" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "altkatholische-religion",
    },
    { schoolType: "grundschule", grade: "2", subject: "bewegung-spiel-sport" },
    { schoolType: "grundschule", grade: "2", subject: "deutsch" },
    { schoolType: "grundschule", grade: "2", subject: "englisch" },
    { schoolType: "grundschule", grade: "2", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "2", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "2", subject: "kunst-werken" },
    { schoolType: "grundschule", grade: "2", subject: "mathematik" },
    { schoolType: "grundschule", grade: "2", subject: "musik" },
    { schoolType: "grundschule", grade: "2", subject: "sachunterricht" },
    {
      schoolType: "grundschule",
      grade: "2",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "3", subject: "alevitische-religion" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "altkatholische-religion",
    },
    { schoolType: "grundschule", grade: "3", subject: "bewegung-spiel-sport" },
    { schoolType: "grundschule", grade: "3", subject: "deutsch" },
    { schoolType: "grundschule", grade: "3", subject: "englisch" },
    { schoolType: "grundschule", grade: "3", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "3", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "3", subject: "kunst-werken" },
    { schoolType: "grundschule", grade: "3", subject: "mathematik" },
    { schoolType: "grundschule", grade: "3", subject: "musik" },
    { schoolType: "grundschule", grade: "3", subject: "sachunterricht" },
    {
      schoolType: "grundschule",
      grade: "3",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "grundschule", grade: "4", subject: "alevitische-religion" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "altkatholische-religion",
    },
    { schoolType: "grundschule", grade: "4", subject: "bewegung-spiel-sport" },
    { schoolType: "grundschule", grade: "4", subject: "deutsch" },
    { schoolType: "grundschule", grade: "4", subject: "englisch" },
    { schoolType: "grundschule", grade: "4", subject: "evangelische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "franzoesisch" },
    { schoolType: "grundschule", grade: "4", subject: "islamische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "juedische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "katholische-religion" },
    { schoolType: "grundschule", grade: "4", subject: "kunst-werken" },
    { schoolType: "grundschule", grade: "4", subject: "mathematik" },
    { schoolType: "grundschule", grade: "4", subject: "musik" },
    { schoolType: "grundschule", grade: "4", subject: "sachunterricht" },
    {
      schoolType: "grundschule",
      grade: "4",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "5", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "altkatholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "basiskurs-medienbildung" },
    { schoolType: "gymnasium", grade: "5", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "5", subject: "biologie" },
    { schoolType: "gymnasium", grade: "5", subject: "bnt" },
    { schoolType: "gymnasium", grade: "5", subject: "chemie" },
    { schoolType: "gymnasium", grade: "5", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "5", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "5", subject: "ethik" },
    { schoolType: "gymnasium", grade: "5", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "5", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "5", subject: "geographie" },
    { schoolType: "gymnasium", grade: "5", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "5", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "5", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "5", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "5", subject: "musik" },
    { schoolType: "gymnasium", grade: "5", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "5", subject: "physik" },
    { schoolType: "gymnasium", grade: "5", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "5",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "6", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "altkatholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "basiskurs-medienbildung" },
    { schoolType: "gymnasium", grade: "6", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "6", subject: "biologie" },
    { schoolType: "gymnasium", grade: "6", subject: "bnt" },
    { schoolType: "gymnasium", grade: "6", subject: "chemie" },
    { schoolType: "gymnasium", grade: "6", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "6", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "6", subject: "ethik" },
    { schoolType: "gymnasium", grade: "6", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "6", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "6", subject: "geographie" },
    { schoolType: "gymnasium", grade: "6", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "6", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "6", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "6", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "6", subject: "musik" },
    { schoolType: "gymnasium", grade: "6", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "6", subject: "physik" },
    { schoolType: "gymnasium", grade: "6", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "6",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "7", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "altkatholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "7", subject: "biologie" },
    { schoolType: "gymnasium", grade: "7", subject: "chemie" },
    { schoolType: "gymnasium", grade: "7", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "7", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "7", subject: "ethik" },
    { schoolType: "gymnasium", grade: "7", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "7", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "7", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "7", subject: "geographie" },
    { schoolType: "gymnasium", grade: "7", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "7", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "7", subject: "informatik-aufbaukurs" },
    { schoolType: "gymnasium", grade: "7", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "7", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "7", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "7", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "7", subject: "musik" },
    { schoolType: "gymnasium", grade: "7", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "7", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "7", subject: "physik" },
    { schoolType: "gymnasium", grade: "7", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "7", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "7",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "7", subject: "wbs" },
    { schoolType: "gymnasium", grade: "8", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "altkatholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "8", subject: "biologie" },
    { schoolType: "gymnasium", grade: "8", subject: "chemie" },
    { schoolType: "gymnasium", grade: "8", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "8", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "8", subject: "ethik" },
    { schoolType: "gymnasium", grade: "8", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "8", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "8", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "8", subject: "geographie" },
    { schoolType: "gymnasium", grade: "8", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "8", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "8", subject: "informatik-aufbaukurs" },
    { schoolType: "gymnasium", grade: "8", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "8", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "8", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "8", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "8", subject: "musik" },
    { schoolType: "gymnasium", grade: "8", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "8", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "8", subject: "physik" },
    { schoolType: "gymnasium", grade: "8", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "8", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "8",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "8", subject: "wbs" },
    { schoolType: "gymnasium", grade: "8", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "9", subject: "alevitische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "altkatholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "9", subject: "biologie" },
    { schoolType: "gymnasium", grade: "9", subject: "chemie" },
    { schoolType: "gymnasium", grade: "9", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "9", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "9", subject: "ethik" },
    { schoolType: "gymnasium", grade: "9", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "9", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "9", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "9", subject: "geographie" },
    { schoolType: "gymnasium", grade: "9", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "9", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "9", subject: "informatik-aufbaukurs" },
    { schoolType: "gymnasium", grade: "9", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "9", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "9", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "9", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "9", subject: "musik" },
    { schoolType: "gymnasium", grade: "9", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "9", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "9", subject: "physik" },
    { schoolType: "gymnasium", grade: "9", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "9", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "9",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "9", subject: "wbs" },
    { schoolType: "gymnasium", grade: "9", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "10", subject: "alevitische-religion" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "altkatholische-religion",
    },
    { schoolType: "gymnasium", grade: "10", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "10", subject: "biologie" },
    { schoolType: "gymnasium", grade: "10", subject: "chemie" },
    { schoolType: "gymnasium", grade: "10", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "10", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "10", subject: "ethik" },
    { schoolType: "gymnasium", grade: "10", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "10", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "10", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "10", subject: "geographie" },
    { schoolType: "gymnasium", grade: "10", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "10", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "10", subject: "informatik-aufbaukurs" },
    { schoolType: "gymnasium", grade: "10", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "10", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "10", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "10", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "10", subject: "musik" },
    { schoolType: "gymnasium", grade: "10", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "10", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "10", subject: "physik" },
    { schoolType: "gymnasium", grade: "10", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "10", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "10",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "10", subject: "wbs" },
    { schoolType: "gymnasium", grade: "10", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "11", subject: "alevitische-religion" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "altkatholische-religion",
    },
    { schoolType: "gymnasium", grade: "11", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "11", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "11", subject: "biologie" },
    { schoolType: "gymnasium", grade: "11", subject: "chemie" },
    { schoolType: "gymnasium", grade: "11", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "11", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "11", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "11", subject: "ethik" },
    { schoolType: "gymnasium", grade: "11", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "11", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "11", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "11", subject: "geographie" },
    { schoolType: "gymnasium", grade: "11", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "11", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "11", subject: "informatik-wahlfach-os" },
    { schoolType: "gymnasium", grade: "11", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "11", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "11", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "11", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "11", subject: "musik" },
    { schoolType: "gymnasium", grade: "11", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "11", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "11", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "11", subject: "physik" },
    { schoolType: "gymnasium", grade: "11", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "11", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "11", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "11",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "11", subject: "wirtschaft" },
    { schoolType: "gymnasium", grade: "12", subject: "alevitische-religion" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "altkatholische-religion",
    },
    { schoolType: "gymnasium", grade: "12", subject: "astronomie" },
    { schoolType: "gymnasium", grade: "12", subject: "bildende-kunst" },
    { schoolType: "gymnasium", grade: "12", subject: "biologie" },
    { schoolType: "gymnasium", grade: "12", subject: "chemie" },
    { schoolType: "gymnasium", grade: "12", subject: "deutsch" },
    { schoolType: "gymnasium", grade: "12", subject: "englisch-1" },
    { schoolType: "gymnasium", grade: "12", subject: "englisch-2" },
    { schoolType: "gymnasium", grade: "12", subject: "ethik" },
    { schoolType: "gymnasium", grade: "12", subject: "evangelische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch-1" },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch-2" },
    { schoolType: "gymnasium", grade: "12", subject: "franzoesisch-3" },
    { schoolType: "gymnasium", grade: "12", subject: "gemeinschaftskunde" },
    { schoolType: "gymnasium", grade: "12", subject: "geographie" },
    { schoolType: "gymnasium", grade: "12", subject: "geschichte" },
    { schoolType: "gymnasium", grade: "12", subject: "imp-profil" },
    { schoolType: "gymnasium", grade: "12", subject: "informatik-wahlfach-os" },
    { schoolType: "gymnasium", grade: "12", subject: "islamische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "juedische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "katholische-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "latein-1" },
    { schoolType: "gymnasium", grade: "12", subject: "latein-2" },
    { schoolType: "gymnasium", grade: "12", subject: "latein-3" },
    { schoolType: "gymnasium", grade: "12", subject: "mathematik" },
    { schoolType: "gymnasium", grade: "12", subject: "musik" },
    { schoolType: "gymnasium", grade: "12", subject: "nwt-profil" },
    { schoolType: "gymnasium", grade: "12", subject: "orthodoxe-religion" },
    { schoolType: "gymnasium", grade: "12", subject: "philosophie" },
    { schoolType: "gymnasium", grade: "12", subject: "physik" },
    { schoolType: "gymnasium", grade: "12", subject: "psychologie" },
    { schoolType: "gymnasium", grade: "12", subject: "spanisch-3" },
    { schoolType: "gymnasium", grade: "12", subject: "sport" },
    {
      schoolType: "gymnasium",
      grade: "12",
      subject: "syrisch-orthodoxe-religion",
    },
    { schoolType: "gymnasium", grade: "12", subject: "wirtschaft" },
    { schoolType: "sek1", grade: "5", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "5", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "5", subject: "basiskurs-medienbildung" },
    { schoolType: "sek1", grade: "5", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "5", subject: "bnt" },
    { schoolType: "sek1", grade: "5", subject: "deutsch" },
    { schoolType: "sek1", grade: "5", subject: "englisch-1" },
    { schoolType: "sek1", grade: "5", subject: "ethik" },
    { schoolType: "sek1", grade: "5", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "5", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "5", subject: "geographie" },
    { schoolType: "sek1", grade: "5", subject: "geschichte" },
    { schoolType: "sek1", grade: "5", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "5", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "5", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "5", subject: "mathematik" },
    { schoolType: "sek1", grade: "5", subject: "musik" },
    { schoolType: "sek1", grade: "5", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "5", subject: "sport" },
    { schoolType: "sek1", grade: "5", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "6", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "6", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "6", subject: "basiskurs-medienbildung" },
    { schoolType: "sek1", grade: "6", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "6", subject: "bnt" },
    { schoolType: "sek1", grade: "6", subject: "deutsch" },
    { schoolType: "sek1", grade: "6", subject: "englisch-1" },
    { schoolType: "sek1", grade: "6", subject: "ethik" },
    { schoolType: "sek1", grade: "6", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "6", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "6", subject: "geographie" },
    { schoolType: "sek1", grade: "6", subject: "geschichte" },
    { schoolType: "sek1", grade: "6", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "6", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "6", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "6", subject: "mathematik" },
    { schoolType: "sek1", grade: "6", subject: "musik" },
    { schoolType: "sek1", grade: "6", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "6", subject: "sport" },
    { schoolType: "sek1", grade: "6", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "7", subject: "aes" },
    { schoolType: "sek1", grade: "7", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "7", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "7", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "7", subject: "biologie" },
    { schoolType: "sek1", grade: "7", subject: "chemie" },
    { schoolType: "sek1", grade: "7", subject: "deutsch" },
    { schoolType: "sek1", grade: "7", subject: "englisch-1" },
    { schoolType: "sek1", grade: "7", subject: "englisch-2" },
    { schoolType: "sek1", grade: "7", subject: "ethik" },
    { schoolType: "sek1", grade: "7", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "7", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "7", subject: "franzoesisch-2" },
    { schoolType: "sek1", grade: "7", subject: "gemeinschaftskunde" },
    { schoolType: "sek1", grade: "7", subject: "geographie" },
    { schoolType: "sek1", grade: "7", subject: "geschichte" },
    { schoolType: "sek1", grade: "7", subject: "informatik-aufbaukurs" },
    { schoolType: "sek1", grade: "7", subject: "informatik-wahlfach" },
    { schoolType: "sek1", grade: "7", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "7", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "7", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "7", subject: "mathematik" },
    { schoolType: "sek1", grade: "7", subject: "musik" },
    { schoolType: "sek1", grade: "7", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "7", subject: "physik" },
    { schoolType: "sek1", grade: "7", subject: "sport" },
    { schoolType: "sek1", grade: "7", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "7", subject: "technik" },
    { schoolType: "sek1", grade: "7", subject: "wbs" },
    { schoolType: "sek1", grade: "8", subject: "aes" },
    { schoolType: "sek1", grade: "8", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "8", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "8", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "8", subject: "biologie" },
    { schoolType: "sek1", grade: "8", subject: "chemie" },
    { schoolType: "sek1", grade: "8", subject: "deutsch" },
    { schoolType: "sek1", grade: "8", subject: "englisch-1" },
    { schoolType: "sek1", grade: "8", subject: "englisch-2" },
    { schoolType: "sek1", grade: "8", subject: "ethik" },
    { schoolType: "sek1", grade: "8", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "8", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "8", subject: "franzoesisch-2" },
    { schoolType: "sek1", grade: "8", subject: "gemeinschaftskunde" },
    { schoolType: "sek1", grade: "8", subject: "geographie" },
    { schoolType: "sek1", grade: "8", subject: "geschichte" },
    { schoolType: "sek1", grade: "8", subject: "informatik-aufbaukurs" },
    { schoolType: "sek1", grade: "8", subject: "informatik-wahlfach" },
    { schoolType: "sek1", grade: "8", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "8", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "8", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "8", subject: "mathematik" },
    { schoolType: "sek1", grade: "8", subject: "musik" },
    { schoolType: "sek1", grade: "8", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "8", subject: "physik" },
    { schoolType: "sek1", grade: "8", subject: "sport" },
    { schoolType: "sek1", grade: "8", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "8", subject: "technik" },
    { schoolType: "sek1", grade: "8", subject: "wbs" },
    { schoolType: "sek1", grade: "9", subject: "aes" },
    { schoolType: "sek1", grade: "9", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "9", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "9", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "9", subject: "biologie" },
    { schoolType: "sek1", grade: "9", subject: "chemie" },
    { schoolType: "sek1", grade: "9", subject: "deutsch" },
    { schoolType: "sek1", grade: "9", subject: "englisch-1" },
    { schoolType: "sek1", grade: "9", subject: "englisch-2" },
    { schoolType: "sek1", grade: "9", subject: "ethik" },
    { schoolType: "sek1", grade: "9", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "9", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "9", subject: "franzoesisch-2" },
    { schoolType: "sek1", grade: "9", subject: "gemeinschaftskunde" },
    { schoolType: "sek1", grade: "9", subject: "geographie" },
    { schoolType: "sek1", grade: "9", subject: "geschichte" },
    { schoolType: "sek1", grade: "9", subject: "informatik-aufbaukurs" },
    { schoolType: "sek1", grade: "9", subject: "informatik-wahlfach" },
    { schoolType: "sek1", grade: "9", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "9", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "9", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "9", subject: "mathematik" },
    { schoolType: "sek1", grade: "9", subject: "musik" },
    { schoolType: "sek1", grade: "9", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "9", subject: "physik" },
    { schoolType: "sek1", grade: "9", subject: "sport" },
    { schoolType: "sek1", grade: "9", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "9", subject: "technik" },
    { schoolType: "sek1", grade: "9", subject: "wbs" },
    { schoolType: "sek1", grade: "10", subject: "aes" },
    { schoolType: "sek1", grade: "10", subject: "alevitische-religion" },
    { schoolType: "sek1", grade: "10", subject: "altkatholische-religion" },
    { schoolType: "sek1", grade: "10", subject: "bildende-kunst" },
    { schoolType: "sek1", grade: "10", subject: "biologie" },
    { schoolType: "sek1", grade: "10", subject: "chemie" },
    { schoolType: "sek1", grade: "10", subject: "deutsch" },
    { schoolType: "sek1", grade: "10", subject: "englisch-1" },
    { schoolType: "sek1", grade: "10", subject: "englisch-2" },
    { schoolType: "sek1", grade: "10", subject: "ethik" },
    { schoolType: "sek1", grade: "10", subject: "evangelische-religion" },
    { schoolType: "sek1", grade: "10", subject: "franzoesisch-1" },
    { schoolType: "sek1", grade: "10", subject: "franzoesisch-2" },
    { schoolType: "sek1", grade: "10", subject: "gemeinschaftskunde" },
    { schoolType: "sek1", grade: "10", subject: "geographie" },
    { schoolType: "sek1", grade: "10", subject: "geschichte" },
    { schoolType: "sek1", grade: "10", subject: "informatik-aufbaukurs" },
    { schoolType: "sek1", grade: "10", subject: "informatik-wahlfach" },
    { schoolType: "sek1", grade: "10", subject: "islamische-religion" },
    { schoolType: "sek1", grade: "10", subject: "juedische-religion" },
    { schoolType: "sek1", grade: "10", subject: "katholische-religion" },
    { schoolType: "sek1", grade: "10", subject: "mathematik" },
    { schoolType: "sek1", grade: "10", subject: "musik" },
    { schoolType: "sek1", grade: "10", subject: "orthodoxe-religion" },
    { schoolType: "sek1", grade: "10", subject: "physik" },
    { schoolType: "sek1", grade: "10", subject: "sport" },
    { schoolType: "sek1", grade: "10", subject: "syrisch-orthodoxe-religion" },
    { schoolType: "sek1", grade: "10", subject: "technik" },
    { schoolType: "sek1", grade: "10", subject: "wbs" },
  ],
};
