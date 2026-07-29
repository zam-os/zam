import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CanvasError,
  createCanvas,
  joinSession,
} from "@github/copilot-sdk/extension";
import { connectZam } from "./mcp-client.bundle.mjs";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const hostBundlePromise = readFile(
  join(extensionDir, "host.bundle.js"),
  "utf8",
);

const APP_CONFIG = {
  studio: {
    title: "ZAM Studio",
    toolName: "zam_open_studio",
    allowedTools: new Set(["zam_studio_bridge"]),
  },
  recall: {
    title: "ZAM Recall",
    toolName: "zam_open_recall",
    allowedTools: new Set(["zam_get_reviews", "zam_submit_review"]),
  },
  graph: {
    title: "ZAM Graph",
    toolName: "zam_show_graph",
    allowedTools: new Set(["zam_studio_bridge"]),
  },
  okf: {
    title: "ZAM Knowledge Base",
    toolName: "zam_okf_visualize",
    allowedTools: new Set([
      "zam_okf_catalog",
      "zam_okf_read",
      "zam_okf_audit",
      "zam_okf_read_citation",
      "zam_okf_focus",
    ]),
  },
  settings: {
    title: "ZAM Settings",
    toolName: "zam_open_settings",
    allowedTools: new Set(["zam_studio_bridge"]),
  },
};

const servers = new Map();
const modelContexts = new Map();
let mcpConnectionPromise;

async function getLaunchConfig() {
  if (process.env.ZAM_BIN) {
    return { command: process.env.ZAM_BIN, args: ["mcp"] };
  }

  const path = join(extensionDir, "launch.json");
  const config = JSON.parse(await readFile(path, "utf8"));
  if (
    !config ||
    typeof config.command !== "string" ||
    !Array.isArray(config.args) ||
    !config.args.every((arg) => typeof arg === "string")
  ) {
    throw new Error(`Invalid ZAM launch configuration: ${path}`);
  }
  return { command: config.command, args: config.args };
}

async function getMcpClient() {
  if (!mcpConnectionPromise) {
    mcpConnectionPromise = getLaunchConfig()
      .then(connectZam)
      .catch((error) => {
        mcpConnectionPromise = undefined;
        throw error;
      });
  }
  return (await mcpConnectionPromise).client;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function buildToolArguments(kind, input) {
  // `okf` takes no `user`: `zam_okf_visualize` is repo-scoped and its input
  // schema only knows `bundle_dir`.
  if (kind === "okf") {
    return compactObject({ bundle_dir: input?.bundle_dir });
  }
  const common = { user: input?.user };
  if (kind === "recall") {
    return compactObject({ ...common, domain: input?.domain });
  }
  if (kind === "graph") {
    return compactObject({ ...common, focus: input?.focus });
  }
  return compactObject(common);
}

function toolUiResourceUri(tool) {
  const nested = tool?._meta?.ui?.resourceUri;
  const legacy = tool?._meta?.["ui/resourceUri"];
  return typeof nested === "string"
    ? nested
    : typeof legacy === "string"
      ? legacy
      : undefined;
}

async function prepareApp(kind, input) {
  const config = APP_CONFIG[kind];
  const client = await getMcpClient();
  const { tools } = await client.listTools();
  const tool = tools.find((candidate) => candidate.name === config.toolName);
  if (!tool) {
    throw new Error(`ZAM MCP tool not found: ${config.toolName}`);
  }

  const resourceUri = toolUiResourceUri(tool);
  if (!resourceUri) {
    throw new Error(
      `${config.toolName} does not advertise an MCP App resource`,
    );
  }

  const toolArguments = buildToolArguments(kind, input);
  const [toolResult, resourceResult] = await Promise.all([
    client.callTool({
      name: config.toolName,
      arguments: toolArguments,
    }),
    client.readResource({ uri: resourceUri }),
  ]);

  if (toolResult.isError) {
    const text = toolResult.content?.find((item) => item.type === "text")?.text;
    throw new Error(text || `${config.toolName} failed`);
  }

  const resource =
    resourceResult.contents?.find((item) => item.uri === resourceUri) ??
    resourceResult.contents?.[0];
  const appHtml =
    typeof resource?.text === "string"
      ? resource.text
      : typeof resource?.blob === "string"
        ? Buffer.from(resource.blob, "base64").toString("utf8")
        : "";
  if (!appHtml) {
    throw new Error(`MCP App resource is empty: ${resourceUri}`);
  }

  return {
    appHtml,
    config,
    kind,
    resourceUri,
    tool,
    toolArguments,
    toolResult,
  };
}

function send(response, status, contentType, body, headers = {}) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(body);
}

function sendJson(response, status, value) {
  send(
    response,
    status,
    "application/json; charset=utf-8",
    JSON.stringify(value),
  );
}

function sendError(response, error, status = 500) {
  sendJson(response, status, {
    error: error instanceof Error ? error.message : String(error),
  });
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw new Error("Request body exceeds 1 MB");
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderHostHtml(title) {
  const escapedTitle = escapeHtml(title);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; }
      body {
        overflow: hidden;
        background: var(--background-color-default, Canvas);
        color: var(--text-color-default, CanvasText);
        font-family: var(--font-sans, system-ui, sans-serif);
      }
      #status {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--text-color-muted, #656d76);
        font-size: var(--text-body-medium, 14px);
      }
      #app {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: transparent;
      }
      body.ready #status { display: none; }
    </style>
  </head>
  <body>
    <div id="status" role="status">Connecting MCP App...</div>
    <iframe
      id="app"
      title="${escapedTitle}"
      sandbox="allow-scripts allow-forms"
    ></iframe>
    <script type="module" src="/host.bundle.js"></script>
  </body>
</html>`;
}

async function startServer(instanceId, app) {
  const hostBundle = await hostBundlePromise;
  const client = await getMcpClient();
  const hostStatus = { phase: "server-ready" };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && url.pathname === "/") {
        send(
          response,
          200,
          "text/html; charset=utf-8",
          renderHostHtml(app.config.title),
          {
            "Content-Security-Policy":
              "default-src 'none'; script-src 'self'; frame-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
          },
        );
        return;
      }
      if (request.method === "GET" && url.pathname === "/host.bundle.js") {
        send(response, 200, "text/javascript; charset=utf-8", hostBundle);
        return;
      }
      if (request.method === "GET" && url.pathname === "/app") {
        send(response, 200, "text/html; charset=utf-8", app.appHtml);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/bootstrap") {
        sendJson(response, 200, {
          resourceUri: app.resourceUri,
          title: app.config.title,
          tool: app.tool,
          toolArguments: app.toolArguments,
          toolResult: app.toolResult,
        });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/tool") {
        const body = await readJsonBody(request);
        if (
          typeof body.name !== "string" ||
          !app.config.allowedTools.has(body.name)
        ) {
          sendError(
            response,
            new Error(`Tool is not allowed for ${app.kind}: ${body.name}`),
            403,
          );
          return;
        }
        const result = await client.callTool({
          name: body.name,
          arguments:
            body.arguments &&
            typeof body.arguments === "object" &&
            !Array.isArray(body.arguments)
              ? body.arguments
              : {},
        });
        sendJson(response, 200, result);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/model-context") {
        const body = await readJsonBody(request);
        modelContexts.set(instanceId, body);
        sendJson(response, 200, {});
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/host-status") {
        const body = await readJsonBody(request);
        Object.assign(hostStatus, body, {
          updatedAt: new Date().toISOString(),
        });
        sendJson(response, 200, {});
        return;
      }
      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendError(response, error);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    app,
    hostStatus,
    server,
    url: `http://127.0.0.1:${port}/`,
  };
}

async function openApp(kind, context) {
  let entry = servers.get(context.instanceId);
  if (!entry) {
    try {
      const app = await prepareApp(kind, context.input ?? {});
      entry = await startServer(context.instanceId, app);
      servers.set(context.instanceId, entry);
    } catch (error) {
      throw new CanvasError(
        "zam_mcp_app_open_failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return {
    title: APP_CONFIG[kind].title,
    status: `Connected via ${entry.app.resourceUri}`,
    url: entry.url,
  };
}

async function closeApp(context) {
  const entry = servers.get(context.instanceId);
  if (!entry) return;
  servers.delete(context.instanceId);
  modelContexts.delete(context.instanceId);
  await new Promise((resolve) => entry.server.close(resolve));
}

const commonInputProperties = {
  user: {
    type: "string",
    description: "ZAM user ID; defaults to the configured ZAM identity.",
  },
};

function connectionStatusAction() {
  return {
    name: "connection_status",
    description:
      "Report whether the embedded ZAM MCP App completed its host handshake.",
    handler: (context) => {
      const entry = servers.get(context.instanceId);
      if (!entry) {
        throw new CanvasError(
          "zam_mcp_app_not_open",
          "This ZAM MCP App canvas is not open.",
        );
      }
      return {
        ...entry.hostStatus,
        resourceUri: entry.app.resourceUri,
        toolName: entry.app.config.toolName,
      };
    },
  };
}

let shutdownPromise;

function shutdown() {
  if (!shutdownPromise) {
    shutdownPromise = (async () => {
      const entries = [...servers.values()];
      servers.clear();
      modelContexts.clear();
      await Promise.all(
        entries.map(
          (entry) => new Promise((resolve) => entry.server.close(resolve)),
        ),
      );
      if (mcpConnectionPromise) {
        const connection = await mcpConnectionPromise.catch(() => undefined);
        await connection?.client.close().catch(() => {});
      }
    })();
  }
  return shutdownPromise;
}

function exitAfterShutdown() {
  void shutdown().finally(() => process.exit(0));
}

process.once("SIGTERM", exitAfterShutdown);
process.once("SIGINT", exitAfterShutdown);

await joinSession({
  canvases: [
    createCanvas({
      id: "zam-studio",
      displayName: "ZAM Studio",
      description:
        "Open the original ZAM Studio MCP App in a hosted Copilot canvas.",
      inputSchema: {
        type: "object",
        properties: commonInputProperties,
        additionalProperties: false,
      },
      actions: [connectionStatusAction()],
      open: (context) => openApp("studio", context),
      onClose: closeApp,
    }),
    createCanvas({
      id: "zam-recall",
      displayName: "ZAM Recall",
      description:
        "Open the original spoiler-free ZAM Recall MCP App in a hosted Copilot canvas.",
      inputSchema: {
        type: "object",
        properties: {
          ...commonInputProperties,
          domain: {
            type: "string",
            description: "Optional domain prefix for the recall queue.",
          },
        },
        additionalProperties: false,
      },
      actions: [connectionStatusAction()],
      open: (context) => openApp("recall", context),
      onClose: closeApp,
    }),
    createCanvas({
      id: "zam-graph",
      displayName: "ZAM Graph",
      description:
        "Open the original interactive ZAM knowledge-graph MCP App in a hosted Copilot canvas.",
      inputSchema: {
        type: "object",
        properties: {
          ...commonInputProperties,
          focus: {
            type: "string",
            description: "Token slug to center the graph on.",
          },
        },
        additionalProperties: false,
      },
      actions: [connectionStatusAction()],
      open: (context) => openApp("graph", context),
      onClose: closeApp,
    }),
    createCanvas({
      id: "zam-knowledge",
      displayName: "ZAM Knowledge Base",
      description:
        "Open the ZAM OKF knowledge-base visualizer MCP App in a hosted Copilot canvas.",
      inputSchema: {
        type: "object",
        properties: {
          bundle_dir: {
            type: "string",
            description:
              "Bundle directory (default docs/okf under the zam server cwd).",
          },
        },
        additionalProperties: false,
      },
      actions: [connectionStatusAction()],
      open: (context) => openApp("okf", context),
      onClose: closeApp,
    }),
    createCanvas({
      id: "zam-settings",
      displayName: "ZAM Settings",
      description:
        "Open the original ZAM Settings MCP App in a hosted Copilot canvas.",
      inputSchema: {
        type: "object",
        properties: commonInputProperties,
        additionalProperties: false,
      },
      actions: [connectionStatusAction()],
      open: (context) => openApp("settings", context),
      onClose: closeApp,
    }),
  ],
  hooks: {
    onUserPromptSubmitted: async () => {
      if (modelContexts.size === 0) return;
      const context = [...modelContexts.values()]
        .map((value) => JSON.stringify(value))
        .join("\n");
      return {
        additionalContext: `Current state from open ZAM MCP Apps:\n${context}`,
      };
    },
  },
});
