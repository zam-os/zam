/**
 * Entry point.
 *
 * `main.ts` looks its elements up at module scope, which means a markup
 * mismatch throws before anything is wired and leaves an app that paints
 * correctly and responds to nothing. Loading it through a dynamic import
 * makes that failure catchable, so it becomes a sentence on screen instead of
 * a mystery. `tests/mobile/dom-contract.test.ts` is what stops it happening;
 * this is what makes it legible if it ever does.
 *
 * The stylesheets are linked from `index.html`, the way the desktop does it,
 * rather than imported here. That keeps the app free of Vite's ambient
 * `*.css` module types — TypeScript rejects a side-effect import it has no
 * declaration for (TS2882) — and means the boot-failure screen is styled even
 * when the module graph never loads at all.
 */

import { showBootFailure } from "./ui/nav.js";

import("./main.js").catch((error: unknown) => {
  console.error("ZAM failed to start", error);
  showBootFailure(error);
});
