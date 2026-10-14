/**
 * The knowledge atlas as an MCP Apps panel (ADR 2026-10-13, Decision 10;
 * plan Phase 10a).
 *
 * It mounts the Studio's own atlas view in its read-only mode: no thread,
 * Sinnbild, import, move or setting is offered, and the land is never
 * settled. Every read goes through `zam_studio_bridge`, whose allowlist names
 * only `atlas-read`, `atlas-revision` and the reading form of `atlas-prefs`,
 * so the panel can reach nothing that writes even if a control slipped
 * through.
 */

import "../tokens.css";
import "../atlas/atlas.css";
import { App } from "@modelcontextprotocol/ext-apps";
import type { AtlasLensKindWire } from "../../../src/bridge/protocol.js";
import { showAtlasView } from "../atlas/view.js";
import { setBridgeTransport } from "../bridge-transport.js";
import { setCurrentLocale } from "../i18n.js";
import {
  type CompanionContextBarState,
  type ContextBarHandle,
  clearConnectionNotice as clearConnectionNoticeShared,
  createCallTool,
  createContextReader,
  createContextWriter,
  ensureContextBar,
  fallbackContextBarState,
  showConnectionNotice as showConnectionNoticeShared,
} from "./context-bar.js";

interface OpenAtlasResult {
  atlas?: string;
  version?: string;
  user?: string | null;
  lens?: AtlasLensKindWire | null;
  region?: string | null;
  companionContext?: CompanionContextBarState;
}

const SURFACE = "atlas";
const TITLE = "ZAM Knowledge Atlas";

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const atlasRoot = document.getElementById("atlas-root");

const showConnectionNotice = (message: string): void =>
  showConnectionNoticeShared(noticeEl, message);
const clearConnectionNotice = (): void => clearConnectionNoticeShared(noticeEl);

const app = new App({ name: TITLE, version: "0.1.0" });
const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);
const readCompanionContext = createContextReader(callTool, SURFACE);

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;
/** The learner the map is read for; null leaves it to the bridge (whoami). */
let currentUser: string | null = null;
let connected = false;
let shown = false;
/** Where the tool asked the map to open; used once. */
let opening: { lens?: AtlasLensKindWire; region?: string } = {};

/** The commands that read per learner take the panel's learner. */
const PER_LEARNER = new Set(["atlas-read", "atlas-revision"]);

/**
 * The view's bridge, through the panel bridge. The allowlist refuses
 * anything else; the panel never names a write.
 */
async function transport(cmd: string, args: string[]): Promise<unknown> {
  const withUser =
    currentUser && PER_LEARNER.has(cmd)
      ? [...args, "--user", currentUser]
      : args;
  return callTool("zam_studio_bridge", { cmd, args: withUser });
}

/** The host's theme, else the system's; the map redraws on a change. */
function applyTheme(theme: "light" | "dark" | undefined): void {
  const dark =
    theme === "dark" ||
    (theme === undefined &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches === true);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function show(): void {
  if (!connected || !atlasRoot) return;
  shown = true;
  const at = opening;
  opening = {};
  void showAtlasView(
    atlasRoot,
    {
      readOnly: true,
      // Reading up opens through the host, never by navigating the panel.
      openExternal: (url) => {
        void app.openLink({ url }).catch(() => undefined);
      },
    },
    at,
  ).catch((error: unknown) => {
    showConnectionNotice(
      `${TITLE}: ${error instanceof Error ? error.message : String(error)}`,
    );
  });
}

/** Another learner chosen in the context bar: read their map. */
function reloadForContext(next: CompanionContextBarState): void {
  currentUser = next.user.currentId ?? null;
  if (shown) show();
}

function mountContextBar(state: CompanionContextBarState): void {
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    TITLE,
    panelVersion,
    state,
    {
      write: writeCompanionContext,
      read: readCompanionContext,
      onReload: reloadForContext,
      onError: showConnectionNotice,
    },
  );
}

app.ontoolresult = (params) => {
  const structured = (params.structuredContent ?? {}) as OpenAtlasResult;
  panelVersion = structured.version;
  const previous = currentUser;
  currentUser = structured.user ?? null;
  opening = {
    ...(structured.lens ? { lens: structured.lens } : {}),
    ...(structured.region ? { region: structured.region } : {}),
  };
  clearConnectionNotice();
  mountContextBar(
    structured.companionContext ??
      fallbackContextBarState(SURFACE, currentUser),
  );
  // The tool's learner and place are authoritative: read again if the
  // fallback start below already showed another map.
  if (!shown || previous !== currentUser || opening.lens || opening.region) {
    show();
  }
};

app.onhostcontextchanged = (context) => {
  if (context.theme) applyTheme(context.theme);
};

// The bar shows from the first paint, before any tool result.
mountContextBar(fallbackContextBarState(SURFACE, null));
applyTheme(undefined);

// A plain file viewer never answers ui/initialize: say so instead of waiting.
const noHostTimer = setTimeout(
  () =>
    showConnectionNotice(
      "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
        "(z. B. basic-host oder Copilot-Panel).",
    ),
  4000,
);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    setBridgeTransport(transport);
    applyTheme(app.getHostContext()?.theme);
    if (navigator.language.startsWith("de")) setCurrentLocale("de");
    // The tool result names the learner and normally comes right after the
    // handshake; a host that never sends it still gets the map.
    window.setTimeout(() => {
      if (!shown) show();
    }, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(
      `${TITLE} failed to start: ${error instanceof Error ? error.message : String(error)}`,
    );
  });
