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

const statusEl = document.getElementById("zam-status");
const statusDot = document.getElementById("zam-status-dot");
const versionEl = document.getElementById("zam-version");

function setStatus(text: string, connected: boolean): void {
  if (statusEl) statusEl.textContent = text;
  if (statusDot) statusDot.classList.toggle("connected", connected);
}

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
}

const app = new App({ name: "ZAM Studio", version: "0.1.0" });

app.ontoolresult = (result) => {
  const structured = (result.structuredContent ?? {}) as OpenStudioResult;
  if (versionEl && structured.version) {
    versionEl.textContent = `v${structured.version}`;
  }
  const user = structured.user ? ` — signed in as ${structured.user}` : "";
  setStatus(`Connected to zam mcp${user}`, true);
};

// zam_studio_bridge always answers on content[0] as JSON text (see
// wrapHandler in src/cli/commands/mcp.ts) — structuredContent is NOT used
// here because wrapHandler re-wraps bare-array results as `{ result }`,
// which would silently corrupt list-shaped responses.
async function mcpTransport(cmd: string, args: string[]): Promise<unknown> {
  const result = await app.callServerTool({
    name: "zam_studio_bridge",
    arguments: { cmd, args },
  });
  const first = result.content?.[0];
  const text = first && first.type === "text" ? first.text : undefined;

  if (result.isError) {
    let message = text ?? "zam_studio_bridge call failed";
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

app
  .connect()
  .then(() => {
    setStatus("Connected to host — waiting for data…", true);

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
    setStatus(
      `ZAM Studio failed to start: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  });
