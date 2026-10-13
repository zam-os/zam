/**
 * The atlas's default order of world knowledge: continents (Bereiche),
 * countries (Fächer), provinces (Gebiete). Themen and Begriffe come from the
 * tiles. School grade is not a place here — it only sorts foundations first.
 *
 * In ZAM this is the agent's work: it sorts new knowledge into a logical
 * place, so the learner never has to build structure before learning.
 * The raw token domains ("mathematik/geometrie", "bwr/bilanz", …) are messy;
 * this table maps them onto a small, readable set of Gebiete.
 */

export type PatternKind = "diag" | "antidiag" | "dots" | "cross" | "waves" | "grid" | "hlines" | "rings" | "zigzag" | "vlines";

export interface AreaDef {
  key: string;
  name: string;
  /** Raw domain areas that land here. */
  from: string[];
}

export interface SubjectDef {
  key: string;
  name: string;
  hue: number;
  areas: AreaDef[];
}

export interface ContinentDef {
  key: string;
  name: string;
  subjects: SubjectDef[];
}

export const CONTINENTS: ContinentDef[] = [
  {
    key: "logik",
    name: "Zahlen & Logik",
    subjects: [
      {
        key: "mathematik",
        name: "Mathematik",
        hue: 218,
        areas: [
          { key: "zahlen", name: "Zahlen & Rechnen", from: ["arithmetik", "zahlen", "groessen", "anwendung"] },
          { key: "algebra", name: "Terme & Gleichungen", from: ["algebra", "lineare-algebra"] },
          { key: "funktionen", name: "Funktionen & Analysis", from: ["funktionen", "analysis", "integralrechnung"] },
          { key: "geometrie", name: "Geometrie", from: ["geometrie", "raumgeometrie", "trigonometrie"] },
          { key: "stochastik", name: "Daten & Zufall", from: ["stochastik"] },
          { key: "vektoren", name: "Vektoren", from: ["vektoren", "analytische-geometrie"] },
        ],
      },
      {
        key: "informatik",
        name: "Informatik",
        hue: 250,
        areas: [
          { key: "information", name: "Information & Daten", from: ["grundlagen", "medien", "anwendung", "hypertext", "systeme"] },
          { key: "modellierung", name: "Modellieren & Programmieren", from: ["oom", "oop", "modellierung", "datenstrukturen"] },
          { key: "algorithmen", name: "Algorithmen", from: ["algorithmen", "graphen", "komplexitaetstheorie", "theoretische-informatik"] },
          { key: "datenbanken", name: "Datenbanken", from: ["datenbanken", "sql"] },
          { key: "netze", name: "Netze & Sicherheit", from: ["netze", "netzwerkprotokolle", "rechnernetze", "sicherheit", "kryptographie"] },
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
        hue: 188,
        areas: [
          { key: "mechanik", name: "Mechanik", from: ["mechanik", "kinematik", "dynamik"] },
          { key: "waerme", name: "Wärme", from: ["thermodynamik", "waerme"] },
          { key: "elektrizitaet", name: "Elektrizität & Magnetismus", from: ["elektrik", "elektrizitaet", "elektrodynamik", "elektromagnetismus", "magnetismus", "schaltungen", "technik"] },
          { key: "optik", name: "Licht & Wellen", from: ["optik", "wellen", "akustik"] },
          { key: "atome", name: "Atome & Kerne", from: ["atomphysik", "kernphysik", "kernenergie", "quantenphysik", "quantenmechanik"] },
          { key: "kosmos", name: "Kosmos", from: ["astronomie", "astrophysik", "kosmologie", "relativitaetstheorie"] },
        ],
      },
      {
        key: "chemie",
        name: "Chemie",
        hue: 152,
        areas: [
          { key: "teilchen", name: "Stoffe & Teilchen", from: ["allgemein", "allgemeine-chemie", "atombau", "atome", "bindung"] },
          { key: "reaktionen", name: "Reaktionen", from: ["reaktionen", "stoechiometrie", "saeuren", "redox", "elektrochemie", "reaktionskinetik", "physikalische-chemie", "enzymkinetik"] },
          { key: "organik", name: "Organische Chemie", from: ["organik", "organisch", "polymerchemie", "farbstoffe", "werkstoffe"] },
          { key: "biochemie", name: "Biochemie", from: ["biochemie"] },
          { key: "analytik", name: "Analytik & Anwendung", from: ["analytisch", "analytische-chemie", "angewandte-chemie", "komplexchemie"] },
        ],
      },
      {
        key: "biologie",
        name: "Biologie",
        hue: 100,
        areas: [
          { key: "forschen", name: "Forschen & Mikroskopieren", from: ["arbeitsweisen"] },
          { key: "pflanzen", name: "Pflanzen", from: ["botanik"] },
          { key: "tiere", name: "Tiere & Verhalten", from: ["zoologie", "verhaltensbiologie"] },
          { key: "mensch", name: "Der menschliche Körper", from: ["humanbiologie", "physiologie", "sinne", "biomedizin", "stoffwechsel"] },
          { key: "nerven", name: "Nerven & Gehirn", from: ["neuro", "neurobiologie", "synapsen"] },
          { key: "genetik", name: "Genetik", from: ["genetik", "mendel", "molekulargenetik", "gentechnik"] },
          { key: "evolution", name: "Evolution & Ökologie", from: ["evolution", "anthropologie", "oekologie"] },
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
        hue: 36,
        areas: [
          { key: "anfaenge", name: "Ur- & Frühgeschichte", from: ["urgeschichte"] },
          { key: "antike", name: "Antike", from: ["antike", "bayern"] },
          { key: "mittelalter", name: "Mittelalter", from: ["mittelalter"] },
          { key: "neuzeit", name: "Neuzeit & Revolutionen", from: ["neuzeit", "fruehe-neuzeit", "aufklaerung", "revolutionen"] },
          { key: "kaiserreich", name: "Kaiserreich & Weltkrieg", from: ["kaiserreich", "erster-weltkrieg"] },
          { key: "zeitgeschichte", name: "20. Jahrhundert", from: ["weimar", "weimarer-republik", "nationalsozialismus", "nachkriegszeit", "wiedervereinigung", "zeitgeschichte"] },
        ],
      },
      {
        key: "geographie",
        name: "Geographie",
        hue: 64,
        areas: [
          { key: "erde", name: "Planet Erde", from: ["kartographie", "astronomie", "physisch", "geodynamik"] },
          { key: "klima", name: "Klima & Zonen", from: ["klimatologie", "tropen", "trockenraeume", "geooekologie"] },
          { key: "raeume", name: "Bayern, Deutschland, Europa", from: ["bayern", "deutschland", "europa"] },
          { key: "mensch", name: "Mensch & Wirtschaft", from: ["anthropogen", "demographie", "disparitaeten", "stadtgeographie", "wirtschaftsgeographie", "tourismus", "geopolitik", "nachhaltigkeit"] },
        ],
      },
      {
        key: "wirtschaft-recht",
        name: "Wirtschaft & Recht",
        hue: 278,
        areas: [
          { key: "wirtschaft", name: "Wirtschaft", from: ["markt", "betriebswirtschaft", "volkswirtschaft", "bwl", "mikrooekonomie", "makrooekonomie", "konjunktur", "wirtschaftspolitik", "ordnungspolitik", "aussenwirtschaft"] },
          { key: "recht", name: "Recht", from: ["recht", "zivilrecht", "verbraucherschutz", "arbeitsrecht"] },
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
        hue: 352,
        areas: [
          { key: "grammatik", name: "Sprache & Grammatik", from: ["grammatik", "stilmittel"] },
          { key: "rechtschreibung", name: "Rechtschreibung", from: ["rechtschreibung", "zeichensetzung"] },
          { key: "schreiben", name: "Schreiben & Argumentieren", from: ["texte", "argumentation"] },
          { key: "literatur", name: "Literatur", from: ["literatur", "epik", "theater", "literaturgeschichte"] },
          { key: "medien", name: "Medien", from: ["medien"] },
        ],
      },
      {
        key: "englisch",
        name: "Englisch",
        hue: 16,
        areas: [
          { key: "grammar", name: "Grammar", from: ["grammatik", "sprachwissenschaft"] },
          { key: "writing", name: "Writing & Mediation", from: ["textproduction", "mediation", "rhetorik"] },
          { key: "landeskunde", name: "Landeskunde", from: ["landeskunde", "gesellschaft"] },
          { key: "literatur", name: "Literature", from: ["drama"] },
        ],
      },
      {
        key: "franzoesisch",
        name: "Französisch",
        hue: 328,
        areas: [
          { key: "grammaire", name: "Grammaire", from: ["grammatik", "subjonctif", "hypothesen"] },
          { key: "civilisation", name: "Civilisation", from: ["landeskunde", "politique"] },
          { key: "litterature", name: "Littérature", from: ["literatur", "theater"] },
        ],
      },
      {
        key: "latein",
        name: "Latein",
        hue: 302,
        areas: [
          { key: "grammatik", name: "Grammatik & Metrik", from: ["grammatik", "syntax", "metrik"] },
          { key: "lektuere", name: "Lektüre", from: ["lektuere", "dichtung", "historiographie", "philosophie", "kaiserzeit"] },
        ],
      },
    ],
  },
];

/** Raw subject prefixes that belong to another Fach (and sometimes a fixed Gebiet). */
const SUBJECT_ALIASES: Record<string, { subject: string; area?: string }> = {
  bwr: { subject: "wirtschaft-recht", area: "rechnungswesen" },
  wirtschaft: { subject: "wirtschaft-recht" },
  recht: { subject: "wirtschaft-recht" },
  wirtschaft_recht: { subject: "wirtschaft-recht" },
  nut: { subject: "biologie" },
};

export const PATTERNS: PatternKind[] = ["diag", "dots", "antidiag", "waves", "cross", "rings", "hlines", "zigzag", "grid", "vlines"];

export interface Place {
  continent: ContinentDef;
  subject: SubjectDef;
  /** A known Gebiet, or a new one named after the raw area. */
  area: AreaDef;
}

const subjects = new Map<string, { continent: ContinentDef; subject: SubjectDef }>();
for (const continent of CONTINENTS) for (const subject of continent.subjects) subjects.set(subject.key, { continent, subject });

export function subjectByKey(key: string): { continent: ContinentDef; subject: SubjectDef } | undefined {
  return subjects.get(key);
}

/** Where a token's raw domain belongs in the atlas. */
export function placeForDomain(domain: string): Place | null {
  const [rawSubject, rawArea = "allgemein"] = domain.split("/");
  const alias = SUBJECT_ALIASES[rawSubject];
  const hit = subjects.get(alias?.subject ?? rawSubject);
  if (!hit) return null;
  const areaKey = alias?.area;
  const area =
    (areaKey ? hit.subject.areas.find((a) => a.key === areaKey) : undefined) ??
    hit.subject.areas.find((a) => a.from.includes(rawArea)) ??
    { key: rawArea, name: prettify(rawArea), from: [rawArea] };
  return { continent: hit.continent, subject: hit.subject, area };
}

export function prettify(slug: string): string {
  const s = slug
    .replace(/[-_]/g, " ")
    .replace(/ae/g, "ä")
    .replace(/oe/g, "ö")
    .replace(/ue/g, "ü");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * A Thema name from a curriculum topic: without "Mathematik 9:" and without
 * a leading "Geometrie – " that only repeats the Gebiet or Fach.
 */
export function cleanTopic(topic: string, subjectName: string, areaName: string): string {
  let t = topic.replace(/\s*\([^)]*\)\s*$/, "").replace(/^[^:]{2,40}\s\d+:\s*/, "").trim();
  const dash = /^(.{2,30}?)\s+[–-]\s+(.+)$/.exec(t);
  if (dash) {
    const head = dash[1].toLowerCase();
    if (subjectName.toLowerCase().includes(head) || areaName.toLowerCase().includes(head) || head.includes(areaName.toLowerCase())) t = dash[2];
  }
  return t;
}
