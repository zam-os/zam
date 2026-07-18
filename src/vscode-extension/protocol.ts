import type {
  CreateMessageResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

export type CompanionApp = "recall" | "graph" | "settings" | "okf";

export interface CompanionIntent {
  version: 1;
  id: string;
  app: CompanionApp;
  input: Record<string, string>;
  createdAt: string;
}

export interface CompanionAppConfig {
  title: string;
  toolName: string;
  allowedTools: ReadonlySet<string>;
}

export interface CompanionLanguageModelMessage {
  role: "user" | "assistant";
  text: string;
}

export interface NormalizedSamplingRequest {
  messages: CompanionLanguageModelMessage[];
  maxTokens?: number;
}

// `zam_companion_context` (0.11.0 Phase 4) is allowlisted for every proxied
// app below so the shared context bar (desktop/src/panel/context-bar.ts) can
// read/write it from inside the VS Code Companion webview, which otherwise
// only proxies each app's own data tools (see CompanionViewProvider.callTool
// in extension.ts). Studio has no entry here — the VS Code Companion never
// opens it through this webview proxy (extension.ts has no `studio` case) —
// so its reachability there is moot; native MCP-Apps hosts reach it directly
// through the tool's own `ui: { visibility: ["app"] }` metadata instead.
export const COMPANION_APPS: Record<CompanionApp, CompanionAppConfig> = {
  recall: {
    title: "ZAM Recall",
    toolName: "zam_open_recall",
    allowedTools: new Set([
      "zam_get_reviews",
      "zam_submit_review",
      "zam_companion_context",
    ]),
  },
  graph: {
    title: "ZAM Graph",
    toolName: "zam_show_graph",
    allowedTools: new Set(["zam_studio_bridge", "zam_companion_context"]),
  },
  okf: {
    title: "ZAM Knowledge Base",
    toolName: "zam_okf_visualize",
    allowedTools: new Set([
      "zam_okf_catalog",
      "zam_okf_read",
      "zam_okf_read_citation",
      "zam_okf_focus",
      "zam_companion_context",
    ]),
  },
  settings: {
    title: "ZAM Settings",
    toolName: "zam_open_settings",
    allowedTools: new Set(["zam_studio_bridge", "zam_companion_context"]),
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samplingContentText(value: unknown): string {
  const blocks = Array.isArray(value) ? value : [value];
  return blocks
    .flatMap((block) =>
      isRecord(block) && block.type === "text" && typeof block.text === "string"
        ? [block.text]
        : [],
    )
    .join("\n")
    .trim();
}

/** Validate the text-only sampling subset supported by the Companion host. */
export function normalizeSamplingRequest(
  value: unknown,
): NormalizedSamplingRequest {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    throw new Error("Invalid MCP sampling request");
  }
  if (Array.isArray(value.tools) && value.tools.length > 0) {
    throw new Error("ZAM Companion sampling does not support model tools");
  }

  const messages: CompanionLanguageModelMessage[] = [];
  if (typeof value.systemPrompt === "string" && value.systemPrompt.trim()) {
    messages.push({ role: "user", text: value.systemPrompt.trim() });
  }
  for (const raw of value.messages) {
    if (!isRecord(raw) || (raw.role !== "user" && raw.role !== "assistant")) {
      throw new Error("Invalid MCP sampling message");
    }
    const text = samplingContentText(raw.content);
    if (!text) {
      throw new Error("ZAM Companion sampling currently requires text content");
    }
    messages.push({ role: raw.role, text });
  }
  if (messages.length === 0) {
    throw new Error("MCP sampling request has no messages");
  }

  const maxTokens =
    typeof value.maxTokens === "number" && value.maxTokens > 0
      ? value.maxTokens
      : undefined;
  return maxTokens === undefined ? { messages } : { messages, maxTokens };
}

export function createSamplingResult(
  model: string,
  text: string,
): CreateMessageResult {
  return {
    model,
    role: "assistant",
    content: { type: "text", text },
    stopReason: "endTurn",
  };
}

export function parseCompanionIntent(
  value: unknown,
  now: number = Date.now(),
  maxAgeMs = 30_000,
): CompanionIntent | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  if (
    typeof value.id !== "string" ||
    typeof value.app !== "string" ||
    !(value.app in COMPANION_APPS)
  ) {
    return undefined;
  }
  if (typeof value.createdAt !== "string" || !isRecord(value.input)) {
    return undefined;
  }
  const createdAt = Date.parse(value.createdAt);
  if (
    !Number.isFinite(createdAt) ||
    createdAt > now + 5_000 ||
    now - createdAt > maxAgeMs
  ) {
    return undefined;
  }
  const input = Object.fromEntries(
    Object.entries(value.input).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  return {
    version: 1,
    id: value.id,
    app: value.app as CompanionApp,
    input,
    createdAt: value.createdAt,
  };
}

export function buildOpeningArguments(
  app: CompanionApp,
  input: Record<string, string>,
): Record<string, string> {
  // `okf` deliberately omits `user`: `zam_okf_visualize` is repo-scoped and
  // its input schema has no user parameter (unlike the learner-scoped apps).
  const allowed =
    app === "recall"
      ? ["user", "domain"]
      : app === "graph"
        ? ["user", "focus"]
        : app === "okf"
          ? ["bundle_dir"]
          : ["user"];
  return Object.fromEntries(
    allowed.flatMap((key) =>
      typeof input[key] === "string" ? [[key, input[key]]] : [],
    ),
  );
}

export function toolUiResourceUri(tool: Tool): string | undefined {
  const meta = tool._meta as
    | {
        ui?: { resourceUri?: unknown };
        "ui/resourceUri"?: unknown;
      }
    | undefined;
  const nested = meta?.ui?.resourceUri;
  const legacy = meta?.["ui/resourceUri"];
  return typeof nested === "string"
    ? nested
    : typeof legacy === "string"
      ? legacy
      : undefined;
}
