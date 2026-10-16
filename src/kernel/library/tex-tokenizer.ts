/**
 * The fail-closed TeX lexer that guards every formula (ADR 2026-10-14b,
 * Decision 3).
 *
 * The kernel validates a formula without a TeX parser and without the
 * renderer: TeX math is lexically simple (control words, control symbols,
 * braces, scripts), so a lexer over a closed inventory is enough. A control
 * word or environment outside `math-inventory.json` is refused, and so are
 * the families that could reach outside the formula or redefine the
 * language — even if someone were to add one to the inventory by mistake.
 *
 * The renderer's own settings (`trust: false`, `maxExpand`) are a second
 * line, not the boundary: KaTeX, which Temml forked, has had advisories that
 * got past each of them.
 */

import inventory from "./math-inventory.json" with { type: "json" };

/** Longest formula the kernel accepts; the bundled corpus peaks at 433. */
export const MAX_TEX_LENGTH = 500;

/**
 * Commands refused whatever the inventory says. This list documents the
 * rule; the rule itself is "nothing outside the inventory". It names the
 * families that redefine TeX (`\def` and friends, `\csname`, which can build
 * any name), control expansion, or reach outside the formula.
 */
export const FORBIDDEN_TEX_COMMANDS: ReadonlySet<string> = new Set([
  "def",
  "gdef",
  "edef",
  "xdef",
  "let",
  "futurelet",
  "global",
  "long",
  "outer",
  "newcommand",
  "renewcommand",
  "providecommand",
  "DeclareMathOperator",
  "expandafter",
  "noexpand",
  "csname",
  "endcsname",
  "char",
  "catcode",
  "input",
  "include",
  "href",
  "url",
  "includegraphics",
  "html",
  "htmlClass",
  "htmlId",
  "htmlStyle",
  "htmlData",
  "class",
  "id",
  "style",
  "data",
  "label",
  "ref",
  "eqref",
  "tag",
]);

const CONTROL_WORDS: ReadonlySet<string> = new Set(inventory.controlWords);
const CONTROL_SYMBOLS: ReadonlySet<string> = new Set(inventory.controlSymbols);
const ENVIRONMENTS: ReadonlySet<string> = new Set(inventory.environments);

/** The inventory's version, for messages and for prompts that cite it. */
export const MATH_INVENTORY_VERSION: number = inventory.version;

/** The environments a formula may use, in the inventory's order. */
export const MATH_ENVIRONMENTS: readonly string[] = inventory.environments;

/** True when `name` (without the backslash) is an allowed control word. */
export function isInventoryControlWord(name: string): boolean {
  return CONTROL_WORDS.has(name) && !FORBIDDEN_TEX_COMMANDS.has(name);
}

export type TexToken =
  /** `\frac`, `\alpha` — `name` without the backslash. */
  | { kind: "word"; name: string; offset: number }
  /** `\,`, `\{`, `\\` — `char` is the character after the backslash. */
  | { kind: "symbol"; char: string; offset: number }
  | { kind: "begin"; env: string; offset: number }
  | { kind: "end"; env: string; offset: number }
  | { kind: "open"; offset: number }
  | { kind: "close"; offset: number }
  | { kind: "sup"; offset: number }
  | { kind: "sub"; offset: number }
  /** `&`, the column separator inside an environment. */
  | { kind: "align"; offset: number }
  /** Any other character, whitespace included. */
  | { kind: "char"; char: string; offset: number };

export type TexIssueCode =
  | "empty"
  | "too-long"
  | "dollar"
  | "comment"
  | "parameter"
  | "control-character"
  | "forbidden-command"
  | "unknown-command"
  | "unknown-symbol"
  | "unknown-environment"
  | "unbalanced-braces"
  | "unbalanced-environment"
  | "stray-alignment"
  | "doubled-backslash"
  | "trailing-backslash"
  | "missing-operand"
  | "invisible-character";

export interface TexIssue {
  code: TexIssueCode;
  /** Character offset in the formula. */
  offset: number;
  /** The offending token as written, when there is one. */
  token?: string;
  message: string;
}

export interface TexLexResult {
  tokens: TexToken[];
  issues: TexIssue[];
}

/** Direction controls and zero-width characters (bidi and spacing tricks). */
const INVISIBLE =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z]/.test(char);
}

/**
 * Lex `tex` and collect every reason to refuse it. A formula is acceptable
 * exactly when `issues` is empty; `tokens` is only meaningful then.
 */
export function tokenizeTex(tex: string): TexLexResult {
  const tokens: TexToken[] = [];
  const issues: TexIssue[] = [];
  const issue = (
    code: TexIssueCode,
    offset: number,
    message: string,
    token?: string,
  ) =>
    issues.push(
      token === undefined
        ? { code, offset, message }
        : { code, offset, message, token },
    );

  if (!tex.trim()) {
    issue("empty", 0, "The formula is empty.");
    return { tokens, issues };
  }
  if (tex.length > MAX_TEX_LENGTH) {
    issue(
      "too-long",
      MAX_TEX_LENGTH,
      `The formula has ${tex.length} characters; at most ${MAX_TEX_LENGTH} are allowed.`,
    );
  }

  let depth = 0;
  const environments: Array<{ env: string; offset: number }> = [];
  let i = 0;
  while (i < tex.length) {
    const char = tex[i];
    const code = char.charCodeAt(0);
    if ((code < 0x20 && char !== "\n") || code === 0x7f) {
      issue(
        "control-character",
        i,
        `Control character U+${code.toString(16).padStart(4, "0").toUpperCase()} in the formula.`,
      );
      i++;
      continue;
    }
    // Direction overrides and zero-width characters have no place in a
    // formula, and they could make one read differently than it renders.
    if (INVISIBLE.test(char)) {
      issue(
        "invisible-character",
        i,
        `Invisible character U+${code.toString(16).padStart(4, "0").toUpperCase()} in the formula.`,
      );
      i++;
      continue;
    }
    if (char === "\\") {
      const next = tex[i + 1];
      if (next === undefined) {
        issue("trailing-backslash", i, "The formula ends in a lone backslash.");
        i++;
        continue;
      }
      if (isLetter(next)) {
        let end = i + 1;
        while (isLetter(tex[end])) end++;
        const name = tex.slice(i + 1, end);
        if (FORBIDDEN_TEX_COMMANDS.has(name)) {
          issue(
            "forbidden-command",
            i,
            `\\${name} is never allowed in a formula.`,
            `\\${name}`,
          );
        } else if (!CONTROL_WORDS.has(name)) {
          issue(
            "unknown-command",
            i,
            `\\${name} is not in ZAM's formula inventory.`,
            `\\${name}`,
          );
        }
        if (name === "begin" || name === "end") {
          const match = /^\s*\{([A-Za-z]+\*?)\}/.exec(tex.slice(end));
          if (!match) {
            issue(
              "unknown-environment",
              i,
              `\\${name} needs an environment name in braces.`,
              `\\${name}`,
            );
            tokens.push({ kind: "word", name, offset: i });
            i = end;
            continue;
          }
          const env = match[1];
          if (!ENVIRONMENTS.has(env)) {
            issue(
              "unknown-environment",
              i,
              `The environment ${env} is not in ZAM's formula inventory.`,
              env,
            );
          }
          if (name === "begin") {
            environments.push({ env, offset: i });
            tokens.push({ kind: "begin", env, offset: i });
          } else {
            const top = environments.pop();
            if (!top || top.env !== env) {
              issue(
                "unbalanced-environment",
                i,
                `\\end{${env}} does not close ${top ? `\\begin{${top.env}}` : "any environment"}.`,
                env,
              );
            }
            tokens.push({ kind: "end", env, offset: i });
          }
          i = end + match[0].length;
          continue;
        }
        tokens.push({ kind: "word", name, offset: i });
        i = end;
        continue;
      }
      if (next === "\\" && environments.length === 0) {
        // `\\lambda` outside a matrix is an escaping slip (JSON's `\\\\`
        // where `\\` was meant): a line break followed by the letters
        // "lambda", never what the author wanted.
        const word = /^[A-Za-z]+/.exec(tex.slice(i + 2))?.[0];
        if (word && CONTROL_WORDS.has(word)) {
          issue(
            "doubled-backslash",
            i,
            `\\\\${word} is a line break followed by letters; write \\${word}.`,
            `\\\\${word}`,
          );
        }
      }
      if (!CONTROL_SYMBOLS.has(next)) {
        issue(
          "unknown-symbol",
          i,
          `\\${next} is not in ZAM's formula inventory.`,
          `\\${next}`,
        );
      }
      tokens.push({ kind: "symbol", char: next, offset: i });
      i += 2;
      continue;
    }
    switch (char) {
      case "$":
        issue("dollar", i, "A formula must not contain a dollar sign.", "$");
        break;
      case "%":
        issue(
          "comment",
          i,
          "A bare % starts a TeX comment; write \\% for a percent sign.",
          "%",
        );
        break;
      case "#":
        issue(
          "parameter",
          i,
          "A bare # is a macro parameter; write \\# for the sign.",
          "#",
        );
        break;
      case "{":
        depth++;
        tokens.push({ kind: "open", offset: i });
        break;
      case "}":
        depth--;
        if (depth < 0) {
          issue(
            "unbalanced-braces",
            i,
            "A closing brace has no opening one.",
            "}",
          );
          depth = 0;
        }
        tokens.push({ kind: "close", offset: i });
        break;
      case "^":
        tokens.push({ kind: "sup", offset: i });
        break;
      case "_":
        tokens.push({ kind: "sub", offset: i });
        break;
      case "&":
        // A column separator outside an environment is a TeX error the
        // renderer refuses; `\&` is the ampersand sign.
        if (environments.length === 0) {
          issue(
            "stray-alignment",
            i,
            "A bare & separates columns and only works inside an environment; write \\& for the sign.",
            "&",
          );
        }
        tokens.push({ kind: "align", offset: i });
        break;
      default:
        tokens.push({ kind: "char", char, offset: i });
    }
    i++;
  }
  if (depth > 0) {
    issue(
      "unbalanced-braces",
      tex.length,
      `${depth} opening brace${depth === 1 ? " is" : "s are"} never closed.`,
    );
  }
  for (const open of environments) {
    issue(
      "unbalanced-environment",
      open.offset,
      `\\begin{${open.env}} is never closed.`,
      open.env,
    );
  }
  // `x^`, `x_` and `\not` need something to act on (`3 \not \in A`).
  tokens.forEach((token, index) => {
    const needsOperand =
      token.kind === "sup" ||
      token.kind === "sub" ||
      (token.kind === "word" && token.name === "not");
    if (!needsOperand) return;
    let next = index + 1;
    while (
      tokens[next]?.kind === "char" &&
      /\s/.test((tokens[next] as { char: string }).char)
    ) {
      next++;
    }
    const operand = tokens[next];
    if (
      !operand ||
      operand.kind === "close" ||
      operand.kind === "align" ||
      operand.kind === "end" ||
      operand.kind === "sup" ||
      operand.kind === "sub"
    ) {
      const written =
        token.kind === "word" ? "\\not" : token.kind === "sup" ? "^" : "_";
      issue(
        "missing-operand",
        token.offset,
        `${written} needs something after it.`,
        written,
      );
    }
  });
  return { tokens, issues };
}

/** Every reason to refuse `tex`; empty when the formula is acceptable. */
export function texIssues(tex: string): TexIssue[] {
  return tokenizeTex(tex).issues;
}
