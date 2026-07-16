/**
 * ZAM Studio MCP Apps panel entry (ADR 2026-07-06a item 6).
 *
 * Runs inside a sandboxed iframe in MCP Apps hosts (Claude, VS Code Copilot,
 * Goose, …). All data access goes through MCP tool calls via the host bridge;
 * there is no Tauri backend and no direct network access here.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { setBridgeTransport } from "../bridge-transport.js";
import { setCurrentLocale } from "../i18n.js";
import { initLearningContentStudio } from "../learning-content.js";
import {
  type CompanionContextBarState,
  type ContextBarHandle,
  fallbackContextBarState,
  mountContextBar,
} from "./context-bar.js";

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");

/**
 * Connection/startup errors previously lived in the permanent
 * "Connected to zam mcp" status row (removed — ADR 2026-07-16 §Decision 1).
 * This inline notice is the replacement seam: it stays visible next to the
 * content it affects instead of disappearing along with that row.
 */
function showConnectionNotice(message: string): void {
  if (!noticeEl) return;
  noticeEl.textContent = message;
  noticeEl.hidden = false;
}

function clearConnectionNotice(): void {
  if (!noticeEl) return;
  noticeEl.hidden = true;
  noticeEl.textContent = "";
}

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;

let toastEl: HTMLDivElement | null = null;
let toastHideTimer: number | null = null;

/**
 * Panel-scoped stand-in for window.alert() — see the override below for why
 * this exists. Fixed to the bottom of the panel, replaces any
 * currently-shown message (no queue), and auto-hides after ~4s.
 */
function showPanelToast(message: string): void {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "zam-panel-toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add("visible");

  if (toastHideTimer !== null) {
    clearTimeout(toastHideTimer);
  }
  toastHideTimer = window.setTimeout(() => {
    toastEl?.classList.remove("visible");
    toastHideTimer = null;
  }, 4000);
}

interface OpenStudioResult {
  studio?: string;
  version?: string;
  user?: string | null;
  companionContext?: CompanionContextBarState;
}

const app = new App({ name: "ZAM Studio", version: "0.1.0" });

const SURFACE = "studio";

/**
 * Parse a zam MCP tool result: success answers carry JSON on content[0].text
 * (never structuredContent — wrapHandler re-wraps arrays as `{ result }`); on
 * isError, surface the JSON `error` field. Copied from recall.ts/graph.ts/
 * settings.ts to keep this panel independently bundleable.
 */
async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const result = await app.callServerTool({ name, arguments: args });
  const first = result.content?.[0];
  const text = first && first.type === "text" ? first.text : undefined;

  if (result.isError) {
    let message = text ?? `${name} call failed`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (typeof parsed.error === "string") message = parsed.error;
      } catch {
        // Not JSON — keep the raw text assigned above.
      }
    }
    throw new Error(message);
  }

  return text === undefined ? undefined : JSON.parse(text);
}

/** Write a manual user/evaluator/collapsed choice through the shared contract. */
async function writeCompanionContext(payload: {
  userId?: string;
  evaluatorId?: string;
  collapsed?: boolean;
}): Promise<{ read: CompanionContextBarState; reloadRequired: boolean }> {
  const result = await callTool("zam_companion_context", {
    action: "write",
    surface: SURFACE,
    ...payload,
  });
  return result as { read: CompanionContextBarState; reloadRequired: boolean };
}

/**
 * True while a card is open for editing in the Learning Content Studio —
 * the ADR's "unsubmitted local state" case for this surface (ADR
 * §Decision 4). learning-content.ts owns the form; this only reads its
 * visibility, which is enough to ask before a context switch discards it.
 */
function hasUnsavedStudioState(): boolean {
  const editor = document.getElementById("editor-form-container");
  return Boolean(editor && !editor.classList.contains("hidden"));
}

/**
 * Nothing rendered by the Learning Content Studio is scoped to a learner —
 * workspaces, knowledge contexts, and card curation are global, not
 * per-user FSRS queues — so a user/evaluator context change has no
 * per-learner data to reload here, unlike Recall/Graph. The context bar's
 * own `update()` call already refreshes the Agent/User pills.
 */
function reloadForContext(_newState: CompanionContextBarState): void {
  // Intentionally a no-op; see the doc comment above.
}

app.ontoolresult = (result) => {
  const structured = (result.structuredContent ?? {}) as OpenStudioResult;
  panelVersion = structured.version;
  const user = structured.user ?? null;
  clearConnectionNotice();

  const contextState =
    structured.companionContext ?? fallbackContextBarState(SURFACE, user);
  if (contextBar) {
    contextBar.update(contextState);
  } else if (contextBarRoot) {
    contextBar = mountContextBar(
      contextBarRoot,
      "ZAM Studio",
      panelVersion,
      contextState,
      {
        write: writeCompanionContext,
        hasUnsavedChanges: hasUnsavedStudioState,
        onReload: reloadForContext,
        onError: showConnectionNotice,
      },
    );
  }
};

// zam_studio_bridge always answers on content[0] as JSON text (see
// wrapHandler in src/cli/commands/mcp.ts) — structuredContent is NOT used
// here because wrapHandler re-wraps bare-array results as `{ result }`,
// which would silently corrupt list-shaped responses.
async function mcpTransport(cmd: string, args: string[]): Promise<unknown> {
  return callTool("zam_studio_bridge", { cmd, args });
}

// A plain file viewer (e.g. an editor preview) renders this HTML without
// ever answering ui/initialize — connect() then stays pending forever.
// Degrade honestly instead of showing "Connecting to host…" for good.
const NO_HOST_NOTICE =
  "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
  "(z. B. basic-host oder Copilot-Panel).";
const noHostTimer = setTimeout(() => showConnectionNotice(NO_HOST_NOTICE), 4000);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);

    // Transport must be wired before init: initLearningContentStudio()
    // kicks off its own data load synchronously on return.
    setBridgeTransport(mcpTransport);
    if (navigator.language.startsWith("de")) {
      setCurrentLocale("de");
    }

    // MCP-Apps hosts render this panel in a sandboxed iframe, typically
    // without `allow-modals` set, so window.alert() silently no-ops instead
    // of showing anything. learning-content.ts (shared with the Tauri
    // desktop app, which does grant modal permission) routes every
    // success/error/validation message through alert(), so redirect it to
    // an in-panel toast before init can trigger any of those calls.
    window.alert = (message?: unknown): void => showPanelToast(String(message));

    initLearningContentStudio();
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(
      `ZAM Studio failed to start: ${error instanceof Error ? error.message : String(error)}`,
    );
  });
