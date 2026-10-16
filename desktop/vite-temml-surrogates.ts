import type { Plugin } from "vite";

/**
 * Temml 0.13.5 builds its lexer's regular expressions from string literals
 * that hold lone UTF-16 surrogates (`"[\uD800-\uDBFF][\uDC00-\uDFFF]"`).
 * Vite 8's bundler prints such a literal as U+FFFD followed by the text
 * `d800`, which turns the class into a range from `0` to U+FFFD: every
 * multi-letter command (`\frac`, `\text`, `\sqrt`) then fails to lex, and
 * every formula falls back to its plain form (PR #412 review).
 *
 * The fix hands the escapes to the RegExp constructor instead: the two
 * literals are rewritten with `\\u` so the string holds the escape text,
 * which the pattern reads as the same code units. The rewrite is exact and
 * fails the build when the literals change, so a Temml upgrade is checked
 * again (the version is pinned for that reason).
 */
const LITERALS: Array<[string, string]> = [
  [String.raw`"\\\\[^\uD800-\uDFFF]"`, String.raw`"\\\\[^\\uD800-\\uDFFF]"`],
  [
    String.raw`"|[\uD800-\uDBFF][\uDC00-\uDFFF]"`,
    String.raw`"|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]"`,
  ],
];

const TEMML_ESM = /[\\/]temml[\\/]dist[\\/]temml\.mjs$/;

export function temmlSurrogates(): Plugin {
  return {
    name: "zam:temml-surrogates",
    enforce: "pre",
    transform(code, id) {
      if (!TEMML_ESM.test(id.split("?")[0])) return null;
      let fixed = code;
      for (const [from, to] of LITERALS) {
        if (!fixed.includes(from)) {
          throw new Error(
            `zam:temml-surrogates: Temml's lexer literal ${from} changed; re-check the surrogate fix before upgrading Temml.`,
          );
        }
        fixed = fixed.replace(from, to);
      }
      return { code: fixed, map: null };
    },
  };
}
