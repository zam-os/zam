import { unwatchFile, watchFile } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import * as vscode from "vscode";
import {
  getCompanionSelectedAntigravityEvaluatorId,
  getCompanionSelectedAntigravityModelId,
  getCompanionSelectedEvaluatorId,
  getCompanionSelectedVscodeEvaluatorId,
  getCompanionSelectedVscodeModelId,
  setCompanionSelectedAntigravityModelId,
  setCompanionSelectedVscodeModelId,
} from "../kernel/index.js";
import {
  CHOOSE_RECALL_MODEL_COMMAND_TITLE,
  createVscodeLmAdapter,
  runChooseRecallModel,
  type VscodeChatModelLike,
  type VscodeLmSurface,
  type VscodeModelSelection,
} from "./companion-adapters.js";
import {
  assertSamplingRoutableToVscodeLm,
  enrichCallToolResultForVscodeLm,
} from "./companion-dispatch.js";
import {
  type EvaluatorAdapter,
  EvaluatorUnavailableError,
} from "./companion-evaluator.js";
import {
  buildOpeningArguments,
  COMPANION_APPS,
  type CompanionApp,
  type CompanionAppConfig,
  createSamplingResult,
  normalizeSamplingRequest,
  parseCompanionIntent,
  toolUiResourceUri,
} from "./protocol.js";

/**
 * Real `vscode.lm` surface for {@link createVscodeLmAdapter}. Only these
 * methods — never `vscode.CancellationToken.None`, which does not exist at
 * runtime (ADR 2026-07-16 §Decision 6) — are used to talk to VS Code.
 */
const vscodeLmSurface: VscodeLmSurface = {
  selectChatModels: (selector) => {
    if (!vscode.lm) {
      return Promise.resolve([]);
    }
    return vscode.lm.selectChatModels(selector) as unknown as PromiseLike<
      VscodeChatModelLike[]
    >;
  },
  chatMessageUser: (content) => {
    if (!vscode.LanguageModelChatMessage) {
      return { role: "user", content };
    }
    return vscode.LanguageModelChatMessage.User(content);
  },
  chatMessageAssistant: (content) => {
    if (!vscode.LanguageModelChatMessage) {
      return { role: "assistant", content };
    }
    return vscode.LanguageModelChatMessage.Assistant(content);
  },
  createCancellationTokenSource: () => new vscode.CancellationTokenSource(),
};

/** Persists the explicit VS Code model choice machine-locally (Phase 3). */
const vscodeModelSelection: VscodeModelSelection = {
  getSelectedModelId: () => {
    const isAntigravity =
      vscode.env?.appName?.toLowerCase().includes("antigravity") ?? false;
    return isAntigravity
      ? getCompanionSelectedAntigravityModelId()
      : getCompanionSelectedVscodeModelId();
  },
  setSelectedModelId: (id) => {
    const isAntigravity =
      vscode.env?.appName?.toLowerCase().includes("antigravity") ?? false;
    if (isAntigravity) {
      setCompanionSelectedAntigravityModelId(id);
    } else {
      setCompanionSelectedVscodeModelId(id);
    }
  },
};

const vscodeLmAdapter: EvaluatorAdapter = createVscodeLmAdapter(
  vscodeLmSurface,
  vscodeModelSelection,
);

interface LaunchConfig {
  command: string;
  args: string[];
}

interface PreparedApp {
  appHtml: string;
  config: CompanionAppConfig;
  kind: CompanionApp;
  resourceUri: string;
  tool: Tool;
  toolArguments: Record<string, string>;
  toolResult: CallToolResult;
}

interface HostMessage {
  type?: unknown;
  id?: unknown;
  payload?: unknown;
}

const VIEW_CONTAINER_ID = "zamCompanion";
const VIEW_ID = "zam.companion";
const DEFAULT_EMPTY_MESSAGE =
  "ZAM wartet auf eine Auswahl im Agent-Chat. Starte mit $zam oder öffne Recall, Graph oder Settings über die Befehlspalette.";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function childEnvironment(): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    ZAM_DISABLE_UI_INTENT: "1",
  };
}

async function readLaunchConfig(path: string): Promise<LaunchConfig> {
  try {
    const parsed = JSON.parse(
      await readFile(path, "utf8"),
    ) as Partial<LaunchConfig>;
    if (
      typeof parsed.command === "string" &&
      Array.isArray(parsed.args) &&
      parsed.args.every((arg) => typeof arg === "string")
    ) {
      return { command: parsed.command, args: parsed.args };
    }
  } catch {
    // Manual VSIX installs may not have run `zam agent connect vscode` yet.
  }
  return { command: process.env.ZAM_BIN ?? "zam", args: ["mcp"] };
}

class ZamMcpHost {
  private connectionPromise:
    | Promise<{ client: Client; transport: StdioClientTransport }>
    | undefined;

  public constructor(
    private readonly launchConfigPath: string,
    private readonly output: vscode.OutputChannel,
  ) {}

  private async connect(): Promise<{
    client: Client;
    transport: StdioClientTransport;
  }> {
    if (!this.connectionPromise) {
      this.connectionPromise = (async () => {
        const launch = await readLaunchConfig(this.launchConfigPath);
        const transport = new StdioClientTransport({
          command: launch.command,
          args: launch.args,
          env: childEnvironment(),
          stderr: "pipe",
        });
        transport.stderr?.on("data", (chunk: Buffer | string) => {
          this.output.appendLine(
            `[zam mcp] ${(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk).trimEnd()}`,
          );
        });
        const isAntigravity =
          vscode.env?.appName?.toLowerCase().includes("antigravity") ?? false;
        const client = new Client({
          name: isAntigravity
            ? "antigravity-zam-companion"
            : "vscode-zam-companion",
          version: "__ZAM_VERSION__",
        });
        await client.connect(transport);
        return { client, transport };
      })().catch((error) => {
        this.connectionPromise = undefined;
        throw error;
      });
    }
    return this.connectionPromise;
  }

  public async client(): Promise<Client> {
    return (await this.connect()).client;
  }

  public async prepare(
    kind: CompanionApp,
    input: Record<string, string>,
  ): Promise<PreparedApp> {
    const config = COMPANION_APPS[kind];
    const client = await this.client();
    const { tools } = await client.listTools();
    const tool = tools.find((candidate) => candidate.name === config.toolName);
    if (!tool) throw new Error(`ZAM MCP tool not found: ${config.toolName}`);

    const resourceUri = toolUiResourceUri(tool);
    if (!resourceUri) {
      throw new Error(`${config.toolName} does not advertise an MCP App`);
    }
    const toolArguments = buildOpeningArguments(kind, input);
    const [rawToolResult, resourceResult] = await Promise.all([
      client.callTool({ name: config.toolName, arguments: toolArguments }),
      client.readResource({ uri: resourceUri }),
    ]);
    const toolResult = rawToolResult as CallToolResult;
    if (toolResult.isError) {
      const message = toolResult.content?.find((item) => item.type === "text");
      throw new Error(
        message && "text" in message
          ? message.text
          : `${config.toolName} failed`,
      );
    }

    const resource =
      resourceResult.contents.find((item) => item.uri === resourceUri) ??
      resourceResult.contents[0];
    const appHtml =
      resource && "text" in resource && typeof resource.text === "string"
        ? resource.text
        : resource && "blob" in resource && typeof resource.blob === "string"
          ? Buffer.from(resource.blob, "base64").toString("utf8")
          : "";
    if (!appHtml) throw new Error(`MCP App resource is empty: ${resourceUri}`);

    return {
      appHtml,
      config,
      kind,
      resourceUri,
      tool,
      toolArguments,
      toolResult: toolResult as CallToolResult,
    };
  }

  public async close(): Promise<void> {
    const connection = await this.connectionPromise?.catch(() => undefined);
    this.connectionPromise = undefined;
    await connection?.client.close().catch(() => {});
  }
}

class CompanionViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private hostReady = false;
  private prepared: PreparedApp | undefined;

  public constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly mcp: ZamMcpHost,
    private readonly output: vscode.OutputChannel,
  ) {}

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    this.hostReady = false;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.renderHostHtml(view.webview);
    view.webview.onDidReceiveMessage((message: unknown) => {
      void this.handleMessage(message as HostMessage);
    });
    view.onDidDispose(() => {
      this.view = undefined;
      this.hostReady = false;
    });
  }

  public async open(
    kind: CompanionApp,
    input: Record<string, string> = {},
  ): Promise<void> {
    await vscode.commands.executeCommand(
      `workbench.view.extension.${VIEW_CONTAINER_ID}`,
    );
    this.view?.show(true);
    this.setEmpty(`${COMPANION_APPS[kind].title} wird geladen …`);
    try {
      this.prepared = await this.mcp.prepare(kind, input);
      // Patch the routable vscode-lm route's displayIdentity with the real
      // provider/model before this ever reaches the webview (finding 2) —
      // the server-side builder can only emit the generic "VS Code language
      // models" label since it runs as a Node CLI process, never as the
      // extension host that can call vscode.lm.
      await enrichCallToolResultForVscodeLm(
        this.prepared.toolResult,
        vscodeLmAdapter,
      );
      this.sendBootstrap();
      this.output.appendLine(
        `[${new Date().toISOString()}] opened ${kind} via ${this.prepared.resourceUri}`,
      );
    } catch (error) {
      const message = errorMessage(error);
      this.setEmpty(`ZAM konnte nicht geöffnet werden: ${message}`);
      this.output.appendLine(
        `[${new Date().toISOString()}] failed to open ${kind}: ${message}`,
      );
      void vscode.window.showErrorMessage(`ZAM Companion: ${message}`);
    }
  }

  /**
   * Re-open the currently mounted app with its original arguments so the
   * webview receives a fresh, re-enriched tool result. Used after
   * "ZAM: Choose Recall Model": the pick persists immediately, but a mounted
   * Agent pill kept showing the previous model until the next open (live
   * 0.11.0 finding) — the pill must never lag behind the model that will
   * actually evaluate the next answer. No-op when nothing is mounted.
   */
  public async refreshCurrentApp(): Promise<void> {
    if (!this.prepared) return;
    await this.open(this.prepared.kind, this.prepared.toolArguments);
  }

  private async handleMessage(message: HostMessage): Promise<void> {
    if (message.type === "ready") {
      this.hostReady = true;
      this.output.appendLine(
        `[${new Date().toISOString()}] webview host ready`,
      );
      if (this.prepared) this.sendBootstrap();
      else this.setEmpty(DEFAULT_EMPTY_MESSAGE);
      return;
    }

    const id = typeof message.id === "number" ? message.id : undefined;
    if (id === undefined) return;
    try {
      let result: unknown = {};
      if (message.type === "callTool") {
        result = await this.callTool(message.payload);
      } else if (message.type === "sampling") {
        result = await this.sample(message.payload);
      } else if (message.type === "openLink") {
        result = await this.openLink(message.payload);
      } else if (message.type === "modelContext") {
        result = {};
      } else if (message.type === "status") {
        this.output.appendLine(
          `[${new Date().toISOString()}] webview ${JSON.stringify(message.payload)}`,
        );
      } else {
        throw new Error(
          `Unknown ZAM Companion message: ${String(message.type)}`,
        );
      }
      await this.view?.webview.postMessage({ type: "response", id, result });
    } catch (error) {
      await this.view?.webview.postMessage({
        type: "response",
        id,
        error: errorMessage(error),
      });
    }
  }

  private async callTool(payload: unknown): Promise<CallToolResult> {
    if (!this.prepared || !payload || typeof payload !== "object") {
      throw new Error("No active ZAM MCP App");
    }
    const value = payload as { name?: unknown; arguments?: unknown };
    if (
      typeof value.name !== "string" ||
      !this.prepared.config.allowedTools.has(value.name)
    ) {
      throw new Error(
        `Tool is not allowed for ${this.prepared.kind}: ${String(value.name)}`,
      );
    }
    const args =
      value.arguments &&
      typeof value.arguments === "object" &&
      !Array.isArray(value.arguments)
        ? (value.arguments as Record<string, unknown>)
        : {};
    const result = (await (
      await this.mcp.client()
    ).callTool({ name: value.name, arguments: args })) as CallToolResult;
    // Every forwarded tool result may carry a companionContext (e.g.
    // zam_companion_context's read/write result) — enrich its vscode-lm
    // route the same way an opening tool's result is enriched in open().
    await enrichCallToolResultForVscodeLm(result, vscodeLmAdapter);
    return result;
  }

  /**
   * Route a sampling request through the selected evaluator adapter (ADR
   * 2026-07-16 §Decision 5, 0.11.0 Phase 3). The Agent pill is the single
   * source of truth for which evaluator should receive this request
   * (review finding 1): the Recall panel only ever sends a "sampling"
   * message when it decided to use smart mode (quick mode skips sampling
   * entirely — see `desktop/src/panel/recall.ts`), but this still reads the
   * persisted selection itself rather than trusting the panel alone —
   * `assertSamplingRoutableToVscodeLm` throws `EvaluatorUnavailableError`
   * with an honest reason if the selection names quick-mode or a detached
   * harness instead of `vscode-lm`. If `vscode-lm` itself is unavailable (no
   * model chosen or discovered, or the persisted choice disappeared),
   * `evaluateAnswer` throws the same error type. Either way this never
   * silently falls back to a different route — the caller (`handleMessage`)
   * turns the error into an honest message surfaced back to the panel.
   */
  private async sample(payload: unknown): Promise<unknown> {
    const request = normalizeSamplingRequest(payload);
    const isAntigravity =
      vscode.env?.appName?.toLowerCase().includes("antigravity") ?? false;
    const activeEvaluatorId = isAntigravity
      ? (getCompanionSelectedAntigravityEvaluatorId() ??
        getCompanionSelectedEvaluatorId())
      : (getCompanionSelectedVscodeEvaluatorId() ??
        getCompanionSelectedEvaluatorId());
    assertSamplingRoutableToVscodeLm(activeEvaluatorId);

    if (activeEvaluatorId === "zam-text-model") {
      try {
        const client = await this.mcp.client();
        const result = (await client.callTool({
          name: "zam_companion_sample",
          arguments: { messages: request.messages },
        })) as CallToolResult;

        if (result.isError) {
          throw new Error(
            result.content?.find(
              (item) => item.type === "text" && "text" in item,
            )?.text ?? "ZAM text model sampling failed",
          );
        }

        const responseJson = JSON.parse(
          result.content?.find((item) => item.type === "text" && "text" in item)
            ?.text ?? "{}",
        );
        return createSamplingResult(responseJson.model, responseJson.text);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new EvaluatorUnavailableError(
          "zam-text-model",
          `ZAM text model sampling failed: ${errMsg}`,
        );
      }
    }

    const availability = await vscodeLmAdapter.availability();
    if (!availability.available) {
      try {
        const client = await this.mcp.client();
        const result = (await client.callTool({
          name: "zam_companion_sample",
          arguments: { messages: request.messages },
        })) as CallToolResult;

        if (result.isError) {
          throw new Error(
            result.content?.find(
              (item) => item.type === "text" && "text" in item,
            )?.text ?? "Fallback LLM sampling failed",
          );
        }

        const responseJson = JSON.parse(
          result.content?.find((item) => item.type === "text" && "text" in item)
            ?.text ?? "{}",
        );
        return createSamplingResult(responseJson.model, responseJson.text);
      } catch (fallbackError) {
        const errMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        throw new EvaluatorUnavailableError(
          "vscode-lm",
          `VS Code language models are unavailable: ${availability.reason}. Fallback ZAM LLM also failed: ${errMsg}`,
        );
      }
    }

    const result = await vscodeLmAdapter.evaluateAnswer(request);
    return createSamplingResult(result.model, result.text);
  }

  private async openLink(payload: unknown): Promise<Record<string, unknown>> {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid link request");
    }
    const url = (payload as { url?: unknown }).url;
    if (typeof url !== "string") throw new Error("Invalid link URL");
    const uri = vscode.Uri.parse(url, true);
    if (uri.scheme !== "https" && uri.scheme !== "http") {
      throw new Error(`Blocked link scheme: ${uri.scheme}`);
    }
    const opened = await vscode.env.openExternal(uri);
    return opened ? {} : { isError: true };
  }

  private sendBootstrap(): void {
    if (!this.hostReady || !this.prepared || !this.view) return;
    this.output.appendLine(
      `[${new Date().toISOString()}] sending ${this.prepared.kind} bootstrap`,
    );
    void this.view.webview.postMessage({
      type: "bootstrap",
      payload: {
        appHtml: this.prepared.appHtml,
        title: this.prepared.config.title,
        tool: this.prepared.tool,
        toolArguments: this.prepared.toolArguments,
        toolResult: this.prepared.toolResult,
      },
    });
  }

  private setEmpty(message: string): void {
    if (!this.hostReady || !this.view) return;
    void this.view.webview.postMessage({ type: "empty", message });
  }

  private renderHostHtml(webview: vscode.Webview): string {
    const hostBundle = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "host.bundle.js"),
    );
    // Blob documents inherit the creator's CSP in Electron. The MCP App is a
    // self-contained HTML resource with an inline module bundle, so the outer
    // policy must allow inline script execution inside the sandboxed iframe.
    // The VS Code host itself still loads only the extension-owned script URI.
    return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'unsafe-inline' blob:; style-src 'unsafe-inline'; frame-src blob:; img-src data: blob:;" />
    <title>ZAM Companion</title>
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; }
      body {
        overflow: hidden;
        color: var(--vscode-foreground);
        background: var(--vscode-panel-background, var(--vscode-sideBar-background));
        font-family: var(--vscode-font-family, system-ui, sans-serif);
      }
      #status {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        line-height: 1.45;
      }
      #app { width: 100%; height: 100%; border: 0; background: transparent; }
      body.ready #status { display: none; }
    </style>
  </head>
  <body>
    <div id="status" role="status">${DEFAULT_EMPTY_MESSAGE}</div>
    <iframe id="app" title="ZAM Companion" sandbox="allow-scripts allow-forms"></iframe>
    <script type="module" src="${hostBundle}"></script>
  </body>
</html>`;
  }
}

async function writeHostRegistration(
  registrationPath: string,
  intentPath: string,
): Promise<void> {
  const tempPath = join(
    dirname(registrationPath),
    `.vscode-host-${process.pid}.tmp`,
  );
  await mkdir(dirname(registrationPath), { recursive: true });
  await writeFile(
    tempPath,
    `${JSON.stringify(
      {
        version: 1,
        intentPath,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await rename(tempPath, registrationPath);
}

let activeMcpHost: ZamMcpHost | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const zamDir = join(homedir(), ".zam");
  const intentPath =
    process.env.ZAM_UI_INTENT_PATH ?? join(zamDir, "ui-intent.json");
  const registrationPath = join(zamDir, "vscode-host.json");
  const launchConfigPath = join(zamDir, "vscode-launch.json");
  const output = vscode.window.createOutputChannel("ZAM Companion", {
    log: true,
  });
  const mcp = new ZamMcpHost(launchConfigPath, output);
  activeMcpHost = mcp;
  const provider = new CompanionViewProvider(context.extensionUri, mcp, output);

  context.subscriptions.push(
    output,
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider),
    vscode.commands.registerCommand("zam.openRecall", () =>
      provider.open("recall"),
    ),
    vscode.commands.registerCommand("zam.showGraph", () =>
      provider.open("graph"),
    ),
    vscode.commands.registerCommand("zam.openSettings", () =>
      provider.open("settings"),
    ),
    vscode.commands.registerCommand("zam.chooseRecallModel", async () => {
      const picked = await runChooseRecallModel(
        {
          listModels: () => vscode.lm.selectChatModels({}),
          showQuickPick: (items) =>
            vscode.window.showQuickPick(items, {
              title: CHOOSE_RECALL_MODEL_COMMAND_TITLE,
              placeHolder:
                "Select the VS Code language model ZAM Recall should use",
            }),
          showInformationMessage: (message) =>
            void vscode.window.showInformationMessage(message),
          showWarningMessage: (message) =>
            void vscode.window.showWarningMessage(message),
        },
        vscodeModelSelection,
      );
      // A mounted Agent pill must reflect the new choice immediately.
      if (picked) await provider.refreshCurrentApp();
    }),
  );

  let lastIntentId: string | undefined;
  const consumeIntent = async () => {
    if (!vscode.window.state.focused) return;
    try {
      const intent = parseCompanionIntent(
        JSON.parse(await readFile(intentPath, "utf8")),
      );
      if (!intent || intent.id === lastIntentId) return;
      lastIntentId = intent.id;
      await provider.open(intent.app, intent.input);
    } catch {
      // The handoff file is optional and may not exist before the first call.
    }
  };
  const watchListener = () => void consumeIntent();
  watchFile(intentPath, { interval: 300 }, watchListener);
  context.subscriptions.push({
    dispose: () => unwatchFile(intentPath, watchListener),
  });

  const heartbeat = () => {
    if (!vscode.window.state.focused) return;
    void writeHostRegistration(registrationPath, intentPath).catch((error) => {
      output.warn(
        `Could not publish VS Code host registration: ${errorMessage(error)}`,
      );
    });
  };
  heartbeat();
  const heartbeatTimer = setInterval(heartbeat, 5_000);
  context.subscriptions.push(
    { dispose: () => clearInterval(heartbeatTimer) },
    vscode.window.onDidChangeWindowState((state) => {
      if (state.focused) {
        heartbeat();
        void consumeIntent();
      }
    }),
  );
}

export async function deactivate(): Promise<void> {
  await activeMcpHost?.close();
  activeMcpHost = undefined;
}
