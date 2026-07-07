/**
 * CLI entry — a bootstrap that stays loadable even when node_modules or the
 * build is broken (ADR 2026-07-07). The real program lives in ./app.js; this
 * bundle depends only on Node builtins so it can diagnose and heal a broken
 * dependency tree instead of crashing before it can help.
 */
await import("./app.js");

// Empty export: with zero static imports, TS would otherwise treat this file
// as a script rather than a module, which disallows the top-level await
// above (TS1375). Zero runtime effect; `npm run typecheck` catches this.
export {};
