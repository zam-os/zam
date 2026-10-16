import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build, type Rollup } from "vite";
import { afterAll, describe, expect, it } from "vitest";
import { temmlSurrogates } from "../../desktop/vite-temml-surrogates.js";

/**
 * Vitest runs Temml unbundled, so the other tests cannot see what the
 * bundler does to it. Vite 8 printed the lexer's surrogate class as U+FFFD
 * plus `d800`, and every multi-letter command failed in every shipped
 * build (PR #412 review, B1). This bundles Temml as the builds do, with the
 * fix, and runs the bundle.
 */

const dir = mkdtempSync(join(tmpdir(), "zam-temml-bundle-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

async function bundledTemml(): Promise<{
  renderToString(tex: string, options?: object): string;
}> {
  const temmlEsm = createRequire(import.meta.url)
    .resolve("temml")
    .replace(/temml\.(c?js)$/, "temml.mjs");
  const entry = join(dir, "entry.mjs");
  writeFileSync(entry, 'export { default } from "temml";\n');
  const output = (await build({
    configFile: false,
    logLevel: "silent",
    root: dir,
    plugins: [temmlSurrogates()],
    resolve: { alias: { temml: temmlEsm } },
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ["es"], fileName: "temml-bundle" },
    },
  })) as Rollup.RollupOutput[] | Rollup.RollupOutput;
  const chunk = (Array.isArray(output) ? output[0] : output).output.find(
    (item): item is Rollup.OutputChunk => item.type === "chunk",
  );
  if (!chunk) throw new Error("no chunk");
  expect(chunk.code).not.toContain("�d800");
  const file = join(dir, "temml-bundle.mjs");
  writeFileSync(file, chunk.code);
  return (await import(pathToFileURL(file).href)).default;
}

describe("Temml in a bundle", () => {
  it("still lexes multi-letter commands", async () => {
    const temml = await bundledTemml();
    for (const tex of [
      "\\frac{1}{2}",
      "W_{\\text{el}} = \\frac{1}{2} C U^2",
      "\\sqrt{2}",
      "\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}",
    ]) {
      expect(() =>
        temml.renderToString(tex, { throwOnError: true }),
      ).not.toThrow();
    }
    expect(temml.renderToString("\\frac{1}{2}")).toContain("<mfrac>");
  }, 60_000);
});
