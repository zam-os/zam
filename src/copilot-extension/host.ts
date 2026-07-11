/// <reference lib="dom" />

import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`ZAM MCP App host element is missing: ${selector}`);
  }
  return element;
}

const frame = requiredElement<HTMLIFrameElement>("#app");
const status = requiredElement<HTMLElement>("#status");

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return body;
}

async function reportStatus(
  phase: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await fetchJson("/api/host-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase, ...details }),
  });
}

function currentTheme(): "dark" | "light" {
  const value =
    document.documentElement.dataset.colorMode ??
    document.body.dataset.colorMode;
  if (value === "dark" || value === "light") return value;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

async function start(): Promise<void> {
  const bootstrap = await fetchJson<{
    tool: Tool;
    toolArguments: Record<string, unknown>;
    toolResult: CallToolResult;
  }>("/api/bootstrap");

  const bridge = new AppBridge(
    null,
    { name: "GitHub Copilot Canvas", version: "__ZAM_VERSION__" },
    {
      openLinks: {},
      serverTools: {},
      logging: {},
      updateModelContext: { text: {}, structuredContent: {} },
    },
    {
      hostContext: {
        toolInfo: {
          id: `canvas-${bootstrap.tool.name}`,
          tool: bootstrap.tool,
        },
        theme: currentTheme(),
        displayMode: "inline",
        availableDisplayModes: ["inline"],
        containerDimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        locale: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        platform: "desktop",
        deviceCapabilities: {
          touch: navigator.maxTouchPoints > 0,
          hover: matchMedia("(hover: hover)").matches,
        },
      },
    },
  );

  bridge.oncalltool = async (params) =>
    fetchJson("/api/tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

  bridge.onupdatemodelcontext = async (params) =>
    fetchJson("/api/model-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

  bridge.onopenlink = async ({ url }) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    return opened ? {} : { isError: true };
  };

  bridge.onrequestdisplaymode = async () => ({ mode: "inline" });

  bridge.onsizechange = ({ height }) => {
    if (typeof height === "number" && Number.isFinite(height)) {
      frame.style.height = `${Math.max(240, Math.min(height, window.innerHeight))}px`;
    }
  };

  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: bootstrap.toolArguments });
    await bridge.sendToolResult(bootstrap.toolResult);
    await reportStatus("ready", { app: bootstrap.tool.name });
    document.body.classList.add("ready");
  };

  const targetWindow = frame.contentWindow;
  if (!targetWindow) {
    throw new Error("ZAM MCP App iframe is unavailable");
  }
  const transport = new PostMessageTransport(targetWindow, targetWindow);
  await bridge.connect(transport);
  await reportStatus("bridge-connected");
  frame.src = "/app";

  const updateContext = () => {
    bridge.setHostContext({
      theme: currentTheme(),
      containerDimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
  };
  window.addEventListener("resize", updateContext);

  const themeObserver = new MutationObserver(updateContext);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-color-mode", "data-dark-theme", "data-light-theme"],
  });

  window.addEventListener(
    "beforeunload",
    () => {
      themeObserver.disconnect();
      void bridge.teardownResource({}).catch(() => {});
    },
    { once: true },
  );
}

start().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  status.textContent = `MCP App konnte nicht gestartet werden: ${message}`;
  void reportStatus("error", { message }).catch(() => {});
});
