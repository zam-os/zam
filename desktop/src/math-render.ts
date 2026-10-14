/**
 * Formulas on screen (ADR 2026-10-14b, Decision 3).
 *
 * A math segment's TeX has already passed the kernel's fail-closed tokenizer
 * when it reaches this module; Temml turns it into MathML, and the browser
 * typesets it. Three lines of defence stay in place anyway, because library
 * content is untrusted (ADR 2026-10-08b):
 *
 * - **The options** are an object without a prototype, every security
 *   setting an own property, so a polluted `Object.prototype` cannot supply
 *   `trust` (the KaTeX advisory CVE-2026-103923 class).
 * - **`throwOnError: true`**: with `false`, Temml renders the error in red
 *   and returns normally. ZAM wants the throw, to show the plain form.
 * - **The output is checked before it enters the document.** Temml builds
 *   DOM nodes with `createElementNS` (no HTML string is parsed), into a
 *   detached element; every element and attribute of the result must be on
 *   the lists below. Anything else falls back to the plain form.
 *
 * Temml (pinned to exactly 0.13.5: 0.14.0 changes `\prescript`) is loaded on
 * the first formula, so a session without one never pays for it.
 *
 * Framework-free and used by Studio, Mobile and the recall panel alike.
 */

/** MathML Core presentation elements Temml may produce. */
const ELEMENTS: ReadonlySet<string> = new Set([
  "math",
  "mrow",
  "mi",
  "mn",
  "mo",
  "mtext",
  "ms",
  "mspace",
  "mfrac",
  "msqrt",
  "mroot",
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mprescripts",
  "none",
  "mtable",
  "mtr",
  "mtd",
  "mstyle",
  "mpadded",
  "mphantom",
  "menclose",
]);

/** Presentation attributes; nothing that links, scripts or loads. */
const ATTRIBUTES: ReadonlySet<string> = new Set([
  "accent",
  "accentunder",
  "alttext",
  "class",
  "columnalign",
  "columnlines",
  "columnspacing",
  "depth",
  "dir",
  "display",
  "displaystyle",
  "fence",
  "form",
  "height",
  "largeop",
  "linebreak",
  "linethickness",
  "lspace",
  "mathvariant",
  "maxsize",
  "minsize",
  "movablelimits",
  "notation",
  "rowlines",
  "rowspacing",
  "rspace",
  "scriptlevel",
  "separator",
  "stretchy",
  "style",
  "symmetric",
  "voffset",
  "width",
]);

/** Temml's own class names (`tml-…`, WebKit/Chromium fix-ups, font classes). */
const CLASS_TOKEN = /^(?:(?:tml|wbk|chr)-[a-z0-9-]+|mathcal|mathscr)$/;

/** The style properties Temml writes for spacing, borders and depth. */
const STYLE_PROPERTIES: ReadonlySet<string> = new Set([
  "display",
  "math-depth",
  "math-style",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
  "border-top",
  "border-bottom",
  "border-left",
  "border-right",
  "width",
  "height",
  "vertical-align",
  "margin-left",
  "margin-right",
  "text-align",
]);

const STYLE_VALUE = /^[a-z0-9.\s%-]+$/i;

/** What the checker needs of a node: a DOM element, or a test double. */
export interface MathNodeLike {
  localName: string;
  attributes: ArrayLike<{ name: string; value: string }>;
  children: ArrayLike<MathNodeLike>;
}

function safeStyle(value: string): boolean {
  for (const declaration of value.split(";")) {
    if (!declaration.trim()) continue;
    const colon = declaration.indexOf(":");
    if (colon < 0) return false;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const rhs = declaration.slice(colon + 1).trim();
    if (!STYLE_PROPERTIES.has(property) || !STYLE_VALUE.test(rhs)) return false;
  }
  return true;
}

/**
 * True when every element and attribute of `node`'s tree is on the lists:
 * no `href`, no event handler, no `annotation-xml`, no foreign element, and
 * only Temml's own classes and spacing styles.
 */
export function isSafeMathTree(node: MathNodeLike): boolean {
  if (!ELEMENTS.has(node.localName)) return false;
  for (let i = 0; i < node.attributes.length; i++) {
    const { name, value } = node.attributes[i];
    const key = name.toLowerCase();
    if (!ATTRIBUTES.has(key)) return false;
    if (key === "class") {
      if (
        !value
          .split(/\s+/)
          .filter(Boolean)
          .every((t) => CLASS_TOKEN.test(t))
      ) {
        return false;
      }
    }
    if (key === "style" && !safeStyle(value)) return false;
  }
  for (let i = 0; i < node.children.length; i++) {
    if (!isSafeMathTree(node.children[i])) return false;
  }
  return true;
}

/** The renderer options, as own properties of a prototype-free object. */
export function temmlOptions(block: boolean): Record<string, unknown> {
  const options = Object.create(null) as Record<string, unknown>;
  options.displayMode = block;
  options.trust = false;
  options.throwOnError = true;
  options.strict = false;
  options.annotate = false;
  options.maxExpand = 100;
  options.maxSize = [20, 200];
  options.xml = false;
  return options;
}

interface TemmlModule {
  render(tex: string, element: Element, options: Record<string, unknown>): void;
}

let temml: Promise<TemmlModule> | null = null;

/** Load Temml and its stylesheet once, on the first formula. */
function loadTemml(): Promise<TemmlModule> {
  temml ??= Promise.all([
    import("temml"),
    import("temml/dist/Temml-Local.css").catch(() => undefined),
  ]).then(([module]) => {
    const loaded = module as unknown as TemmlModule & { default?: TemmlModule };
    return loaded.default ?? loaded;
  });
  return temml;
}

export interface RenderMathInput {
  tex: string;
  block?: boolean;
  /** Words to read the formula aloud: becomes MathML's `alttext`. */
  speech?: string;
}

/**
 * Typeset `input.tex` into `target`, replacing its content. The caller has
 * already put the formula's plain form there; when anything goes wrong it
 * simply stays. Resolves to whether MathML was shown.
 */
export async function renderMath(
  target: Element,
  input: RenderMathInput,
): Promise<boolean> {
  try {
    const engine = await loadTemml();
    const holder = target.ownerDocument.createElement("span");
    engine.render(input.tex, holder, temmlOptions(input.block === true));
    const maths = Array.from(holder.children);
    if (
      maths.length === 0 ||
      !maths.every(
        (math) =>
          math.localName === "math" &&
          isSafeMathTree(math as unknown as MathNodeLike),
      )
    ) {
      return false;
    }
    if (input.speech) {
      // Native MathML stays navigable; the authored words go into MathML's
      // own text alternative, never an aria-label that flattens the tree
      // (ADR Decision 4, Open question 1).
      for (const math of maths) math.setAttribute("alttext", input.speech);
    }
    target.replaceChildren(...maths);
    return true;
  } catch {
    return false;
  }
}
