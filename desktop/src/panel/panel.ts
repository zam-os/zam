/**
 * ZAM Studio MCP Apps panel entry (ADR 2026-07-06a item 6).
 *
 * Runs inside a sandboxed iframe in MCP Apps hosts (Claude, VS Code Copilot,
 * Goose, …). All data access goes through MCP tool calls via the host bridge;
 * there is no Tauri backend and no direct network access here.
 */

import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("zam-status");
const statusDot = document.getElementById("zam-status-dot");
const versionEl = document.getElementById("zam-version");

function setStatus(text: string, connected: boolean): void {
  if (statusEl) statusEl.textContent = text;
  if (statusDot) statusDot.classList.toggle("connected", connected);
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

app
  .connect()
  .then(() => {
    setStatus("Connected to host — waiting for data…", true);
  })
  .catch((error: unknown) => {
    setStatus(
      `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  });
