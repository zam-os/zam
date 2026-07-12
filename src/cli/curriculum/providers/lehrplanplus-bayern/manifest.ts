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
  capturedOn: "2026-07-12",
  sourceRevision: "LehrplanPLUS Realschule – Oktober 2023",

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
  },
};
