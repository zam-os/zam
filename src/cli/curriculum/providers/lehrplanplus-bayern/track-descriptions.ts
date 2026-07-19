/**
 * Learner-facing explanations for LehrplanPLUS "Ausprägung" (track) options.
 *
 * The manifest's track labels mirror the official site verbatim
 * ("Mathematik 9 (I)", "Chemie 12 (GH)", "Deutsch 8 (vierstufige
 * Wirtschaftsschule)"), which assumes the reader already knows Bavarian
 * school-system shorthand. A learner picking a track in the import wizard
 * often does not, so every recognized pattern gets a short German
 * description (German on purpose — the whole taxonomy is German curriculum
 * data). Unrecognized labels get no description and render label-only,
 * exactly as before.
 */
import type { TaxonomyNode } from "../../types.js";

const GYMNASIUM_ZWEIGE: Record<string, string> = {
  NTG: "Naturwissenschaftlich-technologisches Gymnasium",
  HG: "Humanistisches Gymnasium",
  SG: "Sprachliches Gymnasium",
  MuG: "Musisches Gymnasium",
  WWG: "Wirtschaftswissenschaftliches Gymnasium",
  SWG: "Sozialwissenschaftliches Gymnasium",
};

const FOS_BOS_RICHTUNGEN: Record<string, string> = {
  ABU: "Agrarwirtschaft, Bio- und Umwelttechnologie",
  G: "Gestaltung",
  GH: "Gesundheit",
  IW: "Internationale Wirtschaft",
  S: "Sozialwesen",
  T: "Technik",
  W: "Wirtschaft und Verwaltung",
};

/** Codes that appear word-bounded in `label`, in the table's order. */
function codesInLabel(label: string, table: Record<string, string>): string[] {
  return Object.keys(table).filter((code) =>
    new RegExp(`\\b${code}\\b`).test(label),
  );
}

/**
 * FOS/BOS track ids are often a dash-joined list of Ausbildungsrichtung
 * codes ("abu-g-s-w-gh-iw", "wahl-t-iw"). When every meaningful token is a
 * known code, the id names the audience more reliably than the label (two
 * tracks can share one label, e.g. "Künstliche Intelligenz, Informatik und
 * Technologie 12" for both `t` and `abu`).
 */
function fosBosCodesFromId(id: string): string[] {
  const ignored = new Set(["wahl", "pflicht"]);
  const tokens = id
    .toLowerCase()
    .split(/[-_]/)
    .filter((token) => token.length > 0 && !ignored.has(token));
  if (tokens.length === 0) return [];
  const codes = tokens.map((token) => token.toUpperCase());
  if (!codes.every((code) => code in FOS_BOS_RICHTUNGEN)) return [];
  return Object.keys(FOS_BOS_RICHTUNGEN).filter((code) => codes.includes(code));
}

function richtungenSentence(codes: string[]): string | undefined {
  if (codes.length === 0) return undefined;
  const named = codes.map((code) => `${FOS_BOS_RICHTUNGEN[code]} (${code})`);
  if (named.length === 1) {
    return `Für die Ausbildungsrichtung ${named[0]}.`;
  }
  return `Für die Ausbildungsrichtungen: ${named.join(", ")}.`;
}

function collectRealschule(label: string, parts: string[]): void {
  if (/\(I\)\s*$/.test(label)) {
    parts.push(
      "Für die Wahlpflichtfächergruppe I (mathematisch-naturwissenschaftlich-technischer Zweig, u. a. mit vertiefter Mathematik).",
    );
  } else if (/\(II\/III\)\s*$/.test(label)) {
    parts.push(
      "Für die Wahlpflichtfächergruppen II und III (wirtschaftlicher bzw. fremdsprachlicher, gestalterischer oder sozialer Zweig).",
    );
  }
}

function collectGymnasium(label: string, parts: string[]): void {
  if (label.includes("erhöhtes Anforderungsniveau")) {
    parts.push(
      "Erhöhtes Anforderungsniveau: vertieftes Niveau der Oberstufe, z. B. für dein Abiturprüfungsfach mit erhöhten Anforderungen.",
    );
  }
  if (label.includes("grundlegendes Anforderungsniveau")) {
    parts.push(
      "Grundlegendes Anforderungsniveau: das Standardniveau der Oberstufe.",
    );
  }
  if (label.includes("Vertiefungskurs")) {
    parts.push(
      "Freiwilliger Vertiefungskurs zur Studienvorbereitung in der Oberstufe.",
    );
  }
  if (/spät beginnende/i.test(label)) {
    parts.push(
      "„Spät beginnend“: für alle, die das Fach erst in der Oberstufe neu begonnen haben.",
    );
  } else if (label.includes("Fremdsprache") && /\d\./.test(label)) {
    parts.push(
      "Die Zählung richtet sich danach, als wievielte Fremdsprache du die Sprache begonnen hast (Beginn ab Klasse 5 = 1. Fremdsprache).",
    );
  }
  const zweige = codesInLabel(label, GYMNASIUM_ZWEIGE);
  if (zweige.length === 1) {
    parts.push(
      `Gilt für den Zweig ${GYMNASIUM_ZWEIGE[zweige[0]]} (${zweige[0]}).`,
    );
  } else if (zweige.length > 1) {
    parts.push(
      `Gilt für diese Zweige: ${zweige
        .map((code) => `${GYMNASIUM_ZWEIGE[code]} (${code})`)
        .join(", ")}.`,
    );
  }
}

function collectMittelschule(label: string, parts: string[]): void {
  if (/\(R und M\)/.test(label)) {
    parts.push(
      "Gilt für Regelklassen (R) und Mittlere-Reife-Klassen (M) gleichermaßen.",
    );
  } else if (/\bM\d+\b/.test(label)) {
    parts.push(
      "M-Klasse (Mittlere-Reife-Zug): erhöhtes Anforderungsniveau auf dem Weg zum mittleren Schulabschluss.",
    );
  } else if (/\bR\d+\b/.test(label)) {
    parts.push("Regelklasse: der reguläre Bildungsgang der Mittelschule.");
  }
}

function collectWirtschaftsschule(label: string, parts: string[]): void {
  if (/(drei- und vier|vier- und drei)stufige/.test(label)) {
    parts.push(
      "Gilt für die drei- und die vierstufige Wirtschaftsschule gleichermaßen.",
    );
  } else if (label.includes("vierstufig")) {
    parts.push("Vierstufige Wirtschaftsschule: Einstieg ab Jahrgangsstufe 7.");
  } else if (label.includes("dreistufig")) {
    parts.push("Dreistufige Wirtschaftsschule: Einstieg ab Jahrgangsstufe 8.");
  } else if (label.includes("zweistufig")) {
    parts.push("Zweistufige Wirtschaftsschule: Einstieg ab Jahrgangsstufe 10.");
  }
}

function collectFosBos(track: TaxonomyNode, parts: string[]): void {
  const { id, label } = track;
  if (label.includes("Vorklasse")) {
    parts.push(
      "Vorklasse: das Vollzeit-Vorbereitungsjahr vor Jahrgangsstufe 11 (FOS) bzw. 12 (BOS).",
    );
  }
  if (label.includes("Vorkurs")) {
    parts.push(
      "Vorkurs: vorbereitender Kurs (meist in Teilzeit) vor dem Einstieg in die FOS/BOS.",
    );
  }
  if (/\bAHR\b/.test(label)) {
    parts.push(
      "AHR: Weg zur Allgemeinen Hochschulreife (Abitur), in der Regel mit zweiter Fremdsprache bis Jahrgangsstufe 13.",
    );
  }
  if (label.includes("Grundkurs")) {
    parts.push("Grundkurs: Sprachkurs für Einsteiger ohne Vorkenntnisse.");
  }
  if (label.includes("Aufbaukurs")) {
    parts.push(
      "Aufbaukurs: setzt Vorkenntnisse aus der vorherigen Schule voraus.",
    );
  }
  if (label.includes("fortgeführt")) {
    parts.push(
      "Fortgeführt: Weiterführung einer bereits erlernten Fremdsprache.",
    );
  }
  if (label.includes("fachpraktisch")) {
    parts.push(
      "Teil der fachpraktischen Ausbildung (fpA) in Jahrgangsstufe 11.",
    );
  }
  const codes =
    fosBosCodesFromId(id).length > 0
      ? fosBosCodesFromId(id)
      : codesInLabel(label, FOS_BOS_RICHTUNGEN);
  const richtungen = richtungenSentence(codes);
  if (richtungen) {
    parts.push(richtungen);
  } else {
    const prefix = label.match(/^(.+?) – /)?.[1];
    const prefixRichtung = Object.values(FOS_BOS_RICHTUNGEN).find(
      (name) => prefix === name,
    );
    if (prefixRichtung) {
      parts.push(`Für die Ausbildungsrichtung ${prefixRichtung}.`);
    }
  }
}

const WOCHENSTUNDEN: Record<string, string> = {
  einstündig: "einer Wochenstunde",
  zweistündig: "zwei Wochenstunden",
  dreistündig: "drei Wochenstunden",
};

function collectShared(track: TaxonomyNode, parts: string[]): void {
  const { id, label } = track;
  if (label.includes("Basissport")) {
    parts.push("Basissport: der verbindliche Sportunterricht für alle.");
  }
  if (label.includes("Differenzierter Sport")) {
    parts.push(
      "Differenzierter Sport: zusätzlicher Wahlsport in einzelnen Sportarten.",
    );
  }
  const stunden = label.match(/(einstündig|zweistündig|dreistündig)/)?.[1];
  if (stunden) {
    parts.push(
      `Fassung mit ${WOCHENSTUNDEN[stunden]} – welche gilt, hängt von der Stundentafel deiner Schule ab.`,
    );
  }
  const gueltigAb = label.match(/gültig ab (?:SJ )?(\d{4}\/\d{2})/)?.[1];
  if (gueltigAb) {
    parts.push(`Neue Lehrplanfassung: gilt ab dem Schuljahr ${gueltigAb}.`);
  }
  const gueltigBis = id.match(/gueltig_bis_(\d{2})_(\d{2})/);
  if (gueltigBis) {
    parts.push(
      `Bisherige Lehrplanfassung: gilt noch bis einschließlich Schuljahr 20${gueltigBis[1]}/${gueltigBis[2]}.`,
    );
  }
}

/**
 * Explains one Ausprägung option of the given school type, or returns
 * `undefined` when no pattern applies (the option then renders label-only).
 */
export function describeBayernTrack(
  schoolType: string,
  track: TaxonomyNode,
): string | undefined {
  const parts: string[] = [];

  if (schoolType === "realschule") collectRealschule(track.label, parts);
  else if (schoolType === "gymnasium") collectGymnasium(track.label, parts);
  else if (schoolType === "mittelschule")
    collectMittelschule(track.label, parts);
  else if (schoolType === "wirtschaftsschule")
    collectWirtschaftsschule(track.label, parts);
  else if (schoolType === "fos" || schoolType === "bos")
    collectFosBos(track, parts);

  collectShared(track, parts);

  return parts.length > 0 ? parts.join(" ") : undefined;
}
