#!/usr/bin/env node
/**
 * Builds the browsable knowledge-map prototype (ADR 2026-10-03) into one
 * self-contained HTML file: ZAM's own map, every view, no network access.
 *
 *   node scripts/build-knowledge-map-prototype.mjs [output.html]
 *
 * Default output: dist/knowledge-map-prototype.html. The file carries its own
 * <title> and styles but no <html>/<body> skeleton, so it can be published as
 * an Artifact as is; browsers open it locally too.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(
  process.argv[2] ?? resolve(repoRoot, "dist", "knowledge-map-prototype.html"),
);

const result = await build({
  entryPoints: [resolve(repoRoot, "desktop/src/knowledge-map/prototype.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  loader: { ".json": "json" },
  logLevel: "warning",
});
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const page = `<title>ZAM Knowledge Map</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Browsable prototype of ZAM's knowledge map: one statement per node, switchable views including C4.">
<style>
/* Layout: a slim intro bar above the map shell, full window width; on wide screens the map stage fills the
   window height below the bar (feedback scrolls into view under it). The shell stacks to one column below 860px. */
:root {
  --bg-deep-space: #f3f5fa;
  --bg-card-frosted: #ffffff;
  --bg-card-subtle: #eef1f8;
  --bg-field: #ffffff;
  --border-soft: rgba(30, 34, 64, 0.13);
  --clr-text-primary: #151a2d;
  --clr-text-secondary: #343c55;
  --clr-text-muted: #545c74;
  --clr-accent-purple: #4f46c8;
  --clr-on-accent: #ffffff;
  --font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-deep-space: #0c0e16;
    --bg-card-frosted: #151826;
    --bg-card-subtle: #10131e;
    --bg-field: #1b1f30;
    --border-soft: rgba(214, 220, 255, 0.13);
    --clr-text-primary: #eceffa;
    --clr-text-secondary: #c7cce0;
    --clr-text-muted: #9aa1ba;
    --clr-accent-purple: #a5a0ff;
    --clr-on-accent: #14122e;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg-deep-space: #0c0e16;
  --bg-card-frosted: #151826;
  --bg-card-subtle: #10131e;
  --bg-field: #1b1f30;
  --border-soft: rgba(214, 220, 255, 0.13);
  --clr-text-primary: #eceffa;
  --clr-text-secondary: #c7cce0;
  --clr-text-muted: #9aa1ba;
  --clr-accent-purple: #a5a0ff;
  --clr-on-accent: #14122e;
  color-scheme: dark;
}
html, body { min-height: 100%; }
body {
  background: var(--bg-deep-space);
  color: var(--clr-text-primary);
  font-family: var(--font-family);
  font-size: 15px;
  padding-inline: 16px;
  padding-block: 14px 24px;
  box-sizing: border-box;
}
.proto-wrap { display: flex; flex-direction: column; gap: 14px; }
#proto-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; }
.proto-intro { margin: 0; flex: 1 1 320px; min-width: 0; color: var(--clr-text-secondary); font-size: 0.9rem; line-height: 1.45; max-width: 90ch; }
.proto-intro strong { color: var(--clr-accent-purple); margin-right: 4px; letter-spacing: 0.03em; text-transform: uppercase; font-size: 0.78rem; }
.proto-lang { display: inline-flex; border: 1px solid var(--border-soft); border-radius: 10px; overflow: hidden; }
.proto-lang button { border: 0; background: transparent; color: var(--clr-text-primary); font: inherit; font-size: 0.82rem; padding: 5px 10px; cursor: pointer; }
.proto-lang button[aria-pressed="true"] { background: var(--clr-accent-purple); color: var(--clr-on-accent); }
.proto-lang button:focus-visible { outline: 2px solid var(--clr-accent-purple); outline-offset: 2px; }
#app { min-width: 0; }
/* The shell clamps its stage to 70vh / 760px so it fits inside the Studio; a page of its own can use the
   whole window. 200px is everything above the stage (page padding, intro bar, header, breadcrumbs, gaps)
   plus a bottom margin, sized for the German intro, which wraps to three lines where the English one takes two. */
@media (min-width: 861px) {
  #app .km-body { --km-stage-h: max(460px, calc(100vh - 200px)); }
}

</style>
<div class="proto-wrap">
  <div id="proto-bar"></div>
  <div id="app"></div>
</div>
<script>${script}</script>
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, page, "utf8");
console.log(`${output} (${Math.round(page.length / 1024)} KB)`);
