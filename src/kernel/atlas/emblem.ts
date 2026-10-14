/**
 * The Sinnbild validator (ADR 2026-10-13, Decision 6).
 *
 * A Sinnbild is a small SVG (`viewBox="0 0 64 64"`) plus an optional glyph of
 * up to 16 characters. Agents and curators write them, so they are untrusted
 * content (ADR 2026-10-08b): every path that stores one runs this validator.
 *
 * - The SVG is read by a small tokenizer of its own into a tree, and the tree
 *   is checked against an allowlist of plain shapes, text and presentation
 *   attributes. A regular expression over the source is not enough.
 * - What is stored and shown is `canonical`: the validator's re-serialisation
 *   of the allowed tree, with attributes in a fixed order and text escaped.
 *   Never the input, so a difference between this parser and a browser's
 *   cannot slip through.
 * - Surfaces show the canonical form only as an image (`emblemDataUrl`), never
 *   as markup, and the glyph only as text.
 *
 * Pure: no database, no Node built-ins. The Studio imports it directly.
 */

/** Raised whenever the rules tighten; stored rows record the version. */
export const EMBLEM_VALIDATOR_VERSION = 1;
export const EMBLEM_MAX_CHARS = 6000;
export const GLYPH_MAX_CHARS = 16;

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX = [0, 0, 64, 64];
const MAX_DEPTH = 24;
const MAX_ELEMENTS = 400;

const ELEMENTS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
]);

/** Which elements each element may contain; text marks character data. */
const CHILDREN: Readonly<Record<string, ReadonlySet<string>>> = {
  svg: new Set(
    [...ELEMENTS].filter((name) => name !== "svg" && name !== "tspan"),
  ),
  g: new Set(
    [...ELEMENTS].filter((name) => name !== "svg" && name !== "tspan"),
  ),
  text: new Set(["tspan", "#text"]),
  tspan: new Set(["#text"]),
};

/** Allowed attributes, in the canonical order. */
const ATTRIBUTES = [
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "transform",
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "opacity",
  "font-size",
  "font-weight",
  "text-anchor",
] as const;
const ATTRIBUTE_SET = new Set<string>(ATTRIBUTES);
/** Geometry has no meaning on the root; its size may be given. */
const ROOT_FORBIDDEN = new Set([
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "transform",
]);

/**
 * Characters an attribute value may hold: numbers, path commands, colour
 * names and `#hex`, `rgb(…)`, `rotate(…)` and the like. No quotes, no `<`,
 * no `:` and no `/`, so no URL of any kind.
 */
const VALUE_CHARS = /^[A-Za-z0-9 .,#%()+-]*$/;
const NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*/;
const ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
};
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what it rejects.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export type EmblemValidation =
  | { ok: true; canonical: string; glyph: string | null }
  | { ok: false; error: string };

interface ElementNode {
  name: string;
  attrs: Map<string, string>;
  children: Array<ElementNode | string>;
}

class EmblemSyntaxError extends Error {}

function fail(message: string): never {
  throw new EmblemSyntaxError(message);
}

/** Decode the four allowed entities; any other `&` is refused. */
function decode(raw: string): string {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    const amp = raw.indexOf("&", i);
    if (amp < 0) {
      out += raw.slice(i);
      break;
    }
    out += raw.slice(i, amp);
    const entity = Object.keys(ENTITIES).find((e) => raw.startsWith(e, amp));
    if (!entity) fail("Only &amp; &lt; &gt; and &quot; may appear after &.");
    out += ENTITIES[entity];
    i = amp + entity.length;
  }
  return out;
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return escapeText(text).replace(/"/g, "&quot;");
}

/** The SVG's element tree, or a thrown EmblemSyntaxError. */
function parse(source: string): ElementNode {
  let input = source.trim();
  // A leading XML declaration carries nothing; it is dropped.
  const declaration = /^<\?xml\s[^<>?]*\?>/.exec(input);
  if (declaration) input = input.slice(declaration[0].length).trimStart();
  if (input.includes("<!")) {
    fail(
      "Doctype, entity declarations, comments and CDATA (<!…) are not allowed.",
    );
  }
  if (input.includes("<?"))
    fail("Processing instructions (<?…) are not allowed.");

  const stack: ElementNode[] = [];
  let root: ElementNode | null = null;
  let count = 0;
  let i = 0;
  while (i < input.length) {
    if (input.startsWith("</", i)) {
      const match = NAME.exec(input.slice(i + 2));
      if (!match) fail("A closing tag has no name.");
      let j = i + 2 + match[0].length;
      while (/\s/.test(input[j] ?? "")) j++;
      if (input[j] !== ">")
        fail(`The closing tag </${match[0]}> is malformed.`);
      const open = stack.pop();
      if (!open || open.name !== match[0]) {
        fail(`</${match[0]}> does not close the open element.`);
      }
      i = j + 1;
      continue;
    }
    if (input[i] === "<") {
      const match = NAME.exec(input.slice(i + 1));
      if (!match) fail("A tag has no name.");
      const name = match[0];
      if (/^on/i.test(name) || !ELEMENTS.has(name)) {
        fail(`The element <${name}> is not allowed.`);
      }
      const node: ElementNode = { name, attrs: new Map(), children: [] };
      let j = i + 1 + name.length;
      let selfClosing = false;
      for (;;) {
        const spaced = /^\s+/.exec(input.slice(j));
        if (spaced) j += spaced[0].length;
        if (input.startsWith("/>", j)) {
          selfClosing = true;
          j += 2;
          break;
        }
        if (input[j] === ">") {
          j += 1;
          break;
        }
        if (!spaced) fail(`The tag <${name}> is malformed.`);
        const attr = NAME.exec(input.slice(j));
        if (!attr) fail(`The tag <${name}> is malformed.`);
        const attrName = attr[0];
        j += attrName.length;
        while (/\s/.test(input[j] ?? "")) j++;
        if (input[j] !== "=") fail(`The attribute ${attrName} has no value.`);
        j++;
        while (/\s/.test(input[j] ?? "")) j++;
        const quote = input[j];
        if (quote !== '"' && quote !== "'") {
          fail(`The value of ${attrName} must be quoted.`);
        }
        const end = input.indexOf(quote, j + 1);
        if (end < 0) fail(`The value of ${attrName} is not closed.`);
        const raw = input.slice(j + 1, end);
        if (raw.includes("<")) fail(`The value of ${attrName} contains <.`);
        if (node.attrs.has(attrName))
          fail(`The attribute ${attrName} appears twice.`);
        node.attrs.set(attrName, decode(raw));
        j = end + 1;
      }
      const parent = stack[stack.length - 1];
      if (parent) {
        if (!CHILDREN[parent.name]?.has(name)) {
          fail(`<${name}> is not allowed inside <${parent.name}>.`);
        }
        parent.children.push(node);
      } else {
        if (root) fail("An SVG has exactly one root element.");
        if (name !== "svg") fail("The root element must be <svg>.");
        root = node;
      }
      count += 1;
      if (count > MAX_ELEMENTS)
        fail(`At most ${MAX_ELEMENTS} elements are allowed.`);
      if (!selfClosing) {
        stack.push(node);
        if (stack.length > MAX_DEPTH)
          fail("The elements are nested too deeply.");
      }
      i = j;
      continue;
    }
    const next = input.indexOf("<", i);
    const raw = input.slice(i, next < 0 ? input.length : next);
    const text = decode(raw);
    const parent = stack[stack.length - 1];
    if (text.trim() !== "") {
      if (!parent || !CHILDREN[parent.name]?.has("#text")) {
        fail("Text is allowed only inside <text> and <tspan>.");
      }
      if (CONTROL.test(text)) fail("Text contains control characters.");
    }
    if (parent && CHILDREN[parent.name]?.has("#text")) {
      const collapsed = text.replace(/\s+/g, " ");
      if (collapsed !== "") parent.children.push(collapsed);
    }
    i = next < 0 ? input.length : next;
  }
  if (stack.length > 0)
    fail(`<${stack[stack.length - 1].name}> is not closed.`);
  if (!root) fail("There is no <svg> element.");
  return root;
}

function checkValue(element: string, name: string, value: string): string {
  const normalised = value.replace(/\s+/g, " ").trim();
  if (!VALUE_CHARS.test(normalised)) {
    fail(
      `The value of ${name} on <${element}> holds characters that are not allowed.`,
    );
  }
  const compact = normalised.toLowerCase().replace(/\s/g, "");
  if (
    compact.includes("url(") ||
    compact.includes("data:") ||
    compact.includes("javascript:")
  ) {
    fail(
      `The value of ${name} on <${element}> refers to something outside the image.`,
    );
  }
  return normalised;
}

function checkRoot(root: ElementNode): void {
  const xmlns = root.attrs.get("xmlns");
  if (xmlns !== undefined && xmlns.trim() !== SVG_NS) {
    fail(`xmlns must be ${SVG_NS}.`);
  }
  const viewBox = root.attrs.get("viewBox");
  const numbers =
    viewBox
      ?.trim()
      .split(/[\s,]+/)
      .map(Number) ?? [];
  if (
    numbers.length !== 4 ||
    numbers.some((n, index) => n !== VIEWBOX[index])
  ) {
    fail('The root needs viewBox="0 0 64 64".');
  }
  for (const size of ["width", "height"]) {
    const value = root.attrs.get(size);
    if (value === undefined) continue;
    const match = /^\s*(\d+(?:\.\d+)?)(px)?\s*$/.exec(value);
    if (!match || Number(match[1]) <= 0 || Number(match[1]) > 64) {
      fail(`${size} on the root must be at most 64.`);
    }
  }
}

function checkAttributes(node: ElementNode, isRoot: boolean): void {
  for (const [name, value] of node.attrs) {
    if (/^on/i.test(name))
      fail(`Event attributes such as ${name} are not allowed.`);
    if (isRoot && (name === "xmlns" || name === "viewBox")) continue;
    if (!ATTRIBUTE_SET.has(name)) {
      fail(`The attribute ${name} is not allowed on <${node.name}>.`);
    }
    if (isRoot && ROOT_FORBIDDEN.has(name)) {
      fail(`The attribute ${name} is not allowed on the root.`);
    }
    node.attrs.set(name, checkValue(node.name, name, value));
  }
  for (const child of node.children) {
    if (typeof child !== "string") checkAttributes(child, false);
  }
}

function serialise(node: ElementNode, isRoot: boolean): string {
  let attrs = "";
  if (isRoot) attrs += ` xmlns="${SVG_NS}" viewBox="0 0 64 64"`;
  for (const name of ATTRIBUTES) {
    const value = node.attrs.get(name);
    if (value !== undefined) attrs += ` ${name}="${escapeAttr(value)}"`;
  }
  if (node.children.length === 0) return `<${node.name}${attrs}/>`;
  const inner = node.children
    .map((child) =>
      typeof child === "string" ? escapeText(child) : serialise(child, false),
    )
    .join("");
  return `<${node.name}${attrs}>${inner}</${node.name}>`;
}

/** The glyph, trimmed; null when empty; an error string when not allowed. */
export function validateGlyph(
  glyph: string | null | undefined,
): { ok: true; glyph: string | null } | { ok: false; error: string } {
  const text = (glyph ?? "").trim();
  if (text === "") return { ok: true, glyph: null };
  if ([...text].length > GLYPH_MAX_CHARS) {
    return {
      ok: false,
      error: `A glyph has at most ${GLYPH_MAX_CHARS} characters.`,
    };
  }
  if (/[<>]/.test(text) || CONTROL.test(text) || /[\n\r\t]/.test(text)) {
    return {
      ok: false,
      error: "A glyph is plain text: no markup, no line breaks.",
    };
  }
  return { ok: true, glyph: text };
}

/**
 * Check a Sinnbild and return its canonical form, the only form any path may
 * store or show.
 */
export function validateEmblem(
  svg: string,
  glyph?: string | null,
): EmblemValidation {
  const checkedGlyph = validateGlyph(glyph);
  if (!checkedGlyph.ok) return checkedGlyph;
  if (typeof svg !== "string" || svg.trim() === "") {
    return { ok: false, error: "The Sinnbild has no SVG." };
  }
  if (svg.length > EMBLEM_MAX_CHARS) {
    return {
      ok: false,
      error: `A Sinnbild has at most ${EMBLEM_MAX_CHARS} characters.`,
    };
  }
  try {
    const root = parse(svg);
    checkRoot(root);
    checkAttributes(root, true);
    const canonical = serialise(root, true);
    if (canonical.length > EMBLEM_MAX_CHARS) {
      return {
        ok: false,
        error: `A Sinnbild has at most ${EMBLEM_MAX_CHARS} characters.`,
      };
    }
    return { ok: true, canonical, glyph: checkedGlyph.glyph };
  } catch (error) {
    if (error instanceof EmblemSyntaxError)
      return { ok: false, error: error.message };
    throw error;
  }
}

/** A Sinnbild that shows just the glyph, for a learner who types one. */
export function glyphEmblemSvg(glyph: string): string {
  const length = [...glyph].length;
  const size = length <= 2 ? 40 : length <= 4 ? 26 : length <= 8 ? 15 : 9;
  const y = Math.round(32 + size * 0.35);
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 64 64"><text x="32" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" fill="#1d2b4f">${escapeText(glyph)}</text></svg>`;
}

/** `data:image/svg+xml;base64,…` of a canonical Sinnbild, for `<img>` and canvas. */
export function emblemDataUrl(canonical: string): string {
  const bytes = new TextEncoder().encode(canonical);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}
