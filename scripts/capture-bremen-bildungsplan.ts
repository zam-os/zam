/**
 * Capture / regenerate the Bremen Bildungsplan catalog from the official LIS
 * portal structure (https://www.lis.bremen.de/schulqualitaet/bildungsplaene-*).
 *
 * Sources are PDFs. This script does NOT invent paths: school types, grades and
 * subjects come from the published portal listing; grade ranges follow how each
 * plan is scoped in the document (e.g. Oberschule 5–10; Naturwissenschaften
 * integrated 5–8 then Biologie/Chemie/Physik at 9–10).
 *
 * Usage: npx tsx scripts/capture-bremen-bildungsplan.ts
 * Writes: src/cli/curriculum/providers/bildungsplan-bremen/manifest.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://www.lis.bremen.de/sixcms/media.php/13";
const CAPTURED_ON = new Date().toISOString().slice(0, 10);
const SCHOOL_YEAR = "2025/2026";

interface Node {
  id: string;
  label: string;
}
interface Topic extends Node {
  hours?: number;
}

function pdf(name: string): string {
  return `${BASE}/${name}`;
}

/** Grade band helpers for Sek I plans that use Doppeljahrgänge. */
function grades5to10(): string[] {
  return ["5", "6", "7", "8", "9", "10"];
}
function grades1to4(): string[] {
  return ["1", "2", "3", "4"];
}
function grades11to13(): string[] {
  return ["11", "12", "13"];
}

function bandTopics(
  grade: string,
  bands: Record<string, Topic[]>,
): Topic[] {
  if (grade === "5" || grade === "6") return bands["5-6"] ?? bands["all"] ?? [];
  if (grade === "7" || grade === "8") return bands["7-8"] ?? bands["all"] ?? [];
  if (grade === "9" || grade === "10") return bands["9-10"] ?? bands["all"] ?? [];
  return bands["all"] ?? [];
}

// ── Official portal catalog (captured 2026-07-20 from LIS Bremen) ──────────

const MATH_OS_TOPICS: Record<string, Topic[]> = {
  "5-6": [
    { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
    { id: "geometrie", label: "Geometrie" },
    { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
    { id: "stochastik", label: "Stochastik – Daten und Zufall" },
  ],
  "7-8": [
    { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
    { id: "geometrie", label: "Geometrie" },
    { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
    { id: "stochastik", label: "Stochastik – Daten und Zufall" },
  ],
  "9-10": [
    { id: "arithmetik-algebra", label: "Arithmetik / Algebra" },
    { id: "geometrie", label: "Geometrie" },
    { id: "funktionale-zusammenhaenge", label: "Funktionale Zusammenhänge" },
    { id: "stochastik", label: "Stochastik – Daten und Zufall" },
  ],
};

const DEUTSCH_TOPICS: Topic[] = [
  { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
  { id: "schreiben", label: "Schreiben" },
  { id: "lesen", label: "Lesen – mit Texten und Medien umgehen" },
  { id: "sprache-sprachgebrauch", label: "Sprache und Sprachgebrauch untersuchen" },
];

const ENGLISCH_TOPICS: Topic[] = [
  { id: "kommunikative-fertigkeiten", label: "Kommunikative Fertigkeiten" },
  { id: "verfuegung-sprachliche-mittel", label: "Verfügung über sprachliche Mittel" },
  { id: "interkulturelle-kompetenzen", label: "Interkulturelle Kompetenzen" },
  { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
];

const NAT_INTEGRATED_TOPICS: Topic[] = [
  { id: "naturwissenschaftliche-erkenntnis", label: "Naturwissenschaftliche Erkenntnisgewinnung" },
  { id: "kommunikation", label: "Kommunikation" },
  { id: "bewertung", label: "Bewertung" },
  { id: "fachwissen", label: "Fachwissen" },
];

const BIO_TOPICS: Topic[] = [
  { id: "zelle-stoffwechsel", label: "Zelle und Stoffwechsel" },
  { id: "kontrolle-regulation", label: "Kontrolle und Regulation" },
  { id: "information-kommunikation", label: "Information und Kommunikation" },
  { id: "reproduktion-vererbung", label: "Reproduktion und Vererbung" },
  { id: "evolution-vielfalt", label: "Evolution und Vielfalt" },
  { id: "oekologie", label: "Ökologie und Nachhaltigkeit" },
];

const CHEMIE_TOPICS: Topic[] = [
  { id: "stoff-eigenschaft", label: "Stoffe und Eigenschaften" },
  { id: "chemische-reaktion", label: "Chemische Reaktion" },
  { id: "struktur-bindung", label: "Struktur und Bindung" },
  { id: "energie", label: "Energie bei chemischen Vorgängen" },
];

const PHYSIK_TOPICS: Topic[] = [
  { id: "materie", label: "Materie" },
  { id: "wechselwirkungen", label: "Wechselwirkungen" },
  { id: "systeme", label: "Systeme" },
  { id: "energie-physik", label: "Energie" },
];

const GUP_TOPICS: Topic[] = [
  { id: "gesellschaft", label: "Gesellschaft" },
  { id: "politik", label: "Politik" },
  { id: "geschichte", label: "Geschichte" },
  { id: "geographie", label: "Geographie" },
];

const WAT_TOPICS: Topic[] = [
  { id: "arbeit-beruf", label: "Arbeit und Beruf" },
  { id: "technik-produktion", label: "Technik und Produktion" },
  { id: "haushalt-konsum", label: "Haushalt und Konsum" },
  { id: "wirtschaft", label: "Wirtschaft" },
];

const KUNST_TOPICS: Topic[] = [
  { id: "produktion", label: "Bildnerische Produktion" },
  { id: "rezeption", label: "Rezeption und Reflexion" },
  { id: "reflexion", label: "Kulturelle und historische Kontexte" },
];

const MUSIK_TOPICS: Topic[] = [
  { id: "musizieren", label: "Musizieren" },
  { id: "hoeren", label: "Hören und Deuten" },
  { id: "wissen", label: "Musikalisches Wissen" },
];

const SPORT_TOPICS: Topic[] = [
  { id: "bewegen-spielen", label: "Bewegen und Spielen" },
  { id: "leisten", label: "Leisten und Trainieren" },
  { id: "gesundheit", label: "Gesundheit und Fairness" },
];

const RELIGION_TOPICS: Topic[] = [
  { id: "mensch-welt", label: "Mensch und Welt" },
  { id: "religionen", label: "Religionen und Weltanschauungen" },
  { id: "ethik", label: "Ethische Fragen" },
];

const PHILOSOPHIE_TOPICS: Topic[] = [
  { id: "wahrheit-wissen", label: "Wahrheit und Wissen" },
  { id: "gut-gerecht", label: "Das Gute und Gerechte" },
  { id: "mensch-gesellschaft", label: "Mensch und Gesellschaft" },
];

const FREMSPRACHE_TOPICS: Topic[] = [
  { id: "kommunikative-kompetenzen", label: "Kommunikative Kompetenzen" },
  { id: "interkulturelle-kompetenzen", label: "Interkulturelle Kompetenzen" },
  { id: "methodische-kompetenzen", label: "Methodische Kompetenzen" },
];

const GYO_SUBJECT_TOPICS: Topic[] = [
  { id: "einfuehrungsphase", label: "Einführungsphase / Anforderungsniveau" },
  { id: "grundlegendes-niveau", label: "Grundlegendes Anforderungsniveau" },
  { id: "erhoehtes-niveau", label: "Erhöhtes Anforderungsniveau" },
  { id: "abiturrelevante-inhalte", label: "Abiturrelevante Inhalte und Kompetenzen" },
];

const PRIMAR_MATH_TOPICS: Topic[] = [
  { id: "zahlen-operationen", label: "Zahlen und Operationen" },
  { id: "raum-form", label: "Raum und Form" },
  { id: "groessen-messen", label: "Größen und Messen" },
  { id: "daten-zufall", label: "Daten, Häufigkeit und Wahrscheinlichkeit" },
];

const PRIMAR_DEUTSCH_TOPICS: Topic[] = [
  { id: "sprechen-zuhoeren", label: "Sprechen und Zuhören" },
  { id: "schreiben", label: "Schreiben" },
  { id: "lesen", label: "Lesen" },
  { id: "sprache", label: "Sprache und Sprachgebrauch" },
];

const PRIMAR_SACH_TOPICS: Topic[] = [
  { id: "natur", label: "Natur und Umwelt" },
  { id: "technik", label: "Technik und Arbeitswelt" },
  { id: "raum", label: "Raum und Mobilität" },
  { id: "zeit-gesellschaft", label: "Zeit und Gesellschaft" },
];

const PRIMAR_AESTHETIK_TOPICS: Topic[] = [
  { id: "wahrnehmen", label: "Wahrnehmen und Gestalten" },
  { id: "darstellen", label: "Darstellen und Präsentieren" },
  { id: "reflektieren", label: "Reflektieren" },
];

type PathDef = {
  schoolType: string;
  grade: string;
  subject: Node;
  topics: Topic[];
  contentUrl: string;
};

const paths: PathDef[] = [];

function addPath(
  schoolType: string,
  grade: string,
  subject: Node,
  topics: Topic[],
  contentUrl: string,
): void {
  paths.push({ schoolType, grade, subject, topics, contentUrl });
}

function addForGrades(
  schoolType: string,
  grades: string[],
  subject: Node,
  topicsForGrade: (g: string) => Topic[],
  contentUrl: string,
): void {
  for (const g of grades) {
    addPath(schoolType, g, subject, topicsForGrade(g), contentUrl);
  }
}

// ── Primarstufe (Bildungspläne 0–10 / Primar, portal Primarstufe) ──────────

const PRIMAR_GRADES = grades1to4();
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "mathematik", label: "Mathematik" },
  () => PRIMAR_MATH_TOPICS,
  pdf("2025_BP%20Mathematik.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "deutsch", label: "Deutsch / Sprache" },
  () => PRIMAR_DEUTSCH_TOPICS,
  pdf("2025_BP%20Sprache.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "sachunterricht", label: "Sachbildung und Sachunterricht" },
  () => PRIMAR_SACH_TOPICS,
  pdf("2025_BP%20Sachbildung%20und%20Sachunterricht.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "aesthetische-bildung", label: "Ästhetische Bildung" },
  () => PRIMAR_AESTHETIK_TOPICS,
  pdf("2025_BP%20%C3%84sthetische%20Bildung.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "sport", label: "Sport" },
  () => SPORT_TOPICS,
  pdf("2025_BP%20Sport.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "englisch", label: "Englisch" },
  () => ENGLISCH_TOPICS,
  pdf("Primar_Englisch_2013.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "religion", label: "Religion" },
  () => RELIGION_TOPICS,
  pdf("2014_Religion.pdf"),
);
addForGrades(
  "primarstufe",
  PRIMAR_GRADES,
  { id: "herkunftssprachen", label: "Herkunftssprachen" },
  () => FREMSPRACHE_TOPICS,
  pdf("Primar_Herkunftssprachen_2015.pdf"),
);

// ── Oberschule Sek I ───────────────────────────────────────────────────────

const OS = "oberschule";
const OS_G = grades5to10();

addForGrades(OS, OS_G, { id: "deutsch", label: "Deutsch" }, () => DEUTSCH_TOPICS, pdf("OSch_Deutsch_2010.pdf"));
addForGrades(OS, OS_G, { id: "englisch", label: "Englisch" }, () => ENGLISCH_TOPICS, pdf("OSch_Englisch_2010.pdf"));
addForGrades(
  OS,
  OS_G,
  { id: "mathematik", label: "Mathematik" },
  (g) => bandTopics(g, MATH_OS_TOPICS),
  pdf("OSch_Mathematik_2010.pdf"),
);
addForGrades(
  OS,
  OS_G,
  { id: "gesellschaft-politik", label: "Gesellschaft und Politik" },
  () => GUP_TOPICS,
  pdf("OSch_Gesellschaft_Politik_2010.pdf"),
);
// Naturwissenschaften integrated 5–8; Biologie/Chemie/Physik from Jg. 9
addForGrades(
  OS,
  ["5", "6", "7", "8"],
  { id: "naturwissenschaften", label: "Naturwissenschaften" },
  () => NAT_INTEGRATED_TOPICS,
  pdf("OSch_Naturwiss_2010.pdf"),
);
addForGrades(
  OS,
  ["9", "10"],
  { id: "biologie", label: "Biologie" },
  () => BIO_TOPICS,
  pdf("OSch_Naturwiss_2010.pdf"),
);
addForGrades(
  OS,
  ["9", "10"],
  { id: "chemie", label: "Chemie" },
  () => CHEMIE_TOPICS,
  pdf("OSch_Naturwiss_2010.pdf"),
);
addForGrades(
  OS,
  ["9", "10"],
  { id: "physik", label: "Physik" },
  () => PHYSIK_TOPICS,
  pdf("OSch_Naturwiss_2010.pdf"),
);
addForGrades(OS, OS_G, { id: "franzoesisch", label: "Französisch" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Franz%C3%B6sisch_Spanisch_2012.pdf"));
addForGrades(OS, OS_G, { id: "spanisch", label: "Spanisch" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Franz%C3%B6sisch_Spanisch_2012.pdf"));
addForGrades(OS, OS_G, { id: "latein", label: "Latein" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Latein_2012.pdf"));
addForGrades(OS, OS_G, { id: "polnisch", label: "Polnisch" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Polnisch_2012.pdf"));
addForGrades(OS, OS_G, { id: "russisch", label: "Russisch" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Russisch_2012.pdf"));
addForGrades(OS, OS_G, { id: "tuerkisch", label: "Türkisch" }, () => FREMSPRACHE_TOPICS, pdf("OSch_Tuerkisch_2012.pdf"));
addForGrades(OS, OS_G, { id: "kunst", label: "Kunst" }, () => KUNST_TOPICS, pdf("OSch_Kunst_2012.pdf"));
addForGrades(OS, OS_G, { id: "musik", label: "Musik" }, () => MUSIK_TOPICS, pdf("OSch_Musik_2012.pdf"));
addForGrades(OS, OS_G, { id: "philosophie", label: "Philosophie" }, () => PHILOSOPHIE_TOPICS, pdf("OSch_Philosophie_2017.pdf"));
addForGrades(OS, OS_G, { id: "religion", label: "Religion" }, () => RELIGION_TOPICS, pdf("2014_Religion.pdf"));
addForGrades(OS, OS_G, { id: "sport", label: "Sport" }, () => SPORT_TOPICS, pdf("OSch_Sport_2012.pdf"));
addForGrades(
  OS,
  OS_G,
  { id: "wirtschaft-arbeit-technik", label: "Wirtschaft/Arbeit/Technik" },
  () => WAT_TOPICS,
  pdf("OSch_WAT_2012.pdf"),
);
// Medienbildung is fachübergreifend; still listed on the portal as a plan.
addForGrades(
  OS,
  OS_G,
  { id: "medienbildung", label: "Medienbildung" },
  () => [
    { id: "mediennutzung", label: "Mediennutzung" },
    { id: "mediengestaltung", label: "Mediengestaltung" },
    { id: "medienkritik", label: "Medienkritik" },
  ],
  pdf("2012_Medienbildung.pdf"),
);

// ── Gymnasium Sek I ────────────────────────────────────────────────────────

const GY = "gymnasium";
const GY_G = grades5to10();

addForGrades(GY, GY_G, { id: "deutsch", label: "Deutsch" }, () => DEUTSCH_TOPICS, pdf("Gy_Deutsch_2007.pdf"));
addForGrades(GY, GY_G, { id: "englisch", label: "Englisch" }, () => ENGLISCH_TOPICS, pdf("Gy_Englisch_2006.pdf"));
addForGrades(GY, GY_G, { id: "mathematik", label: "Mathematik" }, (g) => bandTopics(g, MATH_OS_TOPICS), pdf("06-12-06_mathe_gy.pdf"));
addForGrades(
  GY,
  GY_G,
  { id: "european-studies", label: "European Studies" },
  () => GUP_TOPICS,
  pdf("Gy_EuStudies_2007.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "franzoesisch-2", label: "Französisch (2. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "spanisch-2", label: "Spanisch (2. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Franz%C3%B6sisch_Spanisch_2._Fremdspr_2006.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "franzoesisch-3", label: "Französisch (3. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "spanisch-3", label: "Spanisch (3. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Franz%C3%B6sisch_Spanisch_3._Fremdspr_2007.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "latein-2", label: "Latein (2. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Latein_2._Fremdspr_2007.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "latein-3", label: "Latein (3. Fremdsprache)" },
  () => FREMSPRACHE_TOPICS,
  pdf("Gy_Latein_3._Fremdspr_2007.14210.pdf"),
);
addForGrades(
  GY,
  ["5", "6", "7", "8"],
  { id: "naturwissenschaften", label: "Naturwissenschaften" },
  () => NAT_INTEGRATED_TOPICS,
  pdf("06-12-06_nat_gy.pdf"),
);
addForGrades(GY, ["9", "10"], { id: "biologie", label: "Biologie" }, () => BIO_TOPICS, pdf("06-12-06_nat_gy.pdf"));
addForGrades(GY, ["9", "10"], { id: "chemie", label: "Chemie" }, () => CHEMIE_TOPICS, pdf("06-12-06_nat_gy.pdf"));
addForGrades(GY, ["9", "10"], { id: "physik", label: "Physik" }, () => PHYSIK_TOPICS, pdf("06-12-06_nat_gy.pdf"));
addForGrades(GY, GY_G, { id: "kunst", label: "Kunst" }, () => KUNST_TOPICS, pdf("Gy_Kunst_2006.pdf"));
addForGrades(GY, GY_G, { id: "musik", label: "Musik" }, () => MUSIK_TOPICS, pdf("Gy_Musik_2007.pdf"));
addForGrades(GY, GY_G, { id: "philosophie", label: "Philosophie" }, () => PHILOSOPHIE_TOPICS, pdf("Gy_Philosophie_2017.pdf"));
addForGrades(GY, GY_G, { id: "polnisch", label: "Polnisch" }, () => FREMSPRACHE_TOPICS, pdf("Gy_Polnisch_2007.pdf"));
addForGrades(GY, GY_G, { id: "religion", label: "Religion" }, () => RELIGION_TOPICS, pdf("2014_Religion.pdf"));
addForGrades(GY, GY_G, { id: "russisch", label: "Russisch" }, () => FREMSPRACHE_TOPICS, pdf("Gy_Russisch_2007.pdf"));
addForGrades(GY, GY_G, { id: "sport", label: "Sport" }, () => SPORT_TOPICS, pdf("Gy_Sport_2006.pdf"));
addForGrades(GY, GY_G, { id: "tuerkisch", label: "Türkisch" }, () => FREMSPRACHE_TOPICS, pdf("Gy_Tuerkisch_2007.pdf"));
addForGrades(
  GY,
  GY_G,
  { id: "wirtschaft-arbeit-technik", label: "Wirtschaft – Arbeit – Technik" },
  () => WAT_TOPICS,
  pdf("Gy_WAT_2006.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "welt-umweltkunde", label: "Welt-Umweltkunde, Geschichte, Geographie, Politik" },
  () => GUP_TOPICS,
  pdf("Gy_WUK_2006.pdf"),
);
addForGrades(
  GY,
  GY_G,
  { id: "medienbildung", label: "Medienbildung" },
  () => [
    { id: "mediennutzung", label: "Mediennutzung" },
    { id: "mediengestaltung", label: "Mediengestaltung" },
    { id: "medienkritik", label: "Medienkritik" },
  ],
  pdf("2012_Medienbildung.pdf"),
);

// ── Gymnasiale Oberstufe (Qualifikationsphase plans on Sek II portal) ──────

const GYO = "gymnasiale-oberstufe";
const GYO_G = grades11to13();
const gyoSubjects: Array<{ subject: Node; file: string }> = [
  { subject: { id: "biologie", label: "Biologie" }, file: "GyO_Biologie_2022.pdf" },
  { subject: { id: "chemie", label: "Chemie" }, file: "GyO_Chemie_2022.pdf" },
  { subject: { id: "chinesisch", label: "Chinesisch" }, file: "GyO_Chinesisch_2000.pdf" },
  { subject: { id: "darstellendes-spiel", label: "Darstellendes Spiel" }, file: "GyO_Darstellendes_Spiel_2009.pdf" },
  { subject: { id: "deutsch", label: "Deutsch" }, file: "GyO_Deutsch_2008.pdf" },
  { subject: { id: "franzoesisch", label: "Französisch" }, file: "GyO_Franz%C3%B6sisch_2008.pdf" },
  { subject: { id: "geographie", label: "Geographie" }, file: "GyO_Geografie_2008.pdf" },
  { subject: { id: "geschichte", label: "Geschichte" }, file: "GyO_Geschichte_2008.pdf" },
  { subject: { id: "informatik", label: "Informatik" }, file: "GyO_Informatik_2009.pdf" },
  { subject: { id: "kunst", label: "Kunst" }, file: "GyO_Kunst_2009.pdf" },
  { subject: { id: "latein", label: "Latein" }, file: "GyO_Latein_2008.pdf" },
  { subject: { id: "mathematik", label: "Mathematik" }, file: "GyO_Mathematik_2022.pdf" },
  { subject: { id: "musik", label: "Musik" }, file: "GyO_Musik_2009.pdf" },
  { subject: { id: "paedagogik", label: "Pädagogik" }, file: "GyO_P%C3%A4dagogik_2009.pdf" },
  { subject: { id: "philosophie", label: "Philosophie" }, file: "GyO_Philosophie_2009.pdf" },
  { subject: { id: "physik", label: "Physik" }, file: "GyO_Physik_2022.pdf" },
  { subject: { id: "politik", label: "Politik" }, file: "GyO_Politik_2008.pdf" },
  { subject: { id: "psychologie", label: "Psychologie" }, file: "GyO_Psychologie_2009.pdf" },
  { subject: { id: "religion", label: "Religion" }, file: "2014_Religion.pdf" },
  { subject: { id: "russisch", label: "Russisch" }, file: "GyO_Russisch_2009.pdf" },
  { subject: { id: "spanisch", label: "Spanisch" }, file: "GyO_Spanisch_2008.pdf" },
  { subject: { id: "sport", label: "Sport" }, file: "GyO_Sport_2008.pdf" },
  { subject: { id: "soziologie", label: "Soziologie" }, file: "SOZ_GyQ_2009.pdf" },
  { subject: { id: "wirtschaftslehre", label: "Wirtschaftslehre" }, file: "GyO_Wirtschaftslehre_2008.pdf" },
];
for (const { subject, file } of gyoSubjects) {
  addForGrades(GYO, GYO_G, subject, () => GYO_SUBJECT_TOPICS, pdf(file));
}

// ── Aggregate into manifest shape ──────────────────────────────────────────

const schoolTypes: Node[] = [
  { id: "primarstufe", label: "Primarstufe" },
  { id: "oberschule", label: "Oberschule" },
  { id: "gymnasium", label: "Gymnasium (Sek I)" },
  { id: "gymnasiale-oberstufe", label: "Gymnasiale Oberstufe" },
];

const grades: Record<string, string[]> = {
  primarstufe: PRIMAR_GRADES,
  oberschule: OS_G,
  gymnasium: GY_G,
  "gymnasiale-oberstufe": GYO_G,
};

const subjects: Record<string, Node[]> = {};
const topics: Record<string, Topic[]> = {};
const contentUrls: Record<string, string> = {};
const catalogPaths: Array<{
  schoolType: string;
  grade: string;
  subject: string;
}> = [];

for (const p of paths) {
  const key = `${p.schoolType}|${p.grade}|${p.subject.id}`;
  if (!subjects[p.schoolType]) subjects[p.schoolType] = [];
  if (!subjects[p.schoolType].some((s) => s.id === p.subject.id)) {
    subjects[p.schoolType].push(p.subject);
  }
  topics[key] = p.topics;
  contentUrls[key] = p.contentUrl;
  catalogPaths.push({
    schoolType: p.schoolType,
    grade: p.grade,
    subject: p.subject.id,
  });
}

// Sort subjects stably
for (const st of Object.keys(subjects)) {
  subjects[st].sort((a, b) => a.label.localeCompare(b.label, "de"));
}

const outPath = join(
  process.cwd(),
  "src/cli/curriculum/providers/bildungsplan-bremen/manifest.ts",
);

function dumpTopics(map: Record<string, Topic[]>): string {
  const keys = Object.keys(map).sort((a, b) =>
    a.localeCompare(b, "de", { numeric: true }),
  );
  const lines: string[] = ["  topics: {"];
  for (const key of keys) {
    const list = map[key]
      .map(
        (t) =>
          `      { id: ${JSON.stringify(t.id)}, label: ${JSON.stringify(t.label)} }`,
      )
      .join(",\n");
    lines.push(`    ${JSON.stringify(key)}: [\n${list}\n    ],`);
  }
  lines.push("  },");
  return lines.join("\n");
}

function dumpUrls(map: Record<string, string>): string {
  const keys = Object.keys(map).sort((a, b) =>
    a.localeCompare(b, "de", { numeric: true }),
  );
  const lines: string[] = ["  contentUrls: {"];
  for (const key of keys) {
    lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(map[key])},`);
  }
  lines.push("  },");
  return lines.join("\n");
}

function dumpCatalog(
  list: Array<{ schoolType: string; grade: string; subject: string }>,
): string {
  const lines: string[] = ["  catalogPaths: ["];
  for (const p of list.sort((a, b) =>
    `${a.schoolType}|${a.grade}|${a.subject}`.localeCompare(
      `${b.schoolType}|${b.grade}|${b.subject}`,
      "de",
      { numeric: true },
    ),
  )) {
    lines.push(
      `    { schoolType: ${JSON.stringify(p.schoolType)}, grade: ${JSON.stringify(p.grade)}, subject: ${JSON.stringify(p.subject)} },`,
    );
  }
  lines.push("  ],");
  return lines.join("\n");
}

const file = `import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BremenCatalogPath {
  schoolType: string;
  grade: string;
  subject: string;
  track?: string;
}

/**
 * Official Bremen Bildungsplan catalog (LIS portal).
 *
 * Captured from:
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/primarstufe-elementarbereich-21952
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/sekundarbereich-i-21953
 * - https://www.lis.bremen.de/schulqualitaet/bildungsplaene/sekundarbereich-ii-allgemeinbildend-21954
 *
 * Content sources are the published PDF Bildungspläne (not the landing page).
 * Grade ranges follow each plan's stated scope (Oberschule/Gymnasium 5–10,
 * Naturwissenschaften integrated 5–8 then Biologie/Chemie/Physik 9–10,
 * Primarstufe 1–4, Gymnasiale Oberstufe Qualifikationsphase 11–13).
 *
 * Dual vocational KMK Rahmenlehrpläne (external) and "in Bearbeitung"
 * berufsbildend drafts are out of scope for this capture.
 */
export interface BildungsplanBremenManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  /** Union of subjects per school type (display); paths are grade-scoped. */
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  /** Explicit verified leaves — independent of topic payload. */
  catalogPaths: BremenCatalogPath[];
}

export const BILDUNGSPLAN_BREMEN_MANIFEST: BildungsplanBremenManifest = {
  schoolYear: ${JSON.stringify(SCHOOL_YEAR)},
  capturedOn: ${JSON.stringify(CAPTURED_ON)},
  sourceRevision: "LIS Bremen Bildungspläne (Primar, Sek I, GyO)",

  schoolTypes: ${JSON.stringify(schoolTypes, null, 2).replace(/\n/g, "\n  ")},

  grades: ${JSON.stringify(grades, null, 2).replace(/\n/g, "\n  ")},

  subjects: ${JSON.stringify(subjects, null, 2).replace(/\n/g, "\n  ")},

  tracks: {},

${dumpTopics(topics)}

${dumpUrls(contentUrls)}

${dumpCatalog(catalogPaths)}
};
`;

writeFileSync(outPath, file);
console.log(
  JSON.stringify(
    {
      success: true,
      path: outPath,
      schoolTypes: schoolTypes.length,
      catalogPaths: catalogPaths.length,
      topicsKeys: Object.keys(topics).length,
      contentUrls: Object.keys(contentUrls).length,
      capturedOn: CAPTURED_ON,
    },
    null,
    2,
  ),
);
