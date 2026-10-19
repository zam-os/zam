/**
 * Draft German readings for formulas that still lack speech
 * (plan Phase 5, step 4).
 *
 *   npx tsx scripts/card-text-migration/speech-draft.ts > draft.tsv
 *
 * A writing aid, not the author: it turns each TeX formula of
 * `speech-worklist.json` into a first German reading by rule ("W el gleich
 * ein halb C U Quadrat", "C O zwei"), and the content author reads every line
 * and rewrites what does not sound like a teacher before it goes into
 * `speech.tsv`. ADR 2026-10-14b prefers authored speech over an automatic
 * engine; this only saves typing.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type TexToken,
  tokenizeTex,
} from "../../src/kernel/library/tex-tokenizer.js";

const NUMBER_WORDS = [
  "null",
  "eins",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
  "zehn",
];

const ORDINAL_ROOT: Record<string, string> = {
  "3": "dritte",
  "4": "vierte",
  "5": "fünfte",
  n: "n-te",
};

const FRACTION_WORDS: Record<string, string> = {
  "1/2": "ein halb",
  "1/3": "ein Drittel",
  "2/3": "zwei Drittel",
  "1/4": "ein Viertel",
  "3/4": "drei Viertel",
  "1/8": "ein Achtel",
  "1/9": "ein Neuntel",
  "4/3": "vier Drittel",
};

const GREEK: Record<string, string> = {
  alpha: "Alpha",
  beta: "Beta",
  gamma: "Gamma",
  delta: "Delta",
  epsilon: "Epsilon",
  varepsilon: "Epsilon",
  zeta: "Zeta",
  eta: "Eta",
  theta: "Theta",
  vartheta: "Theta",
  kappa: "Kappa",
  lambda: "Lambda",
  mu: "My",
  nu: "Ny",
  xi: "Xi",
  pi: "Pi",
  rho: "Rho",
  sigma: "Sigma",
  tau: "Tau",
  phi: "Phi",
  varphi: "Phi",
  chi: "Chi",
  psi: "Psi",
  omega: "Omega",
  Gamma: "großes Gamma",
  Delta: "Delta",
  Theta: "großes Theta",
  Lambda: "großes Lambda",
  Sigma: "großes Sigma",
  Phi: "großes Phi",
  Psi: "großes Psi",
  Omega: "großes Omega",
};

const WORDS: Record<string, string> = {
  cdot: "mal",
  times: "mal",
  div: "geteilt durch",
  pm: "plus minus",
  mp: "minus plus",
  approx: "ungefähr",
  neq: "ungleich",
  ne: "ungleich",
  le: "kleiner gleich",
  leq: "kleiner gleich",
  ge: "größer gleich",
  geq: "größer gleich",
  ll: "sehr viel kleiner als",
  gg: "sehr viel größer als",
  equiv: "kongruent",
  cong: "kongruent zu",
  sim: "proportional zu",
  propto: "proportional zu",
  in: "Element von",
  notin: "nicht Element von",
  subset: "Teilmenge von",
  subseteq: "Teilmenge von",
  subsetneq: "echte Teilmenge von",
  cap: "geschnitten mit",
  cup: "vereinigt mit",
  setminus: "ohne",
  perp: "senkrecht zu",
  parallel: "parallel zu",
  Rightarrow: "daraus folgt",
  implies: "daraus folgt",
  Leftrightarrow: "genau dann, wenn",
  iff: "genau dann, wenn",
  Longleftrightarrow: "genau dann, wenn",
  rightleftharpoons: "im Gleichgewicht mit",
  longrightarrow: "führt zu",
  leftrightarrow: "entspricht",
  infty: "unendlich",
  partial: "partiell",
  nabla: "Nabla",
  emptyset: "leere Menge",
  forall: "für alle",
  exists: "es gibt",
  angle: "Winkel",
  sphericalangle: "Winkel",
  triangle: "Dreieck",
  degree: "Grad",
  hbar: "h quer",
  ell: "l",
  dots: "und so weiter",
  ldots: "und so weiter",
  cdots: "und so weiter",
  bullet: "Punkt",
  circ: "verknüpft mit",
  odot: "Punkt",
  oplus: "plus",
  smile: "Bogen",
  square: "Quadrat",
  blacksquare: "",
  checkmark: "Haken",
  uparrow: "steigt",
  downarrow: "sinkt",
  mid: "teilt",
  P: "Absatz",
};

const FUNCTIONS: Record<string, string> = {
  sin: "Sinus",
  cos: "Kosinus",
  tan: "Tangens",
  arcsin: "Arkussinus",
  arccos: "Arkuskosinus",
  arctan: "Arkustangens",
  ln: "l n",
  lg: "l g",
  log: "Logarithmus",
  exp: "e hoch",
  det: "Determinante",
  max: "Maximum",
  min: "Minimum",
  lim: "Limes",
};

const UNITS: Record<string, string> = {
  m: "Meter",
  cm: "Zentimeter",
  mm: "Millimeter",
  km: "Kilometer",
  nm: "Nanometer",
  s: "Sekunden",
  ms: "Millisekunden",
  h: "Stunden",
  d: "Tage",
  a: "Jahre",
  g: "Gramm",
  kg: "Kilogramm",
  t: "Tonnen",
  N: "Newton",
  kN: "Kilonewton",
  J: "Joule",
  kJ: "Kilojoule",
  W: "Watt",
  kW: "Kilowatt",
  V: "Volt",
  kV: "Kilovolt",
  mV: "Millivolt",
  A: "Ampere",
  mA: "Milliampere",
  C: "Coulomb",
  F: "Farad",
  pF: "Pikofarad",
  T: "Tesla",
  Hz: "Hertz",
  Pa: "Pascal",
  hPa: "Hektopascal",
  eV: "Elektronenvolt",
  keV: "Kiloelektronenvolt",
  MeV: "Megaelektronenvolt",
  mol: "Mol",
  l: "Liter",
  L: "Liter",
  ml: "Milliliter",
  K: "Kelvin",
  Bq: "Becquerel",
  Ohm: "Ohm",
  "%": "Prozent",
  "\\%": "Prozent",
  ppm: "ppm",
  "m/s": "Meter pro Sekunde",
  "km/h": "Kilometer pro Stunde",
  "g/mol": "Gramm pro Mol",
  "mol/l": "Mol pro Liter",
  "V/m": "Volt pro Meter",
  "kV/m": "Kilovolt pro Meter",
  "kJ/mol": "Kilojoule pro Mol",
  "J/mol": "Joule pro Mol",
  Gt: "Gigatonnen",
  "N/m^2": "Newton pro Quadratmeter",
  "N/C": "Newton pro Coulomb",
  rad: "Radiant",
};

/** "1 9" → "19": digits a group split into pieces belong together. */
function glueDigits(text: string): string {
  return text.replace(/(\d) (?=\d)/g, "$1");
}

function number(text: string): string {
  return text.replace(/\{,\}/g, ",");
}

function spokenDigit(text: string): string {
  return /^\d$/.test(text) ? NUMBER_WORDS[Number(text)] : text;
}

/** Element symbols in a chemical formula, spaced so TTS spells them. */
function chemical(text: string): string | null {
  if (!/^(?:[A-Z][a-z]?)+$/.test(text) || text.length > 8) return null;
  return text.match(/[A-Z][a-z]?/g)!.join(" ");
}

class Reader {
  private i = 0;
  private chemistry: boolean;

  constructor(
    private readonly tokens: TexToken[],
    private readonly source: string,
  ) {
    const tex = source;
    this.chemistry =
      /\\text\{[A-Z]/.test(tex) &&
      /_\d|\^[+-]|\\(?:rightarrow|rightleftharpoons)/.test(tex);
  }

  read(): string {
    return tidy(
      this.sequence(() => false),
      isChemistry(this.source),
    );
  }

  private peek() {
    return this.tokens[this.i];
  }

  private sequence(stop: (t: TexToken) => boolean): string {
    const parts: string[] = [];
    while (this.i < this.tokens.length && !stop(this.peek()!)) {
      let piece = this.atom();
      for (;;) {
        const next = this.peek();
        if (next?.kind === "sub") {
          this.i++;
          piece += ` ${this.subscript(this.group())}`;
        } else if (next?.kind === "sup") {
          this.i++;
          piece += ` ${this.superscript(this.group(), piece)}`;
        } else break;
      }
      parts.push(piece);
    }
    return parts.join(" ");
  }

  private group(): string {
    while (
      this.peek()?.kind === "char" &&
      /\s/.test((this.peek() as { char: string }).char)
    )
      this.i++;
    const token = this.peek();
    if (!token) return "";
    if (token.kind === "open") {
      this.i++;
      const body = this.sequence((t) => t.kind === "close");
      this.i++;
      return body;
    }
    return this.atom();
  }

  private rawGroup(): string {
    // The literal text of a group, for \text{…} and units.
    const token = this.peek();
    if (token?.kind !== "open") return this.atom();
    this.i++;
    let out = "";
    let depth = 0;
    while (this.i < this.tokens.length) {
      const t = this.tokens[this.i++];
      if (t.kind === "close" && depth === 0) break;
      if (t.kind === "open") depth++;
      if (t.kind === "close") depth--;
      if (t.kind === "char") out += t.char;
      else if (t.kind === "symbol")
        out += t.char === "%" ? "%" : t.char === "," ? "," : " ";
      else if (t.kind === "word") {
        if (!["text", "mathrm", "textbf", "mathbf"].includes(t.name)) {
          out += ` ${GREEK[t.name] ?? t.name} `;
        }
      } else if (t.kind === "sub") out += "_";
      else if (t.kind === "sup") out += "^";
    }
    return out;
  }

  private subscript(value: string): string {
    const v = glueDigits(value.trim());
    if (v === "1 / 2" || v === "1/2" || v === "ein halb") return "ein halb";
    return v
      .split(/\s+/)
      .map((w) => spokenDigit(w))
      .join(" ");
  }

  private superscript(value: string, base: string): string {
    const v = glueDigits(value.trim());
    if (v === "2") return "Quadrat";
    if (v === "verknüpft mit" || v === "Grad") {
      // 120^\circ is degrees; E^\circ, ΔG^\circ are standard values, "null".
      return /\d\s*$/.test(base) ? "Grad" : "null";
    }
    if (this.chemistry || /^[A-Z]/.test(base.trim())) {
      if (v === "+") return "plus";
      if (v === "-" || v === "minus") return "minus";
      const charge = /^(\d)\s*(plus|minus|\+|-)$/.exec(v);
      if (charge)
        return `${spokenDigit(charge[1])} ${charge[2] === "+" || charge[2] === "plus" ? "plus" : "minus"}`;
    }
    if (v === "T") return "transponiert";
    if (v === "minus 1") return "hoch minus eins";
    return `hoch ${v.split(/\s+/).map(spokenDigit).join(" ")}`;
  }

  private atom(): string {
    const token = this.tokens[this.i++];
    if (!token) return "";
    switch (token.kind) {
      case "open": {
        const inner = this.tokens[this.i];
        if (
          inner?.kind === "char" &&
          inner.char === "," &&
          this.tokens[this.i + 1]?.kind === "close"
        ) {
          this.i += 2;
          return ",";
        }
        const body = this.sequence((t) => t.kind === "close");
        this.i++;
        return body;
      }
      case "close":
        return "";
      case "sup": {
        // A prescript: ^A_Z X — mass number and nuclear charge.
        const mass = this.group();
        let charge = "";
        if (this.peek()?.kind === "sub") {
          this.i++;
          charge = this.group();
        }
        const element = this.atom();
        return charge
          ? `${element} mit Massenzahl ${mass} und Kernladungszahl ${charge}`
          : `${element} hoch ${mass}`;
      }
      case "sub":
        return this.group();
      case "align":
        return ",";
      case "begin": {
        if (token.env === "array" && this.peek()?.kind === "open")
          this.rawGroup();
        const body = this.sequence((t) => t.kind === "end");
        this.i++;
        const rows = body
          .split(" ; ")
          .map((r) => r.trim())
          .filter(Boolean);
        if (token.env === "pmatrix") return `Vektor ${rows.join(", ")}`;
        if (token.env === "cases") return rows.join("; sonst ");
        return rows.join("; ");
      }
      case "end":
        return "";
      case "symbol":
        if (token.char === "\\") return ";";
        if (token.char === "%") return "Prozent";
        if (token.char === "{" || token.char === "}") return "";
        if (token.char === "|") return "parallel";
        return "";
      case "char":
        return this.char(token.char);
      case "word":
        return this.word(token.name);
    }
  }

  private char(c: string): string {
    if (/\s/.test(c)) return "";
    switch (c) {
      case "=":
        return "gleich";
      case "+":
        return "plus";
      case "-":
        return "minus";
      case "<":
        return "kleiner als";
      case ">":
        return "größer als";
      case "/":
        return "durch";
      case "'":
        return "Strich";
      case "!":
        return "Fakultät";
      case "(":
        return "(";
      case ")":
        return ")";
      case "[":
        return "(";
      case "]":
        return ")";
      case "|":
        return "|";
      case ",":
        return ",";
      case ";":
        return ";";
      case ":":
        return ":";
      case ".":
        return ".";
      case "°":
        return "Grad";
      case "~":
        return "";
      default:
        return c;
    }
  }

  private word(name: string): string {
    if (name in GREEK) return GREEK[name];
    if (name in WORDS) return WORDS[name];
    switch (name) {
      case "frac":
      case "dfrac":
      case "tfrac": {
        const top = this.group().trim();
        const bottom = this.group().trim();
        const key = `${top}/${bottom}`;
        if (FRACTION_WORDS[key]) return FRACTION_WORDS[key];
        const complex = (s: string) => /\b(plus|minus)\b/.test(s);
        if (complex(top) || complex(bottom)) {
          return `Bruch: ${top}, durch ${bottom},`;
        }
        return `${top} durch ${bottom}`;
      }
      case "sqrt": {
        let index = "";
        while (
          this.peek()?.kind === "char" &&
          /\s/.test((this.peek() as { char: string }).char)
        )
          this.i++;
        if (
          this.peek()?.kind === "char" &&
          (this.peek() as { char: string }).char === "["
        ) {
          this.i++;
          index = this.sequence(
            (t) => t.kind === "char" && t.char === "]",
          ).trim();
          this.i++;
        }
        const body = this.group().trim();
        const root = index
          ? `${ORDINAL_ROOT[index] ?? `${index}-te`} Wurzel aus`
          : "Wurzel aus";
        return /\b(plus|minus|mal|durch)\b/.test(body)
          ? `${root} ${body},`
          : `${root} ${body}`;
      }
      case "text":
      case "textbf":
      case "mathrm":
      case "operatorname":
      case "mathit": {
        const raw = this.rawGroup().trim();
        const prev = this.tokens[this.i - 1];
        void prev;
        const unit = UNITS[raw];
        if (unit && this.lastWasNumber) return unit;
        return chemical(raw) ?? raw;
      }
      case "mathbf":
      case "boldsymbol":
      case "mathrel":
      case "mathcal":
        return this.group();
      case "mathbb": {
        const set = this.rawGroup().trim();
        return { R: "R", N: "N", Z: "Z", Q: "Q", C: "C" }[set] ? `${set}` : set;
      }
      case "vec":
        return `Vektor ${this.group()}`;
      case "overline":
      case "bar":
        return `${this.group()} quer`;
      case "dot":
        return `${this.group()} Punkt`;
      case "ddot":
        return `${this.group()} zwei Punkt`;
      case "hat":
      case "widehat":
        return `${this.group()} Dach`;
      case "tilde":
        return `${this.group()} Schlange`;
      case "underline":
        return this.group();
      case "binom": {
        const n = this.group();
        const k = this.group();
        return `${n} über ${k}`;
      }
      case "int": {
        let lower = "";
        let upper = "";
        for (let k = 0; k < 2; k++) {
          const next = this.peek();
          if (next?.kind === "sub") {
            this.i++;
            lower = this.group();
          } else if (next?.kind === "sup") {
            this.i++;
            upper = this.group();
          }
        }
        return lower || upper
          ? `Integral von ${lower} bis ${upper} über`
          : "Integral über";
      }
      case "sum":
        return "Summe";
      case "lim": {
        if (this.peek()?.kind === "sub") {
          this.i++;
          return `Limes für ${this.group()}`;
        }
        return "Limes";
      }
      case "log": {
        if (this.peek()?.kind === "sub") {
          this.i++;
          return `Logarithmus zur Basis ${this.group()} von`;
        }
        return "Logarithmus von";
      }
      case "to":
      case "rightarrow":
        return this.chemistry ? "reagiert zu" : "gegen";
      case "xrightarrow":
        return `reagiert mit ${this.rawGroup().trim()} zu`;
      case "xrightleftharpoons":
        return `im Gleichgewicht mit Katalysator ${this.rawGroup().trim()} mit`;
      case "underbrace":
      case "overbrace": {
        const body = this.group();
        if (this.peek()?.kind === "sub" || this.peek()?.kind === "sup") {
          this.i++;
          return `${body} (${this.group()})`;
        }
        return body;
      }
      case "pmod":
        return `modulo ${this.group()}`;
      case "not": {
        const next = this.atom();
        return next === "Element von" ? "nicht Element von" : `nicht ${next}`;
      }
      case "left":
      case "right":
      case "middle":
      case "big":
      case "Big":
      case "bigl":
      case "bigr":
        if (
          this.peek()?.kind === "char" &&
          (this.peek() as { char: string }).char === "."
        )
          this.i++;
        return "";
      case "quad":
      case "qquad":
        return ",";
      case "hline":
        return "";
      case "langle":
        return "(";
      case "rangle":
        return ")";
      case "lceil":
        return "aufgerundet (";
      case "rceil":
        return ")";
      case "begin":
      case "end":
        return "";
      default:
        if (name in FUNCTIONS) return `${FUNCTIONS[name]}`;
        return name;
    }
  }

  private get lastWasNumber(): boolean {
    // The token before \text: a thin space `\,` after a number means a unit.
    for (let j = this.i - 1; j >= 0; j--) {
      const t = this.tokens[j];
      if (t.kind === "word" && (t.name === "text" || t.name === "mathrm"))
        continue;
      if (t.kind === "open" || t.kind === "close") continue;
      if (t.kind === "char" && /[A-Za-z%/\s]/.test(t.char)) continue;
      if (
        t.kind === "symbol" &&
        (t.char === "," || t.char === ";" || t.char === " ")
      ) {
        const before = this.tokens[j - 1];
        return (
          (before?.kind === "char" && /[\d}]/.test(before.char)) ||
          before?.kind === "close"
        );
      }
      return t.kind === "char" && /\d/.test(t.char);
    }
    return false;
  }
}

/** Words a following "(x)" turns into a call: "f von x", "Sinus von Alpha". */
const CALLABLE =
  /^(?:Sinus|Kosinus|Tangens|l n|l g|Determinante|Strich|[a-zA-Z]|[A-Z][a-z]?|Alpha|Beta|Gamma|Delta|Lambda|My|Phi|Psi|Sigma|Rho|Omega|Theta|Eta|Tau|Chi)$/;

/** Glue digits, read function calls, and drop leftover punctuation. */
function tidy(text: string, chemistry = false): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/(\d) (?=[\d,])/g, "$1")
    .replace(/, (?=\d)/g, ",")
    .replace(/(\d),(?!\d)/g, "$1, ")
    .replace(
      /([A-Za-zÄÖÜäöüß]+) \( ([^()]*?) \)/g,
      (_m, f: string, arg: string) => {
        if (f === "von") return `von ${arg}`;
        // In chemistry "Ni(H2O)" is a complex, not a function call.
        if (chemistry && /^[A-Z][a-z]?$/.test(f) && f !== "c")
          return `${f} ( ${arg} )`;
        return CALLABLE.test(f) ? `${f} von ${arg}` : `${f} (${arg})`;
      },
    )
    .replace(/\| ([^|]*?) \|/g, "Betrag von $1,")
    .replace(/ \( /g, " Klammer auf ")
    .replace(/ \)/g, " Klammer zu")
    .replace(/^\( /, "Klammer auf ")
    .replace(/Klammer auf (\S+) Klammer zu/g, "$1")
    .replace(
      /(\d) My (s|m)\b/g,
      (_m, d: string, u: string) =>
        `${d} ${u === "s" ? "Mikrosekunden" : "Mikrometer"}`,
    )
    .replace(/Grad C\b/g, "Grad Celsius")
    .replace(/ -(?=[A-Za-zÄÖÜäöü])/g, "-")
    .replace(/hoch \*/g, "Stern")
    .replace(/\s+([,;.:])/g, "$1")
    .replace(/(\d)\. (?=\d)/g, "$1.")
    .replace(/([,;:])(?=[^\s\d])/g, "$1 ")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function draftSpeech(tex: string): string {
  const { tokens, issues } = tokenizeTex(tex);
  if (issues.length > 0) return "";
  return new Reader(tokens, tex).read();
}

/** True when the formula reads as chemistry (element symbols, charges). */
function isChemistry(tex: string): boolean {
  return (
    /\\text\{[A-Z][a-z]?/.test(tex) ||
    /\b(?:Cu|Zn|Ni|Ag|Pt|Fe|Na|Cl|Mg|Ca)\b/.test(tex)
  );
}

if (import.meta.main ?? process.argv[1]?.endsWith("speech-draft.ts")) {
  const worklist = JSON.parse(
    readFileSync(join(import.meta.dirname, "speech-worklist.json"), "utf-8"),
  ) as Array<{ lang: string; tex: string }>;
  for (const { lang, tex } of worklist.sort((a, b) =>
    a.tex.localeCompare(b.tex),
  )) {
    process.stdout.write(`${lang}\t${tex}\t${number(draftSpeech(tex))}\n`);
  }
}
