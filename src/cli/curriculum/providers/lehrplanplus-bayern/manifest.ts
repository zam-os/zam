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
 * on `capturedOn`; nothing here is inferred or guessed. Coverage is
 * intentionally partial — Realschule grade 5 (17 offered subjects) and
 * grade 9 (three subjects) are curated so far. Extending coverage (more
 * grades, subjects, or school types) is future agent work.
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
  capturedOn: "2026-07-12",
  sourceRevision: "LehrplanPLUS Realschule – Oktober 2023",

  schoolTypes: [
    { id: "grundschule", label: "Grundschule" },
    { id: "mittelschule", label: "Mittelschule" },
    { id: "foerderschule", label: "Förderschule" },
    { id: "realschule", label: "Realschule" },
    { id: "gymnasium", label: "Gymnasium" },
    { id: "wirtschaftsschule", label: "Wirtschaftsschule" },
    { id: "fos", label: "Fachoberschule" },
    { id: "bos", label: "Berufsoberschule" },
  ],

  grades: {
    realschule: ["5", "6", "7", "8", "9", "10"],
  },

  subjects: {
    realschule: [
      {
        id: "bwl-rechnungswesen",
        label: "Betriebswirtschaftslehre / Rechnungswesen",
      },
      { id: "biologie", label: "Biologie" },
      { id: "chemie", label: "Chemie" },
      { id: "deutsch", label: "Deutsch" },
      { id: "englisch", label: "Englisch" },
      { id: "ernaehrung_und_gesundheit", label: "Ernährung und Gesundheit" },
      { id: "ethik", label: "Ethik" },
      {
        id: "evangelische-religionslehre",
        label: "Evangelische Religionslehre",
      },
      { id: "franzoesisch", label: "Französisch" },
      { id: "geographie", label: "Geographie" },
      { id: "geschichte", label: "Geschichte" },
      { id: "it", label: "Informationstechnologie" },
      { id: "iu", label: "Islamischer Unterricht" },
      { id: "ir", label: "Israelitische Religionslehre" },
      {
        id: "katholische-religionslehre",
        label: "Katholische Religionslehre",
      },
      { id: "kunst", label: "Kunst" },
      { id: "mathematik", label: "Mathematik" },
      { id: "musik", label: "Musik" },
      { id: "or", label: "Orthodoxe Religionslehre" },
      { id: "physik", label: "Physik" },
      { id: "pug", label: "Politik und Gesellschaft" },
      { id: "soziallehre", label: "Soziallehre" },
      { id: "sozialwesen", label: "Sozialwesen" },
      { id: "spanisch", label: "Spanisch" },
      { id: "sport", label: "Sport" },
      { id: "textiles-gestalten", label: "Textiles Gestalten" },
      { id: "werken", label: "Werken" },
      { id: "wirtschaft-und-recht", label: "Wirtschaft und Recht" },
    ],
  },

  tracks: {
    "realschule|5|sport": [
      { id: "basis_sport", label: "Basissport 5" },
      { id: "diff_sport", label: "Differenzierter Sport" },
    ],
    "realschule|9|mathematik": [
      { id: "wpfg1", label: "Mathematik 9 (I)" },
      { id: "wpfg2-3", label: "Mathematik 9 (II/III)" },
    ],
  },

  topics: {
    "realschule|5|biologie": [
      { id: "lb1", label: "Prozessbezogene Kompetenzen" },
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
      { id: "lb1", label: "Sprechen und Zuhören" },
      { id: "lb2", label: "Lesen – mit Texten und weiteren Medien umgehen" },
      { id: "lb3", label: "Schreiben" },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|5|englisch": [
      { id: "lb1", label: "Kommunikative Kompetenzen" },
      { id: "lb2", label: "Interkulturelle Kompetenzen" },
      { id: "lb3", label: "Text- und Medienkompetenzen" },
      { id: "lb4", label: "Methodische Kompetenzen" },
      { id: "lb5", label: "Themengebiete" },
    ],
    "realschule|5|ethik": [
      { id: "lb1", label: "Meine Wirklichkeit und ich", hours: 16 },
      { id: "lb2", label: "Leben in der Familie", hours: 12 },
      { id: "lb3", label: "Spielen", hours: 12 },
      {
        id: "lb4",
        label: "Feste und Riten in Religion und Brauchtum",
        hours: 16,
      },
    ],
    "realschule|5|evangelische-religionslehre": [
      { id: "lb1", label: "Leben in Gemeinschaft" },
      { id: "lb2", label: "Die Bibel – Buch des Lebens" },
      {
        id: "lb3",
        label: "Erfahrungen mit Gott als Begleiter auf dem Lebensweg",
      },
      { id: "lb4", label: "Glaube wird sichtbar und hinterlässt Spuren" },
      {
        id: "lb5",
        label: "Schöpfung – Unsere Welt und unser Leben als Geschenk Gottes?",
      },
    ],
    "realschule|5|geographie": [
      { id: "lb1", label: "Einführung in das Fach", hours: 8 },
      { id: "lb2", label: "Planet Erde", hours: 8 },
      { id: "lb3", label: "Gestalt und Gliederung der Erde", hours: 10 },
      { id: "lb4", label: "Veränderung der Erdoberfläche", hours: 10 },
      {
        id: "lb5",
        label:
          "Naturräumliche und politische Strukturen in Deutschland und Bayern",
        hours: 8,
      },
      { id: "lb6", label: "Anwendung im Nahraum", hours: 8 },
      { id: "lb7", label: "Aktuelle geographische Fragestellung", hours: 4 },
    ],
    "realschule|5|it": [
      { id: "lb1", label: "Anfangsunterricht" },
      { id: "lb2", label: "Aufbauunterricht" },
      { id: "lb3", label: "Bilingualer Sachfachunterricht (optional)" },
    ],
    "realschule|5|iu": [
      { id: "lb1", label: "Miteinander leben – Eigene Aufgaben wahrnehmen" },
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
      { id: "lb2", label: "Bildende Kunst", hours: 20 },
      { id: "lb3", label: "Angewandte Kunst", hours: 20 },
    ],
    "realschule|5|mathematik": [
      { id: "lb1", label: "Natürliche Zahlen", hours: 50 },
      { id: "lb2", label: "Ganze Zahlen", hours: 20 },
      {
        id: "lb3",
        label: "Geometrische Grundvorstellungen und Grundbegriffe",
        hours: 30,
      },
      { id: "lb4", label: "Größen", hours: 20 },
      {
        id: "lb5",
        label: "Umfang und Flächeninhalt ebener Figuren",
        hours: 15,
      },
      { id: "lb6", label: "Auswertung von Daten", hours: 5 },
    ],
    "realschule|5|musik": [
      { id: "lb1", label: "Sprechen – Singen – Musizieren", hours: 20 },
      { id: "lb2", label: "Musik – Mensch – Zeit", hours: 10 },
      { id: "lb3", label: "Bewegung – Tanz – Szene", hours: 10 },
      { id: "lb4", label: "Musik und ihre Grundlagen", hours: 16 },
    ],
    "realschule|5|or": [
      { id: "lb1", label: "Miteinander leben", hours: 10 },
      { id: "lb2", label: "Von Gott und zu Gott sprechen", hours: 10 },
      { id: "lb3", label: "Die Bibel", hours: 12 },
      { id: "lb4", label: "Ursprung der Kirche", hours: 12 },
      { id: "lb5", label: "Kirche vor Ort", hours: 12 },
    ],
    "realschule|5|sport|basis_sport": [
      { id: "lb1", label: "Gesundheit und Fitness" },
      { id: "lb2", label: "Fairness/Kooperation/Selbstkompetenz" },
      { id: "lb3", label: "Freizeit und Umwelt" },
      { id: "lb4", label: "Sportliche Handlungsfelder" },
    ],
    "realschule|5|sport|diff_sport": [
      { id: "lb1", label: "Bewegungskünste" },
      { id: "lb2", label: "Radsport" },
      { id: "lb3", label: "Rhythmische Sportgymnastik" },
      { id: "lb4", label: "Sportklettern" },
    ],
    "realschule|5|textiles-gestalten": [
      { id: "lb1", label: "Eine textile Fläche bilden – Filzen", hours: 18 },
      { id: "lb2", label: "Eine textile Fläche bilden – Häkeln", hours: 18 },
      { id: "lb3", label: "Eine textile Fläche bilden – Weben", hours: 24 },
      { id: "lb4", label: "Eine textile Fläche bilden – Knüpfen", hours: 24 },
      {
        id: "lb5",
        label: "Eine textile Fläche verarbeiten – Handnähen, Maschinennähen",
        hours: 42,
      },
    ],
    "realschule|5|werken": [
      { id: "lb1", label: "Arbeiten mit dem Werkstoff Holz", hours: 28 },
      { id: "lb2", label: "Arbeiten mit Papierwerkstoffen", hours: 28 },
      { id: "lb3", label: "Arbeiten mit plastischen Massen", hours: 28 },
    ],
    "realschule|9|mathematik|wpfg1": [
      { id: "lb1", label: "Reelle Zahlen", hours: 10 },
      { id: "lb2", label: "Zentrische Streckung", hours: 17 },
      { id: "lb3", label: "Rechtwinklige Dreiecke", hours: 20 },
      { id: "lb4", label: "Kreis", hours: 10 },
      { id: "lb5", label: "Raumgeometrie", hours: 20 },
      { id: "lb6", label: "Systeme linearer Gleichungen", hours: 12 },
      {
        id: "lb7",
        label: "Quadratische Funktionen und quadratische Gleichungen",
        hours: 42,
      },
      { id: "lb8", label: "Daten und Zufall", hours: 9 },
    ],
    "realschule|9|mathematik|wpfg2-3": [
      { id: "lb1", label: "Reelle Zahlen", hours: 7 },
      { id: "lb2", label: "Zentrische Streckung", hours: 13 },
      { id: "lb3", label: "Rechtwinklige Dreiecke", hours: 20 },
      { id: "lb4", label: "Kreis", hours: 10 },
      { id: "lb5", label: "Lineare Funktionen", hours: 15 },
      { id: "lb6", label: "Systeme linearer Gleichungen", hours: 10 },
      { id: "lb7", label: "Daten und Zufall", hours: 9 },
    ],
    "realschule|9|deutsch": [
      { id: "lb1", label: "Sprechen und Zuhören" },
      { id: "lb2", label: "Lesen – mit Texten und weiteren Medien umgehen" },
      { id: "lb3", label: "Schreiben" },
      {
        id: "lb4",
        label: "Sprachgebrauch und Sprache untersuchen und reflektieren",
      },
    ],
    "realschule|9|englisch": [
      { id: "lb1", label: "Kommunikative Kompetenzen" },
      { id: "lb2", label: "Interkulturelle Kompetenzen" },
      { id: "lb3", label: "Text- und Medienkompetenzen" },
      { id: "lb4", label: "Methodische Kompetenzen" },
      { id: "lb5", label: "Themengebiete" },
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
    "realschule|9|mathematik|wpfg1":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1",
    "realschule|9|mathematik|wpfg2-3":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg2-3",
    "realschule|9|deutsch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene",
    "realschule|9|englisch":
      "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/englisch/inhalt/fachlehrplaene",
  },
};
