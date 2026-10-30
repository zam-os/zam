/**
 * The default order of world knowledge: Bereiche › Fächer › Gebiete
 * (ADR 2026-10-13, Decision 3). Themen come from the content itself.
 *
 * In the product, regions and aliases for public content are published with
 * that content by the central content service. Until it ships them, this seed
 * stands in. Ported from the knowledge-atlas spike (PR #405); the raw area
 * slugs in `from` are the second domain segments the bundled tiles use.
 *
 * Pure data. A subject's hue lives in `palette.ts` under the same key.
 */

export interface SeedArea {
  key: string;
  name: string;
  /** Raw second domain segments that land in this Gebiet. */
  from: readonly string[];
}

export interface SeedSubject {
  key: string;
  name: string;
  areas: readonly SeedArea[];
}

export interface SeedBereich {
  key: string;
  name: string;
  subjects: readonly SeedSubject[];
}

export const WELTWISSEN_SEED: readonly SeedBereich[] = [
  {
    key: "logik",
    name: "Zahlen & Logik",
    subjects: [
      {
        key: "mathematik",
        name: "Mathematik",
        areas: [
          {
            key: "zahlen",
            name: "Zahlen & Rechnen",
            from: ["arithmetik", "zahlen", "groessen", "anwendung"],
          },
          {
            key: "algebra",
            name: "Terme & Gleichungen",
            from: ["algebra", "lineare-algebra"],
          },
          {
            key: "funktionen",
            name: "Funktionen & Analysis",
            from: ["funktionen", "analysis", "integralrechnung"],
          },
          {
            key: "geometrie",
            name: "Geometrie",
            from: ["geometrie", "raumgeometrie", "trigonometrie"],
          },
          { key: "stochastik", name: "Daten & Zufall", from: ["stochastik"] },
          {
            key: "vektoren",
            name: "Vektoren",
            from: ["vektoren", "analytische-geometrie"],
          },
        ],
      },
      {
        key: "informatik",
        name: "Informatik",
        areas: [
          {
            key: "information",
            name: "Information & Daten",
            from: ["grundlagen", "medien", "anwendung", "hypertext", "systeme"],
          },
          {
            key: "modellierung",
            name: "Modellieren & Programmieren",
            from: ["oom", "oop", "modellierung", "datenstrukturen"],
          },
          {
            key: "algorithmen",
            name: "Algorithmen",
            from: [
              "algorithmen",
              "graphen",
              "komplexitaetstheorie",
              "theoretische-informatik",
            ],
          },
          {
            key: "datenbanken",
            name: "Datenbanken",
            from: ["datenbanken", "sql"],
          },
          {
            key: "netze",
            name: "Netze & Sicherheit",
            from: [
              "netze",
              "netzwerkprotokolle",
              "rechnernetze",
              "sicherheit",
              "kryptographie",
            ],
          },
          {
            key: "softwaretechnik",
            name: "Softwaretechnik",
            from: ["softwaretechnik"],
          },
        ],
      },
    ],
  },
  {
    key: "natur",
    name: "Natur",
    subjects: [
      {
        key: "physik",
        name: "Physik",
        areas: [
          {
            key: "mechanik",
            name: "Mechanik",
            from: ["mechanik", "kinematik", "dynamik"],
          },
          { key: "waerme", name: "Wärme", from: ["thermodynamik", "waerme"] },
          {
            key: "elektrizitaet",
            name: "Elektrizität & Magnetismus",
            from: [
              "elektrik",
              "elektrizitaet",
              "elektrodynamik",
              "elektromagnetismus",
              "magnetismus",
              "schaltungen",
              "technik",
            ],
          },
          {
            key: "optik",
            name: "Licht & Wellen",
            from: ["optik", "wellen", "akustik"],
          },
          {
            key: "atome",
            name: "Atome & Kerne",
            from: [
              "atomphysik",
              "kernphysik",
              "kernenergie",
              "quantenphysik",
              "quantenmechanik",
            ],
          },
          {
            key: "kosmos",
            name: "Kosmos",
            from: [
              "astronomie",
              "astrophysik",
              "kosmologie",
              "relativitaetstheorie",
            ],
          },
        ],
      },
      {
        key: "chemie",
        name: "Chemie",
        areas: [
          {
            key: "teilchen",
            name: "Stoffe & Teilchen",
            from: [
              "allgemein",
              "allgemeine-chemie",
              "atombau",
              "atome",
              "bindung",
            ],
          },
          {
            key: "reaktionen",
            name: "Reaktionen",
            from: [
              "reaktionen",
              "stoechiometrie",
              "saeuren",
              "redox",
              "elektrochemie",
              "reaktionskinetik",
              "physikalische-chemie",
              "enzymkinetik",
            ],
          },
          {
            key: "organik",
            name: "Organische Chemie",
            from: [
              "organik",
              "organisch",
              "polymerchemie",
              "farbstoffe",
              "werkstoffe",
            ],
          },
          { key: "biochemie", name: "Biochemie", from: ["biochemie"] },
          {
            key: "analytik",
            name: "Analytik & Anwendung",
            from: [
              "analytisch",
              "analytische-chemie",
              "angewandte-chemie",
              "komplexchemie",
            ],
          },
        ],
      },
      {
        key: "biologie",
        name: "Biologie",
        areas: [
          {
            key: "forschen",
            name: "Forschen & Mikroskopieren",
            from: ["arbeitsweisen", "methoden"],
          },
          {
            key: "mikroorganismen",
            name: "Mikroorganismen",
            from: ["mikroben"],
          },
          { key: "pflanzen", name: "Pflanzen", from: ["botanik"] },
          {
            key: "tiere",
            name: "Tiere & Verhalten",
            from: ["zoologie", "verhaltensbiologie"],
          },
          {
            key: "mensch",
            name: "Der menschliche Körper",
            from: [
              "humanbiologie",
              "abwehr",
              "entwicklung",
              "physiologie",
              "sinne",
              "biomedizin",
              "stoffwechsel",
            ],
          },
          {
            key: "nerven",
            name: "Nerven & Gehirn",
            from: ["neuro", "neurobiologie", "synapsen"],
          },
          {
            key: "genetik",
            name: "Genetik",
            from: ["genetik", "mendel", "molekulargenetik", "gentechnik"],
          },
          {
            key: "evolution",
            name: "Evolution & Ökologie",
            from: ["evolution", "anthropologie", "oekologie"],
          },
        ],
      },
    ],
  },
  {
    key: "gesellschaft",
    name: "Mensch & Gesellschaft",
    subjects: [
      {
        key: "geschichte",
        name: "Geschichte",
        areas: [
          {
            key: "anfaenge",
            name: "Ur- & Frühgeschichte",
            from: ["urgeschichte"],
          },
          { key: "antike", name: "Antike", from: ["antike", "bayern"] },
          { key: "mittelalter", name: "Mittelalter", from: ["mittelalter"] },
          {
            key: "neuzeit",
            name: "Neuzeit & Revolutionen",
            from: ["neuzeit", "fruehe-neuzeit", "aufklaerung", "revolutionen"],
          },
          {
            key: "kaiserreich",
            name: "Kaiserreich & Weltkrieg",
            from: ["kaiserreich", "erster-weltkrieg"],
          },
          {
            key: "zeitgeschichte",
            name: "20. Jahrhundert",
            from: [
              "weimar",
              "weimarer-republik",
              "nationalsozialismus",
              "nachkriegszeit",
              "wiedervereinigung",
              "zeitgeschichte",
            ],
          },
        ],
      },
      {
        key: "geographie",
        name: "Geographie",
        areas: [
          {
            key: "erde",
            name: "Planet Erde",
            from: ["kartographie", "astronomie", "physisch", "geodynamik"],
          },
          {
            key: "klima",
            name: "Klima & Zonen",
            from: ["klimatologie", "tropen", "trockenraeume", "geooekologie"],
          },
          {
            key: "raeume",
            name: "Bayern, Deutschland, Europa",
            from: ["bayern", "deutschland", "europa"],
          },
          {
            key: "mensch",
            name: "Mensch & Wirtschaft",
            from: [
              "anthropogen",
              "demographie",
              "disparitaeten",
              "stadtgeographie",
              "wirtschaftsgeographie",
              "tourismus",
              "geopolitik",
              "nachhaltigkeit",
            ],
          },
        ],
      },
      {
        key: "politik-und-gesellschaft",
        name: "Politik und Gesellschaft",
        areas: [
          { key: "methoden", name: "Methoden und Arbeitstechniken", from: [] },
          { key: "mitwirkung", name: "Politische Mitwirkung", from: [] },
          { key: "strukturen", name: "Politische Strukturen", from: [] },
          {
            key: "handlungsfelder",
            name: "Politik, Gesellschaft und Wirtschaft",
            from: [],
          },
        ],
      },
      {
        key: "wirtschaft-recht",
        name: "Wirtschaft & Recht",
        areas: [
          {
            key: "wirtschaft",
            name: "Wirtschaft",
            from: [
              "markt",
              "betriebswirtschaft",
              "volkswirtschaft",
              "bwl",
              "mikrooekonomie",
              "makrooekonomie",
              "konjunktur",
              "wirtschaftspolitik",
              "ordnungspolitik",
              "aussenwirtschaft",
            ],
          },
          {
            key: "recht",
            name: "Recht",
            from: ["recht", "zivilrecht", "verbraucherschutz", "arbeitsrecht"],
          },
          { key: "rechnungswesen", name: "Rechnungswesen", from: [] },
        ],
      },
    ],
  },
  {
    key: "sprache",
    name: "Sprachen",
    subjects: [
      {
        key: "deutsch",
        name: "Deutsch",
        areas: [
          {
            key: "grammatik",
            name: "Sprache & Grammatik",
            from: ["grammatik", "stilmittel"],
          },
          {
            key: "rechtschreibung",
            name: "Rechtschreibung",
            from: ["rechtschreibung", "zeichensetzung"],
          },
          {
            key: "schreiben",
            name: "Schreiben & Argumentieren",
            from: ["texte", "argumentation"],
          },
          {
            key: "literatur",
            name: "Literatur",
            from: ["literatur", "epik", "theater", "literaturgeschichte"],
          },
          { key: "medien", name: "Medien", from: ["medien"] },
        ],
      },
      {
        key: "englisch",
        name: "Englisch",
        areas: [
          {
            key: "grammar",
            name: "Grammar",
            from: ["grammatik", "sprachwissenschaft"],
          },
          {
            key: "writing",
            name: "Writing & Mediation",
            from: ["textproduction", "mediation", "rhetorik"],
          },
          {
            key: "landeskunde",
            name: "Landeskunde",
            from: ["landeskunde", "gesellschaft"],
          },
          { key: "literatur", name: "Literature", from: ["drama"] },
        ],
      },
      {
        key: "franzoesisch",
        name: "Französisch",
        areas: [
          {
            key: "communication",
            name: "Communication",
            from: ["rencontres", "marche", "quotidien", "comprendre", "outils"],
          },
          {
            key: "grammaire",
            name: "Grammaire",
            from: [
              "grammatik",
              "subjonctif",
              "hypothesen",
              "hier",
              "echanges",
              "extension",
            ],
          },
          {
            key: "civilisation",
            name: "Civilisation",
            from: ["landeskunde", "politique", "voyage"],
          },
          {
            key: "litterature",
            name: "Littérature",
            from: ["literatur", "theater"],
          },
        ],
      },
      {
        key: "latein",
        name: "Latein",
        areas: [
          {
            key: "grammatik",
            name: "Grammatik & Metrik",
            from: ["grammatik", "syntax", "metrik"],
          },
          {
            key: "lektuere",
            name: "Lektüre",
            from: [
              "lektuere",
              "dichtung",
              "historiographie",
              "philosophie",
              "kaiserzeit",
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Raw first domain segments that belong to another subject, sometimes to a
 * fixed Gebiet. The same aliases drive the hue (`palette.ts`).
 */
export const WELTWISSEN_SUBJECT_ALIASES: Readonly<
  Record<string, { subject: string; area?: string }>
> = {
  bwr: { subject: "wirtschaft-recht", area: "rechnungswesen" },
  pug: { subject: "politik-und-gesellschaft" },
  wirtschaft: { subject: "wirtschaft-recht" },
  recht: { subject: "wirtschaft-recht" },
  wirtschaft_recht: { subject: "wirtschaft-recht" },
  nut: { subject: "biologie" },
};
