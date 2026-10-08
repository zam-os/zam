/**
 * The two slots of the knowledge-map viewer template
 * (desktop/src/panel/knowledge-map-viewer.html): `zam knowledge-map view`
 * fills them, the page's script reads the data slot back. Shared by the CLI
 * and the browser bundle, so nothing here may import Node modules.
 */

export const VIEWER_TEMPLATE_FILE = "knowledge-map-viewer.html";
export const MAP_DATA_ELEMENT_ID = "km-map";
export const MAP_DATA_PLACEHOLDER = "__ZAM_KNOWLEDGE_MAP_DATA__";
export const MAP_TITLE_PLACEHOLDER = "__ZAM_KNOWLEDGE_MAP_TITLE__";

/** The data slot exactly as the template carries it. */
export const MAP_DATA_SLOT = `<script type="application/json" id="${MAP_DATA_ELEMENT_ID}">${MAP_DATA_PLACEHOLDER}</script>`;
export const MAP_TITLE_SLOT = `<title>${MAP_TITLE_PLACEHOLDER}</title>`;
