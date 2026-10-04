/**
 * Styles for the knowledge-map shell and views, injected once at mount so the
 * Studio and the standalone prototype need no extra stylesheet. Colours fall
 * back from the Studio's theme tokens to plain values.
 */

const STYLE_ID = "km-styles";

const CSS = `
.km-root {
  --km-bg: var(--bg-card-frosted, #ffffff);
  --km-surface: var(--bg-card-subtle, #f6f7fb);
  --km-card: var(--bg-field, #ffffff);
  --km-text: var(--clr-text-primary, #111827);
  --km-text-2: var(--clr-text-secondary, #334155);
  --km-muted: var(--clr-text-muted, #4b5563);
  --km-border: var(--border-soft, rgba(15, 23, 42, 0.12));
  --km-accent: var(--clr-accent-purple, hsl(246, 70%, 52%));
  --km-on-accent: var(--clr-on-accent, #ffffff);
  --km-accent-soft: rgba(91, 75, 219, 0.1);
  --km-edge: rgba(51, 65, 85, 0.35);
  --km-k-elaborates: #475569;
  --km-k-because: #6d28d9;
  --km-k-requires: #b45309;
  --km-k-leads_to: #0e7490;
  --km-k-instead_of: #be123c;
  --km-k-example: #15803d;
  --km-k-uses: #1d4ed8;
  --km-c4-person: #08427b;
  --km-c4-system: #1168bd;
  --km-c4-container: #2f75c0;
  --km-c4-component: #85bbf0;
  --km-c4-external: #6b7280;
  --km-c4-on: #ffffff;
  --km-c4-on-light: #0b2540;
  color: var(--km-text);
  font-family: var(--font-family, Inter, -apple-system, "Segoe UI", Roboto, sans-serif);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
}
:root[data-theme="dark"] .km-root {
  --km-accent-soft: rgba(167, 139, 250, 0.16);
  --km-k-uses: #93c5fd;
  --km-c4-person: #1f5aa0;
  --km-c4-system: #2b7bd0;
  --km-c4-container: #3f8ad8;
  --km-c4-component: #9cc8f3;
  --km-c4-external: #7b8494;
  --km-edge: rgba(203, 213, 225, 0.32);
  --km-k-elaborates: #cbd5e1;
  --km-k-because: #c4b5fd;
  --km-k-requires: #fcd34d;
  --km-k-leads_to: #67e8f9;
  --km-k-instead_of: #fda4af;
  --km-k-example: #86efac;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .km-root {
    --km-accent-soft: rgba(167, 139, 250, 0.16);
    --km-k-uses: #93c5fd;
    --km-c4-person: #1f5aa0;
    --km-c4-system: #2b7bd0;
    --km-c4-container: #3f8ad8;
    --km-c4-component: #9cc8f3;
    --km-c4-external: #7b8494;
    --km-edge: rgba(203, 213, 225, 0.32);
    --km-k-elaborates: #cbd5e1;
    --km-k-because: #c4b5fd;
    --km-k-requires: #fcd34d;
    --km-k-leads_to: #67e8f9;
    --km-k-instead_of: #fda4af;
    --km-k-example: #86efac;
  }
}
.km-root button { font: inherit; color: inherit; }
.km-root :focus-visible { outline: 2px solid var(--km-accent); outline-offset: 2px; }
.km-header { display: flex; flex-direction: column; gap: 8px; }
.km-titlebar { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
.km-title { font-size: 1.15rem; font-weight: 650; display: flex; align-items: center; gap: 8px; }
.km-badge { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px; background: var(--km-accent-soft); color: var(--km-accent); }
.km-question { color: var(--km-muted); font-size: 0.92rem; flex: 1 1 260px; }
.km-switcher { display: inline-flex; border: 1px solid var(--km-border); border-radius: 10px; overflow: hidden; }
.km-switcher button { border: 0; background: transparent; padding: 6px 12px; cursor: pointer; font-size: 0.88rem; }
.km-switcher button[aria-pressed="true"] { background: var(--km-accent); color: var(--km-on-accent); }
.km-view-label { font-size: 0.85rem; color: var(--km-muted); }
.km-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 0.85rem; min-height: 28px; }
.km-crumbs .km-crumb { border: 0; background: transparent; cursor: pointer; padding: 3px 6px; border-radius: 6px;
  color: var(--km-text-2); max-width: 22ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.km-crumbs .km-crumb:hover { background: var(--km-accent-soft); }
.km-crumbs .km-crumb[aria-current="true"] { color: var(--km-text); font-weight: 600; }
.km-crumb-sep { color: var(--km-muted); }
.km-back { border: 1px solid var(--km-border); background: var(--km-card); border-radius: 8px; padding: 3px 10px;
  cursor: pointer; margin-right: 6px; }
.km-back:disabled { opacity: 0.45; cursor: default; }
.km-body { --km-stage-h: clamp(460px, 70vh, 760px); display: grid; grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px; align-items: start; }
.km-stage { position: relative; height: var(--km-stage-h); border: 1px solid var(--km-border); border-radius: 14px;
  background: var(--km-surface); overflow: auto; }
.km-details { border: 1px solid var(--km-border); border-radius: 14px; background: var(--km-bg); padding: 14px;
  overflow: auto; display: flex; flex-direction: column; gap: 10px; max-height: var(--km-stage-h); box-sizing: border-box; }
.km-details h3, .km-details h4 { margin: 0; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--km-muted); font-weight: 600; }
.km-details-text { margin: 0; font-size: 1rem; line-height: 1.45; font-weight: 550; }
.km-sources, .km-sentences { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.km-sources a, .km-sources span { font-size: 0.85rem; color: var(--km-accent); word-break: break-all; }
.km-sources span { color: var(--km-text-2); }
.km-sentences button { width: 100%; text-align: left; border: 1px solid transparent; background: transparent;
  border-radius: 8px; padding: 6px 8px; cursor: pointer; line-height: 1.4; font-size: 0.9rem; }
.km-sentences button:hover { background: var(--km-accent-soft); border-color: var(--km-border); }
.km-conn { font-weight: 650; margin-right: 6px; white-space: nowrap; }
.km-k-elaborates { color: var(--km-k-elaborates); }
.km-k-because { color: var(--km-k-because); }
.km-k-requires { color: var(--km-k-requires); }
.km-k-leads_to { color: var(--km-k-leads_to); }
.km-k-instead_of { color: var(--km-k-instead_of); }
.km-k-example { color: var(--km-k-example); }
.km-k-uses { color: var(--km-k-uses); }
.km-feedback { border: 1px solid var(--km-border); border-radius: 14px; background: var(--km-bg); padding: 12px 14px;
  display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.km-feedback-group { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.km-feedback-label { font-size: 0.88rem; color: var(--km-text-2); margin-right: 4px; }
.km-chip { border: 1px solid var(--km-border); background: var(--km-card); border-radius: 999px; padding: 4px 11px;
  cursor: pointer; font-size: 0.86rem; min-width: 34px; }
.km-chip[aria-pressed="true"] { background: var(--km-accent); border-color: var(--km-accent); color: var(--km-on-accent); }
.km-feedback textarea { flex: 1 1 260px; min-height: 38px; resize: vertical; border: 1px solid var(--km-border);
  border-radius: 10px; background: var(--km-card); color: var(--km-text); padding: 7px 9px; font: inherit; font-size: 0.88rem; }
.km-primary { border: 0; background: var(--km-accent); color: var(--km-on-accent) !important; border-radius: 10px; padding: 7px 14px; cursor: pointer; }
.km-link { border: 0; background: transparent; color: var(--km-accent) !important; cursor: pointer; padding: 4px; font-size: 0.86rem; }
.km-status { font-size: 0.85rem; color: var(--km-muted); }
.km-notice { font-size: 0.88rem; color: var(--km-text-2); background: var(--km-accent-soft); border-radius: 10px; padding: 8px 12px; }
.km-error { white-space: pre-wrap; }

/* Focus map */
.km-focus { position: relative; width: 100%; height: 100%; min-height: 440px; }
.km-focus svg.km-edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.km-focus line { stroke: var(--km-edge); stroke-width: 1.6; }
.km-node { position: absolute; transform: translate(-50%, -50%); box-sizing: border-box; border-radius: 12px;
  border: 1px solid var(--km-border); background: var(--km-card); padding: 8px 10px; font-size: 0.84rem; line-height: 1.35;
  cursor: pointer; text-align: left; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06); }
.km-node:hover { border-color: var(--km-accent); }
.km-node.km-node-focus { cursor: default; font-size: 0.98rem; font-weight: 600; padding: 12px 14px;
  border: 2px solid var(--km-accent); box-shadow: 0 10px 30px rgba(91, 75, 219, 0.18); }
.km-node.km-node-overflow { font-weight: 600; color: var(--km-accent); text-align: center; }
.km-node { overflow-wrap: anywhere; }
.km-node .km-conn { display: block; margin: 0 0 2px; font-size: 0.74rem; letter-spacing: 0.02em; }
.km-node .km-node-meta { display: block; margin-top: 4px; font-size: 0.72rem; color: var(--km-muted); font-weight: 500; }
.km-edge-label { position: absolute; transform: translate(-50%, -50%); font-size: 0.74rem; font-weight: 650;
  padding: 2px 8px; border-radius: 999px; background: var(--km-bg); border: 1px solid var(--km-border);
  white-space: nowrap; pointer-events: none; }
.km-minimap { background: var(--km-surface); border: 1px solid var(--km-border); border-radius: 10px; padding: 4px; }
.km-minimap-title { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--km-muted); padding: 0 4px; }
.km-minimap svg { display: block; }
.km-minimap line { stroke: var(--km-edge); stroke-width: 0.8; }
.km-minimap circle { fill: var(--km-muted); opacity: 0.55; cursor: pointer; }
.km-minimap circle.km-mm-visited { fill: var(--km-accent); opacity: 0.45; }
.km-minimap circle.km-mm-path { fill: var(--km-accent); opacity: 0.9; }
.km-minimap circle.km-mm-focus { fill: var(--km-accent); opacity: 1; stroke: var(--km-bg); stroke-width: 1.5; }
.km-minimap line.km-mm-path { stroke: var(--km-accent); stroke-width: 1.6; }

/* Outline */
.km-outline { padding: 12px 14px; }
.km-outline ul { list-style: none; margin: 0; padding-left: 18px; }
.km-outline > ul { padding-left: 0; }
.km-ol-row { display: flex; align-items: flex-start; gap: 4px; border-radius: 8px; }
.km-ol-toggle { width: 22px; height: 22px; flex: 0 0 22px; border: 0; background: transparent; cursor: pointer;
  color: var(--km-muted); border-radius: 6px; margin-top: 3px; }
.km-ol-toggle[hidden] { visibility: hidden; display: inline-block; }
.km-ol-text { border: 0; background: transparent; text-align: left; cursor: pointer; padding: 4px 6px; border-radius: 6px;
  line-height: 1.4; font-size: 0.9rem; flex: 1; }
.km-ol-text:hover { background: var(--km-accent-soft); }
.km-ol-row.km-ol-current .km-ol-text { background: var(--km-accent-soft); font-weight: 600; box-shadow: inset 3px 0 0 var(--km-accent); }
.km-ol-count { font-size: 0.72rem; color: var(--km-muted); margin-left: 6px; white-space: nowrap; }
.km-ol-links { list-style: none; margin: 2px 0 6px 26px; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.km-ol-links button { border: 0; background: transparent; text-align: left; cursor: pointer; padding: 3px 6px;
  border-radius: 6px; font-size: 0.85rem; line-height: 1.35; color: var(--km-text-2); }
.km-ol-links button:hover { background: var(--km-accent-soft); }

/* Levels */
.km-levels { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.km-lv-top { display: flex; align-items: center; gap: 10px; }
.km-lv-theme { border: 2px solid var(--km-accent); background: var(--km-card); border-radius: 14px; padding: 14px 16px;
  font-size: 1.05rem; font-weight: 600; line-height: 1.4; }
.km-lv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.km-lv-card { border: 1px solid var(--km-border); background: var(--km-card); border-radius: 12px; padding: 12px;
  text-align: left; cursor: pointer; line-height: 1.4; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); }
.km-lv-card:hover { border-color: var(--km-accent); }
.km-lv-card.km-lv-current { border: 2px solid var(--km-accent); }
.km-lv-meta { font-size: 0.74rem; color: var(--km-muted); display: flex; gap: 10px; flex-wrap: wrap; }
.km-lv-up { border: 1px solid var(--km-border); background: var(--km-card); border-radius: 8px; padding: 5px 10px; cursor: pointer; }
.km-lv-up:disabled { opacity: 0.45; cursor: default; }
.km-lv-anim-in { animation: km-zoom-in 320ms ease-out; }
.km-lv-anim-out { animation: km-zoom-out 320ms ease-out; }
@keyframes km-zoom-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes km-zoom-out { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: none; } }
/* C4 architecture */
.km-c4 { padding: 14px 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.km-c4-top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.km-c4-title { font-size: 0.98rem; }
.km-c4-diagram { position: relative; display: flex; flex-direction: column; gap: 72px; padding: 8px 4px 12px; }
.km-c4-arrows { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible; z-index: 0; }
.km-c4-arrows line { stroke: var(--km-edge); stroke-width: 1.6; stroke-dasharray: 5 4; }
.km-c4-head { fill: var(--km-muted); }
.km-c4-labels { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.km-c4-arrow-label { position: absolute; transform: translate(-50%, -50%); font-size: 0.72rem; padding: 2px 7px;
  border-radius: 999px; background: var(--km-bg); border: 1px solid var(--km-border); color: var(--km-text-2);
  max-width: 150px; text-align: center; line-height: 1.25; }
.km-c4-arrow-num { position: absolute; transform: translate(-50%, -50%); min-width: 20px; height: 20px; padding: 0 5px;
  box-sizing: border-box; border-radius: 999px; background: var(--km-bg); border: 1px solid var(--km-border);
  color: var(--km-text-2); font-size: 0.7rem; font-weight: 700; display: grid; place-items: center; pointer-events: auto; }
.km-c4-row { position: relative; z-index: 1; display: flex; flex-wrap: wrap; justify-content: center; gap: 72px 64px; }
.km-c4-boundary { position: relative; z-index: 1; border: 2px dashed var(--km-c4-external); border-radius: 12px;
  padding: 30px 14px 18px; }
.km-c4-boundary-label { position: absolute; left: 12px; top: 6px; font-size: 0.78rem; font-weight: 650; color: var(--km-text-2); }
.km-c4-box { display: flex; flex-direction: column; gap: 4px; width: 210px; min-height: 110px; padding: 10px 12px;
  border-radius: 10px; border: 2px solid transparent; text-align: center; cursor: pointer; line-height: 1.3;
  color: var(--km-c4-on) !important; background: var(--km-c4-container); box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12); }
.km-c4-box:hover { border-color: var(--km-accent); }
.km-c4-person { background: var(--km-c4-person); border-radius: 26px 26px 10px 10px; }
.km-c4-system { background: var(--km-c4-system); }
.km-c4-container { background: var(--km-c4-container); }
.km-c4-database { background: var(--km-c4-container); border-radius: 50% / 14px; padding-top: 18px; }
.km-c4-component { background: var(--km-c4-component); color: var(--km-c4-on-light) !important; }
.km-c4-ext { background: var(--km-c4-external); }
.km-c4-box.km-c4-focus { border-color: var(--km-text); outline: 3px solid var(--km-accent); outline-offset: 2px; }
.km-c4-name { font-weight: 700; font-size: 0.95rem; }
.km-c4-type { font-size: 0.72rem; opacity: 0.9; }
.km-c4-desc { font-size: 0.78rem; opacity: 0.95; }
.km-c4-inside { font-size: 0.72rem; font-weight: 650; margin-top: auto; }
.km-c4-list h4 { margin: 0 0 6px; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--km-muted); }
.km-c4-list ul { margin: 0; padding-left: 4px; list-style: none; display: flex; flex-direction: column; gap: 3px; font-size: 0.86rem; color: var(--km-text-2); }
/* Concept map: four spokes, the statement on the link. */
.km-concept { padding: 18px 16px 20px; display: flex; flex-direction: column; gap: 16px;
  height: 100%; box-sizing: border-box; overflow: auto; }
.km-concept-stage { display: grid; align-items: center; justify-items: center; gap: 14px 16px;
  grid-template-areas: ". top ." "left center right" ". bottom .";
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); min-height: 280px; }
.km-concept-side { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.km-concept-top { grid-area: top; }
.km-concept-right { grid-area: right; }
.km-concept-bottom { grid-area: bottom; }
.km-concept-left { grid-area: left; }
.km-concept-center { grid-area: center; width: fit-content; max-width: 16rem; background: var(--km-text);
  color: var(--bg-deep-space, #f5f7fb); border-radius: 999px; font-weight: 700; padding: 16px 22px;
  text-align: center; }
.km-concept-spoke, .km-concept-chip { border: 1px solid var(--km-border); background: var(--km-card);
  cursor: pointer; }
.km-concept-spoke { display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; min-height: 64px; min-width: 120px; max-width: 200px; padding: 10px 12px; border-radius: 14px;
  text-align: center; }
.km-concept-spoke:hover, .km-concept-chip:hover { border-color: var(--km-accent); }
.km-concept-link { color: var(--km-accent); font-size: 0.78rem; font-weight: 700; }
.km-concept-name { font-weight: 700; }
.km-concept-reading { background: var(--km-surface); border-radius: 14px; padding: 12px 14px;
  color: var(--km-text-2); line-height: 1.5; }
.km-concept-reading-label { display: block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--km-muted); margin-bottom: 4px; }
.km-concept-more { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.km-concept-more-label { color: var(--km-muted); font-size: 0.85rem; }
.km-concept-chip { border-radius: 999px; min-height: 44px; padding: 8px 12px; }
@media (prefers-reduced-motion: reduce) {
  .km-lv-anim-in, .km-lv-anim-out { animation: none; }
}
@media (max-width: 860px) {
  .km-body { grid-template-columns: minmax(0, 1fr); }
  .km-details { max-height: none; }
  .km-body { --km-stage-h: clamp(440px, 64vh, 640px); }
  .km-concept-stage { display: flex; flex-direction: column; }
  .km-concept-center { order: -1; }
  .km-concept-spoke { width: 100%; max-width: none; }
}
`;

export function ensureKnowledgeMapStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
