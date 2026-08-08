/**
 * Entry point.
 *
 * `main.ts` looks its elements up at module scope, which means a markup
 * mismatch throws before anything is wired and leaves an app that paints
 * correctly and responds to nothing. Loading it through a dynamic import
 * makes that failure catchable, so it becomes a sentence on screen instead of
 * a mystery. `tests/mobile/dom-contract.test.ts` is what stops it happening;
 * this is what makes it legible if it ever does.
 */

import { showBootFailure } from "./ui/nav.js";
import "./ui/tokens.css";
import "./ui/components.css";

import("./main.js").catch((error: unknown) => {
  console.error("ZAM failed to start", error);
  showBootFailure(error);
});
