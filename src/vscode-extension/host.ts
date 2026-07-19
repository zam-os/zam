/// <reference lib="dom" />

import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type {
  CallToolResult,
  CreateMessageResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createLatestTaskQueue } from "./latest-task-queue.js";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
};

interface BootstrapPayload {
  appHtml: string;
  title: string;
  tool: Tool;
  toolArguments: Record<string, unknown>;
  toolResult: CallToolResult;
}

type HostRequestType =
  | "callTool"
  | "chatMessage"
  | "modelContext"
  | "openLink"
  | "sampling"
  | "status";

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element)
    throw new Error(`ZAM Companion element is missing: ${selector}`);
  return element;
}

const vscode = acquireVsCodeApi();
const frame = requiredElement<HTMLIFrameElement>("#app");
const status = requiredElement<HTMLElement>("#status");
const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();
let requestId = 0;
let activeBridge: AppBridge | undefined;
let activeBlobUrl: string | undefined;

function request<T>(type: HostRequestType, payload: unknown): Promise<T> {
  const id = ++requestId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    });
    vscode.postMessage({ type, id, payload });
  });
}

function currentTheme(): "dark" | "light" {
  return document.body.classList.contains("vscode-dark") ||
    document.body.classList.contains("vscode-high-contrast")
    ? "dark"
    : "light";
}

function hostContext(tool: Tool) {
  return {
    toolInfo: { id: `vscode-${tool.name}`, tool },
    theme: currentTheme(),
    displayMode: "inline" as const,
    availableDisplayModes: ["inline" as const],
    containerDimensions: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    locale: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    platform: "desktop" as const,
    deviceCapabilities: {
      touch: navigator.maxTouchPoints > 0,
      hover: matchMedia("(hover: hover)").matches,
    },
  };
}

async function teardownActiveBridge(): Promise<void> {
  if (activeBridge) {
    await activeBridge.teardownResource({}).catch(() => {});
    activeBridge = undefined;
  }
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = undefined;
  }
  frame.removeAttribute("src");
  document.body.classList.remove("ready");
}

async function mount(payload: BootstrapPayload): Promise<void> {
  await teardownActiveBridge();
  status.textContent = `${payload.title} wird verbunden …`;

  const bridge = new AppBridge(
    null,
    { name: "VS Code ZAM Companion", version: "__ZAM_VERSION__" },
    {
      openLinks: {},
      serverTools: {},
      logging: {},
      updateModelContext: { text: {}, structuredContent: {} },
      sampling: {},
      // ui/message: apps hand a user message to "the chat". The extension
      // side routes it into VS Code's Chat view (workbench.action.chat.open)
      // and reports isError when no chat can take it — the app then falls
      // back to its copyable-text path.
      message: { text: {} },
    },
    { hostContext: hostContext(payload.tool) },
  );
  activeBridge = bridge;

  bridge.oncalltool = async (params) =>
    request<CallToolResult>("callTool", params);
  bridge.onmessage = async (params) =>
    request<{ isError?: boolean }>("chatMessage", params);
  bridge.onupdatemodelcontext = async (params) =>
    request<Record<string, never>>("modelContext", params);
  bridge.oncreatesamplingmessage = async (params) =>
    request<CreateMessageResult>("sampling", params);
  bridge.onopenlink = async ({ url }) =>
    request<Record<string, unknown>>("openLink", { url });
  bridge.onrequestdisplaymode = async () => ({ mode: "inline" });
  bridge.onsizechange = () => {
    frame.style.height = "100%";
  };
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: payload.toolArguments });
    await bridge.sendToolResult(payload.toolResult);
    document.body.classList.add("ready");
    void request("status", {
      phase: "ready",
      app: payload.tool.name,
    }).catch(() => {});
  };

  const targetWindow = frame.contentWindow;
  if (!targetWindow) throw new Error("ZAM Companion iframe is unavailable");
  const transport = new PostMessageTransport(targetWindow, targetWindow);
  await bridge.connect(transport);

  activeBlobUrl = URL.createObjectURL(
    new Blob([payload.appHtml], { type: "text/html" }),
  );
  frame.title = payload.title;
  frame.src = activeBlobUrl;
}

type RenderRequest =
  | { type: "bootstrap"; payload: BootstrapPayload }
  | { type: "empty"; message: string };

const renderLatest = createLatestTaskQueue<RenderRequest>(async (render) => {
  if (render.type === "bootstrap") {
    await mount(render.payload);
    return;
  }
  await teardownActiveBridge();
  status.textContent = render.message;
});

function reportRenderError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  status.textContent = `MCP App konnte nicht gestartet werden: ${message}`;
  void request("status", { phase: "error", message }).catch(() => {});
}

window.addEventListener("message", (event: MessageEvent<unknown>) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;
  const value = message as Record<string, unknown>;

  if (value.type === "bootstrap") {
    void renderLatest({
      type: "bootstrap",
      payload: value.payload as BootstrapPayload,
    }).catch(reportRenderError);
    return;
  }

  if (value.type === "empty") {
    void renderLatest({
      type: "empty",
      message:
        typeof value.message === "string"
          ? value.message
          : "ZAM wartet auf eine Auswahl im Agent-Chat.",
    }).catch(reportRenderError);
    return;
  }

  if (value.type === "response" && typeof value.id === "number") {
    const entry = pending.get(value.id);
    if (!entry) return;
    pending.delete(value.id);
    if (typeof value.error === "string") {
      entry.reject(new Error(value.error));
    } else {
      entry.resolve(value.result);
    }
  }
});

const refreshHostContext = () => {
  if (!activeBridge) return;
  activeBridge.setHostContext({
    theme: currentTheme(),
    containerDimensions: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
};
window.addEventListener("resize", refreshHostContext);
const themeObserver = new MutationObserver(refreshHostContext);
themeObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});
window.addEventListener(
  "beforeunload",
  () => {
    themeObserver.disconnect();
    void teardownActiveBridge();
  },
  { once: true },
);

vscode.postMessage({ type: "ready" });
