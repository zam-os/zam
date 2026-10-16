/**
 * A formula's plain Unicode form (ADR 2026-10-14b, Decision 4).
 *
 * The plain projection of a card — what CLI, MCP, search, embeddings and LLM
 * prompts see — writes each formula as Unicode text. It is derived from
 * `tex` by this one deterministic converter and never authored: a second
 * stored form would drift, the way a stored answer-point count would. A
 * formula that reads badly is a fix here.
 *
 * The rules follow TeX's own semantics where they matter for reading:
 *
 * - **Spaces in math are insignificant**, as in TeX. Relations and binary
 *   operators get spaces around them (`a = b + c`); a product does not
 *   (`m·c²`). Inside `\text{…}` spaces are kept as written.
 * - **`{,}` is a decimal comma** (`2{,}5` → `2,5`); a bare comma in math is a
 *   separator and gets a space after it.
 * - **Scripts become Unicode where every character has a script form**
 *   (`x²`, `10⁻¹⁹`, `CO₂`, `ε₀`, `⁴₂He`), otherwise `^(…)` and `_…`.
 *   Letter subscripts stay `_el`: Unicode has subscript forms for only some
 *   letters, and a half-converted index reads worse than `W_el`.
 * - **Fractions** become `a/b`, with parentheses around a side that is not a
 *   single number or symbol; common numeric fractions use their glyph (`½`).
 * - **Matrices** become `(a, b, c)` for a vector and `[[a, b], [c, d]]`
 *   otherwise; `cases` and `aligned` rows are joined with `; `.
 *
 * Input is expected to have passed the tokenizer. A formula that has not is
 * returned as written, so a projection never throws.
 */

import { type TexToken, tokenizeTex } from "./tex-tokenizer.js";

const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ϵ",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "ϕ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

/** Relations, arrows and binary operators: written with spaces around. */
const SPACED: Record<string, string> = {
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  oplus: "⊕",
  otimes: "⊗",
  cap: "∩",
  cup: "∪",
  setminus: "∖",
  wedge: "∧",
  vee: "∨",
  land: "∧",
  lor: "∨",
  approx: "≈",
  neq: "≠",
  ne: "≠",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ll: "≪",
  gg: "≫",
  equiv: "≡",
  sim: "∼",
  simeq: "≃",
  cong: "≅",
  propto: "∝",
  in: "∈",
  notin: "∉",
  ni: "∋",
  subset: "⊂",
  subseteq: "⊆",
  supset: "⊃",
  supseteq: "⊇",
  subsetneq: "⊊",
  perp: "⊥",
  parallel: "∥",
  mid: "|",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  implies: "⇒",
  iff: "⇔",
  mapsto: "↦",
  longrightarrow: "⟶",
  longleftarrow: "⟵",
  longleftrightarrow: "⟷",
  Longrightarrow: "⟹",
  Longleftrightarrow: "⟺",
  rightleftharpoons: "⇌",
};

/** Symbols written without spaces. */
const PLAIN: Record<string, string> = {
  cdot: "·",
  ast: "∗",
  star: "⋆",
  circ: "∘",
  bullet: "•",
  odot: "⊙",
  neg: "¬",
  lnot: "¬",
  uparrow: "↑",
  downarrow: "↓",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  emptyset: "∅",
  varnothing: "∅",
  forall: "∀",
  exists: "∃",
  angle: "∠",
  measuredangle: "∡",
  sphericalangle: "∢",
  triangle: "△",
  square: "□",
  blacksquare: "■",
  degree: "°",
  prime: "′",
  ell: "ℓ",
  hbar: "ℏ",
  dots: "…",
  ldots: "…",
  cdots: "⋯",
  vdots: "⋮",
  ddots: "⋱",
  colon: ":",
  checkmark: "✓",
  smile: "⌣",
  P: "¶",
  sum: "∑",
  prod: "∏",
  int: "∫",
  oint: "∮",
  langle: "⟨",
  rangle: "⟩",
  lceil: "⌈",
  rceil: "⌉",
  lfloor: "⌊",
  rfloor: "⌋",
  vert: "|",
  Vert: "‖",
};

/** Operators whose limits are written as scripts. */
const BIG_OPERATORS = new Set(["sum", "prod", "int", "oint"]);

/** Named functions, written as their name. */
const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "ln",
  "log",
  "lg",
  "lim",
  "max",
  "min",
  "det",
  "gcd",
]);

/** One-argument commands whose argument is the text itself. */
const TEXT_ARGUMENT = new Set([
  "text",
  "textbf",
  "textit",
  "mathrm",
  "mathbf",
  "mathit",
  "mathcal",
  "operatorname",
  "boldsymbol",
  "mathrel",
]);

/** Combining mark per accent; `each` marks every character. */
const ACCENTS: Record<string, { mark: string; each: boolean }> = {
  vec: { mark: "⃗", each: false },
  bar: { mark: "̅", each: true },
  overline: { mark: "̅", each: true },
  underline: { mark: "̲", each: true },
  hat: { mark: "̂", each: false },
  widehat: { mark: "̂", each: false },
  tilde: { mark: "̃", each: false },
  widetilde: { mark: "̃", each: false },
  dot: { mark: "̇", each: false },
  ddot: { mark: "̈", each: false },
};

const DOUBLE_STRUCK: Record<string, string> = {
  N: "ℕ",
  Z: "ℤ",
  Q: "ℚ",
  R: "ℝ",
  C: "ℂ",
  P: "ℙ",
};

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  // No superscript asterisk exists; `p*` reads as `p^*` is meant.
  "*": "*",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
};

const VULGAR: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/5": "⅕",
  "2/5": "⅖",
  "3/5": "⅗",
  "4/5": "⅘",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

/** Characters that turn a following `+`/`-` into a sign, not an operator. */
const BEFORE_SIGN =
  /[([{,=<>≤≥≈≠→←↔⇒⇐⇔⟶⟵⟷⟹⟺⇌∈∉⊂⊆⊃⊇⊊≡∼≃≅∝±∓×÷·+\-|:;\uE000\uE001]$/u;

/**
 * Placeholders for `&` and `\\` until an environment splits on them:
 * private-use characters, which never occur in a formula's output.
 */
const CELL = "\uE000";
const ROW = "\uE001";

/** Every control word the converter knows; the inventory must stay inside. */
export const PLAIN_KNOWN_WORDS: ReadonlySet<string> = new Set([
  ...Object.keys(GREEK),
  ...Object.keys(SPACED),
  ...Object.keys(PLAIN),
  ...FUNCTIONS,
  ...TEXT_ARGUMENT,
  ...Object.keys(ACCENTS),
  "mathbb",
  "frac",
  "dfrac",
  "tfrac",
  "sqrt",
  "binom",
  "underbrace",
  "overbrace",
  "overset",
  "underset",
  "stackrel",
  "xrightarrow",
  "xleftarrow",
  "xrightleftharpoons",
  "pmod",
  "quad",
  "qquad",
  "hline",
  "not",
  "begin",
  "end",
  "left",
  "right",
  "middle",
  "big",
  "Big",
  "bigl",
  "bigr",
  "Bigl",
  "Bigr",
]);

function toScript(value: string, table: Record<string, string>): string | null {
  if (!value) return null;
  let out = "";
  for (const char of value) {
    const mapped = table[char];
    if (mapped === undefined) return null;
    out += mapped;
  }
  return out;
}

/** Scripts a symbol may carry and still read as one unit. */
const SCRIPTS =
  "(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎′'!]|_[\\p{L}\\p{N}]+|[_^]\\([^()]*\\))*";

/** Delimiter commands a function name sits directly against: `ln(`. */
const DELIMITER_WORDS = new Set([
  "left",
  "right",
  "big",
  "Big",
  "bigl",
  "bigr",
  "Bigl",
  "Bigr",
  "langle",
  "lceil",
  "lfloor",
  "vert",
  "Vert",
]);
const ATOMIC_SYMBOL = new RegExp(
  `^[\\p{L}\\p{N}∞][\\u0300-\\u036F\\u20D0-\\u20FF]*${SCRIPTS}$`,
  "u",
);
const ATOMIC_CALL = new RegExp(
  `^\\p{L}[\\p{L}\\p{N}]*${SCRIPTS}\\([^()]*\\)${SCRIPTS}$`,
  "u",
);

/**
 * A side of a fraction that needs no parentheses: a number, a word (a unit
 * such as `rad`), one symbol with its marks and scripts, a function call
 * such as `ln(b)`, or one parenthesised group.
 */
function isAtomic(value: string): boolean {
  const text = value.trim();
  if (/^[0-9]+(?:[.,][0-9]+)?$/u.test(text)) return true;
  if (/^\p{L}+$/u.test(text)) return true;
  if (/^\(.*\)$/u.test(text) && !/\)[^)]*\(/u.test(text)) return true;
  return ATOMIC_SYMBOL.test(text) || ATOMIC_CALL.test(text);
}

/** True when `before` ends in something a juxtaposed factor multiplies. */
function endsInOperand(before: string): boolean {
  return /[\p{L}\p{N})²³¹⁰⁴⁵⁶⁷⁸⁹]$/u.test(before);
}

function wrap(value: string): string {
  const text = value.trim();
  return isAtomic(text) ? text : `(${text})`;
}

function accent(value: string, mark: string, each: boolean): string {
  const chars = [...value.trim()];
  if (chars.length === 0) return mark;
  if (each) return chars.map((c) => (c === " " ? c : c + mark)).join("");
  return chars.join("") + mark;
}

function superscript(value: string): string {
  const text = value.trim();
  if (text === "∘" || text === "\\circ") return "°";
  const mapped = toScript(text.replace(/−/g, "-"), SUPERSCRIPT);
  if (mapped) return mapped;
  if ([...text].length === 1) return `^${text}`;
  return `^(${text})`;
}

function subscript(value: string): string {
  const text = value.trim();
  const mapped = toScript(text.replace(/−/g, "-"), SUBSCRIPT);
  if (mapped) return mapped;
  if ([...text].length === 1 || /^[\p{L}\p{N}]+$/u.test(text))
    return `_${text}`;
  return `_(${text})`;
}

function rows(body: string): string[][] {
  const lines = body.split(ROW).map((line) => line.trim());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((line) => line.split(CELL).map((cell) => cell.trim()));
}

function environment(env: string, body: string): string {
  const table = rows(body.replace(/\s*\\hline\s*/g, " "));
  switch (env) {
    case "pmatrix":
    case "array": {
      if (table.length === 1) return `(${table[0].join(", ")})`;
      if (table.every((row) => row.length === 1)) {
        return `(${table.map((row) => row[0]).join(", ")})`;
      }
      return `[${table.map((row) => `[${row.join(", ")}]`).join(", ")}]`;
    }
    case "cases":
      return `{${table.map((row) => row.filter(Boolean).join(", ")).join("; ")}}`;
    default:
      return table.map((row) => row.join(" ").replace(/\s+/g, " ")).join("; ");
  }
}

class Converter {
  private i = 0;
  /** Set by a function name with scripts; consumed after they attach. */
  private spaceAfterScripts = false;

  constructor(private readonly tokens: TexToken[]) {}

  run(): string {
    return this.sequence(false, false, () => false);
  }

  private peek(): TexToken | undefined {
    return this.tokens[this.i];
  }

  private skipSpaces(): void {
    while (
      this.peek()?.kind === "char" &&
      /\s/.test((this.peek() as { char: string }).char)
    ) {
      this.i++;
    }
  }

  /** Read tokens until `stop` matches (the stop token is not consumed). */
  private sequence(
    textMode: boolean,
    compact: boolean,
    stop: (token: TexToken) => boolean,
  ): string {
    let out = "";
    while (this.i < this.tokens.length) {
      const token = this.peek()!;
      if (stop(token)) break;
      let piece = this.atom(textMode, compact, out);
      // Claim the flag before the scripts are parsed: their own sequences
      // must not see it.
      const spaceAfterScripts = this.spaceAfterScripts;
      this.spaceAfterScripts = false;
      for (;;) {
        const save = this.i;
        if (!textMode) this.skipSpaces();
        const next = this.peek();
        if (next?.kind === "sup") {
          this.i++;
          piece += superscript(this.argument(true));
        } else if (next?.kind === "sub") {
          this.i++;
          piece += subscript(this.argument(true));
        } else {
          this.i = save;
          break;
        }
      }
      if (spaceAfterScripts && this.argumentFollows()) piece += " ";
      out += piece;
    }
    return out;
  }

  /** One argument: a braced group, or a single token with its own args. */
  private argument(compact: boolean, textMode = false): string {
    this.skipSpaces();
    const token = this.peek();
    if (!token) return "";
    if (token.kind === "open") {
      this.i++;
      const body = this.sequence(textMode, compact, (t) => t.kind === "close");
      if (this.peek()?.kind === "close") this.i++;
      return body;
    }
    return this.atom(textMode, compact, "");
  }

  /** An optional `[…]` argument, as for `\sqrt[3]{x}`. */
  private optional(): string | null {
    const save = this.i;
    this.skipSpaces();
    const token = this.peek();
    if (token?.kind === "char" && token.char === "[") {
      this.i++;
      const body = this.sequence(
        false,
        true,
        (t) => t.kind === "char" && t.char === "]",
      );
      if (this.peek()?.kind === "char") this.i++;
      return body;
    }
    this.i = save;
    return null;
  }

  /** Whether a function name is followed by a bare argument (`\sin x`). */
  private argumentFollows(): boolean {
    let j = this.i;
    while (
      this.tokens[j]?.kind === "char" &&
      /\s/.test((this.tokens[j] as { char: string }).char)
    )
      j++;
    const next = this.tokens[j];
    return (
      next !== undefined &&
      ((next.kind === "word" && !DELIMITER_WORDS.has(next.name)) ||
        (next.kind === "char" && /[\p{L}\p{N}]/u.test(next.char)))
    );
  }

  /** Whether the next token starts a factor juxtaposed to what came before. */
  private factorFollows(): boolean {
    let j = this.i;
    while (
      this.tokens[j]?.kind === "char" &&
      /\s/.test((this.tokens[j] as { char: string }).char)
    )
      j++;
    const next = this.tokens[j];
    if (!next) return false;
    if (next.kind === "char") return /[\p{L}\p{N}(]/u.test(next.char);
    if (next.kind === "word") {
      return (
        next.name in GREEK ||
        FUNCTIONS.has(next.name) ||
        TEXT_ARGUMENT.has(next.name) ||
        ["frac", "dfrac", "tfrac", "sqrt", "left"].includes(next.name)
      );
    }
    return false;
  }

  private operator(symbol: string, compact: boolean, before: string): string {
    if (compact) return symbol;
    if (
      (symbol === "+" || symbol === "-") &&
      (!before.trim() || BEFORE_SIGN.test(before.trimEnd()))
    ) {
      return symbol;
    }
    return ` ${symbol} `;
  }

  private atom(textMode: boolean, compact: boolean, before: string): string {
    const token = this.tokens[this.i++];
    // A projection never throws: a formula that ends early ends here.
    if (!token) return "";
    switch (token.kind) {
      case "open": {
        // `{,}` is TeX's decimal comma: a comma with no separator space.
        const inner = this.tokens[this.i];
        if (
          inner?.kind === "char" &&
          inner.char === "," &&
          this.tokens[this.i + 1]?.kind === "close"
        ) {
          this.i += 2;
          return ",";
        }
        const body = this.sequence(
          textMode,
          compact,
          (t) => t.kind === "close",
        );
        if (this.peek()?.kind === "close") this.i++;
        return body;
      }
      case "close":
        return "";
      case "sup":
        return superscript(this.argument(true));
      case "sub":
        return subscript(this.argument(true));
      case "align":
        return CELL;
      case "begin": {
        if (token.env === "array" && this.peek()?.kind === "open")
          this.argument(true);
        const body = this.sequence(
          false,
          compact,
          (t) => t.kind === "end" && t.env === token.env,
        );
        if (this.peek()?.kind === "end") this.i++;
        return environment(token.env, body);
      }
      case "end":
        return "";
      case "symbol":
        return this.symbol(token.char);
      case "char":
        return this.char(token.char, textMode, compact, before);
      case "word":
        return this.word(token.name, textMode, compact, before);
    }
  }

  private symbol(char: string): string {
    switch (char) {
      case ",":
      case ";":
      case ":":
      case " ":
        return " ";
      case "!":
        return "";
      case "\\":
        return ROW;
      case "|":
        return "‖";
      default:
        return char;
    }
  }

  private char(
    char: string,
    textMode: boolean,
    compact: boolean,
    before: string,
  ): string {
    if (textMode) return char;
    if (/\s/.test(char)) return "";
    switch (char) {
      case "=":
      case "<":
      case ">":
      case "+":
      case "-":
        return this.operator(char, compact, before);
      case "*":
        // `p^*`, `X^*`: a star in a script marks, it does not multiply.
        return compact ? "*" : "·";
      case ",":
        return compact ? "," : ", ";
      case ":":
        return compact ? ":" : ": ";
      case "~":
        return " ";
      default:
        return char;
    }
  }

  private word(
    name: string,
    textMode: boolean,
    compact: boolean,
    before: string,
  ): string {
    if (name in GREEK) return GREEK[name];
    if (name in SPACED) return this.operator(SPACED[name], compact, before);
    if (name in PLAIN) {
      // A big operator with limits reads like a function: `∑_(i=1)ⁿ i`.
      if (BIG_OPERATORS.has(name)) {
        this.skipSpaces();
        const next = this.peek();
        if (next?.kind === "sup" || next?.kind === "sub") {
          this.spaceAfterScripts = true;
        }
      }
      return PLAIN[name];
    }
    if (FUNCTIONS.has(name)) {
      this.skipSpaces();
      const spaceBefore = !compact && endsInOperand(before);
      // With scripts (`\lim_{x\to 0}`), the space belongs after them; the
      // sequence adds it once the scripts are attached.
      const next = this.peek();
      if (next?.kind === "sup" || next?.kind === "sub") {
        this.spaceAfterScripts = true;
        return `${spaceBefore ? " " : ""}${name}`;
      }
      return `${spaceBefore ? " " : ""}${name}${this.argumentFollows() ? " " : ""}`;
    }
    if (TEXT_ARGUMENT.has(name)) {
      return this.argument(
        compact,
        name.startsWith("text") || name === "operatorname",
      );
    }
    if (name in ACCENTS) {
      const { mark, each } = ACCENTS[name];
      return accent(this.argument(true), mark, each);
    }
    switch (name) {
      case "mathbb": {
        const arg = this.argument(true);
        return [...arg].map((c) => DOUBLE_STRUCK[c] ?? c).join("");
      }
      case "frac":
      case "dfrac":
      case "tfrac": {
        const top = this.argument(compact);
        const bottom = this.argument(compact);
        const glyph = VULGAR[`${top.trim()}/${bottom.trim()}`];
        if (glyph) return glyph;
        // A linear fraction juxtaposed with a factor needs a visible dot on
        // that side: `G \frac{M m}{r^2}` is `G·(M·m)/r²`, not a call `G(…)`,
        // and `\frac{1}{LC} Q` is `1/LC·Q`, not `1/(LCQ)`.
        const fraction = `${wrap(top)}/${wrap(bottom)}`;
        const dotBefore = fraction.startsWith("(") && endsInOperand(before);
        return `${dotBefore ? "·" : ""}${fraction}${this.factorFollows() ? "·" : ""}`;
      }
      case "sqrt": {
        const index = this.optional();
        const body = this.argument(compact);
        const root = index === "3" ? "∛" : index === "4" ? "∜" : "√";
        const prefix = index && root === "√" ? superscript(index) : "";
        return `${prefix}${root}${wrap(body)}`;
      }
      case "binom": {
        const n = this.argument(true);
        const k = this.argument(true);
        return `C(${n.trim()}, ${k.trim()})`;
      }
      case "underbrace":
      case "overbrace": {
        const body = this.argument(compact);
        this.skipSpaces();
        const next = this.peek();
        if (next?.kind === "sub" || next?.kind === "sup") {
          this.i++;
          const label = this.argument(compact);
          return `${body} (${label.trim()})`;
        }
        return body;
      }
      case "overset":
      case "underset":
      case "stackrel": {
        const label = this.argument(true);
        const base = this.argument(compact);
        return `${base.trim()}(${label.trim()})`;
      }
      case "xrightarrow":
      case "xleftarrow":
      case "xrightleftharpoons": {
        this.optional();
        const label = this.argument(true).trim();
        const arrow =
          name === "xrightarrow" ? "→" : name === "xleftarrow" ? "←" : "⇌";
        const written = label ? `–${label}${arrow}` : arrow;
        return compact ? written : ` ${written} `;
      }
      case "pmod":
        return ` (mod ${this.argument(true).trim()})`;
      case "quad":
      case "qquad":
        return "  ";
      case "hline":
        return "";
      case "not": {
        // NFC composes `∈` + U+0338 into `∉` and `=` + U+0338 into `≠`.
        // TeX ignores the space in `\not \in`; so does the projection.
        this.skipSpaces();
        const next = this.atom(textMode, compact, before);
        const core = next.trim();
        return core ? next.replace(core, `${core}̸`).normalize("NFC") : next;
      }
      case "left":
      case "right":
      case "middle": {
        const next = this.peek();
        if (next?.kind === "char" && next.char === ".") this.i++;
        return "";
      }
      case "big":
      case "Big":
      case "bigl":
      case "bigr":
      case "Bigl":
      case "Bigr":
        return "";
      default:
        return name;
    }
  }
}

function tidy(value: string): string {
  return value
    .replace(new RegExp(`${CELL}`, "g"), " ")
    .replace(new RegExp(`${ROW}`, "g"), "; ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ([,;)\]}])/g, "$1")
    .replace(/([([{]) /g, "$1")
    .trim();
}

/** The plain Unicode form of a formula (see the module comment). */
export function texToPlain(tex: string): string {
  const { tokens, issues } = tokenizeTex(tex);
  if (issues.length > 0) return tex.trim();
  return tidy(new Converter(tokens).run());
}
