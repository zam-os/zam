import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import temml from "temml";
import { describe, expect, it } from "vitest";
import {
  isSafeMathTree,
  type MathNodeLike,
  temmlOptions,
} from "../../desktop/src/math-render.js";
import { liftDollarMath } from "../../src/kernel/library/dollar-lift.js";
import { texIssues } from "../../src/kernel/library/tex-tokenizer.js";

/**
 * Just enough XML parsing to turn Temml's `renderToString` output into the
 * node shape the checker walks. In the Studio the checker walks real DOM
 * nodes built by `temml.render`; both come from the same MathML tree.
 */
function parseMathMarkup(markup: string): MathNodeLike {
  const root: MathNodeLike & { children: MathNodeLike[] } = {
    localName: "#root",
    attributes: [],
    children: [],
  };
  const stack: Array<MathNodeLike & { children: MathNodeLike[] }> = [root];
  for (const match of markup.matchAll(
    /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g,
  )) {
    const [, closing, name, rawAttributes, selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const attributes = [...rawAttributes.matchAll(/([\w:-]+)="([^"]*)"/g)].map(
      ([, attrName, value]) => ({ name: attrName, value }),
    );
    const node = {
      localName: name,
      attributes,
      children: [] as MathNodeLike[],
    };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) stack.push(node);
  }
  return root.children[0];
}

const render = (tex: string, block = false) =>
  parseMathMarkup(temml.renderToString(tex, temmlOptions(block)));

describe("temmlOptions", () => {
  it("is an object without a prototype, so pollution cannot add trust", () => {
    const options = temmlOptions(false);
    expect(Object.getPrototypeOf(options)).toBeNull();
    const prototype = Object.prototype as Record<string, unknown>;
    prototype.trust = true;
    try {
      expect(options.trust).toBe(false);
      expect(Object.keys(options)).toContain("trust");
    } finally {
      delete prototype.trust;
    }
  });

  it("throws on an error instead of rendering it in red", () => {
    expect(() =>
      temml.renderToString("\\frac{a}{", temmlOptions(false)),
    ).toThrow();
  });
});

describe("isSafeMathTree", () => {
  it("accepts Temml's output for every bundled formula", () => {
    const dir = join(process.cwd(), "tests/fixtures/curriculum");
    const refused: string[] = [];
    let checked = 0;
    for (const file of readdirSync(dir).filter((f) =>
      f.endsWith("-kvt.json"),
    )) {
      const tile = JSON.parse(readFileSync(join(dir, file), "utf-8"));
      for (const atom of tile.atoms) {
        for (const item of atom.practice_items) {
          for (const field of ["question", "concept", "sample_solution"]) {
            const text = item[field];
            if (typeof text !== "string") continue;
            for (const segment of liftDollarMath(text, "strict").segments) {
              if (segment.type !== "math") continue;
              if (texIssues(segment.tex).length > 0) continue;
              checked++;
              const tree = render(segment.tex, segment.block === true);
              if (!isSafeMathTree(tree)) refused.push(segment.tex.slice(0, 60));
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(6000);
    expect(refused).toEqual([]);
  });

  it("refuses links, event handlers, foreign elements and stray styles", () => {
    const math = (inner: string, attrs = "") =>
      parseMathMarkup(`<math${attrs}>${inner}</math>`);
    expect(isSafeMathTree(math("<mi>x</mi>"))).toBe(true);
    expect(isSafeMathTree(math('<mi href="javascript:alert(1)">x</mi>'))).toBe(
      false,
    );
    expect(isSafeMathTree(math('<mi onclick="alert(1)">x</mi>'))).toBe(false);
    expect(
      isSafeMathTree(
        math(
          '<semantics><mi>x</mi><annotation-xml encoding="text/html"><b>x</b></annotation-xml></semantics>',
        ),
      ),
    ).toBe(false);
    expect(isSafeMathTree(math("<mi>x</mi><img/>"))).toBe(false);
    expect(
      isSafeMathTree(
        math('<mi style="background:url(https://x.test/t)">x</mi>'),
      ),
    ).toBe(false);
    expect(isSafeMathTree(math('<mi class="evil">x</mi>'))).toBe(false);
    expect(isSafeMathTree(math('<mi class="tml-med-pad">x</mi>'))).toBe(true);
    expect(
      isSafeMathTree(
        math('<mtd style="padding-left:0em;padding-right:1em;">x</mtd>'),
      ),
    ).toBe(true);
  });
});
