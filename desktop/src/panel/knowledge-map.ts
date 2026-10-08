/**
 * The knowledge map as an MCP Apps panel (ADR 2026-10-03). The
 * `zam_knowledge_map_show` tool hands it one repository's map, and it mounts
 * the same shell as the Studio and the viewer page. The VS Code Companion
 * opens it with "ZAM: Show Knowledge Map"; chat hosts that render MCP Apps
 * show it inline. Like the Studio it never dead-ends: without a usable map it
 * shows ZAM's own map as an example and says why.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import {
  buildMapIndex,
  type KnowledgeMap,
  validateKnowledgeMap,
} from "../../../src/cli/knowledge-map/model.js";
import { setCurrentLocale, t, tf } from "../i18n.js";
import {
  type KnowledgeMapViewId,
  parseKnowledgeMapViewId,
} from "../knowledge-map/registry.js";
import { mountKnowledgeMap, type ShellHandle } from "../knowledge-map/shell.js";
import {
  type ShowKnowledgeMapResult,
  sampleNotice,
} from "../knowledge-map/show-result.js";

const app = new App({ name: "ZAM Knowledge Map", version: "0.1.0" });
const status = document.getElementById("km-panel-status");
const root = document.getElementById("km-panel-app");
let shell: ShellHandle | null = null;
let viewId: KnowledgeMapViewId = "focus";
let lastResult: ShowKnowledgeMapResult | null = null;

function showStatus(text: string | null): void {
  if (!status) return;
  status.hidden = text === null;
  status.textContent = text ?? "";
}

async function sampleMap(): Promise<KnowledgeMap | null> {
  const module = await import("../../../docs/knowledge-map/map.json");
  return validateKnowledgeMap(module.default).map;
}

function applyHostContext(): void {
  const context = app.getHostContext();
  if (context?.theme === "dark" || context?.theme === "light") {
    document.documentElement.dataset.theme = context.theme;
  }
  const locale = context?.locale ?? navigator.language ?? "en";
  const lang = locale.toLowerCase().startsWith("de") ? "de" : "en";
  setCurrentLocale(lang);
  document.documentElement.lang = lang;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function render(result: ShowKnowledgeMapResult): Promise<void> {
  if (!root) return;
  lastResult = result;
  if (typeof result.view === "string") {
    viewId = parseKnowledgeMapViewId(result.view);
  }
  const notice = sampleNotice(result, t);
  const map =
    notice === null ? validateKnowledgeMap(result.map).map : await sampleMap();
  if (!map) {
    showStatus(t("km_load_failed"));
    return;
  }
  showStatus(null);
  shell?.destroy();
  root.replaceChildren();
  // Only intercept source links when the host opens links for the panel
  // (ADR 2026-07-30); otherwise the plain href stays the fallback.
  const hostOpensLinks = Boolean(app.getHostCapabilities()?.openLinks);
  shell = await mountKnowledgeMap(root, {
    index: buildMapIndex(map),
    viewId,
    t,
    tf,
    showViewSwitcher: true,
    notice: notice ?? undefined,
    openSource: hostOpensLinks
      ? (url) => void app.openLink({ url }).catch(() => undefined)
      : undefined,
    feedback: null,
    copyText,
    onViewChange: (id) => {
      viewId = id;
    },
  });
}

app.ontoolresult = (params) => {
  void render((params.structuredContent ?? {}) as ShowKnowledgeMapResult);
};

app.onhostcontextchanged = () => {
  applyHostContext();
  if (lastResult) void render(lastResult);
};

// A plain file viewer renders this HTML without ever answering
// ui/initialize, so connect() would stay pending: say so instead.
const noHostTimer = setTimeout(
  () =>
    showStatus(
      "No MCP Apps host answered. Open the map with `zam knowledge-map view` instead.",
    ),
  4000,
);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    applyHostContext();
    if (lastResult) void render(lastResult);
    else showStatus(t("km_loading"));
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showStatus(error instanceof Error ? error.message : String(error));
  });
